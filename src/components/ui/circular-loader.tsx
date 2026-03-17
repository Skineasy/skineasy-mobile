import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@theme/colors';

const STROKE_WIDTH = 3;
const ROTATION_DURATION = 800;

type CircularLoaderProps = {
  size?: number;
  color?: string;
};

export function CircularLoader({
  size = 20,
  color = colors.surface,
}: CircularLoaderProps): React.ReactElement {
  const rotation = useSharedValue(0);
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}
