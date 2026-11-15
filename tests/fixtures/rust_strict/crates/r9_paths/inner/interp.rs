use super::ops;
pub fn go() -> i64 {
    ops::add(2, 3) + ops::CMP_EQ + super::ops::add(1, 1)
}
