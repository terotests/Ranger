//! The .rgr classes the crate's modules use, imported once. cargo builds
//! MathRgr.rgr as one module (build.rs) and takes EVG's types from the
//! rangerevg crate; Ranger reads the EVG files below.

#[allow(dead_code, unused, non_snake_case, clippy::all)]
mod rgr {
    ranger::import_rgr!("MathRgr");
    #[cfg(any())]
    ranger::import_rgr!("../../../lib/evg/EVGColor");
    #[cfg(any())]
    ranger::import_rgr!("../../../lib/evg/EVGElement");
    #[cfg(any())]
    ranger::import_rgr!("../../../lib/evg/EVGUnit");
}
#[cfg(not(ranger))]
pub use rangerevg::{EVGColor, EVGElement, EVGUnit};
pub use rgr::{MathFont, MathGlyph, MathPathBuf, MathSym, MathText};
