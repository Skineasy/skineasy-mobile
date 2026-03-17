import { format } from 'date-fns';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddIndicatorSheet } from '@features/dashboard/components/AddIndicatorSheet';
import { CalendarDayDetail } from '@features/calendar/components/CalendarDayDetail';
import { calculateDayScore } from '@features/dashboard/utils/score';
import { CalendarModal } from '@features/journal/components/CalendarModal';
import { JournalHeader } from '@features/journal/components/JournalHeader';
import { JournalScoreBadge } from '@features/journal/components/JournalScoreBadge';
import {
  useMealEntries,
  useSleepEntries,
  useSportEntries,
  useStressEntries,
} from '@features/journal/hooks/useJournal';
import { useObservationsEntry } from '@features/journal/hooks/useObservations';

export default function JournalScreen(): React.ReactElement {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [addEntryVisible, setAddEntryVisible] = useState(false);

  const { data: sleepEntries = [] } = useSleepEntries(selectedDate);
  const { data: mealEntries = [] } = useMealEntries(selectedDate);
  const { data: sportEntries = [] } = useSportEntries(selectedDate);
  const { data: stressEntries = [] } = useStressEntries(selectedDate);
  const { data: observationEntries = [] } = useObservationsEntry(selectedDate);

  const score = calculateDayScore(
    sleepEntries[0],
    mealEntries,
    sportEntries,
    stressEntries[0],
    observationEntries[0],
  );
  const hasData =
    sleepEntries.length > 0 ||
    mealEntries.length > 0 ||
    sportEntries.length > 0 ||
    stressEntries.length > 0 ||
    observationEntries.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <JournalHeader selectedDate={selectedDate} onOpenCalendar={() => setCalendarVisible(true)} />
      {hasData && <JournalScoreBadge score={score} />}
      <CalendarDayDetail date={selectedDate} onAddEntry={() => setAddEntryVisible(true)} />
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      <AddIndicatorSheet
        visible={addEntryVisible}
        onClose={() => setAddEntryVisible(false)}
        date={selectedDate}
      />
    </SafeAreaView>
  );
}
