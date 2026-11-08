//! The .rgr classes the crate's modules use, imported once.

#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../../../lib/evg/EVGBox");
    ranger::import_rgr!("../../../lib/evg/EVGCodepoint");
    ranger::import_rgr!("../../../lib/evg/EVGColor");
    ranger::import_rgr!("../../../lib/evg/EVGDisplayList");
    ranger::import_rgr!("../../../lib/evg/EVGElement");
    ranger::import_rgr!("../../../lib/evg/EVGGrapheme");
    ranger::import_rgr!("../../../lib/evg/EVGImageMeasurer");
    ranger::import_rgr!("../../../lib/evg/EVGLayout");
    ranger::import_rgr!("../../../lib/evg/EVGTextEngine");
    ranger::import_rgr!("../../../lib/evg/EVGTextMeasurer");
    ranger::import_rgr!("../../../lib/evg/EVGUnit");
    ranger::import_rgr!("../../../lib/evg/SVGPathParser");
    ranger::import_rgr!("../../../lib/evg/SvgParser");
    ranger::import_rgr!("../../../lib/evg/VectorStroke");
    ranger::import_rgr!("../../../lib/evg/VectorViewBox");
    ranger::import_rgr!("../../../lib/image/Buffer");
    ranger::import_rgr!("../../../lib/image/ImageBuffer");
    ranger::import_rgr!("../../../lib/image/JPEGDecoder");
    ranger::import_rgr!("../../../lib/evg/EVGStyleSheet");
    ranger::import_rgr!("PdfText");
    ranger::import_rgr!("core/PDFImageMeasurer");
    ranger::import_rgr!("core/PdfFlate");
    ranger::import_rgr!("jpeg/JPEGEncoder");
}
pub use rgr::{EVGBox, EVGCodepoint, EVGColor, EVGDisplayList, EVGElement, EVGGrapheme, EVGImageDimensions, EVGLayout, EVGStyleSheet, EVGTextEngine, EVGTextMeasurer, EVGUnit, GrowableBuffer, ImageBuffer, JPEGDecoder, JPEGEncoder, Matrix2D, PDFImageMeasurer, PdfOpt, PathBounds, PathCommand, PdfFlate, PdfText, SVGPathParser, SimpleTextMeasurer, SvgDocument, SvgParser, SvgVectorItem, VectorStroke, VectorViewBox, ViewBoxRect};
