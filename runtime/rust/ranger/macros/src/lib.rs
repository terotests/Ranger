// SPDX-License-Identifier: MIT
//
// Attributes that carry Ranger-only information (PLAN_RUST_SYNTAX.md D6).
// For rustc each returns the item it is on unchanged; Ranger reads them from
// the source.

use proc_macro::TokenStream;

/// A field held without ownership, `@(weak)` in `.rgr`. Use it where the type
/// (`Weak<T>`) does not already say so.
#[proc_macro_attribute]
pub fn weak(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// An `Option` field set by an attach / init method before it is read,
/// `@(late)` in `.rgr`.
#[proc_macro_attribute]
pub fn late(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// JSON reading and writing generated for the struct, `@serialize` in `.rgr`.
#[proc_macro_attribute]
pub fn serialize(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// API documentation rustdoc has no idiom for: `since`, `category`,
/// `platform`, `experimental`, `replaced_by` (§4).
#[proc_macro_attribute]
pub fn doc(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// Code for one target only, `if_<target>` in `.rgr`.
#[proc_macro_attribute]
pub fn target(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}
