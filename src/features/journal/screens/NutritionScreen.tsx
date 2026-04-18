/**
 * Nutrition Screen
 *
 * Allows users to log meals/snacks with:
 * - Photo upload (camera or gallery)
 * - Optional note (max 500 characters)
 * - Optional meal type (breakfast, lunch, dinner, snack)
 *
 * Connected to real backend API with image upload and validation
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
  Sun,
  Utensils,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Text, View } from 'react-native';

import {
  useCreateMeal,
  useDeleteMeal,
  useMealEntries,
  useUpdateMeal,
} from '@features/journal/hooks/useJournal';
import { journalService } from '@features/journal/services/journal.service';
import { toast } from '@lib/toast';
import { mealFormSchema, type MealFormInput } from '@features/journal/schemas/journal.schema';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import { SectionHeader } from '@shared/components/section-header';
import { cn } from '@shared/utils/cn';
import { getTodayUTC, toISODateString } from '@shared/utils/date';
import { pickImageFromGallery, takePhoto } from '@shared/utils/image';
import { colors } from '@theme/colors';

const MEAL_TYPES = [
  { id: 'breakfast', icon: Coffee },
  { id: 'lunch', icon: Sun },
  { id: 'dinner', icon: Moon },
  { id: 'snack', icon: Cookie },
] as const;

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
  });

  // Populate form when editing or with pre-selected meal type
  useEffect(() => {
    if (existingEntry && existingEntry.meal_type) {
      reset({
        food_name: existingEntry.food_name || '',
        note: existingEntry.note || '',
        meal_type: existingEntry.meal_type,
      });
    } else if (params.mealType) {
      reset({
        food_name: existingEntry?.food_name || '',
        note: existingEntry?.note || '',
        meal_type: params.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      });
    }
  }, [existingEntry, params.mealType, reset]);

  const handlePickImage = async () => {
    const uri = await pickImageFromGallery(() => {
      Alert.alert(t('common.error'), t('journal.nutrition.galleryPermissionRequired'));
    });
    if (uri) setImageUri(uri);
  };

  const handleTakePhoto = async () => {
    const uri = await takePhoto(() => {
      Alert.alert(t('common.error'), t('journal.nutrition.cameraPermissionRequired'));
    });
    if (uri) setImageUri(uri);
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const onSubmit = async (data: MealFormInput): Promise<void> => {
    let uploadedPath: string | null = null;

    if (imageWasModified && localImageUri) {
      setIsUploading(true);
      try {
        uploadedPath = await journalService.meal.uploadPhoto(
          localImageUri,
          toISODateString(dateToUse),
        );
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

  const isLoading = isUploading || createMeal.isPending || updateMeal.isPending;

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
      childrenClassName="pt-2 gap-6"
    >
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
              error={errors.food_name?.message ? t(errors.food_name.message as string) : undefined}
              autoFocus
            />
          )}
        />
      </View>

      {/* Meal Type Selector */}
      <View>
        <SectionHeader icon={Clock} title={t('journal.nutrition.mealType')} className="px-0 mb-3" />
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
            <Pressable
              onPress={removeImage}
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
              className="flex-1 bg-surface border-2 border-dashed border-border rounded-xl py-8 items-center justify-center"
              accessibilityLabel={t('journal.nutrition.takePhoto')}
              haptic="light"
            >
              <Camera size={32} color={colors.primary} />
              <Text className="text-sm text-textMuted mt-2">
                {t('journal.nutrition.takePhoto')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePickImage}
              className="flex-1 bg-surface border-2 border-dashed border-border rounded-xl py-8 items-center justify-center"
              accessibilityLabel={t('journal.nutrition.gallery')}
              haptic="light"
            >
              <ImageIcon size={32} color={colors.primary} />
              <Text className="text-sm text-textMuted mt-2">{t('journal.nutrition.gallery')}</Text>
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

      {/* Save Button */}
      <View>
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
          loading={isLoading}
        />

        {/* Delete Button (only when editing) */}
        {existingEntry && (
          <Button
            title={t('common.delete')}
            variant="outline"
            onPress={handleDelete}
            disabled={deleteMeal.isPending}
            loading={deleteMeal.isPending}
            className="mt-4"
          />
        )}
      </View>
    </ScreenHeader>
  );
}
