// R2: enums with data, match with guards and nested patterns, impl on enums.
#[derive(Debug, Clone, PartialEq)]
enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
    Triangle(f64, f64, f64),
    Empty,
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.0 * r * r,
            Shape::Rect { w, h } => w * h,
            Shape::Triangle(a, b, c) => {
                let s = (a + b + c) / 2.0;
                (s * (s - a) * (s - b) * (s - c)).sqrt()
            }
            Shape::Empty => 0.0,
        }
    }

    fn name(&self) -> String {
        match self {
            Shape::Circle(_) => String::from("circle"),
            Shape::Rect { w, h } if w == h => String::from("square"),
            Shape::Rect { .. } => String::from("rect"),
            Shape::Triangle(..) => String::from("triangle"),
            Shape::Empty => String::from("empty"),
        }
    }

    fn scale(&self, k: f64) -> Shape {
        match self {
            Shape::Circle(r) => Shape::Circle(r * k),
            Shape::Rect { w, h } => Shape::Rect { w: w * k, h: h * k },
            other => other.clone(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Dir {
    North,
    East,
    South,
    West,
}

impl Dir {
    fn turn(self) -> Dir {
        match self {
            Dir::North => Dir::East,
            Dir::East => Dir::South,
            Dir::South => Dir::West,
            Dir::West => Dir::North,
        }
    }
}

enum Token {
    Num(i64),
    Op(char),
    Ident(String),
}

fn eval(tokens: &Vec<Token>) -> i64 {
    let mut acc = 0;
    let mut op = '+';
    for t in tokens {
        match t {
            Token::Num(n) => {
                if op == '+' {
                    acc += n;
                } else {
                    acc -= n;
                }
            }
            Token::Op(c) => op = *c,
            Token::Ident(name) => println!("skip {}", name),
        }
    }
    acc
}

fn main() {
    let shapes = vec![
        Shape::Circle(1.5),
        Shape::Rect { w: 2.0, h: 3.0 },
        Shape::Rect { w: 2.0, h: 2.0 },
        Shape::Triangle(3.0, 4.0, 5.0),
        Shape::Empty,
    ];
    for s in &shapes {
        println!("{} {:.3}", s.name(), s.area());
    }
    let big = shapes[1].scale(2.0);
    println!("{:?}", big);
    println!("{:?}", shapes[0]);
    println!("{}", big == Shape::Rect { w: 4.0, h: 6.0 });
    println!("{}", shapes[4] == Shape::Empty);
    let mut d = Dir::North;
    for _ in 0..5 {
        d = d.turn();
    }
    println!("{:?} {}", d, d == Dir::East);
    let toks = vec![Token::Num(10), Token::Op('-'), Token::Num(3), Token::Ident(String::from("x")), Token::Op('+'), Token::Num(5)];
    println!("eval {}", eval(&toks));
    let maybe: Option<Shape> = Some(Shape::Circle(2.0));
    if let Some(Shape::Circle(r)) = &maybe {
        println!("circle of radius {}", r);
    }
    let pairs = vec![(1, 'a'), (2, 'b'), (3, 'c')];
    for (n, c) in &pairs {
        let kind = match (n % 2, c) {
            (0, _) => "even",
            (_, 'a') => "odd-a",
            _ => "odd",
        };
        println!("{} {} {}", n, c, kind);
    }
}
