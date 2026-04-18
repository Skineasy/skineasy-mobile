import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useForgotPassword } from '@features/auth/data/auth.queries';
import { ForgotPasswordInput, forgotPasswordSchema } from '@features/auth/schemas/auth.schema';
import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { KeyboardScrollView } from '@shared/components/keyboard-scroll-view';
import { Pressable } from '@shared/components/pressable';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';
import { colors } from '@theme/colors';

const SUCCESS_REDIRECT_MS = 3000;

export default function PasswordRecoveryScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: requestReset, isPending } = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const animStyles = useEntranceAnimation(4);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<ForgotPasswordInput>({
    mode: 'onChange',
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, SUCCESS_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [submitted, router]);

  const onSubmit = (data: ForgotPasswordInput): void => {
    setHasAttemptedSubmit(true);
    requestReset(data, {
      onSuccess: () => setSubmitted(true),
    });
  };

  return (
    <Background variant="topBubble">
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            haptic="light"
            className="w-10 h-10 rounded-full items-center justify-center"
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={180}>
          <View className="flex-1 px-8" style={{ minHeight: '100%' }}>
            {submitted ? (
              <Animated.View style={animStyles[0]} className="flex-1 items-center justify-center">
                <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
                  <MailCheck size={40} color={colors.primary} />
                </View>
                <Text className="text-3xl font-bold text-brown-dark text-center mb-3">
                  {t('auth.passwordRecovery.successTitle')}
                </Text>
                <Text className="text-base text-text-muted text-center">
                  {t('auth.passwordRecovery.successSubtitle')}
                </Text>
              </Animated.View>
            ) : (
              <View className="flex-1 pt-10">
                <Animated.View style={animStyles[0]} className="mb-8">
                  <Text className="text-3xl font-bold text-brown-dark mb-2">
                    {t('auth.passwordRecovery.title')}
                  </Text>
                  <Text className="text-base text-text-muted">
                    {t('auth.passwordRecovery.subtitle')}
                  </Text>
                </Animated.View>

                <Animated.View style={animStyles[1]}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label={t('auth.email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={
                          errors.email && (touchedFields.email || hasAttemptedSubmit)
                            ? t(errors.email.message as string)
                            : undefined
                        }
                      />
                    )}
                  />
                </Animated.View>

                <Animated.View style={animStyles[2]} className="mt-4">
                  <Button
                    title={t('auth.passwordRecovery.submit')}
                    onPress={handleSubmit(onSubmit)}
                    loading={isPending}
                    disabled={!isValid}
                  />
                </Animated.View>
              </View>
            )}
          </View>
        </KeyboardScrollView>
      </SafeAreaView>
    </Background>
  );
}
