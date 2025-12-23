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
    this.firstChunk = new BufferChunk(4096);
    this.currentChunk = new BufferChunk(4096);
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
    const pos = this.currentChunk.used;
    this.currentChunk.data._view.setUint8(pos, b);
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
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
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
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
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
    return this.scaleToSize(newW, newH);
  };
  scaleToSize (newW, newH) {
    const result = new ImageBuffer();
    result.init(newW, newH);
    const scaleX = (this.width) / (newW);
    const scaleY = (this.height) / (newH);
    let destY = 0;
    while (destY < newH) {
      const srcYf = (destY) * scaleY;
      const srcY0 = Math.floor( srcYf);
      let srcY1 = srcY0 + 1;
      if ( srcY1 >= this.height ) {
        srcY1 = this.height - 1;
      }
      const fy = srcYf - (srcY0);
      let destX = 0;
      while (destX < newW) {
        const srcXf = (destX) * scaleX;
        const srcX0 = Math.floor( srcXf);
        let srcX1 = srcX0 + 1;
        if ( srcX1 >= this.width ) {
          srcX1 = this.width - 1;
        }
        const fx = srcXf - (srcX0);
        const off00 = ((srcY0 * this.width) + srcX0) * 4;
        const off01 = ((srcY0 * this.width) + srcX1) * 4;
        const off10 = ((srcY1 * this.width) + srcX0) * 4;
        const off11 = ((srcY1 * this.width) + srcX1) * 4;
        const r = this.bilinear((this.pixels._view.getUint8(off00)), (this.pixels._view.getUint8(off01)), (this.pixels._view.getUint8(off10)), (this.pixels._view.getUint8(off11)), fx, fy);
        const g = this.bilinear((this.pixels._view.getUint8((off00 + 1))), (this.pixels._view.getUint8((off01 + 1))), (this.pixels._view.getUint8((off10 + 1))), (this.pixels._view.getUint8((off11 + 1))), fx, fy);
        const b = this.bilinear((this.pixels._view.getUint8((off00 + 2))), (this.pixels._view.getUint8((off01 + 2))), (this.pixels._view.getUint8((off10 + 2))), (this.pixels._view.getUint8((off11 + 2))), fx, fy);
        const a = this.bilinear((this.pixels._view.getUint8((off00 + 3))), (this.pixels._view.getUint8((off01 + 3))), (this.pixels._view.getUint8((off10 + 3))), (this.pixels._view.getUint8((off11 + 3))), fx, fy);
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
  bilinear (v00, v01, v10, v11, fx, fy) {
    const top = ((v00) * (1.0 - fx)) + ((v01) * fx);
    const bottom = ((v10) * (1.0 - fx)) + ((v11) * fx);
    const result = (top * (1.0 - fy)) + (bottom * fy);
    return Math.floor( result);
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
class RasterPixel  {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  init (red, green, blue, alpha) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  initRGB (red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
  clone () {
    const p = new RasterPixel();
    p.r = this.r;
    p.g = this.g;
    p.b = this.b;
    p.a = this.a;
    return p;
  };
}
class RasterBuffer  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixels = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
  }
  create (w, h) {
    this.width = w;
    this.height = h;
    const size = (w * h) * 4;
    this.pixels = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, 0);
      i = i + 1;
    };
  };
  createWithColor (w, h, r, g, b, a) {
    this.create(w, h);
    this.fill(r, g, b, a);
  };
  getIndex (x, y) {
    return ((y * this.width) + x) * 4;
  };
  inBounds (x, y) {
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
  setPixel (x, y, r, g, b, a) {
    if ( this.inBounds(x, y) == false ) {
      return;
    }
    const idx = this.getIndex(x, y);
    this.pixels._view.setUint8(idx, r);
    this.pixels._view.setUint8(idx + 1, g);
    this.pixels._view.setUint8(idx + 2, b);
    this.pixels._view.setUint8(idx + 3, a);
  };
  setPixelObj (x, y, p) {
    this.setPixel(x, y, p.r, p.g, p.b, p.a);
  };
  getPixel (x, y) {
    const p = new RasterPixel();
    if ( this.inBounds(x, y) == false ) {
      return p;
    }
    const idx = this.getIndex(x, y);
    p.r = this.pixels._view.getUint8(idx);
    p.g = this.pixels._view.getUint8((idx + 1));
    p.b = this.pixels._view.getUint8((idx + 2));
    p.a = this.pixels._view.getUint8((idx + 3));
    return p;
  };
  getR (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8(idx);
  };
  getG (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 1));
  };
  getB (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 2));
  };
  getA (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 3));
  };
  fill (r, g, b, a) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const idx = i * 4;
      this.pixels._view.setUint8(idx, r);
      this.pixels._view.setUint8(idx + 1, g);
      this.pixels._view.setUint8(idx + 2, b);
      this.pixels._view.setUint8(idx + 3, a);
      i = i + 1;
    };
  };
  clear () {
    this.fill(0, 0, 0, 0);
  };
  clearWhite () {
    this.fill(255, 255, 255, 255);
  };
  fillRect (x, y, w, h, r, g, b, a) {
    let endX = x + w;
    let endY = y + h;
    if ( x < 0 ) {
      x = 0;
    }
    if ( y < 0 ) {
      y = 0;
    }
    if ( endX > this.width ) {
      endX = this.width;
    }
    if ( endY > this.height ) {
      endY = this.height;
    }
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.setPixel(px, py, r, g, b, a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  copyFrom (src, srcX, srcY, dstX, dstY, w, h) {
    let sy = 0;
    while (sy < h) {
      let sx = 0;
      while (sx < w) {
        const p = src.getPixel((srcX + sx), (srcY + sy));
        this.setPixel(dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  clone () {
    const copy = new RasterBuffer();
    copy.create(this.width, this.height);
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      copy.pixels._view.setUint8(i, this.pixels._view.getUint8(i));
      i = i + 1;
    };
    return copy;
  };
  getPixelCount () {
    return this.width * this.height;
  };
  getByteSize () {
    return (this.width * this.height) * 4;
  };
  toImageBuffer () {
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      let r = this.pixels._view.getUint8(i);
      let g = this.pixels._view.getUint8((i + 1));
      let b = this.pixels._view.getUint8((i + 2));
      const a = this.pixels._view.getUint8((i + 3));
      if ( a < 255 ) {
        const alpha = (a) / 255.0;
        const invAlpha = 1.0 - alpha;
        r = Math.floor( (((r) * alpha) + (255.0 * invAlpha)));
        g = Math.floor( (((g) * alpha) + (255.0 * invAlpha)));
        b = Math.floor( (((b) * alpha) + (255.0 * invAlpha)));
      }
      img.pixels._view.setUint8(i, r);
      img.pixels._view.setUint8(i + 1, g);
      img.pixels._view.setUint8(i + 2, b);
      img.pixels._view.setUint8(i + 3, 255);
      i = i + 4;
    };
    return img;
  };
  fromImageBuffer (img) {
    this.create(img.width, img.height);
    const size = (img.width * img.height) * 4;
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, img.pixels._view.getUint8(i));
      this.pixels._view.setUint8(i + 1, img.pixels._view.getUint8((i + 1)));
      this.pixels._view.setUint8(i + 2, img.pixels._view.getUint8((i + 2)));
      this.pixels._view.setUint8(i + 3, 255);
      i = i + 4;
    };
  };
  getRawBuffer () {
    return this.pixels;
  };
}
class RasterCompositor  {
  constructor() {
  }
  clamp255 (val) {
    if ( val < 0 ) {
      return 0;
    }
    if ( val > 255 ) {
      return 255;
    }
    return val;
  };
  clamp01 (val) {
    if ( val < 0.0 ) {
      return 0.0;
    }
    if ( val > 1.0 ) {
      return 1.0;
    }
    return val;
  };
  blendSourceOver (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    if ( srcA >= 255 ) {
      buf.setPixel(x, y, srcR, srcG, srcB, 255);
      return;
    }
    if ( srcA <= 0 ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const srcAlpha = (srcA) / 255.0;
    const dstAlpha = (dst.a) / 255.0;
    const outAlpha = srcAlpha + (dstAlpha * (1.0 - srcAlpha));
    if ( outAlpha < 0.001 ) {
      buf.setPixel(x, y, 0, 0, 0, 0);
      return;
    }
    const invSrcAlpha = 1.0 - srcAlpha;
    let outR = ((srcR) * srcAlpha) + (((dst.r) * dstAlpha) * invSrcAlpha);
    let outG = ((srcG) * srcAlpha) + (((dst.g) * dstAlpha) * invSrcAlpha);
    let outB = ((srcB) * srcAlpha) + (((dst.b) * dstAlpha) * invSrcAlpha);
    outR = outR / outAlpha;
    outG = outG / outAlpha;
    outB = outB / outAlpha;
    buf.setPixel(x, y, this.clamp255((Math.floor( outR))), this.clamp255((Math.floor( outG))), this.clamp255((Math.floor( outB))), this.clamp255((Math.floor( (outAlpha * 255.0)))));
  };
  blendPixelOver (buf, x, y, src) {
    this.blendSourceOver(buf, x, y, src.r, src.g, src.b, src.a);
  };
  fillRectBlended (buf, x, y, w, h, r, g, b, a) {
    let endX = x + w;
    let endY = y + h;
    if ( x < 0 ) {
      x = 0;
    }
    if ( y < 0 ) {
      y = 0;
    }
    if ( endX > buf.width ) {
      endX = buf.width;
    }
    if ( endY > buf.height ) {
      endY = buf.height;
    }
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.blendSourceOver(buf, px, py, r, g, b, a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  compositeOver (dst, src, dstX, dstY) {
    let sy = 0;
    while (sy < src.height) {
      let sx = 0;
      while (sx < src.width) {
        const p = src.getPixel(sx, sy);
        this.blendSourceOver(dst, dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  compositeRegionOver (dst, src, srcX, srcY, srcW, srcH, dstX, dstY) {
    let sy = 0;
    while (sy < srcH) {
      let sx = 0;
      while (sx < srcW) {
        const p = src.getPixel((srcX + sx), (srcY + sy));
        this.blendSourceOver(dst, dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  blendMultiply (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    let outR = Math.floor( (((srcR * dst.r)) / 255.0));
    let outG = Math.floor( (((srcG * dst.g)) / 255.0));
    let outB = Math.floor( (((srcB * dst.b)) / 255.0));
    const srcAlpha = (srcA) / 255.0;
    const invAlpha = 1.0 - srcAlpha;
    outR = Math.floor( (((outR) * srcAlpha) + ((dst.r) * invAlpha)));
    outG = Math.floor( (((outG) * srcAlpha) + ((dst.g) * invAlpha)));
    outB = Math.floor( (((outB) * srcAlpha) + ((dst.b) * invAlpha)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendScreen (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const scrR = 255 - srcR;
    const scrG = 255 - srcG;
    const scrB = 255 - srcB;
    const dstInvR = 255 - dst.r;
    const dstInvG = 255 - dst.g;
    const dstInvB = 255 - dst.b;
    let outR = 255 - (Math.floor( (((scrR * dstInvR)) / 255.0)));
    let outG = 255 - (Math.floor( (((scrG * dstInvG)) / 255.0)));
    let outB = 255 - (Math.floor( (((scrB * dstInvB)) / 255.0)));
    const srcAlpha = (srcA) / 255.0;
    const invAlpha = 1.0 - srcAlpha;
    outR = Math.floor( (((outR) * srcAlpha) + ((dst.r) * invAlpha)));
    outG = Math.floor( (((outG) * srcAlpha) + ((dst.g) * invAlpha)));
    outB = Math.floor( (((outB) * srcAlpha) + ((dst.b) * invAlpha)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendAdditive (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const srcAlpha = (srcA) / 255.0;
    const addR = Math.floor( ((srcR) * srcAlpha));
    const addG = Math.floor( ((srcG) * srcAlpha));
    const addB = Math.floor( ((srcB) * srcAlpha));
    const outR = dst.r + addR;
    const outG = dst.g + addG;
    const outB = dst.b + addB;
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendPreMultiplied (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    if ( srcA >= 255 ) {
      buf.setPixel(x, y, srcR, srcG, srcB, 255);
      return;
    }
    if ( srcA <= 0 ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const invAlpha = 255 - srcA;
    const outR = srcR + (Math.floor( (((dst.r * invAlpha)) / 255.0)));
    const outG = srcG + (Math.floor( (((dst.g * invAlpha)) / 255.0)));
    const outB = srcB + (Math.floor( (((dst.b * invAlpha)) / 255.0)));
    const outA = srcA + (Math.floor( (((dst.a * invAlpha)) / 255.0)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), this.clamp255(outA));
  };
}
class RasterPrimitives  {
  constructor() {
    this.compositor = new RasterCompositor();
  }
  drawLine (buf, x1, y1, x2, y2, r, g, b, a) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let absDx = dx;
    if ( absDx < 0 ) {
      absDx = 0 - absDx;
    }
    let absDy = dy;
    if ( absDy < 0 ) {
      absDy = 0 - absDy;
    }
    let sx = 1;
    if ( x1 > x2 ) {
      sx = 0 - 1;
    }
    let sy = 1;
    if ( y1 > y2 ) {
      sy = 0 - 1;
    }
    let err = absDx - absDy;
    let x = x1;
    let y = y1;
    let done = false;
    while (done == false) {
      this.compositor.blendSourceOver(buf, x, y, r, g, b, a);
      if ( (x == x2) && (y == y2) ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > (0 - absDy) ) {
          err = err - absDy;
          x = x + sx;
        }
        if ( e2 < absDx ) {
          err = err + absDx;
          y = y + sy;
        }
      }
    };
  };
  drawRect (buf, x, y, w, h, r, g, b, a) {
    this.drawLine(buf, x, y, (x + w) - 1, y, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, y, (x + w) - 1, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, (y + h) - 1, x, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, x, (y + h) - 1, x, y, r, g, b, a);
  };
  fillRect (buf, x, y, w, h, r, g, b, a) {
    this.compositor.fillRectBlended(buf, x, y, w, h, r, g, b, a);
  };
  fillRectSolid (buf, x, y, w, h, r, g, b, a) {
    buf.fillRect(x, y, w, h, r, g, b, a);
  };
  fillRoundedRect (buf, x, y, w, h, radius, r, g, b, a) {
    let maxR = Math.floor( ((w) / 2.0));
    const halfH = Math.floor( ((h) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    if ( radius < 0 ) {
      radius = 0;
    }
    if ( radius == 0 ) {
      this.fillRect(buf, x, y, w, h, r, g, b, a);
      return;
    }
    this.fillRect(buf, x, y + radius, w, h - (radius * 2), r, g, b, a);
    this.fillRect(buf, x + radius, y, w - (radius * 2), radius, r, g, b, a);
    this.fillRect(buf, x + radius, (y + h) - radius, w - (radius * 2), radius, r, g, b, a);
    this.fillCircleQuadrant(buf, x + radius, y + radius, radius, 2, r, g, b, a);
    this.fillCircleQuadrant(buf, ((x + w) - radius) - 1, y + radius, radius, 1, r, g, b, a);
    this.fillCircleQuadrant(buf, x + radius, ((y + h) - radius) - 1, radius, 3, r, g, b, a);
    this.fillCircleQuadrant(buf, ((x + w) - radius) - 1, ((y + h) - radius) - 1, radius, 4, r, g, b, a);
  };
  drawRoundedRect (buf, x, y, w, h, radius, r, g, b, a) {
    let maxR = Math.floor( ((w) / 2.0));
    const halfH = Math.floor( ((h) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    if ( radius < 0 ) {
      radius = 0;
    }
    if ( radius == 0 ) {
      this.drawRect(buf, x, y, w, h, r, g, b, a);
      return;
    }
    this.drawLine(buf, x + radius, y, ((x + w) - radius) - 1, y, r, g, b, a);
    this.drawLine(buf, x + radius, (y + h) - 1, ((x + w) - radius) - 1, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, x, y + radius, x, ((y + h) - radius) - 1, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, y + radius, (x + w) - 1, ((y + h) - radius) - 1, r, g, b, a);
    this.drawCircleArcQuadrant(buf, x + radius, y + radius, radius, 2, r, g, b, a);
    this.drawCircleArcQuadrant(buf, ((x + w) - radius) - 1, y + radius, radius, 1, r, g, b, a);
    this.drawCircleArcQuadrant(buf, x + radius, ((y + h) - radius) - 1, radius, 3, r, g, b, a);
    this.drawCircleArcQuadrant(buf, ((x + w) - radius) - 1, ((y + h) - radius) - 1, radius, 4, r, g, b, a);
  };
  fillCircle (buf, cx, cy, radius, r, g, b, a) {
    const r2 = radius * radius;
    let y = 0 - radius;
    while (y <= radius) {
      let x = 0 - radius;
      while (x <= radius) {
        const d2 = (x * x) + (y * y);
        if ( d2 <= r2 ) {
          this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawCircle (buf, cx, cy, radius, r, g, b, a) {
    let x = 0;
    let y = radius;
    let d = 1 - radius;
    this.drawCirclePoints(buf, cx, cy, x, y, r, g, b, a);
    while (x < y) {
      if ( d < 0 ) {
        d = (d + (2 * x)) + 3;
      } else {
        d = (d + (2 * (x - y))) + 5;
        y = y - 1;
      }
      x = x + 1;
      this.drawCirclePoints(buf, cx, cy, x, y, r, g, b, a);
    };
  };
  drawCirclePoints (buf, cx, cy, x, y, r, g, b, a) {
    this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - x, cy + y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + x, cy - y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - x, cy - y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + y, cy + x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - y, cy + x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + y, cy - x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - y, cy - x, r, g, b, a);
  };
  fillCircleQuadrant (buf, cx, cy, radius, quadrant, r, g, b, a) {
    const r2 = radius * radius;
    const startY = 0;
    const endY = radius;
    const startX = 0;
    const endX = radius;
    let dirX = 1;
    let dirY = 1;
    if ( quadrant == 1 ) {
      dirX = 1;
      dirY = -1;
    }
    if ( quadrant == 2 ) {
      dirX = -1;
      dirY = -1;
    }
    if ( quadrant == 3 ) {
      dirX = -1;
      dirY = 1;
    }
    if ( quadrant == 4 ) {
      dirX = 1;
      dirY = 1;
    }
    let dy = 0;
    while (dy <= radius) {
      let dx = 0;
      while (dx <= radius) {
        const d2 = (dx * dx) + (dy * dy);
        if ( d2 <= r2 ) {
          const px = cx + (dx * dirX);
          const py = cy + (dy * dirY);
          this.compositor.blendSourceOver(buf, px, py, r, g, b, a);
        }
        dx = dx + 1;
      };
      dy = dy + 1;
    };
  };
  drawCircleArcQuadrant (buf, cx, cy, radius, quadrant, r, g, b, a) {
    let x = 0;
    let y = radius;
    let d = 1 - radius;
    let dirX = 1;
    let dirY = -1;
    if ( quadrant == 1 ) {
      dirX = 1;
      dirY = -1;
    }
    if ( quadrant == 2 ) {
      dirX = -1;
      dirY = -1;
    }
    if ( quadrant == 3 ) {
      dirX = -1;
      dirY = 1;
    }
    if ( quadrant == 4 ) {
      dirX = 1;
      dirY = 1;
    }
    this.compositor.blendSourceOver(buf, cx + (x * dirX), cy + (y * dirY), r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + (y * dirX), cy + (x * dirY), r, g, b, a);
    while (x < y) {
      if ( d < 0 ) {
        d = (d + (2 * x)) + 3;
      } else {
        d = (d + (2 * (x - y))) + 5;
        y = y - 1;
      }
      x = x + 1;
      this.compositor.blendSourceOver(buf, cx + (x * dirX), cy + (y * dirY), r, g, b, a);
      this.compositor.blendSourceOver(buf, cx + (y * dirX), cy + (x * dirY), r, g, b, a);
    };
  };
  drawLineAA (buf, x0, y0, x1, y1, r, g, b, a) {
    this.drawLine(buf, x0, y0, x1, y1, r, g, b, a);
  };
  fillEllipse (buf, cx, cy, rx, ry, r, g, b, a) {
    const rx2 = (rx) * (rx);
    const ry2 = (ry) * (ry);
    let y = 0 - ry;
    while (y <= ry) {
      const yf = y;
      const xExtent = Math.sqrt((rx2 * (1.0 - ((yf * yf) / ry2))));
      const xi = Math.floor( xExtent);
      let x = 0 - xi;
      while (x <= xi) {
        this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawEllipse (buf, cx, cy, rx, ry, r, g, b, a) {
    let steps = (rx + ry) * 2;
    if ( steps < 20 ) {
      steps = 20;
    }
    const angleStep = 6.28318530718 / (steps);
    let angle = 0.0;
    let lastX = cx + rx;
    let lastY = cy;
    let i = 0;
    while (i <= steps) {
      const newX = cx + (Math.floor( ((rx) * (Math.cos(angle)))));
      const newY = cy + (Math.floor( ((ry) * (Math.sin(angle)))));
      if ( i > 0 ) {
        this.drawLine(buf, lastX, lastY, newX, newY, r, g, b, a);
      }
      lastX = newX;
      lastY = newY;
      angle = angle + angleStep;
      i = i + 1;
    };
  };
}
class GradientStop  {
  constructor() {
    this.position = 0.0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  init (pos, red, green, blue, alpha) {
    this.position = pos;
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  initRGB (pos, red, green, blue) {
    this.position = pos;
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
}
class RasterGradient  {
  constructor() {
  }
  interpolateColor (stop1, stop2, t) {
    const p = new RasterPixel();
    if ( t < 0.0 ) {
      t = 0.0;
    }
    if ( t > 1.0 ) {
      t = 1.0;
    }
    const invT = 1.0 - t;
    p.r = Math.floor( (((stop1.r) * invT) + ((stop2.r) * t)));
    p.g = Math.floor( (((stop1.g) * invT) + ((stop2.g) * t)));
    p.b = Math.floor( (((stop1.b) * invT) + ((stop2.b) * t)));
    p.a = Math.floor( (((stop1.a) * invT) + ((stop2.a) * t)));
    return p;
  };
  getColorAtPosition (stops, position) {
    const numStops = stops.length;
    if ( numStops == 0 ) {
      const p = new RasterPixel();
      return p;
    }
    if ( numStops == 1 ) {
      const stop = stops[0];
      const p_1 = new RasterPixel();
      p_1.r = stop.r;
      p_1.g = stop.g;
      p_1.b = stop.b;
      p_1.a = stop.a;
      return p_1;
    }
    if ( position <= 0.0 ) {
      const stop_1 = stops[0];
      const p_2 = new RasterPixel();
      p_2.r = stop_1.r;
      p_2.g = stop_1.g;
      p_2.b = stop_1.b;
      p_2.a = stop_1.a;
      return p_2;
    }
    if ( position >= 1.0 ) {
      const stop_2 = stops[(numStops - 1)];
      const p_3 = new RasterPixel();
      p_3.r = stop_2.r;
      p_3.g = stop_2.g;
      p_3.b = stop_2.b;
      p_3.a = stop_2.a;
      return p_3;
    }
    let i = 0;
    while (i < (numStops - 1)) {
      const stop1 = stops[i];
      const stop2 = stops[(i + 1)];
      if ( (position >= stop1.position) && (position <= stop2.position) ) {
        const range = stop2.position - stop1.position;
        if ( range < 0.001 ) {
          const p_4 = new RasterPixel();
          p_4.r = stop1.r;
          p_4.g = stop1.g;
          p_4.b = stop1.b;
          p_4.a = stop1.a;
          return p_4;
        }
        const t = (position - stop1.position) / range;
        return this.interpolateColor(stop1, stop2, t);
      }
      i = i + 1;
    };
    const stop_3 = stops[(numStops - 1)];
    const p_5 = new RasterPixel();
    p_5.r = stop_3.r;
    p_5.g = stop_3.g;
    p_5.b = stop_3.b;
    p_5.a = stop_3.a;
    return p_5;
  };
  renderLinearGradient (buf, x, y, w, h, angleDeg, stops) {
    const angleRad = (angleDeg * 3.14159265359) / 180.0;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    const hw = (w) / 2.0;
    const hh = (h) / 2.0;
    const d1 = (hw * dirX) + (hh * dirY);
    const d2 = (hw * dirX) - (hh * dirY);
    const d3 = ((0.0 - hw) * dirX) + (hh * dirY);
    const d4 = ((0.0 - hw) * dirX) - (hh * dirY);
    let minD = d1;
    if ( d2 < minD ) {
      minD = d2;
    }
    if ( d3 < minD ) {
      minD = d3;
    }
    if ( d4 < minD ) {
      minD = d4;
    }
    let maxD = d1;
    if ( d2 > maxD ) {
      maxD = d2;
    }
    if ( d3 > maxD ) {
      maxD = d3;
    }
    if ( d4 > maxD ) {
      maxD = d4;
    }
    let gradientLength = maxD - minD;
    if ( gradientLength < 1.0 ) {
      gradientLength = 1.0;
    }
    const cx = hw;
    const cy = hh;
    let py = 0;
    while (py < h) {
      let px = 0;
      while (px < w) {
        const relX = (px) - cx;
        const relY = (py) - cy;
        const proj = (relX * dirX) + (relY * dirY);
        const t = (proj - minD) / gradientLength;
        const color = this.getColorAtPosition(stops, t);
        buf.setPixel(x + px, y + py, color.r, color.g, color.b, color.a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  renderRadialGradient (buf, x, y, w, h, cx, cy, radius, stops) {
    if ( radius < 1.0 ) {
      radius = 1.0;
    }
    let py = 0;
    while (py < h) {
      let px = 0;
      while (px < w) {
        const dx = (px) - cx;
        const dy = (py) - cy;
        const dist = Math.sqrt(((dx * dx) + (dy * dy)));
        let t = dist / radius;
        if ( t > 1.0 ) {
          t = 1.0;
        }
        const color = this.getColorAtPosition(stops, t);
        buf.setPixel(x + px, y + py, color.r, color.g, color.b, color.a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  renderRadialGradientCentered (buf, x, y, w, h, stops) {
    const cx = (w) / 2.0;
    const cy = (h) / 2.0;
    const radius = Math.sqrt(((cx * cx) + (cy * cy)));
    this.renderRadialGradient(buf, x, y, w, h, cx, cy, radius, stops);
  };
  renderTwoColorLinear (buf, x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2) {
    let stops = [];
    const stop1 = new GradientStop();
    stop1.initRGB(0.0, r1, g1, b1);
    stops.push(stop1);
    const stop2 = new GradientStop();
    stop2.initRGB(1.0, r2, g2, b2);
    stops.push(stop2);
    this.renderLinearGradient(buf, x, y, w, h, angleDeg, stops);
  };
  renderTwoColorRadial (buf, x, y, w, h, r1, g1, b1, r2, g2, b2) {
    let stops = [];
    const stop1 = new GradientStop();
    stop1.initRGB(0.0, r1, g1, b1);
    stops.push(stop1);
    const stop2 = new GradientStop();
    stop2.initRGB(1.0, r2, g2, b2);
    stops.push(stop2);
    this.renderRadialGradientCentered(buf, x, y, w, h, stops);
  };
  parseColorToStop (colorStr, stop) {
    const firstChar = colorStr.substring(0, 1 );
    if ( firstChar == "#" ) {
      const hex = colorStr.substring(1, (colorStr.length) );
      const hexLen = hex.length;
      if ( hexLen == 6 ) {
        const rHex = hex.substring(0, 2 );
        const gHex = hex.substring(2, 4 );
        const bHex = hex.substring(4, 6 );
        stop.r = this.hexToInt(rHex);
        stop.g = this.hexToInt(gHex);
        stop.b = this.hexToInt(bHex);
        stop.a = 255;
      }
      if ( hexLen == 3 ) {
        const rHex_1 = hex.substring(0, 1 );
        const gHex_1 = hex.substring(1, 2 );
        const bHex_1 = hex.substring(2, 3 );
        stop.r = this.hexToInt((rHex_1 + rHex_1));
        stop.g = this.hexToInt((gHex_1 + gHex_1));
        stop.b = this.hexToInt((bHex_1 + bHex_1));
        stop.a = 255;
      }
      return;
    }
    if ( colorStr.includes("rgba") ) {
      const start = colorStr.indexOf("(");
      const end = colorStr.indexOf(")");
      if ( (start >= 0) && (end > start) ) {
        const inner = colorStr.substring((start + 1), end );
        const parts = inner.split(",");
        if ( (parts.length) >= 4 ) {
          stop.r = this.parseIntSafe(((parts[0]).trim()));
          stop.g = this.parseIntSafe(((parts[1]).trim()));
          stop.b = this.parseIntSafe(((parts[2]).trim()));
          const aStr = (parts[3]).trim();
          const alpha = this.parseDoubleSafe(aStr);
          if ( alpha <= 1.0 ) {
            stop.a = Math.floor( (alpha * 255.0));
          } else {
            stop.a = Math.floor( alpha);
          }
        }
      }
      return;
    }
    if ( colorStr.includes("rgb") ) {
      const start_1 = colorStr.indexOf("(");
      const end_1 = colorStr.indexOf(")");
      if ( (start_1 >= 0) && (end_1 > start_1) ) {
        const inner_1 = colorStr.substring((start_1 + 1), end_1 );
        const parts_1 = inner_1.split(",");
        if ( (parts_1.length) >= 3 ) {
          stop.r = this.parseIntSafe(((parts_1[0]).trim()));
          stop.g = this.parseIntSafe(((parts_1[1]).trim()));
          stop.b = this.parseIntSafe(((parts_1[2]).trim()));
          stop.a = 255;
        }
      }
      return;
    }
    if ( colorStr == "red" ) {
      stop.r = 255;
      stop.g = 0;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "green" ) {
      stop.r = 0;
      stop.g = 128;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "blue" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "white" ) {
      stop.r = 255;
      stop.g = 255;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "black" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "yellow" ) {
      stop.r = 255;
      stop.g = 255;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "cyan" ) {
      stop.r = 0;
      stop.g = 255;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "magenta" ) {
      stop.r = 255;
      stop.g = 0;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "orange" ) {
      stop.r = 255;
      stop.g = 165;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "purple" ) {
      stop.r = 128;
      stop.g = 0;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "gray" ) {
      stop.r = 128;
      stop.g = 128;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "grey" ) {
      stop.r = 128;
      stop.g = 128;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "transparent" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 0;
      stop.a = 0;
      return;
    }
    stop.r = 0;
    stop.g = 0;
    stop.b = 0;
    stop.a = 255;
  };
  hexToInt (hex) {
    let result = 0;
    let i = 0;
    const __len = hex.length;
    while (i < __len) {
      const c = hex.charCodeAt(i );
      let digit = 0;
      if ( (c >= 48) && (c <= 57) ) {
        digit = c - 48;
      }
      if ( (c >= 97) && (c <= 102) ) {
        digit = c - 87;
      }
      if ( (c >= 65) && (c <= 70) ) {
        digit = c - 55;
      }
      result = (result * 16) + digit;
      i = i + 1;
    };
    return result;
  };
  parseIntSafe (s) {
    let result = 0;
    let i = 0;
    const __len = s.length;
    let negative = false;
    if ( __len == 0 ) {
      return 0;
    }
    const first = s.charCodeAt(0 );
    if ( first == 45 ) {
      negative = true;
      i = 1;
    }
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( (c >= 48) && (c <= 57) ) {
        result = (result * 10) + (c - 48);
      }
      i = i + 1;
    };
    if ( negative ) {
      return 0 - result;
    }
    return result;
  };
  parseDoubleSafe (s) {
    let result = 0.0;
    let decimal = 0.1;
    let inDecimal = false;
    let negative = false;
    let i = 0;
    const __len = s.length;
    if ( __len == 0 ) {
      return 0.0;
    }
    const first = s.charCodeAt(0 );
    if ( first == 45 ) {
      negative = true;
      i = 1;
    }
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( c == 46 ) {
        inDecimal = true;
      } else {
        if ( (c >= 48) && (c <= 57) ) {
          const digit = (c - 48);
          if ( inDecimal ) {
            result = result + (digit * decimal);
            decimal = decimal * 0.1;
          } else {
            result = (result * 10.0) + digit;
          }
        }
      }
      i = i + 1;
    };
    if ( negative ) {
      return 0.0 - result;
    }
    return result;
  };
}
class RasterBlur  {
  constructor() {
  }
  blurHorizontal (src, radius) {
    const dst = new RasterBuffer();
    dst.create(src.width, src.height);
    if ( radius < 1 ) {
      let i = 0;
      const size = (src.width * src.height) * 4;
      while (i < size) {
        dst.pixels._view.setUint8(i, src.pixels._view.getUint8(i));
        i = i + 1;
      };
      return dst;
    }
    const diameter = (radius * 2) + 1;
    const divisor = diameter;
    let y = 0;
    while (y < src.height) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let i_1 = 0 - radius;
      while (i_1 <= radius) {
        let sampleX = i_1;
        if ( sampleX < 0 ) {
          sampleX = 0;
        }
        if ( sampleX >= src.width ) {
          sampleX = src.width - 1;
        }
        const p = src.getPixel(sampleX, y);
        sumR = sumR + p.r;
        sumG = sumG + p.g;
        sumB = sumB + p.b;
        sumA = sumA + p.a;
        i_1 = i_1 + 1;
      };
      let x = 0;
      while (x < src.width) {
        const outR = Math.floor( ((sumR) / divisor));
        const outG = Math.floor( ((sumG) / divisor));
        const outB = Math.floor( ((sumB) / divisor));
        const outA = Math.floor( ((sumA) / divisor));
        dst.setPixel(x, y, outR, outG, outB, outA);
        let leftX = x - radius;
        let rightX = (x + radius) + 1;
        if ( leftX < 0 ) {
          leftX = 0;
        }
        if ( rightX >= src.width ) {
          rightX = src.width - 1;
        }
        const leftP = src.getPixel(leftX, y);
        sumR = sumR - leftP.r;
        sumG = sumG - leftP.g;
        sumB = sumB - leftP.b;
        sumA = sumA - leftP.a;
        const rightP = src.getPixel(rightX, y);
        sumR = sumR + rightP.r;
        sumG = sumG + rightP.g;
        sumB = sumB + rightP.b;
        sumA = sumA + rightP.a;
        x = x + 1;
      };
      y = y + 1;
    };
    return dst;
  };
  blurVertical (src, radius) {
    const dst = new RasterBuffer();
    dst.create(src.width, src.height);
    if ( radius < 1 ) {
      let i = 0;
      const size = (src.width * src.height) * 4;
      while (i < size) {
        dst.pixels._view.setUint8(i, src.pixels._view.getUint8(i));
        i = i + 1;
      };
      return dst;
    }
    const diameter = (radius * 2) + 1;
    const divisor = diameter;
    let x = 0;
    while (x < src.width) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let i_1 = 0 - radius;
      while (i_1 <= radius) {
        let sampleY = i_1;
        if ( sampleY < 0 ) {
          sampleY = 0;
        }
        if ( sampleY >= src.height ) {
          sampleY = src.height - 1;
        }
        const p = src.getPixel(x, sampleY);
        sumR = sumR + p.r;
        sumG = sumG + p.g;
        sumB = sumB + p.b;
        sumA = sumA + p.a;
        i_1 = i_1 + 1;
      };
      let y = 0;
      while (y < src.height) {
        const outR = Math.floor( ((sumR) / divisor));
        const outG = Math.floor( ((sumG) / divisor));
        const outB = Math.floor( ((sumB) / divisor));
        const outA = Math.floor( ((sumA) / divisor));
        dst.setPixel(x, y, outR, outG, outB, outA);
        let topY = y - radius;
        let bottomY = (y + radius) + 1;
        if ( topY < 0 ) {
          topY = 0;
        }
        if ( bottomY >= src.height ) {
          bottomY = src.height - 1;
        }
        const topP = src.getPixel(x, topY);
        sumR = sumR - topP.r;
        sumG = sumG - topP.g;
        sumB = sumB - topP.b;
        sumA = sumA - topP.a;
        const bottomP = src.getPixel(x, bottomY);
        sumR = sumR + bottomP.r;
        sumG = sumG + bottomP.g;
        sumB = sumB + bottomP.b;
        sumA = sumA + bottomP.a;
        y = y + 1;
      };
      x = x + 1;
    };
    return dst;
  };
  boxBlur (src, radius) {
    const temp = this.blurHorizontal(src, radius);
    return this.blurVertical(temp, radius);
  };
  boxBlurMultiPass (src, radius, passes) {
    let result = src;
    let i = 0;
    while (i < passes) {
      result = this.boxBlur(result, radius);
      i = i + 1;
    };
    return result;
  };
  gaussianApproxBlur (src, radius) {
    let passRadius = Math.floor( ((radius) / 3.0));
    if ( passRadius < 1 ) {
      passRadius = 1;
    }
    return this.boxBlurMultiPass(src, passRadius, 3);
  };
}
class RasterShadow  {
  constructor() {
    this.blur = new RasterBlur();
  }
  createShadow (src, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const shadowShape = new RasterBuffer();
    shadowShape.create(src.width, src.height);
    let y = 0;
    while (y < src.height) {
      let x = 0;
      while (x < src.width) {
        const srcAlpha = src.getA(x, y);
        if ( srcAlpha > 0 ) {
          const outAlpha = Math.floor( (((srcAlpha * shadowA)) / 255.0));
          shadowShape.setPixel(x, y, shadowR, shadowG, shadowB, outAlpha);
        }
        x = x + 1;
      };
      y = y + 1;
    };
    if ( blurRadius > 0 ) {
      return this.blur.gaussianApproxBlur(shadowShape, blurRadius);
    }
    return shadowShape;
  };
  createDropShadow (src, offsetX, offsetY, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const spread = blurRadius * 2;
    let absOffsetX = offsetX;
    if ( absOffsetX < 0 ) {
      absOffsetX = 0 - absOffsetX;
    }
    let absOffsetY = offsetY;
    if ( absOffsetY < 0 ) {
      absOffsetY = 0 - absOffsetY;
    }
    const newWidth = (src.width + spread) + absOffsetX;
    const newHeight = (src.height + spread) + absOffsetY;
    let srcX = spread;
    let srcY = spread;
    if ( offsetX < 0 ) {
      srcX = srcX - offsetX;
    }
    if ( offsetY < 0 ) {
      srcY = srcY - offsetY;
    }
    const shadowShape = new RasterBuffer();
    shadowShape.create(newWidth, newHeight);
    const shadowPosX = srcX + offsetX;
    const shadowPosY = srcY + offsetY;
    let y = 0;
    while (y < src.height) {
      let x = 0;
      while (x < src.width) {
        const srcAlpha = src.getA(x, y);
        if ( srcAlpha > 0 ) {
          const outAlpha = Math.floor( (((srcAlpha * shadowA)) / 255.0));
          shadowShape.setPixel(shadowPosX + x, shadowPosY + y, shadowR, shadowG, shadowB, outAlpha);
        }
        x = x + 1;
      };
      y = y + 1;
    };
    if ( blurRadius > 0 ) {
      return this.blur.gaussianApproxBlur(shadowShape, blurRadius);
    }
    return shadowShape;
  };
  renderRectShadow (width, height, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const rect = new RasterBuffer();
    const spreadW = width + (blurRadius * 4);
    const spreadH = height + (blurRadius * 4);
    rect.create(spreadW, spreadH);
    const offsetX = blurRadius * 2;
    const offsetY = blurRadius * 2;
    rect.fillRect(offsetX, offsetY, width, height, 255, 255, 255, 255);
    return this.createShadow(rect, blurRadius, shadowR, shadowG, shadowB, shadowA);
  };
  renderRoundedRectShadow (width, height, radius, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const spreadW = width + (blurRadius * 4);
    const spreadH = height + (blurRadius * 4);
    const rect = new RasterBuffer();
    rect.create(spreadW, spreadH);
    const offsetX = blurRadius * 2;
    const offsetY = blurRadius * 2;
    let maxR = Math.floor( ((width) / 2.0));
    const halfH = Math.floor( ((height) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    rect.fillRect(offsetX + radius, offsetY, width - (radius * 2), height, 255, 255, 255, 255);
    rect.fillRect(offsetX, offsetY + radius, width, height - (radius * 2), 255, 255, 255, 255);
    this.fillCornerCircle(rect, offsetX + radius, offsetY + radius, radius);
    this.fillCornerCircle(rect, ((offsetX + width) - radius) - 1, offsetY + radius, radius);
    this.fillCornerCircle(rect, offsetX + radius, ((offsetY + height) - radius) - 1, radius);
    this.fillCornerCircle(rect, ((offsetX + width) - radius) - 1, ((offsetY + height) - radius) - 1, radius);
    return this.createShadow(rect, blurRadius, shadowR, shadowG, shadowB, shadowA);
  };
  fillCornerCircle (buf, cx, cy, radius) {
    const r2 = radius * radius;
    let y = 0 - radius;
    while (y <= radius) {
      let x = 0 - radius;
      while (x <= radius) {
        const d2 = (x * x) + (y * y);
        if ( d2 <= r2 ) {
          buf.setPixel(cx + x, cy + y, 255, 255, 255, 255);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
}
class FDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagOrder = new Int32Array(64);
    this.cosTable[0] = 1024;
    this.cosTable[1] = 1004;
    this.cosTable[2] = 946;
    this.cosTable[3] = 851;
    this.cosTable[4] = 724;
    this.cosTable[5] = 569;
    this.cosTable[6] = 392;
    this.cosTable[7] = 200;
    this.cosTable[8] = 1024;
    this.cosTable[9] = 851;
    this.cosTable[10] = 392;
    this.cosTable[11] = -200;
    this.cosTable[12] = -724;
    this.cosTable[13] = -1004;
    this.cosTable[14] = -946;
    this.cosTable[15] = -569;
    this.cosTable[16] = 1024;
    this.cosTable[17] = 569;
    this.cosTable[18] = -392;
    this.cosTable[19] = -1004;
    this.cosTable[20] = -724;
    this.cosTable[21] = 200;
    this.cosTable[22] = 946;
    this.cosTable[23] = 851;
    this.cosTable[24] = 1024;
    this.cosTable[25] = 200;
    this.cosTable[26] = -946;
    this.cosTable[27] = -569;
    this.cosTable[28] = 724;
    this.cosTable[29] = 851;
    this.cosTable[30] = -392;
    this.cosTable[31] = -1004;
    this.cosTable[32] = 1024;
    this.cosTable[33] = -200;
    this.cosTable[34] = -946;
    this.cosTable[35] = 569;
    this.cosTable[36] = 724;
    this.cosTable[37] = -851;
    this.cosTable[38] = -392;
    this.cosTable[39] = 1004;
    this.cosTable[40] = 1024;
    this.cosTable[41] = -569;
    this.cosTable[42] = -392;
    this.cosTable[43] = 1004;
    this.cosTable[44] = -724;
    this.cosTable[45] = -200;
    this.cosTable[46] = 946;
    this.cosTable[47] = -851;
    this.cosTable[48] = 1024;
    this.cosTable[49] = -851;
    this.cosTable[50] = 392;
    this.cosTable[51] = 200;
    this.cosTable[52] = -724;
    this.cosTable[53] = 1004;
    this.cosTable[54] = -946;
    this.cosTable[55] = 569;
    this.cosTable[56] = 1024;
    this.cosTable[57] = -1004;
    this.cosTable[58] = 946;
    this.cosTable[59] = -851;
    this.cosTable[60] = 724;
    this.cosTable[61] = -569;
    this.cosTable[62] = 392;
    this.cosTable[63] = -200;
    this.zigzagOrder[0] = 0;
    this.zigzagOrder[1] = 1;
    this.zigzagOrder[2] = 8;
    this.zigzagOrder[3] = 16;
    this.zigzagOrder[4] = 9;
    this.zigzagOrder[5] = 2;
    this.zigzagOrder[6] = 3;
    this.zigzagOrder[7] = 10;
    this.zigzagOrder[8] = 17;
    this.zigzagOrder[9] = 24;
    this.zigzagOrder[10] = 32;
    this.zigzagOrder[11] = 25;
    this.zigzagOrder[12] = 18;
    this.zigzagOrder[13] = 11;
    this.zigzagOrder[14] = 4;
    this.zigzagOrder[15] = 5;
    this.zigzagOrder[16] = 12;
    this.zigzagOrder[17] = 19;
    this.zigzagOrder[18] = 26;
    this.zigzagOrder[19] = 33;
    this.zigzagOrder[20] = 40;
    this.zigzagOrder[21] = 48;
    this.zigzagOrder[22] = 41;
    this.zigzagOrder[23] = 34;
    this.zigzagOrder[24] = 27;
    this.zigzagOrder[25] = 20;
    this.zigzagOrder[26] = 13;
    this.zigzagOrder[27] = 6;
    this.zigzagOrder[28] = 7;
    this.zigzagOrder[29] = 14;
    this.zigzagOrder[30] = 21;
    this.zigzagOrder[31] = 28;
    this.zigzagOrder[32] = 35;
    this.zigzagOrder[33] = 42;
    this.zigzagOrder[34] = 49;
    this.zigzagOrder[35] = 56;
    this.zigzagOrder[36] = 57;
    this.zigzagOrder[37] = 50;
    this.zigzagOrder[38] = 43;
    this.zigzagOrder[39] = 36;
    this.zigzagOrder[40] = 29;
    this.zigzagOrder[41] = 22;
    this.zigzagOrder[42] = 15;
    this.zigzagOrder[43] = 23;
    this.zigzagOrder[44] = 30;
    this.zigzagOrder[45] = 37;
    this.zigzagOrder[46] = 44;
    this.zigzagOrder[47] = 51;
    this.zigzagOrder[48] = 58;
    this.zigzagOrder[49] = 59;
    this.zigzagOrder[50] = 52;
    this.zigzagOrder[51] = 45;
    this.zigzagOrder[52] = 38;
    this.zigzagOrder[53] = 31;
    this.zigzagOrder[54] = 39;
    this.zigzagOrder[55] = 46;
    this.zigzagOrder[56] = 53;
    this.zigzagOrder[57] = 60;
    this.zigzagOrder[58] = 61;
    this.zigzagOrder[59] = 54;
    this.zigzagOrder[60] = 47;
    this.zigzagOrder[61] = 55;
    this.zigzagOrder[62] = 62;
    this.zigzagOrder[63] = 63;
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
  transform (pixels) {
    const shifted = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      shifted[i] = (pixels[i]) - 128;
      i = i + 1;
    };
    const temp = new Int32Array(64);
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.dct1d(shifted, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    const coeffs = new Int32Array(64);
    let col = 0;
    while (col < 8) {
      this.dct1d(temp, col, 8, coeffs, col, 8);
      col = col + 1;
    };
    return coeffs;
  };
  zigzag (block) {
    const zigzagOut = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagOrder[i];
      zigzagOut[i] = block[pos];
      i = i + 1;
    };
    return zigzagOut;
  };
}
class BitWriter  {
  constructor() {
    this.buffer = new GrowableBuffer();
    this.bitBuffer = 0;
    this.bitCount = 0;
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
    let i = 0;
    while (i < 256) {
      this.dcYCodes.push(0);
      this.dcYLengths.push(0);
      this.acYCodes.push(0);
      this.acYLengths.push(0);
      this.dcCCodes.push(0);
      this.dcCLengths.push(0);
      this.acCCodes.push(0);
      this.acCLengths.push(0);
      i = i + 1;
    };
    this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
    this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
    this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
    this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
  };
  buildHuffmanCodes (bits, values, codes, lengths) {
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
    const quantized = new Int32Array(64);
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
      quantized[i] = qVal;
      i = i + 1;
    };
    const zigzagged = this.fdct.zigzag(quantized);
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
  extractBlock (img, blockX, blockY, channel) {
    const output = new Int32Array(64);
    let idx = 0;
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
          output[idx] = y;
        }
        if ( channel == 1 ) {
          output[idx] = cb;
        }
        if ( channel == 2 ) {
          output[idx] = cr;
        }
        idx = idx + 1;
        px = px + 1;
      };
      py = py + 1;
    };
    return output;
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
  encodeToBuffer (img) {
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = Math.floor( ((yDC - ((yQ >> 1))) / yQ));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = Math.floor( ((cbDC - ((cbQ >> 1))) / cbQ));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
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
    return finalBuf;
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
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = Math.floor( ((yDC - ((yQ >> 1))) / yQ));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = Math.floor( ((cbDC - ((cbQ >> 1))) / cbQ));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
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
class EVGRasterRenderer  {
  constructor() {
    this.buffer = new RasterBuffer();
    this.compositor = new RasterCompositor();
    this.primitives = new RasterPrimitives();
    this.gradient = new RasterGradient();
    this.shadow = new RasterShadow();
  }
  init (width, height) {
    this.buffer.create(width, height);
  };
  clear (r, g, b, a) {
    this.buffer.fill(r, g, b, a);
  };
  clearWhite () {
    this.buffer.fill(255, 255, 255, 255);
  };
  clearTransparent () {
    this.buffer.fill(0, 0, 0, 0);
  };
  getBuffer () {
    return this.buffer;
  };
  renderRectWithShadow (x, y, w, h, bgR, bgG, bgB, bgA, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const shadowBuf = this.shadow.renderRectShadow(w, h, blurRadius, shadowR, shadowG, shadowB, shadowA);
    const spread = blurRadius * 2;
    this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    this.primitives.fillRect(this.buffer, x, y, w, h, bgR, bgG, bgB, bgA);
  };
  renderRoundedRectWithShadow (x, y, w, h, radius, bgR, bgG, bgB, bgA, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const shadowBuf = this.shadow.renderRoundedRectShadow(w, h, radius, blurRadius, shadowR, shadowG, shadowB, shadowA);
    const spread = blurRadius * 2;
    this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    this.primitives.fillRoundedRect(this.buffer, x, y, w, h, radius, bgR, bgG, bgB, bgA);
  };
  renderShadowOnly (x, y, w, h, radius, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const spread = blurRadius * 2;
    if ( radius > 0 ) {
      const shadowBuf = this.shadow.renderRoundedRectShadow(w, h, radius, blurRadius, shadowR, shadowG, shadowB, shadowA);
      this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    } else {
      const shadowBuf2 = this.shadow.renderRectShadow(w, h, blurRadius, shadowR, shadowG, shadowB, shadowA);
      this.compositor.compositeOver(this.buffer, shadowBuf2, (x + offsetX) - spread, (y + offsetY) - spread);
    }
  };
  fillRect (x, y, w, h, r, g, b, a) {
    this.primitives.fillRect(this.buffer, x, y, w, h, r, g, b, a);
  };
  fillRoundedRect (x, y, w, h, radius, r, g, b, a) {
    this.primitives.fillRoundedRect(this.buffer, x, y, w, h, radius, r, g, b, a);
  };
  fillCircle (cx, cy, radius, r, g, b, a) {
    this.primitives.fillCircle(this.buffer, cx, cy, radius, r, g, b, a);
  };
  drawRect (x, y, w, h, r, g, b, a) {
    this.primitives.drawRect(this.buffer, x, y, w, h, r, g, b, a);
  };
  drawRoundedRect (x, y, w, h, radius, r, g, b, a) {
    this.primitives.drawRoundedRect(this.buffer, x, y, w, h, radius, r, g, b, a);
  };
  renderLinearGradientRect (x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorLinear(gradBuf, 0, 0, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderLinearGradientRoundedRect (x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorLinear(gradBuf, 0, 0, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    this.maskRoundedRect(gradBuf, w, h, radius);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderRadialGradientRect (x, y, w, h, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorRadial(gradBuf, 0, 0, w, h, r1, g1, b1, r2, g2, b2);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderRadialGradientRoundedRect (x, y, w, h, radius, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorRadial(gradBuf, 0, 0, w, h, r1, g1, b1, r2, g2, b2);
    this.maskRoundedRect(gradBuf, w, h, radius);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderLinearGradientWithShadow (x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    this.renderShadowOnly(x, y, w, h, radius, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY);
    if ( radius > 0 ) {
      this.renderLinearGradientRoundedRect(x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2);
    } else {
      this.renderLinearGradientRect(x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    }
  };
  maskRoundedRect (buf, w, h, radius) {
    const mask = new RasterBuffer();
    mask.create(w, h);
    this.primitives.fillRoundedRect(mask, 0, 0, w, h, radius, 255, 255, 255, 255);
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const maskA = mask.getA(x, y);
        if ( maskA < 255 ) {
          const p = buf.getPixel(x, y);
          const newA = Math.floor( (((p.a * maskA)) / 255.0));
          buf.setPixel(x, y, p.r, p.g, p.b, newA);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  toImageBuffer () {
    return this.buffer.toImageBuffer();
  };
  toJPEG (quality) {
    const img = this.buffer.toImageBuffer();
    const encoder = new JPEGEncoder();
    encoder.setQuality(quality);
    return encoder.encodeToBuffer(img);
  };
  saveAsJPEG (dirPath, fileName, quality) {
    const img = this.buffer.toImageBuffer();
    const encoder = new JPEGEncoder();
    encoder.setQuality(quality);
    encoder.encode(img, dirPath, fileName);
  };
  getRawBuffer () {
    return this.buffer.getRawBuffer();
  };
  getWidth () {
    return this.buffer.width;
  };
  getHeight () {
    return this.buffer.height;
  };
  savePPM (dirPath, fileName) {
    const w = this.buffer.width;
    const h = this.buffer.height;
    const buf = new GrowableBuffer();
    buf.writeString("P6\n");
    buf.writeString(((((w.toString())) + " ") + ((h.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const p = this.buffer.getPixel(x, y);
        buf.writeByte(p.r);
        buf.writeByte(p.g);
        buf.writeByte(p.b);
        x = x + 1;
      };
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
}
class RasterTest  {
  constructor() {
  }
  run () {
    console.log("EVG Raster Renderer Test");
    console.log("========================");
    console.log("");
    const renderer = new EVGRasterRenderer();
    renderer.init(400, 300);
    (renderer).clear(245, 245, 245, 255);
    console.log("Rendering test shapes...");
    console.log("  - Rectangle with shadow");
    renderer.renderRectWithShadow(30, 30, 100, 60, 255, 255, 255, 255, 0, 0, 0, 80, 10, 4, 4);
    console.log("  - Rounded rectangle with shadow");
    renderer.renderRoundedRectWithShadow(160, 30, 100, 60, 12, 52, 152, 219, 255, 52, 152, 219, 100, 15, 0, 6);
    console.log("  - Dark rounded rectangle with shadow");
    renderer.renderRoundedRectWithShadow(290, 30, 80, 60, 8, 44, 62, 80, 255, 0, 0, 0, 100, 8, 3, 4);
    console.log("  - Linear gradient (horizontal)");
    renderer.renderLinearGradientRect(30, 120, 100, 50, 90.0, 231, 76, 60, 241, 196, 15);
    console.log("  - Linear gradient (vertical)");
    renderer.renderLinearGradientRect(160, 120, 100, 50, 180.0, 46, 204, 113, 39, 174, 96);
    console.log("  - Radial gradient");
    renderer.renderRadialGradientRect(290, 120, 80, 50, 155, 89, 182, 44, 62, 80);
    console.log("  - Gradient with shadow (combined)");
    renderer.renderLinearGradientWithShadow(30, 200, 140, 60, 10, 135.0, 102, 126, 234, 118, 75, 162, 102, 126, 234, 100, 12, 0, 8);
    console.log("  - Simple filled rectangle");
    renderer.fillRect(200, 200, 60, 30, 230, 126, 34, 255);
    console.log("  - Simple filled circle");
    renderer.fillCircle(330, 230, 25, 241, 196, 15, 255);
    console.log("");
    console.log("Saving to JPEG...");
    renderer.saveAsJPEG("./gallery/pdf_writer/output/", "raster_test.jpg", 90);
    console.log("Done! Output: ./gallery/pdf_writer/output/raster_test.jpg");
    console.log("");
    console.log("Image size: 400 x 300");
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const test = new RasterTest();
  test.run();
}
__js_main();
