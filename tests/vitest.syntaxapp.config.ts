import { defineConfig } from "vitest/config";

/**
 * The syntax app matrix, on its own.
 *
 * tests/vitest.config.ts leaves syntax-app.test.ts out of the default run: it
 * shells out a few hundred times and takes about two minutes, and one file
 * that long starves the reporter under singleFork -- the run then ends with
 * `Timeout calling "onTaskUpdate"` and the files after it never run. This
 * config runs that one file and nothing else.
 *
 *   npm run test:syntaxapp
 *   npm run test:syntaxapp:update    # re-record the baseline and the report
 */
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 1800000,
    hookTimeout: 1800000,
    root: "./tests",
    include: ["**/syntax-app.test.ts"],
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
