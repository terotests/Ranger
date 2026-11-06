// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::rgr::{MathFont, MathSym, MathText};

/// ==============================================================================
/// MathParser.rgr — TeX math, read into a list of atoms
/// ==============================================================================
///
/// The subset that formulas in documents and slides are written in: scripts,
/// fractions, roots, big operators and their limits, \left…\right, accents,
/// the named operators, fonts (\mathbf \mathbb \mathcal \mathrm), \text,
/// spacing, colour, and the matrix / cases / aligned environments.
///
/// What it does not know it keeps visible rather than dropping: an unknown
/// command is drawn as its own name in red, so a typo shows where it is.
///
/// An atom is TeX's noad: a nucleus with optional scripts and a class (ord,
/// op, bin, rel, open, close, punct, inner) that decides the spacing around it.
/// `kind` says what the nucleus is.
///
///   sym      one glyph: font + cp
///   list     a group {…}
///   frac     body / body2, `num` the bar (-1 default, 0 none)
///   sqrt     body, index in body2
///   lr       \left ldelim body \right rdelim
///   big      \big( … one delimiter at a fixed size (`num` 1..4)
///   accent   body under the glyph font/cp (`stretch` for \widehat)
///   over     \overline body       under  \underline body
///   text     \text{…} — `text`, set upright
///   opname   \sin, \lim, \operatorname{…} — `text`, upright; `limits`
///   space    `num` em
///   array    cells, rows, cols, colAlign; `ldelim`/`rdelim` around
///   stack    \overset / \underset: body is the base, body2 above (sup) or
///            below (sub)
///   box      \boxed body
///   phantom  body, measured and not drawn
///   color    body in `text` colour
///   style    body in the style `num` (0 display … 3 scriptscript)
///   not      body with a slash through it: \ne, \notin, \not\equiv
///   error    `text` drawn in red
/// ==============================================================================
#[derive(Clone)]
pub struct MathCell {
    pub body: Vec<Rc<RefCell<MathAtom>>>,
}

impl MathCell {
    pub fn new() -> Self {
        Self {
            body: Vec::new(),
        }
    }
}

#[derive(Clone)]
pub struct MathAtom {
    pub kind: String,
    pub r#type: String,
    pub font: i64,
    pub cp: i64,
    pub body: Vec<Rc<RefCell<MathAtom>>>,
    pub body2: Vec<Rc<RefCell<MathAtom>>>,
    pub sup: Vec<Rc<RefCell<MathAtom>>>,
    pub sub: Vec<Rc<RefCell<MathAtom>>>,
    pub hasSup: bool,
    pub hasSub: bool,
    /// 0 as the class decides, 1 \limits, 2 \nolimits
    pub limits: i64,
    pub ldelim: String,
    pub rdelim: String,
    pub text: String,
    pub num: f64,
    /// frac: -1 as the style is, 0 \dfrac, 1 \tfrac
    pub fstyle: i64,
    pub stretch: bool,
    pub textFont: i64,
    pub cells: Vec<Rc<RefCell<MathCell>>>,
    pub rows: i64,
    pub cols: i64,
    pub colAlign: Vec<String>,
    /// array: a row's extra space after it, from \\[1em]
    pub rowGap: Vec<f64>,
    pub env: String,
}

impl MathAtom {
    pub fn new() -> Self {
        Self {
            kind: "sym".to_string(),
            r#type: "ord".to_string(),
            font: 0,
            cp: 0,
            body: Vec::new(),
            body2: Vec::new(),
            sup: Vec::new(),
            sub: Vec::new(),
            hasSup: false,
            hasSub: false,
            limits: 0,
            ldelim: String::new(),
            rdelim: String::new(),
            text: String::new(),
            num: 0.0,
            fstyle: -1,
            stretch: false,
            textFont: 0,
            cells: Vec::new(),
            rows: 0,
            cols: 0,
            colAlign: Vec::new(),
            rowGap: Vec::new(),
            env: String::new(),
        }
    }
    pub fn sym(font: i64, cp: i64, r#type: String) -> Rc<RefCell<MathAtom>> {
        let mut a: Rc<RefCell<MathAtom>> = Rc::new(RefCell::new(MathAtom::new()));
        a.borrow_mut().kind = "sym".to_string();
        a.borrow_mut().font = font;
        a.borrow_mut().cp = cp;
        a.borrow_mut().r#type = r#type.clone();
        a
    }
    pub fn of(kind: String) -> Rc<RefCell<MathAtom>> {
        let mut a: Rc<RefCell<MathAtom>> = Rc::new(RefCell::new(MathAtom::new()));
        a.borrow_mut().kind = kind.clone();
        a
    }
}

#[derive(Clone)]
pub struct MathParser {
    pub src: String,
    /// `src` as Unicode code points. `pos` and `n` index THIS, not the string:
    /// `charAt` / `substring` count UTF-8 bytes on Go and UTF-16 units on
    /// JavaScript, so a scan with them split every character past ASCII into
    /// pieces on one target or the other (\text{eV·nm} drew as "eVÂ?nm").
    /// Slices of `src` are taken with `utf8_substring`, which counts code
    /// points everywhere.
    pub cs: Vec<i64>,
    pub pos: i64,
    pub n: i64,
    /// "" default, rm, bf, it, bb, cal
    pub fontMode: String,
    pub errors: Vec<String>,
}

impl MathParser {
    pub fn new() -> Self {
        Self {
            src: String::new(),
            cs: Vec::new(),
            pos: 0,
            n: 0,
            fontMode: String::new(),
            errors: Vec::new(),
        }
    }
    pub fn parse(tex: &str) -> Vec<Rc<RefCell<MathAtom>>> {
        let mut p: Rc<RefCell<MathParser>> = Rc::new(RefCell::new(MathParser::new()));
        return p.borrow_mut().parseAll(tex.to_string());
    }
    pub fn isLetter(c: i64) -> bool {
        (c >= 65 && c <= 90) || (c >= 97 && c <= 122)
    }
    /// A TeX length in em: 1em, 3mu, 4pt, 0.5ex. Anything else is 0.
    pub fn length(s0: &str) -> f64 {
        let s: String = s0.trim().to_string();
        let __len: i64 = MathText::str_len(&s) as i64;
        if __len < 2 {
            return 0.0;
        }
        let unit: String = MathText::substr(&s, __len - 2, __len);
        let v: f64 = if ((MathText::substr(&s, 0, __len - 2).trim().to_string().parse::<f64>().ok()).is_some()) { ((MathText::substr(&s, 0, __len - 2).trim().to_string().parse::<f64>().ok()).unwrap()) } else { 0.0 };
        if unit == "em" {
            return v;
        }
        if unit == "ex" {
            return v * 0.431;
        }
        if unit == "mu" {
            return v / 18.0;
        }
        if unit == "pt" {
            return v / 10.0;
        }
        if unit == "px" {
            return v / 10.0;
        }
        if unit == "cm" {
            return v * 2.845;
        }
        if unit == "mm" {
            return v * 0.2845;
        }
        if unit == "in" {
            return v * 7.227;
        }
        0.0
    }
    pub fn isIntegral(cp: i64) -> bool {
        (cp >= 8747 && cp <= 8755)
    }
    /// A marker in the flat cell list where a row ended early.
    pub fn rowEnd() -> Rc<RefCell<MathCell>> {
        let mut c: Rc<RefCell<MathCell>> = Rc::new(RefCell::new(MathCell::new()));
        let mut m: Rc<RefCell<MathAtom>> = MathAtom::of("rowend".to_string());
        c.borrow_mut().body.push(m.clone());
        c
    }
    /// The cells as rows × cols, a short row padded with empty cells.
    pub fn squareUp(arr: &Rc<RefCell<MathAtom>>) {
        let mut out: Vec<Rc<RefCell<MathCell>>> = Vec::new();
        let mut in_row: i64 = 0;
        let mut rows: i64 = 0;
        let mut i: i64 = 0;
        let n: i64 = arr.borrow().cells.len() as i64;
        while i < n {
            let mut c: Rc<RefCell<MathCell>> = arr.borrow().cells[i as usize].clone();
            let mut is_end: bool = false;
            if (c.borrow().body.len() as i64) == 1 {
                let mut first: Rc<RefCell<MathAtom>> = c.borrow().body[0].clone();
                if first.borrow().kind == "rowend" {
                    is_end = true;
                }
            }
            if is_end {
                while in_row < arr.borrow().cols {
                    out.push(Rc::new(RefCell::new(MathCell::new())));
                    in_row += 1;
                }
                in_row = 0;
                rows += 1;
            } else {
                out.push(c.clone());
                in_row += 1;
            }
            i += 1;
        }
        if in_row > 0 {
            while in_row < arr.borrow().cols {
                out.push(Rc::new(RefCell::new(MathCell::new())));
                in_row += 1;
            }
            rows += 1;
        }
        arr.borrow_mut().cells = out.clone();
        arr.borrow_mut().rows = rows;
        while (arr.borrow().rowGap.len() as i64) < rows {
            arr.borrow_mut().rowGap.push(0.0);
        }
    }
    pub fn alignColumns(arr: &Rc<RefCell<MathAtom>>, name: &str, spec: &str) {
        arr.borrow_mut().colAlign.clear();
        let mut i: i64 = 0;
        if !spec.is_empty() {
            let mut k: i64 = 0;
            while k < (MathText::str_len(&spec) as i64) {
                let c: i64 = MathText::char_at(&spec, k);
                if c == 108 {
                    arr.borrow_mut().colAlign.push("l".to_string().to_string());
                }
                if c == 99 {
                    arr.borrow_mut().colAlign.push("c".to_string().to_string());
                }
                if c == 114 {
                    arr.borrow_mut().colAlign.push("r".to_string().to_string());
                }
                k += 1;
            }
        }
        while i < arr.borrow().cols {
            let mut a: String = "c".to_string();
            if ((name == "aligned" || name == "align") || (name == "split" || name == "alignat")) || name == "alignedat" {
                if i % 2 == 0 {
                    a = "r".to_string();
                } else {
                    a = "l".to_string();
                }
            }
            if (name == "cases" || name == "dcases") || name == "rcases" {
                a = "l".to_string();
            }
            if i >= (arr.borrow().colAlign.len() as i64) {
                arr.borrow_mut().colAlign.push(a.to_string());
            }
            i += 1;
        }
    }
    /// --- tables --------------------------------------------------------------------
    pub fn spaceOf(t: &str) -> f64 {
        if t == "\\," {
            return 3.0 / 18.0;
        }
        if t == "\\thinspace" {
            return 3.0 / 18.0;
        }
        if t == "\\:" || t == "\\>" {
            return 4.0 / 18.0;
        }
        if t == "\\medspace" {
            return 4.0 / 18.0;
        }
        if t == "\\;" {
            return 5.0 / 18.0;
        }
        if t == "\\thickspace" {
            return 5.0 / 18.0;
        }
        if t == "\\!" {
            return -3.0 / 18.0;
        }
        if t == "\\negthinspace" {
            return -3.0 / 18.0;
        }
        if t == "\\quad" {
            return 1.0;
        }
        if t == "\\qquad" {
            return 2.0;
        }
        if t == "\\ " {
            return 0.333;
        }
        if t == "\\enspace" {
            return 0.5;
        }
        0.0
    }
    pub fn bigSizeOf(t: &str) -> i64 {
        if (t == "\\big" || t == "\\bigl") || (t == "\\bigr" || t == "\\bigm") {
            return 1;
        }
        if (t == "\\Big" || t == "\\Bigl") || (t == "\\Bigr" || t == "\\Bigm") {
            return 2;
        }
        if (t == "\\bigg" || t == "\\biggl") || (t == "\\biggr" || t == "\\biggm") {
            return 3;
        }
        if (t == "\\Bigg" || t == "\\Biggl") || (t == "\\Biggr" || t == "\\Biggm") {
            return 4;
        }
        0
    }
    pub fn bigTypeOf(t: &str) -> String {
        let c: i64 = MathText::char_at(&t, (MathText::str_len(&t) as i64) - 1);
        if c == 108 {
            return "open".to_string();
        }
        if c == 114 {
            return "close".to_string();
        }
        if c == 109 {
            return "rel".to_string();
        }
        "ord".to_string()
    }
    pub fn fontModeOf(t: &str) -> String {
        if (t == "\\mathrm" || t == "\\rm") || t == "\\mathup" {
            return "rm".to_string();
        }
        if (((t == "\\mathbf" || t == "\\bf") || t == "\\boldsymbol") || t == "\\bm") || t == "\\mathbold" {
            return "bf".to_string();
        }
        if t == "\\mathit" || t == "\\it" {
            return "it".to_string();
        }
        if t == "\\mathbb" || t == "\\Bbb" {
            return "bb".to_string();
        }
        if (t == "\\mathcal" || t == "\\cal") || t == "\\mathscr" {
            return "cal".to_string();
        }
        if t == "\\mathsf" || t == "\\mathtt" {
            return "rm".to_string();
        }
        String::new()
    }
    pub fn styleOf(t: &str) -> i64 {
        if t == "\\displaystyle" {
            return 0;
        }
        if t == "\\textstyle" {
            return 1;
        }
        if t == "\\scriptstyle" {
            return 2;
        }
        if t == "\\scriptscriptstyle" {
            return 3;
        }
        -1
    }
    pub fn opNameOf(t: &str) -> String {
        let __len: i64 = MathText::str_len(&t) as i64;
        if __len < 2 {
            return String::new();
        }
        let w: String = MathText::substr(&t, 1, __len);
        if MathText::index_of(&" arcsin arccos arctan arg cos cosh cot coth csc deg dim exp hom ker lg ln log sec sin sinh tan tanh det gcd inf lim max min Pr sup sgn arcsec arccot sech csch tg ctg cotg ".to_string(), &format!(" {} ", w)) >= 0 {
            return w;
        }
        if w == "liminf" {
            return "lim inf".to_string();
        }
        if w == "limsup" {
            return "lim sup".to_string();
        }
        if w == "argmax" {
            return "arg max".to_string();
        }
        if w == "argmin" {
            return "arg min".to_string();
        }
        String::new()
    }
    pub fn opHasLimits(t: &str) -> bool {
        MathText::index_of(&" \\det \\gcd \\inf \\lim \\max \\min \\Pr \\sup \\liminf \\limsup \\argmax \\argmin ".to_string(), &format!(" {} ", t)) >= 0
    }
    pub fn accentOf(t: &str) -> i64 {
        if t == "\\hat" || t == "\\widehat" {
            return 710;
        }
        if t == "\\tilde" || t == "\\widetilde" {
            return 732;
        }
        if t == "\\check" {
            return 711;
        }
        if t == "\\breve" {
            return 728;
        }
        if t == "\\bar" {
            return 713;
        }
        if t == "\\dot" {
            return 729;
        }
        if t == "\\ddot" {
            return 168;
        }
        if t == "\\mathring" {
            return 730;
        }
        if t == "\\acute" {
            return 714;
        }
        if t == "\\grave" {
            return 715;
        }
        if t == "\\vec" {
            return 8407;
        }
        0
    }
    /// Symbols KaTeX makes with a macro rather than the table.
    pub fn extra(t: &str) -> Rc<RefCell<MathAtom>> {
        let mf: i64 = MathFont::main_font();
        if t == "\\cdots" {
            return MathAtom::sym(mf, 8943, "inner".to_string());
        }
        if t == "\\vdots" {
            return MathAtom::sym(mf, 8942, "ord".to_string());
        }
        if t == "\\Leftrightarrow" {
            return MathAtom::sym(mf, 8660, "rel".to_string());
        }
        if t == "\\varphi" {
            return MathAtom::sym(MathFont::math_italic(), 966, "ord".to_string());
        }
        if t == "\\colon" {
            return MathAtom::sym(mf, 58, "punct".to_string());
        }
        if t == "\\qed" {
            return MathAtom::sym(MathFont::ams(), 9633, "ord".to_string());
        }
        Rc::new(RefCell::new(MathAtom::new()))
    }
    /// The spellings the table knows under another name.
    pub fn aliasOf(t: &str) -> String {
        if t == "\\dots" {
            return "\\ldots".to_string();
        }
        if t == "\\dotsc" {
            return "\\ldots".to_string();
        }
        if t == "\\dotsb" {
            return "\\cdots".to_string();
        }
        if t == "\\dotsm" {
            return "\\cdots".to_string();
        }
        if t == "\\dotsi" {
            return "\\cdots".to_string();
        }
        if t == "\\le" {
            return "\\leq".to_string();
        }
        if t == "\\ge" {
            return "\\geq".to_string();
        }
        if t == "\\to" {
            return "\\rightarrow".to_string();
        }
        if t == "\\gets" {
            return "\\leftarrow".to_string();
        }
        if t == "\\implies" {
            return "\\Longrightarrow".to_string();
        }
        if t == "\\impliedby" {
            return "\\Longleftarrow".to_string();
        }
        if t == "\\iff" {
            return "\\Longleftrightarrow".to_string();
        }
        if t == "\\land" {
            return "\\wedge".to_string();
        }
        if t == "\\lor" {
            return "\\vee".to_string();
        }
        if t == "\\lnot" {
            return "\\neg".to_string();
        }
        if t == "\\lbrace" {
            return "\\{".to_string();
        }
        if t == "\\rbrace" {
            return "\\}".to_string();
        }
        if t == "\\vert" {
            return "|".to_string();
        }
        if t == "\\Vert" {
            return "\\|".to_string();
        }
        if t == "\\lvert" {
            return "|".to_string();
        }
        if t == "\\rvert" {
            return "|".to_string();
        }
        if t == "\\setminus" {
            return "\\backslash".to_string();
        }
        String::new()
    }
    /// \operatorname{arg\,max} → "arg max"
    pub fn plainName(s: &str) -> String {
        let mut out: String = String::new();
        let mut i: i64 = 0;
        let n: i64 = MathText::str_len(&s) as i64;
        while i < n {
            let c: i64 = MathText::char_at(&s, i);
            if c == 92 {
                if i + 1 < n {
                    let c2: i64 = MathText::char_at(&s, i + 1);
                    if ((c2 == 44 || c2 == 59) || c2 == 58) || c2 == 32 {
                        out = format!("{} ", out);
                    }
                }
                i += 2;
            } else {
                if c != 123 && c != 125 {
                    out = format!("{}{}", out, char::from_u32(c as u32).unwrap_or('\0'));
                }
                i += 1;
            }
        }
        out
    }
    pub fn parseAll(&mut self, tex: String) -> Vec<Rc<RefCell<MathAtom>>> {
        self.src = tex.clone();
        self.cs = tex.chars().map(|c| c as i64).collect::<Vec<i64>>();
        self.pos = 0;
        self.n = self.cs.len() as i64;
        let mut list: Vec<Rc<RefCell<MathAtom>>> = self.parseRows("", "", false);
        while self.pos < self.n {
            // a stray `}` or `&` at the top: say so, then keep reading
            let t: String = self.next();
            list.push(self.errorAtom(t.clone()));
            let mut more: Vec<Rc<RefCell<MathAtom>>> = self.parseRows("", "", false);
            let mut i: i64 = 0;
            while i < (more.len() as i64) {
                list.push(more[i as usize].clone());
                i += 1;
            }
        }
        list
    }
    /// A list that may have `\\` in it. With none it is the list itself; with
    /// some, the rows are stacked centred, as `gathered` would.
    pub fn parseRows(&mut self, stop1: &str, stop2: &str, rows_allowed: bool) -> Vec<Rc<RefCell<MathAtom>>> {
        let mut list: Vec<Rc<RefCell<MathAtom>>> = self.parseList(stop1, stop2);
        if self.peek() != "\\\\" {
            return list;
        }
        let mut arr: Rc<RefCell<MathAtom>> = MathAtom::of("array".to_string());
        arr.borrow_mut().env = "gathered".to_string();
        arr.borrow_mut().cols = 1;
        arr.borrow_mut().colAlign.push("c".to_string().to_string());
        let mut c0: Rc<RefCell<MathCell>> = Rc::new(RefCell::new(MathCell::new()));
        c0.borrow_mut().body = list.clone();
        arr.borrow_mut().cells.push(c0.clone());
        arr.borrow_mut().rows = 1;
        arr.borrow_mut().rowGap.push(0.0);
        while self.peek() == "\\\\" {
            self.next();
            arr.borrow_mut().rowGap[(arr.borrow().rows - 1) as usize] = self.rowSkip();
            let mut c: Rc<RefCell<MathCell>> = Rc::new(RefCell::new(MathCell::new()));
            c.borrow_mut().body = self.parseList(stop1, stop2);
            arr.borrow_mut().cells.push(c.clone());
            arr.borrow_mut().rows = arr.borrow().rows + 1;
            arr.borrow_mut().rowGap.push(0.0);
        }
        let mut out: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
        out.push(arr.clone());
        out
    }
    /// --- tokens ------------------------------------------------------------------
    ///
    /// A token is a string: `\frac`, `\,`, `{`, `a`, or `#945` for a character
    /// outside ASCII — the same spelling the symbol table uses for them.
    pub fn skipSpace(&mut self) {
        while self.pos < self.n {
            let c: i64 = self.cs[(self.pos) as usize];
            if ((c == 32 || c == 9) || c == 10) || c == 13 {
                self.pos += 1;
            } else {
                if c == 37 {
                    // % comment to the end of the line
                    while self.pos < self.n && self.cs[(self.pos) as usize] != 10 {
                        self.pos += 1;
                    }
                } else {
                    return;
                }
            }
        }
    }
    pub fn peek(&mut self) -> String {
        let save: i64 = self.pos;
        let t: String = self.next();
        self.pos = save;
        t
    }
    pub fn next(&mut self) -> String {
        self.skipSpace();
        if self.pos >= self.n {
            return String::new();
        }
        let c: i64 = self.cs[(self.pos) as usize];
        if c == 92 {
            self.pos += 1;
            if self.pos >= self.n {
                return "\\".to_string();
            }
            let start: i64 = self.pos;
            let c2: i64 = self.cs[(self.pos) as usize];
            if MathParser::isLetter(c2) {
                while self.pos < self.n && MathParser::isLetter(self.cs[(self.pos) as usize]) {
                    self.pos += 1;
                }
                return format!("\\{}", self.src.chars().skip((start) as usize).take(((self.pos) - (start)) as usize).collect::<String>());
            }
            self.pos += 1;
            return format!("\\{}", self.src.chars().skip((start) as usize).take(((self.pos) - (start)) as usize).collect::<String>());
        }
        self.pos += 1;
        if c > 127 {
            return format!("#{}", c);
        }
        char::from_u32(c as u32).unwrap_or('\0').to_string()
    }
    /// The raw text of a {…} argument, braces balanced, for \text and the
    /// arguments that are names (\color{red}, \begin{matrix}).
    pub fn rawGroup(&mut self) -> String {
        self.skipSpace();
        if self.pos >= self.n || self.cs[(self.pos) as usize] != 123 {
            // one token
            let t: String = self.next();
            return t;
        }
        self.pos += 1;
        let start: i64 = self.pos;
        let mut depth: i64 = 1;
        while self.pos < self.n {
            let c: i64 = self.cs[(self.pos) as usize];
            if c == 92 {
                self.pos += 2;
            } else {
                if c == 123 {
                    depth += 1;
                }
                if c == 125 {
                    depth -= 1;
                    if depth == 0 {
                        let s: String = self.src.chars()
                            .skip((start) as usize)
                            .take(((self.pos) - (start)) as usize)
                            .collect::<String>();
                        self.pos += 1;
                        return s;
                    }
                }
                self.pos += 1;
            }
        }
        self.src.chars()
            .skip((start) as usize)
            .take(((self.n) - (start)) as usize)
            .collect::<String>()
            .clone()
    }
    /// An optional [..] argument, or "".
    pub fn optArg(&mut self) -> String {
        self.skipSpace();
        if self.pos >= self.n || self.cs[(self.pos) as usize] != 91 {
            return String::new();
        }
        self.pos += 1;
        let start: i64 = self.pos;
        let mut depth: i64 = 0;
        while self.pos < self.n {
            let c: i64 = self.cs[(self.pos) as usize];
            if c == 123 {
                depth += 1;
            }
            if c == 125 {
                depth -= 1;
            }
            if c == 93 && depth == 0 {
                let s: String = self.src.chars()
                    .skip((start) as usize)
                    .take(((self.pos) - (start)) as usize)
                    .collect::<String>();
                self.pos += 1;
                return s;
            }
            self.pos += 1;
        }
        self.src.chars()
            .skip((start) as usize)
            .take(((self.n) - (start)) as usize)
            .collect::<String>()
            .clone()
    }
    /// \\[4pt] — the extra space after a row, in em.
    pub fn rowSkip(&mut self) -> f64 {
        let a: String = self.optArg();
        if a.is_empty() {
            return 0.0;
        }
        MathParser::length(&a)
    }
    /// --- lists -------------------------------------------------------------------
    ///
    /// Atoms until a `}` (consumed by the caller), EOF, `&`, `\\`, `\right`,
    /// `\end`, or one of the two stop words given.
    pub fn parseList(&mut self, stop1: &str, stop2: &str) -> Vec<Rc<RefCell<MathAtom>>> {
        let mut list: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
        while true {
            let t: String = self.peek();
            if t.is_empty() {
                return list;
            }
            if t == "}" {
                return list;
            }
            if t == "&" {
                return list;
            }
            if t == "\\\\" {
                return list;
            }
            if t == "\\cr" {
                return list;
            }
            if t == "\\right" {
                return list;
            }
            if t == "\\middle" {
                return list;
            }
            if t == "\\end" {
                return list;
            }
            if t == stop1 || t == stop2 {
                return list;
            }
            self.next();
            if t == "^" || t == "_" {
                self.attachScript(&mut list, &t);
            } else {
                if t == "'" {
                    let mut prime: Rc<RefCell<MathAtom>> = MathAtom::sym(
                        MathFont::main_font(),
                        8242,
                        "ord".to_string()
                    );
                    let mut base: Rc<RefCell<MathAtom>> = self.scriptBase(&mut list);
                    base.borrow_mut().sup.push(prime.clone());
                    base.borrow_mut().hasSup = true;
                    while self.peek() == "'" {
                        self.next();
                        base.borrow_mut().sup.push(MathAtom::sym(
                            MathFont::main_font(),
                            8242,
                            "ord".to_string()
                        ));
                    }
                } else {
                    self.command(&t, &mut list);
                }
            }
        };
        list
    }
    /// The atom a script attaches to: the last one, or an empty ord when there
    /// is none or the last already has that script.
    pub fn scriptBase(&self, mut list: &mut Vec<Rc<RefCell<MathAtom>>>) -> Rc<RefCell<MathAtom>> {
        let cnt: i64 = list.len() as i64;
        if cnt > 0 {
            let mut last: Rc<RefCell<MathAtom>> = list[(cnt - 1) as usize].clone();
            if last.borrow().kind != "space" && last.borrow().kind != "style" {
                return last;
            }
        }
        let mut e: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
        list.push(e.clone());
        e
    }
    pub fn attachScript(&mut self, mut list: &mut Vec<Rc<RefCell<MathAtom>>>, t: &str) {
        let mut base: Rc<RefCell<MathAtom>> = self.scriptBase(&mut list);
        if t == "^" && base.borrow().hasSup {
            base = MathAtom::of("list".to_string());
            list.push(base.clone());
        }
        if t == "_" && base.borrow().hasSub {
            base = MathAtom::of("list".to_string());
            list.push(base.clone());
        }
        let mut arg: Vec<Rc<RefCell<MathAtom>>> = self.argument();
        if t == "^" {
            // x'^2: the primes are already a superscript and the 2 joins them
            let mut k: i64 = 0;
            while k < (arg.len() as i64) {
                base.borrow_mut().sup.push(arg[k as usize].clone());
                k += 1;
            }
            base.borrow_mut().hasSup = true;
        } else {
            base.borrow_mut().sub = arg.clone();
            base.borrow_mut().hasSub = true;
        }
    }
    /// One argument: a {group}, or a single token (\frac12, x^2, x^\alpha).
    pub fn argument(&mut self) -> Vec<Rc<RefCell<MathAtom>>> {
        let t: String = self.peek();
        if t == "{" {
            self.next();
            let mut inner: Vec<Rc<RefCell<MathAtom>>> = self.parseRows("", "", false);
            if self.peek() == "}" {
                self.next();
            }
            return inner;
        }
        let mut list: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
        if t.is_empty() {
            return list;
        }
        if t == "}" || t == "&" {
            return list;
        }
        self.next();
        self.command(&t, &mut list);
        list
    }
    /// An argument as ONE atom: a group of several becomes a list atom.
    pub fn argAtom(&self, list: Vec<Rc<RefCell<MathAtom>>>) -> Rc<RefCell<MathAtom>> {
        if (list.len() as i64) == 1 {
            let mut only: Rc<RefCell<MathAtom>> = list[0].clone();
            if !only.borrow().hasSup && !only.borrow().hasSub {
                return only;
            }
        }
        let mut g: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
        g.borrow_mut().body = list.clone();
        g
    }
    pub fn errorAtom(&mut self, t: String) -> Rc<RefCell<MathAtom>> {
        let mut e: Rc<RefCell<MathAtom>> = MathAtom::of("error".to_string());
        e.borrow_mut().text = t.clone();
        self.errors.push(t.clone());
        e
    }
    /// --- one token, into the list --------------------------------------------------
    pub fn command(&mut self, t: &str, mut list: &mut Vec<Rc<RefCell<MathAtom>>>) {
        let __len: i64 = MathText::str_len(&t) as i64;
        if t == "{" {
            let mut g: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
            let save: String = self.fontMode.clone();
            g.borrow_mut().body = self.parseRows("", "", false);
            self.fontMode = save.clone();
            if self.peek() == "}" {
                self.next();
            }
            list.push(g.clone());
            return;
        }
        if __len == 1 && MathParser::isLetter(MathText::char_at(&t, 0)) {
            list.push(self.letter(MathText::char_at(&t, 0)));
            return;
        }
        if __len == 1 && (MathText::char_at(&t, 0) >= 48 && MathText::char_at(&t, 0) <= 57) {
            let mut f: i64 = MathFont::main_font();
            if self.fontMode == "bf" {
                f = MathFont::bold();
            }
            list.push(MathAtom::sym(f, MathText::char_at(&t, 0), "ord".to_string()));
            return;
        }
        if __len == 0 {
            return;
        }
        if MathText::char_at(&t, 0) != 92 {
            self.character(t, &mut list);
            return;
        }
        self.control(t.to_string(), &mut list);
    }
    /// A Latin letter in the current math font.
    pub fn letter(&self, c: i64) -> Rc<RefCell<MathAtom>> {
        let upper: bool = (c >= 65 && c <= 90);
        if self.fontMode == "rm" {
            return MathAtom::sym(MathFont::main_font(), c, "ord".to_string());
        }
        if self.fontMode == "bf" {
            return MathAtom::sym(MathFont::bold(), c, "ord".to_string());
        }
        if self.fontMode == "bb" && upper {
            return MathAtom::sym(MathFont::ams(), c, "ord".to_string());
        }
        if self.fontMode == "cal" && upper {
            return MathAtom::sym(MathFont::cal(), c, "ord".to_string());
        }
        MathAtom::sym(MathFont::math_italic(), c, "ord".to_string())
    }
    /// + = ( [ | , and the characters outside ASCII: by the symbol table.
    pub fn character(&self, t: &str, mut list: &mut Vec<Rc<RefCell<MathAtom>>>) {
        let mut s: Option<Rc<RefCell<MathSym>>> = MathFont::symbol(t);
        if s.is_none() && MathText::char_at(&t, 0) == 35 {
            // · in math is \cdot: a character the fonts lack, by its look-alike
            let alike: i64 = MathFont::lookalike(if ((MathText::substr(&t, 1, (MathText::str_len(&t) as i64)).parse::<i64>().ok()).is_some()) { ((MathText::substr(&t, 1, (MathText::str_len(&t) as i64)).parse::<i64>().ok()).unwrap()) } else { 0 });
            if alike > 0 {
                s = MathFont::symbol(&format!("#{}", alike));
            }
        }
        if s.is_some() {
            list.push(self.fromSymbol(&s.clone().unwrap()));
            return;
        }
        if t == "~" {
            let mut sp: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
            sp.borrow_mut().num = 0.333;
            list.push(sp.clone());
            return;
        }
        // a character the table does not name: drawn from the main font if
        // it is there, as an ordinary symbol
        let mut cp: i64 = MathText::char_at(&t, 0);
        if MathText::char_at(&t, 0) == 35 {
            cp = if ((MathText::substr(&t, 1, (MathText::str_len(&t) as i64)).parse::<i64>().ok()).is_some()) { ((MathText::substr(&t, 1, (MathText::str_len(&t) as i64)).parse::<i64>().ok()).unwrap()) } else { 63 };
        }
        if MathFont::has(MathFont::main_font(), cp) {
            list.push(MathAtom::sym(MathFont::main_font(), cp, "ord".to_string()));
            return;
        }
        let mut tx: Rc<RefCell<MathAtom>> = MathAtom::of("text".to_string());
        tx.borrow_mut().text = char::from_u32(cp as u32).unwrap_or('\0').to_string();
        list.push(tx.clone());
    }
    fn fromSymbol(&self, s: &Rc<RefCell<MathSym>>) -> Rc<RefCell<MathAtom>> {
        let mut r#type: String = "ord".to_string();
        let g: String = s.borrow().group.clone();
        if g == "bin" {
            r#type = "bin".to_string();
        }
        if g == "rel" {
            r#type = "rel".to_string();
        }
        if g == "open" {
            r#type = "open".to_string();
        }
        if g == "close" {
            r#type = "close".to_string();
        }
        if g == "punct" {
            r#type = "punct".to_string();
        }
        if g == "inner" {
            r#type = "inner".to_string();
        }
        if g == "op" {
            r#type = "op".to_string();
        }
        let mut font: i64 = s.borrow().font;
        // mathord letters (Greek lowercase) are italic when the italic font
        // has them, as TeX sets them
        let mut _tmp_13 = s.borrow().cp.clone();
        if (g == "mathord" && font == MathFont::main_font()) && MathFont::has(MathFont::math_italic(), _tmp_13) {
            font = MathFont::math_italic();
        }
        let mut _tmp_15 = s.borrow().cp.clone();
        if self.fontMode == "bf" && MathFont::has(MathFont::bold(), _tmp_15) {
            font = MathFont::bold();
        }
        let mut a: Rc<RefCell<MathAtom>> = MathAtom::sym(font, s.borrow().cp.clone(), r#type.to_string());
        if r#type == "op" {
            a.borrow_mut().kind = "sym".to_string();
            // the integrals take their limits beside them
            if MathParser::isIntegral(s.borrow().cp.clone()) {
                a.borrow_mut().limits = 2;
            }
        }
        a
    }
    /// --- control sequences -----------------------------------------------------------
    pub fn control(&mut self, t: String, mut list: &mut Vec<Rc<RefCell<MathAtom>>>) {
        let mf: i64 = MathFont::main_font();
        // spacing
        let sp: f64 = MathParser::spaceOf(&t);
        if sp != 0.0 {
            let mut a: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
            a.borrow_mut().num = sp;
            list.push(a.clone());
            return;
        }
        if t == "\\limits" || t == "\\nolimits" {
            let cnt: i64 = list.len() as i64;
            if cnt > 0 {
                let mut last: Rc<RefCell<MathAtom>> = list[(cnt - 1) as usize].clone();
                if t == "\\limits" {
                    last.borrow_mut().limits = 1;
                } else {
                    last.borrow_mut().limits = 2;
                }
            }
            return;
        }
        if ((t == "\\frac" || t == "\\dfrac") || (t == "\\tfrac" || t == "\\cfrac")) || ((t == "\\binom" || t == "\\dbinom") || t == "\\tbinom") {
            let mut f: Rc<RefCell<MathAtom>> = MathAtom::of("frac".to_string());
            f.borrow_mut().r#type = "inner".to_string();
            f.borrow_mut().num = -1.0;
            if t == "\\dfrac" || (t == "\\cfrac" || t == "\\dbinom") {
                f.borrow_mut().fstyle = 0;
            }
            if t == "\\tfrac" || t == "\\tbinom" {
                f.borrow_mut().fstyle = 1;
            }
            f.borrow_mut().body = self.argument();
            f.borrow_mut().body2 = self.argument();
            if (t == "\\binom" || t == "\\dbinom") || t == "\\tbinom" {
                f.borrow_mut().num = 0.0;
                f.borrow_mut().ldelim = "(".to_string();
                f.borrow_mut().rdelim = ")".to_string();
            }
            list.push(f.clone());
            return;
        }
        if t == "\\sqrt" {
            let mut r: Rc<RefCell<MathAtom>> = MathAtom::of("sqrt".to_string());
            let idx: String = self.optArg();
            if !idx.is_empty() {
                r.borrow_mut().body2 = MathParser::parse(&idx);
            }
            r.borrow_mut().body = self.argument();
            list.push(r.clone());
            return;
        }
        if t == "\\left" {
            let mut lr: Rc<RefCell<MathAtom>> = MathAtom::of("lr".to_string());
            lr.borrow_mut().r#type = "inner".to_string();
            lr.borrow_mut().ldelim = self.delimToken();
            lr.borrow_mut().body = self.parseRows("", "", false);
            if self.peek() == "\\right" {
                self.next();
                lr.borrow_mut().rdelim = self.delimToken();
            } else {
                lr.borrow_mut().rdelim = ".".to_string();
            }
            list.push(lr.clone());
            return;
        }
        if t == "\\right" || t == "\\middle" {
            self.delimToken();
            return;
        }
        let big_size: i64 = MathParser::bigSizeOf(&t);
        if big_size > 0 {
            let mut b: Rc<RefCell<MathAtom>> = MathAtom::of("big".to_string());
            b.borrow_mut().num = big_size as f64;
            b.borrow_mut().ldelim = self.delimToken();
            b.borrow_mut().r#type = MathParser::bigTypeOf(&t);
            list.push(b.clone());
            return;
        }
        if ((t == "\\text" || t == "\\textrm") || (t == "\\textbf" || t == "\\textit")) || ((t == "\\mbox" || t == "\\textnormal") || t == "\\hbox") {
            let mut tx: Rc<RefCell<MathAtom>> = MathAtom::of("text".to_string());
            tx.borrow_mut().text = self.rawGroup();
            if t == "\\textbf" {
                tx.borrow_mut().textFont = MathFont::bold();
            }
            if t == "\\textit" {
                tx.borrow_mut().textFont = MathFont::math_italic();
            }
            list.push(tx.clone());
            return;
        }
        let fm: String = MathParser::fontModeOf(&t);
        if !fm.is_empty() {
            let save: String = self.fontMode.clone();
            self.fontMode = fm.clone();
            let mut g: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
            g.borrow_mut().body = self.argument();
            self.fontMode = save.clone();
            list.push(g.clone());
            return;
        }
        if t == "\\operatorname" || t == "\\operatornamewithlimits" {
            let mut star: bool = false;
            if self.peek() == "*" {
                self.next();
                star = true;
            }
            let mut op: Rc<RefCell<MathAtom>> = MathAtom::of("opname".to_string());
            op.borrow_mut().r#type = "op".to_string();
            let _tmp_33 = MathParser::plainName(&self.rawGroup());
            op.borrow_mut().text = _tmp_33;
            op.borrow_mut().limits = 2;
            if star || t == "\\operatornamewithlimits" {
                op.borrow_mut().limits = 0;
            }
            list.push(op.clone());
            return;
        }
        let opn: String = MathParser::opNameOf(&t);
        if !opn.is_empty() {
            let mut op2: Rc<RefCell<MathAtom>> = MathAtom::of("opname".to_string());
            op2.borrow_mut().r#type = "op".to_string();
            op2.borrow_mut().text = opn.clone();
            op2.borrow_mut().limits = 2;
            if MathParser::opHasLimits(&t) {
                op2.borrow_mut().limits = 0;
            }
            list.push(op2.clone());
            return;
        }
        if t == "\\overline" || t == "\\underline" {
            let mut o: Rc<RefCell<MathAtom>> = MathAtom::of("over".to_string());
            if t == "\\underline" {
                o.borrow_mut().kind = "under".to_string();
            }
            o.borrow_mut().body = self.argument();
            list.push(o.clone());
            return;
        }
        let acc: i64 = MathParser::accentOf(&t);
        if acc > 0 {
            let mut ac: Rc<RefCell<MathAtom>> = MathAtom::of("accent".to_string());
            ac.borrow_mut().font = mf;
            ac.borrow_mut().cp = acc;
            ac.borrow_mut().stretch = t == "\\widehat" || t == "\\widetilde";
            ac.borrow_mut().body = self.argument();
            list.push(ac.clone());
            return;
        }
        if t == "\\color" || t == "\\textcolor" {
            let mut col: Rc<RefCell<MathAtom>> = MathAtom::of("color".to_string());
            col.borrow_mut().text = self.rawGroup().trim().to_string();
            if t == "\\textcolor" || self.peek() == "{" {
                col.borrow_mut().body = self.argument();
            } else {
                col.borrow_mut().body = self.parseList("", "");
            }
            list.push(col.clone());
            return;
        }
        let st: i64 = MathParser::styleOf(&t);
        if st >= 0 {
            let mut sa: Rc<RefCell<MathAtom>> = MathAtom::of("style".to_string());
            sa.borrow_mut().num = st as f64;
            sa.borrow_mut().body = self.parseList("", "");
            list.push(sa.clone());
            return;
        }
        if t == "\\begin" {
            let env_name: String = self.rawGroup().trim().to_string();
            list.push(self.environment(env_name));
            return;
        }
        if ((t == "\\mathop" || t == "\\mathrel") || (t == "\\mathbin" || t == "\\mathord")) || ((t == "\\mathopen" || t == "\\mathclose") || (t == "\\mathpunct" || t == "\\mathinner")) {
            let mut g2: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
            g2.borrow_mut().body = self.argument();
            g2.borrow_mut().r#type = MathText::substr(&t, 5, (MathText::str_len(&t) as i64));
            if g2.borrow().r#type == "open" {
                g2.borrow_mut().r#type = "open".to_string();
            }
            list.push(g2.clone());
            return;
        }
        if (t == "\\overset" || t == "\\underset") || t == "\\stackrel" {
            let mut s2: Rc<RefCell<MathAtom>> = MathAtom::of("stack".to_string());
            let mut top: Vec<Rc<RefCell<MathAtom>>> = self.argument();
            s2.borrow_mut().body = self.argument();
            if t == "\\underset" {
                s2.borrow_mut().sub = top.clone();
                s2.borrow_mut().hasSub = true;
            } else {
                s2.borrow_mut().sup = top.clone();
                s2.borrow_mut().hasSup = true;
            }
            s2.borrow_mut().r#type = "ord".to_string();
            if t == "\\stackrel" {
                s2.borrow_mut().r#type = "rel".to_string();
            } else {
                if (s2.borrow().body.len() as i64) == 1 {
                    let mut first: Rc<RefCell<MathAtom>> = s2.borrow().body[0].clone();
                    s2.borrow_mut().r#type = first.borrow().r#type.clone();
                }
            }
            list.push(s2.clone());
            return;
        }
        if t == "\\boxed" || t == "\\fbox" {
            let mut bx: Rc<RefCell<MathAtom>> = MathAtom::of("box".to_string());
            bx.borrow_mut().body = self.argument();
            list.push(bx.clone());
            return;
        }
        if (t == "\\phantom" || t == "\\hphantom") || t == "\\vphantom" {
            let mut ph: Rc<RefCell<MathAtom>> = MathAtom::of("phantom".to_string());
            ph.borrow_mut().body = self.argument();
            ph.borrow_mut().text = t.clone();
            list.push(ph.clone());
            return;
        }
        if ((t == "\\hspace" || t == "\\kern") || t == "\\mkern") || t == "\\hskip" {
            let mut amount: String = String::new();
            if self.peek() == "{" {
                amount = self.rawGroup();
            } else {
                amount = self.lengthWord();
            }
            let mut ks: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
            ks.borrow_mut().num = MathParser::length(&amount);
            list.push(ks.clone());
            return;
        }
        if t == "\\bmod" || t == "\\mod" {
            let mut md: Rc<RefCell<MathAtom>> = MathAtom::of("opname".to_string());
            md.borrow_mut().text = "mod".to_string();
            md.borrow_mut().r#type = "bin".to_string();
            if t == "\\mod" {
                let mut q: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
                q.borrow_mut().num = 1.0;
                list.push(q.clone());
                md.borrow_mut().r#type = "ord".to_string();
            }
            list.push(md.clone());
            return;
        }
        if t == "\\pmod" {
            let mut q2: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
            q2.borrow_mut().num = 1.0;
            list.push(q2.clone());
            let mut g3: Rc<RefCell<MathAtom>> = MathAtom::of("list".to_string());
            g3.borrow_mut().body.push(MathAtom::sym(mf, 40, "open".to_string()));
            let mut md2: Rc<RefCell<MathAtom>> = MathAtom::of("opname".to_string());
            md2.borrow_mut().text = "mod".to_string();
            g3.borrow_mut().body.push(md2.clone());
            let mut s6: Rc<RefCell<MathAtom>> = MathAtom::of("space".to_string());
            s6.borrow_mut().num = 0.333;
            g3.borrow_mut().body.push(s6.clone());
            let mut arg: Vec<Rc<RefCell<MathAtom>>> = self.argument();
            let mut k: i64 = 0;
            while k < (arg.len() as i64) {
                g3.borrow_mut().body.push(arg[k as usize].clone());
                k += 1;
            }
            g3.borrow_mut().body.push(MathAtom::sym(mf, 41, "close".to_string()));
            list.push(g3.clone());
            return;
        }
        if (t == "\\ne" || t == "\\neq") || t == "\\notin" {
            let mut ng: Rc<RefCell<MathAtom>> = MathAtom::of("not".to_string());
            ng.borrow_mut().r#type = "rel".to_string();
            if t == "\\notin" {
                let mut inn: Option<Rc<RefCell<MathSym>>> = MathFont::symbol("\\in");
                if inn.is_some() {
                    ng.borrow_mut().body.push(self.fromSymbol(&inn.clone().unwrap()));
                }
            } else {
                ng.borrow_mut().body.push(MathAtom::sym(mf, 61, "rel".to_string()));
            }
            list.push(ng.clone());
            return;
        }
        if t == "\\not" {
            // \not= \not\in: the negated relation where there is one
            let nx: String = self.peek();
            let mut neg: String = "".to_string();
            if nx == "=" {
                neg = "\\neq".to_string();
            }
            if nx == "\\in" {
                neg = "\\notin".to_string();
            }
            if nx == "<" {
                neg = "\\nless".to_string();
            }
            if nx == ">" {
                neg = "\\ngtr".to_string();
            }
            if nx == "\\equiv" {
                neg = "\\not\\equiv".to_string();
            }
            if !neg.is_empty() {
                let mut ns: Option<Rc<RefCell<MathSym>>> = MathFont::symbol(&neg);
                if ns.is_some() {
                    self.next();
                    list.push(self.fromSymbol(&ns.clone().unwrap()));
                    return;
                }
            }
            // otherwise a slash over whatever follows
            let mut ng2: Rc<RefCell<MathAtom>> = MathAtom::of("not".to_string());
            ng2.borrow_mut().r#type = "rel".to_string();
            let mut next_list: Vec<Rc<RefCell<MathAtom>>> = self.argument();
            if !next_list.is_empty() {
                let mut target: Rc<RefCell<MathAtom>> = next_list[0].clone();
                ng2.borrow_mut().r#type = target.borrow().r#type.clone();
                ng2.borrow_mut().body.push(target.clone());
            }
            list.push(ng2.clone());
            return;
        }
        let alias: String = MathParser::aliasOf(&t);
        let mut look: String = t.clone();
        if !alias.is_empty() {
            look = alias.clone();
        }
        let mut s: Option<Rc<RefCell<MathSym>>> = MathFont::symbol(&look);
        if s.is_some() {
            list.push(self.fromSymbol(&s.clone().unwrap()));
            return;
        }
        let mut ex: Rc<RefCell<MathAtom>> = MathParser::extra(&t);
        if ex.borrow().cp > 0 {
            list.push(ex.clone());
            return;
        }
        list.push(self.errorAtom(t.clone()));
    }
    /// `\kern 3mu`: the length after the command, up to its unit.
    pub fn lengthWord(&mut self) -> String {
        self.skipSpace();
        let start: i64 = self.pos;
        while self.pos < self.n {
            let c: i64 = self.cs[(self.pos) as usize];
            if ((c >= 48 && c <= 57) || c == 46) || c == 45 {
                self.pos += 1;
            } else {
                break;
            }
        }
        let mut unit_end: i64 = self.pos + 2;
        if unit_end > self.n {
            unit_end = self.n;
        }
        self.pos = unit_end;
        self.src.chars()
            .skip((start) as usize)
            .take(((unit_end) - (start)) as usize)
            .collect::<String>()
            .clone()
    }
    /// The delimiter after \left, \right, \big: one token.
    pub fn delimToken(&mut self) -> String {
        let t: String = self.next();
        if t == "\\{" || t == "\\lbrace" {
            return "{".to_string();
        }
        if t == "\\}" || t == "\\rbrace" {
            return "}".to_string();
        }
        if t == "\\lbrack" {
            return "[".to_string();
        }
        if t == "\\rbrack" {
            return "]".to_string();
        }
        if t == "\\|" || (t == "\\Vert" || (t == "\\lVert" || t == "\\rVert")) {
            return "||".to_string();
        }
        if (t == "\\vert" || t == "\\lvert") || t == "\\rvert" {
            return "|".to_string();
        }
        if t == "\\langle" || t == "<" {
            return "<".to_string();
        }
        if t == "\\rangle" || t == ">" {
            return ">".to_string();
        }
        if t == "\\lfloor" {
            return "lfloor".to_string();
        }
        if t == "\\rfloor" {
            return "rfloor".to_string();
        }
        if t == "\\lceil" {
            return "lceil".to_string();
        }
        if t == "\\rceil" {
            return "rceil".to_string();
        }
        if t == "\\backslash" {
            return "\\".to_string();
        }
        if t == "#10216" {
            return "<".to_string();
        }
        if t == "#10217" {
            return ">".to_string();
        }
        t
    }
    /// --- environments --------------------------------------------------------------
    pub fn environment(&mut self, name: String) -> Rc<RefCell<MathAtom>> {
        let mut arr: Rc<RefCell<MathAtom>> = MathAtom::of("array".to_string());
        arr.borrow_mut().env = name.clone();
        let mut star: String = name.clone();
        let nlen: i64 = MathText::str_len(&name) as i64;
        if nlen > 1 && MathText::char_at(&name, nlen - 1) == 42 {
            star = MathText::substr(&name, 0, nlen - 1);
        }
        if star == "pmatrix" {
            arr.borrow_mut().ldelim = "(".to_string();
            arr.borrow_mut().rdelim = ")".to_string();
        }
        if star == "bmatrix" {
            arr.borrow_mut().ldelim = "[".to_string();
            arr.borrow_mut().rdelim = "]".to_string();
        }
        if star == "Bmatrix" {
            arr.borrow_mut().ldelim = "{".to_string();
            arr.borrow_mut().rdelim = "}".to_string();
        }
        if star == "vmatrix" {
            arr.borrow_mut().ldelim = "|".to_string();
            arr.borrow_mut().rdelim = "|".to_string();
        }
        if star == "Vmatrix" {
            arr.borrow_mut().ldelim = "||".to_string();
            arr.borrow_mut().rdelim = "||".to_string();
        }
        if star == "cases" || star == "dcases" {
            arr.borrow_mut().ldelim = "{".to_string();
            arr.borrow_mut().rdelim = ".".to_string();
        }
        if star == "rcases" {
            arr.borrow_mut().ldelim = ".".to_string();
            arr.borrow_mut().rdelim = "}".to_string();
        }
        let mut spec: String = String::new();
        if star == "array" || star == "darray" {
            spec = self.rawGroup();
        }
        let mut ci: i64 = 0;
        let mut cols: i64 = 0;
        let mut row: i64 = 0;
        arr.borrow_mut().rowGap.push(0.0);
        while true {
            let mut c: Rc<RefCell<MathCell>> = Rc::new(RefCell::new(MathCell::new()));
            c.borrow_mut().body = self.parseList("", "");
            arr.borrow_mut().cells.push(c.clone());
            ci += 1;
            if ci > cols {
                cols = ci;
            }
            let t: String = self.peek();
            if t == "&" {
                self.next();
            } else {
                if t == "\\\\" || t == "\\cr" {
                    self.next();
                    arr.borrow_mut().rowGap[row as usize] = self.rowSkip();
                    // a trailing \\ before \end is not a row
                    if self.peek() == "\\end" {
                        self.next();
                        self.rawGroup();
                        row += 1;
                        break;
                    }
                    // pad the row to a rectangle as it closes
                    arr.borrow_mut().cells.push(MathParser::rowEnd());
                    row += 1;
                    arr.borrow_mut().rowGap.push(0.0);
                    ci = 0;
                } else {
                    if t == "\\end" {
                        self.next();
                        self.rawGroup();
                    }
                    row += 1;
                    break;
                }
            }
        }
        arr.borrow_mut().rows = row;
        arr.borrow_mut().cols = cols;
        MathParser::squareUp(&arr);
        MathParser::alignColumns(&arr, &star, &spec);
        arr
    }
}
