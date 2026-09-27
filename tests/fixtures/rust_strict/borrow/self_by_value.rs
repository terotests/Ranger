struct S {
    parts: Vec<i64>,
}

impl S {
    fn into_parts(self) -> Vec<i64> {
        self.parts
    }
    fn size(&self) -> usize {
        self.parts.len()
    }
}

fn main() {
    let s = S { parts: vec![1] };
    let p = s.into_parts();
    println!("{} {}", p.len(), s.size());
}
