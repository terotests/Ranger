// ============================================================================
// main.ts — the demo. Run it with:  npm run demo
//
// It drives the same Ranger model twice: once against DuckDB, once against a
// database that does not exist. The model is not told which is which, and the
// rendered output is produced by the same Ranger view-model builder both times.
// ============================================================================

import { createNotesApp, type NotesApp } from "./app.js";
import { DuckDBDatabase } from "./adapters/duckdbDatabase.js";
import { FakeDatabase } from "./adapters/fakeDatabase.js";
import type { DatabaseCapability } from "./runtime/capabilities.js";

const NOTES = [
  { id: 1, title: "Effects", body: "I/O is described, not performed", tag: "core" },
  { id: 2, title: "Scopes", body: "Every task has a lifecycle owner", tag: "core" },
  { id: 3, title: "Capabilities", body: "No grant, no socket", tag: "security" },
  { id: 4, title: "Streams", body: "Zero to n values over time", tag: "core" },
  { id: 5, title: "Staleness", body: "Newer questions win", tag: "ui" },
];

function banner(text: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(text);
  console.log("=".repeat(70));
}

async function drive(app: NotesApp, label: string): Promise<void> {
  banner(label);

  app.send((p) => p.onOpen());
  await app.idle();
  console.log(app.render());

  console.log("-- search: scope ------------------------------------------------");
  app.send((p) => p.onSearch("scope"));
  await app.idle();
  console.log(app.render());

  console.log("-- three queries at once ----------------------------------------");
  app.send((p) => p.onLoadStats());
  console.log(`in flight before any answer: ${app.runtime.pendingCount}`);
  await app.idle();
  console.log(
    `count=${app.page.total} shortest=${app.page.shortest} longest=${app.page.longest}`,
  );

  console.log("-- stream in chunks of 2 ---------------------------------------");
  app.send((p) => p.onStreamAll(2));
  await app.idle();
  console.log(`${app.page.streamChunks} chunks, ${app.page.streamRows} rows`);

  console.log("-- ask for a capability nobody granted --------------------------");
  app.send((p) => p.onTryForbidden());
  await app.idle();
  console.log(`denied: ${app.page.deniedCount}  (${app.page.errorText})`);

  console.log("-- close the page while a query is running ----------------------");
  app.send((p) => p.onSearch("owner"));
  console.log(`in flight: ${app.runtime.pendingCount}`);
  app.stop();
  await new Promise((r) => setTimeout(r, 200));
  console.log(
    `after stop: in flight ${app.runtime.pendingCount}, ` +
      `dropped ${app.runtime.trace.filter((t) => t.kind === "drop").length}`,
  );

  await app.dispose();
}

function fakeDb(): DatabaseCapability {
  const db = new FakeDatabase();
  db.on("CREATE TABLE", () => []);
  db.on("INSERT INTO", () => ({ rows: [], rowCount: NOTES.length }));
  db.on("SELECT count(*)", () => [{ n: NOTES.length }]);
  db.on("SELECT min(", () => [{ n: Math.min(...NOTES.map((n) => n.body.length)) }]);
  db.on("SELECT max(", () => [{ n: Math.max(...NOTES.map((n) => n.body.length)) }]);
  db.on("FROM notes ORDER BY id", () => NOTES, { delayMs: 20 });
  db.on(
    "WHERE title ILIKE",
    ({ args }) => {
      const needle = (args[0] ?? "").replace(/%/g, "").toLowerCase();
      return NOTES.filter(
        (n) =>
          n.title.toLowerCase().includes(needle) ||
          n.body.toLowerCase().includes(needle),
      );
    },
    { delayMs: 20 },
  );
  return db;
}

async function main(): Promise<void> {
  const duck = await DuckDBDatabase.open({ path: ":memory:", poolSize: 4 });
  await drive(createNotesApp({ db: duck }), "DuckDB — a real database");
  console.log(`peak connections busy at once: ${duck.peakConcurrency}`);

  await drive(
    createNotesApp({ db: fakeDb() }),
    "FakeDatabase — the same model, no database at all",
  );

  banner("Same model, same view models, two completely different backends.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
