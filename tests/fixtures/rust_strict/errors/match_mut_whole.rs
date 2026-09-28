fn bump(o: &mut Option<i32>) {
    match o {
        Some(n) => *n += 1,
        None => {}
    }
}
fn main() {
    let mut a = Some(1);
    bump(&mut a);
    println!("{:?}", a);
}
