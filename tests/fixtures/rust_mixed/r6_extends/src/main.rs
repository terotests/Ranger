#[allow(dead_code, unused)]
mod kid {
    ranger::import_rgr!("kid");
}

use kid::Kid;

fn main() {
    // Base's field and method on a Kid; Kid's own `kind` wins
    let mut k = Kid::new();
    k.tid = String::from("kid");
    println!("{}", k.hello());
    println!("{} {}", k.kind(), k.hits);
    // a field the class keeps in a Cell on the Rust side: get/set are the
    // field itself for the other targets
    k.n.set(k.n.get() + 1);
    println!("n {}", k.n.get());
}
