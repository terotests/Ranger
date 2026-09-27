#[derive(Clone, Copy, Debug)]
pub struct Point {
    pub x: i64,
    pub y: i64,
}

pub const ORIGIN: Point = Point { x: 0, y: 0 };

impl Point {
    pub fn new(x: i64, y: i64) -> Point {
        Point { x, y }
    }

    pub fn dist2(&self, o: &Point) -> i64 {
        let dx = self.x - o.x;
        let dy = self.y - o.y;
        dx * dx + dy * dy
    }
}

pub fn midpoint(a: &Point, b: &Point) -> (i64, i64) {
    ((a.x + b.x) / 2, (a.y + b.y) / 2)
}

pub fn helper(x: i64) -> i64 {
    x * x
}
