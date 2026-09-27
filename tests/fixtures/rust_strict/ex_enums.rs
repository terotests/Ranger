// Enums with data, recursion through Box, and exhaustive `match`.
//
// A tiny expression language: build a tree, evaluate it, and print it back
// with the parentheses it needs.

#[derive(Debug, Clone)]
enum Expr {
    Num(i64),
    Neg(Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

use Expr::*;

fn eval(e: &Expr) -> Result<i64, String> {
    match e {
        Num(n) => Ok(*n),
        Neg(inner) => Ok(-eval(inner)?),
        Add(a, b) => Ok(eval(a)? + eval(b)?),
        Mul(a, b) => Ok(eval(a)? * eval(b)?),
        Div(a, b) => {
            let d = eval(b)?;
            if d == 0 {
                return Err(format!("division by zero in {}", show(e)));
            }
            Ok(eval(a)? / d)
        }
    }
}

fn show(e: &Expr) -> String {
    match e {
        Num(n) if *n < 0 => format!("({})", n),
        Num(n) => n.to_string(),
        Neg(inner) => format!("-{}", show(inner)),
        Add(a, b) => format!("({} + {})", show(a), show(b)),
        Mul(a, b) => format!("{} * {}", show(a), show(b)),
        Div(a, b) => format!("{} / {}", show(a), show(b)),
    }
}

fn num(n: i64) -> Box<Expr> {
    Box::new(Num(n))
}

fn main() {
    let exprs = vec![
        Add(num(2), num(3)),
        Mul(Box::new(Add(num(1), num(2))), num(7)),
        Neg(Box::new(Div(num(17), num(5)))),
        Div(num(1), Box::new(Add(num(2), num(-2)))),
    ];
    for e in exprs.iter() {
        match eval(e) {
            Ok(v) => println!("{} = {}", show(e), v),
            Err(msg) => println!("error: {}", msg),
        }
    }
    let depth = |e: &Expr| -> usize {
        match e {
            Num(_) => 1,
            _ => 2,
        }
    };
    println!("depths {} {}", depth(&exprs[0]), depth(&Num(4)));
}
