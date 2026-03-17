import assets from '@assets';
import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const ANIMATION_CONFIG = {
  duration: 800,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

const DELAYS = {
  logo: 0,
  tagline: 200,
  primaryButton: 400,
  secondaryButton: 550,
};

export default function WelcomeScreen() {
  const { t } = useTranslation();

  const logoProgress = useSharedValue(0);
  const taglineProgress = useSharedValue(0);
  const primaryButtonProgress = useSharedValue(0);
  const secondaryButtonProgress = useSharedValue(0);

  useEffect(() => {
    logoProgress.value = withDelay(DELAYS.logo, withSpring(1, SPRING_CONFIG));
    taglineProgress.value = withDelay(DELAYS.tagline, withTiming(1, ANIMATION_CONFIG));
    primaryButtonProgress.value = withDelay(DELAYS.primaryButton, withSpring(1, SPRING_CONFIG));
    secondaryButtonProgress.value = withDelay(DELAYS.secondaryButton, withSpring(1, SPRING_CONFIG));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoProgress.value,
    transform: [
      { scale: interpolate(logoProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(logoProgress.value, [0, 1], [-20, 0]) },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineProgress.value,
    transform: [{ translateY: interpolate(taglineProgress.value, [0, 1], [20, 0]) }],
  }));

  const primaryButtonStyle = useAnimatedStyle(() => ({
    opacity: primaryButtonProgress.value,
    transform: [{ translateY: interpolate(primaryButtonProgress.value, [0, 1], [30, 0]) }],
  }));

  const secondaryButtonStyle = useAnimatedStyle(() => ({
    opacity: secondaryButtonProgress.value,
    transform: [{ translateY: interpolate(secondaryButtonProgress.value, [0, 1], [25, 0]) }],
  }));

  return (
    <Background variant="fullBubble">
      {/* Logo - absolute center */}
      <Animated.View style={logoStyle} className="absolute inset-0 items-center justify-center">
        <Image source={assets.logo} style={{ width: 200, height: 200 }} resizeMode="contain" />
      </Animated.View>

      {/* Bottom Section - CTAs */}
      <SafeAreaView className="flex-1 justify-end px-4 pb-2">
        <View className="gap-4 px-4">
          <Animated.Text style={taglineStyle} className="text-2xl font-bold text-text text-center">
            {t('welcome.tagline')}
          </Animated.Text>

          <Animated.View style={primaryButtonStyle}>
            <Link href="/(auth)/register" asChild>
              <Button title={t('welcome.getStarted')} haptic="heavy" />
            </Link>
          </Animated.View>

          <Animated.View style={secondaryButtonStyle}>
            <Link href="/(auth)/login" asChild>
              <Button title={t('welcome.signIn')} variant="outline" haptic="medium" />
            </Link>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Background>
  );
}
