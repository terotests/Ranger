/**
 * Ranger Language Parser
 *
 * A simple parser for the Ranger language that provides:
 * - Syntax error detection
 * - Symbol extraction
 * - Basic semantic analysis
 */

export interface ParseError {
  message: string;
  line: number;
  column: number;
  length?: number;
}

export interface RangerSymbol {
  name: string;
  kind: "class" | "method" | "property" | "variable" | "enum" | "function";
  type?: string;
  line: number;
  column: number;
  children?: RangerSymbol[];
  annotations?: string[];
  isStatic?: boolean;
}

export interface ParseResult {
  symbols: RangerSymbol[];
  errors: ParseError[];
}

/**
 * Token types for the lexer
 */
enum TokenType {
  // Literals
  STRING,
  NUMBER,
  IDENTIFIER,

  // Brackets
  LPAREN,
  RPAREN,
  LBRACE,
  RBRACE,
  LBRACKET,
  RBRACKET,

  // Punctuation
  COLON,
  AT,
  DOT,

  // Operators
  OPERATOR,

  // Special
  COMMENT,
  NEWLINE,
  EOF,
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Simple lexer for Ranger language
 */
class Lexer {
  private text: string;
  private pos: number = 0;
  private line: number = 0;
  private column: number = 0;

  constructor(text: string) {
    this.text = text;
  }

  private peek(): string {
    return this.text[this.pos] || "";
  }

  private advance(): string {
    const char = this.text[this.pos++];
    if (char === "\n") {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (this.pos < this.text.length) {
      const char = this.peek();
      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
      } else {
        break;
      }
    }
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.text.length) {
      this.skipWhitespace();

      if (this.pos >= this.text.length) break;

      const char = this.peek();
      const startLine = this.line;
      const startColumn = this.column;

      // Newline
      if (char === "\n") {
        this.advance();
        tokens.push({
          type: TokenType.NEWLINE,
          value: "\n",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Comment
      if (char === ";") {
        let comment = "";
        while (this.pos < this.text.length && this.peek() !== "\n") {
          comment += this.advance();
        }
        tokens.push({
          type: TokenType.COMMENT,
          value: comment,
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // String
      if (char === '"') {
        let str = this.advance();
        while (this.pos < this.text.length && this.peek() !== '"') {
          if (this.peek() === "\\") {
            str += this.advance();
          }
          str += this.advance();
        }
        if (this.peek() === '"') {
          str += this.advance();
        }
        tokens.push({
          type: TokenType.STRING,
          value: str,
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Brackets
      if (char === "(") {
        this.advance();
        tokens.push({
          type: TokenType.LPAREN,
          value: "(",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === ")") {
        this.advance();
        tokens.push({
          type: TokenType.RPAREN,
          value: ")",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === "{") {
        this.advance();
        tokens.push({
          type: TokenType.LBRACE,
          value: "{",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === "}") {
        this.advance();
        tokens.push({
          type: TokenType.RBRACE,
          value: "}",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === "[") {
        this.advance();
        tokens.push({
          type: TokenType.LBRACKET,
          value: "[",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === "]") {
        this.advance();
        tokens.push({
          type: TokenType.RBRACKET,
          value: "]",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Punctuation
      if (char === ":") {
        this.advance();
        tokens.push({
          type: TokenType.COLON,
          value: ":",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === "@") {
        this.advance();
        tokens.push({
          type: TokenType.AT,
          value: "@",
          line: startLine,
          column: startColumn,
        });
        continue;
      }
      if (char === ".") {
        this.advance();
        tokens.push({
          type: TokenType.DOT,
          value: ".",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let num = "";
        while (this.pos < this.text.length && /[0-9.]/.test(this.peek())) {
          num += this.advance();
        }
        tokens.push({
          type: TokenType.NUMBER,
          value: num,
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        let ident = "";
        while (
          this.pos < this.text.length &&
          /[a-zA-Z0-9_!?]/.test(this.peek())
        ) {
          ident += this.advance();
        }
        tokens.push({
          type: TokenType.IDENTIFIER,
          value: ident,
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Operators
      const operators = [
        "==",
        "!=",
        "<=",
        ">=",
        "&&",
        "||",
        "??",
        "+",
        "-",
        "*",
        "/",
        "%",
        "<",
        ">",
        "=",
        "!",
      ];
      let matched = false;
      for (const op of operators) {
        if (this.text.substr(this.pos, op.length) === op) {
          for (let i = 0; i < op.length; i++) this.advance();
          tokens.push({
            type: TokenType.OPERATOR,
            value: op,
            line: startLine,
            column: startColumn,
          });
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Unknown character - skip it
      this.advance();
    }

    tokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.line,
      column: this.column,
    });
    return tokens;
  }
}

/**
 * Ranger Parser
 */
export class RangerParser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private errors: ParseError[] = [];
  private symbols: RangerSymbol[] = [];

  parse(text: string): ParseResult {
    const lexer = new Lexer(text);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.errors = [];
    this.symbols = [];

    this.parseProgram();

    return {
      symbols: this.symbols,
      errors: this.errors,
    };
  }

  private peek(): Token {
    return (
      this.tokens[this.pos] || {
        type: TokenType.EOF,
        value: "",
        line: 0,
        column: 0,
      }
    );
  }

  private advance(): Token {
    return (
      this.tokens[this.pos++] || {
        type: TokenType.EOF,
        value: "",
        line: 0,
        column: 0,
      }
    );
  }

  private skipNewlines(): void {
    while (
      this.peek().type === TokenType.NEWLINE ||
      this.peek().type === TokenType.COMMENT
    ) {
      this.advance();
    }
  }

  private parseProgram(): void {
    while (this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.EOF) break;

      const token = this.peek();

      if (token.type === TokenType.IDENTIFIER) {
        if (token.value === "class" || token.value === "extension") {
          this.parseClass();
        } else if (token.value === "Import") {
          this.parseImport();
        } else if (token.value === "Enum") {
          this.parseEnum();
        } else {
          this.advance();
        }
      } else {
        this.advance();
      }
    }
  }

  private parseClass(): void {
    const keyword = this.advance(); // 'class' or 'extension'
    this.skipNewlines();

    if (this.peek().type !== TokenType.IDENTIFIER) {
      this.errors.push({
        message: `Expected class name after '${keyword.value}'`,
        line: this.peek().line,
        column: this.peek().column,
      });
      return;
    }

    const nameToken = this.advance();
    const classSymbol: RangerSymbol = {
      name: nameToken.value,
      kind: "class",
      line: keyword.line,
      column: keyword.column,
      children: [],
    };

    this.skipNewlines();

    // Expect opening brace
    if (this.peek().type !== TokenType.LBRACE) {
      this.errors.push({
        message: `Expected '{' after class name`,
        line: this.peek().line,
        column: this.peek().column,
      });
      return;
    }
    this.advance();

    // Parse class body
    let braceDepth = 1;
    while (braceDepth > 0 && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();

      const token = this.peek();

      if (token.type === TokenType.LBRACE) {
        braceDepth++;
        this.advance();
      } else if (token.type === TokenType.RBRACE) {
        braceDepth--;
        this.advance();
      } else if (token.type === TokenType.IDENTIFIER) {
        if (token.value === "def") {
          const prop = this.parseProperty();
          if (prop) classSymbol.children?.push(prop);
        } else if (token.value === "fn" || token.value === "sfn") {
          const method = this.parseMethod();
          if (method) classSymbol.children?.push(method);
        } else if (token.value === "Constructor") {
          const ctor = this.parseConstructor();
          if (ctor) classSymbol.children?.push(ctor);
        } else {
          this.advance();
        }
      } else {
        this.advance();
      }
    }

    this.symbols.push(classSymbol);
  }

  private parseProperty(): RangerSymbol | null {
    const defToken = this.advance(); // 'def'
    this.skipNewlines();

    if (this.peek().type !== TokenType.IDENTIFIER) {
      return null;
    }

    const nameToken = this.advance();
    let type: string | undefined;

    // Check for annotations
    if (this.peek().type === TokenType.AT) {
      this.advance();
      // Skip annotation content
      if (this.peek().type === TokenType.LPAREN) {
        let depth = 1;
        this.advance();
        while (depth > 0 && this.peek().type !== TokenType.EOF) {
          if (this.peek().type === TokenType.LPAREN) depth++;
          else if (this.peek().type === TokenType.RPAREN) depth--;
          this.advance();
        }
      }
    }

    // Check for type annotation
    if (this.peek().type === TokenType.COLON) {
      this.advance();
      if (
        this.peek().type === TokenType.IDENTIFIER ||
        this.peek().type === TokenType.LBRACKET
      ) {
        type = this.parseTypeAnnotation();
      }
    }

    return {
      name: nameToken.value,
      kind: "property",
      type,
      line: defToken.line,
      column: defToken.column,
    };
  }

  private parseMethod(): RangerSymbol | null {
    const fnToken = this.advance(); // 'fn' or 'sfn'
    const isStatic = fnToken.value === "sfn";
    this.skipNewlines();

    if (this.peek().type !== TokenType.IDENTIFIER) {
      return null;
    }

    const nameToken = this.advance();
    let type: string | undefined;
    const annotations: string[] = [];

    // Check for annotations
    if (this.peek().type === TokenType.AT) {
      this.advance();
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        while (
          this.peek().type !== TokenType.RPAREN &&
          this.peek().type !== TokenType.EOF
        ) {
          if (this.peek().type === TokenType.IDENTIFIER) {
            annotations.push(this.advance().value);
          } else {
            this.advance();
          }
        }
        if (this.peek().type === TokenType.RPAREN) {
          this.advance();
        }
      }
    }

    // Check for return type
    if (this.peek().type === TokenType.COLON) {
      this.advance();
      type = this.parseTypeAnnotation();
    }

    return {
      name: nameToken.value,
      kind: isStatic ? "function" : "method",
      type,
      line: fnToken.line,
      column: fnToken.column,
      isStatic,
      annotations,
    };
  }

  private parseConstructor(): RangerSymbol | null {
    const ctorToken = this.advance(); // 'Constructor'

    return {
      name: "Constructor",
      kind: "method",
      line: ctorToken.line,
      column: ctorToken.column,
    };
  }

  private parseTypeAnnotation(): string {
    let type = "";

    // Handle array types [Type] or [Key:Value]
    if (this.peek().type === TokenType.LBRACKET) {
      type += this.advance().value;
      while (
        this.peek().type !== TokenType.RBRACKET &&
        this.peek().type !== TokenType.EOF
      ) {
        type += this.advance().value;
      }
      if (this.peek().type === TokenType.RBRACKET) {
        type += this.advance().value;
      }
    } else if (this.peek().type === TokenType.IDENTIFIER) {
      type = this.advance().value;
    }

    return type;
  }

  private parseImport(): void {
    this.advance(); // 'Import'
    // Skip the import path
    if (this.peek().type === TokenType.STRING) {
      this.advance();
    }
  }

  private parseEnum(): void {
    const enumToken = this.advance(); // 'Enum'
    this.skipNewlines();

    if (this.peek().type !== TokenType.IDENTIFIER) {
      return;
    }

    const nameToken = this.advance();

    this.symbols.push({
      name: nameToken.value,
      kind: "enum",
      line: enumToken.line,
      column: enumToken.column,
    });
  }
}
