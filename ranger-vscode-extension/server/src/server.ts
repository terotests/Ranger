/**
 * Ranger Language Server
 *
 * This is the main entry point for the Ranger Language Server Protocol (LSP) implementation.
 * It provides language features like completion, hover, diagnostics, etc.
 */

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
  Location,
  Range,
  Position,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import {
  parseRangerCode,
  positionToOffset,
  offsetToPosition,
} from "./rangerCompiler";
import { ASTAnalyzer } from "./astAnalyzer";
import { TypeResolver } from "./typeResolver";
import { CompletionProvider } from "./completionProvider";
import {
  KEYWORDS,
  TYPES,
  OPERATORS,
  BUILT_IN_FUNCTIONS,
  ANNOTATIONS,
} from "./keywords";

// Create a connection for the server using Node's IPC as transport
const connection = createConnection(ProposedFeatures.all);

connection.console.log("Ranger Language Server starting...");

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Cache for parsed documents with compiler analysis
const documentCache = new Map<
  string,
  {
    analyzer: ASTAnalyzer;
    typeResolver: TypeResolver;
    completionProvider: CompletionProvider;
    version: number;
  }
>();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
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
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
});

// Settings interface
interface RangerSettings {
  maxNumberOfProblems: number;
}

const defaultSettings: RangerSettings = { maxNumberOfProblems: 100 };
let globalSettings: RangerSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<RangerSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    documentSettings.clear();
  } else {
    globalSettings = <RangerSettings>(
      (change.settings.ranger || defaultSettings)
    );
  }
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<RangerSettings> {
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

// Validate document when it changes
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

/**
 * Validate a text document and send diagnostics to the client
 */
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();
  const uri = textDocument.uri;
  const diagnostics: Diagnostic[] = [];

  connection.console.log(`Validating document: ${uri}`);

  try {
    // Parse with the real Ranger compiler
    connection.console.log("Calling parseRangerCode...");
    const {
      rootNode,
      context,
      errors: compilerErrors,
    } = await parseRangerCode(text, uri);
    connection.console.log(
      `Parse result - rootNode: ${!!rootNode}, context: ${!!context}, errors: ${
        compilerErrors.length
      }`
    );

    if (compilerErrors.length > 0) {
      connection.console.log(
        `Compiler errors: ${JSON.stringify(compilerErrors)}`
      );
    }

    if (!rootNode || !context) {
      // Parse failed completely
      connection.console.error(
        `Parse failed - rootNode: ${!!rootNode}, context: ${!!context}`
      );
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 1 },
        },
        message: "Failed to parse Ranger code",
        source: "ranger",
      });

      // Send diagnostics immediately and return - don't try to analyze
      connection.sendDiagnostics({ uri, diagnostics });
      return;
    }

    // Only create analyzer if we have valid rootNode and context
    connection.console.log("Creating ASTAnalyzer...");
    const analyzer = new ASTAnalyzer(rootNode, context, text);
    connection.console.log("ASTAnalyzer created successfully");
    const typeResolver = new TypeResolver(analyzer);
    const completionProvider = new CompletionProvider(analyzer, typeResolver);

    documentCache.set(uri, {
      analyzer,
      typeResolver,
      completionProvider,
      version: textDocument.version,
    });

    // Get compilation errors from the analyzer
    const compilationErrors = analyzer.getCompilationErrors();
    connection.console.log(
      `Got ${compilationErrors.length} compilation errors from analyzer`
    );

    for (const error of compilationErrors) {
      if (diagnostics.length >= settings.maxNumberOfProblems) {
        break;
      }

      connection.console.log(
        `Processing error: ${error.message}, node: ${!!error.node}, sp: ${
          error.node?.sp
        }`
      );
      const pos = analyzer.offsetToPosition(error.node?.sp || 0);

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
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
      if (
        error.message &&
        error.message.includes("Cannot read properties of undefined")
      ) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: error.line, character: error.column },
          end: { line: error.line, character: error.column + 1 },
        },
        message: error.message,
        source: "ranger",
      });
    }
  } catch (error: any) {
    // Parsing threw an exception
    connection.console.error(
      `Exception in validateTextDocument: ${error.message}\nStack: ${error.stack}`
    );
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1 },
      },
      message: `Parse error: ${error.message || "Unknown error"}`,
      source: "ranger",
    });
  }

  connection.sendDiagnostics({ uri, diagnostics });
}

/**
 * Provide completion items using the real compiler's type information
 */
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
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
      const completions = cached.completionProvider.provideCompletions(
        offset,
        triggerChar
      );
      connection.console.log(
        `Completion provider returned ${completions.length} items`
      );
      return completions;
    } catch (error: any) {
      connection.console.error(
        `Error in onCompletion: ${error.message}\nStack: ${error.stack}`
      );
      return getBasicCompletions();
    }
  }
);

/**
 * Basic completions when compiler analysis is not available
 */
function getBasicCompletions(): CompletionItem[] {
  const completions: CompletionItem[] = [];

  // Keywords
  for (const keyword of KEYWORDS) {
    completions.push({
      label: keyword.name,
      kind: CompletionItemKind.Keyword,
      detail: keyword.description,
      insertText: keyword.name,
    });
  }

  // Types
  for (const type of TYPES) {
    completions.push({
      label: type.name,
      kind: CompletionItemKind.TypeParameter,
      detail: type.description,
      insertText: type.name,
    });
  }

  return completions;
}
/**
 * Resolve additional information for a completion item
 */
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

/**
 * Provide hover information using the real compiler's type information
 */
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
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
    connection.console.log(
      `Hover at offset ${offset}, position line:${params.position.line}, char:${params.position.character}`
    );

    // Get the node at this position for debugging
    const node = cached.analyzer.findNodeAtOffset(offset);

    connection.console.log(
      `Found node: ${!!node}, vref: ${node?.vref}, eval_type_name: ${
        node?.eval_type_name
      }`
    );

    // Build debug information
    let debugInfo = "**AST Debug Info:**\n\n";
    debugInfo += `- **Offset**: ${offset}\n`;
    debugInfo += `- **Position**: Line ${params.position.line}, Char ${params.position.character}\n\n`;

    if (node) {
      debugInfo += `- **vref**: \`${node.vref || "none"}\`\n`;
      debugInfo += `- **eval_type_name**: \`${
        node.eval_type_name || "not set"
      }\`\n`;
      debugInfo += `- **type_name**: \`${node.type_name || "not set"}\`\n`;
      debugInfo += `- **value_type**: \`${node.value_type || "not set"}\`\n`;
      debugInfo += `- **has_call**: \`${node.has_call || false}\`\n`;
      debugInfo += `- **Node range**: \`${node.sp}-${node.ep}\`\n`;
      debugInfo += `- **Children count**: \`${
        node.children ? node.children.length : 0
      }\`\n`;

      // Check if this is a variable reference and look for its definition
      if (node.vref) {
        const text = document.getText();
        const varName = node.vref;
        const beforeText = text.substring(0, offset);

        // Look for def pattern
        const defPattern = new RegExp(
          `def\\s+${varName}\\s*(?::\\s*(\\w+))?\\s*(.{0,30})`,
          "g"
        );
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
    } else {
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
        const properties = hoverInfo.members.filter(
          (m) => m.kind === "property"
        );
        const methods = hoverInfo.members.filter((m) => m.kind === "method");
        const staticMethods = hoverInfo.members.filter(
          (m) => m.kind === "static-method"
        );

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
            debugInfo += `- \`${method.name}()\`: \`${
              method.type || "void"
            }\`\n`;
          });
          debugInfo += `\n`;
        }

        if (staticMethods.length > 0) {
          debugInfo += `*Static Methods:*\n`;
          staticMethods.forEach((method) => {
            debugInfo += `- \`${method.name}()\`: \`${
              method.type || "void"
            }\`\n`;
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
  } catch (error: any) {
    connection.console.error(
      `Error in onHover: ${error.message}\nStack: ${error.stack}`
    );
    return null;
  }
});

/**
 * Provide document symbols (outline) using compiler analysis
 */
connection.onDocumentSymbol(
  (params: DocumentSymbolParams): SymbolInformation[] => {
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

      const symbols: SymbolInformation[] = [];

      // Get classes from analyzer
      const classes = cached.analyzer.getDefinedClasses();
      for (const [className, classInfo] of classes) {
        if (classInfo.node) {
          const pos = cached.analyzer.offsetToPosition(classInfo.node.sp);
          symbols.push({
            name: className,
            kind: SymbolKind.Class,
            location: Location.create(
              params.textDocument.uri,
              Range.create(pos, pos)
            ),
          });

          // Add methods
          for (const method of [
            ...classInfo.methods,
            ...classInfo.staticMethods,
          ]) {
            if (method.node) {
              const methodPos = cached.analyzer.offsetToPosition(
                method.node.sp
              );
              symbols.push({
                name: method.name,
                kind:
                  method.kind === "static-method"
                    ? SymbolKind.Function
                    : SymbolKind.Method,
                location: Location.create(
                  params.textDocument.uri,
                  Range.create(methodPos, methodPos)
                ),
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
            kind: SymbolKind.Enum,
            location: Location.create(
              params.textDocument.uri,
              Range.create(pos, pos)
            ),
          });
        }
      }

      return symbols;
    } catch (error: any) {
      connection.console.error(
        `Error in onDocumentSymbol: ${error.message}\nStack: ${error.stack}`
      );
      return [];
    }
  }
);

/**
 * Basic symbol extraction using regex (fallback)
 */
function getBasicSymbols(
  document: TextDocument,
  uri: string
): SymbolInformation[] {
  const text = document.getText();
  const symbols: SymbolInformation[] = [];

  // Find classes
  const classRegex = /\b(class|extension)\s+(\w+)/g;
  let match;
  while ((match = classRegex.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    symbols.push({
      name: match[2],
      kind: SymbolKind.Class,
      location: Location.create(uri, Range.create(startPos, startPos)),
    });
  }

  // Find functions
  const fnRegex = /\b(fn|sfn)\s+(\w+)/g;
  while ((match = fnRegex.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    symbols.push({
      name: match[2],
      kind: match[1] === "sfn" ? SymbolKind.Function : SymbolKind.Method,
      location: Location.create(uri, Range.create(startPos, startPos)),
    });
  }

  return symbols;
}

// Helper function to get word at offset (kept for potential future use)
function getWordAtOffset(text: string, offset: number): string | null {
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
