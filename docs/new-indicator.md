# Observations Indicator

New journal indicator allowing users to log daily skin observations.

## Overview

- **One entry per day** (like sleep/stress - upsert behavior)
- User can select multiple **positive points** AND multiple **negative points**
- Each point is a predefined constant (not enum)

---

## Data Model

### Positive Points

| Key            | Label (EN)    | Label (FR)       | Lucide Icon   |
| -------------- | ------------- | ---------------- | ------------- |
| `skinHydrated` | Hydrated skin | Peau hydratee    | `Droplet`     |
| `fewerPimples` | Fewer pimples | Moins de boutons | `CircleOff`   |
| `glowingSkin`  | Glowing skin  | Peau lumineuse   | `Sun`         |
| `smootherSkin` | Smoother skin | Peau plus lisse  | `AlignCenter` |

### Negative Points

| Key                 | Label (EN)              | Label (FR)                        | Lucide Icon   |
| ------------------- | ----------------------- | --------------------------------- | ------------- |
| `acne`              | Acne                    | Acne                              | `CircleDot`   |
| `excessSebum`       | Excess sebum            | Exces de sebum                    | `Flame`       |
| `atopicSkin`        | Atopic skin (eczema...) | Peau atopique (eczema, psoriasis) | `AlertCircle` |
| `roughTexture`      | Rough texture           | Peau rugueuse ou texture          | `Waves`       |
| `redness`           | Redness                 | Rougeurs                          | `Droplets`    |
| `blackheads`        | Blackheads              | Points noirs                      | `Grid3X3`     |
| `drySkin`           | Dry skin                | Secheresse cutanee                | `Leaf`        |
| `hyperpigmentation` | Hyperpigmentation spots | Taches d'hyperpigmentation        | `Circle`      |
| `sensitiveSkin`     | Sensitive skin          | Peau sensible                     | `ShieldAlert` |
| `wrinkles`          | Wrinkles and fine lines | Rides et ridules                  | `Activity`    |
| `dullComplexion`    | Dull complexion         | Teint terne                       | `Cloud`       |

---

## Constants Definition

```typescript
// src/features/journal/constants/observations.ts

export const POSITIVE_OBSERVATIONS = [
  'skinHydrated',
  'fewerPimples',
  'glowingSkin',
  'smootherSkin',
] as const;

export const NEGATIVE_OBSERVATIONS = [
  'acne',
  'excessSebum',
  'atopicSkin',
  'roughTexture',
  'redness',
  'blackheads',
  'drySkin',
  'hyperpigmentation',
  'sensitiveSkin',
  'wrinkles',
  'dullComplexion',
] as const;

export type PositiveObservation = (typeof POSITIVE_OBSERVATIONS)[number];
export type NegativeObservation = (typeof NEGATIVE_OBSERVATIONS)[number];
```

---

## API Contract

Following existing patterns (sleep, stress).

### Endpoints

```
GET  /api/v1/journal/observations?date=YYYY-MM-DD  -> ObservationEntry[]
PUT  /api/v1/journal/observation/upsert            -> ObservationUpsertResponse
DELETE /api/v1/journal/observation/:id             -> void
```

### Types

```typescript
// src/shared/types/journal.types.ts

export interface ObservationEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC: "2025-01-15T00:00:00.000Z"
  positives: PositiveObservation[]; // e.g. ["skinHydrated", "fewerPimples"]
  negatives: NegativeObservation[]; // e.g. ["acne", "excessSebum"]
  created_at: string;
}

export interface CreateObservationEntryDto {
  date: string; // ISO 8601 UTC
  positives: PositiveObservation[];
  negatives: NegativeObservation[];
}

export interface ObservationUpsertResponse {
  data: ObservationEntry;
  created: boolean;
}
```

---

## UI Behavior

### Selection States

All items use `GlassContainer` component.

| State                 | Background                       | Text/Icon Color   |
| --------------------- | -------------------------------- | ----------------- |
| Unselected (positive) | Default glass (transparent tint) | `textMuted`       |
| Selected (positive)   | Brown translucent glass tint     | `primary` (brown) |
| Unselected (negative) | Default glass (transparent tint) | `textMuted`       |
| Selected (negative)   | Red translucent glass tint       | `secondary` (red) |

### Color Values (from `colors.ts`)

- Brown selected: `tintColor={colors.background}` + `text-primary`
- Red selected: `tintColor={'rgba(232, 76, 63, 0.15)'}` + `text-secondary`

### Layout

Per mockup:

- Section headers with +/- icons: "Les points positifs" / "Les points negatifs"
- Chips in horizontal flex-wrap layout
- Each chip: icon + label (horizontal variant)

---

## Files to Create/Modify

### New Files

1. `src/features/journal/constants/observations.ts` - Constants
2. `src/features/journal/screens/ObservationsScreen.tsx` - Main screen
3. `src/features/journal/hooks/useObservations.ts` - Query/mutation hooks
4. `src/features/journal/components/ObservationChip.tsx` - Selectable chip component

### Modify

1. `src/shared/types/journal.types.ts` - Add types
2. `src/features/journal/schemas/journal.schema.ts` - Add Zod schema
3. `src/features/journal/services/journal.service.ts` - Add observation service
4. `src/shared/config/queryKeys.ts` - Add query key
5. `src/i18n/locales/en.json` + `fr.json` - Add translations
6. `app/(tabs)/journal/observations.tsx` - Route file

---

## Validation Rules

- **Save button disabled** until at least 1 point selected (positive OR negative)
- Form valid when: `positives.length > 0 || negatives.length > 0`

---

## Implementation Notes

- **Blocked until backend ready** - no mock data
- One entry per day (upsert behavior like sleep/stress)
- Lucide icons finalized in data model above
