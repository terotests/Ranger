import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getGeneratedCppCode, getGeneratedRustCode } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_JS = path.join(ROOT_DIR, "bin", "output.js");
const FIXTURES = "tests/fixtures";
const OUT = "tests/.output-ownership";
const GALLERY_OUT = "tests/.output-gallery-ownership";

const JPEG_SCALER =
  "gallery/pdf_writer/src/tools/jpeg_scaler.rgr";

/**
 * Compile a fixture with the -strict-ownership flag and return compiler stdout,
 * which contains the inferred per-parameter OwnershipKind summary.
 */
function inferOwnership(
  sourceFile: string,
  options?: { outDir?: string; outFile?: string; timeoutMs?: number }
): string {
  const outDir = options?.outDir ?? OUT;
  const outFile = options?.outFile ?? "ownership.js";
  const env = {
    ...process.env,
    RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
  };
  const cmd = `node "${OUTPUT_JS}" -es6 -strict-ownership "./${sourceFile}" -nodecli -d="${outDir}" -o="${outFile}"`;
  return execSync(cmd, {
    cwd: ROOT_DIR,
    env,
    encoding: "utf-8",
    timeout: options?.timeoutMs ?? 30000,
    stdio: ["pipe", "pipe", "pipe"],
  }).toString();
}

function countOwnershipFunctions(stdout: string): number {
  return (stdout.match(/ownership\[infer\] fn /g) ?? []).length;
}

describe("Ranger Compiler - ownership inference", () => {
  const out = inferOwnership(`${FIXTURES}/llvm_ownership_infer.rgr`);

  it("compiles cleanly with -strict-ownership", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
  });

  it("infers ownership transfer for field store (parent.left = child)", () => {
    expect(out).toContain("param 'child' -> moved (parent.left)");
  });

  it("infers the owner object itself is only borrowed", () => {
    expect(out).toContain("param 'parent' -> borrowed");
  });

  it("infers ownership transfer for push into a member collection (push tokens t)", () => {
    expect(out).toContain("param 't' -> moved (tokens)");
  });

  it("treats primitive parameters as borrowed, never moved", () => {
    expect(out).toContain("param 'v' -> borrowed");
    expect(out).not.toContain("param 'v' -> moved");
  });

  it("treats read-only object parameters as borrowed", () => {
    expect(out).toContain("param 'a' -> borrowed");
    expect(out).toContain("param 'b' -> borrowed");
  });
});

describe("Ranger Compiler - ownership escape forms (PLAN_OWNERSHIP_SOUNDNESS 2-6)", () => {
  const out = inferOwnership(`${FIXTURES}/ownership_escape_forms.rgr`, {
    outFile: "escape_forms.js",
  });

  it("compiles cleanly with -strict-ownership", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
  });

  it("counts the short form of a member store (last = p)", () => {
    expect(out).toContain("fn shortStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts a store through a local alias (def q p; this.last = q)", () => {
    expect(out).toContain("fn aliasStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts a store behind unwrap (this.last = (unwrap maybe))", () => {
    expect(out).toContain("fn unwrapStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts the value of a map set, not the key (set slots \"x\" p)", () => {
    expect(out).toContain("fn mapStore:\n  param 'p' -> moved (slots)");
  });

  it("propagates the callee summary through a method call (this.keep(p))", () => {
    expect(out).toContain("fn viaMethod:\n  param 'p' -> moved (call keep.p)");
  });

  it("propagates the callee summary through a static call", () => {
    expect(out).toContain("fn viaStatic:\n  param 'p' -> moved (call staticKeep.p)");
  });

  it("keeps a read-only parameter borrowed even when the function calls out", () => {
    expect(out).toContain("fn readAndCall:\n  param 'p' -> borrowed");
  });

  it("never marks a primitive argument as escaping through a call", () => {
    expect(out).not.toContain("param 'idx' -> unknown");
    expect(out).not.toContain("param 'idx' -> moved");
  });
});

describe("a local stored for the last time is moved, and built as a value", () => {
  const out = inferOwnership(`${FIXTURES}/ownership_local_move.rgr`, {
    outFile: "local_move.js",
  });
  const rs = getGeneratedRustCode(`${FIXTURES}/ownership_local_move.rgr`);

  it("compiles the fixture to Rust", () => {
    expect(rs.success, `Compile failed: ${rs.error}`).toBe(true);
  });

  it("keeps the pushed class a value when the name does not outlive the push", () => {
    expect(out).toContain("ownership[rust] class Line -> value");
    expect(rs.code).toContain("lines: Vec<Line>");
  });

  it("moves the local into the collection instead of copying it", () => {
    expect(rs.code).toContain("self.lines.push(line);");
    expect(rs.code).not.toContain("self.lines.push(line.clone());");
  });

  it("builds the finished value rather than default-constructing and writing", () => {
    // the run covers every field, so there is no `..Line::new()` base, and a
    // value that is the field's own name takes the shorthand form
    expect(rs.code).toMatch(/let mut line: Line = Line \{\s*\n\s*name,\s*\n\s*cents,\s*\n\s*qty,\s*\n\s*\};/);
    expect(rs.code).not.toContain("let mut line: Line = Line::new();");
  });

  it("still shares a class whose stored object is handed back out", () => {
    // Keeper.first returns the stored Held, so the collection is not its only
    // owner and `add` keeps its copy
    expect(out).toContain(
      "ownership[rust] class Held -> Rc<RefCell> (returns a stored object from first)"
    );
    expect(rs.code).toContain("self.held.push(h.clone());");
  });
});

describe("Ranger Compiler - borrowed const& call-site copy (PLAN_OWNERSHIP_SOUNDNESS 1)", () => {
  const result = getGeneratedCppCode(`${FIXTURES}/ownership_alias_call.rgr`);

  it("compiles the fixture to C++", () => {
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("keeps the borrowed parameter as const std::shared_ptr<T>&", () => {
    expect(result.code).toContain(
      "use( const std::shared_ptr<Node>& p )"
    );
  });

  it("wraps a member-field argument in a call-time copy", () => {
    // Binding the member itself would let the callee's reset() swap the
    // object under the reference (and a vector element case is a
    // use-after-free); the copy pins the call-time object.
    expect(result.code).toMatch(/use\(std::shared_ptr<Node>\(\(?h->item\)?\)\)/);
  });

  it("does not copy a stable local argument", () => {
    expect(result.code).toContain("use(orig)");
    expect(result.code).not.toContain("use(std::shared_ptr<Node>(orig))");
  });
});

describe("Ranger Compiler - class sharing analysis (PLAN_RUST_OWNERSHIP 2)", () => {
  const counter = inferOwnership(`${FIXTURES}/ownership_sharing_counter.rgr`, {
    outFile: "sharing_counter.js",
  });
  const weak = inferOwnership(`${FIXTURES}/ownership_sharing_weak.rgr`, {
    outFile: "sharing_weak.js",
  });
  const jpeg = inferOwnership(JPEG_SCALER, {
    outDir: GALLERY_OUT,
    outFile: "jpeg_sharing.js",
    timeoutMs: 120000,
  });

  it("marks a class aliased by a def and mutated through the alias", () => {
    expect(counter).toContain(
      "ownership[rust] class Counter -> Rc<RefCell> (aliased and mutated in main)"
    );
  });

  it("marks the target of a weak field (a Weak needs an Rc to downgrade)", () => {
    expect(weak).toContain(
      "ownership[rust] class Parent -> Rc<RefCell> (weak field Child.parent)"
    );
  });

  it("marks a class whose objects a callee stores", () => {
    expect(weak).toContain(
      "ownership[rust] class Child -> Rc<RefCell> (stored via adopt.c)"
    );
  });

  it("keeps never-shared classes as plain values", () => {
    // 16 of the 22 jpeg_scaler classes never share an object. The six
    // exceptions are exactly the codec's mutable state — the classes that
    // had to become references before the flag-on Rust binary produced the
    // byte-identical image.
    expect(jpeg).toContain("ownership[rust] class Color -> value");
    expect(jpeg).toContain(
      "ownership[rust] class BufferChunk -> Rc<RefCell> (stored in allocateNewChunk)"
    );
    expect(jpeg).toContain(
      "ownership[rust] class HuffmanTable -> Rc<RefCell> (returns a stored object from getDCTable)"
    );
    expect(jpeg).toContain("ownership[rust] class CoeffBuffer -> Rc<RefCell>");
    expect(jpeg).toContain("ownership[rust] class JPEGComponent -> Rc<RefCell>");
    expect(jpeg).toContain("ownership[rust] class QuantizationTable -> Rc<RefCell>");
    expect(jpeg).toContain("ownership[rust] class ExifTag -> Rc<RefCell>");
    const shared = (jpeg.match(/ownership\[rust\] class .* -> Rc<RefCell>/g) ?? []).length;
    expect(shared).toBe(6);
  });
});

describe("Ranger Compiler - Rust &T for proven-borrowed params (PLAN_RUST_OWNERSHIP 1)", () => {
  // The fixture's Node is stored and weak-referenced, so the sharing default
  // would make it Rc<RefCell<Node>>; the &T layer belongs to the value model,
  // which stays testable behind -rust-value-classes.
  const result = getGeneratedRustCode(
    `${FIXTURES}/llvm_ownership_infer.rgr`,
    undefined,
    "-rust-value-classes"
  );

  it("compiles the fixture to Rust", () => {
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("passes a borrowed object parameter as &T", () => {
    expect(result.code).toContain("fn sum_value(&self, a: &Node, b: &Node)");
  });

  it("takes &x at the call site instead of a whole-struct clone", () => {
    expect(result.code).toContain("sum_value(&root, &child)");
    expect(result.code).not.toContain("sum_value(root.clone(), child.clone())");
  });

  it("keeps a moved parameter owned", () => {
    expect(result.code).toContain("fn add_token(&mut self, mut t: Node)");
  });
});

describe("Ranger Compiler - Rc<RefCell> for shared classes, the Rust default (PLAN_RUST_OWNERSHIP 2b)", () => {
  const outDir = "tests/.output-ownership-rust";
  const env = {
    ...process.env,
    RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
  };
  execSync(
    `node "${OUTPUT_JS}" -l=rust -rust-shared-classes "./${FIXTURES}/ownership_shared_counter.rgr" -d="${outDir}" -o="shared_counter.rs"`,
    { cwd: ROOT_DIR, env, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const flagged = fs.readFileSync(
    path.join(ROOT_DIR, outDir, "shared_counter.rs"),
    "utf-8"
  );
  execSync(
    `node "${OUTPUT_JS}" -l=rust -rust-value-classes "./${FIXTURES}/ownership_shared_counter.rgr" -d="${outDir}" -o="plain_counter.rs"`,
    { cwd: ROOT_DIR, env, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const plain = fs.readFileSync(
    path.join(ROOT_DIR, outDir, "plain_counter.rs"),
    "utf-8"
  );
  execSync(
    `node "${OUTPUT_JS}" -l=rust "./${FIXTURES}/ownership_shared_counter.rgr" -d="${outDir}" -o="default_counter.rs"`,
    { cwd: ROOT_DIR, env, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const bareDefault = fs.readFileSync(
    path.join(ROOT_DIR, outDir, "default_counter.rs"),
    "utf-8"
  );

  it("wraps a shared class in Rc<RefCell<T>> and aliases by cloning the Rc", () => {
    // `def b:Counter a` must give both names one cell — this is the program
    // the docs use to define the object model, and it now compiles on Rust
    // and prints `a 1` like every other target.
    expect(flagged).toContain(
      "let mut a: Rc<RefCell<Counter>> = Rc::new(RefCell::new(Counter::new()));"
    );
    expect(flagged).toContain("let mut b: Rc<RefCell<Counter>> = a.clone();");
    // The call hands the method the CELL, not a borrow of it. A `&self`
    // receiver would hold that borrow for the whole call, and anything the
    // body reached could come back to the same object — which is what made
    // the Rust self-host panic on the first file it was ever given
    // (docs/plans/PLAN_RUST_REENTRANCY.md). Every instance method of a shared
    // class takes the handle instead and borrows one statement at a time.
    expect(flagged).toContain("Counter::add(&b, 1);");
    expect(flagged).toContain(
      "fn add(__self_rc: &Rc<RefCell<Counter>>, amount: i64)"
    );
    expect(flagged).toContain("__self_rc.borrow_mut().value += amount;");
  });

  it("is the default: a bare -l=rust build equals the flag-on build", () => {
    expect(bareDefault).toBe(flagged);
  });

  it("keeps the plain-struct model behind -rust-value-classes", () => {
    expect(plain).toContain("let mut b: Counter = a;");
    expect(plain).not.toContain("Rc<RefCell<Counter>>");
  });

  // ...and it has to COMPILE. Every assertion above is a substring, and a
  // substring test cannot see a signature and a call site that disagree: the
  // free `fn main` was given the hidden __self_rc while the crate entry
  // called it with none, so this file failed with E0061 while the shape
  // assertions all passed. rustc is the only check that catches that.
  const HAS_RUSTC = (() => {
    try {
      execSync("rustc --version", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  })();

  it.skipIf(!HAS_RUSTC)("and the shared-object program compiles and runs", () => {
    const rs = path.join(ROOT_DIR, outDir, "shared_counter.rs");
    const bin = path.join(ROOT_DIR, outDir, "shared_counter_bin");
    execSync(`rustc --edition 2021 -o "${bin}" "${rs}"`, { stdio: "pipe" });
    // the program the docs are written around prints `a 1` on every target
    expect(execSync(bin, { encoding: "utf-8" }).trim()).toBe("a 1");
  }, 120000);

  it.skipIf(!HAS_RUSTC)("and so does the weak back-reference program", () => {
    const rs = path.join(ROOT_DIR, outDir, "shared_weak.rs");
    execSync(
      `rustc --edition 2021 --emit=metadata --crate-type bin -o /dev/null "${rs}"`,
      { stdio: "pipe" }
    );
  }, 120000);

  execSync(
    `node "${OUTPUT_JS}" -l=rust -rust-shared-classes "./${FIXTURES}/ownership_shared_weak.rgr" -d="${outDir}" -o="shared_weak.rs"`,
    { cwd: ROOT_DIR, env, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const weakRs = fs.readFileSync(
    path.join(ROOT_DIR, outDir, "shared_weak.rs"),
    "utf-8"
  );

  it("passes the receiver's Rc to a method that uses `this` as a value", () => {
    // `c.parent = this` needs the Rc that holds the receiver, and a `&mut
    // self` receiver cannot reach it. The method takes the hidden __self_rc
    // INSTEAD of a receiver — see above — and the call site passes the
    // receiver's cell.
    expect(weakRs).toContain(
      "fn adopt(__self_rc: &Rc<RefCell<Parent>>, mut c: Rc<RefCell<Child>>)"
    );
    expect(weakRs).toContain("adopt(&p, c.clone())");
  });

  it("downgrades the live Rc for a weak back reference, never a fresh cell", () => {
    expect(weakRs).toContain("parent = Some(Rc::downgrade(__self_rc));");
    expect(weakRs).not.toContain("Rc::downgrade(&Rc::new(RefCell::new(self))");
  });

  it("gives a collection of a shared class Rc elements", () => {
    expect(weakRs).toContain("kids: Vec<Rc<RefCell<Child>>>");
  });

  it("upgrades a weak read to the Rc itself, with no extra cell", () => {
    // This program compiles with rustc and prints `papa`, the same as the
    // ES6 output — the weak back reference is alive and readable. The read
    // borrows shared, so two reads of one cell can overlap.
    expect(weakRs).toContain(
      "let mut back: Rc<RefCell<Parent>> = c.borrow().parent.clone().unwrap().upgrade().unwrap();"
    );
  });

  execSync(
    `node "${OUTPUT_JS}" -l=rust -rust-shared-classes "./${FIXTURES}/ownership_shared_surfaces.rgr" -d="${outDir}" -o="shared_surfaces.rs"`,
    { cwd: ROOT_DIR, env, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const surfacesRs = fs.readFileSync(
    path.join(ROOT_DIR, outDir, "shared_surfaces.rs"),
    "utf-8"
  );

  it("marks a class shared when a getter returns stored state", () => {
    // `def m:Node (b.firstItem())` aliases the stored element; the program
    // compiles with rustc, runs, and prints `yy` like the ES6 output —
    // mutating through one alias is visible through the other.
    expect(surfacesRs).toContain("fn first_item(&self) -> Rc<RefCell<Node>>");
  });

  it("gives a strong optional field of a shared class the Rc form", () => {
    expect(surfacesRs).toContain("current: Option<Rc<RefCell<Node>>>");
  });

  it("takes a call result that is already an Rc without a second cell", () => {
    expect(surfacesRs).toContain("let mut m: Rc<RefCell<Node>> = b.first_item();");
  });

  it("borrows mut for a write and shared for a read of one cell", () => {
    // A write keeps borrow_mut; a read borrows shared, so the print of two
    // aliases of one object does not panic with `RefCell already borrowed`.
    // The literal is bare: `name` only ever receives literals, so the field
    // is a promoted `&'static str` (rust_static_str) and assignment is a
    // pointer copy.
    expect(surfacesRs).toContain('n.borrow_mut().name = "x";');
    expect(surfacesRs).toContain("n.borrow().name");
  });
});

describe("Ranger Compiler - ownership inference on gallery JPEG scaler", () => {
  const out = inferOwnership(JPEG_SCALER, {
    outDir: GALLERY_OUT,
    outFile: "jpeg_scaler.js",
    timeoutMs: 120000,
  });
  const fnCount = countOwnershipFunctions(out);

  it("compiles the full JPEG scaler stack (decoder, encoder, metadata)", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
    expect(
      fs.existsSync(path.join(ROOT_DIR, GALLERY_OUT, "jpeg_scaler.js"))
    ).toBe(true);
  });

  it("runs ownership inference across the whole module graph", () => {
    expect(fnCount).toBeGreaterThanOrEqual(80);
  });

  it("infers file-path parameters as borrowed in decodeJPEG", () => {
    expect(out).toContain("ownership[infer] fn decodeJPEG:");
    expect(out).toContain("param 'filePath' -> borrowed");
  });

  it("resolves every parameter — no unknowns, no warnings", () => {
    // blockIdx (an int) was reported unknown before the primitive filter and
    // the interprocedural fixpoint landed; a primitive can never carry
    // ownership, and every object parameter resolves through the callee
    // summaries in this program.
    expect(out).toContain("param 'blockIdx' -> borrowed");
    expect(out).not.toContain("-> unknown");
    expect(out).not.toContain("WARNING: ownership");
  });

  it("finds the buffer parameters the decoder stores into members", () => {
    expect(out).toContain("param 'buf' -> moved (this.data)");
    expect(out).toContain("param 'bytes' -> moved (this.data)");
  });
});
