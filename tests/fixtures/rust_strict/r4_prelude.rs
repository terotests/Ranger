// R4: a strict module on the `ranger` prelude: the Ranger type names, the
// insertion-ordered Map, and the operators as functions.
use ranger::prelude::*;

#[derive(Clone, Debug)]
struct Stock {
    name: string,
    count: int,
    price: double,
}

fn total(items: &Vec<Stock>) -> double {
    let mut sum: double = 0.0;
    for s in items.iter() {
        sum += s.count as double * s.price;
    }
    sum
}

fn main() {
    let items: Vec<Stock> = vec![
        Stock { name: "pear".to_string(), count: 3, price: 0.5 },
        Stock { name: "apple".to_string(), count: 10, price: 0.25 },
        Stock { name: "fig".to_string(), count: 1, price: 2.0 },
    ];
    println!("total {}", total(&items));

    // insertion order, as JavaScript and Python keep it
    let mut m: Map<string, int> = Map::new();
    for k in ["b", "d", "e", "a", "c", "f"] {
        m.insert(k.to_string(), 1);
    }
    m.insert("d".to_string(), 5);
    m.remove("e");
    *m.entry("z".to_string()).or_insert(0) += 2;
    let mut line = String::new();
    for (k, v) in m.iter() {
        line.push_str(&format!("{}={} ", k, v));
    }
    println!("{}", line.trim_end());
    println!("len {} has a {} has e {}", m.len(), m.contains_key("a"), m.contains_key("e"));
    let keys: Vec<string> = m.keys().cloned().collect();
    println!("keys {:?}", keys);

    // operators from the prelude
    let flag: boolean = sqrt(16.0) == 4.0;
    println!("sqrt {} {}", sqrt(2.0), flag);
    println!("floor {} ceil {}", floor(2.7), ceil(2.1));
    println!("upper {} lower {}", to_uppercase("aé"), to_lowercase("ÅB"));
    println!("chars {}", char_length("aé😀b"));
    println!("atan2 {:.4}", atan2(1.0, 1.0));
    println!("trim [{}]", trim("  x y  "));
}
