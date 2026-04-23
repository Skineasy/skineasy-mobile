# Routine — end-to-end spec & status

> Single source of truth for the routine feature (questionnaire → generation → display).
> Replaces: `routine-migration.md`, `routine-resolution-flow.md`, `PRODUCT_TYPE_CONTENT.md`,
> `ROUTINE_BACKEND_DOC.md`, `ROUTINE_IMPLEMENTATION.md`, `ROUTINE_PAGE_SPEC.md`,
> `tasks/typeform-unavailable-status.md`, `Skin Easy/docs/v1-routine-plan.md`.

---

## 1. Status

### ✅ Done

- **DB**: `skincare_products` (323 rows), `product_type_content` (79 rows, FR+EN
  backfilled), `routines`, `routine_products`, `routine_steps`,
  `questionnaire_responses` — all with RLS.
- **Storage**: `product-images` public bucket, 323 illustrations served.
- **Edge Functions deployed**:
  - `resolve-routine` — cascade to decide user state on login, attaches
    `product_type_content` to each product.
  - `generate-routine` — reads `questionnaire_responses`, analyzes skin, picks
    products, persists `routines` + `routine_products`.
- **Mobile**:
  - Adapter consumes the `resolve-routine` payload, picks FR/EN content based
    on `i18n.language`.
  - `ProductDetailSheet` renders `How to use` + `Application` + `Frequency` by
    default; for `serum` it swaps `How to use` for `Key ingredient` +
    `Irritation potential`.

### 🟡 Decision just taken (in progress)

- **Questionnaire moves from Typeform to a React Native Web form shown inline
  in the mobile app.**
  - During the migration, Typeform stays available as a fallback for users who
    already submitted via the website.
  - Once the native form is live, Typeform is drop-only: `resolve-routine`
    still pulls historical responses by email but new submissions go through
    the native form → `submit-questionnaire` Edge Function.

### ❌ Not done

- `routine_steps` table exists with RLS but is never written. The weekly
  schedule is synthesized client-side in
  `src/features/routine/data/resolved-to-dto.adapter.ts` (`buildWeeklySchedule`).
  → Either populate it in `generate-routine` or officially retire the table.
- `submit-questionnaire` Edge Function — to build, called by the new native
  form.
- `stripe-webhook` Edge Function — spec'd in supabase-migration (set
  `clients.has_routine_access = true` on payment) but never built. Today
  `resolve-routine.grantRoutineAccess` flips the flag as a shortcut whenever a
  response is linked.
- Backoffice (Nuxt) hooks for product catalog + manual routine regeneration +
  manual `has_routine_access` toggle.
- `useRoutineByRspid` / `RoutineWebContent` — dead code, always throws. Delete
  once decision is made on the `rspid` public page (probably never coming
  back).
- Typeform outage UX: `resolve-routine` returns `typeform_unavailable`; mobile
  must show a clear "retry" state distinct from `needs_form`.

---

## 2. Database schema

> All tables live in `public`. Timestamps UTC. IDs are `uuid gen_random_uuid()`
> unless noted.

### 2.1 `skincare_products`

Product catalog for the selection algorithm.

| Column                                                                                                                       | Type            | Notes                               |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------- |
| `id`                                                                                                                         | `uuid PK`       |                                     |
| `name`                                                                                                                       | `text NOT NULL` |                                     |
| `brand`                                                                                                                      | `text NOT NULL` |                                     |
| `price`                                                                                                                      | `numeric(10,2)` |                                     |
| `url`                                                                                                                        | `text`          | Retailer URL                        |
| `illustration`                                                                                                               | `text`          | Filename in `product-images` bucket |
| `type`                                                                                                                       | `text`          | Joins `product_type_content.name`   |
| `skinstate`                                                                                                                  | `text`          | Filter                              |
| `active`                                                                                                                     | `boolean`       | Default `true`                      |
| `inci`, `actifs`, `contenance`, `origin`, `engagement`, `feature`, `skin`, `website`, `fonction`, `carnation`, `application` | `text`          | Free-form selection/ranking inputs  |

Indexes on `type`, `skinstate`, `active`.

### 2.2 `product_type_content`

Per-category educational content (FR + EN). Joined by `name === skincare_products.type`.

FR columns: `title`, `subtitle`, `description`, `how_to_use`, `application`,
`frequency`, `badge`, `key_ingredient`, `irritation_potential`. Same fields
suffixed `_en` for English. `name` is `UNIQUE`.

When both FR and EN are filled, the adapter picks according to locale; empty
EN was backfilled with FR to avoid mixed-language sheets.

### 2.3 `questionnaire_responses`

Single source of truth for all form submissions regardless of source.

| Column           | Type                | Notes                                 |
| ---------------- | ------------------- | ------------------------------------- |
| `id`             | `uuid PK`           |                                       |
| `external_id`    | `text UNIQUE`       | Typeform token, `NULL` for native     |
| `source`         | `text NOT NULL`     | `'typeform'` \| `'mobile'` \| `'web'` |
| `user_id`        | `uuid → auth.users` | NULL until linked                     |
| `email`          | `text NOT NULL`     |                                       |
| `answers`        | `jsonb NOT NULL`    | Normalized `QuestionnaireAnswers`     |
| `schema_version` | `text NOT NULL`     | Default `'v1'`                        |
| `submitted_at`   | `timestamptz`       |                                       |

Indexes on `user_id`, `email`, `external_id`. Writes via service_role only.

### 2.4 `routines`

One row per user per generation. Latest active is the one shown.

| Column                      | Type                                  | Notes              |
| --------------------------- | ------------------------------------- | ------------------ |
| `id`                        | `uuid PK`                             |                    |
| `user_id`                   | `uuid → auth.users`                   |                    |
| `email`                     | `text`                                |                    |
| `questionnaire_response_id` | `uuid → questionnaire_responses`      | Source of truth    |
| `algorithm_version`         | `text NOT NULL`                       | Default `'v1'`     |
| `skin_type`                 | `text NOT NULL`                       |                    |
| `analysis`                  | `jsonb NOT NULL`                      | See §2.7           |
| `brand_cohesion_applied`    | `boolean`                             | Default `false`    |
| `status`                    | `text CHECK IN ('active','archived')` | Default `'active'` |
| `created_at`, `updated_at`  | `timestamptz`                         |                    |

Previously-active routine is archived on regeneration (see
`persist/storage.ts`).

### 2.5 `routine_products`

Junction: products picked per category.

| Column                            | Type                                | Notes                    |
| --------------------------------- | ----------------------------------- | ------------------------ |
| `id`                              | `uuid PK`                           |                          |
| `routine_id`                      | `uuid → routines ON DELETE CASCADE` |                          |
| `product_id`                      | `uuid → skincare_products`          |                          |
| `category`                        | `text`                              | See §6                   |
| `priority`                        | `smallint`                          | Ordering within category |
| `UNIQUE (routine_id, product_id)` |                                     |                          |

### 2.6 `routine_steps` (**not used today**)

Spec'd for a server-side weekly plan. Table + RLS exist but
`generate-routine` never inserts rows. Mobile synthesizes the week in the
adapter. Either populate or drop.

### 2.7 `analysis` jsonb shape

```jsonc
{
  "skinType": { "primaryType": "mixte_normale_grasse", "label": "...", "confidence": 0.85 },
  "skinStates": { "states": ["sensible", "deshydratee"], "labels": ["Sensible", "Déshydratée"] },
  "healthConditions": { "conditions": [], "hasRestrictions": false, "isPregnancySafe": true },
}
```

Everything else (total price, product count, usage per category) is computed
in the mobile adapter.

---

## 3. RLS summary

| Table                     | anon | authenticated (mobile) | employees (backoffice) | service_role |
| ------------------------- | ---- | ---------------------- | ---------------------- | ------------ |
| `skincare_products`       | —    | `SELECT`               | `ALL`                  | `ALL`        |
| `product_type_content`    | —    | `SELECT`               | `ALL`                  | `ALL`        |
| `questionnaire_responses` | —    | `SELECT own`           | `SELECT ALL`           | `ALL`        |
| `routines`                | —    | `SELECT own`           | `SELECT/UPDATE ALL`    | `ALL`        |
| `routine_products`        | —    | `SELECT via routine`   | `ALL`                  | `ALL`        |
| `routine_steps`           | —    | `SELECT via routine`   | `ALL`                  | `ALL`        |

Edge Functions always use the service role key and extract the user from the
JWT themselves.

---

## 4. Resolution flow (login → routine)

Fired once per login / signup — not on routine-tab open. Result is stored in
the Zustand user store so every screen (dashboard, routine, profile) reacts
without re-fetching.

```
resolve-routine
├─ existing active routine? ───────► { status: 'ready', routine }
│
├─ questionnaire_responses by user_id or orphan match on email?
│    └─ invoke generate-routine ───► { status: 'ready', routine }
│
├─ Typeform API GET /forms/:id/responses?query=<email>
│    ├─ found → INSERT questionnaire_responses → generate-routine
│    │                                   └─► { status: 'ready', routine }
│    ├─ not found → access gate:
│    │                ├─ has_routine_access=true → { status: 'needs_form' }
│    │                └─ has_routine_access=false → { status: 'needs_purchase' }
│    └─ unavailable (network/5xx) → { status: 'typeform_unavailable' }
```

### Response contract

```ts
type ResolveRoutineResult =
  | { status: 'ready'; routine: ResolvedRoutine }
  | { status: 'routine_generation_failed'; questionnaire_response_id: string }
  | { status: 'needs_form' }
  | { status: 'needs_purchase' }
  | { status: 'typeform_unavailable' };
```

Mobile UI mapping:

| Status                      | UI                                                    |
| --------------------------- | ----------------------------------------------------- |
| `ready`                     | Routine tab shows the routine                         |
| `needs_form`                | CTA → open the native React Native Web form (see §5)  |
| `needs_purchase`            | CTA → link to product purchase page                   |
| `routine_generation_failed` | Error screen with retry button                        |
| `typeform_unavailable`      | Error toast + retry, never confused with `needs_form` |

Errors mapped via `src/lib/error-mapper.ts` to i18n keys.

---

## 5. Questionnaire (migration to native RN Web form)

### 5.1 Decision

The skin questionnaire moves from Typeform to a React Native Web form
rendered inline in the mobile app.

- **Why**: control over UX (branching, translations, retry, offline), no
  Typeform API rate limits, no "fill the form on the web, come back later"
  round-trip.
- **Where**: same component runs on iOS, Android, and the web (Vercel /
  Prestashop embed) via React Native Web.

### 5.2 Shared type: `QuestionnaireAnswers`

Defined once in `skineasy-supabase/supabase/functions/_shared/questionnaire.types.ts`.
Both the Typeform adapter (legacy) and the native form produce this exact
shape. Bump `questionnaire_responses.schema_version` when the shape changes.

```ts
export interface QuestionnaireAnswers {
  email: string;
  age: number;
  gender?: 'female' | 'male' | 'other';
  skinFeelsOily?: 'never' | 'sometimes' | 'often' | 'always';
  skinFeelsDry?: 'never' | 'sometimes' | 'often' | 'always';
  concerns: SkinStateType[];
  hasSensitivity: boolean;
  isPregnant: boolean;
  medicalConditions: string[];
  // ... finalize from current Typeform question set
}
```

### 5.3 Flow (new native form)

```
Mobile (RN / RN Web) form
  └─► submit-questionnaire Edge Function (to build)
        ├─ INSERT questionnaire_responses (source='mobile' or 'web')
        └─ invoke generate-routine
              └─► routine persisted, resolve-routine returns it on next call
```

### 5.4 Flow (legacy Typeform path)

Kept during the transition:

- Users who previously submitted on the website are resolved by
  `resolve-routine` step 3 (Typeform Responses API lookup by email).
- Once the native form ships, the Typeform form can be deactivated; the
  lookup step remains only as long as we have users who never revisit the
  app.
- No webhook. `typeform-webhook` Edge Function is **not deployed** and will
  not be built. The `resolve-routine` pull model replaces it.

### 5.5 Build checklist

- [ ] Define final `QuestionnaireAnswers` shape in `_shared/questionnaire.types.ts`.
- [ ] Build `submit-questionnaire` Edge Function (auth'd, inserts response,
      invokes `generate-routine`).
- [ ] Build the RN form feature in `src/features/questionnaire/` (branching,
      progress indicator, i18n, zod schema).
- [ ] RN Web entry point (Vercel project or Prestashop iframe).
- [ ] Route `needs_form` from `resolve-routine` to the new form instead of
      the Typeform link.
- [ ] Archive the Typeform flow once traffic moves.

---

## 6. Mobile data flow

### 6.1 Reference data (fetched once, cached 24h)

`skincare_products` + `product_type_content` are reference tables (~400 rows
total). Fetch via TanStack Query at app launch, `staleTime: 24h`.

### 6.2 Routine query

`resolve-routine` returns a single joined payload:

```
routines → routine_products → product (skincare_products)
                                        → type_content (product_type_content)
```

One network call per login. Subsequent screens read from the cached payload.

### 6.3 Adapter (`resolved-to-dto.adapter.ts`)

- Picks FR or EN from `product_type_content` per `i18n.language`.
- Picks localized labels for skin type / skin states / health conditions /
  day names.
- Synthesizes a 7-day weekly schedule (since `routine_steps` is empty) with
  hardcoded priorities per category.
- Computes totals (price, product count) client-side.

### 6.4 Product detail sheet

Built from `TypeContentDto`. Layout depends on `ProductCategory`:

- **Default**: `Application`, `Frequency`, `How to use` (HTML).
- **Serum**: `Application`, `Frequency`, `Key ingredient`, `Irritation potential`.
- Empty fields are hidden.

Buy button links to `product.url`. Hide button adds the product id to the
local MMKV-backed `hiddenProductsStore`; the store is filtered downstream by
`useTodayRoutine`.

### 6.5 Product categories

```
demaquillant | nettoyant | tonique | exfoliant | serum | contour_yeux
creme_jour | creme_nuit | creme_solaire | masque | huile | brume
baume | gadgets | complements
```

### 6.6 Skin type / skin state enums

- **SkinType**: `tres_seche | seche | normale | mixte_normale_grasse |
mixte_seche_grasse | grasse | tres_grasse | generique`.
- **SkinState**: `sensible | tres_sensible | mature | atopique | deshydratee |
acneique | acne_hormonale`.

---

## 7. Edge Functions

| Function               | Status      | Purpose                                      |
| ---------------------- | ----------- | -------------------------------------------- |
| `resolve-routine`      | ✅ deployed | Login cascade — see §4                       |
| `generate-routine`     | ✅ deployed | Analyze + pick products + persist            |
| `submit-questionnaire` | ❌ to build | Called by the new native form (§5)           |
| `stripe-webhook`       | ❌ to build | Flip `clients.has_routine_access` on payment |
| `typeform-webhook`     | ❌ wont-do  | Replaced by the pull-based `resolve-routine` |

### 7.1 `generate-routine` current behavior

1. Load `questionnaire_responses` row by id.
2. Run skin analysis (`analyzers/`) → skin type, skin states, health conditions.
3. Filter + score candidate products (`select/`).
4. Archive previous active routine, insert new `routines` + `routine_products`.
5. (Does **not** insert `routine_steps` — known gap.)

Source: `skineasy-supabase/supabase/functions/generate-routine/`.

### 7.2 Resolve-routine environment

Required secrets:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto).
- `TYPEFORM_API_TOKEN`, `TYPEFORM_FORM_ID` — drop once native form is live
  and all historical users have been resolved.

---

## 8. TODO

1. **Build the native RN Web questionnaire** (§5.5 checklist).
2. **Populate `routine_steps`** in `generate-routine` OR officially drop the
   table and keep the client-side synthesis (document the choice).
3. **Build `stripe-webhook`** and stop granting access from
   `resolve-routine.grantRoutineAccess` once it's live.
4. **Delete dead code**: `useRoutineByRspid.ts`, `RoutineWebContent.tsx`
   (public `rspid` page is replaced by the in-app flow).
5. **Backoffice Nuxt integration**: product/content editing, manual routine
   regeneration, `has_routine_access` override.
6. **Decommission Typeform**: once native form ships and stable, remove the
   Typeform lookup step from `resolve-routine` and drop the env vars.

---

## 9. Decisions log

- **Questionnaire → native RN Web form** (current). Typeform kept as legacy
  fallback until native form proves out.
- **Pull, no webhook** — `resolve-routine` fetches Typeform on demand at
  login. No `typeform-webhook`, no polling cron, no backfill.
- **Email matching** — case-insensitive exact match between
  `auth.users.email` and the Typeform email answer. Aliases (`a+b@x.com`) are
  a tolerated gap.
- **Algorithm versioning** — `algorithm_version` recorded on each routine.
  Mobile never auto-regenerates; backoffice will expose a manual
  "regenerate" action.
- **Product images** — Supabase Storage bucket `product-images` (public).
  URL built as `${SUPABASE_URL}/storage/v1/object/public/product-images/${filename}`.
- **Product data entry** — Nuxt backoffice (not yet wired).
