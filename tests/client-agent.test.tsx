import type { ReactElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlagsProvider } from '../src/FlagsProvider';
import { useFlagsContext } from '../src/context';
import { version as packageVersion } from '../package.json';

function stubFetch(capturedHeaders: Record<string, string>[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options: RequestInit) => {
      capturedHeaders.push(options.headers as Record<string, string>);
      const body = url.includes('/v1/flag-json')
        ? { data: { cdn: 'https://cdn.example.com', path: '/rules.json' } }
        : { version: '1', flags: [] };

      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    })
  );
}

function ReadyProbe(): ReactElement {
  const { isReady } = useFlagsContext();
  return <div data-testid="ready">{String(isReady)}</div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('client agent', () => {
  it('identifies the package to the API as zenmanage-react/<version>, not the base SDK', async () => {
    const capturedHeaders: Record<string, string>[] = [];
    stubFetch(capturedHeaders);

    const { getByTestId } = render(
      <FlagsProvider environmentToken="cli_test_client_key">
        <ReadyProbe />
      </FlagsProvider>
    );

    await waitFor(() => expect(getByTestId('ready').textContent).toBe('true'));
    expect(capturedHeaders[0]['X-ZEN-CLIENT-AGENT']).toBe(`zenmanage-react/${packageVersion}`);
    expect(capturedHeaders[0]['X-ZEN-API-KEY']).toBe('cli_test_client_key');
  });
});
