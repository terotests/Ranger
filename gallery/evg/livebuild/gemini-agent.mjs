#!/usr/bin/env node
/**
 * Drive EVG live-build with Google Gemini Flash over the network.
 *
 * Not the Cursor `agent` CLI: this process talks to the Gemini API itself,
 * runs the workspace tools (`./evg-agent`, `./evg-ui`, …), and keeps the
 * conversation in `.gemini-history.json` so a Follow-up is the next turn
 * rather than a blank mind.
 *
 *   GEMINI_API_KEY from Google AI Studio is enough.
 *   GOOGLE_API_KEY is accepted if GEMINI_API_KEY is empty.
 *   EVG_GEMINI_MODEL selects the Flash id (default gemini-3.8-flash).
 *   EVG_GEMINI_MAX_TURNS is generateContent rounds per Follow-up (default 64).
 *   EVG_GEMINI_SANDBOX=docker|host — `run` is argv against four tools,
 *   never a shell. Docker is opt-in.
 *   Host tools (MCP-style, not a shell): list_dir, image_info, ocr.
 *   ocr is Tesseract on a workspace image (TESSERACT_PATH). It never
 *   goes through `run`.
 *
 * Stdout is the same `stream-json` shape Cursor already emits, so the
 * page's thinking panel and spend line work without a second parser.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const GEMINI_HISTORY = ".gemini-history.json";
export const GEMINI_ONCE = ".gemini-once.json";
export const ADD_CARD =
  './evg-ui add card --title "…" --row "Title|Sub|value:42" --into doc.evg.json > add.json';
export const ADD_APPBAR =
  './evg-ui add appbar --title "Progress" --into doc.evg.json > add.json';
export const ADD_TILES =
  './evg-ui add tiles --tile "Sleep Average|7h 38m|Quality 84%|☾" --into doc.evg.json > add.json';

/** Compact ranger-ui the model should copy (change the words to the photo). */
export const EXAMPLE_RANGER_UI = {
  format: "ranger-ui",
  version: 2,
  components: {
    "rave.AppBar": { library: "@rave/core", version: "2" },
    "rave.Pills": { library: "@rave/core", version: "2" },
    "rave.Chip": { library: "@rave/core", version: "2" },
    "rave.Bars": { library: "@rave/core", version: "2" },
    "rave.Tiles": { library: "@rave/core", version: "2" },
    "rave.Tile": { library: "@rave/core", version: "2" },
    "rave.Banner": { library: "@rave/core", version: "2" },
    "rave.TabBar": { library: "@rave/core", version: "2" },
    "rave.Tab": { library: "@rave/core", version: "2" },
    SettingsRow: { library: "@rave/settings", version: "1" },
  },
  ui: {
    type: "Screen",
    class: "sky",
    children: [
      { type: "rave.AppBar", props: { title: "Progress" } },
      {
        type: "rave.Pills",
        children: [
          { type: "rave.Chip", props: { label: "Day" } },
          { type: "rave.Chip", props: { label: "Week" } },
          { type: "rave.Chip", props: { label: "Month" } },
          { type: "rave.Chip", props: { label: "Year" } },
        ],
      },
      {
        type: "rave.Bars",
        props: {
          title: "Steps & Calories Trend",
          value: "Avg 9,240 steps/day",
          badge: "+12% vs last week",
          bars: [
            { label: "M", height: "44px", color: "#805754" },
            { label: "T", height: "62px", color: "#EF9587" },
            { label: "W", height: "50px", color: "#524247" },
          ],
        },
      },
      {
        type: "rave.Tiles",
        children: [
          { type: "rave.Tile", props: { label: "Sleep Average", value: "7h 38m", sub: "Quality 84%" } },
          { type: "rave.Tile", props: { label: "Resting HR", value: "64 BPM", sub: "−3 BPM optimal" } },
          { type: "rave.Tile", props: { label: "Hydration", value: "2.3 L/d", sub: "92% of target" } },
          { type: "rave.Tile", props: { label: "Net Burn", value: "2,350 kcal", sub: "kcal / day" } },
        ],
      },
      {
        type: "rave.Banner",
        props: {
          eyebrow: "Milestone Unlocked",
          title: "100k Steps in 10 Days",
          sub: "You're in the top 5% of active users this month!",
        },
      },
      {
        type: "rave.TabBar",
        children: [
          { type: "rave.Tab", id: "nav.today", props: { label: "Today", icon: "⌂" } },
          { type: "rave.Tab", id: "nav.activity", props: { label: "Activity", icon: "⚡" } },
          { type: "rave.Tab", id: "nav.analytics", props: { label: "Progress", icon: "◈", active: true } },
          { type: "rave.Tab", id: "nav.profile", props: { label: "Goals", icon: "◎" } },
        ],
      },
    ],
  },
};

export const EXAMPLE_ADD_RECIPE = [
  './evg-ui add appbar --title "Progress" --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
  './evg-ui add pills --pill "Day" --pill "Week" --pill "Month" --pill "Year" --active Week --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
  './evg-ui add bars --title "Steps & Calories Trend" --value "Avg 9,240 steps/day" --badge "+12% vs last week" --bar "M|55|#805754" --bar "T|78|#EF9587" --bar "W|62|#524247" --bar "T|90|#AAB4F8" --bar "F|96|#AAB4F8" --bar "S|80|#F0D77B" --bar "S|84|#EF9587" --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
  './evg-ui add tiles --tile "Sleep Average|7h 38m|Quality 84%|☾" --tile "Resting HR|64 BPM|−3 BPM|♡" --tile "Hydration|2.3 L/d|92% of target|💧" --tile "Net Burn|2,350 kcal|kcal / day|⚡" --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
  './evg-ui add banner --eyebrow "Milestone Unlocked" --title "100k Steps in 10 Days" --sub "You\'re in the top 5% of active users this month!" --icon "🏆" --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
  './evg-ui add tabbar --tab "Today|⌂|nav.today" --tab "Activity|⚡|nav.activity" --tab "Progress|◈|nav.analytics" --tab "Goals|◎|nav.profile" --active nav.analytics --into doc.evg.json > add.json',
  "./evg-agent patch doc.evg.json add.json",
].join("\n");

export function exampleUiBlock() {
  return [
    "EXAMPLE_UI — match the photo LAYOUT, not a settings list. A Wi-Fi / settings photo is add card --row (SettingsRow). A dashboard is pills + bars + tiles + banner + tabbar — do not flatten a chart or a 2×2 into SettingsRow. Export is rave.AppBar / rave.Pills / rave.Bars / rave.Tile / rave.Banner / rave.TabBar (not evg.div soup).",
    JSON.stringify(EXAMPLE_RANGER_UI),
    "Build it with these commands (add, then patch, then the next). Never add card without --row. Never turn a dashboard into SettingsRows:",
    EXAMPLE_ADD_RECIPE,
  ].join("\n");
}

export const EXPLORE_STREAK_CAP = 2;
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_DOCKER_IMAGE = "node:22-bookworm-slim";
const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "../../..");
export const DEFAULT_MAX_TURNS = 64;
/** Gemini 3 Flash output cap (tokens, thoughts included). Override EVG_GEMINI_MAX_OUTPUT. */
export const DEFAULT_GEMINI_MAX_OUTPUT = 65_536;
/** Paid Gemini 3.8 Flash (Developer API), USD per 1M tokens through 2026-12-31. */
export const GEMINI_FLASH_INPUT_PER_M = 0.75;
export const GEMINI_FLASH_OUTPUT_PER_M = 3.75;
export const GEMINI_FLASH_CACHE_PER_M = 0.075;
const TOOL_OUT_CAP = 24_000;
/** Backstop after compactHistory. The old 350k cap is why a 40-turn
 *  Follow-up billed ~4.7M input tokens — every call replayed the essays. */
export const DEFAULT_HISTORY_CHARS = 24_000;
export const HISTORY_KEEP_MSGS = 8;
export const TOOL_RESULT_CAP = 2_500;
const RUN_TIMEOUT_MS = 90_000;

export function geminiKey(env = process.env) {
  return String(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "").trim();
}

export function geminiModel(env = process.env) {
  return String(env.EVG_GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
}

export function geminiMaxTurns(env = process.env) {
  const n = Number(env.EVG_GEMINI_MAX_TURNS || DEFAULT_MAX_TURNS);
  return Math.max(1, Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_TURNS);
}

export function geminiBase(env = process.env) {
  const raw = String(env.GEMINI_API_BASE || env.GOOGLE_API_BASE || DEFAULT_GEMINI_BASE).trim();
  return raw.replace(/\/$/, "") || DEFAULT_GEMINI_BASE;
}

export function geminiDockerImage(env = process.env) {
  return String(env.EVG_GEMINI_DOCKER_IMAGE || DEFAULT_DOCKER_IMAGE).trim() || DEFAULT_DOCKER_IMAGE;
}

let dockerMemo;
export function dockerRunning(env = process.env) {
  if (env.EVG_GEMINI_DOCKER === "0") return false;
  if (dockerMemo !== undefined) return dockerMemo;
  const bin = env.DOCKER_BIN || "docker";
  try {
    const r = spawnSync(bin, ["info"], {
      encoding: "utf8",
      timeout: 2500,
      stdio: ["ignore", "pipe", "pipe"],
    });
    dockerMemo = r.status === 0;
  } catch {
    dockerMemo = false;
  }
  return dockerMemo;
}

export function resetDockerMemo() {
  dockerMemo = undefined;
}

export function geminiSandbox(env = process.env) {
  const v = String(env.EVG_GEMINI_SANDBOX || "host").trim().toLowerCase();
  if (v === "auto") return dockerRunning(env) ? "docker" : "host";
  if (v === "docker") return dockerRunning(env) ? "docker" : "docker-missing";
  return "host";
}

export function dockerRunArgs(workspace, command, env = process.env) {
  const parsed = typeof command === "string" ? parseRun(command) : command;
  if (parsed.error) throw new Error(parsed.error);
  const image = geminiDockerImage(env);
  const root = env.EVG_GEMINI_REPO || repoRoot;
  const args = [
    "run",
    "--rm",
    "--network",
    "none",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=64m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "-v",
    `${workspace}:${workspace}`,
    "-v",
    `${root}:${root}:ro`,
    "-w",
    workspace,
  ];
  try {
    const { uid, gid } = os.userInfo();
    if (Number.isInteger(uid) && uid >= 0 && Number.isInteger(gid) && gid >= 0) {
      args.push("--user", `${uid}:${gid}`);
    }
  } catch {
    /* Windows */
  }
  args.push(image, parsed.bin, ...parsed.argv);
  return args;
}

function spawnRun(workspace, command, env = process.env) {
  const parsed = parseRun(command);
  if (parsed.error) return { error: parsed.error };
  const childEnv = { ...env };
  delete childEnv.GEMINI_API_KEY;
  delete childEnv.GOOGLE_API_KEY;
  const box = geminiSandbox(env);
  if (box === "docker-missing") {
    return {
      error: "EVG_GEMINI_SANDBOX=docker but docker is not running. Install Docker, or set EVG_GEMINI_SANDBOX=host.",
    };
  }
  let r;
  if (box === "docker") {
    const bin = env.DOCKER_BIN || "docker";
    r = spawnSync(bin, dockerRunArgs(workspace, parsed, env), {
      encoding: "utf8",
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: childEnv,
    });
    if (r.error && /ENOENT/.test(String(r.error))) {
      return { error: "docker is not on PATH" };
    }
  } else {
    r = spawnSync(parsed.bin, parsed.argv, {
      cwd: workspace,
      encoding: "utf8",
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: childEnv,
    });
  }
  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  if (parsed.stdoutTo) {
    try {
      const dest = resolveInWorkspace(workspace, parsed.stdoutTo);
      if (parsed.append && fs.existsSync(dest)) fs.appendFileSync(dest, stdout);
      else fs.writeFileSync(dest, stdout);
    } catch (e) {
      return { error: String(e.message || e), sandbox: box === "docker" ? "docker" : "host" };
    }
  }
  const follow = evgUiAddFollowup(workspace, parsed, stdout, r.status === 0);
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: clip(follow ? follow.stdout : stdout),
    stderr: clip(stderr),
    hint: follow ? follow.stdout : undefined,
    wrote: follow ? follow.wrote : parsed.stdoutTo || undefined,
    sandbox: box === "docker" ? "docker" : "host",
  };
}

function classTokens(cls) {
  return String(cls || "").split(/\s+/).filter(Boolean);
}

function nodeHasClass(node, name) {
  return classTokens(nodePieceClass(node)).includes(name);
}

function hexLum(hex) {
  const h = String(hex || "").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (n.length < 6) return 128;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Paint kit pieces with the photo palette so add-then-patch is already themed. */
export function paintAddOps(text, workspace) {
  const roles = picturePalette(workspace);
  if (!roles) return String(text || "");
  let j;
  try {
    j = JSON.parse(String(text || ""));
  } catch {
    return String(text || "");
  }
  const ops = j && Array.isArray(j.ops) ? j.ops : null;
  if (!ops) return String(text || "");
  const accents = Array.isArray(roles.accents) ? roles.accents : [];
  const pageDark = hexLum(roles.page) < 90;
  const fg = (roles.text && roles.text[0]) || (pageDark ? "#F5F3EF" : "");
  const muted = (accents.length ? accents[accents.length - 1] : "") || (pageDark ? "#8B8E96" : "");
  let accentI = 0;
  let changed = false;
  const setProp = (node, key, value) => {
    if (!node || !value) return;
    if (!node.props || typeof node.props !== "object") node.props = {};
    if (node.props[key]) return;
    node.props[key] = value;
    changed = true;
  };
  const paint = (node) => {
    if (!node || typeof node !== "object") return;
    if (nodeHasClass(node, "ui-card") || nodeHasClass(node, "ui-tiles") || nodeHasClass(node, "ui-tile") || nodeHasClass(node, "ui-bars") || nodeHasClass(node, "ui-tabbar")) {
      setProp(node, "background-color", roles.cards);
    }
    if (nodeHasClass(node, "ui-banner")) setProp(node, "background-color", accents[0] || roles.cards);
    if (nodeHasClass(node, "ui-pill-active")) setProp(node, "background-color", accents[0] || roles.cards);
    if (nodeHasClass(node, "ui-bar") && accents.length) {
      setProp(node, "background-color", accents[accentI++ % accents.length]);
    }
    if (fg) {
      for (const name of ["ui-tile-value", "ui-bars-value", "ui-appbar-title", "ui-tile-label", "ui-bars-title", "ui-banner-title", "ui-row-title", "ui-card-title"]) {
        if (nodeHasClass(node, name)) setProp(node, "color", fg);
      }
    }
    if (muted) {
      for (const name of ["ui-tile-sub", "ui-bars-badge", "ui-banner-sub", "ui-banner-eyebrow", "ui-row-sub"]) {
        if (nodeHasClass(node, name)) setProp(node, "color", muted);
      }
      if (nodeHasClass(node, "ui-pill") && !nodeHasClass(node, "ui-pill-active")) setProp(node, "color", muted);
    }
    for (const kid of node.children || []) paint(kid);
  };
  for (const op of ops) {
    if (op && op.op === "insert" && op.node) paint(op.node);
  }
  if (j.tree) paint(j.tree);
  if (!changed) return String(text || "");
  return JSON.stringify(j, null, 2) + "\n";
}

/** add prints ops; --into is the insert path, not an edit. Keep the ops on disk. */
function evgUiAddFollowup(workspace, parsed, stdout, ok) {
  if (!ok || !parsed || parsed.bin !== "./evg-ui" || parsed.argv[0] !== "add") return null;
  if (!/"op"\s*:/.test(String(stdout || ""))) return null;
  const dest = parsed.stdoutTo || "add.json";
  const file = resolveInWorkspace(workspace, dest);
  let text = String(stdout || "");
  try {
    if (parsed.stdoutTo) text = fs.readFileSync(file, "utf8");
  } catch {
    /* use stdout */
  }
  const kind = parsed.argv[1] || "";
  const painted = attachLeftoverRemoves(paintAddOps(text, workspace), workspace, kind);
  try {
    fs.writeFileSync(file, painted);
  } catch {
    if (!parsed.stdoutTo) {
      try {
        fs.writeFileSync(file, text);
      } catch {
        return null;
      }
    }
  }
  const themed = painted !== text;
  const leftover = leftoverSettingsAts(evgRootOf(workspace));
  const cleared = leftover.length && /"op"\s*:\s*"remove"/.test(painted);
  return {
    wrote: dest,
    stdout: `wrote ${dest} (${painted.length} bytes). Next: ./evg-agent patch doc.evg.json ${dest}. --into is the insert path, not an edit. Do not read_file ${dest}.${themed ? " Palette from the photo was painted on the piece." : ""}${cleared ? ` Leftover SettingsRow cards ${leftover.join(" ")} will be removed on patch (highest index first).` : ""}`,
  };
}

export const GEMINI_TOOLS = [
  {
    name: "run",
    description:
      "Run ONE workspace tool as argv, not a shell. Only ./evg-agent, ./evg-ui, ./evg-app, ./evg-image. Example: ./evg-agent outline doc.evg.json. Never ./evg-agent with no verb.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The tool and its arguments. Not a shell line.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Read a UTF-8 file in the workspace. Not TASK.md (already the ask), not a .evg.json.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path, for example doc.evg.json or layout.json." },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write a UTF-8 file in the workspace. Use this for ops.json (set-prop / set-css / insert with class-name ui-card), then ./evg-agent patch doc.evg.json ops.json.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path to write." },
        contents: { type: "string", description: "The full file contents." },
      },
      required: ["path", "contents"],
    },
  },
  {
    name: "list_dir",
    description: "List files in a workspace folder. Default is the workspace root. Hidden files are omitted.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative directory, default ." },
      },
    },
  },
  {
    name: "image_info",
    description:
      "Palette or image size, once per path. A second call on the same file is refused — use those colours and add a card.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative image or attachment.json. Default attachment.json." },
      },
    },
  },
  {
    name: "ocr",
    description:
      "OCR a workspace image once. A second ocr is refused. Default attachment.png. Do not crop BMPs or call tesseract via run.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative png/jpg/webp/tif/bmp. Default attachment.png." },
        psm: { type: "integer", description: "Tesseract page segmentation 0–13. Default 6 (block of text)." },
        lang: { type: "string", description: "Tesseract language, default eng." },
      },
    },
  },
];

export function geminiSystemPrompt() {
  return `You edit the live document in this folder. TASK.md is the ask (it names the size). AGENTS.md is the guide.

${exampleUiBlock()}

ONE outline, then add FILLED pieces like EXAMPLE_UI — change the words to the photo/ask. Match the layout you see. An add card without --row is an empty box; do not query it. A Follow-up that says continue / jatka means keep patching this doc — do not start over.

A picture is a PHOTO of any UI, not the UI:
- The first turn already has the pixels, the vectorized SVG, the palette and OCR. Rebuild what you see.
- image_info / ocr / read_file attachment.svg send them again. Do not read attachment.ops.json (paste path data).
- ./evg-agent patch doc.evg.json attachment.ops.json PASTES the photo. "Make a dashboard like this" means rebuild with ./evg-ui, not paste.

The loop:
1. outline
2. ./evg-ui add appbar|pills|bars|tiles|banner|card|chips|tabbar — then ./evg-agent patch doc.evg.json add.json.
   A 2×2 of metrics is add tiles. A bar chart is add bars. A highlight is add banner. Day/Week is add pills. add card --row is SettingsRow — only a settings list. Do not flatten a dashboard into rows.
   Export is ranger-ui: those classes become rave.AppBar / rave.Pills / rave.Bars / rave.Tile / rave.Banner / rave.TabBar / rave.Card / SettingsRow. A hand insert node MUST have a kit class-name (ui-card / ui-tile / ui-bars / ui-banner / ui-pills / ui-appbar / ui-tabbar). Then set-css a sheet — set-css replaces the whole sheet, send it whole. Bare evg.div trees fail Export.
   spec is optional. Do not smoke-test with add button. Do not read AGENTS.md. No --help.
3. ./evg-agent measure doc.evg.json --width=W --height=H
   W×H is what TASK.md said: phone 390×844, tablet 820×1180, desktop 1440×900. Not always 390.
   measure count:0 means no page overflow, not a finished screen. The page footer layout N / align / tight is for you — those are suspicious overlaps. count:0 with align/tight is NOT done. Copy OCR spaces (7h 38m, not 7h38m). EXAMPLE_UI is the types, not the words.

insert the first child at "0", not "0/0" — 0/0 does not exist on an empty root. insert with only "tag" is an empty box. A subtree is "node" (document shape), not "children" on the op. One add card is a whole measured piece with ui-card. box-sizing is not patchable — one bad prop rejects the whole file.

EVG layout is HTML/CSS flex and grid: display:flex, flex-direction:column|row, gap, padding; or display:grid, grid-template-columns:1fr 1fr. Not left/top. Two cards side by side are one grid row. Erazer / SVG boxes are the photo geometry — map them to flex/grid. Use the brief hexes: set-prop background-color on the root (page) and each card. The seed rgb() is a placeholder.

Never write_file doc.evg.json or layout.json. Never read_file a .evg.json — the tree is on disk; outline / measure / patch. Do not wipe pills / tiles / bars / banner / tabbar. Leftover SettingsRow cards and the old icon-chip row from a wrong first pass: remove them ALL in one ops.json (highest index first) — that is not wiping the screen. Do not leave both a settings list and a dashboard. insert at "0" adds a sibling under the root; insert at "0/0" goes inside the first card. padding is padding-top / padding-left (not padding). image_info is the palette already in the brief — do not keep calling it.

Several screens (Orders / Analytics / Settings) is an app, not hidden divs:
1. set-id each tab: {"op":"set-id","at":"0/6/0","value":"nav.home"} — id is NOT a property (set-prop id is rejected).
2. ./evg-app init app --from=doc.evg.json  (or Run on the page). Then patch app/pages/<state>.evg.json so the pages differ. ./evg-app check app --width=W --height=H. count:N with missing nav.* means the tabs have no ids yet.
3. Do not rewrite a whole page tree. Patch one card on that page. The live phone is still doc.evg.json until Run.

set-prop is one CSS name (height, padding-top, gap, background-color), not style= and not a shorthand blob. set-prop needs "prop" and "value" — {"op":"set-prop","at":"0","prop":"flex-direction","value":"column"}, not 0=column. A 1px overflow is one set-prop on the finding path, then measure — do not query every sibling. outline --at=PATH for one node; query/measure replies already include the match props and boxes [x,y,w,h]. ops.json is {"ops":[...]} — a bare op object or [] is "no ops in that file".

After an empty outline the NEXT tool is ./evg-ui add appbar (or pills / tiles / bars matching the photo), not list, not read_file TASK.md. add card is only a settings list. TASK.md is already this message. The photo is already in the first ask. --into is the insert path — it does not edit the file. After add > add.json the next tool is ./evg-agent patch doc.evg.json add.json, not read_file add.json. The host paints the photo palette onto the new piece — do not flatten it into SettingsRows to "use the kit".

A picture in the ask can be any UI. Rebuild what you see — match that layout, not a generic settings list. Labels with spaces (Acme 360, not Acme360). If you need the photo or SVG again, call image_info, ocr, or read_file attachment.svg.

Labels: one span per phrase, spaces between words ("Acme 360", not "Acme360"). Do not insert the same text twice — two overlapping spans paint as Revenuee / monthlyy.

A thought is not a patch. One card per write_file (under 2000 bytes). A whole-page ops.json is cut off before the functionCall and the host sees no tool. Do not paste JSON in the thought. If you still have a header, KPI row, or body column to add, call a tool in that turn. Stopping after "Section 3 will be…" leaves a half screen. Header plus four KPI cards is not the dashboard — keep adding until outline names the remaining cards (products, opportunities, feed).

Do not git, evg_agent.js, --help, /tmp, python, sips. When the outline matches the ask AND measure has no align/tight (page footer layout ok), stop. count:0 alone is not a match.`;
}

/**
 * Gemini 3 often writes the next section in a thought — or dumps a whole
 * ops.json into the candidate — and hits maxOutputTokens before a
 * functionCall. The host used to treat "no calls" as done; after a nudge
 * it still finished if the retry also overflowed.
 */
export const MAX_PLAN_NUDGES = 3;
export const MAX_STALL_NUDGES = 3;
export const OPS_WRITE_CAP = 4000;
export const THOUGHT_SLIM_CAP = 600;
export const PLAN_NUDGE =
  "Your last reply used the output budget and never issued a functionCall. A plan is not a patch. Do not dump the page in the thought. Call write_file now with ops.json under 2000 bytes (ONE card) or ./evg-ui add card, then ./evg-agent patch.";
export const STALL_NUDGE =
  `Stop exploring. Next tool is ${ADD_CARD} then ./evg-agent patch doc.evg.json add.json. Not ocr, not image_info, not list, not TASK.md.`;
export const PICTURE_STALL_NUDGE =
  "You already saw the photo. Copy EXAMPLE_UI types for the LAYOUT you see. A chart is add bars, a 2×2 is add tiles, a highlight is add banner, Day/Week is add pills, a bottom nav is add tabbar. add card --row is ONLY a settings list — do not flatten a dashboard into SettingsRow. NEXT: one FILLED ./evg-ui add … then patch. Not outline, not query, not svg.";
export const SVG_BRIEF_CAP = 64_000;
export const FILE_READ_CAP = 64_000;
export const IMAGE_INLINE_MAX = 3_500_000;

export function stallNudgeFor(workspace) {
  return hasPicture(workspace) ? PICTURE_STALL_NUDGE : STALL_NUDGE;
}

export function hasPicture(workspace) {
  if (!workspace) return false;
  for (const name of ["attachment.json", "attachment.png", "attachment.jpg", "attachment.jpeg", "attachment.webp"]) {
    if (fs.existsSync(path.join(workspace, name))) return true;
  }
  return false;
}

const PLAN_FUTURE =
  /\b(let's.{0,60}?\b(?:build(?:ing|s)?|built|add|insert|continue|patch|write)|i(?:'| wi)ll (?:now |then )?(?:add|insert|build|write|patch|keep|get|construct|create)|next(?:\s+i|'ll|\s+step)|then (?:i(?:'| wi)ll|let's)|write_file|functionCall|write(?:_file)? ops|ops\.json|remaining (?:cards?|columns?)|keep (?:building|going|adding)|time to (?:build|add|insert)|i(?: am|'m) going to|jatka)\b/i;
const PLAN_DONE =
  /\b(done|finished|complete|matches the ask|nothing (?:left|more) to (?:add|do)|outline now names)\b/i;

export function looksLikeUnfinishedPlan(text, thought = "") {
  const s = `${text}\n${thought}`.replace(/\s+/g, " ").trim();
  if (s.length < 24) return false;
  if (!PLAN_FUTURE.test(s)) return false;
  if (PLAN_DONE.test(s) && !/\b(remaining|keep (?:building|adding)|i(?:'| wi)ll (?:add|insert|build)|let's (?:build|add|insert)|write_file)\b/i.test(s)) {
    return false;
  }
  return true;
}

export function needsToolNudge({ text = "", thought = "", finishReason = "", outputTokens = 0 } = {}) {
  if (looksLikeUnfinishedPlan(text, thought)) return true;
  if (String(finishReason || "") === "MAX_TOKENS") return true;
  if ((Number(outputTokens) || 0) >= 7000) return true;
  return false;
}

/** Drop a trailing plan-only model turn (and our nudge) so a Follow-up does not continue an 8k essay. */
export function dropTrailingPlan(contents) {
  const out = Array.isArray(contents) ? contents.slice() : [];
  let guard = 0;
  while (out.length && guard++ < 16) {
    const last = out[out.length - 1];
    const parts = (last && last.parts) || [];
    if (last.role === "user" && parts.some((p) => p.functionResponse)) break;
    const joined = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("\n");
    if (last.role === "user" && /plan is not a patch/.test(joined)) {
      out.pop();
      continue;
    }
    if (last.role === "model") {
      const split = splitParts(parts);
      if (!split.calls.length && (looksLikeUnfinishedPlan(split.text, split.thought) || joined.length > 2000)) {
        out.pop();
        continue;
      }
    }
    break;
  }
  return out;
}

/** Thoughts are for the console; sending 8k of them back makes the next turn imitate the essay. */
export function slimModelThoughts(contents, cap = THOUGHT_SLIM_CAP) {
  return (Array.isArray(contents) ? contents : []).map((c) => {
    if (!c || c.role !== "model" || !Array.isArray(c.parts)) return c;
    return {
      ...c,
      parts: c.parts.map((p) => {
        if (p && p.thought && typeof p.text === "string" && p.text.length > cap) {
          return { ...p, text: `${p.text.slice(0, cap)}…` };
        }
        return p;
      }),
    };
  });
}

/**
 * What we put back into the prompt after a tool runs. The live document
 * stays on disk; the model gets a line, not a 13k tree or an 8k outline.
 * query/measure JSON is compacted by field (matches, boxes, findings) so a
 * 1px overflow still names the box instead of dying as count:1.
 */
export function compactToolResult(name, rawArgs, result) {
  if (!result || result.error) return result;
  if (name === "read_file") {
    if (result.contents == null) return result;
    const n = String(result.contents).length;
    if (n > TOOL_RESULT_CAP) {
      return { path: result.path, bytes: n, hint: "truncated — outline / measure, do not re-read" };
    }
    return result;
  }
  if (name === "write_file") {
    return { ok: true, path: result.path, bytes: result.bytes };
  }
  if (name === "ocr" && result.text && String(result.text).length > 2_000) {
    return { ...result, text: clip(result.text, 2_000) };
  }
  if (name === "run") {
    const stdout = String(result.stdout || "");
    const stderr = String(result.stderr || "");
    const j = firstJsonObject(stdout);
    if (j && typeof j === "object") {
      return compactRunJson(j, result);
    }
    if (/^0\s+\S+/.test(stdout)) {
      const lines = stdout
        .trim()
        .split(/\n/)
        .filter((l) => /^\d/.test(l.trim()));
      const out = {
        ok: result.ok,
        status: result.status,
        stdout: clip(stdout, TOOL_RESULT_CAP),
        nodes: lines.length,
      };
      if (result.hint) out.hint = result.hint;
      else if (lines.length <= 1) {
        out.hint = `empty seed — not done. Next: ${ADD_APPBAR} then patch. A dashboard then add pills|bars|tiles|banner — not a card of SettingsRows.`;
      } else {
        const glued = gluedLabelHints(stdout);
        if (glued.length) {
          out.hint = `glued labels ${glued.join(", ")} — copy OCR spaces (7h 38m, not 7h38m). Not done.`;
        }
      }
      if (stderr) out.stderr = clip(stderr, 400);
      return out;
    }
    if (stdout.length > TOOL_RESULT_CAP) {
      return {
        ok: result.ok,
        status: result.status,
        stdout: clip(stdout, TOOL_RESULT_CAP),
        stderr: clip(stderr, 400),
      };
    }
  }
  return result;
}

const MATCH_PROP_PREFER = [
  "height",
  "width",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "display",
  "flex-direction",
  "class-name",
  "background-color",
  "border-radius",
  "justify-content",
  "align-items",
  "margin-top",
];

function pickMatchProps(props) {
  if (!props || typeof props !== "object") return {};
  const out = {};
  for (const k of MATCH_PROP_PREFER) {
    if (props[k] != null) out[k] = props[k];
  }
  for (const k of Object.keys(props)) {
    if (out[k] != null) continue;
    if (Object.keys(out).length >= 16) break;
    out[k] = props[k];
  }
  return out;
}

function compactMatch(m) {
  if (!m || typeof m !== "object") return m;
  return { at: m.at, tag: m.tag, children: m.children, props: pickMatchProps(m.props) };
}

function compactBox(b) {
  if (!b || typeof b !== "object") return b;
  const o = { at: b.at, x: b.x, y: b.y, w: b.w, h: b.h };
  if (b.gapNext != null) o.gapNext = b.gapNext;
  if (b.tag) o.tag = b.tag;
  return o;
}

function findingPaths(findings) {
  const wanted = new Set();
  const re = /\b(\d+(?:\/(?:k:[A-Za-z_][\w-]*|\d+))*)/g;
  for (const f of findings || []) {
    const s = String(f);
    let m;
    while ((m = re.exec(s))) wanted.add(m[1]);
  }
  return wanted;
}

/** Same align/tight lines the page footer shows as `layout N`. count:0 is not clean. */
export function layoutSuspicion(j) {
  if (!j || typeof j !== "object") return { findings: [], align: [], tight: [], n: 0, line: "" };
  const layout = j.layout && typeof j.layout === "object" ? j.layout : {};
  const findings = [...(j.findings || []), ...(layout.findings || [])].filter(Boolean);
  const align = [...(j.align || []), ...(layout.align || [])].filter(Boolean);
  const tight = [...(j.tight || []), ...(layout.tight || [])].filter(Boolean);
  const n = findings.length + align.length;
  const bits = [];
  if (n) bits.push(`layout ${n} — not done`);
  if (findings.length) bits.push(findings.slice(0, 3).join("; "));
  if (align.length) bits.push("suspicious overlap/align: " + align.slice(0, 3).join("; "));
  if (tight.length) bits.push("tight: " + tight.slice(0, 2).join(" · "));
  if (!n && tight.length) bits.unshift("crowded — check overlap");
  return { findings, align, tight, n, line: bits.join(" — ") };
}

/** Outline quotes that lost OCR spaces (7h38m, 64BPMM). */
export function gluedLabelHints(raw) {
  const out = [];
  const re = /"([^"]+)"/g;
  let m;
  while ((m = re.exec(String(raw || "")))) {
    const t = m[1];
    if (t.length < 5) continue;
    const glued = (!/\s/.test(t) && /[A-Za-z]/.test(t) && /\d/.test(t)) || /[a-z][A-Z]/.test(t) || /([A-Za-z])\1{2,}/.test(t);
    if (glued) out.push(t);
  }
  return out.slice(0, 6);
}

function compactRunJson(j, result) {
  const out = { ok: result.ok, status: result.status };
  if (j.error) out.error = j.error;
  if (j.count != null) out.count = j.count;
  if (j.bottomFree != null) out.bottomFree = j.bottomFree;
  if (j.width != null) out.width = j.width;
  if (j.height != null) out.height = j.height;
  if (j.applied != null) out.applied = j.applied;
  if (j.next) out.next = j.next;
  if (Array.isArray(j.findings) && j.findings.length) out.findings = j.findings.slice(0, 6);
  if (Array.isArray(j.missing) && j.missing.length) out.missing = j.missing.slice(0, 8);
  if (Array.isArray(j.rejected) && j.rejected.length) out.rejected = j.rejected.slice(0, 3);
  if (Array.isArray(j.tight) && j.tight.length) out.tight = j.tight.slice(0, 4);
  if (Array.isArray(j.align) && j.align.length) out.align = j.align.slice(0, 3);
  if (Array.isArray(j.matches) && j.matches.length) {
    out.matches = j.matches.slice(0, 6).map(compactMatch);
  }
  if (Array.isArray(j.boxes) && j.boxes.length) {
    const wanted = findingPaths(j.findings);
    const picked = [];
    const seen = new Set();
    for (const b of j.boxes) {
      if (!b || !wanted.has(b.at) || seen.has(b.at)) continue;
      picked.push(compactBox(b));
      seen.add(b.at);
    }
    for (const b of j.boxes) {
      if (picked.length >= 12) break;
      if (!b || seen.has(b.at)) continue;
      picked.push(compactBox(b));
      seen.add(b.at);
    }
    out.boxes = picked;
  }
  if (j.nodes != null) out.nodes = j.nodes;
  if (j.layout && typeof j.layout === "object") {
    out.layout = {
      count: j.layout.count,
      nodes: j.layout.nodes,
      bottomFree: j.layout.bottomFree,
      findings: Array.isArray(j.layout.findings) ? j.layout.findings.slice(0, 4) : undefined,
      align: Array.isArray(j.layout.align) ? j.layout.align.slice(0, 4) : undefined,
      tight: Array.isArray(j.layout.tight) ? j.layout.tight.slice(0, 4) : undefined,
    };
  }
  const sus = layoutSuspicion(j);
  if (sus.line) out.hint = sus.line;
  if (result.stderr) out.stderr = clip(result.stderr, 400);
  return out;
}

function snapshotDropped(dropped) {
  const bits = [];
  for (const c of dropped || []) {
    for (const p of (c && c.parts) || []) {
      if (p && p.functionCall && p.functionCall.name) bits.push(`called ${p.functionCall.name}`);
      if (p && p.functionResponse) {
        const n = p.functionResponse.name || "tool";
        const r = p.functionResponse.response;
        bits.push(`${n}: ${clipOneLine(typeof r === "string" ? r : JSON.stringify(r || {}), 72)}`);
      }
    }
  }
  return [
    "Earlier turns were compacted. The live UI is doc.evg.json on disk, not this chat.",
    bits.length ? `Already ran: ${bits.slice(-10).join("; ")}.` : "",
    "Continue with ./evg-ui add card then patch. Do not read TASK.md again. The photo and SVG stay in the ask.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Keep the first user task and the last few messages. Everything in
 * between becomes one snapshot so turn 40 does not replay turn 1–39.
 */
export function slimStoredResults(contents) {
  return (Array.isArray(contents) ? contents : []).map((c) => {
    if (!c || !Array.isArray(c.parts)) return c;
    return {
      ...c,
      parts: c.parts.map((p) => {
        if (!p || !p.functionResponse) return p;
        const fr = p.functionResponse;
        return {
          ...p,
          functionResponse: { ...fr, response: compactToolResult(fr.name, {}, fr.response) },
        };
      }),
    };
  });
}

export function compactHistory(contents, extra = {}) {
  const keep = Number(extra.keep != null ? extra.keep : HISTORY_KEEP_MSGS);
  const cap = Number(extra.cap != null ? extra.cap : DEFAULT_HISTORY_CHARS);
  const out = slimStoredResults(Array.isArray(contents) ? contents.slice() : []);
  if (out.length <= 2) return out;
  let cut = out.length > keep + 1 ? out.length - keep : 1;
  if (cut < 1) cut = 1;
  if (out[cut] && out[cut].role === "user" && (out[cut].parts || []).some((p) => p.functionResponse) && cut > 1) {
    cut -= 1;
  }
  if (cut > 1) {
    const head = out[0];
    const dropped = out.slice(1, cut);
    const tail = out.slice(cut);
    const snap = snapshotDropped(dropped);
    return trimHistory([head, { role: "user", parts: [{ text: snap }] }, ...tail], cap);
  }
  return trimHistory(out, cap);
}

export function prepareContents(contents, env = {}) {
  const keep = Number(env.EVG_GEMINI_HISTORY_KEEP || HISTORY_KEEP_MSGS);
  const cap = Number(env.EVG_GEMINI_HISTORY_CHARS || DEFAULT_HISTORY_CHARS);
  return compactHistory(slimModelThoughts(slimStoredResults(contents)), { keep, cap });
}

export function payloadStats(body) {
  const sys = JSON.stringify((body && body.systemInstruction) || "").length;
  const tools = JSON.stringify((body && body.tools) || "").length;
  const hist = JSON.stringify((body && body.contents) || "").length;
  const chars = sys + tools + hist;
  return {
    chars,
    sys,
    tools,
    hist,
    msgs: ((body && body.contents) || []).length,
    tok: Math.round(chars / 4),
  };
}

export function formatPayloadStats(s) {
  return `send ${tokCount(s.chars)} chars ~${tokCount(s.tok)} tok · ${s.msgs} msgs (sys ${tokCount(s.sys)}, tools ${tokCount(s.tools)}, hist ${tokCount(s.hist)})`;
}

function clip(text, cap = TOOL_OUT_CAP) {
  const s = String(text ?? "");
  if (s.length <= cap) return s;
  return s.slice(0, cap) + `\n… truncated ${s.length - cap} chars`;
}

export function resolveInWorkspace(workspace, rel) {
  const root = path.resolve(workspace);
  const full = path.resolve(root, String(rel || ""));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("path leaves the workspace");
  }
  return full;
}

export function argsOf(fc) {
  let a = (fc && (fc.args ?? fc.arguments)) || {};
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      a = { command: a };
    }
  }
  return a && typeof a === "object" && !Array.isArray(a) ? a : {};
}

export const RUN_BINS = ["./evg-agent", "./evg-ui", "./evg-app", "./evg-image"];
export const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp", ".gif"]);
const OCR_DEFAULTS = ["attachment.png", "attachment.jpg", "attachment.jpeg", "attachment.webp"];

export function tesseractBin(env = process.env) {
  return String(env.TESSERACT_PATH || env.EVG_TESSERACT || "tesseract").trim() || "tesseract";
}

/** Compiled tool sources and the conversation log are not part of the phone. */
export const GEMINI_TRACE = ".gemini-trace.log";

export function loadOnce(workspace) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, GEMINI_ONCE), "utf8"));
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

export function saveOnce(workspace, patch) {
  const next = { ...loadOnce(workspace), ...patch };
  fs.writeFileSync(path.join(workspace, GEMINI_ONCE), `${JSON.stringify(next)}\n`);
  return next;
}

export function pendingOpsFile(workspace) {
  let docMtime = 0;
  try {
    docMtime = fs.statSync(path.join(workspace, "doc.evg.json")).mtimeMs;
  } catch {
    docMtime = 0;
  }
  try {
    for (const name of fs.readdirSync(workspace)) {
      if (name === "attachment.ops.json") continue;
      if (!(/^(add|ops)[-_.a-z0-9]*\.json$/i.test(name) || /\.ops\.json$/i.test(name))) continue;
      let mtime = 0;
      try {
        mtime = fs.statSync(path.join(workspace, name)).mtimeMs;
      } catch {
        continue;
      }
      if (mtime > docMtime + 20) return name;
    }
  } catch {
    /* empty workspace */
  }
  return "";
}

export function isSightseeingCall(name, rawArgs) {
  if (name === "list_dir" || name === "image_info" || name === "ocr") return true;
  if (name === "read_file") {
    const p = String((rawArgs && rawArgs.path) || "");
    return /TASK\.md|AGENTS\.md|add\.json|ops.*\.json|attachment\.(svg|png|jpg|jpeg|webp|json)/i.test(p);
  }
  if (name === "run") {
    const c = String((rawArgs && rawArgs.command) || "");
    if (/^\.\/evg-ui\b/.test(c) && !/\badd\b/.test(c)) return true;
    if (/\boutline\b/.test(c) || /\bquery\b/.test(c)) return true;
  }
  return false;
}

export function exploreStreakOf(workspace) {
  return Number(loadOnce(workspace).exploreStreak) || 0;
}

export function bumpExplore(workspace, sightseeing) {
  if (!workspace || !hasPicture(workspace)) return 0;
  const streak = sightseeing ? exploreStreakOf(workspace) + 1 : 0;
  saveOnce(workspace, { exploreStreak: streak });
  return streak;
}

/** Outline/query/svg in a row — the picture-rebuild stall. Palette/OCR have their own once-guards. */
export function isLoopCall(name, rawArgs) {
  if (name === "list_dir") return true;
  if (name === "read_file") {
    const p = String((rawArgs && rawArgs.path) || "");
    return /attachment\.(svg|png|jpg|jpeg|webp)|TASK\.md|AGENTS\.md/i.test(p);
  }
  if (name === "run") {
    const c = String((rawArgs && rawArgs.command) || "");
    return /\boutline\b/.test(c) || /\bquery\b/.test(c);
  }
  return false;
}

export function denyExplore(workspace, name, rawArgs) {
  if (!workspace || !hasPicture(workspace) || !isLoopCall(name, rawArgs)) return "";
  if (exploreStreakOf(workspace) < EXPLORE_STREAK_CAP) return "";
  return "already looked. NEXT is a FILLED piece like EXAMPLE_UI: add pills, add bars, add tiles or add banner — not a card of SettingsRows. Then patch. Not outline, not query, not image_info, not svg.";
}

function insertLooksEmptyPiece(node) {
  if (!node || typeof node !== "object") return false;
  const kids = Array.isArray(node.children) ? node.children : [];
  const cls = nodePieceClass(node);
  if (/ui-card/.test(cls)) {
    return !kids.some(
      (k) =>
        k &&
        (k.text ||
          (Array.isArray(k.children) && k.children.length) ||
          /ui-row|ui-card-title/.test(nodePieceClass(k))),
    );
  }
  if (/ui-appbar/.test(cls)) {
    return !kids.some((k) => /ui-appbar-title/.test(nodePieceClass(k)) && (k.text || k.textContent));
  }
  return false;
}

export function pendingOpsHint(workspace, name) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, name), "utf8"));
    const insert = (j.ops || []).find((o) => o && o.op === "insert");
    if (insert && insertLooksEmptyPiece(insert.node)) {
      return `${name} is an empty ${nodePieceClass(insert.node) || "box"} — do not patch it. ${ADD_CARD} with --row, then patch.`;
    }
  } catch {
    /* parse */
  }
  return `${name} is on disk — ./evg-agent patch doc.evg.json ${name}. Do not read_file it.`;
}

export function recentSightseeing(contents, n = 4) {
  const calls = [];
  for (const c of contents || []) {
    for (const p of (c && c.parts) || []) {
      if (p && p.functionCall && p.functionCall.name) {
        calls.push({ name: p.functionCall.name, args: argsOf(p.functionCall) });
      }
    }
  }
  const tail = calls.slice(-n);
  return tail.length >= n && tail.every((c) => isSightseeingCall(c.name, c.args));
}

export function denyRead(rel) {
  const name = path.basename(String(rel || ""));
  if (name === GEMINI_HISTORY) return "read_file will not open the conversation log";
  if (name === GEMINI_TRACE) return "read_file will not open the tool trace";
  if (/^evg[_-].+\.js$/i.test(name)) {
    return "read_file will not open compiled tool sources — call ./evg-agent, do not read the JS";
  }
  if (name === "attachment.ops.json") {
    return "that file is path data for pasting the photo — patch attachment.ops.json to paste; read_file attachment.svg for the vector, image_info for the palette";
  }
  if (/^(add|ops)[-_.a-z0-9]*\.json$/i.test(name) || /\.ops\.json$/i.test(name)) {
    return `${name} is ops — ./evg-agent patch doc.evg.json ${name}. Do not read it.`;
  }
  if (name === "AGENTS.md") {
    return "the loop is already in the system prompt — outline the screen, then ./evg-ui add card. Do not load the whole guide.";
  }
  if (name === "TASK.md") {
    return `TASK.md is already the ask. Next: ${ADD_CARD} then ./evg-agent patch doc.evg.json add.json`;
  }
  if (name === GEMINI_ONCE) return "read_file will not open the once-stamp";
  return "";
}

export function denyWrite(rel) {
  const name = path.basename(String(rel || ""));
  if (name === GEMINI_HISTORY) return "write_file will not overwrite the conversation log";
  if (name === "doc.evg.json") {
    return "write_file will not replace doc.evg.json — write ops.json, then ./evg-agent patch doc.evg.json ops.json";
  }
  if (name === "layout.json") {
    return "write_file will not invent layout.json — ./evg-agent measure writes it";
  }
  if (name === GEMINI_ONCE) return "write_file will not overwrite the once-stamp";
  return "";
}

function defaultOcrPath(workspace) {
  for (const name of OCR_DEFAULTS) {
    if (fs.existsSync(path.join(workspace, name))) return name;
  }
  return OCR_DEFAULTS[0];
}

/**
 * Width/height from a header. No decoder, no pixels — the thing Gemini
 * tried to invent with Python + BMP crops.
 */
export function imageHeader(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf || []);
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { kind: "png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      if (i + 4 > b.length) break;
      const len = b.readUInt16BE(i + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return { kind: "jpeg", height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      if (len < 2) break;
      i += 2 + len;
    }
    return { error: "jpeg has no size marker" };
  }
  if (b.length >= 10 && b.toString("ascii", 0, 3) === "GIF") {
    return { kind: "gif", width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (b.length >= 26 && b[0] === 0x42 && b[1] === 0x4d) {
    const h = b.readInt32LE(22);
    return { kind: "bmp", width: b.readInt32LE(18), height: h < 0 ? -h : h };
  }
  if (b.length >= 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const fourcc = b.toString("ascii", 12, 16);
    if (fourcc === "VP8 ") {
      return { kind: "webp", width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (fourcc === "VP8L" && b.length >= 25) {
      const bits = b.readUInt32LE(21);
      return { kind: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === "VP8X") {
      return {
        kind: "webp",
        width: 1 + b[24] + (b[25] << 8) + (b[26] << 16),
        height: 1 + b[27] + (b[28] << 8) + (b[29] << 16),
      };
    }
  }
  return { error: "unrecognised image header" };
}

function listDir(workspace, rel) {
  const requested = String(rel || "").trim() || ".";
  const dir = resolveInWorkspace(workspace, requested);
  if (!fs.existsSync(dir)) return { error: `not found: ${requested}` };
  const st = fs.statSync(dir);
  if (!st.isDirectory()) return { error: `not a directory: ${requested}` };
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .map((e) => {
      const item = { name: e.name, kind: e.isDirectory() ? "dir" : "file" };
      if (e.isFile()) item.bytes = fs.statSync(path.join(dir, e.name)).size;
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { path: requested, entries };
}

function imageInfo(workspace, rel) {
  const requested = String(rel || "").trim() || "attachment.json";
  const file = resolveInWorkspace(workspace, requested);
  if (!fs.existsSync(file)) return { error: `not found: ${requested}` };
  const st = fs.statSync(file);
  if (!st.isFile()) return { error: `not a file: ${requested}` };
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      return { error: `not JSON: ${e.message}` };
    }
    if (j && Array.isArray(j.colors)) {
      return {
        path: requested,
        kind: "palette",
        width: j.width,
        height: j.height,
        layers: j.layers,
        placed: j.placed,
        insertsAt: j.insertsAt,
        colors: j.colors.slice(0, 12),
        roles: (paletteRoles(j.colors) || {}).line,
      };
    }
    return { path: requested, kind: "json", keys: Object.keys(j && typeof j === "object" ? j : {}).slice(0, 24) };
  }
  const header = imageHeader(fs.readFileSync(file));
  if (header.error && header.width == null) return { error: header.error, path: requested };
  return { path: requested, bytes: st.size, ...header };
}

function runOcr(workspace, args, env) {
  const rel = String(args.path || "").trim() || defaultOcrPath(workspace);
  const file = resolveInWorkspace(workspace, rel);
  if (!fs.existsSync(file)) return { error: `not found: ${rel}` };
  const st = fs.statSync(file);
  if (!st.isFile()) return { error: `not a file: ${rel}` };
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) {
    return { error: `ocr only reads images (${[...IMAGE_EXTS].join(", ")}), not ${ext || "this file"}` };
  }
  let psm = Number(args.psm);
  if (!Number.isFinite(psm)) psm = 6;
  psm = Math.floor(psm);
  if (psm < 0 || psm > 13) return { error: "psm must be 0–13" };
  const lang = String(args.lang || "eng").trim() || "eng";
  if (!/^[A-Za-z0-9_+-]+$/.test(lang)) return { error: "lang must be a tesseract language id" };
  const bin = tesseractBin(env);
  const r = spawnSync(bin, [file, "stdout", "--psm", String(psm), "-l", lang], {
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...env },
  });
  if (r.error && /ENOENT/.test(String(r.error))) {
    return {
      error: "tesseract is not installed. Set TESSERACT_PATH, or brew install tesseract (macOS) / apt install tesseract-ocr.",
    };
  }
  if (r.status !== 0) {
    return { error: clip(r.stderr || `tesseract exited ${r.status}`), path: rel, status: r.status };
  }
  return { path: rel, psm, lang, text: clip((r.stdout || "").trim(), 16_000) };
}

const ERAZER_ROLE = /^(page|panel|button|text|label|tab|menuitem|icon|form|menu|slider|textfield)\b/;

function erazerBin(env = process.env) {
  return String(env.EVG_ERAZER || path.join(repoRoot, "gallery/erazer/bin/erazer_cli.js")).trim();
}

function runErazerOutline(workspace, imageRel, env = process.env) {
  const bin = erazerBin(env);
  if (!bin || !fs.existsSync(bin)) return "";
  const img = resolveInWorkspace(workspace, imageRel);
  if (!fs.existsSync(img)) return "";
  const out = path.join(workspace, "attachment.erazer.evg.json");
  const r = spawnSync(process.execPath, [bin, img, out, "--outline"], {
    encoding: "utf8",
    timeout: 90_000,
    maxBuffer: 4 * 1024 * 1024,
    cwd: workspace,
    env: { ...env },
  });
  if (r.status !== 0) return "";
  const lines = String(r.stdout || "")
    .split(/\n/)
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => ERAZER_ROLE.test(l.trim()));
  return clip(lines.slice(0, 48).join("\n"), 2_400);
}

/** Largest dark swatch is the page; the other top colour is cards. */
export function paletteRoles(colors) {
  const list = (Array.isArray(colors) ? colors : []).filter((c) => c && c.hex);
  if (!list.length) return null;
  const lum = (hex) => {
    const h = String(hex || "").replace("#", "");
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (n.length < 6) return 128;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  const sorted = [...list].sort((a, b) => (b.share || 0) - (a.share || 0));
  const top = sorted.slice(0, 2);
  const page = top.length === 2 && lum(top[1].hex) < lum(top[0].hex) ? top[1] : top[0];
  const cards = top.find((c) => c !== page) || page;
  const rest = sorted.filter((c) => c !== page && c !== cards);
  const accents = rest.filter((c) => {
    const L = lum(c.hex);
    return L > 40 && L < 230;
  });
  const text = rest.filter((c) => !accents.includes(c));
  const bits = [`page ${page.hex}`, `cards ${cards.hex}`];
  if (accents.length) bits.push(`accent ${accents.map((c) => c.hex).join(" ")}`);
  if (text.length) bits.push(`text ${text.map((c) => c.hex).join(" ")}`);
  return { page: page.hex, cards: cards.hex, accents: accents.map((c) => c.hex), text: text.map((c) => c.hex), line: bits.join(" · ") };
}

export function picturePalette(workspace) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, "attachment.json"), "utf8"));
    return paletteRoles(j.colors || []);
  } catch {
    return null;
  }
}

/** Tracer SVG rects → Erazer-shaped "panel x,y w×h #hex" lines. */
export function geometryFromSvg(svg) {
  const out = [];
  const re = /<rect\b([^>\/]*)/gi;
  let m;
  while ((m = re.exec(String(svg || "")))) {
    const attrs = m[1];
    const attr = (name) => {
      const hit = new RegExp(`(?:^|\\s)${name}="([^"]+)"`, "i").exec(attrs);
      return hit ? hit[1] : "";
    };
    const x = Number(attr("x") || 0);
    const y = Number(attr("y") || 0);
    const w = Number(attr("width") || 0);
    const h = Number(attr("height") || 0);
    if (!(w >= 8 && h >= 8)) continue;
    out.push({ x, y, w, h, fill: attr("fill") });
  }
  return out;
}

export function formatGeometryLines(rects, cap = 20) {
  return (rects || [])
    .slice(0, cap)
    .map((r) => {
      const fill = r.fill && r.fill.startsWith("#") ? ` ${r.fill}` : "";
      return `panel ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}${fill}`;
    })
    .join("\n");
}

function pictureImageName(workspace) {
  for (const name of ["attachment.png", "attachment.jpg", "attachment.jpeg", "attachment.webp"]) {
    if (fs.existsSync(path.join(workspace, name))) return name;
  }
  return "";
}

/** Palette + OCR + Erazer + SVG note. The pixels themselves go as inlineData. */
export function collectPictureBrief(workspace, env = process.env) {
  if (!hasPicture(workspace)) return "";
  const bits = [
    "## PICTURE BRIEF",
    "A photo is attached (pixels + vectorized SVG). Rebuild what you see — any UI, not a guessed template.",
    "EVG is HTML flex/grid: display:flex + flex-direction:column|row + gap, or display:grid + grid-template-columns:1fr 1fr. Not left/top.",
    "Pieces: ./evg-ui add appbar|pills|bars|tiles|banner|card|chips|tabbar (ui-card / ui-tile / ui-bars / ui-banner / ui-tabbar). Do not insert unnamed div trees — Export needs those classes for rave.Card / rave.Tile / rave.TabBar.",
    "A 2×2 of metrics is add tiles. A bar chart is add bars. A highlight is add banner. Day/Week is add pills. add card --row is a settings list (SettingsRow) — do not flatten a dashboard into rows.",
    "If the outline still names leftover SettingsRow / ui-card / ui-chiprow after pills/tiles/bars, remove those paths in one ops.json (highest index first). Adding pills/tiles/bars/banner also drops them on patch. Do not leave both.",
    "count:0 is no page overflow. The page footer layout N / align / tight is suspicious overlap — not done. Copy OCR spaces (7h 38m, not 7h38m). EXAMPLE_UI is types, not the words.",
    "Copy EXAMPLE_UI from the system prompt (rave.AppBar, rave.Pills, rave.Bars, rave.Tile, rave.Banner, SettingsRow only for lists). Change the words to this photo. ONE outline, then add FILLED pieces. Empty ui-card is a failed turn.",
  ];
  let att = null;
  try {
    att = JSON.parse(fs.readFileSync(path.join(workspace, "attachment.json"), "utf8"));
  } catch {
    att = null;
  }
  const roles = paletteRoles(att && att.colors);
  if (att && (att.width || att.colors)) {
    const colors = (att.colors || [])
      .slice(0, 8)
      .map((c) => `${c.hex} ${Math.round((c.share || 0) * 100)}%`)
      .join(", ");
    bits.push(`Size: ${att.width || "?"}×${att.height || "?"} · ${att.layers || "?"} layers. Shares: ${colors}.`);
  }
  if (roles) {
    bits.push(`Palette MUST be these hexes (seed rgb() is a placeholder): ${roles.line}.`);
    bits.push(`First patch: {"ops":[{"op":"set-prop","at":"0","prop":"background-color","value":"${roles.page}"},{"op":"set-prop","at":"0","prop":"flex-direction","value":"column"}]}`);
  }
  const image = pictureImageName(workspace);
  const once = loadOnce(workspace);
  let ocrText = String(once.ocrText || "").trim();
  if (!ocrText && image) {
    const r = runOcr(workspace, { path: image }, env);
    if (r && r.text) {
      ocrText = String(r.text).trim();
      saveOnce(workspace, { ocr: true, ocrText });
    }
  }
  if (ocrText) {
    bits.push("Labels (OCR, noisy — keep spaces, do not glue words):");
    bits.push(clip(ocrText.replace(/\s+/g, " "), 900));
  }
  let erazer = String(once.erazer || "").trim();
  if (!erazer && image) {
    erazer = runErazerOutline(workspace, image, env);
    if (erazer) saveOnce(workspace, { erazer });
  }
  if (erazer) {
    bits.push("Erazer widgets (role x,y w×h hex — map to flex/grid, do not paste left/top):");
    bits.push(erazer);
  } else {
    const svgPath = path.join(workspace, "attachment.svg");
    if (fs.existsSync(svgPath)) {
      try {
        const boxes = formatGeometryLines(geometryFromSvg(fs.readFileSync(svgPath, "utf8")));
        if (boxes) {
          bits.push("Vector boxes (x,y w×h fill — map to flex/grid, do not paste left/top):");
          bits.push(boxes);
        }
      } catch {
        /* missing */
      }
    }
  }
  const svgPath = path.join(workspace, "attachment.svg");
  if (fs.existsSync(svgPath)) {
    const n = fs.statSync(svgPath).size;
    bits.push(`Vectorized SVG is attached (${n} bytes). Ask again with read_file attachment.svg if you need it.`);
  }
  bits.push("Need the photo or SVG again: image_info, ocr, or read_file attachment.svg.");
  const text = bits.join("\n");
  try {
    fs.writeFileSync(path.join(workspace, "PICTURE.md"), `${text}\n`);
  } catch {
    /* workspace may be gone */
  }
  return text;
}

export function pictureMime(name) {
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  return "image/png";
}

/** Pixels + SVG for generateContent. Not stored in .gemini-history.json. */
export function pictureMediaParts(workspace) {
  const parts = [];
  if (!workspace) return parts;
  const name = pictureImageName(workspace);
  if (name) {
    const file = path.join(workspace, name);
    try {
      const st = fs.statSync(file);
      if (st.size <= IMAGE_INLINE_MAX) {
        parts.push({
          inlineData: { mimeType: pictureMime(name), data: fs.readFileSync(file).toString("base64") },
        });
      } else {
        parts.push({ text: `${name} is ${st.size} bytes — too large to inline. image_info has the size.` });
      }
    } catch {
      /* missing */
    }
  }
  const svgPath = path.join(workspace, "attachment.svg");
  if (fs.existsSync(svgPath)) {
    try {
      const raw = fs.readFileSync(svgPath, "utf8");
      parts.push({ text: `Vectorized SVG (${raw.length} chars):\n${clip(raw, SVG_BRIEF_CAP)}` });
    } catch {
      /* missing */
    }
  }
  return parts;
}

/** Last model turn asked for the photo / SVG again. */
export function lastModelAskedForPicture(contents) {
  for (let i = (contents || []).length - 1; i >= 0; i -= 1) {
    const c = contents[i];
    if (!c || c.role !== "model") continue;
    for (const p of c.parts || []) {
      if (p && p.functionCall && askedForPicture(p.functionCall.name, argsOf(p.functionCall))) return true;
    }
    return false;
  }
  return false;
}

export function shouldAttachPicture(contents, extra = {}) {
  if (extra.attachPicture === true) return true;
  if (extra.attachPicture === false) return false;
  if (extra.sentPicture) return lastModelAskedForPicture(contents);
  return true;
}

export function contentsWithPicture(contents, workspace, extra = {}) {
  if (extra.attach === false) return contents;
  const media = pictureMediaParts(workspace);
  if (!media.length) return contents;
  const out = (Array.isArray(contents) ? contents : []).map((c) => ({
    ...c,
    parts: Array.isArray(c.parts) ? c.parts.slice() : [],
  }));
  const first = out.find((c) => c && c.role === "user");
  if (!first) return [...out, { role: "user", parts: media }];
  if ((first.parts || []).some((p) => p && p.inlineData)) return out;
  first.parts = [...first.parts, ...media];
  return out;
}

export function stripInlineData(contents) {
  return (Array.isArray(contents) ? contents : []).map((c) => ({
    ...c,
    parts: (c.parts || []).map((p) =>
      p && p.inlineData
        ? { text: `[inline ${p.inlineData.mimeType || "image"} omitted from history]` }
        : p,
    ),
  }));
}

export function askedForPicture(name, rawArgs) {
  if (name === "ocr") return true;
  if (name === "read_file") {
    return /attachment\.(png|jpe?g|webp|gif)$/i.test(String((rawArgs && rawArgs.path) || ""));
  }
  return false;
}

function tokenizeRun(raw) {
  const out = [];
  let cur = "";
  let q = "";
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i];
    if (q) {
      if (c === q) q = "";
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      continue;
    }
    if (/[;`$()|&\n]/.test(c)) {
      return { error: "run is not a shell — one ./evg-* command, no pipes, no substitution" };
    }
    if (/\s/.test(c)) {
      if (cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (q) return { error: "unclosed quote" };
  if (cur) out.push(cur);
  return { tokens: out };
}

/**
 * Gemini proposes a command; this process decides. Nothing is handed to a
 * shell: the line is split into argv, the binary must be one of RUN_BINS,
 * and that file is exec'd. A trailing `> file` is applied here after the
 * tool exits.
 */
export function parseRun(command) {
  const raw = String(command || "").trim();
  if (!raw) return { error: "run needs a command" };
  const tok = tokenizeRun(raw);
  if (tok.error) return tok;
  const tokens = tok.tokens.slice();
  if (!tokens.length) return { error: "run needs a command" };
  let stdoutTo = "";
  let append = false;
  if (tokens.length >= 2 && (tokens[tokens.length - 2] === ">" || tokens[tokens.length - 2] === ">>")) {
    stdoutTo = tokens.pop();
    append = tokens.pop() === ">>";
  }
  if (tokens.some((t) => t === ">" || t === ">>" || t === "<")) {
    return { error: "run only allows a trailing > file redirect" };
  }
  const bin = tokens[0];
  const argv = tokens.slice(1);
  if (!RUN_BINS.includes(bin)) {
    return { error: `run only accepts ${RUN_BINS.join(", ")}. Not: ${bin}` };
  }
  if (bin === "./evg-agent") {
    const verb = argv[0] || "";
    if (!verb || verb.startsWith("-")) {
      return {
        error:
          "./evg-agent needs a verb — outline doc.evg.json, query, patch, or measure. Bare usage is not a patch.",
      };
    }
  }
  if (argv.some((a) => a === "--help" || a === "-h" || a === "-help")) {
    return { error: "no --help. ./evg-ui add card --title … --into doc.evg.json then patch. insert first child at \"0\", not \"0/0\"." };
  }
  if (bin === "./evg-ui") {
    const verb = argv[0] || "";
    if (!verb || verb.startsWith("-") || verb === "list" || verb === "spec" || verb === "shot" || verb === "check") {
      return {
        error: `./evg-ui add is the only verb — ${ADD_CARD} then ./evg-agent patch doc.evg.json add.json. list/spec/--help is not a patch.`,
      };
    }
    if (verb !== "add") {
      return { error: `./evg-ui only add — ${ADD_CARD}` };
    }
    const what = argv[1] || "";
    const joined = argv.join(" ");
    if (what === "card" && !/--row\b/.test(joined)) {
      return {
        error:
          'add card needs --row "Label|Sub|value:42" and --title. An empty ui-card is not a card — look at EXAMPLE_UI.',
      };
    }
    if (what === "appbar" && !/--title\b/.test(joined)) {
      return { error: 'add appbar needs --title "Home" (EXAMPLE_UI).' };
    }
    if (what === "chips" && !/--chip\b/.test(joined)) {
      return { error: 'add chips needs --chip "Analytics|•|".' };
    }
    if (what === "tabbar" && !/--tab\b/.test(joined)) {
      return { error: 'add tabbar needs --tab "Home|⌂|nav.home".' };
    }
    if (what === "pills" && !/--pill\b/.test(joined)) {
      return { error: 'add pills needs --pill "Day" --pill "Week" --active Week.' };
    }
    if (what === "tiles" && !/--tile\b/.test(joined)) {
      return { error: 'add tiles needs --tile "Sleep Average|7h 38m|Quality 84%|☾".' };
    }
    if (what === "bars" && !/--bar\b/.test(joined)) {
      return { error: 'add bars needs --bar "M|62|#805754" and --title / --value.' };
    }
    if (what === "banner" && !/--title\b/.test(joined)) {
      return { error: 'add banner needs --title "100k Steps in 10 Days".' };
    }
  }
  if (stdoutTo) {
    if (stdoutTo.startsWith("/") || stdoutTo.includes("..")) {
      return { error: "redirect must be a relative file in the workspace" };
    }
  }
  for (const a of argv) {
    if (a.startsWith("/") || a.includes("..")) {
      return { error: "run cannot take absolute paths or .. — stay in this folder" };
    }
  }
  return { bin, argv, stdoutTo, append };
}

export function denyRun(command) {
  return parseRun(command).error || "";
}

export function executeTool(workspace, name, rawArgs, env = process.env) {
  const args = argsOf({ args: rawArgs });
  try {
    const exploring = denyExplore(workspace, name, args);
    if (exploring) return { error: exploring };
    if (name === "run") {
      const command = String(args.command || "").trim();
      if (!command) return { error: "run needs a command" };
      const blocked = denyRun(command);
      if (blocked) return { error: blocked };
      const result = spawnRun(workspace, command, env);
      bumpExplore(workspace, isLoopCall(name, args));
      if (/\boutline\b/.test(command) && result && result.ok) {
        const pending = pendingOpsFile(workspace);
        if (pending) {
          return {
            ...result,
            hint: pendingOpsHint(workspace, pending),
          };
        }
        const lines = String(result.stdout || "")
          .split(/\n/)
          .filter((l) => /^\d/.test(l.trim()));
        if (isEmptySeedOutline(command, result.stdout)) {
          const roles = picturePalette(workspace);
          if (roles) {
            return {
              ...result,
              hint: `empty seed. First set-prop 0 background-color ${roles.page} and flex-direction column, then ${ADD_CARD}`,
            };
          }
        }
      }
      return result;
    }
    if (name === "read_file") {
      const blocked = denyRead(args.path);
      if (blocked) return { error: blocked };
      const file = resolveInWorkspace(workspace, args.path);
      if (!fs.existsSync(file)) return { error: `not found: ${args.path}` };
      const st = fs.statSync(file);
      if (!st.isFile()) return { error: `not a file: ${args.path}` };
      const rel = String(args.path);
      const raw = fs.readFileSync(file, "utf8");
      if (IMAGE_EXTS.has(path.extname(rel).toLowerCase())) {
        return {
          path: rel,
          bytes: raw.length,
          kind: "image",
          hint: "pixels are attached on the next turn — do not read a PNG as text",
        };
      }
      if (/\.svg$/i.test(rel)) {
        if (loadOnce(workspace).svgRead) {
          return { error: `SVG already in the first ask / last read. NEXT: ${ADD_CARD} then patch. Not another svg.` };
        }
        saveOnce(workspace, { svgRead: true });
        bumpExplore(workspace, true);
        return { path: rel, bytes: raw.length, contents: clip(raw, FILE_READ_CAP) };
      }
      bumpExplore(workspace, isLoopCall(name, args));
      if (/\.evg\.json$/i.test(rel) && raw.length > 1_500) {
        return {
          path: rel,
          bytes: raw.length,
          hint: "document is on disk — ./evg-agent outline and patch. Do not put the tree in the prompt.",
        };
      }
      if (/"op"\s*:/.test(raw) && raw.length > 400) {
        return {
          path: rel,
          bytes: raw.length,
          hint: `ops file — ./evg-agent patch doc.evg.json ${rel}. Do not put the ops in the prompt.`,
        };
      }
      return { path: rel, contents: clip(raw, FILE_READ_CAP) };
    }
    if (name === "write_file") {
      const blocked = denyWrite(args.path);
      if (blocked) return { error: blocked };
      const contents = String(args.contents ?? "");
      if (/"op"\s*:/.test(contents) && contents.length > OPS_WRITE_CAP) {
        return {
          error: `ops file is ${contents.length} bytes — one card per write_file (under ${OPS_WRITE_CAP}). Split it and patch this card first.`,
        };
      }
      const opsErr = opsWriteError(String(args.path || ""), contents, workspace);
      if (opsErr) return { error: opsErr };
      const file = resolveInWorkspace(workspace, args.path);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, contents, "utf8");
      bumpExplore(workspace, false);
      return { ok: true, path: String(args.path), bytes: contents.length };
    }
    if (name === "list_dir") {
      bumpExplore(workspace, true);
      return listDir(workspace, args.path);
    }
    if (name === "image_info") {
      return imageInfo(workspace, args.path);
    }
    if (name === "ocr") {
      const once = loadOnce(workspace);
      if (once.ocr && once.ocrText) {
        return { path: String(args.path || "").trim() || defaultOcrPath(workspace), text: once.ocrText, again: true };
      }
      const result = runOcr(workspace, args, env);
      if (!result.error) saveOnce(workspace, { ocr: true, ocrText: result.text || "" });
      return result;
    }
    return { error: `unknown tool ${name}` };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

export function loadHistory(workspace) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, GEMINI_HISTORY), "utf8"));
    if (j && Array.isArray(j.contents)) return j.contents;
  } catch {
    /* first turn */
  }
  return [];
}

export function saveHistory(workspace, contents, extra = {}) {
  const file = path.join(workspace, GEMINI_HISTORY);
  fs.writeFileSync(
    file,
    `${JSON.stringify({ contents: stripInlineData(contents), saved: new Date().toISOString(), ...extra }, null, 0)}\n`,
  );
}

export function trimHistory(contents, cap = DEFAULT_HISTORY_CHARS) {
  const out = Array.isArray(contents) ? contents.slice() : [];
  let size = JSON.stringify(out).length;
  while (out.length > 4 && size > cap) {
    out.splice(1, 1);
    size = JSON.stringify(out).length;
  }
  return out;
}

export function splitParts(parts) {
  const texts = [];
  const thoughts = [];
  const calls = [];
  for (const p of parts || []) {
    if (!p || typeof p !== "object") continue;
    if (p.functionCall && p.functionCall.name) {
      calls.push(p);
      continue;
    }
    if (typeof p.text === "string" && p.text) {
      if (p.thought) thoughts.push(p.text);
      else texts.push(p.text);
    }
  }
  return { text: texts.join("\n").trim(), thought: thoughts.join("\n").trim(), calls };
}

function clipOneLine(text, cap = 280) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= cap) return s;
  return `${s.slice(0, cap)}…`;
}

function firstJsonObject(text) {
  const s = String(text || "").trim();
  if (!s.startsWith("{")) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** A query/measure JSON that only said count:1 hid the match and the box. */
export function summarizeRunReply(out, result) {
  const raw = String(out || "");
  const j = firstJsonObject(result && result.stdout ? result.stdout : raw);
  if (j && typeof j === "object") {
    if (j.error) {
      let err = String(j.error);
      if (/no ops in that file/i.test(err)) {
        err += ' — write_file {"ops":[{"op":"set-prop","at":"0/5","prop":"height","value":"48px"}]}';
      }
      return clipOneLine(hintPatchReject(err), 520);
    }
    const bits = [];
    if (j.count != null) bits.push(`count:${j.count}`);
    if (j.bottomFree != null) bits.push(`bottomFree:${j.bottomFree}`);
    if (j.ok === false && Array.isArray(j.rejected) && j.rejected.length) {
      bits.push(String(j.rejected[0]));
    }
    if (Array.isArray(j.missing) && j.missing.length) {
      bits.push(`missing ${j.missing.slice(0, 6).join(", ")}`);
    }
    if (Array.isArray(j.findings) && j.findings.length) {
      bits.push(j.findings.slice(0, 3).join("; "));
    }
    if (j.next) bits.push(String(j.next));
    if (Array.isArray(j.matches) && j.matches.length) {
      bits.push(j.matches.slice(0, 4).map(formatMatchLine).filter(Boolean).join("; "));
    }
    if (Array.isArray(j.boxes) && j.boxes.length) {
      const wanted = findingPaths(j.findings);
      const ordered = [
        ...j.boxes.filter((b) => b && wanted.has(b.at)),
        ...j.boxes.filter((b) => b && !wanted.has(b.at)),
      ];
      bits.push(ordered.slice(0, 6).map(formatBoxLine).filter(Boolean).join("; "));
    }
    if (j.layout && typeof j.layout === "object") {
      if (j.layout.bottomFree != null && j.bottomFree == null) bits.push(`bottomFree:${j.layout.bottomFree}`);
      if (Array.isArray(j.layout.findings) && j.layout.findings.length) {
        bits.push(j.layout.findings.slice(0, 3).join("; "));
      }
    }
    const sus = layoutSuspicion(j);
    if (sus.line) bits.push(sus.line);
    if (bits.length) {
      let line = hintPatchReject(bits.join(" — "));
      const nodes = j.nodes != null ? j.nodes : j.layout && j.layout.nodes;
      if (j.count === 0 && nodes != null && Number(nodes) <= 2) {
        line += ` — empty seed. Next: ${ADD_CARD}`;
      } else if (sus.n || sus.tight.length) {
        line += " — count:0 is no page overflow, not a clean layout. Fix align/tight (same lines as the page footer). Copy OCR spaces.";
      } else if (j.count === 0 && (j.bottomFree != null || (Array.isArray(j.boxes) && j.boxes.length))) {
        line += " — no overflow. Keep pills/tiles/bars/banner. Leftover SettingsRow cards: remove them (highest index first). Do not wipe the dashboard.";
      }
      return clipOneLine(line, 720);
    }
  }
  const outlined = summarizeOutline(raw || (result && result.stdout) || "");
  if (outlined) return outlined;
  const count = /"count"\s*:\s*(-?\d+)/.exec(raw);
  if (count) return `count:${count[1]}`;
  if (result && !result.ok) {
    return clipOneLine(hintPatchReject(result.stderr || result.stdout || `exit ${result.status}`), 520);
  }
  if (result && result.stdout) return clipOneLine(result.stdout);
  return "ok";
}

export function isEmptySeedOutline(command, stdout) {
  if (/--at=/.test(String(command || ""))) return false;
  const lines = String(stdout || "")
    .split(/\n/)
    .filter((l) => /^\d/.test(l.trim()));
  return lines.length <= 1;
}

export function evgRootOf(workspace) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, "doc.evg.json"), "utf8"));
    if (j && j.root && j.root.tag) return j.root;
    if (j && j.tag) return j;
  } catch {
    /* missing */
  }
  return null;
}

/** Screen-level pieces Export collapses to rave.Card / AppBar / SettingsRow. */
export const PIECE_CLASS_RE =
  /\b(ui-card|ui-appbar|ui-row|ui-chip|ui-chiprow|ui-tabbar|ui-tab-item|ui-actions|ui-field|ui-switch|ui-btn|ui-button|ui-input|ui-pills|ui-pill|ui-tiles|ui-tile|ui-bars|ui-banner|card|row|appbar|chip)\b/;

export function nodePieceClass(node) {
  if (!node || typeof node !== "object") return "";
  const props = node.props && typeof node.props === "object" ? node.props : {};
  return String(props["class-name"] || props.class || node["class-name"] || node.class || "");
}

function nodeLooksBuilt(el) {
  if (!el || typeof el !== "object") return false;
  if (PIECE_CLASS_RE.test(nodePieceClass(el))) return true;
  if (String(el.textContent || "").trim()) return true;
  if (Array.isArray(el.children) && el.children.length) return true;
  return false;
}

export const DASH_KEEPER_RE = /\b(ui-appbar|ui-pills|ui-tiles|ui-tile|ui-bars|ui-banner|ui-tabbar)\b/;

export function nodeIsDashboardKeeper(node) {
  return DASH_KEEPER_RE.test(nodePieceClass(node));
}

/** add card / old chiprow leftovers that a dashboard rebuild must drop. */
export function nodeIsSettingsLeftover(node) {
  if (!node || typeof node !== "object") return false;
  if (nodeIsDashboardKeeper(node)) return false;
  const cls = nodePieceClass(node);
  return /\bui-chiprow\b/.test(cls) || /\bui-card\b/.test(cls);
}

export function leftoverSettingsAts(root) {
  const kids = root && Array.isArray(root.children) ? root.children : [];
  const out = [];
  kids.forEach((k, i) => {
    if (nodeIsSettingsLeftover(k)) out.push(`0/${i}`);
  });
  return out;
}

function insertAddsKeeper(op) {
  return !!(op && op.op === "insert" && (nodeIsDashboardKeeper(op.node) || (op.node && DASH_KEEPER_RE.test(nodePieceClass(op.node)))));
}

/** When adding pills/tiles/bars/banner, drop leftover SettingsRow cards in the same batch. */
export function attachLeftoverRemoves(text, workspace, kind) {
  if (!/^(pills|tiles|bars|banner|tabbar)$/.test(String(kind || ""))) return String(text || "");
  const ats = leftoverSettingsAts(evgRootOf(workspace));
  if (!ats.length) return String(text || "");
  let j;
  try {
    j = JSON.parse(String(text || ""));
  } catch {
    return String(text || "");
  }
  if (!j || !Array.isArray(j.ops)) return String(text || "");
  const have = new Set(j.ops.filter((o) => o && o.op === "remove").map((o) => String(o.at || "")));
  const removes = ats
    .filter((at) => !have.has(at))
    .sort((a, b) => Number(b.split("/")[1]) - Number(a.split("/")[1]))
    .map((at) => ({ op: "remove", at }));
  if (!removes.length) return String(text || "");
  const insertAt = j.ops.findIndex((o) => o && o.op === "insert");
  if (insertAt < 0) j.ops.push(...removes);
  else j.ops.splice(insertAt, 0, ...removes);
  return JSON.stringify(j, null, 2) + "\n";
}

/** A nested insert at the root with no kit class is the box-soup Export cannot collapse. */
export function insertIsSoup(node, at) {
  if (String(at || "") !== "0") return false;
  if (!node || typeof node !== "object") return false;
  const kids = Array.isArray(node.children) ? node.children : [];
  if (!kids.length) return false;
  return !PIECE_CLASS_RE.test(nodePieceClass(node));
}

export function summarizeOutline(raw) {
  const s = String(raw || "").trim();
  if (!/^0\s+\S+/m.test(s)) return "";
  const lines = s
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => /^\d/.test(l) && !l.startsWith("…"));
  if (!lines.length) return "";
  const kids = lines.filter((l) => /^0\/\d+\s/.test(l));
  const titles = [];
  for (const l of lines) {
    const m = /^(\d+(?:\/\d+){1,2})\s+.*?"([^"]+)"/.exec(l);
    if (m) titles.push(`${m[1]} "${m[2]}"`);
  }
  let line = `${lines.length} node${lines.length === 1 ? "" : "s"}`;
  if (kids.length) line += ` — ${kids.length} under 0`;
  if (titles.length) line += ` — ${titles.slice(0, 10).join(" · ")}`;
  else {
    const heads = (kids.length ? kids : lines).slice(0, 8).map((l) => clipOneLine(l, 72));
    line += ` — ${heads.join(" · ")}`;
  }
  if (lines.length <= 1) {
    line += ` — empty seed, not done. Next: ${ADD_APPBAR} then patch. A dashboard then add pills|bars|tiles|banner — not a card of SettingsRows.`;
  } else if (lines.some((l) => /\.ui-card\b/.test(l) && !/"/.test(l))) {
    line += ` — empty card. Next: ${ADD_CARD}`;
  }
  const top = lines.filter((l) => /^0\/\d+\s/.test(l));
  const leftover = top.filter((l) => /\.ui-card\b|\.ui-chiprow\b/.test(l) && !/\.ui-(pills|tiles|bars|banner)\b/.test(l));
  const dash = top.filter((l) => /\.ui-(pills|tiles|bars|banner|tabbar)\b/.test(l));
  if (leftover.length && dash.length) {
    const ats = leftover.map((l) => l.split(/\s+/)[0]).join(" ");
    line += ` — leftover settings cards ${ats}. Remove them in one ops.json (highest index first). Do not leave both.`;
  }
  const glued = gluedLabelHints(s);
  if (glued.length) {
    line += ` — glued labels ${glued.join(", ")}: copy OCR spaces (7h 38m, not 7h38m).`;
  }
  return clipOneLine(line, 720);
}

function formatMatchLine(m) {
  if (!m || typeof m !== "object") return "";
  const props = pickMatchProps(m.props);
  const shown = Object.keys(props).map((k) => `${k}=${props[k]}`);
  const kids = m.children != null ? ` children:${m.children}` : "";
  return `${m.at || "?"} ${m.tag || ""}${kids} ${shown.join(" ")}`.trim();
}

function formatBoxLine(b) {
  if (!b || typeof b !== "object") return "";
  const gap = b.gapNext != null ? ` gapNext:${b.gapNext}` : "";
  return `${b.at} [${b.x},${b.y},${b.w},${b.h}]${gap}`;
}

function hintPatchReject(line) {
  let s = String(line || "");
  if (/property "id" is not patchable|id is not patchable/i.test(s)) {
    s += ' — id is set-id, not set-prop: {"op":"set-id","at":"0/6/0","value":"nav.home"}';
  }
  if (/property "(style|background|background-image)" is not patchable/i.test(s)) {
    s +=
      ' — set-prop is one CSS name, not style=: {"op":"set-prop","at":"0","prop":"padding-top","value":"12px"}';
  }
  if (/property "" is not patchable/i.test(s)) {
    s +=
      ' — set-prop needs "prop":"flex-direction" and "value":"column" (one CSS name). Not set-prop 0=column.';
  }
  if (/property "[^"]+" is not patchable/i.test(s)) {
    s += " — the whole file was rejected. Drop that property and patch the rest.";
  }
  if (/no node at "0\/0"/i.test(s)) {
    s += ' — empty root: insert at "0" (the parent), not "0/0". Or ./evg-ui add card --into doc.evg.json';
  }
  if (/unknown op/i.test(s)) {
    s += ' — ops are set-prop, set-text, set-id, set-css, insert, remove. Not delete/help.';
  }
  return s;
}

/** Catch a bare op object / empty ops array before patch wastes a turn. */
export function opsWriteError(rel, contents, workspace = "") {
  const text = String(contents ?? "");
  const looksOps = /ops/i.test(String(rel || "")) || /"op"\s*:/.test(text);
  if (!looksOps) return "";
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    if (/"op"\s*:/.test(text)) return "ops.json is not valid JSON — one object with an ops array";
    return "";
  }
  if (Array.isArray(j)) return 'ops must be {"ops":[...]}, not a bare array';
  if (j && typeof j === "object" && j.op && !Array.isArray(j.ops)) {
    return 'a single op needs an ops array: {"ops":[{"op":"set-prop","at":"0/5","prop":"height","value":"48px"}]}';
  }
  if (j && typeof j === "object" && Array.isArray(j.ops) && j.ops.length === 0) {
    return "ops array is empty — add one set-prop (one CSS name: height, padding-top, gap)";
  }
  if (j && Array.isArray(j.ops)) {
    const known = new Set(["set-prop", "set-text", "set-id", "set-css", "insert", "remove", "move"]);
    const rootRemoves = [];
    for (const op of j.ops) {
      if (!op) continue;
      if (op.op && !known.has(op.op)) {
        return `unknown op "${op.op}" — use set-prop, set-text, set-id, set-css, insert, remove. First child inserts at "0", not "0/0".`;
      }
      if (op.op === "set-css" && (op.value == null || String(op.value).trim() === "")) {
        return 'set-css needs "value":".card { background-color: #22242A; border-radius: 12px }" — it replaces the whole sheet.';
      }
      if (op.op === "set-prop") {
        const prop = String(op.prop || "").trim();
        if (!prop) {
          return 'set-prop needs "prop":"flex-direction" (one CSS name) and "value":"column" — not value alone';
        }
        if (
          prop === "box-sizing" ||
          prop === "overflow-x" ||
          prop === "overflow-y" ||
          prop === "padding" ||
          prop === "margin" ||
          prop === "border" ||
          prop === "background"
        ) {
          return `${prop} is not patchable — use padding-top / padding-left / background-color (one CSS name) or the whole file is rejected.`;
        }
      }
      if (op.op === "insert" && insertIsSoup(op.node, op.at)) {
        return 'insert node needs class-name ui-card / ui-tile / ui-bars / ui-banner / ui-pills / ui-appbar / ui-tabbar — or ./evg-ui add tiles|bars|banner. Bare div trees fail Export (no rave.Card).';
      }
      if (op.op === "insert" && String(op.at || "") === "0/0") {
        const root = workspace ? evgRootOf(workspace) : null;
        const kids = root && Array.isArray(root.children) ? root.children : [];
        if (kids.length && nodeLooksBuilt(kids[0])) {
          return 'insert at "0/0" goes inside the first card. insert at "0" to add a header above it.';
        }
      }
      if (op.op === "remove" && /^0\/\d+$/.test(String(op.at || ""))) rootRemoves.push(op.at);
    }
    const root = workspace ? evgRootOf(workspace) : null;
    const kids = root && Array.isArray(root.children) ? root.children : [];
    const leftoverSet = new Set(leftoverSettingsAts(root));
    const keeperAts = kids.map((k, i) => (nodeIsDashboardKeeper(k) ? `0/${i}` : "")).filter(Boolean);
    const keepersAfter = keeperAts.filter((at) => !rootRemoves.includes(at));
    const insertingKeeper = j.ops.some(insertAddsKeeper);
    const onlyLeftovers = rootRemoves.length > 0 && rootRemoves.every((at) => leftoverSet.has(at));
    const keepersRemoved = rootRemoves.filter((at) => keeperAts.includes(at));
    if (keepersRemoved.length && keepersAfter.length === 0 && !insertingKeeper) {
      return "do not wipe the dashboard pieces — remove leftover SettingsRow cards, not pills/tiles/bars/banner.";
    }
    if (onlyLeftovers) {
      const built = kids.map((k, i) => ({ at: `0/${i}`, built: nodeLooksBuilt(k) })).filter((k) => k.built);
      const left = built.filter((k) => !rootRemoves.includes(k.at));
      if (built.length && left.length === 0 && !insertingKeeper) {
        return "do not wipe the whole screen — add pills/tiles/bars first, then remove leftover SettingsRow cards.";
      }
    } else if (rootRemoves.length >= 2) {
      return "do not wipe the cards — remove leftover SettingsRow cards, or one empty node.";
    } else if (workspace && rootRemoves.length) {
      const built = kids.map((k, i) => ({ at: `0/${i}`, built: nodeLooksBuilt(k) })).filter((k) => k.built);
      const left = built.filter((k) => !rootRemoves.includes(k.at));
      if (built.length && left.length === 0 && !insertingKeeper) {
        return "do not wipe the cards you just added — set-prop colours or add the next one. remove is for leftover SettingsRows or one empty box, not the screen.";
      }
    }
  }
  return "";
}

function writeKind(contents) {
  const s = String(contents ?? "");
  if (/"op"\s*:/.test(s) && /\[/.test(s)) return "ops";
  if (/"tag"\s*:/.test(s) && /"children"\s*:/.test(s)) return "whole EVG tree";
  return "text";
}

/** One line for the page and the withgemini console: what was asked, what came back. */
export function summarizeTool(name, rawArgs, result) {
  const args = argsOf({ args: rawArgs });
  let call = name;
  if (name === "run") call = String(args.command || "run").trim() || "run";
  else if (name === "write_file") {
    const n = String(args.contents ?? "").length;
    call = `write_file ${args.path || ""} (${n.toLocaleString("en-US")} bytes, ${writeKind(args.contents)})`;
  } else if (name === "read_file" || name === "list_dir" || name === "image_info" || name === "ocr") {
    call = `${name} ${args.path || (name === "list_dir" ? "." : "")}`.trim();
  }
  let reply = "ok";
  if (result && result.error) reply = `error: ${result.error}`;
  else if (name === "ocr" && result && result.text) reply = clipOneLine(result.text);
  else if (name === "run") {
    const out = `${result && result.stdout ? result.stdout : ""}\n${result && result.stderr ? result.stderr : ""}`;
    reply = summarizeRunReply(out, result);
    if (result && result.hint && !/patch/.test(reply)) {
      reply = clipOneLine(`${reply} — ${result.hint}`, 520);
    }
  } else if (name === "read_file" && result) {
    if (result.hint) reply = `${result.bytes || 0} bytes — ${clipOneLine(result.hint, 160)}`;
    else if (result.contents != null) reply = `read ${String(result.contents).length.toLocaleString("en-US")} chars`;
  } else if (name === "image_info" && result) {
    reply =
      result.kind === "palette"
        ? `palette ${result.width}×${result.height} — ${result.roles || `${(result.colors || []).length} colours`}. Already in the brief — do not image_info again.`
        : `${result.kind || "image"} ${result.width || "?"}×${result.height || "?"}`;
  } else if (name === "write_file" && result && result.ok) {
    reply = `wrote ${result.bytes} bytes`;
  } else if (name === "list_dir" && result && result.entries) {
    reply = `${result.entries.length} names`;
  }
  return { call, reply, shown: `${call} · ${reply}` };
}

function appendTrace(workspace, line) {
  try {
    fs.appendFileSync(path.join(workspace, GEMINI_TRACE), `${line}\n`);
  } catch {
    /* workspace may be gone */
  }
}

function usageOf(data) {
  const u = (data && data.usageMetadata) || {};
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const prompt = num(u.promptTokenCount);
  const cache = Math.min(num(u.cachedContentTokenCount), prompt);
  return {
    input: prompt,
    fresh: prompt - cache,
    output: num(u.candidatesTokenCount) + num(u.thoughtsTokenCount),
    thoughts: num(u.thoughtsTokenCount),
    cacheRead: cache,
    cacheWrite: 0,
  };
}

export function geminiRates(env = process.env) {
  const inputPerM = Number(env.EVG_GEMINI_INPUT_PER_M || GEMINI_FLASH_INPUT_PER_M);
  const outputPerM = Number(env.EVG_GEMINI_OUTPUT_PER_M || GEMINI_FLASH_OUTPUT_PER_M);
  const inRate = Number.isFinite(inputPerM) && inputPerM >= 0 ? inputPerM : GEMINI_FLASH_INPUT_PER_M;
  const outRate = Number.isFinite(outputPerM) && outputPerM >= 0 ? outputPerM : GEMINI_FLASH_OUTPUT_PER_M;
  const cacheRaw = env.EVG_GEMINI_CACHE_PER_M;
  const cacheNum = cacheRaw == null || cacheRaw === "" ? inRate * (GEMINI_FLASH_CACHE_PER_M / GEMINI_FLASH_INPUT_PER_M) : Number(cacheRaw);
  return {
    inputPerM: inRate,
    outputPerM: outRate,
    cachePerM: Number.isFinite(cacheNum) && cacheNum >= 0 ? cacheNum : GEMINI_FLASH_CACHE_PER_M,
  };
}

/**
 * About-cost from Gemini usageMetadata.
 * promptTokenCount already includes cachedContentTokenCount; those hits
 * are $0.075/1M, not $0.75/1M. Thoughts count as output.
 */
export function geminiCostUsd(usage, env = process.env) {
  const { inputPerM, outputPerM, cachePerM } = geminiRates(env);
  const prompt = Number(usage && usage.input) || 0;
  const cache = Math.min(Number(usage && usage.cacheRead) || 0, prompt);
  const fresh = usage && usage.fresh != null ? Number(usage.fresh) || 0 : Math.max(0, prompt - cache);
  const output = Number(usage && usage.output) || 0;
  return (fresh / 1_000_000) * inputPerM + (cache / 1_000_000) * cachePerM + (output / 1_000_000) * outputPerM;
}

function tokCount(n) {
  return Math.round(Number(n) || 0).toLocaleString("en-US");
}

function moneyUsd(n) {
  const v = Number(n) || 0;
  if (v === 0) return "$0";
  if (v < 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(4)}`;
}

export function formatGeminiSpend(usage, extra = {}) {
  const env = extra.env || process.env;
  const cost = extra.cost != null ? extra.cost : geminiCostUsd(usage, env);
  const cache = Math.min(Number(usage && usage.cacheRead) || 0, Number(usage && usage.input) || 0);
  const fresh = usage && usage.fresh != null ? Number(usage.fresh) || 0 : Math.max(0, (Number(usage && usage.input) || 0) - cache);
  const parts = [`${tokCount(fresh)} fresh`, `${tokCount(usage && usage.output)} out`];
  if (usage && usage.thoughts) parts.push(`${tokCount(usage.thoughts)} thought`);
  if (cache) parts.push(`${tokCount(cache)} cache`);
  if ((Number(usage && usage.input) || 0) > fresh) parts.push(`${tokCount(usage.input)} prompt`);
  parts.push(`~${moneyUsd(cost)}`);
  if (extra.turns) parts.push(`${extra.turns} turn${extra.turns === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function resultEvent(spend, { turns, started, model, env, subtype = "success" }) {
  const cost = geminiCostUsd(spend, env);
  return {
    type: "result",
    subtype,
    num_turns: turns,
    duration_ms: Date.now() - started,
    total_cost_usd: cost,
    usage: {
      input_tokens: spend.fresh,
      output_tokens: spend.output,
      cache_read_input_tokens: spend.cacheRead,
      cache_creation_input_tokens: spend.cacheWrite,
    },
    modelUsage: { [model]: { costUSD: cost } },
  };
}

function addUsage(into, piece) {
  into.input += piece.input;
  into.fresh += piece.fresh || 0;
  into.output += piece.output;
  into.thoughts += piece.thoughts || 0;
  into.cacheRead += piece.cacheRead;
  into.cacheWrite += piece.cacheWrite;
}

function errorFromBody(status, text) {
  try {
    const j = JSON.parse(text);
    const msg = j && j.error && (j.error.message || j.error.status);
    if (msg) return `Gemini HTTP ${status}: ${msg}`;
  } catch {
    /* not json */
  }
  return `Gemini HTTP ${status}: ${String(text || "").slice(0, 400)}`;
}

export async function geminiGenerate({
  base,
  model,
  key,
  body,
  fetchImpl = fetch,
  signal,
}) {
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(errorFromBody(res.status, text));
  }
  if (!res.ok || (data && data.error)) {
    throw new Error(errorFromBody(res.status, text));
  }
  return data;
}

export function requestBody(contents, env = process.env, extra = {}) {
  const gen = {
    temperature: 0.4,
    maxOutputTokens: Number(env.EVG_GEMINI_MAX_OUTPUT || extra.maxOutputTokens || DEFAULT_GEMINI_MAX_OUTPUT),
  };
  if (!Number.isFinite(gen.maxOutputTokens) || gen.maxOutputTokens < 1024) {
    gen.maxOutputTokens = DEFAULT_GEMINI_MAX_OUTPUT;
  }
  const think = String(env.EVG_GEMINI_THINKING || "").trim();
  if (think === "0") gen.thinkingConfig = { thinkingBudget: 0 };
  else {
    gen.thinkingConfig = { includeThoughts: true };
    if (think && think !== "1" && Number.isFinite(Number(think))) {
      gen.thinkingConfig.thinkingBudget = Number(think);
    }
  }
  const body = {
    systemInstruction: { parts: [{ text: geminiSystemPrompt() }] },
    contents:
      extra.workspace && extra.attachPicture !== false && shouldAttachPicture(contents, extra)
        ? contentsWithPicture(prepareContents(contents, env), extra.workspace)
        : prepareContents(contents, env),
    tools: [{ functionDeclarations: GEMINI_TOOLS }],
    generationConfig: gen,
  };
  if (extra.forceTool) {
    body.toolConfig = { functionCallingConfig: { mode: "ANY" } };
  }
  return body;
}

/**
 * One agent run. `onEvent` receives Cursor-shaped stream-json objects.
 * History is read and written in the workspace so the next Follow-up continues.
 */
export async function geminiLoop({
  workspace,
  onEvent,
  fetchImpl = fetch,
  env = process.env,
  signal,
  log = () => {},
}) {
  const key = geminiKey(env);
  if (!key) throw new Error("GEMINI_API_KEY is not set (Google AI Studio). GOOGLE_API_KEY is also accepted.");
  const model = geminiModel(env);
  const base = geminiBase(env);
  const taskPath = path.join(workspace, "TASK.md");
  let task = "";
  try {
    task = fs.readFileSync(taskPath, "utf8").trim();
  } catch {
    task = "";
  }
  if (!task) task = "Edit doc.evg.json.";

  const prior = dropTrailingPlan(loadHistory(workspace));
  const followUp = prior.length > 0;
  const brief = collectPictureBrief(workspace, env);
  if (brief) log(`picture brief ${brief.length} chars`);
  const hadBrief = /PICTURE BRIEF/.test(JSON.stringify(prior));
  const userText = brief && !hadBrief ? `${task}\n\n${brief}` : task;
  let contents = prepareContents([...prior, { role: "user", parts: [{ text: userText }] }], env);

  const spend = { input: 0, fresh: 0, output: 0, thoughts: 0, cacheRead: 0, cacheWrite: 0 };
  const maxTurns = geminiMaxTurns(env);
  const started = Date.now();
  let turns = 0;
  let planNudges = 0;
  let stallNudges = 0;
  let forceTool = false;
  let sentPicture = false;

  for (let i = 0; i < maxTurns; i += 1) {
    if (signal && signal.aborted) throw new Error("aborted");
    const attachPicture = Boolean(brief) && shouldAttachPicture(contents, { sentPicture });
    const body = requestBody(contents, env, { forceTool, workspace, attachPicture, sentPicture });
    if (attachPicture) sentPicture = true;
    const sent = payloadStats(body);
    log(formatPayloadStats(sent));
    appendTrace(workspace, formatPayloadStats(sent));
    const data = await geminiGenerate({
      base,
      model,
      key,
      body,
      fetchImpl,
      signal,
    });
    forceTool = false;
    const piece = usageOf(data);
    addUsage(spend, piece);
    turns += 1;
    log(`turn ${turns}  ${formatGeminiSpend(piece, { env })}  (run ${formatGeminiSpend(spend, { turns, env })})`);
    const candidate = data.candidates && data.candidates[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    if (!parts.length) {
      const block = data.promptFeedback && data.promptFeedback.blockReason;
      throw new Error(block ? `Gemini blocked the prompt (${block})` : "Gemini returned no content");
    }
    // Keep the parts as they arrived — thought signatures have to go back
    // on the next call or Gemini 2.5/3 rejects the function response.
    contents.push({
      role: (candidate.content && candidate.content.role) || "model",
      parts,
    });
    saveHistory(workspace, contents, { model, followUp });

    const { text, thought, calls } = splitParts(parts);
    if (thought) {
      log(`think: ${clipOneLine(thought, 1500)}`);
      appendTrace(workspace, `think: ${thought}`);
      onEvent({ type: "assistant", message: { content: [{ text: thought }] } });
    }
    if (text) {
      if (thought) log(`say: ${clipOneLine(text, 400)}`);
      onEvent({ type: "assistant", message: { content: [{ text }] } });
    }
    if (!calls.length) {
      const finishReason = (candidate && candidate.finishReason) || "";
      const stuck = needsToolNudge({
        text,
        thought,
        finishReason,
        outputTokens: piece.output,
      });
      if (stuck) {
        if (planNudges < MAX_PLAN_NUDGES) {
          planNudges += 1;
          forceTool = true;
          const why = finishReason === "MAX_TOKENS" ? "output cap" : "plan without a tool";
          log(`nudge: ${why} (${planNudges}/${MAX_PLAN_NUDGES}) — next turn must call a tool`);
          appendTrace(workspace, `nudge: ${PLAN_NUDGE}`);
          onEvent({ type: "assistant", message: { content: [{ text: PLAN_NUDGE }] } });
          contents.push({ role: "user", parts: [{ text: PLAN_NUDGE }] });
          saveHistory(workspace, contents, { model, followUp });
          continue;
        }
        const capped = resultEvent(spend, { turns, started, model, env, subtype: "error" });
        onEvent(capped);
        throw new Error(
          `Gemini used the output budget on a plan and never called a tool — ${formatGeminiSpend(spend, { turns, env })}`,
        );
      }
      const result = resultEvent(spend, { turns, started, model, env });
      onEvent(result);
      return { ok: true, turns, followUp, model, usage: spend, costUsd: result.total_cost_usd };
    }

    const responses = [];
    for (const part of calls) {
      const fc = part.functionCall;
      const name = fc.name;
      const args = argsOf(fc);
      const result = executeTool(workspace, name, args, env);
      const sum = summarizeTool(name, args, result);
      log(`→ ${sum.call}`);
      log(`← ${sum.reply}`);
      appendTrace(workspace, `→ ${sum.call}`);
      appendTrace(workspace, `← ${sum.reply}`);
      onEvent({
        type: "tool_call",
        subtype: "started",
        tool_call: { shellToolCall: { args: { command: sum.shown } } },
      });
      const fr = { name, response: compactToolResult(name, args, result) };
      if (fc.id) fr.id = fc.id;
      responses.push({ functionResponse: fr });
    }
    contents.push({ role: "user", parts: responses });
    if (recentSightseeing(contents, 4) && stallNudges < MAX_STALL_NUDGES) {
      stallNudges += 1;
      forceTool = true;
      const stall = stallNudgeFor(workspace);
      log(`nudge: sightseeing (${stallNudges}/${MAX_STALL_NUDGES}) — next turn must rebuild`);
      appendTrace(workspace, `nudge: ${stall}`);
      onEvent({ type: "assistant", message: { content: [{ text: stall }] } });
      contents.push({ role: "user", parts: [{ text: stall }] });
    }
    contents = prepareContents(contents, env);
    saveHistory(workspace, contents, { model, followUp });
  }

  const capped = resultEvent(spend, { turns, started, model, env, subtype: "error" });
  onEvent(capped);
  throw new Error(
    `Gemini hit EVG_GEMINI_MAX_TURNS (${maxTurns}) without finishing — ${formatGeminiSpend(spend, { turns, env })}`,
  );
}

function emit(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const key = geminiKey();
    if (!key) {
      process.stdout.write("gemini API off\n");
      process.exit(0);
    }
    process.stdout.write(`gemini API ready (${geminiModel()})\n`);
    process.exit(0);
  }

  const ws = process.argv[2];
  if (!ws) {
    process.stderr.write("usage: gemini-agent.mjs <workspace>\n");
    process.exit(2);
  }
  if (!geminiKey()) {
    process.stderr.write("GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey\n");
    process.exit(1);
  }
  const rates = geminiRates();
  process.stderr.write(`Gemini: ${geminiModel()} → ${geminiBase()}\n`);
  process.stderr.write(
    `rates $${rates.inputPerM} fresh / $${rates.cachePerM} cache / $${rates.outputPerM} out per 1M (Flash paid tier)\n`,
  );
  try {
    const result = await geminiLoop({
      workspace: ws,
      onEvent: emit,
      log: (line) => process.stderr.write(`${line}\n`),
    });
    process.stderr.write(
      `Gemini finished in ${result.turns} turn(s) — ${formatGeminiSpend(result.usage, { turns: result.turns })}\n`,
    );
    process.exit(result.ok ? 0 : 1);
  } catch (e) {
    const text = String(e.message || e);
    process.stderr.write(`${text}\n`);
    emit({ type: "assistant", message: { content: [{ text }] } });
    process.exit(1);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked && path.resolve(invoked) === thisFile) {
  main();
}
