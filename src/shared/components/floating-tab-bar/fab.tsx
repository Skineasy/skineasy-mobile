import { Plus } from 'lucide-react-native';
import { Pressable as RNPressable, StyleSheet } from 'react-native';

import { colors } from '@theme/colors';

import { FAB_DIAMETER, FAB_RADIUS } from './constants';

type FabProps = {
  onPress: () => void;
};

export function Fab({ onPress }: FabProps): React.ReactElement {
  return (
    <RNPressable onPress={onPress} style={styles.base}>
      <Plus color={colors.primary} size={26} strokeWidth={2.5} />
    </RNPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
    borderRadius: FAB_RADIUS,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
