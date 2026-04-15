import { format } from 'date-fns';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddIndicatorSheet } from '@features/dashboard/components/AddIndicatorSheet';
import { GlassContainer } from '@shared/components/glass-container';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

export function FloatingAddButton(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);

  const TAB_BAR_HEIGHT = 60;
  const FAB_SIZE = 48;
  const tabBarBottom = Math.max(insets.bottom, 16);
  const fabBottom = tabBarBottom + (TAB_BAR_HEIGHT - FAB_SIZE) / 2;

  return (
    <>
      <View className="absolute right-4" style={{ bottom: fabBottom }}>
        <Pressable haptic="medium" onPress={() => setSheetVisible(true)}>
          <GlassContainer style={styles.fab} glassStyle="regular">
            <Plus color={colors.primary} size={24} strokeWidth={2.5} />
          </GlassContainer>
        </Pressable>
      </View>

      <AddIndicatorSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        date={format(new Date(), 'yyyy-MM-dd')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
