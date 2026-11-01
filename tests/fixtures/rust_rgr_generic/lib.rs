mod rgr;
use rgr::*;
use std::rc::Rc;
use std::cell::RefCell;
pub struct Snap {
    pub name: String,
}
impl Snap {
    pub fn new() -> Snap {
        Snap { name: String::new() }
    }
}
pub struct Ed {
    pub history: Rc<RefCell<Hist<Rc<RefCell<Snap>>>>>,
}
impl Ed {
    pub fn new() -> Ed {
        Ed { history: Rc::new(RefCell::new(Hist::new())) }
    }
    pub fn save(&mut self, n: &String) -> i64 {
        let s: Rc<RefCell<Snap>> = Rc::new(RefCell::new(Snap::new()));
        s.borrow_mut().name = n.clone();
        self.history.borrow_mut().record(s.clone());
        return self.history.borrow().depth();
    }
    pub fn top(&self) -> String {
        let s: Rc<RefCell<Snap>> = self.history.borrow().peek();
        return s.borrow().name.clone();
    }
    // the associated-function spelling of the same call
    pub fn top_via(&self) -> String {
        let s: Rc<RefCell<Snap>> = Hist::peek(&self.history);
        return s.borrow().name.clone();
    }
}
