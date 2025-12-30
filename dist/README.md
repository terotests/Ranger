# Ranger Compiler

**Version 3.0.0-beta.1** | Cross-language compiler - compile once, run anywhere

Ranger is a self-hosting cross-language compiler that lets you write code once and compile to multiple target languages including JavaScript, TypeScript, Python, Go, Rust, Swift, C++, Java, Kotlin, C#, PHP, and Scala.

## Installation

```bash
# Install globally
npm install -g ranger-compiler

# Or use npx
npx ranger-compiler myfile.rgr -o=output.js
```

## Quick Start

```bash
# Compile to JavaScript (default)
rgrc myfile.rgr -o=output.js

# Auto-detect target from extension
rgrc myfile.rgr output.py      # → Python
rgrc myfile.rgr output.go      # → Go
rgrc myfile.rgr output.rs      # → Rust
rgrc myfile.rgr output.ts      # → TypeScript
rgrc myfile.rgr output.swift   # → Swift

# Explicit target language
rgrc myfile.rgr -l=python -o=output.py
rgrc myfile.rgr -l=go -o=output.go
rgrc myfile.rgr -l=rust -o=output.rs
```

## Target Languages

| Language   | Flag               | Extension | Status       |
|------------|-------------------|-----------|--------------|
| JavaScript | `-l=es6` (default)| `.js`     | Full support |
| TypeScript | `-l=es6 -typescript` | `.ts`  | Full support |
| Python     | `-l=python`       | `.py`     | Good support |
| Go         | `-l=go`           | `.go`     | Good support |
| Rust       | `-l=rust`         | `.rs`     | Preliminary  |
| Swift      | `-l=swift6`       | `.swift`  | Good support |
| C++        | `-l=cpp`          | `.cpp`    | Partial      |
| Java       | `-l=java7`        | `.java`   | Good support |
| Kotlin     | `-l=kotlin`       | `.kt`     | Good support |
| C#         | `-l=csharp`       | `.cs`     | Good support |
| PHP        | `-l=php`          | `.php`    | Good support |
| Scala      | `-l=scala`        | `.scala`  | Good support |

## CLI Options

```
Usage: rgrc <file.rgr> [options]

Options:
  -l=<lang>      Target language (es6, python, go, rust, java7, swift6, cpp, etc.)
  -o=<file>      Output filename
  -d=<dir>       Output directory
  -typescript    Generate TypeScript (with -l=es6)
  -nodecli       Build for Node.js CLI execution
  -nodemodule    Export classes as Node.js modules
  -no-color      Disable colored output

Examples:
  rgrc app.rgr -o=app.js
  rgrc app.rgr output.py
  rgrc app.rgr -l=go -o=app.go
  rgrc app.rgr -l=es6 -typescript -o=app.ts
```

## Example

```ranger
; hello.rgr - Hello World in Ranger

class HelloWorld {
    sfn m@(main):void () {
        print "Hello, World!"
        
        def numbers:[int] ([] 1 2 3 4 5)
        for numbers num:int i {
            print ("Number " + (to_string i) + ": " + (to_string num))
        }
    }
}
```

Compile and run:
```bash
rgrc hello.rgr -o=hello.js
node hello.js
```

## Documentation

- [Full Documentation](https://github.com/terotests/Ranger#readme)
- [Language Reference](https://github.com/terotests/Ranger/blob/master/ai/INSTRUCTIONS.md)
- [Quick Reference](https://github.com/terotests/Ranger/blob/master/ai/QUICKREF.md)

## Examples

Check out the example projects:

- **[Gallery](https://github.com/terotests/Ranger/tree/master/gallery)** - Full applications built with Ranger
  - [Space Invaders](https://github.com/terotests/Ranger/tree/master/gallery/invaders) - Terminal game (ES6, Rust, Go, Swift, C++)
  - [PDF Writer](https://github.com/terotests/Ranger/tree/master/gallery/pdf_writer) - TSX to PDF/HTML/PNG toolkit
  - [TypeScript Parser](https://github.com/terotests/Ranger/tree/master/gallery/ts_parser) - Full TS/TSX lexer
  - [JavaScript Parser](https://github.com/terotests/Ranger/tree/master/gallery/js_parser) - JS parser implementation
- **[Examples](https://github.com/terotests/Ranger/tree/master/examples)** - Simple code samples

## License

MIT © Tero Tolonen
