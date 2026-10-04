import type { PropsWithChildren, ReactElement } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlagsProvider } from '../src/FlagsProvider';
import { useFlagsContext } from '../src/context';
import { useFlag, useVariant } from '../src/hooks';

// These tests run the hooks against the real @zenmanage/sdk (only the network is stubbed), so
// they catch drift between this package and the SDK that the mock-based suites can't.

function flagPayload(key: string, type: string, value: Record<string, unknown>): unknown {
  return {
    version: `fla_${key}`,
    type,
    key,
    name: key,
    target: {
      version: `tar_${key}`,
      expired_at: null,
      published_at: '2026-02-20T00:00:00+00:00',
      scheduled_at: null,
      value: { version: `val_${key}`, value },
    },
    rules: [],
  };
}

function stubRules(flags: unknown[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    const body = url.includes('/v1/flag-json')
      ? { data: { cdn: 'https://cdn.example.com', path: '/rules.json' } }
      : { version: '1', flags };

    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function wrapper({ children }: PropsWithChildren): ReactElement {
  return (
    <FlagsProvider environmentToken="cli_test_client_key" enableUsageReporting={false}>
      {children}
    </FlagsProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hooks against the real @zenmanage/sdk', () => {
  it('evaluates boolean, string, number, and json flags from a rules payload', async () => {
    stubRules([
      flagPayload('promo', 'boolean', { boolean: true }),
      flagPayload('mode', 'string', { string: 'one-page' }),
      flagPayload('timeout', 'number', { number: 1500 }),
      flagPayload('ui', 'json', { json: { theme: 'dark', pageSize: 50 } }),
      flagPayload('steps', 'json', { json: [1, 2, 3] }),
    ]);

    const { result } = renderHook(
      () => ({
        promo: useFlag('promo', false),
        mode: useVariant('mode'),
        timeout: useFlag('timeout', 1000),
        ui: useFlag('ui', { theme: 'light', pageSize: 20 }),
        steps: useFlag<number[]>('steps', []),
      }),
      { wrapper }
    );

    await waitFor(() => {
      const states = Object.values(result.current);
      expect(states.every((state) => !state.isLoading)).toBe(true);
    });

    expect(result.current.promo.value).toBe(true);
    expect(result.current.mode.variant).toBe('one-page');
    expect(result.current.timeout.value).toBe(1500);
    expect(result.current.ui.value).toEqual({ theme: 'dark', pageSize: 50 });
    expect(result.current.steps.value).toEqual([1, 2, 3]);
  });

  it('loads rules once for the whole tree, not once per hook', async () => {
    const fetchMock = stubRules([flagPayload('a', 'boolean', { boolean: true })]);

    const { result } = renderHook(
      () => [useFlag('a', false), useFlag('b', false), useFlag('c', false), useFlag('d', false)],
      { wrapper }
    );
    await waitFor(() => expect(result.current.every((state) => !state.isLoading)).toBe(true));

    // One metadata request plus one CDN request.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('resolves to the default for a flag that does not exist', async () => {
    stubRules([]);

    const { result } = renderHook(() => useFlag('missing', 'fallback'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBe('fallback');
    expect(result.current.error).toBeNull();
  });

  it('serves defaults without an error when the API is unreachable, and surfaces failures from refresh()', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const onError = vi.fn();

    const { result } = renderHook(
      () => ({ flag: useFlag('promo', true), provider: useFlagsContext() }),
      {
        wrapper: ({ children }: PropsWithChildren) => (
          <FlagsProvider environmentToken="cli_test_client_key" onError={onError}>
            {children}
          </FlagsProvider>
        ),
      }
    );
    await waitFor(() => expect(result.current.flag.isLoading).toBe(false));

    expect(result.current.flag.value).toBe(true);
    expect(result.current.flag.error).toBeNull();
    expect(onError).not.toHaveBeenCalled();

    await act(async () => {
      await expect(result.current.provider.refresh()).rejects.toThrow('ECONNREFUSED');
    });

    expect(result.current.flag.error?.message).toContain('ECONNREFUSED');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('picks up changed rules after refresh()', async () => {
    stubRules([flagPayload('promo', 'boolean', { boolean: false })]);

    const { result } = renderHook(() => useFlag('promo', false), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe(false);

    stubRules([flagPayload('promo', 'boolean', { boolean: true })]);
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.value).toBe(true));
  });
});
