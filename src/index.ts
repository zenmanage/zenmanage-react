export { FlagsProvider } from './FlagsProvider';
export { FlagGate, type FlagGateProps } from './FlagGate';
export { withFlag } from './withFlag';
export { useFlag, useVariant } from './hooks';
export { useFlagsContext } from './context';

export type {
  FlagsProviderProps,
  FlagsContextValue,
  PrimitiveFlagValue,
  UseFlagResult,
  UseVariantResult,
  WidenFlagValue,
  WithFlagOptions,
} from './types';
