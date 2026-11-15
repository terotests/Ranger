#[path = "helper.rs"]
mod helper;

#[derive(Debug)]
pub struct Parser {
    nums: Vec<i64>,
    at: i64,
}

impl Parser {
    pub fn new(nums: Vec<i64>) -> Parser {
        Parser { nums: nums, at: 0 }
    }
    pub fn total(&mut self) -> i64 {
        self.at = helper::sum(&self.nums);
        self.at
    }
}

pub fn make() -> Parser {
    Parser { nums: vec![1], at: 2 }
}
