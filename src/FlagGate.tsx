import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { useFlag } from './hooks';

export interface FlagGateProps extends PropsWithChildren {
  flagKey: string;
  defaultValue?: boolean;
  invert?: boolean;
  loadingFallback?: ReactNode;
  disabledFallback?: ReactNode;
}

export function FlagGate({
  flagKey,
  defaultValue = false,
  invert = false,
  loadingFallback = null,
  disabledFallback = null,
  children,
}: FlagGateProps): ReactElement | null {
  const { value, isLoading } = useFlag<boolean>(flagKey, defaultValue);

  if (isLoading) {
    return loadingFallback ? <>{loadingFallback}</> : null;
  }

  const enabled = invert ? !value : value;
  if (!enabled) {
    return disabledFallback ? <>{disabledFallback}</> : null;
  }

  return <>{children}</>;
}
