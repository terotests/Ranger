pub mod round;

pub trait Area {
    fn area(&self) -> f64;
}

#[derive(Clone, Debug)]
pub enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
}

impl Shape {
    pub fn name(&self) -> String {
        match self {
            Shape::Circle(_) => String::from("circle"),
            Shape::Rect { .. } => String::from("rect"),
        }
    }
}

impl Area for Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.0 * r * r,
            Shape::Rect { w, h } => w * h,
        }
    }
}

pub fn unit_square() -> Shape {
    Shape::Rect { w: 1.0, h: 1.0 }
}

pub fn total_area(list: &Vec<Shape>) -> f64 {
    let mut t = 0.0;
    for s in list {
        t += s.area();
    }
    t
}

pub fn describe(s: &Shape) -> String {
    format!("{} of area {}", s.name(), self::round::nearest(s.area()))
}
