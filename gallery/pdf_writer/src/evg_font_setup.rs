// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::font_manager::FontManager;

/// EVGFontSetup.rgr - One place that decides which font files a run measures with
///
/// PLAN_CSS_LAYOUT_AND_FONTS.md §4.1 rule 1: the same face file must be used for
/// measurement and for paint, on every target. That only holds if every tool
/// resolves fonts the same way, so all of them come through here.
///
/// This exists because the tools did not agree and, worse, none of them were
/// actually loading anything: the PDF tool's default fonts directory was
/// `./gallery/pdf_writer/Fonts` (relative to the *current working directory*, and
/// a path that does not exist — the files are under `assets/fonts`), while the
/// HTML tool never created a FontManager at all. Every load failed silently and
/// both tools fell back to guessed widths — different guesses, so preview and
/// print disagreed by roughly ten percent on every string.
///
/// An explicit -fonts argument is authoritative and used alone — falling back
/// after a mistyped path would substitute faces silently. With no override the
/// search is `<input dir>/../assets/fonts`, then `<input dir>/assets/fonts`, then
/// the repository copy. Either way the run reports what it actually loaded.
#[derive(Clone)]
pub struct EVGFontSetup {
    pub manager: Rc<RefCell<FontManager>>,
    pub searched: Vec<String>,
    pub loaded: Vec<String>,
    pub missing: Vec<String>,
}

impl EVGFontSetup {
    pub fn new() -> Self {
        Self {
            manager: Rc::new(RefCell::new(FontManager::new())),
            searched: Vec::new(),
            loaded: Vec::new(),
            missing: Vec::new(),
        }
    }
    pub fn getManager(&self) -> Rc<RefCell<FontManager>> {
        self.manager.clone()
    }
    /// Where the faces actually came from, with a trailing slash — for callers
    /// that must reference the font FILES rather than measure them. Empty when
    /// nothing loaded.
    pub fn fontsRoot(&self) -> String {
        if self.manager.borrow().resolvedDirectory.is_empty() {
            return String::new();
        }
        format!("{}/", self.manager.borrow().resolvedDirectory)
    }
    pub fn loadedCount(&self) -> i64 {
        self.loaded.len() as i64
    }
    pub fn missingCount(&self) -> i64 {
        self.missing.len() as i64
    }
    /// `inputDir` is the directory of the document being rendered; `override` is
    /// the -fonts argument or "" when not given.
    pub fn init(&mut self, input_dir: &str, r#override: &str) {
        if (PdfText::str_len(&r#override) as i64) > 0 {
            // An explicit -fonts is authoritative, not merely first in line.
            // Falling back to the bundled faces after a mistyped path would
            // substitute fonts silently, which is the failure this whole module
            // exists to prevent.
            self.manager.clone().borrow_mut().addFontsDirectory(r#override);
            self.searched.push(r#override.to_string());
            self.loadStandardFaces();
            return;
        }
        // Examples live in gallery/pdf_writer/examples and reference
        // ../assets/fonts, so resolve the same way relative to the document.
        let rel: String = format!("{}../assets/fonts", input_dir);
        self.manager.clone().borrow_mut().addFontsDirectory(&rel);
        self.searched.push(rel);
        let rel2: String = format!("{}assets/fonts", input_dir);
        self.manager.clone().borrow_mut().addFontsDirectory(&rel2);
        self.searched.push(rel2);
        self.manager.clone().borrow_mut().addFontsDirectory("./gallery/pdf_writer/assets/fonts");
        self.searched.push("./gallery/pdf_writer/assets/fonts".to_string().to_string());
        self.loadStandardFaces();
    }
    /// The faces the bundled examples and themes name. Bold is loaded as its own
    /// face rather than synthesised, so `font-weight: bold` measures from a real
    /// face (§4.1 rule 6) instead of widening the regular one.
    pub fn loadStandardFaces(&mut self) {
        self.tryFace("Noto_Sans/NotoSans-Regular.ttf");
        self.tryFace("Noto_Sans/NotoSans-Bold.ttf");
        self.tryFace("Open_Sans/OpenSans-Regular.ttf");
        self.tryFace("Open_Sans/OpenSans-Bold.ttf");
        self.tryFace("Cinzel/Cinzel-Regular.ttf");
        self.tryFace("Cinzel/Cinzel-Bold.ttf");
        self.tryFace("Josefin_Sans/JosefinSans-Regular.ttf");
        self.tryFace("Josefin_Sans/JosefinSans-Bold.ttf");
        self.tryFace("Great_Vibes/GreatVibes-Regular.ttf");
        // Emoji last, so it is never picked as a substitute for a missing text
        // face — it is only reached through the per-codepoint fallback, for
        // codepoints no text face has. Noto Emoji is the monochrome `glyf`
        // cut: ordinary outlines, so every target that can draw a letter can
        // draw these, and the PDF can embed them like any other face.
        self.tryFace("Noto_Emoji/NotoEmoji-Regular.ttf");
    }
    pub fn tryFace(&mut self, relative_path: &str) {
        if self.manager.borrow_mut().loadFont(relative_path) {
            self.loaded.push(relative_path.to_string());
        } else {
            self.missing.push(relative_path.to_string());
        }
    }
    pub fn report(&self, verbose: bool) {
        println!("Fonts: {} face(s) loaded", self.loaded.len() as i64);
        if self.loaded.is_empty() {
            println!("  WARNING: no font files found - text will be measured with");
            println!("  heuristic widths and will not match printed output.");
            let mut s: i64 = 0;
            while s < (self.searched.len() as i64) {
                println!("    searched: {}", self.searched[s as usize].clone());
                s += 1;
            }
            return;
        }
        if verbose {
            let mut i: i64 = 0;
            while i < (self.loaded.len() as i64) {
                println!("    {}", self.loaded[i as usize].clone());
                i += 1;
            }
            let mut m: i64 = 0;
            while m < (self.missing.len() as i64) {
                println!("    (not found) {}", self.missing[m as usize].clone());
                m += 1;
            }
        }
    }
}
