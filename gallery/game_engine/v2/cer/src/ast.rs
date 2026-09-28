// SPDX-License-Identifier: AGPL-3.0-or-later
//! The syntax tree, kept in an arena: a node is an index into `Ast.nodes`,
//! its children indices (-1 for none).

use ranger::prelude::*;

// expressions
pub const N_NUM: int = 1;
pub const N_STR: int = 2;
pub const N_TEMPLATE: int = 3;
pub const N_IDENT: int = 4;
pub const N_THIS: int = 5;
pub const N_ARRAY: int = 6;
pub const N_OBJECT: int = 7;
pub const N_PROP: int = 8;
pub const N_FUNC: int = 9;
pub const N_CLASS: int = 10;
pub const N_REGEX: int = 11;
pub const N_UNARY: int = 12;
pub const N_UPDATE: int = 13;
pub const N_BINARY: int = 14;
pub const N_LOGICAL: int = 15;
pub const N_ASSIGN: int = 16;
pub const N_COND: int = 17;
pub const N_CALL: int = 18;
pub const N_NEW: int = 19;
pub const N_MEMBER: int = 20;
pub const N_INDEX: int = 21;
pub const N_SEQ: int = 22;
pub const N_SPREAD: int = 23;
pub const N_HOLE: int = 24;
pub const N_NULL: int = 25;
pub const N_TRUE: int = 26;
pub const N_FALSE: int = 27;
pub const N_UNDEF: int = 28;
pub const N_SUPER_CALL: int = 29;
pub const N_SUPER_MEMBER: int = 30;
pub const N_NEW_TARGET: int = 31;
pub const N_TAGGED: int = 32;
pub const N_OPT_CHAIN: int = 33;
pub const N_PAT_DEFAULT: int = 34;
pub const N_REST: int = 35;

// statements
pub const N_VAR: int = 40;
pub const N_DECL: int = 41;
pub const N_EXPR: int = 42;
pub const N_BLOCK: int = 43;
pub const N_IF: int = 44;
pub const N_FOR: int = 45;
pub const N_FORIN: int = 46;
pub const N_WHILE: int = 47;
pub const N_DOWHILE: int = 48;
pub const N_RETURN: int = 49;
pub const N_BREAK: int = 50;
pub const N_CONTINUE: int = 51;
pub const N_THROW: int = 52;
pub const N_TRY: int = 53;
pub const N_SWITCH: int = 54;
pub const N_CASE: int = 55;
pub const N_LABELED: int = 56;
pub const N_EMPTY: int = 57;
pub const N_PROGRAM: int = 58;
pub const N_DEBUGGER: int = 59;
pub const N_WITH: int = 60;
/// `yield a` (flags 1: `yield*`), a = -1 for a bare yield
pub const N_YIELD: int = 61;
/// a BigInt literal: `s` its digits (with a radix prefix)
pub const N_BIGINT: int = 62;

// flags of N_FUNC / N_PROP
pub const F_ARROW: int = 1;
pub const F_METHOD: int = 2;
pub const F_GETTER: int = 4;
pub const F_SETTER: int = 8;
pub const F_STATIC: int = 16;
pub const F_CTOR: int = 32;
pub const F_EXPR_BODY: int = 64;
pub const F_ASYNC: int = 128;
pub const F_GENERATOR: int = 256;
pub const F_DERIVED: int = 512;
pub const F_COMPUTED: int = 1024;
pub const F_DECL: int = 2048;
pub const F_FIELD: int = 4096;
pub const F_SHORTHAND: int = 8192;
pub const F_SPREAD: int = 16384;
pub const F_PRIVATE: int = 32768;
pub const F_STRICT: int = 65536;

pub struct Node {
    pub kind: int,
    /// an operator (`+`, `===`, `+=`, `typeof`, `++`), `var` / `let` /
    /// `const`, `in` / `of`
    pub op: String,
    /// a name or a string value
    pub s: String,
    pub a: int,
    pub b: int,
    pub c: int,
    pub d: int,
    pub list: Vec<int>,
    pub list2: Vec<int>,
    pub num: double,
    pub flags: int,
    pub line: int,
    /// a function's or class's source text (Function.prototype.toString)
    pub text: String,
}

pub struct Ast {
    pub nodes: Vec<Node>,
}

impl Ast {
    pub fn new() -> Ast {
        Ast { nodes: Vec::new() }
    }

    pub fn add(&mut self, kind: int, line: int) -> int {
        self.nodes.push(Node {
            kind: kind,
            op: String::new(),
            s: String::new(),
            a: -1,
            b: -1,
            c: -1,
            d: -1,
            list: Vec::new(),
            list2: Vec::new(),
            num: 0.0,
            flags: 0,
            line: line,
            text: String::new(),
        });
        (self.nodes.len() as int) - 1
    }

    pub fn kind(&self, i: int) -> int {
        if i < 0 {
            return 0;
        }
        self.nodes[i as usize].kind
    }
}
