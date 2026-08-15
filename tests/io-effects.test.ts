// ============================================================================
// io-effects.test.ts — the contract of Ranger's I/O effect model.
//
// Every case here runs the whole application: a Ranger @process model compiled
// to TypeScript, the host effect runtime, and a scripted DatabaseCapability
// standing in for a real backend. No database, no network, no OS — which is
// itself one of the claims being tested.
//
// The gallery test (gallery/process_db_effects) runs the same model against
// DuckDB. If a rule holds here and not there, the adapter is wrong; if it holds
// there and not here, the fake is lying.
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { execFileSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

import { createNotesApp } from "../gallery/process_db_effects/src/app.js";
import { FakeDatabase } from "../gallery/process_db_effects/src/adapters/fakeDatabase.js";
import { ManualClock } from "../gallery/process_db_effects/src/adapters/systemClock.js";
import { CapabilityDeniedError } from "../gallery/process_db_effects/src/runtime/capabilities.js";
import {
  EffectQueue,
  EffectPayload,
  NotesPage,
  NotesReducer,
  NotesState,
  NotesViewModelBuilder,
  ProcessRuntime,
  ProcessUiHost,
} from "../gallery/process_db_effects/src/generated/notes_model.js";

const NOTES = [
  { id: 1, title: "Effects", body: "I/O is described, not performed", tag: "core" },
  { id: 2, title: "Scopes", body: "Every task has a lifecycle owner", tag: "core" },
  { id: 3, title: "Capabilities", body: "No grant, no socket", tag: "security" },
  { id: 4, title: "Streams", body: "Zero to n values over time", tag: "core" },
  { id: 5, title: "Staleness", body: "Newer questions win", tag: "ui" },
];

/** A fake wired for the SQL this model actually emits. */
function seededDb(opts: { searchDelayMs?: number } = {}): FakeDatabase {
  const db = new FakeDatabase();
  db.on("CREATE TABLE", () => []);
  db.on("INSERT INTO", () => ({ rows: [], rowCount: NOTES.length }));
  db.on("SELECT count(*)", () => [{ n: NOTES.length }]);
  db.on("SELECT min(", () => [{ n: 19 }]);
  db.on("SELECT max(", () => [{ n: 31 }]);
  db.on(
    "FROM notes ORDER BY id",
    () => NOTES,
    { delayMs: opts.searchDelayMs ?? 0 },
  );
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
    { delayMs: opts.searchDelayMs ?? 0 },
  );
  return db;
}

/** Bring a fresh app up to the "seeded and listed" state. */
async function openedApp(db = seededDb()) {
  const app = createNotesApp({ db, clock: new ManualClock() });
  app.send((p) => p.onOpen());
  await app.idle();
  return app;
}

beforeEach(() => {
  // The generated singletons outlive a single test in a shared module graph.
  EffectQueue.__singleton().reset();
  ProcessUiHost.__singleton().resetNotifyDeliveryCount();
});

// ---------------------------------------------------------------------------

describe("the model performs no I/O", () => {
  it("submits a request instead of running one", () => {
    const page = new NotesPage();
    page.__rangerRegisterRoot();
    ProcessRuntime.startInstance(page);
    const db = seededDb();

    page.onSearch("scope");

    // The handler ran to completion, state moved, and the database was never
    // touched: the effect is sitting in the queue as data.
    expect(page.state.phase).toBe("loading");
    expect(page.state.epoch).toBe(1);
    expect(db.seen).toEqual([]);

    const queued = EffectQueue.__singleton().drain();
    expect(queued).toHaveLength(1);
    expect(queued[0].capability).toBe("db");
    expect(queued[0].op).toBe("query");
    expect(queued[0].label).toBe("search");
    expect(queued[0].ownerPath).toBe("app.notes");
    expect(queued[0].args).toEqual(["%scope%", "%scope%"]);

    ProcessRuntime.stopInstance(page);
  });

  it("declares the capabilities it needs", () => {
    const page = new NotesPage();
    expect(page.capabilities().names).toEqual(["db", "clock"]);
  });
});

describe("the reducer is a function", () => {
  // No process, no runtime, no queue, no adapter — values in, values out.
  it("computes a transition from a bare state value", () => {
    const s0 = new NotesState();
    const u = NotesReducer.search(s0, "app.notes", "scope");

    expect(u.state.searchText).toBe("scope");
    expect(u.state.phase).toBe("loading");
    expect(u.state.epoch).toBe(1);
    expect(u.state.inFlight).toBe(1);

    // The effect is a value it returned, not something it did.
    expect(u.effects).toHaveLength(1);
    expect(u.effects[0].capability).toBe("db");
    expect(u.effects[0].args).toEqual(["%scope%", "%scope%"]);
    expect(EffectQueue.__singleton().depth()).toBe(0);
  });

  it("leaves the state it was given untouched", () => {
    const s0 = new NotesState();
    NotesReducer.search(s0, "app.notes", "scope");
    NotesReducer.loadStats(s0, "app.notes");
    NotesReducer.open(s0, "app.notes");

    expect(s0.searchText).toBe("");
    expect(s0.phase).toBe("idle");
    expect(s0.epoch).toBe(0);
    expect(s0.inFlight).toBe(0);
    expect(s0.statsPending).toBe(0);
  });

  it("gives the same answer every time it is asked", () => {
    const s0 = new NotesState();
    const a = NotesReducer.search(s0, "app.notes", "scope");
    const b = NotesReducer.search(s0, "app.notes", "scope");

    expect(a.state).not.toBe(b.state); // distinct values...
    expect(a.state).toEqual(b.state); // ...that are equal
  });

  it("shares the branches a transition did not change", () => {
    // The payoff for a view layer: `notes` was not touched by these three
    // transitions, so all four states carry the SAME array. A renderer can
    // compare the branch by identity instead of diffing it.
    const s0 = new NotesState();
    const s1 = NotesReducer.open(s0, "app.notes").state;
    const s2 = NotesReducer.seed(s1, "app.notes").state;
    const s3 = NotesReducer.loadStats(s2, "app.notes").state;

    expect(s1.notes).toBe(s0.notes);
    expect(s3.notes).toBe(s0.notes);
  });

  it("keeps the previous state available after a live transition", async () => {
    const app = await openedApp();
    const before = app.page.state;

    app.send((p) => p.onSearch("scope"));

    // The old value is not a snapshot that had to be copied — it is the object
    // that was already there, still valid.
    expect(app.page.previous).toBe(before);
    expect(app.page.previous.searchText).toBe("");
    expect(app.page.state.searchText).toBe("scope");
    expect(app.page.previous.notes).toHaveLength(5);

    await app.idle();
    app.stop();
  });
});

describe("event chaining", () => {
  it("walks schema -> seed -> list, each step driven by the previous answer", async () => {
    const db = seededDb();
    const app = await openedApp(db);

    expect(app.page.state.phase).toBe("ready");
    expect(app.page.state.notes.map((n) => n.title)).toEqual([
      "Effects",
      "Scopes",
      "Capabilities",
      "Streams",
      "Staleness",
    ]);
    // Three round trips, in order, none of them arranged by the host.
    expect(app.runtime.traceLabels("resolve")).toEqual(["schema", "seed", "search"]);
    expect(app.page.state.inFlight).toBe(0);

    app.stop();
  });

  it("projects state into a view model with no process handle in it", async () => {
    const app = await openedApp();
    const vm = app.view();

    expect(vm.title).toBe("Notes");
    expect(vm.showSpinner).toBe(false);
    expect(vm.rows).toHaveLength(5);
    expect(vm.rows[2].badge).toBe("security");
    expect(vm.statusLine).toBe("5 of 5 notes");

    // Pure: same state in, equal value out, and the second call performed no I/O.
    expect(app.view()).toEqual(vm);
    expect(app.render()).toContain("[3] Capabilities (security)");

    app.stop();
  });
});

describe("concurrency", () => {
  it("fans out three queries without waiting between them", async () => {
    const db = seededDb();
    const app = await openedApp(db);
    app.runtime.trace.length = 0;

    app.send((p) => p.onLoadStats());

    // All three are in flight before any of them has answered.
    expect(app.runtime.pendingCount).toBe(3);
    expect(app.runtime.traceLabels("start")).toEqual([
      "stat.count",
      "stat.min",
      "stat.max",
    ]);
    expect(app.runtime.traceLabels("resolve")).toEqual([]);

    await app.idle();

    expect(app.page.state.total).toBe(5);
    expect(app.page.state.shortest).toBe(19);
    expect(app.page.state.longest).toBe(31);
    expect(app.page.state.statsPending).toBe(0);
    expect(app.page.state.phase).toBe("ready");

    app.stop();
  });
});

describe("staleness", () => {
  it("drops the answer to a superseded question instead of overwriting newer data", async () => {
    const db = new FakeDatabase();
    db.on("CREATE TABLE", () => []);
    db.on("INSERT INTO", () => ({ rows: [], rowCount: NOTES.length }));
    db.on("FROM notes ORDER BY id", () => NOTES);
    // The first search is slow and the second is fast, so the answers come back
    // in the opposite order to the questions — the classic race.
    db.on(
      "WHERE title ILIKE",
      ({ args }) => {
        const needle = (args[0] ?? "").replace(/%/g, "");
        return NOTES.filter((n) => n.tag === needle);
      },
      { delayMs: ({ callIndex }) => (callIndex === 0 ? 40 : 0) },
    );

    const app = await openedApp(db);

    app.send((p) => p.onSearch("security"));
    app.send((p) => p.onSearch("ui"));
    await app.idle();

    // Newest question wins; the older answer was dropped before touching state.
    expect(app.page.state.searchText).toBe("ui");
    expect(app.page.state.notes.map((n) => n.title)).toEqual(["Staleness"]);
    expect(app.page.state.staleDropped).toBe(1);
    expect(app.page.state.epoch).toBe(3); // list-all + two searches

    app.stop();
  });
});

describe("structured concurrency", () => {
  it("abandons in-flight work when the owning process stops", async () => {
    const db = seededDb({ searchDelayMs: 40 });
    const app = await openedApp(db);
    const before = app.page.state.notes.length;

    app.send((p) => p.onSearch("scope"));
    expect(app.runtime.pendingCount).toBe(1);

    // The view closes while the query is still running.
    app.stop();

    // The scope is gone at once — the owner does not linger waiting for its
    // work. The task itself is still unwinding inside the driver, which is why
    // the in-flight count drains a tick later rather than synchronously.
    expect(app.runtime.scopeOf("app.notes")).toBeUndefined();

    await new Promise((r) => setTimeout(r, 80));
    expect(app.runtime.pendingCount).toBe(0);

    // Nothing was delivered to the stopped process: no late state change, no
    // handler running against a torn-down owner.
    expect(app.page.state.notes.length).toBe(before);
    expect(app.page.state.cancelledCount).toBe(0);
    expect(db.aborted.length).toBeGreaterThan(0);
    expect(app.runtime.trace.some((t) => t.kind === "drop")).toBe(true);
  });

  it("reports cancellation to a process that is still alive", async () => {
    const db = seededDb({ searchDelayMs: 40 });
    const app = await openedApp(db);

    app.send((p) => p.onSearch("scope"));
    const cancelled = app.runtime.cancelLabel("app.notes", "search");
    expect(cancelled).toBe(1);

    await app.idle();

    // Still attached, so it hears about it and can react.
    expect(app.page.state.cancelledCount).toBe(1);
    expect(app.page.state.inFlight).toBe(0);

    app.stop();
  });

  it("keeps the scope tree honest about what is running", async () => {
    const db = seededDb({ searchDelayMs: 30 });
    const app = await openedApp(db);

    app.send((p) => p.onLoadStats());
    const scope = app.runtime.scopeOf("app.notes")!;
    expect(scope.liveCount()).toBe(3);
    expect(scope.liveLabels().sort()).toEqual(["stat.count", "stat.max", "stat.min"]);

    await app.idle();
    expect(scope.liveCount()).toBe(0);

    app.stop();
    expect(scope.cancelled).toBe(true);
    expect(scope.cancelReason).toBe("owner_stopped");
  });
});

describe("capabilities", () => {
  it("refuses an ungranted capability before any adapter is reached", async () => {
    const db = seededDb();
    const app = await openedApp(db);
    const seenBefore = db.seen.length;

    app.send((p) => p.onTryForbidden());
    await app.idle();

    expect(app.page.state.deniedCount).toBe(1);
    expect(app.page.state.errorText).toBe("capability denied: filesystem");
    expect(db.seen.length).toBe(seenBefore); // the request never became I/O
    expect(app.runtime.trace.some((t) => t.kind === "deny")).toBe(true);

    app.stop();
  });

  it("fails at wiring time when the host cannot satisfy the manifest", () => {
    expect(() =>
      createNotesApp({ db: seededDb(), grants: ["db"] }),
    ).toThrow(CapabilityDeniedError);
  });

  it("runs the whole application against a database that does not exist", async () => {
    // The point of the capability seam: this test touches no OS resource.
    const app = await openedApp();
    expect(app.page.state.phase).toBe("ready");
    expect(app.page.state.notes).toHaveLength(5);
    app.stop();
  });
});

describe("streams", () => {
  it("delivers many results for one request, with the last marked final", async () => {
    const db = seededDb();
    const app = await openedApp(db);
    app.runtime.trace.length = 0;

    app.send((p) => p.onStreamAll(2));
    await app.idle();

    // 5 rows in chunks of 2 => 3 chunks, the last one closing the stream.
    expect(app.page.state.streamChunks).toBe(3);
    expect(app.page.state.streamRows).toBe(5);
    expect(app.page.state.phase).toBe("ready");
    expect(app.page.state.inFlight).toBe(0);
    expect(app.runtime.trace.filter((t) => t.kind === "chunk")).toHaveLength(3);

    app.stop();
  });
});

describe("dispatch turns", () => {
  it("delivers one UI notification per event, answers included", async () => {
    const db = seededDb();
    const app = await openedApp(db);

    const uiHost = ProcessUiHost.__singleton();
    uiHost.resetNotifyDeliveryCount();

    // onLoadStats marks state dirty once in the handler and once per answer.
    app.send((p) => p.onLoadStats());
    await app.idle();

    expect(uiHost.notifyPathDeliveredCount).toBe(4);

    app.stop();
  });
});

describe("payload decoding in Ranger", () => {
  it("parses the JSON the host hands back without a JSON library", () => {
    const rows = EffectPayload.parseRows(
      '[{"id":1,"title":"Effects","tag":"core"},{"id":2,"title":"Scopes, plural","tag":"core"}]',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].get("title")).toBe("Effects");
    expect(rows[0].getInt("id")).toBe(1);
    // A comma inside a quoted value must not split the row.
    expect(rows[1].get("title")).toBe("Scopes, plural");
    expect(rows[1].getInt("id")).toBe(2);
    expect(rows[0].has("missing")).toBe(false);
    expect(rows[0].get("missing")).toBe("");
  });

  it("escapes what it emits", () => {
    expect(EffectPayload.escape('a "b" \\ c')).toBe('a \\"b\\" \\\\ c');
  });
});

describe("portability", () => {
  // The whole design rests on effects being plain data rather than a language
  // type: that is why it needs no generics and no `async` keyword, and why it
  // is supposed to work on targets whose class writers emit neither. Asserting
  // it rather than claiming it.
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const ALL_TARGETS = [
    "es6", "go", "python", "kotlin", "csharp", "rust",
    "dart", "swift6", "cpp", "java7", "php", "scala",
  ];

  function compile(source: string, target: string): string {
    return execFileSync(
      process.execPath,
      [
        path.join(ROOT, "bin", "output.js"),
        `-l=${target}`,
        source,
        // Relative on purpose: the compiler joins -d= onto its cwd, so an
        // absolute path here would be written as ./home/user/... instead.
        `-d=./tests/.output-effects/${target}`,
        "-o=out.txt",
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        env: {
          ...process.env,
          RANGER_LIB: `${path.join(ROOT, "compiler", "Lang.rgr")}:${path.join(ROOT, "lib", "stdops.rgr")}`,
        },
      },
    );
  }

  it("compiles the effect library for every target", () => {
    const failed: string[] = [];
    for (const target of ALL_TARGETS) {
      try {
        if (!compile("./lib/RangerEffects.rgr", target).includes("[OK]")) {
          failed.push(target);
        }
      } catch {
        failed.push(target);
      }
    }
    expect(failed).toEqual([]);
  });

  it("compiles the whole model for every target that supports @process", () => {
    // Scala is excluded because RangerProcess.rgr itself does not compile there
    // (its class writer rejects a for-loop containing `continue`) — a
    // pre-existing limitation of the process runtime, not of the effect model,
    // which the case above shows compiles for Scala on its own.
    const targets = ALL_TARGETS.filter((t) => t !== "scala");
    const failed: string[] = [];
    for (const target of targets) {
      try {
        const out = compile(
          "./gallery/process_db_effects/ranger/notes_model.rgr",
          target,
        );
        if (!out.includes("[OK]")) failed.push(target);
      } catch {
        failed.push(target);
      }
    }
    expect(failed).toEqual([]);
  });
});

describe("view model rendering", () => {
  it("shows a spinner and an in-flight count while work is outstanding", async () => {
    const db = seededDb({ searchDelayMs: 30 });
    const app = await openedApp(db);

    app.send((p) => p.onSearch("core"));
    const busy = NotesViewModelBuilder.build(app.page);
    expect(busy.showSpinner).toBe(true);
    expect(busy.statusLine).toBe("Working (1 in flight)");
    expect(busy.title).toBe('Notes matching "core"');

    await app.idle();
    const done = app.view();
    expect(done.showSpinner).toBe(false);
    expect(done.footer).toContain("stale dropped 0");

    app.stop();
  });
});
