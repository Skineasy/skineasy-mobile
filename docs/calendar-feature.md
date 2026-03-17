# Feature: Calendar Tab with Score Indicators

## Overview

Add a Calendar tab showing daily scores with color-coded dots. Tapping a day shows detailed entries (photos, activity names, etc.) below the calendar.

**Tab structure:** Home | Calendar | Routine (3 tabs)

---

## Requirements Summary

1. **Calendar Tab:** Month view with colored dots per day based on score
2. **Day Detail View:** Full detailed data (meal photos, activity names/durations, etc.)
3. **Home Indicators:** Switch to list layout with more padding
4. **Score Colors:** Green (>70%), Orange (>30%), Red (>0%), Gray (no data)
5. **Date Range:** All days since `user.createdAt`

---

## Step-by-Step Implementation (for Ralph Loop)

### Step 1: Install react-native-calendars

**Command:**

```bash
npm install react-native-calendars
```

**Verification:** `package.json` contains `react-native-calendars`

---

### Step 2: Change Home indicators to list layout

**File:** `src/shared/config/appConfig.ts`

**Change:**

```typescript
ui: {
  indicatorLayout: 'list' as 'grid' | 'list',  // Changed from 'grid'
}
```

**Verification:** Home screen shows indicators as vertical list

---

### Step 3: Enhance list indicator cards with more data

**File:** `src/features/dashboard/components/IndicatorCard.tsx`

**Changes:**

- Increase padding from `md` to `lg`
- Add `subtitle` prop for secondary info (meal types, activity names)
- Make card taller with vertical layout for label + subtitle

**New props:**

```typescript
interface IndicatorCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string; // NEW: e.g. "Breakfast, Lunch" or "Running, Yoga"
  onPress?: () => void;
  disabled?: boolean;
  status: IndicatorStatus;
  layout?: IndicatorLayout;
}
```

**New `listContent` layout:**

```typescript
const listContent = (
  <Card padding="lg" className="gap-2">
    {/* Top row: Dot + Icon + Label + Value */}
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <StatusDot status={status} />
        <Icon size={20} color={colors.brownDark} />
        <Text className="font-semibold text-brown-dark">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className={cn('text-base font-bold', isEmpty ? 'text-text-muted' : 'text-text')}>
          {isEmpty ? t('dashboard.indicators.enterData') : value}
        </Text>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>
    </View>

    {/* Subtitle row: secondary info */}
    {subtitle && !isEmpty && (
      <Text className="text-sm text-text-muted ml-7">{subtitle}</Text>
    )}
  </Card>
)
```

**File:** `src/features/dashboard/components/IndicatorsList.tsx`

**Changes to pass subtitle:**

```typescript
// Nutrition: show meal types
const mealTypes = [...new Set(mealEntries.map((m) => m.meal_type).filter(Boolean))];
const nutritionSubtitle = mealTypes.map((t) => t(`journal.nutrition.mealType.${t}`)).join(', ');

// Sport: show activity names
const sportNames = [...new Set(sportEntries.map((s) => s.sportType?.name).filter(Boolean))];
const sportSubtitle = sportNames.map((n) => t(`journal.sport.types.${n}`)).join(', ');

// Sleep: show quality
const sleepSubtitle = sleepEntries[0]
  ? t('journal.sleep.qualityLabel', { quality: sleepEntries[0].quality })
  : undefined;

// Stress: show note preview
const stressSubtitle = stressEntries[0]?.note?.substring(0, 50) || undefined;
```

**Example display:**

| Indicator | Value    | Subtitle                 |
| --------- | -------- | ------------------------ |
| Sleep     | 7h30     | Quality: 4/5             |
| Nutrition | 3/4      | Breakfast, Lunch, Dinner |
| Sport     | 45 min   | Running, Yoga            |
| Stress    | Moderate | Busy day at work...      |

**Verification:**

- Cards are taller with more padding
- Subtitle shows additional context
- Still compact vs Calendar (no photos, no individual meal cards)

---

### Step 4: Create useMonthScores hook

**File:** `src/features/calendar/hooks/useMonthScores.ts` (CREATE)

**Purpose:** Fetch journal entries for a month, compute scores, return `markedDates` object

**Implementation:**

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';

import { journalService } from '@features/journal/services/journal.service';
import { calculateDayScore } from '@features/dashboard/utils/score';
import { queryKeys } from '@shared/config/queryKeys';
import { toUTCDateString } from '@shared/utils/date';
import type { MealEntry, SleepEntry, SportEntry, StressEntry } from '@shared/types/journal.types';
import { colors } from '@theme/colors';

type MarkedDates = Record<string, { dots: Array<{ key: string; color: string }> }>;

function getScoreColor(score: number): string {
  if (score > 70) return colors.success;
  if (score > 30) return colors.warning;
  if (score > 0) return colors.error;
  return colors.textMuted;
}

function filterByDate<T extends { date: string }>(entries: T[], targetDate: Date): T[] {
  return entries.filter((e) => isSameDay(parseISO(e.date), targetDate));
}

export function useMonthScores(
  year: number,
  month: number,
): { markedDates: MarkedDates; isLoading: boolean } {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const startDate = toUTCDateString(monthStart);
  const endDate = toUTCDateString(monthEnd);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.journalEntriesRange(startDate, endDate),
    queryFn: () => journalService.entries.getByDateRange(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  const markedDates = useMemo(() => {
    const result: MarkedDates = {};

    if (!data) return result;

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const sleeps: SleepEntry[] = data.sleeps ?? [];
    const meals: MealEntry[] = data.meals ?? [];
    const sports: SportEntry[] = data.sports ?? [];
    const stresses: StressEntry[] = data.stresses ?? [];

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySleeps = filterByDate(sleeps, day);
      const dayMeals = filterByDate(meals, day);
      const daySports = filterByDate(sports, day);
      const dayStresses = filterByDate(stresses, day);

      const score = calculateDayScore(daySleeps[0], dayMeals, daySports, dayStresses[0]);

      result[dateStr] = {
        dots: [{ key: 'score', color: getScoreColor(score) }],
      };
    }

    return result;
  }, [data, monthStart, monthEnd]);

  return { markedDates, isLoading };
}
```

**Verification:** Hook returns markedDates object with colors

---

### Step 5: Create CalendarDayDetail component

**File:** `src/features/calendar/components/CalendarDayDetail.tsx` (CREATE)

**Purpose:** Show detailed view of selected day's entries (photos, durations, etc.)

**Key elements:**

- Sleep: Hours, quality stars
- Nutrition: All meal cards with photos, food names, meal type
- Sport: List of activities with name, duration, intensity
- Stress: Level with note

**Implementation:**

```typescript
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, Text, View } from 'react-native'

import { Card } from '@shared/components/Card'
import { useJournalEntries } from '@features/journal/hooks/useJournalEntries'
import type { MealEntry, SleepEntry, SportEntry, StressEntry } from '@shared/types/journal.types'

type CalendarDayDetailProps = {
  date: string // YYYY-MM-DD format
}

const STRESS_LEVEL_KEYS: Record<number, string> = {
  1: 'minimal',
  2: 'mild',
  3: 'moderate',
  4: 'high',
  5: 'intense',
}

function SleepSection({ entry }: { entry: SleepEntry | undefined }): React.ReactElement | null {
  const { t } = useTranslation()

  if (!entry) return null

  const hours = Math.floor(entry.hours)
  const minutes = Math.round((entry.hours % 1) * 60)
  const timeStr = `${hours}h${minutes.toString().padStart(2, '0')}`

  return (
    <Card padding="md" className="mb-3">
      <Text className="text-sm font-semibold text-brown-dark mb-2">{t('calendar.sleep')}</Text>
      <Text className="text-lg font-bold text-text">{timeStr}</Text>
      <Text className="text-sm text-text-muted">
        {t('journal.sleep.quality')}: {entry.quality}/5
      </Text>
    </Card>
  )
}

function MealsSection({ entries }: { entries: MealEntry[] }): React.ReactElement | null {
  const { t } = useTranslation()

  if (entries.length === 0) return null

  return (
    <Card padding="md" className="mb-3">
      <Text className="text-sm font-semibold text-brown-dark mb-2">{t('calendar.nutrition')}</Text>
      <View className="gap-2">
        {entries.map((meal) => (
          <View key={meal.id} className="flex-row items-center gap-3">
            {meal.photo_url ? (
              <Image source={{ uri: meal.photo_url }} className="w-12 h-12 rounded-md" />
            ) : (
              <View className="w-12 h-12 rounded-md bg-surface items-center justify-center">
                <Text className="text-text-muted">-</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-medium text-text">
                {meal.food_name || t(`journal.nutrition.mealType.${meal.meal_type}`) || '-'}
              </Text>
              {meal.meal_type && (
                <Text className="text-sm text-text-muted">
                  {t(`journal.nutrition.mealType.${meal.meal_type}`)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  )
}

function SportsSection({ entries }: { entries: SportEntry[] }): React.ReactElement | null {
  const { t } = useTranslation()

  if (entries.length === 0) return null

  return (
    <Card padding="md" className="mb-3">
      <Text className="text-sm font-semibold text-brown-dark mb-2">{t('calendar.sport')}</Text>
      <View className="gap-2">
        {entries.map((sport) => (
          <View key={sport.id} className="flex-row justify-between items-center">
            <Text className="text-base font-medium text-text">
              {t(`journal.sport.types.${sport.sportType?.name}`) || sport.sportType?.name}
            </Text>
            <Text className="text-sm text-text-muted">{sport.duration} min</Text>
          </View>
        ))}
      </View>
    </Card>
  )
}

function StressSection({ entry }: { entry: StressEntry | undefined }): React.ReactElement | null {
  const { t } = useTranslation()

  if (!entry) return null

  return (
    <Card padding="md" className="mb-3">
      <Text className="text-sm font-semibold text-brown-dark mb-2">{t('calendar.stress')}</Text>
      <Text className="text-lg font-bold text-text">
        {t(`journal.stress.level.${STRESS_LEVEL_KEYS[entry.level]}`)}
      </Text>
      {entry.note && <Text className="text-sm text-text-muted mt-1">{entry.note}</Text>}
    </Card>
  )
}

export function CalendarDayDetail({ date }: CalendarDayDetailProps): React.ReactElement {
  const { t } = useTranslation()
  const { sleepEntries, mealEntries, sportEntries, stressEntries, isLoading } = useJournalEntries(date)

  const hasNoData =
    sleepEntries.length === 0 &&
    mealEntries.length === 0 &&
    sportEntries.length === 0 &&
    stressEntries.length === 0

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-text-muted">{t('common.loading')}</Text>
      </View>
    )
  }

  if (hasNoData) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-text-muted">{t('calendar.noData')}</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
      <SleepSection entry={sleepEntries[0]} />
      <MealsSection entries={mealEntries} />
      <SportsSection entries={sportEntries} />
      <StressSection entry={stressEntries[0]} />
      <View className="h-6" />
    </ScrollView>
  )
}
```

**Verification:** Tapping a day shows full details including meal photos

---

### Step 6: Create Calendar screen

**File:** `app/(tabs)/calendar.tsx` (CREATE)

**Implementation:**

```typescript
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Calendar, type DateData } from 'react-native-calendars'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format } from 'date-fns'

import { CalendarDayDetail } from '@features/calendar/components/CalendarDayDetail'
import { useMonthScores } from '@features/calendar/hooks/useMonthScores'
import { colors } from '@theme/colors'

export default function CalendarScreen(): React.ReactElement {
  const insets = useSafeAreaInsets()
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'))
  const [visibleMonth, setVisibleMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const { markedDates } = useMonthScores(visibleMonth.year, visibleMonth.month)

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString)
  }, [])

  const handleMonthChange = useCallback((month: DateData) => {
    setVisibleMonth({ year: month.year, month: month.month - 1 })
  }, [])

  const finalMarkedDates = useMemo(
    () => ({
      ...markedDates,
      [selectedDate]: {
        ...markedDates[selectedDate],
        selected: true,
      },
    }),
    [markedDates, selectedDate]
  )

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Calendar
        markingType="multi-dot"
        markedDates={finalMarkedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textMuted,
          dayTextColor: colors.text,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.background,
          monthTextColor: colors.text,
          textDisabledColor: colors.textMuted,
          arrowColor: colors.text,
        }}
      />

      <CalendarDayDetail date={selectedDate} />
    </View>
  )
}
```

**Verification:** Calendar renders, days show colored dots, tapping shows details

---

### Step 7: Add Calendar tab to FloatingTabBar

**File:** `src/shared/components/FloatingTabBar.tsx`

**Changes:**

1. Import `CalendarDays` from lucide-react-native
2. Add Calendar tab between Home and Routine

**Before:**

```typescript
const TABS = [
  { name: 'index', icon: Home },
  { name: 'routine', icon: BookOpen },
];
```

**After:**

```typescript
import { CalendarDays, Home, Sparkles } from 'lucide-react-native';

const TABS = [
  { name: 'index', icon: Home },
  { name: 'calendar', icon: CalendarDays },
  { name: 'routine', icon: Sparkles },
];
```

**Verification:** Tab bar shows 3 icons

---

### Step 8: Add calendar route to tab layout

**File:** `app/(tabs)/_layout.tsx`

**Add:**

```typescript
<Tabs.Screen name="calendar" />
```

**Verification:** Navigation to /calendar works

---

### Step 9: Add i18n keys

**File:** `src/i18n/locales/en.json`

```json
"calendar": {
  "title": "Calendar",
  "noData": "No data for this day",
  "sleep": "Sleep",
  "nutrition": "Nutrition",
  "sport": "Activity",
  "stress": "Stress"
}
```

**File:** `src/i18n/locales/fr.json`

```json
"calendar": {
  "title": "Calendrier",
  "noData": "Pas de donnees pour ce jour",
  "sleep": "Sommeil",
  "nutrition": "Nutrition",
  "sport": "Activite",
  "stress": "Stress"
}
```

**Verification:** Labels display in correct language

---

### Step 10: Add query key for month range

**File:** `src/shared/config/queryKeys.ts`

**Add if not exists:**

```typescript
journalEntriesRange: (from: string, to: string) => ['journal', 'entries', from, to] as const,
```

**Verification:** Query caching works correctly

---

## Files Summary

| File                                                     | Action | Description                      |
| -------------------------------------------------------- | ------ | -------------------------------- |
| `package.json`                                           | Modify | Add react-native-calendars       |
| `src/shared/config/appConfig.ts`                         | Modify | Change indicatorLayout to 'list' |
| `src/features/dashboard/components/IndicatorCard.tsx`    | Modify | More padding for list layout     |
| `src/features/calendar/hooks/useMonthScores.ts`          | Create | Month score fetching hook        |
| `src/features/calendar/components/CalendarDayDetail.tsx` | Create | Day detail component             |
| `app/(tabs)/calendar.tsx`                                | Create | Calendar screen                  |
| `src/shared/components/FloatingTabBar.tsx`               | Modify | Add calendar tab                 |
| `app/(tabs)/_layout.tsx`                                 | Modify | Add calendar route               |
| `src/i18n/locales/en.json`                               | Modify | Add calendar i18n                |
| `src/i18n/locales/fr.json`                               | Modify | Add calendar i18n                |
| `src/shared/config/queryKeys.ts`                         | Modify | Add query key if needed          |

---

## Existing Code to Reuse

- `calculateDayScore()` from `src/features/dashboard/utils/score.ts`
- `journalService.entries.getByDateRange()` from journal service
- `useWeekScores()` pattern from `src/features/dashboard/hooks/useWeekScores.ts`
- `useJournalEntries` hook for fetching day entries
- `Card` component for sections
- `colors` from theme

---

## Verification Checklist

1. [x] `npm install` succeeds with react-native-calendars
2. [x] Home indicators display as list (not grid)
3. [x] Calendar tab appears in tab bar
4. [x] Calendar shows current month
5. [x] Days with data show colored dots (green/orange/red)
6. [x] Days without data show gray dot
7. [x] Tapping day shows detailed entries below
8. [x] Meal photos visible in day detail
9. [x] Activity names and durations visible
10. [x] Swiping changes months
11. [x] i18n works for both EN/FR
12. [x] `npm run check` passes (lint + typecheck + test)
