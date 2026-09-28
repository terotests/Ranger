// SPDX-License-Identifier: AGPL-3.0-or-later
//! Intl: the natives under it. The objects themselves (Collator,
//! NumberFormat, DateTimeFormat, PluralRules, ListFormat and the
//! toLocaleString methods that use them) are JavaScript in
//! `prelude::INTL`, ported from ComponentEngine's D-INTL; they reach the
//! collation (unicode.rs) and the CLDR tables (unidata.rs) through the
//! helper object `__cerIntl`, which the prelude takes out of the global
//! object.

use ranger::prelude::*;

use crate::builtins::*;
use crate::unicode;
use crate::unidata::*;
use crate::value::*;
use crate::vm::*;

pub const NF_INTL_FIRST: int = 420;
/// (a, b, tag, levels): collation of two strings
pub const NF_INTL_COLLATE: int = 420;
/// (k): the generated table k as an array
pub const NF_INTL_TABLE: int = 421;
pub const NF_INTL_LAST: int = 421;

impl Vm {
    pub fn setup_intl(&mut self) {
        let op = self.object_proto;
        let h = self.alloc(C_OBJECT, op);
        let a = self.intern("__cerIntl");
        let g = self.global;
        self.objs[g as usize].add(a, Val::Obj(h), P_HIDDEN);
        self.method(h, "collate", NF_INTL_COLLATE, 4);
        self.method(h, "table", NF_INTL_TABLE, 1);
    }

    /// The first tag of a `locales` argument (a tag or a list of them), ""
    /// when there is none.
    pub fn first_locale_tag(&mut self, v: &Val) -> String {
        if matches!(v, Val::Undef) {
            return String::new();
        }
        if self.class_of(v) == C_ARRAY {
            let items = self.array_like_to_vec(v);
            if items.is_empty() {
                return String::new();
            }
            let s = self.to_str(&items[0]);
            return s.as_ref().clone();
        }
        let s = self.to_str(v);
        s.as_ref().clone()
    }

    fn int_array(&mut self, v: Vec<int>) -> Val {
        let mut items: Vec<Val> = Vec::new();
        let mut i: usize = 0;
        while i < v.len() {
            items.push(Val::Num(v[i] as double));
            i += 1;
        }
        Val::Obj(self.new_array(items))
    }

    fn str_array(&mut self, v: Vec<String>) -> Val {
        let mut items: Vec<Val> = Vec::new();
        let mut i: usize = 0;
        while i < v.len() {
            items.push(string_val(v[i].clone()));
            i += 1;
        }
        Val::Obj(self.new_array(items))
    }

    pub fn call_intl(&mut self, id: int, args: &Vec<Val>) -> Val {
        let a0 = arg(args, 0);
        if id == NF_INTL_COLLATE {
            let a = self.to_str(&a0);
            let b = self.to_str(&arg(args, 1));
            let tag = self.to_str(&arg(args, 2));
            let levels = self.to_number(&arg(args, 3)) as int;
            if self.throwing {
                return Val::Undef;
            }
            let r = self.uni.collate(a.as_str(), b.as_str(), tag.as_str(), levels);
            return Val::Num(r as double);
        }
        if id == NF_INTL_TABLE {
            let k = self.to_number(&a0) as int;
            return match k {
                0 => self.str_array(unicode::strs(LOC_TAGS)),
                1 => self.str_array(unicode::strs(LOC_NUMSTR)),
                2 => self.int_array(unicode::ints(LOC_NUMINT)),
                3 => self.str_array(unicode::strs(LOC_NAMES)),
                4 => self.int_array(unicode::ints(LOC_PATINT)),
                5 => self.str_array(unicode::strs(LOC_PATSTR)),
                6 => self.str_array(unicode::strs(LOC_CURSTR)),
                7 => self.int_array(unicode::ints(LOC_CURINT)),
                8 => self.str_array(unicode::strs(PLURAL_TAGS)),
                9 => self.str_array(unicode::strs(PLURAL_KEYS)),
                10 => self.int_array(unicode::ints(PLURAL_ENTRIES)),
                11 => self.int_array(unicode::ints(PLURAL_PAIRS)),
                12 => self.str_array(unicode::strs(LIST_SEPS)),
                13 => self.int_array(vec![LOC_CURCOUNT]),
                _ => Val::Undef,
            };
        }
        Val::Undef
    }
}
