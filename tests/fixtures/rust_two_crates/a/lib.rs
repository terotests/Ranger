//! Crate a: clones a `Vec<Vec<i64>>` and boxes a `&mut Vec<i64>`.

pub struct Rows {
    pub data: Vec<Vec<i64>>,
}

impl Rows {
    pub fn new() -> Self {
        let mut data: Vec<Vec<i64>> = vec![];
        data.push(vec![1, 2]);
        data.push(vec![3]);
        Self { data: data }
    }

    pub fn total() -> i64 {
        let r = Rows::new();
        let mut c: Vec<Vec<i64>> = r.data.clone();
        c[0][0] = 10;
        let mut flat: Vec<i64> = vec![0, 0];
        Rows::put(&mut flat, 1, 5);
        c[0][0] + r.data[0][0] + flat[1]
    }

    fn put(v: &mut Vec<i64>, i: usize, x: i64) {
        v[i] = x;
    }
}
