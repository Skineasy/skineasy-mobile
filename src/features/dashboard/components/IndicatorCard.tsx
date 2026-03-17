import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

type IndicatorStatus = 'empty' | 'partial' | 'complete';
type IndicatorLayout = 'grid' | 'list';

interface IndicatorCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Visual indicator (stars, dots, emoji) displayed on the right */
  visualIndicator?: string;
  /** Secondary text info (meal types, activity name, note) */
  secondaryText?: string;
  /** Thumbnail URL for nutrition card */
  thumbnailUrl?: string;
  /** Custom content replacing the default value/visual row in list layout */
  customContent?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  status: IndicatorStatus;
  layout?: IndicatorLayout;
}

const STATUS_COLORS: Record<IndicatorStatus, string> = {
  empty: colors.textMuted,
  partial: colors.warning,
  complete: colors.success,
};

function StatusDot({ status }: { status: IndicatorStatus }): React.ReactElement {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === 'empty' || status === 'partial') {
      scale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
      );
    } else {
      scale.value = 1;
    }
  }, [status, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[status] },
        animatedStyle,
      ]}
    />
  );
}

export function IndicatorCard({
  icon: Icon,
  label,
  value,
  visualIndicator,
  secondaryText,
  thumbnailUrl,
  customContent,
  onPress,
  disabled = false,
  status,
  layout = 'list',
}: IndicatorCardProps): React.ReactElement {
  const { t } = useTranslation();
  const isEmpty = status === 'empty';

  const gridContent = (
    <Card padding="sm" className="gap-5">
      {/* Top row: Icon + Label + Status Dot */}
      <View className="flex-row justify-between items-center pr-1">
        <View className="flex-row items-center gap-1.5">
          <Icon size={20} color={colors.brownDark} />
          <Text className="font-semibold text-brown-dark">{label}</Text>
        </View>
        <StatusDot status={status} />
      </View>

      {/* Bottom row: Value or Empty state */}
      <View className="flex-row justify-between items-end">
        {isEmpty ? (
          <>
            <View />
            <ChevronRight size={20} color={colors.textMuted} />
          </>
        ) : (
          <>
            <View className="flex-1" />
            <Text className="text-2xl font-bold text-text">{value}</Text>
          </>
        )}
      </View>
    </Card>
  );

  const listContent = (
    <Card padding="md" className="gap-3">
      {/* Header row: Dot + Icon + Label + Chevron */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <StatusDot status={status} />
          <Icon size={20} color={colors.brownDark} />
          <Text className="font-semibold text-brown-dark">{label}</Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>

      {/* Content row: Value + Visual indicator (or thumbnail) */}
      {isEmpty ? (
        <Text className="text-sm text-text-muted ml-5">{t('dashboard.indicators.enterData')}</Text>
      ) : customContent ? (
        <View className="ml-5">{customContent}</View>
      ) : (
        <View className="flex-row items-center justify-between ml-5">
          <View className="flex-1 gap-0.5">
            <Text className="text-lg font-bold text-text">{value}</Text>
            {secondaryText && (
              <Text className="text-sm text-text-muted" numberOfLines={1}>
                {secondaryText}
              </Text>
            )}
          </View>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : visualIndicator ? (
            <Text className="text-base text-text-muted">{visualIndicator}</Text>
          ) : null}
        </View>
      )}
    </Card>
  );

  const content = layout === 'grid' ? gridContent : listContent;

  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} haptic="light">
        {content}
      </Pressable>
    );
  }

  return content;
}
