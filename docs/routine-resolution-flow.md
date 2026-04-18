# Routine Resolution Flow

> How the mobile app gets a routine for a user. Replaces webhook/polling thinking with on-demand resolution.

---

## What I understood

1. **Users fill a Typeform** on the website (or an emailed link) — sometimes days or weeks before ever opening the mobile app.
2. **Later, they sign up / log in** to the mobile app with the same email.
3. **On opening the Routine tab**, the app should figure out:
   - "Is there already a generated routine for me?" → show it
   - "Do we have their Typeform answers on file?" → generate the routine, then show it
   - "Does Typeform have a response under this email?" → pull it, generate, show
   - "Have they purchased the routine product?" (`clients.has_routine_access`) → gate shows "fill the form" (link already exists in the app)
   - "Otherwise" → show a purchase CTA

4. **No backfill of historical responses.** Each routine is generated **at the moment the user first opens the routine tab**. Since the algorithm evolves over time, earlier users get older algorithm versions and later users get improved ones — deliberate, not a bug. We don't pre-generate 8,580 routines with today's algorithm when the 500th version will be much better.

5. **No webhook, no polling cron.** There's no reason to push responses into our DB proactively — we only need them the moment a user asks for their routine.

6. **Email matching is good enough.** Case-insensitive match between `auth.users.email` and Typeform `email` answer. Aliases (`user+app@gmail.com`) are a known gap, tolerable. No manual "link my form" button for now.

---

## Architecture

### Single Edge Function: `resolve-routine`

- Called by the mobile app on routine tab open, when no active routine exists locally
- Authenticated with the user's Supabase JWT
- Returns one of four statuses

```
┌──────────────────────────────────────────────────────────────┐
│  resolve-routine Edge Function                                │
│  (auth required, reads auth.uid() and user email from JWT)    │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
1. SELECT * FROM routines WHERE user_id = :uid AND status = 'active'
   ├─ FOUND → return { status: 'ready', routine }
   │
   └─ NOT FOUND ─────────────────────────────────────────────────┐
                                                                  ▼
2. SELECT * FROM questionnaire_responses WHERE user_id = :uid
   OR (user_id IS NULL AND lower(email) = lower(:email))
   ├─ FOUND → run generate-routine → return { status: 'ready', routine }
   │          (also UPDATE questionnaire_responses SET user_id = :uid)
   │
   └─ NOT FOUND ─────────────────────────────────────────────────┐
                                                                  ▼
3. Typeform API: GET /forms/XOEB81yk/responses?query=<email>
   ├─ FOUND → INSERT into questionnaire_responses
   │          run generate-routine → return { status: 'ready', routine }
   │
   └─ NOT FOUND ─────────────────────────────────────────────────┐
                                                                  ▼
4. SELECT has_routine_access FROM clients WHERE user_id = :uid
   ├─ true  → return { status: 'needs_form' }    (user paid, must fill the form)
   └─ false → return { status: 'needs_purchase' } (user hasn't paid)
```

### Mobile UI mapping

| Edge Function response               | What the Routine tab shows                                                |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `{ status: 'ready', routine }`       | The routine                                                               |
| `{ status: 'needs_form' }`           | CTA → link to the existing Typeform URL                                   |
| `{ status: 'needs_purchase' }`       | CTA → link to product purchase page                                       |
| `{ status: 'typeform_unavailable' }` | Error toast + "Retry" button (Typeform API unreachable after 2-3 retries) |

Errors mapped via `mapSupabaseError` to i18n keys as per the main migration rules.

### Typeform API is hit **at most once per user, ever**

After step 3 succeeds, the response is in `questionnaire_responses` and the routine is in `routines`. All subsequent opens of the Routine tab hit step 1 and return instantly.

If the user never had a Typeform response and never purchases, the function never reaches step 3 on any subsequent open — it short-circuits at step 4 based on the cached `clients.has_routine_access` flag.

---

## Why this design

### No webhook

We don't need real-time ingestion. Users open the app days after submitting.

### No polling

We don't need to pre-populate `questionnaire_responses`. The only moment we actually care about a Typeform answer is when the user asks for their routine. Lazy fetch.

### No backfill

Generating 8,580 routines today locks those users into v1 of the algorithm. Generating on first open means each user gets the latest algorithm version available at that moment. Better product over time.

### Algorithm evolution is recorded

`routines.algorithm_version` stores the version used. When we ship a meaningfully-better algorithm, we can run a backoffice job to regenerate stale routines if we want to — but that's opt-in, not default.

---

## Decisions

- **Algorithm bumps**: manual only. The backoffice will expose a "regenerate" action to re-run the latest algorithm against existing `questionnaire_responses`. Mobile never auto-regenerates.
- **User email mismatch**: tolerated. If signup email differs from Typeform email, user sees `needs_form`. No "link my existing form" flow for now.
- **Typeform outage**: `resolve-routine` retries the Typeform API call 2–3 times with exponential backoff (e.g. 500ms, 1.5s, 4.5s) before giving up. If all retries fail, return a dedicated error status so the mobile can show a clear message (e.g. "Impossible de récupérer ton questionnaire pour le moment, réessaie dans quelques minutes") rather than falsely routing to `needs_form`.

### Error status for Typeform outage

Extend the response contract with a fourth status:

```ts
type ResolveRoutineResult =
  | { status: 'ready'; routine: Routine }
  | { status: 'needs_form' }
  | { status: 'needs_purchase' }
  | { status: 'typeform_unavailable' };
```

Mobile maps `typeform_unavailable` to an i18n error toast + "retry" button. This keeps the user out of the wrong branch (telling them to fill the form when the issue is on our side).

---

## What this replaces

- ✗ `typeform-webhook` Edge Function (deployed, will be deleted)
- ✗ Scheduled polling cron (never built)
- ✗ Backfill script (won't be built)

## What it requires

- ✓ `questionnaire_responses` table (exists)
- ✓ `routines` + `routine_products` + `routine_steps` tables (exist)
- ⏳ `resolve-routine` Edge Function (to build)
- ⏳ `generate-routine` Edge Function (to build — ports NestJS algorithm)
- ⏳ `TYPEFORM_API_TOKEN` + `TYPEFORM_FORM_ID` as Supabase secrets (to set)
- ⏳ Mobile integration: Routine tab calls `resolve-routine` on load, handles 3 status branches
