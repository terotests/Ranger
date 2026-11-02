//! The .rgr classes the crate's modules use, imported once.

#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../../../lib/evg/EVGColor");
    ranger::import_rgr!("../../../lib/evg/EVGElement");
    ranger::import_rgr!("../../../lib/evg/EVGUnit");
    ranger::import_rgr!("MathFont");
    ranger::import_rgr!("MathText");
}
pub use rgr::{EVGColor, EVGElement, EVGUnit, MathFont, MathSym, MathText};
