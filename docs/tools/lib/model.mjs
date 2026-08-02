/**
 * The operator model: types, categories and signatures.
 *
 * The category predicates follow compiler/ng_RangerDocGenerator.rgr, so the
 * groups of the site are the groups of `operators.md`. The bitwise group is an
 * addition: the operators of that group are numeric, and a reader looks for
 * them under their own heading.
 */

export const CATEGORIES = [
  { id: "statements", title: "Statements", summary: "Operators that do work and give no value." },
  { id: "switches", title: "Language switches", summary: "Blocks that only one target language compiles." },
  { id: "constants", title: "Operators without arguments", summary: "Values that the compiler gives to the program." },
  { id: "generic", title: "Generic operators", summary: "Operators that accept a value of any type." },
  { id: "numeric", title: "Numeric operators", summary: "Arithmetic on integers and doubles." },
  { id: "bitwise", title: "Bitwise operators", summary: "Bit level operations on integers." },
  { id: "string", title: "String operators", summary: "Text operations." },
  { id: "array", title: "Array operators", summary: "Operators on arrays." },
  { id: "map", title: "Map operators", summary: "Operators on hash maps." },
  { id: "boolean", title: "Boolean and test operators", summary: "Operators that give a boolean value." },
  { id: "misc", title: "Miscellaneous operators", summary: "Operators that no other group holds." },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

const BITWISE = new Set([
  "bit_and",
  "bit_or",
  "bit_xor",
  "bit_not",
  "bit_shift_left",
  "bit_shift_right",
  "shift_left",
  "shift_right",
  "&",
  "|",
  "^",
  "~",
  "<<",
  ">>",
]);

const NUMERIC_TYPES = new Set([
  "int",
  "double",
  "float",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
]);

/** The printed type of an argument or of a return value. */
export function typeString(type, optional) {
  const base = String(type || "void");
  return optional ? `<optional>${base}` : base;
}

function isArrayType(type) {
  return /^\[[^:\]]+\]$/.test(String(type || ""));
}

function isHashType(type) {
  return /^\[[^\]]+:[^\]]+\]$/.test(String(type || ""));
}

/** The group of the operator. The first predicate that matches wins. */
export function categoryOf(def) {
  const first = def.args[0];
  const returns = def.returns;

  if (def.name.startsWith("if_")) {
    return "switches";
  }
  if (BITWISE.has(def.name) && first && NUMERIC_TYPES.has(first.type)) {
    return "bitwise";
  }
  if (!first) {
    return returns === "void" ? "statements" : "constants";
  }
  if (returns === "void" && !isArrayType(first.type) && !isHashType(first.type)) {
    return "statements";
  }
  if (isArrayType(first.type)) {
    return "array";
  }
  if (isHashType(first.type)) {
    return "map";
  }
  if (first.type === "T") {
    return "generic";
  }
  if (NUMERIC_TYPES.has(first.type) && NUMERIC_TYPES.has(returns)) {
    return "numeric";
  }
  if (first.type === "string") {
    return "string";
  }
  if (returns === "boolean") {
    return "boolean";
  }
  return "misc";
}

/** The signature line of the operator, as the reference prints it. */
export function signature(def) {
  const args = def.args
    .map((a) => `${a.name}: ${typeString(a.type, a.optional)}`)
    .join(", ");
  const returns = typeString(def.returns, def.returnsOptional);
  return `(${def.name}${args.length > 0 ? ` ${def.args.map((a) => a.name).join(" ")}` : ""}) → ${returns}${
    args.length > 0 ? `\n${def.name}(${args})` : ""
  }`;
}

/** A short signature for a heading: name and argument types. */
export function shortSignature(def) {
  const args = def.args.map((a) => typeString(a.type, a.optional)).join(" ");
  const returns = typeString(def.returns, def.returnsOptional);
  return args.length > 0 ? `${def.name} ${args} → ${returns}` : `${def.name} → ${returns}`;
}

/** The key that joins a parsed definition to a compiled descriptor. */
export function definitionKey(def) {
  const args = def.args.map((a) => typeString(a.type, a.optional)).join(",");
  return `${def.name}(${args})`;
}

/**
 * Targets that the definition writes code for, and how.
 *
 * A target can compile through the writer of another target: TypeScript is the
 * JavaScript writer with type annotations, so `-l=es6 -typescript` uses the
 * `es6` template of the operator. A target with a `compileAs` therefore takes
 * the state of that other target when it holds no template of its own.
 * Without this, the reference states that TypeScript does not support an
 * operator that TypeScript compiles.
 *
 * @param {object} def
 * @param {Array<string|{id: string, compileAs?: string}>} targets
 */
export function targetSupport(def, targets) {
  const templates = def.templates || {};
  const fallback = Object.prototype.hasOwnProperty.call(templates, "*");
  const stateOf = (id) => {
    if (Object.prototype.hasOwnProperty.call(templates, id)) {
      return "template";
    }
    return fallback ? "fallback" : "none";
  };

  const support = {};
  for (const target of targets) {
    const id = typeof target === "string" ? target : target.id;
    const parent = typeof target === "string" ? undefined : target.compileAs;
    let state = stateOf(id);
    if (state !== "template" && parent) {
      const inherited = stateOf(parent);
      if (inherited !== "none") {
        state = inherited;
      }
    }
    support[id] = state;
  }
  return support;
}
