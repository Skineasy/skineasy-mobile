import { User } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface AvatarProps {
  avatar?: string | null;
  picture?: string | null; // Deprecated: use avatar instead
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  size?: number;
  onPress?: () => void;
}

function getInitials(
  firstname?: string | null,
  lastname?: string | null,
  email?: string | null,
): string {
  if (firstname && lastname) {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  }
  if (email && email.length >= 2) {
    return email.slice(0, 2).toUpperCase();
  }
  return '';
}

export function Avatar({
  avatar,
  picture,
  firstname,
  lastname,
  email,
  size = 32,
  onPress,
}: AvatarProps): React.ReactElement {
  const initials = getInitials(firstname, lastname, email);
  const fontSize = Math.floor(size * 0.4);
  const imageUri = avatar ?? picture;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const content = imageUri ? (
    <Image source={{ uri: imageUri }} style={[styles.image, containerStyle]} />
  ) : initials ? (
    <View style={[styles.initialsContainer, containerStyle]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  ) : (
    <View style={[styles.initialsContainer, containerStyle]}>
      <User size={fontSize * 1.2} color={colors.surface} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} haptic="medium">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.surface,
    fontWeight: '500',
  },
});
