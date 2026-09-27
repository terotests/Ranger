fn both(a: &mut i64, b: &mut i64) {
    *a += 1;
    *b += 1;
}

fn main() {
    let mut x = 1;
    both(&mut x, &mut x);
    println!("{}", x);
}
