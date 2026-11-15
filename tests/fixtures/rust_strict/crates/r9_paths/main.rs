// `#[path]` modules, `use super::m;` module imports and two structs of the
// same name in different modules
mod inner;
mod json;
#[path = "other/lib_parser.rs"]
mod lib_parser;

use json::Parser;

#[derive(Debug)]
pub struct Number {
    pub value: i64,
}

fn main() {
    println!("{}", inner::run());
    let mut p = Parser::new("[1,2,3]");
    println!("{}", p.count());
    let mut q = lib_parser::Parser::new(vec![3, 4]);
    println!("{}", q.total());
    println!("{:?}", lib_parser::make());
    let n = Number { value: 7 };
    println!("{:?} {}", n, n.value);
}
