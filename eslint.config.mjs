import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(["**/dist/", "**/*.json"]),
    {
        extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

        plugins: {
            prettier,
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        rules: {
            eqeqeq: "error",

            "prettier/prettier": [
                "error",
                {
                    endOfLine: "auto",
                },
            ],

            "no-console": "off",

            "no-plusplus": [
                "error",
                {
                    allowForLoopAfterthoughts: true,
                },
            ],

            "no-unused-expressions": [
                "error",
                {
                    allowShortCircuit: true,
                },
            ],

            "spaced-comment": [
                "error",
                "always",
                {
                    markers: ["/"],
                },
            ],

            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/ban-ts-comment": "error",
            "@typescript-eslint/ban-types": "off",
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/prefer-namespace-keyword": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-explicit-any": "error",

            "@typescript-eslint/no-namespace": [
                "error",
                {
                    allowDeclarations: true,
                },
            ],

            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unsafe-declaration-merging": "off",
            "@typescript-eslint/no-unused-vars": "off",

            "@typescript-eslint/array-type": [
                "error",
                {
                    default: "array",
                },
            ],
        },
    },
]);
