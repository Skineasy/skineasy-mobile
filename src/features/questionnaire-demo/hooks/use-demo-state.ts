import { useState } from 'react';

export type DemoStep = 0 | 1 | 2 | 3;

export type DemoAnswers = {
  skinType: string | null;
  concerns: string[];
  ageRange: string | null;
};

const INITIAL_ANSWERS: DemoAnswers = {
  skinType: null,
  concerns: [],
  ageRange: null,
};

export function hasAnswer(step: DemoStep, answers: DemoAnswers): boolean {
  if (step === 0) return answers.skinType !== null;
  if (step === 1) return answers.concerns.length > 0;
  if (step === 2) return answers.ageRange !== null;
  return false;
}

function updateAnswers(step: DemoStep, value: string, prev: DemoAnswers): DemoAnswers {
  if (step === 0) return { ...prev, skinType: value };
  if (step === 2) return { ...prev, ageRange: value };
  const concerns = prev.concerns.includes(value)
    ? prev.concerns.filter((c) => c !== value)
    : [...prev.concerns, value];
  return { ...prev, concerns };
}

type DemoState = {
  step: DemoStep;
  setStep: (s: DemoStep) => void;
  visibleStep: DemoStep;
  setVisibleStep: (s: DemoStep) => void;
  answers: DemoAnswers;
  setAnswer: (value: string) => void;
  canAdvance: boolean;
};

export function useDemoState(): DemoState {
  const [step, setStep] = useState<DemoStep>(0);
  const [visibleStep, setVisibleStep] = useState<DemoStep>(0);
  const [answers, setAnswers] = useState<DemoAnswers>(INITIAL_ANSWERS);

  const setAnswer = (value: string): void => {
    setAnswers((prev) => updateAnswers(step, value, prev));
  };

  return {
    step,
    setStep,
    visibleStep,
    setVisibleStep,
    answers,
    setAnswer,
    canAdvance: hasAnswer(step, answers),
  };
}
