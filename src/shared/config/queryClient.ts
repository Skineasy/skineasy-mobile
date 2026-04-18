import {
  MutationCache,
  QueryCache,
  QueryClient,
  type Mutation,
  type MutationFunctionContext,
} from '@tanstack/react-query';
import i18n from 'i18next';

import { toast } from '@lib/toast';

function toastError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'common.error';
  toast.error(i18n.t(message));
}

function handleMutationError(
  error: Error,
  _variables: unknown,
  _onMutateResult: unknown,
  mutation: Mutation<unknown, unknown, unknown>,
  _context: MutationFunctionContext,
): void {
  if (mutation.meta?.suppressGlobalError) return;
  toastError(error);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: toastError }),
  mutationCache: new MutationCache({ onError: handleMutationError }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
