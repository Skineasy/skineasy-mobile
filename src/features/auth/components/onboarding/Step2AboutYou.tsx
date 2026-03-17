import { User, UserRound, Users } from 'lucide-react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { RegisterInput } from '@features/auth/schemas/auth.schema';
import { Button } from '@shared/components/button';
import { DateInput } from '@shared/components/date-input';
import { KeyboardScrollView } from '@shared/components/keyboard-scroll-view';
import { SelectableCard } from '@shared/components/selectable-card';

const GENDER_OPTIONS = [
  { value: 1, labelKey: 'auth.genderMr', icon: User },
  { value: 2, labelKey: 'auth.genderMrs', icon: UserRound },
  { value: 3, labelKey: 'auth.genderOther', icon: Users },
] as const;

interface Step2AboutYouProps {
  onNext: () => void;
  control: Control<RegisterInput>;
  errors: FieldErrors<RegisterInput>;
  isValid: boolean;
}

export function Step2AboutYou({ onNext, control, errors, isValid }: Step2AboutYouProps) {
  const { t } = useTranslation();

  return (
    <KeyboardScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={100}>
      <View className="flex-1 px-6">
        {/* Step Title */}
        <View className="mb-8 pt-20">
          <Text className="text-3xl font-bold text-brown-dark mb-2">
            {t('onboarding.step2.title')}
          </Text>
        </View>

        {/* Form Fields */}
        <View className="flex-1">
          {/* Birthday Input */}
          <Controller
            control={control}
            name="birthday"
            render={({ field: { onChange, value } }) => (
              <DateInput label={t('profile.birthday')} value={value} onChangeText={onChange} />
            )}
          />

          {/* Gender Selector */}
          <Controller
            control={control}
            name="id_gender"
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <Text className="text-sm font-medium text-textMuted mb-3">{t('auth.gender')}</Text>
                <View className="gap-3">
                  {GENDER_OPTIONS.map(({ value: optionValue, labelKey, icon }) => (
                    <SelectableCard
                      key={optionValue}
                      selected={value === optionValue}
                      onPress={() => onChange(optionValue)}
                      label={t(labelKey)}
                      icon={icon}
                    />
                  ))}
                </View>
                {errors.id_gender && (
                  <Text className="text-xs text-error mt-1 ml-1">{t('auth.genderRequired')}</Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Navigation Buttons */}
        <View className="pb-8 gap-3">
          <Button
            title={t('onboarding.next')}
            onPress={onNext}
            disabled={!isValid}
            haptic="medium"
          />
        </View>
      </View>
    </KeyboardScrollView>
  );
}
