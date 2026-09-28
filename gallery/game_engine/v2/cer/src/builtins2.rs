// SPDX-License-Identifier: AGPL-3.0-or-later
//! The rest of the built-in functions: Array, String, Number, Boolean, JSON,
//! RegExp, Date, Map / Set, Promise and iterators.

use ranger::prelude::*;
use std::collections::HashMap;

use crate::builtins::*;
use crate::jsstr;
use crate::num::*;
use crate::value::*;
use crate::vm::*;

impl Vm {
    fn this_array(&mut self, this: &Val) -> int {
        match this {
            Val::Obj(o) => *o,
            _ => {
                let o = self.to_object(this);
                o
            }
        }
    }

    /// The elements of an array-like `this` (arrays directly).
    fn elems_of(&mut self, o: int) -> Vec<Val> {
        if o < 0 {
            return Vec::new();
        }
        let class = self.objs[o as usize].class;
        if class == C_ARRAY || class == C_ARGUMENTS {
            return self.objs[o as usize].elems.clone();
        }
        self.array_like_to_vec(&Val::Obj(o))
    }

    fn is_array_obj(&self, o: int) -> bool {
        self.objs[o as usize].class == C_ARRAY
    }

    fn callback(&mut self, f: &Val, name: &str) -> bool {
        if !self.is_callable(f) {
            self.throw_type(format!("{} is not a function", name).as_str());
            return false;
        }
        true
    }

    fn flatten_into(&mut self, out: &mut Vec<Val>, items: Vec<Val>, depth: double) {
        for it in items {
            if depth >= 1.0 {
                if let Val::Obj(o) = &it {
                    if self.objs[*o as usize].class == C_ARRAY {
                        let inner = self.objs[*o as usize].elems.clone();
                        self.flatten_into(out, inner, depth - 1.0);
                        continue;
                    }
                }
            }
            out.push(it);
        }
    }

    fn array_join(&mut self, o: int, sep: &str, seen: &mut Vec<int>) -> String {
        for s in seen.iter() {
            if *s == o {
                return String::new();
            }
        }
        seen.push(o);
        let items = self.elems_of(o);
        let mut out = String::new();
        let mut i: usize = 0;
        for it in items {
            if i > 0 {
                out.push_str(sep);
            }
            match &it {
                Val::Undef | Val::Null => {}
                Val::Obj(x) => {
                    if self.objs[*x as usize].class == C_ARRAY {
                        let inner = self.array_join(*x, ",", seen);
                        out.push_str(inner.as_str());
                    } else {
                        let s = self.to_str(&it);
                        if self.throwing {
                            return String::new();
                        }
                        out.push_str(s.as_str());
                    }
                }
                _ => {
                    let s = self.to_str(&it);
                    out.push_str(s.as_str());
                }
            }
            i += 1;
        }
        seen.pop();
        out
    }

    pub fn call_native2(&mut self, id: int, fobj: int, this: Val, args: Vec<Val>, construct: bool, new_target: Val) -> Val {
        let a0 = arg(&args, 0);
        let a1 = arg(&args, 1);
        match id {
            // ---- Array
            NF_A_ISARRAY => Val::Bool(self.class_of(&a0) == C_ARRAY),
            NF_A_OF => {
                let a = self.new_array(args);
                Val::Obj(a)
            }
            NF_A_FROM => {
                if matches!(a0, Val::Undef) || matches!(a0, Val::Null) {
                    self.throw_type("Array.from requires an array-like object");
                    return Val::Undef;
                }
                let has_iter = {
                    let f = self.get(&a0, A_ITERATOR);
                    self.is_callable(&f) || matches!(a0, Val::Str(_))
                };
                let items = if has_iter { self.iterable_to_vec(&a0) } else { self.array_like_to_vec(&a0) };
                if self.throwing {
                    return Val::Undef;
                }
                if self.is_callable(&a1) {
                    let mut out: Vec<Val> = Vec::new();
                    let mut i: int = 0;
                    for it in items {
                        let r = self.call_value(a1.clone(), arg(&args, 2), vec![it, Val::Num(i as double)]);
                        if self.throwing {
                            return Val::Undef;
                        }
                        out.push(r);
                        i += 1;
                    }
                    let a = self.new_array(out);
                    return Val::Obj(a);
                }
                let a = self.new_array(items);
                Val::Obj(a)
            }
            NF_AP_PUSH => {
                let o = self.this_array(&this);
                if self.is_array_obj(o) {
                    if !self.objs[o as usize].extensible {
                        let n = self.objs[o as usize].elems.len();
                        self.throw_type(format!("Cannot add property {}, object is not extensible", n).as_str());
                        return Val::Undef;
                    }
                    for a in args {
                        self.objs[o as usize].elems.push(a);
                    }
                    return Val::Num(self.objs[o as usize].elems.len() as double);
                }
                let mut n = self.len_of(&Val::Obj(o));
                for a in args {
                    self.set_index(o, n, a);
                    n += 1;
                }
                self.set_obj(o, A_LENGTH, Val::Num(n as double));
                Val::Num(n as double)
            }
            NF_AP_POP => {
                let o = self.this_array(&this);
                if self.is_array_obj(o) {
                    return match self.objs[o as usize].elems.pop() {
                        Some(v) => v,
                        None => Val::Undef,
                    };
                }
                let n = self.len_of(&Val::Obj(o));
                if n == 0 {
                    self.set_obj(o, A_LENGTH, Val::Num(0.0));
                    return Val::Undef;
                }
                let v = self.get_index(&Val::Obj(o), n - 1);
                let k = Val::Num((n - 1) as double);
                self.delete(o, &k);
                self.set_obj(o, A_LENGTH, Val::Num((n - 1) as double));
                v
            }
            NF_AP_SHIFT => {
                let o = self.this_array(&this);
                if self.objs[o as usize].elems.is_empty() {
                    return Val::Undef;
                }
                self.objs[o as usize].elems.remove(0)
            }
            NF_AP_UNSHIFT => {
                let o = self.this_array(&this);
                let mut i: usize = 0;
                for a in args {
                    self.objs[o as usize].elems.insert(i, a);
                    i += 1;
                }
                Val::Num(self.objs[o as usize].elems.len() as double)
            }
            NF_AP_SLICE => {
                let o = self.this_array(&this);
                let items = self.elems_of(o);
                let len = items.len() as int;
                let s = self.rel_index(&a0, len, 0);
                let e = self.rel_index(&a1, len, len);
                let mut out: Vec<Val> = Vec::new();
                let mut i = s;
                while i < e {
                    out.push(items[i as usize].clone());
                    i += 1;
                }
                let a = self.new_array(out);
                Val::Obj(a)
            }
            NF_AP_SPLICE => {
                let o = self.this_array(&this);
                let len = self.objs[o as usize].elems.len() as int;
                let s = self.rel_index(&a0, len, 0);
                let del = if args.is_empty() {
                    0
                } else if args.len() == 1 {
                    len - s
                } else {
                    let d = to_integer(self.to_number(&a1)) as int;
                    if d < 0 {
                        0
                    } else if d > len - s {
                        len - s
                    } else {
                        d
                    }
                };
                let mut removed: Vec<Val> = Vec::new();
                let mut k = 0;
                while k < del {
                    removed.push(self.objs[o as usize].elems.remove(s as usize));
                    k += 1;
                }
                let mut i: usize = 2;
                let mut at = s as usize;
                while i < args.len() {
                    self.objs[o as usize].elems.insert(at, args[i].clone());
                    at += 1;
                    i += 1;
                }
                let a = self.new_array(removed);
                Val::Obj(a)
            }
            NF_AP_CONCAT => {
                let o = self.this_array(&this);
                let mut out = self.elems_of(o);
                for a in args {
                    if let Val::Obj(x) = &a {
                        if self.objs[*x as usize].class == C_ARRAY {
                            let items = self.objs[*x as usize].elems.clone();
                            for it in items {
                                out.push(it);
                            }
                            continue;
                        }
                    }
                    out.push(a);
                }
                let r = self.new_array(out);
                Val::Obj(r)
            }
            NF_AP_JOIN => {
                let o = self.this_array(&this);
                let sep = if matches!(a0, Val::Undef) { String::from(",") } else { self.to_string(&a0) };
                let mut seen: Vec<int> = Vec::new();
                let s = self.array_join(o, sep.as_str(), &mut seen);
                string_val(s)
            }
            NF_AP_TOSTRING => {
                let o = self.this_array(&this);
                if self.objs[o as usize].class != C_ARRAY {
                    let jf = self.get(&this, self.atoms["join"]);
                    if self.is_callable(&jf) {
                        return self.call_value(jf, this.clone(), Vec::new());
                    }
                    return string_val(String::from("[object Object]"));
                }
                let mut seen: Vec<int> = Vec::new();
                let s = self.array_join(o, ",", &mut seen);
                string_val(s)
            }
            NF_AP_REVERSE => {
                let o = self.this_array(&this);
                self.objs[o as usize].elems.reverse();
                Val::Obj(o)
            }
            NF_AP_TOREVERSED => {
                let o = self.this_array(&this);
                let mut items = self.elems_of(o);
                items.reverse();
                let a = self.new_array(items);
                Val::Obj(a)
            }
            NF_AP_INDEXOF | NF_AP_LASTINDEXOF | NF_AP_INCLUDES => {
                let o = self.this_array(&this);
                let items = self.elems_of(o);
                let len = items.len() as int;
                if id == NF_AP_LASTINDEXOF {
                    let mut i = if args.len() > 1 {
                        let n = to_integer(self.to_number(&a1));
                        if n < 0.0 {
                            len + (n as int)
                        } else if n >= len as double {
                            len - 1
                        } else {
                            n as int
                        }
                    } else {
                        len - 1
                    };
                    while i >= 0 {
                        if self.strict_equals(&items[i as usize], &a0) {
                            return Val::Num(i as double);
                        }
                        i -= 1;
                    }
                    return Val::Num(-1.0);
                }
                let mut i = self.rel_index(&a1, len, 0);
                while i < len {
                    let hit = if id == NF_AP_INCLUDES { self.same_value_zero(&items[i as usize], &a0) } else { self.strict_equals(&items[i as usize], &a0) };
                    if hit {
                        return if id == NF_AP_INCLUDES { Val::Bool(true) } else { Val::Num(i as double) };
                    }
                    i += 1;
                }
                if id == NF_AP_INCLUDES {
                    Val::Bool(false)
                } else {
                    Val::Num(-1.0)
                }
            }
            NF_AP_FOREACH | NF_AP_MAP | NF_AP_FILTER | NF_AP_SOME | NF_AP_EVERY | NF_AP_FIND | NF_AP_FINDINDEX | NF_AP_FINDLAST | NF_AP_FINDLASTINDEX | NF_AP_FLATMAP => {
                let o = self.this_array(&this);
                if self.throwing {
                    return Val::Undef;
                }
                if !self.callback(&a0, "callback") {
                    return Val::Undef;
                }
                let len = self.len_of(&Val::Obj(o));
                let back = id == NF_AP_FINDLAST || id == NF_AP_FINDLASTINDEX;
                let mut out: Vec<Val> = Vec::new();
                let mut k: int = 0;
                while k < len {
                    let i = if back { len - 1 - k } else { k };
                    let ob = Val::Obj(o);
                    // holes are skipped by forEach / map / filter / some / every
                    let present = if id == NF_AP_FIND || id == NF_AP_FINDINDEX || back {
                        true
                    } else if self.objs[o as usize].class == C_ARRAY {
                        (i as usize) < self.objs[o as usize].elems.len()
                    } else {
                        let kv = Val::Num(i as double);
                        self.has_property(o, &kv)
                    };
                    if !present {
                        k += 1;
                        continue;
                    }
                    let v = self.get_index(&ob, i);
                    let r = self.call_value(a0.clone(), a1.clone(), vec![v.clone(), Val::Num(i as double), ob.clone()]);
                    if self.throwing {
                        return Val::Undef;
                    }
                    match id {
                        NF_AP_MAP => out.push(r),
                        NF_AP_FLATMAP => {
                            if let Val::Obj(x) = &r {
                                if self.objs[*x as usize].class == C_ARRAY {
                                    let items = self.objs[*x as usize].elems.clone();
                                    for it in items {
                                        out.push(it);
                                    }
                                    k += 1;
                                    continue;
                                }
                            }
                            out.push(r);
                        }
                        NF_AP_FILTER => {
                            if truthy(&r) {
                                out.push(v);
                            }
                        }
                        NF_AP_SOME => {
                            if truthy(&r) {
                                return Val::Bool(true);
                            }
                        }
                        NF_AP_EVERY => {
                            if !truthy(&r) {
                                return Val::Bool(false);
                            }
                        }
                        NF_AP_FIND | NF_AP_FINDLAST => {
                            if truthy(&r) {
                                return v;
                            }
                        }
                        NF_AP_FINDINDEX | NF_AP_FINDLASTINDEX => {
                            if truthy(&r) {
                                return Val::Num(i as double);
                            }
                        }
                        _ => {}
                    }
                    k += 1;
                }
                match id {
                    NF_AP_MAP | NF_AP_FILTER | NF_AP_FLATMAP => {
                        let a = self.new_array(out);
                        Val::Obj(a)
                    }
                    NF_AP_SOME => Val::Bool(false),
                    NF_AP_EVERY => Val::Bool(true),
                    NF_AP_FINDINDEX | NF_AP_FINDLASTINDEX => Val::Num(-1.0),
                    _ => Val::Undef,
                }
            }
            NF_AP_REDUCE | NF_AP_REDUCERIGHT => {
                let o = self.this_array(&this);
                if !self.callback(&a0, "reducer") {
                    return Val::Undef;
                }
                let items = self.elems_of(o);
                let len = items.len() as int;
                let right = id == NF_AP_REDUCERIGHT;
                let mut k: int = 0;
                let mut acc: Val;
                if args.len() >= 2 {
                    acc = a1.clone();
                } else {
                    if len == 0 {
                        self.throw_type("Reduce of empty array with no initial value");
                        return Val::Undef;
                    }
                    acc = items[if right { (len - 1) as usize } else { 0 }].clone();
                    k = 1;
                }
                while k < len {
                    let i = if right { len - 1 - k } else { k };
                    let v = items[i as usize].clone();
                    acc = self.call_value(a0.clone(), Val::Undef, vec![acc, v, Val::Num(i as double), Val::Obj(o)]);
                    if self.throwing {
                        return Val::Undef;
                    }
                    k += 1;
                }
                acc
            }
            NF_AP_SORT | NF_AP_TOSORTED => {
                let o = self.this_array(&this);
                if !matches!(a0, Val::Undef) && !self.is_callable(&a0) {
                    self.throw_type("The comparison function must be either a function or undefined");
                    return Val::Undef;
                }
                let mut items = self.elems_of(o);
                self.temp_roots.push(Val::Obj(o));
                self.merge_sort(&mut items, &a0);
                self.temp_roots.pop();
                if self.throwing {
                    return Val::Undef;
                }
                if id == NF_AP_TOSORTED {
                    let a = self.new_array(items);
                    return Val::Obj(a);
                }
                if self.objs[o as usize].class == C_ARRAY {
                    self.objs[o as usize].elems = items;
                } else {
                    let mut i: int = 0;
                    for it in items {
                        self.set_index(o, i, it);
                        i += 1;
                    }
                }
                Val::Obj(o)
            }
            NF_AP_FILL => {
                let o = self.this_array(&this);
                let len = self.objs[o as usize].elems.len() as int;
                let s = self.rel_index(&a1, len, 0);
                let e = self.rel_index(&arg(&args, 2), len, len);
                let mut i = s;
                while i < e {
                    self.objs[o as usize].elems[i as usize] = a0.clone();
                    i += 1;
                }
                Val::Obj(o)
            }
            NF_AP_COPYWITHIN => {
                let o = self.this_array(&this);
                let items = self.elems_of(o);
                let len = items.len() as int;
                let t = self.rel_index(&a0, len, 0);
                let s = self.rel_index(&a1, len, 0);
                let e = self.rel_index(&arg(&args, 2), len, len);
                let mut i: int = 0;
                while s + i < e && t + i < len {
                    self.objs[o as usize].elems[(t + i) as usize] = items[(s + i) as usize].clone();
                    i += 1;
                }
                Val::Obj(o)
            }
            NF_AP_WITH => {
                let o = self.this_array(&this);
                let mut items = self.elems_of(o);
                let len = items.len() as int;
                let n = to_integer(self.to_number(&a0));
                let i = if n < 0.0 { len + (n as int) } else { n as int };
                if i < 0 || i >= len {
                    self.throw_range("Invalid index");
                    return Val::Undef;
                }
                items[i as usize] = a1;
                let a = self.new_array(items);
                Val::Obj(a)
            }
            NF_AP_AT => {
                let o = self.this_array(&this);
                let len = self.len_of(&Val::Obj(o));
                let n = to_integer(self.to_number(&a0));
                let i = if n < 0.0 { len + (n as int) } else { n as int };
                if i < 0 || i >= len {
                    return Val::Undef;
                }
                self.get_index(&Val::Obj(o), i)
            }
            NF_AP_FLAT => {
                let o = self.this_array(&this);
                let depth = if matches!(a0, Val::Undef) { 1.0 } else { to_integer(self.to_number(&a0)) };
                let items = self.elems_of(o);
                let mut out: Vec<Val> = Vec::new();
                self.flatten_into(&mut out, items, depth);
                let a = self.new_array(out);
                Val::Obj(a)
            }
            NF_AP_KEYS | NF_AP_VALUES | NF_AP_ENTRIES => {
                let o = self.to_object(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let ip = self.iter_proto;
                let it = self.alloc(C_ITER, ip);
                let class = self.objs[o as usize].class;
                if class == C_ARRAY || class == C_ARGUMENTS {
                    self.objs[it as usize].env = o;
                } else {
                    let items = self.array_like_to_vec(&Val::Obj(o));
                    let a = self.new_array(items);
                    self.objs[it as usize].env = a;
                }
                self.objs[it as usize].func = 0;
                self.objs[it as usize].pos = if id == NF_AP_KEYS {
                    1
                } else if id == NF_AP_ENTRIES {
                    2
                } else {
                    0
                };
                Val::Obj(it)
            }
            NF_ITER_NEXT => {
                let r = self.new_object();
                match self.iter_next(&this) {
                    Some(v) => {
                        self.objs[r as usize].add(A_VALUE, v, 0);
                        self.objs[r as usize].add(A_DONE, Val::Bool(false), 0);
                    }
                    None => {
                        self.objs[r as usize].add(A_VALUE, Val::Undef, 0);
                        self.objs[r as usize].add(A_DONE, Val::Bool(true), 0);
                    }
                }
                Val::Obj(r)
            }
            NF_ITER_SELF => this,
            // ---- String
            NF_S_FROMCHARCODE => {
                let mut u: Vec<int> = Vec::new();
                for a in args.iter() {
                    let n = self.to_number(a);
                    u.push((to_uint32(n) % 65536.0) as int);
                }
                let len = u.len() as int;
                string_val(jsstr::from_units(&u, 0, len))
            }
            NF_S_FROMCODEPOINT => {
                let mut s = String::new();
                for a in args.iter() {
                    let n = self.to_number(a);
                    if n != to_integer(n) || n < 0.0 || n > 1114111.0 {
                        self.throw_range(format!("Invalid code point {}", number_to_string(n)).as_str());
                        return Val::Undef;
                    }
                    jsstr::push_cp(&mut s, n as int);
                }
                string_val(s)
            }
            NF_S_RAW => {
                let raw = self.get(&a0, A_RAW);
                let parts = self.array_like_to_vec(&raw);
                let mut s = String::new();
                let mut i: usize = 0;
                while i < parts.len() {
                    let p = self.to_string(&parts[i]);
                    s.push_str(p.as_str());
                    if i + 1 < parts.len() && i + 1 < args.len() {
                        let v = self.to_string(&args[i + 1]);
                        s.push_str(v.as_str());
                    }
                    i += 1;
                }
                string_val(s)
            }
            NF_SP_TOSTRING => match &this {
                Val::Str(_) => this,
                Val::Obj(o) if self.objs[*o as usize].class == C_STRING => self.objs[*o as usize].prim.clone(),
                _ => {
                    self.throw_type("String.prototype.toString requires that 'this' be a String");
                    Val::Undef
                }
            },
            NF_SP_CHARAT | NF_SP_CHARCODEAT | NF_SP_CODEPOINTAT | NF_SP_AT => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let mut i = to_integer(self.to_number(&a0));
                if id == NF_SP_AT && i < 0.0 {
                    i += jsstr::len(s.as_str()) as double;
                }
                let c = if i < 0.0 || i > 4294967295.0 { -1 } else { jsstr::at(s.as_str(), i as int) };
                match id {
                    NF_SP_CHARAT => {
                        if c < 0 {
                            str_val("")
                        } else {
                            string_val(jsstr::from_unit(c))
                        }
                    }
                    NF_SP_AT => {
                        if c < 0 {
                            Val::Undef
                        } else {
                            string_val(jsstr::from_unit(c))
                        }
                    }
                    NF_SP_CHARCODEAT => Val::Num(if c < 0 { nan() } else { c as double }),
                    _ => {
                        if c < 0 {
                            return Val::Undef;
                        }
                        if c >= 0xd800 && c <= 0xdbff {
                            let d = jsstr::at(s.as_str(), (i as int) + 1);
                            if d >= 0xdc00 && d <= 0xdfff {
                                return Val::Num((0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00)) as double);
                            }
                        }
                        Val::Num(c as double)
                    }
                }
            }
            NF_SP_INDEXOF | NF_SP_LASTINDEXOF | NF_SP_INCLUDES | NF_SP_STARTSWITH | NF_SP_ENDSWITH => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                if (id == NF_SP_INCLUDES || id == NF_SP_STARTSWITH || id == NF_SP_ENDSWITH) && self.class_of(&a0) == C_REGEXP {
                    self.throw_type("First argument must not be a regular expression");
                    return Val::Undef;
                }
                let p = self.to_str(&a0);
                let len = jsstr::len(s.as_str());
                match id {
                    NF_SP_INDEXOF => {
                        let from = self.rel_index_pos(&a1, len, 0);
                        Val::Num(jsstr::index_of(s.as_str(), p.as_str(), from) as double)
                    }
                    NF_SP_LASTINDEXOF => {
                        let n = self.to_number(&a1);
                        let from = if is_nan(n) { len } else { to_integer(n) as int };
                        Val::Num(jsstr::last_index_of(s.as_str(), p.as_str(), from) as double)
                    }
                    NF_SP_INCLUDES => {
                        let from = self.rel_index_pos(&a1, len, 0);
                        Val::Bool(jsstr::index_of(s.as_str(), p.as_str(), from) >= 0)
                    }
                    NF_SP_STARTSWITH => {
                        let from = self.rel_index_pos(&a1, len, 0);
                        let pl = jsstr::len(p.as_str());
                        Val::Bool(jsstr::slice(s.as_str(), from, from + pl).as_str() == p.as_str())
                    }
                    _ => {
                        let end = self.rel_index_pos(&a1, len, len);
                        let pl = jsstr::len(p.as_str());
                        if end - pl < 0 {
                            return Val::Bool(false);
                        }
                        Val::Bool(jsstr::slice(s.as_str(), end - pl, end).as_str() == p.as_str())
                    }
                }
            }
            NF_SP_SLICE => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let len = jsstr::len(s.as_str());
                let a = self.rel_index(&a0, len, 0);
                let b = self.rel_index(&a1, len, len);
                string_val(jsstr::slice(s.as_str(), a, b))
            }
            NF_SP_SUBSTRING => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let len = jsstr::len(s.as_str());
                let a = self.rel_index_pos(&a0, len, 0);
                let b = self.rel_index_pos(&a1, len, len);
                if a < b {
                    string_val(jsstr::slice(s.as_str(), a, b))
                } else {
                    string_val(jsstr::slice(s.as_str(), b, a))
                }
            }
            NF_SP_SUBSTR => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let len = jsstr::len(s.as_str());
                let a = self.rel_index(&a0, len, 0);
                let n = if matches!(a1, Val::Undef) { len - a } else { to_integer(self.to_number(&a1)) as int };
                if n <= 0 {
                    return str_val("");
                }
                string_val(jsstr::slice(s.as_str(), a, a + n))
            }
            NF_SP_UPPER => {
                let s = self.this_str(&this);
                string_val(jsstr::to_upper(s.as_str()))
            }
            NF_SP_LOWER => {
                let s = self.this_str(&this);
                string_val(jsstr::to_lower(s.as_str()))
            }
            NF_SP_TRIM => {
                let s = self.this_str(&this);
                string_val(js_trim(s.as_str()))
            }
            NF_SP_TRIMSTART => {
                let s = self.this_str(&this);
                string_val(js_trim_start(s.as_str()))
            }
            NF_SP_TRIMEND => {
                let s = self.this_str(&this);
                string_val(js_trim_end(s.as_str()))
            }
            NF_SP_NORMALIZE => {
                let s = self.this_str(&this);
                Val::Str(s)
            }
            NF_SP_SPLIT => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                self.string_split(&s, &a0, &a1)
            }
            NF_SP_REPLACE | NF_SP_REPLACEALL => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                self.string_replace(&s, &a0, &a1, id == NF_SP_REPLACEALL)
            }
            NF_SP_MATCH | NF_SP_MATCHALL | NF_SP_SEARCH => {
                let s = self.this_str(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let re = if self.class_of(&a0) == C_REGEXP {
                    a0.clone()
                } else {
                    let flags = if id == NF_SP_MATCHALL { str_val("g") } else { Val::Undef };
                    let src = if matches!(a0, Val::Undef) { Val::Undef } else { Val::Str(self.to_str(&a0)) };
                    self.new_regexp(&src, &flags)
                };
                if self.throwing {
                    return Val::Undef;
                }
                let ro = obj_of(&re);
                let idx = self.objs[ro as usize].func;
                let global = self.regexes[idx as usize].global;
                if id == NF_SP_SEARCH {
                    let units = jsstr::units(s.as_str());
                    let caps = self.regexes[idx as usize].exec(&units, 0);
                    return Val::Num(if caps.is_empty() { -1.0 } else { caps[0] as double });
                }
                if id == NF_SP_MATCHALL {
                    if !global {
                        self.throw_type("String.prototype.matchAll called with a non-global RegExp argument");
                        return Val::Undef;
                    }
                    let mut out: Vec<Val> = Vec::new();
                    let copy = self.new_regexp(&self.objs[ro as usize].prim.clone(), &str_val("g"));
                    let co = obj_of(&copy);
                    loop {
                        let m = self.regexp_exec(co, &s);
                        if matches!(m, Val::Null) {
                            break;
                        }
                        let m0 = self.get_index(&m, 0);
                        if let Val::Str(ms) = &m0 {
                            if ms.is_empty() {
                                let li = self.get_obj(co, A_LASTINDEX, &copy);
                                let n = self.to_number(&li);
                                self.set_obj(co, A_LASTINDEX, Val::Num(n + 1.0));
                            }
                        }
                        out.push(m);
                    }
                    let arr = self.new_array(out);
                    let ip = self.iter_proto;
                    let it = self.alloc(C_ITER, ip);
                    self.objs[it as usize].env = arr;
                    self.objs[it as usize].func = 0;
                    return Val::Obj(it);
                }
                if !global {
                    return self.regexp_exec(ro, &s);
                }
                let units = jsstr::units(s.as_str());
                let mut out: Vec<Val> = Vec::new();
                let mut start: int = 0;
                while start <= units.len() as int {
                    let caps = self.regexes[idx as usize].exec(&units, start);
                    if caps.is_empty() {
                        break;
                    }
                    out.push(string_val(jsstr::from_units(&units, caps[0], caps[1])));
                    start = if caps[1] == caps[0] { caps[1] + 1 } else { caps[1] };
                }
                self.set_obj(ro, A_LASTINDEX, Val::Num(0.0));
                if out.is_empty() {
                    return Val::Null;
                }
                let a = self.new_array(out);
                Val::Obj(a)
            }
            NF_SP_REPEAT => {
                let s = self.this_str(&this);
                let n = to_integer(self.to_number(&a0));
                if n < 0.0 || !is_finite(n) {
                    self.throw_range("Invalid count value");
                    return Val::Undef;
                }
                if (s.as_bytes().len() as double) * n > 536870888.0 {
                    self.throw_range("Invalid string length");
                    return Val::Undef;
                }
                string_val(s.repeat(n as usize))
            }
            NF_SP_PADSTART | NF_SP_PADEND => {
                let s = self.this_str(&this);
                let target = to_integer(self.to_number(&a0)) as int;
                let fill = if matches!(a1, Val::Undef) { String::from(" ") } else { self.to_string(&a1) };
                let len = jsstr::len(s.as_str());
                if target <= len || fill.is_empty() {
                    return Val::Str(s);
                }
                let need = target - len;
                let fu = jsstr::units(fill.as_str());
                let mut pad: Vec<int> = Vec::new();
                let mut i: int = 0;
                while i < need {
                    pad.push(fu[(i as usize) % fu.len()]);
                    i += 1;
                }
                let ps = jsstr::from_units(&pad, 0, need);
                if id == NF_SP_PADSTART {
                    string_val(format!("{}{}", ps, s))
                } else {
                    string_val(format!("{}{}", s, ps))
                }
            }
            NF_SP_CONCAT => {
                let s = self.this_str(&this);
                let mut out = s.as_ref().clone();
                for a in args.iter() {
                    let x = self.to_str(a);
                    out.push_str(x.as_str());
                }
                string_val(out)
            }
            NF_SP_LOCALECOMPARE => {
                let s = self.this_str(&this);
                let t = self.to_str(&a0);
                Val::Num(jsstr::compare(s.as_str(), t.as_str()) as double)
            }
            NF_SP_ITERATOR => {
                let s = self.this_str(&this);
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
                Val::Obj(it)
            }
            // ---- Number / Boolean
            NF_N_ISINTEGER | NF_N_ISSAFEINTEGER | NF_N_ISFINITE | NF_N_ISNAN => {
                let n = match a0 {
                    Val::Num(x) => x,
                    _ => return Val::Bool(false),
                };
                Val::Bool(match id {
                    NF_N_ISINTEGER => is_finite(n) && n == to_integer(n),
                    NF_N_ISSAFEINTEGER => is_finite(n) && n == to_integer(n) && n.abs() <= 9007199254740991.0,
                    NF_N_ISFINITE => is_finite(n),
                    _ => is_nan(n),
                })
            }
            NF_NP_VALUEOF => {
                let n = self.this_num(&this);
                Val::Num(n)
            }
            NF_NP_TOSTRING => {
                let n = self.this_num(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let radix = if matches!(a0, Val::Undef) { 10 } else { to_integer(self.to_number(&a0)) as int };
                if radix < 2 || radix > 36 {
                    self.throw_range("toString() radix must be between 2 and 36");
                    return Val::Undef;
                }
                string_val(radix_string(n, radix))
            }
            NF_NP_TOFIXED => {
                let n = self.this_num(&this);
                let d = to_integer(self.to_number(&a0));
                if d < 0.0 || d > 100.0 {
                    self.throw_range("toFixed() digits argument must be between 0 and 100");
                    return Val::Undef;
                }
                string_val(to_fixed(n, d as int))
            }
            NF_NP_TOPRECISION => {
                let n = self.this_num(&this);
                if matches!(a0, Val::Undef) {
                    return string_val(number_to_string(n));
                }
                let p = to_integer(self.to_number(&a0)) as int;
                if !is_finite(n) {
                    return string_val(number_to_string(n));
                }
                if p < 1 || p > 100 {
                    self.throw_range("toPrecision() argument must be between 1 and 100");
                    return Val::Undef;
                }
                string_val(to_precision(n, p))
            }
            NF_NP_TOEXPONENTIAL => {
                let n = self.this_num(&this);
                if !is_finite(n) {
                    return string_val(number_to_string(n));
                }
                let d = if matches!(a0, Val::Undef) { -1 } else { to_integer(self.to_number(&a0)) as int };
                string_val(to_exponential(n, d))
            }
            NF_BP_TOSTRING | NF_BP_VALUEOF => {
                let b = match &this {
                    Val::Bool(b) => *b,
                    Val::Obj(o) if self.objs[*o as usize].class == C_BOOLEAN => truthy(&self.objs[*o as usize].prim.clone()),
                    _ => {
                        self.throw_type("Boolean.prototype method called on incompatible receiver");
                        return Val::Undef;
                    }
                };
                if id == NF_BP_VALUEOF {
                    Val::Bool(b)
                } else {
                    str_val(if b { "true" } else { "false" })
                }
            }
            // ---- JSON
            NF_JSON_STRINGIFY => {
                let mut allow: Vec<String> = Vec::new();
                if self.class_of(&a1) == C_ARRAY {
                    let items = self.objs[obj_of(&a1) as usize].elems.clone();
                    for it in items {
                        let s = self.to_string(&it);
                        allow.push(s);
                    }
                }
                let sp = arg(&args, 2);
                let gap = match &sp {
                    Val::Num(n) => {
                        let k = if *n > 10.0 { 10 } else { *n as int };
                        " ".repeat(if k > 0 { k as usize } else { 0 })
                    }
                    Val::Str(s) => {
                        let t = s.as_ref().clone();
                        jsstr::slice(t.as_str(), 0, 10)
                    }
                    _ => String::new(),
                };
                let holder = self.new_object();
                self.objs[holder as usize].add(self.atoms[""], a0.clone(), 0);
                let mut out = String::new();
                let mut stack: Vec<int> = Vec::new();
                let ok = self.json_str(&Val::Obj(holder), &str_val(""), a0, &a1, &allow, gap.as_str(), "", &mut stack, &mut out);
                if self.throwing || !ok {
                    return Val::Undef;
                }
                string_val(out)
            }
            NF_JSON_PARSE => {
                let s = self.to_string(&a0);
                let cs = s.chars().collect::<Vec<char>>();
                let mut pos: usize = 0;
                let v = self.json_parse_value(&cs, &mut pos);
                if self.throwing {
                    return Val::Undef;
                }
                while pos < cs.len() && (cs[pos] == ' ' || cs[pos] == '\t' || cs[pos] == '\n' || cs[pos] == '\r') {
                    pos += 1;
                }
                if pos < cs.len() {
                    self.throw_syntax("Unexpected non-whitespace character after JSON");
                    return Val::Undef;
                }
                if self.is_callable(&a1) {
                    let holder = self.new_object();
                    self.objs[holder as usize].add(self.atoms[""], v, 0);
                    return self.json_revive(&Val::Obj(holder), &str_val(""), &a1);
                }
                v
            }
            // ---- RegExp
            NF_REGEXP => {
                if self.class_of(&a0) == C_REGEXP {
                    let src = self.objs[obj_of(&a0) as usize].prim.clone();
                    let fl = if matches!(a1, Val::Undef) { string_val(self.regexp_flags(obj_of(&a0))) } else { a1 };
                    if !construct && matches!(arg(&args, 1), Val::Undef) {
                        return a0;
                    }
                    return self.new_regexp(&src, &fl);
                }
                self.new_regexp(&a0, &a1)
            }
            NF_RP_EXEC | NF_RP_TEST => {
                let ro = obj_of(&this);
                if ro < 0 || self.objs[ro as usize].class != C_REGEXP {
                    self.throw_type("RegExp method called on incompatible receiver");
                    return Val::Undef;
                }
                let s = self.to_str(&a0);
                let m = self.regexp_exec(ro, &s);
                if id == NF_RP_TEST {
                    return Val::Bool(!matches!(m, Val::Null));
                }
                m
            }
            NF_RP_TOSTRING => {
                let src = self.get(&this, self.atoms["source"]);
                let ss = self.to_string(&src);
                let fl = self.get(&this, self.atoms["flags"]);
                let fs = self.to_string(&fl);
                string_val(format!("/{}/{}", ss, fs))
            }
            NF_RP_FLAGS => {
                let ro = obj_of(&this);
                if ro < 0 || self.objs[ro as usize].class != C_REGEXP {
                    return str_val("");
                }
                string_val(self.regexp_flags(ro))
            }
            // ---- Date
            NF_DATE => {
                if !construct {
                    let t = now_ms();
                    return string_val(date_string(t));
                }
                let t = if args.is_empty() {
                    now_ms().floor()
                } else if args.len() == 1 {
                    match &a0 {
                        Val::Str(s) => Vm::parse_date(s.as_str()),
                        Val::Obj(o) if self.objs[*o as usize].class == C_DATE => match self.objs[*o as usize].prim {
                            Val::Num(n) => n,
                            _ => nan(),
                        },
                        _ => {
                            let p = self.to_primitive(&a0, "default");
                            if let Val::Str(s) = &p {
                                Vm::parse_date(s.as_str())
                            } else {
                                let n = self.to_number(&p);
                                if is_finite(n) && n.abs() <= 8.64e15 {
                                    to_integer(n) + 0.0
                                } else {
                                    nan()
                                }
                            }
                        }
                    }
                } else {
                    let mut f: Vec<double> = vec![0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
                    let mut i: usize = 0;
                    while i < 7 && i < args.len() {
                        f[i] = self.to_number(&args[i]);
                        i += 1;
                    }
                    if f[0] >= 0.0 && f[0] <= 99.0 && f[0] == to_integer(f[0]) {
                        f[0] += 1900.0;
                    }
                    Vm::make_time(&f)
                };
                let proto = self.proto_from(&new_target, self.date_proto);
                let d = self.alloc(C_DATE, proto);
                self.objs[d as usize].prim = Val::Num(t);
                Val::Obj(d)
            }
            NF_DATE_NOW => Val::Num(now_ms().floor()),
            NF_DATE_UTC => {
                let mut f: Vec<double> = vec![0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
                let mut i: usize = 0;
                while i < 7 && i < args.len() {
                    f[i] = self.to_number(&args[i]);
                    i += 1;
                }
                if f[0] >= 0.0 && f[0] <= 99.0 {
                    f[0] += 1900.0;
                }
                Val::Num(Vm::make_time(&f))
            }
            NF_DATE_PARSE => {
                let s = self.to_string(&a0);
                Val::Num(Vm::parse_date(s.as_str()))
            }
            NF_DP_VALUEOF => {
                let t = self.date_value(&this);
                Val::Num(t)
            }
            NF_DP_TOISO | NF_DP_TOJSON => {
                let t = self.date_value(&this);
                if self.throwing {
                    return Val::Undef;
                }
                if is_nan(t) {
                    if id == NF_DP_TOJSON {
                        return Val::Null;
                    }
                    self.throw_range("Invalid time value");
                    return Val::Undef;
                }
                string_val(Vm::iso_string(t))
            }
            NF_DP_TOSTRING => {
                let t = self.date_value(&this);
                if is_nan(t) {
                    return str_val("Invalid Date");
                }
                string_val(date_string(t))
            }
            // ---- Map / Set
            NF_MAP | NF_SET | NF_WEAKMAP | NF_WEAKSET => {
                if !construct {
                    self.throw_type("Constructor requires 'new'");
                    return Val::Undef;
                }
                let is_map = id == NF_MAP || id == NF_WEAKMAP;
                let dflt = if is_map { self.map_proto } else { self.set_proto };
                let proto = self.proto_from(&new_target, dflt);
                let m = self.alloc(if is_map { C_MAP } else { C_SET }, proto);
                if id == NF_WEAKMAP || id == NF_WEAKSET {
                    // weak: keys must be objects
                    self.objs[m as usize].func = 1;
                }
                if !matches!(a0, Val::Undef) && !matches!(a0, Val::Null) {
                    self.temp_roots.push(Val::Obj(m));
                    let items = self.iterable_to_vec(&a0);
                    self.temp_roots.pop();
                    if self.throwing {
                        return Val::Undef;
                    }
                    for it in items {
                        if is_map {
                            if !is_obj(&it) {
                                self.throw_type("Iterator value is not an entry object");
                                return Val::Undef;
                            }
                            let k = self.get_index(&it, 0);
                            let v = self.get_index(&it, 1);
                            if id == NF_WEAKMAP && !is_obj(&k) {
                                self.throw_type("Invalid value used as weak map key");
                                return Val::Undef;
                            }
                            self.map_set(m, k, v);
                        } else {
                            if id == NF_WEAKSET && !is_obj(&it) {
                                self.throw_type("Invalid value used in weak set");
                                return Val::Undef;
                            }
                            self.map_set(m, it.clone(), it);
                        }
                    }
                }
                Val::Obj(m)
            }
            NF_MP_GET | NF_MP_SET | NF_MP_HAS | NF_MP_DELETE | NF_MP_CLEAR | NF_MP_SIZE | NF_MP_FOREACH | NF_MP_KEYS | NF_MP_VALUES | NF_MP_ENTRIES | NF_SETP_ADD => {
                let o = obj_of(&this);
                if o < 0 || (self.objs[o as usize].class != C_MAP && self.objs[o as usize].class != C_SET) {
                    self.throw_type("Map/Set method called on incompatible receiver");
                    return Val::Undef;
                }
                match id {
                    NF_MP_GET => {
                        let i = self.map_find(o, &a0);
                        if i < 0 {
                            Val::Undef
                        } else {
                            self.objs[o as usize].elems2[i as usize].clone()
                        }
                    }
                    NF_MP_SET => {
                        if self.objs[o as usize].func == 1 && !is_obj(&a0) {
                            self.throw_type("Invalid value used as weak map key");
                            return Val::Undef;
                        }
                        self.map_set(o, a0, a1);
                        this
                    }
                    NF_SETP_ADD => {
                        if self.objs[o as usize].func == 1 && !is_obj(&a0) {
                            self.throw_type("Invalid value used in weak set");
                            return Val::Undef;
                        }
                        self.map_set(o, a0.clone(), a0);
                        this
                    }
                    NF_MP_HAS => Val::Bool(self.map_find(o, &a0) >= 0),
                    NF_MP_DELETE => Val::Bool(self.map_delete(o, &a0)),
                    NF_MP_CLEAR => {
                        self.objs[o as usize].elems = Vec::new();
                        self.objs[o as usize].elems2 = Vec::new();
                        self.objs[o as usize].attrs = Vec::new();
                        self.objs[o as usize].index = HashMap::new();
                        self.objs[o as usize].pos = 0;
                        Val::Undef
                    }
                    NF_MP_SIZE => Val::Num(self.objs[o as usize].pos as double),
                    NF_MP_FOREACH => {
                        if !self.callback(&a0, "callback") {
                            return Val::Undef;
                        }
                        let is_set = self.objs[o as usize].class == C_SET;
                        let mut i: usize = 0;
                        while i < self.objs[o as usize].elems.len() {
                            if self.objs[o as usize].attrs[i] == 0 {
                                let k = self.objs[o as usize].elems[i].clone();
                                let v = if is_set { k.clone() } else { self.objs[o as usize].elems2[i].clone() };
                                self.call_value(a0.clone(), a1.clone(), vec![v, k, this.clone()]);
                                if self.throwing {
                                    return Val::Undef;
                                }
                            }
                            i += 1;
                        }
                        Val::Undef
                    }
                    NF_MP_KEYS => self.collection_iter(o, 0),
                    NF_MP_VALUES => self.collection_iter(o, 1),
                    _ => self.collection_iter(o, 2),
                }
            }
            // ---- Promise
            NF_PROMISE => {
                if !construct {
                    self.throw_type("Promise constructor cannot be invoked without 'new'");
                    return Val::Undef;
                }
                if !self.callback(&a0, "Promise resolver") {
                    return Val::Undef;
                }
                let p = self.new_promise();
                let (res, rej) = self.resolving_functions(p);
                self.temp_roots.push(Val::Obj(p));
                self.call_value(a0, Val::Undef, vec![Val::Obj(res), Val::Obj(rej)]);
                self.temp_roots.pop();
                if self.throwing {
                    self.throwing = false;
                    let e = self.exc.clone();
                    self.exc = Val::Undef;
                    self.settle(p, 2, e);
                }
                Val::Obj(p)
            }
            NF_PR_RESOLVE_FN | NF_PR_REJECT_FN => {
                let p = self.objs[fobj as usize].env;
                let cell = self.objs[fobj as usize].home;
                if cell >= 0 {
                    if self.objs[cell as usize].pos != 0 {
                        return Val::Undef;
                    }
                    self.objs[cell as usize].pos = 1;
                }
                self.settle(p, if id == NF_PR_RESOLVE_FN { 1 } else { 2 }, a0);
                Val::Undef
            }
            NF_PR_RESOLVE | NF_PR_REJECT => {
                if id == NF_PR_RESOLVE && self.class_of(&a0) == C_PROMISE {
                    return a0;
                }
                let p = self.new_promise();
                self.settle(p, if id == NF_PR_RESOLVE { 1 } else { 2 }, a0);
                Val::Obj(p)
            }
            NF_PR_THEN | NF_PR_CATCH | NF_PR_FINALLY => {
                let p = obj_of(&this);
                if p < 0 || self.objs[p as usize].class != C_PROMISE {
                    self.throw_type("Promise.prototype.then called on incompatible receiver");
                    return Val::Undef;
                }
                match id {
                    NF_PR_THEN => self.promise_then(p, a0, a1),
                    NF_PR_CATCH => self.promise_then(p, Val::Undef, a0),
                    _ => self.promise_then(p, a0.clone(), a0),
                }
            }
            NF_PR_ALL => {
                // settles when every input promise has: a simple form
                let items = self.iterable_to_vec(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let p = self.new_promise();
                let mut values: Vec<Val> = Vec::new();
                let mut all_done = true;
                for it in items.iter() {
                    if self.class_of(it) == C_PROMISE {
                        let o = obj_of(it);
                        let st = self.objs[o as usize].pos;
                        if st == 1 {
                            values.push(self.objs[o as usize].prim.clone());
                        } else if st == 2 {
                            let e = self.objs[o as usize].prim.clone();
                            self.settle(p, 2, e);
                            return Val::Obj(p);
                        } else {
                            all_done = false;
                        }
                    } else {
                        values.push(it.clone());
                    }
                }
                if all_done {
                    let a = self.new_array(values);
                    self.settle(p, 1, Val::Obj(a));
                }
                Val::Obj(p)
            }
            _ => {
                self.throw_type(format!("built-in {} is not implemented", id).as_str());
                Val::Undef
            }
        }
    }

    fn rel_index_pos(&mut self, v: &Val, len: int, dflt: int) -> int {
        if matches!(v, Val::Undef) {
            return dflt;
        }
        let n = to_integer(self.to_number(v));
        if n < 0.0 {
            0
        } else if n > len as double {
            len
        } else {
            n as int
        }
    }
}

fn pow10(n: i32) -> double {
    let ten: double = 10.0;
    ten.powf(n as double)
}

pub fn date_string(t: double) -> String {
    let days = vec!["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let months = vec!["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let f = Vm::time_fields(t);
    format!(
        "{} {} {:02} {} {:02}:{:02}:{:02} GMT+0000 (Coordinated Universal Time)",
        days[f[3] as usize],
        months[f[1] as usize],
        f[2] as int,
        f[0] as int,
        f[4] as int,
        f[5] as int,
        f[6] as int
    )
}

/// Number.prototype.toPrecision
pub fn to_precision(x: double, p: int) -> String {
    if x == 0.0 {
        if p == 1 {
            return String::from("0");
        }
        return format!("0.{}", "0".repeat((p - 1) as usize));
    }
    let neg = x < 0.0;
    let v = if neg { -x } else { x };
    let mut e = v.log10().floor() as int;
    let mut scale = pow10((p - 1 - e) as i32);
    let mut n = (v * scale).round();
    if n >= pow10(p as i32) {
        e += 1;
        scale = pow10((p - 1 - e) as i32);
        n = (v * scale).round();
    }
    let digits = format!("{}", n as int);
    let body: String;
    if e < -6 || e >= p {
        let mut s = String::new();
        s.push_str(&digits[0..1]);
        if p > 1 {
            s.push('.');
            s.push_str(&digits[1..]);
        }
        body = format!("{}e{}{}", s, if e >= 0 { "+" } else { "-" }, e.abs());
    } else if e >= p - 1 {
        body = digits;
    } else if e >= 0 {
        body = format!("{}.{}", &digits[0..((e + 1) as usize)], &digits[((e + 1) as usize)..]);
    } else {
        body = format!("0.{}{}", "0".repeat((-e - 1) as usize), digits);
    }
    if neg {
        format!("-{}", body)
    } else {
        body
    }
}

/// Number.prototype.toExponential; `d` -1 for as many digits as needed
pub fn to_exponential(x: double, d: int) -> String {
    let neg = x < 0.0;
    let v = if neg { -x } else { x };
    let s: String;
    if d < 0 {
        let t = number_to_string(v);
        // shortest digits
        let mut digits = String::new();
        let mut e: int = 0;
        let mut seen_point = false;
        let mut lead = true;
        let mut before: int = 0;
        let mut in_exp = false;
        let mut exp_text = String::new();
        for c in t.chars() {
            if c == 'e' {
                in_exp = true;
                continue;
            }
            if in_exp {
                exp_text.push(c);
                continue;
            }
            if c == '.' {
                seen_point = true;
                continue;
            }
            if lead && c == '0' {
                if seen_point {
                    before -= 1;
                }
                continue;
            }
            lead = false;
            digits.push(c);
            if !seen_point {
                before += 1;
            }
        }
        if in_exp {
            e = exp_text.parse::<i64>().unwrap_or(0);
        }
        let exp = if v == 0.0 { 0 } else { before - 1 + e };
        let mut dg = digits.clone();
        while dg.ends_with("0") {
            dg = String::from(&dg[0..(dg.as_bytes().len() - 1)]);
        }
        let dg2 = if dg.is_empty() { String::from("0") } else { dg };
        let mant = if dg2.as_bytes().len() > 1 { format!("{}.{}", &dg2[0..1], &dg2[1..]) } else { dg2 };
        s = format!("{}e{}{}", mant, if exp >= 0 { "+" } else { "-" }, exp.abs());
    } else {
        let mut e = if v == 0.0 { 0 } else { v.log10().floor() as int };
        let mut n = (v / pow10((e - d) as i32)).round();
        if n >= pow10((d + 1) as i32) {
            e += 1;
            n = (v / pow10((e - d) as i32)).round();
        }
        let digits = format!("{}", n as int);
        let mant = if d > 0 { format!("{}.{}", &digits[0..1], &digits[1..]) } else { digits };
        s = format!("{}e{}{}", mant, if e >= 0 { "+" } else { "-" }, e.abs());
    }
    if neg {
        format!("-{}", s)
    } else {
        s
    }
}

