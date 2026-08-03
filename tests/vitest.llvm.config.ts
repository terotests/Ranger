import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["**/compiler-llvm.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    testTimeout: 600000,
    hookTimeout: 600000,
  },
});
