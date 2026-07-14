#!/usr/bin/env node
// Emit per-character credits.json for pack/characters/<slug>/.
//
// Every character in this ready set is baked from the embedded demo-male-walk
// pack (its layers carry the real LPC attribution) and then recoloured. The art
// licences are unchanged by recolouring, so each character inherits the base
// attribution plus a note recording the derivation. Re-run after editing the
// catalog or the base pack credits:
//
//   node gallery/game_engine/lpc/pack/characters/build-credits.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, "catalog.json"), "utf8"));
const base = JSON.parse(readFileSync(join(here, "..", "demo-male-walk", "credits.json"), "utf8"));

for (const ch of catalog.characters) {
  const out = {
    character: ch.name,
    id: ch.id,
    slug: ch.slug,
    derivedFrom: base.pack,
    note:
      "Baked from the embedded LPC pack and recoloured (legs/feet/hair colorised; " +
      "body/head kept as-is). Recolouring does not change the art licences below — " +
      "ship these credits with any build that uses this character.",
    source: base.source,
    items: base.items,
  };
  const path = join(here, ch.slug, "credits.json");
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log("wrote", path);
}
