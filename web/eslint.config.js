import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import astroPlugin from "eslint-plugin-astro";
import prettierPlugin from "eslint-plugin-prettier";
import astroParser from "astro-eslint-parser";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      prettier: prettierPlugin,
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...prettierPlugin.configs.recommended.rules,
      ...tailwindcssPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prettier/prettier": "warn",
      "react/self-closing-comp": "warn",
    },
    settings: {
      react: { version: "detect" },
      tailwindcss: {
        // Optional: specify settings if needed, otherwise defaults are used.
        // callees: ["classnames", "clsx", "ctl"],
        // config: "tailwind.config.mjs", // Default is tailwind.config.js
      }
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
    plugins: {
      astro: astroPlugin,
      prettier: prettierPlugin,
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      ...astroPlugin.configs.recommended.rules,
      ...tailwindcssPlugin.configs.recommended.rules,
      "react/jsx-key": "off",
      "prettier/prettier": "warn",
    },
    settings: {
      tailwindcss: {
        // Optional: specify settings if needed, otherwise defaults are used.
      }
    }
  },
]; 