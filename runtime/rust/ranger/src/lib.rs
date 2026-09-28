// SPDX-License-Identifier: MIT
//
// The `ranger` prelude crate (docs/plans/PLAN_RUST_SYNTAX.md §3.2).
//
// A strict module is a `.rs` file that starts with `use ranger::prelude::*;`.
// It builds with cargo against this crate, and Ranger compiles the same file
// to its other targets. The prelude gives it:
//
// - the Ranger type names `int`, `double`, `string`, `boolean`;
// - `Map<K, V>`, a map that iterates in insertion order as the other
//   targets' maps do;
// - the Ranger operators as functions (`ops.rs`, generated from the `rust`
//   templates of compiler/Lang.rgr);
// - the attribute macros `#[ranger::weak]`, `late`, `fields`, `doc`,
//   `target`, `serialize`, which Ranger reads (`serialize` also writes
//   `to_json` / `from_json` with `json`, `target` keeps an item only for the
//   Rust target);
// - `import_rgr!`, which includes the Rust module `rgrc` writes for a `.rgr`
//   file (stage R6), `native!` and `tree!` (stage R7).

pub mod json;
pub mod map;
pub mod ops;

pub use ranger_macros::{doc, fields, late, serialize, target, weak};

/// `ranger::import_rgr!("legacy")` includes `$OUT_DIR/legacy.rs`, written by
/// the crate's `build.rs` with `rgrc -l=rust legacy.rgr`. Ranger reads the
/// invocation as `Import "legacy.rgr"`.
#[macro_export]
macro_rules! import_rgr {
    ($name:literal) => {
        include!(concat!(env!("OUT_DIR"), "/", $name, ".rs"));
    };
}

/// Target code: `ranger::native!(rust: expr, es6: "…", python: "…")`. For
/// rustc it is the `rust` arm; Ranger writes the arm of the target it
/// compiles for, with `{x}` standing for the local `x` (stage R7).
#[macro_export]
macro_rules! native {
    (rust: $e:expr $(, $($rest:tt)*)?) => {
        $e
    };
    ($other:ident: $code:literal $(, $($rest:tt)*)?) => {
        $crate::native!($($($rest)*)?)
    };
    () => {
        compile_error!("ranger::native! has no `rust` arm")
    };
}

/// A tree of structs as one literal (stage R7):
///
/// ```ignore
/// let t = ranger::tree! { Node { name: "root", children: [Node { name: "a" }] } };
/// ```
///
/// A field left out takes its `Default`, `[…]` is a `Vec` of trees, a nested
/// `Type { … }` is a tree and any other value goes through `Into`. The struct
/// types derive `Default`.
#[macro_export]
macro_rules! tree {
    ($name:ident { $($body:tt)* }) => {
        $crate::__tree_fields!($name [] $($body)*)
    };
}

#[macro_export]
macro_rules! __tree_fields {
    ($name:ident [$($acc:tt)*]) => {
        $name { $($acc)* ..::core::default::Default::default() }
    };
    ($name:ident [$($acc:tt)*] $f:ident : [ $($items:tt)* ] $(, $($rest:tt)*)?) => {
        $crate::__tree_fields!($name [$($acc)* $f: $crate::__tree_list!([] $($items)*),] $($($rest)*)?)
    };
    ($name:ident [$($acc:tt)*] $f:ident : $t:ident { $($inner:tt)* } $(, $($rest:tt)*)?) => {
        $crate::__tree_fields!($name [$($acc)* $f: $crate::tree!($t { $($inner)* }),] $($($rest)*)?)
    };
    ($name:ident [$($acc:tt)*] $f:ident : $v:expr $(, $($rest:tt)*)?) => {
        $crate::__tree_fields!($name [$($acc)* $f: ::core::convert::Into::into($v),] $($($rest)*)?)
    };
}

#[macro_export]
macro_rules! __tree_list {
    ([$($acc:tt)*]) => {
        vec![$($acc)*]
    };
    ([$($acc:tt)*] $t:ident { $($inner:tt)* } $(, $($rest:tt)*)?) => {
        $crate::__tree_list!([$($acc)* $crate::tree!($t { $($inner)* }),] $($($rest)*)?)
    };
}

pub mod prelude {
    #![allow(non_camel_case_types)]

    /// A Ranger `int`: 64 bits on every target.
    pub type int = i64;
    /// A Ranger `double`.
    pub type double = f64;
    /// A Ranger `string`: UTF-8; measured with `.chars().count()` (code
    /// points) or `.as_bytes().len()` (bytes), never `.len()` (D7).
    pub type string = String;
    /// A Ranger `boolean`.
    pub type boolean = bool;

    pub use crate::map::{Entry, Map};
    pub use crate::ops::*;
}
