// ============================================================================
// effectRuntime.ts — the host half of Ranger's I/O effect model.
//
// The Ranger side describes effects. This side performs them:
//
//     dispatch(event)
//       -> @process handler mutates state, submits EffectRequests
//       -> drain the queue
//       -> for each request: find the owning Scope, check the capability grant,
//          start a cancellable task
//       -> when a task answers, deliver an EffectResult as a new event
//       -> drain again (an answer may ask the next question)
//
// It imports nothing from the generated Ranger module. Everything it needs is
// described structurally below, so the same runtime drives any Ranger program
// built on RangerEffects.rgr, and a Go or Swift host can be written against the
// same six operations without reading this file.
// ============================================================================

import { Scope, type CancelReason } from "./scope.js";
import {
  CapabilityDeniedError,
  CapabilityTable,
  UnsupportedOperationError,
  type Capability,
  type ClockCapability,
  type DatabaseCapability,
  type QueryResult,
} from "./capabilities.js";

// ---------------------------------------------------------------------------
// The shapes the generated Ranger module provides. Structural, not imported.
// ---------------------------------------------------------------------------

export interface RgEffectRequest {
  id: number;
  capability: string;
  op: string;
  ownerPath: string;
  sql: string;
  args: string[];
  delayMs: number;
  chunkSize: number;
  epoch: number;
  label: string;
  timeoutMs: number;
}

export interface RgEffectResult {
  requestId: number;
  ok: boolean;
  more: boolean;
  capability: string;
  op: string;
  label: string;
  epoch: number;
  payload: string;
  rowCount: number;
  chunkIndex: number;
  errorKind: string;
  errorMessage: string;
  elapsedMs: number;
}

export interface RgEffectQueue {
  drain(): RgEffectRequest[];
  depth(): number;
}

/** Anything that can receive an answer — in practice, a @process class. */
export interface EffectSink {
  onEffectResult(result: RgEffectResult): void;
}

/**
 * The three things the runtime needs from a compiled Ranger module: the queue
 * to drain, a way to build a result value, and the dispatch-turn brackets that
 * keep UI notification to one delivery per turn.
 */
export interface RuntimeBridge {
  queue: RgEffectQueue;
  newResult(): RgEffectResult;
  beginTurn(root: unknown): void;
  endTurn(root: unknown): void;
}

// ---------------------------------------------------------------------------

export interface TraceEntry {
  at: number;
  kind: "submit" | "start" | "chunk" | "resolve" | "reject" | "deny" | "cancel" | "drop";
  requestId: number;
  owner: string;
  label: string;
  detail?: string;
}

export interface EffectRuntimeOptions {
  /** Collect a trace of everything the runtime did. Default true. */
  trace?: boolean;
  /** Called when an answer arrives for an owner that is no longer attached. */
  onDropped?: (result: RgEffectResult, owner: string) => void;
}

interface Attachment {
  owner: string;
  sink: EffectSink;
  scope: Scope;
  manifest: string[];
}

export class EffectRuntime {
  readonly rootScope = new Scope("app");
  readonly trace: TraceEntry[] = [];

  private readonly attachments = new Map<string, Attachment>();
  private readonly options: EffectRuntimeOptions;
  private inFlight = 0;
  private idleWaiters: Array<() => void> = [];
  private nextTaskSeq = 1;

  constructor(
    private readonly bridge: RuntimeBridge,
    private readonly capabilities: CapabilityTable,
    options: EffectRuntimeOptions = {},
  ) {
    this.options = { trace: true, ...options };
  }

  // -- lifecycle ------------------------------------------------------------

  /**
   * Give a process a scope. The manifest is checked up front, so a model that
   * needs a capability the host does not hold fails at attach time rather than
   * at its first query — a missing grant is a wiring bug, not a runtime event.
   */
  attach(owner: string, sink: EffectSink, manifest: string[] = []): Scope {
    const missing = this.capabilities.missing(manifest);
    if (missing.length > 0) {
      throw new CapabilityDeniedError(missing.join(", "));
    }
    // Re-attaching an owner would strand the previous scope: its tasks would
    // keep running with no way left to cancel them.
    const previous = this.attachments.get(owner);
    if (previous) this.detach(owner, "owner_stopped");
    const scope = this.rootScope.child(owner);
    this.attachments.set(owner, { owner, sink, scope, manifest });
    return scope;
  }

  /**
   * Stop a process. Its scope dies, every task under it is aborted, and no
   * further answer is delivered to it — this is the "request completes after
   * the view closed" bug being made structurally impossible rather than
   * defended against with a flag.
   */
  detach(owner: string, reason: CancelReason = "owner_stopped"): void {
    const att = this.attachments.get(owner);
    if (!att) return;
    this.attachments.delete(owner);
    att.scope.cancel(reason);
  }

  isAttached(owner: string): boolean {
    return this.attachments.has(owner);
  }

  scopeOf(owner: string): Scope | undefined {
    return this.attachments.get(owner)?.scope;
  }

  /** Cancel live work by label without touching the rest of the scope. */
  cancelLabel(owner: string, label: string): number {
    return this.attachments.get(owner)?.scope.cancelLabel(label) ?? 0;
  }

  async shutdown(): Promise<void> {
    for (const owner of [...this.attachments.keys()]) {
      this.detach(owner, "runtime_shutdown");
    }
    this.rootScope.cancel("runtime_shutdown");
    await this.capabilities.closeAll();
  }

  // -- events ---------------------------------------------------------------

  /**
   * Run one event against a process, then execute whatever it asked for. The
   * handler runs inside a dispatch turn so the host sees a single UI
   * notification for the whole turn, exactly as PROCESS_RUNTIME_INVARIANTS.md
   * requires.
   */
  dispatch(owner: string, event: () => void): void {
    const att = this.attachments.get(owner);
    if (!att) return;
    this.bridge.beginTurn(att.sink);
    try {
      event();
    } finally {
      this.bridge.endTurn(att.sink);
    }
    this.pump();
  }

  /** Drain the queue and start a task for every request in it. */
  pump(): void {
    const requests = this.bridge.queue.drain();
    for (const req of requests) {
      this.log("submit", req, "");
      this.start(req);
    }
  }

  /** Resolves once nothing is in flight and the queue is empty. */
  idle(): Promise<void> {
    if (this.inFlight === 0 && this.bridge.queue.depth() === 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.idleWaiters.push(resolve));
  }

  get pendingCount(): number {
    return this.inFlight;
  }

  // -- execution ------------------------------------------------------------

  private start(req: RgEffectRequest): void {
    const att = this.attachments.get(req.ownerPath);
    if (!att) {
      // The owner is already gone. Nothing to run, nobody to tell.
      this.log("drop", req, "owner not attached");
      return;
    }

    if (!att.manifest.includes(req.capability) || !this.capabilities.has(req.capability)) {
      // Refused before any adapter is reached: the request never becomes I/O.
      this.log("deny", req, req.capability);
      this.deliver(att, this.errorResult(req, "capability_denied", `capability not granted: ${req.capability}`));
      return;
    }

    const cap = this.capabilities.get(req.capability)!;
    const taskId = this.nextTaskSeq++;
    const controller = new AbortController();
    const started = Date.now();

    let settled = false;
    let cancelReason: CancelReason | null = null;

    att.scope.track({
      id: taskId,
      label: req.label,
      abort: (reason) => {
        cancelReason = reason;
        controller.abort(new Error(`cancelled: ${reason}`));
      },
    });

    // A scope cancelled from above must reach this task too.
    const onScopeAbort = () => controller.abort(new Error("scope cancelled"));
    att.scope.signal.addEventListener("abort", onScopeAbort, { once: true });

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (req.timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        cancelReason = "timeout";
        controller.abort(new Error("timeout"));
      }, req.timeoutMs);
    }

    // Releases the task's bookkeeping but deliberately does NOT settle `idle()`:
    // the answer has not been delivered yet, and delivering it may submit the
    // next request. Waking an idle waiter here would report the program
    // finished in the middle of a chain like schema -> seed -> list.
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      att.scope.signal.removeEventListener("abort", onScopeAbort);
      att.scope.untrack(taskId);
      this.inFlight--;
    };

    this.inFlight++;
    this.log("start", req, req.capability + "." + req.op);

    const onChunk = (chunk: QueryResult, index: number, more: boolean) => {
      if (controller.signal.aborted) return;
      this.log("chunk", req, `#${index} rows=${chunk.rows.length}`);
      const res = this.okResult(req, chunk, Date.now() - started);
      res.more = more;
      res.chunkIndex = index;
      this.deliverToOwner(req.ownerPath, res);
    };

    this.run(cap, req, controller.signal, onChunk)
      .then((final) => {
        finish();
        if (controller.signal.aborted) {
          this.reportCancelled(req, cancelReason ?? "explicit");
          return;
        }
        if (final === null) return; // stream already reported its last chunk
        this.log("resolve", req, `rows=${final.rowCount}`);
        this.deliverToOwner(req.ownerPath, this.okResult(req, final, Date.now() - started));
      })
      .catch((err: unknown) => {
        finish();
        if (controller.signal.aborted) {
          this.reportCancelled(req, cancelReason ?? "explicit");
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        const kind = err instanceof UnsupportedOperationError ? "unsupported" : "io";
        this.log("reject", req, message);
        this.deliverToOwner(req.ownerPath, this.errorResult(req, kind, message));
      })
      .finally(() => this.maybeIdle());
  }

  /**
   * Returns the final result, or null when the operation already delivered
   * everything it had through `onChunk` (the Stream case).
   */
  private async run(
    cap: Capability,
    req: RgEffectRequest,
    signal: AbortSignal,
    onChunk: (chunk: QueryResult, index: number, more: boolean) => void,
  ): Promise<QueryResult | null> {
    if (cap.kind === "db") {
      const db = cap as DatabaseCapability;
      if (req.op === "query") return await db.query(req.sql, req.args, signal);
      if (req.op === "exec") return await db.exec(req.sql, req.args, signal);
      if (req.op === "stream") {
        const size = req.chunkSize > 0 ? req.chunkSize : 64;
        let index = 0;
        let pendingChunk: QueryResult | null = null;
        for await (const chunk of db.stream(req.sql, size, signal)) {
          if (signal.aborted) return null;
          if (pendingChunk) onChunk(pendingChunk, index++, true);
          pendingChunk = chunk;
        }
        // The last chunk carries more === false, so a model can tell the end of
        // a stream from a pause in it without a separate completion event.
        onChunk(pendingChunk ?? { rows: [], rowCount: 0 }, index, false);
        return null;
      }
      throw new UnsupportedOperationError(req.capability, req.op);
    }

    if (cap.kind === "clock") {
      const clock = cap as ClockCapability;
      if (req.op === "delay") {
        await clock.delay(req.delayMs, signal);
        return { rows: [], rowCount: 0 };
      }
      throw new UnsupportedOperationError(req.capability, req.op);
    }

    throw new UnsupportedOperationError(req.capability, req.op);
  }

  // -- delivery -------------------------------------------------------------

  private reportCancelled(req: RgEffectRequest, reason: CancelReason): void {
    const att = this.attachments.get(req.ownerPath);
    if (!att) {
      // The owner is gone: there is nobody to inform, and informing a stopped
      // process is precisely what this model exists to prevent.
      this.log("drop", req, `cancelled after detach (${reason})`);
      return;
    }
    this.log("cancel", req, reason);
    // A timeout is reported as a timeout. It reaches this path because the
    // runtime cancels the task to implement it, but the model needs to tell
    // "the deadline passed" from "the owner withdrew the question".
    const kind = reason === "timeout" ? "timeout" : "cancelled";
    this.deliver(att, this.errorResult(req, kind, `${kind}: ${reason}`));
  }

  private deliverToOwner(owner: string, result: RgEffectResult): void {
    const att = this.attachments.get(owner);
    if (!att) {
      this.log("drop", { id: result.requestId, ownerPath: owner, label: result.label } as RgEffectRequest, "owner detached");
      this.options.onDropped?.(result, owner);
      return;
    }
    this.deliver(att, result);
  }

  /** An answer is an event: it arrives in its own dispatch turn. */
  private deliver(att: Attachment, result: RgEffectResult): void {
    this.bridge.beginTurn(att.sink);
    try {
      att.sink.onEffectResult(result);
    } finally {
      this.bridge.endTurn(att.sink);
    }
    this.pump();
  }

  // -- result construction --------------------------------------------------

  private baseResult(req: RgEffectRequest): RgEffectResult {
    const r = this.bridge.newResult();
    r.requestId = req.id;
    r.capability = req.capability;
    r.op = req.op;
    r.label = req.label;
    r.epoch = req.epoch;
    r.more = false;
    r.chunkIndex = 0;
    r.payload = "";
    r.rowCount = 0;
    r.errorKind = "";
    r.errorMessage = "";
    r.elapsedMs = 0;
    return r;
  }

  private okResult(req: RgEffectRequest, q: QueryResult, elapsedMs: number): RgEffectResult {
    const r = this.baseResult(req);
    r.ok = true;
    r.payload = JSON.stringify(q.rows);
    r.rowCount = q.rowCount;
    r.elapsedMs = elapsedMs;
    return r;
  }

  private errorResult(req: RgEffectRequest, kind: string, message: string): RgEffectResult {
    const r = this.baseResult(req);
    r.ok = false;
    r.errorKind = kind;
    r.errorMessage = message;
    return r;
  }

  // -- bookkeeping ----------------------------------------------------------

  private maybeIdle(): void {
    if (this.inFlight !== 0 || this.bridge.queue.depth() !== 0) return;
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    for (const w of waiters) w();
  }

  private log(kind: TraceEntry["kind"], req: RgEffectRequest, detail: string): void {
    if (!this.options.trace) return;
    this.trace.push({
      at: Date.now(),
      kind,
      requestId: req.id,
      owner: req.ownerPath,
      label: req.label,
      detail,
    });
  }

  traceLabels(kind: TraceEntry["kind"]): string[] {
    return this.trace.filter((t) => t.kind === kind).map((t) => t.label);
  }
}
