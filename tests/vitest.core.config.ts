import { defineConfig } from "vitest/config";

/**
 * lib/core/ — the oracle suite plus the cross-target suite.
 *
 * Kept out of the default `npm test` run for the same reason as
 * vitest.tsengine.config.ts: core-targets.test.ts compiles the vector program
 * five times and then builds two native binaries, which is minutes of blocking
 * child processes and starves the reporter under singleFork.
 *
 *   npm run test:core
 */
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 900000,
    hookTimeout: 900000,
    root: "./tests",
    include: ["**/core-targets.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    sequence: { concurrent: false },
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
