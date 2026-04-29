# Health Sync — Spec Technique Cross-Platform

Étude et plan d'implémentation pour étendre la synchronisation santé déjà en place sur iOS (HealthKit, voir [healthkit-integration.md](./healthkit-integration.md)) à Android (Health Connect).

---

## 1. État de l'art Android

### 1.1 Hubs santé Android

| Hub                        | Statut                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Health Connect**         | API officielle Google. Intégrée à Android 14+. Sur Android 9–13, app Play Store requise. **Cible.**                |
| **Google Fit API**         | **Dépréciée par Google.** Lecture désactivée mi-2026, écriture déjà coupée. À ne pas adopter.                      |
| **Samsung Health**         | API propriétaire Samsung. Indirectement accessible via Health Connect (Samsung Health pousse vers Health Connect). |
| **Fitbit / Garmin / etc.** | Idem — passent par Health Connect.                                                                                 |

→ **Health Connect est le seul choix raisonnable.** Il joue le même rôle qu'Apple Health côté iOS : un hub unique qui agrège les données de toutes les apps santé installées.

### 1.2 Comparaison des libs RN pour Health Connect

| Lib                               | Version | Dernière MàJ | DL/sem   | New Arch        | Plugin Expo | Notes                                                                                                |
| --------------------------------- | ------- | ------------ | -------- | --------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| **`react-native-health-connect`** | 3.5.0   | Nov 2025     | 48k      | ✅ TurboModule  | ✅          | Wrapper officiel communautaire (matinzd). Maintenu, large couverture des types HC. **Recommandé.**   |
| `expo-health-connect`             | —       | —            | très peu | ✅ Expo Modules | ✅          | Wrapper expo de matinzd autour du précédent. Plus fin mais moins testé. Surcouche inutile pour nous. |
| `react-native-google-fit`         | —       | 2024         | ~3k      | ❌              | ❌          | Wrap Google Fit (déprécié). Ne pas utiliser.                                                         |
| Autres (forks divers)             | —       | —            | —        | variable        | rare        | Aucun n'a la traction de matinzd.                                                                    |

→ **Choix : `react-native-health-connect`** (matinzd). Symétrique à `@kingstinct/react-native-healthkit` côté iOS : New Arch compatible, plugin Expo, taille communauté équivalente.

### 1.3 Différences fonctionnelles Apple Health vs Health Connect

| Aspect                      | Apple Health (iOS)                                                   | Health Connect (Android)                                                                                                      |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Disponibilité               | Toujours présent (iOS 8+)                                            | Native sur Android 14+. App Play Store requise sur Android 9–13.                                                              |
| Prompt de permissions       | Une seule feuille système, multi-scopes                              | **Activité dédiée par session** d'autorisation, plus granulaire                                                               |
| Re-prompt                   | Impossible — l'utilisateur doit aller dans Réglages                  | Idem — redirection requise vers les réglages Health Connect                                                                   |
| Indication du scope accordé | Aucune (privacy by design)                                           | **API renvoie la liste des permissions effectivement accordées** ✅ — gros avantage UX                                        |
| Sleep stages                | `inBed`, `asleep`, `asleepCore`, `asleepDeep`, `asleepREM`, `awake`  | `STAGE_TYPE_AWAKE_IN_BED`, `STAGE_TYPE_SLEEPING`, `STAGE_TYPE_LIGHT`, `STAGE_TYPE_DEEP`, `STAGE_TYPE_REM`, `STAGE_TYPE_AWAKE` |
| Workouts / Exercise         | `WorkoutActivityType` (numérique, ~80 valeurs)                       | `ExerciseSessionRecord.EXERCISE_TYPE_*` (numérique, ~70 valeurs)                                                              |
| HRV                         | `HeartRateVariabilitySDNN` (ms)                                      | `HeartRateVariabilityRmssdRecord` (ms) — algorithme légèrement différent (RMSSD vs SDNN)                                      |
| Resting HR                  | `RestingHeartRate`                                                   | `RestingHeartRateRecord`                                                                                                      |
| Heart Rate                  | `HeartRate`                                                          | `HeartRateRecord` (séries de samples par session)                                                                             |
| Nutrition                   | Quantité par sample (calories, protéines, glucides, lipides séparés) | `NutritionRecord` agrège tous les nutriments dans un seul record ✅                                                           |
| Background sync             | `enableBackgroundDelivery` (HKObserverQuery)                         | API Health Connect ne supporte pas le polling en arrière-plan (uniquement WorkManager côté app)                               |

**Implications pour notre code :**

- La logique de processing (`processSleepData`, `processStressData`, `computeWorkoutIntensity`, etc.) est **réutilisable telle quelle** — elle opère sur des objets TS neutres.
- Les fetchers sont à réécrire avec les types Health Connect.
- Le mapping des types d'exercice et des stages de sommeil change (mais reste mécanique).
- Avantage Android : on peut **détecter précisément les permissions accordées** et afficher un message UX plus utile que le "silent denial" actuel d'iOS.

---

## 2. Architecture cible

### 2.1 Principe : abstraire derrière une interface neutre

Le code en amont (hook `useHealthKitSync`, store, debug sheet, button, score algorithm) ne doit pas savoir si la source est iOS ou Android. On extrait l'interface du `healthkitService` actuel et on fournit deux implémentations.

### 2.2 Renommage

Pour évacuer toute référence à Apple/HealthKit dans la couche cross-platform :

| Avant                                      | Après                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `src/shared/services/healthkit.service.ts` | `src/shared/services/health-sync/index.ts` (router)             |
| —                                          | `src/shared/services/health-sync/ios.ts` (iOS impl)             |
| —                                          | `src/shared/services/health-sync/android.ts` (Android impl)     |
| —                                          | `src/shared/services/health-sync/types.ts` (interface partagée) |
| `src/shared/types/healthkit.types.ts`      | `src/shared/types/health-sync.types.ts`                         |
| `src/shared/stores/healthkit.store.ts`     | `src/shared/stores/health-sync.store.ts`                        |
| `src/features/healthkit/`                  | `src/features/health-sync/`                                     |
| `useHealthKitSync`, `useHealthKitAutoSync` | `useHealthSync`, `useHealthSyncAutoSync`                        |
| i18n `healthkit.*`                         | `healthSync.*`                                                  |

Le renommage est mécanique mais touche ~15 fichiers. Aucune logique métier ne change.

### 2.3 Interface du service (contrat partagé)

```ts
// src/shared/services/health-sync/types.ts
export interface HealthSyncService {
  isAvailable(): boolean | Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  getGrantedPermissions?(): Promise<string[]>; // Android uniquement, optionnel
  probeNative(): Promise<NativeProbeResult>;
  getSleepSamples(start: Date, end: Date): Promise<HealthSleepSample[]>;
  getWorkouts(start: Date, end: Date): Promise<HealthWorkout[]>;
  getNutrition(date: Date): Promise<HealthNutrition | null>;
  getHeartRateSamples(start: Date, end: Date): Promise<HealthHeartSample[]>;
  getRestingHeartRateSamples(start: Date, end: Date): Promise<HealthHeartSample[]>;
  getHrvSamples(start: Date, end: Date): Promise<HealthHeartSample[]>;
  // Processing utils restent communs
  processSleepData: (samples: HealthSleepSample[], date: string) => ProcessedSleepData | null;
  processWorkouts: (workouts: HealthWorkout[], date: string) => ProcessedWorkoutData[];
  processNutrition: (nutrition: HealthNutrition, date: string) => ProcessedNutritionData;
  processStressData: (...) => ProcessedStressData[];
  computeWorkoutIntensity: (...) => SportIntensity;
  calculateAge: (birthday: string | null | undefined) => number | null;
}
```

### 2.4 Router

```ts
// src/shared/services/health-sync/index.ts
import { Platform } from 'react-native';
import { healthSyncIOS } from './ios';
import { healthSyncAndroid } from './android';

export const healthSyncService: HealthSyncService =
  Platform.OS === 'ios'
    ? healthSyncIOS
    : Platform.OS === 'android'
      ? healthSyncAndroid
      : noopService;
```

Tout le reste (hook, store, UI) consomme `healthSyncService` sans `Platform` check.

---

## 3. Implémentation Android

### 3.1 Dépendances

```bash
npm install react-native-health-connect
```

Pas de peer dep supplémentaire — la lib est self-contained.

### 3.2 Configuration Expo

Plugin dans [app.config.ts](../app.config.ts) :

```ts
plugins: [
  // ...
  [
    'react-native-health-connect',
    {
      package: process.env.BUNDLE_ID ?? 'com.skineasy.app',
      // Permissions à déclarer dans le Manifest
      permissions: [
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'RestingHeartRate' },
        { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'Nutrition' },
      ],
    },
  ],
],
```

Le plugin écrit dans le `AndroidManifest.xml` :

- `<uses-permission android:name="android.permission.health.READ_*" />` pour chaque type
- `<queries>` declaring the Health Connect package
- L'intent-filter `ACTION_SHOW_PERMISSIONS_RATIONALE` (obligatoire pour la conformité Play Store — Google rejette les apps qui demandent l'accès Health Connect sans ce filter)

### 3.3 Page de rationale (obligatoire)

Google exige un écran in-app expliquant **pourquoi** on accède aux données santé, accessible via l'intent `ACTION_SHOW_PERMISSIONS_RATIONALE`. Sans cet écran, **rejet du Play Store assuré**.

**Action requise** : route `/legal/health-permissions-rationale` (Expo Router) avec un texte explicatif + lien vers la politique de confidentialité. Listée dans `app.config.ts` via `intentFilters`.

Wording type :

> SkinEasy lit vos données de santé (sommeil, activité, fréquence cardiaque, nutrition) pour calculer votre score quotidien et personnaliser vos recommandations skincare. Aucune donnée n'est partagée avec des tiers. Vous pouvez révoquer l'accès à tout moment dans Health Connect.

### 3.4 Détection de Health Connect installé

Sur Android 9–13, l'app Health Connect doit être installée séparément. La lib expose un statut :

```ts
import { getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';

const status = await getSdkStatus();
// SDK_UNAVAILABLE → device trop vieux
// SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED → app Play Store à installer
// SDK_AVAILABLE → on peut continuer
```

UX :

- `SDK_AVAILABLE` → flow normal
- `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED` → bouton "Installer Health Connect" → `Linking.openURL('market://details?id=com.google.android.apps.healthdata')`
- `SDK_UNAVAILABLE` → message "Pas disponible sur cet appareil", désactiver la feature

### 3.5 Implémentation `health-sync/android.ts` (squelette)

```ts
import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

async function isAvailable() {
  const status = await getSdkStatus();
  return status === SdkAvailabilityStatus.SDK_AVAILABLE;
}

async function requestAuthorization() {
  await initialize();
  const granted = await requestPermission([
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'ExerciseSession' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'RestingHeartRate' },
    { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
    { accessType: 'read', recordType: 'TotalCaloriesBurned' },
    { accessType: 'read', recordType: 'Nutrition' },
  ]);
  return granted.length > 0;
}

async function getSleepSamples(startDate: Date, endDate: Date) {
  const { records } = await readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    },
  });
  // Health Connect groupe les stages par session → on les aplatit pour matcher notre format
  return records.flatMap((session) =>
    session.stages.map((stage) => ({
      startDate: stage.startTime,
      endDate: stage.endTime,
      value: mapHCSleepStage(stage.stage),
    })),
  );
}

// Mapping enums HC → notre SleepValue
function mapHCSleepStage(hcStage: number): SleepValue {
  switch (hcStage) {
    case 1:
      return 'AWAKE'; // STAGE_TYPE_AWAKE
    case 2:
      return 'ASLEEP'; // STAGE_TYPE_SLEEPING (legacy)
    case 3:
      return 'INBED'; // STAGE_TYPE_OUT_OF_BED
    case 4:
      return 'CORE'; // STAGE_TYPE_LIGHT
    case 5:
      return 'DEEP'; // STAGE_TYPE_DEEP
    case 6:
      return 'REM'; // STAGE_TYPE_REM
    case 7:
      return 'INBED'; // STAGE_TYPE_AWAKE_IN_BED
    default:
      return 'ASLEEP';
  }
}

// ... idem pour workouts, heart rate, HRV, resting HR, nutrition
```

### 3.6 Mapping des types d'exercice (Health Connect → SportType)

Health Connect utilise `EXERCISE_TYPE_*` numérique. Mapping vers nos `SportType` :

| HC Code | HC Constant                                      | App Sport Type |
| ------- | ------------------------------------------------ | -------------- |
| 8       | `EXERCISE_TYPE_BIKING`                           | cycling        |
| 13      | `EXERCISE_TYPE_DANCING`                          | dancing        |
| 21      | `EXERCISE_TYPE_HIKING`                           | hiking         |
| 56      | `EXERCISE_TYPE_RUNNING`                          | running        |
| 67      | `EXERCISE_TYPE_STRENGTH_TRAINING`                | strength       |
| 74      | `EXERCISE_TYPE_SWIMMING_POOL`                    | swimming       |
| 75      | `EXERCISE_TYPE_SWIMMING_OPEN_WATER`              | swimming       |
| 81      | `EXERCISE_TYPE_YOGA`                             | yoga           |
| 50      | `EXERCISE_TYPE_PILATES`                          | pilates        |
| 25      | `EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING` | cardio         |
| Other   | —                                                | other          |

Liste à compléter en référence : [Health Connect ExerciseSessionRecord docs](https://developer.android.com/reference/androidx/health/connect/client/records/ExerciseSessionRecord).

### 3.7 HRV : SDNN (iOS) vs RMSSD (Android)

iOS expose `HeartRateVariabilitySDNN`, Android expose `HeartRateVariabilityRmssd`. Les deux mesurent la même chose (variabilité) avec des algorithmes différents :

- **SDNN** = écart-type des intervalles RR
- **RMSSD** = root mean square des différences successives

Pour notre dérivation de stress (qui compare la valeur du jour à la baseline 7j), **les deux fonctionnent** : on compare une valeur HRV à sa propre baseline, peu importe l'algo. Pas de conversion nécessaire — `HealthHeartSample.value` reste un nombre, le calcul de score est identique.

### 3.8 Nutrition

Health Connect agrège tout dans un `NutritionRecord` :

```ts
const { records } = await readRecords('Nutrition', { timeRangeFilter: {...} });
// Chaque record : { energy: { inKilocalories }, protein: { inGrams }, totalCarbohydrate: { inGrams }, totalFat: { inGrams } }
```

Plus simple qu'iOS où chaque macronutriment est un quantity type séparé.

---

## 4. Plan de migration / refactor

### 4.1 Étape 1 — Renommage (PR isolée, pas de change fonctionnel)

Renommer en respectant le tableau §2.2. Tout vert (typecheck + lint + tests). Aucun changement de comportement.

**Effort : 0.5 jour.**

### 4.2 Étape 2 — Extraction du contrat

1. Créer `src/shared/services/health-sync/types.ts` avec `HealthSyncService` interface.
2. Renommer le service iOS actuel en `health-sync/ios.ts`, le faire implémenter l'interface.
3. Créer le router `health-sync/index.ts`.
4. Mettre à jour les imports.
5. Vérifier sur device iOS que tout fonctionne identique.

**Effort : 0.5 jour.**

### 4.3 Étape 3 — Implémentation Android

1. Installer `react-native-health-connect`.
2. Configurer le plugin dans `app.config.ts`.
3. Créer la page de rationale (Expo Router).
4. Implémenter `health-sync/android.ts`.
5. Tester sur device Android (Android 14 d'abord, puis 9–13 avec Health Connect Play Store).
6. Ajustements de mapping (sleep stages, exercise types).

**Effort : 1.5 jour.**

### 4.4 Étape 4 — UX différentielle

1. Détection `SDK_AVAILABLE` au démarrage / dans le bouton de sync.
2. Banner "Installer Health Connect" si manquant.
3. Utiliser `getGrantedPermissions` pour afficher un statut **précis** (vs le silent denial iOS) : "Sommeil ✅ Workouts ❌ — appuyer pour autoriser Workouts".
4. Adapter les copies i18n FR/EN (`healthSync.*`).

**Effort : 0.5 jour.**

### 4.5 Étape 5 — Tests + EAS build

1. Build de dev Android via EAS.
2. Smoke test : prompt s'affiche, données remontent, indicateurs se rafraîchissent.
3. Test sur Android < 14 (Health Connect via Play Store).
4. Test refus → bouton settings deep-link fonctionne.

**Effort : 0.5 jour.**

### 4.6 Total

**~3.5 jours** d'effort (peut tomber à 2.5 si pas de surprise sur le device Android).

---

## 5. Risques & ouvertures

| Risque                                                          | Mitigation                                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Rejet Play Store par non-conformité (rationale screen manquant) | Implémenter dès l'étape 3, valider avec un upload de test interne avant prod.                       |
| Mapping des `ExerciseType` incomplet                            | Démarrer avec les 10 types les plus probables. Le fallback `'other'` couvre le reste.               |
| HRV RMSSD vs SDNN donne des seuils différents                   | Notre algo se base sur la baseline relative. Pas de conversion. Vérifier post-launch quand même.    |
| Tests difficiles sans device Android                            | Pixel emulator ne supporte pas Health Connect. **Device physique requis.**                          |
| Devices Android < 9 (~5% du parc encore)                        | Catégoriser comme "non supporté", désactiver la feature gracieusement.                              |
| Background sync impossible sur Android                          | Inhérent à Health Connect. Comportement identique à notre stratégie iOS actuelle (foreground only). |

## 6. Décisions à valider

- [ ] **Naming** : retenir `health-sync` comme terme cross-platform ? (alternative : `journal-auto-fill`)
- [ ] **Onboarding** : afficher une étape unifiée sur les deux plateformes, ou conditionner par OS ?
- [ ] **Page de rationale** : route dédiée ou réutiliser la page Privacy Policy ?
- [ ] **Priorité** : faire l'Android maintenant ou attendre une masse critique d'users Android ?

---

## Sources

- [react-native-health-connect (matinzd) — npm](https://www.npmjs.com/package/react-native-health-connect)
- [react-native-health-connect — GitHub](https://github.com/matinzd/react-native-health-connect)
- [react-native-health-connect — docs](https://matinzd.github.io/react-native-health-connect/docs/intro/)
- [Health Connect Android docs](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Google Fit deprecation announcement](https://developers.google.com/fit/android/get-api-key)
