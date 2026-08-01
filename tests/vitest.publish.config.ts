import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

/**
 * Test gate for `npm publish` (see the `prepublishOnly` script).
 *
 * The published package is the compiler: `dist/rgrc.js`, `dist/api.js` and the
 * language files next to them. This config runs the suites that exercise that
 * artifact -- parsing, type checking and code generation across every target
 * backend -- and skips the ones below.
 *
 * The skipped suites are not less important, they just do not gate publishing:
 * they drive the gallery and the game engine, and depend on assets and native
 * toolchains (SDL2, g++, Cannon, game fixtures) that ship with neither the repo
 * nor the npm package. Running them from `prepublishOnly` means a missing SDL2
 * header on the publisher's machine blocks a compiler release. They still run
 * in CI and in the full local suite via `npm test`.
 */
const gallerySuites = [
  "**/game-catalog.test.ts",
  "**/game-engine-features.test.ts",
  "**/game-engine-render.test.ts",
  "**/game-runner.test.ts",
  "**/game-scripting.test.ts",
  "**/physics-cannon.test.ts",
  "**/ts-to-ranger-host.test.ts",
  "**/ts-to-ranger-native.test.ts",
  "**/tsx-engine.test.ts",
];

const baseTest = baseConfig.test ?? {};

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseTest,
    exclude: [...(baseTest.exclude ?? []), ...gallerySuites],
  },
});
