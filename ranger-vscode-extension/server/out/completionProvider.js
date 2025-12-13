"use strict";
/**
 * Completion Provider for Ranger Language Server
 *
 * Provides context-aware code completion using the real compiler's type information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionProvider = void 0;
const node_1 = require("vscode-languageserver/node");
const keywords_1 = require("./keywords");
class CompletionProvider {
    constructor(analyzer, typeResolver) {
        this.analyzer = analyzer;
        this.typeResolver = typeResolver;
    }
    /**
     * Provide completions at a given offset
     */
    provideCompletions(offset, triggerCharacter) {
        // Member access (after '.')
        if (triggerCharacter === ".") {
            return this.provideMemberCompletions(offset);
        }
        // Property access (after '@')
        if (triggerCharacter === "@") {
            return this.providePropertyCompletions(offset);
        }
        // Type annotation context (after ':')
        if (triggerCharacter === ":") {
            return this.provideTypeCompletions();
        }
        // Default: provide all available symbols
        return this.provideDefaultCompletions(offset);
    }
    /**
     * Provide member completions (methods and properties after '.')
     */
    provideMemberCompletions(offset) {
        const context = this.analyzer.isMethodAccessContext(offset);
        if (!context.isMethodAccess || !context.targetType) {
            console.log("[Completion Provider] Not a method access context or no target type");
            return [];
        }
        console.log("[Completion Provider] Target type:", context.targetType);
        const members = this.typeResolver.getMemberCompletions(context.targetType);
        console.log("[Completion Provider] Found members:", members.length);
        const completions = members.map((member) => {
            const item = {
                label: member.name,
                kind: this.symbolKindToCompletionKind(member.kind),
                detail: member.type,
                documentation: member.documentation,
                insertText: member.name,
            };
            console.log("[Completion Provider] Member completion item:", JSON.stringify(item, null, 2));
            return item;
        });
        console.log("[Completion Provider] Returning", completions.length, "completion items");
        return completions;
    }
    /**
     * Provide property completions (after '@')
     */
    providePropertyCompletions(offset) {
        const properties = this.typeResolver.getPropertyCompletions(offset);
        return properties.map((prop) => ({
            label: prop.name,
            kind: node_1.CompletionItemKind.Property,
            detail: prop.type,
            documentation: prop.documentation,
            insertText: prop.name,
        }));
    }
    /**
     * Provide type completions (after ':' in type annotations)
     */
    provideTypeCompletions() {
        const completions = [];
        // Built-in types
        for (const type of keywords_1.TYPES) {
            completions.push({
                label: type.name,
                kind: node_1.CompletionItemKind.TypeParameter,
                detail: type.description,
                insertText: type.name,
            });
        }
        // User-defined classes
        const classes = this.analyzer.getDefinedClasses();
        for (const [className, classInfo] of classes) {
            if (!classInfo.isSystemClass) {
                completions.push({
                    label: className,
                    kind: node_1.CompletionItemKind.Class,
                    detail: `class ${className}`,
                    insertText: className,
                });
            }
        }
        // Enums
        const enums = this.analyzer.getDefinedEnums();
        for (const [enumName, enumInfo] of enums) {
            completions.push({
                label: enumName,
                kind: node_1.CompletionItemKind.Enum,
                detail: enumInfo.documentation,
                insertText: enumName,
            });
        }
        return completions;
    }
    /**
     * Provide default completions (keywords, symbols in scope, etc.)
     */
    provideDefaultCompletions(offset) {
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
        // Built-in functions
        for (const func of keywords_1.BUILT_IN_FUNCTIONS) {
            completions.push({
                label: func.name,
                kind: node_1.CompletionItemKind.Function,
                detail: func.description,
                documentation: func.signature,
                insertText: func.name,
            });
        }
        // Operators
        for (const op of keywords_1.OPERATORS) {
            completions.push({
                label: op.name,
                kind: node_1.CompletionItemKind.Operator,
                detail: op.description,
                insertText: op.name,
            });
        }
        // Symbols in scope
        const symbols = this.analyzer.getAllSymbolsInScope(offset);
        for (const symbol of symbols) {
            completions.push({
                label: symbol.name,
                kind: this.symbolKindToCompletionKind(symbol.kind),
                detail: symbol.type,
                documentation: symbol.documentation,
                insertText: symbol.name,
            });
        }
        return completions;
    }
    /**
     * Convert symbol kind to LSP completion item kind
     */
    symbolKindToCompletionKind(kind) {
        switch (kind) {
            case "class":
                return node_1.CompletionItemKind.Class;
            case "method":
            case "static-method":
                return node_1.CompletionItemKind.Method;
            case "property":
                return node_1.CompletionItemKind.Property;
            case "variable":
            case "parameter":
                return node_1.CompletionItemKind.Variable;
            case "enum":
                return node_1.CompletionItemKind.Enum;
            default:
                return node_1.CompletionItemKind.Text;
        }
    }
    /**
     * Resolve additional details for a completion item
     */
    resolveCompletionItem(item) {
        // Add more detailed documentation if needed
        return item;
    }
}
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=completionProvider.js.map