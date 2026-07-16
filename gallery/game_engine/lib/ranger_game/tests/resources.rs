//! Parser for the resource list the host writes back (`rg_list_resources`).
//!
//! These mirror the C++ producer in gfx_sdl.rgr (`rgfx_scene_resource_names`):
//! NUL-separated names in map order, only whole names written, an empty name
//! terminating the written region, and the return value reporting the size the
//! full list needs — which may exceed the buffer.

use ranger_game::resources;

/// Build what the host would write: `names` NUL-separated into a `cap`-byte
/// buffer, skipping any that do not fit whole, plus the terminating empty name.
/// Returns (buffer, needed) exactly as the C++ does.
fn host_writes(names: &[&str], cap: usize) -> (Vec<u8>, usize) {
    let mut buf = vec![0u8; cap];
    let mut need = 0usize;
    let mut off = 0usize;
    for n in names {
        let b = n.as_bytes();
        need += b.len() + 1;
        if off + b.len() + 1 <= cap {
            buf[off..off + b.len()].copy_from_slice(b);
            buf[off + b.len()] = 0;
            off += b.len() + 1;
        }
    }
    if off < cap {
        buf[off] = 0;
    }
    (buf, need)
}

fn collect(names: &[&str], cap: usize) -> Vec<String> {
    let (buf, need) = host_writes(names, cap);
    resources::parse(&buf, need).map(|s| s.to_string()).collect()
}

#[test]
fn reads_every_name_when_it_all_fits() {
    let names = ["Box", "BoxTextured", "Duck", "tree_pine_1"];
    assert_eq!(collect(&names, 256), names);
}

#[test]
fn reports_needed_and_not_truncated_when_it_fits() {
    let (buf, need) = host_writes(&["Box", "Duck"], 256);
    let r = resources::parse(&buf, need);
    assert_eq!(r.needed, 9); // "Box\0" + "Duck\0"
    assert!(!r.truncated());
}

#[test]
fn empty_list_yields_nothing() {
    assert_eq!(collect(&[], 64), Vec::<String>::new());
}

#[test]
fn zero_capacity_is_safe() {
    let (buf, need) = host_writes(&["Box"], 0);
    assert_eq!(resources::parse(&buf, need).count(), 0);
}

#[test]
fn truncated_list_yields_only_whole_names() {
    // "Box\0"=4, "BoxTextured\0"=12, "Duck\0"=5. In 8 bytes only "Box" fits: the
    // 12-byte name is skipped and "Duck" no longer fits the 4 bytes left.
    let names = ["Box", "BoxTextured", "Duck"];
    assert_eq!(collect(&names, 8), ["Box"]);

    let (buf, need) = host_writes(&names, 8);
    let r = resources::parse(&buf, need);
    assert!(r.truncated());
    assert_eq!(r.needed, 4 + 12 + 5);
}

#[test]
fn a_name_too_big_to_fit_does_not_hide_later_smaller_ones() {
    // The producer skips only what does not fit, so a long name in the middle
    // must not truncate the rest: in 9 bytes "Box" and "Duck" both land.
    assert_eq!(collect(&["Box", "BoxTextured", "Duck"], 9), ["Box", "Duck"]);
}

#[test]
fn never_yields_a_partial_name_from_stale_buffer_bytes() {
    // A buffer holding junk past the written region must not be parsed as names:
    // the host's terminating empty name has to stop iteration.
    let (mut buf, need) = host_writes(&["Box"], 64);
    for b in buf.iter_mut().skip(8) {
        *b = b'X'; // stale garbage, no NUL
    }
    let got: Vec<String> = resources::parse(&buf, need).map(|s| s.to_string()).collect();
    assert_eq!(got, ["Box"]);
}

#[test]
fn unterminated_tail_is_dropped_rather_than_returned_partial() {
    // Truncation at exactly the buffer end with no terminator: the last run of
    // bytes has no NUL, so it must be discarded, not yielded half-formed.
    let buf = b"Box\0Duc".to_vec();
    let got: Vec<String> = resources::parse(&buf, 64).map(|s| s.to_string()).collect();
    assert_eq!(got, ["Box"], "the partial 'Duc' must not surface");
}

#[test]
fn non_utf8_name_is_skipped_not_panicked_on() {
    let buf = b"Box\0\xff\xfe\0Duck\0\0".to_vec();
    let got: Vec<String> = resources::parse(&buf, buf.len()).map(|s| s.to_string()).collect();
    assert!(got.contains(&"Box".to_string()));
}
