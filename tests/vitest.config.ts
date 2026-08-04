import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    root: "./tests",
    // syntax-app.test.ts and ts-engine-targets.test.ts are excluded for the
    // same reason as compiler-llvm: each shells out to compilers for a minute
    // or more, and a single file that long starves the reporter under
    // singleFork -- the run then stops with `Timeout calling "onTaskUpdate"`
    // and the files after it never run. They have their own scripts:
    // `npm run test:syntaxapp` and `npm run test:tsengine`.
    exclude: [
      "**/node_modules/**",
      "**/ranger-vscode-extension/**",
      "**/compiler-llvm.test.ts",
      "**/syntax-app.test.ts",
      "**/ts-engine-targets.test.ts",
    ],
    sequence: {
      concurrent: false, // Run tests sequentially
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Single process to avoid race conditions
      },
    },
  },
});
