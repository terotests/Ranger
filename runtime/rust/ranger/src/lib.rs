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
// - the attribute macros `#[ranger::weak]`, `late`, `serialize`, `doc`,
//   `target`, which rustc passes through and Ranger reads;
// - `import_rgr!`, which includes the Rust module `rgrc` writes for a `.rgr`
//   file (stage R6).

pub mod map;
pub mod ops;

pub use ranger_macros::{doc, late, serialize, target, weak};

/// `ranger::import_rgr!("legacy")` includes `$OUT_DIR/legacy.rs`, written by
/// the crate's `build.rs` with `rgrc -l=rust legacy.rgr`. Ranger reads the
/// invocation as `Import "legacy.rgr"`.
#[macro_export]
macro_rules! import_rgr {
    ($name:literal) => {
        include!(concat!(env!("OUT_DIR"), "/", $name, ".rs"));
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
