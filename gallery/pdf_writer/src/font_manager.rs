// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::rgr::PdfText;
use crate::true_type_font::TrueTypeFont;
use crate::rgr::{EVGCodepoint, EVGGrapheme, EVGTextMeasurer};

/// FontManager.rgr - Manage loaded fonts and provide text measurement
///
/// Usage:
///   def fm (new FontManager())
///   fm.setFontsDirectory("./Fonts")
///   fm.loadFont("Open_Sans/OpenSans-Regular.ttf")
///   def width:double (fm.measureText("Hello" "Open Sans" 14.0))
#[derive(Clone)]
pub struct FontManager {
    pub fonts: Vec<Rc<RefCell<TrueTypeFont>>>,
    pub fontNames: Vec<String>,
    pub fontsDirectory: String,
    /// Multiple search directories
    pub fontsDirectories: Vec<String>,
    /// The directory a face was actually loaded from. Several candidates are
    /// tried, and anything that needs to point at the font FILES — the HTML
    /// renderer's @font-face rules, for one — has to know which one won rather
    /// than guess a path of its own.
    pub resolvedDirectory: String,
    pub defaultFont: Rc<RefCell<TrueTypeFont>>,
    pub hasDefaultFont: bool,
    /// getFont and measureText answers, for the fonts loaded so far: a layout
    /// asks the same family and the same words many times over. Cleared when
    /// the number of loaded faces changes.
    pub familyCache: HashMap<String,Rc<RefCell<TrueTypeFont>>>,
    pub hasCache: HashMap<String,bool>,
    pub widthCache: HashMap<String,f64>,
    pub widthCacheSize: i64,
    pub cachedFontCount: i64,
}

impl FontManager {
    pub fn new() -> Self {
        let mut me = Self {
            fonts: Vec::new(),
            fontNames: Vec::new(),
            fontsDirectory: "./Fonts".to_string(),
            fontsDirectories: Vec::new(),
            resolvedDirectory: String::new(),
            defaultFont: Rc::new(RefCell::new(TrueTypeFont::new())),
            hasDefaultFont: false,
            familyCache: HashMap::new(),
            hasCache: HashMap::new(),
            widthCache: HashMap::new(),
            widthCacheSize: 0,
            cachedFontCount: 0,
        };
        let mut f: Vec<Rc<RefCell<TrueTypeFont>>> = Vec::new();
        me.fonts = f.clone();
        let mut n: Vec<String> = Vec::new();
        me.fontNames = n.clone();
        let mut fd: Vec<String> = Vec::new();
        me.fontsDirectories = fd.clone();
        me
    }
    pub fn isRegularStyle(style: &str) -> bool {
        (style.is_empty() || style == "Regular") || (style == "Normal" || style == "Book")
    }
    /// Can this face draw every codepoint of a cluster?
    ///
    /// Variation selectors and the joiner are skipped: they are instructions,
    /// not characters, the shaper drops them before any glyph is looked up, and
    /// a face that ligates the sequence perfectly well may still not list them.
    pub fn coversCluster(f: &Rc<RefCell<TrueTypeFont>>, cps: &[i64], start: i64, end: i64) -> bool {
        let mut i: i64 = start;
        while i < end {
            let cp: i64 = cps[i as usize];
            let mut skip: bool = EVGGrapheme::isZWJ(cp);
            if (cp >= 65024 && cp <= 65039) {
                skip = true;
            }
            if !skip {
                if f.borrow_mut().getGlyphIndex(cp) == 0 {
                    return false;
                }
            }
            i += 1;
        }
        true
    }
    pub fn setFontsDirectory(&mut self, path: String) {
        self.fontsDirectory = path.clone();
    }
    /// Returns the number of fonts that have been successfully loaded
    pub fn getFontCount(&self) -> i64 {
        self.fonts.len() as i64
    }
    /// Add a directory to search for fonts
    pub fn addFontsDirectory(&mut self, path: &str) {
        self.fontsDirectories.push(path.to_string());
    }
    /// Set multiple directories from semicolon-separated string
    /// Example: "./Fonts;./assets/fonts;/usr/share/fonts"
    pub fn setFontsDirectories(&mut self, paths: &str) {
        // Split by semicolon
        let mut start: i64 = 0;
        let mut i: i64 = 0;
        let __len: i64 = PdfText::str_len(&paths) as i64;
        while i <= __len {
            let mut ch: String = String::new();
            if i < __len {
                ch = PdfText::substr(&paths, i, i + 1);
            }
            if ch == ";" || i == __len {
                if i > start {
                    let part: String = PdfText::substr(&paths, start, i);
                    self.fontsDirectories.push(part.clone());
                    println!("FontManager: Added fonts directory: {}", part);
                }
                start = i + 1;
            }
            i += 1;
        }
        // Set first as primary
        if !self.fontsDirectories.is_empty() {
            self.fontsDirectory = self.fontsDirectories[0].clone();
        }
    }
    /// Register a face from bytes the host supplies. Same bookkeeping as
    /// loadFont — the first face loaded becomes the default — so a manager
    /// filled this way behaves exactly like one that read a directory.
    pub fn addFontBuffer(&mut self, name: &str, data: &[u8]) -> bool {
        let mut font: Rc<RefCell<TrueTypeFont>> = Rc::new(RefCell::new(TrueTypeFont::new()));
        if !font.borrow_mut().loadFromBuffer(name.to_string(), data) {
            return false;
        }
        self.fonts.push(font.clone());
        self.fontNames.push(font.borrow().fontFamily.clone());
        if !self.hasDefaultFont {
            self.defaultFont = font.clone();
            self.hasDefaultFont = true;
        }
        true
    }
    pub fn loadFont(&mut self, relative_path: &str) -> bool {
        // Try each directory in order
        let mut i: i64 = 0;
        while i < (self.fontsDirectories.len() as i64) {
            let dir: String = self.fontsDirectories[i as usize].clone();
            let full_path: String = format!("{}/{}", dir, relative_path);
            let mut font: Rc<RefCell<TrueTypeFont>> = Rc::new(RefCell::new(TrueTypeFont::new()));
            if (font.borrow_mut().loadFromFile(full_path.clone())) {
                self.fonts.push(font.clone());
                self.fontNames.push(font.borrow().fontFamily.clone());
                if self.resolvedDirectory.is_empty() {
                    self.resolvedDirectory = dir.clone();
                }
                if !self.hasDefaultFont {
                    self.defaultFont = font.clone();
                    self.hasDefaultFont = true;
                }
                println!("FontManager: Loaded font '{}' ({}) from {}", font.borrow().fontFamily, font.borrow().fontStyle, full_path);
                return true;
            }
            i += 1;
        }
        // Fallback to single fontsDirectory for backward compatibility
        // Check if fontsDirectory ends with "/" to avoid double slash
        let mut separator: String = "/";
        let dir_len: i64 = PdfText::str_len(&self.fontsDirectory) as i64;
        if dir_len > 0 {
            let last_char: String = PdfText::substr(&self.fontsDirectory, dir_len - 1, dir_len);
            if last_char == "/" {
                separator = "";
            }
        }
        let full_path_1: String = format!("{}{}{}", self.fontsDirectory, separator, relative_path);
        println!("FontManager: Trying to load font from: {}", full_path_1);
        let mut font_1: Rc<RefCell<TrueTypeFont>> = Rc::new(RefCell::new(TrueTypeFont::new()));
        if !font_1.borrow_mut().loadFromFile(full_path_1.clone()) {
            println!("FontManager: Failed to load font: {} (full path: {})", relative_path, full_path_1);
            return false;
        }
        self.fonts.push(font_1.clone());
        self.fontNames.push(font_1.borrow().fontFamily.clone());
        // First loaded font becomes default
        if !self.hasDefaultFont {
            self.defaultFont = font_1.clone();
            self.hasDefaultFont = true;
        }
        println!("FontManager: Loaded font '{}' ({})", font_1.borrow().fontFamily, font_1.borrow().fontStyle);
        true
    }
    /// A face from bytes rather than from a path. The browser build has no file
    /// system: it fetches the .ttf and hands the ArrayBuffer straight in, and
    /// everything past the read is the same code the file path runs.
    pub fn loadFontBuffer(&mut self, name: &str, data: &[u8]) -> bool {
        let mut font: Rc<RefCell<TrueTypeFont>> = Rc::new(RefCell::new(TrueTypeFont::new()));
        if !font.borrow_mut().loadFromBuffer(name.to_string(), data) {
            return false;
        }
        self.fonts.push(font.clone());
        self.fontNames.push(font.borrow().fontFamily.clone());
        if !self.hasDefaultFont {
            self.defaultFont = font.clone();
            self.hasDefaultFont = true;
        }
        true
    }
    pub fn loadFontFamily(&mut self, family_dir: &str) {
        // Load common variants from a font family directory
        // e.g., loadFontFamily("Open_Sans") loads Regular, Bold, Italic, BoldItalic
        self.loadFont(&format!("{}/{}-Regular.ttf", family_dir, family_dir));
        // Try common naming patterns
        // OpenSans-Regular.ttf, Roboto-Regular.ttf, etc.
    }
    pub fn checkCaches(&mut self) {
        if (self.fonts.len() as i64) != self.cachedFontCount {
            let mut fc: HashMap<String,Rc<RefCell<TrueTypeFont>>> = HashMap::new();
            self.familyCache = fc.clone();
            let mut hc: HashMap<String,bool> = HashMap::new();
            self.hasCache = hc.clone();
            let mut wc: HashMap<String,f64> = HashMap::new();
            self.widthCache = wc.clone();
            self.widthCacheSize = 0;
            self.cachedFontCount = self.fonts.len() as i64;
        }
    }
    pub fn getFont(&mut self, font_family: &str) -> Rc<RefCell<TrueTypeFont>> {
        self.checkCaches();
        let mut hit: Option<Rc<RefCell<TrueTypeFont>>> = self.familyCache.get(font_family)
            .cloned();
        if hit.is_some() {
            return hit.clone().unwrap();
        }
        let mut f: Rc<RefCell<TrueTypeFont>> = self.findFont(font_family);
        self.familyCache.insert(font_family.to_string(), f.clone());
        f
    }
    pub fn findFont(&self, font_family: &str) -> Rc<RefCell<TrueTypeFont>> {
        // Find font by family name
        // Support formats: "Cinzel", "Cinzel/Cinzel-Bold", "Cinzel-Bold"
        // First, check if fontFamily contains "/" - this indicates path format like "Cinzel/Cinzel-Bold"
        let slash_idx: i64 = PdfText::index_of(&font_family, "/");
        let mut search_family: String = font_family.to_string();
        let mut search_style: String = String::new();
        if slash_idx >= 0 {
            // Extract family and style from path format "Family/Family-Style"
            search_family = PdfText::substr(&font_family, 0, slash_idx);
            let after_slash: String = PdfText::substr(&font_family, slash_idx + 1, (PdfText::str_len(&font_family) as i64));
            // Find the dash in "Cinzel-Bold" to get "Bold"
            let dash_idx: i64 = PdfText::index_of(&after_slash, "-");
            if dash_idx >= 0 {
                search_style = PdfText::substr(&after_slash, dash_idx + 1, (PdfText::str_len(&after_slash) as i64));
            }
        } else {
            // Check for dash format like "Cinzel-Bold"
            let dash_idx_1: i64 = PdfText::index_of(&font_family, "-");
            if dash_idx_1 >= 0 {
                search_family = PdfText::substr(&font_family, 0, dash_idx_1);
                search_style = PdfText::substr(&font_family, dash_idx_1 + 1, (PdfText::str_len(&font_family) as i64));
            }
        }
        // Exact match on both family and style. A bare family name means the
        // regular face, not whichever face of the family was loaded first: a
        // browser fetches the four Open Sans files in parallel and attaches
        // them in whatever order they arrive, so "first" was sometimes the
        // italic and a whole PDF came out slanted.
        let mut first_of_family: i64 = -1;
        let mut i: i64 = 0;
        while i < (self.fonts.len() as i64) {
            let mut f: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f.borrow().fontFamily == search_family {
                if !search_style.is_empty() {
                    // Check if style matches
                    if f.borrow().fontStyle == search_style {
                        return f;
                    }
                } else {
                    if FontManager::isRegularStyle(&f.borrow().fontStyle.clone()) {
                        return f;
                    }
                    if first_of_family < 0 {
                        first_of_family = i;
                    }
                }
            }
            i += 1;
        }
        if first_of_family >= 0 {
            return self.fonts[first_of_family as usize].clone();
        }
        // Try case-insensitive style match
        i = 0;
        while i < (self.fonts.len() as i64) {
            let mut f_1: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f_1.borrow().fontFamily == search_family {
                if !search_style.is_empty() {
                    // Check if style contains the search term (case-insensitive would be better but use contains)
                    if PdfText::index_of(&f_1.borrow().fontStyle, &search_style) >= 0 {
                        return f_1;
                    }
                }
            }
            i += 1;
        }
        // Fallback: try original exact match
        i = 0;
        while i < (self.fonts.len() as i64) {
            let mut f_2: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f_2.borrow().fontFamily == font_family {
                return f_2;
            }
            i += 1;
        }
        // Try partial match on original fontFamily
        i = 0;
        while i < (self.fonts.len() as i64) {
            let mut f_3: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            // Check if fontFamily contains the search term
            if PdfText::index_of(&f_3.borrow().fontFamily, font_family) >= 0 {
                return f_3;
            }
            i += 1;
        }
        // Return default font (may be empty if no fonts loaded)
        self.defaultFont.clone()
    }
    /// Is there a loaded face for this family? getFont() always returns
    /// something — it walks a chain of looser matches and finally hands back
    /// defaultFont — so callers cannot tell a real hit from a substitution.
    /// This reports the substitution, which is what print correctness needs.
    pub fn hasFont(&mut self, font_family: &str) -> bool {
        self.checkCaches();
        let hit: Option<bool> = self.hasCache.get(font_family).cloned();
        if hit.is_some() {
            return hit.unwrap();
        }
        let r: bool = self.findHasFont(font_family);
        self.hasCache.insert(font_family.to_string(), r);
        r
    }
    pub fn findHasFont(&mut self, font_family: &str) -> bool {
        if self.fonts.is_empty() {
            return false;
        }
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if font.borrow().unitsPerEm == 0 {
            return false;
        }
        // An exact family match, with or without a style suffix.
        let slash_idx: i64 = PdfText::index_of(&font_family, "/");
        let mut search_family: String = font_family.to_string();
        if slash_idx >= 0 {
            search_family = PdfText::substr(&font_family, 0, slash_idx);
        } else {
            let dash_idx: i64 = PdfText::index_of(&font_family, "-");
            if dash_idx >= 0 {
                search_family = PdfText::substr(&font_family, 0, dash_idx);
            }
        }
        return font.borrow().fontFamily == search_family || font.borrow().fontFamily == font_family;
    }
    /// The face that actually has a glyph for this codepoint.
    ///
    /// A text face carries no emoji and an emoji face carries no letters, so a
    /// run mixing them cannot be measured or drawn from one file. The primary
    /// family wins whenever it has the glyph; only what it lacks is looked for
    /// elsewhere, so this costs nothing on ordinary text.
    pub fn faceForCodepoint(&mut self, font_family: &str, cp: i64) -> Rc<RefCell<TrueTypeFont>> {
        let mut primary: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if primary.borrow().isLoaded() {
            if primary.borrow_mut().getGlyphIndex(cp) > 0 {
                return primary;
            }
        }
        let mut i: i64 = 0;
        while i < (self.fonts.len() as i64) {
            let mut f: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f.borrow().isLoaded() {
                if f.borrow_mut().getGlyphIndex(cp) > 0 {
                    return f;
                }
            }
            i += 1;
        }
        primary
    }
    /// Any loaded face that has this codepoint, without a family to start from.
    ///
    /// The rasterizer holds one face at a time and knows the glyph is missing
    /// before it knows what to do about it, so it asks this rather than
    /// re-deriving the family name it was set up with. Returns an UNLOADED face
    /// when nothing has the glyph, which the caller must check with
    /// `isLoaded()` — drawing .notdef from the primary is better than drawing
    /// nothing, and switching to a face with no tables reads a glyph outline
    /// out of an empty buffer. `unitsPerEm` is not the check: a fresh face has
    /// the class default of 1000 in it.
    pub fn fallbackFace(&self, cp: i64) -> Rc<RefCell<TrueTypeFont>> {
        let mut i: i64 = 0;
        while i < (self.fonts.len() as i64) {
            let mut f: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f.borrow().isLoaded() {
                if f.borrow_mut().getGlyphIndex(cp) > 0 {
                    return f;
                }
            }
            i += 1;
        }
        let mut none: Rc<RefCell<TrueTypeFont>> = Rc::new(RefCell::new(TrueTypeFont::new()));
        none
    }
    /// The face that should draw a whole grapheme cluster.
    ///
    /// Choosing per CODEPOINT is what broke 1️⃣: the "1" is in the text face and
    /// the keycap is not, so the cluster was split across two faces and the
    /// ligature that turns the three of them into one glyph never had all three
    /// in front of it. A cluster of more than one codepoint therefore asks for a
    /// face that has ALL of them, primary first; only a cluster nobody covers
    /// falls back to matching on its base character alone.
    pub fn faceForClusterFrom(&self, primary: &Rc<RefCell<TrueTypeFont>>, cps: &[i64], start: i64, end: i64) -> Rc<RefCell<TrueTypeFont>> {
        let base: i64 = cps[start as usize];
        if end - start <= 1 {
            if primary.borrow().isLoaded() {
                if primary.borrow_mut().getGlyphIndex(base) > 0 {
                    return primary;
                }
            }
            return self.fallbackFace(base);
        }
        if primary.borrow().isLoaded() {
            if FontManager::coversCluster(primary, cps, start, end) {
                return primary;
            }
        }
        let mut i: i64 = 0;
        while i < (self.fonts.len() as i64) {
            let mut f: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            if f.borrow().isLoaded() {
                if FontManager::coversCluster(&f, cps, start, end) {
                    return f;
                }
            }
            i += 1;
        }
        // Nothing has the whole cluster. Fall back on the base character, so
        // at least the thing the cluster is ABOUT gets drawn.
        if primary.borrow().isLoaded() {
            if primary.borrow_mut().getGlyphIndex(base) > 0 {
                return primary;
            }
        }
        self.fallbackFace(base)
    }
    pub fn faceForCluster(&mut self, font_family: &str, cps: &[i64], start: i64, end: i64) -> Rc<RefCell<TrueTypeFont>> {
        return self.faceForClusterFrom(&self.getFont(font_family), cps, start, end);
    }
    /// True when the codepoint is drawn from some face other than the primary.
    pub fn needsFallback(&mut self, font_family: &str, cp: i64) -> bool {
        let mut primary: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if !primary.borrow().isLoaded() {
            return false;
        }
        return primary.borrow_mut().getGlyphIndex(cp) == 0;
    }
    pub fn measureText(&mut self, text: &str, font_family: &str, font_size: f64) -> f64 {
        self.checkCaches();
        let key: String = format!("{}|{}|{}", font_family, font_size, text);
        let hit: Option<f64> = self.widthCache.get(&key).cloned();
        if hit.is_some() {
            return hit.unwrap();
        }
        let w: f64 = self.measureTextUncached(text, font_family, font_size);
        if self.widthCacheSize >= 20000 {
            let mut wc: HashMap<String,f64> = HashMap::new();
            self.widthCache = wc.clone();
            self.widthCacheSize = 0;
        }
        self.widthCache.insert(key.clone(), w);
        self.widthCacheSize += 1;
        w
    }
    pub fn measureTextUncached(&mut self, text: &str, font_family: &str, font_size: f64) -> f64 {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if !font.borrow().isLoaded() {
            // No real metrics at all — the caller is on the estimate path.
            return (((PdfText::str_len(&text) as i64) as f64) * font_size) * 0.5;
        }
        // Measured per GRAPHEME CLUSTER so a run can cross faces and a
        // sequence is charged the width of the one glyph it becomes.
        //
        // A cluster the primary face draws is measured exactly the way it
        // always was — per codepoint, with kerning — because that is also how
        // it is painted, and the two must not part company. Only a cluster
        // handed to a fallback face goes through the shaper, which is the only
        // path where a sequence collapses to a single glyph.
        let mut cps: Vec<i64> = EVGCodepoint::toArray(text);
        let n: i64 = cps.len() as i64;
        let mut width: f64 = 0.0;
        let mut i: i64 = 0;
        let mut prev: i64 = 0;
        let mut prev_was_primary: bool = false;
        let mut first: bool = true;
        while i < n {
            let end: i64 = EVGGrapheme::clusterEnd(&cps, i);
            let mut found: Rc<RefCell<TrueTypeFont>> = self.faceForClusterFrom(&font,
                &cps,
                i,
                end
            );
            let mut face: Rc<RefCell<TrueTypeFont>> = font.clone();
            // An UNLOADED face is this manager's way of saying that nothing has
            // the codepoint. Measuring against it would charge the glyph
            // nothing at all, and the painter draws `.notdef` from the primary
            // — so measure that.
            if found.borrow().isLoaded() {
                face = found.clone();
            }
            let is_primary: bool = face.borrow().fontPath == font.borrow().fontPath;
            if is_primary {
                let mut c: i64 = i;
                while c < end {
                    let cp: i64 = cps[c as usize];
                    width += face.borrow_mut().getCharWidthPoints(cp, font_size);
                    if !first {
                        if prev_was_primary {
                            width += face.borrow_mut().kernPoints(prev, cp, font_size);
                        }
                    }
                    prev = cp;
                    prev_was_primary = true;
                    first = false;
                    c += 1;
                }
            } else {
                width += face.borrow_mut().measureShapedRange(&cps, i, end, font_size);
                prev = cps[i as usize];
                prev_was_primary = false;
                first = false;
            }
            i = end;
        }
        width
    }
    pub fn getLineHeight(&mut self, font_family: &str, font_size: f64) -> f64 {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if font.borrow().unitsPerEm > 0 {
            return font.borrow().getLineHeight(font_size);
        }
        font_size * 1.2
    }
    pub fn getAscender(&mut self, font_family: &str, font_size: f64) -> f64 {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if font.borrow().unitsPerEm > 0 {
            return font.borrow().getAscender(font_size);
        }
        font_size * 0.8
    }
    pub fn getDescender(&mut self, font_family: &str, font_size: f64) -> f64 {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        if font.borrow().unitsPerEm > 0 {
            return font.borrow().getDescender(font_size);
        }
        font_size * -0.2
    }
    pub fn getFontData(&mut self, font_family: &str) -> Vec<u8> {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        return font.borrow().getFontData();
    }
    pub fn getPostScriptName(&mut self, font_family: &str) -> String {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.getFont(font_family);
        return font.borrow().getPostScriptName();
    }
    pub fn printLoadedFonts(&self) {
        println!("FontManager: {} fonts loaded:", self.fonts.len() as i64);
        let mut i: i64 = 0;
        while i < (self.fonts.len() as i64) {
            let mut f: Rc<RefCell<TrueTypeFont>> = self.fonts[i as usize].clone();
            println!("  - {} ({})", f.borrow().fontFamily, f.borrow().fontStyle);
            i += 1;
        }
    }
}



