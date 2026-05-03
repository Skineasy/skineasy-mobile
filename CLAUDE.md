# SkinEasy Mobile

React Native (Expo) skincare app - iOS & Android

## Quick Reference

| Utility   | Location                       | Note                             |
| --------- | ------------------------------ | -------------------------------- |
| Pressable | `@shared/components/Pressable` | Always use instead of RN's       |
| Logger    | `@shared/utils/logger`         | Never use console.\*             |
| Haptic    | `@shared/utils/haptic`         | See intensity rules below        |
| Date      | `@shared/utils/date`           | API uses ISO 8601 UTC            |
| ENV       | `@shared/config/env`           | Never use process.env at runtime |
| cn        | `@shared/utils/cn`             | Use for className concatenation  |

## Project-Specific Rules

1. **i18n for ALL text** - Never hardcode strings, use `t('key')`
2. **No barrel files** - Import from source directly, not index.ts re-exports
3. **No backend errors in UI** - Use i18n keys, backend errors aren't translated
4. **Date format** - API: `"2025-01-15T00:00:00.000Z"`, birthday only: `"YYYY-MM-DD"`
5. **Uniwind only** - Always use `className` with Tailwind classes, never `StyleSheet.create()`. Exception: `Animated.View` and `GlassView` require `style` prop. Third-party components needing className must be wrapped via `withUniwind` (see `src/shared/components/styled-rn.tsx`)
6. **Use cn() for dynamic classes** - Never use template literals for className concatenation, use `cn()` from `@shared/utils/cn`
7. **Mutations auto-toast errors** - Global `MutationCache.onError` shows a translated toast for every mutation error automatically. Do NOT add a manual `toast.error()` in `onError` unless the mutation sets `meta: { suppressGlobalError: true }` to opt out.

### Haptic Intensity

- **Heavy**: Save, submit, login, logout, delete
- **Medium**: Navigation, context switches, toggles
- **Light**: Reversible selections, back button
- **Selection**: Input focus (automatic)
- **Notification**: `haptic.success()` / `haptic.error()` for form results

---

## Tech Stack

- **Framework**: Expo SDK (managed), TypeScript strict, Expo Router
- **State**: Zustand (auth, user, journal stores) + TanStack Query
- **Styling**: Uniwind v1.6 + Tailwind v4 (`@theme` tokens in `src/global.css`)
- **Forms**: React Hook Form + Zod
- **i18n**: i18next + expo-localization (FR/EN)
- **Testing**: Vitest + React Native Testing Library

---

## Project Structure

```
app/                          # Expo Router
├── _layout.tsx               # Root layout (providers, fonts)
├── index.tsx                 # Entry redirect
├── (auth)/                   # Unauthenticated
│   ├── login.tsx
│   └── register.tsx
└── (tabs)/                   # Authenticated
    ├── index.tsx             # Dashboard
    ├── routine.tsx
    └── profile.tsx

src/
├── features/                 # Feature modules
│   ├── auth/
│   ├── journal/
│   ├── routine/
│   ├── diagnosis/
│   └── profile/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── utils/
│   ├── config/
│   └── types/
├── i18n/locales/
└── theme/
```

---

## Design System

### Colors

See `src/theme/colors.ts` for current values.

### Spacing (4px grid)

```typescript
xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48
```

### Radius

```typescript
sm: 4, md: 8, lg: 16, full: 9999
```

### Typography

Font: `@expo-google-fonts/roboto`

| Style     | Weight | Size |
| --------- | ------ | ---- |
| h1        | 700    | 28   |
| h2        | 700    | 24   |
| h3        | 500    | 20   |
| body      | 400    | 16   |
| bodySmall | 400    | 14   |
| caption   | 400    | 12   |
| button    | 500    | 16   |

---

## Navigation

```
Root
├── AuthStack (no token)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTabs (has token)
    ├── Dashboard
    ├── Routine
    └── Profile
        └── DiagnosisWebView
```

---

## Supabase

Project ID: `lyhhipvipgbqsytfqwdw` — full schema in `docs/supabase-migration.md`

| Resource       | Details                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| Auth           | `supabase.auth.*` — session auto-managed by SDK                                            |
| Client profile | `clients` table (extends `auth.users` via DB trigger)                                      |
| Journal tables | `sleep_entries`, `sport_entries`, `meal_entries`, `stress_entries`, `observation_entries`  |
| Other tables   | `diagnoses`, `push_tokens`, `app_config`, `sport_types`, `routines`                        |
| Avatars bucket | `avatars` (public) — path: `{user_id}/{filename}`                                          |
| Meal photos    | `meal-photos` (private) — signed URLs, 1h expiry                                           |
| Edge Functions | `resolve-routine` — called via `supabase.functions.invoke`, returns `ResolveRoutineResult` |
| Error mapping  | `src/lib/error-mapper.ts` — Supabase codes → i18n keys                                     |

---

## Import Aliases

```typescript
@/*         -> src/*
@features/* -> src/features/*
@shared/*   -> src/shared/*
@theme/*    -> src/theme/*
@i18n/*     -> src/i18n/*
```
