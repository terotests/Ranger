#!/usr/bin/env node
class BufferChunk  {
  constructor(size) {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.used = 0;
    this.capacity = 0;
    this.data = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.capacity = size;
    this.used = 0;
  }
  remaining () {
    return this.capacity - this.used;
  };
  isFull () {
    return this.used >= this.capacity;
  };
}
class GrowableBuffer  {
  constructor() {
    this.chunkSize = 4096;
    this.totalSize = 0;
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
  }
  setChunkSize (size) {
    this.chunkSize = size;
  };
  allocateNewChunk () {
    const newChunk = new BufferChunk(this.chunkSize);
    this.currentChunk.next = newChunk;
    this.currentChunk = newChunk;
  };
  writeByte (b) {
    if ( this.currentChunk.isFull() ) {
      this.allocateNewChunk();
    }
    const buf = this.currentChunk.data;
    const pos = this.currentChunk.used;
    buf._view.setUint8(pos, b);
    this.currentChunk.used = pos + 1;
    this.totalSize = this.totalSize + 1;
  };
  writeBytes (src, srcOffset, length) {
    let i = 0;
    while (i < length) {
      const b = src._view.getUint8((srcOffset + i));
      this.writeByte(b);
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
      this.writeByte(ch);
      i = i + 1;
    };
  };
  writeInt16BE (value) {
    const highD = value / 256;
    const high = Math.floor( highD);
    const low = value - (high * 256);
    this.writeByte(high);
    this.writeByte(low);
  };
  writeInt32BE (value) {
    const b1D = value / 16777216;
    const b1 = Math.floor( b1D);
    const rem1 = value - (b1 * 16777216);
    const b2D = rem1 / 65536;
    const b2 = Math.floor( b2D);
    const rem2 = rem1 - (b2 * 65536);
    const b3D = rem2 / 256;
    const b3 = Math.floor( b3D);
    const b4 = rem2 - (b3 * 256);
    this.writeByte(b1);
    this.writeByte(b2);
    this.writeByte(b3);
    this.writeByte(b4);
  };
  size () {
    return this.totalSize;
  };
  toBuffer () {
    const allocSize = this.totalSize;
    const result = (function(){ var b = new ArrayBuffer(allocSize); b._view = new DataView(b); return b; })();
    let pos = 0;
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
        result._view.setUint8(pos, b);
        pos = pos + 1;
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  toString () {
    let result = "";
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
        result = result + (String.fromCharCode(b));
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  clear () {
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
    this.totalSize = 0;
  };
}
class BitReader  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataStart = 0;
    this.dataEnd = 0;
    this.bytePos = 0;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  }
  init (buf, startPos, length) {
    this.data = buf;
    this.dataStart = startPos;
    this.dataEnd = startPos + length;
    this.bytePos = startPos;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  };
  loadNextByte () {
    if ( this.bytePos >= this.dataEnd ) {
      this.eof = true;
      this.currentByte = 0;
      this.bitPos = 8;
      return;
    }
    this.currentByte = this.data._view.getUint8(this.bytePos);
    this.bytePos = this.bytePos + 1;
    if ( this.currentByte == 255 ) {
      if ( this.bytePos < this.dataEnd ) {
        const nextByte = this.data._view.getUint8(this.bytePos);
        if ( nextByte == 0 ) {
          this.bytePos = this.bytePos + 1;
        } else {
          if ( nextByte == 255 ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
        }
      }
    }
    this.bitPos = 8;
  };
  readBit () {
    if ( this.bitPos == 0 ) {
      this.loadNextByte();
    }
    if ( this.eof ) {
      return 0;
    }
    this.bitPos = this.bitPos - 1;
    const bit = (((this.currentByte >> this.bitPos)) & 1);
    return bit;
  };
  readBits (count) {
    let result = 0;
    let i = 0;
    while (i < count) {
      result = (((result << 1)) | this.readBit());
      i = i + 1;
    };
    return result;
  };
  peekBits (count) {
    const savedBytePos = this.bytePos;
    const savedBitPos = this.bitPos;
    const savedCurrentByte = this.currentByte;
    const savedEof = this.eof;
    const result = this.readBits(count);
    this.bytePos = savedBytePos;
    this.bitPos = savedBitPos;
    this.currentByte = savedCurrentByte;
    this.eof = savedEof;
    return result;
  };
  alignToByte () {
    this.bitPos = 0;
  };
  getBytePosition () {
    return this.bytePos;
  };
  isEOF () {
    return this.eof;
  };
  receiveExtend (length) {
    if ( length == 0 ) {
      return 0;
    }
    let value = this.readBits(length);
    const threshold = (1 << (length - 1));
    if ( value < threshold ) {
      value = value - (((threshold << 1)) - 1);
    }
    return value;
  };
}
class HuffmanTable  {
  constructor() {
    this.bits = [];
    this.values = [];
    this.maxCode = [];
    this.minCode = [];
    this.valPtr = [];
    this.tableClass = 0;
    this.tableId = 0;
    let i = 0;
    while (i < 16) {
      this.bits.push(0);
      this.maxCode.push(-1);
      this.minCode.push(0);
      this.valPtr.push(0);
      i = i + 1;
    };
  }
  build () {
    let code = 0;
    let valueIdx = 0;
    let i = 0;
    while (i < 16) {
      const count = this.bits[i];
      if ( count > 0 ) {
        this.minCode[i] = code;
        this.valPtr[i] = valueIdx;
        valueIdx = valueIdx + count;
        code = code + count;
        this.maxCode[i] = code - 1;
      } else {
        this.maxCode[i] = -1;
        this.minCode[i] = 0;
        this.valPtr[i] = valueIdx;
      }
      code = (code << 1);
      i = i + 1;
    };
  };
  decode (reader) {
    let code = 0;
    let length = 0;
    while (length < 16) {
      const bit = reader.readBit();
      code = (((code << 1)) | bit);
      const maxC = this.maxCode[length];
      if ( maxC >= 0 ) {
        if ( code <= maxC ) {
          const minC = this.minCode[length];
          const ptr = this.valPtr[length];
          const idx = ptr + (code - minC);
          return this.values[idx];
        }
      }
      length = length + 1;
    };
    console.log("Huffman decode error: code not found");
    return 0;
  };
}
class HuffmanDecoder  {
  constructor() {
    this.dcTable0 = new HuffmanTable();
    this.dcTable1 = new HuffmanTable();
    this.acTable0 = new HuffmanTable();
    this.acTable1 = new HuffmanTable();
  }
  getDCTable (id) {
    if ( id == 0 ) {
      return this.dcTable0;
    }
    return this.dcTable1;
  };
  getACTable (id) {
    if ( id == 0 ) {
      return this.acTable0;
    }
    return this.acTable1;
  };
  parseDHT (data, pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const tableInfo = data._view.getUint8(pos);
      pos = pos + 1;
      const tableClass = (tableInfo >> 4);
      const tableId = (tableInfo & 15);
      let table = this.getDCTable(tableId);
      if ( tableClass == 1 ) {
        table = this.getACTable(tableId);
      }
      table.tableClass = tableClass;
      table.tableId = tableId;
      table.bits.length = 0;
      let totalSymbols = 0;
      let i = 0;
      while (i < 16) {
        const count = data._view.getUint8(pos);
        table.bits.push(count);
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
        i = i + 1;
      };
      table.values.length = 0;
      table.maxCode.length = 0;
      table.minCode.length = 0;
      table.valPtr.length = 0;
      i = 0;
      while (i < 16) {
        table.maxCode.push(-1);
        table.minCode.push(0);
        table.valPtr.push(0);
        i = i + 1;
      };
      i = 0;
      while (i < totalSymbols) {
        table.values.push(data._view.getUint8(pos));
        pos = pos + 1;
        i = i + 1;
      };
      table.build();
      let classStr = "DC";
      if ( tableClass == 1 ) {
        classStr = "AC";
      }
      console.log((((("  Huffman table " + classStr) + ((tableId.toString()))) + ": ") + ((totalSymbols.toString()))) + " symbols");
    };
  };
}
class IDCT  {
  constructor() {
    this.cosTable = [];
    this.zigzagMap = [];
    this.cosTable.push(1024);
    this.cosTable.push(1004);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(724);
    this.cosTable.push(569);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(1024);
    this.cosTable.push(851);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.cosTable.push(-724);
    this.cosTable.push(-1004);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(1024);
    this.cosTable.push(569);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(-724);
    this.cosTable.push(200);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(1024);
    this.cosTable.push(200);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(724);
    this.cosTable.push(851);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(1024);
    this.cosTable.push(-200);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(724);
    this.cosTable.push(-851);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(1024);
    this.cosTable.push(-569);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(-724);
    this.cosTable.push(-200);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(1024);
    this.cosTable.push(-851);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(-724);
    this.cosTable.push(1004);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(1024);
    this.cosTable.push(-1004);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(724);
    this.cosTable.push(-569);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.zigzagMap.push(0);
    this.zigzagMap.push(1);
    this.zigzagMap.push(8);
    this.zigzagMap.push(16);
    this.zigzagMap.push(9);
    this.zigzagMap.push(2);
    this.zigzagMap.push(3);
    this.zigzagMap.push(10);
    this.zigzagMap.push(17);
    this.zigzagMap.push(24);
    this.zigzagMap.push(32);
    this.zigzagMap.push(25);
    this.zigzagMap.push(18);
    this.zigzagMap.push(11);
    this.zigzagMap.push(4);
    this.zigzagMap.push(5);
    this.zigzagMap.push(12);
    this.zigzagMap.push(19);
    this.zigzagMap.push(26);
    this.zigzagMap.push(33);
    this.zigzagMap.push(40);
    this.zigzagMap.push(48);
    this.zigzagMap.push(41);
    this.zigzagMap.push(34);
    this.zigzagMap.push(27);
    this.zigzagMap.push(20);
    this.zigzagMap.push(13);
    this.zigzagMap.push(6);
    this.zigzagMap.push(7);
    this.zigzagMap.push(14);
    this.zigzagMap.push(21);
    this.zigzagMap.push(28);
    this.zigzagMap.push(35);
    this.zigzagMap.push(42);
    this.zigzagMap.push(49);
    this.zigzagMap.push(56);
    this.zigzagMap.push(57);
    this.zigzagMap.push(50);
    this.zigzagMap.push(43);
    this.zigzagMap.push(36);
    this.zigzagMap.push(29);
    this.zigzagMap.push(22);
    this.zigzagMap.push(15);
    this.zigzagMap.push(23);
    this.zigzagMap.push(30);
    this.zigzagMap.push(37);
    this.zigzagMap.push(44);
    this.zigzagMap.push(51);
    this.zigzagMap.push(58);
    this.zigzagMap.push(59);
    this.zigzagMap.push(52);
    this.zigzagMap.push(45);
    this.zigzagMap.push(38);
    this.zigzagMap.push(31);
    this.zigzagMap.push(39);
    this.zigzagMap.push(46);
    this.zigzagMap.push(53);
    this.zigzagMap.push(60);
    this.zigzagMap.push(61);
    this.zigzagMap.push(54);
    this.zigzagMap.push(47);
    this.zigzagMap.push(55);
    this.zigzagMap.push(62);
    this.zigzagMap.push(63);
  }
  dezigzag (zigzag, block) {
    block.length = 0;
    let i = 0;
    while (i < 64) {
      block.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < 64) {
      const pos = this.zigzagMap[i];
      block[pos] = zigzag[i];
      i = i + 1;
    };
  };
  idct1d (input, startIdx, stride, output, outIdx, outStride) {
    let x = 0;
    while (x < 8) {
      let sum = 0;
      let u = 0;
      while (u < 8) {
        const coeff = input[(startIdx + (u * stride))];
        if ( coeff != 0 ) {
          const cosVal = this.cosTable[((x * 8) + u)];
          let contrib = coeff * cosVal;
          if ( u == 0 ) {
            contrib = ((contrib * 724) >> 10);
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[outIdx + (x * outStride)] = (sum >> 11);
      x = x + 1;
    };
  };
  transform (block, output) {
    let temp = [];
    let i = 0;
    while (i < 64) {
      temp.push(0);
      i = i + 1;
    };
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.idct1d(block, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    let col = 0;
    while (col < 8) {
      this.idct1d(temp, col, 8, output, col, 8);
      col = col + 1;
    };
    i = 0;
    while (i < 64) {
      let val = (output[i]) + 128;
      if ( val < 0 ) {
        val = 0;
      }
      if ( val > 255 ) {
        val = 255;
      }
      output[i] = val;
      i = i + 1;
    };
  };
  transformFast (coeffs, output) {
    this.transform(coeffs, output);
  };
}
class Color  {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  setRGB (red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
  setRGBA (red, green, blue, alpha) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  clamp (val) {
    if ( val < 0 ) {
      return 0;
    }
    if ( val > 255 ) {
      return 255;
    }
    return val;
  };
  set (red, green, blue) {
    this.r = this.clamp(red);
    this.g = this.clamp(green);
    this.b = this.clamp(blue);
  };
  grayscale () {
    return ((((this.r * 77) + (this.g * 150)) + (this.b * 29)) >> 8);
  };
  toGrayscale () {
    const gray = this.grayscale();
    this.r = gray;
    this.g = gray;
    this.b = gray;
  };
  invert () {
    this.r = 255 - this.r;
    this.g = 255 - this.g;
    this.b = 255 - this.b;
  };
  adjustBrightness (amount) {
    this.r = this.clamp((this.r + amount));
    this.g = this.clamp((this.g + amount));
    this.b = this.clamp((this.b + amount));
  };
}
class ImageBuffer  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixels = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
  }
  init (w, h) {
    this.width = w;
    this.height = h;
    const size = (w * h) * 4;
    this.pixels = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.fill(255, 255, 255, 255);
  };
  getPixelOffset (x, y) {
    return ((y * this.width) + x) * 4;
  };
  isValidCoord (x, y) {
    if ( x < 0 ) {
      return false;
    }
    if ( y < 0 ) {
      return false;
    }
    if ( x >= this.width ) {
      return false;
    }
    if ( y >= this.height ) {
      return false;
    }
    return true;
  };
  getPixel (x, y) {
    const c = new Color();
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      c.r = this.pixels._view.getUint8(off);
      c.g = this.pixels._view.getUint8((off + 1));
      c.b = this.pixels._view.getUint8((off + 2));
      c.a = this.pixels._view.getUint8((off + 3));
    }
    return c;
  };
  setPixel (x, y, c) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, c.r);
      this.pixels._view.setUint8(off + 1, c.g);
      this.pixels._view.setUint8(off + 2, c.b);
      this.pixels._view.setUint8(off + 3, c.a);
    }
  };
  setPixelRGB (x, y, r, g, b) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      this.pixels._view.setUint8(off + 3, 255);
    }
  };
  fill (r, g, b, a) {
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, r);
      this.pixels._view.setUint8(i + 1, g);
      this.pixels._view.setUint8(i + 2, b);
      this.pixels._view.setUint8(i + 3, a);
      i = i + 4;
    };
  };
  fillRect (x, y, w, h, c) {
    const endX = x + w;
    const endY = y + h;
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.setPixel(px, py, c);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  invert () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      this.pixels._view.setUint8(off, 255 - r);
      this.pixels._view.setUint8(off + 1, 255 - g);
      this.pixels._view.setUint8(off + 2, 255 - b);
      i = i + 1;
    };
  };
  grayscale () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      this.pixels._view.setUint8(off, gray);
      this.pixels._view.setUint8(off + 1, gray);
      this.pixels._view.setUint8(off + 2, gray);
      i = i + 1;
    };
  };
  adjustBrightness (amount) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      let r = this.pixels._view.getUint8(off);
      let g = this.pixels._view.getUint8((off + 1));
      let b = this.pixels._view.getUint8((off + 2));
      r = r + amount;
      g = g + amount;
      b = b + amount;
      if ( r < 0 ) {
        r = 0;
      }
      if ( r > 255 ) {
        r = 255;
      }
      if ( g < 0 ) {
        g = 0;
      }
      if ( g > 255 ) {
        g = 255;
      }
      if ( b < 0 ) {
        b = 0;
      }
      if ( b > 255 ) {
        b = 255;
      }
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      i = i + 1;
    };
  };
  threshold (level) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      let val = 0;
      if ( gray >= level ) {
        val = 255;
      }
      this.pixels._view.setUint8(off, val);
      this.pixels._view.setUint8(off + 1, val);
      this.pixels._view.setUint8(off + 2, val);
      i = i + 1;
    };
  };
  sepia () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      let newR = ((((r * 101) + (g * 197)) + (b * 48)) >> 8);
      let newG = ((((r * 89) + (g * 175)) + (b * 43)) >> 8);
      let newB = ((((r * 70) + (g * 137)) + (b * 33)) >> 8);
      if ( newR > 255 ) {
        newR = 255;
      }
      if ( newG > 255 ) {
        newG = 255;
      }
      if ( newB > 255 ) {
        newB = 255;
      }
      this.pixels._view.setUint8(off, newR);
      this.pixels._view.setUint8(off + 1, newG);
      this.pixels._view.setUint8(off + 2, newB);
      i = i + 1;
    };
  };
  flipHorizontal () {
    let y = 0;
    while (y < this.height) {
      let x = 0;
      const halfW = (this.width >> 1);
      while (x < halfW) {
        const x2 = (this.width - 1) - x;
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x2, y);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  flipVertical () {
    let y = 0;
    const halfH = (this.height >> 1);
    while (y < halfH) {
      const y2 = (this.height - 1) - y;
      let x = 0;
      while (x < this.width) {
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x, y2);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawLine (x1, y1, x2, y2, c) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    if ( dx < 0 ) {
      dx = 0 - dx;
    }
    if ( dy < 0 ) {
      dy = 0 - dy;
    }
    let sx = 1;
    if ( x1 > x2 ) {
      sx = -1;
    }
    let sy = 1;
    if ( y1 > y2 ) {
      sy = -1;
    }
    let err = dx - dy;
    let x = x1;
    let y = y1;
    let done = false;
    while (done == false) {
      this.setPixel(x, y, c);
      if ( (x == x2) && (y == y2) ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > (0 - dy) ) {
          err = err - dy;
          x = x + sx;
        }
        if ( e2 < dx ) {
          err = err + dx;
          y = y + sy;
        }
      }
    };
  };
  drawRect (x, y, w, h, c) {
    this.drawLine(x, y, (x + w) - 1, y, c);
    this.drawLine((x + w) - 1, y, (x + w) - 1, (y + h) - 1, c);
    this.drawLine((x + w) - 1, (y + h) - 1, x, (y + h) - 1, c);
    this.drawLine(x, (y + h) - 1, x, y, c);
  };
  scale (factor) {
    const newW = this.width * factor;
    const newH = this.height * factor;
    const result = new ImageBuffer();
    result.init(newW, newH);
    let destY = 0;
    while (destY < newH) {
      const srcY = Math.floor( (destY / factor));
      let destX = 0;
      while (destX < newW) {
        const srcX = Math.floor( (destX / factor));
        const srcOff = ((srcY * this.width) + srcX) * 4;
        const r = this.pixels._view.getUint8(srcOff);
        const g = this.pixels._view.getUint8((srcOff + 1));
        const b = this.pixels._view.getUint8((srcOff + 2));
        const a = this.pixels._view.getUint8((srcOff + 3));
        const destOff = ((destY * newW) + destX) * 4;
        result.pixels._view.setUint8(destOff, r);
        result.pixels._view.setUint8(destOff + 1, g);
        result.pixels._view.setUint8(destOff + 2, b);
        result.pixels._view.setUint8(destOff + 3, a);
        destX = destX + 1;
      };
      destY = destY + 1;
    };
    return result;
  };
  rotate90CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate180 () {
    const result = new ImageBuffer();
    result.init(this.width, this.height);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.width - 1) - x;
        const newY = (this.height - 1) - y;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.width) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate270CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transpose () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((x * this.height) + y) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transverse () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  applyExifOrientation (orientation) {
    if ( orientation == 1 ) {
      return this.scale(1);
    }
    if ( orientation == 2 ) {
      const result = new ImageBuffer();
      result.init(this.width, this.height);
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          const srcOff = ((y * this.width) + x) * 4;
          const destOff = ((y * this.width) + ((this.width - 1) - x)) * 4;
          result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
          result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
          result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
          result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
          x = x + 1;
        };
        y = y + 1;
      };
      return result;
    }
    if ( orientation == 3 ) {
      return this.rotate180();
    }
    if ( orientation == 4 ) {
      const result_1 = new ImageBuffer();
      result_1.init(this.width, this.height);
      let y_1 = 0;
      while (y_1 < this.height) {
        let x_1 = 0;
        while (x_1 < this.width) {
          const srcOff_1 = ((y_1 * this.width) + x_1) * 4;
          const destOff_1 = ((((this.height - 1) - y_1) * this.width) + x_1) * 4;
          result_1.pixels._view.setUint8(destOff_1, this.pixels._view.getUint8(srcOff_1));
          result_1.pixels._view.setUint8(destOff_1 + 1, this.pixels._view.getUint8((srcOff_1 + 1)));
          result_1.pixels._view.setUint8(destOff_1 + 2, this.pixels._view.getUint8((srcOff_1 + 2)));
          result_1.pixels._view.setUint8(destOff_1 + 3, this.pixels._view.getUint8((srcOff_1 + 3)));
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
      return result_1;
    }
    if ( orientation == 5 ) {
      return this.transpose();
    }
    if ( orientation == 6 ) {
      return this.rotate90CW();
    }
    if ( orientation == 7 ) {
      return this.transverse();
    }
    if ( orientation == 8 ) {
      return this.rotate270CW();
    }
    return this.scale(1);
  };
}
class PPMImage  {
  constructor() {
  }
  parseNumber (data, startPos, endPos) {
    const __len = data.byteLength;
    let pos = startPos;
    let skipping = true;
    while (skipping && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        skipping = false;
      }
    };
    let value = 0;
    let parsing = true;
    while (parsing && (pos < __len)) {
      const ch_1 = data._view.getUint8(pos);
      if ( (ch_1 >= 48) && (ch_1 <= 57) ) {
        value = (value * 10) + (ch_1 - 48);
        pos = pos + 1;
      } else {
        parsing = false;
      }
    };
    endPos[0] = pos;
    return value;
  };
  skipToNextLine (data, pos) {
    const __len = data.byteLength;
    while (pos < __len) {
      const ch = data._view.getUint8(pos);
      pos = pos + 1;
      if ( ch == 10 ) {
        return pos;
      }
    };
    return pos;
  };
  load (dirPath, fileName) {
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const __len = data.byteLength;
    if ( __len < 10 ) {
      console.log("Error: File too small: " + fileName);
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    const m1 = data._view.getUint8(0);
    const m2 = data._view.getUint8(1);
    if ( (m1 != 80) || ((m2 != 54) && (m2 != 51)) ) {
      console.log("Error: Not a PPM file (P3 or P6): " + fileName);
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    const isBinary = m2 == 54;
    let pos = 2;
    let endPos = [];
    endPos.push(0);
    let skippingComments = true;
    while (skippingComments && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        if ( ch == 35 ) {
          pos = this.skipToNextLine(data, pos);
        } else {
          skippingComments = false;
        }
      }
    };
    const width = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const height = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const maxVal = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    if ( pos < __len ) {
      pos = pos + 1;
    }
    console.log((((("Loading PPM: " + ((width.toString()))) + "x") + ((height.toString()))) + ", maxval=") + ((maxVal.toString())));
    const img = new ImageBuffer();
    img.init(width, height);
    if ( isBinary ) {
      let y = 0;
      while (y < height) {
        let x = 0;
        while (x < width) {
          if ( (pos + 2) < __len ) {
            const r = data._view.getUint8(pos);
            const g = data._view.getUint8((pos + 1));
            const b = data._view.getUint8((pos + 2));
            img.setPixelRGB(x, y, r, g, b);
            pos = pos + 3;
          }
          x = x + 1;
        };
        y = y + 1;
      };
    } else {
      let y_1 = 0;
      while (y_1 < height) {
        let x_1 = 0;
        while (x_1 < width) {
          const r_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const g_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const b_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
    }
    return img;
  };
  save (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P6\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeByte(c.r);
        buf.writeByte(c.g);
        buf.writeByte(c.b);
        x = x + 1;
      };
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
  saveP3 (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P3\n");
    buf.writeString("# Created by Ranger ImageEditor\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeString((((((c.r.toString())) + " ") + ((c.g.toString()))) + " ") + ((c.b.toString())));
        if ( x < (img.width - 1) ) {
          buf.writeString("  ");
        }
        x = x + 1;
      };
      buf.writeString("\n");
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM (ASCII): " + dirPath) + "/") + fileName);
  };
}
class JPEGComponent  {
  constructor() {
    this.id = 0;
    this.hSamp = 1;
    this.vSamp = 1;
    this.quantTableId = 0;
    this.dcTableId = 0;
    this.acTableId = 0;
    this.prevDC = 0;
  }
}
class QuantizationTable  {
  constructor() {
    this.values = [];
    this.id = 0;
    let i_1 = 0;
    while (i_1 < 64) {
      this.values.push(1);
      i_1 = i_1 + 1;
    };
  }
}
class JPEGDecoder  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.components = [];
    this.quantTables = [];
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
    let i_2 = 0;
    while (i_2 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_2 = i_2 + 1;
    };
  }
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8((pos + 1));
    return (high * 256) + low;
  };
  parseSOF (pos, length) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8((pos + 5));
    console.log(((((("  Image: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
    this.components.length = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    let i = 0;
    let offset = pos + 6;
    while (i < this.numComponents) {
      const comp = new JPEGComponent();
      comp.id = this.data._view.getUint8(offset);
      const sampling = this.data._view.getUint8((offset + 1));
      comp.hSamp = (sampling >> 4);
      comp.vSamp = (sampling & 15);
      comp.quantTableId = this.data._view.getUint8((offset + 2));
      if ( comp.hSamp > this.maxHSamp ) {
        this.maxHSamp = comp.hSamp;
      }
      if ( comp.vSamp > this.maxVSamp ) {
        this.maxVSamp = comp.vSamp;
      }
      this.components.push(comp);
      console.log((((((("    Component " + ((comp.id.toString()))) + ": ") + ((comp.hSamp.toString()))) + "x") + ((comp.vSamp.toString()))) + " sampling, quant table ") + ((comp.quantTableId.toString())));
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( (((this.width + this.mcuWidth) - 1) / this.mcuWidth));
    this.mcusPerCol = Math.floor( (((this.height + this.mcuHeight) - 1) / this.mcuHeight));
    console.log((((((("  MCU size: " + ((this.mcuWidth.toString()))) + "x") + ((this.mcuHeight.toString()))) + ", grid: ") + ((this.mcusPerRow.toString()))) + "x") + ((this.mcusPerCol.toString())));
  };
  parseDQT (pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const info = this.data._view.getUint8(pos);
      pos = pos + 1;
      const precision_1 = (info >> 4);
      const tableId = (info & 15);
      const table = this.quantTables[tableId];
      table.id = tableId;
      table.values.length = 0;
      let i = 0;
      while (i < 64) {
        if ( precision_1 == 0 ) {
          table.values.push(this.data._view.getUint8(pos));
          pos = pos + 1;
        } else {
          table.values.push(this.readUint16BE(pos));
          pos = pos + 2;
        }
        i = i + 1;
      };
      console.log(((("  Quantization table " + ((tableId.toString()))) + " (") + (((precision_1 + 1).toString()))) + "-byte values)");
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let i = 0;
    while (i < numScanComponents) {
      const compId = this.data._view.getUint8(pos);
      const tableSelect = this.data._view.getUint8((pos + 1));
      pos = pos + 2;
      let j = 0;
      while (j < this.numComponents) {
        const comp = this.components[j];
        if ( comp.id == compId ) {
          comp.dcTableId = (tableSelect >> 4);
          comp.acTableId = (tableSelect & 15);
          console.log((((("    Component " + ((compId.toString()))) + ": DC table ") + ((comp.dcTableId.toString()))) + ", AC table ") + ((comp.acTableId.toString())));
        }
        j = j + 1;
      };
      i = i + 1;
    };
    pos = pos + 3;
    this.scanDataStart = pos;
    let searchPos = pos;
    while (searchPos < (this.dataLen - 1)) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8((searchPos + 1));
        if ( (nextB != 0) && (nextB != 255) ) {
          this.scanDataLen = searchPos - this.scanDataStart;
          return;
        }
      }
      searchPos = searchPos + 1;
    };
    this.scanDataLen = this.dataLen - this.scanDataStart;
  };
  parseMarkers () {
    let pos = 0;
    if ( this.dataLen < 2 ) {
      console.log("Error: File too small");
      return false;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      console.log("Error: Not a JPEG file (missing SOI)");
      return false;
    }
    pos = 2;
    console.log("Parsing JPEG markers...");
    while (pos < (this.dataLen - 1)) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( marker2 == 0 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 216 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 217 ) {
        console.log("  End of Image");
        return true;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return true;
      }
      const markerLen = this.readUint16BE((pos + 2));
      const dataStart = pos + 4;
      const markerDataLen = markerLen - 2;
      if ( marker2 == 192 ) {
        console.log("  SOF0 (Baseline DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 193 ) {
        console.log("  SOF1 (Extended Sequential DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 194 ) {
        console.log("  SOF2 (Progressive DCT) - NOT SUPPORTED");
        return false;
      }
      if ( marker2 == 196 ) {
        console.log("  DHT (Huffman Tables)");
        this.huffman.parseDHT(this.data, dataStart, markerDataLen);
      }
      if ( marker2 == 219 ) {
        console.log("  DQT (Quantization Tables)");
        this.parseDQT(dataStart, markerDataLen);
      }
      if ( marker2 == 218 ) {
        console.log("  SOS (Start of Scan)");
        this.parseSOS(dataStart, markerDataLen);
        pos = this.scanDataStart + this.scanDataLen;
        continue;
      }
      if ( marker2 == 224 ) {
        console.log("  APP0 (JFIF)");
      }
      if ( marker2 == 225 ) {
        console.log("  APP1 (EXIF)");
      }
      if ( marker2 == 254 ) {
        console.log("  COM (Comment)");
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  };
  decodeBlock (reader, comp, quantTable, coeffs) {
    coeffs.length = 0;
    let i = 0;
    while (i < 64) {
      coeffs.push(0);
      i = i + 1;
    };
    const dcTable = this.huffman.getDCTable(comp.dcTableId);
    const dcCategory = dcTable.decode(reader);
    const dcDiff = reader.receiveExtend(dcCategory);
    const dcValue = comp.prevDC + dcDiff;
    comp.prevDC = dcValue;
    const dcQuant = quantTable.values[0];
    coeffs[0] = dcValue * dcQuant;
    const acTable = this.huffman.getACTable(comp.acTableId);
    let k = 1;
    while (k < 64) {
      const acSymbol = acTable.decode(reader);
      if ( acSymbol == 0 ) {
        k = 64;
      } else {
        const runLength = (acSymbol >> 4);
        const acCategory = (acSymbol & 15);
        if ( acSymbol == 240 ) {
          k = k + 16;
        } else {
          k = k + runLength;
          if ( k < 64 ) {
            const acValue = reader.receiveExtend(acCategory);
            const acQuant = quantTable.values[k];
            coeffs[k] = acValue * acQuant;
            k = k + 1;
          }
        }
      }
    };
  };
  decode (dirPath, fileName) {
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    this.dataLen = this.data.byteLength;
    console.log(((("Decoding JPEG: " + fileName) + " (") + ((this.dataLen.toString()))) + " bytes)");
    const ok = this.parseMarkers();
    if ( ok == false ) {
      console.log("Error parsing JPEG markers");
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( (this.width == 0) || (this.height == 0) ) {
      console.log("Error: Invalid image dimensions");
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    console.log(("Decoding " + ((this.scanDataLen.toString()))) + " bytes of scan data...");
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    const reader = new BitReader();
    reader.init(this.data, this.scanDataStart, this.scanDataLen);
    let c = 0;
    while (c < this.numComponents) {
      const comp = this.components[c];
      comp.prevDC = 0;
      c = c + 1;
    };
    let coeffs = [];
    let blockPixels = [];
    let yBlocksData = [];
    let yBlockCount = 0;
    let cbBlock = [];
    let crBlock = [];
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        yBlocksData.length = 0;
        yBlockCount = 0;
        let compIdx = 0;
        while (compIdx < this.numComponents) {
          const comp_1 = this.components[compIdx];
          const quantTable = this.quantTables[comp_1.quantTableId];
          let blockV = 0;
          while (blockV < comp_1.vSamp) {
            let blockH = 0;
            while (blockH < comp_1.hSamp) {
              this.decodeBlock(reader, comp_1, quantTable, coeffs);
              blockPixels.length = 0;
              let bi = 0;
              while (bi < 64) {
                blockPixels.push(0);
                bi = bi + 1;
              };
              let tempBlock = [];
              this.idct.dezigzag(coeffs, tempBlock);
              this.idct.transform(tempBlock, blockPixels);
              if ( compIdx == 0 ) {
                bi = 0;
                while (bi < 64) {
                  yBlocksData.push(blockPixels[bi]);
                  bi = bi + 1;
                };
                yBlockCount = yBlockCount + 1;
              }
              if ( compIdx == 1 ) {
                cbBlock.length = 0;
                bi = 0;
                while (bi < 64) {
                  cbBlock.push(blockPixels[bi]);
                  bi = bi + 1;
                };
              }
              if ( compIdx == 2 ) {
                crBlock.length = 0;
                bi = 0;
                while (bi < 64) {
                  crBlock.push(blockPixels[bi]);
                  bi = bi + 1;
                };
              }
              blockH = blockH + 1;
            };
            blockV = blockV + 1;
          };
          compIdx = compIdx + 1;
        };
        this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
      if ( (mcuY % 10) == 0 ) {
        console.log((("  Row " + ((mcuY.toString()))) + "/") + ((this.mcusPerCol.toString())));
      }
    };
    console.log("Decode complete!");
    return img;
  };
  writeMCU (img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock) {
    const baseX = mcuX * this.mcuWidth;
    const baseY = mcuY * this.mcuHeight;
    const comp0 = this.components[0];
    if ( (this.maxHSamp == 1) && (this.maxVSamp == 1) ) {
      let py = 0;
      while (py < 8) {
        let px = 0;
        while (px < 8) {
          const imgX = baseX + px;
          const imgY = baseY + py;
          if ( (imgX < this.width) && (imgY < this.height) ) {
            const idx = (py * 8) + px;
            const y = yBlocksData[idx];
            let cb = 128;
            let cr = 128;
            if ( this.numComponents >= 3 ) {
              cb = cbBlock[idx];
              cr = crBlock[idx];
            }
            let r = y + (((359 * (cr - 128)) >> 8));
            let g = (y - (((88 * (cb - 128)) >> 8))) - (((183 * (cr - 128)) >> 8));
            let b = y + (((454 * (cb - 128)) >> 8));
            if ( r < 0 ) {
              r = 0;
            }
            if ( r > 255 ) {
              r = 255;
            }
            if ( g < 0 ) {
              g = 0;
            }
            if ( g > 255 ) {
              g = 255;
            }
            if ( b < 0 ) {
              b = 0;
            }
            if ( b > 255 ) {
              b = 255;
            }
            img.setPixelRGB(imgX, imgY, r, g, b);
          }
          px = px + 1;
        };
        py = py + 1;
      };
      return;
    }
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 2) ) {
      let blockIdx = 0;
      let blockY = 0;
      while (blockY < 2) {
        let blockX = 0;
        while (blockX < 2) {
          const yBlockOffset = blockIdx * 64;
          let py_1 = 0;
          while (py_1 < 8) {
            let px_1 = 0;
            while (px_1 < 8) {
              const imgX_1 = (baseX + (blockX * 8)) + px_1;
              const imgY_1 = (baseY + (blockY * 8)) + py_1;
              if ( (imgX_1 < this.width) && (imgY_1 < this.height) ) {
                const yIdx = (yBlockOffset + (py_1 * 8)) + px_1;
                const y_1 = yBlocksData[yIdx];
                const chromaX = (blockX * 4) + ((px_1 >> 1));
                const chromaY = (blockY * 4) + ((py_1 >> 1));
                const chromaIdx = (chromaY * 8) + chromaX;
                let cb_1 = 128;
                let cr_1 = 128;
                if ( this.numComponents >= 3 ) {
                  cb_1 = cbBlock[chromaIdx];
                  cr_1 = crBlock[chromaIdx];
                }
                let r_1 = y_1 + (((359 * (cr_1 - 128)) >> 8));
                let g_1 = (y_1 - (((88 * (cb_1 - 128)) >> 8))) - (((183 * (cr_1 - 128)) >> 8));
                let b_1 = y_1 + (((454 * (cb_1 - 128)) >> 8));
                if ( r_1 < 0 ) {
                  r_1 = 0;
                }
                if ( r_1 > 255 ) {
                  r_1 = 255;
                }
                if ( g_1 < 0 ) {
                  g_1 = 0;
                }
                if ( g_1 > 255 ) {
                  g_1 = 255;
                }
                if ( b_1 < 0 ) {
                  b_1 = 0;
                }
                if ( b_1 > 255 ) {
                  b_1 = 255;
                }
                img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
              }
              px_1 = px_1 + 1;
            };
            py_1 = py_1 + 1;
          };
          blockIdx = blockIdx + 1;
          blockX = blockX + 1;
        };
        blockY = blockY + 1;
      };
      return;
    }
    if ( yBlockCount > 0 ) {
      let py_2 = 0;
      while (py_2 < 8) {
        let px_2 = 0;
        while (px_2 < 8) {
          const imgX_2 = baseX + px_2;
          const imgY_2 = baseY + py_2;
          if ( (imgX_2 < this.width) && (imgY_2 < this.height) ) {
            const y_2 = yBlocksData[((py_2 * 8) + px_2)];
            img.setPixelRGB(imgX_2, imgY_2, y_2, y_2, y_2);
          }
          px_2 = px_2 + 1;
        };
        py_2 = py_2 + 1;
      };
    }
  };
}
class ExifTag  {
  constructor() {
    this.tagId = 0;
    this.tagName = "";
    this.tagValue = "";
    this.dataType = 0;
  }
}
class JPEGMetadataInfo  {
  constructor() {
    this.isValid = false;
    this.errorMessage = "";
    this.hasJFIF = false;
    this.jfifVersion = "";
    this.densityUnits = 0;
    this.xDensity = 0;
    this.yDensity = 0;
    this.width = 0;
    this.height = 0;
    this.colorComponents = 0;
    this.bitsPerComponent = 0;
    this.hasExif = false;
    this.cameraMake = "";
    this.cameraModel = "";
    this.software = "";
    this.dateTime = "";
    this.dateTimeOriginal = "";
    this.exposureTime = "";
    this.fNumber = "";
    this.isoSpeed = "";
    this.focalLength = "";
    this.flash = "";
    this.orientation = 1;
    this.xResolution = "";
    this.yResolution = "";
    this.resolutionUnit = 0;
    this.hasGPS = false;
    this.gpsLatitude = "";
    this.gpsLongitude = "";
    this.gpsAltitude = "";
    this.gpsLatitudeRef = "";
    this.gpsLongitudeRef = "";
    this.hasComment = false;
    this.comment = "";
    this.exifTags = [];
  }
}
class JPEGMetadataParser  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.littleEndian = false;
  }
  readUint16BE (offset) {
    const high = this.data._view.getUint8(offset);
    const low = this.data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readUint16 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const low = this.data._view.getUint8(offset);
      const high = this.data._view.getUint8((offset + 1));
      result = (high * 256) + low;
    } else {
      const high_1 = this.data._view.getUint8(offset);
      const low_1 = this.data._view.getUint8((offset + 1));
      result = (high_1 * 256) + low_1;
    }
    return result;
  };
  readUint32 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const b0 = this.data._view.getUint8(offset);
      const b1 = this.data._view.getUint8((offset + 1));
      const b2 = this.data._view.getUint8((offset + 2));
      const b3 = this.data._view.getUint8((offset + 3));
      result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
    } else {
      const b0_1 = this.data._view.getUint8(offset);
      const b1_1 = this.data._view.getUint8((offset + 1));
      const b2_1 = this.data._view.getUint8((offset + 2));
      const b3_1 = this.data._view.getUint8((offset + 3));
      result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
    }
    return result;
  };
  readString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const b = this.data._view.getUint8((offset + i));
      if ( b == 0 ) {
        return result;
      }
      result = result + (String.fromCharCode(b));
      i = i + 1;
    };
    return result;
  };
  getTagName (tagId, ifdType) {
    if ( ifdType == 2 ) {
      if ( tagId == 0 ) {
        return "GPSVersionID";
      }
      if ( tagId == 1 ) {
        return "GPSLatitudeRef";
      }
      if ( tagId == 2 ) {
        return "GPSLatitude";
      }
      if ( tagId == 3 ) {
        return "GPSLongitudeRef";
      }
      if ( tagId == 4 ) {
        return "GPSLongitude";
      }
      if ( tagId == 5 ) {
        return "GPSAltitudeRef";
      }
      if ( tagId == 6 ) {
        return "GPSAltitude";
      }
      return "GPS_" + ((tagId.toString()));
    }
    if ( tagId == 256 ) {
      return "ImageWidth";
    }
    if ( tagId == 257 ) {
      return "ImageHeight";
    }
    if ( tagId == 258 ) {
      return "BitsPerSample";
    }
    if ( tagId == 259 ) {
      return "Compression";
    }
    if ( tagId == 262 ) {
      return "PhotometricInterpretation";
    }
    if ( tagId == 270 ) {
      return "ImageDescription";
    }
    if ( tagId == 271 ) {
      return "Make";
    }
    if ( tagId == 272 ) {
      return "Model";
    }
    if ( tagId == 274 ) {
      return "Orientation";
    }
    if ( tagId == 282 ) {
      return "XResolution";
    }
    if ( tagId == 283 ) {
      return "YResolution";
    }
    if ( tagId == 296 ) {
      return "ResolutionUnit";
    }
    if ( tagId == 305 ) {
      return "Software";
    }
    if ( tagId == 306 ) {
      return "DateTime";
    }
    if ( tagId == 315 ) {
      return "Artist";
    }
    if ( tagId == 33432 ) {
      return "Copyright";
    }
    if ( tagId == 33434 ) {
      return "ExposureTime";
    }
    if ( tagId == 33437 ) {
      return "FNumber";
    }
    if ( tagId == 34850 ) {
      return "ExposureProgram";
    }
    if ( tagId == 34855 ) {
      return "ISOSpeedRatings";
    }
    if ( tagId == 36864 ) {
      return "ExifVersion";
    }
    if ( tagId == 36867 ) {
      return "DateTimeOriginal";
    }
    if ( tagId == 36868 ) {
      return "DateTimeDigitized";
    }
    if ( tagId == 37377 ) {
      return "ShutterSpeedValue";
    }
    if ( tagId == 37378 ) {
      return "ApertureValue";
    }
    if ( tagId == 37380 ) {
      return "ExposureBiasValue";
    }
    if ( tagId == 37381 ) {
      return "MaxApertureValue";
    }
    if ( tagId == 37383 ) {
      return "MeteringMode";
    }
    if ( tagId == 37384 ) {
      return "LightSource";
    }
    if ( tagId == 37385 ) {
      return "Flash";
    }
    if ( tagId == 37386 ) {
      return "FocalLength";
    }
    if ( tagId == 37500 ) {
      return "MakerNote";
    }
    if ( tagId == 37510 ) {
      return "UserComment";
    }
    if ( tagId == 40960 ) {
      return "FlashpixVersion";
    }
    if ( tagId == 40961 ) {
      return "ColorSpace";
    }
    if ( tagId == 40962 ) {
      return "PixelXDimension";
    }
    if ( tagId == 40963 ) {
      return "PixelYDimension";
    }
    if ( tagId == 41486 ) {
      return "FocalPlaneXResolution";
    }
    if ( tagId == 41487 ) {
      return "FocalPlaneYResolution";
    }
    if ( tagId == 41488 ) {
      return "FocalPlaneResolutionUnit";
    }
    if ( tagId == 41495 ) {
      return "SensingMethod";
    }
    if ( tagId == 41728 ) {
      return "FileSource";
    }
    if ( tagId == 41729 ) {
      return "SceneType";
    }
    if ( tagId == 41985 ) {
      return "CustomRendered";
    }
    if ( tagId == 41986 ) {
      return "ExposureMode";
    }
    if ( tagId == 41987 ) {
      return "WhiteBalance";
    }
    if ( tagId == 41988 ) {
      return "DigitalZoomRatio";
    }
    if ( tagId == 41989 ) {
      return "FocalLengthIn35mmFilm";
    }
    if ( tagId == 41990 ) {
      return "SceneCaptureType";
    }
    if ( tagId == 34665 ) {
      return "ExifIFDPointer";
    }
    if ( tagId == 34853 ) {
      return "GPSInfoIFDPointer";
    }
    return "Tag_" + ((tagId.toString()));
  };
  formatRational (offset) {
    const numerator = this.readUint32(offset);
    const denominator = this.readUint32((offset + 4));
    if ( denominator == 0 ) {
      return (numerator.toString());
    }
    if ( denominator == 1 ) {
      return (numerator.toString());
    }
    return (((numerator.toString())) + "/") + ((denominator.toString()));
  };
  formatGPSCoordinate (offset, ref) {
    const degNum = this.readUint32(offset);
    const degDen = this.readUint32((offset + 4));
    const minNum = this.readUint32((offset + 8));
    const minDen = this.readUint32((offset + 12));
    const secNum = this.readUint32((offset + 16));
    const secDen = this.readUint32((offset + 20));
    let degrees = 0;
    if ( degDen > 0 ) {
      let tempDeg = degNum;
      while (tempDeg >= degDen) {
        tempDeg = tempDeg - degDen;
        degrees = degrees + 1;
      };
    }
    let minutes = 0;
    if ( minDen > 0 ) {
      let tempMin = minNum;
      while (tempMin >= minDen) {
        tempMin = tempMin - minDen;
        minutes = minutes + 1;
      };
    }
    let seconds = "0";
    if ( secDen > 0 ) {
      let secWhole = 0;
      let tempSec = secNum;
      while (tempSec >= secDen) {
        tempSec = tempSec - secDen;
        secWhole = secWhole + 1;
      };
      const secRem = tempSec;
      if ( secRem > 0 ) {
        let decPartTemp = secRem * 100;
        let decPart = 0;
        while (decPartTemp >= secDen) {
          decPartTemp = decPartTemp - secDen;
          decPart = decPart + 1;
        };
        if ( decPart < 10 ) {
          seconds = (((secWhole.toString())) + ".0") + ((decPart.toString()));
        } else {
          seconds = (((secWhole.toString())) + ".") + ((decPart.toString()));
        }
      } else {
        seconds = (secWhole.toString());
      }
    }
    return (((((((degrees.toString())) + "° ") + ((minutes.toString()))) + "' ") + seconds) + "\" ") + ref;
  };
  parseIFD (info, tiffStart, ifdOffset, ifdType) {
    let pos = tiffStart + ifdOffset;
    if ( (pos + 2) > this.dataLen ) {
      return;
    }
    const numEntries = this.readUint16(pos);
    pos = pos + 2;
    let i = 0;
    while (i < numEntries) {
      if ( (pos + 12) > this.dataLen ) {
        return;
      }
      const tagId = this.readUint16(pos);
      const dataType = this.readUint16((pos + 2));
      const numValues = this.readUint32((pos + 4));
      let valueOffset = pos + 8;
      let dataSize = 0;
      if ( dataType == 1 ) {
        dataSize = numValues;
      }
      if ( dataType == 2 ) {
        dataSize = numValues;
      }
      if ( dataType == 3 ) {
        dataSize = numValues * 2;
      }
      if ( dataType == 4 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 5 ) {
        dataSize = numValues * 8;
      }
      if ( dataType == 7 ) {
        dataSize = numValues;
      }
      if ( dataType == 9 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 10 ) {
        dataSize = numValues * 8;
      }
      if ( dataSize > 4 ) {
        valueOffset = tiffStart + this.readUint32((pos + 8));
      }
      const tagName = this.getTagName(tagId, ifdType);
      let tagValue = "";
      if ( dataType == 2 ) {
        tagValue = this.readString(valueOffset, numValues);
      }
      if ( dataType == 3 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint16((pos + 8)).toString());
        } else {
          tagValue = (this.readUint16(valueOffset).toString());
        }
      }
      if ( dataType == 4 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint32((pos + 8)).toString());
        } else {
          tagValue = (this.readUint32(valueOffset).toString());
        }
      }
      if ( dataType == 5 ) {
        tagValue = this.formatRational(valueOffset);
      }
      const tag = new ExifTag();
      tag.tagId = tagId;
      tag.tagName = tagName;
      tag.tagValue = tagValue;
      tag.dataType = dataType;
      info.exifTags.push(tag);
      if ( tagId == 271 ) {
        info.cameraMake = tagValue;
      }
      if ( tagId == 272 ) {
        info.cameraModel = tagValue;
      }
      if ( tagId == 305 ) {
        info.software = tagValue;
      }
      if ( tagId == 306 ) {
        info.dateTime = tagValue;
      }
      if ( tagId == 274 ) {
        info.orientation = this.readUint16((pos + 8));
      }
      if ( tagId == 282 ) {
        info.xResolution = tagValue;
      }
      if ( tagId == 283 ) {
        info.yResolution = tagValue;
      }
      if ( tagId == 296 ) {
        info.resolutionUnit = this.readUint16((pos + 8));
      }
      if ( tagId == 36867 ) {
        info.dateTimeOriginal = tagValue;
      }
      if ( tagId == 33434 ) {
        info.exposureTime = tagValue;
      }
      if ( tagId == 33437 ) {
        info.fNumber = tagValue;
      }
      if ( tagId == 34855 ) {
        info.isoSpeed = tagValue;
      }
      if ( tagId == 37386 ) {
        info.focalLength = tagValue;
      }
      if ( tagId == 37385 ) {
        const flashVal = this.readUint16((pos + 8));
        if ( (flashVal % 2) == 1 ) {
          info.flash = "Fired";
        } else {
          info.flash = "Did not fire";
        }
      }
      if ( tagId == 34665 ) {
        const exifOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, exifOffset, 1);
      }
      if ( tagId == 34853 ) {
        info.hasGPS = true;
        const gpsOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, gpsOffset, 2);
      }
      if ( ifdType == 2 ) {
        if ( tagId == 1 ) {
          info.gpsLatitudeRef = tagValue;
        }
        if ( tagId == 2 ) {
          info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef);
        }
        if ( tagId == 3 ) {
          info.gpsLongitudeRef = tagValue;
        }
        if ( tagId == 4 ) {
          info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef);
        }
        if ( tagId == 6 ) {
          const altNum = this.readUint32(valueOffset);
          const altDen = this.readUint32((valueOffset + 4));
          if ( altDen > 0 ) {
            let altWhole = 0;
            let tempAlt = altNum;
            while (tempAlt >= altDen) {
              tempAlt = tempAlt - altDen;
              altWhole = altWhole + 1;
            };
            const altRem = tempAlt;
            if ( altRem > 0 ) {
              let altDecTemp = altRem * 10;
              let altDec = 0;
              while (altDecTemp >= altDen) {
                altDecTemp = altDecTemp - altDen;
                altDec = altDec + 1;
              };
              info.gpsAltitude = ((((altWhole.toString())) + ".") + ((altDec.toString()))) + " m";
            } else {
              info.gpsAltitude = ((altWhole.toString())) + " m";
            }
          } else {
            info.gpsAltitude = ((altNum.toString())) + " m";
          }
        }
      }
      pos = pos + 12;
      i = i + 1;
    };
  };
  parseExif (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "Exif" ) {
      return;
    }
    info.hasExif = true;
    const tiffStart = appStart + 6;
    const byteOrder0 = this.data._view.getUint8(tiffStart);
    const byteOrder1 = this.data._view.getUint8((tiffStart + 1));
    if ( (byteOrder0 == 73) && (byteOrder1 == 73) ) {
      this.littleEndian = true;
    } else {
      if ( (byteOrder0 == 77) && (byteOrder1 == 77) ) {
        this.littleEndian = false;
      } else {
        return;
      }
    }
    const magic = this.readUint16((tiffStart + 2));
    if ( magic != 42 ) {
      return;
    }
    const ifd0Offset = this.readUint32((tiffStart + 4));
    this.parseIFD(info, tiffStart, ifd0Offset, 0);
  };
  parseJFIF (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "JFIF" ) {
      return;
    }
    info.hasJFIF = true;
    const verMajor = this.data._view.getUint8((appStart + 5));
    const verMinor = this.data._view.getUint8((appStart + 6));
    info.jfifVersion = (((verMajor.toString())) + ".") + ((verMinor.toString()));
    info.densityUnits = this.data._view.getUint8((appStart + 7));
    info.xDensity = this.readUint16BE((appStart + 8));
    info.yDensity = this.readUint16BE((appStart + 10));
  };
  parseComment (info, appStart, appLen) {
    info.hasComment = true;
    info.comment = this.readString(appStart, appLen);
  };
  parseMetadata (dirPath, fileName) {
    const info = new JPEGMetadataInfo();
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    this.dataLen = this.data.byteLength;
    if ( this.dataLen < 4 ) {
      info.errorMessage = "File too small";
      return info;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      info.errorMessage = "Not a valid JPEG file";
      return info;
    }
    info.isValid = true;
    let pos = 2;
    while (pos < this.dataLen) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( (marker2 == 216) || (marker2 == 217) ) {
        pos = pos + 2;
        continue;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return info;
      }
      const segLen = this.readUint16BE((pos + 2));
      const segStart = pos + 4;
      if ( marker2 == 224 ) {
        this.parseJFIF(info, segStart, segLen - 2);
      }
      if ( marker2 == 225 ) {
        this.parseExif(info, segStart, segLen - 2);
      }
      if ( marker2 == 254 ) {
        this.parseComment(info, segStart, segLen - 2);
      }
      if ( (marker2 == 192) || (marker2 == 194) ) {
        if ( (pos + 9) < this.dataLen ) {
          info.bitsPerComponent = this.data._view.getUint8((pos + 4));
          info.height = this.readUint16BE((pos + 5));
          info.width = this.readUint16BE((pos + 7));
          info.colorComponents = this.data._view.getUint8((pos + 9));
        }
      }
      if ( marker2 == 218 ) {
        return info;
      }
      if ( marker2 == 217 ) {
        return info;
      }
      pos = (pos + 2) + segLen;
    };
    return info;
  };
  formatMetadata (info) {
    const out = new GrowableBuffer();
    out.writeString("=== JPEG Metadata ===\n\n");
    if ( info.isValid == false ) {
      out.writeString(("Error: " + info.errorMessage) + "\n");
      return (out).toString();
    }
    out.writeString("--- Image Info ---\n");
    out.writeString(((("  Dimensions: " + ((info.width.toString()))) + " x ") + ((info.height.toString()))) + "\n");
    out.writeString(("  Color Components: " + ((info.colorComponents.toString()))) + "\n");
    out.writeString(("  Bits per Component: " + ((info.bitsPerComponent.toString()))) + "\n");
    if ( info.hasJFIF ) {
      out.writeString("\n--- JFIF Info ---\n");
      out.writeString(("  Version: " + info.jfifVersion) + "\n");
      let densityStr = "No units (aspect ratio)";
      if ( info.densityUnits == 1 ) {
        densityStr = "pixels/inch";
      }
      if ( info.densityUnits == 2 ) {
        densityStr = "pixels/cm";
      }
      out.writeString(((((("  Density: " + ((info.xDensity.toString()))) + " x ") + ((info.yDensity.toString()))) + " ") + densityStr) + "\n");
    }
    if ( info.hasExif ) {
      out.writeString("\n--- EXIF Info ---\n");
      if ( (info.cameraMake.length) > 0 ) {
        out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
      }
      if ( (info.cameraModel.length) > 0 ) {
        out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
      }
      if ( (info.software.length) > 0 ) {
        out.writeString(("  Software: " + info.software) + "\n");
      }
      if ( (info.dateTimeOriginal.length) > 0 ) {
        out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
      } else {
        if ( (info.dateTime.length) > 0 ) {
          out.writeString(("  Date/Time: " + info.dateTime) + "\n");
        }
      }
      if ( (info.exposureTime.length) > 0 ) {
        out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
      }
      if ( (info.fNumber.length) > 0 ) {
        out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
      }
      if ( (info.isoSpeed.length) > 0 ) {
        out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
      }
      if ( (info.focalLength.length) > 0 ) {
        out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
      }
      if ( (info.flash.length) > 0 ) {
        out.writeString(("  Flash: " + info.flash) + "\n");
      }
      let orientStr = "Normal";
      if ( info.orientation == 2 ) {
        orientStr = "Flip horizontal";
      }
      if ( info.orientation == 3 ) {
        orientStr = "Rotate 180";
      }
      if ( info.orientation == 4 ) {
        orientStr = "Flip vertical";
      }
      if ( info.orientation == 5 ) {
        orientStr = "Transpose";
      }
      if ( info.orientation == 6 ) {
        orientStr = "Rotate 90 CW";
      }
      if ( info.orientation == 7 ) {
        orientStr = "Transverse";
      }
      if ( info.orientation == 8 ) {
        orientStr = "Rotate 270 CW";
      }
      out.writeString(("  Orientation: " + orientStr) + "\n");
    }
    if ( info.hasGPS ) {
      out.writeString("\n--- GPS Info ---\n");
      if ( (info.gpsLatitude.length) > 0 ) {
        out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
      }
      if ( (info.gpsLongitude.length) > 0 ) {
        out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
      }
      if ( (info.gpsAltitude.length) > 0 ) {
        out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
      }
    }
    if ( info.hasComment ) {
      out.writeString("\n--- Comment ---\n");
      out.writeString(("  " + info.comment) + "\n");
    }
    const tagCount = info.exifTags.length;
    if ( tagCount > 0 ) {
      out.writeString(("\n--- All EXIF Tags (" + ((tagCount.toString()))) + ") ---\n");
      for ( let idx = 0; idx < info.exifTags.length; idx++) {
        var tag = info.exifTags[idx];
        out.writeString(("  " + tag.tagName) + " (0x");
        let tagHex = "";
        const tid = tag.tagId;
        const hexChars = "0123456789ABCDEF";
        const h3D = tid / 4096;
        const h3 = Math.floor( h3D);
        const r3 = tid - (h3 * 4096);
        const h2D = r3 / 256;
        const h2 = Math.floor( h2D);
        const r2 = r3 - (h2 * 256);
        const h1D = r2 / 16;
        const h1 = Math.floor( h1D);
        const h0 = r2 - (h1 * 16);
        tagHex = (((hexChars.substring(h3, (h3 + 1) )) + (hexChars.substring(h2, (h2 + 1) ))) + (hexChars.substring(h1, (h1 + 1) ))) + (hexChars.substring(h0, (h0 + 1) ));
        out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
      };
    }
    return (out).toString();
  };
}
class JPEGMetadataMain  {
  constructor() {
  }
}
class ExifOrientationTest  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=== EXIF Orientation Test ===");
  const dirPath = "c:\\Users\\terok\\proj\\Ranger\\gallery\\pdf_writer\\";
  const fileName = "Canon_40D.jpg";
  console.log(("Loading " + fileName) + "...");
  const decoder = new JPEGDecoder();
  const imgBuf = decoder.decode(dirPath, fileName);
  console.log((("Original size: " + ((imgBuf.width.toString()))) + "x") + ((imgBuf.height.toString())));
  const metaParser = new JPEGMetadataParser();
  const info = metaParser.parseMetadata(dirPath, fileName);
  console.log("EXIF Orientation from file: " + ((info.orientation.toString())));
  console.log("");
  console.log("Testing all 8 orientations...");
  const img1 = imgBuf.applyExifOrientation(1);
  console.log((("Orientation 1 (Normal): " + ((img1.width.toString()))) + "x") + ((img1.height.toString())));
  const img2 = imgBuf.applyExifOrientation(2);
  console.log((("Orientation 2 (Flip H): " + ((img2.width.toString()))) + "x") + ((img2.height.toString())));
  const img3 = imgBuf.applyExifOrientation(3);
  console.log((("Orientation 3 (Rot 180): " + ((img3.width.toString()))) + "x") + ((img3.height.toString())));
  const img4 = imgBuf.applyExifOrientation(4);
  console.log((("Orientation 4 (Flip V): " + ((img4.width.toString()))) + "x") + ((img4.height.toString())));
  const img5 = imgBuf.applyExifOrientation(5);
  console.log((("Orientation 5 (Transpose): " + ((img5.width.toString()))) + "x") + ((img5.height.toString())));
  const img6 = imgBuf.applyExifOrientation(6);
  console.log((("Orientation 6 (Rot 90 CW): " + ((img6.width.toString()))) + "x") + ((img6.height.toString())));
  const img7 = imgBuf.applyExifOrientation(7);
  console.log((("Orientation 7 (Transverse): " + ((img7.width.toString()))) + "x") + ((img7.height.toString())));
  const img8 = imgBuf.applyExifOrientation(8);
  console.log((("Orientation 8 (Rot 270 CW): " + ((img8.width.toString()))) + "x") + ((img8.height.toString())));
  console.log("");
  console.log("Saving PPM files (3x scaled)...");
  const ppm = new PPMImage();
  const s1 = img1.scale(3);
  ppm.save(s1, dirPath, "orientation_1.ppm");
  console.log("Saved orientation_1.ppm");
  const s2 = img2.scale(3);
  ppm.save(s2, dirPath, "orientation_2.ppm");
  console.log("Saved orientation_2.ppm");
  const s3 = img3.scale(3);
  ppm.save(s3, dirPath, "orientation_3.ppm");
  console.log("Saved orientation_3.ppm");
  const s4 = img4.scale(3);
  ppm.save(s4, dirPath, "orientation_4.ppm");
  console.log("Saved orientation_4.ppm");
  const s5 = img5.scale(3);
  ppm.save(s5, dirPath, "orientation_5.ppm");
  console.log("Saved orientation_5.ppm");
  const s6 = img6.scale(3);
  ppm.save(s6, dirPath, "orientation_6.ppm");
  console.log("Saved orientation_6.ppm");
  const s7 = img7.scale(3);
  ppm.save(s7, dirPath, "orientation_7.ppm");
  console.log("Saved orientation_7.ppm");
  const s8 = img8.scale(3);
  ppm.save(s8, dirPath, "orientation_8.ppm");
  console.log("Saved orientation_8.ppm");
  if ( info.orientation > 0 ) {
    console.log("");
    console.log(("Applying actual EXIF orientation " + ((info.orientation.toString()))) + " from file...");
    const corrected = imgBuf.applyExifOrientation(info.orientation);
    const correctedScaled = corrected.scale(3);
    ppm.save(correctedScaled, dirPath, "orientation_corrected.ppm");
    console.log(((("Saved orientation_corrected.ppm (" + ((correctedScaled.width.toString()))) + "x") + ((correctedScaled.height.toString()))) + ")");
  }
  console.log("");
  console.log("=== Test Complete ===");
}
__js_main();
