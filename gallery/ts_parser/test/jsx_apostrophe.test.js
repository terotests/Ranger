/**
 * JSX Apostrophe Handling Tests
 *
 * Issue #1: an apostrophe in JSX text content (e.g. "Rusty's heart") used to be
 * lexed as the start of a string literal, swallowing the rest of the line and
 * breaking every subsequent element. A single quote flanked by letters is now
 * treated as a word-internal apostrophe (a punctuator), not a string delimiter.
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { TSLexer, TSParserSimple } = require("../benchmark/ts_parser_module.cjs");

function tokenize(code) {
  return new TSLexer(code).tokenize();
}

function parseTsx(code) {
  const tokens = tokenize(code);
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setTsxMode(true);
  parser.setQuiet(true);
  return parser.parseProgram();
}

function collect(node, pred, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (pred(node)) acc.push(node);
  for (const k in node) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => collect(x, pred, acc));
    else if (v && typeof v === "object") collect(v, pred, acc);
  }
  return acc;
}

describe("Issue #1: apostrophe in JSX text", () => {
  it("does not treat a word-internal apostrophe as a string", () => {
    const toks = tokenize("<span>Rusty's heart</span>");
    const strings = toks.filter((t) => t.tokenType === "String");
    expect(strings.length).toBe(0);
  });

  it("still lexes real single-quoted string literals", () => {
    const toks = tokenize("const x = 'abc';");
    const strings = toks.filter((t) => t.tokenType === "String");
    expect(strings.length).toBe(1);
    expect(strings[0].value).toBe("abc");
  });

  it("keeps a string literal that follows a paren/operator", () => {
    expect(tokenize("f('a')").filter((t) => t.tokenType === "String").length).toBe(1);
    expect(tokenize("x = 'y'").filter((t) => t.tokenType === "String").length).toBe(1);
  });

  it("parses JSX with an apostrophe without error nodes", () => {
    const ast = parseTsx(
      "function r(){ return <View><span>Rusty's heart raced</span></View>; }"
    );
    const errors = collect(ast, (n) => n.nodeType === "error");
    expect(errors.length).toBe(0);
  });

  it("still parses elements that follow the apostrophe text", () => {
    const ast = parseTsx(
      "function r(){ return <View><span>It's over</span><Label>Score</Label></View>; }"
    );
    const els = collect(ast, (n) => n.nodeType === "JSXElement");
    // View + span + Label
    expect(els.length).toBe(3);
  });
});
