import type { UpdateProfileDto } from '@features/profile/schemas/profile.schema';
import { api } from '@shared/services/api';
import type { UserProfile } from '@shared/types/user.types';
import { compressImage, imageUriToFormData } from '@shared/utils/image';

export interface UpdateProfileResponse {
  data: UserProfile;
}

export interface UploadAvatarResponse {
  data: { avatar: string };
}

export const profileService = {
  updateProfile: (data: UpdateProfileDto): Promise<UpdateProfileResponse> => {
    return api.put<UpdateProfileResponse>('/api/v1/auth/me', data);
  },

  uploadAvatar: async (uri: string): Promise<UploadAvatarResponse> => {
    const compressedUri = await compressImage(uri);
    const formData = imageUriToFormData(compressedUri, 'avatar');
    const response = await api.postFormData<UploadAvatarResponse>(
      '/api/v1/auth/me/avatar',
      formData,
    );
    return response;
  },

  deleteAccount: (): Promise<void> => {
    return api.delete('/api/v1/auth/me');
  },
};
