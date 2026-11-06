//! Crate b, lowered into the same program as crate a: clones a
//! `Vec<Vec<u8>>` (a vector of buffers, not of `Vec<i64>`) and boxes a
//! `&mut Vec<u8>`, so its generated helpers must not reuse crate a's.

pub struct Blobs {
    pub parts: Vec<Vec<u8>>,
}

impl Blobs {
    pub fn new() -> Self {
        let mut parts: Vec<Vec<u8>> = vec![];
        parts.push(vec![1, 2, 3]);
        parts.push(vec![4]);
        Self { parts: parts }
    }

    pub fn total() -> i64 {
        let b = Blobs::new();
        let mut c: Vec<Vec<u8>> = b.parts.clone();
        c[0][0] = 100;
        let mut buf: Vec<u8> = vec![0, 0, 0];
        Blobs::put(&mut buf, 2, 7);
        (c[0][0] as i64) + (b.parts[0][0] as i64) + (buf[2] as i64)
    }

    fn put(v: &mut Vec<u8>, i: usize, x: u8) {
        v[i] = x;
    }
}
