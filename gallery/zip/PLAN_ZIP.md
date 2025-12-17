# ZIP Archive Handler Implementation Plan

## Status: 🚧 NOT STARTED

Implementation of a ZIP archive reader/writer in Ranger to open, read, and compress files to ZIP format.

## Overview

Create a ZIP archive library in Ranger that can:

- **Read ZIP files**: Parse archive structure, list contents, extract files
- **Write ZIP files**: Create new archives, add files with compression
- **Cross-platform**: Works across all Ranger targets (JavaScript, Go, Rust, etc.)

## ZIP Format Overview

```
ZIP File Structure:
┌─────────────────────────────────────┐
│ Local File Header 1                 │
│ File Data 1 (possibly compressed)   │
│ [Data Descriptor 1]                 │
├─────────────────────────────────────┤
│ Local File Header 2                 │
│ File Data 2 (possibly compressed)   │
│ [Data Descriptor 2]                 │
├─────────────────────────────────────┤
│ ... more files ...                  │
├─────────────────────────────────────┤
│ Central Directory Header 1          │
│ Central Directory Header 2          │
│ ... more headers ...                │
├─────────────────────────────────────┤
│ End of Central Directory Record     │
└─────────────────────────────────────┘
```

## Key Signatures (Little-Endian)

| Signature   | Hex Value  | Description                    |
| ----------- | ---------- | ------------------------------ |
| Local File  | 0x04034b50 | "PK\x03\x04" - Local header    |
| Central Dir | 0x02014b50 | "PK\x01\x02" - Central header  |
| EOCD        | 0x06054b50 | "PK\x05\x06" - End of central  |
| Data Desc   | 0x08074b50 | "PK\x07\x08" - Data descriptor |

## Phase 1: Buffer Utilities & Structures

### 1.1 Create ZipBuffer.rgr - Little-endian buffer utilities

```ranger
class ZipBuffer {
    def data:buffer
    def pos:int 0

    ; Read little-endian integers
    fn readUint16LE:int ()
    fn readUint32LE:int ()

    ; Write little-endian integers
    fn writeUint16LE:void (value:int)
    fn writeUint32LE:void (value:int)

    ; Seek and position management
    fn seek:void (position:int)
    fn skip:void (count:int)
    fn getPosition:int ()

    ; Read bytes
    fn readBytes:buffer (count:int)
    fn readString:string (count:int)
}
```

### 1.2 Create ZipEntry.rgr - File entry structure

```ranger
class ZipEntry {
    def fileName:string ""
    def compressedSize:int 0
    def uncompressedSize:int 0
    def compressionMethod:int 0    ; 0=stored, 8=deflate
    def crc32:int 0
    def lastModTime:int 0
    def lastModDate:int 0
    def localHeaderOffset:int 0
    def externalAttrs:int 0
    def isDirectory:boolean false
    def extraField:buffer
    def comment:string ""

    ; Decoded file data (after extraction)
    def data@(optional):buffer
}
```

## Phase 2: ZIP Reader

### 2.1 Create ZipReader.rgr

**Core functionality:**

- Parse End of Central Directory Record (EOCD)
- Parse Central Directory entries
- Extract individual files
- Support for STORED (no compression) files
- Support for DEFLATE compressed files

```ranger
class ZipReader {
    def entries:[ZipEntry]
    def entryMap:[string:ZipEntry]
    def data:buffer
    def comment:string ""

    fn open:boolean (path:string filename:string)
    fn listFiles:[string] ()
    fn getEntry@(optional):ZipEntry (name:string)
    fn extract:buffer (entry:ZipEntry)
    fn extractAll:void (outputPath:string)
    fn close:void ()
}
```

### 2.2 Parsing Steps

1. **Find EOCD** - Search backwards from end for signature 0x06054b50
2. **Parse EOCD**:
   - Number of entries
   - Central directory size
   - Central directory offset
3. **Parse Central Directory**:
   - For each entry: filename, sizes, compression, offsets
4. **Extract Files**:
   - Seek to local header offset
   - Parse local header
   - Read compressed data
   - Decompress if needed

### 2.3 EOCD Structure (End of Central Directory)

| Offset | Size | Description              |
| ------ | ---- | ------------------------ |
| 0      | 4    | Signature (0x06054b50)   |
| 4      | 2    | Disk number              |
| 6      | 2    | Disk with central dir    |
| 8      | 2    | Entries on this disk     |
| 10     | 2    | Total entries            |
| 12     | 4    | Central directory size   |
| 16     | 4    | Central directory offset |
| 20     | 2    | Comment length           |
| 22     | n    | Comment                  |

### 2.4 Central Directory Entry Structure

| Offset | Size | Description              |
| ------ | ---- | ------------------------ |
| 0      | 4    | Signature (0x02014b50)   |
| 4      | 2    | Version made by          |
| 6      | 2    | Version needed           |
| 8      | 2    | General purpose bit flag |
| 10     | 2    | Compression method       |
| 12     | 2    | Last mod time            |
| 14     | 2    | Last mod date            |
| 16     | 4    | CRC-32                   |
| 20     | 4    | Compressed size          |
| 24     | 4    | Uncompressed size        |
| 28     | 2    | Filename length          |
| 30     | 2    | Extra field length       |
| 32     | 2    | Comment length           |
| 34     | 2    | Disk number start        |
| 36     | 2    | Internal attributes      |
| 38     | 4    | External attributes      |
| 42     | 4    | Local header offset      |
| 46     | n    | Filename                 |
| 46+n   | m    | Extra field              |
| 46+n+m | k    | Comment                  |

### 2.5 Local File Header Structure

| Offset | Size | Description              |
| ------ | ---- | ------------------------ |
| 0      | 4    | Signature (0x04034b50)   |
| 4      | 2    | Version needed           |
| 6      | 2    | General purpose bit flag |
| 8      | 2    | Compression method       |
| 10     | 2    | Last mod time            |
| 12     | 2    | Last mod date            |
| 14     | 4    | CRC-32                   |
| 18     | 4    | Compressed size          |
| 22     | 4    | Uncompressed size        |
| 26     | 2    | Filename length          |
| 28     | 2    | Extra field length       |
| 30     | n    | Filename                 |
| 30+n   | m    | Extra field              |

## Phase 3: Deflate Decompression

### 3.1 Create Inflate.rgr - DEFLATE decompression

DEFLATE is the standard compression for ZIP files. Implementation requires:

**Block types:**

- Type 0: Stored (no compression)
- Type 1: Fixed Huffman codes
- Type 2: Dynamic Huffman codes

**Components:**

- Huffman decoder for literal/length codes
- Huffman decoder for distance codes
- LZ77 sliding window (32KB)
- Bit reader for variable-length codes

```ranger
class Inflate {
    def input:buffer
    def inputPos:int 0
    def bitBuf:int 0
    def bitCnt:int 0
    def output:GrowableBuffer
    def window:[int]        ; 32KB sliding window
    def windowPos:int 0

    fn decompress:buffer (data:buffer)
    fn decompressBlock:void ()
    fn decodeHuffman:int (table:HuffmanTable)
}
```

### 3.2 Fixed Huffman Tables

Pre-defined tables for block type 1:

- Literals 0-143: 8-bit codes (00110000 - 10111111)
- Literals 144-255: 9-bit codes (110010000 - 111111111)
- End of block 256: 7-bit code (0000000)
- Lengths 257-279: 7-bit codes (0000001 - 0010111)
- Lengths 280-287: 8-bit codes (11000000 - 11000111)

### 3.3 Length/Distance Tables

Length codes 257-285 map to lengths 3-258 with extra bits.
Distance codes 0-29 map to distances 1-32768 with extra bits.

## Phase 4: ZIP Writer

### 4.1 Create ZipWriter.rgr

```ranger
class ZipWriter {
    def entries:[ZipEntry]
    def output:GrowableBuffer
    def comment:string ""

    fn create:void ()
    fn addFile:void (name:string data:buffer)
    fn addFileCompressed:void (name:string data:buffer)
    fn addDirectory:void (name:string)
    fn setComment:void (comment:string)
    fn save:void (path:string filename:string)
    fn close:void ()
}
```

### 4.2 Writing Steps

1. For each file:
   - Write local file header
   - Write file data (stored or compressed)
   - Record entry info for central directory
2. Write central directory entries
3. Write EOCD record

## Phase 5: Deflate Compression (Optional)

### 5.1 Create Deflate.rgr

Full DEFLATE compression implementation:

```ranger
class Deflate {
    def input:buffer
    def output:GrowableBuffer
    def windowSize:int 32768
    def hashTable:[int:int]

    fn compress:buffer (data:buffer)
    fn findMatch:void (pos:int)
    fn writeHuffmanCode:void (code:int length:int)
}
```

**Compression strategy:**

- Use fixed Huffman codes for simplicity
- LZ77 matching with hash table
- Consider compression level parameter

## Phase 6: CRC-32 Implementation

### 6.1 Create CRC32.rgr

CRC-32 is required for file integrity verification:

```ranger
class CRC32 {
    def table:[int]    ; 256-entry lookup table

    Constructor ()     ; Build table
    fn update:int (crc:int data:buffer)
    fn compute:int (data:buffer)
}
```

**CRC-32 polynomial:** 0xEDB88320 (reflected form)

## Phase 7: Command-Line Tool

### 7.1 Create zip_tool.rgr

```ranger
class ZipTool {
    sfn m@(main):void () {
        ; Usage examples:
        ; zip_tool list archive.zip
        ; zip_tool extract archive.zip [output_dir]
        ; zip_tool create archive.zip file1.txt file2.txt
        ; zip_tool add archive.zip newfile.txt
    }
}
```

## File Structure

```
gallery/zip/
├── PLAN_ZIP.md          ; This plan document
├── ZipBuffer.rgr        ; Little-endian buffer utilities
├── ZipEntry.rgr         ; File entry data structure
├── ZipReader.rgr        ; ZIP file reader
├── ZipWriter.rgr        ; ZIP file writer
├── Inflate.rgr          ; DEFLATE decompression
├── Deflate.rgr          ; DEFLATE compression (optional)
├── CRC32.rgr            ; CRC-32 checksum
├── zip_tool.rgr         ; Command-line interface
├── bin/                 ; Compiled outputs
└── test/                ; Test ZIP files
    ├── simple.zip       ; Test with stored files
    └── compressed.zip   ; Test with deflate files
```

## Compilation Commands

Add to package.json:

```json
"zip:compile": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 ./gallery/zip/zip_tool.rgr -d=./gallery/zip/bin -o=zip_tool.js -nodecli",
"zip:compile:go": "cross-env RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./gallery/zip/zip_tool.rgr -d=./gallery/zip/bin -o=zip_tool.go -nodecli",
"zip:run": "node ./gallery/zip/bin/zip_tool.js",
"zip:build:go": "npm run zip:compile:go && cd gallery/zip/bin && go build -o zip_tool.exe zip_tool.go"
```

## Implementation Order

1. **Phase 1**: ZipBuffer.rgr, ZipEntry.rgr, CRC32.rgr
2. **Phase 2**: ZipReader.rgr (stored files only first)
3. **Phase 3**: Inflate.rgr (add DEFLATE decompression)
4. **Phase 4**: ZipWriter.rgr (stored files only first)
5. **Phase 5**: Deflate.rgr (optional - add compression)
6. **Phase 6**: zip_tool.rgr (CLI interface)

## Testing Strategy

### Test Cases

1. **Read stored ZIP**: Extract uncompressed files
2. **Read deflate ZIP**: Extract compressed files
3. **Write stored ZIP**: Create archive with stored files
4. **Write deflate ZIP**: Create archive with compressed files
5. **Round-trip**: Create ZIP, read it back, verify contents
6. **Large files**: Test with files > 64KB
7. **Many files**: Test with archives containing 100+ files
8. **Nested directories**: Test directory structure preservation
9. **Unicode filenames**: Test UTF-8 filename support
10. **Empty archive**: Test empty ZIP handling

### Verification

Compare output with standard tools:

- `unzip -l archive.zip` - list contents
- `unzip -t archive.zip` - test integrity
- Windows Explorer / macOS Finder - extract and verify

## Known Limitations (Initial Version)

- No ZIP64 support (files > 4GB)
- No encryption support
- No split/spanned archives
- Single compression method per archive

## Dependencies

Uses existing Ranger buffer operations:

- `buffer_alloc` - Create buffer
- `buffer_length` - Get buffer size
- `buffer_get` / `buffer_set` - Read/write bytes
- `buffer_read_file` / `buffer_write_file` - File I/O
- `buffer_slice` / `buffer_copy` - Buffer manipulation

Can reuse from pdf_writer project:

- `GrowableBuffer` from Buffer.rgr - Dynamic buffer growth
- `BitReader` pattern from BitReader.rgr - Bit-level reading

## References

- [ZIP File Format Specification (PKWARE)](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [RFC 1951 - DEFLATE Compressed Data Format](https://datatracker.ietf.org/doc/html/rfc1951)
- [RFC 1952 - GZIP file format](https://datatracker.ietf.org/doc/html/rfc1952)
- [CRC-32 Algorithm](https://www.w3.org/TR/PNG/#D-CRCAppendix)

## Notes

- ZIP uses **little-endian** byte order (unlike JPEG which uses big-endian)
- Filenames in ZIP are traditionally CP437 encoded, but modern tools use UTF-8 with bit flag
- DEFLATE is complex - consider implementing stored-only first, then add decompression
- The existing `BitReader.rgr` from pdf_writer reads MSB-first; DEFLATE uses LSB-first
