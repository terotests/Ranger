// ============================================================================
// scope.ts — structured concurrency for the effect runtime.
//
// A Scope is a lifetime that owns work. Scopes form a tree that mirrors the
// @process tree, and cancelling one cancels every task under it, depth first.
// Nothing in this file knows about databases, and nothing in it is specific to
// JavaScript beyond the promise it happens to be written with: the same three
// operations (child, track, cancel) are what a Go, Swift or Kotlin host would
// implement over contexts, task groups or coroutine scopes.
//
// The invariant it exists to buy:
//
//     every in-flight operation has a lifecycle owner,
//     and when the owner dies the operation dies with it.
// ============================================================================

export type CancelReason =
  | "owner_stopped"
  | "parent_cancelled"
  | "explicit"
  | "timeout"
  | "runtime_shutdown";

export class ScopeCancelledError extends Error {
  constructor(public readonly reason: CancelReason) {
    super(`scope cancelled: ${reason}`);
    this.name = "ScopeCancelledError";
  }
}

interface TrackedTask {
  readonly id: number;
  readonly label: string;
  /** Best-effort interruption of the underlying host operation. */
  readonly abort: (reason: CancelReason) => void;
}

export class Scope {
  readonly name: string;
  readonly parent: Scope | null;

  private readonly children = new Set<Scope>();
  private readonly tasks = new Map<number, TrackedTask>();
  private readonly controller = new AbortController();

  private _cancelled = false;
  private _reason: CancelReason | null = null;

  constructor(name: string, parent: Scope | null = null) {
    this.name = name;
    this.parent = parent;
  }

  get cancelled(): boolean {
    return this._cancelled;
  }

  get cancelReason(): CancelReason | null {
    return this._reason;
  }

  /** Passed to adapters so a driver that supports interruption can use it. */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  child(name: string): Scope {
    if (this._cancelled) {
      throw new ScopeCancelledError(this._reason ?? "explicit");
    }
    const c = new Scope(name, this);
    this.children.add(c);
    return c;
  }

  track(task: TrackedTask): void {
    if (this._cancelled) {
      // Late arrival into a dead scope: abort immediately rather than leak it.
      task.abort(this._reason ?? "explicit");
      return;
    }
    this.tasks.set(task.id, task);
  }

  untrack(id: number): void {
    this.tasks.delete(id);
  }

  /** Live tasks in this scope and everything below it. */
  liveCount(): number {
    let n = this.tasks.size;
    for (const c of this.children) n += c.liveCount();
    return n;
  }

  liveLabels(): string[] {
    const out: string[] = [];
    for (const t of this.tasks.values()) out.push(t.label);
    for (const c of this.children) out.push(...c.liveLabels());
    return out;
  }

  /** Cancel one task by label, leaving the rest of the scope alive. */
  cancelLabel(label: string, reason: CancelReason = "explicit"): number {
    let n = 0;
    for (const t of [...this.tasks.values()]) {
      if (t.label === label) {
        this.tasks.delete(t.id);
        t.abort(reason);
        n++;
      }
    }
    for (const c of this.children) n += c.cancelLabel(label, reason);
    return n;
  }

  /**
   * Cancel this scope. Children go first so a parent never outlives work it is
   * responsible for tearing down, and the scope stays cancelled afterwards —
   * anything submitted into it later is refused rather than started.
   */
  cancel(reason: CancelReason = "explicit"): void {
    if (this._cancelled) return;
    this._cancelled = true;
    this._reason = reason;

    for (const c of [...this.children]) {
      c.cancel(reason === "owner_stopped" ? "parent_cancelled" : reason);
    }
    this.children.clear();

    for (const t of [...this.tasks.values()]) {
      this.tasks.delete(t.id);
      t.abort(reason);
    }

    this.controller.abort(new ScopeCancelledError(reason));

    if (this.parent) this.parent.children.delete(this);
  }

  path(): string {
    return this.parent ? `${this.parent.path()}/${this.name}` : this.name;
  }
}
