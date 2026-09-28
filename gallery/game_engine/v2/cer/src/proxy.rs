// SPDX-License-Identifier: AGPL-3.0-or-later
//! Proxy: an object (C_PROXY) whose target is in `env` and handler in
//! `home` (both -1 once revoked). The VM's property operations, calls and
//! constructs come here first for one, and each asks the handler's trap
//! or, without one, does the operation on the target.

use ranger::prelude::*;

use crate::value::*;
use crate::vm::*;

impl Vm {
    pub fn is_proxy(&self, o: int) -> bool {
        o >= 0 && self.objs[o as usize].class == C_PROXY
    }

    /// The handler's trap `name`, or undefined; -2 target when revoked
    /// (a TypeError is thrown).
    fn proxy_trap(&mut self, p: int, name: &str) -> Val {
        let h = self.objs[p as usize].home;
        if h < 0 {
            self.throw_type(format!("Cannot perform '{}' on a proxy that has been revoked", name).as_str());
            return Val::Undef;
        }
        let a = self.intern(name);
        let t = self.get_obj(h, a, &Val::Obj(h));
        if self.throwing {
            return Val::Undef;
        }
        if matches!(t, Val::Undef) || matches!(t, Val::Null) {
            return Val::Undef;
        }
        if !self.is_callable(&t) {
            self.throw_type(format!("'{}' on proxy: trap is not a function", name).as_str());
            return Val::Undef;
        }
        t
    }

    fn proxy_parts(&self, p: int) -> (int, int) {
        (self.objs[p as usize].env, self.objs[p as usize].home)
    }

    pub fn proxy_get(&mut self, p: int, key: Val, receiver: Val) -> Val {
        let trap = self.proxy_trap(p, "get");
        if self.throwing {
            return Val::Undef;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            let (i, a) = self.to_key(&key);
            if i >= 0 {
                return self.get_index(&Val::Obj(t), i);
            }
            return self.get_obj(t, a, &receiver);
        }
        self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key, receiver])
    }

    pub fn proxy_set(&mut self, p: int, key: Val, v: Val, receiver: Val) -> bool {
        let trap = self.proxy_trap(p, "set");
        if self.throwing {
            return false;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            self.set_elem(&Val::Obj(t), &key, v);
            return !self.throwing;
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key.clone(), v, receiver]);
        let ok = truthy(&r);
        if !ok && self.strict_now() && !self.throwing {
            let ks = self.to_string(&key);
            self.throw_type(format!("'set' on proxy: trap returned falsish for property '{}'", ks).as_str());
        }
        ok
    }

    pub fn proxy_has(&mut self, p: int, key: Val) -> bool {
        let trap = self.proxy_trap(p, "has");
        if self.throwing {
            return false;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.has_property(t, &key);
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key]);
        truthy(&r)
    }

    pub fn proxy_delete(&mut self, p: int, key: Val) -> bool {
        let trap = self.proxy_trap(p, "deleteProperty");
        if self.throwing {
            return false;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.delete(t, &key);
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key]);
        truthy(&r)
    }

    /// The descriptor object of an own property, or undefined.
    pub fn proxy_own_desc(&mut self, p: int, key: Val) -> Val {
        let trap = self.proxy_trap(p, "getOwnPropertyDescriptor");
        if self.throwing {
            return Val::Undef;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.from_descriptor(t, &key);
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key]);
        if !matches!(r, Val::Undef) && !is_obj(&r) && !self.throwing {
            self.throw_type("'getOwnPropertyDescriptor' on proxy: trap returned neither object nor undefined");
            return Val::Undef;
        }
        r
    }

    pub fn proxy_define(&mut self, p: int, key: Val, desc: Val) -> bool {
        let trap = self.proxy_trap(p, "defineProperty");
        if self.throwing {
            return false;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            self.to_descriptor(t, &key, &desc);
            return !self.throwing;
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), key, desc]);
        truthy(&r)
    }

    /// The own keys (strings and symbols) the ownKeys trap answers, checked.
    pub fn proxy_own_keys(&mut self, p: int) -> Vec<Val> {
        let mut out: Vec<Val> = Vec::new();
        let trap = self.proxy_trap(p, "ownKeys");
        if self.throwing {
            return out;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.own_keys(t, true, true);
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t)]);
        if self.throwing {
            return out;
        }
        if !is_obj(&r) {
            self.throw_type("CreateListFromArrayLike called on non-object");
            return out;
        }
        let items = self.array_like_to_vec(&r);
        for k in items {
            let ok = matches!(k, Val::Str(_)) || self.class_of(&k) == C_SYMBOL;
            if !ok {
                let s = self.display(&k);
                self.throw_type(format!("{} is not a valid property name", s).as_str());
                return Vec::new();
            }
            out.push(k);
        }
        // a non-configurable own key of the target cannot be left out
        let tk = self.own_keys(t, true, true);
        for k in tk {
            let d = self.from_descriptor(t, &k);
            if let Val::Obj(dd) = d {
                let a_conf = A_CONFIGURABLE;
                let c = self.get_obj(dd, a_conf, &Val::Obj(dd));
                if !truthy(&c) {
                    let mut found = false;
                    for x in out.iter() {
                        if self.strict_equals(x, &k) {
                            found = true;
                        }
                    }
                    if !found {
                        let s = self.display(&k);
                        self.throw_type(format!("'ownKeys' on proxy: trap result did not include '{}'", s).as_str());
                        return Vec::new();
                    }
                }
            }
        }
        out
    }

    /// Own keys for Object.keys / for-in / JSON: the enumerable ones.
    pub fn proxy_keys(&mut self, p: int, include_hidden: bool, symbols: bool) -> Vec<Val> {
        let all = self.proxy_own_keys(p);
        let mut out: Vec<Val> = Vec::new();
        for k in all {
            let is_sym = self.class_of(&k) == C_SYMBOL;
            if is_sym && !symbols {
                continue;
            }
            if !include_hidden {
                let d = self.proxy_own_desc(p, k.clone());
                if self.throwing {
                    return Vec::new();
                }
                let dd = obj_of(&d);
                if dd < 0 {
                    continue;
                }
                let e = self.get_obj(dd, A_ENUMERABLE, &d);
                if !truthy(&e) {
                    continue;
                }
            }
            out.push(k);
        }
        out
    }

    pub fn proxy_get_proto(&mut self, p: int) -> int {
        let trap = self.proxy_trap(p, "getPrototypeOf");
        if self.throwing {
            return -1;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.proto_of(t);
        }
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t)]);
        match r {
            Val::Obj(o) => o,
            Val::Null => -1,
            _ => {
                if !self.throwing {
                    self.throw_type("'getPrototypeOf' on proxy: trap returned neither object nor null");
                }
                -1
            }
        }
    }

    /// An object's prototype, through a proxy's trap.
    pub fn proto_of(&mut self, o: int) -> int {
        if self.is_proxy(o) {
            return self.proxy_get_proto(o);
        }
        self.objs[o as usize].proto
    }

    pub fn proxy_call(&mut self, p: int, this: Val, args: Vec<Val>) -> Val {
        let trap = self.proxy_trap(p, "apply");
        if self.throwing {
            return Val::Undef;
        }
        let (t, h) = self.proxy_parts(p);
        if matches!(trap, Val::Undef) {
            return self.call_value(Val::Obj(t), this, args);
        }
        let arr = self.new_array(args);
        self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), this, Val::Obj(arr)])
    }

    pub fn proxy_construct(&mut self, p: int, args: Vec<Val>, new_target: Val) -> Val {
        let trap = self.proxy_trap(p, "construct");
        if self.throwing {
            return Val::Undef;
        }
        let (t, h) = self.proxy_parts(p);
        let nt = if let Val::Obj(n) = &new_target {
            if *n == p { Val::Obj(t) } else { new_target.clone() }
        } else {
            Val::Obj(t)
        };
        if matches!(trap, Val::Undef) {
            return self.construct(Val::Obj(t), args, nt);
        }
        let arr = self.new_array(args);
        let r = self.call_value(trap, Val::Obj(h), vec![Val::Obj(t), Val::Obj(arr), new_target]);
        if !is_obj(&r) && !self.throwing {
            self.throw_type("proxy [[Construct]] must return an object");
            return Val::Undef;
        }
        r
    }

    /// `new Proxy(target, handler)`; `revocable` answers {proxy, revoke}.
    pub fn make_proxy(&mut self, target: &Val, handler: &Val) -> Val {
        let t = obj_of(target);
        let h = obj_of(handler);
        if t < 0 || h < 0 {
            self.throw_type("Cannot create proxy with a non-object as target or handler");
            return Val::Undef;
        }
        let p = self.alloc(C_PROXY, -1);
        self.objs[p as usize].env = t;
        self.objs[p as usize].home = h;
        Val::Obj(p)
    }

    pub fn revoke_proxy(&mut self, p: int) {
        if p >= 0 {
            self.objs[p as usize].env = -1;
            self.objs[p as usize].home = -1;
        }
    }
}
