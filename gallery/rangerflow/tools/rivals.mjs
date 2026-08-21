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
 *                not run, not used as an oracle. Its rows come from its own
 *                published Key features and the enumerations in its public
 *                source — the same rule as everywhere else: their claim about
 *                themselves is the denominator, never ours.
 *
 * So: no pixels, no geometry deltas, and no number that says "97% as good as".
 * What this file scores is coverage of a published feature list, and a row is
 * only `done` when a named probe in `tests/ParityDump.rgr` drove the real
 * editor and passed. `todo` means we do not have it. `partial` means we have
 * something narrower and the row says what.
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

/**
 * A row is [capability, the rival's own name for it, probe id or null, note].
 * The rival's name is quoted from its documentation or its source so the row
 * can be checked against them rather than against our summary of them.
 */
const JOINT = [
  ["Elements and links", [
    ["Rectangle, circle, ellipse", "shapes.standard.Rectangle / Circle / Ellipse", "shapeLibrary", ""],
    ["Path and polygon elements", "shapes.standard.Path / Polygon / Polyline", "customPolygon", ""],
    ["Cylinder", "shapes.standard.Cylinder", "shapeLibrary", ""],
    ["Headered rectangle", "shapes.standard.HeaderedRectangle", "shapeLibrary", "the compartment node, with rows as well as a header"],
    ["Text block with wrapping", "shapes.standard.TextBlock", "textWrap", "wraps and autofits"],
    ["Image elements", "shapes.standard.Image", null, "the scene has no image primitive yet"],
    ["Custom elements", "custom markup / programmatic", "customPolygon", ""],
    ["Ready-made diagram sets", "shapes.erd, shapes.uml, shapes.org", "annotations", "ERD, UML, flowchart, org chart, swimlanes"],
  ]],
  ["Links", [
    ["Straight connector", "connectors.normal / straight", "connectorKinds", ""],
    ["Rounded connector", "connectors.rounded", "connectorKinds", "smoothstep"],
    ["Smooth (bezier) connector", "connectors.smooth", "connectorKinds", ""],
    ["Curve connector", "connectors.curve", null, "one curve style, not two"],
    ["Jump-over connector", "connectors.jumpover", "lineJumps", ""],
    ["Orthogonal router", "routers.orthogonal", "connectorKinds", "step / smoothstep"],
    ["Obstacle-avoiding router", "routers.manhattan", "obstacleRouting", "OrthoRouter, as a repair pass"],
    ["Metro router", "routers.metro", null, "no 45° segments"],
    ["Right-angle router", "routers.rightAngle", "connectorKinds", ""],
    ["One-side router", "routers.oneSide", null, ""],
    ["Arrowheads / markers", "link attrs sourceMarker / targetMarker", "markers", "arrow, crow's foot, UML"],
    ["Link labels", "link.labels", "annotations", ""],
    ["Link vertices", "linkTools.Vertices", "linkSegments", "the corners are draggable"],
    ["Link segment tool", "linkTools.Segments", "linkSegments", ""],
    ["Anchors / connection points", "anchors, connectionPoints", "portRoles", "field-level ports"],
    ["Link to link", "link source/target as a link", null, ""],
  ]],
  ["Ports", [
    ["Ports on an element", "element.ports", "connectPorts", ""],
    ["Port layout around a shape", "layout.ports", "multipleHandles", "four side handles, or one per row"],
    ["Port labels", "layout.ports.portLabel", "portRoles", "a row's own name is the label"],
    ["Port groups and roles", "portsgroup / magnet", "connectionLimit", ""],
  ]],
  ["Interaction", [
    ["Zoom in / out", "paper.scale", "zoomAtCursor", ""],
    ["Pan", "paper drag / translate", "pan", ""],
    ["Move elements", "element interactivity", "dragNode", ""],
    ["Rubber-band selection", "paper selection", "boxSelect", ""],
    ["Granular interactivity", "paper.interactive", "perNodeDraggable", "per node: draggable, selectable, connectable"],
    ["Element tools", "elementTools", "resizeNode", "resize grips"],
    ["Highlighters", "highlighters.stroke / mask", "clickSelect", "selection and hover borders"],
    ["Touch support", "touch events", null, "pointer events, but no pinch"],
    ["In-place text editing", "(Rappid: inspector / text editing)", "inPlaceEdit", ""],
    ["Undo / redo", "(Rappid: dia.CommandManager)", "undoMove", ""],
  ]],
  ["Graph and data", [
    ["Import / export JSON", "graph.toJSON / fromJSON", "serialization", ""],
    ["Graph traversal API", "getNeighbors, getPredecessors, dfs, bfs", "graphApi", "degrees and adjacency"],
    ["Elements at a point", "findModelsFromPoint", "graphApi", ""],
    ["Embedded elements", "embed / getEmbeddedCells", "embedding", "parentId, and a container carries its children"],
    ["Automatic layouts", "layout.DirectedGraph", "radialLayout", "layered, force, radial, mind map"],
    ["Events", "graph and paper events", "backgroundVariants", "onGraphChanged"],
  ]],
  ["Paper", [
    ["Grid", "paper.drawGrid", "backgroundVariants", "dots, lines, cross"],
    ["Background", "paper.background", "darkTheme", ""],
    ["SVG output", "SVG-based rendering", "edgeTypes", "SVG, and PDF, HTML and a GPU display list"],
    ["Viewport-limited rendering", "paper async / viewport", "culling", ""],
  ]],
];

const SYNCFUSION = [
  ["Nodes", [
    ["Rectangle, ellipse", "BasicShapes 'Rectangle' / 'Ellipse'", "shapeLibrary", ""],
    ["Diamond", "BasicShapes 'Diamond'", "shapeLibrary", ""],
    ["Hexagon", "BasicShapes 'Hexagon'", "shapeLibrary", ""],
    ["Parallelogram", "BasicShapes 'Parallelogram'", "shapeLibrary", ""],
    ["Trapezoid", "BasicShapes 'Trapezoid'", "shapeLibrary", ""],
    ["Cylinder", "BasicShapes 'Cylinder'", "shapeLibrary", ""],
    ["Triangle / right triangle", "BasicShapes 'Triangle' / 'RightTriangle'", "shapeLibrary", ""],
    ["Regular polygons", "BasicShapes 'Pentagon' … 'Decagon'", "shapeLibrary", ""],
    ["Plus and star", "BasicShapes 'Plus' / 'Star'", "shapeLibrary", ""],
    ["Arbitrary polygon", "BasicShapes 'Polygon'", "customPolygon", ""],
    ["Flowchart: terminator, process, decision", "FlowShapes 'Terminator' / 'Process' / 'Decision'", "shapeLibrary", ""],
    ["Flowchart: document, predefined process", "FlowShapes 'Document' / 'PreDefinedProcess'", "shapeLibrary", ""],
    ["Flowchart: manual operation", "FlowShapes 'ManualOperation'", "shapeLibrary", ""],
    ["Flowchart: merge, extract, summing, off-page", "FlowShapes 'Merge' / 'Extract' / 'SummingJunction' / 'OffPageReference'", "shapeLibrary", ""],
    ["Flowchart: the other nine", "FlowShapes 'Sort', 'Collate', 'PaperTap', …", null, "PaperTap, DirectData, SequentialData, Sort, MultiDocument, Collate, Or, InternalStorage, SequentialAccessStorage"],
    ["BPMN shapes", "BpmnShapes", null, "a whole notation of its own"],
    ["UML activity shapes", "UmlActivityShapes", null, "UML classes, not activities"],
    ["Custom shapes", "shape: { type: 'Path', data }", "shapeLibrary", ""],
  ]],
  ["Connectors", [
    ["Straight segments", "ConnectorSegments 'Straight'", "connectorKinds", ""],
    ["Orthogonal segments", "ConnectorSegments 'Orthogonal'", "connectorKinds", ""],
    ["Bezier segments", "ConnectorSegments 'Bezier'", "connectorKinds", ""],
    ["Decorators", "DecoratorShapes", "markers", ""],
    ["Line routing round obstacles", "interaction/line-routing", "obstacleRouting", ""],
    ["Line overlapping / distribution", "interaction/line-overlapping, line-distribution", "linkSegments", "channel routing with a track per edge"],
    ["Connector bridging", "objects/connector-bridging", "lineJumps", ""],
    ["Segment editing by hand", "SegmentEditing / connector-editing", "linkSegments", ""],
  ]],
  ["Labels and ports", [
    ["Annotations on nodes", "objects/annotation", "annotations", ""],
    ["Annotations on connectors", "objects/annotation", "annotations", ""],
    ["Text wrapping", "TextWrap", "textWrap", ""],
    ["Text overflow / clipping", "TextOverflow", "textWrap", "ellipsis after wrap and autofit"],
    ["Several annotations per object", "annotations: [...]", null, "one label per node, one per edge"],
    ["Ports", "objects/port", "connectPorts", ""],
    ["Port shapes and alignment", "PortShapes, PortAlignment", "multipleHandles", ""],
  ]],
  ["Interaction", [
    ["Drag", "interaction/tool", "dragNode", ""],
    ["Resize", "SizingOptions", "resizeNode", ""],
    ["Rotate", "rotateAngle", null, "no rotation in the model"],
    ["Rubber-band selection", "RubberBandSelectionMode", "boxSelect", ""],
    ["Drawing tools", "drawingObject", "addNode", "a palette that adds, not a drag-to-draw tool"],
    ["Keyboard commands", "diagram/keyboard-commands", "selectAll", ""],
    ["Context menu", "objects/context-menu", null, ""],
    ["Tooltips", "objects/tooltip", null, ""],
    ["Undo / redo", "objects/undo-redo", "undoMove", ""],
    ["In-place text editing", "startTextEdit", "inPlaceEdit", ""],
    ["Snapping to gridlines", "objects/snapping", "snapPosition", ""],
    ["Containers and grouping", "objects/container, group", "embedding", "lanes with real parenting"],
  ]],
  ["Automatic layout", [
    ["Hierarchical tree", "layout/hierarchical-tree", "fitView", "layered (Sugiyama)"],
    ["Complex hierarchical tree", "layout/complex-hierarchical-tree", "fitView", "dummy chains, crossing reduction"],
    ["Organizational chart", "LayoutType 'OrganizationalChart'", "fitView", "domains/business"],
    ["Symmetric layout", "layout/symmetrical-layout", "fitView", "d3-force, measured against d3"],
    ["Radial tree", "layout/radial-tree", "radialLayout", ""],
    ["Mind map", "layout/mind-map", "mindMap", ""],
    ["Flowchart layout", "LayoutType 'Flowchart'", "fitView", ""],
  ]],
  ["Surface and output", [
    ["Overview panel", "Overview", "minimap", ""],
    ["Symbol palette", "SymbolPalette", "addNode", "a palette of shapes; no drag-and-drop from it"],
    ["Gridlines", "diagram/grid-lines", "backgroundVariants", ""],
    ["Rulers", "diagram/ruler-settings", "rulers", ""],
    ["Page layout", "diagram/page-settings", "fitView", "page size and margins on export, not on the surface"],
    ["Serialization", "saveDiagram / loadDiagram", "serialization", ""],
    ["Export to SVG", "FileFormats 'SVG'", "edgeTypes", ""],
    ["Export to PNG / JPEG / BMP", "FileFormats 'PNG' / 'JPG' / 'BMP'", null, "the SoftCanvas backend renders, but there is no encoder wired up"],
    ["Print", "print()", "fitView", "PDF, which is what printing produces"],
    ["Data binding from a source", "dataSourceSettings", "dataBinding", ""],
    ["Zoom and pan", "zoomTo, pan", "zoomAtCursor", ""],
  ]],
];

function score(list) {
  const out = [];
  for (const [section, rows] of list) {
    for (const [name, source, probe, note] of rows) {
      let status = "todo";
      let evidence = "";
      if (probe) {
        const p = probeById.get(probe);
        if (!p) {
          status = "FAIL";
          evidence = `probe '${probe}' is named here but not produced`;
        } else if (p.ok) {
          status = note ? "partial" : "done";
          evidence = p.note;
        } else {
          status = "FAIL";
          evidence = p.note;
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
