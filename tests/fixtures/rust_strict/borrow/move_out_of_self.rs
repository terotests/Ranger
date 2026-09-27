struct User {
    name: String,
}

impl User {
    fn take(&self) -> String {
        self.name
    }
}

fn main() {
    let u = User { name: String::from("a") };
    println!("{}", u.take());
}
