import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';
import { DEMO_QUESTIONS } from '@features/questionnaire-demo/constants';

const TOTAL_STEPS = 3;
const SPRING_CONFIG = { damping: 20, stiffness: 300 };

type DemoStep = 0 | 1 | 2 | 3;

type DemoAnswers = {
  skinType: string | null;
  concerns: string[];
  ageRange: string | null;
};

const INITIAL_ANSWERS: DemoAnswers = {
  skinType: null,
  concerns: [],
  ageRange: null,
};

function AnimatedSegment({ filled }: { filled: boolean }): React.ReactElement {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(-200);

  useEffect(() => {
    if (trackWidth === 0) return;
    translateX.value = withSpring(filled ? 0 : -trackWidth, SPRING_CONFIG);
  }, [filled, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className="flex-1 h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: colors.border }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[fillStyle, { flex: 1, backgroundColor: colors.primary }]} />
    </View>
  );
}

function StepProgressBar({ step }: { step: DemoStep }): React.ReactElement {
  return (
    <View className="flex-row gap-1.5 flex-1 ml-4">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <AnimatedSegment key={i} filled={step > i} />
      ))}
    </View>
  );
}

function TappableCard({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
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
        {children}
      </Pressable>
    </Animated.View>
  );
}

function QuestionCard({
  step,
  selected,
}: {
  step: DemoStep;
  selected: string | null;
}): React.ReactElement {
  const question = DEMO_QUESTIONS[step];
  if (!question) return <View className="flex-1" />;

  return (
    <View className="flex-1 gap-3 pt-4">
      <Text className="text-4xl font-bold text-primary text-center mb-4">{question.title}</Text>
      {question.options.map((opt) => (
        <TappableCard key={opt.value} onPress={() => {}}>
          <Card isPressed={opt.value === selected}>
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{opt.emoji}</Text>
              <Text
                className={cn(
                  'text-xl flex-1',
                  opt.value === selected ? 'text-white' : 'text-text',
                )}
              >
                {opt.label}
              </Text>
            </View>
          </Card>
        </TappableCard>
      ))}
    </View>
  );
}

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

function CompletionScreen({ onBack }: { onBack: () => void }): React.ReactElement {
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

function animateCardTap(scale: SharedValue<number>): void {
  scale.value = withSequence(withTiming(0.97, { duration: 60 }), withSpring(1, SPRING_CONFIG));
}

function animateCtaEnabled(ctaOpacity: SharedValue<number>, enabled: boolean): void {
  ctaOpacity.value = withSpring(enabled ? 1.0 : 0.4, SPRING_CONFIG);
}

function hasAnswer(step: DemoStep, answers: DemoAnswers): boolean {
  if (step === 0) return answers.skinType !== null;
  if (step === 1) return answers.concerns.length > 0;
  if (step === 2) return answers.ageRange !== null;
  return false;
}

function runStepTransition(
  tx: SharedValue<number>,
  opacity: SharedValue<number>,
  setVisible: (s: DemoStep) => void,
  next: DemoStep,
  dir: 'forward' | 'backward',
): void {
  const exitX = dir === 'forward' ? -30 : 30;
  const enterX = dir === 'forward' ? 30 : -30;
  opacity.value = withSpring(0, SPRING_CONFIG);
  tx.value = withSpring(exitX, SPRING_CONFIG, () => {
    tx.value = enterX;
    opacity.value = 0;
    runOnJS(setVisible)(next);
    tx.value = withSpring(0, SPRING_CONFIG);
    opacity.value = withSpring(1, SPRING_CONFIG);
  });
}

export function QuestionnaireDemoScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<DemoStep>(0);
  const [visibleStep, setVisibleStep] = useState<DemoStep>(0);
  const [answers, _setAnswers] = useState<DemoAnswers>(INITIAL_ANSWERS);
  const tx = useSharedValue(0);
  const opacity = useSharedValue(1);
  const ctaOpacity = useSharedValue(0.4);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: opacity.value,
  }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const advance = (): void => {
    if (!hasAnswer(step, answers)) return;
    const next = Math.min(step + 1, 3) as DemoStep;
    setStep(next);
    animateCtaEnabled(ctaOpacity, false);
    runStepTransition(tx, opacity, setVisibleStep, next, 'forward');
  };
  const goBack = (): void => {
    const prev = Math.max(step - 1, 0) as DemoStep;
    setStep(prev);
    animateCtaEnabled(ctaOpacity, hasAnswer(prev, answers));
    runStepTransition(tx, opacity, setVisibleStep, prev, 'backward');
  };
  const handleCompletion = (): void => {
    haptic.success();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient colors={[colors.surface, colors.creamMuted]} style={{ flex: 1 }}>
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <Pressable onPress={() => router.back()} haptic="light">
            <X size={24} color={colors.text} />
          </Pressable>
          {step > 0 && step < 3 && (
            <Pressable onPress={goBack} haptic="light" className="ml-2">
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
          )}
          <StepProgressBar step={step} />
        </View>

        {visibleStep === 3 ? (
          <CompletionScreen onBack={handleCompletion} />
        ) : (
          <>
            <View className="flex-1 px-6 pt-4">
              <Animated.View style={[cardStyle, { flex: 1 }]}>
                <QuestionCard step={visibleStep} selected={null} />
              </Animated.View>
            </View>
            <Animated.View style={ctaStyle} className="px-6 pb-6 pt-4">
              <Button
                title={t('questionnaireDemo.next')}
                onPress={advance}
                haptic={hasAnswer(step, answers) ? 'medium' : false}
              />
            </Animated.View>
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
