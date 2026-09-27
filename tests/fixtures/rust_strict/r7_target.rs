// R7: `#[ranger::target(…)]` keeps an item or a method for the targets it
// lists, as `if_<target>` does in `.rgr`. Each variant here computes the same
// thing its own way; the Rust ones use what the other targets do not have.
use ranger::prelude::*;

#[ranger::target(rust)]
fn checksum(v: &Vec<int>) -> int {
    v.iter().map(|x| x * 3 + 1).sum::<int>()
}

#[ranger::target(es6, python, go, cpp, java7, kotlin, csharp, dart, scala, php, swift6)]
fn checksum(v: &Vec<int>) -> int {
    let mut s = 0;
    for x in v {
        s += x * 3 + 1;
    }
    s
}

struct Label {
    text: String,
}

impl Label {
    fn new(text: &str) -> Label {
        Label { text: text.to_string() }
    }

    #[ranger::target(rust, cpp, go)]
    fn boxed(&self) -> String {
        format!("[{:^9}]", self.text)
    }

    #[ranger::target(es6, python, java7, kotlin, csharp, dart, scala, php, swift6)]
    fn boxed(&self) -> String {
        let n = self.text.chars().count() as int;
        let left = (9 - n) / 2;
        let right = 9 - n - left;
        format!("[{}{}{}]", " ".repeat(left as usize), self.text, " ".repeat(right as usize))
    }

    fn shout(&self) -> String {
        self.text.to_uppercase()
    }
}

#[ranger::target(rust)]
const TARGET_KIND: &str = "native";

#[ranger::target(es6, python, go, cpp, java7, kotlin, csharp, dart, scala, php, swift6)]
const TARGET_KIND: &str = "native";

fn main() {
    let v = vec![1, 2, 3, 4];
    println!("checksum {}", checksum(&v));
    let l = Label::new("abc");
    println!("{} {}", l.boxed(), l.shout());
    println!("kind {}", TARGET_KIND);
}
