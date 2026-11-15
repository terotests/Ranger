"use strict";
/**
 * Ranger Language Server
 *
 * This is the main entry point for the Ranger Language Server Protocol (LSP) implementation.
 * It provides language features like completion, hover, diagnostics, etc.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const path = __importStar(require("path"));
const uris_1 = require("./uris");
const realCheck_1 = require("./realCheck");
const projectIndex_1 = require("./projectIndex");
const rangerCompiler_1 = require("./rangerCompiler");
const astAnalyzer_1 = require("./astAnalyzer");
const typeResolver_1 = require("./typeResolver");
const completionProvider_1 = require("./completionProvider");
const keywords_1 = require("./keywords");
// Create a connection for the server using Node's IPC as transport
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
connection.console.log("Ranger Language Server starting...");
// Create a text document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Cache for parsed documents with compiler analysis
const documentCache = new Map();
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    const result = {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: node_1.TextDocumentSyncKind.Incremental,
                save: { includeText: false },
            },
            // Go to definition, across Import and pkg: imports
            definitionProvider: true,
            // Completion support
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [".", ":", "@", "("],
            },
            // Hover support
            hoverProvider: true,
            // Document symbol support (outline)
            documentSymbolProvider: true,
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
});
const defaultSettings = { maxNumberOfProblems: 100 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration((change) => {
    if (hasConfigurationCapability) {
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.ranger || defaultSettings));
    }
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: "ranger",
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Debouncing for validation - prevents re-parsing on every keystroke
const pendingValidations = new Map();
const VALIDATION_DELAY_MS = 300;
// Validate document when it changes (with debouncing)
documents.onDidClose((e) => {
    documentSettings.delete(e.document.uri);
    // Clear document cache to prevent memory leak
    documentCache.delete(e.document.uri);
    // Clear compilation cache for this file
    (0, rangerCompiler_1.clearCompilationCache)(e.document.uri);
    // Clear any pending validation
    const pending = pendingValidations.get(e.document.uri);
    if (pending) {
        clearTimeout(pending);
        pendingValidations.delete(e.document.uri);
    }
});
documents.onDidChangeContent((change) => {
    const uri = change.document.uri;
    // Clear any pending validation for this document
    if (pendingValidations.has(uri)) {
        clearTimeout(pendingValidations.get(uri));
    }
    // Debounce: wait for user to stop typing before validating
    pendingValidations.set(uri, setTimeout(() => {
        pendingValidations.delete(uri);
        validateTextDocument(change.document);
    }, VALIDATION_DELAY_MS));
});
/**
 * Validate a text document and send diagnostics to the client
 */
async function validateTextDocument(textDocument) {
    const settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const uri = textDocument.uri;
    const diagnostics = [];
    connection.console.log(`Validating document: ${uri}`);
    try {
        // Parse with the real Ranger compiler
        connection.console.log("Calling parseRangerCode...");
        const { rootNode, context, errors: compilerErrors, } = await (0, rangerCompiler_1.parseRangerCode)(text, uri);
        connection.console.log(`Parse result - rootNode: ${!!rootNode}, context: ${!!context}, errors: ${compilerErrors.length}`);
        if (compilerErrors.length > 0) {
            connection.console.log(`Compiler errors: ${JSON.stringify(compilerErrors)}`);
        }
        if (!rootNode || !context) {
            // Parse failed completely
            connection.console.error(`Parse failed - rootNode: ${!!rootNode}, context: ${!!context}`);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 1 },
                },
                message: "Failed to parse Ranger code",
                source: "ranger",
            });
            // Send diagnostics immediately and return - don't try to analyze
            if (!usesRealCompiler(uri))
                connection.sendDiagnostics({ uri, diagnostics });
            return;
        }
        // Only create analyzer if we have valid rootNode and context
        connection.console.log("Creating ASTAnalyzer...");
        const analyzer = new astAnalyzer_1.ASTAnalyzer(rootNode, context, text);
        connection.console.log("ASTAnalyzer created successfully");
        const typeResolver = new typeResolver_1.TypeResolver(analyzer);
        const completionProvider = new completionProvider_1.CompletionProvider(analyzer, typeResolver);
        documentCache.set(uri, {
            analyzer,
            typeResolver,
            completionProvider,
            version: textDocument.version,
        });
        // Get compilation errors from the analyzer
        const compilationErrors = analyzer.getCompilationErrors();
        connection.console.log(`Got ${compilationErrors.length} compilation errors from analyzer`);
        for (const error of compilationErrors) {
            if (diagnostics.length >= settings.maxNumberOfProblems) {
                break;
            }
            connection.console.log(`Processing error: ${error.message}, node: ${!!error.node}, sp: ${error.node?.sp}`);
            const pos = analyzer.offsetToPosition(error.node?.sp || 0);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: pos,
                    end: { line: pos.line, character: pos.character + 1 },
                },
                message: error.message,
                source: "ranger",
            });
        }
        // Also add errors from the parse result
        for (const error of compilerErrors) {
            if (diagnostics.length >= settings.maxNumberOfProblems) {
                break;
            }
            // Skip internal compiler errors (these are usually from incomplete code during editing)
            if (error.message &&
                error.message.includes("Cannot read properties of undefined")) {
                continue;
            }
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: error.line, character: error.column },
                    end: { line: error.line, character: error.column + 1 },
                },
                message: error.message,
                source: "ranger",
            });
        }
    }
    catch (error) {
        // Parsing threw an exception
        connection.console.error(`Exception in validateTextDocument: ${error.message}\nStack: ${error.stack}`);
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
            },
            message: `Parse error: ${error.message || "Unknown error"}`,
            source: "ranger",
        });
    }
    if (!usesRealCompiler(uri))
        connection.sendDiagnostics({ uri, diagnostics });
}
// --- the real compiler ---------------------------------------------------------
//
// When the file sits in a Ranger checkout (or the extension does), the
// checkout's own dist/rgrc.js checks it on open and on save, and its messages
// are the diagnostics: they follow Import and pkg: and know every form the
// compiler knows. The in-memory analyzer above then only feeds completion and
// hover, because on such files it reports what the old embedded compiler
// cannot read rather than what is wrong.
const EXTENSION_RANGER = path.resolve(__dirname, "..", "..", "..");
function rangerRootFor(uri) {
    const file = (0, uris_1.URI_TO_PATH)(uri);
    if (!file)
        return null;
    return (0, realCheck_1.findRangerRoot)(file, [EXTENSION_RANGER]);
}
function usesRealCompiler(uri) {
    return rangerRootFor(uri) !== null;
}
// The files each checked file last put diagnostics on, so a fixed error in an
// imported file is cleared too.
const realDiagFiles = new Map();
const realRunning = new Map();
const realAgain = new Set();
async function realCheck(uri) {
    const root = rangerRootFor(uri);
    const file = (0, uris_1.URI_TO_PATH)(uri);
    if (!root || !file)
        return;
    if (realRunning.get(uri)) {
        realAgain.add(uri);
        return;
    }
    realRunning.set(uri, true);
    try {
        const groups = await (0, realCheck_1.runRealCheck)(file, root);
        const now = new Set();
        for (const g of groups) {
            const target = (0, uris_1.PATH_TO_URI)(g.file);
            now.add(target);
            connection.sendDiagnostics({
                uri: target,
                diagnostics: g.messages.map((m) => ({
                    severity: m.severity === "warning" ? node_1.DiagnosticSeverity.Warning : node_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: m.line, character: m.column },
                        end: { line: m.line, character: m.column + 1 },
                    },
                    message: m.message,
                    source: "rgrc",
                })),
            });
        }
        for (const old of realDiagFiles.get(uri) || []) {
            if (!now.has(old))
                connection.sendDiagnostics({ uri: old, diagnostics: [] });
        }
        realDiagFiles.set(uri, now);
    }
    catch (e) {
        connection.console.error(`rgrc check failed: ${e && e.message}`);
    }
    finally {
        realRunning.set(uri, false);
        if (realAgain.delete(uri))
            realCheck(uri);
    }
}
documents.onDidOpen((e) => {
    realCheck(e.document.uri);
});
documents.onDidSave((e) => {
    realCheck(e.document.uri);
});
connection.onDefinition((params) => {
    const document = documents.get(params.textDocument.uri);
    const file = (0, uris_1.URI_TO_PATH)(params.textDocument.uri);
    if (!document || !file)
        return null;
    const lineText = document.getText({
        start: { line: params.position.line, character: 0 },
        end: { line: params.position.line + 1, character: 0 },
    });
    const at = (0, projectIndex_1.wordAt)(lineText, params.position.character);
    if (!at)
        return null;
    try {
        const index = new projectIndex_1.ProjectIndex(file, document.getText());
        const hits = index.definition(at.word, at.qualifier, file);
        return hits.map((h) => node_1.Location.create((0, uris_1.PATH_TO_URI)(h.file), node_1.Range.create(h.line, h.column, h.line, h.column + h.name.length)));
    }
    catch (e) {
        connection.console.error(`definition failed: ${e && e.message}`);
        return null;
    }
});
/**
 * Provide completion items using the real compiler's type information
 */
connection.onCompletion((textDocumentPosition) => {
    try {
        connection.console.log("onCompletion triggered");
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document) {
            return [];
        }
        // Get cached analysis
        const cached = documentCache.get(textDocumentPosition.textDocument.uri);
        if (!cached) {
            // Return basic completions if not analyzed yet
            return getBasicCompletions();
        }
        const text = document.getText();
        const offset = document.offsetAt(textDocumentPosition.position);
        // Determine trigger character
        const charBefore = text.charAt(offset - 1);
        const triggerChar = [".", "@", ":"].includes(charBefore)
            ? charBefore
            : undefined;
        // Use the completion provider
        connection.console.log("Calling completion provider...");
        const completions = cached.completionProvider.provideCompletions(offset, triggerChar);
        connection.console.log(`Completion provider returned ${completions.length} items`);
        return completions;
    }
    catch (error) {
        connection.console.error(`Error in onCompletion: ${error.message}\nStack: ${error.stack}`);
        return getBasicCompletions();
    }
});
/**
 * Basic completions when compiler analysis is not available
 */
function getBasicCompletions() {
    const completions = [];
    // Keywords
    for (const keyword of keywords_1.KEYWORDS) {
        completions.push({
            label: keyword.name,
            kind: node_1.CompletionItemKind.Keyword,
            detail: keyword.description,
            insertText: keyword.name,
        });
    }
    // Types
    for (const type of keywords_1.TYPES) {
        completions.push({
            label: type.name,
            kind: node_1.CompletionItemKind.TypeParameter,
            detail: type.description,
            insertText: type.name,
        });
    }
    return completions;
}
/**
 * Resolve additional information for a completion item
 */
connection.onCompletionResolve((item) => {
    return item;
});
/**
 * Provide hover information using the real compiler's type information
 */
connection.onHover((params) => {
    try {
        connection.console.log("onHover triggered");
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return null;
        }
        // Get cached analysis
        const cached = documentCache.get(params.textDocument.uri);
        if (!cached) {
            return null;
        }
        const offset = document.offsetAt(params.position);
        connection.console.log(`Hover at offset ${offset}, position line:${params.position.line}, char:${params.position.character}`);
        // Get the node at this position for debugging
        const node = cached.analyzer.findNodeAtOffset(offset);
        connection.console.log(`Found node: ${!!node}, vref: ${node?.vref}, eval_type_name: ${node?.eval_type_name}`);
        // Build debug information
        let debugInfo = "**AST Debug Info:**\n\n";
        debugInfo += `- **Offset**: ${offset}\n`;
        debugInfo += `- **Position**: Line ${params.position.line}, Char ${params.position.character}\n\n`;
        if (node) {
            debugInfo += `- **vref**: \`${node.vref || "none"}\`\n`;
            debugInfo += `- **eval_type_name**: \`${node.eval_type_name || "not set"}\`\n`;
            debugInfo += `- **type_name**: \`${node.type_name || "not set"}\`\n`;
            debugInfo += `- **value_type**: \`${node.value_type || "not set"}\`\n`;
            debugInfo += `- **has_call**: \`${node.has_call || false}\`\n`;
            debugInfo += `- **Node range**: \`${node.sp}-${node.ep}\`\n`;
            debugInfo += `- **Children count**: \`${node.children ? node.children.length : 0}\`\n`;
            // Check if this is a variable reference and look for its definition
            if (node.vref) {
                const text = document.getText();
                const varName = node.vref;
                const beforeText = text.substring(0, offset);
                // Look for def pattern
                const defPattern = new RegExp(`def\\s+${varName}\\s*(?::\\s*(\\w+))?\\s*(.{0,30})`, "g");
                let match;
                let lastMatch = null;
                while ((match = defPattern.exec(beforeText)) !== null) {
                    lastMatch = match;
                }
                if (lastMatch) {
                    debugInfo += `\n**Variable Definition Found:**\n`;
                    debugInfo += `- Type annotation: \`${lastMatch[1] || "none"}\`\n`;
                    debugInfo += `- Initializer: \`${lastMatch[2].trim()}\`\n`;
                }
            }
        }
        else {
            debugInfo += "**No AST node found at this position**\n\n";
            // Show root node info for debugging
            const classes = cached.analyzer.getDefinedClasses();
            debugInfo += `\n**Context Info:**\n`;
            debugInfo += `- Defined classes: ${classes.size}\n`;
            for (const [className, classInfo] of classes) {
                debugInfo += `  - ${className}: ${classInfo.methods.length} methods, ${classInfo.properties.length} properties\n`;
            }
        }
        // Also try to get type information from the type resolver
        const hoverInfo = cached.typeResolver.resolveHoverInfo(offset);
        if (hoverInfo) {
            debugInfo += `\n---\n\n**Type Info:**\n`;
            debugInfo += `- **Type**: \`${hoverInfo.type}\`\n`;
            if (hoverInfo.documentation) {
                debugInfo += `\n${hoverInfo.documentation}`;
            }
            // If this is a class type, show its members
            if (hoverInfo.members && hoverInfo.members.length > 0) {
                debugInfo += `\n\n**Class Members:**\n\n`;
                // Group by kind
                const properties = hoverInfo.members.filter((m) => m.kind === "property");
                const methods = hoverInfo.members.filter((m) => m.kind === "method");
                const staticMethods = hoverInfo.members.filter((m) => m.kind === "static-method");
                if (properties.length > 0) {
                    debugInfo += `*Properties:*\n`;
                    properties.forEach((prop) => {
                        debugInfo += `- \`${prop.name}\`: \`${prop.type || "any"}\`\n`;
                    });
                    debugInfo += `\n`;
                }
                if (methods.length > 0) {
                    debugInfo += `*Methods:*\n`;
                    methods.forEach((method) => {
                        debugInfo += `- \`${method.name}()\`: \`${method.type || "void"}\`\n`;
                    });
                    debugInfo += `\n`;
                }
                if (staticMethods.length > 0) {
                    debugInfo += `*Static Methods:*\n`;
                    staticMethods.forEach((method) => {
                        debugInfo += `- \`${method.name}()\`: \`${method.type || "void"}\`\n`;
                    });
                }
            }
        }
        return {
            contents: {
                kind: "markdown",
                value: debugInfo,
            },
        };
    }
    catch (error) {
        connection.console.error(`Error in onHover: ${error.message}\nStack: ${error.stack}`);
        return null;
    }
});
/**
 * Provide document symbols (outline) using compiler analysis
 */
connection.onDocumentSymbol((params) => {
    try {
        connection.console.log("onDocumentSymbol triggered");
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return [];
        }
        // Get cached analysis
        const cached = documentCache.get(params.textDocument.uri);
        if (!cached) {
            // Fall back to regex-based symbols
            return getBasicSymbols(document, params.textDocument.uri);
        }
        const symbols = [];
        // Get classes from analyzer
        const classes = cached.analyzer.getDefinedClasses();
        for (const [className, classInfo] of classes) {
            if (classInfo.node) {
                const pos = cached.analyzer.offsetToPosition(classInfo.node.sp);
                symbols.push({
                    name: className,
                    kind: node_1.SymbolKind.Class,
                    location: node_1.Location.create(params.textDocument.uri, node_1.Range.create(pos, pos)),
                });
                // Add methods
                for (const method of [
                    ...classInfo.methods,
                    ...classInfo.staticMethods,
                ]) {
                    if (method.node) {
                        const methodPos = cached.analyzer.offsetToPosition(method.node.sp);
                        symbols.push({
                            name: method.name,
                            kind: method.kind === "static-method"
                                ? node_1.SymbolKind.Function
                                : node_1.SymbolKind.Method,
                            location: node_1.Location.create(params.textDocument.uri, node_1.Range.create(methodPos, methodPos)),
                        });
                    }
                }
            }
        }
        // Get enums
        const enums = cached.analyzer.getDefinedEnums();
        for (const [enumName, enumInfo] of enums) {
            if (enumInfo.node) {
                const pos = cached.analyzer.offsetToPosition(enumInfo.node.sp);
                symbols.push({
                    name: enumName,
                    kind: node_1.SymbolKind.Enum,
                    location: node_1.Location.create(params.textDocument.uri, node_1.Range.create(pos, pos)),
                });
            }
        }
        return symbols;
    }
    catch (error) {
        connection.console.error(`Error in onDocumentSymbol: ${error.message}\nStack: ${error.stack}`);
        return [];
    }
});
/**
 * Basic symbol extraction using regex (fallback)
 */
function getBasicSymbols(document, uri) {
    const text = document.getText();
    const symbols = [];
    // Find classes
    const classRegex = /\b(class|extension)\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        symbols.push({
            name: match[2],
            kind: node_1.SymbolKind.Class,
            location: node_1.Location.create(uri, node_1.Range.create(startPos, startPos)),
        });
    }
    // Find functions
    const fnRegex = /\b(fn|sfn)\s+(\w+)/g;
    while ((match = fnRegex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        symbols.push({
            name: match[2],
            kind: match[1] === "sfn" ? node_1.SymbolKind.Function : node_1.SymbolKind.Method,
            location: node_1.Location.create(uri, node_1.Range.create(startPos, startPos)),
        });
    }
    return symbols;
}
// Helper function to get word at offset (kept for potential future use)
function getWordAtOffset(text, offset) {
    const wordPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    let match;
    while ((match = wordPattern.exec(text)) !== null) {
        if (match.index <= offset && offset <= match.index + match[0].length) {
            return match[0];
        }
        if (match.index > offset) {
            break;
        }
    }
    return null;
}
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map