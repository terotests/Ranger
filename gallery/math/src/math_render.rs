// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use ranger::cell::RefCell;
use std::rc::Rc;

use crate::math_layout::MathBox;
use crate::math_layout::MathItem;
use crate::math_layout::MathLayout;
use crate::rgr::MathFont;
use crate::rgr::MathGlyph;
use crate::rgr::MathPathBuf;
use crate::rgr::{EVGColor, EVGElement, EVGUnit, MathText};

/// ==============================================================================
/// MathRender.rgr — a laid-out formula, as something to draw
/// ==============================================================================
///
///   MathRender.element(tex display px colour)   an EVGElement: a div the size
///                                                of the formula, holding one
///                                                filled path per colour
///   MathRender.svg(tex display px colour)       the same, as an SVG document
///
/// The glyphs are outlines, so every backend that fills a path — the WebGL
/// painter, the PDF writer, the PowerPoint writer — draws the formula exactly
/// as it was measured, with no font to embed or to miss.
///
/// The fill rule is nonzero and every outline and rule is wound the same way,
/// so where two pieces touch (a root's bar on its sign, a kerned pair) they
/// fill together rather than cancelling each other out.
/// ==============================================================================
#[derive(Clone)]
pub struct MathRender {
}

impl MathRender {
    pub fn new() -> Self {
        Self {
        }
    }
    /// Room around the box for ink that leaves it: an italic f's hook, a
    /// slanted integral. In ems.
    pub fn pad() -> f64 {
        0.2
    }
    fn element(tex: &str, display: bool, px: f64, colour: &str) -> Rc<RefCell<EVGElement>> {
        let mut b: Rc<RefCell<MathBox>> = MathLayout::layout(tex, display);
        MathRender::box_element(&b, px, colour)
    }
    /// The colours a box is drawn in, "" being the default.
    pub fn colours(b: &Rc<RefCell<MathBox>>) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        let mut i: i64 = 0;
        let n: i64 = b.borrow().items.len() as i64;
        while i < n {
            let mut it: Rc<RefCell<MathItem>> = b.borrow().items[i as usize].clone();
            let mut seen: bool = false;
            let mut k: i64 = 0;
            while k < (out.len() as i64) {
                if out[k as usize].clone() == it.borrow().color {
                    seen = true;
                }
                k += 1;
            }
            if !seen {
                out.push(it.borrow().color.clone());
            }
            i += 1;
        }
        out
    }
    /// The outline of every item in colour `c`, in px, with the box's top-left
    /// corner at (ox, oy).
    pub fn pathOf(b: &Rc<RefCell<MathBox>>, px: f64, c: &str, ox: f64, oy: f64) -> String {
        let mut buf: Rc<RefCell<MathPathBuf>> = Rc::new(RefCell::new(MathPathBuf::new()));
        let base: f64 = oy + b.borrow().h * px;
        let mut i: i64 = 0;
        let n: i64 = b.borrow().items.len() as i64;
        while i < n {
            let mut it: Rc<RefCell<MathItem>> = b.borrow().items[i as usize].clone();
            if it.borrow().color == c {
                if it.borrow().kind == 1 {
                    MathPathBuf::rect(
                        &buf,
                        ox + it.borrow().x * px,
                        base + it.borrow().y * px,
                        it.borrow().w * px,
                        it.borrow().h * px
                    );
                } else {
                    let mut _tmp_1237 = it.borrow().font.clone();
                    let mut g: Rc<RefCell<MathGlyph>> = MathFont::glyph(_tmp_1237, it.borrow().cp.clone());
                    if !g.borrow().path.is_empty() {
                        let mut _tmp_1239 = it.borrow().sx.clone();
                        let mut _tmp_1240 = it.borrow().sy.clone();
                        MathFont::append_path(
                            &buf,
                            &g,
                            ox + it.borrow().x * px,
                            base + it.borrow().y * px,
                            px * it.borrow().scale,
                            _tmp_1239,
                            _tmp_1240
                        );
                    }
                }
            }
            i += 1;
        }
        return MathPathBuf::text(&buf);
    }
    // pub for the crates whose .rgr code calls it (MdMath); not API:
    // its EVGElement is EVG's type, which Ranger's API check keeps internal
    #[doc(hidden)]
    pub fn box_element(b: &Rc<RefCell<MathBox>>, px: f64, colour: &str) -> Rc<RefCell<EVGElement>> {
        let w: f64 = b.borrow().w * px;
        let h: f64 = (b.borrow().h + b.borrow().d) * px;
        let mut root: Rc<RefCell<EVGElement>> = EVGElement::create_div();
        root.borrow_mut().position = "relative".to_string();
        root.borrow_mut().width = Some(EVGUnit::px(w));
        root.borrow_mut().height = Some(EVGUnit::px(h));
        let p: f64 = MathRender::pad() * px;
        let mut cols: Vec<String> = MathRender::colours(b);
        let mut i: i64 = 0;
        while i < (cols.len() as i64) {
            let c: String = cols[i as usize].clone();
            let d: String = MathRender::pathOf(b, px, &c, p, p);
            if !d.is_empty() {
                let mut path: Rc<RefCell<EVGElement>> = EVGElement::create_path();
                path.borrow_mut().position = "absolute".to_string();
                path.borrow_mut().left = Some(EVGUnit::px(0.0 - p));
                path.borrow_mut().top = Some(EVGUnit::px(0.0 - p));
                path.borrow_mut().width = Some(EVGUnit::px(w + 2.0 * p));
                path.borrow_mut().height = Some(EVGUnit::px(h + 2.0 * p));
                path.borrow_mut().svg_path = d.clone();
                path.borrow_mut().view_box = format!("0 0 {} {}", MathFont::num(w + 2.0 * p), MathFont::num(h + 2.0 * p));
                let mut r#use: String = c.clone();
                if MathText::str_len(&r#use) == 0 {
                    r#use = colour.to_string();
                }
                path.borrow_mut().fill_color = Some(EVGColor::parse(&r#use));
                path.borrow_mut().fill_rule = "nonzero".to_string();
                EVGElement::add_child(&root, path.clone());
            }
            i += 1;
        }
        root
    }
    /// For HTML: sized in ems of the text around it, standing on its baseline,
    /// filled with the text's own colour.
    pub fn svgEm(tex: &str, display: bool) -> String {
        let mut b: Rc<RefCell<MathBox>> = MathLayout::layout(tex, display);
        let px: f64 = 100.0;
        let p: f64 = MathRender::pad() * px;
        let w: f64 = b.borrow().w * px + 2.0 * p;
        let h: f64 = (b.borrow().h + b.borrow().d) * px + 2.0 * p;
        let k: f64 = 1.21;
        let mut out: String = format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}em\" height=\"{}em\" viewBox=\"0 0 {} {}\" style=\"vertical-align:-{}em;margin:0 -{}em\">", MathFont::num((w / px) * k), MathFont::num((h / px) * k), MathFont::num(w), MathFont::num(h), MathFont::num(((b.borrow().d * px + p) / px) * k), MathFont::num((p / px) * k));
        let mut cols: Vec<String> = MathRender::colours(&b);
        let mut i: i64 = 0;
        while i < (cols.len() as i64) {
            let c: String = cols[i as usize].clone();
            let mut r#use: String = c.clone();
            if MathText::str_len(&r#use) == 0 {
                r#use = "currentColor".to_string();
            }
            out = format!("{}<path fill=\"{}\" d=\"{}\"/>", out, r#use, MathRender::pathOf(
                &b,
                px,
                &c,
                p,
                p
            ));
            i += 1;
        }
        format!("{}</svg>", out)
    }
    pub fn svg(tex: &str, display: bool, px: f64, colour: &str) -> String {
        let mut b: Rc<RefCell<MathBox>> = MathLayout::layout(tex, display);
        MathRender::boxSvg(&b, px, colour)
    }
    pub fn boxSvg(b: &Rc<RefCell<MathBox>>, px: f64, colour: &str) -> String {
        let p: f64 = MathRender::pad() * px;
        let w: f64 = b.borrow().w * px + 2.0 * p;
        let h: f64 = (b.borrow().h + b.borrow().d) * px + 2.0 * p;
        let mut out: String = format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" viewBox=\"0 0 {} {}\">", MathFont::num(w), MathFont::num(h), MathFont::num(w), MathFont::num(h));
        let mut cols: Vec<String> = MathRender::colours(b);
        let mut i: i64 = 0;
        while i < (cols.len() as i64) {
            let c: String = cols[i as usize].clone();
            let mut r#use: String = c.clone();
            if MathText::str_len(&r#use) == 0 {
                r#use = colour.to_string();
            }
            out = format!("{}<path fill=\"{}\" d=\"{}\"/>", out, r#use, MathRender::pathOf(
                b,
                px,
                &c,
                p,
                p
            ));
            i += 1;
        }
        format!("{}</svg>", out)
    }
}
