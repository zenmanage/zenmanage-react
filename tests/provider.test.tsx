import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Context, DefaultsCollection } from '@zenmanage/sdk';
import { FlagsProvider } from '../src/FlagsProvider';
import { useFlagsContext } from '../src/context';
import { createMockClient, createMockManager } from './test-utils';

function ContextProbe(): JSX.Element {
  const state = useFlagsContext();

  return (
    <div>
      <span data-testid="ready">{String(state.isReady)}</span>
      <span data-testid="loading">{String(state.isLoading)}</span>
      <span data-testid="has-error">{String(Boolean(state.error))}</span>
    </div>
  );
}

describe('FlagsProvider', () => {
  it('throws if neither client nor environmentToken is provided', () => {
    expect(() => render(<FlagsProvider>{null}</FlagsProvider>)).toThrow(
      'FlagsProvider requires either a client or an environmentToken.'
    );
  });

  it('marks provider as ready after preload', async () => {
    const manager = createMockManager({ 'new-ui': true });
    const client = createMockClient(manager);

    const { getByTestId } = render(
      <FlagsProvider client={client as never} preload>
        <ContextProbe />
      </FlagsProvider>
    );

    await waitFor(() => expect(getByTestId('ready').textContent).toBe('true'));
    expect(getByTestId('has-error').textContent).toBe('false');
  });

  it('applies context and defaults to the flag manager', async () => {
    const manager = createMockManager({});
    const client = createMockClient(manager);
    const context = Context.single('user', '123');
    const defaults = DefaultsCollection.fromObject({ 'flag-a': true });

    render(
      <FlagsProvider client={client as never} preload={false} context={context} defaults={defaults}>
        <ContextProbe />
      </FlagsProvider>
    );

    await waitFor(() => expect(manager.withContext).toHaveBeenCalledWith(context));
    expect(manager.withDefaults).toHaveBeenCalledWith(defaults);
  });

  it('invokes onError when preload fails', async () => {
    const manager = createMockManager();
    manager.all = vi.fn(async () => {
      throw new Error('network issue');
    });
    const client = createMockClient(manager);
    const onError = vi.fn();

    const { getByTestId } = render(
      <FlagsProvider client={client as never} preload onError={onError}>
        <ContextProbe />
      </FlagsProvider>
    );

    await waitFor(() => expect(getByTestId('has-error').textContent).toBe('true'));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('surfaces refresh errors and invokes onError', async () => {
    const manager = createMockManager({});
    manager.refreshRules = vi.fn(async () => {
      throw new Error('refresh failed');
    });
    const client = createMockClient(manager);
    const onError = vi.fn();

    let refreshFn: (() => Promise<void>) | null = null;

    function RefreshProbe(): JSX.Element {
      const state = useFlagsContext();
      refreshFn = state.refresh;
      return <div data-testid="error-state">{String(Boolean(state.error))}</div>;
    }

    const { getByTestId } = render(
      <FlagsProvider client={client as never} preload={false} onError={onError}>
        <RefreshProbe />
      </FlagsProvider>
    );

    expect(refreshFn).not.toBeNull();

    await act(async () => {
      await expect(refreshFn!()).rejects.toThrow('refresh failed');
    });

    await waitFor(() => expect(getByTestId('error-state').textContent).toBe('true'));
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
