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
    //
    // es-conformance-targets.test.ts belongs on that list and was missing from
    // it. vitest.esconformance.config.ts already says the file is "out of the
    // default run" and gives it a 3,600,000ms timeout, but nothing here acted
    // on that: it compiles a 45,000-line interpreter to five targets, starved
    // the reporter exactly as the comment above predicts, and the other 82
    // files never ran. `npm test` reported "Test Files 1 failed (83)" and six
    // tests -- which reads as a suite with one failure rather than a suite
    // that stopped. Run it with `npm run test:esconformance`, where its own
    // config gives it the time it needs.
    exclude: [
      "**/node_modules/**",
      "**/ranger-vscode-extension/**",
      "**/compiler-llvm.test.ts",
      "**/syntax-app.test.ts",
      "**/ts-engine-targets.test.ts",
      "**/es-conformance-targets.test.ts",
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
