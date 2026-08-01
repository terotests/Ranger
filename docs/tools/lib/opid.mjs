/**
 * Operator identifiers.
 *
 * An identifier is part of the public URL of the reference. It must stay the
 * same between releases, so the transliteration table below is append-only and
 * has a unit test.
 *
 *   core/mod.int.int          the % operator of Lang.rgr for two integers
 *   json/print.JSONDataObject the print operator that lib/JSON.rgr adds
 */

/** Names that are not valid in a URL or in a file name. */
export const SYMBOL_SLUGS = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "div",
  "%": "mod",
  "=": "assign",
  "==": "eq",
  "!=": "ne",
  "<": "lt",
  ">": "gt",
  "<=": "le",
  ">=": "ge",
  "&&": "and",
  "||": "or",
  "!": "not",
  "[]": "index",
  "??": "coalesce",
  "!!": "force",
  "null?": "is-null",
  "!null?": "not-null",
  "if!": "if-not",
  "&": "bit-and",
  "|": "bit-or",
  "^": "bit-xor",
  "~": "bit-not",
  "<<": "shift-left",
  ">>": "shift-right",
  ">>>": "shift-right-unsigned",
  "**": "pow",
  "++": "increment",
  "--": "decrement",
  "+=": "add-assign",
  "-=": "sub-assign",
  "*=": "mul-assign",
  "/=": "div-assign",
  "%=": "mod-assign",
  ".": "dot",
  "->": "arrow",
  "=>": "fat-arrow",
  "?": "question",
  ":": "colon",
  "#": "hash",
  "@": "at",
  $: "dollar",
};

/**
 * Type names contain characters that a file name must not hold. An array and a
 * hash keep a prefix, because `[T]` and `T` are different types and their
 * identifiers must stay different.
 */
export function slugType(type) {
  let text = String(type || "any");
  let prefix = "";
  if (text.startsWith("<optional>")) {
    prefix = "opt-";
    text = text.slice("<optional>".length);
  }
  const hash = text.match(/^\[([^:\]]+):([^\]]+)\]$/);
  if (hash) {
    text = `map-${hash[1]}-${hash[2]}`;
  } else {
    const array = text.match(/^\[([^\]]+)\]$/);
    if (array) {
      text = `arr-${array[1]}`;
    }
  }
  return `${prefix}${text}`
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugName(name) {
  if (Object.prototype.hasOwnProperty.call(SYMBOL_SLUGS, name)) {
    return SYMBOL_SLUGS[name];
  }
  const slug = String(name)
    .replace(/[^A-Za-z0-9_.]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length > 0 ? slug : "op";
}

/**
 * The identifier of one operator definition.
 * @param {string} sourceId  the id in docs/sources.json
 * @param {string} name      the operator name
 * @param {string[]} argTypes the argument types, in order
 */
export function operatorId(sourceId, name, argTypes) {
  const parts = [slugName(name), ...(argTypes || []).map(slugType)];
  return `${sourceId}/${parts.filter((p) => p.length > 0).join(".")}`;
}

/** The anchor of the operator on its category page. */
export function operatorAnchor(id) {
  return id
    .split("/")
    .slice(1)
    .join("-")
    .replace(/\./g, "-")
    .toLowerCase();
}

/**
 * The file name of the description of the operator: the identifier with the
 * source and the argument types kept, but with no character that a file system
 * or a URL treats in a special way.
 */
export function operatorFileName(id) {
  const [source, rest] = [id.split("/")[0], id.split("/").slice(1).join("/")];
  return `${source}__${rest.replace(/\./g, "-")}`;
}
