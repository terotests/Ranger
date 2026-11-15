/**
 * A light index of a Ranger file and everything it imports.
 *
 * The in-memory analyzer sees one file. A Ranger program is usually several:
 * `Import "../src/UiCtl.rgr"` and `Import "pkg:evg/EVGElement.rgr"` (resolved
 * through the `ranger.json` next to the file or above it). This reads those
 * files from disk with a few regular expressions, which is enough to answer
 * "where is X defined" and to map a compiler message's path back to a file.
 */

import * as fs from "fs";
import * as path from "path";

export interface SymbolDef {
  name: string;
  kind: "class" | "method" | "static" | "field" | "component" | "factory";
  container: string; // the class, or "" at top level
  file: string;
  line: number; // 0-based
  column: number;
}

const IMPORT_RE = /^\s*Import\s+"([^"]+)"/gm;

/** The nearest ranger.json at or above `dir`, as [its directory, parsed]. */
function findManifest(dir: string): [string, any] | null {
  let d = dir;
  for (;;) {
    const p = path.join(d, "ranger.json");
    if (fs.existsSync(p)) {
      try {
        return [d, JSON.parse(fs.readFileSync(p, "utf8"))];
      } catch {
        return null;
      }
    }
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

/** `pkg:name/rest` to an absolute path, through the manifest's dependencies. */
export function resolvePkg(spec: string, fromDir: string): string | null {
  const m = /^pkg:([^/]+)\/(.*)$/.exec(spec);
  if (!m) return null;
  const found = findManifest(fromDir);
  if (!found) return null;
  const [dir, json] = found;
  const dep = json && json.dependencies && json.dependencies[m[1]];
  const depPath = typeof dep === "string" ? dep : dep && dep.path;
  if (!depPath) return null;
  return path.resolve(dir, depPath, m[2]);
}

export function resolveImport(spec: string, fromFile: string): string | null {
  const dir = path.dirname(fromFile);
  if (spec.startsWith("pkg:")) return resolvePkg(spec, dir);
  return path.resolve(dir, spec);
}

/** The file and every file it imports, transitively, that exists on disk. */
export function importClosure(file: string, text?: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const visit = (f: string, src?: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    let body = src;
    if (body === undefined) {
      try {
        body = fs.readFileSync(f, "utf8");
      } catch {
        return;
      }
    }
    order.push(f);
    for (const m of body.matchAll(IMPORT_RE)) {
      const r = resolveImport(m[1], f);
      if (r) visit(r);
    }
  };
  visit(path.resolve(file), text);
  return order;
}

/** Definitions in one file's text. */
export function symbolsOf(file: string, text: string): SymbolDef[] {
  const out: SymbolDef[] = [];
  const lines = text.split(/\r?\n/);
  let container = "";
  let depth = 0;
  let classDepth = -1;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/;.*$/, (c) => (/"/.test(c) ? c : ""));
    let m: RegExpExecArray | null;
    if ((m = /^(\s*)(?:class|systemclass|Enum)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line))) {
      container = m[2];
      classDepth = depth;
      out.push({ name: m[2], kind: "class", container: "", file, line: i, column: m[1].length });
    } else if ((m = /^(\s*)(fn|sfn)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line))) {
      out.push({
        name: m[3],
        kind: m[2] === "sfn" ? "static" : "method",
        container,
        file,
        line: i,
        column: m[1].length + m[2].length + 1,
      });
    } else if ((m = /^(\s*)def\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)) && depth === classDepth + 1 && container) {
      out.push({ name: m[2], kind: "field", container, file, line: i, column: m[1].length + 4 });
    } else if ((m = /^(\s*)treefactory\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line))) {
      out.push({ name: m[2], kind: "factory", container, file, line: i, column: m[1].length + 12 });
    }
    // `component <Tag> <fn>` inside a treefactory: the tag goes to the function.
    for (const c of line.matchAll(/component\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_.]*)/g)) {
      out.push({ name: c[1], kind: "component", container: c[2], file, line: i, column: (c.index || 0) + 10 });
    }
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth <= classDepth) {
          container = "";
          classDepth = -1;
        }
      }
    }
  }
  return out;
}

export class ProjectIndex {
  readonly files: string[];
  readonly symbols: SymbolDef[] = [];

  constructor(file: string, text?: string) {
    this.files = importClosure(file, text);
    for (const f of this.files) {
      const body = f === path.resolve(file) && text !== undefined ? text : fs.readFileSync(f, "utf8");
      this.symbols.push(...symbolsOf(f, body));
    }
  }

  /**
   * Where `word` is defined. `qualifier` is what stood before a dot
   * (`UiTree.node`, `this.walk`, `app.events`): a class name narrows the
   * search to that class, anything else is ignored. A class beats a member
   * of the same name; the current file beats an imported one.
   */
  definition(word: string, qualifier: string, currentFile: string): SymbolDef[] {
    const cur = path.resolve(currentFile);
    let hits = this.symbols.filter((s) => s.name === word);
    if (qualifier && this.symbols.some((s) => s.kind === "class" && s.name === qualifier)) {
      const inClass = hits.filter((s) => s.container === qualifier);
      if (inClass.length) hits = inClass;
    }
    const classes = hits.filter((s) => s.kind === "class");
    if (classes.length && !qualifier) hits = classes;
    // A component tag points at its function; follow it one step.
    const comps = hits.filter((s) => s.kind === "component");
    if (comps.length === hits.length && comps.length) {
      const fnName = comps[0].container.split(".").pop() || "";
      const fns = this.symbols.filter((s) => s.name === fnName && (s.kind === "method" || s.kind === "static"));
      if (fns.length) hits = fns;
    }
    return hits.sort((a, b) => Number(b.file === cur) - Number(a.file === cur));
  }

  /**
   * The file a compiler message names. Ranger prints an imported file by the
   * path it was imported with (`../src/UiCtl.rgr`, `pkg:evg/EVGElement.rgr`,
   * or a bare `EVGUnit.rgr` from inside the library), so match against the
   * files this program actually reads.
   */
  fileFor(reported: string, rootFile: string): string | null {
    if (path.isAbsolute(reported) && fs.existsSync(reported)) return reported;
    if (reported.startsWith("pkg:")) {
      const r = resolvePkg(reported, path.dirname(rootFile));
      if (r && fs.existsSync(r)) return r;
    }
    const direct = path.resolve(path.dirname(rootFile), reported);
    if (this.files.includes(direct)) return direct;
    const tail = reported.replace(/^(\.\.?\/)+/, "").replace(/^pkg:[^/]+\//, "");
    const hit = this.files.find((f) => f.endsWith(path.sep + tail) || f === tail);
    return hit || null;
  }
}

/** The identifier under the cursor and what stood before a dot in front of it. */
export function wordAt(line: string, ch: number): { word: string; qualifier: string } | null {
  const isId = (c: string) => /[A-Za-z0-9_]/.test(c);
  let a = ch;
  let b = ch;
  while (a > 0 && isId(line[a - 1])) a--;
  while (b < line.length && isId(line[b])) b++;
  if (a === b) return null;
  const word = line.slice(a, b);
  let qualifier = "";
  if (a > 0 && line[a - 1] === ".") {
    let q = a - 1;
    while (q > 0 && isId(line[q - 1])) q--;
    qualifier = line.slice(q, a - 1);
  }
  return { word, qualifier };
}
