// SPDX-License-Identifier: MIT
//
// For a crate's build.rs (`[build-dependencies] ranger`): writes a .rgr file
// as the Rust module `ranger::import_rgr!` includes, with the Ranger
// checkout's compiler (`node <ranger>/dist/rgrc.js -l=rust -rust-module`).
//
//     fn main() {
//         ranger::build::Module::new("MathRgr.rgr")
//             .extern_crate("rangerevg")
//             .compile();
//     }
//
// A crate whose .rgr types other crates use is their extern crate: it sets
// `links = "<name>"` in Cargo.toml and calls `.export_root()` (or
// `.export_path("src/lib.rs")`), which hands the root's path to its dependents (cargo's DEP_<NAME>_RGR_ROOT). A
// dependent's `.extern_crate("<name>")` compiles with
// `-rust-extern=<name>=<root>`: the types of that root's closure are not
// written again but named from the crate, so EVGElement is one type across
// every crate that includes EVG.

use std::path::{Path, PathBuf};
use std::process::Command;

pub struct Module {
    src: String,
    out: String,
    prefix: String,
    externs: Vec<(String, String)>,
    stubs: Vec<(String, String)>,
    export: Option<String>,
}

impl Module {
    /// `src` relative to the crate's manifest directory; the module is
    /// written as OUT_DIR/<file stem>.rs (`import_rgr!("<file stem>")`).
    pub fn new(src: &str) -> Module {
        let stem = Path::new(src).file_stem().unwrap().to_string_lossy().to_string();
        Module {
            src: src.to_string(),
            out: stem,
            prefix: String::new(),
            externs: Vec::new(),
            stubs: Vec::new(),
            export: None,
        }
    }

    /// The name in OUT_DIR, `import_rgr!("<name>")`.
    pub fn out_name(mut self, name: &str) -> Module {
        self.out = name.trim_start_matches("./").to_string();
        self
    }

    /// A line put before the module (`use mfhost::*;` for operator templates
    /// that call another crate).
    pub fn prefix(mut self, line: &str) -> Module {
        self.prefix = line.to_string();
        self
    }

    /// The types of `name`'s .rgr root are `name`'s: a dependency with
    /// `links = "<name>"` that calls `export_root`.
    pub fn extern_crate(mut self, name: &str) -> Module {
        let key = format!("DEP_{}_RGR_ROOT", name.to_uppercase().replace('-', "_"));
        let root = std::env::var(&key).unwrap_or_else(|_| {
            panic!("{} is not set: does {} have links = \"{}\" and export_root()?", key, name, name)
        });
        self.externs.push((name.replace('-', "_"), root));
        self
    }

    /// Text replaced in the written module, for code rustc refuses.
    pub fn stub(mut self, from: &str, to: &str) -> Module {
        self.stubs.push((from.to_string(), to.to_string()));
        self
    }

    /// Hand this module's .rgr root to the crates that depend on this one.
    pub fn export_root(mut self) -> Module {
        self.export = Some(self.src.clone());
        self
    }

    /// Hand `path` (relative to the manifest) to the dependents instead: the
    /// crate's lib.rs when its Rust modules are types the dependents' .rgr
    /// code uses too. Ranger reads the .rs modules and the .rgr files they
    /// include (`import_rgr!`) as that root's closure.
    pub fn export_path(mut self, path: &str) -> Module {
        self.export = Some(path.to_string());
        self
    }

    pub fn compile(self) {
        let manifest = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
        let ranger = ranger_home(&manifest);
        let rgrc = ranger.join("dist/rgrc.js");
        let out_dir = PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let src = manifest.join(&self.src);
        let mut cmd = Command::new("node");
        cmd.arg("--max-old-space-size=8192")
            .arg(&rgrc)
            // the module's objects in ranger::cell::RefCell (cell.rs)
            .args(["-l=rust", "-rust-module", "-rust-ranger-cell"])
            .arg(&src)
            .arg(format!("-d={}", out_dir.display()))
            .arg(format!("-o={}.rs", self.out));
        if !self.externs.is_empty() {
            let list: Vec<String> = self.externs.iter().map(|(n, r)| format!("{}={}", n, r)).collect();
            cmd.arg(format!("-rust-extern={}", list.join(",")));
        }
        let run = cmd
            .current_dir(&ranger)
            .output()
            .expect("node could not run Ranger's rgrc");
        let log = String::from_utf8_lossy(&run.stdout).to_string() + &String::from_utf8_lossy(&run.stderr);
        if !run.status.success() || log.contains("[FAIL]") {
            panic!("rgrc could not compile {} ({}):\n{}", src.display(), rgrc.display(), log);
        }
        let file = out_dir.join(format!("{}.rs", self.out));
        let mut code = std::fs::read_to_string(&file).expect("rgrc wrote no module");
        for (from, to) in &self.stubs {
            code = code.replace(from.as_str(), to.as_str());
        }
        if !self.prefix.is_empty() {
            code = format!("{}\n{}", self.prefix, code);
        }
        std::fs::write(&file, code).unwrap();
        if let Some(root) = &self.export {
            println!("cargo:rgr_root={}", manifest.join(root).canonicalize().unwrap().display());
        }
        // `#[cfg(not(ranger))]` marks what only rustc reads (RustLower)
        println!("cargo::rustc-check-cfg=cfg(ranger)");
        println!("cargo:rerun-if-changed={}", self.src);
        println!("cargo:rerun-if-changed=build.rs");
        println!("cargo:rerun-if-env-changed=RANGER_HOME");
        println!("cargo:rerun-if-changed={}", rgrc.display());
    }
}

/// RANGER_HOME, else the Ranger checkout this crate sits in (a directory
/// above the manifest with dist/rgrc.js), or one a directory above keeps in
/// .deps/Ranger.
pub fn ranger_home(manifest: &Path) -> PathBuf {
    if let Ok(h) = std::env::var("RANGER_HOME") {
        return PathBuf::from(h);
    }
    let mut dir = manifest.to_path_buf();
    loop {
        if dir.join("dist/rgrc.js").is_file() {
            return dir;
        }
        // a project that keeps its Ranger checkout in .deps/Ranger
        let deps = dir.join(".deps/Ranger");
        if deps.join("dist/rgrc.js").is_file() {
            return deps;
        }
        if !dir.pop() {
            panic!("no Ranger checkout above {}: set RANGER_HOME", manifest.display());
        }
    }
}
