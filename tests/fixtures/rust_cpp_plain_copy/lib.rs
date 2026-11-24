// Plain-data structs as C++ values (tests/rust-cpp-plain.test.ts).
use ranger::prelude::*;
#[derive(Clone, Copy)]
pub struct P { pub x: int, pub t: int, pub d: double }
pub struct S { pub ps: Vec<P>, pub cur: P }
fn bump(p: &mut P) { p.x += 1; p.t += 2; }
fn read(p: &P) -> int { p.x * 2 }
impl S {
    fn top(&mut self) -> &mut P { let n = self.ps.len() - 1; &mut self.ps[n] }
    fn first(&self) -> &P { &self.ps[0] }
    fn work(&mut self) -> int {
        for p in self.ps.iter_mut() { p.x += 10; }
        let li = self.ps.len() - 1; self.ps[li].x += 100;
        { let q = &mut self.ps[0]; q.x += 1000; q.d = 2.5; }
        self.top().x += 5;
        bump(&mut self.ps[1]);
        bump(&mut self.cur);
        let mut c = self.ps[0]; c.x = -1;
        let r = self.first().x + read(&self.ps[1]);
        self.ps[1].t = 77;
        let popped = self.ps.pop().unwrap();
        self.ps.push(popped);
        self.ps[0].t += 3;
        let cp = &mut self.cur; cp.t += 40;
        r + c.x
    }
}
pub fn run() -> String {
    let mut s = S { ps: Vec::new(), cur: P { x: 0, t: 0, d: 0.0 } };
    s.ps.push(P { x: 1, t: 1, d: 1.0 });
    s.ps.push(P { x: 2, t: 2, d: 2.0 });
    let r = s.work();
    format!("{} {} {} {} {} {} {} {}", r, s.ps[0].x, s.ps[0].t, s.ps[0].d, s.ps[1].x, s.ps[1].t, s.cur.x, s.cur.t)
}
