import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts"],
    // DuckDB holds an in-process instance; keep the suite in one worker so the
    // connection pools of different tests cannot overlap in confusing ways.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
