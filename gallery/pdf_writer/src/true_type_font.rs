// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::rgr::PdfText;
use crate::rgr::{EVGCodepoint, EVGGrapheme};

/// TrueTypeFont.rgr - Parse TrueType font files for metrics and embedding
///
/// TrueType file structure:
/// - Offset Table (header)
/// - Table Directory (list of tables)
/// - Tables: head, hhea, hmtx, cmap, maxp, name, OS/2, post, glyf, loca, etc.
///
/// For text measurement we need:
/// - cmap: character to glyph mapping
/// - hmtx: horizontal metrics (advance widths)
/// - hhea: horizontal header (ascender, descender)
/// - head: font header (units per em)
#[derive(Clone)]
pub struct TTFTableRecord {
    pub tag: String,
    pub checksum: i64,
    pub offset: i64,
    pub length: i64,
}

impl TTFTableRecord {
    pub fn new() -> Self {
        Self {
            tag: String::new(),
            checksum: 0,
            offset: 0,
            length: 0,
        }
    }
}

#[derive(Clone)]
pub struct TTFGlyphMetrics {
    pub advanceWidth: i64,
    pub leftSideBearing: i64,
}

impl TTFGlyphMetrics {
    pub fn new() -> Self {
        Self {
            advanceWidth: 0,
            leftSideBearing: 0,
        }
    }
}

/// What a shaping pass produced: the glyphs to draw, and which codepoints of
/// the input each one came from.
///
/// The cluster range is not bookkeeping — it is the only way back to text. A
/// ZWJ family is one glyph made from five codepoints, and the PDF's /ToUnicode
/// entry for that glyph has to name all five or the emoji cannot be copied out
/// of the page as what it was.
#[derive(Clone)]
pub struct TTFShapedRun {
    pub glyphs: Vec<i64>,
    /// Half-open [start, end) into the codepoint array that was shaped.
    pub clusterStart: Vec<i64>,
    pub clusterEnd: Vec<i64>,
}

impl TTFShapedRun {
    pub fn new() -> Self {
        Self {
            glyphs: Vec::new(),
            clusterStart: Vec::new(),
            clusterEnd: Vec::new(),
        }
    }
    pub fn count(&self) -> i64 {
        self.glyphs.len() as i64
    }
}

#[derive(Clone)]
pub struct TrueTypeFont {
    pub fontData: Vec<u8>,
    /// The sfnt pdfFontData is writing (empty between calls).
    pdfOut: Vec<u8>,
    pub fontPath: String,
    pub fontFamily: String,
    pub fontStyle: String,
    /// Offset table
    pub sfntVersion: i64,
    pub numTables: i64,
    pub searchRange: i64,
    pub entrySelector: i64,
    pub rangeShift: i64,
    /// Table directory
    pub tables: Vec<Rc<RefCell<TTFTableRecord>>>,
    /// head table
    pub unitsPerEm: i64,
    pub xMin: i64,
    pub yMin: i64,
    pub xMax: i64,
    pub yMax: i64,
    pub indexToLocFormat: i64,
    /// hhea table
    pub ascender: i64,
    pub descender: i64,
    pub lineGap: i64,
    pub numberOfHMetrics: i64,
    /// maxp table
    pub numGlyphs: i64,
    /// cmap table - character to glyph mapping
    pub cmapFormat: i64,
    pub cmapOffset: i64,
    /// hmtx table - glyph widths
    pub glyphWidths: Vec<i64>,
    pub defaultWidth: i64,
    /// Character to width cache (ASCII 0-255)
    pub charWidths: Vec<i64>,
    pub charWidthsLoaded: bool,
    /// ---- Kerning -----------------------------------------------------------
    /// Absolute file offsets of the GPOS pair-adjustment subtables reachable
    /// from the `kern` feature. Walked per pair rather than expanded into a
    /// table: a class-based subtable is a few hundred bytes and expands to tens
    /// of thousands of pairs, almost none of which a given page uses.
    pub kernSubtables: Vec<i64>,
    /// Which lookup each subtable came from. Subtables WITHIN a lookup are tried
    /// in order and the first match wins; separate lookups each get to apply.
    /// Summing every subtable double-counted any pair listed in more than one,
    /// which made Noto Sans measure narrower than a browser shows it.
    pub kernSubtableLookups: Vec<i64>,
    /// Did the last pairAdvance find the pair at all? A matched pair may still
    /// carry a zero adjustment, so the return value cannot say.
    pub pairMatched: bool,
    /// Legacy `kern` table, format 0. Some older faces carry this instead of
    /// GPOS; a few carry both, in which case GPOS wins as OpenType requires.
    /// ---- Shaping -----------------------------------------------------------
    /// GSUB LookupType 4 (ligature substitution) subtables reachable from the
    /// features that compose characters: `ccmp`, plus `liga`/`rlig` for faces
    /// that file the same thing differently.
    ///
    /// This is what turns a sequence into a glyph. Without it 👨‍👩‍👧 is five
    /// codepoints and comes out as three people and two invisible joiners, and
    /// 👍🏽 is a thumb followed by a colour swatch.
    pub ligatureSubtables: Vec<i64>,
    pub hasShaping: bool,
    pub legacyKernOffset: i64,
    pub legacyKernPairs: i64,
    pub hasKerning: bool,
    /// Lookups the text measurer repeats for every character and pair of every
    /// line: the cmap binary search and the GPOS pair walk (coverage tables).
    pub glyphCache: HashMap<i64,i64>,
    pub kernCache: HashMap<i64,i64>,
    /// The longest ligature starting at `start`, or 0 when there is none.
    /// `matchedLength` is left in `ligatureMatched` because Ranger has no
    /// multiple return; a caller reads it immediately after.
    pub ligatureMatched: i64,
}

impl TrueTypeFont {
    pub fn new() -> Self {
        let mut me = Self {
            fontData: vec![0u8; 0],
            pdfOut: Vec::new(),
            fontPath: String::new(),
            fontFamily: String::new(),
            fontStyle: "Regular".to_string(),
            sfntVersion: 0,
            numTables: 0,
            searchRange: 0,
            entrySelector: 0,
            rangeShift: 0,
            tables: Vec::new(),
            unitsPerEm: 1000,
            xMin: 0,
            yMin: 0,
            xMax: 0,
            yMax: 0,
            indexToLocFormat: 0,
            ascender: 0,
            descender: 0,
            lineGap: 0,
            numberOfHMetrics: 0,
            numGlyphs: 0,
            cmapFormat: 0,
            cmapOffset: 0,
            glyphWidths: Vec::new(),
            defaultWidth: 500,
            charWidths: Vec::new(),
            charWidthsLoaded: false,
            kernSubtables: Vec::new(),
            kernSubtableLookups: Vec::new(),
            pairMatched: false,
            ligatureSubtables: Vec::new(),
            hasShaping: false,
            legacyKernOffset: 0,
            legacyKernPairs: 0,
            hasKerning: false,
            glyphCache: HashMap::new(),
            kernCache: HashMap::new(),
            ligatureMatched: 0,
        };
        let mut t: Vec<Rc<RefCell<TTFTableRecord>>> = Vec::new();
        me.tables = t.clone();
        let mut gw: Vec<i64> = Vec::new();
        me.glyphWidths = gw.clone();
        let mut cw: Vec<i64> = Vec::new();
        me.charWidths = cw.clone();
        let mut ks: Vec<i64> = Vec::new();
        me.kernSubtables = ks.clone();
        let mut ksl: Vec<i64> = Vec::new();
        me.kernSubtableLookups = ksl.clone();
        let mut ls: Vec<i64> = Vec::new();
        me.ligatureSubtables = ls.clone();
        me
    }
    /// --- the font, with the tables a PDF cannot use taken out ---------------------
    ///
    /// A .ttf carries a great deal that only a layout engine wants. PDF 32000
    /// asks a `/FontFile2` for `glyf`, `head`, `hhea`, `hmtx`, `loca` and
    /// `maxp`, plus `cvt `, `fpgm` and `prep` when the glyphs are hinted, and
    /// `cmap` for a non-symbolic font. Everything else is the producer's
    /// business, and by the time a PDF is written the producer has already done
    /// its work: the kerning is baked into the text positions this writer emits,
    /// so `kern` describes adjustments nobody will apply again.
    ///
    /// It is worth being exact about the size of that, because it is not a
    /// rounding: in Open Sans Regular, `kern` is 112,182 bytes of a 217,360-byte
    /// file. More than half of every embedded copy was a table the reader would
    /// never open. With `post`, `DSIG`, `name`, `GSUB`, `GPOS`, `GDEF`, `OS/2`
    /// and `gasp` beside it, 60% of the file goes.
    ///
    /// The kept tables are copied BYTE FOR BYTE, so their checksums stay true
    /// and no glyph is touched. `head.checkSumAdjustment` covers the whole file
    /// and will no longer match, which is the one thing a subsetter cannot avoid
    /// without recomputing it; every reader treats it as advisory.
    pub fn keepsInPdf(tag: &str) -> bool {
        if tag == "glyf" {
            return true;
        }
        if tag == "head" {
            return true;
        }
        if tag == "hhea" {
            return true;
        }
        if tag == "hmtx" {
            return true;
        }
        if tag == "loca" {
            return true;
        }
        if tag == "maxp" {
            return true;
        }
        if tag == "cvt " {
            return true;
        }
        if tag == "fpgm" {
            return true;
        }
        if tag == "prep" {
            return true;
        }
        if tag == "cmap" {
            return true;
        }
        // PDF does not need these three, and they are kept anyway.
        //
        // A `/FontFile2` is read by the PDF reader's own parser, but an
        // embedded font does not always stop there — a reader that hands the
        // program to the system's font machinery, or a tool that extracts it,
        // meets a STRICTER parser. Chromium runs every face through the
        // OpenType Sanitiser, which refuses a font with no `name`, `OS/2` or
        // `post`, and refusing is what it did to the first version of this:
        // structurally perfect, every offset in range, every checksum intact,
        // and rejected.
        //
        // They cost 11,346 bytes in Open Sans against the 112,182 that `kern`
        // alone was costing, so this is not the trade it looks like. It also
        // means the stripped font can be handed to a real font engine and
        // checked, which is worth more than the bytes.
        if tag == "name" {
            return true;
        }
        if tag == "OS/2" {
            return true;
        }
        if tag == "post" {
            return true;
        }
        false
    }
    /// What a WinAnsi byte actually MEANS.
    ///
    /// The font dictionary this writer emits says `/Encoding /WinAnsiEncoding`,
    /// and WinAnsi is Latin-1 everywhere except 0x80..0x9F, where Latin-1 has
    /// control characters and Windows put the typography: the euro sign, the
    /// en and em dashes, the curly quotes, the ellipsis, the bullet, the
    /// trademark. Treating the byte as a codepoint asks the font's `cmap` for a
    /// control character, gets nothing, and drops exactly those glyphs.
    ///
    /// That is not hypothetical. The first version of this subset did treat the
    /// byte as a codepoint, and a glyph-by-glyph pixel comparison against the
    /// unmodified font came back identical for every character tested but one:
    /// the euro sign, which was simply not there. An em dash in a title would
    /// have printed as a blank.
    pub fn winAnsiToUnicode(b: i64) -> i64 {
        if b < 128 || b > 159 {
            return b;
        }
        let mut _map: Vec<i64> = vec![8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376];
        _map[(b - 128) as usize]
    }
    /// A table's checksum: the big-endian 32-bit words of it, added up with the
    /// overflow thrown away, over a length rounded up to four bytes.
    pub fn tableSum(b: &[u8], at: i64, __len: i64) -> i64 {
        let mut sum: i64 = 0;
        let mut i: i64 = 0;
        while i < __len {
            let mut w: i64 = 0;
            let mut j: i64 = 0;
            while j < 4 {
                let mut byte: i64 = 0;
                if i + j < __len {
                    byte = b[((at + i) + j) as usize] as i64;
                }
                w = w * 256 + byte;
                j += 1;
            }
            sum = (sum + w) & 4294967295;
            i += 4;
        }
        sum
    }
    /// One `loca` entry into `pdfOut`: short offsets are stored halved.
    pub fn putLoca(&mut self, dst: i64, i: i64, value: i64, format: i64) {
        if format == 0 {
            self.put16(dst + i * 2, (value as f64 / 2.0).floor() as i64);
        } else {
            self.put32(dst + i * 4, value);
        }
    }
    pub fn tagLess(a: &str, b: &str) -> bool {
        let mut i: i64 = 0;
        while i < 4 {
            let mut ca: i64 = 32;
            let mut cb: i64 = 32;
            if i < (PdfText::str_len(&a) as i64) {
                ca = PdfText::char_at(&a, i);
            }
            if i < (PdfText::str_len(&b) as i64) {
                cb = PdfText::char_at(&b, i);
            }
            if ca != cb {
                return ca < cb;
            }
            i += 1;
        }
        false
    }
    pub fn put16(&mut self, at: i64, v: i64) {
        self.pdfOut[at as usize] = ((v >> 8) & 255) as u8;
        self.pdfOut[(at + 1) as usize] = (v & 255) as u8;
    }
    pub fn put32(&mut self, at: i64, v: i64) {
        self.pdfOut[at as usize] = ((v >> 24) & 255) as u8;
        self.pdfOut[(at + 1) as usize] = ((v >> 16) & 255) as u8;
        self.pdfOut[(at + 2) as usize] = ((v >> 8) & 255) as u8;
        self.pdfOut[(at + 3) as usize] = (v & 255) as u8;
    }
    /// Is this codepoint a variation selector — VS15 (text) or VS16 (emoji)?
    ///
    /// They carry no glyph and exist only to pick a presentation. Left in the
    /// stream they break every ligature they sit inside: the rainbow flag is
    /// U+1F3F3 U+FE0F U+200D U+1F308, and the ligature is filed WITHOUT the
    /// selector, so a shaper that keeps it matches nothing and draws a white
    /// flag next to a rainbow.
    pub fn isVariationSelector(cp: i64) -> bool {
        if cp == 65038 {
            return true;
        }
        cp == 65039
    }
    /// The same font, handed in as bytes rather than found on disk. A browser
    /// has no file system and every face it draws with arrived over the network,
    /// so the only thing the loader can be given there is the bytes themselves.
    /// Everything below the read is shared, which is the point: a font parsed
    /// this way is the same font, not a second implementation of one.
    pub fn loadFromBuffer(&mut self, name: String, data: Vec<u8>) -> bool {
        self.fontPath = name.clone();
        self.fontData = data.clone();
        if self.fontData.is_empty() {
            return false;
        }
        if !self.parseOffsetTable() {
            return false;
        }
        if !self.parseTableDirectory() {
            return false;
        }
        self.parseHeadTable();
        self.parseHheaTable();
        self.parseMaxpTable();
        self.parseCmapTable();
        self.parseHmtxTable();
        self.parseNameTable();
        self.parseKerning();
        self.parseGsubLigatures();
        self.buildCharWidthCache();
        true
    }
    pub fn loadFromFile(&mut self, path: String) -> bool {
        self.fontPath = path.clone();
        // Split path into directory and filename for buffer_read_file
        let mut last_slash: i64 = -1;
        let mut i: i64 = 0;
        while i < (PdfText::str_len(&path) as i64) {
            let ch: i64 = PdfText::char_at(&path, i);
            if ch == 47 || ch == 92 {
                last_slash = i;
            }
            i += 1;
        }
        let mut dir_path: String = ".".to_string();
        let mut file_name: String = path.clone();
        if last_slash >= 0 {
            dir_path = PdfText::substr(&path, 0, last_slash);
            file_name = PdfText::substr(&path, last_slash + 1, (PdfText::str_len(&path) as i64));
        }
        // Check if file exists before trying to load
        if !PdfText::file_exists(dir_path.clone(), file_name.clone()) {
            return false;
        }
        self.fontData = PdfText::read_file(dir_path.clone(), file_name.clone());
        if self.fontData.is_empty() {
            println!("TrueTypeFont: Failed to load {}", path);
            return false;
        }
        // Parse the font
        if !self.parseOffsetTable() {
            return false;
        }
        if !self.parseTableDirectory() {
            return false;
        }
        // Parse required tables
        self.parseHeadTable();
        self.parseHheaTable();
        self.parseMaxpTable();
        self.parseCmapTable();
        self.parseHmtxTable();
        self.parseNameTable();
        self.parseKerning();
        self.parseGsubLigatures();
        // Build character width cache
        self.buildCharWidthCache();
        true
    }
    pub fn parseOffsetTable(&mut self) -> bool {
        if (self.fontData.len() as i64) < 12 {
            return false;
        }
        self.sfntVersion = self.readUInt32(0);
        self.numTables = self.readUInt16(4);
        self.searchRange = self.readUInt16(6);
        self.entrySelector = self.readUInt16(8);
        self.rangeShift = self.readUInt16(10);
        true
    }
    pub fn parseTableDirectory(&mut self) -> bool {
        let mut offset: i64 = 12;
        let mut i: i64 = 0;
        while i < self.numTables {
            let mut record: Rc<RefCell<TTFTableRecord>> = Rc::new(RefCell::new(TTFTableRecord::new()));
            record.borrow_mut().tag = self.readTag(offset);
            record.borrow_mut().checksum = self.readUInt32(offset + 4);
            record.borrow_mut().offset = self.readUInt32(offset + 8);
            record.borrow_mut().length = self.readUInt32(offset + 12);
            self.tables.push(record.clone());
            offset += 16;
            i += 1;
        }
        true
    }
    pub fn findTable(&self, tag: &str) -> Rc<RefCell<TTFTableRecord>> {
        let mut i: i64 = 0;
        while i < (self.tables.len() as i64) {
            let mut t: Rc<RefCell<TTFTableRecord>> = self.tables[i as usize].clone();
            if t.borrow().tag == tag {
                return t;
            }
            i += 1;
        }
        // Return empty record if not found
        let mut empty: Rc<RefCell<TTFTableRecord>> = Rc::new(RefCell::new(TTFTableRecord::new()));
        empty
    }
    pub fn parseHeadTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("head");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Skip version, fontRevision, checksumAdjustment, magicNumber, flags
        self.unitsPerEm = self.readUInt16(off + 18);
        // Skip created, modified dates (16 bytes)
        self.xMin = self.readInt16(off + 36);
        self.yMin = self.readInt16(off + 38);
        self.xMax = self.readInt16(off + 40);
        self.yMax = self.readInt16(off + 42);
        // Skip macStyle, lowestRecPPEM, fontDirectionHint
        self.indexToLocFormat = self.readInt16(off + 50);
    }
    pub fn parseHheaTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("hhea");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Skip version (4 bytes)
        self.ascender = self.readInt16(off + 4);
        self.descender = self.readInt16(off + 6);
        self.lineGap = self.readInt16(off + 8);
        // Skip advanceWidthMax, minLeftSideBearing, minRightSideBearing, xMaxExtent
        // Skip caretSlopeRise, caretSlopeRun, caretOffset, reserved (8 bytes)
        // Skip metricDataFormat
        self.numberOfHMetrics = self.readUInt16(off + 34);
    }
    pub fn parseMaxpTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("maxp");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Skip version (4 bytes)
        self.numGlyphs = self.readUInt16(off + 4);
    }
    pub fn parseCmapTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("cmap");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Skip version (2 bytes)
        let num_subtables: i64 = self.readUInt16(off + 2);
        // Look for Unicode BMP table (platformID=3, encodingID=1 for Windows Unicode BMP)
        // or platformID=0 for Unicode
        let mut i: i64 = 0;
        let mut subtable_offset: i64 = 0;
        let mut wide_found: bool = false;
        while i < num_subtables {
            let record_off: i64 = (off + 4) + i * 8;
            let platform_id: i64 = self.readUInt16(record_off);
            let encoding_id: i64 = self.readUInt16(record_off + 2);
            let sub_off: i64 = self.readUInt32(record_off + 4);
            // A format-4 subtable is BMP-only: it cannot map anything above
            // U+FFFF, so a face selected through it can never reach an emoji
            // however correct the rest of the pipeline is. Prefer the UCS-4
            // subtables — Windows (3,10) or Unicode (0,4) — which carry format
            // 12, and keep the BMP ones as the fallback for older faces.
            let fmt: i64 = self.readUInt16(off + sub_off);
            let mut wide_candidate: bool = false;
            if platform_id == 3 && encoding_id == 10 {
                wide_candidate = true;
            }
            if platform_id == 0 && encoding_id == 4 {
                wide_candidate = true;
            }
            if platform_id == 0 && encoding_id == 6 {
                wide_candidate = true;
            }
            if wide_candidate && fmt == 12 {
                subtable_offset = sub_off;
                wide_found = true;
            }
            if !wide_found {
                if platform_id == 3 && encoding_id == 1 {
                    subtable_offset = sub_off;
                }
                if platform_id == 0 && subtable_offset == 0 {
                    subtable_offset = sub_off;
                }
            }
            i += 1;
        }
        if subtable_offset > 0 {
            self.cmapOffset = off + subtable_offset;
            let _tmp_25 = self.readUInt16(self.cmapOffset.clone());
            self.cmapFormat = _tmp_25;
        }
    }
    pub fn parseHmtxTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("hmtx");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Read all advance widths
        let mut i: i64 = 0;
        while i < self.numberOfHMetrics {
            let advance_width: i64 = self.readUInt16(off + i * 4);
            self.glyphWidths.push(advance_width);
            i += 1;
        }
        // Remaining glyphs use the last advance width
        if self.numberOfHMetrics > 0 {
            self.defaultWidth = self.glyphWidths[(self.numberOfHMetrics - 1) as usize];
        }
    }
    pub fn parseNameTable(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("name");
        if table.borrow().offset == 0 {
            return;
        }
        let off: i64 = table.borrow().offset;
        // Skip format (2 bytes)
        let count: i64 = self.readUInt16(off + 2);
        let string_offset: i64 = self.readUInt16(off + 4);
        // Look for font family name (nameID = 1) and subfamily (nameID = 2)
        let mut i: i64 = 0;
        while i < count {
            let record_off: i64 = (off + 6) + i * 12;
            let platform_id: i64 = self.readUInt16(record_off);
            let _encoding_id: i64 = self.readUInt16(record_off + 2);
            let _language_id: i64 = self.readUInt16(record_off + 4);
            let name_id: i64 = self.readUInt16(record_off + 6);
            let length: i64 = self.readUInt16(record_off + 8);
            let str_offset: i64 = self.readUInt16(record_off + 10);
            // Get font family (nameID = 1) - prefer Windows platform (3)
            if name_id == 1 && platform_id == 3 {
                let str_off: i64 = (off + string_offset) + str_offset;
                self.fontFamily = self.readUnicodeString(str_off, length);
            }
            if (name_id == 1 && platform_id == 1) && self.fontFamily.is_empty() {
                let str_off_1: i64 = (off + string_offset) + str_offset;
                self.fontFamily = self.readAsciiString(str_off_1, length);
            }
            // Get font style (nameID = 2)
            if name_id == 2 && platform_id == 3 {
                let str_off_2: i64 = (off + string_offset) + str_offset;
                self.fontStyle = self.readUnicodeString(str_off_2, length);
            }
            if (name_id == 2 && platform_id == 1) && self.fontStyle.is_empty() {
                let str_off_3: i64 = (off + string_offset) + str_offset;
                self.fontStyle = self.readAsciiString(str_off_3, length);
            }
            i += 1;
        }
    }
    /// Is this a real, parsed face?
    ///
    /// NOT `unitsPerEm > 0`: that field is born 1000 and only a face that
    /// parsed and read a broken `head` ever drops it to zero, so an untouched
    /// TrueTypeFont — the "nothing found" answer from a lookup — passes that
    /// test and is then used as if it were a font. It is what made a missing
    /// glyph come out as .notdef drawn from a fallback that was never loaded.
    pub fn isLoaded(&self) -> bool {
        if self.numGlyphs <= 0 {
            return false;
        }
        self.cmapOffset > 0
    }
    pub fn getGlyphIndex(&mut self, char_code: i64) -> i64 {
        if self.cmapOffset == 0 {
            return 0;
        }
        let hit: Option<i64> = self.glyphCache.get(&char_code).cloned();
        if hit.is_some() {
            return hit.unwrap();
        }
        let g: i64 = self.lookupGlyphIndex(char_code);
        self.glyphCache.insert(char_code, g);
        g
    }
    pub fn lookupGlyphIndex(&self, char_code: i64) -> i64 {
        // Get glyph index for a character code using cmap
        if self.cmapOffset == 0 {
            return 0;
        }
        // Format 12: the only one that reaches past the BMP.
        if self.cmapFormat == 12 {
            return self.getGlyphIndexFormat12(char_code);
        }
        // Format 4: Segment mapping to delta values (most common for Unicode BMP)
        if self.cmapFormat == 4 {
            return self.getGlyphIndexFormat4(char_code);
        }
        // Format 0: Byte encoding table (simple, limited to 256 chars)
        if self.cmapFormat == 0 {
            if char_code >= 0 && char_code < 256 {
                return self.readUInt8((self.cmapOffset + 6) + char_code);
            }
        }
        // Format 6: Trimmed table mapping
        if self.cmapFormat == 6 {
            let first_code: i64 = self.readUInt16(self.cmapOffset + 6);
            let entry_count: i64 = self.readUInt16(self.cmapOffset + 8);
            if char_code >= first_code && char_code < first_code + entry_count {
                return self.readUInt16((self.cmapOffset + 10) + (char_code - first_code) * 2);
            }
        }
        // .notdef glyph
        0
    }
    /// Format 12: sorted groups of (startCharCode, endCharCode, startGlyphID),
    /// 12 bytes each. This is the only cmap kind that reaches past the BMP, so
    /// it is what an emoji lookup actually goes through.
    pub fn getGlyphIndexFormat12(&self, char_code: i64) -> i64 {
        let off: i64 = self.cmapOffset;
        let n_groups: i64 = self.readUInt32(off + 12);
        let mut lo: i64 = 0;
        let mut hi: i64 = n_groups - 1;
        while lo <= hi {
            let mid: i64 = (lo + hi) / 2;
            let g: i64 = (off + 16) + mid * 12;
            let start_char: i64 = self.readUInt32(g);
            let end_char: i64 = self.readUInt32(g + 4);
            if char_code < start_char {
                hi = mid - 1;
            } else {
                if char_code > end_char {
                    lo = mid + 1;
                } else {
                    let start_glyph: i64 = self.readUInt32(g + 8);
                    return start_glyph + (char_code - start_char);
                }
            }
        }
        0
    }
    pub fn getGlyphIndexFormat4(&self, char_code: i64) -> i64 {
        // Format 4 is segment-based mapping
        let off: i64 = self.cmapOffset;
        // Skip format, length (4 bytes)
        let seg_count_x2: i64 = self.readUInt16(off + 6);
        let seg_count_d: f64 = (seg_count_x2 as f64) / 2.0;
        let seg_count: i64 = seg_count_d.floor() as i64;
        // Arrays start after header (14 bytes)
        let end_codes_off: i64 = off + 14;
        // +2 for reservedPad
        let start_codes_off: i64 = (end_codes_off + seg_count_x2) + 2;
        let id_delta_off: i64 = start_codes_off + seg_count_x2;
        let id_range_offset_off: i64 = id_delta_off + seg_count_x2;
        // Binary search for segment (or linear for simplicity)
        let mut i: i64 = 0;
        while i < seg_count {
            let end_code: i64 = self.readUInt16(end_codes_off + i * 2);
            let start_code: i64 = self.readUInt16(start_codes_off + i * 2);
            if ((char_code >= start_code) && (char_code <= end_code)) {
                let id_delta: i64 = self.readInt16(id_delta_off + i * 2);
                let id_range_offset: i64 = self.readUInt16(id_range_offset_off + i * 2);
                if id_range_offset == 0 {
                    // Simple delta
                    return (char_code + id_delta) % 65536;
                } else {
                    // Use glyph ID array
                    let glyph_id_off: i64 = ((id_range_offset_off + i * 2) + id_range_offset) + (char_code - start_code) * 2;
                    let glyph_id: i64 = self.readUInt16(glyph_id_off);
                    if glyph_id != 0 {
                        return (glyph_id + id_delta) % 65536;
                    }
                }
            }
            i += 1;
        }
        0
    }
    pub fn getGlyphWidth(&self, glyph_index: i64) -> i64 {
        if glyph_index < (self.glyphWidths.len() as i64) {
            return self.glyphWidths[glyph_index as usize];
        }
        self.defaultWidth
    }
    pub fn buildCharWidthCache(&mut self) {
        // Pre-compute widths for ASCII characters (0-255)
        let mut i: i64 = 0;
        while i < 256 {
            let glyph_idx: i64 = self.getGlyphIndex(i);
            let width: i64 = self.getGlyphWidth(glyph_idx);
            self.charWidths.push(width);
            i += 1;
        }
        self.charWidthsLoaded = true;
    }
    pub fn getCharWidth(&mut self, char_code: i64) -> i64 {
        // Get width for a character in font units. The (charCode >= 0) guard is
        // essential: charAt can yield a NEGATIVE value for bytes >= 0x80 (a signed
        // char, e.g. UTF-8 lead byte 0xC3 -> -61), which passes "< 256" and would
        // index the 256-entry cache out of range (std::out_of_range on the native
        // build). Negative / >=256 codes fall through to the cmap glyph lookup.
        if (self.charWidthsLoaded && char_code >= 0) && char_code < 256 {
            return self.charWidths[char_code as usize];
        }
        let glyph_idx: i64 = self.getGlyphIndex(char_code);
        self.getGlyphWidth(glyph_idx)
    }
    pub fn getCharWidthPoints(&mut self, char_code: i64, font_size: f64) -> f64 {
        // Get character width in points
        let font_units: i64 = self.getCharWidth(char_code);
        ((font_units as f64) * font_size) / (self.unitsPerEm as f64)
    }
    pub fn measureText(&mut self, text: &str, font_size: f64) -> f64 {
        // Measure text width in points, including the kerning the face asks
        // for. Without it every run came out slightly wide — and the error is
        // not a rounding artefact: it shifts the whole line for centred and
        // right-aligned text, and display faces kern hardest.
        // Stepped by CODEPOINT. Iterating UTF-16 units charged an emoji two
        // .notdef advances instead of one glyph, so "a😀b" measured 47.53px
        // where it should have measured about 25.
        let mut width: f64 = 0.0;
        let __len: i64 = PdfText::str_len(&text) as i64;
        let mut i: i64 = 0;
        let mut prev: i64 = 0;
        let mut first: bool = true;
        while i < __len {
            let ch: i64 = EVGCodepoint::codeAt(text, i);
            let step: i64 = EVGCodepoint::unitsAt(text, i);
            width += self.getCharWidthPoints(ch, font_size);
            if !first {
                width += self.kernPoints(prev, ch, font_size);
            }
            prev = ch;
            first = false;
            i += step;
        }
        width
    }
    pub fn getAscender(&self, font_size: f64) -> f64 {
        ((self.ascender as f64) * font_size) / (self.unitsPerEm as f64)
    }
    pub fn getDescender(&self, font_size: f64) -> f64 {
        ((self.descender as f64) * font_size) / (self.unitsPerEm as f64)
    }
    pub fn getLineHeight(&self, font_size: f64) -> f64 {
        let asc: f64 = self.getAscender(font_size);
        let desc: f64 = self.getDescender(font_size);
        let gap: f64 = ((self.lineGap as f64) * font_size) / (self.unitsPerEm as f64);
        (asc - desc) + gap
    }
    /// Get font data for PDF embedding (subset or full)
    pub fn getFontData(&self) -> Vec<u8> {
        self.fontData.clone()
    }
    /// --- the glyphs a PDF will ask for, and no others -----------------------------
    ///
    /// After the unused TABLES go, `glyf` is what is left: 77,748 bytes of the
    /// 98,516 that Open Sans Regular still weighed. Almost none of it is
    /// reachable. The font dictionary this writer emits declares
    /// `/FirstChar 32 /LastChar 255 /Encoding /WinAnsiEncoding`, so a reader can
    /// ask for 224 codepoints and not one more — 192 glyphs in this face, 18,766
    /// bytes. The other 746 glyphs are Cyrillic, Greek, and every accented form
    /// the document did not use.
    ///
    /// The technique is glyph BLANKING rather than renumbering: the kept glyphs
    /// stay at their own glyph ids and the rest become zero-length entries in
    /// `loca`. Nothing has to be remapped — `cmap` still points where it pointed,
    /// `hmtx` still lists a width per glyph id, and the `/Widths` array in the
    /// PDF is untouched. A subsetter that renumbers has to rewrite all three and
    /// get every one of them right; this one cannot put a glyph in the wrong
    /// place because it never moves one.
    ///
    /// Composite glyphs are the catch. A composite is drawn from other glyphs by
    /// id — "é" is "e" plus an acute — so keeping one and blanking its parts
    /// draws nothing. The keep set is closed over components before anything is
    /// written.
    pub fn keepSet(&mut self) -> Vec<bool> {
        let mut keep: Vec<bool> = Vec::new();
        let mut i: i64 = 0;
        while i < self.numGlyphs {
            keep.push(false);
            i += 1;
        }
        // Glyph 0 is `.notdef` and is what a reader draws for anything missing.
        if self.numGlyphs > 0 {
            keep[0] = true;
        }
        let mut c: i64 = 32;
        while c < 256 {
            let cp: i64 = TrueTypeFont::winAnsiToUnicode(c);
            let g: i64 = self.getGlyphIndex(cp);
            if g > 0 && g < self.numGlyphs {
                keep[g as usize] = true;
            }
            c += 1;
        }
        // Close over composites. A component can itself be composite, so this
        // runs until nothing new is added rather than once.
        let mut again: bool = true;
        while again {
            again = false;
            let mut gi: i64 = 0;
            while gi < self.numGlyphs {
                if keep[gi as usize] {
                    let added: bool = self.addComponents(gi, &mut keep);
                    if added {
                        again = true;
                    }
                }
                gi += 1;
            }
        }
        keep
    }
    /// Marks this glyph's components, and says whether any were new.
    pub fn addComponents(&self, gid: i64, mut keep: &mut Vec<bool>) -> bool {
        let mut glyf: Rc<RefCell<TTFTableRecord>> = self.findTable("glyf");
        let start: i64 = self.glyphStart(gid);
        let end: i64 = self.glyphEnd(gid);
        if end - start < 10 {
            return false;
        }
        let at: i64 = glyf.borrow().offset + start;
        let contours: i64 = self.readInt16(at);
        if contours >= 0 {
            return false;
        }
        let mut added: bool = false;
        let mut p: i64 = at + 10;
        let mut more: bool = true;
        while more {
            let flags: i64 = self.readUInt16(p);
            let comp: i64 = self.readUInt16(p + 2);
            if comp >= 0 && comp < self.numGlyphs {
                if !(keep[comp as usize]) {
                    keep[comp as usize] = true;
                    added = true;
                }
            }
            p += 4;
            // ARG_1_AND_2_ARE_WORDS
            if (flags & 1) != 0 {
                p += 4;
            } else {
                p += 2;
            }
            // WE_HAVE_A_SCALE / X_AND_Y_SCALE / TWO_BY_TWO
            if (flags & 8) != 0 {
                p += 2;
            }
            if (flags & 64) != 0 {
                p += 4;
            }
            if (flags & 128) != 0 {
                p += 8;
            }
            // MORE_COMPONENTS
            more = (flags & 32) != 0;
            if p >= glyf.borrow().offset + end {
                more = false;
            }
        }
        added
    }
    pub fn glyphStart(&self, gid: i64) -> i64 {
        self.locaAt(gid)
    }
    pub fn glyphEnd(&self, gid: i64) -> i64 {
        self.locaAt(gid + 1)
    }
    /// `loca` is offsets into `glyf`, held as 16-bit halves or 32-bit words
    /// depending on `head.indexToLocFormat`. The short form stores offset/2,
    /// which is why every glyph in such a font begins on an even byte.
    pub fn locaAt(&self, i: i64) -> i64 {
        let mut loca: Rc<RefCell<TTFTableRecord>> = self.findTable("loca");
        if self.indexToLocFormat == 0 {
            return self.readUInt16(loca.borrow().offset + i * 2) * 2;
        }
        return self.readUInt32(loca.borrow().offset + i * 4);
    }
    /// The subset `glyf`, and the `loca` that indexes it. Kept glyphs keep their
    /// ids and their bytes; the rest become zero-length. Every glyph is padded
    /// to an even offset because the short `loca` form stores offset/2 and
    /// cannot express an odd one.
    pub fn buildGlyf(&mut self) -> Vec<i64> {
        let mut keep: Vec<bool> = self.keepSet();
        let mut total: i64 = 0;
        let mut g: i64 = 0;
        while g < self.numGlyphs {
            if keep[g as usize] {
                let __len: i64 = self.glyphEnd(g) - self.glyphStart(g);
                if __len > 0 {
                    total += __len;
                    while total % 2 != 0 {
                        total += 1;
                    }
                }
            }
            g += 1;
        }
        let mut out: Vec<i64> = Vec::new();
        out.push(total);
        let mut gi: i64 = 0;
        while gi < self.numGlyphs {
            let mut k: i64 = 0;
            if keep[gi as usize] {
                k = 1;
            }
            out.push(k);
            gi += 1;
        }
        out
    }
    pub fn pdfFontData(&mut self) -> Vec<u8> {
        let mut kept: Vec<Rc<RefCell<TTFTableRecord>>> = Vec::new();
        let mut i: i64 = 0;
        while i < (self.tables.len() as i64) {
            let mut t: Rc<RefCell<TTFTableRecord>> = self.tables[i as usize].clone();
            if TrueTypeFont::keepsInPdf(&t.borrow().tag.clone()) {
                kept.push(t.clone());
            }
            i += 1;
        }
        if kept.is_empty() {
            return self.fontData.clone();
        }
        // A table directory is sorted by tag, and a reader is entitled to
        // binary-search it. The records are already in tag order in a
        // well-formed font, but a font is not always well formed.
        let n: i64 = kept.len() as i64;
        let mut a: i64 = 0;
        while a < n {
            let mut b: i64 = a + 1;
            while b < n {
                let mut x: Rc<RefCell<TTFTableRecord>> = kept[a as usize].clone();
                let mut y: Rc<RefCell<TTFTableRecord>> = kept[b as usize].clone();
                let mut _tmp_32 = y.borrow().tag.clone();
                if TrueTypeFont::tagLess(&_tmp_32, &x.borrow().tag.clone()) {
                    kept[a as usize] = y.clone();
                    kept[b as usize] = x.clone();
                }
                b += 1;
            }
            a += 1;
        }
        // The subset glyph table, and which glyphs it holds.
        let mut plan: Vec<i64> = self.buildGlyf();
        let new_glyf_len: i64 = plan[0];
        // What each kept table will WEIGH in the output. Only `glyf` changes
        // size — `loca` keeps one entry per glyph whether the glyph is there or
        // not, which is exactly why blanking needs no renumbering.
        let mut lengths: Vec<i64> = Vec::new();
        let mut li: i64 = 0;
        while li < n {
            let mut rl: Rc<RefCell<TTFTableRecord>> = kept[li as usize].clone();
            if rl.borrow().tag == "glyf" {
                lengths.push(new_glyf_len);
            } else {
                lengths.push(rl.borrow().length);
            }
            li += 1;
        }
        let header_len: i64 = 12 + 16 * n;
        let mut offsets: Vec<i64> = Vec::new();
        let mut at: i64 = header_len;
        let mut k: i64 = 0;
        while k < n {
            offsets.push(at);
            at += lengths[k as usize];
            while at % 4 != 0 {
                at += 1;
            }
            k += 1;
        }
        let total: i64 = at;
        // Written in place through put16/put32 (a buffer field: a `&mut Vec`
        // parameter is copied in and out on every call).
        self.pdfOut = vec![0u8; (total) as usize];
        // sfnt version 1.0 for TrueType outlines.
        self.put32(0, 65536);
        self.put16(4, n);
        // searchRange / entrySelector / rangeShift: the binary-search hints.
        let mut pow2: i64 = 1;
        let mut log2: i64 = 0;
        while pow2 * 2 <= n {
            pow2 *= 2;
            log2 += 1;
        }
        self.put16(6, pow2 * 16);
        self.put16(8, log2);
        self.put16(10, n * 16 - pow2 * 16);
        let mut d: i64 = 0;
        while d < n {
            let mut rec: Rc<RefCell<TTFTableRecord>> = kept[d as usize].clone();
            let dst: i64 = offsets[d as usize];
            // unused:  let __len: i64 = lengths[d as usize];
            if rec.borrow().tag == "glyf" {
                self.writeGlyf(dst, &plan);
            } else {
                if rec.borrow().tag == "loca" {
                    self.writeLoca(dst, &plan);
                } else {
                    let src: i64 = rec.borrow().offset;
                    let mut c: i64 = 0;
                    while c < rec.borrow().length {
                        self.pdfOut[(dst + c) as usize] = (self.fontData[(src + c) as usize] as i64) as u8;
                        c += 1;
                    }
                }
            }
            d += 1;
        }
        // The directory last, because `glyf` and `loca` are rebuilt and their
        // checksums have to be computed over what was actually written. The
        // others are copied byte for byte, so recomputing them costs a pass and
        // removes a way to be subtly wrong.
        let mut e: i64 = 0;
        while e < n {
            let mut r2: Rc<RefCell<TTFTableRecord>> = kept[e as usize].clone();
            let base: i64 = 12 + 16 * e;
            let mut ti: i64 = 0;
            while ti < 4 {
                let mut ch: i64 = 32;
                if ti < (PdfText::str_len(&r2.borrow().tag) as i64) {
                    ch = PdfText::char_at(&r2.borrow().tag, ti);
                }
                self.pdfOut[(base + ti) as usize] = (ch) as u8;
                ti += 1;
            }
            let off2: i64 = offsets[e as usize];
            let len2: i64 = lengths[e as usize];
            let sum: i64 = TrueTypeFont::tableSum(&self.pdfOut, off2, len2);
            self.put32(base + 4, sum);
            self.put32(base + 8, off2);
            self.put32(base + 12, len2);
            e += 1;
        }
        let out: Vec<u8> = self.pdfOut.clone();
        self.pdfOut = Vec::new();
        out
    }
    /// `plan` is [totalGlyfBytes, keep0, keep1, …] — see `buildGlyf`.
    pub fn writeGlyf(&mut self, dst: i64, plan: &[i64]) {
        let mut w: i64 = dst;
        let mut g: i64 = 0;
        while g < self.numGlyphs {
            if plan[(g + 1) as usize] == 1 {
                let from: i64 = self.glyphStart(g);
                let to: i64 = self.glyphEnd(g);
                let __len: i64 = to - from;
                if __len > 0 {
                    let mut glyf: Rc<RefCell<TTFTableRecord>> = self.findTable("glyf");
                    let mut c: i64 = 0;
                    while c < __len {
                        self.pdfOut[(w + c) as usize] = (self.fontData[((glyf.borrow().offset + from) + c) as usize] as i64) as u8;
                        c += 1;
                    }
                    w += __len;
                    while (w - dst) % 2 != 0 {
                        self.pdfOut[w as usize] = 0;
                        w += 1;
                    }
                }
            }
            g += 1;
        }
    }
    pub fn writeLoca(&mut self, dst: i64, plan: &[i64]) {
        let mut at: i64 = 0;
        let mut g: i64 = 0;
        while g < self.numGlyphs {
            let fmt: i64 = self.indexToLocFormat;
            self.putLoca(dst, g, at, fmt);
            if plan[(g + 1) as usize] == 1 {
                let __len: i64 = self.glyphEnd(g) - self.glyphStart(g);
                if __len > 0 {
                    at += __len;
                    while at % 2 != 0 {
                        at += 1;
                    }
                }
            }
            g += 1;
        }
        let mut _tmp_36 = self.numGlyphs.clone();
        let fmt: i64 = self.indexToLocFormat;
        self.putLoca(dst, _tmp_36, at, fmt);
    }
    /// Get PostScript name for PDF
    pub fn getPostScriptName(&self) -> String {
        // Usually fontFamily with spaces removed
        let name: String = self.fontFamily.clone();
        // Simple space removal
        let mut result: String = String::new();
        let mut i: i64 = 0;
        while i < (PdfText::str_len(&name) as i64) {
            let ch: i64 = PdfText::char_at(&name, i);
            if ch != 32 {
                result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
            }
            i += 1;
        }
        if result.is_empty() {
            return "CustomFont".to_string();
        }
        result
    }
    /// ============ Binary reading helpers ============
    pub fn readUInt8(&self, offset: i64) -> i64 {
        self.fontData[offset as usize] as i64
    }
    /// ==========================================================================
    /// Kerning
    /// ==========================================================================
    /// EVG summed raw hmtx advances and never kerned, so every run came out
    /// slightly wide — measurably so for display faces, and visibly so for
    /// centred or right-aligned text, where the error shifts the whole line.
    ///
    /// Modern faces put kerning in GPOS as a `kern` feature over pair-adjustment
    /// lookups; older ones use the legacy `kern` table. Both are read here.
    pub fn parseKerning(&mut self) {
        let mut gpos: Rc<RefCell<TTFTableRecord>> = self.findTable("GPOS");
        if gpos.borrow().offset > 0 {
            // A face with GPOS is positioned by GPOS alone. If it declares no
            // `kern` feature there, it does not kern — even when it also ships
            // a legacy `kern` table, which several do for old software.
            //
            // Open Sans is exactly that font: GPOS with no kern feature, plus
            // 18694 legacy pairs. Falling back to those made EVG kern a run the
            // browser leaves alone, which the parity snapshot caught at once.
            self.parseGposKernFeature(gpos.borrow().offset.clone());
            if !self.kernSubtables.is_empty() {
                self.hasKerning = true;
            }
            return;
        }
        let mut kt: Rc<RefCell<TTFTableRecord>> = self.findTable("kern");
        if kt.borrow().offset > 0 {
            self.parseLegacyKern(kt.borrow().offset.clone());
        }
    }
    /// Collect every pair-adjustment subtable the `kern` feature points at.
    pub fn parseGposKernFeature(&mut self, gpos_off: i64) {
        let feature_list_off: i64 = gpos_off + self.readUInt16(gpos_off + 6);
        let lookup_list_off: i64 = gpos_off + self.readUInt16(gpos_off + 8);
        let feature_count: i64 = self.readUInt16(feature_list_off);
        let lookup_count: i64 = self.readUInt16(lookup_list_off);
        let mut f: i64 = 0;
        while f < feature_count {
            let rec_off: i64 = (feature_list_off + 2) + f * 6;
            let tag: String = self.readTag(rec_off);
            if tag == "kern" {
                let feat_off: i64 = feature_list_off + self.readUInt16(rec_off + 4);
                let idx_count: i64 = self.readUInt16(feat_off + 2);
                let mut li: i64 = 0;
                while li < idx_count {
                    let lookup_index: i64 = self.readUInt16((feat_off + 4) + li * 2);
                    if lookup_index < lookup_count {
                        let lookup_off: i64 = lookup_list_off + self.readUInt16((lookup_list_off + 2) + lookup_index * 2);
                        self.collectPairLookup(lookup_off, lookup_index);
                    }
                    li += 1;
                }
            }
            f += 1;
        }
    }
    /// LookupType 2 is pair adjustment. Type 9 is an Extension wrapper, which a
    /// large face uses to reach past the 64K offset limit — unwrap it or the
    /// kerning of exactly the fonts that need it most is invisible.
    pub fn collectPairLookup(&mut self, lookup_off: i64, lookup_index: i64) {
        let lookup_type: i64 = self.readUInt16(lookup_off);
        let sub_count: i64 = self.readUInt16(lookup_off + 4);
        let mut i: i64 = 0;
        while i < sub_count {
            let sub_off: i64 = lookup_off + self.readUInt16((lookup_off + 6) + i * 2);
            if lookup_type == 2 {
                self.kernSubtables.push(sub_off);
                self.kernSubtableLookups.push(lookup_index);
            }
            if lookup_type == 9 {
                let ext_type: i64 = self.readUInt16(sub_off + 2);
                if ext_type == 2 {
                    self.kernSubtables.push(sub_off + self.readUInt32(sub_off + 4));
                    self.kernSubtableLookups.push(lookup_index);
                }
            }
            i += 1;
        }
    }
    /// ---- Shaping ----------------------------------------------------------
    ///
    /// Collect the GSUB ligature subtables that turn a sequence of codepoints
    /// into one glyph. Only LookupType 4, and only from the composing features:
    /// that is what emoji sequences are filed under, and it keeps this from
    /// quietly applying discretionary Latin ligatures nobody asked for.
    pub fn parseGsubLigatures(&mut self) {
        let mut table: Rc<RefCell<TTFTableRecord>> = self.findTable("GSUB");
        if table.borrow().offset == 0 {
            return;
        }
        let gsub_off: i64 = table.borrow().offset;
        let feature_list_off: i64 = gsub_off + self.readUInt16(gsub_off + 6);
        let lookup_list_off: i64 = gsub_off + self.readUInt16(gsub_off + 8);
        let feature_count: i64 = self.readUInt16(feature_list_off);
        let lookup_count: i64 = self.readUInt16(lookup_list_off);
        let mut f: i64 = 0;
        while f < feature_count {
            let rec_off: i64 = (feature_list_off + 2) + f * 6;
            let tag: String = self.readTag(rec_off);
            let mut wanted: bool = false;
            if tag == "ccmp" {
                wanted = true;
            }
            if tag == "liga" {
                wanted = true;
            }
            if tag == "rlig" {
                wanted = true;
            }
            if wanted {
                let feat_off: i64 = feature_list_off + self.readUInt16(rec_off + 4);
                let idx_count: i64 = self.readUInt16(feat_off + 2);
                let mut li: i64 = 0;
                while li < idx_count {
                    let lookup_index: i64 = self.readUInt16((feat_off + 4) + li * 2);
                    if lookup_index < lookup_count {
                        let lookup_off: i64 = lookup_list_off + self.readUInt16((lookup_list_off + 2) + lookup_index * 2);
                        self.collectLigatureLookup(lookup_off);
                    }
                    li += 1;
                }
            }
            f += 1;
        }
        if !self.ligatureSubtables.is_empty() {
            self.hasShaping = true;
        }
    }
    /// LookupType 4 is ligature substitution. Type 7 is an Extension wrapper,
    /// used by any face large enough to run out of 16-bit offsets — which an
    /// emoji face certainly is, so unwrapping it is not an edge case here.
    pub fn collectLigatureLookup(&mut self, lookup_off: i64) {
        let lookup_type: i64 = self.readUInt16(lookup_off);
        let sub_count: i64 = self.readUInt16(lookup_off + 4);
        let mut i: i64 = 0;
        while i < sub_count {
            let sub_off: i64 = lookup_off + self.readUInt16((lookup_off + 6) + i * 2);
            if lookup_type == 4 {
                self.ligatureSubtables.push(sub_off);
            }
            if lookup_type == 7 {
                let ext_type: i64 = self.readUInt16(sub_off + 2);
                if ext_type == 4 {
                    self.ligatureSubtables.push(sub_off + self.readUInt32(sub_off + 4));
                }
            }
            i += 1;
        }
    }
    pub fn ligatureAt(&mut self, gids: &[i64], start: i64) -> i64 {
        self.ligatureMatched = 0;
        let mut best: i64 = 0;
        let mut best_len: i64 = 0;
        let first: i64 = gids[start as usize];
        let remaining: i64 = (gids.len() as i64) - start;
        let mut s: i64 = 0;
        while s < (self.ligatureSubtables.len() as i64) {
            let sub: i64 = self.ligatureSubtables[s as usize];
            let cov: i64 = sub + self.readUInt16(sub + 2);
            let ci: i64 = self.coverageIndex(cov, first);
            if ci >= 0 {
                let set_count: i64 = self.readUInt16(sub + 4);
                if ci < set_count {
                    let set_off: i64 = sub + self.readUInt16((sub + 6) + ci * 2);
                    let lig_count: i64 = self.readUInt16(set_off);
                    let mut l: i64 = 0;
                    while l < lig_count {
                        let lig: i64 = set_off + self.readUInt16((set_off + 2) + l * 2);
                        let lig_glyph: i64 = self.readUInt16(lig);
                        let comp_count: i64 = self.readUInt16(lig + 2);
                        if comp_count <= remaining {
                            let mut ok: bool = true;
                            let mut c: i64 = 1;
                            while c < comp_count {
                                if self.readUInt16((lig + 2) + c * 2) != gids[(start + c) as usize] {
                                    ok = false;
                                    c = comp_count;
                                } else {
                                    c += 1;
                                }
                            }
                            if ok {
                                if comp_count > best_len {
                                    best = lig_glyph;
                                    best_len = comp_count;
                                }
                            }
                        }
                        l += 1;
                    }
                }
            }
            s += 1;
        }
        self.ligatureMatched = best_len;
        best
    }
    /// Codepoints in, glyphs out, with each glyph remembering which codepoints
    /// it came from.
    ///
    /// Two passes and no more: drop the variation selectors, then repeatedly
    /// take the longest ligature. That is not a general OpenType shaper — it
    /// runs no contextual lookups and does no reordering — but it is exactly
    /// what emoji sequences need, and it is applied only to a run already known
    /// to belong to one face, so it can never disturb ordinary text.
    pub fn shape(&mut self, cps: &[i64]) -> Rc<RefCell<TTFShapedRun>> {
        let mut run: Rc<RefCell<TTFShapedRun>> = Rc::new(RefCell::new(TTFShapedRun::new()));
        // Filtered codepoints, and where each came from in the input.
        let mut kept: Vec<i64> = Vec::new();
        let mut kept_index: Vec<i64> = Vec::new();
        let mut i: i64 = 0;
        while i < (cps.len() as i64) {
            let cp: i64 = cps[i as usize];
            if !TrueTypeFont::isVariationSelector(cp) {
                kept.push(cp);
                kept_index.push(i);
            }
            i += 1;
        }
        let mut gids: Vec<i64> = Vec::new();
        let mut k: i64 = 0;
        while k < (kept.len() as i64) {
            gids.push(self.getGlyphIndex(kept[k as usize]));
            k += 1;
        }
        let n: i64 = gids.len() as i64;
        let mut p: i64 = 0;
        while p < n {
            let mut glyph: i64 = gids[p as usize];
            let mut consumed: i64 = 1;
            if self.hasShaping {
                let lig: i64 = self.ligatureAt(&gids, p);
                if self.ligatureMatched > 1 {
                    glyph = lig;
                    consumed = self.ligatureMatched;
                }
            }
            run.borrow_mut().glyphs.push(glyph);
            // The cluster runs to the start of the NEXT kept codepoint, so a
            // variation selector swallowed by the filter still belongs to the
            // cluster it was written inside.
            run.borrow_mut().clusterStart.push(kept_index[p as usize]);
            let mut end_idx: i64 = cps.len() as i64;
            if p + consumed < n {
                end_idx = kept_index[(p + consumed) as usize];
            }
            run.borrow_mut().clusterEnd.push(end_idx);
            p += consumed;
        }
        run
    }
    /// Same, straight from a string.
    pub fn shapeString(&mut self, text: &str) -> Rc<RefCell<TTFShapedRun>> {
        self.shape(&EVGCodepoint::toArray(text))
    }
    /// Shape one slice of a codepoint array — a single grapheme cluster, in
    /// practice, so a ligature can never reach across the boundary the cluster
    /// rules drew.
    pub fn shapeRange(&mut self, cps: &[i64], start: i64, end: i64) -> Rc<RefCell<TTFShapedRun>> {
        let mut slice: Vec<i64> = Vec::new();
        let mut i: i64 = start;
        while i < end {
            slice.push(cps[i as usize]);
            i += 1;
        }
        self.shape(&slice)
    }
    /// The width of a whole string as this face will SHAPE it, cluster by
    /// cluster — the same walk the encoder does, so what a segment measures and
    /// what it draws cannot part company.
    ///
    /// Measuring an emoji segment through the ordinary per-codepoint path
    /// charged a joined family five advances and drew one, which pushed
    /// everything after it on the line to the right.
    pub fn measureShapedText(&mut self, text: &str, font_size: f64) -> f64 {
        let mut cps: Vec<i64> = EVGCodepoint::toArray(text);
        let n: i64 = cps.len() as i64;
        let mut total: f64 = 0.0;
        let mut i: i64 = 0;
        while i < n {
            let end: i64 = EVGGrapheme::clusterEnd(&cps, i);
            total += self.measureShapedRange(&cps, i, end, font_size);
            i = end;
        }
        total
    }
    pub fn measureShapedRange(&mut self, cps: &[i64], start: i64, end: i64, font_size: f64) -> f64 {
        let mut run: Rc<RefCell<TTFShapedRun>> = self.shapeRange(cps, start, end);
        let scale: f64 = font_size / (self.unitsPerEm as f64);
        let mut total: f64 = 0.0;
        let mut i: i64 = 0;
        while i < (run.borrow().glyphs.len() as i64) {
            total += ((self.getGlyphWidth(run.borrow().glyphs[i as usize])) as f64) * scale;
            i += 1;
        }
        total
    }
    /// The advance of a shaped run, in points. One glyph per cluster means a
    /// five-codepoint family is charged one width, not five.
    pub fn measureShaped(&mut self, text: &str, font_size: f64) -> f64 {
        let mut run: Rc<RefCell<TTFShapedRun>> = self.shapeString(text);
        let scale: f64 = font_size / (self.unitsPerEm as f64);
        let mut total: f64 = 0.0;
        let mut i: i64 = 0;
        while i < (run.borrow().glyphs.len() as i64) {
            total += ((self.getGlyphWidth(run.borrow().glyphs[i as usize])) as f64) * scale;
            i += 1;
        }
        total
    }
    pub fn parseLegacyKern(&mut self, kern_off: i64) {
        let n_tables: i64 = self.readUInt16(kern_off + 2);
        if n_tables < 1 {
            return;
        }
        // Only the first horizontal format-0 subtable is used, which is what
        // every face that still ships this table actually has.
        let sub: i64 = kern_off + 4;
        let coverage: i64 = self.readUInt16(sub + 4);
        let format: i64 = (coverage as f64 / 256.0).floor() as i64;
        let horizontal: bool = coverage % 2 == 1;
        if format == 0 && horizontal {
            self.legacyKernPairs = self.readUInt16(sub + 6);
            self.legacyKernOffset = sub + 14;
            if self.legacyKernPairs > 0 {
                self.hasKerning = true;
            }
        }
    }
    /// Kerning between two glyphs, in font units. 0 when the pair does not kern.
    pub fn kernAdvance(&mut self, left_glyph: i64, right_glyph: i64) -> i64 {
        if !self.hasKerning {
            return 0;
        }
        // glyph ids are 16-bit
        let key: i64 = left_glyph * 65536 + right_glyph;
        let hit: Option<i64> = self.kernCache.get(&key).cloned();
        if hit.is_some() {
            return hit.unwrap();
        }
        let k: i64 = self.lookupKernAdvance(left_glyph, right_glyph);
        self.kernCache.insert(key, k);
        k
    }
    pub fn lookupKernAdvance(&mut self, left_glyph: i64, right_glyph: i64) -> i64 {
        if self.legacyKernOffset > 0 {
            return self.legacyKernAdvance(left_glyph, right_glyph);
        }
        let mut total: i64 = 0;
        // -1 is "no lookup satisfied yet"; a real lookup index is >= 0.
        let mut satisfied: i64 = 0 - 1;
        let mut i: i64 = 0;
        while i < (self.kernSubtables.len() as i64) {
            let lk: i64 = self.kernSubtableLookups[i as usize];
            if lk != satisfied {
                let adj: i64 = self.pairAdvance(self.kernSubtables[i as usize],
                    left_glyph,
                    right_glyph
                );
                if self.pairMatched {
                    total += adj;
                    satisfied = lk;
                }
            }
            i += 1;
        }
        total
    }
    pub fn pairAdvance(&mut self, st: i64, left_glyph: i64, right_glyph: i64) -> i64 {
        self.pairMatched = false;
        let pos_format: i64 = self.readUInt16(st);
        let coverage_off: i64 = st + self.readUInt16(st + 2);
        let value_format1: i64 = self.readUInt16(st + 4);
        let value_format2: i64 = self.readUInt16(st + 6);
        // Coverage gates which glyphs may start a pair, in both formats.
        let cov_index: i64 = self.coverageIndex(coverage_off, left_glyph);
        if cov_index < 0 {
            return 0;
        }
        let v1_size: i64 = self.valueRecordSize(value_format1);
        let v2_size: i64 = self.valueRecordSize(value_format2);
        if pos_format == 1 {
            let pair_set_off: i64 = st + self.readUInt16((st + 10) + cov_index * 2);
            let pair_count: i64 = self.readUInt16(pair_set_off);
            let rec_size: i64 = (2 + v1_size) + v2_size;
            // PairValueRecords are sorted by glyph id.
            let mut lo: i64 = 0;
            let mut hi: i64 = pair_count - 1;
            while lo <= hi {
                let mid: i64 = (lo + hi) / 2;
                let rec_off: i64 = (pair_set_off + 2) + mid * rec_size;
                let second: i64 = self.readUInt16(rec_off);
                if second == right_glyph {
                    self.pairMatched = true;
                    return self.valueXAdvance(rec_off + 2, value_format1);
                }
                if second < right_glyph {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
            return 0;
        }
        if pos_format == 2 {
            let class_def1: i64 = st + self.readUInt16(st + 8);
            let class_def2: i64 = st + self.readUInt16(st + 10);
            let class2_count: i64 = self.readUInt16(st + 14);
            let c1: i64 = self.glyphClass(class_def1, left_glyph);
            let c2: i64 = self.glyphClass(class_def2, right_glyph);
            let rec_size_1: i64 = v1_size + v2_size;
            let rec_off_1: i64 = (st + 16) + (c1 * class2_count + c2) * rec_size_1;
            // A class-based subtable covers every pair whose left glyph is in
            // its coverage — class 0 is the catch-all — so reaching here is a
            // match even when the adjustment is zero.
            self.pairMatched = true;
            return self.valueXAdvance(rec_off_1, value_format1);
        }
        0
    }
    /// A ValueRecord holds one int16 per set bit of its format.
    pub fn valueRecordSize(&self, format: i64) -> i64 {
        let mut size: i64 = 0;
        let mut bit: i64 = 0;
        while bit < 8 {
            let mask: i64 = self.powTwo(bit);
            if self.hasBit(format, mask) {
                size += 2;
            }
            bit += 1;
        }
        size
    }
    /// X_ADVANCE is 0x0004, the third field. Its offset is two bytes for each of
    /// X_PLACEMENT and Y_PLACEMENT that happens to be present.
    pub fn valueXAdvance(&self, rec_off: i64, format: i64) -> i64 {
        if !self.hasBit(format, 4) {
            return 0;
        }
        let mut off: i64 = rec_off;
        if self.hasBit(format, 1) {
            off += 2;
        }
        if self.hasBit(format, 2) {
            off += 2;
        }
        self.readInt16(off)
    }
    pub fn powTwo(&self, n: i64) -> i64 {
        let mut v: i64 = 1;
        let mut i: i64 = 0;
        while i < n {
            v *= 2;
            i += 1;
        }
        v
    }
    pub fn hasBit(&self, value: i64, mask: i64) -> bool {
        ((value as f64 / mask as f64).floor() as i64) % 2 == 1
    }
    /// Position of a glyph within a Coverage table, or -1 if absent.
    pub fn coverageIndex(&self, cov: i64, glyph: i64) -> i64 {
        let format: i64 = self.readUInt16(cov);
        if format == 1 {
            let count: i64 = self.readUInt16(cov + 2);
            let mut lo: i64 = 0;
            let mut hi: i64 = count - 1;
            while lo <= hi {
                let mid: i64 = (lo + hi) / 2;
                let g: i64 = self.readUInt16((cov + 4) + mid * 2);
                if g == glyph {
                    return mid;
                }
                if g < glyph {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
            return 0 - 1;
        }
        if format == 2 {
            let range_count: i64 = self.readUInt16(cov + 2);
            let mut lo2: i64 = 0;
            let mut hi2: i64 = range_count - 1;
            while lo2 <= hi2 {
                let mid2: i64 = (lo2 + hi2) / 2;
                let rec: i64 = (cov + 4) + mid2 * 6;
                let start: i64 = self.readUInt16(rec);
                let end: i64 = self.readUInt16(rec + 2);
                if glyph < start {
                    hi2 = mid2 - 1;
                } else {
                    if glyph > end {
                        lo2 = mid2 + 1;
                    } else {
                        return self.readUInt16(rec + 4) + (glyph - start);
                    }
                }
            }
            return 0 - 1;
        }
        0 - 1
    }
    /// Class of a glyph in a ClassDef table. Anything not listed is class 0.
    pub fn glyphClass(&self, cd: i64, glyph: i64) -> i64 {
        let format: i64 = self.readUInt16(cd);
        if format == 1 {
            let start_glyph: i64 = self.readUInt16(cd + 2);
            let count: i64 = self.readUInt16(cd + 4);
            if glyph < start_glyph {
                return 0;
            }
            if glyph >= start_glyph + count {
                return 0;
            }
            return self.readUInt16((cd + 6) + (glyph - start_glyph) * 2);
        }
        if format == 2 {
            let range_count: i64 = self.readUInt16(cd + 2);
            let mut lo: i64 = 0;
            let mut hi: i64 = range_count - 1;
            while lo <= hi {
                let mid: i64 = (lo + hi) / 2;
                let rec: i64 = (cd + 4) + mid * 6;
                let start: i64 = self.readUInt16(rec);
                let end: i64 = self.readUInt16(rec + 2);
                if glyph < start {
                    hi = mid - 1;
                } else {
                    if glyph > end {
                        lo = mid + 1;
                    } else {
                        return self.readUInt16(rec + 4);
                    }
                }
            }
            return 0;
        }
        0
    }
    pub fn legacyKernAdvance(&self, left_glyph: i64, right_glyph: i64) -> i64 {
        let mut lo: i64 = 0;
        let mut hi: i64 = self.legacyKernPairs - 1;
        while lo <= hi {
            let mid: i64 = (lo + hi) / 2;
            let rec: i64 = self.legacyKernOffset + mid * 6;
            let l: i64 = self.readUInt16(rec);
            let r: i64 = self.readUInt16(rec + 2);
            if l == left_glyph {
                if r == right_glyph {
                    return self.readInt16(rec + 4);
                }
            }
            // Pairs are sorted by the combined (left, right) key.
            let key: i64 = l * 65536 + r;
            let want: i64 = left_glyph * 65536 + right_glyph;
            if key < want {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        0
    }
    /// Kerning between two characters, in font units.
    pub fn kernUnits(&mut self, left_char: i64, right_char: i64) -> i64 {
        if !self.hasKerning {
            return 0;
        }
        let lg: i64 = self.getGlyphIndex(left_char);
        let rg: i64 = self.getGlyphIndex(right_char);
        if lg == 0 || rg == 0 {
            return 0;
        }
        self.kernAdvance(lg, rg)
    }
    /// Kerning between two characters, in points.
    pub fn kernPoints(&mut self, left_char: i64, right_char: i64, font_size: f64) -> f64 {
        if !self.hasKerning {
            return 0.0;
        }
        let lg: i64 = self.getGlyphIndex(left_char);
        let rg: i64 = self.getGlyphIndex(right_char);
        if lg == 0 || rg == 0 {
            return 0.0;
        }
        let units: i64 = self.kernAdvance(lg, rg);
        if units == 0 {
            return 0.0;
        }
        ((units as f64) * font_size) / (self.unitsPerEm as f64)
    }
    pub fn readUInt16(&self, offset: i64) -> i64 {
        // Big-endian
        let b1: i64 = self.fontData[offset as usize] as i64;
        let b2: i64 = self.fontData[(offset + 1) as usize] as i64;
        b1 * 256 + b2
    }
    pub fn readInt16(&self, offset: i64) -> i64 {
        let val: i64 = self.readUInt16(offset);
        if val >= 32768 {
            return val - 65536;
        }
        val
    }
    pub fn readUInt32(&self, offset: i64) -> i64 {
        // Big-endian
        let b1: i64 = self.fontData[offset as usize] as i64;
        let b2: i64 = self.fontData[(offset + 1) as usize] as i64;
        let b3: i64 = self.fontData[(offset + 2) as usize] as i64;
        let b4: i64 = self.fontData[(offset + 3) as usize] as i64;
        let result: i64 = ((b1 * 256 + b2) * 256 + b3) * 256 + b4;
        result
    }
    pub fn readTag(&self, offset: i64) -> String {
        let mut result: String = String::new();
        let mut i: i64 = 0;
        while i < 4 {
            let ch: i64 = self.fontData[(offset + i) as usize] as i64;
            result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
            i += 1;
        }
        result
    }
    pub fn readAsciiString(&self, offset: i64, length: i64) -> String {
        let mut result: String = String::new();
        let mut i: i64 = 0;
        while i < length {
            let ch: i64 = self.fontData[(offset + i) as usize] as i64;
            if ch > 0 {
                result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
            }
            i += 1;
        }
        result
    }
    pub fn readUnicodeString(&self, offset: i64, length: i64) -> String {
        // UTF-16BE string
        let mut result: String = String::new();
        let mut i: i64 = 0;
        while i < length {
            let ch: i64 = self.readUInt16(offset + i);
            if ch > 0 && ch < 128 {
                result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
            }
            i += 2;
        }
        result
    }
    /// Debug: print font info
    pub fn printInfo(&self) {
        println!("Font: {} {}", self.fontFamily, self.fontStyle);
        println!("  Units per EM: {}", self.unitsPerEm);
        println!("  Ascender: {}", self.ascender);
        println!("  Descender: {}", self.descender);
        println!("  Line gap: {}", self.lineGap);
        println!("  Num glyphs: {}", self.numGlyphs);
        println!("  Num hMetrics: {}", self.numberOfHMetrics);
        println!("  Tables: {}", self.tables.len() as i64);
    }
}
