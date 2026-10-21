// Two modules with a type of the same name: valid Rust, refused because
// type names are global in the Ranger subset (§9.4).
mod zip {
    pub struct Entry {
        pub name: String,
    }
}

mod repo {
    pub struct Entry {
        pub path: String,
    }
}

fn main() {
    let a = zip::Entry { name: String::from("a") };
    let b = repo::Entry { path: String::from("b") };
    println!("{} {}", a.name, b.path);
}
