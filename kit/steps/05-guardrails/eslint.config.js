// Règles de lint de RHPilot.
import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'coverage/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  sonarjs.configs.recommended,
  { languageOptions: { globals: { ...globals.node } } },
  { files: ['public/**/*.js'], languageOptions: { globals: { ...globals.browser } } },
  {
    // Dette connue le jour de l'audit : en avertissement, et le seuil --max-warnings
    // de package.json interdit d'en ajouter.
    rules: {
      'sonarjs/todo-tag': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-default-utility-imports': 'warn',
    },
  },
];
