import type { CompileEnvDict, CompilerResults, RangerAppWriterContext } from "./types.js";
import { loadCompileEnv, loadRangerCompiler } from "./loadCompiler.js";

/**
 * Targets exposed in the public playground UI. The browser bundle carries every
 * writer the `rgrc` CLI has; `llvm` and `swift3` are left out — LLVM has no
 * lowering for shapes and Swift 3 is superseded by the Swift 6 writer.
 */
export type TargetLanguage =
  | "es6"
  | "python"
  | "go"
  | "rust"
  | "cpp"
  | "csharp"
  | "java7"
  | "kotlin"
  | "swift6"
  | "dart"
  | "php"
  | "scala";

export interface CompileRequest {
  source: string;
  language: TargetLanguage;
  typescript?: boolean;
  filename?: string;
}

export interface CompileResponse {
  ok: boolean;
  output: string;
  errors: string;
  elapsedMs: number;
}

const OUTPUT_NAMES: Record<TargetLanguage, string> = {
  es6: "output.js",
  python: "output.py",
  go: "output.go",
  rust: "output.rs",
  cpp: "output.cpp",
  csharp: "output.cs",
  java7: "output.java",
  kotlin: "output.kt",
  swift6: "output.swift",
  dart: "output.dart",
  php: "output.php",
  scala: "output.scala",
};

/** Line-comment prefix used for the file banners of a multi-file target. */
const COMMENT_PREFIX: Record<TargetLanguage, string> = {
  es6: "//",
  python: "#",
  go: "//",
  rust: "//",
  cpp: "//",
  csharp: "//",
  java7: "//",
  kotlin: "//",
  swift6: "//",
  dart: "//",
  php: "//",
  scala: "//",
};

const SOURCE_NAME = "playground.rgr";

function formatErrors(ctx: RangerAppWriterContext): string {
  const lines: string[] = [];
  for (const e of ctx.compilerErrors) {
    const file = e.node.getFilename();
    const line = e.node.getLine() + 1;
    lines.push(`${file}:${line}: ${e.description}`);
    lines.push(e.node.getLineString(e.node.getLine()));
    lines.push(e.node.getColStartString() + "^");
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function withSource(base: CompileEnvDict, source: string): CompileEnvDict {
  const env = structuredClone(base);
  const files = env.filesystem.files;
  const existing = files.findIndex((f) => f.name === SOURCE_NAME);
  const entry = {
    name: SOURCE_NAME,
    data: source,
    is_folder: false,
    base64bin: false,
  };
  if (existing >= 0) {
    files[existing] = entry;
  } else {
    files.push(entry);
  }
  return env;
}

function readOutput(
  res: CompilerResults,
  outputName: string,
  comment: string,
): string {
  const fs = res.fileSystem;
  if (!fs?.files?.length) {
    return "";
  }
  // A target that writes one file per class (Java) leaves the requested output
  // file empty and puts the code beside it, so an empty exact match is not the
  // answer — fall through and show every file that has code in it.
  const written = fs.files
    .map((f) => ({
      name: f.path_name && f.path_name !== "." ? `${f.path_name}${f.name}` : f.name,
      code: f.getCode(),
    }))
    .filter((f) => f.code.length > 0);
  if (written.length === 1) {
    return written[0].code;
  }
  // The requested output file first, then the rest, each under its own banner.
  const main = written.filter((f) => f.name.endsWith(outputName));
  const rest = written.filter((f) => !f.name.endsWith(outputName));
  return [...main, ...rest]
    .map((f) => `${comment} ----- ${f.name} -----\n${f.code}`)
    .join("\n\n");
}

export async function compileRanger(req: CompileRequest): Promise<CompileResponse> {
  const t0 = performance.now();
  await loadRangerCompiler();
  const baseEnv = await loadCompileEnv();
  const env = await InputEnv.fromDictionary(withSource(baseEnv, req.source));

  const params = new CmdParams();
  params.values = [SOURCE_NAME];
  params.params = {
    l: req.language,
    o: OUTPUT_NAMES[req.language],
  };
  params.flags = {};
  if (req.typescript) {
    params.flags.typescript = true;
  }
  if (req.language === "es6") {
    params.flags["no-color"] = true;
  }
  env.commandLine = params;
  env.use_real = false;

  const compiler = new VirtualCompiler();
  const res = await compiler.run(env);
  const elapsedMs = Math.round(performance.now() - t0);

  if (res.hasErrors) {
    let errors = res.errorMessage || "Compilation failed";
    if (res.ctx && res.ctx.compilerErrors.length > 0) {
      errors = formatErrors(res.ctx);
    }
    return { ok: false, output: "", errors, elapsedMs };
  }

  const output = readOutput(
    res,
    OUTPUT_NAMES[req.language],
    COMMENT_PREFIX[req.language],
  );
  return { ok: true, output, errors: "", elapsedMs };
}
