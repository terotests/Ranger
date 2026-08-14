#!/usr/bin/env node
// sharp: the usual Node.js choice. Native addon over libvips, not pure JS.
const sharp = require("sharp");

async function main() {
  const width = parseInt(process.argv[2], 10);
  const input = process.argv[3];
  const output = process.argv[4];
  if (!width || !input || !output) {
    console.error("usage: scale-sharp.cjs <width> <input.jpg> <output.jpg>");
    process.exit(2);
  }
  await sharp(input)
    .resize({ width })
    .jpeg({ quality: 85 })
    .toFile(output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
