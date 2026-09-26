// R2: traits with default methods, dyn dispatch, generic functions and structs.
trait Animal {
    fn name(&self) -> String;
    fn sound(&self) -> String;
    fn speak(&self) -> String {
        format!("{} says {}", self.name(), self.sound())
    }
}

struct Dog {
    name: String,
}

struct Cat {
    lives: u32,
}

impl Animal for Dog {
    fn name(&self) -> String {
        self.name.clone()
    }
    fn sound(&self) -> String {
        String::from("woof")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        format!("cat{}", self.lives)
    }
    fn sound(&self) -> String {
        String::from("meow")
    }
    fn speak(&self) -> String {
        String::from("the cat ignores you")
    }
}

fn chorus(animals: &Vec<Box<dyn Animal>>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for a in animals {
        out.push(a.speak());
    }
    out
}

fn describe(a: &impl Animal) -> String {
    format!("<{}>", a.name())
}

fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut best = items[0];
    for &x in items {
        if x > best {
            best = x;
        }
    }
    best
}

fn swap_pair<A: Clone, B: Clone>(p: &(A, B)) -> (B, A) {
    (p.1.clone(), p.0.clone())
}

struct Stack<T> {
    items: Vec<T>,
}

impl<T: Clone> Stack<T> {
    fn new() -> Self {
        Stack { items: Vec::new() }
    }
    fn push(&mut self, x: T) {
        self.items.push(x);
    }
    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }
    fn len(&self) -> usize {
        self.items.len()
    }
}

fn main() {
    let zoo: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog { name: String::from("rex") }),
        Box::new(Cat { lives: 9 }),
    ];
    for line in chorus(&zoo) {
        println!("{}", line);
    }
    println!("{}", describe(&Dog { name: String::from("fido") }));
    println!("{}", largest(&[3, 9, 2, 7]));
    println!("{}", largest(&[1.5, -2.0, 0.25]));
    let (b, a) = swap_pair(&(1, String::from("one")));
    println!("{} {}", b, a);
    let mut s: Stack<i64> = Stack::new();
    s.push(1);
    s.push(2);
    s.push(3);
    println!("len {}", s.len());
    while let Some(top) = s.pop() {
        print!("{} ", top);
    }
    println!();
    let mut words: Stack<String> = Stack::new();
    words.push(String::from("a"));
    words.push(String::from("b"));
    println!("{:?} {}", words.pop(), words.len());
}
