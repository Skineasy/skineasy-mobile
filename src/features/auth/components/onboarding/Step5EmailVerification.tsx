import { useRouter } from 'expo-router';
import { MailWarning } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { GlassContainer } from '@shared/components/glass-container';
import { colors } from '@theme/colors';

interface Step5EmailVerificationProps {
  email: string;
}

export function Step5EmailVerification({ email }: Step5EmailVerificationProps): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasLeftApp, setHasLeftApp] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        setHasLeftApp(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleOpenEmail = (): void => {
    Linking.openURL('mailto:');
  };

  const handleValidated = (): void => {
    router.replace('/(auth)/login');
  };

  return (
    <Background variant="brownGradient">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 justify-center items-center">
          {/* Icon Container */}
          <GlassContainer style={{ padding: 16, marginBottom: 16 }}>
            <MailWarning size={46} color={colors.surface} />
          </GlassContainer>

          {/* Title & Subtitle */}
          <Text className="text-4xl font-bold text-cream text-center mb-2">
            {t('onboarding.step5.title')}
          </Text>
          <Text className="text-base font-medium text-cream text-center">
            {t('onboarding.step5.subtitle', { email })}
          </Text>
        </View>

        {/* Buttons */}
        <View className="px-6 pb-8 gap-3">
          <Button
            title={t('onboarding.step5.openEmail')}
            variant="secondary"
            onPress={handleOpenEmail}
            haptic="medium"
          />
          {hasLeftApp && (
            <Button
              title={t('onboarding.step5.validated')}
              variant="primary"
              onPress={handleValidated}
              haptic="heavy"
            />
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}
