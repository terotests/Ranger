import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRun } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const GENERATED = path.join(
  ROOT,
  "gallery/ts_to_ranger/generated/spawner_generated.rgr"
);
const EMITTER_JS = path.join(
  ROOT,
  "gallery/ts_to_ranger/bin/ts_emitter_main.js"
);

// Parse "key=value" lines from a runner's stdout into a map.
function parseKv(out: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of out.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) {
      map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return map;
}

describe("Host bridge: resources + events (both paths)", () => {
  beforeAll(() => {
    // Regenerate the static Ranger from the .tsx so the test exercises the
    // emitter end-to-end. The .game.tsx source is never edited.
    if (fs.existsSync(EMITTER_JS)) {
      execSync(
        `node ${EMITTER_JS} -i gallery/game_engine/scripting/spawner.game.tsx -o spawner_generated.rgr`,
        { cwd: ROOT, stdio: "pipe" }
      );
    }
  }, 60000);

  it("emitter produces resources(), events[] and numbers-map routing", () => {
    const src = fs.readFileSync(GENERATED, "utf8");
    // resources() emitted as a typed resource list
    expect(src).toContain("fn resources:[ResourceDefNative] ()");
    expect(src).toContain('r0.kind = "image"');
    // custom scalar state field routed to the generic numbers map (double)
    expect(src).toContain('set s.numbers "t" 0.0');
    expect(src).toContain('(unwrap (get s.numbers "t"))');
    // transient events built into a typed list
    expect(src).toContain("def patch_events:[GameEventNative]");
    expect(src).toContain('patch_ev0.kind = "tick"');
    expect(src).toContain("patch.events = patch_events");
  });

  it("native (compiled) path registers resources and drains events", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/spawner_native_runner.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const kv = parseKv(run?.output || "");
    expect(kv["images"]).toBe("1");
    expect(kv["sounds"]).toBe("1");
    expect(kv["sprites"]).toBe("1");
    expect(kv["hasImage_bg"]).toBe("true");
    expect(kv["events"]).toBe("60");
    expect(kv["soundPlays"]).toBe("30");
    expect(kv["dotX"]).toBe("80");
  });

  it("interpreter (TS runtime) path matches the native path exactly", () => {
    const native = compileAndRun(
      "gallery/game_engine/scripting/spawner_native_runner.rgr"
    );
    const interp = compileAndRun(
      "gallery/game_engine/scripting/spawner_runner_demo.rgr"
    );
    expect(native.run?.success, native.run?.error).toBe(true);
    expect(interp.run?.success, interp.run?.error).toBe(true);

    const n = parseKv(native.run?.output || "");
    const t = parseKv(interp.run?.output || "");
    // Same resource + event contract regardless of execution path.
    for (const key of [
      "images",
      "sounds",
      "sprites",
      "hasImage_bg",
      "hasSound_blip",
      "events",
      "soundPlays",
      "dotX",
    ]) {
      expect(t[key], `key ${key} differs between paths`).toBe(n[key]);
    }
  });
});
