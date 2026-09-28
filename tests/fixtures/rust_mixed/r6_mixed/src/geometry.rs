use ranger::prelude::*;

#[derive(Clone, Copy, Debug)]
pub struct Point {
    pub x: int,
    pub y: int,
}

impl Point {
    pub fn new(x: int, y: int) -> Point {
        Point { x, y }
    }

    pub fn dist2(&self, o: &Point) -> int {
        let dx = self.x - o.x;
        let dy = self.y - o.y;
        dx * dx + dy * dy
    }
}
