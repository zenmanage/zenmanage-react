# Smoke App

This app validates that the built `@zenmanage/react` package works as a real dependency in a React environment. It runs on React 18, the oldest version the package supports. The unit tests in `tests/` run on React 19.

It exercises:

- `FlagsProvider`
- `useFlag`
- `useVariant`
- `withFlag`
- `FlagGate`

Run from the package root:

```bash
npm run test:smoke
```
