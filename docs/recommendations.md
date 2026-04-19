# Recommendations

Daily personalized tips surfaced on the Dashboard to guide the user's actions for the day, derived from journal data.

---

## Purpose

Turn raw journal data into actionable, short suggestions. Each recommendation is a single imperative sentence shown as a non-clickable pill. The goal is nudging, not reporting — no detail screen, no long copy.

---

## Display rules

- Rendered only when the selected date on the Dashboard **is today**. On any past/future date the section is hidden.
- Section is hidden entirely when no rule triggers.
- At most **3 recommendations** are shown. When more than 3 rules trigger, rules are kept in their declaration order (see table below).
- Horizontal scroll of white pills, matching the design system section header (`HeartHandshake` icon + "Recommandations" title).

---

## Data windows

Each rule looks at a specific time window:

- **Today's observations** (skin state) → from the `observation_entries` row of the current day
- **Yesterday's journal** (sleep, stress, sport, meals) → entries dated `today - 1 day`

Rationale: observations reflect the current skin state we want to act on today. All other signals reflect yesterday's behavior, since today's data isn't meaningful yet (the day isn't done).

---

## Rules

Evaluated in order; first 3 matches win.

| #   | Trigger                                                                | Source                          | Message key                                | Message (FR)               |
| --- | ---------------------------------------------------------------------- | ------------------------------- | ------------------------------------------ | -------------------------- |
| 1   | Today's negatives include `drySkin`                                    | `observation_entries.negatives` | `dashboard.recommendations.drinkWater`     | Bois 2L d'eau aujourd'hui  |
| 2   | Today's negatives include any of `sensitiveSkin`, `redness`, `drySkin` | `observation_entries.negatives` | `dashboard.recommendations.avoidIrritants` | Évite les actifs irritants |
| 3   | Yesterday's sleep `quality` ≤ 2 (on a 1-5 scale)                       | `sleep_entries` (yesterday)     | `dashboard.recommendations.sleepEarlier`   | Couche-toi plus tôt        |
| 4   | Yesterday's stress `level` ≥ 4 (on a 1-5 scale)                        | `stress_entries` (yesterday)    | `dashboard.recommendations.takeTimeForYou` | Prends du temps pour toi   |
| 5   | Yesterday's sport total `duration` < 30 min (or no entry)              | `sport_entries` (yesterday)     | `dashboard.recommendations.move20min`      | Bouge 20 min aujourd'hui   |
| 6   | Yesterday's average meal `quality` < 3 (among rated meals)             | `meal_entries` (yesterday)      | `dashboard.recommendations.reduceSugarFat` | Réduis le sucre et le gras |

### Notes on thresholds

- **Sleep quality ≤ 2**: the 1-5 scale maps roughly to "very bad / bad / ok / good / great". Trigger on the bottom two.
- **Stress level ≥ 4**: top two levels, i.e. "high / intense".
- **Sport < 30 min**: WHO's minimum daily activity guidance for adults. "Or no entry" covers both "logged less than 30" and "didn't log" — the nudge is the same.
- **Meal quality < 3**: user-rated nutritional quality, averaged across meals logged yesterday. Unrated meals are ignored. If no meal is rated, the rule does not trigger (no data = no nudge).

### Rules deliberately not implemented

- **Constipation / fiber nudge**: no dedicated field in the observations model; not inferred from other signals.
- **Explicit hydration questionnaire**: no such field exists. The closest signal is `drySkin`, which drives rule 1. If a hydration self-report is later added to the diagnosis/questionnaire, rule 1 should use it as the primary trigger.

---

## Extending

To add a new recommendation:

1. Add the message to `src/i18n/locales/fr.json` and `en.json` under `dashboard.recommendations.*`.
2. Add a new branch in `buildRecommendations` (`src/features/dashboard/utils/recommendations.ts`) with the trigger condition, a Lucide icon, and the i18n key.
3. Decide priority by position in the function (earlier = higher priority when capping at 3).

No UI changes needed — the pill component renders any icon + text.

---

## Key files

- Rules (pure function): `src/features/dashboard/utils/recommendations.ts`
- Section component: `src/features/dashboard/components/RecommendationsSection.tsx`
- Pill component: `src/features/dashboard/components/RecommendationPill.tsx`
- i18n: `src/i18n/locales/{fr,en}.json` → `dashboard.recommendations.*`
