import type { LucideIcon } from 'lucide-react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { TimeOfDay } from '@features/routine/types/routine.types';
import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

interface ToggleButtonProps {
  time: TimeOfDay;
  isSelected: boolean;
  onSelect: (time: TimeOfDay) => void;
  icon: LucideIcon;
  label: string;
  stepCount: number;
}

function ToggleButton({
  time,
  isSelected,
  onSelect,
  icon: Icon,
  label,
  stepCount,
}: ToggleButtonProps) {
  return (
    <Pressable
      onPress={() => onSelect(time)}
      haptic="light"
      className="flex-1"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
    >
      <Card isPressed={isSelected} padding="sm" className="flex-row items-center justify-center">
        <Icon size={20} color={isSelected ? colors.surface : colors.text} />
        <Text className={cn('ml-2 font-medium', isSelected ? 'text-white' : 'text-text')}>
          {label}
        </Text>
        <View
          className={cn(
            'ml-2 px-2 py-0.5 rounded-full',
            isSelected ? 'bg-white/20' : 'bg-gray-100',
          )}
        >
          <Text
            className={cn('text-xs font-semibold', isSelected ? 'text-white' : 'text-gray-700')}
          >
            {stepCount}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

interface RoutineToggleProps {
  selected: TimeOfDay;
  onSelect: (time: TimeOfDay) => void;
  morningStepCount: number;
  eveningStepCount: number;
}

export function RoutineToggle({
  selected,
  onSelect,
  morningStepCount,
  eveningStepCount,
}: RoutineToggleProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3 py-3">
      <ToggleButton
        time="morning"
        isSelected={selected === 'morning'}
        onSelect={onSelect}
        icon={Sun}
        label={t('routine.morning')}
        stepCount={morningStepCount}
      />
      <ToggleButton
        time="evening"
        isSelected={selected === 'evening'}
        onSelect={onSelect}
        icon={Moon}
        label={t('routine.evening')}
        stepCount={eveningStepCount}
      />
    </View>
  );
}
