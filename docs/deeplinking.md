# Deeplinking

## Scheme

The app uses the custom scheme `skineasy://` (declared in `app.config.ts` → `scheme`).

Bundle identifier: `com.skineasy.app` (iOS + Android).

## How Expo Router handles it

Expo Router maps any incoming `skineasy://` URL to the matching route in `src/app/`. No extra handler code is needed for routes that simply read params.

Examples:

| URL                                           | Route                               |
| --------------------------------------------- | ----------------------------------- |
| `skineasy:///(auth)/password-reset?token=abc` | `src/app/(auth)/password-reset.tsx` |
| `skineasy:///(auth)/login`                    | `src/app/(auth)/login.tsx`          |
| `skineasy:///(tabs)/routine`                  | `src/app/(tabs)/routine.tsx`        |

Params are read with `useLocalSearchParams()`:

```ts
const { token } = useLocalSearchParams<{ token?: string }>();
```

## Current use cases

### Password reset (mock)

- Screen: `src/app/(auth)/password-reset.tsx`
- URL: `skineasy:///(auth)/password-reset?token=<token>`
- Flow: user requests reset on `/password-recovery` → receives email with deep link → taps link → app opens on `password-reset` with `token` in params → submits new password → redirects to login.

When Supabase lands, the email template must produce a link like:

```
skineasy:///(auth)/password-reset?token={{token}}
```

Supabase normally sends HTTPS URLs. Two options:

1. **Universal Links (recommended for prod)**: configure `https://skineasy.com/auth/reset?token=...` as a Universal Link / App Link that opens the app. Requires `apple-app-site-association` (iOS) and `assetlinks.json` (Android) on the domain. Maps to the same Expo Router route via a `redirect` or `Linking.getInitialURL()` handler.
2. **Custom scheme fallback**: override Supabase redirect URL to `skineasy://(auth)/password-reset`. Simpler but shows a system prompt "Open in Skin Easy?" and won't work if the app isn't installed.

For the mock period, use option 2.

## Testing deep links locally

### iOS simulator

```bash
xcrun simctl openurl booted "skineasy:///(auth)/password-reset?token=test-token"
```

Or with `uri-scheme`:

```bash
npx uri-scheme open "skineasy:///(auth)/password-reset?token=test-token" --ios
```

### Android emulator

```bash
adb shell am start -W -a android.intent.action.VIEW -d "skineasy:///(auth)/password-reset?token=test-token" com.skineasy.app
```

Or:

```bash
npx uri-scheme open "skineasy:///(auth)/password-reset?token=test-token" --android
```

### Expo Go (dev)

When running in Expo Go, the scheme is `exp://` + the dev server URL. Use:

```bash
npx uri-scheme open "exp://<host>:8081/--/(auth)/password-reset?token=test-token" --ios
```

## Notes

- The triple slash in `skineasy:///` is intentional — the host is empty, so the path starts immediately after `://`.
- If the user is already authenticated, `(auth)/_layout.tsx` redirects them to `(tabs)` before the deep-linked screen renders. For password reset we may want to allow access even when authenticated — to be decided when Supabase ships.
- For Universal Links setup, see Expo docs: https://docs.expo.dev/guides/deep-linking/
