// R8: Vec slices. Reading `&v[a..b]` (an argument, `to_vec`, iterating,
// `extend_from_slice`) and writing through one (`copy_from_slice`, `fill`).
fn sum(b: &[u8]) -> i64 {
    let mut s: i64 = 0;
    for x in b {
        s += *x as i64;
    }
    s
}

fn append(out: &mut Vec<u8>, src: &[u8], off: usize, n: usize) {
    out.extend_from_slice(&src[off..off + n]);
}

struct Writer {
    buf: Vec<u8>,
    len: usize,
}

impl Writer {
    fn put(&mut self, bytes: &[u8]) {
        let n = bytes.len();
        while self.buf.len() < self.len + n {
            self.buf.push(0);
        }
        self.buf[self.len..self.len + n].copy_from_slice(bytes);
        self.len += n;
    }

    fn done(&self) -> Vec<u8> {
        self.buf[..self.len].to_vec()
    }
}

fn main() {
    let a: Vec<u8> = vec![1, 2, 3, 250, 7];
    println!("sum {} {} {}", sum(&a), sum(&a[1..3]), sum(&a[3..]));
    let mut o: Vec<u8> = Vec::new();
    append(&mut o, &a, 1, 2);
    o.extend_from_slice(&a[..1]);
    println!("o {:?}", o);
    println!("head {:?} tail {:?} mid {:?}", a[..2].to_vec(), a[3..].to_vec(), a[1..=3].to_vec());
    let mut w = Writer { buf: Vec::new(), len: 0 };
    w.put(&a[0..2]);
    w.put(&[9, 9, 9]);
    println!("w {:?}", w.done());
    let mut z = vec![0u8; 6];
    z[1..4].fill(5);
    z[4..6].copy_from_slice(&a[3..5]);
    println!("z {:?}", z);
    let words = vec![String::from("a"), String::from("b"), String::from("c")];
    let tail = words[1..].to_vec();
    println!("{} {}", tail.len(), tail.join("+"));
}
