use ranger::prelude::*;

#[derive(Clone, Copy, PartialEq)]
enum Color { Red, Green, Blue }

#[derive(Clone, Copy, Default)]
struct Point { x: int, y: int }

struct App {
    items: Vec<string>,
}

impl App {
    fn new() -> App { App { items: vec![] } }

    /// Greets someone.
    ///
    /// # Parameters
    ///
    /// * `name` - Who to greet.
    #[ranger::doc(since = "1.2")]
    fn greet(&self, name: &str) -> string {
        format!("hello {}", name)
    }
}

mod legacy { ranger::import_rgr!("legacy"); }

fn main() {
    let app = App::new();
    println!("{}", app.greet("world"));
}
