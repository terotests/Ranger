// `s.as_bytes()[i]` and `s.as_bytes().len()` in a loop: the UTF-8 byte at i,
// read in place (rs_byte_at) on Go, Rust and C++, not through a copy of the
// whole text per byte

struct Doc {
    text: String,
}

fn hash(s: &str) -> i64 {
    let mut h: i64 = 17;
    let mut i: i64 = 0;
    while i < s.as_bytes().len() as i64 {
        h = (h * 33 + (s.as_bytes()[i as usize] as i64)) % 65521;
        i += 1;
    }
    h
}

fn spaces(d: &Doc) -> i64 {
    let mut n: i64 = 0;
    let mut i: i64 = 0;
    while i < d.text.as_bytes().len() as i64 {
        if d.text.as_bytes()[i as usize] == 32 {
            n += 1;
        }
        i += 1;
    }
    n
}

fn main() {
    let s = String::from("a\u{e4}b \u{20ac} z");
    let mut parts: Vec<String> = Vec::new();
    let mut i: usize = 0;
    while i < s.as_bytes().len() {
        parts.push(format!("{}", s.as_bytes()[i]));
        i += 1;
    }
    println!("bytes {} {}", s.as_bytes().len(), parts.join(","));
    let mut big = String::new();
    let mut k = 0;
    while k < 20000 {
        big.push_str("ab c");
        k += 1;
    }
    println!("hash {} {}", hash(&s), hash(&big));
    let d = Doc { text: big };
    println!("spaces {}", spaces(&d));
}
