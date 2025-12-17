# ZIP Handler Known Issues

## Issue #1: create_dir fails when directory exists

**Status:** Open  
**Severity:** Low  
**Found:** December 17, 2025

### Description

When extracting files, the `create_dir` function throws an error if the target directory already exists. This causes extraction to fail partway through if the output directory was created by a previous file's extraction.

### Error Message

```
Error: EEXIST: file already exists, mkdir 'C:\...\test_output'
```

### Workaround

Manually delete the output directory before extraction, or ignore the error.

### Suggested Fix

The `create_dir` operator in `Lang.rgr` should handle the case where the directory already exists gracefully (similar to `mkdir -p` behavior).

---

## Issue #2: Output directory not respected by compiler

**Status:** Open  
**Severity:** Medium  
**Found:** December 17, 2025

### Description

When compiling with `-d=./gallery/zip/bin`, the output file is still written to the root Ranger directory instead of the specified output directory. This requires manually moving the compiled file.

### Workaround

After compilation, move the output file to the desired location:

```powershell
Move-Item -Path c:\Users\terok\proj\Ranger\zip_tool.js -Destination c:\Users\terok\proj\Ranger\gallery\zip\bin\zip_tool.js -Force
```

---

## Issue #3: DEFLATE decompression not fully tested

**Status:** Open  
**Severity:** Medium  
**Found:** December 17, 2025

### Description

The `Inflate.rgr` implementation supports DEFLATE decompression (compression method 8), but it has not been extensively tested with real-world compressed ZIP files. The current test only uses STORED (uncompressed) files.

### Testing Needed

- Test with ZIP files created by standard tools (Windows Explorer, 7-Zip, etc.)
- Test with various compression levels
- Test with large files
- Test with dynamic Huffman codes

---

## Issue #4: No DEFLATE compression support

**Status:** Open (by design)  
**Severity:** Low  
**Found:** December 17, 2025

### Description

The ZIP writer (`ZipWriter.rgr`) only supports STORED (no compression) mode. DEFLATE compression is not implemented, resulting in larger ZIP files.

### Impact

ZIP files created by this tool will be larger than those created with compression enabled.

### Future Enhancement

Implement `Deflate.rgr` for compression support.

---

## Issue #5: Ranger syntax differences from common languages

**Status:** Documented  
**Severity:** N/A  
**Found:** December 17, 2025

### Description

Several Ranger syntax patterns differ from common languages:

1. **Negation**: Use `(false == var)` instead of `!var`
2. **Function call + operator**: Wrap function calls in extra parentheses: `((reader.readBits(5)) + 257)` not `(reader.readBits(5) + 257)`
3. **String from char code**: Use `strfromcode` not `char_from_code`
4. **Member variables in buffer_alloc**: Local variables must be used since `buffer_alloc` uses an IIFE that loses `this` context

### Example Fixes Applied

```ranger
; Wrong
while (!done) { ... }
def x (reader.readBits(5) + 10)
result = (result + (char_from_code ch))
def buf (buffer_alloc totalSize)  ; totalSize is member var

; Correct
while ((false == done)) { ... }
def x ((reader.readBits(5)) + 10)
result = (result + (strfromcode ch))
def size:int totalSize
def buf (buffer_alloc size)  ; use local var
```

---

## Limitations (Not Bugs)

### No ZIP64 Support

Files larger than 4GB are not supported.

### No Encryption

Password-protected ZIP files cannot be created or read.

### No Split/Spanned Archives

Multi-part ZIP archives are not supported.

### No Unicode Filename Flag

UTF-8 filenames are written but the general purpose bit flag for UTF-8 is not set.
