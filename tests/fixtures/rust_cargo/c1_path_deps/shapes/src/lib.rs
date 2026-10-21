//! Rectangles measured in `units::Meters`.
use ranger::prelude::*;

pub mod area;

pub use area::total;
pub use units::convert::to_cm;

pub struct Rect {
    pub w: units::Meters,
    pub h: units::Meters,
}

impl Rect {
    pub fn new(w: double, h: double) -> Rect {
        Rect { w: units::Meters::new(w), h: units::Meters::new(h) }
    }

    pub fn area(&self) -> double {
        self.w.v * self.h.v
    }

    pub fn perimeter(&self) -> units::Meters {
        let s = self.w.add(&self.h);
        s.add(&s)
    }
}

pub fn describe(r: &Rect) -> String {
    format!("{} x {}", units::label(&r.w), units::label(&r.h))
}

#[cfg(test)]
mod tests {
    #[test]
    fn area_of_a_square() {
        assert_eq!(super::Rect::new(2.0, 2.0).area(), 4.0);
    }
}
