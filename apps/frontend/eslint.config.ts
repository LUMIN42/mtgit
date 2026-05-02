// @ts-ignore
import react from "eslint-plugin-react";
// @ts-ignore
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            // React
            "react/display-name": "off",

            "react/jsx-no-target-blank": ["error", {
                allowReferrer: true,
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
                allowConstantExport: true,
            }],

            // Hooks
            "react-hooks/exhaustive-deps": "warn",

            // TODO: too many false positives
            "react-hooks/refs": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/static-components": "off",

            // TODO: false positives with window.location
            "react-hooks/immutability": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];