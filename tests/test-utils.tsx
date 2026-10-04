import type { PropsWithChildren } from 'react';
import React from 'react';
import type { Mock } from 'vitest';
import type { FlagValue } from '@zenmanage/sdk';
import { FlagsProvider } from '../src/FlagsProvider';
import type { FlagsProviderProps } from '../src/types';

export interface MockFlag {
  asBool: () => boolean;
  asString: () => string;
  asNumber: () => number;
  asJson: () => unknown;
  getValue: () => FlagValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = Mock<any[], any>;

export interface MockManager {
  withContext: AnyMock;
  withDefaults: AnyMock;
  single: AnyMock;
  all: AnyMock;
  refreshRules: AnyMock;
}

export interface MockClient {
  flags: AnyMock;
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export function createMockFlag(value: FlagValue): MockFlag {
  const isJson = typeof value === 'object' && value !== null;

  return {
    asBool: () => (isJson ? true : Boolean(value)),
    asString: () => (isJson ? '' : String(value)),
    asNumber: () => (isJson ? 0 : Number(value)),
    asJson: () => (isJson ? value : {}),
    getValue: () => value,
  };
}

export function createMockManager(seed: Record<string, FlagValue> = {}): MockManager {
  const single = vi.fn(async (key: string, defaultValue?: FlagValue) => {
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

export function createWrapper(
  client: MockClient,
  preloadOrProps: boolean | Omit<FlagsProviderProps, 'client' | 'children'> = false
): React.FC<PropsWithChildren> {
  const props = typeof preloadOrProps === 'boolean' ? { preload: preloadOrProps } : preloadOrProps;

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <FlagsProvider client={client as never} {...props}>
        {children}
      </FlagsProvider>
    );
  };
}
