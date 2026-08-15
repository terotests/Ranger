// ============================================================================
// duckdbDatabase.ts — the real backend.
//
// DuckDB was picked over SQLite for one reason: its Node API is genuinely
// asynchronous and runs queries on a background thread pool, so several
// connections to the same in-process database really do overlap. `node:sqlite`
// needs no dependency at all but is synchronous, which would leave the whole
// Task/Scope/cancellation machinery untested — a runtime that never has two
// things in flight has not been exercised.
//
// It also happens to support everything the effect model needs a backend to
// prove it can express:
//
//     concurrency   several connections, one instance, real overlap
//     cancellation  connection.interrupt() aborts a running query
//     streaming     streamAndRead() yields rows before the query finishes
//
// None of that leaks upwards. The model sees `Task` and `Stream` semantics; a
// host built on database/sql, JDBC or ADO.NET would present the same three.
// ============================================================================

import type {
  DatabaseCapability,
  QueryResult,
  Row,
} from "../runtime/capabilities.js";

// Imported lazily so the module can be loaded (and the rest of the gallery
// type-checked) on a machine that never installed the driver.
type DuckDBInstance = any;
type DuckDBConnection = any;

export interface DuckDBOptions {
  /** ":memory:" (default) or a file path. */
  path?: string;
  /** Connections in the pool. More than one is what buys overlap. */
  poolSize?: number;
}

interface PooledConnection {
  conn: DuckDBConnection;
  busy: boolean;
}

export class DuckDBDatabase implements DatabaseCapability {
  readonly kind = "db" as const;

  private readonly pool: PooledConnection[] = [];
  private readonly waiting: Array<(c: PooledConnection) => void> = [];
  private instance: DuckDBInstance | null = null;
  private closed = false;

  /** Peak number of connections busy at once — the concurrency actually used. */
  peakConcurrency = 0;
  private busyNow = 0;

  private constructor(private readonly poolSize: number) {}

  static async open(options: DuckDBOptions = {}): Promise<DuckDBDatabase> {
    const { DuckDBInstance } = await import("@duckdb/node-api");
    const db = new DuckDBDatabase(options.poolSize ?? 4);
    db.instance = await DuckDBInstance.create(options.path ?? ":memory:");
    for (let i = 0; i < db.poolSize; i++) {
      db.pool.push({ conn: await db.instance.connect(), busy: false });
    }
    return db;
  }

  // -- capability surface ---------------------------------------------------

  async query(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult> {
    return await this.withConnection(signal, async (conn) => {
      const reader = args.length > 0
        ? await this.runPrepared(conn, sql, args)
        : await conn.runAndReadAll(sql);
      const rows = reader.getRowObjectsJson() as Row[];
      return { rows, rowCount: rows.length };
    });
  }

  async exec(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult> {
    return await this.withConnection(signal, async (conn) => {
      const reader = args.length > 0
        ? await this.runPrepared(conn, sql, args)
        : await conn.runAndReadAll(sql);
      const changed = Number(reader.rowsChanged ?? 0);
      return { rows: [], rowCount: Number.isFinite(changed) ? changed : 0 };
    });
  }

  /**
   * Rows before the query is finished. Each yielded chunk holds only the rows
   * that arrived since the previous one, so a model can start rendering — or
   * stop reading — long before the result set is complete.
   */
  async *stream(
    sql: string,
    chunkSize: number,
    signal: AbortSignal,
  ): AsyncIterable<QueryResult> {
    const lease = await this.acquire(signal);
    if (signal.aborted) {
      this.release(lease);
      return;
    }
    const onAbort = () => {
      try {
        lease.conn.interrupt();
      } catch {
        /* the query may already have finished */
      }
    };
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      const reader = await lease.conn.streamAndRead(sql);
      let delivered = 0;
      while (!signal.aborted) {
        await reader.readUntil(delivered + chunkSize);
        const all = reader.getRowObjectsJson() as Row[];
        const fresh = all.slice(delivered);
        delivered = all.length;
        // DuckDB hands back a whole vector (2048 rows) at a time, so `fresh`
        // is usually larger than the caller asked for. Re-slice it: chunkSize
        // is part of the contract the model sees, not a hint to the driver.
        for (let i = 0; i < fresh.length; i += chunkSize) {
          if (signal.aborted) return;
          const rows = fresh.slice(i, i + chunkSize);
          yield { rows, rowCount: rows.length };
        }
        if (reader.done) break;
        if (fresh.length === 0) break; // no progress: nothing more is coming
      }
    } finally {
      signal.removeEventListener("abort", onAbort);
      this.release(lease);
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const p of this.pool) {
      try {
        p.conn.closeSync();
      } catch {
        /* already gone */
      }
    }
    this.pool.length = 0;
  }

  // -- pool -----------------------------------------------------------------

  private async withConnection<T>(
    signal: AbortSignal,
    body: (conn: DuckDBConnection) => Promise<T>,
  ): Promise<T> {
    const lease = await this.acquire(signal);
    // Acquiring a connection took a microtask, and the scope may have died in
    // it. Interrupting a connection that has not started a query yet does
    // nothing, so the query would run to completion with nobody waiting for it.
    if (signal.aborted) {
      this.release(lease);
      throw new Error("aborted before the query was issued");
    }
    // Real cancellation: DuckDB interrupts the running query rather than the
    // host merely ignoring the answer when it eventually arrives.
    const onAbort = () => {
      try {
        lease.conn.interrupt();
      } catch {
        /* the query may already have finished */
      }
    };
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await body(lease.conn);
    } finally {
      signal.removeEventListener("abort", onAbort);
      this.release(lease);
    }
  }

  private async runPrepared(conn: DuckDBConnection, sql: string, args: string[]) {
    const prepared = await conn.prepare(sql);
    args.forEach((a, i) => prepared.bindVarchar(i + 1, a));
    return await prepared.runAndReadAll();
  }

  private acquire(signal: AbortSignal): Promise<PooledConnection> {
    if (this.closed) return Promise.reject(new Error("database closed"));
    const free = this.pool.find((p) => !p.busy);
    if (free) {
      free.busy = true;
      this.noteBusy();
      return Promise.resolve(free);
    }
    return new Promise<PooledConnection>((resolve, reject) => {
      const onAbort = () => reject(new Error("aborted while waiting for a connection"));
      signal.addEventListener("abort", onAbort, { once: true });
      this.waiting.push((c) => {
        signal.removeEventListener("abort", onAbort);
        resolve(c);
      });
    });
  }

  private release(lease: PooledConnection): void {
    this.busyNow--;
    const next = this.waiting.shift();
    if (next) {
      this.noteBusy();
      next(lease);
      return;
    }
    lease.busy = false;
  }

  private noteBusy(): void {
    this.busyNow++;
    if (this.busyNow > this.peakConcurrency) this.peakConcurrency = this.busyNow;
  }
}
