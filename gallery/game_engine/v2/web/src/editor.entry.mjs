// ============================================================================
// editor.entry.mjs — Monaco editor, bundled by esbuild into editor.bundle.js.
// ============================================================================
//
// Exposes window.RangerEditor.create(container, value, opts) and points Monaco
// at its bundled workers (also produced by esbuild). TypeScript semantic
// validation is disabled — the game scripts reference ambient game.d.ts types
// that aren't loaded here, so we keep syntax highlighting + editing and skip the
// red-squiggle noise.
// ============================================================================

import * as monaco from "monaco-editor";

// Workers are emitted next to this bundle by the esbuild build step.
// Pages that load the editor from a parent folder (per-demo URLs) set
// self.RangerEditorBase = "../" before this script runs.
const EDITOR_BASE = (typeof self !== "undefined" && self.RangerEditorBase) || "./";
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === "typescript" || label === "javascript") {
      return new Worker(EDITOR_BASE + "ts.worker.js");
    }
    return new Worker(EDITOR_BASE + "editor.worker.js");
  },
};

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  allowNonTsExtensions: true,
  jsx: monaco.languages.typescript.JsxEmit.Preserve,
});

function create(container, value, opts) {
  const options = opts || {};
  return monaco.editor.create(container, {
    value: value || "",
    language: options.language || "typescript",
    theme: options.theme || "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: options.fontSize || 13,
    scrollBeyondLastLine: false,
    tabSize: 2,
    renderWhitespace: "none",
    fixedOverflowWidgets: true,
  });
}

window.RangerEditor = { create, monaco };
