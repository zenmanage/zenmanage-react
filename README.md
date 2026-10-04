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

- Minimal wrapper around [`@zenmanage/sdk`](https://www.npmjs.com/package/@zenmanage/sdk)
- Fully typed hooks for booleans, strings, numbers, and JSON
- Explicit loading and error states, so you decide how to handle both
- 92%+ test coverage, enforced in CI

## Installation

```bash
npm install @zenmanage/react @zenmanage/sdk react
```

Requires React 18.2 or newer (React 19 works too) and `@zenmanage/sdk` 3.5 or newer.

## Key Compatibility

- Browser/client runtime: use client keys prefixed with `cli_`
- Server/node runtime: use server keys prefixed with `srv_`
- Mobile keys (`mob_`) are not valid for this package

`@zenmanage/sdk` checks the key against the runtime it's running in, so a `cli_` key throws in Node.js and a `srv_` key throws in a browser. See [Server-Side Rendering](#server-side-rendering) if you render on the server.

## Quick Start

```tsx
import { FlagsProvider, useFlag } from '@zenmanage/react';

function CheckoutButton() {
  const { value: enabled, isLoading } = useFlag('new-checkout-button', false);

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  return <button>{enabled ? 'Checkout (New)' : 'Checkout'}</button>;
}

export function App() {
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

- `client?`: existing `Zenmanage` client instance. When set, `environmentToken` and the other client options are ignored
- `environmentToken?`: token used to create an internal client
- `apiEndpoint?`: custom API base URL
- `cacheTtl?`: cache TTL in seconds
- `enableUsageReporting?`: usage reporting toggle
- `context?`: base `Context` to evaluate with
- `defaults?`: `DefaultsCollection` fallback values
- `preload?`: preload all flags on mount (default: `true`)
- `onError?`: preload/refresh error callback

Pass either `client` or `environmentToken`. Without one, the provider throws.

Props don't need to be memoized. `context` and `defaults` are compared by content, and `onError` can be an inline function, so none of them restart loading when your component re-renders. Changing what's _in_ the `context` (a different user, say) does re-evaluate every flag, and hooks report `isLoading` until the new values land.

The internal client identifies itself to the API as `zenmanage-react`. If you pass your own `client`, it reports whatever agent you configured on it.

### `useFlag(key, defaultValue)`

Resolves and evaluates a single flag. The type of `defaultValue` decides how the flag is read: boolean, string, number, or a JSON object or array.

```tsx
const { value, flag, isLoading, error, refresh } = useFlag('checkout-v2', false);
```

- `value` is the default until the flag resolves, and again if evaluation fails
- `isLoading` is `true` until the first value for that key lands
- `error` is set when evaluation failed or a `refresh()` failed. `value` falls back to your default in that case
- `refresh()` re-fetches rules from the API. Every mounted hook re-evaluates and keeps showing its last value while it does

`useFlag('k', false).value` is typed `boolean`, and `useFlag('k', 'control').value` is `string`. Not the literals `false` and `'control'`.

#### JSON flags

Pass an object or array as the default to read a JSON flag. Type it with a generic when the default doesn't say enough:

```tsx
const { value: ui } = useFlag('ui-config', { theme: 'light', pageSize: 20 });
const { value: steps } = useFlag<string[]>('onboarding-steps', []);
```

Inline defaults are fine. They're compared by content, not identity.

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

### `useFlagsContext()`

Returns the provider's state: `manager`, `client`, `isReady`, `isLoading`, `error`, and `refresh()`. Reach for it when you need the underlying `FlagManager`, or want to refresh from outside a flag hook.

```tsx
const { refresh } = useFlagsContext();
```

## Usage Patterns

### Context-Based Targeting

```tsx
import { Attribute, Context } from '@zenmanage/sdk';
import { FlagsProvider, useFlag } from '@zenmanage/react';

function PremiumBanner() {
  const { value } = useFlag('premium-banner', false);
  return value ? <div>Premium Banner</div> : null;
}

export function App({ user }: { user: { id: string; name: string; plan: string } }) {
  const context = new Context('user', user.name, user.id, [new Attribute('plan', [user.plan])]);

  return (
    <FlagsProvider environmentToken="cli_your_client_key_here" context={context}>
      <PremiumBanner />
    </FlagsProvider>
  );
}
```

### A/B Testing with `useVariant`

```tsx
function CheckoutExperience() {
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

### When The API Is Unreachable

`@zenmanage/sdk` falls back to your defaults. Hooks resolve to the default you passed (or the one in `defaults`) with no error, so a flag outage doesn't take your UI down.

`refresh()` is the exception. It throws, sets `error` on the provider and every hook, and calls `onError`, so you can show a retry:

```tsx
const { refresh, error } = useFlagsContext();

if (error) {
  return <button onClick={() => refresh().catch(() => undefined)}>Retry</button>;
}
```

## Server-Side Rendering

On the server, effects don't run, so hooks render their defaults with `isLoading: true` and flags load after hydration in the browser. Two things to know:

- `@zenmanage/sdk` wants a `srv_` key in Node.js and a `cli_` key in the browser. Pass the server key when `typeof window === 'undefined'` and the client key in the browser. A `cli_` key on the server throws while rendering.
- Never ship a `srv_` key to the browser. Read it from a server-only environment variable.

If you need the real values in the first paint, fetch them on the server with `@zenmanage/sdk` and pass them down as props.

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

A local integration smoke app lives in `examples/smoke-app`. It installs the built package against React 18, the oldest version this package supports, and validates real usage of:

- `FlagsProvider`
- `useFlag` + `useVariant`
- `withFlag`
- `FlagGate`

Run it with:

```bash
npm run test:smoke
```

## Releases

Releases go out through Changesets via:

- `.changeset/config.json`
- `.github/workflows/release.yml`

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

## License

MIT
