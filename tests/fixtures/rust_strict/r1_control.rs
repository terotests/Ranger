// R1: control flow, functions, recursion, block expressions.
fn fib(n: u64) -> u64 {
    if n < 2 { n } else { fib(n - 1) + fib(n - 2) }
}

fn classify(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1 | 2 | 3 => "small",
        4..=9 => "medium",
        x if x < 0 => "negative",
        _ => "large",
    }
}

fn sum_to(n: i64) -> i64 {
    let mut total = 0;
    let mut i = 1;
    while i <= n {
        total += i;
        i += 1;
    }
    total
}

fn first_square_over(limit: i64) -> i64 {
    let mut k = 0;
    loop {
        k += 1;
        if k * k > limit {
            break k;
        }
    }
}

fn main() {
    println!("fib(15) = {}", fib(15));
    for n in [0, 2, 7, 12, -4] {
        println!("{} is {}", n, classify(n));
    }
    println!("sum_to(100) = {}", sum_to(100));
    println!("first square over 50: {}", first_square_over(50));
    let mut evens = 0;
    for i in 0..10 {
        if i % 2 == 1 {
            continue;
        }
        evens += i;
    }
    println!("evens {}", evens);
    for i in (1..=3).rev() {
        print!("{} ", i);
    }
    println!();
    let label = if evens > 10 { "big" } else { "small" };
    println!("label {}", label);
    let v = {
        let a = 3;
        let b = 4;
        a * a + b * b
    };
    println!("v {}", v);
    let x = 5;
    let x = x * 2;
    {
        let x = "shadow";
        println!("inner {}", x);
    }
    println!("outer {}", x);
    let grade = match v {
        25 => 'A',
        _ => 'B',
    };
    println!("grade {}", grade);
}
