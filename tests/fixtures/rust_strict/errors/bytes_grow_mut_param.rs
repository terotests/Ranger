fn put(out: &mut Vec<u8>, b: u8) {
    out.push(b);
}

fn main() {
    let mut v: Vec<u8> = Vec::new();
    put(&mut v, 1);
    println!("{}", v.len());
}
