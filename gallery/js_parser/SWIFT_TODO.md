# Swift Compilation TODO

This document tracks the work needed to compile the JS parser to Swift.

## Status: Missing Templates

The JS parser cannot currently be compiled to Swift because `Lang.rgr` is missing Swift6 templates for several standard library functions.

## Compilation Command

```bash
RANGER_LIB="./compiler/Lang.rgr" node bin/output.js -l=swift6 ./gallery/js_parser/js_parser_main.rgr -d=./gallery/js_parser -o=js_parser.swift -nodecli
```

## Missing Swift6 Templates

The following functions have `swift3` templates but need `swift6` templates:

### 1. shell_arg
```
Could not match argument types for shell_arg
```

**swift3 template exists:** `CommandLine.arguments[" (e 1) " + 1]`

### 2. shell_arg_cnt
```
Could not match argument types for shell_arg_cnt
```

**swift3 template exists:** `CommandLine.arguments.count - 1`

### 3. read_file
```
Could not match argument types for read_file
```

**swift3 template exists:** Uses `r_read_file` polyfill

### 4. write_file
```
Could not match argument types for write_file
```

**swift3 template exists:** Uses `r_write_file` polyfill

## Solution Options

### Option 1: Add swift6 templates
Copy the swift3 templates and add them as swift6 in `compiler/Lang.rgr`.

### Option 2: Use swift3 target
Try compiling with `-l=swift3` instead of `-l=swift6`:

```bash
RANGER_LIB="./compiler/Lang.rgr" node bin/output.js -l=swift3 ./gallery/js_parser/js_parser_main.rgr -d=./gallery/js_parser -o=js_parser.swift -nodecli
```

### Option 3: Configure swift6 to inherit swift3 templates
Modify the Ranger compiler to make swift6 fall back to swift3 templates.

## Files to Modify

- `compiler/Lang.rgr` - Add swift6 templates for missing functions

## Next Steps

1. Add swift6 templates for `shell_arg`, `shell_arg_cnt`, `read_file`, `write_file`
2. Recompile to Swift
3. Try building with `swiftc`
