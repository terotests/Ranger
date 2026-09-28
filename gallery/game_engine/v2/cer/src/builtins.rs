// SPDX-License-Identifier: AGPL-3.0-or-later
//! The global object and the built-in constructors and prototypes. A
//! built-in function is an object of class C_NATIVE whose `func` is one of
//! the NF_ ids below; `call_native` runs it.

use ranger::prelude::*;
use std::collections::HashMap;
use std::rc::Rc;

use crate::jsstr;
use crate::num::*;
use crate::regex;
use crate::value::*;
use crate::vm::*;

// Function.prototype
pub const NF_CALL: int = 1;
pub const NF_APPLY: int = 2;
pub const NF_BIND: int = 3;
pub const NF_FN_TOSTRING: int = 4;
pub const NF_FUNCTION: int = 5;
pub const NF_NOOP: int = 6;
// globals
pub const NF_PRINT: int = 10;
pub const NF_PARSEINT: int = 11;
pub const NF_PARSEFLOAT: int = 12;
pub const NF_ISNAN: int = 13;
pub const NF_ISFINITE: int = 14;
pub const NF_STRING: int = 15;
pub const NF_NUMBER: int = 16;
pub const NF_BOOLEAN: int = 17;
pub const NF_OBJECT: int = 18;
pub const NF_ARRAY: int = 19;
pub const NF_ERROR: int = 20; // + kind 0..6
pub const NF_SYMBOL: int = 30;
pub const NF_REGEXP: int = 31;
pub const NF_DATE: int = 32;
pub const NF_MAP: int = 33;
pub const NF_SET: int = 34;
pub const NF_PERF_NOW: int = 35;
pub const NF_ENCODE_URI_COMPONENT: int = 36;
pub const NF_DECODE_URI_COMPONENT: int = 37;
pub const NF_ENCODE_URI: int = 38;
pub const NF_DECODE_URI: int = 39;
pub const NF_PROMISE: int = 40;
pub const NF_WEAKMAP: int = 41;
pub const NF_WEAKSET: int = 42;
pub const NF_GC: int = 43;
pub const NF_ESCAPE: int = 44;
pub const NF_UNESCAPE: int = 45;
// Object
pub const NF_O_KEYS: int = 50;
pub const NF_O_VALUES: int = 51;
pub const NF_O_ENTRIES: int = 52;
pub const NF_O_ASSIGN: int = 53;
pub const NF_O_CREATE: int = 54;
pub const NF_O_GETPROTO: int = 55;
pub const NF_O_SETPROTO: int = 56;
pub const NF_O_DEFPROP: int = 57;
pub const NF_O_DEFPROPS: int = 58;
pub const NF_O_OWNNAMES: int = 59;
pub const NF_O_OWNDESC: int = 60;
pub const NF_O_FREEZE: int = 61;
pub const NF_O_ISFROZEN: int = 62;
pub const NF_O_SEAL: int = 63;
pub const NF_O_ISSEALED: int = 64;
pub const NF_O_PREVENTEXT: int = 65;
pub const NF_O_ISEXT: int = 66;
pub const NF_O_IS: int = 67;
pub const NF_O_FROMENTRIES: int = 68;
pub const NF_O_OWNSYMBOLS: int = 69;
pub const NF_O_OWNDESCS: int = 70;
pub const NF_OP_HASOWN: int = 71;
pub const NF_OP_ISPROTO: int = 72;
pub const NF_OP_PROPENUM: int = 73;
pub const NF_OP_TOSTRING: int = 74;
pub const NF_OP_VALUEOF: int = 75;
pub const NF_OP_TOLOCALE: int = 76;
pub const NF_O_HASOWN: int = 77;
pub const NF_O_GROUPBY: int = 78;
// Array
pub const NF_A_ISARRAY: int = 80;
pub const NF_A_FROM: int = 81;
pub const NF_A_OF: int = 82;
pub const NF_AP_PUSH: int = 83;
pub const NF_AP_POP: int = 84;
pub const NF_AP_SHIFT: int = 85;
pub const NF_AP_UNSHIFT: int = 86;
pub const NF_AP_SLICE: int = 87;
pub const NF_AP_SPLICE: int = 88;
pub const NF_AP_CONCAT: int = 89;
pub const NF_AP_JOIN: int = 90;
pub const NF_AP_REVERSE: int = 91;
pub const NF_AP_INDEXOF: int = 92;
pub const NF_AP_LASTINDEXOF: int = 93;
pub const NF_AP_INCLUDES: int = 94;
pub const NF_AP_FOREACH: int = 95;
pub const NF_AP_MAP: int = 96;
pub const NF_AP_FILTER: int = 97;
pub const NF_AP_REDUCE: int = 98;
pub const NF_AP_REDUCERIGHT: int = 99;
pub const NF_AP_SOME: int = 100;
pub const NF_AP_EVERY: int = 101;
pub const NF_AP_FIND: int = 102;
pub const NF_AP_FINDINDEX: int = 103;
pub const NF_AP_FINDLAST: int = 104;
pub const NF_AP_FINDLASTINDEX: int = 105;
pub const NF_AP_SORT: int = 106;
pub const NF_AP_FILL: int = 107;
pub const NF_AP_KEYS: int = 108;
pub const NF_AP_VALUES: int = 109;
pub const NF_AP_ENTRIES: int = 110;
pub const NF_AP_FLAT: int = 111;
pub const NF_AP_FLATMAP: int = 112;
pub const NF_AP_TOSTRING: int = 113;
pub const NF_AP_AT: int = 114;
pub const NF_AP_COPYWITHIN: int = 115;
pub const NF_AP_TOREVERSED: int = 116;
pub const NF_AP_TOSORTED: int = 117;
pub const NF_AP_WITH: int = 118;
pub const NF_ITER_NEXT: int = 119;
pub const NF_ITER_SELF: int = 120;
// String
pub const NF_S_FROMCHARCODE: int = 130;
pub const NF_S_FROMCODEPOINT: int = 131;
pub const NF_S_RAW: int = 132;
pub const NF_SP_CHARAT: int = 133;
pub const NF_SP_CHARCODEAT: int = 134;
pub const NF_SP_CODEPOINTAT: int = 135;
pub const NF_SP_INDEXOF: int = 136;
pub const NF_SP_LASTINDEXOF: int = 137;
pub const NF_SP_INCLUDES: int = 138;
pub const NF_SP_STARTSWITH: int = 139;
pub const NF_SP_ENDSWITH: int = 140;
pub const NF_SP_SLICE: int = 141;
pub const NF_SP_SUBSTRING: int = 142;
pub const NF_SP_SUBSTR: int = 143;
pub const NF_SP_UPPER: int = 144;
pub const NF_SP_LOWER: int = 145;
pub const NF_SP_TRIM: int = 146;
pub const NF_SP_TRIMSTART: int = 147;
pub const NF_SP_TRIMEND: int = 148;
pub const NF_SP_SPLIT: int = 149;
pub const NF_SP_REPLACE: int = 150;
pub const NF_SP_REPLACEALL: int = 151;
pub const NF_SP_MATCH: int = 152;
pub const NF_SP_MATCHALL: int = 153;
pub const NF_SP_SEARCH: int = 154;
pub const NF_SP_REPEAT: int = 155;
pub const NF_SP_PADSTART: int = 156;
pub const NF_SP_PADEND: int = 157;
pub const NF_SP_CONCAT: int = 158;
pub const NF_SP_AT: int = 159;
pub const NF_SP_LOCALECOMPARE: int = 160;
pub const NF_SP_TOSTRING: int = 161;
pub const NF_SP_NORMALIZE: int = 162;
pub const NF_SP_ITERATOR: int = 163;
// Number / Boolean / Symbol / Error
pub const NF_N_ISINTEGER: int = 170;
pub const NF_N_ISSAFEINTEGER: int = 171;
pub const NF_N_ISFINITE: int = 172;
pub const NF_N_ISNAN: int = 173;
pub const NF_NP_TOSTRING: int = 174;
pub const NF_NP_TOFIXED: int = 175;
pub const NF_NP_VALUEOF: int = 176;
pub const NF_NP_TOPRECISION: int = 177;
pub const NF_NP_TOEXPONENTIAL: int = 178;
pub const NF_BP_TOSTRING: int = 179;
pub const NF_BP_VALUEOF: int = 180;
pub const NF_SYM_FOR: int = 181;
pub const NF_SYMP_TOSTRING: int = 182;
pub const NF_SYMP_DESCRIPTION: int = 183;
pub const NF_EP_TOSTRING: int = 184;
pub const NF_SYM_KEYFOR: int = 185;
// Math
pub const NF_MATH: int = 200; // + index into MATH_NAMES
// JSON
pub const NF_JSON_STRINGIFY: int = 250;
pub const NF_JSON_PARSE: int = 251;
// RegExp
pub const NF_RP_EXEC: int = 260;
pub const NF_RP_TEST: int = 261;
pub const NF_RP_TOSTRING: int = 262;
pub const NF_RP_FLAGS: int = 263;
pub const NF_RP_SOURCE: int = 264;
// Date
pub const NF_DATE_NOW: int = 270;
pub const NF_DATE_UTC: int = 271;
pub const NF_DATE_PARSE: int = 272;
pub const NF_DP_GET: int = 280; // + field
pub const NF_DP_SET: int = 300; // + field
pub const NF_DP_TOISO: int = 320;
pub const NF_DP_TOSTRING: int = 321;
pub const NF_DP_VALUEOF: int = 322;
pub const NF_DP_TOJSON: int = 323;
// Map / Set
pub const NF_MP_GET: int = 330;
pub const NF_MP_SET: int = 331;
pub const NF_MP_HAS: int = 332;
pub const NF_MP_DELETE: int = 333;
pub const NF_MP_CLEAR: int = 334;
pub const NF_MP_SIZE: int = 335;
pub const NF_MP_FOREACH: int = 336;
pub const NF_MP_KEYS: int = 337;
pub const NF_MP_VALUES: int = 338;
pub const NF_MP_ENTRIES: int = 339;
pub const NF_SETP_ADD: int = 340;
// Promise
pub const NF_PR_THEN: int = 350;
pub const NF_PR_CATCH: int = 351;
pub const NF_PR_RESOLVE: int = 352;
pub const NF_PR_REJECT: int = 353;
pub const NF_PR_RESOLVE_FN: int = 354;
pub const NF_PR_REJECT_FN: int = 355;
pub const NF_PR_FINALLY: int = 356;
pub const NF_PR_ALL: int = 357;
pub const NF_QUEUE_MICROTASK: int = 358;
// Reflect
pub const NF_REFLECT_APPLY: int = 370;
pub const NF_REFLECT_CONSTRUCT: int = 371;
pub const NF_REFLECT_OWNKEYS: int = 372;
pub const NF_REFLECT_HAS: int = 373;
pub const NF_REFLECT_GET: int = 374;
pub const NF_REFLECT_SET: int = 375;
pub const NF_REFLECT_GETPROTO: int = 376;
pub const NF_REFLECT_DEFPROP: int = 377;
pub const NF_REFLECT_DELETE: int = 378;
pub const NF_EVAL: int = 379;
pub const NF_GEN_NEXT: int = 380;
pub const NF_GEN_THROW: int = 381;
pub const NF_GEN_RETURN: int = 382;
pub const NF_PROXY: int = 383;
pub const NF_PROXY_REVOCABLE: int = 384;
pub const NF_PROXY_REVOKE: int = 385;

fn math_names() -> Vec<String> {
    let v = vec![
        "abs", "floor", "ceil", "round", "trunc", "sign", "sqrt", "cbrt", "exp", "expm1", "log", "log2", "log10", "log1p", "sin", "cos", "tan",
        "asin", "acos", "atan", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "fround", "clz32", "pow", "atan2", "imul", "min", "max",
        "random", "hypot",
    ];
    let mut out: Vec<String> = Vec::new();
    for s in v {
        out.push(String::from(s));
    }
    out
}

fn date_fields() -> Vec<String> {
    let v = vec![
        "FullYear", "Month", "Date", "Day", "Hours", "Minutes", "Seconds", "Milliseconds", "Time", "TimezoneOffset", "Year",
    ];
    let mut out: Vec<String> = Vec::new();
    for s in v {
        out.push(String::from(s));
    }
    out
}

pub fn arg(args: &Vec<Val>, i: usize) -> Val {
    if i < args.len() {
        args[i].clone()
    } else {
        Val::Undef
    }
}

fn days_from_civil(y: int, m: int, d: int) -> int {
    let yy = if m <= 2 { y - 1 } else { y };
    let era = if yy >= 0 { yy } else { yy - 399 } / 400;
    let yoe = yy - era * 400;
    let mp = if m > 2 { m - 3 } else { m + 9 };
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

fn civil_from_days(z0: int) -> (int, int, int) {
    let z = z0 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (if m <= 2 { y + 1 } else { y }, m, d)
}


pub fn now_ms() -> double {
    // the prelude's clock: milliseconds since the epoch, fractional
    wall_clock_ms()
}

impl Vm {
    pub fn native_fn(&mut self, name: &str, id: int, length: int) -> int {
        let fp = self.function_proto;
        let f = self.alloc(C_NATIVE, fp);
        self.objs[f as usize].func = id;
        let a = self.intern(name);
        let _ = a;
        self.objs[f as usize].add(A_NAME, str_val(name), P_HIDDEN | P_READONLY);
        self.objs[f as usize].add(A_LENGTH, Val::Num(length as double), P_HIDDEN | P_READONLY);
        f
    }

    /// A method on `o`: not enumerable.
    pub fn method(&mut self, o: int, name: &str, id: int, length: int) -> int {
        let f = self.native_fn(name, id, length);
        let a = self.intern(name);
        self.objs[o as usize].add(a, Val::Obj(f), P_HIDDEN);
        f
    }

    pub fn sym_method(&mut self, o: int, atom: int, label: &str, id: int, length: int) -> int {
        let f = self.native_fn(label, id, length);
        self.objs[o as usize].add(atom, Val::Obj(f), P_HIDDEN);
        f
    }

    pub fn getter(&mut self, o: int, name: &str, id: int) {
        let f = self.native_fn(name, id, 0);
        let a = self.intern(name);
        self.define_accessor(o, a, Val::Obj(f), 0, true);
    }

    pub fn value_prop(&mut self, o: int, name: &str, v: Val) {
        let a = self.intern(name);
        self.objs[o as usize].add(a, v, P_HIDDEN | P_READONLY | P_FIXED);
    }

    /// A constructor with its prototype object wired both ways.
    pub fn ctor(&mut self, name: &str, id: int, length: int, proto: int) -> int {
        let f = self.native_fn(name, id, length);
        self.objs[f as usize].add(A_PROTOTYPE, Val::Obj(proto), P_HIDDEN | P_READONLY | P_FIXED);
        self.objs[f as usize].has_proto_obj = true;
        self.objs[proto as usize].add(A_CONSTRUCTOR, Val::Obj(f), P_HIDDEN);
        let g = self.global;
        let a = self.intern(name);
        self.objs[g as usize].add(a, Val::Obj(f), P_HIDDEN);
        f
    }

    pub fn well_known_symbol(&mut self, atom: int, desc: &str) -> int {
        let sp = self.symbol_proto;
        let s = self.alloc(C_SYMBOL, sp);
        self.objs[s as usize].pos = atom;
        self.objs[s as usize].prim = str_val(desc);
        self.symbol_atoms.insert(atom, s);
        self.symbols.push(s);
        s
    }

    pub fn setup(&mut self) {
        let op = self.alloc(C_OBJECT, -1);
        self.object_proto = op;
        let fp = self.alloc(C_NATIVE, op);
        self.objs[fp as usize].func = NF_NOOP;
        self.function_proto = fp;
        let g = self.alloc(C_OBJECT, op);
        self.global = g;
        let ap = self.alloc(C_ARRAY, op);
        self.array_proto = ap;
        let sp = self.alloc(C_STRING, op);
        self.objs[sp as usize].prim = str_val("");
        self.string_proto = sp;
        let np = self.alloc(C_NUMBER, op);
        self.objs[np as usize].prim = Val::Num(0.0);
        self.number_proto = np;
        let bp = self.alloc(C_BOOLEAN, op);
        self.objs[bp as usize].prim = Val::Bool(false);
        self.boolean_proto = bp;
        let symp = self.alloc(C_OBJECT, op);
        self.symbol_proto = symp;
        let ep = self.alloc(C_OBJECT, op);
        self.error_proto = ep;
        let rp = self.alloc(C_OBJECT, op);
        self.regexp_proto = rp;
        let dp = self.alloc(C_OBJECT, op);
        self.date_proto = dp;
        let mp = self.alloc(C_OBJECT, op);
        self.map_proto = mp;
        let setp = self.alloc(C_OBJECT, op);
        self.set_proto = setp;
        let ip = self.alloc(C_OBJECT, op);
        self.iter_proto = ip;
        let pp = self.alloc(C_OBJECT, op);
        self.promise_proto = pp;
        self.roots = vec![op, fp, g, ap, sp, np, bp, symp, ep, rp, dp, mp, setp, ip, pp];

        self.objs[fp as usize].add(A_NAME, str_val(""), P_HIDDEN | P_READONLY);
        self.objs[fp as usize].add(A_LENGTH, Val::Num(0.0), P_HIDDEN | P_READONLY);

        let it_sym = self.well_known_symbol(A_ITERATOR, "Symbol.iterator");
        let a_async = self.intern("@@asyncIterator");
        let async_sym = self.well_known_symbol(a_async, "Symbol.asyncIterator");
        let tp_sym = self.well_known_symbol(A_TOPRIMITIVE, "Symbol.toPrimitive");
        let hi_sym = self.well_known_symbol(A_HASINSTANCE, "Symbol.hasInstance");
        let a_tag = self.intern("@@toStringTag");
        let tag_sym = self.well_known_symbol(a_tag, "Symbol.toStringTag");
        let a_species = self.intern("@@species");
        let species_sym = self.well_known_symbol(a_species, "Symbol.species");
        let a_unscop = self.intern("@@unscopables");
        let unscop_sym = self.well_known_symbol(a_unscop, "Symbol.unscopables");

        // globals
        self.objs[g as usize].add(self.atoms["globalThis"], Val::Obj(g), P_HIDDEN);
        self.value_prop(g, "NaN", Val::Num(nan()));
        self.value_prop(g, "Infinity", Val::Num(infinity()));
        self.value_prop(g, "undefined", Val::Undef);
        self.method(g, "print", NF_PRINT, 0);
        self.method(g, "parseInt", NF_PARSEINT, 2);
        self.method(g, "eval", NF_EVAL, 1);
        self.method(g, "parseFloat", NF_PARSEFLOAT, 1);
        self.method(g, "isNaN", NF_ISNAN, 1);
        self.method(g, "isFinite", NF_ISFINITE, 1);
        self.method(g, "encodeURIComponent", NF_ENCODE_URI_COMPONENT, 1);
        self.method(g, "decodeURIComponent", NF_DECODE_URI_COMPONENT, 1);
        self.method(g, "encodeURI", NF_ENCODE_URI, 1);
        self.method(g, "decodeURI", NF_DECODE_URI, 1);
        self.method(g, "escape", NF_ESCAPE, 1);
        self.method(g, "unescape", NF_UNESCAPE, 1);
        self.method(g, "gc", NF_GC, 0);
        self.method(g, "queueMicrotask", NF_QUEUE_MICROTASK, 1);
        let console = self.new_object();
        self.method(console, "log", NF_PRINT, 0);
        self.method(console, "info", NF_PRINT, 0);
        self.method(console, "warn", NF_PRINT, 0);
        self.method(console, "error", NF_PRINT, 0);
        self.method(console, "debug", NF_PRINT, 0);
        let a_console = self.intern("console");
        self.objs[g as usize].add(a_console, Val::Obj(console), P_HIDDEN);
        let perf = self.new_object();
        self.method(perf, "now", NF_PERF_NOW, 0);
        let a_perf = self.intern("performance");
        self.objs[g as usize].add(a_perf, Val::Obj(perf), P_HIDDEN);

        // Object
        let oc = self.ctor("Object", NF_OBJECT, 1, op);
        self.method(oc, "keys", NF_O_KEYS, 1);
        self.method(oc, "values", NF_O_VALUES, 1);
        self.method(oc, "entries", NF_O_ENTRIES, 1);
        self.method(oc, "assign", NF_O_ASSIGN, 2);
        self.method(oc, "create", NF_O_CREATE, 2);
        self.method(oc, "getPrototypeOf", NF_O_GETPROTO, 1);
        self.method(oc, "setPrototypeOf", NF_O_SETPROTO, 2);
        self.method(oc, "defineProperty", NF_O_DEFPROP, 3);
        self.method(oc, "defineProperties", NF_O_DEFPROPS, 2);
        self.method(oc, "getOwnPropertyNames", NF_O_OWNNAMES, 1);
        self.method(oc, "getOwnPropertyDescriptor", NF_O_OWNDESC, 2);
        self.method(oc, "getOwnPropertyDescriptors", NF_O_OWNDESCS, 1);
        self.method(oc, "getOwnPropertySymbols", NF_O_OWNSYMBOLS, 1);
        self.method(oc, "freeze", NF_O_FREEZE, 1);
        self.method(oc, "isFrozen", NF_O_ISFROZEN, 1);
        self.method(oc, "seal", NF_O_SEAL, 1);
        self.method(oc, "isSealed", NF_O_ISSEALED, 1);
        self.method(oc, "preventExtensions", NF_O_PREVENTEXT, 1);
        self.method(oc, "isExtensible", NF_O_ISEXT, 1);
        self.method(oc, "is", NF_O_IS, 2);
        self.method(oc, "fromEntries", NF_O_FROMENTRIES, 1);
        self.method(oc, "hasOwn", NF_O_HASOWN, 2);
        self.method(oc, "groupBy", NF_O_GROUPBY, 2);
        self.method(op, "hasOwnProperty", NF_OP_HASOWN, 1);
        self.method(op, "isPrototypeOf", NF_OP_ISPROTO, 1);
        self.method(op, "propertyIsEnumerable", NF_OP_PROPENUM, 1);
        self.method(op, "toString", NF_OP_TOSTRING, 0);
        self.method(op, "toLocaleString", NF_OP_TOLOCALE, 0);
        self.method(op, "valueOf", NF_OP_VALUEOF, 0);

        // Function
        let fc = self.ctor("Function", NF_FUNCTION, 1, fp);
        let _ = fc;
        self.method(fp, "call", NF_CALL, 1);
        self.method(fp, "apply", NF_APPLY, 2);
        self.method(fp, "bind", NF_BIND, 1);
        self.method(fp, "toString", NF_FN_TOSTRING, 0);

        // Array
        let ac = self.ctor("Array", NF_ARRAY, 1, ap);
        self.method(ac, "isArray", NF_A_ISARRAY, 1);
        self.method(ac, "from", NF_A_FROM, 1);
        self.method(ac, "of", NF_A_OF, 0);
        let names = vec![
            ("push", NF_AP_PUSH, 1),
            ("pop", NF_AP_POP, 0),
            ("shift", NF_AP_SHIFT, 0),
            ("unshift", NF_AP_UNSHIFT, 1),
            ("slice", NF_AP_SLICE, 2),
            ("splice", NF_AP_SPLICE, 2),
            ("concat", NF_AP_CONCAT, 1),
            ("join", NF_AP_JOIN, 1),
            ("reverse", NF_AP_REVERSE, 0),
            ("indexOf", NF_AP_INDEXOF, 1),
            ("lastIndexOf", NF_AP_LASTINDEXOF, 1),
            ("includes", NF_AP_INCLUDES, 1),
            ("forEach", NF_AP_FOREACH, 1),
            ("map", NF_AP_MAP, 1),
            ("filter", NF_AP_FILTER, 1),
            ("reduce", NF_AP_REDUCE, 1),
            ("reduceRight", NF_AP_REDUCERIGHT, 1),
            ("some", NF_AP_SOME, 1),
            ("every", NF_AP_EVERY, 1),
            ("find", NF_AP_FIND, 1),
            ("findIndex", NF_AP_FINDINDEX, 1),
            ("findLast", NF_AP_FINDLAST, 1),
            ("findLastIndex", NF_AP_FINDLASTINDEX, 1),
            ("sort", NF_AP_SORT, 1),
            ("fill", NF_AP_FILL, 1),
            ("keys", NF_AP_KEYS, 0),
            ("entries", NF_AP_ENTRIES, 0),
            ("flat", NF_AP_FLAT, 0),
            ("flatMap", NF_AP_FLATMAP, 1),
            ("toString", NF_AP_TOSTRING, 0),
            ("at", NF_AP_AT, 1),
            ("copyWithin", NF_AP_COPYWITHIN, 2),
            ("toReversed", NF_AP_TOREVERSED, 0),
            ("toSorted", NF_AP_TOSORTED, 1),
            ("with", NF_AP_WITH, 2),
        ];
        for (n, id, l) in names {
            self.method(ap, n, id, l);
        }
        let values = self.method(ap, "values", NF_AP_VALUES, 0);
        self.array_values_fn = values;
        self.objs[ap as usize].add(A_ITERATOR, Val::Obj(values), P_HIDDEN);
        self.method(ip, "next", NF_ITER_NEXT, 0);
        self.sym_method(ip, A_ITERATOR, "[Symbol.iterator]", NF_ITER_SELF, 0);

        // String
        let sc = self.ctor("String", NF_STRING, 1, sp);
        self.method(sc, "fromCharCode", NF_S_FROMCHARCODE, 1);
        self.method(sc, "fromCodePoint", NF_S_FROMCODEPOINT, 1);
        self.method(sc, "raw", NF_S_RAW, 1);
        let snames = vec![
            ("charAt", NF_SP_CHARAT, 1),
            ("charCodeAt", NF_SP_CHARCODEAT, 1),
            ("codePointAt", NF_SP_CODEPOINTAT, 1),
            ("indexOf", NF_SP_INDEXOF, 1),
            ("lastIndexOf", NF_SP_LASTINDEXOF, 1),
            ("includes", NF_SP_INCLUDES, 1),
            ("startsWith", NF_SP_STARTSWITH, 1),
            ("endsWith", NF_SP_ENDSWITH, 1),
            ("slice", NF_SP_SLICE, 2),
            ("substring", NF_SP_SUBSTRING, 2),
            ("substr", NF_SP_SUBSTR, 2),
            ("toUpperCase", NF_SP_UPPER, 0),
            ("toLowerCase", NF_SP_LOWER, 0),
            ("toLocaleUpperCase", NF_SP_UPPER, 0),
            ("toLocaleLowerCase", NF_SP_LOWER, 0),
            ("trim", NF_SP_TRIM, 0),
            ("trimStart", NF_SP_TRIMSTART, 0),
            ("trimEnd", NF_SP_TRIMEND, 0),
            ("trimLeft", NF_SP_TRIMSTART, 0),
            ("trimRight", NF_SP_TRIMEND, 0),
            ("split", NF_SP_SPLIT, 2),
            ("replace", NF_SP_REPLACE, 2),
            ("replaceAll", NF_SP_REPLACEALL, 2),
            ("match", NF_SP_MATCH, 1),
            ("matchAll", NF_SP_MATCHALL, 1),
            ("search", NF_SP_SEARCH, 1),
            ("repeat", NF_SP_REPEAT, 1),
            ("padStart", NF_SP_PADSTART, 2),
            ("padEnd", NF_SP_PADEND, 2),
            ("concat", NF_SP_CONCAT, 1),
            ("at", NF_SP_AT, 1),
            ("localeCompare", NF_SP_LOCALECOMPARE, 1),
            ("toString", NF_SP_TOSTRING, 0),
            ("valueOf", NF_SP_TOSTRING, 0),
            ("normalize", NF_SP_NORMALIZE, 0),
        ];
        for (n, id, l) in snames {
            self.method(sp, n, id, l);
        }
        self.sym_method(sp, A_ITERATOR, "[Symbol.iterator]", NF_SP_ITERATOR, 0);

        // Number
        let nc = self.ctor("Number", NF_NUMBER, 1, np);
        self.method(nc, "isInteger", NF_N_ISINTEGER, 1);
        self.method(nc, "isSafeInteger", NF_N_ISSAFEINTEGER, 1);
        self.method(nc, "isFinite", NF_N_ISFINITE, 1);
        self.method(nc, "isNaN", NF_N_ISNAN, 1);
        self.method(nc, "parseFloat", NF_PARSEFLOAT, 1);
        self.method(nc, "parseInt", NF_PARSEINT, 2);
        self.value_prop(nc, "MAX_VALUE", Val::Num(1.7976931348623157e308));
        self.value_prop(nc, "MIN_VALUE", Val::Num(5e-324));
        self.value_prop(nc, "EPSILON", Val::Num(2.220446049250313e-16));
        self.value_prop(nc, "MAX_SAFE_INTEGER", Val::Num(9007199254740991.0));
        self.value_prop(nc, "MIN_SAFE_INTEGER", Val::Num(-9007199254740991.0));
        self.value_prop(nc, "POSITIVE_INFINITY", Val::Num(infinity()));
        self.value_prop(nc, "NEGATIVE_INFINITY", Val::Num(-infinity()));
        self.value_prop(nc, "NaN", Val::Num(nan()));
        self.method(np, "toString", NF_NP_TOSTRING, 1);
        self.method(np, "toLocaleString", NF_NP_TOSTRING, 0);
        self.method(np, "toFixed", NF_NP_TOFIXED, 1);
        self.method(np, "toPrecision", NF_NP_TOPRECISION, 1);
        self.method(np, "toExponential", NF_NP_TOEXPONENTIAL, 1);
        self.method(np, "valueOf", NF_NP_VALUEOF, 0);

        // Boolean
        self.ctor("Boolean", NF_BOOLEAN, 1, bp);
        self.method(bp, "toString", NF_BP_TOSTRING, 0);
        self.method(bp, "valueOf", NF_BP_VALUEOF, 0);

        // Symbol
        let symc = self.ctor("Symbol", NF_SYMBOL, 0, symp);
        self.method(symc, "for", NF_SYM_FOR, 1);
        self.method(symc, "keyFor", NF_SYM_KEYFOR, 1);
        self.value_prop(symc, "iterator", Val::Obj(it_sym));
        self.value_prop(symc, "asyncIterator", Val::Obj(async_sym));
        self.value_prop(symc, "toPrimitive", Val::Obj(tp_sym));
        self.value_prop(symc, "hasInstance", Val::Obj(hi_sym));
        self.value_prop(symc, "toStringTag", Val::Obj(tag_sym));
        self.value_prop(symc, "species", Val::Obj(species_sym));
        self.value_prop(symc, "unscopables", Val::Obj(unscop_sym));
        self.method(symp, "toString", NF_SYMP_TOSTRING, 0);
        self.getter(symp, "description", NF_SYMP_DESCRIPTION);

        // Errors
        let err_names = vec!["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "EvalError", "URIError", "AggregateError"];
        let mut k: int = 0;
        let mut base_ctor: int = -1;
        for n in err_names {
            let proto = if k == 0 { ep } else { self.alloc(C_OBJECT, ep) };
            let c = self.ctor(n, NF_ERROR + k, 1, proto);
            if k == 0 {
                base_ctor = c;
            } else {
                self.objs[c as usize].proto = base_ctor;
            }
            self.objs[proto as usize].add(A_NAME, str_val(n), P_HIDDEN);
            self.objs[proto as usize].add(A_MESSAGE, str_val(""), P_HIDDEN);
            if k == 1 {
                self.type_error_proto = proto;
            } else if k == 2 {
                self.range_error_proto = proto;
            } else if k == 3 {
                self.reference_error_proto = proto;
            } else if k == 4 {
                self.syntax_error_proto = proto;
            }
            self.roots.push(proto);
            k += 1;
        }
        self.method(ep, "toString", NF_EP_TOSTRING, 0);

        // Math
        let math = self.new_object();
        let a_math = self.intern("Math");
        self.objs[g as usize].add(a_math, Val::Obj(math), P_HIDDEN);
        let mut i: int = 0;
        for n in math_names() {
            let len = if n.as_str() == "pow" || n.as_str() == "atan2" || n.as_str() == "imul" || n.as_str() == "min" || n.as_str() == "max" || n.as_str() == "hypot" {
                2
            } else if n.as_str() == "random" {
                0
            } else {
                1
            };
            self.method(math, n.as_str(), NF_MATH + i, len);
            i += 1;
        }
        self.value_prop(math, "PI", Val::Num(3.141592653589793));
        self.value_prop(math, "E", Val::Num(2.718281828459045));
        self.value_prop(math, "LN2", Val::Num(0.6931471805599453));
        self.value_prop(math, "LN10", Val::Num(2.302585092994046));
        self.value_prop(math, "LOG2E", Val::Num(1.4426950408889634));
        self.value_prop(math, "LOG10E", Val::Num(0.4342944819032518));
        self.value_prop(math, "SQRT2", Val::Num(1.4142135623730951));
        self.value_prop(math, "SQRT1_2", Val::Num(0.7071067811865476));

        // JSON
        let json = self.new_object();
        let a_json = self.intern("JSON");
        self.objs[g as usize].add(a_json, Val::Obj(json), P_HIDDEN);
        self.method(json, "stringify", NF_JSON_STRINGIFY, 3);
        self.method(json, "parse", NF_JSON_PARSE, 2);

        // Reflect
        let reflect = self.new_object();
        let a_reflect = self.intern("Reflect");
        self.objs[g as usize].add(a_reflect, Val::Obj(reflect), P_HIDDEN);
        self.method(reflect, "apply", NF_REFLECT_APPLY, 3);
        self.method(reflect, "construct", NF_REFLECT_CONSTRUCT, 2);
        self.method(reflect, "ownKeys", NF_REFLECT_OWNKEYS, 1);
        self.method(reflect, "has", NF_REFLECT_HAS, 2);
        self.method(reflect, "get", NF_REFLECT_GET, 2);
        self.method(reflect, "set", NF_REFLECT_SET, 3);
        self.method(reflect, "getPrototypeOf", NF_REFLECT_GETPROTO, 1);
        self.method(reflect, "setPrototypeOf", NF_O_SETPROTO, 2);
        self.method(reflect, "defineProperty", NF_REFLECT_DEFPROP, 3);
        self.method(reflect, "deleteProperty", NF_REFLECT_DELETE, 2);

        // RegExp
        self.ctor("RegExp", NF_REGEXP, 2, rp);
        self.method(rp, "exec", NF_RP_EXEC, 1);
        self.method(rp, "test", NF_RP_TEST, 1);
        self.method(rp, "toString", NF_RP_TOSTRING, 0);
        self.getter(rp, "flags", NF_RP_FLAGS);

        // Date
        let dc = self.ctor("Date", NF_DATE, 7, dp);
        self.method(dc, "now", NF_DATE_NOW, 0);
        self.method(dc, "UTC", NF_DATE_UTC, 7);
        self.method(dc, "parse", NF_DATE_PARSE, 1);
        let mut fi: int = 0;
        for f in date_fields() {
            let gname = format!("get{}", f);
            self.method(dp, gname.as_str(), NF_DP_GET + fi, 0);
            let uname = format!("getUTC{}", f);
            self.method(dp, uname.as_str(), NF_DP_GET + fi, 0);
            if f.as_str() != "Day" && f.as_str() != "TimezoneOffset" {
                // the setters' lengths: how many fields each takes
                let arity: int = if fi == 0 || fi == 5 { 3 } else if fi == 1 || fi == 6 { 2 } else if fi == 4 { 4 } else { 1 };
                let sname = format!("set{}", f);
                self.method(dp, sname.as_str(), NF_DP_SET + fi, arity);
                if f.as_str() != "Year" && f.as_str() != "Time" {
                    let suname = format!("setUTC{}", f);
                    self.method(dp, suname.as_str(), NF_DP_SET + fi, arity);
                }
            }
            fi += 1;
        }
        self.method(dp, "toISOString", NF_DP_TOISO, 0);
        self.method(dp, "toJSON", NF_DP_TOJSON, 1);
        self.method(dp, "toString", NF_DP_TOSTRING, 0);
        let utcs = self.method(dp, "toUTCString", NF_DP_TOSTRING, 0);
        let a_gmt = self.intern("toGMTString");
        self.objs[dp as usize].add(a_gmt, Val::Obj(utcs), P_HIDDEN);
        self.method(dp, "toDateString", NF_DP_TOSTRING, 0);
        self.method(dp, "toLocaleString", NF_DP_TOSTRING, 0);
        self.method(dp, "valueOf", NF_DP_VALUEOF, 0);

        // Map / Set
        self.ctor("Map", NF_MAP, 0, mp);
        self.method(mp, "get", NF_MP_GET, 1);
        self.method(mp, "set", NF_MP_SET, 2);
        self.method(mp, "has", NF_MP_HAS, 1);
        self.method(mp, "delete", NF_MP_DELETE, 1);
        self.method(mp, "clear", NF_MP_CLEAR, 0);
        self.method(mp, "forEach", NF_MP_FOREACH, 1);
        self.method(mp, "keys", NF_MP_KEYS, 0);
        self.method(mp, "values", NF_MP_VALUES, 0);
        let me = self.method(mp, "entries", NF_MP_ENTRIES, 0);
        self.objs[mp as usize].add(A_ITERATOR, Val::Obj(me), P_HIDDEN);
        self.getter(mp, "size", NF_MP_SIZE);
        self.ctor("Set", NF_SET, 0, setp);
        self.method(setp, "add", NF_SETP_ADD, 1);
        self.method(setp, "has", NF_MP_HAS, 1);
        self.method(setp, "delete", NF_MP_DELETE, 1);
        self.method(setp, "clear", NF_MP_CLEAR, 0);
        self.method(setp, "forEach", NF_MP_FOREACH, 1);
        self.method(setp, "entries", NF_MP_ENTRIES, 0);
        let sv = self.method(setp, "values", NF_MP_KEYS, 0);
        let a_keys = self.intern("keys");
        self.objs[setp as usize].add(a_keys, Val::Obj(sv), P_HIDDEN);
        self.objs[setp as usize].add(A_ITERATOR, Val::Obj(sv), P_HIDDEN);
        self.getter(setp, "size", NF_MP_SIZE);
        // WeakMap / WeakSet: a Map / Set underneath, with only the methods a
        // weak collection has (no size, no iteration)
        let op0 = self.object_proto;
        let wmp = self.alloc(C_OBJECT, op0);
        self.roots.push(wmp);
        self.ctor("WeakMap", NF_WEAKMAP, 0, wmp);
        self.method(wmp, "get", NF_MP_GET, 1);
        self.method(wmp, "set", NF_MP_SET, 2);
        self.method(wmp, "has", NF_MP_HAS, 1);
        self.method(wmp, "delete", NF_MP_DELETE, 1);
        let wsp = self.alloc(C_OBJECT, op0);
        self.roots.push(wsp);
        self.ctor("WeakSet", NF_WEAKSET, 0, wsp);
        self.method(wsp, "add", NF_SETP_ADD, 1);
        self.method(wsp, "has", NF_MP_HAS, 1);
        self.method(wsp, "delete", NF_MP_DELETE, 1);
        let a_tag2 = self.intern("@@toStringTag");
        self.objs[wmp as usize].add(a_tag2, str_val("WeakMap"), P_HIDDEN | P_READONLY);
        self.objs[wsp as usize].add(a_tag2, str_val("WeakSet"), P_HIDDEN | P_READONLY);

        // generators and async functions: %GeneratorPrototype% (whose
        // prototype the prelude sets to Iterator.prototype),
        // %GeneratorFunction.prototype%, %AsyncFunction.prototype%
        let a_tag3 = self.intern("@@toStringTag");
        let op1 = self.object_proto;
        let fp1 = self.function_proto;
        let gp = self.alloc(C_OBJECT, op1);
        self.roots.push(gp);
        self.generator_proto = gp;
        self.method(gp, "next", NF_GEN_NEXT, 1);
        self.method(gp, "return", NF_GEN_RETURN, 1);
        self.method(gp, "throw", NF_GEN_THROW, 1);
        self.objs[gp as usize].add(a_tag3, str_val("Generator"), P_HIDDEN | P_READONLY);
        let gfp = self.alloc(C_OBJECT, fp1);
        self.roots.push(gfp);
        self.gen_fn_proto = gfp;
        self.objs[gfp as usize].add(A_PROTOTYPE, Val::Obj(gp), P_HIDDEN | P_READONLY);
        self.objs[gp as usize].add(A_CONSTRUCTOR, Val::Obj(gfp), P_HIDDEN | P_READONLY);
        self.objs[gfp as usize].add(a_tag3, str_val("GeneratorFunction"), P_HIDDEN | P_READONLY);
        let gfc = self.native_fn("GeneratorFunction", NF_FUNCTION, 1);
        self.objs[gfp as usize].add(A_CONSTRUCTOR, Val::Obj(gfc), P_HIDDEN | P_READONLY);
        self.objs[gfc as usize].add(A_PROTOTYPE, Val::Obj(gfp), P_HIDDEN | P_READONLY | P_FIXED);
        let afp = self.alloc(C_OBJECT, fp1);
        self.roots.push(afp);
        self.async_fn_proto = afp;
        self.objs[afp as usize].add(a_tag3, str_val("AsyncFunction"), P_HIDDEN | P_READONLY);
        let afc = self.native_fn("AsyncFunction", NF_FUNCTION, 1);
        self.objs[afp as usize].add(A_CONSTRUCTOR, Val::Obj(afc), P_HIDDEN | P_READONLY);
        self.objs[afc as usize].add(A_PROTOTYPE, Val::Obj(afp), P_HIDDEN | P_READONLY | P_FIXED);

        // the natives the prelude builds ArrayBuffer, the typed arrays and
        // DataView on (it takes __cerTA out of the global object)
        let abp = self.alloc(C_OBJECT, op1);
        self.roots.push(abp);
        self.array_buffer_proto = abp;
        let ta = self.alloc(C_OBJECT, op1);
        let a_ta = self.intern("__cerTA");
        let gl = self.global;
        self.objs[gl as usize].add(a_ta, Val::Obj(ta), P_HIDDEN);
        let a_bp = self.intern("bufferProto");
        self.objs[ta as usize].add(a_bp, Val::Obj(abp), 0);
        self.method(ta, "buffer", crate::typed::NF_TA_BUFFER, 4);
        self.method(ta, "create", crate::typed::NF_TA_CREATE, 5);
        self.method(ta, "view", crate::typed::NF_TA_VIEW, 4);
        self.method(ta, "info", crate::typed::NF_TA_INFO, 2);
        self.method(ta, "bufInfo", crate::typed::NF_TA_BUFINFO, 2);
        self.method(ta, "resize", crate::typed::NF_TA_RESIZE, 2);
        self.method(ta, "transfer", crate::typed::NF_TA_TRANSFER, 3);
        self.method(ta, "slice", crate::typed::NF_TA_SLICE, 4);
        self.method(ta, "dvGet", crate::typed::NF_TA_DVGET, 4);
        self.method(ta, "dvSet", crate::typed::NF_TA_DVSET, 5);

        // the natives under Intl (the prelude takes __cerIntl out)
        self.setup_intl();

        // Proxy: a constructor without a prototype
        let pxc = self.native_fn("Proxy", NF_PROXY, 2);
        let a_proxy = self.intern("Proxy");
        let gl2 = self.global;
        self.objs[gl2 as usize].add(a_proxy, Val::Obj(pxc), P_HIDDEN);
        self.method(pxc, "revocable", NF_PROXY_REVOCABLE, 2);

        // Promise
        let prc = self.ctor("Promise", NF_PROMISE, 1, pp);
        self.method(prc, "resolve", NF_PR_RESOLVE, 1);
        self.method(prc, "reject", NF_PR_REJECT, 1);
        self.method(prc, "all", NF_PR_ALL, 1);
        self.method(pp, "then", NF_PR_THEN, 2);
        self.method(pp, "catch", NF_PR_CATCH, 1);
        self.method(pp, "finally", NF_PR_FINALLY, 1);
    }

    // ---- helpers

    pub fn this_num(&mut self, this: &Val) -> double {
        match this {
            Val::Num(n) => *n,
            Val::Obj(o) => {
                if self.objs[*o as usize].class == C_NUMBER {
                    if let Val::Num(n) = self.objs[*o as usize].prim {
                        return n;
                    }
                }
                self.throw_type("Number.prototype method called on incompatible receiver");
                0.0
            }
            _ => {
                self.throw_type("Number.prototype method called on incompatible receiver");
                0.0
            }
        }
    }

    pub fn this_str(&mut self, this: &Val) -> Rc<String> {
        match this {
            Val::Str(s) => s.clone(),
            Val::Undef | Val::Null => {
                self.throw_type("String.prototype method called on null or undefined");
                Rc::new(String::new())
            }
            _ => self.to_str(this),
        }
    }

    pub fn len_of(&mut self, v: &Val) -> int {
        if let Val::Obj(o) = v {
            let c = self.objs[*o as usize].class;
            if c == C_ARRAY || c == C_ARGUMENTS {
                return self.objs[*o as usize].elems.len() as int;
            }
        }
        let l = self.get(v, A_LENGTH);
        let n = to_integer(self.to_number(&l));
        if n < 0.0 {
            0
        } else {
            n as int
        }
    }

    /// A relative index clamped to [0, len]
    pub fn rel_index(&mut self, v: &Val, len: int, dflt: int) -> int {
        if matches!(v, Val::Undef) {
            return dflt;
        }
        let n = to_integer(self.to_number(v));
        if n < 0.0 {
            let r = (len as double) + n;
            if r < 0.0 {
                0
            } else {
                r as int
            }
        } else if n > len as double {
            len
        } else {
            n as int
        }
    }

    pub fn error_ctor_proto(&self, kind: int) -> int {
        let names = vec!["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "EvalError", "URIError", "AggregateError"];
        let g = self.global;
        let a = self.atoms[names[kind as usize]];
        let slot = self.objs[g as usize].find(a);
        let c = obj_of(&self.objs[g as usize].vals[slot as usize]);
        let ps = self.objs[c as usize].find(A_PROTOTYPE);
        obj_of(&self.objs[c as usize].vals[ps as usize])
    }

    /// The prototype a constructor call should use: new.target's, else `d`.
    pub fn proto_from(&mut self, new_target: &Val, d: int) -> int {
        if let Val::Obj(nt) = new_target {
            let p = self.get_obj(*nt, A_PROTOTYPE, new_target);
            if let Val::Obj(po) = p {
                return po;
            }
        }
        d
    }

    pub fn display(&mut self, v: &Val) -> String {
        match v {
            Val::Obj(o) => {
                let c = self.objs[*o as usize].class;
                if c == C_SYMBOL {
                    let d = self.objs[*o as usize].prim.clone();
                    let ds = if let Val::Str(s) = d { s.as_ref().clone() } else { String::new() };
                    return format!("Symbol({})", ds);
                }
                let s = self.to_string(v);
                if self.throwing {
                    self.throwing = false;
                    self.exc = Val::Undef;
                    return String::from("[object]");
                }
                s
            }
            _ => self.to_string(v),
        }
    }

    // ---- RegExp

    pub fn new_regexp(&mut self, src: &Val, flags: &Val) -> Val {
        let s = if matches!(src, Val::Undef) { String::from("(?:)") } else { self.to_string(src) };
        let f = if matches!(flags, Val::Undef) { String::new() } else { self.to_string(flags) };
        let key = format!("{}/{}", s, f);
        let idx = match self.regex_cache.get(&key) {
            Some(i) => *i,
            None => {
                let re = regex::compile(s.as_str(), f.as_str());
                if !re.error.is_empty() {
                    let m = format!("{}: /{}/", re.error, s);
                    self.throw_syntax(m.as_str());
                    return Val::Undef;
                }
                self.regexes.push(re);
                let i = (self.regexes.len() as int) - 1;
                self.regex_cache.insert(key, i);
                i
            }
        };
        let rp = self.regexp_proto;
        let o = self.alloc(C_REGEXP, rp);
        self.objs[o as usize].func = idx;
        self.objs[o as usize].prim = string_val(s.clone());
        self.objs[o as usize].add(A_LASTINDEX, Val::Num(0.0), P_HIDDEN);
        let re = &self.regexes[idx as usize];
        let (g, ic, m, sa, u, y) = (re.global, re.ignore_case, re.multiline, re.dot_all, re.unicode, re.sticky);
        let a_source = self.intern("source");
        let a_global = self.intern("global");
        let a_ic = self.intern("ignoreCase");
        let a_m = self.intern("multiline");
        let a_s = self.intern("dotAll");
        let a_u = self.intern("unicode");
        let a_y = self.intern("sticky");
        let shown = if s.is_empty() { String::from("(?:)") } else { s.replace("/", "\\/").replace("\\\\/", "\\/") };
        self.objs[o as usize].add(a_source, string_val(shown), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_global, Val::Bool(g), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_ic, Val::Bool(ic), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_m, Val::Bool(m), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_s, Val::Bool(sa), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_u, Val::Bool(u), P_HIDDEN | P_READONLY);
        self.objs[o as usize].add(a_y, Val::Bool(y), P_HIDDEN | P_READONLY);
        Val::Obj(o)
    }

    pub fn regexp_flags(&self, o: int) -> String {
        let re = &self.regexes[self.objs[o as usize].func as usize];
        let mut f = String::new();
        if re.global {
            f.push('g');
        }
        if re.ignore_case {
            f.push('i');
        }
        if re.multiline {
            f.push('m');
        }
        if re.dot_all {
            f.push('s');
        }
        if re.unicode {
            f.push('u');
        }
        if re.sticky {
            f.push('y');
        }
        f
    }

    /// RegExp.prototype.exec: the match array or null; updates lastIndex.
    pub fn regexp_exec(&mut self, ro: int, s: &Rc<String>) -> Val {
        let idx = self.objs[ro as usize].func;
        let (global, sticky, ngroups) = {
            let re = &self.regexes[idx as usize];
            (re.global, re.sticky, re.ngroups)
        };
        let units = jsstr::units(s.as_str());
        let mut start: int = 0;
        if global || sticky {
            let li = self.get_obj(ro, A_LASTINDEX, &Val::Obj(ro));
            start = to_integer(self.to_number(&li)) as int;
            if start > units.len() as int || start < 0 {
                self.set_obj(ro, A_LASTINDEX, Val::Num(0.0));
                return Val::Null;
            }
        }
        let caps = self.regexes[idx as usize].exec(&units, start);
        if caps.is_empty() {
            if global || sticky {
                self.set_obj(ro, A_LASTINDEX, Val::Num(0.0));
            }
            return Val::Null;
        }
        if global || sticky {
            self.set_obj(ro, A_LASTINDEX, Val::Num(caps[1] as double));
        }
        let mut items: Vec<Val> = Vec::new();
        let mut g: int = 0;
        while g <= ngroups {
            let a = caps[(g * 2) as usize];
            let b = caps[(g * 2 + 1) as usize];
            if a < 0 || b < 0 {
                items.push(Val::Undef);
            } else {
                items.push(string_val(jsstr::from_units(&units, a, b)));
            }
            g += 1;
        }
        let arr = self.new_array(items.clone());
        self.objs[arr as usize].add(A_INDEX, Val::Num(caps[0] as double), 0);
        self.objs[arr as usize].add(A_INPUT, Val::Str(s.clone()), 0);
        let names = self.regexes[idx as usize].names.clone();
        let nidx = self.regexes[idx as usize].name_index.clone();
        if names.is_empty() {
            self.objs[arr as usize].add(A_GROUPS, Val::Undef, 0);
        } else {
            let go = self.alloc(C_OBJECT, -1);
            let mut i: usize = 0;
            while i < names.len() {
                let a = self.intern(names[i].as_str());
                let v = items[nidx[i] as usize].clone();
                self.objs[go as usize].add(a, v, 0);
                i += 1;
            }
            self.objs[arr as usize].add(A_GROUPS, Val::Obj(go), 0);
        }
        Val::Obj(arr)
    }

    /// The replacement text for one match: `$&`, `$1`, `$<name>`, …
    pub fn expand_replacement(&self, repl: &str, matched: &str, pos: int, units: &Vec<int>, caps: &Vec<Val>, groups: &Vec<(String, Val)>) -> String {
        let r = repl.chars().collect::<Vec<char>>();
        let mut out = String::new();
        let n = r.len();
        let mut i: usize = 0;
        while i < n {
            let c = r[i];
            if c != '$' || i + 1 >= n {
                out.push(c);
                i += 1;
                continue;
            }
            let d = r[i + 1];
            if d == '$' {
                out.push('$');
                i += 2;
            } else if d == '&' {
                out.push_str(matched);
                i += 2;
            } else if d == '`' {
                out.push_str(jsstr::from_units(units, 0, pos).as_str());
                i += 2;
            } else if d == '\'' {
                let end = pos + jsstr::len(matched);
                out.push_str(jsstr::from_units(units, end, units.len() as int).as_str());
                i += 2;
            } else if d >= '0' && d <= '9' {
                let mut num = (d as int) - 48;
                let mut used = 2;
                if i + 2 < n && r[i + 2] >= '0' && r[i + 2] <= '9' {
                    let two = num * 10 + ((r[i + 2] as int) - 48);
                    if two >= 1 && two < caps.len() as int {
                        num = two;
                        used = 3;
                    }
                }
                if num >= 1 && num < caps.len() as int {
                    if let Val::Str(s) = &caps[num as usize] {
                        out.push_str(s.as_str());
                    }
                    i += used;
                } else {
                    out.push('$');
                    i += 1;
                }
            } else if d == '<' && !groups.is_empty() {
                let mut j = i + 2;
                let mut name = String::new();
                while j < n && r[j] != '>' {
                    name.push(r[j]);
                    j += 1;
                }
                if j >= n {
                    out.push('$');
                    i += 1;
                    continue;
                }
                for (gn, gv) in groups.iter() {
                    if gn.as_str() == name.as_str() {
                        if let Val::Str(s) = gv {
                            out.push_str(s.as_str());
                        }
                    }
                }
                i = j + 1;
            } else {
                out.push('$');
                i += 1;
            }
        }
        out
    }

    pub fn string_replace(&mut self, s: &Rc<String>, pattern: &Val, repl: &Val, all: bool) -> Val {
        let units = jsstr::units(s.as_str());
        let fn_repl = self.is_callable(repl);
        let repl_str = if fn_repl { String::new() } else { self.to_string(repl) };
        let mut out = String::new();
        let mut last: int = 0;
        if self.class_of(pattern) == C_REGEXP {
            let ro = obj_of(pattern);
            let idx = self.objs[ro as usize].func;
            let global = self.regexes[idx as usize].global;
            if all && !global {
                self.throw_type("replaceAll must be called with a global RegExp");
                return Val::Undef;
            }
            let names = self.regexes[idx as usize].names.clone();
            let nidx = self.regexes[idx as usize].name_index.clone();
            let ngroups = self.regexes[idx as usize].ngroups;
            let mut start: int = 0;
            if !global {
                let li = self.get_obj(ro, A_LASTINDEX, pattern);
                let _ = li;
            }
            loop {
                if start > units.len() as int {
                    break;
                }
                let caps = self.regexes[idx as usize].exec(&units, start);
                if caps.is_empty() {
                    break;
                }
                let (ms, me) = (caps[0], caps[1]);
                out.push_str(jsstr::from_units(&units, last, ms).as_str());
                let matched = jsstr::from_units(&units, ms, me);
                let mut capv: Vec<Val> = Vec::new();
                let mut g: int = 0;
                while g <= ngroups {
                    let a = caps[(g * 2) as usize];
                    let b = caps[(g * 2 + 1) as usize];
                    capv.push(if a < 0 || b < 0 { Val::Undef } else { string_val(jsstr::from_units(&units, a, b)) });
                    g += 1;
                }
                let mut groups: Vec<(String, Val)> = Vec::new();
                let mut i: usize = 0;
                while i < names.len() {
                    groups.push((names[i].clone(), capv[nidx[i] as usize].clone()));
                    i += 1;
                }
                if fn_repl {
                    let mut args: Vec<Val> = capv.clone();
                    args.push(Val::Num(ms as double));
                    args.push(Val::Str(s.clone()));
                    if !groups.is_empty() {
                        let go = self.new_object();
                        for (gn, gv) in groups.iter() {
                            let a = self.intern(gn.as_str());
                            self.objs[go as usize].add(a, gv.clone(), 0);
                        }
                        args.push(Val::Obj(go));
                    }
                    let r = self.call_value(repl.clone(), Val::Undef, args);
                    if self.throwing {
                        return Val::Undef;
                    }
                    let rs = self.to_string(&r);
                    out.push_str(rs.as_str());
                } else {
                    let e = self.expand_replacement(repl_str.as_str(), matched.as_str(), ms, &units, &capv, &groups);
                    out.push_str(e.as_str());
                }
                last = me;
                if !global {
                    break;
                }
                start = if me == ms { me + 1 } else { me };
            }
            if global {
                self.set_obj(ro, A_LASTINDEX, Val::Num(0.0));
            }
            out.push_str(jsstr::from_units(&units, last, units.len() as int).as_str());
            return string_val(out);
        }
        let pat = self.to_string(pattern);
        let plen = jsstr::len(pat.as_str());
        let mut from: int = 0;
        loop {
            let p = jsstr::index_of(s.as_str(), pat.as_str(), from);
            if p < 0 {
                break;
            }
            out.push_str(jsstr::from_units(&units, last, p).as_str());
            if fn_repl {
                let r = self.call_value(repl.clone(), Val::Undef, vec![string_val(pat.clone()), Val::Num(p as double), Val::Str(s.clone())]);
                if self.throwing {
                    return Val::Undef;
                }
                let rs = self.to_string(&r);
                out.push_str(rs.as_str());
            } else {
                let e = self.expand_replacement(repl_str.as_str(), pat.as_str(), p, &units, &vec![string_val(pat.clone())], &Vec::new());
                out.push_str(e.as_str());
            }
            last = p + plen;
            if !all {
                break;
            }
            from = if plen == 0 { p + 1 } else { p + plen };
            if from > units.len() as int {
                break;
            }
        }
        out.push_str(jsstr::from_units(&units, last, units.len() as int).as_str());
        string_val(out)
    }

    pub fn string_split(&mut self, s: &Rc<String>, sep: &Val, limit: &Val) -> Val {
        let lim: int = if matches!(limit, Val::Undef) {
            2147483647
        } else {
            let l = to_uint32(self.to_number(limit));
            if l > 2147483647.0 {
                2147483647
            } else {
                l as int
            }
        };
        let mut out: Vec<Val> = Vec::new();
        if lim == 0 {
            let a = self.new_array(out);
            return Val::Obj(a);
        }
        if matches!(sep, Val::Undef) {
            out.push(Val::Str(s.clone()));
            let a = self.new_array(out);
            return Val::Obj(a);
        }
        let units = jsstr::units(s.as_str());
        let n = units.len() as int;
        if self.class_of(sep) == C_REGEXP {
            let ro = obj_of(sep);
            let idx = self.objs[ro as usize].func;
            let ngroups = self.regexes[idx as usize].ngroups;
            if n == 0 {
                let caps = self.regexes[idx as usize].exec(&units, 0);
                if caps.is_empty() || caps[1] != 0 {
                    out.push(Val::Str(s.clone()));
                }
                let a = self.new_array(out);
                return Val::Obj(a);
            }
            let mut p: int = 0;
            let mut q: int = 0;
            while q < n {
                let caps = self.regexes[idx as usize].exec(&units, q);
                if caps.is_empty() {
                    break;
                }
                let (ms, me) = (caps[0], caps[1]);
                if me >= n + 1 || ms >= n {
                    break;
                }
                if me == p || (me == ms && ms == q && me == p) {
                    q = ms + 1;
                    if me == ms {
                        q = if ms >= q { ms + 1 } else { q };
                    }
                    continue;
                }
                if me == ms && ms < q {
                    q += 1;
                    continue;
                }
                out.push(string_val(jsstr::from_units(&units, p, ms)));
                if out.len() as int >= lim {
                    let a = self.new_array(out);
                    return Val::Obj(a);
                }
                let mut g: int = 1;
                while g <= ngroups {
                    let a = caps[(g * 2) as usize];
                    let b = caps[(g * 2 + 1) as usize];
                    out.push(if a < 0 || b < 0 { Val::Undef } else { string_val(jsstr::from_units(&units, a, b)) });
                    if out.len() as int >= lim {
                        let arr = self.new_array(out);
                        return Val::Obj(arr);
                    }
                    g += 1;
                }
                p = me;
                q = if me == ms { me + 1 } else { me };
            }
            out.push(string_val(jsstr::from_units(&units, p, n)));
            let a = self.new_array(out);
            return Val::Obj(a);
        }
        let sepstr = self.to_string(sep);
        if sepstr.is_empty() {
            let mut i: int = 0;
            while i < n && (out.len() as int) < lim {
                out.push(string_val(jsstr::from_units(&units, i, i + 1)));
                i += 1;
            }
            let a = self.new_array(out);
            return Val::Obj(a);
        }
        if jsstr::is_ascii(s.as_str()) && jsstr::is_ascii(sepstr.as_str()) {
            for part in s.split(sepstr.as_str()) {
                if (out.len() as int) >= lim {
                    break;
                }
                out.push(str_val(part));
            }
            let a = self.new_array(out);
            return Val::Obj(a);
        }
        let slen = jsstr::len(sepstr.as_str());
        let mut from: int = 0;
        loop {
            let p = jsstr::index_of(s.as_str(), sepstr.as_str(), from);
            if p < 0 || (out.len() as int) >= lim {
                break;
            }
            out.push(string_val(jsstr::from_units(&units, from, p)));
            from = p + slen;
        }
        if (out.len() as int) < lim {
            out.push(string_val(jsstr::from_units(&units, from, n)));
        }
        let a = self.new_array(out);
        Val::Obj(a)
    }

    // ---- Map / Set

    pub fn map_key(&mut self, k: &Val) -> int {
        let s = match k {
            Val::Undef => String::from("u"),
            Val::Null => String::from("l"),
            Val::Bool(b) => format!("b{}", b),
            Val::Num(n) => {
                if *n == 0.0 {
                    String::from("n0")
                } else {
                    format!("n{}", number_to_string(*n))
                }
            }
            Val::Str(s) => format!("s{}", s),
            Val::Obj(o) => format!("o{}", o),
        };
        self.intern(s.as_str())
    }

    pub fn map_find(&mut self, m: int, k: &Val) -> int {
        let key = self.map_key(k);
        match self.objs[m as usize].index.get(&key) {
            Some(i) => *i,
            None => -1,
        }
    }

    pub fn map_set(&mut self, m: int, k: Val, v: Val) {
        let i = self.map_find(m, &k);
        if i >= 0 {
            self.objs[m as usize].elems2[i as usize] = v;
            return;
        }
        let key = self.map_key(&k);
        let pos = self.objs[m as usize].elems.len() as int;
        let kk = if let Val::Num(n) = k {
            if n == 0.0 {
                Val::Num(0.0)
            } else {
                Val::Num(n)
            }
        } else {
            k
        };
        self.objs[m as usize].elems.push(kk);
        self.objs[m as usize].elems2.push(v);
        self.objs[m as usize].attrs.push(0);
        self.objs[m as usize].index.insert(key, pos);
        self.objs[m as usize].pos += 1;
    }

    pub fn map_delete(&mut self, m: int, k: &Val) -> bool {
        let i = self.map_find(m, k);
        if i < 0 {
            return false;
        }
        let key = self.map_key(k);
        self.objs[m as usize].index.remove(&key);
        self.objs[m as usize].attrs[i as usize] = 1;
        self.objs[m as usize].elems[i as usize] = Val::Undef;
        self.objs[m as usize].elems2[i as usize] = Val::Undef;
        self.objs[m as usize].pos -= 1;
        true
    }

    pub fn this_collection(&mut self, this: &Val, class: int, name: &str) -> int {
        let o = obj_of(this);
        if o < 0 || self.objs[o as usize].class != class {
            self.throw_type(format!("Method {} called on incompatible receiver", name).as_str());
            return -1;
        }
        o
    }

    pub fn collection_iter(&mut self, m: int, kind: int) -> Val {
        // a snapshot array iterated by an ITER object
        let mut items: Vec<Val> = Vec::new();
        let n = self.objs[m as usize].elems.len();
        let is_set = self.objs[m as usize].class == C_SET;
        let mut i: usize = 0;
        while i < n {
            if self.objs[m as usize].attrs[i] == 0 {
                let k = self.objs[m as usize].elems[i].clone();
                let v = if is_set { k.clone() } else { self.objs[m as usize].elems2[i].clone() };
                if kind == 0 {
                    items.push(k);
                } else if kind == 1 {
                    items.push(v);
                } else {
                    let p = self.new_array(vec![k, v]);
                    items.push(Val::Obj(p));
                }
            }
            i += 1;
        }
        let arr = self.new_array(items);
        let ip = self.iter_proto;
        let it = self.alloc(C_ITER, ip);
        self.objs[it as usize].env = arr;
        self.objs[it as usize].func = 0;
        Val::Obj(it)
    }

    // ---- property descriptors

    /// One attribute of a property descriptor as its bit: the descriptor's
    /// field when present, else the existing property's, else off (the bit
    /// set: hidden, read-only, fixed).
    pub fn desc_flag(&mut self, d: int, desc: &Val, name: int, bit: int, existing_attr: int) -> int {
        if self.has_atom(d, name) {
            let v = self.get_obj(d, name, desc);
            if truthy(&v) {
                0
            } else {
                bit
            }
        } else if existing_attr >= 0 {
            existing_attr & bit
        } else {
            bit
        }
    }

    pub fn to_descriptor(&mut self, o: int, key: &Val, desc: &Val) {
        if self.objs[o as usize].class == C_PROXY {
            self.proxy_define(o, key.clone(), desc.clone());
            return;
        }
        let d = obj_of(desc);
        if d < 0 {
            self.throw_type("Property description must be an object");
            return;
        }
        let (i, a) = self.to_key(key);
        let atom = if i >= 0 { self.index_atom(i) } else { a };
        let has_get = self.has_atom(d, A_GET);
        let has_set = self.has_atom(d, A_SET);
        let get_v = self.get_obj(d, A_GET, desc);
        let set_v = self.get_obj(d, A_SET, desc);
        let has_value = {
            let a_value = A_VALUE;
            self.has_atom(d, a_value)
        };
        let value = self.get_obj(d, A_VALUE, desc);
        let has_writable = self.has_atom(d, A_WRITABLE);
        if (has_get || has_set) && (has_value || has_writable) {
            self.throw_type("Invalid property descriptor. Cannot both specify accessors and a value or writable attribute");
            return;
        }
        let slot = self.objs[o as usize].find(atom);
        let existing_attr = if slot >= 0 { self.objs[o as usize].attrs[slot as usize] } else { -1 };
        let in_elems = i >= 0 && (self.objs[o as usize].class == C_ARRAY || self.objs[o as usize].class == C_ARGUMENTS) && (i as usize) < self.objs[o as usize].elems.len();
        if slot < 0 && !in_elems && !self.objs[o as usize].extensible && !(self.objs[o as usize].class == C_ARRAY && atom == A_LENGTH) {
            let n = self.atom_str(atom);
            self.throw_type(format!("Cannot define property {}, object is not extensible", n).as_str());
            return;
        }
        let hidden = self.desc_flag(d, desc, A_ENUMERABLE, P_HIDDEN, existing_attr);
        let fixed = self.desc_flag(d, desc, A_CONFIGURABLE, P_FIXED, existing_attr);
        if existing_attr >= 0 && (existing_attr & P_FIXED) != 0 {
            // a non-configurable property (ValidateAndApplyPropertyDescriptor)
            let n = self.atom_str(atom);
            let msg = format!("Cannot redefine property: {}", n);
            if fixed == 0 || (self.has_atom(d, A_ENUMERABLE) && hidden != (existing_attr & P_HIDDEN)) {
                self.throw_type(msg.as_str());
                return;
            }
            let was_accessor = (existing_attr & P_ACCESSOR) != 0;
            if was_accessor {
                if has_value || has_writable {
                    self.throw_type(msg.as_str());
                    return;
                }
                let pair = obj_of(&self.objs[o as usize].vals[slot as usize]);
                let g0 = self.objs[pair as usize].elems[0].clone();
                let s0 = self.objs[pair as usize].elems[1].clone();
                if (has_get && !self.same_value(&get_v, &g0)) || (has_set && !self.same_value(&set_v, &s0)) {
                    self.throw_type(msg.as_str());
                    return;
                }
                return;
            }
            if has_get || has_set {
                self.throw_type(msg.as_str());
                return;
            }
            if (existing_attr & P_READONLY) != 0 {
                let wv = self.get_obj(d, A_WRITABLE, desc);
                if has_writable && truthy(&wv) {
                    self.throw_type(msg.as_str());
                    return;
                }
                let cur = self.objs[o as usize].vals[slot as usize].clone();
                if has_value && !self.same_value(&value, &cur) {
                    self.throw_type(msg.as_str());
                    return;
                }
                return;
            }
        }
        if has_get || has_set {
            if has_get {
                if !matches!(get_v, Val::Undef) && !self.is_callable(&get_v) {
                    self.throw_type("Getter must be a function");
                    return;
                }
                self.define_accessor(o, atom, get_v, 0, false);
            }
            if has_set {
                if !matches!(set_v, Val::Undef) && !self.is_callable(&set_v) {
                    self.throw_type("Setter must be a function");
                    return;
                }
                self.define_accessor(o, atom, set_v, 1, false);
            }
            let s2 = self.objs[o as usize].find(atom);
            self.objs[o as usize].attrs[s2 as usize] = P_ACCESSOR | hidden | fixed;
            return;
        }
        let readonly = self.desc_flag(d, desc, A_WRITABLE, P_READONLY, existing_attr);
        let class = self.objs[o as usize].class;
        if class == C_ARRAY && atom == A_LENGTH {
            if has_value {
                let n = self.to_number(&value);
                self.set_length(o, n);
            }
            if readonly != 0 {
                self.objs[o as usize].extensible = false;
            }
            return;
        }
        if i >= 0 && class == C_ARRAY && (hidden | readonly | fixed) == 0 {
            self.set_index(o, i, value);
            return;
        }
        if i >= 0 && class == C_ARRAY && (i as usize) < self.objs[o as usize].elems.len() {
            // an element with attributes: keep it as a property instead
            let v = if has_value { value.clone() } else { self.objs[o as usize].elems[i as usize].clone() };
            self.objs[o as usize].elems[i as usize] = v.clone();
            return;
        }
        let v = if has_value {
            value
        } else if slot >= 0 && (existing_attr & P_ACCESSOR) == 0 {
            self.objs[o as usize].vals[slot as usize].clone()
        } else {
            Val::Undef
        };
        self.define(o, atom, v, hidden | readonly | fixed);
    }

    pub fn from_descriptor(&mut self, o: int, key: &Val) -> Val {
        if self.objs[o as usize].class == C_PROXY {
            return self.proxy_own_desc(o, key.clone());
        }
        let (i, a) = self.to_key(key);
        let class = self.objs[o as usize].class;
        let d = self.new_object();
        if i >= 0 && (class == C_ARRAY || class == C_ARGUMENTS) && (i as usize) < self.objs[o as usize].elems.len() {
            let v = self.objs[o as usize].elems[i as usize].clone();
            self.objs[d as usize].add(A_VALUE, v, 0);
            self.objs[d as usize].add(A_WRITABLE, Val::Bool(true), 0);
            self.objs[d as usize].add(A_ENUMERABLE, Val::Bool(true), 0);
            self.objs[d as usize].add(A_CONFIGURABLE, Val::Bool(true), 0);
            return Val::Obj(d);
        }
        if i >= 0 && class == C_STRING {
            if let Val::Str(s) = self.objs[o as usize].prim.clone() {
                let c = jsstr::at(s.as_str(), i);
                if c >= 0 {
                    self.objs[d as usize].add(A_VALUE, string_val(jsstr::from_unit(c)), 0);
                    self.objs[d as usize].add(A_WRITABLE, Val::Bool(false), 0);
                    self.objs[d as usize].add(A_ENUMERABLE, Val::Bool(true), 0);
                    self.objs[d as usize].add(A_CONFIGURABLE, Val::Bool(false), 0);
                    return Val::Obj(d);
                }
            }
        }
        let atom = if i >= 0 { self.index_atom(i) } else { a };
        let slot = self.objs[o as usize].find(atom);
        if slot < 0 {
            if (class == C_ARRAY || class == C_STRING) && atom == A_LENGTH {
                let l = self.get_obj(o, A_LENGTH, &Val::Obj(o));
                self.objs[d as usize].add(A_VALUE, l, 0);
                self.objs[d as usize].add(A_WRITABLE, Val::Bool(class == C_ARRAY), 0);
                self.objs[d as usize].add(A_ENUMERABLE, Val::Bool(false), 0);
                self.objs[d as usize].add(A_CONFIGURABLE, Val::Bool(false), 0);
                return Val::Obj(d);
            }
            if class == C_FUNCTION && (atom == A_LENGTH || atom == A_NAME || atom == A_PROTOTYPE) {
                let v = self.get_obj(o, atom, &Val::Obj(o));
                if matches!(v, Val::Undef) {
                    return Val::Undef;
                }
                let is_proto = atom == A_PROTOTYPE;
                self.objs[d as usize].add(A_VALUE, v, 0);
                self.objs[d as usize].add(A_WRITABLE, Val::Bool(is_proto), 0);
                self.objs[d as usize].add(A_ENUMERABLE, Val::Bool(false), 0);
                self.objs[d as usize].add(A_CONFIGURABLE, Val::Bool(!is_proto), 0);
                return Val::Obj(d);
            }
            return Val::Undef;
        }
        let attr = self.objs[o as usize].attrs[slot as usize];
        if (attr & P_ACCESSOR) != 0 {
            let pair = obj_of(&self.objs[o as usize].vals[slot as usize]);
            let g = self.objs[pair as usize].elems[0].clone();
            let s = self.objs[pair as usize].elems[1].clone();
            self.objs[d as usize].add(A_GET, g, 0);
            self.objs[d as usize].add(A_SET, s, 0);
        } else {
            let v = self.objs[o as usize].vals[slot as usize].clone();
            self.objs[d as usize].add(A_VALUE, v, 0);
            self.objs[d as usize].add(A_WRITABLE, Val::Bool((attr & P_READONLY) == 0), 0);
        }
        self.objs[d as usize].add(A_ENUMERABLE, Val::Bool((attr & P_HIDDEN) == 0), 0);
        self.objs[d as usize].add(A_CONFIGURABLE, Val::Bool((attr & P_FIXED) == 0), 0);
        Val::Obj(d)
    }

    // ---- sort

    pub fn sort_compare(&mut self, cmp: &Val, a: &Val, b: &Val) -> double {
        let ua = matches!(a, Val::Undef);
        let ub = matches!(b, Val::Undef);
        if ua && ub {
            return 0.0;
        }
        if ua {
            return 1.0;
        }
        if ub {
            return -1.0;
        }
        if !matches!(cmp, Val::Undef) {
            let r = self.call_value(cmp.clone(), Val::Undef, vec![a.clone(), b.clone()]);
            let n = self.to_number(&r);
            return if is_nan(n) { 0.0 } else { n };
        }
        if let (Val::Num(x), Val::Num(y)) = (a, b) {
            if x == y {
                return 0.0;
            }
            // numbers sort as their strings
            let sx = number_to_string(*x);
            let sy = number_to_string(*y);
            return jsstr::compare(sx.as_str(), sy.as_str()) as double;
        }
        let sa = self.to_str(a);
        let sb = self.to_str(b);
        jsstr::compare(sa.as_str(), sb.as_str()) as double
    }

    /// A stable merge sort; the comparator may throw.
    pub fn merge_sort(&mut self, v: &mut Vec<Val>, cmp: &Val) {
        let n = v.len();
        if n < 2 {
            return;
        }
        let mut src: Vec<Val> = v.clone();
        let mut dst: Vec<Val> = v.clone();
        let mut width: usize = 1;
        while width < n {
            let mut lo: usize = 0;
            while lo < n {
                let mid = if lo + width < n { lo + width } else { n };
                let hi = if lo + 2 * width < n { lo + 2 * width } else { n };
                let mut i = lo;
                let mut j = mid;
                let mut k = lo;
                while i < mid && j < hi {
                    let c = self.sort_compare(cmp, &src[j], &src[i]);
                    if self.throwing {
                        return;
                    }
                    if c < 0.0 {
                        dst[k] = src[j].clone();
                        j += 1;
                    } else {
                        dst[k] = src[i].clone();
                        i += 1;
                    }
                    k += 1;
                }
                while i < mid {
                    dst[k] = src[i].clone();
                    i += 1;
                    k += 1;
                }
                while j < hi {
                    dst[k] = src[j].clone();
                    j += 1;
                    k += 1;
                }
                lo += 2 * width;
            }
            let t = src;
            src = dst;
            dst = t;
            width *= 2;
        }
        *v = src;
    }

    // ---- JSON

    pub fn json_quote(&self, s: &str, out: &mut String) {
        out.push('"');
        for c in s.chars() {
            match c {
                '"' => out.push_str("\\\""),
                '\\' => out.push_str("\\\\"),
                '\n' => out.push_str("\\n"),
                '\r' => out.push_str("\\r"),
                '\t' => out.push_str("\\t"),
                '\u{8}' => out.push_str("\\b"),
                '\u{c}' => out.push_str("\\f"),
                _ => {
                    let cp = c as int;
                    if cp < 32 {
                        out.push_str("\\u");
                        out.push_str(hex_digits(cp, 4, false).as_str());
                    } else {
                        out.push(c);
                    }
                }
            }
        }
        out.push('"');
    }

    pub fn json_str(&mut self, holder: &Val, key: &Val, v0: Val, replacer: &Val, allow: &Vec<String>, gap: &str, indent: &str, stack: &mut Vec<int>, out: &mut String) -> bool {
        let mut v = v0;
        if is_obj(&v) || matches!(v, Val::Num(_)) {
            let tj = if is_obj(&v) { self.get(&v, A_TOJSON) } else { Val::Undef };
            if self.is_callable(&tj) {
                v = self.call_value(tj, v.clone(), vec![key.clone()]);
                if self.throwing {
                    return false;
                }
            }
        }
        if self.is_callable(replacer) {
            v = self.call_value(replacer.clone(), holder.clone(), vec![key.clone(), v.clone()]);
            if self.throwing {
                return false;
            }
        }
        if let Val::Obj(o) = &v {
            let c = self.objs[*o as usize].class;
            if c == C_NUMBER || c == C_STRING || c == C_BOOLEAN {
                v = if c == C_NUMBER {
                    let n = self.to_number(&v);
                    Val::Num(n)
                } else if c == C_STRING {
                    let s = self.to_str(&v);
                    Val::Str(s)
                } else {
                    self.objs[*o as usize].prim.clone()
                };
            }
        }
        match &v {
            Val::Null => {
                out.push_str("null");
                return true;
            }
            Val::Bool(b) => {
                out.push_str(if *b { "true" } else { "false" });
                return true;
            }
            Val::Str(s) => {
                self.json_quote(s.as_str(), out);
                return true;
            }
            Val::Num(n) => {
                if is_finite(*n) {
                    out.push_str(number_to_string(*n).as_str());
                } else {
                    out.push_str("null");
                }
                return true;
            }
            Val::Undef => return false,
            Val::Obj(o) => {
                let o = *o;
                if self.is_callable(&v) || self.objs[o as usize].class == C_SYMBOL {
                    return false;
                }
                for s in stack.iter() {
                    if *s == o {
                        self.throw_type("Converting circular structure to JSON");
                        return false;
                    }
                }
                stack.push(o);
                let inner = format!("{}{}", indent, gap);
                let class = self.objs[o as usize].class;
                if class == C_ARRAY {
                    let n = self.len_of(&v);
                    out.push('[');
                    let mut i: int = 0;
                    while i < n {
                        if i > 0 {
                            out.push(',');
                        }
                        if !gap.is_empty() {
                            out.push('\n');
                            out.push_str(inner.as_str());
                        }
                        let item = self.get_index(&v, i);
                        let k = string_val(format!("{}", i));
                        let mut part = String::new();
                        let ok = self.json_str(&v, &k, item, replacer, allow, gap, inner.as_str(), stack, &mut part);
                        if self.throwing {
                            return false;
                        }
                        if ok {
                            out.push_str(part.as_str());
                        } else {
                            out.push_str("null");
                        }
                        i += 1;
                    }
                    if n > 0 && !gap.is_empty() {
                        out.push('\n');
                        out.push_str(indent);
                    }
                    out.push(']');
                } else {
                    let keys = if allow.is_empty() {
                        self.own_keys(o, false, false)
                    } else {
                        let mut ks: Vec<Val> = Vec::new();
                        for a in allow.iter() {
                            ks.push(str_val(a.as_str()));
                        }
                        ks
                    };
                    out.push('{');
                    let mut first = true;
                    for k in keys {
                        let item = self.get_elem(&v, &k);
                        if self.throwing {
                            return false;
                        }
                        let mut part = String::new();
                        let ok = self.json_str(&v, &k, item, replacer, allow, gap, inner.as_str(), stack, &mut part);
                        if self.throwing {
                            return false;
                        }
                        if !ok {
                            continue;
                        }
                        if !first {
                            out.push(',');
                        }
                        first = false;
                        if !gap.is_empty() {
                            out.push('\n');
                            out.push_str(inner.as_str());
                        }
                        let ks = self.to_string(&k);
                        self.json_quote(ks.as_str(), out);
                        out.push(':');
                        if !gap.is_empty() {
                            out.push(' ');
                        }
                        out.push_str(part.as_str());
                    }
                    if !first && !gap.is_empty() {
                        out.push('\n');
                        out.push_str(indent);
                    }
                    out.push('}');
                }
                stack.pop();
                true
            }
        }
    }

    pub fn json_parse_value(&mut self, cs: &Vec<char>, pos: &mut usize) -> Val {
        self.json_ws(cs, pos);
        if *pos >= cs.len() {
            self.throw_syntax("Unexpected end of JSON input");
            return Val::Undef;
        }
        let c = cs[*pos];
        if c == '{' {
            *pos += 1;
            let o = self.new_object();
            self.temp_roots.push(Val::Obj(o));
            self.json_ws(cs, pos);
            if *pos < cs.len() && cs[*pos] == '}' {
                *pos += 1;
                self.temp_roots.pop();
                return Val::Obj(o);
            }
            loop {
                self.json_ws(cs, pos);
                if *pos >= cs.len() || cs[*pos] != '"' {
                    self.throw_syntax("Unexpected token in JSON");
                    self.temp_roots.pop();
                    return Val::Undef;
                }
                let k = self.json_string(cs, pos);
                if self.throwing {
                    self.temp_roots.pop();
                    return Val::Undef;
                }
                self.json_ws(cs, pos);
                if *pos >= cs.len() || cs[*pos] != ':' {
                    self.throw_syntax("Expected ':' in JSON");
                    self.temp_roots.pop();
                    return Val::Undef;
                }
                *pos += 1;
                let v = self.json_parse_value(cs, pos);
                if self.throwing {
                    self.temp_roots.pop();
                    return Val::Undef;
                }
                let kv = string_val(k);
                self.define_elem(o, &kv, v, 0);
                self.json_ws(cs, pos);
                if *pos < cs.len() && cs[*pos] == ',' {
                    *pos += 1;
                    continue;
                }
                if *pos < cs.len() && cs[*pos] == '}' {
                    *pos += 1;
                    break;
                }
                self.throw_syntax("Unexpected token in JSON");
                self.temp_roots.pop();
                return Val::Undef;
            }
            self.temp_roots.pop();
            return Val::Obj(o);
        }
        if c == '[' {
            *pos += 1;
            let a = self.new_array(Vec::new());
            self.temp_roots.push(Val::Obj(a));
            self.json_ws(cs, pos);
            if *pos < cs.len() && cs[*pos] == ']' {
                *pos += 1;
                self.temp_roots.pop();
                return Val::Obj(a);
            }
            loop {
                let v = self.json_parse_value(cs, pos);
                if self.throwing {
                    self.temp_roots.pop();
                    return Val::Undef;
                }
                self.objs[a as usize].elems.push(v);
                self.json_ws(cs, pos);
                if *pos < cs.len() && cs[*pos] == ',' {
                    *pos += 1;
                    continue;
                }
                if *pos < cs.len() && cs[*pos] == ']' {
                    *pos += 1;
                    break;
                }
                self.throw_syntax("Unexpected token in JSON");
                self.temp_roots.pop();
                return Val::Undef;
            }
            self.temp_roots.pop();
            return Val::Obj(a);
        }
        if c == '"' {
            let s = self.json_string(cs, pos);
            return string_val(s);
        }
        if c == 't' || c == 'f' || c == 'n' {
            let words = vec![("true", Val::Bool(true)), ("false", Val::Bool(false)), ("null", Val::Null)];
            for (w, v) in words {
                let wc = w.chars().collect::<Vec<char>>();
                let mut ok = *pos + wc.len() <= cs.len();
                let mut i: usize = 0;
                while ok && i < wc.len() {
                    if cs[*pos + i] != wc[i] {
                        ok = false;
                    }
                    i += 1;
                }
                if ok {
                    *pos += wc.len();
                    return v;
                }
            }
            self.throw_syntax("Unexpected token in JSON");
            return Val::Undef;
        }
        if c == '-' || (c >= '0' && c <= '9') {
            let start = *pos;
            if cs[*pos] == '-' {
                *pos += 1;
            }
            if *pos < cs.len() && cs[*pos] == '0' && *pos + 1 < cs.len() && cs[*pos + 1] >= '0' && cs[*pos + 1] <= '9' {
                self.throw_syntax("Unexpected number in JSON");
                return Val::Undef;
            }
            while *pos < cs.len() && ((cs[*pos] >= '0' && cs[*pos] <= '9') || cs[*pos] == '.' || cs[*pos] == 'e' || cs[*pos] == 'E' || cs[*pos] == '+' || cs[*pos] == '-') {
                *pos += 1;
            }
            let mut t = String::new();
            let mut i = start;
            while i < *pos {
                t.push(cs[i]);
                i += 1;
            }
            let n = string_to_number(t.as_str());
            if is_nan(n) {
                self.throw_syntax("Unexpected number in JSON");
                return Val::Undef;
            }
            return Val::Num(n);
        }
        self.throw_syntax(format!("Unexpected token '{}' in JSON", c).as_str());
        Val::Undef
    }

    pub fn json_ws(&self, cs: &Vec<char>, pos: &mut usize) {
        while *pos < cs.len() && (cs[*pos] == ' ' || cs[*pos] == '\t' || cs[*pos] == '\n' || cs[*pos] == '\r') {
            *pos += 1;
        }
    }

    pub fn json_string(&mut self, cs: &Vec<char>, pos: &mut usize) -> String {
        *pos += 1;
        let mut s = String::new();
        while *pos < cs.len() {
            let c = cs[*pos];
            if c == '"' {
                *pos += 1;
                return s;
            }
            if (c as int) < 32 {
                self.throw_syntax("Bad control character in string literal in JSON");
                return s;
            }
            if c == '\\' {
                *pos += 1;
                if *pos >= cs.len() {
                    break;
                }
                let e = cs[*pos];
                *pos += 1;
                match e {
                    'n' => s.push('\n'),
                    't' => s.push('\t'),
                    'r' => s.push('\r'),
                    'b' => s.push('\u{8}'),
                    'f' => s.push('\u{c}'),
                    '/' => s.push('/'),
                    '\\' => s.push('\\'),
                    '"' => s.push('"'),
                    'u' => {
                        let mut v: int = 0;
                        let mut k = 0;
                        while k < 4 && *pos < cs.len() {
                            let h = cs[*pos];
                            let d = if h >= '0' && h <= '9' {
                                (h as int) - 48
                            } else if h >= 'a' && h <= 'f' {
                                (h as int) - 87
                            } else if h >= 'A' && h <= 'F' {
                                (h as int) - 55
                            } else {
                                -1
                            };
                            if d < 0 {
                                self.throw_syntax("Bad Unicode escape in JSON");
                                return s;
                            }
                            v = v * 16 + d;
                            *pos += 1;
                            k += 1;
                        }
                        // a surrogate pair written as two escapes
                        if v >= 0xd800 && v <= 0xdbff && *pos + 5 < cs.len() && cs[*pos] == '\\' && cs[*pos + 1] == 'u' {
                            let mut lo: int = 0;
                            let mut j = 2;
                            let mut ok = true;
                            while j < 6 {
                                let h = cs[*pos + j];
                                let d = if h >= '0' && h <= '9' {
                                    (h as int) - 48
                                } else if h >= 'a' && h <= 'f' {
                                    (h as int) - 87
                                } else if h >= 'A' && h <= 'F' {
                                    (h as int) - 55
                                } else {
                                    -1
                                };
                                if d < 0 {
                                    ok = false;
                                    break;
                                }
                                lo = lo * 16 + d;
                                j += 1;
                            }
                            if ok && lo >= 0xdc00 && lo <= 0xdfff {
                                *pos += 6;
                                v = 0x10000 + ((v - 0xd800) << 10) + (lo - 0xdc00);
                            }
                        }
                        jsstr::push_cp(&mut s, v);
                    }
                    _ => {
                        self.throw_syntax("Bad escaped character in JSON");
                        return s;
                    }
                }
                continue;
            }
            s.push(c);
            *pos += 1;
        }
        self.throw_syntax("Unterminated string in JSON");
        s
    }

    pub fn json_revive(&mut self, holder: &Val, key: &Val, reviver: &Val) -> Val {
        let v = self.get_elem(holder, key);
        if let Val::Obj(o) = &v {
            let keys = self.own_keys(*o, false, false);
            for k in keys {
                let nv = self.json_revive(&v, &k, reviver);
                if self.throwing {
                    return Val::Undef;
                }
                if matches!(nv, Val::Undef) {
                    self.delete(*o, &k);
                } else {
                    self.define_elem(*o, &k, nv, 0);
                }
            }
        }
        self.call_value(reviver.clone(), holder.clone(), vec![key.clone(), v])
    }

    // ---- Date

    pub fn date_value(&mut self, this: &Val) -> double {
        let o = obj_of(this);
        if o < 0 || self.objs[o as usize].class != C_DATE {
            self.throw_type("this is not a Date object.");
            return nan();
        }
        match self.objs[o as usize].prim {
            Val::Num(n) => n,
            _ => nan(),
        }
    }

    pub fn make_time(fields: &Vec<double>) -> double {
        // [year, month, day, h, m, s, ms]
        for f in fields.iter() {
            if !is_finite(*f) {
                return nan();
            }
        }
        let y = to_integer(fields[0]);
        let m = to_integer(fields[1]);
        let ym = y + (m / 12.0).floor();
        let mn = m - (m / 12.0).floor() * 12.0;
        let days = days_from_civil(ym as int, (mn as int) + 1, 1) as double + to_integer(fields[2]) - 1.0;
        let t = days * 86400000.0 + to_integer(fields[3]) * 3600000.0 + to_integer(fields[4]) * 60000.0 + to_integer(fields[5]) * 1000.0 + to_integer(fields[6]);
        if t.abs() > 8.64e15 {
            return nan();
        }
        t
    }

    pub fn time_fields(t: double) -> Vec<double> {
        // days and the time of day in doubles: ms since 1970 do not fit a
        // 32-bit int
        let dayd = (t / 86400000.0).floor();
        let day = dayd as int;
        let rem = (t - dayd * 86400000.0) as int;
        let (y, m, d) = civil_from_days(day);
        let wd = ((day % 7) + 11) % 7;
        vec![
            y as double,
            (m - 1) as double,
            d as double,
            wd as double,
            (rem / 3600000) as double,
            ((rem / 60000) % 60) as double,
            ((rem / 1000) % 60) as double,
            (rem % 1000) as double,
        ]
    }

    pub fn iso_string(t: double) -> String {
        let f = Vm::time_fields(t);
        let y = f[0] as int;
        let ys = if y >= 0 && y <= 9999 {
            format!("{:04}", y)
        } else if y < 0 {
            format!("-{:06}", -y)
        } else {
            format!("+{:06}", y)
        };
        format!("{}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z", ys, (f[1] as int) + 1, f[2] as int, f[4] as int, f[5] as int, f[6] as int, f[7] as int)
    }

    pub fn parse_date(s: &str) -> double {
        // ISO forms: YYYY, YYYY-MM, YYYY-MM-DD, with THH:mm(:ss(.sss))(Z|±hh:mm)
        let cs = s.trim().chars().collect::<Vec<char>>();
        let n = cs.len();
        let mut i: usize = 0;
        let mut nums: Vec<double> = vec![1970.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
        let read = |i: &mut usize, count: usize| -> int {
            let mut v: int = 0;
            let mut k = 0;
            while k < count {
                if *i >= n || cs[*i] < '0' || cs[*i] > '9' {
                    return -1;
                }
                v = v * 10 + ((cs[*i] as int) - 48);
                *i += 1;
                k += 1;
            }
            v
        };
        let mut sign: int = 1;
        let y: int;
        if i < n && (cs[i] == '+' || cs[i] == '-') {
            sign = if cs[i] == '-' { -1 } else { 1 };
            i += 1;
            y = read(&mut i, 6);
        } else {
            y = read(&mut i, 4);
        }
        if y < 0 {
            return nan();
        }
        nums[0] = (sign * y) as double;
        if i < n && cs[i] == '-' {
            i += 1;
            let m = read(&mut i, 2);
            if m < 1 || m > 12 {
                return nan();
            }
            nums[1] = (m - 1) as double;
            if i < n && cs[i] == '-' {
                i += 1;
                let d = read(&mut i, 2);
                if d < 1 || d > 31 {
                    return nan();
                }
                nums[2] = d as double;
            }
        }
        let mut offset: double = 0.0;
        if i < n && (cs[i] == 'T' || cs[i] == ' ') {
            i += 1;
            let h = read(&mut i, 2);
            if h < 0 || i >= n || cs[i] != ':' {
                return nan();
            }
            i += 1;
            let mi = read(&mut i, 2);
            if mi < 0 {
                return nan();
            }
            nums[3] = h as double;
            nums[4] = mi as double;
            if i < n && cs[i] == ':' {
                i += 1;
                let sec = read(&mut i, 2);
                if sec < 0 {
                    return nan();
                }
                nums[5] = sec as double;
                if i < n && cs[i] == '.' {
                    i += 1;
                    let mut frac: double = 0.0;
                    let mut scale: double = 100.0;
                    while i < n && cs[i] >= '0' && cs[i] <= '9' {
                        frac += (((cs[i] as int) - 48) as double) * scale;
                        scale /= 10.0;
                        i += 1;
                    }
                    nums[6] = frac.floor();
                }
            }
            if i < n && cs[i] == 'Z' {
                i += 1;
            } else if i < n && (cs[i] == '+' || cs[i] == '-') {
                let sg: double = if cs[i] == '-' { -1.0 } else { 1.0 };
                i += 1;
                let oh = read(&mut i, 2);
                if i < n && cs[i] == ':' {
                    i += 1;
                }
                let om = read(&mut i, 2);
                if oh < 0 || om < 0 {
                    return nan();
                }
                offset = sg * ((oh * 60 + om) as double) * 60000.0;
            }
        }
        if i != n {
            return nan();
        }
        Vm::make_time(&nums) - offset
    }

    // ---- promises

    pub fn new_promise(&mut self) -> int {
        let pp = self.promise_proto;
        let p = self.alloc(C_PROMISE, pp);
        // pos: 0 pending, 1 fulfilled, 2 rejected; prim: the value;
        // elems: reactions [onFulfilled, onRejected, derived promise]*
        p
    }

    pub fn settle(&mut self, p: int, state: int, v: Val) {
        if self.objs[p as usize].pos != 0 {
            return;
        }
        if state == 1 {
            // resolving with a thenable adopts its state
            if let Val::Obj(o) = &v {
                if *o == p {
                    let e = self.new_error(self.type_error_proto, "Chaining cycle detected for promise");
                    self.settle(p, 2, Val::Obj(e));
                    return;
                }
                let then = self.get(&v, A_THEN);
                if self.throwing {
                    self.throwing = false;
                    let e = self.exc.clone();
                    self.settle(p, 2, e);
                    return;
                }
                if self.is_callable(&then) {
                    let (res, rej) = self.resolving_functions(p);
                    self.jobs.push(then);
                    self.jobs.push(v.clone());
                    self.jobs.push(Val::Obj(res));
                    self.jobs.push(Val::Obj(rej));
                    return;
                }
            }
        }
        self.objs[p as usize].pos = state;
        self.objs[p as usize].prim = v.clone();
        let reactions = self.objs[p as usize].elems.clone();
        self.objs[p as usize].elems = Vec::new();
        let mut i: usize = 0;
        while i + 2 < reactions.len() {
            self.queue_reaction(reactions[i].clone(), reactions[i + 1].clone(), reactions[i + 2].clone(), state, v.clone());
            i += 3;
        }
    }

    pub fn resolving_functions(&mut self, p: int) -> (int, int) {
        let res = self.native_fn("", NF_PR_RESOLVE_FN, 1);
        self.objs[res as usize].env = p;
        let rej = self.native_fn("", NF_PR_REJECT_FN, 1);
        self.objs[rej as usize].env = p;
        // shared "already resolved" flag: both point at one cell
        let cell = self.alloc(C_OBJECT, -1);
        self.objs[res as usize].home = cell;
        self.objs[rej as usize].home = cell;
        (res, rej)
    }

    pub fn queue_reaction(&mut self, on_ok: Val, on_err: Val, derived: Val, state: int, v: Val) {
        // a job: [handler, value, derived promise, state]
        let h = if state == 1 { on_ok } else { on_err };
        self.jobs.push(Val::Num(-(state as double)));
        self.jobs.push(h);
        self.jobs.push(v);
        self.jobs.push(derived);
    }

    /// Runs queued promise jobs until none are left.
    pub fn run_jobs(&mut self) {
        let mut guard: int = 0;
        while !self.jobs.is_empty() && guard < 10000000 {
            guard += 1;
            let a = self.jobs.remove(0);
            let b = self.jobs.remove(0);
            let c = self.jobs.remove(0);
            let d = self.jobs.remove(0);
            if let Val::Num(neg) = a {
                // a reaction
                let state = (-neg) as int;
                let derived = obj_of(&d);
                if self.is_callable(&b) {
                    let r = self.call_value(b, Val::Undef, vec![c]);
                    if self.throwing {
                        self.throwing = false;
                        let e = self.exc.clone();
                        self.exc = Val::Undef;
                        if derived >= 0 {
                            self.settle(derived, 2, e);
                        }
                    } else if derived >= 0 {
                        self.settle(derived, 1, r);
                    }
                } else if derived >= 0 {
                    self.settle(derived, state, c);
                }
            } else if matches!(b, Val::Undef) && matches!(c, Val::Undef) && matches!(d, Val::Undef) {
                // queueMicrotask
                self.call_value(a, Val::Undef, Vec::new());
                if self.throwing {
                    self.throwing = false;
                    self.exc = Val::Undef;
                }
            } else {
                // thenable job: then.call(thenable, resolve, reject)
                self.call_value(a, b, vec![c, d.clone()]);
                if self.throwing {
                    self.throwing = false;
                    let e = self.exc.clone();
                    self.exc = Val::Undef;
                    self.call_value(d, Val::Undef, vec![e]);
                    self.throwing = false;
                }
            }
        }
    }

    pub fn promise_then(&mut self, p: int, on_ok: Val, on_err: Val) -> Val {
        let d = self.new_promise();
        let state = self.objs[p as usize].pos;
        if state == 0 {
            self.objs[p as usize].elems.push(on_ok);
            self.objs[p as usize].elems.push(on_err);
            self.objs[p as usize].elems.push(Val::Obj(d));
        } else {
            let v = self.objs[p as usize].prim.clone();
            self.queue_reaction(on_ok, on_err, Val::Obj(d), state, v);
        }
        Val::Obj(d)
    }

    // ---- URI

    pub fn uri_encode(&mut self, s: &str, keep: &str) -> Val {
        let mut out = String::new();
        for c in s.chars() {
            let plain = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || "-_.!~*'()".contains(c) || keep.contains(c);
            if plain {
                out.push(c);
                continue;
            }
            let mut buf = String::new();
            buf.push(c);
            for b in buf.bytes() {
                let v = b as int;
                out.push('%');
                out.push(hexch(v >> 4));
                out.push(hexch(v & 15));
            }
        }
        string_val(out)
    }

    pub fn uri_decode(&mut self, s: &str, reserved: &str) -> Val {
        let cs = s.chars().collect::<Vec<char>>();
        let mut out = String::new();
        let n = cs.len();
        let mut i: usize = 0;
        while i < n {
            let c = cs[i];
            if c != '%' {
                out.push(c);
                i += 1;
                continue;
            }
            // one UTF-8 sequence of %XX escapes
            let mut bytes: Vec<int> = Vec::new();
            let mut j = i;
            let mut need: usize = 1;
            while j + 2 < n {
                if cs[j] != '%' {
                    break;
                }
                let h = hexval(cs[j + 1]);
                let l = hexval(cs[j + 2]);
                if h < 0 || l < 0 {
                    break;
                }
                bytes.push(h * 16 + l);
                j += 3;
                let lead = bytes[0];
                need = if lead < 128 {
                    1
                } else if lead >= 240 {
                    4
                } else if lead >= 224 {
                    3
                } else if lead >= 192 {
                    2
                } else {
                    0
                };
                if bytes.len() >= need {
                    break;
                }
            }
            if bytes.is_empty() || need == 0 || bytes.len() < need {
                self.throw_uri();
                return Val::Undef;
            }
            let cp = utf8_decode(&bytes);
            if cp < 0 {
                self.throw_uri();
                return Val::Undef;
            }
            let mut t = String::new();
            jsstr::push_cp(&mut t, cp);
            if need == 1 && reserved.contains(t.as_str()) {
                let mut k = i;
                while k < j {
                    out.push(cs[k]);
                    k += 1;
                }
            } else {
                out.push_str(t.as_str());
            }
            i = j;
        }
        string_val(out)
    }

    pub fn throw_uri(&mut self) {
        let p = self.error_ctor_proto(6);
        let e = self.new_error(p, "URI malformed");
        self.throw_val(Val::Obj(e));
    }

    // ---- the dispatch

    pub fn call_native(&mut self, id: int, fobj: int, this: Val, args: Vec<Val>, construct: bool, new_target: Val) -> Val {
        if id >= NF_MATH && id < NF_MATH + 40 {
            return self.math(id - NF_MATH, &args);
        }
        if id >= crate::typed::NF_TA_FIRST && id <= crate::typed::NF_TA_LAST {
            return self.call_typed(id, &args);
        }
        if id >= crate::intl::NF_INTL_FIRST && id <= crate::intl::NF_INTL_LAST {
            return self.call_intl(id, &args);
        }
        if id == NF_AP_POP || id == NF_AP_SHIFT || id == NF_AP_UNSHIFT || id == NF_AP_SPLICE || id == NF_AP_REVERSE || id == NF_AP_SORT || id == NF_AP_FILL || id == NF_AP_COPYWITHIN {
            // the in-place methods on a frozen array
            if let Val::Obj(o) = &this {
                let ob = &self.objs[*o as usize];
                if ob.class == C_ARRAY && ob.pos == 2 {
                    let n = ob.elems.len();
                    let msg = if n == 0 && (id == NF_AP_POP || id == NF_AP_SHIFT) {
                        String::from("Cannot assign to read only property 'length' of object '[object Array]'")
                    } else if id == NF_AP_POP {
                        format!("Cannot delete property '{}' of [object Array]", n - 1)
                    } else if id == NF_AP_UNSHIFT && !args.is_empty() {
                        format!("Cannot add property {}, object is not extensible", n)
                    } else if n > 0 {
                        String::from("Cannot assign to read only property '0' of object '[object Array]'")
                    } else {
                        String::new()
                    };
                    if !msg.is_empty() {
                        self.throw_type(msg.as_str());
                        return Val::Undef;
                    }
                }
            }
        }
        if id >= NF_ERROR && id < NF_ERROR + 8 {
            let kind = id - NF_ERROR;
            let dflt = self.error_ctor_proto(kind);
            let proto = if construct { self.proto_from(&new_target, dflt) } else { dflt };
            let e = self.alloc(C_ERROR, proto);
            let mut mi: usize = 0;
            if kind == 7 {
                let errs = arg(&args, 0);
                let items = self.iterable_to_vec(&errs);
                let arr = self.new_array(items);
                self.objs[e as usize].add(A_ERRORS, Val::Obj(arr), P_HIDDEN);
                mi = 1;
            }
            let m = arg(&args, mi);
            if !matches!(m, Val::Undef) {
                let ms = self.to_str(&m);
                self.objs[e as usize].add(A_MESSAGE, Val::Str(ms), P_HIDDEN);
            }
            let opts = arg(&args, mi + 1);
            if let Val::Obj(oo) = &opts {
                if self.has_atom(*oo, A_CAUSE) {
                    let c = self.get(&opts, A_CAUSE);
                    self.objs[e as usize].add(A_CAUSE, c, P_HIDDEN);
                }
            }
            return Val::Obj(e);
        }
        if id >= NF_DP_GET && id < NF_DP_GET + 20 {
            let t = self.date_value(&this);
            if self.throwing {
                return Val::Undef;
            }
            let field = id - NF_DP_GET;
            if field == 8 {
                return Val::Num(t);
            }
            if field == 9 {
                return Val::Num(0.0);
            }
            if is_nan(t) {
                return Val::Num(nan());
            }
            let f = Vm::time_fields(t);
            let v = match field {
                0 => f[0],
                1 => f[1],
                2 => f[2],
                3 => f[3],
                4 => f[4],
                5 => f[5],
                6 => f[6],
                7 => f[7],
                10 => f[0] - 1900.0,
                _ => nan(),
            };
            return Val::Num(v);
        }
        if id >= NF_DP_SET && id < NF_DP_SET + 20 {
            let t = self.date_value(&this);
            if self.throwing {
                return Val::Undef;
            }
            let field = id - NF_DP_SET;
            let o = obj_of(&this);
            if field == 8 {
                let n = self.to_number(&arg(&args, 0));
                // TimeClip: + 0 turns -0 into +0
                let v = if is_finite(n) && n.abs() <= 8.64e15 { to_integer(n) + 0.0 } else { nan() };
                self.objs[o as usize].prim = Val::Num(v);
                return Val::Num(v);
            }
            let f = if is_nan(t) { Vm::time_fields(0.0) } else { Vm::time_fields(t) };
            let mut parts = vec![f[0], f[1], f[2], f[4], f[5], f[6], f[7]];
            // which slot the first argument sets, and how many follow
            let (start, count) = match field {
                0 => (0, 3),
                1 => (1, 2),
                2 => (2, 1),
                4 => (3, 4),
                5 => (4, 3),
                6 => (5, 2),
                7 => (6, 1),
                10 => (0, 1),
                _ => (0, 0),
            };
            let mut k: usize = 0;
            while k < count && k < args.len() {
                let n = self.to_number(&args[k]);
                parts[start + k] = n;
                k += 1;
            }
            if field == 10 {
                let y = parts[0];
                if y >= 0.0 && y <= 99.0 {
                    parts[0] = y + 1900.0;
                }
            }
            if is_nan(t) && field != 0 && field != 10 {
                // an invalid date stays invalid, except through the year
                return Val::Num(nan());
            }
            let v = Vm::make_time(&parts);
            self.objs[o as usize].prim = Val::Num(v);
            return Val::Num(v);
        }
        let a0 = arg(&args, 0);
        match id {
            NF_NOOP => Val::Undef,
            NF_PRINT => {
                let mut line = String::new();
                let mut i: usize = 0;
                while i < args.len() {
                    if i > 0 {
                        line.push(' ');
                    }
                    let s = self.display(&args[i]);
                    line.push_str(s.as_str());
                    i += 1;
                }
                if self.echo {
                    println!("{}", line);
                }
                self.out.push(line);
                Val::Undef
            }
            NF_GC => {
                if self.native_depth <= 1 {
                    // collected at the next safe point
                    self.alloc_count = self.gc_threshold;
                }
                Val::Undef
            }
            NF_PERF_NOW => Val::Num(now_ms()),
            NF_PARSEINT => {
                let s = self.to_string(&a0);
                let r = arg(&args, 1);
                let radix = if matches!(r, Val::Undef) { 0 } else { to_int32(self.to_number(&r)) };
                Val::Num(parse_int(s.as_str(), radix))
            }
            NF_PARSEFLOAT => {
                let s = self.to_string(&a0);
                Val::Num(parse_float(s.as_str()))
            }
            NF_ISNAN => {
                let n = self.to_number(&a0);
                Val::Bool(is_nan(n))
            }
            NF_ISFINITE => {
                let n = self.to_number(&a0);
                Val::Bool(is_finite(n))
            }
            NF_ENCODE_URI_COMPONENT => {
                let s = self.to_string(&a0);
                self.uri_encode(s.as_str(), "")
            }
            NF_ENCODE_URI => {
                let s = self.to_string(&a0);
                self.uri_encode(s.as_str(), ";/?:@&=+$,#")
            }
            NF_DECODE_URI_COMPONENT => {
                let s = self.to_string(&a0);
                self.uri_decode(s.as_str(), "")
            }
            NF_DECODE_URI => {
                let s = self.to_string(&a0);
                self.uri_decode(s.as_str(), ";/?:@&=+$,#")
            }
            NF_ESCAPE => {
                let s = self.to_string(&a0);
                let mut out = String::new();
                for u in jsstr::units(s.as_str()) {
                    let c = u;
                    let plain = (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c == 64 || c == 42 || c == 95 || c == 43 || c == 45 || c == 46 || c == 47;
                    if plain {
                        jsstr::push_cp(&mut out, c);
                    } else if c < 256 {
                        out.push('%');
                        out.push_str(hex_digits(c, 2, true).as_str());
                    } else {
                        out.push_str("%u");
                        out.push_str(hex_digits(c, 4, true).as_str());
                    }
                }
                string_val(out)
            }
            NF_UNESCAPE => {
                let s = self.to_string(&a0);
                let u = jsstr::units(s.as_str());
                let mut out: Vec<int> = Vec::new();
                let n = u.len();
                let mut i: usize = 0;
                while i < n {
                    if u[i] == 37 && i + 5 < n + 0 && u[i + 1] == 117 {
                        let mut v: int = 0;
                        let mut ok = true;
                        let mut k = 2;
                        while k < 6 {
                            let h = hexval_unit(u[i + k]);
                            if h < 0 {
                                ok = false;
                            }
                            v = v * 16 + h;
                            k += 1;
                        }
                        if ok {
                            out.push(v);
                            i += 6;
                            continue;
                        }
                    }
                    if u[i] == 37 && i + 2 < n {
                        let h = hexval_unit(u[i + 1]);
                        let l = hexval_unit(u[i + 2]);
                        if h >= 0 && l >= 0 {
                            out.push(h * 16 + l);
                            i += 3;
                            continue;
                        }
                    }
                    out.push(u[i]);
                    i += 1;
                }
                let len = out.len() as int;
                string_val(jsstr::from_units(&out, 0, len))
            }
            NF_QUEUE_MICROTASK => {
                self.jobs.push(a0);
                self.jobs.push(Val::Undef);
                self.jobs.push(Val::Undef);
                self.jobs.push(Val::Undef);
                Val::Undef
            }
            NF_PROXY => {
                if !construct {
                    self.throw_type("Constructor Proxy requires 'new'");
                    return Val::Undef;
                }
                let a1 = arg(&args, 1);
                self.make_proxy(&a0, &a1)
            }
            NF_PROXY_REVOCABLE => {
                let a1 = arg(&args, 1);
                let p = self.make_proxy(&a0, &a1);
                if self.throwing {
                    return Val::Undef;
                }
                let r = self.new_object();
                self.temp_roots.push(Val::Obj(r));
                let a_proxy = self.intern("proxy");
                self.objs[r as usize].add(a_proxy, p.clone(), 0);
                let rv = self.native_fn("", NF_PROXY_REVOKE, 0);
                self.objs[rv as usize].env = obj_of(&p);
                let a_revoke = self.intern("revoke");
                self.objs[r as usize].add(a_revoke, Val::Obj(rv), 0);
                self.temp_roots.pop();
                Val::Obj(r)
            }
            NF_PROXY_REVOKE => {
                let p = self.objs[fobj as usize].env;
                self.revoke_proxy(p);
                self.objs[fobj as usize].env = -1;
                Val::Undef
            }
            NF_GEN_NEXT | NF_GEN_THROW | NF_GEN_RETURN => {
                let g = obj_of(&this);
                if g < 0 || self.objs[g as usize].class != C_GENERATOR {
                    self.throw_type("next method called on incompatible receiver");
                    return Val::Undef;
                }
                let mode = if id == NF_GEN_NEXT { 0 } else if id == NF_GEN_THROW { 1 } else { 2 };
                self.gen_resume(g, mode, a0)
            }
            NF_EVAL => {
                // an indirect eval: global code
                if let Val::Str(s) = &a0 {
                    let src = s.as_ref().clone();
                    return self.eval_indirect(src.as_str());
                }
                a0
            }
            NF_FUNCTION => {
                // new Function(p1, …, body): the source Node builds, as
                // global code
                let mut params = String::new();
                let mut body = String::new();
                let mut i: usize = 0;
                while i < args.len() {
                    let t = self.to_string(&args[i]);
                    if self.throwing {
                        return Val::Undef;
                    }
                    if i + 1 == args.len() {
                        body = t;
                    } else {
                        if i > 0 {
                            params.push(',');
                        }
                        params.push_str(t.as_str());
                    }
                    i += 1;
                }
                let src = format!("(function anonymous({}\n) {{\n{}\n}})", params, body);
                self.eval_indirect(src.as_str())
            }
            NF_STRING => {
                let s = if args.is_empty() {
                    Rc::new(String::new())
                } else if !construct && self.class_of(&a0) == C_SYMBOL {
                    Rc::new(self.display(&a0))
                } else {
                    self.to_str(&a0)
                };
                if construct {
                    let proto = self.proto_from(&new_target, self.string_proto);
                    let o = self.alloc(C_STRING, proto);
                    self.objs[o as usize].prim = Val::Str(s);
                    return Val::Obj(o);
                }
                Val::Str(s)
            }
            NF_NUMBER => {
                let n = if args.is_empty() { 0.0 } else { self.to_number(&a0) };
                if construct {
                    let proto = self.proto_from(&new_target, self.number_proto);
                    let o = self.alloc(C_NUMBER, proto);
                    self.objs[o as usize].prim = Val::Num(n);
                    return Val::Obj(o);
                }
                Val::Num(n)
            }
            NF_BOOLEAN => {
                let b = truthy(&a0);
                if construct {
                    let proto = self.proto_from(&new_target, self.boolean_proto);
                    let o = self.alloc(C_BOOLEAN, proto);
                    self.objs[o as usize].prim = Val::Bool(b);
                    return Val::Obj(o);
                }
                Val::Bool(b)
            }
            NF_OBJECT => {
                if construct && !matches!(new_target, Val::Undef) {
                    let nt = obj_of(&new_target);
                    if nt != fobj {
                        let proto = self.proto_from(&new_target, self.object_proto);
                        let o = self.alloc(C_OBJECT, proto);
                        return Val::Obj(o);
                    }
                }
                match a0 {
                    Val::Undef | Val::Null => {
                        let o = self.new_object();
                        Val::Obj(o)
                    }
                    _ => {
                        let o = self.to_object(&a0);
                        Val::Obj(o)
                    }
                }
            }
            NF_ARRAY => {
                let proto = if construct { self.proto_from(&new_target, self.array_proto) } else { self.array_proto };
                let a = self.alloc(C_ARRAY, proto);
                if args.len() == 1 {
                    if let Val::Num(n) = a0 {
                        if n < 0.0 || n > 4294967295.0 || n != to_integer(n) {
                            self.throw_range("Invalid array length");
                            return Val::Undef;
                        }
                        let len = if n > 100000000.0 { 100000000 } else { n as int };
                        let mut v: Vec<Val> = Vec::new();
                        let mut i = 0;
                        while i < len {
                            v.push(Val::Undef);
                            i += 1;
                        }
                        self.objs[a as usize].elems = v;
                        return Val::Obj(a);
                    }
                }
                self.objs[a as usize].elems = args;
                Val::Obj(a)
            }
            NF_SYMBOL => {
                if construct {
                    self.throw_type("Symbol is not a constructor");
                    return Val::Undef;
                }
                let desc = if matches!(a0, Val::Undef) { String::new() } else { self.to_string(&a0) };
                let n = self.symbols.len();
                let name = format!("@@sym:{}:{}", n, desc);
                let atom = self.intern(name.as_str());
                let sp = self.symbol_proto;
                let s = self.alloc(C_SYMBOL, sp);
                self.objs[s as usize].pos = atom;
                self.objs[s as usize].prim = if matches!(a0, Val::Undef) { Val::Undef } else { string_val(desc) };
                self.symbol_atoms.insert(atom, s);
                self.symbols.push(s);
                Val::Obj(s)
            }
            NF_SYM_FOR => {
                let key = self.to_string(&a0);
                if let Some(s) = self.symbol_registry.get(&key) {
                    return Val::Obj(*s);
                }
                let name = format!("@@for:{}", key);
                let atom = self.intern(name.as_str());
                let sp = self.symbol_proto;
                let s = self.alloc(C_SYMBOL, sp);
                self.objs[s as usize].pos = atom;
                self.objs[s as usize].prim = string_val(key.clone());
                self.symbol_atoms.insert(atom, s);
                self.symbols.push(s);
                self.symbol_registry.insert(key, s);
                Val::Obj(s)
            }
            NF_SYM_KEYFOR => {
                let o = obj_of(&a0);
                if o < 0 || self.objs[o as usize].class != C_SYMBOL {
                    self.throw_type("not a symbol");
                    return Val::Undef;
                }
                let name = self.atom_str(self.objs[o as usize].pos);
                if name.starts_with("@@for:") {
                    return self.objs[o as usize].prim.clone();
                }
                Val::Undef
            }
            NF_SYMP_TOSTRING => {
                let s = self.display(&this);
                string_val(s)
            }
            NF_SYMP_DESCRIPTION => {
                let o = obj_of(&this);
                if o >= 0 && self.objs[o as usize].class == C_SYMBOL {
                    return self.objs[o as usize].prim.clone();
                }
                Val::Undef
            }
            NF_EP_TOSTRING => {
                if !is_obj(&this) {
                    self.throw_type("Error.prototype.toString called on non-object");
                    return Val::Undef;
                }
                let n = self.get(&this, A_NAME);
                let m = self.get(&this, A_MESSAGE);
                let ns = if matches!(n, Val::Undef) { String::from("Error") } else { self.to_string(&n) };
                let ms = if matches!(m, Val::Undef) { String::new() } else { self.to_string(&m) };
                if ns.is_empty() {
                    return string_val(ms);
                }
                if ms.is_empty() {
                    return string_val(ns);
                }
                string_val(format!("{}: {}", ns, ms))
            }
            NF_CALL => {
                let mut rest: Vec<Val> = Vec::new();
                let mut i: usize = 1;
                while i < args.len() {
                    rest.push(args[i].clone());
                    i += 1;
                }
                self.call_value(this, a0, rest)
            }
            NF_APPLY => {
                let a1 = arg(&args, 1);
                let items = self.array_like_to_vec(&a1);
                if self.throwing {
                    return Val::Undef;
                }
                self.call_value(this, a0, items)
            }
            NF_BIND => {
                if !self.is_callable(&this) {
                    self.throw_type("Bind must be called on a function");
                    return Val::Undef;
                }
                let fp = self.proto_of(obj_of(&this));
                let b = self.alloc(C_BOUND, fp);
                self.objs[b as usize].env = obj_of(&this);
                self.objs[b as usize].prim = a0;
                let mut rest: Vec<Val> = Vec::new();
                let mut i: usize = 1;
                while i < args.len() {
                    rest.push(args[i].clone());
                    i += 1;
                }
                self.objs[b as usize].elems = rest;
                Val::Obj(b)
            }
            NF_FN_TOSTRING => {
                let o = obj_of(&this);
                if o < 0 || !self.is_callable(&this) {
                    self.throw_type("Function.prototype.toString requires that 'this' be a Function");
                    return Val::Undef;
                }
                let n = self.get(&this, A_NAME);
                let ns = self.to_string(&n);
                if self.objs[o as usize].class == C_FUNCTION {
                    let pi = self.objs[o as usize].func;
                    // the source text; the prelude's functions are built-ins
                    if pi >= self.prelude_protos && !self.protos[pi as usize].source.is_empty() {
                        let src = self.protos[pi as usize].source.clone();
                        return string_val(src);
                    }
                    if self.protos[pi as usize].class_ctor {
                        return string_val(format!("class {} {{ }}", ns));
                    }
                }
                string_val(format!("function {}() {{ [native code] }}", ns))
            }
            // ---- Object
            NF_O_KEYS | NF_O_VALUES | NF_O_ENTRIES => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let keys = self.own_keys(o, false, false);
                let mut out: Vec<Val> = Vec::new();
                for k in keys {
                    if id == NF_O_KEYS {
                        out.push(k);
                    } else {
                        let v = self.get_elem(&Val::Obj(o), &k);
                        if id == NF_O_VALUES {
                            out.push(v);
                        } else {
                            let p = self.new_array(vec![k, v]);
                            out.push(Val::Obj(p));
                        }
                    }
                }
                let a = self.new_array(out);
                Val::Obj(a)
            }
            NF_O_ASSIGN => {
                let t = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let mut i: usize = 1;
                while i < args.len() {
                    let src = args[i].clone();
                    if let Val::Obj(so) = &src {
                        let keys = self.own_keys(*so, false, true);
                        for k in keys {
                            let v = self.get_elem(&src, &k);
                            self.set_elem(&Val::Obj(t), &k, v);
                            if self.throwing {
                                return Val::Undef;
                            }
                        }
                    } else if let Val::Str(s) = &src {
                        let mut k: int = 0;
                        for c in s.chars() {
                            let mut t2 = String::new();
                            t2.push(c);
                            self.set_index(t, k, string_val(t2));
                            k += 1;
                        }
                    }
                    i += 1;
                }
                Val::Obj(t)
            }
            NF_O_CREATE => {
                let proto = match &a0 {
                    Val::Obj(p) => *p,
                    Val::Null => -1,
                    _ => {
                        self.throw_type("Object prototype may only be an Object or null");
                        return Val::Undef;
                    }
                };
                let o = self.alloc(C_OBJECT, proto);
                let props = arg(&args, 1);
                if let Val::Obj(po) = &props {
                    let keys = self.own_keys(*po, false, true);
                    for k in keys {
                        let d = self.get_elem(&props, &k);
                        self.to_descriptor(o, &k, &d);
                    }
                }
                Val::Obj(o)
            }
            NF_O_GETPROTO | NF_REFLECT_GETPROTO => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let p = self.proto_of(o);
                if p >= 0 {
                    Val::Obj(p)
                } else {
                    Val::Null
                }
            }
            NF_O_SETPROTO => {
                let p = arg(&args, 1);
                if let Val::Obj(o) = &a0 {
                    match p {
                        Val::Obj(po) => {
                            // no cycles
                            let mut c = po;
                            while c >= 0 {
                                if c == *o {
                                    self.throw_type("Cyclic __proto__ value");
                                    return Val::Undef;
                                }
                                c = self.objs[c as usize].proto;
                            }
                            self.objs[*o as usize].proto = po;
                        }
                        Val::Null => self.objs[*o as usize].proto = -1,
                        _ => {
                            self.throw_type("Object prototype may only be an Object or null");
                            return Val::Undef;
                        }
                    }
                }
                a0
            }
            NF_O_DEFPROP | NF_REFLECT_DEFPROP => {
                let o = obj_of(&a0);
                if o < 0 {
                    self.throw_type("Object.defineProperty called on non-object");
                    return Val::Undef;
                }
                let k = arg(&args, 1);
                let d = arg(&args, 2);
                self.to_descriptor(o, &k, &d);
                if id == NF_REFLECT_DEFPROP {
                    if self.throwing {
                        self.throwing = false;
                        self.exc = Val::Undef;
                        return Val::Bool(false);
                    }
                    return Val::Bool(true);
                }
                a0
            }
            NF_O_DEFPROPS => {
                let o = obj_of(&a0);
                if o < 0 {
                    self.throw_type("Object.defineProperties called on non-object");
                    return Val::Undef;
                }
                let props = arg(&args, 1);
                if let Val::Obj(po) = &props {
                    let keys = self.own_keys(*po, false, true);
                    for k in keys {
                        let d = self.get_elem(&props, &k);
                        self.to_descriptor(o, &k, &d);
                        if self.throwing {
                            return Val::Undef;
                        }
                    }
                }
                a0
            }
            NF_O_OWNNAMES | NF_O_OWNSYMBOLS | NF_REFLECT_OWNKEYS => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let mut keys = self.own_keys(o, true, id != NF_O_OWNNAMES);
                let class = self.objs[o as usize].class;
                if id != NF_O_OWNSYMBOLS && (class == C_ARRAY || class == C_STRING) {
                    keys.push(str_val("length"));
                }
                if id != NF_O_OWNSYMBOLS && class == C_FUNCTION {
                    let mut extra: Vec<Val> = Vec::new();
                    if self.objs[o as usize].find(A_LENGTH) < 0 {
                        extra.push(str_val("length"));
                    }
                    if self.objs[o as usize].find(A_NAME) < 0 {
                        extra.push(str_val("name"));
                    }
                    for k in keys {
                        extra.push(k);
                    }
                    keys = extra;
                }
                if id == NF_O_OWNSYMBOLS {
                    let mut only: Vec<Val> = Vec::new();
                    for k in keys {
                        if is_obj(&k) {
                            only.push(k);
                        }
                    }
                    keys = only;
                }
                let a = self.new_array(keys);
                Val::Obj(a)
            }
            NF_O_OWNDESC => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let k = arg(&args, 1);
                self.from_descriptor(o, &k)
            }
            NF_O_OWNDESCS => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let r = self.new_object();
                let keys = self.own_keys(o, true, true);
                for k in keys {
                    let d = self.from_descriptor(o, &k);
                    self.define_elem(r, &k, d, 0);
                }
                Val::Obj(r)
            }
            NF_O_FREEZE | NF_O_SEAL | NF_O_PREVENTEXT => {
                if let Val::Obj(o) = &a0 {
                    let o = *o;
                    self.objs[o as usize].extensible = false;
                    if id != NF_O_PREVENTEXT {
                        let n = self.objs[o as usize].attrs.len();
                        let mut i: usize = 0;
                        while i < n {
                            let acc = (self.objs[o as usize].attrs[i] & P_ACCESSOR) != 0;
                            self.objs[o as usize].attrs[i] |= P_FIXED;
                            if id == NF_O_FREEZE && !acc {
                                self.objs[o as usize].attrs[i] |= P_READONLY;
                            }
                            i += 1;
                        }
                        self.any_setter = true;
                        if id == NF_O_FREEZE {
                            // frozen elements: kept as read-only properties
                            let class = self.objs[o as usize].class;
                            if class == C_ARRAY {
                                self.objs[o as usize].pos = 2;
                            }
                        }
                    }
                }
                a0
            }
            NF_O_ISFROZEN | NF_O_ISSEALED => {
                if let Val::Obj(o) = &a0 {
                    let o = *o;
                    if self.objs[o as usize].extensible {
                        return Val::Bool(false);
                    }
                    let class = self.objs[o as usize].class;
                    if id == NF_O_ISFROZEN && class == C_ARRAY && !self.objs[o as usize].elems.is_empty() && self.objs[o as usize].pos != 2 {
                        return Val::Bool(false);
                    }
                    for a in self.objs[o as usize].attrs.iter() {
                        if (*a & P_FIXED) == 0 {
                            return Val::Bool(false);
                        }
                        if id == NF_O_ISFROZEN && (*a & P_ACCESSOR) == 0 && (*a & P_READONLY) == 0 {
                            return Val::Bool(false);
                        }
                    }
                    return Val::Bool(true);
                }
                Val::Bool(true)
            }
            NF_O_ISEXT => {
                if let Val::Obj(o) = &a0 {
                    return Val::Bool(self.objs[*o as usize].extensible);
                }
                Val::Bool(false)
            }
            NF_O_IS => {
                let b = arg(&args, 1);
                Val::Bool(self.same_value(&a0, &b))
            }
            NF_O_FROMENTRIES => {
                let items = self.iterable_to_vec(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let o = self.new_object();
                for it in items {
                    let k = self.get_index(&it, 0);
                    let v = self.get_index(&it, 1);
                    self.define_elem(o, &k, v, 0);
                }
                Val::Obj(o)
            }
            NF_O_HASOWN => {
                let o = self.to_object(&a0);
                if self.throwing {
                    return Val::Undef;
                }
                let k = arg(&args, 1);
                Val::Bool(self.has_own(o, &k))
            }
            NF_O_GROUPBY => {
                let items = self.iterable_to_vec(&a0);
                let f = arg(&args, 1);
                let o = self.alloc(C_OBJECT, -1);
                let mut i: int = 0;
                for it in items {
                    let k = self.call_value(f.clone(), Val::Undef, vec![it.clone(), Val::Num(i as double)]);
                    if self.throwing {
                        return Val::Undef;
                    }
                    let cur = self.get_elem(&Val::Obj(o), &k);
                    if let Val::Obj(a) = cur {
                        self.objs[a as usize].elems.push(it);
                    } else {
                        let a = self.new_array(vec![it]);
                        self.define_elem(o, &k, Val::Obj(a), 0);
                    }
                    i += 1;
                }
                Val::Obj(o)
            }
            NF_OP_HASOWN => {
                let o = self.to_object(&this);
                if self.throwing {
                    return Val::Undef;
                }
                Val::Bool(self.has_own(o, &a0))
            }
            NF_OP_ISPROTO => {
                let p = obj_of(&this);
                if let Val::Obj(o) = &a0 {
                    let mut c = self.objs[*o as usize].proto;
                    while c >= 0 {
                        if c == p {
                            return Val::Bool(true);
                        }
                        c = self.objs[c as usize].proto;
                    }
                }
                Val::Bool(false)
            }
            NF_OP_PROPENUM => {
                let o = self.to_object(&this);
                if self.throwing {
                    return Val::Undef;
                }
                let (i, a) = self.to_key(&a0);
                let class = self.objs[o as usize].class;
                if i >= 0 && (class == C_ARRAY || class == C_ARGUMENTS) {
                    return Val::Bool((i as usize) < self.objs[o as usize].elems.len());
                }
                let atom = if i >= 0 { self.index_atom(i) } else { a };
                let slot = self.objs[o as usize].find(atom);
                if slot < 0 {
                    return Val::Bool(false);
                }
                Val::Bool((self.objs[o as usize].attrs[slot as usize] & P_HIDDEN) == 0)
            }
            NF_OP_TOSTRING => {
                let tag = match &this {
                    Val::Undef => String::from("Undefined"),
                    Val::Null => String::from("Null"),
                    _ => {
                        let o = self.to_object(&this);
                        let a_tag = self.intern("@@toStringTag");
                        let t = self.get_obj(o, a_tag, &this);
                        if let Val::Str(s) = t {
                            s.as_ref().clone()
                        } else {
                            let c = self.objs[o as usize].class;
                            String::from(match c {
                                C_ARRAY => "Array",
                                C_FUNCTION | C_NATIVE | C_BOUND => "Function",
                                C_ERROR => "Error",
                                C_REGEXP => "RegExp",
                                C_DATE => "Date",
                                C_ARGUMENTS => "Arguments",
                                C_BOOLEAN => "Boolean",
                                C_NUMBER => "Number",
                                C_STRING => "String",
                                C_MAP => "Map",
                                C_SET => "Set",
                                C_SYMBOL => "Symbol",
                                C_PROMISE => "Promise",
                                _ => "Object",
                            })
                        }
                    }
                };
                string_val(format!("[object {}]", tag))
            }
            NF_OP_TOLOCALE => {
                let f = self.get(&this, A_TOSTRING);
                self.call_value(f, this, Vec::new())
            }
            NF_OP_VALUEOF => {
                let o = self.to_object(&this);
                if self.throwing {
                    return Val::Undef;
                }
                Val::Obj(o)
            }
            // ---- Reflect
            NF_REFLECT_APPLY => {
                let a2 = arg(&args, 2);
                let items = self.array_like_to_vec(&a2);
                if self.throwing {
                    return Val::Undef;
                }
                let t = arg(&args, 1);
                self.call_value(a0, t, items)
            }
            NF_REFLECT_CONSTRUCT => {
                let a1 = arg(&args, 1);
                let items = self.array_like_to_vec(&a1);
                if self.throwing {
                    return Val::Undef;
                }
                let nt = if args.len() > 2 { args[2].clone() } else { a0.clone() };
                self.construct(a0, items, nt)
            }
            NF_REFLECT_HAS => {
                let o = obj_of(&a0);
                if o < 0 {
                    self.throw_type("Reflect.has called on non-object");
                    return Val::Undef;
                }
                let k = arg(&args, 1);
                Val::Bool(self.has_property(o, &k))
            }
            NF_REFLECT_GET => {
                let k = arg(&args, 1);
                self.get_elem(&a0, &k)
            }
            NF_REFLECT_SET => {
                let k = arg(&args, 1);
                let v = arg(&args, 2);
                self.set_elem(&a0, &k, v);
                Val::Bool(!self.throwing)
            }
            NF_REFLECT_DELETE => {
                let o = obj_of(&a0);
                if o < 0 {
                    return Val::Bool(false);
                }
                let k = arg(&args, 1);
                Val::Bool(self.delete(o, &k))
            }
            _ => self.call_native2(id, fobj, this, args, construct, new_target),
        }
    }

    pub fn math(&mut self, which: int, args: &Vec<Val>) -> Val {
        if which == 31 || which == 32 {
            // min / max
            let mut r = if which == 31 { infinity() } else { -infinity() };
            let mut nan_seen = false;
            for a in args.iter() {
                let n = self.to_number(a);
                if is_nan(n) {
                    nan_seen = true;
                    continue;
                }
                if which == 31 {
                    if n < r || (n == 0.0 && r == 0.0 && 1.0 / n < 0.0) {
                        r = n;
                    }
                } else if n > r || (n == 0.0 && r == 0.0 && 1.0 / n > 0.0) {
                    r = n;
                }
            }
            return Val::Num(if nan_seen { nan() } else { r });
        }
        if which == 33 {
            // xorshift, deterministic
            // Park-Miller: exact in doubles, the same sequence on every target
            let x = (((self.rng as double) * 16807.0) % 2147483647.0) as int;
            self.rng = x;
            let v = ((x - 1) as double) / 2147483646.0;
            return Val::Num(v);
        }
        if which == 34 {
            let mut s: double = 0.0;
            let mut inf = false;
            let mut nn = false;
            for a in args.iter() {
                let n = self.to_number(a);
                if !is_finite(n) && !is_nan(n) {
                    inf = true;
                }
                if is_nan(n) {
                    nn = true;
                }
                s += n * n;
            }
            if inf {
                return Val::Num(infinity());
            }
            if nn {
                return Val::Num(nan());
            }
            return Val::Num(s.sqrt());
        }
        let x = self.to_number(&arg(args, 0));
        if which >= 28 && which <= 30 {
            let y = self.to_number(&arg(args, 1));
            let r = match which {
                28 => crate::vm::arith_num(crate::ops::OP_EXP, x, y),
                29 => x.atan2(y),
                _ => crate::vm::imul(to_int32(x), to_int32(y)) as double,
            };
            return Val::Num(r);
        }
        let r = match which {
            0 => x.abs(),
            1 => x.floor(),
            2 => x.ceil(),
            3 => {
                if !is_finite(x) || x == 0.0 {
                    x
                } else if x > 0.0 && x < 0.5 {
                    0.0
                } else if x < 0.0 && x >= -0.5 {
                    neg_zero()
                } else {
                    (x + 0.5).floor()
                }
            }
            4 => to_integer(x),
            5 => {
                if is_nan(x) || x == 0.0 {
                    x
                } else if x > 0.0 {
                    1.0
                } else {
                    -1.0
                }
            }
            6 => x.sqrt(),
            7 => x.cbrt(),
            8 => x.exp(),
            9 => x.exp_m1(),
            10 => x.ln(),
            11 => x.log2(),
            12 => x.log10(),
            13 => x.ln_1p(),
            14 => x.sin(),
            15 => x.cos(),
            16 => x.tan(),
            17 => x.asin(),
            18 => x.acos(),
            19 => x.atan(),
            20 => x.sinh(),
            21 => x.cosh(),
            22 => x.tanh(),
            23 => x.asinh(),
            24 => x.acosh(),
            25 => x.atanh(),
            26 => (x as f32) as double,
            27 => {
                let mut u = to_uint32(x) as int;
                let mut n: int = 32;
                while u > 0 {
                    u = u >> 1;
                    n -= 1;
                }
                n as double
            }
            _ => nan(),
        };
        Val::Num(r)
    }
}

/// `v` in hexadecimal, zero-padded to `width` digits.
fn hex_digits(v: int, width: int, upper: bool) -> String {
    let mut digits: Vec<char> = Vec::new();
    let mut n = v;
    while n > 0 {
        let d = n % 16;
        let code: u8 = if d < 10 {
            (48 + d) as u8
        } else if upper {
            (55 + d) as u8
        } else {
            (87 + d) as u8
        };
        digits.push(code as char);
        n = n / 16;
    }
    while (digits.len() as int) < width {
        digits.push('0');
    }
    let mut out = String::new();
    let mut i = (digits.len() as int) - 1;
    while i >= 0 {
        out.push(digits[i as usize]);
        i -= 1;
    }
    out
}

fn hexch(v: int) -> char {
    let c: u8 = if v < 10 { (48 + v) as u8 } else { (55 + v) as u8 };
    c as char
}

fn hexval_unit(c: int) -> int {
    if c >= 48 && c <= 57 {
        return c - 48;
    }
    if c >= 97 && c <= 102 {
        return c - 87;
    }
    if c >= 65 && c <= 70 {
        return c - 55;
    }
    -1
}

/// The code point of one UTF-8 sequence; -1 when it is not a valid one.
fn utf8_decode(b: &Vec<int>) -> int {
    let n = b.len();
    let lead = b[0];
    let mut i: usize = 1;
    let mut cp: int;
    let min: int;
    if n == 1 {
        return if lead < 128 { lead } else { -1 };
    }
    if n == 2 {
        cp = lead & 31;
        min = 128;
    } else if n == 3 {
        cp = lead & 15;
        min = 2048;
    } else {
        cp = lead & 7;
        min = 65536;
    }
    while i < n {
        if (b[i] & 192) != 128 {
            return -1;
        }
        cp = (cp << 6) | (b[i] & 63);
        i += 1;
    }
    if cp < min || cp > 1114111 || (cp >= 55296 && cp <= 57343) {
        return -1;
    }
    cp
}

fn hexval(c: char) -> int {
    if c >= '0' && c <= '9' {
        return (c as int) - 48;
    }
    if c >= 'a' && c <= 'f' {
        return (c as int) - 87;
    }
    if c >= 'A' && c <= 'F' {
        return (c as int) - 55;
    }
    -1
}

pub fn regex_cache_new() -> HashMap<String, int> {
    HashMap::new()
}
