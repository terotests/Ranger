# Ranger js_parser ESTree Compliance Report

Generated: 2025-12-15T10:56:11.930Z

This document details the ESTree compliance of Ranger's JavaScript parser.
It compares Ranger's AST output against Acorn (reference ESTree implementation).

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Pass | 20 | 52.6% |
| ❌ Fail (validation) | 18 | 47.4% |
| 💥 Parse Error | 0 | 0.0% |
| **Total** | **38** | **100%** |

## Detailed Results

### ✅ Passing Features (20)

#### Arrow Function

**Code:** `const fn = (a, b) => a + b;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "fn"
          },
          "init": {
            "type": "ArrowFunctionExpression",
            "id": null,
            "expression": true,
            "generator": false,
            "async": false,
            "params": [
              {
                "type": "Identifier",
                "name": "a"
              },
              {
                "type": "Identifier",
                "name": "b"
              }
            ],
            "body": {
              "type": "BinaryExpression",
              "left": {
                "type": "Identifier",
                "name": "a"
              },
              "operator": "+",
              "right": {
                "type": "Identifier",
                "name": "b"
              }
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "fn",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "ArrowFunctionExpression",
            "line": 1,
            "col": 12,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Identifier",
                "line": 1,
                "col": 13,
                "name": "a",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              },
              {
                "type": "Identifier",
                "line": 1,
                "col": 16,
                "name": "b",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            ],
            "body": {
              "type": "BinaryExpression",
              "line": 1,
              "col": 22,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "+",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Identifier",
                "line": 1,
                "col": 22,
                "name": "a",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              },
              "right": {
                "type": "Identifier",
                "line": 1,
                "col": 26,
                "name": "b",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Let/Const

**Code:** `let x = 1; const y = 2;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "Literal",
            "value": 1,
            "raw": "1"
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "y"
          },
          "init": {
            "type": "Literal",
            "value": 2,
            "raw": "2"
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "let",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 5,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 5,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "Literal",
            "line": 1,
            "col": 9,
            "name": "",
            "raw": "1",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    },
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 12,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 18,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 18,
            "name": "y",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "Literal",
            "line": 1,
            "col": 22,
            "name": "",
            "raw": "2",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Template Literal

**Code:** `const s = `hello ${name}`;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "s"
          },
          "init": {
            "type": "TemplateLiteral",
            "expressions": [
              {
                "type": "Identifier",
                "name": "name"
              }
            ],
            "quasis": [
              {
                "type": "TemplateElement",
                "value": {
                  "raw": "hello ",
                  "cooked": "hello "
                },
                "tail": false
              },
              {
                "type": "TemplateElement",
                "value": {
                  "raw": "",
                  "cooked": ""
                },
                "tail": true
              }
            ]
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "s",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "TemplateLiteral",
            "line": 1,
            "col": 11,
            "name": "",
            "raw": "hello ${name}",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Object Destructuring

**Code:** `const {a, b} = obj;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "ObjectPattern",
            "properties": [
              {
                "type": "Property",
                "method": false,
                "shorthand": true,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "a"
                },
                "value": {
                  "type": "Identifier",
                  "name": "a"
                },
                "kind": "init"
              },
              {
                "type": "Property",
                "method": false,
                "shorthand": true,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "b"
                },
                "value": {
                  "type": "Identifier",
                  "name": "b"
                },
                "kind": "init"
              }
            ]
          },
          "init": {
            "type": "Identifier",
            "name": "obj"
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "ObjectPattern",
            "line": 1,
            "col": 7,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Property",
                "line": 1,
                "col": 8,
                "name": "a",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": true,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 8,
                  "name": "a",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              },
              {
                "type": "Property",
                "line": 1,
                "col": 11,
                "name": "b",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": true,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 11,
                  "name": "b",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              }
            ]
          },
          "init": {
            "type": "Identifier",
            "line": 1,
            "col": 16,
            "name": "obj",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Array Destructuring

**Code:** `const [x, y] = arr;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "ArrayPattern",
            "elements": [
              {
                "type": "Identifier",
                "name": "x"
              },
              {
                "type": "Identifier",
                "name": "y"
              }
            ]
          },
          "init": {
            "type": "Identifier",
            "name": "arr"
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "ArrayPattern",
            "line": 1,
            "col": 7,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Identifier",
                "line": 1,
                "col": 8,
                "name": "x",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              },
              {
                "type": "Identifier",
                "line": 1,
                "col": 11,
                "name": "y",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            ]
          },
          "init": {
            "type": "Identifier",
            "line": 1,
            "col": 16,
            "name": "arr",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Rest Parameters

**Code:** `function fn(...args) { return args; }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fn"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "params": [
        {
          "type": "RestElement",
          "argument": {
            "type": "Identifier",
            "name": "args"
          }
        }
      ],
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ReturnStatement",
            "argument": {
              "type": "Identifier",
              "name": "args"
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "fn",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "RestElement",
          "line": 1,
          "col": 13,
          "name": "args",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      ],
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 22,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ReturnStatement",
            "line": 1,
            "col": 24,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 31,
              "name": "args",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Spread Operator

**Code:** `const arr = [...a, ...b];`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "arr"
          },
          "init": {
            "type": "ArrayExpression",
            "elements": [
              {
                "type": "SpreadElement",
                "argument": {
                  "type": "Identifier",
                  "name": "a"
                }
              },
              {
                "type": "SpreadElement",
                "argument": {
                  "type": "Identifier",
                  "name": "b"
                }
              }
            ]
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "arr",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "ArrayExpression",
            "line": 1,
            "col": 13,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "SpreadElement",
                "line": 1,
                "col": 14,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 17,
                  "name": "a",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              },
              {
                "type": "SpreadElement",
                "line": 1,
                "col": 20,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 23,
                  "name": "b",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Class Declaration

**Code:** `class Foo { constructor() {} }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "MethodDefinition",
            "static": false,
            "computed": false,
            "key": {
              "type": "Identifier",
              "name": "constructor"
            },
            "kind": "constructor",
            "value": {
              "type": "FunctionExpression",
              "id": null,
              "expression": false,
              "generator": false,
              "async": false,
              "body": {
                "type": "BlockStatement"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "constructor",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 13,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "body": {
                "type": "BlockStatement",
                "line": 1,
                "col": 27,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Static Method

**Code:** `class Foo { static bar() {} }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "MethodDefinition",
            "static": true,
            "computed": false,
            "key": {
              "type": "Identifier",
              "name": "bar"
            },
            "kind": "method",
            "value": {
              "type": "FunctionExpression",
              "id": null,
              "expression": false,
              "generator": false,
              "async": false,
              "body": {
                "type": "BlockStatement"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "bar",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": true,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 20,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "body": {
                "type": "BlockStatement",
                "line": 1,
                "col": 26,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Async Function

**Code:** `async function fn() { return 1; }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fn"
      },
      "expression": false,
      "generator": false,
      "async": true,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ReturnStatement",
            "argument": {
              "type": "Literal",
              "value": 1,
              "raw": "1"
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "fn",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": true,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 21,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ReturnStatement",
            "line": 1,
            "col": 23,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Literal",
              "line": 1,
              "col": 30,
              "name": "",
              "raw": "1",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Await Expression

**Code:** `async function fn() { await promise; }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fn"
      },
      "expression": false,
      "generator": false,
      "async": true,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ExpressionStatement",
            "expression": {
              "type": "AwaitExpression",
              "argument": {
                "type": "Identifier",
                "name": "promise"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "fn",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": true,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 21,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ExpressionStatement",
            "line": 1,
            "col": 23,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "AwaitExpression",
              "line": 1,
              "col": 23,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Identifier",
                "line": 1,
                "col": 29,
                "name": "promise",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Generator Function

**Code:** `function* gen() { yield 1; }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "gen"
      },
      "expression": false,
      "generator": true,
      "async": false,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ExpressionStatement",
            "expression": {
              "type": "YieldExpression",
              "delegate": false,
              "argument": {
                "type": "Literal",
                "value": 1,
                "raw": "1"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "gen",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": true,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 17,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ExpressionStatement",
            "line": 1,
            "col": 19,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "YieldExpression",
              "line": 1,
              "col": 19,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Literal",
                "line": 1,
                "col": 25,
                "name": "",
                "raw": "1",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Yield Expression

**Code:** `function* gen() { yield 1; }`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "gen"
      },
      "expression": false,
      "generator": true,
      "async": false,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ExpressionStatement",
            "expression": {
              "type": "YieldExpression",
              "delegate": false,
              "argument": {
                "type": "Literal",
                "value": 1,
                "raw": "1"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "gen",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": true,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 17,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ExpressionStatement",
            "line": 1,
            "col": 19,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "YieldExpression",
              "line": 1,
              "col": 19,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Literal",
                "line": 1,
                "col": 25,
                "name": "",
                "raw": "1",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Nullish Coalescing

**Code:** `const x = a ?? b;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "LogicalExpression",
            "left": {
              "type": "Identifier",
              "name": "a"
            },
            "operator": "??",
            "right": {
              "type": "Identifier",
              "name": "b"
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "LogicalExpression",
            "line": 1,
            "col": 11,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "??",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 11,
              "name": "a",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            },
            "right": {
              "type": "Identifier",
              "line": 1,
              "col": 16,
              "name": "b",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        }
      ]
    }
  ]
}
```
</details>

---

#### Import Declaration

**Code:** `import { foo } from "bar";`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ImportDeclaration",
      "specifiers": [
        {
          "type": "ImportSpecifier",
          "imported": {
            "type": "Identifier",
            "name": "foo"
          },
          "local": {
            "type": "Identifier",
            "name": "foo"
          }
        }
      ],
      "source": {
        "type": "Literal",
        "value": "bar",
        "raw": "\"bar\""
      }
    }
  ],
  "sourceType": "module"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ImportDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "ImportSpecifier",
          "line": 1,
          "col": 10,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "imported": {
            "type": "Identifier",
            "line": 1,
            "col": 10,
            "name": "foo",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "local": {
            "type": "Identifier",
            "line": 1,
            "col": 10,
            "name": "foo",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ],
      "right": {
        "type": "Literal",
        "line": 1,
        "col": 21,
        "name": "",
        "raw": "bar",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

---

#### Export Declaration

**Code:** `export const x = 1;`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExportNamedDeclaration",
      "declaration": {
        "type": "VariableDeclaration",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "x"
            },
            "init": {
              "type": "Literal",
              "value": 1,
              "raw": "1"
            }
          }
        ],
        "kind": "const"
      },
      "source": null
    }
  ],
  "sourceType": "module"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ExportNamedDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "VariableDeclaration",
        "line": 1,
        "col": 8,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "const",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "VariableDeclarator",
            "line": 1,
            "col": 14,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "id": {
              "type": "Identifier",
              "line": 1,
              "col": 14,
              "name": "x",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            },
            "init": {
              "type": "Literal",
              "line": 1,
              "col": 18,
              "name": "",
              "raw": "1",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      }
    }
  ]
}
```
</details>

---

#### Export Default

**Code:** `export default function() {}`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExportDefaultDeclaration",
      "declaration": {
        "type": "FunctionDeclaration",
        "id": null,
        "expression": false,
        "generator": false,
        "async": false,
        "body": {
          "type": "BlockStatement"
        }
      }
    }
  ],
  "sourceType": "module"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ExportDefaultDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "FunctionDeclaration",
        "line": 1,
        "col": 16,
        "name": "(",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ObjectPattern",
            "line": 1,
            "col": 27,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        ],
        "body": {
          "type": "BlockStatement",
          "line": 0,
          "col": 0,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      }
    }
  ]
}
```
</details>

---

#### For-Of Loop

**Code:** `for (const x of arr) {}`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ForOfStatement",
      "await": false,
      "left": {
        "type": "VariableDeclaration",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "x"
            },
            "init": null
          }
        ],
        "kind": "const"
      },
      "right": {
        "type": "Identifier",
        "name": "arr"
      },
      "body": {
        "type": "BlockStatement"
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ForOfStatement",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "VariableDeclaration",
        "line": 1,
        "col": 12,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "const",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "VariableDeclarator",
            "line": 1,
            "col": 12,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "id": {
              "type": "Identifier",
              "line": 1,
              "col": 12,
              "name": "x",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      },
      "right": {
        "type": "Identifier",
        "line": 1,
        "col": 17,
        "name": "arr",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      },
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 22,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

---

#### Object Shorthand

**Code:** `const obj = { x, method() {} };`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "obj"
          },
          "init": {
            "type": "ObjectExpression",
            "properties": [
              {
                "type": "Property",
                "method": false,
                "shorthand": true,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "x"
                },
                "value": {
                  "type": "Identifier",
                  "name": "x"
                },
                "kind": "init"
              },
              {
                "type": "Property",
                "method": true,
                "shorthand": false,
                "computed": false,
                "key": {
                  "type": "Identifier",
                  "name": "method"
                },
                "value": {
                  "type": "FunctionExpression",
                  "id": null,
                  "expression": false,
                  "generator": false,
                  "async": false,
                  "body": {
                    "type": "BlockStatement"
                  }
                },
                "kind": "init"
              }
            ]
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "obj",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "ObjectExpression",
            "line": 1,
            "col": 13,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Property",
                "line": 1,
                "col": 15,
                "name": "x",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": true,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 15,
                  "name": "x",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              },
              {
                "type": "Property",
                "line": 1,
                "col": 18,
                "name": "method",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": true,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 18,
                  "name": "method",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              }
            ]
          }
        }
      ]
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 30,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 30,
        "name": "}",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

---

#### Computed Property

**Code:** `const obj = { [key]: value };`

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "obj"
          },
          "init": {
            "type": "ObjectExpression",
            "properties": [
              {
                "type": "Property",
                "method": false,
                "shorthand": false,
                "computed": true,
                "key": {
                  "type": "Identifier",
                  "name": "key"
                },
                "value": {
                  "type": "Identifier",
                  "name": "value"
                },
                "kind": "init"
              }
            ]
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "obj",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "ObjectExpression",
            "line": 1,
            "col": 13,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Property",
                "line": 1,
                "col": 15,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": true,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "right": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 16,
                  "name": "key",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                },
                "left": {
                  "type": "Identifier",
                  "line": 1,
                  "col": 22,
                  "name": "value",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```
</details>

---


### ❌ Failed Validations (18)

These features parsed successfully but the AST structure doesn't match ESTree expectations.

#### Default Parameters

**Code:** `function fn(a = 1) { return a; }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, FunctionDeclaration, Identifier, AssignmentPattern, Literal, BlockStatement, ReturnStatement

**Ranger AST types:** Program, FunctionDeclaration, Identifier, BlockStatement, ReturnStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fn"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "params": [
        {
          "type": "AssignmentPattern",
          "left": {
            "type": "Identifier",
            "name": "a"
          },
          "right": {
            "type": "Literal",
            "value": 1,
            "raw": "1"
          }
        }
      ],
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ReturnStatement",
            "argument": {
              "type": "Identifier",
              "name": "a"
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "fn",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "Identifier",
          "line": 1,
          "col": 13,
          "name": "a",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        },
        {
          "type": "Identifier",
          "line": 1,
          "col": 17,
          "name": "1",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      ],
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 20,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ReturnStatement",
            "line": 1,
            "col": 22,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 29,
              "name": "a",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `AssignmentPattern`
- Missing node type: `Literal`

---

#### Class Extends

**Code:** `class Bar extends Foo { }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ClassDeclaration, Identifier, ClassBody

**Ranger AST types:** Program, ClassDeclaration, Identifier, ClassBody

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Bar"
      },
      "superClass": {
        "type": "Identifier",
        "name": "Foo"
      },
      "body": {
        "type": "ClassBody"
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Bar",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 19,
        "name": "Foo",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      },
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 23,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Node types match but property values differ

---

#### Getter

**Code:** `class Foo { get x() { return 1; } }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ClassDeclaration, Identifier, ClassBody, MethodDefinition, FunctionExpression, BlockStatement, ReturnStatement, Literal

**Ranger AST types:** Program, ClassDeclaration, ClassBody, MethodDefinition, FunctionExpression, BlockStatement, ReturnStatement, Literal

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "MethodDefinition",
            "static": false,
            "computed": false,
            "key": {
              "type": "Identifier",
              "name": "x"
            },
            "kind": "get",
            "value": {
              "type": "FunctionExpression",
              "id": null,
              "expression": false,
              "generator": false,
              "async": false,
              "body": {
                "type": "BlockStatement",
                "body": [
                  {
                    "type": "ReturnStatement",
                    "argument": {
                      "type": "Literal",
                      "value": 1,
                      "raw": "1"
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 17,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "body": {
                "type": "BlockStatement",
                "line": 1,
                "col": 21,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false,
                "children": [
                  {
                    "type": "ReturnStatement",
                    "line": 1,
                    "col": 23,
                    "name": "",
                    "raw": "",
                    "regexPattern": "",
                    "regexFlags": "",
                    "operator": "",
                    "prefix": false,
                    "generator": false,
                    "async": false,
                    "expression": false,
                    "kind": "",
                    "computed": false,
                    "optional": false,
                    "method": false,
                    "shorthand": false,
                    "tail": false,
                    "cooked": "",
                    "sourceType": "",
                    "static": false,
                    "delegate": false,
                    "left": {
                      "type": "Literal",
                      "line": 1,
                      "col": 30,
                      "name": "",
                      "raw": "1",
                      "regexPattern": "",
                      "regexFlags": "",
                      "operator": "",
                      "prefix": false,
                      "generator": false,
                      "async": false,
                      "expression": false,
                      "kind": "",
                      "computed": false,
                      "optional": false,
                      "method": false,
                      "shorthand": false,
                      "tail": false,
                      "cooked": "",
                      "sourceType": "",
                      "static": false,
                      "delegate": false
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `Identifier`

---

#### Setter

**Code:** `class Foo { set x(v) {} }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ClassDeclaration, Identifier, ClassBody, MethodDefinition, FunctionExpression, BlockStatement

**Ranger AST types:** Program, ClassDeclaration, ClassBody, MethodDefinition, FunctionExpression, Identifier, BlockStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "MethodDefinition",
            "static": false,
            "computed": false,
            "key": {
              "type": "Identifier",
              "name": "x"
            },
            "kind": "set",
            "value": {
              "type": "FunctionExpression",
              "id": null,
              "expression": false,
              "generator": false,
              "async": false,
              "params": [
                {
                  "type": "Identifier",
                  "name": "v"
                }
              ],
              "body": {
                "type": "BlockStatement"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 17,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "children": [
                {
                  "type": "Identifier",
                  "line": 1,
                  "col": 19,
                  "name": "v",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              ],
              "body": {
                "type": "BlockStatement",
                "line": 1,
                "col": 22,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Node types match but property values differ

---

#### Private Fields

**Code:** `class Foo { #x = 1; }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ClassDeclaration, Identifier, ClassBody, PropertyDefinition, PrivateIdentifier, Literal

**Ranger AST types:** Program, ClassDeclaration, ClassBody, MethodDefinition, FunctionExpression, Identifier, BlockStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "PropertyDefinition",
            "static": false,
            "computed": false,
            "key": {
              "type": "PrivateIdentifier",
              "name": "x"
            },
            "value": {
              "type": "Literal",
              "value": 1,
              "raw": "1"
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "#",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 13,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "children": [
                {
                  "type": "Identifier",
                  "line": 1,
                  "col": 16,
                  "name": "=",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                },
                {
                  "type": "Identifier",
                  "line": 1,
                  "col": 19,
                  "name": ";",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              ],
              "body": {
                "type": "BlockStatement",
                "line": 0,
                "col": 0,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `PropertyDefinition`
- Missing node type: `PrivateIdentifier`
- Missing node type: `Literal`
- Extra node type: `MethodDefinition`
- Extra node type: `FunctionExpression`
- Extra node type: `BlockStatement`

---

#### Static Block

**Code:** `class Foo { static { console.log("init"); } }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ClassDeclaration, Identifier, ClassBody, StaticBlock, ExpressionStatement, CallExpression, MemberExpression, Literal

**Ranger AST types:** Program, ClassDeclaration, ClassBody, MethodDefinition, FunctionExpression, Identifier, BlockStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "superClass": null,
      "body": {
        "type": "ClassBody",
        "body": [
          {
            "type": "StaticBlock",
            "body": [
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "console"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "log"
                    },
                    "computed": false,
                    "optional": false
                  },
                  "arguments": [
                    {
                      "type": "Literal",
                      "value": "init",
                      "raw": "\"init\""
                    }
                  ],
                  "optional": false
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ClassDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "ClassBody",
        "line": 1,
        "col": 11,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "MethodDefinition",
            "line": 1,
            "col": 13,
            "name": "{",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": true,
            "delegate": false,
            "body": {
              "type": "FunctionExpression",
              "line": 1,
              "col": 20,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "children": [
                {
                  "type": "Identifier",
                  "line": 1,
                  "col": 29,
                  "name": ".",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                },
                {
                  "type": "Identifier",
                  "line": 1,
                  "col": 33,
                  "name": "(",
                  "raw": "",
                  "regexPattern": "",
                  "regexFlags": "",
                  "operator": "",
                  "prefix": false,
                  "generator": false,
                  "async": false,
                  "expression": false,
                  "kind": "",
                  "computed": false,
                  "optional": false,
                  "method": false,
                  "shorthand": false,
                  "tail": false,
                  "cooked": "",
                  "sourceType": "",
                  "static": false,
                  "delegate": false
                }
              ],
              "body": {
                "type": "BlockStatement",
                "line": 1,
                "col": 41,
                "name": "",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `StaticBlock`
- Missing node type: `ExpressionStatement`
- Missing node type: `CallExpression`
- Missing node type: `MemberExpression`
- Missing node type: `Literal`
- Extra node type: `MethodDefinition`
- Extra node type: `FunctionExpression`
- Extra node type: `BlockStatement`

---

#### For-Await-Of

**Code:** `async function fn() { for await (const x of iter) {} }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, FunctionDeclaration, Identifier, BlockStatement, ForOfStatement, VariableDeclaration, VariableDeclarator

**Ranger AST types:** Program, FunctionDeclaration, BlockStatement, ForOfStatement, Identifier

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fn"
      },
      "expression": false,
      "generator": false,
      "async": true,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ForOfStatement",
            "await": true,
            "left": {
              "type": "VariableDeclaration",
              "declarations": [
                {
                  "type": "VariableDeclarator",
                  "id": {
                    "type": "Identifier",
                    "name": "x"
                  },
                  "init": null
                }
              ],
              "kind": "const"
            },
            "right": {
              "type": "Identifier",
              "name": "iter"
            },
            "body": {
              "type": "BlockStatement"
            }
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "fn",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": true,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 21,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "ForOfStatement",
            "line": 1,
            "col": 23,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 34,
              "name": "const",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            },
            "right": {
              "type": "Identifier",
              "line": 1,
              "col": 45,
              "name": "iter",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            },
            "body": {
              "type": "BlockStatement",
              "line": 1,
              "col": 51,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `VariableDeclaration`
- Missing node type: `VariableDeclarator`

---

#### Optional Chaining

**Code:** `const x = obj?.prop;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, ChainExpression, MemberExpression

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, OptionalMemberExpression

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "ChainExpression",
            "expression": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "obj"
              },
              "property": {
                "type": "Identifier",
                "name": "prop"
              },
              "computed": false,
              "optional": true
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "OptionalMemberExpression",
            "line": 1,
            "col": 11,
            "name": "prop",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 11,
              "name": "obj",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        }
      ]
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `ChainExpression`
- Missing node type: `MemberExpression`
- Extra node type: `OptionalMemberExpression`

---

#### Logical Assignment &&=

**Code:** `x &&= y;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ExpressionStatement, AssignmentExpression, Identifier

**Ranger AST types:** Program, ExpressionStatement, LogicalExpression, Identifier

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "&&=",
        "left": {
          "type": "Identifier",
          "name": "x"
        },
        "right": {
          "type": "Identifier",
          "name": "y"
        }
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "LogicalExpression",
        "line": 1,
        "col": 1,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "&&",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "left": {
          "type": "Identifier",
          "line": 1,
          "col": 1,
          "name": "x",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        },
        "right": {
          "type": "Identifier",
          "line": 1,
          "col": 5,
          "name": "=",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 7,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 7,
        "name": "y",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `AssignmentExpression`
- Extra node type: `LogicalExpression`

---

#### Logical Assignment ||=

**Code:** `x ||= y;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ExpressionStatement, AssignmentExpression, Identifier

**Ranger AST types:** Program, ExpressionStatement, LogicalExpression, Identifier

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "||=",
        "left": {
          "type": "Identifier",
          "name": "x"
        },
        "right": {
          "type": "Identifier",
          "name": "y"
        }
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "LogicalExpression",
        "line": 1,
        "col": 1,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "||",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "left": {
          "type": "Identifier",
          "line": 1,
          "col": 1,
          "name": "x",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        },
        "right": {
          "type": "Identifier",
          "line": 1,
          "col": 5,
          "name": "=",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 7,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 7,
        "name": "y",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `AssignmentExpression`
- Extra node type: `LogicalExpression`

---

#### Logical Assignment ??=

**Code:** `x ??= y;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, ExpressionStatement, AssignmentExpression, Identifier

**Ranger AST types:** Program, ExpressionStatement, LogicalExpression, Identifier

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "??=",
        "left": {
          "type": "Identifier",
          "name": "x"
        },
        "right": {
          "type": "Identifier",
          "name": "y"
        }
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "LogicalExpression",
        "line": 1,
        "col": 1,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "??",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "left": {
          "type": "Identifier",
          "line": 1,
          "col": 1,
          "name": "x",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        },
        "right": {
          "type": "Identifier",
          "line": 1,
          "col": 5,
          "name": "=",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 7,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 7,
        "name": "y",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `AssignmentExpression`
- Extra node type: `LogicalExpression`

---

#### Exponentiation

**Code:** `const x = 2 ** 10;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, BinaryExpression, Literal

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, BinaryExpression, Literal, ExpressionStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "BinaryExpression",
            "left": {
              "type": "Literal",
              "value": 2,
              "raw": "2"
            },
            "operator": "**",
            "right": {
              "type": "Literal",
              "value": 10,
              "raw": "10"
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "BinaryExpression",
            "line": 1,
            "col": 11,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "*",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "Literal",
              "line": 1,
              "col": 11,
              "name": "",
              "raw": "2",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            },
            "right": {
              "type": "Identifier",
              "line": 1,
              "col": 14,
              "name": "*",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        }
      ]
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 16,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Literal",
        "line": 1,
        "col": 16,
        "name": "",
        "raw": "10",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Extra node type: `ExpressionStatement`

---

#### Numeric Separators

**Code:** `const x = 1_000_000;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal, ExpressionStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "Literal",
            "value": 1000000,
            "raw": "1_000_000"
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "Literal",
            "line": 1,
            "col": 11,
            "name": "",
            "raw": "1",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 12,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 12,
        "name": "_000_000",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Extra node type: `ExpressionStatement`

---

#### BigInt

**Code:** `const x = 123n;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal, ExpressionStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "x"
          },
          "init": {
            "type": "Literal",
            "value": "123n",
            "raw": "123n",
            "bigint": "123"
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "x",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "Literal",
            "line": 1,
            "col": 11,
            "name": "",
            "raw": "123",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    },
    {
      "type": "ExpressionStatement",
      "line": 1,
      "col": 14,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "left": {
        "type": "Identifier",
        "line": 1,
        "col": 14,
        "name": "n",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Extra node type: `ExpressionStatement`

---

#### Dynamic Import

**Code:** `const mod = import("./mod.js");`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, ImportExpression, Literal

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, CallExpression, Literal

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "mod"
          },
          "init": {
            "type": "ImportExpression",
            "source": {
              "type": "Literal",
              "value": "./mod.js",
              "raw": "\"./mod.js\""
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "mod",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "CallExpression",
            "line": 1,
            "col": 13,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "children": [
              {
                "type": "Literal",
                "line": 1,
                "col": 20,
                "name": "",
                "raw": "./mod.js",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            ],
            "left": {
              "type": "Identifier",
              "line": 1,
              "col": 13,
              "name": "import",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false
            }
          }
        }
      ]
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `ImportExpression`
- Extra node type: `CallExpression`

---

#### Import Meta

**Code:** `const url = import.meta.url;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, MemberExpression, MetaProperty

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, MemberExpression

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "url"
          },
          "init": {
            "type": "MemberExpression",
            "object": {
              "type": "MetaProperty",
              "meta": {
                "type": "Identifier",
                "name": "import"
              },
              "property": {
                "type": "Identifier",
                "name": "meta"
              }
            },
            "property": {
              "type": "Identifier",
              "name": "url"
            },
            "computed": false,
            "optional": false
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "module"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "url",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "MemberExpression",
            "line": 1,
            "col": 13,
            "name": "url",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "left": {
              "type": "MemberExpression",
              "line": 1,
              "col": 13,
              "name": "meta",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Identifier",
                "line": 1,
                "col": 13,
                "name": "import",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          }
        }
      ]
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `MetaProperty`

---

#### New Target

**Code:** `function Foo() { if (new.target) {} }`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, FunctionDeclaration, Identifier, BlockStatement, IfStatement, MetaProperty

**Ranger AST types:** Program, FunctionDeclaration, BlockStatement, IfStatement, NewExpression, Identifier, ExpressionStatement

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "Foo"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "IfStatement",
            "test": {
              "type": "MetaProperty",
              "meta": {
                "type": "Identifier",
                "name": "new"
              },
              "property": {
                "type": "Identifier",
                "name": "target"
              }
            },
            "consequent": {
              "type": "BlockStatement"
            },
            "alternate": null
          }
        ]
      }
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "FunctionDeclaration",
      "line": 1,
      "col": 1,
      "name": "Foo",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "body": {
        "type": "BlockStatement",
        "line": 1,
        "col": 16,
        "name": "",
        "raw": "",
        "regexPattern": "",
        "regexFlags": "",
        "operator": "",
        "prefix": false,
        "generator": false,
        "async": false,
        "expression": false,
        "kind": "",
        "computed": false,
        "optional": false,
        "method": false,
        "shorthand": false,
        "tail": false,
        "cooked": "",
        "sourceType": "",
        "static": false,
        "delegate": false,
        "children": [
          {
            "type": "IfStatement",
            "line": 1,
            "col": 18,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false,
            "test": {
              "type": "NewExpression",
              "line": 1,
              "col": 22,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Identifier",
                "line": 1,
                "col": 25,
                "name": ".",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            },
            "body": {
              "type": "ExpressionStatement",
              "line": 1,
              "col": 32,
              "name": "",
              "raw": "",
              "regexPattern": "",
              "regexFlags": "",
              "operator": "",
              "prefix": false,
              "generator": false,
              "async": false,
              "expression": false,
              "kind": "",
              "computed": false,
              "optional": false,
              "method": false,
              "shorthand": false,
              "tail": false,
              "cooked": "",
              "sourceType": "",
              "static": false,
              "delegate": false,
              "left": {
                "type": "Identifier",
                "line": 1,
                "col": 32,
                "name": ")",
                "raw": "",
                "regexPattern": "",
                "regexFlags": "",
                "operator": "",
                "prefix": false,
                "generator": false,
                "async": false,
                "expression": false,
                "kind": "",
                "computed": false,
                "optional": false,
                "method": false,
                "shorthand": false,
                "tail": false,
                "cooked": "",
                "sourceType": "",
                "static": false,
                "delegate": false
              }
            }
          },
          {
            "type": "BlockStatement",
            "line": 1,
            "col": 34,
            "name": "",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        ]
      }
    }
  ]
}
```
</details>

**Key Differences:**
- Missing node type: `MetaProperty`
- Extra node type: `NewExpression`
- Extra node type: `ExpressionStatement`

---

#### Regex Literal

**Code:** `const re = /test/gi;`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal

**Ranger AST types:** Program, VariableDeclaration, VariableDeclarator, Identifier, Literal

<details>
<summary>Full Acorn AST (reference)</summary>

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "re"
          },
          "init": {
            "type": "Literal",
            "value": {},
            "raw": "/test/gi",
            "regex": {
              "pattern": "test",
              "flags": "gi"
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "script"
}
```
</details>

<details>
<summary>Full Ranger AST</summary>

```json
{
  "type": "Program",
  "line": 0,
  "col": 0,
  "name": "",
  "raw": "",
  "regexPattern": "",
  "regexFlags": "",
  "operator": "",
  "prefix": false,
  "generator": false,
  "async": false,
  "expression": false,
  "kind": "",
  "computed": false,
  "optional": false,
  "method": false,
  "shorthand": false,
  "tail": false,
  "cooked": "",
  "sourceType": "",
  "static": false,
  "delegate": false,
  "children": [
    {
      "type": "VariableDeclaration",
      "line": 1,
      "col": 1,
      "name": "",
      "raw": "",
      "regexPattern": "",
      "regexFlags": "",
      "operator": "",
      "prefix": false,
      "generator": false,
      "async": false,
      "expression": false,
      "kind": "const",
      "computed": false,
      "optional": false,
      "method": false,
      "shorthand": false,
      "tail": false,
      "cooked": "",
      "sourceType": "",
      "static": false,
      "delegate": false,
      "children": [
        {
          "type": "VariableDeclarator",
          "line": 1,
          "col": 7,
          "name": "",
          "raw": "",
          "regexPattern": "",
          "regexFlags": "",
          "operator": "",
          "prefix": false,
          "generator": false,
          "async": false,
          "expression": false,
          "kind": "",
          "computed": false,
          "optional": false,
          "method": false,
          "shorthand": false,
          "tail": false,
          "cooked": "",
          "sourceType": "",
          "static": false,
          "delegate": false,
          "id": {
            "type": "Identifier",
            "line": 1,
            "col": 7,
            "name": "re",
            "raw": "",
            "regexPattern": "",
            "regexFlags": "",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          },
          "init": {
            "type": "Literal",
            "line": 1,
            "col": 12,
            "name": "",
            "raw": "test/gi",
            "regexPattern": "test",
            "regexFlags": "gi",
            "operator": "",
            "prefix": false,
            "generator": false,
            "async": false,
            "expression": false,
            "kind": "",
            "computed": false,
            "optional": false,
            "method": false,
            "shorthand": false,
            "tail": false,
            "cooked": "",
            "sourceType": "",
            "static": false,
            "delegate": false
          }
        }
      ]
    }
  ]
}
```
</details>

**Key Differences:**
- Node types match but property values differ

---

### 💥 Parse Errors (0)

These features failed to parse.

## Node Type Comparison

This section compares which ESTree node types each parser produces.

### All Node Types Found

| Feature | Acorn Types | Ranger Types | Match |
|---------|-------------|--------------|-------|
| Arrow Function | ArrowFunctionExpression, BinaryExpression, Identifier, Program, VariableDeclaration... | ArrowFunctionExpression, BinaryExpression, Identifier, Program, VariableDeclaration... | ✅ |
| Let/Const | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | ✅ |
| Template Literal | Identifier, Program, TemplateElement, TemplateLiteral, VariableDeclaration... | Identifier, Program, TemplateLiteral, VariableDeclaration, VariableDeclarator | ❌ |
| Object Destructuring | Identifier, ObjectPattern, Program, Property, VariableDeclaration... | Identifier, ObjectPattern, Program, Property, VariableDeclaration... | ✅ |
| Array Destructuring | ArrayPattern, Identifier, Program, VariableDeclaration, VariableDeclarator | ArrayPattern, Identifier, Program, VariableDeclaration, VariableDeclarator | ✅ |
| Default Parameters | AssignmentPattern, BlockStatement, FunctionDeclaration, Identifier, Literal... | BlockStatement, FunctionDeclaration, Identifier, Program, ReturnStatement | ❌ |
| Rest Parameters | BlockStatement, FunctionDeclaration, Identifier, Program, RestElement... | BlockStatement, FunctionDeclaration, Identifier, Program, RestElement... | ✅ |
| Spread Operator | ArrayExpression, Identifier, Program, SpreadElement, VariableDeclaration... | ArrayExpression, Identifier, Program, SpreadElement, VariableDeclaration... | ✅ |
| Class Declaration | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, MethodDefinition... | ❌ |
| Class Extends | ClassBody, ClassDeclaration, Identifier, Program | ClassBody, ClassDeclaration, Identifier, Program | ✅ |
| Static Method | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, MethodDefinition... | ❌ |
| Getter | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Literal... | ❌ |
| Setter | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | ✅ |
| Private Fields | ClassBody, ClassDeclaration, Identifier, Literal, PrivateIdentifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | ❌ |
| Static Block | CallExpression, ClassBody, ClassDeclaration, ExpressionStatement, Identifier... | BlockStatement, ClassBody, ClassDeclaration, FunctionExpression, Identifier... | ❌ |
| Async Function | BlockStatement, FunctionDeclaration, Identifier, Literal, Program... | BlockStatement, FunctionDeclaration, Literal, Program, ReturnStatement | ❌ |
| Await Expression | AwaitExpression, BlockStatement, ExpressionStatement, FunctionDeclaration, Identifier... | AwaitExpression, BlockStatement, ExpressionStatement, FunctionDeclaration, Identifier... | ✅ |
| Generator Function | BlockStatement, ExpressionStatement, FunctionDeclaration, Identifier, Literal... | BlockStatement, ExpressionStatement, FunctionDeclaration, Literal, Program... | ❌ |
| Yield Expression | BlockStatement, ExpressionStatement, FunctionDeclaration, Identifier, Literal... | BlockStatement, ExpressionStatement, FunctionDeclaration, Literal, Program... | ❌ |
| For-Await-Of | BlockStatement, ForOfStatement, FunctionDeclaration, Identifier, Program... | BlockStatement, ForOfStatement, FunctionDeclaration, Identifier, Program | ❌ |
| Optional Chaining | ChainExpression, Identifier, MemberExpression, Program, VariableDeclaration... | Identifier, OptionalMemberExpression, Program, VariableDeclaration, VariableDeclarator | ❌ |
| Nullish Coalescing | Identifier, LogicalExpression, Program, VariableDeclaration, VariableDeclarator | Identifier, LogicalExpression, Program, VariableDeclaration, VariableDeclarator | ✅ |
| Logical Assignment &&= | AssignmentExpression, ExpressionStatement, Identifier, Program | ExpressionStatement, Identifier, LogicalExpression, Program | ❌ |
| Logical Assignment ||= | AssignmentExpression, ExpressionStatement, Identifier, Program | ExpressionStatement, Identifier, LogicalExpression, Program | ❌ |
| Logical Assignment ??= | AssignmentExpression, ExpressionStatement, Identifier, Program | ExpressionStatement, Identifier, LogicalExpression, Program | ❌ |
| Exponentiation | BinaryExpression, Identifier, Literal, Program, VariableDeclaration... | BinaryExpression, ExpressionStatement, Identifier, Literal, Program... | ❌ |
| Numeric Separators | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | ExpressionStatement, Identifier, Literal, Program, VariableDeclaration... | ❌ |
| BigInt | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | ExpressionStatement, Identifier, Literal, Program, VariableDeclaration... | ❌ |
| Import Declaration | Identifier, ImportDeclaration, ImportSpecifier, Literal, Program | Identifier, ImportDeclaration, ImportSpecifier, Literal, Program | ✅ |
| Export Declaration | ExportNamedDeclaration, Identifier, Literal, Program, VariableDeclaration... | ExportNamedDeclaration, Identifier, Literal, Program, VariableDeclaration... | ✅ |
| Export Default | BlockStatement, ExportDefaultDeclaration, FunctionDeclaration, Program | BlockStatement, ExportDefaultDeclaration, FunctionDeclaration, ObjectPattern, Program | ❌ |
| Dynamic Import | Identifier, ImportExpression, Literal, Program, VariableDeclaration... | CallExpression, Identifier, Literal, Program, VariableDeclaration... | ❌ |
| Import Meta | Identifier, MemberExpression, MetaProperty, Program, VariableDeclaration... | Identifier, MemberExpression, Program, VariableDeclaration, VariableDeclarator | ❌ |
| For-Of Loop | BlockStatement, ForOfStatement, Identifier, Program, VariableDeclaration... | BlockStatement, ForOfStatement, Identifier, Program, VariableDeclaration... | ✅ |
| Object Shorthand | BlockStatement, FunctionExpression, Identifier, ObjectExpression, Program... | ExpressionStatement, Identifier, ObjectExpression, Program, Property... | ❌ |
| Computed Property | Identifier, ObjectExpression, Program, Property, VariableDeclaration... | Identifier, ObjectExpression, Program, Property, VariableDeclaration... | ✅ |
| New Target | BlockStatement, FunctionDeclaration, Identifier, IfStatement, MetaProperty... | BlockStatement, ExpressionStatement, FunctionDeclaration, Identifier, IfStatement... | ❌ |
| Regex Literal | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | Identifier, Literal, Program, VariableDeclaration, VariableDeclarator | ✅ |


## Recommendations

Based on the analysis, here are areas where Ranger's ESTree compliance could be improved:

### Missing Node Types

The following ESTree node types were found in Acorn output but not in Ranger:

- `AssignmentPattern`
- `Literal`
- `Identifier`
- `PropertyDefinition`
- `PrivateIdentifier`
- `StaticBlock`
- `ExpressionStatement`
- `CallExpression`
- `MemberExpression`
- `VariableDeclaration`
- `VariableDeclarator`
- `ChainExpression`
- `AssignmentExpression`
- `ImportExpression`
- `MetaProperty`

