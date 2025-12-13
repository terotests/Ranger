/**
 * Completion Provider for Ranger Language Server
 *
 * Provides context-aware code completion using the real compiler's type information
 */

import { CompletionItem, CompletionItemKind } from "vscode-languageserver/node";
import { ASTAnalyzer, SymbolInfo } from "./astAnalyzer";
import { TypeResolver } from "./typeResolver";
import {
  KEYWORDS,
  TYPES,
  OPERATORS,
  BUILT_IN_FUNCTIONS,
  ANNOTATIONS,
} from "./keywords";

export class CompletionProvider {
  constructor(
    private analyzer: ASTAnalyzer,
    private typeResolver: TypeResolver
  ) {}

  /**
   * Provide completions at a given offset
   */
  provideCompletions(
    offset: number,
    triggerCharacter?: string
  ): CompletionItem[] {
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
  private provideMemberCompletions(offset: number): CompletionItem[] {
    const context = this.analyzer.isMethodAccessContext(offset);

    if (!context.isMethodAccess || !context.targetType) {
      console.log(
        "[Completion Provider] Not a method access context or no target type"
      );
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
      console.log(
        "[Completion Provider] Member completion item:",
        JSON.stringify(item, null, 2)
      );
      return item;
    });

    console.log(
      "[Completion Provider] Returning",
      completions.length,
      "completion items"
    );
    return completions;
  }

  /**
   * Provide property completions (after '@')
   */
  private providePropertyCompletions(offset: number): CompletionItem[] {
    const properties = this.typeResolver.getPropertyCompletions(offset);

    return properties.map((prop) => ({
      label: prop.name,
      kind: CompletionItemKind.Property,
      detail: prop.type,
      documentation: prop.documentation,
      insertText: prop.name,
    }));
  }

  /**
   * Provide type completions (after ':' in type annotations)
   */
  private provideTypeCompletions(): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Built-in types
    for (const type of TYPES) {
      completions.push({
        label: type.name,
        kind: CompletionItemKind.TypeParameter,
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
          kind: CompletionItemKind.Class,
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
        kind: CompletionItemKind.Enum,
        detail: enumInfo.documentation,
        insertText: enumName,
      });
    }

    return completions;
  }

  /**
   * Provide default completions (keywords, symbols in scope, etc.)
   */
  private provideDefaultCompletions(offset: number): CompletionItem[] {
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

    // Built-in functions
    for (const func of BUILT_IN_FUNCTIONS) {
      completions.push({
        label: func.name,
        kind: CompletionItemKind.Function,
        detail: func.description,
        documentation: func.signature,
        insertText: func.name,
      });
    }

    // Operators
    for (const op of OPERATORS) {
      completions.push({
        label: op.name,
        kind: CompletionItemKind.Operator,
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
  private symbolKindToCompletionKind(kind: string): CompletionItemKind {
    switch (kind) {
      case "class":
        return CompletionItemKind.Class;
      case "method":
      case "static-method":
        return CompletionItemKind.Method;
      case "property":
        return CompletionItemKind.Property;
      case "variable":
      case "parameter":
        return CompletionItemKind.Variable;
      case "enum":
        return CompletionItemKind.Enum;
      default:
        return CompletionItemKind.Text;
    }
  }

  /**
   * Resolve additional details for a completion item
   */
  resolveCompletionItem(item: CompletionItem): CompletionItem {
    // Add more detailed documentation if needed
    return item;
  }
}
