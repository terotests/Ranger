// ============================================================================
// eyeEmotion.js — emotion tags, topology fingerprint, pose capture/morph.
// Authoring helpers for eye vector rigs; runtime compile is sampled buffers.
// ============================================================================

import { samplePath } from "../pathModel.js";

/** Part class for eye assets (future: mouth, brow, …). */
export const PART_CLASS_EYE = "eye";

/** Topology fingerprint schema version (bump when key format changes). */
export const EYE_TOPOLOGY_VERSION = 1;

/** Layer roles — kept local to avoid a circular import with eyeTexture.js. */
const EYE_LAYER_TYPES = ["eyeball", "iris", "pupil", "reflection", "eyelid"];
const EYE_DEFAULT_ORDER = EYE_LAYER_TYPES;
const EYE_CLIP_PARENT = {
  eyeball: null,
  iris: "eyeball",
  pupil: "iris",
  reflection: "eyeball",
  eyelid: "eyeball",
};

function findLayer(texOrLayers, typeOrId) {
  const layers = Array.isArray(texOrLayers) ? texOrLayers : texOrLayers?.layers || [];
  return layers.find((L) => L.id === typeOrId || L.type === typeOrId) || null;
}

/**
 * Canonical emotion tags for eyes. Custom strings are allowed; prefer these
 * for library search and morph pickers.
 */
export const EYE_EMOTION_TAGS = Object.freeze([
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "sleepy",
  "wink",
  "fear",
  "disgust",
]);

const EMOTION_SET = new Set(EYE_EMOTION_TAGS);

/** Animation class id for facial emotion (targets = emotion tags). */
export const ANIM_CLASS_EMOTION = "emotion";

/**
 * Registry of animation classes. Each class has named targets that morph
 * within the same topology. Future: blink, gaze, phoneme, …
 * @type {Record<string, { id: string, label: string, partClasses: string[], targets: readonly string[] }>}
 */
export const ANIM_CLASS_DEFS = Object.freeze({
  [ANIM_CLASS_EMOTION]: Object.freeze({
    id: ANIM_CLASS_EMOTION,
    label: "Emotion",
    partClasses: Object.freeze([PART_CLASS_EYE]),
    targets: EYE_EMOTION_TAGS,
  }),
});

/**
 * @param {string} [partClass]
 * @returns {Array<{ id: string, label: string, partClasses: string[], targets: readonly string[] }>}
 */
export function listAnimClassesForPart(partClass = PART_CLASS_EYE) {
  const pc = partClass || PART_CLASS_EYE;
  return Object.values(ANIM_CLASS_DEFS).filter((c) => c.partClasses.includes(pc));
}

/** @param {unknown} raw */
export function normalizeAnimClassId(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return s || ANIM_CLASS_EMOTION;
}

/** @param {unknown} raw */
export function normalizeAnimTarget(raw) {
  return normalizeEmotionTag(raw);
}

/**
 * Normalize an emotion tag: lowercase slug, empty → "neutral".
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeEmotionTag(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return s || "neutral";
}

/** @param {string} tag */
export function isCanonicalEyeEmotion(tag) {
  return EMOTION_SET.has(normalizeEmotionTag(tag));
}

/**
 * Library / project search tags for an eye pose or texture.
 * @param {{ emotion?: string, topologyKey?: string, partClass?: string }} opts
 * @returns {string[]}
 */
export function eyeLibraryTags(opts = {}) {
  const part = opts.partClass || PART_CLASS_EYE;
  const emotion = normalizeEmotionTag(opts.emotion);
  const tags = [`part:${part}`, `emotion:${emotion}`];
  if (opts.topologyKey) tags.push(`topo:${opts.topologyKey}`);
  return tags;
}

/**
 * @typedef {"eyeball"|"iris"|"pupil"|"reflection"|"eyelid"} EyeLayerRole
 * @typedef {{ x: number, y: number, hx: number, hy: number }} BezierKnotPose
 * @typedef {{
 *   role: EyeLayerRole,
 *   knotCount: number,
 *   closed: boolean,
 *   fillSide: "above"|"below"|null,
 *   clipTo: EyeLayerRole|null,
 * }} EyeLayerTopology
 * @typedef {{
 *   partClass: string,
 *   version: number,
 *   layers: EyeLayerTopology[],
 * }} EyeTopology
 * @typedef {{
 *   knots: BezierKnotPose[],
 *   opacity?: number,
 *   enabled?: boolean,
 * }} EyeLayerPose
 * @typedef {{
 *   id: string,
 *   name: string,
 *   animClass: string,
 *   target: string,
 *   emotion: string,
 *   tags: string[],
 *   layers: Partial<Record<EyeLayerRole, EyeLayerPose>>,
 * }} EyePose
 */

function poseId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `pose_${crypto.randomUUID().slice(0, 8)}`;
  }
  return "pose_" + Math.random().toString(36).slice(2, 10);
}

/**
 * Stable layer order for topology: default draw order, then any extras.
 * @param {object[]} layers
 * @returns {object[]}
 */
function orderedLayers(layers) {
  const list = Array.isArray(layers) ? layers.slice() : [];
  const byType = new Map();
  for (const L of list) {
    if (L?.type && !byType.has(L.type)) byType.set(L.type, L);
  }
  const out = [];
  for (const role of EYE_DEFAULT_ORDER) {
    if (byType.has(role)) out.push(byType.get(role));
  }
  for (const L of list) {
    if (L?.type && !EYE_DEFAULT_ORDER.includes(L.type) && byType.get(L.type) === L) {
      out.push(L);
    }
  }
  return out;
}

/**
 * Extract permanent topology from an eye texture (or layer stack).
 * @param {object} texOrLayers
 * @returns {EyeTopology}
 */
export function eyeTopology(texOrLayers) {
  const layers = Array.isArray(texOrLayers) ? texOrLayers : texOrLayers?.layers || [];
  const topoLayers = [];
  for (const L of orderedLayers(layers)) {
    const role = EYE_LAYER_TYPES.includes(L.type) ? L.type : null;
    if (!role) continue;
    const closed = role !== "eyelid" && L.closed !== false;
    const fillSide =
      role === "eyelid" ? (L.fillSide === "below" ? "below" : "above") : null;
    const clipRaw = L.clipTo ?? EYE_CLIP_PARENT[role] ?? null;
    const clipTo = EYE_LAYER_TYPES.includes(clipRaw) ? clipRaw : null;
    topoLayers.push({
      role,
      knotCount: (L.knots || []).length | 0,
      closed,
      fillSide,
      clipTo,
    });
  }
  return {
    partClass: PART_CLASS_EYE,
    version: EYE_TOPOLOGY_VERSION,
    layers: topoLayers,
  };
}

/**
 * Compact fingerprint used for morph compatibility.
 * @param {object|EyeTopology} texOrTopo
 * @returns {string}
 */
export function eyeTopologyKey(texOrTopo) {
  const topo =
    texOrTopo?.partClass && Array.isArray(texOrTopo.layers) && texOrTopo.version != null
      ? texOrTopo
      : eyeTopology(texOrTopo);
  const parts = [`${topo.partClass}:v${topo.version}`];
  for (const L of topo.layers) {
    let s = `${L.role}:${L.knotCount}${L.closed ? "c" : "o"}`;
    if (L.fillSide) s += `:fill=${L.fillSide}`;
    if (L.clipTo) s += `:clip=${L.clipTo}`;
    parts.push(s);
  }
  return parts.join("/");
}

/**
 * Default topology key for a freshly created eye (4× closed + 3-knot eyelid).
 * @returns {string}
 */
export function defaultEyeTopologyKey() {
  // Match createDefaultEyeTexture layer structure without allocating a full tex.
  const fake = {
    layers: EYE_DEFAULT_ORDER.map((role) => ({
      type: role,
      closed: role !== "eyelid",
      fillSide: role === "eyelid" ? "above" : null,
      clipTo: EYE_CLIP_PARENT[role],
      knots: new Array(role === "eyelid" ? 3 : 4).fill(null),
    })),
  };
  return eyeTopologyKey(fake);
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function areEyeTexturesCompatible(a, b) {
  if (!a || !b) return false;
  const ka = a.kind == null || a.kind === "eye" ? PART_CLASS_EYE : a.kind;
  const kb = b.kind == null || b.kind === "eye" ? PART_CLASS_EYE : b.kind;
  if (ka !== PART_CLASS_EYE || kb !== PART_CLASS_EYE) return false;
  return eyeTopologyKey(a) === eyeTopologyKey(b);
}

/**
 * Filter library texture entries / eye assets that can morph with `ref`.
 * @param {Iterable<object>} textures
 * @param {object} ref
 * @returns {object[]}
 */
export function listCompatibleEyeTextures(textures, ref) {
  const out = [];
  for (const t of textures || []) {
    if (areEyeTexturesCompatible(ref, t)) out.push(t);
  }
  return out;
}

/**
 * Snapshot animatable knot poses from a layer.
 * @param {object} layer
 * @returns {EyeLayerPose}
 */
export function captureLayerPose(layer) {
  const knots = (layer?.knots || []).map((k) => ({
    x: Number(k.x) || 0,
    y: Number(k.y) || 0,
    hx: Number(k.hx) || 0,
    hy: Number(k.hy) || 0,
  }));
  /** @type {EyeLayerPose} */
  const pose = { knots };
  if (layer?.enabled === false) pose.enabled = false;
  else pose.enabled = true;
  const op = Number(layer?.opacity);
  if (Number.isFinite(op)) pose.opacity = Math.min(1, Math.max(0, op));
  return pose;
}

/**
 * Write pose knots into an existing layer (preserve ids / segments / color).
 * @param {object} layer
 * @param {EyeLayerPose} pose
 * @returns {boolean} false if knot counts differ
 */
export function applyLayerPose(layer, pose) {
  if (!layer || !pose?.knots) return false;
  if ((layer.knots || []).length !== pose.knots.length) return false;
  for (let i = 0; i < layer.knots.length; i++) {
    const src = pose.knots[i];
    const dst = layer.knots[i];
    dst.x = Number(src.x) || 0;
    dst.y = Number(src.y) || 0;
    dst.hx = Number(src.hx) || 0;
    dst.hy = Number(src.hy) || 0;
  }
  if (pose.enabled != null) layer.enabled = !!pose.enabled;
  if (pose.opacity != null && Number.isFinite(Number(pose.opacity))) {
    layer.opacity = Math.min(1, Math.max(0, Number(pose.opacity)));
  }
  return true;
}

/**
 * Capture a named pose from the texture's working layers.
 * @param {object} tex
 * @param {{
 *   emotion?: string,
 *   target?: string,
 *   animClass?: string,
 *   name?: string,
 *   id?: string,
 *   tags?: string[],
 * }} [opts]
 * @returns {EyePose|null}
 */
export function captureEyePose(tex, opts = {}) {
  if (!tex?.layers?.length) return null;
  const animClass = normalizeAnimClassId(opts.animClass ?? ANIM_CLASS_EMOTION);
  const target = normalizeAnimTarget(opts.target ?? opts.emotion ?? tex.emotion);
  const emotion = animClass === ANIM_CLASS_EMOTION ? target : normalizeEmotionTag(opts.emotion ?? tex.emotion);
  const name =
    String(opts.name || "").trim() ||
    target.charAt(0).toUpperCase() + target.slice(1);
  /** @type {Partial<Record<EyeLayerRole, EyeLayerPose>>} */
  const layers = {};
  for (const role of EYE_LAYER_TYPES) {
    const L = findLayer(tex, role);
    if (!L) continue;
    layers[role] = captureLayerPose(L);
  }
  const tags = Array.isArray(opts.tags)
    ? opts.tags.map(normalizeEmotionTag).filter(Boolean)
    : [target];
  if (!tags.includes(target)) tags.unshift(target);
  return {
    id: opts.id || poseId(),
    name,
    animClass,
    target,
    emotion,
    tags,
    layers,
  };
}

/**
 * Apply a pose onto working layers. Returns false if topology mismatches.
 * @param {object} tex
 * @param {EyePose} pose
 * @returns {boolean}
 */
export function applyEyePose(tex, pose) {
  if (!tex || !pose?.layers) return false;
  for (const role of EYE_LAYER_TYPES) {
    const layerPose = pose.layers[role];
    if (!layerPose) continue;
    const L = findLayer(tex, role);
    if (!L) return false;
    if (!applyLayerPose(L, layerPose)) return false;
  }
  const animClass = normalizeAnimClassId(pose.animClass);
  const target = normalizeAnimTarget(pose.target ?? pose.emotion);
  tex.emotion = animClass === ANIM_CLASS_EMOTION ? target : normalizeEmotionTag(pose.emotion);
  tex.activePoseId = pose.id || tex.activePoseId || null;
  return true;
}

/**
 * @param {EyePose} pose
 * @returns {{ animClass: string, target: string }}
 */
export function poseAnimRef(pose) {
  const animClass = normalizeAnimClassId(pose?.animClass);
  const target = normalizeAnimTarget(pose?.target ?? pose?.emotion);
  return { animClass, target };
}

/**
 * List targets present on a texture for one animation class.
 * @param {object} tex
 * @param {string} [animClass]
 * @returns {string[]}
 */
export function listAnimTargets(tex, animClass = ANIM_CLASS_EMOTION) {
  const cls = normalizeAnimClassId(animClass);
  const found = new Set();
  for (const p of tex?.poses || []) {
    const ref = poseAnimRef(p);
    if (ref.animClass === cls) found.add(ref.target);
  }
  return [...found];
}

/**
 * @param {object} tex
 * @param {string} animClass
 * @param {string} target
 * @returns {EyePose|null}
 */
export function getPoseForTarget(tex, animClass, target) {
  const cls = normalizeAnimClassId(animClass);
  const tgt = normalizeAnimTarget(target);
  for (const p of tex?.poses || []) {
    const ref = poseAnimRef(p);
    if (ref.animClass === cls && ref.target === tgt) return p;
  }
  return null;
}

function clonePoseLayers(layers) {
  /** @type {Partial<Record<EyeLayerRole, EyeLayerPose>>} */
  const out = {};
  for (const [role, lp] of Object.entries(layers || {})) {
    out[role] = {
      knots: (lp.knots || []).map((k) => ({
        x: k.x,
        y: k.y,
        hx: k.hx,
        hy: k.hy,
      })),
      ...(lp.enabled === false ? { enabled: false } : { enabled: true }),
      ...(Number.isFinite(Number(lp.opacity)) ? { opacity: Number(lp.opacity) } : {}),
    };
  }
  return out;
}

function offsetKnots(knots, fn) {
  return (knots || []).map((k, i) => {
    const d = fn(k, i) || {};
    return {
      x: k.x + (Number(d.x) || 0),
      y: k.y + (Number(d.y) || 0),
      hx: k.hx + (Number(d.hx) || 0),
      hy: k.hy + (Number(d.hy) || 0),
    };
  });
}

function scaleKnotsAbout(knots, cx, cy, sx, sy) {
  return (knots || []).map((k) => ({
    x: cx + (k.x - cx) * sx,
    y: cy + (k.y - cy) * sy,
    hx: k.hx * sx,
    hy: k.hy * sy,
  }));
}

/**
 * Procedural emotion variants from a base pose (same topology) for preview testing.
 * @param {EyePose} base
 * @param {string} target
 * @returns {EyePose}
 */
export function deriveDemoEmotionPose(base, target) {
  const tgt = normalizeAnimTarget(target);
  const layers = clonePoseLayers(base.layers);
  const lid = layers.eyelid;
  const eyeball = layers.eyeball;
  const iris = layers.iris;
  const pupil = layers.pupil;

  if (lid?.knots?.length >= 3) {
    if (tgt === "angry") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 0 || i === 2) return { y: 0.14, hy: -0.04 };
        return { y: -0.06, hy: 0.02 };
      });
    } else if (tgt === "sad") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 0 || i === 2) return { y: -0.04 };
        return { y: 0.1, hy: 0.04 };
      });
    } else if (tgt === "happy") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 1) return { y: -0.1, hy: -0.02 };
        return { y: 0.02 };
      });
    } else if (tgt === "surprised") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 1) return { y: 0.22, hy: 0.06 };
        return { y: 0.1 };
      });
    } else if (tgt === "sleepy") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, () => ({ y: -0.16, hy: -0.03 }));
    } else if (tgt === "fear") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 1) return { y: 0.18 };
        return { y: 0.08, hx: 0.02 };
      });
    } else if (tgt === "disgust") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, (_k, i) => {
        if (i === 0) return { y: 0.1 };
        if (i === 2) return { y: -0.02 };
        return { y: -0.08 };
      });
    } else if (tgt === "wink") {
      lid.enabled = true;
      lid.knots = offsetKnots(lid.knots, () => ({ y: -0.22 }));
    } else {
      // neutral / unknown — keep base; ensure eyelid visibility matches base
    }
  }

  if (eyeball?.knots?.length >= 3 && (tgt === "surprised" || tgt === "fear")) {
    const cx =
      eyeball.knots.reduce((s, k) => s + k.x, 0) / eyeball.knots.length;
    const cy =
      eyeball.knots.reduce((s, k) => s + k.y, 0) / eyeball.knots.length;
    eyeball.knots = scaleKnotsAbout(eyeball.knots, cx, cy, 1.02, 1.12);
  }
  if (eyeball?.knots?.length >= 3 && (tgt === "angry" || tgt === "sleepy")) {
    const cx =
      eyeball.knots.reduce((s, k) => s + k.x, 0) / eyeball.knots.length;
    const cy =
      eyeball.knots.reduce((s, k) => s + k.y, 0) / eyeball.knots.length;
    eyeball.knots = scaleKnotsAbout(eyeball.knots, cx, cy, 1.0, 0.9);
  }
  if (iris?.knots?.length && (tgt === "surprised" || tgt === "fear")) {
    const cx = iris.knots.reduce((s, k) => s + k.x, 0) / iris.knots.length;
    const cy = iris.knots.reduce((s, k) => s + k.y, 0) / iris.knots.length;
    iris.knots = scaleKnotsAbout(iris.knots, cx, cy, 0.92, 0.92);
    if (pupil?.knots?.length) {
      pupil.knots = scaleKnotsAbout(pupil.knots, cx, cy, 0.9, 0.9);
    }
  }

  return {
    id: `demo_${ANIM_CLASS_EMOTION}_${tgt}`,
    name: tgt.charAt(0).toUpperCase() + tgt.slice(1),
    animClass: ANIM_CLASS_EMOTION,
    target: tgt,
    emotion: tgt,
    tags: [tgt, "demo"],
    layers,
  };
}

/**
 * Ensure demo emotion targets exist on the texture (for A→B preview testing).
 * Captures current layers as the base (usually neutral) when missing.
 * @param {object} tex
 * @param {{ targets?: string[], baseTarget?: string }} [opts]
 * @returns {string[]} targets now available
 */
export function ensureDemoAnimTargets(tex, opts = {}) {
  if (!tex?.layers?.length) return [];
  if (!Array.isArray(tex.poses)) tex.poses = [];
  const targets = Array.isArray(opts.targets) && opts.targets.length
    ? opts.targets.map(normalizeAnimTarget)
    : ["neutral", "happy", "sad", "angry", "surprised", "sleepy"];
  const baseTarget = normalizeAnimTarget(opts.baseTarget || "neutral");

  let base = getPoseForTarget(tex, ANIM_CLASS_EMOTION, baseTarget);
  if (!base) {
    base = captureEyePose(tex, {
      animClass: ANIM_CLASS_EMOTION,
      target: baseTarget,
      emotion: baseTarget,
      id: `demo_${ANIM_CLASS_EMOTION}_${baseTarget}`,
      name: baseTarget.charAt(0).toUpperCase() + baseTarget.slice(1),
      tags: [baseTarget, "demo"],
    });
    if (base) upsertEyePose(tex, base);
  }

  for (const tgt of targets) {
    if (getPoseForTarget(tex, ANIM_CLASS_EMOTION, tgt)) continue;
    if (tgt === baseTarget) continue;
    upsertEyePose(tex, deriveDemoEmotionPose(base, tgt));
  }
  tex.topologyKey = eyeTopologyKey(tex);
  return listAnimTargets(tex, ANIM_CLASS_EMOTION);
}

/**
 * Build a cloned eye texture with layers morphed between two anim targets.
 * Does not mutate the source texture.
 * @param {object} tex
 * @param {{ animClass?: string, from: string, to: string, t?: number }} opts
 * @returns {object|null}
 */
export function morphTextureAnim(tex, opts) {
  if (!tex) return null;
  const animClass = normalizeAnimClassId(opts.animClass);
  const fromT = normalizeAnimTarget(opts.from);
  const toT = normalizeAnimTarget(opts.to);
  const t = Math.min(1, Math.max(0, Number(opts.t) || 0));
  const from = getPoseForTarget(tex, animClass, fromT);
  const to = getPoseForTarget(tex, animClass, toT);
  if (!from || !to) return null;
  const mid = interpolateEyePose(from, to, t);
  if (!mid) return null;
  mid.animClass = animClass;
  mid.target = t < 0.5 ? fromT : toT;
  const clone = JSON.parse(JSON.stringify(tex));
  if (!applyEyePose(clone, mid)) return null;
  clone.emotion = mid.emotion;
  return clone;
}

/**
 * @param {BezierKnotPose} a
 * @param {BezierKnotPose} b
 * @param {number} t
 * @returns {BezierKnotPose}
 */
export function interpolateKnot(a, b, t) {
  const u = Number(t) || 0;
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    hx: a.hx + (b.hx - a.hx) * u,
    hy: a.hy + (b.hy - a.hy) * u,
  };
}

/**
 * Linear morph between two poses (same topology required).
 * @param {EyePose} from
 * @param {EyePose} to
 * @param {number} t 0…1
 * @returns {EyePose|null}
 */
export function interpolateEyePose(from, to, t) {
  if (!from?.layers || !to?.layers) return null;
  const u = Math.min(1, Math.max(0, Number(t) || 0));
  /** @type {Partial<Record<EyeLayerRole, EyeLayerPose>>} */
  const layers = {};
  for (const role of EYE_LAYER_TYPES) {
    const a = from.layers[role];
    const b = to.layers[role];
    if (!a && !b) continue;
    if (!a || !b || a.knots.length !== b.knots.length) return null;
    const knots = a.knots.map((k, i) => interpolateKnot(k, b.knots[i], u));
    /** @type {EyeLayerPose} */
    const row = { knots };
    const ea = a.enabled !== false;
    const eb = b.enabled !== false;
    row.enabled = u < 0.5 ? ea : eb;
    const oa = Number.isFinite(Number(a.opacity)) ? Number(a.opacity) : 1;
    const ob = Number.isFinite(Number(b.opacity)) ? Number(b.opacity) : 1;
    row.opacity = oa + (ob - oa) * u;
    layers[role] = row;
  }
  const fromRef = poseAnimRef(from);
  const toRef = poseAnimRef(to);
  const emotion = u < 0.5 ? fromRef.target : toRef.target;
  return {
    id: `morph_${from.id || "a"}_${to.id || "b"}`,
    name: `${from.name || fromRef.target}→${to.name || toRef.target}`,
    animClass: fromRef.animClass || toRef.animClass || ANIM_CLASS_EMOTION,
    target: emotion,
    emotion,
    tags: ["morph"],
    layers,
  };
}

/**
 * Validate pose knot counts against texture topology.
 * @param {object} tex
 * @param {EyePose} pose
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateEyePoseTopology(tex, pose) {
  const errors = [];
  if (!pose?.layers) {
    return { ok: false, errors: ["pose missing layers"] };
  }
  const topo = eyeTopology(tex);
  const byRole = new Map(topo.layers.map((L) => [L.role, L]));
  for (const role of EYE_LAYER_TYPES) {
    const layerPose = pose.layers[role];
    const expect = byRole.get(role);
    if (!layerPose && !expect) continue;
    if (!layerPose) {
      errors.push(`pose missing layer "${role}"`);
      continue;
    }
    if (!expect) {
      errors.push(`texture missing layer "${role}" for pose`);
      continue;
    }
    if (layerPose.knots.length !== expect.knotCount) {
      errors.push(
        `${role}: pose has ${layerPose.knots.length} knots, topology expects ${expect.knotCount}`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Normalize a stored pose blob.
 * @param {any} raw
 * @param {object} [tex] optional texture for topology fill / validation
 * @returns {EyePose|null}
 */
export function normalizeEyePose(raw, tex) {
  if (!raw || typeof raw !== "object") return null;
  const animClass = normalizeAnimClassId(raw.animClass);
  const target = normalizeAnimTarget(raw.target ?? raw.emotion);
  const emotion = animClass === ANIM_CLASS_EMOTION ? target : normalizeEmotionTag(raw.emotion ?? target);
  /** @type {Partial<Record<EyeLayerRole, EyeLayerPose>>} */
  const layers = {};
  const src = raw.layers && typeof raw.layers === "object" ? raw.layers : {};
  for (const role of EYE_LAYER_TYPES) {
    const block = src[role];
    if (!block) continue;
    if (Array.isArray(block.knots)) {
      layers[role] = captureLayerPose(block);
    } else if (Array.isArray(block)) {
      // Allow shorthand: layers.eyeball = [{x,y,hx,hy}, …]
      layers[role] = captureLayerPose({ knots: block });
    }
  }
  if (!Object.keys(layers).length && tex) {
    const captured = captureEyePose(tex, {
      animClass,
      target,
      emotion,
      name: raw.name,
      id: raw.id,
      tags: raw.tags,
    });
    return captured;
  }
  if (!Object.keys(layers).length) return null;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(normalizeEmotionTag).filter(Boolean)
    : [target];
  if (!tags.includes(target)) tags.unshift(target);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : poseId(),
    name: String(raw.name || "").trim() || target.charAt(0).toUpperCase() + target.slice(1),
    animClass,
    target,
    emotion,
    tags,
    layers,
  };
}

/**
 * Normalize poses[] on an eye texture; drop incompatible entries.
 * @param {object} tex
 * @param {any[]} rawPoses
 * @returns {EyePose[]}
 */
export function normalizeEyePoses(tex, rawPoses) {
  if (!Array.isArray(rawPoses)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of rawPoses) {
    const pose = normalizeEyePose(raw, tex);
    if (!pose) continue;
    const check = validateEyePoseTopology(tex, pose);
    if (!check.ok) continue;
    if (seen.has(pose.id)) pose.id = poseId();
    seen.add(pose.id);
    out.push(pose);
  }
  return out;
}

/**
 * Serialize poses for project JSON (no knot ids).
 * @param {EyePose[]} poses
 * @returns {object[]}
 */
export function serializeEyePoses(poses) {
  return (poses || []).map((p) => {
    const ref = poseAnimRef(p);
    return {
      id: p.id,
      name: p.name,
      animClass: ref.animClass,
      target: ref.target,
      emotion: normalizeEmotionTag(p.emotion ?? ref.target),
      tags: Array.isArray(p.tags)
        ? p.tags.map(normalizeEmotionTag)
        : [ref.target],
      layers: Object.fromEntries(
        Object.entries(p.layers || {}).map(([role, lp]) => [
          role,
          {
            knots: (lp.knots || []).map((k) => ({
              x: Number(k.x) || 0,
              y: Number(k.y) || 0,
              hx: Number(k.hx) || 0,
              hy: Number(k.hy) || 0,
            })),
            ...(lp.enabled === false ? { enabled: false } : {}),
            ...(Number.isFinite(Number(lp.opacity))
              ? { opacity: Math.min(1, Math.max(0, Number(lp.opacity))) }
              : {}),
          },
        ]),
      ),
    };
  });
}

/**
 * Upsert a pose into tex.poses (by id, else by animClass+target).
 * @param {object} tex
 * @param {EyePose} pose
 */
export function upsertEyePose(tex, pose) {
  if (!tex || !pose) return;
  if (!Array.isArray(tex.poses)) tex.poses = [];
  const ref = poseAnimRef(pose);
  pose.animClass = ref.animClass;
  pose.target = ref.target;
  if (!pose.emotion) pose.emotion = ref.target;
  const i = tex.poses.findIndex((p) => {
    if (pose.id && p.id === pose.id) return true;
    const pr = poseAnimRef(p);
    return pr.animClass === ref.animClass && pr.target === ref.target;
  });
  if (i >= 0) tex.poses[i] = pose;
  else tex.poses.push(pose);
  tex.activePoseId = pose.id;
  tex.emotion = pose.emotion;
}

/**
 * Sample a pose layer to a flat Float32Array of xy pairs (closed rings drop
 * duplicate last point if samplePath includes it — we keep samples as returned).
 * @param {EyeLayerPose} layerPose
 * @param {{ closed: boolean, samplesPerSpan?: number, segments?: object[] }} opts
 * @returns {Float32Array}
 */
export function sampleLayerPose(layerPose, opts) {
  const knots = (layerPose?.knots || []).map((k, i) => ({
    id: `s${i}`,
    x: k.x,
    y: k.y,
    hx: k.hx,
    hy: k.hy,
    color: "#fff",
  }));
  const segments = opts.segments || [];
  const pts = samplePath(knots, segments, {
    closed: !!opts.closed,
    samplesPerSpan: opts.samplesPerSpan ?? 16,
  });
  const out = new Float32Array(pts.length * 2);
  for (let i = 0; i < pts.length; i++) {
    out[i * 2] = pts[i].x;
    out[i * 2 + 1] = pts[i].y;
  }
  return out;
}

/**
 * Compile authoring poses → runtime-ish sampled buffers (CPU preview / GPU prep).
 * Does not triangulate yet; callers can share one index buffer per layer later.
 *
 * @param {object} tex
 * @param {{ samplesPerSpan?: number, poseIds?: string[] }} [opts]
 * @returns {{
 *   topologyKey: string,
 *   partClass: string,
 *   layers: Array<{
 *     role: string,
 *     closed: boolean,
 *     clipTo: string|null,
 *     fillSide: string|null,
 *     poses: Record<string, Float32Array>,
 *   }>,
 *   emotions: Record<string, string>,
 * } | null}
 */
export function compileEyeRig(tex, opts = {}) {
  if (!tex?.layers?.length) return null;
  const samplesPerSpan = opts.samplesPerSpan ?? 16;
  const topo = eyeTopology(tex);
  const key = eyeTopologyKey(topo);
  const poseList =
    Array.isArray(tex.poses) && tex.poses.length
      ? tex.poses
      : [captureEyePose(tex, { emotion: tex.emotion || "neutral", name: "Current" })].filter(
          Boolean,
        );
  const selected = opts.poseIds
    ? poseList.filter((p) => opts.poseIds.includes(p.id) || opts.poseIds.includes(p.emotion))
    : poseList;

  /** @type {Record<string, string>} */
  const emotions = {};
  const layers = [];

  for (const tLayer of topo.layers) {
    const live = findLayer(tex, tLayer.role);
    const poseBufs = {};
    for (const pose of selected) {
      const lp = pose.layers?.[tLayer.role];
      if (!lp) continue;
      const check = lp.knots.length === tLayer.knotCount;
      if (!check) continue;
      poseBufs[pose.id] = sampleLayerPose(lp, {
        closed: tLayer.closed,
        samplesPerSpan,
        segments: live?.segments || [],
      });
      emotions[pose.id] = pose.emotion;
    }
    layers.push({
      role: tLayer.role,
      closed: tLayer.closed,
      clipTo: tLayer.clipTo,
      fillSide: tLayer.fillSide,
      poses: poseBufs,
    });
  }

  return {
    topologyKey: key,
    partClass: PART_CLASS_EYE,
    layers,
    emotions,
  };
}
