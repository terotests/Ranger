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
class FDCT  {
  constructor() {
    this.cosTable = [];
    this.zigzagOrder = [];
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
    this.zigzagOrder.push(0);
    this.zigzagOrder.push(1);
    this.zigzagOrder.push(8);
    this.zigzagOrder.push(16);
    this.zigzagOrder.push(9);
    this.zigzagOrder.push(2);
    this.zigzagOrder.push(3);
    this.zigzagOrder.push(10);
    this.zigzagOrder.push(17);
    this.zigzagOrder.push(24);
    this.zigzagOrder.push(32);
    this.zigzagOrder.push(25);
    this.zigzagOrder.push(18);
    this.zigzagOrder.push(11);
    this.zigzagOrder.push(4);
    this.zigzagOrder.push(5);
    this.zigzagOrder.push(12);
    this.zigzagOrder.push(19);
    this.zigzagOrder.push(26);
    this.zigzagOrder.push(33);
    this.zigzagOrder.push(40);
    this.zigzagOrder.push(48);
    this.zigzagOrder.push(41);
    this.zigzagOrder.push(34);
    this.zigzagOrder.push(27);
    this.zigzagOrder.push(20);
    this.zigzagOrder.push(13);
    this.zigzagOrder.push(6);
    this.zigzagOrder.push(7);
    this.zigzagOrder.push(14);
    this.zigzagOrder.push(21);
    this.zigzagOrder.push(28);
    this.zigzagOrder.push(35);
    this.zigzagOrder.push(42);
    this.zigzagOrder.push(49);
    this.zigzagOrder.push(56);
    this.zigzagOrder.push(57);
    this.zigzagOrder.push(50);
    this.zigzagOrder.push(43);
    this.zigzagOrder.push(36);
    this.zigzagOrder.push(29);
    this.zigzagOrder.push(22);
    this.zigzagOrder.push(15);
    this.zigzagOrder.push(23);
    this.zigzagOrder.push(30);
    this.zigzagOrder.push(37);
    this.zigzagOrder.push(44);
    this.zigzagOrder.push(51);
    this.zigzagOrder.push(58);
    this.zigzagOrder.push(59);
    this.zigzagOrder.push(52);
    this.zigzagOrder.push(45);
    this.zigzagOrder.push(38);
    this.zigzagOrder.push(31);
    this.zigzagOrder.push(39);
    this.zigzagOrder.push(46);
    this.zigzagOrder.push(53);
    this.zigzagOrder.push(60);
    this.zigzagOrder.push(61);
    this.zigzagOrder.push(54);
    this.zigzagOrder.push(47);
    this.zigzagOrder.push(55);
    this.zigzagOrder.push(62);
    this.zigzagOrder.push(63);
  }
  dct1d (input, startIdx, stride, output, outIdx, outStride) {
    let u = 0;
    while (u < 8) {
      let sum = 0;
      let x = 0;
      while (x < 8) {
        const pixel = input[(startIdx + (x * stride))];
        const cosVal = this.cosTable[((x * 8) + u)];
        sum = sum + (pixel * cosVal);
        x = x + 1;
      };
      if ( u == 0 ) {
        sum = ((sum * 724) >> 10);
      }
      output[outIdx + (u * outStride)] = (sum >> 11);
      u = u + 1;
    };
  };
  transform (pixels, coeffs) {
    let shifted = [];
    let i = 0;
    while (i < 64) {
      shifted.push((pixels[i]) - 128);
      i = i + 1;
    };
    let temp = [];
    i = 0;
    while (i < 64) {
      temp.push(0);
      i = i + 1;
    };
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.dct1d(shifted, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    coeffs.length = 0;
    i = 0;
    while (i < 64) {
      coeffs.push(0);
      i = i + 1;
    };
    let col = 0;
    while (col < 8) {
      this.dct1d(temp, col, 8, coeffs, col, 8);
      col = col + 1;
    };
  };
  zigzag (block, zigzagOut) {
    zigzagOut.length = 0;
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagOrder[i];
      zigzagOut.push(block[pos]);
      i = i + 1;
    };
  };
}
class BitWriter  {
  constructor() {
    this.bitBuffer = 0;
    this.bitCount = 0;
    this.buffer = new GrowableBuffer();
  }
  writeBit (bit) {
    this.bitBuffer = (this.bitBuffer << 1);
    this.bitBuffer = (this.bitBuffer | ((bit & 1)));
    this.bitCount = this.bitCount + 1;
    if ( this.bitCount == 8 ) {
      this.flushByte();
    }
  };
  writeBits (value, numBits) {
    let i = numBits - 1;
    while (i >= 0) {
      const bit = (((value >> i)) & 1);
      this.writeBit(bit);
      i = i - 1;
    };
  };
  flushByte () {
    if ( this.bitCount > 0 ) {
      while (this.bitCount < 8) {
        this.bitBuffer = (this.bitBuffer << 1);
        this.bitBuffer = (this.bitBuffer | 1);
        this.bitCount = this.bitCount + 1;
      };
      this.buffer.writeByte(this.bitBuffer);
      if ( this.bitBuffer == 255 ) {
        this.buffer.writeByte(0);
      }
      this.bitBuffer = 0;
      this.bitCount = 0;
    }
  };
  writeByte (b) {
    this.flushByte();
    this.buffer.writeByte(b);
  };
  writeWord (w) {
    this.writeByte((w >> 8));
    this.writeByte((w & 255));
  };
  getBuffer () {
    this.flushByte();
    return this.buffer.toBuffer();
  };
  getLength () {
    return (this.buffer).size();
  };
}
class JPEGEncoder  {
  constructor() {
    this.quality = 75;
    this.yQuantTable = [];
    this.cQuantTable = [];
    this.stdYQuant = [];
    this.stdCQuant = [];
    this.dcYBits = [];
    this.dcYValues = [];
    this.acYBits = [];
    this.acYValues = [];
    this.dcCBits = [];
    this.dcCValues = [];
    this.acCBits = [];
    this.acCValues = [];
    this.dcYCodes = [];
    this.dcYLengths = [];
    this.acYCodes = [];
    this.acYLengths = [];
    this.dcCCodes = [];
    this.dcCLengths = [];
    this.acCCodes = [];
    this.acCLengths = [];
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    this.fdct = new FDCT();
    this.initQuantTables();
    this.initHuffmanTables();
  }
  initQuantTables () {
    this.stdYQuant.push(16);
    this.stdYQuant.push(11);
    this.stdYQuant.push(10);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(51);
    this.stdYQuant.push(61);
    this.stdYQuant.push(12);
    this.stdYQuant.push(12);
    this.stdYQuant.push(14);
    this.stdYQuant.push(19);
    this.stdYQuant.push(26);
    this.stdYQuant.push(58);
    this.stdYQuant.push(60);
    this.stdYQuant.push(55);
    this.stdYQuant.push(14);
    this.stdYQuant.push(13);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(57);
    this.stdYQuant.push(69);
    this.stdYQuant.push(56);
    this.stdYQuant.push(14);
    this.stdYQuant.push(17);
    this.stdYQuant.push(22);
    this.stdYQuant.push(29);
    this.stdYQuant.push(51);
    this.stdYQuant.push(87);
    this.stdYQuant.push(80);
    this.stdYQuant.push(62);
    this.stdYQuant.push(18);
    this.stdYQuant.push(22);
    this.stdYQuant.push(37);
    this.stdYQuant.push(56);
    this.stdYQuant.push(68);
    this.stdYQuant.push(109);
    this.stdYQuant.push(103);
    this.stdYQuant.push(77);
    this.stdYQuant.push(24);
    this.stdYQuant.push(35);
    this.stdYQuant.push(55);
    this.stdYQuant.push(64);
    this.stdYQuant.push(81);
    this.stdYQuant.push(104);
    this.stdYQuant.push(113);
    this.stdYQuant.push(92);
    this.stdYQuant.push(49);
    this.stdYQuant.push(64);
    this.stdYQuant.push(78);
    this.stdYQuant.push(87);
    this.stdYQuant.push(103);
    this.stdYQuant.push(121);
    this.stdYQuant.push(120);
    this.stdYQuant.push(101);
    this.stdYQuant.push(72);
    this.stdYQuant.push(92);
    this.stdYQuant.push(95);
    this.stdYQuant.push(98);
    this.stdYQuant.push(112);
    this.stdYQuant.push(100);
    this.stdYQuant.push(103);
    this.stdYQuant.push(99);
    this.stdCQuant.push(17);
    this.stdCQuant.push(18);
    this.stdCQuant.push(24);
    this.stdCQuant.push(47);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(18);
    this.stdCQuant.push(21);
    this.stdCQuant.push(26);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(24);
    this.stdCQuant.push(26);
    this.stdCQuant.push(56);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(47);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.scaleQuantTables(this.quality);
  };
  scaleQuantTables (q) {
    let scale = 0;
    if ( q < 50 ) {
      scale = Math.floor( (5000 / q));
    } else {
      scale = 200 - (q * 2);
    }
    this.yQuantTable.length = 0;
    this.cQuantTable.length = 0;
    let i = 0;
    while (i < 64) {
      let yVal = Math.floor( ((((this.stdYQuant[i]) * scale) + 50) / 100));
      if ( yVal < 1 ) {
        yVal = 1;
      }
      if ( yVal > 255 ) {
        yVal = 255;
      }
      this.yQuantTable.push(yVal);
      let cVal = Math.floor( ((((this.stdCQuant[i]) * scale) + 50) / 100));
      if ( cVal < 1 ) {
        cVal = 1;
      }
      if ( cVal > 255 ) {
        cVal = 255;
      }
      this.cQuantTable.push(cVal);
      i = i + 1;
    };
  };
  initHuffmanTables () {
    this.dcYBits.push(0);
    this.dcYBits.push(1);
    this.dcYBits.push(5);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYValues.push(0);
    this.dcYValues.push(1);
    this.dcYValues.push(2);
    this.dcYValues.push(3);
    this.dcYValues.push(4);
    this.dcYValues.push(5);
    this.dcYValues.push(6);
    this.dcYValues.push(7);
    this.dcYValues.push(8);
    this.dcYValues.push(9);
    this.dcYValues.push(10);
    this.dcYValues.push(11);
    this.acYBits.push(0);
    this.acYBits.push(2);
    this.acYBits.push(1);
    this.acYBits.push(3);
    this.acYBits.push(3);
    this.acYBits.push(2);
    this.acYBits.push(4);
    this.acYBits.push(3);
    this.acYBits.push(5);
    this.acYBits.push(5);
    this.acYBits.push(4);
    this.acYBits.push(4);
    this.acYBits.push(0);
    this.acYBits.push(0);
    this.acYBits.push(1);
    this.acYBits.push(125);
    this.acYValues.push(1);
    this.acYValues.push(2);
    this.acYValues.push(3);
    this.acYValues.push(0);
    this.acYValues.push(4);
    this.acYValues.push(17);
    this.acYValues.push(5);
    this.acYValues.push(18);
    this.acYValues.push(33);
    this.acYValues.push(49);
    this.acYValues.push(65);
    this.acYValues.push(6);
    this.acYValues.push(19);
    this.acYValues.push(81);
    this.acYValues.push(97);
    this.acYValues.push(7);
    this.acYValues.push(34);
    this.acYValues.push(113);
    this.acYValues.push(20);
    this.acYValues.push(50);
    this.acYValues.push(129);
    this.acYValues.push(145);
    this.acYValues.push(161);
    this.acYValues.push(8);
    this.acYValues.push(35);
    this.acYValues.push(66);
    this.acYValues.push(177);
    this.acYValues.push(193);
    this.acYValues.push(21);
    this.acYValues.push(82);
    this.acYValues.push(209);
    this.acYValues.push(240);
    this.acYValues.push(36);
    this.acYValues.push(51);
    this.acYValues.push(98);
    this.acYValues.push(114);
    this.acYValues.push(130);
    this.acYValues.push(9);
    this.acYValues.push(10);
    this.acYValues.push(22);
    this.acYValues.push(23);
    this.acYValues.push(24);
    this.acYValues.push(25);
    this.acYValues.push(26);
    this.acYValues.push(37);
    this.acYValues.push(38);
    this.acYValues.push(39);
    this.acYValues.push(40);
    this.acYValues.push(41);
    this.acYValues.push(42);
    this.acYValues.push(52);
    this.acYValues.push(53);
    this.acYValues.push(54);
    this.acYValues.push(55);
    this.acYValues.push(56);
    this.acYValues.push(57);
    this.acYValues.push(58);
    this.acYValues.push(67);
    this.acYValues.push(68);
    this.acYValues.push(69);
    this.acYValues.push(70);
    this.acYValues.push(71);
    this.acYValues.push(72);
    this.acYValues.push(73);
    this.acYValues.push(74);
    this.acYValues.push(83);
    this.acYValues.push(84);
    this.acYValues.push(85);
    this.acYValues.push(86);
    this.acYValues.push(87);
    this.acYValues.push(88);
    this.acYValues.push(89);
    this.acYValues.push(90);
    this.acYValues.push(99);
    this.acYValues.push(100);
    this.acYValues.push(101);
    this.acYValues.push(102);
    this.acYValues.push(103);
    this.acYValues.push(104);
    this.acYValues.push(105);
    this.acYValues.push(106);
    this.acYValues.push(115);
    this.acYValues.push(116);
    this.acYValues.push(117);
    this.acYValues.push(118);
    this.acYValues.push(119);
    this.acYValues.push(120);
    this.acYValues.push(121);
    this.acYValues.push(122);
    this.acYValues.push(131);
    this.acYValues.push(132);
    this.acYValues.push(133);
    this.acYValues.push(134);
    this.acYValues.push(135);
    this.acYValues.push(136);
    this.acYValues.push(137);
    this.acYValues.push(138);
    this.acYValues.push(146);
    this.acYValues.push(147);
    this.acYValues.push(148);
    this.acYValues.push(149);
    this.acYValues.push(150);
    this.acYValues.push(151);
    this.acYValues.push(152);
    this.acYValues.push(153);
    this.acYValues.push(154);
    this.acYValues.push(162);
    this.acYValues.push(163);
    this.acYValues.push(164);
    this.acYValues.push(165);
    this.acYValues.push(166);
    this.acYValues.push(167);
    this.acYValues.push(168);
    this.acYValues.push(169);
    this.acYValues.push(170);
    this.acYValues.push(178);
    this.acYValues.push(179);
    this.acYValues.push(180);
    this.acYValues.push(181);
    this.acYValues.push(182);
    this.acYValues.push(183);
    this.acYValues.push(184);
    this.acYValues.push(185);
    this.acYValues.push(186);
    this.acYValues.push(194);
    this.acYValues.push(195);
    this.acYValues.push(196);
    this.acYValues.push(197);
    this.acYValues.push(198);
    this.acYValues.push(199);
    this.acYValues.push(200);
    this.acYValues.push(201);
    this.acYValues.push(202);
    this.acYValues.push(210);
    this.acYValues.push(211);
    this.acYValues.push(212);
    this.acYValues.push(213);
    this.acYValues.push(214);
    this.acYValues.push(215);
    this.acYValues.push(216);
    this.acYValues.push(217);
    this.acYValues.push(218);
    this.acYValues.push(225);
    this.acYValues.push(226);
    this.acYValues.push(227);
    this.acYValues.push(228);
    this.acYValues.push(229);
    this.acYValues.push(230);
    this.acYValues.push(231);
    this.acYValues.push(232);
    this.acYValues.push(233);
    this.acYValues.push(234);
    this.acYValues.push(241);
    this.acYValues.push(242);
    this.acYValues.push(243);
    this.acYValues.push(244);
    this.acYValues.push(245);
    this.acYValues.push(246);
    this.acYValues.push(247);
    this.acYValues.push(248);
    this.acYValues.push(249);
    this.acYValues.push(250);
    this.dcCBits.push(0);
    this.dcCBits.push(3);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCValues.push(0);
    this.dcCValues.push(1);
    this.dcCValues.push(2);
    this.dcCValues.push(3);
    this.dcCValues.push(4);
    this.dcCValues.push(5);
    this.dcCValues.push(6);
    this.dcCValues.push(7);
    this.dcCValues.push(8);
    this.dcCValues.push(9);
    this.dcCValues.push(10);
    this.dcCValues.push(11);
    this.acCBits.push(0);
    this.acCBits.push(2);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(3);
    this.acCBits.push(4);
    this.acCBits.push(7);
    this.acCBits.push(5);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(0);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(119);
    this.acCValues.push(0);
    this.acCValues.push(1);
    this.acCValues.push(2);
    this.acCValues.push(3);
    this.acCValues.push(17);
    this.acCValues.push(4);
    this.acCValues.push(5);
    this.acCValues.push(33);
    this.acCValues.push(49);
    this.acCValues.push(6);
    this.acCValues.push(18);
    this.acCValues.push(65);
    this.acCValues.push(81);
    this.acCValues.push(7);
    this.acCValues.push(97);
    this.acCValues.push(113);
    this.acCValues.push(19);
    this.acCValues.push(34);
    this.acCValues.push(50);
    this.acCValues.push(129);
    this.acCValues.push(8);
    this.acCValues.push(20);
    this.acCValues.push(66);
    this.acCValues.push(145);
    this.acCValues.push(161);
    this.acCValues.push(177);
    this.acCValues.push(193);
    this.acCValues.push(9);
    this.acCValues.push(35);
    this.acCValues.push(51);
    this.acCValues.push(82);
    this.acCValues.push(240);
    this.acCValues.push(21);
    this.acCValues.push(98);
    this.acCValues.push(114);
    this.acCValues.push(209);
    this.acCValues.push(10);
    this.acCValues.push(22);
    this.acCValues.push(36);
    this.acCValues.push(52);
    this.acCValues.push(225);
    this.acCValues.push(37);
    this.acCValues.push(241);
    this.acCValues.push(23);
    this.acCValues.push(24);
    this.acCValues.push(25);
    this.acCValues.push(26);
    this.acCValues.push(38);
    this.acCValues.push(39);
    this.acCValues.push(40);
    this.acCValues.push(41);
    this.acCValues.push(42);
    this.acCValues.push(53);
    this.acCValues.push(54);
    this.acCValues.push(55);
    this.acCValues.push(56);
    this.acCValues.push(57);
    this.acCValues.push(58);
    this.acCValues.push(67);
    this.acCValues.push(68);
    this.acCValues.push(69);
    this.acCValues.push(70);
    this.acCValues.push(71);
    this.acCValues.push(72);
    this.acCValues.push(73);
    this.acCValues.push(74);
    this.acCValues.push(83);
    this.acCValues.push(84);
    this.acCValues.push(85);
    this.acCValues.push(86);
    this.acCValues.push(87);
    this.acCValues.push(88);
    this.acCValues.push(89);
    this.acCValues.push(90);
    this.acCValues.push(99);
    this.acCValues.push(100);
    this.acCValues.push(101);
    this.acCValues.push(102);
    this.acCValues.push(103);
    this.acCValues.push(104);
    this.acCValues.push(105);
    this.acCValues.push(106);
    this.acCValues.push(115);
    this.acCValues.push(116);
    this.acCValues.push(117);
    this.acCValues.push(118);
    this.acCValues.push(119);
    this.acCValues.push(120);
    this.acCValues.push(121);
    this.acCValues.push(122);
    this.acCValues.push(130);
    this.acCValues.push(131);
    this.acCValues.push(132);
    this.acCValues.push(133);
    this.acCValues.push(134);
    this.acCValues.push(135);
    this.acCValues.push(136);
    this.acCValues.push(137);
    this.acCValues.push(138);
    this.acCValues.push(146);
    this.acCValues.push(147);
    this.acCValues.push(148);
    this.acCValues.push(149);
    this.acCValues.push(150);
    this.acCValues.push(151);
    this.acCValues.push(152);
    this.acCValues.push(153);
    this.acCValues.push(154);
    this.acCValues.push(162);
    this.acCValues.push(163);
    this.acCValues.push(164);
    this.acCValues.push(165);
    this.acCValues.push(166);
    this.acCValues.push(167);
    this.acCValues.push(168);
    this.acCValues.push(169);
    this.acCValues.push(170);
    this.acCValues.push(178);
    this.acCValues.push(179);
    this.acCValues.push(180);
    this.acCValues.push(181);
    this.acCValues.push(182);
    this.acCValues.push(183);
    this.acCValues.push(184);
    this.acCValues.push(185);
    this.acCValues.push(186);
    this.acCValues.push(194);
    this.acCValues.push(195);
    this.acCValues.push(196);
    this.acCValues.push(197);
    this.acCValues.push(198);
    this.acCValues.push(199);
    this.acCValues.push(200);
    this.acCValues.push(201);
    this.acCValues.push(202);
    this.acCValues.push(210);
    this.acCValues.push(211);
    this.acCValues.push(212);
    this.acCValues.push(213);
    this.acCValues.push(214);
    this.acCValues.push(215);
    this.acCValues.push(216);
    this.acCValues.push(217);
    this.acCValues.push(218);
    this.acCValues.push(226);
    this.acCValues.push(227);
    this.acCValues.push(228);
    this.acCValues.push(229);
    this.acCValues.push(230);
    this.acCValues.push(231);
    this.acCValues.push(232);
    this.acCValues.push(233);
    this.acCValues.push(234);
    this.acCValues.push(242);
    this.acCValues.push(243);
    this.acCValues.push(244);
    this.acCValues.push(245);
    this.acCValues.push(246);
    this.acCValues.push(247);
    this.acCValues.push(248);
    this.acCValues.push(249);
    this.acCValues.push(250);
    this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
    this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
    this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
    this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
  };
  buildHuffmanCodes (bits, values, codes, lengths) {
    codes.length = 0;
    lengths.length = 0;
    let i = 0;
    while (i < 256) {
      codes.push(0);
      lengths.push(0);
      i = i + 1;
    };
    let code = 0;
    let valueIdx = 0;
    let bitLen = 1;
    while (bitLen <= 16) {
      const count = bits[(bitLen - 1)];
      let j = 0;
      while (j < count) {
        const symbol = values[valueIdx];
        codes[symbol] = code;
        lengths[symbol] = bitLen;
        code = code + 1;
        valueIdx = valueIdx + 1;
        j = j + 1;
      };
      code = (code << 1);
      bitLen = bitLen + 1;
    };
  };
  getCategory (value) {
    if ( value < 0 ) {
      value = 0 - value;
    }
    if ( value == 0 ) {
      return 0;
    }
    let cat = 0;
    while (value > 0) {
      cat = cat + 1;
      value = (value >> 1);
    };
    return cat;
  };
  encodeNumber (value, category) {
    if ( value < 0 ) {
      return value + (((1 << category)) - 1);
    }
    return value;
  };
  encodeBlock (writer, coeffs, quantTable, dcCodes, dcLengths, acCodes, acLengths, prevDC) {
    let quantized = [];
    let i = 0;
    while (i < 64) {
      const q = quantTable[i];
      const c = coeffs[i];
      let qVal = 0;
      if ( c >= 0 ) {
        qVal = Math.floor( ((c + ((q >> 1))) / q));
      } else {
        qVal = Math.floor( ((c - ((q >> 1))) / q));
      }
      quantized.push(qVal);
      i = i + 1;
    };
    let zigzagged = [];
    this.fdct.zigzag(quantized, zigzagged);
    const dc = zigzagged[0];
    const dcDiff = dc - prevDC;
    const dcCat = this.getCategory(dcDiff);
    const dcCode = dcCodes[dcCat];
    const dcLen = dcLengths[dcCat];
    writer.writeBits(dcCode, dcLen);
    if ( dcCat > 0 ) {
      const dcVal = this.encodeNumber(dcDiff, dcCat);
      writer.writeBits(dcVal, dcCat);
    }
    let zeroRun = 0;
    let k = 1;
    while (k < 64) {
      const ac = zigzagged[k];
      if ( ac == 0 ) {
        zeroRun = zeroRun + 1;
      } else {
        while (zeroRun >= 16) {
          const zrlCode = acCodes[240];
          const zrlLen = acLengths[240];
          writer.writeBits(zrlCode, zrlLen);
          zeroRun = zeroRun - 16;
        };
        const acCat = this.getCategory(ac);
        const runCat = (((zeroRun << 4)) | acCat);
        const acHuffCode = acCodes[runCat];
        const acHuffLen = acLengths[runCat];
        writer.writeBits(acHuffCode, acHuffLen);
        const acVal = this.encodeNumber(ac, acCat);
        writer.writeBits(acVal, acCat);
        zeroRun = 0;
      }
      k = k + 1;
    };
    if ( zeroRun > 0 ) {
      const eobCode = acCodes[0];
      const eobLen = acLengths[0];
      writer.writeBits(eobCode, eobLen);
    }
  };
  rgbToYCbCr (r, g, b, yOut, cbOut, crOut) {
    let y = ((((77 * r) + (150 * g)) + (29 * b)) >> 8);
    let cb = (((((0 - (43 * r)) - (85 * g)) + (128 * b)) >> 8)) + 128;
    let cr = (((((128 * r) - (107 * g)) - (21 * b)) >> 8)) + 128;
    if ( y < 0 ) {
      y = 0;
    }
    if ( y > 255 ) {
      y = 255;
    }
    if ( cb < 0 ) {
      cb = 0;
    }
    if ( cb > 255 ) {
      cb = 255;
    }
    if ( cr < 0 ) {
      cr = 0;
    }
    if ( cr > 255 ) {
      cr = 255;
    }
    yOut.push(y);
    cbOut.push(cb);
    crOut.push(cr);
  };
  extractBlock (img, blockX, blockY, channel, output) {
    output.length = 0;
    let py = 0;
    while (py < 8) {
      let px = 0;
      while (px < 8) {
        let imgX = blockX + px;
        let imgY = blockY + py;
        if ( imgX >= img.width ) {
          imgX = img.width - 1;
        }
        if ( imgY >= img.height ) {
          imgY = img.height - 1;
        }
        const c = img.getPixel(imgX, imgY);
        const y = ((((77 * c.r) + (150 * c.g)) + (29 * c.b)) >> 8);
        const cb = (((((0 - (43 * c.r)) - (85 * c.g)) + (128 * c.b)) >> 8)) + 128;
        const cr = (((((128 * c.r) - (107 * c.g)) - (21 * c.b)) >> 8)) + 128;
        if ( channel == 0 ) {
          output.push(y);
        }
        if ( channel == 1 ) {
          output.push(cb);
        }
        if ( channel == 2 ) {
          output.push(cr);
        }
        px = px + 1;
      };
      py = py + 1;
    };
  };
  writeMarkers (writer, width, height) {
    writer.writeByte(255);
    writer.writeByte(216);
    writer.writeByte(255);
    writer.writeByte(224);
    writer.writeWord(16);
    writer.writeByte(74);
    writer.writeByte(70);
    writer.writeByte(73);
    writer.writeByte(70);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeWord(1);
    writer.writeWord(1);
    writer.writeByte(0);
    writer.writeByte(0);
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(0);
    let i = 0;
    while (i < 64) {
      writer.writeByte(this.yQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(1);
    i = 0;
    while (i < 64) {
      writer.writeByte(this.cQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(192);
    writer.writeWord(17);
    writer.writeByte(8);
    writer.writeWord(height);
    writer.writeWord(width);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(0);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(16);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(1);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(17);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(218);
    writer.writeWord(12);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(63);
    writer.writeByte(0);
  };
  encode (img, dirPath, fileName) {
    console.log("Encoding JPEG: " + fileName);
    console.log((("  Image size: " + ((img.width.toString()))) + "x") + ((img.height.toString())));
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    console.log((("  MCU grid: " + ((mcuWidth.toString()))) + "x") + ((mcuHeight.toString())));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        let yBlock = [];
        this.extractBlock(img, blockX, blockY, 0, yBlock);
        let yCoeffs = [];
        this.fdct.transform(yBlock, yCoeffs);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        let yZig = [];
        this.fdct.zigzag(yCoeffs, yZig);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = Math.floor( ((yDC - ((yQ >> 1))) / yQ));
        }
        let cbBlock = [];
        this.extractBlock(img, blockX, blockY, 1, cbBlock);
        let cbCoeffs = [];
        this.fdct.transform(cbBlock, cbCoeffs);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        let cbZig = [];
        this.fdct.zigzag(cbCoeffs, cbZig);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = Math.floor( ((cbDC - ((cbQ >> 1))) / cbQ));
        }
        let crBlock = [];
        this.extractBlock(img, blockX, blockY, 2, crBlock);
        let crCoeffs = [];
        this.fdct.transform(crBlock, crCoeffs);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        let crZig = [];
        this.fdct.zigzag(crCoeffs, crZig);
        const crQ = this.cQuantTable[0];
        const crDC = crZig[0];
        if ( crDC >= 0 ) {
          this.prevDCCr = Math.floor( ((crDC + ((crQ >> 1))) / crQ));
        } else {
          this.prevDCCr = Math.floor( ((crDC - ((crQ >> 1))) / crQ));
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    const outBuf = writer.getBuffer();
    const outLen = writer.getLength();
    const finalBuf = (function(){ var b = new ArrayBuffer((outLen + 2)); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < outLen) {
      finalBuf._view.setUint8(i, outBuf._view.getUint8(i));
      i = i + 1;
    };
    finalBuf._view.setUint8(outLen, 255);
    finalBuf._view.setUint8(outLen + 1, 217);
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(finalBuf));
    console.log(("  Encoded size: " + (((outLen + 2).toString()))) + " bytes");
    console.log((("  Saved: " + dirPath) + "/") + fileName);
  };
  setQuality (q) {
    this.quality = q;
    this.scaleQuantTables(q);
  };
}
class CoeffBuffer  {
  constructor() {
    this.coeffs = [];
    this.numBlocks = 0;
  }
  init (blocks) {
    this.numBlocks = blocks;
    this.coeffs.length = 0;
    const numCoeffs = blocks * 64;
    let i = 0;
    while (i < numCoeffs) {
      this.coeffs.push(0);
      i = i + 1;
    };
  };
  get (blockIdx, k) {
    const offset = (blockIdx * 64) + k;
    return this.coeffs[offset];
  };
  setVal (blockIdx, k, value) {
    const offset = (blockIdx * 64) + k;
    this.coeffs[offset] = value;
  };
}
class ProgressiveJPEGDecoder  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.isProgressive = false;
    this.components = [];
    this.quantTables = [];
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.coeffBuffers = [];
    this.scanSs = 0;
    this.scanSe = 63;
    this.scanAh = 0;
    this.scanAl = 0;
    this.eobrun = 0;
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
    let i_3 = 0;
    while (i_3 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_3 = i_3 + 1;
    };
  }
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8((pos + 1));
    return (high * 256) + low;
  };
  parseSOF (pos, length, sofType) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8((pos + 5));
    if ( sofType == 2 ) {
      this.isProgressive = true;
      console.log(((((("  Progressive JPEG: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
    } else {
      this.isProgressive = false;
      console.log(((((("  Baseline JPEG: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
    }
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
      console.log(((((("    Component " + ((comp.id.toString()))) + ": ") + ((comp.hSamp.toString()))) + "x") + ((comp.vSamp.toString()))) + " sampling");
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( (((this.width + this.mcuWidth) - 1) / this.mcuWidth));
    this.mcusPerCol = Math.floor( (((this.height + this.mcuHeight) - 1) / this.mcuHeight));
    console.log((("  MCU grid: " + ((this.mcusPerRow.toString()))) + "x") + ((this.mcusPerCol.toString())));
    this.allocateCoeffBuffers();
  };
  allocateCoeffBuffers () {
    this.coeffBuffers.length = 0;
    const totalMCUs = this.mcusPerRow * this.mcusPerCol;
    let c = 0;
    while (c < this.numComponents) {
      const comp = this.components[c];
      const blocksInComp = (totalMCUs * comp.hSamp) * comp.vSamp;
      const buf = new CoeffBuffer();
      buf.init(blocksInComp);
      this.coeffBuffers.push(buf);
      c = c + 1;
    };
  };
  parseDQT (pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const info = this.data._view.getUint8(pos);
      pos = pos + 1;
      const prec = (info >> 4);
      const tableId = (info & 15);
      const table = this.quantTables[tableId];
      table.id = tableId;
      table.values.length = 0;
      let i = 0;
      while (i < 64) {
        if ( prec == 0 ) {
          table.values.push(this.data._view.getUint8(pos));
          pos = pos + 1;
        } else {
          table.values.push(this.readUint16BE(pos));
          pos = pos + 2;
        }
        i = i + 1;
      };
      console.log("  Quantization table " + ((tableId.toString())));
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let scanComponents = [];
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
          scanComponents.push(j);
        }
        j = j + 1;
      };
      i = i + 1;
    };
    this.scanSs = this.data._view.getUint8(pos);
    this.scanSe = this.data._view.getUint8((pos + 1));
    const approx = this.data._view.getUint8((pos + 2));
    this.scanAh = (approx >> 4);
    this.scanAl = (approx & 15);
    pos = pos + 3;
    let scanType = "data";
    if ( (this.scanSs == 0) && (this.scanSe == 0) ) {
      if ( this.scanAh == 0 ) {
        scanType = "DC first";
      } else {
        scanType = "DC refine";
      }
    } else {
      if ( this.scanAh == 0 ) {
        scanType = "AC first";
      } else {
        scanType = "AC refine";
      }
    }
    let compList = "";
    let si = 0;
    while (si < (scanComponents.length)) {
      if ( si > 0 ) {
        compList = compList + ",";
      }
      compList = compList + (((scanComponents[si]).toString()));
      si = si + 1;
    };
    console.log(((((((((((("    Scan: comps=[" + compList) + "] Ss=") + ((this.scanSs.toString()))) + " Se=") + ((this.scanSe.toString()))) + " Ah=") + ((this.scanAh.toString()))) + " Al=") + ((this.scanAl.toString()))) + " (") + scanType) + ")");
    const scanStart = pos;
    let searchPos = pos;
    while (searchPos < (this.dataLen - 1)) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8((searchPos + 1));
        if ( (nextB != 0) && (nextB != 255) ) {
          if ( (nextB >= 208) && (nextB <= 215) ) {
            searchPos = searchPos + 2;
            continue;
          }
          break;
        }
      }
      searchPos = searchPos + 1;
    };
    const scanLen = searchPos - scanStart;
    const reader = new BitReader();
    reader.init(this.data, scanStart, scanLen);
    this.eobrun = 0;
    if ( (this.scanSs == 0) && (this.scanAh == 0) ) {
      let c = 0;
      while (c < this.numComponents) {
        const comp_1 = this.components[c];
        comp_1.prevDC = 0;
        c = c + 1;
      };
    }
    if ( this.isProgressive ) {
      this.decodeProgressiveScan(reader, scanComponents);
    } else {
      this.decodeBaselineScan(reader, scanComponents);
    }
    return searchPos;
  };
  decodeProgressiveScan (reader, scanComps) {
    const numScanComps = scanComps.length;
    const isDCFirst = ((this.scanSs == 0) && (this.scanSe == 0)) && (this.scanAh == 0);
    const isDCRefine = ((this.scanSs == 0) && (this.scanSe == 0)) && (this.scanAh > 0);
    const isACFirst = (this.scanSs > 0) && (this.scanAh == 0);
    const isACRefine = (this.scanSs > 0) && (this.scanAh > 0);
    if ( numScanComps > 1 ) {
      this.decodeInterleavedDC(reader, scanComps, isDCFirst, isDCRefine);
    } else {
      const compIdx = scanComps[0];
      if ( isDCFirst ) {
        this.decodeDCFirst(reader, compIdx);
      }
      if ( isDCRefine ) {
        this.decodeDCRefine(reader, compIdx);
      }
      if ( isACFirst ) {
        this.decodeACFirst(reader, compIdx);
      }
      if ( isACRefine ) {
        this.decodeACRefine(reader, compIdx);
      }
    }
  };
  decodeInterleavedDC (reader, scanComps, isDCFirst, isDCRefine) {
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let sc = 0;
        const numScanComps = scanComps.length;
        while (sc < numScanComps) {
          const compIdx = scanComps[sc];
          const comp = this.components[compIdx];
          const buf = this.coeffBuffers[compIdx];
          let bv = 0;
          while (bv < comp.vSamp) {
            let bh = 0;
            while (bh < comp.hSamp) {
              const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
              if ( isDCFirst ) {
                const dcTable = this.huffman.getDCTable(comp.dcTableId);
                const dcCategory = dcTable.decode(reader);
                const dcDiff = reader.receiveExtend(dcCategory);
                const dcValue = comp.prevDC + dcDiff;
                comp.prevDC = dcValue;
                buf.setVal(blockIdx, 0, (dcValue << this.scanAl));
              }
              if ( isDCRefine ) {
                const bit = reader.readBit();
                const oldVal = (buf).get(blockIdx, 0);
                buf.setVal(blockIdx, 0, (oldVal | ((bit << this.scanAl))));
              }
              bh = bh + 1;
            };
            bv = bv + 1;
          };
          sc = sc + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
  };
  decodeDCFirst (reader, compIdx) {
    const comp = this.components[compIdx];
    const buf = this.coeffBuffers[compIdx];
    const dcTable = this.huffman.getDCTable(comp.dcTableId);
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            const dcCategory = dcTable.decode(reader);
            const dcDiff = reader.receiveExtend(dcCategory);
            const dcValue = comp.prevDC + dcDiff;
            comp.prevDC = dcValue;
            buf.setVal(blockIdx, 0, (dcValue << this.scanAl));
            bh = bh + 1;
          };
          bv = bv + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
  };
  decodeDCRefine (reader, compIdx) {
    const comp = this.components[compIdx];
    const buf = this.coeffBuffers[compIdx];
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            const bit = reader.readBit();
            const oldVal = (buf).get(blockIdx, 0);
            buf.setVal(blockIdx, 0, (oldVal | ((bit << this.scanAl))));
            bh = bh + 1;
          };
          bv = bv + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
  };
  decodeACFirst (reader, compIdx) {
    const comp = this.components[compIdx];
    const buf = this.coeffBuffers[compIdx];
    const acTable = this.huffman.getACTable(comp.acTableId);
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            if ( this.eobrun > 0 ) {
              this.eobrun = this.eobrun - 1;
            } else {
              let k = this.scanSs;
              while (k <= this.scanSe) {
                const symbol = acTable.decode(reader);
                const run = (symbol >> 4);
                const size = (symbol & 15);
                if ( size == 0 ) {
                  if ( run == 15 ) {
                    k = k + 16;
                  } else {
                    if ( run > 0 ) {
                      this.eobrun = (1 << run);
                      this.eobrun = this.eobrun + reader.readBits(run);
                    } else {
                      this.eobrun = 1;
                    }
                    this.eobrun = this.eobrun - 1;
                    k = 64;
                  }
                } else {
                  k = k + run;
                  if ( k <= this.scanSe ) {
                    const acValue = reader.receiveExtend(size);
                    buf.setVal(blockIdx, k, (acValue << this.scanAl));
                    k = k + 1;
                  }
                }
              };
            }
            bh = bh + 1;
          };
          bv = bv + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
  };
  decodeACRefine (reader, compIdx) {
    const comp = this.components[compIdx];
    const buf = this.coeffBuffers[compIdx];
    const acTable = this.huffman.getACTable(comp.acTableId);
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            this.decodeACRefineBlock(reader, buf, blockIdx, acTable);
            bh = bh + 1;
          };
          bv = bv + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
  };
  decodeACRefineBlock (reader, buf, blockIdx, acTable) {
    let k = this.scanSs;
    if ( this.eobrun > 0 ) {
      while (k <= this.scanSe) {
        const oldVal = (buf).get(blockIdx, k);
        if ( oldVal != 0 ) {
          const bit = reader.readBit();
          if ( bit != 0 ) {
            if ( oldVal > 0 ) {
              buf.setVal(blockIdx, k, (oldVal | ((1 << this.scanAl))));
            } else {
              buf.setVal(blockIdx, k, oldVal - ((1 << this.scanAl)));
            }
          }
        }
        k = k + 1;
      };
      this.eobrun = this.eobrun - 1;
      return;
    }
    while (k <= this.scanSe) {
      const symbol = acTable.decode(reader);
      const run = (symbol >> 4);
      const size = (symbol & 15);
      if ( size == 0 ) {
        if ( run == 15 ) {
          let zerosToSkip = 16;
          while ((zerosToSkip > 0) && (k <= this.scanSe)) {
            const oldVal_1 = (buf).get(blockIdx, k);
            if ( oldVal_1 != 0 ) {
              const bit_1 = reader.readBit();
              if ( bit_1 != 0 ) {
                if ( oldVal_1 > 0 ) {
                  buf.setVal(blockIdx, k, (oldVal_1 | ((1 << this.scanAl))));
                } else {
                  buf.setVal(blockIdx, k, oldVal_1 - ((1 << this.scanAl)));
                }
              }
            } else {
              zerosToSkip = zerosToSkip - 1;
            }
            k = k + 1;
          };
        } else {
          if ( run > 0 ) {
            this.eobrun = (1 << run);
            this.eobrun = this.eobrun + reader.readBits(run);
          } else {
            this.eobrun = 1;
          }
          while (k <= this.scanSe) {
            const oldVal_2 = (buf).get(blockIdx, k);
            if ( oldVal_2 != 0 ) {
              const bit_2 = reader.readBit();
              if ( bit_2 != 0 ) {
                if ( oldVal_2 > 0 ) {
                  buf.setVal(blockIdx, k, (oldVal_2 | ((1 << this.scanAl))));
                } else {
                  buf.setVal(blockIdx, k, oldVal_2 - ((1 << this.scanAl)));
                }
              }
            }
            k = k + 1;
          };
          this.eobrun = this.eobrun - 1;
        }
      } else {
        const signBit = reader.readBit();
        let newCoeff = (1 << this.scanAl);
        if ( signBit == 0 ) {
          newCoeff = 0 - newCoeff;
        }
        let zerosToSkip_1 = run;
        while (k <= this.scanSe) {
          const oldVal_3 = (buf).get(blockIdx, k);
          if ( oldVal_3 != 0 ) {
            const bit_3 = reader.readBit();
            if ( bit_3 != 0 ) {
              if ( oldVal_3 > 0 ) {
                buf.setVal(blockIdx, k, (oldVal_3 | ((1 << this.scanAl))));
              } else {
                buf.setVal(blockIdx, k, oldVal_3 - ((1 << this.scanAl)));
              }
            }
          } else {
            if ( zerosToSkip_1 > 0 ) {
              zerosToSkip_1 = zerosToSkip_1 - 1;
            } else {
              buf.setVal(blockIdx, k, newCoeff);
              k = k + 1;
              break;
            }
          }
          k = k + 1;
        };
      }
    };
  };
  decodeBaselineScan (reader, scanComps) {
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        let sc = 0;
        const numScanComps = scanComps.length;
        while (sc < numScanComps) {
          const compIdx = scanComps[sc];
          const comp = this.components[compIdx];
          const quantTable = this.quantTables[comp.quantTableId];
          const buf = this.coeffBuffers[compIdx];
          let bv = 0;
          while (bv < comp.vSamp) {
            let bh = 0;
            while (bh < comp.hSamp) {
              const blockIdx = (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
              const dcTable = this.huffman.getDCTable(comp.dcTableId);
              const dcCategory = dcTable.decode(reader);
              const dcDiff = reader.receiveExtend(dcCategory);
              const dcValue = comp.prevDC + dcDiff;
              comp.prevDC = dcValue;
              const dcQuant = quantTable.values[0];
              buf.setVal(blockIdx, 0, dcValue * dcQuant);
              const acTable = this.huffman.getACTable(comp.acTableId);
              let k = 1;
              while (k < 64) {
                const acSymbol = acTable.decode(reader);
                if ( acSymbol == 0 ) {
                  k = 64;
                } else {
                  const run = (acSymbol >> 4);
                  const size = (acSymbol & 15);
                  if ( acSymbol == 240 ) {
                    k = k + 16;
                  } else {
                    k = k + run;
                    if ( k < 64 ) {
                      const acValue = reader.receiveExtend(size);
                      const acQuant = quantTable.values[k];
                      buf.setVal(blockIdx, k, acValue * acQuant);
                      k = k + 1;
                    }
                  }
                }
              };
              bh = bh + 1;
            };
            bv = bv + 1;
          };
          sc = sc + 1;
        };
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
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
      console.log("Error: Not a JPEG file");
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
        this.parseSOF(dataStart, markerDataLen, 0);
      }
      if ( marker2 == 193 ) {
        console.log("  SOF1 (Extended Sequential)");
        this.parseSOF(dataStart, markerDataLen, 1);
      }
      if ( marker2 == 194 ) {
        console.log("  SOF2 (Progressive DCT)");
        this.parseSOF(dataStart, markerDataLen, 2);
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
        const nextPos = this.parseSOS(dataStart, markerDataLen);
        pos = nextPos;
        continue;
      }
      if ( marker2 == 224 ) {
        console.log("  APP0 (JFIF)");
      }
      if ( marker2 == 225 ) {
        console.log("  APP1 (EXIF)");
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  };
  dequantizeCoefficients () {
    let c = 0;
    while (c < this.numComponents) {
      const comp = this.components[c];
      const quantTable = this.quantTables[comp.quantTableId];
      const buf = this.coeffBuffers[c];
      let blockIdx = 0;
      while (blockIdx < buf.numBlocks) {
        let k = 0;
        while (k < 64) {
          const oldVal = (buf).get(blockIdx, k);
          const quantVal = quantTable.values[k];
          buf.setVal(blockIdx, k, oldVal * quantVal);
          k = k + 1;
        };
        blockIdx = blockIdx + 1;
      };
      c = c + 1;
    };
  };
  buildImage () {
    if ( this.isProgressive ) {
      console.log("Dequantizing coefficients...");
      this.dequantizeCoefficients();
    }
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    console.log("Building image...");
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = (mcuY * this.mcusPerRow) + mcuX;
        const baseX = mcuX * this.mcuWidth;
        const baseY = mcuY * this.mcuHeight;
        const comp0 = this.components[0];
        const yBuf = this.coeffBuffers[0];
        let yBlocksData = [];
        let bv = 0;
        while (bv < comp0.vSamp) {
          let bh = 0;
          while (bh < comp0.hSamp) {
            const blockIdx = (((mcuIdx * comp0.hSamp) * comp0.vSamp) + (bv * comp0.hSamp)) + bh;
            let blockCoeffs = [];
            let k = 0;
            while (k < 64) {
              blockCoeffs.push((yBuf).get(blockIdx, k));
              k = k + 1;
            };
            let tempBlock = [];
            this.idct.dezigzag(blockCoeffs, tempBlock);
            let blockPixels = [];
            k = 0;
            while (k < 64) {
              blockPixels.push(0);
              k = k + 1;
            };
            this.idct.transform(tempBlock, blockPixels);
            k = 0;
            while (k < 64) {
              yBlocksData.push(blockPixels[k]);
              k = k + 1;
            };
            bh = bh + 1;
          };
          bv = bv + 1;
        };
        let cbBlock = [];
        let crBlock = [];
        if ( this.numComponents >= 3 ) {
          const cbBuf = this.coeffBuffers[1];
          const cbBlockIdx = mcuIdx;
          let blockCoeffs_1 = [];
          let k_1 = 0;
          while (k_1 < 64) {
            blockCoeffs_1.push((cbBuf).get(cbBlockIdx, k_1));
            k_1 = k_1 + 1;
          };
          let tempBlock_1 = [];
          this.idct.dezigzag(blockCoeffs_1, tempBlock_1);
          k_1 = 0;
          while (k_1 < 64) {
            cbBlock.push(0);
            k_1 = k_1 + 1;
          };
          this.idct.transform(tempBlock_1, cbBlock);
          const crBuf = this.coeffBuffers[2];
          const crBlockIdx = mcuIdx;
          blockCoeffs_1.length = 0;
          k_1 = 0;
          while (k_1 < 64) {
            blockCoeffs_1.push((crBuf).get(crBlockIdx, k_1));
            k_1 = k_1 + 1;
          };
          tempBlock_1.length = 0;
          this.idct.dezigzag(blockCoeffs_1, tempBlock_1);
          k_1 = 0;
          while (k_1 < 64) {
            crBlock.push(0);
            k_1 = k_1 + 1;
          };
          this.idct.transform(tempBlock_1, crBlock);
        }
        this.writeMCU(img, baseX, baseY, yBlocksData, cbBlock, crBlock);
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    return img;
  };
  writeMCU (img, baseX, baseY, yBlocksData, cbBlock, crBlock) {
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
    const yLen = yBlocksData.length;
    if ( yLen > 0 ) {
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
    const img = this.buildImage();
    console.log("Decode complete!");
    return img;
  };
}
class JPEGEncoderTest  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=== Ranger JPEG Encoder Test ===");
  console.log("");
  const basePath = "c:/Users/terok/proj/Ranger/gallery/pdf_writer";
  console.log("--- Test 1: Baseline JPEG ---");
  console.log("Loading Canon_40D.jpg...");
  const decoder = new JPEGDecoder();
  const img = decoder.decode(basePath, "Canon_40D.jpg");
  console.log((("Original image: " + ((img.width.toString()))) + "x") + ((img.height.toString())));
  console.log("Scaling 5x...");
  const scaled = img.scale(5);
  console.log((("Scaled image: " + ((scaled.width.toString()))) + "x") + ((scaled.height.toString())));
  const encoder = new JPEGEncoder();
  encoder.setQuality(85);
  encoder.encode(scaled, basePath, "Canon_40D_scaled.jpg");
  console.log("Saved: Canon_40D_scaled.jpg");
  console.log("");
  console.log("--- Test 2: Progressive JPEG ---");
  console.log("Loading Example.jpg (progressive)...");
  const progDecoder = new ProgressiveJPEGDecoder();
  const progImg = progDecoder.decode(basePath, "Example.jpg");
  console.log((("Original image: " + ((progImg.width.toString()))) + "x") + ((progImg.height.toString())));
  console.log("Scaling 2x...");
  const progScaled = progImg.scale(2);
  console.log((("Scaled image: " + ((progScaled.width.toString()))) + "x") + ((progScaled.height.toString())));
  const encoder2 = new JPEGEncoder();
  encoder2.setQuality(90);
  encoder2.encode(progScaled, basePath, "Example_scaled.jpg");
  console.log("Saved: Example_scaled.jpg");
  console.log("");
  console.log("=== Done! ===");
  console.log("Results:");
  console.log("  - Canon_40D_scaled.jpg (100x68 -> 500x340)");
  console.log("  - Example_scaled.jpg (300x300 -> 600x600)");
}
__js_main();
