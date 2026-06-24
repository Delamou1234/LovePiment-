import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/modules/**/lib/**/*.ts',
        'src/shared/lib/**/*.ts',
      ],
      exclude: ['**/*.test.ts', '**/cached-queries.ts'],
    },
  },
});
