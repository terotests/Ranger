// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::font_manager::FontManager;
use crate::jpeg_metadata::JPEGMetadataInfo;
use crate::jpeg_metadata::JPEGMetadataParser;
use crate::jpeg_reader::JPEGImage;
use crate::jpeg_reader::JPEGReader;
use crate::pdf_writer::PDFWriter;
use crate::rgr::{PdfOpt, PdfText};
use crate::true_type_font::TTFShapedRun;
use crate::true_type_font::TrueTypeFont;
use crate::ttf_subset::TTFSubset;
use crate::utf8::Utf8;
use crate::rgr::{EVGBox, PDFImageMeasurer, EVGCodepoint, EVGColor, EVGDisplayList, EVGElement, EVGGrapheme, EVGImageDimensions, EVGLayout, EVGTextEngine, EVGUnit, GrowableBuffer, ImageBuffer, JPEGDecoder, JPEGEncoder, Matrix2D, PathBounds, PathCommand, PdfFlate, SVGPathParser, SimpleTextMeasurer, SvgDocument, SvgParser, SvgVectorItem, VectorStroke, VectorViewBox, ViewBoxRect};

/// EVGPDFRenderer.rgr - Render EVG elements to PDF
///
/// Takes EVG element tree with calculated positions and renders to PDF using PDFWriter.
/// Helper class to track embedded fonts
#[derive(Clone)]
pub struct EmbeddedFont {
    pub name: String,
    pub fontObjNum: i64,
    pub fontDescObjNum: i64,
    pub fontFileObjNum: i64,
    pub pdfName: String,
    pub ttfFont: Option<Rc<RefCell<TrueTypeFont>>>,
}

impl EmbeddedFont {
    pub fn new(n: String, pn: String, font: Rc<RefCell<TrueTypeFont>>) -> Self {
        let mut me = Self {
            name: String::new(),
            fontObjNum: 0,
            fontDescObjNum: 0,
            fontFileObjNum: 0,
            pdfName: String::new(),
            ttfFont: None,
        };
        me.name = n.clone();
        me.pdfName = pn.clone();
        me.ttfFont = Some(font.clone());
        me
    }
}

/// Helper class to track embedded images
#[derive(Clone)]
pub struct EmbeddedImage {
    pub src: String,
    pub objNum: i64,
    pub width: i64,
    pub height: i64,
    pub orientation: i64,
    pub pdfName: String,
}

impl EmbeddedImage {
    pub fn new(s: String) -> Self {
        let mut me = Self {
            src: String::new(),
            objNum: 0,
            width: 0,
            height: 0,
            orientation: 1,
            pdfName: String::new(),
        };
        me.src = s.clone();
        me
    }
}




/// One stretch of a line drawn from a single face.
///
/// A line like "Ready 🎉" cannot be one show operator: the text face has no
/// emoji and the emoji face has no letters, and the two are reached through
/// different PDF font resources with different encodings — WinAnsi for the text,
/// Identity-H for the emoji, because WinAnsi is single-byte and has no room for
/// U+1F389 at all. So the line is cut at every face change and each piece is
/// positioned on its own.
#[derive(Clone)]
pub struct PDFTextSegment {
    pub text: String,
    pub family: String,
    /// True when this piece is drawn from a fallback face through a Type0/CID
    /// resource rather than the document's own WinAnsi one.
    pub isCid: bool,
    /// Absolute x, accumulated from the measured width of the pieces before it.
    pub x: f64,
}

impl PDFTextSegment {
    pub fn new() -> Self {
        Self {
            text: String::new(),
            family: String::new(),
            isCid: false,
            x: 0.0,
        }
    }
}

pub struct EVGPDFRenderer {
    /// Note: No longer extends EVGImageMeasurer - uses composition instead
    imageMeasurer: Option<Rc<RefCell<PDFImageMeasurer>>>,
    pub writer: Option<Rc<RefCell<PDFWriter>>>,
    layout: Option<Rc<RefCell<EVGLayout>>>,
    measurer: Option<Rc<RefCell<EVGTextMeasurer>>>,
    streamBuffer: Option<Rc<RefCell<GrowableBuffer>>>,
    /// Characters dropped by WinAnsi encoding, reported at the end of a run.
    /// Print bleed in points. When > 0 the sheet grows by this much on every
    /// side, the page content is shifted into the middle, and the PDF declares a
    /// TrimBox so a printer knows where the finished page actually ends.
    pub bleed: f64,
    /// --- print finishing -----------------------------------------------------
    /// "rgb" writes the device colours it always wrote. "cmyk" converts every
    /// fill, stroke and glyph to process ink on the way out, which is what a
    /// sheet-fed press wants and what PDF/X-1a requires.
    pub colorMode: String,
    /// --- transparency ---------------------------------------------------------
    ///
    /// PDF has no alpha on a colour. A fill is `r g b rg` and that is all three
    /// numbers it gets; anything translucent is a GRAPHICS STATE, named in the
    /// page's resources and switched on with `gs` before the paint.
    ///
    /// Left out, every alpha in the document was silently 1: a chart's shaded
    /// band, drawn at a tenth opacity in the editor and in the PNG, came out of
    /// the PDF as a slab of solid blue over the plot it was meant to sit behind.
    /// Nothing reported it — the file was valid and the colour was right; only
    /// the alpha was gone.
    ///
    /// One state per distinct (fill alpha, stroke alpha) pair, because a shape
    /// can be translucent on one and not the other, and because a document with
    /// four hundred translucent shapes should carry one dictionary rather than
    /// four hundred.
    pub alphaFills: Vec<f64>,
    pub alphaStrokes: Vec<f64>,
    /// "" for an ordinary PDF, or "X-4" / "X-1a" to identify the file as one.
    /// The identification is a claim, and a claim has obligations: an output
    /// intent, a Trapped value, embedded fonts, and the boxes the bleed code
    /// already writes.
    pub pdfxProfile: String,
    /// The printing condition the colours are for. A registered characterization
    /// name - FOGRA39 for European coated offset, CGATS TR 001 for US web - is
    /// what lets an output intent be legal without shipping an ICC profile in
    /// the file. It is not a colour transform and does not pretend to be one.
    pub outputIntent: String,
    pub outputIntentInfo: String,
    pub docTitle: String,
    pub docAuthor: String,
    pub producer: String,
    /// How many pictures went in as untagged DeviceRGB. In an RGB workflow that
    /// is exactly right; in a CMYK one it is the gap between "the vectors are
    /// separated" and "this file is PDF/X", and it is counted rather than
    /// assumed away.
    pub rgbImages: i64,
    pub unsupportedGlyphs: Vec<i64>,
    pub unsupportedContexts: Vec<String>,
    pub pageWidth: f64,
    pub pageHeight: f64,
    pub nextObjNum: i64,
    pub fontObjNum: i64,
    pub pagesObjNum: i64,
    pub contentObjNums: Vec<i64>,
    pub pageCount: i64,
    pub debug: bool,
    pub fontManager: Rc<RefCell<FontManager>>,
    pub embeddedFonts: Vec<Rc<RefCell<EmbeddedFont>>>,
    pub usedFontNames: Vec<String>,
    /// Link annotations, gathered while the content stream is written and
    /// emitted on the page dictionary afterwards. A page's ink and its
    /// annotations live in different parts of the file, so they are collected
    /// here rather than written where they are found.
    pub linkPage: Vec<i64>,
    pub linkUrl: Vec<String>,
    pub linkX: Vec<f64>,
    pub linkY: Vec<f64>,
    pub linkW: Vec<f64>,
    pub linkH: Vec<f64>,
    pub curLinkPage: i64,
    /// Fallback faces reached through a Type0/Identity-H resource, named /E1..
    /// alongside the WinAnsi /F1.. ones. Kept separate rather than converting
    /// every font to Identity-H: that would change the byte encoding, the
    /// /Widths shape and the ToUnicode cmap of text that is currently correct,
    /// to fix text that currently cannot be written at all.
    pub usedCidFonts: Vec<String>,
    pub cidFontObjNums: Vec<i64>,
    /// Every glyph actually drawn from a CID face, as three parallel arrays.
    /// Identity-H writes GLYPH IDS into the content stream, so the /W array and
    /// the ToUnicode cmap have to be built from what was drawn — there is no
    /// character range to enumerate the way WinAnsi's 32..255 gives one.
    pub cidUsedFont: Vec<i64>,
    pub cidUsedGid: Vec<i64>,
    /// The TEXT each glyph came from, not a single codepoint: one glyph can be
    /// five codepoints (a joined family), and a /ToUnicode entry naming only the
    /// first would hand a reader a fragment when the emoji is copied out.
    pub cidUsedText: Vec<String>,
    pub embeddedImages: Vec<Rc<RefCell<EmbeddedImage>>>,
    pub jpegReader: Rc<RefCell<JPEGReader>>,
    jpegDecoder: Rc<RefCell<JPEGDecoder>>,
    jpegEncoder: Rc<RefCell<JPEGEncoder>>,
    pub metadataParser: Rc<RefCell<JPEGMetadataParser>>,
    /// --- pictures handed over rather than found ---------------------------------
    ///
    /// Everything below resolves a picture's `src` as a PATH: it is split into a
    /// directory and a file name and read from disk, and every decoder under it
    /// takes the same pair. That is right for a page written as TSX beside its
    /// images, and impossible for two other callers this renderer now has:
    ///
    ///   * a document. A .pptx, a .docx and a .xlsx name their pictures by
    ///     PACKAGE PART — "ppt/media/image1.png" — and carry the bytes inside
    ///     the ZIP. There is no such file on disk, and the reader that opened
    ///     the document already decoded them.
    ///   * a browser. There is no disk at all.
    ///
    /// So a caller can hand the pixels over by name. `registerImage` takes the
    /// `src` a display list will use and the decoded image, and both the
    /// measuring pass and the embedding pass look here before they look at the
    /// file system. Nothing else changes: the pixels go through the same resize
    /// and the same JPEG encoding as a picture read from a file, so a supplied
    /// picture and a found one produce the same PDF object.
    ///
    /// Before this, a document with a logo in it did not print without one — it
    /// called `readJPEG` on a path that does not exist and the process died on
    /// ENOENT.
    suppliedImages: HashMap<String,Rc<RefCell<ImageBuffer>>>,
    /// face key → the object number of the FontFile2 stream already written for
    /// it, so a second name resolving to the same face points at the first copy.
    pub fontFileByFace: HashMap<String,i64>,
    pub baseDir: String,
    /// Multiple asset directories for image resolution
    pub assetPaths: Vec<String>,
    pub maxImageWidth: i64,
    pub maxImageHeight: i64,
    pub jpegQuality: i64,
    imageDimensionsCache: Vec<Rc<RefCell<EVGImageDimensions>>>,
    pub imageDimensionsCacheKeys: Vec<String>,
    /// Temporary arrays for collecting elements (fixes Go slice parameter issue)
    foundSections: Vec<Rc<RefCell<EVGElement>>>,
    foundPages: Vec<Rc<RefCell<EVGElement>>>,
}

impl EVGPDFRenderer {
    pub fn new() -> Self {
        let mut me = Self {
            imageMeasurer: None,
            writer: None,
            layout: None,
            measurer: None,
            streamBuffer: None,
            bleed: 0.0,
            colorMode: "rgb".to_string(),
            alphaFills: Vec::new(),
            alphaStrokes: Vec::new(),
            pdfxProfile: String::new(),
            outputIntent: "FOGRA39".to_string(),
            outputIntentInfo: "Coated FOGRA39 (ISO 12647-2:2004)".to_string(),
            docTitle: String::new(),
            docAuthor: String::new(),
            producer: "Ranger EVG PDF writer".to_string(),
            rgbImages: 0,
            unsupportedGlyphs: Vec::new(),
            unsupportedContexts: Vec::new(),
            pageWidth: 595.0,
            pageHeight: 842.0,
            nextObjNum: 1,
            fontObjNum: 0,
            pagesObjNum: 0,
            contentObjNums: Vec::new(),
            pageCount: 1,
            debug: false,
            fontManager: Rc::new(RefCell::new(FontManager::new())),
            embeddedFonts: Vec::new(),
            usedFontNames: Vec::new(),
            linkPage: Vec::new(),
            linkUrl: Vec::new(),
            linkX: Vec::new(),
            linkY: Vec::new(),
            linkW: Vec::new(),
            linkH: Vec::new(),
            curLinkPage: 0,
            usedCidFonts: Vec::new(),
            cidFontObjNums: Vec::new(),
            cidUsedFont: Vec::new(),
            cidUsedGid: Vec::new(),
            cidUsedText: Vec::new(),
            embeddedImages: Vec::new(),
            jpegReader: Rc::new(RefCell::new(JPEGReader::new())),
            jpegDecoder: Rc::new(RefCell::new(JPEGDecoder::new())),
            jpegEncoder: Rc::new(RefCell::new(JPEGEncoder::new())),
            metadataParser: Rc::new(RefCell::new(JPEGMetadataParser::new())),
            suppliedImages: HashMap::new(),
            fontFileByFace: HashMap::new(),
            baseDir: "./".to_string(),
            assetPaths: Vec::new(),
            maxImageWidth: 800,
            maxImageHeight: 800,
            jpegQuality: 75,
            imageDimensionsCache: Vec::new(),
            imageDimensionsCacheKeys: Vec::new(),
            foundSections: Vec::new(),
            foundPages: Vec::new(),
        };
        let mut w_1: Rc<RefCell<PDFWriter>> = Rc::new(RefCell::new(PDFWriter::new()));
        me.writer = Some(w_1.clone());
        let mut lay: Rc<RefCell<EVGLayout>> = Rc::new(RefCell::new(EVGLayout::new()));
        me.layout = Some(lay.clone());
        let mut m_2: Rc<RefCell<SimpleTextMeasurer>> = Rc::new(RefCell::new(SimpleTextMeasurer::new()));
        me.measurer = Some(m_2.clone());
        let mut buf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        me.streamBuffer = Some(buf.clone());
        let mut ef: Vec<Rc<RefCell<EmbeddedFont>>> = Vec::new();
        me.embeddedFonts = ef.clone();
        let mut uf: Vec<String> = Vec::new();
        me.usedFontNames = uf.clone();
        let mut ei: Vec<Rc<RefCell<EmbeddedImage>>> = Vec::new();
        me.embeddedImages = ei.clone();
        let mut idc: Vec<Rc<RefCell<EVGImageDimensions>>> = Vec::new();
        me.imageDimensionsCache = idc.clone();
        let mut idck: Vec<String> = Vec::new();
        me.imageDimensionsCacheKeys = idck.clone();
        let mut ap: Vec<String> = Vec::new();
        me.assetPaths = ap.clone();
        let mut fs: Vec<Rc<RefCell<EVGElement>>> = Vec::new();
        me.foundSections = fs.clone();
        let mut fp: Vec<Rc<RefCell<EVGElement>>> = Vec::new();
        me.foundPages = fp.clone();
        // Create the image measurer delegate
        let mut img_measurer: Rc<RefCell<PDFImageMeasurer>> = Rc::new(RefCell::new(PDFImageMeasurer::new()));
        me.imageMeasurer = Some(img_measurer.clone());
        me
    }
    /// The face a name resolves to, as a key. Two NAMES can resolve to one FACE
    /// — a family whose italic was never loaded answers the regular one for both
    /// — and each was embedding the whole file again. On a five-slide deck that
    /// was 217KB of byte-identical duplicate in a 531KB file.
    pub fn faceKey(f: &Rc<RefCell<TrueTypeFont>>) -> String {
        return format!("{}/{}", f.borrow().fontFamily, f.borrow().fontStyle);
    }
    /// RGB to process ink, with maximum black generation.
    ///
    /// This is a DEVICE conversion: no profile is consulted, so it is what a
    /// press would do to untagged RGB anyway, done here where it can at least be
    /// declared. The one thing it gets right that matters more than accuracy is
    /// that pure black comes out as 100% K and nothing else - text separated into
    /// four inks is text that goes soft the moment the registration drifts, and
    /// it is the single most common way a good-looking file prints badly.
    ///
    /// Anything better needs an ICC transform. Preflight says so rather than
    /// letting the number look authoritative.
    pub fn toCmyk(r: f64, g: f64, b: f64) -> Vec<f64> {
        let mut out: Vec<f64> = Vec::new();
        let c: f64 = 1.0 - r;
        let m: f64 = 1.0 - g;
        let y: f64 = 1.0 - b;
        let mut k: f64 = c;
        if m < k {
            k = m;
        }
        if y < k {
            k = y;
        }
        if k >= 0.9999 {
            out.push(0.0);
            out.push(0.0);
            out.push(0.0);
            out.push(1.0);
            return out;
        }
        let span: f64 = 1.0 - k;
        out.push((c - k) / span);
        out.push((m - k) / span);
        out.push((y - k) / span);
        out.push(k);
        out
    }
    pub fn clampAlpha(a: f64) -> f64 {
        if a < 0.0 {
            return 0.0;
        }
        if a > 1.0 {
            return 1.0;
        }
        a
    }
    /// Two alphas the same to within what a PDF viewer can tell apart. Compared
    /// exactly, a value arrived at by arithmetic makes a second state that draws
    /// the same picture.
    pub fn sameAlpha(a: f64, b: f64) -> bool {
        let mut d: f64 = a - b;
        if d < 0.0 {
            d = 0.0 - d;
        }
        d < 0.002
    }
    pub fn pdfString(v: &str) -> String {
        let mut out: String = String::new();
        let n: i64 = PdfText::str_len(&v) as i64;
        let mut i: i64 = 0;
        while i < n {
            let ch: String = PdfText::substr(&v, i, i + 1);
            if ch == "(" {
                out.push_str("\\(");
            } else {
                if ch == ")" {
                    out.push_str("\\)");
                } else {
                    if ch == "\\" {
                        out.push_str("\\\\");
                    } else {
                        out.push_str(&ch);
                    }
                }
            }
            i += 1;
        }
        out
    }
    /// XML-safe AND ASCII-safe.
    ///
    /// The second half is not decoration: `GrowableBuffer.writeString` writes one
    /// byte per UTF-16 unit, so a title with an umlaut in it would go into the
    /// stream as a single mangled byte inside a packet that declares itself
    /// UTF-8. Numeric character references keep the text correct and keep the
    /// packet ASCII, which also makes its /Length arithmetic trivially right.
    pub fn xmlEscape(v: &str) -> String {
        let mut out: String = String::new();
        let n: i64 = PdfText::str_len(&v) as i64;
        let mut i: i64 = 0;
        while i < n {
            let code: i64 = PdfText::char_at(&v, i);
            if code == 38 {
                out.push_str("&amp;");
            } else {
                if code == 60 {
                    out.push_str("&lt;");
                } else {
                    if code == 62 {
                        out.push_str("&gt;");
                    } else {
                        if code < 127 {
                            out.push_str(&PdfText::substr(&v, i, i + 1));
                        } else {
                            // A surrogate pair is one character, and referencing
                            // the halves separately is not valid XML.
                            let mut point: i64 = code;
                            let is_high: bool = (code >= 55296 && code <= 56319);
                            if is_high {
                                if i + 1 < n {
                                    let low: i64 = PdfText::char_at(&v, i + 1);
                                    let is_low: bool = (low >= 56320 && low <= 57343);
                                    if is_low {
                                        let hi: i64 = (code - 55296) * 1024;
                                        let lo: i64 = low - 56320;
                                        point = (hi + lo) + 65536;
                                        i += 1;
                                    }
                                }
                            }
                            out.push_str(&format!("&#{};", point));
                        }
                    }
                }
            }
            i += 1;
        }
        out
    }
    /// A PDF text string. Pure ASCII goes in as a literal; anything else becomes
    /// UTF-16BE with a byte-order mark, which is the only encoding a PDF reader
    /// is required to understand for text outside PDFDocEncoding. Writing the raw
    /// units would put one truncated byte per character into the file.
    pub fn pdfTextString(v: &str) -> String {
        let n: i64 = PdfText::str_len(&v) as i64;
        let mut ascii: bool = true;
        let mut i: i64 = 0;
        while i < n {
            let code: i64 = PdfText::char_at(&v, i);
            if code > 126 {
                ascii = false;
            }
            i += 1;
        }
        if ascii {
            return format!("({})", EVGPDFRenderer::pdfString(v));
        }
        let mut out: String = "<FEFF".to_string();
        let mut k: i64 = 0;
        while k < n {
            let unit: i64 = PdfText::char_at(&v, k);
            { let _tmp_2328 = format!("{}", EVGPDFRenderer::hex4(unit)); out.push_str(&_tmp_2328); }
            k += 1;
        }
        format!("{}>", out)
    }
    pub fn hex4(v: i64) -> String {
        let digits: String = "0123456789ABCDEF";
        let mut out: String = String::new();
        let mut shift: i64 = 12;
        while shift >= 0 {
            let nib: i64 = (v / (EVGPDFRenderer::pow16(shift))) % 16;
            out.push_str(&PdfText::substr(&digits, nib, nib + 1));
            shift -= 4;
        }
        out
    }
    pub fn pow16(shift: i64) -> i64 {
        if shift <= 0 {
            return 1;
        }
        if shift == 4 {
            return 16;
        }
        if shift == 8 {
            return 256;
        }
        4096
    }
    /// The packet's length in BYTES. `strlen` counts UTF-16 units, and a title
    /// with an umlaut in it would leave /Length short by one for every non-ASCII
    /// character - a stream that ends early is a file no reader will open.
    pub fn byteLength(v: &str) -> i64 {
        let mut scratch: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        GrowableBuffer::writeString(&scratch, v);
        return GrowableBuffer::size(&scratch);
    }
    /// --- streams, written small --------------------------------------------------
    ///
    /// Every stream here used to be written raw. `/FlateDecode` is what PDF has
    /// for that, and it is the same deflate the PNG writer uses. Compressed data
    /// that is already compressed grows, so a stream that did not shrink is
    /// written as it was — see `PdfFlate.worthIt`.
    fn writeStream(&self, pdf: &Rc<RefCell<GrowableBuffer>>, body: &[u8], extra: &str) {
        let mut packed: Vec<u8> = PdfFlate::zlib(body);
        let raw: i64 = body.len() as i64;
        if PdfFlate::worthIt(body, &packed) {
            GrowableBuffer::writeString(&pdf, &format!("<< /Length {} /Filter /FlateDecode{} >>\n", packed.len() as i64, extra));
            GrowableBuffer::writeString(&pdf, "stream\n");
            GrowableBuffer::writeBuffer(&pdf, &packed);
        } else {
            GrowableBuffer::writeString(&pdf, &format!("<< /Length {}{} >>\n", raw, extra));
            GrowableBuffer::writeString(&pdf, "stream\n");
            GrowableBuffer::writeBuffer(&pdf, body);
        }
        GrowableBuffer::writeString(&pdf, "\nendstream\n");
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
    }
    fn registerImage(&mut self, src: &str, pixels: Rc<RefCell<ImageBuffer>>) {
        self.suppliedImages.insert(src.to_string(), pixels.clone());
    }
    fn suppliedImage(&self, src: &str) -> Option<Rc<RefCell<ImageBuffer>>> {
        let mut hit: Option<Rc<RefCell<ImageBuffer>>> = self.suppliedImages.get(src)
            .cloned();
        hit
    }
    /// Initialize components that require 'this' reference
    /// Must be called after construction for C++ compatibility
    /// For Rust: selfRc must be the Rc<RefCell<Self>> that wraps this object
    pub fn init(&self, self_rc: Rc<RefCell<EVGPDFRenderer>>) {
        // Set up the image measurer with reference to this renderer
        // selfRc is passed in - in C++/JS/Go it's just 'this', in Rust it's the Rc
        let mut img_m: Rc<RefCell<PDFImageMeasurer>> = self.imageMeasurer.clone()
            .unwrap();
        img_m.borrow().setRenderer(self_rc.clone());
        EVGLayout::setImageMeasurer(&self.layout.as_ref().unwrap().clone(), img_m.clone());
    }
    pub fn setPageSize(&mut self, width: f64, height: f64) {
        self.pageWidth = width;
        self.pageHeight = height;
        EVGLayout::setPageSize(&self.layout.as_ref().unwrap().clone(), width, height);
    }
    pub fn setBaseDir(&mut self, dir: String) {
        self.baseDir = dir.clone();
    }
    /// Set multiple asset directories from semicolon-separated string
    /// Example: "./images;./assets/photos"
    pub fn setAssetPaths(&mut self, paths: &str) {
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
                    self.assetPaths.push(part.clone());
                    println!("EVGPDFRenderer: Added asset path: {}", part);
                }
                start = i + 1;
            }
            i += 1;
        }
    }
    /// Resolve an image path, searching asset directories
    pub fn resolveImagePath(&self, src: &str) -> String {
        // Remove leading "./" if present
        let mut img_src: String = src.to_string();
        if (PdfText::str_len(&src) as i64) > 2 {
            let prefix: String = PdfText::substr(&src, 0, 2);
            if prefix == "./" {
                img_src = PdfText::substr(&src, 2, (PdfText::str_len(&src) as i64));
            }
        }
        // First try relative to baseDir
        let full_path: String = format!("{}{}", self.baseDir, img_src);
        // Could check file existence here and fall back to asset paths
        // For now return baseDir-relative path
        // In future, iterate assetPaths and check file existence
        full_path
    }
    pub fn setStrictFonts(&self, s: bool) {
        EVGLayout::setStrictFonts(&self.layout.as_ref().unwrap().clone(), s);
    }
    /// A field with no initializer is optional in Ranger; the constructor
    /// always sets this one.
    fn getLayout(&self) -> Rc<RefCell<EVGLayout>> {
        self.layout.clone().unwrap()
    }
    fn getTextEngine(&self) -> Rc<RefCell<EVGTextEngine>> {
        return EVGLayout::getTextEngine(&self.layout.as_ref().unwrap());
    }
    fn setMeasurer(&mut self, m: Rc<RefCell<EVGTextMeasurer>>) {
        self.measurer = Some(m.clone());
        EVGLayout::setMeasurer(&self.layout.as_ref().unwrap().clone(), m.clone());
    }
    pub fn setFontManager(&mut self, fm: Rc<RefCell<FontManager>>) {
        self.fontManager = fm.clone();
    }
    pub fn setDebug(&mut self, enabled: bool) {
        self.layout.as_ref().unwrap().borrow_mut().debug = enabled;
        self.debug = enabled;
    }
    /// Load image dimensions from file (not a trait method - uses caching)
    fn loadImageDimensions(&mut self, src: &str) -> Rc<RefCell<EVGImageDimensions>> {
        // Check cache first
        let mut i: i64 = 0;
        while i < (self.imageDimensionsCacheKeys.len() as i64) {
            let key: String = self.imageDimensionsCacheKeys[i as usize].clone();
            if key == src {
                return self.imageDimensionsCache[i as usize].clone();
            }
            i += 1;
        }
        // Handed over by the caller? Then the pixels are already here and there
        // is no file to open — see `suppliedImages`. Cached like any other, so
        // a picture used on twenty slides is measured once.
        let mut supplied_dims: Option<Rc<RefCell<ImageBuffer>>> = self.suppliedImage(src);
        if supplied_dims.is_some() {
            let mut sp: Rc<RefCell<ImageBuffer>> = supplied_dims.clone().unwrap();
            let mut _tmp_2338 = sp.borrow().width.clone();
            let mut known: Rc<RefCell<EVGImageDimensions>> = EVGImageDimensions::create(_tmp_2338, sp.borrow().height.clone());
            self.imageDimensionsCacheKeys.push(src.to_string());
            self.imageDimensionsCache.push(known.clone());
            return known;
        }
        // Not in cache, load from file
        let mut dims: Rc<RefCell<EVGImageDimensions>> = Rc::new(RefCell::new(EVGImageDimensions::new()));
        // Resolve the image path - handle relative paths like "./bin/image.jpg"
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
            // Combine baseDir with the path from imgSrc
            img_dir = format!("{}{}", self.baseDir, PdfText::substr(&img_src, 0, last_sep + 1));
            img_file = PdfText::substr(&img_src, last_sep + 1, (PdfText::str_len(&img_src) as i64));
        } else {
            // No path separator, use baseDir directly
            img_dir = self.baseDir.clone();
            img_file = img_src.clone();
        }
        // Read JPEG dimensions using JPEGReader
        let mut reader: Rc<RefCell<JPEGReader>> = Rc::new(RefCell::new(JPEGReader::new()));
        let mut jpeg_image: Rc<RefCell<JPEGImage>> = reader.borrow().readJPEG(&img_dir, &img_file);
        // If file not found, try with ./assets/ prefix (same fallback as ResourceLoader)
        if !jpeg_image.borrow().isValid {
            let mut alt_dir_path: String = String::new();
            if PdfText::index_of(&src, "./") == 0 {
                // ./images/photo.jpg -> ./assets/images/photo.jpg
                alt_dir_path = format!("{}assets/{}", self.baseDir, PdfText::substr(&src, 2, (PdfText::str_len(&src) as i64)));
            } else {
                alt_dir_path = format!("{}assets/{}", self.baseDir, src);
            }
            // Extract dir and file from altDirPath
            let alt_last_slash: i64 = PdfText::last_index_of(&alt_dir_path, "/");
            if alt_last_slash >= 0 {
                img_dir = PdfText::substr(&alt_dir_path, 0, alt_last_slash + 1);
                img_file = PdfText::substr(&alt_dir_path, alt_last_slash + 1, (PdfText::str_len(&alt_dir_path) as i64));
            }
            println!("  Trying alternative: dir={} file={}", img_dir, img_file);
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
            dims = EVGImageDimensions::create(img_w, img_h);
            println!("Image dimensions: {} = {}x{} (orientation={})", src, img_w, img_h, orientation);
        }
        // Cache the result
        self.imageDimensionsCacheKeys.push(src.to_string());
        self.imageDimensionsCache.push(dims.clone());
        dims
    }
    pub fn getPdfFontName(&mut self, font_family: &str) -> String {
        // Get the PDF font name (F1, F2, etc.) for a font family
        let mut i: i64 = 0;
        while i < (self.usedFontNames.len() as i64) {
            let name: String = self.usedFontNames[i as usize].clone();
            if name == font_family {
                return format!("/F{}", i + 1);
            }
            i += 1;
        }
        // Not found, add it
        self.usedFontNames.push(font_family.to_string());
        format!("/F{}", self.usedFontNames.len() as i64)
    }
    /// The /E1.. resource for a fallback face, registering it on first use.
    pub fn getCidFontName(&mut self, font_family: &str) -> String {
        format!("/E{}", self.cidFontIndex(font_family) + 1)
    }
    pub fn cidFontIndex(&mut self, font_family: &str) -> i64 {
        let mut i: i64 = 0;
        while i < (self.usedCidFonts.len() as i64) {
            if self.usedCidFonts[i as usize].clone() == font_family {
                return i;
            }
            i += 1;
        }
        self.usedCidFonts.push(font_family.to_string());
        (self.usedCidFonts.len() as i64) - 1
    }
    pub fn noteCidGlyphCluster(&mut self, font_idx: i64, gid: i64, cps: &[i64], start: i64, end: i64) {
        let mut i: i64 = 0;
        while i < (self.cidUsedGid.len() as i64) {
            if self.cidUsedFont[i as usize] == font_idx {
                if self.cidUsedGid[i as usize] == gid {
                    return;
                }
            }
            i += 1;
        }
        let mut text: String = String::new();
        let mut c: i64 = start;
        while c < end {
            {
                text.push_str(&format!("{}", EVGCodepoint::toStr(cps[c as usize])));
            }
            c += 1;
        }
        self.cidUsedFont.push(font_idx);
        self.cidUsedGid.push(gid);
        self.cidUsedText.push(text);
    }
    /// Cut a line wherever the face has to change.
    ///
    /// The primary family wins for everything it can draw, so ordinary text
    /// comes back as exactly one segment and the output is unchanged. Only
    /// codepoints the primary lacks — and that some other loaded face has — are
    /// split out. A codepoint nothing has stays with the primary, where the
    /// WinAnsi encoder reports it as before instead of silently vanishing.
    pub fn splitLine(&self, line: &str, font_family: &str, font_size: f64, start_x: f64) -> Vec<Rc<RefCell<PDFTextSegment>>> {
        let mut segs: Vec<Rc<RefCell<PDFTextSegment>>> = Vec::new();
        let mut primary: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(font_family);
        let mut cps: Vec<i64> = EVGCodepoint::toArray(line);
        let n: i64 = cps.len() as i64;
        let mut cur_text: String = String::new();
        let mut cur_family: String = font_family.to_string();
        let mut cur_is_cid: bool = false;
        let mut have_cur: bool = false;
        let mut x: f64 = start_x;
        let mut i: i64 = 0;
        while i < n {
            // Cut at cluster boundaries, never inside one. Deciding per
            // codepoint split a keycap between the text face and the emoji
            // face, and the ligature that makes it never saw all three parts.
            let c_end: i64 = EVGGrapheme::clusterEnd(&cps, i);
            let mut use_family: String = font_family.to_string();
            let mut use_cid: bool = false;
            if primary.borrow().isLoaded() {
                let mut face: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow().faceForClusterFrom(&primary, &cps, i, c_end);
                if face.borrow().isLoaded() {
                    if !(face.borrow().fontPath == primary.borrow().fontPath) {
                        use_family = face.borrow().fontFamily.clone();
                        use_cid = true;
                    }
                }
            }
            let mut same_run: bool = false;
            if have_cur {
                if use_cid == cur_is_cid {
                    if use_family == cur_family {
                        same_run = true;
                    }
                }
            }
            if !same_run {
                if have_cur {
                    let mut done: Rc<RefCell<PDFTextSegment>> = Rc::new(RefCell::new(PDFTextSegment::new()));
                    done.borrow_mut().text = cur_text.clone();
                    done.borrow_mut().family = cur_family.clone();
                    done.borrow_mut().isCid = cur_is_cid;
                    done.borrow_mut().x = x;
                    segs.push(done.clone());
                    x += self.segmentWidth(&done, font_size);
                }
                cur_text = String::new();
                cur_family = use_family.clone();
                cur_is_cid = use_cid;
                have_cur = true;
            }
            let mut c: i64 = i;
            while c < c_end {
                {
                    cur_text.push_str(&format!("{}", EVGCodepoint::toStr(cps[c as usize])));
                }
                c += 1;
            }
            i = c_end;
        }
        if have_cur {
            let mut last: Rc<RefCell<PDFTextSegment>> = Rc::new(RefCell::new(PDFTextSegment::new()));
            last.borrow_mut().text = cur_text.clone();
            last.borrow_mut().family = cur_family.clone();
            last.borrow_mut().isCid = cur_is_cid;
            last.borrow_mut().x = x;
            segs.push(last.clone());
        }
        segs
    }
    /// A CID segment as a hex string of glyph ids.
    ///
    /// /Encoding /Identity-H means each two bytes of the string ARE a CID, and
    /// /CIDToGIDMap /Identity means the CID is the glyph id — so this writes
    /// glyph numbers, not characters, and there is no encoding table to run out
    /// of. That is the whole reason emoji can go in a PDF this way.
    pub fn cidShowOperator(&mut self, segment: &str, font_family: &str) -> String {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(font_family);
        let font_idx: i64 = self.cidFontIndex(font_family);
        let mut cps: Vec<i64> = EVGCodepoint::toArray(segment);
        let n: i64 = cps.len() as i64;
        let mut out: String = "<".to_string();
        let mut i: i64 = 0;
        while i < n {
            // Shaped one cluster at a time — the same unit the width was
            // measured in, so what is drawn and what was reserved cannot
            // disagree, and so a ligature can never reach across a boundary
            // the cluster rules drew.
            let c_end: i64 = EVGGrapheme::clusterEnd(&cps, i);
            let mut run: Rc<RefCell<TTFShapedRun>> = font.borrow_mut().shapeRange(&cps, i, c_end);
            let mut gi: i64 = 0;
            while gi < (run.borrow().glyphs.len() as i64) {
                let gid: i64 = run.borrow().glyphs[gi as usize];
                // The shaper's cluster indices are relative to the slice it
                // was handed, so shift them back into the segment.
                let cs: i64 = i + run.borrow().clusterStart[gi as usize];
                let mut ce: i64 = i + run.borrow().clusterEnd[gi as usize];
                if ce > c_end {
                    ce = c_end;
                }
                self.noteCidGlyphCluster(font_idx, gid, &cps, cs, ce);
                {
                    out.push_str(&format!("{}", self.toHex4(gid)));
                }
                gi += 1;
            }
            i = c_end;
        }
        format!("{}> Tj", out)
    }
    fn render(&mut self, root: Rc<RefCell<EVGElement>>) -> Vec<u8> {
        // Check if this is a multi-page document (print element)
        if root.borrow().tagName == "print" {
            return self.renderMultiPageToPDF(root.clone());
        }
        // Single page - Layout the tree first
        EVGLayout::layout(&self.layout.as_ref().unwrap().clone(), root.clone());
        // Render to PDF
        self.renderToPDF(&root)
    }
    fn findPageElementsRecursive(&mut self, el: Rc<RefCell<EVGElement>>) {
        // Recursively find all Page elements (stores in foundPages member)
        if el.borrow().tagName == "page" {
            self.foundPages.push(el.clone());
        }
        let mut i: i64 = 0;
        let child_count: i64 = EVGElement::getChildCount(&el);
        while i < child_count {
            let mut child: Rc<RefCell<EVGElement>> = EVGElement::getChild(&el, i);
            self.findPageElementsRecursive(child.clone());
            i += 1;
        }
    }
    fn findSectionElementsRecursive(&mut self, el: &Rc<RefCell<EVGElement>>) {
        // Find all Section elements (stores in foundSections member)
        let mut i: i64 = 0;
        let child_count: i64 = EVGElement::getChildCount(&el);
        while i < child_count {
            let mut child: Rc<RefCell<EVGElement>> = EVGElement::getChild(&el, i);
            if child.borrow().tagName == "section" {
                self.foundSections.push(child.clone());
            }
            i += 1;
        }
    }
    fn getSectionPageWidth(&self, section: &Rc<RefCell<EVGElement>>) -> f64 {
        // Get page width from section, default to renderer's page width
        if section.borrow().width.as_ref().unwrap().borrow().isSet {
            return section.borrow().width.as_ref().unwrap().borrow().pixels;
        }
        self.pageWidth
    }
    fn getSectionPageHeight(&self, section: &Rc<RefCell<EVGElement>>) -> f64 {
        // Get page height from section, default to renderer's page height
        if section.borrow().height.as_ref().unwrap().borrow().isSet {
            return section.borrow().height.as_ref().unwrap().borrow().pixels;
        }
        self.pageHeight
    }
    fn getSectionMargin(&self, section: &Rc<RefCell<EVGElement>>) -> f64 {
        // Get margin from section (use marginTop as the uniform margin)
        // Check box.marginTop since that's where parsed margin values go
        let mut m: Option<Rc<RefCell<EVGUnit>>> = section.borrow()
            .r#box.as_ref()
            .unwrap()
            .borrow()
            .marginTop.clone()
            .clone();
        if m.as_ref().unwrap().borrow().isSet {
            return m.as_ref().unwrap().borrow().pixels;
        }
        40.0
    }
    fn renderMultiPageToPDF(&mut self, root: Rc<RefCell<EVGElement>>) -> Vec<u8> {
        // Render a multi-page document with Print/Section/Page structure
        let mut pdf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        self.nextObjNum = 1;
        self.contentObjNums.clear();
        self.usedFontNames.clear();
        self.usedCidFonts.clear();
        self.cidFontObjNums.clear();
        self.cidUsedFont.clear();
        self.cidUsedGid.clear();
        self.cidUsedText.clear();
        self.embeddedFonts.clear();
        self.embeddedImages.clear();
        // Read image settings from Print element
        if root.borrow().imageQuality > 0 {
            self.jpegQuality = root.borrow().imageQuality;
            println!("Image quality: {}", self.jpegQuality);
        }
        if root.borrow().maxImageSize > 0 {
            self.maxImageWidth = root.borrow().maxImageSize;
            self.maxImageHeight = root.borrow().maxImageSize;
            println!("Max image size: {}px", self.maxImageWidth);
        }
        // PDF header
        GrowableBuffer::writeString(&pdf, &self.headerLine());
        // %
        GrowableBuffer::writeByte(&pdf, 37);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 226);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 227);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 207);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 211);
        // newline
        GrowableBuffer::writeByte(&pdf, 10);
        let mut object_offsets: Vec<i64> = Vec::new();
        // Find all sections (uses class member foundSections)
        let mut empty_arr: Vec<Rc<RefCell<EVGElement>>> = Vec::new();
        self.foundSections = empty_arr.clone();
        self.findSectionElementsRecursive(&root);
        // Collect all pages from all sections
        let mut all_pages: Vec<Rc<RefCell<EVGElement>>> = Vec::new();
        let mut all_page_widths: Vec<f64> = Vec::new();
        let mut all_page_heights: Vec<f64> = Vec::new();
        let mut all_page_margins: Vec<f64> = Vec::new();
        let mut si: i64 = 0;
        while si < (self.foundSections.len() as i64) {
            let mut section: Rc<RefCell<EVGElement>> = self.foundSections[si as usize].clone();
            let section_width: f64 = self.getSectionPageWidth(&section);
            let section_height: f64 = self.getSectionPageHeight(&section);
            let section_margin: f64 = self.getSectionMargin(&section);
            // Find pages within this section (uses class member foundPages)
            let mut empty_pages: Vec<Rc<RefCell<EVGElement>>> = Vec::new();
            self.foundPages = empty_pages.clone();
            self.findPageElementsRecursive(section.clone());
            let mut pi: i64 = 0;
            while pi < (self.foundPages.len() as i64) {
                let mut pg: Rc<RefCell<EVGElement>> = self.foundPages[pi as usize].clone();
                all_pages.push(pg.clone());
                all_page_widths.push(section_width);
                all_page_heights.push(section_height);
                all_page_margins.push(section_margin);
                // Set page dimensions for layout - this is the content area inside margins
                let content_width: f64 = section_width - section_margin * 2.0;
                let content_height: f64 = section_height - section_margin * 2.0;
                println!("Page {} content size: {} x {}", pi + 1, content_width, content_height);
                // Set the layout engine's page dimensions before layout
                self.layout.as_ref().unwrap().borrow_mut().pageWidth = content_width;
                self.layout.as_ref().unwrap().borrow_mut().pageHeight = content_height;
                // Reset layout state for fresh layout
                EVGElement::resetLayoutState(&pg);
                // The page's own units: an unset width/height is EVGUnit.unset(),
                // one unit shared by every element, so writing into it would size
                // every unset box in the document to the page.
                pg.borrow_mut().width = Some(EVGUnit::px(content_width));
                pg.borrow_mut().height = Some(EVGUnit::px(content_height));
                // Layout each page independently
                EVGLayout::layout(&self.layout.as_ref().unwrap().clone(), pg.clone());
                println!("  After layout: pg.calculatedWidth={} pg.calculatedHeight={}", pg.borrow().calculatedWidth, pg.borrow().calculatedHeight);
                // Check first child
                if EVGElement::getChildCount(&pg) > 0 {
                    let mut first_child: Rc<RefCell<EVGElement>> = EVGElement::getChild(&pg, 0);
                    println!("  First child: w={} h={}", first_child.borrow().calculatedWidth, first_child.borrow().calculatedHeight);
                }
                pi += 1;
            }
            si += 1;
        }
        // If no sections found, treat the whole document as single page
        if all_pages.is_empty() {
            EVGLayout::layout(&self.layout.as_ref().unwrap().clone(), root.clone());
            all_pages.push(root.clone());
            all_page_widths.push(self.pageWidth);
            all_page_heights.push(self.pageHeight);
            all_page_margins.push(0.0);
        }
        let num_pages: i64 = all_pages.len() as i64;
        println!("Rendering {} pages", num_pages);
        // Build content streams for all pages (this collects fonts and images)
        let mut content_data_list: Vec<Vec<u8>> = Vec::new();
        self.clearLinks();
        let mut pgi: i64 = 0;
        while pgi < num_pages {
            self.curLinkPage = pgi;
            let mut pg_1: Rc<RefCell<EVGElement>> = all_pages[pgi as usize].clone();
            // unused:  let pg_width: f64 = all_page_widths[pgi as usize];
            let pg_height: f64 = all_page_heights[pgi as usize];
            let pg_margin: f64 = all_page_margins[pgi as usize];
            // Store page height for Y coordinate flipping
            self.pageHeight = pg_height;
            GrowableBuffer::clear(&self.streamBuffer.as_ref().unwrap());
            // With bleed the sheet is larger than the trim size, so the whole
            // page is translated into the middle of it. Layout keeps working in
            // trim coordinates and knows nothing about the bleed.
            self.beginBleedShift();
            // Apply margin offset when rendering
            self.renderElement(&pg_1, pg_margin, pg_margin);
            self.endBleedShift();
            let mut content_data: Vec<u8> = GrowableBuffer::toBuffer(&self.streamBuffer.as_ref().unwrap());
            content_data_list.push(content_data.clone());
            println!("  Page {}: {} bytes", pgi + 1, content_data.len() as i64);
            pgi += 1;
        }
        // Embed fonts
        let mut font_obj_nums: Vec<i64> = Vec::new();
        let mut fi: i64 = 0;
        while fi < (self.usedFontNames.len() as i64) {
            let font_name: String = self.usedFontNames[fi as usize].clone();
            let mut ttf_font: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(&font_name);
            if ttf_font.borrow().unitsPerEm > 0 {
                // Embed TrueType font — once per FACE, not once per name.
                let key: String = EVGPDFRenderer::faceKey(&ttf_font);
                let already: Option<i64> = self.fontFileByFace.get(&key).cloned();
                let mut font_file_obj_num: i64 = 0;
                if already.is_some() {
                    font_file_obj_num = already.unwrap();
                } else {
                    let mut font_file_data: Vec<u8> = ttf_font.borrow_mut().pdfFontData();
                    let font_file_len: i64 = font_file_data.len() as i64;
                    object_offsets.push(GrowableBuffer::size(&pdf));
                    GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                    // `/Length1` is the size BEFORE the filter: a reader needs
                    // the original length to parse the TrueType tables, and the
                    // compressed length is what `/Length` says.
                    self.writeStream(&pdf,
                        &font_file_data,
                        &format!(" /Length1 {}", font_file_len)
                    );
                    font_file_obj_num = self.nextObjNum;
                    self.fontFileByFace.insert(key.clone(), font_file_obj_num);
                    self.nextObjNum += 1;
                }
                // Font descriptor object
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /FontDescriptor");
                let mut _tmp_2365 = ttf_font.borrow().fontFamily.clone();
                GrowableBuffer::writeString(&pdf, &format!(" /FontName /{}", self.faceFontName(&font_name,
                    &_tmp_2365
                )));
                GrowableBuffer::writeString(&pdf, " /Flags 32");
                GrowableBuffer::writeString(&pdf, &format!(" /FontBBox [0 {} 1000 {}]", ttf_font.borrow().descender, ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /ItalicAngle 0");
                GrowableBuffer::writeString(&pdf, &format!(" /Ascent {}", ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, &format!(" /Descent {}", ttf_font.borrow().descender));
                GrowableBuffer::writeString(&pdf, &format!(" /CapHeight {}", ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /StemV 80");
                GrowableBuffer::writeString(&pdf, &format!(" /FontFile2 {} 0 R", font_file_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let font_desc_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                // ToUnicode CMap
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                let to_unicode_stream: String = self.toUnicodeCMap();
                let to_unicode_len: i64 = PdfText::str_len(&to_unicode_stream) as i64;
                GrowableBuffer::writeString(&pdf, &format!("<< /Length {} >>\n", to_unicode_len));
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeString(&pdf, &to_unicode_stream);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let to_unicode_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                // Font object (TrueType)
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font");
                GrowableBuffer::writeString(&pdf, " /Subtype /TrueType");
                let mut _tmp_2368 = ttf_font.borrow().fontFamily.clone();
                GrowableBuffer::writeString(&pdf, &format!(" /BaseFont /{}", self.faceFontName(&font_name,
                    &_tmp_2368
                )));
                GrowableBuffer::writeString(&pdf, " /FirstChar 32");
                GrowableBuffer::writeString(&pdf, " /LastChar 255");
                GrowableBuffer::writeString(&pdf, " /Widths [");
                let mut ch: i64 = 32;
                while ch <= 255 {
                    // The array is indexed by WinAnsi byte, but the font is
                    // keyed by codepoint, and the two part company over
                    // 0x80-0x9F. An unassigned code has no glyph; 0 is the
                    // right width for it.
                    let cw_cp: i64 = Utf8::fromWinAnsi(ch);
                    let mut cw: i64 = 0;
                    if cw_cp >= 0 {
                        cw = ttf_font.borrow_mut().getCharWidth(cw_cp);
                    }
                    let scaled_wd: f64 = ((cw as f64) * 1000.0) / (ttf_font.borrow().unitsPerEm as f64);
                    let scaled_w: i64 = scaled_wd.floor() as i64;
                    GrowableBuffer::writeString(&pdf, &scaled_w.to_string());
                    if ch < 255 {
                        GrowableBuffer::writeString(&pdf, " ");
                    }
                    ch += 1;
                }
                GrowableBuffer::writeString(&pdf, "]");
                GrowableBuffer::writeString(&pdf, &format!(" /FontDescriptor {} 0 R", font_desc_obj_num));
                GrowableBuffer::writeString(&pdf, " /Encoding /WinAnsiEncoding");
                GrowableBuffer::writeString(&pdf, &format!(" /ToUnicode {} 0 R", to_unicode_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                font_obj_nums.push(self.nextObjNum);
                self.nextObjNum += 1;
            } else {
                // Fallback to built-in Helvetica
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                font_obj_nums.push(self.nextObjNum);
                self.nextObjNum += 1;
            }
            fi += 1;
        }
        // Fallback faces, as Type0/Identity-H. Written after the /F fonts so
        // the object numbers stay contiguous, and after the content streams so
        // the used glyph set is known.
        self.writeCidFontObjects(&pdf, &mut object_offsets);
        // Ensure at least one font exists
        if font_obj_nums.is_empty() {
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            font_obj_nums.push(self.nextObjNum);
            self.nextObjNum += 1;
        }
        // Embed images
        let mut img_idx: i64 = 0;
        while img_idx < (self.embeddedImages.len() as i64) {
            let mut emb_img: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[img_idx as usize].clone();
            let mut img_src: String = emb_img.borrow().src.clone();
            let mut img_dir: String = self.baseDir.clone();
            let mut img_file: String = img_src.clone();
            if (PdfText::str_len(&img_src) as i64) > 2 {
                let prefix: String = PdfText::substr(&img_src, 0, 2);
                if prefix == "./" {
                    img_src = PdfText::substr(&img_src, 2, (PdfText::str_len(&img_src) as i64));
                }
            }
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
            // The pixels, from the caller if they were handed over and from
            // the file system otherwise. A document names its pictures by
            // package part and there is no such path — see `suppliedImages`.
            let mut supplied: Option<Rc<RefCell<ImageBuffer>>> = self.suppliedImage(&emb_img.borrow().src.clone());
            let mut img_buffer: Rc<RefCell<ImageBuffer>> = Rc::new(RefCell::new(ImageBuffer::new()));
            if supplied.is_some() {
                img_buffer = supplied.clone().unwrap();
                // Already decoded, so already upright: EXIF orientation is a
                // property of a JPEG file and applying it again would turn a
                // picture that is the right way up.
                emb_img.borrow_mut().orientation = 1;
                println!("Image supplied in memory: {}", emb_img.borrow().src);
            } else {
                println!("Loading image: dir={} file={}", img_dir, img_file);
                let mut meta_info: Rc<RefCell<JPEGMetadataInfo>> = self.metadataParser.borrow_mut().parseMetadata(&img_dir, &img_file);
                // If file not found, try with ./assets/ prefix (same fallback as ResourceLoader)
                if !meta_info.borrow().isValid {
                    let orig_img_src: String = emb_img.borrow().src.clone();
                    let mut alt_dir_path: String = String::new();
                    if PdfText::index_of(&orig_img_src, "./") == 0 {
                        // ./images/photo.jpg -> ./assets/images/photo.jpg
                        alt_dir_path = format!("{}assets/{}", self.baseDir, PdfText::substr(&orig_img_src, 2, (PdfText::str_len(&orig_img_src) as i64)));
                    } else {
                        alt_dir_path = format!("{}assets/{}", self.baseDir, orig_img_src);
                    }
                    // Extract dir and file from altDirPath
                    let alt_last_slash: i64 = PdfText::last_index_of(&alt_dir_path, "/");
                    if alt_last_slash >= 0 {
                        img_dir = PdfText::substr(&alt_dir_path, 0, alt_last_slash + 1);
                        img_file = PdfText::substr(&alt_dir_path, alt_last_slash + 1, (PdfText::str_len(&alt_dir_path) as i64));
                    }
                    println!("  Trying alternative: dir={} file={}", img_dir, img_file);
                    meta_info = self.metadataParser.borrow_mut().parseMetadata(&img_dir, &img_file);
                }
                emb_img.borrow_mut().orientation = meta_info.borrow().orientation;
                img_buffer = JPEGDecoder::decode(&self.jpegDecoder, &img_dir, &img_file);
            }
            if img_buffer.borrow().width > 1 && img_buffer.borrow().height > 1 {
                // `embImg.orientation`, not `metaInfo` — the metadata is read
                // only on the branch that opened a file, and a supplied
                // picture has none. Both branches write the orientation onto
                // `embImg`, so this reads the one field that is always set.
                if emb_img.borrow().orientation > 1 {
                    println!("  Applying EXIF orientation: {}", emb_img.borrow().orientation);
                    let _tmp_2377 = ImageBuffer::applyExifOrientation(&img_buffer, emb_img.borrow().orientation.clone());
                    img_buffer = _tmp_2377;
                }
                let orig_w: i64 = img_buffer.borrow().width;
                let orig_h: i64 = img_buffer.borrow().height;
                let mut new_w: i64 = orig_w;
                let mut new_h: i64 = orig_h;
                if orig_w > self.maxImageWidth || orig_h > self.maxImageHeight {
                    let scale_w: f64 = (self.maxImageWidth as f64) / (orig_w as f64);
                    let scale_h: f64 = (self.maxImageHeight as f64) / (orig_h as f64);
                    let mut scale: f64 = scale_w;
                    if scale_h < scale_w {
                        scale = scale_h;
                    }
                    new_w = ((orig_w as f64) * scale).floor() as i64;
                    new_h = ((orig_h as f64) * scale).floor() as i64;
                    println!("  Resizing from {}x{} to {}x{}", orig_w, orig_h, new_w, new_h);
                    img_buffer = ImageBuffer::scaleToSize(&img_buffer, new_w, new_h);
                }
                let mut _tmp_2380 = self.jpegQuality.clone();
                JPEGEncoder::setQuality(&self.jpegEncoder.clone(), _tmp_2380);
                let mut encoded_data: Vec<u8> = JPEGEncoder::encodeToBuffer(&self.jpegEncoder, &img_buffer);
                let encoded_len: i64 = encoded_data.len() as i64;
                emb_img.borrow_mut().width = new_w;
                emb_img.borrow_mut().height = new_h;
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /XObject");
                GrowableBuffer::writeString(&pdf, " /Subtype /Image");
                GrowableBuffer::writeString(&pdf, &format!(" /Width {}", new_w));
                GrowableBuffer::writeString(&pdf, &format!(" /Height {}", new_h));
                GrowableBuffer::writeString(&pdf, " /ColorSpace /DeviceRGB");
                self.rgbImages += 1;
                GrowableBuffer::writeString(&pdf, " /BitsPerComponent 8");
                GrowableBuffer::writeString(&pdf, " /Filter /DCTDecode");
                GrowableBuffer::writeString(&pdf, &format!(" /Length {}", encoded_len));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeBuffer(&pdf, &encoded_data);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                emb_img.borrow_mut().objNum = self.nextObjNum;
                emb_img.borrow_mut().pdfName = format!("/Im{}", img_idx + 1);
                self.nextObjNum += 1;
                println!("Embedded image: {} ({}x{})", emb_img.borrow().src, new_w, new_h);
            } else {
                println!("Failed to decode image: {}", emb_img.borrow().src);
            }
            img_idx += 1;
        }
        // Write content streams for all pages
        let mut content_obj_num_list: Vec<i64> = Vec::new();
        let mut ci: i64 = 0;
        while ci < num_pages {
            let mut content_data_1: Vec<u8> = content_data_list[ci as usize].clone();
            // unused:  let content_len: i64 = content_data_1.len() as i64;
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            self.writeStream(&pdf, &content_data_1, "");
            content_obj_num_list.push(self.nextObjNum);
            self.nextObjNum += 1;
            ci += 1;
        }
        // Write page objects
        let mut page_obj_num_list: Vec<i64> = Vec::new();
        // Calculate where Pages object will be
        let pages_ref_num: i64 = self.nextObjNum + num_pages;
        let mut pi2: i64 = 0;
        while pi2 < num_pages {
            let pg_width_1: f64 = all_page_widths[pi2 as usize];
            let pg_height_1: f64 = all_page_heights[pi2 as usize];
            let content_obj_n: i64 = content_obj_num_list[pi2 as usize];
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &format!("<< /Type /Page /Parent {} 0 R", pages_ref_num));
            let bx1: String = self.pageBoxes(pg_width_1, pg_height_1);
            GrowableBuffer::writeString(&pdf, &bx1);
            GrowableBuffer::writeString(&pdf, &format!(" /Contents {} 0 R", content_obj_n));
            GrowableBuffer::writeString(&pdf, &self.annotsFor(pi2));
            GrowableBuffer::writeString(&pdf, " /Resources <<");
            GrowableBuffer::writeString(&pdf, " /Font <<");
            let mut ffi: i64 = 0;
            while ffi < (font_obj_nums.len() as i64) {
                let font_obj_n: i64 = font_obj_nums[ffi as usize];
                GrowableBuffer::writeString(&pdf, &format!(" /F{} {} 0 R", ffi + 1, font_obj_n));
                ffi += 1;
            }
            let mut efi: i64 = 0;
            while efi < (self.cidFontObjNums.len() as i64) {
                let cid_obj_n: i64 = self.cidFontObjNums[efi as usize];
                GrowableBuffer::writeString(&pdf, &format!(" /E{} {} 0 R", efi + 1, cid_obj_n));
                efi += 1;
            }
            GrowableBuffer::writeString(&pdf, " >>");
            if !self.embeddedImages.is_empty() {
                GrowableBuffer::writeString(&pdf, " /XObject <<");
                let mut ii: i64 = 0;
                while ii < (self.embeddedImages.len() as i64) {
                    let mut emb_img_1: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[ii as usize].clone();
                    if emb_img_1.borrow().objNum > 0 {
                        GrowableBuffer::writeString(&pdf, &format!(" /Im{} {} 0 R", ii + 1, emb_img_1.borrow().objNum));
                    }
                    ii += 1;
                }
                GrowableBuffer::writeString(&pdf, " >>");
            }
            GrowableBuffer::writeString(&pdf, &self.extGStateDict());
            GrowableBuffer::writeString(&pdf, " >> >>\n");
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            page_obj_num_list.push(self.nextObjNum);
            self.nextObjNum += 1;
            pi2 += 1;
        }
        // Pages object
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        GrowableBuffer::writeString(&pdf, "<< /Type /Pages /Kids [");
        let mut ki: i64 = 0;
        while ki < num_pages {
            let page_obj_n: i64 = page_obj_num_list[ki as usize];
            GrowableBuffer::writeString(&pdf, &format!("{} 0 R", page_obj_n.to_string()));
            if ki < num_pages - 1 {
                GrowableBuffer::writeString(&pdf, " ");
            }
            ki += 1;
        }
        GrowableBuffer::writeString(&pdf, &format!("] /Count {} >>\n", num_pages));
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
        self.pagesObjNum = self.nextObjNum;
        self.nextObjNum += 1;
        // --- print finishing ---
        // The XMP packet, the output intent and the document information. They
        // are written only when the file claims to be a print file, so an
        // ordinary PDF is byte-for-byte what it was before any of this existed.
        let mut metadata_obj_num: i64 = 0;
        let mut intent_obj_num: i64 = 0;
        let mut info_obj_num: i64 = 0;
        if self.wantsFinishing() {
            let xmp: String = self.xmpPacket();
            let xmp_len: i64 = EVGPDFRenderer::byteLength(&xmp);
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &format!("<< /Type /Metadata /Subtype /XML /Length {} >>\nstream\n", xmp_len));
            GrowableBuffer::writeString(&pdf, &xmp);
            GrowableBuffer::writeString(&pdf, "endstream\nendobj\n\n");
            metadata_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &self.outputIntentBody());
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            intent_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &self.infoBody());
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            info_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
        }
        // Catalog object
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        let mut _tmp_2389 = self.catalogBody(self.pagesObjNum.clone(),
            metadata_obj_num,
            intent_obj_num
        );
        GrowableBuffer::writeString(&pdf, &_tmp_2389);
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
        let catalog_obj_num: i64 = self.nextObjNum;
        self.nextObjNum += 1;
        // Xref table
        let xref_offset: i64 = GrowableBuffer::size(&pdf);
        GrowableBuffer::writeString(&pdf, "xref\n");
        GrowableBuffer::writeString(&pdf, &format!("0 {}\n", self.nextObjNum));
        GrowableBuffer::writeString(&pdf, "0000000000 65535 f \n");
        let mut xi: i64 = 0;
        while xi < (object_offsets.len() as i64) {
            let offset: i64 = object_offsets[xi as usize];
            GrowableBuffer::writeString(&pdf, &format!("{} 00000 n \n", self.padLeft(&offset.to_string(),
                10,
                "0"
            )));
            xi += 1;
        }
        // Trailer
        GrowableBuffer::writeString(&pdf, "trailer\n");
        let mut _tmp_2393 = self.trailerBody(self.nextObjNum.clone(),
            catalog_obj_num,
            info_obj_num
        );
        GrowableBuffer::writeString(&pdf, &_tmp_2393);
        GrowableBuffer::writeString(&pdf, "startxref\n");
        GrowableBuffer::writeString(&pdf, &format!("{}\n", xref_offset.to_string()));
        GrowableBuffer::writeString(&pdf, "%%EOF\n");
        return GrowableBuffer::toBuffer(&pdf);
    }
    fn renderToPDF(&mut self, root: &Rc<RefCell<EVGElement>>) -> Vec<u8> {
        // Build PDF with the rendered content
        let mut pdf: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        self.nextObjNum = 1;
        self.contentObjNums.clear();
        self.usedFontNames.clear();
        self.usedCidFonts.clear();
        self.cidFontObjNums.clear();
        self.cidUsedFont.clear();
        self.cidUsedGid.clear();
        self.cidUsedText.clear();
        self.embeddedFonts.clear();
        self.embeddedImages.clear();
        // PDF header (version 1.5 for TrueType embedding)
        GrowableBuffer::writeString(&pdf, &self.headerLine());
        // %
        GrowableBuffer::writeByte(&pdf, 37);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 226);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 227);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 207);
        // high-bit char
        GrowableBuffer::writeByte(&pdf, 211);
        // newline
        GrowableBuffer::writeByte(&pdf, 10);
        // Keep track of object offsets
        let mut object_offsets: Vec<i64> = Vec::new();
        // Build content stream for the page (this also collects used fonts)
        GrowableBuffer::clear(&self.streamBuffer.as_ref().unwrap());
        self.clearLinks();
        self.beginBleedShift();
        self.renderElement(root, 0.0, 0.0);
        self.endBleedShift();
        let mut content_data: Vec<u8> = GrowableBuffer::toBuffer(&self.streamBuffer.as_ref().unwrap());
        // unused:  let content_len: i64 = content_data.len() as i64;
        // Now embed fonts for each used font
        let mut font_obj_nums: Vec<i64> = Vec::new();
        let mut i: i64 = 0;
        while i < (self.usedFontNames.len() as i64) {
            let font_name: String = self.usedFontNames[i as usize].clone();
            let mut ttf_font: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(&font_name);
            if ttf_font.borrow().unitsPerEm > 0 {
                // Embed TrueType font — once per FACE, not once per name.
                let key: String = EVGPDFRenderer::faceKey(&ttf_font);
                let already: Option<i64> = self.fontFileByFace.get(&key).cloned();
                let mut font_file_obj_num: i64 = 0;
                if already.is_some() {
                    font_file_obj_num = already.unwrap();
                } else {
                    let mut font_file_data: Vec<u8> = ttf_font.borrow_mut().pdfFontData();
                    let font_file_len: i64 = font_file_data.len() as i64;
                    object_offsets.push(GrowableBuffer::size(&pdf));
                    GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                    // `/Length1` is the size BEFORE the filter: a reader needs
                    // the original length to parse the TrueType tables, and the
                    // compressed length is what `/Length` says.
                    self.writeStream(&pdf,
                        &font_file_data,
                        &format!(" /Length1 {}", font_file_len)
                    );
                    font_file_obj_num = self.nextObjNum;
                    self.fontFileByFace.insert(key.clone(), font_file_obj_num);
                    self.nextObjNum += 1;
                }
                // Font descriptor object
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /FontDescriptor");
                let mut _tmp_2400 = ttf_font.borrow().fontFamily.clone();
                GrowableBuffer::writeString(&pdf, &format!(" /FontName /{}", self.faceFontName(&font_name,
                    &_tmp_2400
                )));
                // Symbolic
                GrowableBuffer::writeString(&pdf, " /Flags 32");
                GrowableBuffer::writeString(&pdf, &format!(" /FontBBox [0 {} 1000 {}]", ttf_font.borrow().descender, ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /ItalicAngle 0");
                GrowableBuffer::writeString(&pdf, &format!(" /Ascent {}", ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, &format!(" /Descent {}", ttf_font.borrow().descender));
                GrowableBuffer::writeString(&pdf, &format!(" /CapHeight {}", ttf_font.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /StemV 80");
                GrowableBuffer::writeString(&pdf, &format!(" /FontFile2 {} 0 R", font_file_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let font_desc_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                // ToUnicode CMap for proper character mapping
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                let to_unicode_stream: String = self.toUnicodeCMap();
                let to_unicode_len: i64 = PdfText::str_len(&to_unicode_stream) as i64;
                GrowableBuffer::writeString(&pdf, &format!("<< /Length {} >>\n", to_unicode_len));
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeString(&pdf, &to_unicode_stream);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let to_unicode_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                // Font object (TrueType)
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font");
                GrowableBuffer::writeString(&pdf, " /Subtype /TrueType");
                let mut _tmp_2403 = ttf_font.borrow().fontFamily.clone();
                GrowableBuffer::writeString(&pdf, &format!(" /BaseFont /{}", self.faceFontName(&font_name,
                    &_tmp_2403
                )));
                GrowableBuffer::writeString(&pdf, " /FirstChar 32");
                GrowableBuffer::writeString(&pdf, " /LastChar 255");
                GrowableBuffer::writeString(&pdf, " /Widths [");
                // Output widths for characters 32-255
                let mut ch: i64 = 32;
                while ch <= 255 {
                    // getCharWidth maps codepoint -> glyph index -> width, so
                    // the WinAnsi byte has to be turned back into a codepoint
                    // first; the two differ over 0x80-0x9F.
                    let w_cp: i64 = Utf8::fromWinAnsi(ch);
                    let mut w: i64 = 0;
                    if w_cp >= 0 {
                        w = ttf_font.borrow_mut().getCharWidth(w_cp);
                    }
                    // Scale to 1000 units (standard PDF font units)
                    let scaled_wd: f64 = ((w as f64) * 1000.0) / (ttf_font.borrow().unitsPerEm as f64);
                    let scaled_w: i64 = scaled_wd.floor() as i64;
                    GrowableBuffer::writeString(&pdf, &scaled_w.to_string());
                    if ch < 255 {
                        GrowableBuffer::writeString(&pdf, " ");
                    }
                    ch += 1;
                }
                GrowableBuffer::writeString(&pdf, "]");
                GrowableBuffer::writeString(&pdf, &format!(" /FontDescriptor {} 0 R", font_desc_obj_num));
                GrowableBuffer::writeString(&pdf, " /Encoding /WinAnsiEncoding");
                GrowableBuffer::writeString(&pdf, &format!(" /ToUnicode {} 0 R", to_unicode_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                font_obj_nums.push(self.nextObjNum);
                self.nextObjNum += 1;
            } else {
                // Fallback to built-in Helvetica
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                font_obj_nums.push(self.nextObjNum);
                self.nextObjNum += 1;
            }
            i += 1;
        }
        // Fallback faces, as Type0/Identity-H. Written after the /F fonts so
        // the object numbers stay contiguous, and after the content streams so
        // the used glyph set is known.
        self.writeCidFontObjects(&pdf, &mut object_offsets);
        // Ensure at least one font exists
        if font_obj_nums.is_empty() {
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            font_obj_nums.push(self.nextObjNum);
            self.nextObjNum += 1;
        }
        // Embed images
        let mut img_idx: i64 = 0;
        while img_idx < (self.embeddedImages.len() as i64) {
            let mut emb_img: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[img_idx as usize].clone();
            // Parse the src path to get directory and filename
            let mut img_src: String = emb_img.borrow().src.clone();
            let mut img_dir: String = self.baseDir.clone();
            let mut img_file: String = img_src.clone();
            // Handle relative paths starting with ./
            if (PdfText::str_len(&img_src) as i64) > 2 {
                let prefix: String = PdfText::substr(&img_src, 0, 2);
                if prefix == "./" {
                    img_src = PdfText::substr(&img_src, 2, (PdfText::str_len(&img_src) as i64));
                }
            }
            // Check for path separators
            let last_slash: i64 = PdfText::last_index_of(&img_src, "/");
            let last_backslash: i64 = PdfText::last_index_of(&img_src, "\\");
            let mut last_sep: i64 = last_slash;
            if last_backslash > last_sep {
                last_sep = last_backslash;
            }
            if last_sep >= 0 {
                // Combine baseDir with the path from imgSrc
                img_dir = format!("{}{}", self.baseDir, PdfText::substr(&img_src, 0, last_sep + 1));
                img_file = PdfText::substr(&img_src, last_sep + 1, (PdfText::str_len(&img_src) as i64));
            } else {
                // No path separator, use baseDir directly
                img_dir = self.baseDir.clone();
                img_file = img_src.clone();
            }
            println!("Loading image: dir={} file={}", img_dir, img_file);
            // Get EXIF orientation
            let mut meta_info: Rc<RefCell<JPEGMetadataInfo>> = self.metadataParser.borrow_mut().parseMetadata(&img_dir, &img_file);
            // If file not found, try with ./assets/ prefix (same fallback as ResourceLoader)
            if !meta_info.borrow().isValid {
                let orig_img_src: String = emb_img.borrow().src.clone();
                let mut alt_dir_path: String = String::new();
                if PdfText::index_of(&orig_img_src, "./") == 0 {
                    // ./images/photo.jpg -> ./assets/images/photo.jpg
                    alt_dir_path = format!("{}assets/{}", self.baseDir, PdfText::substr(&orig_img_src, 2, (PdfText::str_len(&orig_img_src) as i64)));
                } else {
                    alt_dir_path = format!("{}assets/{}", self.baseDir, orig_img_src);
                }
                // Extract dir and file from altDirPath
                let alt_last_slash: i64 = PdfText::last_index_of(&alt_dir_path, "/");
                if alt_last_slash >= 0 {
                    img_dir = PdfText::substr(&alt_dir_path, 0, alt_last_slash + 1);
                    img_file = PdfText::substr(&alt_dir_path, alt_last_slash + 1, (PdfText::str_len(&alt_dir_path) as i64));
                }
                println!("  Trying alternative: dir={} file={}", img_dir, img_file);
                meta_info = self.metadataParser.borrow_mut().parseMetadata(&img_dir, &img_file);
            }
            emb_img.borrow_mut().orientation = meta_info.borrow().orientation;
            // Decode JPEG to ImageBuffer for processing
            let mut img_buffer: Rc<RefCell<ImageBuffer>> = JPEGDecoder::decode(
                &self.jpegDecoder,
                &img_dir,
                &img_file
            );
            if img_buffer.borrow().width > 1 && img_buffer.borrow().height > 1 {
                // Apply EXIF orientation
                if meta_info.borrow().orientation > 1 {
                    println!("  Applying EXIF orientation: {}", meta_info.borrow().orientation);
                    let _tmp_2410 = ImageBuffer::applyExifOrientation(&img_buffer, meta_info.borrow().orientation.clone());
                    img_buffer = _tmp_2410;
                }
                // Calculate scaled dimensions to fit within maxImageWidth x maxImageHeight
                let orig_w: i64 = img_buffer.borrow().width;
                let orig_h: i64 = img_buffer.borrow().height;
                let mut new_w: i64 = orig_w;
                let mut new_h: i64 = orig_h;
                // Check if resizing is needed
                if orig_w > self.maxImageWidth || orig_h > self.maxImageHeight {
                    let scale_w: f64 = (self.maxImageWidth as f64) / (orig_w as f64);
                    let scale_h: f64 = (self.maxImageHeight as f64) / (orig_h as f64);
                    let mut scale: f64 = scale_w;
                    if scale_h < scale_w {
                        scale = scale_h;
                    }
                    new_w = ((orig_w as f64) * scale).floor() as i64;
                    new_h = ((orig_h as f64) * scale).floor() as i64;
                    println!("  Resizing from {}x{} to {}x{}", orig_w, orig_h, new_w, new_h);
                    img_buffer = ImageBuffer::scaleToSize(&img_buffer, new_w, new_h);
                }
                // Encode to JPEG buffer
                let mut _tmp_2413 = self.jpegQuality.clone();
                JPEGEncoder::setQuality(&self.jpegEncoder.clone(), _tmp_2413);
                let mut encoded_data: Vec<u8> = JPEGEncoder::encodeToBuffer(&self.jpegEncoder, &img_buffer);
                let encoded_len: i64 = encoded_data.len() as i64;
                emb_img.borrow_mut().width = new_w;
                emb_img.borrow_mut().height = new_h;
                // Image XObject
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /XObject");
                GrowableBuffer::writeString(&pdf, " /Subtype /Image");
                GrowableBuffer::writeString(&pdf, &format!(" /Width {}", new_w));
                GrowableBuffer::writeString(&pdf, &format!(" /Height {}", new_h));
                GrowableBuffer::writeString(&pdf, " /ColorSpace /DeviceRGB");
                self.rgbImages += 1;
                GrowableBuffer::writeString(&pdf, " /BitsPerComponent 8");
                GrowableBuffer::writeString(&pdf, " /Filter /DCTDecode");
                GrowableBuffer::writeString(&pdf, &format!(" /Length {}", encoded_len));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeBuffer(&pdf, &encoded_data);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                emb_img.borrow_mut().objNum = self.nextObjNum;
                emb_img.borrow_mut().pdfName = format!("/Im{}", img_idx + 1);
                self.nextObjNum += 1;
                println!("Embedded image: {} (resized to {}x{}, {} bytes)", img_src, new_w, new_h, encoded_len);
            } else {
                println!("Failed to decode image: {}", img_src);
            }
            img_idx += 1;
        }
        // Content stream object
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        self.writeStream(&pdf, &content_data, "");
        let content_obj_num: i64 = self.nextObjNum;
        self.nextObjNum += 1;
        // Page object
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        let pages_ref: i64 = self.nextObjNum + 1;
        GrowableBuffer::writeString(&pdf, &format!("<< /Type /Page /Parent {} 0 R", pages_ref));
        let mut _tmp_2416 = self.pageWidth.clone();
        let bx2: String = self.pageBoxes(_tmp_2416, self.pageHeight.clone());
        GrowableBuffer::writeString(&pdf, &bx2);
        GrowableBuffer::writeString(&pdf, &format!(" /Contents {} 0 R", content_obj_num));
        GrowableBuffer::writeString(&pdf, &self.annotsFor(0));
        GrowableBuffer::writeString(&pdf, " /Resources <<");
        // Add font references
        GrowableBuffer::writeString(&pdf, " /Font <<");
        let mut fi: i64 = 0;
        while fi < (font_obj_nums.len() as i64) {
            let font_obj_n: i64 = font_obj_nums[fi as usize];
            GrowableBuffer::writeString(&pdf, &format!(" /F{} {} 0 R", fi + 1, font_obj_n));
            fi += 1;
        }
        let mut efi: i64 = 0;
        while efi < (self.cidFontObjNums.len() as i64) {
            let cid_obj_n: i64 = self.cidFontObjNums[efi as usize];
            GrowableBuffer::writeString(&pdf, &format!(" /E{} {} 0 R", efi + 1, cid_obj_n));
            efi += 1;
        }
        GrowableBuffer::writeString(&pdf, " >>");
        // Add image XObject references
        if !self.embeddedImages.is_empty() {
            GrowableBuffer::writeString(&pdf, " /XObject <<");
            let mut ii: i64 = 0;
            while ii < (self.embeddedImages.len() as i64) {
                let mut emb_img_1: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[ii as usize].clone();
                if emb_img_1.borrow().objNum > 0 {
                    GrowableBuffer::writeString(&pdf, &format!(" /Im{} {} 0 R", ii + 1, emb_img_1.borrow().objNum));
                }
                ii += 1;
            }
            GrowableBuffer::writeString(&pdf, " >>");
        }
        GrowableBuffer::writeString(&pdf, &self.extGStateDict());
        GrowableBuffer::writeString(&pdf, " >> >>\n");
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
        let page_obj_num: i64 = self.nextObjNum;
        self.nextObjNum += 1;
        // Object 6: Pages
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        GrowableBuffer::writeString(&pdf, &format!("<< /Type /Pages /Kids [{} 0 R] /Count 1 >>\n", page_obj_num));
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
        self.pagesObjNum = self.nextObjNum;
        self.nextObjNum += 1;
        // --- print finishing ---
        // The XMP packet, the output intent and the document information. They
        // are written only when the file claims to be a print file, so an
        // ordinary PDF is byte-for-byte what it was before any of this existed.
        let mut metadata_obj_num: i64 = 0;
        let mut intent_obj_num: i64 = 0;
        let mut info_obj_num: i64 = 0;
        if self.wantsFinishing() {
            let xmp: String = self.xmpPacket();
            let xmp_len: i64 = EVGPDFRenderer::byteLength(&xmp);
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &format!("<< /Type /Metadata /Subtype /XML /Length {} >>\nstream\n", xmp_len));
            GrowableBuffer::writeString(&pdf, &xmp);
            GrowableBuffer::writeString(&pdf, "endstream\nendobj\n\n");
            metadata_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &self.outputIntentBody());
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            intent_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
            object_offsets.push(GrowableBuffer::size(&pdf));
            GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
            GrowableBuffer::writeString(&pdf, &self.infoBody());
            GrowableBuffer::writeString(&pdf, "endobj\n\n");
            info_obj_num = self.nextObjNum;
            self.nextObjNum += 1;
        }
        // Object 7: Catalog
        object_offsets.push(GrowableBuffer::size(&pdf));
        GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
        let mut _tmp_2424 = self.catalogBody(self.pagesObjNum.clone(),
            metadata_obj_num,
            intent_obj_num
        );
        GrowableBuffer::writeString(&pdf, &_tmp_2424);
        GrowableBuffer::writeString(&pdf, "endobj\n\n");
        let catalog_obj_num: i64 = self.nextObjNum;
        self.nextObjNum += 1;
        // Xref table
        let xref_offset: i64 = GrowableBuffer::size(&pdf);
        GrowableBuffer::writeString(&pdf, "xref\n");
        GrowableBuffer::writeString(&pdf, &format!("0 {}\n", self.nextObjNum));
        GrowableBuffer::writeString(&pdf, "0000000000 65535 f \n");
        let mut i_2: i64 = 0;
        while i_2 < (object_offsets.len() as i64) {
            let offset: i64 = object_offsets[i_2 as usize];
            GrowableBuffer::writeString(&pdf, &format!("{} 00000 n \n", self.padLeft(&offset.to_string(),
                10,
                "0"
            )));
            i_2 += 1;
        }
        // Trailer
        GrowableBuffer::writeString(&pdf, "trailer\n");
        let mut _tmp_2428 = self.trailerBody(self.nextObjNum.clone(),
            catalog_obj_num,
            info_obj_num
        );
        GrowableBuffer::writeString(&pdf, &_tmp_2428);
        GrowableBuffer::writeString(&pdf, "startxref\n");
        GrowableBuffer::writeString(&pdf, &format!("{}\n", xref_offset.to_string()));
        GrowableBuffer::writeString(&pdf, "%%EOF\n");
        return GrowableBuffer::toBuffer(&pdf);
    }
    fn renderElement(&mut self, el: &Rc<RefCell<EVGElement>>, offset_x: f64, offset_y: f64) {
        // Get element position
        let mut x: f64 = el.borrow().calculatedX + offset_x;
        let mut y: f64 = el.borrow().calculatedY + offset_y;
        let mut w: f64 = el.borrow().calculatedWidth;
        let mut h: f64 = el.borrow().calculatedHeight;
        // full-bleed: grow this element past the trim on whichever page edges it
        // already reaches, so the trim cut lands inside its ink. Layout stays in
        // trim coordinates — this is purely a paint-time extension, and it does
        // nothing at all when no bleed was requested.
        if el.borrow().fullBleed {
            if self.bleed > 0.0 {
                if x <= 0.001 {
                    x -= self.bleed;
                    w += self.bleed;
                }
                if y <= 0.001 {
                    y -= self.bleed;
                    h += self.bleed;
                }
                if (x + w) + 0.001 >= self.pageWidth {
                    w += self.bleed;
                }
                if (y + h) + 0.001 >= self.pageHeight {
                    h += self.bleed;
                }
            }
        }
        // PDF uses bottom-left origin, flip Y
        let pdf_y: f64 = (self.pageHeight - y) - h;
        // Where this box goes when it is followed. The element's OWN href, not
        // the inherited one: a link on a row would otherwise be written once
        // for the row and once more for every word inside it, and a reader
        // given four annotations stacked on the same rectangle reports four
        // links.
        if !el.borrow().href.is_empty() {
            self.noteLink(&el.borrow().href.clone(), x, pdf_y, w, h);
        }
        // Get border radius
        let mut border_radius: f64 = 0.0;
        if el.borrow()
            .r#box.as_ref()
            .unwrap()
            .borrow()
            .borderRadius.as_ref()
            .unwrap()
            .borrow()
            .isSet {
            border_radius = el.borrow()
                .r#box.as_ref()
                .unwrap()
                .borrow()
                .borderRadius.as_ref()
                .unwrap()
                .borrow()
                .pixels;
        }
        // Rotation about the element's centre. Wrapped around everything this
        // element draws — its background, its path, its text — so the parts do
        // not come apart from each other. The matrix is translate(centre) *
        // rotate * translate(-centre), written out.
        let mut rotated: bool = false;
        if !(el.borrow().rotate == 0.0) {
            rotated = true;
            // (the matrix below turns counter-clockwise for a positive angle in
            // PDF's y-up space, so the angle goes in negated: a label at -90,
            // which reads bottom to top on the page and in the browser, read
            // top to bottom in the PDF before)
            let rad: f64 = ((0.0 - el.borrow().rotate) / 180.0) * std::f64::consts::PI;
            // Clockwise on the page. PDF's y axis points up while the layout's
            // points down, so the sign of the angle flips on the way in and the
            // matrix below is a standard y-up rotation.
            let cs: f64 = rad.cos();
            let sn: f64 = rad.sin();
            // Rotate about `transform-origin`: translate(o) * rotate *
            // translate(-o), multiplied out. The defining property is that the
            // origin maps to itself, which is what the test asserts. The
            // default origin is the element's centre, so a document that never
            // states one turns exactly as it did before; one that does — a
            // chart's axis label, pinned where it meets its tick — turns about
            // the point it was pinned at instead of swinging out of the plot.
            //
            // The vertical offset is measured from the element's TOP, and this
            // page's y grows upward from `pdfY`, which is its bottom edge.
            let ccx: f64 = x + EVGElement::resolveOrigin(&el.borrow().transformOriginX.clone(), w);
            let ccy: f64 = pdf_y + (h - EVGElement::resolveOrigin(&el.borrow().transformOriginY.clone(), h));
            let ex: f64 = (ccx - cs * ccx) + sn * ccy;
            let fy: f64 = (ccy - sn * ccx) - cs * ccy;
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
            let arg_0 = format!("{} {} {} {} {} {} cm\n", self.formatNum(cs), self.formatNum(sn), self.formatNum(0.0 - sn), self.formatNum(cs), self.formatNum(ex), self.formatNum(fy)).clone();
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        }
        // Apply clip path if set OR if overflow is hidden
        let mut has_clip_path: bool = false;
        if !el.borrow().clipPath.is_empty() {
            has_clip_path = true;
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
            self.applyClipPath(&el.borrow().clipPath.clone(), x, pdf_y, w, h);
        }
        // Apply overflow:hidden clipping - clips children to element bounds
        let mut has_overflow_clip: bool = false;
        if el.borrow().overflow == "hidden" {
            has_overflow_clip = true;
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
            // Create rectangle clip path for element bounds
            if border_radius > 0.0 {
                // Rounded rectangle clipping
                self.drawRoundedRectPath(x, pdf_y, w, h, border_radius);
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "W n\n");
            } else {
                // Simple rectangle clipping
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &format!("{} {} {} {} re W n\n", x.to_string(), pdf_y, w, h));
            }
        }
        // Render shadow first (behind everything) - but NOT for text elements
        // Text elements get text-shadow which is handled in renderText
        if el.borrow().tagName != "text" {
            self.renderShadow(el, x, pdf_y, w, h, border_radius);
        }
        // Render gradient background if set
        // Skip gradients with opacity (rgba, transparent) - PDF can't blend properly
        // These will be handled by the raster engine later
        if el.borrow().gradientSet {
            self.renderTwoStopGradientBackground(el,
                x,
                pdf_y,
                w,
                h,
                border_radius
            );
        } else {
            if !el.borrow().backgroundGradient.is_empty() {
                let mut has_opacity: bool = false;
                if el.borrow().backgroundGradient.contains("rgba") {
                    has_opacity = true;
                }
                if el.borrow().backgroundGradient.contains("transparent") {
                    has_opacity = true;
                }
                if !has_opacity {
                    self.renderGradientBackground(el, x, pdf_y, w, h, border_radius);
                }
            } else {
                // Render solid background if set (with border radius)
                let mut bg_color: Rc<RefCell<EVGColor>> = PdfOpt::background(el.clone());
                if self.debug {
                    println!("  bg check: {} isSet={} r={}", el.borrow().tagName, bg_color.borrow().isSet, bg_color.borrow().r);
                }
                if bg_color.borrow().isSet {
                    self.renderBackgroundWithRadius(x,
                        pdf_y,
                        w,
                        h,
                        &bg_color,
                        border_radius
                    );
                }
            }
        }
        // Render border (with border radius)
        self.renderBorderWithRadius(el, x, pdf_y, w, h, border_radius);
        // Render text content
        if el.borrow().tagName == "text" {
            self.renderText(el, x, pdf_y, w, h);
        }
        // Handle divider element
        if el.borrow().tagName == "divider" {
            self.renderDivider(el, x, pdf_y, w, h);
        }
        // Handle image element.
        //
        // Three spellings, because there are three. `EVGLayout`, the HTML
        // renderer, the resource loader, the preview server and the component
        // engine all accept "image", "Image" and "img"; this was the one place
        // that took only the first, and `EVGElement.createImg()` — this
        // repository's own constructor — produces the third. An element built
        // that way was laid out, measured, given a background, and then not
        // drawn: a page with a picture on it printed with a hole where the
        // picture was, and nothing reported anything.
        if (el.borrow().tagName == "image" || el.borrow().tagName == "Image") || el.borrow().tagName == "img" {
            self.renderImage(el, x, pdf_y, w, h);
        }
        // Handle path element
        if EVGElement::drawsPath(&el) {
            self.renderPath(el, x, pdf_y, w, h);
        }
        // Render children - children have absolute positions from layout engine
        // so pass the same offset that was passed to this element
        let mut i: i64 = 0;
        let child_count: i64 = EVGElement::getChildCount(&el);
        while i < child_count {
            let mut child: Rc<RefCell<EVGElement>> = EVGElement::getChild(&el, i);
            self.renderElement(&child, offset_x, offset_y);
            i += 1;
        }
        // Restore state if clip path was applied
        if has_clip_path {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
        }
        // Restore state if overflow clip was applied
        if has_overflow_clip {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
        }
        // The rotation q was pushed BEFORE the clip q, so it has to be popped
        // after them — an unbalanced stack here would leave the rotation in
        // force for the rest of the page.
        if rotated {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
        }
    }
    pub fn getImagePdfName(&mut self, src: &str) -> String {
        // Find or create an embedded image entry and return its PDF name
        let mut i: i64 = 0;
        while i < (self.embeddedImages.len() as i64) {
            let mut emb_img: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[i as usize].clone();
            if emb_img.borrow().src == src {
                return format!("/Im{}", i + 1);
            }
            i += 1;
        }
        // Not found, add it
        let mut new_img: Rc<RefCell<EmbeddedImage>> = Rc::new(RefCell::new(EmbeddedImage::new(src.to_string())));
        self.embeddedImages.push(new_img.clone());
        format!("/Im{}", self.embeddedImages.len() as i64)
    }
    pub fn getEmbeddedImage(&self, src: &str) -> Rc<RefCell<EmbeddedImage>> {
        // Find embedded image by src
        let mut i: i64 = 0;
        while i < (self.embeddedImages.len() as i64) {
            let mut emb_img: Rc<RefCell<EmbeddedImage>> = self.embeddedImages[i as usize].clone();
            if emb_img.borrow().src == src {
                return emb_img;
            }
            i += 1;
        }
        // Not found, return empty
        let mut empty: Rc<RefCell<EmbeddedImage>> = Rc::new(RefCell::new(EmbeddedImage::new(String::new())));
        empty
    }
    fn renderImage(&mut self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        let src: String = el.borrow().src.clone();
        if src.is_empty() {
            return;
        }
        // Register the image for embedding
        let img_name: String = self.getImagePdfName(&src);
        // Get original image dimensions for objectFit calculation
        let mut orig_w: f64 = 0.0;
        let mut orig_h: f64 = 0.0;
        let mut dims: Rc<RefCell<EVGImageDimensions>> = self.loadImageDimensions(&src);
        if dims.borrow().isValid {
            orig_w = dims.borrow().width as f64;
            orig_h = dims.borrow().height as f64;
        }
        // Calculate actual render dimensions based on objectFit
        let mut render_w: f64 = w;
        let mut render_h: f64 = h;
        let mut offset_x: f64 = 0.0;
        let mut offset_y: f64 = 0.0;
        println!("renderImage: src={} container={}x{} origImg={}x{}", src, w, h, orig_w, orig_h);
        if orig_w > 0.0 {
            if orig_h > 0.0 {
                let mut object_fit: String = el.borrow().objectFit.clone();
                // Default to "cover" to match HTML renderer behavior
                if object_fit.is_empty() {
                    object_fit = "cover".to_string();
                }
                let container_ratio: f64 = w / h;
                let image_ratio: f64 = orig_w / orig_h;
                println!("  objectFit={} containerRatio={} imageRatio={}", object_fit, container_ratio, image_ratio);
                if object_fit == "cover" {
                    // Scale to cover entire container, may crop
                    if image_ratio > container_ratio {
                        // Image is wider than container - scale by height, crop width
                        render_h = h;
                        render_w = h * image_ratio;
                        // Center horizontally (negative = crop)
                        offset_x = (w - render_w) / 2.0;
                    } else {
                        // Image is taller than container - scale by width, crop height
                        render_w = w;
                        render_h = w / image_ratio;
                        // Center vertically (negative = crop)
                        offset_y = (h - render_h) / 2.0;
                    }
                }
                if object_fit == "contain" {
                    // Scale to fit within container, may letterbox
                    if image_ratio > container_ratio {
                        // Image is wider - fit to width, letterbox height
                        render_w = w;
                        render_h = w / image_ratio;
                        // Center vertically
                        offset_y = (h - render_h) / 2.0;
                    } else {
                        // Image is taller - fit to height, letterbox width
                        render_h = h;
                        render_w = h * image_ratio;
                        // Center horizontally
                        offset_x = (w - render_w) / 2.0;
                    }
                }
                // For "fill" or default (when neither cover nor contain), use w and h as-is (stretch)
            }
        }
        // Draw the image (orientation already applied during JPEG processing)
        // PDF transformation matrix: [a b c d e f] cm
        // where: a=scaleX, d=scaleY, e=translateX, f=translateY
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        // Always clip to container bounds for ALL images
        // This matches HTML behavior where image containers have overflow:hidden
        // and ensures images never extend beyond their designated area
        let mut border_radius: f64 = 0.0;
        if el.borrow()
            .r#box.as_ref()
            .unwrap()
            .borrow()
            .borderRadius.as_ref()
            .unwrap()
            .borrow()
            .isSet {
            border_radius = el.borrow()
                .r#box.as_ref()
                .unwrap()
                .borrow()
                .borderRadius.as_ref()
                .unwrap()
                .borrow()
                .pixels;
        }
        if border_radius > 0.0 {
            // Rounded rectangle clipping
            self.drawRoundedRectPath(x, y, w, h, border_radius);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "W n\n");
        } else {
            // Simple rectangle clipping
            let arg_0 = format!("{} {} {} {} re W n\n", self.formatNum(x), self.formatNum(y), self.formatNum(w), self.formatNum(h)).clone();
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        }
        let final_x: f64 = x + offset_x;
        let final_y: f64 = y + offset_y;
        let arg_0 = format!("{} 0 0 {} {} {} cm\n", self.formatNum(render_w), self.formatNum(render_h), self.formatNum(final_x), self.formatNum(final_y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &format!("{} Do\n", img_name));
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    /// The transform taking this element's path coordinates onto its layout box.
    ///
    /// Kept as its own method so the HTML renderer can agree with it by
    /// construction: both ask VectorViewBox the same question and neither owns
    /// the answer.
    fn pathViewBoxMatrix(&self, el: &Rc<RefCell<EVGElement>>, parser: &Rc<RefCell<SVGPathParser>>, w: f64, h: f64) -> Rc<RefCell<Matrix2D>> {
        let mut b: Rc<RefCell<PathBounds>> = SVGPathParser::getBounds(&parser);
        let mut _tmp_2478 = el.borrow().viewBox.clone();
        let mut _tmp_2479 = b.borrow().minX.clone();
        let mut _tmp_2480 = b.borrow().minY.clone();
        let mut _tmp_2481 = b.borrow().width.clone();
        let mut _tmp_2482 = b.borrow().height.clone();
        let mut vb: Rc<RefCell<ViewBoxRect>> = VectorViewBox::effectiveViewBox(
            &_tmp_2478,
            _tmp_2479,
            _tmp_2480,
            _tmp_2481,
            _tmp_2482
        );
        VectorViewBox::resolve(&vb, w, h, "xMidYMid meet")
    }
    /// PDF has a dash operator, so the pattern goes straight through: the array
    /// of on/off lengths and a phase. It sits inside the path's q/Q pair with the
    /// viewBox matrix already applied, so the lengths are in user units and scale
    /// with the drawing exactly as they do in SVG.
    fn writeDashPattern(&self, el: &Rc<RefCell<EVGElement>>) {
        let mut _tmp_2483 = el.borrow().strokeDashArray.clone();
        self.writeDashArray(&_tmp_2483, el.borrow().strokeDashOffset.clone());
    }
    pub fn writeDashArray(&self, dash_array: &str, dash_offset: f64) {
        if dash_array.is_empty() {
            return;
        }
        let mut dashes: Vec<f64> = VectorStroke::parseDashes(dash_array);
        if dashes.is_empty() {
            return;
        }
        let mut out: String = "[".to_string();
        let mut k: i64 = 0;
        while k < (dashes.len() as i64) {
            if k > 0 {
                out.push_str(" ");
            }
            {
                out.push_str(&format!("{}", self.formatNum(dashes[k as usize])));
            }
            k += 1;
        }
        {
            out.push_str(&format!("] {} d\n", self.formatNum(dash_offset)));
        }
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &out);
    }
    /// The path operators for a list of commands, in user units. Shared by a
    /// `<Path>` and by every shape of an imported document, so a curve cannot be
    /// written one way for one and another way for the other.
    fn writePathOps(&self, commands: &Vec<Rc<RefCell<PathCommand>>>) {
        let mut cur_x: f64 = 0.0;
        let mut cur_y: f64 = 0.0;
        let mut start_x: f64 = 0.0;
        let mut start_y: f64 = 0.0;
        let mut i: i64 = 0;
        while i < (commands.len() as i64) {
            let mut cmd: Rc<RefCell<PathCommand>> = commands[i as usize].clone();
            if cmd.borrow().r#type == "M" {
                // Move to
                let mut _tmp_2494 = cmd.borrow().x.clone();
                let arg_0 = format!("{} {} m\n", self.formatNum(_tmp_2494), self.formatNum(cmd.borrow().y.clone())).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "L" {
                // Line to
                let mut _tmp_2502 = cmd.borrow().x.clone();
                let arg_0 = format!("{} {} l\n", self.formatNum(_tmp_2502), self.formatNum(cmd.borrow().y.clone())).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "C" {
                // Cubic Bezier curve
                let mut _tmp_2518 = cmd.borrow().x1.clone();
                let mut _tmp_2519 = cmd.borrow().y1.clone();
                let mut _tmp_2520 = cmd.borrow().x2.clone();
                let mut _tmp_2521 = cmd.borrow().y2.clone();
                let mut _tmp_2522 = cmd.borrow().x.clone();
                let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(_tmp_2518), self.formatNum(_tmp_2519), self.formatNum(_tmp_2520), self.formatNum(_tmp_2521), self.formatNum(_tmp_2522), self.formatNum(cmd.borrow().y.clone())).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "Q" {
                // Quadratic -> cubic, by exact degree elevation:
                //   C1 = P0 + 2/3 (C - P0)
                //   C2 = P3 + 2/3 (C - P3)
                // This used to emit the quadratic control point as BOTH cubic
                // controls, which is not the same curve — it pulls far too
                // weakly and rendered visibly flatter than the identical path in
                // HTML, where the browser elevates correctly.
                let c1x: f64 = cur_x + (2.0 / 3.0) * (cmd.borrow().x1 - cur_x);
                let c1y: f64 = cur_y + (2.0 / 3.0) * (cmd.borrow().y1 - cur_y);
                let c2x: f64 = cmd.borrow().x + (2.0 / 3.0) * (cmd.borrow().x1 - cmd.borrow().x);
                let c2y: f64 = cmd.borrow().y + (2.0 / 3.0) * (cmd.borrow().y1 - cmd.borrow().y);
                let mut _tmp_2534 = cmd.borrow().x.clone();
                let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(c1x), self.formatNum(c1y), self.formatNum(c2x), self.formatNum(c2y), self.formatNum(_tmp_2534), self.formatNum(cmd.borrow().y.clone())).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "Z" {
                // Close path
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "h\n");
                cur_x = start_x;
                cur_y = start_y;
            }
            // Degree elevation needs the segment's start point, so track the pen
            // the same way the path grammar does.
            if cmd.borrow().r#type == "M" {
                start_x = cmd.borrow().x;
                start_y = cmd.borrow().y;
            }
            if !(cmd.borrow().r#type == "Z") {
                cur_x = cmd.borrow().x;
                cur_y = cmd.borrow().y;
            }
            i += 1;
        }
    }
    fn renderPath(&mut self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        // An imported document is a whole drawing rather than one `d` with the
        // element's own paint, so it goes through the importer and then draws
        // the same way — same viewBox rule, same path operators.
        if !el.borrow().svgSource.is_empty() {
            self.renderSvgDocument(el, x, y, w, h);
            return;
        }
        let path_data: String = el.borrow().svgPath.clone();
        if path_data.is_empty() {
            return;
        }
        // Parse SVG path
        let mut parser: Rc<RefCell<SVGPathParser>> = Rc::new(RefCell::new(SVGPathParser::new()));
        SVGPathParser::parse(&parser, path_data.clone());
        // Commands stay in USER UNITS. What maps them onto the element box is
        // the viewBox transform below, shared with every other renderer — see
        // PLAN_VECTOR_IR.md §2.1. This used to be `getScaledCommands(w h)`,
        // which fitted the path's ink to the box with independent x and y
        // scales: it stretched non-square art and ate the padding an icon had
        // been designed with, and no other renderer did the same thing.
        let mut commands: Vec<Rc<RefCell<PathCommand>>> = SVGPathParser::getCommands(&parser);
        // Determine fill and stroke colors
        let mut fill_color: Option<Rc<RefCell<EVGColor>>> = el.borrow().fillColor.clone().clone();
        let mut stroke_color: Option<Rc<RefCell<EVGColor>>> = el.borrow().strokeColor.clone().clone();
        // Default to backgroundColor if fill not set
        if !fill_color.as_ref().unwrap().borrow().isSet {
            fill_color = el.borrow().backgroundColor.clone();
        }
        let mut m: Rc<RefCell<Matrix2D>> = self.pathViewBoxMatrix(el,
            &parser,
            w,
            h
        );
        // Start path
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        // Translate to element position
        let arg_0 = format!("1 0 0 1 {} {} cm\n", self.formatNum(x), self.formatNum(y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Flip Y axis for path coordinates (SVG uses top-left, PDF uses bottom-left)
        let arg_0 = format!("1 0 0 -1 0 {} cm\n", self.formatNum(h)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // viewBox -> element box. Same six numbers in the same order as an SVG
        // matrix(...), so this is a straight hand-off with no reordering.
        let mut _tmp_2561 = m.borrow().a.clone();
        let mut _tmp_2562 = m.borrow().b.clone();
        let mut _tmp_2563 = m.borrow().c.clone();
        let mut _tmp_2564 = m.borrow().d.clone();
        let mut _tmp_2565 = m.borrow().e.clone();
        let arg_0 = format!("{} {} {} {} {} {} cm\n", self.formatNum(_tmp_2561), self.formatNum(_tmp_2562), self.formatNum(_tmp_2563), self.formatNum(_tmp_2564), self.formatNum(_tmp_2565), self.formatNum(m.borrow().f.clone())).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        self.writePathOps(&commands);
        let mut _tmp_2568 = el.borrow().strokeWidth.clone();
        let mut _tmp_2569 = el.borrow().fillRule.clone();
        let mut _tmp_2570 = el.borrow().strokeDashArray.clone();
        let mut _tmp_2571 = el.borrow().strokeDashOffset.clone();
        self.writePaintOps(&fill_color.clone().unwrap(),
            &stroke_color.clone().unwrap(),
            _tmp_2568,
            &_tmp_2569,
            &_tmp_2570,
            _tmp_2571
        );
        // A connector's heads, under the same transform: filled, no stroke,
        // no dash. Their own path because a fill closes every subpath it is
        // given — see `EVGElement.arrowPath`.
        if !el.borrow().arrowPath.is_empty() {
            let mut hc: Rc<RefCell<EVGColor>> = EVGElement::arrowFillColor(&el);
            if hc.borrow().isSet {
                let mut hp: Rc<RefCell<SVGPathParser>> = Rc::new(RefCell::new(SVGPathParser::new()));
                SVGPathParser::parse(&hp, el.borrow().arrowPath.clone());
                let mut hcmds: Vec<Rc<RefCell<PathCommand>>> = SVGPathParser::getCommands(&hp);
                self.writePathOps(&hcmds);
                let mut no_stroke: Rc<RefCell<EVGColor>> = EVGColor::noColor();
                self.writePaintOps(&hc, &no_stroke, 0.0, "nonzero", "", 0.0);
            }
        }
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    /// The colour, width, dash and painting operators for a path that has just
    /// been written into the stream.
    ///
    /// The fill rule reaches PDF here for the first time. `f` and `B` are the
    /// non-zero operators; `f*` and `B*` are the even-odd ones. Before this the
    /// renderer always used the non-zero pair, so `fill-rule="evenodd"` — which
    /// HTML passes to the browser and the raster target has honoured since the
    /// rasterizer was extracted — silently filled the middle of a ring in PDF and
    /// left it hollow in the other two. That is precisely the class of
    /// disagreement PLAN_VECTOR_IR.md exists to remove, so it is fixed on the way
    /// past rather than left for the imported case only.
    fn writePaintOps(&mut self, fill_color: &Rc<RefCell<EVGColor>>, stroke_color: &Rc<RefCell<EVGColor>>, stroke_width: f64, fill_rule: &str, dash_array: &str, dash_offset: f64) {
        let even_odd: bool = fill_rule == "evenodd";
        // Translucency first, and inside the q/Q the caller already opened, so
        // it is restored with everything else rather than leaking onto the next
        // shape.
        let mut fa: f64 = 1.0;
        if fill_color.borrow().isSet {
            fa = fill_color.borrow().a;
        }
        let mut sa: f64 = 1.0;
        if stroke_color.borrow().isSet {
            sa = stroke_color.borrow().a;
        }
        let gs: String = self.alphaState(fa, sa);
        if !gs.is_empty() {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &gs);
        }
        if fill_color.borrow().isSet {
            let r: f64 = fill_color.borrow().r / 255.0;
            let g: f64 = fill_color.borrow().g / 255.0;
            let b: f64 = fill_color.borrow().b / 255.0;
            let mut _tmp_2578 = self.fillOp(r, g, b);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2578);
        }
        if stroke_color.borrow().isSet {
            let sr: f64 = stroke_color.borrow().r / 255.0;
            let sg: f64 = stroke_color.borrow().g / 255.0;
            let sb: f64 = stroke_color.borrow().b / 255.0;
            let mut _tmp_2581 = self.strokeOp(sr, sg, sb);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2581);
            if stroke_width > 0.0 {
                let arg_0 = format!("{} w\n", self.formatNum(stroke_width)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            self.writeDashArray(dash_array, dash_offset);
        }
        if fill_color.borrow().isSet && stroke_color.borrow().isSet {
            if even_odd {
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "B*\n");
            } else {
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "B\n");
            }
            return;
        }
        if fill_color.borrow().isSet {
            if even_odd {
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "f*\n");
            } else {
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "f\n");
            }
            return;
        }
        if stroke_color.borrow().isSet {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "S\n");
        }
    }
    /// ------------------------------------------------------------------------
    /// An imported SVG document
    /// ------------------------------------------------------------------------
    /// The element box and the document's viewBox decide the placement, through
    /// the same VectorViewBox call a `<Path>` makes — so an icon written inline
    /// and the same icon imported from a file land in the same place at the same
    /// size.
    ///
    /// One q/Q pair and one `cm` for the whole drawing, then a path per shape.
    /// The importer has already baked every group transform into the geometry,
    /// so there is no transform stack to maintain here.
    fn renderSvgDocument(&mut self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        let mut sp: Rc<RefCell<SvgParser>> = Rc::new(RefCell::new(SvgParser::new()));
        // The element's fill becomes the imported document's initial paint, so a
        // drawing that names no colours takes the one the document (or its
        // stylesheet) asked for — the same relationship a `<Path>` already has
        // with its `fill`. A file that sets its own colours keeps them.
        if el.borrow().fillColor.as_ref().unwrap().borrow().isSet {
            SvgParser::setInitialFill(&sp, PdfOpt::fill(el.clone()));
        }
        let mut doc: Rc<RefCell<SvgDocument>> = SvgParser::parse(&sp, el.borrow().svgSource.clone());
        self.reportSvgDiagnostics(&doc);
        if SvgDocument::itemCount(&doc) == 0 {
            return;
        }
        let mut vb: Rc<RefCell<ViewBoxRect>> = SvgDocument::effectiveViewBox(&doc);
        let mut m: Rc<RefCell<Matrix2D>> = VectorViewBox::resolve(&vb, w, h, "xMidYMid meet");
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        let arg_0 = format!("1 0 0 1 {} {} cm\n", self.formatNum(x), self.formatNum(y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // SVG's y grows downward and PDF's grows upward.
        let arg_0 = format!("1 0 0 -1 0 {} cm\n", self.formatNum(h)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        let mut _tmp_2619 = m.borrow().a.clone();
        let mut _tmp_2620 = m.borrow().b.clone();
        let mut _tmp_2621 = m.borrow().c.clone();
        let mut _tmp_2622 = m.borrow().d.clone();
        let mut _tmp_2623 = m.borrow().e.clone();
        let arg_0 = format!("{} {} {} {} {} {} cm\n", self.formatNum(_tmp_2619), self.formatNum(_tmp_2620), self.formatNum(_tmp_2621), self.formatNum(_tmp_2622), self.formatNum(_tmp_2623), self.formatNum(m.borrow().f.clone())).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        let mut k: i64 = 0;
        while k < SvgDocument::itemCount(&doc) {
            let mut item: Rc<RefCell<SvgVectorItem>> = doc.borrow().items[k as usize].clone();
            self.writePathOps(&item.borrow().commands.clone());
            let mut _tmp_2627 = item.borrow().strokeWidth.clone();
            let mut _tmp_2628 = item.borrow().fillRule.clone();
            let mut _tmp_2629 = item.borrow().dashArray.clone();
            let mut _tmp_2630 = item.borrow().dashOffset.clone();
            let arg_0 = PdfOpt::itemFill(item.clone());
            let arg_1 = PdfOpt::itemStroke(item.clone());
            self.writePaintOps(&arg_0,
                &arg_1,
                _tmp_2627,
                &_tmp_2628,
                &_tmp_2629,
                _tmp_2630
            );
            k += 1;
        }
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    /// Everything the importer refused, printed once per document. A drawing that
    /// is missing its wordmark because <text> is out of profile has to be
    /// diagnosable from the build log, not from staring at the output (§7.4).
    fn reportSvgDiagnostics(&self, doc: &Rc<RefCell<SvgDocument>>) {
        if SvgDocument::hasErrors(&doc) {
            println!("  SVG import error: {}", SvgDocument::errorSummary(&doc));
        }
        if SvgDocument::hasWarnings(&doc) {
            println!("  SVG import: {}", SvgDocument::warningSummary(&doc));
        }
    }
    pub fn applyClipPath(&self, path_data: &str, x: f64, y: f64, w: f64, h: f64) {
        // Parse and scale the path, then use it as clipping
        let mut parser: Rc<RefCell<SVGPathParser>> = Rc::new(RefCell::new(SVGPathParser::new()));
        SVGPathParser::parse(&parser, path_data.to_string());
        // Get scaled commands
        let mut commands: Vec<Rc<RefCell<PathCommand>>> = SVGPathParser::getScaledCommands(
            &parser,
            w,
            h
        );
        // Build path directly in page coordinates
        // Note: x, y are already in PDF coordinates (y from bottom)
        // SVG path has Y going down, PDF has Y going up
        // So we need to flip Y: pdfY = y + h - svgY
        let mut i: i64 = 0;
        while i < (commands.len() as i64) {
            let mut cmd: Rc<RefCell<PathCommand>> = commands[i as usize].clone();
            // Transform: pageX = x + cmd.x, pageY = y + h - cmd.y
            let px: f64 = x + cmd.borrow().x;
            let py: f64 = (y + h) - cmd.borrow().y;
            let px1: f64 = x + cmd.borrow().x1;
            let py1: f64 = (y + h) - cmd.borrow().y1;
            let px2: f64 = x + cmd.borrow().x2;
            let py2: f64 = (y + h) - cmd.borrow().y2;
            if cmd.borrow().r#type == "M" {
                let arg_0 = format!("{} {} m\n", self.formatNum(px), self.formatNum(py)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "L" {
                let arg_0 = format!("{} {} l\n", self.formatNum(px), self.formatNum(py)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "C" {
                let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(px1), self.formatNum(py1), self.formatNum(px2), self.formatNum(py2), self.formatNum(px), self.formatNum(py)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "Q" {
                // Convert quadratic to cubic bezier
                let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(px1), self.formatNum(py1), self.formatNum(px1), self.formatNum(py1), self.formatNum(px), self.formatNum(py)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            if cmd.borrow().r#type == "Z" {
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "h\n");
            }
            i += 1;
        }
        // Apply as clipping path (W = set clipping, n = end path without fill/stroke)
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "W n\n");
    }
    /// Draw a rounded rectangle path (does not fill or stroke - just defines the path)
    /// Uses Bézier curves for the corners
    pub fn drawRoundedRectPath(&self, x: f64, y: f64, w: f64, h: f64, radius: f64) {
        // Clamp radius to half of smallest dimension
        let mut max_radius: f64 = w / 2.0;
        if h / 2.0 < max_radius {
            max_radius = h / 2.0;
        }
        let mut r: f64 = radius;
        if r > max_radius {
            r = max_radius;
        }
        if r <= 0.0 {
            // No radius, use regular rectangle
            let arg_0 = format!("{} {} {} {} re\n", self.formatNum(x), self.formatNum(y), self.formatNum(w), self.formatNum(h)).clone();
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            return;
        }
        // Bézier control point offset (approximation of circle with cubic Bézier)
        // k = 4 * (sqrt(2) - 1) / 3 ≈ 0.5523
        let k: f64 = 0.5523;
        let c: f64 = r * k;
        // Start at bottom-left, just after the corner radius
        let arg_0 = format!("{} {} m\n", self.formatNum(x), self.formatNum(y + r)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Bottom-left corner (curve from left edge to bottom edge)
        let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(x), self.formatNum((y + r) - c), self.formatNum((x + r) - c), self.formatNum(y), self.formatNum(x + r), self.formatNum(y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Bottom edge
        let arg_0 = format!("{} {} l\n", self.formatNum((x + w) - r), self.formatNum(y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Bottom-right corner
        let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(((x + w) - r) + c), self.formatNum(y), self.formatNum(x + w), self.formatNum((y + r) - c), self.formatNum(x + w), self.formatNum(y + r)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Right edge
        let arg_0 = format!("{} {} l\n", self.formatNum(x + w), self.formatNum((y + h) - r)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Top-right corner
        let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum(x + w), self.formatNum(((y + h) - r) + c), self.formatNum(((x + w) - r) + c), self.formatNum(y + h), self.formatNum((x + w) - r), self.formatNum(y + h)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Top edge
        let arg_0 = format!("{} {} l\n", self.formatNum(x + r), self.formatNum(y + h)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Top-left corner
        let arg_0 = format!("{} {} {} {} {} {} c\n", self.formatNum((x + r) - c), self.formatNum(y + h), self.formatNum(x), self.formatNum(((y + h) - r) + c), self.formatNum(x), self.formatNum((y + h) - r)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Left edge back to start
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "h\n");
    }
    /// Render a shadow behind an element
    fn renderShadow(&self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64, radius: f64) {
        // Check if shadow is set
        if !el.borrow().shadowRadius.as_ref().unwrap().borrow().isSet {
            if !el.borrow().shadowColor.as_ref().unwrap().borrow().isSet {
                return;
            }
        }
        // Get shadow properties
        let mut offset_x: f64 = 0.0;
        let mut offset_y: f64 = 0.0;
        if el.borrow().shadowOffsetX.as_ref().unwrap().borrow().isSet {
            offset_x = el.borrow().shadowOffsetX.as_ref().unwrap().borrow().pixels;
        }
        if el.borrow().shadowOffsetY.as_ref().unwrap().borrow().isSet {
            // PDF Y is flipped, so negate the Y offset
            offset_y = 0.0 - el.borrow().shadowOffsetY.as_ref().unwrap().borrow().pixels;
        }
        let mut blur: f64 = 0.0;
        if el.borrow().shadowRadius.as_ref().unwrap().borrow().isSet {
            blur = el.borrow().shadowRadius.as_ref().unwrap().borrow().pixels;
        }
        // Get shadow color (default semi-transparent black)
        let mut shadow_color: Option<Rc<RefCell<EVGColor>>> = el.borrow().shadowColor.clone().clone();
        if !shadow_color.as_ref().unwrap().borrow().isSet {
            shadow_color = Some(EVGColor::rgba(0, 0, 0, 0.5));
        }
        // For PDF shadow simulation, we draw multiple increasingly larger and lighter shapes
        // starting from outside and working in, with the innermost being cut out
        // This creates a blur effect around the element
        let mut num_layers: i64 = 8;
        if blur < 5.0 {
            num_layers = 5;
        }
        if blur < 2.0 {
            num_layers = 3;
        }
        // Base alpha per layer (total should approximate shadow alpha)
        let base_alpha: f64 = shadow_color.as_ref().unwrap().borrow().a / 255.0;
        let alpha_per_layer: f64 = base_alpha / (num_layers as f64);
        // Draw layers from outside to inside
        let mut i: i64 = 0;
        while i < num_layers {
            // Calculate the spread for this layer (outermost = full blur, innermost = 0)
            let layer_ratio: f64 = ((num_layers - i) as f64) / (num_layers as f64);
            let spread: f64 = blur * layer_ratio;
            // Alpha increases towards center for Gaussian-like falloff
            let layer_alpha: f64 = alpha_per_layer * (1.0 + layer_ratio * 0.5);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
            // Set fill color with calculated alpha (approximated by using lighter color)
            let r: f64 = shadow_color.as_ref().unwrap().borrow().r / 255.0;
            let g: f64 = shadow_color.as_ref().unwrap().borrow().g / 255.0;
            let b: f64 = shadow_color.as_ref().unwrap().borrow().b / 255.0;
            // Blend towards background (assuming white/light background)
            let blend_factor: f64 = 1.0 - layer_alpha;
            let mut blended_r: f64 = r * layer_alpha + 1.0 * blend_factor;
            let mut blended_g: f64 = g * layer_alpha + 1.0 * blend_factor;
            let mut blended_b: f64 = b * layer_alpha + 1.0 * blend_factor;
            // Clamp to valid range
            if blended_r > 1.0 {
                blended_r = 1.0;
            }
            if blended_g > 1.0 {
                blended_g = 1.0;
            }
            if blended_b > 1.0 {
                blended_b = 1.0;
            }
            let mut _tmp_2721 = self.fillOp(blended_r, blended_g, blended_b);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2721);
            // Draw shadow shape at offset position with spread
            let sx: f64 = (x + offset_x) - spread;
            let sy: f64 = (y + offset_y) - spread;
            let sw: f64 = w + spread * 2.0;
            let sh: f64 = h + spread * 2.0;
            let sr: f64 = radius + spread;
            // Draw outer rounded rect
            self.drawRoundedRectPath(sx, sy, sw, sh, sr);
            // Cut out the inner area (next layer's area) using even-odd fill rule
            // This creates a ring/halo effect
            if i < num_layers - 1 {
                let next_ratio: f64 = (((num_layers - i) - 1) as f64) / (num_layers as f64);
                let next_spread: f64 = blur * next_ratio;
                let nx: f64 = (x + offset_x) - next_spread;
                let ny: f64 = (y + offset_y) - next_spread;
                let nw: f64 = w + next_spread * 2.0;
                let nh: f64 = h + next_spread * 2.0;
                let nr: f64 = radius + next_spread;
                self.drawRoundedRectPath(nx, ny, nw, nh, nr);
            }
            // Use even-odd fill rule to create the ring
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "f*\n");
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
            i += 1;
        }
    }
    fn renderBackgroundWithRadius(&mut self, x: f64, y: f64, w: f64, h: f64, color: &Rc<RefCell<EVGColor>>, radius: f64) {
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        let gs: String = self.alphaState(color.borrow().a.clone(), 1.0);
        if !gs.is_empty() {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &gs);
        }
        // Set fill color
        let r: f64 = color.borrow().r / 255.0;
        let g: f64 = color.borrow().g / 255.0;
        let b: f64 = color.borrow().b / 255.0;
        let mut _tmp_2733 = self.fillOp(r, g, b);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2733);
        // Draw rounded rectangle
        self.drawRoundedRectPath(x, y, w, h, radius);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "f\n");
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    fn renderBackground(&mut self, x: f64, y: f64, w: f64, h: f64, color: &Rc<RefCell<EVGColor>>) {
        self.renderBackgroundWithRadius(x, y, w, h, color, 0.0);
    }
    /// The `gradient-from` / `gradient-to` pair, in PDF.
    ///
    /// The same gap the raster tool had: this renderer knew only the CSS string,
    /// so a gradient that came from Figma — or from anything else speaking the
    /// display list's own vocabulary — drew on the GPU and was simply absent
    /// from the PDF.
    ///
    /// The angle comes from `EVGDisplayList.cssAngleOfDir` and NOT from the
    /// raster one beside it: this file reduces a CSS angle, where 90 is to the
    /// right, while the rasteriser builds a vector where 0 is. One `dir`, two
    /// correct answers, and taking the wrong one turns every gradient a quarter
    /// turn in one target only.
    fn renderTwoStopGradientBackground(&self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64, radius: f64) {
        if w <= 0.0 {
            return;
        }
        if h <= 0.0 {
            return;
        }
        // The ends are optional fields, so they are unwrapped rather than
        // pushed: a gradient with one end missing is not half a gradient, it is
        // a paint nobody can draw.
        let mut a: Option<Rc<RefCell<EVGColor>>> = el.borrow().gradientFrom.clone().clone();
        let mut b: Option<Rc<RefCell<EVGColor>>> = el.borrow().gradientTo.clone().clone();
        if a.is_none() {
            return;
        }
        if b.is_none() {
            return;
        }
        let mut colors: Vec<Rc<RefCell<EVGColor>>> = Vec::new();
        colors.push(a.clone().unwrap());
        colors.push(b.clone().unwrap());
        self.paintGradientStrips(x, y, w, h, radius, &colors, EVGDisplayList::cssAngleOfDir(el.borrow().gradientDir));
    }
    /// Render a gradient background by drawing multiple thin strips
    /// Parses CSS gradient syntax: linear-gradient(angle, color1, color2, ...)
    fn renderGradientBackground(&mut self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64, radius: f64) {
        let gradient: String = el.borrow().backgroundGradient.clone();
        // Parse gradient type and angle
        let is_linear: bool = gradient.contains("linear-gradient");
        let is_radial: bool = gradient.contains("radial-gradient");
        if !is_linear {
            if !is_radial {
                return;
            }
        }
        // Extract colors from gradient string
        // Format: linear-gradient(90deg, #ff0000, #0000ff)
        // or: radial-gradient(circle, #ff0000, #0000ff)
        // Find the opening parenthesis
        let paren_start: i64 = PdfText::index_of(&gradient, "(");
        if paren_start < 0 {
            return;
        }
        // Find the closing parenthesis
        let paren_end: i64 = PdfText::last_index_of(&gradient, ")");
        if paren_end < 0 {
            return;
        }
        // Extract content inside parentheses
        let content: String = PdfText::substr(&gradient, paren_start + 1, paren_end);
        // Split by comma
        let mut parts: Vec<String> = content.split(",").map(|s| s.to_string()).collect::<Vec<String>>();
        if (parts.len() as i64) < 2 {
            return;
        }
        // First part is angle (for linear) or shape (for radial)
        let first_part: String = parts[0].clone().trim().to_string();
        let mut angle: f64 = 180.0;
        if is_linear {
            // Parse angle (e.g., "90deg", "45deg", "180deg")
            if first_part.contains("deg") {
                let angle_str: String = first_part.replace("deg".to_string().as_str(), String::new().as_str());
                let angle_val: Option<f64> = angle_str.parse::<f64>().ok();
                if angle_val.is_some() {
                    angle = angle_val.unwrap();
                }
            }
        }
        // Collect colors (remaining parts)
        let mut colors: Vec<Rc<RefCell<EVGColor>>> = Vec::new();
        let mut i: i64 = 1;
        while i < (parts.len() as i64) {
            let color_str: String = parts[i as usize].clone().trim().to_string();
            let mut color: Rc<RefCell<EVGColor>> = EVGColor::parse(&color_str);
            if color.borrow().isSet {
                colors.push(color.clone());
            }
            i += 1;
        }
        if (colors.len() as i64) < 2 {
            // Not enough colors, just use first color as solid
            if (colors.len() as i64) == 1 {
                let mut c: Rc<RefCell<EVGColor>> = colors[0].clone();
                self.renderBackgroundWithRadius(x, y, w, h, &c, radius);
            }
            return;
        }
        self.paintGradientStrips(x, y, w, h, radius, &colors, angle);
    }
    /// Everything after the parse: the clip, the direction, and the strips.
    ///
    /// Split out so the `gradient-from` / `gradient-to` pair can reach it without
    /// being rendered into a CSS string and parsed straight back — which is what
    /// the alternative was, and it would have made the two-stop path's accuracy
    /// depend on a round trip through text.
    fn paintGradientStrips(&self, x: f64, y: f64, w: f64, h: f64, radius: f64, colors: &Vec<Rc<RefCell<EVGColor>>>, angle_in: f64) {
        let mut angle: f64 = angle_in;
        // Clip to the rounded rectangle shape first
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        if radius > 0.0 {
            self.drawRoundedRectPath(x, y, w, h, radius);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "W n\n");
        }
        // Calculate gradient direction
        let num_steps: i64 = 50;
        // unused:  let radians: f64 = (angle * 3.14159265) / 180.0;
        // Determine if horizontal or vertical gradient
        let mut is_horizontal: bool = false;
        // Normalize angle to 0-360
        while angle < 0.0 {
            angle += 360.0;
        }
        while angle >= 360.0 {
            angle -= 360.0;
        }
        // Approximate angle to major directions for simpler rendering
        // Horizontal: Right (90 deg) or Left (270 deg)
        // Vertical: Down (180 deg) or Up (0/360 deg) - handled by else branch
        if angle >= 45.0 && angle < 135.0 {
            // Right (90 deg)
            is_horizontal = true;
        }
        if angle >= 225.0 && angle < 315.0 {
            // Left (270 deg)
            is_horizontal = true;
        }
        // Draw gradient strips
        let mut step_idx: i64 = 0;
        while step_idx < num_steps {
            let t: f64 = (step_idx as f64) / ((num_steps - 1) as f64);
            // Interpolate color
            let color_idx: f64 = t * (((colors.len() as i64) - 1) as f64);
            let idx1: i64 = color_idx.floor() as i64;
            let mut idx2: i64 = idx1 + 1;
            if idx2 >= (colors.len() as i64) {
                idx2 = (colors.len() as i64) - 1;
            }
            let local_t: f64 = color_idx - (idx1 as f64);
            let mut c1: Rc<RefCell<EVGColor>> = colors[idx1 as usize].clone();
            let mut c2: Rc<RefCell<EVGColor>> = colors[idx2 as usize].clone();
            // Linear interpolation of RGB
            let r: f64 = (c1.borrow().r * (1.0 - local_t) + c2.borrow().r * local_t) / 255.0;
            let g: f64 = (c1.borrow().g * (1.0 - local_t) + c2.borrow().g * local_t) / 255.0;
            let b: f64 = (c1.borrow().b * (1.0 - local_t) + c2.borrow().b * local_t) / 255.0;
            let mut _tmp_2744 = self.fillOp(r, g, b);
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2744);
            // Draw a strip
            if is_horizontal {
                let strip_w: f64 = w / (num_steps as f64);
                let mut strip_x: f64 = x;
                if angle >= 225.0 && angle < 315.0 {
                    // Left direction - reverse
                    strip_x = (x + w) - strip_w * ((step_idx + 1) as f64);
                } else {
                    strip_x = x + strip_w * (step_idx as f64);
                }
                let arg_0 = format!("{} {} {} {} re\n", self.formatNum(strip_x), self.formatNum(y), self.formatNum(strip_w + 0.5), self.formatNum(h)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            } else {
                let strip_h: f64 = h / (num_steps as f64);
                let mut strip_y: f64 = y;
                if angle >= 135.0 && angle < 225.0 {
                    // Down direction
                    strip_y = (y + h) - strip_h * ((step_idx + 1) as f64);
                } else {
                    // Up direction - reverse
                    strip_y = y + strip_h * (step_idx as f64);
                }
                let arg_0 = format!("{} {} {} {} re\n", self.formatNum(x), self.formatNum(strip_y), self.formatNum(w), self.formatNum(strip_h + 0.5)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
            }
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "f\n");
            step_idx += 1;
        }
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    fn renderBorderWithRadius(&self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64, radius: f64) {
        // Width and colour through the element's own accessor, so this
        // agrees with the raster and GPU backends whichever of the two places
        // the border was actually written to.
        let border_width: f64 = EVGElement::effectiveBorderWidthPx(&el);
        if border_width <= 0.0 {
            return;
        }
        let mut border_color: Rc<RefCell<EVGColor>> = EVGElement::effectiveBorderColor(&el);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        // Set stroke color
        let r: f64 = border_color.borrow().r / 255.0;
        let g: f64 = border_color.borrow().g / 255.0;
        let b: f64 = border_color.borrow().b / 255.0;
        let mut _tmp_2765 = self.strokeOp(r, g, b);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2765);
        // Set line width
        let arg_0 = format!("{} w\n", self.formatNum(border_width)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Draw rounded rectangle outline
        self.drawRoundedRectPath(x, y, w, h, radius);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "S\n");
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    fn renderBorder(&self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        // Width and colour through the element's own accessor, so this
        // agrees with the raster and GPU backends whichever of the two places
        // the border was actually written to.
        let border_width: f64 = EVGElement::effectiveBorderWidthPx(&el);
        if border_width <= 0.0 {
            return;
        }
        let mut border_color: Rc<RefCell<EVGColor>> = EVGElement::effectiveBorderColor(&el);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        // Set stroke color
        let r: f64 = border_color.borrow().r / 255.0;
        let g: f64 = border_color.borrow().g / 255.0;
        let b: f64 = border_color.borrow().b / 255.0;
        let mut _tmp_2777 = self.strokeOp(r, g, b);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2777);
        // Set line width
        let arg_0 = format!("{} w\n", self.formatNum(border_width)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        // Draw rectangle outline
        let arg_0 = format!("{} {} {} {} re\n", self.formatNum(x), self.formatNum(y), self.formatNum(w), self.formatNum(h)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "S\n");
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    fn renderText(&mut self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        // Get text content (scan children for text nodes)
        let text: String = self.getTextContent(el);
        if text.is_empty() {
            return;
        }
        // Get font size
        let mut font_size: f64 = 14.0;
        if el.borrow().fontSize.as_ref().unwrap().borrow().isSet {
            font_size = el.borrow().fontSize.as_ref().unwrap().borrow().pixels;
        }
        // Get text color
        let mut color: Option<Rc<RefCell<EVGColor>>> = el.borrow().color.clone().clone();
        if !color.as_ref().unwrap().borrow().isSet {
            color = Some(EVGColor::black());
        }
        // Get line height
        let mut line_height: f64 = el.borrow().lineHeight;
        if line_height <= 0.0 {
            line_height = 1.2;
        }
        let line_spacing: f64 = font_size * line_height;
        // Get the face, weight included. Registering the bold cut under its own
        // name is what gets it embedded — before this a bold heading was
        // measured, embedded and drawn in the regular face, so `font-weight`
        // did nothing at all in a PDF.
        let mut font_family: String = EVGElement::effectiveFontFamily(&el);
        if font_family.is_empty() {
            font_family = "Helvetica".to_string();
        }
        // Wrap text to fit width using correct font — unless the element says
        // the line is already broken.
        let mut lines: Vec<String> = Vec::new();
        if el.borrow().whiteSpace == "nowrap" {
            lines.push(text.clone());
        } else {
            lines = self.wrapText(&text, w, font_size, &font_family);
        }
        // Get PDF font name
        let _font_name: String = self.getPdfFontName(&font_family);
        // Which face this string actually got. A resolution that went as asked
        // is only interesting under -debug — it was printed per text element,
        // which is a line of log per label on a chart. A face that was NOT
        // found is always worth saying, because the page will be set in
        // something other than what it asked for.
        let mut ttf_font_debug: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(&font_family);
        if ttf_font_debug.borrow().unitsPerEm > 0 {
            if self.debug {
                println!("PDF Font: requested='{}' -> resolved='{}' style='{}'", font_family, ttf_font_debug.borrow().fontFamily, ttf_font_debug.borrow().fontStyle);
            }
        } else {
            println!("PDF Font: requested='{}' -> FALLBACK (font not found)", font_family);
        }
        // Check for text shadow
        let mut has_shadow: bool = false;
        let mut shadow_offset_x: f64 = 0.0;
        let mut shadow_offset_y: f64 = 0.0;
        let mut shadow_blur: f64 = 0.0;
        let mut shadow_color: Rc<RefCell<EVGColor>> = EVGColor::rgba(0, 0, 0, 0.5);
        if el.borrow()
            .shadowRadius.as_ref()
            .unwrap()
            .borrow()
            .isSet || el.borrow()
            .shadowColor.as_ref()
            .unwrap()
            .borrow()
            .isSet {
            has_shadow = true;
            if el.borrow().shadowOffsetX.as_ref().unwrap().borrow().isSet {
                shadow_offset_x = el.borrow().shadowOffsetX.as_ref().unwrap().borrow().pixels;
            }
            if el.borrow().shadowOffsetY.as_ref().unwrap().borrow().isSet {
                // PDF Y is flipped
                shadow_offset_y = 0.0 - el.borrow().shadowOffsetY.as_ref().unwrap().borrow().pixels;
            }
            if el.borrow().shadowRadius.as_ref().unwrap().borrow().isSet {
                shadow_blur = el.borrow().shadowRadius.as_ref().unwrap().borrow().pixels;
            }
            if el.borrow().shadowColor.as_ref().unwrap().borrow().isSet {
                shadow_color = PdfOpt::shadow(el.clone());
            }
        }
        // Render each line (shadow first if present, then text)
        let mut line_y: f64 = (y + h) - font_size;
        let mut i: i64 = 0;
        while i < (lines.len() as i64) {
            let line: String = lines[i as usize].clone();
            // Calculate text X position based on alignment
            let mut text_x: f64 = x;
            if el.borrow().textAlign == "center" {
                let text_width: f64 = self.measurer.clone().unwrap().borrow_mut().measureTextWidth(
                    line.clone(),
                    font_family.clone(),
                    font_size
                );
                text_x = x + (w - text_width) / 2.0;
            }
            if el.borrow().textAlign == "right" {
                let text_width_1: f64 = self.measurer.clone().unwrap().borrow_mut().measureTextWidth(
                    line.clone(),
                    font_family.clone(),
                    font_size
                );
                text_x = (x + w) - text_width_1;
            }
            // Render shadow text first (if shadow is set)
            if has_shadow {
                // For blur effect, render multiple slightly offset shadow copies
                let mut num_passes: i64 = 1;
                if shadow_blur > 1.0 {
                    num_passes = 3;
                }
                let mut pass: i64 = 0;
                while pass < num_passes {
                    let mut blur_offset: f64 = 0.0;
                    if num_passes > 1 {
                        blur_offset = (shadow_blur * 0.3) * (pass as f64);
                    }
                    // Calculate shadow color (blend towards background for blur effect)
                    let shadow_alpha: f64 = (shadow_color.borrow().a / 255.0) / (num_passes as f64);
                    let blend_factor: f64 = 1.0 - shadow_alpha;
                    let sr: f64 = (shadow_color.borrow().r / 255.0) * shadow_alpha + 1.0 * blend_factor;
                    let sg: f64 = (shadow_color.borrow().g / 255.0) * shadow_alpha + 1.0 * blend_factor;
                    let sb: f64 = (shadow_color.borrow().b / 255.0) * shadow_alpha + 1.0 * blend_factor;
                    let shadow_x: f64 = (text_x + shadow_offset_x) + blur_offset;
                    let shadow_y: f64 = (line_y + shadow_offset_y) - blur_offset;
                    let mut sh_segs: Vec<Rc<RefCell<PDFTextSegment>>> = self.splitLine(&line,
                        &font_family,
                        font_size,
                        shadow_x
                    );
                    let mut shi: i64 = 0;
                    while shi < (sh_segs.len() as i64) {
                        let mut sh_seg: Rc<RefCell<PDFTextSegment>> = sh_segs[shi as usize].clone();
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "BT\n");
                        let arg_0 = format!("{} {} Tf\n", self.segmentFontName(&sh_seg), self.formatNum(font_size)).clone();
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                        let mut _tmp_2804 = self.fillOp(sr, sg, sb);
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2804);
                        let arg_0 = format!("{} {} Td\n", self.formatNum(sh_seg.borrow().x.clone()), self.formatNum(shadow_y)).clone();
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                        let arg_0 = format!("{}\n", self.segmentShowOperator(&sh_seg)).clone();
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "ET\n");
                        shi += 1;
                    }
                    pass += 1;
                }
            }
            // Render actual text
            let r: f64 = color.as_ref().unwrap().borrow().r / 255.0;
            let g: f64 = color.as_ref().unwrap().borrow().g / 255.0;
            let b: f64 = color.as_ref().unwrap().borrow().b / 255.0;
            // A fallback face is monochrome outlines and takes whatever colour
            // it is filled with, so `emoji-color` can hand it a different one
            // from the sentence it sits in. Unset, this is the text colour and
            // the output is unchanged.
            let mut ec: Rc<RefCell<EVGColor>> = EVGElement::effectiveEmojiColor(&el);
            let er: f64 = ec.borrow().r / 255.0;
            let eg: f64 = ec.borrow().g / 255.0;
            let eb: f64 = ec.borrow().b / 255.0;
            let mut segs: Vec<Rc<RefCell<PDFTextSegment>>> = self.splitLine(&line,
                &font_family,
                font_size,
                text_x
            );
            let mut sgi: i64 = 0;
            while sgi < (segs.len() as i64) {
                let mut seg: Rc<RefCell<PDFTextSegment>> = segs[sgi as usize].clone();
                let mut sr_1: f64 = r;
                let mut sg_1: f64 = g;
                let mut sb_1: f64 = b;
                if seg.borrow().isCid {
                    sr_1 = er;
                    sg_1 = eg;
                    sb_1 = eb;
                }
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "BT\n");
                let arg_0 = format!("{} {} Tf\n", self.segmentFontName(&seg), self.formatNum(font_size)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                let mut _tmp_2824 = self.fillOp(sr_1, sg_1, sb_1);
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2824);
                let arg_0 = format!("{} {} Td\n", self.formatNum(seg.borrow().x.clone()), self.formatNum(line_y)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                let arg_0 = format!("{}\n", self.segmentShowOperator(&seg)).clone();
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
                GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "ET\n");
                sgi += 1;
            }
            line_y -= line_spacing;
            i += 1;
        }
    }
    /// The show operator for one line: a plain `Tj`, or a `TJ` array carrying
    /// the face's kerning.
    ///
    /// A PDF viewer advances by the /Widths entry and applies no kerning of its
    /// own, so a page whose layout was measured with kerning but painted with
    /// `Tj` would reserve one width and draw another — the box right, the ink
    /// wrong, which is worse than not kerning at all. `TJ` puts the adjustment
    /// in the stream.
    ///
    /// TJ numbers are thousandths of a text-space unit and move the pen LEFT,
    /// and /Widths is written scaled to 1000 units per em regardless of the
    /// face's own unitsPerEm — so a kern of k font units becomes -1000k/upem.
    /// Emit a Type0/Identity-H font for every fallback face the content stream
    /// used, filling cidFontObjNums so the page resource dicts can reference
    /// them as /E1..
    ///
    /// Must run AFTER the content streams are built: Identity-H writes glyph ids
    /// into the stream, so which glyphs exist is only known once the text has
    /// been laid down. The whole face is embedded rather than subsetted — a
    /// subsetter has to rewrite loca/glyf and renumber composite components, and
    /// that is a separate piece of work.
    fn writeCidFontObjects(&mut self, pdf: &Rc<RefCell<GrowableBuffer>>, mut object_offsets: &mut Vec<i64>) {
        self.cidFontObjNums.clear();
        let mut fi: i64 = 0;
        while fi < (self.usedCidFonts.len() as i64) {
            let family: String = self.usedCidFonts[fi as usize].clone();
            let mut ttf: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(&family);
            if ttf.borrow().isLoaded() {
                // Only the glyphs this document drew. An emoji face is 858 KB
                // and a colour one 25 MB, essentially all of it `glyf`, so
                // embedding the file whole made one 🎉 cost more than the rest
                // of the PDF together. The subset keeps glyph ids, which is
                // what lets /CIDToGIDMap stay /Identity and the strings
                // already written stay valid.
                let mut subset_gids: Vec<i64> = Vec::new();
                let mut gi: i64 = 0;
                while gi < (self.cidUsedGid.len() as i64) {
                    if self.cidUsedFont[gi as usize] == fi {
                        subset_gids.push(self.cidUsedGid[gi as usize]);
                    }
                    gi += 1;
                }
                let mut font_file_data: Vec<u8> = TTFSubset::build(&ttf, &subset_gids);
                if font_file_data.is_empty() {
                    // A face the subsetter cannot handle — a CFF outline font,
                    // say. Embed it whole rather than emit a font with no
                    // glyphs in it.
                    font_file_data = ttf.borrow().getFontData();
                }
                let font_file_len: i64 = font_file_data.len() as i64;
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, &format!("<< /Length {} /Length1 {} >>\n", font_file_len, font_file_len));
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeBuffer(&pdf, &font_file_data);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let font_file_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                let ps_name: String = self.faceFontName(&family, &ttf.borrow().fontFamily.clone());
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /FontDescriptor");
                GrowableBuffer::writeString(&pdf, &format!(" /FontName /{}", ps_name));
                // Flag 4 = symbolic. An emoji face has no Latin alphabet and
                // declaring it nonsymbolic makes readers try to apply a
                // standard encoding to it.
                GrowableBuffer::writeString(&pdf, " /Flags 4");
                GrowableBuffer::writeString(&pdf, &format!(" /FontBBox [0 {} 1000 {}]", ttf.borrow().descender, ttf.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /ItalicAngle 0");
                GrowableBuffer::writeString(&pdf, &format!(" /Ascent {}", ttf.borrow().ascender));
                GrowableBuffer::writeString(&pdf, &format!(" /Descent {}", ttf.borrow().descender));
                GrowableBuffer::writeString(&pdf, &format!(" /CapHeight {}", ttf.borrow().ascender));
                GrowableBuffer::writeString(&pdf, " /StemV 80");
                GrowableBuffer::writeString(&pdf, &format!(" /FontFile2 {} 0 R", font_file_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let desc_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                let cid_to_uni: String = self.cidToUnicodeCMap(fi);
                GrowableBuffer::writeString(&pdf, &format!("<< /Length {} >>\n", (PdfText::str_len(&cid_to_uni) as i64)));
                GrowableBuffer::writeString(&pdf, "stream\n");
                GrowableBuffer::writeString(&pdf, &cid_to_uni);
                GrowableBuffer::writeString(&pdf, "\nendstream\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let to_uni_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /CIDFontType2");
                GrowableBuffer::writeString(&pdf, &format!(" /BaseFont /{}", ps_name));
                GrowableBuffer::writeString(&pdf, " /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>");
                GrowableBuffer::writeString(&pdf, &format!(" /FontDescriptor {} 0 R", desc_obj_num));
                GrowableBuffer::writeString(&pdf, " /DW 1000");
                GrowableBuffer::writeString(&pdf, " /W [");
                let mut wi: i64 = 0;
                while wi < (self.cidUsedGid.len() as i64) {
                    if self.cidUsedFont[wi as usize] == fi {
                        let gid: i64 = self.cidUsedGid[wi as usize];
                        // By GLYPH id. Looking the width up by codepoint was
                        // wrong the moment a glyph could be a ligature of
                        // several — a joined family would have been charged
                        // the width of its first member alone.
                        let w_units: i64 = ttf.borrow().getGlyphWidth(gid);
                        let scaled: i64 = (((w_units as f64) * 1000.0) / (ttf.borrow().unitsPerEm as f64)).floor() as i64;
                        GrowableBuffer::writeString(&pdf, &format!(" {} [{}]", gid, scaled));
                    }
                    wi += 1;
                }
                GrowableBuffer::writeString(&pdf, " ]");
                // The CID written into the stream IS the glyph id.
                GrowableBuffer::writeString(&pdf, " /CIDToGIDMap /Identity");
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                let cid_font_obj_num: i64 = self.nextObjNum;
                self.nextObjNum += 1;
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type0");
                GrowableBuffer::writeString(&pdf, &format!(" /BaseFont /{}", ps_name));
                GrowableBuffer::writeString(&pdf, " /Encoding /Identity-H");
                GrowableBuffer::writeString(&pdf, &format!(" /DescendantFonts [{} 0 R]", cid_font_obj_num));
                GrowableBuffer::writeString(&pdf, &format!(" /ToUnicode {} 0 R", to_uni_obj_num));
                GrowableBuffer::writeString(&pdf, " >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                self.cidFontObjNums.push(self.nextObjNum);
                self.nextObjNum += 1;
            } else {
                // The face vanished between drawing and embedding, which should
                // not happen — but a resource must still exist or the page is
                // malformed.
                object_offsets.push(GrowableBuffer::size(&pdf));
                GrowableBuffer::writeString(&pdf, &format!("{} 0 obj\n", self.nextObjNum.to_string()));
                GrowableBuffer::writeString(&pdf, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
                GrowableBuffer::writeString(&pdf, "endobj\n\n");
                self.cidFontObjNums.push(self.nextObjNum);
                self.nextObjNum += 1;
            }
            fi += 1;
        }
    }
    /// Glyph id -> Unicode, so the emoji can be selected and copied out of the
    /// page rather than being an anonymous picture. Identity-H strings carry no
    /// character information at all, so without this a reader has nothing.
    pub fn cidToUnicodeCMap(&self, font_idx: i64) -> String {
        let mut entries: Vec<String> = Vec::new();
        let mut i: i64 = 0;
        while i < (self.cidUsedGid.len() as i64) {
            if self.cidUsedFont[i as usize] == font_idx {
                let gid: i64 = self.cidUsedGid[i as usize];
                let text: String = self.cidUsedText[i as usize].clone();
                // The destination is every codepoint the glyph stands for, in
                // UTF-16BE. A bfchar destination may hold a whole sequence,
                // which is what makes a joined emoji copy out as itself.
                let mut dst: String = String::new();
                let mut ci: i64 = 0;
                while ci < (PdfText::str_len(&text) as i64) {
                    {
                        dst.push_str(&format!("{}", self.utf16BeHex(EVGCodepoint::codeAt(&text, ci))));
                    }
                    ci += EVGCodepoint::unitsAt(&text, ci);
                }
                entries.push(format!("<{}> <{}>", self.toHex4(gid), dst));
            }
            i += 1;
        }
        let mut cmap: String = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n".to_string();
        cmap.push_str("/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n");
        cmap.push_str("/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n");
        cmap.push_str("1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n");
        // A bfchar block holds at most 100 entries, so long runs are chunked.
        let n: i64 = entries.len() as i64;
        let mut start: i64 = 0;
        while start < n {
            let mut end: i64 = start + 100;
            if end > n {
                end = n;
            }
            cmap.push_str(&format!("{} beginbfchar\n", end - start));
            let mut j: i64 = start;
            while j < end {
                cmap.push_str(&format!("{}\n", entries[j as usize].clone()));
                j += 1;
            }
            cmap.push_str("endbfchar\n");
            start = end;
        }
        cmap.push_str("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend");
        cmap
    }
    /// A codepoint as UTF-16BE hex — a surrogate PAIR above the BMP, which is
    /// what a bfchar destination has to be.
    pub fn utf16BeHex(&self, cp: i64) -> String {
        if cp < 65536 {
            return self.toHex4(cp);
        }
        let rel: i64 = cp - 65536;
        let hi: i64 = 55296 + ((rel as f64 / 1024.0).floor() as i64);
        let lo: i64 = 56320 + rel % 1024;
        format!("{}{}", self.toHex4(hi), self.toHex4(lo))
    }
    /// How far a segment moves the pen — measured the way that segment is
    /// DRAWN, which for a fallback span means shaped.
    ///
    /// Measuring it through the ordinary measurer charged a joined family one
    /// advance per codepoint and drew one glyph, so every segment after it on
    /// the line started too far right.
    pub fn segmentWidth(&self, seg: &Rc<RefCell<PDFTextSegment>>, font_size: f64) -> f64 {
        if seg.borrow().isCid {
            let mut face: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(&seg.borrow().family.clone());
            if face.borrow().isLoaded() {
                return face.borrow_mut().measureShapedText(&seg.borrow().text.clone(), font_size);
            }
        }
        let _tmp_2843 = self.measurer.clone().unwrap();
        let mut _tmp_2844 = seg.borrow().text.clone();
        return _tmp_2843.borrow_mut().measureTextWidth(_tmp_2844, seg.borrow().family.clone(), font_size);
    }
    pub fn segmentFontName(&mut self, seg: &Rc<RefCell<PDFTextSegment>>) -> String {
        if seg.borrow().isCid {
            return self.getCidFontName(&seg.borrow().family.clone());
        }
        return self.getPdfFontName(&seg.borrow().family.clone());
    }
    pub fn segmentShowOperator(&mut self, seg: &Rc<RefCell<PDFTextSegment>>) -> String {
        if seg.borrow().isCid {
            let mut _tmp_2848 = seg.borrow().text.clone();
            return self.cidShowOperator(&_tmp_2848, &seg.borrow().family.clone());
        }
        let mut _tmp_2850 = seg.borrow().text.clone();
        return self.textShowOperator(&_tmp_2850, &seg.borrow().family.clone());
    }
    pub fn textShowOperator(&mut self, line: &str, font_family: &str) -> String {
        let mut font: Rc<RefCell<TrueTypeFont>> = self.fontManager.borrow_mut().getFont(font_family);
        let plain: String = format!("({}) Tj", self.escapeText(line));
        if !font.borrow().hasKerning {
            return plain;
        }
        if font.borrow().unitsPerEm <= 0 {
            return plain;
        }
        let __len: i64 = PdfText::str_len(&line) as i64;
        if __len < 2 {
            return plain;
        }
        let mut out: String = "[".to_string();
        let mut seg: String = String::new();
        let mut kerns: i64 = 0;
        let mut i: i64 = 0;
        let mut prev_cp: i64 = 0;
        let mut first_cp: bool = true;
        while i < __len {
            let ch: i64 = EVGCodepoint::codeAt(line, i);
            let cp_step: i64 = EVGCodepoint::unitsAt(line, i);
            if !first_cp {
                let k: i64 = font.borrow_mut().kernUnits(prev_cp, ch);
                if k != 0 {
                    {
                        out.push_str(&format!("({})", self.escapeText(&seg)));
                    }
                    seg = String::new();
                    let num: f64 = ((0.0 - 1000.0) * (k as f64)) / (font.borrow().unitsPerEm as f64);
                    {
                        out.push_str(&format!(" {} ", self.formatNum(num)));
                    }
                    kerns += 1;
                }
            }
            prev_cp = ch;
            first_cp = false;
            { let _tmp_2855 = format!("{}", EVGCodepoint::toStr(ch)); seg.push_str(&_tmp_2855); }
            i += cp_step;
        }
        if kerns == 0 {
            return plain;
        }
        {
            out.push_str(&format!("({})] TJ", self.escapeText(&seg)));
        }
        out
    }
    /// Delegates to the shared text engine rather than wrapping again here.
    /// This function used to hold its own copy of the algorithm; layout held a
    /// different one, so the line count reserved by layout could differ from the
    /// lines actually drawn. Both now come from the same call.
    pub fn wrapText(&self, text: &str, max_width: f64, font_size: f64, font_family: &str) -> Vec<String> {
        let mut engine: Rc<RefCell<EVGTextEngine>> = EVGLayout::getTextEngine(&self.layout.as_ref().unwrap());
        return EVGTextEngine::breakToStrings(
            &engine,
            text,
            font_family,
            font_size,
            max_width
        ).clone();
    }
    fn renderDivider(&self, el: &Rc<RefCell<EVGElement>>, x: f64, y: f64, w: f64, h: f64) {
        // Render a horizontal line
        let mut color: Option<Rc<RefCell<EVGColor>>> = el.borrow().color.clone().clone();
        if !color.as_ref().unwrap().borrow().isSet {
            color = Some(EVGColor::rgb(200, 200, 200));
        }
        let line_y: f64 = y + h / 2.0;
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
        let r: f64 = color.as_ref().unwrap().borrow().r / 255.0;
        let g: f64 = color.as_ref().unwrap().borrow().g / 255.0;
        let b: f64 = color.as_ref().unwrap().borrow().b / 255.0;
        let mut _tmp_2862 = self.strokeOp(r, g, b);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &_tmp_2862);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "1 w\n");
        let arg_0 = format!("{} {} m\n", self.formatNum(x), self.formatNum(line_y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        let arg_0 = format!("{} {} l\n", self.formatNum(x + w), self.formatNum(line_y)).clone();
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "S\n");
        GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
    }
    fn getTextContent(&self, el: &Rc<RefCell<EVGElement>>) -> String {
        // If element has textContent property, use it
        if !el.borrow().textContent.is_empty() {
            return el.borrow().textContent.clone();
        }
        // Otherwise, collect text from all child text nodes
        let mut result: String = String::new();
        let mut i: i64 = 0;
        let child_count: i64 = EVGElement::getChildCount(&el);
        while i < child_count {
            let mut child: Rc<RefCell<EVGElement>> = EVGElement::getChild(&el, i);
            if child.borrow().tagName == "text" {
                let child_text: String = child.borrow().textContent.clone();
                if !child_text.is_empty() {
                    // Add space between text nodes if needed
                    if !result.is_empty() {
                        let last_char: i64 = PdfText::char_at(&result, (PdfText::str_len(&result) as i64) - 1);
                        let first_char: i64 = PdfText::char_at(&child_text, 0);
                        // Add space if neither ends/starts with whitespace
                        if last_char != 32 && first_char != 32 {
                            result.push_str(" ");
                        }
                    }
                    result.push_str(&child_text);
                }
            }
            i += 1;
        }
        result
    }
    pub fn estimateTextWidth(&self, text: &str, font_size: f64) -> f64 {
        // Use the same text measurer as layout for consistent results
        return self.measurer.clone().unwrap().borrow_mut().measureTextWidth(
            text.to_string(),
            "Helvetica".to_string(),
            font_size
        );
    }
    pub fn toOctalEscape(&self, ch: i64) -> String {
        // Convert a byte value (0-255) to PDF octal escape format \NNN
        // e.g., 196 (Ä) becomes \304
        let d0: i64 = ch % 8;
        let t1: i64 = (ch as f64 / 8.0).floor() as i64;
        let d1: i64 = t1 % 8;
        let d2: i64 = (t1 as f64 / 8.0).floor() as i64;
        format!("\\{}{}{}", d2, d1, d0)
    }
    /// Codepoints this PDF cannot represent under WinAnsi, collected so the run
    /// can report them instead of quietly painting "?" where a character was
    /// measured. §4.1 rule 8: no silent missing-letter width collapse — layout
    /// reserved space for the real glyph, so a substituted "?" is both a wrong
    /// glyph AND a wrong width.
    /// The /ToUnicode cmap, so a reader can copy text back out of the page.
    ///
    /// The two identity ranges cover where WinAnsi and Unicode agree. The
    /// bfchar block is the 0x80-0x9F band, where they do not: without it an em
    /// dash or a curly quote extracted from the PDF came out as a control
    /// character, or as nothing at all.
    pub fn toUnicodeCMap(&self) -> String {
        let mut cmap: String = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n".to_string();
        cmap.push_str("2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n");
        cmap.push_str("27 beginbfchar\n<80> <20AC>\n<82> <201A>\n<83> <0192>\n<84> <201E>\n<85> <2026>\n<86> <2020>\n<87> <2021>\n<88> <02C6>\n<89> <2030>\n<8A> <0160>\n<8B> <2039>\n<8C> <0152>\n<8E> <017D>\n<91> <2018>\n<92> <2019>\n<93> <201C>\n<94> <201D>\n<95> <2022>\n<96> <2013>\n<97> <2014>\n<98> <02DC>\n<99> <2122>\n<9A> <0161>\n<9B> <203A>\n<9C> <0153>\n<9E> <017E>\n<9F> <0178>\nendbfchar\n");
        cmap.push_str("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend");
        cmap
    }
    pub fn noteUnsupportedGlyph(&mut self, ch: i64, context: &str) {
        let mut i: i64 = 0;
        while i < (self.unsupportedGlyphs.len() as i64) {
            if self.unsupportedGlyphs[i as usize] == ch {
                return;
            }
            i += 1;
        }
        self.unsupportedGlyphs.push(ch);
        self.unsupportedContexts.push(context.to_string());
    }
    pub fn unsupportedGlyphCount(&self) -> i64 {
        self.unsupportedGlyphs.len() as i64
    }
    pub fn unsupportedGlyphReport(&self, i: i64) -> String {
        let ch: i64 = self.unsupportedGlyphs[i as usize];
        format!("U+{} in \"{}\"", self.toHex4(ch), self.unsupportedContexts[i as usize].clone())
    }
    pub fn toHex4(&self, v: i64) -> String {
        let digits: String = "0123456789ABCDEF";
        let mut nibbles: Vec<i64> = Vec::new();
        let mut n: i64 = v;
        let mut i: i64 = 0;
        while i < 4 {
            nibbles.push(n % 16);
            n = (n as f64 / 16.0).floor() as i64;
            i += 1;
        }
        let mut out: String = String::new();
        let mut j: i64 = 3;
        while j >= 0 {
            let d: i64 = nibbles[j as usize];
            out.push_str(&PdfText::substr(&digits, d, d + 1));
            j -= 1;
        }
        out
    }
    /// Translate the page content up and right into the trim area of an
    /// oversized sheet. A no-op when no bleed was asked for, so ordinary output
    /// is byte-identical.
    /// ----------------------------------------------------------------------
    /// Links
    /// ----------------------------------------------------------------------
    ///
    /// A PDF carries its link targets beside the content stream, not in it:
    /// `/Annots` on the page dictionary, each entry a rectangle in page space
    /// and a destination. So the ink is written first and the rectangles are
    /// remembered as they go past.
    pub fn clearLinks(&mut self) {
        self.linkPage.clear();
        self.linkUrl.clear();
        self.linkX.clear();
        self.linkY.clear();
        self.linkW.clear();
        self.linkH.clear();
        self.curLinkPage = 0;
    }
    pub fn noteLink(&mut self, url: &str, x: f64, y: f64, w: f64, h: f64) {
        if url.is_empty() {
            return;
        }
        // A rectangle with no area is one no reader will ever hit.
        if w <= 0.0 {
            return;
        }
        if h <= 0.0 {
            return;
        }
        // The bleed shift is a `cm` on the content stream and annotations are
        // not content, so what the translate does to the ink has to be done to
        // the rectangle by hand.
        let mut dx: f64 = 0.0;
        if self.bleed > 0.0 {
            dx = self.bleed;
        }
        self.linkPage.push(self.curLinkPage);
        self.linkUrl.push(url.to_string());
        self.linkX.push(x + dx);
        self.linkY.push(y + dx);
        self.linkW.push(w);
        self.linkH.push(h);
    }
    /// One page's `/Annots`, written straight into the page dictionary.
    ///
    /// The annotation dictionaries are DIRECT objects rather than indirect
    /// ones. That is legal, and it means adding links changes no object number
    /// and therefore nothing in the xref table — a file with no links is
    /// byte-for-byte the file it was before any of this existed.
    pub fn annotsFor(&self, page: i64) -> String {
        let n: i64 = self.linkPage.len() as i64;
        let mut any: bool = false;
        let mut out: String = " /Annots [".to_string();
        let mut i: i64 = 0;
        while i < n {
            if self.linkPage[i as usize] == page {
                any = true;
                let x: f64 = self.linkX[i as usize];
                let y: f64 = self.linkY[i as usize];
                let w: f64 = self.linkW[i as usize];
                let h: f64 = self.linkH[i as usize];
                let x2: f64 = x + w;
                let y2: f64 = y + h;
                out.push_str(" << /Type /Annot /Subtype /Link");
                {
                    out.push_str(&format!(" /Rect [{} {} {} {}]", self.formatNum(x), self.formatNum(y), self.formatNum(x2), self.formatNum(y2)));
                }
                // No border of the reader's own. The layout already coloured
                // the link the way the document wanted it, and a viewer that
                // draws a black box around every link on top of that is the
                // reason `/Border [0 0 0]` is on essentially every link in
                // every PDF ever produced.
                out.push_str(" /Border [0 0 0]");
                {
                    out.push_str(&format!(" /A << /S /URI /URI ({}) >> >>", self.escapeUri(&self.linkUrl[i as usize].clone())));
                }
            }
            i += 1;
        }
        if false == any {
            return String::new();
        }
        format!("{} ]", out)
    }
    /// A URI inside a PDF literal string. Only three characters have to go:
    /// the two parentheses and the backslash. Everything above ASCII is left
    /// alone, because a URI that reaches here with raw non-ASCII in it is
    /// already not a URI — percent-encoding is the author's job and re-encoding
    /// it here would double it.
    pub fn escapeUri(&self, url: &str) -> String {
        let mut out: String = String::new();
        let n: i64 = PdfText::str_len(&url) as i64;
        let mut i: i64 = 0;
        while i < n {
            let ch: i64 = PdfText::char_at(&url, i);
            if ch == 40 {
                out.push_str("\\(");
            } else {
                if ch == 41 {
                    out.push_str("\\)");
                } else {
                    if ch == 92 {
                        out.push_str("\\\\");
                    } else {
                        if ch >= 32 {
                            out.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
                        }
                    }
                }
            }
            i += 1;
        }
        out
    }
    pub fn beginBleedShift(&self) {
        if self.bleed > 0.0 {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "q\n");
            let mut _tmp_2888 = self.bleed.clone();
            let arg_0 = format!("1 0 0 1 {} {} cm\n", self.formatNum(_tmp_2888), self.formatNum(self.bleed.clone())).clone();
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), &arg_0);
        }
    }
    pub fn endBleedShift(&self) {
        if self.bleed > 0.0 {
            GrowableBuffer::writeString(&self.streamBuffer.as_ref().unwrap().clone(), "Q\n");
        }
    }
    pub fn setBleed(&mut self, b: f64) {
        self.bleed = b;
    }
    /// Page boxes for a trim size of trimW x trimH.
    ///
    /// With no bleed this is the single MediaBox it always was. With bleed the
    /// sheet is the trim size plus `bleed` on each side, and TrimBox marks where
    /// the finished page is cut — full-bleed artwork runs past the trim into the
    /// bleed area and the cut lands inside the ink rather than at its edge.
    /// BleedBox equals MediaBox here: everything outside trim IS the bleed.
    pub fn pageBoxes(&self, trim_w: f64, trim_h: f64) -> String {
        if self.bleed <= 0.0 {
            return format!(" /MediaBox [0 0 {} {}]", self.formatNum(trim_w), self.formatNum(trim_h));
        }
        let sheet_w: f64 = trim_w + self.bleed * 2.0;
        let sheet_h: f64 = trim_h + self.bleed * 2.0;
        let mut out: String = format!(" /MediaBox [0 0 {} {}]", self.formatNum(sheet_w), self.formatNum(sheet_h));
        {
            out.push_str(&format!(" /BleedBox [0 0 {} {}]", self.formatNum(sheet_w), self.formatNum(sheet_h)));
        }
        let trim_x2: f64 = self.bleed + trim_w;
        let trim_y2: f64 = self.bleed + trim_h;
        {
            out.push_str(&format!(" /TrimBox [{} {} {} {}]", self.formatNum(self.bleed), self.formatNum(self.bleed), self.formatNum(trim_x2), self.formatNum(trim_y2)));
        }
        out
    }
    pub fn escapeText(&mut self, text: &str) -> String {
        // Escape parentheses and backslashes for PDF
        // Also handle Unicode characters outside WinAnsi range
        // For high-byte characters (128-255), use PDF octal escape \NNN
        // because Go strings are UTF-8 and can't represent raw bytes 128-255 directly
        // By codepoint: a surrogate half is not a character, and reporting one
        // as "U+D83D is outside WinAnsi" tells the author nothing they can act
        // on. An emoji is now reported once, at its real codepoint.
        let mut result: String = String::new();
        let __len: i64 = PdfText::str_len(&text) as i64;
        let mut i: i64 = 0;
        while i < __len {
            let ch: i64 = EVGCodepoint::codeAt(text, i);
            let cp_step: i64 = EVGCodepoint::unitsAt(text, i);
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
                        if ch < 32 {
                            // Control characters - skip or use octal
                            result.push_str(" ");
                        } else {
                            if ch < 128 {
                                // ASCII range - safe to use directly
                                result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
                            } else {
                                // Everything else goes through the WinAnsi
                                // table. This used to be a bare `ch <= 255`,
                                // which is Latin-1, not WinAnsi: it wrote the
                                // 0x80-0x9F band straight through (where
                                // Latin-1 has control codes and CP1252 has the
                                // dashes and curly quotes) and rejected the
                                // real codepoints for those same characters.
                                let enc: i64 = Utf8::toWinAnsi(Utf8::winAnsiStandIn(ch));
                                if enc >= 0 {
                                    // Emitted as a PDF octal escape \NNN
                                    // because Go strings are UTF-8 and cannot
                                    // hold a raw byte above 127.
                                    {
                                        result.push_str(&format!("{}", self.toOctalEscape(enc)));
                                    }
                                } else {
                                    // Genuinely outside WinAnsi. The
                                    // placeholder stays (a PDF must still be
                                    // produced) but the run reports it rather
                                    // than hiding it.
                                    self.noteUnsupportedGlyph(ch, text);
                                    result.push_str("?");
                                }
                            }
                        }
                    }
                }
            }
            i += cp_step;
        }
        result
    }
    /// -------------------------------------------------------------------------
    /// Colour
    /// -------------------------------------------------------------------------
    pub fn setColorMode(&mut self, mode: String) {
        self.colorMode = mode.clone();
    }
    pub fn setPdfxProfile(&mut self, profile: String) {
        self.pdfxProfile = profile.clone();
    }
    pub fn setOutputIntent(&mut self, identifier: String, info: String) {
        self.outputIntent = identifier.clone();
        self.outputIntentInfo = info.clone();
    }
    pub fn setDocumentInfo(&mut self, title: String, author: String) {
        self.docTitle = title.clone();
        self.docAuthor = author.clone();
    }
    pub fn isCmyk(&self) -> bool {
        self.colorMode == "cmyk"
    }
    /// The name of the graphics state for this pair of alphas, registering it
    /// if it is new. "" when both are opaque, which is the overwhelming majority
    /// of a document and must cost nothing.
    /// The `/ExtGState` entry of a page's resources, or "" when the page used no
    /// translucency at all. Written inline rather than as its own object: a
    /// state dictionary is two numbers, and an indirect object per alpha would
    /// cost more bytes than it saves.
    pub fn extGStateDict(&self) -> String {
        let n: i64 = self.alphaFills.len() as i64;
        if n == 0 {
            return String::new();
        }
        let mut out: String = " /ExtGState <<".to_string();
        let mut i: i64 = 0;
        while i < n {
            let fa: f64 = self.alphaFills[i as usize];
            let sa: f64 = self.alphaStrokes[i as usize];
            out.push_str(&format!(" /GS{} << /Type /ExtGState", i + 1));
            {
                out.push_str(&format!(" /ca {}", self.formatNum(fa)));
            }
            {
                out.push_str(&format!(" /CA {}", self.formatNum(sa)));
            }
            out.push_str(" >>");
            i += 1;
        }
        format!("{} >>", out)
    }
    pub fn alphaState(&mut self, fill_alpha: f64, stroke_alpha: f64) -> String {
        let fa: f64 = EVGPDFRenderer::clampAlpha(fill_alpha);
        let sa: f64 = EVGPDFRenderer::clampAlpha(stroke_alpha);
        if fa >= 0.999 {
            if sa >= 0.999 {
                return String::new();
            }
        }
        let mut i: i64 = 0;
        while i < (self.alphaFills.len() as i64) {
            let have_f: f64 = self.alphaFills[i as usize];
            let have_s: f64 = self.alphaStrokes[i as usize];
            if EVGPDFRenderer::sameAlpha(have_f, fa) {
                if EVGPDFRenderer::sameAlpha(have_s, sa) {
                    return format!("/GS{} gs\n", i + 1);
                }
            }
            i += 1;
        }
        self.alphaFills.push(fa);
        self.alphaStrokes.push(sa);
        format!("/GS{} gs\n", self.alphaFills.len() as i64)
    }
    pub fn fillOp(&self, r: f64, g: f64, b: f64) -> String {
        if self.colorMode == "cmyk" {
            let mut v: Vec<f64> = EVGPDFRenderer::toCmyk(r, g, b);
            let c: String = self.formatNum(v[0]);
            let m: String = self.formatNum(v[1]);
            let y: String = self.formatNum(v[2]);
            let k: String = self.formatNum(v[3]);
            return format!("{} {} {} {} k\n", c, m, y, k);
        }
        format!("{} {} {} rg\n", self.formatNum(r), self.formatNum(g), self.formatNum(b))
    }
    pub fn strokeOp(&self, r: f64, g: f64, b: f64) -> String {
        if self.colorMode == "cmyk" {
            let mut v: Vec<f64> = EVGPDFRenderer::toCmyk(r, g, b);
            let c: String = self.formatNum(v[0]);
            let m: String = self.formatNum(v[1]);
            let y: String = self.formatNum(v[2]);
            let k: String = self.formatNum(v[3]);
            return format!("{} {} {} {} K\n", c, m, y, k);
        }
        format!("{} {} {} RG\n", self.formatNum(r), self.formatNum(g), self.formatNum(b))
    }
    /// -------------------------------------------------------------------------
    /// The finishing objects a print file needs
    /// -------------------------------------------------------------------------
    /// PDF/X-4 is a PDF 1.6 feature set. Claiming it in a 1.5 header is the sort
    /// of contradiction a preflight tool opens with.
    pub fn headerLine(&self) -> String {
        if !self.pdfxProfile.is_empty() {
            return "%PDF-1.6\n".to_string();
        }
        "%PDF-1.5\n".to_string()
    }
    pub fn wantsFinishing(&self) -> bool {
        !self.pdfxProfile.is_empty()
    }
    /// The XMP packet. PDF/X is identified HERE and nowhere else - a reader that
    /// wants to know whether this file claims to be a print file looks for
    /// pdfxid:GTS_PDFXVersion, not for a dictionary key.
    pub fn xmpPacket(&self) -> String {
        let title: String = EVGPDFRenderer::xmlEscape(&self.docTitle.clone());
        let author: String = EVGPDFRenderer::xmlEscape(&self.docAuthor.clone());
        let prod: String = EVGPDFRenderer::xmlEscape(&self.producer.clone());
        let mut out: String = "<?xpacket begin=\"\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>\n".to_string();
        out.push_str("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">\n");
        out.push_str(" <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n");
        out.push_str("  <rdf:Description rdf:about=\"\" xmlns:pdfxid=\"http://www.npes.org/pdfx/ns/id/\">\n");
        out.push_str(&format!("   <pdfxid:GTS_PDFXVersion>PDF/{}</pdfxid:GTS_PDFXVersion>\n", self.pdfxProfile));
        out.push_str("  </rdf:Description>\n");
        out.push_str("  <rdf:Description rdf:about=\"\" xmlns:pdf=\"http://ns.adobe.com/pdf/1.3/\">\n");
        out.push_str(&format!("   <pdf:Producer>{}</pdf:Producer>\n", prod));
        out.push_str("   <pdf:Trapped>False</pdf:Trapped>\n");
        out.push_str("  </rdf:Description>\n");
        out.push_str("  <rdf:Description rdf:about=\"\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\">\n");
        out.push_str(&format!("   <xmp:CreatorTool>{}</xmp:CreatorTool>\n", prod));
        out.push_str("  </rdf:Description>\n");
        out.push_str("  <rdf:Description rdf:about=\"\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n");
        out.push_str("   <dc:format>application/pdf</dc:format>\n");
        if !title.is_empty() {
            out.push_str(&format!("   <dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">{}</rdf:li></rdf:Alt></dc:title>\n", title));
        }
        if !author.is_empty() {
            out.push_str(&format!("   <dc:creator><rdf:Seq><rdf:li>{}</rdf:li></rdf:Seq></dc:creator>\n", author));
        }
        out.push_str("  </rdf:Description>\n");
        out.push_str(" </rdf:RDF>\n");
        out.push_str("</x:xmpmeta>\n");
        out.push_str("<?xpacket end=\"w\"?>\n");
        out
    }
    /// What the finishing did, and what it could not do. Printed rather than
    /// returned because the one thing that must not happen is a file that claims
    /// conformance it does not have and says nothing about it.
    ///
    /// The gap is images. Text and vectors are converted to process ink here;
    /// a JPEG is not, and an untagged DeviceRGB image inside a file whose output
    /// intent is a CMYK printing condition is a PDF/X conformance failure - not a
    /// cosmetic one. There are two honest ways out and this reports both.
    pub fn finishingReport(&self) -> String {
        if !self.wantsFinishing() {
            return String::new();
        }
        let mut out: String = String::new();
        out.push_str(&format!("  PDF/{}: output intent {}, colours {}, Trapped False\n", self.pdfxProfile, self.outputIntent, self.colorMode));
        if self.isCmyk() {
            if self.rgbImages > 0 {
                out.push_str(&format!("  WARNING: {} image(s) are embedded as untagged DeviceRGB while the\n", self.rgbImages));
                out.push_str("  output intent is a CMYK condition. Text and vectors are separated; the\n");
                out.push_str(&format!("  pictures are not, and PDF/{} does not allow that combination.\n", self.pdfxProfile));
                out.push_str("  Either supply the pictures already in CMYK, or keep the whole job in RGB\n");
                out.push_str("  with an RGB output intent - which several print-on-demand services\n");
                out.push_str("  prefer - rather than shipping a file that only claims to be separated.\n");
            }
        }
        out
    }
    pub fn conformanceIssues(&self) -> i64 {
        if !self.wantsFinishing() {
            return 0;
        }
        if self.isCmyk() {
            return self.rgbImages;
        }
        0
    }
    /// The output intent: which printing condition these numbers are for. A
    /// registered characterization name stands in for an embedded ICC profile,
    /// which is what keeps this file honest without shipping a megabyte of
    /// someone else's profile inside it.
    pub fn outputIntentBody(&self) -> String {
        let mut out: String = "<< /Type /OutputIntent /S /GTS_PDFX".to_string();
        {
            out.push_str(&format!(" /OutputConditionIdentifier {}", EVGPDFRenderer::pdfTextString(&self.outputIntent)));
        }
        {
            out.push_str(&format!(" /OutputCondition {}", EVGPDFRenderer::pdfTextString(&self.outputIntentInfo)));
        }
        {
            out.push_str(&format!(" /Info {}", EVGPDFRenderer::pdfTextString(&self.outputIntentInfo)));
        }
        out.push_str(" /RegistryName (http://www.color.org) >>\n");
        out
    }
    /// /Trapped is not optional in PDF/X: a file that does not say whether it has
    /// been trapped cannot be one.
    pub fn infoBody(&self) -> String {
        let mut out: String = format!("<< /Producer {}", EVGPDFRenderer::pdfTextString(&self.producer.clone()));
        if !self.docTitle.is_empty() {
            {
                out.push_str(&format!(" /Title {}", EVGPDFRenderer::pdfTextString(&self.docTitle)));
            }
        }
        if !self.docAuthor.is_empty() {
            {
                out.push_str(&format!(" /Author {}", EVGPDFRenderer::pdfTextString(&self.docAuthor)));
            }
        }
        out.push_str(" /Trapped /False >>\n");
        out
    }
    pub fn catalogBody(&self, pages_num: i64, metadata_num: i64, intent_num: i64) -> String {
        let mut out: String = format!("<< /Type /Catalog /Pages {} 0 R", pages_num);
        if self.wantsFinishing() {
            out.push_str(&format!(" /Metadata {} 0 R", metadata_num));
            out.push_str(&format!(" /OutputIntents [{} 0 R]", intent_num));
        }
        out.push_str(" >>\n");
        out
    }
    pub fn trailerBody(&self, size: i64, catalog_num: i64, info_num: i64) -> String {
        let mut out: String = format!("<< /Size {} /Root {} 0 R", size, catalog_num);
        if self.wantsFinishing() {
            out.push_str(&format!(" /Info {} 0 R", info_num));
        }
        out.push_str(" >>\n");
        out
    }
    pub fn formatNum(&self, n: f64) -> String {
        // PDF real numbers may NOT use exponential notation — the syntax has no
        // such form, and a viewer is within its rights to reject the whole
        // stream. `to_string` reaches for it on very small magnitudes, which is
        // exactly what a rotation produces: cos 90 degrees comes out as
        // 6.123233995736766e-17 rather than a plain zero.
        //
        // Anything this small is zero at any page size, so it is written as
        // zero rather than as something no parser has to accept.
        let mut mag: f64 = n;
        if mag < 0.0 {
            mag = 0.0 - mag;
        }
        if mag < 0.000001 {
            return "0".to_string();
        }
        let result: String = n.to_string();
        result
    }
    pub fn padLeft(&self, s: &str, __len: i64, pad_char: &str) -> String {
        let mut result: String = s.to_string();
        while (PdfText::str_len(&result) as i64) < __len {
            result = format!("{}{}", pad_char, result);
        }
        result
    }
    pub fn sanitizeFontName(&self, name: &str) -> String {
        // A PDF name: no spaces, no delimiters, no `#`. A HYPHEN is none of
        // those and it is the character that separates a face from its family
        // in every PostScript name ever written — `OpenSans-Bold`. Stripping
        // it was what made `Open Sans` and `Open Sans-Bold` collide.
        let mut result: String = String::new();
        let __len: i64 = PdfText::str_len(&name) as i64;
        let mut i: i64 = 0;
        while i < __len {
            let ch: i64 = PdfText::char_at(&name, i);
            let alnum: bool = ((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) || (ch >= 48 && ch <= 57);
            let joiner: bool = ch == 45 || ch == 43;
            if alnum || joiner {
                result.push_str(&char::from_u32(ch as u32).unwrap_or('\0').to_string());
            }
            i += 1;
        }
        result
    }
    /// The PostScript name a font object is published under.
    ///
    /// It has to be DISTINCT PER FACE, and it was not. The name came from
    /// `ttfFont.fontFamily` — the family the FILE declares, which is `Open
    /// Sans` for the regular, the bold, the italic and the bold-italic alike —
    /// so all four were published as `/OpenSans`. Each carried its own
    /// `/FontFile2`, so the file was correct by the letter of the specification
    /// and wrong in every reader that caches an embedded program by its
    /// `/BaseFont`: such a reader loads the first one and answers every later
    /// request for `/OpenSans` with it. Whichever face was drawn first won the
    /// document, and a page whose first word was bold came out bold throughout.
    ///
    /// The face the layout asked for is the name that separates them, and the
    /// renderer already has it — it is the key it looked the file up with.
    pub fn faceFontName(&self, face_name: &str, fallback: &str) -> String {
        let mut name: String = face_name.to_string();
        if name.is_empty() {
            name = fallback.to_string();
        }
        let out: String = self.sanitizeFontName(&name);
        if out.is_empty() {
            return "Font".to_string();
        }
        out
    }
}
