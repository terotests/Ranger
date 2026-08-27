/**
 * Render shared CounterCard with real React → static HTML markup.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const STYLE_KEYS = [
  "width", "height", "margin", "padding", "backgroundColor", "color", "borderRadius",
  "flexDirection", "gap", "fontSize", "fontWeight", "alignItems", "justifyContent",
  "border", "display", "opacity", "lineHeight", "fontFamily", "textAlign",
];

function pickStyle(props) {
  const style = {};
  for (const k of STYLE_KEYS) {
    if (props[k] != null) style[k] = props[k];
  }
  if (style.flexDirection && !style.display) style.display = "flex";
  return style;
}

function View(props) {
  const { children, onClick, role, id, className, ...rest } = props;
  return React.createElement("div", { id, className, role, style: pickStyle(rest), onClick }, children);
}
function Text(props) {
  const { children, id, className, ...rest } = props;
  return React.createElement("span", { id, className, style: pickStyle(rest) }, children);
}
function Button(props) {
  const { children, onClick, disabled, ...rest } = props;
  const style = pickStyle(rest);
  if (!style.padding) style.padding = "8px 14px";
  if (!style.backgroundColor) style.backgroundColor = "#2563eb";
  if (!style.color) style.color = "#ffffff";
  if (!style.borderRadius) style.borderRadius = "6px";
  if (!style.border) style.border = "none";
  return React.createElement("button", { type: "button", disabled, style, onClick }, children);
}

const api = {
  createElement: React.createElement,
  useState: React.useState,
  View,
  Text,
  Button,
};

const { CounterCard } = require("./shared-counter.cjs");
const App = CounterCard(api);

// Static markup at count=0 (useState initial)
const html = renderToStaticMarkup(React.createElement(App));
const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "react-count-0.html"), html);

console.log("React static markup:");
console.log(html);
console.log("has Ranger UI", html.includes("Ranger UI"));
console.log("has count=0", html.includes("count=0"));
console.log("has Increment button", html.includes("Increment"));
