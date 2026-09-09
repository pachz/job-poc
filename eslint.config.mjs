import convex from "@convex-dev/eslint-plugin";
import tseslint from "typescript-eslint";

const config = [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "convex/_generated/**",
      ".vercel/**",
      ".next/**",
    ],
  },
  ...tseslint.configs.recommended,
  ...convex.configs.recommended,
];

export default config;
