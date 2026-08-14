#!/usr/bin/env node
// image-js: another pure-JS image library with JPEG encode/decode.
const { Image } = require("image-js");

async function main() {
  const width = parseInt(process.argv[2], 10);
  const input = process.argv[3];
  const output = process.argv[4];
  if (!width || !input || !output) {
    console.error("usage: scale-imagejs.cjs <width> <input.jpg> <output.jpg>");
    process.exit(2);
  }
  const img = await Image.load(input);
  const height = Math.max(1, Math.round((img.height * width) / img.width));
  const resized = img.resize({ width, height });
  await resized.save(output, { format: "jpg", encoder: { quality: 85 } });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
