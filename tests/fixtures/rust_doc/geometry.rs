//! Points and distances on a grid.
//!
//! The functions here are the public API of the module.

use ranger::prelude::*;

/// A point on the integer grid.
///
/// Points are values: they are copied, not shared.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Point {
    /// Distance from the origin along the horizontal axis.
    pub x: int,
    /// Distance from the origin along the vertical axis.
    pub y: int,
}

/// The compass direction of a step.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Direction {
    North,
    East,
    South,
    West,
}

impl Point {
    /// Makes a point.
    ///
    /// # Arguments
    ///
    /// * `x` - The horizontal coordinate.
    /// * `y` - The vertical coordinate.
    ///
    /// # Returns
    ///
    /// The point at (x, y).
    pub fn new(x: int, y: int) -> Point {
        Point { x, y }
    }

    /// The point one step away in a direction; see [`Direction`].
    ///
    /// # Examples
    ///
    /// ```
    /// use geometry::{Point, Direction};
    /// let p = Point::new(0, 0).step(Direction::East);
    /// assert_eq!(p.x, 1);
    /// ```
    pub fn step(&self, d: Direction) -> Point {
        match d {
            Direction::North => Point::new(self.x, self.y + 1),
            Direction::East => Point::new(self.x + 1, self.y),
            Direction::South => Point::new(self.x, self.y - 1),
            Direction::West => Point::new(self.x - 1, self.y),
        }
    }
}

/// The number of grid steps between two points.
///
/// # Arguments
///
/// * `a` - Where to start.
/// * `b` - Where to end.
///
/// # Returns
///
/// |dx| + |dy|
///
/// # Examples
///
/// ```text
/// manhattan(Point::new(0, 0), Point::new(2, 3)) == 5
/// ```
#[ranger::doc(since = "1.2", category = "distance")]
pub fn manhattan(a: Point, b: Point) -> int {
    (a.x - b.x).abs() + (a.y - b.y).abs()
}

/// The largest coordinate of a point.
///
/// # Panics
///
/// Never: every point has two coordinates.
#[deprecated(since = "1.3", note = "Compare x and y directly.")]
pub fn max_coord(p: Point) -> int {
    if p.x > p.y {
        p.x
    } else {
        p.y
    }
}

fn main() {
    let p = Point::new(1, 2).step(Direction::North);
    println!("{:?} {}", p, manhattan(Point::new(0, 0), p));
}
