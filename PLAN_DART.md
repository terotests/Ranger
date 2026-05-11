# PLAN: Dart Language Target for Ranger Compiler

## Overview

Add Dart as a compilation target to the Ranger compiler, enabling:
1. Generation of Dart code from Ranger source files
2. Flutter package creation from existing Ranger projects
3. Cross-compilation of pdf_writer, ts_parser, and component modules to Dart

## Why Dart?

- **Flutter**: Dart is the language for Flutter, enabling cross-platform mobile/desktop/web apps
- **Similarity**: Dart syntax is similar to Java/Kotlin/Swift, making the class writer relatively straightforward
- **Strong typing**: Dart has strong static typing which maps well to Ranger's type system
- **Null safety**: Modern Dart has sound null safety (similar to Ranger's optional types)
- **Async support**: Dart has built-in async/await which could map to Ranger patterns

## Dart Language Characteristics

### Type Mapping (Ranger → Dart)

| Ranger Type | Dart Type |
|-------------|-----------|
| `int` | `int` |
| `double` | `double` |
| `string` | `String` |
| `boolean` | `bool` |
| `char` | `int` (Dart uses int for char codes) |
| `void` | `void` |
| `buffer` | `Uint8List` |
| `int_buffer` | `Int64List` |
| `double_buffer` | `Float64List` |
| `chararray` | `List<int>` |
| `[T]` (array) | `List<T>` |
| `[K:V]` (map) | `Map<K, V>` |
| `T?` (optional) | `T?` (nullable) |

### Syntax Comparison

```dart
// Dart class
class Calculator {
  int value = 0;
  
  Calculator(int initial) {
    value = initial;
  }
  
  int add(int n) {
    return value + n;
  }
  
  static void main(List<String> args) {
    var calc = Calculator(10);
    print(calc.add(5));
  }
}
```

```ranger
; Ranger equivalent
class Calculator {
  def value:int 0
  
  Constructor (initial:int) {
    value = initial
  }
  
  fn add:int (n:int) {
    return (value + n)
  }
  
  sfn m@(main):void () {
    def calc (new Calculator(10))
    print (calc.add(5))
  }
}
```

## Implementation Steps

### Phase 1: Basic Class Writer (Estimated: 8-12 hours)

1. **Create `ng_RangerDartClassWriter.rgr`**
   - Copy structure from `ng_RangerKotlinClassWriter.rgr` (most similar)
   - Implement type mapping methods
   - Implement basic code generation

2. **Register in compiler**
   - Add to `Lang.rgr` targets block
   - Import in `ng_RangerLanguageWriters.rgr`
   - Add case in `ng_LiveCompiler.rgr`
   - Add to `VirtualCompiler.rgr` allowed languages

3. **Basic operator templates in `Lang.rgr`**
   - `print` → `print()`
   - `strlen` → `.length`
   - `substring` → `.substring()`
   - `indexOf` → `.indexOf()`
   - Array operations
   - Control flow

### Phase 2: Dart-Specific Features (Estimated: 4-8 hours)

1. **Null safety**
   - Map Ranger `@(optional)` to Dart `?` types
   - Handle null checks properly

2. **Constructors**
   - Dart constructor syntax differs from Java/Kotlin
   - Named constructors support

3. **Import system**
   - Dart uses `import 'package:...'` syntax
   - Need to handle library structure

4. **Typed collections**
   - `Uint8List` for buffers (requires `dart:typed_data`)
   - Proper generic syntax

### Phase 3: Flutter Integration (Estimated: 8-12 hours)

1. **Package structure**
   - Generate `pubspec.yaml`
   - Library exports
   - Part files if needed

2. **Platform-specific considerations**
   - File I/O differences (dart:io vs web)
   - Conditional imports

3. **Test the target modules**
   - ts_parser compilation
   - pdf_writer components
   - EVG layout engine

## Key Dart Syntax Patterns

### Variable Definitions
```dart
// With type
int value = 0;
String name = "hello";

// With var (type inference)
var count = 10;
final immutable = "constant";
```

### Functions
```dart
int add(int a, int b) {
  return a + b;
}

// Arrow syntax for single expressions
int multiply(int a, int b) => a * b;
```

### Classes
```dart
class MyClass {
  int field;
  
  // Constructor
  MyClass(this.field);  // Shorthand
  
  // Named constructor
  MyClass.withDefault() : field = 0;
  
  // Methods
  void doSomething() { }
  
  // Static methods
  static void staticMethod() { }
}
```

### Null Safety
```dart
String? nullableName;  // Can be null
String name = "";      // Cannot be null

// Null check
if (nullableName != null) {
  print(nullableName.length);
}

// Null-aware operators
print(nullableName?.length ?? 0);
```

### Collections
```dart
List<int> numbers = [1, 2, 3];
Map<String, int> scores = {"alice": 100, "bob": 95};
Set<String> unique = {"a", "b", "c"};

// Typed data for buffers
import 'dart:typed_data';
Uint8List bytes = Uint8List(1024);
```

## Operator Templates Needed

### Essential (Phase 1)
```ranger
; print
dart ( nl "print( " (e 1) " );" nl )

; string length
dart ( (e 1) ".length" )

; substring
dart ( (e 1) ".substring( " (e 2) ", " (e 2) " + " (e 3) " )" )

; array push
dart ( (e 1) ".add( " (e 2) " )" )

; array length
dart ( (e 1) ".length" )

; itemAt
dart ( (e 1) "[ " (e 2) " ]" )
```

### Typed Data (Phase 2)
```ranger
; buffer creation
dart ( (imp "dart:typed_data") "Uint8List( " (e 1) " )" )

; buffer read
dart ( (e 1) "[ " (e 2) " ]" )

; buffer write
dart ( (e 1) "[ " (e 2) " ] = " (e 3) )
```

## Testing Strategy

### Test Files to Create
1. `tests/fixtures/dart_basic.rgr` - Basic types and operations
2. `tests/fixtures/dart_classes.rgr` - Class definitions
3. `tests/fixtures/dart_arrays.rgr` - Collection operations
4. `tests/fixtures/dart_buffers.rgr` - Buffer/typed data

### Test Helpers
```typescript
// tests/helpers/compiler.ts
export function isDartAvailable(): boolean {
  try {
    execSync("dart --version", { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function compileAndRunDart(sourceFile: string): { compile: CompileResult; run?: RunResult } {
  // Compile .rgr to .dart, then run with dart
}
```

## Target Modules for Flutter

### 1. TypeScript Parser (`ts_parser/`)
- Lexer and parser for TSX/TypeScript
- Useful for code analysis tools in Flutter

### 2. EVG Layout Engine (`evg/`)
- Flexbox-like layout calculations
- Can render to Flutter widgets

### 3. PDF Writer Components
- Font handling (`TrueTypeFont.rgr`)
- Image processing (`JPEGDecoder.rgr`, `PNGEncoder.rgr`)
- PDF generation (`EVGPDFRenderer.rgr`)

## Challenges and Considerations

### 1. File I/O
- Dart has different I/O APIs for mobile vs desktop vs web
- May need conditional compilation or abstraction layer

### 2. Async Operations
- Ranger is synchronous, Dart often uses async/await
- File operations in Dart are typically async

### 3. Package Dependencies
- Generated Dart code may need external packages
- Need to manage `pubspec.yaml` dependencies

### 4. Buffer Operations
- Dart's typed data API differs from other languages
- Need careful handling of byte operations

## Timeline

| Phase | Task | Estimated Hours | Dependencies |
|-------|------|-----------------|--------------|
| 1.1 | Create DartClassWriter base | 4-6h | None |
| 1.2 | Register in compiler | 1-2h | 1.1 |
| 1.3 | Basic operator templates | 3-4h | 1.2 |
| 2.1 | Null safety handling | 2-3h | 1.3 |
| 2.2 | Constructor patterns | 2-3h | 1.3 |
| 2.3 | Import system | 2-3h | 1.3 |
| 3.1 | Package structure | 3-4h | 2.x |
| 3.2 | Compile ts_parser | 4-6h | 3.1 |
| 3.3 | Compile pdf_writer | 4-6h | 3.2 |

**Total Estimate:** 25-40 hours

## Success Criteria

1. ✅ Simple Ranger programs compile to valid Dart code
2. ✅ Generated Dart code runs with `dart run`
3. ✅ ts_parser compiles and works in Dart
4. ✅ pdf_writer core components compile
5. ✅ Can create a Flutter package from generated code

## References

- [Dart Language Tour](https://dart.dev/language)
- [Dart Type System](https://dart.dev/language/type-system)
- [Dart Null Safety](https://dart.dev/null-safety)
- [Flutter Package Development](https://docs.flutter.dev/packages-and-plugins/developing-packages)
- Existing class writers: `ng_RangerKotlinClassWriter.rgr`, `ng_RangerSwift6ClassWriter.rgr`

## Checklist

### Phase 1: Basic Support
- [ ] Create `ng_RangerDartClassWriter.rgr`
- [ ] Add to `Lang.rgr` targets
- [ ] Import in `ng_RangerLanguageWriters.rgr`
- [ ] Register in `ng_LiveCompiler.rgr`
- [ ] Add to `VirtualCompiler.rgr`
- [ ] Implement basic operator templates
- [ ] Test with simple programs

### Phase 2: Full Support
- [ ] Null safety handling
- [ ] Constructor patterns
- [ ] Import system
- [ ] Typed data (buffers)
- [ ] All standard operators

### Phase 3: Module Compilation
- [ ] ts_parser compilation
- [ ] EVG layout compilation
- [ ] pdf_writer compilation
- [ ] Flutter package generation
