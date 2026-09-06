#!/usr/bin/env node
/**
 * Build the .zst corpus the Ranger decoder is tested against.
 *
 * Node's own zstd writes the fixtures, so every case is a stream some
 * other implementation produced — a decoder tested only against its own
 * encoder proves nothing.
 *
 * What each case has to decode to is recorded in `manifest.txt` as a length
 * and a CRC-32, which is what the suite checks. Cases small enough to read
 * also get a `name.raw`, so a failure there can be pointed at a byte rather
 * than at a checksum; the corpus would be two megabytes if every case did.
 */
const RAW_LIMIT = 10000;
import { zstdCompressSync } from "node:zlib";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "fixtures");
mkdirSync(out, { recursive: true });

// A deterministic pseudo-random source: the corpus has to be the same on
// every machine or a failure cannot be reproduced from the fixture name.
let seed = 0x2f6e2b1;
const rnd = () => {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5; seed >>>= 0;
  return seed;
};
const randomBytes = (n) => {
  const b = Buffer.alloc(n);
  for (let i = 0; i < n; i++) b[i] = rnd() & 255;
  return b;
};

const words = ["ranger", "zstd", "figma", "kiwi", "evg", "buffer", "sequence", "literal"];
const prose = (n) => {
  const parts = [];
  let len = 0;
  while (len < n) {
    const w = words[rnd() % words.length];
    parts.push(w);
    len += w.length + 1;
  }
  return Buffer.from(parts.join(" ").slice(0, n));
};

const cases = {
  // Nothing at all: a frame with a single empty block.
  empty: Buffer.alloc(0),
  // One byte, and a run — these come out as RLE blocks.
  one: Buffer.from("R"),
  rle: Buffer.alloc(5000, 0x41),
  // Incompressible: raw blocks, no literals table, no sequences.
  random: randomBytes(9000),
  // Short enough that the encoder keeps the predefined FSE tables.
  short: Buffer.from("hello hello hello hello world"),
  // Text: Huffman literals plus sequences with sent tables.
  prose: prose(60000),
  // Long runs make matches whose offset is smaller than their length,
  // which is the overlapping-copy path.
  runs: Buffer.from("ab".repeat(20000) + "c" + "xyz".repeat(9000)),
  // Bigger than one block (128 KiB), so matches reach into earlier blocks
  // and the tables are repeated rather than re-sent.
  multiblock: Buffer.concat([prose(200000), randomBytes(1000), prose(120000)]),
};

// Adler-32 rather than CRC-32: every intermediate stays well inside a
// signed 32-bit int, so the number in the manifest means the same thing on
// a target whose int is 32 bits as on one whose int is 64.
const adler32 = (buf) => {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return b * 65536 + a;
};

const manifest = [];
function record(name, raw, packed) {
  writeFileSync(join(out, name + ".zst"), packed);
  const rawPath = join(out, name + ".raw");
  rmSync(rawPath, { force: true });
  if (raw.length <= RAW_LIMIT) writeFileSync(rawPath, raw);
  manifest.push(name + " " + raw.length + " " + adler32(raw));
  console.log(name.padEnd(18), String(raw.length).padStart(8), "->", String(packed.length).padStart(8));
}

for (const [name, raw] of Object.entries(cases)) {
  for (const level of [1, 9, 19]) {
    record(level === 1 ? name : name + "-l" + level, raw, zstdCompressSync(raw, { params: { 100: level } }));
  }
}

// The stream this whole project exists for: the message chunk of a real
// Figma export. A .fig is a ZIP around canvas.fig, and canvas.fig is a
// prelude, a DEFLATE'd schema chunk and a zstd'd message chunk.
import { readFileSync } from "node:fs";
import { inflateRawSync, zstdDecompressSync } from "node:zlib";

/** The one entry of a ZIP whose name ends in `suffix`, decompressed. */
function zipEntry(zip, suffix) {
  let eocd = zip.length - 22;
  while (eocd >= 0 && zip.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("no end-of-central-directory record");
  let at = zip.readUInt32LE(eocd + 16);
  const count = zip.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(at + 10);
    const compressed = zip.readUInt32LE(at + 20);
    const nameLen = zip.readUInt16LE(at + 28);
    const extraLen = zip.readUInt16LE(at + 30);
    const commentLen = zip.readUInt16LE(at + 32);
    const localAt = zip.readUInt32LE(at + 42);
    const name = zip.toString("latin1", at + 46, at + 46 + nameLen);
    if (name.endsWith(suffix)) {
      const dataAt = localAt + 30 + zip.readUInt16LE(localAt + 26) + zip.readUInt16LE(localAt + 28);
      const raw = zip.subarray(dataAt, dataAt + compressed);
      return method === 8 ? inflateRawSync(raw) : raw;
    }
    at += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("no entry ending in " + suffix);
}

// Frame shapes the corpus above never produces: a checksum to skip past, a
// header with no content size, several frames end to end, and a skippable
// frame in front of a real one. Each is a place a decoder can lose its
// place in the byte stream rather than decode anything wrongly.
import { constants } from "node:zlib";
const shaped = Buffer.from("checksum me ".repeat(500));
record("checksum", shaped, zstdCompressSync(shaped, { params: { [constants.ZSTD_c_checksumFlag]: 1 } }));
record("nosize", shaped, zstdCompressSync(shaped, { params: { [constants.ZSTD_c_contentSizeFlag]: 0 } }));
const a = Buffer.from("first frame ".repeat(40));
const b = Buffer.from("second frame ".repeat(40));
record("twoframes", Buffer.concat([a, b]), Buffer.concat([zstdCompressSync(a), zstdCompressSync(b)]));
const skip = Buffer.alloc(8 + 12);
skip.writeUInt32LE(0x184d2a50, 0);
skip.writeUInt32LE(12, 4);
skip.write("ignore these", 8);
record("skippable", a, Buffer.concat([skip, zstdCompressSync(a)]));

const fig = join(here, "..", "..", "figma", "fixtures", "health.fig");
try {
  const canvas = zipEntry(readFileSync(fig), "canvas.fig");
  let at = 12; // "fig-kiwi" + version
  const chunks = [];
  while (at + 4 <= canvas.length) {
    const len = canvas.readUInt32LE(at);
    at += 4;
    chunks.push(canvas.subarray(at, at + len));
    at += len;
  }
  const message = chunks[1];
  if (message[0] !== 0x28 || message[1] !== 0xb5) throw new Error("chunk 1 is not zstd");
  record("figma-message", zstdDecompressSync(message), message);
} catch (e) {
  console.log("figma-message: skipped —", e.message);
}

manifest.sort();
writeFileSync(join(out, "manifest.txt"), manifest.join("\n") + "\n");
console.log("manifest.txt:", manifest.length, "cases");
