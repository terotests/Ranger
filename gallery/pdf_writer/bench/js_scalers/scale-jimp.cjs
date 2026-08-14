#!/usr/bin/env node
// jimp: pure-JS decode / resize / encode (uses jpeg-js internally).
const Jimp = require("jimp");

async function main() {
  const width = parseInt(process.argv[2], 10);
  const input = process.argv[3];
  const output = process.argv[4];
  if (!width || !input || !output) {
    console.error("usage: scale-jimp.cjs <width> <input.jpg> <output.jpg>");
    process.exit(2);
  }
  const img = await Jimp.read(input);
  img.resize(width, Jimp.AUTO, Jimp.RESIZE_BILINEAR);
  img.quality(85);
  await img.writeAsync(output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
