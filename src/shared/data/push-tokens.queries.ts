import { useMutation } from '@tanstack/react-query';

import { registerToken, unregisterCurrentToken } from '@shared/data/push-tokens.api';

type Platform = 'ios' | 'android';

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: ({ token, platform }: { token: string; platform: Platform }) =>
      registerToken(token, platform),
    meta: { suppressGlobalError: true },
  });
}

export function useUnregisterCurrentToken() {
  return useMutation({
    mutationFn: unregisterCurrentToken,
    meta: { suppressGlobalError: true },
  });
}
