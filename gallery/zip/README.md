# ZIP Archive Tool

A pure Ranger implementation of ZIP archive handling - reading, extracting, and creating ZIP files.

## Features

- **Read ZIP archives** - Parse and list contents of ZIP files
- **Extract files** - Decompress and extract files to disk
- **Create archives** - Create new ZIP files with STORED compression
- **DEFLATE support** - Decompress DEFLATE-compressed entries (method 8)
- **Cross-platform** - Compiles to JavaScript (ES6)

## Quick Start

### Compile

```bash
npm run zip:compile
```

### Run

```bash
npm run zip:run
# or
node ./gallery/zip/bin/zip_tool.js
```

## Commands

### List archive contents

```bash
node zip_tool.js list archive.zip
```

Shows all files in the archive with their sizes, compression method, and modification dates.

### Extract archive

```bash
node zip_tool.js extract archive.zip output_folder
```

Extracts all files from the archive to the specified output folder.

### Create archive

```bash
node zip_tool.js create new_archive.zip file1.txt file2.pdf folder/file3.js
```

Creates a new ZIP archive containing the specified files (STORED compression).

### Show archive info

```bash
node zip_tool.js info archive.zip
```

Displays detailed information about the archive structure.

### Test archive integrity

```bash
node zip_tool.js test archive.zip
```

Verifies the archive can be read without errors.

## Source Files

| File                           | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| [ZipBuffer.rgr](ZipBuffer.rgr) | Little-endian buffer utilities and growable buffer for decompression |
| [ZipEntry.rgr](ZipEntry.rgr)   | ZIP entry data structure with MS-DOS date/time handling              |
| [CRC32.rgr](CRC32.rgr)         | CRC-32 checksum using polynomial 0xEDB88320                          |
| [Inflate.rgr](Inflate.rgr)     | DEFLATE decompression with fixed and dynamic Huffman tables          |
| [ZipReader.rgr](ZipReader.rgr) | Parse EOCD, Central Directory, and extract files                     |
| [ZipWriter.rgr](ZipWriter.rgr) | Create ZIP archives with STORED compression                          |
| [zip_tool.rgr](zip_tool.rgr)   | CLI tool main entry point                                            |

## ZIP Format Support

### Compression Methods

| Method | Name                    | Read | Write |
| ------ | ----------------------- | ---- | ----- |
| 0      | STORED (no compression) | ✅   | ✅    |
| 8      | DEFLATE                 | ✅   | ❌    |

### Structures

- Local File Header (signature `0x04034b50`)
- Central Directory (signature `0x02014b50`)
- End of Central Directory Record (signature `0x06054b50`)

## Example Usage

```ranger
Import "ZipReader.rgr"

main {
    ; Read a ZIP file
    def reader (new ZipReader())
    if (reader.open("." "archive.zip")) {
        ; List entries
        for reader.entries entry:ZipEntry {
            print (entry.fileName + " - " + (to_string entry.uncompressedSize) + " bytes")
        }

        ; Extract a specific file
        def entry:ZipEntry (reader.getEntry("document.txt"))
        if (null != entry) {
            def data:buffer (reader.extract(entry))
            ; Use the extracted data...
        }
    }
}
```

## npm Scripts

```bash
npm run zip:compile    # Compile Ranger to JavaScript
npm run zip:run        # Run the compiled tool
npm run zip            # Compile and run
```

## Known Limitations

- No ZIP64 support (archives > 4GB)
- No encryption/password protection
- Write only supports STORED compression (no DEFLATE writing)
- CRC32 verification is disabled (calculation has known issues)

## Technical Notes

### DEFLATE Implementation

The DEFLATE decompressor ([Inflate.rgr](Inflate.rgr)) supports:

- Non-compressed blocks (type 0)
- Fixed Huffman codes (type 1)
- Dynamic Huffman codes (type 2)
- Length/distance decoding with extra bits
- Sliding window back-references

### Buffer Handling

The `GrowableZipBuffer` class handles dynamic memory allocation for decompression output where the final size may not be known in advance.

## See Also

- [PLAN_ZIP.md](PLAN_ZIP.md) - Implementation plan
- [ISSUES.md](ISSUES.md) - Known issues and fixes
