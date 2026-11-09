// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::jpeg_metadata::JPEGMetadataInfo;
use crate::jpeg_metadata::JPEGMetadataParser;
use crate::jpeg_reader::JPEGImage;
use crate::jpeg_reader::JPEGReader;
use crate::rgr::PdfText;
use crate::rgr::{GrowableBuffer};

/// PDFWriter - A minimalistic PDF generator for Ranger
/// Demonstrates PDF structure generation using buffer-based output
///
/// PDF Reference: https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf
///
/// Compile ES6: npm run pdf:compile
/// Run: npm run pdf:run
pub struct PDFWriter {
    pub nextObjNum: i64,
    pdfBuffer: Option<Rc<RefCell<GrowableBuffer>>>,
    pub objectOffsets: Vec<i64>,
    pub jpegReader: Option<Rc<RefCell<JPEGReader>>>,
    pub metadataParser: Option<Rc<RefCell<JPEGMetadataParser>>>,
    pub imageObjNum: i64,
    pub lastImageMetadata: Option<Rc<RefCell<JPEGMetadataInfo>>>,
}

impl PDFWriter {
    pub fn new() -> Self {
        let mut me = Self {
            nextObjNum: 1,
            pdfBuffer: None,
            objectOffsets: Vec::new(),
            jpegReader: None,
            metadataParser: None,
            imageObjNum: 0,
            lastImageMetadata: None,
        };
        let mut buf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        me.pdfBuffer = Some(buf.clone());
        let mut reader: Rc<RefCell<JPEGReader>> = Rc::new(RefCell::new(JPEGReader::new()));
        me.jpegReader = Some(reader.clone());
        let mut parser: Rc<RefCell<JPEGMetadataParser>> = Rc::new(RefCell::new(JPEGMetadataParser::new()));
        me.metadataParser = Some(parser.clone());
        me
    }
    pub fn writeObject(&mut self, content: &str) {
        let mut buf: Rc<RefCell<GrowableBuffer>> = self.pdfBuffer.clone().unwrap();
        self.objectOffsets.push(GrowableBuffer::size(&buf));
        GrowableBuffer::writeString(&buf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        GrowableBuffer::writeString(&buf, content);
        GrowableBuffer::writeString(&buf, "\nendobj\n\n");
        self.nextObjNum += 1;
    }
    pub fn writeObjectGetNum(&mut self, content: &str) -> i64 {
        let obj_num: i64 = self.nextObjNum;
        self.writeObject(content);
        obj_num
    }
    pub fn writeImageObject(&mut self, header: &str, image_data: &[u8], footer: &str) -> i64 {
        // Write image object with raw binary data
        let mut buf: Rc<RefCell<GrowableBuffer>> = self.pdfBuffer.clone().unwrap();
        self.objectOffsets.push(GrowableBuffer::size(&buf));
        GrowableBuffer::writeString(&buf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        GrowableBuffer::writeString(&buf, header);
        GrowableBuffer::writeBuffer(&buf, image_data);
        GrowableBuffer::writeString(&buf, footer);
        GrowableBuffer::writeString(&buf, "\nendobj\n\n");
        let obj_num: i64 = self.nextObjNum;
        self.nextObjNum += 1;
        obj_num
    }
    pub fn addJPEGImage(&mut self, dir_path: &str, file_name: &str) -> i64 {
        // Read and add a JPEG image, returns the object number
        let mut reader: Rc<RefCell<JPEGReader>> = self.jpegReader.clone().unwrap();
        let mut img: Rc<RefCell<JPEGImage>> = reader.borrow().readJPEG(dir_path, file_name);
        if !img.borrow().isValid {
            println!("Error loading image: {}", img.borrow().errorMessage);
            return 0;
        }
        println!("{}", reader.borrow().getImageInfo(&img));
        // Parse JPEG metadata
        let mut parser: Rc<RefCell<JPEGMetadataParser>> = self.metadataParser.clone()
            .unwrap();
        let mut meta: Rc<RefCell<JPEGMetadataInfo>> = parser.borrow_mut().parseMetadata(dir_path, file_name);
        self.lastImageMetadata = Some(meta.clone());
        // Determine color space
        let mut color_space: String = "/DeviceRGB";
        if img.borrow().colorComponents == 1 {
            color_space = "/DeviceGray";
        }
        if img.borrow().colorComponents == 4 {
            color_space = "/DeviceCMYK";
        }
        // Get raw JPEG data - unwrap the optional buffer
        let mut img_data: Vec<u8> = img.borrow().imageData.clone();
        let data_len: i64 = img_data.len() as i64;
        // Create image XObject header with DCTDecode (raw JPEG)
        let mut img_header: String = "<< /Type /XObject /Subtype /Image".to_string();
        img_header.push_str(&format!(" /Width {}", img.borrow().width));
        img_header.push_str(&format!(" /Height {}", img.borrow().height));
        img_header.push_str(&format!(" /ColorSpace {}", color_space));
        img_header.push_str(&format!(" /BitsPerComponent {}", img.borrow().bitsPerComponent));
        img_header.push_str(" /Filter /DCTDecode");
        img_header.push_str(&format!(" /Length {}", data_len));
        img_header.push_str(" >>\nstream\n");
        let img_footer: String = "\nendstream";
        self.imageObjNum = self.writeImageObject(&img_header, &img_data, img_footer);
        self.imageObjNum
    }
    pub fn toOctalEscape(&self, ch: i64) -> String {
        // Convert a byte value (0-255) to PDF octal escape format \NNN
        let d0: i64 = ch % 8;
        let t1: i64 = (ch as f64 / 8.0).floor() as i64;
        let d1: i64 = t1 % 8;
        let d2: i64 = (t1 as f64 / 8.0).floor() as i64;
        format!("\\{}{}{}", d2, d1, d0)
    }
    pub fn escapeText(&self, text: &str) -> String {
        // Basic PDF text escaping - escape parentheses and backslashes
        // For high-byte characters (128-255), use PDF octal escape \NNN
        let mut result: String = String::new();
        let __len: i64 = PdfText::str_len(&text) as i64;
        let mut i: i64 = 0;
        while i < __len {
            let ch: i64 = PdfText::char_at(&text, i);
            // (
            if ch == 40 {
                result.push_str("\\(");
            } else {
                // )
                if ch == 41 {
                    result.push_str("\\)");
                } else {
                    // \
                    if ch == 92 {
                        result.push_str("\\\\");
                    } else {
                        if ch < 128 {
                            // ASCII range - safe to use directly
                            result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
                        } else {
                            if ch <= 255 {
                                // WinAnsi high-byte - use octal escape
                                {
                                    result.push_str(&format!("{}", self.toOctalEscape(ch)));
                                }
                            } else {
                                // Outside WinAnsi, use placeholder
                                result.push_str("?");
                            }
                        }
                    }
                }
            }
            i += 1;
        }
        result
    }
    pub fn createHelloWorldPDF(&mut self, message: &str) -> Vec<u8> {
        self.createPDFWithImage(message, "", "")
    }
    pub fn createPDFWithImage(&mut self, message: &str, image_dir_path: &str, image_file_name: &str) -> Vec<u8> {
        // Reset state
        self.nextObjNum = 1;
        let mut buf: Rc<RefCell<GrowableBuffer>> = self.pdfBuffer.clone().unwrap();
        GrowableBuffer::clear(&buf);
        self.imageObjNum = 0;
        self.objectOffsets.clear();
        // PDF header
        GrowableBuffer::writeString(&buf, "%PDF-1.4\n");
        // Binary marker for PDF readers (high-bit bytes)
        // %
        GrowableBuffer::writeByte(&buf, 37);
        // high-bit char
        GrowableBuffer::writeByte(&buf, 226);
        // high-bit char
        GrowableBuffer::writeByte(&buf, 227);
        // high-bit char
        GrowableBuffer::writeByte(&buf, 207);
        // high-bit char
        GrowableBuffer::writeByte(&buf, 211);
        // newline
        GrowableBuffer::writeByte(&buf, 10);
        // If we have an image, add it first (will be object 1)
        let mut has_image: bool = !image_file_name.is_empty();
        if has_image {
            let img_num: i64 = self.addJPEGImage(image_dir_path, image_file_name);
            if img_num == 0 {
                has_image = false;
            }
        }
        // Object: Catalog (root) - references Pages
        // unused:  let catalog_obj_num: i64 = self.nextObjNum;
        let pages_obj_num: i64 = self.nextObjNum + 1;
        self.writeObject(&format!("<< /Type /Catalog /Pages {} 0 R >>", pages_obj_num));
        // Object: Pages container - references Page
        let page_obj_num: i64 = self.nextObjNum + 1;
        self.writeObject(&format!("<< /Type /Pages /Kids [{} 0 R] /Count 1 >>", page_obj_num));
        // Object: Page definition - references Content and Resources
        let content_obj_num: i64 = self.nextObjNum + 1;
        let font_obj_num: i64 = self.nextObjNum + 2;
        let mut resources_str: String = format!("<< /Font << /F1 {} 0 R >>", font_obj_num);
        if has_image {
            resources_str.push_str(&format!(" /XObject << /Img1 {} 0 R >>", self.imageObjNum));
        }
        resources_str.push_str(" >>");
        self.writeObject(&format!("<< /Type /Page /Parent {} 0 R /MediaBox [0 0 612 792] /Contents {} 0 R /Resources {} >>", pages_obj_num, content_obj_num, resources_str));
        // Build page content stream using a local buffer
        let mut stream_buf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        // If we have an image, draw it first (at the top)
        if has_image {
            // Draw image: save state, transform matrix, draw, restore
            GrowableBuffer::writeString(&stream_buf, "q\n");
            GrowableBuffer::writeString(&stream_buf, "150 0 0 150 400 600 cm\n");
            GrowableBuffer::writeString(&stream_buf, "/Img1 Do\n");
            GrowableBuffer::writeString(&stream_buf, "Q\n");
        }
        // Draw a red rectangle (path element)
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "1 0 0 RG\n");
        GrowableBuffer::writeString(&stream_buf, "1 0.8 0.8 rg\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        GrowableBuffer::writeString(&stream_buf, "100 650 80 60 re\n");
        GrowableBuffer::writeString(&stream_buf, "B\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a blue triangle (path element)
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0 0 1 RG\n");
        GrowableBuffer::writeString(&stream_buf, "0.8 0.8 1 rg\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        GrowableBuffer::writeString(&stream_buf, "220 650 m\n");
        GrowableBuffer::writeString(&stream_buf, "280 650 l\n");
        GrowableBuffer::writeString(&stream_buf, "250 710 l\n");
        GrowableBuffer::writeString(&stream_buf, "h\n");
        GrowableBuffer::writeString(&stream_buf, "B\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a green circle (approximated with bezier curves)
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0 0.5 0 RG\n");
        GrowableBuffer::writeString(&stream_buf, "0.8 1 0.8 rg\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        // Circle at (370, 680) with radius 30
        let cx: i64 = 370;
        let cy: i64 = 680;
        let r: i64 = 30;
        // ~30 * 0.552
        let k: i64 = 17;
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", (cx + r).to_string(), cy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} {} {} {} {} c\n", (cx + r).to_string(), cy + k, cx + k, cy + r, cx, cy + r));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} {} {} {} {} c\n", (cx - k).to_string(), cy + r, cx - r, cy + k, cx - r, cy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} {} {} {} {} c\n", (cx - r).to_string(), cy - k, cx - k, cy - r, cx, cy - r));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} {} {} {} {} c\n", (cx + k).to_string(), cy - r, cx + r, cy - k, cx + r, cy));
        GrowableBuffer::writeString(&stream_buf, "B\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a HEART shape using bezier curves - red/pink fill
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0.8 0 0.2 RG\n");
        GrowableBuffer::writeString(&stream_buf, "1 0.4 0.5 rg\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        GrowableBuffer::writeString(&stream_buf, "140 480 m\n");
        GrowableBuffer::writeString(&stream_buf, "90 510 80 560 110 580 c\n");
        GrowableBuffer::writeString(&stream_buf, "130 595 140 580 140 565 c\n");
        GrowableBuffer::writeString(&stream_buf, "140 580 150 595 170 580 c\n");
        GrowableBuffer::writeString(&stream_buf, "200 560 190 510 140 480 c\n");
        GrowableBuffer::writeString(&stream_buf, "h\n");
        GrowableBuffer::writeString(&stream_buf, "B\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a SNOWFLAKE pattern using lines
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0 0.5 0.8 RG\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        let sx: i64 = 300;
        let sy: i64 = 530;
        let arm: i64 = 50;
        // Main 6 arms of snowflake
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", sx.to_string(), sy + arm));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx + 43).to_string(), sy + 25));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx + 43).to_string(), sy - 25));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", sx.to_string(), sy - arm));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx - 43).to_string(), sy - 25));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", sx.to_string(), sy));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx - 43).to_string(), sy + 25));
        // Branches
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", (sx - 10).to_string(), (sy + arm) - 10));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", sx.to_string(), sy + arm));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx + 10).to_string(), (sy + arm) - 10));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} m\n", (sx - 10).to_string(), (sy - arm) + 10));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", sx.to_string(), sy - arm));
        GrowableBuffer::writeString(&stream_buf, &format!("{} {} l\n", (sx + 10).to_string(), (sy - arm) + 10));
        GrowableBuffer::writeString(&stream_buf, "S\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a STAR shape using lines
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0.8 0.6 0 RG\n");
        GrowableBuffer::writeString(&stream_buf, "1 0.9 0.3 rg\n");
        GrowableBuffer::writeString(&stream_buf, "2 w\n");
        GrowableBuffer::writeString(&stream_buf, "460 575 m\n");
        GrowableBuffer::writeString(&stream_buf, "472 545 l\n");
        GrowableBuffer::writeString(&stream_buf, "505 545 l\n");
        GrowableBuffer::writeString(&stream_buf, "478 522 l\n");
        GrowableBuffer::writeString(&stream_buf, "488 490 l\n");
        GrowableBuffer::writeString(&stream_buf, "460 508 l\n");
        GrowableBuffer::writeString(&stream_buf, "432 490 l\n");
        GrowableBuffer::writeString(&stream_buf, "442 522 l\n");
        GrowableBuffer::writeString(&stream_buf, "415 545 l\n");
        GrowableBuffer::writeString(&stream_buf, "448 545 l\n");
        GrowableBuffer::writeString(&stream_buf, "h\n");
        GrowableBuffer::writeString(&stream_buf, "B\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw decorative line
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0.5 0.5 0.5 RG\n");
        GrowableBuffer::writeString(&stream_buf, "1 w\n");
        GrowableBuffer::writeString(&stream_buf, "50 450 m\n");
        GrowableBuffer::writeString(&stream_buf, "562 450 l\n");
        GrowableBuffer::writeString(&stream_buf, "S\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Draw a curved wave/ribbon
        GrowableBuffer::writeString(&stream_buf, "q\n");
        GrowableBuffer::writeString(&stream_buf, "0.6 0 0.6 RG\n");
        GrowableBuffer::writeString(&stream_buf, "3 w\n");
        GrowableBuffer::writeString(&stream_buf, "50 400 m\n");
        GrowableBuffer::writeString(&stream_buf, "150 450 200 350 300 400 c\n");
        GrowableBuffer::writeString(&stream_buf, "400 450 450 350 550 400 c\n");
        GrowableBuffer::writeString(&stream_buf, "S\n");
        GrowableBuffer::writeString(&stream_buf, "Q\n");
        // Add the main text
        GrowableBuffer::writeString(&stream_buf, "BT\n");
        GrowableBuffer::writeString(&stream_buf, "/F1 36 Tf\n");
        GrowableBuffer::writeString(&stream_buf, "100 320 Td\n");
        GrowableBuffer::writeString(&stream_buf, &format!("({}) Tj\n", self.escapeText(message)));
        GrowableBuffer::writeString(&stream_buf, "ET\n");
        // Add subtitle
        GrowableBuffer::writeString(&stream_buf, "BT\n");
        GrowableBuffer::writeString(&stream_buf, "/F1 14 Tf\n");
        GrowableBuffer::writeString(&stream_buf, "100 280 Td\n");
        GrowableBuffer::writeString(&stream_buf, "(Generated by Ranger PDF Writer) Tj\n");
        GrowableBuffer::writeString(&stream_buf, "ET\n");
        // Add shape labels
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n");
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n");
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n");
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n");
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n");
        GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n");
        // Add image label and metadata if we have an image
        if has_image {
            GrowableBuffer::writeString(&stream_buf, "BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n");
            // Display EXIF metadata below image if available
            if self.lastImageMetadata.is_some() {
                let mut meta: Rc<RefCell<JPEGMetadataInfo>> = self.lastImageMetadata.clone()
                    .unwrap();
                let mut meta_y: i64 = 240;
                // Header
                GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 12 Tf\n400 {} Td\n(Image Metadata:) Tj\nET\n", meta_y));
                meta_y -= 14;
                // Dimensions
                GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Size: {} x {}) Tj\nET\n", meta_y, meta.borrow().width, meta.borrow().height));
                meta_y -= 12;
                if meta.borrow().hasExif {
                    // Camera info
                    if !meta.borrow().cameraMake.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Make: {}) Tj\nET\n", meta_y, self.escapeText(&meta.borrow().cameraMake.clone())));
                        meta_y -= 12;
                    }
                    if !meta.borrow().cameraModel.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Model: {}) Tj\nET\n", meta_y, self.escapeText(&meta.borrow().cameraModel.clone())));
                        meta_y -= 12;
                    }
                    if !meta.borrow().dateTimeOriginal.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Date: {}) Tj\nET\n", meta_y, self.escapeText(&meta.borrow().dateTimeOriginal.clone())));
                        meta_y -= 12;
                    }
                    if !meta.borrow().exposureTime.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Exposure: {} sec) Tj\nET\n", meta_y, meta.borrow().exposureTime));
                        meta_y -= 12;
                    }
                    if !meta.borrow().fNumber.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Aperture: f/{}) Tj\nET\n", meta_y, meta.borrow().fNumber));
                        meta_y -= 12;
                    }
                    if !meta.borrow().isoSpeed.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(ISO: {}) Tj\nET\n", meta_y, meta.borrow().isoSpeed));
                        meta_y -= 12;
                    }
                    if !meta.borrow().focalLength.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Focal Length: {} mm) Tj\nET\n", meta_y, meta.borrow().focalLength));
                        meta_y -= 12;
                    }
                    if !meta.borrow().flash.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Flash: {}) Tj\nET\n", meta_y, meta.borrow().flash));
                        meta_y -= 12;
                    }
                }
                if meta.borrow().hasGPS {
                    GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(--- GPS Data ---) Tj\nET\n", meta_y));
                    meta_y -= 12;
                    if !meta.borrow().gpsLatitude.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Latitude: {}) Tj\nET\n", meta_y, meta.borrow().gpsLatitude));
                        meta_y -= 12;
                    }
                    if !meta.borrow().gpsLongitude.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Longitude: {}) Tj\nET\n", meta_y, meta.borrow().gpsLongitude));
                        meta_y -= 12;
                    }
                    if !meta.borrow().gpsAltitude.is_empty() {
                        GrowableBuffer::writeString(&stream_buf, &format!("BT\n/F1 9 Tf\n400 {} Td\n(Altitude: {}) Tj\nET\n", meta_y, meta.borrow().gpsAltitude));
                        meta_y -= 12;
                    }
                }
            }
        }
        // Content stream object
        let stream_len: i64 = GrowableBuffer::size(&stream_buf);
        let stream_content: String = GrowableBuffer::toString(&stream_buf);
        self.writeObject(&format!("<< /Length {} >>\nstream\n{}endstream", stream_len, stream_content));
        // Font object
        self.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        // Cross-reference table
        let mut root_obj_num: i64 = 1;
        if has_image {
            root_obj_num = 2;
        }
        let xref_offset: i64 = GrowableBuffer::size(&buf);
        GrowableBuffer::writeString(&buf, "xref\n");
        GrowableBuffer::writeString(&buf, &format!("0 {}\n", self.nextObjNum));
        GrowableBuffer::writeString(&buf, "0000000000 65535 f \n");
        let __it_offset = self.objectOffsets.clone();
        for offset in __it_offset.iter().copied() {
            let mut offset_str: String = offset.to_string();
            while (PdfText::str_len(&offset_str) as i64) < 10 {
                offset_str = format!("0{}", offset_str);
            }
            GrowableBuffer::writeString(&buf, &format!("{} 00000 n \n", offset_str));
        }
        // Trailer
        GrowableBuffer::writeString(&buf, "trailer\n");
        GrowableBuffer::writeString(&buf, &format!("<< /Size {} /Root {} 0 R >>\n", self.nextObjNum, root_obj_num));
        GrowableBuffer::writeString(&buf, "startxref\n");
        GrowableBuffer::writeString(&buf, &format!("{}\n", xref_offset.to_string()));
        GrowableBuffer::writeString(&buf, "%%EOF\n");
        return GrowableBuffer::toBuffer(&buf);
    }
    pub fn savePDF(&mut self, path: &str, filename: &str, message: &str) {
        let mut pdf_content: Vec<u8> = self.createHelloWorldPDF(message);
        PdfText::write_file(path.to_string(), filename.to_string(), pdf_content);
        println!("PDF saved to {}/{}", path, filename);
    }
    pub fn savePDFWithImage(&mut self, path: &str, filename: &str, message: &str, image_dir_path: &str, image_file_name: &str) {
        let mut pdf_content: Vec<u8> = self.createPDFWithImage(message,
            image_dir_path,
            image_file_name
        );
        PdfText::write_file(path.to_string(), filename.to_string(), pdf_content);
        println!("PDF saved to {}/{}", path, filename);
    }
}

#[derive(Clone)]
pub struct Main {
}

impl Main {
    pub fn new() -> Self {
        Self {
        }
    }
}
