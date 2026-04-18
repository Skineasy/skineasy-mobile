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

## Phase 2 -- Foundations (cross-cutting concerns)

> These patterns are set up BEFORE migrating any feature, then reused everywhere.

### 2.1 TanStack Query client with global error handler

- [x] Create `src/lib/query-client.ts` that exports a configured `QueryClient` instance
- [x] Configure `QueryCache` + `MutationCache` with `onError` auto-toast handler:
  ```ts
  new QueryClient({
    queryCache: new QueryCache({ onError: (error) => toast.error(t(error.message)) }),
    mutationCache: new MutationCache({ onError: (error) => toast.error(t(error.message)) }),
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  });
  ```
- [x] Individual mutations/queries can opt out via their own `onError: () => {}` handler
- [x] Replace any existing QueryClient setup in `src/app/_layout.tsx`
- [x] Document in `CLAUDE.md`: mutations auto-toast errors by default

### 2.2 Toast + haptic auto-pairing

- [x] Update `src/lib/toast.ts` so `toast.success(...)` auto-triggers `haptic.success()`
- [x] Same for `toast.error(...)` -> `haptic.error()`
- [x] Keep a way to opt-out if needed (optional arg `{ haptic: false }`)
- [x] Remove any manual `haptic.success()` calls next to `toast.success()` in existing code (audit: `rg "haptic\.(success|error)" src/`)

### 2.3 UI primitives for async states

- [x] Create `src/shared/components/query-boundary.tsx`
  - Props: `{ query: UseQueryResult, children: (data) => ReactNode, emptyState?, loadingState?, errorState? }`
  - Shows loader on `isPending`, error+retry on `isError`, empty on `data.length === 0`, else renders children with data
- [x] Create `src/shared/components/error-state.tsx`
  - Props: `{ messageKey: string, onRetry?: () => void }`
  - Standard error UI (icon + translated message + optional retry button)
- [x] Create `src/shared/components/empty-state.tsx`
  - Props: `{ icon?, titleKey: string, descriptionKey?: string, actionKey?: string, onAction?: () => void }`
  - Standard empty UI
- [x] Create `src/shared/components/loading-state.tsx` (simple centered spinner with optional label)
- [x] Use these components in all screens migrated in later phases

### 2.4 Session restoration UX

- [x] Keep splash screen visible until `supabase.auth.getSession()` resolves on app start
- [x] Update `src/app/_layout.tsx` to:
  1. Import `SplashScreen` from `expo-splash-screen`, call `preventAutoHideAsync()` early
  2. Hydrate auth store with session from Supabase (sync with MMKV)
  3. Call `SplashScreen.hideAsync()` after session check + fonts loaded
- [x] Update `src/app/index.tsx` redirect logic: if session exists -> `/(tabs)`, else `/(auth)/login`
- [x] Handle auth state changes via `supabase.auth.onAuthStateChange` -> update auth store -> router auto-redirects on state change

### 2.5 Offline-first mutations (journal writes)

- [x] Configure `networkMode: 'offlineFirst'` globally or per-mutation for journal writes
- [x] Enable TanStack Query mutation persistence via `@tanstack/query-async-storage-persister` (adapter-based) backed by MMKV
  - Install `@tanstack/query-async-storage-persister` + `@tanstack/react-query-persist-client`
  - Create an MMKV-backed persister in `src/lib/query-persister.ts`
- [x] Wire `PersistQueryClientProvider` in `src/app/_layout.tsx`
- [x] Mutations queued while offline will auto-retry when connectivity returns
- [x] Test: toggle airplane mode, create a sleep entry, turn network on, verify it syncs
- [x] Update `OfflineBanner` to show "syncing..." state when there are pending mutations

### 2.6 File upload UX (reusable)

- [x] Create `src/lib/upload.ts` helper wrapping Supabase Storage upload
  - Accepts: `bucket, path, fileUri, options?: { onProgress?, contentType? }`
  - Returns: `{ path, publicUrl? }` or throws mapped error
  - Uses `FileSystem.uploadAsync` from `expo-file-system` for progress support (Supabase SDK in RN doesn't stream)
- [x] Preserve the `onProgress` callback pattern from the old `postFormData`
- [x] Add retry logic: 3 attempts with exponential backoff for network errors
- [x] Map storage errors (413 too large, 415 unsupported type, 403 unauthorized) via `mapSupabaseError`
- [x] Use for meal photo upload (`meal-photos` bucket) and avatar upload (`avatars` bucket)

### 2.7 Analytics / telemetry (PostHog)

- [x] Verify PostHog is already integrated (check `src/lib/` or `src/shared/`)
- [x] Create `src/lib/analytics.ts` with typed event helpers:
  - `trackAuth(action: 'signup' | 'login' | 'logout')`
  - `trackMutation(entity: string, action: 'create' | 'update' | 'delete', success: boolean)`
  - `trackRoutineGenerated(skinType: string, productCount: number)`
  - `trackSubscriptionPurchased(productId: string)`
- [x] Call from `.queries.ts` mutation `onSuccess` / `onError` callbacks (not from components)
- [x] Never log PII (email, names) to PostHog -- only counts and enums

---

> **Remaining phases** (Phase 6-10) are parked in `fix_plan_backlog.md`. When ALL items in Phase 5 are `[x]`, promote Phase 6.

---

## Phase 3 -- Auth Migration

### 3.1 Auth service rewrite

- [x] Rewrite `src/features/auth/services/auth.service.ts` to use Supabase Auth
  - `login(email, password)` -> `supabase.auth.signInWithPassword({ email, password })`
  - `register({ firstname, lastname, email, password })` -> `supabase.auth.signUp({ email, password, options: { data: { first_name, last_name } } })`
  - `getMe()` -> `supabase.auth.getUser()` + `supabase.from('clients').select().eq('user_id', user.id).single()`
  - Remove `devLogin` entirely
- [x] Update `src/shared/stores/auth.store.ts` to work with Supabase session
  - Replace manual token state with `supabase.auth.getSession()`
  - Listen to `supabase.auth.onAuthStateChange` for real-time updates
  - Remove `handleSessionExpiry` manual logic (SDK handles it)

### 3.2 Client profile auto-creation

- [x] Verify the DB trigger `handle_new_user` exists (creates `clients` row on `auth.users` insert). If missing, document for manual creation via MCP.
- [x] Ensure `first_name`, `last_name`, `email` flow from signup metadata into `clients`

### 3.3 Remove old API infrastructure

- [x] Delete `src/shared/services/api.ts` (custom fetch + JWT refresh)
- [x] Delete `RefreshTokenResponse` type
- [x] Remove `getRefreshToken`/`setRefreshToken`/`getToken`/`setToken` from storage utils if unused
- [x] Remove `API_URL` from `ENV`

### 3.4 Types update

- [x] Replace `AuthUser`/`LoginResponse`/`RegisterResponse` in `src/shared/types/api.types.ts` with Supabase-derived types
- [x] Update `UserProfile` in `src/shared/types/user.types.ts` to match `clients` row shape
  - Fields: `id`, `user_id`, `first_name`, `last_name`, `email`, `phone`, `birthday`, `skin_type`, `avatar_url`, `has_routine_access`

### 3.5 Tests

- [x] Update auth tests in `src/features/auth/__tests__/` with Supabase mocks
- [x] Verify login, register, logout, session persistence, auto-refresh

---

## Phase 4 -- Journal Migration

### 4.1 Journal service rewrite

- [x] Rewrite `src/features/journal/services/journal.service.ts`
  - Remove all `api.get/post/put/delete` calls
  - `sleepService.getByDate(date)` -> `supabase.from('sleep_entries').select().eq('user_id', uid).eq('date', date)`
  - `sleepService.upsert(dto)` -> `supabase.from('sleep_entries').upsert({...dto, user_id}, { onConflict: 'user_id,date' }).select().single()`
  - `sleepService.delete(id)` -> `supabase.from('sleep_entries').delete().eq('id', id)`
  - Same pattern for `sport`, `meal`, `stress` services
  - `observationsService.upsert` -- note: `positives`/`negatives` are now `text[]` (Postgres arrays), not JSON strings
  - `entriesService.getByDateRange(start, end)` -> 5 parallel `supabase` queries with `.gte('date', start).lte('date', end)`, returned as `JournalWeekResponse`

### 4.2 Meal image upload

- [x] Replace `mealService.uploadImage` with Supabase Storage upload
  - Path: `{user_id}/{date}/{uuid}.jpg`
  - Bucket: `meal-photos` (private)
  - Return a **signed URL** (`createSignedUrl`, 1h expiry) for display
  - Store the storage path (not URL) in `meal_entries.photo_url`, regenerate signed URLs on read
- [x] Update `src/shared/utils/image.ts` to compress before upload as before

### 4.3 Sport types

- [x] Rewrite `sportTypesService.getAll` -> `supabase.from('sport_types').select()`
- [x] Wrap in TanStack Query hook `useSportTypes()` with `staleTime: 24h` (reference data)

### 4.4 Types update

- [x] Align `src/shared/types/journal.types.ts` with generated Supabase types
- [x] Note: `date` field is now ISO date string `YYYY-MM-DD` (from Postgres `date`), not ISO timestamp -- audit all consumers of `entry.date`
- [x] Update `src/shared/utils/date.ts` if needed

### 4.5 Tests

- [x] Update journal tests in `src/features/journal/__tests__/` with Supabase mocks

---

## Phase 5 -- Profile Migration

### 5.1 Profile service rewrite

- [x] Rewrite `src/features/profile/services/profile.service.ts`
  - `updateProfile(data)` -> `supabase.from('clients').update(data).eq('user_id', uid).select().single()`
  - `uploadAvatar(uri)`: compress, upload to `avatars/{user_id}/`, get public URL, update `clients.avatar_url`
  - `deleteAccount()` -> `supabase.rpc('delete_own_account')` (Postgres security definer function)

### 5.2 Delete account RPC documentation

- [x] Document `delete_own_account` RPC requirement in `docs/supabase-migration.md` §4 -- must be a `SECURITY DEFINER` function that deletes the `auth.users` row (cascades to `clients` and all FK data)

### 5.3 Tests

- [x] Create profile tests in `src/features/profile/__tests__/` with Supabase mocks
