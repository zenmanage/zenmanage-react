import type { ReactElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlagsProvider } from '../src/FlagsProvider';
import { useFlagsContext } from '../src/context';

function RuntimeProbe(): ReactElement {
  const state = useFlagsContext();

  return (
    <div>
      <span data-testid="ready">{String(state.isReady)}</span>
      <span data-testid="loading">{String(state.isLoading)}</span>
    </div>
  );
}

describe('FlagsProvider runtime client init', () => {
  it('builds an internal client from environmentToken', async () => {
    const { getByTestId } = render(
      <FlagsProvider
        environmentToken="cli_test_client_key"
        apiEndpoint="https://api.zenmanage.com"
        cacheTtl={120}
        enableUsageReporting={false}
        preload={false}
      >
        <RuntimeProbe />
      </FlagsProvider>
    );

    await waitFor(() => expect(getByTestId('ready').textContent).toBe('true'));
    expect(getByTestId('loading').textContent).toBe('false');
  });
});
