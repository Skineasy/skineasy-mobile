# OTA Updates

Over-the-air updates via EAS Update allow pushing JS/asset changes without App Store review.

## How It Works

```
App Launch
    │
    ▼
Check for update (WiFi only)
    │
    ├─ Update found ──► Download (up to 30s wait)
    │                        │
    │                        ▼
    │                   Apply update
    │
    └─ No update ──► Launch with cached bundle
```

## Configuration

**[app.config.ts](../app.config.ts)**

```typescript
updates: {
  enabled: true,
  checkAutomatically: 'WIFI_ONLY',
  fallbackToCacheTimeout: 30000, // Wait 30s for update
  url: 'https://u.expo.dev/dfbff412-fc10-4a77-b170-eb432c2969b9',
}
```

| Setting                  | Value       | Description                               |
| ------------------------ | ----------- | ----------------------------------------- |
| `checkAutomatically`     | `WIFI_ONLY` | Only check when on WiFi                   |
| `fallbackToCacheTimeout` | `30000`     | Wait up to 30s for update before fallback |

## Publishing Updates

### Standard Update

```bash
eas update --branch production --message "fix: description"
```

### With Channel (recommended)

```bash
eas update --channel production --message "fix: description"
```

### Preview Before Publishing

```bash
# Export locally to inspect bundle
npx expo export
```

## Channels & Branches

| Channel       | Branch        | Build Profile | Usage            |
| ------------- | ------------- | ------------- | ---------------- |
| `production`  | `production`  | `production`  | App Store builds |
| `development` | `development` | `development` | Dev builds       |

## Rollback

### Option 1: Republish Previous Version

```bash
# Find the commit hash of the working version
git log --oneline

# Checkout and republish
git checkout <commit-hash>
eas update --branch production --message "rollback: revert to v1.2.3"
git checkout main
```

### Option 2: EAS Dashboard

1. Go to [expo.dev](https://expo.dev) > Project > Updates
2. Find the previous working update
3. Click "Republish" to make it the latest

## Limitations

OTA updates **CAN** change:

- JavaScript code
- Assets (images, fonts)
- App configuration (non-native)

OTA updates **CANNOT** change:

- Native code (requires new build)
- App permissions
- Native modules/plugins
- App version/build number

## Testing Updates

### Development

1. Use the "Check for Updates" button in Profile (DEV only)
2. Triggers manual check → download → reload

### Production Testing

1. Build production app: `eas build --profile production`
2. Install on device
3. Make visible code change
4. Publish: `eas update --branch production --message "test"`
5. Open app → Should see new version after brief wait

## Troubleshooting

### Update Not Applying

- Ensure device is on WiFi
- Force close app completely, reopen
- Check EAS dashboard for successful publish

### Debugging

```typescript
import * as Updates from 'expo-updates';

// Check current update info
console.log('Update ID:', Updates.updateId);
console.log('Is embedded:', Updates.isEmbeddedLaunch);
console.log('Channel:', Updates.channel);
```

### Sentry Tracking

Update failures are automatically reported to Sentry with tag `feature: ota-updates`.

## Best Practices

1. **Test locally first** - Use `npx expo export` to verify bundle
2. **Use descriptive messages** - Makes rollback easier
3. **Monitor Sentry** - Watch for update-related errors
4. **Gradual rollout** - For critical updates, consider staged deployment
5. **Keep native code stable** - Minimize native changes to maximize OTA capability

---

## Force Update (Native Version)

For breaking changes that require a new native build (not OTA), we have a force update mechanism.

### How It Works

```
App Launch
    │
    ▼
Fetch /api/v1/app/config
    │
    ├─ Error ──► Fail open (continue normally)
    │
    └─ Success
         │
         ▼
    Compare versions
         │
         ├─ Current >= minimum ──► Continue app
         │
         └─ Current < minimum ──► Show blocking modal
                                       │
                                       ▼
                                  "Update Now"
                                       │
                                       ▼
                                  Open App Store
```

### Backend Endpoint

```
GET /api/v1/app/config
Response: {
  "minimumVersion": "1.2.0",
  "storeUrls": {
    "ios": "https://apps.apple.com/app/...",
    "android": "https://play.google.com/store/apps/..."
  }
}
```

### When to Bump `minimumVersion`

- Breaking API changes
- Critical security fixes
- New native module added
- App permissions changed
- Required native SDK update

### Files

- [useForceUpdate.ts](../src/shared/hooks/useForceUpdate.ts) - Version check hook
- [ForceUpdateModal.tsx](../src/shared/components/ForceUpdateModal.tsx) - Blocking UI
- [appConfig.service.ts](../src/shared/services/appConfig.service.ts) - API service

### Testing

1. Set backend `minimumVersion` to `"999.0.0"`
2. Open app → Should see blocking modal
3. Tap "Update Now" → Should open App Store
4. Reset `minimumVersion` to current version → App works normally
