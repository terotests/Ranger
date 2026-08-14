#!/usr/bin/env node
// jpeg-js decode + bilinear resize + jpeg-js encode. Closest "pure JS JPEG
// codec" analog to Ranger's Node target (no extra image framework).
const fs = require("fs");
const jpeg = require("jpeg-js");

function bilinearResize(src, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const xRatio = (srcW - 1) / Math.max(dstW - 1, 1);
  const yRatio = (srcH - 1) / Math.max(dstH - 1, 1);
  for (let y = 0; y < dstH; y++) {
    const fy = y * yRatio;
    const y0 = fy | 0;
    const y1 = y0 + 1 < srcH ? y0 + 1 : y0;
    const wy = fy - y0;
    for (let x = 0; x < dstW; x++) {
      const fx = x * xRatio;
      const x0 = fx | 0;
      const x1 = x0 + 1 < srcW ? x0 + 1 : x0;
      const wx = fx - x0;
      const i00 = (y0 * srcW + x0) * 4;
      const i10 = (y0 * srcW + x1) * 4;
      const i01 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;
      const o = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const v0 = src[i00 + c] * (1 - wx) + src[i10 + c] * wx;
        const v1 = src[i01 + c] * (1 - wx) + src[i11 + c] * wx;
        dst[o + c] = (v0 * (1 - wy) + v1 * wy + 0.5) | 0;
      }
    }
  }
  return dst;
}

function main() {
  const width = parseInt(process.argv[2], 10);
  const input = process.argv[3];
  const output = process.argv[4];
  if (!width || !input || !output) {
    console.error("usage: scale-jpegjs.cjs <width> <input.jpg> <output.jpg>");
    process.exit(2);
  }
  const decoded = jpeg.decode(fs.readFileSync(input), { useTArray: true });
  const dstW = width;
  const dstH = Math.max(1, Math.round((decoded.height * dstW) / decoded.width));
  const data = bilinearResize(
    decoded.data,
    decoded.width,
    decoded.height,
    dstW,
    dstH
  );
  const encoded = jpeg.encode({ data, width: dstW, height: dstH }, 85);
  fs.writeFileSync(output, encoded.data);
}

main();
