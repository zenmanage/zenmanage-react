import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigBuilder, Zenmanage } from '@zenmanage/sdk';
import { FlagsContext } from './context';
import type { FlagsProviderProps } from './types';

export function FlagsProvider({
  client,
  environmentToken,
  apiEndpoint,
  cacheTtl,
  enableUsageReporting,
  context,
  defaults,
  preload = true,
  onError,
  children,
}: FlagsProviderProps): JSX.Element {
  const [state, setState] = useState<{
    isLoading: boolean;
    isReady: boolean;
    error: Error | null;
  }>({
    isLoading: false,
    isReady: false,
    error: null,
  });

  const resolvedClient = useMemo(() => {
    if (client) {
      return client;
    }

    if (!environmentToken) {
      throw new Error('FlagsProvider requires either a client or an environmentToken.');
    }

    const builder = ConfigBuilder.create().withEnvironmentToken(environmentToken);

    if (apiEndpoint) {
      builder.withApiEndpoint(apiEndpoint);
    }

    if (typeof cacheTtl === 'number') {
      builder.withCacheTtl(cacheTtl);
    }

    if (typeof enableUsageReporting === 'boolean') {
      builder.withUsageReporting(enableUsageReporting);
    }

    return new Zenmanage(builder.build());
  }, [client, environmentToken, apiEndpoint, cacheTtl, enableUsageReporting]);

  const manager = useMemo(() => {
    let result = resolvedClient.flags();

    if (context) {
      result = result.withContext(context);
    }

    if (defaults) {
      result = result.withDefaults(defaults);
    }

    return result;
  }, [resolvedClient, context, defaults]);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      await manager.refreshRules();
      setState({ isLoading: false, isReady: true, error: null });
    } catch (error) {
      const resolvedError = error as Error;
      onError?.(resolvedError);
      setState({ isLoading: false, isReady: false, error: resolvedError });
      throw resolvedError;
    }
  }, [manager, onError]);

  useEffect(() => {
    let isDisposed = false;

    async function prime(): Promise<void> {
      if (!preload) {
        setState({ isLoading: false, isReady: true, error: null });
        return;
      }

      setState({ isLoading: true, isReady: false, error: null });

      try {
        await manager.all();
        if (!isDisposed) {
          setState({ isLoading: false, isReady: true, error: null });
        }
      } catch (error) {
        const resolvedError = error as Error;
        onError?.(resolvedError);
        if (!isDisposed) {
          setState({ isLoading: false, isReady: false, error: resolvedError });
        }
      }
    }

    void prime();

    return () => {
      isDisposed = true;
    };
  }, [manager, onError, preload]);

  const value = useMemo(
    () => ({
      client: resolvedClient,
      manager,
      context,
      defaults,
      isReady: state.isReady,
      isLoading: state.isLoading,
      error: state.error,
      refresh,
    }),
    [resolvedClient, manager, context, defaults, state, refresh]
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}
