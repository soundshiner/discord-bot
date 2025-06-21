import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.js'],
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js', 'src/**/*.test.js', 'src/**/*.spec.js'],
    exclude: ['node_modules/', 'dist/', 'coverage/', '*.config.js', '*.config.mjs', 'scripts/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'coverage/',
        '*.config.js',
        '*.config.mjs',
        'scripts/',
        '**/*.d.ts',
        '**/*.test.js',
        '**/*.spec.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
