// Iterators, closures and collections.
//
// Count words, rank them, and group them by length -- iterator adaptors
// chained into loops on every target.

use std::collections::HashMap;
use std::collections::BTreeMap;

fn main() {
    let text = "the quick brown fox jumps over the lazy dog the fox";

    let mut counts: HashMap<String, i64> = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word.to_string()).or_insert(0) += 1;
    }

    let mut ranked: Vec<(String, i64)> = counts.into_iter().collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    for (word, n) in ranked.iter().take(3) {
        println!("{:>6} x{}", word, n);
    }

    let mut by_len: BTreeMap<usize, Vec<String>> = BTreeMap::new();
    for word in text.split_whitespace() {
        let list = by_len.entry(word.chars().count()).or_insert_with(Vec::new);
        if !list.contains(&word.to_string()) {
            list.push(word.to_string());
        }
    }
    for (len, words) in by_len.iter() {
        println!("{}: {}", len, words.join(", "));
    }

    let squares: Vec<i64> = (1..=10).filter(|n| n % 3 != 0).map(|n| n * n).collect();
    println!("squares {:?}", squares);
    let total: i64 = squares.iter().sum();
    let evens = squares.iter().filter(|&&n| n % 2 == 0).count();
    println!("sum {} evens {} max {:?}", total, evens, squares.iter().max());

    let threshold = 20;
    let big: Vec<String> = squares
        .iter()
        .filter(|&&n| n > threshold)
        .map(|n| format!("<{}>", n))
        .collect();
    println!("{}", big.join(""));
    let product = (1..=5).fold(1, |acc, n| acc * n);
    println!("5! = {}", product);
    let any_big = squares.iter().any(|&n| n > 90);
    let all_pos = squares.iter().all(|&n| n > 0);
    println!("any > 90: {}, all > 0: {}", any_big, all_pos);
}
