import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { journalService } from '@features/journal/services/journal.service';
import { toast } from '@lib/toast';
import { queryKeys } from '@shared/config/queryKeys';
import type { CreateMealEntryDto } from '@shared/types/journal.types';
import { fromISOToDateString } from '@shared/utils/date';
import { logger } from '@shared/utils/logger';

export function useMealEntries(date: string) {
  return useQuery({
    queryKey: queryKeys.journalMeal(date),
    queryFn: () => journalService.meal.getByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadMealImage() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (imageUri: string) => journalService.meal.uploadImage(imageUri),
    onError: (error) => {
      logger.error('[useUploadMealImage] Error:', error);
      toast.error(t('common.error'), t('journal.nutrition.uploadError'));
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateMealEntryDto) => journalService.meal.create(dto),
    onSuccess: (data, variables) => {
      logger.info('[useCreateMeal] Success:', data);

      const dateKey = fromISOToDateString(variables.date);
      queryClient.invalidateQueries({ queryKey: queryKeys.journalMeal(dateKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.nutrition.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useCreateMeal] Error:', error);
      toast.error(t('common.error'), t('journal.nutrition.saveError'));
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateMealEntryDto>; date: string }) =>
      journalService.meal.update(id, dto),
    onSuccess: (data, variables) => {
      logger.info('[useUpdateMeal] Success:', data);

      queryClient.invalidateQueries({ queryKey: queryKeys.journalMeal(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.nutrition.saveSuccess'));
    },
    onError: (error) => {
      logger.error('[useUpdateMeal] Error:', error);
      toast.error(t('common.error'), t('journal.nutrition.saveError'));
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: number; date: string }) => journalService.meal.delete(id),
    onSuccess: (_, variables) => {
      logger.info('[useDeleteMeal] Success');

      queryClient.invalidateQueries({ queryKey: queryKeys.journalMeal(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journalAllEntries() });

      toast.success(t('journal.nutrition.deleteSuccess'));
    },
    onError: (error) => {
      logger.error('[useDeleteMeal] Error:', error);
      toast.error(t('common.error'), t('journal.nutrition.deleteError'));
    },
  });
}
