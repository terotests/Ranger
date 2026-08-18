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
; Deliberately out of scope for this PR:
;   tables, images/DrawingML, headers/footers, tracked changes, fields,
;   full numbering.xml abstraction, DOCX round-trip export.
; ==============================================================================
