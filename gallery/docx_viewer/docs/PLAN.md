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
