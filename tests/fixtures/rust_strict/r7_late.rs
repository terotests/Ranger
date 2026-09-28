// R7: a field set by an init method before it is read. `#[ranger::late]` on
// an `Option` field is `@(late)` in Ranger.
use ranger::prelude::*;

struct Config {
    name: String,
    retries: int,
}

#[ranger::fields]
struct Service {
    label: String,
    #[ranger::late]
    config: Option<Config>,
    calls: int,
}

impl Service {
    fn new(label: &str) -> Service {
        Service { label: label.to_string(), config: None, calls: 0 }
    }

    fn init(&mut self, name: &str, retries: int) {
        self.config = Some(Config { name: name.to_string(), retries });
    }

    fn describe(&self) -> String {
        let c = self.config.as_ref().unwrap();
        format!("{} uses {} ({} retries)", self.label, c.name, c.retries)
    }

    fn call(&mut self) -> int {
        self.calls += 1;
        self.config.as_ref().unwrap().retries * self.calls
    }
}

fn main() {
    let mut s = Service::new("api");
    println!("ready: {}", s.config.is_some());
    s.init("primary", 3);
    println!("ready: {}", s.config.is_some());
    println!("{}", s.describe());
    println!("{} {}", s.call(), s.call());
}
