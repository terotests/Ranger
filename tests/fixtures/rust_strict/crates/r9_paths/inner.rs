pub mod ops;
pub mod interp;
pub fn run() -> i64 {
    interp::go()
}
