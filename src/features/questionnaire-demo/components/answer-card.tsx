import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { haptic } from '@shared/utils/haptic';

const SPRING_CONFIG = { damping: 20, stiffness: 300 };

function animateCardTap(scale: SharedValue<number>): void {
  scale.value = withSequence(withTiming(0.97, { duration: 60 }), withSpring(1, SPRING_CONFIG));
}

export function AnswerCard({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = (): void => {
    animateCardTap(scale);
    haptic.selection();
    onPress();
  };

  return (
    <Animated.View style={cardStyle}>
      <Pressable onPress={handlePress} haptic={false}>
        <Card isPressed={selected}>
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">{emoji}</Text>
            <Text className={cn('text-xl flex-1', selected ? 'text-white' : 'text-text')}>
              {label}
            </Text>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
