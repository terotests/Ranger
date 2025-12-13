/**
 * Introspection Test Helpers
 *
 * Provides utilities for testing the Ranger compiler's ability to
 * analyze source code and provide type/context information.
 *
 * Uses the module-format compiler output which exports all compiler classes.
 */

import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the module-format compiler from ranger-vscode-extension
const COMPILER_MODULE = path.join(
  __dirname,
  "../../ranger-vscode-extension/compiler/output.js"
);

// Import the compiler module
const compiler = require(COMPILER_MODULE);

// Re-export key classes for convenience
export const {
  VirtualCompiler,
  InputEnv,
  InputFSFolder,
  InputFSFile,
  CmdParams,
  RangerLispParser,
  SourceCode,
  CodeNode,
  RangerAppWriterContext,
  RangerAppClassDesc,
  RangerAppFunctionDesc,
  RangerAppParamDesc,
  RangerFlowParser,
  LiveCompiler,
  CodeWriter,
  RangerActiveOperators,
} = compiler;

/**
 * Result of compiling code for introspection
 */
export interface IntrospectionResult {
  success: boolean;
  context: any; // RangerAppWriterContext
  rootNode: any; // CodeNode
  errors: string[];

  // Convenience accessors
  getClasses(): Map<string, ClassInfo>;
  getClass(name: string): ClassInfo | undefined;
  getEnums(): Map<string, EnumInfo>;
  getVariablesInScope(className: string, methodName: string): VariableInfo[];
  getOperatorsForType(typeName: string): OperatorInfo[];
}

export interface ClassInfo {
  name: string;
  node: any;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  staticMethods: MethodInfo[];
  parentClass?: string;
  isSystemClass: boolean;
}

export interface PropertyInfo {
  name: string;
  typeName: string;
  isOptional: boolean;
  node: any;
}

export interface MethodInfo {
  name: string;
  returnType: string;
  parameters: ParameterInfo[];
  isStatic: boolean;
  node: any;
  fnCtx: any; // The method's context (RangerAppWriterContext)
}

export interface ParameterInfo {
  name: string;
  typeName: string;
  isOptional: boolean;
}

export interface VariableInfo {
  name: string;
  typeName: string;
  evalTypeName: string;
  isOptional: boolean;
  isMutable: boolean;
  node: any;
}

export interface EnumInfo {
  name: string;
  values: string[];
}

export interface OperatorInfo {
  name: string;
  returnType: string;
  parameters: string[];
}

/**
 * Load required compiler library files
 */
function loadCompilerLibraries(): { [key: string]: string } {
  const rootDir = path.join(__dirname, "../..");
  const compilerDir = path.join(rootDir, "compiler");
  const libDir = path.join(rootDir, "lib");

  return {
    "Lang.clj": fs.readFileSync(path.join(compilerDir, "Lang.clj"), "utf8"),
    "stdlib.clj": fs.readFileSync(path.join(libDir, "stdlib.clj"), "utf8"),
    "stdops.clj": fs.readFileSync(path.join(libDir, "stdops.clj"), "utf8"),
    "JSON.clj": fs.readFileSync(path.join(libDir, "JSON.clj"), "utf8"),
  };
}

// Cache libraries to avoid repeated disk reads
let cachedLibraries: { [key: string]: string } | null = null;

function getLibraries(): { [key: string]: string } {
  if (!cachedLibraries) {
    cachedLibraries = loadCompilerLibraries();
  }
  return cachedLibraries;
}

/**
 * Compile Ranger source code and return introspection results
 *
 * This runs the full compilation pipeline (CollectMethods + WalkNode)
 * to populate all type information in the context.
 */
export async function compileForIntrospection(
  sourceCode: string,
  filename: string = "test.clj"
): Promise<IntrospectionResult> {
  const errors: string[] = [];

  try {
    // Create input environment
    const env = new InputEnv();
    env.use_real = false;

    // Create virtual filesystem
    const folder = new InputFSFolder();
    const addFile = (name: string, contents: string) => {
      const newFile = new InputFSFile();
      newFile.name = name;
      newFile.data = contents;
      folder.files.push(newFile);
    };

    // Add source code
    addFile(filename, sourceCode);

    // Add required compiler libraries
    const libs = getLibraries();
    for (const [name, content] of Object.entries(libs)) {
      addFile(name, content);
    }

    env.filesystem = folder;

    // Set compiler parameters
    const params = new CmdParams();
    params.params["l"] = "es6";
    params.params["o"] = "output.js";
    params.values.push(filename);
    env.commandLine = params;

    // Run compilation
    const vComp = new VirtualCompiler();
    const result = await vComp.run(env);

    if (result.hasErrors) {
      errors.push(result.errorMessage || "Compilation failed");
    }

    // Collect any compiler errors from context
    if (result.ctx?.compilerErrors) {
      for (const err of result.ctx.compilerErrors) {
        errors.push(err.description || err.message || "Unknown error");
      }
    }

    // Build a synthetic root node from the class definitions
    // This gives us access to AST positions for type queries
    let rootNode: any = null;
    if (result.ctx?.definedClasses) {
      const syntheticRoot: any = {
        sp: 0,
        ep: sourceCode.length,
        children: [],
        vref: "root",
        code: sourceCode,
      };

      // Add all class nodes as children
      for (const className in result.ctx.definedClasses) {
        const classDesc = result.ctx.definedClasses[className];
        if (classDesc.node) {
          syntheticRoot.children.push(classDesc.node);
        }
      }

      if (syntheticRoot.children.length > 0) {
        rootNode = syntheticRoot;
      }
    }

    return createIntrospectionResult(
      !result.hasErrors && errors.length === 0,
      result.ctx,
      rootNode,
      errors
    );
  } catch (error: any) {
    errors.push(error.message || "Unknown error");
    return createIntrospectionResult(false, null, null, errors);
  }
}

/**
 * Parse source code without full compilation (faster, but no type inference)
 */
export function parseOnly(
  sourceCode: string,
  filename: string = "test.clj"
): {
  success: boolean;
  rootNode: any;
  errors: string[];
} {
  try {
    const code = new SourceCode(sourceCode);
    code.filename = filename;
    const parser = new RangerLispParser(code);
    parser.parse();

    return {
      success: true,
      rootNode: parser.rootNode,
      errors: [],
    };
  } catch (error: any) {
    return {
      success: false,
      rootNode: null,
      errors: [error.message || "Parse error"],
    };
  }
}

/**
 * Create the introspection result with convenience methods
 */
function createIntrospectionResult(
  success: boolean,
  context: any,
  rootNode: any,
  errors: string[]
): IntrospectionResult {
  return {
    success,
    context,
    rootNode,
    errors,

    getClasses(): Map<string, ClassInfo> {
      const classes = new Map<string, ClassInfo>();
      if (!context?.definedClasses) return classes;

      const classNames =
        context.definedClassList || Object.keys(context.definedClasses);
      for (const className of classNames) {
        const classDesc = context.definedClasses[className];
        if (!classDesc) continue;

        classes.set(className, extractClassInfo(classDesc));
      }
      return classes;
    },

    getClass(name: string): ClassInfo | undefined {
      if (!context?.definedClasses?.[name]) return undefined;
      return extractClassInfo(context.definedClasses[name]);
    },

    getEnums(): Map<string, EnumInfo> {
      const enums = new Map<string, EnumInfo>();
      if (!context?.definedEnums) return enums;

      for (const enumName in context.definedEnums) {
        const enumDesc = context.definedEnums[enumName];
        enums.set(enumName, {
          name: enumName,
          values: Object.keys(enumDesc.values || {}),
        });
      }
      return enums;
    },

    getVariablesInScope(className: string, methodName: string): VariableInfo[] {
      const variables: VariableInfo[] = [];
      if (!context?.definedClasses?.[className]) return variables;

      const classDesc = context.definedClasses[className];
      const methodDesc =
        classDesc.methods?.[methodName] ||
        findMethodInVariants(classDesc, methodName);

      if (!methodDesc?.fnCtx) return variables;

      const fnCtx = methodDesc.fnCtx;
      const varNames = fnCtx.localVarNames || [];

      for (const varName of varNames) {
        const varDesc = fnCtx.localVariables?.[varName];
        if (!varDesc) continue;

        variables.push({
          name: varName,
          typeName:
            varDesc.type_name || varDesc.nameNode?.type_name || "unknown",
          evalTypeName: varDesc.nameNode?.eval_type_name || "",
          isOptional: varDesc.is_optional || false,
          isMutable: varDesc.nameNode?.hasFlag?.("mutable") || false,
          node: varDesc.node,
        });
      }

      return variables;
    },

    getOperatorsForType(typeName: string): OperatorInfo[] {
      const operators: OperatorInfo[] = [];
      if (!context?.operators) return operators;

      // Get operators that work with this type
      // This is a simplified version - full implementation would check type matching
      const ops = context.operators;
      if (ops.op_index) {
        for (const opName in ops.op_index) {
          const opList = ops.op_index[opName];
          if (opList?.items) {
            for (const op of opList.items) {
              operators.push({
                name: opName,
                returnType: op.returnType || "unknown",
                parameters: [], // Would need to extract from op definition
              });
            }
          }
        }
      }

      return operators;
    },
  };
}

/**
 * Extract class information from a RangerAppClassDesc
 */
function extractClassInfo(classDesc: any): ClassInfo {
  const properties: PropertyInfo[] = [];
  const methods: MethodInfo[] = [];
  const staticMethods: MethodInfo[] = [];

  // Extract properties (stored in 'variables' as an array)
  if (classDesc.variables && Array.isArray(classDesc.variables)) {
    for (const varDesc of classDesc.variables) {
      properties.push({
        name: varDesc.name,
        typeName: getTypeName(varDesc),
        isOptional: varDesc.is_optional || false,
        node: varDesc.node,
      });
    }
  }

  // Extract methods from method_variants (which is the actual storage)
  if (classDesc.method_variants) {
    for (const methodName in classDesc.method_variants) {
      const methodVariants = classDesc.method_variants[methodName];
      if (methodVariants?.variants && methodVariants.variants.length > 0) {
        const methodDesc = methodVariants.variants[0]; // Take first variant
        methods.push(extractMethodInfo(methodDesc, false));
      }
    }
  }

  // Extract static methods (stored as array)
  if (classDesc.static_methods && Array.isArray(classDesc.static_methods)) {
    for (const methodDesc of classDesc.static_methods) {
      staticMethods.push(extractMethodInfo(methodDesc, true));
    }
  }

  // Get parent class from extends_classes array
  let parentClass: string | undefined;
  if (classDesc.extends_classes && classDesc.extends_classes.length > 0) {
    parentClass = classDesc.extends_classes[0];
  }

  return {
    name: classDesc.name,
    node: classDesc.classNode || classDesc.node,
    properties,
    methods,
    staticMethods,
    parentClass,
    isSystemClass: classDesc.is_system || false,
  };
}

/**
 * Extract method information from a RangerAppFunctionDesc
 */
function extractMethodInfo(methodDesc: any, isStatic: boolean): MethodInfo {
  const parameters: ParameterInfo[] = [];

  if (methodDesc.params) {
    for (const param of methodDesc.params) {
      parameters.push({
        name: param.name,
        typeName: getTypeName(param),
        isOptional: param.is_optional || false,
      });
    }
  }

  return {
    name: methodDesc.name,
    returnType:
      methodDesc.nameNode?.type_name || methodDesc.return_type || "void",
    parameters,
    isStatic,
    node: methodDesc.node,
    fnCtx: methodDesc.fnCtx,
  };
}

/**
 * Get type name from a parameter or variable descriptor
 */
function getTypeName(desc: any): string {
  // First check if nameNode has type information
  if (desc.nameNode) {
    const nn = desc.nameNode;

    // Check for basic type_name on nameNode first (most reliable)
    if (
      nn.type_name &&
      typeof nn.type_name === "string" &&
      !nn.type_name.startsWith("[")
    ) {
      // Simple type like string, int, double, etc.
      return nn.type_name;
    }

    // For arrays, look at array_type
    if (nn.value_type === 4 /* Array */ || nn.eval_type === 4 /* Array */) {
      return `[${nn.array_type || "unknown"}]`;
    }

    // For hash maps, look at key_type and array_type
    if (nn.value_type === 5 /* Hash */ || nn.eval_type === 5 /* Hash */) {
      return `[${nn.key_type || "string"}:${nn.array_type || "unknown"}]`;
    }

    // Check for type_name (might include array notation)
    if (nn.type_name) {
      return nn.type_name;
    }

    // Then check eval_type_name
    if (nn.eval_type_name) {
      return nn.eval_type_name;
    }
  }

  // Check for value_type on the descriptor itself
  if (desc.value_type === 4 /* Array */) {
    // Try to get array type from node if available
    if (desc.node?.children?.[1]?.array_type) {
      return `[${desc.node.children[1].array_type}]`;
    }
    return "[unknown]";
  }

  if (desc.value_type === 5 /* Hash */) {
    if (desc.node?.children?.[1]) {
      const defNode = desc.node.children[1];
      return `[${defNode.key_type || "string"}:${
        defNode.array_type || "unknown"
      }]`;
    }
    return "[string:unknown]";
  }

  // Fall back to descriptor's own type info
  if (typeof desc.getTypeName === "function") {
    try {
      return desc.getTypeName();
    } catch {
      // Fall through
    }
  }

  // Check type_name directly on desc
  if (desc.type_name) {
    return desc.type_name;
  }

  return "";
}

/**
 * Find a method in class method variants
 */
function findMethodInVariants(classDesc: any, methodName: string): any {
  if (!classDesc.method_variants) return null;

  const variants = classDesc.method_variants[methodName];
  if (variants?.variants?.length > 0) {
    return variants.variants[0];
  }
  return null;
}

/**
 * Find a CodeNode at a specific offset in the AST
 */
export function findNodeAtOffset(rootNode: any, offset: number): any | null {
  if (!rootNode) return null;

  function search(node: any): any | null {
    if (offset < node.sp || offset > node.ep) {
      return null;
    }

    // Check children first (most specific match)
    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }

    // This node contains the offset
    return node;
  }

  return search(rootNode);
}

/**
 * Get the enclosing function node for a given offset
 */
export function findEnclosingFunction(
  rootNode: any,
  offset: number
): any | null {
  if (!rootNode) return null;

  function search(node: any): any | null {
    if (offset < node.sp || offset > node.ep) {
      return null;
    }

    // Check if this is a function node
    if (
      node.vref === "fn" ||
      node.vref === "sfn" ||
      node.vref === "Constructor"
    ) {
      // Check if any child function contains the offset
      if (node.children) {
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
      }
      return node;
    }

    // Search children
    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }

    return null;
  }

  return search(rootNode);
}

/**
 * Information about a type at a specific position
 */
export interface TypeAtPositionInfo {
  /** The node found at this position */
  node: any | null;
  /** The type name (declared type) */
  typeName: string;
  /** The evaluated/inferred type name */
  evalTypeName: string;
  /** The value reference (variable name, operator, etc.) */
  vref: string;
  /** The node kind/type */
  nodeType: string;
  /** Whether this is an expression */
  isExpression: boolean;
  /** The source text at this position */
  sourceText: string;
  /** Start position (offset) */
  startOffset: number;
  /** End position (offset) */
  endOffset: number;
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column: number;
  /** Parent node info if available */
  parentInfo?: {
    vref: string;
    typeName: string;
  };
  /** Array element type if this is an array */
  arrayType?: string;
  /** Hash key type if this is a hash */
  keyType?: string;
}

/**
 * Convert line and column (1-based) to character offset in source code
 */
export function lineColumnToOffset(
  sourceCode: string,
  line: number,
  column: number
): number {
  const lines = sourceCode.split("\n");
  let offset = 0;

  // Add lengths of all previous lines (including newline characters)
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }

  // Add the column offset (convert from 1-based to 0-based)
  offset += column - 1;

  return offset;
}

/**
 * Convert character offset to line and column (1-based)
 */
export function offsetToLineColumn(
  sourceCode: string,
  offset: number
): { line: number; column: number } {
  const lines = sourceCode.split("\n");
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1; // +1 for newline
    if (currentOffset + lineLength > offset) {
      return {
        line: i + 1, // 1-based
        column: offset - currentOffset + 1, // 1-based
      };
    }
    currentOffset += lineLength;
  }

  // If offset is beyond the source, return last position
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

/**
 * Get type information at a specific line and column position
 * Lines and columns are 1-based (like in editors)
 */
export function getTypeAtPosition(
  rootNode: any,
  sourceCode: string,
  line: number,
  column: number
): TypeAtPositionInfo {
  const offset = lineColumnToOffset(sourceCode, line, column);
  return getTypeAtOffset(rootNode, sourceCode, offset, line, column);
}

/**
 * Get type information at a specific character offset
 */
export function getTypeAtOffset(
  rootNode: any,
  sourceCode: string,
  offset: number,
  line?: number,
  column?: number
): TypeAtPositionInfo {
  // Calculate line/column if not provided
  if (line === undefined || column === undefined) {
    const pos = offsetToLineColumn(sourceCode, offset);
    line = pos.line;
    column = pos.column;
  }

  const node = findNodeAtOffset(rootNode, offset);

  if (!node) {
    return {
      node: null,
      typeName: "",
      evalTypeName: "",
      vref: "",
      nodeType: "unknown",
      isExpression: false,
      sourceText: "",
      startOffset: offset,
      endOffset: offset,
      line,
      column,
    };
  }

  // Extract source text for this node
  const sourceText =
    node.sp !== undefined && node.ep !== undefined
      ? sourceCode.substring(node.sp, node.ep + 1)
      : "";

  // Determine node type description
  let nodeType = "unknown";
  if (node.expression) nodeType = "expression";
  if (node.vref) {
    if (node.vref === "def") nodeType = "variable_definition";
    else if (node.vref === "class") nodeType = "class_definition";
    else if (node.vref === "fn") nodeType = "function_definition";
    else if (node.vref === "sfn") nodeType = "static_function_definition";
    else if (node.vref === "if") nodeType = "if_statement";
    else if (node.vref === "return") nodeType = "return_statement";
    else if (node.vref === "new") nodeType = "new_expression";
    else if (node.vref === "Constructor") nodeType = "constructor";
    else nodeType = "reference";
  }
  if (node.string_value !== undefined) nodeType = "string_literal";
  if (node.int_value !== undefined) nodeType = "int_literal";
  if (node.double_value !== undefined) nodeType = "double_literal";

  // Find parent node for context
  let parentInfo: { vref: string; typeName: string } | undefined;
  if (node.parent) {
    parentInfo = {
      vref: node.parent.vref || "",
      typeName: node.parent.type_name || node.parent.eval_type_name || "",
    };
  }

  return {
    node,
    typeName: node.type_name || "",
    evalTypeName: node.eval_type_name || "",
    vref: node.vref || "",
    nodeType,
    isExpression: node.expression || false,
    sourceText,
    startOffset: node.sp || offset,
    endOffset: node.ep || offset,
    line,
    column,
    parentInfo,
    arrayType: node.array_type,
    keyType: node.key_type,
  };
}

/**
 * Get all nodes with type information in the source code
 * Useful for understanding what types exist where
 */
export function getAllTypedNodes(
  rootNode: any,
  sourceCode: string
): TypeAtPositionInfo[] {
  const results: TypeAtPositionInfo[] = [];

  function visit(node: any) {
    if (!node) return;

    // Only include nodes that have type information
    if (node.type_name || node.eval_type_name || node.vref) {
      const pos = offsetToLineColumn(sourceCode, node.sp || 0);
      results.push(
        getTypeAtOffset(
          rootNode,
          sourceCode,
          node.sp || 0,
          pos.line,
          pos.column
        )
      );
    }

    // Visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  visit(rootNode);
  return results;
}

/**
 * Get a formatted string showing type information at each line
 * Useful for debugging and understanding compiler behavior
 */
export function formatTypeMap(rootNode: any, sourceCode: string): string {
  const lines = sourceCode.split("\n");
  const output: string[] = [];

  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const line = lines[lineNum - 1];
    output.push(`${lineNum.toString().padStart(3)}: ${line}`);

    // Find all typed nodes on this line
    const nodesOnLine: TypeAtPositionInfo[] = [];
    for (let col = 1; col <= line.length; col++) {
      const info = getTypeAtPosition(rootNode, sourceCode, lineNum, col);
      if (
        info.node &&
        (info.typeName || info.evalTypeName) &&
        !nodesOnLine.some(
          (n) =>
            n.startOffset === info.startOffset && n.endOffset === info.endOffset
        )
      ) {
        nodesOnLine.push(info);
      }
    }

    // Add type annotations below the line
    for (const nodeInfo of nodesOnLine) {
      const colInLine = nodeInfo.column;
      const typeStr = nodeInfo.evalTypeName || nodeInfo.typeName;
      if (typeStr) {
        const padding = " ".repeat(5 + colInLine - 1);
        const marker = "^".repeat(
          Math.max(1, nodeInfo.endOffset - nodeInfo.startOffset + 1)
        );
        output.push(`${padding}${marker} ${nodeInfo.vref}: ${typeStr}`);
      }
    }
  }

  return output.join("\n");
}

/**
 * Extended type information that includes class details if the type is a class
 */
export interface TypeWithClassInfo extends TypeAtPositionInfo {
  /** If the type is a class, this contains the class information */
  classInfo?: ClassInfo;
  /** Property names available on this type */
  availableProperties: string[];
  /** Method names available on this type */
  availableMethods: string[];
}

/**
 * Get type at position with full class information if applicable
 * This combines position-based lookup with class introspection
 */
export function getTypeWithClassInfo(
  result: IntrospectionResult,
  sourceCode: string,
  line: number,
  column: number
): TypeWithClassInfo {
  const typeInfo = getTypeAtPosition(result.rootNode, sourceCode, line, column);

  // Determine the type name to look up
  const typeName = typeInfo.evalTypeName || typeInfo.typeName;

  // Try to get class info for this type
  let classInfo: ClassInfo | undefined;
  let availableProperties: string[] = [];
  let availableMethods: string[] = [];

  if (typeName) {
    classInfo = result.getClass(typeName);
    if (classInfo) {
      availableProperties = classInfo.properties.map((p) => p.name);
      availableMethods = [
        ...classInfo.methods.map((m) => m.name),
        ...classInfo.staticMethods.map((m) => m.name),
      ];
    }
  }

  return {
    ...typeInfo,
    classInfo,
    availableProperties,
    availableMethods,
  };
}

/**
 * Check if a class has a property with a specific name and optional type
 */
export function classHasProperty(
  result: IntrospectionResult,
  className: string,
  propertyName: string,
  expectedType?: string
): boolean {
  const classInfo = result.getClass(className);
  if (!classInfo) return false;

  const prop = classInfo.properties.find((p) => p.name === propertyName);
  if (!prop) return false;

  if (expectedType !== undefined) {
    return prop.typeName === expectedType;
  }

  return true;
}

/**
 * Check if a class has a method with a specific name and optional return type
 */
export function classHasMethod(
  result: IntrospectionResult,
  className: string,
  methodName: string,
  expectedReturnType?: string
): boolean {
  const classInfo = result.getClass(className);
  if (!classInfo) return false;

  const method =
    classInfo.methods.find((m) => m.name === methodName) ||
    classInfo.staticMethods.find((m) => m.name === methodName);
  if (!method) return false;

  if (expectedReturnType !== undefined) {
    return method.returnType === expectedReturnType;
  }

  return true;
}

/**
 * Get all property names and types for a class
 */
export function getClassProperties(
  result: IntrospectionResult,
  className: string
): Array<{ name: string; type: string; isOptional: boolean }> {
  const classInfo = result.getClass(className);
  if (!classInfo) return [];

  return classInfo.properties.map((p) => ({
    name: p.name,
    type: p.typeName,
    isOptional: p.isOptional,
  }));
}

/**
 * Get all method signatures for a class
 */
export function getClassMethods(
  result: IntrospectionResult,
  className: string
): Array<{
  name: string;
  returnType: string;
  params: string[];
  isStatic: boolean;
}> {
  const classInfo = result.getClass(className);
  if (!classInfo) return [];

  const methods = [
    ...classInfo.methods.map((m) => ({
      name: m.name,
      returnType: m.returnType,
      params: m.parameters.map((p) => `${p.name}:${p.typeName}`),
      isStatic: false,
    })),
    ...classInfo.staticMethods.map((m) => ({
      name: m.name,
      returnType: m.returnType,
      params: m.parameters.map((p) => `${p.name}:${p.typeName}`),
      isStatic: true,
    })),
  ];

  return methods;
}
