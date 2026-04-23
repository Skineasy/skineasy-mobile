/**
 * Nutrition Screen
 *
 * Allows users to log meals/snacks with:
 * - Photo upload (camera or gallery)
 * - Optional note (max 500 characters)
 * - Optional meal type (breakfast, lunch, dinner, snack)
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Camera,
  Clock,
  Coffee,
  Cookie,
  ImageIcon,
  MessageSquare,
  Moon,
  Star,
  Sun,
  Utensils,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from 'react-native';

import { uploadMealPhoto } from '@features/journal/data/meal.api';
import {
  useCreateMeal,
  useDeleteMeal,
  useMealEntries,
  useUpdateMeal,
} from '@features/journal/data/meal.queries';
import { mealFormSchema, type MealFormInput } from '@features/journal/schemas/journal.schema';
import { toast } from '@lib/toast';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import { SectionHeader } from '@shared/components/section-header';
import type { MealQuality } from '@shared/types/journal.types';
import { cn } from '@shared/utils/cn';
import { getTodayUTC, toISODateString } from '@shared/utils/date';
import { pickImageFromGallery, takePhoto } from '@shared/utils/image';
import { logger } from '@shared/utils/logger';
import { colors } from '@theme/colors';

const MEAL_TYPES = [
  { id: 'breakfast', icon: Coffee },
  { id: 'lunch', icon: Sun },
  { id: 'dinner', icon: Moon },
  { id: 'snack', icon: Cookie },
] as const;

const QUALITY_LEVELS: readonly MealQuality[] = [1, 2, 3, 4, 5] as const;
const DEFAULT_QUALITY: MealQuality = 3;

export default function NutritionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; date?: string; mealType?: string }>();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  // If editing, fetch existing entry
  const dateToUse = params.date || getTodayUTC();
  const { data: mealEntries } = useMealEntries(dateToUse);
  const existingEntry = mealEntries?.find((e) => e.id === params.id);
  const isEditMode = !!params.id;

  // Track if user has changed the image from the original
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [imageWasModified, setImageWasModified] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Compute effective image URI: use local if modified, else use existing entry's image
  const imageUri = imageWasModified ? localImageUri : (existingEntry?.photo_url ?? null);

  const setImageUri = (uri: string | null) => {
    setImageWasModified(true);
    setLocalImageUri(uri);
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<MealFormInput>({
    resolver: zodResolver(mealFormSchema),
    mode: 'onChange',
    defaultValues: { quality: DEFAULT_QUALITY },
  });

  // Populate form when editing or with pre-selected meal type
  useEffect(() => {
    if (existingEntry && existingEntry.meal_type) {
      reset({
        food_name: existingEntry.food_name || '',
        note: existingEntry.note || '',
        meal_type: existingEntry.meal_type,
        quality: (existingEntry.quality ?? DEFAULT_QUALITY) as MealQuality,
      });
    } else if (params.mealType) {
      reset({
        food_name: existingEntry?.food_name || '',
        note: existingEntry?.note || '',
        meal_type: params.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        quality: DEFAULT_QUALITY,
      });
    }
  }, [existingEntry, params.mealType, reset]);

  const handlePickImage = async () => {
    if (isPickingImage) return;
    setIsPickingImage(true);
    try {
      const uri = await pickImageFromGallery(() => {
        toast.error(t('common.error'), t('journal.nutrition.galleryPermissionRequired'));
      });
      if (uri) setImageUri(uri);
    } catch (error) {
      logger.error('[Nutrition] pickImageFromGallery failed', error);
      toast.error(t('common.error'), t('journal.nutrition.pickError'));
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    if (isPickingImage) return;
    setIsPickingImage(true);
    try {
      const uri = await takePhoto(() => {
        toast.error(t('common.error'), t('journal.nutrition.cameraPermissionRequired'));
      });
      if (uri) setImageUri(uri);
    } catch (error) {
      logger.error('[Nutrition] takePhoto failed', error);
      toast.error(t('common.error'), t('journal.nutrition.takePhotoError'));
    } finally {
      setIsPickingImage(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const onSubmit = async (data: MealFormInput): Promise<void> => {
    let uploadedPath: string | null = null;

    if (imageWasModified && localImageUri) {
      setIsUploading(true);
      try {
        uploadedPath = await uploadMealPhoto(localImageUri, toISODateString(dateToUse));
      } catch {
        toast.error(t('common.error'), t('journal.nutrition.uploadError'));
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const baseDto = {
      date: toISODateString(dateToUse),
      food_name: data.food_name,
      note: data.note || null,
      meal_type: data.meal_type,
      quality: data.quality as MealQuality,
    };

    if (isEditMode && existingEntry) {
      // Only update photo_url when image was modified (avoids overwriting storage path with signed URL)
      const updateDto = imageWasModified ? { ...baseDto, photo_url: uploadedPath } : baseDto;
      updateMeal.mutate(
        { id: existingEntry.id, dto: updateDto, date: dateToUse },
        { onSuccess: () => router.back() },
      );
    } else {
      createMeal.mutate(
        { ...baseDto, photo_url: uploadedPath },
        { onSuccess: () => router.back() },
      );
    }
  };

  const isLoading = isUploading || isPickingImage || createMeal.isPending || updateMeal.isPending;

  const handleDelete = (): void => {
    if (!existingEntry) return;

    Alert.alert(t('common.deleteConfirmTitle'), t('common.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteMeal.mutate(
            { id: existingEntry.id, date: dateToUse },
            { onSuccess: () => router.back() },
          );
        },
      },
    ]);
  };

  return (
    <ScreenHeader
      title={t('journal.nutrition.screenTitle')}
      icon={Utensils}
      childrenClassName="pt-2"
      noScroll
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Quality Rating (prominent, at top) */}
        <View>
          <SectionHeader
            icon={Star}
            title={t('journal.nutrition.quality.label')}
            className="px-0 mb-3"
          />
          <Controller
            control={control}
            name="quality"
            render={({ field: { onChange, value } }) => {
              const current = (value ?? DEFAULT_QUALITY) as MealQuality;
              return (
                <View className="items-center">
                  <View className="flex-row gap-2">
                    {QUALITY_LEVELS.map((level) => {
                      const isActive = level <= current;
                      return (
                        <Pressable
                          key={level}
                          onPress={() => onChange(level)}
                          haptic="light"
                          className="p-1"
                          accessibilityLabel={t(`journal.nutrition.quality.level.${level}`)}
                        >
                          <Star
                            size={36}
                            color={isActive ? colors.secondary : colors.border}
                            fill={isActive ? colors.secondary : 'transparent'}
                            strokeWidth={2}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text className="text-sm text-textMuted mt-2">
                    {t(`journal.nutrition.quality.level.${current}`)}
                  </Text>
                </View>
              );
            }}
          />
        </View>

        {/* Food Name Input */}
        <View>
          <Controller
            control={control}
            name="food_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('journal.nutrition.foodName')}
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={200}
                error={
                  errors.food_name?.message ? t(errors.food_name.message as string) : undefined
                }
              />
            )}
          />
        </View>

        {/* Meal Type Selector */}
        <View>
          <SectionHeader
            icon={Clock}
            title={t('journal.nutrition.mealType')}
            className="px-0 mb-3"
          />
          <Controller
            control={control}
            name="meal_type"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-2">
                {MEAL_TYPES.map((mealType) => {
                  const Icon = mealType.icon;
                  const isSelected = value === mealType.id;
                  return (
                    <Pressable
                      key={mealType.id}
                      onPress={() => onChange(isSelected ? null : mealType.id)}
                      haptic="light"
                      className={cn(
                        'flex-1 items-center justify-center py-3 rounded-xl border',
                        isSelected ? 'bg-secondary border-secondary' : 'bg-surface border-border',
                      )}
                      accessibilityLabel={t(`dashboard.summary.mealType.${mealType.id}`)}
                    >
                      <Icon
                        size={24}
                        color={isSelected ? '#FFF' : colors.textMuted}
                        strokeWidth={2}
                      />
                      <Text
                        className={cn(
                          'text-xs mt-1',
                          isSelected ? 'text-white font-medium' : 'text-textMuted',
                        )}
                      >
                        {t(`dashboard.summary.mealType.${mealType.id}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>

        {/* Image Picker */}
        <View>
          <SectionHeader
            icon={ImageIcon}
            title={t('journal.nutrition.addMeal')}
            className="px-0 mb-3"
          />

          {imageUri ? (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-64 rounded-xl"
                resizeMode="cover"
              />
              {isUploading && (
                <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text className="text-white text-sm mt-2">
                    {t('journal.nutrition.processingPhoto')}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={removeImage}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-error rounded-full p-2"
                accessibilityLabel={t('common.delete')}
                haptic="light"
              >
                <X size={20} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleTakePhoto}
                disabled={isPickingImage}
                className="flex-1 bg-surface border-2 border-dashed border-border rounded-xl py-8 items-center justify-center"
                accessibilityLabel={t('journal.nutrition.takePhoto')}
                haptic="light"
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Camera size={32} color={colors.primary} />
                    <Text className="text-sm text-textMuted mt-2">
                      {t('journal.nutrition.takePhoto')}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handlePickImage}
                disabled={isPickingImage}
                className="flex-1 bg-surface border-2 border-dashed border-border rounded-xl py-8 items-center justify-center"
                accessibilityLabel={t('journal.nutrition.gallery')}
                haptic="light"
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <ImageIcon size={32} color={colors.primary} />
                    <Text className="text-sm text-textMuted mt-2">
                      {t('journal.nutrition.gallery')}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Note Input */}
        <View>
          <SectionHeader
            icon={MessageSquare}
            title={t('journal.nutrition.addNote')}
            className="px-0 mb-3"
          />
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                error={errors.note?.message ? t(errors.note.message as string) : undefined}
              />
            )}
          />
        </View>
      </ScrollView>

      {/* Sticky Save/Delete actions */}
      <View className="pt-3 pb-2 bg-surface border-t border-border">
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
          loading={isLoading}
        />

        {existingEntry && (
          <Button
            title={t('common.delete')}
            variant="outline"
            onPress={handleDelete}
            disabled={deleteMeal.isPending}
            loading={deleteMeal.isPending}
            className="mt-3"
          />
        )}
      </View>
    </ScreenHeader>
  );
}
