import { defineConfig } from "vitest/config";

/**
 * The ES conformance corpus on every compiled target.
 *
 * Out of the default run for the same reason as vitest.tsengine.config.ts, and
 * more so: this compiles a 45,000-line interpreter plus a 2,138-probe corpus
 * once per target, builds two native binaries, and then evaluates 2,138 pieces
 * of JavaScript in each. Budget tens of minutes.
 *
 *   npm run test:esconformance
 */
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 3600000,
    hookTimeout: 3600000,
    root: "./tests",
    include: ["**/es-conformance-targets.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    sequence: { concurrent: false },
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
