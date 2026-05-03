import { Step1Name } from '@features/auth/components/onboarding/Step1Name';
import { Step2AboutYou } from '@features/auth/components/onboarding/Step2AboutYou';
import { Step3HealthSync } from '@features/auth/components/onboarding/Step3HealthSync';
import { Step4Credentials } from '@features/auth/components/onboarding/Step4Credentials';
import { Step5EmailVerification } from '@features/auth/components/onboarding/Step5EmailVerification';
import { useRegister } from '@features/auth/data/auth.queries';
import {
  RegisterInput,
  registerSchema,
  step1Schema,
  step2Schema,
} from '@features/auth/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Background } from '@shared/components/background';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Platform, View } from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { SafeAreaView } from '@shared/components/styled-rn';

const TOTAL_STEPS = 5;

export default function RegisterScreen() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
    watch,
  } = useForm<RegisterInput>({
    mode: 'onChange',
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      id_gender: undefined,
      birthday: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const validateStep = async (step: number): Promise<boolean> => {
    const values = getValues();

    if (step === 1) {
      const result = step1Schema.safeParse({
        firstname: values.firstname,
        lastname: values.lastname,
      });
      if (!result.success) {
        await trigger(['firstname', 'lastname']);
        return false;
      }
      return true;
    }

    if (step === 2) {
      const result = step2Schema.safeParse({
        id_gender: values.id_gender,
        birthday: values.birthday,
      });
      if (!result.success) {
        await trigger(['id_gender', 'birthday']);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < TOTAL_STEPS) {
      setDirection('forward');
      setCurrentStep((prev) => {
        const next = prev + 1;
        return next === 3 && Platform.OS !== 'ios' ? next + 1 : next;
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('back');
      setCurrentStep((prev) => {
        const next = prev - 1;
        return next === 3 && Platform.OS !== 'ios' ? next - 1 : next;
      });
    } else {
      router.back();
    }
  };

  const enteringAnim =
    direction === 'forward' ? FadeInRight.duration(300) : FadeInLeft.duration(300);
  const exitingAnim =
    direction === 'forward' ? FadeOutLeft.duration(300) : FadeOutRight.duration(300);

  const onSubmit = (data: RegisterInput) => {
    register(data, {
      onSuccess: () => {
        setCurrentStep(5);
      },
    });
  };

  const isStep1Valid = getValues('firstname')?.length >= 2 && getValues('lastname')?.length >= 2;

  const watchedGender = watch('id_gender');
  const isStep2Valid =
    typeof watchedGender === 'number' && watchedGender >= 1 && watchedGender <= 3;

  const isStep4Valid =
    getValues('email')?.length > 0 &&
    getValues('password')?.length >= 6 &&
    getValues('confirmPassword')?.length >= 6 &&
    getValues('password') === getValues('confirmPassword');

  // Step 3 has its own full-screen background (handles SafeAreaView internally)
  if (currentStep === 3) {
    return (
      <Animated.View key="step3" entering={enteringAnim} exiting={exitingAnim} className="flex-1">
        <Step3HealthSync onNext={handleNext} onSkip={handleNext} onBack={handleBack} />
      </Animated.View>
    );
  }

  // Step 5 has its own full-screen background (handles SafeAreaView internally)
  if (currentStep === 5) {
    return (
      <Animated.View key="step5" entering={enteringAnim} exiting={exitingAnim} className="flex-1">
        <Step5EmailVerification email={getValues('email')} />
      </Animated.View>
    );
  }

  return (
    <Background variant="topBubble">
      <SafeAreaView className="flex-1">
        {/* Back Button */}
        <View className="px-6 pt-4 pb-2">
          <Pressable
            onPress={handleBack}
            haptic="light"
            className="w-10 h-10 rounded-full"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Step Content */}
        <View className="flex-1">
          {currentStep === 1 && (
            <Animated.View
              key="step1"
              entering={enteringAnim}
              exiting={exitingAnim}
              className="flex-1"
            >
              <Step1Name
                onNext={handleNext}
                control={control}
                errors={errors}
                isValid={isStep1Valid}
              />
            </Animated.View>
          )}

          {currentStep === 2 && (
            <Animated.View
              key="step2"
              entering={enteringAnim}
              exiting={exitingAnim}
              className="flex-1"
            >
              <Step2AboutYou
                onNext={handleNext}
                control={control}
                errors={errors}
                isValid={isStep2Valid}
              />
            </Animated.View>
          )}

          {currentStep === 4 && (
            <Animated.View
              key="step4"
              entering={enteringAnim}
              exiting={exitingAnim}
              className="flex-1"
            >
              <Step4Credentials
                onNext={handleSubmit(onSubmit)}
                control={control}
                errors={errors}
                isValid={isStep4Valid}
                isLoading={isPending}
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}
