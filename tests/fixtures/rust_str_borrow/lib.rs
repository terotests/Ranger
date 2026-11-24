// Borrowed strings on the targets that copy text (C++): `let s = <&str>`
// binds a reference, `fn f(&self) -> &str` returning self's own text hands
// it back by reference, and a string's UTF-8 bytes (`len`, `as_bytes()[i]`)
// are read without encoding the whole text each time (JavaScript).

pub struct Entry {
    pub text: String,
    pub hits: i64,
}

pub struct Store {
    pub items: Vec<Entry>,
    pub title: String,
}

impl Store {
    pub fn new() -> Store {
        Store { items: Vec::new(), title: String::from("störe😀") }
    }

    pub fn add(&mut self, t: &str) {
        self.items.push(Entry { text: t.to_string(), hits: 0 });
    }

    /// self's own text: by reference on C++
    pub fn text_of(&self, i: usize) -> &str {
        self.items[i].text.as_str()
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    /// a fresh string: stays by value
    pub fn upper_of(&self, i: usize) -> String {
        self.items[i].text.to_uppercase()
    }

    /// a borrow of a part: a new string on C++, so by value
    pub fn head_of(&self, i: usize) -> &str {
        let t = self.text_of(i);
        if t.len() > 3 && t.as_bytes()[0] < 128 && t.as_bytes()[1] < 128 && t.as_bytes()[2] < 128 {
            return &t[0..3];
        }
        t
    }
}

fn byte_sum(s: &str) -> i64 {
    let mut n: i64 = 0;
    let mut i: usize = 0;
    while i < s.len() {
        n = n + (s.as_bytes()[i] as i64);
        i += 1;
    }
    n
}

pub struct App {}

impl App {
    pub fn run() -> String {
        let mut st = Store::new();
        st.add("abc");
        st.add("äöå€");
        st.add("x😀y");
        let mut long = String::new();
        let mut k: i64 = 0;
        while k < 300 {
            long.push_str("ä😀b");
            k += 1;
        }
        st.add(&long);
        let mut out = String::new();
        let mut i: usize = 0;
        while i < st.items.len() {
            let t = st.text_of(i);
            let h = st.head_of(i);
            out.push_str(&format!("{}:{}:{}:{};", t.len(), byte_sum(t), h.len(), st.upper_of(i).len()));
            st.items[i].hits += 1;
            i += 1;
        }
        let t0 = st.text_of(0);
        out.push_str(t0);
        out.push_str(st.title());
        let ti = st.title();
        out.push_str(&format!("|{}|{}", ti.len(), byte_sum(ti)));
        out
    }
}
