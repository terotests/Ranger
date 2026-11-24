// Structs Rust only moves that hold vectors (CEr's JsObj, Slots, Elems):
// C++ holds them by value in a Vec, `&T` is a `const T&`, `&mut T` a `T&`,
// `-> &T` a `const T&` and `let x = &v[i]` / `for x in v.iter()` bind
// references. `S` shares its name with a trait parameter of the library.
#[derive(Clone, Copy)]
pub struct V {
    pub x: i32,
}
pub struct S {
    pub v: Vec<V>,
}
pub struct O {
    pub a: i32,
    pub inl: V,
    pub s: S,
    pub rc: i32,
}
pub struct M {
    pub objs: Vec<O>,
}
fn bump(o: &mut O, k: i32) {
    o.a += k;
    o.s.v.push(V { x: k });
}
fn grow(s: &mut S) {
    s.v.push(V { x: 7 });
}
fn total(o: &O) -> i32 {
    let mut t = o.a;
    let mut i = 0;
    while i < o.s.v.len() {
        t += o.s.v[i].x;
        i += 1;
    }
    t
}
impl M {
    fn ob(&self, i: usize) -> &O {
        &self.objs[i]
    }
    fn obm(&mut self, i: usize) -> &mut O {
        &mut self.objs[i]
    }
}
pub fn run() -> String {
    let mut m = M { objs: Vec::new() };
    let mut i = 0;
    while i < 3 {
        m.objs.push(O { a: i, inl: V { x: 1 }, s: S { v: Vec::new() }, rc: 0 });
        i += 1;
    }
    bump(&mut m.objs[1], 5);
    grow(&mut m.objs[2].s);
    m.obm(0).a = 40;
    m.obm(0).rc += 1;
    let t = total(m.ob(1)) + total(m.ob(2)) + m.ob(0).a + m.ob(0).rc;
    let first = &m.objs[1];
    let c = first.s.v.len() as i32;
    let mut sum = 0;
    for o in m.objs.iter() {
        sum += o.s.v.len() as i32 + o.inl.x;
    }
    format!("{} {} {}", t, c, sum)
}
