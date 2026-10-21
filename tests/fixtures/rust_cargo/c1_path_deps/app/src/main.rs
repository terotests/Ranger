// A crate with Cargo path dependencies (PLAN_RUST_SYNTAX.md §9.6).
mod report;

use shapes::{describe, Rect};

fn main() {
    let list = vec![Rect::new(1.5, 2.0), shapes::Rect::new(3.0, 1.0), Rect::new(0.5, 0.5)];
    println!("first {}", describe(&list[0]));
    println!("total {:.2}", shapes::total(&list));
    println!("largest {}", shapes::area::largest(&list));
    println!("perimeter cm {}", shapes::to_cm(&list[1].perimeter()));
    report::print_all(&list);
}
