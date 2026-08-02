#!/usr/bin/env node
/**
 * Stage A — build the operator model.
 *
 * A1  The Ranger parser reads every source in docs/sources.json.
 * A2  One probe program per source is compiled. The writer context then tells
 *     which operators the compiler registers, which is more than the parser
 *     finds: a system class method is also usable as an operator.
 * A3  The two readers are joined and the model is written to
 *     docs/site/src/data/operators.json.
 */
import fs from "node:fs";
import path from "node:path";
import { parseOperatorSource, findOperatorFiles } from "./lib/parse.mjs";
import { compileSource, TARGETS } from "./lib/compile.mjs";
import { categoryOf, definitionKey, shortSignature, targetSupport, typeString } from "./lib/model.mjs";
import { operatorAnchor, operatorId, slugType } from "./lib/opid.mjs";
import { DATA, DOCS, ROOT, readJson, writeJson } from "./lib/paths.mjs";

const TARGET_IDS = TARGETS.map((t) => t.id);

/**
 * The collection operators that the body of a macro calls.
 *
 * A `defn` macro has no type annotation, so two macros can hold the same name
 * and the same parameter count. The body is the only thing that separates
 * them: a body that calls `keys` and `get` reads a hash, and a body that calls
 * `at` and `size` reads an array. This is a report of the body, not a rule of
 * the compiler.
 */
const ACCESSORS = ["keys", "get", "at", "size", "itemAt", "array_length", "push", "unwrap"];

function collectionAccessors(body) {
  const text = String(body || "");
  return ACCESSORS.filter((name) => new RegExp(`\\(\\s*${name}\\b`).test(text));
}

/**
 * What the body of the macro reads, in one word.
 *
 * `keys` and `get` read a hash map. `size` and `at` read an array. The word
 * goes into the heading, because the parameters of a `defn` carry no type and
 * two macros of one name are otherwise identical on the page.
 */
function readsKind(accessors) {
  if (accessors.includes("keys")) {
    return "a hash map";
  }
  if (accessors.includes("at") || accessors.includes("itemAt") || accessors.includes("size")) {
    return "an array";
  }
  return "";
}

function probeProgram(source) {
  const imports = source.import ? `Import "${source.import}"\n` : "";
  return `${imports}class DocProbe {\n    sfn m@(main):void () {\n    }\n}\n`;
}

/** A2: the operators that the compiler registers for the probe program. */
async function registeredOperators(source) {
  const result = await compileSource(probeProgram(source), "es6", { keepContext: true });
  if (!result.ctx) {
    return { ok: false, error: result.errors, byFile: new Map(), all: [] };
  }
  const operators = await result.ctx.getAllOperators();
  const byFile = new Map();
  const all = [];
  for (const desc of operators) {
    let file = "";
    try {
      file = desc.node && desc.node.getFilename ? String(desc.node.getFilename()) : "";
    } catch {
      file = "";
    }
    const record = { name: desc.name, file };
    all.push(record);
    const key = file.replace(/^\/+/, "");
    if (!byFile.has(key)) {
      byFile.set(key, []);
    }
    byFile.get(key).push(record);
  }
  return { ok: result.ok, error: result.errors, byFile, all };
}

function fileKeys(sourceFile) {
  // The virtual filesystem sees "Lang.rgr" and "lib/JSON.rgr"; the registry
  // holds repository paths.
  const base = sourceFile.split("/").pop();
  return new Set([sourceFile, base, `lib/${base}`]);
}

async function main() {
  const registry = readJson(path.join(DOCS, "sources.json"));
  const model = {
    generated: {
      compilerVersion: readJson(path.join(ROOT, "package.json")).version,
      targets: TARGETS,
    },
    sources: [],
    operators: [],
    methods: [],
    macros: [],
    problems: [],
  };

  for (const source of registry.sources) {
    const absolute = path.join(ROOT, source.file);
    if (!fs.existsSync(absolute)) {
      model.problems.push({ kind: "missing-source", source: source.id, file: source.file });
      continue;
    }

    const parsed = parseOperatorSource(source.file);
    if (parsed.hadError) {
      model.problems.push({ kind: "parse-error", source: source.id, file: source.file });
    }

    const registered = await registeredOperators(source);
    if (!registered.ok) {
      model.problems.push({
        kind: "probe-failed",
        source: source.id,
        file: source.file,
        detail: registered.error.split("\n")[0] || "",
      });
    }
    const keys = fileKeys(source.file);
    const registeredNames = new Set();
    for (const [file, records] of registered.byFile) {
      if (keys.has(file)) {
        for (const record of records) {
          registeredNames.add(record.name);
        }
      }
    }

    const seen = new Map();
    for (const def of parsed.definitions) {
      const argTypes = def.args.map((a) => typeString(a.type, a.optional));
      let id = operatorId(source.id, def.name, argTypes);
      if (seen.has(id)) {
        const next = seen.get(id) + 1;
        seen.set(id, next);
        id = `${id}.${next}`;
      } else {
        seen.set(id, 1);
      }
      const category = categoryOf(def);
      model.operators.push({
        id,
        anchor: operatorAnchor(id),
        source: source.id,
        name: def.name,
        implementation: def.implementation,
        returns: def.returns,
        returnsOptional: def.returnsOptional,
        args: def.args,
        signature: shortSignature(def),
        key: definitionKey(def),
        category,
        doc: def.doc,
        comment: def.comment,
        templates: def.templates,
        support: targetSupport(def, TARGET_IDS),
        registered: registeredNames.has(def.name),
        file: source.file,
        line: def.line,
        definition: def.definition,
      });
    }

    const seenMethods = new Map();
    for (const method of parsed.methods) {
      const argTypes = method.args.map((a) => typeString(a.type, a.optional));
      const base = operatorId(source.id, `${slugType(method.receiver)}.${method.name}`, argTypes);
      let id = base;
      if (seenMethods.has(base)) {
        const next = seenMethods.get(base) + 1;
        seenMethods.set(base, next);
        id = `${base}.${next}`;
      } else {
        seenMethods.set(base, 1);
      }
      model.methods.push({
        id,
        anchor: operatorAnchor(id),
        source: source.id,
        receiver: method.receiver,
        scope: method.scope,
        name: method.name,
        returns: method.returns,
        returnsOptional: method.returnsOptional,
        args: method.args,
        doc: method.doc,
        comment: method.comment,
        file: source.file,
        line: method.line,
        definition: method.definition,
      });
    }

    for (const macro of parsed.macros) {
      model.macros.push({
        id: `${source.id}/macro.${macro.name}.${macro.params.length}.${macro.line}`,
        reads: collectionAccessors(macro.definition),
        readsKind: readsKind(collectionAccessors(macro.definition)),
        source: source.id,
        name: macro.name,
        params: macro.params,
        comment: macro.comment,
        definition: macro.definition,
        file: source.file,
        line: macro.line,
      });
    }

    model.sources.push({
      ...source,
      operatorCount: parsed.definitions.length,
      methodCount: parsed.methods.length,
      macroCount: parsed.macros.length,
      probeOk: registered.ok,
    });

    process.stderr.write(
      `docs: ${source.id.padEnd(12)} ${String(parsed.definitions.length).padStart(4)} operators` +
        `${parsed.methods.length > 0 ? `, ${parsed.methods.length} type methods` : ""}` +
        `${parsed.macros.length > 0 ? `, ${parsed.macros.length} macros` : ""}` +
        `${registered.ok ? "" : "  (probe failed)"}\n`,
    );
  }

  // Registry check: a file with operators that no source entry names.
  const known = new Set(registry.sources.map((s) => s.file));
  for (const file of findOperatorFiles(["lib"])) {
    if (known.has(file)) {
      continue;
    }
    const parsed = parseOperatorSource(file);
    const count = parsed.definitions.length + parsed.methods.length;
    if (count > 0) {
      model.problems.push({ kind: "unregistered-source", file, count });
    }
  }

  writeJson(path.join(DATA, "operators.json"), model);
  process.stderr.write(
    `docs: model written — ${model.operators.length} operators, ${model.methods.length} type methods, ` +
      `${model.macros.length} macros, ${model.problems.length} problems\n`,
  );
  for (const problem of model.problems) {
    process.stderr.write(`docs:   ${problem.kind}: ${problem.file || problem.source}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`docs: extraction failed — ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
