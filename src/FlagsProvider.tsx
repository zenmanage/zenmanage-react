import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ConfigBuilder, Zenmanage } from '@zenmanage/sdk';
import type { Context, DefaultsCollection } from '@zenmanage/sdk';
import { version as PACKAGE_VERSION } from '../package.json';
import { FlagsContext } from './context';
import type { FlagsProviderProps } from './types';

/** The client agent the API registers this package under (see the api's EnsureClientAgentIsValid). */
const CLIENT_AGENT = 'zenmanage-react';

interface ProviderState {
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  revision: number;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function describeContext(context: Context | undefined): string {
  return context === undefined ? '' : JSON.stringify(context);
}

function describeDefaults(defaults: DefaultsCollection | undefined): string {
  if (defaults === undefined) {
    return '';
  }

  return JSON.stringify(
    defaults
      .keys()
      .sort()
      .map((key) => [key, defaults.get(key)])
  );
}

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
}: FlagsProviderProps): ReactElement {
  const [state, setState] = useState<ProviderState>(() => ({
    isLoading: preload,
    isReady: !preload,
    error: null,
    revision: 0,
  }));

  // Callers routinely pass `onError` inline, which is a new function every render. Reading it
  // through a ref keeps it out of the dependencies below so it can't restart the preload.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const resolvedClient = useMemo(() => {
    if (client) {
      return client;
    }

    if (!environmentToken) {
      throw new Error('FlagsProvider requires either a client or an environmentToken.');
    }

    const builder = ConfigBuilder.create()
      .withEnvironmentToken(environmentToken)
      .withClientAgent(CLIENT_AGENT)
      .withSdkVersion(PACKAGE_VERSION);

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

  // `context` and `defaults` are often built inline (`context={Context.single('user', id)}`),
  // so compare them by content: a new-but-equal object must not replace the flag manager,
  // which would put every mounted hook back into its loading state on each parent render.
  const contextSignature = describeContext(context);
  const defaultsSignature = describeDefaults(defaults);
  /* eslint-disable react-hooks/exhaustive-deps */
  const stableContext = useMemo(() => context, [contextSignature]);
  const stableDefaults = useMemo(() => defaults, [defaultsSignature]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const manager = useMemo(() => {
    let result = resolvedClient.flags();

    if (stableContext) {
      result = result.withContext(stableContext);
    }

    if (stableDefaults) {
      result = result.withDefaults(stableDefaults);
    }

    return result;
  }, [resolvedClient, stableContext, stableDefaults]);

  // A background refresh deliberately doesn't set `isLoading`: hooks keep serving their last
  // value while rules re-fetch, so gated UI doesn't unmount and remount on every refresh.
  const refresh = useCallback(async () => {
    try {
      await manager.refreshRules();
      setState((current) => ({
        ...current,
        isReady: true,
        error: null,
        revision: current.revision + 1,
      }));
    } catch (error) {
      const resolvedError = toError(error);
      onErrorRef.current?.(resolvedError);
      setState((current) => ({ ...current, error: resolvedError }));
      throw resolvedError;
    }
  }, [manager]);

  useEffect(() => {
    let isDisposed = false;

    async function prime(): Promise<void> {
      if (!preload) {
        setState((current) =>
          current.isReady && !current.isLoading && current.error === null
            ? current
            : { ...current, isLoading: false, isReady: true, error: null }
        );
        return;
      }

      setState((current) =>
        current.isLoading && !current.isReady && current.error === null
          ? current
          : { ...current, isLoading: true, isReady: false, error: null }
      );

      try {
        await manager.all();
        if (!isDisposed) {
          setState((current) => ({ ...current, isLoading: false, isReady: true, error: null }));
        }
      } catch (error) {
        if (!isDisposed) {
          const resolvedError = toError(error);
          onErrorRef.current?.(resolvedError);
          setState((current) => ({
            ...current,
            isLoading: false,
            isReady: false,
            error: resolvedError,
          }));
        }
      }
    }

    void prime();

    return () => {
      isDisposed = true;
    };
  }, [manager, preload]);

  const value = useMemo(
    () => ({
      client: resolvedClient,
      manager,
      context: stableContext,
      defaults: stableDefaults,
      isReady: state.isReady,
      isLoading: state.isLoading,
      error: state.error,
      revision: state.revision,
      refresh,
    }),
    [resolvedClient, manager, stableContext, stableDefaults, state, refresh]
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}
