import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      // Keep this broad: new runtime modules must affect the application-wide
      // coverage result without anyone maintaining a filename allowlist.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
      ],
      thresholds: {
        // Baseline for the whole application, including presentation-heavy pages.
        // The stricter per-file business-logic gate lives in vitest.core.config.ts.
        statements: 52,
        // V8 maps JSX branches slightly differently between supported Node
        // releases; leave a narrow portability margin around the measured baseline.
        branches: 37.5,
        functions: 39,
        lines: 52,
      },
    },
  },
});
