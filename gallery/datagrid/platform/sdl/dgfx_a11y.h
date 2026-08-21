#pragma once

// Accessibility bridge for the DataGrid SDL host.
//
// An OpenGL window has no accessible children. VoiceOver, NVDA and Orca do not
// look at pixels — they ask the platform for a tree of roles and names — so the
// app publishes one (`GridApp.a11yJson()`, the same JSON the browser page
// mirrors into DOM) and this bridge hands it to the platform.
//
// On macOS that is NSAccessibility: one `NSAccessibilityElement` per node,
// hung off the window's content view, reused across publishes by node id so
// VoiceOver keeps its cursor. Elsewhere these are no-ops until somebody writes
// the UIA (Windows) or AT-SPI2 (Linux) half — or drops AccessKit in, which
// implements all three behind one tree model very close to this one.
//
// A Windows half would need three things this header does not have yet, all of
// them small and none of them reaching back into the app (the analysis is in
// gallery/evg/PLAN_ACCESSIBILITY.md §14):
//
//   * an attach(SDL_Window*) call, because WM_GETOBJECT must be answered from
//     the window procedure and SDL2's message hook returns void;
//   * a threading rule — UIA calls providers from RPC threads, so publish would
//     have to swap an immutable snapshot rather than mutate in place, which
//     NSAccessibility never forced because it asks on the main thread;
//   * a typed action channel instead of the point below, since
//     IValueProvider::SetValue and IScrollItemProvider::ScrollIntoView cannot be
//     said as "press here".
//
// The JSON is what `EVGA11yTree.toJson()` produces:
//
//   { "root":"app", "focus":"app/grid/row:7/B7", "gen":42,
//     "nodes":[ {"id":…,"p":…,"role":"gridcell","name":…,"value":…,
//                "b":[x,y,w,h],"focusable":true,"row":8,"col":3,…}, … ] }
//
// Bounds are in WINDOW POINTS with y running down from the top of the content
// area — the same space the app lays out and hit-tests in. Converting them to
// whatever the platform wants is this file's job, not the app's.

#ifdef __cplusplus
extern "C" {
#endif

// Is an assistive technology actually running? Building and publishing a tree
// costs something on every frame, and nothing should pay it when nobody is
// listening. macOS answers from VoiceOver's own state; other platforms say no.
int dgfx_a11y_active(void);

// Publish one frame's tree. Publishing the identical JSON twice is free — the
// second call returns before parsing anything.
void dgfx_a11y_publish(const char* json);

// A reader activated something. Returns "x,y" — the centre of the element it
// pressed, in window points — or "" when nothing is queued. The host answers by
// pressing the app there, which is deliberately not a map from node ids to
// commands: there is nothing to keep in step with the app, and a button that
// moved is still pressed in the right place.
//
// The returned pointer is owned by the bridge and stays valid until the next
// call.
const char* dgfx_a11y_take_press(void);

// Drop the published tree — called on shutdown so the window does not keep
// answering for a spreadsheet that is gone.
void dgfx_a11y_reset(void);

#ifdef __cplusplus
}
#endif
