import * as Device from 'expo-device';
import { ArrowLeft, Link } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toast } from '@lib/toast';

import assets from '@assets';
import { Background } from '@shared/components/background';
import { Button } from '@shared/components/button';
import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { healthkitService } from '@shared/services/healthkit.service';
import { useHealthKitStore } from '@shared/stores/healthkit.store';
import { colors } from '@theme/colors';

interface Step3HealthSyncProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const BENEFITS = [
  { titleKey: 'onboarding.step3.benefit1Title', descKey: 'onboarding.step3.benefit1Desc' },
  { titleKey: 'onboarding.step3.benefit2Title', descKey: 'onboarding.step3.benefit2Desc' },
  { titleKey: 'onboarding.step3.benefit3Title', descKey: 'onboarding.step3.benefit3Desc' },
] as const;

export function Step3HealthSync({
  onNext,
  onSkip,
  onBack,
}: Step3HealthSyncProps): React.ReactElement {
  const { t } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const setAuthorized = useHealthKitStore((state) => state.setAuthorized);

  const handleConnect = async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      toast.error(t('healthkit.notAvailable'));
      onNext();
      return;
    }

    // Check if running in simulator
    if (!Device.isDevice) {
      toast.error(t('healthkit.simulatorError'));
      onNext();
      return;
    }

    setIsConnecting(true);
    try {
      const authorized = await healthkitService.requestAuthorization();
      await setAuthorized(authorized);
      if (!authorized) {
        toast.error(t('healthkit.permissionDenied'));
      }
    } catch {
      toast.error(t('healthkit.syncError'));
    } finally {
      setIsConnecting(false);
      onNext();
    }
  };

  return (
    <Background variant="brownGradient">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Pressable
            onPress={onBack}
            haptic="light"
            className="w-10 h-10 rounded-full items-center justify-center"
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={20} color={colors.cream} />
          </Pressable>
          <Pressable
            onPress={onSkip}
            haptic="light"
            accessibilityLabel={t('onboarding.step3.skip')}
          >
            <Text className="text-base text-cream">{t('onboarding.step3.skip')}</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-6 justify-between pt-8">
          {/* App Icons */}
          <View>
            <View className="items-start mb-8">
              <View className="justify-center flex-row gap-8 pt-8">
                <Image
                  source={assets.appleHealth}
                  className="w-24 h-24 rounded-2xl"
                  resizeMode="cover"
                />
                <View className="absolute -bottom-4 w-12 h-12 rounded-full bg-primary items-center justify-center z-10">
                  <Link color={colors.surface} size={20} />
                </View>
                <Image
                  source={assets.skineasyLogo}
                  className="w-24 h-24 rounded-2xl -ml-4"
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text className="text-3xl font-bold text-cream mb-3">
              {t('onboarding.step3.title')}
            </Text>
            <Text className="text-base text-cream-muted">{t('onboarding.step3.subtitle')}</Text>
          </View>

          {/* Benefits */}
          <View className="gap-4">
            {BENEFITS.map(({ titleKey, descKey }) => (
              <GlassContainer key={titleKey} style={{ padding: 16 }}>
                <Text className="text-base font-semibold text-white mb-1">{t(titleKey)}</Text>
                <Text className="text-sm text-white">{t(descKey)}</Text>
              </GlassContainer>
            ))}
          </View>

          {/* Action Button */}
          <View className="pb-8 pt-6">
            <Button
              title={t('onboarding.step3.connect')}
              variant="secondary"
              onPress={handleConnect}
              haptic="heavy"
              loading={isConnecting}
              disabled={isConnecting}
            />
          </View>
        </View>
      </SafeAreaView>
    </Background>
  );
}
