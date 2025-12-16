# TypeScript Parser - TODO

Missing TypeScript syntax features that need to be implemented.

## High Priority

### Type System

- [ ] **Arrow function types** in interfaces/type aliases

  ```typescript
  interface Example {
    callback: (value: number) => string; // Currently not parsed correctly
  }
  type Handler = (event: Event) => void;
  ```

- [ ] **Generic type parameters** in type declarations

  ```typescript
  type Container<T> = { value: T }; // <T> not parsed
  type Result<T, E> = Success<T> | Failure<E>;
  ```

- [ ] **Intersection types**

  ```typescript
  type Combined = TypeA & TypeB;
  ```

- [ ] **Tuple types**

  ```typescript
  type Point = [number, number];
  type Named = [string, ...number[]];
  ```

- [ ] **Mapped types**

  ```typescript
  type Readonly<T> = { readonly [K in keyof T]: T[K] };
  ```

- [ ] **Conditional types**

  ```typescript
  type NonNullable<T> = T extends null | undefined ? never : T;
  ```

- [ ] **Index signature types**
  ```typescript
  interface StringMap {
    [key: string]: string;
  }
  ```

### Expressions

- [ ] **Nullish coalescing** (`??`)

  ```typescript
  const value = input ?? defaultValue;
  ```

- [ ] **Optional chaining** (`?.`)

  ```typescript
  const name = user?.profile?.name;
  ```

- [ ] **Type assertions**

  ```typescript
  const x = value as string;
  const y = <number>value;
  ```

- [ ] **Non-null assertion** (`!`)
  ```typescript
  const name = user!.name;
  ```

### Declarations

- [ ] **Method signatures** in interfaces (with proper body parsing)

  ```typescript
  interface Calculator {
    add(a: number, b: number): number; // Parsed as separate properties currently
  }
  ```

- [ ] **Class declarations**

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

- [ ] **Enum declarations**

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

- [ ] **Access modifiers** (public, private, protected)
- [ ] **Static modifier**
- [ ] **Abstract modifier**
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

- [ ] **For...of loops**

  ```typescript
  for (const item of items) {
  }
  ```

- [ ] **For...in loops**

  ```typescript
  for (const key in object) {
  }
  ```

- [ ] **Try/catch/finally**

  ```typescript
  try {
  } catch (e) {
  } finally {
  }
  ```

- [ ] **Switch statements**
  ```typescript
  switch (value) {
    case 1:
      break;
    default:
      break;
  }
  ```

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
