"use strict";
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
var eslint_config_1 = require("./eslint.config");
var config_1 = require("eslint/config");
// A full eslint config with some hardcore rules. It's going to be expensive so lint only when needed (e.g., not in IDE).
// All errors from this lint should be fixed before commiting!
exports.default = (0, config_1.defineConfig)(__spreadArray(__spreadArray([], eslint_config_1.default, true), [
    {
        // This config will only apply to the following files.
        // All options should be deep-merged with the baseConfig.
        files: ['**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.cts', '**.*.mts'],
        languageOptions: {
            parserOptions: {
                projectService: 'true',
            },
        },
        rules: {
            // TypeScript
            '@typescript-eslint/unbound-method': ['error', {
                    ignoreStatic: true,
                }],
            '@typescript-eslint/no-misused-promises': ['error', {
                    checksVoidReturn: false,
                }],
            '@typescript-eslint/no-floating-promises': 'error',
            // React
            'react/no-direct-mutation-state': ['error'],
            'react/require-render-return': ['error'],
            'react/no-render-return-value': ['error'],
        },
    },
], false));
