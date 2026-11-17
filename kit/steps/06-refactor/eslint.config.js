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
    files: ['src/**/*.js'],
    rules: {
      eqeqeq: 'error',
      // Les journaux passent par src/logger.js, qui masque les emails et les téléphones.
      'no-console': 'error',
      // TODO : interdisez d'importer le module pg ailleurs que dans src/db.js (règle no-restricted-imports)
    },
  },
  {
    files: ['public/**/*.js'],
    rules: {
      // Le HTML ne se construit pas avec des données : textContent ou createElement.
      'no-restricted-syntax': [
        'error',
        { selector: "AssignmentExpression[left.property.name='innerHTML']", message: 'Utilisez textContent ou createElement.' },
      ],
    },
  },
  { files: ['src/logger.js'], rules: { 'no-console': 'off' } },
  { files: ['src/db.js'], rules: { 'no-restricted-imports': 'off' } },
];
