import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@zenmanage/react',
        replacement: fileURLToPath(new URL('../../dist/index.js', import.meta.url)),
      },
      {
        find: /^react$/,
        replacement: fileURLToPath(new URL('./node_modules/react/index.js', import.meta.url)),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: fileURLToPath(new URL('./node_modules/react/jsx-runtime.js', import.meta.url)),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: fileURLToPath(
          new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url)
        ),
      },
      {
        find: /^react-dom$/,
        replacement: fileURLToPath(new URL('./node_modules/react-dom/index.js', import.meta.url)),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
