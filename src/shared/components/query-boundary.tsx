import type { UseQueryResult } from '@tanstack/react-query';
import type React from 'react';

import { ErrorState } from '@shared/components/error-state';
import { LoadingState } from '@shared/components/loading-state';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function QueryBoundary<T>({
  query,
  children,
  emptyState,
  loadingState,
  errorState,
  isEmpty,
}: QueryBoundaryProps<T>): React.ReactElement {
  if (query.isPending) {
    return (loadingState as React.ReactElement) ?? <LoadingState />;
  }

  if (query.isError) {
    const messageKey = query.error instanceof Error ? query.error.message : 'common.error';
    return (
      (errorState as React.ReactElement) ?? (
        <ErrorState messageKey={messageKey} onRetry={() => void query.refetch()} />
      )
    );
  }

  if (isEmpty && isEmpty(query.data) && emptyState) {
    return emptyState as React.ReactElement;
  }

  return children(query.data) as React.ReactElement;
}
