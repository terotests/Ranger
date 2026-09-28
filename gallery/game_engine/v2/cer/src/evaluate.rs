// SPDX-License-Identifier: AGPL-3.0-or-later
//! `eval` and `new Function`: source compiled while the program runs.
//!
//! A direct eval (`eval(src)` where `eval` is the built-in) sees the
//! bindings of its call site: the compiler moved every one of them into a
//! scope object and wrote down where each is (`Proto.evals`). The eval code
//! is compiled as a function whose outer scopes are those scope objects and
//! is called with the caller's scope object and `this`. An indirect eval,
//! and `new Function`, compile global code.

use ranger::prelude::*;

use crate::compiler;
use crate::parser;
use crate::value::*;
use crate::vm::*;

impl Vm {
    /// Compiles eval code; its proto, or -1 with a SyntaxError thrown.
    pub fn compile_eval_code(&mut self, src: &str, outer: &EvalScope, strict: bool) -> int {
        let mut p = parser::Parser::new(src);
        let root = p.parse_program();
        if !p.error.is_empty() {
            self.throw_syntax(p.error.as_str());
            return -1;
        }
        let atoms = self.atoms.clone();
        let names = self.atom_names.clone();
        let base = self.protos.len() as int;
        let mut c = compiler::Compiler::new(p.ast, atoms, names, base);
        let entry = c.compile_eval(root, outer, strict);
        if !c.error.is_empty() || entry < 0 {
            self.throw_syntax(c.error.as_str());
            return -1;
        }
        self.atoms = c.atoms;
        self.atom_names = c.atom_names;
        for pr in c.protos {
            self.protos.push(pr);
        }
        entry
    }

    /// Global eval code: an indirect eval, `new Function`.
    pub fn eval_indirect(&mut self, src: &str) -> Val {
        let none = EvalScope::new();
        let entry = self.compile_eval_code(src, &none, false);
        if entry < 0 {
            return Val::Undef;
        }
        let fp = self.function_proto;
        let f = self.alloc(C_FUNCTION, fp);
        self.objs[f as usize].func = entry;
        let g = Val::Obj(self.global);
        self.call_value(Val::Obj(f), g, Vec::new())
    }

    /// A direct eval at the call site `ei` of `caller`, running in the scope
    /// object `env` with `this`.
    pub fn eval_direct(&mut self, src: &str, caller: int, ei: int, env: int, this: Val) -> Val {
        let outer = self.protos[caller as usize].evals[ei as usize].clone();
        let strict = self.protos[caller as usize].strict;
        let entry = self.compile_eval_code(src, &outer, strict);
        if entry < 0 {
            return Val::Undef;
        }
        let fp = self.function_proto;
        let f = self.alloc(C_FUNCTION, fp);
        self.objs[f as usize].func = entry;
        self.objs[f as usize].env = env;
        self.call_value(Val::Obj(f), this, Vec::new())
    }
}
