/**
 * rivals.mjs — RangerFlow against JointJS and Syncfusion Diagram.
 *
 *   npm run rangerflow:rivals
 *
 * The React Flow meter next door can compute its reference answers: React Flow
 * is MIT, it is on npm, and `harness/oracles/reactflow_oracle.mjs` asks its own
 * functions the questions RangerFlow is asked. Neither rival here works that
 * way, and pretending otherwise would be the dishonest part:
 *
 *   JointJS      MPL-2.0, on npm as `@joint/core`. Runnable, and a geometry
 *                oracle for its routers would be possible — but the families
 *                worth comparing that way (bezier, orthogonal, viewport
 *                algebra) are already measured against React Flow, and a
 *                second oracle over the same ground would add rows without
 *                adding evidence. So this scorecard is a FEATURE comparison.
 *   Syncfusion   commercial ("SEE LICENSE IN license" on npm). Not installed,
 *                not run, and not used as an oracle. Its rows come from its own
 *                published Key features and the enumerations in its public
 *                source — the same rule as everywhere else: their claim about
 *                themselves is the denominator, never ours.
 *
 * So: no pixels, no geometry deltas, and no number that says "97% as good as".
 * What this file scores is coverage of a published feature list.
 *
 * A row is
 *
 *     [capability, the rival's own name for it, probe id or null, note, status]
 *
 * and the **status is written down**, not inferred. It used to be inferred —
 * a row with a probe and a note scored `partial`, a row with a probe and no
 * note scored `done` — and that was quietly wrong in both directions. Half
 * these notes say what our version is called rather than what it lacks
 * ("smoothstep", "layered (Sugiyama)"), and scoring those as half a feature
 * understated the thing; meanwhile a row could carry a real limitation in its
 * note and still read as whole if someone deleted the note. So the judgement
 * is now a field, one word, sitting next to the evidence for it:
 *
 *     done      we have the capability the row names.
 *     partial   we have something narrower, and the note says what is missing.
 *     todo      we do not have it.
 *
 * The probe still has to back it up: `done` and `partial` both require a named
 * probe in `tests/ParityDump.rgr` that drove the real editor and passed, and
 * this file fails loudly if one is missing, fails, or is claimed without being
 * named. What a written-down status cannot do is stop someone writing `done`
 * next to a probe that does not really test the row — which is why the probe
 * id is printed in the table beside it, for a reader to check.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "RIVALS.md");

const ranger = JSON.parse(fs.readFileSync(path.join(OUT, "rangerflow.json"), "utf8"));
const probeById = new Map((ranger.probes || []).map((p) => [p.id, p]));

const D = "done", P = "partial", T = "todo";

const JOINT = [
  ["Elements and links", [
    ["Rectangle, circle, ellipse", "shapes.standard.Rectangle / Circle / Ellipse", "shapeLibrary", "", D],
    ["Path and polygon elements", "shapes.standard.Path / Polygon / Polyline", "customPolygon", "", D],
    ["Cylinder", "shapes.standard.Cylinder", "shapeLibrary", "", D],
    ["Headered rectangle", "shapes.standard.HeaderedRectangle", "shapeLibrary", "the compartment node, with rows as well as a header", D],
    ["Text block with wrapping", "shapes.standard.TextBlock", "textWrap", "wraps and autofits", D],
    ["Image elements", "shapes.standard.Image", null, "the scene has no image primitive yet", T],
    ["Custom elements", "custom markup / programmatic", "customPolygon", "", D],
    ["Ready-made diagram sets", "shapes.erd, shapes.uml, shapes.org", "annotations", "ERD, UML, flowchart, org chart, swimlanes", D],
  ]],
  ["Links", [
    ["Straight connector", "connectors.normal / straight", "connectorKinds", "", D],
    ["Rounded connector", "connectors.rounded", "connectorKinds", "smoothstep", D],
    ["Smooth (bezier) connector", "connectors.smooth", "connectorKinds", "", D],
    ["Curve connector", "connectors.curve", "curveConnector", "a spline through the link's vertices, with a tension", D],
    ["Jump-over connector", "connectors.jumpover", "lineJumps", "", D],
    ["Orthogonal router", "routers.orthogonal", "connectorKinds", "step / smoothstep", D],
    ["Obstacle-avoiding router", "routers.manhattan", "obstacleRouting", "OrthoRouter, as a repair pass", D],
    ["Metro router", "routers.metro", "metroRouter", "", D],
    ["Right-angle router", "routers.rightAngle", "connectorKinds", "", D],
    ["One-side router", "routers.oneSide", "oneSideRouter", "", D],
    ["Arrowheads / markers", "link attrs sourceMarker / targetMarker", "markers", "arrow, crow's foot, UML", D],
    ["Link labels", "link.labels", "annotations", "", D],
    ["Link vertices", "linkTools.Vertices", "linkSegments", "the corners are draggable", D],
    ["Link segment tool", "linkTools.Segments", "linkSegments", "", D],
    ["Anchors / connection points", "anchors, connectionPoints", "portRoles", "field-level ports", D],
    ["Link to link", "link source/target as a link", null, "an edge can only end on a node", T],
  ]],
  ["Ports", [
    ["Ports on an element", "element.ports", "connectPorts", "", D],
    ["Port layout around a shape", "layout.ports", "multipleHandles", "sides and rows, but no radial or elliptic layout", P],
    ["Port labels", "layout.ports.portLabel", "portRoles", "a row's own name is the label", D],
    ["Port groups and roles", "portsgroup / magnet", "connectionLimit", "", D],
  ]],
  ["Interaction", [
    ["Zoom in / out", "paper.scale", "zoomAtCursor", "", D],
    ["Pan", "paper drag / translate", "pan", "", D],
    ["Move elements", "element interactivity", "dragNode", "", D],
    ["Rubber-band selection", "paper selection", "boxSelect", "", D],
    ["Granular interactivity", "paper.interactive", "perNodeDraggable", "per node: draggable, selectable, connectable", D],
    ["Element tools", "elementTools", "elementTools", "resize grips, a remove button and a connect button", D],
    ["Highlighters", "highlighters.stroke / mask", "highlighters", "stroke, mask and opacity, on top of selection and hover", D],
    ["Touch support", "touch events", "pinchZoom", "pointer events and pinch to zoom", D],
    ["In-place text editing", "(Rappid: inspector / text editing)", "inPlaceEdit", "", D],
    ["Undo / redo", "(Rappid: dia.CommandManager)", "undoMove", "", D],
  ]],
  ["Graph and data", [
    ["Import / export JSON", "graph.toJSON / fromJSON", "serialization", "", D],
    ["Graph traversal API", "getNeighbors, getPredecessors, dfs, bfs", "graphWalk", "", D],
    ["Elements at a point", "findModelsFromPoint", "graphApi", "", D],
    ["Embedded elements", "embed / getEmbeddedCells", "embedding", "parentId, and a container carries its children", D],
    ["Automatic layouts", "layout.DirectedGraph", "radialLayout", "layered, force, radial, mind map", D],
    ["Events", "graph and paper events", "backgroundVariants", "one change callback, not a named event per kind", P],
  ]],
  ["Paper", [
    ["Grid", "paper.drawGrid", "backgroundVariants", "dots, lines, cross", D],
    ["Background", "paper.background", "darkTheme", "", D],
    ["SVG output", "SVG-based rendering", "edgeTypes", "SVG, and PDF, HTML and a GPU display list", D],
    ["Viewport-limited rendering", "paper async / viewport", "culling", "", D],
  ]],
];

const SYNCFUSION = [
  ["Nodes", [
    ["Rectangle, ellipse", "BasicShapes 'Rectangle' / 'Ellipse'", "shapeLibrary", "", D],
    ["Diamond", "BasicShapes 'Diamond'", "shapeLibrary", "", D],
    ["Hexagon", "BasicShapes 'Hexagon'", "shapeLibrary", "", D],
    ["Parallelogram", "BasicShapes 'Parallelogram'", "shapeLibrary", "", D],
    ["Trapezoid", "BasicShapes 'Trapezoid'", "shapeLibrary", "", D],
    ["Cylinder", "BasicShapes 'Cylinder'", "shapeLibrary", "", D],
    ["Triangle / right triangle", "BasicShapes 'Triangle' / 'RightTriangle'", "shapeLibrary", "", D],
    ["Regular polygons", "BasicShapes 'Pentagon' … 'Decagon'", "shapeLibrary", "", D],
    ["Plus and star", "BasicShapes 'Plus' / 'Star'", "shapeLibrary", "", D],
    ["Arbitrary polygon", "BasicShapes 'Polygon'", "customPolygon", "", D],
    ["Flowchart: terminator, process, decision", "FlowShapes 'Terminator' / 'Process' / 'Decision'", "shapeLibrary", "", D],
    ["Flowchart: document, predefined process", "FlowShapes 'Document' / 'PreDefinedProcess'", "shapeLibrary", "", D],
    ["Flowchart: manual operation", "FlowShapes 'ManualOperation'", "shapeLibrary", "", D],
    ["Flowchart: merge, extract, summing, off-page", "FlowShapes 'Merge' / 'Extract' / 'SummingJunction' / 'OffPageReference'", "shapeLibrary", "", D],
    ["Flowchart: the other nine", "FlowShapes 'Sort', 'Collate', 'PaperTap', …", "isoFlowShapes", "", D],
    ["BPMN shapes", "BpmnShapes", null, "a whole notation of its own", T],
    ["UML activity shapes", "UmlActivityShapes", "umlActivity", "actions, fork and join, signals, timer, initial and final", D],
    ["Custom shapes", "shape: { type: 'Path', data }", "shapeLibrary", "", D],
  ]],
  ["Connectors", [
    ["Straight segments", "ConnectorSegments 'Straight'", "connectorKinds", "", D],
    ["Orthogonal segments", "ConnectorSegments 'Orthogonal'", "connectorKinds", "", D],
    ["Bezier segments", "ConnectorSegments 'Bezier'", "connectorKinds", "", D],
    ["Decorators", "DecoratorShapes", "markers", "", D],
    ["Line routing round obstacles", "interaction/line-routing", "obstacleRouting", "", D],
    ["Line overlapping / distribution", "interaction/line-overlapping, line-distribution", "linkSegments", "channel routing with a track per edge", D],
    ["Connector bridging", "objects/connector-bridging", "lineJumps", "", D],
    ["Segment editing by hand", "SegmentEditing / connector-editing", "linkSegments", "", D],
  ]],
  ["Labels and ports", [
    ["Annotations on nodes", "objects/annotation", "annotations", "", D],
    ["Annotations on connectors", "objects/annotation", "annotations", "", D],
    ["Text wrapping", "TextWrap", "textWrap", "", D],
    ["Text overflow / clipping", "TextOverflow", "textWrap", "ellipsis after wrap and autofit", D],
    ["Several annotations per object", "annotations: [...]", "multipleAnnotations", "", D],
    ["Ports", "objects/port", "connectPorts", "", D],
    ["Port shapes and alignment", "PortShapes, PortAlignment", "multipleHandles", "", D],
  ]],
  ["Interaction", [
    ["Drag", "interaction/tool", "dragNode", "", D],
    ["Resize", "SizingOptions", "resizeNode", "", D],
    ["Rotate", "rotateAngle", "rotation", "the outline, hit test and ports turn; the text stays upright", P],
    ["Rubber-band selection", "RubberBandSelectionMode", "boxSelect", "", D],
    ["Drawing tools", "drawingObject", "addNode", "a palette that adds, not a drag-to-draw tool", P],
    ["Keyboard commands", "diagram/keyboard-commands", "selectAll", "", D],
    ["Context menu", "objects/context-menu", "contextMenu", "", D],
    ["Tooltips", "objects/tooltip", "tooltips", "", D],
    ["Undo / redo", "objects/undo-redo", "undoMove", "", D],
    ["In-place text editing", "startTextEdit", "inPlaceEdit", "", D],
    ["Snapping to gridlines", "objects/snapping", "snapPosition", "", D],
    ["Containers and grouping", "objects/container, group", "embedding", "lanes with real parenting", D],
  ]],
  ["Automatic layout", [
    ["Hierarchical tree", "layout/hierarchical-tree", "layeredLayout", "layered (Sugiyama)", D],
    ["Complex hierarchical tree", "layout/complex-hierarchical-tree", "longEdgeChain", "dummy chains, crossing reduction", D],
    ["Organizational chart", "LayoutType 'OrganizationalChart'", "orgChartLayout", "domains/business", D],
    ["Symmetric layout", "layout/symmetrical-layout", "forceLayout", "d3-force, measured against d3", D],
    ["Radial tree", "layout/radial-tree", "radialLayout", "", D],
    ["Mind map", "layout/mind-map", "mindMap", "", D],
    ["Flowchart layout", "LayoutType 'Flowchart'", "flowchartLayout", "", D],
  ]],
  ["Surface and output", [
    ["Overview panel", "Overview", "minimap", "", D],
    ["Symbol palette", "SymbolPalette", "addNode", "a palette of shapes; nothing is dragged out of it", P],
    ["Gridlines", "diagram/grid-lines", "backgroundVariants", "", D],
    ["Rulers", "diagram/ruler-settings", "rulers", "", D],
    ["Page layout", "diagram/page-settings", "fitView", "page size and margins on export, but no page drawn on the surface", P],
    ["Serialization", "saveDiagram / loadDiagram", "serialization", "", D],
    ["Export to SVG", "FileFormats 'SVG'", "edgeTypes", "", D],
    ["Export to PNG / JPEG / BMP", "FileFormats 'PNG' / 'JPG' / 'BMP'", null, "the SoftCanvas backend renders, but there is no encoder wired up", T],
    ["Print", "print()", "fitView", "PDF, which is what printing produces", D],
    ["Data binding from a source", "dataSourceSettings", "dataBinding", "", D],
    ["Zoom and pan", "zoomTo, pan", "zoomAtCursor", "", D],
  ]],
];

function score(list) {
  const out = [];
  for (const [section, rows] of list) {
    for (const [name, source, probe, note, claimed] of rows) {
      let status = claimed;
      let evidence = "";
      if (claimed !== "todo" && !probe) {
        status = "FAIL";
        evidence = `claims '${claimed}' but names no probe`;
      } else if (probe) {
        const p = probeById.get(probe);
        if (!p) {
          status = "FAIL";
          evidence = `probe '${probe}' is named here but not produced`;
        } else if (!p.ok) {
          status = "FAIL";
          evidence = p.note;
        } else {
          evidence = p.note;
          // A `todo` row with a passing probe is a row somebody forgot to
          // promote. Say so rather than scoring it as a gap for ever.
          if (claimed === "todo") {
            status = "FAIL";
            evidence = `probe '${probe}' passes but the row still says todo`;
          }
        }
      }
      out.push({ section, name, source, probe, note, status, evidence });
    }
  }
  return out;
}

// A partial row counts as half. Whether that is the right weight is a
// judgement, so it is stated rather than buried: the alternative is scoring a
// "we have something narrower" as either a lie or a zero.
function pct(rows) {
  const n = rows.length;
  const v = rows.reduce((a, r) => a + (r.status === "done" ? 1 : r.status === "partial" ? 0.5 : 0), 0);
  return { value: v, n, pct: n ? (v / n) * 100 : 0 };
}

const jointRows = score(JOINT);
const syncRows = score(SYNCFUSION);
const failing = [...jointRows, ...syncRows].filter((r) => r.status === "FAIL");

const bar = (p) => {
  const filled = Math.round((p / 100) * 24);
  return "█".repeat(filled) + "·".repeat(24 - filled);
};

function report(title, rows) {
  const t = pct(rows);
  console.log("");
  console.log(`  ${title}`);
  for (const [section] of (title.startsWith("JointJS") ? JOINT : SYNCFUSION)) {
    const sr = rows.filter((r) => r.section === section);
    const s = pct(sr);
    console.log(
      `    ${section.padEnd(22)} ${bar(s.pct)} ${String(s.value).padStart(5)}/${String(s.n).padEnd(3)} ${s.pct.toFixed(0)}%`
    );
  }
  console.log(`    ${"overall".padEnd(22)} ${bar(t.pct)} ${String(t.value).padStart(5)}/${String(t.n).padEnd(3)} ${t.pct.toFixed(0)}%`);
  return t;
}

console.log("RangerFlow against the other two — gallery/rangerflow");
console.log("=".repeat(70));
console.log("  no oracle: JointJS is MPL-2.0 and runnable, Syncfusion is commercial.");
console.log("  These are FEATURE lists, published by each library about itself.");
const jt = report("JointJS 4 (@joint/core, MPL-2.0)", jointRows);
const st = report("Syncfusion EJ2 Diagram (commercial)", syncRows);
console.log("");
if (failing.length) {
  for (const f of failing) console.error(`  PROBE PROBLEM  ${f.name}: ${f.evidence}`);
}

const lines = [];
lines.push("# JointJS and Syncfusion — measured");
lines.push("");
lines.push("**Generated by `npm run rangerflow:rivals`. Do not edit by hand.**");
lines.push("");
lines.push("[`PARITY.md`](PARITY.md) can compute its reference answers: React Flow is MIT,");
lines.push("it is on npm, and the harness asks **its own functions** the questions");
lines.push("RangerFlow is asked. Neither library here works that way, and pretending");
lines.push("otherwise would be the dishonest part.");
lines.push("");
lines.push("| | Licence | Oracle | What is scored |");
lines.push("| --- | --- | --- | --- |");
lines.push("| React Flow | MIT | **yes** — `@xyflow/system` computes the reference geometry | pixels of difference, and behaviour |");
lines.push("| JointJS 4 | MPL-2.0 | possible, not built | its published feature list |");
lines.push("| Syncfusion EJ2 | commercial | **no** — not installed, not run | its published feature list |");
lines.push("");
lines.push("Syncfusion's npm package says `SEE LICENSE IN license`. It is not installed");
lines.push("here, not run, and not used to compute anything. Its rows are quoted from its");
lines.push("own **Key features** list and the enumerations in its public source, because");
lines.push("the denominator has to be their claim about themselves rather than ours.");
lines.push("");
lines.push("For JointJS an oracle *would* be possible. It is not built because the");
lines.push("families worth comparing that way — bezier, orthogonal, viewport algebra —");
lines.push("are already measured against React Flow to two thousandths of a pixel, and a");
lines.push("second oracle over the same ground would add rows without adding evidence.");
lines.push("");
lines.push("**How to read a row.** `done` requires a named probe in `tests/ParityDump.rgr`");
lines.push("that drove the real `FlowEditor` and passed. `partial` means we have something");
lines.push("narrower and the row says what. `todo` means we do not have it — there is no");
lines.push("row here that means \"probably fine\".");
lines.push("");
lines.push("A `partial` counts as half. Whether that is the right weight is a judgement,");
lines.push("so it is stated rather than buried: the alternative is scoring \"we have");
lines.push("something narrower\" as either a lie or a zero.");
lines.push("");

function table(heading, list, rows, colName) {
  const t = pct(rows);
  lines.push(`## ${heading} — ${t.value}/${t.n} (${t.pct.toFixed(0)}%)`);
  lines.push("");
  for (const [section] of list) {
    const sr = rows.filter((r) => r.section === section);
    const s = pct(sr);
    lines.push(`### ${section} — ${s.value}/${s.n}`);
    lines.push("");
    lines.push(`| Capability | ${colName} | Status | Probe | Note |`);
    lines.push("| --- | --- | --- | --- | --- |");
    for (const r of sr) {
      const mark = r.status === "done" ? "✓ done"
        : r.status === "partial" ? "~ partial"
        : r.status === "FAIL" ? "**✗ FAIL**" : "· todo";
      lines.push(`| ${r.name} | \`${r.source}\` | ${mark} | ${r.probe ? "`" + r.probe + "`" : "—"} | ${r.note} |`);
    }
    lines.push("");
  }
  return t;
}

table("JointJS 4", JOINT, jointRows, "JointJS");
table("Syncfusion EJ2 Diagram", SYNCFUSION, syncRows, "Syncfusion");

lines.push("## What this does not measure");
lines.push("");
lines.push("- **Quality inside a row.** \"Obstacle-avoiding router: done\" says we have one");
lines.push("  and that a probe proves it routes round a box. It does not say ours is as");
lines.push("  good as `routers.manhattan` on a diagram of five hundred nodes.");
lines.push("- **Anything either library has that is not on its own published list.** Both");
lines.push("  are far larger than their feature bullets; the bullets are what they chose to");
lines.push("  be judged on.");
lines.push("- **The commercial half of JointJS.** Rappid adds an inspector, a command");
lines.push("  manager, stencils and more; rows quoting it are marked in the source column.");
lines.push("- **Ecosystem.** Framework wrappers, support contracts, demo galleries and");
lines.push("  documentation are most of what is being bought and none of what is here.");
lines.push("");

fs.writeFileSync(DOC, lines.join("\n"));
console.log(`  wrote ${path.relative(process.cwd(), DOC)}`);
if (failing.length) process.exit(1);
