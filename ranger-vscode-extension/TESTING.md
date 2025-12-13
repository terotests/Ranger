# Testing the Ranger Language Extension

## How to Test

1. **Press F5** in VS Code (or use Run > Start Debugging)
2. A new "Extension Development Host" window will open
3. In the **new window**, open any `.rgr` or `.ranger` file:
   - `File > Open Folder` and navigate to `ranger-vscode-extension/examples`
   - Open `test.rgr` or `samples/sample.rgr`

## Verifying Syntax Highlighting

In the **Extension Development Host** window:

1. **Check the language mode** in the bottom right corner - it should say "Ranger"
2. If it says "Plain Text", click on it and select "Ranger" from the list
3. Keywords should now be colored:
   - `class`, `fn`, `def`, `if`, `while` etc. should be highlighted
   - Comments starting with `;` should be colored
   - Strings in `"quotes"` should be colored

## Troubleshooting

### No Syntax Highlighting

If you don't see colors:

1. **Check the language mode** (bottom right corner) - should say "Ranger", not "Plain Text"
2. Click on the language mode and select "Ranger" or "Configure File Association for '.rgr'"
3. **Reload the window**: Press `Ctrl+Shift+P` > "Developer: Reload Window"

### File Association Issues

If `.rgr` files are not automatically detected:

1. Open a `.rgr` file
2. Click on the language indicator in the bottom right (might say "Plain Text")
3. Select "Ranger" from the dropdown
4. VS Code will remember this association

### Extension Not Loading

In the original VS Code window (not the Extension Development Host):

1. Check the **Debug Console** for any errors
2. Make sure compilation succeeded: `npm run compile`
3. Try restarting the debug session (Stop and F5 again)

## Features to Test

Once syntax highlighting is working:

### 1. Autocomplete

- Type `cl` and press `Ctrl+Space` - should suggest `class`
- Type `def x:` - should suggest types like `string`, `int`, `bool`

### 2. Hover Documentation

- Hover over keywords like `class`, `fn`, `def`
- Should show documentation tooltips

### 3. Code Snippets

- Type `class` and press `Tab` - should expand to a class template
- Type `fn` and press `Tab` - should expand to a function template

### 4. Document Outline

- Press `Ctrl+Shift+O` to see the outline
- Should show all classes, functions, and properties

### 5. Error Detection

- Add an unclosed bracket `{`
- Should show a red squiggle and error in Problems panel

## Language Server Features

The extension provides:

- ✅ Syntax highlighting for keywords, strings, numbers, comments
- ✅ Bracket matching and auto-closing
- ✅ Code completion for keywords and types
- ✅ Hover tooltips with documentation
- ✅ Document symbols/outline
- ✅ Basic error diagnostics (unmatched brackets)
- ✅ Code snippets for common patterns

## Sample Files

- `examples/test.rgr` - Simple test file with basic features
- `samples/sample.rgr` - More comprehensive example

## Extension Info

- **Language ID**: `ranger`
- **File Extensions**: `.rgr`, `.ranger`
- **Scope Name**: `source.ranger`
