import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "@playwright/test";

const mobileWidths = [320, 360, 390, 430];
const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: "line",
  outputDir: resolve(repositoryRoot, "test-results"),
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    colorScheme: "light",
    locale: "ko-KR",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: mobileWidths.map((width) => ({
    name: `mobile-${width}`,
    use: { viewport: { width, height: 900 } },
  })),
  webServer: {
    command: "npm run preview -- --port 4173",
    cwd: repositoryRoot,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
