/**
 * The WebAssembly editor, wearing the JavaScript editor's face.
 *
 * WHY IT LOOKS LIKE THIS. `standalone.mjs` — the whole page: chrome, pointer,
 * keyboard, the show, printing, saving — is used by this page UNCHANGED. It
 * asks for a global class called `PptxWeb` and calls about forty methods on
 * it. So this file's entire job is to define that class over the WASM module,
 * method for method, and then get out of the way. Any difference between this
 * page and https://…/office/ is then a difference in the ENGINE, which is the
 * only thing being compared. A page rewritten for WASM would have measured the
 * rewrite.
 *
 * WHY THE FRAME IS NOT COPIED. `sceneBinary` is 330 000 integers on a chart
 * slide. Handing those back through embind as a vector would convert them one
 * at a time and cost more than the JSON bridge this page exists to beat, so
 * the C++ side (see bind.cpp) hands back the ADDRESS of its storage instead
 * and the arrays below are typed-array VIEWS straight onto the WASM heap.
 * Nothing is copied in either direction.
 *
 * THE ONE RULE THOSE VIEWS CARRY. They are valid until the next call that can
 * reallocate — which in practice means until the next `sceneBinary()`. The
 * page reads a frame and draws it before asking for another, which is exactly
 * that discipline, and `decodeScene` copies every number it needs out into
 * plain objects as it walks. If a caller ever wants to KEEP a frame, it must
 * copy the views first.
 *
 * WHY THE HEAP IS RE-READ EVERY TIME. `ALLOW_MEMORY_GROWTH` means the heap can
 * be replaced by a bigger one between two calls, and every view onto the old
 * one is then detached — reading it throws or, worse, answers zeroes. So the
 * buffer is taken from the module at the moment the view is made, never
 * cached.
 */
import createPptx from "./pptx_wasm.mjs";

/** A JS byte source as something embind will take. */
function bytes(data) {
  if (data == null) return new Uint8Array(0);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Uint8Array(data);
}

export async function installPptxWeb() {
  const m = await createPptx();

  const i32 = (ptr, len) => (len > 0 ? new Int32Array(m.HEAP32.buffer, ptr, len) : new Int32Array(0));

  class PptxWeb {
    constructor() {
      // One editor per page — the C++ side holds a single instance, because
      // the page only ever makes one and a second would double a 64 MB heap
      // for nothing. A second construction re-inits rather than aliasing.
      m.web_create();
      this.note = "";
    }

    // ---- lifecycle ----
    start(w, h) { m.web_start(w | 0, h | 0); }
    resize(w, h) { m.web_resize(w | 0, h | 0); }
    loadPresets(text) { m.web_load_presets(String(text ?? "")); }
    setCoarsePointer(c) { m.web_coarse_pointer(!!c); }
    setChromeCss(css) { m.web_chrome_css(String(css ?? "")); }

    // ---- assets ----
    // `note` is a FIELD on the JavaScript engine and pages read it straight
    // after a failed call, so it is refreshed on every call that can set it.
    addFont(family, data) {
      const ok = m.web_add_font(String(family), bytes(data));
      this.note = m.web_note();
      return ok;
    }
    addFace(data) {
      const ok = m.web_add_face(bytes(data));
      this.note = m.web_note();
      return ok;
    }
    openDeck(data, name) {
      const ok = m.web_open_deck(bytes(data), String(name ?? "deck.pptx"));
      this.note = m.web_note();
      return ok;
    }
    insertPicture(name, data) {
      const ok = m.web_insert_picture(String(name), bytes(data));
      this.note = m.web_note();
      return ok;
    }

    // ---- navigation ----
    slideCount() { return m.web_slide_count(); }
    slideIndex() { return m.web_slide_index(); }
    gotoSlide(i) { m.web_goto_slide(i | 0); }
    next() { m.web_next(); }
    prev() { m.web_prev(); }

    // ---- input ----
    pointer(x, y, down) { m.web_pointer(x | 0, y | 0, !!down); }
    pointerAt(x, y, pressed, down, released) {
      return m.web_pointer_at(x | 0, y | 0, !!pressed, !!down, !!released);
    }
    key(name) { m.web_key(String(name)); }
    keyMod(name, shift, ctrl) { m.web_key_mod(String(name), !!shift, !!ctrl); }
    type(text, shift, ctrl) { m.web_type(String(text ?? ""), !!shift, !!ctrl); }
    mods(shift, ctrl) { m.web_mods(!!shift, !!ctrl); }
    scroll(x, y, delta) { m.web_scroll(x | 0, y | 0, delta | 0); }
    scrollPixels(x, y, dy) { m.web_scroll_pixels(x | 0, y | 0, dy | 0); }
    scrollPixels2(x, y, dx, dy) { m.web_scroll_pixels2(x | 0, y | 0, dx | 0, dy | 0); }

    // ---- commands and state ----
    run(id, arg) {
      const ok = m.web_run(String(id), String(arg ?? ""));
      this.note = m.web_note();
      return ok;
    }
    commands() { return m.web_commands(); }
    takeFileRequest() { return m.web_take_file_request(); }
    status() { return m.web_status(); }
    deckName() { return m.web_deck_name(); }
    suggestedName() { return m.web_suggested_name(); }
    selectionBox() { return m.web_selection_box(); }
    selectionCount() { return m.web_selection_count(); }
    imageParts() { return m.web_image_parts(); }
    slidePanelWidth() { return m.web_slide_panel_width(); }
    overSlidePanel(x, y) { return m.web_over_slide_panel(x | 0, y | 0); }
    editing() { return m.web_editing(); }
    editingText() { return m.web_editing_text(); }
    presenting() { return m.web_presenting(); }
    animating() { return m.web_animating(); }
    tick(seconds) { m.web_tick(+seconds || 0); }

    // ---- the frame ----
    sceneBinary() {
      m.scene_build();
      return this.readScene();
    }

    readScene() {
      const n = m.scene_strings_len();
      const strings = new Array(n);
      for (let i = 0; i < n; i++) strings[i] = m.scene_string(i);
      return {
        cmds: i32(m.scene_cmds_ptr(), m.scene_cmds_len()),
        pts: i32(m.scene_pts_ptr(), m.scene_pts_len()),
        ends: i32(m.scene_ends_ptr(), m.scene_ends_len()),
        strings,
        count: m.scene_count(),
        width: m.scene_width(),
        height: m.scene_height(),
      };
    }
    // The frame without the thumbnails, and the thumbnails on their own —
    // both through the same arrays, so one is read out before the other is
    // asked for. `readScene` is that read.
    sceneBinaryNoPanel() { m.scene_build_no_panel(); return this.readScene(); }
    panelBinary() { m.panel_build(); return this.readScene(); }
    panelStamp() { return m.web_panel_stamp(); }
    scene() { return m.web_scene_json(); }
    slideScene(i, widthPx) { return m.web_slide_scene(i | 0, widthPx | 0); }

    // ---- bytes out ----
    // A COPY, not a view: these outlive the next call — the save path hands
    // them to a Blob and the picture path to an object URL, both of which
    // read them long after the heap may have moved.
    saveBytes() {
      m.web_save();
      return new Uint8Array(m.HEAPU8.buffer, m.bytes_ptr(), m.bytes_len()).slice();
    }
    imageBytes(part) {
      m.web_image(String(part));
      return new Uint8Array(m.HEAPU8.buffer, m.bytes_ptr(), m.bytes_len()).slice();
    }
  }

  globalThis.PptxWeb = PptxWeb;
  globalThis.__pptxEngine = "wasm";
  return PptxWeb;
}
