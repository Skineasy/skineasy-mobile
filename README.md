# SkinEasy Mobile

React Native (Expo) skincare app — iOS & Android.

## Tech Stack

- **Framework**: Expo SDK 55 (RN 0.83, React 19.2), TypeScript strict, Expo Router
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **State**: Zustand + TanStack Query
- **Styling**: Uniwind v1.6 + Tailwind v4 (`@theme` tokens in `src/global.css`)
- **Testing**: Vitest

## Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/) for builds

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                   | Description                         | Where to find                               |
| -------------------------- | ----------------------------------- | ------------------------------------------- |
| `SUPABASE_URL`             | Supabase project URL                | Supabase dashboard → Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key            | Supabase dashboard → Project Settings → API |
| `SENTRY_AUTH_TOKEN`        | Sentry auth token for source maps   | Sentry → Settings → Auth Tokens             |
| `TYPEFORM_ID`              | Typeform form ID for skin diagnosis | Typeform dashboard                          |
| `PRESTASHOP_URL`           | Skincare shop URL                   | —                                           |
| `DEV_LOGIN_SECRET`         | Dev-only passwordless login secret  | Ask team                                    |

### 3. Supabase project

The Supabase project (`lyhhipvipgbqsytfqwdw`) already has:

- Schema: `clients`, `sleep_entries`, `sport_entries`, `meal_entries`, `stress_entries`, `observation_entries`, `diagnoses`, `push_tokens`, `app_config`, `sport_types`, `routines`
- Storage buckets: `avatars` (public), `meal-photos` (private)
- Edge Functions: `resolve-routine` (deployed) — determines routine status on login
- RLS policies applied
- DB trigger `handle_new_user` auto-creates a `clients` row on signup

No migrations to run — schema is managed via Supabase dashboard.

See `docs/supabase-migration.md` for full schema and `docs/routine-resolution-flow.md` for the routine resolution design.

### 4. Run

```bash
npx expo start
```

## Development

```bash
npm run check       # lint + typecheck + tests
npm run test        # tests only
npm run typecheck   # TypeScript only
npm run lint        # ESLint only
npm run format      # Prettier
```

## Architecture

See `docs/supabase-migration.md` for the data layer reference (tables, RLS, storage).

Key conventions:

- All Supabase errors are mapped to i18n keys via `src/lib/error-mapper.ts`
- Mutations auto-toast errors via the global `MutationCache.onError` handler
- Push tokens are registered after login and unregistered on logout

## Recent migrations

- **Expo SDK 54 → 55** (RN 0.81 → 0.83, React 19.1 → 19.2). Removed `newArchEnabled` and `android.edgeToEdgeEnabled` (defaults in 55), bumped Sentry / netinfo / babel-preset-expo to v55-aligned versions.
- **NativeWind v4 → Uniwind v1.6 + Tailwind v3 → v4**. NativeWind 4.x crashed on Metro 0.85 (`addedFiles` undefined) and NativeWind 5 is preview-only. Switched to Uniwind (drop-in `className`, Metro plugin only — no Babel transform, no Tailwind CLI child process). Tokens migrated 1:1 from `tailwind.config.js` to `@theme` block in `src/global.css`. Third-party components needing `className` (e.g. `SafeAreaView`) are wrapped via `withUniwind` in `src/shared/components/styled-rn.tsx`.
- **lucide-react-native pinned to `^0.562`**. v1.x has a packaging bug (its barrel imports `./icons/*.mjs` paths not declared in its `exports` field), incompatible with SDK 55's strict ESM resolution.

See [`docs/specs/tech/migrate-to-uniwind.md`](docs/specs/tech/migrate-to-uniwind.md) for the full Uniwind migration spec.
