// R4: strings mean what Rust says on every target (PLAN_RUST_SYNTAX.md §5):
// code points through chars(), bytes through bytes() / as_bytes(), byte
// offsets from find() feeding slices.
use ranger::prelude::*;

fn show(s: &str) {
    let cps = s.chars().count();
    let bytes = s.as_bytes().len();
    println!("{:?}: {} chars, {} bytes", s, cps, bytes);
}

fn main() {
    let s: string = "aé😀b".to_string();
    show(&s);
    show("");
    show("ÅÄÖ");

    // code points
    let mut codes: Vec<u32> = Vec::new();
    for c in s.chars() {
        codes.push(c as u32);
    }
    println!("codes {:?}", codes);
    let v: Vec<char> = s.chars().collect();
    println!("second {} third {} count {}", v[1], v[2] as u32, v.len());
    println!("nth {:?}", s.chars().nth(2));
    let rev: String = s.chars().rev().collect();
    println!("rev {}", rev);

    // bytes
    let mut bs: Vec<u8> = Vec::new();
    for b in s.bytes() {
        bs.push(b);
    }
    println!("bytes {:?}", bs);
    println!("byte 1 {}", s.as_bytes()[1]);

    // byte offsets: find and slice agree
    let t = "päivää, world";
    match t.find(',') {
        Some(i) => {
            println!("comma at byte {}", i);
            println!("head [{}] tail [{}]", &t[..i], &t[i + 2..]);
        }
        None => println!("no comma"),
    }
    let w = t.find("world").unwrap_or(0);
    println!("world at {} -> {}", w, &t[w..]);
    println!("emoji at {:?}", s.find('😀'));
    println!("starts {} ends {} contains {}", s.starts_with("aé"), s.ends_with('b'), s.contains("😀"));

    // building
    let mut out = String::new();
    for (i, c) in "añb".chars().enumerate() {
        if i > 0 {
            out.push('-');
        }
        out.push(c);
    }
    println!("{} {}", out, out.chars().count());
    println!("{}", "ab".repeat(3));
    println!("{:?}", "a b  c".split_whitespace().collect::<Vec<&str>>());
    println!("upper {}", "straße".to_uppercase());
}
