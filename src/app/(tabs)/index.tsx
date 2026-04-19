import { useRouter } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateNavigation } from '@features/dashboard/components/DateNavigation';
import { DayProgressDots } from '@features/dashboard/components/DayProgressDots';
import { IndicatorsList } from '@features/dashboard/components/IndicatorsList';
import { RecipeOfTheDay } from '@features/dashboard/components/RecipeOfTheDay';
import { RecommendationsSection } from '@features/dashboard/components/RecommendationsSection';
import { RoutineBannerContainer } from '@features/dashboard/components/RoutineBanner';
import { ScoreContainer } from '@features/dashboard/components/ScoreContainer';
import { calculateDayScore } from '@features/dashboard/utils/score';
import { useSleepEntries } from '@features/journal/data/sleep.queries';
import { useSportEntries } from '@features/journal/data/sport.queries';
import { useMealEntries } from '@features/journal/data/meal.queries';
import { useStressEntries } from '@features/journal/data/stress.queries';
import { useObservationsEntry } from '@features/journal/data/observation.queries';
import { Avatar } from '@shared/components/avatar';
import { SectionHeader } from '@shared/components/section-header';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';
import { useUserStore } from '@shared/stores/user.store';
import { toUTCDateString } from '@shared/utils/date';

export default function DashboardScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);
  const animStyles = useEntranceAnimation(7);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Convert selected date to UTC string for API
  const dateString = toUTCDateString(selectedDate);

  // Fetch journal data for selected date
  const { data: sleepEntries = [] } = useSleepEntries(dateString);
  const { data: mealEntries = [] } = useMealEntries(dateString);
  const { data: sportEntries = [] } = useSportEntries(dateString);
  const { data: stressEntries = [] } = useStressEntries(dateString);
  const { data: observationEntries = [] } = useObservationsEntry(dateString);

  // Compute score for selected date
  const score = calculateDayScore(
    sleepEntries[0],
    mealEntries,
    sportEntries,
    stressEntries[0],
    observationEntries[0],
  );

  // Calculate missing indicators count
  const missingCount = [
    sleepEntries.length === 0,
    mealEntries.length === 0,
    sportEntries.length === 0,
    stressEntries.length === 0,
    observationEntries.length === 0,
  ].filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-32">
          {/* Top bar: Date Navigation + Avatar */}
          <View className="gap-2">
            <Animated.View
              style={animStyles[0]}
              className="px-4 flex-row justify-between items-center"
            >
              <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
              <Avatar
                avatar={user?.avatar_url}
                firstname={user?.first_name}
                lastname={user?.last_name}
                email={user?.email}
                size={32}
                onPress={() => router.push(hasRoutineAccess ? '/profile' : '/account')}
              />
            </Animated.View>

            {/* Day Progress Dots */}
            <Animated.View style={animStyles[1]}>
              <DayProgressDots onDateSelect={setSelectedDate} />
            </Animated.View>
          </View>

          {/* Score Container */}
          <Animated.View style={animStyles[2]}>
            <ScoreContainer score={score} missingCount={missingCount} />
          </Animated.View>

          {/* Recommendations */}
          <Animated.View style={animStyles[3]}>
            <RecommendationsSection
              selectedDate={selectedDate}
              observationEntry={observationEntries[0]}
            />
          </Animated.View>

          {/* Indicators Section */}
          <Animated.View style={animStyles[4]}>
            <SectionHeader className="px-4" icon={Layers} title={t('dashboard.indicators.title')} />
            <IndicatorsList
              sleepEntries={sleepEntries}
              mealEntries={mealEntries}
              sportEntries={sportEntries}
              stressEntries={stressEntries}
              observationEntries={observationEntries}
              date={dateString}
            />
          </Animated.View>

          {/* Recipe of the Day */}
          <Animated.View style={animStyles[5]}>
            <RecipeOfTheDay />
          </Animated.View>

          {/* Routine Banner */}
          <Animated.View style={animStyles[6]}>
            <RoutineBannerContainer />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
