import {defineConfig, globalIgnores} from 'eslint/config';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {includeIgnoreFile} from '@eslint/compat';
import * as globals from 'globals';
import tseslint from 'typescript-eslint';
import * as js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import * as react from 'eslint-plugin-react';
import * as reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// A lightweight config with mostly inexpensive rules and without type-aware lintig. Ideal for everyday usage in IDE.

export default defineConfig([
  ...[
    '',
    'apps/backend/src/email/_styles/',
  ].map(path => join(process.cwd(), `${path}.gitignore`)).filter((path): path is string => existsSync(path)).map(path => includeIgnoreFile(path)),

  globalIgnores([
    'eslint.config.ts',
    'eslint.full.config.ts',
    'resources',
  ]),

  {
    files: ['**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.cts', '**.*.mts'],

    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Type-aware linting is explicitely turned off - use the full linting config for the final lint.
      parserOptions: {}
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    plugins: {
      js,
      '@stylistic': stylistic,
      '@typescript-eslint': tseslint.plugin,
      'react-refresh': reactRefresh,
    },

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
    ],

    rules: {
      '@stylistic/linebreak-style': ['error', 'unix'],
      'no-eval': ['error'],
      'no-warning-comments': 'off',
      'curly': ['warn', 'all'],
      'erasablesyntaxonly': 'off',

      // Replaced by the @typescript-eslint rules.
      'no-unused-vars': 'off',
      'no-empty-function': 'off',

      '@stylistic/semi': ['error', 'always'],
      '@stylistic/indent': ['warn', 2, {
        ignoredNodes: [
          // A workaround for decorators. Not ideal, though.
          'FunctionExpression > .params[decorators.length > 0]',
          'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
          'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',
        ],
      }],
      '@stylistic/array-bracket-spacing': ['warn', 'never'],
      '@stylistic/object-curly-spacing': ['warn', 'never'],
      '@stylistic/space-before-function-paren': ['warn', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/brace-style': ['warn', 'stroustrup'],
      '@stylistic/nonblock-statement-body-position': ['warn', 'below'],
      '@stylistic/comma-dangle': ['warn', 'never'],
      '@stylistic/quotes': ['warn', 'double', {
        allowTemplateLiterals: 'always',
      }],
      '@stylistic/jsx-quotes': ['warn', 'prefer-double'],
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
      '@stylistic/member-delimiter-style': ['error', {
        singleline: {
          delimiter: 'comma',
        },
      }],
      '@stylistic/space-infix-ops': ['warn'],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-empty-function': ['warn', {
        allow: ['private-constructors'],
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/no-explicit-any': ['warn'],

      // React
      'react/display-name': ['off'],
      'react/jsx-no-target-blank': ['error', {
        allowReferrer: true,
      }],
      // These should be already covered by typescript.
      'react/prop-types': ['off'],
      'react/no-unknown-property': ['off'],
      // These are enabled in full config.
      'react/no-direct-mutation-state': ['off'],
      'react/require-render-return': ['off'],
      'react/no-render-return-value': ['off'],

      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],

      'react-hooks/exhaustive-deps': ['warn'],
      // TODO These rules have too many false positives - review and enable later.
      'react-hooks/refs': ['off'],
      'react-hooks/set-state-in-effect': ['off'],
      'react-hooks/static-components': ['off'],
      // TODO False positives with window.location ...
      'react-hooks/immutability': ['off'],
    },
  },
]);
