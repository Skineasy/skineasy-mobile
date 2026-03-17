import { ActivityIndicator, View } from 'react-native';

import { colors } from '@theme/colors';

export function RoutineLoadingState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
