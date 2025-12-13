/**
 * Ranger Compiler Integration
 *
 * Wrapper around the real Ranger compiler (bin/output.js) to provide
 * parsing and analysis capabilities for the language server.
 */

// Import the compiled Ranger compiler
const rangerCompiler = require("../../compiler/output.js");

// Debug flag - set RANGER_DEBUG=true to enable verbose logging
const DEBUG = process.env.RANGER_DEBUG === 'true';

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[Ranger Compiler]', ...args);
  }
}

// Cache of last successful compilations per file
interface SuccessfulCompilation {
  code: string;
  rootNode: CodeNode | null;
  context: any | null;
  timestamp: number;
}

const compilationCache: Map<string, SuccessfulCompilation> = new Map();
const MAX_CACHE_SIZE = 10;

/**
 * Update compilation cache with LRU eviction
 */
function updateCompilationCache(filename: string, entry: SuccessfulCompilation) {
  // Evict oldest entry if at capacity
  if (compilationCache.size >= MAX_CACHE_SIZE && !compilationCache.has(filename)) {
    let oldest = { key: '', time: Date.now() };
    for (const [key, value] of compilationCache) {
      if (value.timestamp < oldest.time) {
        oldest = { key, time: value.timestamp };
      }
    }
    if (oldest.key) {
      compilationCache.delete(oldest.key);
      debugLog('Evicted oldest cache entry:', oldest.key);
    }
  }
  compilationCache.set(filename, entry);
}

/**
 * Clear compilation cache for a specific file (call on document close)
 */
export function clearCompilationCache(filename: string) {
  compilationCache.delete(filename);
  debugLog('Cleared cache for:', filename);
}

// Cache for Lang.clj content to avoid repeated disk reads
let cachedLangClj: string | null = null;
let cachedStdLibs: { [key: string]: string } = {};

/**
 * Check if new code has significant common prefix with cached code
 * This helps determine if cached compilation results are still relevant
 */
function hasCommonPrefix(newCode: string, cachedCode: string): boolean {
  const minLen = Math.min(newCode.length, cachedCode.length);
  if (minLen === 0) return false;

  let matchLen = 0;
  for (let i = 0; i < minLen; i++) {
    if (newCode[i] === cachedCode[i]) {
      matchLen++;
    } else {
      break;
    }
  }

  // If at least 80% of the smaller code matches, consider it similar
  const similarity = matchLen / minLen;
  return similarity >= 0.8;
}

/**
 * Calculate line and column from character offset in code
 */
function offsetToLineColumn(
  code: string,
  offset: number
): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Analyze code differences to provide contextual error hints
 * Compares cached (working) code with current (broken) code
 */
function findCodeDifference(
  cachedCode: string,
  currentCode: string
): { context: string; hint: string; line: number; column: number } | null {
  try {
    // Find first difference
    let firstDiff = 0;
    const minLen = Math.min(cachedCode.length, currentCode.length);
    for (let i = 0; i < minLen; i++) {
      if (cachedCode[i] !== currentCode[i]) {
        firstDiff = i;
        break;
      }
    }

    // If codes are identical up to min length, the difference is at the end
    if (firstDiff === 0 && cachedCode.length !== currentCode.length) {
      firstDiff = minLen;
    }

    // Calculate line and column from offset
    const position = offsetToLineColumn(currentCode, firstDiff);

    // Extract context around the change (50 chars before and after)
    const contextStart = Math.max(0, firstDiff - 50);
    const contextEnd = Math.min(currentCode.length, firstDiff + 50);
    const context = currentCode.substring(contextStart, contextEnd).trim();

    console.log(
      "[Ranger Compiler] Difference at offset:",
      firstDiff,
      "line:",
      position.line,
      "column:",
      position.column
    );
    console.log("[Ranger Compiler] Context:", context);

    // Analyze the context to provide hints
    let hint = "Check for syntax errors or type mismatches";

    // Check if inside function call (has opening paren before and closing paren after)
    const beforeContext = currentCode.substring(
      Math.max(0, firstDiff - 100),
      firstDiff
    );
    const afterContext = currentCode.substring(
      firstDiff,
      Math.min(currentCode.length, firstDiff + 100)
    );

    // Look for pattern: methodName( with possible dot notation before it
    const functionCallMatch = beforeContext.match(/([\w\.]+)\s*\(\s*[^)]*$/);
    if (functionCallMatch) {
      const functionName = functionCallMatch[1];
      const methodName = functionName.includes(".")
        ? functionName.split(".").pop()
        : functionName;
      hint = `Check parameters for method '${methodName}' - verify types match expected signature`;

      // Check if there's a string literal in the after context
      if (afterContext.match(/^[^)]*["'][^"']*["']/)) {
        hint += ". Note: string literal found, check if numeric type expected";
      }
    }

    // Check for incomplete expressions
    if (
      currentCode
        .substring(firstDiff, Math.min(currentCode.length, firstDiff + 10))
        .match(/^\s*$/)
    ) {
      hint =
        "Incomplete expression - check for missing closing parentheses or semicolons";
    }

    return { context, hint, line: position.line, column: position.column };
  } catch (e) {
    console.error("[Ranger Compiler] Error analyzing code difference:", e);
    return null;
  }
}

export interface CodeNode {
  sp: number; // Start position
  ep: number; // End position
  row: number; // Row number
  col: number; // Column number
  vref: string; // Variable reference / keyword
  type_name: string; // Type name annotation
  type_type: string; // Type of type
  eval_type_name: string; // Evaluated type name
  value_type: number; // Value type enum
  ref_type: number; // Reference type enum
  children: CodeNode[]; // Child nodes
  props: { [key: string]: any }; // Properties
  code: string; // Source code
  string_value: string; // String literal value
  int_value: number; // Integer literal value
  double_value: number; // Double literal value
  boolean_value: boolean; // Boolean literal value
  has_operator: boolean; // Has operator
  is_array_literal: boolean; // Is array literal
  is_system_class: boolean; // Is system class
  has_lambda: boolean; // Has lambda
  has_call: boolean; // Has function call

  // Methods
  getChild(index: number): CodeNode | undefined;
  childCnt(): number;
  chlen(): number;
  forTree(
    callback: (node: CodeNode, index: number) => Promise<void>
  ): Promise<void>;
  hasBooleanProperty(name: string): boolean;
  getSecond(): CodeNode | undefined;
}

export interface RangerCompilerAPI {
  CodeNode: any;
  CodeNodeLiteral: any;
  VirtualCompiler: any;
  InputEnv: any;
  InputFSFolder: any;
  InputFSFile: any;
  RangerFlowParser: any;
  CmdParams: any;
  CompilerInterface: any;
  Context: any;
}

/**
 * Get the Ranger compiler API
 */
export function getRangerCompiler(): RangerCompilerAPI {
  return {
    CodeNode: rangerCompiler.CodeNode,
    CodeNodeLiteral: rangerCompiler.CodeNodeLiteral,
    VirtualCompiler: rangerCompiler.VirtualCompiler,
    InputEnv: rangerCompiler.InputEnv,
    InputFSFolder: rangerCompiler.InputFSFolder,
    InputFSFile: rangerCompiler.InputFSFile,
    RangerFlowParser: rangerCompiler.RangerFlowParser,
    CmdParams: rangerCompiler.CmdParams,
    CompilerInterface: rangerCompiler.CompilerInterface,
    Context: rangerCompiler.Context,
  };
}

/**
 * Parse Ranger source code and return the AST with type information
 *
 * This function uses VirtualCompiler to properly initialize the compiler
 * with Lang.clj and standard libraries, then runs the two-pass compilation.
 */
export async function parseRangerCode(
  code: string,
  filename: string = "input.rgr"
): Promise<{
  rootNode: CodeNode | null;
  context: any | null;
  errors: Array<{ message: string; line: number; column: number }>;
}> {
  try {
    const fs = require("fs");
    const path = require("path");

    // Create input environment like the README example
    const InputEnv = require("../../compiler/output.js").InputEnv;
    const InputFSFolder = require("../../compiler/output.js").InputFSFolder;
    const InputFSFile = require("../../compiler/output.js").InputFSFile;
    const CmdParams = require("../../compiler/output.js").CmdParams;
    const VirtualCompiler = require("../../compiler/output.js").VirtualCompiler;

    const compilerInput = new InputEnv();
    compilerInput.use_real = false;

    // Create virtual filesystem
    const folder = new InputFSFolder();
    const addFile = (name: string, contents: string) => {
      const newFile = new InputFSFile();
      newFile.name = name;
      newFile.data = contents;
      folder.files.push(newFile);
    };

    // Add the user's code
    addFile(filename, code);

    // Load required compiler files (Lang.clj and standard libraries) - with caching
    const compilerRoot = path.join(__dirname, "../../..");
    try {
      // Cache Lang.clj to avoid repeated disk reads
      if (cachedLangClj === null) {
        cachedLangClj = fs.readFileSync(path.join(compilerRoot, "compiler/Lang.clj"), "utf8");
        debugLog("Loaded and cached Lang.clj");
      }
      addFile("Lang.clj", cachedLangClj!);

      // Try to load standard libraries if they exist (with caching)
      try {
        if (!cachedStdLibs['stdlib.clj']) {
          cachedStdLibs['stdlib.clj'] = fs.readFileSync(path.join(compilerRoot, "lib/stdlib.clj"), "utf8");
          cachedStdLibs['stdops.clj'] = fs.readFileSync(path.join(compilerRoot, "lib/stdops.clj"), "utf8");
          cachedStdLibs['JSON.clj'] = fs.readFileSync(path.join(compilerRoot, "lib/JSON.clj"), "utf8");
          debugLog("Loaded and cached standard libraries");
        }
        addFile("stdlib.clj", cachedStdLibs['stdlib.clj']);
        addFile("stdops.clj", cachedStdLibs['stdops.clj']);
        addFile("JSON.clj", cachedStdLibs['JSON.clj']);
      } catch (libError) {
        debugLog("Standard libraries not loaded (optional)");
      }
    } catch (langError: any) {
      console.error(
        "[Ranger Compiler] Failed to load Lang.clj:",
        langError.message
      );
      return {
        rootNode: null,
        context: null,
        errors: [
          {
            message: "Failed to load Lang.clj: " + langError.message,
            line: 0,
            column: 0,
          },
        ],
      };
    }

    compilerInput.filesystem = folder;

    // Set compiler parameters for ES6 (for LSP we just need type analysis)
    const params = new CmdParams();
    params.params["l"] = "es6";
    params.params["o"] = "output.js";
    params.values.push(filename);
    compilerInput.commandLine = params;

    // Run the virtual compiler
    debugLog("Running VirtualCompiler...");
    const vComp = new VirtualCompiler();

    let res;
    try {
      res = await vComp.run(compilerInput);
    } catch (compileError: any) {
      debugLog("VirtualCompiler exception:", compileError.message);

      // Strategy: Check if we have a cached successful compilation
      const cached = compilationCache.get(filename);
      if (cached && hasCommonPrefix(code, cached.code)) {
        debugLog("Using cached compilation (code has common prefix)");
        debugLog("Cache age:", Date.now() - cached.timestamp, "ms");
        // Return cached results - they're still relevant for the unchanged parts
        return {
          rootNode: cached.rootNode,
          context: cached.context,
          errors: [
            {
              message: "Using cached compilation due to incomplete code",
              line: 0,
              column: 0,
            },
          ],
        };
      }

      // No cache or code too different - return error
      debugLog("No usable cache available");
      return {
        rootNode: null,
        context: null,
        errors: [
          {
            message:
              "Compilation failed: " +
              (compileError.message || "Internal compiler error"),
            line: 0,
            column: 0,
          },
        ],
      };
    }

    if (!res || !res.ctx) {
      return {
        rootNode: null,
        context: null,
        errors: [
          {
            message: "Compiler failed to create context",
            line: 0,
            column: 0,
          },
        ],
      };
    }

    // Check if the compiler returned errors (VirtualCompiler now sets hasErrors instead of calling exit)
    if (res.hasErrors) {
      console.log(
        "[Ranger Compiler] Compilation had errors:",
        res.errorMessage || "Unknown error"
      );

      // Strategy: Check if we have a cached successful compilation
      const cached = compilationCache.get(filename);
      if (cached) {
        // Use cache if code length difference is small (within 50 characters)
        // This handles cases like typing "v." at the end for autocomplete
        const lengthDiff = Math.abs(code.length - cached.code.length);
        const shouldUseCache = lengthDiff <= 50;

        debugLog("Cache check - has cached:", !!cached);
        debugLog("Code length:", code.length, "Cached length:", cached.code.length, "Diff:", lengthDiff);
        debugLog("Should use cache:", shouldUseCache);

        if (shouldUseCache) {
          debugLog("Using cached compilation due to compilation errors");
          debugLog("Cache age:", Date.now() - cached.timestamp, "ms");

          // Try to provide a better error message by analyzing what changed
          let errorMsg = res.errorMessage || "Compilation errors detected";
          let errorLine = 0;
          let errorColumn = 0;

          // Find where the code differs
          const changeInfo = findCodeDifference(cached.code, code);
          if (changeInfo) {
            debugLog("Change detected at:", changeInfo);
            errorLine = changeInfo.line;
            errorColumn = changeInfo.column;
            // Add hint about what might be wrong
            errorMsg = `${changeInfo.hint}\n\nContext: "${changeInfo.context}"`;
          }

          // Return cached results - they're still relevant for the unchanged parts
          return {
            rootNode: cached.rootNode,
            context: cached.context,
            errors: [
              {
                message: errorMsg,
                line: errorLine,
                column: errorColumn,
              },
            ],
          };
        }
      }

      // No cache available but we still have context - use it with errors
      debugLog("No cache available, but context exists with errors");
      // Continue processing - we might have partial results
    }

    debugLog("Compilation complete");
    debugLog("Result keys:", Object.keys(res));
    debugLog("Context keys:", Object.keys(res.ctx || {}));
    debugLog("Defined classes:", Object.keys(res.ctx.definedClasses || {}).length);

    // Log class information (only in debug mode)
    if (DEBUG && res.ctx.definedClasses) {
      for (const className in res.ctx.definedClasses) {
        const classDesc = res.ctx.definedClasses[className];
        // Properties are stored in 'variables', not 'properties'
        const variableCount = Object.keys(classDesc.variables || {}).length;
        debugLog(`Class ${className}:`, {
          methodCount: Object.keys(classDesc.methods || {}).length,
          propertyCount: variableCount,
        });

        // Debug Vec2 specifically to see what's in it
        if (className === "Vec2") {
          debugLog("Vec2 variables:", Object.keys(classDesc.variables || {}));
          debugLog("Vec2 methods:", Object.keys(classDesc.methods || {}));

          // Log the actual variable structure
          if (classDesc.variables) {
            for (const varKey in classDesc.variables) {
              const varDesc = classDesc.variables[varKey];
              debugLog(`Vec2 variable [${varKey}]:`, JSON.stringify({
                name: varDesc.name,
                type_name: varDesc.type_name,
                varType: varDesc.varType,
                value_type: varDesc.value_type,
                eval_type_name: varDesc.eval_type_name,
                hasGetTypeName: typeof varDesc.getTypeName === "function",
              }, null, 2));

              // Try calling getTypeName if it exists
              if (typeof varDesc.getTypeName === "function") {
                try {
                  debugLog(`Vec2 variable [${varKey}] getTypeName():`, varDesc.getTypeName());
                } catch (e: any) {
                  debugLog(`Vec2 variable [${varKey}] getTypeName() error:`, e.message);
                }
              }
            }
          }
        }

        // Debug Mat2 methods to see structure
        if (className === "Mat2" && classDesc.methods) {
          debugLog("Mat2 methods:", Object.keys(classDesc.methods));
          const firstMethodKey = Object.keys(classDesc.methods)[0];
          if (firstMethodKey) {
            const methodDesc = classDesc.methods[firstMethodKey];
            debugLog(`Mat2 method [${firstMethodKey}]:`, JSON.stringify({
              name: methodDesc.name,
              returnType: methodDesc.returnType,
              return_type: methodDesc.return_type,
              refType: methodDesc.refType,
              hasName: !!methodDesc.name,
            }, null, 2));
          }
        }
      }
    }

    // Try to find the root node in various possible locations
    let rootNode = null;
    debugLog("Looking for root node...");

    // The actual file AST might be in the class nodes
    // Let's check if any class has a node that represents the whole file
    if (res.ctx.definedClasses) {
      for (const className in res.ctx.definedClasses) {
        const classDesc = res.ctx.definedClasses[className];
        if (classDesc.node && classDesc.node.sp === 0) {
          // This might be the root - a node starting at position 0
          debugLog(`Found class ${className} node at sp=0`);
          debugLog(`Node sp: ${classDesc.node.sp}, ep: ${classDesc.node.ep}`);
        }
      }
    }

    // Try to get the root from compiler or env
    const compiler = res.ctx.compiler as any;
    const env = res.ctx.env as any;

    debugLog("compiler exists?", !!compiler);
    debugLog("compiler.rootNode?", !!compiler?.rootNode);
    debugLog("env exists?", !!env);
    debugLog("env.rootNode?", !!env?.rootNode);

    // Try different locations
    rootNode = compiler?.rootNode || env?.rootNode || null;

    if (!rootNode) {
      // Try to build a synthetic root from class nodes
      debugLog("Building synthetic root from class nodes");
      const syntheticRoot: any = {
        sp: 0,
        ep: code.length,
        children: [],
        vref: "root",
        code: code,
      };

      // Add all class nodes as children
      if (res.ctx.definedClasses) {
        for (const className in res.ctx.definedClasses) {
          const classDesc = res.ctx.definedClasses[className];
          if (classDesc.node) {
            syntheticRoot.children.push(classDesc.node);
          }
        }
      }

      if (syntheticRoot.children.length > 0) {
        rootNode = syntheticRoot;
        debugLog("Created synthetic root with", syntheticRoot.children.length, "class nodes");
      }
    }

    debugLog("Root node found:", !!rootNode);

    if (rootNode) {
      debugLog("Root node type:", typeof rootNode);
      debugLog("Root node has children?", !!(rootNode as any).children);
      debugLog("Root node children count:", (rootNode as any).children?.length || 0);
    }

    // Extract errors from context
    const errors: Array<{ message: string; line: number; column: number }> = [];

    // First try to get detailed compiler errors
    if (res.ctx.compilerErrors && res.ctx.compilerErrors.length > 0) {
      debugLog("Found", res.ctx.compilerErrors.length, "compiler errors");
      for (const err of res.ctx.compilerErrors) {
        debugLog("Error detail:", JSON.stringify({
          message: err.message,
          line: err.line,
          column: err.column,
          sp: err.sp,
        }));
        errors.push({
          message: err.message || "Compilation error",
          line: err.line || 0,
          column: err.column || 0,
        });
      }
    }

    // Also check compilerMessages for additional error info
    if (res.ctx.compilerMessages && res.ctx.compilerMessages.length > 0) {
      debugLog("Found", res.ctx.compilerMessages.length, "compiler messages");
      for (const msg of res.ctx.compilerMessages) {
        if (msg.level === "error" || msg.type === "error") {
          debugLog("Message:", msg.message || msg.text);
          errors.push({
            message: msg.message || msg.text || "Compilation error",
            line: msg.line || 0,
            column: msg.column || 0,
          });
        }
      }
    }

    // If we have hasErrors but no detailed errors, add a generic one with the error message
    if (res.hasErrors && errors.length === 0 && res.errorMessage) {
      debugLog("Adding generic error from errorMessage:", res.errorMessage);
      errors.push({
        message: res.errorMessage,
        line: 0,
        column: 0,
      });
    }

    // Only cache successful compilations (no errors) - use LRU cache
    if (!res.hasErrors && errors.length === 0) {
      updateCompilationCache(filename, {
        code: code,
        rootNode: rootNode,
        context: res.ctx,
        timestamp: Date.now(),
      });
      debugLog("Cached successful compilation for:", filename);
    } else {
      debugLog("Not caching compilation with errors");
    }

    return {
      rootNode: rootNode as CodeNode,
      context: res.ctx,
      errors,
    };
  } catch (error: any) {
    debugLog("Error:", error.message);
    return {
      rootNode: null,
      context: null,
      errors: [
        {
          message: error.message || "Compilation error",
          line: 0,
          column: 0,
        },
      ],
    };
  }
}

/**
 * Compile Ranger code using the full compiler (for diagnostics)
 */
export async function compileRangerCode(
  code: string,
  filename: string = "input.rgr"
): Promise<{
  success: boolean;
  errors: Array<{ message: string; line: number; column: number }>;
  ast: CodeNode | null;
}> {
  try {
    const compiler = getRangerCompiler();

    // Create input environment
    const env = new compiler.InputEnv();
    env.use_real = false;

    // Create virtual filesystem
    const folder = new compiler.InputFSFolder();
    const file = new compiler.InputFSFile();
    file.name = filename;
    file.data = code;
    folder.files.push(file);

    // TODO: Add library files (Lang.clj, stdlib.clj, etc.) if needed for full compilation
    // For now, we'll try to parse without them

    env.filesystem = folder;

    // Set compiler options
    const params = new compiler.CmdParams();
    params.params["l"] = "es6"; // Target language doesn't matter for parsing
    params.params["o"] = "output.js";
    params.values.push(filename);
    env.commandLine = params;

    // Run compiler
    const vComp = new compiler.VirtualCompiler();
    const result = await vComp.run(env);

    // Extract errors from result
    const errors: Array<{ message: string; line: number; column: number }> = [];

    // The result may contain error information
    // We'll need to inspect the result structure to extract errors

    return {
      success: errors.length === 0,
      errors,
      ast: null, // TODO: Extract AST from compilation result
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [
        {
          message: error.message || "Unknown compilation error",
          line: 0,
          column: 0,
        },
      ],
      ast: null,
    };
  }
}

/**
 * Check if a node represents a class definition
 */
export function isClassDefinition(node: CodeNode): boolean {
  return node.vref === "class" || node.vref === "systemclass";
}

/**
 * Check if a node represents a method definition
 */
export function isMethodDefinition(node: CodeNode): boolean {
  return node.vref === "fn" || node.vref === "sfn";
}

/**
 * Check if a node represents a property definition
 */
export function isPropertyDefinition(node: CodeNode): boolean {
  return node.vref === "def";
}

/**
 * Check if a node represents a variable definition
 */
export function isVariableDefinition(node: CodeNode): boolean {
  return node.vref === "def" && !isInsideClass(node);
}

/**
 * Check if a node is inside a class definition
 */
function isInsideClass(node: CodeNode): boolean {
  // This would need to traverse up the tree to check parent nodes
  // For now, return a simple heuristic
  return false;
}

/**
 * Get the name from a definition node
 */
export function getDefinitionName(node: CodeNode): string | undefined {
  if (node.children.length >= 2) {
    const nameNode = node.children[1];
    return nameNode.vref || nameNode.string_value;
  }
  return undefined;
}

/**
 * Get the type from a definition node
 */
export function getDefinitionType(node: CodeNode): string | undefined {
  return node.type_name || node.eval_type_name || "any";
}

/**
 * Check if a node represents an enum definition
 */
export function isEnumDefinition(node: CodeNode): boolean {
  return node.vref === "Enum";
}

/**
 * Check if a node represents an extension
 */
export function isExtensionDefinition(node: CodeNode): boolean {
  return node.vref === "extension";
}

/**
 * Check if a node represents an import statement
 */
export function isImportStatement(node: CodeNode): boolean {
  return node.vref === "Import";
}

/**
 * Convert position (line, character) to offset in source code
 */
export function positionToOffset(
  code: string,
  line: number,
  character: number
): number {
  const lines = code.split("\n");
  let offset = 0;

  for (let i = 0; i < line && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }

  offset += character;
  return offset;
}

/**
 * Convert offset to position (line, character)
 */
export function offsetToPosition(
  code: string,
  offset: number
): { line: number; character: number } {
  const lines = code.split("\n");
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
