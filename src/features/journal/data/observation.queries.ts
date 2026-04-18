import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import * as observationApi from '@features/journal/data/observation.api';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import type { CreateObservationEntryDto } from '@shared/types/journal.types';
import { fromISOToDateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

export function useObservationsEntry(date: string) {
  return useQuery({
    queryKey: queryKeys.journalObservations(date),
    queryFn: () => observationApi.getObservationsByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertObservations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateObservationEntryDto) => observationApi.upsertObservations(dto),
    onSuccess: (data, variables) => {
      logger.info('[useUpsertObservations] Success:', data);

      const dateKey = fromISOToDateString(variables.date);
      queryClient.invalidateQueries({ queryKey: queryKeys.journalObservations(dateKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.observations.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useUpsertObservations] Error:', error);
      toast.error(t('common.error'), t('journal.observations.saveError'));
    },
  });
}

export function useDeleteObservations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: string; date: string }) => observationApi.deleteObservations(id),
    onSuccess: (_, variables) => {
      logger.info('[useDeleteObservations] Success');

      queryClient.invalidateQueries({ queryKey: queryKeys.journalObservations(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.observations.deleteSuccess'));
    },
    onError: (error) => {
      logger.error('[useDeleteObservations] Error:', error);
      toast.error(t('common.error'), t('journal.observations.deleteError'));
    },
  });
}
