// R1: integer and float arithmetic, casts, formatting.
fn main() {
    let a: i64 = 17;
    let b = 5;
    println!("{} {} {} {}", a + b, a - b, a * b, a / b);
    println!("{} {}", a % b, -a / b);
    println!("{} {}", -7 % 3, -7 / 2);
    let x = 7.5;
    let y: f64 = 2.0;
    println!("{} {} {}", x / y, x * y, x - 10.0);
    let (p, q) = (0.1, 0.2);
    println!("{}", p + q); // literals would be folded exactly by Go (ISSUES.md #101)
    println!("{}", 3.0 * 2.0);
    let t = 3.9_f64;
    println!("{} {}", t as i64, -t as i64);
    println!("{}", a as f64 / 2.0);
    let big: u8 = 200;
    println!("{}", (big as u32 + 100) as u8);
    println!("{}", 1 << 4 | 3);
    println!("{} {}", 12 & 10, 12 ^ 10);
    let mut acc = 0;
    acc += 5;
    acc *= 3;
    acc -= 1;
    acc /= 2;
    println!("acc={}", acc);
    println!("{:.2} {:.0}", 3.14159, 2.5);
}
