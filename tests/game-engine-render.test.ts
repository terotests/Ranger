import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const FIXTURES_DIR = "tests/fixtures";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Rendering PoC tests for the SDL game-engine sample.
 *
 * 1. The portable render layer (PongRenderer -> SoftCanvas RGBA buffer) is
 *    verified headlessly on Node: it must produce a deterministic frame.
 * 2. The native SDL2 backend (Ranger -> C++ -> SDL2) is built and run headless
 *    with the dummy video driver, proving the buffer -> SDL present loop. This
 *    step is skipped automatically when g++ / SDL2 are unavailable.
 */
describe("Game engine - SDL Pong rendering PoC", () => {
  it("renders a deterministic RGBA frame into the software buffer (Node)", () => {
    const { compile, run } = compileAndRun(
      `${FIXTURES_DIR}/pong_render_probe.rgr`
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    // 60x24 cells * 12px scale
    expect(out).toContain("dims=720x288");
    // ball centre pixel is the bright-yellow ball colour
    expect(out).toContain("ballpx=245,245,130");
    // background pixel is the clear colour
    expect(out).toContain("bgpx=12,16,32");
    // a meaningful number of foreground pixels were painted
    const lit = parseInt((out.match(/lit=(\d+)/) || [])[1] || "0", 10);
    expect(lit).toBeGreaterThan(500);
  });

  const sdlAvailable = has("pkg-config --exists sdl2");
  const gppAvailable = has("g++ --version");
  const nativeIt = sdlAvailable && gppAvailable ? it : it.skip;

  nativeIt(
    "builds the native SDL2 binary and renders frames headlessly",
    () => {
      const outDir = path.join(ROOT_DIR, "tests", ".output-sdl");
      fs.mkdirSync(outDir, { recursive: true });

      // Ranger -> C++
      const compile = compileRanger(
        "gallery/game_engine/pong_sdl.rgr",
        "cpp",
        outDir
      );
      expect(
        compile.success,
        `C++ compile failed: ${compile.error || compile.output}`
      ).toBe(true);

      const cpp = path.join(outDir, "pong_sdl.cpp");
      expect(fs.existsSync(cpp)).toBe(true);

      // the generated file includes "variant.hpp"; provide it
      fs.copyFileSync(
        path.join(ROOT_DIR, "gallery", "invaders", "variant.hpp"),
        path.join(outDir, "variant.hpp")
      );

      // C++ -> native binary (link SDL2 + OpenGL). gfx_sdl.rgr's GPU sprite
      // path references GL symbols even when the software present is used at
      // runtime, so mirror build-game-sdl.sh's GL link flags per platform.
      const bin = path.join(outDir, "pong_sdl");
      const cflags = execSync("pkg-config --cflags --libs sdl2", {
        encoding: "utf-8",
      }).trim();
      let glFlags = "";
      if (process.platform === "darwin") {
        glFlags = "-framework OpenGL";
      } else if (process.arch === "arm64" || process.arch === "arm") {
        glFlags = "-lGLESv2";
      } else {
        glFlags = "-lGL";
      }
      execSync(`g++ -std=c++17 "${cpp}" -o "${bin}" ${cflags} ${glFlags}`, {
        cwd: outDir,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60000,
      });
      expect(fs.existsSync(bin)).toBe(true);

      // run headless: dummy video driver, render 30 frames then exit
      const output = execSync(`"${bin}" 30`, {
        cwd: outDir,
        env: { ...process.env, SDL_VIDEODRIVER: "dummy" },
        encoding: "utf-8",
        timeout: 20000,
      });

      expect(output).toContain("pong-sdl done");
      expect(output).toContain("frames=30");
    },
    90000
  );
});
