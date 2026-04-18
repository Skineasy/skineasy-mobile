# Ralph Fix Plan

> **Current focus**: Mobile app migration from NestJS backend to Supabase.
>
> **Prerequisite** (DONE before Ralph runs): All database schema, RLS policies, storage buckets, and seed data are already applied to the Supabase project via MCP. Do NOT run SQL migrations -- they exist.
>
> Reference docs:
>
> - `docs/supabase-migration.md` -- schema reference (auth, journal, profile, storage, RLS)
> - `docs/routine-migration.md` -- routine/products (Phase 8, later)
>
> Supabase project ID: `lyhhipvipgbqsytfqwdw`
> Supabase URL: `https://lyhhipvipgbqsytfqwdw.supabase.co`
>
> Tables already created in Supabase: `clients` (extended), `sport_types`, `sleep_entries`, `sport_entries`, `meal_entries`, `stress_entries`, `observation_entries`, `diagnoses`, `push_tokens`, `app_config`
> Storage buckets already created: `avatars` (public), `meal-photos` (private)

---

## Architecture Convention (MANDATORY)

### Data layer structure

Every feature with server communication uses a `data/` folder with paired files:

```
src/features/<feature>/
├── data/
│   ├── <entity>.api.ts       # pure Supabase calls, no React
│   └── <entity>.queries.ts   # TanStack Query hooks + query keys
├── components/
├── hooks/                     # UI-only hooks (forms, gestures, local state)
├── screens/
├── schemas/
└── types/
```

### `.api.ts` rules

- Pure async functions -- no React, no hooks, no stores
- Import only: `@lib/supabase`, `@lib/error-mapper`, types
- Every function: catches Supabase error -> **throws a mapped, i18n-ready error** (never raw Supabase error)
- Return typed data, never raw response objects

### `.queries.ts` rules

- Imports only its paired `.api.ts`, TanStack Query, stores, and `@lib/error-mapper` if needed
- Exports `<entity>Keys` object for query key management
- Exports `use<Entity><Action>()` hooks wrapping `useQuery`/`useMutation`
- Mutations: invalidate the relevant `Keys.all` on success

### Components

- Import ONLY from `.queries.ts`, never directly from `.api.ts`
- Display errors via i18n keys returned by the query/mutation error (see Error Mapping below)

---

## Error Mapping (CRITICAL -- applies to ALL phases)

**Every user-facing error MUST be translated via i18n. Never display raw Supabase errors. Never hardcode error strings.**

### Flow

```
Supabase error -> mapSupabaseError() -> error with i18n key -> toast/UI via t(key)
```

### Supabase error codes to map

Known Supabase auth error codes to add to `src/lib/error-mapper.ts`:

| Supabase code / message         | i18n key                  |
| ------------------------------- | ------------------------- |
| `invalid_credentials`           | `auth.invalidCredentials` |
| `email_not_confirmed`           | `auth.emailNotConfirmed`  |
| `user_already_exists`           | `auth.emailAlreadyExists` |
| `weak_password`                 | `auth.weakPassword`       |
| `over_email_send_rate_limit`    | `auth.tooManyAttempts`    |
| `email_address_invalid`         | `auth.invalidEmail`       |
| `same_password`                 | `auth.samePassword`       |
| `session_expired` / 401         | `common.sessionExpired`   |
| `PGRST116` (no rows)            | `common.notFound`         |
| `PGRST301` (jwt expired)        | `common.sessionExpired`   |
| `23505` (unique violation)      | `common.duplicateEntry`   |
| `23503` (FK violation)          | `common.invalidReference` |
| `42501` (RLS denied)            | `common.permissionDenied` |
| `PGRST204` (column not found)   | `common.serverError`      |
| Network error / no connectivity | `common.networkError`     |
| Storage 413 (file too large)    | `storage.fileTooLarge`    |
| Storage 415 (unsupported type)  | `storage.unsupportedType` |
| Fallback                        | `common.error`            |

### Tasks (do in Phase 1, enforce in all subsequent phases)

- [x] Extend `src/lib/error-mapper.ts` with Supabase-specific error codes (see table above)
- [x] Add i18n keys to `src/i18n/locales/fr.json` and `src/i18n/locales/en.json` for every mapped code
- [x] Create `mapSupabaseError(error: unknown): Error` helper that returns an Error with `.message` = i18n key
- [x] Every `.api.ts` function must wrap its Supabase call: `if (error) throw mapSupabaseError(error)` (enforce in later phases)
- [x] Every component catching a query/mutation error must use `t(error.message)` (enforce in later phases)
- [x] Add a lint rule or review step: no string literals in `toast.error()` calls -- always i18n keys

### Example pattern

**`src/lib/error-mapper.ts`** (extended):

```ts
import type { PostgrestError, AuthError, StorageError } from '@supabase/supabase-js';

const SUPABASE_ERROR_MAP: Record<string, string> = {
  invalid_credentials: 'auth.invalidCredentials',
  email_not_confirmed: 'auth.emailNotConfirmed',
  user_already_exists: 'auth.emailAlreadyExists',
  weak_password: 'auth.weakPassword',
  // ... etc
  PGRST116: 'common.notFound',
  '23505': 'common.duplicateEntry',
  '42501': 'common.permissionDenied',
};

export function mapSupabaseError(error: unknown): Error {
  const code = extractSupabaseErrorCode(error);
  const i18nKey = SUPABASE_ERROR_MAP[code] ?? 'common.error';
  const mapped = new Error(i18nKey);
  (mapped as Error & { code: string }).code = code;
  return mapped;
}
```

**`.api.ts` usage**:

```ts
export async function fetchSleepByDate(userId: string, date: string): Promise<SleepEntry[]> {
  const { data, error } = await supabase
    .from('sleep_entries')
    .select()
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw mapSupabaseError(error);
  return data;
}
```

**Component usage**:

```ts
const { mutate, error } = useUpsertSleep();
// later...
if (error) toast.error(t(error.message));
```

## Phase 10 -- Demo: Native Questionnaire Preview (dev-only, parallel, non-blocking)

> Standalone demo for showing the client what an in-app questionnaire could look like. Does NOT interact with any backend. Fully fake completion.
>
> Can be worked on in parallel with any other phase. Independent of migration state.

### 10.1 Scope

- Dev-only entry point in Settings (hidden in production builds)
- 3 short questions, full-screen wizard (Option 1 from discussion)
- Playful visual style -- stronger than the rest of the app (bolder colors, bigger typography, more animation)
- No data persisted -- all state local, disposed on close
- Fake success animation at the end

### 10.2 Entry point

- [x] Add a new row in `src/app/profile` settings screen: label "Tester le nouveau questionnaire" with a "BETA" badge
- [x] Wrap the row in `if (__DEV__)` so it only shows on dev builds
- [x] On tap: navigate to a new route `/profile/questionnaire-demo` (modal or stack screen)

### 10.3 Wizard screen structure

- [x] Create `src/features/questionnaire-demo/screens/questionnaire-demo.screen.tsx`
- [x] Local state machine: current step (0 | 1 | 2 | 3 = complete), answers object
- [x] Top bar: close button (X) on left, segmented progress bar (3 segments) on right
- [x] Content area: animated question card (one at a time)
- [x] Bottom: "Suivant" CTA button (disabled until an answer is selected)
- [x] Back arrow (except on step 0) -- animates previous step back in

### 10.4 Questions (fake, demo purposes)

Define in `src/features/questionnaire-demo/constants.ts`:

1. **Type de peau ressenti** -- single-choice
   - Très sèche / Sèche / Normale / Mixte / Grasse (5 options, big emoji-accented cards)
2. **Tes préoccupations principales** -- multi-choice (pick up to 3)
   - Imperfections, Rides, Sensibilité, Taches, Points noirs, Éclat (icon + label cards)
3. **Ton âge** -- single-choice range
   - < 20 / 20-29 / 30-39 / 40-49 / 50+ (horizontal pill selector)

All labels via i18n keys under `questionnaireDemo.*`.

### 10.5 Animations (Reanimated 3)

- [x] **Step transition**: slide + fade. Current card animates `translateX: 0 -> -30, opacity: 1 -> 0`, new card `translateX: 30 -> 0, opacity: 0 -> 1`. Spring physics.
- [x] **Progress bar**: segments fill with a `withSpring` width animation on each step advance
- [x] **Answer selection**: tapped card scales up briefly (0.97 -> 1.0) with spring + haptic.light
- [x] **CTA button**: animates enabled state (opacity 0.4 -> 1.0) when answer is selected
- [x] **Completion screen**: confetti / sparkle burst (use `react-native-reanimated` particle animation or a simple ring of animated dots pulsing outward), big checkmark, "Merci !" heading, "Tu as l'air d'avoir une super peau ✨" subtitle, "Retour" CTA

### 10.6 Visual style (playful)

- [x] Use larger typography than the default h1/h2 -- go up one level for this flow
- [x] Use a brand accent color from `src/theme/colors.ts` for highlights (consult the theme, don't hardcode)
- [x] Rounded cards with subtle shadows (use existing `Card` component + bolder border on selected)
- [ ] Add emoji or inline SVG icons to each answer card for visual punch
- [ ] Background: subtle gradient or soft color wash (vs. the flat backgrounds elsewhere)
- [ ] Use `haptic.selection()` on answer pick, `haptic.success()` on completion

### 10.7 Component breakdown

- [ ] `src/features/questionnaire-demo/components/progress-bar.tsx` -- animated segmented bar
- [ ] `src/features/questionnaire-demo/components/question-card.tsx` -- wrapper with enter/exit animation
- [ ] `src/features/questionnaire-demo/components/answer-card.tsx` -- tappable card with icon/emoji, label, selected state
- [ ] `src/features/questionnaire-demo/components/completion-screen.tsx` -- success animation + CTA
- [ ] `src/features/questionnaire-demo/hooks/use-demo-state.ts` -- step + answers state machine

### 10.8 Fake completion

- [ ] On "Voir ma routine" tap at the end: play success animation 1.5s, then navigate back to profile
- [ ] No API call, no `questionnaire_responses` insert, no routine generation
- [ ] Toast: "Démo terminée" (dev-only message)

### 10.9 i18n + tests

- [ ] Add all strings to `src/i18n/locales/fr.json` and `en.json` under `questionnaireDemo.*`
- [ ] Unit test the state machine (step advance, answer validation, completion)
- [ ] No integration tests needed (fake flow)

### 10.10 Cleanup consideration

- This code is explicitly flagged dev-only. If the client approves the direction, it becomes the foundation for Phase 6.5 of `routine-migration.md` (native form real implementation).
- If the client rejects it, simply delete `src/features/questionnaire-demo/` and the settings row.

---


## Phase 9 -- Routine Migration (blocked, later)

> Blocked until `skincare_products`, `product_type_content`, `routines`, `routine_products`, `routine_steps` tables are created (separate MCP task) AND `generate-routine` Edge Function is deployed.
>
> See `docs/routine-migration.md` for full context.

### 8.1 Routine service rewrite (mobile only)

- [ ] Rewrite `src/features/routine/services/routine.service.ts`
  - `getLastRoutine()` -> `supabase.from('routines').select('*, routine_products(*), routine_steps(*)').eq('user_id', uid).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()`
  - Remove `getByRspid` (Typeform webhook flow, server-side only)

### 8.2 Catalog caching

- [ ] Create `src/features/routine/hooks/use-skincare-products.ts` (TanStack Query, 24h staleTime)
- [ ] Create `src/features/routine/hooks/use-product-type-content.ts` (TanStack Query, 24h staleTime)
- [ ] Build client-side resolver: `routine_products.product_id` -> full `SkincareProduct` via cached Map

### 8.3 Derived values

- [ ] Compute `totalPrice`, `productCount`, `productUsage`, `summary` client-side
- [ ] Remove any types referring to server-computed summary data

### 8.4 Types & tests

- [ ] Regenerate Supabase types after routine tables exist
- [ ] Align `src/features/routine/types/routine.types.ts`
- [ ] Update routine tests

---

