fn main() {
    let mut v = vec![1, 2];
    for x in &v {
        v.push(*x);
    }
    println!("{:?}", v);
}
