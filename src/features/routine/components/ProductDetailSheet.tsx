import { ExternalLink } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import RenderHtml, { type MixedStyleDeclaration } from 'react-native-render-html';

import type { ProductDto } from '@features/routine/types/routine.types';
import { BottomSheet } from '@shared/components/bottom-sheet';
import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

const HTML_BASE_STYLE: MixedStyleDeclaration = {
  color: colors.text,
  fontSize: 14,
  lineHeight: 20,
};

interface ProductDetailSheetProps {
  product: ProductDto | null;
  visible: boolean;
  onClose: () => void;
}

export function ProductDetailSheet({ product, visible, onClose }: ProductDetailSheetProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const handleBuyPress = useCallback(async () => {
    if (!product?.url) return;
    haptic.heavy();
    await Linking.openURL(product.url);
  }, [product]);

  if (!product) return null;

  const { typeContent } = product;
  const hasHowToUse = typeContent?.howToUse && typeContent.howToUse.length > 0;
  const hasKeyIngredient = typeContent?.keyIngredient && typeContent.keyIngredient.length > 0;
  const hasIrritation =
    typeContent?.irritationPotential && typeContent.irritationPotential.length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable backgroundColor={colors.surface}>
      <ScrollView className="pt-8 px-4" showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {/* Header: Image + Title */}
        <View className="flex-row items-center mb-4">
          {product.illustrationUrl && (
            <Image
              source={{ uri: product.illustrationUrl }}
              className="p-2 w-32 h-32 rounded-xl mr-4 bg-cream"
              resizeMode="cover"
            />
          )}
          <View className="flex-1 justify-center">
            {typeContent?.badge && (
              <View className="self-start bg-primary/10 px-2 py-1 rounded-full mb-1">
                <Text className="text-xs font-semibold text-primary">{typeContent.badge}</Text>
              </View>
            )}
            <Text className="text-lg font-bold text-text" numberOfLines={2}>
              {typeContent?.title || product.name}
            </Text>
            {typeContent?.subtitle && (
              <Text className="text-sm text-textMuted mt-1">{typeContent.subtitle}</Text>
            )}
            {product.brand && <Text className="text-xs text-textLight mt-1">{product.brand}</Text>}
          </View>
        </View>

        {/* Application & Frequency */}
        {(typeContent?.application || typeContent?.frequency) && (
          <View className="flex-row mb-4">
            {typeContent?.application && (
              <Card padding="sm" className="flex-1 mr-2">
                <Text className="text-xs text-secondary mb-1">
                  {t('routine.productDetail.application')}
                </Text>
                <Text className="text-sm font-medium text-text">{typeContent.application}</Text>
              </Card>
            )}
            {typeContent?.frequency && (
              <Card padding="sm" className="flex-1 ml-2">
                <Text className="text-xs text-secondary mb-1">
                  {t('routine.productDetail.frequency')}
                </Text>
                <Text className="text-sm font-medium text-text">{typeContent.frequency}</Text>
              </Card>
            )}
          </View>
        )}
        {/* How to Use */}
        {hasHowToUse && (
          <View className="mb-4">
            <Card padding="sm">
              <Text className="text-xs text-secondary mb-1">
                {t('routine.productDetail.howToUse')}
              </Text>
              <RenderHtml
                contentWidth={width - 56}
                source={{ html: typeContent.howToUse }}
                baseStyle={HTML_BASE_STYLE}
              />
            </Card>
          </View>
        )}

        {/* Key Ingredient & Irritation */}
        {(hasKeyIngredient || hasIrritation) && (
          <View className="flex-row mb-4">
            {hasKeyIngredient && (
              <View className="flex-1 mr-2">
                <Text className="text-xs text-textMuted mb-1">
                  {t('routine.productDetail.keyIngredient')}
                </Text>
                <Text className="text-sm text-text">{typeContent.keyIngredient}</Text>
              </View>
            )}
            {hasIrritation && (
              <View className="flex-1 ml-2">
                <Text className="text-xs text-textMuted mb-1">
                  {t('routine.productDetail.irritation')}
                </Text>
                <Text className="text-sm text-text">{typeContent.irritationPotential}</Text>
              </View>
            )}
          </View>
        )}

        {/* Buy Button */}
        {product.url && (
          <Pressable
            onPress={handleBuyPress}
            className="bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center"
          >
            <ExternalLink size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">{t('routine.productDetail.buy')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
