; ==============================================================================
; EVG text-editor prototype — design notes
; ==============================================================================
;
; Benchmark target: Hufe921/canvas-editor (Canvas-owned rendering pipeline).
; Feature-parity first step: grassator/canvas-text-editor-tutorial mechanics.
; Later performance reference: Ace.
;
; Architecture (EVG renders; EVG is not the text model):
;
;   UIInput / SDL_TEXTINPUT
;        ↓
;   EditorApp
;        ↓
;   EditorBuffer  (array-of-lines + undo)
;   EditorSelection (anchor + caret)
;   EditorLayout (scroll, hit-test, caret geometry)
;        ↓
;   EditorView → SoftCanvas / UITextRenderer (EVG font stack)
;        ↓
;   SDL2 present / PNG snapshot / JS validation
;
; Milestone 1 (this PR): notepad-level multiline editor, headless JS tests,
; shared-corpus benchmark harness. Not yet: IME composition, wrapping, syntax
; highlight, piece table, GPU path.
; ==============================================================================
