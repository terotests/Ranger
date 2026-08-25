/**
 * The Rust WebAssembly editor, wearing the JavaScript editor's face.
 *
 * WHY IT LOOKS LIKE THIS. `standalone.mjs` — the whole page: chrome, pointer,
 * keyboard, the show, printing, saving — is used by this page UNCHANGED. It
 * asks for a global class called `PptxWeb` and calls about forty methods on
 * it. So this file's entire job is to define that class over the WASM module,
 * method for method, and then get out of the way. Any difference between this
 * page and the JavaScript one is then a difference in the ENGINE, which is
 * the only thing being compared. It is the same shape as the C++ build's
 * `wasm-host.mjs` for the same reason.
 *
 * WHAT IS DIFFERENT FROM THAT ONE. There is no Emscripten here, so there is
 * no `Module` object and no glue file: `rustc --target wasm32-unknown-unknown`
 * emits a module with 62 exports and ZERO imports, and this file instantiates
 * it directly. What Emscripten was doing for the C++ build — marshalling
 * strings and byte arrays across the boundary — is done here by hand, because
 * the boundary is the C ABI and nothing else.
 *
 * HOW A VALUE CROSSES. In: the page asks the module for `rg_alloc(n)` bytes,
 * writes into its memory, passes the address and the length, and frees after.
 * Out: the call fills one scratch buffer inside the module and answers its
 * LENGTH; the page reads it at `rg_out_ptr()`. Two calls instead of one, and
 * no allocation on this side at all.
 *
 * WHY THE FRAME IS NOT COPIED. `sceneBinary` is 330 000 integers on a chart
 * slide. The module hands back the ADDRESS of its own storage and the arrays
 * below are typed-array VIEWS straight onto WASM memory. Nothing is copied in
 * either direction.
 *
 * THE ONE RULE THOSE VIEWS CARRY. They are valid until the next call that can
 * reallocate — in practice until the next `sceneBinary()`. The page reads a
 * frame and draws it before asking for another, which is exactly that
 * discipline. A caller that wants to KEEP a frame must copy the views first.
 *
 * WHY THE MEMORY IS RE-READ EVERY TIME. WebAssembly memory can grow, and a
 * grown memory is a NEW ArrayBuffer — every view onto the old one is detached
 * and reading it throws. So the buffer is taken from the module at the moment
 * the view is made, never cached.
 */

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8");

/** A JS byte source as a Uint8Array, without copying when it already is one. */
function bytes(data) {
  if (data == null) return new Uint8Array(0);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Uint8Array(data);
}

/**
 * Load the module. `url` defaults to `pptx_wasm.wasm` beside this file, which
 * is where the build puts it. Node reads it off disk — `instantiateStreaming`
 * wants a real HTTP response and a `file:` fetch is not one.
 */
async function loadModule(url) {
  const target = url ?? new URL("./pptx_wasm.wasm", import.meta.url);
  const href = String(target);
  if (href.startsWith("file:")) {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const buf = await readFile(fileURLToPath(href));
    return (await WebAssembly.instantiate(buf, {})).instance;
  }
  if (typeof WebAssembly.instantiateStreaming === "function") {
    return (await WebAssembly.instantiateStreaming(fetch(href), {})).instance;
  }
  const buf = await (await fetch(href)).arrayBuffer();
  return (await WebAssembly.instantiate(buf, {})).instance;
}

export async function installPptxWeb(url) {
  const inst = await loadModule(url);
  const w = inst.exports;
  const mem = w.memory;

  // ---- the boundary ----
  // Every one of these re-reads `mem.buffer`: a call in between may have
  // grown the memory, which replaces the buffer and detaches every view.

  /** Copy `src` into the module and run `fn(ptr, len)`, then give it back. */
  const withBytes = (src, fn) => {
    const b = bytes(src);
    const ptr = w.rg_alloc(b.length);
    try {
      if (b.length) new Uint8Array(mem.buffer, ptr, b.length).set(b);
      return fn(ptr, b.length);
    } finally {
      w.rg_free(ptr, b.length);
    }
  };

  const withStr = (s, fn) => withBytes(enc.encode(String(s ?? "")), fn);

  /** Two of them, for the calls that take a string and a byte array. */
  const withStrBytes = (s, data, fn) =>
    withStr(s, (sp, sl) => withBytes(data, (dp, dl) => fn(sp, sl, dp, dl)));

  /** Read back what a call left in the module's scratch buffer. */
  const outStr = (len) =>
    len > 0 ? dec.decode(new Uint8Array(mem.buffer, w.rg_out_ptr(), len)) : "";
  /** The same, as bytes — and a COPY, because these outlive the next call. */
  const outBytes = (len) =>
    len > 0 ? new Uint8Array(mem.buffer, w.rg_out_ptr(), len).slice() : new Uint8Array(0);

  const i32 = (ptr, len) => (len > 0 ? new Int32Array(mem.buffer, ptr, len) : new Int32Array(0));

  class PptxWeb {
    constructor() {
      // One editor per module — the page only ever makes one, and a second
      // would double the heap for nothing. This re-inits rather than aliasing.
      w.web_create();
      this.note = "";
    }

    // ---- lifecycle ----
    start(width, height) { w.web_start(width | 0, height | 0); }
    resize(width, height) { w.web_resize(width | 0, height | 0); }
    loadPresets(text) { withStr(text, (p, n) => w.web_load_presets(p, n)); }
    setCoarsePointer(coarse) { w.web_coarse_pointer(coarse ? 1 : 0); }
    setChromeCss(css) { withStr(css, (p, n) => w.web_chrome_css(p, n)); }

    // ---- assets ----
    // `note` is a FIELD on the JavaScript engine and pages read it straight
    // after a failed call, so it is refreshed on every call that can set it.
    addFont(family, data) {
      const ok = withStrBytes(family, data, (sp, sl, dp, dl) => w.web_add_font(sp, sl, dp, dl)) !== 0;
      this.note = outStr(w.web_note());
      return ok;
    }
    addFace(data) {
      const ok = withBytes(data, (p, n) => w.web_add_face(p, n)) !== 0;
      this.note = outStr(w.web_note());
      return ok;
    }
    openDeck(data, name) {
      const ok = withBytes(data, (dp, dl) =>
        withStr(name ?? "deck.pptx", (np, nl) => w.web_open_deck(dp, dl, np, nl))) !== 0;
      this.note = outStr(w.web_note());
      return ok;
    }
    insertPicture(name, data) {
      const ok = withStrBytes(name, data, (sp, sl, dp, dl) => w.web_insert_picture(sp, sl, dp, dl)) !== 0;
      this.note = outStr(w.web_note());
      return ok;
    }

    // ---- navigation ----
    slideCount() { return w.web_slide_count(); }
    slideIndex() { return w.web_slide_index(); }
    gotoSlide(i) { w.web_goto_slide(i | 0); }
    next() { w.web_next(); }
    prev() { w.web_prev(); }

    // ---- input ----
    pointer(x, y, down) { w.web_pointer(x | 0, y | 0, down ? 1 : 0); }
    pointerAt(x, y, pressed, down, released) {
      return w.web_pointer_at(x | 0, y | 0, pressed ? 1 : 0, down ? 1 : 0, released ? 1 : 0) !== 0;
    }
    key(name) { withStr(name, (p, n) => w.web_key(p, n)); }
    keyMod(name, shift, ctrl) { withStr(name, (p, n) => w.web_key_mod(p, n, shift ? 1 : 0, ctrl ? 1 : 0)); }
    type(text, shift, ctrl) { withStr(text, (p, n) => w.web_type(p, n, shift ? 1 : 0, ctrl ? 1 : 0)); }
    mods(shift, ctrl) { w.web_mods(shift ? 1 : 0, ctrl ? 1 : 0); }
    scroll(x, y, delta) { w.web_scroll(x | 0, y | 0, delta | 0); }
    scrollPixels(x, y, dy) { w.web_scroll_pixels(x | 0, y | 0, dy | 0); }

    // ---- commands and state ----
    run(id, arg) {
      const ok = withStr(id, (ip, il) => withStr(arg, (ap, al) => w.web_run(ip, il, ap, al))) !== 0;
      this.note = outStr(w.web_note());
      return ok;
    }
    commands() { return outStr(w.web_commands()); }
    takeFileRequest() { return outStr(w.web_take_file_request()); }
    status() { return outStr(w.web_status()); }
    deckName() { return outStr(w.web_deck_name()); }
    suggestedName() { return outStr(w.web_suggested_name()); }
    selectionBox() { return outStr(w.web_selection_box()); }
    selectionCount() { return w.web_selection_count(); }
    imageParts() { return outStr(w.web_image_parts()); }
    slidePanelWidth() { return w.web_slide_panel_width(); }
    editing() { return w.web_editing() !== 0; }
    editingText() { return w.web_editing_text() !== 0; }
    presenting() { return w.web_presenting() !== 0; }
    animating() { return w.web_animating() !== 0; }
    tick(seconds) { w.web_tick(+seconds || 0); }

    // ---- the frame ----
    sceneBinary() {
      w.scene_build();
      const n = w.scene_strings_len();
      const strings = new Array(n);
      for (let i = 0; i < n; i++) strings[i] = outStr(w.scene_string(i));
      return {
        cmds: i32(w.scene_cmds_ptr(), w.scene_cmds_len()),
        pts: i32(w.scene_pts_ptr(), w.scene_pts_len()),
        ends: i32(w.scene_ends_ptr(), w.scene_ends_len()),
        strings,
        count: w.scene_count(),
        width: w.scene_width(),
        height: w.scene_height(),
      };
    }
    scene() { return outStr(w.web_scene_json()); }
    slideScene(i, widthPx) { return outStr(w.web_slide_scene(i | 0, widthPx | 0)); }

    // ---- bytes out ----
    // A COPY, not a view: these outlive the next call — the save path hands
    // them to a Blob and the picture path to an object URL, both of which
    // read them long after the memory may have grown.
    saveBytes() { return outBytes(w.web_save()); }
    imageBytes(part) { return outBytes(withStr(part, (p, n) => w.web_image(p, n))); }
  }

  globalThis.PptxWeb = PptxWeb;
  globalThis.__pptxEngine = "wasm-rust";
  return PptxWeb;
}
