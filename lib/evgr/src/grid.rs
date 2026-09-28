//! Grid layout: `grid-template-columns` / `-rows` (px, %, fr, auto,
//! `minmax()`, `fit-content()`, `repeat(n, …)`, `repeat(auto-fit | auto-fill,
//! …)`), placement by line numbers, `span`, `grid-template-areas` and
//! `grid-area`, auto placement row by row (`dense` backfills), and the gaps.

use ranger::prelude::*;

use crate::style;
use crate::EvgrTree;

/// One track of a template.
#[derive(Clone, Copy)]
pub struct Track {
    /// 0 px, 1 percent, 2 fr, 3 auto, 4 minmax(px, fr), 5 fit-content(px),
    /// 6 minmax(px, px)
    pub kind: int,
    pub a: double,
    pub b: double,
    /// a track repeated by auto-fit, which collapses when nothing is in it
    pub fit: bool,
}

/// The pieces of a track list at the top level: `repeat(3, 1fr) 100px` is
/// two, the commas and spaces inside the parentheses kept.
fn top_level(list: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut cur = String::new();
    let mut depth = 0;
    for c in list.chars() {
        if c == '(' {
            depth += 1;
        }
        if c == ')' {
            depth -= 1;
        }
        if (c == ' ' || c == '\t' || c == '\n') && depth == 0 {
            if !cur.is_empty() {
                out.push(cur.clone());
                cur = String::new();
            }
            continue;
        }
        cur.push(c);
    }
    if !cur.is_empty() {
        out.push(cur);
    }
    out
}

/// `name(args)` -> the args, or "" when `t` is not a call of `name`.
fn call_args(t: &str, name: &str) -> String {
    let head = format!("{}(", name);
    if t.starts_with(&head) && t.ends_with(")") {
        let n = head.as_bytes().len();
        return t[n..t.as_bytes().len() - 1].to_string();
    }
    String::new()
}

fn one_track(t: &str) -> Track {
    let mm = call_args(t, "minmax");
    if !mm.is_empty() {
        let parts: Vec<&str> = mm.split(',').collect();
        let lo = parts[0].trim();
        let hi = if parts.len() > 1 { parts[1].trim() } else { "auto" };
        let lo_px = if lo == "auto" || lo.ends_with("content") { 0.0 } else { style::parse_len(lo).resolve(0.0).max(0.0) };
        if hi.ends_with("fr") {
            return Track { kind: 4, a: lo_px, b: style::number(&hi[..hi.as_bytes().len() - 2]), fit: false };
        }
        if hi == "auto" || hi.ends_with("content") {
            return Track { kind: 3, a: lo_px, b: 0.0, fit: false };
        }
        return Track { kind: 6, a: lo_px, b: style::parse_len(hi).resolve(0.0), fit: false };
    }
    let fc = call_args(t, "fit-content");
    if !fc.is_empty() {
        return Track { kind: 5, a: style::parse_len(&fc).resolve(0.0), b: 0.0, fit: false };
    }
    if t.ends_with("fr") {
        return Track { kind: 2, a: style::number(&t[..t.as_bytes().len() - 2]), b: 0.0, fit: false };
    }
    if t == "auto" || t.ends_with("content") {
        return Track { kind: 3, a: 0.0, b: 0.0, fit: false };
    }
    if t.ends_with("%") {
        return Track { kind: 1, a: style::number(&t[..t.as_bytes().len() - 1]), b: 0.0, fit: false };
    }
    Track { kind: 0, a: style::parse_len(t).resolve(0.0).max(0.0), b: 0.0, fit: false }
}

/// The smallest a track can be, for counting auto-fill repetitions.
fn track_min(t: &Track) -> double {
    if t.kind == 0 || t.kind == 4 || t.kind == 6 {
        return t.a;
    }
    0.0
}

/// A template, with `repeat()` expanded. `avail` is the container's inner
/// size (-1.0 unknown), which auto-fit / auto-fill need.
pub fn parse_tracks(list: &str, avail: double, gap: double) -> Vec<Track> {
    let mut out: Vec<Track> = Vec::new();
    if list.trim().is_empty() || list.trim() == "none" {
        return out;
    }
    for piece in top_level(list) {
        let rep = call_args(&piece, "repeat");
        if rep.is_empty() {
            out.push(one_track(&piece));
            continue;
        }
        let comma = rep.find(',').unwrap_or(0);
        let count_s = rep[..comma].trim().to_string();
        let inner = rep[comma + 1..].trim().to_string();
        let tracks = top_level(&inner);
        let mut group: Vec<Track> = Vec::new();
        for t in &tracks {
            group.push(one_track(t));
        }
        let mut times = 1;
        let auto_fit = count_s == "auto-fit";
        if count_s == "auto-fit" || count_s == "auto-fill" {
            let mut unit = 0.0;
            for g in &group {
                unit += track_min(g);
            }
            let per = unit + gap * (group.len() as double);
            if avail > 0.0 && per > 0.0 {
                times = (((avail + gap) / per).floor()) as int;
            }
            if times < 1 {
                times = 1;
            }
        } else {
            times = style::number(&count_s) as int;
        }
        let mut k = 0;
        while k < times {
            for g in &group {
                let mut t = *g;
                t.fit = auto_fit;
                out.push(t);
            }
            k += 1;
        }
    }
    out
}

/// The named areas of `grid-template-areas`: for each name, its rows and
/// columns (0-based, end exclusive), in `names` order.
pub struct Areas {
    pub names: Vec<String>,
    pub r0: Vec<int>,
    pub r1: Vec<int>,
    pub c0: Vec<int>,
    pub c1: Vec<int>,
}

pub fn parse_areas(v: &str) -> Areas {
    let mut a = Areas { names: Vec::new(), r0: Vec::new(), r1: Vec::new(), c0: Vec::new(), c1: Vec::new() };
    let mut row = 0;
    for chunk in v.split('"') {
        let line = chunk.trim();
        if line.is_empty() {
            continue;
        }
        let mut col = 0;
        for name in line.split_whitespace() {
            if name != "." {
                let mut found = -1;
                let mut i = 0;
                while i < a.names.len() {
                    if a.names[i] == name {
                        found = i as int;
                    }
                    i += 1;
                }
                if found < 0 {
                    a.names.push(name.to_string());
                    a.r0.push(row);
                    a.r1.push(row + 1);
                    a.c0.push(col);
                    a.c1.push(col + 1);
                } else {
                    let f = found as usize;
                    if row + 1 > a.r1[f] {
                        a.r1[f] = row + 1;
                    }
                    if col + 1 > a.c1[f] {
                        a.c1[f] = col + 1;
                    }
                }
            }
            col += 1;
        }
        row += 1;
    }
    a
}

/// `grid-column` / `grid-row`: (start line 0-based or -1 auto, span).
fn parse_line(v: &str) -> (int, int) {
    let t = v.trim();
    if t.is_empty() || t == "auto" {
        return (-1, 1);
    }
    let parts: Vec<&str> = t.split('/').collect();
    let a = parts[0].trim();
    let b = if parts.len() > 1 { parts[1].trim() } else { "" };
    let mut start: int = -1;
    let mut span: int = 1;
    if a.starts_with("span") {
        span = style::number(&a[4..]) as int;
    } else if a != "auto" {
        start = (style::number(a) as int) - 1;
    }
    if !b.is_empty() && b != "auto" {
        if b.starts_with("span") {
            span = style::number(&b[4..]) as int;
        } else {
            let end = (style::number(b) as int) - 1;
            if start >= 0 && end > start {
                span = end - start;
            }
        }
    }
    if span < 1 {
        span = 1;
    }
    (start, span)
}

impl EvgrTree {
    /// Lays out the items of grid container `c` in its content box; answers
    /// the content height.
    pub fn layout_grid(&mut self, c: int, iw: double, ih: double) -> double {
        let cu = c as usize;
        let col_gap = self.nodes[cu].col_gap;
        let row_gap = self.nodes[cu].row_gap;
        let cols_spec = self.nodes[cu].grid_cols.clone();
        let rows_spec = self.nodes[cu].grid_rows.clone();
        let mut cols = parse_tracks(&cols_spec, iw, col_gap);
        let mut rows = parse_tracks(&rows_spec, ih, row_gap);
        let areas = parse_areas(&self.nodes[cu].grid_areas.clone());
        if cols.is_empty() {
            let mut na = 0;
            for c1 in &areas.c1 {
                if *c1 > na {
                    na = *c1;
                }
            }
            let mut k = 0;
            while k < na.max(1) {
                cols.push(Track { kind: 3, a: 0.0, b: 0.0, fit: false });
                k += 1;
            }
        }
        let kids = self.nodes[cu].children.clone();
        let mut items: Vec<int> = Vec::new();
        for k in &kids {
            self.nodes[*k as usize].resolve_pads(iw);
            if self.in_flow(*k) {
                items.push(*k);
            }
        }
        // placement
        let n = items.len();
        let mut r0: Vec<int> = Vec::new();
        let mut rs: Vec<int> = Vec::new();
        let mut c0: Vec<int> = Vec::new();
        let mut cs: Vec<int> = Vec::new();
        let mut ncols = cols.len() as int;
        for k in &items {
            let ku = *k as usize;
            let area = self.nodes[ku].grid_area.clone();
            let mut placed = false;
            if !area.is_empty() && !area.contains('/') {
                let mut i = 0;
                while i < areas.names.len() {
                    if areas.names[i] == area.trim() {
                        r0.push(areas.r0[i]);
                        rs.push(areas.r1[i] - areas.r0[i]);
                        c0.push(areas.c0[i]);
                        cs.push(areas.c1[i] - areas.c0[i]);
                        placed = true;
                    }
                    i += 1;
                }
            }
            if !placed {
                let mut col_v = self.nodes[ku].grid_column.clone();
                let mut row_v = self.nodes[ku].grid_row.clone();
                if area.contains('/') {
                    // row-start / column-start / row-end / column-end
                    let p: Vec<&str> = area.split('/').collect();
                    row_v = p[0].trim().to_string();
                    if p.len() > 2 {
                        row_v = format!("{} / {}", p[0].trim(), p[2].trim());
                    }
                    if p.len() > 1 {
                        col_v = p[1].trim().to_string();
                    }
                    if p.len() > 3 {
                        col_v = format!("{} / {}", p[1].trim(), p[3].trim());
                    }
                }
                let (cs0, csp) = parse_line(&col_v);
                let (rs0, rsp) = parse_line(&row_v);
                r0.push(rs0);
                rs.push(rsp);
                c0.push(cs0);
                cs.push(csp);
            }
            let last = c0.len() - 1;
            if c0[last] >= 0 && c0[last] + cs[last] > ncols {
                ncols = c0[last] + cs[last];
            }
            if cs[last] > ncols {
                ncols = cs[last];
            }
        }
        while (cols.len() as int) < ncols {
            cols.push(Track { kind: 3, a: 0.0, b: 0.0, fit: false });
        }
        // the occupied cells, row by row, growing as items land
        let dense = self.nodes[cu].grid_dense;
        let mut taken: Vec<bool> = Vec::new();
        let mut nrows: int = 0;
        // explicitly placed items first
        let mut j = 0;
        while j < n {
            if r0[j] >= 0 && c0[j] >= 0 {
                self.mark(&mut taken, &mut nrows, ncols, r0[j], c0[j], rs[j], cs[j]);
            }
            j += 1;
        }
        let mut cur_r: int = 0;
        let mut cur_c: int = 0;
        j = 0;
        while j < n {
            if r0[j] >= 0 && c0[j] >= 0 {
                j += 1;
                continue;
            }
            if dense {
                cur_r = 0;
                cur_c = 0;
            }
            if c0[j] >= 0 {
                // a column given, a row found
                let mut rr = if dense { 0 } else { cur_r };
                while !self.fits(&taken, nrows, ncols, rr, c0[j], rs[j], cs[j]) {
                    rr += 1;
                }
                r0[j] = rr;
            } else if r0[j] >= 0 {
                let mut cc = 0;
                while cc + cs[j] <= ncols && !self.fits(&taken, nrows, ncols, r0[j], cc, rs[j], cs[j]) {
                    cc += 1;
                }
                c0[j] = cc;
            } else {
                let mut rr2 = cur_r;
                let mut cc2 = cur_c;
                let mut searching = true;
                while searching {
                    if cc2 + cs[j] > ncols {
                        cc2 = 0;
                        rr2 += 1;
                        continue;
                    }
                    if self.fits(&taken, nrows, ncols, rr2, cc2, rs[j], cs[j]) {
                        searching = false;
                    } else {
                        cc2 += 1;
                    }
                }
                r0[j] = rr2;
                c0[j] = cc2;
                cur_r = rr2;
                cur_c = cc2 + cs[j];
            }
            self.mark(&mut taken, &mut nrows, ncols, r0[j], c0[j], rs[j], cs[j]);
            j += 1;
        }
        while (rows.len() as int) < nrows {
            let auto_rows = self.nodes[cu].grid_auto_rows.clone();
            if auto_rows.is_empty() {
                rows.push(Track { kind: 3, a: 0.0, b: 0.0, fit: false });
            } else {
                rows.push(one_track(&auto_rows));
            }
        }
        // column sizes
        let mut used_cols: Vec<bool> = Vec::new();
        let mut k2 = 0;
        while k2 < cols.len() {
            used_cols.push(false);
            k2 += 1;
        }
        j = 0;
        while j < n {
            let mut q = c0[j];
            while q < c0[j] + cs[j] {
                used_cols[q as usize] = true;
                q += 1;
            }
            j += 1;
        }
        let mut col_content: Vec<double> = Vec::new();
        let mut col_min: Vec<double> = Vec::new();
        k2 = 0;
        while k2 < cols.len() {
            col_content.push(0.0);
            col_min.push(0.0);
            k2 += 1;
        }
        j = 0;
        while j < n {
            if cs[j] == 1 {
                let t = cols[c0[j] as usize];
                if t.kind == 3 || t.kind == 5 {
                    let k = items[j];
                    let mars = self.nodes[k as usize].mar_l + self.nodes[k as usize].mar_r;
                    let m = self.max_content_w(k) + mars;
                    if m > col_content[c0[j] as usize] {
                        col_content[c0[j] as usize] = m;
                    }
                    let mn = self.min_content_w(k) + mars;
                    if mn > col_min[c0[j] as usize] {
                        col_min[c0[j] as usize] = mn;
                    }
                }
            }
            j += 1;
        }
        let col_w = self.size_tracks(&cols, &used_cols, &col_content, &col_min, iw, col_gap);
        // row sizes: an auto row is as tall as its tallest single-row item at
        // its column width
        let mut row_content: Vec<double> = Vec::new();
        let mut used_rows: Vec<bool> = Vec::new();
        k2 = 0;
        while k2 < rows.len() {
            row_content.push(0.0);
            used_rows.push(true);
            k2 += 1;
        }
        let mut cell_w: Vec<double> = Vec::new();
        j = 0;
        while j < n {
            let w = self.span_size(&col_w, c0[j], cs[j], col_gap);
            cell_w.push(w);
            if rs[j] == 1 {
                let t = rows[r0[j] as usize];
                if t.kind == 3 || t.kind == 5 {
                    let k = items[j];
                    let spec = self.nodes[k as usize].width.resolve(w);
                    let iwk = if spec >= 0.0 { spec } else { w - self.nodes[k as usize].mar_l - self.nodes[k as usize].mar_r };
                    let hk = self.height_for(k, iwk.max(0.0)) + self.nodes[k as usize].mar_t + self.nodes[k as usize].mar_b;
                    if hk > row_content[r0[j] as usize] {
                        row_content[r0[j] as usize] = hk;
                    }
                }
            }
            j += 1;
        }
        // auto rows stretch into a container whose height is declared; the
        // height a root takes from the viewport does not stretch them
        let declared = !self.nodes[cu].height.is_auto();
        let row_h = self.size_tracks_rows(&rows, &used_rows, &row_content, ih, row_gap, declared);
        // place, from where each track starts
        let col_at = self.starts(&col_w, col_gap);
        let row_at = self.starts(&row_h, row_gap);
        let x0 = self.nodes[cu].x + self.nodes[cu].pad_l;
        let y0 = self.nodes[cu].y + self.nodes[cu].pad_t;
        j = 0;
        while j < n {
            let k = items[j];
            let ku = k as usize;
            let cx = x0 + col_at[c0[j] as usize];
            let cy = y0 + row_at[r0[j] as usize];
            let cw = cell_w[j];
            let ch = self.span_size(&row_h, r0[j], rs[j], row_gap);
            let mut w = self.nodes[ku].width.resolve(cw);
            if w < 0.0 {
                w = cw - self.nodes[ku].mar_l - self.nodes[ku].mar_r;
            }
            w = self.clamp_w(k, w.max(0.0), cw);
            let mut h = self.nodes[ku].height.resolve(ch);
            if h < 0.0 {
                let al = self.nodes[ku].align_self;
                if al == style::UNSET || al == style::STRETCH {
                    h = ch - self.nodes[ku].mar_t - self.nodes[ku].mar_b;
                } else {
                    h = self.height_for(k, w);
                }
            }
            h = self.clamp_h(k, h.max(0.0), ch);
            self.place(k, cx + self.nodes[ku].mar_l, cy + self.nodes[ku].mar_t, w, h);
            j += 1;
        }
        let mut total = 0.0;
        let mut count = 0;
        for r in &row_h {
            total += *r;
            count += 1;
        }
        if count > 1 {
            total += row_gap * ((count - 1) as double);
        }
        total
    }

    fn fits(&self, taken: &Vec<bool>, nrows: int, ncols: int, r: int, c: int, rs: int, cs: int) -> bool {
        if c + cs > ncols {
            return false;
        }
        let mut rr = r;
        while rr < r + rs {
            let mut cc = c;
            while cc < c + cs {
                if rr < nrows && taken[(rr * ncols + cc) as usize] {
                    return false;
                }
                cc += 1;
            }
            rr += 1;
        }
        true
    }

    fn mark(&self, taken: &mut Vec<bool>, nrows: &mut int, ncols: int, r: int, c: int, rs: int, cs: int) {
        while *nrows < r + rs {
            let mut k = 0;
            while k < ncols {
                taken.push(false);
                k += 1;
            }
            *nrows += 1;
        }
        let mut rr = r;
        while rr < r + rs {
            let mut cc = c;
            while cc < c + cs && cc < ncols {
                taken[(rr * ncols + cc) as usize] = true;
                cc += 1;
            }
            rr += 1;
        }
    }

    /// Where each track starts; a collapsed (empty auto-fit) track takes
    /// no gap.
    fn starts(&self, sizes: &Vec<double>, gap: double) -> Vec<double> {
        let mut out: Vec<double> = Vec::new();
        let mut x = 0.0;
        for s in sizes {
            out.push(x);
            x += *s;
            if *s > 0.0 || gap == 0.0 {
                x += gap;
            }
        }
        out
    }

    fn span_size(&self, sizes: &Vec<double>, start: int, span: int, gap: double) -> double {
        let mut w = 0.0;
        let mut k = start;
        while k < start + span {
            w += sizes[k as usize];
            if k > start {
                w += gap;
            }
            k += 1;
        }
        w
    }

    fn size_tracks_rows(&self, tracks: &Vec<Track>, used: &Vec<bool>, content: &Vec<double>, avail: double, gap: double, declared: bool) -> Vec<double> {
        if declared {
            return self.size_tracks(tracks, used, content, content, avail, gap);
        }
        let mut any_fr = false;
        for t in tracks {
            if t.kind == 2 || t.kind == 4 || t.kind == 1 {
                any_fr = true;
            }
        }
        // only fr and % rows need the height; auto rows are their content
        let a = if any_fr { avail } else { -1.0 };
        self.size_tracks(tracks, used, content, content, a, gap)
    }

    /// Sizes of the tracks along one axis: fixed ones as given, auto ones
    /// from their content, then the free space to the fr tracks (never
    /// below a minmax minimum), or else shared by the auto tracks. An
    /// empty auto-fit track collapses. `avail` is -1.0 when unknown.
    fn size_tracks(&self, tracks: &Vec<Track>, used: &Vec<bool>, content: &Vec<double>, content_min: &Vec<double>, avail: double, gap: double) -> Vec<double> {
        let n = tracks.len();
        let mut size: Vec<double> = Vec::new();
        let mut is_fr: Vec<bool> = Vec::new();
        let mut fixed_sum = 0.0;
        let mut live = 0;
        let mut k = 0;
        while k < n {
            let t = tracks[k];
            let collapsed = t.fit && !used[k];
            let mut s = 0.0;
            let mut fr = false;
            if collapsed {
                s = 0.0;
            } else if t.kind == 0 {
                s = t.a;
            } else if t.kind == 1 {
                s = if avail >= 0.0 { avail * t.a / 100.0 } else { 0.0 };
            } else if t.kind == 2 || t.kind == 4 {
                fr = true;
            } else if t.kind == 3 {
                s = content[k].max(t.a);
            } else if t.kind == 5 {
                // fit-content(x): the content, capped at x, but never under
                // its min-content
                s = content[k].min(t.a).max(content_min[k]);
            } else if t.kind == 6 {
                s = content[k].max(t.a).min(t.b);
            }
            if !collapsed {
                live += 1;
            }
            size.push(s);
            is_fr.push(fr);
            if !fr {
                fixed_sum += s;
            }
            k += 1;
        }
        let gaps = if live > 1 { gap * ((live - 1) as double) } else { 0.0 };
        let mut frozen: Vec<bool> = Vec::new();
        k = 0;
        while k < n {
            frozen.push(!is_fr[k] || (tracks[k].fit && !used[k]));
            k += 1;
        }
        if avail >= 0.0 {
            // fr: share what is left, freezing a track its minimum holds up
            let mut rounds = 0;
            while rounds <= n {
                rounds += 1;
                let mut free = avail - gaps;
                let mut frs = 0.0;
                k = 0;
                while k < n {
                    if frozen[k] {
                        free -= size[k];
                    } else {
                        frs += if tracks[k].kind == 2 { tracks[k].a } else { tracks[k].b };
                    }
                    k += 1;
                }
                if frs <= 0.0 {
                    break;
                }
                // factors summing under 1 take only their share of the space
                let unit = (free.max(0.0)) / frs.max(1.0);
                let mut again = false;
                k = 0;
                while k < n {
                    if !frozen[k] {
                        let f = if tracks[k].kind == 2 { tracks[k].a } else { tracks[k].b };
                        let s = unit * f;
                        let lo = if tracks[k].kind == 4 { tracks[k].a } else { 0.0 };
                        if s < lo {
                            size[k] = lo;
                            frozen[k] = true;
                            again = true;
                        } else {
                            size[k] = s;
                        }
                    }
                    k += 1;
                }
                if !again {
                    break;
                }
            }
            // no fr: auto tracks stretch into what is left
            let mut any_fr = false;
            k = 0;
            while k < n {
                if is_fr[k] {
                    any_fr = true;
                }
                k += 1;
            }
            if !any_fr {
                let mut autos = 0;
                k = 0;
                while k < n {
                    if tracks[k].kind == 3 && !(tracks[k].fit && !used[k]) {
                        autos += 1;
                    }
                    k += 1;
                }
                let free2 = avail - gaps - fixed_sum;
                if autos > 0 && free2 > 0.0 {
                    k = 0;
                    while k < n {
                        if tracks[k].kind == 3 && !(tracks[k].fit && !used[k]) {
                            size[k] += free2 / (autos as double);
                        }
                        k += 1;
                    }
                }
            }
        } else {
            // an unknown size: fr tracks as their minimum, or their content
            k = 0;
            while k < n {
                if is_fr[k] {
                    size[k] = if tracks[k].kind == 4 { tracks[k].a.max(content[k]) } else { content[k] };
                }
                k += 1;
            }
        }
        size
    }
}
