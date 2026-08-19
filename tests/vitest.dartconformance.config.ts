/**
 * Vitest config for the CI `test-dart` conformance step.
 *
 * Isolated from the default suite for the same reason as syntax-app /
 * ts-engine: a ~60s singleFork run can starve Vitest's birpc reporter and
 * exit 1 with `Timeout calling "onTaskUpdate"` even when every assertion
 * passed (birpc's default RPC timeout is 60s).
 *
 *   npx vitest run --config tests/vitest.dartconformance.config.ts
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Keep wall-clock per invocation comfortably under birpc's 60s default.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    teardownTimeout: 60_000,
    root: "./tests",
    include: ["**/compiler-conformance.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    sequence: {
      concurrent: false,
    },
    pool: "forks",
    poolOptions: {
      forks: {
        // One file only; avoid singleFork reporter starvation on long suites.
        singleFork: false,
        maxForks: 1,
        minForks: 1,
      },
    },
  },
});
