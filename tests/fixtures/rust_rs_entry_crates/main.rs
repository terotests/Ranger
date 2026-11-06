//! A `.rs` entry crate (as MFilesAPI's desktop/web/main.rs) whose .rgr
//! module imports a second `.rs` crate: the second gets clone helpers of its
//! own (RsClone1), not the entry's name, so neither crate's helpers are lost.

#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("Leaf");
}
use rgr::Leaf;

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

fn main() {
    println!("{}", Rows::total());
    println!("{}", Leaf::total());
}
