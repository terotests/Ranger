#![allow(dead_code)]
#![allow(unused_mut)]



#[derive(Clone)]
struct Stats {
}
impl Stats {
  pub fn new() -> Self {
    Self {
    }
  }
  fn total(xs: &[i64]) -> i64 {
    let mut acc: i64 = 0;
    for v in xs.iter().copied() {
      acc += v;
    }
    acc
  }
  fn even_count(xs: &[i64]) -> i64 {
    let mut n: i64 = 0;
    for v in xs.iter().copied() {
      if  v % 2 == 0 {
        n += 1;
      }
    }
    n
  }
  fn doubled(xs: &[i64]) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    for v in xs.iter().copied() {
      out.push(v * 2);
    }
    out.clone()
  }
  fn apply_each(xs: &[i64], f: &mut dyn FnMut(i64) -> i64) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    for v in xs.iter().copied() {
      let next: i64 = f(v);
      out.push(next);
    }
    out.clone()
  }
}
#[derive(Clone)]
struct IterMain {
}
impl IterMain {
  pub fn new() -> Self {
    Self {
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut s: Stats = Stats::new();
  let mut xs: Vec<i64> = vec![1, 2, 3, 4];
  println!("sum {}", Stats::total(&xs));
  println!("evens {}", Stats::even_count(&xs));
  let mut twice: Vec<i64> = Stats::doubled(&xs);
  println!("doubled0 {}", twice[0]);
  let add_one: &mut dyn FnMut(i64) -> i64 = &mut |mut p| {
    return p + 1;
  };
  let mut bumped: Vec<i64> = Stats::apply_each(&xs, add_one);
  println!("bumped0 {}", bumped[0]);
}
