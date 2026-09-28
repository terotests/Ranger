// SPDX-License-Identifier: AGPL-3.0-or-later
//! Tokens of a script. The whole source is read at once; whether a `/`
//! starts a regular expression or divides is decided from the token before
//! it, as a parser would.

use ranger::prelude::*;

pub const T_EOF: int = 0;
pub const T_NUM: int = 1;
pub const T_STR: int = 2;
pub const T_IDENT: int = 3;
pub const T_PUNCT: int = 4;
pub const T_TEMPLATE: int = 5;
pub const T_REGEX: int = 6;
pub const T_PRIVATE: int = 7;

pub struct Tok {
    pub kind: int,
    pub text: String,
    pub num: double,
    /// a line break before this token (automatic semicolons, `return`)
    pub nl: bool,
    pub line: int,
    /// a template: the cooked strings around the substitutions
    pub parts: Vec<String>,
    /// a template: the source text of each `${…}`
    pub exprs: Vec<String>,
    /// a template: the raw strings (escapes as written)
    pub raws: Vec<String>,
    /// a regular expression: its flags
    pub flags: String,
    /// an identifier written with an escape, or a string with an octal
    /// escape: not a keyword
    pub escaped: bool,
    /// where the token is in the source (characters): [start, end)
    pub start: int,
    pub end: int,
}

impl Tok {
    fn new(kind: int, line: int, nl: bool) -> Tok {
        Tok {
            kind: kind,
            text: String::new(),
            num: 0.0,
            nl: nl,
            line: line,
            parts: Vec::new(),
            exprs: Vec::new(),
            raws: Vec::new(),
            flags: String::new(),
            escaped: false,
            start: -1,
            end: -1,
        }
    }
}

pub struct Lexer {
    src: Vec<char>,
    pos: int,
    line: int,
    pub error: String,
}

fn is_id_start(c: char) -> bool {
    c.is_alphabetic() || c == '_' || c == '$'
}

fn is_id_part(c: char) -> bool {
    c.is_alphanumeric() || c == '_' || c == '$' || c == '\u{200c}' || c == '\u{200d}'
}

fn hex_val(c: char) -> int {
    if c >= '0' && c <= '9' {
        return (c as int) - 48;
    }
    if c >= 'a' && c <= 'f' {
        return (c as int) - 87;
    }
    if c >= 'A' && c <= 'F' {
        return (c as int) - 55;
    }
    -1
}

/// Punctuators, longest first so the scan takes the longest match.
fn puncts() -> Vec<String> {
    let list = vec![
        ">>>=", "...", "===", "!==", "**=", "<<=", ">>=", ">>>", "&&=", "||=", "??=", "=>", "==", "!=", "<=", ">=",
        "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>", "**", "{", "}",
        "(", ")", "[", "]", ";", ",", "<", ">", "+", "-", "*", "/", "%", "&", "|", "^", "!", "~", "?", ":", "=", ".",
        "@", "#",
    ];
    let mut out: Vec<String> = Vec::new();
    for p in list {
        out.push(String::from(p));
    }
    out
}

/// Keywords after which a `/` starts a regular expression.
fn regex_after_word(w: &str) -> bool {
    w == "return"
        || w == "typeof"
        || w == "instanceof"
        || w == "in"
        || w == "of"
        || w == "new"
        || w == "delete"
        || w == "void"
        || w == "throw"
        || w == "case"
        || w == "do"
        || w == "else"
        || w == "yield"
        || w == "await"
}

pub fn push_code_point(out: &mut String, cp: int) {
    match char::from_u32(cp as u32) {
        Some(c) => out.push(c),
        None => out.push('\u{fffd}'),
    }
}

impl Lexer {
    pub fn new(src: &str) -> Lexer {
        Lexer { src: src.chars().collect::<Vec<char>>(), pos: 0, line: 1, error: String::new() }
    }

    fn at(&self, i: int) -> char {
        if i < 0 || i >= self.src.len() as int {
            return '\0';
        }
        self.src[i as usize]
    }

    fn cur(&self) -> char {
        self.at(self.pos)
    }

    fn fail(&mut self, msg: &str) {
        if self.error.is_empty() {
            self.error = format!("SyntaxError: {} (line {})", msg, self.line);
        }
    }

    /// Skips spaces and comments; true when a line break was passed.
    fn skip_space(&mut self) -> bool {
        let mut nl = false;
        let n = self.src.len() as int;
        while self.pos < n {
            let c = self.cur();
            if c == '\n' || c == '\r' || c == '\u{2028}' || c == '\u{2029}' {
                nl = true;
                if c == '\n' {
                    self.line += 1;
                }
                self.pos += 1;
            } else if c == ' ' || c == '\t' || c == '\u{b}' || c == '\u{c}' || c == '\u{a0}' || c == '\u{feff}' || (c as int > 127 && c.is_whitespace()) {
                self.pos += 1;
            } else if c == '/' && self.at(self.pos + 1) == '/' {
                while self.pos < n && self.cur() != '\n' && self.cur() != '\r' {
                    self.pos += 1;
                }
            } else if c == '/' && self.at(self.pos + 1) == '*' {
                self.pos += 2;
                let mut closed = false;
                while self.pos < n {
                    if self.cur() == '*' && self.at(self.pos + 1) == '/' {
                        self.pos += 2;
                        closed = true;
                        break;
                    }
                    if self.cur() == '\n' {
                        nl = true;
                        self.line += 1;
                    }
                    self.pos += 1;
                }
                if !closed {
                    self.fail("unterminated comment");
                }
            } else if c == '<' && self.at(self.pos + 1) == '!' && self.at(self.pos + 2) == '-' && self.at(self.pos + 3) == '-' {
                // an HTML-like comment, as a script allows
                while self.pos < n && self.cur() != '\n' {
                    self.pos += 1;
                }
            } else {
                break;
            }
        }
        nl
    }

    pub fn tokenize(&mut self) -> Vec<Tok> {
        let mut toks: Vec<Tok> = Vec::new();
        let ps = puncts();
        let n = self.src.len() as int;
        // what the previous token allows a `/` to be
        let mut regex_ok = true;
        let mut start: int = 0;
        loop {
            if !toks.is_empty() && toks[toks.len() - 1].end < 0 {
                let k = toks.len() - 1;
                toks[k].start = start;
                toks[k].end = self.pos;
            }
            let nl = self.skip_space();
            start = self.pos;
            if !self.error.is_empty() {
                break;
            }
            if self.pos >= n {
                toks.push(Tok::new(T_EOF, self.line, true));
                break;
            }
            let c = self.cur();
            let line = self.line;
            if is_id_start(c) || c == '\\' {
                let mut t = Tok::new(T_IDENT, line, nl);
                t.text = self.read_ident(&mut t.escaped);
                regex_ok = regex_after_word(t.text.as_str()) && !t.escaped;
                toks.push(t);
                continue;
            }
            if c == '#' && (is_id_start(self.at(self.pos + 1)) || self.at(self.pos + 1) == '\\') {
                self.pos += 1;
                let mut t = Tok::new(T_PRIVATE, line, nl);
                t.text = self.read_ident(&mut t.escaped);
                regex_ok = false;
                toks.push(t);
                continue;
            }
            if (c >= '0' && c <= '9') || (c == '.' && self.at(self.pos + 1) >= '0' && self.at(self.pos + 1) <= '9') {
                let mut t = Tok::new(T_NUM, line, nl);
                t.num = self.read_number(&mut t.text);
                regex_ok = false;
                toks.push(t);
                continue;
            }
            if c == '"' || c == '\'' {
                let mut t = Tok::new(T_STR, line, nl);
                t.text = self.read_string(c, &mut t.escaped);
                regex_ok = false;
                toks.push(t);
                continue;
            }
            if c == '`' {
                let mut t = Tok::new(T_TEMPLATE, line, nl);
                self.read_template(&mut t);
                regex_ok = false;
                toks.push(t);
                continue;
            }
            if c == '/' && regex_ok {
                let mut t = Tok::new(T_REGEX, line, nl);
                self.read_regex(&mut t);
                regex_ok = false;
                toks.push(t);
                continue;
            }
            let mut found = false;
            for p in ps.iter() {
                let pc = p.chars().collect::<Vec<char>>();
                let mut ok = true;
                let mut k: int = 0;
                while k < pc.len() as int {
                    if self.at(self.pos + k) != pc[k as usize] {
                        ok = false;
                        break;
                    }
                    k += 1;
                }
                // `?.` followed by a digit is `?` and a number
                if ok && p.as_str() == "?." {
                    let d = self.at(self.pos + 2);
                    if d >= '0' && d <= '9' {
                        ok = false;
                    }
                }
                if ok {
                    let mut t = Tok::new(T_PUNCT, line, nl);
                    t.text = p.clone();
                    self.pos += pc.len() as int;
                    let s = p.as_str();
                    regex_ok = !(s == ")" || s == "]" || s == "}" || s == "++" || s == "--");
                    if s == "}" {
                        regex_ok = true;
                    }
                    toks.push(t);
                    found = true;
                    break;
                }
            }
            if !found {
                self.fail(format!("unexpected character '{}'", c).as_str());
                break;
            }
        }
        toks
    }

    fn read_unicode_escape(&mut self) -> int {
        // after `\u`
        if self.cur() == '{' {
            self.pos += 1;
            let mut v: int = 0;
            let mut digits = 0;
            while self.cur() != '}' {
                let h = hex_val(self.cur());
                if h < 0 {
                    self.fail("bad unicode escape");
                    return 0;
                }
                v = v * 16 + h;
                digits += 1;
                self.pos += 1;
            }
            self.pos += 1;
            if digits == 0 || v > 0x10ffff {
                self.fail("bad unicode escape");
            }
            return v;
        }
        let mut v: int = 0;
        let mut k = 0;
        while k < 4 {
            let h = hex_val(self.cur());
            if h < 0 {
                self.fail("bad unicode escape");
                return 0;
            }
            v = v * 16 + h;
            self.pos += 1;
            k += 1;
        }
        v
    }

    fn read_ident(&mut self, escaped: &mut bool) -> String {
        let mut s = String::new();
        loop {
            let c = self.cur();
            if c == '\\' && self.at(self.pos + 1) == 'u' {
                self.pos += 2;
                let cp = self.read_unicode_escape();
                push_code_point(&mut s, cp);
                *escaped = true;
                continue;
            }
            if is_id_part(c) {
                s.push(c);
                self.pos += 1;
                continue;
            }
            break;
        }
        s
    }

    fn read_number(&mut self, raw: &mut String) -> double {
        let start = self.pos;
        let c = self.cur();
        let nx = self.at(self.pos + 1);
        if c == '0' && (nx == 'x' || nx == 'X' || nx == 'o' || nx == 'O' || nx == 'b' || nx == 'B') {
            let base: double = if nx == 'x' || nx == 'X' {
                16.0
            } else if nx == 'o' || nx == 'O' {
                8.0
            } else {
                2.0
            };
            self.pos += 2;
            let mut v: double = 0.0;
            let mut digits = 0;
            loop {
                let d = self.cur();
                if d == '_' {
                    self.pos += 1;
                    continue;
                }
                let h = hex_val(d);
                if h < 0 || (h as double) >= base {
                    break;
                }
                v = v * base + (h as double);
                digits += 1;
                self.pos += 1;
            }
            if self.cur() == 'n' {
                self.pos += 1;
            }
            if digits == 0 {
                self.fail("missing digits");
            }
            self.check_after_number();
            return v;
        }
        // legacy octal: 017
        if c == '0' && nx >= '0' && nx <= '9' {
            let mut k = self.pos + 1;
            let mut octal = true;
            while self.at(k) >= '0' && self.at(k) <= '9' {
                if self.at(k) >= '8' {
                    octal = false;
                }
                k += 1;
            }
            if octal {
                let mut v: double = 0.0;
                self.pos += 1;
                while self.cur() >= '0' && self.cur() <= '7' {
                    v = v * 8.0 + (((self.cur() as int) - 48) as double);
                    self.pos += 1;
                }
                raw.push_str("octal");
                return v;
            }
        }
        let mut text = String::new();
        while (self.cur() >= '0' && self.cur() <= '9') || self.cur() == '_' {
            if self.cur() != '_' {
                text.push(self.cur());
            }
            self.pos += 1;
        }
        if self.cur() == 'n' {
            // a BigInt literal, read as a number
            self.pos += 1;
            self.check_after_number();
            return text.parse::<f64>().unwrap_or(0.0);
        }
        if self.cur() == '.' {
            text.push('.');
            self.pos += 1;
            while (self.cur() >= '0' && self.cur() <= '9') || self.cur() == '_' {
                if self.cur() != '_' {
                    text.push(self.cur());
                }
                self.pos += 1;
            }
        }
        if self.cur() == 'e' || self.cur() == 'E' {
            let save = self.pos;
            let mut exp = String::from("e");
            self.pos += 1;
            if self.cur() == '+' || self.cur() == '-' {
                exp.push(self.cur());
                self.pos += 1;
            }
            let mut digits = 0;
            while self.cur() >= '0' && self.cur() <= '9' {
                exp.push(self.cur());
                self.pos += 1;
                digits += 1;
            }
            if digits == 0 {
                self.pos = save;
            } else {
                text.push_str(exp.as_str());
            }
        }
        let _ = start;
        self.check_after_number();
        if text.starts_with(".") {
            text = format!("0{}", text);
        }
        if text.ends_with(".") {
            text.push('0');
        }
        text.parse::<f64>().unwrap_or(0.0)
    }

    fn check_after_number(&mut self) {
        let c = self.cur();
        if is_id_start(c) || (c >= '0' && c <= '9') {
            self.fail("identifier starts immediately after numeric literal");
        }
    }

    /// One escape sequence after the backslash; appends its value.
    fn read_escape(&mut self, out: &mut String, in_template: bool, octal: &mut bool) {
        let c = self.cur();
        self.pos += 1;
        if c == 'n' {
            out.push('\n');
        } else if c == 't' {
            out.push('\t');
        } else if c == 'r' {
            out.push('\r');
        } else if c == 'b' {
            out.push('\u{8}');
        } else if c == 'f' {
            out.push('\u{c}');
        } else if c == 'v' {
            out.push('\u{b}');
        } else if c == '0' && !(self.cur() >= '0' && self.cur() <= '9') {
            out.push('\0');
        } else if c >= '0' && c <= '7' {
            if in_template {
                self.fail("octal escape in template");
            }
            *octal = true;
            let mut v: int = (c as int) - 48;
            if self.cur() >= '0' && self.cur() <= '7' {
                v = v * 8 + ((self.cur() as int) - 48);
                self.pos += 1;
                if c <= '3' && self.cur() >= '0' && self.cur() <= '7' {
                    v = v * 8 + ((self.cur() as int) - 48);
                    self.pos += 1;
                }
            }
            push_code_point(out, v);
        } else if c == 'x' {
            let a = hex_val(self.cur());
            let b = hex_val(self.at(self.pos + 1));
            if a < 0 || b < 0 {
                self.fail("bad hex escape");
                return;
            }
            self.pos += 2;
            push_code_point(out, a * 16 + b);
        } else if c == 'u' {
            let mut cp = self.read_unicode_escape();
            // a surrogate pair written as two escapes
            if cp >= 0xd800 && cp <= 0xdbff && self.cur() == '\\' && self.at(self.pos + 1) == 'u' {
                let save = self.pos;
                self.pos += 2;
                let lo = self.read_unicode_escape();
                if lo >= 0xdc00 && lo <= 0xdfff {
                    cp = 0x10000 + ((cp - 0xd800) * 1024) + (lo - 0xdc00);
                } else {
                    self.pos = save;
                }
            }
            push_code_point(out, cp);
        } else if c == '\r' {
            if self.cur() == '\n' {
                self.pos += 1;
            }
            self.line += 1;
        } else if c == '\n' || c == '\u{2028}' || c == '\u{2029}' {
            self.line += 1;
        } else {
            out.push(c);
        }
    }

    fn read_string(&mut self, q: char, octal: &mut bool) -> String {
        self.pos += 1;
        let mut s = String::new();
        let n = self.src.len() as int;
        loop {
            if self.pos >= n {
                self.fail("unterminated string");
                break;
            }
            let c = self.cur();
            if c == q {
                self.pos += 1;
                break;
            }
            if c == '\n' || c == '\r' {
                self.fail("unterminated string");
                break;
            }
            if c == '\\' {
                self.pos += 1;
                self.read_escape(&mut s, false, octal);
                continue;
            }
            s.push(c);
            self.pos += 1;
        }
        s
    }

    /// The source between `a` and `b`, line terminators as \n: a template's
    /// raw string.
    fn raw_text(&self, a: int, b: int) -> String {
        let mut out = String::new();
        let mut i = a;
        while i < b {
            let c = self.src[i as usize];
            if c == '\r' {
                out.push('\n');
                if i + 1 < b && self.src[(i + 1) as usize] == '\n' {
                    i += 1;
                }
            } else {
                out.push(c);
            }
            i += 1;
        }
        out
    }

    fn read_template(&mut self, t: &mut Tok) {
        self.pos += 1;
        let n = self.src.len() as int;
        let mut cur = String::new();
        let mut octal = false;
        let mut part_start = self.pos;
        loop {
            if self.pos >= n {
                self.fail("unterminated template");
                break;
            }
            let c = self.cur();
            if c == '`' {
                let r = self.raw_text(part_start, self.pos);
                t.raws.push(r);
                self.pos += 1;
                break;
            }
            if c == '\\' {
                self.pos += 1;
                self.read_escape(&mut cur, true, &mut octal);
                continue;
            }
            if c == '$' && self.at(self.pos + 1) == '{' {
                let r = self.raw_text(part_start, self.pos);
                t.raws.push(r);
                self.pos += 2;
                t.parts.push(cur.clone());
                cur = String::new();
                // the substitution's source, braces and strings balanced
                let mut depth = 1;
                let mut e = String::new();
                while self.pos < n {
                    let d = self.cur();
                    if d == '{' {
                        depth += 1;
                    } else if d == '}' {
                        depth -= 1;
                        if depth == 0 {
                            self.pos += 1;
                            break;
                        }
                    } else if d == '"' || d == '\'' || d == '`' {
                        // copy a nested literal whole
                        e.push(d);
                        self.pos += 1;
                        let mut inner = 0;
                        while self.pos < n {
                            let x = self.cur();
                            e.push(x);
                            self.pos += 1;
                            if x == '\\' {
                                e.push(self.cur());
                                self.pos += 1;
                                continue;
                            }
                            if d == '`' && x == '$' && self.cur() == '{' {
                                inner += 1;
                            } else if d == '`' && x == '}' && inner > 0 {
                                inner -= 1;
                            } else if x == d && inner == 0 {
                                break;
                            }
                        }
                        continue;
                    } else if d == '\n' {
                        self.line += 1;
                    }
                    e.push(d);
                    self.pos += 1;
                }
                t.exprs.push(e);
                part_start = self.pos;
                continue;
            }
            if c == '\r' {
                // line terminators in a template are normalised to \n
                cur.push('\n');
                self.pos += 1;
                if self.cur() == '\n' {
                    self.pos += 1;
                }
                self.line += 1;
                continue;
            }
            if c == '\n' {
                self.line += 1;
            }
            cur.push(c);
            self.pos += 1;
        }
        t.parts.push(cur);
    }

    fn read_regex(&mut self, t: &mut Tok) {
        self.pos += 1;
        let n = self.src.len() as int;
        let mut body = String::new();
        let mut in_class = false;
        loop {
            if self.pos >= n || self.cur() == '\n' {
                self.fail("unterminated regular expression");
                return;
            }
            let c = self.cur();
            if c == '\\' {
                body.push(c);
                body.push(self.at(self.pos + 1));
                self.pos += 2;
                continue;
            }
            if c == '[' {
                in_class = true;
            } else if c == ']' {
                in_class = false;
            } else if c == '/' && !in_class {
                self.pos += 1;
                break;
            }
            body.push(c);
            self.pos += 1;
        }
        let mut flags = String::new();
        while is_id_part(self.cur()) {
            flags.push(self.cur());
            self.pos += 1;
        }
        t.text = body;
        t.flags = flags;
    }
}
