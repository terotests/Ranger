// Growing a Vec<u8>: push and extend_from_slice in loops (es6 and Go grow
// the buffer in place), a clone taken before the growth keeps its bytes, and
// a struct field grows like a local.

pub struct Writer {
    pub out: Vec<u8>,
}

impl Writer {
    pub fn new() -> Self {
        Self { out: Vec::new() }
    }

    pub fn byte(&mut self, b: i64) {
        self.out.push(b as u8);
    }

    pub fn word(&mut self, w: i64) {
        self.out.extend_from_slice(&[(w & 255) as u8, ((w >> 8) & 255) as u8]);
    }
}

fn sum(b: &[u8]) -> i64 {
    let mut s: i64 = 0;
    for x in b.iter() {
        s = (s * 31 + *x as i64) % 1000003;
    }
    s
}

fn main() {
    let mut v: Vec<u8> = Vec::new();
    let mut i: i64 = 0;
    while i < 3000 {
        v.push((i % 251) as u8);
        i += 1;
    }
    println!("pushed {} sum {}", v.len(), sum(&v));

    let before = v.clone();
    v.push(7);
    v.extend_from_slice(&before[0..10]);
    println!("clone kept {} grown {} last {}", before.len(), v.len(), v[v.len() - 1]);

    let mut w = Writer::new();
    let mut k: i64 = 0;
    while k < 1000 {
        w.byte(k % 7);
        w.word(k * 3);
        k += 1;
    }
    println!("writer {} sum {}", w.out.len(), sum(&w.out));

    let mut empty: Vec<u8> = Vec::new();
    empty.extend_from_slice(&[]);
    empty.push(1);
    println!("empty then {:?}", empty);
}
