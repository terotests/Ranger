// R1: structs, impl blocks, methods, associated functions, Copy and Clone.
#[derive(Clone, Copy, Debug)]
struct Point {
    x: i64,
    y: i64,
}

impl Point {
    fn new(x: i64, y: i64) -> Point {
        Point { x, y }
    }

    fn origin() -> Self {
        Point { x: 0, y: 0 }
    }

    fn manhattan(&self, other: &Point) -> i64 {
        (self.x - other.x).abs() + (self.y - other.y).abs()
    }

    fn shift(&mut self, dx: i64) {
        self.x += dx;
    }
}

#[derive(Clone)]
struct Polygon {
    name: String,
    points: Vec<Point>,
}

impl Polygon {
    fn perimeter(&self) -> i64 {
        let mut total = 0;
        let n = self.points.len();
        for i in 0..n {
            let a = self.points[i];
            let b = self.points[(i + 1) % n];
            total += a.manhattan(&b);
        }
        total
    }
}

fn main() {
    let mut p = Point::new(3, 4);
    let q = p;
    p.shift(10);
    println!("p=({}, {}) q=({}, {})", p.x, p.y, q.x, q.y);
    let o = Point::origin();
    println!("dist {}", o.manhattan(&q));
    let square = Polygon {
        name: String::from("square"),
        points: vec![Point::new(0, 0), Point::new(2, 0), Point::new(2, 2), Point::new(0, 2)],
    };
    let mut copy = square.clone();
    copy.name.push_str("-copy");
    copy.points[0].x = -2;
    println!("{} {}", square.name, square.perimeter());
    println!("{} {}", copy.name, copy.perimeter());
    println!("{}", square.points.len());
}
