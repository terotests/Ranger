// push_str / push in loops (linear on Go, where rs_str_append grows the
// string in place), and strings kept from earlier states of the same
// buffer: none of them may change when the string grows on.

fn grow(base: &str, n: i64) -> String {
    let mut s = String::from(base);
    let mut i: i64 = 0;
    while i < n {
        s.push_str("ab");
        i += 1;
    }
    s
}

fn main() {
    let mut s = String::new();
    let mut i: i64 = 0;
    while i < 20000 {
        s.push_str("xy");
        s.push('z');
        i += 1;
    }
    println!("{}", s.as_bytes().len());

    // a kept copy, then two strings grown from the same one
    let mut a = grow("start:", 40);
    let kept = a.clone();
    a.push_str("-A");
    let mut b = kept.clone();
    b.push_str("-B");
    a.push_str("-more");
    println!("{}", kept.as_bytes().len());
    println!("{}", a.ends_with("ab-A-more"));
    println!("{}", b.ends_with("abab-B"));
    println!("{}", b.contains("-A"));
    println!("{}", kept.ends_with("abab"));

    // many builders at once (more than the Go side keeps buffers for)
    let mut parts: Vec<String> = Vec::new();
    let mut k: i64 = 0;
    while k < 12 {
        parts.push(grow("p", 50));
        k += 1;
    }
    let mut r: i64 = 0;
    while r < 3 {
        let mut j: usize = 0;
        while j < parts.len() {
            let mut t = parts[j].clone();
            t.push_str(&j.to_string());
            parts[j] = t;
            j += 1;
        }
        r += 1;
    }
    println!("{}", parts[0]);
    println!("{}", parts[11]);
}
