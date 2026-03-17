import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Smile } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { DateNavigation } from '@features/dashboard/components/DateNavigation';
import { StressLevelDisplay } from '@features/journal/components/StressLevelDisplay';
import {
  useDeleteStress,
  useStressEntries,
  useUpsertStress,
} from '@features/journal/hooks/useStress';
import { stressFormSchema, type StressFormInput } from '@features/journal/schemas/journal.schema';
import { Button } from '@shared/components/button';
import { ScreenHeader } from '@shared/components/screen-header';
import { Slider } from '@shared/components/slider';
import type { StressLevel } from '@shared/types/journal.types';
import { toISODateString, toUTCDateString } from '@shared/utils/date';

const DEFAULT_STRESS_LEVEL = 3 as StressLevel;

// Slider width to match stress bars: 5 bars × 44px + 4 gaps × 12px = 268px
const SLIDER_WIDTH = 268;

export default function StressScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const upsertStress = useUpsertStress();
  const deleteStress = useDeleteStress();

  const [selectedDate, setSelectedDate] = useState(() =>
    params.date ? new Date(params.date) : new Date(),
  );

  const dateString = toUTCDateString(selectedDate);
  const { data: stressEntries, isLoading, isError, refetch } = useStressEntries(dateString);

  const existingEntry = params.id
    ? stressEntries?.find((e) => e.id === Number(params.id))
    : stressEntries?.[0];

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<StressFormInput>({
    resolver: zodResolver(stressFormSchema),
    mode: 'onChange',
    defaultValues: {
      level: DEFAULT_STRESS_LEVEL,
    },
  });

  useEffect(() => {
    if (isLoading) return;

    const syncForm = async (): Promise<void> => {
      if (existingEntry) {
        reset({ level: existingEntry.level as StressLevel });
      } else {
        reset({ level: DEFAULT_STRESS_LEVEL });
      }
      await trigger();
    };
    void syncForm();
  }, [existingEntry, isLoading, reset, trigger]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedLevel = watch('level') as StressLevel;

  const onSubmit = (data: StressFormInput): void => {
    const dto = {
      date: toISODateString(dateString),
      level: data.level as StressLevel,
    };

    upsertStress.mutate(dto, {
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
          deleteStress.mutate(
            { id: existingEntry.id, date: dateString },
            { onSuccess: () => router.back() },
          );
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenHeader title={t('journal.stress.screenTitle')} icon={Smile}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </ScreenHeader>
    );
  }

  if (isError) {
    return (
      <ScreenHeader title={t('journal.stress.screenTitle')} icon={Smile}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-textMuted text-center mb-4">{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} haptic="medium" />
        </View>
      </ScreenHeader>
    );
  }

  return (
    <ScreenHeader title={t('journal.stress.screenTitle')} icon={Smile} childrenClassName="gap-6">
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Stress Level Display */}
      <View className="flex-1 justify-center">
        <StressLevelDisplay level={selectedLevel} />
      </View>

      {/* Slider */}
      <View className="items-center">
        <Slider
          value={selectedLevel}
          onChange={(val) => {
            setValue('level', val as StressLevel, { shouldValidate: true });
            void trigger();
          }}
          min={1}
          max={5}
          step={1}
          width={SLIDER_WIDTH}
        />
      </View>

      {/* Save Button */}
      <View>
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || upsertStress.isPending}
          loading={upsertStress.isPending}
        />

        {/* Delete Button (only when editing) */}
        {existingEntry && (
          <Button
            title={t('common.delete')}
            variant="outline"
            onPress={handleDelete}
            disabled={deleteStress.isPending}
            loading={deleteStress.isPending}
            className="mt-4"
          />
        )}
      </View>
    </ScreenHeader>
  );
}
