//! Members named in .rgr style (camelCase), as a library moved from .rgr
//! to Rust keeps them.

pub struct Wide {
    pub fontFamily: String,
}

impl Wide {
    pub fn new() -> Wide {
        Wide { fontFamily: String::from("none") }
    }

    pub fn fromWinAnsi(b: i64) -> i64 {
        b + 1
    }

    pub fn label(&self) -> String {
        format!("[{}]", self.fontFamily)
    }
}
