import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import * as sportApi from '@features/journal/data/sport.api';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import type { CreateSportEntryDto } from '@shared/types/journal.types';
import { fromISOToDateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

export function useSportTypes() {
  const { t } = useTranslation();

  return useQuery({
    queryKey: queryKeys.sportTypes(),
    queryFn: async () => {
      const sportTypes = await sportApi.getSportTypes();

      if (__DEV__) {
        const { validateSportMappings } = await import('@features/journal/utils/sportMapping');
        const sportTypeNames = sportTypes.map((st) => st.name);
        const validation = validateSportMappings(sportTypeNames, t);

        if (!validation.valid) {
          logger.warn(
            `[useSportTypes] ${validation.total} sport types from backend, ` +
              `${validation.configured} configured, ` +
              `${validation.missingConfig.length} missing config, ` +
              `${validation.missingTranslations.length} missing translations`,
          );
        } else {
          logger.info(`[useSportTypes] All ${validation.total} sport types validated successfully`);
        }
      }

      return sportTypes;
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSportEntries(date: string) {
  return useQuery({
    queryKey: queryKeys.journalSport(date),
    queryFn: () => sportApi.getSportByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSport() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateSportEntryDto) => sportApi.createSport(dto),
    onSuccess: (data, variables) => {
      logger.info('[useCreateSport] Success:', data);

      const dateKey = fromISOToDateString(variables.date);
      queryClient.invalidateQueries({ queryKey: queryKeys.journalSport(dateKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.sport.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useCreateSport] Error:', error);
      toast.error(t('common.error'), t('journal.sport.saveError'));
    },
  });
}

export function useUpdateSport() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSportEntryDto>; date: string }) =>
      sportApi.updateSport(id, dto),
    onSuccess: (data, variables) => {
      logger.info('[useUpdateSport] Success:', data);

      queryClient.invalidateQueries({ queryKey: queryKeys.journalSport(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.sport.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useUpdateSport] Error:', error);
      toast.error(t('common.error'), t('journal.sport.saveError'));
    },
  });
}

export function useDeleteSport() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: string; date: string }) => sportApi.deleteSport(id),
    onSuccess: (_, variables) => {
      logger.info('[useDeleteSport] Success');

      queryClient.invalidateQueries({ queryKey: queryKeys.journalSport(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.sport.deleteSuccess'));
    },
    onError: (error) => {
      logger.error('[useDeleteSport] Error:', error);
      toast.error(t('common.error'), t('journal.sport.deleteError'));
    },
  });
}
