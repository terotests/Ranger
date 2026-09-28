// SPDX-License-Identifier: AGPL-3.0-or-later
//! The machine: the object heap, conversions, property access, calls, the
//! interpreter loop and a mark-and-sweep collector.

use ranger::prelude::*;
use std::collections::HashMap;
use std::rc::Rc;

use crate::jsstr;
use crate::num::*;
use crate::ops::*;
use crate::value::*;

// atoms interned first, in this order
pub const A_LENGTH: int = 0;
pub const A_PROTOTYPE: int = 1;
pub const A_CONSTRUCTOR: int = 2;
pub const A_NAME: int = 3;
pub const A_MESSAGE: int = 4;
pub const A_TOSTRING: int = 5;
pub const A_VALUEOF: int = 6;
pub const A_CALLEE: int = 7;
pub const A_ITERATOR: int = 8;
pub const A_NEXT: int = 9;
pub const A_DONE: int = 10;
pub const A_VALUE: int = 11;
pub const A_GET: int = 12;
pub const A_SET: int = 13;
pub const A_LASTINDEX: int = 14;
pub const A_INDEX: int = 15;
pub const A_INPUT: int = 16;
pub const A_PROTO: int = 17;
pub const A_STACK: int = 18;
pub const A_WRITABLE: int = 19;
pub const A_ENUMERABLE: int = 20;
pub const A_CONFIGURABLE: int = 21;
pub const A_RAW: int = 22;
pub const A_TOPRIMITIVE: int = 23;
pub const A_CAUSE: int = 24;
pub const A_GROUPS: int = 25;
pub const A_TOJSON: int = 26;
pub const A_HASINSTANCE: int = 27;
pub const A_ERRORS: int = 28;
pub const A_THEN: int = 29;
pub const A_CALLER: int = 35;
pub const A_ARGUMENTS: int = 36;

fn first_atoms() -> Vec<String> {
    let names = vec![
        "length",
        "prototype",
        "constructor",
        "name",
        "message",
        "toString",
        "valueOf",
        "callee",
        "@@iterator",
        "next",
        "done",
        "value",
        "get",
        "set",
        "lastIndex",
        "index",
        "input",
        "__proto__",
        "stack",
        "writable",
        "enumerable",
        "configurable",
        "raw",
        "@@toPrimitive",
        "cause",
        "groups",
        "toJSON",
        "@@hasInstance",
        "errors",
        "then",
        "globalThis",
        "",
        "join",
        "source",
        "flags",
        "caller",
        "arguments",
    ];
    let mut out: Vec<String> = Vec::new();
    for n in names {
        out.push(String::from(n));
    }
    out
}

pub struct Vm {
    pub objs: Vec<JsObj>,
    pub free_list: Vec<int>,
    pub protos: Vec<Proto>,
    pub atoms: HashMap<String, int>,
    pub atom_names: Vec<String>,
    /// atoms that are symbols (their description is the name)
    pub symbol_atoms: HashMap<int, int>,
    pub stack: Vec<Val>,
    pub frames: Vec<Frame>,
    pub handlers: Vec<Handler>,
    pub global: int,
    pub object_proto: int,
    pub function_proto: int,
    /// %GeneratorPrototype%, %GeneratorFunction.prototype%,
    /// %AsyncFunction.prototype%
    pub generator_proto: int,
    /// BigInt.prototype
    pub bigint_proto: int,
    /// %ThrowTypeError%'s getter/setter pair (strict `arguments.callee`)
    pub thrower_pair: int,
    /// the method name OP_GET_METHOD found not callable, and where
    pub bad_callee: String,
    pub bad_callee_at: int,
    /// each tagged template call site's strings object
    pub template_cache: HashMap<String, int>,
    /// ArrayBuffer.prototype
    pub array_buffer_proto: int,
    pub gen_fn_proto: int,
    pub async_fn_proto: int,
    /// the prelude's async function driver
    pub async_driver: Val,
    /// set by a yield, read by the resume that ran it
    pub gen_yielded: bool,
    pub array_proto: int,
    pub string_proto: int,
    pub number_proto: int,
    pub boolean_proto: int,
    pub symbol_proto: int,
    pub error_proto: int,
    pub type_error_proto: int,
    pub range_error_proto: int,
    pub reference_error_proto: int,
    pub syntax_error_proto: int,
    pub regexp_proto: int,
    pub date_proto: int,
    pub map_proto: int,
    pub set_proto: int,
    pub iter_proto: int,
    pub promise_proto: int,
    pub array_values_fn: int,
    pub roots: Vec<int>,
    pub throwing: bool,
    pub exc: Val,
    pub out: Vec<String>,
    pub echo: bool,
    pub alloc_count: int,
    pub gc_threshold: int,
    pub native_depth: int,
    /// functions compiled from the prelude (protos below this) are built-ins
    pub prelude_protos: int,
    pub temp_roots: Vec<Val>,
    /// some object has a setter or a read-only property: writes that miss
    /// look along the prototype chain
    pub any_setter: bool,
    pub rng: int,
    pub gc_runs: int,
    pub symbols: Vec<int>,
    pub symbol_registry: HashMap<String, int>,
    /// promise jobs, four values each
    pub jobs: Vec<Val>,
    pub regexes: Vec<crate::regex::Regex>,
    pub regex_cache: HashMap<String, int>,
}

pub fn is_obj(v: &Val) -> bool {
    match v {
        Val::Obj(_) => true,
        _ => false,
    }
}

pub fn obj_of(v: &Val) -> int {
    match v {
        Val::Obj(o) => *o,
        _ => -1,
    }
}

/// `===` (strict) or `==` of two values that are objects, null or
/// undefined: 1 or 0; -1 when either is anything else.
pub fn quick_eq(a: &Val, b: &Val, strict: bool) -> int {
    match (a, b) {
        (Val::Obj(x), Val::Obj(y)) => {
            if x == y {
                1
            } else {
                0
            }
        }
        (Val::Null, Val::Null) | (Val::Undef, Val::Undef) => 1,
        (Val::Null, Val::Undef) | (Val::Undef, Val::Null) => {
            if strict {
                0
            } else {
                1
            }
        }
        (Val::Obj(_), Val::Null) | (Val::Obj(_), Val::Undef) | (Val::Null, Val::Obj(_)) | (Val::Undef, Val::Obj(_)) => 0,
        _ => -1,
    }
}

// generator states (JsObj.pos of a C_GENERATOR)
pub const GS_START: int = 0;
pub const GS_YIELD: int = 1;
pub const GS_RUNNING: int = 2;
pub const GS_DONE: int = 3;

/// `==` between a BigInt and a number or string; None when neither side is
/// a BigInt (or both are).
pub fn big_loose_eq(a: &Val, b: &Val) -> Option<bool> {
    // the BigInt side and the other side
    let (x, other) = match (a, b) {
        (Val::Big(p), Val::Big(_)) => {
            let _ = p;
            return None;
        }
        (Val::Big(p), _) => (p.clone(), b.clone()),
        (_, Val::Big(q)) => (q.clone(), a.clone()),
        _ => return None,
    };
    match &other {
        Val::Num(y) => {
            if !is_finite(*y) || y.floor() != *y {
                return Some(false);
            }
            Some(crate::bigint::compare(&x, &crate::bigint::from_double(*y)) == 0)
        }
        Val::Str(s) => match crate::bigint::parse(s.as_str()) {
            Some(y) => Some(crate::bigint::compare(&x, &y) == 0),
            None => Some(false),
        },
        _ => None,
    }
}

/// `<` with a BigInt on either side (primitives): 1, 0, or -1 (undefined).
pub fn big_less(a: &Val, b: &Val) -> int {
    let x = big_or_num(a);
    let y = big_or_num(b);
    match (&x, &y) {
        (Val::Big(p), Val::Big(q)) => {
            if crate::bigint::compare(p, q) < 0 { 1 } else { 0 }
        }
        _ => {
            let p = match &x {
                Val::Big(v) => crate::bigint::to_double(v),
                Val::Num(n) => *n,
                _ => nan(),
            };
            let q = match &y {
                Val::Big(v) => crate::bigint::to_double(v),
                Val::Num(n) => *n,
                _ => nan(),
            };
            if is_nan(p) || is_nan(q) {
                -1
            } else if p < q {
                1
            } else {
                0
            }
        }
    }
}

fn big_or_num(v: &Val) -> Val {
    match v {
        Val::Big(_) => v.clone(),
        Val::Num(_) => v.clone(),
        Val::Str(s) => match crate::bigint::parse(s.as_str()) {
            Some(b) => Val::Big(Rc::new(b)),
            None => Val::Num(nan()),
        },
        Val::Bool(b) => Val::Num(if *b { 1.0 } else { 0.0 }),
        Val::Null => Val::Num(0.0),
        _ => Val::Num(nan()),
    }
}

pub fn truthy(v: &Val) -> bool {
    match v {
        Val::Undef => false,
        Val::Null => false,
        Val::Bool(b) => *b,
        Val::Num(n) => *n != 0.0 && *n == *n,
        Val::Big(b) => !crate::bigint::is_zero(b),
        Val::Str(s) => !s.is_empty(),
        Val::Obj(_) => true,
    }
}

impl Vm {
    pub fn new() -> Vm {
        let mut vm = Vm {
            objs: Vec::new(),
            free_list: Vec::new(),
            protos: Vec::new(),
            atoms: HashMap::new(),
            atom_names: Vec::new(),
            symbol_atoms: HashMap::new(),
            stack: Vec::new(),
            frames: Vec::new(),
            handlers: Vec::new(),
            global: -1,
            object_proto: -1,
            function_proto: -1,
            generator_proto: -1,
            bigint_proto: -1,
            thrower_pair: -1,
            bad_callee: String::new(),
            bad_callee_at: -1,
            template_cache: HashMap::new(),
            array_buffer_proto: -1,
            gen_fn_proto: -1,
            async_fn_proto: -1,
            async_driver: Val::Undef,
            gen_yielded: false,
            array_proto: -1,
            string_proto: -1,
            number_proto: -1,
            boolean_proto: -1,
            symbol_proto: -1,
            error_proto: -1,
            type_error_proto: -1,
            range_error_proto: -1,
            reference_error_proto: -1,
            syntax_error_proto: -1,
            regexp_proto: -1,
            date_proto: -1,
            map_proto: -1,
            set_proto: -1,
            iter_proto: -1,
            promise_proto: -1,
            array_values_fn: -1,
            roots: Vec::new(),
            throwing: false,
            exc: Val::Undef,
            out: Vec::new(),
            echo: false,
            alloc_count: 0,
            gc_threshold: 200000,
            native_depth: 0,
            prelude_protos: 0,
            temp_roots: Vec::new(),
            any_setter: false,
            rng: 42,
            gc_runs: 0,
            symbols: Vec::new(),
            symbol_registry: HashMap::new(),
            jobs: Vec::new(),
            regexes: Vec::new(),
            regex_cache: HashMap::new(),
        };
        for n in first_atoms() {
            vm.intern(n.as_str());
        }
        vm
    }

    pub fn intern(&mut self, s: &str) -> int {
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

    pub fn atom_str(&self, a: int) -> String {
        self.atom_names[a as usize].clone()
    }

    pub fn is_symbol_atom(&self, a: int) -> bool {
        self.symbol_atoms.contains_key(&a)
    }

    // ---- allocation

    pub fn alloc(&mut self, class: int, proto: int) -> int {
        self.alloc_count += 1;
        if !self.free_list.is_empty() {
            let i = self.free_list.pop().unwrap();
            let o = &mut self.objs[i as usize];
            o.class = class;
            o.proto = proto;
            o.free = false;
            o.marked = false;
            return i;
        }
        self.objs.push(JsObj::new(class, proto));
        (self.objs.len() as int) - 1
    }

    pub fn new_object(&mut self) -> int {
        let p = self.object_proto;
        self.alloc(C_OBJECT, p)
    }

    pub fn new_array(&mut self, elems: Vec<Val>) -> int {
        let p = self.array_proto;
        let a = self.alloc(C_ARRAY, p);
        self.objs[a as usize].elems = elems;
        a
    }

    pub fn new_error(&mut self, proto: int, msg: &str) -> int {
        let e = self.alloc(C_ERROR, proto);
        if !msg.is_empty() {
            self.objs[e as usize].add(A_MESSAGE, str_val(msg), P_HIDDEN);
        }
        e
    }

    pub fn throw_val(&mut self, v: Val) {
        self.exc = v;
        self.throwing = true;
    }

    pub fn throw_type(&mut self, msg: &str) {
        let p = self.type_error_proto;
        let e = self.new_error(p, msg);
        self.throw_val(Val::Obj(e));
    }

    pub fn throw_range(&mut self, msg: &str) {
        let p = self.range_error_proto;
        let e = self.new_error(p, msg);
        self.throw_val(Val::Obj(e));
    }

    pub fn throw_ref(&mut self, msg: &str) {
        let p = self.reference_error_proto;
        let e = self.new_error(p, msg);
        self.throw_val(Val::Obj(e));
    }

    pub fn throw_syntax(&mut self, msg: &str) {
        let p = self.syntax_error_proto;
        let e = self.new_error(p, msg);
        self.throw_val(Val::Obj(e));
    }

    // ---- conversions

    pub fn class_of(&self, v: &Val) -> int {
        match v {
            Val::Obj(o) => self.objs[*o as usize].class,
            _ => -1,
        }
    }

    pub fn is_callable(&self, v: &Val) -> bool {
        let c = self.class_of(v);
        if c == C_PROXY {
            // a proxy of a function (callable while revoked too)
            let o = obj_of(v);
            let t = self.objs[o as usize].env;
            return t < 0 || self.is_callable(&Val::Obj(t));
        }
        c == C_FUNCTION || c == C_NATIVE || c == C_BOUND
    }

    pub fn type_of(&self, v: &Val) -> String {
        let s = match v {
            Val::Undef => "undefined",
            Val::Null => "object",
            Val::Bool(_) => "boolean",
            Val::Num(_) => "number",
            Val::Big(_) => "bigint",
            Val::Str(_) => "string",
            Val::Obj(o) => {
                let c = self.objs[*o as usize].class;
                if c == C_FUNCTION || c == C_NATIVE || c == C_BOUND || (c == C_PROXY && self.is_callable(v)) {
                    "function"
                } else if c == C_SYMBOL {
                    "symbol"
                } else {
                    "object"
                }
            }
        };
        String::from(s)
    }

    /// ToPrimitive: `hint` "number", "string" or "default"
    pub fn to_primitive(&mut self, v: &Val, hint: &str) -> Val {
        let o = match v {
            Val::Obj(o) => *o,
            _ => return v.clone(),
        };
        let class = self.objs[o as usize].class;
        if class == C_SYMBOL {
            return v.clone();
        }
        // @@toPrimitive
        let tp = self.get_obj(o, A_TOPRIMITIVE, v);
        if self.throwing {
            return Val::Undef;
        }
        if self.is_callable(&tp) {
            let r = self.call_value(tp, v.clone(), vec![str_val(hint)]);
            if self.throwing {
                return Val::Undef;
            }
            if is_obj(&r) {
                self.throw_type("Cannot convert object to primitive value");
                return Val::Undef;
            }
            return r;
        }
        let order = if hint == "string" { vec![A_TOSTRING, A_VALUEOF] } else { vec![A_VALUEOF, A_TOSTRING] };
        for a in order {
            let f = self.get_obj(o, a, v);
            if self.throwing {
                return Val::Undef;
            }
            if self.is_callable(&f) {
                let r = self.call_value(f, v.clone(), Vec::new());
                if self.throwing {
                    return Val::Undef;
                }
                if !is_obj(&r) {
                    return r;
                }
            }
        }
        self.throw_type("Cannot convert object to primitive value");
        Val::Undef
    }

    pub fn to_number(&mut self, v: &Val) -> double {
        match v {
            Val::Num(n) => *n,
            Val::Big(_) => {
                self.throw_type("Cannot convert a BigInt value to a number");
                nan()
            }
            Val::Undef => nan(),
            Val::Null => 0.0,
            Val::Bool(b) => {
                if *b {
                    1.0
                } else {
                    0.0
                }
            }
            Val::Str(s) => string_to_number(s.as_str()),
            Val::Obj(o) => {
                if self.objs[*o as usize].class == C_SYMBOL {
                    self.throw_type("Cannot convert a Symbol value to a number");
                    return nan();
                }
                let p = self.to_primitive(v, "number");
                if self.throwing {
                    return nan();
                }
                self.to_number(&p)
            }
        }
    }

    pub fn to_str(&mut self, v: &Val) -> Rc<String> {
        match v {
            Val::Str(s) => s.clone(),
            Val::Num(n) => Rc::new(number_to_string(*n)),
            Val::Big(b) => Rc::new(crate::bigint::to_string_radix(b, 10)),
            Val::Undef => Rc::new(String::from("undefined")),
            Val::Null => Rc::new(String::from("null")),
            Val::Bool(b) => Rc::new(String::from(if *b { "true" } else { "false" })),
            Val::Obj(o) => {
                if self.objs[*o as usize].class == C_SYMBOL {
                    self.throw_type("Cannot convert a Symbol value to a string");
                    return Rc::new(String::new());
                }
                let p = self.to_primitive(v, "string");
                if self.throwing {
                    return Rc::new(String::new());
                }
                self.to_str(&p)
            }
        }
    }

    pub fn to_string(&mut self, v: &Val) -> String {
        let r = self.to_str(v);
        r.as_ref().clone()
    }

    pub fn to_object(&mut self, v: &Val) -> int {
        match v {
            Val::Obj(o) => *o,
            Val::Undef | Val::Null => {
                self.throw_type("Cannot convert undefined or null to object");
                -1
            }
            Val::Bool(_) => {
                let p = self.boolean_proto;
                let o = self.alloc(C_BOOLEAN, p);
                self.objs[o as usize].prim = v.clone();
                o
            }
            Val::Num(_) => {
                let p = self.number_proto;
                let o = self.alloc(C_NUMBER, p);
                self.objs[o as usize].prim = v.clone();
                o
            }
            Val::Big(_) => {
                let p = self.bigint_proto;
                let o = self.alloc(C_OBJECT, p);
                self.objs[o as usize].prim = v.clone();
                o
            }
            Val::Str(_) => {
                let p = self.string_proto;
                let o = self.alloc(C_STRING, p);
                self.objs[o as usize].prim = v.clone();
                o
            }
        }
    }

    pub fn strict_equals(&self, a: &Val, b: &Val) -> bool {
        match (a, b) {
            (Val::Num(x), Val::Num(y)) => x == y,
            (Val::Big(x), Val::Big(y)) => crate::bigint::compare(x, y) == 0,
            (Val::Str(x), Val::Str(y)) => x.as_str() == y.as_str(),
            (Val::Undef, Val::Undef) => true,
            (Val::Null, Val::Null) => true,
            (Val::Bool(x), Val::Bool(y)) => x == y,
            (Val::Obj(x), Val::Obj(y)) => x == y,
            _ => false,
        }
    }

    pub fn same_value_zero(&self, a: &Val, b: &Val) -> bool {
        match (a, b) {
            (Val::Num(x), Val::Num(y)) => x == y || (is_nan(*x) && is_nan(*y)),
            _ => self.strict_equals(a, b),
        }
    }

    pub fn same_value(&self, a: &Val, b: &Val) -> bool {
        match (a, b) {
            (Val::Num(x), Val::Num(y)) => {
                if is_nan(*x) && is_nan(*y) {
                    return true;
                }
                if *x == 0.0 && *y == 0.0 {
                    return (1.0 / *x) == (1.0 / *y);
                }
                x == y
            }
            _ => self.strict_equals(a, b),
        }
    }

    pub fn loose_equals(&mut self, a: &Val, b: &Val) -> bool {
        if let (Val::Big(x), Val::Big(y)) = (a, b) {
            return crate::bigint::compare(x, y) == 0;
        }
        match (a, b) {
            (Val::Undef, Val::Null) | (Val::Null, Val::Undef) => return true,
            (Val::Undef, Val::Undef) | (Val::Null, Val::Null) => return true,
            (Val::Undef, _) | (Val::Null, _) | (_, Val::Undef) | (_, Val::Null) => return false,
            (Val::Num(x), Val::Num(y)) => return x == y,
            (Val::Str(x), Val::Str(y)) => return x.as_str() == y.as_str(),
            (Val::Bool(x), Val::Bool(y)) => return x == y,
            (Val::Obj(x), Val::Obj(y)) => return x == y,
            _ => {}
        }
        if let Val::Bool(x) = a {
            let n = Val::Num(if *x { 1.0 } else { 0.0 });
            return self.loose_equals(&n, b);
        }
        if let Val::Bool(y) = b {
            let n = Val::Num(if *y { 1.0 } else { 0.0 });
            return self.loose_equals(a, &n);
        }
        if let Some(r) = big_loose_eq(a, b) {
            return r;
        }
        match (a, b) {
            (Val::Num(x), Val::Str(s)) => return *x == string_to_number(s.as_str()),
            (Val::Str(s), Val::Num(y)) => return string_to_number(s.as_str()) == *y,
            _ => {}
        }
        if is_obj(a) && !is_obj(b) {
            if self.class_of(a) == C_SYMBOL {
                return false;
            }
            let p = self.to_primitive(a, "default");
            if self.throwing {
                return false;
            }
            return self.loose_equals(&p, b);
        }
        if is_obj(b) && !is_obj(a) {
            if self.class_of(b) == C_SYMBOL {
                return false;
            }
            let p = self.to_primitive(b, "default");
            if self.throwing {
                return false;
            }
            return self.loose_equals(a, &p);
        }
        false
    }

    // ---- property keys

    /// A property key: (array index, atom). The index is -1 when the key is
    /// not one; the atom is -1 when it was not interned (an index).
    pub fn to_key(&mut self, k: &Val) -> (int, int) {
        match k {
            Val::Num(n) => {
                if *n >= 0.0 && *n < 1000000000.0 {
                    let i = *n as int;
                    if (i as double) == *n {
                        return (i, -1);
                    }
                }
                let s = number_to_string(*n);
                let a = self.intern(s.as_str());
                (-1, a)
            }
            Val::Str(s) => {
                let i = jsstr::array_index(s.as_str());
                if i >= 0 {
                    return (i, -1);
                }
                let a = self.intern(s.as_str());
                (-1, a)
            }
            Val::Obj(o) => {
                if self.objs[*o as usize].class == C_SYMBOL {
                    return (-1, self.objs[*o as usize].pos);
                }
                let p = self.to_primitive(k, "string");
                if self.throwing {
                    return (-1, A_LENGTH);
                }
                self.to_key(&p)
            }
            _ => {
                let s = self.to_string(k);
                let a = self.intern(s.as_str());
                (-1, a)
            }
        }
    }

    pub fn index_atom(&mut self, i: int) -> int {
        let s = format!("{}", i);
        self.intern(s.as_str())
    }

    /// The array index an atom names ("0", "12"), or -1.
    pub fn atom_array_index(&self, a: int) -> int {
        if self.symbol_atoms.contains_key(&a) {
            return -1;
        }
        let bs = self.atom_names[a as usize].as_bytes();
        let n = bs.len();
        if n == 0 || n > 9 || (n > 1 && bs[0] == 48) {
            return -1;
        }
        let mut v: int = 0;
        let mut k: usize = 0;
        while k < n {
            let d = bs[k] as int;
            if d < 48 || d > 57 {
                return -1;
            }
            v = v * 10 + (d - 48);
            k += 1;
        }
        v
    }

    /// The array index (up to 2^32 - 2) an atom names, or -1.
    pub fn atom_uint32_index(&self, a: int) -> double {
        if self.symbol_atoms.contains_key(&a) {
            return -1.0;
        }
        let bs = self.atom_names[a as usize].as_bytes();
        let n = bs.len();
        if n == 0 || n > 10 || (n > 1 && bs[0] == 48) {
            return -1.0;
        }
        let mut v: double = 0.0;
        let mut k: usize = 0;
        while k < n {
            let d = bs[k] as int;
            if d < 48 || d > 57 {
                return -1.0;
            }
            v = v * 10.0 + ((d - 48) as double);
            k += 1;
        }
        if v > 4294967294.0 {
            return -1.0;
        }
        v
    }

    pub fn key_val(&self, a: int) -> Val {
        match self.symbol_atoms.get(&a) {
            Some(sym) => Val::Obj(*sym),
            None => str_val(self.atom_names[a as usize].as_str()),
        }
    }

    // ---- property access

    fn function_prototype(&mut self, f: int) -> Val {
        // made on first use
        let proto = self.object_proto;
        let p = self.alloc(C_OBJECT, proto);
        self.objs[p as usize].add(A_CONSTRUCTOR, Val::Obj(f), P_HIDDEN);
        self.objs[f as usize].add(A_PROTOTYPE, Val::Obj(p), P_HIDDEN | P_FIXED);
        self.objs[f as usize].has_proto_obj = true;
        Val::Obj(p)
    }

    /// A function's own `length`, `name`, `prototype` when not stored.
    fn function_own(&mut self, f: int, atom: int) -> Val {
        let class = self.objs[f as usize].class;
        if class == C_FUNCTION {
            let pi = self.objs[f as usize].func;
            if atom == A_LENGTH {
                return Val::Num(self.protos[pi as usize].length as double);
            }
            if atom == A_NAME {
                return str_val(self.protos[pi as usize].name.as_str());
            }
            if atom == A_PROTOTYPE && !self.objs[f as usize].has_proto_obj {
                let p = &self.protos[pi as usize];
                if p.generator {
                    let gp = self.generator_proto;
                    let o = self.alloc(C_OBJECT, gp);
                    self.objs[f as usize].add(A_PROTOTYPE, Val::Obj(o), P_HIDDEN | P_FIXED);
                    self.objs[f as usize].has_proto_obj = true;
                    return Val::Obj(o);
                }
                if !p.arrow && !(p.method && !p.class_ctor) && !p.getter_setter && !p.is_async {
                    return self.function_prototype(f);
                }
            }
        } else if class == C_BOUND {
            if atom == A_NAME {
                let t = self.objs[f as usize].env;
                let n = self.get_obj(t, A_NAME, &Val::Obj(t));
                let s = self.to_string(&n);
                return string_val(format!("bound {}", s));
            }
            if atom == A_LENGTH {
                let t = self.objs[f as usize].env;
                let l = self.get_obj(t, A_LENGTH, &Val::Obj(t));
                let n = self.to_number(&l) - (self.objs[f as usize].elems.len() as double);
                return Val::Num(if n < 0.0 { 0.0 } else { n });
            }
        }
        Val::Undef
    }

    /// `o[atom]` with `receiver` as `this` for getters.
    pub fn get_obj(&mut self, o: int, atom: int, receiver: &Val) -> Val {
        let mut cur = o;
        let mut hops = 0;
        while cur >= 0 {
            if self.objs[cur as usize].class == C_PROXY {
                let k = self.key_val(atom);
                return self.proxy_get(cur, k, receiver.clone());
            }
            let slot = self.objs[cur as usize].find(atom);
            if slot >= 0 {
                let attr = self.objs[cur as usize].attrs[slot as usize];
                if (attr & P_ACCESSOR) != 0 {
                    let pair = obj_of(&self.objs[cur as usize].vals[slot as usize]);
                    let g = self.objs[pair as usize].elems[0].clone();
                    if self.is_callable(&g) {
                        return self.call_value(g, receiver.clone(), Vec::new());
                    }
                    return Val::Undef;
                }
                return self.objs[cur as usize].vals[slot as usize].clone();
            }
            let class = self.objs[cur as usize].class;
            if class != C_OBJECT {
                if (class == C_ARRAY || class == C_ARGUMENTS) && atom == A_LENGTH {
                    return Val::Num(self.objs[cur as usize].elems.len() as double);
                }
                if cur != o && (class == C_ARRAY || class == C_ARGUMENTS) && !self.objs[cur as usize].elems.is_empty() {
                    // an element of an array further up the chain
                    let i = self.atom_array_index(atom);
                    if i >= 0 && (i as usize) < self.objs[cur as usize].elems.len() && !self.is_hole(cur, i) {
                        return self.objs[cur as usize].elems[i as usize].clone();
                    }
                }
                if class == C_FUNCTION && (atom == A_CALLER || atom == A_ARGUMENTS) {
                    // a sloppy function's own caller / arguments: null
                    let p = &self.protos[self.objs[cur as usize].func as usize];
                    if !p.strict && !p.arrow && !p.method && !p.class_ctor && !p.generator && !p.is_async && !p.getter_setter {
                        return Val::Null;
                    }
                }
                if class == C_FUNCTION || class == C_BOUND {
                    if (atom == A_LENGTH || atom == A_NAME || atom == A_PROTOTYPE) && !self.fn_prop_deleted(cur, atom) {
                        let v = self.function_own(cur, atom);
                        if !matches!(v, Val::Undef) || atom != A_PROTOTYPE {
                            return v;
                        }
                    }
                }
                if class == C_STRING && atom == A_LENGTH {
                    if let Val::Str(s) = &self.objs[cur as usize].prim {
                        return Val::Num(jsstr::len(s.as_str()) as double);
                    }
                }
            }
            if atom == A_PROTO {
                let p = self.objs[o as usize].proto;
                return if p >= 0 { Val::Obj(p) } else { Val::Null };
            }
            cur = self.objs[cur as usize].proto;
            hops += 1;
            if hops > 10000 {
                break;
            }
        }
        Val::Undef
    }

    pub fn get(&mut self, v: &Val, atom: int) -> Val {
        match v {
            Val::Obj(o) => self.get_obj(*o, atom, v),
            Val::Str(s) => {
                if atom == A_LENGTH {
                    return Val::Num(jsstr::len(s.as_str()) as double);
                }
                let p = self.string_proto;
                self.get_obj(p, atom, v)
            }
            Val::Num(_) => {
                let p = self.number_proto;
                self.get_obj(p, atom, v)
            }
            Val::Bool(_) => {
                let p = self.boolean_proto;
                self.get_obj(p, atom, v)
            }
            Val::Big(_) => {
                let p = self.bigint_proto;
                self.get_obj(p, atom, v)
            }
            _ => {
                let name = self.atom_str(atom);
                let what = if matches!(v, Val::Null) { "null" } else { "undefined" };
                self.throw_type(format!("Cannot read properties of {} (reading '{}')", what, name).as_str());
                Val::Undef
            }
        }
    }

    pub fn get_index(&mut self, v: &Val, i: int) -> Val {
        match v {
            Val::Obj(o) => {
                let ob = &self.objs[*o as usize];
                if ob.class == C_TYPED && ob.func != crate::typed::TA_DATAVIEW {
                    return self.ta_get(*o, i);
                }
                if ob.class == C_ARRAY || ob.class == C_ARGUMENTS {
                    if i < ob.elems.len() as int && !self.is_hole(*o, i) {
                        return ob.elems[i as usize].clone();
                    }
                    if ob.class == C_ARRAY && i >= ob.elems.len() as int {
                        return Val::Undef;
                    }
                    // a hole: an element kept as a property, or the prototype's
                }
                if ob.class == C_STRING {
                    if let Val::Str(s) = &ob.prim {
                        let c = jsstr::at(s.as_str(), i);
                        if c >= 0 {
                            return string_val(jsstr::from_unit(c));
                        }
                    }
                }
                let a = self.index_atom(i);
                self.get_obj(*o, a, v)
            }
            Val::Str(s) => {
                let c = jsstr::at(s.as_str(), i);
                if c >= 0 {
                    return string_val(jsstr::from_unit(c));
                }
                Val::Undef
            }
            _ => {
                let a = self.index_atom(i);
                self.get(v, a)
            }
        }
    }

    pub fn get_elem(&mut self, v: &Val, k: &Val) -> Val {
        if let Val::Num(n) = k {
            let i = if *n >= 0.0 && *n < 1000000000.0 { *n as int } else { -1 };
            if (i as double) == *n && i >= 0 {
                return self.get_index(v, i);
            }
        }
        if matches!(v, Val::Undef) || matches!(v, Val::Null) {
            let ks = self.to_string(k);
            let what = if matches!(v, Val::Null) { "null" } else { "undefined" };
            self.throw_type(format!("Cannot read properties of {} (reading '{}')", what, ks).as_str());
            return Val::Undef;
        }
        let (i, a) = self.to_key(k);
        if self.throwing {
            return Val::Undef;
        }
        if i >= 0 {
            return self.get_index(v, i);
        }
        self.get(v, a)
    }

    fn setter_on_chain(&mut self, o: int, atom: int, v: &Val, receiver: &Val) -> bool {
        // true when an accessor or read-only property up the chain took it
        let mut cur = self.objs[o as usize].proto;
        while cur >= 0 {
            let slot = self.objs[cur as usize].find(atom);
            if slot >= 0 {
                let attr = self.objs[cur as usize].attrs[slot as usize];
                if (attr & P_ACCESSOR) != 0 {
                    let pair = obj_of(&self.objs[cur as usize].vals[slot as usize]);
                    let s = self.objs[pair as usize].elems[1].clone();
                    if self.is_callable(&s) {
                        self.call_value(s, receiver.clone(), vec![v.clone()]);
                    } else if self.strict_now() {
                        let n = self.atom_str(atom);
                        self.throw_type(format!("Cannot set property {} of #<Object> which has only a getter", n).as_str());
                    }
                    return true;
                }
                if (attr & P_READONLY) != 0 {
                    if self.strict_now() {
                        let n = self.atom_str(atom);
                        self.throw_type(format!("Cannot assign to read only property '{}' of object '#<Object>'", n).as_str());
                    }
                    return true;
                }
                return false;
            }
            cur = self.objs[cur as usize].proto;
        }
        false
    }

    pub fn set_obj(&mut self, o: int, atom: int, v: Val) {
        if self.objs[o as usize].class == C_PROXY {
            let k = self.key_val(atom);
            self.proxy_set(o, k, v, Val::Obj(o));
            return;
        }
        let slot = self.objs[o as usize].find(atom);
        if slot >= 0 {
            let attr = self.objs[o as usize].attrs[slot as usize];
            if attr == 0 {
                self.objs[o as usize].vals[slot as usize] = v;
                return;
            }
            if (attr & P_ACCESSOR) != 0 {
                let pair = obj_of(&self.objs[o as usize].vals[slot as usize]);
                let s = self.objs[pair as usize].elems[1].clone();
                if self.is_callable(&s) {
                    self.call_value(s, Val::Obj(o), vec![v]);
                } else if self.strict_now() {
                    let n = self.atom_str(atom);
                    self.throw_type(format!("Cannot set property {} of #<Object> which has only a getter", n).as_str());
                }
                return;
            }
            if (attr & P_READONLY) != 0 {
                if self.strict_now() {
                    let n = self.atom_str(atom);
                    self.throw_type(format!("Cannot assign to read only property '{}' of object", n).as_str());
                }
                return;
            }
            self.objs[o as usize].vals[slot as usize] = v;
            return;
        }
        let class = self.objs[o as usize].class;
        if class == C_ARRAY && atom == A_LENGTH {
            let n = self.to_number(&v);
            self.set_length(o, n);
            return;
        }
        if atom == A_PROTO {
            match v {
                Val::Obj(p) => self.objs[o as usize].proto = p,
                Val::Null => self.objs[o as usize].proto = -1,
                _ => {}
            }
            return;
        }
        if self.any_setter && self.setter_on_chain(o, atom, &v, &Val::Obj(o)) {
            return;
        }
        if !self.objs[o as usize].extensible {
            if self.strict_now() {
                let n = self.atom_str(atom);
                self.throw_type(format!("Cannot add property {}, object is not extensible", n).as_str());
            }
            return;
        }
        if (class == C_FUNCTION || class == C_BOUND) && atom == A_PROTOTYPE {
            self.objs[o as usize].has_proto_obj = true;
        }
        self.objs[o as usize].add(atom, v, 0);
    }

    pub fn strict_now(&self) -> bool {
        if self.frames.is_empty() {
            return false;
        }
        let f = &self.frames[self.frames.len() - 1];
        self.protos[f.proto as usize].strict
    }

    pub fn set_length(&mut self, o: int, n: double) {
        let len = n as int;
        if (len as double) != n || len < 0 {
            self.throw_range("Invalid array length");
            return;
        }
        let cur = self.objs[o as usize].elems.len() as int;
        // index properties past the new length (x[4294967294]) go
        let mut k = self.objs[o as usize].keys.len() as int - 1;
        while k >= 0 {
            let at = self.objs[o as usize].keys[k as usize];
            let ix = self.atom_uint32_index(at);
            if ix >= 0.0 && ix >= n {
                self.objs[o as usize].remove(k);
            }
            k -= 1;
        }
        if len < cur {
            let holes = self.has_holes(o);
            self.objs[o as usize].elems.truncate(len as usize);
            if holes {
                self.objs[o as usize].saved.truncate(len as usize);
            }
        } else {
            // a longer array has holes at the end
            self.push_holes(o, len - cur);
        }
    }

    pub fn set(&mut self, target: &Val, atom: int, v: Val) {
        match target {
            Val::Obj(o) => self.set_obj(*o, atom, v),
            Val::Undef | Val::Null => {
                let n = self.atom_str(atom);
                let what = if matches!(target, Val::Null) { "null" } else { "undefined" };
                self.throw_type(format!("Cannot set properties of {} (setting '{}')", what, n).as_str());
            }
            _ => {
                if self.strict_now() && !self.any_setter {
                    let n = self.atom_str(atom);
                    self.throw_type(format!("Cannot create property '{}' on primitive", n).as_str());
                }
            }
        }
    }

    pub fn set_index(&mut self, o: int, i: int, v: Val) {
        let class = self.objs[o as usize].class;
        if class == C_TYPED && self.objs[o as usize].func != crate::typed::TA_DATAVIEW {
            self.ta_set(o, i, &v);
            return;
        }
        if class == C_ARRAY || class == C_ARGUMENTS {
            let len = self.objs[o as usize].elems.len() as int;
            if i < len {
                if class == C_ARRAY && self.objs[o as usize].pos == 2 {
                    // a frozen array's elements are read-only
                    if self.strict_now() {
                        self.throw_type(format!("Cannot assign to read only property '{}' of object '[object Array]'", i).as_str());
                    }
                    return;
                }
                if self.is_hole(o, i) {
                    // an element kept as a property takes the write itself
                    // (a deleted argument stays unmapped: a property too)
                    let at = self.index_atom(i);
                    if self.objs[o as usize].find(at) >= 0 || class == C_ARGUMENTS {
                        self.set_obj(o, at, v);
                        return;
                    }
                    self.set_hole(o, i, false);
                }
                self.objs[o as usize].elems[i as usize] = v;
                return;
            }
            if class == C_ARRAY && self.objs[o as usize].extensible && i < len + 50000000 {
                // the elements between the old end and i are holes
                self.push_holes(o, i - len);
                let holes = self.has_holes(o);
                self.objs[o as usize].elems.push(v);
                if holes {
                    self.objs[o as usize].saved.push(0);
                }
                return;
            }
        }
        let a = self.index_atom(i);
        self.set_obj(o, a, v);
    }

    pub fn set_elem(&mut self, target: &Val, k: &Val, v: Val) {
        if let Val::Obj(o) = target {
            if let Val::Num(n) = k {
                let i = if *n >= 0.0 && *n < 1000000000.0 { *n as int } else { -1 };
                if (i as double) == *n && i >= 0 {
                    self.set_index(*o, i, v);
                    return;
                }
            }
            let (i, a) = self.to_key(k);
            if self.throwing {
                return;
            }
            if i >= 0 {
                self.set_index(*o, i, v);
            } else {
                self.set_obj(*o, a, v);
            }
            return;
        }
        if matches!(target, Val::Undef) || matches!(target, Val::Null) {
            let ks = self.to_string(k);
            let what = if matches!(target, Val::Null) { "null" } else { "undefined" };
            self.throw_type(format!("Cannot set properties of {} (setting '{}')", what, ks).as_str());
        }
    }

    /// Defines (or redefines) an own data property.
    pub fn define(&mut self, o: int, atom: int, v: Val, attr: int) {
        let slot = self.objs[o as usize].find(atom);
        if slot >= 0 {
            self.objs[o as usize].vals[slot as usize] = v;
            self.objs[o as usize].attrs[slot as usize] = attr;
        } else {
            self.objs[o as usize].add(atom, v, attr);
        }
        if (attr & P_READONLY) != 0 {
            self.any_setter = true;
        }
        let class = self.objs[o as usize].class;
        if (class == C_FUNCTION || class == C_BOUND) && atom == A_PROTOTYPE {
            self.objs[o as usize].has_proto_obj = true;
        }
    }

    pub fn define_elem(&mut self, o: int, k: &Val, v: Val, attr: int) {
        let (i, a) = self.to_key(k);
        if self.throwing {
            return;
        }
        if i >= 0 && self.objs[o as usize].class == C_ARRAY && attr == 0 {
            self.set_index(o, i, v);
            return;
        }
        let atom = if i >= 0 { self.index_atom(i) } else { a };
        self.define(o, atom, v, attr);
    }

    /// Defines a getter (`which` 0) or setter (1).
    pub fn define_accessor(&mut self, o: int, atom: int, f: Val, which: int, hidden: bool) {
        self.any_setter = true;
        let slot = self.objs[o as usize].find(atom);
        let mut pair: int = -1;
        if slot >= 0 && (self.objs[o as usize].attrs[slot as usize] & P_ACCESSOR) != 0 {
            pair = obj_of(&self.objs[o as usize].vals[slot as usize]);
        }
        if pair < 0 {
            pair = self.alloc(C_ACCESSOR, -1);
            self.objs[pair as usize].elems = vec![Val::Undef, Val::Undef];
            let attr = P_ACCESSOR | if hidden { P_HIDDEN } else { 0 };
            if slot >= 0 {
                self.objs[o as usize].vals[slot as usize] = Val::Obj(pair);
                self.objs[o as usize].attrs[slot as usize] = attr;
            } else {
                self.objs[o as usize].add(atom, Val::Obj(pair), attr);
            }
        }
        self.objs[pair as usize].elems[which as usize] = f;
    }

    pub fn has_property(&mut self, o: int, k: &Val) -> bool {
        if self.objs[o as usize].class == C_PROXY {
            return self.proxy_has(o, k.clone());
        }
        let (i, a) = self.to_key(k);
        if i >= 0 {
            let class = self.objs[o as usize].class;
            if self.is_typed(o) {
                return i < self.ta_length(o);
            }
            if (class == C_ARRAY || class == C_ARGUMENTS) && i < self.objs[o as usize].elems.len() as int && !self.is_hole(o, i) {
                return true;
            }
            if class == C_STRING {
                if let Val::Str(s) = &self.objs[o as usize].prim {
                    if i < jsstr::len(s.as_str()) {
                        return true;
                    }
                }
            }
            let at = self.index_atom(i);
            return self.has_atom(o, at);
        }
        self.has_atom(o, a)
    }

    pub fn has_atom(&mut self, o: int, a: int) -> bool {
        let mut cur = o;
        while cur >= 0 {
            if self.objs[cur as usize].find(a) >= 0 {
                return true;
            }
            let class = self.objs[cur as usize].class;
            if a == A_LENGTH && (class == C_ARRAY || class == C_ARGUMENTS || class == C_STRING || class == C_FUNCTION || class == C_BOUND) && !self.fn_prop_deleted(cur, a) {
                return true;
            }
            if (a == A_NAME) && (class == C_FUNCTION || class == C_BOUND) && !self.fn_prop_deleted(cur, a) {
                return true;
            }
            if cur != o && (class == C_ARRAY || class == C_ARGUMENTS) && !self.objs[cur as usize].elems.is_empty() {
                let i = self.atom_array_index(a);
                if i >= 0 && (i as usize) < self.objs[cur as usize].elems.len() && !self.is_hole(cur, i) {
                    return true;
                }
            }
            if a == A_PROTOTYPE && class == C_FUNCTION {
                let v = self.function_own(cur, a);
                if !matches!(v, Val::Undef) {
                    return true;
                }
            }
            cur = self.objs[cur as usize].proto;
        }
        false
    }

    /// A function's own length (bit 1) or name (bit 2) was deleted.
    pub fn fn_prop_deleted(&self, o: int, atom: int) -> bool {
        let bits = self.objs[o as usize].pos;
        if atom == A_LENGTH {
            return (bits & 1) != 0;
        }
        if atom == A_NAME {
            return (bits & 2) != 0;
        }
        false
    }

    pub fn has_own(&mut self, o: int, k: &Val) -> bool {
        if self.objs[o as usize].class == C_PROXY {
            let d = self.proxy_own_desc(o, k.clone());
            return is_obj(&d);
        }
        let (i, a) = self.to_key(k);
        let class = self.objs[o as usize].class;
        if i >= 0 {
            if self.is_typed(o) {
                return i < self.ta_length(o);
            }
            if (class == C_ARRAY || class == C_ARGUMENTS) && i < self.objs[o as usize].elems.len() as int && !self.is_hole(o, i) {
                return true;
            }
            if class == C_STRING {
                if let Val::Str(s) = &self.objs[o as usize].prim {
                    if i < jsstr::len(s.as_str()) {
                        return true;
                    }
                }
            }
            let at = self.index_atom(i);
            return self.objs[o as usize].find(at) >= 0;
        }
        if self.objs[o as usize].find(a) >= 0 {
            return true;
        }
        if a == A_LENGTH && (class == C_ARRAY || class == C_ARGUMENTS || class == C_STRING || class == C_FUNCTION) && !self.fn_prop_deleted(o, a) {
            return true;
        }
        if a == A_NAME && class == C_FUNCTION && !self.fn_prop_deleted(o, a) {
            return true;
        }
        if a == A_PROTOTYPE && class == C_FUNCTION {
            let v = self.function_own(o, a);
            return !matches!(v, Val::Undef);
        }
        false
    }

    pub fn delete(&mut self, o: int, k: &Val) -> bool {
        if self.objs[o as usize].class == C_PROXY {
            return self.proxy_delete(o, k.clone());
        }
        let (i, a) = self.to_key(k);
        let class = self.objs[o as usize].class;
        if i >= 0 && (class == C_ARRAY || class == C_ARGUMENTS) {
            let len = self.objs[o as usize].elems.len() as int;
            if i < len {
                if class == C_ARGUMENTS {
                    // gone, and no longer the parameter
                    self.objs[o as usize].elems[i as usize] = Val::Undef;
                    self.set_hole(o, i, true);
                } else {
                    self.objs[o as usize].elems[i as usize] = Val::Undef;
                    if class == C_ARRAY {
                        self.set_hole(o, i, true);
                        // an element kept as a property (an accessor, …) goes too
                        let at = self.index_atom(i);
                        let slot = self.objs[o as usize].find(at);
                        if slot >= 0 {
                            self.objs[o as usize].remove(slot);
                        }
                    }
                }
            }
            return true;
        }
        let atom = if i >= 0 { self.index_atom(i) } else { a };
        let slot = self.objs[o as usize].find(atom);
        if slot < 0 && (class == C_FUNCTION || class == C_BOUND) && (atom == A_LENGTH || atom == A_NAME) {
            // a function's own length / name (made on read) is configurable
            self.objs[o as usize].pos = self.objs[o as usize].pos | (if atom == A_LENGTH { 1 } else { 2 });
            return true;
        }
        if slot >= 0 {
            if (self.objs[o as usize].attrs[slot as usize] & P_FIXED) != 0 {
                if self.strict_now() {
                    let n = self.atom_str(atom);
                    self.throw_type(format!("Cannot delete property '{}'", n).as_str());
                }
                return false;
            }
            self.objs[o as usize].remove(slot);
        }
        true
    }

    /// Own enumerable string keys in the order JavaScript lists them:
    /// integer keys ascending, then the others as they were added.
    pub fn own_keys(&mut self, o: int, include_hidden: bool, symbols: bool) -> Vec<Val> {
        if self.objs[o as usize].class == C_PROXY {
            return self.proxy_keys(o, include_hidden, symbols);
        }
        let mut out: Vec<Val> = Vec::new();
        let class = self.objs[o as usize].class;
        if class == C_ARRAY || class == C_ARGUMENTS {
            let n = self.objs[o as usize].elems.len();
            let mut i: usize = 0;
            while i < n {
                if !self.is_hole(o, i as int) {
                    out.push(string_val(format!("{}", i)));
                }
                i += 1;
            }
        }
        if self.is_typed(o) {
            let n = self.ta_length(o);
            let mut i: int = 0;
            while i < n {
                out.push(string_val(format!("{}", i)));
                i += 1;
            }
        }
        if class == C_STRING {
            if let Val::Str(s) = &self.objs[o as usize].prim {
                let n = jsstr::len(s.as_str());
                let mut i: int = 0;
                while i < n {
                    out.push(string_val(format!("{}", i)));
                    i += 1;
                }
            }
        }
        let keys = self.objs[o as usize].keys.clone();
        let attrs = self.objs[o as usize].attrs.clone();
        let mut ints: Vec<int> = Vec::new();
        let mut others: Vec<int> = Vec::new();
        let mut syms: Vec<int> = Vec::new();
        let mut k: usize = 0;
        while k < keys.len() {
            let a = keys[k];
            if (attrs[k] & P_HIDDEN) != 0 && !include_hidden {
                k += 1;
                continue;
            }
            if self.atom_names[a as usize].starts_with('\u{1}') {
                // a private name: never a key
            } else if self.symbol_atoms.contains_key(&a) {
                syms.push(a);
            } else if jsstr::array_index(self.atom_names[a as usize].as_str()) >= 0 {
                ints.push(a);
            } else {
                others.push(a);
            }
            k += 1;
        }
        if ints.len() > 1 {
            // insertion sort by numeric value
            let mut i: usize = 1;
            while i < ints.len() {
                let mut j = i;
                while j > 0 && jsstr::array_index(self.atom_names[ints[j - 1] as usize].as_str()) > jsstr::array_index(self.atom_names[ints[j] as usize].as_str()) {
                    let t = ints[j];
                    ints[j] = ints[j - 1];
                    ints[j - 1] = t;
                    j -= 1;
                }
                i += 1;
            }
        }
        for a in ints {
            out.push(str_val(self.atom_names[a as usize].as_str()));
        }
        for a in others {
            out.push(str_val(self.atom_names[a as usize].as_str()));
        }
        if symbols {
            for a in syms {
                out.push(self.key_val(a));
            }
        }
        out
    }

    /// Keys a for-in visits: own and inherited enumerable string keys.
    pub fn for_in_keys(&mut self, o: int) -> Vec<Val> {
        let mut out: Vec<Val> = Vec::new();
        let mut seen: HashMap<String, bool> = HashMap::new();
        let mut cur = o;
        let mut first = true;
        while cur >= 0 {
            let all = self.own_keys(cur, true, false);
            let visible = self.own_keys(cur, false, false);
            let mut vis: HashMap<String, bool> = HashMap::new();
            for v in visible.iter() {
                if let Val::Str(s) = v {
                    vis.insert(s.as_ref().clone(), true);
                }
            }
            for v in all {
                if let Val::Str(s) = &v {
                    let key = s.as_ref().clone();
                    if seen.contains_key(&key) {
                        continue;
                    }
                    seen.insert(key.clone(), true);
                    if vis.contains_key(&key) {
                        out.push(v.clone());
                    }
                }
            }
            let _ = first;
            first = false;
            cur = self.objs[cur as usize].proto;
        }
        out
    }

    pub fn instance_of(&mut self, v: &Val, f: &Val) -> bool {
        if !is_obj(f) {
            self.throw_type("Right-hand side of 'instanceof' is not callable");
            return false;
        }
        let fo = obj_of(f);
        let hi = self.get_obj(fo, A_HASINSTANCE, f);
        if self.is_callable(&hi) && self.objs[obj_of(&hi) as usize].class != C_NATIVE {
            let r = self.call_value(hi, f.clone(), vec![v.clone()]);
            return truthy(&r);
        }
        if !self.is_callable(f) {
            self.throw_type("Right-hand side of 'instanceof' is not callable");
            return false;
        }
        let mut target = fo;
        while self.objs[target as usize].class == C_BOUND {
            target = self.objs[target as usize].env;
        }
        let o = match v {
            Val::Obj(o) => *o,
            _ => return false,
        };
        let p = self.get_obj(target, A_PROTOTYPE, &Val::Obj(target));
        let proto = match p {
            Val::Obj(p) => p,
            _ => {
                self.throw_type("Function has non-object prototype in instanceof check");
                return false;
            }
        };
        let mut cur = self.proto_of(o);
        while cur >= 0 && !self.throwing {
            if cur == proto {
                return true;
            }
            cur = self.proto_of(cur);
        }
        false
    }

    // ---- arithmetic helpers

    pub fn add_vals(&mut self, a: &Val, b: &Val) -> Val {
        match (a, b) {
            (Val::Num(x), Val::Num(y)) => return Val::Num(x + y),
            (Val::Str(x), Val::Str(y)) => {
                let mut s = String::new();
                s.push_str(x.as_str());
                s.push_str(y.as_str());
                return string_val(s);
            }
            _ => {}
        }
        let pa = self.to_primitive(a, "default");
        if self.throwing {
            return Val::Undef;
        }
        let pb = self.to_primitive(b, "default");
        if self.throwing {
            return Val::Undef;
        }
        if matches!(pa, Val::Str(_)) || matches!(pb, Val::Str(_)) {
            let x = self.to_str(&pa);
            let y = self.to_str(&pb);
            if self.throwing {
                return Val::Undef;
            }
            let mut s = String::new();
            s.push_str(x.as_str());
            s.push_str(y.as_str());
            return string_val(s);
        }
        if matches!(pa, Val::Big(_)) || matches!(pb, Val::Big(_)) {
            if let (Val::Big(x), Val::Big(y)) = (&pa, &pb) {
                return Val::Big(Rc::new(crate::bigint::add(x, y)));
            }
            self.throw_type("Cannot mix BigInt and other types, use explicit conversions");
            return Val::Undef;
        }
        let x = self.to_number(&pa);
        let y = self.to_number(&pb);
        Val::Num(x + y)
    }

    /// `<`: 1 true, 0 false, -1 undefined (NaN)
    pub fn less_than(&mut self, a: &Val, b: &Val) -> int {
        if let (Val::Num(x), Val::Num(y)) = (a, b) {
            if is_nan(*x) || is_nan(*y) {
                return -1;
            }
            return if x < y { 1 } else { 0 };
        }
        let pa = self.to_primitive(a, "number");
        if self.throwing {
            return -1;
        }
        let pb = self.to_primitive(b, "number");
        if self.throwing {
            return -1;
        }
        if let (Val::Str(x), Val::Str(y)) = (&pa, &pb) {
            return if jsstr::compare(x.as_str(), y.as_str()) < 0 { 1 } else { 0 };
        }
        if matches!(pa, Val::Big(_)) || matches!(pb, Val::Big(_)) {
            return big_less(&pa, &pb);
        }
        let x = self.to_number(&pa);
        let y = self.to_number(&pb);
        if is_nan(x) || is_nan(y) {
            return -1;
        }
        if x < y {
            1
        } else {
            0
        }
    }

    pub fn compare(&mut self, code: int, a: &Val, b: &Val) -> bool {
        if let (Val::Num(x), Val::Num(y)) = (a, b) {
            return match code {
                OP_LT => x < y,
                OP_GT => x > y,
                OP_LE => x <= y,
                OP_GE => x >= y,
                OP_SEQ | OP_EQ => x == y,
                _ => x != y,
            };
        }
        match code {
            OP_LT => self.less_than(a, b) == 1,
            OP_GT => self.less_than(b, a) == 1,
            OP_LE => self.less_than(b, a) == 0,
            OP_GE => self.less_than(a, b) == 0,
            OP_SEQ => self.strict_equals(a, b),
            OP_SNE => !self.strict_equals(a, b),
            OP_EQ => self.loose_equals(a, b),
            _ => !self.loose_equals(a, b),
        }
    }

    pub fn arith(&mut self, code: int, a0: &Val, b0: &Val) -> Val {
        let mut a = a0.clone();
        let mut b = b0.clone();
        if matches!(a, Val::Big(_)) || matches!(b, Val::Big(_)) || is_obj(&a) || is_obj(&b) {
            if is_obj(&a) {
                a = self.to_primitive(&a, "number");
                if self.throwing {
                    return Val::Undef;
                }
            }
            if is_obj(&b) {
                b = self.to_primitive(&b, "number");
                if self.throwing {
                    return Val::Undef;
                }
            }
            if matches!(a, Val::Big(_)) || matches!(b, Val::Big(_)) {
                return self.big_arith(code, &a, &b);
            }
        }
        self.arith_plain(code, &a, &b)
    }

    fn big_arith(&mut self, code: int, a: &Val, b: &Val) -> Val {
        let (x, y) = match (a, b) {
            (Val::Big(x), Val::Big(y)) => (x.clone(), y.clone()),
            _ => {
                self.throw_type("Cannot mix BigInt and other types, use explicit conversions");
                return Val::Undef;
            }
        };
        let r = match code {
            OP_SUB => crate::bigint::sub(&x, &y),
            OP_MUL => crate::bigint::mul(&x, &y),
            OP_DIV | OP_MOD => {
                if crate::bigint::is_zero(&y) {
                    self.throw_range("Division by zero");
                    return Val::Undef;
                }
                let (q, r) = crate::bigint::divmod(&x, &y);
                if code == OP_DIV { q } else { r }
            }
            OP_EXP => {
                if y.neg {
                    self.throw_range("Exponent must be non-negative");
                    return Val::Undef;
                }
                let e = crate::bigint::to_double(&y);
                if e > 100000.0 {
                    self.throw_range("Maximum BigInt size exceeded");
                    return Val::Undef;
                }
                crate::bigint::pow(&x, e as int)
            }
            OP_BAND => crate::bigint::bitwise(&x, &y, 0),
            OP_BOR => crate::bigint::bitwise(&x, &y, 1),
            OP_BXOR => crate::bigint::bitwise(&x, &y, 2),
            OP_SHL | OP_SHR => {
                let n = crate::bigint::to_double(&y);
                if n > 1000000.0 {
                    self.throw_range("Maximum BigInt size exceeded");
                    return Val::Undef;
                }
                let k = if code == OP_SHL { n as int } else { -(n as int) };
                crate::bigint::shift_left(&x, k)
            }
            _ => {
                self.throw_type("BigInts have no unsigned right shift, use >> instead");
                return Val::Undef;
            }
        };
        Val::Big(Rc::new(r))
    }

    fn arith_plain(&mut self, code: int, a: &Val, b: &Val) -> Val {
        let x = match a {
            Val::Num(n) => *n,
            _ => self.to_number(a),
        };
        if self.throwing {
            return Val::Undef;
        }
        let y = match b {
            Val::Num(n) => *n,
            _ => self.to_number(b),
        };
        if self.throwing {
            return Val::Undef;
        }
        Val::Num(arith_num(code, x, y))
    }

    // ---- calls

    /// Calls `f` from native code (or anywhere outside the interpreter
    /// loop) and answers its result; an exception is left in `throwing`.
    pub fn call_value(&mut self, f: Val, this: Val, args: Vec<Val>) -> Val {
        let fo = obj_of(&f);
        if fo < 0 || !self.is_callable(&f) {
            self.throw_type("value is not a function");
            return Val::Undef;
        }
        let class = self.objs[fo as usize].class;
        if class == C_NATIVE {
            let id = self.objs[fo as usize].func;
            return self.call_native(id, fo, this, args, false, Val::Undef);
        }
        if class == C_PROXY {
            return self.proxy_call(fo, this, args);
        }
        if class == C_BOUND {
            let target = self.objs[fo as usize].env;
            let bthis = self.objs[fo as usize].prim.clone();
            let mut all = self.objs[fo as usize].elems.clone();
            for a in args {
                all.push(a);
            }
            return self.call_value(Val::Obj(target), bthis, all);
        }
        let base = self.frames.len() as int;
        let argc = args.len() as int;
        self.stack.push(f);
        self.stack.push(this);
        for a in args {
            self.stack.push(a);
        }
        if !self.enter_function(fo, argc, false, Val::Undef) {
            return Val::Undef;
        }
        self.native_depth += 1;
        self.run(base);
        self.native_depth -= 1;
        if self.throwing {
            return Val::Undef;
        }
        self.stack.pop().unwrap()
    }

    /// Runs a script's entry function. Unlike `call_value` from a native,
    /// the script's own frames are safe points for the collector.
    pub fn run_program(&mut self, f: Val, this: Val) -> Val {
        self.native_depth -= 1;
        let r = self.call_value(f, this, Vec::new());
        self.native_depth += 1;
        r
    }

    /// `new f(...args)` from native code.
    pub fn construct(&mut self, f: Val, args: Vec<Val>, new_target: Val) -> Val {
        let fo = obj_of(&f);
        if fo < 0 || !self.is_callable(&f) {
            self.throw_type("value is not a constructor");
            return Val::Undef;
        }
        let class = self.objs[fo as usize].class;
        if class == C_NATIVE {
            let id = self.objs[fo as usize].func;
            let this = Val::Undef;
            return self.call_native(id, fo, this, args, true, new_target);
        }
        if class == C_PROXY {
            return self.proxy_construct(fo, args, new_target);
        }
        if class == C_BOUND {
            let target = self.objs[fo as usize].env;
            let mut all = self.objs[fo as usize].elems.clone();
            for a in args {
                all.push(a);
            }
            let nt = if self.strict_equals(&new_target, &f) { Val::Obj(target) } else { new_target };
            return self.construct(Val::Obj(target), all, nt);
        }
        let pi = self.objs[fo as usize].func;
        if self.protos[pi as usize].arrow || (self.protos[pi as usize].method && !self.protos[pi as usize].class_ctor) || self.protos[pi as usize].generator || self.protos[pi as usize].is_async {
            self.throw_type("value is not a constructor");
            return Val::Undef;
        }
        let this = self.make_this(&new_target);
        let base = self.frames.len() as int;
        let argc = args.len() as int;
        self.stack.push(f);
        self.stack.push(this.clone());
        for a in args {
            self.stack.push(a);
        }
        if !self.enter_function(fo, argc, true, new_target) {
            return Val::Undef;
        }
        self.native_depth += 1;
        self.run(base);
        self.native_depth -= 1;
        if self.throwing {
            return Val::Undef;
        }
        self.stack.pop().unwrap()
    }

    /// A new object whose prototype is `new_target.prototype`.
    pub fn make_this(&mut self, new_target: &Val) -> Val {
        let nt = obj_of(new_target);
        let mut proto = self.object_proto;
        if nt >= 0 {
            let p = self.get_obj(nt, A_PROTOTYPE, new_target);
            if let Val::Obj(po) = p {
                proto = po;
            }
        }
        let o = self.alloc(C_OBJECT, proto);
        Val::Obj(o)
    }

    /// Sets up a frame for the JS function `fo`; the stack holds
    /// [f, this, args…]. For a constructor call `this` is the new object.
    pub fn enter_function(&mut self, fo: int, argc: int, construct: bool, new_target: Val) -> bool {
        let pi = self.objs[fo as usize].func;
        let bp = (self.stack.len() as int) - argc;
        let (nparams, nslots, env_size, rest, uses_args, arrow, strict, class_ctor, derived) = {
            let p = &self.protos[pi as usize];
            (p.nparams, p.nslots, p.env_size, p.rest, p.uses_args, p.arrow, p.strict, p.class_ctor, p.derived)
        };
        if class_ctor && !construct {
            self.stack.truncate((bp - 2) as usize);
            self.throw_type("Class constructor cannot be invoked without 'new'");
            return false;
        }
        let mut args_obj: int = -1;
        if uses_args {
            let mut items: Vec<Val> = Vec::new();
            let mut i = 0;
            while i < argc {
                items.push(self.stack[(bp + i) as usize].clone());
                i += 1;
            }
            let p = self.object_proto;
            args_obj = self.alloc(C_ARGUMENTS, p);
            self.objs[args_obj as usize].elems = items;
            if strict && self.thrower_pair >= 0 {
                let tp = self.thrower_pair;
                self.objs[args_obj as usize].add(A_CALLEE, Val::Obj(tp), P_HIDDEN | P_FIXED | P_ACCESSOR);
            } else {
                self.objs[args_obj as usize].add(A_CALLEE, Val::Obj(fo), P_HIDDEN);
            }
        }
        if rest >= 0 {
            let mut items: Vec<Val> = Vec::new();
            let mut i = rest;
            while i < argc {
                items.push(self.stack[(bp + i) as usize].clone());
                i += 1;
            }
            let arr = self.new_array(items);
            self.stack.truncate((bp + rest) as usize);
            self.stack.push(Val::Obj(arr));
        } else if argc > nparams {
            self.stack.truncate((bp + nparams) as usize);
        }
        while (self.stack.len() as int) < bp + nslots {
            self.stack.push(Val::Undef);
        }
        let mut this_val = self.stack[(bp - 1) as usize].clone();
        let mut nt = new_target;
        if arrow {
            this_val = self.objs[fo as usize].prim.clone();
            nt = Val::Undef;
        } else if !strict && !construct {
            if matches!(this_val, Val::Undef) || matches!(this_val, Val::Null) {
                this_val = Val::Obj(self.global);
            } else if !is_obj(&this_val) {
                // a sloppy function sees a primitive `this` boxed
                let bo = self.to_object(&this_val);
                this_val = Val::Obj(bo);
            }
        }
        let mut env = self.objs[fo as usize].env;
        if env_size > 0 {
            let e = self.alloc(C_ENV, env);
            let mut slots: Vec<Val> = Vec::new();
            let mut i = 0;
            while i < env_size {
                slots.push(Val::Undef);
                i += 1;
            }
            self.objs[e as usize].elems = slots;
            env = e;
        }
        self.frames.push(Frame {
            proto: pi,
            fobj: fo,
            pc: 0,
            bp: bp,
            env: env,
            this_val: this_val.clone(),
            new_target: nt,
            args_obj: args_obj,
            construct: construct,
            gen: -1,
        });
        if construct && class_ctor && !derived {
            self.run_fields(fo, &this_val);
            if self.throwing {
                return false;
            }
        }
        true
    }

    /// The class's instance fields, defined on `this`.
    pub fn run_fields(&mut self, ctor: int, this: &Val) {
        if self.objs[ctor as usize].elems2.is_empty() {
            return;
        }
        let f = self.objs[ctor as usize].elems2[0].clone();
        self.call_value(f, this.clone(), Vec::new());
    }

    /// Unwinds to the innermost handler of this run; false when there is
    /// none and the exception leaves the run.
    fn unwind(&mut self, base: int) -> bool {
        loop {
            if self.handlers.is_empty() {
                break;
            }
            let h = self.handlers.len() - 1;
            let hf = self.handlers[h].frame;
            if hf < base {
                break;
            }
            let (catch_pc, sp, env) = (self.handlers[h].catch_pc, self.handlers[h].sp, self.handlers[h].env);
            self.handlers.pop();
            self.frames.truncate((hf + 1) as usize);
            self.stack.truncate(sp as usize);
            let fi = self.frames.len() - 1;
            self.frames[fi].pc = catch_pc;
            self.frames[fi].env = env;
            let e = self.exc.clone();
            self.stack.push(e);
            self.exc = Val::Undef;
            self.throwing = false;
            return true;
        }
        // no handler here: drop this run's frames
        if (self.frames.len() as int) > base {
            let bp = self.frames[base as usize].bp;
            self.frames.truncate(base as usize);
            self.stack.truncate((bp - 2) as usize);
        }
        false
    }

    fn closure(&mut self, pi: int) -> int {
        let fp = if self.protos[pi as usize].generator {
            self.gen_fn_proto
        } else if self.protos[pi as usize].is_async {
            self.async_fn_proto
        } else {
            self.function_proto
        };
        let f = self.alloc(C_FUNCTION, fp);
        let fi = self.frames.len() - 1;
        let env = self.frames[fi].env;
        self.objs[f as usize].func = pi;
        self.objs[f as usize].env = env;
        if self.protos[pi as usize].arrow {
            let t = self.frames[fi].this_val.clone();
            self.objs[f as usize].prim = t;
            let home = self.objs[self.frames[fi].fobj as usize].home;
            self.objs[f as usize].home = home;
        }
        f
    }

    fn iter_values(&mut self, v: &Val) -> Val {
        // arrays, strings, and anything with a Symbol.iterator method
        if let Val::Obj(o) = v {
            let class = self.objs[*o as usize].class;
            if class == C_ARRAY || class == C_ARGUMENTS {
                let f = self.get_obj(*o, A_ITERATOR, v);
                if obj_of(&f) == self.array_values_fn || class == C_ARGUMENTS {
                    let ip = self.iter_proto;
                    let it = self.alloc(C_ITER, ip);
                    self.objs[it as usize].env = *o;
                    self.objs[it as usize].func = 0;
                    return Val::Obj(it);
                }
            }
        }
        if let Val::Str(s) = v {
            let mut items: Vec<Val> = Vec::new();
            for c in s.chars() {
                let mut t = String::new();
                t.push(c);
                items.push(string_val(t));
            }
            let arr = self.new_array(items);
            let ip = self.iter_proto;
            let it = self.alloc(C_ITER, ip);
            self.objs[it as usize].env = arr;
            self.objs[it as usize].func = 0;
            return Val::Obj(it);
        }
        let f = self.get(v, A_ITERATOR);
        if self.throwing {
            return Val::Undef;
        }
        if !self.is_callable(&f) {
            self.throw_type("object is not iterable");
            return Val::Undef;
        }
        let it = self.call_value(f, v.clone(), Vec::new());
        if self.throwing {
            return Val::Undef;
        }
        if !is_obj(&it) {
            self.throw_type("Result of the Symbol.iterator method is not an object");
            return Val::Undef;
        }
        it
    }

    /// The next value of an iterator made by `iter_values` / ITER_KEYS;
    /// None when done.
    pub fn iter_next(&mut self, it: &Val) -> Option<Val> {
        let o = obj_of(it);
        if o >= 0 && self.objs[o as usize].class == C_ITER {
            let src = self.objs[o as usize].env;
            let i = self.objs[o as usize].func;
            let kind = self.objs[o as usize].pos;
            if src < 0 {
                return None;
            }
            let len = self.objs[src as usize].elems.len() as int;
            if i >= len {
                self.objs[o as usize].env = -1;
                return None;
            }
            self.objs[o as usize].func = i + 1;
            let v = self.objs[src as usize].elems[i as usize].clone();
            if kind == 1 {
                return Some(Val::Num(i as double));
            }
            if kind == 2 {
                let pair = self.new_array(vec![Val::Num(i as double), v]);
                return Some(Val::Obj(pair));
            }
            return Some(v);
        }
        let next = self.get(it, A_NEXT);
        if self.throwing {
            return None;
        }
        let r = self.call_value(next, it.clone(), Vec::new());
        if self.throwing {
            return None;
        }
        if !is_obj(&r) {
            self.throw_type("Iterator result is not an object");
            return None;
        }
        let done = self.get(&r, A_DONE);
        if truthy(&done) {
            return None;
        }
        Some(self.get(&r, A_VALUE))
    }

    pub fn iterable_to_vec(&mut self, v: &Val) -> Vec<Val> {
        if let Val::Obj(o) = v {
            if self.objs[*o as usize].class == C_ARRAY {
                let f = self.get_obj(*o, A_ITERATOR, v);
                if obj_of(&f) == self.array_values_fn {
                    return self.objs[*o as usize].elems.clone();
                }
            }
        }
        let it = self.iter_values(v);
        let mut out: Vec<Val> = Vec::new();
        if self.throwing {
            return out;
        }
        self.temp_roots.push(it.clone());
        loop {
            match self.iter_next(&it) {
                Some(x) => out.push(x),
                None => break,
            }
            if self.throwing {
                break;
            }
        }
        self.temp_roots.pop();
        out
    }

    fn get_env(&self, depth: int) -> int {
        let fi = self.frames.len() - 1;
        let mut e = self.frames[fi].env;
        let mut d = depth;
        while d > 0 {
            e = self.objs[e as usize].proto;
            d -= 1;
        }
        e
    }

    fn pop(&mut self) -> Val {
        self.stack.pop().unwrap()
    }

    fn top(&self) -> &Val {
        &self.stack[self.stack.len() - 1]
    }

    // ---- the interpreter

    /// Runs frames until the frame count falls back to `base`.
    pub fn run(&mut self, base: int) {
        'frames: loop {
            if self.throwing {
                if !self.unwind(base) {
                    return;
                }
            }
            if (self.frames.len() as int) <= base {
                return;
            }
            let fi = self.frames.len() - 1;
            let pi = self.frames[fi].proto as usize;
            let bp = self.frames[fi].bp;
            let mut pc = self.frames[fi].pc;
            loop {
                let op = self.protos[pi].code[pc as usize];
                pc += 1;
                match op.code {
                    OP_GET_LOCAL => {
                        let v = self.stack[(bp + op.a) as usize].clone();
                        self.stack.push(v);
                    }
                    OP_SET_LOCAL => {
                        let v = self.stack[self.stack.len() - 1].clone();
                        self.stack[(bp + op.a) as usize] = v;
                    }
                    OP_INT => self.stack.push(Val::Num(op.a as double)),
                    OP_CONST => {
                        let v = self.protos[pi].consts[op.a as usize].clone();
                        self.stack.push(v);
                    }
                    OP_POP => {
                        self.stack.pop();
                    }
                    OP_INC_LOCAL => {
                        let i = (bp + op.a) as usize;
                        if let Val::Big(bg) = self.stack[i].clone() {
                            let d = crate::bigint::from_int(op.b);
                            self.stack[i] = Val::Big(Rc::new(crate::bigint::add(&bg, &d)));
                            continue;
                        }
                        if let Val::Num(n) = self.stack[i] {
                            self.stack[i] = Val::Num(n + (op.b as double));
                        } else {
                            let v = self.stack[i].clone();
                            let n = self.to_number(&v);
                            self.stack[i] = Val::Num(n + (op.b as double));
                        }
                    }
                    OP_CMP_JF => {
                        let b = self.pop();
                        let a = self.pop();
                        let r = if let (Val::Num(x), Val::Num(y)) = (&a, &b) {
                            match op.b {
                                OP_LT => x < y,
                                OP_GT => x > y,
                                OP_LE => x <= y,
                                OP_GE => x >= y,
                                OP_SEQ | OP_EQ => x == y,
                                _ => x != y,
                            }
                        } else {
                            let strict = op.b == OP_SEQ || op.b == OP_SNE;
                            let q = if strict || op.b == OP_EQ || op.b == OP_NE { quick_eq(&a, &b, strict) } else { -1 };
                            if q >= 0 {
                                (q == 1) == (op.b == OP_SEQ || op.b == OP_EQ)
                            } else {
                                self.frames[fi].pc = pc;
                                self.compare(op.b, &a, &b)
                            }
                        };
                        if !r {
                            if op.a < pc {
                                self.frames[fi].pc = op.a;
                                if self.gc_due() {
                                    self.gc();
                                }
                            }
                            pc = op.a;
                        }
                    }
                    OP_JUMP => {
                        if op.a < pc && self.gc_due() {
                            self.frames[fi].pc = op.a;
                            self.gc();
                        }
                        pc = op.a;
                    }
                    OP_JF => {
                        let v = self.pop();
                        if !truthy(&v) {
                            pc = op.a;
                        }
                    }
                    OP_JT => {
                        let v = self.pop();
                        if truthy(&v) {
                            pc = op.a;
                        }
                    }
                    OP_ADD => {
                        let b = self.pop();
                        let a = self.pop();
                        if let (Val::Num(x), Val::Num(y)) = (&a, &b) {
                            self.stack.push(Val::Num(x + y));
                        } else {
                            self.frames[fi].pc = pc;
                            let r = self.add_vals(&a, &b);
                            self.stack.push(r);
                        }
                    }
                    OP_DIV | OP_MOD | OP_EXP | OP_BAND | OP_BOR | OP_BXOR | OP_SHL | OP_SHR | OP_USHR => {
                        let b = self.pop();
                        let a = self.pop();
                        if let (Val::Num(x), Val::Num(y)) = (&a, &b) {
                            self.stack.push(Val::Num(arith_num(op.code, *x, *y)));
                        } else {
                            self.frames[fi].pc = pc;
                            let r = self.arith(op.code, &a, &b);
                            self.stack.push(r);
                        }
                    }
                    OP_LT | OP_GT | OP_LE | OP_GE | OP_EQ | OP_NE | OP_SEQ | OP_SNE => {
                        let b = self.pop();
                        let a = self.pop();
                        let strict = op.code == OP_SEQ || op.code == OP_SNE;
                        let q = if strict || op.code == OP_EQ || op.code == OP_NE { quick_eq(&a, &b, strict) } else { -1 };
                        if q >= 0 {
                            self.stack.push(Val::Bool((q == 1) == (op.code == OP_SEQ || op.code == OP_EQ)));
                            continue;
                        }
                        self.frames[fi].pc = pc;
                        let r = self.compare(op.code, &a, &b);
                        self.stack.push(Val::Bool(r));
                    }
                    OP_THIS => {
                        let t = self.frames[fi].this_val.clone();
                        self.stack.push(t);
                    }
                    OP_SET_LOCAL_POP => {
                        let v = self.pop();
                        self.stack[(bp + op.a) as usize] = v;
                        pc += 1;
                    }
                    OP_POSTINC_LOCAL | OP_PREINC_LOCAL => {
                        let i = (bp + op.a) as usize;
                        if let Val::Big(bg) = self.stack[i].clone() {
                            let d = crate::bigint::from_int(op.b);
                            let nv = Val::Big(Rc::new(crate::bigint::add(&bg, &d)));
                            let old = Val::Big(bg);
                            self.stack[i] = nv.clone();
                            self.stack.push(if op.code == OP_PREINC_LOCAL { nv } else { old });
                            continue;
                        }
                        let old = if let Val::Num(n) = self.stack[i] {
                            n
                        } else {
                            self.frames[fi].pc = pc;
                            let v = self.stack[i].clone();
                            self.to_number(&v)
                        };
                        let nv = old + (op.b as double);
                        self.stack[i] = Val::Num(nv);
                        self.stack.push(Val::Num(if op.code == OP_PREINC_LOCAL { nv } else { old }));
                    }
                    OP_SUB => {
                        let b = self.pop();
                        let a = self.pop();
                        if let (Val::Num(x), Val::Num(y)) = (&a, &b) {
                            self.stack.push(Val::Num(x - y));
                        } else {
                            self.frames[fi].pc = pc;
                            let r = self.arith(op.code, &a, &b);
                            self.stack.push(r);
                        }
                    }
                    OP_MUL => {
                        let b = self.pop();
                        let a = self.pop();
                        if let (Val::Num(x), Val::Num(y)) = (&a, &b) {
                            self.stack.push(Val::Num(x * y));
                        } else {
                            self.frames[fi].pc = pc;
                            let r = self.arith(op.code, &a, &b);
                            self.stack.push(r);
                        }
                    }
                    OP_GET_THIS_PROP => {
                        let v = self.frames[fi].this_val.clone();
                        let atom = op.a;
                        let mut done = false;
                        if let Val::Obj(o) = &v {
                            let ob = &self.objs[*o as usize];
                            let c = op.c;
                            if c >= 0 && (c as usize) < ob.keys.len() && ob.keys[c as usize] == atom && ob.attrs[c as usize] & P_ACCESSOR == 0 {
                                let r = ob.vals[c as usize].clone();
                                self.stack.push(r);
                                done = true;
                            } else {
                                let slot = ob.find(atom);
                                if slot >= 0 && ob.attrs[slot as usize] & P_ACCESSOR == 0 {
                                    let r = ob.vals[slot as usize].clone();
                                    self.protos[pi].code[(pc - 1) as usize].c = slot;
                                    self.stack.push(r);
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            let r = self.get(&v, atom);
                            self.stack.push(r);
                        }
                    }
                    OP_GET_LOCAL_PROP => {
                        let v = self.stack[(bp + op.a) as usize].clone();
                        let atom = op.b;
                        let mut done = false;
                        if let Val::Obj(o) = &v {
                            let ob = &self.objs[*o as usize];
                            let c = op.c;
                            if c >= 0 && (c as usize) < ob.keys.len() && ob.keys[c as usize] == atom && ob.attrs[c as usize] & P_ACCESSOR == 0 {
                                let r = ob.vals[c as usize].clone();
                                self.stack.push(r);
                                done = true;
                            } else {
                                let slot = ob.find(atom);
                                if slot >= 0 && ob.attrs[slot as usize] & P_ACCESSOR == 0 {
                                    let r = ob.vals[slot as usize].clone();
                                    self.protos[pi].code[(pc - 1) as usize].c = slot;
                                    self.stack.push(r);
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            let r = self.get(&v, atom);
                            self.stack.push(r);
                        }
                    }
                    OP_GET_PROP => {
                        let v = self.pop();
                        let atom = op.a;
                        let mut done = false;
                        if let Val::Obj(o) = &v {
                            let ob = &self.objs[*o as usize];
                            let c = op.c;
                            if c >= 0 && (c as usize) < ob.keys.len() && ob.keys[c as usize] == atom && ob.attrs[c as usize] & P_ACCESSOR == 0 {
                                let r = ob.vals[c as usize].clone();
                                self.stack.push(r);
                                done = true;
                            } else {
                                let slot = ob.find(atom);
                                if slot >= 0 && ob.attrs[slot as usize] & P_ACCESSOR == 0 {
                                    let r = ob.vals[slot as usize].clone();
                                    self.protos[pi].code[(pc - 1) as usize].c = slot;
                                    self.stack.push(r);
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            let r = self.get(&v, atom);
                            self.stack.push(r);
                        }
                    }
                    OP_SET_PROP | OP_SET_PROP_POP => {
                        let val = self.pop();
                        let target = self.pop();
                        let atom = op.a;
                        let mut done = false;
                        if let Val::Obj(o) = &target {
                            let c = op.c;
                            let ob = &mut self.objs[*o as usize];
                            if c >= 0 && (c as usize) < ob.keys.len() && ob.keys[c as usize] == atom && ob.attrs[c as usize] == 0 {
                                ob.vals[c as usize] = val.clone();
                                done = true;
                            } else {
                                let slot = ob.find(atom);
                                if slot >= 0 && ob.attrs[slot as usize] == 0 {
                                    ob.vals[slot as usize] = val.clone();
                                    self.protos[pi].code[(pc - 1) as usize].c = slot;
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            self.set(&target, atom, val.clone());
                        }
                        if op.code == OP_SET_PROP_POP {
                            pc += 1;
                        } else {
                            self.stack.push(val);
                        }
                    }
                    OP_GET_ELEM => {
                        let k = self.pop();
                        let v = self.pop();
                        let mut done = false;
                        if let (Val::Obj(o), Val::Num(n)) = (&v, &k) {
                            let ob = &self.objs[*o as usize];
                            if ob.class == C_ARRAY && ob.saved.is_empty() {
                                let i = *n as int;
                                if i >= 0 && (i as usize) < ob.elems.len() && (i as double) == *n {
                                    let r = ob.elems[i as usize].clone();
                                    self.stack.push(r);
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            let r = self.get_elem(&v, &k);
                            self.stack.push(r);
                        }
                    }
                    OP_SET_ELEM | OP_SET_ELEM_POP => {
                        let val = self.pop();
                        let k = self.pop();
                        let target = self.pop();
                        let mut done = false;
                        if let (Val::Obj(o), Val::Num(n)) = (&target, &k) {
                            let ob = &mut self.objs[*o as usize];
                            if ob.class == C_ARRAY && ob.saved.is_empty() {
                                let i = *n as int;
                                if i >= 0 && (i as usize) < ob.elems.len() && (i as double) == *n && ob.pos != 2 {
                                    ob.elems[i as usize] = val.clone();
                                    done = true;
                                } else if i >= 0 && (i as usize) == ob.elems.len() && (i as double) == *n && ob.extensible {
                                    ob.elems.push(val.clone());
                                    done = true;
                                }
                            }
                        }
                        if !done {
                            self.frames[fi].pc = pc;
                            self.set_elem(&target, &k, val.clone());
                        }
                        if op.code == OP_SET_ELEM_POP {
                            pc += 1;
                        } else {
                            self.stack.push(val);
                        }
                    }
                    OP_GET_METHOD => {
                        let v = self.pop();
                        self.frames[fi].pc = pc;
                        let atom = op.a;
                        let mut f = Val::Undef;
                        let mut done = false;
                        if let Val::Obj(o) = &v {
                            // own slot, else the prototype's slot, cached
                            let ob = &self.objs[*o as usize];
                            let slot = ob.find(atom);
                            if slot >= 0 && ob.attrs[slot as usize] & P_ACCESSOR == 0 {
                                f = ob.vals[slot as usize].clone();
                                done = true;
                            } else if slot < 0 && ob.class == C_OBJECT {
                                let p = ob.proto;
                                if p >= 0 {
                                    let pob = &self.objs[p as usize];
                                    let c = op.c;
                                    if c >= 0 && (c as usize) < pob.keys.len() && pob.keys[c as usize] == atom && pob.attrs[c as usize] & P_ACCESSOR == 0 {
                                        f = pob.vals[c as usize].clone();
                                        done = true;
                                    } else {
                                        let ps = pob.find(atom);
                                        if ps >= 0 && pob.attrs[ps as usize] & P_ACCESSOR == 0 {
                                            f = pob.vals[ps as usize].clone();
                                            self.protos[pi].code[(pc - 1) as usize].c = ps;
                                            done = true;
                                        }
                                    }
                                }
                            }
                        }
                        if !done {
                            f = self.get(&v, atom);
                        }
                        if !self.throwing && op.b == 0 && !self.is_callable(&f) {
                            // thrown by the call, after the arguments
                            self.bad_callee = self.atom_str(atom);
                            self.bad_callee_at = self.stack.len() as int;
                        }
                        self.stack.push(f);
                        self.stack.push(v);
                    }
                    OP_GET_METHOD_ELEM => {
                        let k = self.pop();
                        let v = self.pop();
                        self.frames[fi].pc = pc;
                        let f = self.get_elem(&v, &k);
                        self.stack.push(f);
                        self.stack.push(v);
                    }
                    OP_CALL => {
                        self.frames[fi].pc = pc;
                        let argc = op.a;
                        if self.gc_due() {
                            self.gc();
                        }
                        if self.call_op(argc) {
                            continue 'frames;
                        }
                    }
                    OP_RETURN | OP_RETURN_UNDEF => {
                        let mut v = if op.code == OP_RETURN { self.pop() } else { Val::Undef };
                        let fr = self.frames.pop().unwrap();
                        if fr.construct && !is_obj(&v) {
                            if !matches!(v, Val::Undef) && self.protos[fr.proto as usize].derived {
                                self.frames.push(fr);
                                self.throw_type("Derived constructors may only return object or undefined");
                                if !self.unwind(base) {
                                    return;
                                }
                                continue 'frames;
                            }
                            v = fr.this_val.clone();
                        }
                        // pop handlers the frame left (a return inside try)
                        let depth = self.frames.len() as int;
                        while !self.handlers.is_empty() && self.handlers[self.handlers.len() - 1].frame >= depth {
                            self.handlers.pop();
                        }
                        self.stack.truncate((fr.bp - 2) as usize);
                        self.stack.push(v);
                        continue 'frames;
                    }
                    _ => {
                        self.frames[fi].pc = pc;
                        let changed = self.step(op, pi, bp, fi, &mut pc);
                        if self.throwing {
                            if !self.unwind(base) {
                                return;
                            }
                            continue 'frames;
                        }
                        if changed {
                            continue 'frames;
                        }
                    }
                }
                if self.throwing {
                    self.frames[fi].pc = pc;
                    if !self.unwind(base) {
                        return;
                    }
                    continue 'frames;
                }
            }
        }
    }

    /// Saves frame `fi` (the top one) with its stack and handlers into the
    /// generator object `g`, and takes it off the stack.
    pub fn gen_save(&mut self, g: int, fi: usize) {
        let bp = self.frames[fi].bp;
        let start = (bp - 2) as usize;
        let mut seg: Vec<Val> = Vec::new();
        let mut i = start;
        while i < self.stack.len() {
            seg.push(self.stack[i].clone());
            i += 1;
        }
        self.stack.truncate(start);
        let fr = self.frames.pop().unwrap();
        let mut hs: Vec<Handler> = Vec::new();
        while !self.handlers.is_empty() && self.handlers[self.handlers.len() - 1].frame >= fi as int {
            hs.push(self.handlers.pop().unwrap());
        }
        let mut saved: Vec<int> = vec![fr.pc];
        let mut e2: Vec<Val> = vec![fr.new_target.clone(), if fr.args_obj >= 0 { Val::Obj(fr.args_obj) } else { Val::Undef }];
        let mut k = hs.len();
        while k > 0 {
            k -= 1;
            saved.push(hs[k].catch_pc);
            saved.push(hs[k].sp - bp);
            e2.push(if hs[k].env >= 0 { Val::Obj(hs[k].env) } else { Val::Undef });
        }
        let ob = &mut self.objs[g as usize];
        ob.elems = seg;
        ob.elems2 = e2;
        ob.saved = saved;
        ob.func = fr.proto;
        ob.env = fr.env;
        ob.home = fr.fobj;
        ob.prim = fr.this_val;
    }

    /// next(v) (mode 0), throw(v) (1), return(v) (2) of the generator `g`.
    pub fn gen_resume(&mut self, g: int, mode: int, v: Val) -> Val {
        let st = self.objs[g as usize].pos;
        if st == GS_RUNNING {
            self.throw_type("Generator is already running");
            return Val::Undef;
        }
        if st == GS_DONE || (st == GS_START && mode != 0) || (st == GS_YIELD && mode == 2) {
            self.objs[g as usize].pos = GS_DONE;
            self.objs[g as usize].elems = Vec::new();
            if mode == 1 {
                self.throwing = true;
                self.exc = v;
                return Val::Undef;
            }
            let rv = if mode == 2 { v } else { Val::Undef };
            return self.iter_result(rv, true);
        }
        let base = self.frames.len() as int;
        let seg = self.objs[g as usize].elems.clone();
        let start = self.stack.len() as int;
        for x in seg {
            self.stack.push(x);
        }
        let bp = start + 2;
        let saved = self.objs[g as usize].saved.clone();
        let e2 = self.objs[g as usize].elems2.clone();
        let ao = obj_of(&e2[1]);
        self.frames.push(Frame {
            proto: self.objs[g as usize].func,
            fobj: self.objs[g as usize].home,
            pc: saved[0],
            bp: bp,
            env: self.objs[g as usize].env,
            this_val: self.objs[g as usize].prim.clone(),
            new_target: e2[0].clone(),
            args_obj: ao,
            construct: false,
            gen: g,
        });
        let fi = (self.frames.len() - 1) as int;
        let mut k: usize = 1;
        let mut hi: usize = 2;
        while k + 1 < saved.len() {
            let env = obj_of(&e2[hi]);
            self.handlers.push(Handler { frame: fi, catch_pc: saved[k], sp: bp + saved[k + 1], env: env });
            k += 2;
            hi += 1;
        }
        self.objs[g as usize].elems = Vec::new();
        self.objs[g as usize].pos = GS_RUNNING;
        if st == GS_YIELD {
            if mode == 1 {
                self.throwing = true;
                self.exc = v;
            } else {
                self.stack.push(v);
            }
        }
        self.gen_yielded = false;
        self.native_depth += 1;
        self.run(base);
        self.native_depth -= 1;
        if self.throwing {
            self.objs[g as usize].pos = GS_DONE;
            return Val::Undef;
        }
        let r = self.stack.pop().unwrap();
        if self.gen_yielded {
            self.gen_yielded = false;
            self.objs[g as usize].pos = GS_YIELD;
            return self.iter_result(r, false);
        }
        self.objs[g as usize].pos = GS_DONE;
        self.iter_result(r, true)
    }

    pub fn iter_result(&mut self, v: Val, done: bool) -> Val {
        let r = self.new_object();
        self.objs[r as usize].add(A_VALUE, v, 0);
        self.objs[r as usize].add(A_DONE, Val::Bool(done), 0);
        Val::Obj(r)
    }

    /// An array's element `i` is a hole: no element there. Arrays that have
    /// holes keep one flag per element in `saved` (1: a hole); one whose
    /// `saved` is not as long as its elements has none.
    pub fn is_hole(&self, o: int, i: int) -> bool {
        let ob = &self.objs[o as usize];
        (ob.class == C_ARRAY || ob.class == C_ARGUMENTS) && !ob.saved.is_empty() && ob.saved.len() == ob.elems.len() && i >= 0 && (i as usize) < ob.saved.len() && ob.saved[i as usize] == 1
    }

    pub fn has_holes(&self, o: int) -> bool {
        let ob = &self.objs[o as usize];
        ob.class == C_ARRAY && !ob.saved.is_empty() && ob.saved.len() == ob.elems.len()
    }

    /// Marks element `i` a hole or not (it must exist).
    pub fn set_hole(&mut self, o: int, i: int, hole: bool) {
        let n = self.objs[o as usize].elems.len();
        if self.objs[o as usize].saved.len() != n {
            if !hole {
                return;
            }
            let mut flags: Vec<int> = Vec::new();
            let mut k: usize = 0;
            while k < n {
                flags.push(0);
                k += 1;
            }
            self.objs[o as usize].saved = flags;
        }
        if i >= 0 && (i as usize) < n {
            self.objs[o as usize].saved[i as usize] = if hole { 1 } else { 0 };
        }
    }

    /// Appends `count` holes to array `o`.
    pub fn push_holes(&mut self, o: int, count: int) {
        let n = self.objs[o as usize].elems.len();
        if count <= 0 {
            return;
        }
        if self.objs[o as usize].saved.len() != n {
            let mut flags: Vec<int> = Vec::new();
            let mut k: usize = 0;
            while k < n {
                flags.push(0);
                k += 1;
            }
            self.objs[o as usize].saved = flags;
        }
        let mut i: int = 0;
        while i < count {
            self.objs[o as usize].elems.push(Val::Undef);
            self.objs[o as usize].saved.push(1);
            i += 1;
        }
    }

    pub fn gc_due(&self) -> bool {
        self.alloc_count >= self.gc_threshold && self.native_depth == 0
    }

    /// The calling part of OP_CALL; true when a frame was pushed or the
    /// stack changed frames.
    fn call_op(&mut self, argc_in: int) -> bool {
        let mut argc = argc_in;
        loop {
            let fpos = (self.stack.len() as int) - argc - 2;
            let f = self.stack[fpos as usize].clone();
            let fo = obj_of(&f);
            if fo < 0 {
                self.throw_not_callable(fpos);
                return false;
            }
            let class = self.objs[fo as usize].class;
            if class == C_FUNCTION {
                return self.enter_function(fo, argc, false, Val::Undef) || true;
            }
            if class == C_NATIVE {
                let id = self.objs[fo as usize].func;
                // f.call(this, …) and f.apply(this, args) run in this loop
                if id == crate::builtins::NF_CALL {
                    // [call, f, this, a…] → [f, this, a…]
                    self.stack.remove(fpos as usize);
                    if argc == 0 {
                        self.stack.push(Val::Undef);
                        argc = 1;
                    }
                    argc -= 1;
                    continue;
                }
                if id == crate::builtins::NF_APPLY {
                    // [apply, f, this, arr] → [f, this, a…]
                    let arr = if argc >= 2 { self.stack[(fpos + 3) as usize].clone() } else { Val::Undef };
                    let this = if argc >= 1 { self.stack[(fpos + 2) as usize].clone() } else { Val::Undef };
                    let items = self.array_like_to_vec(&arr);
                    if self.throwing {
                        return false;
                    }
                    self.stack.truncate((fpos + 2) as usize);
                    self.stack.remove(fpos as usize);
                    self.stack.push(this);
                    argc = items.len() as int;
                    for x in items {
                        self.stack.push(x);
                    }
                    continue;
                }
                let bp = fpos + 2;
                let mut args: Vec<Val> = Vec::with_capacity(argc as usize);
                let mut i = 0;
                while i < argc {
                    args.push(self.stack[(bp + i) as usize].clone());
                    i += 1;
                }
                let this = self.stack[(fpos + 1) as usize].clone();
                self.stack.truncate(fpos as usize);
                self.native_depth += 1;
                let r = self.call_native(id, fo, this, args, false, Val::Undef);
                self.native_depth -= 1;
                self.stack.push(r);
                return false;
            }
            if class == C_PROXY {
                let bp = fpos + 2;
                let mut args: Vec<Val> = Vec::new();
                let mut i = 0;
                while i < argc {
                    args.push(self.stack[(bp + i) as usize].clone());
                    i += 1;
                }
                let this = self.stack[(fpos + 1) as usize].clone();
                self.stack.truncate(fpos as usize);
                self.native_depth += 1;
                let r = self.proxy_call(fo, this, args);
                self.native_depth -= 1;
                self.stack.push(r);
                return false;
            }
            if class == C_BOUND {
                let target = self.objs[fo as usize].env;
                let bthis = self.objs[fo as usize].prim.clone();
                let bargs = self.objs[fo as usize].elems.clone();
                self.stack[fpos as usize] = Val::Obj(target);
                self.stack[(fpos + 1) as usize] = bthis;
                let mut k: usize = 0;
                for a in bargs {
                    self.stack.insert((fpos + 2) as usize + k, a);
                    k += 1;
                }
                argc += k as int;
                continue;
            }
            self.throw_not_callable(fpos);
            return false;
        }
    }

    /// "x is not a function", named by the OP_GET_METHOD that fetched it.
    fn throw_not_callable(&mut self, fpos: int) {
        if fpos == self.bad_callee_at && !self.bad_callee.is_empty() {
            let m = format!("{} is not a function", self.bad_callee);
            self.bad_callee_at = -1;
            self.throw_type(m.as_str());
            return;
        }
        self.throw_type("value is not a function");
    }

    pub fn array_like_to_vec(&mut self, v: &Val) -> Vec<Val> {
        let mut out: Vec<Val> = Vec::new();
        match v {
            Val::Undef | Val::Null => return out,
            Val::Obj(o) => {
                let class = self.objs[*o as usize].class;
                if class == C_ARRAY || class == C_ARGUMENTS {
                    return self.objs[*o as usize].elems.clone();
                }
                let l = self.get(v, A_LENGTH);
                let n = to_integer(self.to_number(&l)) as int;
                let mut i = 0;
                while i < n {
                    let x = self.get_index(v, i);
                    out.push(x);
                    i += 1;
                }
                out
            }
            _ => {
                self.throw_type("CreateListFromArrayLike called on non-object");
                out
            }
        }
    }

    /// `new` in the loop: [f, args…]
    fn new_op(&mut self, argc: int) -> bool {
        let fpos = (self.stack.len() as int) - argc - 1;
        let f = self.stack[fpos as usize].clone();
        let fo = obj_of(&f);
        if fo < 0 || !self.is_callable(&f) {
            self.throw_type("value is not a constructor");
            return false;
        }
        let class = self.objs[fo as usize].class;
        if class == C_FUNCTION {
            let pi = self.objs[fo as usize].func;
            if self.protos[pi as usize].arrow || (self.protos[pi as usize].method && !self.protos[pi as usize].class_ctor) || self.protos[pi as usize].getter_setter || self.protos[pi as usize].generator || self.protos[pi as usize].is_async {
                self.throw_type("value is not a constructor");
                return false;
            }
            let this = self.make_this(&f);
            self.stack.insert((fpos + 1) as usize, this);
            self.enter_function(fo, argc, true, f.clone());
            return true;
        }
        let mut args: Vec<Val> = Vec::new();
        let mut i = 0;
        while i < argc {
            args.push(self.stack[(fpos + 1 + i) as usize].clone());
            i += 1;
        }
        self.stack.truncate(fpos as usize);
        self.native_depth += 1;
        let r = self.construct(f.clone(), args, f.clone());
        self.native_depth -= 1;
        self.stack.push(r);
        false
    }

    /// The rarer operations; true when the current frame changed.
    fn step(&mut self, op: Op, pi: usize, bp: int, fi: usize, pc: &mut int) -> bool {
        match op.code {
            OP_UNDEF => self.stack.push(Val::Undef),
            OP_NULL => self.stack.push(Val::Null),
            OP_TRUE => self.stack.push(Val::Bool(true)),
            OP_FALSE => self.stack.push(Val::Bool(false)),
            OP_DUP => {
                let v = self.top().clone();
                self.stack.push(v);
            }
            OP_DUP2 => {
                let n = self.stack.len();
                let a = self.stack[n - 2].clone();
                let b = self.stack[n - 1].clone();
                self.stack.push(a);
                self.stack.push(b);
            }
            OP_SWAP => {
                let n = self.stack.len();
                self.stack.swap(n - 1, n - 2);
            }
            OP_OVER => {
                let n = self.stack.len();
                let v = self.stack[n - 2].clone();
                self.stack.push(v);
            }
            OP_ROT3 => {
                let z = self.pop();
                let n = self.stack.len();
                self.stack.insert(n - 2, z);
            }
            OP_ROT4 => {
                let z = self.pop();
                let n = self.stack.len();
                self.stack.insert(n - 3, z);
            }
            OP_GET_ENV => {
                let e = self.get_env(op.a);
                let v = self.objs[e as usize].elems[op.b as usize].clone();
                self.stack.push(v);
            }
            OP_SET_ENV => {
                let e = self.get_env(op.a);
                let v = self.top().clone();
                self.objs[e as usize].elems[op.b as usize] = v;
            }
            OP_GET_GLOBAL => {
                let g = self.global;
                let c = op.c;
                let ob = &self.objs[g as usize];
                if c >= 0 && (c as usize) < ob.keys.len() && ob.keys[c as usize] == op.a && ob.attrs[c as usize] & P_ACCESSOR == 0 {
                    let v = ob.vals[c as usize].clone();
                    self.stack.push(v);
                } else {
                    let slot = ob.find(op.a);
                    if slot >= 0 && ob.attrs[slot as usize] & P_ACCESSOR == 0 {
                        let v = ob.vals[slot as usize].clone();
                        self.protos[pi].code[(*pc - 1) as usize].c = slot;
                        self.stack.push(v);
                    } else if self.has_atom(g, op.a) {
                        let v = self.get_obj(g, op.a, &Val::Obj(g));
                        self.stack.push(v);
                    } else {
                        let n = self.atom_str(op.a);
                        self.throw_ref(format!("{} is not defined", n).as_str());
                    }
                }
            }
            OP_SET_GLOBAL => {
                let g = self.global;
                let v = self.top().clone();
                let slot = self.objs[g as usize].find(op.a);
                if slot >= 0 && self.objs[g as usize].attrs[slot as usize] == 0 {
                    self.objs[g as usize].vals[slot as usize] = v;
                } else if slot < 0 && self.strict_now() && !self.has_atom(g, op.a) {
                    // strict code does not create globals by assignment
                    let n = self.atom_str(op.a);
                    self.throw_ref(format!("{} is not defined", n).as_str());
                } else {
                    self.set_obj(g, op.a, v);
                }
            }
            OP_DECL_GLOBAL => {
                let g = self.global;
                if self.objs[g as usize].find(op.a) < 0 {
                    self.objs[g as usize].add(op.a, Val::Undef, P_FIXED);
                }
            }
            OP_TYPEOF_GLOBAL => {
                let g = self.global;
                if self.has_atom(g, op.a) {
                    let v = self.get_obj(g, op.a, &Val::Obj(g));
                    let t = self.type_of(&v);
                    self.stack.push(string_val(t));
                } else {
                    self.stack.push(str_val("undefined"));
                }
            }
            OP_DEL_PROP => {
                let v = self.pop();
                match v {
                    Val::Obj(o) => {
                        let k = self.key_val(op.a);
                        let r = self.delete(o, &k);
                        self.stack.push(Val::Bool(r));
                    }
                    Val::Undef | Val::Null => self.throw_type("Cannot convert undefined or null to object"),
                    _ => self.stack.push(Val::Bool(true)),
                }
            }
            OP_DEL_ELEM => {
                let k = self.pop();
                let v = self.pop();
                match v {
                    Val::Obj(o) => {
                        let r = self.delete(o, &k);
                        self.stack.push(Val::Bool(r));
                    }
                    Val::Undef | Val::Null => self.throw_type("Cannot convert undefined or null to object"),
                    _ => self.stack.push(Val::Bool(true)),
                }
            }
            OP_INSTANCEOF => {
                let b = self.pop();
                let a = self.pop();
                let r = self.instance_of(&a, &b);
                self.stack.push(Val::Bool(r));
            }
            OP_GEN_START => {
                // the call answers a generator object holding this frame
                let fobj = self.frames[fi].fobj;
                let is_async = self.protos[pi].is_async;
                let gproto = if is_async {
                    self.generator_proto
                } else {
                    let pv = self.get_obj(fobj, A_PROTOTYPE, &Val::Obj(fobj));
                    match pv {
                        Val::Obj(p) => p,
                        _ => self.generator_proto,
                    }
                };
                let g = self.alloc(C_GENERATOR, gproto);
                self.gen_save(g, fi);
                self.objs[g as usize].pos = GS_START;
                if is_async {
                    let d = self.async_driver.clone();
                    let r = self.call_value(d, Val::Undef, vec![Val::Obj(g)]);
                    self.stack.push(r);
                } else {
                    self.stack.push(Val::Obj(g));
                }
                return true;
            }
            OP_YIELD | OP_AWAIT => {
                let v = self.pop();
                let g = self.frames[fi].gen;
                if g < 0 {
                    self.throw_syntax("yield outside a generator");
                    return false;
                }
                self.gen_save(g, fi);
                self.stack.push(v);
                self.gen_yielded = true;
                return true;
            }
            OP_EVAL_CALL => {
                let argc = op.a;
                let fpos = self.stack.len() - (argc as usize) - 2;
                let f = self.stack[fpos].clone();
                let is_eval = match &f {
                    Val::Obj(o) => self.objs[*o as usize].class == C_NATIVE && self.objs[*o as usize].func == crate::builtins::NF_EVAL,
                    _ => false,
                };
                if !is_eval {
                    return self.call_op(argc);
                }
                let a0 = if argc > 0 { self.stack[fpos + 2].clone() } else { Val::Undef };
                self.stack.truncate(fpos);
                if let Val::Str(s) = &a0 {
                    let src = s.as_ref().clone();
                    let env = self.frames[fi].env;
                    let t = self.frames[fi].this_val.clone();
                    let r = self.eval_direct(src.as_str(), pi as int, op.b, env, t);
                    self.stack.push(r);
                } else {
                    self.stack.push(a0);
                }
            }
            OP_TO_OBJECT => {
                let v = self.pop();
                if matches!(v, Val::Undef) || matches!(v, Val::Null) {
                    self.throw_type("Cannot convert undefined or null to object");
                    return false;
                }
                let o = self.to_object(&v);
                self.stack.push(Val::Obj(o));
            }
            OP_GET_ARG | OP_SET_ARG => {
                // a mapped parameter: the arguments object's element while it
                // is there, and the slot
                let i = op.a;
                let ao = self.frames[fi].args_obj;
                let mapped = ao >= 0 && (i as usize) < self.objs[ao as usize].elems.len() && !self.is_hole(ao, i);
                if op.code == OP_GET_ARG {
                    let v = if mapped { self.objs[ao as usize].elems[i as usize].clone() } else { self.stack[(bp + i) as usize].clone() };
                    self.stack.push(v);
                } else {
                    let v = self.top().clone();
                    if mapped {
                        self.objs[ao as usize].elems[i as usize] = v.clone();
                    }
                    self.stack[(bp + i) as usize] = v;
                }
            }
            OP_GET_PRIVATE => {
                let v = self.pop();
                let has = match &v {
                    Val::Obj(o) => {
                        let k = self.key_val(op.a);
                        self.has_property(*o, &k)
                    }
                    _ => false,
                };
                if !has {
                    let n = self.atom_str(op.a);
                    let shown = if n.starts_with('\u{1}') { jsstr::slice(n.as_str(), 1, jsstr::len(n.as_str())) } else { n.clone() };
                    self.throw_type(format!("Cannot read private member {} from an object whose class did not declare it", shown).as_str());
                } else {
                    let r = self.get(&v, op.a);
                    self.stack.push(r);
                }
            }
            OP_IN => {
                let b = self.pop();
                let a = self.pop();
                match b {
                    Val::Obj(o) => {
                        let r = self.has_property(o, &a);
                        self.stack.push(Val::Bool(r));
                    }
                    _ => self.throw_type("Cannot use 'in' operator to search for a key in a primitive"),
                }
            }
            OP_NEG => {
                let v = self.pop();
                if let Val::Big(b) = &v {
                    self.stack.push(Val::Big(Rc::new(crate::bigint::neg(b))));
                    return false;
                }
                let n = self.to_number(&v);
                self.stack.push(Val::Num(-n));
            }
            OP_TONUM => {
                let v = self.pop();
                if let Val::Num(_) = v {
                    self.stack.push(v);
                } else if matches!(v, Val::Big(_)) && op.b == 0 {
                    // ToNumeric (x++ on a BigInt); unary + (b 1) refuses it
                    self.stack.push(v);
                } else {
                    let n = self.to_number(&v);
                    self.stack.push(Val::Num(n));
                }
            }
            OP_NOT => {
                let v = self.pop();
                self.stack.push(Val::Bool(!truthy(&v)));
            }
            OP_BNOT => {
                let v = self.pop();
                if let Val::Big(b) = &v {
                    let one = crate::bigint::from_int(1);
                    self.stack.push(Val::Big(Rc::new(crate::bigint::sub(&crate::bigint::neg(b), &one))));
                    return false;
                }
                let n = self.to_number(&v);
                self.stack.push(Val::Num((-to_int32(n) - 1) as double));
            }
            OP_TYPEOF => {
                let v = self.pop();
                let t = self.type_of(&v);
                self.stack.push(string_val(t));
            }
            OP_INC | OP_DEC => {
                let v = self.pop();
                if let Val::Big(b) = &v {
                    let one = crate::bigint::from_int(if op.code == OP_INC { 1 } else { -1 });
                    self.stack.push(Val::Big(Rc::new(crate::bigint::add(b, &one))));
                    return false;
                }
                let n = match v {
                    Val::Num(x) => x,
                    _ => self.to_number(&v),
                };
                self.stack.push(Val::Num(if op.code == OP_INC { n + 1.0 } else { n - 1.0 }));
            }
            OP_TOSTR => {
                let v = self.pop();
                if let Val::Str(_) = v {
                    self.stack.push(v);
                } else {
                    let s = self.to_str(&v);
                    self.stack.push(Val::Str(s));
                }
            }
            OP_JF_KEEP => {
                if !truthy(self.top()) {
                    *pc = op.a;
                } else {
                    self.stack.pop();
                }
            }
            OP_JT_KEEP => {
                if truthy(self.top()) {
                    *pc = op.a;
                } else {
                    self.stack.pop();
                }
            }
            OP_JNN_KEEP => {
                let t = self.top();
                if !(matches!(t, Val::Undef) || matches!(t, Val::Null)) {
                    *pc = op.a;
                } else {
                    self.stack.pop();
                }
            }
            OP_JNOT_UNDEF => {
                let v = self.pop();
                if !matches!(v, Val::Undef) {
                    *pc = op.a;
                }
            }
            OP_JNULLISH => {
                if op.b == 1 {
                    let t = self.top();
                    if matches!(t, Val::Undef) || matches!(t, Val::Null) {
                        self.stack.pop();
                        self.stack.push(Val::Undef);
                        *pc = op.a;
                    }
                } else {
                    let v = self.pop();
                    if matches!(v, Val::Undef) || matches!(v, Val::Null) {
                        let mut k = 1;
                        while k < op.b {
                            self.stack.pop();
                            k += 1;
                        }
                        self.stack.push(Val::Undef);
                        *pc = op.a;
                    }
                }
            }
            OP_NEW => {
                if self.gc_due() {
                    self.gc();
                }
                return self.new_op(op.a);
            }
            OP_CALL_SPREAD => {
                let arr = self.pop();
                let items = self.objs[obj_of(&arr) as usize].elems.clone();
                let argc = items.len() as int;
                for x in items {
                    self.stack.push(x);
                }
                return self.call_op(argc);
            }
            OP_NEW_SPREAD => {
                let arr = self.pop();
                let items = self.objs[obj_of(&arr) as usize].elems.clone();
                let argc = items.len() as int;
                for x in items {
                    self.stack.push(x);
                }
                return self.new_op(argc);
            }
            OP_SUPER_CALL | OP_SUPER_CALL_SPREAD => {
                let mut args: Vec<Val> = Vec::new();
                if op.code == OP_SUPER_CALL_SPREAD {
                    let arr = self.pop();
                    args = self.objs[obj_of(&arr) as usize].elems.clone();
                } else {
                    let n = self.stack.len() as int;
                    let mut i = n - op.a;
                    while i < n {
                        args.push(self.stack[i as usize].clone());
                        i += 1;
                    }
                    self.stack.truncate((n - op.a) as usize);
                }
                // the class whose constructor is running (arrows: their home's)
                let fobj = self.frames[fi].fobj;
                let parent = self.objs[fobj as usize].proto;
                let nt = self.frames[fi].new_target.clone();
                let this = self.frames[fi].this_val.clone();
                let pclass = if parent >= 0 { self.objs[parent as usize].class } else { -1 };
                let result: Val;
                if pclass == C_FUNCTION {
                    // run the parent constructor on the same `this`
                    let base = self.frames.len() as int;
                    let argc = args.len() as int;
                    self.stack.push(Val::Obj(parent));
                    self.stack.push(this.clone());
                    for a in args {
                        self.stack.push(a);
                    }
                    if self.enter_function(parent, argc, true, nt) {
                        self.native_depth += 1;
                        self.run(base);
                        self.native_depth -= 1;
                    }
                    if self.throwing {
                        return false;
                    }
                    result = self.pop();
                } else if pclass == C_NATIVE || pclass == C_BOUND {
                    let r = self.construct(Val::Obj(parent), args, nt);
                    if self.throwing {
                        return false;
                    }
                    // the native made its own object: give it this one's fields
                    if let (Val::Obj(t), Val::Obj(n)) = (&this, &r) {
                        let keys = self.objs[*t as usize].keys.clone();
                        let vals = self.objs[*t as usize].vals.clone();
                        let mut i: usize = 0;
                        while i < keys.len() {
                            self.objs[*n as usize].add(keys[i], vals[i].clone(), 0);
                            i += 1;
                        }
                    }
                    result = r;
                } else {
                    self.throw_type("Super constructor is not a constructor");
                    return false;
                }
                self.frames[fi].this_val = result.clone();
                let ctor = self.frames[fi].fobj;
                self.run_fields(ctor, &result);
                if self.throwing {
                    return false;
                }
                self.stack.push(result);
            }
            OP_CLOSURE => {
                let f = self.closure(op.a);
                self.stack.push(Val::Obj(f));
            }
            OP_CALLEE => {
                let f = self.frames[fi].fobj;
                self.stack.push(Val::Obj(f));
            }
            OP_THIS => {
                let t = self.frames[fi].this_val.clone();
                self.stack.push(t);
            }
            OP_NEW_TARGET => {
                let t = self.frames[fi].new_target.clone();
                self.stack.push(t);
            }
            OP_ARGUMENTS => {
                let a = self.frames[fi].args_obj;
                self.stack.push(if a >= 0 { Val::Obj(a) } else { Val::Undef });
            }
            OP_NEW_OBJECT => {
                let o = self.new_object();
                self.stack.push(Val::Obj(o));
            }
            OP_INIT_PROP => {
                let v = self.pop();
                let o = obj_of(self.top());
                if op.b == 1 {
                    match v {
                        Val::Obj(p) => self.objs[o as usize].proto = p,
                        Val::Null => self.objs[o as usize].proto = -1,
                        _ => {}
                    }
                } else {
                    self.define(o, op.a, v, 0);
                }
            }
            OP_INIT_ELEM => {
                let v = self.pop();
                let k = self.pop();
                let o = obj_of(self.top());
                self.define_elem(o, &k, v, 0);
            }
            OP_DEFINE_FIELD => {
                let v = self.pop();
                let o = obj_of(self.top());
                if o >= 0 {
                    self.define(o, op.a, v, 0);
                }
            }
            OP_DEFINE_FIELD_ELEM => {
                let v = self.pop();
                let k = self.pop();
                let o = obj_of(self.top());
                if o >= 0 {
                    self.define_elem(o, &k, v, 0);
                }
            }
            OP_INIT_GETTER | OP_INIT_SETTER => {
                let f = self.pop();
                let o = obj_of(self.top());
                self.objs[obj_of(&f) as usize].home = o;
                self.define_accessor(o, op.a, f, if op.code == OP_INIT_GETTER { 0 } else { 1 }, op.b == 1);
            }
            OP_INIT_GETTER_ELEM | OP_INIT_SETTER_ELEM => {
                let f = self.pop();
                let k = self.pop();
                let o = obj_of(self.top());
                let (i, a) = self.to_key(&k);
                let atom = if i >= 0 { self.index_atom(i) } else { a };
                self.objs[obj_of(&f) as usize].home = o;
                self.define_accessor(o, atom, f, if op.code == OP_INIT_GETTER_ELEM { 0 } else { 1 }, op.b == 1);
            }
            OP_INIT_SPREAD => {
                let src = self.pop();
                let o = obj_of(self.top());
                if let Val::Obj(s) = &src {
                    let keys = self.own_keys(*s, false, true);
                    for k in keys {
                        let v = self.get_elem(&src, &k);
                        if self.throwing {
                            return false;
                        }
                        self.define_elem(o, &k, v, 0);
                    }
                } else if let Val::Str(s) = &src {
                    let mut i: int = 0;
                    for c in s.chars() {
                        let mut t = String::new();
                        t.push(c);
                        self.set_index(o, i, string_val(t));
                        i += 1;
                    }
                }
            }
            OP_DEFINE_METHOD => {
                let f = self.pop();
                let o = obj_of(self.top());
                self.objs[obj_of(&f) as usize].home = o;
                let hidden = self.is_class_proto(o) || self.is_class_ctor(o);
                self.define(o, op.a, f, if hidden { P_HIDDEN } else { 0 });
            }
            OP_DEFINE_METHOD_ELEM => {
                let f = self.pop();
                let k = self.pop();
                let o = obj_of(self.top());
                self.objs[obj_of(&f) as usize].home = o;
                let hidden = self.is_class_proto(o) || self.is_class_ctor(o);
                self.define_elem(o, &k, f, if hidden { P_HIDDEN } else { 0 });
            }
            OP_NEW_ARRAY => {
                let n = self.stack.len() as int;
                let mut items: Vec<Val> = Vec::with_capacity(op.a as usize);
                let mut i = n - op.a;
                while i < n {
                    items.push(self.stack[i as usize].clone());
                    i += 1;
                }
                self.stack.truncate((n - op.a) as usize);
                let a = self.new_array(items);
                self.stack.push(Val::Obj(a));
            }
            OP_ARRAY_PUSH => {
                let v = self.pop();
                let a = obj_of(self.top());
                let holes = self.has_holes(a);
                self.objs[a as usize].elems.push(v);
                if holes {
                    self.objs[a as usize].saved.push(0);
                }
            }
            OP_ARRAY_HOLE => {
                let a = obj_of(self.top());
                self.push_holes(a, 1);
            }
            OP_ARRAY_SPREAD => {
                let src = self.pop();
                let items = self.iterable_to_vec(&src);
                if self.throwing {
                    return false;
                }
                let a = obj_of(self.top());
                let holes = self.has_holes(a);
                for x in items {
                    self.objs[a as usize].elems.push(x);
                    if holes {
                        self.objs[a as usize].saved.push(0);
                    }
                }
            }
            OP_TEMPLATE_OBJ => {
                // [cooked…, raw…] → the call site's strings object, made
                // once and frozen
                let n = self.stack.len() as int;
                let cnt = op.a;
                let key = format!("{}:{}", pi, *pc);
                let cached = match self.template_cache.get(&key) {
                    Some(t) => *t,
                    None => -1,
                };
                if cached >= 0 {
                    self.stack.truncate((n - 2 * cnt) as usize);
                    self.stack.push(Val::Obj(cached));
                    return false;
                }
                let mut cooked: Vec<Val> = Vec::new();
                let mut raws: Vec<Val> = Vec::new();
                let mut i = n - 2 * cnt;
                while i < n - cnt {
                    cooked.push(self.stack[i as usize].clone());
                    raws.push(self.stack[(i + cnt) as usize].clone());
                    i += 1;
                }
                self.stack.truncate((n - 2 * cnt) as usize);
                let raw = self.new_array(raws);
                let a = self.new_array(cooked);
                self.define(a, A_RAW, Val::Obj(raw), P_HIDDEN | P_READONLY | P_FIXED);
                for o in vec![raw, a] {
                    self.objs[o as usize].extensible = false;
                    self.objs[o as usize].pos = 2;
                }
                self.roots.push(a);
                self.template_cache.insert(key, a);
                self.stack.push(Val::Obj(a));
            }
            OP_THROW => {
                let v = self.pop();
                self.throw_val(v);
            }
            OP_TRY => {
                let sp = self.stack.len() as int;
                let env = self.frames[fi].env;
                self.handlers.push(Handler { frame: fi as int, catch_pc: op.a, sp: sp, env: env });
            }
            OP_END_TRY => {
                self.handlers.pop();
            }
            OP_ITER_KEYS => {
                let v = self.pop();
                let keys = match &v {
                    Val::Obj(o) => self.for_in_keys(*o),
                    Val::Str(s) => {
                        let mut ks: Vec<Val> = Vec::new();
                        let n = jsstr::len(s.as_str());
                        let mut i = 0;
                        while i < n {
                            ks.push(string_val(format!("{}", i)));
                            i += 1;
                        }
                        ks
                    }
                    _ => Vec::new(),
                };
                let arr = self.new_array(keys);
                let ip = self.iter_proto;
                let it = self.alloc(C_ITER, ip);
                self.objs[it as usize].env = arr;
                self.objs[it as usize].func = 0;
                // for-in skips keys deleted during the loop
                self.objs[it as usize].home = obj_of(&v);
                self.stack.push(Val::Obj(it));
            }
            OP_ITER_VALUES => {
                let v = self.pop();
                let it = self.iter_values(&v);
                if self.throwing {
                    return false;
                }
                self.stack.push(it);
            }
            OP_ITER_NEXT => {
                let it = self.top().clone();
                let o = obj_of(&it);
                let src_obj = if o >= 0 { self.objs[o as usize].home } else { -1 };
                loop {
                    match self.iter_next(&it) {
                        Some(v) => {
                            if src_obj >= 0 && self.objs[o as usize].class == C_ITER {
                                // a key deleted since the loop began is skipped
                                if !self.has_property(src_obj, &v) {
                                    continue;
                                }
                            }
                            self.stack.push(v);
                        }
                        None => {
                            if !self.throwing {
                                *pc = op.a;
                            }
                        }
                    }
                    break;
                }
            }
            OP_PUSH_ENV => {
                let parent = self.frames[fi].env;
                let e = self.alloc(C_ENV, parent);
                let mut slots: Vec<Val> = Vec::new();
                let mut i = 0;
                while i < op.a {
                    slots.push(Val::Undef);
                    i += 1;
                }
                self.objs[e as usize].elems = slots;
                self.frames[fi].env = e;
            }
            OP_POP_ENV => {
                let e = self.frames[fi].env;
                self.frames[fi].env = self.objs[e as usize].proto;
            }
            OP_COPY_ENV => {
                let e = self.frames[fi].env;
                let parent = self.objs[e as usize].proto;
                let slots = self.objs[e as usize].elems.clone();
                let n = self.alloc(C_ENV, parent);
                self.objs[n as usize].elems = slots;
                self.frames[fi].env = n;
            }
            OP_REGEX => {
                let src = self.protos[pi].consts[op.a as usize].clone();
                let flags = self.protos[pi].consts[op.b as usize].clone();
                let r = self.new_regexp(&src, &flags);
                if !self.throwing {
                    self.stack.push(r);
                }
            }
            OP_CLASS => {
                let mut sup = Val::Undef;
                if op.a == 1 {
                    sup = self.pop();
                }
                let ctor = obj_of(self.top());
                let mut proto_parent = self.object_proto;
                if op.a == 1 {
                    match &sup {
                        Val::Null => {
                            proto_parent = -1;
                        }
                        Val::Obj(s) => {
                            if !self.is_callable(&sup) {
                                self.throw_type("Class extends value is not a constructor or null");
                                return false;
                            }
                            let sp = self.get_obj(*s, A_PROTOTYPE, &sup);
                            match sp {
                                Val::Obj(p) => proto_parent = p,
                                Val::Null => proto_parent = -1,
                                _ => {
                                    self.throw_type("Class extends value does not have valid prototype property");
                                    return false;
                                }
                            }
                            self.objs[ctor as usize].proto = *s;
                        }
                        _ => {
                            self.throw_type("Class extends value is not a constructor or null");
                            return false;
                        }
                    }
                }
                let p = self.alloc(C_OBJECT, proto_parent);
                self.objs[p as usize].add(A_CONSTRUCTOR, Val::Obj(ctor), P_HIDDEN);
                self.objs[p as usize].pos = 1; // a class prototype: methods hidden
                self.define(ctor, A_PROTOTYPE, Val::Obj(p), P_HIDDEN | P_READONLY | P_FIXED);
                self.objs[ctor as usize].home = p;
                self.stack.push(Val::Obj(p));
            }
            OP_SET_FIELDS => {
                let f = self.pop();
                let ctor = obj_of(self.top());
                self.objs[obj_of(&f) as usize].home = self.objs[ctor as usize].home;
                self.objs[ctor as usize].elems2 = vec![f];
            }
            OP_GET_SUPER | OP_GET_SUPER_ELEM => {
                let key = if op.code == OP_GET_SUPER { self.key_val(op.a) } else { self.pop() };
                let fobj = self.frames[fi].fobj;
                let home = self.objs[fobj as usize].home;
                let this = self.frames[fi].this_val.clone();
                if home < 0 {
                    self.throw_syntax("'super' keyword unexpected here");
                    return false;
                }
                let start = self.objs[home as usize].proto;
                if start < 0 {
                    self.stack.push(Val::Undef);
                } else {
                    let (i, a) = self.to_key(&key);
                    let atom = if i >= 0 { self.index_atom(i) } else { a };
                    let v = self.get_obj(start, atom, &this);
                    self.stack.push(v);
                }
            }
            OP_REQUIRE_OBJ => {
                let t = self.top();
                if matches!(t, Val::Undef) || matches!(t, Val::Null) {
                    self.throw_type("Cannot destructure 'undefined' or 'null'");
                }
            }
            OP_OBJ_REST => {
                let n = self.stack.len() as int;
                let mut skip: Vec<String> = Vec::new();
                let mut i = n - op.a;
                while i < n {
                    let k = self.stack[i as usize].clone();
                    let s = self.to_string(&k);
                    skip.push(s);
                    i += 1;
                }
                self.stack.truncate((n - op.a) as usize);
                let src = self.top().clone();
                let r = self.new_object();
                if let Val::Obj(s) = &src {
                    let keys = self.own_keys(*s, false, true);
                    for k in keys {
                        let ks = if let Val::Str(x) = &k { x.as_ref().clone() } else { String::new() };
                        let mut skipped = false;
                        for x in skip.iter() {
                            if x.as_str() == ks.as_str() && !ks.is_empty() {
                                skipped = true;
                            }
                        }
                        if skipped {
                            continue;
                        }
                        let v = self.get_elem(&src, &k);
                        self.define_elem(r, &k, v, 0);
                    }
                }
                self.stack.push(Val::Obj(r));
            }
            OP_TO_ARRAY => {
                let v = self.pop();
                if matches!(v, Val::Undef) || matches!(v, Val::Null) {
                    self.throw_type("value is not iterable");
                    return false;
                }
                let items = self.iterable_to_vec(&v);
                if self.throwing {
                    return false;
                }
                let a = self.new_array(items);
                self.stack.push(Val::Obj(a));
            }
            OP_ARRAY_REST => {
                let a = obj_of(self.top());
                let n = self.objs[a as usize].elems.len() as int;
                let mut items: Vec<Val> = Vec::new();
                let mut i = op.a;
                while i < n {
                    items.push(self.objs[a as usize].elems[i as usize].clone());
                    i += 1;
                }
                let r = self.new_array(items);
                self.stack.push(Val::Obj(r));
            }
            OP_SET_NAME => {
                let f = obj_of(self.top());
                if f >= 0 {
                    let class = self.objs[f as usize].class;
                    let name = self.protos[pi].consts[op.a as usize].clone();
                    if class == C_FUNCTION {
                        let fp = self.objs[f as usize].func;
                        if self.protos[fp as usize].name.is_empty() {
                            if let Val::Str(s) = &name {
                                self.protos[fp as usize].name = s.as_ref().clone();
                            }
                        }
                    }
                }
            }
            OP_CONST_ERROR => {
                self.throw_type("Assignment to constant variable.");
            }
            OP_NOP => {}
            _ => {
                let _ = bp;
                self.throw_type(format!("internal: unknown op {}", op.code).as_str());
            }
        }
        false
    }

    fn is_class_ctor(&self, o: int) -> bool {
        let ob = &self.objs[o as usize];
        ob.class == C_FUNCTION && self.protos[ob.func as usize].class_ctor
    }

    fn is_class_proto(&self, o: int) -> bool {
        self.objs[o as usize].pos == 1 && self.objs[o as usize].class == C_OBJECT
    }

    // ---- collection

    fn mark_val(&mut self, v: &Val, work: &mut Vec<int>) {
        if let Val::Obj(o) = v {
            if !self.objs[*o as usize].marked {
                self.objs[*o as usize].marked = true;
                work.push(*o);
            }
        }
    }

    fn mark_obj(&mut self, o: int, work: &mut Vec<int>) {
        if o >= 0 && !self.objs[o as usize].marked {
            self.objs[o as usize].marked = true;
            work.push(o);
        }
    }

    pub fn gc(&mut self) {
        self.gc_runs += 1;
        let mut work: Vec<int> = Vec::new();
        let g = self.global;
        self.mark_obj(g, &mut work);
        for r in self.roots.clone() {
            self.mark_obj(r, &mut work);
        }
        for s in self.symbols.clone() {
            self.mark_obj(s, &mut work);
        }
        let n = self.stack.len();
        let mut i: usize = 0;
        while i < n {
            let v = self.stack[i].clone();
            self.mark_val(&v, &mut work);
            i += 1;
        }
        let nf = self.frames.len();
        let mut k: usize = 0;
        while k < nf {
            let (fo, env, t, nt, ao) = {
                let f = &self.frames[k];
                (f.fobj, f.env, f.this_val.clone(), f.new_target.clone(), f.args_obj)
            };
            self.mark_obj(fo, &mut work);
            self.mark_obj(env, &mut work);
            self.mark_val(&t, &mut work);
            self.mark_val(&nt, &mut work);
            self.mark_obj(ao, &mut work);
            k += 1;
        }
        for h in 0..self.handlers.len() {
            let e = self.handlers[h].env;
            self.mark_obj(e, &mut work);
        }
        let exc = self.exc.clone();
        self.mark_val(&exc, &mut work);
        for v in self.temp_roots.clone() {
            self.mark_val(&v, &mut work);
        }
        for v in self.jobs.clone() {
            self.mark_val(&v, &mut work);
        }
        while !work.is_empty() {
            let o = work.pop().unwrap();
            let (proto, env, home) = {
                let ob = &self.objs[o as usize];
                (ob.proto, ob.env, ob.home)
            };
            self.mark_obj(proto, &mut work);
            self.mark_obj(env, &mut work);
            self.mark_obj(home, &mut work);
            let prim = self.objs[o as usize].prim.clone();
            self.mark_val(&prim, &mut work);
            let nv = self.objs[o as usize].vals.len();
            let mut j: usize = 0;
            while j < nv {
                if let Val::Obj(x) = self.objs[o as usize].vals[j] {
                    self.mark_obj(x, &mut work);
                }
                j += 1;
            }
            let ne = self.objs[o as usize].elems.len();
            j = 0;
            while j < ne {
                if let Val::Obj(x) = self.objs[o as usize].elems[j] {
                    self.mark_obj(x, &mut work);
                }
                j += 1;
            }
            let ne2 = self.objs[o as usize].elems2.len();
            j = 0;
            while j < ne2 {
                if let Val::Obj(x) = self.objs[o as usize].elems2[j] {
                    self.mark_obj(x, &mut work);
                }
                j += 1;
            }
        }
        let total = self.objs.len();
        let mut live: int = 0;
        let mut i2: usize = 0;
        while i2 < total {
            let ob = &mut self.objs[i2];
            if ob.marked {
                ob.marked = false;
                live += 1;
            } else if !ob.free {
                ob.clear();
                ob.free = true;
                self.free_list.push(i2 as int);
            }
            i2 += 1;
        }
        self.alloc_count = 0;
        self.gc_threshold = if live * 2 > 200000 { live * 2 } else { 200000 };
    }
}

pub fn pow2(n: int) -> double {
    let mut r: double = 1.0;
    let mut i: int = 0;
    while i < n {
        r = r * 2.0;
        i += 1;
    }
    r
}

/// Math.imul: the low 32 bits of the product, in pieces that stay exact.
pub fn imul(a: int, b: int) -> int {
    let al = a & 65535;
    let ah = (a >> 16) & 65535;
    let bl = b & 65535;
    let bh = (b >> 16) & 65535;
    let mid = wrap32(((ah * bl + al * bh) & 65535) * 65536);
    wrap32(al * bl + mid)
}

/// The low 32 bits of `v` as a signed integer.
pub fn wrap32(v: int) -> int {
    let m = v & 4294967295;
    if m >= 2147483648 {
        m - 4294967296
    } else {
        m
    }
}

pub fn arith_num(code: int, x: double, y: double) -> double {
    match code {
        OP_SUB => x - y,
        OP_MUL => x * y,
        OP_DIV => x / y,
        OP_MOD => {
            if y == 0.0 || !is_finite(x) || is_nan(y) {
                return nan();
            }
            if !is_finite(y) {
                return x;
            }
            let r = x % y;
            r
        }
        OP_EXP => {
            if is_nan(y) {
                return nan();
            }
            if (x == 1.0 || x == -1.0) && !is_finite(y) {
                return nan();
            }
            x.powf(y)
        }
        OP_BAND => (to_int32(x) & to_int32(y)) as double,
        OP_BOR => (to_int32(x) | to_int32(y)) as double,
        OP_BXOR => (to_int32(x) ^ to_int32(y)) as double,
        OP_SHL => wrap32(to_int32(x) << (to_int32(y) & 31)) as double,
        OP_SHR => (to_int32(x) >> (to_int32(y) & 31)) as double,
        // in doubles: a target's `int` bit operations may be 32 bits wide
        OP_USHR => (to_uint32(x) / pow2(to_int32(y) & 31)).floor(),
        _ => nan(),
    }
}
