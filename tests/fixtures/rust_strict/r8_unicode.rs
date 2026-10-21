// R8: characters past U+FFFF in escapes, plain literals and format strings.
fn main() {
    let a = "a\u{1F600}b";
    let b = "🙂 päivää";
    println!("{} {} {}", a, a.as_bytes().len(), a.chars().count());
    println!("{} {}", b, b.as_bytes().len());
    println!("smile 🙂 {} \u{1F642}", 1);
    let c = format!("x\u{10FFFF}y{}", "\u{e4}");
    println!("{} {}", c.chars().count(), c.as_bytes().len());
    for ch in a.chars() {
        print!("{} ", ch as u32);
    }
    println!();
}
