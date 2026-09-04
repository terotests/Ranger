/**
 * Optional live comparison against openfig-core.
 * The Pages build does not bundle that package; Node `figma:bench` does.
 */
export async function timeParse(bytes) {
  try {
    const mod = await import("openfig-core");
    const parse = mod.parseFig || mod.parse;
    if (typeof parse !== "function") return null;
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const t0 = performance.now();
    parse(u8);
    return performance.now() - t0;
  } catch {
    return null;
  }
}
