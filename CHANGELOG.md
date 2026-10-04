# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-10-04

First public release. The API below is the 1.0 surface, and semantic versioning applies from here. The Changed, Removed, and Fixed entries are relative to the internal 0.1.0 snapshot.

### Added

- `FlagsProvider`, `useFlag`, `useVariant`, `useFlagsContext`, `withFlag`, and `FlagGate`.
- JSON flags. Pass an object or array as the default to `useFlag` and read the flag's JSON value.
- `FlagsProvider` identifies itself to the API as `zenmanage-react/<version>` instead of the base SDK's `zenmanage-javascript`. This relies on `ConfigBuilder.withClientAgent()` from `@zenmanage/sdk` 3.5.0.
- The built files start with `'use client'`, so the package can be imported from a Next.js App Router layout or page.
- The package ships separate type declarations for ESM and CJS (`index.d.ts` and `index.d.cts`) and is marked `sideEffects: false`.

### Changed

- `@zenmanage/sdk` 3.5.0 or newer is now required.
- `react-dom` is no longer a peer dependency. Nothing in this package imports it.
- `useFlag('k', false).value` is typed `boolean`, and `useFlag('k', 'control').value` is `string`. Before, the literal default leaked into the type (`false`, `'control'`), which made `if (value)` narrow to `never`.
- `useFlag` and `useVariant` don't evaluate until the provider's preload finishes, so every hook reads from the same cache. Before, each hook could trigger its own rules fetch.
- A result only counts for the key and context that produced it. Before, switching `key` showed the old key's value until the new one loaded, and a slow response for the old key could overwrite the new one.
- `refresh()` re-fetches rules from the API and re-evaluates every mounted hook. Before, the hook's `refresh()` re-read the cache and the provider's `refresh()` didn't reach mounted hooks. A refresh no longer sets `isLoading`, so `FlagGate` and `withFlag` keep their children mounted while it runs.
- `FlagsProvider` compares `context` and `defaults` by content, and reads `onError` through a ref. An inline `onError`, or an equal-but-new `Context` on each render, no longer restarts loading and flashes every gated component.
- Inline object and array defaults (`useFlag('ui', { theme: 'light' })`) are compared by content. Before, they re-ran the evaluation on every render without end.
- The provider reports `isLoading: true` from its first render when preloading, and `isReady: true` from its first render when not.
- `withFlag`'s `defaultValue` option is typed `boolean`.
- Declarations no longer use the global `JSX` namespace, which `@types/react` 19 removed. Examples and README snippets no longer annotate return types with it.

### Removed

- `useBooleanFlag`. It did the same thing as `useFlag(key, false)`.

### Fixed

- Hooks stayed in `isLoading` forever after a failed preload. They now settle on their default with the error set.

## [0.1.0] - 2026-05-07

### Added

- Initial React SDK package structure for Zenmanage.
- `FlagsProvider` for SDK initialization and context wiring.
- `useFlag(key, defaultValue)` hook.
- `useVariant(key)` hook.
- `useBooleanFlag(key)` helper hook.
- `withFlag(key, options)` higher-order component.
- `FlagGate` component for declarative flag-gated rendering.
- Comprehensive tests with strict coverage thresholds.
- CI pipeline, examples, and publishing documentation.
