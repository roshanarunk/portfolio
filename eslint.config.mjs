import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Impeccable tooling: not our source, and gitignored.
    ".claude/**",
    ".github/skills/**",
    // Static assets served as-is. public/sf6 is SF6Assist's own source,
    // vendored verbatim so the demo runs the real code — linting it would
    // report on another project's style choices and invite editing a copy
    // that must stay in step with upstream.
    "public/**",
  ]),
]);

export default eslintConfig;
