import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    rules: {
      // React
      "react-refresh/only-export-components": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": 0,
      "react/display-name": 0,
      // Command
      "no-console": 1,
      "no-lonely-if": 1,
      "no-unused-vars": 1,
      "no-trailing-spaces": 1,
      "no-multi-spaces": 1,
      "no-multiple-empty-lines": 1,
      "space-before-blocks": ["error", "always"],
      "object-curly-spacing": [1, "always"],
      "indent": ["warn", 2],
      "semi": [1, "always"],
      "quotes": ["error", "double"],
      "array-bracket-spacing": 1,
      "linebreak-style": 0,
      "no-unexpected-multiline": "warn",
      "keyword-spacing": 1,
      "comma-dangle": 1,
      "comma-spacing": 1,
      "arrow-spacing": 1
    }
  }
]);
