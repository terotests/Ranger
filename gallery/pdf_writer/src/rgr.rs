//! The .rgr classes the crate's modules use, imported once.

#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../../../lib/evg/EVGElement");
    ranger::import_rgr!("../../../lib/evg/EVGStyleSheet");
    ranger::import_rgr!("../../../lib/evg/EVGCodepoint");
    ranger::import_rgr!("../../../lib/evg/EVGCodepoint");
    ranger::import_rgr!("../../../lib/evg/EVGCodepoint");
    ranger::import_rgr!("../../../lib/evg/EVGElement");
    ranger::import_rgr!("../../../lib/evg/EVGGrapheme");
    ranger::import_rgr!("../../../lib/evg/EVGGrapheme");
    ranger::import_rgr!("../../../lib/evg/EVGTextMeasurer");
    ranger::import_rgr!("../../../lib/image/Buffer");
    ranger::import_rgr!("../../../lib/image/Buffer");
    ranger::import_rgr!("../../../lib/image/Buffer");
    ranger::import_rgr!("../../../lib/image/ImageBuffer");
    ranger::import_rgr!("../../../lib/image/JPEGDecoder");
    ranger::import_rgr!("PdfText");
}
pub use rgr::{EVGCodepoint, EVGElement, EVGGrapheme, EVGStyleSheet, EVGTextMeasurer, GrowableBuffer, ImageBuffer, JPEGDecoder, PdfText};
