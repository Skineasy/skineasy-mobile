import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@shared/components/button';
import { Pressable } from '@shared/components/pressable';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';
import { CompletionScreen } from '@features/questionnaire-demo/components/completion-screen';
import { QuestionCard } from '@features/questionnaire-demo/components/question-card';
import { StepProgressBar } from '@features/questionnaire-demo/components/progress-bar';

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
