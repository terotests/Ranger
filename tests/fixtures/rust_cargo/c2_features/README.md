Cargo features: `#[cfg(feature = "x")]` and `#[cfg(not(feature = "x"))]`
items, kept by the crates' `[features] default` lists. The app turns its
`long` feature on by default and leaves `short` off; the zones library has
`table` on by default, which the app does not turn off. rgrc keeps the same
items cargo builds (-features=a,b and -no-default-features change them as
cargo's flags do).
