import { defineConfig } from "vitest/config";

/**
 * The TypeScript engine compiled to every non-C++/Rust target, on its own.
 *
 * tests/vitest.config.ts leaves ts-engine-targets.test.ts out of the default
 * run for the same reason as syntax-app.test.ts: it compiles a 24k-line
 * program five times and then builds and runs three of the results, which is
 * about a minute of blocking child processes. A file that long starves the
 * reporter under singleFork -- the run then ends with
 * `Timeout calling "onTaskUpdate"` and the files after it never run.
 *
 *   npm run test:tsengine
 */
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 1800000,
    hookTimeout: 1800000,
    root: "./tests",
    include: ["**/ts-engine-targets.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    sequence: {
      concurrent: false,
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
