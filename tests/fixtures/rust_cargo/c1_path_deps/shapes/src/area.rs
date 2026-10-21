use crate::Rect;

pub fn total(list: &Vec<Rect>) -> f64 {
    let mut t = 0.0;
    for r in list {
        t += r.area();
    }
    t
}

pub fn largest(list: &Vec<Rect>) -> i64 {
    let mut best: i64 = -1;
    let mut best_area = 0.0;
    let mut i: i64 = 0;
    for r in list {
        if r.area() > best_area {
            best_area = r.area();
            best = i;
        }
        i += 1;
    }
    best
}
