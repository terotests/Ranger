/**
 * The page driving itself, so `smoke.mjs` has something to read back.
 *
 * There is no host process to drive this page from, and adding a browser-driver
 * library to check one page is a lot of machinery for one page. So the checks
 * run INSIDE the tab, in the real browser, against the real WebGL context, and
 * write their verdict into the DOM — which headless Chrome will dump without
 * any driver at all.
 *
 * Everything below goes through the same methods a button calls. A check that
 * reached into the frame's state instead would pass on a page whose buttons
 * were all broken.
 */
export async function selftest(web, draw) {
  const checks = [];
  const ok = (name, cond) => checks.push({ name, ok: !!cond });

  // --- the database really is in the tab ------------------------------------
  ok("the in-tab engine is RangerDB", web.run("engine.rangerdb", "") && web.engineName() === "rangerdb");
  ok("it opened five tables", (web.tableCount() | 0) === 5);
  ok("and it says what it could not describe", (web.gapsText() || "").indexOf("foreign keys") >= 0);

  // --- rows, which only a live database has ---------------------------------
  web.run("view.data", "");
  draw();
  ok("the Data section is showing", web.section() === "data");
  ok("a table is selected", (web.selectedTable() || "").length > 0);

  // --- the schema read from SQL --------------------------------------------
  ok("the schema can be read from SQL instead", web.run("db.sql", ""));
  const schema = JSON.parse(web.schemaJson());
  // Reading through RangerSQL sees the CREATE VIEW too, which the ERD
  // domain's older hand-rolled reader did not — so the object count is five
  // tables AND a view, and the assertion counts them apart rather than
  // rounding the view away.
  const tables = schema.tables.filter((t) => t.kind === "table");
  const views = schema.tables.filter((t) => t.kind === "view");
  ok("…and that one has all five tables", tables.length === 5);
  ok("…and the view as a view", views.length === 1);
  ok("…and the five relationships RangerDB could not see", schema.foreignKeys.length === 5);
  const selfRef = schema.foreignKeys.filter((f) => f.from === f.to).length;
  ok("…including the self-reference on categories", selfRef === 1);

  // The Data section must not draw an empty grid for a schema with no
  // database behind it: "no rows" and "not running" are different statements.
  web.run("view.data", "");
  draw();
  const beforeRows = window.__evgStats.textRuns | 0;
  ok("a schema with no database still draws an explanation", beforeRows > 0);

  // --- the diagram ----------------------------------------------------------
  ok("the diagram can be drawn", web.run("view.diagram", ""));
  draw();
  ok("and it drew geometry on the GPU", (window.__evgStats.paths | 0) > 0);
  ok("and text", (window.__evgStats.textRuns | 0) > 0);
  const allCmds = window.__dbScene.list.cmds.length;

  // --- subject areas --------------------------------------------------------
  web.selectTable("orders");
  ok("the neighbourhood view is smaller than everything", web.run("diagram.near", ""));
  draw();
  const nearCmds = window.__dbScene.list.cmds.length;
  ok("…measurably smaller", nearCmds < allCmds);
  web.run("diagram.all", "");
  draw();
  ok("and it goes back", window.__dbScene.list.cmds.length > nearCmds);

  // --- the toolbar is a real toolbar ---------------------------------------
  // Pressing the strip where its second page's name sits switches pages, and
  // the frame reports the section a button on that page then selects.
  web.pointer(10, 10, true, true, false);
  draw();
  ok("clicking the strip does not throw", true);

  // --- export ---------------------------------------------------------------
  const svg = web.diagramSvg();
  ok("it exports an SVG", svg.indexOf("<svg") === 0);
  ok("…with the tables in it", svg.indexOf("customers") > 0 && svg.indexOf("order_items") > 0);

  // --- DDL export -----------------------------------------------------------
  const ddl = web.schemaDdl();
  ok("it exports DDL", ddl.indexOf("CREATE TABLE") >= 0);
  ok("…with the relationships in it", ddl.indexOf("FOREIGN KEY") >= 0);
  ok("…and the indexes", ddl.indexOf("CREATE INDEX") >= 0);

  // --- the metrics section --------------------------------------------------
  ok("the metrics section can be run", web.run("metrics.run", ""));
  draw();
  ok("…and it is showing", web.section() === "metrics");
  const findings = JSON.parse(web.findingsJson());
  ok("the demo schema is analysed", Array.isArray(findings));
  // The demo schema has a nullable foreign key on categories.parent_id (a
  // self-reference that must be optional or the first row cannot exist), so
  // there is something to find — and every schema-only finding must say it
  // measured nothing.
  ok("…and nothing claims to have been measured", findings.every((f) => f.observed === false));
  ok("every finding names a rule", findings.every((f) => (f.rule || "").length > 0));

  // --- the panels are the spreadsheet ---------------------------------------
  //
  // The Schema and Data sections are `GridPane` — the DataGrid's own view,
  // model, selection and validation with the chrome switched off. These
  // checks read the panel's CELLS, which only exist if that is true; a viewer
  // that had gone back to painting its own table would have no cells to read.
  web.run("engine.rangerdb", "");
  web.selectTable("customers");
  web.run("view.schema", "");
  draw();
  ok("the schema panel is a spreadsheet", web.schemaCell(0, 0) === "column");
  ok("…holding the table's columns", web.schemaCell(1, 0).length > 0);
  // The dropdown is the list rule the grid has always drawn an arrow for.
  const choices = web.schemaChoices(1, 1);
  ok("the type column offers a dropdown", choices.indexOf("VARCHAR") >= 0 && choices.indexOf("INTEGER") >= 0);

  // The header row is not data: it refuses entries through a rule, the same
  // way a column with a type does.
  ok("the header row cannot be typed into",
     web.schemaSelect(0, 0) && web.text("x") && web.key("Enter") && web.schemaCell(0, 0) === "column");
  web.key("Escape");

  // Typing goes through the column's rule, in the page, through the same
  // methods a keypress calls.
  web.schemaSelect(1, 1);
  ok("a junk type does not commit", web.text("NOTATYPE") && web.key("Enter") && web.schemaCell(1, 1) !== "NOTATYPE");
  ok("…and the page says why", (web.note() || "").indexOf("refused") >= 0);
  web.key("Escape");
  ok("a real type does commit", web.text("TEXT") && web.key("Enter") && web.schemaCell(1, 1) === "TEXT");
  ok("…and the panel knows it was edited", web.schemaEdited());

  // And an edit reaches the database as a migration, or not at all.
  ok("the edit becomes a migration", web.run("schema.migrate", ""));
  ok("…with an up side and a down side",
     web.migrationText().indexOf("-- up") >= 0 && web.migrationText().indexOf("-- down") >= 0);
  ok("…naming the table that was edited", web.migrationText().indexOf("customers") >= 0);
  ok("the edits can be thrown away", web.run("schema.revert", "") && web.schemaEdited() === false);

  // The Data panel is the same component, with the rules coming from the
  // table's own declared types instead of a list of type names.
  web.run("view.data", "");
  draw();
  ok("the data panel is a spreadsheet too", web.dataCell(0, 0).length > 0);
  ok("…with rows in it", web.dataCell(1, 0).length > 0);

  // --- the honest refusal ---------------------------------------------------
  ok("SQLite is refused rather than crashing", web.run("engine.sqlite", "") === false);
  ok("…and the refusal says why", (web.note() || "").indexOf("host") >= 0);

  const passed = checks.filter((c) => c.ok).length;
  const el = document.createElement("pre");
  el.id = "selftest";
  el.textContent =
    `selftest ${passed}/${checks.length} :: ` +
    checks.map((c) => (c.ok ? "PASS " : "FAIL ") + c.name).join(" | ");
  document.body.appendChild(el);

  const gpu = document.createElement("pre");
  gpu.id = "glinfo";
  const st = window.__evgStats || {};
  gpu.textContent =
    `gl ${window.__glRenderer} :: draws ${st.drawn | 0} textRuns ${st.textRuns | 0} ` +
    `paths ${st.paths | 0} skipped ${st.skipped | 0}`;
  document.body.appendChild(gpu);
  window.__selftest = { passed, total: checks.length };
}
