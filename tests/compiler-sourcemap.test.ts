import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-sourcemap");
const FIXTURE = "tests/fixtures/sourcemap_smoke.rgr";

const B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVLQ(str: string, pos: number): [number, number] {
  let shift = 0;
  let value = 0;
  let idx = pos;
  while (true) {
    const c = B64.indexOf(str[idx++]);
    const cont = (c & 32) !== 0;
    value += (c & 31) << shift;
    shift += 5;
    if (!cont) break;
  }
  const sign = value & 1;
  value = Math.floor(value / 2);
  return [sign ? -value : value, idx];
}

function decodeMappings(
  mappings: string,
  sources: string[],
  names: string[]
) {
  let genLine = 0;
  let genCol = 0;
  let src = 0;
  let origLine = 0;
  let origCol = 0;
  let name = 0;
  const out: Array<{
    genLine: number;
    genCol: number;
    source?: string;
    origLine?: number;
    origCol?: number;
    name?: string;
  }> = [];

  for (const line of mappings.split(";")) {
    if (line.length) {
      for (const seg of line.split(",")) {
        let p = 0;
        let d: number;
        [d, p] = decodeVLQ(seg, p);
        genCol += d;
        let source: string | undefined;
        let oLine: number | undefined;
        let oCol: number | undefined;
        let n: string | undefined;
        if (p < seg.length) {
          [d, p] = decodeVLQ(seg, p);
          src += d;
          source = sources[src];
          if (p < seg.length) {
            [d, p] = decodeVLQ(seg, p);
            origLine += d;
            oLine = origLine + 1;
            if (p < seg.length) {
              [d, p] = decodeVLQ(seg, p);
              origCol += d;
              oCol = origCol;
              if (p < seg.length) {
                [d, p] = decodeVLQ(seg, p);
                name += d;
                n = names[name];
              }
            }
          }
        }
        out.push({
          genLine: genLine + 1,
          genCol,
          source,
          origLine: oLine,
          origCol: oCol,
          name: n,
        });
      }
    }
    genLine++;
    genCol = 0;
  }
  return out;
}

describe("Ranger Compiler - Source Maps", () => {
  it("emits .map with sourcesContent, mappings, and names when -sourcemap is set", () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const cmd = `node "${path.join(ROOT_DIR, "bin", "output.js")}" -es6 -nodecli -sourcemap "${FIXTURE}" -d="tests/.output-sourcemap" -o="sourcemap_smoke.js"`;
    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr",
      },
      encoding: "utf-8",
    });

    expect(output).not.toContain("Compilation FAILED");

    const jsPath = path.join(OUTPUT_DIR, "sourcemap_smoke.js");
    const mapPath = path.join(OUTPUT_DIR, "sourcemap_smoke.js.map");
    expect(fs.existsSync(jsPath)).toBe(true);
    expect(fs.existsSync(mapPath)).toBe(true);

    const js = fs.readFileSync(jsPath, "utf-8");
    expect(js).toContain("//# sourceMappingURL=sourcemap_smoke.js.map");

    const map = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
    expect(map.version).toBe(3);
    expect(map.file).toBe("sourcemap_smoke.js");
    expect(Array.isArray(map.sources)).toBe(true);
    expect(map.sources.length).toBeGreaterThan(0);
    expect(
      map.sources.some((s: string) => s.includes("sourcemap_smoke.rgr"))
    ).toBe(true);
    expect(Array.isArray(map.sourcesContent)).toBe(true);
    expect(
      map.sourcesContent.some(
        (c: string) => c && c.includes("SourceMapSmoke")
      )
    ).toBe(true);
    expect(typeof map.mappings).toBe("string");
    expect(map.mappings.length).toBeGreaterThan(0);
    expect(Array.isArray(map.names)).toBe(true);

    const decoded = decodeMappings(map.mappings, map.sources, map.names);
    const sourceFile = map.sources.find((s: string) =>
      s.includes("sourcemap_smoke.rgr")
    );
    const sourced = decoded.filter((m) => m.source === sourceFile);
    expect(sourced.length).toBeGreaterThan(10);

    const bodyLines = sourced.filter((m) => (m.origLine ?? 0) >= 5);
    expect(
      bodyLines.length,
      `expected mappings on main-body lines, got ${bodyLines.length} total sourced=${sourced.length}`
    ).toBeGreaterThan(0);
  });
});
