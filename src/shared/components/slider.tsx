import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  width?: number;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  trackColor = colors.creamMuted,
  activeTrackColor = colors.primary,
  thumbColor = colors.primary,
  width,
}: SliderProps): React.ReactElement {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const sliderWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const lastStepValue = useSharedValue(value);
  const lastValueRef = useRef(value);

  // Store min/max/step in shared values for worklet access
  const minValue = useSharedValue(min);
  const maxValue = useSharedValue(max);
  const stepValue = useSharedValue(step);

  // Update shared values when props change
  useEffect(() => {
    minValue.value = min;
    maxValue.value = max;
    stepValue.value = step;
  }, [min, max, step, minValue, maxValue, stepValue]);

  const valueToPosition = useCallback(
    (val: number, width: number): number => {
      const range = max - min;
      const normalizedValue = (val - min) / range;
      return normalizedValue * (width - THUMB_SIZE);
    },
    [min, max],
  );

  const triggerHaptic = useCallback(() => {
    haptic.light();
  }, []);

  const handleValueChange = useCallback(
    (newValue: number) => {
      onChange(newValue);
    },
    [onChange],
  );

  // Update position when value changes from parent
  useEffect(() => {
    if (layoutWidth > 0 && value !== lastValueRef.current) {
      lastValueRef.current = value;
      translateX.value = valueToPosition(value, layoutWidth);
    }
  }, [value, layoutWidth, valueToPosition, translateX]);

  const triggerStartHaptic = useCallback(() => {
    haptic.light();
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(triggerStartHaptic)();
    })
    .onUpdate((event) => {
      'worklet';
      const width = sliderWidth.value;
      const newX = Math.max(0, Math.min(event.x - THUMB_SIZE / 2, width - THUMB_SIZE));
      translateX.value = newX;

      // Calculate value inline (worklet-compatible)
      const range = maxValue.value - minValue.value;
      const normalizedPosition = newX / (width - THUMB_SIZE);
      const rawValue = normalizedPosition * range + minValue.value;
      const steppedValue = Math.round(rawValue / stepValue.value) * stepValue.value;
      const clampedValue = Math.max(minValue.value, Math.min(maxValue.value, steppedValue));

      if (clampedValue !== lastStepValue.value) {
        lastStepValue.value = clampedValue;
        runOnJS(triggerHaptic)();
        runOnJS(handleValueChange)(clampedValue);
      }
    })
    .onEnd(() => {
      'worklet';
      const width = sliderWidth.value;
      // Snap to final position
      const range = maxValue.value - minValue.value;
      const normalizedPosition = translateX.value / (width - THUMB_SIZE);
      const rawValue = normalizedPosition * range + minValue.value;
      const steppedValue = Math.round(rawValue / stepValue.value) * stepValue.value;
      const finalValue = Math.max(minValue.value, Math.min(maxValue.value, steppedValue));

      // Calculate position for final value
      const normalizedValue = (finalValue - minValue.value) / range;
      const finalX = normalizedValue * (width - THUMB_SIZE);

      translateX.value = finalX;
      runOnJS(triggerHaptic)();
    });

  const tapGesture = Gesture.Tap().onEnd((event) => {
    'worklet';
    const width = sliderWidth.value;
    const newX = Math.max(0, Math.min(event.x - THUMB_SIZE / 2, width - THUMB_SIZE));

    // Calculate value inline
    const range = maxValue.value - minValue.value;
    const normalizedPosition = newX / (width - THUMB_SIZE);
    const rawValue = normalizedPosition * range + minValue.value;
    const steppedValue = Math.round(rawValue / stepValue.value) * stepValue.value;
    const newValue = Math.max(minValue.value, Math.min(maxValue.value, steppedValue));

    // Calculate position for new value
    const normalizedValue = (newValue - minValue.value) / range;
    const finalX = normalizedValue * (width - THUMB_SIZE);

    translateX.value = finalX;
    runOnJS(triggerHaptic)();
    runOnJS(handleValueChange)(newValue);
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }): void => {
      // width prop is the track width (distance thumb can travel + THUMB_SIZE)
      // layout width includes paddingHorizontal (THUMB_SIZE/2 on each side)
      const containerWidth = width ?? e.nativeEvent.layout.width - THUMB_SIZE;
      setLayoutWidth(containerWidth);
      sliderWidth.value = containerWidth;
      translateX.value = valueToPosition(value, containerWidth);
      lastValueRef.current = value;
    },
    [sliderWidth, translateX, value, valueToPosition, width],
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <View
        className="justify-center"
        style={{
          height: THUMB_SIZE + 16,
          paddingHorizontal: THUMB_SIZE / 2,
          width: width ? width + THUMB_SIZE : undefined,
        }}
        onLayout={handleLayout}
      >
        {/* Track background */}
        <View
          className="absolute rounded-full"
          style={{
            height: TRACK_HEIGHT,
            left: THUMB_SIZE / 2,
            right: THUMB_SIZE / 2,
            backgroundColor: trackColor,
          }}
        />

        {/* Active track */}
        <Animated.View
          className="absolute rounded-full"
          style={[
            {
              height: TRACK_HEIGHT,
              left: THUMB_SIZE / 2,
              backgroundColor: activeTrackColor,
            },
            activeTrackStyle,
          ]}
        />

        {/* Thumb */}
        <Animated.View
          style={[
            thumbStyle,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: thumbColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}
