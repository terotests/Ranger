// SPDX-License-Identifier: MIT
//
// `Map<K, V>`: a hash map that iterates in insertion order.
//
// Ranger's map is the target's own: an object / `Map` in JavaScript, a `dict`
// in Python, both of which iterate in insertion order. `std::collections::
// HashMap` iterates in a random order that changes from run to run, so a
// program printing its keys could not match the other targets (D8). This map
// keeps the order: a new key goes to the end, inserting an existing key keeps
// its place, removing a key keeps the order of the rest.
//
// The API is the subset of `HashMap`'s a strict module uses; Ranger lowers
// `Map` and `HashMap` the same way.

use std::borrow::Borrow;
use std::collections::HashMap;
use std::fmt;
use std::hash::Hash;
use std::ops::Index;

#[derive(Clone)]
pub struct Map<K, V> {
    entries: Vec<(K, V)>,
    index: HashMap<K, usize>,
}

impl<K: Eq + Hash + Clone, V> Map<K, V> {
    pub fn new() -> Self {
        Map { entries: Vec::new(), index: HashMap::new() }
    }

    pub fn with_capacity(n: usize) -> Self {
        Map { entries: Vec::with_capacity(n), index: HashMap::with_capacity(n) }
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn clear(&mut self) {
        self.entries.clear();
        self.index.clear();
    }

    /// Returns the old value when the key was present; the key keeps its place.
    pub fn insert(&mut self, k: K, v: V) -> Option<V> {
        if let Some(&i) = self.index.get(&k) {
            return Some(std::mem::replace(&mut self.entries[i].1, v));
        }
        self.index.insert(k.clone(), self.entries.len());
        self.entries.push((k, v));
        None
    }

    pub fn get<Q>(&self, k: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.index.get(k).map(|&i| &self.entries[i].1)
    }

    pub fn get_mut<Q>(&mut self, k: &Q) -> Option<&mut V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        match self.index.get(k) {
            Some(&i) => Some(&mut self.entries[i].1),
            None => None,
        }
    }

    pub fn contains_key<Q>(&self, k: &Q) -> bool
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.index.contains_key(k)
    }

    /// Removes the key; the others keep their order.
    pub fn remove<Q>(&mut self, k: &Q) -> Option<V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        let i = self.index.remove(k)?;
        let (_, v) = self.entries.remove(i);
        for (_, slot) in self.index.iter_mut() {
            if *slot > i {
                *slot -= 1;
            }
        }
        Some(v)
    }

    pub fn entry(&mut self, k: K) -> Entry<'_, K, V> {
        Entry { map: self, key: k }
    }

    pub fn keys(&self) -> impl Iterator<Item = &K> + '_ {
        self.entries.iter().map(|(k, _)| k)
    }

    pub fn values(&self) -> impl Iterator<Item = &V> + '_ {
        self.entries.iter().map(|(_, v)| v)
    }

    pub fn values_mut(&mut self) -> impl Iterator<Item = &mut V> + '_ {
        self.entries.iter_mut().map(|(_, v)| v)
    }

    pub fn iter(&self) -> impl Iterator<Item = (&K, &V)> + '_ {
        self.entries.iter().map(|(k, v)| (k, v))
    }

    pub fn iter_mut(&mut self) -> impl Iterator<Item = (&K, &mut V)> + '_ {
        self.entries.iter_mut().map(|(k, v)| (&*k, v))
    }
}

/// `map.entry(k).or_insert(v)` and friends.
pub struct Entry<'a, K, V> {
    map: &'a mut Map<K, V>,
    key: K,
}

impl<'a, K: Eq + Hash + Clone, V> Entry<'a, K, V> {
    pub fn or_insert(self, v: V) -> &'a mut V {
        self.or_insert_with(|| v)
    }

    pub fn or_insert_with<F: FnOnce() -> V>(self, f: F) -> &'a mut V {
        let i = match self.map.index.get(&self.key) {
            Some(&i) => i,
            None => {
                let i = self.map.entries.len();
                self.map.index.insert(self.key.clone(), i);
                self.map.entries.push((self.key, f()));
                i
            }
        };
        &mut self.map.entries[i].1
    }

    pub fn or_default(self) -> &'a mut V
    where
        V: Default,
    {
        self.or_insert_with(V::default)
    }

    pub fn and_modify<F: FnOnce(&mut V)>(self, f: F) -> Self {
        if let Some(&i) = self.map.index.get(&self.key) {
            f(&mut self.map.entries[i].1);
        }
        self
    }

    pub fn key(&self) -> &K {
        &self.key
    }
}

impl<K: Eq + Hash + Clone, V> Default for Map<K, V> {
    fn default() -> Self {
        Map::new()
    }
}

impl<K: fmt::Debug, V: fmt::Debug> fmt::Debug for Map<K, V> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_map().entries(self.entries.iter().map(|(k, v)| (k, v))).finish()
    }
}

impl<K: Eq + Hash + Clone, V: PartialEq> PartialEq for Map<K, V> {
    fn eq(&self, o: &Self) -> bool {
        self.len() == o.len() && self.iter().all(|(k, v)| o.get(k) == Some(v))
    }
}

impl<K, Q, V> Index<&Q> for Map<K, V>
where
    K: Eq + Hash + Clone + Borrow<Q>,
    Q: Hash + Eq + ?Sized,
{
    type Output = V;
    fn index(&self, k: &Q) -> &V {
        self.get(k).expect("key not found in Map")
    }
}

impl<K: Eq + Hash + Clone, V> FromIterator<(K, V)> for Map<K, V> {
    fn from_iter<I: IntoIterator<Item = (K, V)>>(it: I) -> Self {
        let mut m = Map::new();
        m.extend(it);
        m
    }
}

impl<K: Eq + Hash + Clone, V> Extend<(K, V)> for Map<K, V> {
    fn extend<I: IntoIterator<Item = (K, V)>>(&mut self, it: I) {
        for (k, v) in it {
            self.insert(k, v);
        }
    }
}

impl<K, V> IntoIterator for Map<K, V> {
    type Item = (K, V);
    type IntoIter = std::vec::IntoIter<(K, V)>;
    fn into_iter(self) -> Self::IntoIter {
        self.entries.into_iter()
    }
}

impl<'a, K, V> IntoIterator for &'a Map<K, V> {
    type Item = (&'a K, &'a V);
    type IntoIter = std::iter::Map<std::slice::Iter<'a, (K, V)>, fn(&'a (K, V)) -> (&'a K, &'a V)>;
    fn into_iter(self) -> Self::IntoIter {
        self.entries.iter().map(|(k, v)| (k, v))
    }
}

impl<'a, K, V> IntoIterator for &'a mut Map<K, V> {
    type Item = (&'a K, &'a mut V);
    type IntoIter = std::iter::Map<std::slice::IterMut<'a, (K, V)>, fn(&'a mut (K, V)) -> (&'a K, &'a mut V)>;
    fn into_iter(self) -> Self::IntoIter {
        self.entries.iter_mut().map(|(k, v)| (&*k, v))
    }
}

#[cfg(test)]
mod tests {
    use super::Map;

    #[test]
    fn keeps_insertion_order() {
        let mut m: Map<String, i64> = Map::new();
        for k in ["b", "d", "e", "a", "c", "f"] {
            m.insert(k.to_string(), 1);
        }
        m.insert("d".to_string(), 5);
        m.remove("e");
        *m.entry("z".to_string()).or_insert(0) += 2;
        let keys: Vec<&String> = m.keys().collect();
        assert_eq!(keys, ["b", "d", "a", "c", "f", "z"]);
        assert_eq!(m["d"], 5);
        assert_eq!(m.get("z"), Some(&2));
        assert_eq!(format!("{:?}", m), r#"{"b": 1, "d": 5, "a": 1, "c": 1, "f": 1, "z": 2}"#);
    }
}
