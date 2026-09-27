// R7: `ranger::tree!` writes a tree of structs as one literal. A field left
// out keeps its default, `[…]` is a Vec and a string literal is a String.
use ranger::prelude::*;

#[derive(Default, Clone)]
struct Style {
    color: String,
    bold: bool,
}

#[derive(Default, Clone)]
struct Node {
    tag: String,
    text: String,
    width: int,
    style: Style,
    children: Vec<Node>,
}

fn render(n: &Node, depth: int, out: &mut Vec<String>) {
    let mut line = format!("{}<{}", "  ".repeat(depth as usize), n.tag);
    if n.width > 0 {
        line = format!("{} width={}", line, n.width);
    }
    if n.style.color != "" {
        line = format!("{} color={}", line, n.style.color);
    }
    if n.style.bold {
        line = format!("{} bold", line);
    }
    line = format!("{}>{}", line, n.text);
    out.push(line);
    for c in &n.children {
        render(c, depth + 1, out);
    }
}

fn count(n: &Node) -> int {
    let mut c = 1;
    for k in &n.children {
        c += count(k);
    }
    c
}

fn main() {
    let title = String::from("Report");
    let page = ranger::tree! {
        Node {
            tag: "page",
            width: 640,
            children: [
                Node { tag: "h1", text: title.clone(), style: Style { bold: true } },
                Node {
                    tag: "list",
                    children: [
                        Node { tag: "item", text: "first" },
                        Node { tag: "item", text: "second", style: Style { color: "red" } },
                    ],
                },
                Node { tag: "footer", width: 640 / 2 },
            ],
        }
    };
    let mut lines: Vec<String> = Vec::new();
    render(&page, 0, &mut lines);
    for l in &lines {
        println!("{}", l);
    }
    println!("{} nodes", count(&page));
}
