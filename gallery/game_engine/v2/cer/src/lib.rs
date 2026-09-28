// SPDX-License-Identifier: AGPL-3.0-or-later
//! CEr: the JavaScript evaluator of ComponentEngine
//! (gallery/game_engine/v2/interp) written again as a strict Rust module
//! (docs/plans/PLAN_RUST_SYNTAX.md), beside it.
//!
//! An experiment in the manner of lib/evgr: one source, built by cargo into
//! native code and by `rgrc` into every Ranger target, measured against the
//! Ranger engine on the same scripts (bench/).
//!
//! The pipeline: `lexer` → `parser` (a tree in an arena) → `compiler`
//! (scopes, closures captured into scope objects, bytecode for a stack
//! machine) → `vm` (objects in an arena with a mark-and-sweep collector,
//! inline caches for property reads and writes). `builtins` / `builtins2`
//! hold the standard library, `regex` a backtracking regular expression
//! engine.

use ranger::prelude::*;

pub mod ast;
pub mod builtins;
pub mod builtins2;
pub mod compiler;
pub mod jsstr;
pub mod lexer;
pub mod num;
pub mod ops;
pub mod parser;
pub mod prelude;
pub mod regex;
pub mod value;
pub mod vm;

use value::*;
use vm::*;

pub struct Engine {
    pub vm: Vm,
    /// the last script's error, empty when it ran to the end
    pub error: String,
}

impl Engine {
    pub fn new() -> Engine {
        let mut vm = Vm::new();
        vm.setup();
        let mut e = Engine { vm: vm, error: String::new() };
        // the built-ins written in JavaScript
        e.eval(prelude::PRELUDE);
        if !e.error.is_empty() {
            e.vm.out.push(format!("prelude: {}", e.error));
        } else {
            e.vm.out.clear();
        }
        e.vm.prelude_protos = e.vm.protos.len() as int;
        e.error = String::new();
        e
    }

    /// Echo `print` / `console.log` lines to stdout as they come.
    pub fn set_echo(&mut self, on: bool) {
        self.vm.echo = on;
    }

    /// Runs a script; answers the value of its last expression statement
    /// as a string, or the uncaught exception (`Uncaught TypeError: …`).
    pub fn eval(&mut self, src: &str) -> String {
        self.error = String::new();
        let mut p = parser::Parser::new(src);
        let root = p.parse_program();
        if !p.error.is_empty() {
            self.error = p.error.clone();
            return self.error.clone();
        }
        let atoms = self.vm.atoms.clone();
        let names = self.vm.atom_names.clone();
        let base = self.vm.protos.len() as int;
        let mut c = compiler::Compiler::new(p.ast, atoms, names, base);
        let entry = c.compile_program(root);
        if !c.error.is_empty() || entry < 0 {
            self.error = if c.error.is_empty() { String::from("SyntaxError") } else { c.error.clone() };
            return self.error.clone();
        }
        self.vm.atoms = c.atoms;
        self.vm.atom_names = c.atom_names;
        for pr in c.protos {
            self.vm.protos.push(pr);
        }
        let fp = self.vm.function_proto;
        let f = self.vm.alloc(C_FUNCTION, fp);
        self.vm.objs[f as usize].func = entry;
        let g = Val::Obj(self.vm.global);
        let r = self.vm.run_program(Val::Obj(f), g);
        if self.vm.throwing {
            return self.uncaught();
        }
        self.vm.run_jobs();
        if self.vm.throwing {
            return self.uncaught();
        }
        self.vm.display(&r)
    }

    /// Runs a script and answers its completion value with its type, as
    /// the conformance harness compares it: `n:<number>`, `s:<string>`,
    /// `b:true`, `u` (undefined), `l` (null), `o:<class>`, or
    /// `t:<exception>` when it threw.
    pub fn eval_typed(&mut self, src: &str) -> String {
        self.error = String::new();
        let mut p = parser::Parser::new(src);
        let root = p.parse_program();
        if !p.error.is_empty() {
            return format!("t:{}", p.error);
        }
        let atoms = self.vm.atoms.clone();
        let names = self.vm.atom_names.clone();
        let base = self.vm.protos.len() as int;
        let mut c = compiler::Compiler::new(p.ast, atoms, names, base);
        let entry = c.compile_program(root);
        if !c.error.is_empty() || entry < 0 {
            return format!("t:{}", c.error);
        }
        self.vm.atoms = c.atoms;
        self.vm.atom_names = c.atom_names;
        for pr in c.protos {
            self.vm.protos.push(pr);
        }
        let fp = self.vm.function_proto;
        let f = self.vm.alloc(C_FUNCTION, fp);
        self.vm.objs[f as usize].func = entry;
        let g = Val::Obj(self.vm.global);
        let r = self.vm.run_program(Val::Obj(f), g);
        if self.vm.throwing {
            let u = self.uncaught();
            return format!("t:{}", u);
        }
        self.vm.run_jobs();
        match &r {
            Val::Undef => String::from("u"),
            Val::Null => String::from("l"),
            Val::Bool(b) => format!("b:{}", b),
            Val::Num(n) => {
                if *n == 0.0 && 1.0 / *n < 0.0 {
                    String::from("n:-0")
                } else {
                    format!("n:{}", num::number_to_string(*n))
                }
            }
            Val::Str(s) => format!("s:{}", s),
            Val::Obj(o) => format!("o:{}", self.vm.objs[*o as usize].class),
        }
    }

    fn uncaught(&mut self) -> String {
        let e = self.vm.exc.clone();
        self.vm.throwing = false;
        self.vm.exc = Val::Undef;
        self.vm.stack.clear();
        self.vm.frames.clear();
        self.vm.handlers.clear();
        self.vm.native_depth = 0;
        let s = self.vm.display(&e);
        self.error = format!("Uncaught {}", s);
        self.error.clone()
    }

    /// Calls a global function by name with no arguments; its result as a
    /// string.
    pub fn call(&mut self, name: &str) -> String {
        let a = self.vm.intern(name);
        let g = self.vm.global;
        let f = self.vm.get_obj(g, a, &Val::Obj(g));
        let r = self.vm.call_value(f, Val::Undef, Vec::new());
        if self.vm.throwing {
            return self.uncaught();
        }
        self.vm.run_jobs();
        self.vm.display(&r)
    }

    pub fn output_count(&self) -> int {
        self.vm.out.len() as int
    }

    pub fn output_at(&self, i: int) -> String {
        self.vm.out[i as usize].clone()
    }

    pub fn clear_output(&mut self) {
        self.vm.out = Vec::new();
    }

    /// The collected lines joined with newlines.
    pub fn output(&self) -> String {
        self.vm.out.join("\n")
    }

    pub fn gc_runs(&self) -> int {
        self.vm.gc_runs
    }

    pub fn heap_size(&self) -> int {
        (self.vm.objs.len() - self.vm.free_list.len()) as int
    }
}
