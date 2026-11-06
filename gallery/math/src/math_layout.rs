// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::math_parser::MathAtom;
use crate::math_parser::MathCell;
use crate::math_parser::MathParser;
use crate::rgr::MathFont;
use crate::rgr::MathGlyph;
use crate::rgr::MathText;

/// ==============================================================================
/// MathLayout.rgr — atoms into boxes, the way TeX does it
/// ==============================================================================
///
/// Appendix G of the TeXbook, in the reading KaTeX gives it: a list of atoms
/// becomes a row of boxes with TeX's spacing between the classes, a script is
/// raised by the font's own parameters, a fraction's parts are pushed apart
/// until they clear the bar, a delimiter is the smallest size that covers what
/// it encloses.
///
/// Units are ems of the formula's own size; the renderer multiplies. A box
/// has a width, a height above its baseline and a depth below it, and holds
/// its drawing as a flat list of items placed relative to its own origin (the
/// left end of the baseline, y growing DOWN, as on a page).
///
/// Styles are TeX's eight: display, text, script, scriptscript, each plain or
/// cramped. `st` is 0..7: size = st / 2, cramped = odd.
/// ==============================================================================
#[derive(Clone)]
pub struct MathItem {
    /// 0 glyph, 1 rule
    pub kind: i64,
    pub font: i64,
    pub cp: i64,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub scale: f64,
    pub sx: f64,
    pub sy: f64,
    pub color: String,
}

impl MathItem {
    pub fn new() -> Self {
        Self {
            kind: 0,
            font: 0,
            cp: 0,
            x: 0.0,
            y: 0.0,
            w: 0.0,
            h: 0.0,
            scale: 1.0,
            sx: 1.0,
            sy: 1.0,
            color: String::new(),
        }
    }
}

#[derive(Clone)]
pub struct MathBox {
    pub w: f64,
    pub h: f64,
    pub d: f64,
    pub items: Vec<Rc<RefCell<MathItem>>>,
    pub r#type: String,
    pub italic: f64,
    pub skew: f64,
    pub isChar: bool,
}

impl MathBox {
    pub fn new() -> Self {
        Self {
            w: 0.0,
            h: 0.0,
            d: 0.0,
            items: Vec::new(),
            r#type: "ord".to_string(),
            italic: 0.0,
            skew: 0.0,
            isChar: false,
        }
    }
    /// Another box's drawing, with its origin at (x, y) of this one. Does not
    /// grow this box: the caller knows what the new extent is.
    pub fn place(&mut self, b: &Rc<RefCell<MathBox>>, x: f64, y: f64) {
        let mut i: i64 = 0;
        let n: i64 = b.borrow().items.len() as i64;
        while i < n {
            let mut it: Rc<RefCell<MathItem>> = b.borrow().items[i as usize].clone();
            let mut c: Rc<RefCell<MathItem>> = Rc::new(RefCell::new(MathItem::new()));
            c.borrow_mut().kind = it.borrow().kind;
            c.borrow_mut().font = it.borrow().font;
            c.borrow_mut().cp = it.borrow().cp;
            c.borrow_mut().x = it.borrow().x + x;
            c.borrow_mut().y = it.borrow().y + y;
            c.borrow_mut().w = it.borrow().w;
            c.borrow_mut().h = it.borrow().h;
            c.borrow_mut().scale = it.borrow().scale;
            c.borrow_mut().sx = it.borrow().sx;
            c.borrow_mut().sy = it.borrow().sy;
            c.borrow_mut().color = it.borrow().color.clone();
            self.items.push(c.clone());
            i += 1;
        }
    }
    pub fn rule(&mut self, x: f64, y: f64, w: f64, h: f64, color: String) {
        let mut r: Rc<RefCell<MathItem>> = Rc::new(RefCell::new(MathItem::new()));
        r.borrow_mut().kind = 1;
        r.borrow_mut().x = x;
        r.borrow_mut().y = y;
        r.borrow_mut().w = w;
        r.borrow_mut().h = h;
        r.borrow_mut().color = color.clone();
        self.items.push(r.clone());
    }
}

#[derive(Clone)]
pub struct MathLayout {
    pub color: String,
}

impl MathLayout {
    pub fn new() -> Self {
        Self {
            color: String::new(),
        }
    }
    /// --- the whole formula ---------------------------------------------------------
    pub fn layout(tex: &str, display: bool) -> Rc<RefCell<MathBox>> {
        let mut l: Rc<RefCell<MathLayout>> = Rc::new(RefCell::new(MathLayout::new()));
        let mut st: i64 = 2;
        if display {
            st = 0;
        }
        return l.borrow_mut().list(&MathParser::parse(tex), st);
    }
    /// --- styles --------------------------------------------------------------------
    pub fn size(st: i64) -> i64 {
        st / 2
    }
    pub fn cramped(st: i64) -> bool {
        st % 2 == 1
    }
    /// The row of sigma values a style reads: text, script, scriptscript.
    pub fn si(st: i64) -> i64 {
        let z: i64 = st / 2;
        if z <= 1 {
            return 0;
        }
        z - 1
    }
    pub fn sm(st: i64) -> f64 {
        let z: i64 = st / 2;
        if z == 2 {
            return 0.7;
        }
        if z == 3 {
            return 0.5;
        }
        1.0
    }
    pub fn isDisplay(st: i64) -> bool {
        (st / 2) == 0
    }
    pub fn supStyle(st: i64) -> i64 {
        let z: i64 = st / 2;
        let c: i64 = st % 2;
        if z <= 1 {
            return 4 + c;
        }
        6 + c
    }
    pub fn subStyle(st: i64) -> i64 {
        let z: i64 = st / 2;
        if z <= 1 {
            return 5;
        }
        7
    }
    pub fn numStyle(st: i64) -> i64 {
        let z: i64 = st / 2;
        let c: i64 = st % 2;
        if z == 0 {
            return 2 + c;
        }
        if z == 1 {
            return 4 + c;
        }
        6 + c
    }
    pub fn denStyle(st: i64) -> i64 {
        let z: i64 = st / 2;
        if z == 0 {
            return 3;
        }
        if z == 1 {
            return 5;
        }
        7
    }
    pub fn cramp(st: i64) -> i64 {
        if st % 2 == 1 {
            return st;
        }
        st + 1
    }
    pub fn sigma(name: &str, st: i64) -> f64 {
        MathFont::sigma(name, MathLayout::si(st)) * MathLayout::sm(st)
    }
    pub fn maxOf(a: f64, b: f64) -> f64 {
        if a > b {
            return a;
        }
        b
    }
    /// A binary operator where nothing precedes it, or after something that is
    /// not an operand, is an ordinary symbol: the minus of -x.
    pub fn reclassify(boxes: &Vec<Rc<RefCell<MathBox>>>) {
        let mut prev: String = String::new();
        let mut i: i64 = 0;
        let n: i64 = boxes.len() as i64;
        while i < n {
            let mut b: Rc<RefCell<MathBox>> = boxes[i as usize].clone();
            if b.borrow().r#type != "space" {
                if b.borrow().r#type == "bin" {
                    if ((prev.is_empty() || prev == "bin") || (prev == "op" || prev == "rel")) || (prev == "open" || prev == "punct") {
                        b.borrow_mut().r#type = "ord".to_string();
                    }
                }
                if ((b.borrow().r#type == "rel" || b.borrow().r#type == "close") || b.borrow().r#type == "punct") && prev == "bin" {
                    MathLayout::lastBinToOrd(boxes, i);
                }
                prev = b.borrow().r#type.clone();
            }
            i += 1;
        }
        if prev == "bin" {
            MathLayout::lastBinToOrd(boxes, n);
        }
    }
    pub fn lastBinToOrd(boxes: &Vec<Rc<RefCell<MathBox>>>, before: i64) {
        let mut j: i64 = before - 1;
        while j >= 0 {
            let mut b: Rc<RefCell<MathBox>> = boxes[j as usize].clone();
            if b.borrow().r#type != "space" {
                if b.borrow().r#type == "bin" {
                    b.borrow_mut().r#type = "ord".to_string();
                }
                return;
            }
            j -= 1;
        }
    }
    /// TeX's spacing table, in mu: 3 thin, 4 medium, 5 thick. The negative
    /// entries are the ones dropped in script styles.
    pub fn spacing(l: &str, r: &str, script: bool) -> i64 {
        let v: i64 = MathLayout::rawSpacing(l, r);
        if v < 0 {
            if script {
                return 0;
            }
            return 0 - v;
        }
        v
    }
    pub fn rawSpacing(l: &str, r: &str) -> i64 {
        if l == "ord" {
            if r == "op" {
                return 3;
            }
            if r == "bin" {
                return -4;
            }
            if r == "rel" {
                return -5;
            }
            if r == "inner" {
                return -3;
            }
            return 0;
        }
        if l == "op" {
            if r == "ord" || r == "op" {
                return 3;
            }
            if r == "rel" {
                return -5;
            }
            if r == "inner" {
                return -3;
            }
            return 0;
        }
        if l == "bin" {
            if ((r == "ord" || r == "op") || r == "open") || r == "inner" {
                return -4;
            }
            return 0;
        }
        if l == "rel" {
            if ((r == "ord" || r == "op") || r == "open") || r == "inner" {
                return -5;
            }
            return 0;
        }
        if l == "close" {
            if r == "op" {
                return 3;
            }
            if r == "bin" {
                return -4;
            }
            if r == "rel" {
                return -5;
            }
            if r == "inner" {
                return -3;
            }
            return 0;
        }
        if l == "punct" {
            if r == "bin" || r == "space" {
                return 0;
            }
            return -3;
        }
        if l == "inner" {
            if r == "op" {
                return 3;
            }
            if r == "bin" {
                return -4;
            }
            if r == "rel" {
                return -5;
            }
            if r == "close" {
                return 0;
            }
            return -3;
        }
        0
    }
    pub fn row3(a: &Rc<RefCell<MathBox>>, b: &Rc<RefCell<MathBox>>, c: &Rc<RefCell<MathBox>>) -> Rc<RefCell<MathBox>> {
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out.borrow_mut().place(a, 0.0, 0.0);
        out.borrow_mut().place(b, a.borrow().w.clone(), 0.0);
        out.borrow_mut().place(c, a.borrow().w + b.borrow().w, 0.0);
        out.borrow_mut().w = (a.borrow().w + b.borrow().w) + c.borrow().w;
        let mut _tmp_104 = a.borrow().h.clone();
        let _tmp_105 = MathLayout::maxOf(b.borrow().h, c.borrow().h);
        out.borrow_mut().h = MathLayout::maxOf(_tmp_104, _tmp_105);
        let mut _tmp_109 = a.borrow().d.clone();
        let _tmp_110 = MathLayout::maxOf(b.borrow().d, c.borrow().d);
        out.borrow_mut().d = MathLayout::maxOf(_tmp_109, _tmp_110);
        out
    }
    /// --- delimiters ------------------------------------------------------------------
    pub fn delimCp(name: &str) -> i64 {
        if name == "(" {
            return 40;
        }
        if name == ")" {
            return 41;
        }
        if name == "[" {
            return 91;
        }
        if name == "]" {
            return 93;
        }
        if name == "{" {
            return 123;
        }
        if name == "}" {
            return 125;
        }
        if name == "|" {
            return 8739;
        }
        if name == "||" {
            return 8741;
        }
        if name == "<" {
            return 10216;
        }
        if name == ">" {
            return 10217;
        }
        if name == "lfloor" {
            return 8970;
        }
        if name == "rfloor" {
            return 8971;
        }
        if name == "lceil" {
            return 8968;
        }
        if name == "rceil" {
            return 8969;
        }
        if name == "/" {
            return 47;
        }
        if name == "\\" {
            return 92;
        }
        if name == "\\uparrow" {
            return 8593;
        }
        if name == "\\downarrow" {
            return 8595;
        }
        if name == "\\Uparrow" {
            return 8657;
        }
        if name == "\\Downarrow" {
            return 8659;
        }
        0
    }
    /// What \left…\right has to cover: TeX's delimiterfactor and shortfall.
    pub fn coverFor(b: &Rc<RefCell<MathBox>>, st: i64) -> f64 {
        let axis: f64 = MathLayout::sigma("axisHeight", st);
        let delta: f64 = MathLayout::maxOf(b.borrow().h - axis, b.borrow().d + axis);
        let a: f64 = ((delta / 500.0) * 901.0) * 2.0;
        let c: f64 = 2.0 * delta - 0.5 * MathLayout::sm(st);
        MathLayout::maxOf(a, c)
    }
    pub fn baseLetter(c: i64) -> i64 {
        if (c >= 224 && c <= 229) {
            return 97;
        }
        if (c >= 192 && c <= 197) {
            return 65;
        }
        if (c >= 232 && c <= 235) {
            return 101;
        }
        if (c >= 200 && c <= 203) {
            return 69;
        }
        if (c >= 236 && c <= 239) {
            return 305;
        }
        if (c >= 204 && c <= 207) {
            return 73;
        }
        if (c >= 242 && c <= 246) {
            return 111;
        }
        if (c >= 210 && c <= 214) {
            return 79;
        }
        if (c >= 249 && c <= 252) {
            return 117;
        }
        if (c >= 217 && c <= 220) {
            return 85;
        }
        if c == 241 {
            return 110;
        }
        if c == 209 {
            return 78;
        }
        if c == 253 {
            return 121;
        }
        if c == 255 {
            return 121;
        }
        if c == 231 {
            return 99;
        }
        if c == 199 {
            return 67;
        }
        0
    }
    pub fn accentMark(c: i64) -> i64 {
        let mut k: i64 = c;
        if (c >= 192 && c <= 222) {
            k = c + 32;
        }
        if (((k == 224 || k == 232) || k == 236) || k == 242) || k == 249 {
            return 715;
        }
        if ((((k == 225 || k == 233) || k == 237) || k == 243) || k == 250) || k == 253 {
            return 714;
        }
        if (((k == 226 || k == 234) || k == 238) || k == 244) || k == 251 {
            return 710;
        }
        if (k == 227 || k == 241) || k == 245 {
            return 732;
        }
        if ((((k == 228 || k == 235) || k == 239) || k == 246) || k == 252) || k == 255 {
            return 168;
        }
        if k == 229 {
            return 730;
        }
        if k == 231 {
            return 184;
        }
        0
    }
    /// --- colour --------------------------------------------------------------------------
    pub fn colorOf(name0: &str) -> String {
        let name: String = name0.trim().to_string();
        if name.is_empty() {
            return String::new();
        }
        if MathText::char_at(&name, 0) == 35 {
            return name;
        }
        if name == "red" {
            return "#d62728".to_string();
        }
        if name == "blue" {
            return "#1f77b4".to_string();
        }
        if name == "green" {
            return "#2ca02c".to_string();
        }
        if name == "orange" {
            return "#ff7f0e".to_string();
        }
        if name == "purple" {
            return "#9467bd".to_string();
        }
        if name == "violet" {
            return "#9467bd".to_string();
        }
        if name == "magenta" {
            return "#e377c2".to_string();
        }
        if name == "pink" {
            return "#f7b6d2".to_string();
        }
        if name == "brown" {
            return "#8c564b".to_string();
        }
        if name == "gray" {
            return "#7f7f7f".to_string();
        }
        if name == "grey" {
            return "#7f7f7f".to_string();
        }
        if name == "cyan" {
            return "#17becf".to_string();
        }
        if name == "teal" {
            return "#008080".to_string();
        }
        if name == "yellow" {
            return "#e8c10c".to_string();
        }
        if name == "black" {
            return "#000000".to_string();
        }
        if name == "white" {
            return "#ffffff".to_string();
        }
        // a six-digit hex without its #, as \color{FF8800}
        if (MathText::str_len(&name) as i64) == 6 {
            return format!("#{}", name);
        }
        name
    }
    /// --- lists ---------------------------------------------------------------------
    pub fn list(&mut self, atoms: &Vec<Rc<RefCell<MathAtom>>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut boxes: Vec<Rc<RefCell<MathBox>>> = Vec::new();
        let mut spaces: Vec<bool> = Vec::new();
        let mut i: i64 = 0;
        let n: i64 = atoms.len() as i64;
        while i < n {
            let mut a: Rc<RefCell<MathAtom>> = atoms[i as usize].clone();
            if a.borrow().kind == "space" {
                let mut sp: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
                sp.borrow_mut().w = a.borrow().num * MathLayout::sm(st);
                sp.borrow_mut().r#type = "space".to_string();
                boxes.push(sp.clone());
                spaces.push(true);
            } else {
                if a.borrow().kind == "style" {
                    let ns: i64 = (a.borrow().num.floor() as i64) * 2;
                    let mut b0: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), ns);
                    boxes.push(b0.clone());
                    spaces.push(false);
                } else {
                    boxes.push(self.atom(&a, st));
                    spaces.push(false);
                }
            }
            i += 1;
        }
        MathLayout::reclassify(&boxes);
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        let mut x: f64 = 0.0;
        let mut prev: String = String::new();
        let mu: f64 = MathLayout::sigma("quad", st) / 18.0;
        let script: bool = MathLayout::size(st) >= 2;
        let mut k: i64 = 0;
        let bn: i64 = boxes.len() as i64;
        while k < bn {
            let mut b: Rc<RefCell<MathBox>> = boxes[k as usize].clone();
            if b.borrow().r#type == "space" {
                x += b.borrow().w;
            } else {
                if !prev.is_empty() {
                    x += ((MathLayout::spacing(&prev, &b.borrow().r#type, script)) as f64) * mu;
                }
                out.borrow_mut().place(&b, x, 0.0);
                x += b.borrow().w;
                if b.borrow().h > out.borrow().h {
                    out.borrow_mut().h = b.borrow().h;
                }
                if b.borrow().d > out.borrow().d {
                    out.borrow_mut().d = b.borrow().d;
                }
                prev = b.borrow().r#type.clone();
                if k == bn - 1 {
                    out.borrow_mut().italic = b.borrow().italic;
                }
            }
            k += 1;
        }
        out.borrow_mut().w = x;
        let mut only: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        if bn == 1 {
            only = boxes[0].clone();
        }
        if bn == 1 && only.borrow().isChar {
            out.borrow_mut().isChar = true;
            out.borrow_mut().italic = only.borrow().italic;
            out.borrow_mut().skew = only.borrow().skew;
        }
        out
    }
    /// --- one atom ------------------------------------------------------------------
    pub fn atom(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut nuc: Rc<RefCell<MathBox>> = self.nucleus(a, st);
        if a.borrow().kind == "sym" || a.borrow().kind == "opname" {
            if a.borrow().r#type == "op" {
                let use_limits: bool = a.borrow()
                    .limits == 1 || a.borrow()
                    .limits == 0 && MathLayout::isDisplay(st);
                if use_limits && (a.borrow().hasSup || a.borrow().hasSub) {
                    return self.limits(&nuc, a, st);
                }
            }
        }
        if a.borrow().kind == "stack" {
            return self.limits(&nuc, a, st);
        }
        if a.borrow().hasSup || a.borrow().hasSub {
            return self.scripts(&nuc, a, st);
        }
        nuc
    }
    pub fn nucleus(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let k: String = a.borrow().kind.clone();
        if k == "sym" {
            if a.borrow().r#type == "op" {
                return self.bigOp(a, st);
            }
            let mut _tmp_121 = a.borrow().font.clone();
            let mut _tmp_122 = a.borrow().cp.clone();
            let mut b: Rc<RefCell<MathBox>> = self.glyph(_tmp_121,
                _tmp_122,
                st,
                0.0,
                1.0,
                1.0
            );
            b.borrow_mut().r#type = a.borrow().r#type.clone();
            b.borrow_mut().isChar = true;
            return b;
        }
        if k == "list" {
            let mut lb: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
            lb.borrow_mut().r#type = a.borrow().r#type.clone();
            return lb;
        }
        if k == "frac" {
            return self.frac(a, st);
        }
        if k == "sqrt" {
            return self.sqrt(a, st);
        }
        if k == "lr" {
            return self.leftRight(a, st);
        }
        if k == "big" {
            let z: f64 = a.borrow().num;
            let mut bb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().ldelim.clone(),
                ((z * 0.6 + 0.6) * MathLayout::sm(st)) * 0.99,
                st
            );
            bb.borrow_mut().r#type = a.borrow().r#type.clone();
            return bb;
        }
        if k == "accent" {
            return self.accent(a, st);
        }
        if k == "over" || k == "under" {
            return self.overUnder(a, st);
        }
        if k == "text" {
            let mut _tmp_128 = a.borrow().text.clone();
            return self.text(&_tmp_128, a.borrow().textFont.clone(), st, String::new());
        }
        if k == "error" {
            return self.text(&a.borrow().text.clone(), 0, st, "#cc0000".to_string());
        }
        if k == "opname" {
            let mut ob: Rc<RefCell<MathBox>> = self.text(&a.borrow().text.clone(),
                0,
                st,
                String::new()
            );
            ob.borrow_mut().r#type = a.borrow().r#type.clone();
            return ob;
        }
        if k == "array" {
            return self.array(a, st);
        }
        if k == "stack" {
            let mut sb: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
            sb.borrow_mut().r#type = a.borrow().r#type.clone();
            return sb;
        }
        if k == "box" {
            return self.boxed(a, st);
        }
        if k == "not" {
            let mut base: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
            let mut slash: Rc<RefCell<MathBox>> = self.glyph(MathFont::main_font(),
                47,
                st,
                0.0,
                1.0,
                1.0
            );
            let mut nb: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
            nb.borrow_mut().place(&base, 0.0, 0.0);
            nb.borrow_mut().place(&slash, (base.borrow().w - slash.borrow().w) / 2.0, 0.0);
            nb.borrow_mut().w = base.borrow().w;
            let mut _tmp_138 = base.borrow().h.clone();
            let _tmp_140 = MathLayout::maxOf(_tmp_138, slash.borrow().h.clone());
            nb.borrow_mut().h = _tmp_140;
            let mut _tmp_141 = base.borrow().d.clone();
            let _tmp_143 = MathLayout::maxOf(_tmp_141, slash.borrow().d.clone());
            nb.borrow_mut().d = _tmp_143;
            nb.borrow_mut().r#type = a.borrow().r#type.clone();
            return nb;
        }
        if k == "phantom" {
            let mut pb: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
            pb.borrow_mut().items.clear();
            if a.borrow().text == "\\hphantom" {
                pb.borrow_mut().h = 0.0;
                pb.borrow_mut().d = 0.0;
            }
            if a.borrow().text == "\\vphantom" {
                pb.borrow_mut().w = 0.0;
            }
            return pb;
        }
        if k == "color" {
            let save: String = self.color.clone();
            let _tmp_147 = MathLayout::colorOf(&a.borrow().text.clone());
            self.color = _tmp_147;
            let mut cb: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
            self.color = save.clone();
            return cb;
        }
        if k == "style" {
            return self.list(&a.borrow().body.clone(), (a.borrow().num.floor() as i64) * 2);
        }
        Rc::new(RefCell::new(MathBox::new()))
    }
    /// One glyph at the style's size, its baseline `dy` below the box's, and
    /// stretched by sx / sy.
    pub fn glyph(&self, font: i64, cp: i64, st: i64, dy: f64, sx: f64, sy: f64) -> Rc<RefCell<MathBox>> {
        let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(font, cp);
        let s: f64 = MathLayout::sm(st);
        let mut b: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        b.borrow_mut().w = (g.borrow().w * s) * sx;
        b.borrow_mut().h = (g.borrow().h * s) * sy - dy;
        b.borrow_mut().d = (g.borrow().d * s) * sy + dy;
        b.borrow_mut().italic = g.borrow().ic * s;
        b.borrow_mut().skew = g.borrow().sk * s;
        let mut it: Rc<RefCell<MathItem>> = Rc::new(RefCell::new(MathItem::new()));
        it.borrow_mut().font = font;
        it.borrow_mut().cp = cp;
        it.borrow_mut().y = dy;
        it.borrow_mut().scale = s;
        it.borrow_mut().sx = sx;
        it.borrow_mut().sy = sy;
        it.borrow_mut().color = self.color.clone();
        b.borrow_mut().items.push(it.clone());
        b
    }
    /// ∑ ∫ ∏: the larger cut, centred on the math axis.
    pub fn bigOp(&self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut font: i64 = a.borrow().font;
        let size1: i64 = MathFont::size1();
        let mut want: i64 = size1;
        if MathLayout::isDisplay(st) {
            want = size1 + 1;
        }
        if MathFont::has(want, a.borrow().cp.clone()) {
            font = want;
        } else {
            if MathFont::has(size1, a.borrow().cp.clone()) {
                font = size1;
            }
        }
        let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(font, a.borrow().cp.clone());
        let s: f64 = MathLayout::sm(st);
        let dy: f64 = ((g.borrow().h - g.borrow().d) * s) / 2.0 - MathLayout::sigma("axisHeight", st);
        let mut _tmp_158 = a.borrow().cp.clone();
        let mut b: Rc<RefCell<MathBox>> = self.glyph(font,
            _tmp_158,
            st,
            dy,
            1.0,
            1.0
        );
        b.borrow_mut().r#type = "op".to_string();
        b
    }
    /// --- scripts -------------------------------------------------------------------
    pub fn scripts(&mut self, nuc: &Rc<RefCell<MathBox>>, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let sup_st: i64 = MathLayout::supStyle(st);
        let sub_st: i64 = MathLayout::subStyle(st);
        let s: f64 = MathLayout::sm(st);
        let xh: f64 = MathLayout::sigma("xHeight", st);
        let mut u: f64 = 0.0;
        let mut v: f64 = 0.0;
        if !nuc.borrow().isChar {
            u = nuc.borrow().h - MathLayout::sigma("supDrop", sup_st);
            v = nuc.borrow().d + MathLayout::sigma("subDrop", sub_st);
        }
        let mut sup_b: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        let mut sub_b: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        if a.borrow().hasSup {
            let _tmp_160 = self.list(&a.borrow().sup.clone(), sup_st);
            sup_b = _tmp_160;
            let mut p: f64 = MathLayout::sigma("sup2", st);
            if MathLayout::isDisplay(st) {
                p = MathLayout::sigma("sup1", st);
            }
            if MathLayout::cramped(st) {
                p = MathLayout::sigma("sup3", st);
            }
            u = MathLayout::maxOf(u, MathLayout::maxOf(p, sup_b.borrow().d + 0.25 * xh));
        }
        if a.borrow().hasSub {
            let _tmp_162 = self.list(&a.borrow().sub.clone(), sub_st);
            sub_b = _tmp_162;
        }
        if a.borrow().hasSub && !a.borrow().hasSup {
            v = MathLayout::maxOf(v, MathLayout::maxOf(MathLayout::sigma("sub1", st), sub_b.borrow().h - 0.8 * xh));
        }
        if a.borrow().hasSub && a.borrow().hasSup {
            v = MathLayout::maxOf(v, MathLayout::sigma("sub2", st));
            let theta: f64 = MathLayout::sigma("ruleThickness", st);
            let gap: f64 = (u - sup_b.borrow().d) - (sub_b.borrow().h - v);
            if gap < 4.0 * theta {
                v = (v + 4.0 * theta) - gap;
                let psi: f64 = 0.8 * xh - (u - sup_b.borrow().d);
                if psi > 0.0 {
                    u += psi;
                    v -= psi;
                }
            }
        }
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out.borrow_mut().r#type = nuc.borrow().r#type.clone();
        out.borrow_mut().place(nuc, 0.0, 0.0);
        out.borrow_mut().h = nuc.borrow().h;
        out.borrow_mut().d = nuc.borrow().d;
        let mut ic: f64 = 0.0;
        if nuc.borrow().isChar {
            ic = nuc.borrow().italic;
        }
        // a big operator's subscript sits under its slant
        // a big operator's superscript goes past its slant, the subscript
        // stays under it
        let sub_x: f64 = nuc.borrow().w;
        if nuc.borrow().r#type == "op" {
            ic = nuc.borrow().italic;
        }
        let mut w: f64 = nuc.borrow().w;
        let space: f64 = 0.05 * s;
        if a.borrow().hasSup {
            out.borrow_mut().place(&sup_b, nuc.borrow().w + ic, 0.0 - u);
            w = MathLayout::maxOf(w, ((nuc.borrow().w + ic) + sup_b.borrow().w) + space);
            let _tmp_167 = MathLayout::maxOf(out.borrow().h.clone(), u + sup_b.borrow().h);
            out.borrow_mut().h = _tmp_167;
        }
        if a.borrow().hasSub {
            out.borrow_mut().place(&sub_b, sub_x, v);
            w = MathLayout::maxOf(w, (sub_x + sub_b.borrow().w) + space);
            let _tmp_169 = MathLayout::maxOf(out.borrow().d.clone(), v + sub_b.borrow().d);
            out.borrow_mut().d = _tmp_169;
        }
        out.borrow_mut().w = w;
        out
    }
    /// Limits above and below: ∑ in display, \lim, \overset.
    pub fn limits(&mut self, nuc: &Rc<RefCell<MathBox>>, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let sup_st: i64 = MathLayout::supStyle(st);
        let sub_st: i64 = MathLayout::subStyle(st);
        let mut sup_b: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        let mut sub_b: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        if a.borrow().hasSup {
            let _tmp_171 = self.list(&a.borrow().sup.clone(), sup_st);
            sup_b = _tmp_171;
        }
        if a.borrow().hasSub {
            let _tmp_173 = self.list(&a.borrow().sub.clone(), sub_st);
            sub_b = _tmp_173;
        }
        let mut ic: f64 = 0.0;
        if nuc.borrow().isChar && nuc.borrow().r#type == "op" {
            ic = nuc.borrow().italic;
        }
        let mut _tmp_174 = nuc.borrow().w.clone();
        let _tmp_175 = MathLayout::maxOf(sup_b.borrow().w, sub_b.borrow().w);
        let w: f64 = MathLayout::maxOf(_tmp_174, _tmp_175);
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out.borrow_mut().r#type = a.borrow().r#type.clone();
        out.borrow_mut().place(nuc, (w - nuc.borrow().w) / 2.0, 0.0);
        out.borrow_mut().h = nuc.borrow().h;
        out.borrow_mut().d = nuc.borrow().d;
        let five: f64 = MathLayout::sigma("bigOpSpacing5", st);
        if a.borrow().hasSup {
            let _tmp_182 = MathLayout::sigma("bigOpSpacing1", st);
            let kern: f64 = MathLayout::maxOf(_tmp_182, MathLayout::sigma("bigOpSpacing3", st) - sup_b.borrow().d);
            let base: f64 = (nuc.borrow().h + kern) + sup_b.borrow().d;
            out.borrow_mut().place(&sup_b, (w - sup_b.borrow().w) / 2.0 + ic / 2.0, 0.0 - base);
            out.borrow_mut().h = (base + sup_b.borrow().h) + five;
        }
        if a.borrow().hasSub {
            let _tmp_186 = MathLayout::sigma("bigOpSpacing2", st);
            let kern2: f64 = MathLayout::maxOf(_tmp_186, MathLayout::sigma("bigOpSpacing4", st) - sub_b.borrow().h);
            let base2: f64 = (nuc.borrow().d + kern2) + sub_b.borrow().h;
            out.borrow_mut().place(&sub_b, (w - sub_b.borrow().w) / 2.0 - ic / 2.0, base2);
            out.borrow_mut().d = (base2 + sub_b.borrow().d) + five;
        }
        out.borrow_mut().w = w;
        out
    }
    /// --- fractions -----------------------------------------------------------------
    pub fn frac(&mut self, a: &Rc<RefCell<MathAtom>>, st0: i64) -> Rc<RefCell<MathBox>> {
        let mut st: i64 = st0;
        if a.borrow().fstyle == 0 {
            st = st0 % 2;
        }
        if a.borrow().fstyle == 1 {
            st = 2 + st0 % 2;
        }
        let mut nb: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(),
            MathLayout::numStyle(st)
        );
        let mut db: Rc<RefCell<MathBox>> = self.list(&a.borrow().body2.clone(),
            MathLayout::denStyle(st)
        );
        let has_bar: bool = a.borrow().num != 0.0;
        let theta0: f64 = MathLayout::sigma("ruleThickness", st);
        let mut theta: f64 = 0.0;
        if has_bar {
            theta = theta0;
        }
        let mut num_shift: f64 = 0.0;
        let mut den_shift: f64 = 0.0;
        let mut clearance: f64 = 0.0;
        if MathLayout::isDisplay(st) {
            num_shift = MathLayout::sigma("num1", st);
            den_shift = MathLayout::sigma("denom1", st);
            if has_bar {
                clearance = 3.0 * theta;
            } else {
                clearance = 7.0 * theta0;
            }
        } else {
            den_shift = MathLayout::sigma("denom2", st);
            if has_bar {
                num_shift = MathLayout::sigma("num2", st);
                clearance = theta;
            } else {
                num_shift = MathLayout::sigma("num3", st);
                clearance = 3.0 * theta0;
            }
        }
        let axis: f64 = MathLayout::sigma("axisHeight", st);
        if has_bar {
            let nc: f64 = (num_shift - nb.borrow().d) - (axis + theta / 2.0);
            if nc < clearance {
                num_shift += clearance - nc;
            }
            let dc: f64 = (axis - theta / 2.0) - (db.borrow().h - den_shift);
            if dc < clearance {
                den_shift += clearance - dc;
            }
        } else {
            let clr: f64 = (num_shift - nb.borrow().d) - (db.borrow().h - den_shift);
            if clr < clearance {
                num_shift += (clearance - clr) / 2.0;
                den_shift += (clearance - clr) / 2.0;
            }
        }
        let mut _tmp_192 = nb.borrow().w.clone();
        let w: f64 = MathLayout::maxOf(_tmp_192, db.borrow().w.clone());
        let mut body: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        body.borrow_mut().place(&nb, (w - nb.borrow().w) / 2.0, 0.0 - num_shift);
        body.borrow_mut().place(&db, (w - db.borrow().w) / 2.0, den_shift);
        if has_bar {
            body.borrow_mut().rule(0.0, 0.0 - (axis + theta / 2.0), w, theta, self.color.clone());
        }
        body.borrow_mut().w = w;
        body.borrow_mut().h = num_shift + nb.borrow().h;
        body.borrow_mut().d = den_shift + db.borrow().d;
        if !a.borrow().ldelim.is_empty() {
            let mut size: f64 = MathLayout::sigma("delim2", st);
            if MathLayout::isDisplay(st) {
                size = MathLayout::sigma("delim1", st);
            }
            let mut lb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().ldelim.clone(), size, st);
            let mut rb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().rdelim.clone(), size, st);
            let mut out: Rc<RefCell<MathBox>> = MathLayout::row3(&lb, &body, &rb);
            out.borrow_mut().r#type = "inner".to_string();
            return out;
        }
        let pad: f64 = 0.12 * MathLayout::sm(st);
        let mut out2: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out2.borrow_mut().place(&body, pad, 0.0);
        out2.borrow_mut().w = w + 2.0 * pad;
        out2.borrow_mut().h = body.borrow().h;
        out2.borrow_mut().d = body.borrow().d;
        out2.borrow_mut().r#type = "inner".to_string();
        out2
    }
    /// --- roots ---------------------------------------------------------------------
    pub fn sqrt(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut body: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(),
            MathLayout::cramp(st)
        );
        let s: f64 = MathLayout::sm(st);
        let theta: f64 = MathLayout::sigma("ruleThickness", st);
        let mut phi: f64 = theta;
        if MathLayout::isDisplay(st) {
            phi = MathLayout::sigma("xHeight", st);
        }
        let mut clear: f64 = theta + phi / 4.0;
        let min_total: f64 = ((body.borrow().h + body.borrow().d) + clear) + theta;
        let mut pick: Rc<RefCell<MathItem>> = self.delimGlyph(8730, min_total, st);
        let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(pick.borrow().font.clone(), 8730);
        let gh: f64 = (g.borrow().h * s) * pick.borrow().sy;
        let gd: f64 = (g.borrow().d * s) * pick.borrow().sy;
        let total: f64 = gh + gd;
        if total > min_total {
            clear += (total - min_total) / 2.0;
        }
        let rule_top: f64 = 0.0 - ((body.borrow().h + clear) + theta);
        let mut _tmp_205 = pick.borrow().font.clone();
        let mut _tmp_206 = pick.borrow().sy.clone();
        let mut surd: Rc<RefCell<MathBox>> = self.glyph(_tmp_205,
            8730,
            st,
            rule_top + gh,
            1.0,
            _tmp_206
        );
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out.borrow_mut().place(&surd, 0.0, 0.0);
        out.borrow_mut().place(&body, surd.borrow().w.clone(), 0.0);
        out.borrow_mut().rule(surd.borrow().w - 0.005 * s, rule_top, body.borrow().w + 0.01 * s, theta, self.color.clone());
        out.borrow_mut().w = surd.borrow().w + body.borrow().w;
        out.borrow_mut().h = 0.0 - rule_top;
        let mut _tmp_210 = body.borrow().d.clone();
        let _tmp_212 = MathLayout::maxOf(_tmp_210, surd.borrow().d.clone());
        out.borrow_mut().d = _tmp_212;
        if a.borrow().body2.is_empty() {
            return out;
        }
        // the index, raised, tucked into the surd
        let mut idx: Rc<RefCell<MathBox>> = self.list(&a.borrow().body2.clone(), 6);
        let mu: f64 = s / 18.0;
        let raise: f64 = 0.6 * (out.borrow().h - out.borrow().d);
        let before: f64 = 5.0 * mu;
        let after: f64 = -10.0 * mu;
        let root_x: f64 = (before + idx.borrow().w) + after;
        let mut shift: f64 = 0.0;
        if root_x < 0.0 {
            shift = 0.0 - root_x;
        }
        let mut res: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        res.borrow_mut().place(&idx, before + shift, 0.0 - raise);
        res.borrow_mut().place(&out, root_x + shift, 0.0);
        res.borrow_mut().w = (root_x + shift) + out.borrow().w;
        let _tmp_216 = MathLayout::maxOf(out.borrow().h.clone(), raise + idx.borrow().h);
        res.borrow_mut().h = _tmp_216;
        res.borrow_mut().d = out.borrow().d;
        res
    }
    /// The smallest cut of `cp` at least `minTotal` tall (height + depth), or
    /// the largest one stretched to it. Returned as an item: font and sy.
    pub fn delimGlyph(&self, cp: i64, min_total: f64, st: i64) -> Rc<RefCell<MathItem>> {
        let s: f64 = MathLayout::sm(st);
        let mut best: Rc<RefCell<MathItem>> = Rc::new(RefCell::new(MathItem::new()));
        best.borrow_mut().font = -1;
        let mut i: i64 = 0;
        while i < 5 {
            let mut f: i64 = 0;
            if i > 0 {
                f = i + 4;
            }
            if MathFont::has(f, cp) {
                let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(f, cp);
                best.borrow_mut().font = f;
                best.borrow_mut().sy = 1.0;
                if (g.borrow().h + g.borrow().d) * s >= min_total {
                    return best;
                }
            }
            i += 1;
        }
        if best.borrow().font < 0 {
            best.borrow_mut().font = 0;
            best.borrow_mut().sy = 1.0;
            return best;
        }
        let mut g2: Rc<RefCell<MathGlyph>> = MathFont::glyph(best.borrow().font.clone(), cp);
        let tot: f64 = (g2.borrow().h + g2.borrow().d) * s;
        if tot > 0.0 {
            best.borrow_mut().sy = min_total / tot;
        }
        best
    }
    /// A delimiter at least `minTotal` tall, centred on the axis.
    pub fn delim(&self, name: &str, min_total: f64, st: i64) -> Rc<RefCell<MathBox>> {
        let cp: i64 = MathLayout::delimCp(name);
        if cp == 0 {
            // `.`, or a name nobody draws: the null delimiter's width
            let mut e: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
            e.borrow_mut().w = 0.12 * MathLayout::sm(st);
            return e;
        }
        let mut pick: Rc<RefCell<MathItem>> = self.delimGlyph(cp, min_total, st);
        let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(pick.borrow().font.clone(), cp);
        let s: f64 = MathLayout::sm(st);
        let gh: f64 = (g.borrow().h * s) * pick.borrow().sy;
        let gd: f64 = (g.borrow().d * s) * pick.borrow().sy;
        let dy: f64 = (gh - gd) / 2.0 - MathLayout::sigma("axisHeight", st);
        let mut _tmp_221 = pick.borrow().font.clone();
        return self.glyph(_tmp_221, cp, st, dy, 1.0, pick.borrow().sy.clone());
    }
    pub fn leftRight(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut body: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
        let need: f64 = MathLayout::coverFor(&body, st);
        let mut lb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().ldelim.clone(), need, st);
        let mut rb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().rdelim.clone(), need, st);
        let mut out: Rc<RefCell<MathBox>> = MathLayout::row3(&lb, &body, &rb);
        out.borrow_mut().r#type = "inner".to_string();
        out
    }
    /// --- accents, over- and underlines ---------------------------------------------------
    pub fn accent(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut body: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(),
            MathLayout::cramp(st)
        );
        let s: f64 = MathLayout::sm(st);
        let xh: f64 = MathLayout::sigma("xHeight", st);
        let mut _tmp_227 = a.borrow().font.clone();
        let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(_tmp_227, a.borrow().cp.clone());
        let mut delta: f64 = body.borrow().h;
        if delta > xh {
            delta = xh;
        }
        let raise: f64 = body.borrow().h - delta;
        let mut sx: f64 = 1.0;
        let gw: f64 = g.borrow().w * s;
        if a.borrow().stretch && gw > 0.0 {
            let want: f64 = body.borrow().w * 0.9;
            if want > gw {
                sx = want / gw;
            }
        }
        let mut _tmp_229 = a.borrow().font.clone();
        let mut _tmp_230 = a.borrow().cp.clone();
        let mut ab: Rc<RefCell<MathBox>> = self.glyph(_tmp_229,
            _tmp_230,
            st,
            0.0 - raise,
            sx,
            1.0
        );
        let mut x: f64 = (body.borrow().w - ab.borrow().w) / 2.0;
        if body.borrow().isChar {
            x += body.borrow().skew;
        }
        // the combining vector arrow has no advance: its ink sits to the left
        if a.borrow().cp == 8407 {
            x = body.borrow().w / 2.0 + 0.25 * s;
            if body.borrow().isChar {
                x += body.borrow().skew;
            }
        }
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out.borrow_mut().place(&body, 0.0, 0.0);
        out.borrow_mut().place(&ab, x, 0.0);
        out.borrow_mut().w = body.borrow().w;
        let _tmp_233 = MathLayout::maxOf(body.borrow().h.clone(), raise + g.borrow().h * s);
        out.borrow_mut().h = _tmp_233;
        out.borrow_mut().d = body.borrow().d;
        out.borrow_mut().italic = body.borrow().italic;
        out
    }
    pub fn overUnder(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let theta: f64 = MathLayout::sigma("ruleThickness", st);
        if a.borrow().kind == "over" {
            let mut body: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(),
                MathLayout::cramp(st)
            );
            let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
            out.borrow_mut().place(&body, 0.0, 0.0);
            let top: f64 = (body.borrow().h + 3.0 * theta) + theta;
            let mut _tmp_237 = body.borrow().w.clone();
            out.borrow_mut().rule(0.0, 0.0 - top, _tmp_237, theta, self.color.clone());
            out.borrow_mut().w = body.borrow().w;
            out.borrow_mut().h = top + theta;
            out.borrow_mut().d = body.borrow().d;
            return out;
        }
        let mut body2: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
        let mut out2: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        out2.borrow_mut().place(&body2, 0.0, 0.0);
        let at: f64 = body2.borrow().d + 3.0 * theta;
        let mut _tmp_242 = body2.borrow().w.clone();
        out2.borrow_mut().rule(0.0, at, _tmp_242, theta, self.color.clone());
        out2.borrow_mut().w = body2.borrow().w;
        out2.borrow_mut().h = body2.borrow().h;
        out2.borrow_mut().d = (at + theta) + theta;
        out2
    }
    /// --- text ----------------------------------------------------------------------------
    ///
    /// Upright, from the main font; a letter with an accent the font does not
    /// carry is built from the letter and the accent, which covers the Nordic
    /// and Western European letters a \text{} in a Finnish document has.
    pub fn text(&mut self, s0: &str, font: i64, st: i64, col: String) -> Rc<RefCell<MathBox>> {
        let save: String = self.color.clone();
        if !col.is_empty() {
            self.color = col.clone();
        }
        let s: f64 = MathLayout::sm(st);
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        let mut x: f64 = 0.0;
        // by code point: `charAt` is a UTF-8 byte on Go and a UTF-16 unit on
        // JavaScript, and either one splits a character past ASCII (or past
        // the BMP) into glyphs of its pieces
        let mut chars: Vec<i64> = s0.chars().map(|c| c as i64).collect::<Vec<i64>>();
        let mut i: i64 = 0;
        let n: i64 = chars.len() as i64;
        while i < n {
            let c: i64 = chars[i as usize];
            // a space, ~, and the no-break spaces U+00A0 / U+202F
            if (c == 32 || c == 126) || (c == 160 || c == 8239) {
                x += 0.333 * s;
            } else {
                let mut b: Rc<RefCell<MathBox>> = self.textChar(c, font, st);
                out.borrow_mut().place(&b, x, 0.0);
                x += b.borrow().w;
                if b.borrow().h > out.borrow().h {
                    out.borrow_mut().h = b.borrow().h;
                }
                if b.borrow().d > out.borrow().d {
                    out.borrow_mut().d = b.borrow().d;
                }
            }
            i += 1;
        }
        out.borrow_mut().w = x;
        self.color = save.clone();
        out
    }
    pub fn textChar(&self, c: i64, font0: i64, st: i64) -> Rc<RefCell<MathBox>> {
        let mut font: i64 = font0;
        if font == MathFont::math_italic() && !MathFont::has(font, c) {
            font = MathFont::main_font();
        }
        if MathFont::has(font, c) {
            return self.glyph(font, c, st, 0.0, 1.0, 1.0);
        }
        if MathFont::has(MathFont::main_font(), c) {
            return self.glyph(MathFont::main_font(),
                c,
                st,
                0.0,
                1.0,
                1.0
            ).clone();
        }
        let alike: i64 = MathFont::lookalike(c);
        if alike > 0 && MathFont::has(MathFont::main_font(), alike) {
            return self.glyph(MathFont::main_font(),
                alike,
                st,
                0.0,
                1.0,
                1.0
            ).clone();
        }
        let base: i64 = MathLayout::baseLetter(c);
        let acc: i64 = MathLayout::accentMark(c);
        if base > 0 && acc > 0 {
            let mut bb: Rc<RefCell<MathBox>> = self.glyph(font,
                base,
                st,
                0.0,
                1.0,
                1.0
            );
            let _s: f64 = MathLayout::sm(st);
            let mut raise: f64 = bb.borrow().h - MathLayout::sigma("xHeight", st);
            if raise < 0.0 {
                raise = 0.0;
            }
            let mut ab: Rc<RefCell<MathBox>> = self.glyph(MathFont::main_font(),
                acc,
                st,
                0.0 - raise,
                1.0,
                1.0
            );
            let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
            out.borrow_mut().place(&bb, 0.0, 0.0);
            out.borrow_mut().place(&ab, (bb.borrow().w - ab.borrow().w) / 2.0, 0.0);
            out.borrow_mut().w = bb.borrow().w;
            let _tmp_253 = MathLayout::maxOf(bb.borrow().h.clone(), raise + ab.borrow().h);
            out.borrow_mut().h = _tmp_253;
            out.borrow_mut().d = bb.borrow().d;
            return out;
        }
        self.glyph(MathFont::main_font(), 63, st, 0.0, 1.0, 1.0)
    }
    /// --- arrays --------------------------------------------------------------------------
    pub fn array(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let env: String = a.borrow().env.clone();
        let mut cell_st: i64 = 2;
        let aligned: bool = ((env == "aligned" || env == "align") || (env == "align*" || env == "split")) || (env == "alignat" || env == "alignedat");
        let gathered: bool = env == "gathered" || (env == "gather" || env == "gather*");
        if (aligned || gathered) || (env == "dcases" || env == "darray") {
            cell_st = 0;
        }
        if MathLayout::size(st) >= 2 {
            cell_st = st;
        }
        if env == "smallmatrix" {
            cell_st = 4;
        }
        let s: f64 = MathLayout::sm(st);
        let mut skip: f64 = 1.2;
        if (env == "cases" || env == "dcases") || env == "rcases" {
            skip = 1.44;
        }
        if aligned || gathered {
            skip = 1.45;
        }
        skip *= s;
        let rows: i64 = a.borrow().rows;
        let cols: i64 = a.borrow().cols;
        let mut cells: Vec<Rc<RefCell<MathBox>>> = Vec::new();
        let mut col_w: Vec<f64> = Vec::new();
        let mut row_h: Vec<f64> = Vec::new();
        let mut row_d: Vec<f64> = Vec::new();
        let mut c: i64 = 0;
        while c < cols {
            col_w.push(0.0);
            c += 1;
        }
        let mut r: i64 = 0;
        while r < rows {
            let mut rh: f64 = 0.7 * skip;
            let mut rd: f64 = 0.3 * skip;
            c = 0;
            while c < cols {
                let idx: i64 = r * cols + c;
                let mut body: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
                if idx < (a.borrow().cells.len() as i64) {
                    let mut cell: Rc<RefCell<MathCell>> = a.borrow().cells[idx as usize].clone();
                    body = cell.borrow().body.clone();
                }
                // the right half of an aligned pair starts after an empty
                // ord, so its `=` is spaced as a relation
                if aligned && c % 2 == 1 {
                    let mut lead: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
                    lead.push(MathAtom::of("list".to_string()));
                    let mut k: i64 = 0;
                    while k < (body.len() as i64) {
                        lead.push(body[k as usize].clone());
                        k += 1;
                    }
                    body = lead.clone();
                }
                let mut b: Rc<RefCell<MathBox>> = self.list(&body, cell_st);
                cells.push(b.clone());
                if b.borrow().w > col_w[c as usize] {
                    col_w[c as usize] = b.borrow().w;
                }
                if b.borrow().h > rh {
                    rh = b.borrow().h;
                }
                if b.borrow().d > rd {
                    rd = b.borrow().d;
                }
                c += 1;
            }
            row_h.push(rh);
            row_d.push(rd);
            r += 1;
        }
        // where each column starts
        let mut col_x: Vec<f64> = Vec::new();
        let mut x: f64 = 0.0;
        let mut outer: f64 = 0.0;
        if env == "array" || env == "darray" {
            outer = 0.5 * s;
        }
        x = outer;
        c = 0;
        while c < cols {
            col_x.push(x);
            x += col_w[c as usize];
            if c < cols - 1 {
                if aligned {
                    if c % 2 == 1 {
                        x += 1.0 * s;
                    }
                } else {
                    x += 1.0 * s;
                }
            }
            c += 1;
        }
        let width: f64 = x + outer;
        // the rows, top down
        let mut total: f64 = 0.0;
        r = 0;
        while r < rows {
            total = (total + row_h[r as usize]) + row_d[r as usize];
            if r < rows - 1 {
                total += a.borrow().rowGap[r as usize] * s;
            }
            r += 1;
        }
        let axis: f64 = MathLayout::sigma("axisHeight", st);
        let mut body2: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        body2.borrow_mut().h = total / 2.0 + axis;
        body2.borrow_mut().d = total / 2.0 - axis;
        body2.borrow_mut().w = width;
        let mut y: f64 = 0.0;
        r = 0;
        while r < rows {
            let base: f64 = (y + row_h[r as usize]) - body2.borrow().h;
            c = 0;
            while c < cols {
                let mut b2: Rc<RefCell<MathBox>> = cells[(r * cols + c) as usize].clone();
                let mut al: String = "c".to_string();
                if c < (a.borrow().colAlign.len() as i64) {
                    al = a.borrow().colAlign[c as usize].clone();
                }
                let mut cx: f64 = col_x[c as usize];
                if al == "c" {
                    cx += (col_w[c as usize] - b2.borrow().w) / 2.0;
                }
                if al == "r" {
                    cx += col_w[c as usize] - b2.borrow().w;
                }
                body2.borrow_mut().place(&b2, cx, base);
                c += 1;
            }
            y = (y + row_h[r as usize]) + row_d[r as usize];
            if r < rows - 1 {
                y += a.borrow().rowGap[r as usize] * s;
            }
            r += 1;
        }
        if a.borrow().ldelim.is_empty() && a.borrow().rdelim.is_empty() {
            return body2;
        }
        let need: f64 = MathLayout::coverFor(&body2, st);
        let mut lb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().ldelim.clone(), need, st);
        let mut rb: Rc<RefCell<MathBox>> = self.delim(&a.borrow().rdelim.clone(), need, st);
        if a.borrow().ldelim != "." && env != "cases" {
            // matrices sit a little inside their brackets
            lb.borrow_mut().w = lb.borrow().w + 0.1 * s;
            let mut rb2: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
            rb2.borrow_mut().place(&rb, 0.1 * s, 0.0);
            rb2.borrow_mut().w = rb.borrow().w + 0.1 * s;
            rb2.borrow_mut().h = rb.borrow().h;
            rb2.borrow_mut().d = rb.borrow().d;
            rb = rb2.clone();
        }
        if env == "cases" {
            lb.borrow_mut().w = lb.borrow().w + 0.15 * s;
        }
        let mut out: Rc<RefCell<MathBox>> = MathLayout::row3(&lb, &body2, &rb);
        out.borrow_mut().r#type = "inner".to_string();
        out
    }
    /// --- \boxed -------------------------------------------------------------------------
    pub fn boxed(&mut self, a: &Rc<RefCell<MathAtom>>, st: i64) -> Rc<RefCell<MathBox>> {
        let mut body: Rc<RefCell<MathBox>> = self.list(&a.borrow().body.clone(), st);
        let s: f64 = MathLayout::sm(st);
        let pad: f64 = 0.3 * s;
        let t: f64 = 0.04 * s;
        let mut out: Rc<RefCell<MathBox>> = Rc::new(RefCell::new(MathBox::new()));
        let w: f64 = (body.borrow().w + 2.0 * pad) + 2.0 * t;
        let top: f64 = (body.borrow().h + pad) + t;
        let bottom: f64 = (body.borrow().d + pad) + t;
        out.borrow_mut().place(&body, pad + t, 0.0);
        out.borrow_mut().rule(0.0, 0.0 - top, w, t, self.color.clone());
        out.borrow_mut().rule(0.0, bottom - t, w, t, self.color.clone());
        out.borrow_mut().rule(0.0, 0.0 - top, t, top + bottom, self.color.clone());
        out.borrow_mut().rule(w - t, 0.0 - top, t, top + bottom, self.color.clone());
        out.borrow_mut().w = w;
        out.borrow_mut().h = top;
        out.borrow_mut().d = bottom;
        out
    }
}
