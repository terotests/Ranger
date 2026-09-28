// SPDX-License-Identifier: AGPL-3.0-or-later
//! Regular expressions: a pattern is parsed to a small tree, compiled to
//! instructions and run by a backtracking matcher over UTF-16 units.
//!
//! Supported: alternation, groups (capturing, `(?:`, named `(?<n>`),
//! quantifiers `* + ? {n} {n,} {n,m}` greedy and lazy, classes with ranges
//! and `\d \w \s`, `.`, anchors `^ $ \b \B`, back references `\1 \k<n>`,
//! lookahead and lookbehind, Unicode property escapes `\p{…}` / `\P{…}`
//! (unicode.rs), the flags `g i m s u y`, and `v` with its class set
//! notation: nested classes, `&&`, `--` and `\q{…}` strings.

use ranger::prelude::*;

const R_EMPTY: int = 0;
const R_CHAR: int = 1;
const R_ANY: int = 2;
const R_CLASS: int = 3;
const R_SEQ: int = 4;
const R_ALT: int = 5;
const R_GROUP: int = 6;
const R_REPEAT: int = 7;
const R_BOL: int = 8;
const R_EOL: int = 9;
const R_WORDB: int = 10;
const R_NWORDB: int = 11;
const R_BACKREF: int = 12;
const R_LOOK: int = 13;
const R_NAMEDREF: int = 14;

const I_CHAR: int = 1;
const I_ANY: int = 2;
const I_CLASS: int = 3;
const I_SPLIT: int = 4;
const I_JMP: int = 5;
const I_SAVE: int = 6;
const I_BOL: int = 7;
const I_EOL: int = 8;
const I_WORDB: int = 9;
const I_NWORDB: int = 10;
const I_BACKREF: int = 11;
const I_LOOK: int = 12;
const I_MATCH: int = 13;
const I_SETPOS: int = 14;
const I_CHKPOS: int = 15;
const I_ANYNL: int = 16;

struct RNode {
    kind: int,
    c: int,
    list: Vec<int>,
    min: int,
    max: int,
    greedy: bool,
    name: String,
}

#[derive(Clone, Copy)]
struct Inst {
    op: int,
    a: int,
    b: int,
}

pub struct RClass {
    pub ranges: Vec<int>,
    pub negate: bool,
}

pub struct Regex {
    code: Vec<Inst>,
    pub unicode_sets: bool,
    classes: Vec<RClass>,
    pub ngroups: int,
    pub names: Vec<String>,
    pub name_index: Vec<int>,
    pub global: bool,
    pub ignore_case: bool,
    pub multiline: bool,
    pub dot_all: bool,
    pub unicode: bool,
    pub sticky: bool,
    /// the d flag (match indices)
    pub has_indices: bool,
    pub error: String,
    nregs: int,
    /// the first unit every match starts with, -1 when not one
    first: int,
}

struct RParser {
    src: Vec<int>,
    pos: int,
    nodes: Vec<RNode>,
    classes: Vec<RClass>,
    ngroups: int,
    names: Vec<String>,
    name_index: Vec<int>,
    error: String,
    unicode: bool,
    vmode: bool,
}

fn is_digit(c: int) -> bool {
    c >= 48 && c <= 57
}

fn is_word(c: int) -> bool {
    (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 95
}


fn is_line_term(c: int) -> bool {
    c == 10 || c == 13 || c == 0x2028 || c == 0x2029
}

fn hexv(c: int) -> int {
    if c >= 48 && c <= 57 {
        return c - 48;
    }
    if c >= 97 && c <= 102 {
        return c - 87;
    }
    if c >= 65 && c <= 70 {
        return c - 55;
    }
    -1
}

pub fn fold(c: int) -> int {
    if c >= 65 && c <= 90 {
        return c + 32;
    }
    if c < 128 {
        return c;
    }
    match char::from_u32(c as u32) {
        Some(ch) => {
            let s = ch.to_lowercase().to_string();
            let mut out = c;
            let mut n = 0;
            for l in s.chars() {
                out = l as int;
                n += 1;
            }
            if n == 1 {
                out
            } else {
                c
            }
        }
        None => c,
    }
}

fn upper(c: int) -> int {
    if c >= 97 && c <= 122 {
        return c - 32;
    }
    if c < 128 {
        return c;
    }
    match char::from_u32(c as u32) {
        Some(ch) => {
            let s = ch.to_uppercase().to_string();
            let mut out = c;
            let mut n = 0;
            for l in s.chars() {
                out = l as int;
                n += 1;
            }
            if n == 1 {
                out
            } else {
                c
            }
        }
        None => c,
    }
}

impl RParser {
    fn cur(&self) -> int {
        if self.pos < self.src.len() as int {
            self.src[self.pos as usize]
        } else {
            -1
        }
    }

    fn peek(&self, k: int) -> int {
        let i = self.pos + k;
        if i < self.src.len() as int {
            self.src[i as usize]
        } else {
            -1
        }
    }

    fn fail(&mut self, msg: &str) {
        if self.error.is_empty() {
            self.error = String::from(msg);
        }
        self.pos = self.src.len() as int;
    }

    fn node(&mut self, kind: int) -> int {
        self.nodes.push(RNode { kind: kind, c: 0, list: Vec::new(), min: 0, max: 0, greedy: true, name: String::new() });
        (self.nodes.len() as int) - 1
    }

    fn disjunction(&mut self) -> int {
        let first = self.alternative();
        if self.cur() != 124 {
            return first;
        }
        let n = self.node(R_ALT);
        let mut alts: Vec<int> = vec![first];
        while self.cur() == 124 {
            self.pos += 1;
            let a = self.alternative();
            alts.push(a);
        }
        self.nodes[n as usize].list = alts;
        n
    }

    fn alternative(&mut self) -> int {
        let n = self.node(R_SEQ);
        let mut items: Vec<int> = Vec::new();
        while self.cur() >= 0 && self.cur() != 124 && self.cur() != 41 {
            let t = self.term();
            if t >= 0 {
                items.push(t);
            }
            if !self.error.is_empty() {
                break;
            }
        }
        self.nodes[n as usize].list = items;
        n
    }

    fn term(&mut self) -> int {
        let c = self.cur();
        let atom: int;
        if c == 94 {
            self.pos += 1;
            return self.node(R_BOL);
        }
        if c == 36 {
            self.pos += 1;
            return self.node(R_EOL);
        }
        if c == 92 && (self.peek(1) == 98 || self.peek(1) == 66) {
            let b = self.peek(1) == 98;
            self.pos += 2;
            return self.node(if b { R_WORDB } else { R_NWORDB });
        }
        if c == 40 && self.peek(1) == 63 && (self.peek(2) == 61 || self.peek(2) == 33 || (self.peek(2) == 60 && (self.peek(3) == 61 || self.peek(3) == 33))) {
            // lookaround
            let behind = self.peek(2) == 60;
            let neg = if behind { self.peek(3) == 33 } else { self.peek(2) == 33 };
            self.pos += if behind { 4 } else { 3 };
            let inner = self.disjunction();
            if self.cur() != 41 {
                self.fail("Invalid regular expression: missing )");
                return -1;
            }
            self.pos += 1;
            let n = self.node(R_LOOK);
            self.nodes[n as usize].list = vec![inner];
            self.nodes[n as usize].c = (if neg { 1 } else { 0 }) + (if behind { 2 } else { 0 });
            // a lookahead may take a quantifier (Annex B); a lookbehind not
            if behind {
                return n;
            }
            atom = n;
        } else if c == 40 {
            self.pos += 1;
            let mut cap: int = -1;
            let mut name = String::new();
            if self.cur() == 63 && self.peek(1) == 58 {
                self.pos += 2;
            } else if self.cur() == 63 && self.peek(1) == 60 {
                self.pos += 2;
                while self.cur() >= 0 && self.cur() != 62 {
                    crate::jsstr::push_cp(&mut name, self.cur());
                    self.pos += 1;
                }
                self.pos += 1;
                self.ngroups += 1;
                cap = self.ngroups;
                self.names.push(name.clone());
                self.name_index.push(cap);
            } else if self.cur() == 63 {
                self.fail("Invalid regular expression: invalid group");
                return -1;
            } else {
                self.ngroups += 1;
                cap = self.ngroups;
            }
            let inner = self.disjunction();
            if self.cur() != 41 {
                self.fail("Invalid regular expression: missing )");
                return -1;
            }
            self.pos += 1;
            let n = self.node(R_GROUP);
            self.nodes[n as usize].c = cap;
            self.nodes[n as usize].list = vec![inner];
            self.nodes[n as usize].name = name;
            atom = n;
        } else if c == 46 {
            self.pos += 1;
            atom = self.node(R_ANY);
        } else if c == 91 && self.vmode {
            atom = self.class_v();
            if atom < 0 {
                return -1;
            }
        } else if c == 91 {
            atom = self.class();
        } else if c == 92 {
            atom = self.escape();
        } else if c == 42 || c == 43 || c == 63 {
            self.fail("Invalid regular expression: nothing to repeat");
            return -1;
        } else if c == 123 && self.unicode {
            self.fail("Invalid regular expression: lone quantifier brackets");
            return -1;
        } else if c == 41 {
            self.fail("Invalid regular expression: unmatched )");
            return -1;
        } else {
            let mut cp = c;
            self.pos += 1;
            // a surrogate pair is one character under /u
            if self.unicode && cp >= 0xd800 && cp <= 0xdbff && self.cur() >= 0xdc00 && self.cur() <= 0xdfff {
                cp = 0x10000 + ((cp - 0xd800) << 10) + (self.cur() - 0xdc00);
                self.pos += 1;
            }
            atom = self.node(R_CHAR);
            self.nodes[atom as usize].c = cp;
        }
        self.quantifier(atom)
    }

    fn quantifier(&mut self, atom: int) -> int {
        let c = self.cur();
        let min: int;
        let max: int;
        if c == 42 {
            min = 0;
            max = -1;
            self.pos += 1;
        } else if c == 43 {
            min = 1;
            max = -1;
            self.pos += 1;
        } else if c == 63 {
            min = 0;
            max = 1;
            self.pos += 1;
        } else if c == 123 {
            // {n}, {n,}, {n,m}; otherwise a literal brace
            let save = self.pos;
            self.pos += 1;
            let mut a: int = 0;
            let mut digits = 0;
            while is_digit(self.cur()) {
                a = a * 10 + (self.cur() - 48);
                self.pos += 1;
                digits += 1;
            }
            if digits == 0 {
                self.pos = save;
                return atom;
            }
            let mut b = a;
            if self.cur() == 44 {
                self.pos += 1;
                if self.cur() == 125 {
                    b = -1;
                } else {
                    b = 0;
                    let mut d2 = 0;
                    while is_digit(self.cur()) {
                        b = b * 10 + (self.cur() - 48);
                        self.pos += 1;
                        d2 += 1;
                    }
                    if d2 == 0 {
                        self.pos = save;
                        return atom;
                    }
                }
            }
            if self.cur() != 125 {
                self.pos = save;
                return atom;
            }
            self.pos += 1;
            if b >= 0 && b < a {
                self.fail("Invalid regular expression: numbers out of order in {} quantifier");
                return atom;
            }
            min = a;
            max = b;
        } else {
            return atom;
        }
        let mut greedy = true;
        if self.cur() == 63 {
            greedy = false;
            self.pos += 1;
        }
        let k = self.nodes[atom as usize].kind;
        if k == R_BOL || k == R_EOL || k == R_WORDB || k == R_NWORDB {
            self.fail("Invalid regular expression: nothing to repeat");
        }
        let n = self.node(R_REPEAT);
        self.nodes[n as usize].list = vec![atom];
        self.nodes[n as usize].min = min;
        self.nodes[n as usize].max = max;
        self.nodes[n as usize].greedy = greedy;
        n
    }

    fn add_class_escape(&mut self, ranges: &mut Vec<int>, c: int) -> bool {
        // \d \w \s and their negations inside a class
        if c == 100 {
            ranges.push(48);
            ranges.push(57);
            return true;
        }
        if c == 119 {
            ranges.push(48);
            ranges.push(57);
            ranges.push(65);
            ranges.push(90);
            ranges.push(95);
            ranges.push(95);
            ranges.push(97);
            ranges.push(122);
            return true;
        }
        if c == 115 {
            let sp = vec![32, 32, 9, 13, 0xa0, 0xa0, 0x1680, 0x1680, 0x2000, 0x200a, 0x2028, 0x2029, 0x202f, 0x202f, 0x205f, 0x205f, 0x3000, 0x3000, 0xfeff, 0xfeff];
            for x in sp {
                ranges.push(x);
            }
            return true;
        }
        if c == 68 || c == 87 || c == 83 {
            // the complement of \d \w \s
            let mut inner: Vec<int> = Vec::new();
            self.add_class_escape(&mut inner, c + 32);
            // sort pairs
            let mut pairs: Vec<(int, int)> = Vec::new();
            let mut i: usize = 0;
            while i < inner.len() {
                pairs.push((inner[i], inner[i + 1]));
                i += 2;
            }
            let mut a: usize = 1;
            while a < pairs.len() {
                let mut b = a;
                while b > 0 && pairs[b - 1].0 > pairs[b].0 {
                    let t = pairs[b];
                    pairs[b] = pairs[b - 1];
                    pairs[b - 1] = t;
                    b -= 1;
                }
                a += 1;
            }
            let mut lo: int = 0;
            for (x, y) in pairs {
                if x > lo {
                    ranges.push(lo);
                    ranges.push(x - 1);
                }
                if y + 1 > lo {
                    lo = y + 1;
                }
            }
            ranges.push(lo);
            ranges.push(0x10ffff);
            return true;
        }
        false
    }

    /// One escaped character value (not a class escape); -1 for none.
    fn char_escape(&mut self, in_class: bool) -> int {
        let c = self.cur();
        self.pos += 1;
        if c == 110 {
            return 10;
        }
        if c == 116 {
            return 9;
        }
        if c == 114 {
            return 13;
        }
        if c == 118 {
            return 11;
        }
        if c == 102 {
            return 12;
        }
        if c == 48 && !is_digit(self.cur()) {
            return 0;
        }
        if c == 98 && in_class {
            return 8;
        }
        if c == 45 && in_class {
            return 45;
        }
        if c == 99 {
            let l = self.cur();
            if (l >= 65 && l <= 90) || (l >= 97 && l <= 122) {
                self.pos += 1;
                return l % 32;
            }
            self.pos -= 1;
            return 92;
        }
        if c == 120 {
            let a = hexv(self.cur());
            let b = hexv(self.peek(1));
            if a >= 0 && b >= 0 {
                self.pos += 2;
                return a * 16 + b;
            }
            return 120;
        }
        if c == 117 {
            if self.cur() == 123 && self.unicode {
                self.pos += 1;
                let mut v: int = 0;
                while self.cur() >= 0 && self.cur() != 125 {
                    let h = hexv(self.cur());
                    if h < 0 {
                        self.fail("Invalid Unicode escape");
                        return 0;
                    }
                    v = v * 16 + h;
                    self.pos += 1;
                }
                self.pos += 1;
                return v;
            }
            let mut v: int = 0;
            let mut k = 0;
            while k < 4 {
                let h = hexv(self.peek(k));
                if h < 0 {
                    return 117;
                }
                v = v * 16 + h;
                k += 1;
            }
            self.pos += 4;
            if self.unicode && v >= 0xd800 && v <= 0xdbff && self.cur() == 92 && self.peek(1) == 117 {
                let mut lo: int = 0;
                let mut ok = true;
                let mut j = 2;
                while j < 6 {
                    let h = hexv(self.peek(j));
                    if h < 0 {
                        ok = false;
                        break;
                    }
                    lo = lo * 16 + h;
                    j += 1;
                }
                if ok && lo >= 0xdc00 && lo <= 0xdfff {
                    self.pos += 6;
                    return 0x10000 + ((v - 0xd800) << 10) + (lo - 0xdc00);
                }
            }
            return v;
        }
        if is_digit(c) && in_class {
            // legacy octal in a class
            let mut v = c - 48;
            if v < 8 {
                while is_digit(self.cur()) && self.cur() < 56 && v < 32 {
                    v = v * 8 + (self.cur() - 48);
                    self.pos += 1;
                }
            }
            return v;
        }
        c
    }

    fn class(&mut self) -> int {
        self.pos += 1;
        let mut negate = false;
        if self.cur() == 94 {
            negate = true;
            self.pos += 1;
        }
        let mut ranges: Vec<int> = Vec::new();
        loop {
            let c = self.cur();
            if c < 0 {
                self.fail("Invalid regular expression: missing /");
                break;
            }
            if c == 93 {
                self.pos += 1;
                break;
            }
            let mut lo: int;
            if c == 92 {
                self.pos += 1;
                let e = self.cur();
                if e == 100 || e == 68 || e == 119 || e == 87 || e == 115 || e == 83 {
                    self.pos += 1;
                    self.add_class_escape(&mut ranges, e);
                    continue;
                }
                if (e == 112 || e == 80) && self.unicode {
                    let r = self.property();
                    if !self.error.is_empty() {
                        break;
                    }
                    let mut i: usize = 0;
                    while i < r.len() {
                        ranges.push(r[i]);
                        i += 1;
                    }
                    continue;
                }
                lo = self.char_escape(true);
            } else {
                lo = c;
                self.pos += 1;
                if self.unicode && lo >= 0xd800 && lo <= 0xdbff && self.cur() >= 0xdc00 && self.cur() <= 0xdfff {
                    lo = 0x10000 + ((lo - 0xd800) << 10) + (self.cur() - 0xdc00);
                    self.pos += 1;
                }
            }
            if self.cur() == 45 && self.peek(1) != 93 && self.peek(1) >= 0 {
                self.pos += 1;
                let mut hi: int;
                if self.cur() == 92 {
                    self.pos += 1;
                    let e = self.cur();
                    if e == 100 || e == 68 || e == 119 || e == 87 || e == 115 || e == 83 {
                        // [a-\d]: a, -, and the class
                        self.pos += 1;
                        ranges.push(lo);
                        ranges.push(lo);
                        ranges.push(45);
                        ranges.push(45);
                        self.add_class_escape(&mut ranges, e);
                        continue;
                    }
                    hi = self.char_escape(true);
                } else {
                    hi = self.cur();
                    self.pos += 1;
                    if self.unicode && hi >= 0xd800 && hi <= 0xdbff && self.cur() >= 0xdc00 && self.cur() <= 0xdfff {
                        hi = 0x10000 + ((hi - 0xd800) << 10) + (self.cur() - 0xdc00);
                        self.pos += 1;
                    }
                }
                if hi < lo {
                    self.fail("Invalid regular expression: range out of order in character class");
                    break;
                }
                ranges.push(lo);
                ranges.push(hi);
            } else {
                ranges.push(lo);
                ranges.push(lo);
            }
        }
        self.class_node(ranges, negate)
    }

    /// A class node over `ranges` (sorted and merged here, so matching can
    /// search them).
    fn class_node(&mut self, ranges: Vec<int>, negate: bool) -> int {
        let r = norm_ranges(&ranges);
        self.classes.push(RClass { ranges: r, negate: negate });
        let n = self.node(R_CLASS);
        self.nodes[n as usize].c = (self.classes.len() as int) - 1;
        n
    }

    /// `\p{…}` / `\P{…}` after the backslash (at the `p`): the property's
    /// ranges, complemented for `\P`; fails on a malformed or unknown name.
    fn property(&mut self) -> Vec<int> {
        let neg = self.cur() == 80;
        self.pos += 1;
        if self.cur() != 123 {
            self.fail("Invalid regular expression: invalid property name");
            return Vec::new();
        }
        self.pos += 1;
        let mut raw = String::new();
        while self.cur() >= 0 && self.cur() != 125 {
            crate::jsstr::push_cp(&mut raw, self.cur());
            self.pos += 1;
        }
        if self.cur() != 125 || raw.is_empty() {
            self.fail("Invalid regular expression: invalid property name");
            return Vec::new();
        }
        self.pos += 1;
        let r = crate::unicode::property_ranges(raw.as_str());
        if r.len() == 1 {
            self.fail("Invalid regular expression: invalid property name");
            return Vec::new();
        }
        if neg {
            return complement(&r);
        }
        r
    }

    /// A class under the `v` flag, at its `[`: the set and the strings
    /// (`\q{…}` alternatives longer than one character) it matches.
    fn class_set(&mut self, strings: &mut Vec<Vec<int>>) -> Vec<int> {
        self.pos += 1;
        let mut negate = false;
        if self.cur() == 94 {
            negate = true;
            self.pos += 1;
        }
        let mut set: Vec<int> = Vec::new();
        let mut strs: Vec<Vec<int>> = Vec::new();
        // 0 union, 1 intersection, 2 subtraction
        let mut op = 0;
        let mut first = true;
        loop {
            let c = self.cur();
            if c < 0 {
                self.fail("Invalid regular expression: missing /");
                return Vec::new();
            }
            if c == 93 {
                self.pos += 1;
                break;
            }
            if !first && ((c == 38 && self.peek(1) == 38) || (c == 45 && self.peek(1) == 45)) {
                let this_op = if c == 38 { 1 } else { 2 };
                if op != 0 && op != this_op {
                    self.fail("Invalid regular expression: invalid set operation in character class");
                    return Vec::new();
                }
                op = this_op;
                self.pos += 2;
                let mut rs: Vec<Vec<int>> = Vec::new();
                let r = self.class_operand(&mut rs, false);
                if !self.error.is_empty() {
                    return Vec::new();
                }
                if op == 1 {
                    set = intersect(&set, &r);
                    let mut kept: Vec<Vec<int>> = Vec::new();
                    let mut i: usize = 0;
                    while i < strs.len() {
                        if has_string(&rs, &strs[i]) {
                            kept.push(strs[i].clone());
                        }
                        i += 1;
                    }
                    strs = kept;
                } else {
                    set = intersect(&set, &complement(&r));
                    let mut kept: Vec<Vec<int>> = Vec::new();
                    let mut i: usize = 0;
                    while i < strs.len() {
                        if !has_string(&rs, &strs[i]) {
                            kept.push(strs[i].clone());
                        }
                        i += 1;
                    }
                    strs = kept;
                }
                continue;
            }
            if op != 0 {
                self.fail("Invalid regular expression: invalid set operation in character class");
                return Vec::new();
            }
            let r = self.class_operand(&mut strs, true);
            if !self.error.is_empty() {
                return Vec::new();
            }
            let mut both = set.clone();
            let mut i: usize = 0;
            while i < r.len() {
                both.push(r[i]);
                i += 1;
            }
            set = norm_ranges(&both);
            first = false;
        }
        if negate {
            if !strs.is_empty() {
                self.fail("Invalid regular expression: negated character class may contain strings");
                return Vec::new();
            }
            return complement(&set);
        }
        let mut i: usize = 0;
        while i < strs.len() {
            strings.push(strs[i].clone());
            i += 1;
        }
        set
    }

    /// One operand of a `v` class: a nested class, `\p{…}`, `\q{…}`, a
    /// class escape, or a character (with `ranges`, a range `a-z`).
    fn class_operand(&mut self, strings: &mut Vec<Vec<int>>, ranges: bool) -> Vec<int> {
        let c = self.cur();
        let mut out: Vec<int> = Vec::new();
        if c == 91 {
            return self.class_set(strings);
        }
        let lo: int;
        if c == 92 {
            self.pos += 1;
            let e = self.cur();
            if e == 112 || e == 80 {
                return self.property();
            }
            if e == 100 || e == 68 || e == 119 || e == 87 || e == 115 || e == 83 {
                self.pos += 1;
                self.add_class_escape(&mut out, e);
                return norm_ranges(&out);
            }
            if e == 113 && self.peek(1) == 123 {
                // \q{abc|d}: strings; a one-character one is a character
                self.pos += 2;
                let mut cur: Vec<int> = Vec::new();
                loop {
                    let x = self.cur();
                    if x < 0 {
                        self.fail("Invalid regular expression: invalid escape");
                        return Vec::new();
                    }
                    if x == 125 || x == 124 {
                        self.pos += 1;
                        if cur.len() == 1 {
                            out.push(cur[0]);
                            out.push(cur[0]);
                        } else {
                            strings.push(cur.clone());
                        }
                        cur = Vec::new();
                        if x == 125 {
                            break;
                        }
                        continue;
                    }
                    let v = if x == 92 {
                        self.pos += 1;
                        self.char_escape(true)
                    } else {
                        self.pos += 1;
                        self.pair_after(x)
                    };
                    cur.push(v);
                }
                return norm_ranges(&out);
            }
            lo = self.char_escape(true);
        } else {
            self.pos += 1;
            lo = self.pair_after(c);
        }
        if ranges && self.cur() == 45 && self.peek(1) != 45 && self.peek(1) != 93 && self.peek(1) >= 0 {
            self.pos += 1;
            let h = self.cur();
            let hi: int;
            if h == 92 {
                self.pos += 1;
                hi = self.char_escape(true);
            } else {
                self.pos += 1;
                hi = self.pair_after(h);
            }
            if hi < lo {
                self.fail("Invalid regular expression: range out of order in character class");
                return Vec::new();
            }
            out.push(lo);
            out.push(hi);
            return out;
        }
        out.push(lo);
        out.push(lo);
        out
    }

    /// `c` just read; with the one after it a surrogate pair, the code
    /// point of the pair (consumed).
    fn pair_after(&mut self, c: int) -> int {
        if c >= 0xd800 && c <= 0xdbff && self.cur() >= 0xdc00 && self.cur() <= 0xdfff {
            let cp = 0x10000 + ((c - 0xd800) << 10) + (self.cur() - 0xdc00);
            self.pos += 1;
            return cp;
        }
        c
    }

    /// A `v` class as a node: its strings, longest first, then its set.
    fn class_v(&mut self) -> int {
        let mut strings: Vec<Vec<int>> = Vec::new();
        let negate = self.peek(1) == 94;
        let set = self.class_set(&mut strings);
        if !self.error.is_empty() {
            return -1;
        }
        if strings.is_empty() {
            // a negated class came back complemented
            if negate {
                return self.class_node(complement(&set), true);
            }
            return self.class_node(set, false);
        }
        // longest first (stable)
        let mut a: usize = 1;
        while a < strings.len() {
            let mut b = a;
            while b > 0 && strings[b - 1].len() < strings[b].len() {
                let t = strings[b].clone();
                strings[b] = strings[b - 1].clone();
                strings[b - 1] = t;
                b -= 1;
            }
            a += 1;
        }
        let mut alts: Vec<int> = Vec::new();
        let mut i: usize = 0;
        while i < strings.len() {
            let sq = self.node(R_SEQ);
            let mut items: Vec<int> = Vec::new();
            let mut k: usize = 0;
            while k < strings[i].len() {
                let ch = self.node(R_CHAR);
                self.nodes[ch as usize].c = strings[i][k];
                items.push(ch);
                k += 1;
            }
            self.nodes[sq as usize].list = items;
            alts.push(sq);
            i += 1;
        }
        if !set.is_empty() {
            let cl = self.class_node(set, false);
            alts.push(cl);
        }
        let alt = self.node(R_ALT);
        self.nodes[alt as usize].list = alts;
        let g = self.node(R_GROUP);
        self.nodes[g as usize].c = -1;
        self.nodes[g as usize].list = vec![alt];
        g
    }

    fn escape(&mut self) -> int {
        self.pos += 1;
        let c = self.cur();
        if c < 0 {
            self.fail("Invalid regular expression: \\ at end of pattern");
            return -1;
        }
        if c == 100 || c == 68 || c == 119 || c == 87 || c == 115 || c == 83 {
            self.pos += 1;
            let mut ranges: Vec<int> = Vec::new();
            self.add_class_escape(&mut ranges, c);
            return self.class_node(ranges, false);
        }
        if (c == 112 || c == 80) && self.unicode {
            let r = self.property();
            if !self.error.is_empty() {
                return -1;
            }
            return self.class_node(r, false);
        }
        if c >= 49 && c <= 57 {
            // a back reference \1..\99
            let mut v: int = 0;
            while is_digit(self.cur()) {
                v = v * 10 + (self.cur() - 48);
                self.pos += 1;
            }
            let n = self.node(R_BACKREF);
            self.nodes[n as usize].c = v;
            return n;
        }
        if c == 107 && self.peek(1) == 60 {
            self.pos += 2;
            let mut name = String::new();
            while self.cur() >= 0 && self.cur() != 62 {
                crate::jsstr::push_cp(&mut name, self.cur());
                self.pos += 1;
            }
            self.pos += 1;
            let n = self.node(R_NAMEDREF);
            self.nodes[n as usize].name = name;
            return n;
        }
        let v = self.char_escape(false);
        let n = self.node(R_CHAR);
        self.nodes[n as usize].c = v;
        n
    }
}

struct Gen {
    code: Vec<Inst>,
    nregs: int,
}

impl Gen {
    fn emit(&mut self, op: int, a: int, b: int) -> int {
        self.code.push(Inst { op: op, a: a, b: b });
        (self.code.len() as int) - 1
    }

    fn gen(&mut self, p: &RParser, n: int, dot_all: bool, backward: bool) {
        let nd = &p.nodes[n as usize];
        let k = nd.kind;
        if k == R_EMPTY {
            return;
        }
        if k == R_CHAR {
            self.emit(I_CHAR, nd.c, 0);
            return;
        }
        if k == R_ANY {
            self.emit(if dot_all { I_ANYNL } else { I_ANY }, 0, 0);
            return;
        }
        if k == R_CLASS {
            self.emit(I_CLASS, nd.c, 0);
            return;
        }
        if k == R_SEQ {
            let list = nd.list.clone();
            if backward {
                let mut i = (list.len() as int) - 1;
                while i >= 0 {
                    self.gen(p, list[i as usize], dot_all, backward);
                    i -= 1;
                }
            } else {
                for x in list {
                    self.gen(p, x, dot_all, backward);
                }
            }
            return;
        }
        if k == R_ALT {
            let list = nd.list.clone();
            let mut ends: Vec<int> = Vec::new();
            let cnt = list.len();
            let mut i: usize = 0;
            for x in list {
                if i + 1 < cnt {
                    let split = self.emit(I_SPLIT, 0, 0);
                    self.code[split as usize].a = split + 1;
                    self.gen(p, x, dot_all, backward);
                    let j = self.emit(I_JMP, 0, 0);
                    ends.push(j);
                    let here = self.code.len() as int;
                    self.code[split as usize].b = here;
                } else {
                    self.gen(p, x, dot_all, backward);
                }
                i += 1;
            }
            let here = self.code.len() as int;
            for j in ends {
                self.code[j as usize].a = here;
            }
            return;
        }
        if k == R_GROUP {
            let cap = nd.c;
            let inner = nd.list[0];
            if cap >= 0 {
                self.emit(I_SAVE, if backward { cap * 2 + 1 } else { cap * 2 }, 0);
            }
            self.gen(p, inner, dot_all, backward);
            if cap >= 0 {
                self.emit(I_SAVE, if backward { cap * 2 } else { cap * 2 + 1 }, 0);
            }
            return;
        }
        if k == R_REPEAT {
            let inner = nd.list[0];
            let (min, max, greedy) = (nd.min, nd.max, nd.greedy);
            let mut i = 0;
            while i < min {
                self.gen(p, inner, dot_all, backward);
                i += 1;
            }
            if max < 0 {
                let reg = self.nregs;
                self.nregs += 1;
                let top = self.emit(I_SPLIT, 0, 0);
                let body = self.code.len() as int;
                self.emit(I_SETPOS, reg, 0);
                self.gen(p, inner, dot_all, backward);
                self.emit(I_CHKPOS, reg, 0);
                self.emit(I_JMP, top, 0);
                let end = self.code.len() as int;
                if greedy {
                    self.code[top as usize].a = body;
                    self.code[top as usize].b = end;
                } else {
                    self.code[top as usize].a = end;
                    self.code[top as usize].b = body;
                }
                return;
            }
            let mut splits: Vec<int> = Vec::new();
            let mut j = min;
            while j < max {
                let s = self.emit(I_SPLIT, 0, 0);
                splits.push(s);
                let body = self.code.len() as int;
                self.gen(p, inner, dot_all, backward);
                if greedy {
                    self.code[s as usize].a = body;
                } else {
                    self.code[s as usize].b = body;
                }
                j += 1;
            }
            let end = self.code.len() as int;
            for s in splits {
                if greedy {
                    self.code[s as usize].b = end;
                } else {
                    self.code[s as usize].a = end;
                }
            }
            return;
        }
        if k == R_BOL {
            self.emit(I_BOL, 0, 0);
            return;
        }
        if k == R_EOL {
            self.emit(I_EOL, 0, 0);
            return;
        }
        if k == R_WORDB {
            self.emit(I_WORDB, 0, 0);
            return;
        }
        if k == R_NWORDB {
            self.emit(I_NWORDB, 0, 0);
            return;
        }
        if k == R_BACKREF {
            self.emit(I_BACKREF, nd.c, if backward { 1 } else { 0 });
            return;
        }
        if k == R_NAMEDREF {
            let mut idx: int = 0;
            let mut i: usize = 0;
            while i < p.names.len() {
                if p.names[i].as_str() == nd.name.as_str() {
                    idx = p.name_index[i];
                }
                i += 1;
            }
            self.emit(I_BACKREF, idx, if backward { 1 } else { 0 });
            return;
        }
        if k == R_LOOK {
            let kind = nd.c;
            let inner = nd.list[0];
            let look = self.emit(I_LOOK, kind, 0);
            let jmp = self.emit(I_JMP, 0, 0);
            let start = self.code.len() as int;
            self.gen(p, inner, dot_all, kind >= 2);
            self.emit(I_MATCH, 0, 0);
            let after = self.code.len() as int;
            self.code[look as usize].b = start;
            self.code[jmp as usize].a = after;
            return;
        }
    }
}

pub fn compile(pattern: &str, flags: &str) -> Regex {
    let mut re = Regex {
        code: Vec::new(),
        classes: Vec::new(),
        ngroups: 0,
        names: Vec::new(),
        name_index: Vec::new(),
        global: false,
        ignore_case: false,
        multiline: false,
        dot_all: false,
        unicode: false,
        unicode_sets: false,
        sticky: false,
        has_indices: false,
        error: String::new(),
        nregs: 0,
        first: -1,
    };
    for c in flags.chars() {
        let dup = match c {
            'g' => re.global,
            'i' => re.ignore_case,
            'm' => re.multiline,
            's' => re.dot_all,
            'u' => re.unicode,
            'y' => re.sticky,
            'd' => re.has_indices,
            'v' => re.unicode_sets || re.unicode,
            _ => {
                re.error = format!("Invalid regular expression flags '{}'", flags);
                return re;
            }
        };
        if dup {
            re.error = format!("Invalid regular expression flags '{}'", flags);
            return re;
        }
        match c {
            'g' => re.global = true,
            'i' => re.ignore_case = true,
            'm' => re.multiline = true,
            's' => re.dot_all = true,
            'u' => {
                if re.unicode_sets {
                    re.error = format!("Invalid regular expression flags '{}'", flags);
                    return re;
                }
                re.unicode = true;
            }
            'v' => {
                re.unicode = true;
                re.unicode_sets = true;
            }
            'd' => re.has_indices = true,
            'y' => re.sticky = true,
            _ => {}
        }
    }
    let mut p = RParser {
        src: crate::jsstr::units(pattern),
        pos: 0,
        nodes: Vec::new(),
        classes: Vec::new(),
        ngroups: 0,
        names: Vec::new(),
        name_index: Vec::new(),
        error: String::new(),
        unicode: re.unicode,
        vmode: re.unicode_sets,
    };
    let root = p.disjunction();
    if p.error.is_empty() && p.cur() >= 0 {
        p.error = String::from("Invalid regular expression: unmatched )");
    }
    if !p.error.is_empty() {
        re.error = p.error.clone();
        return re;
    }
    // back references past the group count are octal escapes (Annex B)
    let ng = p.ngroups;
    let mut i: usize = 0;
    while i < p.nodes.len() {
        if p.nodes[i].kind == R_BACKREF && p.nodes[i].c > ng {
            if re.unicode {
                re.error = String::from("Invalid regular expression: invalid escape");
                return re;
            }
            let v = p.nodes[i].c;
            // \8 and \9 are the digits themselves
            p.nodes[i].kind = R_CHAR;
            p.nodes[i].c = if v < 8 { v } else { 48 + (v % 10) };
        }
        i += 1;
    }
    let mut g = Gen { code: Vec::new(), nregs: 0 };
    g.emit(I_SAVE, 0, 0);
    g.gen(&p, root, re.dot_all, false);
    g.emit(I_SAVE, 1, 0);
    g.emit(I_MATCH, 0, 0);
    // a literal first unit lets the search skip ahead
    if g.code.len() > 1 && g.code[1].op == I_CHAR && !re.ignore_case && g.code[1].a < 0x10000 {
        re.first = g.code[1].a;
    }
    re.code = g.code;
    re.nregs = g.nregs;
    re.classes = p.classes;
    re.ngroups = p.ngroups;
    re.names = p.names;
    re.name_index = p.name_index;
    re
}

impl Regex {
    fn class_has(&self, ci: int, c: int) -> bool {
        let cl = &self.classes[ci as usize];
        let mut hit = in_ranges(&cl.ranges, c);
        if !hit && self.ignore_case {
            let l = fold(c);
            let u = upper(c);
            hit = in_ranges(&cl.ranges, l) || in_ranges(&cl.ranges, u);
        }
        if cl.negate {
            !hit
        } else {
            hit
        }
    }

    fn eq(&self, a: int, b: int) -> bool {
        if a == b {
            return true;
        }
        self.ignore_case && fold(a) == fold(b)
    }

    /// The code point at `pos` (a surrogate pair is one under /u) and its
    /// width in units.
    fn unit_at(&self, input: &Vec<int>, pos: int, n: int) -> (int, int) {
        let c = input[pos as usize];
        if self.unicode && c >= 0xd800 && c <= 0xdbff && pos + 1 < n {
            let d = input[(pos + 1) as usize];
            if d >= 0xdc00 && d <= 0xdfff {
                return (0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00), 2);
            }
        }
        (c, 1)
    }

    /// Runs the program from `pc` at `start`; answers the end position or
    /// -1. `back` runs it right to left (lookbehind).
    fn run(&self, input: &Vec<int>, start: int, pc0: int, caps: &mut Vec<int>, regs: &mut Vec<int>, back: bool) -> int {
        let n = input.len() as int;
        let mut stack: Vec<(int, int, int)> = Vec::new();
        let mut pc = pc0;
        let mut pos = start;
        let mut steps: int = 0;
        loop {
            steps += 1;
            if steps > 50000000 {
                return -1;
            }
            let ins = self.code[pc as usize];
            let mut ok = true;
            match ins.op {
                I_CHAR => {
                    if back {
                        if pos > 0 && self.eq(input[(pos - 1) as usize], ins.a) {
                            pos -= 1;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else if pos < n {
                        let (c, w) = self.unit_at(input, pos, n);
                        if self.eq(c, ins.a) {
                            pos += w;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else {
                        ok = false;
                    }
                }
                I_ANY | I_ANYNL => {
                    if back {
                        if pos > 0 && (ins.op == I_ANYNL || !is_line_term(input[(pos - 1) as usize])) {
                            pos -= 1;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else if pos < n {
                        let (c, w) = self.unit_at(input, pos, n);
                        if ins.op == I_ANYNL || !is_line_term(c) {
                            pos += w;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else {
                        ok = false;
                    }
                }
                I_CLASS => {
                    if back {
                        if pos > 0 && self.class_has(ins.a, input[(pos - 1) as usize]) {
                            pos -= 1;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else if pos < n {
                        let (c, w) = self.unit_at(input, pos, n);
                        if self.class_has(ins.a, c) {
                            pos += w;
                            pc += 1;
                        } else {
                            ok = false;
                        }
                    } else {
                        ok = false;
                    }
                }
                I_SPLIT => {
                    stack.push((0, ins.b, pos));
                    pc = ins.a;
                }
                I_JMP => {
                    pc = ins.a;
                }
                I_SAVE => {
                    stack.push((1, ins.a, caps[ins.a as usize]));
                    caps[ins.a as usize] = pos;
                    pc += 1;
                }
                I_SETPOS => {
                    stack.push((2, ins.a, regs[ins.a as usize]));
                    regs[ins.a as usize] = pos;
                    pc += 1;
                }
                I_CHKPOS => {
                    if regs[ins.a as usize] == pos {
                        ok = false;
                    } else {
                        pc += 1;
                    }
                }
                I_BOL => {
                    if pos == 0 || (self.multiline && is_line_term(input[(pos - 1) as usize])) {
                        pc += 1;
                    } else {
                        ok = false;
                    }
                }
                I_EOL => {
                    if pos == n || (self.multiline && is_line_term(input[pos as usize])) {
                        pc += 1;
                    } else {
                        ok = false;
                    }
                }
                I_WORDB | I_NWORDB => {
                    let a = pos > 0 && is_word(input[(pos - 1) as usize]);
                    let b = pos < n && is_word(input[pos as usize]);
                    let at = a != b;
                    if (ins.op == I_WORDB) == at {
                        pc += 1;
                    } else {
                        ok = false;
                    }
                }
                I_BACKREF => {
                    let s = caps[(ins.a * 2) as usize];
                    let e = caps[(ins.a * 2 + 1) as usize];
                    if s < 0 || e < 0 {
                        pc += 1;
                    } else {
                        let len = e - s;
                        if ins.b == 1 {
                            if pos - len < 0 {
                                ok = false;
                            } else {
                                let mut k: int = 0;
                                while k < len {
                                    if !self.eq(input[(s + k) as usize], input[(pos - len + k) as usize]) {
                                        ok = false;
                                        break;
                                    }
                                    k += 1;
                                }
                                if ok {
                                    pos -= len;
                                    pc += 1;
                                }
                            }
                        } else if pos + len > n {
                            ok = false;
                        } else {
                            let mut k: int = 0;
                            while k < len {
                                if !self.eq(input[(s + k) as usize], input[(pos + k) as usize]) {
                                    ok = false;
                                    break;
                                }
                                k += 1;
                            }
                            if ok {
                                pos += len;
                                pc += 1;
                            }
                        }
                    }
                }
                I_LOOK => {
                    let kind = ins.a;
                    let neg = (kind & 1) == 1;
                    let behind = kind >= 2;
                    let saved = caps.clone();
                    let r = self.run(input, pos, ins.b, caps, regs, behind);
                    let hit = r >= 0;
                    if hit == neg {
                        // failed: undo what the lookaround captured
                        let mut i: usize = 0;
                        while i < caps.len() {
                            caps[i] = saved[i];
                            i += 1;
                        }
                        ok = false;
                    } else {
                        if neg {
                            let mut i: usize = 0;
                            while i < caps.len() {
                                caps[i] = saved[i];
                                i += 1;
                            }
                        } else {
                            // captures set inside stay; undo them on backtrack
                            let mut i: usize = 0;
                            while i < caps.len() {
                                if caps[i] != saved[i] {
                                    stack.push((1, i as int, saved[i]));
                                }
                                i += 1;
                            }
                        }
                        pc += 1;
                    }
                }
                I_MATCH => {
                    return pos;
                }
                _ => {
                    ok = false;
                }
            }
            if !ok {
                // backtrack
                loop {
                    if stack.is_empty() {
                        return -1;
                    }
                    let (kind, a, b) = stack.pop().unwrap();
                    if kind == 0 {
                        pc = a;
                        pos = b;
                        break;
                    } else if kind == 1 {
                        caps[a as usize] = b;
                    } else {
                        regs[a as usize] = b;
                    }
                }
            }
        }
    }

    /// Searches from `start`: the capture positions (start, end pairs; -1
    /// for unset), or an empty vector when there is no match.
    pub fn exec(&self, input: &Vec<int>, start: int) -> Vec<int> {
        let n = input.len() as int;
        let mut s = start;
        let ncap = ((self.ngroups + 1) * 2) as usize;
        let mut regs: Vec<int> = Vec::new();
        let mut r: int = 0;
        while r < self.nregs {
            regs.push(-1);
            r += 1;
        }
        while s <= n {
            if self.first >= 0 && !self.sticky {
                while s < n && input[s as usize] != self.first {
                    s += 1;
                }
                if s >= n {
                    return Vec::new();
                }
            }
            let mut caps: Vec<int> = Vec::with_capacity(ncap);
            let mut i: usize = 0;
            while i < ncap {
                caps.push(-1);
                i += 1;
            }
            let e = self.run(input, s, 0, &mut caps, &mut regs, false);
            if e >= 0 {
                return caps;
            }
            if self.sticky {
                break;
            }
            s += 1;
        }
        Vec::new()
    }
}

/// Whether `c` is in sorted, merged [lo, hi] ranges (binary search).
fn in_ranges(r: &Vec<int>, c: int) -> bool {
    let mut lo: int = 0;
    let mut hi = (r.len() as int) / 2 - 1;
    while lo <= hi {
        let mid = (lo + hi) / 2;
        let a = r[(mid * 2) as usize];
        if c < a {
            hi = mid - 1;
        } else if c > r[(mid * 2 + 1) as usize] {
            lo = mid + 1;
        } else {
            return true;
        }
    }
    false
}

/// [lo, hi] pairs sorted by lo (a merge sort) with overlapping and
/// adjacent ones merged.
fn norm_ranges(r: &Vec<int>) -> Vec<int> {
    let n = r.len() / 2;
    let mut idx: Vec<int> = Vec::new();
    let mut i: usize = 0;
    while i < n {
        idx.push(i as int);
        i += 1;
    }
    let mut tmp: Vec<int> = idx.clone();
    let mut width: usize = 1;
    while width < n {
        let mut start: usize = 0;
        while start < n {
            let mid = if start + width < n { start + width } else { n };
            let end = if start + 2 * width < n { start + 2 * width } else { n };
            let mut a = start;
            let mut b = mid;
            let mut k = start;
            while k < end {
                if a < mid && (b >= end || r[(idx[a] * 2) as usize] <= r[(idx[b] * 2) as usize]) {
                    tmp[k] = idx[a];
                    a += 1;
                } else {
                    tmp[k] = idx[b];
                    b += 1;
                }
                k += 1;
            }
            start = end;
        }
        let mut j: usize = 0;
        while j < n {
            idx[j] = tmp[j];
            j += 1;
        }
        width *= 2;
    }
    let mut out: Vec<int> = Vec::new();
    let mut j: usize = 0;
    while j < n {
        let lo = r[(idx[j] * 2) as usize];
        let hi = r[(idx[j] * 2 + 1) as usize];
        let m = out.len();
        if m > 0 && lo <= out[m - 1] + 1 {
            if hi > out[m - 1] {
                out[m - 1] = hi;
            }
        } else {
            out.push(lo);
            out.push(hi);
        }
        j += 1;
    }
    out
}

/// Every code point not in sorted, merged ranges.
fn complement(r: &Vec<int>) -> Vec<int> {
    let mut out: Vec<int> = Vec::new();
    let mut next: int = 0;
    let mut i: usize = 0;
    while i + 1 < r.len() {
        if r[i] > next {
            out.push(next);
            out.push(r[i] - 1);
        }
        next = r[i + 1] + 1;
        i += 2;
    }
    if next <= 0x10ffff {
        out.push(next);
        out.push(0x10ffff);
    }
    out
}

/// The intersection of two sorted, merged range lists.
fn intersect(a: &Vec<int>, b: &Vec<int>) -> Vec<int> {
    let mut out: Vec<int> = Vec::new();
    let mut i: usize = 0;
    let mut j: usize = 0;
    while i + 1 < a.len() && j + 1 < b.len() {
        let lo = if a[i] > b[j] { a[i] } else { b[j] };
        let hi = if a[i + 1] < b[j + 1] { a[i + 1] } else { b[j + 1] };
        if lo <= hi {
            out.push(lo);
            out.push(hi);
        }
        if a[i + 1] < b[j + 1] {
            i += 2;
        } else {
            j += 2;
        }
    }
    out
}

fn has_string(list: &Vec<Vec<int>>, s: &Vec<int>) -> bool {
    let mut i: usize = 0;
    while i < list.len() {
        let t = &list[i];
        if t.len() == s.len() {
            let mut same = true;
            let mut k: usize = 0;
            while k < t.len() {
                if t[k] != s[k] {
                    same = false;
                    break;
                }
                k += 1;
            }
            if same {
                return true;
            }
        }
        i += 1;
    }
    false
}
