"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("eslint/config");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var compat_1 = require("@eslint/compat");
var globals = require("globals");
var typescript_eslint_1 = require("typescript-eslint");
var js = require("@eslint/js");
var eslint_plugin_1 = require("@stylistic/eslint-plugin");
// import frontend-specific config so it can remain a separate file
var eslint_frontend_1 = require("@mtgit/frontend/eslint.frontend");
var unusedImportsPlugin = require("eslint-plugin-unused-imports");
// A lightweight config with mostly inexpensive rules and without type-aware lintig. Ideal for everyday usage in IDE.
exports.default = (0, config_1.defineConfig)(__spreadArray(__spreadArray(__spreadArray([], [
    "",
    "apps/backend/src/email/_styles/"
].map(function (path) { return (0, node_path_1.join)(process.cwd(), "".concat(path, ".gitignore")); })
    .filter(function (path) { return (0, node_fs_1.existsSync)(path); })
    .map(function (path) { return (0, compat_1.includeIgnoreFile)(path); }), true), [
    (0, config_1.globalIgnores)([
        "eslint.frontend.ts",
        "eslint.full.config.ts",
        "resources"
    ]),
    {
        files: ["**/*.jsx", "**/*.ts", "**/*.tsx", "**/*.cts", "**.*.mts"],
        languageOptions: {
            globals: __assign({}, globals.browser),
            parser: typescript_eslint_1.default.parser,
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
            js: js,
            "@stylistic": eslint_plugin_1.default,
            "@typescript-eslint": typescript_eslint_1.default.plugin,
            "unused-imports": unusedImportsPlugin
        },
        extends: [
            js.configs.recommended,
            typescript_eslint_1.default.configs.recommended
        ],
        rules: {
            "@stylistic/linebreak-style": ["error", "unix"],
            "no-eval": ["error"],
            "no-warning-comments": "off",
            curly: ["warn", "multi-line"],
            // "brace-style": ["warn", "1tbs", {allowSingleLine: false}],
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
    }
], false), eslint_frontend_1.default, true));
