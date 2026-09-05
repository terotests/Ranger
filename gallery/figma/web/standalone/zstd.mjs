/**
 * Install the zstd hook the Ranger FigZstd operator looks for.
 * The decoder itself is fzstd (MIT), the same library OpenFig uses.
 */
import { decompress } from "../vendor/fzstd.mjs";

export function installZstd() {
  globalThis.__figZstdDecompress = (src) => {
    const u8 = src instanceof Uint8Array ? src : new Uint8Array(src);
    return decompress(u8);
  };
}
