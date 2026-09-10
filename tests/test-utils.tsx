import type { PropsWithChildren } from 'react';
import React from 'react';
import { FlagsProvider } from '../src/FlagsProvider';

type FlagPrimitive = boolean | string | number;

export interface MockFlag {
  asBool: () => boolean;
  asString: () => string;
  asNumber: () => number;
  getValue: () => FlagPrimitive;
}

export interface MockManager {
  withContext: ReturnType<typeof vi.fn>;
  withDefaults: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
  refreshRules: ReturnType<typeof vi.fn>;
}

export interface MockClient {
  flags: ReturnType<typeof vi.fn>;
}

export function createMockFlag(value: FlagPrimitive): MockFlag {
  return {
    asBool: () => Boolean(value),
    asString: () => String(value),
    asNumber: () => Number(value),
    getValue: () => value,
  };
}

export function createMockManager(seed: Record<string, FlagPrimitive> = {}): MockManager {
  const single = vi.fn(async (key: string, defaultValue?: FlagPrimitive) => {
    if (Object.prototype.hasOwnProperty.call(seed, key)) {
      return createMockFlag(seed[key]);
    }

    if (defaultValue !== undefined) {
      return createMockFlag(defaultValue);
    }

    throw new Error(`Flag not found: ${key}`);
  });

  const manager: MockManager = {
    withContext: vi.fn(),
    withDefaults: vi.fn(),
    single,
    all: vi.fn(async () => Object.keys(seed).map((key) => createMockFlag(seed[key]))),
    refreshRules: vi.fn(async () => undefined),
  };

  manager.withContext.mockReturnValue(manager);
  manager.withDefaults.mockReturnValue(manager);

  return manager;
}

export function createMockClient(manager: MockManager): MockClient {
  return {
    flags: vi.fn(() => manager),
  };
}

export function createWrapper(client: MockClient, preload = false): React.FC<PropsWithChildren> {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <FlagsProvider client={client as never} preload={preload}>
        {children}
      </FlagsProvider>
    );
  };
}
