import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // No tests exist yet at bootstrap: do not fail the run because of that.
    passWithNoTests: true,
  },
});
