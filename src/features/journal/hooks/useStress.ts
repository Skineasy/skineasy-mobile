import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { journalService } from '@features/journal/services/journal.service';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import type { CreateStressEntryDto } from '@shared/types/journal.types';
import { fromISOToDateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

export function useStressEntries(date: string) {
  return useQuery({
    queryKey: queryKeys.journalStress(date),
    queryFn: () => journalService.stress.getByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertStress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateStressEntryDto) => journalService.stress.upsert(dto),
    onSuccess: (data, variables) => {
      logger.info('[useUpsertStress] Success:', data);

      const dateKey = fromISOToDateString(variables.date);
      queryClient.invalidateQueries({ queryKey: queryKeys.journalStress(dateKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.stress.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useUpsertStress] Error:', error);
      toast.error(t('common.error'), t('journal.stress.saveError'));
    },
  });
}

export function useDeleteStress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: number; date: string }) => journalService.stress.delete(id),
    onSuccess: (_, variables) => {
      logger.info('[useDeleteStress] Success');

      queryClient.invalidateQueries({ queryKey: queryKeys.journalStress(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.stress.deleteSuccess'));
    },
    onError: (error) => {
      logger.error('[useDeleteStress] Error:', error);
      toast.error(t('common.error'), t('journal.stress.deleteError'));
    },
  });
}
