import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // tsup 8 injects `baseUrl` into the declaration build. That build runs on the TypeScript 6
  // compiler API (@typescript/typescript6), where `baseUrl` is deprecated, so silence it here.
  // It can go once tsup stops injecting it, or the package moves to tsup 9 (needs Node 20.19+).
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@zenmanage/sdk'],
  treeshake: false,
  minify: false,
  // Hooks and context only work in Client Components. Without this, importing the package
  // from a React Server Component (Next.js App Router) fails at build time.
  banner: { js: "'use client';" },
});
