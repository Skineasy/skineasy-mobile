# Deeplinking

Two entry points coexist:

- **Custom scheme** `skineasy://` — dev / QA / fallback. Declared in `app.config.ts` → `scheme`.
- **Universal Links (iOS) / App Links (Android)** on `https://skineasy.com` — production.

Bundle identifier: `com.skineasy.app` (iOS + Android). Apple Team ID: `P4C3M58B3G`.

## Routing

Expo Router maps incoming URLs to routes under `src/app/`. Parentheses groups (`(auth)`, `(tabs)`) are invisible in URLs, so `/password-reset` maps to `src/app/(auth)/password-reset.tsx`.

Params are read with `useLocalSearchParams()`.

| URL                                            | Route                               |
| ---------------------------------------------- | ----------------------------------- |
| `https://skineasy.com/password-reset?code=xxx` | `src/app/(auth)/password-reset.tsx` |
| `skineasy:///(auth)/password-reset?token=abc`  | `src/app/(auth)/password-reset.tsx` |
| `skineasy:///(auth)/login`                     | `src/app/(auth)/login.tsx`          |
| `skineasy:///(tabs)/routine`                   | `src/app/(tabs)/routine.tsx`        |

## What's in place

### Mobile (`app.config.ts`)

- `ios.associatedDomains: ['applinks:skineasy.com']` — iOS Universal Links entitlement
- `android.intentFilters` with `autoVerify: true`, scheme `https`, host `skineasy.com`, pathPrefix `/password-reset` — Android App Links
- `scheme: 'skineasy'` — custom scheme kept for dev and fallback

⚠️ Any change to `associatedDomains` or `intentFilters` requires a **native rebuild** (EAS Build or `npx expo prebuild`). It does NOT propagate through OTA updates.

### Auth layout (`src/app/(auth)/_layout.tsx`)

`/password-reset` is the only `(auth)` route accessible even when `isAuthenticated` is true (a user might click the reset link from a device where they're still logged in).

### Supabase client (`src/features/auth/data/auth.api.ts`)

`resetPasswordForEmail` is called with `redirectTo: 'https://skineasy.com/password-reset'`. Supabase will then send recovery emails that point to this URL with a PKCE `?code=...` (or implicit `#access_token=...` depending on client flow type).

### Server (skineasy.com)

Two files deployed at `https://skineasy.com/.well-known/`:

- `apple-app-site-association` — matches path `/password-reset*` with App ID `P4C3M58B3G.com.skineasy.app`
- `assetlinks.json` — current SHA256: `72:60:CF:FD:48:AC:37:86:54:3B:C2:F6:9F:05:55:8F:D6:8B:A1:AA:AC:64:B3:73:88:70:D7:FA:A6:F8:AD:55` (EAS upload key, dev builds only)

Local source of truth: `skineasy-web/.well-known/` (PrestaShop repo). Deploy via scp to `~/applications/fjvgsscruy/public_html/.well-known/` on the production server (see `skineasy-web/docs/PRODUCTION_SERVER.md`).

Verify:

```bash
curl -s https://skineasy.com/.well-known/apple-app-site-association
curl -s https://skineasy.com/.well-known/assetlinks.json
curl -s https://app-site-association.cdn-apple.com/a/v1/skineasy.com  # Apple's cached view
```

## Remaining steps

### 1. Fix Supabase session handoff in `password-reset.tsx`

**Current bug**: `auth.api.ts:resetPassword` calls `supabase.auth.updateUser({ password })` without establishing a recovery session from the URL. On web, supabase-js auto-detects the URL hash; on RN there is no `window.location`, so it must be done manually.

What's needed:

- In `src/app/(auth)/password-reset.tsx`, use `useURL()` from `expo-linking` (or `useLocalSearchParams`) to grab the `code` param.
- Call `supabase.auth.exchangeCodeForSession(code)` on screen mount to establish a recovery session.
- Only then call `updateUser({ password })` on submit.

If the Supabase client is running in implicit flow (default), the link will contain `#access_token=...&refresh_token=...&type=recovery` instead. In that case use `supabase.auth.setSession({ access_token, refresh_token })`. PKCE is preferred for mobile (`flowType: 'pkce'` in the Supabase client options, plus `detectSessionInUrl: false` since we handle it manually).

### 2. Supabase Dashboard config

- **Auth → URL Configuration → Redirect URLs**: add `https://skineasy.com/password-reset`.
- **Auth → Email Templates → "Reset Password"**: verify the `{{ .ConfirmationURL }}` or `{{ .SiteURL }}` variable produces a URL that lands on `https://skineasy.com/password-reset?code=...`.

### 3. Add Google Play signing key to assetlinks.json (when publishing)

Play App Signing re-signs APKs with Google's key, so installs from the Play Store have a different SHA256 than our upload key.

After the first upload to Play Console:

- Go to **Play Console → SkinEasy → Setup → App signing**.
- Copy the SHA-256 from **App signing key certificate**.
- Append it to the `sha256_cert_fingerprints` array in `skineasy-web/.well-known/assetlinks.json`.
- Redeploy the file to the server.

Keep both fingerprints in the array (upload key + Google's key) so internal sideloads and Play Store installs both verify.

### 4. Fallback HTML page at `/password-reset`

Today `https://skineasy.com/password-reset` returns the PrestaShop 404 for users without the app installed. A minimal HTML page at this URL should:

- Detect mobile UA and show App Store / Play Store buttons.
- On desktop, explain that reset requires the mobile app (or provide a web-based reset if we ever build one).

Will be trivial to add once the Nuxt migration ships (see below).

### 5. Native rebuild

Trigger an EAS build for both platforms so the new `associatedDomains` / `intentFilters` land on device. Install the new build before testing Universal Links — old builds will keep opening links in the browser.

```bash
eas build --profile development --platform all
```

## Nuxt migration

When the PrestaShop site is replaced by the Nuxt app at `skineasy.com`, the following must be preserved or recreated.

### Keep the two `.well-known` files served identically

- `https://skineasy.com/.well-known/apple-app-site-association`
- `https://skineasy.com/.well-known/assetlinks.json`

Both must be:

- Served over **HTTPS** (no self-signed certs, no redirects).
- Reachable at those **exact paths** (no trailing slash, no extension on AASA).
- `Content-Type: application/json` ideally (Apple's CDN is somewhat lenient; Google is not).

In Nuxt, place the files under `public/.well-known/`. Nuxt's `public/` dir serves files as-is at the root. Nuxt 3 auto-detects `apple-app-site-association` without extension and serves it correctly.

If using Nitro's server routes instead, create `server/routes/.well-known/apple-app-site-association.get.ts`:

```ts
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json');
  return {
    applinks: {
      details: [
        { appIDs: ['P4C3M58B3G.com.skineasy.app'], components: [{ '/': '/password-reset*' }] },
      ],
    },
  };
});
```

Same pattern for `assetlinks.json.get.ts`.

### Add a `/password-reset` route in Nuxt

A page at `pages/password-reset.vue` that:

- Detects `navigator.userAgent` → shows "Open in SkinEasy" button + App Store / Play Store links on mobile.
- On desktop, displays a short explanation and optionally a web-based reset form (if we choose to support web reset).
- Preserves the `?code=` query string when linking into the app via custom scheme as fallback (`skineasy:///(auth)/password-reset?code=...`).

On iOS/Android with Universal Links enabled, the OS will intercept the URL before the browser ever loads this page (for installed apps). The page is only shown when the app is not installed, or when the user explicitly chooses to open in browser.

### CDN / caching

- Don't cache `.well-known/*` aggressively. Apple's CDN refetches every ~24h; if you need to rotate keys, a long cache TTL will delay propagation.
- Strip cookies from responses to these paths (PrestaShop currently returns `PrestaShop-*` cookies on the 404, which is harmless but ugly).
- HTTPS must not redirect `http://skineasy.com/.well-known/...` → `https://...` for Apple's validator, or rather: Apple follows the redirect, but it's cleaner to terminate at HTTPS.

### Server headers to verify post-migration

```bash
curl -sI https://skineasy.com/.well-known/apple-app-site-association   # expect 200, application/json, no cookies
curl -sI https://skineasy.com/.well-known/assetlinks.json              # expect 200, application/json
curl -s  https://app-site-association.cdn-apple.com/a/v1/skineasy.com  # Apple's CDN view
```

Clear Apple's cache after the migration by bumping the `last-modified` header or just waiting 24h.

### Sitemap / robots

- Add `Disallow: /.well-known/` to `robots.txt`? Not required — these files are public by design. No SEO impact.
- Do NOT list `/password-reset` in sitemap — it's a transactional landing.

## Testing

### Universal Links (iOS)

On a real device with the app installed:

```bash
# Paste in Safari, hit Go
https://skineasy.com/password-reset?code=test
```

Or use Notes app → tap a manually typed link. Links tapped from Safari's address bar sometimes stay in Safari; links from any other app (Notes, Mail, Messages) route to the app correctly.

Debug with the **Settings → Developer → Universal Links → Diagnostics** tool (developer device).

### App Links (Android)

```bash
adb shell pm verify-app-links --re-verify com.skineasy.app
adb shell pm get-app-links com.skineasy.app
```

Expect `verified` for `skineasy.com`. If it says `1024` (failed), re-check that `assetlinks.json` SHA matches the installed APK's signature.

Test the link:

```bash
adb shell am start -a android.intent.action.VIEW -d "https://skineasy.com/password-reset?code=test"
```

### Custom scheme (both platforms, dev)

```bash
npx uri-scheme open "skineasy:///(auth)/password-reset?code=test" --ios
npx uri-scheme open "skineasy:///(auth)/password-reset?code=test" --android
```

### Expo Go

```bash
npx uri-scheme open "exp://<host>:8081/--/(auth)/password-reset?code=test" --ios
```

## Notes

- The triple slash in `skineasy:///` is intentional — empty host, path starts after `://`.
- Universal Links and App Links **do not work in Expo Go** — you need a development build with the native configuration applied.
- For Android, `autoVerify: true` requires the assetlinks file to be reachable at build/install time. If the domain is unreachable, verification silently fails and links open in the browser instead. Always redeploy `.well-known/` before cutting a new Android build.
- Apple's AASA is fetched via their CDN, so first-time validation can take a few minutes after deploying the file.
