"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var eslint_plugin_react_1 = require("eslint-plugin-react");
// @ts-ignore
var eslint_plugin_react_hooks_1 = require("eslint-plugin-react-hooks");
var eslint_plugin_react_refresh_1 = require("eslint-plugin-react-refresh");
exports.default = [
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        plugins: {
            react: eslint_plugin_react_1.default,
            "react-hooks": eslint_plugin_react_hooks_1.default,
            "react-refresh": eslint_plugin_react_refresh_1.default
        },
        rules: {
            // React
            "react/display-name": "off",
            "react/jsx-no-target-blank": ["error", {
                    allowReferrer: true
                }],
            // Covered by TypeScript
            "react/prop-types": "off",
            "react/no-unknown-property": "off",
            // Enabled elsewhere in full config
            "react/no-direct-mutation-state": "off",
            "react/require-render-return": "off",
            "react/no-render-return-value": "off",
            // React Refresh
            "react-refresh/only-export-components": ["warn", {
                    allowConstantExport: true
                }],
            // Hooks
            "react-hooks/exhaustive-deps": "warn",
            // TODO: too many false positives
            "react-hooks/refs": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/static-components": "off",
            // TODO: false positives with window.location
            "react-hooks/immutability": "off"
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    }
];
