import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    root: "./tests",
    // syntax-app.test.ts is excluded for the same reason as compiler-llvm:
    // it shells out a few hundred times and takes about two minutes, and a
    // single file that long starves the reporter under singleFork -- the run
    // then stops with `Timeout calling "onTaskUpdate"` and the files after it
    // never run. It has its own script: `npm run test:syntaxapp`.
    exclude: [
      "**/node_modules/**",
      "**/ranger-vscode-extension/**",
      "**/compiler-llvm.test.ts",
      "**/syntax-app.test.ts",
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
