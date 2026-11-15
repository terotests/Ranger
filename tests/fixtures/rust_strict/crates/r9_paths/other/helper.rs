pub fn sum(v: &Vec<i64>) -> i64 {
    let mut s = 0;
    for x in v.iter() {
        s += *x;
    }
    s
}
