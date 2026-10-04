import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { useFlagsContext } from '../src/context';
import { useFlag, useVariant } from '../src/hooks';
import {
  createDeferred,
  createMockClient,
  createMockFlag,
  createMockManager,
  createWrapper,
  type MockFlag,
} from './test-utils';

describe('useFlag keeps results tied to the key that produced them', () => {
  it('ignores a stale response that resolves after the key changed', async () => {
    const manager = createMockManager();
    const pending: Record<string, ReturnType<typeof createDeferred<MockFlag>>> = {
      a: createDeferred<MockFlag>(),
      b: createDeferred<MockFlag>(),
    };
    manager.single.mockImplementation((key: string) => pending[key].promise);

    const { result, rerender } = renderHook(({ flagKey }) => useFlag(flagKey, 'default'), {
      initialProps: { flagKey: 'a' },
      wrapper: createWrapper(createMockClient(manager)),
    });

    rerender({ flagKey: 'b' });

    await act(async () => {
      pending.b.resolve(createMockFlag('from-b'));
    });
    await waitFor(() => expect(result.current.value).toBe('from-b'));

    await act(async () => {
      pending.a.resolve(createMockFlag('from-a'));
    });

    expect(result.current.value).toBe('from-b');
    expect(result.current.isLoading).toBe(false);
  });

  it("does not report the previous key's value while the new key is loading", async () => {
    const manager = createMockManager({ a: 'from-a' });
    const next = createDeferred<MockFlag>();
    manager.single.mockImplementation((key: string, fallback: string) =>
      key === 'a' ? Promise.resolve(createMockFlag('from-a')) : next.promise.then(() => fallback)
    );

    const { result, rerender } = renderHook(({ flagKey }) => useFlag(flagKey, 'default'), {
      initialProps: { flagKey: 'a' },
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.value).toBe('from-a'));

    rerender({ flagKey: 'b' });

    expect(result.current.value).toBe('default');
    expect(result.current.flag).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('does not re-evaluate on every render when given an inline object default', async () => {
    const manager = createMockManager();

    const { result, rerender } = renderHook(() => useFlag('config', { theme: 'light' }), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender();
    rerender();

    expect(manager.single).toHaveBeenCalledTimes(1);
  });
});

describe('useFlag and provider refresh', () => {
  it('re-evaluates mounted hooks after the provider refreshes, without reporting loading', async () => {
    const manager = createMockManager({ promo: false });

    const { result } = renderHook(
      () => ({ flag: useFlag('promo', false), provider: useFlagsContext() }),
      { wrapper: createWrapper(createMockClient(manager)) }
    );
    await waitFor(() => expect(result.current.flag.isLoading).toBe(false));
    expect(result.current.flag.value).toBe(false);

    manager.single.mockResolvedValue(createMockFlag(true));
    const loadingStates: boolean[] = [];

    await act(async () => {
      const refreshing = result.current.provider.refresh();
      loadingStates.push(result.current.flag.isLoading);
      await refreshing;
    });

    await waitFor(() => expect(result.current.flag.value).toBe(true));
    expect(manager.refreshRules).toHaveBeenCalledTimes(1);
    expect(loadingStates).toEqual([false]);
    expect(result.current.flag.isLoading).toBe(false);
  });

  it("makes the hook's refresh() re-fetch rules from the API, not just re-read the cache", async () => {
    const manager = createMockManager({ promo: false });

    const { result } = renderHook(() => useFlag('promo', false), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    manager.single.mockResolvedValue(createMockFlag(true));
    await act(async () => {
      await result.current.refresh();
    });

    expect(manager.refreshRules).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.value).toBe(true));
  });
});

describe('useFlag and provider preload', () => {
  it('waits for the provider preload so every hook reads from a warm cache', async () => {
    const manager = createMockManager({ promo: true });
    const preload = createDeferred<MockFlag[]>();
    manager.all.mockReturnValue(preload.promise);

    const { result } = renderHook(() => useFlag('promo', false), {
      wrapper: createWrapper(createMockClient(manager), true),
    });

    expect(result.current.isLoading).toBe(true);
    expect(manager.single).not.toHaveBeenCalled();

    await act(async () => {
      preload.resolve([]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe(true);
    expect(manager.single).toHaveBeenCalledTimes(1);
  });

  it('settles on the default with the error surfaced when the preload fails', async () => {
    const manager = createMockManager();
    manager.all.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useFlag('promo', true), {
      wrapper: createWrapper(createMockClient(manager), true),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe(true);
    expect(result.current.error?.message).toBe('network down');
  });
});

describe('useFlag value types', () => {
  it('reads a number flag', async () => {
    const manager = createMockManager({ timeout: 1500 });

    const { result } = renderHook(() => useFlag('timeout', 1000), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBe(1500);
  });

  it('reads a json object flag', async () => {
    const manager = createMockManager({ ui: { theme: 'dark', limit: 10 } });

    const { result } = renderHook(() => useFlag('ui', { theme: 'light', limit: 5 }), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toEqual({ theme: 'dark', limit: 10 });
  });

  it('reads a json array flag', async () => {
    const manager = createMockManager({ steps: [1, 2, 3] });

    const { result } = renderHook(() => useFlag<number[]>('steps', []), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toEqual([1, 2, 3]);
  });

  it('falls back to the json default for a flag that does not exist', async () => {
    const manager = createMockManager();

    const { result } = renderHook(() => useFlag('missing', { fallback: true }), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toEqual({ fallback: true });
  });

  it('infers widened value types instead of the literal default', () => {
    // `useFlag('k', false)` must give `boolean`, not the literal `false`, or `if (value)`
    // narrows to `never`. The expectations below are checked by `npm run type-check`.
    const { result } = renderHook(
      () => ({
        bool: useFlag('k', false),
        text: useFlag('k', 'control'),
        number: useFlag('k', 1500),
        json: useFlag('k', { theme: 'light' }),
        variant: useVariant('k'),
      }),
      { wrapper: createWrapper(createMockClient(createMockManager())) }
    );

    expectTypeOf(result.current.bool.value).toEqualTypeOf<boolean>();
    expectTypeOf(result.current.text.value).toEqualTypeOf<string>();
    expectTypeOf(result.current.number.value).toEqualTypeOf<number>();
    expectTypeOf(result.current.json.value).toEqualTypeOf<{ theme: string }>();
    expectTypeOf(result.current.variant.variant).toEqualTypeOf<string>();
    expect(result.current.bool.value).toBe(false);
  });
});

describe('useVariant', () => {
  it('defaults to "control" when the flag is missing', async () => {
    const manager = createMockManager();

    const { result } = renderHook(() => useVariant('checkout'), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.variant).toBe('control');
    expect(manager.single).toHaveBeenCalledWith('checkout', 'control');
  });

  it('surfaces evaluation errors and keeps the default variant', async () => {
    const manager = createMockManager();
    manager.single.mockRejectedValue(new Error('evaluation failed'));

    const { result } = renderHook(() => useVariant('checkout', 'a'), {
      wrapper: createWrapper(createMockClient(manager)),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.variant).toBe('a');
    expect(result.current.error?.message).toBe('evaluation failed');
  });
});
