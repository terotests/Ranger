// Writes each `.rgr` module the crate includes as a Rust module into
// OUT_DIR, where `ranger::import_rgr!` finds it.
use std::path::Path;
use std::process::Command;

fn main() {
    let out = std::env::var("OUT_DIR").unwrap();
    let root = env!("CARGO_MANIFEST_DIR");
    let rgrc = Path::new(root).join("../../../../dist/rgrc.js");
    for name in ["legacy"] {
        let src = format!("src/{}.rgr", name);
        println!("cargo:rerun-if-changed={}", src);
        let run = Command::new("node")
            .arg(&rgrc)
            .arg("-l=rust")
            .arg("-rust-module")
            .arg(&src)
            .arg(format!("-d={}", out))
            .arg(format!("-o={}.rs", name))
            .output()
            .expect("node could not run rgrc");
        let log = String::from_utf8_lossy(&run.stdout).to_string() + &String::from_utf8_lossy(&run.stderr);
        if !run.status.success() || log.contains("[FAIL]") {
            panic!("rgrc could not compile {}:\n{}", src, log);
        }
    }
    println!("cargo:rerun-if-changed=build.rs");
}
