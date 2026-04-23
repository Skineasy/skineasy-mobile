import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { DateNavigation } from '@features/dashboard/components/DateNavigation';
import { ObservationChip } from '@features/journal/components/ObservationChip';
import {
  NEGATIVE_OBSERVATION_ICONS,
  NEGATIVE_OBSERVATIONS,
  POSITIVE_OBSERVATION_ICONS,
  POSITIVE_OBSERVATIONS,
  type NegativeObservation,
  type PositiveObservation,
} from '@features/journal/constants/observations';
import {
  useDeleteObservations,
  useObservationsEntry,
  useUpsertObservations,
} from '@features/journal/data/observation.queries';
import {
  observationFormSchema,
  type ObservationFormInput,
} from '@features/journal/schemas/journal.schema';
import { Button } from '@shared/components/button';
import { ErrorState } from '@shared/components/error-state';
import { LoadingState } from '@shared/components/loading-state';
import { ScreenHeader } from '@shared/components/screen-header';
import { SectionHeader } from '@shared/components/section-header';
import { toISODateString, toUTCDateString } from '@shared/utils/date';

export default function ObservationsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const upsertObservation = useUpsertObservations();
  const deleteObservation = useDeleteObservations();

  const [selectedDate, setSelectedDate] = useState(() =>
    params.date ? new Date(params.date) : new Date(),
  );

  const dateString = toUTCDateString(selectedDate);
  const { data: entries = [], isLoading, isError, refetch } = useObservationsEntry(dateString);
  const existingEntry = entries[0];

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ObservationFormInput>({
    resolver: zodResolver(observationFormSchema),
    mode: 'onChange',
    defaultValues: {
      positives: [],
      negatives: [],
    },
  });

  useEffect(() => {
    if (isLoading) return;

    const syncForm = async (): Promise<void> => {
      if (existingEntry) {
        reset({
          positives: existingEntry.positives,
          negatives: existingEntry.negatives,
        });
      } else {
        reset({ positives: [], negatives: [] });
      }
      await trigger();
    };
    void syncForm();
  }, [existingEntry, isLoading, reset, trigger]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedPositives = watch('positives');
  const selectedNegatives = watch('negatives');

  const togglePositive = (key: PositiveObservation): void => {
    const current = selectedPositives;
    const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setValue('positives', updated, { shouldValidate: true });
    void trigger();
  };

  const toggleNegative = (key: NegativeObservation): void => {
    const current = selectedNegatives;
    const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setValue('negatives', updated, { shouldValidate: true });
    void trigger();
  };

  const onSubmit = (data: ObservationFormInput): void => {
    const dto = {
      date: toISODateString(dateString),
      positives: data.positives,
      negatives: data.negatives,
    };

    upsertObservation.mutate(dto, {
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
          deleteObservation.mutate(
            { id: existingEntry.id, date: dateString },
            { onSuccess: () => router.back() },
          );
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenHeader title={t('journal.observations.screenTitle')} icon={Search}>
        <LoadingState />
      </ScreenHeader>
    );
  }

  if (isError) {
    return (
      <ScreenHeader title={t('journal.observations.screenTitle')} icon={Search}>
        <ErrorState messageKey="common.error" onRetry={() => void refetch()} />
      </ScreenHeader>
    );
  }

  return (
    <ScreenHeader title={t('journal.observations.screenTitle')} icon={Search} noScroll>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-6">
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

          {/* Positive Points */}
          <View>
            <SectionHeader
              icon={Plus}
              title={t('journal.observations.positivePoints')}
              className="mb-3 px-0"
            />
            <View className="flex-row flex-wrap gap-3">
              {POSITIVE_OBSERVATIONS.map((key) => (
                <ObservationChip
                  key={key}
                  selected={selectedPositives.includes(key)}
                  onPress={() => togglePositive(key)}
                  label={t(`journal.observations.positive.${key}`)}
                  icon={POSITIVE_OBSERVATION_ICONS[key]}
                  variant="positive"
                />
              ))}
            </View>
          </View>

          {/* Negative Points */}
          <View>
            <SectionHeader
              icon={Minus}
              title={t('journal.observations.negativePoints')}
              className="mb-3 px-0"
            />
            <View className="flex-row flex-wrap gap-3">
              {NEGATIVE_OBSERVATIONS.map((key) => (
                <ObservationChip
                  key={key}
                  selected={selectedNegatives.includes(key)}
                  onPress={() => toggleNegative(key)}
                  label={t(`journal.observations.negative.${key}`)}
                  icon={NEGATIVE_OBSERVATION_ICONS[key]}
                  variant="negative"
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="pt-4">
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || upsertObservation.isPending}
          loading={upsertObservation.isPending}
        />

        {/* Delete Button (only when editing) */}
        {existingEntry && (
          <Button
            title={t('common.delete')}
            variant="outline"
            onPress={handleDelete}
            disabled={deleteObservation.isPending}
            loading={deleteObservation.isPending}
            className="mt-4"
          />
        )}
      </View>
    </ScreenHeader>
  );
}
