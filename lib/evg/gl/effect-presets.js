// SPDX-License-Identifier: MIT
//
// The preset blocks in `effect-presets.css`, as data.
//
// One reader, three callers: `effect-shots.mjs` paints them, `fx-check.mjs`
// holds each one to producing the effect it names, and the gallery demo's
// background picker pastes one into the stylesheet it is editing. A second
// copy of this regex would be a second answer to "what does that file say".
//
// NOT A CSS PARSER, and it does not need to be: the file is this repository's
// own, every block in it is `.name { prop: value; … }`, and the only
// declarations that matter to a shader are the `evg-fx-*` numbers. The ENGINE
// parses the same file for real in `fx-check.mjs`, which compares every
// declaration it read against what came out of here — so this staying simple
// is checked rather than hoped for.
//
// No `fs` here on purpose: the gallery bundle imports this, and a browser has
// no filesystem. The caller brings the text.

/** Every preset block in `src`, as
 *  `{ name, kind, trigger, title, params, background, body }`.
 *
 *  `kind` is the block's own `evg-surface-effect`, so nothing here knows which
 *  effects exist — the presets say. `body` is the block's declarations exactly
 *  as written, which is what makes one paste-able. */
export function parsePresets(src) {
  const out = [];
  for (const m of src.matchAll(/\.((?:sky|fx)-[a-z-]+)\s*\{([^}]*)\}/g)) {
    const params = {};
    let kind = "";
    let trigger = "";
    let background = [0, 0, 0, 1];
    for (const d of m[2].matchAll(/([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      const name = d[1].trim();
      const value = d[2].trim();
      if (name.startsWith("evg-fx-")) params[name.slice("evg-fx-".length)] = Number(value);
      else if (name === "evg-surface-effect") kind = value;
      else if (name === "evg-effect-on") trigger = value;
      else if (name === "background-color") {
        const rgb = value.match(/-?\d+(\.\d+)?/g).map(Number);
        background = [rgb[0], rgb[1], rgb[2], rgb.length > 3 ? rgb[3] : 1];
      }
    }
    // The comment above the block is its caption; the presets are documented
    // for a reader, so a picture and a menu may as well say the same thing.
    // The LAST comment before the block, not the first one in the file —
    // which is what a match over everything preceding it finds, and it
    // labelled all five pictures with the name of the first.
    const before = src.slice(0, m.index);
    const opened = before.lastIndexOf("/*");
    const note = opened < 0 ? null : before.slice(opened).match(/^\/\*\s*([A-Z][A-Z ']+)\./);
    out.push({
      name: m[1],
      kind,
      trigger,
      title: note ? note[1].toLowerCase() : m[1],
      params,
      background,
      body: m[2].trim(),
    });
  }
  return out;
}
