import { useCallback, useEffect, useState } from 'react';
import type { Flag, FlagValue } from '@zenmanage/sdk';
import { useFlagsContext } from './context';
import type { PrimitiveFlagValue, UseFlagResult, UseVariantResult } from './types';

function coerceValue<T extends PrimitiveFlagValue>(flag: Flag, defaultValue: T): T {
  if (typeof defaultValue === 'boolean') {
    return flag.asBool() as T;
  }

  if (typeof defaultValue === 'number') {
    return flag.asNumber() as T;
  }

  return flag.asString() as T;
}

export function useFlag<T extends PrimitiveFlagValue>(
  key: string,
  defaultValue: T
): UseFlagResult<T> {
  const { manager, isReady, isLoading: providerLoading, error: providerError } = useFlagsContext();
  const [value, setValue] = useState<T>(defaultValue);
  const [flag, setFlag] = useState<Flag | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const resolvedFlag = await manager.single(key, defaultValue as FlagValue);
      setFlag(resolvedFlag);
      setValue(coerceValue(resolvedFlag, defaultValue));
      setIsLoading(false);
    } catch (loadError) {
      setFlag(null);
      setValue(defaultValue);
      setError(loadError as Error);
      setIsLoading(false);
    }
  }, [manager, key, defaultValue]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async (): Promise<void> => {
    await load();
  }, [load]);

  const resolvedError = providerError ?? error;
  const resolvedLoading = providerLoading || !isReady || isLoading;

  return {
    key,
    value,
    flag,
    isLoading: resolvedLoading,
    error: resolvedError,
    refresh,
  };
}

export function useVariant(key: string, defaultVariant = 'control'): UseVariantResult {
  const result = useFlag<string>(key, defaultVariant);

  return {
    key,
    variant: result.value,
    flag: result.flag,
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refresh,
  };
}

export function useBooleanFlag(key: string, defaultValue = false): UseFlagResult<boolean> {
  const result = useFlag<boolean>(key, defaultValue);

  return {
    ...result,
    value: result.flag ? result.flag.asBool() : defaultValue,
  };
}
