//! Three shapes of RangerDocx's Rust-syntax modules: a buffer field of a .rgr
//! class written from .rs, `.clone()` of an `Rc<RefCell<T>>` whose T has no
//! Clone, and `Type::f(&mut v)` with a value-type place.

use ranger::prelude::*;
#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("Img");
}
use rgr::Img;

pub struct Node {
    pub id: i64,
}

impl Node {
    pub fn new() -> Self {
        Self { id: 0 }
    }
}

pub struct Shapes {}

impl Shapes {
    pub fn new() -> Self {
        Self {}
    }

    /// a buffer field of a .rgr class, set and read as bytes
    /// (not pub: it takes a .rgr class, which the API check calls internal)
    fn fill(img: &Rc<RefCell<Img>>) -> i64 {
        img.borrow_mut().pixels[1] = 200;
        img.borrow().pixels[1] as i64 + img.borrow().pixels.len() as i64
    }

    /// the Rc handle is copied: one object, no Clone on Node
    pub fn shared() -> i64 {
        let a: Rc<RefCell<Node>> = Rc::new(RefCell::new(Node::new()));
        let b: Rc<RefCell<Node>> = a.clone();
        b.borrow_mut().id = 7;
        a.borrow().id
    }

    fn insert_sorted(list: &mut Vec<i64>, v: i64) {
        let mut i: usize = 0;
        while i < list.len() {
            if list[i] > v {
                list.insert(i, v);
                return;
            }
            i += 1;
        }
        list.push(v);
    }

    /// `Shapes::insert_sorted(&mut v, …)`: the place is boxed and written back
    pub fn sorted() -> i64 {
        let mut v: Vec<i64> = Vec::new();
        Shapes::insert_sorted(&mut v, 3);
        Shapes::insert_sorted(&mut v, 1);
        Shapes::insert_sorted(&mut v, 2);
        v[0] * 100 + v[1] * 10 + v[2]
    }
}
