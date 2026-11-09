//! pdf_writer as one crate: EVG laid out and written as PDF, TrueType fonts
//! measured and subset, JPEG images embedded. The .rgr code (tools, the HTML
//! and raster renderers, JSX) imports this file and uses its types by name.
//!
//! Stays .rgr: PdfFlate.rgr (a process-wide Deflate, a singleton, which
//! Ranger's Rust syntax has no spelling for) and PdfText.rgr (strlen, charAt
//! and substring in the target's own units).

mod evg_font_setup;
mod evg_pdf_renderer;
mod evg_resource_loader;
mod evg_style_loader;
mod font_manager;
mod image_utils;
mod jpeg_metadata;
mod jpeg_reader;
mod pdf_writer;
mod rgr;
mod true_type_font;
mod ttf_subset;
mod utf8;
