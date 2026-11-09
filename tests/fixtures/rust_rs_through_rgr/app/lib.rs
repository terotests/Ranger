//! A Rust crate that reaches Wide through Wide.rgr (`import_rgr!`), by
//! the snake_case names rustc sees in Ranger's Rust output.

mod rgr {
    ranger::import_rgr!("../dep/Wide");
}

pub struct App {}

impl App {
    pub fn run() -> String {
        let mut w = Wide::new();
        w.font_family = String::from("Open");
        let first = w.font_family.clone();
        format!("{}:{}:{}", Wide::from_win_ansi(64), first, w.label())
    }
}
