import { createContext, useContext } from 'react';
import type { FlagsContextValue } from './types';

export const FlagsContext = createContext<FlagsContextValue | null>(null);

export function useFlagsContext(): FlagsContextValue {
  const context = useContext(FlagsContext);
  if (!context) {
    throw new Error('Zenmanage React hooks must be used within <FlagsProvider>.');
  }

  return context;
}
