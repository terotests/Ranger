// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::rgr::PdfText;
use crate::utf8::Utf8;
use crate::rgr::{EVGElement, EVGStyleSheet};

/// EVGStyleLoader.rgr - Load CSS files and apply them to a laid-out-to-be EVG tree
///
/// Shared by the CLI tools so `-css` / `-theme` behave identically whichever
/// output format is being produced. Keeping this in one place matters for print:
/// the PDF, HTML and raster tools must resolve the same rules to the same
/// computed properties, or a theme would look different per target.
///
/// The theme is resolved as: -theme flag, else the `theme` attribute on the
/// document root, else "" (only unscoped rules apply).
pub struct EVGStyleLoader {
    sheet: Option<Rc<RefCell<EVGStyleSheet>>>,
    pub cssFiles: Vec<String>,
    pub themeOverride: String,
    pub loadedCount: i64,
    pub viewW: f64,
    pub viewH: f64,
}

impl EVGStyleLoader {
    pub fn new() -> Self {
        let mut me = Self {
            sheet: None,
            cssFiles: Vec::new(),
            themeOverride: String::new(),
            loadedCount: 0,
            viewW: 0.0,
            viewH: 0.0,
        };
        let mut s_1: Rc<RefCell<EVGStyleSheet>> = Rc::new(RefCell::new(EVGStyleSheet::new()));
        me.sheet = Some(s_1.clone());
        me.themeOverride = String::new();
        me.loadedCount = 0;
        me
    }
    pub fn addFile(&mut self, path: &str) {
        self.cssFiles.push(path.to_string());
    }
    pub fn hasFiles(&self) -> bool {
        !self.cssFiles.is_empty()
    }
    pub fn setTheme(&mut self, name: String) {
        self.themeOverride = name.clone();
    }
    /// THE VIEWPORT A MEDIA QUERY IS ASKED ABOUT. A Ranger program has no window
    /// to ask, so `EVGStyleSheet` evaluates `@media` against a size the caller
    /// states — and a rule it cannot evaluate does not apply at all. Nothing
    /// here stated one, so every `@media` block in every `-css` file was
    /// silently inert in all five tools, while the same sheet worked in an
    /// application that had called `setViewport` itself. A stylesheet whose
    /// responsive half does nothing, with no warning, is the worst version of
    /// this: the page renders, and it renders wrong.
    ///
    /// The tools know their page size before they apply anything, so they pass
    /// it. Pointer stays `fine`: a rendered page has no pointer, and guessing
    /// `coarse` from a narrow page would be a second, invisible rule.
    pub fn setViewport(&mut self, w: f64, h: f64) {
        self.viewW = w;
        self.viewH = h;
    }
    /// Split "dir/sub/file.css" into a (dir, name) pair for buffer_read_file.
    pub fn dirOf(&self, path: &str) -> String {
        let last_slash: i64 = PdfText::last_index_of(&path, "/");
        let last_backslash: i64 = PdfText::last_index_of(&path, "\\");
        let mut last_sep: i64 = last_slash;
        if last_backslash > last_sep {
            last_sep = last_backslash;
        }
        if last_sep >= 0 {
            return PdfText::substr(&path, 0, last_sep + 1);
        }
        "./".to_string()
    }
    pub fn nameOf(&self, path: &str) -> String {
        let last_slash: i64 = PdfText::last_index_of(&path, "/");
        let last_backslash: i64 = PdfText::last_index_of(&path, "\\");
        let mut last_sep: i64 = last_slash;
        if last_backslash > last_sep {
            last_sep = last_backslash;
        }
        if last_sep >= 0 {
            return PdfText::substr(&path, last_sep + 1, (PdfText::str_len(&path) as i64));
        }
        path.to_string()
    }
    /// Load every -css file, then apply the resulting sheet to the tree.
    /// Returns the theme that was actually used, for logging.
    fn applyTo(&mut self, root: &Rc<RefCell<EVGElement>>) -> String {
        let mut i: i64 = 0;
        while i < (self.cssFiles.len() as i64) {
            let path: String = self.cssFiles[i as usize].clone();
            // buffer_read_file inlines its arguments into a plain (non-arrow)
            // IIFE, so `this` is not bound inside them — resolve the parts first.
            let dir: String = self.dirOf(&path);
            let name: String = self.nameOf(&path);
            let mut content: Vec<u8> = PdfText::read_file(dir.to_string(), name.to_string());
            let css: String = Utf8::decode(&String::from_utf8_lossy(&content).to_string());
            if css.is_empty() {
                println!("Warning: stylesheet is empty or could not be read: {}", path);
            } else {
                EVGStyleSheet::parse(&self.sheet.as_ref().unwrap().clone(), &css);
                self.loadedCount += 1;
            }
            i += 1;
        }
        let mut theme: String = self.themeOverride.clone();
        if theme.is_empty() {
            theme = root.borrow().theme.clone();
        }
        // Parse problems are reported rather than swallowed — a dropped rule
        // otherwise shows up as a silently unstyled page.
        let mut e: i64 = 0;
        while e < EVGStyleSheet::getErrorCount(&self.sheet.as_ref().unwrap()) {
            println!("Stylesheet warning: {}", EVGStyleSheet::getError(&self.sheet.as_ref().unwrap(), e));
            e += 1;
        }
        if self.viewW > 0.0 && self.viewH > 0.0 {
            let mut _tmp_1351 = self.viewW.clone();
            let mut _tmp_1352 = self.viewH.clone();
            EVGStyleSheet::applyTreeIn(&self.sheet.as_ref().unwrap().clone(), root, &theme, _tmp_1351, _tmp_1352, false);
        } else {
            EVGStyleSheet::applyTree(&self.sheet.as_ref().unwrap().clone(), root, &theme);
        }
        theme
    }
    pub fn report(&self, theme: &str) {
        if !self.hasFiles() {
            return;
        }
        println!("Stylesheets: {} file(s), {} rule(s)", self.loadedCount, EVGStyleSheet::getRuleCount(&self.sheet.as_ref().unwrap()));
        if !theme.is_empty() {
            println!("Theme: {}", theme);
        } else {
            println!("Theme: (none) - only unscoped .class rules apply");
        }
    }
}
