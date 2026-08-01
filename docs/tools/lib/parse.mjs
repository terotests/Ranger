/**
 * Stage A1 — read an operator source with the Ranger parser.
 *
 * The parser reads any file that holds an `operators { }` or a `commands { }`
 * block. It does not need the file to be importable or compilable, and it keeps
 * the template source text, the comments and the line numbers that a compiled
 * writer context throws away.
 *
 * Node shape of one definition:
 *   child 0  operator name          %
 *   child 1  implementation name    cmdModulo, or _ when there is none
 *   child 2  return type            int
 *   child 3  argument list          left int right int   (name and type in pairs)
 *   child 4  templates block        es6 ( … ) go ( … ) …
 */
import fs from "node:fs";
import path from "node:path";
import { loadCompilerApi } from "./compiler.mjs";
import { ROOT } from "./paths.mjs";

/** RangerNodeType values that the type printer needs (compiler/ng_RangerAppEnums.rgr). */
export const NodeType = {
  Array: 6,
  Hash: 7,
  ImmutableArray: 8,
  ImmutableHash: 9,
  VRef: 11,
  ExpressionType: 20,
};

function firstVref(node) {
  const first = node && node.getFirst && node.getFirst();
  return first ? first.vref : "";
}

/**
 * Collect every `operator type:<T> <target> { … }` block.
 *
 * This is the second operator mechanism of the language. The block holds
 * ordinary Ranger functions, and the compiler makes each one an operator of the
 * receiver type: `items.map({ … })`. The functions compile like any other
 * Ranger code, so they work for every target that compiles the library.
 *
 * Node shape:
 *   child 0  "operator"
 *   child 1  "type"
 *   child 2  the receiver type, for example `[T]` or `Vector`
 *   child 3  the target scope: `all`, or one target such as `es6`
 *   last     the body with the `fn` declarations
 *
 * A hash receiver reaches the parser as two tokens, in the same way as a hash
 * argument, so `[string` and `T]` are joined again.
 */
function collectMethodBlocks(node, out) {
  if (!node || !node.children) {
    return out;
  }
  if (firstVref(node) === "operator" && node.children.length >= 5) {
    const kids = node.children;
    if (kids[1] && kids[1].vref === "type") {
      let index = 2;
      let receiver = String(kids[index].vref || "");
      if (receiver.startsWith("[") && !receiver.includes("]") && kids[index + 1]) {
        receiver = `${receiver}:${kids[index + 1].vref}`;
        index += 1;
      }
      const scope = kids[index + 1] ? String(kids[index + 1].vref || "all") : "all";
      const body = kids[kids.length - 1];
      if (body && body.children) {
        out.push({ receiver, scope, body });
      }
    }
  }
  for (const child of node.children) {
    collectMethodBlocks(child, out);
  }
  return out;
}

/** Collect every `operators` / `commands` body in the file, at any depth. */
function collectBlocks(node, out) {
  if (!node || !node.children) {
    return out;
  }
  const head = firstVref(node);
  if ((head === "operators" || head === "commands") && node.children.length > 1) {
    const body = node.children[1];
    if (body && body.children) {
      out.push({ kind: head, body });
    }
  }
  for (const child of node.children) {
    collectBlocks(child, out);
  }
  return out;
}

/** The `templates` node of a definition, wherever the parser put it. */
function findTemplates(node) {
  for (const child of node.children || []) {
    if (firstVref(child) === "templates") {
      return child;
    }
    for (const inner of child.children || []) {
      if (firstVref(inner) === "templates") {
        return inner;
      }
    }
  }
  return null;
}

function readTemplates(node) {
  const templatesNode = findTemplates(node);
  const templates = {};
  if (!templatesNode || templatesNode.children.length < 2) {
    return templates;
  }
  for (const entry of templatesNode.children[1].children || []) {
    const target = firstVref(entry);
    if (!target) {
      continue;
    }
    const body = entry.children[1];
    let code = "";
    try {
      code = body ? String(body.getCode()) : "";
    } catch {
      code = "";
    }
    templates[target] = code.trim();
  }
  return templates;
}

/**
 * The argument list of a definition: the children are name and type in pairs.
 *
 * A hash type reaches the parser as two tokens, because the colon inside
 * `[K:T]` separates them. The two tokens are joined again here, otherwise every
 * pair after a hash argument is one token out of place.
 */
function readArgs(node) {
  const args = [];
  const list = node.children[3];
  if (!list || !list.children) {
    return args;
  }
  const kids = [];
  for (let i = 0; i < list.children.length; i += 1) {
    const node = list.children[i];
    const vref = String(node.vref || "");
    const next = list.children[i + 1];
    if (vref.startsWith("[") && !vref.includes("]") && next) {
      kids.push({ node, vref: `${vref}:${next.vref}` });
      i += 1;
      continue;
    }
    kids.push({ node, vref });
  }
  for (let i = 0; i + 1 < kids.length; i += 2) {
    const nameNode = kids[i].node;
    args.push({
      name: kids[i].vref,
      type: typeOfArgument(kids[i + 1]),
      optional: Boolean(nameNode.hasFlag && nameNode.hasFlag("optional")),
      annotations: annotationsOf(nameNode),
    });
  }
  return args;
}

/**
 * The type of one argument.
 *
 * A function type has no `vref`: the parser holds it as a subtree, for example
 * `(_ T (item T index int))` for `(_:T (item:T index:int))`. The subtree is
 * printed back as a function type, because "no type" on the page would be
 * wrong.
 */
function typeOfArgument(entry) {
  if (entry.vref && entry.vref.length > 0) {
    return entry.vref;
  }
  const node = entry.node;
  if (!node || !node.children || node.children.length === 0) {
    return "";
  }
  let code = "";
  try {
    code = String(node.getCode());
  } catch {
    return "";
  }
  const inner = code.replace(/^\(|\)$/g, "").trim();
  // "(_ boolean (item T))": the first token is the name placeholder and the
  // second token is the type that the function gives.
  const head = inner.split(/\s+/);
  const returns = head[1] && !head[1].startsWith("(") ? head[1] : "_";
  const argsMatch = inner.match(/\(([^)]*)\)\s*$/);
  const parts = argsMatch ? argsMatch[1].trim().split(/\s+/) : [];
  const pairs = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    pairs.push(`${parts[i]}:${parts[i + 1]}`);
  }
  return `(fn:${returns === "_" ? "void" : returns} (${pairs.join(" ")}))`;
}

const KNOWN_FLAGS = [
  "optional",
  "noeval",
  "ignore",
  "define",
  "union",
  "newcontext",
  "weak",
  "strong",
  "pure",
  "async",
  "main",
  "lives",
  "temp",
];

function annotationsOf(node) {
  if (!node || !node.hasFlag) {
    return [];
  }
  return KNOWN_FLAGS.filter((flag) => node.hasFlag(flag));
}

/** Comment lines that stand directly above the definition. */
function leadingComment(lines, line) {
  const collected = [];
  for (let i = line - 1; i >= 0; i -= 1) {
    const text = lines[i] === undefined ? "" : lines[i].trim();
    if (text.startsWith(";")) {
      const body = text.replace(/^;+\s?/, "").trim();
      if (body.length > 0 && !/^=+$/.test(body) && !/^-+$/.test(body)) {
        collected.unshift(body);
      }
      continue;
    }
    if (text.length === 0 && collected.length === 0) {
      continue;
    }
    break;
  }
  return collected.join(" ").trim();
}

/**
 * Line anchors.
 *
 * The parser gives the definitions and their order, but the position fields of
 * a definition node point into the block that the parser read last, not to the
 * head of the definition. The line anchor therefore comes from a scan of the
 * source text: the definitions are in file order, so one forward scan per file
 * finds each head after the head before it.
 */
function anchorLine(lines, name, from) {
  for (let i = from; i < lines.length; i += 1) {
    const text = lines[i].replace(/\r$/, "").trim();
    if (text.length === 0 || text.startsWith(";")) {
      continue;
    }
    if (!text.startsWith(name)) {
      continue;
    }
    const after = text.slice(name.length);
    // The head is "<name> <implementation>:<type> ( … ) {", "<name> ( … ) {" or
    // "<name>@(annotation) …".
    if (/^[\s(@]/.test(after) || after.length === 0) {
      return i;
    }
  }
  return -1;
}

/** The line of a `fn <name>` declaration inside a method operator block. */
function anchorMethodLine(lines, name, from) {
  const head = new RegExp(`^s?fn\\s+${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`);
  for (let i = from; i < lines.length; i += 1) {
    const text = lines[i].replace(/\r$/, "").trim();
    if (head.test(text)) {
      return i;
    }
  }
  return -1;
}

/** The line where the block that starts on `start` closes. */
function blockEnd(lines, start) {
  let depth = 0;
  let seen = false;
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    let quote = "";
    for (let c = 0; c < line.length; c += 1) {
      const ch = line[c];
      if (quote) {
        if (ch === "\\") {
          c += 1;
        } else if (ch === quote) {
          quote = "";
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === ";") {
        break;
      }
      if (ch === "{") {
        depth += 1;
        seen = true;
      } else if (ch === "}") {
        depth -= 1;
        if (seen && depth <= 0) {
          return i;
        }
      }
    }
    if (seen && depth <= 0) {
      return i;
    }
  }
  return start;
}

/** The verbatim source of the definition, without the common indentation. */
function sourceSlice(lines, start, end) {
  const block = lines.slice(start, end + 1).map((l) => l.replace(/\r$/, ""));
  const indent = block
    .filter((l) => l.trim().length > 0)
    .reduce((min, l) => Math.min(min, l.length - l.trimStart().length), Infinity);
  const strip = Number.isFinite(indent) ? indent : 0;
  return block.map((l) => l.slice(strip)).join("\n").trimEnd();
}

/**
 * Read one operator source.
 * @returns {{file: string, definitions: Array, macros: Array, hadError: boolean}}
 */
export function parseOperatorSource(relFile) {
  const { SourceCode, RangerLispParser } = loadCompilerApi();
  const absolute = path.join(ROOT, relFile);
  const text = fs.readFileSync(absolute, "utf8");
  const lines = text.split("\n");

  const code = new SourceCode(text);
  code.filename = relFile;
  const parser = new RangerLispParser(code);
  parser.parse();

  const definitions = [];
  let cursor = 0;
  for (const block of collectBlocks(parser.rootNode, [])) {
    for (const node of block.body.children) {
      const name = firstVref(node);
      if (!name || node.children.length < 4) {
        continue;
      }
      const implNode = node.children[1];
      const returnNode = node.children[2];
      const start = anchorLine(lines, name, cursor);
      const end = start >= 0 ? blockEnd(lines, start) : -1;
      if (start >= 0) {
        cursor = start + 1;
      }
      definitions.push({
        name,
        implementation: implNode ? implNode.vref : "_",
        returns: returnNode ? returnNode.vref : "void",
        returnsOptional: Boolean(implNode && implNode.hasFlag && implNode.hasFlag("optional")),
        args: readArgs(node),
        templates: readTemplates(node),
        doc:
          node.hasStringProperty && node.hasStringProperty("doc")
            ? String(node.getStringProperty("doc")).trim()
            : "",
        comment: start >= 0 ? leadingComment(lines, start) : "",
        line: start >= 0 ? start + 1 : 0,
        block: block.kind,
        definition: start >= 0 ? sourceSlice(lines, start, end) : "",
      });
    }
  }

  const methods = [];
  let methodCursor = 0;
  for (const block of collectMethodBlocks(parser.rootNode, [])) {
    for (const node of block.body.children) {
      if (firstVref(node) !== "fn" && firstVref(node) !== "sfn") {
        continue;
      }
      const nameNode = node.children[1];
      const returnNode = node.children[2];
      const name = nameNode ? nameNode.vref : "";
      if (!name) {
        continue;
      }
      const start = anchorMethodLine(lines, name, methodCursor);
      const end = start >= 0 ? blockEnd(lines, start) : -1;
      if (start >= 0) {
        methodCursor = start + 1;
      }
      methods.push({
        receiver: block.receiver,
        scope: block.scope,
        name,
        returns: returnNode ? returnNode.vref : "void",
        returnsOptional: Boolean(nameNode && nameNode.hasFlag && nameNode.hasFlag("optional")),
        args: readArgs(node),
        annotations: annotationsOf(nameNode),
        doc:
          node.hasStringProperty && node.hasStringProperty("doc")
            ? String(node.getStringProperty("doc")).trim()
            : "",
        comment: start >= 0 ? leadingComment(lines, start) : "",
        line: start >= 0 ? start + 1 : 0,
        definition: start >= 0 ? sourceSlice(lines, start, end) : "",
      });
    }
  }

  const macros = [];
  let macroCursor = 0;
  for (const node of parser.rootNode.children || []) {
    if (firstVref(node) !== "defn") {
      continue;
    }
    const nameNode = node.children[1];
    const paramNode = node.children[2];
    const name = nameNode ? nameNode.vref : "";
    const start = name ? anchorLine(lines, "defn", macroCursor) : -1;
    if (start >= 0) {
      macroCursor = start + 1;
    }
    macros.push({
      name,
      params: (paramNode && paramNode.children ? paramNode.children : []).map((p) => p.vref),
      line: start >= 0 ? start + 1 : 0,
      comment: start >= 0 ? leadingComment(lines, start) : "",
      definition: start >= 0 ? sourceSlice(lines, start, blockEnd(lines, start)) : "",
    });
  }

  return {
    file: relFile,
    definitions,
    methods,
    macros: macros.filter((m) => m.name.length > 0),
    hadError: Boolean(parser.had_error),
  };
}

/** Every file in the tree that declares operators, for the registry check. */
export function findOperatorFiles(dirs) {
  const found = [];
  for (const dir of dirs) {
    const absolute = path.join(ROOT, dir);
    if (!fs.existsSync(absolute)) {
      continue;
    }
    const stack = [absolute];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.name.endsWith(".rgr")) {
          const text = fs.readFileSync(full, "utf8");
          if (/(^|\n)\s*(operators|commands)\s*\{/.test(text) || /(^|\n)\s*operator\s+type:/.test(text)) {
            found.push(path.relative(ROOT, full).split(path.sep).join("/"));
          }
        }
      }
    }
  }
  return found.sort();
}
