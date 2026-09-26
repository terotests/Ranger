// R2: HashMap / BTreeMap / HashSet with String keys, the entry API.
use std::collections::{BTreeMap, HashMap, HashSet};

fn main() {
    let text = "the cat and the dog and the bird";
    let mut counts: HashMap<String, i64> = HashMap::new();
    for w in text.split(' ') {
        *counts.entry(w.to_string()).or_insert(0) += 1;
    }
    let mut keys: Vec<String> = counts.keys().cloned().collect();
    keys.sort();
    for k in &keys {
        println!("{} {}", k, counts[k]);
    }
    println!("has cat {} has cow {}", counts.contains_key("cat"), counts.contains_key("cow"));
    if let Some(n) = counts.get("the") {
        println!("the x{}", n);
    }
    counts.remove("the");
    println!("len {}", counts.len());

    let mut sorted: BTreeMap<String, Vec<i64>> = BTreeMap::new();
    for (i, w) in text.split(' ').enumerate() {
        sorted.entry(w.to_string()).or_insert_with(Vec::new).push(i as i64);
    }
    for (w, positions) in &sorted {
        println!("{} {:?}", w, positions);
    }

    let mut seen: HashSet<String> = HashSet::new();
    let mut order: Vec<String> = Vec::new();
    for w in text.split(' ') {
        if seen.insert(w.to_string()) {
            order.push(w.to_string());
        }
    }
    println!("{}", order.join("|"));
    println!("{}", seen.contains("dog"));
}
