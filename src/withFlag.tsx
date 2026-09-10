import type { ComponentType, JSX } from 'react';
import { useFlag } from './hooks';
import type { WithFlagOptions } from './types';

function renderFallback(fallback: React.ReactNode): JSX.Element | null {
  if (fallback === null || fallback === undefined || fallback === false) {
    return null;
  }

  return <>{fallback}</>;
}

export function withFlag<P extends object>(
  key: string,
  options: WithFlagOptions = {}
): (WrappedComponent: ComponentType<P>) => ComponentType<P> {
  const {
    defaultValue = false,
    invert = false,
    loadingFallback = null,
    disabledFallback = null,
  } = options;

  return function withFlagDecorator(WrappedComponent: ComponentType<P>): ComponentType<P> {
    function FlagWrappedComponent(props: P): JSX.Element | null {
      const { value, isLoading } = useFlag<boolean>(key, Boolean(defaultValue));

      if (isLoading) {
        return renderFallback(loadingFallback);
      }

      const isEnabled = invert ? !value : value;
      if (!isEnabled) {
        return renderFallback(disabledFallback);
      }

      return <WrappedComponent {...props} />;
    }

    FlagWrappedComponent.displayName = `withFlag(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return FlagWrappedComponent;
  };
}
