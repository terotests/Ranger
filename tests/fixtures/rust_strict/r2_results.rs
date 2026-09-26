// R2: Result, the ? operator, custom error enums, Display impls.
use std::fmt;

#[derive(Debug)]
enum ParseError {
    Empty,
    BadNumber(String),
    Negative(i64),
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ParseError::Empty => write!(f, "empty input"),
            ParseError::BadNumber(s) => write!(f, "not a number: {}", s),
            ParseError::Negative(n) => write!(f, "negative: {}", n),
        }
    }
}

fn parse_positive(s: &str) -> Result<i64, ParseError> {
    let t = s.trim();
    if t.is_empty() {
        return Err(ParseError::Empty);
    }
    let mut value: i64 = 0;
    for c in t.chars() {
        match c.to_digit(10) {
            Some(d) => value = value * 10 + d as i64,
            None => {
                if c == '-' {
                    continue;
                }
                return Err(ParseError::BadNumber(t.to_string()));
            }
        }
    }
    if t.starts_with('-') {
        return Err(ParseError::Negative(-value));
    }
    Ok(value)
}

fn sum_all(items: &[&str]) -> Result<i64, ParseError> {
    let mut total = 0;
    for s in items {
        total += parse_positive(s)?;
    }
    Ok(total)
}

fn safe_div(a: i64, b: i64) -> Result<i64, String> {
    if b == 0 {
        Err(String::from("division by zero"))
    } else {
        Ok(a / b)
    }
}

struct Point {
    x: i64,
    y: i64,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    for input in ["42", "  7 ", "", "x1", "-5"] {
        match parse_positive(input) {
            Ok(v) => println!("ok {}", v),
            Err(e) => println!("error: {}", e),
        }
    }
    println!("{:?}", sum_all(&["1", "2", "3"]).is_ok());
    match sum_all(&["1", "oops", "3"]) {
        Ok(v) => println!("sum {}", v),
        Err(e) => println!("sum failed: {}", e),
    }
    println!("{}", safe_div(10, 3).unwrap());
    println!("{}", safe_div(1, 0).unwrap_or(-1));
    if let Err(msg) = safe_div(1, 0) {
        println!("err {}", msg);
    }
    let p = Point { x: 3, y: -4 };
    println!("p = {}", p);
    let s = p.to_string();
    println!("{} {}", s, s.chars().count());
}
