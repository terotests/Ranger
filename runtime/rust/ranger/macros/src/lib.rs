// SPDX-License-Identifier: MIT
//
// Attributes that carry Ranger-only information (PLAN_RUST_SYNTAX.md D6).
// For rustc each returns the item it is on unchanged; Ranger reads them from
// the source.

use proc_macro::{Delimiter, Group, TokenStream, TokenTree};

// rustc does not run an attribute macro on a struct field, so the field
// markers `#[ranger::weak]` and `#[ranger::late]` are removed by the macro on
// the struct around them: `#[ranger::fields]` (or `#[ranger::serialize]`).

fn is_field_marker(g: &Group) -> bool {
    if g.delimiter() != Delimiter::Bracket {
        return false;
    }
    let text: String = g.stream().to_string().chars().filter(|c| !c.is_whitespace()).collect();
    text == "ranger::weak" || text == "ranger::late"
}

fn strip_field_markers(item: TokenStream) -> TokenStream {
    let tokens: Vec<TokenTree> = item.into_iter().collect();
    let mut out: Vec<TokenTree> = Vec::new();
    let mut i = 0;
    while i < tokens.len() {
        if let TokenTree::Punct(p) = &tokens[i] {
            if p.as_char() == '#' && i + 1 < tokens.len() {
                if let TokenTree::Group(g) = &tokens[i + 1] {
                    if is_field_marker(g) {
                        i += 2;
                        continue;
                    }
                }
            }
        }
        match &tokens[i] {
            TokenTree::Group(g) => {
                let mut ng = Group::new(g.delimiter(), strip_field_markers(g.stream()));
                ng.set_span(g.span());
                out.push(TokenTree::Group(ng));
            }
            t => out.push(t.clone()),
        }
        i += 1;
    }
    out.into_iter().collect()
}

/// On a struct whose fields carry `#[ranger::weak]` / `#[ranger::late]`: the
/// struct as it is, without those markers.
#[proc_macro_attribute]
pub fn fields(_attr: TokenStream, item: TokenStream) -> TokenStream {
    strip_field_markers(item)
}

/// A field held without ownership, `@(weak)` in `.rgr`. Use it where the type
/// (`Weak<T>`) does not already say so. On a field it is read (and removed)
/// by `#[ranger::fields]` on the struct.
#[proc_macro_attribute]
pub fn weak(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// An `Option` field set by an attach / init method before it is read,
/// `@(late)` in `.rgr`. On a field, with `#[ranger::fields]` on the struct.
#[proc_macro_attribute]
pub fn late(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// JSON reading and writing for a struct with named fields, `@serialize` in
/// `.rgr`: `to_json(&self) -> String`, `from_json(&str) -> Result<Self,
/// String>` and the `ranger::json` traits, so a serialized struct can be a
/// field of another. Field types: i64, f64, bool, String, Vec, Option and
/// other serialized structs.
#[proc_macro_attribute]
pub fn serialize(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let item = strip_field_markers(item);
    let (name, fields) = match struct_fields(&item) {
        Some(x) => x,
        None => {
            return "compile_error!(\"#[ranger::serialize] is for a struct with named fields\");"
                .parse()
                .unwrap()
        }
    };
    let mut write = String::new();
    for (i, f) in fields.iter().enumerate() {
        let sep = if i == 0 { "" } else { "," };
        write.push_str(&format!(
            "o.push_str(\"{}\\\"{}\\\":\"); o.push_str(&::ranger::json::ToJson::to_json(&self.{}));\n",
            sep, f, f
        ));
    }
    let mut read = String::new();
    for f in &fields {
        read.push_str(&format!("{}: ::ranger::json::field(v, \"{}\")?,\n", f, f));
    }
    let gen = format!(
        "impl {n} {{\n\
         pub fn to_json(&self) -> String {{ let mut o = String::from(\"{{\"); {w} o.push('}}'); o }}\n\
         pub fn from_json(text: &str) -> Result<{n}, String> {{ let v = ::ranger::json::parse(text)?; <{n} as ::ranger::json::FromJson>::from_json_value(&v) }}\n\
         }}\n\
         impl ::ranger::json::ToJson for {n} {{ fn to_json(&self) -> String {{ {n}::to_json(self) }} }}\n\
         impl ::ranger::json::FromJson for {n} {{ fn from_json_value(v: &::ranger::json::Value) -> Result<{n}, String> {{ ::ranger::json::object(v)?; Ok({n} {{ {r} }}) }} }}\n",
        n = name,
        w = write,
        r = read
    );
    let mut out = item;
    out.extend(gen.parse::<TokenStream>().unwrap());
    out
}

// The name of a `struct Name { a: T, b: U }` and its field names.
fn struct_fields(item: &TokenStream) -> Option<(String, Vec<String>)> {
    let tokens: Vec<TokenTree> = item.clone().into_iter().collect();
    let mut i = 0;
    while i < tokens.len() {
        if let TokenTree::Ident(id) = &tokens[i] {
            if id.to_string() == "struct" {
                break;
            }
        }
        i += 1;
    }
    let name = match tokens.get(i + 1) {
        Some(TokenTree::Ident(n)) => n.to_string(),
        _ => return None,
    };
    let body = match tokens.get(i + 2) {
        Some(TokenTree::Group(g)) if g.delimiter() == Delimiter::Brace => g.stream(),
        _ => return None,
    };
    let mut fields = Vec::new();
    let mut expect_name = true;
    let mut last_ident: Option<String> = None;
    let mut depth = 0i32;
    for t in body {
        match &t {
            TokenTree::Punct(p) if p.as_char() == '<' => depth += 1,
            TokenTree::Punct(p) if p.as_char() == '>' => depth -= 1,
            TokenTree::Punct(p) if p.as_char() == ',' && depth == 0 => {
                expect_name = true;
                last_ident = None;
            }
            TokenTree::Punct(p) if p.as_char() == ':' && expect_name && depth == 0 => {
                if let Some(n) = last_ident.take() {
                    fields.push(n);
                }
                expect_name = false;
            }
            TokenTree::Ident(id) if expect_name => {
                let s = id.to_string();
                if s != "pub" {
                    last_ident = Some(s);
                }
            }
            _ => {}
        }
    }
    Some((name, fields))
}

/// API documentation rustdoc has no idiom for: `since`, `category`,
/// `platform`, `experimental`, `replaced_by` (§4).
#[proc_macro_attribute]
pub fn doc(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// An item for some targets only: `#[ranger::target(rust, cpp)]`, like
/// `if_<target>` in `.rgr`. rustc builds the Rust target, so the item is
/// kept when `rust` is listed and dropped otherwise; Ranger keeps it for the
/// targets listed.
#[proc_macro_attribute]
pub fn target(attr: TokenStream, item: TokenStream) -> TokenStream {
    let listed = attr.into_iter().any(|t| match t {
        TokenTree::Ident(i) => i.to_string() == "rust",
        _ => false,
    });
    if listed {
        item
    } else {
        TokenStream::new()
    }
}
