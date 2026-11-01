// Vec<u8> and &[u8] are Ranger buffers: indexing, ranges, growing (a new
// buffer stored back), loops, {:?}, b"…", equality and UTF-8 text.

pub struct Reader {
    pub data: Vec<u8>,
    pub pos: usize,
}

impl Reader {
    pub fn new(data: Vec<u8>) -> Self {
        Self { data, pos: 0 }
    }

    pub fn u8(&mut self) -> i64 {
        let v = self.data[self.pos] as i64;
        self.pos += 1;
        v
    }

    pub fn u16le(&mut self) -> i64 {
        let v = (self.data[self.pos] as i64) | ((self.data[self.pos + 1] as i64) << 8);
        self.pos += 2;
        v
    }

    pub fn take(&mut self, n: usize) -> Vec<u8> {
        let out = self.data[self.pos..self.pos + n].to_vec();
        self.pos += n;
        out
    }
}

pub struct Writer {
    pub out: Vec<u8>,
}

impl Writer {
    pub fn new() -> Self {
        Self { out: Vec::new() }
    }

    pub fn put(&mut self, b: u8) {
        self.out.push(b);
    }

    pub fn put_all(&mut self, bs: &[u8]) {
        self.out.extend_from_slice(bs);
    }
}

fn sum(b: &[u8]) -> i64 {
    let mut s: i64 = 0;
    for x in b.iter() {
        s += *x as i64;
    }
    s
}

fn make(n: usize) -> Vec<u8> {
    let mut v: Vec<u8> = vec![0u8; n];
    for i in 0..n {
        v[i] = (i * 30) as u8;
    }
    v
}

fn main() {
    let v = make(10);
    println!("make {:?} len {} sum {}", v, v.len(), sum(&v));
    println!("range {:?} from {:?} to {:?}", &v[2..5], &v[7..], &v[..2]);

    let mut r = Reader::new(vec![1, 2, 3, 4, 5, 6, 7]);
    let a = r.u8();
    let b = r.u16le();
    let rest = r.take(3);
    println!("read {} {} {:?} at {}", a, b, rest, r.pos);

    let mut w = Writer::new();
    w.put(7);
    w.put(255);
    w.put_all(&v[0..3]);
    w.put_all(b"AB");
    println!("wrote {:?} empty {}", w.out, w.out.is_empty());

    let mut total = 0;
    for &x in &w.out {
        total += x as i64;
    }
    for (i, x) in v.iter().enumerate() {
        if i < 2 {
            total += *x as i64;
        }
    }
    println!("total {}", total);

    let s = "hé😀";
    let bs = s.as_bytes().to_vec();
    println!("utf8 {:?} {}", bs, String::from_utf8_lossy(&bs));
    let t = String::from_utf8(bs.clone()).unwrap();
    println!("back {} eq {} ne {}", t, bs == s.as_bytes().to_vec(), bs != v);
    println!("bad {}", String::from_utf8_lossy(&[104u8, 255, 105]));

    let mut dst = vec![1u8; 6];
    dst[1..4].copy_from_slice(&[9u8, 8, 7]);
    dst.truncate(5);
    println!("dst {:?} has9 {} has5 {}", dst, dst.contains(&9), dst.contains(&5));
    println!("first {:?} last {:?} get {:?} none {:?}", dst.first(), dst.last(), dst.get(2), dst.get(9));
    dst.resize(7, 4);
    dst.fill(3);
    dst[0] = 200;
    dst[1] += 5;
    println!("filled {:?} clone {:?}", dst, dst.clone());
    dst.clear();
    println!("cleared {}", dst.len());
}
