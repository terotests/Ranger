//! A Rust struct whose members are named like Ranger keywords and
//! operators; .rgr code (Main.rgr) uses them by these names. Also static
//! fns named like Ranger operators, and `!` on a call with a format! arg.

use ranger::prelude::*;

pub struct Item {
    pub r#type: int,
    pub data: String,
    pub group: int,
}

impl Item {
    pub fn new() -> Item {
        Item { r#type: 1, data: String::from("d"), group: 0 }
    }

    pub fn remove(&mut self, n: int) -> int {
        self.group -= n;
        self.group
    }

    pub fn clear(&mut self) {
        self.data = String::new();
    }

    pub fn select(&self) -> String {
        format!("{}:{}:{}", self.r#type, self.data, self.group)
    }

    pub fn open() -> Item {
        Item::new()
    }

    pub fn sorted(n: int) -> int {
        n * 2
    }

    pub fn has(dir: String, file: String) -> bool {
        format!("{}{}", dir, file) == "dk.json"
    }

    pub fn missing(&self, k: &str) -> bool {
        !Item::has(self.data.clone(), format!("{}.json", k))
    }
}
