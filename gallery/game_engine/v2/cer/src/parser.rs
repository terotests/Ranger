// SPDX-License-Identifier: AGPL-3.0-or-later
//! A recursive-descent parser from tokens to the arena tree in `ast.rs`.
//! ES5 with the common ES2015+ forms: `let` / `const`, arrow functions,
//! classes (fields, getters, `static`, `extends`, `super`), template
//! literals, spread and rest, destructuring with defaults, `for … of`,
//! optional chaining, `??`, exponentiation and shorthand object members.

use ranger::prelude::*;

use crate::ast::*;
use crate::lexer::*;

pub struct Parser {
    toks: Vec<Tok>,
    pos: int,
    pub ast: Ast,
    pub error: String,
    /// `in` is not an operator in the head of a `for`
    no_in: bool,
    in_function: bool,
    in_class: bool,
    /// inside an async function (`await` is an operator) / a generator
    in_async: bool,
    in_generator: bool,
    /// the source, for functions' text
    src: Vec<char>,
    /// where the class or object member being read began
    member_start: int,
}

fn binary_prec(op: &str) -> int {
    if op == "??" {
        return 1;
    }
    if op == "||" {
        return 2;
    }
    if op == "&&" {
        return 3;
    }
    if op == "|" {
        return 4;
    }
    if op == "^" {
        return 5;
    }
    if op == "&" {
        return 6;
    }
    if op == "==" || op == "!=" || op == "===" || op == "!==" {
        return 7;
    }
    if op == "<" || op == ">" || op == "<=" || op == ">=" || op == "instanceof" || op == "in" {
        return 8;
    }
    if op == "<<" || op == ">>" || op == ">>>" {
        return 9;
    }
    if op == "+" || op == "-" {
        return 10;
    }
    if op == "*" || op == "/" || op == "%" {
        return 11;
    }
    if op == "**" {
        return 12;
    }
    -1
}

fn is_assign_op(op: &str) -> bool {
    op == "="
        || op == "+="
        || op == "-="
        || op == "*="
        || op == "/="
        || op == "%="
        || op == "**="
        || op == "<<="
        || op == ">>="
        || op == ">>>="
        || op == "&="
        || op == "|="
        || op == "^="
        || op == "&&="
        || op == "||="
        || op == "??="
}

pub fn is_reserved(w: &str) -> bool {
    w == "break"
        || w == "case"
        || w == "catch"
        || w == "class"
        || w == "const"
        || w == "continue"
        || w == "debugger"
        || w == "default"
        || w == "delete"
        || w == "do"
        || w == "else"
        || w == "export"
        || w == "extends"
        || w == "finally"
        || w == "for"
        || w == "function"
        || w == "if"
        || w == "import"
        || w == "in"
        || w == "instanceof"
        || w == "new"
        || w == "return"
        || w == "super"
        || w == "switch"
        || w == "this"
        || w == "throw"
        || w == "try"
        || w == "typeof"
        || w == "var"
        || w == "void"
        || w == "while"
        || w == "with"
        || w == "null"
        || w == "true"
        || w == "false"
        || w == "enum"
}

impl Parser {
    pub fn new(src: &str) -> Parser {
        let mut lx = Lexer::new(src);
        let toks = lx.tokenize();
        let mut p = Parser {
            toks: toks,
            pos: 0,
            ast: Ast::new(),
            error: String::new(),
            no_in: false,
            in_function: false,
            in_class: false,
            in_async: false,
            in_generator: false,
            src: Vec::new(),
            member_start: -1,
        };
        for c in src.chars() {
            p.src.push(c);
        }
        if !lx.error.is_empty() {
            p.error = lx.error.clone();
        }
        p
    }

    /// Copies the nodes of `other` (a template substitution's tree) into
    /// this tree; answers where `root` landed.
    fn graft(&mut self, other: &Ast, root: int) -> int {
        let off = self.ast.nodes.len() as int;
        for nd in other.nodes.iter() {
            let i = self.ast.add(nd.kind, nd.line);
            let m = &mut self.ast.nodes[i as usize];
            m.op = nd.op.clone();
            m.s = nd.s.clone();
            m.num = nd.num;
            m.flags = nd.flags;
            m.text = nd.text.clone();
            m.a = if nd.a >= 0 { nd.a + off } else { nd.a };
            m.b = if nd.b >= 0 { nd.b + off } else { nd.b };
            m.c = if nd.c >= 0 && nd.kind != N_SUPER_MEMBER { nd.c + off } else { nd.c };
            m.d = if nd.d >= 0 && (nd.kind != N_PROP && nd.kind != N_MEMBER && nd.kind != N_INDEX && nd.kind != N_CALL) { nd.d + off } else { nd.d };
            for x in nd.list.iter() {
                m.list.push(*x + off);
            }
            for x in nd.list2.iter() {
                m.list2.push(*x + off);
            }
        }
        root + off
    }

    // ---- tokens

    fn kind(&self) -> int {
        self.toks[self.pos as usize].kind
    }

    fn text(&self) -> String {
        self.toks[self.pos as usize].text.clone()
    }

    fn line(&self) -> int {
        self.toks[self.pos as usize].line
    }

    fn peek_kind(&self, k: int) -> int {
        let i = self.pos + k;
        if i >= self.toks.len() as int {
            return T_EOF;
        }
        self.toks[i as usize].kind
    }

    fn peek_is(&self, k: int, s: &str) -> bool {
        let i = self.pos + k;
        if i >= self.toks.len() as int {
            return false;
        }
        let t = &self.toks[i as usize];
        (t.kind == T_PUNCT || (t.kind == T_IDENT && !t.escaped)) && t.text.as_str() == s
    }

    fn is(&self, s: &str) -> bool {
        self.peek_is(0, s)
    }

    fn nl_before(&self) -> bool {
        self.toks[self.pos as usize].nl
    }

    fn next(&mut self) {
        if self.pos < (self.toks.len() as int) - 1 {
            self.pos += 1;
        }
    }

    fn fail(&mut self, msg: &str) {
        if self.error.is_empty() {
            let l = self.line();
            self.error = format!("SyntaxError: {} (line {})", msg, l);
        }
        // stop: jump to the end
        self.pos = (self.toks.len() as int) - 1;
    }

    fn expect(&mut self, s: &str) {
        if self.is(s) {
            self.next();
        } else {
            let t = self.text();
            self.fail(format!("expected '{}' but found '{}'", s, t).as_str());
        }
    }

    fn eat(&mut self, s: &str) -> bool {
        if self.is(s) {
            self.next();
            return true;
        }
        false
    }

    fn semicolon(&mut self) {
        if self.eat(";") {
            return;
        }
        if self.is("}") || self.kind() == T_EOF || self.nl_before() {
            return;
        }
        let t = self.text();
        self.fail(format!("unexpected token '{}'", t).as_str());
    }

    fn ident_name(&mut self) -> String {
        // any identifier, reserved words included (after `.`, in keys)
        if self.kind() == T_IDENT {
            let s = self.text();
            self.next();
            return s;
        }
        let t = self.text();
        self.fail(format!("expected a name but found '{}'", t).as_str());
        String::new()
    }

    fn binding_ident(&mut self) -> String {
        if self.kind() == T_IDENT {
            let s = self.text();
            if is_reserved(s.as_str()) && !self.toks[self.pos as usize].escaped {
                self.fail(format!("unexpected reserved word '{}'", s).as_str());
                return s;
            }
            self.next();
            return s;
        }
        let t = self.text();
        self.fail(format!("expected an identifier but found '{}'", t).as_str());
        String::new()
    }

    fn node(&mut self, kind: int) -> int {
        let l = self.line();
        self.ast.add(kind, l)
    }

    fn tok_start(&self) -> int {
        self.toks[self.pos as usize].start
    }

    /// Records the source from `start` to the end of the last token read
    /// as the text of node `n`.
    fn set_text(&mut self, n: int, start: int) {
        if self.pos < 1 || start < 0 {
            return;
        }
        let end = self.toks[(self.pos - 1) as usize].end;
        if end <= start || end > self.src.len() as int {
            return;
        }
        let mut t = String::new();
        let mut i = start;
        while i < end {
            t.push(self.src[i as usize]);
            i += 1;
        }
        self.ast.nodes[n as usize].text = t;
    }

    // ---- program

    pub fn parse_program(&mut self) -> int {
        let prog = self.node(N_PROGRAM);
        let mut body: Vec<int> = Vec::new();
        self.directives(prog);
        while self.kind() != T_EOF && self.error.is_empty() {
            let s = self.statement();
            body.push(s);
        }
        self.ast.nodes[prog as usize].list = body;
        prog
    }

    /// `"use strict"` at the top of a body
    fn directives(&mut self, owner: int) {
        let mut k = self.pos;
        while (k as usize) < self.toks.len() && self.toks[k as usize].kind == T_STR {
            // exactly 'use strict' or "use strict": no escapes, no line
            // continuations
            let raw_len = self.toks[k as usize].end - self.toks[k as usize].start;
            if self.toks[k as usize].text.as_str() == "use strict" && !self.toks[k as usize].escaped && raw_len == 12 {
                self.ast.nodes[owner as usize].flags |= F_STRICT;
            }
            k += 1;
            if (k as usize) < self.toks.len() && self.toks[k as usize].kind == T_PUNCT && self.toks[k as usize].text.as_str() == ";" {
                k += 1;
            } else if !((k as usize) < self.toks.len() && self.toks[k as usize].nl) {
                break;
            }
        }
    }

    // ---- statements

    fn statement(&mut self) -> int {
        if self.kind() == T_PUNCT {
            if self.is("{") {
                return self.block();
            }
            if self.is(";") {
                self.next();
                return self.node(N_EMPTY);
            }
        }
        if self.kind() == T_IDENT && !self.toks[self.pos as usize].escaped {
            let w = self.text();
            let ws = w.as_str();
            if ws == "var" || ws == "const" {
                let n = self.var_decl();
                self.semicolon();
                return n;
            }
            if ws == "let" && (self.peek_kind(1) == T_IDENT || self.peek_is(1, "[") || self.peek_is(1, "{")) {
                let n = self.var_decl();
                self.semicolon();
                return n;
            }
            if ws == "function" {
                return self.function(true, 0);
            }
            if ws == "async" && self.peek_is(1, "function") && !self.toks[(self.pos + 1) as usize].nl {
                self.next();
                return self.function(true, F_ASYNC);
            }
            if ws == "class" {
                return self.class(true);
            }
            if ws == "if" {
                return self.if_stmt();
            }
            if ws == "for" {
                return self.for_stmt();
            }
            if ws == "while" {
                let n = self.node(N_WHILE);
                self.next();
                self.expect("(");
                let t = self.expression();
                self.expect(")");
                let b = self.statement();
                self.ast.nodes[n as usize].a = t;
                self.ast.nodes[n as usize].b = b;
                return n;
            }
            if ws == "do" {
                let n = self.node(N_DOWHILE);
                self.next();
                let b = self.statement();
                if !self.is("while") {
                    self.fail("expected 'while'");
                }
                self.next();
                self.expect("(");
                let t = self.expression();
                self.expect(")");
                self.eat(";");
                self.ast.nodes[n as usize].a = b;
                self.ast.nodes[n as usize].b = t;
                return n;
            }
            if ws == "return" {
                let n = self.node(N_RETURN);
                if !self.in_function {
                    self.fail("return outside a function");
                }
                self.next();
                if !self.is(";") && !self.is("}") && self.kind() != T_EOF && !self.nl_before() {
                    let e = self.expression();
                    self.ast.nodes[n as usize].a = e;
                }
                self.semicolon();
                return n;
            }
            if ws == "break" || ws == "continue" {
                let n = self.node(if ws == "break" { N_BREAK } else { N_CONTINUE });
                self.next();
                if self.kind() == T_IDENT && !self.nl_before() && !is_reserved(self.text().as_str()) {
                    let l = self.text();
                    self.ast.nodes[n as usize].s = l;
                    self.next();
                }
                self.semicolon();
                return n;
            }
            if ws == "throw" {
                let n = self.node(N_THROW);
                self.next();
                if self.nl_before() {
                    self.fail("line break after throw");
                }
                let e = self.expression();
                self.ast.nodes[n as usize].a = e;
                self.semicolon();
                return n;
            }
            if ws == "try" {
                return self.try_stmt();
            }
            if ws == "switch" {
                return self.switch_stmt();
            }
            if ws == "debugger" {
                self.next();
                self.semicolon();
                return self.node(N_EMPTY);
            }
            if ws == "with" {
                let n = self.node(N_WITH);
                self.next();
                self.expect("(");
                let e = self.expression();
                self.expect(")");
                let body = self.statement();
                self.ast.nodes[n as usize].a = e;
                self.ast.nodes[n as usize].b = body;
                return n;
            }
            if ws == "import" && !self.peek_is(1, "(") && !self.peek_is(1, ".") {
                self.fail("modules are not supported");
                return self.node(N_EMPTY);
            }
            if ws == "export" {
                self.fail("modules are not supported");
                return self.node(N_EMPTY);
            }
            if self.peek_is(1, ":") && !is_reserved(ws) {
                let n = self.node(N_LABELED);
                self.ast.nodes[n as usize].s = w.clone();
                self.next();
                self.next();
                let b = self.statement();
                self.ast.nodes[n as usize].a = b;
                return n;
            }
        }
        let n = self.node(N_EXPR);
        let e = self.expression();
        self.ast.nodes[n as usize].a = e;
        self.semicolon();
        n
    }

    fn block(&mut self) -> int {
        let n = self.node(N_BLOCK);
        self.expect("{");
        let mut body: Vec<int> = Vec::new();
        while !self.is("}") && self.kind() != T_EOF {
            let s = self.statement();
            body.push(s);
        }
        self.expect("}");
        self.ast.nodes[n as usize].list = body;
        n
    }

    /// `var` / `let` / `const` and its declarators, no semicolon.
    fn var_decl(&mut self) -> int {
        let n = self.node(N_VAR);
        let kw = self.text();
        self.next();
        let mut decls: Vec<int> = Vec::new();
        loop {
            let d = self.node(N_DECL);
            let target = self.binding_target();
            self.ast.nodes[d as usize].a = target;
            if self.eat("=") {
                let init = self.assign();
                self.ast.nodes[d as usize].b = init;
            }
            decls.push(d);
            if !self.eat(",") {
                break;
            }
        }
        self.ast.nodes[n as usize].op = kw;
        self.ast.nodes[n as usize].list = decls;
        n
    }

    /// An identifier or a destructuring pattern.
    fn binding_target(&mut self) -> int {
        if self.is("[") || self.is("{") {
            let e = self.primary();
            return self.to_pattern(e);
        }
        let n = self.node(N_IDENT);
        let name = self.binding_ident();
        self.ast.nodes[n as usize].s = name;
        n
    }

    /// Rewrites an array / object literal (or assignment target) as a
    /// pattern: `a = 1` inside becomes a default, `...a` a rest element.
    fn to_pattern(&mut self, e: int) -> int {
        let k = self.ast.kind(e);
        if k == N_ARRAY {
            let items = self.ast.nodes[e as usize].list.clone();
            let mut out: Vec<int> = Vec::new();
            for it in items {
                if self.ast.kind(it) == N_SPREAD {
                    let inner = self.ast.nodes[it as usize].a;
                    let p = self.to_pattern(inner);
                    let r = self.ast.add(N_REST, 0);
                    self.ast.nodes[r as usize].a = p;
                    out.push(r);
                } else if self.ast.kind(it) == N_HOLE {
                    out.push(it);
                } else {
                    let p = self.to_pattern(it);
                    out.push(p);
                }
            }
            self.ast.nodes[e as usize].list = out;
            return e;
        }
        if k == N_OBJECT {
            let props = self.ast.nodes[e as usize].list.clone();
            for p in props {
                let f = self.ast.nodes[p as usize].flags;
                if (f & F_SPREAD) != 0 {
                    let inner = self.ast.nodes[p as usize].b;
                    let t = self.to_pattern(inner);
                    self.ast.nodes[p as usize].b = t;
                } else {
                    let v = self.ast.nodes[p as usize].b;
                    let t = self.to_pattern(v);
                    self.ast.nodes[p as usize].b = t;
                }
            }
            return e;
        }
        if k == N_ASSIGN && self.ast.nodes[e as usize].op.as_str() == "=" {
            let t = self.ast.nodes[e as usize].a;
            let pt = self.to_pattern(t);
            let d = self.ast.nodes[e as usize].b;
            let n = self.ast.add(N_PAT_DEFAULT, 0);
            self.ast.nodes[n as usize].a = pt;
            self.ast.nodes[n as usize].b = d;
            return n;
        }
        if k == N_PAT_DEFAULT || k == N_IDENT || k == N_MEMBER || k == N_INDEX || k == N_REST {
            return e;
        }
        self.fail("invalid destructuring target");
        e
    }

    fn if_stmt(&mut self) -> int {
        let n = self.node(N_IF);
        self.next();
        self.expect("(");
        let t = self.expression();
        self.expect(")");
        let a = self.statement();
        let mut b: int = -1;
        if self.is("else") {
            self.next();
            b = self.statement();
        }
        self.ast.nodes[n as usize].a = t;
        self.ast.nodes[n as usize].b = a;
        self.ast.nodes[n as usize].c = b;
        n
    }

    fn for_stmt(&mut self) -> int {
        let line = self.line();
        self.next();
        if self.is("await") {
            self.fail("for await is not supported");
        }
        self.expect("(");
        let mut init: int = -1;
        if self.is(";") {
            // no init
        } else {
            let decl = self.is("var") || self.is("const") || (self.is("let") && (self.peek_kind(1) == T_IDENT || self.peek_is(1, "[") || self.peek_is(1, "{")));
            self.no_in = true;
            if decl {
                init = self.var_decl();
            } else {
                init = self.expression();
            }
            self.no_in = false;
            if self.is("of") || self.is("in") {
                let n = self.ast.add(N_FORIN, line);
                let op = self.text();
                self.next();
                let obj = if op.as_str() == "of" { self.assign() } else { self.expression() };
                self.expect(")");
                if !decl {
                    init = self.to_pattern(init);
                }
                let body = self.statement();
                self.ast.nodes[n as usize].op = op;
                self.ast.nodes[n as usize].a = init;
                self.ast.nodes[n as usize].b = obj;
                self.ast.nodes[n as usize].c = body;
                return n;
            }
            if !decl {
                let e = self.ast.add(N_EXPR, line);
                self.ast.nodes[e as usize].a = init;
                init = e;
            }
        }
        let n = self.ast.add(N_FOR, line);
        self.expect(";");
        let mut test: int = -1;
        if !self.is(";") {
            test = self.expression();
        }
        self.expect(";");
        let mut update: int = -1;
        if !self.is(")") {
            update = self.expression();
        }
        self.expect(")");
        let body = self.statement();
        self.ast.nodes[n as usize].a = init;
        self.ast.nodes[n as usize].b = test;
        self.ast.nodes[n as usize].c = update;
        self.ast.nodes[n as usize].d = body;
        n
    }

    fn try_stmt(&mut self) -> int {
        let n = self.node(N_TRY);
        self.next();
        let body = self.block();
        self.ast.nodes[n as usize].a = body;
        if self.is("catch") {
            self.next();
            if self.eat("(") {
                let p = self.binding_target();
                self.ast.nodes[n as usize].b = p;
                self.expect(")");
            }
            let c = self.block();
            self.ast.nodes[n as usize].c = c;
        }
        if self.is("finally") {
            self.next();
            let f = self.block();
            self.ast.nodes[n as usize].d = f;
        }
        if self.ast.nodes[n as usize].c < 0 && self.ast.nodes[n as usize].d < 0 {
            self.fail("try without catch or finally");
        }
        n
    }

    fn switch_stmt(&mut self) -> int {
        let n = self.node(N_SWITCH);
        self.next();
        self.expect("(");
        let d = self.expression();
        self.expect(")");
        self.expect("{");
        let mut cases: Vec<int> = Vec::new();
        while !self.is("}") && self.kind() != T_EOF {
            let c = self.node(N_CASE);
            if self.is("case") {
                self.next();
                let t = self.expression();
                self.ast.nodes[c as usize].a = t;
            } else if self.is("default") {
                self.next();
            } else {
                self.fail("expected case or default");
                break;
            }
            self.expect(":");
            let mut body: Vec<int> = Vec::new();
            while !self.is("case") && !self.is("default") && !self.is("}") && self.kind() != T_EOF {
                let s = self.statement();
                body.push(s);
            }
            self.ast.nodes[c as usize].list = body;
            cases.push(c);
        }
        self.expect("}");
        self.ast.nodes[n as usize].a = d;
        self.ast.nodes[n as usize].list = cases;
        n
    }

    // ---- functions and classes

    /// `function name(…) { … }`; the current token is `function`.
    fn function(&mut self, decl: bool, extra: int) -> int {
        let n = self.node(N_FUNC);
        let start = if (extra & F_ASYNC) != 0 && self.pos > 0 { self.toks[(self.pos - 1) as usize].start } else { self.tok_start() };
        self.next();
        let mut flags = extra;
        if self.eat("*") {
            flags |= F_GENERATOR;
        }
        if decl {
            flags |= F_DECL;
        }
        if self.kind() == T_IDENT && !self.is("(") {
            let name = self.binding_ident();
            self.ast.nodes[n as usize].s = name;
        } else if decl {
            self.fail("function name expected");
        }
        self.ast.nodes[n as usize].flags = flags;
        self.function_rest(n);
        self.set_text(n, start);
        n
    }

    /// Parameters and body of the function node `n`.
    fn function_rest(&mut self, n: int) {
        self.expect("(");
        let mut params: Vec<int> = Vec::new();
        while !self.is(")") && self.kind() != T_EOF {
            if self.eat("...") {
                let t = self.binding_target();
                let r = self.ast.add(N_REST, 0);
                self.ast.nodes[r as usize].a = t;
                params.push(r);
                break;
            }
            let mut t = self.binding_target();
            if self.eat("=") {
                let d = self.assign();
                let pd = self.ast.add(N_PAT_DEFAULT, 0);
                self.ast.nodes[pd as usize].a = t;
                self.ast.nodes[pd as usize].b = d;
                t = pd;
            }
            params.push(t);
            if !self.eat(",") {
                break;
            }
        }
        self.expect(")");
        self.ast.nodes[n as usize].list = params;
        let body = self.function_body(n);
        self.ast.nodes[n as usize].a = body;
    }

    fn function_body(&mut self, owner: int) -> int {
        let saved = self.in_function;
        self.in_function = true;
        let saved_async = self.in_async;
        let saved_gen = self.in_generator;
        let of = self.ast.nodes[owner as usize].flags;
        self.in_async = (of & F_ASYNC) != 0;
        self.in_generator = (of & F_GENERATOR) != 0;
        let n = self.node(N_BLOCK);
        self.expect("{");
        self.directives(owner);
        let mut body: Vec<int> = Vec::new();
        while !self.is("}") && self.kind() != T_EOF {
            let s = self.statement();
            body.push(s);
        }
        self.expect("}");
        self.ast.nodes[n as usize].list = body;
        self.in_function = saved;
        self.in_async = saved_async;
        self.in_generator = saved_gen;
        n
    }

    /// True when the tokens from here are an arrow function's head.
    fn arrow_ahead(&self) -> bool {
        let mut k: int = 0;
        if self.peek_is(0, "async") && !self.toks[(self.pos + 1) as usize].nl && (self.peek_kind(1) == T_IDENT || self.peek_is(1, "(")) {
            if self.peek_kind(1) == T_IDENT {
                return self.peek_is(2, "=>");
            }
            k = 1;
        }
        if self.peek_kind(k) == T_IDENT && !self.peek_is(k, "(") {
            return self.peek_is(k + 1, "=>") && k == 0;
        }
        if !self.peek_is(k, "(") {
            return false;
        }
        let mut depth = 0;
        let mut i = self.pos + k;
        let n = self.toks.len() as int;
        while i < n {
            let t = &self.toks[i as usize];
            if t.kind == T_PUNCT {
                let s = t.text.as_str();
                if s == "(" || s == "[" || s == "{" {
                    depth += 1;
                } else if s == ")" || s == "]" || s == "}" {
                    depth -= 1;
                    if depth == 0 {
                        if i + 1 < n {
                            let u = &self.toks[(i + 1) as usize];
                            return u.kind == T_PUNCT && u.text.as_str() == "=>" && !u.nl;
                        }
                        return false;
                    }
                }
            } else if t.kind == T_EOF {
                return false;
            }
            i += 1;
        }
        false
    }

    fn arrow(&mut self) -> int {
        let n = self.node(N_FUNC);
        let start = self.tok_start();
        let mut flags = F_ARROW;
        if self.is("async") {
            self.next();
            flags |= F_ASYNC;
        }
        self.ast.nodes[n as usize].flags = flags;
        if self.kind() == T_IDENT {
            let p = self.node(N_IDENT);
            let name = self.binding_ident();
            self.ast.nodes[p as usize].s = name;
            self.ast.nodes[n as usize].list = vec![p];
        } else {
            self.expect("(");
            let mut params: Vec<int> = Vec::new();
            while !self.is(")") && self.kind() != T_EOF {
                if self.eat("...") {
                    let t = self.binding_target();
                    let r = self.ast.add(N_REST, 0);
                    self.ast.nodes[r as usize].a = t;
                    params.push(r);
                    break;
                }
                let mut t = self.binding_target();
                if self.eat("=") {
                    let d = self.assign();
                    let pd = self.ast.add(N_PAT_DEFAULT, 0);
                    self.ast.nodes[pd as usize].a = t;
                    self.ast.nodes[pd as usize].b = d;
                    t = pd;
                }
                params.push(t);
                if !self.eat(",") {
                    break;
                }
            }
            self.expect(")");
            self.ast.nodes[n as usize].list = params;
        }
        self.expect("=>");
        if self.is("{") {
            let b = self.function_body(n);
            self.ast.nodes[n as usize].a = b;
        } else {
            let saved = self.in_function;
            self.in_function = true;
            let saved_async = self.in_async;
            let saved_gen = self.in_generator;
            self.in_async = (self.ast.nodes[n as usize].flags & F_ASYNC) != 0;
            self.in_generator = false;
            let saved_no_in = self.no_in;
            let e = self.assign();
            self.no_in = saved_no_in;
            self.in_function = saved;
            self.in_async = saved_async;
            self.in_generator = saved_gen;
            self.ast.nodes[n as usize].a = e;
            self.ast.nodes[n as usize].flags |= F_EXPR_BODY;
        }
        self.set_text(n, start);
        n
    }

    /// A property key: returns the key node; `computed` when `[expr]`.
    fn prop_key(&mut self, computed: &mut bool, private: &mut bool) -> int {
        if self.eat("[") {
            *computed = true;
            let e = self.assign();
            self.expect("]");
            return e;
        }
        if self.kind() == T_PRIVATE {
            *private = true;
            let n = self.node(N_STR);
            let s = format!("\u{1}#{}", self.text());
            self.ast.nodes[n as usize].s = s;
            self.next();
            return n;
        }
        if self.kind() == T_STR {
            let n = self.node(N_STR);
            let s = self.text();
            self.ast.nodes[n as usize].s = s;
            self.next();
            return n;
        }
        if self.kind() == T_NUM {
            let n = self.node(N_NUM);
            let v = self.toks[self.pos as usize].num;
            self.ast.nodes[n as usize].num = v;
            self.next();
            return n;
        }
        let n = self.node(N_STR);
        let s = self.ident_name();
        self.ast.nodes[n as usize].s = s;
        n
    }

    /// A method's function node after its key: `(params) { body }`.
    fn method(&mut self, flags: int, name: &str) -> int {
        let f = self.node(N_FUNC);
        self.ast.nodes[f as usize].flags = flags | F_METHOD;
        self.ast.nodes[f as usize].s = String::from(name);
        let start = self.member_start;
        self.function_rest(f);
        self.set_text(f, start);
        f
    }

    fn class(&mut self, decl: bool) -> int {
        let n = self.node(N_CLASS);
        let start = self.tok_start();
        self.next();
        if self.kind() == T_IDENT && !self.is("extends") && !self.is("{") {
            let name = self.binding_ident();
            self.ast.nodes[n as usize].s = name;
        } else if decl {
            self.fail("class name expected");
        }
        if decl {
            self.ast.nodes[n as usize].flags |= F_DECL;
        }
        if self.eat("extends") {
            let sup = self.lhs();
            self.ast.nodes[n as usize].a = sup;
            self.ast.nodes[n as usize].flags |= F_DERIVED;
        }
        let saved = self.in_class;
        self.in_class = true;
        self.expect("{");
        let mut members: Vec<int> = Vec::new();
        while !self.is("}") && self.kind() != T_EOF {
            if self.eat(";") {
                continue;
            }
            let m = self.node(N_PROP);
            let mut flags = 0;
            if self.is("static") && !self.peek_is(1, "(") && !self.peek_is(1, "=") {
                self.next();
                flags |= F_STATIC;
                if self.is("{") {
                    // a static block: statements of the static initializer
                    let b = self.function_body(m);
                    self.ast.nodes[m as usize].flags = F_STATIC | F_FIELD;
                    self.ast.nodes[m as usize].b = b;
                    self.ast.nodes[m as usize].d = 1;
                    members.push(m);
                    continue;
                }
            }
            let mut fflags = 0;
            self.member_start = self.tok_start();
            if self.is("async") && !self.peek_is(1, "(") && !self.peek_is(1, "=") && !self.toks[(self.pos + 1) as usize].nl {
                self.next();
                fflags |= F_ASYNC;
            }
            if self.eat("*") {
                fflags |= F_GENERATOR;
            }
            if (self.is("get") || self.is("set")) && !self.peek_is(1, "(") && !self.peek_is(1, "=") && !self.peek_is(1, ";") && !self.peek_is(1, "}") {
                if self.is("get") {
                    flags |= F_GETTER;
                } else {
                    flags |= F_SETTER;
                }
                self.next();
            }
            let mut computed = false;
            let mut private = false;
            let key = self.prop_key(&mut computed, &mut private);
            if computed {
                flags |= F_COMPUTED;
            }
            if private {
                flags |= F_PRIVATE;
            }
            self.ast.nodes[m as usize].a = key;
            if self.is("(") {
                let kname = if computed { String::new() } else { self.key_name(key) };
                let is_ctor = !computed && (flags & F_STATIC) == 0 && kname.as_str() == "constructor" && self.ast.kind(key) == N_STR;
                let mut mf = fflags | (flags & (F_GETTER | F_SETTER | F_STATIC));
                if is_ctor {
                    mf |= F_CTOR;
                }
                let f = self.method(mf, kname.as_str());
                if is_ctor {
                    self.ast.nodes[n as usize].b = f;
                    continue;
                }
                self.ast.nodes[m as usize].b = f;
            } else {
                flags |= F_FIELD;
                if self.eat("=") {
                    // a field initializer runs as a method of the instance
                    let saved_fn = self.in_function;
                    self.in_function = true;
                    let saved_async = self.in_async;
                    let saved_gen = self.in_generator;
                    self.in_async = false;
                    self.in_generator = false;
                    let e = self.assign();
                    self.in_function = saved_fn;
                    self.in_async = saved_async;
                    self.in_generator = saved_gen;
                    self.ast.nodes[m as usize].b = e;
                }
                self.semicolon();
            }
            self.ast.nodes[m as usize].flags = flags;
            members.push(m);
        }
        self.expect("}");
        self.in_class = saved;
        // fields and static blocks become two methods: one run on each
        // new instance, one run once on the constructor
        let line = self.line();
        let mut methods: Vec<int> = Vec::new();
        let mut inst: Vec<int> = Vec::new();
        let mut stat: Vec<int> = Vec::new();
        for m in members {
            let f = self.ast.nodes[m as usize].flags;
            if (f & F_FIELD) == 0 {
                methods.push(m);
                continue;
            }
            let st = if self.ast.nodes[m as usize].d == 1 {
                self.ast.nodes[m as usize].b
            } else {
                self.field_statement(m, line)
            };
            if (f & F_STATIC) != 0 {
                stat.push(st);
            } else {
                inst.push(st);
            }
        }
        self.ast.nodes[n as usize].list = methods;
        if !inst.is_empty() {
            let fnode = self.synthetic_method(inst, line, "");
            self.ast.nodes[n as usize].c = fnode;
        }
        if !stat.is_empty() {
            let fnode = self.synthetic_method(stat, line, "");
            self.ast.nodes[n as usize].d = fnode;
        }
        if self.ast.nodes[n as usize].b < 0 {
            // the default constructor
            let name = self.ast.nodes[n as usize].s.clone();
            let mut body: Vec<int> = Vec::new();
            let derived = (self.ast.nodes[n as usize].flags & F_DERIVED) != 0;
            let mut params: Vec<int> = Vec::new();
            if derived {
                let id = self.ast.add(N_IDENT, line);
                self.ast.nodes[id as usize].s = String::from("args");
                let r = self.ast.add(N_REST, line);
                self.ast.nodes[r as usize].a = id;
                params.push(r);
                let id2 = self.ast.add(N_IDENT, line);
                self.ast.nodes[id2 as usize].s = String::from("args");
                let sp = self.ast.add(N_SPREAD, line);
                self.ast.nodes[sp as usize].a = id2;
                let call = self.ast.add(N_SUPER_CALL, line);
                self.ast.nodes[call as usize].list = vec![sp];
                let st = self.ast.add(N_EXPR, line);
                self.ast.nodes[st as usize].a = call;
                body.push(st);
            }
            let f = self.synthetic_method(body, line, name.as_str());
            self.ast.nodes[f as usize].list = params;
            self.ast.nodes[f as usize].flags |= F_CTOR;
            self.ast.nodes[n as usize].b = f;
        }
        let ctor = self.ast.nodes[n as usize].b;
        let cname = self.ast.nodes[n as usize].s.clone();
        self.ast.nodes[ctor as usize].s = cname;
        // the class's source is its constructor's text
        self.set_text(n, start);
        let ctext = self.ast.nodes[n as usize].text.clone();
        self.ast.nodes[ctor as usize].text = ctext;
        if (self.ast.nodes[n as usize].flags & F_DERIVED) != 0 {
            self.ast.nodes[ctor as usize].flags |= F_DERIVED;
        }
        n
    }

    /// `this.key = init` defining the field `m`
    fn field_statement(&mut self, m: int, line: int) -> int {
        let f = self.ast.nodes[m as usize].flags;
        let key = self.ast.nodes[m as usize].a;
        let init = self.ast.nodes[m as usize].b;
        let this_n = self.ast.add(N_THIS, line);
        let target: int;
        if (f & F_COMPUTED) != 0 {
            target = self.ast.add(N_INDEX, line);
            self.ast.nodes[target as usize].a = this_n;
            self.ast.nodes[target as usize].b = key;
        } else {
            target = self.ast.add(N_MEMBER, line);
            self.ast.nodes[target as usize].a = this_n;
            let kname = self.key_name(key);
            self.ast.nodes[target as usize].s = kname;
        }
        let value = if init >= 0 { init } else { self.ast.add(N_UNDEF, line) };
        let asg = self.ast.add(N_ASSIGN, line);
        self.ast.nodes[asg as usize].op = String::from("define");
        self.ast.nodes[asg as usize].a = target;
        self.ast.nodes[asg as usize].b = value;
        let st = self.ast.add(N_EXPR, line);
        self.ast.nodes[st as usize].a = asg;
        st
    }

    fn synthetic_method(&mut self, body: Vec<int>, line: int, name: &str) -> int {
        let f = self.ast.add(N_FUNC, line);
        self.ast.nodes[f as usize].flags = F_METHOD | F_STRICT;
        self.ast.nodes[f as usize].s = String::from(name);
        let b = self.ast.add(N_BLOCK, line);
        self.ast.nodes[b as usize].list = body;
        self.ast.nodes[f as usize].a = b;
        f
    }

    fn key_name(&self, key: int) -> String {
        let k = &self.ast.nodes[key as usize];
        if k.kind == N_NUM {
            return crate::num::number_to_string(k.num);
        }
        k.s.clone()
    }

    // ---- expressions

    pub fn expression(&mut self) -> int {
        let first = self.assign();
        if !self.is(",") {
            return first;
        }
        let n = self.node(N_SEQ);
        let mut items: Vec<int> = vec![first];
        while self.eat(",") {
            let e = self.assign();
            items.push(e);
        }
        self.ast.nodes[n as usize].list = items;
        n
    }

    fn assign(&mut self) -> int {
        if self.arrow_ahead() {
            return self.arrow();
        }
        if self.is("yield") && self.in_generator && !self.toks[self.pos as usize].escaped {
            let n = self.node(N_YIELD);
            self.next();
            if self.eat("*") {
                self.ast.nodes[n as usize].flags = 1;
                let e = self.assign();
                self.ast.nodes[n as usize].a = e;
                return n;
            }
            let ends = self.nl_before() || self.kind() == T_EOF || self.is(")") || self.is("]") || self.is("}") || self.is(",") || self.is(";") || self.is(":") || self.is("in") || self.is("of");
            if !ends {
                let e = self.assign();
                self.ast.nodes[n as usize].a = e;
            }
            return n;
        }
        let line = self.line();
        let left = self.conditional();
        if self.kind() == T_PUNCT {
            let op = self.text();
            if is_assign_op(op.as_str()) {
                self.next();
                let mut target = left;
                let lk = self.ast.kind(left);
                if op.as_str() == "=" && (lk == N_ARRAY || lk == N_OBJECT) {
                    target = self.to_pattern(left);
                } else if !(lk == N_IDENT || lk == N_MEMBER || lk == N_INDEX || lk == N_SUPER_MEMBER) {
                    self.fail("invalid assignment target");
                }
                let right = self.assign();
                let n = self.ast.add(N_ASSIGN, line);
                self.ast.nodes[n as usize].op = op;
                self.ast.nodes[n as usize].a = target;
                self.ast.nodes[n as usize].b = right;
                return n;
            }
        }
        left
    }

    fn conditional(&mut self) -> int {
        let line = self.line();
        let t = self.binary(0);
        if !self.is("?") {
            return t;
        }
        self.next();
        let saved = self.no_in;
        self.no_in = false;
        let a = self.assign();
        self.no_in = saved;
        self.expect(":");
        let b = self.assign();
        let n = self.ast.add(N_COND, line);
        self.ast.nodes[n as usize].a = t;
        self.ast.nodes[n as usize].b = a;
        self.ast.nodes[n as usize].c = b;
        n
    }

    fn binary(&mut self, min: int) -> int {
        let line = self.line();
        let mut left = self.unary();
        loop {
            if !(self.kind() == T_PUNCT || (self.kind() == T_IDENT && (self.is("instanceof") || self.is("in")))) {
                break;
            }
            let op = self.text();
            if op.as_str() == "in" && self.no_in {
                break;
            }
            let prec = binary_prec(op.as_str());
            if prec < 0 || prec <= min - 1 || prec < min {
                break;
            }
            self.next();
            // `**` groups to the right
            let right = if op.as_str() == "**" { self.binary(prec) } else { self.binary(prec + 1) };
            let kind = if op.as_str() == "&&" || op.as_str() == "||" || op.as_str() == "??" { N_LOGICAL } else { N_BINARY };
            let n = self.ast.add(kind, line);
            self.ast.nodes[n as usize].op = op;
            self.ast.nodes[n as usize].a = left;
            self.ast.nodes[n as usize].b = right;
            left = n;
        }
        left
    }

    fn unary(&mut self) -> int {
        let line = self.line();
        if self.kind() == T_PUNCT {
            let op = self.text();
            let s = op.as_str();
            if s == "!" || s == "-" || s == "+" || s == "~" {
                self.next();
                let a = self.unary();
                if self.is("**") {
                    self.fail("unary operator before **");
                }
                let n = self.ast.add(N_UNARY, line);
                self.ast.nodes[n as usize].op = op;
                self.ast.nodes[n as usize].a = a;
                return n;
            }
            if s == "++" || s == "--" {
                self.next();
                let a = self.unary();
                let k = self.ast.kind(a);
                if !(k == N_IDENT || k == N_MEMBER || k == N_INDEX || k == N_SUPER_MEMBER) {
                    self.fail("invalid update target");
                }
                let n = self.ast.add(N_UPDATE, line);
                self.ast.nodes[n as usize].op = op;
                self.ast.nodes[n as usize].a = a;
                self.ast.nodes[n as usize].flags = 1; // prefix
                return n;
            }
        }
        if self.kind() == T_IDENT && !self.toks[self.pos as usize].escaped {
            let op = self.text();
            let s = op.as_str();
            if s == "typeof" || s == "void" || s == "delete" || (s == "await" && self.in_async) {
                self.next();
                let a = self.unary();
                let n = self.ast.add(N_UNARY, line);
                self.ast.nodes[n as usize].op = op;
                self.ast.nodes[n as usize].a = a;
                return n;
            }
        }
        let e = self.lhs();
        if self.kind() == T_PUNCT && !self.nl_before() && (self.is("++") || self.is("--")) {
            let k = self.ast.kind(e);
            if !(k == N_IDENT || k == N_MEMBER || k == N_INDEX || k == N_SUPER_MEMBER) {
                self.fail("invalid update target");
            }
            let op = self.text();
            self.next();
            let n = self.ast.add(N_UPDATE, line);
            self.ast.nodes[n as usize].op = op;
            self.ast.nodes[n as usize].a = e;
            return n;
        }
        e
    }

    fn arguments(&mut self) -> Vec<int> {
        self.expect("(");
        let mut args: Vec<int> = Vec::new();
        let saved = self.no_in;
        self.no_in = false;
        while !self.is(")") && self.kind() != T_EOF {
            if self.is("...") {
                let sp = self.node(N_SPREAD);
                self.next();
                let e = self.assign();
                self.ast.nodes[sp as usize].a = e;
                args.push(sp);
            } else {
                let e = self.assign();
                args.push(e);
            }
            if !self.eat(",") {
                break;
            }
        }
        self.no_in = saved;
        self.expect(")");
        args
    }

    /// Member access, calls, `new`, optional chains.
    fn lhs(&mut self) -> int {
        let line = self.line();
        let mut e: int;
        if self.is("new") {
            self.next();
            if self.eat(".") {
                let t = self.ident_name();
                if t.as_str() != "target" {
                    self.fail("new.target expected");
                }
                e = self.ast.add(N_NEW_TARGET, line);
            } else {
                let callee = self.member_only();
                let n = self.ast.add(N_NEW, line);
                self.ast.nodes[n as usize].a = callee;
                if self.is("(") {
                    let args = self.arguments();
                    self.ast.nodes[n as usize].list = args;
                }
                e = n;
            }
        } else if self.is("super") {
            self.next();
            if self.is("(") {
                let args = self.arguments();
                e = self.ast.add(N_SUPER_CALL, line);
                self.ast.nodes[e as usize].list = args;
            } else if self.eat(".") {
                let k = self.ast.add(N_STR, line);
                let name = self.ident_name();
                self.ast.nodes[k as usize].s = name;
                e = self.ast.add(N_SUPER_MEMBER, line);
                self.ast.nodes[e as usize].a = k;
            } else if self.eat("[") {
                let k = self.expression();
                self.expect("]");
                e = self.ast.add(N_SUPER_MEMBER, line);
                self.ast.nodes[e as usize].a = k;
                self.ast.nodes[e as usize].c = 1;
            } else {
                self.fail("unexpected super");
                e = self.ast.add(N_UNDEF, line);
            }
        } else {
            e = self.primary();
        }
        let mut chain = false;
        loop {
            let l = self.line();
            if self.is(".") {
                self.next();
                let n = self.ast.add(N_MEMBER, l);
                if self.kind() == T_PRIVATE {
                    let s = format!("\u{1}#{}", self.text());
                    self.ast.nodes[n as usize].s = s;
                    self.next();
                } else {
                    let name = self.ident_name();
                    self.ast.nodes[n as usize].s = name;
                }
                self.ast.nodes[n as usize].a = e;
                e = n;
            } else if self.is("?.") {
                self.next();
                chain = true;
                if self.kind() == T_PRIVATE {
                    // `o?.#x`
                    let n = self.ast.add(N_MEMBER, l);
                    let s = format!("\u{1}#{}", self.text());
                    self.ast.nodes[n as usize].s = s;
                    self.next();
                    self.ast.nodes[n as usize].a = e;
                    self.ast.nodes[n as usize].d = 1;
                    e = n;
                } else if self.is("(") {
                    let args = self.arguments();
                    let n = self.ast.add(N_CALL, l);
                    self.ast.nodes[n as usize].a = e;
                    self.ast.nodes[n as usize].list = args;
                    self.ast.nodes[n as usize].d = 1;
                    e = n;
                } else if self.eat("[") {
                    let k = self.expression();
                    self.expect("]");
                    let n = self.ast.add(N_INDEX, l);
                    self.ast.nodes[n as usize].a = e;
                    self.ast.nodes[n as usize].b = k;
                    self.ast.nodes[n as usize].d = 1;
                    e = n;
                } else {
                    let n = self.ast.add(N_MEMBER, l);
                    let name = self.ident_name();
                    self.ast.nodes[n as usize].s = name;
                    self.ast.nodes[n as usize].a = e;
                    self.ast.nodes[n as usize].d = 1;
                    e = n;
                }
            } else if self.is("[") {
                self.next();
                let saved = self.no_in;
                self.no_in = false;
                let k = self.expression();
                self.no_in = saved;
                self.expect("]");
                let n = self.ast.add(N_INDEX, l);
                self.ast.nodes[n as usize].a = e;
                self.ast.nodes[n as usize].b = k;
                e = n;
            } else if self.is("(") {
                let args = self.arguments();
                let n = self.ast.add(N_CALL, l);
                self.ast.nodes[n as usize].a = e;
                self.ast.nodes[n as usize].list = args;
                e = n;
            } else if self.kind() == T_TEMPLATE {
                let t = self.template();
                let n = self.ast.add(N_TAGGED, l);
                self.ast.nodes[n as usize].a = e;
                self.ast.nodes[n as usize].b = t;
                e = n;
            } else {
                break;
            }
        }
        if chain {
            let n = self.ast.add(N_OPT_CHAIN, line);
            self.ast.nodes[n as usize].a = e;
            return n;
        }
        e
    }

    /// The callee of `new`: member accesses without calls.
    fn member_only(&mut self) -> int {
        let mut e: int;
        if self.is("new") {
            let line = self.line();
            self.next();
            let callee = self.member_only();
            let n = self.ast.add(N_NEW, line);
            self.ast.nodes[n as usize].a = callee;
            if self.is("(") {
                let args = self.arguments();
                self.ast.nodes[n as usize].list = args;
            }
            e = n;
        } else {
            e = self.primary();
        }
        loop {
            let l = self.line();
            if self.eat(".") {
                let n = self.ast.add(N_MEMBER, l);
                let name = self.ident_name();
                self.ast.nodes[n as usize].s = name;
                self.ast.nodes[n as usize].a = e;
                e = n;
            } else if self.eat("[") {
                let k = self.expression();
                self.expect("]");
                let n = self.ast.add(N_INDEX, l);
                self.ast.nodes[n as usize].a = e;
                self.ast.nodes[n as usize].b = k;
                e = n;
            } else {
                break;
            }
        }
        e
    }

    fn template(&mut self) -> int {
        let n = self.node(N_TEMPLATE);
        let parts = self.toks[self.pos as usize].parts.clone();
        let exprs = self.toks[self.pos as usize].exprs.clone();
        let line = self.line();
        self.next();
        let mut strs: Vec<int> = Vec::new();
        for p in parts {
            let s = self.ast.add(N_STR, line);
            self.ast.nodes[s as usize].s = p;
            strs.push(s);
        }
        let mut es: Vec<int> = Vec::new();
        for src in exprs {
            let mut sp = Parser::new(src.as_str());
            sp.in_function = self.in_function;
            sp.in_class = self.in_class;
            sp.in_async = self.in_async;
            sp.in_generator = self.in_generator;
            let e = sp.expression();
            if sp.kind() != T_EOF && sp.error.is_empty() {
                sp.fail("bad template substitution");
            }
            if !sp.error.is_empty() && self.error.is_empty() {
                self.error = sp.error.clone();
            }
            let g = self.graft(&sp.ast, e);
            es.push(g);
        }
        self.ast.nodes[n as usize].list = strs;
        self.ast.nodes[n as usize].list2 = es;
        n
    }

    fn primary(&mut self) -> int {
        let line = self.line();
        let k = self.kind();
        if k == T_NUM {
            let n = self.node(N_NUM);
            let v = self.toks[self.pos as usize].num;
            self.ast.nodes[n as usize].num = v;
            self.next();
            return n;
        }
        if k == T_STR {
            let n = self.node(N_STR);
            let s = self.text();
            self.ast.nodes[n as usize].s = s;
            self.next();
            return n;
        }
        if k == T_TEMPLATE {
            return self.template();
        }
        if k == T_REGEX {
            let n = self.node(N_REGEX);
            let s = self.text();
            let f = self.toks[self.pos as usize].flags.clone();
            self.ast.nodes[n as usize].s = s;
            self.ast.nodes[n as usize].op = f;
            self.next();
            return n;
        }
        if k == T_PRIVATE {
            // `#x in obj`
            let n = self.node(N_STR);
            let s = format!("\u{1}#{}", self.text());
            self.ast.nodes[n as usize].s = s;
            self.next();
            return n;
        }
        if k == T_IDENT {
            let w = self.text();
            let escaped = self.toks[self.pos as usize].escaped;
            let ws = w.as_str();
            if !escaped {
                if ws == "function" {
                    return self.function(false, 0);
                }
                if ws == "async" && self.peek_is(1, "function") && !self.toks[(self.pos + 1) as usize].nl {
                    self.next();
                    return self.function(false, F_ASYNC);
                }
                if ws == "class" {
                    return self.class(false);
                }
                if ws == "this" {
                    self.next();
                    return self.ast.add(N_THIS, line);
                }
                if ws == "null" {
                    self.next();
                    return self.ast.add(N_NULL, line);
                }
                if ws == "true" {
                    self.next();
                    return self.ast.add(N_TRUE, line);
                }
                if ws == "false" {
                    self.next();
                    return self.ast.add(N_FALSE, line);
                }
                if ws == "import" {
                    self.fail("modules are not supported");
                    return self.ast.add(N_UNDEF, line);
                }
                if is_reserved(ws) {
                    self.fail(format!("unexpected token '{}'", ws).as_str());
                    return self.ast.add(N_UNDEF, line);
                }
            }
            let n = self.node(N_IDENT);
            self.ast.nodes[n as usize].s = w;
            self.next();
            return n;
        }
        if self.is("(") {
            self.next();
            let saved = self.no_in;
            self.no_in = false;
            let e = self.expression();
            self.no_in = saved;
            self.expect(")");
            return e;
        }
        if self.is("[") {
            let n = self.node(N_ARRAY);
            self.next();
            let mut items: Vec<int> = Vec::new();
            let saved = self.no_in;
            self.no_in = false;
            while !self.is("]") && self.kind() != T_EOF {
                if self.is(",") {
                    self.next();
                    let h = self.node(N_HOLE);
                    items.push(h);
                    continue;
                }
                if self.is("...") {
                    let sp = self.node(N_SPREAD);
                    self.next();
                    let e = self.assign();
                    self.ast.nodes[sp as usize].a = e;
                    items.push(sp);
                } else {
                    let e = self.assign();
                    items.push(e);
                }
                if !self.is("]") {
                    self.expect(",");
                }
            }
            self.no_in = saved;
            self.expect("]");
            self.ast.nodes[n as usize].list = items;
            return n;
        }
        if self.is("{") {
            return self.object_literal();
        }
        let t = self.text();
        self.fail(format!("unexpected token '{}'", t).as_str());
        self.ast.add(N_UNDEF, line)
    }

    fn object_literal(&mut self) -> int {
        let n = self.node(N_OBJECT);
        self.next();
        let mut props: Vec<int> = Vec::new();
        let saved = self.no_in;
        self.no_in = false;
        while !self.is("}") && self.kind() != T_EOF {
            let p = self.node(N_PROP);
            if self.eat("...") {
                let e = self.assign();
                self.ast.nodes[p as usize].b = e;
                self.ast.nodes[p as usize].flags = F_SPREAD;
                props.push(p);
                if !self.is("}") {
                    self.expect(",");
                }
                continue;
            }
            let mut flags = 0;
            let mut fflags = 0;
            self.member_start = self.tok_start();
            if self.is("async") && !self.peek_is(1, "(") && !self.peek_is(1, ":") && !self.peek_is(1, ",") && !self.peek_is(1, "}") && !self.peek_is(1, "=") {
                self.next();
                fflags |= F_ASYNC;
            }
            if self.eat("*") {
                fflags |= F_GENERATOR;
            }
            if (self.is("get") || self.is("set")) && !self.peek_is(1, "(") && !self.peek_is(1, ":") && !self.peek_is(1, ",") && !self.peek_is(1, "}") && !self.peek_is(1, "=") {
                if self.is("get") {
                    flags |= F_GETTER;
                } else {
                    flags |= F_SETTER;
                }
                self.next();
            }
            let key_tok_ident = self.kind() == T_IDENT;
            let key_text = self.text();
            let mut computed = false;
            let mut private = false;
            let key = self.prop_key(&mut computed, &mut private);
            if computed {
                flags |= F_COMPUTED;
            }
            self.ast.nodes[p as usize].a = key;
            if self.is("(") {
                let kname = if computed { String::new() } else { self.key_name(key) };
                let f = self.method(fflags | (flags & (F_GETTER | F_SETTER)), kname.as_str());
                self.ast.nodes[p as usize].b = f;
            } else if (flags & (F_GETTER | F_SETTER)) != 0 {
                self.fail("getter or setter without a body");
            } else if self.eat(":") {
                let v = self.assign();
                self.ast.nodes[p as usize].b = v;
            } else if key_tok_ident && !computed {
                // shorthand `{ a }` or, as a pattern, `{ a = 1 }`
                flags |= F_SHORTHAND;
                let id = self.ast.add(N_IDENT, self.line());
                self.ast.nodes[id as usize].s = key_text.clone();
                if self.is("=") {
                    self.next();
                    let d = self.assign();
                    let a = self.ast.add(N_ASSIGN, self.line());
                    self.ast.nodes[a as usize].op = String::from("=");
                    self.ast.nodes[a as usize].a = id;
                    self.ast.nodes[a as usize].b = d;
                    self.ast.nodes[p as usize].b = a;
                } else {
                    if is_reserved(key_text.as_str()) {
                        self.fail("unexpected reserved word");
                    }
                    self.ast.nodes[p as usize].b = id;
                }
            } else {
                self.fail("expected ':' in object literal");
            }
            self.ast.nodes[p as usize].flags = flags;
            props.push(p);
            if !self.is("}") {
                self.expect(",");
            }
        }
        self.no_in = saved;
        self.expect("}");
        self.ast.nodes[n as usize].list = props;
        n
    }
}
