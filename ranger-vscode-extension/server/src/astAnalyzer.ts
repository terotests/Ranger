/**
 * AST Analyzer for Ranger Language Server
 *
 * Analyzes the AST from the real Ranger compiler and extracts symbol information
 * using the compiler's context (RangerAppWriterContext) which contains:
 * - definedClasses: All class definitions with methods and properties
 * - localVariables: Variables in scope
 * - definedEnums: Enum definitions
 * - compilerErrors: Compilation errors
 *
 * After running CollectMethods and StartWalk, CodeNodes have:
 * - eval_type_name: The inferred type of the expression
 * - type_name: The declared type annotation
 */

import { CodeNode } from "./rangerCompiler";

export interface SymbolInfo {
  name: string;
  kind:
    | "class"
    | "method"
    | "static-method"
    | "property"
    | "variable"
    | "parameter"
    | "enum";
  type: string;
  node?: CodeNode;
  position?: { line: number; character: number };
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  documentation?: string;
  detail?: string;
}

export interface ClassInfo {
  name: string;
  methods: SymbolInfo[];
  staticMethods: SymbolInfo[];
  properties: SymbolInfo[];
  node: CodeNode;
  isSystemClass: boolean;
  parentClass?: string;
}

/**
 * Analyzes AST and context from the real Ranger compiler
 */
export class ASTAnalyzer {
  private context: any; // RangerAppWriterContext
  private rootNode: CodeNode;
  private code: string;

  constructor(rootNode: CodeNode, context: any, code: string) {
    if (!rootNode) {
      throw new Error("ASTAnalyzer: rootNode is null or undefined");
    }
    if (!context) {
      throw new Error("ASTAnalyzer: context is null or undefined");
    }
    this.rootNode = rootNode;
    this.context = context;
    this.code = code;
  }

  /**
   * Get all defined classes from the compiler context
   */
  getDefinedClasses(): Map<string, ClassInfo> {
    const classes = new Map<string, ClassInfo>();

    if (!this.context.definedClasses) {
      return classes;
    }

    // Iterate through all defined classes in the context
    const classNames =
      this.context.definedClassList || Object.keys(this.context.definedClasses);

    for (const className of classNames) {
      const classDesc = this.context.definedClasses[className];
      if (!classDesc) continue;

      const classInfo: ClassInfo = {
        name: className,
        methods: [],
        staticMethods: [],
        properties: [],
        node: classDesc.classNode,
        isSystemClass: classDesc.is_system || false,
        parentClass: classDesc.parent_class,
      };

      // Extract methods from class description
      if (classDesc.methods) {
        // Check if methods is an array or object
        if (Array.isArray(classDesc.methods)) {
          // Handle array of method descriptors
          for (const methodDesc of classDesc.methods) {
            if (methodDesc && methodDesc.name) {
              const isStatic = methodDesc.refType === 2; // Static method

              const methodInfo: SymbolInfo = {
                name: methodDesc.name,
                kind: isStatic ? "static-method" : "method",
                type: methodDesc.return_type || methodDesc.returnType || "void",
                node: methodDesc.node,
                detail: this.getMethodSignature(methodDesc),
                documentation: methodDesc.description || "",
              };

              if (isStatic) {
                classInfo.staticMethods.push(methodInfo);
              } else {
                classInfo.methods.push(methodInfo);
              }
            }
          }
        } else {
          // Handle object with method names as keys
          for (const methodName in classDesc.methods) {
            const methodDesc = classDesc.methods[methodName];
            const isStatic = methodDesc.refType === 2; // Static method

            const methodInfo: SymbolInfo = {
              name: methodName,
              kind: isStatic ? "static-method" : "method",
              type: methodDesc.return_type || methodDesc.returnType || "void",
              node: methodDesc.node,
              detail: this.getMethodSignature(methodDesc),
              documentation: methodDesc.description || "",
            };

            if (isStatic) {
              classInfo.staticMethods.push(methodInfo);
            } else {
              classInfo.methods.push(methodInfo);
            }
          }
        }
      }

      // Extract properties from class description
      // Properties are stored in 'variables', not 'properties'
      if (classDesc.variables) {
        // Check if variables is an array or object
        if (Array.isArray(classDesc.variables)) {
          // Handle array of variable descriptors
          for (const propDesc of classDesc.variables) {
            if (propDesc && propDesc.name) {
              // Get type name - try getTypeName() method first
              let typeName = "any";
              if (typeof propDesc.getTypeName === "function") {
                try {
                  typeName = propDesc.getTypeName();
                } catch (e) {
                  // Fall back to other fields if getTypeName fails
                  typeName =
                    propDesc.type_name || propDesc.eval_type_name || "any";
                }
              } else if (propDesc.type_name) {
                typeName = propDesc.type_name;
              } else if (propDesc.eval_type_name) {
                typeName = propDesc.eval_type_name;
              }

              classInfo.properties.push({
                name: propDesc.name,
                kind: "property",
                type: typeName,
                node: propDesc.node,
                documentation: propDesc.description || "",
              });
            }
          }
        } else {
          // Handle object with variable names as keys
          for (const propName in classDesc.variables) {
            const propDesc = classDesc.variables[propName];

            // Get type name - try getTypeName() method first
            let typeName = "any";
            if (typeof propDesc.getTypeName === "function") {
              try {
                typeName = propDesc.getTypeName();
              } catch (e) {
                // Fall back to other fields if getTypeName fails
                typeName =
                  propDesc.type_name || propDesc.eval_type_name || "any";
              }
            } else if (propDesc.type_name) {
              typeName = propDesc.type_name;
            } else if (propDesc.eval_type_name) {
              typeName = propDesc.eval_type_name;
            }

            classInfo.properties.push({
              name: propName,
              kind: "property",
              type: typeName,
              node: propDesc.node,
              documentation: propDesc.description || "",
            });
          }
        }
      }

      classes.set(className, classInfo);
    }

    return classes;
  }

  /**
   * Get method signature for display
   */
  private getMethodSignature(methodDesc: any): string {
    const params = methodDesc.params || [];
    const paramStrs = params.map((p: any) => `${p.name}:${p.type || "any"}`);
    const returnType =
      methodDesc.return_type || methodDesc.returnType || "void";
    return `fn ${methodDesc.name}(${paramStrs.join(", ")}):${returnType}`;
  }

  /**
   * Get all defined enums from the compiler context
   */
  getDefinedEnums(): Map<string, SymbolInfo> {
    const enums = new Map<string, SymbolInfo>();

    if (!this.context.definedEnums) {
      return enums;
    }

    for (const enumName in this.context.definedEnums) {
      const enumDesc = this.context.definedEnums[enumName];

      enums.set(enumName, {
        name: enumName,
        kind: "enum",
        type: enumName,
        node: enumDesc.node,
        documentation: `Enum with ${enumDesc.cnt || 0} values`,
      });
    }

    return enums;
  }

  /**
   * Get local variables in scope at a given offset
   */
  getLocalVariablesAtOffset(offset: number): SymbolInfo[] {
    const variables: SymbolInfo[] = [];

    if (!this.context.localVariables) {
      return variables;
    }

    // The context's localVariables contains variables in the current scope
    for (const varName in this.context.localVariables) {
      const varDesc = this.context.localVariables[varName];

      variables.push({
        name: varName,
        kind: "variable",
        type: varDesc.type || varDesc.type_name || "any",
        node: varDesc.node,
      });
    }

    return variables;
  }

  /**
   * Find the node at a given offset in the source code
   */
  findNodeAtOffset(offset: number, node?: CodeNode): CodeNode | null {
    const currentNode = node || this.rootNode;

    if (!currentNode) return null;

    // Check if offset is within this node's range
    if (offset >= currentNode.sp && offset <= currentNode.ep) {
      // Check children first (most specific match)
      if (currentNode.children && currentNode.children.length > 0) {
        for (const child of currentNode.children) {
          const found = this.findNodeAtOffset(offset, child);
          if (found) return found;
        }
      }

      // If no child matched, this is the node
      return currentNode;
    }

    return null;
  }

  /**
   * Get the type of an expression at a given offset
   * Uses the compiler's eval_type_name which is filled after StartWalk
   */
  getTypeAtOffset(offset: number): string | null {
    const node = this.findNodeAtOffset(offset);
    if (!node) return null;

    // The compiler fills eval_type_name after type inference
    if (node.eval_type_name) {
      return node.eval_type_name;
    }

    // Fall back to declared type
    if (node.type_name) {
      return node.type_name;
    }

    return null;
  }

  /**
   * Get class members (methods and properties) for autocomplete
   */
  getClassMembers(className: string): SymbolInfo[] {
    const classes = this.getDefinedClasses();
    const classInfo = classes.get(className);

    if (!classInfo) return [];

    return [
      ...classInfo.methods,
      ...classInfo.staticMethods,
      ...classInfo.properties,
    ];
  }

  /**
   * Get the expression before a position (for member access completion)
   */
  getExpressionBeforePosition(offset: number): CodeNode | null {
    const node = this.findNodeAtOffset(offset - 1);
    return node;
  }

  /**
   * Get all symbols in scope at a given offset
   */
  getAllSymbolsInScope(offset: number): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];

    // Add classes
    const classes = this.getDefinedClasses();
    for (const [name, classInfo] of classes) {
      symbols.push({
        name,
        kind: "class",
        type: name,
        node: classInfo.node,
      });
    }

    // Add enums
    const enums = this.getDefinedEnums();
    for (const [name, enumInfo] of enums) {
      symbols.push(enumInfo);
    }

    // Add local variables
    const localVars = this.getLocalVariablesAtOffset(offset);
    symbols.push(...localVars);

    return symbols;
  }

  /**
   * Get compilation errors from the context
   */
  getCompilationErrors(): Array<{
    message: string;
    line: number;
    column: number;
    node?: CodeNode;
  }> {
    const errors: Array<{
      message: string;
      line: number;
      column: number;
      node?: CodeNode;
    }> = [];

    if (this.context.compilerErrors) {
      for (const error of this.context.compilerErrors) {
        errors.push({
          message: error.message || "Compilation error",
          line: error.line || 0,
          column: error.column || 0,
          node: error.node,
        });
      }
    }

    if (this.context.parserErrors) {
      for (const error of this.context.parserErrors) {
        errors.push({
          message: error.message || "Parse error",
          line: error.line || 0,
          column: error.column || 0,
          node: error.node,
        });
      }
    }

    return errors;
  }

  /**
   * Convert offset to line/character position
   */
  offsetToPosition(offset: number): { line: number; character: number } {
    const lines = this.code.split("\n");
    let currentOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length + 1; // +1 for newline

      if (currentOffset + lineLength > offset) {
        return {
          line,
          character: offset - currentOffset,
        };
      }

      currentOffset += lineLength;
    }

    return {
      line: lines.length - 1,
      character: lines[lines.length - 1]?.length || 0,
    };
  }

  /**
   * Check if we're in a method access context (after a '.')
   */
  isMethodAccessContext(offset: number): {
    isMethodAccess: boolean;
    targetType: string | null;
  } {
    // Look backwards in the code to find '.'
    const textBefore = this.code.substring(Math.max(0, offset - 20), offset);

    console.log(
      "[AST Analyzer] isMethodAccessContext, textBefore:",
      textBefore
    );

    if (textBefore.trim().endsWith(".")) {
      // Find the expression before the '.'
      const dotOffset = this.code.lastIndexOf(".", offset - 1);
      const exprNode = this.getExpressionBeforePosition(dotOffset);

      console.log("[AST Analyzer] Found expression node:", {
        hasNode: !!exprNode,
        vref: exprNode?.vref,
        eval_type_name: exprNode?.eval_type_name,
        type_name: exprNode?.type_name,
      });

      if (exprNode) {
        // First try to get type from compiler's type inference
        if (exprNode.eval_type_name) {
          console.log(
            "[AST Analyzer] Using eval_type_name:",
            exprNode.eval_type_name
          );
          return {
            isMethodAccess: true,
            targetType: exprNode.eval_type_name,
          };
        }

        // Fallback: try to infer type from code patterns
        const inferredType = this.inferTypeFromNode(exprNode);
        console.log("[AST Analyzer] Inferred type:", inferredType);
        if (inferredType) {
          return {
            isMethodAccess: true,
            targetType: inferredType,
          };
        }
      }
    }

    return { isMethodAccess: false, targetType: null };
  }

  /**
   * Fallback type inference when compiler analysis fails
   */
  private inferTypeFromNode(node: CodeNode): string | null {
    // If it's a variable reference, look for its definition
    if (node.vref) {
      const varName = node.vref;

      // Look backwards in the code for variable declaration
      const defPattern = new RegExp(
        `def\\s+${varName}\\s*\\(new\\s+(\\w+)\\)`,
        "g"
      );
      const match = defPattern.exec(this.code.substring(0, node.sp));
      if (match) {
        return match[1]; // Return the class name
      }

      // Also check for type annotations: def v:TypeName
      const typeAnnotPattern = new RegExp(
        `def\\s+${varName}\\s*:\\s*(\\w+)`,
        "g"
      );
      const typeMatch = typeAnnotPattern.exec(this.code.substring(0, node.sp));
      if (typeMatch) {
        return typeMatch[1];
      }
    }

    // If it has a type_name, use that
    if (node.type_name) {
      return node.type_name;
    }

    return null;
  }

  /**
   * Check if we're in a property access context (after '@')
   */
  isPropertyAccessContext(offset: number): boolean {
    const textBefore = this.code.substring(Math.max(0, offset - 2), offset);
    return textBefore.trim().startsWith("@");
  }

  /**
   * Get the current class context at a given offset
   */
  getCurrentClassContext(offset: number): string | null {
    // Look at the context's currentClassName
    if (this.context.currentClassName) {
      return this.context.currentClassName;
    }

    // Alternatively, traverse up the AST to find the enclosing class
    const node = this.findNodeAtOffset(offset);
    if (node) {
      return this.findEnclosingClass(node);
    }

    return null;
  }

  /**
   * Find the enclosing class for a node
   */
  private findEnclosingClass(node: CodeNode): string | null {
    // This would require tracking parent references in the tree
    // For now, return null - the context's currentClassName is more reliable
    return null;
  }

  /**
   * Get documentation for a symbol
   */
  getDocumentationForSymbol(symbolName: string): string | null {
    // Check classes
    const classes = this.getDefinedClasses();
    const classInfo = classes.get(symbolName);
    if (classInfo) {
      return `class ${symbolName}`;
    }

    // Check if it's a method in any class
    for (const [className, info] of classes) {
      const method = [...info.methods, ...info.staticMethods].find(
        (m) => m.name === symbolName
      );
      if (method) {
        return `${method.detail}\n\n${method.documentation}`;
      }
    }

    return null;
  }
}
