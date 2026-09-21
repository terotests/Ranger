#![allow(dead_code)]
#![allow(unused_mut)]



#[derive(Clone)]
struct TextTools {
}
impl TextTools {
  pub fn new() -> Self {
    Self {
    }
  }
  fn greet(name: &str) -> String {
    format!("hello {}", name).clone()
  }
  fn total(xs: &[i64]) -> i64 {
    let mut acc: i64 = 0;
    for v in xs.iter().copied() {
      acc += v;
    }
    acc
  }
  fn first_char(s: &str) -> String {
    if  (s.len() as i64) == 0 {
      return String::new().clone();
    }
    rg_substring(&s, 0, 1).clone()
  }
  fn twice(&self, xs: &[i64]) -> i64 {
    TextTools::total(xs) + TextTools::total(xs)
  }
}
#[derive(Clone)]
struct SliceMain {
}
impl SliceMain {
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
  let mut t: TextTools = TextTools::new();
  println!("{}", TextTools::greet("ada"));
  let mut xs: Vec<i64> = vec![1, 2, 3];
  println!("twice {}", t.twice(&xs));
  println!("first {}", TextTools::first_char("grace"));
}

// A Ranger string index is the TARGET'S OWN unit, and on Rust that unit is
// the UTF-8 byte -- what a String is actually made of, and the only one it
// indexes in constant time. It used to be the char: strlen counted chars(),
// charAt was chars().nth(i) and substring was chars().skip().take(), so the
// ordinary `while (i < (strlen s)) { charAt s i }` scan walked the string
// once per character and was quadratic -- 120 000 characters took 8.8 s
// where C++ took 11 ms. It also disagreed with charcode, which has read
// as_bytes()[0] all along.
//
// Both helpers are TOTAL, because the forms they replace were: an index past
// the end answered a zero rather than panicking, and scanners here rely on
// reading one past the last character.
fn rg_char_at(s: &str, at: i64) -> i64 {
    let b = s.as_bytes();
    if at < 0 { return 0; }
    let i = at as usize;
    if i >= b.len() { return 0; }
    b[i] as i64
}

// A byte slice of a String has to be valid UTF-8, and a slice that cuts a
// multi byte character is not. Measured over the compiler compiling itself
// and the markdown gallery -- 78 012 slices -- not one cut a character:
// a scanner slices at a delimiter it found, every delimiter here is ASCII,
// and an ASCII byte is always a character boundary in UTF-8. So
// from_utf8_lossy is the backstop for what the measurement did not cover,
// not the expected path. docs/plans/PLAN_STRING_INDEXING.md 4.1.
fn rg_substring(s: &str, from: i64, to: i64) -> String {
    let b = s.as_bytes();
    let n = b.len() as i64;
    let mut a = if from < 0 { 0 } else { from };
    if a > n { a = n; }
    let mut e = if to > n { n } else { to };
    if e < a { e = a; }
    // A Rust String cannot hold half a character, so a slice that cuts one
    // has to be rounded to a boundary rather than returned as bytes -- which
    // is what C++, PHP and Go can do and Rust cannot. The rule is Swift's,
    // for the same reason (see r_substring): the unit that STARTS a character
    // carries the whole of it and the units inside it carry nothing, so a
    // walk that copies one unit at a time still reproduces the text.
    while a < n && (b[a as usize] & 0xC0) == 0x80 { a += 1; }
    if e < a { e = a; }
    while e < n && (b[e as usize] & 0xC0) == 0x80 { e += 1; }
    String::from_utf8_lossy(&b[a as usize..e as usize]).to_string()
}

