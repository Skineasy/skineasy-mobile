import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { journalService } from '@features/journal/services/journal.service';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import type { CreateSleepEntryDto } from '@shared/types/journal.types';
import { fromISOToDateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

export function useSleepEntries(date: string) {
  return useQuery({
    queryKey: queryKeys.journalSleep(date),
    queryFn: () => journalService.sleep.getByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertSleep() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateSleepEntryDto) => journalService.sleep.upsert(dto),
    onSuccess: (data, variables) => {
      logger.info('[useUpsertSleep] Success:', data);

      const dateKey = fromISOToDateString(variables.date);
      queryClient.invalidateQueries({ queryKey: queryKeys.journalSleep(dateKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.sleep.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useUpsertSleep] Error:', error);
      toast.error(t('common.error'), t('journal.sleep.saveError'));
    },
  });
}

export function useDeleteSleep() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: number; date: string }) => journalService.sleep.delete(id),
    onSuccess: (_, variables) => {
      logger.info('[useDeleteSleep] Success');

      queryClient.invalidateQueries({ queryKey: queryKeys.journalSleep(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.sleep.deleteSuccess'));
    },
    onError: (error) => {
      logger.error('[useDeleteSleep] Error:', error);
      toast.error(t('common.error'), t('journal.sleep.deleteError'));
    },
  });
}
