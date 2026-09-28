// SPDX-License-Identifier: AGPL-3.0-or-later
//! Unicode normalization (NFC / NFD), collation with per-locale tailorings,
//! and the property sets of `\p{…}`: ComponentEngine's algorithms
//! (interp/migrate/src/ComponentEngine.rgr, D-NFC and D-COLLATE; Regex.rgr,
//! D-PROPS) over its generated tables, which `unidata.rs` carries as
//! strings of integers. A VM loads a table the first time it needs it.

use ranger::prelude::*;

use crate::jsstr;
use crate::unidata::*;

/// The integers of a generated table.
pub fn ints(s: &str) -> Vec<int> {
    let u = jsstr::units(s);
    let mut out: Vec<int> = Vec::new();
    let mut v: int = 0;
    let mut any = false;
    let n = u.len();
    let mut i: usize = 0;
    while i < n {
        let c = u[i];
        if c == 44 {
            out.push(v);
            v = 0;
            any = false;
        } else {
            v = v * 10 + (c - 48);
            any = true;
        }
        i += 1;
    }
    if any {
        out.push(v);
    }
    out
}

/// The strings of a generated table (each its length, then code points).
pub fn strs(s: &str) -> Vec<String> {
    let v = ints(s);
    let mut out: Vec<String> = Vec::new();
    let n = v.len();
    let mut i: usize = 0;
    while i < n {
        let len = v[i] as usize;
        let mut t = String::new();
        let mut k: usize = 0;
        while k < len {
            jsstr::push_cp(&mut t, v[i + 1 + k]);
            k += 1;
        }
        out.push(t);
        i += 1 + len;
    }
    out
}

/// The code points of a string (a surrogate pair is one).
pub fn cps_of(s: &str) -> Vec<int> {
    let u = jsstr::units(s);
    let n = u.len();
    let mut out: Vec<int> = Vec::new();
    let mut i: usize = 0;
    while i < n {
        let c = u[i];
        if c >= 0xd800 && c <= 0xdbff && i + 1 < n {
            let d = u[i + 1];
            if d >= 0xdc00 && d <= 0xdfff {
                out.push(0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00));
                i += 2;
                continue;
            }
        }
        out.push(c);
        i += 1;
    }
    out
}

pub fn from_cps(v: &Vec<int>) -> String {
    let mut s = String::new();
    let mut i: usize = 0;
    while i < v.len() {
        jsstr::push_cp(&mut s, v[i]);
        i += 1;
    }
    s
}

/// The simple lowercase of one code point (the first of a longer mapping).
pub fn lower_cp(cp: int) -> int {
    if cp >= 65 && cp <= 90 {
        return cp + 32;
    }
    if cp < 128 {
        return cp;
    }
    let s = jsstr::to_lower(jsstr::from_unit(cp).as_str());
    let c = cps_of(s.as_str());
    if c.is_empty() {
        cp
    } else {
        c[0]
    }
}

fn is_hangul_syllable(cp: int) -> bool {
    cp >= 44032 && cp <= 55203
}

pub struct Uni {
    norm_loaded: bool,
    /// the code points that decompose, sorted, and where each entry starts
    decomp_cp: Vec<int>,
    decomp_at: Vec<int>,
    decomp: Vec<int>,
    ccc: Vec<int>,
    compose: Vec<int>,
    coll_loaded: bool,
    punct: Vec<int>,
    expand: Vec<int>,
    marks: Vec<int>,
    bases: Vec<int>,
    tailor_loaded: bool,
    tailor_locales: Vec<int>,
    tailor_entries: Vec<int>,
}

impl Uni {
    pub fn new() -> Uni {
        Uni {
            norm_loaded: false,
            decomp_cp: Vec::new(),
            decomp_at: Vec::new(),
            decomp: Vec::new(),
            ccc: Vec::new(),
            compose: Vec::new(),
            coll_loaded: false,
            punct: Vec::new(),
            expand: Vec::new(),
            marks: Vec::new(),
            bases: Vec::new(),
            tailor_loaded: false,
            tailor_locales: Vec::new(),
            tailor_entries: Vec::new(),
        }
    }

    // ---- normalization (§3.11 of the Unicode standard: decompose, order
    // the marks canonically, and for the C form compose back; Hangul by
    // arithmetic)

    fn ensure_norm(&mut self) {
        if self.norm_loaded {
            return;
        }
        self.norm_loaded = true;
        self.decomp = ints(NORM_DECOMP);
        self.ccc = ints(NORM_CCC);
        self.compose = ints(NORM_COMPOSE);
        let n = self.decomp.len();
        let mut i: usize = 0;
        while i < n {
            self.decomp_cp.push(self.decomp[i]);
            self.decomp_at.push(i as int);
            i += 2 + (self.decomp[i + 1] as usize);
        }
    }

    /// The canonical combining class of `cp`, 0 for a starter.
    fn ccc_of(&self, cp: int) -> int {
        let triples = (self.ccc.len() / 3) as int;
        let mut lo: int = 0;
        let mut hi = triples - 1;
        while lo <= hi {
            let mid = (lo + hi) / 2;
            let base = (mid * 3) as usize;
            if cp < self.ccc[base] {
                hi = mid - 1;
            } else if cp > self.ccc[base + 1] {
                lo = mid + 1;
            } else {
                return self.ccc[base + 2];
            }
        }
        0
    }

    /// The composite of a starter and a following character, or -1.
    fn compose_pair(&self, a: int, b: int) -> int {
        let triples = (self.compose.len() / 3) as int;
        let mut lo: int = 0;
        let mut hi = triples - 1;
        while lo <= hi {
            let mid = (lo + hi) / 2;
            let base = (mid * 3) as usize;
            let ka = self.compose[base];
            let kb = self.compose[base + 1];
            if ka < a || (ka == a && kb < b) {
                lo = mid + 1;
            } else if ka > a || kb > b {
                hi = mid - 1;
            } else {
                return self.compose[base + 2];
            }
        }
        -1
    }

    /// The full canonical decomposition of `cp` pushed onto `out`; false
    /// when it has none.
    fn decomp_into(&self, cp: int, out: &mut Vec<int>) -> bool {
        let mut lo: int = 0;
        let mut hi = (self.decomp_cp.len() as int) - 1;
        while lo <= hi {
            let mid = (lo + hi) / 2;
            let c = self.decomp_cp[mid as usize];
            if cp < c {
                hi = mid - 1;
            } else if cp > c {
                lo = mid + 1;
            } else {
                let at = self.decomp_at[mid as usize] as usize;
                let cnt = self.decomp[at + 1] as usize;
                let mut k: usize = 0;
                while k < cnt {
                    out.push(self.decomp[at + 2 + k]);
                    k += 1;
                }
                return true;
            }
        }
        false
    }

    /// Full canonical decomposition, then canonical ordering (a stable
    /// insertion sort by combining class).
    pub fn nfd(&mut self, cps: &Vec<int>) -> Vec<int> {
        self.ensure_norm();
        let mut out: Vec<int> = Vec::new();
        let mut ci: usize = 0;
        while ci < cps.len() {
            let cp = cps[ci];
            ci += 1;
            if is_hangul_syllable(cp) {
                let s = cp - 44032;
                let n = s / 28;
                let t = s - n * 28;
                let l = n / 21;
                let v = n - l * 21;
                out.push(4352 + l);
                out.push(4449 + v);
                if t > 0 {
                    out.push(4519 + t);
                }
            } else if !self.decomp_into(cp, &mut out) {
                out.push(cp);
            }
        }
        let m = out.len();
        let mut j: usize = 1;
        while j < m {
            let c = self.ccc_of(out[j]);
            if c > 0 {
                let mut k = j;
                while k > 0 {
                    let prev = self.ccc_of(out[k - 1]);
                    if prev > c {
                        let tmp = out[k];
                        out[k] = out[k - 1];
                        out[k - 1] = tmp;
                        k -= 1;
                    } else {
                        break;
                    }
                }
            }
            j += 1;
        }
        out
    }

    /// Canonical composition: a mark composes into the last starter unless
    /// another starter or a mark of the same or higher class blocks it.
    pub fn nfc(&mut self, cps: &Vec<int>) -> Vec<int> {
        let seq = self.nfd(cps);
        let n = seq.len();
        let mut out: Vec<int> = Vec::new();
        if n == 0 {
            return out;
        }
        out.push(seq[0]);
        let mut starter: usize = 0;
        let mut last_class: int = -1;
        let c0 = self.ccc_of(seq[0]);
        if c0 != 0 {
            last_class = c0;
        }
        let mut i: usize = 1;
        while i < n {
            let cp = seq[i];
            let c = self.ccc_of(cp);
            let s = out[starter];
            let mut composite: int = -1;
            let open = self.ccc_of(s) == 0 && (last_class < c || last_class == -1);
            if open {
                if s >= 4352 && s < 4371 && cp >= 4449 && cp < 4470 {
                    composite = 44032 + ((s - 4352) * 21 + (cp - 4449)) * 28;
                } else if is_hangul_syllable(s) && (s - 44032) % 28 == 0 && cp > 4519 && cp < 4547 {
                    composite = s + (cp - 4519);
                } else {
                    composite = self.compose_pair(s, cp);
                }
            }
            if composite >= 0 {
                out[starter] = composite;
            } else {
                if c == 0 {
                    starter = out.len();
                    last_class = -1;
                } else {
                    last_class = c;
                }
                out.push(cp);
            }
            i += 1;
        }
        out
    }

    /// String.prototype.normalize for "NFC" and "NFD". The compatibility
    /// forms are not carried (ComponentEngine answers them unchanged).
    pub fn normalize(&mut self, s: &str, form: &str) -> String {
        if jsstr::is_ascii(s) {
            return String::from(s);
        }
        let cps = cps_of(s);
        let out = if form == "NFD" { self.nfd(&cps) } else { self.nfc(&cps) };
        from_cps(&out)
    }

    // ---- collation: three levels in the shape of UTS #10 (base letters,
    // accents, case), then code units; a locale's tailoring places its
    // letters between the root ones

    fn ensure_coll(&mut self) {
        if self.coll_loaded {
            return;
        }
        self.coll_loaded = true;
        self.punct = ints(COLL_PUNCT);
        self.expand = ints(COLL_EXPAND);
        self.marks = ints(COLL_MARKS);
        self.bases = ints(COLL_BASES);
    }

    /// Punctuation's primary rank (before digits and letters), or -1.
    fn punct_rank(&self, cp: int) -> int {
        let triples = (self.punct.len() / 3) as int;
        let mut lo: int = 0;
        let mut hi = triples - 1;
        while lo <= hi {
            let mid = (lo + hi) / 2;
            let base = (mid * 3) as usize;
            let a = self.punct[base];
            if cp < a {
                hi = mid - 1;
            } else if cp > self.punct[base + 1] {
                lo = mid + 1;
            } else {
                return self.punct[base + 2] + (cp - a);
            }
        }
        -1
    }

    /// A combining mark's secondary rank, or -1.
    fn mark_rank(&self, cp: int) -> int {
        let pairs = (self.marks.len() / 2) as int;
        let mut lo: int = 0;
        let mut hi = pairs - 1;
        while lo <= hi {
            let mid = (lo + hi) / 2;
            let a = self.marks[(mid * 2) as usize];
            if cp < a {
                hi = mid - 1;
            } else if cp > a {
                lo = mid + 1;
            } else {
                return self.marks[(mid * 2 + 1) as usize];
            }
        }
        -1
    }

    /// (secondary rank, base points…) for a letter filed under a simpler
    /// one; empty when there is none.
    fn base_for(&self, cp: int) -> Vec<int> {
        let mut out: Vec<int> = Vec::new();
        let n = self.bases.len();
        let mut i: usize = 0;
        while i < n {
            let cnt = self.bases[i + 2] as usize;
            if self.bases[i] == cp {
                out.push(self.bases[i + 1]);
                let mut k: usize = 0;
                while k < cnt {
                    out.push(self.bases[i + 3 + k]);
                    k += 1;
                }
                return out;
            }
            i += 3 + cnt;
        }
        out
    }

    /// The sequence a character compares as (ß as "ss"); empty for itself.
    fn expand_for(&self, cp: int) -> Vec<int> {
        let mut out: Vec<int> = Vec::new();
        let n = self.expand.len();
        let mut i: usize = 0;
        while i < n {
            let cnt = self.expand[i + 1] as usize;
            if self.expand[i] == cp {
                let mut k: usize = 0;
                while k < cnt {
                    out.push(self.expand[i + 2 + k]);
                    k += 1;
                }
                return out;
            }
            i += 2 + cnt;
        }
        out
    }

    /// The tailoring of a BCP 47 tag as (entry offset, entry count), (0, 0)
    /// for none: the exact tag, else its language subtag.
    pub fn tailor_select(&mut self, tag: &str) -> (int, int) {
        if tag.is_empty() {
            return (0, 0);
        }
        if !self.tailor_loaded {
            self.tailor_loaded = true;
            self.tailor_locales = ints(TAILOR_LOCALES);
            self.tailor_entries = ints(TAILOR_ENTRIES);
        }
        let want = jsstr::to_lower(tag);
        let dash = jsstr::index_of(want.as_str(), "-", 0);
        let short = if dash > 0 { jsstr::slice(want.as_str(), 0, dash) } else { want.clone() };
        let mut pass = 0;
        while pass < 2 {
            let probe = if pass == 0 { cps_of(want.as_str()) } else { cps_of(short.as_str()) };
            let pn = probe.len();
            let n = self.tailor_locales.len();
            let mut i: usize = 0;
            while i < n {
                let tlen = self.tailor_locales[i] as usize;
                let mut same = tlen == pn;
                let mut k: usize = 0;
                while same && k < tlen {
                    if self.tailor_locales[i + 1 + k] != probe[k] {
                        same = false;
                    }
                    k += 1;
                }
                if same {
                    return (self.tailor_locales[i + 1 + tlen], self.tailor_locales[i + 2 + tlen]);
                }
                i += 3 + tlen;
            }
            pass += 1;
        }
        (0, 0)
    }

    /// The longest tailored element at `i` as (weight, length); length 0
    /// when none matches. Compared in lowercase, so Å is filed with å
    /// (ComponentEngine compares the text as written).
    fn tailor_match(&self, cps: &Vec<int>, i: usize, off: int, count: int) -> (int, int) {
        if count == 0 {
            return (0, 0);
        }
        let n = cps.len();
        let mut best_len: usize = 0;
        let mut best_w: int = 0;
        let mut p = off as usize;
        let mut k: int = 0;
        while k < count {
            let anchor = self.tailor_entries[p];
            let o = self.tailor_entries[p + 1];
            let elen = self.tailor_entries[p + 2] as usize;
            if elen > best_len && i + elen <= n {
                let mut ok = true;
                let mut q: usize = 0;
                while q < elen {
                    // an uppercase letter takes its lowercase one's place
                    if lower_cp(cps[i + q]) != self.tailor_entries[p + 3 + q] {
                        ok = false;
                        break;
                    }
                    q += 1;
                }
                if ok {
                    best_len = elen;
                    best_w = (100000 + anchor) * 1000 + o;
                }
            }
            p += 3 + elen;
            k += 1;
        }
        (best_w, best_len as int)
    }

    /// The three sort keys laid end to end: (primary count, primary…,
    /// secondary count, secondary…, tertiary count, tertiary…).
    fn keys(&mut self, s: &str, toff: int, tcnt: int, upper_first: bool) -> Vec<int> {
        self.ensure_coll();
        let mut prim: Vec<int> = Vec::new();
        let mut sec: Vec<int> = Vec::new();
        let mut ter: Vec<int> = Vec::new();
        let cps0 = cps_of(s);
        let cps = self.nfd(&cps0);
        let n = cps.len();
        let mut i: usize = 0;
        while i < n {
            let cp = cps[i];
            // a tailored element first: it may cover several code points
            let (tw, tl) = self.tailor_match(&cps, i, toff, tcnt);
            if tl > 0 {
                prim.push(tw);
                let mut tk = 0;
                while tk < tl {
                    let u = cps[i + (tk as usize)];
                    ter.push(if (lower_cp(u) != u) != upper_first { 1 } else { 0 });
                    tk += 1;
                }
                i += tl as usize;
                continue;
            }
            let mr = self.mark_rank(cp);
            if mr >= 0 {
                sec.push(mr);
            } else {
                let lo = lower_cp(cp);
                let is_upper = if lo != cp { 1 } else { 0 };
                let mut base = self.base_for(cp);
                if base.is_empty() {
                    base = self.base_for(lo);
                }
                let mut points: Vec<int> = Vec::new();
                if !base.is_empty() {
                    sec.push(base[0]);
                    let mut bk: usize = 1;
                    while bk < base.len() {
                        points.push(base[bk]);
                        bk += 1;
                    }
                } else {
                    let ex = self.expand_for(cp);
                    if !ex.is_empty() {
                        points = ex;
                    } else {
                        points.push(lo);
                    }
                }
                let mut pk: usize = 0;
                while pk < points.len() {
                    let bcp = points[pk];
                    let pr = self.punct_rank(bcp);
                    // scaled by 1000: the gap a tailoring puts its letters in
                    if pr >= 0 {
                        prim.push(pr * 1000);
                    } else {
                        prim.push((100000 + bcp) * 1000);
                    }
                    ter.push(if upper_first { 1 - is_upper } else { is_upper });
                    pk += 1;
                }
            }
            i += 1;
        }
        let mut out: Vec<int> = Vec::new();
        out.push(prim.len() as int);
        let mut iprim: usize = 0;
        while iprim < prim.len() {
            out.push(prim[iprim]);
            iprim += 1;
        }
        out.push(sec.len() as int);
        let mut isec: usize = 0;
        while isec < sec.len() {
            out.push(sec[isec]);
            isec += 1;
        }
        out.push(ter.len() as int);
        let mut iter: usize = 0;
        while iter < ter.len() {
            out.push(ter[iter]);
            iter += 1;
        }
        out
    }

    /// Compares two strings through the first `levels` of the three; with
    /// all three, strings equal at every level fall back to code units so
    /// the order stays total. `tag` selects a tailoring ("" for the root).
    pub fn collate(&mut self, a: &str, b: &str, tag: &str, levels: int) -> int {
        if a == b {
            return 0;
        }
        let (toff, tcnt) = self.tailor_select(tag);
        // Danish and Maltese sort uppercase first (CLDR caseFirst=upper)
        let lang = jsstr::to_lower(tag);
        let upper_first = lang == "da" || lang == "mt" || jsstr::index_of(lang.as_str(), "da-", 0) == 0 || jsstr::index_of(lang.as_str(), "mt-", 0) == 0;
        let ka = self.keys(a, toff, tcnt, upper_first);
        let kb = self.keys(b, toff, tcnt, upper_first);
        let mut ia: usize = 0;
        let mut ib: usize = 0;
        let mut lvl = 0;
        while lvl < levels {
            let na = ka[ia] as usize;
            let nb = kb[ib] as usize;
            let m = if na < nb { na } else { nb };
            let mut i: usize = 0;
            while i < m {
                let x = ka[ia + 1 + i];
                let y = kb[ib + 1 + i];
                if x < y {
                    return -1;
                }
                if x > y {
                    return 1;
                }
                i += 1;
            }
            if na < nb {
                return -1;
            }
            if na > nb {
                return 1;
            }
            ia += 1 + na;
            ib += 1 + nb;
            lvl += 1;
        }
        if levels < 3 {
            return 0;
        }
        jsstr::compare(a, b)
    }
}

// ---- \p{…}

/// The two-letter general category a long name spells out, or the name.
fn canonical_general_category(name: &str) -> String {
    let pairs = vec![
        "letter", "l", "uppercase_letter", "lu", "lowercase_letter", "ll", "titlecase_letter", "lt", "modifier_letter", "lm", "other_letter", "lo", "cased_letter", "lc", "mark", "m", "combining_mark", "m", "nonspacing_mark", "mn", "spacing_mark", "mc", "enclosing_mark", "me", "number", "n", "decimal_number", "nd", "digit", "nd", "letter_number", "nl", "other_number", "no", "punctuation", "p", "punct", "p", "connector_punctuation", "pc", "dash_punctuation", "pd", "open_punctuation", "ps", "close_punctuation", "pe", "initial_punctuation", "pi", "final_punctuation", "pf", "other_punctuation", "po", "symbol", "s", "math_symbol", "sm", "currency_symbol", "sc", "modifier_symbol", "sk", "other_symbol", "so", "separator", "z", "space_separator", "zs", "line_separator", "zl", "paragraph_separator", "zp", "other", "c", "control", "cc", "cntrl", "cc", "format", "cf", "private_use", "co", "surrogate", "cs", "unassigned", "cn",
    ];
    let mut i: usize = 0;
    while i + 1 < pairs.len() {
        if pairs[i] == name {
            return String::from(pairs[i + 1]);
        }
        i += 2;
    }
    String::from(name)
}

fn strip_prefix_to(name: &str, prefix: &str, repl: &str) -> String {
    let n = jsstr::len(name);
    let p = jsstr::len(prefix);
    if n >= p && jsstr::slice(name, 0, p).as_str() == prefix {
        return format!("{}{}", repl, jsstr::slice(name, p, n));
    }
    String::from(name)
}

/// The sorted [lo, hi] ranges of `\p{raw}`; [-1] for an unknown name. `General_Category=` / `gc=` name a category, `sc=` /
/// `Script_Extensions=` / `scx=` a script (as `Script=`).
pub fn property_ranges(raw: &str) -> Vec<int> {
    let mut name = jsstr::to_lower(raw);
    name = strip_prefix_to(name.as_str(), "general_category=", "");
    name = strip_prefix_to(name.as_str(), "gc=", "");
    name = strip_prefix_to(name.as_str(), "sc=", "script=");
    name = strip_prefix_to(name.as_str(), "script_extensions=", "script=");
    name = strip_prefix_to(name.as_str(), "scx=", "script=");
    name = canonical_general_category(name.as_str());
    let names = strs(PROP_NAMES);
    let mut i: usize = 0;
    while i < names.len() {
        if names[i].as_str() == name.as_str() {
            return ints(prop_ranges(i as int).as_str());
        }
        i += 1;
    }
    vec![-1]
}
