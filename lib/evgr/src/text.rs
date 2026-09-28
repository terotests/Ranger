//! Text: EVG's default measurer (the advance table of `EVGTextMeasurer`,
//! line height 1.15 em) and greedy wrapping at spaces.

use ranger::prelude::*;

/// Advances of the characters 32..126 in em, as `EVGTextMeasurer.advanceEm`.
pub fn advance_table() -> Vec<double> {
    vec![
        0.27783, 0.27783, 0.35498, 0.55615, 0.55615, 0.88916, 0.66699, 0.19092,
        0.33301, 0.33301, 0.38916, 0.58398, 0.27783, 0.33301, 0.27783, 0.27783,
        0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615,
        0.55615, 0.55615, 0.27783, 0.27783, 0.58398, 0.58398, 0.58398, 0.55615,
        1.01514, 0.66699, 0.66699, 0.72217, 0.72217, 0.66699, 0.61084, 0.77783,
        0.72217, 0.27783, 0.50000, 0.66699, 0.55615, 0.83301, 0.72217, 0.77783,
        0.66699, 0.77783, 0.72217, 0.66699, 0.61084, 0.72217, 0.66699, 0.94385,
        0.66699, 0.66699, 0.61084, 0.27783, 0.27783, 0.27783, 0.46924, 0.55615,
        0.33301, 0.55615, 0.55615, 0.50000, 0.55615, 0.55615, 0.27783, 0.55615,
        0.55615, 0.22217, 0.22217, 0.50000, 0.22217, 0.83301, 0.55615, 0.55615,
        0.55615, 0.55615, 0.33301, 0.50000, 0.27783, 0.55615, 0.50000, 0.72217,
        0.50000, 0.50000, 0.50000, 0.33398, 0.25977, 0.33398, 0.58398,
    ]
}

pub fn line_height(font_size: double) -> double {
    font_size * 1.15
}

pub fn measure(table: &Vec<double>, text: &str, font_size: double) -> double {
    let mut w = 0.0;
    for c in text.chars() {
        let code = c as int;
        if code >= 32 && code <= 126 {
            w += table[(code - 32) as usize] * font_size;
        } else {
            w += 0.55 * font_size;
        }
    }
    w
}

/// The widest word: the narrowest the text can be.
pub fn min_width(table: &Vec<double>, text: &str, font_size: double) -> double {
    let mut best = 0.0;
    for word in text.split_whitespace() {
        let w = measure(table, word, font_size);
        if w > best {
            best = w;
        }
    }
    best
}

/// Lines of `text` broken at spaces to fit `max_w` (a word wider than that
/// stands on its own line): how many, and the widest.
pub fn wrap(table: &Vec<double>, text: &str, font_size: double, max_w: double) -> (int, double) {
    let space = measure(table, " ", font_size);
    let mut lines = 0;
    let mut widest = 0.0;
    let mut cur = -1.0;
    for word in text.split_whitespace() {
        let w = measure(table, word, font_size);
        if cur < 0.0 {
            cur = w;
            lines += 1;
        } else if cur + space + w <= max_w + 0.001 {
            cur = cur + space + w;
        } else {
            if cur > widest {
                widest = cur;
            }
            cur = w;
            lines += 1;
        }
    }
    if cur > widest {
        widest = cur;
    }
    if lines == 0 {
        lines = 1;
        widest = 0.0;
    }
    (lines, widest)
}
