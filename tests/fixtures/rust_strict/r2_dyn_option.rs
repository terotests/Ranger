// R2: a `dyn Trait` method returning `Option`, called through a struct that
// owns a `Box<dyn Trait>`.
use std::collections::BTreeMap;

trait Store {
    fn lookup(&self, key: &str) -> Option<String>;
    fn store(&mut self, key: &str, value: &str) -> i64;
}

struct MapStore {
    items: BTreeMap<String, String>,
}

impl Store for MapStore {
    fn lookup(&self, key: &str) -> Option<String> {
        match self.items.get(key) {
            Some(v) => Some(v.clone()),
            None => None,
        }
    }
    fn store(&mut self, key: &str, value: &str) -> i64 {
        self.items.insert(key.to_string(), value.to_string());
        self.items.len() as i64
    }
}

struct Cache {
    inner: Box<dyn Store>,
}

impl Cache {
    fn describe(&self, key: &str) -> String {
        match self.inner.lookup(key) {
            Some(v) => format!("{}={}", key, v),
            None => format!("{} missing", key),
        }
    }
}

fn main() {
    let mut c = Cache { inner: Box::new(MapStore { items: BTreeMap::new() }) };
    println!("{}", c.inner.store("a", "1"));
    println!("{}", c.inner.store("b", "2"));
    println!("{}", c.describe("a"));
    println!("{}", c.describe("z"));
}
