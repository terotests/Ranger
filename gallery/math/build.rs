// Writes src/MathRgr.rgr as the crate's Rust module; EVG's types are the
// rangerevg crate's (ranger::build).
fn main() {
    ranger::build::Module::new("src/MathRgr.rgr")
        .extern_crate("rangerevg")
        // the dependents' .rgr code uses the .rs types too (MathRender)
        .export_path("src/lib.rs")
        .compile();
    println!("cargo:rerun-if-changed=src/MathFont.rgr");
    println!("cargo:rerun-if-changed=src/MathFontData.rgr");
    println!("cargo:rerun-if-changed=src/MathText.rgr");
}
