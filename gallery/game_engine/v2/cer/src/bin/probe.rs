// The conformance probes (bench/conformance.mjs): reads records separated
// by U+0001, each `name` U+0002 `script`, runs every script in a fresh
// engine and prints `name<TAB>result` per line (newlines in the result
// escaped as \n). A probe that crashes the engine answers `panic`.
use cer::Engine;

fn main() {
    let path = std::env::args().nth(1).expect("usage: probe <records>");
    let text = std::fs::read_to_string(&path).expect("cannot read the records");
    std::panic::set_hook(Box::new(|_| {}));
    for rec in text.split('\u{1}') {
        if rec.is_empty() {
            continue;
        }
        let mut parts = rec.splitn(2, '\u{2}');
        let name = parts.next().unwrap_or("").to_string();
        let src = parts.next().unwrap_or("").to_string();
        let r = std::panic::catch_unwind(move || {
            let mut e = Engine::new();
            e.eval_typed(src.as_str())
        })
        .unwrap_or(String::from("panic"));
        println!("{}\t{}", name, r.replace('\\', "\\\\").replace('\n', "\\n"));
    }
}
