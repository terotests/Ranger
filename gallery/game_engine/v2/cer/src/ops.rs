// SPDX-License-Identifier: AGPL-3.0-or-later
//! The bytecode. A stack machine: operands are pushed, an operation pops
//! what it reads and pushes its result. `[a, b] → [c]` below reads a
//! stack whose top is `b` and leaves `c` in their place.

use ranger::prelude::*;

pub const OP_UNDEF: int = 1;
pub const OP_NULL: int = 2;
pub const OP_TRUE: int = 3;
pub const OP_FALSE: int = 4;
/// a small integer, `a`
pub const OP_INT: int = 5;
/// `consts[a]`
pub const OP_CONST: int = 6;
pub const OP_POP: int = 7;
pub const OP_DUP: int = 8;
/// [a, b] → [a, b, a, b]
pub const OP_DUP2: int = 9;
pub const OP_SWAP: int = 10;
/// [x, y, z] → [z, x, y]
pub const OP_ROT3: int = 11;
/// [w, x, y, z] → [z, w, x, y]
pub const OP_ROT4: int = 12;
/// [a, b] → [a, b, a]
pub const OP_OVER: int = 13;

pub const OP_GET_LOCAL: int = 14;
/// keeps the value on the stack
pub const OP_SET_LOCAL: int = 15;
/// scope `a` levels out, slot `b`
pub const OP_GET_ENV: int = 16;
pub const OP_SET_ENV: int = 17;
/// atom `a`; `c` caches the global object's slot
pub const OP_GET_GLOBAL: int = 18;
pub const OP_SET_GLOBAL: int = 19;
pub const OP_TYPEOF_GLOBAL: int = 20;
/// `var a` at the top level: define when absent
pub const OP_DECL_GLOBAL: int = 21;

/// [obj] → [obj.a]
pub const OP_GET_PROP: int = 22;
/// [obj, v] → [v]
pub const OP_SET_PROP: int = 23;
/// [obj, key] → [obj[key]]
pub const OP_GET_ELEM: int = 24;
/// [obj, key, v] → [v]
pub const OP_SET_ELEM: int = 25;
pub const OP_DEL_PROP: int = 26;
pub const OP_DEL_ELEM: int = 27;
/// [obj] → [obj.a, obj]: a method and its receiver
pub const OP_GET_METHOD: int = 28;
/// [obj, key] → [obj[key], obj]
pub const OP_GET_METHOD_ELEM: int = 29;

pub const OP_ADD: int = 30;
pub const OP_SUB: int = 31;
pub const OP_MUL: int = 32;
pub const OP_DIV: int = 33;
pub const OP_MOD: int = 34;
pub const OP_EXP: int = 35;
pub const OP_BAND: int = 36;
pub const OP_BOR: int = 37;
pub const OP_BXOR: int = 38;
pub const OP_SHL: int = 39;
pub const OP_SHR: int = 40;
pub const OP_USHR: int = 41;
pub const OP_EQ: int = 42;
pub const OP_NE: int = 43;
pub const OP_SEQ: int = 44;
pub const OP_SNE: int = 45;
pub const OP_LT: int = 46;
pub const OP_GT: int = 47;
pub const OP_LE: int = 48;
pub const OP_GE: int = 49;
pub const OP_INSTANCEOF: int = 50;
pub const OP_IN: int = 51;
pub const OP_NEG: int = 52;
pub const OP_TONUM: int = 53;
pub const OP_NOT: int = 54;
pub const OP_BNOT: int = 55;
pub const OP_TYPEOF: int = 56;
pub const OP_INC: int = 57;
pub const OP_DEC: int = 58;
pub const OP_TOSTR: int = 59;
/// slot `a` += `b` when it holds a number (`i++` as a statement)
pub const OP_INC_LOCAL: int = 60;

pub const OP_JUMP: int = 61;
/// pops; jumps when falsy
pub const OP_JF: int = 62;
pub const OP_JT: int = 63;
/// jumps keeping the value when falsy, else pops
pub const OP_JF_KEEP: int = 64;
pub const OP_JT_KEEP: int = 65;
/// jumps keeping the value when not null / undefined, else pops
pub const OP_JNN_KEEP: int = 66;
/// pops; jumps when not undefined
pub const OP_JNOT_UNDEF: int = 67;
/// optional chain: when null / undefined, replaces it with undefined and
/// jumps
pub const OP_JNULLISH: int = 68;
/// [x, y] → []: jumps when x === y, else keeps [x] (switch cases)
pub const OP_JCASE: int = 69;

/// [f, this, args…] → [result]
pub const OP_CALL: int = 70;
/// [f, args…] → [object]
pub const OP_NEW: int = 72;
/// [f, this, array] → [result]
pub const OP_CALL_SPREAD: int = 73;
/// [f, array] → [object]
pub const OP_NEW_SPREAD: int = 74;
/// [args…] → [this]
pub const OP_SUPER_CALL: int = 75;
/// [array] → [this]
pub const OP_SUPER_CALL_SPREAD: int = 76;
pub const OP_RETURN: int = 77;
pub const OP_RETURN_UNDEF: int = 78;
/// a closure of `protos[a]`
pub const OP_CLOSURE: int = 79;
pub const OP_THIS: int = 80;
pub const OP_NEW_TARGET: int = 81;
pub const OP_ARGUMENTS: int = 82;
/// [a, b] with a < b fused compare-and-jump: pops both, jumps to `a` when
/// the comparison `b` (an OP_LT… code) is false
pub const OP_CMP_JF: int = 83;

pub const OP_NEW_OBJECT: int = 84;
/// [obj, v] → [obj]
pub const OP_INIT_PROP: int = 85;
/// [obj, key, v] → [obj]
pub const OP_INIT_ELEM: int = 86;
/// [obj, f] → [obj]; `b` 1 when not enumerable
pub const OP_INIT_GETTER: int = 87;
pub const OP_INIT_SETTER: int = 88;
/// [obj, key, f] → [obj]
pub const OP_INIT_GETTER_ELEM: int = 89;
pub const OP_INIT_SETTER_ELEM: int = 90;
/// [obj, src] → [obj]
pub const OP_INIT_SPREAD: int = 91;
/// [obj, f] → [obj]: a method (not enumerable, `super` from obj)
pub const OP_DEFINE_METHOD: int = 92;
/// [obj, key, f] → [obj]
pub const OP_DEFINE_METHOD_ELEM: int = 93;
/// [v…a] → [array]
pub const OP_NEW_ARRAY: int = 94;
/// [arr, v] → [arr]
pub const OP_ARRAY_PUSH: int = 95;
/// [arr, iterable] → [arr]
pub const OP_ARRAY_SPREAD: int = 96;
pub const OP_ARRAY_HOLE: int = 97;
/// [obj, v] → [obj]: defines own property `a` (class fields)
pub const OP_DEFINE_FIELD: int = 98;
/// [obj, key, v] → [obj]
pub const OP_DEFINE_FIELD_ELEM: int = 99;

pub const OP_THROW: int = 100;
/// installs a handler catching at `a`
pub const OP_TRY: int = 101;
pub const OP_END_TRY: int = 102;
/// [obj] → [iterator over its enumerable keys]
pub const OP_ITER_KEYS: int = 103;
/// [iterable] → [iterator]
pub const OP_ITER_VALUES: int = 104;
/// [it] → [it, v], or [it] and a jump to `a` when done
pub const OP_ITER_NEXT: int = 105;
/// a scope object of `a` slots for a block
pub const OP_PUSH_ENV: int = 106;
pub const OP_POP_ENV: int = 107;
/// a fresh copy of the block scope (per-iteration `let`)
pub const OP_COPY_ENV: int = 108;
/// a RegExp from `consts[a]` with flags `consts[b]`
pub const OP_REGEX: int = 109;
/// [ctor, super?] → [ctor, prototype]; `a` 1 with a superclass
pub const OP_CLASS: int = 110;
/// [] → [super.a]
pub const OP_GET_SUPER: int = 111;
/// [key] → [super[key]]
pub const OP_GET_SUPER_ELEM: int = 112;
/// throws a TypeError when the top is null or undefined (destructuring)
pub const OP_REQUIRE_OBJ: int = 113;
/// [src, k1…ka] → [src, rest]: own enumerable properties but the keys
pub const OP_OBJ_REST: int = 114;
/// [iterable] → [array]
pub const OP_TO_ARRAY: int = 115;
/// [arr] → [arr, arr.slice(a)] (rest element)
pub const OP_ARRAY_REST: int = 116;
/// [f] → [f]; names an anonymous function `consts[a]`
pub const OP_SET_NAME: int = 117;
/// pushes the class constructor's field initializer run on `this`
pub const OP_INIT_FIELDS: int = 118;
/// [ctor, f] → [ctor]: the instance field initializer
pub const OP_SET_FIELDS: int = 119;
/// throws ReferenceError: assignment to const `consts[a]`
pub const OP_CONST_ERROR: int = 120;
/// [x] → [x] fused `GET_LOCAL a` + `GET_PROP b`
pub const OP_GET_LOCAL_PROP: int = 121;
/// [] → [local a < local b]… fused compare of two locals
pub const OP_LOCAL_LT_JF: int = 122;
pub const OP_NOP: int = 123;
/// [v] → [] : `a` holds the handler depth to restore when re-entering
pub const OP_ENV_DEPTH: int = 124;
/// [obj] → [obj]: a TypeError unless callable (for class heritage)
pub const OP_TEMPLATE_OBJ: int = 125;
/// pushes the function object running (a named function expression's name)
pub const OP_CALLEE: int = 126;
/// pushes `this.<atom a>`; c caches the slot like OP_GET_PROP
pub const OP_GET_THIS_PROP: int = 127;
/// [v] → []: stores v in local a and skips the next op (the statement's
/// POP, which still runs when a jump lands on it)
pub const OP_SET_LOCAL_POP: int = 128;
/// `x++` / `x--` on local a in an expression (b = +1 / -1): pushes the old
/// number
pub const OP_POSTINC_LOCAL: int = 129;
/// `++x` / `--x` on local a (b = +1 / -1): pushes the new number
pub const OP_PREINC_LOCAL: int = 130;
/// OP_SET_PROP whose value is not used: pops it and skips the next op (the
/// statement's POP)
pub const OP_SET_PROP_POP: int = 131;
/// OP_SET_ELEM likewise
pub const OP_SET_ELEM_POP: int = 132;
/// [obj] → [obj.<private atom a>]: a TypeError when obj does not have it
pub const OP_GET_PRIVATE: int = 133;
/// [f, this, args…] → [result]: a call that is a direct `eval` when f is
/// the built-in eval (then the code sees the scopes of evals[b]); argc a
pub const OP_EVAL_CALL: int = 134;
