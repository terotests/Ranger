/**
 * gen-entities.mjs — write src/MdEntities.rgr from the HTML5 entity table.
 *
 *   node gallery/markdown/tools/gen-entities.mjs
 *
 * CommonMark accepts every named character reference the HTML5 specification
 * defines, and requires the terminating semicolon — so the set needed here is
 * the WHATWG table minus its legacy semicolon-less forms, 2125 names.
 *
 * Writing them into Ranger as 2125 `set` statements would be 2125 statements
 * for the compiler to type-check and for every target to execute before the
 * first document is parsed. They are packed instead: `name:hex[,hex]` pairs,
 * space separated, in chunks a source line can hold, split on first lookup.
 * Code points rather than characters because a value may itself be a
 * semicolon (`&semi;`) or an equals sign (`&equals;`).
 *
 * The table comes from the `character-entities` package when it is installed
 * (`npm --prefix gallery/markdown/harness install`), and the generated file is
 * checked in, so building the parser never needs the registry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "src", "MdEntities.rgr");

// Resolved out of the harness rather than by bare specifier: the harness keeps
// its own node_modules (as rangerflow's does) so the repository root is not
// given dependencies it does not otherwise need, and a bare import here would
// look everywhere except there.
let table;
try {
  const pkg = path.join(HERE, "..", "harness", "node_modules", "character-entities", "index.js");
  const mod = await import(pathToFileURL(pkg).href);
  table = mod.characterEntities ?? mod.default;
} catch {
  console.error("character-entities is not installed.");
  console.error("  npm --prefix gallery/markdown/harness install");
  console.error("The checked-in gallery/markdown/src/MdEntities.rgr is unchanged.");
  process.exit(1);
}

const names = Object.keys(table).sort();
const pairs = names.map(
  (n) => n + ":" + [...table[n]].map((ch) => ch.codePointAt(0).toString(16)).join(",")
);

const chunks = [];
let cur = "";
for (const p of pairs) {
  if (cur.length + p.length + 1 > 900) {
    chunks.push(cur);
    cur = p;
  } else {
    cur = cur ? cur + " " + p : p;
  }
}
if (cur) chunks.push(cur);

const L = [];
const w = (s) => L.push(s);

w("; SPDX-License-Identifier: AGPL-3.0-or-later");
w("");
w("; ============================================================================");
w("; MdEntities.rgr — the HTML5 named character references. GENERATED.");
w("; ============================================================================");
w(";");
w(";     node gallery/markdown/tools/gen-entities.mjs");
w(";");
w("; " + names.length + " names: the whole set CommonMark accepts. It requires the");
w("; terminating semicolon, so the legacy semicolon-less forms are not here.");
w(";");
w("; Packed rather than written out as one `set` per name, which would be " + names.length);
w("; statements for the compiler to check and for every target to run before the");
w("; first document is parsed. This is `name:hex[,hex]` pairs, space separated,");
w("; split on first lookup — code points and not characters, because a value may");
w("; itself be a semicolon or an equals sign.");
w("; ============================================================================");
w("");
w('Import "MdChar.rgr"');
w("");
w("class MdEntities {");
w("    def table:[string:string]");
w("    def loaded:boolean false");
w("");
w("    Constructor () {");
w("    }");
w("");
w("    ; The named reference, or \"\" when there is no such name.");
w("    fn lookup:string (name:string) {");
w("        if! loaded {");
w("            this.load()");
w("        }");
w("        if (has table name) {");
w('            return (?? (get table name) "")');
w("        }");
w('        return ""');
w("    }");
w("");
w("    fn load:void () {");
w("        loaded = true");
w("        def packed:[string]");
for (const c of chunks) w('        push packed "' + c + '"');
w("        def ci:int 0");
w("        def cn:int (array_length packed)");
w("        while (ci < cn) {");
w("            def chunk:string (itemAt packed ci)");
w('            def pairs:[string] (strsplit chunk " ")');
w("            def pi:int 0");
w("            def pn:int (array_length pairs)");
w("            while (pi < pn) {");
w("                def pair:string (itemAt pairs pi)");
w("                def cut:int (MdEntities.colonAt(pair))");
w("                if (cut > 0) {");
w("                    def name:string (substring pair 0 cut)");
w("                    def plen:int (strlen pair)");
w("                    def codes:string (substring pair (cut + 1) plen)");
w("                    def value:string (MdEntities.decodeCodes(codes))");
w("                    set table name value");
w("                }");
w("                pi = (pi + 1)");
w("            }");
w("            ci = (ci + 1)");
w("        }");
w("    }");
w("");
w("    sfn colonAt:int (pair:string) {");
w("        def i:int 0");
w("        def n:int (strlen pair)");
w("        while (i < n) {");
w("            if ((charAt pair i) == 58) {");
w("                return i");
w("            }");
w("            i = (i + 1)");
w("        }");
w("        return -1");
w("    }");
w("");
w("    sfn decodeCodes:string (codes:string) {");
w('        def out:string ""');
w('        def parts:[string] (strsplit codes ",")');
w("        def i:int 0");
w("        def n:int (array_length parts)");
w("        while (i < n) {");
w("            def hex:string (itemAt parts i)");
w("            def cp:int (MdEntities.parseHex(hex))");
w("            out = (out + (MdChar.fromCode(cp)))");
w("            i = (i + 1)");
w("        }");
w("        return out");
w("    }");
w("");
w("    sfn parseHex:int (hex:string) {");
w("        def v:int 0");
w("        def i:int 0");
w("        def n:int (strlen hex)");
w("        while (i < n) {");
w("            def c:int (charAt hex i)");
w("            def d:int 0");
w("            if ((c >= 48) && (c <= 57)) { d = (c - 48) }");
w("            if ((c >= 97) && (c <= 102)) { d = ((c - 97) + 10) }");
w("            if ((c >= 65) && (c <= 70)) { d = ((c - 65) + 10) }");
w("            v = ((v * 16) + d)");
w("            i = (i + 1)");
w("        }");
w("        return v");
w("    }");
w("}");
w("");

fs.writeFileSync(OUT, L.join("\n"));
console.log("wrote " + OUT + " — " + names.length + " names in " + chunks.length + " chunks");
