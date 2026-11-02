// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::math_parser::MathAtom;
use crate::math_parser::MathCell;
use crate::math_parser::MathParser;
use crate::rgr::MathFont;
use crate::rgr::MathText;

/// ==============================================================================
/// MathOmml.rgr — TeX math, as Office Math (OMML) and as plain Unicode text
/// ==============================================================================
///
///   MathOmml.omml(tex)     the children of an `m:oMath`: what PowerPoint and
///                          Word keep an equation as, so it opens as one the
///                          reader can edit with the equation tools
///   MathOmml.linear(tex)   the same formula as one line of Unicode —
///                          "FV = PMT ⋅ ((1 + r)ⁿ − 1)/r" — for a reader that
///                          has no equations (Keynote, Google Slides, a table
///                          cell), so it never sees the TeX source
///
/// Both read the atoms `MathParser` makes, so what the stage draws and what the
/// file holds are the same formula.
///
/// A run in the OMML carries an `m:rPr` and its text and nothing else; the
/// writer puts its own run properties (`a:rPr` in a slide, `w:rPr` in a Word
/// document) in front of every `<m:t`, so the colour and the size are the
/// host's. Letters are written plain: the math engine sets a letter italic
/// unless the run says `m:sty`.
/// ==============================================================================
#[derive(Clone)]
pub struct MathOmml {
}

impl MathOmml {
    pub fn new() -> Self {
        Self {
        }
    }
    pub fn omml(tex: &str) -> String {
        let mut atoms: Vec<Rc<RefCell<MathAtom>>> = MathParser::parse(tex);
        MathOmml::list(&atoms)
    }
    pub fn linear(tex: &str) -> String {
        let mut atoms: Vec<Rc<RefCell<MathAtom>>> = MathParser::parse(tex);
        MathOmml::lin(&atoms, true).trim().to_string()
    }
    pub fn esc(s: &str) -> String {
        let mut out: String = String::new();
        let mut i: i64 = 0;
        let n: i64 = MathText::str_len(&s) as i64;
        while i < n {
            let c: i64 = MathText::char_at(&s, i);
            if c == 38 {
                out = format!("{}&amp;", out);
            } else {
                if c == 60 {
                    out = format!("{}&lt;", out);
                } else {
                    if c == 62 {
                        out = format!("{}&gt;", out);
                    } else {
                        if c == 34 {
                            out = format!("{}&quot;", out);
                        } else {
                            out = format!("{}{}", out, MathText::substr(&s, i, i + 1));
                        }
                    }
                }
            }
            i += 1;
        }
        out
    }
    /// --- OMML ------------------------------------------------------------------
    pub fn run(text: &str, sty: &str, scr: &str) -> String {
        let mut pr: String = String::new();
        if !scr.is_empty() {
            pr = format!("{}<m:scr m:val=\"{}\"/>", pr, scr);
        }
        if !sty.is_empty() {
            pr = format!("{}<m:sty m:val=\"{}\"/>", pr, sty);
        }
        if !pr.is_empty() {
            pr = format!("<m:rPr>{}</m:rPr>", pr);
        }
        format!("<m:r>{}<m:t xml:space=\"preserve\">{}</m:t></m:r>", pr, MathOmml::esc(text))
    }
    /// How a glyph is set: "" as the math engine decides (italic letters),
    /// "p" upright, "b" bold. `scr` is the alphabet: double-struck, script.
    pub fn styOf(a: &Rc<RefCell<MathAtom>>) -> String {
        if a.borrow().font == MathFont::mainFont() {
            if MathOmml::isLetter(a.borrow().cp.clone()) {
                return "p".to_string();
            }
            return String::new();
        }
        if a.borrow().font == MathFont::bold() {
            return "b".to_string();
        }
        String::new()
    }
    pub fn scrOf(a: &Rc<RefCell<MathAtom>>) -> String {
        if a.borrow().font == MathFont::ams() {
            if MathOmml::isLetter(a.borrow().cp.clone()) {
                return "double-struck".to_string();
            }
        }
        if a.borrow().font == MathFont::cal() {
            return "script".to_string();
        }
        String::new()
    }
    pub fn isLetter(c: i64) -> bool {
        if (c >= 65 && c <= 90) {
            return true;
        }
        if (c >= 97 && c <= 122) {
            return true;
        }
        false
    }
    pub fn plain(a: &Rc<RefCell<MathAtom>>) -> bool {
        if a.borrow().kind != "sym" {
            return false;
        }
        if a.borrow().hasSup {
            return false;
        }
        if a.borrow().hasSub {
            return false;
        }
        if a.borrow().r#type == "op" {
            return false;
        }
        true
    }
    pub fn delimChar(d: &str) -> String {
        if d == "." {
            return String::new();
        }
        if d == "<" {
            return char::from_u32(10216 as u32).unwrap_or('\0').to_string();
        }
        if d == ">" {
            return char::from_u32(10217 as u32).unwrap_or('\0').to_string();
        }
        if d == "||" {
            return char::from_u32(8214 as u32).unwrap_or('\0').to_string();
        }
        if d == "lfloor" {
            return char::from_u32(8970 as u32).unwrap_or('\0').to_string();
        }
        if d == "rfloor" {
            return char::from_u32(8971 as u32).unwrap_or('\0').to_string();
        }
        if d == "lceil" {
            return char::from_u32(8968 as u32).unwrap_or('\0').to_string();
        }
        if d == "rceil" {
            return char::from_u32(8969 as u32).unwrap_or('\0').to_string();
        }
        d.to_string()
    }
    /// The combining mark OMML puts over its base, for the spacing accent
    /// the parser keeps.
    pub fn accentChar(cp: i64) -> String {
        if cp == 710 {
            return char::from_u32(770 as u32).unwrap_or('\0').to_string();
        }
        if cp == 732 {
            return char::from_u32(771 as u32).unwrap_or('\0').to_string();
        }
        if cp == 711 {
            return char::from_u32(780 as u32).unwrap_or('\0').to_string();
        }
        if cp == 728 {
            return char::from_u32(774 as u32).unwrap_or('\0').to_string();
        }
        if cp == 713 {
            return char::from_u32(773 as u32).unwrap_or('\0').to_string();
        }
        if cp == 729 {
            return char::from_u32(775 as u32).unwrap_or('\0').to_string();
        }
        if cp == 168 {
            return char::from_u32(776 as u32).unwrap_or('\0').to_string();
        }
        if cp == 730 {
            return char::from_u32(778 as u32).unwrap_or('\0').to_string();
        }
        if cp == 714 {
            return char::from_u32(769 as u32).unwrap_or('\0').to_string();
        }
        if cp == 715 {
            return char::from_u32(768 as u32).unwrap_or('\0').to_string();
        }
        char::from_u32(cp as u32).unwrap_or('\0').to_string()
    }
    pub fn spaceText(em: f64) -> String {
        if em >= 1.5 {
            return format!("{}{}", char::from_u32(8195 as u32).unwrap_or('\0'), char::from_u32(8195 as u32).unwrap_or('\0'));
        }
        if em >= 0.9 {
            return char::from_u32(8195 as u32).unwrap_or('\0').to_string();
        }
        if em >= 0.45 {
            return char::from_u32(8194 as u32).unwrap_or('\0').to_string();
        }
        if em >= 0.25 {
            return char::from_u32(8197 as u32).unwrap_or('\0').to_string();
        }
        if em > 0.0 {
            return char::from_u32(8201 as u32).unwrap_or('\0').to_string();
        }
        String::new()
    }
    pub fn e(atoms: &Vec<Rc<RefCell<MathAtom>>>) -> String {
        format!("<m:e>{}</m:e>", MathOmml::list(atoms))
    }
    /// A list of atoms. Plain glyphs in the same style are one run, so "PMT"
    /// is one word to edit and not three; a big operator takes what follows it,
    /// up to the next relation, as its body.
    pub fn list(given: &Vec<Rc<RefCell<MathAtom>>>) -> String {
        let mut atoms: Vec<Rc<RefCell<MathAtom>>> = MathOmml::grouped(given);
        let mut out: String = String::new();
        let mut i: i64 = 0;
        let n: i64 = atoms.len() as i64;
        while i < n {
            let mut a: Rc<RefCell<MathAtom>> = atoms[i as usize].clone();
            if MathOmml::plain(&a) {
                let sty: String = MathOmml::styOf(&a);
                let scr: String = MathOmml::scrOf(&a);
                let mut text: String = char::from_u32(a.borrow().cp as u32).unwrap_or('\0').to_string();
                let mut j: i64 = i + 1;
                let mut more: bool = true;
                while j < n && more {
                    let mut b: Rc<RefCell<MathAtom>> = atoms[j as usize].clone();
                    more = false;
                    if MathOmml::plain(&b) {
                        if MathOmml::styOf(&b) == sty && MathOmml::scrOf(&b) == scr {
                            text = format!("{}{}", text, char::from_u32(b.borrow().cp as u32).unwrap_or('\0'));
                            more = true;
                            j += 1;
                        }
                    }
                }
                out = format!("{}{}", out, MathOmml::run(&text, &sty, &scr));
                i = j;
            } else {
                if a.borrow().kind == "sym" && a.borrow().r#type == "op" {
                    let mut rest: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
                    let mut j2: i64 = i + 1;
                    let mut stop: bool = false;
                    while j2 < n && !stop {
                        let mut b2: Rc<RefCell<MathAtom>> = atoms[j2 as usize].clone();
                        if b2.borrow().r#type == "rel" || b2.borrow().kind == "rowend" {
                            stop = true;
                        } else {
                            rest.push(b2.clone());
                            j2 += 1;
                        }
                    }
                    out = format!("{}{}", out, MathOmml::nary(&a, &rest));
                    i = j2;
                } else {
                    if a.borrow().kind == "opname" && i + 1 < n {
                        let mut next: Rc<RefCell<MathAtom>> = atoms[(i + 1) as usize].clone();
                        if next.borrow().r#type == "rel" || (next.borrow().r#type == "bin" || (next.borrow().r#type == "punct" || next.borrow().kind == "space")) {
                            out = format!("{}{}", out, MathOmml::atom(&a));
                            i += 1;
                        } else {
                            let mut arg: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
                            arg.push(next.clone());
                            out = format!("{}<m:func><m:fName>{}</m:fName>{}</m:func>", out, MathOmml::atom(&a), MathOmml::e(&arg));
                            i += 2;
                        }
                    } else {
                        out = format!("{}{}", out, MathOmml::atom(&a));
                        i += 1;
                    }
                }
            }
        }
        out
    }
    /// TeX attaches the n of (1+r)^n to the ")" alone. The parenthesis and
    /// what it closes are one delimited group here, carrying the script, so
    /// the exponent belongs to the whole bracket as an equation editor makes it.
    pub fn grouped(atoms: &Vec<Rc<RefCell<MathAtom>>>) -> Vec<Rc<RefCell<MathAtom>>> {
        let mut out: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
        let mut i: i64 = 0;
        let n: i64 = atoms.len() as i64;
        while i < n {
            let mut a: Rc<RefCell<MathAtom>> = atoms[i as usize].clone();
            let mut done: bool = false;
            if (a.borrow().kind == "sym" && a.borrow().r#type == "close") && (a.borrow().hasSup || a.borrow().hasSub) {
                let mut depth: i64 = 0;
                let mut j: i64 = (out.len() as i64) - 1;
                let mut at: i64 = -1;
                while j >= 0 && at < 0 {
                    let mut b: Rc<RefCell<MathAtom>> = out[j as usize].clone();
                    if b.borrow().kind == "sym" && b.borrow().r#type == "close" {
                        depth += 1;
                    }
                    if b.borrow().kind == "sym" && b.borrow().r#type == "open" {
                        if depth == 0 {
                            if !b.borrow().hasSup && !b.borrow().hasSub {
                                at = j;
                            }
                            j = -1;
                        } else {
                            depth -= 1;
                        }
                    }
                    j -= 1;
                }
                if at >= 0 {
                    let mut open: Rc<RefCell<MathAtom>> = out[at as usize].clone();
                    let mut lr: Rc<RefCell<MathAtom>> = MathAtom::of("lr".to_string());
                    lr.borrow_mut().ldelim = char::from_u32(open.borrow().cp as u32).unwrap_or('\0').to_string();
                    lr.borrow_mut().rdelim = char::from_u32(a.borrow().cp as u32).unwrap_or('\0').to_string();
                    lr.borrow_mut().sup = a.borrow().sup.clone();
                    lr.borrow_mut().sub = a.borrow().sub.clone();
                    lr.borrow_mut().hasSup = a.borrow().hasSup;
                    lr.borrow_mut().hasSub = a.borrow().hasSub;
                    let mut k: i64 = at + 1;
                    while k < (out.len() as i64) {
                        lr.borrow_mut().body.push(out[k as usize].clone());
                        k += 1;
                    }
                    let mut keep: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
                    let mut m: i64 = 0;
                    while m < at {
                        keep.push(out[m as usize].clone());
                        m += 1;
                    }
                    keep.push(lr.clone());
                    out = keep.clone();
                    done = true;
                }
            }
            if !done {
                out.push(a.clone());
            }
            i += 1;
        }
        out
    }
    /// ∑ ∫ ∏ … with their limits and the body after them.
    pub fn nary(a: &Rc<RefCell<MathAtom>>, rest: &Vec<Rc<RefCell<MathAtom>>>) -> String {
        let mut under: bool = a.borrow().limits != 2;
        if MathParser::isIntegral(a.borrow().cp.clone()) {
            under = a.borrow().limits == 1;
        }
        let mut pr: String = format!("<m:chr m:val=\"{}\"/>", MathOmml::esc(&char::from_u32(a.borrow().cp as u32).unwrap_or('\0').to_string()));
        if under {
            pr = format!("{}<m:limLoc m:val=\"undOvr\"/>", pr);
        } else {
            pr = format!("{}<m:limLoc m:val=\"subSup\"/>", pr);
        }
        if !a.borrow().hasSub {
            pr = format!("{}<m:subHide m:val=\"1\"/>", pr);
        }
        if !a.borrow().hasSup {
            pr = format!("{}<m:supHide m:val=\"1\"/>", pr);
        }
        let mut out: String = format!("<m:nary><m:naryPr>{}</m:naryPr>", pr);
        out = format!("{}<m:sub>{}</m:sub>", out, MathOmml::list(&a.borrow().sub));
        out = format!("{}<m:sup>{}</m:sup>", out, MathOmml::list(&a.borrow().sup));
        format!("{}{}</m:nary>", out, MathOmml::e(rest))
    }
    /// One atom with its scripts.
    pub fn atom(a: &Rc<RefCell<MathAtom>>) -> String {
        let base: String = MathOmml::nucleus(a);
        if a.borrow().kind == "stack" {
            return base;
        }
        if a.borrow().kind == "opname" && a.borrow().limits != 2 {
            // \lim_{x→0}: the limit under the name
            if a.borrow().hasSub && !a.borrow().hasSup {
                return format!("<m:limLow><m:e>{}</m:e><m:lim>{}</m:lim></m:limLow>", base, MathOmml::list(&a.borrow().sub.clone()));
            }
        }
        if a.borrow().hasSub && a.borrow().hasSup {
            let mut _tmp_222 = a.borrow().sub.clone();
            return format!("<m:sSubSup><m:e>{}</m:e><m:sub>{}</m:sub><m:sup>{}</m:sup></m:sSubSup>", base, MathOmml::list(&_tmp_222), MathOmml::list(&a.borrow().sup.clone()));
        }
        if a.borrow().hasSup {
            return format!("<m:sSup><m:e>{}</m:e><m:sup>{}</m:sup></m:sSup>", base, MathOmml::list(&a.borrow().sup.clone()));
        }
        if a.borrow().hasSub {
            return format!("<m:sSub><m:e>{}</m:e><m:sub>{}</m:sub></m:sSub>", base, MathOmml::list(&a.borrow().sub.clone()));
        }
        base
    }
    pub fn nucleus(a: &Rc<RefCell<MathAtom>>) -> String {
        let k: String = a.borrow().kind.clone();
        if k == "sym" {
            let _tmp_226 = MathOmml::styOf(a);
            let _tmp_227 = MathOmml::scrOf(a);
            return MathOmml::run(
                &char::from_u32(a.borrow().cp as u32).unwrap_or('\0').to_string(),
                &_tmp_226,
                &_tmp_227
            ).clone();
        }
        if k == "list" {
            return MathOmml::list(&a.borrow().body.clone());
        }
        if k == "style" || k == "color" {
            return MathOmml::list(&a.borrow().body.clone());
        }
        if k == "frac" {
            let mut f: String = "";
            if a.borrow().num == 0.0 {
                f = "<m:fPr><m:type m:val=\"noBar\"/></m:fPr>";
            }
            let mut _tmp_230 = a.borrow().body.clone();
            let fx: String = format!("<m:f>{}<m:num>{}</m:num><m:den>{}</m:den></m:f>", f, MathOmml::list(&_tmp_230), MathOmml::list(&a.borrow().body2.clone()));
            if !a.borrow().ldelim.is_empty() {
                let mut _tmp_232 = a.borrow().ldelim.clone();
                return MathOmml::delimited(&fx, &_tmp_232, &a.borrow().rdelim.clone());
            }
            return fx;
        }
        if k == "sqrt" {
            if a.borrow().body2.is_empty() {
                return format!("<m:rad><m:radPr><m:degHide m:val=\"1\"/></m:radPr><m:deg/>{}</m:rad>", MathOmml::e(&a.borrow().body.clone()));
            }
            let mut _tmp_235 = a.borrow().body2.clone();
            return format!("<m:rad><m:deg>{}</m:deg>{}</m:rad>", MathOmml::list(&_tmp_235), MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "lr" {
            let mut _tmp_237 = a.borrow().ldelim.clone();
            let mut _tmp_238 = a.borrow().rdelim.clone();
            let _tmp_239 = MathOmml::list(&a.borrow().body);
            return MathOmml::delimited(&_tmp_239, &_tmp_237, &_tmp_238);
        }
        if k == "big" {
            let _tmp_241 = MathOmml::delimChar(&a.borrow().ldelim);
            return MathOmml::run(&_tmp_241, "", "");
        }
        if k == "accent" {
            let _tmp_243 = MathOmml::accentChar(a.borrow().cp);
            return format!("<m:acc><m:accPr><m:chr m:val=\"{}\"/></m:accPr>{}</m:acc>", MathOmml::esc(&_tmp_243), MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "over" {
            return format!("<m:bar><m:barPr><m:pos m:val=\"top\"/></m:barPr>{}</m:bar>", MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "under" {
            return format!("<m:bar><m:barPr><m:pos m:val=\"bot\"/></m:barPr>{}</m:bar>", MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "text" {
            let mut sty: String = "p";
            if a.borrow().textFont == MathFont::bold() {
                sty = "b";
            }
            if a.borrow().textFont == MathFont::mathItalic() {
                sty = "i";
            }
            return MathOmml::run(&a.borrow().text.clone(), sty, "");
        }
        if k == "opname" {
            return MathOmml::run(&a.borrow().text.clone(), "p", "");
        }
        if k == "space" {
            let sp: String = MathOmml::spaceText(a.borrow().num.clone());
            if sp.is_empty() {
                return String::new();
            }
            return MathOmml::run(&sp, "", "");
        }
        if k == "array" {
            return MathOmml::array(a);
        }
        if k == "stack" {
            if a.borrow().hasSup {
                let mut _tmp_251 = a.borrow().body.clone();
                return format!("<m:limUpp>{}<m:lim>{}</m:lim></m:limUpp>", MathOmml::e(&_tmp_251), MathOmml::list(&a.borrow().sup.clone()));
            }
            let mut _tmp_253 = a.borrow().body.clone();
            return format!("<m:limLow>{}<m:lim>{}</m:lim></m:limLow>", MathOmml::e(&_tmp_253), MathOmml::list(&a.borrow().sub.clone()));
        }
        if k == "box" {
            return format!("<m:borderBox>{}</m:borderBox>", MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "phantom" {
            return format!("<m:phant><m:phantPr><m:show m:val=\"0\"/></m:phantPr>{}</m:phant>", MathOmml::e(&a.borrow().body.clone()));
        }
        if k == "not" {
            let _tmp_257 = format!("{}{}", MathOmml::lin(&a.borrow().body, false), char::from_u32(824 as u32).unwrap_or('\0'));
            return MathOmml::run(&_tmp_257, "", "");
        }
        if k == "error" {
            return MathOmml::run(&a.borrow().text.clone(), "p", "");
        }
        String::new()
    }
    pub fn delimited(inner: &str, l: &str, r: &str) -> String {
        let _tmp_260 = MathOmml::delimChar(l);
        let pr: String = format!("<m:dPr><m:begChr m:val=\"{}\"/><m:endChr m:val=\"{}\"/></m:dPr>", MathOmml::esc(&_tmp_260), MathOmml::esc(&MathOmml::delimChar(r)));
        format!("<m:d>{}<m:e>{}</m:e></m:d>", pr, inner)
    }
    pub fn cellAt(a: &Rc<RefCell<MathAtom>>, i: i64) -> Vec<Rc<RefCell<MathAtom>>> {
        if i < (a.borrow().cells.len() as i64) {
            let mut c: Rc<RefCell<MathCell>> = a.borrow().cells[i as usize].clone();
            return c.borrow().body.clone();
        }
        let mut none: Vec<Rc<RefCell<MathAtom>>> = Vec::new();
        none
    }
    /// One column stacks as an equation array; more is a matrix.
    pub fn array(a: &Rc<RefCell<MathAtom>>) -> String {
        let mut out: String = String::new();
        if a.borrow().cols <= 1 {
            out = "<m:eqArr>".to_string();
            let mut r: i64 = 0;
            while r < a.borrow().rows {
                out = format!("{}{}", out, MathOmml::e(&MathOmml::cellAt(a, r)));
                r += 1;
            }
            out = format!("{}</m:eqArr>", out);
        } else {
            out = format!("<m:m><m:mPr><m:mcs><m:mc><m:mcPr><m:count m:val=\"{}\"/><m:mcJc m:val=\"center\"/></m:mcPr></m:mc></m:mcs></m:mPr>", a.borrow().cols);
            let mut r2: i64 = 0;
            while r2 < a.borrow().rows {
                out = format!("{}<m:mr>", out);
                let mut c: i64 = 0;
                while c < a.borrow().cols {
                    out = format!("{}{}", out, MathOmml::e(&MathOmml::cellAt(a, r2 * a.borrow().cols + c)));
                    c += 1;
                }
                out = format!("{}</m:mr>", out);
                r2 += 1;
            }
            out = format!("{}</m:m>", out);
        }
        if !a.borrow().ldelim.is_empty() || !a.borrow().rdelim.is_empty() {
            let mut l: String = a.borrow().ldelim.clone();
            let mut rr: String = a.borrow().rdelim.clone();
            if l.is_empty() {
                l = ".".to_string();
            }
            if rr.is_empty() {
                rr = ".".to_string();
            }
            return MathOmml::delimited(&out, &l, &rr);
        }
        out
    }
    /// --- linear Unicode ----------------------------------------------------------
    /// A character in the Unicode superscript (or subscript) alphabet, or ""
    /// when it has none.
    pub fn supChar(c: i64) -> String {
        if c == 48 {
            return char::from_u32(8304 as u32).unwrap_or('\0').to_string();
        }
        if c == 49 {
            return char::from_u32(185 as u32).unwrap_or('\0').to_string();
        }
        if c == 50 {
            return char::from_u32(178 as u32).unwrap_or('\0').to_string();
        }
        if c == 51 {
            return char::from_u32(179 as u32).unwrap_or('\0').to_string();
        }
        if (c >= 52 && c <= 57) {
            return char::from_u32((8308 + (c - 52)) as u32).unwrap_or('\0').to_string();
        }
        if c == 43 || c == 8722 {
            if c == 43 {
                return char::from_u32(8314 as u32).unwrap_or('\0').to_string();
            }
            return char::from_u32(8315 as u32).unwrap_or('\0').to_string();
        }
        if c == 45 {
            return char::from_u32(8315 as u32).unwrap_or('\0').to_string();
        }
        if c == 61 {
            return char::from_u32(8316 as u32).unwrap_or('\0').to_string();
        }
        if c == 40 {
            return char::from_u32(8317 as u32).unwrap_or('\0').to_string();
        }
        if c == 41 {
            return char::from_u32(8318 as u32).unwrap_or('\0').to_string();
        }
        if c == 110 {
            return char::from_u32(8319 as u32).unwrap_or('\0').to_string();
        }
        if c == 105 {
            return char::from_u32(8305 as u32).unwrap_or('\0').to_string();
        }
        if c == 8242 {
            return char::from_u32(8242 as u32).unwrap_or('\0').to_string();
        }
        String::new()
    }
    pub fn subChar(c: i64) -> String {
        if (c >= 48 && c <= 57) {
            return char::from_u32((8320 + (c - 48)) as u32).unwrap_or('\0').to_string();
        }
        if c == 43 {
            return char::from_u32(8330 as u32).unwrap_or('\0').to_string();
        }
        if c == 45 || c == 8722 {
            return char::from_u32(8331 as u32).unwrap_or('\0').to_string();
        }
        if c == 61 {
            return char::from_u32(8332 as u32).unwrap_or('\0').to_string();
        }
        if c == 40 {
            return char::from_u32(8333 as u32).unwrap_or('\0').to_string();
        }
        if c == 41 {
            return char::from_u32(8334 as u32).unwrap_or('\0').to_string();
        }
        if c == 97 {
            return char::from_u32(8336 as u32).unwrap_or('\0').to_string();
        }
        if c == 101 {
            return char::from_u32(8337 as u32).unwrap_or('\0').to_string();
        }
        if c == 111 {
            return char::from_u32(8338 as u32).unwrap_or('\0').to_string();
        }
        if c == 120 {
            return char::from_u32(8339 as u32).unwrap_or('\0').to_string();
        }
        if c == 105 {
            return char::from_u32(7522 as u32).unwrap_or('\0').to_string();
        }
        if c == 106 {
            return char::from_u32(11388 as u32).unwrap_or('\0').to_string();
        }
        if c == 110 {
            return char::from_u32(8345 as u32).unwrap_or('\0').to_string();
        }
        if c == 116 {
            return char::from_u32(8348 as u32).unwrap_or('\0').to_string();
        }
        String::new()
    }
    /// `s` in the script alphabet when every character has one, else "".
    pub fn scripted(s: &str, sup: bool) -> String {
        let mut out: String = String::new();
        // by code point: the characters compared against here (′ −) are past
        // ASCII, and `charAt` is a UTF-8 byte on Go, so it never matched them
        let mut chars: Vec<i64> = s.chars().map(|c| c as i64).collect::<Vec<i64>>();
        let mut i: i64 = 0;
        let n: i64 = chars.len() as i64;
        while i < n {
            let c: i64 = chars[i as usize];
            let mut m: String = String::new();
            if sup {
                m = MathOmml::supChar(c);
            } else {
                m = MathOmml::subChar(c);
            }
            if m.is_empty() {
                return String::new();
            }
            out = format!("{}{}", out, m);
            i += 1;
        }
        out
    }
    /// A script, as raised characters or as ^x / ^(…)
    pub fn script(atoms: &Vec<Rc<RefCell<MathAtom>>>, sup: bool) -> String {
        let s: String = MathOmml::lin(atoms, false).trim().to_string();
        let raised: String = MathOmml::scripted(&s, sup);
        if !raised.is_empty() {
            return raised;
        }
        let mut mark: String = "_";
        if sup {
            mark = "^";
        }
        format!("{}{}", mark, MathOmml::group(&s))
    }
    /// More than one character goes in parentheses, so a/(b + c) reads right.
    pub fn group(s: &str) -> String {
        // code points, so one α or 𝑥 is one character on every target
        let mut chars: Vec<i64> = s.chars().map(|c| c as i64).collect::<Vec<i64>>();
        let n: i64 = chars.len() as i64;
        if n <= 1 {
            return s.to_string();
        }
        let first: i64 = chars[0];
        let last: i64 = chars[(n - 1) as usize];
        if first == 40 && last == 41 {
            // already one group only when the first ( closes at the end
            let mut depth: i64 = 0;
            let mut i: i64 = 0;
            let mut whole: bool = true;
            while i < n {
                let c: i64 = chars[i as usize];
                if c == 40 {
                    depth += 1;
                }
                if c == 41 {
                    depth -= 1;
                    if depth == 0 && i < n - 1 {
                        whole = false;
                    }
                }
                i += 1;
            }
            if whole {
                return s.to_string();
            }
        }
        let mut j: i64 = 0;
        let mut simple: bool = true;
        while j < n {
            let c2: i64 = chars[j as usize];
            if c2 == 32 || (c2 == 43 || (c2 == 8722 || (c2 == 45 || (c2 == 47 || c2 == 61)))) {
                simple = false;
            }
            j += 1;
        }
        if simple {
            return s.to_string();
        }
        format!("({})", s)
    }
    pub fn lin(given: &Vec<Rc<RefCell<MathAtom>>>, top: bool) -> String {
        let mut atoms: Vec<Rc<RefCell<MathAtom>>> = MathOmml::grouped(given);
        let mut out: String = String::new();
        let mut i: i64 = 0;
        let n: i64 = atoms.len() as i64;
        while i < n {
            let mut a: Rc<RefCell<MathAtom>> = atoms[i as usize].clone();
            let mut s: String = MathOmml::linNucleus(&a);
            if top && (a.borrow().r#type == "rel" || a.borrow().r#type == "bin") {
                s = format!(" {} ", s);
            }
            if a.borrow().hasSub && a.borrow().kind != "stack" {
                s = format!("{}{}", s, MathOmml::script(&a.borrow().sub, false));
            }
            if a.borrow().hasSup && a.borrow().kind != "stack" {
                s = format!("{}{}", s, MathOmml::script(&a.borrow().sup, true));
            }
            if a.borrow().kind == "opname" {
                if i + 1 < n {
                    s = format!("{} ", s);
                }
            }
            out = format!("{}{}", out, s);
            i += 1;
        }
        out
    }
    pub fn linNucleus(a: &Rc<RefCell<MathAtom>>) -> String {
        let k: String = a.borrow().kind.clone();
        if k == "sym" {
            return char::from_u32(a.borrow().cp as u32).unwrap_or('\0').to_string();
        }
        if (k == "list" || k == "style") || (k == "color" || k == "box") {
            return MathOmml::lin(&a.borrow().body.clone(), true);
        }
        if k == "frac" {
            let _tmp_263 = MathOmml::lin(&a.borrow().body, true).trim().to_string();
            let num: String = MathOmml::group(&_tmp_263);
            let _tmp_265 = MathOmml::lin(&a.borrow().body2, true).trim().to_string();
            let den: String = MathOmml::group(&_tmp_265);
            if a.borrow().num == 0.0 {
                return format!("({} over {})", num, den);
            }
            return format!("{}/{}", num, den);
        }
        if k == "sqrt" {
            let mut root: String = char::from_u32(8730 as u32).unwrap_or('\0').to_string();
            if !a.borrow().body2.is_empty() {
                let idx: String = MathOmml::lin(&a.borrow().body2.clone(), false).trim().to_string();
                if idx == "3" {
                    root = char::from_u32(8731 as u32).unwrap_or('\0').to_string();
                } else {
                    if idx == "4" {
                        root = char::from_u32(8732 as u32).unwrap_or('\0').to_string();
                    } else {
                        root = format!("{}{}", MathOmml::scripted(&idx, true), root);
                    }
                }
            }
            let body: String = MathOmml::lin(&a.borrow().body.clone(), true).trim().to_string();
            if (body.chars().count() as i64) > 1 {
                return format!("{}({})", root, body);
            }
            return format!("{}{}", root, body);
        }
        if k == "lr" {
            let mut _tmp_269 = a.borrow().ldelim.clone();
            let mut _tmp_270 = a.borrow().body.clone();
            return format!("{}{}{}", MathOmml::delimChar(&_tmp_269), MathOmml::lin(&_tmp_270, true), MathOmml::delimChar(&a.borrow().rdelim.clone()));
        }
        if k == "big" {
            return MathOmml::delimChar(&a.borrow().ldelim.clone());
        }
        if k == "accent" {
            let mut _tmp_273 = a.borrow().body.clone();
            return format!("{}{}", MathOmml::lin(&_tmp_273, false), MathOmml::accentChar(a.borrow().cp.clone()));
        }
        if k == "over" {
            return MathOmml::lin(&a.borrow().body.clone(), false);
        }
        if k == "under" {
            return MathOmml::lin(&a.borrow().body.clone(), false);
        }
        if (k == "text" || k == "opname") || k == "error" {
            return a.borrow().text.clone();
        }
        if k == "space" {
            if a.borrow().num >= 0.25 {
                return " ".to_string();
            }
            return String::new();
        }
        if k == "array" {
            let mut out: String = String::new();
            let mut r: i64 = 0;
            while r < a.borrow().rows {
                if r > 0 {
                    out = format!("{}; ", out);
                }
                let mut c: i64 = 0;
                let mut cols: i64 = a.borrow().cols;
                if cols < 1 {
                    cols = 1;
                }
                while c < cols {
                    if c > 0 {
                        out = format!("{} ", out);
                    }
                    out = format!("{}{}", out, MathOmml::lin(&MathOmml::cellAt(a, r * cols + c), true).trim().to_string());
                    c += 1;
                }
                r += 1;
            }
            let l: String = MathOmml::delimChar(&a.borrow().ldelim.clone());
            let rr: String = MathOmml::delimChar(&a.borrow().rdelim.clone());
            return format!("{}{}{}", l, out, rr);
        }
        if k == "stack" {
            let base: String = MathOmml::lin(&a.borrow().body.clone(), false);
            if a.borrow().hasSup {
                return format!("{}{}", base, MathOmml::script(&a.borrow().sup.clone(), true));
            }
            return format!("{}{}", base, MathOmml::script(&a.borrow().sub.clone(), false));
        }
        if k == "not" {
            return format!("{}{}", MathOmml::lin(&a.borrow().body.clone(), false), char::from_u32(824 as u32).unwrap_or('\0'));
        }
        String::new()
    }
}
