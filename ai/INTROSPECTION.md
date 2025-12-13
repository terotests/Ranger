# Compiler Introspection API for AI Assistants

## Overview

The Ranger compiler provides powerful introspection capabilities that allow querying type information, class structures, and AST positions from compiled source code. This is essential for:

- **IDE Integration**: Providing autocomplete, hover information, and go-to-definition
- **Incremental Compilation**: Understanding what changed and what needs recompilation
- **AI Code Generation**: Understanding the codebase structure to generate accurate code

## Key Concepts

### Compilation Context (`RangerAppWriterContext`)

After compilation, the context contains:

- `definedClasses` - Map of all defined classes
- `definedEnums` - Map of all defined enums
- `operators` - Available operators
- `compilerErrors` - Any errors encountered

### Code Nodes (`CodeNode`)

The AST representation with key properties:

- `sp` / `ep` - Start and end positions (byte offsets)
- `vref` - Value reference (variable name, operator, keyword)
- `type_name` - Declared type
- `eval_type_name` - Inferred/evaluated type
- `children` - Child nodes

### Class Descriptors (`RangerAppClassDesc`)

Class information with:

- `name` - Class name
- `variables` - Array of property descriptors
- `method_variants` - Map of methods (supports overloading)
- `static_methods` - Array of static methods
- `extends_classes` - Parent class names

## Introspection Utilities

### Position-Based Type Querying

Convert between line/column (1-based, like editors) and byte offsets:

```typescript
// Convert line/column to offset
const offset = lineColumnToOffset(sourceCode, line, column);

// Convert offset to line/column
const { line, column } = offsetToLineColumn(sourceCode, offset);
```

Find what type is at a specific position:

```typescript
const typeInfo = getTypeAtPosition(rootNode, sourceCode, line, column);
// Returns: {
//   node: CodeNode,
//   typeName: string,
//   evalTypeName: string,
//   vref: string,
//   nodeType: string,
//   sourceText: string,
//   ...
// }
```

### Class Introspection

Check if a class has specific properties or methods:

```typescript
// Check property existence and type
classHasProperty(result, "Person", "name"); // true/false
classHasProperty(result, "Person", "name", "string"); // with type check

// Check method existence and return type
classHasMethod(result, "Calculator", "add"); // true/false
classHasMethod(result, "Calculator", "add", "int"); // with return type
```

Get all properties and methods:

```typescript
// Get all properties with types
const props = getClassProperties(result, "MyClass");
// Returns: [{ name: "x", type: "int", isOptional: false }, ...]

// Get all methods with signatures
const methods = getClassMethods(result, "MyClass");
// Returns: [{ name: "foo", returnType: "string", params: ["x:int"], isStatic: false }, ...]
```

### Combined Position + Class Info

Get type at position with full class details:

```typescript
const info = getTypeWithClassInfo(result, sourceCode, line, column);
// Returns TypeAtPositionInfo extended with:
//   classInfo?: ClassInfo,
//   availableProperties: string[],
//   availableMethods: string[]
```

## Common Use Cases for AI Assistants

### 1. Understanding Variable Types

When a user asks about a variable, find its type and available operations:

```typescript
const result = await compileForIntrospection(sourceCode);
const typeInfo = getTypeAtPosition(
  result.rootNode,
  sourceCode,
  cursorLine,
  cursorCol
);

if (typeInfo.evalTypeName) {
  const classInfo = result.getClass(typeInfo.evalTypeName);
  // Now you know what properties/methods are available
}
```

### 2. Validating Code Changes

Before suggesting code changes, verify class structure:

```typescript
// Does Person class have a name property of type string?
if (classHasProperty(result, "Person", "name", "string")) {
  // Safe to reference person.name
}

// Does Calculator have an add method returning int?
if (classHasMethod(result, "Calculator", "add", "int")) {
  // Safe to suggest: def sum:int (calc.add(x))
}
```

### 3. Generating Method Calls

Get available methods for autocomplete/suggestion:

```typescript
const methods = getClassMethods(result, "Service");
for (const m of methods) {
  console.log(`${m.name}(${m.params.join(", ")}):${m.returnType}`);
}
// Output: process(input:string, count:int):string
```

### 4. Finding All Typed Elements

Get all nodes with type information for analysis:

```typescript
const allNodes = getAllTypedNodes(result.rootNode, sourceCode);
// Returns array of TypeAtPositionInfo for every typed node
```

### 5. Debugging Type Information

Format a visual type map for debugging:

```typescript
const typeMap = formatTypeMap(result.rootNode, sourceCode);
// Returns formatted string showing types at each line
```

## Type System Reference

### Primitive Types

- `int` - Integer
- `double` - Floating point
- `string` - String
- `boolean` - Boolean
- `char` - Single character
- `void` - No return value

### Compound Types

- `[T]` - Array of T
- `[K:V]` - Hash map with key type K and value type V
- `ClassName` - Instance of a class

### Type Inference

The compiler performs type inference:

- `type_name` - Declared type (what the programmer wrote)
- `eval_type_name` - Inferred type (what the compiler determined)

For AI assistants, prefer `eval_type_name` when available as it represents the actual runtime type.

## Integration with VirtualCompiler

The `VirtualCompiler` class is the main entry point:

```typescript
const vComp = new VirtualCompiler();
const result = await vComp.run(inputEnv);

// Access compilation context
const context = result.ctx;
const classes = context.definedClasses;
const errors = context.compilerErrors;
```

## Best Practices for AI Code Generation

1. **Always compile first** - Get accurate type information from the compiler
2. **Check types before suggesting** - Use `classHasProperty`/`classHasMethod` to validate
3. **Use position queries** - When cursor position is known, query the exact type
4. **Handle arrays/hashes specially** - Check for `[` prefix in type names
5. **Respect optional types** - Check `isOptional` before suggesting non-null access
6. **Consider inheritance** - Check `parentClass` for inherited members

## Error Handling

The introspection result includes errors:

```typescript
const result = await compileForIntrospection(sourceCode);
if (!result.success) {
  for (const error of result.errors) {
    console.log(error); // Handle compilation errors
  }
}
```

Common error patterns to handle:

- Undefined variables
- Type mismatches
- Missing methods/properties
- Invalid syntax
