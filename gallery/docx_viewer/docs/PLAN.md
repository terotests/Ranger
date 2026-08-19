; ==============================================================================
; DOCX viewer — design notes
; ==============================================================================
;
; Benchmark / product target: Word-like rich document on EVG.
; First milestone: viewer for a subset of WordprocessingML.
;
; Pipeline:
;   DOCX (OPC/ZIP)
;        ↓
;   WordprocessingML parser
;        ↓
;   WordStyleResolver (defaults → styles → direct)
;        ↓
;   RichDocument (Paragraph + TextSpan)
;        ↓
;   DocxLayout (measure, wrap, paginate)
;        ↓
;   SoftCanvas / EVG present
;
; Editing later reuses gallery/text_editor TextEditCore inside paragraphs.
; EVG measures and paints; pagination rules stay in DocxLayout.
;
; Keyboard milestone: DocxTextMetrics as the one measurement authority (per-run
; face for caret / hit-test / selection, and for layout wrapping — face must be
; set via UITextRenderer.fontFamily, since applyFace() resets rt from it);
; multi-paragraph selection (orderedEnds / selectedText / delete+merge / bold);
; arrows, Home/End, Ctrl+Home/End, PageUp/PageDown with the view following the
; caret across pages; Ctrl+A / Ctrl+C / Ctrl+X.
;
; Editing milestone: TextEditCore caret + RichDocumentEdit, and clipboard paste
; via ClipboardTable — a spreadsheet's text/html <table> flavour becomes a
; DocumentTable block, so a DataGrid (or Excel) range Ctrl+C pastes here as a
; real table. Word semantics: split at the caret, table between the halves,
; caret after it, one Ctrl+Z to undo.
;
; Deliberately out of scope for this PR:
;   tables, PNG media decode (JPEG works), headers/footers, tracked changes,
;   fields, DOCX round-trip export, live editing.
; ==============================================================================
