import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { StressLevel } from '@shared/types/journal.types';

const STRESS_COLORS = ['#7D604E', '#D2C5BD', '#FFCEC2', '#FF977E', '#E84C3F'] as const;
const BAR_HEIGHTS = [40, 70, 100, 130, 160] as const;

const LEVEL_KEYS: Record<StressLevel, string> = {
  1: 'minimal',
  2: 'mild',
  3: 'moderate',
  4: 'high',
  5: 'intense',
};

interface StressLevelDisplayProps {
  level: StressLevel;
}

export function StressLevelDisplay({ level }: StressLevelDisplayProps): React.ReactElement {
  const { t } = useTranslation();

  const levelKey = LEVEL_KEYS[level];
  const label = t(`journal.stress.level.${levelKey}`);
  const description = t(`journal.stress.description.${levelKey}`);

  return (
    <View className="items-center">
      {/* Level label */}
      <Text className="text-3xl font-bold text-brown-dark mb-2">{label}</Text>

      {/* Description */}
      <Text className="text-base text-textMuted text-center mb-8 px-4">{description}</Text>

      {/* Bars visualization */}
      <View className="flex-row items-end justify-center gap-3 h-44">
        {STRESS_COLORS.map((color, index) => {
          const barLevel = (index + 1) as StressLevel;
          const isActive = barLevel <= level;
          const height = BAR_HEIGHTS[index];

          return (
            <View
              key={index}
              style={{
                width: 44,
                height,
                borderRadius: 22,
                backgroundColor: isActive ? color : `${color}40`,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
