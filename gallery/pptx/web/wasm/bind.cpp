// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The PPTX editor's C++ form, exposed to a browser through Emscripten.
//
// WHY THIS FILE EXISTS AND WHAT IT IS NOT. `pptx_web.cpp` is generated from
// `gallery/pptx/web/pptx_web.rgr` by the Ranger C++ backend and is never
// edited. It ends up as a plain C++ class with no `main`, no I/O and no
// knowledge of a browser. This is the only hand-written part of the WASM
// build: it says which of that class's methods a page may call and how the
// values cross the boundary. Nothing here implements behaviour — a difference
// between this page and the JavaScript one is a bug in the bridge, not in the
// editor, and that is deliberate.
//
// WHY NOT embind's automatic bindings for everything. Two of these methods
// move a megabyte per call, and embind copies a `std::vector` into a JS array
// element by element. `sceneBinary` alone is 330 000 integers per frame; as an
// embind vector that is 330 000 individual conversions, which would cost more
// than the JSON bridge this page exists to beat. So the big ones hand back the
// ADDRESS and LENGTH of the vector's storage instead, and JavaScript makes a
// typed-array VIEW onto the WASM heap over it — no copy at all, in either
// direction.
//
// The views are only valid until the next call that can reallocate — see
// `scene_cmds_ptr` below. The JavaScript side copies out of them immediately.
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdint>
#include <string>
#include <vector>

#include "pptx_web.cpp"

using namespace emscripten;

namespace {

// One editor per page. A handle rather than a constructed object keeps the
// binding surface flat: everything below is a free function taking no
// receiver, which is the cheapest thing embind can call.
std::shared_ptr<PptxWeb> g_web;
// The frame most recently asked for. Held so the pointers handed to
// JavaScript stay valid until the next `scene_build`.
std::shared_ptr<EVGSceneBinary> g_scene;
// Scratch for the byte-returning calls, for the same reason.
std::vector<uint8_t> g_bytes;
// `EVGSceneBinary` holds int64 because Ranger's `int` is 64-bit in C++, but
// every value in it fits an int32 by construction — coordinates are hundredths
// of a unit and colours are packed RGB. The page wants Int32Array, so the
// narrowing happens once, here, into a buffer the page can view directly.
std::vector<int32_t> g_cmds, g_pts, g_ends;

void narrow(const std::vector<int64_t>& from, std::vector<int32_t>& to) {
    to.resize(from.size());
    for (size_t i = 0; i < from.size(); i++) to[i] = (int32_t)from[i];
}

std::vector<uint8_t> bytes_of(const val& v) {
    return convertJSArrayToNumberVector<uint8_t>(v);
}

// ---- lifecycle ---------------------------------------------------------

void web_create()                       { g_web = std::make_shared<PptxWeb>(); }
void web_start(int w, int h)            { g_web->start(w, h); }
void web_resize(int w, int h)           { g_web->resize(w, h); }
void web_load_presets(std::string t)    { g_web->loadPresets(t); }
void web_coarse_pointer(bool c)         { g_web->setCoarsePointer(c); }
void web_chrome_css(std::string css)    { g_web->setChromeCss(css); }
std::string web_note()                  { return g_web->note; }

// ---- assets ------------------------------------------------------------

bool web_add_font(std::string family, val data) { return g_web->addFont(family, bytes_of(data)); }
bool web_add_face(val data)                     { return g_web->addFace(bytes_of(data)); }
bool web_open_deck(val data, std::string name)  { return g_web->openDeck(bytes_of(data), name); }
bool web_insert_picture(std::string name, val data) { return g_web->insertPicture(name, bytes_of(data)); }

// ---- navigation --------------------------------------------------------

int  web_slide_count()      { return g_web->slideCount(); }
int  web_slide_index()      { return g_web->slideIndex(); }
void web_goto_slide(int i)  { g_web->gotoSlide(i); }
void web_next()             { g_web->next(); }
void web_prev()             { g_web->prev(); }

// ---- input -------------------------------------------------------------

void web_pointer(int x, int y, bool down) { g_web->pointer(x, y, down); }
bool web_pointer_at(int x, int y, bool pressed, bool down, bool released) {
    return g_web->pointerAt(x, y, pressed, down, released);
}
void web_key(std::string n)                              { g_web->key(n); }
void web_key_mod(std::string n, bool shift, bool ctrl)   { g_web->keyMod(n, shift, ctrl); }
void web_type(std::string t, bool shift, bool ctrl)      { g_web->type(t, shift, ctrl); }
void web_mods(bool shift, bool ctrl)                     { g_web->mods(shift, ctrl); }
void web_scroll(int x, int y, int d)                     { g_web->scroll(x, y, d); }
void web_scroll_pixels(int x, int y, int dy)             { g_web->scrollPixels(x, y, dy); }
void web_scroll_pixels2(int x, int y, int dx, int dy)    { g_web->scrollPixels2(x, y, dx, dy); }

// ---- commands and state ------------------------------------------------

bool web_run(std::string id, std::string arg) { return g_web->run(id, arg); }
std::string web_commands()          { return g_web->commands(); }
std::string web_take_file_request() { return g_web->takeFileRequest(); }
std::string web_status()            { return g_web->status(); }
std::string web_deck_name()         { return g_web->deckName(); }
std::string web_suggested_name()    { return g_web->suggestedName(); }
std::string web_selection_box()     { return g_web->selectionBox(); }
std::string web_image_parts()       { return g_web->imageParts(); }
int  web_slide_panel_width()        { return g_web->slidePanelWidth(); }
int  web_panel_scroll_at()          { return g_web->panelScrollAt(); }
bool web_over_slide_panel(int x, int y) { return g_web->overSlidePanel(x, y); }
int  web_selection_count()          { return g_web->selectionCount(); }
bool web_editing()                  { return g_web->editing(); }
bool web_editing_text()             { return g_web->editingText(); }
bool web_presenting()               { return g_web->presenting(); }
bool web_animating()                { return g_web->animating(); }
void web_tick(double s)             { g_web->tick(s); }

// ---- the frame ---------------------------------------------------------
//
// `scene_build` fills the three arrays and the string pool; the six accessors
// after it hand back addresses into the WASM heap. A page reads them as
// `new Int32Array(Module.HEAP32.buffer, ptr, len)` and copies out before it
// calls anything else — the next `scene_build` reallocates.

void scene_build() {
    g_scene = g_web->sceneBinary();
    narrow(g_scene->cmds, g_cmds);
    narrow(g_scene->pts,  g_pts);
    narrow(g_scene->ends, g_ends);
}
// The frame without the thumbnails, and the thumbnails alone. Both fill the
// SAME arrays, so a page reads one out before it asks for the other — the
// rule `scene_build` already worked under. See `panelStamp`: the panel is
// most of a frame and changes almost never, so a page asks for it only when
// the stamp says it would draw something different.
void scene_build_no_panel() {
    g_scene = g_web->sceneBinaryNoPanel();
    narrow(g_scene->cmds, g_cmds);
    narrow(g_scene->pts,  g_pts);
    narrow(g_scene->ends, g_ends);
}
void panel_build() {
    g_scene = g_web->panelBinary();
    narrow(g_scene->cmds, g_cmds);
    narrow(g_scene->pts,  g_pts);
    narrow(g_scene->ends, g_ends);
}
std::string web_panel_stamp() { return g_web->panelStamp(); }
int    scene_count()      { return g_scene ? g_scene->count : 0; }
double scene_width()      { return g_scene ? g_scene->width : 0.0; }
double scene_height()     { return g_scene ? g_scene->height : 0.0; }
uintptr_t scene_cmds_ptr() { return (uintptr_t)g_cmds.data(); }
int    scene_cmds_len()   { return (int)g_cmds.size(); }
uintptr_t scene_pts_ptr()  { return (uintptr_t)g_pts.data(); }
int    scene_pts_len()    { return (int)g_pts.size(); }
uintptr_t scene_ends_ptr() { return (uintptr_t)g_ends.data(); }
int    scene_ends_len()   { return (int)g_ends.size(); }
int    scene_strings_len() { return g_scene ? (int)g_scene->strings.size() : 0; }
std::string scene_string(int i) {
    if (!g_scene || i < 0 || i >= (int)g_scene->strings.size()) return std::string();
    return g_scene->strings[i];
}

// The JSON frame is kept for the parity test, which compares this build's
// picture with the JavaScript build's the same way `bridge.mjs` compares the
// two bridges. A page never calls it.
std::string web_scene_json()                     { return g_web->scene(); }
std::string web_slide_scene(int i, int widthPx)  { return g_web->slideScene(i, widthPx); }

// ---- bytes out ---------------------------------------------------------

void web_save() { g_bytes = g_web->saveBytes(); }
void web_image(std::string part) { g_bytes = g_web->imageBytes(part); }
uintptr_t bytes_ptr() { return (uintptr_t)g_bytes.data(); }
int bytes_len()      { return (int)g_bytes.size(); }

}  // namespace

EMSCRIPTEN_BINDINGS(pptx_web) {
    function("web_create", &web_create);
    function("web_start", &web_start);
    function("web_resize", &web_resize);
    function("web_load_presets", &web_load_presets);
    function("web_coarse_pointer", &web_coarse_pointer);
    function("web_chrome_css", &web_chrome_css);
    function("web_note", &web_note);

    function("web_add_font", &web_add_font);
    function("web_add_face", &web_add_face);
    function("web_open_deck", &web_open_deck);
    function("web_insert_picture", &web_insert_picture);

    function("web_slide_count", &web_slide_count);
    function("web_slide_index", &web_slide_index);
    function("web_goto_slide", &web_goto_slide);
    function("web_next", &web_next);
    function("web_prev", &web_prev);

    function("web_pointer", &web_pointer);
    function("web_pointer_at", &web_pointer_at);
    function("web_key", &web_key);
    function("web_key_mod", &web_key_mod);
    function("web_type", &web_type);
    function("web_mods", &web_mods);
    function("web_scroll", &web_scroll);
    function("web_scroll_pixels", &web_scroll_pixels);
    function("web_scroll_pixels2", &web_scroll_pixels2);

    function("web_run", &web_run);
    function("web_commands", &web_commands);
    function("web_take_file_request", &web_take_file_request);
    function("web_status", &web_status);
    function("web_deck_name", &web_deck_name);
    function("web_suggested_name", &web_suggested_name);
    function("web_selection_box", &web_selection_box);
    function("web_image_parts", &web_image_parts);
    function("web_slide_panel_width", &web_slide_panel_width);
    function("web_panel_scroll_at", &web_panel_scroll_at);
    function("web_over_slide_panel", &web_over_slide_panel);
    function("web_selection_count", &web_selection_count);
    function("web_editing", &web_editing);
    function("web_editing_text", &web_editing_text);
    function("web_presenting", &web_presenting);
    function("web_animating", &web_animating);
    function("web_tick", &web_tick);

    function("scene_build", &scene_build);
    function("scene_build_no_panel", &scene_build_no_panel);
    function("panel_build", &panel_build);
    function("web_panel_stamp", &web_panel_stamp);
    function("scene_count", &scene_count);
    function("scene_width", &scene_width);
    function("scene_height", &scene_height);
    function("scene_cmds_ptr", &scene_cmds_ptr);
    function("scene_cmds_len", &scene_cmds_len);
    function("scene_pts_ptr", &scene_pts_ptr);
    function("scene_pts_len", &scene_pts_len);
    function("scene_ends_ptr", &scene_ends_ptr);
    function("scene_ends_len", &scene_ends_len);
    function("scene_strings_len", &scene_strings_len);
    function("scene_string", &scene_string);
    function("web_scene_json", &web_scene_json);
    function("web_slide_scene", &web_slide_scene);

    function("web_save", &web_save);
    function("web_image", &web_image);
    function("bytes_ptr", &bytes_ptr);
    function("bytes_len", &bytes_len);
}
