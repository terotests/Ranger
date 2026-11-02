//! RangerMath: TeX math read, laid out and drawn, as one crate. The .rgr
//! code imports this file and uses its types by name.
//!
//! The font layer stays .rgr: MathFontData.rgr is generated
//! (tools/gen_math_font.py) and MathFont.rgr is a process-wide glyph cache
//! (a singleton, which Ranger's Rust syntax has no spelling for);
//! MathText.rgr gives the parser strlen/charAt/substring in native units.

mod math_layout;
mod math_omml;
mod math_parser;
mod math_render;
mod rgr;
