// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The PPTX editor's Rust form, exposed to a browser as a bare WebAssembly
// module.
//
// WHY THIS FILE EXISTS AND WHAT IT IS NOT. `pptx_web.rs` is generated from
// `gallery/pptx/web/pptx_web.rgr` by the Ranger Rust backend and is never
// edited. It ends up as plain Rust with no `main`, no I/O it can reach in a
// browser, and no knowledge of one. This is the only hand-written part of
// the build: it says which of that struct's methods a page may call and how
// values cross the boundary. Nothing here implements behaviour — a
// difference between this page and the JavaScript one is a bug in the
// bridge, not in the editor, and that is deliberate.
//
// WHY NO wasm-bindgen. The C++ build reaches WebAssembly through Emscripten,
// which brings a runtime, a heap manager and a glue file. This one is
// `rustc --target wasm32-unknown-unknown` and nothing else: no toolchain to
// install past a rustup target, no glue file to ship, no `Module` object.
// What that costs is this file — the boundary is C ABI, so strings and byte
// arrays cross as an address and a length, and the page reads them out of
// the module's memory itself. Which is what the C++ side ended up doing by
// hand for the big ones anyway (see bind.cpp's `scene_cmds_ptr`), for the
// same reason: `sceneBinary` is 330 000 integers per frame, and a boundary
// that converts them one at a time costs more than the JSON bridge this
// build exists to beat.
//
// THE RULE THE ADDRESSES CARRY. Everything handed back this way lives in one
// of the scratch buffers below and is valid until the next call that can
// refill it. The JavaScript side copies out immediately — see host.mjs.

use std::alloc::{alloc, dealloc, Layout};

// ---- memory ------------------------------------------------------------
//
// The page needs somewhere to put a font, a deck or a string before it can
// name it to a call. These two are that: a plain byte allocator, exact-sized
// so the free knows the layout without being told twice.

/// Reserve `len` bytes and hand back the address. `len == 0` answers a
/// non-null dangling address, which is what an empty slice wants.
#[no_mangle]
pub extern "C" fn rg_alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return std::ptr::NonNull::<u8>::dangling().as_ptr();
    }
    unsafe { alloc(Layout::from_size_align_unchecked(len, 1)) }
}

/// Give back what `rg_alloc` handed out. The length must be the one asked
/// for — this allocator has no header to read it from.
#[no_mangle]
pub extern "C" fn rg_free(ptr: *mut u8, len: usize) {
    if len == 0 || ptr.is_null() {
        return;
    }
    unsafe { dealloc(ptr, Layout::from_size_align_unchecked(len, 1)) }
}

// ---- the value crossing back -------------------------------------------
//
// One scratch buffer for every string and byte array that leaves. A call
// that returns one fills it and answers the LENGTH; the page then reads
// `rg_out_ptr()`. Two calls instead of one, and no allocation on the
// JavaScript side at all.

thread_local! {
    static OUT: std::cell::RefCell<Vec<u8>> = const { std::cell::RefCell::new(Vec::new()) };
}

fn put_bytes(b: &[u8]) -> usize {
    OUT.with(|o| {
        let mut o = o.borrow_mut();
        o.clear();
        o.extend_from_slice(b);
        o.len()
    })
}

fn put_str(s: &str) -> usize {
    put_bytes(s.as_bytes())
}

/// Where the last returned string or byte array starts.
#[no_mangle]
pub extern "C" fn rg_out_ptr() -> *const u8 {
    OUT.with(|o| o.borrow().as_ptr())
}

/// How long it is. The call that produced it answered the same number; this
/// is here for a caller that would rather ask than remember.
#[no_mangle]
pub extern "C" fn rg_out_len() -> usize {
    OUT.with(|o| o.borrow().len())
}

// ---- reading what came in ----------------------------------------------

/// # Safety
/// `ptr` must point at `len` readable bytes, as `rg_alloc` returned them.
unsafe fn in_str<'a>(ptr: *const u8, len: usize) -> &'a str {
    if len == 0 || ptr.is_null() {
        return "";
    }
    // A page that writes a broken UTF-8 sequence gets an empty string rather
    // than a panic: an aborted module cannot be restarted, and no call here
    // is worth losing the editor over.
    std::str::from_utf8(std::slice::from_raw_parts(ptr, len)).unwrap_or("")
}

/// # Safety
/// `ptr` must point at `len` readable bytes.
unsafe fn in_bytes<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    if len == 0 || ptr.is_null() {
        return &[];
    }
    std::slice::from_raw_parts(ptr, len)
}

// ---- the editor --------------------------------------------------------
//
// One editor per module, as the C++ build has one per page: the page only
// ever makes one, and a second would double a heap for nothing. `web_create`
// re-initialises rather than aliasing.

thread_local! {
    static WEB: std::cell::RefCell<Option<PptxWeb>> = const { std::cell::RefCell::new(None) };
}

fn web<R>(f: impl FnOnce(&mut PptxWeb) -> R) -> R {
    WEB.with(|w| {
        let mut w = w.borrow_mut();
        if w.is_none() {
            *w = Some(PptxWeb::new());
        }
        f(w.as_mut().unwrap())
    })
}

#[no_mangle]
pub extern "C" fn web_create() {
    WEB.with(|w| *w.borrow_mut() = Some(PptxWeb::new()));
}

// ---- lifecycle ---------------------------------------------------------

#[no_mangle]
pub extern "C" fn web_start(w: i32, h: i32) {
    web(|e| e.start(w as i64, h as i64))
}

#[no_mangle]
pub extern "C" fn web_resize(w: i32, h: i32) {
    web(|e| e.resize(w as i64, h as i64))
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_load_presets(p: *const u8, n: usize) {
    let s = in_str(p, n).to_string();
    web(|e| e.loadPresets(&s))
}

#[no_mangle]
pub extern "C" fn web_coarse_pointer(c: i32) {
    web(|e| e.setCoarsePointer(c != 0))
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_chrome_css(p: *const u8, n: usize) {
    let s = in_str(p, n).to_string();
    web(|e| e.setChromeCss(&s))
}

#[no_mangle]
pub extern "C" fn web_note() -> usize {
    web(|e| put_str(e.note))
}

// ---- assets ------------------------------------------------------------

/// # Safety
/// See `in_str` and `in_bytes`.
#[no_mangle]
pub unsafe extern "C" fn web_add_font(fp: *const u8, fn_: usize, dp: *const u8, dn: usize) -> i32 {
    let family = in_str(fp, fn_).to_string();
    let data = in_bytes(dp, dn).to_vec();
    web(|e| e.addFont(&family, &data)) as i32
}

/// # Safety
/// See `in_bytes`.
#[no_mangle]
pub unsafe extern "C" fn web_add_face(dp: *const u8, dn: usize) -> i32 {
    let data = in_bytes(dp, dn).to_vec();
    web(|e| e.addFace(&data)) as i32
}

/// # Safety
/// See `in_str` and `in_bytes`.
#[no_mangle]
pub unsafe extern "C" fn web_open_deck(dp: *const u8, dn: usize, np: *const u8, nn: usize) -> i32 {
    let data = in_bytes(dp, dn).to_vec();
    let name = in_str(np, nn).to_string();
    web(|e| e.openDeck(&data, &name)) as i32
}

/// # Safety
/// See `in_str` and `in_bytes`.
#[no_mangle]
pub unsafe extern "C" fn web_insert_picture(np: *const u8, nn: usize, dp: *const u8, dn: usize) -> i32 {
    let name = in_str(np, nn).to_string();
    let data = in_bytes(dp, dn).to_vec();
    web(|e| e.insertPicture(&name, &data)) as i32
}

// ---- navigation --------------------------------------------------------

#[no_mangle]
pub extern "C" fn web_slide_count() -> i32 {
    web(|e| e.slideCount()) as i32
}

#[no_mangle]
pub extern "C" fn web_slide_index() -> i32 {
    web(|e| e.slideIndex()) as i32
}

#[no_mangle]
pub extern "C" fn web_goto_slide(i: i32) {
    web(|e| e.gotoSlide(i as i64))
}

#[no_mangle]
pub extern "C" fn web_next() {
    web(|e| e.next())
}

#[no_mangle]
pub extern "C" fn web_prev() {
    web(|e| e.prev())
}

// ---- input -------------------------------------------------------------

#[no_mangle]
pub extern "C" fn web_pointer(x: i32, y: i32, down: i32) {
    web(|e| e.pointer(x as i64, y as i64, down != 0))
}

#[no_mangle]
pub extern "C" fn web_pointer_at(x: i32, y: i32, pressed: i32, down: i32, released: i32) -> i32 {
    web(|e| e.pointerAt(x as i64, y as i64, pressed != 0, down != 0, released != 0)) as i32
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_key(p: *const u8, n: usize) {
    let s = in_str(p, n).to_string();
    web(|e| e.key(&s))
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_key_mod(p: *const u8, n: usize, shift: i32, ctrl: i32) {
    let s = in_str(p, n).to_string();
    web(|e| e.keyMod(&s, shift != 0, ctrl != 0))
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_type(p: *const u8, n: usize, shift: i32, ctrl: i32) {
    let s = in_str(p, n).to_string();
    web(|e| e.r#type(&s, shift != 0, ctrl != 0))
}

#[no_mangle]
pub extern "C" fn web_mods(shift: i32, ctrl: i32) {
    web(|e| e.mods(shift != 0, ctrl != 0))
}

#[no_mangle]
pub extern "C" fn web_scroll(x: i32, y: i32, d: i32) {
    web(|e| e.scroll(x as i64, y as i64, d as i64))
}

#[no_mangle]
pub extern "C" fn web_scroll_pixels(x: i32, y: i32, dy: i32) {
    web(|e| e.scrollPixels(x as i64, y as i64, dy as i64))
}

// ---- commands and state ------------------------------------------------

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_run(ip: *const u8, il: usize, ap: *const u8, al: usize) -> i32 {
    let id = in_str(ip, il).to_string();
    let arg = in_str(ap, al).to_string();
    web(|e| e.run(&id, &arg)) as i32
}

#[no_mangle]
pub extern "C" fn web_commands() -> usize {
    web(|e| { let s = e.commands(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_take_file_request() -> usize {
    web(|e| { let s = e.takeFileRequest(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_status() -> usize {
    web(|e| { let s = e.status(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_deck_name() -> usize {
    web(|e| { let s = e.deckName(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_suggested_name() -> usize {
    web(|e| { let s = e.suggestedName(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_selection_box() -> usize {
    web(|e| { let s = e.selectionBox(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_image_parts() -> usize {
    web(|e| { let s = e.imageParts(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_slide_panel_width() -> i32 {
    web(|e| e.slidePanelWidth()) as i32
}

#[no_mangle]
pub extern "C" fn web_selection_count() -> i32 {
    web(|e| e.selectionCount()) as i32
}

#[no_mangle]
pub extern "C" fn web_editing() -> i32 {
    web(|e| e.editing()) as i32
}

#[no_mangle]
pub extern "C" fn web_editing_text() -> i32 {
    web(|e| e.editingText()) as i32
}

#[no_mangle]
pub extern "C" fn web_presenting() -> i32 {
    web(|e| e.presenting()) as i32
}

#[no_mangle]
pub extern "C" fn web_animating() -> i32 {
    web(|e| e.animating()) as i32
}

#[no_mangle]
pub extern "C" fn web_tick(seconds: f64) {
    web(|e| e.tick(seconds))
}

// ---- the frame ---------------------------------------------------------
//
// `scene_build` lays the slide out and fills the three arrays; the accessors
// after it hand back addresses into the module's memory. The page reads them
// as `new Int32Array(memory.buffer, ptr, len)` and copies out before it calls
// anything else — the next `scene_build` reallocates.
//
// The arrays are narrowed from i64 to i32 here for the same reason the C++
// side narrows them: Ranger's `int` is 64-bit, every value in a frame fits an
// i32 by construction (coordinates are hundredths of a unit, colours are
// packed RGB), and the page wants an Int32Array. Narrowing once here beats
// narrowing 330 000 times in JavaScript.

thread_local! {
    static SCENE: std::cell::RefCell<Option<EVGSceneBinary>> = const { std::cell::RefCell::new(None) };
    static CMDS: std::cell::RefCell<Vec<i32>> = const { std::cell::RefCell::new(Vec::new()) };
    static PTS: std::cell::RefCell<Vec<i32>> = const { std::cell::RefCell::new(Vec::new()) };
    static ENDS: std::cell::RefCell<Vec<i32>> = const { std::cell::RefCell::new(Vec::new()) };
}

fn narrow(from: &[i64], into: &'static std::thread::LocalKey<std::cell::RefCell<Vec<i32>>>) {
    into.with(|v| {
        let mut v = v.borrow_mut();
        v.clear();
        v.extend(from.iter().map(|x| *x as i32));
    })
}

#[no_mangle]
pub extern "C" fn scene_build() {
    let bin = web(|e| e.sceneBinary());
    narrow(&bin.cmds, &CMDS);
    narrow(&bin.pts, &PTS);
    narrow(&bin.ends, &ENDS);
    SCENE.with(|s| *s.borrow_mut() = Some(bin));
}

fn scene<R>(f: impl FnOnce(&EVGSceneBinary) -> R, empty: R) -> R {
    SCENE.with(|s| match s.borrow().as_ref() {
        Some(b) => f(b),
        None => empty,
    })
}

#[no_mangle]
pub extern "C" fn scene_count() -> i32 {
    scene(|b| b.count as i32, 0)
}

#[no_mangle]
pub extern "C" fn scene_width() -> f64 {
    scene(|b| b.width, 0.0)
}

#[no_mangle]
pub extern "C" fn scene_height() -> f64 {
    scene(|b| b.height, 0.0)
}

#[no_mangle]
pub extern "C" fn scene_cmds_ptr() -> *const i32 {
    CMDS.with(|v| v.borrow().as_ptr())
}

#[no_mangle]
pub extern "C" fn scene_cmds_len() -> i32 {
    CMDS.with(|v| v.borrow().len()) as i32
}

#[no_mangle]
pub extern "C" fn scene_pts_ptr() -> *const i32 {
    PTS.with(|v| v.borrow().as_ptr())
}

#[no_mangle]
pub extern "C" fn scene_pts_len() -> i32 {
    PTS.with(|v| v.borrow().len()) as i32
}

#[no_mangle]
pub extern "C" fn scene_ends_ptr() -> *const i32 {
    ENDS.with(|v| v.borrow().as_ptr())
}

#[no_mangle]
pub extern "C" fn scene_ends_len() -> i32 {
    ENDS.with(|v| v.borrow().len()) as i32
}

#[no_mangle]
pub extern "C" fn scene_strings_len() -> i32 {
    scene(|b| b.strings.len() as i32, 0)
}

#[no_mangle]
pub extern "C" fn scene_string(i: i32) -> usize {
    let s = scene(
        |b| {
            if i < 0 || i as usize >= b.strings.len() {
                String::new()
            } else {
                b.strings[i as usize].clone()
            }
        },
        String::new(),
    );
    put_str(&s)
}

// The JSON frame is kept for the parity test, which compares this build's
// picture with the JavaScript build's. A page never calls it.
#[no_mangle]
pub extern "C" fn web_scene_json() -> usize {
    web(|e| { let s = e.scene(); put_str(&s) })
}

#[no_mangle]
pub extern "C" fn web_slide_scene(i: i32, width_px: i32) -> usize {
    web(|e| { let s = e.slideScene(i as i64, width_px as i64); put_str(&s) })
}

// ---- bytes out ---------------------------------------------------------

#[no_mangle]
pub extern "C" fn web_save() -> usize {
    web(|e| { let b = e.saveBytes(); put_bytes(&b) })
}

/// # Safety
/// See `in_str`.
#[no_mangle]
pub unsafe extern "C" fn web_image(p: *const u8, n: usize) -> usize {
    let part = in_str(p, n).to_string();
    web(|e| { let b = e.imageBytes(&part); put_bytes(&b) })
}
