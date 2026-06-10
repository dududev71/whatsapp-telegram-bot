import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["**/*.spec.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "e2e",
          include: ["**/*.e2e.ts"],
          globalSetup: ["./tests/e2e/core/preloader.ts"],
          environment: "node",
          // normalmente e2e precisa rodar em sequência
          sequence: {
            concurrent: false,
          },
        },
      },
    ],
  },
});
