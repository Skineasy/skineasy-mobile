import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface IndicatorCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  valueIcon?: LucideIcon;
  level: number;
  isEmpty: boolean;
  onPress: () => void;
}

const BAR_HEIGHTS = [8, 12, 16, 20, 24];

function BarChart({ level, isEmpty }: { level: number; isEmpty: boolean }): React.ReactElement {
  return (
    <View className="flex-row items-end gap-[3px] h-6">
      {BAR_HEIGHTS.map((height, index) => {
        const filled = !isEmpty && index < level;
        return (
          <View
            key={index}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              backgroundColor: filled ? colors.brownDark : `${colors.textMuted}33`,
            }}
          />
        );
      })}
    </View>
  );
}

export function IndicatorCard({
  icon: Icon,
  label,
  value,
  valueIcon: ValueIcon,
  level,
  isEmpty,
  onPress,
}: IndicatorCardProps): React.ReactElement {
  return (
    <Pressable onPress={onPress} haptic="light">
      <Card padding="md" className="gap-3" style={{ shadowColor: 'transparent' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 flex-1">
            <Icon size={18} color={colors.brownDark} />
            <Text className="font-semibold text-brown-dark text-sm" numberOfLines={1}>
              {label}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </View>

        <View className="flex-row items-end justify-between gap-2">
          <View className="flex-1">
            {ValueIcon && !isEmpty ? (
              <ValueIcon size={26} color={colors.text} />
            ) : (
              <Text
                className="text-xl font-bold text-text"
                numberOfLines={1}
                style={{ color: isEmpty ? colors.textMuted : colors.text }}
              >
                {value}
              </Text>
            )}
          </View>
          <BarChart level={level} isEmpty={isEmpty} />
        </View>
      </Card>
    </Pressable>
  );
}
