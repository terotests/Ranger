// ============================================================================
// shared_modules_test.mjs — unit tests for app/src/shared/**.
// ============================================================================
//
//   node gallery/game_engine/v2/mesh_editor/tests/unit/shared_modules_test.mjs
//
// The shared modules are the ones every feature now depends on, so they are
// exactly where a silent behaviour change does the most damage. The browser e2e
// would eventually notice a wrong matrix, but only as "the mesh looks different"
// — these pin the actual contracts.
//
// Two contracts here are load-bearing and were the reason the extraction was
// risky in the first place:
//
//  * rotateFlatXyzInPlace MUTATES, rotateFlatXyzCopy does NOT. The function this
//    replaced was documented "in place" while it actually copied, and its
//    callers depended on the copy. Swapping them silently corrupts the
//    authoring-space mesh, which is invisible until a save round-trip.
//  * useDragGesture holds ONE drag at a time. It replaced four independent
//    boolean/ref flags where "dragging a knot AND translating" was
//    representable; the point of the change is that those states no longer
//    exist, so that is asserted rather than assumed.
//
// Plain Node, no test framework, no Vue — the composable is deliberately
// framework-free so it can be tested like any other function.
// ============================================================================

import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, "../../app/src/shared");
const imp = (rel) => import(url.pathToFileURL(path.join(SHARED, rel)).href);

const {
  mat3MulXYZ,
  mat3MulTuple,
  transposeMat3,
  unit3,
  rodrigues,
  rotateFlatXyzInPlace,
  rotateFlatXyzCopy,
} = await imp("math/mat3.js");
const { lerp, clamp, clamp01 } = await imp("math/scalar.js");
const { hexToRgb, hexToInt, mixHex, mulColorHex, roughnessToShininess } =
  await imp("math/color.js");
const { useDragGesture } = await imp("canvas/useDragGesture.js");
// pathModel is a feature module, not shared/, but rotatePath is pure geometry
// that the texture Rotate tool depends on, so it is pinned here too.
const LIB = path.resolve(HERE, "../../app/src/lib");
const { rotatePath, pathCentroid } = await import(
  url.pathToFileURL(path.join(LIB, "pathModel.js")).href
);

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
function checkNear(name, got, want, eps = 1e-9) {
  check(name, near(got, want, eps), `got=${got} want=${want}`);
}

// ---------------------------------------------------------------------------
// mat3
// ---------------------------------------------------------------------------
const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
// 90 degrees about +Y, row-major: +X -> -Z.
const ROT_Y90 = [0, 0, 1, 0, 1, 0, -1, 0, 0];

{
  const p = mat3MulXYZ(IDENT, 1, 2, 3);
  check("identity leaves a vector alone", p.x === 1 && p.y === 2 && p.z === 3);

  const r = mat3MulXYZ(ROT_Y90, 1, 0, 0);
  check("Y90 maps +X to -Z", near(r.x, 0) && near(r.y, 0) && near(r.z, -1), JSON.stringify(r));

  const t = mat3MulTuple(ROT_Y90, [1, 0, 0]);
  check(
    "tuple form agrees with object form",
    near(t[0], r.x) && near(t[1], r.y) && near(t[2], r.z),
    JSON.stringify(t),
  );

  // Row-major convention: transpose must be the inverse for a pure rotation.
  const back = mat3MulXYZ(transposeMat3(ROT_Y90), r.x, r.y, r.z);
  check(
    "transpose inverts a pure rotation",
    near(back.x, 1) && near(back.y, 0) && near(back.z, 0),
    JSON.stringify(back),
  );
}

{
  const fb = { x: 0, y: 1, z: 0 };
  const u = unit3(0, 0, 5, fb);
  check("unit3 normalises", near(u.x, 0) && near(u.y, 0) && near(u.z, 1));
  check("unit3 falls back on a zero vector", unit3(0, 0, 0, fb) === fb);
  check("unit3 falls back on NaN", unit3(NaN, 0, 0, fb) === fb);
}

{
  // Rodrigues about +Y by 90 degrees must match the equivalent matrix.
  const ct = Math.cos(Math.PI / 2);
  const st = Math.sin(Math.PI / 2);
  const r = rodrigues({ x: 1, y: 0, z: 0 }, 0, 1, 0, ct, st);
  const m = mat3MulXYZ(ROT_Y90, 1, 0, 0);
  check(
    "rodrigues about +Y agrees with the Y90 matrix",
    near(r.x, m.x, 1e-12) && near(r.y, m.y, 1e-12) && near(r.z, m.z, 1e-12),
    `${JSON.stringify(r)} vs ${JSON.stringify(m)}`,
  );
  const same = rodrigues({ x: 0, y: 3, z: 0 }, 0, 1, 0, ct, st);
  check(
    "rodrigues leaves the axis itself unchanged",
    near(same.x, 0, 1e-12) && near(same.y, 3, 1e-12) && near(same.z, 0, 1e-12),
    JSON.stringify(same),
  );
}

{
  // The mutate-vs-copy contract. This is the one that silently corrupts meshes.
  const src = [1, 0, 0, 0, 0, 1];
  const copyOut = rotateFlatXyzCopy(src, ROT_Y90);
  check("rotateFlatXyzCopy returns a new array", copyOut !== src);
  check(
    "rotateFlatXyzCopy leaves the input untouched",
    src[0] === 1 && src[1] === 0 && src[2] === 0 && src[5] === 1,
    JSON.stringify(src),
  );
  check(
    "rotateFlatXyzCopy rotated every vertex",
    near(copyOut[2], -1) && near(copyOut[3], 1),
    JSON.stringify(copyOut),
  );

  const mut = [1, 0, 0];
  const mutOut = rotateFlatXyzInPlace(mut, ROT_Y90);
  check("rotateFlatXyzInPlace returns the same array", mutOut === mut);
  check("rotateFlatXyzInPlace mutated it", near(mut[2], -1), JSON.stringify(mut));

  check("empty buffers pass through", rotateFlatXyzCopy([], IDENT).length === 0);
}

// ---------------------------------------------------------------------------
// scalar
// ---------------------------------------------------------------------------
checkNear("lerp midpoint", lerp(0, 10, 0.5), 5);
checkNear("lerp endpoints are exact", lerp(3, 7, 1), 7);
checkNear("lerp extrapolates (t is not clamped)", lerp(0, 10, 2), 20);
checkNear("clamp low", clamp(-5, 0, 1), 0);
checkNear("clamp high", clamp(5, 0, 1), 1);
checkNear("clamp inside", clamp(0.25, 0, 1), 0.25);
checkNear("clamp01 low", clamp01(-1), 0);
checkNear("clamp01 high", clamp01(2), 1);

// ---------------------------------------------------------------------------
// colour
// ---------------------------------------------------------------------------
{
  const c = hexToRgb("#3366ff");
  check("hexToRgb 6-digit", c.r === 0x33 && c.g === 0x66 && c.b === 0xff, JSON.stringify(c));
  const s = hexToRgb("#f0a");
  check("hexToRgb expands 3-digit", s.r === 0xff && s.g === 0x00 && s.b === 0xaa, JSON.stringify(s));
  const noHash = hexToRgb("3366ff");
  check("hexToRgb tolerates a missing #", noHash.r === 0x33 && noHash.b === 0xff);
  const bad = hexToRgb(null);
  check("hexToRgb falls back to white, not NaN", bad.r === 255 && bad.g === 255 && bad.b === 255);

  check("hexToInt packs", hexToInt("#010203") === 0x010203);
  check("mixHex at t=0 is the first colour", mixHex("#000000", "#ffffff", 0) === 0x000000);
  check("mixHex at t=1 is the second colour", mixHex("#000000", "#ffffff", 1) === 0xffffff);
  const mid = mixHex("#000000", "#ffffff", 0.5);
  check("mixHex midpoint is mid grey", mid === 0x808080, mid.toString(16));

  check("mulColorHex white short-circuits (left)", mulColorHex(0xffffff, 0x123456) === 0x123456);
  check("mulColorHex white short-circuits (right)", mulColorHex(0x123456, 0xffffff) === 0x123456);
  check("mulColorHex black annihilates", mulColorHex(0x000000, 0x123456) === 0x000000);
  const half = mulColorHex(0x808080, 0xffffff);
  check("mulColorHex tint by mid grey stays mid grey", half === 0x808080, half.toString(16));

  check("roughnessToShininess is monotonic down", roughnessToShininess(0) > roughnessToShininess(1));
  check("roughnessToShininess clamps out-of-range", near(roughnessToShininess(-1), roughnessToShininess(0)));
}

// ---------------------------------------------------------------------------
// useDragGesture — the "one drag at a time" contract
// ---------------------------------------------------------------------------
{
  // Minimal element stand-in that records capture/release.
  const captured = [];
  const released = [];
  const el = {
    setPointerCapture: (id) => captured.push(id),
    releasePointerCapture: (id) => released.push(id),
  };
  const drag = useDragGesture({ element: () => el });

  check("idle: nothing is active", !drag.isActive() && drag.kind() === null);
  check("idle: payloadOf is null", drag.payloadOf("knot") === null);

  drag.begin("knot", { id: "k1" }, { pointerId: 7 });
  check("begin sets the kind", drag.kind() === "knot");
  check("begin captures the pointer", captured.includes(7));
  check("isActive() with no args means 'any drag'", drag.isActive());
  check("isActive filters by kind", drag.isActive("knot") && !drag.isActive("child"));
  check("isActive accepts several kinds", drag.isActive("child", "knot"));
  check("payloadOf returns the payload", drag.payloadOf("knot").id === "k1");
  check("payloadOf on a different kind is null", drag.payloadOf("translate") === null);

  // The invariant: starting another drag REPLACES, never coexists.
  drag.begin("translate", { x: 1, y: 2 }, { pointerId: 8 });
  check("a second begin replaces the first", drag.kind() === "translate");
  check("the superseded kind is no longer active", !drag.isActive("knot"));
  check("...and its payload is gone", drag.payloadOf("knot") === null);

  drag.setPayload({ x: 9, y: 9 });
  check("setPayload updates the live drag", drag.payloadOf("translate").x === 9);

  const was = drag.end({ pointerId: 8 });
  check("end returns what was active", was && was.kind === "translate");
  check("end releases the pointer", released.includes(8));
  check("end clears the state", !drag.isActive() && drag.kind() === null);
  check("end on an idle gesture returns null", drag.end() === null);

  // A missing element must not throw — the canvas ref is null before mount.
  const orphan = useDragGesture();
  orphan.begin("knot", null, { pointerId: 1 });
  check("works with no element (pre-mount)", orphan.isActive("knot"));
  orphan.end({ pointerId: 1 });
  check("...and ends cleanly", !orphan.isActive());

  // A hostile element that throws on capture must not break the gesture.
  const throwy = useDragGesture({
    element: () => ({
      setPointerCapture() {
        throw new Error("denied");
      },
      releasePointerCapture() {
        throw new Error("denied");
      },
    }),
  });
  throwy.begin("orbit", null, { pointerId: 2 });
  check("capture failure does not abort the drag", throwy.isActive("orbit"));
  check("release failure does not abort the end", throwy.end({ pointerId: 2 }).kind === "orbit");
}


// ---------------------------------------------------------------------------
// rotatePath — the texture editor's Rotate tool
//
// Rigidity is the whole contract: knots turn about the pivot, and Bezier
// handles (stored as OFFSETS from their knot) turn as vectors. Rotate the
// handles about the pivot instead and the curve shears rather than turns,
// which looks almost right and is very hard to spot by eye.
// ---------------------------------------------------------------------------
{
// 90deg CCW about origin: (1,0) -> (0,1)
let k=[{id:"a",x:1,y:0,hx:0,hy:0.5}];
rotatePath(k,0,0,Math.PI/2);
check("point rotates 90deg CCW about origin", near(k[0].x,0,1e-12)&&near(k[0].y,1,1e-12), JSON.stringify(k[0]));
check("handle offset rotates with it", near(k[0].hx,-0.5,1e-12)&&near(k[0].hy,0,1e-12), `${k[0].hx},${k[0].hy}`);

// rotation about a non-origin pivot
let k2=[{id:"b",x:2,y:1,hx:0,hy:0}];
rotatePath(k2,1,1,Math.PI);
check("180deg about (1,1) reflects through the pivot", near(k2[0].x,0,1e-12)&&near(k2[0].y,1,1e-12), JSON.stringify(k2[0]));

// rigidity: distances to pivot preserved, shape preserved
const mk=()=>[{id:"1",x:1,y:0,hx:0,hy:0.3},{id:"2",x:0,y:1,hx:-0.3,hy:0},{id:"3",x:-1,y:0,hx:0,hy:-0.3}];
const a=mk(); const b=mk();
rotatePath(b,0.25,-0.1,0.7);
let rigid=true, shape=true;
for(let i=0;i<a.length;i++){
  const da=Math.hypot(a[i].x-0.25,a[i].y+0.1), db=Math.hypot(b[i].x-0.25,b[i].y+0.1);
  if(!near(da,db,1e-12)) rigid=false;
  if(!near(Math.hypot(a[i].hx,a[i].hy),Math.hypot(b[i].hx,b[i].hy),1e-12)) shape=false;
}
check("every point keeps its distance to the pivot", rigid);
check("handle lengths are preserved (rigid, not sheared)", shape);
// pairwise distances preserved
check("pairwise distances preserved", near(Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y), Math.hypot(b[0].x-b[1].x,b[0].y-b[1].y),1e-12));

// full turn is identity
const c=mk(); rotatePath(c,0.3,0.2,Math.PI*2);
check("a full turn returns the original points", c.every((k,i)=>near(k.x,mk()[i].x,1e-9)&&near(k.y,mk()[i].y,1e-9)));

// inverse undoes
const d=mk(); rotatePath(d,0.3,0.2,0.9); rotatePath(d,0.3,0.2,-0.9);
check("rotating back by -angle restores exactly", d.every((k,i)=>near(k.x,mk()[i].x,1e-9)&&near(k.y,mk()[i].y,1e-9)));

// zero angle is a no-op, and no crash on empty
const e=mk(); rotatePath(e,0,0,0);
check("zero angle is a no-op", e[0].x===1&&e[0].y===0);
rotatePath([],0,0,1); rotatePath(null,0,0,1);
check("empty/null input does not throw", true);

// centroid pivot: rotating about the centroid keeps the centroid put
const g=mk(); const c0=pathCentroid(g); rotatePath(g,c0.x,c0.y,1.1); const c1=pathCentroid(g);
check("rotating about the centroid keeps the centroid fixed", near(c0.x,c1.x,1e-12)&&near(c0.y,c1.y,1e-12));

}

console.log(`passed=${passed} failed=${failed}`);
console.log(failed === 0 ? "ALL PASS" : "SOME FAILED");
process.exit(failed === 0 ? 0 : 1);
