import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFlag, useVariant } from '../src/hooks';
import { createMockClient, createMockManager, createWrapper } from './test-utils';

describe('useFlag', () => {
  it('resolves a boolean flag value', async () => {
    const manager = createMockManager({ 'new-checkout': true });
    const client = createMockClient(manager);

    const { result } = renderHook(() => useFlag('new-checkout', false), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBe(true);
    expect(result.current.error).toBeNull();
    expect(manager.single).toHaveBeenCalledWith('new-checkout', false);
  });

  it('falls back to default value when loading fails', async () => {
    const manager = createMockManager();
    manager.single.mockRejectedValue(new Error('boom'));

    const client = createMockClient(manager);

    const { result } = renderHook(() => useFlag('missing-flag', true), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBe(true);
    expect(result.current.error?.message).toBe('boom');
  });

  it('supports manual refresh', async () => {
    const manager = createMockManager({ 'new-checkout': false });
    const client = createMockClient(manager);

    const { result } = renderHook(() => useFlag('new-checkout', false), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe(false);

    manager.single.mockResolvedValueOnce({
      asBool: () => true,
      asString: () => 'true',
      asNumber: () => 1,
      getValue: () => true,
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.value).toBe(true));
  });
});

describe('useVariant', () => {
  it('returns variant as string', async () => {
    const manager = createMockManager({ 'checkout-variant': 'one-page' });
    const client = createMockClient(manager);

    const { result } = renderHook(() => useVariant('checkout-variant', 'control'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.variant).toBe('one-page');
    expect(result.current.error).toBeNull();
  });
});
