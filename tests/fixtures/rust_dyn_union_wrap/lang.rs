// A trait shared as Rc<RefCell<dyn EditorLanguage>>: Ranger writes it on the
// Rust target as an enum of its structs, so each place a struct value meets
// the trait type wraps it (field first value, typed let, assignment, argument
// passed by reference).
use std::cell::RefCell;
use std::rc::Rc;

pub trait EditorLanguage {
    fn id(&self) -> String {
        "text".to_string()
    }
    fn count(&mut self) -> i64 {
        0
    }
}

pub struct PlainText {}

impl PlainText {
    pub fn new() -> PlainText {
        PlainText {}
    }
}

impl EditorLanguage for PlainText {}

pub struct Js {
    pub n: i64,
}

impl Js {
    pub fn new() -> Js {
        Js { n: 0 }
    }
}

impl EditorLanguage for Js {
    fn id(&self) -> String {
        "js".to_string()
    }
    fn count(&mut self) -> i64 {
        self.n = self.n + 1;
        self.n
    }
}

pub struct Registry {
    pub plugins: Vec<Rc<RefCell<dyn EditorLanguage>>>,
    pub none: Rc<RefCell<dyn EditorLanguage>>,
    pub last: Rc<RefCell<dyn EditorLanguage>>,
}

impl Registry {
    pub fn new() -> Registry {
        let none: Rc<RefCell<dyn EditorLanguage>> = Rc::new(RefCell::new(PlainText::new()));
        Registry {
            plugins: Vec::new(),
            none: none.clone(),
            last: none,
        }
    }
    pub fn add(&mut self, lang: Rc<RefCell<dyn EditorLanguage>>) {
        self.last = lang.clone();
        self.plugins.push(lang);
    }
    pub fn add_js(&mut self) {
        let j: Rc<RefCell<dyn EditorLanguage>> = Rc::new(RefCell::new(Js::new()));
        self.add(j);
    }
    pub fn add_plain(&mut self) {
        self.add(Rc::new(RefCell::new(PlainText::new())));
    }
    pub fn reset_last(&mut self) {
        self.last = Rc::new(RefCell::new(PlainText::new()));
    }
    pub fn by_id(&self, id: &str) -> Rc<RefCell<dyn EditorLanguage>> {
        for p in self.plugins.iter() {
            if p.borrow().id() == id {
                return p.clone();
            }
        }
        self.none.clone()
    }
}
