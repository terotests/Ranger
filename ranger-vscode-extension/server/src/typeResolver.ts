/**
 * Type Resolver for Ranger Language Server
 *
 * Resolves types using the compiler's type inference results (eval_type_name)
 * and provides type information for autocomplete and hover.
 */

import { ASTAnalyzer, SymbolInfo, ClassInfo } from "./astAnalyzer";

export class TypeResolver {
  constructor(private analyzer: ASTAnalyzer) {}

  /**
   * Get the type of an expression at a given offset
   */
  getTypeAtOffset(offset: number): string | null {
    return this.analyzer.getTypeAtOffset(offset);
  }

  /**
   * Get all members (methods and properties) of a type
   */
  getTypeMembers(typeName: string): SymbolInfo[] {
    return this.analyzer.getClassMembers(typeName);
  }

  /**
   * Get completions for member access (after '.')
   */
  getMemberCompletions(targetType: string): SymbolInfo[] {
    return this.getTypeMembers(targetType);
  }

  /**
   * Get completions for property access (after '@')
   */
  getPropertyCompletions(offset: number): SymbolInfo[] {
    // Get the current class context
    const currentClass = this.analyzer.getCurrentClassContext(offset);
    if (!currentClass) return [];

    // Return all properties of the current class
    const classes = this.analyzer.getDefinedClasses();
    const classInfo = classes.get(currentClass);

    if (!classInfo) return [];

    return classInfo.properties;
  }

  /**
   * Resolve type information for hover tooltips
   */
  resolveHoverInfo(
    offset: number
  ): { type: string; documentation: string; members?: SymbolInfo[] } | null {
    const type = this.getTypeAtOffset(offset);
    if (!type) return null;

    // Get documentation for the type
    const doc = this.analyzer.getDocumentationForSymbol(type);

    // Check if this is a class type and get its members
    const members = this.getTypeMembers(type);

    return {
      type,
      documentation: doc || `Type: ${type}`,
      members: members.length > 0 ? members : undefined,
    };
  }

  /**
   * Check if a type is a built-in type
   */
  isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      "int",
      "double",
      "string",
      "boolean",
      "void",
      "char",
      "any",
      "null",
      "undefined",
    ];
    return builtInTypes.includes(typeName);
  }

  /**
   * Get the base type from a complex type (e.g., [string] -> string)
   */
  getBaseType(typeName: string): string {
    // Handle array types [T]
    const arrayMatch = typeName.match(/^\[(.+)\]$/);
    if (arrayMatch) {
      return arrayMatch[1];
    }

    // Handle map types [K:V]
    const mapMatch = typeName.match(/^\[(.+):(.+)\]$/);
    if (mapMatch) {
      return mapMatch[2]; // Return value type
    }

    // Handle optional types
    const optionalMatch = typeName.match(/^(.+)\?$/);
    if (optionalMatch) {
      return optionalMatch[1];
    }

    return typeName;
  }
}
