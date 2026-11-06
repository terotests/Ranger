// Writes Base.rgr as a Rust module into OUT_DIR with this checkout's compiler.
use std::path::PathBuf;
use std::process::Command;

fn main() {
    let manifest = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let ranger = manifest.join("../../../..").canonicalize().unwrap();
    let out = std::env::var("OUT_DIR").unwrap();
    let mut args: Vec<String> = vec![
        "dist/rgrc.js".into(),
        "-l=rust".into(),
        "-rust-module".into(),
        manifest.join("Base.rgr").display().to_string(),
        format!("-d={}", out),
        "-o=Base.rs".into(),
    ];
    let run = Command::new("node").args(&args).current_dir(&ranger).output().unwrap();
    let log = String::from_utf8_lossy(&run.stdout).to_string() + &String::from_utf8_lossy(&run.stderr);
    if !run.status.success() || log.contains("[FAIL]") {
        panic!("rgrc failed:\n{}", log);
    }
    println!("cargo:rerun-if-changed=Base.rgr");
    println!("cargo:rerun-if-changed=../Shared.rgr");
    println!("cargo:rerun-if-changed={}", ranger.join("dist/rgrc.js").display());
}
