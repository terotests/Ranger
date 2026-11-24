// Plain-data structs as C++ values (tests/rust-cpp-plain.test.ts).
use ranger::prelude::*;
use std::rc::Rc;
use std::cell::RefCell;
#[derive(Clone, Copy)]
pub struct V { pub t: int, pub d: double }
pub struct F { pub pc: int, pub this_val: V, pub construct: bool }
pub struct H { pub n: int }
pub struct M { pub frames: Vec<F>, pub shared: Rc<RefCell<H>> }
fn mk(pc: int) -> F { F { pc: pc, this_val: V { t: pc, d: 0.5 }, construct: false } }
fn step(f: &mut F) { f.pc += 1; f.this_val.d *= 2.0; }
impl M {
    fn top(&mut self) -> &mut F { let n = self.frames.len() - 1; &mut self.frames[n] }
    fn run(&mut self) -> int {
        self.frames.push(mk(1));
        self.frames.push(F { pc: 10, this_val: V { t: 3, d: 1.0 }, construct: true });
        let fi = self.frames.len() - 1;
        self.frames[fi].pc = self.frames[fi].pc + 5;
        step(self.top());
        { let f = &mut self.frames[0]; f.this_val.t = 9; }
        let fr = self.frames.pop().unwrap();
        let h2 = self.shared.clone();
        h2.borrow_mut().n += fr.pc;
        let mut sum = 0;
        for f in self.frames.iter() { sum += f.pc + f.this_val.t; }
        self.frames.push(fr);
        let last = &self.frames[1];
        sum * 1000 + last.pc + (last.this_val.d as int) * 100 + self.shared.borrow().n * 10000
    }
}
pub fn run() -> String {
    let mut m = M { frames: Vec::new(), shared: Rc::new(RefCell::new(H { n: 1 })) };
    let r = m.run();
    format!("{} {} {}", r, m.frames.len(), m.frames[1].construct)
}
