"use strict";
/**
 * Ranger Compiler Integration
 *
 * Wrapper around the real Ranger compiler (bin/output.js) to provide
 * parsing and analysis capabilities for the language server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangerCompiler = getRangerCompiler;
exports.parseRangerCode = parseRangerCode;
exports.compileRangerCode = compileRangerCode;
exports.isClassDefinition = isClassDefinition;
exports.isMethodDefinition = isMethodDefinition;
exports.isPropertyDefinition = isPropertyDefinition;
exports.isVariableDefinition = isVariableDefinition;
exports.getDefinitionName = getDefinitionName;
exports.getDefinitionType = getDefinitionType;
exports.isEnumDefinition = isEnumDefinition;
exports.isExtensionDefinition = isExtensionDefinition;
exports.isImportStatement = isImportStatement;
exports.positionToOffset = positionToOffset;
exports.offsetToPosition = offsetToPosition;
// Import the compiled Ranger compiler
const rangerCompiler = require('../../compiler/output.js');
const compilationCache = new Map();
/**
 * Check if new code has significant common prefix with cached code
 * This helps determine if cached compilation results are still relevant
 */
function hasCommonPrefix(newCode, cachedCode) {
    const minLen = Math.min(newCode.length, cachedCode.length);
    if (minLen === 0)
        return false;
    let matchLen = 0;
    for (let i = 0; i < minLen; i++) {
        if (newCode[i] === cachedCode[i]) {
            matchLen++;
        }
        else {
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
function offsetToLineColumn(code, offset) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < offset && i < code.length; i++) {
        if (code[i] === '\n') {
            line++;
            column = 1;
        }
        else {
            column++;
        }
    }
    return { line, column };
}
/**
 * Analyze code differences to provide contextual error hints
 * Compares cached (working) code with current (broken) code
 */
function findCodeDifference(cachedCode, currentCode) {
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
        console.log('[Ranger Compiler] Difference at offset:', firstDiff, 'line:', position.line, 'column:', position.column);
        console.log('[Ranger Compiler] Context:', context);
        // Analyze the context to provide hints
        let hint = 'Check for syntax errors or type mismatches';
        // Check if inside function call (has opening paren before and closing paren after)
        const beforeContext = currentCode.substring(Math.max(0, firstDiff - 100), firstDiff);
        const afterContext = currentCode.substring(firstDiff, Math.min(currentCode.length, firstDiff + 100));
        // Look for pattern: methodName( with possible dot notation before it
        const functionCallMatch = beforeContext.match(/([\w\.]+)\s*\(\s*[^)]*$/);
        if (functionCallMatch) {
            const functionName = functionCallMatch[1];
            const methodName = functionName.includes('.') ? functionName.split('.').pop() : functionName;
            hint = `Check parameters for method '${methodName}' - verify types match expected signature`;
            // Check if there's a string literal in the after context
            if (afterContext.match(/^[^)]*["'][^"']*["']/)) {
                hint += '. Note: string literal found, check if numeric type expected';
            }
        }
        // Check for incomplete expressions
        if (currentCode.substring(firstDiff, Math.min(currentCode.length, firstDiff + 10)).match(/^\s*$/)) {
            hint = 'Incomplete expression - check for missing closing parentheses or semicolons';
        }
        return { context, hint, line: position.line, column: position.column };
    }
    catch (e) {
        console.error('[Ranger Compiler] Error analyzing code difference:', e);
        return null;
    }
}
/**
 * Get the Ranger compiler API
 */
function getRangerCompiler() {
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
        Context: rangerCompiler.Context
    };
}
/**
 * Parse Ranger source code and return the AST with type information
 *
 * This function uses VirtualCompiler to properly initialize the compiler
 * with Lang.clj and standard libraries, then runs the two-pass compilation.
 */
async function parseRangerCode(code, filename = 'input.rngr') {
    try {
        const fs = require('fs');
        const path = require('path');
        // Create input environment like the README example
        const InputEnv = require('../../compiler/output.js').InputEnv;
        const InputFSFolder = require('../../compiler/output.js').InputFSFolder;
        const InputFSFile = require('../../compiler/output.js').InputFSFile;
        const CmdParams = require('../../compiler/output.js').CmdParams;
        const VirtualCompiler = require('../../compiler/output.js').VirtualCompiler;
        const compilerInput = new InputEnv();
        compilerInput.use_real = false;
        // Create virtual filesystem
        const folder = new InputFSFolder();
        const addFile = (name, contents) => {
            const newFile = new InputFSFile();
            newFile.name = name;
            newFile.data = contents;
            folder.files.push(newFile);
        };
        // Add the user's code
        addFile(filename, code);
        // Load required compiler files (Lang.clj and standard libraries)
        const compilerRoot = path.join(__dirname, '../../..');
        try {
            addFile('Lang.clj', fs.readFileSync(path.join(compilerRoot, 'compiler/Lang.clj'), 'utf8'));
            console.log('[Ranger Compiler] Loaded Lang.clj');
            // Try to load standard libraries if they exist
            try {
                addFile('stdlib.clj', fs.readFileSync(path.join(compilerRoot, 'lib/stdlib.clj'), 'utf8'));
                addFile('stdops.clj', fs.readFileSync(path.join(compilerRoot, 'lib/stdops.clj'), 'utf8'));
                addFile('JSON.clj', fs.readFileSync(path.join(compilerRoot, 'lib/JSON.clj'), 'utf8'));
                console.log('[Ranger Compiler] Loaded standard libraries');
            }
            catch (libError) {
                console.log('[Ranger Compiler] Standard libraries not loaded (optional)');
            }
        }
        catch (langError) {
            console.error('[Ranger Compiler] Failed to load Lang.clj:', langError.message);
            return {
                rootNode: null,
                context: null,
                errors: [{
                        message: 'Failed to load Lang.clj: ' + langError.message,
                        line: 0,
                        column: 0
                    }]
            };
        }
        compilerInput.filesystem = folder;
        // Set compiler parameters for ES6 (for LSP we just need type analysis)
        const params = new CmdParams();
        params.params['l'] = 'es6';
        params.params['o'] = 'output.js';
        params.values.push(filename);
        compilerInput.commandLine = params;
        // Run the virtual compiler
        console.log('[Ranger Compiler] Running VirtualCompiler...');
        const vComp = new VirtualCompiler();
        let res;
        try {
            res = await vComp.run(compilerInput);
        }
        catch (compileError) {
            console.error('[Ranger Compiler] VirtualCompiler exception:', compileError.message);
            // Strategy: Check if we have a cached successful compilation
            const cached = compilationCache.get(filename);
            if (cached && hasCommonPrefix(code, cached.code)) {
                console.log('[Ranger Compiler] Using cached compilation (code has common prefix)');
                console.log('[Ranger Compiler] Cache age:', Date.now() - cached.timestamp, 'ms');
                // Return cached results - they're still relevant for the unchanged parts
                return {
                    rootNode: cached.rootNode,
                    context: cached.context,
                    errors: [{
                            message: 'Using cached compilation due to incomplete code',
                            line: 0,
                            column: 0
                        }]
                };
            }
            // No cache or code too different - return error
            console.log('[Ranger Compiler] No usable cache available');
            return {
                rootNode: null,
                context: null,
                errors: [{
                        message: 'Compilation failed: ' + (compileError.message || 'Internal compiler error'),
                        line: 0,
                        column: 0
                    }]
            };
        }
        if (!res || !res.ctx) {
            return {
                rootNode: null,
                context: null,
                errors: [{
                        message: 'Compiler failed to create context',
                        line: 0,
                        column: 0
                    }]
            };
        }
        // Check if the compiler returned errors (VirtualCompiler now sets hasErrors instead of calling exit)
        if (res.hasErrors) {
            console.log('[Ranger Compiler] Compilation had errors:', res.errorMessage || 'Unknown error');
            // Strategy: Check if we have a cached successful compilation
            const cached = compilationCache.get(filename);
            if (cached) {
                // Use cache if code length difference is small (within 50 characters)
                // This handles cases like typing "v." at the end for autocomplete
                const lengthDiff = Math.abs(code.length - cached.code.length);
                const shouldUseCache = lengthDiff <= 50;
                console.log('[Ranger Compiler] Cache check - has cached:', !!cached);
                console.log('[Ranger Compiler] Code length:', code.length, 'Cached length:', cached.code.length, 'Diff:', lengthDiff);
                console.log('[Ranger Compiler] Should use cache:', shouldUseCache);
                if (shouldUseCache) {
                    console.log('[Ranger Compiler] Using cached compilation due to compilation errors');
                    console.log('[Ranger Compiler] Cache age:', Date.now() - cached.timestamp, 'ms');
                    // Try to provide a better error message by analyzing what changed
                    let errorMsg = res.errorMessage || 'Compilation errors detected';
                    let errorLine = 0;
                    let errorColumn = 0;
                    // Find where the code differs
                    const changeInfo = findCodeDifference(cached.code, code);
                    if (changeInfo) {
                        console.log('[Ranger Compiler] Change detected at:', changeInfo);
                        errorLine = changeInfo.line;
                        errorColumn = changeInfo.column;
                        // Add hint about what might be wrong
                        errorMsg = `${changeInfo.hint}\n\nContext: "${changeInfo.context}"`;
                    }
                    // Return cached results - they're still relevant for the unchanged parts
                    return {
                        rootNode: cached.rootNode,
                        context: cached.context,
                        errors: [{
                                message: errorMsg,
                                line: errorLine,
                                column: errorColumn
                            }]
                    };
                }
            }
            // No cache available but we still have context - use it with errors
            console.log('[Ranger Compiler] No cache available, but context exists with errors');
            // Continue processing - we might have partial results
        }
        console.log('[Ranger Compiler] Compilation complete');
        console.log('[Ranger Compiler] Result keys:', Object.keys(res));
        console.log('[Ranger Compiler] Context keys:', Object.keys(res.ctx || {}));
        console.log('[Ranger Compiler] Defined classes:', Object.keys(res.ctx.definedClasses || {}).length);
        // Log class information
        if (res.ctx.definedClasses) {
            for (const className in res.ctx.definedClasses) {
                const classDesc = res.ctx.definedClasses[className];
                // Properties are stored in 'variables', not 'properties'
                const variableCount = Object.keys(classDesc.variables || {}).length;
                console.log(`[Ranger Compiler] Class ${className}:`, {
                    methodCount: Object.keys(classDesc.methods || {}).length,
                    propertyCount: variableCount
                });
                // Debug Vec2 specifically to see what's in it
                if (className === 'Vec2') {
                    console.log('[Ranger Compiler] Vec2 variables:', Object.keys(classDesc.variables || {}));
                    console.log('[Ranger Compiler] Vec2 methods:', Object.keys(classDesc.methods || {}));
                    // Log the actual variable structure
                    if (classDesc.variables) {
                        for (const varKey in classDesc.variables) {
                            const varDesc = classDesc.variables[varKey];
                            console.log(`[Ranger Compiler] Vec2 variable [${varKey}]:`, JSON.stringify({
                                name: varDesc.name,
                                type_name: varDesc.type_name,
                                varType: varDesc.varType,
                                value_type: varDesc.value_type,
                                eval_type_name: varDesc.eval_type_name,
                                hasGetTypeName: typeof varDesc.getTypeName === 'function'
                            }, null, 2));
                            // Try calling getTypeName if it exists
                            if (typeof varDesc.getTypeName === 'function') {
                                try {
                                    console.log(`[Ranger Compiler] Vec2 variable [${varKey}] getTypeName():`, varDesc.getTypeName());
                                }
                                catch (e) {
                                    console.log(`[Ranger Compiler] Vec2 variable [${varKey}] getTypeName() error:`, e.message);
                                }
                            }
                        }
                    }
                }
                // Debug Mat2 methods to see structure
                if (className === 'Mat2' && classDesc.methods) {
                    console.log('[Ranger Compiler] Mat2 methods:', Object.keys(classDesc.methods));
                    const firstMethodKey = Object.keys(classDesc.methods)[0];
                    if (firstMethodKey) {
                        const methodDesc = classDesc.methods[firstMethodKey];
                        console.log(`[Ranger Compiler] Mat2 method [${firstMethodKey}]:`, JSON.stringify({
                            name: methodDesc.name,
                            returnType: methodDesc.returnType,
                            return_type: methodDesc.return_type,
                            refType: methodDesc.refType,
                            hasName: !!methodDesc.name
                        }, null, 2));
                    }
                }
            }
        }
        // Try to find the root node in various possible locations
        let rootNode = null;
        console.log('[Ranger Compiler] Looking for root node...');
        // The actual file AST might be in the class nodes
        // Let's check if any class has a node that represents the whole file
        if (res.ctx.definedClasses) {
            for (const className in res.ctx.definedClasses) {
                const classDesc = res.ctx.definedClasses[className];
                if (classDesc.node && classDesc.node.sp === 0) {
                    // This might be the root - a node starting at position 0
                    console.log(`[Ranger Compiler] Found class ${className} node at sp=0`);
                    console.log(`[Ranger Compiler] Node sp: ${classDesc.node.sp}, ep: ${classDesc.node.ep}`);
                }
            }
        }
        // Try to get the root from compiler or env
        const compiler = res.ctx.compiler;
        const env = res.ctx.env;
        console.log('[Ranger Compiler] compiler exists?', !!compiler);
        console.log('[Ranger Compiler] compiler.rootNode?', !!(compiler?.rootNode));
        console.log('[Ranger Compiler] env exists?', !!env);
        console.log('[Ranger Compiler] env.rootNode?', !!(env?.rootNode));
        // Try different locations
        rootNode = compiler?.rootNode || env?.rootNode || null;
        if (!rootNode) {
            // Try to build a synthetic root from class nodes
            console.log('[Ranger Compiler] Building synthetic root from class nodes');
            const syntheticRoot = {
                sp: 0,
                ep: code.length,
                children: [],
                vref: 'root',
                code: code
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
                console.log('[Ranger Compiler] Created synthetic root with', syntheticRoot.children.length, 'class nodes');
            }
        }
        console.log('[Ranger Compiler] Root node found:', !!rootNode);
        if (rootNode) {
            console.log('[Ranger Compiler] Root node type:', typeof rootNode);
            console.log('[Ranger Compiler] Root node has children?', !!rootNode.children);
            console.log('[Ranger Compiler] Root node children count:', rootNode.children?.length || 0);
        }
        // Extract errors from context
        const errors = [];
        // First try to get detailed compiler errors
        if (res.ctx.compilerErrors && res.ctx.compilerErrors.length > 0) {
            console.log('[Ranger Compiler] Found', res.ctx.compilerErrors.length, 'compiler errors');
            for (const err of res.ctx.compilerErrors) {
                console.log('[Ranger Compiler] Error detail:', JSON.stringify({
                    message: err.message,
                    line: err.line,
                    column: err.column,
                    sp: err.sp
                }));
                errors.push({
                    message: err.message || 'Compilation error',
                    line: err.line || 0,
                    column: err.column || 0
                });
            }
        }
        // Also check compilerMessages for additional error info
        if (res.ctx.compilerMessages && res.ctx.compilerMessages.length > 0) {
            console.log('[Ranger Compiler] Found', res.ctx.compilerMessages.length, 'compiler messages');
            for (const msg of res.ctx.compilerMessages) {
                if (msg.level === 'error' || msg.type === 'error') {
                    console.log('[Ranger Compiler] Message:', msg.message || msg.text);
                    errors.push({
                        message: msg.message || msg.text || 'Compilation error',
                        line: msg.line || 0,
                        column: msg.column || 0
                    });
                }
            }
        }
        // If we have hasErrors but no detailed errors, add a generic one with the error message
        if (res.hasErrors && errors.length === 0 && res.errorMessage) {
            console.log('[Ranger Compiler] Adding generic error from errorMessage:', res.errorMessage);
            errors.push({
                message: res.errorMessage,
                line: 0,
                column: 0
            });
        }
        // Only cache successful compilations (no errors)
        if (!res.hasErrors && errors.length === 0) {
            compilationCache.set(filename, {
                code: code,
                rootNode: rootNode,
                context: res.ctx,
                timestamp: Date.now()
            });
            console.log('[Ranger Compiler] Cached successful compilation for:', filename);
        }
        else {
            console.log('[Ranger Compiler] Not caching compilation with errors');
        }
        return {
            rootNode: rootNode,
            context: res.ctx,
            errors
        };
    }
    catch (error) {
        console.error('[Ranger Compiler] Error:', error.message);
        return {
            rootNode: null,
            context: null,
            errors: [{
                    message: error.message || 'Compilation error',
                    line: 0,
                    column: 0
                }]
        };
    }
}
/**
 * Compile Ranger code using the full compiler (for diagnostics)
 */
async function compileRangerCode(code, filename = 'input.rngr') {
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
        params.params['l'] = 'es6'; // Target language doesn't matter for parsing
        params.params['o'] = 'output.js';
        params.values.push(filename);
        env.commandLine = params;
        // Run compiler
        const vComp = new compiler.VirtualCompiler();
        const result = await vComp.run(env);
        // Extract errors from result
        const errors = [];
        // The result may contain error information
        // We'll need to inspect the result structure to extract errors
        return {
            success: errors.length === 0,
            errors,
            ast: null // TODO: Extract AST from compilation result
        };
    }
    catch (error) {
        return {
            success: false,
            errors: [{
                    message: error.message || 'Unknown compilation error',
                    line: 0,
                    column: 0
                }],
            ast: null
        };
    }
}
/**
 * Check if a node represents a class definition
 */
function isClassDefinition(node) {
    return node.vref === 'class' || node.vref === 'systemclass';
}
/**
 * Check if a node represents a method definition
 */
function isMethodDefinition(node) {
    return node.vref === 'fn' || node.vref === 'sfn';
}
/**
 * Check if a node represents a property definition
 */
function isPropertyDefinition(node) {
    return node.vref === 'def';
}
/**
 * Check if a node represents a variable definition
 */
function isVariableDefinition(node) {
    return node.vref === 'def' && !isInsideClass(node);
}
/**
 * Check if a node is inside a class definition
 */
function isInsideClass(node) {
    // This would need to traverse up the tree to check parent nodes
    // For now, return a simple heuristic
    return false;
}
/**
 * Get the name from a definition node
 */
function getDefinitionName(node) {
    if (node.children.length >= 2) {
        const nameNode = node.children[1];
        return nameNode.vref || nameNode.string_value;
    }
    return undefined;
}
/**
 * Get the type from a definition node
 */
function getDefinitionType(node) {
    return node.type_name || node.eval_type_name || 'any';
}
/**
 * Check if a node represents an enum definition
 */
function isEnumDefinition(node) {
    return node.vref === 'Enum';
}
/**
 * Check if a node represents an extension
 */
function isExtensionDefinition(node) {
    return node.vref === 'extension';
}
/**
 * Check if a node represents an import statement
 */
function isImportStatement(node) {
    return node.vref === 'Import';
}
/**
 * Convert position (line, character) to offset in source code
 */
function positionToOffset(code, line, character) {
    const lines = code.split('\n');
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
function offsetToPosition(code, offset) {
    const lines = code.split('\n');
    let currentOffset = 0;
    for (let line = 0; line < lines.length; line++) {
        const lineLength = lines[line].length + 1; // +1 for newline
        if (currentOffset + lineLength > offset) {
            return {
                line,
                character: offset - currentOffset
            };
        }
        currentOffset += lineLength;
    }
    return {
        line: lines.length - 1,
        character: lines[lines.length - 1]?.length || 0
    };
}
//# sourceMappingURL=rangerCompiler.js.map