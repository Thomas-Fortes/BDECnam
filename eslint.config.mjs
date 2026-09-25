import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // L'appli fait volontairement du fetch Supabase côté client dans des
      // hooks (useEffect -> fonction async -> setState), sans lib de cache
      // (SWR/React Query) : hors scope pour un WEI. Pattern standard et sûr
      // ici (pas de fetch pendant le rendu, pas de boucle de re-render).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
