#!/usr/bin/env node
// Regenerate gallery/game_engine/v2/interp/migrate/src/LocaleData.rgr.
//
//   node gallery/game_engine/v2/interp/migrate/tools/gen-locale-data.cjs
//
// The data behind Intl.NumberFormat and Intl.DateTimeFormat: which character
// separates thousands, which separates the fraction, where the month goes
// relative to the day, and what the months and weekdays are called. None of it
// can be reasoned out -- it is CLDR, and it has to be carried.
//
// As with the Unicode tables, the GENERATED FILE IS THE SOURCE OF TRUTH and is
// committed; no target needs this script in order to build. It is read off the
// host's CLDR data and every locale is verified by formatting a set of sample
// values and comparing against the host before the file is written.
//
// The locale list is deliberate rather than exhaustive: 39 locales covering the
// languages a document is likely to be typeset in. A locale outside the list
// falls back to "en", which is what an implementation without its data is
// permitted to do -- and the resolvedOptions() of such a request says "en", so
// a program can see that it did not get what it asked for.
"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "LocaleData.rgr");

const LOCALES = [
  "en", "en-GB", "de", "fr", "es", "it", "nl", "pt", "pt-BR", "sv", "da", "nb",
  "fi", "is", "et", "cs", "sk", "pl", "hu", "tr", "ru", "uk", "el", "ro", "bg",
  "hr", "sl", "lt", "lv", "ja", "ko", "zh", "zh-TW", "he", "hi", "th", "vi",
  "id", "ca",
];

// Currencies worth carrying a symbol for. The rest fall back to the code.
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "SEK", "NOK", "DKK",
  "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "RUB", "UAH", "TRY", "CNY", "KRW",
  "INR", "BRL", "CAD", "AUD", "NZD", "ZAR", "MXN", "ILS", "THB", "IDR", "VND"];

const UTC = { timeZone: "UTC" };

/**
 * The affixes of a formatted number, found by formatting a known value and
 * taking everything outside the digits. Modelling them as "a sign goes here"
 * was wrong in three ways at once: German puts a space before the percent
 * sign, Dutch puts the minus after the currency symbol, and the symbol is
 * sometimes a prefix and sometimes a suffix.
 */
function affixes(loc, opts, value) {
  const parts = new Intl.NumberFormat(loc, opts).formatToParts(value);
  const isNum = (t) => t === "integer" || t === "group" || t === "decimal" ||
                       t === "fraction";
  const first = parts.findIndex((p) => isNum(p.type));
  let last = -1;
  for (let i = parts.length - 1; i >= 0; i--) if (isNum(parts[i].type)) { last = i; break; }
  const join = (a, b) => parts.slice(a, b).map((p) => p.value).join("");
  return [join(0, first), join(last + 1, parts.length)];
}

/** Decimal, group, minus and percent signs, plus the grouping sizes. */
function numberSymbols(loc) {
  const parts = new Intl.NumberFormat(loc).formatToParts(-1234567.89);
  const pick = (t) => { const p = parts.find((x) => x.type === t); return p ? p.value : ""; };
  const pct = new Intl.NumberFormat(loc, { style: "percent" })
    .formatToParts(0.5).find((x) => x.type === "percentSign");
  // Grouping sizes: how many digits in the last group, and in the ones before
  // it. They differ in South Asian locales, which group 3 then 2.
  const g = new Intl.NumberFormat(loc).formatToParts(1234567890)
    .filter((x) => x.type === "integer").map((x) => x.value);
  const primary = g.length > 1 ? g[g.length - 1].length : 3;
  const secondary = g.length > 2 ? g[g.length - 2].length : primary;
  // CLDR's minimumGroupingDigits: Spanish and Italian do not group a
  // four-digit number at all, so 9876.5 is "9876,5" and not "9.876,5".
  const grouped4 = new Intl.NumberFormat(loc).format(1234).indexOf(pick("group")) >= 0;
  const minGroup = pick("group") === "" ? 1 : (grouped4 ? 1 : 2);
  return {
    decimal: pick("decimal") || ".",
    group: pick("group"),
    minus: pick("minusSign") || "-",
    percent: pct ? pct.value : "%",
    primary,
    secondary,
    minGroup,
  };
}

/**
 * Month and weekday names as they appear IN A DATE, not standing alone.
 *
 * Several languages inflect: Finnish May is "toukokuu" on its own and
 * "toukokuuta" inside a date, Finnish Friday is "perjantai" alone and
 * "perjantaina" in a date, and Czech, Slovak, Polish and Russian do the same.
 * Taking the standalone form put the wrong word in every long date in those
 * languages. So each name is extracted from a real formatted date.
 */
function names(loc) {
  const monthLong = [], monthShort = [], dayLong = [], dayShort = [];
  const partOf = (d, opts, type) => {
    const p = new Intl.DateTimeFormat(loc, { ...opts, ...UTC }).formatToParts(d);
    const hit = p.find((x) => x.type === type);
    return hit ? hit.value : "";
  };
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(2021, m, 15));
    monthLong.push(partOf(d, { year: "numeric", month: "long", day: "numeric" }, "month"));
    monthShort.push(partOf(d, { year: "numeric", month: "short", day: "numeric" }, "month"));
  }
  for (let w = 0; w < 7; w++) {
    // 2021-08-01 was a Sunday.
    const d = new Date(Date.UTC(2021, 7, 1 + w));
    dayLong.push(partOf(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" }, "weekday"));
    dayShort.push(partOf(d, { weekday: "short", year: "numeric", month: "short", day: "numeric" }, "weekday"));
  }
  return { monthLong, monthShort, dayLong, dayShort };
}

/**
 * A format pattern, as the sequence of fields and literals the host produces.
 * Recorded rather than guessed: the ORDER is the whole point (en is month first,
 * en-GB day first, ja year first) and so are the separators, which are "/" in
 * one place, "." in another and ". " with a trailing dot in Hungarian.
 */
function pattern(loc, opts) {
  // 2021-05-07 15:04:05: every numeric field is a SINGLE digit, so the length
  // of the value the host produces IS the zero-padded width. Guessing it was
  // wrong in both directions -- Polish pads the month but not the day, Latvian
  // the same, and English pads neither.
  const d = new Date(Date.UTC(2021, 4, 7, 15, 4, 5));
  const fmt = new Intl.DateTimeFormat(loc, { ...opts, ...UTC });
  const parts = fmt.formatToParts(d);
  // Width 0 means "this field is a NAME". Inferring it from the length was
  // wrong for Korean, whose long-date month is 5월 -- two characters, exactly
  // like a zero-padded number.
  const textual = (v) => /[^0-9]/.test(v);
  let out = parts.map((p) => [
    p.type,
    p.type === "literal" ? p.value : "",
    p.type === "literal" ? 0 : (textual(p.value) ? 0 : p.value.length),
  ]);
  // formatToParts and format do not always agree: the host reports the space
  // before AM/PM as U+202F through the parts API and emits a plain space
  // through format(). Real code calls format(), so that is what the table has
  // to reproduce -- and reassembling the parts here is what proves it does.
  const want = fmt.format(d);
  const rebuild = (list) => list.map(([t, lit], i) =>
    t === "literal" ? lit : parts[i].value).join("");
  if (rebuild(out) !== want) {
    const fixed = out.map(([t, lit, w]) =>
      [t, t === "literal" ? lit.replace(/\u202f/g, " ").replace(/\u00a0/g, " ") : lit, w]);
    if (rebuild(fixed) === want) return fixed;
    throw new Error("pattern does not reassemble for " + loc + ": " +
      JSON.stringify(rebuild(out)) + " vs " + JSON.stringify(want));
  }
  return out;
}

/**
 * The currency affixes for a locale, as templates. XXX has no symbol of its
 * own -- it formats as the letters "XXX" -- so formatting with it and then
 * substituting the real symbol recovers the pattern exactly, including where
 * the minus sign goes relative to the symbol, which Dutch and English disagree
 * about.
 */
const endsWithLetter = (s) => /\p{L}$/u.test(s);
const startsWithLetter = (s) => /^\p{L}/u.test(s);

/** The currency symbol a code has in a locale. */
function symbolOf(loc, cur) {
  const p = new Intl.NumberFormat(loc, { style: "currency", currency: cur })
    .formatToParts(1).find((x) => x.type === "currency");
  return p ? p.value : cur;
}

/**
 * Currency affix templates, TWICE: once for a symbol that is letters and once
 * for a symbol that is not.
 *
 * CLDR inserts a space between the symbol and the digits only when the two
 * would otherwise run letter-into-digit. Japanese writes "€1,234" with no
 * space and "US$ 1,234" with one, from the same pattern -- so one template per
 * locale gave every CJK currency the wrong spacing for half the symbols.
 */
function currencyAffixes(loc) {
  const build = (cur) => {
    const mark = symbolOf(loc, cur);
    const sub = (a) => a.map((x) => x.split(mark).join("\u00a4"));
    return [
      ...sub(affixes(loc, { style: "currency", currency: cur }, 1234.5)),
      ...sub(affixes(loc, { style: "currency", currency: cur }, -1234.5)),
    ];
  };
  // XXX always renders as letters or as the currency sign; find a carried
  // currency whose symbol in this locale is NOT letters for the other variant.
  const nonLetter = CURRENCIES.find((c) => {
    const s = symbolOf(loc, c);
    return !endsWithLetter(s) && !startsWithLetter(s);
  });
  const letterCur = CURRENCIES.find((c) => {
    const s = symbolOf(loc, c);
    return endsWithLetter(s) || startsWithLetter(s);
  }) || "XXX";
  return [...build(letterCur), ...build(nonLetter || letterCur)];
}

/** The symbol each carried currency has in this locale. */
function currencySymbols(loc) {
  return CURRENCIES.map((cur) => {
    const parts = new Intl.NumberFormat(loc, { style: "currency", currency: cur })
      .formatToParts(1);
    const sym = parts.find((p) => p.type === "currency");
    return sym ? sym.value : cur;
  });
}

// --- emit -------------------------------------------------------------------
function strLiteral(list, indent) {
  const pad = " ".repeat(indent);
  const esc = (s) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  const parts = [];
  let line = "";
  for (const s of list) {
    const t = esc(s);
    if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return '([] _:string ())';
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

function intLiteral(list, indent) {
  const pad = " ".repeat(indent);
  const parts = [];
  let line = "";
  for (const n of list) {
    const t = String(n);
    if (line.length + t.length + 1 > 88) { parts.push(line); line = ""; }
    line += (line ? " " : "") + t;
  }
  if (line) parts.push(line);
  if (!parts.length) return "([] _:int ())";
  return "([]\n" + parts.map((l) => pad + "    " + l).join("\n") + "\n" + pad + ")";
}

// Field codes used in the flattened patterns.
const FIELD = { literal: 0, year: 1, month: 2, day: 3, weekday: 4, hour: 5,
                minute: 6, second: 7, dayPeriod: 8, era: 9, timeZoneName: 10 };

function main() {
  const tags = [];
  const numStr = [];        // decimal, group, minus, percent per locale
  const numInt = [];        // primary, secondary per locale
  const nameStr = [];       // 12+12+7+7 per locale
  const patInt = [];        // flattened patterns
  const patStr = [];        // the literals the patterns refer to
  const curStr = [];
  const curInt = [];

  // Which patterns to carry, in this order.
  const PATTERNS = [
    {},                                                                  // the DEFAULT date, which is what `new Intl.DateTimeFormat(loc).format(d)` produces
    { year: "numeric", month: "long", day: "numeric" },                  // long date
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }, // full date
    { timeStyle: "short" },                                              // short time
    { timeStyle: "medium" },   // the DEFAULT time, which toLocaleTimeString gives
    // Date AND time, which is what toLocaleString gives. Carried whole rather
    // than glued together from the two halves: the joiner is ", " in English
    // and a plain space in French, and that is not derivable from either part.
    { dateStyle: "short", timeStyle: "medium" },
  ];

  for (const loc of LOCALES) {
    tags.push(loc.toLowerCase());
    const n = numberSymbols(loc);
    // Four symbols, then the four decimal affixes, the four percent affixes
    // and the four currency affix templates.
    const dec = affixes(loc, {}, 1234.5);
    const decNeg = affixes(loc, {}, -1234.5);
    const pct = affixes(loc, { style: "percent" }, 0.5);
    const pctNeg = affixes(loc, { style: "percent" }, -0.5);
    numStr.push(n.decimal, n.group, n.minus, n.percent);
    numStr.push(dec[0], dec[1], decNeg[0], decNeg[1]);
    numStr.push(pct[0], pct[1], pctNeg[0], pctNeg[1]);
    numStr.push(...currencyAffixes(loc));   // 8: letter-symbol then symbol-symbol
    // The day-period words, which are not always AM/PM and not always
    // separated by an ordinary space.
    const dp = (h) => {
      const p = new Intl.DateTimeFormat(loc, { hour: "numeric", hour12: true, ...UTC })
        .formatToParts(new Date(Date.UTC(2021, 0, 1, h)));
      const hit = p.find((x) => x.type === "dayPeriod");
      return hit ? hit.value : "";
    };
    numStr.push(dp(9), dp(15));
    numInt.push(n.primary, n.secondary, n.minGroup);
    const nm = names(loc);
    nameStr.push(...nm.monthLong, ...nm.monthShort, ...nm.dayLong, ...nm.dayShort);
    // hour12 for this locale, read off a formatted time.
    const h12 = new Intl.DateTimeFormat(loc, { hour: "numeric", ...UTC })
      .resolvedOptions().hour12 ? 1 : 0;
    // Thai dates default to the BUDDHIST calendar, which is the Gregorian year
    // plus 543 -- 2021 prints as 2564. Carried as an offset rather than as a
    // calendar, because that is all the difference amounts to for formatting.
    const yp = new Intl.DateTimeFormat(loc, { year: "numeric", ...UTC })
      .formatToParts(new Date(Date.UTC(2021, 4, 7))).find((x) => x.type === "year");
    const shown = yp ? parseInt(yp.value.replace(/[^0-9]/g, ""), 10) : 2021;
    numInt.push(h12, Number.isFinite(shown) ? shown - 2021 : 0);
    // numInt is (primary, secondary, minGroup, hour12, yearOffset)
    for (const opts of PATTERNS) {
      const p = pattern(loc, opts);
      patInt.push(p.length);
      for (const [type, lit, width] of p) {
        patInt.push(FIELD[type] === undefined ? 0 : FIELD[type]);
        patInt.push(patStr.length);
        patInt.push(width);
        patStr.push(lit);
      }
    }
    for (const cur of CURRENCIES) {
      const sym = symbolOf(loc, cur);
      curStr.push(cur, sym);
      // Whether this symbol is letters, which is what decides the spacing.
      curInt.push((endsWithLetter(sym) || startsWithLetter(sym)) ? 1 : 0);
    }
  }

  const header = `; =============================================================================
; LocaleData.rgr - the CLDR data behind Intl, as data
; =============================================================================
;
; GENERATED. Do not edit by hand; regenerate with
;
;   node gallery/game_engine/v2/interp/migrate/tools/gen-locale-data.cjs
;
; Which character separates thousands, which separates the fraction, where the
; month goes relative to the day, what the months are called. None of it can be
; reasoned out -- it is CLDR, and it has to be carried.
;
; ${LOCALES.length} locales, chosen for the languages a document is likely to be typeset
; in rather than for coverage. A locale outside the list falls back to "en",
; and resolvedOptions() then reports "en", so a program can see that it did not
; get what it asked for.
;
; TAGS is one lowercased tag per locale; every other table is indexed by the
; same position.
; NUMSTR is 22 strings per locale: the four symbols (decimal, group, minus,
;   percent), then the affixes that go outside the digits -- decimal positive
;   and negative, percent positive and negative, currency positive and negative
;   with U+00A4 standing in for the symbol, in two variants because
;   the spacing depends on whether the symbol is letters -- and the two
;   day-period words. Affixes are recorded rather than modelled because German puts a
;   space before the percent sign and Dutch puts the minus after the currency
;   symbol.
; NUMINT is (primary grouping size, secondary grouping size, minimum grouping
;   digits, hour12, year offset) per locale. The year offset is 543 for Thai,
;   whose dates default to the Buddhist calendar, and 0 everywhere else. The two sizes differ in South Asian locales,
;   which group 3 then 2; the minimum is 2 in Spanish and Italian, which do not
;   group a four-digit number at all.
; NAMES is 12 long months, 12 short months, 7 long weekdays, 7 short weekdays
;   per locale, Sunday first.
; PATINT holds six patterns per locale -- the DEFAULT date, long date, full
;   date, short time, default time, date-and-time -- each as (field count, then (field code,
;   literal index, width) triples). Field codes: 0 literal, 1 year, 2 month,
;   3 day, 4 weekday, 5 hour, 6 minute, 7 second, 8 dayPeriod, 9 era,
;   10 timeZoneName. WIDTH is the zero-padded digit count the locale uses for
;   that field in that pattern, observed rather than assumed: Polish pads the
;   month but not the day.
; CURSTR is (code, symbol) for each carried currency, per locale; where the
;   symbol goes is in the currency affixes in NUMSTR.

class LocaleData {

    static sfn tags:[string] () {
        return ${strLiteral(tags, 8)}
    }

    static sfn numStrings:[string] () {
        return ${strLiteral(numStr, 8)}
    }

    static sfn numInts:[int] () {
        return ${intLiteral(numInt, 8)}
    }

    static sfn names:[string] () {
        return ${strLiteral(nameStr, 8)}
    }

    static sfn patternInts:[int] () {
        return ${intLiteral(patInt, 8)}
    }

    static sfn patternStrings:[string] () {
        return ${strLiteral(patStr, 8)}
    }

    static sfn currencyStrings:[string] () {
        return ${strLiteral(curStr, 8)}
    }

    static sfn currencyInts:[int] () {
        return ${intLiteral(curInt, 8)}
    }

    static sfn currencyCount:int () {
        return ${CURRENCIES.length}
    }
}
`;
  fs.writeFileSync(OUT, header);
  console.log("wrote " + path.relative(process.cwd(), OUT) +
    "  locales: " + LOCALES.length +
    "  names: " + nameStr.length +
    "  pattern ints: " + patInt.length +
    "  currencies: " + CURRENCIES.length);
}

main();
