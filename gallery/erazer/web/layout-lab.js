/**
 * Erazer layout lab — HTML fixtures → PNG → Erazer boxes → tiny WebGPU MLP.
 *
 * Browser: globalThis.ErazerLayoutLab
 * Node smoke can load the pure helpers (packDump, matchBoxes, MIN_SAMPLES).
 */
(function (root) {
  var IN = 40;
  var HID = 32;
  var CLASSES = ["list", "form", "toolbar", "card", "nav", "property_row", "grid", "other"];
  var MIN_SAMPLES = 8;
  var DB_NAME = "erazer-layout-lab";
  var WEIGHTS_KEY = "erazer-layout-weights";
  var COPY_KEYS = [
    "background-color", "color", "border-top-width", "border-right-width",
    "border-bottom-width", "border-left-width", "border-top-style", "border-right-style",
    "border-bottom-style", "border-left-style", "border-top-color", "border-right-color",
    "border-bottom-color", "border-left-color", "border-top-left-radius",
    "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
    "font-family", "font-size", "font-weight", "font-style", "line-height",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin-top", "margin-right", "margin-bottom", "margin-left",
    "display", "flex-direction", "align-items", "justify-content", "gap",
    "width", "height", "box-sizing", "text-align", "overflow", "position",
    "top", "left", "right", "bottom"
  ];

  var lab = {
    MIN_SAMPLES: MIN_SAMPLES,
    CLASSES: CLASSES.slice(),
    IN: IN,
    HID: HID
  };

  function fmtNum(n) {
    if (!isFinite(n)) return "0";
    var s = Number(n).toFixed(12).replace(/\.?0+$/, "");
    if (s === "-0" || s === "") s = "0";
    return s;
  }

  lab.packDump = function (classNames, w1, b1, w2, b2) {
    var names = classNames || CLASSES;
    var out = names.length;
    return [
      "v1", String(IN), String(HID), String(out), names.join(","),
      arrCsv(w1), arrCsv(b1), arrCsv(w2), arrCsv(b2)
    ].join(" ");
  };

  function arrCsv(arr) {
    var s = "";
    for (var i = 0; i < arr.length; i++) {
      if (i) s += ",";
      s += fmtNum(arr[i]);
    }
    return s;
  }

  lab.matchBoxes = function (erazerBoxes, group, pad) {
    pad = pad == null ? 4 : pad;
    var out = [];
    var gx = group.x - pad;
    var gy = group.y - pad;
    var gr = group.x + group.w + pad;
    var gb = group.y + group.h + pad;
    for (var i = 0; i < erazerBoxes.length; i++) {
      var b = erazerBoxes[i];
      var cx = b.x + b.w * 0.5;
      var cy = b.y + b.h * 0.5;
      if (cx >= gx && cy >= gy && cx <= gr && cy <= gb) {
        if ((b.type || "") !== "page") out.push(b);
      }
    }
    return out;
  };

  lab.centerIn = function (box, group, pad) {
    return lab.matchBoxes([box], group, pad).length === 1;
  };

  function waitFrame() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function openDb() {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("indexedDB puuttuu"));
    }
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("samples")) {
          db.createObjectStore("samples", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbReq(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  lab.countSamples = async function () {
    var db = await openDb();
    try {
      return await idbReq(db.transaction("samples").objectStore("samples").count());
    } finally {
      db.close();
    }
  };

  lab.listSamples = async function () {
    var db = await openDb();
    try {
      return await idbReq(db.transaction("samples").objectStore("samples").getAll());
    } finally {
      db.close();
    }
  };

  lab.saveSample = async function (sample) {
    var db = await openDb();
    try {
      var tx = db.transaction("samples", "readwrite");
      await idbReq(tx.objectStore("samples").add(sample));
    } finally {
      db.close();
    }
  };

  lab.clearSamples = async function () {
    var db = await openDb();
    try {
      var tx = db.transaction("samples", "readwrite");
      await idbReq(tx.objectStore("samples").clear());
    } finally {
      db.close();
    }
  };

  lab.saveModel = async function (record) {
    var db = await openDb();
    try {
      record.id = "current";
      var tx = db.transaction("models", "readwrite");
      await idbReq(tx.objectStore("models").put(record));
    } finally {
      db.close();
    }
    try { localStorage.setItem(WEIGHTS_KEY, record.dump); } catch (err) {}
  };

  lab.loadModel = async function () {
    var db = await openDb();
    try {
      return await idbReq(db.transaction("models").objectStore("models").get("current"));
    } finally {
      db.close();
    }
  };

  function copyComputed(srcEl, dstEl) {
    var cs = getComputedStyle(srcEl);
    var parts = [];
    for (var k = 0; k < COPY_KEYS.length; k++) {
      parts.push(COPY_KEYS[k] + ":" + cs.getPropertyValue(COPY_KEYS[k]));
    }
    dstEl.setAttribute("style", parts.join(";") + ";" + (dstEl.getAttribute("style") || ""));
  }

  function inlineCloneXhtml(el) {
    var xhtmlDoc = document.implementation.createDocument(
      "http://www.w3.org/1999/xhtml", "div", null
    );
    var wrap = xhtmlDoc.documentElement;
    wrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    var clone = xhtmlDoc.importNode(el, true);
    wrap.appendChild(clone);
    var src = [el].concat(Array.prototype.slice.call(el.querySelectorAll("*")));
    var dst = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll("*")));
    for (var i = 0; i < src.length && i < dst.length; i++) copyComputed(src[i], dst[i]);
    return wrap;
  }

  lab.paintRoleCanvas = function (group, boxes) {
    var w = Math.max(1, Math.ceil(group && group.w ? group.w : 1));
    var h = Math.max(1, Math.ceil(group && group.h ? group.h : 1));
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#e8ecf0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(1, 1, Math.max(0, w - 2), Math.max(0, h - 2));
    var fills = {
      panel: "#f8fafc", button: "#2563eb", textfield: "#e5e7eb",
      label: "#111827", checkbox: "#ffffff", icon: "#111827", tab: "#e5e7eb"
    };
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      ctx.fillStyle = fills[b.type] || "#cbd5e1";
      ctx.fillRect(b.x, b.y, Math.max(1, b.w), Math.max(1, b.h));
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, Math.max(1, b.w), Math.max(1, b.h));
    }
    return c;
  };

  lab.rasterizeElement = function (el, mime) {
    mime = mime || "image/png";
    var w = Math.max(1, Math.ceil(el.scrollWidth || el.offsetWidth));
    var h = Math.max(1, Math.ceil(el.scrollHeight || el.offsetHeight));
    var wrap = inlineCloneXhtml(el);
    wrap.setAttribute("style", "margin:0;width:" + w + "px;height:" + h + "px");
    var xhtml = new XMLSerializer().serializeToString(wrap);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<foreignObject width="100%" height="100%">' + xhtml + "</foreignObject></svg>";
    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return new Promise(function (resolve, reject) {
      var done = false;
      var img = new Image();
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("SVG-foreignObject aikakatkaistiin"));
      }, 8000);
      function finish(err, result) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(result);
      }
      img.onload = function () {
        try {
          var c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#e8ecf0";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0);
          finish(null, { canvas: c, mime: mime, width: w, height: h });
        } catch (err) {
          finish(err);
        }
      };
      img.onerror = function () {
        finish(new Error("SVG-foreignObject-rasterointi epäonnistui"));
      };
      img.src = url;
    });
  };

  lab.measureRoles = function (root) {
    var origin = root.getBoundingClientRect();
    var concept = root.getAttribute("data-concept") || "other";
    var nodes = root.querySelectorAll("[data-role]");
    var boxes = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      var fs = parseFloat(getComputedStyle(el).fontSize) || 14;
      boxes.push({
        type: el.getAttribute("data-role") || "label",
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
        fontSize: fs,
        index: boxes.length
      });
    }
    return {
      concept: concept,
      group: { x: 0, y: 0, w: origin.width, h: origin.height },
      boxes: boxes
    };
  };

  function toRangerBoxes(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var box = ErazerLayoutBox.of(
        b.type || "label",
        b.x, b.y, b.w, b.h,
        b.fontSize || 14
      );
      box.index = b.index != null ? b.index : i;
      out.push(box);
    }
    return out;
  }

  lab.expandSamples = function (raw) {
    var groups = [];
    var labels = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i];
      if (!s.boxes || s.boxes.length < 2) continue;
      var boxes = toRangerBoxes(s.boxes);
      var augs = ErazerLayoutFeat.augment(boxes);
      for (var a = 0; a < augs.length; a++) {
        groups.push(augs[a]);
        labels.push(s.label || "other");
      }
      var negs = ErazerLayoutFeat.hardNegatives(boxes);
      for (var n = 0; n < negs.length; n++) {
        groups.push(negs[n]);
        labels.push("other");
      }
    }
    return { groups: groups, labels: labels };
  };

  /**
   * The synthetic archetypes the Ranger net seeds itself from, as lab samples.
   *
   * Eight HTML fixtures cover six of the eight classes and carry three
   * toolbars against one of everything else. Training on those alone — from a
   * random start — threw the seed away: a four-label column came back as
   * `nav` at 100%. The seed corpus rides along in every fine-tune so the
   * classes the fixtures do not show still have gradient behind them.
   */
  lab.seedSamples = function () {
    if (typeof ErazerLayoutNet === "undefined") return [];
    var net = ErazerLayoutNet.shared();
    var em = 16;
    return [
      { label: "list", boxes: net.synthList(4, em), source: "seed", fixture: "synth-list-4" },
      { label: "list", boxes: net.synthList(6, em), source: "seed", fixture: "synth-list-6" },
      { label: "form", boxes: net.synthForm(em), source: "seed", fixture: "synth-form" },
      { label: "toolbar", boxes: net.synthToolbar(4, em), source: "seed", fixture: "synth-toolbar-4" },
      { label: "nav", boxes: net.synthNav(em), source: "seed", fixture: "synth-nav" },
      { label: "property_row", boxes: net.synthRows(em), source: "seed", fixture: "synth-rows" },
      { label: "grid", boxes: net.synthGrid(em), source: "seed", fixture: "synth-grid" },
      { label: "card", boxes: net.synthCard(em), source: "seed", fixture: "synth-card" }
    ];
  };

  /** `v1 in hid out names w1 b1 w2 b2` → typed arrays, or null when malformed. */
  lab.parseDump = function (dump) {
    var parts = String(dump || "").split(/\s+/).filter(function (t) { return t.length; });
    if (parts.length < 9 || parts[0] !== "v1") return null;
    var inSize = parseInt(parts[1], 10);
    var hidSize = parseInt(parts[2], 10);
    var outSize = parseInt(parts[3], 10);
    var names = parts[4].split(",");
    if (!(inSize > 0) || !(hidSize > 0) || names.length !== outSize) return null;
    var toF32 = function (csv) {
      var toks = csv.split(",");
      var out = new Float32Array(toks.length);
      for (var i = 0; i < toks.length; i++) {
        var v = parseFloat(toks[i]);
        out[i] = isFinite(v) ? v : 0;
      }
      return out;
    };
    var w1 = toF32(parts[5]), b1 = toF32(parts[6]), w2 = toF32(parts[7]), b2 = toF32(parts[8]);
    if (w1.length !== inSize * hidSize || b1.length !== hidSize) return null;
    if (w2.length !== hidSize * outSize || b2.length !== outSize) return null;
    return { inSize: inSize, hidSize: hidSize, outSize: outSize, names: names, w1: w1, b1: b1, w2: w2, b2: b2 };
  };

  /** The weights the page is predicting with right now. */
  lab.currentDump = function () {
    if (typeof ErazerLayoutNet === "undefined") return "";
    return ErazerLayoutNet.shared().dumpWeights();
  };

  /**
   * Repeat the thin classes until every class carries about as much weight as
   * the fattest one, and keep `other` — which the hard negatives produce in
   * bulk — from drowning the rest.
   */
  lab.balance = function (batch, classCount, otherIndex) {
    var n = batch.x.length;
    if (!n) return batch;
    /* `other` is wherever the class list puts it: teaching a new concept
       appends it, so it is not always last. */
    var other = otherIndex == null ? classCount - 1 : otherIndex;
    var counts = [];
    var c;
    for (c = 0; c < classCount; c++) counts.push(0);
    for (var i = 0; i < n; i++) counts[batch.y[i]] = (counts[batch.y[i]] || 0) + 1;
    var top = 0;
    for (c = 0; c < classCount; c++) {
      if (c === other) continue;
      if (counts[c] > top) top = counts[c];
    }
    if (top < 1) return batch;
    var cap = Math.max(top, 1) * 2;
    var x = [];
    var y = [];
    var taken = [];
    for (c = 0; c < classCount; c++) taken.push(0);
    for (var k = 0; k < n; k++) {
      var cls = batch.y[k];
      var limit = cls === other ? cap : counts[cls];
      if (taken[cls] >= limit) continue;
      taken[cls]++;
      var reps = counts[cls] > 0 ? Math.max(1, Math.round(top / counts[cls])) : 1;
      if (reps > 6) reps = 6;
      for (var r = 0; r < reps; r++) {
        x.push(batch.x[k]);
        y.push(cls);
      }
    }
    return { x: x, y: y };
  };

  /**
   * What a model has to keep getting right: the eight archetypes plus every
   * sample the lab recorded. A fine-tune that scores worse than the model on
   * the page is not an improvement, however low its loss got.
   */
  lab.evalCases = function (rawSamples) {
    var cases = [];
    var seeds = lab.seedSamples();
    var i;
    /* `core` marks the archetypes. They are scored on their own as well as in
       the total, because a fine-tune can raise the total by memorising the
       fixtures while losing every archetype — which is exactly what training
       from a random start did. */
    for (i = 0; i < seeds.length; i++) {
      cases.push({ label: seeds[i].label, boxes: toRangerBoxes(seeds[i].boxes), core: true });
    }
    var raw = rawSamples || [];
    for (i = 0; i < raw.length; i++) {
      if (!raw[i].boxes || raw[i].boxes.length < 2) continue;
      cases.push({ label: raw[i].label || "other", boxes: toRangerBoxes(raw[i].boxes), core: false });
    }
    return cases;
  };

  /**
   * Share of `cases` a dump names correctly, overall and over the archetypes
   * alone. Both are -1 when the dump will not load.
   */
  lab.scoreParts = function (dump, cases) {
    if (typeof ErazerLayoutNet === "undefined" || !cases.length) return { all: -1, core: -1 };
    var net = new ErazerLayoutNet();
    if (!net.loadWeights(dump)) return { all: -1, core: -1 };
    var ok = 0;
    var coreOk = 0;
    var coreN = 0;
    for (var i = 0; i < cases.length; i++) {
      var hit = net.predict(cases[i].boxes).type === cases[i].label;
      if (hit) ok++;
      if (cases[i].core) {
        coreN++;
        if (hit) coreOk++;
      }
    }
    return { all: ok / cases.length, core: coreN ? coreOk / coreN : 1 };
  };

  /** Overall share only, for callers that do not need the split. */
  lab.scoreDump = function (dump, cases) {
    return lab.scoreParts(dump, cases).all;
  };

  lab.featureBatch = function (groups, labels, classNames) {
    classNames = classNames || CLASSES;
    var index = {};
    for (var c = 0; c < classNames.length; c++) index[classNames[c]] = c;
    var xs = [];
    var ys = [];
    for (var i = 0; i < groups.length; i++) {
      var boxes = groups[i].boxes || groups[i];
      if (!boxes || boxes.length < 2) continue;
      var feat = ErazerLayoutFeat.features(boxes);
      var row = [];
      for (var f = 0; f < IN; f++) row.push(feat[f] || 0);
      xs.push(row);
      var labName = labels[i] || "other";
      ys.push(index.hasOwnProperty(labName) ? index[labName] : index.other);
    }
    return { x: xs, y: ys };
  };

  var WGSL = [
    "struct Params { lr: f32, inSize: u32, hidSize: u32, outSize: u32, y: u32, pad0: u32, pad1: u32, pad2: u32 }",
    "@group(0) @binding(0) var<uniform> params: Params;",
    "@group(0) @binding(1) var<storage, read> x: array<f32>;",
    "@group(0) @binding(2) var<storage, read_write> w1: array<f32>;",
    "@group(0) @binding(3) var<storage, read_write> b1: array<f32>;",
    "@group(0) @binding(4) var<storage, read_write> w2: array<f32>;",
    "@group(0) @binding(5) var<storage, read_write> b2: array<f32>;",
    "@group(0) @binding(6) var<storage, read_write> loss: array<f32>;",
    "fn tanh_f(v: f32) -> f32 {",
    "  let c = clamp(v, -8.0, 8.0);",
    "  let e = exp(2.0 * c);",
    "  return (e - 1.0) / (e + 1.0);",
    "}",
    "@compute @workgroup_size(1)",
    "fn main() {",
    "  var h: array<f32, 32>;",
    "  var logits: array<f32, 8>;",
    "  var probs: array<f32, 8>;",
    "  var dz2: array<f32, 8>;",
    "  var dh: array<f32, 32>;",
    "  for (var j = 0u; j < 32u; j++) {",
    "    var z = b1[j];",
    "    for (var i = 0u; i < 40u; i++) { z = z + w1[j * 40u + i] * x[i]; }",
    "    h[j] = tanh_f(z);",
    "  }",
    "  var mx = -1.0e9;",
    "  for (var k = 0u; k < 8u; k++) {",
    "    var z2 = b2[k];",
    "    for (var j = 0u; j < 32u; j++) { z2 = z2 + w2[k * 32u + j] * h[j]; }",
    "    logits[k] = z2;",
    "    mx = max(mx, z2);",
    "  }",
    "  var sum = 0.0;",
    "  for (var k = 0u; k < 8u; k++) {",
    "    let e = exp(logits[k] - mx);",
    "    probs[k] = e;",
    "    sum = sum + e;",
    "  }",
    "  for (var k = 0u; k < 8u; k++) { probs[k] = probs[k] / max(sum, 1.0e-8); }",
    "  loss[0] = -log(max(probs[params.y], 1.0e-8));",
    "  for (var k = 0u; k < 8u; k++) { dz2[k] = probs[k]; }",
    "  dz2[params.y] = dz2[params.y] - 1.0;",
    "  for (var j = 0u; j < 32u; j++) { dh[j] = 0.0; }",
    "  for (var k = 0u; k < 8u; k++) {",
    "    let gk = dz2[k];",
    "    b2[k] = b2[k] - params.lr * gk;",
    "    for (var j = 0u; j < 32u; j++) {",
    "      let idx = k * 32u + j;",
    "      let wv = w2[idx];",
    "      dh[j] = dh[j] + wv * gk;",
    "      w2[idx] = wv - params.lr * gk * h[j];",
    "    }",
    "  }",
    "  for (var j = 0u; j < 32u; j++) {",
    "    let hv = h[j];",
    "    let dz1 = dh[j] * (1.0 - hv * hv);",
    "    b1[j] = b1[j] - params.lr * dz1;",
    "    for (var i = 0u; i < 40u; i++) {",
    "      let idx = j * 40u + i;",
    "      w1[idx] = w1[idx] - params.lr * dz1 * x[i];",
    "    }",
    "  }",
    "}"
  ].join("\n");

  lab.webgpuAvailable = async function () {
    if (!root.navigator || !navigator.gpu) return false;
    try {
      var adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;
      var device = await adapter.requestDevice();
      if (device && device.destroy) device.destroy();
      return true;
    } catch (err) {
      return false;
    }
  };

  function randArr(n, scale, rng) {
    var a = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      rng.s = (rng.s * 1.13001 + 0.137) % 1;
      a[i] = (rng.s * 2 - 1) * scale;
    }
    return a;
  }

  /**
   * The shader is written for exactly 40→32→8, so a net that has grown a
   * class past the eight defaults cannot be fine-tuned here.
   */
  lab.gpuFits = function (init) {
    return !!init && init.inSize === IN && init.hidSize === HID && init.outSize === 8;
  };

  lab.trainWebGPU = async function (batch, opts) {
    opts = opts || {};
    var lr = opts.lr == null ? 0.03 : opts.lr;
    var epochs = opts.epochs == null ? 12 : opts.epochs;
    if (!navigator.gpu) throw new Error("WebGPU ei ole käytössä");
    var init = opts.init || null;
    if (init && !lab.gpuFits(init)) {
      throw new Error("malli ei ole 40→32→8, GPU-polku ei kelpaa");
    }
    var adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("WebGPU-adapteria ei saatu");
    var device = await adapter.requestDevice();
    var rng = { s: 0.137 };
    var s1 = Math.sqrt(6 / (IN + HID));
    var s2 = Math.sqrt(6 / (HID + 8));
    /* Warm start from the weights the page already predicts with. Starting
       random threw the synthetic seed away every time the button was hit. */
    var names = init ? init.names : CLASSES;
    var w1 = init ? Float32Array.from(init.w1) : randArr(IN * HID, s1, rng);
    var b1 = init ? Float32Array.from(init.b1) : randArr(HID, 0.01, rng);
    var w2 = init ? Float32Array.from(init.w2) : randArr(HID * 8, s2, rng);
    var b2 = init ? Float32Array.from(init.b2) : randArr(8, 0.01, rng);
    var xBuf = device.createBuffer({ size: IN * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    var w1Buf = device.createBuffer({ size: w1.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
    var b1Buf = device.createBuffer({ size: b1.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
    var w2Buf = device.createBuffer({ size: w2.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
    var b2Buf = device.createBuffer({ size: b2.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
    var lossBuf = device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    var uniBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(w1Buf, 0, w1);
    device.queue.writeBuffer(b1Buf, 0, b1);
    device.queue.writeBuffer(w2Buf, 0, w2);
    device.queue.writeBuffer(b2Buf, 0, b2);
    var shader = device.createShaderModule({ code: WGSL });
    var pipeline = device.createComputePipeline({
      layout: "auto",
      compute: { module: shader, entryPoint: "main" }
    });
    var bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniBuf } },
        { binding: 1, resource: { buffer: xBuf } },
        { binding: 2, resource: { buffer: w1Buf } },
        { binding: 3, resource: { buffer: b1Buf } },
        { binding: 4, resource: { buffer: w2Buf } },
        { binding: 5, resource: { buffer: b2Buf } },
        { binding: 6, resource: { buffer: lossBuf } }
      ]
    });
    var n = batch.x.length;
    for (var e = 0; e < epochs; e++) {
      var order = [];
      for (var i = 0; i < n; i++) order.push(i);
      for (var s = n - 1; s > 0; s--) {
        var j = (s * 17 + e * 13) % (s + 1);
        var tmp = order[s]; order[s] = order[j]; order[j] = tmp;
      }
      for (var t = 0; t < n; t++) {
        var idx = order[t];
        var x = new Float32Array(IN);
        for (var k = 0; k < IN; k++) x[k] = batch.x[idx][k] || 0;
        device.queue.writeBuffer(xBuf, 0, x);
        var u = new ArrayBuffer(32);
        var fu = new Float32Array(u);
        var iu = new Uint32Array(u);
        fu[0] = lr;
        iu[1] = IN; iu[2] = HID; iu[3] = 8; iu[4] = batch.y[idx] | 0;
        device.queue.writeBuffer(uniBuf, 0, u);
        var encoder = device.createCommandEncoder();
        var pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(1);
        pass.end();
        device.queue.submit([encoder.finish()]);
      }
      await device.queue.onSubmittedWorkDone();
    }
    var lastLoss = await readF32(device, lossBuf, 4);
    var w1o = await readF32(device, w1Buf, w1.byteLength);
    var b1o = await readF32(device, b1Buf, b1.byteLength);
    var w2o = await readF32(device, w2Buf, w2.byteLength);
    var b2o = await readF32(device, b2Buf, b2.byteLength);
    if (device.destroy) device.destroy();
    return {
      dump: lab.packDump(names, w1o, b1o, w2o, b2o),
      loss: lastLoss[0],
      backend: "webgpu",
      steps: n * epochs
    };
  };

  async function readF32(device, buf, bytes) {
    var staging = device.createBuffer({ size: bytes, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    var enc = device.createCommandEncoder();
    enc.copyBufferToBuffer(buf, 0, staging, 0, bytes);
    device.queue.submit([enc.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    var copy = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();
    return copy;
  }

  lab.trainCPU = function (raw, epochs) {
    var net = new ErazerLayoutNet();
    /* Same rule as the GPU path: continue from the live weights, and keep the
       archetypes in the corpus so the classes the fixtures miss survive. */
    var start = lab.currentDump();
    if (start) net.loadWeights(start);
    var expanded = lab.expandSamples((raw || []).concat(lab.seedSamples()));
    net.fitAll(expanded.groups, expanded.labels, epochs || 12);
    return {
      dump: net.dumpWeights(),
      backend: "cpu",
      steps: net.stepsDone
    };
  };

  lab.hasWebGPU = function () {
    return !!(root.navigator && navigator.gpu);
  };

  lab.init = function (hooks) {
    lab.hooks = hooks || {};
    return lab;
  };

  lab.scopeCss = function (css, prefix) {
    prefix = prefix || "#captureHost";
    var out = "";
    var i = 0;
    while (i < css.length) {
      var start = css.indexOf("{", i);
      if (start < 0) {
        out += css.slice(i);
        break;
      }
      var sel = css.slice(i, start).trim();
      var depth = 0;
      var end = start;
      for (; end < css.length; end++) {
        if (css.charAt(end) === "{") depth++;
        else if (css.charAt(end) === "}") {
          depth--;
          if (depth === 0) break;
        }
      }
      var body = css.slice(start, end + 1);
      if (sel.charAt(0) === "@") {
        out += sel + body;
      } else if (sel) {
        var parts = sel.split(",");
        var prefixed = [];
        for (var p = 0; p < parts.length; p++) {
          var s = parts[p].trim();
          if (!s) continue;
          if (s === ":root" || s === "html" || s === "body") prefixed.push(prefix);
          else if (s === "*") prefixed.push(prefix + ", " + prefix + " *");
          else prefixed.push(prefix + " " + s);
        }
        out += prefixed.join(", ") + " " + body;
      }
      i = end + 1;
    }
    return out;
  };

  lab.installFixtureCss = function (html) {
    var parsed = new DOMParser().parseFromString(html, "text/html");
    var styleEl = parsed.querySelector("style");
    var css = styleEl ? styleEl.textContent : "";
    if (css && typeof document !== "undefined") {
      var live = document.getElementById("erazer-lab-css");
      if (!live) {
        live = document.createElement("style");
        live.id = "erazer-lab-css";
        document.head.appendChild(live);
      }
      live.textContent = lab.scopeCss(css, "#captureHost");
    }
    return parsed;
  };

  lab.buildHtmlSet = async function () {
    var hooks = lab.hooks || {};
    var log = hooks.log || function () {};
    var showCanvas = hooks.showCanvas;
    var canvasToBuffer = hooks.canvasToBuffer;
    var runDoc = hooks.runDoc;
    log("Ladataan HTML-komponentteja…");
    var html = await fetch("components.html").then(function (r) {
      if (!r.ok) throw new Error("components.html puuttuu");
      return r.text();
    });
    var parsed = lab.installFixtureCss(html);
    var shots = parsed.querySelectorAll("[data-shot][data-concept]");
    if (!shots.length) throw new Error("ei data-concept-fixtuureja");
    var host = hooks.host;
    if (!host) throw new Error("capture-host puuttuu");
    try { await lab.clearSamples(); } catch (err0) {}
    var added = 0;
    for (var i = 0; i < shots.length; i++) {
      var src = shots[i];
      var name = src.getAttribute("data-shot") || ("shot-" + i);
      var concept = src.getAttribute("data-concept") || "other";
      log("1/3 renderöidään " + name + " (" + concept + ")");
      host.innerHTML = "";
      var node = document.importNode(src, true);
      host.appendChild(node);
      host.style.background = "#e8ecf0";
      await waitFrame();
      var measured = lab.measureRoles(node);
      log("   boksit: " + measured.boxes.length);
      if (showCanvas) {
        /* show the live widget while we record */
      }
      var raster = null;
      try {
        log("   HTML → PNG");
        raster = await lab.rasterizeElement(node, "image/png");
        log("   PNG " + raster.width + "×" + raster.height);
        if (showCanvas) showCanvas(raster.canvas, name);
        await waitFrame();
      } catch (err) {
        log("   rasterointi epäonnistui (" + err.message + "), piirretään boksit");
        var fallback = lab.paintRoleCanvas(measured.group, measured.boxes);
        raster = { canvas: fallback, mime: "image/png", width: fallback.width, height: fallback.height, fallback: true };
        if (showCanvas) showCanvas(fallback, name);
      }
      if (measured.boxes.length >= 2) {
        await lab.saveSample({
          label: concept,
          boxes: measured.boxes,
          source: "dom",
          fixture: name,
          at: Date.now()
        });
        added++;
      }
      if (raster && canvasToBuffer && typeof Erazer !== "undefined") {
        log("2/3 vektoroidaan " + name);
        var img = canvasToBuffer(raster.canvas);
        var doc = Erazer.analyze(img);
        if (runDoc) runDoc(img, doc);
        await waitFrame();
        var layout = {};
        try { layout = JSON.parse(doc.layoutJson || "{}"); } catch (err2) {}
        var matched = lab.matchBoxes(layout.boxes || [], measured.group, 8);
        if (matched.length >= 2) {
          await lab.saveSample({
            label: concept,
            boxes: matched.map(function (b, idx) {
              return {
                type: b.type, x: b.x, y: b.y, w: b.w, h: b.h,
                fontSize: b.fontSize || 14, index: idx
              };
            }),
            source: "erazer",
            fixture: name,
            at: Date.now()
          });
          added++;
        }
      }
      if (hooks.progress) hooks.progress({ added: added, name: name, concept: concept });
      await sleep(40);
    }
    host.innerHTML = "";
    var total = await lab.countSamples();
    log("Valmis. Näytteitä " + total + " (lisättiin " + added + "). Koulutukseen tarvitaan ≥ " + MIN_SAMPLES + ".");
    return total;
  };

  /**
   * Train, then check. A run is adopted only when it names the archetypes and
   * the recorded samples at least as well as the model already on the page —
   * the weights land in IndexedDB and localStorage, so a bad fine-tune used to
   * follow the user around until they cleared site data.
   */
  lab.trainOnDemand = async function (opts) {
    opts = opts || {};
    var log = (lab.hooks && lab.hooks.log) || function () {};
    var samples = await lab.listSamples();
    if (samples.length < MIN_SAMPLES) {
      throw new Error("liian vähän näytteitä (" + samples.length + "/" + MIN_SAMPLES + ")");
    }
    var baseDump = lab.currentDump();
    var init = lab.parseDump(baseDump);
    var names = init ? init.names : CLASSES;
    var expanded = lab.expandSamples(samples.concat(lab.seedSamples()));
    var batch = lab.featureBatch(expanded.groups, expanded.labels, names);
    var otherIndex = names.indexOf("other");
    batch = lab.balance(batch, names.length, otherIndex < 0 ? names.length - 1 : otherIndex);
    log("3/3 koulutetaan " + batch.x.length + " feature-vektoria, malli " +
      IN + "→" + HID + "→" + names.length);
    var cases = lab.evalCases(samples);
    var before = lab.scoreParts(baseDump, cases);
    /* Rank a candidate by the archetypes first: a run that keeps them and ties
       overall beats one that trades them away for fixture accuracy. */
    var rank = function (p) { return (p.core * 2) + p.all; };
    var t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    var epochs = opts.epochs || 12;
    var tried = [];
    if (!opts.forceCPU && lab.hasWebGPU() && lab.gpuFits(init)) {
      try {
        tried.push(await lab.trainWebGPU(batch, { epochs: epochs, lr: opts.lr || 0.03, init: init }));
      } catch (err) {
        log("WebGPU epäonnistui (" + err.message + "), käytetään CPU:ta");
      }
    }
    if (!tried.length || rank(lab.scoreParts(tried[0].dump, cases)) < rank(before)) {
      tried.push(lab.trainCPU(samples, epochs));
    }
    var result = tried[0];
    var score = lab.scoreParts(result.dump, cases);
    for (var i = 1; i < tried.length; i++) {
      var s2 = lab.scoreParts(tried[i].dump, cases);
      if (rank(s2) > rank(score)) {
        score = s2;
        result = tried[i];
      }
    }
    var ms = Math.round(((typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now()) - t0);
    result.ms = ms;
    result.samples = samples.length;
    result.features = batch.x.length;
    result.score = score.all;
    result.scoreCore = score.core;
    result.scoreBefore = before.all;
    result.scoreCoreBefore = before.core;
    result.cases = cases.length;
    var pct = function (v) { return Math.round(Math.max(0, v) * 100) + "%"; };
    /* Both have to hold. Overall alone let a run memorise the sixteen fixtures
       and lose six of the eight archetypes while its total went UP. */
    if ((score.all + 1e-9 < before.all) || (score.core + 1e-9 < before.core)) {
      result.adopted = false;
      result.dump = baseDump;
      log("Hylätty: " + pct(score.all) + "/" + pct(score.core) + " < nykyinen " +
        pct(before.all) + "/" + pct(before.core) +
        " (" + cases.length + " tapausta) · " + result.backend + " · " + ms + " ms · painot ennallaan");
      return result;
    }
    result.adopted = true;
    if (typeof ErazerLayoutNet !== "undefined" && ErazerLayoutNet.adoptWeights) {
      ErazerLayoutNet.adoptWeights(result.dump);
    }
    await lab.saveModel({
      dump: result.dump,
      backend: result.backend,
      trainedAt: Date.now(),
      steps: result.steps,
      samples: samples.length
    });
    log("Malli valmis · " + result.backend + " · " + ms + " ms · " + result.features +
      " näytettä · " + pct(before.all) + " → " + pct(score.all) +
      " (arkkityypit " + pct(score.core) + ", " + cases.length +
      " tapausta) · tallennettu IndexedDB + localStorage");
    return result;
  };

  lab.downloadDump = function (dump, filename) {
    var blob = new Blob([dump], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "erazer-layout-model.txt";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  root.ErazerLayoutLab = lab;
})(typeof globalThis !== "undefined" ? globalThis : this);
