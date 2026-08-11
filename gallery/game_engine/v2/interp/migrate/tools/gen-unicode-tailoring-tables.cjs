#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/UnicodeTailor.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-tailoring-tables.cjs
//
// localeCompare's second argument was ignored, so `a.localeCompare(b, 'sv')`
// answered the ROOT order. That is right for English, French, German, Italian,
// Dutch and Portuguese -- their alphabets are the root alphabet -- and silently
// wrong for the ones that tailor it: Swedish å ä ö sort after z, Czech ch is a
// letter between h and i, Hungarian cs and zs are letters of their own, Turkish
// dotless ı sorts before i, Spanish ñ is a letter after n. A book index built
// in any of those languages came out misfiled with no error anywhere.
//
// WHAT A TAILORING IS HERE: every one of them turns out to fit one shape --
// "this element sorts immediately after that root letter, in this position".
// Swedish is å→after z at 1, ä at 2, ö at 3; Czech is č→after c at 1 and
// ch→after h at 1. An element may be more than one character (Czech ch,
// Hungarian dzs, Croatian lj), which is a contraction, and it may be a letter
// plus a combining mark, because the key builder works on decomposed text.
//
// So a locale is a list of (anchor letter, offset, element), and the engine
// gives a matched element the primary weight of its anchor plus the offset.
// Root weights are scaled to leave room for the offsets.
//
// As with the other tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build. The orderings are
// read off the host's CLDR data and every locale is verified by re-sorting its
// own alphabet and a word list before the file is written.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "UnicodeTailor.rgr");

// Locales worth carrying. The ones left out are not missing -- de, fr, en, it,
// nl, pt and the rest use the root alphabet, and the generator asserts that by
// emitting nothing for them.
const LOCALES = [
  "sv", "da", "nb", "nn", "fi", "is", "fo", "et", "cs", "sk", "pl", "hu",
  "tr", "az", "es", "hr", "bs", "sr-latn", "sl", "lt", "lv", "ro", "sq", "vi",
  "tk", "de", "fr", "en", "it", "nl", "pt", "ca", "gl", "eu", "cy", "ga",
];

// Multi-character elements to test for. A contraction cannot be discovered by
// looking at single characters, so the candidates have to be named.
const DIGRAPHS = [
  "ch", "cs", "dz", "dzs", "gy", "ly", "ny", "sz", "ty", "zs", "lj", "nj",
  "dž", "ll", "rr", "aa", "ij", "ss",
];
const ASCII = "abcdefghijklmnopqrstuvwxyz".split("");

const pts = (s) => Array.from(s).map((c) => c.codePointAt(0));

/** The locale's alphabet: primary-distinct elements, in its own order. */
function alphabetOf(loc) {
  const base = new Intl.Collator(loc, { sensitivity: "base" });
  const cands = new Set(ASCII);
  for (let cp = 0xc0; cp <= 0x24f; cp++) {
    const ch = String.fromCodePoint(cp);
    if (/\p{Ll}/u.test(ch)) cands.add(ch);
  }
  for (const d of DIGRAPHS) cands.add(d);
  const keep = [...cands].filter((e) =>
    ASCII.includes(e) || !ASCII.some((a) => base.compare(e, a) === 0));
  keep.sort((a, b) => base.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0));
  return keep;
}

/**
 * (anchor, offset, element) for everything the locale places itself.
 *
 * An element anchors to the last ASCII letter that is still in its ROOT
 * position, which is tracked by walking a-z alongside the locale's alphabet.
 * Assuming instead that every ASCII letter is an anchor was wrong for the
 * locales that move one: Azerbaijani puts x after h and q after k, Lithuanian
 * and Latvian put y after i. Those letters are tailored like any other.
 */
function tailoringOf(loc) {
  const alpha = alphabetOf(loc);
  const out = [];
  let anchor = null;
  let offset = 0;
  let expect = 0;                       // index into ASCII of the next anchor
  for (const e of alpha) {
    if (expect < ASCII.length && e === ASCII[expect]) {
      anchor = e;
      offset = 0;
      expect++;
      continue;
    }
    if (anchor === null) continue;      // sorts before 'a': leave it to root
    offset++;
    out.push([anchor.codePointAt(0), offset, pts(e.normalize("NFD"))]);
  }
  return out;
}

/**
 * Combining marks in secondary order -- the same table the root collation
 * generator emits. The reference below needs it or it cannot separate two
 * elements that tie at the primary level, like ae-with-macron from
 * ae-with-acute, and it reports a mismatch that is not one.
 */
const MARK_RANK = (() => {
  const acc = new Intl.Collator(undefined, { sensitivity: "accent" });
  const marks = [];
  for (let cp = 0x300; cp <= 0x1dff; cp++) {
    if (/\p{Mn}/u.test(String.fromCodePoint(cp))) marks.push(cp);
  }
  marks.sort((a, b) =>
    acc.compare("a" + String.fromCodePoint(a), "a" + String.fromCodePoint(b)) || a - b);
  const m = new Map();
  marks.forEach((cp, i) => m.set(cp, i));
  return m;
})();

// --- reference implementation, mirroring the engine's key builder -----------
function makeRef(tailor) {
  const byLen = [...tailor].sort((a, b) => b[2].length - a[2].length);
  function primaryOf(cps, i) {
    for (const [anchor, off, el] of byLen) {
      if (i + el.length > cps.length) continue;
      let ok = true;
      for (let k = 0; k < el.length; k++) if (cps[i + k] !== el[k]) { ok = false; break; }
      if (ok) return { w: (100000 + anchor) * 1000 + off, used: el.length };
    }
    return null;
  }
  return function keys(s) {
    const d = pts(s.normalize("NFD"));
    const prim = [], sec = [];
    for (let i = 0; i < d.length; ) {
      const hit = primaryOf(d, i);
      if (hit) { prim.push(hit.w); i += hit.used; continue; }
      const ch = String.fromCodePoint(d[i]);
      if (/\p{M}/u.test(ch)) {
        const r = MARK_RANK.get(d[i]);
        sec.push(r === undefined ? 1000000 + d[i] : r);
        i++;
        continue;
      }
      prim.push((100000 + ch.toLowerCase().codePointAt(0)) * 1000);
      i++;
    }
    return [prim, sec];
  };
}

function cmpArr(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
}

const WORDS = {
  sv: ["apa", "bok", "zebra", "åka", "ängel", "öl"],
  da: ["and", "bo", "zoo", "æble", "ø", "års"],
  nb: ["and", "bo", "zoo", "æble", "ø", "års"],
  fi: ["auto", "valo", "zebra", "åka", "ähtäri", "öljy"],
  is: ["afi", "ára", "dagur", "ðar", "eldur", "þak", "æði", "ös"],
  et: ["saag", "šokk", "zoo", "žurnaal", "tuba", "vald", "õun", "äär", "öö", "üks"],
  cs: ["cukr", "čaj", "dům", "hora", "chleba", "ráno", "řeka", "sýr", "šum", "zub", "žena"],
  sk: ["cukor", "čaj", "hora", "chlieb", "ráno", "sýr", "šum", "zub", "žena"],
  pl: ["akta", "ąkra", "cena", "ćma", "lampa", "łoś", "noc", "ńma", "zebra", "źle", "żaba"],
  hu: ["cukor", "csok", "daru", "dzsem", "gomb", "gyors", "sor", "szo", "tea", "tyuk", "zab", "zsir"],
  tr: ["adam", "çay", "ışık", "ilik", "iyi", "orta", "öte", "su", "şeker", "ulu", "üzüm"],
  es: ["ano", "año", "nube", "ñu", "zapato"],
  hr: ["cesta", "čast", "ćup", "dan", "džep", "đak", "luk", "ljut", "nos", "njiva", "sat", "šuma", "zub", "žaba"],
  sl: ["cesta", "čast", "dan", "sat", "šuma", "zub", "žaba"],
  ro: ["ac", "ăsta", "ând", "iar", "împreună", "sac", "șapte", "tac", "țap"],
  vi: ["an", "ăn", "ân", "da", "đa", "en", "ên", "on", "ôn", "ơn", "un", "ưn"],
  lt: ["ave", "čia", "eglė", "ilgas", "sala", "šaka", "zebras", "žalias"],
  lv: ["ala", "āra", "cita", "čaks", "ela", "ēna", "gads", "ģimene", "zeme", "žogs"],
  sq: ["ari", "çaj", "era", "ëma", "lule", "llull", "nate", "njeri", "rri", "rrota"],
  de: ["Apfel", "Ärger", "Öl", "Straße", "Zug"],
  fr: ["cote", "coté", "côte", "côté", "eleve", "élève"],
  en: ["apple", "café", "Éclair", "naive", "Zebra"],
};

function literal(nums, indent) {
  const pad = " ".repeat(indent);
  const parts = [];
  let line = "";
  for (const n of nums) {
    const t = String(n);
    if (line.length + t.length + 1 > 92) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return "([] _:int ())";
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function main() {
  const tables = [];
  let bad = 0;
  let rootOnly = [];
  for (const loc of LOCALES) {
    const tailor = tailoringOf(loc);
    const keys = makeRef(tailor);
    const cmp = (a, b) => {
      const ka = keys(a), kb = keys(b);
      return cmpArr(ka[0], kb[0]) || cmpArr(ka[1], kb[1]) ||
             (a < b ? -1 : a > b ? 1 : 0);
    };
    // Verify: the locale's own alphabet and its word list must come out in the
    // order the host puts them.
    const coll = new Intl.Collator(loc);
    // The alphabet is checked one representative per PRIMARY class: two
    // elements that tie at the primary level are separated by the root's
    // secondary rules, which are the other generator's business, not this
    // one's. The word lists are checked whole.
    const baseColl = new Intl.Collator(loc, { sensitivity: "base" });
    const alpha = alphabetOf(loc);
    const reps = alpha.filter((e, i) => i === 0 || baseColl.compare(alpha[i - 1], e) !== 0);
    for (const list of [reps, WORDS[loc] || []]) {
      if (!list.length) continue;
      const mine = list.slice().sort(cmp).join(" ");
      const host = list.slice().sort((a, b) => coll.compare(a, b)).join(" ");
      if (mine !== host) {
        bad++;
        console.error("MISMATCH " + loc + "\n  mine: " + mine + "\n  host: " + host);
      }
    }
    // A locale whose tailoring is exactly the root's carries no table.
    const rootTailor = JSON.stringify(tailoringOf("en"));
    if (JSON.stringify(tailor) === rootTailor) { rootOnly.push(loc); continue; }
    tables.push([loc, tailor]);
  }
  if (bad) {
    console.error("refusing to write: " + bad + " mismatches");
    process.exit(1);
  }
  console.log("verified " + LOCALES.length + " locales; root order: " + rootOnly.join(" "));

  // Flatten: for each locale, the tag as code points, then the entries.
  const tagFlat = [];
  const entryFlat = [];
  for (const [loc, tailor] of tables) {
    const tag = pts(loc);
    tagFlat.push(tag.length, ...tag, entryFlat.length, tailor.length);
    for (const [anchor, off, el] of tailor) {
      entryFlat.push(anchor, off, el.length, ...el);
    }
  }

  const header = `; =============================================================================
; UnicodeTailor.rgr - per-locale collation tailorings, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-unicode-tailoring-tables.cjs
;
; localeCompare's second argument used to be ignored, so a.localeCompare(b,'sv')
; answered the ROOT order. That is right for English, French, German, Italian,
; Dutch and Portuguese -- their alphabets ARE the root alphabet, and the
; generator asserts it by emitting nothing for them -- and silently wrong for
; every language that tailors it. Swedish sorts å ä ö after z; Czech treats ch
; as a letter between h and i; Hungarian cs and zs are letters of their own;
; Turkish dotless ı sorts before i; Spanish ñ is a letter after n. A book index
; built in any of those came out misfiled, with no error anywhere.
;
; Every tailoring fits one shape: an ELEMENT sorts immediately after an ANCHOR
; letter, at an OFFSET. Swedish is å after z at 1, ä at 2, ö at 3. An element
; may be several characters (Czech ch, Hungarian dzs, Croatian lj) -- that is a
; contraction -- and it is stored DECOMPOSED, because the key builder works on
; decomposed text, so Swedish å is stored as a + combining ring.
;
; LOCALES is (tag length, tag points..., entry offset, entry count) per locale.
; ENTRIES is (anchor, offset, element length, element points...) laid end to
; end. Locales verified against the host's CLDR data: ${LOCALES.length}.

class UnicodeTailor {

    static sfn locales:[int] () {
        return ${literal(tagFlat, 8)}
    }

    static sfn entries:[int] () {
        return ${literal(entryFlat, 8)}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  tailored locales: " + tables.length +
    "  entries: " + tables.reduce((n, [, t]) => n + t.length, 0));
}

main();
