// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::jpeg_metadata::JPEGMetadataInfo;
use crate::jpeg_metadata::JPEGMetadataParser;
use crate::rgr::PdfText;
use crate::rgr::{EVGElement};

/// EVGResourceLoader.rgr - Load and cache image metadata for EVG rendering
///
/// This class handles loading JPEG metadata (dimensions, orientation) for images
/// referenced in EVG documents. It caches the results to avoid re-parsing.
/// Extended class to cache image info including EXIF data
#[derive(Clone)]
pub struct ImageInfo {
    pub path: String,
    pub width: i64,
    pub height: i64,
    pub loaded: bool,
    pub error: String,
    /// EXIF metadata
    pub orientation: i64,
    pub colorSpace: String,
    pub bitsPerComponent: i64,
    pub createdAt: String,
    pub camera: String,
    /// GPS data (parsed as decimal degrees)
    pub hasGPS: bool,
    pub gpsLatitude: f64,
    pub gpsLongitude: f64,
}

impl ImageInfo {
    pub fn new() -> Self {
        Self {
            path: String::new(),
            width: 0,
            height: 0,
            loaded: false,
            error: String::new(),
            orientation: 1,
            colorSpace: "RGB".to_string(),
            bitsPerComponent: 8,
            createdAt: String::new(),
            camera: String::new(),
            hasGPS: false,
            gpsLatitude: 0.0,
            gpsLongitude: 0.0,
        }
    }
}

/// Resource loader for EVG documents - loads image metadata
#[derive(Clone)]
pub struct EVGResourceLoader {
    pub basePath: String,
    pub imageCache: Vec<Rc<RefCell<ImageInfo>>>,
    pub metadataParser: Option<Rc<RefCell<JPEGMetadataParser>>>,
    pub debug: bool,
}

impl EVGResourceLoader {
    pub fn new() -> Self {
        let mut me = Self {
            basePath: "./".to_string(),
            imageCache: Vec::new(),
            metadataParser: None,
            debug: false,
        };
        let mut cache: Vec<Rc<RefCell<ImageInfo>>> = Vec::new();
        me.imageCache = cache.clone();
        let mut mp: Rc<RefCell<JPEGMetadataParser>> = Rc::new(RefCell::new(JPEGMetadataParser::new()));
        me.metadataParser = Some(mp.clone());
        me
    }
    pub fn setBasePath(&mut self, path: String) {
        self.basePath = path.clone();
    }
    fn loadResources(&mut self, root: &Rc<RefCell<EVGElement>>) {
        println!("ResourceLoader: Starting resource loading...");
        self.processElement(root);
        println!("ResourceLoader: Loaded {} images", self.imageCache.len() as i64);
    }
    fn processElement(&mut self, el: &Rc<RefCell<EVGElement>>) {
        println!("ResourceLoader: processElement tagName={} src={}", el.borrow().tagName, el.borrow().src);
        // Check if this is an image element by tag name
        if (el.borrow().tagName == "Image" || el.borrow().tagName == "image") || el.borrow().tagName == "img" {
            if !el.borrow().src.is_empty() {
                println!("ResourceLoader: Found image: {}", el.borrow().src);
                self.loadImageMetadata(el);
            }
        }
        // Also check by elementType (2 = image)
        if el.borrow().elementType == 2 {
            if !el.borrow().src.is_empty() {
                println!("ResourceLoader: Found image by elementType: {}", el.borrow().src);
                self.loadImageMetadata(el);
            }
        }
        // Process children recursively
        let mut i: i64 = 0;
        while i < (el.borrow().children.len() as i64) {
            let mut child: Rc<RefCell<EVGElement>> = el.borrow().children[i as usize].clone();
            self.processElement(&child);
            i += 1;
        }
    }
    fn loadImageMetadata(&mut self, el: &Rc<RefCell<EVGElement>>) {
        let img_path: String = el.borrow().src.clone();
        // Check cache first
        let mut cached: Rc<RefCell<ImageInfo>> = self.getCachedImage(&img_path);
        if cached.borrow().loaded {
            el.borrow_mut().sourceWidth = cached.borrow().width as f64;
            el.borrow_mut().sourceHeight = cached.borrow().height as f64;
            if self.debug {
                println!("ResourceLoader: Cache hit for {} ({}x{})", img_path, cached.borrow().width, cached.borrow().height);
            }
            return;
        }
        // Parse the path to separate directory and filename
        let mut dir_path: String = String::new();
        let mut file_name: String = String::new();
        let last_slash: i64 = PdfText::last_index_of(&img_path, "/");
        let last_backslash: i64 = PdfText::last_index_of(&img_path, "\\");
        let mut last_sep: i64 = last_slash;
        if last_backslash > last_sep {
            last_sep = last_backslash;
        }
        if last_sep >= 0 {
            dir_path = PdfText::substr(&img_path, 0, last_sep + 1);
            file_name = PdfText::substr(&img_path, last_sep + 1, (PdfText::str_len(&img_path) as i64));
        } else {
            dir_path = String::new();
            file_name = img_path.clone();
        }
        // Build full path - handle relative paths
        // Fix: avoid double "./" by checking if dirPath already starts with "./"
        let mut full_dir_path: String = dir_path.clone();
        if PdfText::index_of(&img_path, "/") != 0 {
            // Path is relative, prepend basePath
            // But avoid "./" + "./" = "././" issue
            if PdfText::index_of(&dir_path, "./") == 0 {
                // dirPath starts with "./", use basePath only if it's not "./"
                if self.basePath == "./" {
                    full_dir_path = dir_path.clone();
                } else {
                    // Strip "./" from dirPath and prepend basePath
                    full_dir_path = format!("{}{}", self.basePath, PdfText::substr(&dir_path, 2, (PdfText::str_len(&dir_path) as i64)));
                }
            } else {
                full_dir_path = format!("{}{}", self.basePath, dir_path);
            }
        }
        println!("ResourceLoader: Loading {}{}", full_dir_path, file_name);
        // Parse JPEG metadata
        let mut meta: Rc<RefCell<JPEGMetadataInfo>> = (self.metadataParser.as_ref().unwrap()).borrow_mut().parseMetadata(&full_dir_path, &file_name);
        // If file not found or too small, try with ./assets/ prefix
        if !meta.borrow().isValid {
            // Try alternative path: prepend "assets/" to the path
            let mut alt_dir_path: String = String::new();
            if PdfText::index_of(&dir_path, "./") == 0 {
                // ./images/ -> ./assets/images/
                alt_dir_path = format!("./assets/{}", PdfText::substr(&dir_path, 2, (PdfText::str_len(&dir_path) as i64)));
            } else {
                alt_dir_path = format!("./assets/{}", dir_path);
            }
            println!("ResourceLoader: Trying alternative path: {}{}", alt_dir_path, file_name);
            meta = (self.metadataParser.as_ref().unwrap()).borrow_mut().parseMetadata(&alt_dir_path, &file_name);
        }
        if !meta.borrow().isValid {
            println!("ResourceLoader: ERROR - {}: {}{}", meta.borrow().errorMessage, full_dir_path, file_name);
            let mut err_info: Rc<RefCell<ImageInfo>> = Rc::new(RefCell::new(ImageInfo::new()));
            err_info.borrow_mut().path = img_path.clone();
            err_info.borrow_mut().loaded = true;
            err_info.borrow_mut().error = meta.borrow().errorMessage.clone();
            self.imageCache.push(err_info.clone());
            return;
        }
        // Get dimensions, handling EXIF orientation
        let mut img_width: i64 = meta.borrow().width;
        let mut img_height: i64 = meta.borrow().height;
        // For orientations 5-8, width and height are swapped
        if ((meta.borrow().orientation == 5 || meta.borrow().orientation == 6) || meta.borrow().orientation == 7) || meta.borrow().orientation == 8 {
            img_width = meta.borrow().height;
            img_height = meta.borrow().width;
        }
        // Set source dimensions on element
        el.borrow_mut().sourceWidth = img_width as f64;
        el.borrow_mut().sourceHeight = img_height as f64;
        if self.debug {
            println!("ResourceLoader: Loaded {} ({}x{})", img_path, img_width, img_height);
        }
        // Cache the result
        let mut info: Rc<RefCell<ImageInfo>> = Rc::new(RefCell::new(ImageInfo::new()));
        info.borrow_mut().path = img_path.clone();
        info.borrow_mut().width = img_width;
        info.borrow_mut().height = img_height;
        info.borrow_mut().loaded = true;
        self.imageCache.push(info.clone());
    }
    pub fn getCachedImage(&self, path: &str) -> Rc<RefCell<ImageInfo>> {
        let mut i: i64 = 0;
        while i < (self.imageCache.len() as i64) {
            let mut info: Rc<RefCell<ImageInfo>> = self.imageCache[i as usize].clone();
            if info.borrow().path == path {
                return info;
            }
            i += 1;
        }
        // Return empty info if not found
        let mut empty: Rc<RefCell<ImageInfo>> = Rc::new(RefCell::new(ImageInfo::new()));
        empty
    }
    pub fn clearCache(&mut self) {
        let mut empty: Vec<Rc<RefCell<ImageInfo>>> = Vec::new();
        self.imageCache = empty.clone();
    }
}
