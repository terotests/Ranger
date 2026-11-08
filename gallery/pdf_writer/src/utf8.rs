// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;

use crate::rgr::PdfText;
use crate::rgr::{EVGCodepoint};

/// Utf8.rgr - Decode source files as UTF-8 instead of Latin-1
///
/// `buffer_to_string` builds a string with String.fromCharCode over the raw
/// bytes, i.e. it reinterprets the file as Latin-1. For an ASCII file that is
/// identical to UTF-8, so nothing showed up for a long time. For anything else it
/// is wrong twice over:
///
///   "ä"  (U+00E4, bytes C3 A4)    -> two characters 0xC3 0xA4
///   "—"  (U+2014, bytes E2 80 94) -> three characters 0xE2 0x80 0x94
///
/// Layout then measures two or three glyph advances for one character, so the box
/// it reserves is too wide, and the PDF writes each byte as a separate WinAnsi
/// escape, so the page prints "Ã¤" where the source said "ä". Neither side
/// complains, which is exactly the silent mangling PLAN_CSS_LAYOUT_AND_FONTS.md
/// §4.1 rule 8 is about.
///
/// Decoding here means text content carries real codepoints, so measurement
/// counts real glyphs, characters WinAnsi does encode reach the page as the
/// right byte, and the ones it genuinely cannot are reported honestly by the
/// PDF encoder rather than hidden inside a byte sequence that happens to fit.
///
/// Invalid sequences are passed through byte-for-byte rather than replaced: a
/// file that is actually Latin-1 keeps working exactly as it did before.
#[derive(Clone)]
pub struct Utf8 {
}

impl Utf8 {
    pub fn new() -> Self {
        Self {
        }
    }
    /// Is a string BYTES here, or characters?
    ///
    /// Ranger's `string` does not mean the same thing on every target it
    /// compiles to. In JavaScript it is UTF-16 code units, so "ä" is one of
    /// them and `charAt` hands back 228. In C++ it is a `std::string` of bytes,
    /// so "ä" is the two bytes UTF-8 spells it with and `charAt` hands back 195.
    /// Everything in this file converts between those two ideas, so it has to
    /// know which one it is standing in — and the language will say, if asked.
    /// Asking it is cheaper and more honest than asking which compiler ran.
    pub fn stringIsBytes() -> bool {
        EVGCodepoint::stringIsBytes()
    }
    /// Encoding back out. Delegates to EVGCodepoint so that astral codepoints
    /// become the proper four-byte form; this used to emit CESU-8, which is not
    /// valid UTF-8 and broke every emoji that reached a file.
    pub fn encode(s: &str) -> String {
        // Where a string is already bytes, it is already UTF-8: encoding it
        // again would spell each byte as a character and double every accent.
        if Utf8::stringIsBytes() {
            return s.to_string();
        }
        EVGCodepoint::encodeUtf8(s)
    }
    /// Reinterpret a Latin-1-decoded string (what buffer_to_string produces) as
    /// UTF-8, returning real codepoints.
    pub fn decode(raw: &str) -> String {
        // …and the same the other way: bytes read out of a file are already
        // what a string is made of here, so there is nothing to decode.
        if Utf8::stringIsBytes() {
            return raw.to_string();
        }
        let __len: i64 = PdfText::str_len(&raw) as i64;
        // ASCII-only Latin-1 is already valid UTF-8. Skip the per-character
        // rebuild — xlsx sheet XML can be hundreds of MB of ASCII, and
        // `out = out + …` for that size is unusable even when it does not
        // blow the stack.
        let mut scan: i64 = 0;
        let mut ascii_only: bool = true;
        while scan < __len {
            if PdfText::char_at(&raw, scan) > 127 {
                ascii_only = false;
                break;
            }
            scan += 1;
        }
        if ascii_only {
            return raw.to_string();
        }
        let mut out: String = String::new();
        let mut i: i64 = 0;
        while i < __len {
            let b0: i64 = PdfText::char_at(&raw, i);
            // Anything already above the byte range means this string was not
            // produced by a raw byte read; leave it alone.
            if b0 > 255 {
                out.push_str(&char::from_u32(b0 as u32).unwrap_or('\0').to_string());
                i += 1;
                continue;
            }
            if b0 < 128 {
                out.push_str(&char::from_u32(b0 as u32).unwrap_or('\0').to_string());
                i += 1;
                continue;
            }
            // 110xxxxx 10xxxxxx  ->  U+0080..U+07FF
            if b0 >= 192 && b0 < 224 {
                if i + 1 < __len {
                    let b1: i64 = PdfText::char_at(&raw, i + 1);
                    if Utf8::isCont(b1) {
                        let cp: i64 = (b0 - 192) * 64 + (b1 - 128);
                        out.push_str(&char::from_u32(cp as u32).unwrap_or('\0').to_string());
                        i += 2;
                        continue;
                    }
                }
            }
            // 1110xxxx 10xxxxxx 10xxxxxx  ->  U+0800..U+FFFF
            if b0 >= 224 && b0 < 240 {
                if i + 2 < __len {
                    let b1b: i64 = PdfText::char_at(&raw, i + 1);
                    let b2: i64 = PdfText::char_at(&raw, i + 2);
                    if Utf8::isCont(b1b) && Utf8::isCont(b2) {
                        let cp3: i64 = ((b0 - 224) * 4096 + (b1b - 128) * 64) + (b2 - 128);
                        out.push_str(&char::from_u32(cp3 as u32).unwrap_or('\0').to_string());
                        i += 3;
                        continue;
                    }
                }
            }
            // 11110xxx + 3 continuations -> above the BMP. strfromcode takes a
            // UTF-16 code unit, so these are emitted as a surrogate pair.
            if b0 >= 240 && b0 < 248 {
                if i + 3 < __len {
                    let c1: i64 = PdfText::char_at(&raw, i + 1);
                    let c2: i64 = PdfText::char_at(&raw, i + 2);
                    let c3: i64 = PdfText::char_at(&raw, i + 3);
                    if (Utf8::isCont(c1) && Utf8::isCont(c2)) && Utf8::isCont(c3) {
                        let cp4: i64 = (((b0 - 240) * 262144 + (c1 - 128) * 4096) + (c2 - 128) * 64) + (c3 - 128);
                        let rel: i64 = cp4 - 65536;
                        let hi: i64 = 55296 + ((rel as f64 / 1024.0).floor() as i64);
                        let lo: i64 = 56320 + rel % 1024;
                        out.push_str(&char::from_u32(hi as u32).unwrap_or('\0').to_string());
                        out.push_str(&char::from_u32(lo as u32).unwrap_or('\0').to_string());
                        i += 4;
                        continue;
                    }
                }
            }
            // Not a valid sequence — keep the byte as-is so genuinely Latin-1
            // input is unchanged.
            out.push_str(&char::from_u32(b0 as u32).unwrap_or('\0').to_string());
            i += 1;
        }
        out
    }
    pub fn isCont(b: i64) -> bool {
        b >= 128 && b < 192
    }
    /// ---- WinAnsi (CP1252) -------------------------------------------------
    ///
    /// WinAnsi is not Latin-1. The two agree over 0x20-0x7E and 0xA0-0xFF, but
    /// the band 0x80-0x9F — which Latin-1 leaves as control codes — is where
    /// CP1252 keeps the characters a book actually sets: en and em dashes,
    /// curly quotes, the ellipsis, the bullet, the euro sign. Treating "above
    /// U+00FF" as "outside WinAnsi" refused precisely those, and under
    /// -strict-fonts it refused them fatally, on text the format can carry.
    ///
    /// Five codes in that band (0x81, 0x8D, 0x8F, 0x90, 0x9D) are unassigned.
    /// Unicode codepoint -> WinAnsi byte, or -1 when the font truly cannot
    /// encode it. Codepoints below 0x20 are not a repertoire question — the
    /// writer handles control characters separately — and are reported here as
    /// unencodable so callers do not have to special-case them.
    /// A character WinAnsi has no byte for, answered with the one it draws
    /// like, or itself. These are the ones ordinary Finnish and English text
    /// is full of: the minus sign, and the narrow and thin spaces a number
    /// like "18 742" is grouped with. Without this each printed as "?".
    pub fn winAnsiStandIn(cp: i64) -> i64 {
        // minus sign -> en dash
        if cp == 8722 {
            return 8211;
        }
        // non-breaking hyphen -> hyphen
        if cp == 8209 {
            return 45;
        }
        // hyphen -> hyphen-minus
        if cp == 8208 {
            return 45;
        }
        // narrow no-break space -> no-break space
        if cp == 8239 {
            return 160;
        }
        // thin space
        if cp == 8201 {
            return 32;
        }
        // punctuation space
        if cp == 8200 {
            return 32;
        }
        // figure space
        if cp == 8199 {
            return 160;
        }
        // six-per-em space
        if cp == 8198 {
            return 32;
        }
        // hair space
        if cp == 8202 {
            return 32;
        }
        cp
    }
    pub fn toWinAnsi(cp: i64) -> i64 {
        if (cp >= 32 && cp <= 126) {
            return cp;
        }
        if (cp >= 160 && cp <= 255) {
            return cp;
        }
        // euro sign
        if cp == 8364 {
            return 128;
        }
        // single low-9 quote
        if cp == 8218 {
            return 130;
        }
        // florin
        if cp == 402 {
            return 131;
        }
        // double low-9 quote
        if cp == 8222 {
            return 132;
        }
        // ellipsis
        if cp == 8230 {
            return 133;
        }
        // dagger
        if cp == 8224 {
            return 134;
        }
        // double dagger
        if cp == 8225 {
            return 135;
        }
        // circumflex
        if cp == 710 {
            return 136;
        }
        // per mille
        if cp == 8240 {
            return 137;
        }
        // S caron
        if cp == 352 {
            return 138;
        }
        // single left angle quote
        if cp == 8249 {
            return 139;
        }
        // OE ligature
        if cp == 338 {
            return 140;
        }
        // Z caron
        if cp == 381 {
            return 142;
        }
        // left single quote
        if cp == 8216 {
            return 145;
        }
        // right single quote
        if cp == 8217 {
            return 146;
        }
        // left double quote
        if cp == 8220 {
            return 147;
        }
        // right double quote
        if cp == 8221 {
            return 148;
        }
        // bullet
        if cp == 8226 {
            return 149;
        }
        // en dash
        if cp == 8211 {
            return 150;
        }
        // em dash
        if cp == 8212 {
            return 151;
        }
        // small tilde
        if cp == 732 {
            return 152;
        }
        // trade mark
        if cp == 8482 {
            return 153;
        }
        // s caron
        if cp == 353 {
            return 154;
        }
        // single right angle quote
        if cp == 8250 {
            return 155;
        }
        // oe ligature
        if cp == 339 {
            return 156;
        }
        // z caron
        if cp == 382 {
            return 158;
        }
        // Y diaeresis
        if cp == 376 {
            return 159;
        }
        0 - 1
    }
    /// WinAnsi byte -> Unicode codepoint, or -1 for the five unassigned codes.
    /// The PDF font's /Widths array and /ToUnicode cmap are both indexed by
    /// byte, so they need the inverse to look a glyph up by its real codepoint.
    pub fn fromWinAnsi(b: i64) -> i64 {
        if (b >= 32 && b <= 126) {
            return b;
        }
        if (b >= 160 && b <= 255) {
            return b;
        }
        // euro sign
        if b == 128 {
            return 8364;
        }
        // single low-9 quote
        if b == 130 {
            return 8218;
        }
        // florin
        if b == 131 {
            return 402;
        }
        // double low-9 quote
        if b == 132 {
            return 8222;
        }
        // ellipsis
        if b == 133 {
            return 8230;
        }
        // dagger
        if b == 134 {
            return 8224;
        }
        // double dagger
        if b == 135 {
            return 8225;
        }
        // circumflex
        if b == 136 {
            return 710;
        }
        // per mille
        if b == 137 {
            return 8240;
        }
        // S caron
        if b == 138 {
            return 352;
        }
        // single left angle quote
        if b == 139 {
            return 8249;
        }
        // OE ligature
        if b == 140 {
            return 338;
        }
        // Z caron
        if b == 142 {
            return 381;
        }
        // left single quote
        if b == 145 {
            return 8216;
        }
        // right single quote
        if b == 146 {
            return 8217;
        }
        // left double quote
        if b == 147 {
            return 8220;
        }
        // right double quote
        if b == 148 {
            return 8221;
        }
        // bullet
        if b == 149 {
            return 8226;
        }
        // en dash
        if b == 150 {
            return 8211;
        }
        // em dash
        if b == 151 {
            return 8212;
        }
        // small tilde
        if b == 152 {
            return 732;
        }
        // trade mark
        if b == 153 {
            return 8482;
        }
        // s caron
        if b == 154 {
            return 353;
        }
        // single right angle quote
        if b == 155 {
            return 8250;
        }
        // oe ligature
        if b == 156 {
            return 339;
        }
        // z caron
        if b == 158 {
            return 382;
        }
        // Y diaeresis
        if b == 159 {
            return 376;
        }
        0 - 1
    }
    /// Does this string contain anything a WinAnsi PDF font cannot encode?
    pub fn hasNonWinAnsi(s: &str) -> bool {
        let mut i: i64 = 0;
        while i < (PdfText::str_len(&s) as i64) {
            let cp: i64 = EVGCodepoint::codeAt(s, i);
            let step: i64 = EVGCodepoint::unitsAt(s, i);
            if cp >= 32 {
                if Utf8::toWinAnsi(cp) < 0 {
                    return true;
                }
            }
            i += step;
        }
        false
    }
}
