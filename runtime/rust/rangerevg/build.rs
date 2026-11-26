// Writes EVGCrate.rgr's closure (lib/evg) as this crate's Rust module, and
// hands the root to dependents (-rust-extern, ranger::build).
fn main() {
    ranger::build::Module::new("src/EVGCrate.rgr")
        .export_root()
        .compile();
    println!("cargo:rerun-if-changed=../../../lib/evg");
}
