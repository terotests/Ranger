#!/usr/bin/env node
class ZipBuffer  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.pos = 0;
    this.length = 0;
  }
  initWithBuffer (buf) {
    this.data = buf;
    this.length = buf.byteLength;
    this.pos = 0;
  };
  initWithSize (size) {
    this.data = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.length = size;
    this.pos = 0;
  };
  getPosition () {
    return this.pos;
  };
  setPosition (newPos) {
    this.pos = newPos;
  };
  seek (offset) {
    this.pos = offset;
  };
  skip (count) {
    this.pos = this.pos + count;
  };
  remaining () {
    return this.length - this.pos;
  };
  isEOF () {
    return this.pos >= this.length;
  };
  readUint8 () {
    if ( this.pos >= this.length ) {
      return 0;
    }
    const value = this.data._view.getUint8(this.pos);
    this.pos = this.pos + 1;
    return value;
  };
  readUint16LE () {
    const b0 = this.readUint8();
    const b1 = this.readUint8();
    return b0 + (b1 * 256);
  };
  readUint32LE () {
    const b0 = this.readUint8();
    const b1 = this.readUint8();
    const b2 = this.readUint8();
    const b3 = this.readUint8();
    return ((b0 + (b1 * 256)) + (b2 * 65536)) + (b3 * 16777216);
  };
  readBytes (count) {
    let result = (function(){ var b = new ArrayBuffer(count); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < count) {
      if ( this.pos < this.length ) {
        const b = this.data._view.getUint8(this.pos);
        result._view.setUint8(i, b);
        this.pos = this.pos + 1;
      }
      i = i + 1;
    };
    return result;
  };
  readString (count) {
    let result = "";
    let i = 0;
    while (i < count) {
      if ( this.pos < this.length ) {
        const ch = this.data._view.getUint8(this.pos);
        result = result + (String.fromCharCode(ch));
        this.pos = this.pos + 1;
      }
      i = i + 1;
    };
    return result;
  };
  peekUint8 () {
    if ( this.pos >= this.length ) {
      return 0;
    }
    return this.data._view.getUint8(this.pos);
  };
  peekUint32LE () {
    const savedPos = this.pos;
    const value = this.readUint32LE();
    this.pos = savedPos;
    return value;
  };
  writeUint8 (value) {
    if ( this.pos < this.length ) {
      this.data._view.setUint8(this.pos, value);
      this.pos = this.pos + 1;
    }
  };
  writeUint16LE (value) {
    const b0 = (value & 255);
    const b1 = (((value >>> 8)) & 255);
    this.writeUint8(b0);
    this.writeUint8(b1);
  };
  writeUint32LE (value) {
    const b0 = (value & 255);
    const b1 = (((value >>> 8)) & 255);
    const b2 = (((value >>> 16)) & 255);
    const b3 = (((value >>> 24)) & 255);
    this.writeUint8(b0);
    this.writeUint8(b1);
    this.writeUint8(b2);
    this.writeUint8(b3);
  };
  writeBytes (src, srcOffset, count) {
    let i = 0;
    while (i < count) {
      const b = src._view.getUint8((srcOffset + i));
      this.writeUint8(b);
      i = i + 1;
    };
  };
  writeBuffer (src) {
    const __len = src.byteLength;
    this.writeBytes(src, 0, __len);
  };
  writeString (s) {
    const __len = s.length;
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      this.writeUint8(ch);
      i = i + 1;
    };
  };
  getBuffer () {
    return this.data;
  };
  getLength () {
    return this.length;
  };
  findSignatureBackward (sig, startPos) {
    let searchPos = startPos;
    while (searchPos >= 0) {
      const savedPos = this.pos;
      this.pos = searchPos;
      const value = this.readUint32LE();
      this.pos = savedPos;
      if ( value == sig ) {
        return searchPos;
      }
      searchPos = searchPos - 1;
    };
    return -1;
  };
}
class GrowableZipBuffer  {
  constructor() {
    this.chunks = [];
    this.chunkLens = [];
    this.chunkSize = 65536;
    this.currentChunk = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.currentPos = 0;
    this.totalSize = 0;
    this.currentPos = 0;
    this.totalSize = 0;
    const initSize = this.chunkSize;
    this.currentChunk = (function(){ var b = new ArrayBuffer(initSize); b._view = new DataView(b); return b; })();
  }
  setChunkSize (size) {
    if ( size < 1 ) {
      return;
    }
    if ( this.totalSize > 0 ) {
      return;
    }
    this.chunkSize = size;
    this.currentChunk = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.currentPos = 0;
  };
  allocateNewChunk () {
    this.chunks.push(this.currentChunk);
    this.chunkLens.push(this.currentPos);
    const size = this.chunkSize;
    this.currentChunk = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.currentPos = 0;
  };
  writeUint8 (value) {
    if ( this.currentPos >= this.chunkSize ) {
      this.allocateNewChunk();
    }
    this.currentChunk._view.setUint8(this.currentPos, value);
    this.currentPos = this.currentPos + 1;
    this.totalSize = this.totalSize + 1;
  };
  writeUint16LE (value) {
    const b0 = value % 256;
    const b1D = (value) / 256.0;
    const b1 = (Math.floor( b1D)) % 256;
    this.writeUint8(b0);
    this.writeUint8(b1);
  };
  writeUint32LE (value) {
    const b0 = value % 256;
    const rem1D = (value) / 256.0;
    const rem1 = Math.floor( rem1D);
    const b1 = rem1 % 256;
    const rem2D = (rem1) / 256.0;
    const rem2 = Math.floor( rem2D);
    const b2 = rem2 % 256;
    const rem3D = (rem2) / 256.0;
    const b3 = Math.floor( rem3D);
    this.writeUint8(b0);
    this.writeUint8(b1);
    this.writeUint8(b2);
    this.writeUint8(b3);
  };
  writeBytes (src, srcOffset, count) {
    let left = count;
    let at = srcOffset;
    while (left > 0) {
      if ( this.currentPos >= this.chunkSize ) {
        this.allocateNewChunk();
      }
      const room = this.chunkSize - this.currentPos;
      let take = left;
      if ( take > room ) {
        take = room;
      }
      (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.currentChunk,this.currentPos,src,at,take);
      this.currentPos = this.currentPos + take;
      this.totalSize = this.totalSize + take;
      at = at + take;
      left = left - take;
    };
  };
  writeBuffer (src) {
    const __len = src.byteLength;
    this.writeBytes(src, 0, __len);
  };
  writeString (s) {
    const __len = s.length;
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      this.writeUint8(ch);
      i = i + 1;
    };
  };
  getSize () {
    return this.totalSize;
  };
  toBuffer () {
    const size = this.totalSize;
    let result = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    let destPos = 0;
    const numChunks = this.chunks.length;
    let i = 0;
    while (i < numChunks) {
      const chunk = this.chunks[i];
      const used = this.chunkLens[i];
      if ( used > 0 ) {
        (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,destPos,chunk,0,used);
        destPos = destPos + used;
      }
      i = i + 1;
    };
    const curPos = this.currentPos;
    if ( curPos > 0 ) {
      const curChunk = this.currentChunk;
      (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,destPos,curChunk,0,curPos);
      destPos = destPos + curPos;
    }
    return result;
  };
}
class ZipEntry  {
  constructor() {
    this.fileName = "";
    this.isDirectory = false;
    this.compressedSize = 0;
    this.uncompressedSize = 0;
    this.compressionMethod = 0;
    this.crc32 = 0;
    this.lastModTime = 0;
    this.lastModDate = 0;
    this.versionMadeBy = 20;
    this.versionNeeded = 20;
    this.generalPurposeFlag = 0;
    this.localHeaderOffset = 0;
    this.internalAttributes = 0;
    this.externalAttributes = 0;
    this.extraField = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.comment = "";
  }
  setFileName (name) {
    this.fileName = name;
    const __len = name.length;
    if ( __len > 0 ) {
      const lastChar = name.charCodeAt((__len - 1) );
      this.isDirectory = lastChar == 47;
    }
  };
  getFileName () {
    return this.fileName;
  };
  isCompressed () {
    return this.compressionMethod != 0;
  };
  isStored () {
    return this.compressionMethod == 0;
  };
  isDeflated () {
    return this.compressionMethod == 8;
  };
  setModificationTime (year, month, day, hour, minute, second) {
    let yearOffset = year - 1980;
    if ( yearOffset < 0 ) {
      yearOffset = 0;
    }
    this.lastModDate = (day + (month * 32)) + (yearOffset * 512);
    const sec2D = (second) / 2.0;
    const sec2 = Math.floor( sec2D);
    this.lastModTime = (sec2 + (minute * 32)) + (hour * 2048);
  };
  getModYear () {
    const yearOffsetD = (this.lastModDate) / 512.0;
    return (Math.floor( yearOffsetD)) + 1980;
  };
  getModMonth () {
    const rem = this.lastModDate % 512;
    const monthD = (rem) / 32.0;
    return Math.floor( monthD);
  };
  getModDay () {
    return this.lastModDate % 32;
  };
  getModHour () {
    const hourD = (this.lastModTime) / 2048.0;
    return Math.floor( hourD);
  };
  getModMinute () {
    const rem = this.lastModTime % 2048;
    const minD = (rem) / 32.0;
    return Math.floor( minD);
  };
  getModSecond () {
    return (this.lastModTime % 32) * 2;
  };
  getInfoString () {
    const sizeStr = (this.uncompressedSize.toString());
    const compStr = (this.compressedSize.toString());
    let method = "stored";
    if ( this.compressionMethod == 8 ) {
      method = "deflate";
    }
    const dateStr = (((((this.getModYear().toString())) + "-") + ((this.getModMonth().toString()))) + "-") + ((this.getModDay().toString()));
    return ((((((this.fileName + " (") + sizeStr) + " bytes, ") + method) + ", ") + dateStr) + ")";
  };
  getLocalHeaderSize () {
    return (30 + (this.fileName.length)) + (this.extraField.byteLength);
  };
  getCentralHeaderSize () {
    return ((46 + (this.fileName.length)) + (this.extraField.byteLength)) + (this.comment.length);
  };
}
class ZipCompressionMethod  {
  constructor() {
  }
}
ZipCompressionMethod.STORED = function() {
  return 0;
};
ZipCompressionMethod.DEFLATE = function() {
  return 8;
};
class ZipSignature  {
  constructor() {
  }
}
ZipSignature.LOCAL_FILE_HEADER = function() {
  return 67324752;
};
ZipSignature.CENTRAL_DIRECTORY_HEADER = function() {
  return 33639248;
};
ZipSignature.END_OF_CENTRAL_DIRECTORY = function() {
  return 101010256;
};
ZipSignature.DATA_DESCRIPTOR = function() {
  return 134695760;
};
class CRC32  {
  constructor() {
    this.table = [];
    this.tableBuilt = false;
  }
  buildTable () {
    let i = 0;
    while (i < 256) {
      let crc = i;
      let j = 0;
      while (j < 8) {
        if ( ((crc & 1)) == 1 ) {
          crc = (((crc >>> 1)) ^ 3988292384);
        } else {
          crc = (crc >>> 1);
        }
        j = j + 1;
      };
      this.table.push(crc);
      i = i + 1;
    };
    this.tableBuilt = true;
  };
  update (crc, data, offset, length) {
    if ( this.tableBuilt == false ) {
      this.buildTable();
    }
    let i = 0;
    while (i < length) {
      const b = data._view.getUint8((offset + i));
      const index = (((crc ^ b)) & 255);
      const tableValue = this.table[index];
      crc = (((crc >>> 8)) ^ tableValue);
      i = i + 1;
    };
    return crc;
  };
  compute (data) {
    const __len = data.byteLength;
    let crc = (0 ^ 4294967295);
    crc = this.update(crc, data, 0, __len);
    return (crc ^ 4294967295);
  };
  computeString (s) {
    const __len = s.length;
    let data = (function(){ var b = new ArrayBuffer(__len); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      data._view.setUint8(i, ch);
      i = i + 1;
    };
    return this.compute(data);
  };
  verify (data, expectedCrc) {
    const computed = this.compute(data);
    return computed == expectedCrc;
  };
}
CRC32.u32 = function(v) {
  return v;
};
class CRC32Util  {
  constructor() {
  }
}
CRC32Util.getInstance = function() {
  const util = new CRC32Util();
  if ( typeof(util.instance) === "undefined" ) {
    util.instance = new CRC32();
  }
  return util.instance;
};
CRC32Util.computeCRC = function(data) {
  const crc = new CRC32();
  return crc.compute(data);
};
CRC32Util.computeStringCRC = function(s) {
  const crc = new CRC32();
  return crc.computeString(s);
};
class InflateHuffmanTable  {
  constructor() {
    this.counts = [];
    this.symbols = [];
    this.maxBits = 0;
    let i = 0;
    while (i < 16) {
      this.counts.push(0);
      i = i + 1;
    };
  }
  build (lengths, numSymbols) {
    let i = 0;
    while (i < 16) {
      this.counts[i] = 0;
      i = i + 1;
    };
    i = 0;
    while (i < numSymbols) {
      const __len = lengths[i];
      if ( __len > 0 ) {
        const cnt = this.counts[__len];
        this.counts[__len] = cnt + 1;
        if ( __len > this.maxBits ) {
          this.maxBits = __len;
        }
      }
      i = i + 1;
    };
    let offsets = [];
    let offset = 0;
    i = 0;
    while (i < 16) {
      offsets.push(offset);
      const cnt_1 = this.counts[i];
      offset = offset + cnt_1;
      i = i + 1;
    };
    i = 0;
    while (i < numSymbols) {
      this.symbols.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < numSymbols) {
      const len_1 = lengths[i];
      if ( len_1 > 0 ) {
        const off = offsets[len_1];
        this.symbols[off] = i;
        offsets[len_1] = off + 1;
      }
      i = i + 1;
    };
  };
  decode (reader) {
    let code = 0;
    let first = 0;
    let index = 0;
    let __len = 1;
    while (__len <= this.maxBits) {
      const bit = reader.readBit();
      code = (code * 2) + bit;
      const count = this.counts[__len];
      if ( (code - first) < count ) {
        return this.symbols[((index + code) - first)];
      }
      index = index + count;
      first = (first + count) * 2;
      __len = __len + 1;
    };
    return -1;
  };
}
class InflateBitReader  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.bytePos = 0;
    this.bitPos = 0;
    this.currentByte = 0;
    this.dataLength = 0;
  }
  init (buf, offset, length) {
    this.data = buf;
    this.bytePos = offset;
    this.dataLength = offset + length;
    this.bitPos = 0;
    this.currentByte = 0;
  };
  readBit () {
    if ( this.bitPos == 0 ) {
      if ( this.bytePos >= this.dataLength ) {
        return 0;
      }
      this.currentByte = this.data._view.getUint8(this.bytePos);
      this.bytePos = this.bytePos + 1;
      this.bitPos = 8;
    }
    const bit = (this.currentByte & 1);
    this.currentByte = (this.currentByte >> 1);
    this.bitPos = this.bitPos - 1;
    return bit;
  };
  readBits (count) {
    let result = 0;
    let multiplier = 1;
    let i = 0;
    while (i < count) {
      const bit = this.readBit();
      result = result + (bit * multiplier);
      multiplier = multiplier * 2;
      i = i + 1;
    };
    return result;
  };
  alignToByte () {
    this.bitPos = 0;
  };
  readByte () {
    this.alignToByte();
    if ( this.bytePos >= this.dataLength ) {
      return 0;
    }
    const b = this.data._view.getUint8(this.bytePos);
    this.bytePos = this.bytePos + 1;
    return b;
  };
  readUint16LE () {
    const b0 = this.readByte();
    const b1 = this.readByte();
    return b0 + (b1 * 256);
  };
  getBytePosition () {
    return this.bytePos;
  };
  isEOF () {
    return (this.bytePos >= this.dataLength) && (this.bitPos == 0);
  };
}
class Inflate  {
  constructor() {
    this.input = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.reader = new InflateBitReader();
    this.outBuf = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.outLen = 0;
    this.outCap = 0;
    this.fixedLitLen = new InflateHuffmanTable();
    this.fixedDist = new InflateHuffmanTable();
    this.fixedTablesBuilt = false;
    this.lengthBase = [];
    this.lengthExtra = [];
    this.distBase = [];
    this.distExtra = [];
    this.buildLengthDistTables();
  }
  resetOutput (hint) {
    let cap = hint;
    if ( cap < 4096 ) {
      cap = 4096;
    }
    this.outBuf = (function(){ var b = new ArrayBuffer(cap); b._view = new DataView(b); return b; })();
    this.outCap = cap;
    this.outLen = 0;
  };
  ensureCapacity (extra) {
    const need = this.outLen + extra;
    if ( need <= this.outCap ) {
      return;
    }
    let newCap = this.outCap * 2;
    if ( newCap < need ) {
      newCap = need;
    }
    let grown = (function(){ var b = new ArrayBuffer(newCap); b._view = new DataView(b); return b; })();
    (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(grown,0,this.outBuf,0,this.outLen);
    this.outBuf = grown;
    this.outCap = newCap;
  };
  pushByte (b) {
    this.ensureCapacity(1);
    this.outBuf._view.setUint8(this.outLen, b);
    this.outLen = this.outLen + 1;
  };
  finalOutput () {
    const size = this.outLen;
    let result = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,0,this.outBuf,0,size);
    return result;
  };
  buildLengthDistTables () {
    let bases = [];
    bases.push(3);
    bases.push(4);
    bases.push(5);
    bases.push(6);
    bases.push(7);
    bases.push(8);
    bases.push(9);
    bases.push(10);
    bases.push(11);
    bases.push(13);
    bases.push(15);
    bases.push(17);
    bases.push(19);
    bases.push(23);
    bases.push(27);
    bases.push(31);
    bases.push(35);
    bases.push(43);
    bases.push(51);
    bases.push(59);
    bases.push(67);
    bases.push(83);
    bases.push(99);
    bases.push(115);
    bases.push(131);
    bases.push(163);
    bases.push(195);
    bases.push(227);
    bases.push(258);
    this.lengthBase = bases;
    let extras = [];
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(0);
    extras.push(1);
    extras.push(1);
    extras.push(1);
    extras.push(1);
    extras.push(2);
    extras.push(2);
    extras.push(2);
    extras.push(2);
    extras.push(3);
    extras.push(3);
    extras.push(3);
    extras.push(3);
    extras.push(4);
    extras.push(4);
    extras.push(4);
    extras.push(4);
    extras.push(5);
    extras.push(5);
    extras.push(5);
    extras.push(5);
    extras.push(0);
    this.lengthExtra = extras;
    let dBases = [];
    dBases.push(1);
    dBases.push(2);
    dBases.push(3);
    dBases.push(4);
    dBases.push(5);
    dBases.push(7);
    dBases.push(9);
    dBases.push(13);
    dBases.push(17);
    dBases.push(25);
    dBases.push(33);
    dBases.push(49);
    dBases.push(65);
    dBases.push(97);
    dBases.push(129);
    dBases.push(193);
    dBases.push(257);
    dBases.push(385);
    dBases.push(513);
    dBases.push(769);
    dBases.push(1025);
    dBases.push(1537);
    dBases.push(2049);
    dBases.push(3073);
    dBases.push(4097);
    dBases.push(6145);
    dBases.push(8193);
    dBases.push(12289);
    dBases.push(16385);
    dBases.push(24577);
    this.distBase = dBases;
    let dExtras = [];
    dExtras.push(0);
    dExtras.push(0);
    dExtras.push(0);
    dExtras.push(0);
    dExtras.push(1);
    dExtras.push(1);
    dExtras.push(2);
    dExtras.push(2);
    dExtras.push(3);
    dExtras.push(3);
    dExtras.push(4);
    dExtras.push(4);
    dExtras.push(5);
    dExtras.push(5);
    dExtras.push(6);
    dExtras.push(6);
    dExtras.push(7);
    dExtras.push(7);
    dExtras.push(8);
    dExtras.push(8);
    dExtras.push(9);
    dExtras.push(9);
    dExtras.push(10);
    dExtras.push(10);
    dExtras.push(11);
    dExtras.push(11);
    dExtras.push(12);
    dExtras.push(12);
    dExtras.push(13);
    dExtras.push(13);
    this.distExtra = dExtras;
  };
  buildFixedTables () {
    if ( this.fixedTablesBuilt ) {
      return;
    }
    let lengths = [];
    let i = 0;
    while (i < 144) {
      lengths.push(8);
      i = i + 1;
    };
    while (i < 256) {
      lengths.push(9);
      i = i + 1;
    };
    while (i < 280) {
      lengths.push(7);
      i = i + 1;
    };
    while (i < 288) {
      lengths.push(8);
      i = i + 1;
    };
    this.fixedLitLen.build(lengths, 288);
    let distLengths = [];
    i = 0;
    while (i < 32) {
      distLengths.push(5);
      i = i + 1;
    };
    this.fixedDist.build(distLengths, 32);
    this.fixedTablesBuilt = true;
  };
  decompress (data) {
    this.input = data;
    const dataLen = data.byteLength;
    this.resetOutput(dataLen * 4);
    this.reader.init(data, 0, dataLen);
    this.buildFixedTables();
    let finalBlock = false;
    while (false == finalBlock) {
      const bfinal = this.reader.readBit();
      const btype = this.reader.readBits(2);
      finalBlock = bfinal == 1;
      if ( btype == 0 ) {
        this.decompressStored();
      }
      if ( btype == 1 ) {
        this.decompressHuffman(this.fixedLitLen, this.fixedDist);
      }
      if ( btype == 2 ) {
        this.decompressDynamic();
      }
    };
    return this.finalOutput();
  };
  decompressStored () {
    this.reader.alignToByte();
    const __len = this.reader.readUint16LE();
    const nlen = this.reader.readUint16LE();
    if ( (__len + nlen) != 65535 ) {
    }
    this.ensureCapacity(__len);
    let i = 0;
    while (i < __len) {
      const b = this.reader.readByte();
      this.pushByte(b);
      i = i + 1;
    };
  };
  decompressHuffman (litLenTable, distTable) {
    let done = false;
    while (false == done) {
      const sym = litLenTable.decode(this.reader);
      if ( sym < 256 ) {
        this.pushByte(sym);
      }
      if ( sym == 256 ) {
        done = true;
      }
      if ( sym > 256 ) {
        const lengthCode = sym - 257;
        let length = this.lengthBase[lengthCode];
        const extraBits = this.lengthExtra[lengthCode];
        if ( extraBits > 0 ) {
          length = length + this.reader.readBits(extraBits);
        }
        const distCode = distTable.decode(this.reader);
        let dist = this.distBase[distCode];
        const distExtraBits = this.distExtra[distCode];
        if ( distExtraBits > 0 ) {
          dist = dist + this.reader.readBits(distExtraBits);
        }
        this.copyFromOutput(dist, length);
      }
    };
  };
  decompressDynamic () {
    const hlit = this.reader.readBits(5) + 257;
    const hdist = this.reader.readBits(5) + 1;
    const hclen = this.reader.readBits(4) + 4;
    let clOrder = [];
    clOrder.push(16);
    clOrder.push(17);
    clOrder.push(18);
    clOrder.push(0);
    clOrder.push(8);
    clOrder.push(7);
    clOrder.push(9);
    clOrder.push(6);
    clOrder.push(10);
    clOrder.push(5);
    clOrder.push(11);
    clOrder.push(4);
    clOrder.push(12);
    clOrder.push(3);
    clOrder.push(13);
    clOrder.push(2);
    clOrder.push(14);
    clOrder.push(1);
    clOrder.push(15);
    let clLengths = [];
    let i = 0;
    while (i < 19) {
      clLengths.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < hclen) {
      const idx = clOrder[i];
      const __len = this.reader.readBits(3);
      clLengths[idx] = __len;
      i = i + 1;
    };
    const clTable = new InflateHuffmanTable();
    clTable.build(clLengths, 19);
    let allLengths = [];
    const totalCodes = hlit + hdist;
    i = 0;
    while (i < totalCodes) {
      const sym = clTable.decode(this.reader);
      if ( sym < 16 ) {
        allLengths.push(sym);
        i = i + 1;
      }
      if ( sym == 16 ) {
        const repeat = this.reader.readBits(2) + 3;
        let prevLen = 0;
        const arrLen = allLengths.length;
        if ( arrLen > 0 ) {
          prevLen = allLengths[(arrLen - 1)];
        }
        let j = 0;
        while (j < repeat) {
          allLengths.push(prevLen);
          j = j + 1;
        };
        i = i + repeat;
      }
      if ( sym == 17 ) {
        const repeat_1 = this.reader.readBits(3) + 3;
        let j_1 = 0;
        while (j_1 < repeat_1) {
          allLengths.push(0);
          j_1 = j_1 + 1;
        };
        i = i + repeat_1;
      }
      if ( sym == 18 ) {
        const repeat_2 = this.reader.readBits(7) + 11;
        let j_2 = 0;
        while (j_2 < repeat_2) {
          allLengths.push(0);
          j_2 = j_2 + 1;
        };
        i = i + repeat_2;
      }
    };
    let litLenLengths = [];
    let distLengths = [];
    i = 0;
    while (i < hlit) {
      litLenLengths.push(allLengths[i]);
      i = i + 1;
    };
    while (i < totalCodes) {
      distLengths.push(allLengths[i]);
      i = i + 1;
    };
    const dynLitLen = new InflateHuffmanTable();
    dynLitLen.build(litLenLengths, hlit);
    const dynDist = new InflateHuffmanTable();
    dynDist.build(distLengths, hdist);
    this.decompressHuffman(dynLitLen, dynDist);
  };
  copyFromOutput (distance, length) {
    const srcPos = this.outLen - distance;
    this.ensureCapacity(length);
    let i = 0;
    while (i < length) {
      let b = 0;
      const readPos = srcPos + i;
      if ( readPos >= 0 ) {
        if ( readPos < this.outLen ) {
          b = this.outBuf._view.getUint8(readPos);
        }
      }
      this.outBuf._view.setUint8(this.outLen, b);
      this.outLen = this.outLen + 1;
      i = i + 1;
    };
  };
}
class ZipReader  {
  constructor() {
    this.entries = [];
    this.entryMap = {};
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.reader = new ZipBuffer();
    this.comment = "";
    this.isOpen = false;
    this.centralDirOffset = 0;
    this.centralDirSize = 0;
    this.totalEntries = 0;
  }
  open (path, filename) {
    return this.openBytes(((function(){ var b = require('fs').readFileSync(path + '/' + filename); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })()));
  };
  openBytes (bytes) {
    this.data = bytes;
    const dataLen = this.data.byteLength;
    if ( dataLen < 22 ) {
      console.log("Error: File too small to be a valid ZIP archive");
      return false;
    }
    if ( ((((dataLen >= 8) && ((this.data._view.getUint8(0)) == 208)) && ((this.data._view.getUint8(1)) == 207)) && ((this.data._view.getUint8(2)) == 17)) && ((this.data._view.getUint8(3)) == 224) ) {
      console.log("Error: password-protected Office file (OLE compound); decrypt before opening as ZIP");
      return false;
    }
    this.reader.initWithBuffer(this.data);
    if ( false == this.findEOCD() ) {
      console.log("Error: Could not find End of Central Directory record");
      return false;
    }
    if ( false == this.parseCentralDirectory() ) {
      console.log("Error: Could not parse Central Directory");
      return false;
    }
    this.isOpen = true;
    return true;
  };
  findEOCD () {
    const dataLen = this.data.byteLength;
    let maxSearch = 65557;
    if ( maxSearch > dataLen ) {
      maxSearch = dataLen;
    }
    const searchStart = dataLen - 22;
    let searchEnd = dataLen - maxSearch;
    if ( searchEnd < 0 ) {
      searchEnd = 0;
    }
    let pos = searchStart;
    let found = false;
    while ((pos >= searchEnd) && (false == found)) {
      this.reader.seek(pos);
      const sig = this.reader.readUint32LE();
      if ( sig == 101010256 ) {
        found = true;
        this.reader.skip(4);
        this.reader.skip(2);
        this.totalEntries = this.reader.readUint16LE();
        this.centralDirSize = this.reader.readUint32LE();
        this.centralDirOffset = this.reader.readUint32LE();
        const commentLen = this.reader.readUint16LE();
        if ( commentLen > 0 ) {
          this.comment = this.reader.readString(commentLen);
        }
      } else {
        pos = pos - 1;
      }
    };
    return found;
  };
  parseCentralDirectory () {
    this.reader.seek(this.centralDirOffset);
    let i = 0;
    while (i < this.totalEntries) {
      const sig = this.reader.readUint32LE();
      if ( sig != 33639248 ) {
        console.log("Error: Invalid Central Directory signature at entry " + ((i.toString())));
        return false;
      }
      const entry = new ZipEntry();
      entry.versionMadeBy = this.reader.readUint16LE();
      entry.versionNeeded = this.reader.readUint16LE();
      entry.generalPurposeFlag = this.reader.readUint16LE();
      entry.compressionMethod = this.reader.readUint16LE();
      entry.lastModTime = this.reader.readUint16LE();
      entry.lastModDate = this.reader.readUint16LE();
      entry.crc32 = this.reader.readUint32LE();
      entry.compressedSize = this.reader.readUint32LE();
      entry.uncompressedSize = this.reader.readUint32LE();
      const fileNameLen = this.reader.readUint16LE();
      const extraFieldLen = this.reader.readUint16LE();
      const commentLen = this.reader.readUint16LE();
      this.reader.skip(2);
      entry.internalAttributes = this.reader.readUint16LE();
      entry.externalAttributes = this.reader.readUint32LE();
      entry.localHeaderOffset = this.reader.readUint32LE();
      const fileName = this.reader.readString(fileNameLen);
      entry.setFileName(fileName);
      if ( extraFieldLen > 0 ) {
        entry.extraField = this.reader.readBytes(extraFieldLen);
      }
      if ( commentLen > 0 ) {
        entry.comment = this.reader.readString(commentLen);
      }
      this.entries.push(entry);
      this.entryMap[fileName] = entry;
      i = i + 1;
    };
    return true;
  };
  getEntryCount () {
    return this.totalEntries;
  };
  getEntries () {
    return this.entries;
  };
  listFiles () {
    let names = [];
    const numEntries = this.entries.length;
    let i = 0;
    while (i < numEntries) {
      const entry = this.entries[i];
      names.push(entry.fileName);
      i = i + 1;
    };
    return names;
  };
  getEntry (name) {
    return ( Object.prototype.hasOwnProperty.call(this.entryMap, name) ? this.entryMap[name] : undefined );
  };
  extract (entry) {
    this.reader.seek(entry.localHeaderOffset);
    const sig = this.reader.readUint32LE();
    if ( sig != 67324752 ) {
      console.log("Error: Invalid local file header signature");
      return (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    }
    this.reader.skip(22);
    const localFileNameLen = this.reader.readUint16LE();
    const localExtraLen = this.reader.readUint16LE();
    this.reader.skip(localFileNameLen);
    this.reader.skip(localExtraLen);
    const compressedData = this.reader.readBytes(entry.compressedSize);
    let result = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    if ( entry.compressionMethod == 0 ) {
      result = compressedData;
    }
    if ( entry.compressionMethod == 8 ) {
      const inflater = new Inflate();
      result = inflater.decompress(compressedData);
    }
    return result;
  };
  extractToFile (entry, outputPath) {
    const fileData = this.extract(entry);
    const dataLen = fileData.byteLength;
    if ( dataLen == 0 ) {
      if ( entry.isDirectory ) {
        require("fs").mkdirSync( outputPath);
        return true;
      }
      return false;
    }
    let dir = outputPath;
    let name = entry.fileName;
    let lastSlash = -1;
    const fullPath = (outputPath + "/") + entry.fileName;
    const pathLen = fullPath.length;
    let i = 0;
    while (i < pathLen) {
      const ch = fullPath.charCodeAt(i );
      if ( (ch == 47) || (ch == 92) ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if ( lastSlash >= 0 ) {
      dir = fullPath.substring(0, lastSlash );
      name = fullPath.substring((lastSlash + 1), pathLen );
    }
    if ( (dir.length) > 0 ) {
      if ( false == (require("fs").existsSync( dir )) ) {
        require("fs").mkdirSync( dir);
      }
    }
    require('fs').writeFileSync(dir + '/' + name, Buffer.from(fileData));
    return true;
  };
  extractAll (outputPath) {
    const numEntries = this.entries.length;
    let i = 0;
    while (i < numEntries) {
      const entry = this.entries[i];
      console.log("Extracting: " + entry.fileName);
      this.extractToFile(entry, outputPath);
      i = i + 1;
    };
  };
  getComment () {
    return this.comment;
  };
  close () {
    this.isOpen = false;
  };
  printInfo () {
    console.log("ZIP Archive Info:");
    console.log("  Total entries: " + ((this.totalEntries.toString())));
    console.log("  Central dir offset: " + ((this.centralDirOffset.toString())));
    console.log("  Central dir size: " + ((this.centralDirSize.toString())));
    if ( (this.comment.length) > 0 ) {
      console.log("  Archive comment: " + this.comment);
    }
    console.log("");
    console.log("Files:");
    const numEntries = this.entries.length;
    let i = 0;
    while (i < numEntries) {
      const entry = this.entries[i];
      console.log("  " + entry.getInfoString());
      i = i + 1;
    };
  };
}
class EVGCodepoint  {
  constructor() {
  }
}
EVGCodepoint.breaksAfter = function(c) {
  if ( (c == 45) || (c == 8208) ) {
    return true;
  }
  if ( (c == 8211) || (c == 8212) ) {
    return true;
  }
  if ( c == 47 ) {
    return true;
  }
  return false;
};
EVGCodepoint.isSpace = function(c) {
  if ( c == 32 ) {
    return true;
  }
  if ( c == 9 ) {
    return true;
  }
  return false;
};
EVGCodepoint.stringIsBytes = function() {
  return ("ä".length) > 1;
};
EVGCodepoint.isHighSurrogate = function(u) {
  return (u >= 55296) && (u <= 56319);
};
EVGCodepoint.isLowSurrogate = function(u) {
  return (u >= 56320) && (u <= 57343);
};
EVGCodepoint.codeAt = function(s, i) {
  const u = s.charCodeAt(i );
  if ( EVGCodepoint.stringIsBytes() ) {
    return EVGCodepoint.utf8CodeAt(s, i, u);
  }
  if ( EVGCodepoint.isHighSurrogate(u) ) {
    if ( (i + 1) < (s.length) ) {
      const lo = s.charCodeAt((i + 1) );
      if ( EVGCodepoint.isLowSurrogate(lo) ) {
        return (((u - 55296) * 1024) + (lo - 56320)) + 65536;
      }
    }
  }
  return u;
};
EVGCodepoint.utf8CodeAt = function(s, i, u) {
  const n = s.length;
  if ( u < 128 ) {
    return u;
  }
  if ( (u >= 192) && (u < 224) ) {
    if ( (i + 1) < n ) {
      const b1 = s.charCodeAt((i + 1) );
      if ( EVGCodepoint.isUtf8Cont(b1) ) {
        return ((u - 192) * 64) + (b1 - 128);
      }
    }
    return u;
  }
  if ( (u >= 224) && (u < 240) ) {
    if ( (i + 2) < n ) {
      const c1 = s.charCodeAt((i + 1) );
      const c2 = s.charCodeAt((i + 2) );
      if ( EVGCodepoint.isUtf8Cont(c1) && EVGCodepoint.isUtf8Cont(c2) ) {
        return (((u - 224) * 4096) + ((c1 - 128) * 64)) + (c2 - 128);
      }
    }
    return u;
  }
  if ( (u >= 240) && (u < 248) ) {
    if ( (i + 3) < n ) {
      const d1 = s.charCodeAt((i + 1) );
      const d2 = s.charCodeAt((i + 2) );
      const d3 = s.charCodeAt((i + 3) );
      if ( (EVGCodepoint.isUtf8Cont(d1) && EVGCodepoint.isUtf8Cont(d2)) && EVGCodepoint.isUtf8Cont(d3) ) {
        return ((((u - 240) * 262144) + ((d1 - 128) * 4096)) + ((d2 - 128) * 64)) + (d3 - 128);
      }
    }
    return u;
  }
  return u;
};
EVGCodepoint.isUtf8Cont = function(b) {
  return (b >= 128) && (b < 192);
};
EVGCodepoint.utf8UnitsAt = function(s, i) {
  const u = s.charCodeAt(i );
  const n = s.length;
  if ( u < 128 ) {
    return 1;
  }
  if ( (u >= 192) && (u < 224) ) {
    if ( (i + 1) < n ) {
      if ( EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) ))) ) {
        return 2;
      }
    }
    return 1;
  }
  if ( (u >= 224) && (u < 240) ) {
    if ( (i + 2) < n ) {
      if ( EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) ))) && EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 2) ))) ) {
        return 3;
      }
    }
    return 1;
  }
  if ( (u >= 240) && (u < 248) ) {
    if ( (i + 3) < n ) {
      const e1 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) )));
      const e2 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 2) )));
      const e3 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 3) )));
      if ( (e1 && e2) && e3 ) {
        return 4;
      }
    }
    return 1;
  }
  return 1;
};
EVGCodepoint.unitsAt = function(s, i) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return EVGCodepoint.utf8UnitsAt(s, i);
  }
  const u = s.charCodeAt(i );
  if ( EVGCodepoint.isHighSurrogate(u) ) {
    if ( (i + 1) < (s.length) ) {
      if ( EVGCodepoint.isLowSurrogate((s.charCodeAt((i + 1) ))) ) {
        return 2;
      }
    }
  }
  return 1;
};
EVGCodepoint.charCount = function(s) {
  let n = 0;
  let i = 0;
  while (i < (s.length)) {
    i = i + EVGCodepoint.unitsAt(s, i);
    n = n + 1;
  };
  return n;
};
EVGCodepoint.count = function(s) {
  let n = 0;
  let i = 0;
  while (i < (s.length)) {
    i = i + EVGCodepoint.unitsAt(s, i);
    n = n + 1;
  };
  return n;
};
EVGCodepoint.toArray = function(s) {
  let out = [];
  let i = 0;
  while (i < (s.length)) {
    out.push(EVGCodepoint.codeAt(s, i));
    i = i + EVGCodepoint.unitsAt(s, i);
  };
  return out;
};
EVGCodepoint.toStr = function(cp) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return String.fromCharCode(cp);
  }
  if ( cp < 65536 ) {
    return String.fromCharCode(cp);
  }
  const rel = cp - 65536;
  const hi = 55296 + (Math.floor( (rel / 1024)));
  const lo = 56320 + (rel % 1024);
  return (String.fromCharCode(hi)) + (String.fromCharCode(lo));
};
EVGCodepoint.encodeUtf8 = function(s) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return s;
  }
  let out = "";
  let i = 0;
  while (i < (s.length)) {
    const cp = EVGCodepoint.codeAt(s, i);
    i = i + EVGCodepoint.unitsAt(s, i);
    if ( cp < 128 ) {
      out = out + (String.fromCharCode(cp));
    } else {
      if ( cp < 2048 ) {
        out = out + (String.fromCharCode((192 + (Math.floor( (cp / 64))))));
        out = out + (String.fromCharCode((128 + (cp % 64))));
      } else {
        if ( cp < 65536 ) {
          out = out + (String.fromCharCode((224 + (Math.floor( (cp / 4096))))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 64))) % 64))));
          out = out + (String.fromCharCode((128 + (cp % 64))));
        } else {
          out = out + (String.fromCharCode((240 + (Math.floor( (cp / 262144))))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 4096))) % 64))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 64))) % 64))));
          out = out + (String.fromCharCode((128 + (cp % 64))));
        }
      }
    }
    continue;
  };
  return out;
};
class Utf8  {
  constructor() {
  }
}
Utf8.stringIsBytes = function() {
  return EVGCodepoint.stringIsBytes();
};
Utf8.encode = function(s) {
  if ( Utf8.stringIsBytes() ) {
    return s;
  }
  return EVGCodepoint.encodeUtf8(s);
};
Utf8.decode = function(raw) {
  if ( Utf8.stringIsBytes() ) {
    return raw;
  }
  const __len = raw.length;
  let scan = 0;
  let asciiOnly = true;
  while (scan < __len) {
    if ( (raw.charCodeAt(scan )) > 127 ) {
      asciiOnly = false;
      break;
    }
    scan = scan + 1;
  };
  if ( asciiOnly ) {
    return raw;
  }
  let out = "";
  let i = 0;
  while (i < __len) {
    const b0 = raw.charCodeAt(i );
    if ( b0 > 255 ) {
      out = out + (String.fromCharCode(b0));
      i = i + 1;
      continue;
    }
    if ( b0 < 128 ) {
      out = out + (String.fromCharCode(b0));
      i = i + 1;
      continue;
    }
    if ( (b0 >= 192) && (b0 < 224) ) {
      if ( (i + 1) < __len ) {
        const b1 = raw.charCodeAt((i + 1) );
        if ( Utf8.isCont(b1) ) {
          const cp = ((b0 - 192) * 64) + (b1 - 128);
          out = out + (String.fromCharCode(cp));
          i = i + 2;
          continue;
        }
      }
    }
    if ( (b0 >= 224) && (b0 < 240) ) {
      if ( (i + 2) < __len ) {
        const b1b = raw.charCodeAt((i + 1) );
        const b2 = raw.charCodeAt((i + 2) );
        if ( Utf8.isCont(b1b) && Utf8.isCont(b2) ) {
          const cp3 = (((b0 - 224) * 4096) + ((b1b - 128) * 64)) + (b2 - 128);
          out = out + (String.fromCharCode(cp3));
          i = i + 3;
          continue;
        }
      }
    }
    if ( (b0 >= 240) && (b0 < 248) ) {
      if ( (i + 3) < __len ) {
        const c1 = raw.charCodeAt((i + 1) );
        const c2 = raw.charCodeAt((i + 2) );
        const c3 = raw.charCodeAt((i + 3) );
        if ( (Utf8.isCont(c1) && Utf8.isCont(c2)) && Utf8.isCont(c3) ) {
          const cp4 = ((((b0 - 240) * 262144) + ((c1 - 128) * 4096)) + ((c2 - 128) * 64)) + (c3 - 128);
          const rel = cp4 - 65536;
          const hi = 55296 + (Math.floor( (rel / 1024)));
          const lo = 56320 + (rel % 1024);
          out = out + (String.fromCharCode(hi));
          out = out + (String.fromCharCode(lo));
          i = i + 4;
          continue;
        }
      }
    }
    out = out + (String.fromCharCode(b0));
    i = i + 1;
  };
  return out;
};
Utf8.isCont = function(b) {
  return (b >= 128) && (b < 192);
};
Utf8.toWinAnsi = function(cp) {
  if ( (cp >= 32) && (cp <= 126) ) {
    return cp;
  }
  if ( (cp >= 160) && (cp <= 255) ) {
    return cp;
  }
  if ( cp == 8364 ) {
    return 128;
  }
  if ( cp == 8218 ) {
    return 130;
  }
  if ( cp == 402 ) {
    return 131;
  }
  if ( cp == 8222 ) {
    return 132;
  }
  if ( cp == 8230 ) {
    return 133;
  }
  if ( cp == 8224 ) {
    return 134;
  }
  if ( cp == 8225 ) {
    return 135;
  }
  if ( cp == 710 ) {
    return 136;
  }
  if ( cp == 8240 ) {
    return 137;
  }
  if ( cp == 352 ) {
    return 138;
  }
  if ( cp == 8249 ) {
    return 139;
  }
  if ( cp == 338 ) {
    return 140;
  }
  if ( cp == 381 ) {
    return 142;
  }
  if ( cp == 8216 ) {
    return 145;
  }
  if ( cp == 8217 ) {
    return 146;
  }
  if ( cp == 8220 ) {
    return 147;
  }
  if ( cp == 8221 ) {
    return 148;
  }
  if ( cp == 8226 ) {
    return 149;
  }
  if ( cp == 8211 ) {
    return 150;
  }
  if ( cp == 8212 ) {
    return 151;
  }
  if ( cp == 732 ) {
    return 152;
  }
  if ( cp == 8482 ) {
    return 153;
  }
  if ( cp == 353 ) {
    return 154;
  }
  if ( cp == 8250 ) {
    return 155;
  }
  if ( cp == 339 ) {
    return 156;
  }
  if ( cp == 382 ) {
    return 158;
  }
  if ( cp == 376 ) {
    return 159;
  }
  return 0 - 1;
};
Utf8.fromWinAnsi = function(b) {
  if ( (b >= 32) && (b <= 126) ) {
    return b;
  }
  if ( (b >= 160) && (b <= 255) ) {
    return b;
  }
  if ( b == 128 ) {
    return 8364;
  }
  if ( b == 130 ) {
    return 8218;
  }
  if ( b == 131 ) {
    return 402;
  }
  if ( b == 132 ) {
    return 8222;
  }
  if ( b == 133 ) {
    return 8230;
  }
  if ( b == 134 ) {
    return 8224;
  }
  if ( b == 135 ) {
    return 8225;
  }
  if ( b == 136 ) {
    return 710;
  }
  if ( b == 137 ) {
    return 8240;
  }
  if ( b == 138 ) {
    return 352;
  }
  if ( b == 139 ) {
    return 8249;
  }
  if ( b == 140 ) {
    return 338;
  }
  if ( b == 142 ) {
    return 381;
  }
  if ( b == 145 ) {
    return 8216;
  }
  if ( b == 146 ) {
    return 8217;
  }
  if ( b == 147 ) {
    return 8220;
  }
  if ( b == 148 ) {
    return 8221;
  }
  if ( b == 149 ) {
    return 8226;
  }
  if ( b == 150 ) {
    return 8211;
  }
  if ( b == 151 ) {
    return 8212;
  }
  if ( b == 152 ) {
    return 732;
  }
  if ( b == 153 ) {
    return 8482;
  }
  if ( b == 154 ) {
    return 353;
  }
  if ( b == 155 ) {
    return 8250;
  }
  if ( b == 156 ) {
    return 339;
  }
  if ( b == 158 ) {
    return 382;
  }
  if ( b == 159 ) {
    return 376;
  }
  return 0 - 1;
};
Utf8.hasNonWinAnsi = function(s) {
  let i = 0;
  while (i < (s.length)) {
    const cp = EVGCodepoint.codeAt(s, i);
    const step = EVGCodepoint.unitsAt(s, i);
    if ( cp >= 32 ) {
      if ( Utf8.toWinAnsi(cp) < 0 ) {
        return true;
      }
    }
    i = i + step;
  };
  return false;
};
class OdfPackage  {
  constructor() {
    this.reader = new ZipReader();
    this.isOpen = false;
    this.dir = ".";
    this.filename = "";
    this.mediaType = "";
    this.mediaTypes = {};
    this.manifestLoaded = false;
  }
  open (fullPath) {
    let dirs = [];
    let names = [];
    OdfPackage.splitPath(fullPath, dirs, names);
    return this.openParts((dirs[0]), (names[0]));
  };
  openParts (path, name) {
    this.resetState();
    this.dir = path;
    this.filename = name;
    const ok = this.reader.open(path, name);
    if ( ok == false ) {
      this.isOpen = false;
      return false;
    }
    this.isOpen = true;
    return this.readIdentity();
  };
  openBytes (bytes, name) {
    this.resetState();
    this.dir = "";
    this.filename = name;
    const ok = this.reader.openBytes(bytes);
    if ( ok == false ) {
      this.isOpen = false;
      return false;
    }
    this.isOpen = true;
    return this.readIdentity();
  };
  readIdentity () {
    this.mediaType = "";
    const raw = this.readBinary("mimetype");
    if ( (raw.byteLength) > 0 ) {
      this.mediaType = Utf8.decode(((function(b){ var v = (b instanceof Uint8Array) ? b : new Uint8Array(b); var s = ""; var i = 0; var n = v.length; var c = 32768; while (i < n) { var e = i + c; if (e > n) { e = n; } s += String.fromCharCode.apply(null, v.subarray(i, e)); i = e; } return s; })(raw)));
      this.mediaType = OdfPackage.trimText(this.mediaType);
    }
    if ( (this.mediaType.length) == 0 ) {
      this.loadManifest();
      if ( ( typeof(this.mediaTypes["/"] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.mediaTypes, "/") ) ) {
        this.mediaType = (( Object.prototype.hasOwnProperty.call(this.mediaTypes, "/") ? this.mediaTypes["/"] : undefined ));
      }
    }
    if ( (OdfPackage.kindOfMediaType(this.mediaType).length) == 0 ) {
      this.isOpen = false;
      return false;
    }
    return true;
  };
  resetState () {
    let empty = {};
    this.mediaTypes = empty;
    this.manifestLoaded = false;
    this.mediaType = "";
  };
  close () {
    this.reader.close();
    this.isOpen = false;
  };
  kind () {
    return OdfPackage.kindOfMediaType(this.mediaType);
  };
  listParts () {
    if ( this.isOpen == false ) {
      let empty = [];
      return empty;
    }
    return this.reader.listFiles();
  };
  hasPart (name) {
    if ( this.isOpen == false ) {
      return false;
    }
    const e = this.reader.getEntry(name);
    if ( (typeof(e) !== "undefined" && e != null )  ) {
      return true;
    }
    return false;
  };
  readBinary (name) {
    if ( this.isOpen == false ) {
      return (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    }
    const e = this.reader.getEntry(name);
    if ( typeof(e) === "undefined" ) {
      return (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    }
    const entry = e;
    return this.reader.extract(entry);
  };
  readXml (name) {
    const data = this.readBinary(name);
    if ( (data.byteLength) == 0 ) {
      return "";
    }
    return Utf8.decode(((function(b){ var v = (b instanceof Uint8Array) ? b : new Uint8Array(b); var s = ""; var i = 0; var n = v.length; var c = 32768; while (i < n) { var e = i + c; if (e > n) { e = n; } s += String.fromCharCode.apply(null, v.subarray(i, e)); i = e; } return s; })(data)));
  };
  loadManifest () {
    if ( this.manifestLoaded ) {
      return;
    }
    this.manifestLoaded = true;
    const xml = this.readXml("META-INF/manifest.xml");
    if ( (xml.length) == 0 ) {
      return;
    }
    let pos = 0;
    const __len = xml.length;
    while (pos < __len) {
      const lt = xml.indexOf("<", pos);
      if ( lt < 0 ) {
        break;
      }
      const gt = xml.indexOf(">", lt);
      if ( gt < 0 ) {
        break;
      }
      const tag = xml.substring(lt, (gt + 1) );
      if ( (tag.indexOf("file-entry")) > 0 ) {
        const path = OdfPackage.attrBySuffix(tag, "full-path");
        const mt = OdfPackage.attrBySuffix(tag, "media-type");
        if ( (path.length) > 0 ) {
          this.mediaTypes[path] = mt;
        }
      }
      pos = gt + 1;
    };
  };
  mediaTypeFor (path) {
    this.loadManifest();
    if ( ( typeof(this.mediaTypes[path] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.mediaTypes, path) ) ) {
      return (( Object.prototype.hasOwnProperty.call(this.mediaTypes, path) ? this.mediaTypes[path] : undefined ));
    }
    return "";
  };
  manifestPaths () {
    this.loadManifest();
    let out = [];
    const keys = Object.keys(this.mediaTypes);
    let i = 0;
    while (i < (keys.length)) {
      out.push(keys[i]);
      i = i + 1;
    };
    return out;
  };
}
OdfPackage.splitPath = function(fullPath, dirOut, nameOut) {
  let dir = ".";
  let name = fullPath;
  let lastSlash = -1;
  const __len = fullPath.length;
  let i = 0;
  while (i < __len) {
    const ch = fullPath.charCodeAt(i );
    if ( (ch == 47) || (ch == 92) ) {
      lastSlash = i;
    }
    i = i + 1;
  };
  if ( lastSlash >= 0 ) {
    if ( lastSlash == 0 ) {
      dir = "/";
    } else {
      dir = fullPath.substring(0, lastSlash );
    }
    name = fullPath.substring((lastSlash + 1), __len );
  }
  dirOut.push(dir);
  nameOut.push(name);
};
OdfPackage.kindOfMediaType = function(mt) {
  const base = "application/vnd.oasis.opendocument.";
  if ( (mt.indexOf(base)) != 0 ) {
    return "";
  }
  const tail = mt.substring((base.length), (mt.length) );
  if ( (tail == "presentation") || (tail == "presentation-template") ) {
    return "presentation";
  }
  if ( (tail == "text") || (tail == "text-template") ) {
    return "text";
  }
  if ( (tail == "spreadsheet") || (tail == "spreadsheet-template") ) {
    return "spreadsheet";
  }
  if ( (tail == "graphics") || (tail == "graphics-template") ) {
    return "graphics";
  }
  return "";
};
OdfPackage.sniffKind = function(bytes) {
  if ( (bytes.byteLength) < 80 ) {
    return "";
  }
  if ( (bytes._view.getUint8(0)) != 80 ) {
    return "";
  }
  if ( (bytes._view.getUint8(1)) != 75 ) {
    return "";
  }
  if ( (bytes._view.getUint8(2)) != 3 ) {
    return "";
  }
  if ( (bytes._view.getUint8(3)) != 4 ) {
    return "";
  }
  const name = "mimetype";
  let i = 0;
  while (i < 8) {
    if ( (bytes._view.getUint8((30 + i))) != (name.charCodeAt(i )) ) {
      return "";
    }
    i = i + 1;
  };
  let n = bytes._view.getUint8(22);
  n = n + ((bytes._view.getUint8(23)) * 256);
  if ( (n <= 0) || (n > 128) ) {
    return "";
  }
  if ( (bytes.byteLength) < (38 + n) ) {
    return "";
  }
  let mt = "";
  let k = 0;
  while (k < n) {
    mt = mt + (String.fromCharCode((bytes._view.getUint8((38 + k)))));
    k = k + 1;
  };
  return OdfPackage.kindOfMediaType(mt);
};
OdfPackage.attrBySuffix = function(tag, localName) {
  const key = localName + "=\"";
  const i = tag.indexOf(key);
  if ( i < 0 ) {
    return "";
  }
  const a = i + (key.length);
  const b = tag.indexOf("\"", a);
  if ( b < 0 ) {
    return "";
  }
  return tag.substring(a, b );
};
OdfPackage.isExternalHref = function(href) {
  if ( (href.indexOf("://")) > 0 ) {
    return true;
  }
  if ( (href.indexOf("mailto:")) == 0 ) {
    return true;
  }
  return false;
};
OdfPackage.joinHref = function(base, href) {
  if ( (href.length) == 0 ) {
    return base;
  }
  const h0 = href.charCodeAt(0 );
  if ( h0 == 47 ) {
    return href.substring(1, (href.length) );
  }
  let segs = [];
  const baseDir = OdfPackage.dirOf(base);
  if ( (baseDir.length) > 0 ) {
    OdfPackage.splitSegments(baseDir, segs);
  }
  let hrefSegs = [];
  OdfPackage.splitSegments(href, hrefSegs);
  let i = 0;
  while (i < (hrefSegs.length)) {
    const seg = hrefSegs[i];
    if ( seg == ".." ) {
      if ( (segs.length) > 0 ) {
        segs.pop();
      }
    } else {
      if ( seg != "." ) {
        segs.push(seg);
      }
    }
    i = i + 1;
  };
  return segs.join("/");
};
OdfPackage.dirOf = function(path) {
  let last = -1;
  let i = 0;
  while (i < (path.length)) {
    if ( (path.charCodeAt(i )) == 47 ) {
      last = i;
    }
    i = i + 1;
  };
  if ( last < 0 ) {
    return "";
  }
  return path.substring(0, last );
};
OdfPackage.splitSegments = function(s, out) {
  let start = 0;
  let i = 0;
  const __len = s.length;
  while (i <= __len) {
    const atEnd = i == __len;
    let isSep = false;
    if ( atEnd == false ) {
      if ( (s.charCodeAt(i )) == 47 ) {
        isSep = true;
      }
    }
    if ( atEnd || isSep ) {
      if ( i > start ) {
        out.push(s.substring(start, i ));
      }
      start = i + 1;
    }
    i = i + 1;
  };
};
OdfPackage.trimText = function(s) {
  let a = 0;
  let b = s.length;
  while (a < b) {
    const c = s.charCodeAt(a );
    if ( (((c == 32) || (c == 9)) || (c == 10)) || (c == 13) ) {
      a = a + 1;
    } else {
      break;
    }
  };
  while (b > a) {
    const c2 = s.charCodeAt((b - 1) );
    if ( (((c2 == 32) || (c2 == 9)) || (c2 == 10)) || (c2 == 13) ) {
      b = b - 1;
    } else {
      break;
    }
  };
  return s.substring(a, b );
};
class OdfCheck  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  ok (name, cond) {
    if ( cond ) {
      this.passed = this.passed + 1;
      console.log("  PASS " + name);
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL " + name);
    }
  };
  eqStr (name, got, want) {
    this.ok(((((name + " (got '") + got) + "' want '") + want) + "')", got == want);
  };
  eqInt (name, got, want) {
    this.ok(((((name + " (got ") + ((got.toString()))) + " want ") + ((want.toString()))) + ")", got == want);
  };
}
class OdfPackageTest  {
  constructor() {
  }
}
OdfPackageTest.testPaths = function(c) {
  console.log("--- href resolution ---");
  c.eqStr("a picture from content.xml", OdfPackage.joinHref("content.xml", "Pictures/x.png"), "Pictures/x.png");
  c.eqStr("a sibling of a sub-document", OdfPackage.joinHref("Object 1/content.xml", "styles.xml"), "Object 1/styles.xml");
  c.eqStr("out of a sub-document", OdfPackage.joinHref("Object 1/content.xml", "../Pictures/x.png"), "Pictures/x.png");
  c.eqStr("two levels out", OdfPackage.joinHref("a/b/content.xml", "../../Pictures/x.png"), "Pictures/x.png");
  c.eqStr("a leading slash is the package root", OdfPackage.joinHref("Object 1/content.xml", "/styles.xml"), "styles.xml");
  c.eqStr("`.` is a no-op", OdfPackage.joinHref("content.xml", "./Pictures/x.png"), "Pictures/x.png");
  c.ok("http is external", OdfPackage.isExternalHref("https://example.org/x.png"));
  c.ok("a member is not", OdfPackage.isExternalHref("Pictures/x.png") == false);
  console.log("--- what a media type means ---");
  c.eqStr("presentation", OdfPackage.kindOfMediaType("application/vnd.oasis.opendocument.presentation"), "presentation");
  c.eqStr("text", OdfPackage.kindOfMediaType("application/vnd.oasis.opendocument.text"), "text");
  c.eqStr("spreadsheet", OdfPackage.kindOfMediaType("application/vnd.oasis.opendocument.spreadsheet"), "spreadsheet");
  c.eqStr("a template is a presentation", OdfPackage.kindOfMediaType("application/vnd.oasis.opendocument.presentation-template"), "presentation");
  c.eqStr("OOXML is not ODF", OdfPackage.kindOfMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation"), "");
  c.eqStr("nothing is not ODF", OdfPackage.kindOfMediaType(""), "");
};
OdfPackageTest.testSniff = function(c) {
  console.log("--- sniffKind, without a ZIP library ---");
  c.eqStr("an .odp is a presentation", OdfPackageTest.sniffFile("gallery/odf/fixtures", "01-text.odp"), "presentation");
  c.eqStr("an .odt is text", OdfPackageTest.sniffFile("gallery/odf/fixtures", "13-images-mixed.odt"), "text");
  c.eqStr("an .ods is a spreadsheet", OdfPackageTest.sniffFile("gallery/odf/fixtures", "images.ods"), "spreadsheet");
  c.eqStr("a .pptx is not ODF", OdfPackageTest.sniffFile("gallery/pptx/fixtures", "01-text.pptx"), "");
};
OdfPackageTest.sniffFile = function(dir, name) {
  const bytes = (function(){ var b = require('fs').readFileSync(dir + '/' + name); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
  return OdfPackage.sniffKind(bytes);
};
OdfPackageTest.testThreeFormats = function(c) {
  console.log("--- one reader, three formats ---");
  OdfPackageTest.checkPackage(c, "01-text.odp", "presentation");
  OdfPackageTest.checkPackage(c, "13-images-mixed.odt", "text");
  OdfPackageTest.checkPackage(c, "images.ods", "spreadsheet");
};
OdfPackageTest.checkPackage = function(c, name, wantKind) {
  const pkg = new OdfPackage();
  const ok = pkg.openParts("gallery/odf/fixtures", name);
  c.ok(name + " opens", ok);
  if ( ok == false ) {
    return;
  }
  c.eqStr(name + " kind", pkg.kind(), wantKind);
  c.ok(name + " has content.xml", pkg.hasPart("content.xml"));
  c.ok(name + " has styles.xml", pkg.hasPart("styles.xml"));
  c.ok(name + " has a manifest", pkg.hasPart("META-INF/manifest.xml"));
  c.eqStr(name + " manifest calls content.xml XML", pkg.mediaTypeFor("content.xml"), "text/xml");
  const xml = pkg.readXml("content.xml");
  c.ok(name + " content.xml decodes", (xml.length) > 100);
  c.ok(name + " and is a document", (xml.indexOf("office:document-content")) > 0);
  pkg.close();
};
OdfPackageTest.testEveryHrefResolves = function(c) {
  console.log("--- every xlink:href names a member that exists ---");
  OdfPackageTest.checkHrefs(c, "gallery/odf/fixtures", "03-image.odp");
  OdfPackageTest.checkHrefs(c, "gallery/odf/fixtures", "13-images-mixed.odt");
  OdfPackageTest.checkHrefs(c, "gallery/odf/fixtures", "images.ods");
};
OdfPackageTest.checkHrefs = function(c, dir, name) {
  const pkg = new OdfPackage();
  const ok = pkg.openParts(dir, name);
  c.ok(name + " opens for the href walk", ok);
  if ( ok == false ) {
    return;
  }
  let parts = [];
  parts.push("content.xml");
  parts.push("styles.xml");
  let checked = 0;
  let missing = 0;
  let firstMissing = "";
  let pi = 0;
  while (pi < (parts.length)) {
    const part = parts[pi];
    const xml = pkg.readXml(part);
    let hrefs = [];
    OdfPackageTest.collectHrefs(xml, hrefs);
    let i = 0;
    while (i < (hrefs.length)) {
      const href = hrefs[i];
      if ( OdfPackage.isExternalHref(href) == false ) {
        const target = OdfPackage.joinHref(part, href);
        if ( (target.length) > 0 ) {
          checked = checked + 1;
          if ( pkg.hasPart(target) == false ) {
            missing = missing + 1;
            if ( (firstMissing.length) == 0 ) {
              firstMissing = (href + " -> ") + target;
            }
          }
        }
      }
      i = i + 1;
    };
    pi = pi + 1;
  };
  c.ok(((name + " has internal hrefs to check (") + ((checked.toString()))) + ")", checked > 0);
  c.ok(((name + " every one resolves to a member [") + firstMissing) + "]", missing == 0);
  pkg.close();
};
OdfPackageTest.collectHrefs = function(xml, out) {
  const key = "xlink:href=\"";
  let pos = 0;
  while (pos < (xml.length)) {
    const i = xml.indexOf(key, pos);
    if ( i < 0 ) {
      break;
    }
    const a = i + (key.length);
    const b = xml.indexOf("\"", a);
    if ( b < 0 ) {
      break;
    }
    const href = xml.substring(a, b );
    if ( (href.length) > 0 ) {
      out.push(href);
    }
    pos = b + 1;
  };
};
OdfPackageTest.testNotOdf = function(c) {
  console.log("--- a package that is not ODF ---");
  const pkg = new OdfPackage();
  const ok = pkg.openParts("gallery/pptx/fixtures", "01-text.pptx");
  c.ok("a .pptx does not open as ODF", ok == false);
  pkg.close();
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("== OdfPackageTest ==");
  const c = new OdfCheck();
  OdfPackageTest.testPaths(c);
  OdfPackageTest.testSniff(c);
  OdfPackageTest.testThreeFormats(c);
  OdfPackageTest.testEveryHrefResolves(c);
  OdfPackageTest.testNotOdf(c);
  console.log("");
  console.log((("passed = " + ((c.passed.toString()))) + "  failed = ") + ((c.failed.toString())));
  if ( c.failed == 0 ) {
    console.log("ALL PASS");
  } else {
    console.log("FAILURES");
  }
}
__js_main();
