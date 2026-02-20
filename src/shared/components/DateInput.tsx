import DateTimePicker from '@react-native-community/datetimepicker'
import { format, isValid, parse, subYears, type Locale } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform, Text, View } from 'react-native'

import { BottomSheet } from '@shared/components/BottomSheet'
import { Button } from '@shared/components/Button'
import { GlassContainer } from '@shared/components/GlassContainer'
import { Pressable } from '@shared/components/Pressable'
import { haptic } from '@shared/utils/haptic'
import { colors } from '@theme/colors'

interface DateInputProps {
  label?: string
  error?: string
  value?: string
  onChangeText?: (value: string) => void
  maximumDate?: Date
  initialDate?: Date
  disabled?: boolean
}

function parseValue(value: string | undefined): Date | null {
  if (!value) return null
  const dateOnly = value.includes('T') ? value.split('T')[0] : value
  const parsed = parse(dateOnly, 'yyyy-MM-dd', new Date())
  return isValid(parsed) ? parsed : null
}

function formatDisplay(date: Date, locale: Locale): string {
  return format(date, 'dd MMM yyyy', { locale })
}

export function DateInput({
  label,
  error,
  value,
  onChangeText,
  maximumDate = new Date(),
  initialDate = subYears(new Date(), 25),
  disabled = false,
}: DateInputProps): React.ReactElement {
  const { t, i18n } = useTranslation()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(parseValue(value) ?? initialDate ?? new Date())

  const locale = i18n.language === 'fr' ? fr : enUS
  const parsedValue = parseValue(value)

  const handleOpen = (): void => {
    if (disabled) return
    Keyboard.dismiss()
    haptic.light()
    setTempDate(parsedValue ?? initialDate)
    setSheetVisible(true)
  }

  const handleChange = (_event: unknown, selectedDate?: Date): void => {
    if (selectedDate) {
      setTempDate(selectedDate)
    }
    if (Platform.OS === 'android') {
      if (selectedDate) {
        onChangeText?.(format(selectedDate, 'yyyy-MM-dd'))
      }
      setSheetVisible(false)
    }
  }

  const handleConfirm = (): void => {
    onChangeText?.(format(tempDate, 'yyyy-MM-dd'))
    setSheetVisible(false)
  }

  return (
    <View className="w-full mb-6">
      {label && <Text className="text-xs font-medium text-textMuted mb-1.5 ml-1">{label}</Text>}

      <Pressable onPress={handleOpen} haptic="light" disabled={disabled}>
        <GlassContainer
          style={{
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: disabled ? 0.5 : 1,
            borderColor: error ? colors.error : undefined,
          }}
        >
          <Text className={parsedValue ? 'text-base text-text' : 'text-base text-textMuted'}>
            {parsedValue ? formatDisplay(parsedValue, locale) : t('profile.selectDate')}
          </Text>
          <Calendar size={20} color={colors.textMuted} />
        </GlassContainer>
      </Pressable>

      {error && <Text className="text-xs text-error mt-1 ml-4">{error}</Text>}

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <View>
          {label && (
            <Text className="text-lg font-semibold text-text text-center mb-4">{label}</Text>
          )}
          <View className="items-center">
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              onChange={handleChange}
              maximumDate={maximumDate}
              locale={i18n.language}
              textColor={colors.text}
            />
          </View>
          <View className="px-4 mt-4">
            <Button title={t('common.confirm')} onPress={handleConfirm} />
          </View>
        </View>
      </BottomSheet>
    </View>
  )
}
