// a `&mut Vec<u8>` parameter that grows: the caller sees the new bytes
fn put(out: &mut Vec<u8>, b: u8) {
    out.push(b);
}

fn main() {
    let mut v: Vec<u8> = Vec::new();
    put(&mut v, 1);
    put(&mut v, 2);
    println!("{} {:?}", v.len(), v);
}
