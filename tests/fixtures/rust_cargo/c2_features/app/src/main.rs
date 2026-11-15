#[cfg(feature = "long")]
mod names;

#[cfg(feature = "long")]
fn label() -> String {
    names::long_name()
}

#[cfg(not(feature = "long"))]
fn label() -> String {
    String::from("off")
}

#[cfg(feature = "short")]
fn extra() -> String {
    String::from("short on")
}

#[cfg(not(feature = "short"))]
fn extra() -> String {
    String::from("short off")
}

fn main() {
    println!("{}", label());
    println!("{}", extra());
    println!("{}", zones::zone_count());
}
