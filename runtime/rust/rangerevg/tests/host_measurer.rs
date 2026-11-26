//! EVGHostTextMeasurer measures with the function the host attaches: the
//! closure field compiles as Ranger writes it, with no build.rs stub.

use rangerevg::EVGHostTextMeasurer;

#[test]
fn attached_function_measures() {
    let mut m = EVGHostTextMeasurer::new();
    m.attach(
        Box::new(|kind: i64, text: String, _family: String, size: f64, _bold: bool, _italic: bool| -> f64 {
            match kind {
                0 => text.chars().count() as f64 * size,
                1 => size * 0.75,
                2 => size * 0.25,
                _ => 0.0,
            }
        }),
        "test".to_string(),
    );
    let w = m.measure_text("abcd".to_string(), "Sans".to_string(), 10.0);
    assert_eq!(w.borrow().width, 40.0);
    assert_eq!(w.borrow().ascent, 7.5);
    assert_eq!(w.borrow().descent, 2.5);
}
