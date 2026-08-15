// ============================================================================
// systemClock.ts — time as a capability.
//
// A model that reads the clock through a grant is a model a test can put in
// 1999, or step forward by hand. `Date.now()` reached for directly is the one
// dependency nobody remembers to inject.
// ============================================================================

import type { ClockCapability } from "../runtime/capabilities.js";

export class SystemClock implements ClockCapability {
  readonly kind = "clock" as const;

  now(): number {
    return Date.now();
  }

  delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(t);
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

/** A clock that only moves when a test moves it. */
export class ManualClock implements ClockCapability {
  readonly kind = "clock" as const;

  private current: number;
  private waiters: Array<{ at: number; resolve: () => void; reject: (e: Error) => void }> = [];

  constructor(startMs = 0) {
    this.current = startMs;
  }

  now(): number {
    return this.current;
  }

  delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const entry = { at: this.current + ms, resolve, reject };
      this.waiters.push(entry);
      const onAbort = () => {
        this.waiters = this.waiters.filter((w) => w !== entry);
        reject(new Error("aborted"));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  /** Move time forward and release everything that was waiting for it. */
  advance(ms: number): void {
    this.current += ms;
    const due = this.waiters.filter((w) => w.at <= this.current);
    this.waiters = this.waiters.filter((w) => w.at > this.current);
    for (const w of due) w.resolve();
  }
}
