import { useRouter } from 'expo-router';
import { Dumbbell, Moon, Search, Utensils, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useSportEntries } from '@features/journal/data/sport.queries';
import { BottomSheet } from '@shared/components/bottom-sheet';
import { Button } from '@shared/components/button';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface AddIndicatorSheetProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

const INDICATORS = [
  { key: 'observations', icon: Search, path: '/journal/observations' },
  { key: 'sleep', icon: Moon, path: '/journal/sleep' },
  { key: 'nutrition', icon: Utensils, path: '/journal/nutrition' },
  { key: 'sport', icon: Dumbbell, path: '/journal/sport' },
  { key: 'stress', icon: Zap, path: '/journal/stress' },
] as const;

export function AddIndicatorSheet({
  visible,
  onClose,
  date,
}: AddIndicatorSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: sportEntries = [] } = useSportEntries(date);

  const handlePress = (key: string, path: string): void => {
    onClose();
    if (key === 'sport' && sportEntries.length === 0) {
      router.push({ pathname: '/journal/sport/new', params: { date } });
      return;
    }
    router.push({ pathname: path, params: { date } });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-6">
        <Text className="text-xl font-semibold text-text mb-6 text-center">
          {t('dashboard.addIndicator.title')}
        </Text>
        <View className="flex-row flex-wrap">
          {INDICATORS.map(({ key, icon: Icon, path }) => (
            <View key={key} className="w-1/2 p-2">
              <Pressable
                onPress={() => handlePress(key, path)}
                haptic="light"
                className="aspect-square rounded-2xl bg-surface items-center justify-center gap-2"
              >
                <Icon size={32} color={colors.brownDark} />
                <Text className="text-md font-medium text-text">
                  {t(`dashboard.indicators.${key}`)}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
        <Button
          title={t('common.close')}
          variant="primary"
          onPress={onClose}
          haptic="light"
          className="mt-5"
        />
      </View>
    </BottomSheet>
  );
}
