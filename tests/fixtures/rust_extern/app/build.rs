// Writes App.rgr as a Rust module into OUT_DIR with this checkout's compiler.
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
        manifest.join("App.rgr").display().to_string(),
        format!("-d={}", out),
        "-o=App.rs".into(),
    ];
    // base's types are base's: app names them instead of writing them again
    let base = manifest.join("../base/Base.rgr").canonicalize().unwrap();
    args.push(format!("-rust-extern=base={}", base.display()));
    let run = Command::new("node").args(&args).current_dir(&ranger).output().unwrap();
    let log = String::from_utf8_lossy(&run.stdout).to_string() + &String::from_utf8_lossy(&run.stderr);
    if !run.status.success() || log.contains("[FAIL]") {
        panic!("rgrc failed:\n{}", log);
    }
    println!("cargo:rerun-if-changed=App.rgr");
    println!("cargo:rerun-if-changed=../Shared.rgr");
    println!("cargo:rerun-if-changed={}", ranger.join("dist/rgrc.js").display());
}
