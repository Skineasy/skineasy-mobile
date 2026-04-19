import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exchangeRecoveryCode } from '@features/auth/data/auth.api';
import { useResetPassword } from '@features/auth/data/auth.queries';
import { ResetPasswordInput, resetPasswordSchema } from '@features/auth/schemas/auth.schema';
import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { KeyboardScrollView } from '@shared/components/keyboard-scroll-view';
import { Pressable } from '@shared/components/pressable';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';
import { logger } from '@shared/utils/logger';
import { colors } from '@theme/colors';

type SessionState = 'exchanging' | 'ready' | 'invalid';

export default function PasswordResetScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const confirmRef = useRef<TextInput>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>(code ? 'exchanging' : 'invalid');
  const animStyles = useEntranceAnimation(3);

  useEffect(() => {
    if (!code) return;
    exchangeRecoveryCode(code)
      .then(() => setSessionState('ready'))
      .catch((err) => {
        logger.warn('[password-reset] exchange failed', { err });
        setSessionState('invalid');
      });
  }, [code]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<ResetPasswordInput>({
    mode: 'onChange',
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: ResetPasswordInput): void => {
    setHasAttemptedSubmit(true);
    resetPassword({ password: data.password });
  };

  if (sessionState === 'exchanging') {
    return (
      <Background variant="topBubble">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </Background>
    );
  }

  if (sessionState === 'invalid') {
    return (
      <Background variant="topBubble">
        <SafeAreaView className="flex-1">
          <View className="px-6 pt-4 pb-2">
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              haptic="light"
              className="w-10 h-10 rounded-full items-center justify-center"
              accessibilityLabel={t('common.back')}
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
          </View>
          <View className="flex-1 px-8 items-center justify-center">
            <Text className="text-3xl font-bold text-brown-dark text-center mb-3">
              {t('auth.passwordReset.invalidTokenTitle')}
            </Text>
            <Text className="text-base text-text-muted text-center mb-8">
              {t('auth.passwordReset.invalidTokenSubtitle')}
            </Text>
            <Button
              title={t('auth.passwordRecovery.backToLogin')}
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </SafeAreaView>
      </Background>
    );
  }

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
          <View className="flex-1 px-8 pt-10">
            <Animated.View style={animStyles[0]} className="mb-8">
              <Text className="text-3xl font-bold text-brown-dark mb-2">
                {t('auth.passwordReset.title')}
              </Text>
              <Text className="text-base text-text-muted">{t('auth.passwordReset.subtitle')}</Text>
            </Animated.View>

            <Animated.View style={animStyles[1]}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.passwordReset.newPassword')}
                    secureTextEntry
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={
                      errors.password && (touchedFields.password || hasAttemptedSubmit)
                        ? t(errors.password.message as string, { min: 6 })
                        : undefined
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={confirmRef}
                    label={t('auth.passwordReset.confirmPassword')}
                    secureTextEntry
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={
                      errors.confirmPassword &&
                      (touchedFields.confirmPassword || hasAttemptedSubmit)
                        ? t(errors.confirmPassword.message as string, { min: 6 })
                        : undefined
                    }
                  />
                )}
              />
            </Animated.View>

            <Animated.View style={animStyles[2]} className="mt-4">
              <Button
                title={t('auth.passwordReset.submit')}
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                disabled={!isValid}
              />
            </Animated.View>
          </View>
        </KeyboardScrollView>
      </SafeAreaView>
    </Background>
  );
}
