fn patterns(p: &(u8, [u8; 2])) {
    match p {
        &(0..=9, [a, .., b]) => {}
        (ref r @ 10.., _) => {}
        (x @ (1 | 2), [_, _]) => {}
        Foo::Bar { x, y: Some(z), .. } => {}
        Tuple(first, rest @ ..) => {}
        'a'..='z' | b'0' | "s" | -5 | true => {}
        box inner => {}
        m!(tokens) => {}
    }
}

fn types(
    a: &'static str,
    b: *const u8,
    c: *mut [u8],
    d: fn(u8, x: i32) -> bool,
    e: unsafe extern "C" fn(),
    f: impl Fn(&str) -> String + Send,
    g: Box<dyn for<'a> FnMut(&'a u8) + 'static>,
    h: (u8, (), [String; 3]),
    i: <Vec<u8> as IntoIterator>::Item,
    j: Option<Result<Vec<HashMap<String, i64>>, ()>>,
    k: !,
    l: _,
) where for<'b> F: Fn(&'b u8), 'x: 'y {}
