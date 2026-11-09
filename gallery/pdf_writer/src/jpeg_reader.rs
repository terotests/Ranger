// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;


/// JPEGReader - A JPEG file reader for Ranger
/// Reads JPEG files and extracts image data for PDF embedding
///
/// JPEG markers:
/// FFD8 - Start of Image (SOI)
/// FFE0 - APP0 (JFIF)
/// FFE1 - APP1 (EXIF)
/// FFC0 - Start of Frame (baseline DCT) - contains width/height
/// FFC2 - Start of Frame (progressive DCT)
/// FFDA - Start of Scan (image data follows)
/// FFD9 - End of Image (EOI)
#[derive(Clone)]
pub struct JPEGImage {
    pub width: i64,
    pub height: i64,
    /// Usually 3 for RGB/YCbCr, 1 for grayscale
    pub colorComponents: i64,
    pub bitsPerComponent: i64,
    pub imageData: Vec<u8>,
    pub isValid: bool,
    pub errorMessage: String,
}

impl JPEGImage {
    pub fn new() -> Self {
        let mut me = Self {
            width: 0,
            height: 0,
            colorComponents: 3,
            bitsPerComponent: 8,
            imageData: Vec::new(),
            isValid: false,
            errorMessage: String::new(),
        };
        // Initialize
        me
    }
}

#[derive(Clone)]
pub struct JPEGReader {
}

impl JPEGReader {
    pub fn new() -> Self {
        let mut me = Self {
        };
        // Initialize
        me
    }
    pub fn read_uint16be(&self, data: &[u8], offset: i64) -> i64 {
        // Read 2 bytes as big-endian unsigned 16-bit integer
        let high: i64 = data[offset as usize] as i64;
        let low: i64 = data[(offset + 1) as usize] as i64;
        high * 256 + low
    }
    pub fn readJPEG(&self, dir_path: &str, file_name: &str) -> Rc<RefCell<JPEGImage>> {
        let mut result: Rc<RefCell<JPEGImage>> = Rc::new(RefCell::new(JPEGImage::new()));
        // Read the file into a buffer
        let mut data: Vec<u8> = PdfText::read_file(dir_path.to_string(), file_name.to_string());
        let data_len: i64 = data.len() as i64;
        if data_len < 4 {
            result.borrow_mut().errorMessage = "File too small to be a valid JPEG".to_string();
            return result;
        }
        // Check for JPEG signature (FFD8)
        let marker1: i64 = data[0] as i64;
        let marker2: i64 = data[1] as i64;
        if marker1 != 255 || marker2 != 216 {
            result.borrow_mut().errorMessage = "Invalid JPEG signature - expected FFD8".to_string();
            return result;
        }
        // Parse JPEG markers to find dimensions
        let mut pos: i64 = 2;
        let mut found_sof: bool = false;
        while pos < data_len - 2 && !found_sof {
            let m1: i64 = data[pos as usize] as i64;
            if m1 != 255 {
                // Not a marker, skip
                pos += 1;
            } else {
                let m2: i64 = data[(pos + 1) as usize] as i64;
                // Skip padding FF bytes
                if m2 == 255 {
                    pos += 1;
                } else {
                    if m2 == 0 {
                        // FF00 is escaped FF in data stream, skip
                        pos += 2;
                    } else {
                        // Check for SOF markers (FFC0-FFC3, FFC5-FFC7, FFC9-FFCB, FFCD-FFCF)
                        // We primarily care about FFC0 (baseline) and FFC2 (progressive)
                        if (m2 == 192 || m2 == 193) || m2 == 194 {
                            // SOF0, SOF1, or SOF2 - Start of Frame
                            // Structure: FF C0 Len(2) Precision(1) Height(2) Width(2) Components(1) ...
                            if pos + 9 < data_len {
                                result.borrow_mut().bitsPerComponent = data[(pos + 4) as usize] as i64;
                                result.borrow_mut().height = self.read_uint16be(&data, pos + 5);
                                result.borrow_mut().width = self.read_uint16be(&data, pos + 7);
                                result.borrow_mut().colorComponents = data[(pos + 9) as usize] as i64;
                                found_sof = true;
                            }
                        } else {
                            if m2 == 217 {
                                // EOI - End of Image, stop parsing
                                pos = data_len;
                            } else {
                                if m2 == 218 {
                                    // SOS - Start of Scan, image data follows
                                    // Stop parsing headers
                                    pos = data_len;
                                } else {
                                    // Other marker - read length and skip
                                    if pos + 4 < data_len {
                                        let seg_len: i64 = self.read_uint16be(&data, pos + 2);
                                        pos = (pos + 2) + seg_len;
                                    } else {
                                        pos = data_len;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if !found_sof {
            result.borrow_mut().errorMessage = "Could not find SOF marker in JPEG".to_string();
            return result;
        }
        // Store the entire JPEG data for PDF embedding
        // PDF can embed JPEG directly with DCTDecode filter
        result.borrow_mut().imageData = data.clone();
        result.borrow_mut().isValid = true;
        result
    }
    pub fn getImageInfo(&self, img: &Rc<RefCell<JPEGImage>>) -> String {
        if !img.borrow().isValid {
            return format!("Invalid JPEG: {}", img.borrow().errorMessage);
        }
        return format!("JPEG: {}x{} pixels, {} components, {} bits", img.borrow().width, img.borrow().height, img.borrow().colorComponents, img.borrow().bitsPerComponent);
    }
}
