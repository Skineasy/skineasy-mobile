# Supabase Migration Plan

> Backend: `skineasy-backend` (NestJS + Prisma + MySQL) -> Supabase (Postgres + Edge Functions)
>
> Scope: `skineasy-mobile` only. Web & backoffice are separate efforts.

---

## 1. Current Supabase State

### Existing tables (backoffice/web)

| Table                         | Purpose                               | Relevant to mobile?                    |
| ----------------------------- | ------------------------------------- | -------------------------------------- |
| `clients`                     | Salon clients (user_id -> auth.users) | **YES** - reuse as mobile user profile |
| `produits`                    | Salon products for sale               | NO                                     |
| `soins`                       | Beauty treatments                     | NO                                     |
| `employees`                   | Staff                                 | NO                                     |
| `appointments`                | Bookings                              | NO                                     |
| `notifications`               | Backoffice notifications              | NO (different from push notifs)        |
| `activity_logs`               | Employee activity                     | NO                                     |
| `blog_articles`, `cms_*`      | CMS content                           | NO                                     |
| `packages`, `client_packages` | Treatment packages                    | NO                                     |
| `sms_*`                       | SMS campaigns                         | NO                                     |
| `payment_documents`           | Invoices                              | NO                                     |
| Other backoffice tables       | Various                               | NO                                     |

### Existing infrastructure

- **Auth**: Supabase Auth (email/password) - already in use
- **Storage buckets**: `blog-images`, `cms-images`, `soin-images`, `payment-documents`
- **Edge Functions**: `create-employee`, `send-sms`, `sync-prestashop`, `seed-cms-media`
- **Helper functions**: `is_admin_user()`, `handle_updated_at()`, etc.
- **RLS**: Enabled on all tables with employee/admin/client policies

### `clients` table (reusable for mobile users)

```
id              uuid PK (gen_random_uuid())
user_id         uuid FK -> auth.users NOT NULL
first_name      text NOT NULL
last_name       text NOT NULL
email           text NOT NULL
phone           text
created_at      timestamptz
updated_at      timestamptz
is_favorite     boolean (backoffice use)
is_vip          boolean (backoffice use)
address_*       text (address fields)
```

**Missing columns for mobile**:

- `birthday date` - needed for profile
- `skin_type text` - set after diagnosis/routine
- `avatar_url text` - profile photo URL
- `has_routine_access boolean default false` - controls routine feature gate

---

## 2. Tables To Create

### 2.1 `sport_types` (reference table)

```sql
CREATE TABLE sport_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- 'yoga', 'running', 'cycling', etc.
  created_at timestamptz DEFAULT now()
);
```

**RLS**: SELECT for authenticated, no INSERT/UPDATE/DELETE from client.

### 2.2 `sleep_entries`

```sql
CREATE TABLE sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  hours numeric(3,1) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  quality smallint NOT NULL CHECK (quality BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX idx_sleep_entries_user_date ON sleep_entries(user_id, date DESC);
```

**RLS**: User owns their data (`auth.uid() = user_id`).

### 2.3 `sport_entries`

```sql
CREATE TABLE sport_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sport_type_id uuid REFERENCES sport_types(id) NOT NULL,
  date date NOT NULL,
  duration integer NOT NULL CHECK (duration >= 1), -- minutes
  intensity smallint NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  note text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_sport_entries_user_date ON sport_entries(user_id, date DESC);
```

**RLS**: User owns their data.

### 2.4 `meal_entries`

```sql
CREATE TABLE meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  food_name text,
  photo_url text,
  note text,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_meal_entries_user_date ON meal_entries(user_id, date DESC);
```

**RLS**: User owns their data.

### 2.5 `stress_entries`

```sql
CREATE TABLE stress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 5),
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX idx_stress_entries_user_date ON stress_entries(user_id, date DESC);
```

**RLS**: User owns their data.

### 2.6 `observation_entries`

```sql
CREATE TABLE observation_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  positives text[] DEFAULT '{}', -- ['skinHydrated', 'fewerPimples']
  negatives text[] DEFAULT '{}', -- ['acne', 'excessSebum']
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX idx_observation_entries_user_date ON observation_entries(user_id, date DESC);
```

**Note**: Using native Postgres arrays instead of JSON strings (cleaner than MySQL approach).

**RLS**: User owns their data.

### 2.7 `diagnoses`

```sql
CREATE TABLE diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  answers jsonb NOT NULL,
  result jsonb,
  score_data jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_diagnoses_user ON diagnoses(user_id);
CREATE INDEX idx_diagnoses_email ON diagnoses(email);
```

**RLS**: User owns their data. Unauthenticated diagnosis (email-only) handled via Edge Function with service_role.

### 2.8 Routine tables (`routines`, `skincare_products`, `product_type_content`)

> Planned separately in [`routine-migration.md`](routine-migration.md).

### 2.9 `push_tokens`

```sql
CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  device_id text,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE UNIQUE INDEX idx_push_tokens_token ON push_tokens(token);
```

**RLS**: User can INSERT/UPDATE/DELETE own tokens. SELECT restricted to service_role (Edge Functions send notifications).

### 2.10 `app_config`

```sql
CREATE TABLE app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

**RLS**: SELECT for `anon` + `authenticated` (public read). Write via dashboard/admin only.

_Sections 2.11-2.12 moved to [`routine-migration.md`](routine-migration.md)._

---

## 3. Storage Buckets To Create

| Bucket           | Public? | Purpose                 | Path pattern                  |
| ---------------- | ------- | ----------------------- | ----------------------------- |
| `avatars`        | YES     | User profile photos     | `{user_id}/{filename}`        |
| `meal-photos`    | NO      | Journal meal images     | `{user_id}/{date}/{filename}` |
| `product-images` | YES     | Skincare product photos | `{filename}`                  |

**Storage RLS policies**:

- `avatars`: Anyone can read. Authenticated users can INSERT/UPDATE/DELETE in their own folder (`auth.uid()::text = (storage.foldername(name))[1]`).
- `meal-photos`: Only owner can read/write their folder.
- `product-images`: Anyone can read. Write via admin/service_role only (managed by backoffice).

---

## 4. Edge Functions Needed

| Function                 | Trigger                     | Purpose                                                                          |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------------- |
| `send-push-notification` | HTTP (from backoffice/cron) | Query `push_tokens`, send via Expo Push API                                      |
| `cleanup-push-tokens`    | Cron (weekly)               | Remove stale/invalid tokens                                                      |
| `stripe-webhook`         | HTTP (Stripe webhook)       | On successful payment, check if item grants routine access -> set flag on client |

> Routine Edge Functions (`generate-routine`, Typeform webhook) are planned in [`routine-migration.md`](routine-migration.md).

### `stripe-webhook` flow

1. Receive Stripe `checkout.session.completed` or `payment_intent.succeeded` event
2. Verify Stripe signature
3. Check if purchased item(s) include the routine product
4. Find client by email (from Stripe session)
5. `UPDATE clients SET has_routine_access = true WHERE email = X`

---

## 5. RLS Strategy Summary

| Table                 | anon   | authenticated (own data)   | service_role |
| --------------------- | ------ | -------------------------- | ------------ |
| `clients` (extended)  | -      | SELECT, UPDATE own         | ALL          |
| `sport_types`         | -      | SELECT                     | ALL          |
| `sleep_entries`       | -      | ALL own                    | ALL          |
| `sport_entries`       | -      | ALL own                    | ALL          |
| `meal_entries`        | -      | ALL own                    | ALL          |
| `stress_entries`      | -      | ALL own                    | ALL          |
| `observation_entries` | -      | ALL own                    | ALL          |
| `diagnoses`           | -      | SELECT, INSERT own         | ALL          |
| `push_tokens`         | -      | INSERT, UPDATE, DELETE own | ALL          |
| `app_config`          | SELECT | SELECT                     | ALL          |

> Routine tables RLS (`routines`, `skincare_products`, `product_type_content`) in [`routine-migration.md`](routine-migration.md).

**Standard user policy** (applied to all journal tables):

```sql
-- SELECT
CREATE POLICY "users_select_own" ON {table} FOR SELECT USING (auth.uid() = user_id);
-- INSERT
CREATE POLICY "users_insert_own" ON {table} FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE
CREATE POLICY "users_update_own" ON {table} FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- DELETE
CREATE POLICY "users_delete_own" ON {table} FOR DELETE USING (auth.uid() = user_id);
```

---

## 6. Tables Dropped (not migrated)

| Old table (MySQL)                   | Reason                                                          |
| ----------------------------------- | --------------------------------------------------------------- |
| `teei_customer`                     | Replaced by Supabase Auth + `clients`                           |
| `teei_configuration`                | PrestaShop config, not needed                                   |
| `teei_productspecificity_product`   | Migrated to `skincare_products` (see routine-migration.md)      |
| `teei_productspecificity_type`      | Migrated to `product_type_content` (see routine-migration.md)   |
| `teei_orders` / `teei_order_detail` | Order history - not used in mobile                              |
| `teei_wk_product_customer_options`  | PrestaShop customization - not needed                           |
| `app_routine_product`               | Replaced by `routine_products` table (see routine-migration.md) |
| `app_routine_schedule`              | Replaced by `routine_steps` table (see routine-migration.md)    |
| `app_algorithm_version`             | Dropped, re-add if needed                                       |
| `app_notification`                  | Backoffice notifications - handled by new backoffice            |
| `app_user_avatar`                   | Replaced by `clients.avatar_url` + Storage                      |

---

## 7. `clients` Table Alterations

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS skin_type text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_routine_access boolean DEFAULT false;
```

**`skin_type`**: Also available in `routines.analysis.skinType`. Kept on `clients` for quick access on screens that don't load the full routine (dashboard, profile). Should be updated when a new routine is generated.

**`has_routine_access`**: Cached flag for fast mobile reads. Source of truth = `product_orders` (Stripe purchase). Updated by:

- **Stripe webhook Edge Function**: After a successful payment for a routine product, sets `has_routine_access = true`
- **Backoffice manual override**: Employees can toggle it directly (gift access, etc.)

Existing RLS already handles `clients_select_own`, `clients_update_own`, `clients_insert_own`.

---

## 8. Account Deletion RPC

The mobile `profileService.deleteAccount()` calls `supabase.rpc('delete_own_account')`.

This PostgreSQL function **must exist** in the Supabase project. It must use `SECURITY DEFINER` so it runs with elevated privileges that allow deleting from `auth.users` (which the client SDK cannot do directly).

### Required SQL

```sql
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletes the auth.users row; cascades to clients and all FK journal data
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
```

### Cascades (ON DELETE CASCADE already set)

- `auth.users` -> `clients` (user_id FK)
- `clients` -> all journal entries via `user_id` FK on `sleep_entries`, `sport_entries`, `meal_entries`, `stress_entries`, `observation_entries`, `diagnoses`, `push_tokens`

### Apply via MCP

Run the SQL above via the Supabase MCP tool (`execute_sql`) on project `lyhhipvipgbqsytfqwdw`. Do NOT add it to a migration file.

---

## 9. Open Questions

_None remaining for this doc. Routine/products/Typeform questions are tracked in `routine-migration.md`._

---

## 9. Migration Order (suggested)

**Phase 1 - Database (this doc)**

1. Alter `clients` table (add missing columns)
2. Create reference tables (`sport_types`, `app_config`)
3. Create journal tables (`sleep_entries`, `sport_entries`, `meal_entries`, `stress_entries`, `observation_entries`)
4. Create `diagnoses` table
5. Create `push_tokens` table
6. Create storage buckets (`avatars`, `meal-photos`)
7. Apply all RLS policies
8. Seed `sport_types` and `app_config` data

**Phase 2 - Mobile app**

9. Migrate mobile app services from REST API to Supabase client SDK (auth, journal, profile, push tokens)

**Phase 3 - Routine (see `routine-migration.md`)**

10. Create `skincare_products`, `product_type_content`, `routines`, `routine_products`, `routine_steps` tables
11. Seed product data (fresh)
12. Build `generate-routine` Edge Function
13. Update Typeform webhook URL
14. Migrate mobile routine service to Supabase

**Phase 4 - Push notifications**

15. Build `send-push-notification` + `cleanup-push-tokens` Edge Functions
16. Integrate with new backoffice (Nuxt)
