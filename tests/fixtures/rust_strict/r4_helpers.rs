// R4: char tests, float methods and padded formatting, each lowered to a
// prelude helper that gives Rust's answer on every target.
use ranger::prelude::*;

fn classify(c: char) -> String {
    let mut tags: Vec<&str> = Vec::new();
    if c.is_alphabetic() {
        tags.push("alpha");
    }
    if c.is_ascii_alphabetic() {
        tags.push("ascii-alpha");
    }
    if c.is_ascii_digit() {
        tags.push("digit");
    }
    if c.is_alphanumeric() {
        tags.push("alnum");
    }
    if c.is_whitespace() {
        tags.push("space");
    }
    if c.is_uppercase() {
        tags.push("upper");
    }
    if c.is_lowercase() {
        tags.push("lower");
    }
    tags.join(",")
}

fn main() {
    for c in "aZ5 é\tÉ日ß-".chars() {
        println!("{:?} [{}] {} {}", c, classify(c), c.to_ascii_uppercase(), c.to_uppercase());
    }

    let xs: Vec<double> = vec![2.5, -2.5, 0.4, -0.6, 3.7];
    for x in xs.iter() {
        println!("{} round {} trunc {} signum {}", x, x.round(), x.trunc(), x.signum());
    }
    println!("ln {:.6} exp {:.6} log10 {} powf {}", (10.0 as double).ln(), (1.0 as double).exp(), (1000.0 as double).log10(), (2.0 as double).powf(0.5));
    println!("sin {:.4} cos {:.4}", (1.0 as double).sin(), (0.0 as double).cos());

    let names = vec!["ab", "ölj", "日本"];
    for n in names.iter() {
        println!("[{:>6}] [{:<6}] [{:^6}] [{:*^7}]", n, n, n, n);
    }
    let nums: Vec<int> = vec![7, -42, 12345];
    for v in nums.iter() {
        println!("[{:5}] [{:<5}] [{:05}]", v, v, v);
    }
    eprintln!("this goes to stderr");
    println!("done");
}
