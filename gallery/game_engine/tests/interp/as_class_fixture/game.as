// Fixture: exercises interpreted-.as classes, fluent chaining, `this` mutation,
// object fields, method-to-method calls, and bound-method-reference callbacks.
// Results are written to the shared ABI for the host runner to assert.
import { abiRead, abiWrite } from "@ranger/game";

class Counter {
  n: i32 = 0;
  bump(): void { this.n = this.n + 1; }
  twice(): void { this.bump(); this.bump(); }   // method calling methods
}

class Builder {
  id: i32 = 0;
  sum: i32 = 0;
  hasCb: i32 = 0;
  cb: () => void = () => {};
  set(v: i32): Builder { this.id = v; return this; }        // chaining + this
  add(v: i32): Builder { this.sum = this.sum + v; return this; }
  after(f: () => void): Builder { this.cb = f; this.hasCb = 1; return this; }
  fire(): void { if (this.hasCb == 1) { this.cb(); } }
}

export function init(): void {
  let c = new Counter();
  abiWrite(20, c.n);              // 0 (default field)
  c.twice();
  abiWrite(24, c.n);             // 2 (method->method mutation)

  let b = new Builder();
  b.set(7).add(10).add(5).after(c.bump);   // fluent chain + bound-method ref
  abiWrite(28, b.id);           // 7
  abiWrite(32, b.sum);          // 15
  b.fire();
  b.fire();
  abiWrite(36, c.n);            // 4 (2 + two callback fires)
}
export function update(): void {}
