# Product typeContent Feature

## Overview

Products in routine responses now include a `typeContent` field with rich information about product usage, application, and ingredients.

## API Response

```json
{
  "products": {
    "nettoyant": [
      {
        "id": 10,
        "name": "Huile nettoyante",
        "type": "Huile démaquillante nettoyante",
        "typeContent": {
          "title": "MON HUILE DÉMAQUILLANTE",
          "subtitle": "Cette huile démaquillante...",
          "description": "<p>Un démaquillant qui fait super bien son job...</p>",
          "howToUse": "<ol><li>Dépose une petite quantité...</li></ol>",
          "application": "Sur peau sèche",
          "frequency": "Tous les soirs où tu rentres maquillé.e",
          "badge": "Démaquillage express",
          "keyIngredient": "",
          "irritationPotential": ""
        }
      }
    ]
  }
}
```

## TypeContentDto Interface

```typescript
interface TypeContentDto {
  title: string;
  subtitle: string;
  description: string; // HTML content
  howToUse: string; // HTML content
  application: string;
  frequency: string;
  badge: string;
  keyIngredient: string;
  irritationPotential: string;
}
```

## UI Implementation

### Inline Display (RoutineStepCard)

- Shows `application` text below product name in muted style
- Tap product to open detail sheet
- ChevronRight icon indicates product is clickable

### Category Ordinal Labels

When multiple steps share the same category (e.g., two "nettoyant" steps), they display ordinal prefixes:

- "Premier nettoyant" (First cleanser)
- "Second nettoyant" (Second cleanser)

Logic computed in `RoutineResultsScreen.tsx` using `useMemo`:

1. Count occurrences of each category
2. Track which occurrence each step is (1st, 2nd)
3. Pass `categoryOccurrence` and `totalCategoryCount` to `RoutineStepCard`

### Product Detail Sheet (ProductDetailSheet)

Full bottom sheet modal displaying:

1. **Header**: Product image, badge pill, title, subtitle, brand
2. **Application & Frequency**: Side-by-side info boxes
3. **Description**: HTML rendered content
4. **How to Use**: HTML rendered in highlighted box
5. **Key Ingredient & Irritation**: Displayed if present
6. **Buy Button**: Links to `product.url` if available

## Files

| File                                                     | Purpose                             |
| -------------------------------------------------------- | ----------------------------------- |
| `src/features/routine/types/routine.types.ts`            | TypeContentDto + ProductDto types   |
| `src/features/routine/components/ProductDetailSheet.tsx` | Bottom sheet modal                  |
| `src/features/routine/components/RoutineStepCard.tsx`    | Inline display + tap + chevron icon |
| `src/features/routine/screens/RoutineResultsScreen.tsx`  | Ordinal category computation        |
| `src/i18n/locales/fr.json`                               | French translations                 |
| `src/i18n/locales/en.json`                               | English translations                |

## Dependencies

- `react-native-render-html` - For rendering HTML content in description/howToUse

## Translations

```
routine.ordinal.first
routine.ordinal.second
routine.productDetail.howToUse
routine.productDetail.frequency
routine.productDetail.application
routine.productDetail.keyIngredient
routine.productDetail.irritation
routine.productDetail.buy
```
