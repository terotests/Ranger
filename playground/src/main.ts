import "./ranger/nodeShim.js";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history as cmHistory, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import {
  compileRanger,
  type CompileResponse,
  type TargetLanguage,
} from "./ranger/compile.js";
import { loadRangerCompiler } from "./ranger/loadCompiler.js";
import "./style.css";

interface ExampleMeta {
  id: string;
  title: string;
  file: string;
  description: string;
  needsProcess?: boolean;
}

const LANGUAGE_OPTIONS: { value: TargetLanguage; label: string }[] = [
  { value: "es6", label: "JavaScript" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift6", label: "Swift 6" },
];

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header class="top">
    <div>
      <h1>Ranger Playground</h1>
      <p class="tagline">In-browser compiler · Ranger ${"3.0.5"}</p>
    </div>
    <div class="toolbar">
      <label class="field">
        <span>Example</span>
        <select id="example-select"></select>
      </label>
      <label class="field">
        <span>Target</span>
        <select id="lang-select"></select>
      </label>
      <label class="field checkbox" id="ts-field">
        <input type="checkbox" id="ts-flag" />
        <span>TypeScript (JS output)</span>
      </label>
      <button type="button" id="compile-btn" class="primary">Compile</button>
      <button type="button" id="run-btn" title="ES6 only">Run JS</button>
    </div>
  </header>
  <p id="example-desc" class="example-desc"></p>
  <main class="panes">
    <section class="pane">
      <h2>Source (.rgr)</h2>
      <div id="source-editor"></div>
    </section>
    <section class="pane">
      <h2>Output <span id="status" class="status"></span></h2>
      <div id="output-editor"></div>
    </section>
  </main>
  <footer class="foot">
  <a href="https://github.com/terotests/Ranger" target="_blank" rel="noreferrer">GitHub</a>
  </footer>
`;

const exampleSelect = document.querySelector<HTMLSelectElement>("#example-select")!;
const langSelect = document.querySelector<HTMLSelectElement>("#lang-select")!;
const tsField = document.querySelector<HTMLLabelElement>("#ts-field")!;
const tsFlag = document.querySelector<HTMLInputElement>("#ts-flag")!;
const compileBtn = document.querySelector<HTMLButtonElement>("#compile-btn")!;
const runBtn = document.querySelector<HTMLButtonElement>("#run-btn")!;
const statusEl = document.querySelector<HTMLSpanElement>("#status")!;
const exampleDesc = document.querySelector<HTMLParagraphElement>("#example-desc")!;

for (const opt of LANGUAGE_OPTIONS) {
  const o = document.createElement("option");
  o.value = opt.value;
  o.textContent = opt.label;
  langSelect.appendChild(o);
}

function syncToolbarForLanguage() {
  const isJs = langSelect.value === "es6";
  tsField.hidden = !isJs;
  if (!isJs) {
    tsFlag.checked = false;
  }
  runBtn.hidden = !isJs;
}

syncToolbarForLanguage();

const outputLang = new Compartment();

let debounceTimer = 0;
let compiling = false;

function scheduleCompile() {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void doCompile();
  }, 600);
}

function makeEditor(
  parent: HTMLElement,
  readOnly: boolean,
  opts?: { onDocChange?: () => void; langExt?: ReturnType<typeof javascript>; useOutputLang?: boolean },
) {
  const langExt = opts?.langExt ?? javascript();
  const langPack = opts?.useOutputLang ? outputLang.of(langExt) : langExt;
  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    cmHistory(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    syntaxHighlighting(defaultHighlightStyle),
    langPack,
    EditorView.lineWrapping,
    EditorState.readOnly.of(readOnly),
    EditorView.theme({
      "&": { height: "100%", fontSize: "13px" },
      ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
    }),
  ];
  if (opts?.onDocChange) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          opts.onDocChange!();
        }
      }),
    );
  }
  return new EditorView({
    parent,
    state: EditorState.create({ doc: "", extensions }),
  });
}

const sourceEditor = makeEditor(document.querySelector("#source-editor")!, false, {
  onDocChange: scheduleCompile,
});
const outputEditor = makeEditor(document.querySelector("#output-editor")!, true, {
  useOutputLang: true,
});

let examples: ExampleMeta[] = [];

function setStatus(text: string, kind: "idle" | "ok" | "err" | "busy" = "idle") {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

function setOutput(text: string) {
  outputEditor.dispatch({
    changes: { from: 0, to: outputEditor.state.doc.length, insert: text },
  });
}

async function loadExamples(): Promise<void> {
  const res = await fetch(`${import.meta.env.BASE_URL}examples/manifest.json`);
  examples = (await res.json()) as ExampleMeta[];
  exampleSelect.innerHTML = "";
  for (const ex of examples) {
    const o = document.createElement("option");
    o.value = ex.id;
    o.textContent = ex.title;
    exampleSelect.appendChild(o);
  }
  const params = new URLSearchParams(location.search);
  const initial = params.get("example") ?? examples[0]?.id;
  if (initial) {
    exampleSelect.value = initial;
    await pickExample(initial);
  }
}

async function pickExample(id: string): Promise<void> {
  const ex = examples.find((e) => e.id === id);
  if (!ex) return;
  exampleDesc.textContent = ex.description;
  const res = await fetch(`${import.meta.env.BASE_URL}examples/${ex.file}`);
  const text = await res.text();
  sourceEditor.dispatch({
    changes: { from: 0, to: sourceEditor.state.doc.length, insert: text },
  });
  const url = new URL(location.href);
  url.searchParams.set("example", id);
  history.replaceState(null, "", url);
  scheduleCompile();
}

async function doCompile(): Promise<CompileResponse | null> {
  if (compiling) return null;
  compiling = true;
  compileBtn.disabled = true;
  setStatus("Compiling…", "busy");
  try {
    const language = langSelect.value as TargetLanguage;
    const result = await compileRanger({
      source: sourceEditor.state.doc.toString(),
      language,
      typescript: tsFlag.checked && language === "es6",
    });
    if (result.ok) {
      setOutput(result.output);
      setStatus(`OK · ${result.elapsedMs} ms`, "ok");
      const highlightTs = language === "es6" && tsFlag.checked;
      outputEditor.dispatch({
        effects: outputLang.reconfigure(javascript({ typescript: highlightTs })),
      });
    } else {
      setOutput(result.errors);
      setStatus(`Errors · ${result.elapsedMs} ms`, "err");
    }
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setOutput(msg);
    setStatus("Failed", "err");
    return null;
  } finally {
    compiling = false;
    compileBtn.disabled = false;
  }
}

exampleSelect.addEventListener("change", () => {
  void pickExample(exampleSelect.value);
});
langSelect.addEventListener("change", () => {
  syncToolbarForLanguage();
  scheduleCompile();
});
tsFlag.addEventListener("change", scheduleCompile);
compileBtn.addEventListener("click", () => void doCompile());

runBtn.addEventListener("click", () => {
  if (langSelect.value !== "es6") {
    setStatus("Run works for ES6 only", "err");
    return;
  }
  const code = outputEditor.state.doc.toString();
  if (!code.trim()) return;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(code);
    fn();
    setStatus("Ran (check console)", "ok");
  } catch (e) {
    console.error(e);
    setStatus("Runtime error (see console)", "err");
  }
});

void (async () => {
  setStatus("Loading compiler…", "busy");
  try {
    await loadRangerCompiler();
    await loadExamples();
    setStatus("Ready", "idle");
  } catch (e) {
    setStatus("Compiler load failed", "err");
    setOutput(e instanceof Error ? e.message : String(e));
  }
})();
