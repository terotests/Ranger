/**
 * Tests for the documentation generator in docs/tools.
 *
 * The identifiers are part of the public URL of the reference, so they must not
 * change without a reason. The registry test fails when a new library declares
 * operators and nobody adds it to docs/sources.json, which would leave the
 * reference incomplete but complete-looking.
 */
import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const opid = await import(path.join(ROOT, "docs/tools/lib/opid.mjs"));
const excerpt = await import(path.join(ROOT, "docs/tools/lib/excerpt.mjs"));
const parse = await import(path.join(ROOT, "docs/tools/lib/parse.mjs"));

describe("operator identifiers", () => {
  it("keeps a symbol name readable in a URL", () => {
    expect(opid.operatorId("core", "%", ["int", "int"])).toBe("core/mod.int.int");
    expect(opid.operatorId("core", "??", ["<optional>T", "T"])).toBe("core/coalesce.opt-T.T");
    expect(opid.operatorId("core", "!null?", ["<optional>T"])).toBe("core/not-null.opt-T");
  });

  it("separates an array and a hash from a plain type", () => {
    expect(opid.operatorId("core", "push", ["[T]", "T"])).toBe("core/push.arr-T.T");
    expect(opid.operatorId("core", "keys", ["[string:T]"])).toBe("core/keys.map-string-T");
    expect(opid.operatorId("core", "size", ["T"])).toBe("core/size.T");
  });

  it("gives a different identifier to two libraries with the same operator", () => {
    expect(opid.operatorId("core", "print", ["string"])).not.toBe(
      opid.operatorId("json", "print", ["string"]),
    );
  });

  it("makes an anchor and a file name with no special character", () => {
    const id = opid.operatorId("core", "??", ["<optional>T", "T"]);
    expect(opid.operatorAnchor(id)).toBe("coalesce-opt-t-t");
    expect(opid.operatorFileName(id)).toBe("core__coalesce-opt-T-T");
  });
});

describe("region extraction", () => {
  it("takes the body of a brace language main function", () => {
    const output = [
      "class Main  {",
      "}",
      "function __js_main() {",
      "  const a = 7;",
      "  console.log(a);",
      "}",
      "__js_main();",
    ].join("\n");
    const region = excerpt.extractRegion(output, "es6");
    expect(region.found).toBe(true);
    expect(region.excerpt).toBe("const a = 7;\nconsole.log(a);");
    expect(region.full).toContain("__js_main();");
  });

  it("takes the body of an indented python main function", () => {
    const output = ["class Main:", "  pass", "def main():", "  a = 7", "  print(a)", ""].join("\n");
    const region = excerpt.extractRegion(output, "python");
    expect(region.found).toBe(true);
    expect(region.excerpt).toBe("a = 7\nprint(a)");
  });

  it("takes the top level main routine of PHP", () => {
    const output = ["<?php", "class Main { }", "/* static PHP main routine */", "$a = 7;"].join("\n");
    const region = excerpt.extractRegion(output, "php");
    expect(region.found).toBe(true);
    expect(region.excerpt).toBe("$a = 7;");
  });

  it("gives the complete file when no rule matches", () => {
    const output = "package main\n";
    const region = excerpt.extractRegion(output, "go");
    expect(region.found).toBe(false);
    expect(region.excerpt).toBe("package main");
  });
});

describe("operator sources", () => {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/sources.json"), "utf8"));

  it("names every library that declares operators", () => {
    const known = new Set(registry.sources.map((s: { file: string }) => s.file));
    const missing: string[] = [];
    for (const file of parse.findOperatorFiles(["lib"])) {
      if (known.has(file)) {
        continue;
      }
      if (parse.parseOperatorSource(file).definitions.length > 0) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  it("reads the core operators of Lang.rgr", () => {
    const parsed = parse.parseOperatorSource("compiler/Lang.rgr");
    expect(parsed.hadError).toBe(false);
    expect(parsed.definitions.length).toBeGreaterThan(300);

    const modulo = parsed.definitions.find(
      (d: { name: string; args: { type: string }[] }) =>
        d.name === "%" && d.args.length === 2 && d.args[0].type === "int",
    );
    expect(modulo).toBeDefined();
    expect(modulo.returns).toBe("int");
    expect(Object.keys(modulo.templates)).toContain("*");
  });

  it("anchors every definition on the line where it starts", () => {
    for (const source of registry.sources) {
      const parsed = parse.parseOperatorSource(source.file);
      const lines = fs.readFileSync(path.join(ROOT, source.file), "utf8").split("\n");
      for (const definition of parsed.definitions) {
        expect(definition.line, `${source.file}: ${definition.name}`).toBeGreaterThan(0);
        expect(
          lines[definition.line - 1].trim().startsWith(definition.name),
          `${source.file}:${definition.line} is not the head of ${definition.name}`,
        ).toBe(true);
      }
    }
  });

  it("names every library that declares type methods", () => {
    // A file can hold `operator type:<T> { … }` and no `operators { }` block.
    // Those files declare operators too, so the registry must name them.
    const known = new Set(registry.sources.map((s: { file: string }) => s.file));
    const missing: string[] = [];
    for (const file of parse.findOperatorFiles(["lib"])) {
      if (known.has(file)) {
        continue;
      }
      if (parse.parseOperatorSource(file).methods.length > 0) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  it("reads the type methods of lib/stdlib.rgr", () => {
    const parsed = parse.parseOperatorSource("lib/stdlib.rgr");
    const map = parsed.methods.find(
      (m: { name: string; receiver: string }) => m.name === "map" && m.receiver === "[T]",
    );
    expect(map).toBeDefined();
    expect(map.returns).toBe("[T]");
    expect(map.scope).toBe("all");
    // A function argument has no plain type name; it is printed from its tree.
    expect(map.args[0].type).toBe("(fn:T (item:T index:int))");

    const any = parsed.methods.find((m: { name: string }) => m.name === "any");
    expect(any.returns).toBe("boolean");
    expect(any.doc).toContain("at least one item");

    const getOr = parsed.methods.find((m: { name: string }) => m.name === "get_or");
    expect(getOr.receiver).toBe("[string:T]");
    expect(getOr.args.map((a: { type: string }) => a.type)).toEqual(["string", "T"]);
  });

  it("anchors every type method on its declaration line", () => {
    for (const source of registry.sources) {
      const parsed = parse.parseOperatorSource(source.file);
      const lines = fs.readFileSync(path.join(ROOT, source.file), "utf8").split("\n");
      for (const method of parsed.methods) {
        expect(method.line, `${source.file}: ${method.name}`).toBeGreaterThan(0);
        // The sources are not consistent about the space after `fn`.
        const head = lines[method.line - 1].trim().replace(/\s+/g, " ");
        expect(
          head.startsWith(`fn ${method.name}`) || head.startsWith(`sfn ${method.name}`),
          `${source.file}:${method.line} is not the head of ${method.name}`,
        ).toBe(true);
      }
    }
  });

  it("reads the optional annotation of an argument", () => {
    const parsed = parse.parseOperatorSource("compiler/Lang.rgr");
    const nullify = parsed.definitions.find((d: { name: string }) => d.name === "nullify");
    expect(nullify.args[0].optional).toBe(true);
    expect(nullify.doc).toContain("optional value");
  });
});

describe("examples", () => {
  it("gives every example a header with an operator identifier", () => {
    const dir = path.join(ROOT, "docs/examples");
    const files: string[] = [];
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.name.endsWith(".rgr")) {
          files.push(full);
        }
      }
    }
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const head = fs.readFileSync(file, "utf8").split("\n").slice(0, 6).join("\n");
      expect(head, `${file} has no id header`).toMatch(/^;;\s*id:\s*\S+/m);
      expect(head, `${file} has no title header`).toMatch(/^;;\s*title:\s*\S+/m);
    }
  });
});
