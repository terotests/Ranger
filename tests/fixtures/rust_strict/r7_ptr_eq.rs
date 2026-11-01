// R7: identity of shared objects. `Rc::ptr_eq` (and `std::ptr::eq` on two
// references) asks whether two handles are the same object, which is what
// `==` of two objects means in .rgr; two equal-looking objects are not.
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    v: i64,
}

fn index_of(list: &Vec<Rc<RefCell<Node>>>, n: &Rc<RefCell<Node>>) -> i64 {
    let mut i: i64 = 0;
    while i < list.len() as i64 {
        if Rc::ptr_eq(&list[i as usize], n) {
            return i;
        }
        i += 1;
    }
    -1
}

fn main() {
    let a = Rc::new(RefCell::new(Node { v: 1 }));
    let b = Rc::new(RefCell::new(Node { v: 1 }));
    let a2 = Rc::clone(&a);
    println!("{}", Rc::ptr_eq(&a, &a2));
    println!("{}", Rc::ptr_eq(&a, &b));
    let list = vec![Rc::clone(&b), Rc::clone(&a)];
    println!("{}", index_of(&list, &a));
    println!("{}", index_of(&list, &b));
    a2.borrow_mut().v = 5;
    println!("{}", a.borrow().v);
}
