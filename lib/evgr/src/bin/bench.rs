// The fixtures of lib/evg/bench/layout-bench.mjs, laid out by EVGr built
// natively (cargo run --release --bin bench). Prints one JSON line per
// fixture and size: nodes, build and layout time in ms (median of runs),
// and a checksum of the boxes that bench/speed.mjs compares with the other
// engines' layout of the same tree.
//
//   cargo run --release --bin bench -- [1000,10000,100000]

use evgr::EvgrTree;
use std::time::Instant;

const PAGE: &str = "display:flex;flex-direction:column;flex-wrap:nowrap;width:1200px;gap:8px;align-items:stretch";
const CARD: &str = "display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;padding:8px;align-items:stretch";
const RAIL: &str = "width:48px;height:56px;background-color:#e4e4e7";
const BODY: &str = "display:flex;flex-direction:column;flex-wrap:nowrap;flex-grow:1;gap:4px;align-items:stretch";
const LINE: &str = "height:16px;background-color:#f4f4f5";
const GRIDC: &str = "display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;width:1200px";
const CELL: &str = "display:flex;flex-direction:column;flex-wrap:nowrap;gap:4px;padding:6px;align-items:stretch";
const TEXT: &str = "font-size:14px";
const WORDS: [&str; 5] = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Edsger Dijkstra", "Barbara McClintock"];

fn flex(n: usize, with_text: bool) -> EvgrTree {
    let mut t = EvgrTree::new();
    let page = t.add(-1, PAGE);
    let cards = ((n as f64 / 7.0).round() as usize).max(1);
    for i in 0..cards {
        let card = t.add(page, CARD);
        t.add(card, RAIL);
        let body = t.add(card, BODY);
        for j in 0..4 {
            if with_text && j == 0 {
                t.add_text(body, TEXT, WORDS[i % WORDS.len()]);
            } else {
                t.add(body, LINE);
            }
        }
    }
    t
}

fn grid(n: usize) -> EvgrTree {
    let mut t = EvgrTree::new();
    let g = t.add(-1, GRIDC);
    let cells = ((n as f64 / 5.0).round() as usize).max(1);
    for _ in 0..cells {
        let cell = t.add(g, CELL);
        for _ in 0..4 {
            t.add(cell, LINE);
        }
    }
    t
}

fn build(name: &str, n: usize) -> EvgrTree {
    match name {
        "flex" => flex(n, false),
        "grid" => grid(n),
        _ => flex(n, true),
    }
}

fn median(mut v: Vec<f64>) -> f64 {
    v.sort_by(|a, b| a.partial_cmp(b).unwrap());
    v[v.len() / 2]
}

fn checksum(t: &EvgrTree) -> f64 {
    let mut s = 0.0;
    for i in 0..t.count() {
        s += t.x(i) + t.y(i) + t.w(i) + t.h(i);
    }
    s
}

fn main() {
    let arg = std::env::args().nth(1).unwrap_or(String::from("1000,10000,100000"));
    let sizes: Vec<usize> = arg.split(',').map(|s| s.trim().parse().unwrap()).collect();
    for name in ["flex", "grid", "text"] {
        for &n in &sizes {
            let mut builds = Vec::new();
            for _ in 0..3 {
                let a = Instant::now();
                let t = build(name, n);
                builds.push(a.elapsed().as_secs_f64() * 1000.0);
                std::hint::black_box(&t);
            }
            let mut t = build(name, n);
            t.layout(1200.0, 900.0);
            let mut runs = Vec::new();
            for _ in 0..5 {
                let a = Instant::now();
                t.layout(1200.0, 900.0);
                runs.push(a.elapsed().as_secs_f64() * 1000.0);
            }
            println!(
                "{{\"fixture\":\"{}\",\"size\":{},\"nodes\":{},\"build\":{:.3},\"layout\":{:.3},\"checksum\":{:.3}}}",
                name,
                n,
                t.count(),
                median(builds),
                median(runs),
                checksum(&t)
            );
        }
    }
}
