// ============================================================================
// duckdb.test.ts — the same model, against a database that really exists.
//
// tests/io-effects.test.ts (repo root) pins the semantics using a scripted
// adapter and no dependencies. This file re-runs the interesting half of that
// contract against DuckDB, because a contract only a fake can satisfy is not a
// contract. Nothing in ranger/notes_model.rgr changes between the two.
// ============================================================================

import { describe, it, expect, afterEach } from "vitest";

import { createNotesApp, type NotesApp } from "../src/app.js";
import { DuckDBDatabase } from "../src/adapters/duckdbDatabase.js";

let app: NotesApp | null = null;
let db: DuckDBDatabase | null = null;

afterEach(async () => {
  await app?.dispose();
  app = null;
  db = null;
});

async function openApp(poolSize = 4): Promise<NotesApp> {
  db = await DuckDBDatabase.open({ path: ":memory:", poolSize });
  app = createNotesApp({ db });
  app.send((p) => p.onOpen());
  await app.idle();
  return app;
}

describe("DuckDB as a granted capability", () => {
  it("runs the schema -> seed -> list chain end to end", async () => {
    const a = await openApp();

    expect(a.page.phase).toBe("ready");
    expect(a.page.notes).toHaveLength(5);
    expect(a.page.notes[0].title).toBe("Effects");
    expect(a.page.notes[2].tag).toBe("security");
    expect(a.runtime.traceLabels("resolve")).toEqual(["schema", "seed", "search"]);
  });

  it("binds parameters instead of splicing them into SQL", async () => {
    const a = await openApp();

    a.send((p) => p.onSearch("owner"));
    await a.idle();

    expect(a.page.notes.map((n) => n.title)).toEqual(["Scopes"]);

    // A value that would end the string literal if it were interpolated.
    a.send((p) => p.onSearch("'; DROP TABLE notes; --"));
    await a.idle();

    expect(a.page.notes).toHaveLength(0);
    expect(a.page.phase).toBe("ready");

    a.send((p) => p.onListAll());
    await a.idle();
    expect(a.page.notes).toHaveLength(5); // the table is still there
  });

  it("really overlaps the fanned-out queries", async () => {
    const a = await openApp(4);

    a.send((p) => p.onLoadStats());
    expect(a.runtime.pendingCount).toBe(3);
    await a.idle();

    expect(a.page.total).toBe(5);
    expect(a.page.shortest).toBeGreaterThan(0);
    expect(a.page.longest).toBeGreaterThanOrEqual(a.page.shortest);
    // More than one connection was busy at the same moment: the concurrency is
    // in the database, not simulated by the runtime.
    expect(db!.peakConcurrency).toBeGreaterThan(1);
  });

  it("streams a result set in chunks, the last one closing the stream", async () => {
    const a = await openApp();

    a.send((p) => p.onStreamAll(2));
    await a.idle();

    // Same 3 chunks as the fake adapter produces: chunkSize is honoured by the
    // adapter, not left to whatever vector size DuckDB happens to return.
    expect(a.page.streamRows).toBe(5);
    expect(a.page.streamChunks).toBe(3);
    expect(a.page.phase).toBe("ready");
    expect(a.page.inFlight).toBe(0);
  });

  it("interrupts a running query when its scope dies", async () => {
    db = await DuckDBDatabase.open({ path: ":memory:", poolSize: 2 });
    app = createNotesApp({ db });
    app.send((p) => p.onOpen());
    await app.idle();

    // A query long enough to still be running when the owner stops.
    app.send((p) => {
      const q = (p as any).queue();
      q.query(p.__rangerPath, "SELECT count(*) AS n FROM range(4000000000)", [], p.epoch, "slow");
    });
    expect(app.runtime.pendingCount).toBe(1);

    const before = app.page.total;
    app.stop();

    await new Promise((r) => setTimeout(r, 400));

    // The process never heard back, and the query did not keep a thread busy
    // for the rest of the run.
    expect(app.page.total).toBe(before);
    expect(app.runtime.pendingCount).toBe(0);
    expect(app.runtime.trace.some((t) => t.kind === "drop")).toBe(true);
  });

  it("refuses an ungranted capability without reaching DuckDB", async () => {
    const a = await openApp();
    const resolvedBefore = a.runtime.traceLabels("resolve").length;

    a.send((p) => p.onTryForbidden());
    await a.idle();

    expect(a.page.deniedCount).toBe(1);
    expect(a.runtime.traceLabels("resolve").length).toBe(resolvedBefore);
  });
});
