# TSX Parser Known Issues

## Issue #1: Apostrophe in JSX Text Content Breaks Parsing

**Status:** Open  
**Severity:** Medium  
**Date Discovered:** 2024-12-17

### Description

When JSX text content contains an apostrophe character (`'`), the parser produces multiple parse errors and fails to correctly parse subsequent elements.

### Reproduction

```tsx
function render() {
  return (
    <View>
      <span>Rusty's heart raced</span> {/* This breaks parsing */}
      <View>This element may not be parsed correctly</View>
    </View>
  );
}
```

### Error Output

```
Parse error: expected '<' but got ''
Parse error: expected '/' but got ''
Parse error: expected '>' but got ''
...
```

### Workaround

Avoid using apostrophes in text content. Rewrite text to not use contractions or possessives:

```tsx
// Instead of:
<span>Rusty's heart</span>

// Use:
<span>Rusty felt his heart</span>
```

### Root Cause Analysis

The TSX lexer likely treats the apostrophe as a string delimiter, causing it to incorrectly tokenize the remaining content. The JSXText parsing logic may not properly handle single quotes within text content.

### Suggested Fix

In `ts_lexer.rgr` or `ts_parser_simple.rgr`:

1. When in JSX context (between `>` and `</`), treat text content differently
2. Only recognize `<` and `{` as special characters that end JSXText
3. Do not treat `'` as a string delimiter within JSXText nodes

### Related Files

- `gallery/ts_parser/ts_lexer.rgr` - Tokenizer
- `gallery/ts_parser/ts_parser_simple.rgr` - Parser with JSX support

---

## Issue #2: Line Spacing in Multi-line Wrapped Text

**Status:** Open  
**Severity:** Low  
**Date Discovered:** 2024-12-17

### Description

When text wraps across multiple lines, the vertical spacing between wrapped lines appears inconsistent or overlapping in PDF output.

### Possible Causes

1. Layout engine height calculation doesn't account for actual wrapped line count
2. PDF renderer line spacing calculation may need adjustment
3. Text baseline positioning may be incorrect

### Related Files

- `gallery/pdf_writer/EVGPDFRenderer.rgr` - `renderText()` and `wrapText()` functions
- `gallery/evg/EVGLayout.rgr` - Text height calculation
