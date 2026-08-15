// ============================================================================
// capabilities.ts — what I/O is, from the runtime's point of view.
//
// Nothing reaches the outside world except through one of these interfaces,
// and an interface reaches a process only if the host handed it over by name.
// A model that was never granted "db" cannot open a database however it phrases
// the request; a model granted a FakeDatabase cannot tell the difference.
//
// This is the seam the whole design turns on. Ranger does not abstract
// PostgreSQL, SQLite and IndexedDB into one API — it abstracts the *semantics*
// (one round trip, many round trips, cancellable, owned by a scope) and lets
// each host bring its own driver.
// ============================================================================

/** A row as delivered to Ranger: flat, JSON-encodable, no driver types. */
export type Row = Record<string, string | number | boolean | null>;

export interface QueryResult {
  rows: Row[];
  rowCount: number;
}

/**
 * One round trip and many round trips, and nothing else. Every backend can
 * implement this; no backend has to expose its cursor model to do it.
 */
export interface DatabaseCapability {
  readonly kind: "db";
  /** Rows back. `args` bind to `?` placeholders in order. */
  query(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult>;
  /** Affected row count back. */
  exec(sql: string, args: string[], signal: AbortSignal): Promise<QueryResult>;
  /** 0..n chunks. The iterator must stop when `signal` aborts. */
  stream(
    sql: string,
    chunkSize: number,
    signal: AbortSignal,
  ): AsyncIterable<QueryResult>;
  close(): Promise<void>;
}

export interface ClockCapability {
  readonly kind: "clock";
  now(): number;
  delay(ms: number, signal: AbortSignal): Promise<void>;
}

// Only the capabilities the runtime actually executes are declared here. The
// rest of the intended set — http, files, storage, sockets — is milestone 3 of
// PLAN_IO_EFFECTS.md, and declaring a name the runtime would refuse at the
// first request is worse than not declaring it.
export type Capability = DatabaseCapability | ClockCapability;

/**
 * The grant table. The host builds one of these and hands it to the runtime;
 * a name that is not in it does not exist as far as any model is concerned.
 */
export class CapabilityTable {
  private readonly grants = new Map<string, Capability>();

  grant(name: string, cap: Capability): this {
    this.grants.set(name, cap);
    return this;
  }

  revoke(name: string): void {
    this.grants.delete(name);
  }

  has(name: string): boolean {
    return this.grants.has(name);
  }

  get(name: string): Capability | undefined {
    return this.grants.get(name);
  }

  names(): string[] {
    return [...this.grants.keys()].sort();
  }

  /** Which of `required` this table cannot satisfy. */
  missing(required: string[]): string[] {
    return required.filter((n) => !this.grants.has(n));
  }

  async closeAll(): Promise<void> {
    for (const cap of this.grants.values()) {
      if (cap.kind === "db") await cap.close();
    }
  }
}

export class CapabilityDeniedError extends Error {
  constructor(public readonly capability: string) {
    super(`capability not granted: ${capability}`);
    this.name = "CapabilityDeniedError";
  }
}

/** A granted capability that has no answer for the operation asked of it. */
export class UnsupportedOperationError extends Error {
  constructor(capability: string, op: string) {
    super(`unsupported operation: ${capability}.${op}`);
    this.name = "UnsupportedOperationError";
  }
}
