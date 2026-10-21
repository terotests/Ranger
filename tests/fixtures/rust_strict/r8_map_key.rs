// R8: `get`, `contains_key` and `remove` borrow their key, so a `&String`
// loop binding can be used again after the lookup.
use std::collections::HashMap;

fn intern(src: &Vec<String>, table: &mut HashMap<String, i64>) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    for l in src {
        match table.get(l) {
            Some(id) => out.push(*id),
            None => {
                let id = table.len() as i64;
                table.insert(l.clone(), id);
                out.push(id);
            }
        }
        if table.contains_key(l) && l.as_bytes().len() > 3 {
            out.push(-1);
        }
    }
    out
}

fn main() {
    let words: Vec<String> = vec![String::from("a"), String::from("long"), String::from("a"), String::from("b")];
    let mut t: HashMap<String, i64> = HashMap::new();
    println!("{:?}", intern(&words, &mut t));
    let k = String::from("a");
    t.remove(&k);
    println!("{} {}", t.len(), k);
}
