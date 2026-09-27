// R1: Vec, String and Option basics.
fn find_index(v: &Vec<i64>, target: i64) -> Option<usize> {
    for (i, x) in v.iter().enumerate() {
        if *x == target {
            return Some(i);
        }
    }
    None
}

fn main() {
    let mut v: Vec<i64> = Vec::new();
    for i in 0..5 {
        v.push(i * i);
    }
    println!("len {} first {} last {}", v.len(), v[0], v[v.len() - 1]);
    v[1] = 100;
    let mut sum = 0;
    for x in &v {
        sum += x;
    }
    println!("sum {}", sum);
    match find_index(&v, 9) {
        Some(i) => println!("found at {}", i),
        None => println!("not found"),
    }
    if let Some(i) = find_index(&v, 7) {
        println!("found 7 at {}", i);
    } else {
        println!("no 7");
    }
    let missing = find_index(&v, 42).unwrap_or(99);
    println!("missing {}", missing);
    let popped = v.pop();
    println!("popped {:?} len {}", popped, v.len());
    println!("empty {}", v.is_empty());

    let mut s = String::new();
    s.push_str("héllo");
    s.push(' ');
    s += "wörld";
    println!("{} chars {}", s, s.chars().count());
    println!("upper {}", s.to_uppercase());
    println!("contains {} starts {}", s.contains("wö"), s.starts_with("hé"));
    let words: Vec<&str> = s.split(' ').collect();
    println!("words {} {}", words.len(), words[1]);
    let trimmed = "  pad  ".trim();
    println!("[{}]", trimmed);
    let mut count = 0;
    for c in s.chars() {
        if c == 'l' || c == 'ö' {
            count += 1;
        }
    }
    println!("count {}", count);
    let n: i64 = "42".parse().unwrap();
    println!("parsed {}", n + 1);
    let name = String::from("x");
    let greeting = format!("hi {}!", name);
    println!("{} {}", greeting, !greeting.is_empty());
}
