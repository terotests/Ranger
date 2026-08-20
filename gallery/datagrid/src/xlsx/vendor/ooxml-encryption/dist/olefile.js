// src/utils.ts
function utf16leDecode(b) {
  let s = "";
  for (let i = 0; i + 1 < b.length; i += 2) {
    const c = b[i] | b[i + 1] << 8;
    s += String.fromCharCode(c);
  }
  return s;
}
function readU16LE(b, o = 0) {
  return b[o] | b[o + 1] << 8;
}
function readU32LE(b, o = 0) {
  return (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
}

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
var MAXREGSECT = 4294967290;
var DIFSECT = 4294967292;
var FATSECT = 4294967293;
var ENDOFCHAIN = 4294967294;
var FREESECT = 4294967295;
var NOSTREAM = 4294967295;
var UNKNOWN_SIZE = 2147483647;
var STGTY_EMPTY = 0;
var STGTY_STORAGE = 1;
var STGTY_STREAM = 2;
var STGTY_LOCKBYTES = 3;
var STGTY_PROPERTY = 4;
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
export {
  DIFSECT,
  ENDOFCHAIN,
  FATSECT,
  FREESECT,
  MAGIC,
  MAXREGSECT,
  MINIMAL_OLEFILE_SIZE,
  NOSTREAM,
  NotOleFileError,
  OleFileError,
  OleFileIO,
  OleStream,
  STGTY_EMPTY,
  STGTY_LOCKBYTES,
  STGTY_PROPERTY,
  STGTY_ROOT,
  STGTY_STORAGE,
  STGTY_STREAM,
  UNKNOWN_SIZE,
  isOleFile
};
//# sourceMappingURL=olefile.js.map