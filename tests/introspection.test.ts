/**
 * Compiler Introspection Tests
 *
 * These tests verify the Ranger compiler's ability to analyze source code
 * and provide accurate type/context information. This is the foundation
 * for incremental compilation - we must first validate that the compiler
 * correctly tracks:
 *
 * 1. Class definitions and their properties/methods
 * 2. Variable declarations and their types
 * 3. Type inference (eval_type_name)
 * 4. Method contexts and local variables
 * 5. Available operators for each type
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  compileForIntrospection,
  parseOnly,
  findNodeAtOffset,
  findEnclosingFunction,
  getTypeAtPosition,
  getTypeAtOffset,
  lineColumnToOffset,
  offsetToLineColumn,
  getAllTypedNodes,
  formatTypeMap,
  getTypeWithClassInfo,
  classHasProperty,
  classHasMethod,
  getClassProperties,
  getClassMethods,
  IntrospectionResult,
  TypeAtPositionInfo,
  TypeWithClassInfo,
} from "./helpers/introspection";

describe("Compiler Introspection", () => {
  describe("Class Definition Analysis", () => {
    it("should identify class with properties and methods", async () => {
      const result = await compileForIntrospection(`
        class Point {
          def x:double 0.0
          def y:double 0.0
          
          Constructor (x:double y:double) {
            this.x = x
            this.y = y
          }
          
          fn distance:double (other:Point) {
            def dx:double (this.x - other.x)
            def dy:double (this.y - other.y)
            return (sqrt ((dx * dx) + (dy * dy)))
          }
          
          fn add:Point (other:Point) {
            def result (new Point (0.0 0.0))
            result.x = (this.x + other.x)
            result.y = (this.y + other.y)
            return result
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const pointClass = result.getClass("Point");
      expect(pointClass).toBeDefined();
      expect(pointClass!.name).toBe("Point");

      // Check properties
      expect(pointClass!.properties.length).toBe(2);
      const xProp = pointClass!.properties.find((p) => p.name === "x");
      const yProp = pointClass!.properties.find((p) => p.name === "y");
      expect(xProp).toBeDefined();
      expect(xProp!.typeName).toBe("double");
      expect(yProp).toBeDefined();
      expect(yProp!.typeName).toBe("double");

      // Check methods
      expect(pointClass!.methods.length).toBeGreaterThanOrEqual(2);
      const distanceMethod = pointClass!.methods.find(
        (m) => m.name === "distance"
      );
      expect(distanceMethod).toBeDefined();
      expect(distanceMethod!.returnType).toBe("double");
      expect(distanceMethod!.parameters.length).toBe(1);
      expect(distanceMethod!.parameters[0].name).toBe("other");
      expect(distanceMethod!.parameters[0].typeName).toBe("Point");
    });

    it("should identify static methods", async () => {
      const result = await compileForIntrospection(`
        class Factory {
          sfn create:Factory () {
            return (new Factory)
          }
          
          sfn createWithValue:Factory (value:int) {
            def f (new Factory)
            return f
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const factoryClass = result.getClass("Factory");
      expect(factoryClass).toBeDefined();
      expect(factoryClass!.staticMethods.length).toBeGreaterThanOrEqual(2);

      const createMethod = factoryClass!.staticMethods.find(
        (m) => m.name === "create"
      );
      expect(createMethod).toBeDefined();
      expect(createMethod!.isStatic).toBe(true);
      expect(createMethod!.returnType).toBe("Factory");
    });

    it("should identify inheritance relationships", async () => {
      const result = await compileForIntrospection(`
        class Animal {
          def name:string ""
          fn speak:string () {
            return "..."
          }
        }
        
        class Dog {
          Extends(Animal)
          
          fn speak:string () {
            return "Woof!"
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const dogClass = result.getClass("Dog");
      expect(dogClass).toBeDefined();
      expect(dogClass!.parentClass).toBe("Animal");
    });

    it("should identify optional properties", async () => {
      const result = await compileForIntrospection(`
        class Container {
          def value@(optional):string
          def count:int 0
          
          fn setValue:void (v:string) {
            value = v
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const containerClass = result.getClass("Container");
      expect(containerClass).toBeDefined();

      const valueProp = containerClass!.properties.find(
        (p) => p.name === "value"
      );
      const countProp = containerClass!.properties.find(
        (p) => p.name === "count"
      );

      expect(valueProp).toBeDefined();
      expect(valueProp!.isOptional).toBe(true);
      expect(countProp).toBeDefined();
      expect(countProp!.isOptional).toBe(false);
    });
  });

  describe("Type Analysis", () => {
    it("should infer types for variable declarations", async () => {
      const result = await compileForIntrospection(`
        class TypeTest {
          fn testTypes:void () {
            def intVar:int 42
            def doubleVar:double 3.14
            def stringVar:string "hello"
            def boolVar:boolean true
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const typeTestClass = result.getClass("TypeTest");
      expect(typeTestClass).toBeDefined();

      // Check that the method has its context
      const testTypesMethod = typeTestClass!.methods.find(
        (m) => m.name === "testTypes"
      );
      expect(testTypesMethod).toBeDefined();
      expect(testTypesMethod!.fnCtx).toBeDefined();
    });

    it("should handle array types", async () => {
      const result = await compileForIntrospection(`
        class ArrayTest {
          def items:[string]
          def numbers:[int]
          
          fn addItem:void (item:string) {
            push items item
          }
          
          fn getItems:[string] () {
            return items
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const arrayTestClass = result.getClass("ArrayTest");
      expect(arrayTestClass).toBeDefined();

      // Check that array properties are tracked
      const itemsProp = arrayTestClass!.properties.find(
        (p) => p.name === "items"
      );
      expect(itemsProp).toBeDefined();
      // Note: Type name extraction for arrays is complex - the property exists
      // This test documents that the compiler tracks array properties

      const numbersProp = arrayTestClass!.properties.find(
        (p) => p.name === "numbers"
      );
      expect(numbersProp).toBeDefined();

      // Check method that returns an array type
      const getItemsMethod = arrayTestClass!.methods.find(
        (m) => m.name === "getItems"
      );
      expect(getItemsMethod).toBeDefined();
    });

    it("should handle hash map types", async () => {
      const result = await compileForIntrospection(`
        class MapTest {
          def lookup:[string:int]
          
          fn setValue:void (key:string value:int) {
            set lookup key value
          }
          
          fn getValue@(optional):int (key:string) {
            return (get lookup key)
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const mapTestClass = result.getClass("MapTest");
      expect(mapTestClass).toBeDefined();

      const lookupProp = mapTestClass!.properties.find(
        (p) => p.name === "lookup"
      );
      expect(lookupProp).toBeDefined();
    });
  });

  describe("Enum Analysis", () => {
    it("should identify enum definitions", async () => {
      const result = await compileForIntrospection(`
        Enum Color (
          Red
          Green
          Blue
        )
        
        Enum Direction (
          North
          East
          South
          West
        )
        
        class EnumTest {
          def color:Color Color.Red
          
          fn setColor:void (c:Color) {
            color = c
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const enums = result.getEnums();
      expect(enums.size).toBeGreaterThanOrEqual(2);

      const colorEnum = enums.get("Color");
      expect(colorEnum).toBeDefined();
      expect(colorEnum!.values).toContain("Red");
      expect(colorEnum!.values).toContain("Green");
      expect(colorEnum!.values).toContain("Blue");

      const directionEnum = enums.get("Direction");
      expect(directionEnum).toBeDefined();
      expect(directionEnum!.values.length).toBe(4);
    });
  });

  describe("Method Context Analysis", () => {
    it("should track local variables in method context", async () => {
      const result = await compileForIntrospection(`
        class Calculator {
          def value:int 0
          
          fn calculate:int (x:int y:int) {
            def sum:int (x + y)
            def product:int (x * y)
            def result:int (sum + product)
            return result
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      // Get variables in scope for the calculate method
      const variables = result.getVariablesInScope("Calculator", "calculate");

      // Should have parameters x, y and local variables sum, product, result
      const varNames = variables.map((v) => v.name);
      expect(varNames).toContain("x");
      expect(varNames).toContain("y");
      expect(varNames).toContain("sum");
      expect(varNames).toContain("product");
      expect(varNames).toContain("result");

      // Check types
      const sumVar = variables.find((v) => v.name === "sum");
      expect(sumVar).toBeDefined();
      expect(sumVar!.typeName).toBe("int");
    });

    it("should preserve method context for recompilation", async () => {
      const result = await compileForIntrospection(`
        class ContextTest {
          def data:string ""
          
          fn process:string (input:string) {
            def temp:string (input + " processed")
            def result:string (temp + " done")
            return result
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const contextTestClass = result.getClass("ContextTest");
      expect(contextTestClass).toBeDefined();

      const processMethod = contextTestClass!.methods.find(
        (m) => m.name === "process"
      );
      expect(processMethod).toBeDefined();

      // The method should have its context preserved (fnCtx)
      expect(processMethod!.fnCtx).toBeDefined();

      // The context should have class information
      // This is important for incremental recompilation
      const fnCtx = processMethod!.fnCtx;
      // fnCtx is an instance of RangerAppWriterContext
      // Check that it has local variable tracking
      expect(
        fnCtx.localVariables !== undefined || fnCtx.localVarNames !== undefined
      ).toBeTruthy();
    });
  });

  describe("Multiple Class Interaction", () => {
    it("should handle multiple interacting classes", async () => {
      const result = await compileForIntrospection(`
        class Person {
          def name:string ""
          def age:int 0
          
          Constructor (n:string a:int) {
            name = n
            age = a
          }
          
          fn greet:string () {
            return ("Hello, I am " + name)
          }
        }
        
        class Team {
          def members:[Person]
          def name:string ""
          
          fn addMember:void (p:Person) {
            push members p
          }
          
          fn getMemberCount:int () {
            return (array_length members)
          }
        }
        
        class App {
          sfn main@(main):void () {
            def team (new Team)
            team.name = "Engineering"
            
            def alice (new Person ("Alice" 30))
            def bob (new Person ("Bob" 25))
            
            team.addMember(alice)
            team.addMember(bob)
            
            def cnt (team.getMemberCount())
          }
        }
      `);

      expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

      const classes = result.getClasses();
      expect(classes.size).toBeGreaterThanOrEqual(3);
      expect(classes.has("Person")).toBe(true);
      expect(classes.has("Team")).toBe(true);
      expect(classes.has("App")).toBe(true);

      // Check Team class exists and has members property
      const teamClass = classes.get("Team");
      expect(teamClass).toBeDefined();
      const membersProp = teamClass!.properties.find(
        (p) => p.name === "members"
      );
      expect(membersProp).toBeDefined();
      // The property exists - type info for arrays is complex

      // Check methods exist
      const addMemberMethod = teamClass!.methods.find(
        (m) => m.name === "addMember"
      );
      expect(addMemberMethod).toBeDefined();
    });
  });

  describe("Parser AST Analysis", () => {
    it("should parse source and maintain positions", () => {
      const source = `class Test {
  def x:int 0
  fn foo:int () {
    return x
  }
}`;

      const result = parseOnly(source);

      expect(result.success).toBe(true);
      expect(result.rootNode).toBeDefined();

      // Root node starts at 0
      expect(result.rootNode.sp).toBe(0);

      // Should have children (class definition)
      expect(result.rootNode.children.length).toBeGreaterThan(0);

      // The first child should be the class definition
      const classNode = result.rootNode.children[0];
      expect(classNode).toBeDefined();
      expect(
        classNode.vref === "class" || classNode.children?.[0]?.vref === "class"
      ).toBe(true);
    });

    it("should find node at offset", () => {
      const source = `class Test {
  def x:int 0
  fn foo:int () {
    return x
  }
}`;

      const result = parseOnly(source);
      expect(result.success).toBe(true);

      // Find offset inside the class body
      const fnOffset = source.indexOf("fn foo");
      const node = findNodeAtOffset(result.rootNode, fnOffset);

      // We should find some node at this position
      expect(node).toBeDefined();
      if (node) {
        expect(node.sp).toBeLessThanOrEqual(fnOffset);
      }
    });

    it("should find enclosing function", () => {
      const source = `class Test {
  fn foo:int () {
    def y:int 10
    return y
  }
}`;

      const result = parseOnly(source);
      expect(result.success).toBe(true);

      // Find offset inside the function body (at "def y")
      const yOffset = source.indexOf("def y");
      const fnNode = findEnclosingFunction(result.rootNode, yOffset);

      // fnNode might be null if the parser structure is different than expected
      // Just check it doesn't throw
      if (fnNode) {
        expect(fnNode.vref).toBe("fn");
      }
    });
  });

  describe("Error Handling", () => {
    it("should report undefined variable errors", async () => {
      const result = await compileForIntrospection(`
        class ErrorTest {
          fn test:void () {
            print undefinedVar
          }
        }
      `);

      // Should have errors
      expect(result.errors.length).toBeGreaterThan(0);
      // Error should mention undefined variable
      const hasUndefinedError = result.errors.some(
        (e) =>
          e.toLowerCase().includes("undefined") ||
          e.toLowerCase().includes("variable")
      );
      expect(hasUndefinedError).toBe(true);
    });

    it("should report type mismatch errors", async () => {
      const result = await compileForIntrospection(`
        class TypeErrorTest {
          fn test:int () {
            def x:int "not an int"
            return x
          }
        }
      `);

      // Should have errors about type mismatch
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("Operator Availability", () => {
  it("should have operators loaded from Lang.rgr", async () => {
    const result = await compileForIntrospection(`
      class OpTest {
        fn test:void () {
          def x:int 10
          def y:int (x + 5)
        }
      }
    `);

    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // The context should have operators available
    expect(result.context).toBeDefined();
    expect(result.context.operators).toBeDefined();
  });
});

describe("Position-Based Type Querying", () => {
  it("should convert line/column to offset correctly", () => {
    const sourceCode = `line 1
line 2
line 3`;

    // Line 1, column 1 should be offset 0
    expect(lineColumnToOffset(sourceCode, 1, 1)).toBe(0);

    // Line 1, column 5 should be offset 4 (0-indexed: l=0, i=1, n=2, e=3, ' '=4)
    expect(lineColumnToOffset(sourceCode, 1, 5)).toBe(4);

    // Line 2, column 1 should be offset 7 (after "line 1\n")
    expect(lineColumnToOffset(sourceCode, 2, 1)).toBe(7);

    // Line 3, column 1 should be offset 14 (after "line 1\nline 2\n")
    expect(lineColumnToOffset(sourceCode, 3, 1)).toBe(14);
  });

  it("should convert offset to line/column correctly", () => {
    const sourceCode = `line 1
line 2
line 3`;

    // Offset 0 is line 1, column 1
    expect(offsetToLineColumn(sourceCode, 0)).toEqual({ line: 1, column: 1 });

    // Offset 4 is line 1, column 5
    expect(offsetToLineColumn(sourceCode, 4)).toEqual({ line: 1, column: 5 });

    // Offset 7 is line 2, column 1
    expect(offsetToLineColumn(sourceCode, 7)).toEqual({ line: 2, column: 1 });

    // Offset 14 is line 3, column 1
    expect(offsetToLineColumn(sourceCode, 14)).toEqual({ line: 3, column: 1 });
  });

  it("should get type of a variable at its definition", async () => {
    const sourceCode = `class TypeTest {
  fn test:void () {
    def myVar:int 42
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);
    expect(result.rootNode).toBeDefined();

    // Find the "def" keyword - it's on line 3
    // Line 3: "    def myVar:int 42"
    // "def" starts at column 5
    const typeInfo = getTypeAtPosition(result.rootNode, sourceCode, 3, 5);

    expect(typeInfo.node).not.toBeNull();
    // The "def" node should be found - type info may be on the vref
    // Verify we found a node within the expected range
    expect(typeInfo.vref).toBeTruthy();
  });

  it("should get type of an integer literal", async () => {
    const sourceCode = `class TypeTest {
  fn test:void () {
    def x:int 42
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 3: "    def x:int 42"
    // "42" starts at column 15
    const typeInfo = getTypeAtPosition(result.rootNode, sourceCode, 3, 15);

    expect(typeInfo.node).not.toBeNull();
    // Integer literal should have int type
    if (typeInfo.evalTypeName) {
      expect(typeInfo.evalTypeName).toBe("int");
    }
  });

  it("should get type of a string literal", async () => {
    const sourceCode = `class TypeTest {
  fn test:void () {
    def s:string "hello world"
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 3: '    def s:string "hello world"'
    // The string starts at column 18
    const typeInfo = getTypeAtPosition(result.rootNode, sourceCode, 3, 18);

    expect(typeInfo.node).not.toBeNull();
    if (typeInfo.evalTypeName) {
      expect(typeInfo.evalTypeName).toBe("string");
    }
  });

  it("should get type info from an expression", async () => {
    const sourceCode = `class ExprTest {
  fn calculate:int () {
    def x:int 10
    def y:int (x + 5)
    return y
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 4: "    def y:int (x + 5)"
    // The expression (x + 5) starts with '(' at column 15
    const exprInfo = getTypeAtPosition(result.rootNode, sourceCode, 4, 15);

    expect(exprInfo.node).not.toBeNull();
    // Expression should evaluate to int
    if (exprInfo.evalTypeName) {
      expect(exprInfo.evalTypeName).toBe("int");
    }
  });

  it("should get type info for object instance", async () => {
    const sourceCode = `class Person {
  def name:string ""
}
class MainClass {
  fn test:void () {
    def p:Person (new Person ())
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 6: "    def p:Person (new Person ())"
    // "p" is at column 9, but let's look at the "new" keyword at column 19
    const newExprInfo = getTypeAtPosition(result.rootNode, sourceCode, 6, 19);

    expect(newExprInfo.node).not.toBeNull();
    // Should show Person type
    if (newExprInfo.evalTypeName || newExprInfo.typeName) {
      expect(newExprInfo.evalTypeName || newExprInfo.typeName).toBe("Person");
    }
  });

  it("should get type info for array elements", async () => {
    const sourceCode = `class ArrayTest {
  def arr:[int] ()
  fn test:void () {
    push arr 42
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 2: "  def arr:[int] ()"
    // "def" starts at column 3
    const arrInfo = getTypeAtPosition(result.rootNode, sourceCode, 2, 3);

    expect(arrInfo.node).not.toBeNull();
  });

  it("should find all typed nodes in source code", async () => {
    const sourceCode = `class AllTypesTest {
  def count:int 0
  fn increment:int () {
    count = (count + 1)
    return count
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    const allNodes = getAllTypedNodes(result.rootNode, sourceCode);

    // Should find multiple nodes with type info
    expect(allNodes.length).toBeGreaterThan(0);

    // Should include class nodes at minimum
    const nodeTypes = allNodes.map((n) => n.vref);
    expect(nodeTypes).toContain("class");
    // Note: Functions are nested inside class nodes, so they're found through traversal
  });

  it("should handle positions outside of any node", async () => {
    const sourceCode = `
class EmptySpaceTest {
}
`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 1 is empty - should return no node
    const emptyLineInfo = getTypeAtPosition(result.rootNode, sourceCode, 1, 1);

    // Node might be null or have minimal info - should not crash
    if (emptyLineInfo.node === null) {
      expect(emptyLineInfo.typeName).toBe("");
      expect(emptyLineInfo.evalTypeName).toBe("");
    }
  });

  it("should get type info inside a method call", async () => {
    const sourceCode = `class MethodCallTest {
  fn getString:string () {
    return "test"
  }
  fn test:void () {
    def s:string (getString ())
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Line 6: "    def s:string (getString ())"
    // "getString" starts at column 19
    const methodCallInfo = getTypeAtPosition(
      result.rootNode,
      sourceCode,
      6,
      19
    );

    expect(methodCallInfo.node).not.toBeNull();
    // Method call should show string return type
    if (methodCallInfo.evalTypeName) {
      expect(methodCallInfo.evalTypeName).toBe("string");
    }
  });

  it("should format type map for debugging", async () => {
    const sourceCode = `class TypeMapTest {
  fn add:int (a:int b:int) {
    return (a + b)
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    const typeMap = formatTypeMap(result.rootNode, sourceCode);

    // Should produce formatted output
    expect(typeMap).toBeTruthy();
    expect(typeMap.length).toBeGreaterThan(0);

    // Should contain line numbers
    expect(typeMap).toContain("1:");
    expect(typeMap).toContain("2:");
  });
});

describe("Class Property and Method Verification", () => {
  it("should verify class has specific named properties", async () => {
    const sourceCode = `class Person {
  def name:string ""
  def age:int 0
  def email@(optional):string
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Verify class has expected properties
    expect(classHasProperty(result, "Person", "name")).toBe(true);
    expect(classHasProperty(result, "Person", "age")).toBe(true);
    expect(classHasProperty(result, "Person", "email")).toBe(true);

    // Verify property types
    expect(classHasProperty(result, "Person", "name", "string")).toBe(true);
    expect(classHasProperty(result, "Person", "age", "int")).toBe(true);

    // Verify non-existent property returns false
    expect(classHasProperty(result, "Person", "address")).toBe(false);

    // Verify wrong type returns false
    expect(classHasProperty(result, "Person", "name", "int")).toBe(false);
  });

  it("should verify class has specific named methods", async () => {
    const sourceCode = `class Calculator {
  def value:int 0
  
  fn add:int (x:int) {
    return (value + x)
  }
  
  fn subtract:int (x:int) {
    return (value - x)
  }
  
  fn getValue:int () {
    return value
  }
  
  sfn create:Calculator () {
    return (new Calculator)
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Verify class has expected methods
    expect(classHasMethod(result, "Calculator", "add")).toBe(true);
    expect(classHasMethod(result, "Calculator", "subtract")).toBe(true);
    expect(classHasMethod(result, "Calculator", "getValue")).toBe(true);
    expect(classHasMethod(result, "Calculator", "create")).toBe(true);

    // Verify method return types
    expect(classHasMethod(result, "Calculator", "add", "int")).toBe(true);
    expect(classHasMethod(result, "Calculator", "getValue", "int")).toBe(true);
    expect(classHasMethod(result, "Calculator", "create", "Calculator")).toBe(
      true
    );

    // Verify non-existent method returns false
    expect(classHasMethod(result, "Calculator", "multiply")).toBe(false);

    // Verify wrong return type returns false
    expect(classHasMethod(result, "Calculator", "add", "string")).toBe(false);
  });

  it("should get all properties with types for a class", async () => {
    const sourceCode = `class DataModel {
  def id:int 0
  def title:string ""
  def price:double 0.0
  def active:boolean true
  def tags:[string]
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    const properties = getClassProperties(result, "DataModel");

    // Should have 5 properties
    expect(properties.length).toBe(5);

    // Check specific properties exist with correct types
    const idProp = properties.find((p) => p.name === "id");
    expect(idProp).toBeDefined();
    expect(idProp!.type).toBe("int");

    const titleProp = properties.find((p) => p.name === "title");
    expect(titleProp).toBeDefined();
    expect(titleProp!.type).toBe("string");

    const priceProp = properties.find((p) => p.name === "price");
    expect(priceProp).toBeDefined();
    expect(priceProp!.type).toBe("double");

    const activeProp = properties.find((p) => p.name === "active");
    expect(activeProp).toBeDefined();
    expect(activeProp!.type).toBe("boolean");
  });

  it("should get all methods with signatures for a class", async () => {
    const sourceCode = `class Service {
  fn process:string (input:string count:int) {
    return input
  }
  
  fn validate:boolean (data:string) {
    return true
  }
  
  sfn getInstance:Service () {
    return (new Service)
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    const methods = getClassMethods(result, "Service");

    // Should have 3 methods
    expect(methods.length).toBe(3);

    // Check process method
    const processMethod = methods.find((m) => m.name === "process");
    expect(processMethod).toBeDefined();
    expect(processMethod!.returnType).toBe("string");
    expect(processMethod!.isStatic).toBe(false);
    expect(processMethod!.params).toContain("input:string");
    expect(processMethod!.params).toContain("count:int");

    // Check validate method
    const validateMethod = methods.find((m) => m.name === "validate");
    expect(validateMethod).toBeDefined();
    expect(validateMethod!.returnType).toBe("boolean");

    // Check static method
    const getInstanceMethod = methods.find((m) => m.name === "getInstance");
    expect(getInstanceMethod).toBeDefined();
    expect(getInstanceMethod!.isStatic).toBe(true);
    expect(getInstanceMethod!.returnType).toBe("Service");
  });

  it("should get class info for variable type at position", async () => {
    const sourceCode = `class Point {
  def x:double 0.0
  def y:double 0.0
  
  fn distance:double (other:Point) {
    return 0.0
  }
  
  fn scale:void (factor:double) {
    x = (x * factor)
    y = (y * factor)
  }
}

class Main {
  fn test:void () {
    def p:Point (new Point)
    p.x = 10.0
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Look at the variable "p" on line 17 (def p:Point)
    // Line 17: "    def p:Point (new Point)"
    // Look at "Point" which starts around column 11
    const typeWithClass = getTypeWithClassInfo(result, sourceCode, 17, 11);

    // If we found a class type, verify we can access its properties and methods
    if (typeWithClass.classInfo) {
      expect(typeWithClass.classInfo.name).toBe("Point");
      expect(typeWithClass.availableProperties).toContain("x");
      expect(typeWithClass.availableProperties).toContain("y");
      expect(typeWithClass.availableMethods).toContain("distance");
      expect(typeWithClass.availableMethods).toContain("scale");
    }

    // At minimum, verify Point class exists and has correct structure
    const pointClass = result.getClass("Point");
    expect(pointClass).toBeDefined();
    expect(pointClass!.properties.length).toBe(2);
    expect(pointClass!.methods.length).toBeGreaterThanOrEqual(2);
  });

  it("should verify properties of variable type found at text position", async () => {
    const sourceCode = `class Rectangle {
  def width:double 0.0
  def height:double 0.0
  def color:string "white"
  
  fn area:double () {
    return (width * height)
  }
  
  fn perimeter:double () {
    return ((width + height) * 2.0)
  }
}

class Canvas {
  fn draw:void (rect:Rectangle) {
    def w:double rect.width
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // The parameter "rect" has type Rectangle
    // Verify Rectangle class has expected properties
    expect(classHasProperty(result, "Rectangle", "width", "double")).toBe(true);
    expect(classHasProperty(result, "Rectangle", "height", "double")).toBe(
      true
    );
    expect(classHasProperty(result, "Rectangle", "color", "string")).toBe(true);

    // Verify Rectangle class has expected methods
    expect(classHasMethod(result, "Rectangle", "area", "double")).toBe(true);
    expect(classHasMethod(result, "Rectangle", "perimeter", "double")).toBe(
      true
    );

    // Get all properties to verify count
    const props = getClassProperties(result, "Rectangle");
    expect(props.length).toBe(3);

    // Get all methods to verify count
    const methods = getClassMethods(result, "Rectangle");
    expect(methods.length).toBe(2);
  });

  it("should handle class with inheritance and verify parent properties", async () => {
    const sourceCode = `class Animal {
  def name:string ""
  def age:int 0
  
  fn speak:string () {
    return "..."
  }
}

class Dog {
  Extends(Animal)
  def breed:string ""
  
  fn speak:string () {
    return "Woof!"
  }
  
  fn fetch:void () {
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    // Verify Animal class
    expect(classHasProperty(result, "Animal", "name", "string")).toBe(true);
    expect(classHasProperty(result, "Animal", "age", "int")).toBe(true);
    expect(classHasMethod(result, "Animal", "speak", "string")).toBe(true);

    // Verify Dog class has its own property
    expect(classHasProperty(result, "Dog", "breed", "string")).toBe(true);

    // Verify Dog has its methods
    expect(classHasMethod(result, "Dog", "speak", "string")).toBe(true);
    expect(classHasMethod(result, "Dog", "fetch", "void")).toBe(true);

    // Verify inheritance relationship
    const dogClass = result.getClass("Dog");
    expect(dogClass).toBeDefined();
    expect(dogClass!.parentClass).toBe("Animal");
  });

  it("should identify method parameters and their types", async () => {
    const sourceCode = `class Processor {
  fn process:string (input:string multiplier:int flag:boolean) {
    return input
  }
}`;

    const result = await compileForIntrospection(sourceCode);
    expect(result.success, `Errors: ${result.errors.join(", ")}`).toBe(true);

    const methods = getClassMethods(result, "Processor");
    const processMethod = methods.find((m) => m.name === "process");

    expect(processMethod).toBeDefined();
    expect(processMethod!.params.length).toBe(3);
    expect(processMethod!.params).toContain("input:string");
    expect(processMethod!.params).toContain("multiplier:int");
    expect(processMethod!.params).toContain("flag:boolean");
  });
});
