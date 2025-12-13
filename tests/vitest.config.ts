import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    root: "./tests",
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
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
