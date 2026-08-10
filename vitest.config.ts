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
      include: [
        "src/services/**/*.ts",
        "src/store/**/*.ts",
        "src/utils/{data-transfer,feedback,search-text}.ts",
        "src/hooks/**/*.ts",
        "src/pages/MatchMaker/{group-helpers,useAutoGroups}.{ts,tsx}",
        "src/router/{AppRouter,DocumentTitle}.tsx",
        "src/components/{AppErrorBoundary,DeferredMount}.tsx",
        "src/components/layout-settings-menu/{LayoutDataTransferDialog,LayoutSettingsMenu}.tsx",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/services/habitatColors.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
