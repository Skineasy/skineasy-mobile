import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn();

  return {
    getSession: vi.fn(),
    from: vi.fn(() => chain),
    rpc: vi.fn(),
    uploadFile: vi.fn(),
    compressImage: vi.fn(),
    chain,
  };
});

vi.mock('@lib/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

vi.mock('@lib/upload', () => ({ uploadFile: mocks.uploadFile }));
vi.mock('@shared/utils/image', () => ({ compressImage: mocks.compressImage }));

import { profileService } from '@features/profile/services/profile.service';

const USER_ID = 'user-1';
const SESSION = { data: { session: { user: { id: USER_ID } } } };

const CLIENT_ROW = {
  id: 'client-1',
  user_id: USER_ID,
  email: 'test@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  phone: null,
  skin_type: null,
  birthday: null,
  avatar_url: null,
  has_routine_access: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue(SESSION);
  mocks.from.mockReturnValue(mocks.chain);
});

describe('profileService.updateProfile', () => {
  it('updates and returns mapped UserProfile', async () => {
    mocks.chain.single = vi.fn().mockResolvedValue({ data: CLIENT_ROW, error: null });

    const result = await profileService.updateProfile({
      firstname: 'Jane',
      lastname: 'Doe',
    });

    expect(result.first_name).toBe('Jane');
    expect(result.user_id).toBe(USER_ID);
    expect(mocks.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Jane', last_name: 'Doe' }),
    );
  });

  it('throws sessionExpired when no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await expect(profileService.updateProfile({ firstname: 'X', lastname: 'Y' })).rejects.toThrow(
      'common.sessionExpired',
    );
  });

  it('throws mapped error on DB failure', async () => {
    mocks.chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: '42501' } });
    await expect(profileService.updateProfile({ firstname: 'X', lastname: 'Y' })).rejects.toThrow(
      'common.permissionDenied',
    );
  });
});

describe('profileService.uploadAvatar', () => {
  it('compresses, uploads, updates clients, and returns avatar_url', async () => {
    mocks.compressImage.mockResolvedValue('compressed.jpg');
    mocks.uploadFile.mockResolvedValue({
      path: `${USER_ID}/123.jpg`,
      publicUrl: 'https://cdn.example.com/avatar.jpg',
    });
    const chainForUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mocks.from.mockReturnValue(chainForUpdate);

    const result = await profileService.uploadAvatar('original.jpg');

    expect(mocks.compressImage).toHaveBeenCalledWith('original.jpg');
    expect(mocks.uploadFile).toHaveBeenCalledWith(
      'avatars',
      expect.stringContaining(`${USER_ID}/`),
      'compressed.jpg',
      { contentType: 'image/jpeg' },
    );
    expect(result.avatar_url).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('throws sessionExpired when no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await expect(profileService.uploadAvatar('original.jpg')).rejects.toThrow(
      'common.sessionExpired',
    );
  });
});

describe('profileService.deleteAccount', () => {
  it('calls delete_own_account RPC and resolves', async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await expect(profileService.deleteAccount()).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith('delete_own_account');
  });

  it('throws mapped error on RPC failure', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: '42501' } });
    await expect(profileService.deleteAccount()).rejects.toThrow('common.permissionDenied');
  });
});
