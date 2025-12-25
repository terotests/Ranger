# TypeScript Parser - TODO

Missing TypeScript syntax features that need to be implemented.

## Known Issues

### Await with Ternary Expression

- [ ] **Await inside ternary branches** - Not parsing correctly

  ```typescript
  async function fn() { 
    const x = condition ? await a : await b; 
  }
  ```
  
  **Status**: The `await` expressions inside ternary branches are not being recognized.
  This may be related to how the parser handles `await` in expression context vs statement context.

## High Priority

### Update/Increment Expressions (COMPLETED ✓)

- [x] **UpdateExpression** (`++`, `--`) ✓ (Implemented)

  ```typescript
  i++;   // postfix increment
  ++i;   // prefix increment
  i--;   // postfix decrement
  --i;   // prefix decrement
  ```
  
  **AST structure**:
  ```json
  {
    "nodeType": "UpdateExpression",
    "value": "++",
    "left": { "nodeType": "Identifier", "name": "i" },
    "prefix": false
  }
  ```

- [x] **Compound Assignment Expressions** (`+=`, `-=`, `*=`, `/=`, `%=`) ✓ (Implemented)

  ```typescript
  x += 5;
  x -= 3;
  x *= 2;
  x /= 4;
  ```
  
  **AST structure**:
  ```json
  {
    "nodeType": "AssignmentExpression",
    "value": "+=",
    "left": { "nodeType": "Identifier", "name": "x" },
    "right": { "nodeType": "NumericLiteral", "value": "5" }
  }
  ```

### Type System

- [x] **Arrow function types** in interfaces/type aliases ✓ (Implemented)

  ```typescript
  interface Example {
    callback: (value: number) => string; // Now parsed correctly
  }
  type Handler = (event: Event) => void;
  ```

- [x] **Generic type parameters** in type declarations ✓ (Implemented)

  ```typescript
  type Container<T> = { value: T }; // Now parsed correctly
  type Result<T, E> = Success<T> | Failure<E>;
  ```

- [x] **Intersection types** ✓ (Implemented)

  ```typescript
  type Combined = TypeA & TypeB;
  ```

- [x] **Tuple types** ✓ (Implemented)

  ```typescript
  type Point = [number, number];
  type Named = [string, ...number[]];
  ```

- [x] **Mapped types** ✓ (Implemented)

  ```typescript
  type Readonly<T> = { readonly [K in keyof T]: T[K] };
  type Partial<T> = { [K in keyof T]?: T[K] };
  type Rename<T> = { [K in keyof T as `new_${K}`]: T[K] };
  ```

- [x] **Conditional types** ✓ (Implemented)

  ```typescript
  type NonNullable<T> = T extends null | undefined ? never : T;
  type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
  ```

- [x] **Type operators** ✓ (Implemented)

  ```typescript
  type Keys = keyof MyType;
  type Type = typeof myValue;
  type Inferred = T extends Array<infer U> ? U : never;
  ```

- [x] **Index signature types** ✓ (Implemented)
  ```typescript
  interface StringMap {
    [key: string]: string;
  }
  ```

### Expressions

- [x] **Nullish coalescing** (`??`) ✓ (Implemented)

  ```typescript
  const value = input ?? defaultValue;
  ```

- [x] **Optional chaining** (`?.`) ✓ (Implemented)

  ```typescript
  const name = user?.profile?.name;
  ```

- [x] **Type assertions** ✓ (Implemented - 'as' keyword)

  ```typescript
  const x = value as string;
  const y = <number>value; // angle bracket form not yet supported
  ```

- [x] **Non-null assertion** (`!`) ✓ (Implemented)
  ```typescript
  const name = user!.name;
  ```

### Declarations

- [x] **Method signatures** in interfaces (with proper body parsing) ✓ (Implemented)

  ```typescript
  interface Calculator {
    add(a: number, b: number): number; // Now parsed correctly
  }
  ```

- [x] **Class declarations** ✓ (Implemented)

  ```typescript
  class Person {
    private name: string;
    constructor(name: string) {
      this.name = name;
    }
    getName(): string {
      return this.name;
    }
  }
  ```

- [x] **Enum declarations** ✓ (Implemented)

  ```typescript
  enum Color {
    Red,
    Green,
    Blue,
  }
  enum Status {
    Active = 1,
    Inactive = 2,
  }
  ```

- [ ] **Namespace declarations**

  ```typescript
  namespace Utils {
    export function helper() {}
  }
  ```

- [ ] **Module declarations**
  ```typescript
  declare module "mymodule" {
    export function foo(): void;
  }
  ```

## Medium Priority

### Modifiers

- [x] **Access modifiers** (public, private, protected) ✓ (Implemented in class members)
- [x] **Static modifier** ✓ (Implemented in class members)
- [x] **Abstract modifier** ✓ (Implemented in class and class members)
- [ ] **Override modifier**

### Import/Export

- [ ] **Import statements**

  ```typescript
  import { foo } from "./module";
  import * as utils from "./utils";
  import type { MyType } from "./types";
  ```

- [ ] **Export statements**
  ```typescript
  export { foo, bar };
  export default class MyClass {}
  export type { MyType };
  ```

### Control Flow

- [x] **For...of loops** ✓ (Implemented)

  ```typescript
  for (const item of items) {
  }
  ```

- [x] **For...in loops** ✓ (Implemented)

  ```typescript
  for (const key in object) {
  }
  ```

- [x] **Try/catch/finally** ✓ (Implemented)

  ```typescript
  try {
  } catch (e) {
  } finally {
  }
  ```

- [x] **Switch statements** ✓ (Implemented)

  ```typescript
  switch (value) {
    case 1:
      break;
    default:
      break;
  }
  ```

- [x] **If/else statements** ✓ (Implemented)

- [x] **While loops** ✓ (Implemented)

- [x] **For loops** ✓ (Implemented)

### Literals

- [ ] **Template literals**

  ```typescript
  const msg = `Hello ${name}!`;
  ```

- [ ] **Object literals** with spread

  ```typescript
  const obj = { ...other, name: "test" };
  ```

- [ ] **Array destructuring**

  ```typescript
  const [a, b, ...rest] = arr;
  ```

- [ ] **Object destructuring**
  ```typescript
  const { name, age } = person;
  ```

## Low Priority

### Advanced Types

- [ ] **Literal types**

  ```typescript
  type Direction = "north" | "south" | "east" | "west";
  type One = 1;
  ```

- [ ] **Template literal types**

  ```typescript
  type EventName = `on${string}`;
  ```

- [ ] **Infer keyword**

  ```typescript
  type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
  ```

- [ ] **Satisfies operator**
  ```typescript
  const config = { ... } satisfies Config;
  ```

### Decorators

- [ ] **Class decorators**

  ```typescript
  @Component({})
  class MyComponent {}
  ```

- [ ] **Method/property decorators**
  ```typescript
  class Example {
    @Input() value: string;
  }
  ```

### JSX/TSX

- [ ] **JSX elements**

  ```tsx
  const element = <div className="test">Hello</div>;
  ```

- [ ] **JSX fragments**
  ```tsx
  const fragment = <>Item 1, Item 2</>;
  ```

## Completed ✓

- [x] Interface declarations
- [x] Type aliases with union types
- [x] Function declarations with parameters and return types
- [x] Variable declarations (let, const, var)
- [x] Optional properties (`?`)
- [x] Readonly modifier
- [x] Basic type annotations
- [x] Array types (`T[]`, `Array<T>`)
- [x] Generic type references (e.g., `Promise<string>`)
- [x] Basic expressions (literals, identifiers, binary ops)
- [x] If/else statements
- [x] While loops
- [x] Return statements
- [x] Block statements

## Notes

The parser is designed for **type extraction** use cases (listing interfaces, types, functions) rather than full semantic analysis. Many features can be added incrementally as needed.

For features that aren't parsed, the parser uses "quiet mode" to suppress errors when running `--show-*` commands, allowing partial extraction of valid constructs.
