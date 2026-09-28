// SPDX-License-Identifier: AGPL-3.0-or-later
//! From the tree to bytecode, in two passes.
//!
//! The first pass builds the scopes, declares every binding (with `var` and
//! function hoisting) and resolves each identifier to its binding, marking
//! a binding *captured* when a reference reaches it from inside a nested
//! function. The second pass gives every binding a place -- a stack slot
//! when nothing captures it, a slot of its scope's heap object when
//! something does, a property of the global object at the top level -- and
//! writes the code.

use ranger::prelude::*;
use std::collections::HashMap;

use crate::ast::*;
use crate::num::number_to_string;
use crate::ops::*;
use crate::value::*;

const K_VAR: int = 0;
const K_LET: int = 1;
const K_CONST: int = 2;
const K_FUNC: int = 3;
const K_PARAM: int = 4;
const K_CLASS: int = 5;
const K_CATCH: int = 6;
const K_ARGS: int = 7;
const K_CALLEE: int = 8;

pub struct Binding {
    pub name: String,
    pub kind: int,
    pub captured: bool,
    pub slot: int,
    pub in_env: bool,
    pub scope: int,
    pub global: bool,
    pub placed: bool,
}

pub struct Scope {
    pub parent: int,
    pub is_func: bool,
    pub is_arrow: bool,
    pub is_program: bool,
    pub names: HashMap<String, int>,
    pub binds: Vec<int>,
    pub env_size: int,
    pub has_env: bool,
    pub node: int,
}

// control-stack entries
const CT_LOOP: int = 0;
const CT_SWITCH: int = 1;
const CT_BLOCK: int = 2;
const CT_TRY: int = 3;
const CT_ENV: int = 4;
const CT_ITEM: int = 5;

struct Ctl {
    kind: int,
    labels: Vec<String>,
    breaks: Vec<int>,
    conts: Vec<int>,
    finally_node: int,
    installed: bool,
}

struct FnState {
    proto: Proto,
    next_slot: int,
    ctl: Vec<Ctl>,
    str_consts: HashMap<String, int>,
    num_consts: HashMap<String, int>,
    /// jumps of the optional chain being compiled, to its end
    chain: Vec<Vec<int>>,
    /// labels waiting for the loop that follows them
    pending_labels: Vec<String>,
    is_program: bool,
}

pub struct Compiler {
    pub ast: Ast,
    pub atoms: HashMap<String, int>,
    pub atom_names: Vec<String>,
    pub protos: Vec<Proto>,
    pub proto_base: int,
    pub scopes: Vec<Scope>,
    pub binds: Vec<Binding>,
    node_scope: HashMap<int, int>,
    ref_bind: HashMap<int, int>,
    fs: Vec<FnState>,
    pub error: String,
    /// completion value of the script: slot 0 of the program
    keep_completion: bool,
    /// the innermost scope entered by the code being written
    cur_scope: int,
}

impl Compiler {
    pub fn new(ast: Ast, atoms: HashMap<String, int>, atom_names: Vec<String>, proto_base: int) -> Compiler {
        Compiler {
            ast: ast,
            atoms: atoms,
            atom_names: atom_names,
            protos: Vec::new(),
            proto_base: proto_base,
            scopes: Vec::new(),
            binds: Vec::new(),
            node_scope: HashMap::new(),
            ref_bind: HashMap::new(),
            fs: Vec::new(),
            error: String::new(),
            keep_completion: true,
            cur_scope: -1,
        }
    }

    pub fn atom(&mut self, s: &str) -> int {
        match self.atoms.get(s) {
            Some(a) => *a,
            None => {
                let a = self.atom_names.len() as int;
                self.atom_names.push(String::from(s));
                self.atoms.insert(String::from(s), a);
                a
            }
        }
    }

    fn fail(&mut self, msg: &str) {
        if self.error.is_empty() {
            self.error = String::from(msg);
        }
    }

    // =====================================================================
    // pass 1: scopes and bindings

    fn new_scope(&mut self, parent: int, node: int, is_func: bool, is_arrow: bool) -> int {
        self.scopes.push(Scope {
            parent: parent,
            is_func: is_func,
            is_arrow: is_arrow,
            is_program: false,
            names: HashMap::new(),
            binds: Vec::new(),
            env_size: 0,
            has_env: false,
            node: node,
        });
        let id = (self.scopes.len() as int) - 1;
        if node >= 0 {
            self.node_scope.insert(node, id);
        }
        id
    }

    fn declare(&mut self, scope: int, name: &str, kind: int) -> int {
        let existing = match self.scopes[scope as usize].names.get(name) {
            Some(b) => *b,
            None => -1,
        };
        if existing >= 0 {
            if kind == K_FUNC {
                self.binds[existing as usize].kind = K_FUNC;
            }
            return existing;
        }
        let global = self.scopes[scope as usize].is_program;
        self.binds.push(Binding {
            name: String::from(name),
            kind: kind,
            captured: false,
            slot: -1,
            in_env: false,
            scope: scope,
            global: global,
            placed: false,
        });
        let id = (self.binds.len() as int) - 1;
        self.scopes[scope as usize].names.insert(String::from(name), id);
        self.scopes[scope as usize].binds.push(id);
        id
    }

    fn pattern_names(&self, p: int, out: &mut Vec<String>) {
        if p < 0 {
            return;
        }
        let k = self.ast.nodes[p as usize].kind;
        if k == N_IDENT {
            out.push(self.ast.nodes[p as usize].s.clone());
        } else if k == N_PAT_DEFAULT || k == N_REST {
            self.pattern_names(self.ast.nodes[p as usize].a, out);
        } else if k == N_ARRAY {
            for e in self.ast.nodes[p as usize].list.iter() {
                self.pattern_names(*e, out);
            }
        } else if k == N_OBJECT {
            for pr in self.ast.nodes[p as usize].list.iter() {
                self.pattern_names(self.ast.nodes[*pr as usize].b, out);
            }
        }
    }

    /// `var` declarations of a function body, not entering nested functions.
    fn hoist_vars(&mut self, n: int, scope: int) {
        if n < 0 {
            return;
        }
        let k = self.ast.nodes[n as usize].kind;
        if k == N_FUNC || k == N_CLASS {
            return;
        }
        if k == N_VAR {
            if self.ast.nodes[n as usize].op.as_str() == "var" {
                let decls = self.ast.nodes[n as usize].list.clone();
                for d in decls {
                    let mut names: Vec<String> = Vec::new();
                    self.pattern_names(self.ast.nodes[d as usize].a, &mut names);
                    for nm in names {
                        self.declare(scope, nm.as_str(), K_VAR);
                    }
                }
            }
            return;
        }
        if k == N_EXPR || k == N_RETURN || k == N_THROW {
            return;
        }
        let (a, b, c, d) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c, self.ast.nodes[n as usize].d);
        if k == N_BLOCK || k == N_PROGRAM || k == N_SWITCH || k == N_CASE {
            let list = self.ast.nodes[n as usize].list.clone();
            for s in list {
                self.hoist_vars(s, scope);
            }
            return;
        }
        if k == N_IF {
            self.hoist_vars(b, scope);
            self.hoist_vars(c, scope);
            return;
        }
        if k == N_FOR {
            self.hoist_vars(a, scope);
            self.hoist_vars(d, scope);
            return;
        }
        if k == N_FORIN {
            self.hoist_vars(a, scope);
            self.hoist_vars(c, scope);
            return;
        }
        if k == N_WHILE {
            self.hoist_vars(b, scope);
            return;
        }
        if k == N_DOWHILE || k == N_LABELED {
            self.hoist_vars(a, scope);
            return;
        }
        if k == N_TRY {
            self.hoist_vars(a, scope);
            self.hoist_vars(c, scope);
            self.hoist_vars(d, scope);
        }
    }

    /// let / const / class / function declarations directly in `list`.
    fn declare_lexical(&mut self, list: &Vec<int>, scope: int) {
        for s in list.iter() {
            let n = *s;
            let k = self.ast.nodes[n as usize].kind;
            if k == N_VAR && self.ast.nodes[n as usize].op.as_str() != "var" {
                let kind = if self.ast.nodes[n as usize].op.as_str() == "const" { K_CONST } else { K_LET };
                let decls = self.ast.nodes[n as usize].list.clone();
                for d in decls {
                    let mut names: Vec<String> = Vec::new();
                    self.pattern_names(self.ast.nodes[d as usize].a, &mut names);
                    for nm in names {
                        self.declare(scope, nm.as_str(), kind);
                    }
                }
            } else if k == N_FUNC && (self.ast.nodes[n as usize].flags & F_DECL) != 0 {
                let nm = self.ast.nodes[n as usize].s.clone();
                self.declare(scope, nm.as_str(), K_FUNC);
            } else if k == N_CLASS && (self.ast.nodes[n as usize].flags & F_DECL) != 0 {
                let nm = self.ast.nodes[n as usize].s.clone();
                self.declare(scope, nm.as_str(), K_CLASS);
            }
        }
    }

    fn lookup(&mut self, scope: int, name: &str) -> int {
        let mut s = scope;
        let mut crossed = false;
        loop {
            let found = match self.scopes[s as usize].names.get(name) {
                Some(b) => *b,
                None => -1,
            };
            if found >= 0 {
                if crossed {
                    self.binds[found as usize].captured = true;
                }
                return found;
            }
            let sc = &self.scopes[s as usize];
            if sc.is_func && !sc.is_arrow && !sc.is_program && name == "arguments" {
                let b = self.declare(s, "arguments", K_ARGS);
                if crossed {
                    self.binds[b as usize].captured = true;
                }
                return b;
            }
            if self.scopes[s as usize].is_func {
                crossed = true;
            }
            let p = self.scopes[s as usize].parent;
            if p < 0 {
                return -1;
            }
            s = p;
        }
    }

    fn resolve(&mut self, n: int, scope: int) {
        let name = self.ast.nodes[n as usize].s.clone();
        let b = self.lookup(scope, name.as_str());
        if b >= 0 && !self.binds[b as usize].global {
            self.ref_bind.insert(n, b);
        }
    }

    fn visit_list(&mut self, list: &Vec<int>, scope: int) {
        for x in list.iter() {
            self.visit(*x, scope);
        }
    }

    /// a pattern in binding or assignment position
    fn visit_pattern(&mut self, p: int, scope: int) {
        if p < 0 {
            return;
        }
        let k = self.ast.nodes[p as usize].kind;
        if k == N_IDENT {
            self.resolve(p, scope);
        } else if k == N_PAT_DEFAULT {
            let a = self.ast.nodes[p as usize].a;
            let b = self.ast.nodes[p as usize].b;
            self.visit_pattern(a, scope);
            self.visit(b, scope);
        } else if k == N_REST {
            let a = self.ast.nodes[p as usize].a;
            self.visit_pattern(a, scope);
        } else if k == N_ARRAY {
            let list = self.ast.nodes[p as usize].list.clone();
            for e in list {
                self.visit_pattern(e, scope);
            }
        } else if k == N_OBJECT {
            let list = self.ast.nodes[p as usize].list.clone();
            for pr in list {
                let f = self.ast.nodes[pr as usize].flags;
                if (f & F_COMPUTED) != 0 {
                    let key = self.ast.nodes[pr as usize].a;
                    self.visit(key, scope);
                }
                let v = self.ast.nodes[pr as usize].b;
                self.visit_pattern(v, scope);
            }
        } else {
            self.visit(p, scope);
        }
    }

    fn visit_function(&mut self, n: int, scope: int) {
        let flags = self.ast.nodes[n as usize].flags;
        let arrow = (flags & F_ARROW) != 0;
        let fscope = self.new_scope(scope, n, true, arrow);
        let params = self.ast.nodes[n as usize].list.clone();
        for p in params.iter() {
            let mut names: Vec<String> = Vec::new();
            self.pattern_names(*p, &mut names);
            for nm in names {
                self.declare(fscope, nm.as_str(), K_PARAM);
            }
        }
        let body = self.ast.nodes[n as usize].a;
        if (flags & F_EXPR_BODY) == 0 {
            self.hoist_vars(body, fscope);
            let list = self.ast.nodes[body as usize].list.clone();
            self.declare_lexical(&list, fscope);
        }
        // a named function expression sees its own name
        let name = self.ast.nodes[n as usize].s.clone();
        if !arrow && (flags & (F_DECL | F_METHOD)) == 0 && !name.is_empty() && !self.scopes[fscope as usize].names.contains_key(&name) {
            self.declare(fscope, name.as_str(), K_CALLEE);
        }
        for p in params.iter() {
            self.visit_pattern(*p, fscope);
        }
        if (flags & F_EXPR_BODY) != 0 {
            self.visit(body, fscope);
        } else {
            let list = self.ast.nodes[body as usize].list.clone();
            self.visit_list(&list, fscope);
        }
    }

    fn visit(&mut self, n: int, scope: int) {
        if n < 0 {
            return;
        }
        let k = self.ast.nodes[n as usize].kind;
        let (a, b, c, d) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c, self.ast.nodes[n as usize].d);
        if k == N_IDENT {
            self.resolve(n, scope);
            return;
        }
        if k == N_FUNC {
            self.visit_function(n, scope);
            return;
        }
        if k == N_CLASS {
            let mut inner = scope;
            let name = self.ast.nodes[n as usize].s.clone();
            if (self.ast.nodes[n as usize].flags & F_DECL) == 0 && !name.is_empty() {
                inner = self.new_scope(scope, n, false, false);
                self.declare(inner, name.as_str(), K_CLASS);
            }
            self.visit(a, scope);
            self.visit(b, inner);
            self.visit(c, inner);
            self.visit(d, inner);
            let list = self.ast.nodes[n as usize].list.clone();
            for m in list {
                let f = self.ast.nodes[m as usize].flags;
                if (f & F_COMPUTED) != 0 {
                    let key = self.ast.nodes[m as usize].a;
                    self.visit(key, inner);
                }
                let v = self.ast.nodes[m as usize].b;
                self.visit(v, inner);
            }
            return;
        }
        if k == N_BLOCK {
            let s = self.new_scope(scope, n, false, false);
            let list = self.ast.nodes[n as usize].list.clone();
            self.declare_lexical(&list, s);
            self.visit_list(&list, s);
            return;
        }
        if k == N_PROGRAM {
            let list = self.ast.nodes[n as usize].list.clone();
            self.visit_list(&list, scope);
            return;
        }
        if k == N_FOR {
            let s = self.new_scope(scope, n, false, false);
            if a >= 0 && self.ast.nodes[a as usize].kind == N_VAR {
                self.declare_lexical(&vec![a], s);
            }
            self.visit(a, s);
            self.visit(b, s);
            self.visit(c, s);
            self.visit(d, s);
            return;
        }
        if k == N_FORIN {
            let s = self.new_scope(scope, n, false, false);
            self.visit(b, scope);
            if a >= 0 && self.ast.nodes[a as usize].kind == N_VAR {
                self.declare_lexical(&vec![a], s);
                self.visit(a, s);
            } else {
                self.visit_pattern(a, s);
            }
            self.visit(c, s);
            return;
        }
        if k == N_SWITCH {
            self.visit(a, scope);
            let s = self.new_scope(scope, n, false, false);
            let cases = self.ast.nodes[n as usize].list.clone();
            let mut all: Vec<int> = Vec::new();
            for cs in cases.iter() {
                for st in self.ast.nodes[*cs as usize].list.iter() {
                    all.push(*st);
                }
            }
            self.declare_lexical(&all, s);
            for cs in cases {
                let t = self.ast.nodes[cs as usize].a;
                self.visit(t, s);
                let body = self.ast.nodes[cs as usize].list.clone();
                self.visit_list(&body, s);
            }
            return;
        }
        if k == N_TRY {
            self.visit(a, scope);
            if c >= 0 {
                // the catch parameter lives in the catch block's scope
                let s = self.new_scope(scope, c, false, false);
                let mut names: Vec<String> = Vec::new();
                self.pattern_names(b, &mut names);
                for nm in names {
                    self.declare(s, nm.as_str(), K_CATCH);
                }
                self.visit_pattern(b, s);
                let list = self.ast.nodes[c as usize].list.clone();
                self.declare_lexical(&list, s);
                self.visit_list(&list, s);
            }
            self.visit(d, scope);
            return;
        }
        if k == N_VAR {
            let decls = self.ast.nodes[n as usize].list.clone();
            for dcl in decls {
                let t = self.ast.nodes[dcl as usize].a;
                let init = self.ast.nodes[dcl as usize].b;
                self.visit_pattern(t, scope);
                self.visit(init, scope);
            }
            return;
        }
        if k == N_ASSIGN {
            let op = self.ast.nodes[n as usize].op.clone();
            if op.as_str() == "=" {
                self.visit_pattern(a, scope);
            } else {
                self.visit(a, scope);
            }
            self.visit(b, scope);
            return;
        }
        if k == N_OBJECT {
            let list = self.ast.nodes[n as usize].list.clone();
            for pr in list {
                let f = self.ast.nodes[pr as usize].flags;
                if (f & F_COMPUTED) != 0 {
                    let key = self.ast.nodes[pr as usize].a;
                    self.visit(key, scope);
                }
                let v = self.ast.nodes[pr as usize].b;
                self.visit(v, scope);
            }
            return;
        }
        if k == N_MEMBER || k == N_LABELED || k == N_EXPR || k == N_RETURN || k == N_THROW || k == N_UNARY || k == N_UPDATE || k == N_SPREAD || k == N_OPT_CHAIN || k == N_REST {
            self.visit(a, scope);
            return;
        }
        if k == N_SUPER_MEMBER {
            if c == 1 {
                self.visit(a, scope);
            }
            return;
        }
        if k == N_PAT_DEFAULT {
            self.visit_pattern(a, scope);
            self.visit(b, scope);
            return;
        }
        // generic: children
        self.visit(a, scope);
        self.visit(b, scope);
        if k != N_PROP {
            self.visit(c, scope);
            if !(k == N_MEMBER || k == N_INDEX || k == N_CALL) {
                self.visit(d, scope);
            }
        }
        let list = self.ast.nodes[n as usize].list.clone();
        self.visit_list(&list, scope);
        let list2 = self.ast.nodes[n as usize].list2.clone();
        self.visit_list(&list2, scope);
    }

    // =====================================================================
    // pass 2: code

    fn f(&mut self) -> &mut FnState {
        let i = self.fs.len() - 1;
        &mut self.fs[i]
    }

    fn pc(&self) -> int {
        self.fs[self.fs.len() - 1].proto.code.len() as int
    }

    fn emit(&mut self, code: int, a: int, b: int) -> int {
        let i = self.fs.len() - 1;
        self.fs[i].proto.code.push(Op { code: code, a: a, b: b, c: -1 });
        (self.fs[i].proto.code.len() as int) - 1
    }

    fn op(&mut self, code: int) {
        self.emit(code, 0, 0);
    }

    /// Points the jump at `at` to here.
    fn patch(&mut self, at: int) {
        let here = self.pc();
        let i = self.fs.len() - 1;
        self.fs[i].proto.code[at as usize].a = here;
    }

    fn patch_to(&mut self, at: int, target: int) {
        let i = self.fs.len() - 1;
        self.fs[i].proto.code[at as usize].a = target;
    }

    fn str_const(&mut self, s: &str) -> int {
        let found = match self.f().str_consts.get(s) {
            Some(i) => *i,
            None => -1,
        };
        if found >= 0 {
            return found;
        }
        let f = self.f();
        let i = f.proto.consts.len() as int;
        f.proto.consts.push(str_val(s));
        f.str_consts.insert(String::from(s), i);
        i
    }

    fn num_const(&mut self, v: double) -> int {
        let key = if v == 0.0 && 1.0 / v < 0.0 { String::from("-0") } else { number_to_string(v) };
        let found = match self.f().num_consts.get(&key) {
            Some(i) => *i,
            None => -1,
        };
        if found >= 0 {
            return found;
        }
        let f = self.f();
        let i = f.proto.consts.len() as int;
        f.proto.consts.push(Val::Num(v));
        f.num_consts.insert(key, i);
        i
    }

    fn push_num(&mut self, v: double) {
        if v == ((v as int) as double) && v > -1073741824.0 && v < 1073741824.0 && !(v == 0.0 && 1.0 / v < 0.0) {
            self.emit(OP_INT, v as int, 0);
        } else {
            let c = self.num_const(v);
            self.emit(OP_CONST, c, 0);
        }
    }

    fn push_str(&mut self, s: &str) {
        let c = self.str_const(s);
        self.emit(OP_CONST, c, 0);
    }

    /// Places the bindings of `scope` in this function: slots or scope
    /// object slots. Emits PUSH_ENV when the scope is a block with a scope
    /// object; answers whether it did.
    fn enter_scope(&mut self, scope: int, is_fn: bool) -> bool {
        if scope < 0 {
            return false;
        }
        let binds = self.scopes[scope as usize].binds.clone();
        let mut env_size: int = 0;
        for b in binds.iter() {
            let bi = *b as usize;
            if self.binds[bi].global || self.binds[bi].placed {
                continue;
            }
            if self.binds[bi].captured {
                self.binds[bi].in_env = true;
                self.binds[bi].slot = env_size;
                env_size += 1;
            } else {
                let s = self.f().next_slot;
                self.binds[bi].slot = s;
                self.f().next_slot = s + 1;
            }
            self.binds[bi].placed = true;
        }
        self.scopes[scope as usize].env_size = env_size;
        self.scopes[scope as usize].has_env = env_size > 0;
        if env_size > 0 && !is_fn {
            self.emit(OP_PUSH_ENV, env_size, 0);
            self.f().ctl.push(Ctl { kind: CT_ENV, labels: Vec::new(), breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
            return true;
        }
        false
    }

    fn leave_scope(&mut self, pushed: bool) {
        if pushed {
            self.op(OP_POP_ENV);
            self.f().ctl.pop();
        }
    }

    /// How many scope objects lie between the code being compiled (in
    /// `from`) and the binding's scope.
    fn env_depth(&self, from: int, target: int) -> int {
        let mut d: int = 0;
        let mut s = from;
        while s >= 0 && s != target {
            if self.scopes[s as usize].has_env {
                d += 1;
            }
            s = self.scopes[s as usize].parent;
        }
        d
    }

    fn load_name(&mut self, n: int) {
        let name = self.ast.nodes[n as usize].s.clone();
        let b = match self.ref_bind.get(&n) {
            Some(x) => *x,
            None => -1,
        };
        if b < 0 {
            if name.as_str() == "undefined" {
                self.op(OP_UNDEF);
                return;
            }
            let a = self.atom(name.as_str());
            self.emit(OP_GET_GLOBAL, a, 0);
            return;
        }
        self.load_bind(b);
    }

    fn load_bind(&mut self, b: int) {
        let bd = &self.binds[b as usize];
        if bd.in_env {
            let slot = bd.slot;
            let depth = self.env_depth(self.cur_scope, bd.scope);
            self.emit(OP_GET_ENV, depth, slot);
        } else {
            let slot = bd.slot;
            self.emit(OP_GET_LOCAL, slot, 0);
        }
    }

    /// Stores the top of the stack in the binding, keeping it on the stack.
    fn store_bind(&mut self, b: int, init: bool) {
        let bd = &self.binds[b as usize];
        if bd.kind == K_CONST && !init {
            let nm = bd.name.clone();
            let c = self.str_const(nm.as_str());
            self.emit(OP_CONST_ERROR, c, 0);
            return;
        }
        if bd.global {
            let nm = bd.name.clone();
            let a = self.atom(nm.as_str());
            self.emit(OP_SET_GLOBAL, a, 0);
            return;
        }
        if bd.in_env {
            let slot = bd.slot;
            let depth = self.env_depth(self.cur_scope, bd.scope);
            self.emit(OP_SET_ENV, depth, slot);
        } else {
            let slot = bd.slot;
            self.emit(OP_SET_LOCAL, slot, 0);
        }
    }

    fn store_name(&mut self, n: int, init: bool) {
        let name = self.ast.nodes[n as usize].s.clone();
        let b = match self.ref_bind.get(&n) {
            Some(x) => *x,
            None => -1,
        };
        if b < 0 {
            // a global (declared at the top level or not at all)
            let gb = self.global_binding(name.as_str());
            if gb >= 0 && self.binds[gb as usize].kind == K_CONST && !init {
                let c = self.str_const(name.as_str());
                self.emit(OP_CONST_ERROR, c, 0);
                return;
            }
            let a = self.atom(name.as_str());
            self.emit(OP_SET_GLOBAL, a, 0);
            return;
        }
        self.store_bind(b, init);
    }

    fn global_binding(&self, name: &str) -> int {
        if self.scopes.is_empty() {
            return -1;
        }
        match self.scopes[0].names.get(name) {
            Some(b) => *b,
            None => -1,
        }
    }

    // ---- functions

    pub fn compile_program(&mut self, root: int) -> int {
        let s = self.new_scope(-1, root, true, false);
        self.scopes[s as usize].is_program = true;
        self.hoist_vars(root, s);
        let list = self.ast.nodes[root as usize].list.clone();
        self.declare_lexical(&list, s);
        self.visit(root, s);
        if !self.error.is_empty() {
            return -1;
        }
        let strict = (self.ast.nodes[root as usize].flags & F_STRICT) != 0;
        let mut proto = Proto::new("<script>");
        proto.strict = strict;
        self.fs.push(FnState {
            proto: proto,
            next_slot: 1,
            ctl: Vec::new(),
            str_consts: HashMap::new(),
            num_consts: HashMap::new(),
            chain: Vec::new(),
            pending_labels: Vec::new(),
            is_program: true,
        });
        self.cur_scope = s;
        // top-level vars exist before the code runs
        let binds = self.scopes[s as usize].binds.clone();
        for b in binds {
            let k = self.binds[b as usize].kind;
            if k == K_VAR {
                let nm = self.binds[b as usize].name.clone();
                let a = self.atom(nm.as_str());
                self.emit(OP_DECL_GLOBAL, a, 0);
            }
        }
        self.hoist_functions(&list);
        self.op(OP_UNDEF);
        self.emit(OP_SET_LOCAL, 0, 0);
        self.op(OP_POP);
        for st in list {
            self.statement(st);
        }
        self.emit(OP_GET_LOCAL, 0, 0);
        self.op(OP_RETURN);
        let fs = self.fs.pop().unwrap();
        let mut p = fs.proto;
        p.nslots = fs.next_slot;
        self.protos.push(p);
        self.proto_base + (self.protos.len() as int) - 1
    }

    /// Function declarations of a body, made before its statements run.
    fn hoist_functions(&mut self, list: &Vec<int>) {
        for s in list.iter() {
            let n = *s;
            if self.ast.nodes[n as usize].kind == N_FUNC && (self.ast.nodes[n as usize].flags & F_DECL) != 0 {
                let p = self.function(n);
                self.emit(OP_CLOSURE, p, 0);
                let name = self.ast.nodes[n as usize].s.clone();
                let b = self.lookup_here(name.as_str());
                if b >= 0 {
                    self.store_bind(b, true);
                } else {
                    let a = self.atom(name.as_str());
                    self.emit(OP_SET_GLOBAL, a, 0);
                }
                self.op(OP_POP);
            }
        }
    }

    /// The binding a name has in the current scope chain (no capture marks).
    fn lookup_here(&self, name: &str) -> int {
        let mut s = self.cur_scope;
        while s >= 0 {
            if let Some(b) = self.scopes[s as usize].names.get(name) {
                return *b;
            }
            s = self.scopes[s as usize].parent;
        }
        -1
    }

    /// Compiles the function node `n`; answers its proto index.
    fn function(&mut self, n: int) -> int {
        let flags = self.ast.nodes[n as usize].flags;
        let scope = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let name = self.ast.nodes[n as usize].s.clone();
        let mut proto = Proto::new(name.as_str());
        proto.arrow = (flags & F_ARROW) != 0;
        let outer_strict = if self.fs.is_empty() { false } else { self.fs[self.fs.len() - 1].proto.strict };
        proto.strict = outer_strict || (flags & (F_STRICT | F_METHOD)) != 0;
        proto.method = (flags & F_METHOD) != 0;
        proto.class_ctor = (flags & F_CTOR) != 0;
        proto.derived = (flags & F_DERIVED) != 0;
        proto.getter_setter = (flags & (F_GETTER | F_SETTER)) != 0;
        let params = self.ast.nodes[n as usize].list.clone();
        let saved_scope = self.cur_scope;
        self.fs.push(FnState {
            proto: proto,
            next_slot: params.len() as int,
            ctl: Vec::new(),
            str_consts: HashMap::new(),
            num_consts: HashMap::new(),
            chain: Vec::new(),
            pending_labels: Vec::new(),
            is_program: false,
        });
        self.cur_scope = scope;
        // parameters arrive in slots 0..; a simple one is its own binding
        let mut length: int = 0;
        let mut counting = true;
        let mut i: int = 0;
        for p in params.iter() {
            let pk = self.ast.nodes[*p as usize].kind;
            if pk == N_REST {
                self.f().proto.rest = i;
                counting = false;
            } else if pk == N_PAT_DEFAULT {
                counting = false;
            } else if counting {
                length += 1;
            }
            if pk == N_IDENT {
                let nm = self.ast.nodes[*p as usize].s.clone();
                let b = match self.scopes[scope as usize].names.get(&nm) {
                    Some(x) => *x,
                    None => -1,
                };
                if b >= 0 && !self.binds[b as usize].captured && !self.binds[b as usize].placed {
                    self.binds[b as usize].slot = i;
                    self.binds[b as usize].placed = true;
                }
            }
            i += 1;
        }
        self.f().proto.nparams = params.len() as int;
        self.f().proto.length = length;
        self.enter_scope(scope, true);
        let env_size = self.scopes[scope as usize].env_size;
        self.f().proto.env_size = env_size;
        // captured simple parameters move into the scope object
        let mut j: int = 0;
        for p in params.iter() {
            if self.ast.nodes[*p as usize].kind == N_IDENT {
                let nm = self.ast.nodes[*p as usize].s.clone();
                let b = match self.scopes[scope as usize].names.get(&nm) {
                    Some(x) => *x,
                    None => -1,
                };
                if b >= 0 && self.binds[b as usize].in_env {
                    self.emit(OP_GET_LOCAL, j, 0);
                    self.store_bind(b, true);
                    self.op(OP_POP);
                }
            }
            j += 1;
        }
        // `arguments` and the function's own name
        let binds = self.scopes[scope as usize].binds.clone();
        for b in binds.iter() {
            let k = self.binds[*b as usize].kind;
            if k == K_ARGS {
                self.f().proto.uses_args = true;
                self.op(OP_ARGUMENTS);
                self.store_bind(*b, true);
                self.op(OP_POP);
            } else if k == K_CALLEE {
                self.op(OP_CALLEE);
                self.store_bind(*b, true);
                self.op(OP_POP);
            }
        }
        // defaults and destructuring of parameters, in order
        let mut pi: int = 0;
        for p in params.iter() {
            let pk = self.ast.nodes[*p as usize].kind;
            if pk != N_IDENT {
                self.emit(OP_GET_LOCAL, pi, 0);
                if pk == N_REST {
                    let t = self.ast.nodes[*p as usize].a;
                    self.assign_pattern(t, true);
                } else {
                    self.assign_pattern(*p, true);
                }
            }
            pi += 1;
        }
        let body = self.ast.nodes[n as usize].a;
        if (flags & F_EXPR_BODY) != 0 {
            self.expr(body);
            self.op(OP_RETURN);
        } else {
            let list = self.ast.nodes[body as usize].list.clone();
            self.hoist_functions(&list);
            for st in list {
                self.statement(st);
            }
            self.op(OP_RETURN_UNDEF);
        }
        let fs = self.fs.pop().unwrap();
        let mut p = fs.proto;
        p.nslots = fs.next_slot;
        self.protos.push(p);
        self.cur_scope = saved_scope;
        self.proto_base + (self.protos.len() as int) - 1
    }

    // ---- statements

    fn statement(&mut self, n: int) {
        if n < 0 {
            return;
        }
        let k = self.ast.nodes[n as usize].kind;
        let (a, b, c, d) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c, self.ast.nodes[n as usize].d);
        if k != N_LABELED && !(k == N_FOR || k == N_FORIN || k == N_WHILE || k == N_DOWHILE) {
            self.f().pending_labels.clear();
        }
        if k == N_EXPR {
            self.expr_statement(a);
            return;
        }
        if k == N_VAR {
            self.var_statement(n);
            return;
        }
        if k == N_FUNC {
            return; // hoisted
        }
        if k == N_CLASS {
            self.class(n);
            let name = self.ast.nodes[n as usize].s.clone();
            let bnd = self.lookup_here(name.as_str());
            if bnd >= 0 {
                self.store_bind(bnd, true);
            } else {
                let at = self.atom(name.as_str());
                self.emit(OP_SET_GLOBAL, at, 0);
            }
            self.op(OP_POP);
            return;
        }
        if k == N_BLOCK {
            self.block(n);
            return;
        }
        if k == N_EMPTY {
            return;
        }
        if k == N_IF {
            self.cond_jump_false(a);
            let jf = self.last_jump();
            self.statement(b);
            if c >= 0 {
                let j = self.emit(OP_JUMP, 0, 0);
                self.patch(jf);
                self.statement(c);
                self.patch(j);
            } else {
                self.patch(jf);
            }
            return;
        }
        if k == N_WHILE {
            let labels = self.take_labels();
            let top = self.pc();
            self.cond_jump_false(a);
            let jf = self.last_jump();
            self.push_loop(labels);
            self.statement(b);
            let ctl = self.f().ctl.pop().unwrap();
            for x in ctl.conts.iter() {
                self.patch_to(*x, top);
            }
            self.emit(OP_JUMP, top, 0);
            self.patch(jf);
            for x in ctl.breaks.iter() {
                self.patch(*x);
            }
            return;
        }
        if k == N_DOWHILE {
            let labels = self.take_labels();
            let top = self.pc();
            self.push_loop(labels);
            self.statement(a);
            let ctl = self.f().ctl.pop().unwrap();
            for x in ctl.conts.iter() {
                self.patch(*x);
            }
            self.expr(b);
            self.emit(OP_JT, top, 0);
            for x in ctl.breaks.iter() {
                self.patch(*x);
            }
            return;
        }
        if k == N_FOR {
            self.for_statement(n);
            return;
        }
        if k == N_FORIN {
            self.forin_statement(n);
            return;
        }
        if k == N_RETURN {
            if a >= 0 {
                self.expr(a);
            } else {
                self.op(OP_UNDEF);
            }
            self.unwind_to(-1, false);
            self.op(OP_RETURN);
            return;
        }
        if k == N_THROW {
            self.expr(a);
            self.op(OP_THROW);
            return;
        }
        if k == N_BREAK || k == N_CONTINUE {
            let label = self.ast.nodes[n as usize].s.clone();
            let target = self.find_target(label.as_str(), k == N_CONTINUE);
            if target < 0 {
                self.fail("SyntaxError: illegal break or continue");
                return;
            }
            self.unwind_to(target, k == N_CONTINUE);
            let j = self.emit(OP_JUMP, 0, 0);
            let f = self.f();
            if k == N_BREAK {
                f.ctl[target as usize].breaks.push(j);
            } else {
                f.ctl[target as usize].conts.push(j);
            }
            return;
        }
        if k == N_LABELED {
            let label = self.ast.nodes[n as usize].s.clone();
            let bk = self.ast.nodes[a as usize].kind;
            if bk == N_FOR || bk == N_FORIN || bk == N_WHILE || bk == N_DOWHILE || bk == N_LABELED {
                self.f().pending_labels.push(label);
                self.statement(a);
                return;
            }
            self.f().ctl.push(Ctl { kind: CT_BLOCK, labels: vec![label], breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
            self.statement(a);
            let ctl = self.f().ctl.pop().unwrap();
            for x in ctl.breaks.iter() {
                self.patch(*x);
            }
            return;
        }
        if k == N_TRY {
            self.try_statement(n);
            return;
        }
        if k == N_SWITCH {
            self.switch_statement(n);
            return;
        }
        let _ = d;
        self.fail("SyntaxError: unsupported statement");
    }

    fn take_labels(&mut self) -> Vec<String> {
        let l = self.f().pending_labels.clone();
        self.f().pending_labels.clear();
        l
    }

    fn push_loop(&mut self, labels: Vec<String>) {
        self.f().ctl.push(Ctl { kind: CT_LOOP, labels: labels, breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
    }

    fn last_jump(&self) -> int {
        self.pc() - 1
    }

    /// The control entry a break / continue goes to; -1 when none.
    fn find_target(&self, label: &str, cont: bool) -> int {
        let f = &self.fs[self.fs.len() - 1];
        let mut i = (f.ctl.len() as int) - 1;
        while i >= 0 {
            let c = &f.ctl[i as usize];
            if label.is_empty() {
                if c.kind == CT_LOOP || (!cont && c.kind == CT_SWITCH) {
                    return i;
                }
            } else {
                let mut has = false;
                for l in c.labels.iter() {
                    if l.as_str() == label {
                        has = true;
                    }
                }
                if has {
                    if cont && c.kind != CT_LOOP {
                        return -1;
                    }
                    return i;
                }
            }
            i -= 1;
        }
        -1
    }

    /// Leaves every entry above `target` (-1: all, for `return`): pops
    /// handlers and runs `finally` blocks, pops scope objects and stack
    /// items (not for `return`, whose frame goes whole).
    fn unwind_to(&mut self, target: int, _cont: bool) {
        let top = (self.f().ctl.len() as int) - 1;
        let mut i = top;
        let ret = target < 0;
        while i > target {
            let kind = self.f().ctl[i as usize].kind;
            if kind == CT_TRY {
                if self.f().ctl[i as usize].installed {
                    self.op(OP_END_TRY);
                }
                let fin = self.f().ctl[i as usize].finally_node;
                if fin >= 0 {
                    // the finally block runs with the entries below it
                    let saved: Vec<Ctl> = self.split_ctl(i);
                    if ret {
                        // keep the return value under the finally block
                        self.block(fin);
                    } else {
                        self.block(fin);
                    }
                    self.join_ctl(saved);
                }
            } else if kind == CT_ENV && !ret {
                self.op(OP_POP_ENV);
            } else if kind == CT_ITEM && !ret {
                self.op(OP_POP);
            }
            i -= 1;
        }
    }

    fn split_ctl(&mut self, at: int) -> Vec<Ctl> {
        let mut rest: Vec<Ctl> = Vec::new();
        while (self.f().ctl.len() as int) > at {
            let c = self.f().ctl.pop().unwrap();
            rest.push(c);
        }
        rest
    }

    fn join_ctl(&mut self, mut saved: Vec<Ctl>) {
        while !saved.is_empty() {
            let c = saved.pop().unwrap();
            self.f().ctl.push(c);
        }
    }

    fn block(&mut self, n: int) {
        let scope = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let saved = self.cur_scope;
        if scope >= 0 {
            self.cur_scope = scope;
        }
        let pushed = self.enter_scope(scope, false);
        let list = self.ast.nodes[n as usize].list.clone();
        self.hoist_functions(&list);
        for st in list {
            self.statement(st);
        }
        self.leave_scope(pushed);
        self.cur_scope = saved;
    }

    fn expr_statement(&mut self, e: int) {
        let k = self.ast.nodes[e as usize].kind;
        // `i++` / `i += 1` on a local: in place
        if k == N_UPDATE {
            let t = self.ast.nodes[e as usize].a;
            if self.ast.nodes[t as usize].kind == N_IDENT {
                let b = match self.ref_bind.get(&t) {
                    Some(x) => *x,
                    None => -1,
                };
                if b >= 0 && !self.binds[b as usize].in_env && !self.binds[b as usize].global && self.binds[b as usize].kind != K_CONST {
                    let slot = self.binds[b as usize].slot;
                    let delta = if self.ast.nodes[e as usize].op.as_str() == "++" { 1 } else { -1 };
                    self.emit(OP_INC_LOCAL, slot, delta);
                    return;
                }
            }
        }
        let is_program_top = self.fs.len() == 1 && self.fs[0].is_program && self.f().ctl.is_empty() && self.keep_completion;
        if k == N_ASSIGN && self.ast.nodes[e as usize].op.as_str() == "define" {
            self.define_field(e);
            self.op(OP_POP);
            return;
        }
        self.expr(e);
        if is_program_top {
            self.emit(OP_SET_LOCAL, 0, 0);
        }
        self.op(OP_POP);
    }

    fn var_statement(&mut self, n: int) {
        let kw = self.ast.nodes[n as usize].op.clone();
        let decls = self.ast.nodes[n as usize].list.clone();
        for d in decls {
            let t = self.ast.nodes[d as usize].a;
            let init = self.ast.nodes[d as usize].b;
            if init >= 0 {
                self.expr_named(init, t);
                self.assign_pattern(t, true);
            } else if kw.as_str() != "var" {
                self.op(OP_UNDEF);
                self.assign_pattern(t, true);
            }
        }
    }

    fn for_statement(&mut self, n: int) {
        let (a, b, c, d) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c, self.ast.nodes[n as usize].d);
        let labels = self.take_labels();
        let scope = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let saved = self.cur_scope;
        self.cur_scope = scope;
        let pushed = self.enter_scope(scope, false);
        if a >= 0 {
            if self.ast.nodes[a as usize].kind == N_VAR {
                self.var_statement(a);
            } else {
                self.statement(a);
            }
        }
        let top = self.pc();
        let mut jf: int = -1;
        if b >= 0 {
            self.cond_jump_false(b);
            jf = self.last_jump();
        }
        self.push_loop(labels);
        self.statement(d);
        let ctl = self.f().ctl.pop().unwrap();
        for x in ctl.conts.iter() {
            self.patch(*x);
        }
        if pushed {
            self.op(OP_COPY_ENV);
        }
        if c >= 0 {
            self.expr_statement(c);
        }
        self.emit(OP_JUMP, top, 0);
        if jf >= 0 {
            self.patch(jf);
        }
        for x in ctl.breaks.iter() {
            self.patch(*x);
        }
        self.leave_scope(pushed);
        self.cur_scope = saved;
    }

    fn forin_statement(&mut self, n: int) {
        let (a, b, c) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c);
        let of = self.ast.nodes[n as usize].op.as_str() == "of";
        let labels = self.take_labels();
        self.expr(b);
        if of {
            self.op(OP_ITER_VALUES);
        } else {
            self.op(OP_ITER_KEYS);
        }
        self.f().ctl.push(Ctl { kind: CT_ITEM, labels: Vec::new(), breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
        let top = self.pc();
        let next = self.emit(OP_ITER_NEXT, 0, 0);
        self.push_loop(labels);
        let scope = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let saved = self.cur_scope;
        self.cur_scope = scope;
        // a fresh scope object per iteration
        for bi in self.scopes[scope as usize].binds.clone() {
            self.binds[bi as usize].placed = false;
        }
        let pushed = self.enter_scope(scope, false);
        let target = if a >= 0 && self.ast.nodes[a as usize].kind == N_VAR {
            let decl = self.ast.nodes[a as usize].list[0];
            self.ast.nodes[decl as usize].a
        } else {
            a
        };
        self.assign_pattern(target, true);
        self.statement(c);
        self.leave_scope(pushed);
        self.cur_scope = saved;
        let ctl = self.f().ctl.pop().unwrap();
        let cont = self.pc();
        for x in ctl.conts.iter() {
            self.patch_to(*x, cont);
        }
        self.emit(OP_JUMP, top, 0);
        self.patch(next);
        for x in ctl.breaks.iter() {
            self.patch(*x);
        }
        self.f().ctl.pop();
        self.op(OP_POP);
    }

    fn try_statement(&mut self, n: int) {
        let (a, b, c, d) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c, self.ast.nodes[n as usize].d);
        let t = self.emit(OP_TRY, 0, 0);
        self.f().ctl.push(Ctl { kind: CT_TRY, labels: Vec::new(), breaks: Vec::new(), conts: Vec::new(), finally_node: d, installed: true });
        self.block(a);
        self.f().ctl.pop();
        self.op(OP_END_TRY);
        if d >= 0 {
            self.block(d);
        }
        let j_end = self.emit(OP_JUMP, 0, 0);
        self.patch(t);
        // [exception]
        if c >= 0 {
            let mut t2: int = -1;
            if d >= 0 {
                t2 = self.emit(OP_TRY, 0, 0);
                self.f().ctl.push(Ctl { kind: CT_TRY, labels: Vec::new(), breaks: Vec::new(), conts: Vec::new(), finally_node: d, installed: true });
            }
            let scope = match self.node_scope.get(&c) {
                Some(s) => *s,
                None => -1,
            };
            let saved = self.cur_scope;
            self.cur_scope = scope;
            let pushed = self.enter_scope(scope, false);
            if b >= 0 {
                self.assign_pattern(b, true);
            } else {
                self.op(OP_POP);
            }
            let list = self.ast.nodes[c as usize].list.clone();
            self.hoist_functions(&list);
            for st in list {
                self.statement(st);
            }
            self.leave_scope(pushed);
            self.cur_scope = saved;
            if d >= 0 {
                self.f().ctl.pop();
                self.op(OP_END_TRY);
                self.block(d);
                let j2 = self.emit(OP_JUMP, 0, 0);
                self.patch(t2);
                self.block(d);
                self.op(OP_THROW);
                self.patch(j2);
            }
        } else {
            self.block(d);
            self.op(OP_THROW);
        }
        self.patch(j_end);
    }

    fn switch_statement(&mut self, n: int) {
        let a = self.ast.nodes[n as usize].a;
        self.expr(a);
        self.f().ctl.push(Ctl { kind: CT_ITEM, labels: Vec::new(), breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
        let scope = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let saved = self.cur_scope;
        self.cur_scope = scope;
        let pushed = self.enter_scope(scope, false);
        let labels = self.take_labels();
        self.f().ctl.push(Ctl { kind: CT_SWITCH, labels: labels, breaks: Vec::new(), conts: Vec::new(), finally_node: -1, installed: false });
        let cases = self.ast.nodes[n as usize].list.clone();
        let mut jumps: Vec<int> = Vec::new();
        let mut default_case: int = -1;
        let mut all: Vec<int> = Vec::new();
        for cs in cases.iter() {
            for st in self.ast.nodes[*cs as usize].list.iter() {
                all.push(*st);
            }
        }
        self.hoist_functions(&all);
        let mut idx: int = 0;
        for cs in cases.iter() {
            let t = self.ast.nodes[*cs as usize].a;
            if t < 0 {
                default_case = idx;
                jumps.push(-1);
            } else {
                self.op(OP_DUP);
                self.expr(t);
                self.op(OP_SEQ);
                let j = self.emit(OP_JT, 0, 0);
                jumps.push(j);
            }
            idx += 1;
        }
        let j_default = self.emit(OP_JUMP, 0, 0);
        let mut i: int = 0;
        for cs in cases.iter() {
            if i == default_case {
                self.patch(j_default);
            } else {
                self.patch(jumps[i as usize]);
            }
            let body = self.ast.nodes[*cs as usize].list.clone();
            for st in body {
                self.statement(st);
            }
            i += 1;
        }
        if default_case < 0 {
            self.patch(j_default);
        }
        let ctl = self.f().ctl.pop().unwrap();
        for x in ctl.breaks.iter() {
            self.patch(*x);
        }
        self.leave_scope(pushed);
        self.cur_scope = saved;
        self.f().ctl.pop();
        self.op(OP_POP);
    }

    /// Code that jumps when `e` is false; the jump is the last op written.
    fn cond_jump_false(&mut self, e: int) {
        let k = self.ast.nodes[e as usize].kind;
        if k == N_BINARY {
            let op = self.ast.nodes[e as usize].op.clone();
            let code = compare_code(op.as_str());
            if code > 0 {
                let a = self.ast.nodes[e as usize].a;
                let b = self.ast.nodes[e as usize].b;
                self.expr(a);
                self.expr(b);
                self.emit(OP_CMP_JF, 0, code);
                return;
            }
        }
        if k == N_UNARY && self.ast.nodes[e as usize].op.as_str() == "!" {
            let a = self.ast.nodes[e as usize].a;
            self.expr(a);
            self.emit(OP_JT, 0, 0);
            return;
        }
        self.expr(e);
        self.emit(OP_JF, 0, 0);
    }

    // ---- expressions

    /// An initializer: an anonymous function or class takes the target's
    /// name.
    fn expr_named(&mut self, e: int, target: int) {
        self.expr(e);
        if target >= 0 && self.ast.nodes[target as usize].kind == N_IDENT {
            let name = self.ast.nodes[target as usize].s.clone();
            self.name_anonymous(e, name.as_str());
        }
    }

    fn name_anonymous(&mut self, e: int, name: &str) {
        let k = self.ast.nodes[e as usize].kind;
        if (k == N_FUNC || k == N_CLASS) && self.ast.nodes[e as usize].s.is_empty() {
            let c = self.str_const(name);
            self.emit(OP_SET_NAME, c, 0);
        }
    }

    fn expr(&mut self, n: int) {
        let k = self.ast.nodes[n as usize].kind;
        let (a, b, c) = (self.ast.nodes[n as usize].a, self.ast.nodes[n as usize].b, self.ast.nodes[n as usize].c);
        if k == N_NUM {
            let v = self.ast.nodes[n as usize].num;
            self.push_num(v);
            return;
        }
        if k == N_STR {
            let s = self.ast.nodes[n as usize].s.clone();
            self.push_str(s.as_str());
            return;
        }
        if k == N_IDENT {
            let name = self.ast.nodes[n as usize].s.clone();
            self.load_name(n);
            let _ = name;
            return;
        }
        if k == N_THIS {
            self.op(OP_THIS);
            return;
        }
        if k == N_NULL {
            self.op(OP_NULL);
            return;
        }
        if k == N_TRUE {
            self.op(OP_TRUE);
            return;
        }
        if k == N_FALSE {
            self.op(OP_FALSE);
            return;
        }
        if k == N_UNDEF || k == N_HOLE {
            self.op(OP_UNDEF);
            return;
        }
        if k == N_TEMPLATE {
            let strs = self.ast.nodes[n as usize].list.clone();
            let exprs = self.ast.nodes[n as usize].list2.clone();
            let first = self.ast.nodes[strs[0] as usize].s.clone();
            self.push_str(first.as_str());
            let mut i: int = 0;
            for e in exprs {
                self.expr(e);
                self.op(OP_TOSTR);
                self.op(OP_ADD);
                let s = self.ast.nodes[strs[(i + 1) as usize] as usize].s.clone();
                if !s.is_empty() {
                    self.push_str(s.as_str());
                    self.op(OP_ADD);
                }
                i += 1;
            }
            return;
        }
        if k == N_ARRAY {
            let items = self.ast.nodes[n as usize].list.clone();
            let mut simple = true;
            for it in items.iter() {
                let ik = self.ast.nodes[*it as usize].kind;
                if ik == N_SPREAD || ik == N_HOLE {
                    simple = false;
                }
            }
            if simple {
                let cnt = items.len() as int;
                for it in items {
                    self.expr(it);
                }
                self.emit(OP_NEW_ARRAY, cnt, 0);
                return;
            }
            self.emit(OP_NEW_ARRAY, 0, 0);
            for it in items {
                let ik = self.ast.nodes[it as usize].kind;
                if ik == N_SPREAD {
                    let inner = self.ast.nodes[it as usize].a;
                    self.expr(inner);
                    self.op(OP_ARRAY_SPREAD);
                } else if ik == N_HOLE {
                    self.op(OP_ARRAY_HOLE);
                } else {
                    self.expr(it);
                    self.op(OP_ARRAY_PUSH);
                }
            }
            return;
        }
        if k == N_OBJECT {
            self.object_literal(n);
            return;
        }
        if k == N_FUNC {
            let p = self.function(n);
            self.emit(OP_CLOSURE, p, 0);
            return;
        }
        if k == N_CLASS {
            self.class(n);
            return;
        }
        if k == N_REGEX {
            let s = self.ast.nodes[n as usize].s.clone();
            let f = self.ast.nodes[n as usize].op.clone();
            let cs = self.str_const(s.as_str());
            let cf = self.str_const(f.as_str());
            self.emit(OP_REGEX, cs, cf);
            return;
        }
        if k == N_UNARY {
            self.unary(n);
            return;
        }
        if k == N_UPDATE {
            self.update(n, true);
            return;
        }
        if k == N_BINARY {
            let op = self.ast.nodes[n as usize].op.clone();
            self.expr(a);
            self.expr(b);
            let code = binary_code(op.as_str());
            self.op(code);
            return;
        }
        if k == N_LOGICAL {
            let op = self.ast.nodes[n as usize].op.clone();
            self.expr(a);
            let code = if op.as_str() == "&&" {
                OP_JF_KEEP
            } else if op.as_str() == "||" {
                OP_JT_KEEP
            } else {
                OP_JNN_KEEP
            };
            let j = self.emit(code, 0, 0);
            self.expr(b);
            self.patch(j);
            return;
        }
        if k == N_ASSIGN {
            self.assign(n);
            return;
        }
        if k == N_COND {
            self.cond_jump_false(a);
            let jf = self.last_jump();
            self.expr(b);
            let j = self.emit(OP_JUMP, 0, 0);
            self.patch(jf);
            self.expr(c);
            self.patch(j);
            return;
        }
        if k == N_CALL {
            self.call(n);
            return;
        }
        if k == N_NEW {
            let args = self.ast.nodes[n as usize].list.clone();
            self.expr(a);
            if self.has_spread(&args) {
                self.spread_array(&args);
                self.op(OP_NEW_SPREAD);
            } else {
                let cnt = args.len() as int;
                for x in args {
                    self.expr(x);
                }
                self.emit(OP_NEW, cnt, 0);
            }
            return;
        }
        if k == N_MEMBER {
            let s = self.ast.nodes[n as usize].s.clone();
            // fused: a local's property
            let mut fused = false;
            if self.ast.nodes[a as usize].kind == N_IDENT && self.ast.nodes[n as usize].d != 1 {
                let bnd = match self.ref_bind.get(&a) {
                    Some(x) => *x,
                    None => -1,
                };
                if bnd >= 0 && !self.binds[bnd as usize].in_env && !self.binds[bnd as usize].global {
                    let slot = self.binds[bnd as usize].slot;
                    let at = self.atom(s.as_str());
                    self.emit(OP_GET_LOCAL_PROP, slot, at);
                    fused = true;
                }
            }
            if !fused {
                self.expr(a);
                self.chain_check(n);
                let at = self.atom(s.as_str());
                self.emit(OP_GET_PROP, at, 0);
            }
            return;
        }
        if k == N_INDEX {
            self.expr(a);
            self.chain_check(n);
            self.expr(b);
            self.op(OP_GET_ELEM);
            return;
        }
        if k == N_SEQ {
            let list = self.ast.nodes[n as usize].list.clone();
            let cnt = list.len();
            let mut i: usize = 0;
            for e in list {
                self.expr(e);
                if i + 1 < cnt {
                    self.op(OP_POP);
                }
                i += 1;
            }
            return;
        }
        if k == N_SUPER_CALL {
            let args = self.ast.nodes[n as usize].list.clone();
            if self.has_spread(&args) {
                self.spread_array(&args);
                self.op(OP_SUPER_CALL_SPREAD);
            } else {
                let cnt = args.len() as int;
                for x in args {
                    self.expr(x);
                }
                self.emit(OP_SUPER_CALL, cnt, 0);
            }
            return;
        }
        if k == N_SUPER_MEMBER {
            if c == 1 {
                self.expr(a);
                self.op(OP_GET_SUPER_ELEM);
            } else {
                let s = self.ast.nodes[a as usize].s.clone();
                let at = self.atom(s.as_str());
                self.emit(OP_GET_SUPER, at, 0);
            }
            return;
        }
        if k == N_NEW_TARGET {
            self.op(OP_NEW_TARGET);
            return;
        }
        if k == N_OPT_CHAIN {
            self.f().chain.push(Vec::new());
            self.expr(a);
            // the chain's jumps (not `pop().unwrap()`: an optional array
            // is written without its optional on C++)
            let last = self.f().chain.len() - 1;
            let jumps = self.f().chain[last].clone();
            self.f().chain.truncate(last);
            for j in jumps {
                self.patch(j);
            }
            return;
        }
        if k == N_TAGGED {
            self.tagged(n);
            return;
        }
        if k == N_SPREAD {
            self.fail("SyntaxError: unexpected spread");
            return;
        }
        self.fail("SyntaxError: unsupported expression");
    }

    /// In an optional chain, `x?.y`: skip to the chain's end when x is
    /// null or undefined.
    fn chain_check(&mut self, n: int) {
        if self.ast.nodes[n as usize].d == 1 && !self.f().chain.is_empty() {
            let j = self.emit(OP_JNULLISH, 0, 1);
            let f = self.f();
            let last = f.chain.len() - 1;
            f.chain[last].push(j);
        }
    }

    fn has_spread(&self, args: &Vec<int>) -> bool {
        for x in args.iter() {
            if self.ast.nodes[*x as usize].kind == N_SPREAD {
                return true;
            }
        }
        false
    }

    fn spread_array(&mut self, args: &Vec<int>) {
        self.emit(OP_NEW_ARRAY, 0, 0);
        for x in args.iter() {
            if self.ast.nodes[*x as usize].kind == N_SPREAD {
                let inner = self.ast.nodes[*x as usize].a;
                self.expr(inner);
                self.op(OP_ARRAY_SPREAD);
            } else {
                self.expr(*x);
                self.op(OP_ARRAY_PUSH);
            }
        }
    }

    fn call(&mut self, n: int) {
        let a = self.ast.nodes[n as usize].a;
        let args = self.ast.nodes[n as usize].list.clone();
        let ck = self.ast.nodes[a as usize].kind;
        let optional = self.ast.nodes[n as usize].d == 1;
        if ck == N_MEMBER {
            let obj = self.ast.nodes[a as usize].a;
            let s = self.ast.nodes[a as usize].s.clone();
            self.expr(obj);
            self.chain_check(a);
            let at = self.atom(s.as_str());
            self.emit(OP_GET_METHOD, at, if optional { 1 } else { 0 });
        } else if ck == N_INDEX {
            let obj = self.ast.nodes[a as usize].a;
            let key = self.ast.nodes[a as usize].b;
            self.expr(obj);
            self.chain_check(a);
            self.expr(key);
            self.op(OP_GET_METHOD_ELEM);
        } else if ck == N_SUPER_MEMBER {
            self.expr(a);
            self.op(OP_THIS);
        } else {
            self.expr(a);
            self.op(OP_UNDEF);
        }
        if optional && !self.f().chain.is_empty() {
            // [f, this] → skip the call when f is null / undefined
            self.emit(OP_OVER, 0, 0);
            let j = self.emit(OP_JNULLISH, 0, 3);
            let f = self.f();
            let last = f.chain.len() - 1;
            f.chain[last].push(j);
        }
        if self.has_spread(&args) {
            self.spread_array(&args);
            self.op(OP_CALL_SPREAD);
            return;
        }
        let cnt = args.len() as int;
        for x in args {
            self.expr(x);
        }
        self.emit(OP_CALL, cnt, 0);
    }

    fn tagged(&mut self, n: int) {
        let a = self.ast.nodes[n as usize].a;
        let t = self.ast.nodes[n as usize].b;
        let ck = self.ast.nodes[a as usize].kind;
        if ck == N_MEMBER {
            let obj = self.ast.nodes[a as usize].a;
            let s = self.ast.nodes[a as usize].s.clone();
            self.expr(obj);
            let at = self.atom(s.as_str());
            self.emit(OP_GET_METHOD, at, 0);
        } else {
            self.expr(a);
            self.op(OP_UNDEF);
        }
        let strs = self.ast.nodes[t as usize].list.clone();
        let exprs = self.ast.nodes[t as usize].list2.clone();
        for s in strs.iter() {
            let v = self.ast.nodes[*s as usize].s.clone();
            self.push_str(v.as_str());
        }
        let cnt = strs.len() as int;
        self.emit(OP_TEMPLATE_OBJ, cnt, 0);
        let argc = (exprs.len() as int) + 1;
        for e in exprs {
            self.expr(e);
        }
        self.emit(OP_CALL, argc, 0);
    }

    fn unary(&mut self, n: int) {
        let op = self.ast.nodes[n as usize].op.clone();
        let a = self.ast.nodes[n as usize].a;
        let o = op.as_str();
        if o == "typeof" {
            if self.ast.nodes[a as usize].kind == N_IDENT && !self.ref_bind.contains_key(&a) {
                let s = self.ast.nodes[a as usize].s.clone();
                let at = self.atom(s.as_str());
                self.emit(OP_TYPEOF_GLOBAL, at, 0);
                return;
            }
            self.expr(a);
            self.op(OP_TYPEOF);
            return;
        }
        if o == "delete" {
            let k = self.ast.nodes[a as usize].kind;
            if k == N_MEMBER {
                let obj = self.ast.nodes[a as usize].a;
                let s = self.ast.nodes[a as usize].s.clone();
                self.expr(obj);
                let at = self.atom(s.as_str());
                self.emit(OP_DEL_PROP, at, 0);
                return;
            }
            if k == N_INDEX {
                let obj = self.ast.nodes[a as usize].a;
                let key = self.ast.nodes[a as usize].b;
                self.expr(obj);
                self.expr(key);
                self.op(OP_DEL_ELEM);
                return;
            }
            if k == N_IDENT {
                // deleting a variable: false, a global property: true
                if self.ref_bind.contains_key(&a) {
                    self.op(OP_FALSE);
                } else {
                    let s = self.ast.nodes[a as usize].s.clone();
                    let g = self.atom_const("globalThis");
                    self.emit(OP_GET_GLOBAL, g, 0);
                    let at = self.atom(s.as_str());
                    self.emit(OP_DEL_PROP, at, 0);
                }
                return;
            }
            self.expr(a);
            self.op(OP_POP);
            self.op(OP_TRUE);
            return;
        }
        if o == "void" {
            self.expr(a);
            self.op(OP_POP);
            self.op(OP_UNDEF);
            return;
        }
        if o == "await" {
            self.expr(a);
            return;
        }
        if o == "-" && self.ast.nodes[a as usize].kind == N_NUM {
            let v = self.ast.nodes[a as usize].num;
            self.push_num(-v);
            return;
        }
        self.expr(a);
        if o == "-" {
            self.op(OP_NEG);
        } else if o == "+" {
            self.op(OP_TONUM);
        } else if o == "!" {
            self.op(OP_NOT);
        } else if o == "~" {
            self.op(OP_BNOT);
        }
    }

    fn atom_const(&mut self, s: &str) -> int {
        self.atom(s)
    }

    fn update(&mut self, n: int, keep: bool) {
        let op = self.ast.nodes[n as usize].op.clone();
        let prefix = self.ast.nodes[n as usize].flags == 1;
        let t = self.ast.nodes[n as usize].a;
        let code = if op.as_str() == "++" { OP_INC } else { OP_DEC };
        let tk = self.ast.nodes[t as usize].kind;
        let _ = keep;
        if tk == N_IDENT {
            self.load_name(t);
            self.op(OP_TONUM);
            if prefix {
                self.op(code);
                self.store_name(t, false);
            } else {
                self.op(OP_DUP);
                self.op(code);
                self.store_name(t, false);
                self.op(OP_POP);
            }
            return;
        }
        if tk == N_MEMBER {
            let obj = self.ast.nodes[t as usize].a;
            let s = self.ast.nodes[t as usize].s.clone();
            let at = self.atom(s.as_str());
            self.expr(obj);
            self.op(OP_DUP);
            self.emit(OP_GET_PROP, at, 0);
            self.op(OP_TONUM);
            if prefix {
                self.op(code);
                self.emit(OP_SET_PROP, at, 0);
            } else {
                self.op(OP_DUP);
                self.op(OP_ROT3);
                self.op(code);
                self.emit(OP_SET_PROP, at, 0);
                self.op(OP_POP);
            }
            return;
        }
        if tk == N_INDEX {
            let obj = self.ast.nodes[t as usize].a;
            let key = self.ast.nodes[t as usize].b;
            self.expr(obj);
            self.expr(key);
            self.op(OP_DUP2);
            self.op(OP_GET_ELEM);
            self.op(OP_TONUM);
            if prefix {
                self.op(code);
                self.op(OP_SET_ELEM);
            } else {
                self.op(OP_DUP);
                self.op(OP_ROT4);
                self.op(code);
                self.op(OP_SET_ELEM);
                self.op(OP_POP);
            }
            return;
        }
        self.fail("SyntaxError: invalid update target");
    }

    fn assign(&mut self, n: int) {
        let op = self.ast.nodes[n as usize].op.clone();
        let t = self.ast.nodes[n as usize].a;
        let v = self.ast.nodes[n as usize].b;
        let tk = self.ast.nodes[t as usize].kind;
        let o = op.as_str();
        if o == "define" {
            self.define_field(n);
            return;
        }
        if o == "=" {
            if tk == N_IDENT {
                self.expr_named(v, t);
                self.store_name(t, false);
                return;
            }
            if tk == N_MEMBER {
                let obj = self.ast.nodes[t as usize].a;
                let s = self.ast.nodes[t as usize].s.clone();
                self.expr(obj);
                self.expr(v);
                let at = self.atom(s.as_str());
                self.emit(OP_SET_PROP, at, 0);
                return;
            }
            if tk == N_INDEX {
                let obj = self.ast.nodes[t as usize].a;
                let key = self.ast.nodes[t as usize].b;
                self.expr(obj);
                self.expr(key);
                self.expr(v);
                self.op(OP_SET_ELEM);
                return;
            }
            // destructuring
            self.expr(v);
            self.op(OP_DUP);
            self.assign_pattern(t, false);
            return;
        }
        if o == "&&=" || o == "||=" || o == "??=" {
            let jcode = if o == "&&=" {
                OP_JF_KEEP
            } else if o == "||=" {
                OP_JT_KEEP
            } else {
                OP_JNN_KEEP
            };
            if tk == N_IDENT {
                self.load_name(t);
                let j = self.emit(jcode, 0, 0);
                self.expr_named(v, t);
                self.store_name(t, false);
                self.patch(j);
                return;
            }
            if tk == N_MEMBER {
                let obj = self.ast.nodes[t as usize].a;
                let s = self.ast.nodes[t as usize].s.clone();
                let at = self.atom(s.as_str());
                self.expr(obj);
                self.op(OP_DUP);
                self.emit(OP_GET_PROP, at, 0);
                let j = self.emit(jcode, 0, 0);
                self.expr(v);
                self.emit(OP_SET_PROP, at, 0);
                let jend = self.emit(OP_JUMP, 0, 0);
                self.patch(j);
                self.op(OP_SWAP);
                self.op(OP_POP);
                self.patch(jend);
                return;
            }
            if tk == N_INDEX {
                let obj = self.ast.nodes[t as usize].a;
                let key = self.ast.nodes[t as usize].b;
                self.expr(obj);
                self.expr(key);
                self.op(OP_DUP2);
                self.op(OP_GET_ELEM);
                let j = self.emit(jcode, 0, 0);
                self.expr(v);
                self.op(OP_SET_ELEM);
                let jend = self.emit(OP_JUMP, 0, 0);
                self.patch(j);
                self.op(OP_ROT3);
                self.op(OP_POP);
                self.op(OP_POP);
                self.patch(jend);
                return;
            }
        }
        // compound: a op= b
        let bop = &o[0..(o.as_bytes().len() - 1)];
        let code = binary_code(bop);
        if tk == N_IDENT {
            self.load_name(t);
            self.expr(v);
            self.op(code);
            self.store_name(t, false);
            return;
        }
        if tk == N_MEMBER {
            let obj = self.ast.nodes[t as usize].a;
            let s = self.ast.nodes[t as usize].s.clone();
            let at = self.atom(s.as_str());
            self.expr(obj);
            self.op(OP_DUP);
            self.emit(OP_GET_PROP, at, 0);
            self.expr(v);
            self.op(code);
            self.emit(OP_SET_PROP, at, 0);
            return;
        }
        if tk == N_INDEX {
            let obj = self.ast.nodes[t as usize].a;
            let key = self.ast.nodes[t as usize].b;
            self.expr(obj);
            self.expr(key);
            self.op(OP_DUP2);
            self.op(OP_GET_ELEM);
            self.expr(v);
            self.op(code);
            self.op(OP_SET_ELEM);
            return;
        }
        self.fail("SyntaxError: invalid assignment target");
    }

    /// `this.x = v` of a class field: defines, leaving the object.
    fn define_field(&mut self, n: int) {
        let t = self.ast.nodes[n as usize].a;
        let v = self.ast.nodes[n as usize].b;
        let obj = self.ast.nodes[t as usize].a;
        if self.ast.nodes[t as usize].kind == N_MEMBER {
            let s = self.ast.nodes[t as usize].s.clone();
            self.expr(obj);
            self.expr(v);
            self.name_anonymous(v, s.as_str());
            let at = self.atom(s.as_str());
            self.emit(OP_DEFINE_FIELD, at, 0);
        } else {
            let key = self.ast.nodes[t as usize].b;
            self.expr(obj);
            self.expr(key);
            self.expr(v);
            self.op(OP_DEFINE_FIELD_ELEM);
        }
    }

    /// Assigns the value on top of the stack to the pattern `p`, popping it.
    fn assign_pattern(&mut self, p: int, init: bool) {
        let k = self.ast.nodes[p as usize].kind;
        if k == N_IDENT {
            self.store_name(p, init);
            self.op(OP_POP);
            return;
        }
        if k == N_MEMBER {
            let obj = self.ast.nodes[p as usize].a;
            let s = self.ast.nodes[p as usize].s.clone();
            self.expr(obj);
            self.op(OP_SWAP);
            let at = self.atom(s.as_str());
            self.emit(OP_SET_PROP, at, 0);
            self.op(OP_POP);
            return;
        }
        if k == N_INDEX {
            let obj = self.ast.nodes[p as usize].a;
            let key = self.ast.nodes[p as usize].b;
            self.expr(obj);
            self.expr(key);
            self.op(OP_ROT3);
            self.op(OP_SET_ELEM);
            self.op(OP_POP);
            return;
        }
        if k == N_PAT_DEFAULT {
            let t = self.ast.nodes[p as usize].a;
            let d = self.ast.nodes[p as usize].b;
            self.op(OP_DUP);
            let j = self.emit(OP_JNOT_UNDEF, 0, 0);
            self.op(OP_POP);
            self.expr_named(d, t);
            self.patch(j);
            self.assign_pattern(t, init);
            return;
        }
        if k == N_ARRAY {
            self.op(OP_TO_ARRAY);
            let items = self.ast.nodes[p as usize].list.clone();
            let mut i: int = 0;
            for it in items {
                let ik = self.ast.nodes[it as usize].kind;
                if ik == N_HOLE {
                    i += 1;
                    continue;
                }
                if ik == N_REST {
                    self.emit(OP_ARRAY_REST, i, 0);
                    let t = self.ast.nodes[it as usize].a;
                    self.assign_pattern(t, init);
                    i += 1;
                    continue;
                }
                self.op(OP_DUP);
                self.emit(OP_INT, i, 0);
                self.op(OP_GET_ELEM);
                self.assign_pattern(it, init);
                i += 1;
            }
            self.op(OP_POP);
            return;
        }
        if k == N_OBJECT {
            self.op(OP_REQUIRE_OBJ);
            let props = self.ast.nodes[p as usize].list.clone();
            let mut seen: Vec<String> = Vec::new();
            for pr in props {
                let f = self.ast.nodes[pr as usize].flags;
                let target = self.ast.nodes[pr as usize].b;
                if (f & F_SPREAD) != 0 {
                    let cnt = seen.len() as int;
                    for s in seen.clone() {
                        self.push_str(s.as_str());
                    }
                    self.emit(OP_OBJ_REST, cnt, 0);
                    self.assign_pattern(target, init);
                    continue;
                }
                let key = self.ast.nodes[pr as usize].a;
                self.op(OP_DUP);
                if (f & F_COMPUTED) != 0 {
                    self.expr(key);
                    self.op(OP_GET_ELEM);
                } else {
                    let name = if self.ast.nodes[key as usize].kind == N_NUM {
                        number_to_string(self.ast.nodes[key as usize].num)
                    } else {
                        self.ast.nodes[key as usize].s.clone()
                    };
                    seen.push(name.clone());
                    let at = self.atom(name.as_str());
                    self.emit(OP_GET_PROP, at, 0);
                }
                self.assign_pattern(target, init);
            }
            self.op(OP_POP);
            return;
        }
        self.fail("SyntaxError: invalid destructuring target");
    }

    fn key_atom(&mut self, key: int) -> int {
        let name = if self.ast.nodes[key as usize].kind == N_NUM {
            number_to_string(self.ast.nodes[key as usize].num)
        } else {
            self.ast.nodes[key as usize].s.clone()
        };
        self.atom(name.as_str())
    }

    fn key_string(&self, key: int) -> String {
        if self.ast.nodes[key as usize].kind == N_NUM {
            return number_to_string(self.ast.nodes[key as usize].num);
        }
        self.ast.nodes[key as usize].s.clone()
    }

    fn object_literal(&mut self, n: int) {
        self.op(OP_NEW_OBJECT);
        let props = self.ast.nodes[n as usize].list.clone();
        for pr in props {
            let f = self.ast.nodes[pr as usize].flags;
            let key = self.ast.nodes[pr as usize].a;
            let v = self.ast.nodes[pr as usize].b;
            if (f & F_SPREAD) != 0 {
                self.expr(v);
                self.op(OP_INIT_SPREAD);
                continue;
            }
            let computed = (f & F_COMPUTED) != 0;
            let is_method = self.ast.nodes[v as usize].kind == N_FUNC && (self.ast.nodes[v as usize].flags & F_METHOD) != 0;
            if (f & (F_GETTER | F_SETTER)) != 0 {
                let getter = (f & F_GETTER) != 0;
                if computed {
                    self.expr(key);
                    let p = self.function(v);
                    self.emit(OP_CLOSURE, p, 0);
                    self.emit(if getter { OP_INIT_GETTER_ELEM } else { OP_INIT_SETTER_ELEM }, 0, 0);
                } else {
                    let at = self.key_atom(key);
                    let p = self.function(v);
                    self.emit(OP_CLOSURE, p, 0);
                    self.emit(if getter { OP_INIT_GETTER } else { OP_INIT_SETTER }, at, 0);
                }
                continue;
            }
            if computed {
                self.expr(key);
                self.expr(v);
                if is_method {
                    self.emit(OP_DEFINE_METHOD_ELEM, 0, 0);
                } else {
                    self.op(OP_INIT_ELEM);
                }
                continue;
            }
            let name = self.key_string(key);
            let at = self.atom(name.as_str());
            self.expr(v);
            if is_method {
                self.emit(OP_DEFINE_METHOD, at, 0);
                continue;
            }
            if (f & F_SHORTHAND) == 0 {
                self.name_anonymous(v, name.as_str());
            }
            // `__proto__: x` sets the prototype (b = 1)
            let is_proto = name.as_str() == "__proto__" && (f & F_SHORTHAND) == 0;
            self.emit(OP_INIT_PROP, at, if is_proto { 1 } else { 0 });
        }
    }

    fn class(&mut self, n: int) {
        let flags = self.ast.nodes[n as usize].flags;
        let sup = self.ast.nodes[n as usize].a;
        let ctor = self.ast.nodes[n as usize].b;
        let fields = self.ast.nodes[n as usize].c;
        let stat = self.ast.nodes[n as usize].d;
        let name = self.ast.nodes[n as usize].s.clone();
        let derived = (flags & F_DERIVED) != 0;
        let saved = self.cur_scope;
        let inner = match self.node_scope.get(&n) {
            Some(s) => *s,
            None => -1,
        };
        let mut pushed = false;
        if derived {
            self.expr(sup);
        }
        if inner >= 0 {
            self.cur_scope = inner;
            pushed = self.enter_scope(inner, false);
        }
        let p = self.function(ctor);
        self.emit(OP_CLOSURE, p, 0);
        if derived {
            // [super, ctor] → [ctor, super]
            self.op(OP_SWAP);
        }
        self.emit(OP_CLASS, if derived { 1 } else { 0 }, 0);
        // [ctor, proto]: the name is bound before any method runs
        if !name.is_empty() {
            let b = self.lookup_here(name.as_str());
            if b >= 0 {
                self.op(OP_OVER);
                self.store_bind(b, true);
                self.op(OP_POP);
            }
        }
        let members = self.ast.nodes[n as usize].list.clone();
        for m in members {
            let f = self.ast.nodes[m as usize].flags;
            let key = self.ast.nodes[m as usize].a;
            let v = self.ast.nodes[m as usize].b;
            if (f & F_STATIC) != 0 {
                self.op(OP_OVER);
            } else {
                self.op(OP_DUP);
            }
            let computed = (f & F_COMPUTED) != 0;
            if computed {
                self.expr(key);
            }
            let pv = self.function(v);
            self.emit(OP_CLOSURE, pv, 0);
            let at = if computed { 0 } else { self.key_atom(key) };
            if (f & F_GETTER) != 0 {
                self.emit(if computed { OP_INIT_GETTER_ELEM } else { OP_INIT_GETTER }, at, 1);
            } else if (f & F_SETTER) != 0 {
                self.emit(if computed { OP_INIT_SETTER_ELEM } else { OP_INIT_SETTER }, at, 1);
            } else {
                self.emit(if computed { OP_DEFINE_METHOD_ELEM } else { OP_DEFINE_METHOD }, at, 0);
            }
            self.op(OP_POP);
        }
        if fields >= 0 {
            self.op(OP_OVER);
            let pf = self.function(fields);
            self.emit(OP_CLOSURE, pf, 0);
            self.op(OP_SET_FIELDS);
            self.op(OP_POP);
        }
        self.op(OP_POP);
        if stat >= 0 {
            self.op(OP_DUP);
            let ps = self.function(stat);
            self.emit(OP_CLOSURE, ps, 0);
            self.op(OP_SWAP);
            self.emit(OP_CALL, 0, 0);
            self.op(OP_POP);
        }
        if inner >= 0 {
            self.leave_scope(pushed);
            self.cur_scope = saved;
        }
    }
}

fn binary_code(op: &str) -> int {
    match op {
        "+" => OP_ADD,
        "-" => OP_SUB,
        "*" => OP_MUL,
        "/" => OP_DIV,
        "%" => OP_MOD,
        "**" => OP_EXP,
        "&" => OP_BAND,
        "|" => OP_BOR,
        "^" => OP_BXOR,
        "<<" => OP_SHL,
        ">>" => OP_SHR,
        ">>>" => OP_USHR,
        "==" => OP_EQ,
        "!=" => OP_NE,
        "===" => OP_SEQ,
        "!==" => OP_SNE,
        "<" => OP_LT,
        ">" => OP_GT,
        "<=" => OP_LE,
        ">=" => OP_GE,
        "instanceof" => OP_INSTANCEOF,
        "in" => OP_IN,
        _ => OP_NOP,
    }
}

fn compare_code(op: &str) -> int {
    match op {
        "<" => OP_LT,
        ">" => OP_GT,
        "<=" => OP_LE,
        ">=" => OP_GE,
        "===" => OP_SEQ,
        "!==" => OP_SNE,
        "==" => OP_EQ,
        "!=" => OP_NE,
        _ => 0,
    }
}
