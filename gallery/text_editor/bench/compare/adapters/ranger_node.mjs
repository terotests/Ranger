/**
 * Ranger SoftCanvas adapter — drives the compiled EditorApp nodemodule in Node.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { corpusText, OPS } from "../corpus.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function loadEditorApp() {
  const modPath = path.resolve(
    __dirname,
    "../../../bin/editor_app_module.cjs"
  );
  return require(modPath);
}

function now() {
  return performance.now();
}

export async function runRangerBench({ lines, fontDir }) {
  const { EditorApp, UIInput, UIKey } = loadEditorApp();
  const ops = {};
  const fonts =
    fontDir ||
    path.resolve(__dirname, "../../../../pdf_writer/assets/fonts");

  let t0 = now();
  const app = new EditorApp();
  app.init(fonts);
  ops.init = now() - t0;

  const text = corpusText(lines);
  t0 = now();
  app.setDocument(text);
  ops.open_document = now() - t0;

  t0 = now();
  app.render();
  ops.first_paint = now() - t0;

  t0 = now();
  for (let s = 0; s < 1000; s++) {
    app.layout.scrollByLines(app.buf, 1);
  }
  app.render();
  ops.scroll_1000_lines = now() - t0;

  app.moveCaret(0, 0, false);
  const input = new UIInput();
  t0 = now();
  input.newFrame();
  input.pushText("X");
  app.update(input);
  app.render();
  ops.insert_char = now() - t0;

  const chunk = "a".repeat(1000);
  t0 = now();
  input.newFrame();
  input.pushText(chunk);
  app.update(input);
  app.render();
  ops.insert_1000_chars = now() - t0;

  t0 = now();
  input.newFrame();
  input.pushKey(UIKey.backspace());
  app.update(input);
  app.render();
  ops.backspace = now() - t0;

  t0 = now();
  app.moveCaret(0, 0, false);
  let endLine = Math.min(99, app.buf.lineCount() - 1);
  app.moveCaret(endLine, 0, true);
  app.render();
  ops.select_100_lines = now() - t0;

  t0 = now();
  input.newFrame();
  input.pushText("REPLACED");
  app.update(input);
  app.render();
  ops.replace_selection = now() - t0;

  t0 = now();
  input.newFrame();
  input.setModifiers(false, true);
  input.pushText("a");
  app.update(input);
  app.render();
  ops.select_all = now() - t0;

  t0 = now();
  app.resize(800, 600);
  app.render();
  ops.resize_window = now() - t0;

  let jumpTo = lines >= 1000 ? 900 : Math.floor(lines / 2);
  if (jumpTo >= lines) jumpTo = lines - 1;
  t0 = now();
  app.moveCaret(jumpTo, 0, false);
  app.render();
  ops.jump_line = now() - t0;

  return {
    engine: "ranger-evg",
    host: "node-softcanvas",
    lines,
    chars: app.buf.charCount(),
    ops: Object.fromEntries(OPS.map((k) => [k, ops[k] ?? null])),
  };
}
