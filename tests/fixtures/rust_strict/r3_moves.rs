// R3: legal moves and borrows the move check must accept.
#[derive(Debug, Clone, Copy)]
struct P {
    x: i64,
    y: i64,
}

struct Pair {
    left: Vec<i64>,
    right: Vec<i64>,
}

fn consume(v: Vec<i64>) -> usize {
    v.len()
}

fn longest(a: String, b: String) -> String {
    if a.chars().count() >= b.chars().count() { a } else { b }
}

fn add_to(dst: &mut Vec<i64>, src: &Vec<i64>) {
    for x in src {
        dst.push(*x);
    }
}

fn main() {
    // a moved value is reassigned before its next use
    let mut a = String::from("first");
    let b = a;
    a = String::from("second");
    println!("{} {}", a, b);

    // a move in a branch that returns early does not reach the code after it
    let v = vec![1, 2, 3];
    let n = if v.is_empty() { 0 } else { consume(v.clone()) };
    println!("n {}", n);
    let w = v;
    println!("w {:?}", w);

    // moved inside a loop, but the loop leaves right after
    let data = vec![4, 5];
    let mut total = 0;
    loop {
        total += consume(data);
        break;
    }
    println!("total {}", total);

    // Copy values and string slices are used again freely
    let p = P { x: 1, y: 2 };
    let q = p;
    println!("{:?} {:?}", p, q);
    let s = "slice";
    let t = s;
    println!("{} {}", s, t);

    // clone before a move
    let names = vec![String::from("ann"), String::from("bob")];
    let kept = names.clone();
    let count = names.len();
    let moved = names;
    println!("{} {} {}", kept.len(), count, moved[1]);

    // moves into a function, one of two
    let x = String::from("xx");
    let y = String::from("yyy");
    println!("{}", longest(x, y));

    // shadowing is a new variable
    let z = String::from("one");
    let z = z + "-two";
    println!("{}", z);

    // disjoint fields borrowed at once
    let mut pair = Pair { left: vec![1], right: vec![2, 3] };
    add_to(&mut pair.left, &pair.right);
    println!("{:?}", pair.left);

    // a match whose moving arm diverges
    let maybe = Some(String::from("value"));
    let got = match maybe {
        Some(text) => text,
        None => return,
    };
    println!("{}", got);
}
