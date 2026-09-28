//! EVGr: the layout of EVG documents as a strict Rust module
//! (docs/plans/PLAN_RUST_SYNTAX.md), beside the Ranger engine in `lib/evg`.
//!
//! An experiment: the same kind of document -- boxes styled with CSS
//! declarations, laid out as flexbox with EVG's box model and initial values
//! -- written once in Rust, built by cargo for native code and by `rgrc` for
//! every Ranger target. `bench/compare.mjs` lays out the cases of
//! `lib/evg/bench/layout-cases.mjs` with EVG, EVGr and Chromium;
//! `bench/speed.mjs` and `src/bin/bench.rs` time the fixtures of
//! `lib/evg/bench/layout-bench.mjs`.
//!
//! What is laid out: `display` block / flex / none, `flex-direction` (with
//! the reverse forms), `flex-wrap`, width / height and their min / max (px,
//! %), padding, margin (px), gap, `flex-grow` / `flex-shrink` /
//! `flex-basis` / `flex`, `justify-content`, `align-items`, `align-self`,
//! `align-content`, `position: absolute` with top / right / bottom / left,
//! `aspect-ratio`, `calc()` of px and %, grid (src/grid.rs), and text
//! measured with EVG's default advance table.
//!
//! The tree is an arena: a node is an index, its children a list of
//! indices. Layout writes `x`, `y` (page coordinates), `w` and `h`
//! (border box: padding is inside, as in EVG).

use ranger::prelude::*;

mod grid;
mod style;
mod text;

use style::Len;

const INF: double = 1000000000000000000.0;

pub struct EvgrNode {
    /// 0 block, 1 flex, 2 none, 3 grid
    pub display: int,
    pub row: bool,
    pub reverse: bool,
    pub wrap: bool,
    pub width: Len,
    pub height: Len,
    pub min_w: Len,
    pub max_w: Len,
    pub min_h: Len,
    pub max_h: Len,
    pub basis: Len,
    pub grow: double,
    pub shrink: double,
    pub pad_t_len: Len,
    pub pad_r_len: Len,
    pub pad_b_len: Len,
    pub pad_l_len: Len,
    /// the padding in pixels, resolved against the containing block
    pub pad_t: double,
    pub pad_r: double,
    pub pad_b: double,
    pub pad_l: double,
    /// `aspect-ratio` as width / height, 0.0 when none
    pub ratio: double,
    // grid: the container's templates, the item's placement
    pub grid_cols: String,
    pub grid_rows: String,
    pub grid_areas: String,
    pub grid_auto_rows: String,
    pub grid_dense: bool,
    pub grid_column: String,
    pub grid_row: String,
    pub grid_area: String,
    pub mar_t: double,
    pub mar_r: double,
    pub mar_b: double,
    pub mar_l: double,
    pub row_gap: double,
    pub col_gap: double,
    pub justify: int,
    pub align_items: int,
    pub align_self: int,
    pub align_content: int,
    pub absolute: bool,
    pub top: Len,
    pub right: Len,
    pub bottom: Len,
    pub left: Len,
    /// the declared font size, -1.0 when inherited
    pub font_size: double,
    pub text: String,
    pub children: Vec<int>,
    pub parent: int,
    // the result
    pub x: double,
    pub y: double,
    pub w: double,
    pub h: double,
    // this pass: the font size in effect, the width it was laid out at and
    // the height it was given (-1.0 auto), the max-content width
    fs: double,
    // the text measured at `text_fs`: its width and its widest word
    text_fs: double,
    text_w: double,
    text_min: double,
    laid: bool,
    lay_w: double,
    max_cw: double,
}

impl EvgrNode {
    pub fn new(parent: int) -> EvgrNode {
        EvgrNode {
            display: 0,
            row: false,
            reverse: false,
            // EVG's initial values: column, wrap, align-items flex-start
            wrap: true,
            width: Len::auto(),
            height: Len::auto(),
            min_w: Len::auto(),
            max_w: Len::auto(),
            min_h: Len::auto(),
            max_h: Len::auto(),
            basis: Len::auto(),
            grow: 0.0,
            shrink: 1.0,
            pad_t_len: Len::px(0.0),
            pad_r_len: Len::px(0.0),
            pad_b_len: Len::px(0.0),
            pad_l_len: Len::px(0.0),
            pad_t: 0.0,
            pad_r: 0.0,
            pad_b: 0.0,
            pad_l: 0.0,
            ratio: 0.0,
            grid_cols: String::new(),
            grid_rows: String::new(),
            grid_areas: String::new(),
            grid_auto_rows: String::new(),
            grid_dense: false,
            grid_column: String::new(),
            grid_row: String::new(),
            grid_area: String::new(),
            mar_t: 0.0,
            mar_r: 0.0,
            mar_b: 0.0,
            mar_l: 0.0,
            row_gap: 0.0,
            col_gap: 0.0,
            justify: style::START,
            align_items: style::UNSET,
            align_self: style::UNSET,
            align_content: style::START,
            absolute: false,
            top: Len::auto(),
            right: Len::auto(),
            bottom: Len::auto(),
            left: Len::auto(),
            font_size: -1.0,
            text: String::new(),
            children: Vec::new(),
            parent,
            x: 0.0,
            y: 0.0,
            w: 0.0,
            h: 0.0,
            fs: 14.0,
            text_fs: -1.0,
            text_w: 0.0,
            text_min: 0.0,
            laid: false,
            lay_w: -1.0,
            max_cw: -1.0,
        }
    }

    /// Padding in pixels; a percentage is of `cb_w`, the width of the
    /// containing block, on all four sides.
    pub fn resolve_pads(&mut self, cb_w: double) {
        self.pad_t = self.pad_t_len.resolve(cb_w).max(0.0);
        self.pad_r = self.pad_r_len.resolve(cb_w).max(0.0);
        self.pad_b = self.pad_b_len.resolve(cb_w).max(0.0);
        self.pad_l = self.pad_l_len.resolve(cb_w).max(0.0);
    }
}

pub struct EvgrTree {
    pub nodes: Vec<EvgrNode>,
    table: Vec<double>,
    /// `property:value` declarations that were not laid out
    pub unsupported: Vec<String>,
}

impl EvgrTree {
    pub fn new() -> EvgrTree {
        EvgrTree { nodes: Vec::new(), table: text::advance_table(), unsupported: Vec::new() }
    }

    /// A box styled by `css`, under `parent` (-1 for the root). Answers its
    /// index.
    pub fn add(&mut self, parent: int, css: &str) -> int {
        let i = self.nodes.len() as int;
        self.nodes.push(EvgrNode::new(parent));
        if parent >= 0 {
            self.nodes[parent as usize].children.push(i);
        }
        self.apply_css(i, css);
        i
    }

    /// A text leaf.
    pub fn add_text(&mut self, parent: int, css: &str, text: &str) -> int {
        let i = self.add(parent, css);
        self.nodes[i as usize].text = text.to_string();
        i
    }

    pub fn count(&self) -> int {
        self.nodes.len() as int
    }

    pub fn x(&self, i: int) -> double {
        self.nodes[i as usize].x
    }

    pub fn y(&self, i: int) -> double {
        self.nodes[i as usize].y
    }

    pub fn w(&self, i: int) -> double {
        self.nodes[i as usize].w
    }

    pub fn h(&self, i: int) -> double {
        self.nodes[i as usize].h
    }

    pub fn unsupported_count(&self) -> int {
        self.unsupported.len() as int
    }

    pub fn unsupported_at(&self, k: int) -> String {
        self.unsupported[k as usize].clone()
    }

    fn apply_css(&mut self, i: int, css: &str) {
        for part in css.split(';') {
            let decl = part.trim();
            if decl.is_empty() {
                continue;
            }
            if let Some(colon) = decl.find(':') {
                let name = decl[..colon].trim().to_string();
                let value = decl[colon + 1..].trim().to_string();
                let known = style::apply(&mut self.nodes[i as usize], &name, &value);
                if !known {
                    self.unsupported.push(format!("{}:{}", name, value));
                }
            }
        }
    }

    // ------------------------------------------------------------ layout

    /// Lays the tree out from its root (node 0) in a viewport of `width` x
    /// `height`.
    pub fn layout(&mut self, width: double, height: double) {
        if self.nodes.is_empty() {
            return;
        }
        let mut k = 0;
        while k < self.nodes.len() {
            self.nodes[k].laid = false;
            self.nodes[k].max_cw = -1.0;
            k += 1;
        }
        self.inherit_fonts(0, 14.0);
        self.nodes[0].resolve_pads(width);
        let mut w = self.nodes[0].width.resolve(width);
        if w < 0.0 {
            w = width;
        }
        w = self.clamp_w(0, w, width);
        // EVG: a root without a height is as tall as the viewport
        let mut h = self.nodes[0].height.resolve(height);
        if h < 0.0 {
            h = height;
        }
        self.place(0, 0.0, 0.0, w, h);
    }

    fn inherit_fonts(&mut self, i: int, from: double) {
        let own = self.nodes[i as usize].font_size;
        let fs = if own > 0.0 { own } else { from };
        self.nodes[i as usize].fs = fs;
        let kids = self.nodes[i as usize].children.clone();
        for k in &kids {
            self.inherit_fonts(*k, fs);
        }
    }

    /// Measures a text leaf once per font size.
    fn measure_text(&mut self, i: int) {
        let iu = i as usize;
        let fs = self.nodes[iu].fs;
        if self.nodes[iu].text_fs == fs {
            return;
        }
        let t = self.nodes[iu].text.clone();
        self.nodes[iu].text_w = text::measure(&self.table, &t, fs);
        self.nodes[iu].text_min = text::min_width(&self.table, &t, fs);
        self.nodes[iu].text_fs = fs;
    }

    fn is_text(&self, i: int) -> bool {
        let n = &self.nodes[i as usize];
        !n.text.is_empty() && n.children.is_empty()
    }

    fn pad_x(&self, i: int) -> double {
        self.nodes[i as usize].pad_l + self.nodes[i as usize].pad_r
    }

    fn pad_y(&self, i: int) -> double {
        self.nodes[i as usize].pad_t + self.nodes[i as usize].pad_b
    }

    fn clamp_w(&self, i: int, w: double, base: double) -> double {
        let mut r = w;
        let mx = self.nodes[i as usize].max_w.resolve(base);
        if mx >= 0.0 && r > mx {
            r = mx;
        }
        // min last: it wins over max
        let mn = self.nodes[i as usize].min_w.resolve(base);
        if mn >= 0.0 && r < mn {
            r = mn;
        }
        r
    }

    fn clamp_h(&self, i: int, h: double, base: double) -> double {
        let mut r = h;
        let mx = self.nodes[i as usize].max_h.resolve(base);
        if mx >= 0.0 && r > mx {
            r = mx;
        }
        let mn = self.nodes[i as usize].min_h.resolve(base);
        if mn >= 0.0 && r < mn {
            r = mn;
        }
        r
    }

    fn is_row(&self, i: int) -> bool {
        self.nodes[i as usize].display == 1 && self.nodes[i as usize].row
    }

    fn in_flow(&self, k: int) -> bool {
        self.nodes[k as usize].display != 2 && !self.nodes[k as usize].absolute
    }

    /// The width the box takes when nothing limits it (border box).
    fn max_content_w(&mut self, i: int) -> double {
        let cached = self.nodes[i as usize].max_cw;
        if cached >= 0.0 {
            return cached;
        }
        let r = self.content_w(i, false, false);
        self.nodes[i as usize].max_cw = r;
        r
    }

    /// The narrowest the box can be without overflowing (border box).
    fn min_content_w(&mut self, i: int) -> double {
        self.content_w(i, true, false)
    }

    /// The content-based minimum of a flex item: its min-content width,
    /// whatever width it declares (CSS's automatic minimum size).
    fn min_content_own(&mut self, i: int) -> double {
        self.content_w(i, true, true)
    }

    fn content_w(&mut self, i: int, want_min: bool, ignore_width: bool) -> double {
        if self.nodes[i as usize].display == 2 {
            return 0.0;
        }
        let fixed = self.nodes[i as usize].width.resolve(-1.0);
        if fixed >= 0.0 && !ignore_width {
            return fixed;
        }
        let pads = self.pad_x(i);
        if self.is_text(i) {
            self.measure_text(i);
            let tw = if want_min { self.nodes[i as usize].text_min } else { self.nodes[i as usize].text_w };
            return self.clamp_w(i, tw + pads, -1.0);
        }
        let row = self.is_row(i);
        let kids = self.nodes[i as usize].children.clone();
        let mut total = 0.0;
        let mut count = 0;
        for k in &kids {
            if !self.in_flow(*k) {
                continue;
            }
            let kw = if want_min { self.min_content_w(*k) } else { self.max_content_w(*k) };
            let outer = kw + self.nodes[*k as usize].mar_l + self.nodes[*k as usize].mar_r;
            if row && !want_min {
                total += outer;
            } else if row && want_min && !self.nodes[i as usize].wrap {
                total += outer;
            } else if outer > total {
                total = outer;
            }
            count += 1;
        }
        if row && count > 1 && (!want_min || !self.nodes[i as usize].wrap) {
            total += self.nodes[i as usize].col_gap * ((count - 1) as double);
        }
        self.clamp_w(i, total + pads, -1.0)
    }

    /// The height of `i` laid out at width `w`.
    fn height_for(&mut self, i: int, w: double) -> double {
        let fixed = self.nodes[i as usize].height.resolve(-1.0);
        if fixed >= 0.0 {
            return self.clamp_h(i, fixed, -1.0);
        }
        let ratio = self.nodes[i as usize].ratio;
        if ratio > 0.0 {
            return self.clamp_h(i, w / ratio, -1.0);
        }
        self.place(i, 0.0, 0.0, w, -1.0);
        self.nodes[i as usize].h
    }

    fn translate(&mut self, i: int, dx: double, dy: double) {
        self.nodes[i as usize].x += dx;
        self.nodes[i as usize].y += dy;
        let kids = self.nodes[i as usize].children.clone();
        for k in &kids {
            self.translate(*k, dx, dy);
        }
    }

    /// Puts the box at (x, y) with width `w` and height `h` (-1.0: from
    /// its content), and lays out what is inside.
    fn place(&mut self, i: int, x: double, y: double, w: double, h: double) {
        let iu = i as usize;
        // laid out at this width already this pass: the same boxes, moved
        if self.nodes[iu].laid && self.nodes[iu].lay_w == w && (h < 0.0 || (h - self.nodes[iu].h).abs() < 0.0000001) {
            let dx = x - self.nodes[iu].x;
            let dy = y - self.nodes[iu].y;
            if dx != 0.0 || dy != 0.0 {
                self.translate(i, dx, dy);
            }
            return;
        }
        self.nodes[iu].x = x;
        self.nodes[iu].y = y;
        self.nodes[iu].w = w;
        self.nodes[iu].laid = true;
        self.nodes[iu].lay_w = w;
        if self.nodes[iu].display == 2 {
            self.nodes[iu].w = 0.0;
            self.nodes[iu].h = 0.0;
            return;
        }
        let iw = (w - self.pad_x(i)).max(0.0);
        let mut hh = h;
        if hh < 0.0 && self.nodes[iu].ratio > 0.0 {
            hh = w / self.nodes[iu].ratio;
        }
        if self.is_text(i) {
            let fs = self.nodes[iu].fs;
            self.measure_text(i);
            // one line when it fits, else wrapped at spaces
            let mut lines = 1;
            if self.nodes[iu].text_w > iw + 0.001 {
                let t = self.nodes[iu].text.clone();
                let (wrapped, _widest) = text::wrap(&self.table, &t, fs, iw);
                lines = wrapped;
            }
            if hh < 0.0 {
                hh = (lines as double) * text::line_height(fs) + self.pad_y(i);
            }
        } else {
            let ih = if hh >= 0.0 { (hh - self.pad_y(i)).max(0.0) } else { -1.0 };
            let content = if self.nodes[iu].display == 3 { self.layout_grid(i, iw, ih) } else { self.layout_box(i, iw, ih) };
            if hh < 0.0 {
                hh = content + self.pad_y(i);
            }
        }
        hh = self.clamp_h(i, hh, -1.0);
        self.nodes[iu].h = hh;
        self.place_absolutes(i);
    }

    fn place_absolutes(&mut self, i: int) {
        let kids = self.nodes[i as usize].children.clone();
        let x0 = self.nodes[i as usize].x + self.nodes[i as usize].pad_l;
        let y0 = self.nodes[i as usize].y + self.nodes[i as usize].pad_t;
        let cw = (self.nodes[i as usize].w - self.pad_x(i)).max(0.0);
        let ch = (self.nodes[i as usize].h - self.pad_y(i)).max(0.0);
        for k in &kids {
            let ku = *k as usize;
            if !self.nodes[ku].absolute || self.nodes[ku].display == 2 {
                continue;
            }
            let l = self.nodes[ku].left.resolve(cw);
            let r = self.nodes[ku].right.resolve(cw);
            let t = self.nodes[ku].top.resolve(ch);
            let b = self.nodes[ku].bottom.resolve(ch);
            let mut w = self.nodes[ku].width.resolve(cw);
            if w < 0.0 && l >= 0.0 && r >= 0.0 {
                w = cw - l - r - self.nodes[ku].mar_l - self.nodes[ku].mar_r;
            }
            if w < 0.0 {
                w = self.max_content_w(*k);
            }
            w = self.clamp_w(*k, w, cw);
            let mut h = self.nodes[ku].height.resolve(ch);
            if h < 0.0 && t >= 0.0 && b >= 0.0 {
                h = ch - t - b - self.nodes[ku].mar_t - self.nodes[ku].mar_b;
            }
            if h < 0.0 {
                h = self.height_for(*k, w);
            }
            h = self.clamp_h(*k, h, ch);
            let mut x = x0;
            if l >= 0.0 {
                x = x0 + l;
            } else if r >= 0.0 {
                x = x0 + cw - r - w - self.nodes[ku].mar_r - self.nodes[ku].mar_l;
            }
            let mut y = y0;
            if t >= 0.0 {
                y = y0 + t;
            } else if b >= 0.0 {
                y = y0 + ch - b - h - self.nodes[ku].mar_b - self.nodes[ku].mar_t;
            }
            self.place(*k, x + self.nodes[ku].mar_l, y + self.nodes[ku].mar_t, w, h);
        }
    }

    /// The alignment of item `k` in container `c` on the cross axis.
    fn align_of(&self, c: int, k: int) -> int {
        let own = self.nodes[k as usize].align_self;
        if own != style::UNSET {
            return own;
        }
        let items = self.nodes[c as usize].align_items;
        if items != style::UNSET {
            // EVG: a text leaf without a width fits its text even where the
            // column stretches its boxes
            if items == style::STRETCH && !self.is_row(c) && self.is_text(k) {
                return style::START;
            }
            return items;
        }
        // EVG: a box in a column fills the width, a text leaf fits its text;
        // in a row nothing stretches
        if !self.is_row(c) && !self.is_text(k) {
            return style::STRETCH;
        }
        style::START
    }

    /// Lays out the children of `c` inside its content box (`iw` wide, `ih`
    /// high or -1.0 when that is to come from the content). Answers the
    /// content height.
    fn layout_box(&mut self, c: int, iw: double, ih: double) -> double {
        let cu = c as usize;
        let row = self.is_row(c);
        let wrap = self.nodes[cu].display == 1 && self.nodes[cu].wrap;
        let main_size = if row { iw } else { ih };
        let cross_size = if row { ih } else { iw };
        let main_gap = if row { self.nodes[cu].col_gap } else { self.nodes[cu].row_gap };
        let cross_gap = if row { self.nodes[cu].row_gap } else { self.nodes[cu].col_gap };
        let kids = self.nodes[cu].children.clone();
        let mut items: Vec<int> = Vec::new();
        for k in &kids {
            self.nodes[*k as usize].resolve_pads(iw);
            if self.in_flow(*k) {
                items.push(*k);
            }
        }
        let n = items.len();
        if n == 0 {
            return 0.0;
        }
        // flex base sizes and their limits
        let mut base: Vec<double> = Vec::new();
        let mut hypo: Vec<double> = Vec::new();
        let mut min_m: Vec<double> = Vec::new();
        let mut max_m: Vec<double> = Vec::new();
        let mut main_mar: Vec<double> = Vec::new();
        let mut cross_mar: Vec<double> = Vec::new();
        let mut j = 0;
        while j < n {
            let k = items[j];
            let ku = k as usize;
            let mm = if row { self.nodes[ku].mar_l + self.nodes[ku].mar_r } else { self.nodes[ku].mar_t + self.nodes[ku].mar_b };
            let cm = if row { self.nodes[ku].mar_t + self.nodes[ku].mar_b } else { self.nodes[ku].mar_l + self.nodes[ku].mar_r };
            main_mar.push(mm);
            cross_mar.push(cm);
            let spec = if row { self.nodes[ku].width.resolve(main_size) } else { self.nodes[ku].height.resolve(main_size) };
            let mut b = self.nodes[ku].basis.resolve(main_size);
            if b < 0.0 {
                b = spec;
            }
            if b < 0.0 {
                if row {
                    b = self.max_content_w(k);
                } else {
                    let cw = self.item_cross_w(c, k, cross_size, cm);
                    b = self.height_for(k, cw);
                }
            }
            let mut lo = if row { self.nodes[ku].min_w.resolve(main_size) } else { self.nodes[ku].min_h.resolve(main_size) };
            if lo < 0.0 {
                // the automatic minimum: no narrower than the content
                if row {
                    lo = self.min_content_own(k);
                    if spec >= 0.0 && spec < lo {
                        lo = spec;
                    }
                } else if !self.nodes[ku].children.is_empty() || self.is_text(k) {
                    if spec < 0.0 {
                        let cw2 = self.item_cross_w(c, k, cross_size, cm);
                        lo = self.content_height(k, cw2);
                    } else {
                        lo = 0.0;
                    }
                } else {
                    lo = 0.0;
                }
            }
            let mut hi = if row { self.nodes[ku].max_w.resolve(main_size) } else { self.nodes[ku].max_h.resolve(main_size) };
            if hi < 0.0 {
                hi = INF;
            }
            base.push(b);
            // min wins over max when they conflict
            hypo.push(b.min(hi).max(lo));
            min_m.push(lo);
            max_m.push(hi);
            j += 1;
        }
        // lines
        let mut line_start: Vec<int> = Vec::new();
        let mut line_end: Vec<int> = Vec::new();
        let mut cur_start = 0;
        let mut used = 0.0;
        j = 0;
        while j < n {
            let outer = hypo[j] + main_mar[j];
            if wrap && main_size >= 0.0 && j > cur_start && used + main_gap + outer > main_size + 0.0001 {
                line_start.push(cur_start as int);
                line_end.push(j as int);
                cur_start = j;
                used = outer;
            } else if j == cur_start {
                used = outer;
            } else {
                used = used + main_gap + outer;
            }
            j += 1;
        }
        line_start.push(cur_start as int);
        line_end.push(n as int);
        // main sizes: grow or shrink each line into the container
        let mut main_final: Vec<double> = hypo.clone();
        let lines = line_start.len();
        let mut li = 0;
        while li < lines {
            let a = line_start[li] as usize;
            let e = line_end[li] as usize;
            // grow and shrink are for flex items; a block's children keep
            // their sizes
            if main_size >= 0.0 && self.nodes[cu].display == 1 {
                self.resolve_flex(&items, a, e, main_size, main_gap, &base, &hypo, &min_m, &max_m, &main_mar, &mut main_final);
            }
            li += 1;
        }
        // cross sizes, and each line's
        let mut cross: Vec<double> = Vec::new();
        let mut stretch: Vec<bool> = Vec::new();
        j = 0;
        while j < n {
            let k = items[j];
            let ku = k as usize;
            let al = self.align_of(c, k);
            let spec = if row { self.nodes[ku].height.resolve(cross_size) } else { self.nodes[ku].width.resolve(cross_size) };
            let st = spec < 0.0 && al == style::STRETCH;
            let cs = if spec >= 0.0 {
                if row { self.clamp_h(k, spec, cross_size) } else { self.clamp_w(k, spec, cross_size) }
            } else if row {
                self.height_for(k, main_final[j])
            } else {
                self.item_cross_w(c, k, cross_size, cross_mar[j])
            };
            cross.push(cs);
            stretch.push(st);
            j += 1;
        }
        // baseline alignment (rows): each item's first baseline, from its top
        let mut bl: Vec<double> = Vec::new();
        j = 0;
        while j < n {
            let k = items[j];
            if row && self.align_of(c, k) == style::BASELINE {
                bl.push(self.baseline_of(k, cross[j]));
            } else {
                bl.push(-1.0);
            }
            j += 1;
        }
        let mut line_cross: Vec<double> = Vec::new();
        let mut line_base: Vec<double> = Vec::new();
        li = 0;
        while li < lines {
            let a = line_start[li] as usize;
            let e = line_end[li] as usize;
            let mut m = 0.0;
            let mut above = 0.0;
            let mut below = 0.0;
            let mut q = a;
            while q < e {
                let o = cross[q] + cross_mar[q];
                if o > m {
                    m = o;
                }
                if bl[q] >= 0.0 {
                    let up = self.nodes[items[q] as usize].mar_t + bl[q];
                    if up > above {
                        above = up;
                    }
                    if o - up > below {
                        below = o - up;
                    }
                }
                q += 1;
            }
            if above + below > m {
                m = above + below;
            }
            line_cross.push(m);
            line_base.push(above);
            li += 1;
        }
        if !wrap && cross_size >= 0.0 {
            line_cross[0] = cross_size;
        }
        // align-content: the lines in the container's cross size
        let mut total_cross = 0.0;
        li = 0;
        while li < lines {
            total_cross += line_cross[li];
            li += 1;
        }
        total_cross += cross_gap * ((lines - 1) as double);
        let mut cross_pos = 0.0;
        let mut line_space = cross_gap;
        if wrap && cross_size >= 0.0 {
            let free = cross_size - total_cross;
            let ac = self.nodes[cu].align_content;
            if ac == style::STRETCH && free > 0.0 {
                let add = free / (lines as double);
                li = 0;
                while li < lines {
                    line_cross[li] += add;
                    li += 1;
                }
            } else if ac == style::END {
                cross_pos = free;
            } else if ac == style::CENTER {
                cross_pos = free / 2.0;
            } else if ac == style::BETWEEN && lines > 1 && free > 0.0 {
                line_space = cross_gap + free / ((lines - 1) as double);
            } else if ac == style::AROUND && free > 0.0 {
                cross_pos = free / (2.0 * (lines as double));
                line_space = cross_gap + free / (lines as double);
            } else if ac == style::EVENLY && free > 0.0 {
                cross_pos = free / ((lines + 1) as double);
                line_space = cross_gap + free / ((lines + 1) as double);
            }
        }
        // place each line
        let x0 = self.nodes[cu].x + self.nodes[cu].pad_l;
        let y0 = self.nodes[cu].y + self.nodes[cu].pad_t;
        let reverse = self.nodes[cu].reverse;
        let mut content_main = 0.0;
        li = 0;
        while li < lines {
            let a = line_start[li] as usize;
            let e = line_end[li] as usize;
            let count = e - a;
            let mut line_used = main_gap * ((count - 1) as double);
            let mut q = a;
            while q < e {
                line_used += main_final[q] + main_mar[q];
                q += 1;
            }
            if line_used > content_main {
                content_main = line_used;
            }
            let avail = if main_size >= 0.0 { main_size } else { line_used };
            let free = avail - line_used;
            let mut pos = 0.0;
            let mut space = main_gap;
            let jc = self.nodes[cu].justify;
            if free > 0.0 {
                if jc == style::END {
                    pos = free;
                } else if jc == style::CENTER {
                    pos = free / 2.0;
                } else if jc == style::BETWEEN && count > 1 {
                    space = main_gap + free / ((count - 1) as double);
                } else if jc == style::AROUND {
                    pos = free / (2.0 * (count as double));
                    space = main_gap + free / (count as double);
                } else if jc == style::EVENLY {
                    pos = free / ((count + 1) as double);
                    space = main_gap + free / ((count + 1) as double);
                }
            }
            let lc = line_cross[li];
            q = a;
            while q < e {
                let k = items[q];
                let ku = k as usize;
                let size_m = main_final[q];
                let mut size_c = cross[q];
                if stretch[q] {
                    size_c = lc - cross_mar[q];
                    size_c = if row { self.clamp_h(k, size_c, cross_size) } else { self.clamp_w(k, size_c, cross_size) };
                }
                let al = self.align_of(c, k);
                let outer_c = size_c + cross_mar[q];
                let mut off_c = 0.0;
                if al == style::END {
                    off_c = lc - outer_c;
                } else if al == style::CENTER {
                    off_c = (lc - outer_c) / 2.0;
                } else if bl[q] >= 0.0 {
                    off_c = line_base[li] - bl[q] - self.nodes[ku].mar_t;
                }
                let mut main_at = pos;
                if reverse {
                    main_at = avail - pos - size_m - main_mar[q];
                }
                if row {
                    let px = x0 + main_at + self.nodes[ku].mar_l;
                    let py = y0 + cross_pos + off_c + self.nodes[ku].mar_t;
                    self.place(k, px, py, size_m, size_c);
                } else {
                    let px2 = x0 + cross_pos + off_c + self.nodes[ku].mar_l;
                    let py2 = y0 + main_at + self.nodes[ku].mar_t;
                    self.place(k, px2, py2, size_c, size_m);
                }
                pos = pos + size_m + main_mar[q] + space;
                q += 1;
            }
            cross_pos = cross_pos + lc + line_space;
            li += 1;
        }
        if row {
            total_cross = 0.0;
            li = 0;
            while li < lines {
                total_cross += line_cross[li];
                li += 1;
            }
            total_cross += cross_gap * ((lines - 1) as double);
            return total_cross;
        }
        content_main
    }

    /// The first baseline of `k`, from the top of its border box, when it is
    /// `h` high: a text leaf's first line (the half-leading model, with the
    /// measurer's ascent and descent), a box's first child's, or else the
    /// bottom edge.
    fn baseline_of(&mut self, k: int, h: double) -> double {
        let ku = k as usize;
        if self.is_text(k) {
            let fs = self.nodes[ku].fs;
            let lh = text::line_height(fs);
            return self.nodes[ku].pad_t + (lh - (0.905 + 0.212) * fs) / 2.0 + 0.905 * fs;
        }
        let kids = self.nodes[ku].children.clone();
        for c in &kids {
            if self.in_flow(*c) {
                let ch = self.nodes[*c as usize].h;
                return self.nodes[ku].pad_t + self.nodes[*c as usize].mar_t + self.baseline_of(*c, ch);
            }
        }
        h
    }

    /// The width a column item takes on its cross axis before stretching.
    fn item_cross_w(&mut self, c: int, k: int, cross_size: double, cross_mar: double) -> double {
        let spec = self.nodes[k as usize].width.resolve(cross_size);
        if spec >= 0.0 {
            return self.clamp_w(k, spec, cross_size);
        }
        let avail = if cross_size >= 0.0 { cross_size - cross_mar } else { INF };
        if self.align_of(c, k) == style::STRETCH && cross_size >= 0.0 {
            return self.clamp_w(k, avail.max(0.0), cross_size);
        }
        let fit = self.max_content_w(k);
        self.clamp_w(k, fit.min(avail), cross_size)
    }

    /// The height of the content of `k` at width `w`, without its declared
    /// height: the automatic minimum of a column item.
    fn content_height(&mut self, k: int, w: double) -> double {
        if self.nodes[k as usize].height.is_auto() {
            return self.height_for(k, w);
        }
        0.0
    }

    /// Grows or shrinks the items `a..e` of one line into `main_size`,
    /// freezing an item at its min or max and sharing the rest again, as the
    /// CSS algorithm does.
    fn resolve_flex(&self, items: &Vec<int>, a: usize, e: usize, main_size: double, gap: double, base: &Vec<double>, hypo: &Vec<double>, min_m: &Vec<double>, max_m: &Vec<double>, mar: &Vec<double>, out: &mut Vec<double>) {
        let count = e - a;
        let mut used = gap * ((count - 1) as double);
        let mut q = a;
        while q < e {
            used += hypo[q] + mar[q];
            q += 1;
        }
        let growing = used < main_size;
        let mut frozen: Vec<bool> = Vec::new();
        q = a;
        while q < e {
            let ku = items[q] as usize;
            let f = if growing { self.nodes[ku].grow <= 0.0 || base[q] > hypo[q] } else { self.nodes[ku].shrink <= 0.0 || base[q] < hypo[q] };
            frozen.push(f);
            out[q] = hypo[q];
            q += 1;
        }
        let mut rounds = 0;
        while rounds <= count {
            rounds += 1;
            let mut free = main_size - gap * ((count - 1) as double);
            let mut weight = 0.0;
            let mut grow_sum = 0.0;
            q = a;
            while q < e {
                let ku = items[q] as usize;
                if frozen[q - a] {
                    free -= out[q] + mar[q];
                } else {
                    free -= base[q] + mar[q];
                    if growing {
                        weight += self.nodes[ku].grow;
                        grow_sum += self.nodes[ku].grow;
                    } else {
                        weight += self.nodes[ku].shrink * base[q];
                    }
                }
                q += 1;
            }
            if weight <= 0.0 {
                break;
            }
            // a total grow under 1 hands out only that share of the space
            if growing && grow_sum < 1.0 {
                free = free * grow_sum;
            }
            let mut violation = 0.0;
            q = a;
            while q < e {
                if !frozen[q - a] {
                    let ku = items[q] as usize;
                    let share = if growing { self.nodes[ku].grow / weight } else { self.nodes[ku].shrink * base[q] / weight };
                    let want = base[q] + free * share;
                    let clamped = want.min(max_m[q]).max(min_m[q]).max(0.0);
                    violation += clamped - want;
                    out[q] = clamped;
                }
                q += 1;
            }
            if violation.abs() < 0.0000001 {
                break;
            }
            // freeze the items the clamp moved the way the total moved
            q = a;
            while q < e {
                if !frozen[q - a] {
                    let ku = items[q] as usize;
                    let share2 = if growing { self.nodes[ku].grow / weight } else { self.nodes[ku].shrink * base[q] / weight };
                    let want2 = base[q] + free * share2;
                    if (violation > 0.0 && out[q] > want2 + 0.0000001) || (violation < 0.0 && out[q] < want2 - 0.0000001) {
                        frozen[q - a] = true;
                    }
                }
                q += 1;
            }
        }
    }
}
