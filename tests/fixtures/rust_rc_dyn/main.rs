// A struct whose own `clone` makes a copy, shared as Rc<RefCell<T>>, and a
// trait object shared the same way: `h.clone()` is Rc's clone (the same
// object), `h.borrow().clone()` T's own, and `Rc<RefCell<dyn Trait>>` is
// borrowed and cloned like any shared object.
use std::cell::RefCell;
use std::rc::Rc;

pub struct Vec2 {
    pub x: i64,
    pub y: i64,
}

impl Vec2 {
    pub fn new() -> Self {
        Self { x: 0, y: 0 }
    }
    pub fn clone(&self) -> Rc<RefCell<Vec2>> {
        let v: Rc<RefCell<Vec2>> = Rc::new(RefCell::new(Vec2::new()));
        v.borrow_mut().x = self.x;
        v.borrow_mut().y = self.y;
        v
    }
    pub fn set(&mut self, x: i64, y: i64) {
        self.x = x;
        self.y = y;
    }
}

pub trait Sink {
    fn put(&mut self, v: i64);
    fn total(&mut self) -> i64 {
        0
    }
}

pub struct Adder {
    pub sum: i64,
}

impl Sink for Adder {
    fn put(&mut self, v: i64) {
        self.sum = self.sum + v;
    }
    fn total(&mut self) -> i64 {
        self.sum
    }
}

pub struct Holder {
    pub sink: Rc<RefCell<dyn Sink>>,
    pub adder: Rc<RefCell<Adder>>,
}

impl Holder {
    pub fn new() -> Self {
        let a: Rc<RefCell<Adder>> = Rc::new(RefCell::new(Adder { sum: 0 }));
        Self { sink: a.clone(), adder: a }
    }
    pub fn active(&self) -> Rc<RefCell<dyn Sink>> {
        self.sink.clone()
    }
}

fn main() {
    let p: Rc<RefCell<Vec2>> = Rc::new(RefCell::new(Vec2::new()));
    // the handle: the set shows through p
    (p.clone()).borrow_mut().set(3, 4);
    // a copy: p keeps 3, 4
    let c: Rc<RefCell<Vec2>> = p.borrow().clone();
    c.borrow_mut().set(9, 9);
    println!("{} {} {} {}", p.borrow().x, p.borrow().y, c.borrow().x, c.borrow().y);

    let h = Holder::new();
    let s: Rc<RefCell<dyn Sink>> = h.active();
    s.borrow_mut().put(5);
    h.sink.clone().borrow_mut().put(2);
    let t: i64 = s.borrow_mut().total();
    println!("{} {}", t, h.adder.borrow().sum);
}
