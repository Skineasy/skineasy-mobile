import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogin } from '@features/auth/hooks/useLogin';
import { LoginInput, loginSchema } from '@features/auth/schemas/auth.schema';
import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { KeyboardScrollView } from '@shared/components/keyboard-scroll-view';
import { Pressable } from '@shared/components/pressable';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { mutate: login, isPending } = useLogin();
  const passwordRef = useRef<TextInput>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const animStyles = useEntranceAnimation(4);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<LoginInput>({
    mode: 'onChange',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    setHasAttemptedSubmit(true);
    login(data);
  };

  return (
    <Background variant="topBubble">
      <SafeAreaView className="flex-1 pt-20">
        <KeyboardScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={180}>
          <View className="flex-1 px-8 justify-between" style={{ minHeight: '100%' }}>
            <View>
              {/* Welcome Text */}
              <Animated.View style={animStyles[0]} className="pt-20 mb-10">
                <Text className="text-3xl font-bold text-brown-dark mb-2">
                  {t('auth.welcomeBack')}
                </Text>
              </Animated.View>

              {/* Form Section */}
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
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
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

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      ref={passwordRef}
                      label={t('auth.password')}
                      secureTextEntry
                      showPasswordToggle
                      autoCapitalize="none"
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
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

                {/* Forgot Password Link */}
                <Link href="/(auth)/password-recovery" asChild>
                  <Pressable className="-mt-4 mb-6 self-end" haptic="light">
                    <Text className="text-sm text-primary font-medium">
                      {t('auth.forgotPassword')}
                    </Text>
                  </Pressable>
                </Link>
              </Animated.View>

              <Animated.View style={animStyles[2]}>
                <Button
                  title={t('auth.login')}
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={!isValid}
                />

                {__DEV__ && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    title="Login Dev"
                    haptic="medium"
                    onPress={() =>
                      login({
                        email: 'aurelien1@gmail.com',
                        password: '123456',
                      })
                    }
                  />
                )}
              </Animated.View>
            </View>

            {/* Footer Section - Bottom */}
            <Animated.View style={animStyles[3]} className="pb-10 items-center pt-4">
              <Link href="/(auth)/register" asChild>
                <Pressable haptic="light">
                  <Text className="text-sm text-primary">
                    {t('auth.noAccount')}{' '}
                    <Text className="text-primary font-bold text-base">{t('auth.register')}</Text>
                  </Text>
                </Pressable>
              </Link>
            </Animated.View>
          </View>
        </KeyboardScrollView>
      </SafeAreaView>
    </Background>
  );
}
