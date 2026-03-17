# API Documentation: GET /api/v1/routine/last

Retrieve the authenticated user's most recent skincare routine.

---

## Endpoint

```
GET /api/v1/routine/last
```

## Authentication

**Required**: Yes (JWT Bearer Token)

```
Authorization: Bearer <access_token>
```

## Description

Returns the most recently created active routine for the authenticated user. The search strategy is:

1. First, search by `customer_id` (user's account ID)
2. If not found, fallback to search by `email`

This ensures users can find routines they created before account linking.

---

## Request

### Headers

| Header          | Type   | Required | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| `Authorization` | string | Yes      | Bearer token from login       |
| `Content-Type`  | string | No       | Not required for GET requests |

### Query Parameters

None

### Request Body

None

---

## Response

### Success Response (200 OK)

```json
{
  "data": {
    "id": "api_m5x8k2_abc123",
    "email": "user@example.com",
    "customerId": 123,
    "createdAt": "2025-12-29T10:30:00.000Z",
    "analysis": {
      "skinType": {
        "primaryType": "mixte_normale_grasse",
        "label": "Mixte Normale-Grasse",
        "confidence": 85
      },
      "skinStates": {
        "states": ["sensible", "deshydratee"],
        "labels": ["Peau sensible", "Peau déshydratée"]
      },
      "healthConditions": {
        "conditions": ["enceinte"],
        "hasRestrictions": true,
        "isPregnancySafe": true
      }
    },
    "productSelection": {
      "products": {
        "nettoyant": {
          "id": 42,
          "name": "Gel Moussant Doux",
          "price": 18.5,
          "brand": "La Roche-Posay",
          "type": "Nettoyant",
          "illustration": "1726942218.png",
          "illustrationUrl": "https://skineasy.com/img/routineproducts/1726942218.png"
        },
        "serum": {
          "id": 156,
          "name": "Sérum Hydratant Intensif",
          "price": 32.0,
          "brand": "The Ordinary",
          "type": "Sérum",
          "illustration": "1726942300.png",
          "illustrationUrl": "https://skineasy.com/img/routineproducts/1726942300.png"
        },
        "creme_jour": {
          "id": 89,
          "name": "Crème Hydratante Légère",
          "price": 24.0,
          "brand": "La Roche-Posay",
          "type": "Hydratant",
          "illustration": "1726942350.png",
          "illustrationUrl": "https://skineasy.com/img/routineproducts/1726942350.png"
        },
        "creme_solaire": {
          "id": 203,
          "name": "Fluide Solaire SPF50",
          "price": 16.0,
          "brand": "La Roche-Posay",
          "type": "Protection solaire",
          "illustration": "1726942400.png",
          "illustrationUrl": "https://skineasy.com/img/routineproducts/1726942400.png"
        },
        "demaquillant": null,
        "tonique": null,
        "exfoliant": null,
        "contour_yeux": null,
        "creme_nuit": null,
        "masque": null,
        "huile": null,
        "brume": null,
        "baume": null,
        "gadgets": null,
        "complements": null
      },
      "totalPrice": 90.5,
      "productCount": 4,
      "brandCohesionApplied": true
    },
    "routinePlan": {
      "weeklySchedule": [
        {
          "dayOfWeek": 0,
          "dayName": "Lundi",
          "morning": {
            "steps": [
              {
                "order": 1,
                "category": "nettoyant",
                "estimatedMinutes": 1
              },
              {
                "order": 2,
                "category": "serum",
                "estimatedMinutes": 1
              },
              {
                "order": 3,
                "category": "creme_jour",
                "estimatedMinutes": 1
              },
              {
                "order": 4,
                "category": "creme_solaire",
                "estimatedMinutes": 1
              }
            ],
            "estimatedMinutes": 4
          },
          "evening": {
            "steps": [
              {
                "order": 1,
                "category": "nettoyant",
                "estimatedMinutes": 1
              },
              {
                "order": 2,
                "category": "serum",
                "estimatedMinutes": 1
              }
            ],
            "estimatedMinutes": 2
          }
        }
        // ... 6 more days (Mardi through Dimanche)
      ],
      "productUsage": [
        {
          "category": "nettoyant",
          "timesPerWeek": 14,
          "usedInMorning": true,
          "usedInEvening": true
        },
        {
          "category": "serum",
          "timesPerWeek": 14,
          "usedInMorning": true,
          "usedInEvening": true
        },
        {
          "category": "creme_jour",
          "timesPerWeek": 7,
          "usedInMorning": true,
          "usedInEvening": false
        },
        {
          "category": "creme_solaire",
          "timesPerWeek": 7,
          "usedInMorning": true,
          "usedInEvening": false
        }
      ]
    },
    "summary": {
      "skinTypeLabel": "Mixte Normale-Grasse",
      "primaryConcerns": ["Peau sensible", "Peau déshydratée"],
      "hasRestrictions": true,
      "totalProducts": 4,
      "totalPrice": 90.5,
      "averageDailyMinutes": 6,
      "brandCohesionApplied": true
    }
  }
}
```

### Error Responses

#### 401 Unauthorized

No token or invalid token provided.

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 404 Not Found

No routine found for this user.

```json
{
  "statusCode": 404,
  "message": "No routine found for user"
}
```

---

## Data Types Reference

### RoutineResponseDto

| Field              | Type                          | Nullable | Description                                   |
| ------------------ | ----------------------------- | -------- | --------------------------------------------- |
| `id`               | `string`                      | No       | Unique routine ID (e.g., `api_m5x8k2_abc123`) |
| `email`            | `string`                      | No       | User's email address                          |
| `customerId`       | `number`                      | Yes      | PrestaShop customer ID (if linked)            |
| `createdAt`        | `string` (ISO 8601)           | No       | Routine creation timestamp                    |
| `analysis`         | `SkinAnalysisResponseDto`     | No       | Skin analysis results                         |
| `productSelection` | `ProductSelectionResponseDto` | No       | Selected products for the routine             |
| `routinePlan`      | `RoutinePlanResponseDto`      | No       | Weekly schedule and usage plan                |
| `summary`          | `RoutineSummaryResponseDto`   | No       | Quick summary of the routine                  |

---

### SkinAnalysisResponseDto

| Field              | Type                          | Description                             |
| ------------------ | ----------------------------- | --------------------------------------- |
| `skinType`         | `SkinTypeResponseDto`         | Primary skin type analysis              |
| `skinStates`       | `SkinStateResponseDto`        | Detected skin conditions                |
| `healthConditions` | `HealthConditionsResponseDto` | Health factors affecting product choice |

#### SkinTypeResponseDto

| Field         | Type       | Description                           |
| ------------- | ---------- | ------------------------------------- |
| `primaryType` | `SkinType` | Skin type identifier (see enum below) |
| `label`       | `string`   | French display label                  |
| `confidence`  | `number`   | Confidence score (0-100)              |

**SkinType Enum Values:**

| Value                  | Label (FR)           |
| ---------------------- | -------------------- |
| `tres_seche`           | Très Sèche           |
| `seche`                | Sèche                |
| `normale`              | Normale              |
| `mixte_normale_grasse` | Mixte Normale-Grasse |
| `mixte_seche_grasse`   | Mixte Sèche-Grasse   |
| `grasse`               | Grasse               |
| `tres_grasse`          | Très Grasse          |
| `generique`            | Générique            |

#### SkinStateResponseDto

| Field    | Type              | Description                   |
| -------- | ----------------- | ----------------------------- |
| `states` | `SkinStateType[]` | Array of detected skin states |
| `labels` | `string[]`        | French labels for display     |

**SkinStateType Enum Values:**

| Value            | Label (FR)     | Description              |
| ---------------- | -------------- | ------------------------ |
| `sensible`       | Sensible       | Reactive skin            |
| `tres_sensible`  | Très Sensible  | Highly reactive skin     |
| `mature`         | Mature         | Aging skin with wrinkles |
| `atopique`       | Atopique       | Eczema-prone skin        |
| `deshydratee`    | Déshydratée    | Lacking water (not oil)  |
| `acneique`       | Acnéique       | Acne-prone skin          |
| `acne_hormonale` | Acné Hormonale | Hormonal acne            |

#### HealthConditionsResponseDto

| Field             | Type       | Description                              |
| ----------------- | ---------- | ---------------------------------------- |
| `conditions`      | `string[]` | Detected health conditions               |
| `hasRestrictions` | `boolean`  | Whether product restrictions apply       |
| `isPregnancySafe` | `boolean`  | Whether routine is safe during pregnancy |

---

### ProductSelectionResponseDto

| Field                  | Type                                                  | Description                                          |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `products`             | `Record<ProductCategory, ProductResponseDto \| null>` | Products by category (null if not selected)          |
| `totalPrice`           | `number`                                              | Total price in EUR                                   |
| `productCount`         | `number`                                              | Number of selected products                          |
| `brandCohesionApplied` | `boolean`                                             | Whether brand cohesion was applied (50%+ same brand) |

#### ProductResponseDto

| Field             | Type             | Description                      |
| ----------------- | ---------------- | -------------------------------- |
| `id`              | `number`         | Product ID in database           |
| `name`            | `string`         | Product name                     |
| `price`           | `number`         | Price in EUR                     |
| `brand`           | `string \| null` | Brand name                       |
| `type`            | `string \| null` | Product type (e.g., "Nettoyant") |
| `illustration`    | `string \| null` | Image filename                   |
| `illustrationUrl` | `string`         | Full image URL                   |

**ProductCategory Enum Values:**

| Value           | Label (FR)         | Routine Step | Essential |
| --------------- | ------------------ | ------------ | --------- |
| `demaquillant`  | Démaquillant       | evening      | No        |
| `nettoyant`     | Nettoyant          | both         | **Yes**   |
| `tonique`       | Tonique            | both         | No        |
| `exfoliant`     | Exfoliant          | weekly       | No        |
| `serum`         | Sérum              | both         | No        |
| `contour_yeux`  | Contour des yeux   | both         | No        |
| `creme_jour`    | Crème de jour      | morning      | **Yes**   |
| `creme_nuit`    | Crème de nuit      | evening      | No        |
| `creme_solaire` | Protection solaire | morning      | **Yes**   |
| `masque`        | Masque             | weekly       | No        |
| `huile`         | Huile visage       | evening      | No        |
| `brume`         | Brume              | both         | No        |
| `baume`         | Baume              | evening      | No        |
| `gadgets`       | Accessoires        | weekly       | No        |
| `complements`   | Compléments        | both         | No        |

---

### RoutinePlanResponseDto

| Field            | Type                        | Description                    |
| ---------------- | --------------------------- | ------------------------------ |
| `weeklySchedule` | `DailyRoutineResponseDto[]` | 7 days of routine schedules    |
| `productUsage`   | `ProductUsageResponseDto[]` | How often each product is used |

#### DailyRoutineResponseDto

| Field       | Type                     | Description            |
| ----------- | ------------------------ | ---------------------- |
| `dayOfWeek` | `number`                 | 0 = Monday, 6 = Sunday |
| `dayName`   | `string`                 | French day name        |
| `morning`   | `TimeRoutineResponseDto` | Morning routine steps  |
| `evening`   | `TimeRoutineResponseDto` | Evening routine steps  |

**dayName Values:**

| dayOfWeek | dayName  |
| --------- | -------- |
| 0         | Lundi    |
| 1         | Mardi    |
| 2         | Mercredi |
| 3         | Jeudi    |
| 4         | Vendredi |
| 5         | Samedi   |
| 6         | Dimanche |

#### TimeRoutineResponseDto

| Field              | Type                       | Description           |
| ------------------ | -------------------------- | --------------------- |
| `steps`            | `RoutineStepResponseDto[]` | Ordered list of steps |
| `estimatedMinutes` | `number`                   | Total estimated time  |

#### RoutineStepResponseDto

| Field              | Type              | Description                                                              |
| ------------------ | ----------------- | ------------------------------------------------------------------------ |
| `order`            | `number`          | Step order (1, 2, 3...)                                                  |
| `category`         | `ProductCategory` | Product category - use to look up product in `productSelection.products` |
| `estimatedMinutes` | `number`          | Estimated time for this step                                             |

#### ProductUsageResponseDto

| Field           | Type              | Description                     |
| --------------- | ----------------- | ------------------------------- |
| `category`      | `ProductCategory` | Product category reference      |
| `timesPerWeek`  | `number`          | Total uses per week             |
| `usedInMorning` | `boolean`         | Whether used in morning routine |
| `usedInEvening` | `boolean`         | Whether used in evening routine |

---

### RoutineSummaryResponseDto

| Field                  | Type       | Description                          |
| ---------------------- | ---------- | ------------------------------------ |
| `skinTypeLabel`        | `string`   | Skin type in French                  |
| `primaryConcerns`      | `string[]` | Main skin concerns (French labels)   |
| `hasRestrictions`      | `boolean`  | Whether health restrictions apply    |
| `totalProducts`        | `number`   | Number of products in routine        |
| `totalPrice`           | `number`   | Total price in EUR                   |
| `averageDailyMinutes`  | `number`   | Average routine time per day         |
| `brandCohesionApplied` | `boolean`  | Whether 50%+ products are same brand |

---

## Frontend Implementation Guide

### 1. Fetching the Routine

```typescript
interface RoutineResponse {
  data: RoutineResponseDto;
}

async function fetchLastRoutine(accessToken: string): Promise<RoutineResponseDto | null> {
  try {
    const response = await fetch('/api/v1/routine/last', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 404) {
      return null; // No routine exists
    }

    if (!response.ok) {
      throw new Error('Failed to fetch routine');
    }

    const { data } = (await response.json()) as RoutineResponse;
    return data;
  } catch (error) {
    console.error('Error fetching routine:', error);
    throw error;
  }
}
```

### 2. Getting Today's Routine

```typescript
function getTodayRoutine(routine: RoutineResponseDto) {
  const today = new Date().getDay();
  // Convert JS day (0=Sunday) to our format (0=Monday)
  const dayOfWeek = today === 0 ? 6 : today - 1;

  return routine.routinePlan.weeklySchedule.find((day) => day.dayOfWeek === dayOfWeek);
}
```

### 3. Getting Product Details for a Step

```typescript
function getProductForStep(
  routine: RoutineResponseDto,
  step: RoutineStepResponseDto,
): ProductResponseDto | null {
  return routine.productSelection.products[step.category] ?? null;
}
```

### 4. Displaying Morning/Evening Routine

```typescript
function renderRoutineSteps(routine: RoutineResponseDto, timeRoutine: TimeRoutineResponseDto) {
  return timeRoutine.steps.map((step) => {
    const product = getProductForStep(routine, step);

    return {
      order: step.order,
      productName: product?.name ?? 'Unknown',
      productImage: product?.illustrationUrl ?? '',
      productBrand: product?.brand ?? '',
      productPrice: product?.price ?? 0,
      estimatedMinutes: step.estimatedMinutes,
    };
  });
}
```

### 5. TypeScript Interfaces

```typescript
// Copy these interfaces to your frontend codebase

type SkinType =
  | 'tres_seche'
  | 'seche'
  | 'normale'
  | 'mixte_normale_grasse'
  | 'mixte_seche_grasse'
  | 'grasse'
  | 'tres_grasse'
  | 'generique';

type SkinStateType =
  | 'sensible'
  | 'tres_sensible'
  | 'mature'
  | 'atopique'
  | 'deshydratee'
  | 'acneique'
  | 'acne_hormonale';

type ProductCategory =
  | 'demaquillant'
  | 'nettoyant'
  | 'tonique'
  | 'exfoliant'
  | 'serum'
  | 'contour_yeux'
  | 'creme_jour'
  | 'creme_nuit'
  | 'creme_solaire'
  | 'masque'
  | 'huile'
  | 'brume'
  | 'baume'
  | 'gadgets'
  | 'complements';

interface ProductResponseDto {
  id: number;
  name: string;
  price: number;
  brand: string | null;
  type: string | null;
  illustration: string | null;
  illustrationUrl: string;
}

interface SkinTypeResponseDto {
  primaryType: SkinType;
  label: string;
  confidence: number;
}

interface SkinStateResponseDto {
  states: SkinStateType[];
  labels: string[];
}

interface HealthConditionsResponseDto {
  conditions: string[];
  hasRestrictions: boolean;
  isPregnancySafe: boolean;
}

interface SkinAnalysisResponseDto {
  skinType: SkinTypeResponseDto;
  skinStates: SkinStateResponseDto;
  healthConditions: HealthConditionsResponseDto;
}

interface ProductSelectionResponseDto {
  products: Record<ProductCategory, ProductResponseDto | null>;
  totalPrice: number;
  productCount: number;
  brandCohesionApplied: boolean;
}

interface RoutineStepResponseDto {
  order: number;
  category: ProductCategory;
  estimatedMinutes: number;
}

interface TimeRoutineResponseDto {
  steps: RoutineStepResponseDto[];
  estimatedMinutes: number;
}

interface DailyRoutineResponseDto {
  dayOfWeek: number;
  dayName: string;
  morning: TimeRoutineResponseDto;
  evening: TimeRoutineResponseDto;
}

interface ProductUsageResponseDto {
  category: ProductCategory;
  timesPerWeek: number;
  usedInMorning: boolean;
  usedInEvening: boolean;
}

interface RoutinePlanResponseDto {
  weeklySchedule: DailyRoutineResponseDto[];
  productUsage: ProductUsageResponseDto[];
}

interface RoutineSummaryResponseDto {
  skinTypeLabel: string;
  primaryConcerns: string[];
  hasRestrictions: boolean;
  totalProducts: number;
  totalPrice: number;
  averageDailyMinutes: number;
  brandCohesionApplied: boolean;
}

interface RoutineResponseDto {
  id: string;
  email: string;
  customerId?: number;
  createdAt: string;
  analysis: SkinAnalysisResponseDto;
  productSelection: ProductSelectionResponseDto;
  routinePlan: RoutinePlanResponseDto;
  summary: RoutineSummaryResponseDto;
}
```

---

## Postman Collection

### Request

```
GET http://localhost:3000/api/v1/routine/last
```

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Success Response (200)

See full response structure above.

### Test Script

```javascript
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

pm.test('Response has data object', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
});

pm.test('Routine has required fields', function () {
  const routine = pm.response.json().data;
  pm.expect(routine).to.have.property('id');
  pm.expect(routine).to.have.property('email');
  pm.expect(routine).to.have.property('createdAt');
  pm.expect(routine).to.have.property('analysis');
  pm.expect(routine).to.have.property('productSelection');
  pm.expect(routine).to.have.property('routinePlan');
  pm.expect(routine).to.have.property('summary');
});

pm.test('createdAt is valid ISO date', function () {
  const routine = pm.response.json().data;
  const date = new Date(routine.createdAt);
  pm.expect(date.toISOString()).to.equal(routine.createdAt);
});

pm.test('Products structure is correct', function () {
  const products = pm.response.json().data.productSelection.products;
  pm.expect(products).to.have.property('nettoyant');
  pm.expect(products).to.have.property('serum');
  pm.expect(products).to.have.property('creme_jour');
});
```

---

## Notes

1. **Product Images**: All product images are served from `https://skineasy.com/img/routineproducts/`. The `illustrationUrl` field contains the complete URL.

2. **Null Products**: A category with `null` means no product was selected for that category. This is normal - not all categories are required.

3. **Step Reference**: In `routinePlan.weeklySchedule`, each step contains a `category` field. Use this to look up the actual product in `productSelection.products[category]`.

4. **Days**: `dayOfWeek` uses Monday=0 to Sunday=6 (not JavaScript's Sunday=0 convention).

5. **Brand Cohesion**: When `brandCohesionApplied` is `true`, it means 50%+ of products are from the same brand for a more cohesive routine.
