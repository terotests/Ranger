// The LLVM/WAT suite is excluded from the default run for the same reason as
// syntax-app and ts-engine-targets (see tests/vitest.config.ts): it shells out
// to clang and wat2wasm, and a single long file starves the reporter under
// singleFork. It has its own config so `npm run test:llvm` can reach it --
// pointed at the main config it matched the exclusion and found no tests.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 600000,
    hookTimeout: 600000,
    root: "./tests",
    include: ["**/compiler-llvm.test.ts"],
    exclude: ["**/node_modules/**", "**/ranger-vscode-extension/**"],
    sequence: { concurrent: false },
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
