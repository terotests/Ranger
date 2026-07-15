#!/usr/bin/env node
// Emit per-character credits.json for pack/characters/<slug>/.
//
// The ready set is baked by lpc_compose.rgr in one of two ways, and the credits
// follow the same rule:
//
//   - FULL Universal-LPC art present (LPC_ROOT): each character has its own
//     layer stack (see LpcCompositor.buildFullCharCalls). Attribution for every
//     layer is looked up from the generator's CREDITS.csv.
//   - embedded demo-male-walk pack only: all characters are recolours of the
//     one shared stack and inherit the base pack attribution.
//
// Re-run after editing a character's layers (keep RECIPES in sync with
// lpc_compose.rgr) or refreshing the bake:
//
//   LPC_ROOT=/path/to/Universal-LPC-Spritesheet-Character-Generator \
//     node gallery/game_engine/lpc/pack/characters/build-credits.mjs
//
// Without LPC_ROOT (or when a layer is missing from CREDITS.csv) it falls back
// to the embedded pack's credits for the shared base layers.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, "catalog.json"), "utf8"));
const base = JSON.parse(readFileSync(join(here, "..", "demo-male-walk", "credits.json"), "utf8"));

// Layer stacks of the FULL-art bake — keep in sync with
// lpc/src/lpc_compose.rgr buildFullCharCalls (paths relative to spritesheets/).
const BODY = "body/bodies/male/walk.png";
const HEAD = "head/heads/human/male/walk.png";
const HAIR = "hair/natural/adult/walk.png";
const RECIPES = {
  hero: [
    BODY, HEAD, HAIR,
    "torso/clothes/longsleeve/longsleeve/male/walk.png",
    "legs/pants/male/walk/brown.png",
    "feet/boots/basic/male/walk/leather.png",
  ],
  knight: [
    BODY, HEAD,
    "torso/armour/plate/male/walk.png",
    "legs/armour/plate/male/walk.png",
    "feet/boots/basic/male/walk/steel.png",
    "arms/armour/plate/male/walk.png",
    "arms/hands/gloves/male/walk.png",
    "hat/helmet/greathelm/male/walk.png",
  ],
  mage: [
    BODY, HEAD, HAIR,
    "torso/jacket/frock/male/walk/purple.png",
    "legs/pantaloons/male/walk/purple.png",
    "feet/shoes/basic/male/walk/black.png",
    "hat/magic/wizard/base/adult/walk/purple.png",
  ],
  rogue: [
    BODY, HEAD, HAIR,
    "torso/armour/leather/male/walk.png",
    "legs/pants/male/walk/black.png",
    "feet/boots/basic/male/walk/black.png",
    "hat/cloth/hood/adult/walk.png",
  ],
};

// Minimal CSV row parser (quoted fields may contain commas).
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function loadCreditsCsv(lpcRoot) {
  const path = join(lpcRoot, "CREDITS.csv");
  if (!existsSync(path)) return null;
  const rows = new Map();
  const lines = readFileSync(path, "utf8").split("\n");
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [filename, , authors, licenses, urls] = parseCsvLine(line);
    if (filename) {
      rows.set(filename, {
        authors: authors ? authors.split(",").map((s) => s.trim()).filter(Boolean) : [],
        licenses: licenses ? licenses.split(",").map((s) => s.trim()).filter(Boolean) : [],
        urls: urls ? urls.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
    }
  }
  return rows;
}

// A colour variant (…/walk/purple.png) credits like its base sheet (…/walk.png).
function csvLookup(rows, file) {
  if (rows.has(file)) return rows.get(file);
  const m = file.match(/^(.*\/walk)\/[^/]+\.png$/);
  if (m && rows.has(m[1] + ".png")) return rows.get(m[1] + ".png");
  return null;
}

const lpcRoot = process.env.LPC_ROOT || join(here, "..", "..", "..", "..", "..", "..", "Universal-LPC-Spritesheet-Character-Generator");
const csv = loadCreditsCsv(lpcRoot);
const baseByFile = new Map(base.items.map((it) => [it.file, it]));

for (const ch of catalog.characters) {
  const recipe = RECIPES[ch.slug];
  let items;
  let note;
  if (csv && recipe) {
    items = recipe.map((file) => {
      const hit = csvLookup(csv, file);
      if (hit) return { file, ...hit };
      const fallback = baseByFile.get(file);
      if (fallback) return fallback;
      return { file, authors: [], licenses: [], urls: [], note: "not found in CREDITS.csv — check manually" };
    });
    note =
      "Baked from the full Universal-LPC art (one layer per line below; hair — and the " +
      "rogue hood — colorised, everything else used as-is or as the generator's own " +
      "colour variant). The art licences are per layer — ship these credits with any " +
      "build that uses this character.";
  } else {
    items = base.items;
    note =
      "Baked from the embedded LPC pack and recoloured (legs/feet/hair colorised; " +
      "body/head kept as-is). Recolouring does not change the art licences below — " +
      "ship these credits with any build that uses this character.";
  }
  const out = {
    character: ch.name,
    id: ch.id,
    slug: ch.slug,
    derivedFrom: csv && recipe ? "Universal-LPC-Spritesheet-Character-Generator" : base.pack,
    note,
    source: base.source,
    items,
  };
  const path = join(here, ch.slug, "credits.json");
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log("wrote", path, csv && recipe ? "(full-art credits)" : "(embedded-pack credits)");
}
