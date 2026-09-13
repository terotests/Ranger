// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The Confluence macro: read the pasted RangerFlow URL and show it in an
 * iframe. No graph storage, no editor, no backend.
 */
import { view, router } from "@forge/bridge";
import {
  DEFAULT_HEIGHT_PX,
  pastedUrlFromContext,
  toEmbedUrl,
  toEditorUrl,
} from "./share-url.mjs";

const emptyEl = document.getElementById("empty");
const chromeEl = document.getElementById("chrome");
const openEl = document.getElementById("open");
const frameEl = document.getElementById("frame");

function showEmpty(msg) {
  emptyEl.hidden = false;
  emptyEl.textContent = msg;
  chromeEl.hidden = true;
  frameEl.hidden = true;
  frameEl.removeAttribute("src");
  if (typeof view.emitReadyEvent === "function") view.emitReadyEvent();
}

function showDiagram(src, editor) {
  emptyEl.hidden = true;
  chromeEl.hidden = false;
  frameEl.hidden = false;
  frameEl.style.height = `${DEFAULT_HEIGHT_PX}px`;
  frameEl.src = src;
  openEl.onclick = (ev) => {
    ev.preventDefault();
    router.navigate(editor);
  };
}

async function boot() {
  let ctx;
  try {
    ctx = await view.getContext();
  } catch (err) {
    showEmpty("RangerFlow could not read this Confluence page.");
    return;
  }
  const raw = pastedUrlFromContext(ctx);
  if (!raw) {
    showEmpty("Paste a RangerFlow share link into the page. Confluence turns it into the diagram — no /iframe, no sizes.");
    return;
  }
  const src = toEmbedUrl(raw);
  const editor = toEditorUrl(raw);
  if (!src || !editor) {
    showEmpty("That link is not a RangerFlow diagram.");
    return;
  }
  showDiagram(src, editor);
  frameEl.addEventListener("load", () => {
    if (typeof view.emitReadyEvent === "function") view.emitReadyEvent();
  }, { once: true });
}

boot();
