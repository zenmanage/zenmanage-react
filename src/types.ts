import type { PropsWithChildren } from 'react';
import type {
  Context,
  DefaultsCollection,
  Flag,
  FlagManager,
  FlagValue,
  Zenmanage,
} from '@zenmanage/sdk';

export type PrimitiveFlagValue = boolean | string | number;

export interface FlagsProviderProps extends PropsWithChildren {
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
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export interface UseFlagResult<T extends PrimitiveFlagValue> {
  key: string;
  value: T;
  flag: Flag | null;
  isLoading: boolean;
  error: Error | null;
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
  defaultValue?: FlagValue;
  invert?: boolean;
  loadingFallback?: React.ReactNode;
  disabledFallback?: React.ReactNode;
}
