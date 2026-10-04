import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@zenmanage/sdk'],
  treeshake: false,
  minify: false,
  // Hooks and context only work in Client Components. Without this, importing the package
  // from a React Server Component (Next.js App Router) fails at build time.
  banner: { js: "'use client';" },
});
