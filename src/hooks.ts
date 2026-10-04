import { useEffect, useMemo, useState } from 'react';
import type { Flag, FlagManager, FlagValue } from '@zenmanage/sdk';
import { useFlagsContext } from './context';
import type { UseFlagResult, UseVariantResult, WidenFlagValue } from './types';

interface Resolution<T> {
  key: string;
  manager: FlagManager;
  flag: Flag | null;
  value: T;
  error: Error | null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function coerceValue<T extends FlagValue>(flag: Flag, defaultValue: T): WidenFlagValue<T> {
  if (typeof defaultValue === 'boolean') {
    return flag.asBool() as WidenFlagValue<T>;
  }

  if (typeof defaultValue === 'number') {
    return flag.asNumber() as WidenFlagValue<T>;
  }

  if (typeof defaultValue === 'string') {
    return flag.asString() as WidenFlagValue<T>;
  }

  return flag.asJson() as WidenFlagValue<T>;
}

/**
 * Object and array defaults are usually written inline (`useFlag('ui', { theme: 'light' })`),
 * which is a new object every render. Comparing by content keeps the evaluation effect from
 * re-running, and re-rendering, forever.
 */
function useStableDefault<T extends FlagValue>(defaultValue: T): T {
  const signature = JSON.stringify(defaultValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => defaultValue, [signature]);
}

export function useFlag<T extends FlagValue>(
  key: string,
  defaultValue: T
): UseFlagResult<WidenFlagValue<T>> {
  const {
    manager,
    isLoading: providerLoading,
    error: providerError,
    revision,
    refresh,
  } = useFlagsContext();
  const stableDefault = useStableDefault(defaultValue);
  const [resolution, setResolution] = useState<Resolution<WidenFlagValue<T>> | null>(null);

  useEffect(() => {
    // Wait for the provider's preload so every hook reads from the warm cache instead of each
    // triggering its own rules fetch. If the preload failed, `providerLoading` is false and
    // the hook settles on its default with the provider's error surfaced.
    if (providerLoading) {
      return undefined;
    }

    let isCurrent = true;

    manager.single(key, stableDefault).then(
      (flag) => {
        if (isCurrent) {
          setResolution({
            key,
            manager,
            flag,
            value: coerceValue(flag, stableDefault),
            error: null,
          });
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setResolution({
            key,
            manager,
            flag: null,
            value: stableDefault as WidenFlagValue<T>,
            error: toError(error),
          });
        }
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [manager, key, stableDefault, revision, providerLoading]);

  // A result only counts for the key and manager that produced it. After either changes, the
  // previous result is ignored (never shown for the wrong key or context) until the new one
  // lands. A `revision` bump keeps the last value on screen while re-evaluating.
  const current =
    resolution !== null && resolution.key === key && resolution.manager === manager
      ? resolution
      : null;

  return {
    key,
    value: current ? current.value : (stableDefault as WidenFlagValue<T>),
    flag: current ? current.flag : null,
    isLoading: providerLoading || current === null,
    error: providerError ?? current?.error ?? null,
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
