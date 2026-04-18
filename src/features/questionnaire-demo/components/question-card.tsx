import { Text, View } from 'react-native';

import { DEMO_QUESTIONS } from '@features/questionnaire-demo/constants';
import { AnswerCard } from '@features/questionnaire-demo/components/answer-card';

function isSelected(value: string, selected: string | string[] | null): boolean {
  if (Array.isArray(selected)) return selected.includes(value);
  return value === selected;
}

export function QuestionCard({
  step,
  selected,
  onSelect,
}: {
  step: number;
  selected: string | string[] | null;
  onSelect: (value: string) => void;
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
          selected={isSelected(opt.value, selected)}
          onPress={() => onSelect(opt.value)}
        />
      ))}
    </View>
  );
}
