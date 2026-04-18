import { Text, View } from 'react-native';

import { DEMO_QUESTIONS } from '@features/questionnaire-demo/constants';
import { AnswerCard } from '@features/questionnaire-demo/components/answer-card';

export function QuestionCard({
  step,
  selected,
}: {
  step: number;
  selected: string | null;
}): React.ReactElement {
  const question = DEMO_QUESTIONS[step];
  if (!question) return <View className="flex-1" />;

  return (
    <View className="flex-1 gap-3 pt-4">
      <Text className="text-4xl font-bold text-primary text-center mb-4">{question.title}</Text>
      {question.options.map((opt) => (
        <AnswerCard
          key={opt.value}
          emoji={opt.emoji}
          label={opt.label}
          selected={opt.value === selected}
          onPress={() => {}}
        />
      ))}
    </View>
  );
}
