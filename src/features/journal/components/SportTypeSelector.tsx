/**
 * Sport Type Selector Component
 *
 * Hybrid approach combining quick-select chips with searchable bottom sheet.
 * - Shows popular activities as chips (Running, Cycling, Yoga, etc.)
 * - "More activities" button opens full searchable list
 * - All sport types are validated for translations and icons
 */

import { Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

import { useSportTypes } from '@features/journal/hooks/useJournal';
import { enrichSportTypes } from '@features/journal/utils/sportMapping';
import { BottomSheet } from '@shared/components/bottom-sheet';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface SportTypeSelectorProps {
  value: string | null;
  onChange: (sportType: string) => void;
}

export function SportTypeSelector({ value, onChange }: SportTypeSelectorProps) {
  const { t } = useTranslation();
  const { data: sportTypes, isLoading } = useSportTypes();

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enrich sport types with labels and icons
  const enrichedSportTypes = useMemo(() => {
    if (!sportTypes) return [];
    return enrichSportTypes(sportTypes, t);
  }, [sportTypes, t]);

  // Get popular sport types for quick select
  const popularSportTypes = useMemo(() => {
    return enrichedSportTypes.filter((s) => s.popular);
  }, [enrichedSportTypes]);

  // Filter sport types based on search
  const filteredSportTypes = useMemo(() => {
    if (!searchQuery.trim()) return enrichedSportTypes;

    const query = searchQuery.toLowerCase();
    return enrichedSportTypes.filter((sport) => sport.label.toLowerCase().includes(query));
  }, [enrichedSportTypes, searchQuery]);

  // Get label for selected value
  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const selected = enrichedSportTypes.find((s) => s.id === value);
    return selected?.label || value;
  }, [value, enrichedSportTypes]);

  const handleSelect = (sportType: string) => {
    onChange(sportType);
    setBottomSheetVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {/* Selected Value Display */}
      {value && (
        <View className="mb-4">
          <Pressable
            onPress={handleClear}
            className="flex-row items-center justify-between bg-primary/10 rounded-lg p-3 border border-primary"
            haptic="light"
          >
            <Text className="text-base text-primary font-medium">{selectedLabel}</Text>
            <X size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}

      {/* Popular Activities - Quick Select Chips */}
      {!value && popularSportTypes.length > 0 && (
        <View className="mb-3">
          <View className="flex-row flex-wrap gap-2">
            {popularSportTypes.map((sport) => (
              <Pressable
                key={sport.id}
                onPress={() => handleSelect(sport.id)}
                haptic="light"
                className="bg-surface border border-border rounded-lg px-4 py-2.5"
              >
                <Text className="text-sm text-text font-medium">{sport.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* More Activities Button */}
      {!value && (
        <Pressable
          onPress={() => setBottomSheetVisible(true)}
          haptic="light"
          className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
        >
          <Text className="text-base text-text">{t('journal.sport.moreActivities')}</Text>
          <Search size={20} color={colors.textMuted} />
        </Pressable>
      )}

      {/* Bottom Sheet - Full List with Search */}
      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => {
          setBottomSheetVisible(false);
          setSearchQuery('');
        }}
        scrollable
      >
        <View className="flex-1 px-5">
          {/* Title */}
          <Text className="text-xl font-bold text-text mb-4">
            {t('journal.sport.selectActivity')}
          </Text>

          {/* Search Input */}
          <View className="mb-4">
            <View className="flex-row items-center bg-background border border-border rounded-lg px-3 py-2">
              <Search size={20} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-2 text-base text-text"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} haptic="light">
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Sport Types List */}
          <ScrollView showsVerticalScrollIndicator={false} className="px-5">
            {filteredSportTypes.length === 0 ? (
              <View className="py-8">
                <Text className="text-center text-textMuted">
                  {t('journal.sport.noActivitiesFound')}
                </Text>
              </View>
            ) : (
              filteredSportTypes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item.id)}
                  haptic="light"
                  className="flex-row items-center justify-between py-3 border-b border-border"
                >
                  <Text className="text-base text-text">{item.label}</Text>
                  {value === item.id && <View className="w-2 h-2 rounded-full bg-primary" />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
