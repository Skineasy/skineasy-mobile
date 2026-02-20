import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Camera } from 'lucide-react-native'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert, Text, View } from 'react-native'

import { useUpdateProfile, useUploadAvatar } from '@features/profile/hooks/useUpdateProfile'
import { editProfileSchema, type EditProfileInput } from '@features/profile/schemas/profile.schema'
import { Avatar } from '@shared/components/Avatar'
import { Button } from '@shared/components/Button'
import { DateInput } from '@shared/components/DateInput'
import { Input } from '@shared/components/Input'
import { Pressable } from '@shared/components/Pressable'
import { ScreenHeader } from '@shared/components/ScreenHeader'
import { useUserStore } from '@shared/stores/user.store'
import { pickImageFromGallery, takePhoto } from '@shared/utils/image'
import { logger } from '@shared/utils/logger'
import { colors } from '@theme/colors'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile()
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar()

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null)
  const [avatarWasModified, setAvatarWasModified] = useState(false)

  const avatarUri = avatarWasModified ? localAvatarUri : (user?.avatar ?? null)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstname: user?.firstname || '',
      lastname: user?.lastname || '',
      email: user?.email || '',
      birthday: user?.birthday || undefined,
    },
  })

  const handleChangeAvatar = (): void => {
    Alert.alert(t('profile.changePhoto'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.takePhoto'),
        onPress: async () => {
          const uri = await takePhoto(() => {
            Alert.alert(t('common.error'), t('profile.cameraPermissionRequired'))
          })
          if (uri) {
            setLocalAvatarUri(uri)
            setAvatarWasModified(true)
          }
        },
      },
      {
        text: t('profile.chooseFromGallery'),
        onPress: async () => {
          const uri = await pickImageFromGallery(() => {
            Alert.alert(t('common.error'), t('profile.galleryPermissionRequired'))
          })
          if (uri) {
            setLocalAvatarUri(uri)
            setAvatarWasModified(true)
          }
        },
      },
    ])
  }

  const handleFormSubmit = async (data: EditProfileInput) => {
    if (avatarWasModified && localAvatarUri) {
      await uploadAvatar(localAvatarUri)
    }
    await updateProfile(data)
    router.back()
  }

  const isLoading = isUpdating || isUploadingAvatar

  return (
    <ScreenHeader title={t('profile.editProfile')}>
      {/* Avatar Section */}
      <View className="items-center mb-6">
        <Avatar
          avatar={avatarUri}
          firstname={user?.firstname}
          lastname={user?.lastname}
          email={user?.email}
          size={100}
        />
        <Pressable
          onPress={handleChangeAvatar}
          haptic="medium"
          disabled={isLoading}
          className="flex-row items-center gap-2 mt-3 px-4 py-2 bg-surface rounded-full border border-border"
        >
          <Camera size={16} color={colors.primary} />
          <Text className="text-sm text-primary font-medium">{t('profile.changePhoto')}</Text>
        </Pressable>
      </View>

      <View className="opacity-50">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="firstname"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.firstname')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.firstname?.message}
            autoCapitalize="words"
            editable={!isLoading}
          />
        )}
      />

      <Controller
        control={control}
        name="lastname"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.lastname')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.lastname?.message}
            autoCapitalize="words"
            editable={!isLoading}
          />
        )}
      />

      <Controller
        control={control}
        name="birthday"
        render={({ field: { onChange, value } }) => (
          <DateInput
            label={t('profile.birthday')}
            value={value}
            onChangeText={onChange}
            error={errors.birthday?.message}
            disabled={isLoading}
          />
        )}
      />

      <View className="mt-6">
        <Button
          title={t('common.save')}
          onPress={handleSubmit(handleFormSubmit, (formErrors) => {
            logger.error('[EditProfile] Form validation errors:', formErrors)
          })}
          loading={isLoading}
          disabled={(!isDirty && !avatarWasModified) || isLoading}
        />
      </View>
    </ScreenHeader>
  )
}
