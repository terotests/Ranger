// `==` and `!=` on Vecs compare the elements, also inside derived PartialEq
// and enum payloads; a method named `join` still reaches the join operator.

#[derive(Clone, PartialEq)]
struct Ids {
    items: Vec<i64>,
    names: Vec<String>,
}

impl Ids {
    fn join(&self, sep: &str) -> String {
        self.names.join(sep)
    }
}

#[derive(Clone, PartialEq)]
enum Val {
    One(i64),
    Many(Vec<i64>),
}

fn main() {
    let a: Vec<i64> = vec![1, 2, 3];
    let b: Vec<i64> = vec![1, 2, 3];
    let c: Vec<i64> = vec![1, 2];
    println!("{} {} {}", a == b, a == c, a != c);
    let x = Ids { items: vec![4, 5], names: vec!["p".to_string(), "q".to_string()] };
    let y = x.clone();
    let mut z = x.clone();
    z.items.push(6);
    println!("{} {}", x == y, x == z);
    println!("{}", x.join("+"));
    let m1 = Val::Many(vec![7, 8]);
    let m2 = Val::Many(vec![7, 8]);
    let m3 = Val::One(7);
    println!("{} {}", m1 == m2, m1 == m3);
    let rows: Vec<Vec<i64>> = vec![vec![1], vec![2, 3]];
    let same: Vec<Vec<i64>> = vec![vec![1], vec![2, 3]];
    println!("{}", rows == same);
}
