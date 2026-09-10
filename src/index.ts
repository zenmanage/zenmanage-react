export { FlagsProvider } from './FlagsProvider';
export { FlagGate, type FlagGateProps } from './FlagGate';
export { withFlag } from './withFlag';
export { useFlag, useVariant, useBooleanFlag } from './hooks';
export { useFlagsContext } from './context';

export type {
  FlagsProviderProps,
  FlagsContextValue,
  PrimitiveFlagValue,
  UseFlagResult,
  UseVariantResult,
  WithFlagOptions,
} from './types';
