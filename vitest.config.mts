import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // tests share one database, so they must not run concurrently
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 20000,
  },
});