// Strings are UTF-8, as in Rust, on every target.
//
// `chars()` walks characters, `bytes()` walks UTF-8 bytes, and `find`
// answers a byte offset that slicing accepts. Ranger refuses `s.len()` so a
// length always says which unit it counts.

fn capitalize(word: &str) -> String {
    match word.chars().next() {
        Some(first) => first.to_uppercase().collect::<String>() + &word[first.len_utf8()..],
        None => String::new(),
    }
}

fn is_palindrome(s: &str) -> bool {
    let letters: Vec<char> = s.chars().filter(|c| c.is_alphanumeric()).map(|c| c.to_ascii_lowercase()).collect();
    let n = letters.len();
    (0..n / 2).all(|i| letters[i] == letters[n - 1 - i])
}

fn caesar(s: &str, shift: u8) -> String {
    s.chars()
        .map(|c| {
            if c.is_ascii_lowercase() {
                (((c as u8 - b'a' + shift) % 26) + b'a') as char
            } else {
                c
            }
        })
        .collect()
}

fn main() {
    let greeting = "héllo wörld 👋";
    println!("{} chars, {} bytes", greeting.chars().count(), greeting.as_bytes().len());
    let words: Vec<String> = greeting.split(' ').map(capitalize).collect();
    println!("{}", words.join(" "));

    if let Some(at) = greeting.find("wörld") {
        println!("'wörld' starts at byte {}: [{}]", at, &greeting[at..]);
    }
    let rev: String = greeting.chars().rev().collect();
    println!("{}", rev);

    for s in ["Anna", "A man, a plan, a canal: Panama", "Rust"].iter() {
        println!("{:?} palindrome: {}", s, is_palindrome(s));
    }
    println!("{}", caesar("attack at dawn", 3));

    let csv = "name;age;city\nAda;36;London\nLinus;28;Helsinki";
    for (i, line) in csv.lines().enumerate().skip(1) {
        let fields: Vec<&str> = line.split(';').collect();
        println!("{}. {:<6}|{:>4}|{:^10}|", i, fields[0], fields[1], fields[2]);
    }
}
