# PDF Writer for Ranger

A plan to implement a simple PDF file generator using Ranger, demonstrating binary file operations and cross-platform file I/O.

## Implementation Status

### ✅ Phase 1: Buffer Type System (COMPLETED)

The `buffer` type and core operators have been implemented in the Ranger compiler:

**Files Modified:**

- `compiler/ng_RangerAppEnums.rgr` - Added `Buffer` to RangerNodeType enum
- `compiler/ng_RangerAppWriterContext.rgr` - Added `buffer` to isPrimitiveType/isDefinedType
- `compiler/ng_RangerJavaScriptClassWriter.rgr` - Added buffer type mappings
- `compiler/ng_RangerGolangClassWriter.rgr` - Added buffer type mappings
- `compiler/ng_RangerRustClassWriter.rgr` - Added buffer type mappings
- `compiler/ng_RangerCppClassWriter.rgr` - Added buffer type mappings
- `compiler/ng_RangerJava7ClassWriter.rgr` - Added buffer type mappings
- `compiler/Lang.rgr` - Added all buffer operators

**Implemented Operators:**
| Operator | Description | Status |
|----------|-------------|--------|
| `buffer_alloc` | Allocate buffer of N bytes (zeroed) | ✅ |
| `buffer_length` | Get buffer size in bytes | ✅ |
| `buffer_get` | Read byte at offset | ✅ |
| `buffer_set` | Write byte at offset | ✅ |
| `buffer_from_string` | Create buffer from UTF-8 string | ✅ |
| `buffer_to_string` | Convert buffer to UTF-8 string | ✅ |
| `buffer_write_file` | Write buffer to file | ✅ |
| `buffer_read_file` | Read file into buffer | ✅ |
| `buffer_copy` | Copy bytes from src to dest | ✅ |
| `buffer_fill` | Fill range with byte value | ✅ |
| `buffer_slice` | Create copy of buffer range | ✅ |

### 🔲 Phase 2: Multi-Byte Operators (TODO)

| Operator                   | Description                          | Status |
| -------------------------- | ------------------------------------ | ------ |
| `buffer_get_int16_le/be`   | Read 16-bit int (little/big endian)  | 🔲     |
| `buffer_get_int32_le/be`   | Read 32-bit int (little/big endian)  | 🔲     |
| `buffer_set_int16_le/be`   | Write 16-bit int (little/big endian) | 🔲     |
| `buffer_set_int32_le/be`   | Write 32-bit int (little/big endian) | 🔲     |
| `buffer_get_float32/64_le` | Read 32/64-bit float                 | 🔲     |
| `buffer_set_float32/64_le` | Write 32/64-bit float                | 🔲     |

### 🔲 Phase 3: PDF Writer Library (TODO)

---

## Overview

This project will create a PDF generator that can produce simple PDF documents with text content. The goal is to demonstrate Ranger's capability to work with binary/structured file formats and to provide a practical utility library.

## PDF Format Basics

PDF is a text-based format (surprisingly) with binary sections. A minimal PDF structure:

```
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000361 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
442
%%EOF
```

## Current Ranger Capabilities

### Available Binary/Buffer Operations in Lang.rgr

| Operator        | Description                        | Signature                                       |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| `to_charbuffer` | Convert string to byte array       | `(text:string) -> charbuffer`                   |
| `to_string`     | Convert buffer back to string      | `(text:charbuffer) -> string`                   |
| `substring`     | Extract substring from buffer      | `(text:charbuffer start:int end:int) -> string` |
| `charAt`        | Get character at position          | `(text:charbuffer position:int) -> char`        |
| `charcode`      | Get character code from string     | `(text:string) -> char`                         |
| `ccode`         | Get character code at compile time | `(text:string) -> char`                         |
| `strfromcode`   | Create string from char code       | `(code:char) -> string`                         |
| `length`        | Get buffer length                  | `(buffer:charbuffer) -> int`                    |

### File I/O Operations

| Operator      | Description          | Signature                                       |
| ------------- | -------------------- | ----------------------------------------------- |
| `write_file`  | Write text file      | `(path:string file:string data:string) -> void` |
| `read_file`   | Read text file       | `(path:string filename:string) -> string`       |
| `file_exists` | Check if file exists | `(path:string) -> boolean`                      |
| `create_dir`  | Create directory     | `(path:string) -> void`                         |

### Type System Notes

- `charbuffer` maps to:
  - JavaScript: String (internally UTF-16)
  - Go: `[]byte`
  - Java: `byte[]`
  - Swift: `[UInt8]`
  - C++: `const char*` / `std::string`
  - Rust: `Vec<u8>` (via `.into_bytes()`)
  - Python: String

## New Binary Buffer System Design

For proper binary file handling, Ranger needs a new `buffer` type with memory management operators. This is essential not just for PDF generation but for any binary protocol, image processing, or low-level I/O.

### New Type: `buffer`

A `buffer` is a fixed-size, mutable byte array with direct memory access.

**Target Language Mappings:**

| Target         | Type                                 |
| -------------- | ------------------------------------ |
| JavaScript/ES6 | `ArrayBuffer` + `DataView`           |
| TypeScript     | `ArrayBuffer` + `DataView`           |
| Go             | `[]byte`                             |
| Rust           | `Vec<u8>`                            |
| C++            | `std::vector<uint8_t>` or `uint8_t*` |
| Java           | `byte[]` or `ByteBuffer`             |
| Python         | `bytearray`                          |
| Swift          | `[UInt8]` or `Data`                  |
| C#             | `byte[]`                             |

### Proposed Operators

#### Allocation & Lifecycle

| Operator              | Description                                | Signature                                  |
| --------------------- | ------------------------------------------ | ------------------------------------------ |
| `buffer_alloc`        | Allocate buffer of N bytes (zeroed)        | `(size:int) -> buffer`                     |
| `buffer_alloc_unsafe` | Allocate without zeroing (faster)          | `(size:int) -> buffer`                     |
| `buffer_free`         | Free buffer memory (no-op in GC languages) | `(buf:buffer) -> void`                     |
| `buffer_clone`        | Create a copy of buffer                    | `(buf:buffer) -> buffer`                   |
| `buffer_slice`        | Create view/copy of range                  | `(buf:buffer start:int end:int) -> buffer` |

#### Size & Capacity

| Operator        | Description                    | Signature                          |
| --------------- | ------------------------------ | ---------------------------------- |
| `buffer_length` | Get buffer size in bytes       | `(buf:buffer) -> int`              |
| `buffer_resize` | Resize buffer (may reallocate) | `(buf:buffer newSize:int) -> void` |

#### Single Byte Access

| Operator     | Description          | Signature                                   |
| ------------ | -------------------- | ------------------------------------------- |
| `buffer_get` | Read byte at offset  | `(buf:buffer offset:int) -> int`            |
| `buffer_set` | Write byte at offset | `(buf:buffer offset:int value:int) -> void` |

#### Multi-Byte Access (Little/Big Endian)

| Operator                | Description                        | Signature                                      |
| ----------------------- | ---------------------------------- | ---------------------------------------------- |
| `buffer_get_int16_le`   | Read 16-bit int (little endian)    | `(buf:buffer offset:int) -> int`               |
| `buffer_get_int16_be`   | Read 16-bit int (big endian)       | `(buf:buffer offset:int) -> int`               |
| `buffer_get_int32_le`   | Read 32-bit int (little endian)    | `(buf:buffer offset:int) -> int`               |
| `buffer_get_int32_be`   | Read 32-bit int (big endian)       | `(buf:buffer offset:int) -> int`               |
| `buffer_get_float32_le` | Read 32-bit float (little endian)  | `(buf:buffer offset:int) -> double`            |
| `buffer_get_float64_le` | Read 64-bit float (little endian)  | `(buf:buffer offset:int) -> double`            |
| `buffer_set_int16_le`   | Write 16-bit int (little endian)   | `(buf:buffer offset:int value:int) -> void`    |
| `buffer_set_int16_be`   | Write 16-bit int (big endian)      | `(buf:buffer offset:int value:int) -> void`    |
| `buffer_set_int32_le`   | Write 32-bit int (little endian)   | `(buf:buffer offset:int value:int) -> void`    |
| `buffer_set_int32_be`   | Write 32-bit int (big endian)      | `(buf:buffer offset:int value:int) -> void`    |
| `buffer_set_float32_le` | Write 32-bit float (little endian) | `(buf:buffer offset:int value:double) -> void` |
| `buffer_set_float64_le` | Write 64-bit float (little endian) | `(buf:buffer offset:int value:double) -> void` |

#### Bulk Operations

| Operator         | Description                 | Signature                                                                  |
| ---------------- | --------------------------- | -------------------------------------------------------------------------- |
| `buffer_copy`    | Copy bytes from src to dest | `(dest:buffer destOffset:int src:buffer srcOffset:int length:int) -> void` |
| `buffer_fill`    | Fill range with byte value  | `(buf:buffer value:int start:int end:int) -> void`                         |
| `buffer_compare` | Compare two buffers         | `(a:buffer b:buffer) -> int`                                               |

#### String Conversion

| Operator                 | Description                     | Signature                                  |
| ------------------------ | ------------------------------- | ------------------------------------------ |
| `buffer_from_string`     | Create buffer from UTF-8 string | `(str:string) -> buffer`                   |
| `buffer_to_string`       | Convert buffer to UTF-8 string  | `(buf:buffer) -> string`                   |
| `buffer_to_string_range` | Convert range to string         | `(buf:buffer start:int end:int) -> string` |
| `buffer_to_hex`          | Convert to hex string           | `(buf:buffer) -> string`                   |
| `buffer_from_hex`        | Create from hex string          | `(hex:string) -> buffer`                   |

#### File I/O

| Operator             | Description           | Signature                                          |
| -------------------- | --------------------- | -------------------------------------------------- |
| `buffer_write_file`  | Write buffer to file  | `(path:string filename:string buf:buffer) -> void` |
| `buffer_read_file`   | Read file into buffer | `(path:string filename:string) -> buffer`          |
| `buffer_append_file` | Append buffer to file | `(path:string filename:string buf:buffer) -> void` |

### Lang.rgr Implementation Examples

```ranger
; Allocation - buffer_alloc
buffer_alloc  cmdBufferAlloc:buffer (size:int) {
    templates {
        es6 ( "(function(){ var b = new ArrayBuffer(" (e 1) "); b._view = new DataView(b); return b; })()" )
        go ( "make([]byte, " (e 1) ")" )
        rust ( "vec![0u8; " (e 1) " as usize]" )
        cpp ( "std::vector<uint8_t>(" (e 1) ", 0)" (imp "<vector>") (imp "<cstdint>"))
        java7 ( "new byte[" (e 1) "]" )
        python ( "bytearray(" (e 1) ")" )
        swift6 ( "[UInt8](repeating: 0, count: Int(" (e 1) "))" )
        csharp ( "new byte[" (e 1) "]" )
    }
}

; Get byte - buffer_get
buffer_get  cmdBufferGet:int (buf:buffer offset:int) {
    templates {
        es6 ( (e 1) "._view.getUint8(" (e 2) ")" )
        go ( "int64(" (e 1) "[" (e 2) "])" )
        rust ( (e 1) "[" (e 2) " as usize] as i64" )
        cpp ( "static_cast<int64_t>(" (e 1) "[" (e 2) "])" )
        java7 ( "((int)" (e 1) "[" (e 2) "] & 0xFF)" )
        python ( (e 1) "[" (e 2) "]" )
        swift6 ( "Int64(" (e 1) "[Int(" (e 2) ")])" )
        csharp ( "((int)" (e 1) "[" (e 2) "])" )
    }
}

; Set byte - buffer_set
buffer_set  cmdBufferSet:void (buf:buffer offset:int value:int) {
    templates {
        es6 ( (e 1) "._view.setUint8(" (e 2) ", " (e 3) ")" )
        go ( (e 1) "[" (e 2) "] = byte(" (e 3) ")" )
        rust ( (e 1) "[" (e 2) " as usize] = " (e 3) " as u8" )
        cpp ( (e 1) "[" (e 2) "] = static_cast<uint8_t>(" (e 3) ")" )
        java7 ( (e 1) "[" (e 2) "] = (byte)" (e 3) )
        python ( (e 1) "[" (e 2) "] = " (e 3) )
        swift6 ( (e 1) "[Int(" (e 2) ")] = UInt8(" (e 3) ")" )
        csharp ( (e 1) "[" (e 2) "] = (byte)" (e 3) )
    }
}

; Get 32-bit int little endian - buffer_get_int32_le
buffer_get_int32_le  cmdBufferGetInt32LE:int (buf:buffer offset:int) {
    templates {
        es6 ( (e 1) "._view.getInt32(" (e 2) ", true)" )
        go ( "int64(binary.LittleEndian.Uint32(" (e 1) "[" (e 2) ":]))" (imp "encoding/binary"))
        rust ( "i64::from(i32::from_le_bytes(" (e 1) "[" (e 2) " as usize.." (e 2) " as usize + 4].try_into().unwrap()))" )
        python ( "int.from_bytes(" (e 1) "[" (e 2) ":" (e 2) "+4], 'little', signed=True)" )
    }
}

; Write file - buffer_write_file
buffer_write_file  cmdBufferWriteFile:void (path:string filename:string buf:buffer) {
    templates {
        es6 ( "require('fs').writeFileSync(" (e 1) " + '/' + " (e 2) ", Buffer.from(" (e 3) "))" )
        go ( "os.WriteFile(" (e 1) " + \"/\" + " (e 2) ", " (e 3) ", 0644)" (imp "os"))
        rust ( "std::fs::write(format!(\"{}/{}\", " (e 1) ", " (e 2) "), &" (e 3) ").unwrap()" )
        python ( "open(" (e 1) " + '/' + " (e 2) ", 'wb').write(" (e 3) ")" )
    }
}

; Read file - buffer_read_file
buffer_read_file  cmdBufferReadFile:buffer (path:string filename:string) {
    templates {
        es6 ( "(function(){ var b = require('fs').readFileSync(" (e 1) " + '/' + " (e 2) "); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })()" )
        go ( "func() []byte { d, _ := os.ReadFile(" (e 1) " + \"/\" + " (e 2) "); return d }()" (imp "os"))
        rust ( "std::fs::read(format!(\"{}/{}\", " (e 1) ", " (e 2) ")).unwrap()" )
        python ( "bytearray(open(" (e 1) " + '/' + " (e 2) ", 'rb').read())" )
    }
}
```

### Usage Example

```ranger
Import "Lang.rgr"

class BinaryWriter {
    def buf:buffer
    def pos:int 0

    Constructor (size:int) {
        buf = (buffer_alloc size)
    }

    fn writeByte:void (value:int) {
        buffer_set buf pos value
        pos = pos + 1
    }

    fn writeInt32LE:void (value:int) {
        buffer_set_int32_le buf pos value
        pos = pos + 4
    }

    fn writeString:void (str:string) {
        def bytes:buffer (buffer_from_string str)
        def len (buffer_length bytes)
        buffer_copy buf pos bytes 0 len
        pos = pos + len
    }

    fn save:void (path:string filename:string) {
        ; Trim to actual size
        def final:buffer (buffer_slice buf 0 pos)
        buffer_write_file path filename final
    }
}

class Main {
    sfn m@(main):void () {
        def writer (new BinaryWriter(1024))

        ; Write PNG signature
        writer.writeByte(0x89)
        writer.writeByte(0x50)  ; P
        writer.writeByte(0x4E)  ; N
        writer.writeByte(0x47)  ; G
        writer.writeByte(0x0D)
        writer.writeByte(0x0A)
        writer.writeByte(0x1A)
        writer.writeByte(0x0A)

        writer.save("." "test.png")
        print "Binary file written!"
    }
}
```

### Implementation Priority

**Phase 1 - Core (Essential for PDF/binary)**

1. `buffer_alloc` - Create buffer
2. `buffer_length` - Get size
3. `buffer_get` / `buffer_set` - Single byte access
4. `buffer_from_string` / `buffer_to_string` - String conversion
5. `buffer_write_file` / `buffer_read_file` - File I/O

**Phase 2 - Multi-byte access** 6. `buffer_get_int16_le/be` / `buffer_set_int16_le/be` 7. `buffer_get_int32_le/be` / `buffer_set_int32_le/be` 8. `buffer_get_float32_le` / `buffer_set_float32_le`

**Phase 3 - Bulk operations** 9. `buffer_copy` - Copy between buffers 10. `buffer_fill` - Fill with value 11. `buffer_slice` - Create sub-buffer 12. `buffer_clone` - Duplicate buffer

**Phase 4 - Utilities** 13. `buffer_to_hex` / `buffer_from_hex` 14. `buffer_compare` 15. `buffer_resize` 16. `buffer_free` (for C++/manual memory)

---

## Compiler Changes Required

Adding the `buffer` type requires changes to multiple compiler files:

### 1. ng_RangerAppWriterContext.rgr

Add `buffer` to primitive type checks:

```ranger
; Line ~997 - isPrimitiveType function
fn isPrimitiveType:boolean (typeName:string) {
    if (((((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "buffer")) || (typeName == "boolean")) {
      return true
    }
    return false
}

; Line ~1006 - isDefinedType function
fn isDefinedType:boolean (typeName:string) {
    ; ... add || (typeName == "buffer") to the check
}
```

### 2. ng_CodeNode.rgr

Add RangerNodeType enum value:

```ranger
; Add to RangerNodeType enum
Buffer
```

### 3. Each Class Writer

Add type mapping for `buffer`:

**ng_RangerJavaScriptClassWriter.rgr:**

```ranger
case "buffer" {
    wr.out("ArrayBuffer" false)  ; or custom wrapper type
}
```

**ng_RangerGolangClassWriter.rgr:**

```ranger
case "buffer" {
    wr.out("[]byte" false)
}
```

**ng_RangerRustClassWriter.rgr:**

```ranger
case RangerNodeType.Buffer {
    wr.out("Vec<u8>" false)
}
```

**ng_RangerPythonClassWriter.rgr:**

```ranger
case "buffer" {
    wr.out("bytearray" false)
}
```

**ng_RangerCppClassWriter.rgr:**

```ranger
case "buffer" {
    wr.out("std::vector<uint8_t>" false)
}
```

### 4. Lang.rgr

Add all the buffer operators (see examples above in "Proposed Operators" section).

### 5. Parser Changes (if needed)

The parser should already handle `buffer` as a type name since it's treated as an identifier. No parser changes should be needed.

---

## Files Changed Summary

| File                                          | Change                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `compiler/ng_RangerAppWriterContext.rgr`      | Add `buffer` to `isPrimitiveType` and `isDefinedType` |
| `compiler/ng_CodeNode.rgr`                    | Add `Buffer` to `RangerNodeType` enum                 |
| `compiler/ng_RangerJavaScriptClassWriter.rgr` | Add `buffer` type mapping                             |
| `compiler/ng_RangerGolangClassWriter.rgr`     | Add `buffer` type mapping                             |
| `compiler/ng_RangerRustClassWriter.rgr`       | Add `buffer` type mapping                             |
| `compiler/ng_RangerPythonClassWriter.rgr`     | Add `buffer` type mapping                             |
| `compiler/ng_RangerCppClassWriter.rgr`        | Add `buffer` type mapping                             |
| `compiler/ng_RangerCSharpClassWriter.rgr`     | Add `buffer` type mapping                             |
| `compiler/ng_RangerJava7ClassWriter.rgr`      | Add `buffer` type mapping                             |
| `compiler/ng_RangerSwift6ClassWriter.rgr`     | Add `buffer` type mapping                             |
| `compiler/Lang.rgr`                           | Add all buffer operators                              |

---

## Original Missing Operators (Superseded by Buffer System)

The new buffer system above replaces the need for these originally proposed operators:

### Priority 1: Essential for PDF Generation

1. ~~**`write_binary_file`**~~ → Use `buffer_write_file`
   ```ranger
   ; Can be done with to_string for PDF since xref uses decimal strings
   ```

### Priority 2: Nice to Have

1. **`buffer_push`** - Append byte to buffer

   ```ranger
   buffer_push (buffer:charbuffer byte:char) -> void
   ```

2. **`buffer_concat`** - Concatenate two buffers
   ```ranger
   buffer_concat (a:charbuffer b:charbuffer) -> charbuffer
   ```

## Implementation Plan

### Phase 1: Basic PDF Structure (No New Operators Needed)

Since PDF is largely text-based, we can build a PDF generator using existing string operations:

```ranger
class PDFWriter {
    def content:string ""
    def objectCount:int 0
    def offsets:[int]  ; Track byte offsets for xref table

    fn addObject:int (data:string) {
        objectCount = objectCount + 1
        push offsets (strlen content)  ; Track offset
        content = content + (to_string objectCount) + " 0 obj\n"
        content = content + data + "\n"
        content = content + "endobj\n"
        return objectCount
    }

    fn generate:string () {
        ; Build final PDF with header, objects, xref, trailer
        return "%PDF-1.4\n" + content + this.buildXref() + this.buildTrailer()
    }
}
```

**Files to create:**

- `pdf_writer.rgr` - Main PDF writer class
- `pdf_page.rgr` - Page management
- `pdf_text.rgr` - Text rendering helpers
- `pdf_main.rgr` - Demo/test program

### Phase 2: Font Support

Add basic font support (built-in Type1 fonts):

- Helvetica, Times-Roman, Courier (standard PDF fonts, no embedding needed)

### Phase 3: Graphics Support (Optional)

Add simple graphics operations:

- Lines, rectangles, circles
- Fill and stroke colors
- Path operations

### Phase 4: Binary Optimization (If Needed)

If string concatenation is too slow for large documents, add:

- `write_binary_file` operator to Lang.rgr
- Buffer pooling for efficient memory use

## File Structure

```
gallery/pdf_writer/
├── PLAN_PDF_WRITER.md      # This file
├── README.md               # Usage documentation
├── pdf_writer.rgr          # Main PDF writer class
├── pdf_page.rgr            # Page management
├── pdf_text.rgr            # Text operations
├── pdf_font.rgr            # Font definitions
├── pdf_graphics.rgr        # Graphics operations (Phase 3)
├── pdf_main.rgr            # Demo program
├── bin/                    # Compiled outputs
│   ├── pdf_writer.js
│   ├── pdf_writer.py
│   └── pdf_writer.go
└── samples/                # Sample PDFs
    ├── hello_world.pdf
    └── multi_page.pdf
```

## API Design

### Basic Usage

```ranger
Import "pdf_writer.rgr"

class Main {
    sfn m@(main):void () {
        def pdf (new PDFWriter())

        ; Add a page
        def page (pdf.addPage(612 792))  ; Letter size in points

        ; Add text
        page.setFont("Helvetica" 12)
        page.drawText(100 700 "Hello, PDF World!")
        page.drawText(100 680 "Generated by Ranger")

        ; Save the PDF
        def output (pdf.generate())
        write_file "." "output.pdf" output

        print "PDF created: output.pdf"
    }
}
```

### Advanced Usage

```ranger
; Multi-page document
def pdf (new PDFWriter())

for 1 to 5 pageNum {
    def page (pdf.addPage(612 792))
    page.setFont("Helvetica-Bold" 24)
    page.drawText(100 700 ("Page " + (to_string pageNum)))

    page.setFont("Times-Roman" 12)
    page.drawText(100 650 "This is some body text.")
}

write_file "." "multipage.pdf" (pdf.generate())
```

## Implementation Notes

### Coordinate System

PDF uses a bottom-left origin (0,0 at bottom-left corner). We might want to provide a helper that converts from top-left coordinates:

```ranger
fn topLeftY:int (pageHeight:int y:int) {
    return pageHeight - y
}
```

### String Escaping

PDF strings need escaping for special characters:

- `(` → `\(`
- `)` → `\)`
- `\` → `\\`

```ranger
fn escapePdfString:string (text:string) {
    def result ""
    def i 0
    while (i < (strlen text)) {
        def ch (charAt text i)
        if (ch == "(") {
            result = result + "\\("
        } {
            if (ch == ")") {
                result = result + "\\)"
            } {
                if (ch == "\\") {
                    result = result + "\\\\"
                } {
                    result = result + ch
                }
            }
        }
        i = i + 1
    }
    return result
}
```

### Cross-Reference Table

The xref table requires exact byte offsets. We'll track these as we build the document:

```ranger
fn buildXref:string () {
    def xref "xref\n"
    xref = xref + "0 " + (to_string (objectCount + 1)) + "\n"
    xref = xref + "0000000000 65535 f \n"  ; First entry is always free

    for offsets offset:int i {
        ; Format offset as 10-digit zero-padded number
        xref = xref + (padLeft (to_string offset) 10 "0") + " 00000 n \n"
    }

    return xref
}
```

## Testing Strategy

1. **Unit tests** for each component:

   - String escaping
   - Object generation
   - Xref calculation

2. **Integration tests**:

   - Generate PDF and verify with PDF reader
   - Compare byte-for-byte with known-good PDFs

3. **Cross-platform validation**:
   - Compile to JS, Python, Go
   - Verify all targets produce identical PDFs

## Milestones

- [ ] **M1**: Basic PDFWriter class with single page, single text line
- [ ] **M2**: Multiple pages, multiple text lines
- [ ] **M3**: Font selection (Helvetica, Times, Courier)
- [ ] **M4**: Text formatting (bold, italic via font names)
- [ ] **M5**: Basic graphics (lines, rectangles)
- [ ] **M6**: Colors (RGB stroke and fill)
- [ ] **M7**: Documentation and examples

## Known Limitations

1. **No Unicode support** initially - ASCII only, PDF encoding is complex
2. **No font embedding** - only standard Type1 fonts
3. **No images** - would require binary embedding and compression
4. **No compression** - streams will be uncompressed (larger files)

## Future Enhancements

1. **PDF/A compliance** for archival documents
2. **Image support** (JPEG embedding)
3. **Stream compression** (zlib/deflate)
4. **TrueType font embedding**
5. **Unicode text support** (ToUnicode CMap)

## References

- [PDF Reference 1.7](https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf)
- [PDF Specification (ISO 32000)](https://www.iso.org/standard/51502.html)
- [Minimal PDF Examples](https://brendanzagaeski.appspot.com/0004.html)
