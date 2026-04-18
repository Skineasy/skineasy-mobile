import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import i18n from 'i18next';

import { toast } from '@lib/toast';

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'common.error';
  toast.error(i18n.t(message));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
