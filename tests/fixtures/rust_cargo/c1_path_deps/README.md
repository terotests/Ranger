Cargo package dependencies (PLAN_RUST_SYNTAX.md §9.6): `app` depends on
`shapes` by path, `shapes` on `units` (package `geo-units`, renamed `units`)
and on the `ranger` prelude crate. `cargo run` in `app/` prints expected.txt,
and `rgrc app/src/main.rs` prints the same on every target.
