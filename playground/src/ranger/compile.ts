import type { CompileEnvDict, CompilerResults, RangerAppWriterContext } from "./types.js";
import { loadCompileEnv, loadRangerCompiler } from "./loadCompiler.js";

/** Targets exposed in the public playground UI */
export type TargetLanguage = "es6" | "kotlin" | "swift6";

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
  kotlin: "output.kt",
  swift6: "output.swift",
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

function readOutput(res: CompilerResults, outputName: string): string {
  const fs = res.fileSystem;
  if (!fs?.files?.length) {
    return "";
  }
  const exact = fs.files.find((f) => f.name === outputName);
  if (exact) {
    return exact.getCode();
  }
  const parts: string[] = [];
  for (const f of fs.files) {
    const code = f.getCode();
    if (code.length > 0) {
      parts.push(
        `// ----- ${f.path_name}${f.name} -----\n${code}`,
      );
    }
  }
  return parts.join("\n\n");
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

  const output = readOutput(res, OUTPUT_NAMES[req.language]);
  return { ok: true, output, errors: "", elapsedMs };
}
