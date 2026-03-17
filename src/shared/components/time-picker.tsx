/**
 * Time Picker Component
 *
 * A duration picker using iOS-style wheel picker in a BottomSheet.
 * Used for selecting sleep duration (hours and minutes).
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { BottomSheet } from '@shared/components/bottom-sheet';
import { Button } from '@shared/components/button';
import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';
import { Hourglass } from 'lucide-react-native';
import { SectionHeader } from '@shared/components/section-header';

interface TimePickerProps {
  value: number | undefined; // minutes
  onChange: (minutes: number) => void;
  label?: string;
  title?: string; // Title shown in the BottomSheet
}

function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined) return '--:--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

function minutesToDate(minutes: number): Date {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

const DEFAULT_PICKER_MINUTES = 480; // 8 hours

export function TimePicker({ value, onChange, label, title }: TimePickerProps): React.ReactElement {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value ?? DEFAULT_PICKER_MINUTES);

  const handleOpen = (): void => {
    setTempValue(value ?? DEFAULT_PICKER_MINUTES);
    setIsOpen(true);
  };

  const handleChange = (_event: unknown, selectedDate?: Date): void => {
    if (selectedDate) {
      setTempValue(dateToMinutes(selectedDate));
    }
    if (Platform.OS === 'android') {
      onChange(dateToMinutes(selectedDate ?? minutesToDate(tempValue)));
      setIsOpen(false);
    }
  };

  const handleConfirm = (): void => {
    onChange(tempValue);
    setIsOpen(false);
  };

  return (
    <View>
      {label && <SectionHeader icon={Hourglass} title={label} className="px-0 mb-3" />}

      {/* Trigger */}
      <Pressable onPress={handleOpen} haptic="light">
        <GlassContainer style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
          <Text className="text-4xl font-bold text-brown-dark text-center">
            {formatDuration(value)}
          </Text>
        </GlassContainer>
      </Pressable>

      {/* BottomSheet with Picker */}
      <BottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
        <View>
          {title && (
            <Text className="text-lg font-semibold text-text text-center mb-4">{title}</Text>
          )}
          <View className="items-center">
            <DateTimePicker
              value={minutesToDate(tempValue)}
              mode="time"
              display="spinner"
              onChange={handleChange}
              locale="fr-FR"
              is24Hour
              textColor={colors.text}
            />
          </View>
          <View className="px-4 mt-4">
            <Button title={t('common.confirm')} onPress={handleConfirm} />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
