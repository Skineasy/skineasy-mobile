import { useQuery } from '@tanstack/react-query';

import { getAppConfig } from '@shared/data/app-config.api';

const appConfigKeys = {
  all: ['appConfig'] as const,
};

export function useAppConfig() {
  return useQuery({
    queryKey: appConfigKeys.all,
    queryFn: getAppConfig,
    staleTime: 10 * 60 * 1000,
  });
}
