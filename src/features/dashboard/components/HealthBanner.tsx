import * as Device from 'expo-device';
import { Heart, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { toast } from '@lib/toast';
import { useHealthBannerVisible } from '@features/dashboard/hooks/useHealthBannerVisible';
import { useHealthKitSync } from '@features/healthkit/hooks/useHealthKitSync';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

const SPRING = { damping: 18, stiffness: 220, mass: 0.8 };

export function HealthBanner(): React.ReactElement | null {
  const { t } = useTranslation();
  const { visible, dismissLater } = useHealthBannerVisible();
  const { requestAuthorization, sync } = useHealthKitSync();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, SPRING);
      translateY.value = withSpring(0, SPRING);
    }
  }, [visible, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleConnect = async (): Promise<void> => {
    if (!Device.isDevice) {
      toast.error(t('healthkit.simulatorError'));
      return;
    }
    const ok = await requestAuthorization();
    if (ok) {
      await sync();
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={style}
      className="mx-4 px-4 py-3 rounded-lg bg-surface border border-border flex-row items-center gap-3"
    >
      <Heart size={18} color={colors.warning} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-primary">
          {t('dashboard.healthBanner.titleQuiet')}
        </Text>
        <Text className="text-xs text-textMuted">{t('dashboard.healthBanner.subtitleQuiet')}</Text>
      </View>
      <Pressable
        onPress={handleConnect}
        haptic="medium"
        className="px-3 py-1.5 rounded-full border border-primary"
      >
        <Text className="text-xs font-medium text-primary">
          {t('dashboard.healthBanner.ctaShort')}
        </Text>
      </Pressable>
      <Pressable
        onPress={dismissLater}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.healthBanner.dismiss')}
        hitSlop={8}
      >
        <X size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}
