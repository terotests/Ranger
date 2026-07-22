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
 * Capture a named emotion pose from the texture's working layers.
 * @param {object} tex
 * @param {{ emotion?: string, name?: string, id?: string, tags?: string[] }} [opts]
 * @returns {EyePose|null}
 */
export function captureEyePose(tex, opts = {}) {
  if (!tex?.layers?.length) return null;
  const emotion = normalizeEmotionTag(opts.emotion ?? tex.emotion);
  const name =
    String(opts.name || "").trim() ||
    emotion.charAt(0).toUpperCase() + emotion.slice(1);
  /** @type {Partial<Record<EyeLayerRole, EyeLayerPose>>} */
  const layers = {};
  for (const role of EYE_LAYER_TYPES) {
    const L = findLayer(tex, role);
    if (!L) continue;
    layers[role] = captureLayerPose(L);
  }
  const tags = Array.isArray(opts.tags)
    ? opts.tags.map(normalizeEmotionTag).filter(Boolean)
    : [emotion];
  if (!tags.includes(emotion)) tags.unshift(emotion);
  return {
    id: opts.id || poseId(),
    name,
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
  tex.emotion = normalizeEmotionTag(pose.emotion);
  tex.activePoseId = pose.id || tex.activePoseId || null;
  return true;
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
  return {
    id: `morph_${from.id || "a"}_${to.id || "b"}`,
    name: `${from.name || from.emotion}→${to.name || to.emotion}`,
    emotion: u < 0.5 ? normalizeEmotionTag(from.emotion) : normalizeEmotionTag(to.emotion),
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
  const emotion = normalizeEmotionTag(raw.emotion);
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
    const captured = captureEyePose(tex, { emotion, name: raw.name, id: raw.id, tags: raw.tags });
    return captured;
  }
  if (!Object.keys(layers).length) return null;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(normalizeEmotionTag).filter(Boolean)
    : [emotion];
  if (!tags.includes(emotion)) tags.unshift(emotion);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : poseId(),
    name: String(raw.name || "").trim() || emotion.charAt(0).toUpperCase() + emotion.slice(1),
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
  return (poses || []).map((p) => ({
    id: p.id,
    name: p.name,
    emotion: normalizeEmotionTag(p.emotion),
    tags: Array.isArray(p.tags) ? p.tags.map(normalizeEmotionTag) : [normalizeEmotionTag(p.emotion)],
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
  }));
}

/**
 * Upsert a pose into tex.poses (by id, or by emotion if id missing).
 * @param {object} tex
 * @param {EyePose} pose
 */
export function upsertEyePose(tex, pose) {
  if (!tex || !pose) return;
  if (!Array.isArray(tex.poses)) tex.poses = [];
  const i = tex.poses.findIndex(
    (p) => p.id === pose.id || (!pose.id && p.emotion === pose.emotion),
  );
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
