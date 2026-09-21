#![allow(dead_code)]



#[derive(Clone)]
struct AbsentMain {
}
impl AbsentMain {
  pub fn new() -> Self {
    Self {
    }
  }
  fn report(label: &str, s: Option<String>) -> String {
    if  s.is_none() {
      return format!("{}: absent", label).clone();
    }
    format!("{}: present [{}]", label, s.clone().unwrap()).clone()
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut app: AbsentMain = AbsentMain::new();
  let mut s: Option<String> = None;
  println!("{}", AbsentMain::report("unset", s.clone()));
  s = Some(String::new());
  println!("{}", AbsentMain::report("empty", s.clone()));
  println!("empty ?? {}", if s.is_some() { s.clone().unwrap() } else { "FALLBACK".to_string() });
  s = Some("x".to_string());
  println!("{}", AbsentMain::report("set", s.clone()));
  let mut n: Option<i64> = None;
  if  n.is_none() {
    println!("int unset: absent");
  } else {
    println!("int unset: present");
  }
  n = Some(0);
  if  n.is_none() {
    println!("int zero: absent");
  } else {
    println!("int zero: present");
  }
  println!("int zero ?? {}", if n.is_some() { n.unwrap() } else { 99 });
}
