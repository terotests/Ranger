use std::collections::HashMap;

fn main() {
    // a map's get / contains_key / remove borrow the key: it stays usable
    let mut m: HashMap<String, i64> = HashMap::new();
    let keys: Vec<String> = vec!["a".to_string(), "b".to_string(), "c".to_string()];
    for (i, k) in keys.iter().enumerate() {
        m.insert(k.clone(), i as i64);
    }
    let mut gone: Vec<String> = Vec::new();
    for k in keys.iter() {
        if *m.get(k).unwrap_or(&0) > 0 {
            gone.push(k.clone());
        }
    }
    for k in gone.iter() {
        let v = m.get(k).cloned();
        if m.contains_key(k) {
            m.remove(k);
        }
        println!("{} {:?} {}", k, v, m.contains_key(k));
    }
    println!("{}", m.len());
    // ASCII case on a String: only A-Z / a-z change
    let s = String::from("Arial-Bold Ünï 7");
    println!("{}", s.to_ascii_lowercase());
    println!("{}", s.to_ascii_uppercase());
    println!("{}", s.to_ascii_lowercase().ends_with("-bold ünï 7"));
}
