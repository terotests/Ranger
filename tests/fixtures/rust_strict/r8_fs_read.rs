// std::fs::read: an io::Result<Vec<u8>>
use std::fs;

fn size_of(path: &str) -> i64 {
    match fs::read(path) {
        Ok(b) => b.len() as i64,
        Err(_) => -1,
    }
}

fn main() {
    match fs::read("no/such/dir/file.bin") {
        Ok(b) => println!("read {}", b.len()),
        Err(e) => println!("error: {}", e),
    }
    let n = size_of("/no-such-file.bin");
    println!("size {}", n);
    let empty: Vec<u8> = fs::read("missing.bin").unwrap_or_default();
    println!("default {}", empty.len());
}
