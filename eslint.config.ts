import {defineConfig, globalIgnores} from "eslint/config";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {includeIgnoreFile} from "@eslint/compat";
import * as globals from "globals";
import tseslint from "typescript-eslint";
import * as js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
// import frontend-specific config so it can remain a separate file
import frontendEslintConfig from "@mtgit/frontend/eslint.frontend";
import * as unusedImportsPlugin from "eslint-plugin-unused-imports";

// A lightweight config with mostly inexpensive rules and without type-aware lintig. Ideal for everyday usage in IDE.

export default defineConfig([
  ...[
    "",
    "apps/backend/src/email/_styles/"
  ].map(path => join(process.cwd(), `${path}.gitignore`))
    .filter((path): path is string => existsSync(path))
    .map(path => includeIgnoreFile(path)),

  globalIgnores([
    "eslint.frontend.ts",
    "eslint.full.config.ts",
    "resources"
  ]),

  {
    files: ["**/*.jsx", "**/*.ts", "**/*.tsx", "**/*.cts", "**.*.mts"],

    languageOptions: {
      globals: {
        ...globals.browser
      },
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      // Type-aware linting is explicitely turned off - use the full linting config for the final lint.
      parserOptions: {}
    },

    settings: {
      react: {
        version: "detect"
      }
    },

    plugins: {
      js,
      "@stylistic": stylistic,
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": unusedImportsPlugin
    },

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended
    ],

    rules: {
      "@stylistic/linebreak-style": ["error", "unix"],
      "no-eval": ["error"],
      "no-warning-comments": "off",
      curly: ["warn", "multi-line"],
      "brace-style": ["warn", "1tbs", {allowSingleLine: false}],

      // Replaced by the @typescript-eslint rules.
      "no-unused-vars": "off",
      "no-empty-function": "off",

      "@stylistic/semi": ["error", "always"],
      "@stylistic/indent": ["warn", 2, {
        ignoredNodes: [
          // A workaround for decorators. Not ideal, though.
          "FunctionExpression > .params[decorators.length > 0]",
          "FunctionExpression > .params > :matches(Decorator, :not(:first-child))",
          "ClassBody.body > PropertyDefinition[decorators.length > 0] > .key"
        ]
      }],
      "@stylistic/array-bracket-spacing": ["warn", "never"],
      "@stylistic/object-curly-spacing": ["warn", "never"],
      "@stylistic/space-before-function-paren": ["warn", {
        anonymous: "always",
        named: "never",
        asyncArrow: "always"
      }],
      "@stylistic/brace-style": ["warn", "stroustrup"],
      // "@stylistic/nonblock-statement-body-position": ["warn", "below"],
      "@stylistic/comma-dangle": ["warn", "never"],
      "@stylistic/quotes": ["warn", "double", {
        allowTemplateLiterals: "always"
      }],
      "@stylistic/jsx-quotes": ["warn", "prefer-double"],
      "@stylistic/arrow-parens": ["warn", "as-needed"],
      "@stylistic/member-delimiter-style": ["error", {
        singleline: {
          delimiter: "comma"
        }
      }],
      "@stylistic/space-infix-ops": ["warn"],

      "unused-imports/no-unused-imports": "error",

      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": ["warn", {
        allow: ["private-constructors"]
      }],
      "@typescript-eslint/no-explicit-any": ["warn"]
    }
  },
  // include frontend-specific config (keeps frontend rules in a separate file)
  ...(frontendEslintConfig as any)
]);
