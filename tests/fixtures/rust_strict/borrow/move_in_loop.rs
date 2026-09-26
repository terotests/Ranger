fn consume(v: Vec<i64>) -> usize {
    v.len()
}

fn main() {
    let v = vec![1, 2];
    for _ in 0..3 {
        println!("{}", consume(v));
    }
}
