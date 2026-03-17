import { Clock } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@theme/colors';

export function RoutineProcessingState(): React.ReactElement {
  const { t } = useTranslation();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View style={animatedStyle}>
        <Clock size={64} color={colors.primary} strokeWidth={1.5} />
      </Animated.View>
      <Text className="text-xl font-bold text-text mt-6 text-center">
        {t('routine.processingTitle')}
      </Text>
      <Text className="text-base text-text-muted mt-2 text-center">
        {t('routine.processingSubtitle')}
      </Text>
    </View>
  );
}
