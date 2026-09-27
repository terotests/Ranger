// Traits, trait objects and generics.
//
// `Shape` is a trait with a default method; `Vec<Box<dyn Shape>>` holds
// different structs behind one interface, and `largest` is a generic
// function bounded by a trait.

use std::fmt;

trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> String;

    fn describe(&self) -> String {
        format!("{} with area {:.2}", self.name(), self.area())
    }
}

struct Circle {
    radius: f64,
}

struct Rect {
    w: f64,
    h: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        3.14159 * self.radius * self.radius
    }
    fn name(&self) -> String {
        "circle".to_string()
    }
}

impl Shape for Rect {
    fn area(&self) -> f64 {
        self.w * self.h
    }
    fn name(&self) -> String {
        if self.w == self.h {
            "square".to_string()
        } else {
            "rectangle".to_string()
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Point {
    x: i64,
    y: i64,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut best = items[0];
    for &item in items.iter() {
        if item > best {
            best = item;
        }
    }
    best
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 1.5 }),
        Box::new(Rect { w: 2.0, h: 3.0 }),
        Box::new(Rect { w: 4.0, h: 4.0 }),
    ];
    for s in shapes.iter() {
        println!("{}", s.describe());
    }
    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("total area {:.3}", total);

    println!("largest int {}", largest(&[3, 9, 2, 7]));
    println!("largest float {}", largest(&[1.5, 0.25, 2.75]));
    let p = largest(&[Point { x: 1, y: 5 }, Point { x: 2, y: 0 }, Point { x: 2, y: -1 }]);
    println!("largest point {} {:?}", p, p);
}
