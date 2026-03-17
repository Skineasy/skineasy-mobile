import { useRef } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Linking, Text, TextInput, View } from 'react-native';

import { RegisterInput } from '@features/auth/schemas/auth.schema';
import { Button } from '@shared/components/button';
import { Input } from '@shared/components/input';
import { KeyboardScrollView } from '@shared/components/keyboard-scroll-view';

interface Step4CredentialsProps {
  onNext: () => void;
  control: Control<RegisterInput>;
  errors: FieldErrors<RegisterInput>;
  isValid: boolean;
  isLoading: boolean;
}

export function Step4Credentials({
  onNext,
  control,
  errors,
  isValid,
  isLoading,
}: Step4CredentialsProps) {
  const { t } = useTranslation();
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  return (
    <KeyboardScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={100}>
      <View className="flex-1 px-6">
        {/* Step Title */}
        <View className="mb-8 pt-20">
          <Text className="text-3xl font-bold text-brown-dark mb-2">
            {t('onboarding.step4.title')}
          </Text>
        </View>

        {/* Form Fields */}
        <View className="flex-1">
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
                error={errors.email ? t(errors.email.message as string) : undefined}
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
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={
                  errors.password ? t(errors.password.message as string, { min: 6 }) : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={confirmPasswordRef}
                label={t('auth.confirmPassword')}
                secureTextEntry
                showPasswordToggle
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={onNext}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={
                  errors.confirmPassword
                    ? t(errors.confirmPassword.message as string, { min: 6 })
                    : undefined
                }
              />
            )}
          />
        </View>

        {/* Navigation Buttons */}
        <View className="pb-8 gap-3">
          <Text className="text-base text-textMuted text-brown-light">
            {t('auth.termsNoticeStart')}
            <Text
              className="text-brown-dark underline"
              onPress={() => Linking.openURL(t('profile.termsOfUseUrl'))}
            >
              {t('auth.termsOfUse')}
            </Text>
            {t('auth.termsNoticeAnd')}
            <Text
              className="text-brown-dark underline"
              onPress={() => Linking.openURL(t('profile.privacyPolicyUrl'))}
            >
              {t('auth.privacyPolicy')}
            </Text>
          </Text>
          <Button
            title={t('onboarding.createAccount')}
            onPress={onNext}
            disabled={!isValid}
            loading={isLoading}
            haptic="heavy"
          />
        </View>
      </View>
    </KeyboardScrollView>
  );
}
