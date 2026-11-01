// A loop of Vec<u8> pushes and extends must stay linear: es6 grows a
// resizable ArrayBuffer in place and Go appends (a new buffer per push took
// 83 s for 200 000 pushes on es6).

fn main() {
    let mut v: Vec<u8> = Vec::new();
    let mut i: i64 = 0;
    while i < 2000000 {
        v.push((i % 251) as u8);
        i += 1;
    }
    let mut w: Vec<u8> = Vec::new();
    let chunk: Vec<u8> = vec![1u8; 100];
    let mut k: i64 = 0;
    while k < 20000 {
        w.extend_from_slice(&chunk);
        k += 1;
    }
    println!("{} {} {}", v.len(), v[1999999], w.len());
}
