import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@shared/components/button';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

const TOTAL_STEPS = 3;

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

function StepProgressBar({ step }: { step: DemoStep }): React.ReactElement {
  return (
    <View className="flex-row gap-1.5 flex-1 ml-4">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          className="flex-1 h-1.5 rounded-full"
          style={{ backgroundColor: step > i ? colors.primary : colors.border }}
        />
      ))}
    </View>
  );
}

function QuestionCard({ step }: { step: DemoStep }): React.ReactElement {
  return (
    <View className="flex-1 px-6 pt-4">
      <View
        className="flex-1 rounded-2xl bg-surface p-6 justify-center items-center"
        style={{ borderWidth: 1, borderColor: colors.border }}
      >
        <Text className="text-lg font-medium text-textMuted text-center">
          {`Question ${step + 1}`}
        </Text>
      </View>
    </View>
  );
}

function hasAnswer(step: DemoStep, answers: DemoAnswers): boolean {
  if (step === 0) return answers.skinType !== null;
  if (step === 1) return answers.concerns.length > 0;
  if (step === 2) return answers.ageRange !== null;
  return false;
}

export function QuestionnaireDemoScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<DemoStep>(0);
  const [answers, _setAnswers] = useState<DemoAnswers>(INITIAL_ANSWERS);

  const advance = (): void => setStep((s) => Math.min(s + 1, 3) as DemoStep);
  const _goBack = (): void => setStep((s) => Math.max(s - 1, 0) as DemoStep);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable onPress={() => router.back()} haptic="light">
          <X size={24} color={colors.text} />
        </Pressable>
        <StepProgressBar step={step} />
      </View>

      <QuestionCard step={step} />

      <View className="px-6 pb-6 pt-4">
        <Button
          title={t('questionnaireDemo.next')}
          onPress={advance}
          disabled={!hasAnswer(step, answers)}
          haptic="medium"
        />
      </View>
    </SafeAreaView>
  );
}
