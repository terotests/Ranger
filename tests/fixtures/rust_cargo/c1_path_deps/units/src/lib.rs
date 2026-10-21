//! Lengths for the shapes crate.
pub mod convert;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Meters {
    pub v: f64,
}

impl Meters {
    pub fn new(v: f64) -> Meters {
        Meters { v }
    }

    pub fn add(&self, o: &Meters) -> Meters {
        Meters { v: self.v + o.v }
    }
}

pub fn label(m: &Meters) -> String {
    format!("{:.1} {}", m.v, crate::convert::suffix())
}
