// Lexer cases: every literal form, comments and doc comments.
/// outer doc
/** block doc */
/* plain /* nested */ comment */
//// not a doc comment
fn lits() {
    let i = [1, 1_000, 0xff_u8, 0o17, 0b1010, 7i64, 3usize];
    let f = [1.5, 2.0f32, 3e10, 4.5E-3, 5f64, 6.];
    let s = ["plain", "esc\n\t\\\"\'\0", "\x41\u{e9}", "line\
              continued", r"raw \n", r#"has "quotes""#, r##"#"##];
    let b = [b'a', b'\n'];
    let bs = [b"bytes", br"raw bytes"];
    let cs = c"c string";
    // '\u{1F600}' is left out until strfromcode handles code points above U+FFFF on JS
    let c = ['a', '\'', '\u{e9}', 'é', '😀'];
    let l: &'static str = "é";
    let r#type = 1;
    let t = x.0.1;
    let range = 1..2;
    let m = 1.max(2);
    let é = "unicode ident";
}
