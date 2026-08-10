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
      reporter: ["text"],
      reportsDirectory: "coverage/core",
      // These directories are the durable boundary for application logic. New
      // files under them enter this gate automatically.
      include: [
        "src/services/**/*.ts",
        "src/store/**/*.ts",
        "src/hooks/**/*.{ts,tsx}",
        "src/utils/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        // Static MUI icon/color declarations are presentation, not logic.
        "src/services/habitatColors.ts",
      ],
      thresholds: {
        perFile: true,
        statements: 65,
        branches: 65,
        functions: 65,
        lines: 65,
      },
    },
  },
});
