// R7: a back reference held without ownership. `Weak<T>` in the type is
// `@(weak)` in Ranger; `#[ranger::weak]` marks a field whose type does not
// say so.
use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[ranger::fields]
struct Node {
    name: String,
    parent: Option<Weak<RefCell<Node>>>,
    #[ranger::weak]
    owner: Option<Rc<RefCell<Tree>>>,
    children: Vec<Rc<RefCell<Node>>>,
}

struct Tree {
    title: String,
    size: int,
}

impl Node {
    fn new(name: &str) -> Rc<RefCell<Node>> {
        Rc::new(RefCell::new(Node {
            name: name.to_string(),
            parent: None,
            owner: None,
            children: vec![],
        }))
    }
}

fn add_child(parent: &Rc<RefCell<Node>>, child: Rc<RefCell<Node>>) {
    child.borrow_mut().parent = Some(Rc::downgrade(parent));
    parent.borrow_mut().children.push(child);
}

fn path_of(node: &Rc<RefCell<Node>>) -> String {
    let n = node.borrow();
    match &n.parent {
        Some(w) => match w.upgrade() {
            Some(p) => format!("{}/{}", path_of(&p), n.name),
            None => n.name.clone(),
        },
        None => n.name.clone(),
    }
}

fn main() {
    let tree = Rc::new(RefCell::new(Tree { title: String::from("files"), size: 0 }));
    let root = Node::new("root");
    let docs = Node::new("docs");
    let readme = Node::new("readme");
    add_child(&root, Rc::clone(&docs));
    add_child(&docs, Rc::clone(&readme));
    for n in [&root, &docs, &readme] {
        n.borrow_mut().owner = Some(Rc::clone(&tree));
        tree.borrow_mut().size += 1;
    }
    println!("{}", path_of(&readme));
    println!("children of root: {}", root.borrow().children.len());
    let first = Rc::clone(&root.borrow().children[0]);
    println!("first child {} of {}", first.borrow().name, path_of(&first));
    if let Some(o) = &readme.borrow().owner {
        println!("owner {} size {}", o.borrow().title, o.borrow().size);
    }
    let has_parent = root.borrow().parent.is_some();
    println!("root has parent: {}", has_parent);
}
