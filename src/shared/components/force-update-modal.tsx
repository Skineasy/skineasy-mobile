import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import assets from '@assets';
import { Button } from '@shared/components/button';

interface ForceUpdateModalProps {
  onUpdate: () => void;
}

/**
 * Full-screen blocking modal shown when app version is below minimum required.
 * No dismiss option - user must update.
 */
export function ForceUpdateModal({ onUpdate }: ForceUpdateModalProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-8">
        <Image source={assets.logo} className="w-40 h-40 mb-8 rounded-2xl" resizeMode="contain" />

        <Text className="text-2xl font-bold text-text text-center mb-4">
          {t('forceUpdate.title')}
        </Text>

        <Text className="text-base text-textMuted text-center mb-12 leading-6">
          {t('forceUpdate.message')}
        </Text>

        <Button title={t('forceUpdate.button')} onPress={onUpdate} />
      </View>
    </SafeAreaView>
  );
}
