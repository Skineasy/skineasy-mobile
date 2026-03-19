import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RoutineEmptyState } from '@features/routine/components/RoutineEmptyState';
import { RoutineErrorState } from '@features/routine/components/RoutineErrorState';
import { RoutineLoadingState } from '@features/routine/components/RoutineLoadingState';
import { RoutineStepCard } from '@features/routine/components/RoutineStepCard';
import { RoutineSummaryCard } from '@features/routine/components/RoutineSummaryCard';
import { RoutineToggle } from '@features/routine/components/RoutineToggle';
import { useRoutine } from '@features/routine/hooks/useRoutine';
import { useTodayRoutine } from '@features/routine/hooks/useTodayRoutine';
import { useRoutineCompletionStore } from '@features/routine/stores/routineCompletionStore';
import type { TimeOfDay } from '@features/routine/types/routine.types';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import { ENV } from '@shared/config/env';
import { getTodayUTC } from '@shared/utils/date';

/**
 * Main Routine Results Screen
 *
 * Displays the authenticated user's skincare routine with:
 * - Morning/Evening toggle
 * - Step-by-step product cards
 * - Shop buttons for each product
 */
export default function RoutineResultsScreen() {
  const { t } = useTranslation();
  const [selectedTime, setSelectedTime] = useState<TimeOfDay>('morning');

  const { data: routine, isLoading, isError } = useRoutine();
  const todayRoutine = useTodayRoutine(routine);

  const { isCompleted } = useRoutineCompletionStore();
  const today = getTodayUTC();

  // Compute category counts and occurrences for ordinal labels
  // Sort completed items to the end
  const stepsWithOrdinal = useMemo(() => {
    if (!todayRoutine) return [];

    const currentSteps =
      selectedTime === 'morning' ? todayRoutine.morning.steps : todayRoutine.evening.steps;

    const categoryCount = new Map<string, number>();
    currentSteps.forEach((s) => {
      categoryCount.set(s.step.category, (categoryCount.get(s.step.category) || 0) + 1);
    });

    const occurrenceTracker = new Map<string, number>();
    const stepsWithMeta = currentSteps.map((stepWithProducts) => {
      const cat = stepWithProducts.step.category;
      const occurrence = (occurrenceTracker.get(cat) || 0) + 1;
      occurrenceTracker.set(cat, occurrence);
      return {
        stepWithProducts,
        categoryOccurrence: occurrence,
        totalCategoryCount: categoryCount.get(cat) || 1,
        completed: isCompleted(today, selectedTime, stepWithProducts.step.order),
      };
    });

    return stepsWithMeta;
  }, [todayRoutine, selectedTime, isCompleted, today]);

  // Loading state
  if (isLoading) {
    return (
      <ScreenHeader canGoBack={false} title={t('routine.resultsTitle')}>
        <RoutineLoadingState />
      </ScreenHeader>
    );
  }

  // Error state
  if (isError) {
    return (
      <ScreenHeader canGoBack={false} title={t('routine.resultsTitle')}>
        <RoutineErrorState />
      </ScreenHeader>
    );
  }

  // No routine found
  if (!routine || !todayRoutine) {
    return (
      <ScreenHeader canGoBack={false} title={t('routine.resultsTitle')}>
        <RoutineEmptyState />
      </ScreenHeader>
    );
  }

  const currentSteps =
    selectedTime === 'morning' ? todayRoutine.morning.steps : todayRoutine.evening.steps;

  const oldRoutineUrl = `${ENV.PRESTASHOP_URL}/fr/my-custom-page?rspid=${routine.id}`;

  return (
    <ScreenHeader
      edges={['top']}
      title={t('routine.resultsTitle')}
      noScroll
      canGoBack={false}
      className="bg-background"
      rightAction={
        <Pressable onPress={() => Linking.openURL(oldRoutineUrl)} haptic="light">
          <Text className="text-sm text-primary font-medium">{t('routine.seeOldRoutine')}</Text>
        </Pressable>
      }
    >
      {/* Skin Profile Summary */}
      <RoutineSummaryCard
        summary={routine.summary}
        analysis={routine.analysis}
        productSelection={routine.productSelection}
      />

      {/* Morning/Evening Toggle */}
      <RoutineToggle
        selected={selectedTime}
        onSelect={setSelectedTime}
        morningStepCount={todayRoutine.morning.steps.length}
        eveningStepCount={todayRoutine.evening.steps.length}
      />

      {/* Scrollable Step Cards */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-2 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Day Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4">
          <Text className="text-lg font-semibold text-text">{todayRoutine.dayName}</Text>
          <Text className="text-sm text-textMuted">
            {selectedTime === 'morning'
              ? `~${todayRoutine.morning.estimatedMinutes} min`
              : `~${todayRoutine.evening.estimatedMinutes} min`}
          </Text>
        </Animated.View>

        {/* Step Cards */}
        {stepsWithOrdinal.map(
          ({ stepWithProducts, categoryOccurrence, totalCategoryCount }, index) => (
            <RoutineStepCard
              key={`${stepWithProducts.step.category}-${stepWithProducts.step.order}`}
              stepWithProducts={stepWithProducts}
              index={index}
              categoryOccurrence={categoryOccurrence}
              totalCategoryCount={totalCategoryCount}
              timeOfDay={selectedTime}
            />
          ),
        )}

        {/* Empty state for current time */}
        {currentSteps.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-textMuted">{t('routine.noProducts')}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenHeader>
  );
}
