import type { PropsWithChildren, ReactNode } from 'react';
import type {
  Context,
  DefaultsCollection,
  Flag,
  FlagManager,
  FlagValue,
  Zenmanage,
} from '@zenmanage/sdk';

export type PrimitiveFlagValue = boolean | string | number;

/**
 * Widens a literal default (`false`, `'control'`, `1500`) to its primitive type, so
 * `useFlag('k', false).value` is `boolean` rather than the literal `false`. Object and
 * array defaults (JSON flags) pass through unchanged.
 */
export type WidenFlagValue<T extends FlagValue> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T;

export interface FlagsProviderProps extends PropsWithChildren {
  /** An existing client. When set, `environmentToken` and the other client options are ignored. */
  client?: Zenmanage;
  environmentToken?: string;
  apiEndpoint?: string;
  cacheTtl?: number;
  enableUsageReporting?: boolean;
  context?: Context;
  defaults?: DefaultsCollection;
  preload?: boolean;
  onError?: (error: Error) => void;
}

export interface FlagsContextValue {
  client: Zenmanage;
  manager: FlagManager;
  context?: Context;
  defaults?: DefaultsCollection;
  /** `true` once the initial preload has succeeded (or immediately when `preload` is off). */
  isReady: boolean;
  /** `true` only while the initial preload is in flight; background refreshes don't set it. */
  isLoading: boolean;
  error: Error | null;
  /** Bumps after every successful `refresh()` so mounted hooks re-evaluate. */
  revision: number;
  /** Re-fetches rules from the API and re-evaluates every mounted hook. */
  refresh: () => Promise<void>;
}

export interface UseFlagResult<T extends FlagValue> {
  key: string;
  value: T;
  flag: Flag | null;
  isLoading: boolean;
  error: Error | null;
  /** Re-fetches rules from the API; the value updates once the re-evaluation lands. */
  refresh: () => Promise<void>;
}

export interface UseVariantResult {
  key: string;
  variant: string;
  flag: Flag | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export interface WithFlagOptions {
  defaultValue?: boolean;
  invert?: boolean;
  loadingFallback?: ReactNode;
  disabledFallback?: ReactNode;
}
