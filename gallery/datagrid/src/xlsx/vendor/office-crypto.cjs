"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DecryptionError: () => DecryptionError,
  Doc97File: () => Doc97File,
  EncryptionError: () => EncryptionError,
  FileFormatError: () => FileFormatError,
  InvalidKeyError: () => InvalidKeyError,
  OOXMLFile: () => OOXMLFile,
  OfficeFile: () => OfficeFile,
  OleFileIO: () => OleFileIO,
  ParseError: () => ParseError,
  Ppt97File: () => Ppt97File,
  Xls97File: () => Xls97File,
  isEncrypted: () => isEncrypted,
  isOleFile: () => isOleFile,
  isOoxml: () => isOoxml
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
function concatBytes(...parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
function utf16leEncode(s) {
  const out = new Uint8Array(s.length * 2);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out[i * 2] = c & 255;
    out[i * 2 + 1] = c >>> 8 & 255;
  }
  return out;
}
function utf16leDecode(b) {
  let s = "";
  for (let i = 0; i + 1 < b.length; i += 2) {
    const c = b[i] | b[i + 1] << 8;
    s += String.fromCharCode(c);
  }
  return s;
}
var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64Decode(s) {
  const clean = s.replace(/\s+/g, "");
  const raw = clean.replace(/=+$/, "");
  const fullGroups = Math.floor(raw.length / 4);
  const remainder = raw.length % 4;
  const outLen = fullGroups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
  const out = new Uint8Array(outLen);
  let oi = 0;
  for (let i = 0; i < raw.length; i += 4) {
    const a = B64_CHARS.indexOf(raw[i]);
    const b = B64_CHARS.indexOf(raw[i + 1]);
    const c = i + 2 < raw.length ? B64_CHARS.indexOf(raw[i + 2]) : 0;
    const d = i + 3 < raw.length ? B64_CHARS.indexOf(raw[i + 3]) : 0;
    const n = a << 18 | b << 12 | c << 6 | d;
    out[oi++] = n >> 16 & 255;
    if (i + 2 < raw.length) out[oi++] = n >> 8 & 255;
    if (i + 3 < raw.length) out[oi++] = n & 255;
  }
  return out;
}
function packU32LE(n) {
  const b = new Uint8Array(4);
  b[0] = n & 255;
  b[1] = n >>> 8 & 255;
  b[2] = n >>> 16 & 255;
  b[3] = n >>> 24 & 255;
  return b;
}
function packU16LE(n) {
  const b = new Uint8Array(2);
  b[0] = n & 255;
  b[1] = n >>> 8 & 255;
  return b;
}
function packU64LE(n) {
  const v = typeof n === "bigint" ? n : BigInt(n);
  const b = new Uint8Array(8);
  const lo = Number(v & 0xffffffffn);
  const hi = Number(v >> 32n & 0xffffffffn);
  b[0] = lo & 255;
  b[1] = lo >>> 8 & 255;
  b[2] = lo >>> 16 & 255;
  b[3] = lo >>> 24 & 255;
  b[4] = hi & 255;
  b[5] = hi >>> 8 & 255;
  b[6] = hi >>> 16 & 255;
  b[7] = hi >>> 24 & 255;
  return b;
}
function readU16LE(b, o = 0) {
  return b[o] | b[o + 1] << 8;
}
function readU32LE(b, o = 0) {
  return (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
}
function readU64LE(b, o = 0) {
  const lo = BigInt(readU32LE(b, o));
  const hi = BigInt(readU32LE(b, o + 4));
  return hi << 32n | lo;
}
function readU16(s) {
  return readU16LE(s.read(2), 0);
}
function readU32(s) {
  return readU32LE(s.read(4), 0);
}
var ByteWriter = class {
  chunks = [];
  len = 0;
  bytes(b) {
    this.chunks.push(b);
    this.len += b.length;
    return this;
  }
  u8(v) {
    this.chunks.push(new Uint8Array([v & 255]));
    this.len += 1;
    return this;
  }
  u16(v) {
    return this.bytes(packU16LE(v));
  }
  u32(v) {
    return this.bytes(packU32LE(v >>> 0));
  }
  u64(v) {
    return this.bytes(packU64LE(v));
  }
  zeros(n) {
    return this.bytes(new Uint8Array(n));
  }
  get length() {
    return this.len;
  }
  build() {
    const out = new Uint8Array(this.len);
    let off = 0;
    for (const c of this.chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }
};
function getBit(bits, i) {
  return bits >>> i & 1;
}
function getBitSlice(bits, i, w) {
  return bits >>> i & (1 << w) - 1;
}
function setBit(bits, i, v) {
  return v ? bits | 1 << i : bits & ~(1 << i);
}
function setBitSlice(bits, i, w, v) {
  const mask = (1 << w) - 1 << i;
  return bits & ~mask | (v & (1 << w) - 1) << i;
}
var BytesIO = class {
  _buf;
  _pos = 0;
  constructor(initial) {
    if (initial === void 0) {
      this._buf = new Uint8Array(0);
    } else if (typeof initial === "number") {
      this._buf = new Uint8Array(initial);
    } else if (initial instanceof ArrayBuffer) {
      this._buf = new Uint8Array(initial);
    } else {
      this._buf = initial;
    }
  }
  get length() {
    return this._buf.length;
  }
  tell() {
    return this._pos;
  }
  seek(offset, whence = 0) {
    if (whence === 0) this._pos = offset;
    else if (whence === 1) this._pos += offset;
    else this._pos = this._buf.length + offset;
    if (this._pos < 0) this._pos = 0;
    return this._pos;
  }
  read(size) {
    const remaining = this._buf.length - this._pos;
    const n = size === void 0 ? remaining : Math.min(size, remaining);
    const out = this._buf.subarray(this._pos, this._pos + n);
    this._pos += n;
    return out;
  }
  /** Returns the entire underlying buffer (does not move position). */
  getValue() {
    return this._buf;
  }
  /**
   * Writes data at the current position, growing the buffer if needed.
   */
  write(data) {
    const needed = this._pos + data.length;
    if (needed > this._buf.length) {
      const next = new Uint8Array(needed);
      next.set(this._buf, 0);
      this._buf = next;
    }
    this._buf.set(data, this._pos);
    this._pos += data.length;
    return data.length;
  }
};

// src/olefile.ts
var MAGIC = new Uint8Array([
  208,
  207,
  17,
  224,
  161,
  177,
  26,
  225
]);
var ENDOFCHAIN = 4294967294;
var FREESECT = 4294967295;
var NOSTREAM = 4294967295;
var UNKNOWN_SIZE = 2147483647;
var STGTY_STORAGE = 1;
var STGTY_STREAM = 2;
var STGTY_ROOT = 5;
var MINIMAL_OLEFILE_SIZE = 1536;
var OleFileError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "OleFileError";
  }
};
var NotOleFileError = class extends OleFileError {
  constructor(message) {
    super(message);
    this.name = "NotOleFileError";
  }
};
function isOleFile(data) {
  if (data.length < MAGIC.length) return false;
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) return false;
  }
  return true;
}
var OleStream = class {
  _buf;
  _pos = 0;
  constructor(buf) {
    this._buf = buf;
  }
  get size() {
    return this._buf.length;
  }
  tell() {
    return this._pos;
  }
  seek(offset, whence = 0) {
    if (whence === 0) this._pos = offset;
    else if (whence === 1) this._pos += offset;
    else this._pos = this._buf.length + offset;
    if (this._pos < 0) this._pos = 0;
    return this._pos;
  }
  read(size) {
    const remaining = this._buf.length - this._pos;
    const n = size === void 0 ? remaining : Math.min(size, remaining);
    const out = this._buf.subarray(this._pos, this._pos + n);
    this._pos += n;
    return out;
  }
  /** Whole stream contents (does not move position). */
  getValue() {
    return this._buf;
  }
};
var OleFileIO = class {
  // Header values
  dllVersion = 0;
  byteOrder = 0;
  sectorShift = 0;
  miniSectorShift = 0;
  firstDirSector = 0;
  miniStreamCutoffSize = 0;
  firstMiniFatSector = 0;
  numMiniFatSectors = 0;
  firstDifatSector = 0;
  numDifatSectors = 0;
  sectorSize = 0;
  miniSectorSize = 0;
  nbSect = 0;
  filesize = 0;
  fp;
  fat = [];
  minifat = null;
  ministream = null;
  writable = false;
  direntries = [];
  root;
  constructor(input) {
    const buf = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    this.fp = buf;
    this.filesize = buf.length;
    this.parseHeader();
    this.loadFat();
    this.loadDirectory();
  }
  /**
   * Return the underlying file bytes. After `writeStream` calls, this reflects
   * the modified container.
   */
  getBuffer() {
    return this.fp;
  }
  /**
   * Make sure `this.fp` is a private writable copy. Called before any
   * `writeStream` mutation.
   */
  ensureWritable() {
    if (this.writable) return;
    const copy = new Uint8Array(this.fp.length);
    copy.set(this.fp, 0);
    this.fp = copy;
    this.writable = true;
  }
  // ---- Header parsing ----
  parseHeader() {
    if (this.filesize < MINIMAL_OLEFILE_SIZE) {
      throw new NotOleFileError("File too small to be an OLE file");
    }
    const header = this.fp.subarray(0, 512);
    for (let i = 0; i < MAGIC.length; i++) {
      if (header[i] !== MAGIC[i]) {
        throw new NotOleFileError("Not an OLE2 structured storage file");
      }
    }
    this.dllVersion = readU16LE(header, 26);
    this.byteOrder = readU16LE(header, 28);
    this.sectorShift = readU16LE(header, 30);
    this.miniSectorShift = readU16LE(header, 32);
    this.firstDirSector = readU32LE(header, 48);
    this.miniStreamCutoffSize = readU32LE(header, 56);
    this.firstMiniFatSector = readU32LE(header, 60);
    this.numMiniFatSectors = readU32LE(header, 64);
    this.firstDifatSector = readU32LE(header, 68);
    this.numDifatSectors = readU32LE(header, 72);
    if (this.byteOrder !== 65534) {
      throw new OleFileError("Unsupported byte order in OLE header");
    }
    if (this.dllVersion !== 3 && this.dllVersion !== 4) {
      throw new OleFileError("Unsupported DLL version in OLE header");
    }
    this.sectorSize = 1 << this.sectorShift;
    this.miniSectorSize = 1 << this.miniSectorShift;
    if (this.sectorSize !== 512 && this.sectorSize !== 4096) {
      throw new OleFileError(
        `Unsupported sector size: ${this.sectorSize}`
      );
    }
    if (this.miniSectorSize !== 64) {
      throw new OleFileError(
        `Unsupported mini sector size: ${this.miniSectorSize}`
      );
    }
    this.nbSect = Math.floor((this.filesize + this.sectorSize - 1) / this.sectorSize) - 1;
  }
  // ---- Sector access ----
  /** Read a full sector by index (from the file allocation space). */
  getSect(sect) {
    const off = this.sectorSize * (sect + 1);
    if (off + this.sectorSize > this.fp.length) {
      return this.fp.subarray(off, this.fp.length);
    }
    return this.fp.subarray(off, off + this.sectorSize);
  }
  // ---- FAT / DIFAT loading ----
  sectorToU32Array(sect) {
    const n = sect.length >> 2;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = readU32LE(sect, i * 4);
    }
    return out;
  }
  /**
   * Walk through one DIFAT-style array of FAT sector pointers and append the
   * referenced FAT sectors to `this.fat`.
   */
  loadFatSect(values) {
    let isect = ENDOFCHAIN;
    for (const raw of values) {
      isect = raw >>> 0;
      if (isect === ENDOFCHAIN || isect === FREESECT) break;
      const sectorBytes = this.getSect(isect);
      const next = this.sectorToU32Array(sectorBytes);
      for (const v of next) this.fat.push(v >>> 0);
    }
    return isect;
  }
  loadFat() {
    const headerSlice = this.fp.subarray(76, 512);
    const headerFatRefs = this.sectorToU32Array(headerSlice);
    this.loadFatSect(headerFatRefs);
    if (this.numDifatSectors !== 0) {
      const slotsPerSector = (this.sectorSize >> 2) - 1;
      let isect = this.firstDifatSector >>> 0;
      for (let i = 0; i < this.numDifatSectors; i++) {
        const sectorBytes = this.getSect(isect);
        const difat = this.sectorToU32Array(sectorBytes);
        this.loadFatSect(difat.slice(0, slotsPerSector));
        isect = difat[slotsPerSector] >>> 0;
        if (isect === ENDOFCHAIN || isect === FREESECT) break;
      }
    }
    if (this.fat.length > this.nbSect) {
      this.fat.length = this.nbSect;
    }
  }
  loadMinifat() {
    if (this.minifat !== null) return;
    const streamSize = this.numMiniFatSectors * this.sectorSize;
    const data = this.openByChain(
      this.firstMiniFatSector,
      streamSize,
      /*forceFat=*/
      true
    );
    const arr = this.sectorToU32Array(data);
    const nbMinisectors = Math.floor(
      (this.root.size + this.miniSectorSize - 1) / this.miniSectorSize
    );
    this.minifat = arr.slice(0, nbMinisectors).map((v) => v >>> 0);
  }
  getMinistream() {
    if (this.ministream !== null) return this.ministream;
    this.ministream = this.openByChain(
      this.root.isectStart,
      this.root.size,
      /*forceFat=*/
      true
    );
    return this.ministream;
  }
  /**
   * Read a full sector chain and return the joined bytes (truncated to size,
   * if known). This is the workhorse used by both stream loading and FAT
   * sub-stream extraction.
   */
  openByChain(start, size, forceFat) {
    const useMinifat = !forceFat && size < this.miniStreamCutoffSize;
    let sectorSize;
    let fat;
    let storage;
    let offset;
    if (useMinifat) {
      this.loadMinifat();
      const ministream = this.getMinistream();
      sectorSize = this.miniSectorSize;
      fat = this.minifat;
      storage = ministream;
      offset = 0;
    } else {
      sectorSize = this.sectorSize;
      fat = this.fat;
      storage = this.fp;
      offset = this.sectorSize;
    }
    let unknownSize = false;
    if (size === UNKNOWN_SIZE) {
      size = fat.length * sectorSize;
      unknownSize = true;
    }
    const nbSectors = Math.floor((size + (sectorSize - 1)) / sectorSize);
    const parts = [];
    let sect = start >>> 0;
    for (let i = 0; i < nbSectors; i++) {
      if (sect === ENDOFCHAIN) {
        if (unknownSize) break;
        throw new OleFileError("Incomplete OLE stream (early ENDOFCHAIN)");
      }
      if (sect >= fat.length) {
        throw new OleFileError(
          `Incorrect OLE FAT sector index ${sect.toString(16)}`
        );
      }
      const sliceStart = offset + sectorSize * sect;
      const sliceEnd = Math.min(sliceStart + sectorSize, storage.length);
      parts.push(storage.subarray(sliceStart, sliceEnd));
      sect = fat[sect] >>> 0;
    }
    let total = 0;
    for (const p of parts) total += p.length;
    const joined = new Uint8Array(total);
    {
      let off = 0;
      for (const p of parts) {
        joined.set(p, off);
        off += p.length;
      }
    }
    if (joined.length >= size) return joined.subarray(0, size);
    return joined;
  }
  // ---- Directory parsing ----
  parseDirEntry(buf, sid) {
    const nameRaw = buf.subarray(0, 64);
    const nameLength = readU16LE(buf, 64);
    const entryType = buf[66];
    const color = buf[67];
    const sidLeft = readU32LE(buf, 68);
    const sidRight = readU32LE(buf, 72);
    const sidChild = readU32LE(buf, 76);
    const clsidBytes = buf.subarray(80, 96);
    const stateBits = readU32LE(buf, 96);
    const createTime = bytesToBigUint64LE(buf, 100);
    const modifyTime = bytesToBigUint64LE(buf, 108);
    const isectStart = readU32LE(buf, 116);
    const sizeLow = readU32LE(buf, 120);
    const sizeHigh = readU32LE(buf, 124);
    const safeNameLen = Math.max(0, Math.min(nameLength, 64) - 2);
    const name = utf16leDecode(nameRaw.subarray(0, safeNameLen));
    let size;
    if (this.sectorSize === 512) {
      size = sizeLow;
    } else {
      size = sizeLow + sizeHigh * 4294967296;
    }
    const isMinifat = entryType === STGTY_STREAM && size > 0 && size < this.miniStreamCutoffSize;
    return {
      sid,
      name,
      entryType,
      color,
      sidLeft,
      sidRight,
      sidChild,
      clsid: formatClsid(clsidBytes),
      stateBits,
      createTime,
      modifyTime,
      isectStart,
      size,
      isMinifat,
      kids: [],
      used: false
    };
  }
  loadDirectory() {
    const dirData = this.openByChain(
      this.firstDirSector,
      UNKNOWN_SIZE,
      /*forceFat=*/
      true
    );
    const maxEntries = Math.floor(dirData.length / 128);
    this.direntries = new Array(maxEntries);
    const loadEntry = (sid) => {
      if (sid < 0 || sid >= maxEntries) {
        throw new OleFileError(
          `OLE directory index out of range: ${sid}`
        );
      }
      const cached = this.direntries[sid];
      if (cached) return cached;
      const entry = this.parseDirEntry(
        dirData.subarray(sid * 128, (sid + 1) * 128),
        sid
      );
      this.direntries[sid] = entry;
      return entry;
    };
    const root = loadEntry(0);
    if (root.entryType !== STGTY_ROOT) {
      throw new OleFileError("First directory entry is not the root entry");
    }
    this.root = root;
    const appendKids = (parent, childSid) => {
      if (childSid === NOSTREAM) return;
      const child = loadEntry(childSid);
      if (child.used) {
        throw new OleFileError("OLE entry referenced more than once");
      }
      child.used = true;
      appendKids(parent, child.sidLeft);
      parent.kids.push(child);
      appendKids(parent, child.sidRight);
      if (child.sidChild !== NOSTREAM) {
        appendKids(child, child.sidChild);
        child.kids.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      }
    };
    if (root.sidChild !== NOSTREAM) {
      appendKids(root, root.sidChild);
      root.kids.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    }
  }
  // ---- Public API ----
  /**
   * Find a directory entry by case-insensitive path. Path may be a string with
   * '/' separators or an array of names.
   */
  find(filename) {
    const parts = typeof filename === "string" ? filename.split("/") : filename;
    let node = this.root;
    for (const name of parts) {
      const lower = name.toLowerCase();
      const next = node.kids.find((k) => k.name.toLowerCase() === lower);
      if (!next) {
        throw new OleFileError(`Stream not found: ${parts.join("/")}`);
      }
      node = next;
    }
    return node;
  }
  /** Return true if the named stream/storage exists in the file. */
  exists(filename) {
    try {
      this.find(filename);
      return true;
    } catch {
      return false;
    }
  }
  /** Get the size of a named stream. */
  getSize(filename) {
    return this.find(filename).size;
  }
  /**
   * Open a named stream and return a read-only `OleStream` that exposes
   * `seek/tell/read`. Mirrors `olefile.openstream`.
   */
  openstream(filename) {
    const entry = this.find(filename);
    if (entry.entryType !== STGTY_STREAM) {
      throw new OleFileError(`Not a stream: ${filename}`);
    }
    if (entry.size === 0) return new OleStream(new Uint8Array(0));
    const data = entry.isMinifat && entry.size < this.miniStreamCutoffSize ? this.openByChain(entry.isectStart, entry.size, false) : this.openByChain(entry.isectStart, entry.size, true);
    return new OleStream(data);
  }
  /**
   * Overwrite the contents of an existing stream with `data`. The new data
   * MUST be exactly the same size as the original — this keeps the FAT chain
   * untouched, which is all we need for the legacy decrypt-in-place flow.
   *
   * Handles both FAT and MiniFAT-allocated streams.
   */
  writeStream(filename, data) {
    const entry = this.find(filename);
    if (entry.entryType !== STGTY_STREAM) {
      throw new OleFileError(`Not a stream: ${filename}`);
    }
    if (data.length !== entry.size) {
      throw new OleFileError(
        `writeStream requires same-sized data (expected ${entry.size}, got ${data.length})`
      );
    }
    this.ensureWritable();
    if (entry.isMinifat && entry.size < this.miniStreamCutoffSize) {
      this.writeStreamMiniFat(entry, data);
    } else {
      this.writeStreamFat(entry, data);
    }
  }
  /** Walk the FAT chain for a stream and overwrite each sector. */
  writeStreamFat(entry, data) {
    let sect = entry.isectStart >>> 0;
    let off = 0;
    const sectorSize = this.sectorSize;
    while (off < data.length) {
      if (sect === ENDOFCHAIN || sect >= this.fat.length) {
        throw new OleFileError("FAT chain ended unexpectedly during write");
      }
      const fileOffset = this.sectorSize + sect * sectorSize;
      const remaining = data.length - off;
      const chunk = data.subarray(off, off + Math.min(sectorSize, remaining));
      this.fp.set(chunk, fileOffset);
      off += chunk.length;
      sect = this.fat[sect] >>> 0;
    }
  }
  /**
   * Mini-streams live inside the root entry's stream (which itself follows the
   * regular FAT). Walk the MiniFAT chain to compute mini-sector positions, map
   * those into FAT positions, and write.
   */
  writeStreamMiniFat(entry, data) {
    this.loadMinifat();
    const minifat = this.minifat;
    const ministreamSize = this.root.size;
    const ministreamFatSectors = [];
    let sect = this.root.isectStart >>> 0;
    const fatSectorCount = Math.ceil(ministreamSize / this.sectorSize);
    for (let i = 0; i < fatSectorCount; i++) {
      if (sect === ENDOFCHAIN || sect >= this.fat.length) break;
      ministreamFatSectors.push(sect);
      sect = this.fat[sect] >>> 0;
    }
    let miniSect = entry.isectStart >>> 0;
    let off = 0;
    while (off < data.length) {
      if (miniSect === ENDOFCHAIN || miniSect >= minifat.length) {
        throw new OleFileError("MiniFAT chain ended unexpectedly during write");
      }
      const ministreamOffset = miniSect * this.miniSectorSize;
      const fatSectorIdx = Math.floor(ministreamOffset / this.sectorSize);
      const offsetInFatSector = ministreamOffset % this.sectorSize;
      const fileOffset = this.sectorSize + ministreamFatSectors[fatSectorIdx] * this.sectorSize + offsetInFatSector;
      const remaining = data.length - off;
      const chunk = data.subarray(
        off,
        off + Math.min(this.miniSectorSize, remaining)
      );
      this.fp.set(chunk, fileOffset);
      off += chunk.length;
      miniSect = minifat[miniSect] >>> 0;
    }
    this.ministream = null;
  }
  /** List all stream paths in the file (depth-first walk). */
  listdir(streams = true, storages = false) {
    const out = [];
    const walk = (node, prefix) => {
      for (const kid of node.kids) {
        const path = [...prefix, kid.name];
        if (kid.entryType === STGTY_STORAGE) {
          if (storages) out.push(path);
          walk(kid, path);
        } else if (kid.entryType === STGTY_STREAM) {
          if (streams) out.push(path);
        }
      }
    };
    walk(this.root, []);
    return out;
  }
};
function bytesToBigUint64LE(b, o = 0) {
  const lo = BigInt(readU32LE(b, o));
  const hi = BigInt(readU32LE(b, o + 4));
  return hi << 32n | lo;
}
function formatClsid(b) {
  let allZero = true;
  for (const byte of b) if (byte !== 0) {
    allZero = false;
    break;
  }
  if (allZero) return "";
  const hex2 = (n) => n.toString(16).padStart(2, "0").toUpperCase();
  const hex4 = (n) => n.toString(16).padStart(4, "0").toUpperCase();
  const hex8 = (n) => n.toString(16).padStart(8, "0").toUpperCase();
  const a = hex8(readU32LE(b, 0));
  const c = hex4(readU16LE(b, 4));
  const d = hex4(readU16LE(b, 6));
  let tail = "";
  for (let i = 8; i < 16; i++) tail += hex2(b[i]);
  return `${a}-${c}-${d}-${tail.slice(0, 4)}-${tail.slice(4)}`;
}

// src/exceptions.ts
var FileFormatError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "FileFormatError";
  }
};
var ParseError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
};
var DecryptionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DecryptionError";
  }
};
var EncryptionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "EncryptionError";
  }
};
var InvalidKeyError = class extends DecryptionError {
  constructor(message) {
    super(message);
    this.name = "InvalidKeyError";
  }
};

// src/crypto.ts
var import_node_crypto = require("crypto");
function nodeAlgo(a) {
  switch (a) {
    case "SHA1":
      return "sha1";
    case "SHA256":
      return "sha256";
    case "SHA384":
      return "sha384";
    case "SHA512":
      return "sha512";
    case "MD5":
      return "md5";
  }
}
function hash(algorithm, ...parts) {
  const h = (0, import_node_crypto.createHash)(nodeAlgo(algorithm));
  for (const p of parts) h.update(p);
  return new Uint8Array(h.digest());
}
function hashSize(algorithm) {
  switch (algorithm) {
    case "SHA1":
      return 20;
    case "SHA256":
      return 32;
    case "SHA384":
      return 48;
    case "SHA512":
      return 64;
    case "MD5":
      return 16;
  }
}
function hmac(algorithm, key, message) {
  const h = (0, import_node_crypto.createHmac)(nodeAlgo(algorithm), key);
  h.update(message);
  return new Uint8Array(h.digest());
}
function aesCbcCipher(key) {
  switch (key.length) {
    case 16:
      return "aes-128-cbc";
    case 24:
      return "aes-192-cbc";
    case 32:
      return "aes-256-cbc";
    default:
      throw new Error(`Unsupported AES key length: ${key.length}`);
  }
}
function aesEcbCipher(key) {
  switch (key.length) {
    case 16:
      return "aes-128-ecb";
    case 24:
      return "aes-192-ecb";
    case 32:
      return "aes-256-ecb";
    default:
      throw new Error(`Unsupported AES key length: ${key.length}`);
  }
}
function aesCbcDecrypt(data, key, iv) {
  const decipher = (0, import_node_crypto.createDecipheriv)(aesCbcCipher(key), key, iv);
  decipher.setAutoPadding(false);
  const a = decipher.update(data);
  const b = decipher.final();
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
function aesCbcEncrypt(data, key, iv) {
  const cipher = (0, import_node_crypto.createCipheriv)(aesCbcCipher(key), key, iv);
  cipher.setAutoPadding(false);
  const a = cipher.update(data);
  const b = cipher.final();
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
function aesEcbDecrypt(data, key) {
  const decipher = (0, import_node_crypto.createDecipheriv)(aesEcbCipher(key), key, null);
  decipher.setAutoPadding(false);
  const a = decipher.update(data);
  const b = decipher.final();
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
function rc4(key, data) {
  const S = new Uint8Array(256);
  for (let i2 = 0; i2 < 256; i2++) S[i2] = i2;
  let j = 0;
  const klen = key.length;
  for (let i2 = 0; i2 < 256; i2++) {
    j = j + S[i2] + key[i2 % klen] & 255;
    const t = S[i2];
    S[i2] = S[j];
    S[j] = t;
  }
  const out = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let n = 0; n < data.length; n++) {
    i = i + 1 & 255;
    j = j + S[i] & 255;
    const t = S[i];
    S[i] = S[j];
    S[j] = t;
    const k = S[S[i] + S[j] & 255];
    out[n] = data[n] ^ k;
  }
  return out;
}
function rsaDecryptPkcs1v15(privateKeyPem, ciphertext) {
  const keyObj = (0, import_node_crypto.createPrivateKey)({
    key: typeof privateKeyPem === "string" ? privateKeyPem : Buffer.from(privateKeyPem),
    format: "pem"
  });
  const out = (0, import_node_crypto.privateDecrypt)(
    {
      key: keyObj,
      padding: import_node_crypto.constants.RSA_PKCS1_PADDING
    },
    Buffer.from(ciphertext)
  );
  return new Uint8Array(out);
}
function randomBytes(n) {
  const { randomFillSync } = require("crypto");
  const out = new Uint8Array(n);
  randomFillSync(out);
  return out;
}

// src/method/ecma376_agile.ts
var BLK_VERIFIER_HASH_INPUT = new Uint8Array([
  254,
  167,
  210,
  118,
  59,
  75,
  158,
  121
]);
var BLK_ENCRYPTED_VERIFIER_HASH_VALUE = new Uint8Array([
  215,
  170,
  15,
  109,
  48,
  97,
  52,
  78
]);
var BLK_ENCRYPTED_KEY_VALUE = new Uint8Array([
  20,
  110,
  11,
  231,
  171,
  172,
  208,
  214
]);
var BLK_DATA_INTEGRITY1 = new Uint8Array([
  95,
  178,
  173,
  1,
  12,
  185,
  225,
  246
]);
var BLK_DATA_INTEGRITY2 = new Uint8Array([
  160,
  103,
  127,
  2,
  178,
  44,
  132,
  51
]);
function resizeBuffer(buf, n, pad = 0) {
  if (buf.length === n) return buf;
  if (buf.length > n) return buf.subarray(0, n);
  const out = new Uint8Array(n);
  out.set(buf, 0);
  out.fill(pad, buf.length);
  return out;
}
function normalizeKey(key, n) {
  return resizeBuffer(key, n, 54);
}
function roundUp(sz, block) {
  return Math.floor((sz + block - 1) / block) * block;
}
function deriveIteratedHashFromPassword(password, saltValue, hashAlgorithm, spinValue) {
  let h = hash(hashAlgorithm, saltValue, utf16leEncode(password));
  for (let i = 0; i < spinValue; i++) {
    h = hash(hashAlgorithm, packU32LE(i), h);
  }
  return h;
}
function deriveEncryptionKey(h, blockKey, hashAlgorithm, keyBits) {
  const finalHash = hash(hashAlgorithm, h, blockKey);
  return finalHash.subarray(0, keyBits / 8);
}
var ECMA376Agile = class {
  /**
   * Decrypt the EncryptedPackage stream using a derived secret key.
   *
   * The payload format is `<u64 totalSize>` followed by AES-CBC blocks, each
   * 4096-byte segment using `IV = sha(keyDataSalt || u32_le(blockIndex))`
   * truncated to 16 bytes.
   */
  static decrypt(key, keyDataSalt, hashAlgorithm, ibuf) {
    const SEGMENT_LENGTH = 4096;
    ibuf.seek(0);
    const head = ibuf.read(8);
    const totalSize = Number(readU64LE(head, 0));
    const out = [];
    let written = 0;
    let i = 0;
    while (true) {
      const buf = ibuf.read(SEGMENT_LENGTH);
      if (buf.length === 0) break;
      const iv = hash(hashAlgorithm, keyDataSalt, packU32LE(i)).subarray(0, 16);
      let dec = aesCbcDecrypt(buf, key, iv);
      const remaining = totalSize - written;
      if (remaining < dec.length) dec = dec.subarray(0, remaining);
      out.push(dec);
      written += dec.length;
      if (written >= totalSize) break;
      i++;
    }
    return concatBytes(...out);
  }
  /**
   * Encrypt arbitrary payload bytes using the same agile scheme used for
   * decryption. Returns an EncryptedPackage stream (the OLE container is
   * built separately by `ECMA376Encrypted`).
   */
  static encryptPayload(ibuf, secretKey, saltValue, hashAlgorithm, saltSize, blockSize) {
    const SEGMENT_LENGTH = 4096;
    const totalSize = ibuf.length;
    const segments = [];
    segments.push(packU64LE(totalSize));
    let i = 0;
    let off = 0;
    while (off < ibuf.length) {
      const chunk = ibuf.subarray(off, off + SEGMENT_LENGTH);
      const ivSeed = hash(hashAlgorithm, saltValue, packU32LE(i));
      const iv = normalizeKey(ivSeed, saltSize);
      let buf = chunk;
      if (buf.length % blockSize) {
        buf = resizeBuffer(buf, roundUp(buf.length, blockSize));
      }
      segments.push(aesCbcEncrypt(buf, secretKey, iv));
      off += SEGMENT_LENGTH;
      i++;
    }
    return concatBytes(...segments);
  }
  /**
   * Verify password by decrypting the stored verifier hash inputs and
   * comparing to the stored hash. Mirrors the spec's password-verifier flow.
   */
  static verifyPassword(password, saltValue, hashAlgorithm, encryptedVerifierHashInput, encryptedVerifierHashValue, spinValue, keyBits) {
    const h = deriveIteratedHashFromPassword(
      password,
      saltValue,
      hashAlgorithm,
      spinValue
    );
    const key1 = deriveEncryptionKey(
      h,
      BLK_VERIFIER_HASH_INPUT,
      hashAlgorithm,
      keyBits
    );
    const key2 = deriveEncryptionKey(
      h,
      BLK_ENCRYPTED_VERIFIER_HASH_VALUE,
      hashAlgorithm,
      keyBits
    );
    const hashInput = aesCbcDecrypt(encryptedVerifierHashInput, key1, saltValue);
    const actualHash = hash(hashAlgorithm, hashInput);
    const expectedFull = aesCbcDecrypt(
      encryptedVerifierHashValue,
      key2,
      saltValue
    );
    const expected = expectedFull.subarray(0, hashSize(hashAlgorithm));
    return bytesEqual(actualHash, expected);
  }
  /**
   * HMAC-verify the encrypted payload. Used for tamper detection (the spec
   * recommends running this before decrypting).
   */
  static verifyIntegrity(secretKey, keyDataSalt, keyDataHashAlgorithm, keyDataBlockSize, encryptedHmacKey, encryptedHmacValue, streamBytes) {
    const iv1 = hash(
      keyDataHashAlgorithm,
      keyDataSalt,
      BLK_DATA_INTEGRITY1
    ).subarray(0, keyDataBlockSize);
    const iv2 = hash(
      keyDataHashAlgorithm,
      keyDataSalt,
      BLK_DATA_INTEGRITY2
    ).subarray(0, keyDataBlockSize);
    const hmacKey = aesCbcDecrypt(encryptedHmacKey, secretKey, iv1);
    const hmacValue = aesCbcDecrypt(encryptedHmacValue, secretKey, iv2);
    const expectedSize = hashSize(keyDataHashAlgorithm);
    const actual = hmac(keyDataHashAlgorithm, hmacKey, streamBytes);
    return bytesEqual(hmacValue.subarray(0, expectedSize), actual);
  }
  /**
   * Recover the document secret key from a password.
   */
  static makekeyFromPassword(password, saltValue, hashAlgorithm, encryptedKeyValue, spinValue, keyBits) {
    const h = deriveIteratedHashFromPassword(
      password,
      saltValue,
      hashAlgorithm,
      spinValue
    );
    const encryptionKey = deriveEncryptionKey(
      h,
      BLK_ENCRYPTED_KEY_VALUE,
      hashAlgorithm,
      keyBits
    );
    return aesCbcDecrypt(encryptedKeyValue, encryptionKey, saltValue);
  }
  /**
   * Recover the document secret key from a private key (PEM bytes or string).
   * Matches the legacy private-key key-encryptor flow used by certificate
   * protected files.
   */
  static makekeyFromPrivkey(privkeyPem, encryptedKeyValue) {
    return rsaDecryptPkcs1v15(privkeyPem, encryptedKeyValue);
  }
  /**
   * Generate a fresh secret key + parameter set suitable for encrypting a
   * brand-new file. Used by the encryption path.
   */
  static generateEncryptionParameters(password, saltValue, spinCount) {
    const encryptedKey = {
      cipherName: "AES",
      hashName: "SHA512",
      saltSize: 16,
      blockSize: 16,
      keyBits: 256,
      hashSize: 64,
      saltValue: saltValue ?? randomBytes(16)
    };
    const keyData = {
      cipherName: "AES",
      hashName: "SHA512",
      saltSize: 16,
      blockSize: 16,
      keyBits: 256,
      hashSize: 64,
      saltValue: randomBytes(16)
    };
    const h = deriveIteratedHashFromPassword(
      password,
      encryptedKey.saltValue,
      encryptedKey.hashName,
      spinCount
    );
    const key1 = deriveEncryptionKey(
      h,
      BLK_VERIFIER_HASH_INPUT,
      encryptedKey.hashName,
      encryptedKey.keyBits
    );
    const key2 = deriveEncryptionKey(
      h,
      BLK_ENCRYPTED_VERIFIER_HASH_VALUE,
      encryptedKey.hashName,
      encryptedKey.keyBits
    );
    const key3 = deriveEncryptionKey(
      h,
      BLK_ENCRYPTED_KEY_VALUE,
      encryptedKey.hashName,
      encryptedKey.keyBits
    );
    let verifierHashInput = randomBytes(encryptedKey.saltSize);
    verifierHashInput = resizeBuffer(
      verifierHashInput,
      roundUp(verifierHashInput.length, encryptedKey.blockSize)
    );
    const encryptedVerifierHashInput = aesCbcEncrypt(
      verifierHashInput,
      key1,
      encryptedKey.saltValue
    );
    let hashedVerifier = hash(encryptedKey.hashName, verifierHashInput);
    hashedVerifier = resizeBuffer(
      hashedVerifier,
      roundUp(hashedVerifier.length, encryptedKey.blockSize)
    );
    const encryptedVerifierHashValue = aesCbcEncrypt(
      hashedVerifier,
      key2,
      encryptedKey.saltValue
    );
    let secretKey = randomBytes(encryptedKey.saltSize);
    secretKey = normalizeKey(secretKey, encryptedKey.keyBits / 8);
    const encryptedKeyValue = aesCbcEncrypt(
      secretKey,
      key3,
      encryptedKey.saltValue
    );
    const info = {
      keyDataSalt: keyData.saltValue,
      keyDataHashAlgorithm: keyData.hashName,
      keyDataBlockSize: keyData.blockSize,
      encryptedHmacKey: new Uint8Array(0),
      encryptedHmacValue: new Uint8Array(0),
      encryptedVerifierHashInput,
      encryptedVerifierHashValue,
      encryptedKeyValue,
      spinValue: spinCount,
      passwordSalt: encryptedKey.saltValue,
      passwordHashAlgorithm: encryptedKey.hashName,
      passwordKeyBits: encryptedKey.keyBits
    };
    return { info, secretKey, encryptedKey, keyData };
  }
  /**
   * Compute and return the encrypted HMAC key + value for the given payload.
   */
  static generateIntegrityParameter(encryptedData, keyData, secretKey) {
    const salt = randomBytes(keyData.hashSize);
    const iv1 = generateIv(keyData, BLK_DATA_INTEGRITY1, keyData.saltValue);
    const iv2 = generateIv(keyData, BLK_DATA_INTEGRITY2, keyData.saltValue);
    const encryptedHmacKey = aesCbcEncrypt(salt, secretKey, iv1);
    const value = hmac(keyData.hashName, salt, encryptedData);
    const padded = resizeBuffer(value, roundUp(value.length, keyData.blockSize));
    const encryptedHmacValue = aesCbcEncrypt(padded, secretKey, iv2);
    return { encryptedHmacKey, encryptedHmacValue };
  }
};
function generateIv(params, blkKey, saltValue) {
  if (!blkKey) return normalizeKey(saltValue, params.blockSize);
  return normalizeKey(
    hash(params.hashName, saltValue, blkKey),
    params.blockSize
  );
}

// src/method/ecma376_standard.ts
var ECMA376Standard = class {
  static decrypt(key, ibuf) {
    ibuf.seek(0);
    const head = ibuf.read(4);
    const totalSize = readU32LE(head, 0);
    ibuf.seek(8);
    const payload = ibuf.read();
    const dec = aesEcbDecrypt(payload, key);
    return dec.subarray(0, totalSize);
  }
  /**
   * Verify a derived key by comparing the encrypted verifier hash and the
   * SHA-1 of the decrypted verifier.
   */
  static verifyKey(key, encryptedVerifier, encryptedVerifierHash) {
    const verifier = aesEcbDecrypt(encryptedVerifier, key);
    const expectedHash = hash("SHA1", verifier);
    const verifierHash = aesEcbDecrypt(encryptedVerifierHash, key).subarray(
      0,
      20
    );
    return bytesEqual(expectedHash, verifierHash);
  }
  /**
   * Standard SHA-1 based PBKDF used by ECMA-376 v2/v3 (50 000 iterations).
   * Truncates to `keySize` bits.
   */
  static makekeyFromPassword(password, _algId, _algIdHash, _providerType, keySize, _saltSize, salt) {
    const ITER_COUNT = 5e4;
    const pwBytes = utf16leEncode(password);
    let h = hash("SHA1", salt, pwBytes);
    for (let i = 0; i < ITER_COUNT; i++) {
      h = hash("SHA1", packU32LE(i), h);
    }
    const hfinal = hash("SHA1", h, packU32LE(0));
    const cbHash = 20;
    const cbRequiredKeyLength = keySize / 8;
    const buf1 = new Uint8Array(64);
    buf1.fill(54);
    for (let i = 0; i < cbHash; i++) buf1[i] ^= hfinal[i];
    const x1 = hash("SHA1", buf1);
    const buf2 = new Uint8Array(64);
    buf2.fill(92);
    for (let i = 0; i < cbHash; i++) buf2[i] ^= hfinal[i];
    const x2 = hash("SHA1", buf2);
    const x3 = concatBytes(x1, x2);
    return x3.subarray(0, cbRequiredKeyLength);
  }
};

// src/format/common.ts
function parseEncryptionHeader(blob) {
  return {
    flags: readU32(blob),
    sizeExtra: readU32(blob),
    algId: readU32(blob),
    algIdHash: readU32(blob),
    keySize: readU32(blob),
    providerType: readU32(blob),
    reserved1: readU32(blob),
    reserved2: readU32(blob),
    cspName: utf16leDecode(blob.read())
  };
}
function parseEncryptionVerifier(blob, algorithm) {
  const saltSize = readU32(blob);
  const salt = new Uint8Array(blob.read(16));
  const encryptedVerifier = new Uint8Array(blob.read(16));
  const verifierHashSize = readU32(blob);
  const encryptedVerifierHash = new Uint8Array(
    blob.read(algorithm === "RC4" ? 20 : 32)
  );
  return {
    saltSize,
    salt,
    encryptedVerifier,
    verifierHashSize,
    encryptedVerifierHash
  };
}
function parseHeaderRC4CryptoAPI(encryptionHeader) {
  encryptionHeader.read(4);
  const headerSize = readU32(encryptionHeader);
  const headerBlob = new BytesIO(
    new Uint8Array(encryptionHeader.read(headerSize))
  );
  const header = parseEncryptionHeader(headerBlob);
  const keySize = header.keySize === 0 ? 40 : header.keySize;
  const verifierBlob = new BytesIO(new Uint8Array(encryptionHeader.read()));
  const verifier = parseEncryptionVerifier(verifierBlob, "RC4");
  return {
    salt: verifier.salt,
    keySize,
    encryptedVerifier: verifier.encryptedVerifier,
    encryptedVerifierHash: verifier.encryptedVerifierHash
  };
}
function parseHeaderRC4(blob) {
  return {
    salt: new Uint8Array(blob.read(16)),
    encryptedVerifier: new Uint8Array(blob.read(16)),
    encryptedVerifierHash: new Uint8Array(blob.read(16))
  };
}

// src/format/ooxml.ts
function isZip(buf) {
  return buf.length >= 4 && buf[0] === 80 && buf[1] === 75 && (buf[2] === 3 || buf[2] === 5 || buf[2] === 7) && (buf[3] === 4 || buf[3] === 6 || buf[3] === 8);
}
function isOoxml(buf) {
  if (!isZip(buf)) return false;
  return true;
}
function readAttr(xml, tagPattern, attr) {
  const tagMatch = xml.match(tagPattern);
  if (!tagMatch) throw new FileFormatError(`Tag not found: ${tagPattern}`);
  const tag = tagMatch[0];
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`);
  const m = tag.match(re);
  if (!m) throw new FileFormatError(`Attribute not found: ${attr}`);
  return m[1];
}
function parseAgileInfo(xml) {
  const keyDataSalt = base64Decode(readAttr(xml, /<keyData\s[^>]*\/?>/, "saltValue"));
  const keyDataHashAlgorithm = readAttr(
    xml,
    /<keyData\s[^>]*\/?>/,
    "hashAlgorithm"
  );
  const keyDataBlockSize = parseInt(
    readAttr(xml, /<keyData\s[^>]*\/?>/, "blockSize"),
    10
  );
  const encryptedHmacKey = base64Decode(
    readAttr(xml, /<dataIntegrity\s[^>]*\/?>/, "encryptedHmacKey")
  );
  const encryptedHmacValue = base64Decode(
    readAttr(xml, /<dataIntegrity\s[^>]*\/?>/, "encryptedHmacValue")
  );
  const ekTagRe = /<(?:[A-Za-z0-9_-]+:)?encryptedKey\s[^>]*\/?>/;
  const spinValue = parseInt(readAttr(xml, ekTagRe, "spinCount"), 10);
  const encryptedKeyValue = base64Decode(
    readAttr(xml, ekTagRe, "encryptedKeyValue")
  );
  const encryptedVerifierHashInput = base64Decode(
    readAttr(xml, ekTagRe, "encryptedVerifierHashInput")
  );
  const encryptedVerifierHashValue = base64Decode(
    readAttr(xml, ekTagRe, "encryptedVerifierHashValue")
  );
  const passwordSalt = base64Decode(readAttr(xml, ekTagRe, "saltValue"));
  const passwordHashAlgorithm = readAttr(
    xml,
    ekTagRe,
    "hashAlgorithm"
  );
  const passwordKeyBits = parseInt(readAttr(xml, ekTagRe, "keyBits"), 10);
  return {
    type: "agile",
    keyDataSalt,
    keyDataHashAlgorithm,
    keyDataBlockSize,
    encryptedHmacKey,
    encryptedHmacValue,
    encryptedVerifierHashInput,
    encryptedVerifierHashValue,
    encryptedKeyValue,
    spinValue,
    passwordSalt,
    passwordHashAlgorithm,
    passwordKeyBits
  };
}
function parseStandardInfo(stream) {
  readU32(stream);
  const encryptionHeaderSize = readU32(stream);
  const headerBytes = new Uint8Array(stream.read(encryptionHeaderSize));
  const header = parseEncryptionHeader(new BytesIO(headerBytes));
  const verifierBytes = new Uint8Array(stream.read());
  const isAes = (header.algId & 65280) === 26112;
  const verifier = parseEncryptionVerifier(
    new BytesIO(verifierBytes),
    isAes ? "AES" : "RC4"
  );
  return { type: "standard", header, verifier };
}
function parseInfo(stream) {
  const versionMajor = readU16(stream);
  const versionMinor = readU16(stream);
  if (versionMajor === 4 && versionMinor === 4) {
    stream.seek(8);
    const xmlBytes = stream.read();
    const xml = new TextDecoder("utf-8").decode(xmlBytes);
    return parseAgileInfo(xml);
  }
  if ((versionMajor === 2 || versionMajor === 3 || versionMajor === 4) && versionMinor === 2) {
    return parseStandardInfo(stream);
  }
  if ((versionMajor === 3 || versionMajor === 4) && versionMinor === 3) {
    throw new DecryptionError(
      "Unsupported EncryptionInfo version (Extensible Encryption)"
    );
  }
  throw new DecryptionError(
    `Unsupported EncryptionInfo version (${versionMajor}:${versionMinor})`
  );
}
var OOXMLFile = class {
  format = "ooxml";
  keyTypes;
  type;
  file;
  info;
  secretKey = null;
  constructor(buf) {
    if (isOleFile(buf)) {
      const ole = new OleFileIO(buf);
      this.file = ole;
      if (!ole.exists("EncryptionInfo")) {
        throw new FileFormatError(
          "Supposed to be an encrypted OOXML file, but no EncryptionInfo stream found"
        );
      }
      this.info = parseInfo(ole.openstream("EncryptionInfo"));
      this.type = this.info.type;
      this.keyTypes = this.type === "agile" ? ["password", "private_key", "secret_key"] : ["password", "secret_key"];
    } else if (isOoxml(buf)) {
      this.file = buf;
      this.type = "plain";
      this.keyTypes = [];
    } else {
      throw new FileFormatError("Unsupported file format");
    }
  }
  loadKey(opts) {
    const { password, privateKey, secretKey, verifyPassword = false } = opts;
    if (password !== void 0) {
      if (this.type === "agile") {
        const info = this.info;
        this.secretKey = ECMA376Agile.makekeyFromPassword(
          password,
          info.passwordSalt,
          info.passwordHashAlgorithm,
          info.encryptedKeyValue,
          info.spinValue,
          info.passwordKeyBits
        );
        if (verifyPassword) {
          const ok = ECMA376Agile.verifyPassword(
            password,
            info.passwordSalt,
            info.passwordHashAlgorithm,
            info.encryptedVerifierHashInput,
            info.encryptedVerifierHashValue,
            info.spinValue,
            info.passwordKeyBits
          );
          if (!ok) throw new InvalidKeyError("Key verification failed");
        }
      } else if (this.type === "standard") {
        const info = this.info;
        this.secretKey = ECMA376Standard.makekeyFromPassword(
          password,
          info.header.algId,
          info.header.algIdHash,
          info.header.providerType,
          info.header.keySize,
          info.verifier.saltSize,
          info.verifier.salt
        );
        if (verifyPassword) {
          const ok = ECMA376Standard.verifyKey(
            this.secretKey,
            info.verifier.encryptedVerifier,
            info.verifier.encryptedVerifierHash
          );
          if (!ok) throw new InvalidKeyError("Key verification failed");
        }
      } else if (this.type === "plain") {
      }
    } else if (privateKey !== void 0) {
      if (this.type !== "agile") {
        throw new DecryptionError(
          "Unsupported key type for the encryption method"
        );
      }
      const info = this.info;
      this.secretKey = ECMA376Agile.makekeyFromPrivkey(
        privateKey,
        info.encryptedKeyValue
      );
    } else if (secretKey !== void 0) {
      this.secretKey = secretKey;
    } else {
      throw new DecryptionError("No key specified");
    }
  }
  decrypt(opts = {}) {
    if (this.type === "plain") {
      throw new DecryptionError("Document is not encrypted");
    }
    const ole = this.file;
    const stream = ole.openstream("EncryptedPackage");
    let result;
    if (this.type === "agile") {
      const info = this.info;
      if (opts.verifyIntegrity) {
        const ok = ECMA376Agile.verifyIntegrity(
          this.secretKey,
          info.keyDataSalt,
          info.keyDataHashAlgorithm,
          info.keyDataBlockSize,
          info.encryptedHmacKey,
          info.encryptedHmacValue,
          stream.getValue()
        );
        if (!ok) {
          throw new InvalidKeyError("Payload integrity verification failed");
        }
      }
      result = ECMA376Agile.decrypt(
        this.secretKey,
        info.keyDataSalt,
        info.keyDataHashAlgorithm,
        new BytesIO(stream.getValue())
      );
    } else if (this.type === "standard") {
      result = ECMA376Standard.decrypt(
        this.secretKey,
        new BytesIO(stream.getValue())
      );
    } else {
      throw new DecryptionError("Unsupported encryption method");
    }
    if (!isZip(result)) {
      throw new InvalidKeyError(
        "The file could not be decrypted with this password"
      );
    }
    return result;
  }
  isEncrypted() {
    return this.type !== "plain";
  }
};

// src/method/rc4_common.ts
function rc4VerifyByHash(hashAlgo, key, encryptedVerifier, encryptedVerifierHash) {
  const ct = concatBytes(encryptedVerifier, encryptedVerifierHash);
  const pt = rc4(key, ct);
  const verifier = pt.subarray(0, encryptedVerifier.length);
  const verifierHash = pt.subarray(encryptedVerifier.length);
  const expected = hash(hashAlgo, verifier);
  return bytesEqual(expected, verifierHash);
}
function blockwiseRc4Decrypt(ibuf, makeKey, blockSize, startBlock = 0) {
  const out = [];
  let block = startBlock;
  let key = makeKey(block);
  while (true) {
    const buf = ibuf.read(blockSize);
    if (buf.length === 0) break;
    out.push(rc4(key, buf));
    block += 1;
    key = makeKey(block);
  }
  return concatBytes(...out);
}

// src/method/rc4.ts
function makekey(password, salt, block) {
  const pwBytes = utf16leEncode(password);
  const truncated = hash("MD5", pwBytes).subarray(0, 5);
  const segLen = truncated.length + salt.length;
  const intermediate = new Uint8Array(segLen * 16);
  for (let i = 0; i < 16; i++) {
    intermediate.set(truncated, i * segLen);
    intermediate.set(salt, i * segLen + truncated.length);
  }
  const truncatedHash = hash("MD5", intermediate).subarray(0, 5);
  return hash("MD5", truncatedHash, packU32LE(block)).subarray(0, 16);
}
var DocumentRC4 = class {
  static verifyPassword(password, salt, encryptedVerifier, encryptedVerifierHash) {
    const key = makekey(password, salt, 0);
    return rc4VerifyByHash("MD5", key, encryptedVerifier, encryptedVerifierHash);
  }
  static decrypt(password, salt, ibuf, blockSize = 512) {
    return blockwiseRc4Decrypt(
      ibuf,
      (b) => makekey(password, salt, b),
      blockSize
    );
  }
};

// src/method/rc4_cryptoapi.ts
function makekey2(password, salt, keyLength, block) {
  const pwBytes = utf16leEncode(password);
  const hfinal = hash("SHA1", hash("SHA1", salt, pwBytes), packU32LE(block));
  if (keyLength === 40) {
    const out = new Uint8Array(16);
    out.set(hfinal.subarray(0, 5), 0);
    return out;
  }
  return hfinal.subarray(0, keyLength / 8);
}
var DocumentRC4CryptoAPI = class {
  static verifyPassword(password, salt, keySize, encryptedVerifier, encryptedVerifierHash, block = 0) {
    const key = makekey2(password, salt, keySize, block);
    return rc4VerifyByHash(
      "SHA1",
      key,
      encryptedVerifier,
      encryptedVerifierHash
    );
  }
  static decrypt(password, salt, keySize, ibuf, blockSize = 512, startBlock = 0) {
    return blockwiseRc4Decrypt(
      ibuf,
      (b) => makekey2(password, salt, keySize, b),
      blockSize,
      startBlock
    );
  }
};

// src/method/xor_obfuscation.ts
var PAD_ARRAY = [
  187,
  255,
  255,
  186,
  255,
  255,
  185,
  128,
  0,
  190,
  15,
  0,
  191,
  15,
  0
];
var INITIAL_CODE = [
  57840,
  7439,
  52380,
  33984,
  4364,
  3600,
  61902,
  12606,
  6258,
  57657,
  54287,
  34041,
  10252,
  43370,
  20163
];
var XOR_MATRIX = [
  44796,
  19929,
  39858,
  10053,
  20106,
  40212,
  10761,
  31585,
  63170,
  64933,
  60267,
  50935,
  40399,
  11199,
  17763,
  35526,
  1453,
  2906,
  5812,
  11624,
  23248,
  885,
  1770,
  3540,
  7080,
  14160,
  28320,
  56640,
  55369,
  41139,
  20807,
  41614,
  21821,
  43642,
  17621,
  28485,
  56970,
  44341,
  19019,
  38038,
  14605,
  29210,
  60195,
  50791,
  40175,
  10751,
  21502,
  43004,
  24537,
  18387,
  36774,
  3949,
  7898,
  15796,
  31592,
  63184,
  47201,
  24803,
  49606,
  37805,
  14203,
  28406,
  56812,
  17824,
  35648,
  1697,
  3394,
  6788,
  13576,
  27152,
  43601,
  17539,
  35078,
  557,
  1114,
  2228,
  4456,
  30388,
  60776,
  51953,
  34243,
  7079,
  14158,
  28316,
  14128,
  28256,
  56512,
  43425,
  17251,
  34502,
  7597,
  13105,
  26210,
  52420,
  35241,
  883,
  1766,
  3532,
  4129,
  8258,
  16516,
  33032,
  4657,
  9314,
  18628
];
function ror(n, rotations, width) {
  return (1 << width) - 1 & (n >>> rotations | n << width - rotations);
}
function xorRor(byte1, byte2) {
  return ror(byte1 ^ byte2, 1, 8);
}
var DocumentXOR = class _DocumentXOR {
  /**
   * Verify password by computing the obfuscation verifier and comparing to
   * the on-disk verificationBytes. Spec: [MS-OFFCRYPTO] §2.3.7.
   */
  static verifyPassword(password, verificationBytes) {
    let verifier = 0;
    const arr = [];
    arr.push(password.length);
    for (const ch of password) arr.push(ch.charCodeAt(0));
    arr.reverse();
    for (const passwordByte of arr) {
      const intermediate1 = (verifier & 16384) === 0 ? 0 : 1;
      const intermediate2 = verifier * 2 & 32767;
      const intermediate3 = intermediate1 ^ intermediate2;
      verifier = intermediate3 ^ passwordByte;
    }
    return (verifier ^ 52811) === verificationBytes;
  }
  /** Build the 16-byte XOR pad described by [MS-OFFCRYPTO] §2.3.6.2. */
  static createXorArrayMethod1(password) {
    const xorKey = (() => {
      let k = INITIAL_CODE[password.length - 1];
      let currentElement = 104;
      const data = [];
      for (let i2 = password.length - 1; i2 >= 0; i2--) {
        data.push(password.charCodeAt(i2));
      }
      for (let ch of data) {
        for (let i2 = 0; i2 < 7; i2++) {
          if ((ch & 64) !== 0) k = (k ^ XOR_MATRIX[currentElement]) % 65536;
          ch = (ch << 1) % 256;
          currentElement -= 1;
        }
      }
      return k;
    })();
    let index = password.length;
    const obfuscationArray = new Array(16).fill(0);
    if (index % 2 === 1) {
      let temp = (xorKey & 65280) >>> 8;
      obfuscationArray[index] = xorRor(PAD_ARRAY[0], temp);
      index -= 1;
      temp = xorKey & 255;
      const passwordLastChar = password.charCodeAt(password.length - 1);
      obfuscationArray[index] = xorRor(passwordLastChar, temp);
    }
    while (index > 0) {
      index -= 1;
      let temp = (xorKey & 65280) >>> 8;
      obfuscationArray[index] = xorRor(password.charCodeAt(index), temp);
      index -= 1;
      temp = xorKey & 255;
      obfuscationArray[index] = xorRor(password.charCodeAt(index), temp);
    }
    let i = 15;
    let padIndex = 15 - password.length;
    while (padIndex > 0) {
      let temp = (xorKey & 65280) >>> 8;
      obfuscationArray[i] = xorRor(PAD_ARRAY[padIndex], temp);
      i -= 1;
      padIndex -= 1;
      temp = xorKey & 255;
      obfuscationArray[i] = xorRor(PAD_ARRAY[padIndex], temp);
      i -= 1;
      padIndex -= 1;
    }
    return obfuscationArray;
  }
  /**
   * Decrypt records using the Method 1 XOR scheme. The plaintext array marks
   * which bytes are actually encrypted (-1, -2) vs. plaintext-as-is (>=0).
   */
  static decrypt(password, ibuf, plaintext, _records, _base) {
    const xorArray = _DocumentXOR.createXorArrayMethod1(password);
    const out = [];
    let dataIndex = 0;
    while (dataIndex < plaintext.length) {
      let count = 1;
      if (plaintext[dataIndex] === -1 || plaintext[dataIndex] === -2) {
        for (let j = dataIndex + 1; j < plaintext.length; j++) {
          if (plaintext[j] >= 0) break;
          count += 1;
        }
        let xorArrayIndex = plaintext[dataIndex] === -2 ? (dataIndex + count + 4) % 16 : (dataIndex + count) % 16;
        for (let item = 0; item < count; item++) {
          const dataByte = ibuf.read(1)[0];
          let tempRes = dataByte ^ xorArray[xorArrayIndex];
          tempRes = ror(tempRes, 5, 8);
          out.push(tempRes);
          xorArrayIndex = (xorArrayIndex + 1) % 16;
        }
      } else {
        out.push(ibuf.read(1)[0]);
      }
      dataIndex += count;
    }
    return new Uint8Array(out);
  }
};

// src/format/xls97.ts
var RECORD = {
  Formula: 6,
  EOF: 10,
  FilePass: 47,
  WriteAccess: 92,
  BoundSheet8: 133,
  Country: 140,
  InterfaceHdr: 225,
  RRDInfo: 406,
  RRDHead: 312,
  UsrExcl: 404,
  FileLock: 405,
  BOF: 2057
};
var BIFFStream = class {
  constructor(data) {
    this.data = data;
  }
  data;
  /**
   * Read the 4-byte (id, size) record header at the current position.
   * Returns null at EOF (no header bytes available).
   */
  readHeader() {
    const h = this.data.read(4);
    if (h.length === 0) return null;
    return { num: readU16LE(h, 0), size: readU16LE(h, 2) };
  }
  hasRecord(target) {
    const pos = this.data.tell();
    while (true) {
      const h = this.readHeader();
      if (!h) {
        this.data.seek(pos);
        return false;
      }
      if (h.num === target) {
        this.data.seek(pos);
        return true;
      }
      this.data.read(h.size);
    }
  }
  skipTo(target) {
    while (true) {
      const h = this.readHeader();
      if (!h) throw new ParseError("Record not found");
      if (h.num === target) return h;
      this.data.read(h.size);
    }
  }
  *iterRecord() {
    while (true) {
      const h = this.readHeader();
      if (!h) break;
      const record = new BytesIO(new Uint8Array(this.data.read(h.size)));
      yield { num: h.num, size: h.size, record };
    }
  }
};
var Xls97File = class {
  constructor(ole) {
    this.ole = ole;
    if (!ole.exists("Workbook")) {
      throw new FileFormatError("Not an Excel 97-2003 file (no Workbook stream)");
    }
    this.workbookData = ole.openstream("Workbook").getValue();
  }
  ole;
  format = "xls97";
  keyTypes = ["password"];
  workbookData;
  type;
  password;
  salt;
  keySize;
  loadKey(opts) {
    const password = opts.password;
    if (password === void 0) {
      throw new DecryptionError("xls97 requires a password");
    }
    const wb = new BIFFStream(new BytesIO(this.workbookData));
    const bofId = readU16(wb.data);
    if (bofId !== RECORD.BOF) {
      throw new ParseError("Workbook stream does not start with BOF");
    }
    const bofSize = readU16(wb.data);
    wb.data.read(bofSize);
    const filePass = wb.skipTo(RECORD.FilePass);
    const wEncryptionType = readU16(wb.data);
    const encryptionInfo = new BytesIO(
      new Uint8Array(wb.data.read(filePass.size - 2))
    );
    if (wEncryptionType === 0) {
      readU16(encryptionInfo);
      const verificationBytes = readU16(encryptionInfo);
      if (!DocumentXOR.verifyPassword(password, verificationBytes)) {
        throw new InvalidKeyError("Failed to verify password");
      }
      this.type = "xor";
      this.password = password;
      return;
    }
    if (wEncryptionType !== 1) {
      throw new DecryptionError(
        `Unsupported wEncryptionType: 0x${wEncryptionType.toString(16)}`
      );
    }
    const vMajor = readU16(encryptionInfo);
    const vMinor = readU16(encryptionInfo);
    if (vMajor === 1 && vMinor === 1) {
      const info = parseHeaderRC4(encryptionInfo);
      if (!DocumentRC4.verifyPassword(
        password,
        info.salt,
        info.encryptedVerifier,
        info.encryptedVerifierHash
      )) {
        throw new InvalidKeyError("Failed to verify password");
      }
      this.type = "rc4";
      this.password = password;
      this.salt = info.salt;
      return;
    }
    if ((vMajor === 2 || vMajor === 3 || vMajor === 4) && vMinor === 2) {
      const info = parseHeaderRC4CryptoAPI(encryptionInfo);
      if (!DocumentRC4CryptoAPI.verifyPassword(
        password,
        info.salt,
        info.keySize,
        info.encryptedVerifier,
        info.encryptedVerifierHash
      )) {
        throw new InvalidKeyError("Failed to verify password");
      }
      this.type = "rc4_cryptoapi";
      this.password = password;
      this.salt = info.salt;
      this.keySize = info.keySize;
      return;
    }
    throw new DecryptionError(
      `Unsupported encryption version: ${vMajor}.${vMinor}`
    );
  }
  decrypt(_opts = {}) {
    if (!this.type || !this.password) {
      throw new DecryptionError("Must call loadKey before decrypt");
    }
    const plain = [];
    const encrypted = [];
    const wb = new BIFFStream(new BytesIO(this.workbookData));
    for (const { num, size, record } of wb.iterRecord()) {
      const header = packU16LE(num);
      const sizeHeader = packU16LE(size);
      if (num === RECORD.FilePass) {
        plain.push(0, 0, sizeHeader[0], sizeHeader[1]);
        for (let i = 0; i < size; i++) plain.push(0);
        for (let i = 0; i < 4 + size; i++) encrypted.push(0);
        continue;
      }
      if (num === RECORD.BOF || num === RECORD.UsrExcl || num === RECORD.FileLock || num === RECORD.InterfaceHdr || num === RECORD.RRDInfo || num === RECORD.RRDHead) {
        plain.push(header[0], header[1], sizeHeader[0], sizeHeader[1]);
        const rec = record.read();
        for (const b of rec) plain.push(b);
        for (let i = 0; i < 4 + size; i++) encrypted.push(0);
        continue;
      }
      if (num === RECORD.BoundSheet8) {
        plain.push(header[0], header[1], sizeHeader[0], sizeHeader[1]);
        const lbPlyPos = record.read(4);
        for (const b of lbPlyPos) plain.push(b);
        for (let i = 0; i < size - 4; i++) plain.push(-2);
        for (let i = 0; i < 8; i++) encrypted.push(0);
        const rest = record.read();
        for (const b of rest) encrypted.push(b);
        continue;
      }
      plain.push(header[0], header[1], sizeHeader[0], sizeHeader[1]);
      for (let i = 0; i < size; i++) plain.push(-1);
      for (let i = 0; i < 4; i++) encrypted.push(0);
      const body = record.read();
      for (const b of body) encrypted.push(b);
    }
    if (plain.length !== encrypted.length) {
      throw new DecryptionError(
        "Internal error: plain/encrypted length mismatch"
      );
    }
    const encryptedBuf = new Uint8Array(encrypted);
    let dec;
    if (this.type === "rc4") {
      dec = DocumentRC4.decrypt(
        this.password,
        this.salt,
        new BytesIO(encryptedBuf),
        1024
      );
    } else if (this.type === "rc4_cryptoapi") {
      dec = DocumentRC4CryptoAPI.decrypt(
        this.password,
        this.salt,
        this.keySize,
        new BytesIO(encryptedBuf),
        1024
      );
    } else {
      dec = DocumentXOR.decrypt(
        this.password,
        new BytesIO(encryptedBuf),
        plain,
        null,
        10
      );
    }
    const out = new Uint8Array(plain.length);
    for (let i = 0; i < plain.length; i++) {
      const c = plain[i];
      out[i] = c === -1 || c === -2 ? dec[i] : c;
    }
    this.ole.writeStream("Workbook", out);
    return this.ole.getBuffer();
  }
  isEncrypted() {
    try {
      const wb = new BIFFStream(new BytesIO(this.workbookData));
      if (readU16(wb.data) !== RECORD.BOF) return false;
      const bofSize = readU16(wb.data);
      wb.data.read(bofSize);
      if (!wb.hasRecord(RECORD.FilePass)) return false;
      wb.skipTo(RECORD.FilePass);
      const t = readU16(wb.data);
      return t === 0 || t === 1;
    } catch {
      return false;
    }
  }
};

// src/format/doc97.ts
function parseFibBase(blob) {
  const wIdent = readU16(blob);
  const nFib = readU16(blob);
  const unused = readU16(blob);
  const lid = readU16(blob);
  const pnNext = readU16(blob);
  const flagsA = readU16(blob);
  const fDot = getBit(flagsA, 0);
  const fGlsy = getBit(flagsA, 1);
  const fComplex = getBit(flagsA, 2);
  const fHasPic = getBit(flagsA, 3);
  const cQuickSaves = getBitSlice(flagsA, 4, 4);
  const fEncrypted = getBit(flagsA, 8);
  const fWhichTblStm = getBit(flagsA, 9);
  const fReadOnlyRecommended = getBit(flagsA, 10);
  const fWriteReservation = getBit(flagsA, 11);
  const fExtChar = getBit(flagsA, 12);
  const fLoadOverride = getBit(flagsA, 13);
  const fFarEast = getBit(flagsA, 14);
  const fObfuscation = getBit(flagsA, 15);
  const nFibBack = readU16(blob);
  const IKey = readU32(blob);
  const envr = blob.read(1)[0];
  const flagsB = blob.read(1)[0];
  const fMac = getBit(flagsB, 0);
  const fEmptySpecial = getBit(flagsB, 1);
  const fLoadOverridePage = getBit(flagsB, 2);
  const reserved1 = getBit(flagsB, 3);
  const reserved2 = getBit(flagsB, 4);
  const fSpare0 = getBitSlice(flagsB, 5, 3);
  const reserved3 = readU16(blob);
  const reserved4 = readU16(blob);
  const reserved5 = readU32(blob);
  const reserved6 = readU32(blob);
  return {
    wIdent,
    nFib,
    unused,
    lid,
    pnNext,
    fDot,
    fGlsy,
    fComplex,
    fHasPic,
    cQuickSaves,
    fEncrypted,
    fWhichTblStm,
    fReadOnlyRecommended,
    fWriteReservation,
    fExtChar,
    fLoadOverride,
    fFarEast,
    fObfuscation,
    nFibBack,
    IKey,
    envr,
    fMac,
    fEmptySpecial,
    fLoadOverridePage,
    reserved1,
    reserved2,
    fSpare0,
    reserved3,
    reserved4,
    reserved5,
    reserved6
  };
}
function packFibBase(fib) {
  let flagsA = 65535;
  flagsA = setBit(flagsA, 0, fib.fDot);
  flagsA = setBit(flagsA, 1, fib.fGlsy);
  flagsA = setBit(flagsA, 2, fib.fComplex);
  flagsA = setBit(flagsA, 3, fib.fHasPic);
  flagsA = setBitSlice(flagsA, 4, 4, fib.cQuickSaves);
  flagsA = setBit(flagsA, 8, fib.fEncrypted);
  flagsA = setBit(flagsA, 9, fib.fWhichTblStm);
  flagsA = setBit(flagsA, 10, fib.fReadOnlyRecommended);
  flagsA = setBit(flagsA, 11, fib.fWriteReservation);
  flagsA = setBit(flagsA, 12, fib.fExtChar);
  flagsA = setBit(flagsA, 13, fib.fLoadOverride);
  flagsA = setBit(flagsA, 14, fib.fFarEast);
  flagsA = setBit(flagsA, 15, fib.fObfuscation);
  let flagsB = 255;
  flagsB = setBit(flagsB, 0, fib.fMac);
  flagsB = setBit(flagsB, 1, fib.fEmptySpecial);
  flagsB = setBit(flagsB, 2, fib.fLoadOverridePage);
  flagsB = setBit(flagsB, 3, fib.reserved1);
  flagsB = setBit(flagsB, 4, fib.reserved2);
  flagsB = setBitSlice(flagsB, 5, 3, fib.fSpare0);
  return new ByteWriter().u16(fib.wIdent).u16(fib.nFib).u16(fib.unused).u16(fib.lid).u16(fib.pnNext).u16(flagsA & 65535).u16(fib.nFibBack).u32(fib.IKey >>> 0).u8(fib.envr).u8(flagsB & 255).u16(fib.reserved3).u16(fib.reserved4).u32(fib.reserved5 >>> 0).u32(fib.reserved6 >>> 0).build();
}
var Doc97File = class {
  constructor(ole) {
    this.ole = ole;
    const wd = ole.exists("WordDocument") ? "WordDocument" : ole.exists("wordDocument") ? "wordDocument" : null;
    if (!wd) {
      throw new FileFormatError("Not a Word 97-2003 file (no WordDocument stream)");
    }
    this.fib = parseFibBase(new BytesIO(ole.openstream(wd).getValue()));
    this.tableName = this.fib.fWhichTblStm === 1 ? "1Table" : "0Table";
  }
  ole;
  format = "doc97";
  keyTypes = ["password"];
  fib;
  tableName;
  type;
  password;
  salt;
  keySize;
  loadKey(opts) {
    const password = opts.password;
    if (password === void 0) {
      throw new DecryptionError("doc97 requires a password");
    }
    if (!this.fib.fEncrypted) {
      throw new DecryptionError("File is not encrypted");
    }
    if (this.fib.fObfuscation === 1) {
      throw new DecryptionError(
        "XOR-obfuscated DOC files are not supported (the format is rare)"
      );
    }
    if (!this.ole.exists(this.tableName)) {
      throw new FileFormatError(`Table stream not found: ${this.tableName}`);
    }
    const table = this.ole.openstream(this.tableName);
    const vMajor = readU16(table);
    const vMinor = readU16(table);
    if (vMajor === 1 && vMinor === 1) {
      const info = parseHeaderRC4(table);
      if (!DocumentRC4.verifyPassword(
        password,
        info.salt,
        info.encryptedVerifier,
        info.encryptedVerifierHash
      )) {
        throw new InvalidKeyError("Failed to verify password");
      }
      this.type = "rc4";
      this.password = password;
      this.salt = info.salt;
      return;
    }
    if ((vMajor === 2 || vMajor === 3 || vMajor === 4) && vMinor === 2) {
      const info = parseHeaderRC4CryptoAPI(table);
      if (!DocumentRC4CryptoAPI.verifyPassword(
        password,
        info.salt,
        info.keySize,
        info.encryptedVerifier,
        info.encryptedVerifierHash
      )) {
        throw new InvalidKeyError("Failed to verify password");
      }
      this.type = "rc4_cryptoapi";
      this.password = password;
      this.salt = info.salt;
      this.keySize = info.keySize;
      return;
    }
    throw new DecryptionError(
      `Unsupported encryption version: ${vMajor}.${vMinor}`
    );
  }
  decrypt(_opts = {}) {
    if (!this.type || !this.password) {
      throw new DecryptionError("Must call loadKey before decrypt");
    }
    const FIB_LENGTH = 68;
    const newFib = {
      ...this.fib,
      fEncrypted: 0,
      fObfuscation: 0,
      IKey: 0
    };
    const wordDocBytes = this.ole.openstream("WordDocument").getValue();
    const fibBytes = packFibBase(newFib);
    const newWordDoc = new Uint8Array(wordDocBytes.length);
    newWordDoc.set(fibBytes, 0);
    const remainingHeader = wordDocBytes.subarray(fibBytes.length, FIB_LENGTH);
    newWordDoc.set(remainingHeader, fibBytes.length);
    const decFull = this.cipherDecrypt(wordDocBytes);
    newWordDoc.set(decFull.subarray(FIB_LENGTH), FIB_LENGTH);
    const tableBytes = this.ole.openstream(this.tableName).getValue();
    const tableDec = this.cipherDecrypt(tableBytes);
    let dataDec = null;
    if (this.ole.exists("Data")) {
      const dataBytes = this.ole.openstream("Data").getValue();
      dataDec = this.cipherDecrypt(dataBytes);
    }
    this.ole.writeStream("WordDocument", newWordDoc);
    this.ole.writeStream(this.tableName, tableDec);
    if (dataDec) this.ole.writeStream("Data", dataDec);
    return this.ole.getBuffer();
  }
  cipherDecrypt(buf) {
    if (this.type === "rc4") {
      return DocumentRC4.decrypt(this.password, this.salt, new BytesIO(buf));
    }
    return DocumentRC4CryptoAPI.decrypt(
      this.password,
      this.salt,
      this.keySize,
      new BytesIO(buf)
    );
  }
  isEncrypted() {
    return this.fib.fEncrypted === 1;
  }
};

// src/format/ppt97.ts
function parseRecordHeader(b, off) {
  const w0 = readU16LE(b, off);
  const recVer = w0 & 15;
  const recInstance = w0 >>> 4 & 4095;
  const recType = readU16LE(b, off + 2);
  const recLen = readU32LE(b, off + 4);
  return { recVer, recInstance, recType, recLen };
}
function packRecordHeader(rh) {
  const w0 = rh.recVer & 15 | (rh.recInstance & 4095) << 4;
  return new ByteWriter().u16(w0).u16(rh.recType).u32(rh.recLen).build();
}
function parseCurrentUserAtom(buf) {
  const rh = parseRecordHeader(buf, 0);
  if (rh.recVer !== 0 || rh.recInstance !== 0 || rh.recType !== 4086) {
    throw new ParseError("Invalid CurrentUserAtom record header");
  }
  let off = 8;
  const size = readU32LE(buf, off);
  off += 4;
  if (size !== 20) throw new ParseError("CurrentUserAtom.size != 0x14");
  const headerToken = readU32LE(buf, off);
  off += 4;
  const offsetToCurrentEdit = readU32LE(buf, off);
  off += 4;
  const lenUserName = readU16LE(buf, off);
  off += 2;
  const docFileVersion = readU16LE(buf, off);
  off += 2;
  const majorVersion = buf[off++];
  const minorVersion = buf[off++];
  const unused = buf.subarray(off, off + 2);
  off += 2;
  const ansiUserName = buf.subarray(off, off + lenUserName);
  off += lenUserName;
  const relVersion = readU32LE(buf, off);
  off += 4;
  const unicodeUserName = buf.subarray(off, off + 2 * lenUserName);
  return {
    rh,
    size,
    headerToken,
    offsetToCurrentEdit,
    lenUserName,
    docFileVersion,
    majorVersion,
    minorVersion,
    unused: new Uint8Array(unused),
    ansiUserName: new Uint8Array(ansiUserName),
    relVersion,
    unicodeUserName: new Uint8Array(unicodeUserName)
  };
}
function packCurrentUserAtom(c) {
  return new ByteWriter().bytes(packRecordHeader(c.rh)).u32(c.size).u32(c.headerToken >>> 0).u32(c.offsetToCurrentEdit).u16(c.lenUserName).u16(c.docFileVersion).u8(c.majorVersion).u8(c.minorVersion).bytes(c.unused).bytes(c.ansiUserName).u32(c.relVersion).bytes(c.unicodeUserName).build();
}
function parseUserEditAtom(buf, baseOff) {
  const rh = parseRecordHeader(buf, baseOff);
  if (rh.recVer !== 0 || rh.recInstance !== 0 || rh.recType !== 4085) {
    throw new ParseError("Invalid UserEditAtom record header");
  }
  if (rh.recLen !== 28 && rh.recLen !== 32) {
    throw new ParseError(`Unexpected UserEditAtom recLen: ${rh.recLen}`);
  }
  let off = baseOff + 8;
  const lastSlideIdRef = readU32LE(buf, off);
  off += 4;
  const version = readU16LE(buf, off);
  off += 2;
  const minorVersion = buf[off++];
  const majorVersion = buf[off++];
  const offsetLastEdit = readU32LE(buf, off);
  off += 4;
  const offsetPersistDirectory = readU32LE(buf, off);
  off += 4;
  const docPersistIdRef = readU32LE(buf, off);
  off += 4;
  const persistIdSeed = readU32LE(buf, off);
  off += 4;
  const lastView = readU16LE(buf, off);
  off += 2;
  const unused = buf.subarray(off, off + 2);
  off += 2;
  let encryptSessionPersistIdRef = null;
  if (rh.recLen === 32) {
    encryptSessionPersistIdRef = readU32LE(buf, off);
  }
  return {
    rh,
    lastSlideIdRef,
    version,
    minorVersion,
    majorVersion,
    offsetLastEdit,
    offsetPersistDirectory,
    docPersistIdRef,
    persistIdSeed,
    lastView,
    unused: new Uint8Array(unused),
    encryptSessionPersistIdRef
  };
}
function packUserEditAtom(u) {
  const w = new ByteWriter().bytes(packRecordHeader(u.rh)).u32(u.lastSlideIdRef).u16(u.version).u8(u.minorVersion).u8(u.majorVersion).u32(u.offsetLastEdit).u32(u.offsetPersistDirectory).u32(u.docPersistIdRef).u32(u.persistIdSeed).u16(u.lastView).bytes(u.unused);
  if (u.encryptSessionPersistIdRef !== null) {
    w.u32(u.encryptSessionPersistIdRef);
  }
  return w.build();
}
function parsePersistDirectoryAtom(buf, baseOff) {
  const rh = parseRecordHeader(buf, baseOff);
  if (rh.recVer !== 0 || rh.recInstance !== 0 || rh.recType !== 6002) {
    throw new ParseError("Invalid PersistDirectoryAtom record header");
  }
  const entries = [];
  let pos = 0;
  let off = baseOff + 8;
  while (pos < rh.recLen) {
    const w = readU32LE(buf, off);
    off += 4;
    const persistId = w & 1048575;
    const cPersist = w >>> 20 & 4095;
    const rgPersistOffset = [];
    for (let i = 0; i < cPersist; i++) {
      rgPersistOffset.push(readU32LE(buf, off));
      off += 4;
    }
    const entrySize = 4 + 4 * cPersist;
    entries.push({ persistId, cPersist, rgPersistOffset });
    pos += entrySize;
  }
  return { rh, rgPersistDirEntry: entries };
}
function packPersistDirectoryAtom(pda) {
  const w = new ByteWriter().bytes(packRecordHeader(pda.rh));
  for (const e of pda.rgPersistDirEntry) {
    let bits = 4294967295 >>> 0;
    bits = setBitSlice(bits, 0, 20, e.persistId);
    bits = setBitSlice(bits, 20, 12, e.cPersist);
    w.u32(bits >>> 0);
    for (const o of e.rgPersistOffset) w.u32(o);
  }
  return w.build();
}
function constructPersistObjectDirectory(currentUserBytes, pptBytes) {
  const cu = parseCurrentUserAtom(currentUserBytes);
  const stack = [];
  let off = cu.offsetToCurrentEdit;
  while (true) {
    const ue = parseUserEditAtom(pptBytes, off);
    const pda = parsePersistDirectoryAtom(pptBytes, ue.offsetPersistDirectory);
    stack.push(pda);
    if (ue.offsetLastEdit === 0) break;
    off = ue.offsetLastEdit;
    if (stack.length > 1) break;
  }
  const dir = /* @__PURE__ */ new Map();
  while (stack.length > 0) {
    const pda = stack.pop();
    for (const e of pda.rgPersistDirEntry) {
      for (let i = 0; i < e.rgPersistOffset.length; i++) {
        dir.set(e.persistId + i, e.rgPersistOffset[i]);
      }
    }
  }
  return dir;
}
var Ppt97File = class {
  constructor(ole) {
    this.ole = ole;
    if (!ole.exists("Current User") || !ole.exists("PowerPoint Document")) {
      throw new FileFormatError(
        "Not a PowerPoint 97-2003 file (missing Current User or PowerPoint Document stream)"
      );
    }
    this.currentUserBytes = ole.openstream("Current User").getValue();
    this.pptBytes = ole.openstream("PowerPoint Document").getValue();
  }
  ole;
  format = "ppt97";
  keyTypes = ["password"];
  currentUserBytes;
  pptBytes;
  password;
  salt;
  keySize;
  loadKey(opts) {
    const password = opts.password;
    if (password === void 0) {
      throw new DecryptionError("ppt97 requires a password");
    }
    const cu = parseCurrentUserAtom(this.currentUserBytes);
    const ue = parseUserEditAtom(this.pptBytes, cu.offsetToCurrentEdit);
    if (ue.encryptSessionPersistIdRef === null) {
      throw new DecryptionError("File does not contain an encryption session");
    }
    const dir = constructPersistObjectDirectory(
      this.currentUserBytes,
      this.pptBytes
    );
    const cryptOff = dir.get(ue.encryptSessionPersistIdRef);
    if (cryptOff === void 0) {
      throw new ParseError(
        "encryptSessionPersistIdRef not in persist object directory"
      );
    }
    const containerRh = parseRecordHeader(this.pptBytes, cryptOff);
    if (containerRh.recType !== 12052) {
      throw new ParseError(
        `Expected CryptSession10Container, got recType=0x${containerRh.recType.toString(16)}`
      );
    }
    const cryptData = this.pptBytes.subarray(
      cryptOff + 8,
      cryptOff + 8 + containerRh.recLen
    );
    const blob = new BytesIO(new Uint8Array(cryptData));
    const vMajor = readU16(blob);
    const vMinor = readU16(blob);
    if (!(vMajor === 2 || vMajor === 3 || vMajor === 4) || vMinor !== 2) {
      throw new DecryptionError(
        `PPT only supports RC4 CryptoAPI encryption (got ${vMajor}.${vMinor})`
      );
    }
    const info = parseHeaderRC4CryptoAPI(blob);
    if (!DocumentRC4CryptoAPI.verifyPassword(
      password,
      info.salt,
      info.keySize,
      info.encryptedVerifier,
      info.encryptedVerifierHash
    )) {
      throw new InvalidKeyError("Failed to verify password");
    }
    this.password = password;
    this.salt = info.salt;
    this.keySize = info.keySize;
  }
  decrypt(_opts = {}) {
    if (this.password === void 0) {
      throw new DecryptionError("Must call loadKey before decrypt");
    }
    const cu = parseCurrentUserAtom(this.currentUserBytes);
    const cuNew = {
      ...cu,
      // 0xE391C05F: spec value indicating "this file SHOULD NOT be encrypted".
      headerToken: 3817979999
    };
    const newCurrentUser = packCurrentUserAtom(cuNew);
    if (newCurrentUser.length !== this.currentUserBytes.length) {
      throw new DecryptionError(
        "Internal: Current User stream size changed unexpectedly"
      );
    }
    const dec = new Uint8Array(this.pptBytes.length);
    dec.set(this.pptBytes, 0);
    const ueOff = cu.offsetToCurrentEdit;
    const ue = parseUserEditAtom(this.pptBytes, ueOff);
    const ueNew = {
      ...ue,
      rh: { ...ue.rh, recLen: ue.rh.recLen - 4 },
      encryptSessionPersistIdRef: 0
    };
    const ueBytes = packUserEditAtom(ueNew);
    dec.set(ueBytes, ueOff);
    const pda = parsePersistDirectoryAtom(this.pptBytes, ue.offsetPersistDirectory);
    const firstEntry = pda.rgPersistDirEntry[0];
    const pdaNew = {
      rh: pda.rh,
      rgPersistDirEntry: [
        {
          persistId: firstEntry.persistId,
          cPersist: firstEntry.cPersist - 1,
          rgPersistOffset: firstEntry.rgPersistOffset
        }
      ]
    };
    const pdaBytes = packPersistDirectoryAtom(pdaNew);
    dec.set(pdaBytes, ue.offsetPersistDirectory);
    const dir = constructPersistObjectDirectory(
      this.currentUserBytes,
      this.pptBytes
    );
    const items = Array.from(dir.entries());
    for (let i = 0; i < items.length; i++) {
      const [persistId, off] = items[i];
      const rh = parseRecordHeader(this.pptBytes, off);
      if (rh.recType === 12052) {
        const total = 8 + rh.recLen;
        for (let k = 0; k < total; k++) dec[off + k] = 0;
        continue;
      }
      if (rh.recType === 4085 || rh.recType === 6002) continue;
      if (i + 1 >= items.length) continue;
      const nextOff = items[i + 1][1];
      const recLen = nextOff - off - 8;
      if (recLen < 0) continue;
      const encBuf = this.pptBytes.subarray(off, off + 8 + recLen);
      const blockSize = this.keySize * (Math.floor((8 + recLen) / this.keySize) + 1);
      const decoded = DocumentRC4CryptoAPI.decrypt(
        this.password,
        this.salt,
        this.keySize,
        new BytesIO(new Uint8Array(encBuf)),
        blockSize,
        persistId
      );
      dec.set(decoded.subarray(0, encBuf.length), off);
    }
    this.ole.writeStream("Current User", newCurrentUser);
    this.ole.writeStream("PowerPoint Document", dec);
    return this.ole.getBuffer();
  }
  isEncrypted() {
    try {
      const cu = parseCurrentUserAtom(this.currentUserBytes);
      const ue = parseUserEditAtom(this.pptBytes, cu.offsetToCurrentEdit);
      return ue.rh.recLen === 32;
    } catch {
      return false;
    }
  }
};

// src/index.ts
function OfficeFile(buf) {
  const view = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  if (isOleFile(view)) {
    const ole = new OleFileIO(view);
    if (ole.exists("EncryptionInfo")) return new OOXMLFile(view);
    if (ole.exists("WordDocument") || ole.exists("wordDocument")) {
      return new Doc97File(ole);
    }
    if (ole.exists("Workbook")) return new Xls97File(ole);
    if (ole.exists("PowerPoint Document")) return new Ppt97File(ole);
    throw new FileFormatError("Unrecognized OLE file format");
  }
  if (isOoxml(view)) return new OOXMLFile(view);
  throw new FileFormatError("Unsupported file format");
}
function isEncrypted(buf) {
  const view = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  if (!isOleFile(view)) return false;
  try {
    const file = OfficeFile(view);
    return file.isEncrypted();
  } catch {
    return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DecryptionError,
  Doc97File,
  EncryptionError,
  FileFormatError,
  InvalidKeyError,
  OOXMLFile,
  OfficeFile,
  OleFileIO,
  ParseError,
  Ppt97File,
  Xls97File,
  isEncrypted,
  isOleFile,
  isOoxml
});
//# sourceMappingURL=index.cjs.map