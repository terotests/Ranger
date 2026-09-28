//! The CSS properties EVGr reads, from a declaration block
//! (`display:flex;width:100px`) into the fields of a node.

use ranger::prelude::*;

use crate::EvgrNode;

/// A length: `auto`, pixels, a percentage of the containing block, or a
/// `calc()` of the two (`v` percent plus `px` pixels).
#[derive(Clone, Copy)]
pub struct Len {
    /// 0 auto, 1 px, 2 percent, 3 calc
    pub kind: int,
    pub v: double,
    pub px: double,
}

impl Len {
    pub fn auto() -> Len {
        Len { kind: 0, v: 0.0, px: 0.0 }
    }

    pub fn px(v: double) -> Len {
        Len { kind: 1, v, px: 0.0 }
    }

    /// Pixels against `base`; -1.0 when auto, or a percentage of an
    /// indefinite base.
    pub fn resolve(&self, base: double) -> double {
        if self.kind == 1 {
            return self.v;
        }
        if self.kind == 2 && base >= 0.0 {
            return base * self.v / 100.0;
        }
        if self.kind == 3 {
            if self.v == 0.0 {
                return self.px;
            }
            if base >= 0.0 {
                return base * self.v / 100.0 + self.px;
            }
        }
        -1.0
    }

    pub fn is_auto(&self) -> bool {
        self.kind == 0
    }
}

// the alignment keywords, as numbers
pub const START: int = 0;
pub const END: int = 1;
pub const CENTER: int = 2;
pub const STRETCH: int = 3;
pub const BETWEEN: int = 4;
pub const AROUND: int = 5;
pub const EVENLY: int = 6;
pub const BASELINE: int = 7;
/// `align-self: auto` / an `align-items` left at EVG's default
pub const UNSET: int = -1;

pub fn parse_len(v: &str) -> Len {
    let t = v.trim();
    if t == "auto" || t.is_empty() {
        return Len::auto();
    }
    if t.starts_with("calc(") && t.ends_with(")") {
        return parse_calc(&t[5..t.as_bytes().len() - 1]);
    }
    if let Some(n) = t.strip_suffix("px") {
        return Len::px(number(n));
    }
    if let Some(p) = t.strip_suffix("%") {
        return Len { kind: 2, v: number(p), px: 0.0 };
    }
    Len::px(number(t))
}

/// `calc(100% - 40px)`: a sum of percentages and pixels, the operators
/// between terms standing apart as CSS requires.
fn parse_calc(body: &str) -> Len {
    let mut pct = 0.0;
    let mut px = 0.0;
    let mut sign = 1.0;
    for tok in body.split_whitespace() {
        if tok == "+" {
            sign = 1.0;
            continue;
        }
        if tok == "-" {
            sign = -1.0;
            continue;
        }
        let l = parse_len(tok);
        if l.kind == 2 {
            pct += sign * l.v;
        } else {
            px += sign * l.resolve(0.0);
        }
        sign = 1.0;
    }
    Len { kind: 3, v: pct, px }
}

pub fn number(v: &str) -> double {
    v.trim().parse::<double>().unwrap_or(0.0)
}

pub fn align_of(v: &str) -> int {
    let t = v.trim();
    if t == "flex-start" || t == "start" || t == "normal" || t == "left" || t == "self-start" {
        return START;
    }
    if t == "flex-end" || t == "end" || t == "right" || t == "self-end" {
        return END;
    }
    if t == "center" {
        return CENTER;
    }
    if t == "stretch" {
        return STRETCH;
    }
    if t == "space-between" {
        return BETWEEN;
    }
    if t == "space-around" {
        return AROUND;
    }
    if t == "space-evenly" {
        return EVENLY;
    }
    if t == "baseline" {
        return BASELINE;
    }
    START
}

/// The values of a shorthand (`padding: 4px 8px`), as CSS spreads them over
/// top, right, bottom, left.
fn four_len(v: &str) -> Vec<Len> {
    let parts: Vec<&str> = v.split_whitespace().collect();
    let mut n: Vec<Len> = Vec::new();
    for p in &parts {
        n.push(parse_len(p));
    }
    let mut out: Vec<Len> = Vec::new();
    if n.len() == 1 {
        out.push(n[0]);
        out.push(n[0]);
        out.push(n[0]);
        out.push(n[0]);
    } else if n.len() == 2 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[0]);
        out.push(n[1]);
    } else if n.len() == 3 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[2]);
        out.push(n[1]);
    } else if n.len() >= 4 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[2]);
        out.push(n[3]);
    } else {
        out.push(Len::px(0.0));
        out.push(Len::px(0.0));
        out.push(Len::px(0.0));
        out.push(Len::px(0.0));
    }
    out
}

fn four(v: &str) -> Vec<double> {
    let parts: Vec<&str> = v.split_whitespace().collect();
    let mut n: Vec<double> = Vec::new();
    for p in &parts {
        n.push(parse_len(p).resolve(0.0).max(0.0));
    }
    let mut out: Vec<double> = Vec::new();
    if n.len() == 1 {
        out.push(n[0]);
        out.push(n[0]);
        out.push(n[0]);
        out.push(n[0]);
    } else if n.len() == 2 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[0]);
        out.push(n[1]);
    } else if n.len() == 3 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[2]);
        out.push(n[1]);
    } else if n.len() >= 4 {
        out.push(n[0]);
        out.push(n[1]);
        out.push(n[2]);
        out.push(n[3]);
    } else {
        out.push(0.0);
        out.push(0.0);
        out.push(0.0);
        out.push(0.0);
    }
    out
}

/// Applies one declaration; answers false for a property EVGr does not lay
/// out (the caller counts those).
pub fn apply(n: &mut EvgrNode, name: &str, value: &str) -> bool {
    let v = value.trim();
    if name == "display" {
        if v == "flex" || v == "inline-flex" {
            n.display = 1;
        } else if v == "none" {
            n.display = 2;
        } else if v == "grid" || v == "inline-grid" {
            n.display = 3;
        } else {
            n.display = 0;
        }
        return true;
    }
    if name == "flex-direction" {
        n.row = v == "row" || v == "row-reverse";
        n.reverse = v == "row-reverse" || v == "column-reverse";
        return true;
    }
    if name == "flex-wrap" {
        n.wrap = v == "wrap" || v == "wrap-reverse";
        return true;
    }
    if name == "width" {
        n.width = parse_len(v);
        return true;
    }
    if name == "height" {
        n.height = parse_len(v);
        return true;
    }
    if name == "min-width" {
        n.min_w = parse_len(v);
        return true;
    }
    if name == "max-width" {
        n.max_w = parse_len(v);
        return true;
    }
    if name == "min-height" {
        n.min_h = parse_len(v);
        return true;
    }
    if name == "max-height" {
        n.max_h = parse_len(v);
        return true;
    }
    // padding: a percentage is of the containing block's width, so the
    // lengths are kept and resolved when the box is laid out
    if name == "padding" {
        let p = four_len(v);
        n.pad_t_len = p[0];
        n.pad_r_len = p[1];
        n.pad_b_len = p[2];
        n.pad_l_len = p[3];
        n.resolve_pads(0.0);
        return true;
    }
    if name == "padding-top" {
        n.pad_t_len = parse_len(v);
        n.resolve_pads(0.0);
        return true;
    }
    if name == "padding-right" {
        n.pad_r_len = parse_len(v);
        n.resolve_pads(0.0);
        return true;
    }
    if name == "padding-bottom" {
        n.pad_b_len = parse_len(v);
        n.resolve_pads(0.0);
        return true;
    }
    if name == "padding-left" {
        n.pad_l_len = parse_len(v);
        n.resolve_pads(0.0);
        return true;
    }
    if name == "aspect-ratio" {
        let parts: Vec<&str> = v.split('/').collect();
        let a = number(parts[0]);
        let mut b = 1.0;
        if parts.len() >= 2 {
            b = number(parts[1]);
        }
        if a > 0.0 && b > 0.0 {
            n.ratio = a / b;
        }
        return true;
    }
    if name == "margin" {
        let m = four(v);
        n.mar_t = m[0];
        n.mar_r = m[1];
        n.mar_b = m[2];
        n.mar_l = m[3];
        return true;
    }
    if name == "margin-top" {
        n.mar_t = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "margin-right" {
        n.mar_r = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "margin-bottom" {
        n.mar_b = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "margin-left" {
        n.mar_l = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "gap" {
        let parts: Vec<&str> = v.split_whitespace().collect();
        if parts.len() >= 2 {
            n.row_gap = parse_len(parts[0]).resolve(0.0).max(0.0);
            n.col_gap = parse_len(parts[1]).resolve(0.0).max(0.0);
        } else {
            n.row_gap = parse_len(v).resolve(0.0).max(0.0);
            n.col_gap = n.row_gap;
        }
        return true;
    }
    if name == "row-gap" {
        n.row_gap = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "column-gap" {
        n.col_gap = parse_len(v).resolve(0.0).max(0.0);
        return true;
    }
    if name == "flex-grow" {
        n.grow = number(v);
        return true;
    }
    if name == "flex-shrink" {
        n.shrink = number(v);
        return true;
    }
    if name == "flex-basis" {
        n.basis = parse_len(v);
        return true;
    }
    if name == "flex" {
        // `flex: 1` is `1 1 0`, `auto` is `1 1 auto`, `none` is `0 0 auto`
        if v == "none" {
            n.grow = 0.0;
            n.shrink = 0.0;
            n.basis = Len::auto();
            return true;
        }
        if v == "auto" {
            n.grow = 1.0;
            n.shrink = 1.0;
            n.basis = Len::auto();
            return true;
        }
        let parts: Vec<&str> = v.split_whitespace().collect();
        n.grow = number(parts[0]);
        n.shrink = 1.0;
        n.basis = Len::px(0.0);
        if parts.len() >= 2 {
            n.shrink = number(parts[1]);
        }
        if parts.len() >= 3 {
            n.basis = parse_len(parts[2]);
        }
        return true;
    }
    if name == "justify-content" {
        n.justify = align_of(v);
        return true;
    }
    if name == "align-items" {
        n.align_items = align_of(v);
        return true;
    }
    if name == "align-self" {
        if v == "auto" {
            n.align_self = UNSET;
        } else {
            n.align_self = align_of(v);
        }
        return true;
    }
    if name == "align-content" {
        n.align_content = align_of(v);
        return true;
    }
    if name == "position" {
        n.absolute = v == "absolute" || v == "fixed";
        return true;
    }
    if name == "top" {
        n.top = parse_len(v);
        return true;
    }
    if name == "right" {
        n.right = parse_len(v);
        return true;
    }
    if name == "bottom" {
        n.bottom = parse_len(v);
        return true;
    }
    if name == "left" {
        n.left = parse_len(v);
        return true;
    }
    if name == "font-size" {
        n.font_size = parse_len(v).resolve(0.0);
        return true;
    }
    if name == "grid-template-columns" {
        n.grid_cols = v.to_string();
        return true;
    }
    if name == "grid-template-rows" {
        n.grid_rows = v.to_string();
        return true;
    }
    if name == "grid-template-areas" {
        n.grid_areas = v.to_string();
        return true;
    }
    if name == "grid-auto-rows" {
        n.grid_auto_rows = v.to_string();
        return true;
    }
    if name == "grid-auto-flow" {
        n.grid_dense = v.contains("dense");
        return true;
    }
    if name == "grid-column" {
        n.grid_column = v.to_string();
        return true;
    }
    if name == "grid-row" {
        n.grid_row = v.to_string();
        return true;
    }
    if name == "grid-area" {
        n.grid_area = v.to_string();
        return true;
    }
    // no effect on boxes
    if name == "background-color" || name == "background" || name == "color" || name == "overflow" || name == "box-sizing" || name == "font-family" {
        return true;
    }
    false
}
