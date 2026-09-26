struct View<'a> {
    text: &'a str,
}

fn main() {
    let v = View { text: "hi" };
    println!("{}", v.text);
}
