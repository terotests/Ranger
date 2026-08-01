/**
 * In-process Ranger compilation against an in-memory filesystem.
 *
 * The environment holds the compiler language file and every library, so an
 * example only needs its `Import` line. Nothing is written to disk: the
 * generated code is read from the result filesystem.
 */
import fs from "node:fs";
import path from "node:path";
import { loadCompilerApi } from "./compiler.mjs";
import { ROOT } from "./paths.mjs";

export const TARGETS = [
  { id: "es6", title: "JavaScript", ext: "js", highlight: "js" },
  { id: "ts", title: "TypeScript", ext: "ts", highlight: "ts", compileAs: "es6", flags: { typescript: true } },
  { id: "go", title: "Go", ext: "go", highlight: "go" },
  { id: "rust", title: "Rust", ext: "rs", highlight: "rust" },
  { id: "python", title: "Python", ext: "py", highlight: "python" },
  { id: "java7", title: "Java", ext: "java", highlight: "java" },
  { id: "kotlin", title: "Kotlin", ext: "kt", highlight: "kotlin" },
  { id: "swift6", title: "Swift", ext: "swift", highlight: "swift" },
  { id: "csharp", title: "C#", ext: "cs", highlight: "csharp" },
  { id: "cpp", title: "C++", ext: "cpp", highlight: "cpp" },
  { id: "php", title: "PHP", ext: "php", highlight: "php" },
  { id: "scala", title: "Scala", ext: "scala", highlight: "scala" },
];

export const TARGET_BY_ID = new Map(TARGETS.map((t) => [t.id, t]));

const SOURCE_NAME = "example.rgr";

/**
 * The compiler writes a progress report to the console. The tools write their
 * own report, so the compiler output is held back for the time of the run.
 */
function silenceConsole() {
  const keep = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  const drop = () => {};
  console.log = drop;
  console.info = drop;
  console.warn = drop;
  console.error = drop;
  return () => {
    console.log = keep.log;
    console.info = keep.info;
    console.warn = keep.warn;
    console.error = keep.error;
  };
}

function vfsFile(name, data) {
  return { name, data, is_folder: false, base64bin: false };
}

function libraryFiles() {
  const libDir = path.join(ROOT, "lib");
  const files = [];
  const stack = [{ dir: libDir, prefix: "" }];
  while (stack.length > 0) {
    const { dir, prefix } = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        stack.push({ dir: path.join(dir, entry.name), prefix: `${prefix}${entry.name}/` });
      } else if (entry.name.endsWith(".rgr")) {
        files.push(
          vfsFile(`${prefix}${entry.name}`, fs.readFileSync(path.join(dir, entry.name), "utf8")),
        );
      }
    }
  }
  return files;
}

let baseEnv = null;

/** The environment dictionary, built once and cloned per compilation. */
export function baseEnvironment() {
  if (baseEnv) {
    return baseEnv;
  }
  baseEnv = {
    use_real: false,
    envVars: { RANGER_LIB: "/;/lib/" },
    commandLine: { flags: {}, params: {}, values: [] },
    filesystem: {
      name: "",
      data: "",
      is_folder: true,
      base64bin: false,
      folders: [
        {
          name: "lib",
          data: "",
          is_folder: true,
          base64bin: false,
          folders: [],
          files: libraryFiles(),
        },
      ],
      files: [
        vfsFile("Lang.rgr", fs.readFileSync(path.join(ROOT, "compiler", "Lang.rgr"), "utf8")),
        vfsFile("stdops.rgr", fs.readFileSync(path.join(ROOT, "lib", "stdops.rgr"), "utf8")),
      ],
    },
  };
  return baseEnv;
}

function readOutput(results, outputName) {
  const fileSystem = results.fileSystem;
  if (!fileSystem || !fileSystem.files || fileSystem.files.length === 0) {
    return "";
  }
  const exact = fileSystem.files.find((f) => f.name === outputName);
  if (exact && String(exact.getCode()).length > 0) {
    return String(exact.getCode());
  }
  const parts = [];
  for (const file of fileSystem.files) {
    const code = String(file.getCode());
    if (code.length > 0) {
      parts.push(code);
    }
  }
  return parts.join("\n\n");
}

function formatErrors(results) {
  const ctx = results.ctx;
  if (!ctx || !ctx.compilerErrors || ctx.compilerErrors.length === 0) {
    return results.errorMessage || "Compilation failed";
  }
  return ctx.compilerErrors
    .map((e) => {
      const line = e.node && e.node.getLine ? e.node.getLine() + 1 : 0;
      return `${line}: ${e.description}`;
    })
    .join("\n");
}

/**
 * Compile one Ranger source string for one target.
 * @returns {{ok: boolean, output: string, errors: string, ctx: object|null, ms: number}}
 */
export async function compileSource(source, targetId, { keepContext = false } = {}) {
  const { VirtualCompiler, InputEnv, CmdParams } = loadCompilerApi();
  const target = TARGET_BY_ID.get(targetId) || { id: targetId, ext: "txt", flags: {} };
  const outputName = `example.${target.ext}`;

  const dict = structuredClone(baseEnvironment());
  dict.filesystem.files.push(vfsFile(SOURCE_NAME, source));

  const env = await InputEnv.fromDictionary(dict);
  const params = new CmdParams();
  params.values = [SOURCE_NAME];
  params.params = { l: target.compileAs || target.id, o: outputName };
  params.flags = { "no-color": true, ...(target.flags || {}) };
  env.commandLine = params;
  env.use_real = false;

  const started = Date.now();
  let results;
  const restore = silenceConsole();
  try {
    results = await new VirtualCompiler().run(env);
  } catch (err) {
    return { ok: false, output: "", errors: String(err && err.message ? err.message : err), ctx: null, ms: Date.now() - started };
  } finally {
    restore();
  }
  const ms = Date.now() - started;

  if (results.hasErrors) {
    return { ok: false, output: "", errors: formatErrors(results), ctx: keepContext ? results.ctx : null, ms };
  }
  return {
    ok: true,
    output: readOutput(results, outputName),
    errors: "",
    ctx: keepContext ? results.ctx : null,
    ms,
  };
}
