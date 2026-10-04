import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { withFlag } from '../src/withFlag';
import { FlagGate } from '../src/FlagGate';
import { FlagsProvider } from '../src/FlagsProvider';
import { createMockClient, createMockManager } from './test-utils';

function PromoBanner(): ReactElement {
  return <div>Promo Banner</div>;
}

describe('withFlag', () => {
  it('renders wrapped component when flag is enabled', async () => {
    const manager = createMockManager({ promo: true });
    const client = createMockClient(manager);

    const Wrapped = withFlag('promo')(PromoBanner);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <Wrapped />
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Promo Banner')).toBeTruthy());
  });

  it('renders fallback when flag is disabled', async () => {
    const manager = createMockManager({ promo: false });
    const client = createMockClient(manager);

    const Wrapped = withFlag('promo', { disabledFallback: <span>Fallback</span> })(PromoBanner);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <Wrapped />
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Fallback')).toBeTruthy());
  });

  it('renders loading fallback while flag is resolving', async () => {
    const manager = createMockManager({});
    manager.single.mockReturnValue(new Promise(() => undefined));
    const client = createMockClient(manager);

    const Wrapped = withFlag('promo', { loadingFallback: <span>Loading...</span> })(PromoBanner);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <Wrapped />
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
  });

  it('supports invert mode', async () => {
    const manager = createMockManager({ promo: false });
    const client = createMockClient(manager);

    const Wrapped = withFlag('promo', { invert: true })(PromoBanner);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <Wrapped />
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Promo Banner')).toBeTruthy());
  });
});

describe('FlagGate', () => {
  it('shows children when enabled', async () => {
    const manager = createMockManager({ 'new-header': true });
    const client = createMockClient(manager);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <FlagGate flagKey="new-header">
          <div>Header V2</div>
        </FlagGate>
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Header V2')).toBeTruthy());
  });

  it('shows disabled fallback when disabled', async () => {
    const manager = createMockManager({ 'new-header': false });
    const client = createMockClient(manager);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <FlagGate flagKey="new-header" disabledFallback={<div>Old Header</div>}>
          <div>Header V2</div>
        </FlagGate>
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Old Header')).toBeTruthy());
  });

  it('supports invert mode', async () => {
    const manager = createMockManager({ 'new-header': false });
    const client = createMockClient(manager);

    render(
      <FlagsProvider client={client as never} preload={false}>
        <FlagGate flagKey="new-header" invert>
          <div>Header V2</div>
        </FlagGate>
      </FlagsProvider>
    );

    await waitFor(() => expect(screen.getByText('Header V2')).toBeTruthy());
  });
});
