#[cfg(feature = "table")]
pub fn zone_count() -> i64 {
    3
}

#[cfg(not(feature = "table"))]
pub fn zone_count() -> i64 {
    0
}

#[cfg(test)]
mod tests {
    #[test]
    fn has_a_count() {
        assert!(super::zone_count() >= 0);
    }
}
