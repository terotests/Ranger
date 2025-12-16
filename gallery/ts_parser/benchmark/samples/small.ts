// Interface declaration
interface Person {
  readonly id: number;
  name: string;
  age?: number;
}

// Type alias with union
type ID = string | number;
type Status = "active" | "inactive" | "pending";

// Variable declarations with types
let count: number = 42;
const message: string = "hello";
const isActive: boolean = true;

// Function with type annotations
function greet(name: string, age?: number): string {
  return "Hello, " + name;
}

// Arrow function with types
const add = (a: number, b: number): number => a + b;

// Generic type
let items: Array<string> = ["one", "two", "three"];

// Interface with methods
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

// Type with generics
type Result<T> = T | null;
type Container<T> = {
  value: T;
  timestamp: number;
};
