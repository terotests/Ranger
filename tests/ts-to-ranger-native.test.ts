import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const GENERATED = path.join(
  ROOT,
  "gallery/ts_to_ranger/generated/pong_generated.rgr"
);
const EMITTER_JS = path.join(
  ROOT,
  "gallery/ts_to_ranger/bin/ts_emitter_main.js"
);

describe("TS -> Ranger -> native (compiled game script)", () => {
  beforeAll(() => {
    // Architecture: TypeScript is read at emitter runtime; the produced Ranger
    // is compiled statically. Regenerate here so the test exercises the pipeline
    // end-to-end rather than a stale artifact. The .game.tsx file is not edited.
    if (fs.existsSync(EMITTER_JS)) {
      execSync(
        `node ${EMITTER_JS} -i gallery/game_engine/scripting/pong.game.tsx -o pong_generated.rgr`,
        { cwd: ROOT, stdio: "pipe" }
      );
    }
  }, 60000);

  it("emitter output is type-correct Ranger (no int/double coercion)", () => {
    const src = fs.readFileSync(GENERATED, "utf8");
    // entity reads are hoisted to typed locals (member access on (get) is illegal)
    expect(src).toContain('def in_ball:EntityPoseNative (unwrap (get s.entities "ball"))');
    // double fields get double literals
    expect(src).toContain("pose_ball.x = 240.0");
    // soundEvent inlined as GameEventNative (not this.soundEvent)
    expect(src).toContain('be11.kind = "playSound"');
    expect(src).not.toContain("this.soundEvent");
  });

  it("native Pong (generated .rgr) matches interpreter after 180 frames", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/pong_native_runner.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("ball=35,12");
    expect(out).toContain("score=1,0");
    expect(out).toContain("pong-native-runner done");
  });

  it("invaders.game.tsx emits and compiles to ES6 (nested types + set/push)", () => {
    const invadersRgr = path.join(
      ROOT,
      "gallery/ts_to_ranger/generated/invaders_generated.rgr"
    );
    expect(fs.existsSync(EMITTER_JS)).toBe(true);
    const emitOut = execSync(
      `node ${EMITTER_JS} -i gallery/game_engine/scripting/invaders.game.tsx -o invaders_generated.rgr`,
      { cwd: ROOT, encoding: "utf8" }
    );
    expect(emitOut).not.toContain("Parse error");
    const src = fs.readFileSync(invadersRgr, "utf8");
    expect(src).toContain("def alive:[int]");
    expect(src).toContain("set s.intArrays \"alive\"");
    expect(src).toContain("set alive alien 0");
    expect(src).toContain("def ALIEN_COUNT:int 15");

    const { success, error } = compileRanger(
      invadersRgr,
      "es6",
      path.join(ROOT, "tests/.output")
    );
    expect(success, `Compile failed: ${error}`).toBe(true);
  });

  it("native Invaders (generated .rgr) runs headless after 600 frames", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/invaders_native_runner.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("entities=17");
    expect(out).toContain("score=");
    expect(out).toContain("invaders-native-runner done");
  });

  it("pacman_native.game.tsx emits and compiles to ES6", () => {
    const pacmanRgr = path.join(
      ROOT,
      "gallery/ts_to_ranger/generated/pacman_native_generated.rgr"
    );
    expect(fs.existsSync(EMITTER_JS)).toBe(true);
    const emitOut = execSync(
      `node ${EMITTER_JS} -i gallery/game_engine/scripting/pacman_native.game.tsx -o pacman_native_generated.rgr`,
      { cwd: ROOT, encoding: "utf8" }
    );
    expect(emitOut).not.toContain("Parse error");
    const src = fs.readFileSync(pacmanRgr, "utf8");
    expect(src).toContain("fn update:NativeGameState");

    const { success, error } = compileRanger(
      pacmanRgr,
      "es6",
      path.join(ROOT, "tests/.output")
    );
    expect(success, `Compile failed: ${error}`).toBe(true);
  });

  it("ylos2 (P6 step 1) emits generated Ranger with update() — compile not yet ready", () => {
    const ylos2Rgr = path.join(
      ROOT,
      "gallery/ts_to_ranger/generated/ylos2_generated.rgr"
    );
    expect(fs.existsSync(EMITTER_JS)).toBe(true);
    execSync(
      `node ${EMITTER_JS} -i gallery/game_engine/games/ylos2/index.tsx -o ylos2_generated.rgr`,
      { cwd: ROOT, stdio: "pipe" }
    );
    const src = fs.readFileSync(ylos2Rgr, "utf8");
    expect(src).toContain("fn update:NativeGameState");
    expect(src).toContain("fn initState:NativeGameState");

    const { success, error, output } = compileRanger(
      ylos2Rgr,
      "es6",
      path.join(ROOT, "tests/.output")
    );
    expect(
      success,
      "ylos2 native compile should fail until P6 emitter gaps are closed"
    ).toBe(false);
    expect(output || error || "").toMatch(/Compilation FAILED/i);
  });

  function has(cmd: string): boolean {
    try {
      execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
      return true;
    } catch {
      return false;
    }
  }

  const gppAvailable = has("g++ --version");
  const sdlAvailable =
    gppAvailable &&
    (has("pkg-config --exists sdl2 2>/dev/null") ||
      fs.existsSync("/usr/include/SDL2/SDL.h"));
  const cppIt = sdlAvailable ? it : it.skip;

  cppIt("native Invaders builds and runs as C++ binary (g++)", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-native");
    fs.mkdirSync(outDir, { recursive: true });

    const compile = compileRanger(
      "gallery/game_engine/scripting/invaders_native_runner.rgr",
      "cpp",
      outDir
    );
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const cpp = path.join(outDir, "invaders_native_runner.cpp");
    fs.copyFileSync(
      path.join(ROOT, "gallery/invaders/variant.hpp"),
      path.join(outDir, "variant.hpp")
    );

    const bin = path.join(outDir, "invaders_native_runner");
    execSync(`g++ -std=c++17 -pthread "${cpp}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    const output = execSync(`"${bin}" 600`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 60000,
    });
    expect(output).toContain("entities=17");
    expect(output).toContain("invaders-native-runner done");
  });
});
