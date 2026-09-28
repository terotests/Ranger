// A crate in several files (R6): `mod` declarations, `use` of functions,
// types and consts from other modules, `crate::` / `super::` / `self::`
// paths, an inline module, and two modules with a function of the same name.
mod geometry;
mod shapes;
mod util {
    pub const SCALE: i64 = 10;

    pub fn helper(x: i64) -> i64 {
        x * SCALE
    }

    pub fn label(n: i64) -> String {
        format!("#{}", super::geometry::helper(n))
    }
}

use geometry::{midpoint, Point};
use shapes::{Area, Shape};

fn helper(x: i64) -> i64 {
    x + 1
}

fn main() {
    let a = Point::new(1, 2);
    let b = geometry::Point::new(5, 8);
    println!("dist2 {}", a.dist2(&b));
    let (mx, my) = midpoint(&a, &b);
    println!("mid {} {}", mx, my);
    println!("helpers {} {} {}", helper(3), util::helper(3), geometry::helper(3));
    println!("scale {} origin {:?}", util::SCALE, geometry::ORIGIN);
    println!("label {}", util::label(4));
    let list = vec![
        Shape::Circle(1.5),
        Shape::Rect { w: 2.0, h: 3.0 },
        shapes::unit_square(),
    ];
    for s in &list {
        println!("{} {:.2}", s.name(), s.area());
    }
    println!("total {:.3}", shapes::total_area(&list));
    println!("round {}", shapes::round::nearest(2.5));
    println!("{}", crate::shapes::describe(&list[0]));
}
