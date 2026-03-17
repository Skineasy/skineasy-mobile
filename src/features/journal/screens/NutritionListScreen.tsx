/**
 * Nutrition List Screen
 *
 * Shows 4 meal categories (breakfast, lunch, dinner, snack).
 * Each category displays as a card showing either:
 * - Food name if logged
 * - "Enter data" prompt if empty
 * Clicking navigates to edit (if logged) or add (if empty) with pre-selected meal type.
 */

import { parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Coffee, Cookie, Moon, Sun, Utensils } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DateNavigation } from '@features/dashboard/components/DateNavigation';
import { useMealEntries } from '@features/journal/hooks/useJournal';
import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import type { MealType } from '@shared/types/journal.types';
import { cn } from '@shared/utils/cn';
import { toUTCDateString } from '@shared/utils/date';
import { colors } from '@theme/colors';

const MEAL_TYPES = [
  { id: 'breakfast' as const, icon: Coffee },
  { id: 'lunch' as const, icon: Sun },
  { id: 'dinner' as const, icon: Moon },
  { id: 'snack' as const, icon: Cookie },
];

export default function NutritionListScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      return parseISO(params.date);
    }
    return new Date();
  });

  const dateString = toUTCDateString(selectedDate);
  const { data: mealEntries = [] } = useMealEntries(dateString);

  const handleDateChange = (date: Date): void => {
    setSelectedDate(date);
  };

  const getMealForType = (type: MealType) => {
    return mealEntries.find((e) => e.meal_type === type);
  };

  const handleMealPress = (type: MealType): void => {
    const entry = getMealForType(type);
    if (entry) {
      router.push({
        pathname: '/journal/nutrition/[id]',
        params: { id: String(entry.id), date: dateString },
      });
    } else {
      router.push({
        pathname: '/journal/nutrition/new',
        params: { date: dateString, mealType: type },
      });
    }
  };

  return (
    <ScreenHeader
      title={t('journal.nutrition.listTitle')}
      icon={Utensils}
      childrenClassName="gap-6"
    >
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Meal Type Cards */}
      <View className="gap-3">
        {MEAL_TYPES.map((mealType) => {
          const Icon = mealType.icon;
          const entry = getMealForType(mealType.id);
          const hasEntry = !!entry;

          return (
            <Pressable
              key={mealType.id}
              onPress={() => handleMealPress(mealType.id)}
              haptic="light"
            >
              <Card padding="md" className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-cream items-center justify-center">
                    <Icon size={20} color={colors.brownDark} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-sm text-text-muted">
                      {t(`dashboard.summary.mealType.${mealType.id}`)}
                    </Text>
                    <Text
                      className={cn(
                        'text-base font-medium',
                        hasEntry ? 'text-text' : 'text-text-muted',
                      )}
                    >
                      {hasEntry ? entry.food_name : t('journal.nutrition.empty')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color={colors.textMuted} />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </ScreenHeader>
  );
}
