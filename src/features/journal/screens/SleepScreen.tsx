/**
 * Sleep Screen
 *
 * Allows users to log sleep data with:
 * - Hours of sleep (time picker)
 * - Sleep quality (1-5 scale: 1=Bad, 3=Neutral, 5=Good)
 *
 * Connected to real backend API with validation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Frown, Meh, Moon, Smile } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import {
  useDeleteSleep,
  useSleepEntries,
  useUpsertSleep,
} from '@features/journal/hooks/useJournal';
import { sleepFormSchema, type SleepFormInput } from '@features/journal/schemas/journal.schema';
import { Button } from '@shared/components/button';
import { ScreenHeader } from '@shared/components/screen-header';
import { SectionHeader } from '@shared/components/section-header';
import { SelectableCard } from '@shared/components/selectable-card';
import { TimePicker } from '@shared/components/time-picker';
import type { SleepQuality } from '@shared/types/journal.types';
import { toISODateString, toUTCDateString } from '@shared/utils/date';
import { DateNavigation } from '@features/dashboard/components/DateNavigation';

const QUALITY_LEVELS = [
  { value: 1 as SleepQuality, icon: Frown, labelKey: 'journal.sleep.quality.bad' },
  { value: 3 as SleepQuality, icon: Meh, labelKey: 'journal.sleep.quality.neutral' },
  { value: 5 as SleepQuality, icon: Smile, labelKey: 'journal.sleep.quality.good' },
];

export default function SleepScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const upsertSleep = useUpsertSleep();
  const deleteSleep = useDeleteSleep();

  const [selectedDate, setSelectedDate] = useState(() =>
    params.date ? new Date(params.date) : new Date(),
  );

  const dateString = toUTCDateString(selectedDate);
  const { data: sleepEntries, isLoading, isError, refetch } = useSleepEntries(dateString);
  // Use specific id if editing, otherwise get first entry for today
  const existingEntry = params.id
    ? sleepEntries?.find((e) => e.id === Number(params.id))
    : sleepEntries?.[0];

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<SleepFormInput>({
    resolver: zodResolver(sleepFormSchema),
    mode: 'onChange',
    defaultValues: {
      minutes: undefined,
      quality: undefined,
    },
  });

  // Sync form with selected date's entry
  useEffect(() => {
    if (isLoading) return;

    const syncForm = async (): Promise<void> => {
      if (existingEntry) {
        const minutes = Math.round(existingEntry.hours * 60);
        reset({ minutes, quality: existingEntry.quality as SleepQuality });
      } else {
        reset({ minutes: undefined, quality: undefined });
      }
      await trigger();
    };
    void syncForm();
  }, [existingEntry, isLoading, reset, trigger]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedMinutes = watch('minutes');
  const selectedQuality = watch('quality');

  const onSubmit = (data: SleepFormInput) => {
    // Convert minutes to decimal hours for API
    const hours = data.minutes / 60;

    const dto = {
      date: toISODateString(dateString),
      hours,
      quality: data.quality as SleepQuality,
    };

    upsertSleep.mutate(dto, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  const handleDelete = (): void => {
    if (!existingEntry) return;

    Alert.alert(t('common.deleteConfirmTitle'), t('common.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSleep.mutate(
            { id: existingEntry.id, date: dateString },
            { onSuccess: () => router.back() },
          );
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenHeader title={t('journal.sleep.screenTitle')} icon={Moon}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </ScreenHeader>
    );
  }

  if (isError) {
    return (
      <ScreenHeader title={t('journal.sleep.screenTitle')} icon={Moon}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-textMuted text-center mb-4">{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} haptic="medium" />
        </View>
      </ScreenHeader>
    );
  }

  return (
    <ScreenHeader title={t('journal.sleep.screenTitle')} icon={Moon} childrenClassName="gap-6">
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Sleep Duration Picker */}
      <View>
        <TimePicker
          value={selectedMinutes}
          onChange={(val) => {
            setValue('minutes', val, { shouldValidate: true });
            void trigger();
          }}
          label={t('journal.sleep.hours')}
          title={t('journal.sleep.pickerTitle')}
        />
      </View>

      {/* Quality Selector */}
      <View>
        <SectionHeader icon={Smile} title={t('journal.sleep.question')} className="px-0 mb-3" />
        <View className="flex-row gap-3">
          {QUALITY_LEVELS.map(({ value, icon, labelKey }) => (
            <View key={value} className="flex-1">
              <SelectableCard
                selected={selectedQuality === value}
                onPress={() => {
                  setValue('quality', value, { shouldValidate: true });
                  void trigger();
                }}
                label={t(labelKey)}
                icon={icon}
                variant="vertical"
                iconSize={40}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <View>
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || upsertSleep.isPending}
          loading={upsertSleep.isPending}
        />

        {/* Delete Button (only when editing) */}
        {existingEntry && (
          <Button
            title={t('common.delete')}
            variant="outline"
            onPress={handleDelete}
            disabled={deleteSleep.isPending}
            loading={deleteSleep.isPending}
            className="mt-4"
          />
        )}
      </View>
    </ScreenHeader>
  );
}
