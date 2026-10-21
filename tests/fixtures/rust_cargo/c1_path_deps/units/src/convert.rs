use crate::Meters;

pub fn suffix() -> String {
    String::from("m")
}

pub fn to_cm(m: &Meters) -> i64 {
    (m.v * 100.0) as i64
}
