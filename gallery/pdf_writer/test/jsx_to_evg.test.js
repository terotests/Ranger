/**
 * JSX to EVG Integration Tests
 *
 * Tests the conversion pipeline:
 * TSX Source → TSParser AST → Expression Evaluation → EVG Element Tree
 *
 * Run with: npx vitest run jsx_to_evg.test.js
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  TSLexer,
  TSParserSimple,
} = require("../../ts_parser/benchmark/ts_parser_module.cjs");
const { EvalValue } = require("../bin/eval_value_module.cjs");

// ============================================================================
// JSXToEVG Converter
// ============================================================================

class JSXToEVG {
  constructor() {
    this.context = {}; // Variable context
    this.components = {}; // Registered components (local function declarations)
    // Primitive EVG elements that should not be expanded as components
    this.primitives = new Set([
      "View",
      "Label",
      "Print",
      "Section",
      "Page",
      "Image",
      "Path",
      "Line",
      "Rect",
      "Circle",
      "Ellipse",
      "Text",
      "Fragment",
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
    ]);
  }

  /**
   * Parse TSX source code
   */
  parse(source) {
    const lexer = new TSLexer(source);
    const tokens = lexer.tokenize();
    const parser = new TSParserSimple();
    parser.initParser(tokens);
    parser.setQuiet(true);
    parser.tsxMode = true;
    return parser.parseProgram();
  }

  /**
   * Main entry point - evaluate TSX source and return EVG tree
   */
  evaluate(source) {
    const ast = this.parse(source);

    // 1. Register local components (function declarations)
    this.registerComponents(ast);

    // 2. Process statements to build context (variable declarations)
    this.processStatements(ast);

    // 3. Find and evaluate render() function
    const renderFn = this.findRenderFunction(ast);
    if (!renderFn) {
      throw new Error("No render() function found");
    }

    return this.evaluateFunction(renderFn);
  }

  /**
   * Register function declarations as components
   */
  registerComponents(ast) {
    for (const node of ast.children || []) {
      if (node.nodeType === "FunctionDeclaration") {
        const name = node.name;
        if (name && name !== "render") {
          this.components[name] = node;
        }
      }
    }
  }

  /**
   * Process variable declarations to build context
   */
  processStatements(ast) {
    // For now, we handle variable declarations inside render()
    // Global const/let could be processed here
  }

  /**
   * Find the render() function
   */
  findRenderFunction(ast) {
    for (const node of ast.children || []) {
      if (node.nodeType === "FunctionDeclaration" && node.name === "render") {
        return node;
      }
    }
    return null;
  }

  /**
   * Evaluate a function and return its result
   */
  evaluateFunction(fnNode, props = {}) {
    // Create new context with props
    const savedContext = { ...this.context };

    // Add props to context
    for (const key of Object.keys(props)) {
      this.context[key] = props[key];
    }

    // Process function parameters with defaults
    this.processParams(fnNode.params, props);

    // Find the function body
    const body = fnNode.body || fnNode.left;

    // Process statements in function body
    if (body && body.children) {
      for (const stmt of body.children) {
        if (stmt.nodeType === "VariableDeclaration") {
          this.processVariableDeclaration(stmt);
        } else if (stmt.nodeType === "ReturnStatement") {
          const result = this.evaluateNode(stmt.left);
          this.context = savedContext;
          return result;
        }
      }
    }

    this.context = savedContext;
    return null;
  }

  /**
   * Process function parameters (including defaults)
   */
  processParams(params, providedProps) {
    if (!params) return;

    for (const param of params) {
      if (param.nodeType === "ObjectPattern") {
        // Destructured params: { color, size = 40 }
        for (const prop of param.children || []) {
          const name = prop.name;
          if (providedProps.hasOwnProperty(name)) {
            this.context[name] = providedProps[name];
          } else if (prop.init || prop.left) {
            // Default value
            const defaultVal = prop.init || prop.left;
            this.context[name] = this.evaluateNode(defaultVal);
          }
        }
      } else if (param.nodeType === "Identifier") {
        // Simple param - usually 'props'
        this.context[param.name] = providedProps;
      }
    }
  }

  /**
   * Process variable declaration
   */
  processVariableDeclaration(node) {
    // Handle: const x = value; or const { a, b } = obj;
    for (const decl of node.children || []) {
      if (decl.nodeType === "VariableDeclarator") {
        const name = decl.name || (decl.id && decl.id.name);
        const init = decl.init || decl.left;
        if (name && init) {
          this.context[name] = this.evaluateNode(init);
        }
      }
    }

    // Alternative structure: node.left is the declarator
    if (node.left && node.left.nodeType === "VariableDeclarator") {
      const decl = node.left;
      const name = decl.name || (decl.id && decl.id.name);
      const init = decl.init || decl.left;
      if (name && init) {
        this.context[name] = this.evaluateNode(init);
      }
    }
  }

  /**
   * Evaluate any AST node
   */
  evaluateNode(node) {
    if (!node) return null;

    switch (node.nodeType) {
      case "JSXElement":
        return this.evaluateJSXElement(node);

      case "JSXFragment":
        return this.evaluateJSXFragment(node);

      case "JSXExpressionContainer":
        return this.evaluateNode(node.expression || node.left);

      case "JSXText":
        return this.cleanJSXText(node.value);

      case "NumericLiteral":
        return parseFloat(node.value);

      case "StringLiteral":
        return node.value;

      case "BooleanLiteral":
        return node.value === "true" || node.value === true;

      case "NullLiteral":
        return null;

      case "Identifier":
        return this.context[node.name];

      case "BinaryExpression":
        return this.evaluateBinaryExpression(node);

      case "ConditionalExpression":
        return this.evaluateConditionalExpression(node);

      case "LogicalExpression":
        return this.evaluateLogicalExpression(node);

      case "UnaryExpression":
        return this.evaluateUnaryExpression(node);

      case "MemberExpression":
        return this.evaluateMemberExpression(node);

      case "CallExpression":
        return this.evaluateCallExpression(node);

      case "ArrayExpression":
        return this.evaluateArrayExpression(node);

      case "ObjectExpression":
        return this.evaluateObjectExpression(node);

      case "ArrowFunctionExpression":
        // Return the node itself - will be called later
        return { __arrowFn: node, __context: { ...this.context } };

      case "ParenthesizedExpression":
        return this.evaluateNode(node.left || node.expression);

      default:
        console.log("Unknown node type:", node.nodeType, node);
        return null;
    }
  }

  /**
   * Evaluate JSX Element → EVG object
   */
  evaluateJSXElement(node) {
    // JSXElement structure: node.left = JSXOpeningElement
    const openingElement = node.left || node.openingElement;
    const tagName = openingElement
      ? openingElement.name
      : node.name || node.tagName;

    // Check if it's a component (capitalized)
    if (this.isComponent(tagName)) {
      return this.expandComponent(tagName, node);
    }

    // Primitive element - convert to EVG
    return this.createEVGElement(tagName, node);
  }

  /**
   * Evaluate JSX Fragment
   */
  evaluateJSXFragment(node) {
    const children = this.evaluateChildren(node.children);
    return {
      type: "Fragment",
      props: {},
      children: children,
    };
  }

  /**
   * Check if tag name is a component (starts with uppercase and not a primitive)
   */
  isComponent(name) {
    if (!name) return false;
    // Check if it's a registered component or not a primitive
    if (this.components[name]) return true;
    if (this.primitives.has(name)) return false;
    return name[0] === name[0].toUpperCase();
  }

  /**
   * Expand a component into EVG
   */
  expandComponent(name, jsxNode) {
    const component = this.components[name];
    if (!component) {
      throw new Error(`Unknown component: ${name}`);
    }

    // Evaluate props from JSX attributes
    const props = this.evaluateAttributes(jsxNode);

    // Add children to props if present
    const children = this.evaluateChildren(jsxNode.children);
    if (children.length > 0) {
      props.children = children;
    }

    // Call component function
    return this.evaluateFunction(component, props);
  }

  /**
   * Create EVG element from primitive JSX
   */
  createEVGElement(tagName, jsxNode) {
    const props = this.evaluateAttributes(jsxNode);
    const children = this.evaluateChildren(jsxNode.children);

    return {
      type: tagName,
      props: props,
      children: children,
    };
  }

  /**
   * Evaluate JSX attributes into props object
   * TSParser JSX structure:
   *   JSXElement.left = JSXOpeningElement
   *   JSXOpeningElement.name = tag name
   *   JSXOpeningElement.children = array of JSXAttribute
   *   JSXAttribute.name = attribute name
   *   JSXAttribute.right = attribute value (StringLiteral or JSXExpressionContainer)
   */
  evaluateAttributes(jsxNode) {
    const props = {};

    // Get opening element - attributes are in its children
    const openingElement = jsxNode.left || jsxNode.openingElement;
    const attrs = openingElement
      ? openingElement.children || []
      : jsxNode.attributes || [];

    for (const attr of attrs) {
      if (attr.nodeType === "JSXAttribute") {
        const name = attr.name;
        // Value is in 'right' field for TSParser
        const valueNode = attr.right || attr.value || attr.left;

        if (!valueNode) {
          // Boolean attribute: <View disabled />
          props[name] = true;
        } else if (valueNode.nodeType === "StringLiteral") {
          props[name] = valueNode.value;
        } else if (valueNode.nodeType === "JSXExpressionContainer") {
          props[name] = this.evaluateNode(
            valueNode.expression || valueNode.left
          );
        } else {
          props[name] = this.evaluateNode(valueNode);
        }
      }
    }

    return props;
  }

  /**
   * Evaluate JSX children
   */
  evaluateChildren(children) {
    if (!children) return [];

    const result = [];
    let textAccum = ""; // Accumulate consecutive text nodes

    const flushText = () => {
      if (textAccum.trim()) {
        result.push(textAccum.trim());
      }
      textAccum = "";
    };

    for (const child of children) {
      if (child.nodeType === "JSXText") {
        // Accumulate text, adding space between words
        const text = child.value || "";
        if (textAccum && text) {
          textAccum += " " + text;
        } else {
          textAccum += text;
        }
        continue;
      }

      // Flush any accumulated text before non-text node
      flushText();

      const evaluated = this.evaluateNode(child);

      // Skip empty/null values
      if (evaluated === null || evaluated === undefined) continue;
      if (typeof evaluated === "string" && evaluated.trim() === "") continue;

      // Flatten arrays (from map())
      if (Array.isArray(evaluated)) {
        result.push(...evaluated);
      } else if (evaluated === false) {
        // Skip false (from && conditionals)
        continue;
      } else {
        result.push(evaluated);
      }
    }

    // Flush any remaining text
    flushText();

    return result;
  }

  /**
   * Clean JSX text content
   */
  cleanJSXText(text) {
    if (!text) return "";
    // Collapse whitespace, trim
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Evaluate binary expression
   */
  evaluateBinaryExpression(node) {
    const op = node.value || node.operator;

    // Handle logical operators with short-circuit evaluation
    // TSParser generates these as BinaryExpression, not LogicalExpression
    if (op === "&&") {
      const left = this.evaluateNode(node.left);
      return left ? this.evaluateNode(node.right) : left;
    }
    if (op === "||") {
      const left = this.evaluateNode(node.left);
      return left ? left : this.evaluateNode(node.right);
    }

    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);

    switch (op) {
      case "+":
        return typeof left === "string" || typeof right === "string"
          ? String(left) + String(right)
          : left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "**":
        return left ** right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      case "==":
        return left == right;
      case "===":
        return left === right;
      case "!=":
        return left != right;
      case "!==":
        return left !== right;
      default:
        return null;
    }
  }

  /**
   * Evaluate conditional (ternary) expression
   */
  evaluateConditionalExpression(node) {
    const test = this.evaluateNode(node.test);
    if (test) {
      return this.evaluateNode(node.consequent);
    }
    return this.evaluateNode(node.alternate);
  }

  /**
   * Evaluate logical expression (&&, ||)
   */
  evaluateLogicalExpression(node) {
    const op = node.value || node.operator;
    const left = this.evaluateNode(node.left);

    if (op === "&&") {
      return left ? this.evaluateNode(node.right) : left;
    }
    if (op === "||") {
      return left ? left : this.evaluateNode(node.right);
    }
    return null;
  }

  /**
   * Evaluate unary expression
   */
  evaluateUnaryExpression(node) {
    const op = node.value || node.operator;
    const arg = this.evaluateNode(node.left || node.argument);

    switch (op) {
      case "!":
        return !arg;
      case "-":
        return -arg;
      case "+":
        return +arg;
      default:
        return null;
    }
  }

  /**
   * Evaluate member expression (obj.prop or arr[i])
   */
  evaluateMemberExpression(node) {
    const obj = this.evaluateNode(node.left || node.object);

    if (node.computed || node.right) {
      // Computed: arr[0]
      const index = this.evaluateNode(node.right || node.property);
      return obj?.[index];
    } else {
      // Non-computed: obj.prop
      const propName = node.name || (node.property && node.property.name);
      return obj?.[propName];
    }
  }

  /**
   * Evaluate call expression
   */
  evaluateCallExpression(node) {
    const callee = node.left || node.callee;

    // Check for method calls like arr.map()
    if (callee.nodeType === "MemberExpression") {
      const obj = this.evaluateNode(callee.left || callee.object);
      const methodName =
        callee.name || (callee.property && callee.property.name);
      // TSParser puts call arguments in 'children', not 'params'
      const args = this.evaluateArgs(
        node.children || node.params || node.arguments
      );

      // Handle array methods
      if (Array.isArray(obj)) {
        if (methodName === "map") {
          return this.evaluateArrayMap(obj, args[0]);
        }
        if (methodName === "filter") {
          return this.evaluateArrayFilter(obj, args[0]);
        }
        if (methodName === "join") {
          return obj.join(args[0] || ",");
        }
      }

      // Handle string methods
      if (typeof obj === "string") {
        if (methodName === "toUpperCase") return obj.toUpperCase();
        if (methodName === "toLowerCase") return obj.toLowerCase();
        if (methodName === "trim") return obj.trim();
      }

      return null;
    }

    // Regular function call
    const fnName = callee.name;
    // TSParser puts call arguments in 'children', not 'params'
    const args = this.evaluateArgs(
      node.children || node.params || node.arguments
    );

    // Check if it's a registered component/function
    if (this.components[fnName]) {
      // Call as function, not component
      return this.evaluateFunction(this.components[fnName], args[0] || {});
    }

    return null;
  }

  /**
   * Evaluate function arguments
   */
  evaluateArgs(args) {
    if (!args) return [];
    return args.map((arg) => this.evaluateNode(arg));
  }

  /**
   * Evaluate array.map() with callback
   */
  evaluateArrayMap(arr, callback) {
    if (!callback || !callback.__arrowFn) {
      return arr;
    }

    const fnNode = callback.__arrowFn;
    const savedContext = callback.__context;

    return arr.map((item, index) => {
      // Restore context
      const prevContext = { ...this.context };
      this.context = { ...savedContext };

      // Get param name
      const params = fnNode.params || [];
      if (params[0]) {
        const paramName = params[0].name;
        this.context[paramName] = item;
      }
      if (params[1]) {
        const indexName = params[1].name;
        this.context[indexName] = index;
      }

      // Evaluate body
      const body = fnNode.body || fnNode.left;
      let result;

      if (body.nodeType === "BlockStatement") {
        // { return ... }
        for (const stmt of body.children || []) {
          if (stmt.nodeType === "ReturnStatement") {
            result = this.evaluateNode(stmt.left);
            break;
          }
        }
      } else {
        // Implicit return: x => <Label>{x}</Label>
        result = this.evaluateNode(body);
      }

      this.context = prevContext;
      return result;
    });
  }

  /**
   * Evaluate array.filter() with callback
   */
  evaluateArrayFilter(arr, callback) {
    if (!callback || !callback.__arrowFn) {
      return arr;
    }

    const fnNode = callback.__arrowFn;
    const savedContext = callback.__context;

    return arr.filter((item, index) => {
      const prevContext = { ...this.context };
      this.context = { ...savedContext };

      const params = fnNode.params || [];
      if (params[0]) {
        this.context[params[0].name] = item;
      }
      if (params[1]) {
        this.context[params[1].name] = index;
      }

      const body = fnNode.body || fnNode.left;
      let result;

      if (body.nodeType === "BlockStatement") {
        for (const stmt of body.children || []) {
          if (stmt.nodeType === "ReturnStatement") {
            result = this.evaluateNode(stmt.left);
            break;
          }
        }
      } else {
        result = this.evaluateNode(body);
      }

      this.context = prevContext;
      return result;
    });
  }

  /**
   * Evaluate array expression
   */
  evaluateArrayExpression(node) {
    return (node.children || []).map((el) => this.evaluateNode(el));
  }

  /**
   * Evaluate object expression
   */
  evaluateObjectExpression(node) {
    const result = {};
    for (const prop of node.children || []) {
      const key = prop.name || (prop.key && prop.key.name);
      const value = this.evaluateNode(prop.left || prop.value);
      result[key] = value;
    }
    return result;
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("JSX to EVG Conversion", () => {
  let converter;

  beforeEach(() => {
    converter = new JSXToEVG();
  });

  describe("Simple Elements", () => {
    it("converts View with string props", () => {
      const source = `
        function render() {
          return <View width="100" height="50" />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.props.width).toBe("100");
      expect(evg.props.height).toBe("50");
    });

    it("converts Label with text child", () => {
      const source = `
        function render() {
          return <Label>Hello World</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("Label");
      expect(evg.children[0]).toBe("Hello World");
    });

    it("converts nested elements", () => {
      const source = `
        function render() {
          return (
            <View>
              <Label>Hello</Label>
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.children).toHaveLength(1);
      expect(evg.children[0].type).toBe("Label");
      expect(evg.children[0].children[0]).toBe("Hello");
    });

    it("converts multiple children", () => {
      const source = `
        function render() {
          return (
            <View>
              <Label>First</Label>
              <Label>Second</Label>
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(2);
      expect(evg.children[0].children[0]).toBe("First");
      expect(evg.children[1].children[0]).toBe("Second");
    });
  });

  describe("Expression Props", () => {
    it("evaluates numeric expression in prop", () => {
      const source = `
        function render() {
          const width = 100;
          return <View width={width * 2} />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.width).toBe(200);
    });

    it("evaluates variable in prop", () => {
      const source = `
        function render() {
          const color = "#FF0000";
          return <Label color={color}>Red</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#FF0000");
    });

    it("evaluates ternary in prop", () => {
      const source = `
        function render() {
          const dark = true;
          return <View backgroundColor={dark ? "#000" : "#fff"} />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.backgroundColor).toBe("#000");
    });

    it("evaluates comparison in prop", () => {
      const source = `
        function render() {
          const count = 10;
          return <Label visible={count > 5}>Visible</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.visible).toBe(true);
    });
  });

  describe("Expression Children", () => {
    it("evaluates variable in text child", () => {
      const source = `
        function render() {
          const name = "World";
          return <Label>Hello {name}</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toContain("World");
    });

    it("evaluates expression in text child", () => {
      const source = `
        function render() {
          const x = 5;
          const y = 3;
          return <Label>Sum: {x + y}</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toContain(8);
    });
  });

  describe("Local Components", () => {
    it("expands simple component", () => {
      const source = `
        function Star() {
          return <Label>★</Label>;
        }
        
        function render() {
          return <Star />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("Label");
      expect(evg.children[0]).toBe("★");
    });

    it("passes props to component", () => {
      const source = `
        function Star({ color }) {
          return <Label color={color}>★</Label>;
        }
        
        function render() {
          return <Star color="#FFD700" />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#FFD700");
    });

    it("uses default props", () => {
      const source = `
        function Star({ color = "#FFD700", size = 40 }) {
          return <Label fontSize={size} color={color}>★</Label>;
        }
        
        function render() {
          return <Star />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#FFD700");
      expect(evg.props.fontSize).toBe(40);
    });

    it("overrides default props", () => {
      const source = `
        function Star({ color = "#FFD700" }) {
          return <Label color={color}>★</Label>;
        }
        
        function render() {
          return <Star color="#C0C0C0" />;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#C0C0C0");
    });

    it("expands nested components", () => {
      const source = `
        function Icon({ symbol }) {
          return <Label>{symbol}</Label>;
        }
        
        function Badge({ children }) {
          return <View backgroundColor="#blue">{children}</View>;
        }
        
        function render() {
          return (
            <Badge>
              <Icon symbol="★" />
            </Badge>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.props.backgroundColor).toBe("#blue");
      expect(evg.children[0].type).toBe("Label");
      expect(evg.children[0].children[0]).toBe("★");
    });
  });

  describe("Children Prop", () => {
    it("passes children to component", () => {
      const source = `
        function Box({ children }) {
          return <View padding="10">{children}</View>;
        }
        
        function render() {
          return (
            <Box>
              <Label>Inside</Label>
            </Box>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.type).toBe("View");
      expect(evg.props.padding).toBe("10");
      expect(evg.children[0].type).toBe("Label");
      expect(evg.children[0].children[0]).toBe("Inside");
    });

    it("passes multiple children", () => {
      const source = `
        function Box({ children }) {
          return <View>{children}</View>;
        }
        
        function render() {
          return (
            <Box>
              <Label>One</Label>
              <Label>Two</Label>
            </Box>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(2);
    });
  });

  describe("Conditional Rendering", () => {
    it("renders with && when true", () => {
      const source = `
        function render() {
          const show = true;
          return (
            <View>
              {show && <Label>Visible</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(1);
      expect(evg.children[0].type).toBe("Label");
    });

    it("skips with && when false", () => {
      const source = `
        function render() {
          const show = false;
          return (
            <View>
              {show && <Label>Hidden</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(0);
    });

    it("renders ternary true branch", () => {
      const source = `
        function render() {
          const active = true;
          return (
            <View>
              {active ? <Label>Active</Label> : <Label>Inactive</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children[0].children[0]).toBe("Active");
    });

    it("renders ternary false branch", () => {
      const source = `
        function render() {
          const active = false;
          return (
            <View>
              {active ? <Label>Active</Label> : <Label>Inactive</Label>}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children[0].children[0]).toBe("Inactive");
    });
  });

  describe("Array.map()", () => {
    it("renders list with map", () => {
      const source = `
        function render() {
          const items = ["A", "B", "C"];
          return (
            <View>
              {items.map((x) => <Label>{x}</Label>)}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children).toHaveLength(3);
      expect(evg.children[0].type).toBe("Label");
      expect(evg.children[0].children[0]).toBe("A");
      expect(evg.children[1].children[0]).toBe("B");
      expect(evg.children[2].children[0]).toBe("C");
    });

    it("maps with expression", () => {
      const source = `
        function render() {
          const numbers = [1, 2, 3];
          return (
            <View>
              {numbers.map((n) => <Label>Number: {n * 2}</Label>)}
            </View>
          );
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children[0].children).toContain(2);
      expect(evg.children[1].children).toContain(4);
      expect(evg.children[2].children).toContain(6);
    });
  });

  describe("Complex Expressions", () => {
    it("evaluates operator precedence", () => {
      const source = `
        function render() {
          return <Label>{2 + 3 * 4}</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.children[0]).toBe(14);
    });

    it("evaluates logical operators", () => {
      const source = `
        function render() {
          const a = true;
          const b = false;
          return <Label visible={a && !b}>Test</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.visible).toBe(true);
    });

    it("evaluates object literal in context", () => {
      const source = `
        function render() {
          const style = ({ color: "#red", size: 20 });
          return <Label color={style.color} fontSize={style.size}>Styled</Label>;
        }
      `;
      const evg = converter.evaluate(source);
      expect(evg.props.color).toBe("#red");
      expect(evg.props.fontSize).toBe(20);
    });
  });
});
