// R8 (EVG port): a list of lists written as a literal, and `to_digit` with
// a radix other than 10.
fn total(rows: &Vec<Vec<i64>>) -> i64 {
    let mut s: i64 = 0;
    for r in rows.iter() {
        for v in r.iter() {
            s += *v;
        }
    }
    s
}

fn hex(text: &str) -> i64 {
    let mut v: i64 = 0;
    for c in text.chars() {
        match c.to_digit(16) {
            Some(d) => v = v * 16 + d as i64,
            None => return -1,
        }
    }
    v
}

fn main() {
    let rows: Vec<Vec<i64>> = vec![vec![1, 2, 3], vec![40], vec![500, 600]];
    println!("rows {} total {}", rows.len(), total(&rows));
    let words = vec![vec!["a", "b"], vec!["c"]];
    println!("words {} {}", words[0].len(), words[1][0]);
    println!("hex {} {} {} {}", hex("ff"), hex("C0de"), hex("7"), hex("xg"));
    let d36 = 'z'.to_digit(36);
    let d8 = '9'.to_digit(8);
    println!("z36 {} 9in8 {}", d36.unwrap_or(99), d8.is_none());
}
