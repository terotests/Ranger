// SPDX-License-Identifier: AGPL-3.0-or-later
//! Values, heap objects and compiled functions.
//!
//! A value is a primitive or an index into the object arena (`Vm.objs`).
//! Strings are shared (`Rc<String>`), so passing one around never copies it.
//! Every object -- plain object, array, function, scope, error, iterator --
//! is one `JsObj`; `class` tells which, and the fields a class does not use
//! stay empty.

use ranger::prelude::*;
use std::collections::HashMap;
use std::rc::Rc;

#[derive(Clone)]
pub enum Val {
    Undef,
    Null,
    Bool(bool),
    Num(double),
    Str(Rc<String>),
    Obj(int),
}

pub fn str_val(s: &str) -> Val {
    Val::Str(Rc::new(String::from(s)))
}

pub fn string_val(s: String) -> Val {
    Val::Str(Rc::new(s))
}

// object classes
pub const C_OBJECT: int = 0;
pub const C_ARRAY: int = 1;
pub const C_FUNCTION: int = 2;
pub const C_NATIVE: int = 3;
pub const C_ENV: int = 4;
pub const C_ERROR: int = 5;
pub const C_REGEXP: int = 6;
pub const C_DATE: int = 7;
pub const C_BOUND: int = 8;
pub const C_ARGUMENTS: int = 9;
pub const C_BOOLEAN: int = 10;
pub const C_NUMBER: int = 11;
pub const C_STRING: int = 12;
pub const C_ACCESSOR: int = 13;
pub const C_ITER: int = 14;
pub const C_MAP: int = 15;
pub const C_SET: int = 16;
pub const C_SYMBOL: int = 17;
pub const C_PROMISE: int = 18;
/// a generator object: a saved frame (see Vm::gen_save)
pub const C_GENERATOR: int = 19;

// property attributes
pub const P_HIDDEN: int = 1;
pub const P_READONLY: int = 2;
pub const P_FIXED: int = 4;
pub const P_ACCESSOR: int = 8;

/// Past this many properties an object keeps a hash index of its keys.
pub const INDEX_AT: int = 8;

pub struct JsObj {
    pub class: int,
    /// the prototype, -1 for none; for a scope, the enclosing scope
    pub proto: int,
    /// property keys (atoms) in insertion order, their values and
    /// attributes
    pub keys: Vec<int>,
    pub vals: Vec<Val>,
    pub attrs: Vec<int>,
    pub index: HashMap<int, int>,
    /// array elements, scope slots, a bound function's arguments, an
    /// accessor's getter and setter, a map's keys
    pub elems: Vec<Val>,
    /// a map's values
    pub elems2: Vec<Val>,
    /// the compiled function (index into `Vm.protos`) or the native id
    pub func: int,
    /// a closure's scope; a bound function's target; an iterator's source
    pub env: int,
    /// an arrow's `this`, a bound `this`, a boxed primitive, a date's time,
    /// a regexp's source
    pub prim: Val,
    /// the object a method's `super` looks up from
    pub home: int,
    /// an iterator's position; a regexp's flags as bits
    pub pos: int,
    pub extensible: bool,
    pub marked: bool,
    pub free: bool,
    /// a function's own `prototype` object was made
    pub has_proto_obj: bool,
    /// a generator's saved pc and handlers
    pub saved: Vec<int>,
}

impl JsObj {
    pub fn new(class: int, proto: int) -> JsObj {
        JsObj {
            class: class,
            proto: proto,
            keys: Vec::new(),
            vals: Vec::new(),
            attrs: Vec::new(),
            index: HashMap::new(),
            elems: Vec::new(),
            elems2: Vec::new(),
            func: -1,
            env: -1,
            prim: Val::Undef,
            home: -1,
            pos: 0,
            extensible: true,
            marked: false,
            free: false,
            has_proto_obj: false,
            saved: Vec::new(),
        }
    }

    /// The slot of `atom` among the own properties, -1 when absent.
    pub fn find(&self, atom: int) -> int {
        let n = self.keys.len() as int;
        if n > INDEX_AT {
            return match self.index.get(&atom) {
                Some(i) => *i,
                None => -1,
            };
        }
        let mut i: int = 0;
        while i < n {
            if self.keys[i as usize] == atom {
                return i;
            }
            i += 1;
        }
        -1
    }

    pub fn add(&mut self, atom: int, v: Val, attr: int) -> int {
        let slot = self.keys.len() as int;
        self.keys.push(atom);
        self.vals.push(v);
        self.attrs.push(attr);
        if slot + 1 > INDEX_AT {
            if slot == INDEX_AT {
                let mut i: int = 0;
                while i < slot {
                    self.index.insert(self.keys[i as usize], i);
                    i += 1;
                }
            }
            self.index.insert(atom, slot);
        }
        slot
    }

    pub fn remove(&mut self, slot: int) {
        self.keys.remove(slot as usize);
        self.vals.remove(slot as usize);
        self.attrs.remove(slot as usize);
        self.index = HashMap::new();
        let n = self.keys.len() as int;
        if n > INDEX_AT {
            let mut i: int = 0;
            while i < n {
                self.index.insert(self.keys[i as usize], i);
                i += 1;
            }
        }
    }

    pub fn clear(&mut self) {
        self.keys = Vec::new();
        self.vals = Vec::new();
        self.attrs = Vec::new();
        self.index = HashMap::new();
        self.elems = Vec::new();
        self.elems2 = Vec::new();
        self.prim = Val::Undef;
        self.env = -1;
        self.home = -1;
        self.func = -1;
        self.proto = -1;
        self.pos = 0;
        self.extensible = true;
        self.has_proto_obj = false;
        self.saved = Vec::new();
    }
}

#[derive(Clone, Copy)]
pub struct Op {
    pub code: int,
    pub a: int,
    pub b: int,
    /// an inline cache: the slot the property was found at last time
    pub c: int,
}

/// The names a direct `eval` call site can see: each a binding in a scope
/// object `depth` scopes out from the call, at `slot`.
#[derive(Clone)]
pub struct EvalScope {
    pub names: Vec<String>,
    pub depths: Vec<int>,
    pub slots: Vec<int>,
    pub consts: Vec<bool>,
}

impl EvalScope {
    pub fn new() -> EvalScope {
        EvalScope { names: Vec::new(), depths: Vec::new(), slots: Vec::new(), consts: Vec::new() }
    }
}

pub struct Proto {
    pub code: Vec<Op>,
    pub consts: Vec<Val>,
    pub name: String,
    /// the function's `length`
    pub length: int,
    /// parameters that arrive in slots 0..nparams
    pub nparams: int,
    pub nslots: int,
    /// slots of the function's own scope object; 0 when it has none
    pub env_size: int,
    /// a rest parameter's slot, -1 for none
    pub rest: int,
    pub uses_args: bool,
    pub arrow: bool,
    pub strict: bool,
    pub class_ctor: bool,
    pub derived: bool,
    pub method: bool,
    pub getter_setter: bool,
    /// the scopes of its direct `eval` calls (OP_EVAL_CALL b)
    pub evals: Vec<EvalScope>,    /// its source text, for Function.prototype.toString
    pub source: String,
    /// `function*` / `async function`
    pub generator: bool,
    pub is_async: bool,
}

impl Proto {
    pub fn new(name: &str) -> Proto {
        Proto {
            code: Vec::new(),
            consts: Vec::new(),
            name: String::from(name),
            length: 0,
            nparams: 0,
            nslots: 0,
            env_size: 0,
            rest: -1,
            uses_args: false,
            arrow: false,
            strict: false,
            class_ctor: false,
            derived: false,
            method: false,
            getter_setter: false,
            evals: Vec::new(),
            source: String::new(),
            generator: false,
            is_async: false,
        }
    }
}

pub struct Frame {
    pub proto: int,
    /// the function object running
    pub fobj: int,
    pub pc: int,
    /// where slot 0 is on the stack
    pub bp: int,
    pub env: int,
    pub this_val: Val,
    pub new_target: Val,
    /// the arguments object, built when the function mentions `arguments`
    pub args_obj: int,
    /// a constructor call: an object result replaces `this`
    pub construct: bool,
    /// the generator object this frame runs in, -1 for none
    pub gen: int,
}

pub struct Handler {
    pub frame: int,
    pub catch_pc: int,
    pub sp: int,
    pub env: int,
}
