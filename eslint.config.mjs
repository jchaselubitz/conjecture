import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
// import nextConfig from 'eslint-config-next';
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import simpleSort from "eslint-plugin-simple-import-sort";
import prettierPlugin from "eslint-plugin-prettier";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
    plugins: {
      // react: reactPlugin,
      // 'react-hooks': reactHooksPlugin,
      "simple-import-sort": simpleSort,
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "prettier/prettier": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",
      // 'react/prop-types': 'off',
      "react/display-name": "off",
      "react/no-deprecated": "warn",
      "eol-last": "error",
      "no-multiple-empty-lines": "error",
      radix: "error",
      eqeqeq: ["error"],
      "no-undef": 0,
      "no-unused-vars": 1,
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [["^\\u0000", "^@?\\w", "^[^.]"]],
        },
      ],
      "no-console": "error",
    },
  },
  ...compat.config({
    extends: ["next"],
  }),
];
