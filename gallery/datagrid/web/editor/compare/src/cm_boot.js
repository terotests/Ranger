/**
 * CodeMirror 6, set up as close to the Ranger editor as its defaults allow,
 * and given the same small API the bench asks both editors for.
 *
 * `indentWithTab` is included deliberately, and it is the one place where CM's
 * own default differs: out of the box CodeMirror does NOT bind Tab, *because*
 * binding it traps the keyboard. The Ranger editor takes Tab and offers
 * Escape-then-Tab as the way out. The bench prints the difference rather than
 * hiding it.
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";

const parent = document.getElementById("editor");

const view = new EditorView({
  parent,
  state: EditorState.create({
    doc: window.__initialDoc || "",
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      javascript({ jsx: true, typescript: true }),
      oneDark,
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    ],
  }),
});

/** The same questions the Ranger facade answers, so the bench can ask both. */
window.__editor = {
  name: "codemirror6",
  focus() {
    view.focus();
  },
  text() {
    return view.state.doc.toString();
  },
  lineCount() {
    return view.state.doc.lines;
  },
  caret() {
    const head = view.state.selection.main.head;
    const line = view.state.doc.lineAt(head);
    return { line: line.number - 1, col: head - line.from };
  },
  hasSelection() {
    return !view.state.selection.main.empty;
  },
  currentLine() {
    return view.state.doc.lineAt(view.state.selection.main.head).text;
  },
  setDoc(text) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
  },
  insert(text) {
    const head = view.state.selection.main.head;
    view.dispatch({ changes: { from: head, insert: text }, selection: { anchor: head + text.length } });
  },
  scrollToLine(n) {
    const pos = view.state.doc.line(Math.min(n, view.state.doc.lines)).from;
    view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: "start" }) });
  },
  measure() {
    view.requestMeasure();
  },
};
window.__editorReady = true;
