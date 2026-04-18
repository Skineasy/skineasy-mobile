import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Button } from '@shared/components/button';
import { colors } from '@theme/colors';

function triggerRing(value: SharedValue<number>, delayMs: number): void {
  value.value = withDelay(delayMs, withTiming(1, { duration: 700 }));
}

function triggerBounce(value: SharedValue<number>): void {
  value.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 200 }));
}

function RippleRing({ progress }: { progress: SharedValue<number> }): React.ReactElement {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.8 }],
    opacity: 1 - progress.value,
  }));
  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: colors.success,
        },
      ]}
    />
  );
}

export function CompletionScreen({ onBack }: { onBack: () => void }): React.ReactElement {
  const { t } = useTranslation();
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  useEffect(() => {
    triggerRing(ring1, 0);
    triggerRing(ring2, 150);
    triggerRing(ring3, 300);
    triggerBounce(checkScale);
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-8 px-8 pb-8">
      <View className="items-center justify-center" style={{ width: 120, height: 120 }}>
        <RippleRing progress={ring1} />
        <RippleRing progress={ring2} />
        <RippleRing progress={ring3} />
        <Animated.View style={checkStyle}>
          <CheckCircle size={64} color={colors.success} strokeWidth={1.5} />
        </Animated.View>
      </View>
      <View className="items-center gap-3">
        <Text className="text-4xl font-bold text-primary text-center">
          {t('questionnaireDemo.completionTitle')}
        </Text>
        <Text className="text-xl text-textMuted text-center">
          {t('questionnaireDemo.completionSubtitle')}
        </Text>
      </View>
      <View className="w-full">
        <Button title={t('questionnaireDemo.back')} onPress={onBack} haptic={false} />
      </View>
    </View>
  );
}
