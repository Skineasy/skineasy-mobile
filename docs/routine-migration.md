# Routine Migration Plan

> Separate from main Supabase migration. Covers: product catalog, product type content, routines, questionnaire, Typeform webhook.
>
> No legacy PrestaShop data is kept. Clean schema, fresh data.

---

## 1. Tables

### 1.1 `skincare_products`

Product catalog used by the routine generation algorithm.

```sql
CREATE TABLE skincare_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  price numeric(10,2),
  url text,
  inci text,
  actifs text,
  contenance text,
  origin text,
  engagement text,
  feature text,
  skin text,
  website text,
  fonction text,
  carnation text,
  application text,
  type text,
  skinstate text,
  illustration text, -- filename only, full URL built client-side or in Edge Function
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_skincare_products_type ON skincare_products(type);
CREATE INDEX idx_skincare_products_skinstate ON skincare_products(skinstate);
CREATE INDEX idx_skincare_products_active ON skincare_products(active);
```

**RLS**: SELECT for `authenticated`. Write via admin/service_role only.

**Data source**: To be populated fresh (CSV import, backoffice, or manual seed). No MySQL migration -- old PrestaShop product data is discarded.

### 1.2 `product_type_content`

Educational content per product category (how to use, key ingredients, etc.). Used to enrich routine display.

```sql
CREATE TABLE product_type_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- e.g. 'nettoyant', 'serum', 'creme_jour'
  -- French
  title text,
  subtitle text,
  description text,
  how_to_use text,
  application text,
  frequency text,
  badge text,
  key_ingredient text,
  irritation_potential text,
  -- English
  title_en text,
  subtitle_en text,
  description_en text,
  how_to_use_en text,
  application_en text,
  frequency_en text,
  badge_en text,
  key_ingredient_en text,
  irritation_potential_en text,
  created_at timestamptz DEFAULT now()
);
```

**RLS**: SELECT for `authenticated`. Write via admin/service_role only.

**Data source**: Fresh seed. Content can be improved/rewritten during migration.

### 1.3 `routines`

One routine per user (latest is active). Hybrid approach: `analysis` as jsonb (document-like, never edited), products and schedule as proper relational tables.

```sql
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'api', -- 'typeform' | 'api'
  skin_type text NOT NULL,
  analysis jsonb NOT NULL, -- skin analysis results (read-only after generation)
  brand_cohesion_applied boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_routines_user ON routines(user_id);
CREATE INDEX idx_routines_email ON routines(email);
CREATE INDEX idx_routines_status ON routines(status);
```

### 1.4 `routine_products`

Junction table: which products are in a routine, grouped by category.

```sql
CREATE TABLE routine_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES skincare_products(id) NOT NULL,
  category text NOT NULL, -- ProductCategory enum value
  priority smallint DEFAULT 1, -- ordering within category (1st, 2nd, 3rd choice)
  created_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, product_id)
);
CREATE INDEX idx_routine_products_routine ON routine_products(routine_id);
CREATE INDEX idx_routine_products_product ON routine_products(product_id);
CREATE INDEX idx_routine_products_category ON routine_products(routine_id, category);
```

**Backoffice editing**: Swap a product = `UPDATE routine_products SET product_id = 'new-uuid' WHERE routine_id = X AND category = 'nettoyant'`.

**Find routines using product X**: `SELECT routine_id FROM routine_products WHERE product_id = X` -- trivial.

### 1.5 `routine_steps`

Weekly schedule: which product category at which time.

```sql
CREATE TABLE routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  time_of_day text NOT NULL CHECK (time_of_day IN ('morning', 'evening')),
  step_order smallint NOT NULL,
  category text NOT NULL, -- ProductCategory enum value
  estimated_minutes smallint DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_routine_steps_routine ON routine_steps(routine_id);
CREATE INDEX idx_routine_steps_schedule ON routine_steps(routine_id, day_of_week, time_of_day);
```

### RLS

**`routines` table** (mobile user reads own, employees read/edit all):

```sql
CREATE POLICY "users_select_own" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "employees_select" ON routines FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND active = true)
);
CREATE POLICY "employees_update" ON routines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND active = true)
);
```

**`routine_products` and `routine_steps`** (mobile user reads via routine ownership, employees full access):

```sql
-- Mobile: read own routine's data
CREATE POLICY "users_select_own" ON routine_products FOR SELECT USING (
  routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid())
);
CREATE POLICY "users_select_own" ON routine_steps FOR SELECT USING (
  routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid())
);

-- Employees: full CRUD for backoffice editing
CREATE POLICY "employees_all" ON routine_products FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND active = true)
);
CREATE POLICY "employees_all" ON routine_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND active = true)
);
```

---

## 2. `analysis` jsonb structure

Only the skin analysis stays as jsonb -- it's generated once by the algorithm and never edited.

```jsonc
{
  "skinType": {
    "primaryType": "mixte_normale_grasse",
    "label": "Mixte normale a grasse",
    "confidence": 0.85,
  },
  "skinStates": {
    "states": ["sensible", "deshydratee"],
    "labels": ["Sensible", "Deshydratee"],
  },
  "healthConditions": {
    "conditions": [],
    "hasRestrictions": false,
    "isPregnancySafe": true,
  },
}
```

**Everything else is computed, not stored**:

- `totalPrice` = sum of `routine_products` -> `skincare_products.price` (computed client-side)
- `productCount` = count of `routine_products` rows
- `productUsage` = derived from `routine_steps` (group by category, count occurrences)
- `summary` = derived from `analysis` + product count + steps

---

## 3. Mobile Data Fetching (TanStack Query)

### Reference data (fetched once, cached long)

```ts
// ~200 rows, fetched on app launch, shared across all screens
const { data: products } = useQuery({
  queryKey: ['skincare-products'],
  queryFn: () => supabase.from('skincare_products').select('*'),
  staleTime: 1000 * 60 * 60 * 24, // 24h
});

const { data: typeContent } = useQuery({
  queryKey: ['product-type-content'],
  queryFn: () => supabase.from('product_type_content').select('*'),
  staleTime: 1000 * 60 * 60 * 24, // 24h
});
```

### Routine data (single query with joins)

Now that products/steps are proper tables, Supabase can join them in one query:

```ts
const { data: routine } = useQuery({
  queryKey: ['routine', userId],
  queryFn: () =>
    supabase
      .from('routines')
      .select(
        `
        *,
        routine_products(id, product_id, category, priority),
        routine_steps(id, day_of_week, time_of_day, step_order, category, estimated_minutes)
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
});
```

Returns the routine + its products + its steps in **one network request**. Then resolve `product_id` against the cached `skincare_products` Map client-side.

### Client-side resolution

```ts
// Build lookup maps from cached reference data
const productMap = new Map(products.map((p) => [p.id, p]));
const typeContentMap = new Map(typeContent.map((t) => [t.name, t]));

// Resolve routine_products -> full product objects grouped by category
const productsByCategory: Record<string, SkincareProduct[]> = {};
for (const rp of routine.routine_products) {
  const product = productMap.get(rp.product_id);
  if (!product) continue; // skip deleted products gracefully
  if (!productsByCategory[rp.category]) productsByCategory[rp.category] = [];
  productsByCategory[rp.category].push(product);
}

// Compute derived values
const totalPrice = Object.values(productsByCategory)
  .flat()
  .reduce((sum, p) => sum + (p.price ?? 0), 0);
const productCount = routine.routine_products.length;
```

### Flow summary

1. **App launch** -> TanStack Query fetches `skincare_products` + `product_type_content` (cached 24h)
2. **User opens routine** -> 1 Supabase query: `routines` + `routine_products` + `routine_steps` (joined)
3. **Resolve** -> Map lookup for product details against cached catalog (instant, no network)
4. **Product catalog update** -> Backoffice edits a product -> next app launch or `invalidateQueries(['skincare-products'])` picks it up
5. **Routine edit** (backoffice) -> UPDATE/INSERT/DELETE on `routine_products` or `routine_steps` -> mobile picks up on next fetch

---

## 4. ProductCategory enum (app-side)

```
demaquillant | nettoyant | tonique | exfoliant | serum | contour_yeux
creme_jour | creme_nuit | creme_solaire | masque | huile | brume
baume | gadgets | complements
```

---

## 5. SkinType / SkinState enums (app-side)

**SkinType**: `tres_seche | seche | normale | mixte_normale_grasse | mixte_seche_grasse | grasse | tres_grasse | generique`

**SkinState**: `sensible | tres_sensible | mature | atopique | deshydratee | acneique | acne_hormonale`

---

## 6. Edge Functions

### 5.1 `generate-routine`

**Trigger**: HTTP POST (from Typeform webhook or direct API call from mobile)

**Flow**:

1. Receive payload (Typeform webhook format or direct questionnaire answers)
2. Parse questionnaire answers
3. Run skin analysis (skin type, skin states, health conditions)
4. Query `skincare_products` + `product_type_content` to select & score products
5. Build weekly routine plan (which products on which days, morning/evening)
6. Insert `routines` row (with `analysis` jsonb)
7. Insert `routine_products` rows (product IDs per category)
8. Insert `routine_steps` rows (weekly schedule)
9. Link to user via email or `user_id`

**Source logic**: Port from `skineasy-backend/src/modules/routine/`:

- `analyzers/skin-type-analyzer.ts`
- `analyzers/skin-state-analyzer.ts`
- `analyzers/health-condition-detector.ts`
- `builders/filter-builder.ts`
- `builders/product-selector.ts`
- `builders/routine-planner.ts`

### 5.2 Typeform webhook

Currently: `POST {NESTJS_URL}/api/v1/routine/webhook`
After migration: `POST https://lyhhipvipgbqsytfqwdw.supabase.co/functions/v1/generate-routine`

Update the webhook URL in Typeform settings after deploying the Edge Function.

---

## 7. RLS Summary

| Table                  | anon | authenticated (mobile) | employees (backoffice) | service_role |
| ---------------------- | ---- | ---------------------- | ---------------------- | ------------ |
| `skincare_products`    | -    | SELECT                 | ALL                    | ALL          |
| `product_type_content` | -    | SELECT                 | ALL                    | ALL          |
| `routines`             | -    | SELECT own             | SELECT ALL, UPDATE ALL | ALL          |
| `routine_products`     | -    | SELECT (via routine)   | ALL                    | ALL          |
| `routine_steps`        | -    | SELECT (via routine)   | ALL                    | ALL          |

---

## 8. Migration Order

1. Create `skincare_products` table + RLS
2. Create `product_type_content` table + RLS
3. Seed product data (fresh)
4. Seed product type content (fresh)
5. Create `routines` + `routine_products` + `routine_steps` tables + RLS
6. Build & deploy `generate-routine` Edge Function
7. Test with manual API call
8. Update Typeform webhook URL
9. Migrate mobile routine service to query Supabase directly

---

## 9. Decisions

1. **Product images**: Move to Supabase Storage bucket `product-images` (public). Migrate from `skineasy.com/img/routineproducts/`.
2. **Product data entry**: Managed via the Nuxt backoffice.
3. **Questionnaire**: Stays on Typeform. Webhook points to `generate-routine` Edge Function.
