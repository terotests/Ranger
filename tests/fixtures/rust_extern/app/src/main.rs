use std::cell::RefCell;
use std::rc::Rc;

#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("App");
}

fn main() {
    // made by base, read by app's own class: one Item type
    let cat = Rc::new(RefCell::new(base::Catalog::new()));
    base::Catalog::add(&cat, base::Item::make("a".to_string(), 2.0, 3.0));
    base::Catalog::add(&cat, base::Item::make("b".to_string(), 4.0, 5.0));
    let rep = Rc::new(RefCell::new(rgr::Report::new()));
    rgr::Report::fill(&rep, &cat);
    println!("{}", rgr::Report::text(&rep));
    println!("{}", base::Catalog::count(&cat));
}
