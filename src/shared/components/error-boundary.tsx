import * as Sentry from '@sentry/react-native';
import { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@shared/components/button';
import { logger } from '@shared/utils/logger';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

type FallbackProps = {
  onRetry: () => void;
};

function ErrorFallback({ onRetry }: FallbackProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-6 bg-background">
      <Text className="text-xl font-bold text-text mb-2">{t('common.error')}</Text>
      <Text className="text-base text-textMuted text-center mb-6">
        {t('common.errorBoundaryDescription')}
      </Text>
      <Button title={t('common.retry')} onPress={onRetry} haptic="medium" />
    </View>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('[ErrorBoundary] Caught error:', error, errorInfo);
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
