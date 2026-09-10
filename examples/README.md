# Zenmanage React SDK Examples

This directory contains examples that mirror the core SDK use-cases while using React hooks/components.

## Setup

```bash
npm install
export ZENMANAGE_ENVIRONMENT_TOKEN="cli_your_client_key_here"
```

Then run any example in your own React app or sandbox.

## Smoke App Integration

An end-to-end integration smoke app is included at `examples/smoke-app`.

Run from package root:

```bash
npm run test:smoke
```

## Examples

### simple-flags.tsx
Basic usage of `FlagsProvider` and `useFlag`.

### context-based-flags.tsx
Shows context-based targeting with `Context` and `Attribute`.

### ab-testing.tsx
Uses `useVariant` for variant-driven rendering.

### defaults.tsx
Demonstrates default values and `DefaultsCollection`.

### caching.tsx
Shows cache TTL and usage reporting configuration at provider level.

### percentage-rollouts.tsx
Demonstrates deterministic rollout behavior with user identifiers.

## Storybook-Style Docs

For Storybook-style reference docs of `FlagGate` and `withFlag`, see:

- `../docs/storybook-style/FlagGate.stories.mdx`
- `../docs/storybook-style/withFlag.stories.mdx`
