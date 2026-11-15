pub struct Parser {
    chars: Vec<char>,
    pos: usize,
}

impl Parser {
    pub fn new(s: &str) -> Parser {
        Parser { chars: s.chars().collect(), pos: 0 }
    }
    pub fn count(&mut self) -> i64 {
        let mut n = 0;
        while self.pos < self.chars.len() {
            if self.chars[self.pos].is_ascii_digit() {
                n += 1;
            }
            self.pos += 1;
        }
        n
    }
}
