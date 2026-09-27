// SPDX-License-Identifier: MIT
//
// JSON for `#[ranger::serialize]` structs (PLAN_RUST_SYNTAX.md, stage R7).
//
// The attribute writes `to_json` / `from_json` for a struct with these
// traits. Ranger writes the same two methods for its other targets, with
// lib/rust/RsJson.rgr as the parser, and both sides produce the same text and
// the same error messages: compact output (`{"a":1,"b":[true]}`), floats as
// Rust's `{}` prints them, positions counted in characters.

/// A parsed JSON value. Object members keep their order; the first of two
/// equal keys is the one a lookup finds.
#[derive(Clone, Debug, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    /// the number's text, so an integer is read exactly
    Num(String),
    Str(String),
    Arr(Vec<Value>),
    Obj(Vec<(String, Value)>),
}

impl Value {
    pub fn field(&self, key: &str) -> Option<&Value> {
        match self {
            Value::Obj(members) => members.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }
}

pub trait ToJson {
    fn to_json(&self) -> String;
}

pub trait FromJson: Sized {
    fn from_json_value(v: &Value) -> Result<Self, String>;
}

/// A JSON string literal for `s`.
pub fn quote(s: &str) -> String {
    let mut o = String::from("\"");
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            '\n' => o.push_str("\\n"),
            '\r' => o.push_str("\\r"),
            '\t' => o.push_str("\\t"),
            c if (c as u32) < 0x20 => o.push_str(&format!("\\u{:04x}", c as u32)),
            c => o.push(c),
        }
    }
    o.push('"');
    o
}

impl ToJson for i64 {
    fn to_json(&self) -> String {
        self.to_string()
    }
}

impl ToJson for f64 {
    fn to_json(&self) -> String {
        if self.is_finite() {
            format!("{}", self)
        } else {
            String::from("null")
        }
    }
}

impl ToJson for bool {
    fn to_json(&self) -> String {
        if *self { String::from("true") } else { String::from("false") }
    }
}

impl ToJson for String {
    fn to_json(&self) -> String {
        quote(self)
    }
}

impl<T: ToJson> ToJson for Vec<T> {
    fn to_json(&self) -> String {
        let parts: Vec<String> = self.iter().map(|x| x.to_json()).collect();
        format!("[{}]", parts.join(","))
    }
}

impl<T: ToJson> ToJson for Option<T> {
    fn to_json(&self) -> String {
        match self {
            Some(x) => x.to_json(),
            None => String::from("null"),
        }
    }
}

impl FromJson for i64 {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Num(t) if !t.contains('.') && !t.contains('e') && !t.contains('E') => {
                t.parse::<i64>().map_err(|_| String::from("expected an integer"))
            }
            _ => Err(String::from("expected an integer")),
        }
    }
}

impl FromJson for f64 {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Num(t) => t.parse::<f64>().map_err(|_| String::from("expected a number")),
            _ => Err(String::from("expected a number")),
        }
    }
}

impl FromJson for bool {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Bool(b) => Ok(*b),
            _ => Err(String::from("expected a boolean")),
        }
    }
}

impl FromJson for String {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Str(s) => Ok(s.clone()),
            _ => Err(String::from("expected a string")),
        }
    }
}

impl<T: FromJson> FromJson for Vec<T> {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Arr(items) => {
                let mut out = Vec::new();
                for (i, it) in items.iter().enumerate() {
                    out.push(T::from_json_value(it).map_err(|e| format!("item {}: {}", i, e))?);
                }
                Ok(out)
            }
            _ => Err(String::from("expected an array")),
        }
    }
}

impl<T: FromJson> FromJson for Option<T> {
    fn from_json_value(v: &Value) -> Result<Self, String> {
        match v {
            Value::Null => Ok(None),
            _ => T::from_json_value(v).map(Some),
        }
    }
}

/// A struct field of an object: the key must be there.
pub fn field<T: FromJson>(v: &Value, key: &str) -> Result<T, String> {
    match v.field(key) {
        Some(f) => T::from_json_value(f).map_err(|e| format!("field `{}`: {}", key, e)),
        None => Err(format!("missing field `{}`", key)),
    }
}

/// The object a struct is read from.
pub fn object(v: &Value) -> Result<(), String> {
    match v {
        Value::Obj(_) => Ok(()),
        _ => Err(String::from("expected an object")),
    }
}

pub fn parse(text: &str) -> Result<Value, String> {
    let mut p = Parser { s: text.chars().collect(), pos: 0 };
    p.ws();
    let v = p.value()?;
    p.ws();
    if p.pos < p.s.len() {
        return Err(p.fail());
    }
    Ok(v)
}

struct Parser {
    s: Vec<char>,
    pos: usize,
}

impl Parser {
    fn fail(&self) -> String {
        format!("invalid JSON at {}", self.pos)
    }

    fn peek(&self) -> char {
        if self.pos < self.s.len() { self.s[self.pos] } else { '\0' }
    }

    fn ws(&mut self) {
        while self.pos < self.s.len() && matches!(self.s[self.pos], ' ' | '\t' | '\n' | '\r') {
            self.pos += 1;
        }
    }

    fn word(&mut self, w: &str) -> bool {
        let cs: Vec<char> = w.chars().collect();
        if self.pos + cs.len() <= self.s.len() && self.s[self.pos..self.pos + cs.len()] == cs[..] {
            self.pos += cs.len();
            return true;
        }
        false
    }

    fn value(&mut self) -> Result<Value, String> {
        let c = self.peek();
        if c == '{' {
            return self.object();
        }
        if c == '[' {
            return self.array();
        }
        if c == '"' {
            return self.string().map(Value::Str);
        }
        if self.word("true") {
            return Ok(Value::Bool(true));
        }
        if self.word("false") {
            return Ok(Value::Bool(false));
        }
        if self.word("null") {
            return Ok(Value::Null);
        }
        if c == '-' || c.is_ascii_digit() {
            return self.number();
        }
        Err(self.fail())
    }

    fn digits(&mut self) -> bool {
        let start = self.pos;
        while self.pos < self.s.len() && self.s[self.pos].is_ascii_digit() {
            self.pos += 1;
        }
        self.pos > start
    }

    fn number(&mut self) -> Result<Value, String> {
        let start = self.pos;
        if self.peek() == '-' {
            self.pos += 1;
        }
        if !self.digits() {
            return Err(self.fail());
        }
        if self.peek() == '.' {
            self.pos += 1;
            if !self.digits() {
                return Err(self.fail());
            }
        }
        if self.peek() == 'e' || self.peek() == 'E' {
            self.pos += 1;
            if self.peek() == '+' || self.peek() == '-' {
                self.pos += 1;
            }
            if !self.digits() {
                return Err(self.fail());
            }
        }
        Ok(Value::Num(self.s[start..self.pos].iter().collect()))
    }

    fn hex4(&mut self) -> Result<u32, String> {
        let mut v: u32 = 0;
        for _ in 0..4 {
            let d = self.peek().to_digit(16).ok_or_else(|| self.fail())?;
            v = v * 16 + d;
            self.pos += 1;
        }
        Ok(v)
    }

    fn string(&mut self) -> Result<String, String> {
        self.pos += 1;
        let mut o = String::new();
        loop {
            if self.pos >= self.s.len() {
                return Err(self.fail());
            }
            let c = self.s[self.pos];
            if c == '"' {
                self.pos += 1;
                return Ok(o);
            }
            if (c as u32) < 0x20 {
                return Err(self.fail());
            }
            if c != '\\' {
                o.push(c);
                self.pos += 1;
                continue;
            }
            self.pos += 1;
            let e = self.peek();
            self.pos += 1;
            match e {
                '"' => o.push('"'),
                '\\' => o.push('\\'),
                '/' => o.push('/'),
                'b' => o.push('\u{8}'),
                'f' => o.push('\u{c}'),
                'n' => o.push('\n'),
                'r' => o.push('\r'),
                't' => o.push('\t'),
                'u' => {
                    let mut code = self.hex4()?;
                    if (0xD800..0xDC00).contains(&code) && self.word("\\u") {
                        let low = self.hex4()?;
                        if !(0xDC00..0xE000).contains(&low) {
                            return Err(self.fail());
                        }
                        code = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00);
                    }
                    match char::from_u32(code) {
                        Some(ch) => o.push(ch),
                        None => return Err(self.fail()),
                    }
                }
                _ => {
                    self.pos -= 1;
                    return Err(self.fail());
                }
            }
        }
    }

    fn array(&mut self) -> Result<Value, String> {
        self.pos += 1;
        let mut items = Vec::new();
        self.ws();
        if self.peek() == ']' {
            self.pos += 1;
            return Ok(Value::Arr(items));
        }
        loop {
            self.ws();
            items.push(self.value()?);
            self.ws();
            if self.peek() == ',' {
                self.pos += 1;
                continue;
            }
            if self.peek() == ']' {
                self.pos += 1;
                return Ok(Value::Arr(items));
            }
            return Err(self.fail());
        }
    }

    fn object(&mut self) -> Result<Value, String> {
        self.pos += 1;
        let mut members = Vec::new();
        self.ws();
        if self.peek() == '}' {
            self.pos += 1;
            return Ok(Value::Obj(members));
        }
        loop {
            self.ws();
            if self.peek() != '"' {
                return Err(self.fail());
            }
            let k = self.string()?;
            self.ws();
            if self.peek() != ':' {
                return Err(self.fail());
            }
            self.pos += 1;
            self.ws();
            let v = self.value()?;
            members.push((k, v));
            self.ws();
            if self.peek() == ',' {
                self.pos += 1;
                continue;
            }
            if self.peek() == '}' {
                self.pos += 1;
                return Ok(Value::Obj(members));
            }
            return Err(self.fail());
        }
    }
}
