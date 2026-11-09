// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::jpeg_metadata::JPEGMetadataInfo;
use crate::jpeg_metadata::JPEGMetadataParser;
use crate::jpeg_reader::JPEGImage;
use crate::jpeg_reader::JPEGReader;
use crate::rgr::PdfText;
use crate::rgr::{ImageBuffer, JPEGDecoder};

/// ImageUtils.rgr - Shared image utility functions for PDF and Raster rendering
/// This module provides common image operations to avoid code duplication.
/// Result of objectFit calculation
#[derive(Clone)]
pub struct ObjectFitResult {
    pub renderW: f64,
    pub renderH: f64,
    pub offsetX: f64,
    pub offsetY: f64,
    pub isValid: bool,
}

impl ObjectFitResult {
    pub fn new() -> Self {
        Self {
            renderW: 0.0,
            renderH: 0.0,
            offsetX: 0.0,
            offsetY: 0.0,
            isValid: false,
        }
    }
}

/// Image dimensions with validity flag
#[derive(Clone)]
pub struct ImageDimensions {
    pub width: i64,
    pub height: i64,
    pub isValid: bool,
}

impl ImageDimensions {
    pub fn new() -> Self {
        Self {
            width: 0,
            height: 0,
            isValid: false,
        }
    }
    pub fn set(&mut self, w: i64, h: i64) {
        self.width = w;
        self.height = h;
        self.isValid = true;
    }
}

/// Shared image utilities
#[derive(Clone)]
pub struct ImageUtils {
    pub baseDir: String,
    pub metadataParser: Rc<RefCell<JPEGMetadataParser>>,
    /// Cache for image dimensions
    pub dimensionsCacheKeys: Vec<String>,
    pub dimensionsCache: Vec<Rc<RefCell<ImageDimensions>>>,
}

impl ImageUtils {
    pub fn new() -> Self {
        let mut me = Self {
            baseDir: String::new(),
            metadataParser: Rc::new(RefCell::new(JPEGMetadataParser::new())),
            dimensionsCacheKeys: Vec::new(),
            dimensionsCache: Vec::new(),
        };
        let mut keys: Vec<String> = Vec::new();
        me.dimensionsCacheKeys = keys.clone();
        let mut cache: Vec<Rc<RefCell<ImageDimensions>>> = Vec::new();
        me.dimensionsCache = cache.clone();
        me
    }
    pub fn setBaseDir(&mut self, dir: String) {
        self.baseDir = dir.clone();
    }
    /// Calculate objectFit render dimensions
    /// Returns: ObjectFitResult with renderW, renderH, offsetX, offsetY
    pub fn calculateObjectFit(&self, container_w: f64, container_h: f64, image_w: f64, image_h: f64, mut object_fit: String) -> Rc<RefCell<ObjectFitResult>> {
        let mut result: Rc<RefCell<ObjectFitResult>> = Rc::new(RefCell::new(ObjectFitResult::new()));
        if container_w <= 0.0 {
            return result;
        }
        if container_h <= 0.0 {
            return result;
        }
        if image_w <= 0.0 {
            return result;
        }
        if image_h <= 0.0 {
            return result;
        }
        result.borrow_mut().renderW = container_w;
        result.borrow_mut().renderH = container_h;
        result.borrow_mut().isValid = true;
        // Default to "cover" if not specified
        if object_fit.is_empty() {
            object_fit = "cover".to_string();
        }
        let container_ratio: f64 = container_w / container_h;
        let image_ratio: f64 = image_w / image_h;
        if object_fit == "cover" {
            // Scale to cover entire container, may crop
            if image_ratio > container_ratio {
                // Image is wider than container - scale by height, crop width
                result.borrow_mut().renderH = container_h;
                result.borrow_mut().renderW = container_h * image_ratio;
                result.borrow_mut().offsetX = (container_w - result.borrow().renderW) / 2.0;
            } else {
                // Image is taller than container - scale by width, crop height
                result.borrow_mut().renderW = container_w;
                result.borrow_mut().renderH = container_w / image_ratio;
                result.borrow_mut().offsetY = (container_h - result.borrow().renderH) / 2.0;
            }
        }
        if object_fit == "contain" {
            // Scale to fit within container, may letterbox
            if image_ratio > container_ratio {
                // Image is wider - fit to width, letterbox height
                result.borrow_mut().renderW = container_w;
                result.borrow_mut().renderH = container_w / image_ratio;
                result.borrow_mut().offsetY = (container_h - result.borrow().renderH) / 2.0;
            } else {
                // Image is taller - fit to height, letterbox width
                result.borrow_mut().renderH = container_h;
                result.borrow_mut().renderW = container_h * image_ratio;
                result.borrow_mut().offsetX = (container_w - result.borrow().renderW) / 2.0;
            }
        }
        // For "fill" or default, use container dimensions as-is (stretch)
        result
    }
    /// Resolve image path with fallback to ./assets/ prefix
    /// Returns: [dirPath, fileName] or ["", ""] if not found
    pub fn resolveImagePath(&self, src: &str) -> String {
        let mut img_dir: String = String::new();
        let mut img_file: String = String::new();
        let mut img_src: String = src.to_string();
        // Remove leading "./" if present
        if (PdfText::str_len(&src) as i64) > 2 {
            let prefix: String = PdfText::substr(&src, 0, 2);
            if prefix == "./" {
                img_src = PdfText::substr(&src, 2, (PdfText::str_len(&src) as i64));
            }
        }
        // Find last path separator
        let last_slash: i64 = PdfText::last_index_of(&img_src, "/");
        let last_backslash: i64 = PdfText::last_index_of(&img_src, "\\");
        let mut last_sep: i64 = last_slash;
        if last_backslash > last_sep {
            last_sep = last_backslash;
        }
        if last_sep >= 0 {
            img_dir = format!("{}{}", self.baseDir, PdfText::substr(&img_src, 0, last_sep + 1));
            img_file = PdfText::substr(&img_src, last_sep + 1, (PdfText::str_len(&img_src) as i64));
        } else {
            img_dir = self.baseDir.clone();
            img_file = img_src.clone();
        }
        format!("{}|{}", img_dir, img_file)
    }
    /// Parse resolved path string back to dir and file
    pub fn parseResolvedPath(&self, resolved: &str, idx: i64) -> String {
        let sep_idx: i64 = PdfText::index_of(&resolved, "|");
        if sep_idx < 0 {
            return String::new();
        }
        if idx == 0 {
            return PdfText::substr(&resolved, 0, sep_idx);
        }
        PdfText::substr(&resolved, sep_idx + 1, (PdfText::str_len(&resolved) as i64))
    }
    /// Load image dimensions from file (with caching)
    pub fn loadImageDimensions(&mut self, src: &str) -> Rc<RefCell<ImageDimensions>> {
        // Check cache first
        let mut i: i64 = 0;
        while i < (self.dimensionsCacheKeys.len() as i64) {
            let key: String = self.dimensionsCacheKeys[i as usize].clone();
            if key == src {
                return self.dimensionsCache[i as usize].clone();
            }
            i += 1;
        }
        // Not in cache, load from file
        let mut dims: Rc<RefCell<ImageDimensions>> = Rc::new(RefCell::new(ImageDimensions::new()));
        // Resolve path
        let resolved: String = self.resolveImagePath(src);
        let mut img_dir: String = self.parseResolvedPath(&resolved, 0);
        let mut img_file: String = self.parseResolvedPath(&resolved, 1);
        // Read JPEG dimensions using JPEGReader
        let mut reader: Rc<RefCell<JPEGReader>> = Rc::new(RefCell::new(JPEGReader::new()));
        let mut jpeg_image: Rc<RefCell<JPEGImage>> = reader.borrow().readJPEG(&img_dir, &img_file);
        // If file not found, try with ./assets/ prefix
        if !jpeg_image.borrow().isValid {
            let mut alt_dir_path: String = String::new();
            if PdfText::index_of(&src, "./") == 0 {
                alt_dir_path = format!("{}assets/{}", self.baseDir, PdfText::substr(&src, 2, (PdfText::str_len(&src) as i64)));
            } else {
                alt_dir_path = format!("{}assets/{}", self.baseDir, src);
            }
            let alt_last_slash: i64 = PdfText::last_index_of(&alt_dir_path, "/");
            if alt_last_slash >= 0 {
                img_dir = PdfText::substr(&alt_dir_path, 0, alt_last_slash + 1);
                img_file = PdfText::substr(&alt_dir_path, alt_last_slash + 1, (PdfText::str_len(&alt_dir_path) as i64));
            }
            jpeg_image = reader.borrow().readJPEG(&img_dir, &img_file);
        }
        if jpeg_image.borrow().isValid {
            // Get EXIF orientation to determine final dimensions
            let mut meta_info: Rc<RefCell<JPEGMetadataInfo>> = self.metadataParser.borrow_mut().parseMetadata(&img_dir, &img_file);
            let orientation: i64 = meta_info.borrow().orientation;
            let mut img_w: i64 = jpeg_image.borrow().width;
            let mut img_h: i64 = jpeg_image.borrow().height;
            // Swap dimensions for 90/270 degree rotations
            if ((orientation == 5 || orientation == 6) || orientation == 7) || orientation == 8 {
                let tmp: i64 = img_w;
                img_w = img_h;
                img_h = tmp;
            }
            dims.borrow_mut().set(img_w, img_h);
        }
        // Cache the result
        self.dimensionsCacheKeys.push(src.to_string());
        self.dimensionsCache.push(dims.clone());
        dims
    }
    /// Decode JPEG image to ImageBuffer (with path resolution and fallback)
    fn decodeImage(&self, src: &str) -> Rc<RefCell<ImageBuffer>> {
        // Resolve path
        let resolved: String = self.resolveImagePath(src);
        let mut img_dir: String = self.parseResolvedPath(&resolved, 0);
        let mut img_file: String = self.parseResolvedPath(&resolved, 1);
        let mut decoder: Rc<RefCell<JPEGDecoder>> = Rc::new(RefCell::new(JPEGDecoder::new()));
        let mut img_buffer: Rc<RefCell<ImageBuffer>> = JPEGDecoder::decode(
            &decoder,
            &img_dir,
            &img_file
        );
        // If decode failed (returns 1x1 error image), try alternative path with ./assets/ prefix
        if img_buffer.borrow().width <= 1 {
            let mut alt_dir_path: String = String::new();
            if PdfText::index_of(&src, "./") == 0 {
                alt_dir_path = format!("{}assets/{}", self.baseDir, PdfText::substr(&src, 2, (PdfText::str_len(&src) as i64)));
            } else {
                alt_dir_path = format!("{}assets/{}", self.baseDir, src);
            }
            let alt_last_slash: i64 = PdfText::last_index_of(&alt_dir_path, "/");
            if alt_last_slash >= 0 {
                img_dir = PdfText::substr(&alt_dir_path, 0, alt_last_slash + 1);
                img_file = PdfText::substr(&alt_dir_path, alt_last_slash + 1, (PdfText::str_len(&alt_dir_path) as i64));
            }
            img_buffer = JPEGDecoder::decode(&decoder, &img_dir, &img_file);
        }
        img_buffer
    }
}
