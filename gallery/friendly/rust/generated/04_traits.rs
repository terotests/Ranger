#![allow(dead_code)]



#[derive(Clone)]
struct User {
  age: i64,
  name: &'static str,
}
impl User {
  pub fn new() -> Self {
    Self {
      age: 0,
      name: "",
    }
  }
  fn as_string(&self) -> String {
    format!("{} {}", self.name, self.age).clone()
  }
  fn label(&self) -> String {
    self.name.to_string()
  }
}
#[derive(Clone)]
struct Bot {
  name: &'static str,
}
impl Bot {
  pub fn new() -> Self {
    Self {
      name: "",
    }
  }
  fn as_string(&self) -> String {
    format!("bot:{}", self.name).clone()
  }
  fn label(&self) -> String {
    self.name.to_string()
  }
}
#[derive(Clone)]
struct TraitsMain {
}
impl TraitsMain {
  pub fn new() -> Self {
    Self {
    }
  }
  fn show(mut who: &mut User) -> String {
    format!("label={} text={}", who.label(), who.as_string()).clone()
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut app: TraitsMain = TraitsMain::new();
  let mut u: User = User::new();
  u.name = "ada";
  u.age = 36;
  println!("{}", TraitsMain::show(&mut u));
  let mut b: Bot = Bot::new();
  b.name = "r2";
  println!("{}", b.as_string());
}
