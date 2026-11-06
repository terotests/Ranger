// Writes EVGCrate.rgr's closure (lib/evg) as this crate's Rust module, and
// hands the root to dependents (-rust-extern, ranger::build).
fn main() {
    ranger::build::Module::new("src/EVGCrate.rgr")
        // what rustc refuses in Ranger's Rust output: EVGHostTextMeasurer
        // keeps its host's measuring function in an Option<Box<dyn FnMut>>
        // that it can neither take from a `&mut dyn FnMut` nor clone, so this
        // crate measures with the measurer's own metrics
        .stub("    self.metric_fn = Some(f);\n", "    let _ = f;\n")
        .stub(
            "self.metric_fn.clone().unwrap();",
            "&mut |_: i64, _: String, _: String, _: f64, _: bool, _: bool| -> f64 { 0.0 };",
        )
        .export_root()
        .compile();
    println!("cargo:rerun-if-changed=../../../lib/evg");
}
