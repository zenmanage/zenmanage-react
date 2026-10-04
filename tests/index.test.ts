import { describe, expect, it } from 'vitest';
import * as ReactSdk from '../src';

describe('public exports', () => {
  it('exports all public API members', () => {
    expect(ReactSdk.FlagsProvider).toBeDefined();
    expect(ReactSdk.FlagGate).toBeDefined();
    expect(ReactSdk.withFlag).toBeDefined();
    expect(ReactSdk.useFlag).toBeDefined();
    expect(ReactSdk.useVariant).toBeDefined();
    expect(ReactSdk.useFlagsContext).toBeDefined();
  });
});
