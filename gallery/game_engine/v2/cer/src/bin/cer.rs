// Runs a script file with CEr: `cargo run --release --bin cer -- file.js`
use cer::Engine;

fn main() {
    let path = std::env::args().nth(1).expect("usage: cer <file.js>");
    let src = std::fs::read_to_string(&path).expect("cannot read the script");
    let mut e = Engine::new();
    e.set_echo(true);
    let r = e.eval(src.as_str());
    if !e.error.is_empty() {
        eprintln!("{}", r);
        std::process::exit(1);
    }
}
