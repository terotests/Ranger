/**
 * Appearance follow-ups for the recipe adapter.
 *
 * Recipe is not a model. It can restyle colour, type size, and radius on
 * the current tree. New widgets, copy, and structure are a live agent's job
 * (Codex / Claude / Ollama). This file is the sentence → env-var door.
 */
const COLORS = [
  ["lightblue", "rgb(125,211,252)"],
  ["light blue", "rgb(125,211,252)"],
  ["navy", "rgb(30,64,175)"],
  ["indigo", "rgb(99,102,241)"],
  ["violet", "rgb(167,139,250)"],
  ["purple", "rgb(168,85,247)"],
  ["magenta", "rgb(232,121,249)"],
  ["pink", "rgb(244,114,182)"],
  ["rose", "rgb(251,113,133)"],
  ["crimson", "rgb(220,38,38)"],
  ["red", "rgb(239,68,68)"],
  ["punainen", "rgb(239,68,68)"],
  ["orange", "rgb(249,115,22)"],
  ["oranssi", "rgb(249,115,22)"],
  ["amber", "rgb(245,158,11)"],
  ["gold", "rgb(251,191,36)"],
  ["kulta", "rgb(251,191,36)"],
  ["yellow", "rgb(250,204,21)"],
  ["keltainen", "rgb(250,204,21)"],
  ["lime", "rgb(163,230,53)"],
  ["green", "rgb(34,197,94)"],
  ["vihre", "rgb(34,197,94)"],
  ["mint", "rgb(110,231,183)"],
  ["teal", "rgb(45,212,191)"],
  ["turkoosi", "rgb(45,212,191)"],
  ["cyan", "rgb(34,211,238)"],
  ["sininen", "rgb(59,130,246)"],
  ["blue", "rgb(59,130,246)"],
  ["slate", "rgb(51,65,85)"],
  ["cream", "rgb(255,247,237)"],
  ["kerma", "rgb(255,247,237)"],
  ["white", "rgb(248,250,252)"],
  ["valkoinen", "rgb(248,250,252)"],
  ["black", "rgb(15,23,42)"],
  ["musta", "rgb(15,23,42)"],
];

const WARM_PAPER = "rgb(49,30,20)";
const WARM_CARD = "rgb(69,40,26)";
const LIGHT_PAPER = "rgb(255,247,237)";
const DARK_PAPER = "rgb(15,23,42)";

const STRUCT =
  /\b(add|lis[aä]{2}|create|uusi|reorder|siirr[aä]|move|delete|poista|remove)\b/i;
const STRUCT_WHAT =
  /\b(chart|graph|widget|weather|s[aä]{2}|button|nappi|field|kentt[aä]|image|kuva|map|kartta|tab|row|rivi|column)\b/i;

function hexToRgb(hex) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${r},${g},${b})`;
}

function firstColor(text) {
  const hex = text.match(/#([0-9a-fA-F]{6})/);
  if (hex) return hexToRgb(hex[1]);
  const rgb = text.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgb) return `rgb(${rgb[1]},${rgb[2]},${rgb[3]})`;
  const lower = text.toLowerCase();
  for (const [name, value] of COLORS) {
    if (lower.includes(name)) return value;
  }
  return "";
}

export function parseRestyle(prompt) {
  const raw = String(prompt || "").trim();
  const p = raw.toLowerCase();
  const out = {
    accent: "",
    paper: "",
    card: "",
    titlePx: 0,
    radius: 0,
    blocked: [],
    looksLikeRestyle: false,
  };
  if (!raw) return out;

  if (STRUCT.test(p) && STRUCT_WHAT.test(p)) {
    out.blocked.push(
      "Recipe is scripted: it restyles colour, type size, and radius on this tree. It cannot add widgets or rewrite structure. Pick Codex, Claude Code, or Ollama for a free-form ask.",
    );
  }

  const px = p.match(/\b(\d{2,3})\s*px\b/);
  if (px) out.titlePx = Number(px[1]);
  else if (/larger|bigger|isompi|otsikko|title|font/.test(p)) out.titlePx = 28;
  else if (/smaller|pienempi/.test(p)) out.titlePx = 16;

  const rad = p.match(/\bradius\s+(\d{1,2})\b/);
  if (rad) out.radius = Number(rad[1]);
  else if (/round|pyör|pyore/.test(p)) out.radius = 24;
  else if (/sharp|kulmikas|square/.test(p)) out.radius = 4;

  const color = firstColor(raw);
  const paperHint = /paper|background|tausta|canvas|night|warm|l[aä]mmin|lammin|vaalea|cream|kerma|light theme|dark theme|tumma/.test(
    p,
  );
  if (paperHint) {
    if (color && !/gold|kulta|accent|korost/.test(p)) {
      out.paper = color;
      out.card = color;
    } else if (/warm|l[aä]mmin|lammin/.test(p)) {
      out.paper = WARM_PAPER;
      out.card = WARM_CARD;
    } else if (/vaalea|cream|kerma|light/.test(p)) {
      out.paper = LIGHT_PAPER;
      out.card = "rgb(255,255,255)";
    } else if (/tumma|dark/.test(p)) {
      out.paper = DARK_PAPER;
      out.card = "rgb(30,41,59)";
    }
  }
  if (color && !out.paper) out.accent = color;
  else if (color && /accent|korost|gold|kulta|number|luku|badge/.test(p)) {
    out.accent = color;
  }

  out.looksLikeRestyle = Boolean(
    out.accent ||
      out.paper ||
      out.titlePx ||
      out.radius ||
      /ulkoasu|appearance|restyle|look|style/.test(p),
  );
  return out;
}

export function restyleEnv(parsed) {
  const env = {};
  if (parsed.accent) env.EVG_RESTYLE_ACCENT = parsed.accent;
  if (parsed.paper) env.EVG_RESTYLE_PAPER = parsed.paper;
  if (parsed.card) env.EVG_RESTYLE_CARD = parsed.card;
  if (parsed.titlePx) env.EVG_RESTYLE_TITLE = String(parsed.titlePx);
  if (parsed.radius) env.EVG_RESTYLE_RADIUS = String(parsed.radius);
  if (parsed.blocked.length) env.EVG_RESTYLE_NOTE = parsed.blocked[0];
  return env;
}

export function isRestyleAsk(prompt) {
  const p = parseRestyle(prompt);
  return p.looksLikeRestyle || p.blocked.length > 0;
}
