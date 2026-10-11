import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config";

// A disposable static build keeps clock assertions independent of dev hot updates.
// No API, shared data, or replacement managed workflow is started.
const out = "../../generated-artifacts/discovery-browser/app";
export default defineConfig({
  ...browserConfig,
  testMatch: "discovery-clock.spec.ts",
  outputDir: "../../generated-artifacts/discovery-browser/results",
  use: { ...browserConfig.use, baseURL: "http://127.0.0.1:5183/" },
  webServer: {
    command: `pnpm exec vite build --outDir ${out} && pnpm exec vite preview --outDir ${out} --host 127.0.0.1 --strictPort`,
    env: { PORT: "5183", BASE_PATH: "/", NODE_ENV: "production" },
    url: "http://127.0.0.1:5183/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
