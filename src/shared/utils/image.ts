/**
 * Image Utility Functions
 *
 * Handles image picking, compression, and upload for journal meal entries
 * Requirements:
 * - Max size: 10MB
 * - Formats: JPEG, PNG, WebP
 * - Compression: Frontend compresses before upload
 * - No server-side compression
 */

import { logger } from '@shared/utils/logger';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

type PermissionDeniedHandler = () => void;

/**
 * Image compression settings
 */
const IMAGE_COMPRESSION = {
  MAX_WIDTH: 1200, // Resize to max width of 1200px
  MAX_HEIGHT: 1200, // Resize to max height of 1200px
  QUALITY: 0.8, // 80% quality
  FORMAT: ImageManipulator.SaveFormat.JPEG, // Always convert to JPEG for consistency
};

/**
 * Pick an image from the device's gallery
 *
 * @param onPermissionDenied - Optional callback when permission is denied
 * @returns Promise<string | null> - URI of the selected image, or null if canceled
 */
export async function pickImageFromGallery(
  onPermissionDenied?: PermissionDeniedHandler,
): Promise<string | null> {
  try {
    logger.info('[Image] Requesting gallery permissions');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      logger.warn('[Image] Gallery permission denied');
      onPermissionDenied?.();
      return null;
    }

    logger.info('[Image] Launching image picker');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
      logger.info('[Image] Image picker canceled');
      return null;
    }

    const imageUri = result.assets[0].uri;
    logger.info('[Image] Image selected:', imageUri);

    return imageUri;
  } catch (error) {
    logger.error('[Image] Error picking image from gallery:', error);
    return null;
  }
}

/**
 * Take a photo using the device's camera
 *
 * @param onPermissionDenied - Optional callback when permission is denied
 * @returns Promise<string | null> - URI of the captured photo, or null if canceled
 */
export async function takePhoto(
  onPermissionDenied?: PermissionDeniedHandler,
): Promise<string | null> {
  try {
    logger.info('[Image] Requesting camera permissions');

    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      logger.warn('[Image] Camera permission denied');
      onPermissionDenied?.();
      return null;
    }

    logger.info('[Image] Launching camera');

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // Get full quality, we'll compress manually
    });

    if (result.canceled) {
      logger.info('[Image] Camera canceled');
      return null;
    }

    const imageUri = result.assets[0].uri;
    logger.info('[Image] Photo captured:', imageUri);

    return imageUri;
  } catch (error) {
    logger.error('[Image] Error taking photo:', error);
    return null;
  }
}

/**
 * Compress an image to meet upload requirements
 *
 * @param uri - Local URI of the image to compress
 * @returns Promise<string> - URI of the compressed image
 *
 * @throws Error if compression fails
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    logger.info('[Image] Compressing image:', uri);

    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: IMAGE_COMPRESSION.MAX_WIDTH,
            height: IMAGE_COMPRESSION.MAX_HEIGHT,
          },
        },
      ],
      {
        compress: IMAGE_COMPRESSION.QUALITY,
        format: IMAGE_COMPRESSION.FORMAT,
      },
    );

    logger.info('[Image] Image compressed successfully:', manipulatedImage.uri);

    return manipulatedImage.uri;
  } catch (error) {
    logger.error('[Image] Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Convert image URI to FormData for upload
 *
 * @param uri - Local URI of the image
 * @param fieldName - Field name for FormData (default: 'image')
 * @returns FormData object ready for upload
 */
export function imageUriToFormData(uri: string, fieldName: string = 'image'): FormData {
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  // React Native FormData accepts blob-like objects
  formData.append(fieldName, {
    uri,
    name: filename,
    type,
  } as unknown as Blob);

  return formData;
}
