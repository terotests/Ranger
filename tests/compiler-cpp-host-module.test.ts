import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRanger } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/module_no_main.rgr";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// A Ranger MODULE -- no `main` -- compiled to C++ and included by a host shell
// that owns the window and the event loop. That is how an SDL2 desktop app is
// built, and it is a different compile from a whole program: nothing pulls in
// the headers a `main` drags along, so a prelude that leans on them breaks here
// and nowhere else.
describe("Ranger Compiler - C++ module included by a host", () => {
  const gppAvailable = has("g++ --version");
  const cppIt = gppAvailable ? it : it.skip;

  cppIt("compiles when a host supplies main and includes the module", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-host-module");
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const host = path.join(outDir, "host.cpp");
    fs.writeFileSync(
      host,
      [
        '#include "module_no_main.cpp"',
        "#include <cstdio>",
        "int main(int argc, char **argv) {",
        "  __g_argc = argc; __g_argv = argv;",
        "  Shared app;",
        "  app.tick();",
        '  printf("%s %d\\n", app.greeting().c_str(), app.frameCount());',
        "  return 0;",
        "}",
      ].join("\n")
    );

    const bin = path.join(outDir, "host");
    execSync(`g++ -std=c++17 "${host}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    const output = execSync(`"${bin}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
    });
    expect(output).toContain("hello from Ranger 1");
  });
});
