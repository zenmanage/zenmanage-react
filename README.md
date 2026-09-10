# Zenmanage React SDK

[![npm version](https://badge.fury.io/js/@zenmanage%2Freact.svg)](https://www.npmjs.com/package/@zenmanage/react)
[![Build Status](https://github.com/zenmanage/zenmanage-react/actions/workflows/ci.yml/badge.svg)](https://github.com/zenmanage/zenmanage-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

React hooks and components for Zenmanage feature flags.

This package extends [`@zenmanage/sdk`](https://www.npmjs.com/package/@zenmanage/sdk) and adds React-native primitives:

- `FlagsProvider` for app-level initialization
- `useFlag(key, defaultValue)`
- `useVariant(key)`
- `withFlag(key, options)`
- `FlagGate` conditional rendering component

## Why This Package

- Minimal wrapper over the proven JavaScript SDK
- Fully typed hooks for booleans, strings, and numbers
- Explicit loading and error states for predictable UI
- High test coverage with CI-enforced thresholds

## Installation

```bash
npm install @zenmanage/react @zenmanage/sdk react react-dom
```

## Key Compatibility

- Browser/client runtime: use client keys prefixed with `cli_`
- Server/node runtime: use server keys prefixed with `srv_`
- Mobile keys (`mob_`) are not valid for this package

## Quick Start

```tsx
import { FlagsProvider, useFlag } from '@zenmanage/react';

function CheckoutButton(): JSX.Element {
  const { value: enabled, isLoading } = useFlag('new-checkout-button', false);

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  return <button>{enabled ? 'Checkout (New)' : 'Checkout'}</button>;
}

export function App(): JSX.Element {
  return (
    <FlagsProvider environmentToken="cli_your_client_key_here">
      <CheckoutButton />
    </FlagsProvider>
  );
}
```

## API

### `FlagsProvider`

Initializes the SDK and exposes a configured flag manager via React context.

```tsx
<FlagsProvider
  environmentToken="cli_your_client_key_here"
  cacheTtl={3600}
  enableUsageReporting={true}
  preload={true}
  onError={(error) => console.error(error)}
>
  <App />
</FlagsProvider>
```

Props:

- `client?`: existing `Zenmanage` client instance
- `environmentToken?`: token used to create an internal client
- `apiEndpoint?`: custom API base URL
- `cacheTtl?`: cache TTL in seconds
- `enableUsageReporting?`: usage reporting toggle
- `context?`: base `Context` to evaluate with
- `defaults?`: `DefaultsCollection` fallback values
- `preload?`: preload all flags on mount (default: `true`)
- `onError?`: preload/refresh error callback

### `useFlag(key, defaultValue)`

Resolves and evaluates a single flag.

```tsx
const { value, flag, isLoading, error, refresh } = useFlag('checkout-v2', false);
```

### `useVariant(key, defaultVariant = 'control')`

Convenience hook for A/B variants.

```tsx
const { variant } = useVariant('checkout-flow', 'control');
```

### `withFlag(key, options)`

Higher-order component for feature-gated rendering.

```tsx
const NewDashboard = () => <DashboardV2 />;

export default withFlag('dashboard-v2', {
  defaultValue: false,
  disabledFallback: <LegacyDashboard />,
})(NewDashboard);
```

### `FlagGate`

Declarative conditional rendering component.

```tsx
<FlagGate flagKey="beta-chat" disabledFallback={<LegacyChat />}>
  <BetaChat />
</FlagGate>
```

## Usage Patterns

### Context-Based Targeting

```tsx
import { Attribute, Context } from '@zenmanage/sdk';
import { FlagsProvider, useFlag } from '@zenmanage/react';

const userContext = new Context('user', 'Jane', 'user-123', [
  new Attribute('country', ['US']),
  new Attribute('plan', ['pro']),
]);

function PremiumBanner(): JSX.Element | null {
  const { value } = useFlag('premium-banner', false);
  return value ? <div>Premium Banner</div> : null;
}

export function App(): JSX.Element {
  return (
    <FlagsProvider environmentToken="cli_your_client_key_here" context={userContext}>
      <PremiumBanner />
    </FlagsProvider>
  );
}
```

### A/B Testing with `useVariant`

```tsx
function CheckoutExperience(): JSX.Element {
  const { variant, isLoading } = useVariant('checkout-flow', 'control');

  if (isLoading) {
    return <p>Loading checkout...</p>;
  }

  if (variant === 'one-page') {
    return <OnePageCheckout />;
  }

  return <MultiPageCheckout />;
}
```

## Examples

See [examples/README.md](examples/README.md) for a full set of runnable examples matching the core SDK use-cases:

- `simple-flags.tsx`
- `context-based-flags.tsx`
- `ab-testing.tsx`
- `defaults.tsx`
- `caching.tsx`
- `percentage-rollouts.tsx`

## Development

```bash
npm install
npm run validate
```

Useful commands:

- `npm run lint`
- `npm run type-check`
- `npm run test:coverage`
- `npm run build`
- `npm run test:smoke`

## Storybook-Style Docs

Storybook-style docs for key rendering patterns are available in:

- [docs/storybook-style/README.md](docs/storybook-style/README.md)
- [docs/storybook-style/FlagGate.stories.mdx](docs/storybook-style/FlagGate.stories.mdx)
- [docs/storybook-style/withFlag.stories.mdx](docs/storybook-style/withFlag.stories.mdx)

## Smoke App

A local integration smoke app lives in `examples/smoke-app` and validates real React usage of:

- `FlagsProvider`
- `useFlag` + `useVariant`
- `withFlag`
- `FlagGate`

Run it with:

```bash
npm run test:smoke
```

## Publishing

Use [docs/PUBLISHING_NEXT_STEPS.md](docs/PUBLISHING_NEXT_STEPS.md).

Automated releases are configured with Changesets via:

- `.changeset/config.json`
- `.github/workflows/release.yml`

## License

MIT
