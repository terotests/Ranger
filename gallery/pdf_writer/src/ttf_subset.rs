// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::true_type_font::TTFTableRecord;
use crate::true_type_font::TrueTypeFont;
use crate::rgr::{GrowableBuffer};

/// TTFSubset.rgr — embed the glyphs a page uses, not the whole face
///
/// An emoji face is 858 KB and a colour one is 25 MB, essentially all of it
/// `glyf`. Embedding the file whole made one 🎉 on a page cost more than every
/// other byte of the PDF put together — and a photo book with an emoji in the
/// caption of each spread paid it once per face, not once per glyph.
///
/// The subset here deliberately KEEPS GLYPH IDS. A conventional subsetter
/// renumbers glyphs densely and rewrites cmap to match; that would break the
/// PDF side, where the CID font is written `/CIDToGIDMap /Identity` and the
/// bytes in the content stream ARE glyph ids. Renumbering would mean either
/// emitting a CIDToGIDMap stream or rewriting every string already produced.
/// Holding the numbering still costs one empty `loca` entry (4 bytes) per
/// unused glyph below the highest used one, and nothing else:
///
///   Noto Emoji, one emoji on the page:  878 928  ->  ~15 000 bytes
///
/// What is kept is the minimum an embedded CIDFontType2 needs to be drawn:
/// head, hhea, maxp, hmtx, loca, glyf. Everything else goes — `cmap` included,
/// because a Type0/Identity-H font never consults it (the CID is the glyph id),
/// and that alone drops GSUB, post, name, vmtx and the rest.
///
/// Composite glyphs pull their components in transitively: an emoji built from
/// parts whose parts are themselves composite would otherwise embed a reference
/// to a glyph that is no longer there, and readers draw that as nothing.
#[derive(Clone)]
pub struct TTFSubset {
    pub font: Option<Rc<RefCell<TrueTypeFont>>>,
    pub glyfOffset: i64,
    pub glyfLength: i64,
    pub locaOffset: i64,
    pub locaLongFormat: bool,
    /// keep[gid] — sized to the original numGlyphs, so a composite component can
    /// be marked no matter where it sits.
    pub keep: Vec<bool>,
}

impl TTFSubset {
    pub fn new() -> Self {
        Self {
            font: None,
            glyfOffset: 0,
            glyfLength: 0,
            locaOffset: 0,
            locaLongFormat: false,
            keep: Vec::new(),
        }
    }
    /// The bytes of a font containing only `usedGids` (plus their components),
    /// with glyph ids unchanged. Returns an empty buffer when the face cannot be
    /// subset — a caller that gets one should embed the original rather than
    /// produce a PDF with no font in it.
    pub fn build(font: Rc<RefCell<TrueTypeFont>>, used_gids: &[i64]) -> Vec<u8> {
        let mut sub: Rc<RefCell<TTFSubset>> = Rc::new(RefCell::new(TTFSubset::new()));
        return sub.borrow_mut().run(font.clone(), used_gids);
    }
    /// The sum of the table's 32-bit big-endian words, padded with zeros.
    /// Written because the directory has a field for it; nothing here depends
    /// on the value being right, but a validator will say so if it is not.
    pub fn checksum(data: &[u8]) -> i64 {
        let mut sum: i64 = 0;
        let __len: i64 = data.len() as i64;
        let mut i: i64 = 0;
        while i < __len {
            let b0: i64 = data[i as usize] as i64;
            let mut b1: i64 = 0;
            let mut b2: i64 = 0;
            let mut b3: i64 = 0;
            if i + 1 < __len {
                b1 = data[(i + 1) as usize] as i64;
            }
            if i + 2 < __len {
                b2 = data[(i + 2) as usize] as i64;
            }
            if i + 3 < __len {
                b3 = data[(i + 3) as usize] as i64;
            }
            let word: i64 = ((b0 * 16777216 + b1 * 65536) + b2 * 256) + b3;
            sum = (sum + word) % 4294967296;
            i += 4;
        }
        sum
    }
    pub fn run(&mut self, f: Rc<RefCell<TrueTypeFont>>, used_gids: &[i64]) -> Vec<u8> {
        self.font = Some(f.clone());
        let mut empty: Vec<u8> = vec![0u8; 0];
        if !f.borrow().isLoaded() {
            return empty;
        }
        let mut glyf_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("glyf");
        let mut loca_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("loca");
        let mut head_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("head");
        let mut hhea_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("hhea");
        let mut maxp_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("maxp");
        let mut hmtx_tab: Rc<RefCell<TTFTableRecord>> = f.borrow().findTable("hmtx");
        // A CFF face has no `glyf` at all and cannot be subset this way.
        if glyf_tab.borrow().offset == 0 {
            return empty;
        }
        if loca_tab.borrow().offset == 0 {
            return empty;
        }
        if head_tab.borrow().offset == 0 {
            return empty;
        }
        if hhea_tab.borrow().offset == 0 {
            return empty;
        }
        if maxp_tab.borrow().offset == 0 {
            return empty;
        }
        if hmtx_tab.borrow().offset == 0 {
            return empty;
        }
        self.glyfOffset = glyf_tab.borrow().offset;
        self.glyfLength = glyf_tab.borrow().length;
        self.locaOffset = loca_tab.borrow().offset;
        self.locaLongFormat = f.borrow().indexToLocFormat == 1;
        let total: i64 = f.borrow().numGlyphs;
        if total <= 0 {
            return empty;
        }
        self.keep.clear();
        let mut i: i64 = 0;
        while i < total {
            self.keep.push(false);
            i += 1;
        }
        // .notdef is always present: a reader that needs a missing glyph draws
        // it, and an empty glyph 0 is what "missing" should look like.
        self.mark(0, 0);
        let mut u: i64 = 0;
        while u < (used_gids.len() as i64) {
            self.mark(used_gids[u as usize], 0);
            u += 1;
        }
        // Everything above the highest kept glyph can simply not exist, which
        // is where most of the loca table goes.
        let mut max_gid: i64 = 0;
        let mut k: i64 = 0;
        while k < total {
            if self.keep[k as usize] {
                max_gid = k;
            }
            k += 1;
        }
        let new_num_glyphs: i64 = max_gid + 1;
        // ---- glyf + loca -------------------------------------------------
        let mut new_glyf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let mut offsets: Vec<i64> = Vec::new();
        let mut g: i64 = 0;
        while g < new_num_glyphs {
            offsets.push(GrowableBuffer::size(&new_glyf));
            if self.keep[g as usize] {
                let start: i64 = self.glyphStart(g);
                let end: i64 = self.glyphEnd(g);
                if end > start {
                    let mut _tmp_88 = self.font.as_ref().unwrap().borrow().fontData.clone();
                    GrowableBuffer::writeBytes(
                        &new_glyf,
                        &_tmp_88,
                        self.glyfOffset + start,
                        end - start
                    );
                    // Glyph data is padded to a 4-byte boundary so the long
                    // loca offsets stay word-aligned, which some rasterizers
                    // assume even though the spec only asks for 2.
                    while GrowableBuffer::size(&new_glyf) % 4 != 0 {
                        GrowableBuffer::writeByte(&new_glyf, 0);
                    }
                }
            }
            g += 1;
        }
        offsets.push(GrowableBuffer::size(&new_glyf));
        let mut new_loca: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let mut li: i64 = 0;
        while li < (offsets.len() as i64) {
            // Always long format: a short loca stores offset/2 and cannot
            // address a glyf table over 128 KB, and deciding per font is a
            // branch with nothing to gain.
            GrowableBuffer::write_int32be(&new_loca, offsets[li as usize]);
            li += 1;
        }
        // ---- head, with the loca format corrected ------------------------
        let mut new_head: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let mut _tmp_89 = self.font.as_ref().unwrap().borrow().fontData.clone();
        let mut _tmp_90 = head_tab.borrow().offset.clone();
        GrowableBuffer::writeBytes(&new_head, &_tmp_89, _tmp_90, head_tab.borrow().length.clone());
        let mut head_buf: Vec<u8> = GrowableBuffer::toBuffer(&new_head);
        // checkSumAdjustment (offset 8) is zeroed: it is a checksum over the
        // whole assembled file, and no reader that matters verifies it.
        head_buf[8] = 0;
        head_buf[9] = 0;
        head_buf[10] = 0;
        head_buf[11] = 0;
        // indexToLocFormat (offset 50) = 1, long.
        head_buf[50] = 0;
        head_buf[51] = 1;
        // ---- hmtx, one full metric per surviving glyph --------------------
        //
        // The original packs trailing glyphs as bearings only, indexed off
        // numberOfHMetrics. Writing every glyph in long form costs 4 bytes a
        // glyph and removes the whole class of off-by-one that packing invites.
        let mut new_hmtx: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let orig_metrics: i64 = self.font.as_ref().unwrap().borrow().numberOfHMetrics;
        let mut m: i64 = 0;
        while m < new_num_glyphs {
            let mut src: i64 = m;
            if src >= orig_metrics {
                src = orig_metrics - 1;
            }
            if src < 0 {
                src = 0;
            }
            let adv: i64 = (self.font.as_ref().unwrap()).borrow().readUInt16(hmtx_tab.borrow().offset + src * 4);
            let mut lsb: i64 = 0;
            if m < orig_metrics {
                lsb = (self.font.as_ref().unwrap()).borrow().readInt16((hmtx_tab.borrow().offset + m * 4) + 2);
            } else {
                let tail_off: i64 = (hmtx_tab.borrow().offset + orig_metrics * 4) + (m - orig_metrics) * 2;
                if tail_off + 2 <= hmtx_tab.borrow().offset + hmtx_tab.borrow().length {
                    lsb = (self.font.as_ref().unwrap()).borrow().readInt16(tail_off);
                }
            }
            GrowableBuffer::write_int16be(&new_hmtx, adv);
            GrowableBuffer::write_int16be(&new_hmtx, lsb);
            m += 1;
        }
        let mut new_hhea: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let mut _tmp_93 = self.font.as_ref().unwrap().borrow().fontData.clone();
        let mut _tmp_94 = hhea_tab.borrow().offset.clone();
        GrowableBuffer::writeBytes(&new_hhea, &_tmp_93, _tmp_94, hhea_tab.borrow().length.clone());
        let mut hhea_buf: Vec<u8> = GrowableBuffer::toBuffer(&new_hhea);
        // numberOfHMetrics (offset 34) now equals the glyph count.
        hhea_buf[34] = ((new_num_glyphs as f64 / 256.0).floor() as i64) as u8;
        hhea_buf[35] = (new_num_glyphs % 256) as u8;
        let mut new_maxp: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        let mut _tmp_96 = self.font.as_ref().unwrap().borrow().fontData.clone();
        let mut _tmp_97 = maxp_tab.borrow().offset.clone();
        GrowableBuffer::writeBytes(&new_maxp, &_tmp_96, _tmp_97, maxp_tab.borrow().length.clone());
        let mut maxp_buf: Vec<u8> = GrowableBuffer::toBuffer(&new_maxp);
        // numGlyphs (offset 4)
        maxp_buf[4] = ((new_num_glyphs as f64 / 256.0).floor() as i64) as u8;
        maxp_buf[5] = (new_num_glyphs % 256) as u8;
        // ---- assemble ----------------------------------------------------
        // The directory has to be ordered by tag; these are pushed that way —
        // glyf, head, hhea, hmtx, loca, maxp is already alphabetical — rather
        // than sorted afterwards, so there is nothing to keep in step.
        let mut tags: Vec<String> = Vec::new();
        let mut datas: Vec<Vec<u8>> = Vec::new();
        tags.push("glyf".to_string().to_string());
        datas.push(GrowableBuffer::toBuffer(&new_glyf));
        tags.push("head".to_string().to_string());
        datas.push(head_buf);
        tags.push("hhea".to_string().to_string());
        datas.push(hhea_buf);
        tags.push("hmtx".to_string().to_string());
        datas.push(GrowableBuffer::toBuffer(&new_hmtx));
        tags.push("loca".to_string().to_string());
        datas.push(GrowableBuffer::toBuffer(&new_loca));
        tags.push("maxp".to_string().to_string());
        datas.push(maxp_buf);
        self.writeSfnt(&tags, &datas)
    }
    /// Mark a glyph and, when it is composite, everything it is built from.
    ///
    /// `depth` guards against a font whose components form a cycle. A real face
    /// never does, but a subsetter that loops on a malformed one hangs the build
    /// rather than producing a bad PDF, which is worse.
    pub fn mark(&mut self, gid: i64, depth: i64) {
        if depth > 8 {
            return;
        }
        if gid < 0 {
            return;
        }
        if gid >= (self.keep.len() as i64) {
            return;
        }
        if self.keep[gid as usize] {
            return;
        }
        self.keep[gid as usize] = true;
        let start: i64 = self.glyphStart(gid);
        let end: i64 = self.glyphEnd(gid);
        if end - start < 10 {
            return;
        }
        let off: i64 = self.glyfOffset + start;
        let number_of_contours: i64 = (self.font.as_ref().unwrap()).borrow().readInt16(off);
        if number_of_contours >= 0 {
            return;
        }
        // Composite: a run of component records, each with its own flags.
        let mut p: i64 = off + 10;
        let mut more: bool = true;
        while more {
            let flags: i64 = (self.font.as_ref().unwrap()).borrow().readUInt16(p);
            let comp_gid: i64 = (self.font.as_ref().unwrap()).borrow().readUInt16(p + 2);
            self.mark(comp_gid, depth + 1);
            p += 4;
            // ARG_1_AND_2_ARE_WORDS
            if flags % 2 == 1 {
                p += 4;
            } else {
                p += 2;
            }
            // WE_HAVE_A_SCALE (8) / WE_HAVE_AN_X_AND_Y_SCALE (64) /
            // WE_HAVE_A_TWO_BY_TWO (128) — mutually exclusive.
            if self.bit(flags, 3) == 1 {
                p += 2;
            }
            if self.bit(flags, 6) == 1 {
                p += 4;
            }
            if self.bit(flags, 7) == 1 {
                p += 8;
            }
            // MORE_COMPONENTS
            more = self.bit(flags, 5) == 1;
            if p >= self.glyfOffset + self.glyfLength {
                more = false;
            }
        }
    }
    pub fn bit(&self, value: i64, n: i64) -> i64 {
        let mut shifted: i64 = value;
        let mut i: i64 = 0;
        while i < n {
            shifted = (shifted as f64 / 2.0).floor() as i64;
            i += 1;
        }
        shifted % 2
    }
    pub fn glyphStart(&self, gid: i64) -> i64 {
        if self.locaLongFormat {
            return (self.font.as_ref().unwrap()).borrow().readUInt32(self.locaOffset + gid * 4);
        }
        return (self.font.as_ref().unwrap()).borrow().readUInt16(self.locaOffset + gid * 2) * 2;
    }
    pub fn glyphEnd(&self, gid: i64) -> i64 {
        self.glyphStart(gid + 1)
    }
    pub fn writeSfnt(&self, tags: &[String], datas: &Vec<Vec<u8>>) -> Vec<u8> {
        let n: i64 = tags.len() as i64;
        let mut out: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        // Offset table. searchRange/entrySelector/rangeShift describe a binary
        // search over the directory; they are derived from n, and a reader that
        // uses them will read past the end if they disagree.
        let mut entry_selector: i64 = 0;
        let mut pow: i64 = 1;
        while pow * 2 <= n {
            pow *= 2;
            entry_selector += 1;
        }
        let search_range: i64 = pow * 16;
        // sfntVersion 1.0
        GrowableBuffer::write_int32be(&out, 65536);
        GrowableBuffer::write_int16be(&out, n);
        GrowableBuffer::write_int16be(&out, search_range);
        GrowableBuffer::write_int16be(&out, entry_selector);
        GrowableBuffer::write_int16be(&out, n * 16 - search_range);
        // Directory entries come first, so every table offset is known before
        // a byte of table data is written.
        let data_start: i64 = 12 + n * 16;
        let mut offsets: Vec<i64> = Vec::new();
        let mut cursor: i64 = data_start;
        let mut i: i64 = 0;
        while i < n {
            offsets.push(cursor);
            let __len: i64 = datas[i as usize].clone().len() as i64;
            cursor += __len;
            while cursor % 4 != 0 {
                cursor += 1;
            }
            i += 1;
        }
        i = 0;
        while i < n {
            let mut d: Vec<u8> = datas[i as usize].clone();
            GrowableBuffer::writeString(&out, &tags[i as usize].clone());
            GrowableBuffer::write_int32be(&out, TTFSubset::checksum(&d));
            GrowableBuffer::write_int32be(&out, offsets[i as usize]);
            GrowableBuffer::write_int32be(&out, d.len() as i64);
            i += 1;
        }
        i = 0;
        while i < n {
            let mut d2: Vec<u8> = datas[i as usize].clone();
            GrowableBuffer::writeBuffer(&out, &d2);
            while GrowableBuffer::size(&out) % 4 != 0 {
                GrowableBuffer::writeByte(&out, 0);
            }
            i += 1;
        }
        return GrowableBuffer::toBuffer(&out);
    }
}
