// ============================================================================
// fakeDatabase.ts — a DatabaseCapability with no database behind it.
//
// This is the payoff of routing I/O through capabilities: the whole application
// runs, unmodified, against a table of scripted answers. No DuckDB, no file, no
// OS. Latency is a parameter, so races that are luck against a real database —
// a stale search overwriting a newer one, a query outliving the view that asked
// for it — become deterministic test cases here.
// ============================================================================

import type {
  DatabaseCapability,
  QueryResult,
  Row,
} from "../runtime/capabilities.js";

export interface FakeHandlerContext {
  sql: string;
  args: string[];
  callIndex: number;
}

export type FakeHandler = (ctx: FakeHandlerContext) => Row[] | QueryResult;

/** Fixed latency, or latency that varies per call so a race can be scripted. */
export type FakeDelay = number | ((ctx: FakeHandlerContext) => number);

interface Registration {
  match: (sql: string) => boolean;
  handler: FakeHandler;
  delayMs: FakeDelay;
  describe: string;
}

export class FakeDatabase implements DatabaseCapability {
  readonly kind = "db" as const;

  private readonly registrations: Registration[] = [];
  private readonly callCounts = new Map<string, number>();

  /** SQL actually asked for, in order — handy for asserting on fan-out. */
  readonly seen: string[] = [];
  /** Queries that were aborted before they answered. */
  readonly aborted: string[] = [];

  /**
   * Answer any SQL containing `needle` (or matching a RegExp) with `handler`,
   * after `delayMs`. Later registrations win, so a test can override a default.
   */
  on(
    needle: string | RegExp,
    handler: FakeHandler,
    opts: { delayMs?: FakeDelay } = {},
  ): this {
    const match =
      needle instanceof RegExp
        ? (sql: string) => needle.test(sql)
        : (sql: string) => sql.includes(needle);
    this.registrations.unshift({
      match,
      handler,
      delayMs: opts.delayMs ?? 0,
      describe: String(needle),
    });
    return this;
  }

  async query(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult> {
    return await this.answer(sql, args, signal);
  }

  async exec(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult> {
    return await this.answer(sql, args, signal);
  }

  async *stream(
    sql: string,
    chunkSize: number,
    signal: AbortSignal,
  ): AsyncIterable<QueryResult> {
    const all = await this.answer(sql, [], signal);
    for (let i = 0; i < all.rows.length; i += chunkSize) {
      if (signal.aborted) return;
      const rows = all.rows.slice(i, i + chunkSize);
      yield { rows, rowCount: rows.length };
    }
  }

  async close(): Promise<void> {}

  // -------------------------------------------------------------------------

  private async answer(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult> {
    this.seen.push(sql);
    const reg = this.registrations.find((r) => r.match(sql));
    if (!reg) {
      throw new Error(`FakeDatabase has no answer for: ${sql}`);
    }

    // Claim the call index before awaiting, so a scripted race sees the order
    // the requests were submitted in rather than the order they finish.
    const n = (this.callCounts.get(reg.describe) ?? 0) + 1;
    this.callCounts.set(reg.describe, n);
    const ctx: FakeHandlerContext = { sql, args, callIndex: n - 1 };

    const delay = typeof reg.delayMs === "function" ? reg.delayMs(ctx) : reg.delayMs;
    if (delay > 0) {
      await this.sleep(delay, signal, sql);
    }
    if (signal.aborted) {
      this.aborted.push(sql);
      throw new Error("aborted");
    }

    const produced = reg.handler(ctx);
    if (Array.isArray(produced)) {
      return { rows: produced, rowCount: produced.length };
    }
    return produced;
  }

  private sleep(ms: number, signal: AbortSignal, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(t);
        this.aborted.push(sql);
        reject(new Error("aborted"));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
}
