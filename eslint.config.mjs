import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Build outputs and dependencies are never linted.
  globalIgnores(['node_modules/', '.vite/', 'out/', 'coverage/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Main process, preload and tooling configs run in Node.
    files: ['src/main/**/*.ts', 'src/preload.ts', '*.ts', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Renderer code runs in the browser (DOM, canvas).
    files: ['src/renderer/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
]);
