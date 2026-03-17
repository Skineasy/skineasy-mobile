import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface BannerAnimationResult {
  scaleAnim: Animated.Value;
  pressScale: Animated.Value;
  floatAnims: [Animated.Value, Animated.Value, Animated.Value];
  handlePressIn: () => void;
  handlePressOut: () => void;
  getFloatStyle: (anim: Animated.Value) => {
    transform: { translateY: Animated.AnimatedInterpolation<number> }[];
    opacity: Animated.AnimatedInterpolation<number>;
  };
}

export function useBannerAnimation(): BannerAnimationResult {
  // eslint-disable-next-line react-hooks/refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // eslint-disable-next-line react-hooks/refs
  const pressScale = useRef(new Animated.Value(1)).current;
  // eslint-disable-next-line react-hooks/refs
  const float1 = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/refs
  const float2 = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/refs
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.015,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const createFloat = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const float1Anim = createFloat(float1, 0);
    const float2Anim = createFloat(float2, 500);
    const float3Anim = createFloat(float3, 1000);

    float1Anim.start();
    float2Anim.start();
    float3Anim.start();

    return () => {
      pulse.stop();
      float1Anim.stop();
      float2Anim.stop();
      float3Anim.stop();
    };
    // eslint-disable-next-line react-hooks/refs
  }, [scaleAnim, float1, float2, float3]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getFloatStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.2, 1, 0.2],
    }),
  });

  // eslint-disable-next-line react-hooks/refs
  return {
    scaleAnim,
    pressScale,
    // eslint-disable-next-line react-hooks/refs
    floatAnims: [float1, float2, float3],
    handlePressIn,
    handlePressOut,
    getFloatStyle,
  };
}
