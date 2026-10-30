// A Rust-syntax module: its own snake_case names must not hold back the
// renaming of the .rgr classes' members, and a tuple `if` over a shared
// object's fields assigns its value in the object's cell.

pub struct Shape {
    pub ring_ends: Vec<i64>,
    pub n: i64,
}

impl Shape {
    pub fn new_() -> Shape {
        Shape { ring_ends: Vec::new(), n: 2 }
    }

    pub fn load_font(&self) -> i64 {
        let max_y = self.n + 1;
        max_y
    }

    pub fn pair(&self, items: &Vec<Shape>, i: usize) -> i64 {
        let mut t = 0;
        for d in items {
            let (a, b) = if i < self.ring_ends.len() { (d.n, self.ring_ends[i]) } else { (d.n, 0) };
            t += a + b;
        }
        t
    }
}
