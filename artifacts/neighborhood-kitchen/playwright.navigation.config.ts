import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config";

// Disposable production builds, not replacements for the managed workflows.
// Different origins also keep root and prefixed test storage entirely separate.
const targets = [
  { name: "root", port: 5181, base: "/" },
  { name: "artifact-base", port: 5182, base: "/navigation-regression/" },
];

export default defineConfig({
  ...browserConfig,
  testMatch: "navigation.spec.ts",
  outputDir: "../../generated-artifacts/navigation-browser/results",
  projects: targets.map(({ name, port, base }) => ({
    name,
    use: { baseURL: `http://127.0.0.1:${port}${base}` },
  })),
  webServer: targets.map(({ name, port, base }) => {
    const out = `../../generated-artifacts/navigation-browser/${name}`;
    return {
      command: `pnpm exec vite build --outDir ${out} && pnpm exec vite preview --outDir ${out} --host 127.0.0.1 --strictPort`,
      env: { PORT: String(port), BASE_PATH: base, NODE_ENV: "production" },
      url: `http://127.0.0.1:${port}${base}`,
      reuseExistingServer: false,
      timeout: 120_000,
    };
  }),
});
