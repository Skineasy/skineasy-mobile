# Apple Health Integration

## Library

`@kingstinct/react-native-healthkit` (Nitro Modules, New Architecture compatible) + `react-native-nitro-modules`.

We previously used `react-native-health` but it does not support React Native's New Architecture / bridgeless mode (legacy `RCT_EXPORT_MODULE` only), so `NativeModules.AppleHealthKit` was `undefined` at runtime even though the entitlement was present in the signed binary. Migration was JS-only on the call sites — entitlements/Info.plist are now produced by the kingstinct config plugin.

## Compatibility

| Requirement | Minimum                                                       |
| ----------- | ------------------------------------------------------------- |
| iOS         | 15.1+ (Expo SDK 54)                                           |
| Device      | Physical iPhone only (HealthKit returns no data on simulator) |
| Android     | Not supported                                                 |

## Expo Config

In [app.config.ts](../app.config.ts):

```ts
plugins: [
  // ...
  [
    '@kingstinct/react-native-healthkit',
    {
      NSHealthShareUsageDescription:
        'SkinEasy uses your health data to track sleep, activity, and nutrition for skin health insights.',
      NSHealthUpdateUsageDescription: false, // read-only integration
      background: false, // background delivery not used
    },
  ],
],
```

The plugin injects `com.apple.developer.healthkit = true` into the iOS entitlements at prebuild/EAS-build time and writes `NSHealthShareUsageDescription` to the Info.plist. EAS automatically syncs HealthKit capability with the bundle ID's provisioning profile on the next build.

## What We Sync

| HealthKit Data                            | App Entry     | Mapping                                                                                 |
| ----------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| Sleep Analysis                            | `SleepEntry`  | Hours = asleep duration, Quality = efficiency (asleep/inBed)                            |
| Workouts + HeartRate                      | `SportEntry`  | Duration, type mapped to `SportType`, intensity from avg HR vs `220 - age` (fallback 3) |
| Nutrition (calories, protein, carbs, fat) | `MealEntry`   | One "HealthKit" meal/day with macros in note                                            |
| HeartRateVariability + RestingHeartRate   | `StressEntry` | Daily level (1–5) derived from HRV/RestingHR vs 7-day baseline                          |

### Sleep Quality Formula

```
efficiency = asleep_hours / in_bed_hours
Quality 5: efficiency > 90%
Quality 4: efficiency > 80%
Quality 3: efficiency > 70%
Quality 2: efficiency > 60%
Quality 1: efficiency <= 60%
```

`asleep_hours` sums InBed-excluded stages (`asleep`, `asleepCore`, `asleepDeep`, `asleepREM`); `in_bed_hours` adds `inBed` time. `awake` time is ignored.

### Workout Type Mapping

`HKWorkoutActivityType` numeric values from the kingstinct `WorkoutActivityType` enum:

| HK ID | Enum                        | App Sport Type |
| ----- | --------------------------- | -------------- |
| 13    | cycling                     | cycling        |
| 14    | dance                       | dancing        |
| 20    | functionalStrengthTraining  | strength       |
| 24    | hiking                      | hiking         |
| 37    | running                     | running        |
| 46    | swimming                    | swimming       |
| 50    | traditionalStrengthTraining | strength       |
| 57    | yoga                        | yoga           |
| 66    | pilates                     | pilates        |
| 73    | mixedCardio                 | cardio         |
| 77    | cardioDance                 | dancing        |
| 78    | socialDance                 | dancing        |
| Other | —                           | other          |

### Sleep Value Mapping (kingstinct `CategoryValueSleepAnalysis`)

| Numeric | Enum                       | Internal `SleepValue` |
| ------- | -------------------------- | --------------------- |
| 0       | inBed                      | INBED                 |
| 1       | asleep / asleepUnspecified | ASLEEP                |
| 2       | awake                      | AWAKE                 |
| 3       | asleepCore                 | CORE                  |
| 4       | asleepDeep                 | DEEP                  |
| 5       | asleepREM                  | REM                   |

## What We Don't Sync (and Why)

| Data             | Reason                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Steps            | Not relevant to skin health tracking.                                                            |
| Water intake     | Rarely logged in HealthKit.                                                                      |
| Individual meals | HealthKit only stores daily totals, not meals. We create one synthetic "HealthKit" meal per day. |
| Source tracking  | Backend needs `source` field update. Deferred.                                                   |

## Sync Behavior

- **Auto-sync triggers** ([useHealthKitAutoSync.ts](../src/features/healthkit/hooks/useHealthKitAutoSync.ts)):
  - Cold start (app open / mount of root layout)
  - Background → foreground transition (via `AppState` `'change'` listener)
  - In both cases, only if **≥1h since last sync** (or never synced)
- **Manual sync**: long-press the dev button in Profile → "Re-sync last 7/30 days" in the debug sheet. Manual taps ignore the 1h gate.
- **Range**: Last 7 days for sleep/workouts/stress. Nutrition syncs `endDate` only (current day).
- **Cache invalidation**: After any sync that upserted ≥1 entry, all `queryKeys.journal` queries are invalidated so dashboard indicators and the calendar refetch automatically.
- **Merge**: HealthKit data merged with manual entries (no deduplication yet).
- **Concurrency guard**: `inFlightRef` ref + `isSyncing` state ensure a single sync runs at a time even if foreground/cold-start fire simultaneously.

## Permissions Requested

Read-only — no write permissions are requested (`NSHealthUpdateUsageDescription: false` in the plugin config).

- `HKCategoryTypeIdentifierSleepAnalysis`
- `HKWorkoutTypeIdentifier`
- `HKQuantityTypeIdentifierDietaryEnergyConsumed`
- `HKQuantityTypeIdentifierDietaryProtein`
- `HKQuantityTypeIdentifierDietaryCarbohydrates`
- `HKQuantityTypeIdentifierDietaryFatTotal`
- `HKQuantityTypeIdentifierHeartRate` — workout intensity
- `HKQuantityTypeIdentifierRestingHeartRate` — stress derivation
- `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` — stress derivation

iOS does not report which scopes the user actually granted (privacy by design). After the prompt, queries silently return zero samples for denied scopes — see "Diagnostics" below.

## Derivations

### HRV + RestingHR → automated Stress score

The stress category (15% of the daily score) is auto-filled from HealthKit when HRV or RestingHR samples are present. Manual `StressEntry` logging still works as a fallback or override.

- Reads `HeartRateVariabilitySDNN` (unit `ms`) and `RestingHeartRate` (unit `count/min`) over the sync range (default 7 days).
- Computes a 7-day baseline (mean) for each signal.
- Per-day score: `score = mean((baselineHrv - dayHrv) / baselineHrv, (dayHr - baselineRestingHr) / baselineRestingHr) * 10`.
- Maps `score` to `StressEntry.level`:
  - `≥ 1.5` → 5
  - `≥ 0.5` → 4
  - `≥ -0.5` → 3
  - `≥ -1.5` → 2
  - else → 1
- Days with no HRV/RestingHR samples are skipped (no `StressEntry` written).
- Persisted via `upsertStress` (one entry per user/day, idempotent).
- HRV typically requires an Apple Watch. RestingHR is iPhone-compatible if a 3rd-party app populates it.

### Workout HR-based intensity

`SportEntry.intensity` is derived from heart-rate samples falling inside the workout window.

- Requires `birthday` on the user profile (`clients` table) to compute `maxHr = 220 - age`.
- For each workout, averages `HeartRate` samples within `[startDate, endDate]`.
- Maps `avgHr / maxHr` to intensity:
  - `≥ 90%` → 5
  - `≥ 80%` → 4
  - `≥ 70%` → 3
  - `≥ 60%` → 2
  - else → 1
- Fallback to `3` when age is unknown, no HR samples are inside the window, or the window is invalid.

## Code Layout

| Concern                                 | File                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Native bridge wrappers + processing     | [src/shared/services/healthkit.service.ts](../src/shared/services/healthkit.service.ts)                                       |
| Sync orchestration + cache invalidation | [src/features/healthkit/hooks/useHealthKitSync.ts](../src/features/healthkit/hooks/useHealthKitSync.ts)                       |
| Cold-start + foreground auto-sync       | [src/features/healthkit/hooks/useHealthKitAutoSync.ts](../src/features/healthkit/hooks/useHealthKitAutoSync.ts)               |
| Authorization + lastReport persistence  | [src/shared/stores/healthkit.store.ts](../src/shared/stores/healthkit.store.ts)                                               |
| Sync button + inline summary            | [src/features/healthkit/components/HealthKitSyncButton.tsx](../src/features/healthkit/components/HealthKitSyncButton.tsx)     |
| Debug sheet (long-press)                | [src/features/healthkit/components/HealthKitDebugSheet.tsx](../src/features/healthkit/components/HealthKitDebugSheet.tsx)     |
| Onboarding step                         | [src/features/auth/components/onboarding/Step3HealthSync.tsx](../src/features/auth/components/onboarding/Step3HealthSync.tsx) |

## UI Affordances

- **Sync Apple Health** button in Profile (visible in production). Tap → manual sync. Long-press → debug sheet (DEV only).
- **Inline summary** under the button, e.g. `✓ Sleep 3 · Workouts 0 · Stress 0 · Nutrition 0`.
  - Glyph: `✓` ok / `⚠` error / `○` all empty.
- **Open Settings → Health** link surfaces inline when not authorized OR when the last sync returned zero data across all categories (silent denial).
- **Debug sheet** (`HealthKitDebugSheet`):
  - Authorization state, last run timestamp + duration, range, age
  - Per-category row: status, fetched/upserted/failed counts. Tap to expand details (workout HR table, stress baseline + raw HRV/RestingHR sample counts, nutrition macros, error message).
  - Actions: re-sync 7d, re-sync 30d, reset last sync date, open iOS Settings, **Run native probe**, share report JSON.

## Diagnostics

The "Run native probe" button in the debug sheet returns:

| Field          | Meaning                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `platform`     | `ios` / `android` / `web`                                                                              |
| `moduleLoaded` | Whether `requestAuthorization` exists. `false` means the native module is not linked — rebuild needed. |
| `hasInitFn`    | Same check, more specific.                                                                             |
| `initError`    | Apple's error string if `requestAuthorization` rejects, or `'requestAuthorization returned false'`.    |

Common patterns:

| Symptom                                              | Likely cause                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sync runs, all categories `fetched: 0`               | User denied scopes in iOS prompt (silent) or has no data in HealthKit. Open Settings → Health to verify. |
| `moduleLoaded: false` / `hasInitFn: false`           | Native pod not in build. Run `eas build --profile development --clear-cache` after dep changes.          |
| `Authorization: not granted` and no iOS prompt shown | Missing `com.apple.developer.healthkit` in the signed binary. Verify with `codesign -d --entitlements`.  |
| `stress: fetched 0` despite Apple Watch              | HRV scope denied, or no overnight measurements yet (HRV is recorded during sleep).                       |
| `workouts.intensity` always `3`                      | `birthday` not set on user profile, or no `HeartRate` samples inside the workout window.                 |

### Verifying entitlements in a build

```bash
unzip -q YourApp.ipa -d /tmp/ipa
codesign -d --entitlements :- /tmp/ipa/Payload/*.app 2>&1 | grep healthkit
security cms -D -i /tmp/ipa/Payload/*.app/embedded.mobileprovision | grep -i healthkit
```

Both should show `com.apple.developer.healthkit = true`.

## Migration Notes (history)

- **`react-native-health` → `@kingstinct/react-native-healthkit`** (April 2026): old lib was incompatible with New Architecture. Public API of `healthkitService.*` was preserved, so the hook, store, and debug sheet didn't need changes. Native call paths switched from callback-based `AppleHealthKit.initHealthKit(perms, cb)` / `AppleHealthKit.getXxxSamples(opts, cb)` to promise-based `requestAuthorization({ toRead })` / `queryCategorySamples`/`queryWorkoutSamples`/`queryQuantitySamples` with `filter: { date: { startDate, endDate } }`.
