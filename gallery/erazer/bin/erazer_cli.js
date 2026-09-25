#!/usr/bin/env node
class ErazerOptions  {
  constructor() {
    this.colorTol = 20;
    this.surfaceTol = 8;
    this.surfaceStep = 4;
    this.surfaceDrift = 96;
    this.fragArea = 400;
    this.minArea = 5;
    this.minGlyphH = 6;
    this.maxGlyphH = 42;
    this.ocr = true;
    this.vectorizeIcons = true;
    this.iconMin = 10;
    this.iconMax = 56;
    this.scale = 0;
    this.wordText = [];
    this.wordX = [];
    this.wordY = [];
    this.wordW = [];
    this.wordH = [];
    this.wordConf = [];
    this.wordLine = [];
    this.wordMinConf = 55;
    this.skipFullBleed = true;     /* note: unused */
    let t = [];
    this.wordText = t;
    let a = [];
    this.wordX = a;
    let b = [];
    this.wordY = b;
    let c = [];
    this.wordW = c;
    let d = [];
    this.wordH = d;
    let e = [];
    this.wordConf = e;
    let f = [];
    this.wordLine = f;
  }
  addWord (text, x, y, w, h, conf) {
    this.addLineWord(text, x, y, w, h, conf, 0 - 1);
  };
  addLineWord (text, x, y, w, h, conf, line) {
    this.wordLine.push(line);
    this.wordText.push(text);
    this.wordX.push(x);
    this.wordY.push(y);
    this.wordW.push(w);
    this.wordH.push(h);
    this.wordConf.push(conf);
  };
  wordCount () {
    return this.wordText.length;
  };
  addTesseractTsv (tsv) {
    const lines = tsv.split("\n");
    let added = 0;
    let i = 0;
    while (i < lines.length) {
      const cols = lines[i].split("\t");
      if ( cols.length >= 12 ) {
        if ( cols[0] == "5" ) {
          let text = cols[11];
          const cr = text.indexOf("\r");
          if ( cr >= 0 ) {
            text = text.substring(0, cr );
          }
          if ( text.length > 0 ) {
            const lineId = (ErazerOptions.intOf(cols[2]) * 10000 + ErazerOptions.intOf(cols[3]) * 100) + ErazerOptions.intOf(cols[4]);
            this.addLineWord(
              text,
              ErazerOptions.intOf(cols[6]),
              ErazerOptions.intOf(cols[7]),
              ErazerOptions.intOf(cols[8]),
              ErazerOptions.intOf(cols[9]),
              ErazerOptions.intOf(cols[10]),
              lineId
            );
            added = added + 1;
          }
        }
      }
      i = i + 1;
    };
    return added;
  };
}
ErazerOptions.intOf = function(s) {
  let v = 0;
  let i = 0;
  let go = true;
  while (go && i < s.length) {
    const d = "0123456789".indexOf(s.substring(i, i + 1 ));
    if ( d < 0 ) {
      go = false;
    } else {
      v = v * 10 + d;
    }
    i = i + 1;
  };
  return v;
};
ErazerOptions.defaults = function() {
  const o = new ErazerOptions();
  return o;
};
class ErazerRaw  {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.area = 0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.radius = 0;
    this.kind = "box";
    this.used = false;
    this.parts = 1;
    this.surface = false;
    this.gradDir = -1;
    this.gFromR = 0;
    this.gFromG = 0;
    this.gFromB = 0;
    this.gToR = 0;
    this.gToG = 0;
    this.gToB = 0;
  }
  fillRatio () {
    const box = this.w * this.h;
    if ( box <= 0 ) {
      return 0.0;
    }
    return this.area / box;
  };
  cx () {
    return this.x + ((this.w / 2) | 0);
  };
  cy () {
    return this.y + ((this.h / 2) | 0);
  };
  maxX () {
    return this.x + this.w;
  };
  maxY () {
    return this.y + this.h;
  };
  nearSquare () {
    let d = this.w - this.h;
    if ( d < 0 ) {
      d = 0 - d;
    }
    let m = this.w;
    if ( this.h > m ) {
      m = this.h;
    }
    if ( m < 8 ) {
      return false;
    }
    return d <= 4;
  };
}
class ErazerNode  {
  constructor() {
    this.role = "panel";
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.r = 255;
    this.g = 255;
    this.b = 255;
    this.radius = 0;
    this.borderR = 0;
    this.borderG = 0;
    this.borderB = 0;
    this.borderW = 0;
    this.text = "";
    this.align = "";
    this.ocrText = false;
    this.inkX0 = 0;
    this.inkX1 = 0;
    this.fontSize = 0;
    this.textR = 0;
    this.textG = 0;
    this.textB = 0;
    this.iconSvg = "";
    this.iconPaths = [];
    this.iconFills = [];
    this.iconVw = 0;
    this.iconVh = 0;
    this.confidence = 0.5;
    this.fill = 1.0;
    this.gradDir = -1;
    this.gFromR = 0;
    this.gFromG = 0;
    this.gFromB = 0;
    this.gToR = 0;
    this.gToG = 0;
    this.gToB = 0;
    this.boxId = 0;
    this.kids = [];
    this.words = [];
    let k = [];
    this.kids = k;
    let wd = [];
    this.words = wd;
    let p = [];
    this.iconPaths = p;
    let f_1 = [];
    this.iconFills = f_1;
  }
  addKid (kid) {
    this.kids.push(kid);
  };
  maxX () {
    return this.x + this.w;
  };
  maxY () {
    return this.y + this.h;
  };
  cx () {
    return this.x + ((this.w / 2) | 0);
  };
  cy () {
    return this.y + ((this.h / 2) | 0);
  };
  coversBox (ox, oy, ow, oh) {
    if ( ox < this.x ) {
      return false;
    }
    if ( oy < this.y ) {
      return false;
    }
    if ( ox + ow > this.x + this.w ) {
      return false;
    }
    if ( oy + oh > this.y + this.h ) {
      return false;
    }
    return true;
  };
  roleCount (want) {
    let n = 0;
    if ( this.role == want ) {
      n = 1;
    }
    let i = 0;
    while (i < this.kids.length) {
      const k = this.kids[i];
      n = n + k.roleCount(want);
      i = i + 1;
    };
    return n;
  };
  findRole (want) {
    if ( this.role == want ) {
      const selfHit = this;
      return selfHit;
    }
    let i = 0;
    while (i < this.kids.length) {
      const k = this.kids[i];
      const hit = k.findRole(want);
      if ( typeof(hit) != "undefined" ) {
        return hit;
      }
      i = i + 1;
    };
    let miss;
    return miss;
  };
  findText (want) {
    if ( this.text == want ) {
      const selfHit = this;
      return selfHit;
    }
    let i = 0;
    while (i < this.kids.length) {
      const k = this.kids[i];
      const hit = k.findText(want);
      if ( typeof(hit) != "undefined" ) {
        return hit;
      }
      i = i + 1;
    };
    let miss;
    return miss;
  };
  collectRoles (out) {
    out.push(this.role);
    let i = 0;
    while (i < this.kids.length) {
      const k = this.kids[i];
      k.collectRoles(out);
      i = i + 1;
    };
  };
}
ErazerNode.of = function(role, x, y, w, h, r, g, b) {
  const n = new ErazerNode();
  n.role = role;
  n.x = x;
  n.y = y;
  n.w = w;
  n.h = h;
  n.r = r;
  n.g = g;
  n.b = b;
  return n;
};
class ErazerDoc  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.root = undefined;
    this.json = "";
    this.overlaySvg = "";
    this.outline = "";
    this.layoutJson = "";
    this.root = ErazerNode.of("page", 0, 0, 1, 1, 255, 255, 255);
  }
}
class BufferChunk  {
  constructor(size) {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.used = 0;
    this.capacity = 0;
    this.next = undefined;
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
      const b = src._view.getUint8(srcOffset + i);
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
    const low = value - high * 256;
    this.writeByte(high);
    this.writeByte(low);
  };
  writeInt32BE (value) {
    const b1D = value / 16777216;
    const b1 = Math.floor( b1D);
    const rem1 = value - b1 * 16777216;
    const b2D = rem1 / 65536;
    const b2 = Math.floor( b2D);
    const rem2 = rem1 - b2 * 65536;
    const b3D = rem2 / 256;
    const b3 = Math.floor( b3D);
    const b4 = rem2 - b3 * 256;
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
    let result = (function(){ var b = new ArrayBuffer(allocSize); b._view = new DataView(b); return b; })();
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
        result = result + String.fromCharCode(b);
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
    return (((this.r * 77 + this.g * 150) + this.b * 29) >> 8);
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
  initClear (w, h) {
    this.width = w;
    this.height = h;
    this.pixels = (function(){ var b = new ArrayBuffer((w * h) * 4); b._view = new DataView(b); return b; })();
  };
  fillTransparent () {
    const size = (this.width * this.height) * 4;
    (function(
      b,
      v,
      s,
      e
    ){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(this.pixels,0,0,size);
  };
  getPixelOffset (x, y) {
    return (y * this.width + x) * 4;
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
      c.g = this.pixels._view.getUint8(off + 1);
      c.b = this.pixels._view.getUint8(off + 2);
      c.a = this.pixels._view.getUint8(off + 3);
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
  setPixelRGBA (x, y, r, g, b, a) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      this.pixels._view.setUint8(off + 3, a);
    }
  };
  getRawBuffer () {
    return this.pixels;
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
      const g = this.pixels._view.getUint8(off + 1);
      const b = this.pixels._view.getUint8(off + 2);
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
      const g = this.pixels._view.getUint8(off + 1);
      const b = this.pixels._view.getUint8(off + 2);
      const gray = (((r * 77 + g * 150) + b * 29) >> 8);
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
      let g = this.pixels._view.getUint8(off + 1);
      let b = this.pixels._view.getUint8(off + 2);
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
      const g = this.pixels._view.getUint8(off + 1);
      const b = this.pixels._view.getUint8(off + 2);
      const gray = (((r * 77 + g * 150) + b * 29) >> 8);
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
      const g = this.pixels._view.getUint8(off + 1);
      const b = this.pixels._view.getUint8(off + 2);
      let newR = (((r * 101 + g * 197) + b * 48) >> 8);
      let newG = (((r * 89 + g * 175) + b * 43) >> 8);
      let newB = (((r * 70 + g * 137) + b * 33) >> 8);
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
        const g1 = this.pixels._view.getUint8(off1 + 1);
        const b1 = this.pixels._view.getUint8(off1 + 2);
        const a1 = this.pixels._view.getUint8(off1 + 3);
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8(off2 + 1);
        const b2 = this.pixels._view.getUint8(off2 + 2);
        const a2 = this.pixels._view.getUint8(off2 + 3);
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
        const g1 = this.pixels._view.getUint8(off1 + 1);
        const b1 = this.pixels._view.getUint8(off1 + 2);
        const a1 = this.pixels._view.getUint8(off1 + 3);
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8(off2 + 1);
        const b2 = this.pixels._view.getUint8(off2 + 2);
        const a2 = this.pixels._view.getUint8(off2 + 3);
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
      if ( x == x2 && y == y2 ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > 0 - dy ) {
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
    const scaleX = this.width / newW;
    const scaleY = this.height / newH;
    let destY = 0;
    while (destY < newH) {
      const srcYf = destY * scaleY;
      const srcY0 = Math.floor( srcYf);
      let srcY1 = srcY0 + 1;
      if ( srcY1 >= this.height ) {
        srcY1 = this.height - 1;
      }
      const fy = srcYf - srcY0;
      let destX = 0;
      while (destX < newW) {
        const srcXf = destX * scaleX;
        const srcX0 = Math.floor( srcXf);
        let srcX1 = srcX0 + 1;
        if ( srcX1 >= this.width ) {
          srcX1 = this.width - 1;
        }
        const fx = srcXf - srcX0;
        const off00 = (srcY0 * this.width + srcX0) * 4;
        const off01 = (srcY0 * this.width + srcX1) * 4;
        const off10 = (srcY1 * this.width + srcX0) * 4;
        const off11 = (srcY1 * this.width + srcX1) * 4;
        const r = this.bilinear(
          this.pixels._view.getUint8(off00),
          this.pixels._view.getUint8(off01),
          this.pixels._view.getUint8(off10),
          this.pixels._view.getUint8(off11),
          fx,
          fy
        );
        const g = this.bilinear(
          this.pixels._view.getUint8(off00 + 1),
          this.pixels._view.getUint8(off01 + 1),
          this.pixels._view.getUint8(off10 + 1),
          this.pixels._view.getUint8(off11 + 1),
          fx,
          fy
        );
        const b = this.bilinear(
          this.pixels._view.getUint8(off00 + 2),
          this.pixels._view.getUint8(off01 + 2),
          this.pixels._view.getUint8(off10 + 2),
          this.pixels._view.getUint8(off11 + 2),
          fx,
          fy
        );
        const a = this.bilinear(
          this.pixels._view.getUint8(off00 + 3),
          this.pixels._view.getUint8(off01 + 3),
          this.pixels._view.getUint8(off10 + 3),
          this.pixels._view.getUint8(off11 + 3),
          fx,
          fy
        );
        const destOff = (destY * newW + destX) * 4;
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
    const top = v00 * (1.0 - fx) + v01 * fx;
    const bottom = v10 * (1.0 - fx) + v11 * fx;
    const result = top * (1.0 - fy) + bottom * fy;
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
        const srcOff = (y * this.width + x) * 4;
        const destOff = (newY * this.height + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
        const srcOff = (y * this.width + x) * 4;
        const destOff = (newY * this.width + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
        const srcOff = (y * this.width + x) * 4;
        const destOff = (newY * this.height + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
        const srcOff = (y * this.width + x) * 4;
        const destOff = (x * this.height + y) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
        const srcOff = (y * this.width + x) * 4;
        const destOff = (newY * this.height + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
          const srcOff = (y * this.width + x) * 4;
          const destOff = (y * this.width + ((this.width - 1) - x)) * 4;
          result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
          result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8(srcOff + 1));
          result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8(srcOff + 2));
          result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8(srcOff + 3));
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
          const srcOff_1 = (y_1 * this.width + x_1) * 4;
          const destOff_1 = (((this.height - 1) - y_1) * this.width + x_1) * 4;
          result_1.pixels._view.setUint8(destOff_1, this.pixels._view.getUint8(srcOff_1));
          result_1.pixels._view.setUint8(destOff_1 + 1, this.pixels._view.getUint8(srcOff_1 + 1));
          result_1.pixels._view.setUint8(destOff_1 + 2, this.pixels._view.getUint8(srcOff_1 + 2));
          result_1.pixels._view.setUint8(destOff_1 + 3, this.pixels._view.getUint8(srcOff_1 + 3));
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
class ErazerFont  {
  constructor() {
  }
}
ErazerFont.alphabet = function() {
  return " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?.,:+-=";
};
ErazerFont.atlas = function() {
  let s = "";
  s = s + "00000000000000000000000000000000000";
  s = s + "01110100011000111111100011000110001";
  s = s + "11110100011000111110100011000111110";
  s = s + "01111100001000010000100001000001111";
  s = s + "11110100011000110001100011000111110";
  s = s + "11111100001000011110100001000011111";
  s = s + "11111100001000011110100001000010000";
  s = s + "01111100001000010011100011000101111";
  s = s + "10001100011000111111100011000110001";
  s = s + "01110001000010000100001000010001110";
  s = s + "00111000100001000010000101001001100";
  s = s + "10001100101010011100101001001010001";
  s = s + "10000100001000010000100001000011111";
  s = s + "10001110111010110101100011000110001";
  s = s + "10001110011010110011100011000110001";
  s = s + "01110100011000110001100011000101110";
  s = s + "11110100011000111110100001000010000";
  s = s + "01110100011000110001101011001001101";
  s = s + "11110100011000111110101001001010001";
  s = s + "01111100000111000001000011111011110";
  s = s + "11111001000010000100001000010000100";
  s = s + "10001100011000110001100011000101110";
  s = s + "10001100011000110001010100101000100";
  s = s + "10001100011000110101101011101110001";
  s = s + "10001100010101000100010101000110001";
  s = s + "10001100010101000100001000010000100";
  s = s + "11111000010001000100010001000011111";
  s = s + "00000000000111000001011111000101111";
  s = s + "10000100001011011001100011100101110";
  s = s + "00000000000111110000100001000001111";
  s = s + "00001000010110110011100011001101111";
  s = s + "00000011101000111111100000111001111";
  s = s + "00110010000111001000010000100001000";
  s = s + "00000011111000101111000010111101110";
  s = s + "10000100001011011001100011000110001";
  s = s + "00100000000010000100001000010000100";
  s = s + "00010000000001000010000101001001100";
  s = s + "10000100001001010100110001010010010";
  s = s + "01000010000100001000010000100000110";
  s = s + "00000000001101010101101011010110101";
  s = s + "00000000001011011001100011000110001";
  s = s + "00000000000111010001100010111001110";
  s = s + "00000000001111010001111101000010000";
  s = s + "00000000000111110001011110000100001";
  s = s + "00000000001011011001100001000010000";
  s = s + "00000011111000001110000011111011110";
  s = s + "01000010000111001000010000100000110";
  s = s + "00000000001000110001100011001101111";
  s = s + "00000000001000110001010100010000100";
  s = s + "00000000001000110101101011010101010";
  s = s + "00000000001000101010001000101010001";
  s = s + "00000000001000110001011110000101110";
  s = s + "00000111110001000100010001111101111";
  s = s + "01110100011000110001100011000101110";
  s = s + "00100011000010000100001000010001110";
  s = s + "01110100010000100010001000100011111";
  s = s + "11111000010001001110000010000111110";
  s = s + "00010001100101011111000100001000010";
  s = s + "11111100001111000001000011111011110";
  s = s + "01110100001000011110100011000101110";
  s = s + "11111000010001000100010000100001000";
  s = s + "01110100010111010001100010111001110";
  s = s + "01110100011000101111000011000101110";
  s = s + "01110100010000100010001000000000100";
  s = s + "00000000000000000000000000010000100";
  s = s + "00000000000000000000000000010001000";
  s = s + "00000001000010000000001000010000000";
  s = s + "00000001000010011111001000010000000";
  s = s + "00000000000000011111000000000000000";
  s = s + "00000000000111100000011110000000000";
  return s;
};
ErazerFont.bitsFor = function(ch) {
  const abc = ErazerFont.alphabet();
  let i = abc.indexOf(ch);
  if ( i < 0 ) {
    const q = abc.indexOf("?");
    i = q;
  }
  const data = ErazerFont.atlas();
  const a = i * 35;
  return data.substring(a, a + 35 );
};
ErazerFont.cellOn = function(bits, col, row) {
  const idx = row * 5 + col;
  const ch = bits.substring(idx, idx + 1 );
  return ch == "1";
};
ErazerFont.absI = function(v) {
  if ( v < 0 ) {
    return 0 - v;
  }
  return v;
};
ErazerFont.colorNear = function(r0, g0, b0, r1, g1, b1, tol) {
  if ( ErazerFont.absI(r0 - r1) > tol ) {
    return false;
  }
  if ( ErazerFont.absI(g0 - g1) > tol ) {
    return false;
  }
  if ( ErazerFont.absI(b0 - b1) > tol ) {
    return false;
  }
  return true;
};
ErazerFont.setRGB = function(img, x, y, r, g, b) {
  img.setPixelRGB(x, y, r, g, b);
};
ErazerFont.fillRect = function(img, x, y, w, h, r, g, b) {
  const c = new Color();
  c.setRGB(r, g, b);
  img.fillRect(x, y, w, h, c);
};
ErazerFont.roundInside = function(px, py, x, y, w, h, rad) {
  if ( rad <= 0 ) {
    return true;
  }
  const lx = px - x;
  const ly = py - y;
  const rr = rad * rad;
  if ( lx < rad && ly < rad ) {
    const dx = (rad - 1) - lx;
    const dy = (rad - 1) - ly;
    return dx * dx + dy * dy <= rr;
  }
  if ( lx >= w - rad && ly < rad ) {
    const dx2 = lx - (w - rad);
    const dy2 = (rad - 1) - ly;
    return dx2 * dx2 + dy2 * dy2 <= rr;
  }
  if ( lx < rad && ly >= h - rad ) {
    const dx3 = (rad - 1) - lx;
    const dy3 = ly - (h - rad);
    return dx3 * dx3 + dy3 * dy3 <= rr;
  }
  if ( lx >= w - rad && ly >= h - rad ) {
    const dx4 = lx - (w - rad);
    const dy4 = ly - (h - rad);
    return dx4 * dx4 + dy4 * dy4 <= rr;
  }
  return true;
};
ErazerFont.fillRoundRect = function(img, x, y, w, h, rad, r, g, b) {
  let py = y;
  const y2 = y + h;
  const x2 = x + w;
  while (py < y2) {
    let px = x;
    while (px < x2) {
      if ( ErazerFont.roundInside(px, py, x, y, w, h, rad) ) {
        img.setPixelRGB(px, py, r, g, b);
      }
      px = px + 1;
    };
    py = py + 1;
  };
};
ErazerFont.strokeRect = function(img, x, y, w, h, t, r, g, b) {
  ErazerFont.fillRect(img, x, y, w, t, r, g, b);
  ErazerFont.fillRect(img, x, (y + h) - t, w, t, r, g, b);
  ErazerFont.fillRect(img, x, y, t, h, r, g, b);
  ErazerFont.fillRect(img, (x + w) - t, y, t, h, r, g, b);
};
ErazerFont.paintGlyph = function(img, x, y, scale, r, g, b, ch) {
  if ( ch == " " ) {
    return 6 * scale;
  }
  const bits = ErazerFont.bitsFor(ch);
  let row = 0;
  while (row < 7) {
    let col = 0;
    while (col < 5) {
      if ( ErazerFont.cellOn(bits, col, row) ) {
        const px = x + col * scale;
        const py = y + row * scale;
        ErazerFont.fillRect(img, px, py, scale, scale, r, g, b);
      }
      col = col + 1;
    };
    row = row + 1;
  };
  return 6 * scale;
};
ErazerFont.paintText = function(img, x, y, scale, r, g, b, text) {
  let i = 0;
  let cx = x;
  const n = text.length;
  while (i < n) {
    const ch = text.substring(i, i + 1 );
    const adv = ErazerFont.paintGlyph(img, cx, y, scale, r, g, b, ch);
    cx = cx + adv;
    i = i + 1;
  };
  if ( cx > x ) {
    return (cx - x) - scale;
  }
  return 0;
};
ErazerFont.textWidth = function(text, scale) {
  const n = text.length;
  if ( n <= 0 ) {
    return 0;
  }
  return (n * 6) * scale - scale;
};
ErazerFont.textHeight = function(scale) {
  return 7 * scale;
};
ErazerFont.sampleBits = function(img, gx, gy, gw, gh, lineY, lineH, inkR, inkG, inkB) {
  let cell = ((lineH / 7) | 0);
  if ( cell < 1 ) {
    cell = 1;
  }
  const targetW = cell * 5;
  const padX = (((targetW - gw) / 2) | 0);
  const originX = gx - padX;
  const originY = lineY;
  let out = "";
  let row = 0;
  while (row < 7) {
    let col = 0;
    while (col < 5) {
      const sx = (originX + col * cell) + ((cell / 2) | 0);
      const sy = (originY + row * cell) + ((cell / 2) | 0);
      let on = "0";
      if ( img.isValidCoord(sx, sy) ) {
        const c = img.getPixel(sx, sy);
        if ( ErazerFont.colorNear(c.r, c.g, c.b, inkR, inkG, inkB, 48) ) {
          on = "1";
        }
      }
      out = out + on;
      col = col + 1;
    };
    row = row + 1;
  };
  return out;
};
ErazerFont.hamming = function(a, b) {
  let n = a.length;
  const m = b.length;
  if ( m < n ) {
    n = m;
  }
  let d = 0;
  let i = 0;
  while (i < n) {
    const ca = a.substring(i, i + 1 );
    const cb = b.substring(i, i + 1 );
    if ( ca != cb ) {
      d = d + 1;
    }
    i = i + 1;
  };
  return d;
};
ErazerFont.matchBits = function(bits) {
  const abc = ErazerFont.alphabet();
  const data = ErazerFont.atlas();
  const n = abc.length;
  let bestI = 0;
  let bestD = 36;
  let i = 0;
  while (i < n) {
    const pat = data.substring(i * 35, i * 35 + 35 );
    const d = ErazerFont.hamming(bits, pat);
    if ( d < bestD ) {
      bestD = d;
      bestI = i;
    }
    i = i + 1;
  };
  if ( bestD > 12 ) {
    return "";
  }
  return abc.substring(bestI, bestI + 1 );
};
ErazerFont.matchDist = function(bits) {
  const abc = ErazerFont.alphabet();
  const data = ErazerFont.atlas();
  const n = abc.length;
  let bestD = 36;
  let i = 0;
  while (i < n) {
    const pat = data.substring(i * 35, i * 35 + 35 );
    const d = ErazerFont.hamming(bits, pat);
    if ( d < bestD ) {
      bestD = d;
    }
    i = i + 1;
  };
  return bestD;
};
ErazerFont.readGlyph = function(img, gx, gy, gw, gh, lineY, lineH, inkR, inkG, inkB) {
  const bits = ErazerFont.sampleBits(
    img,
    gx,
    gy,
    gw,
    gh,
    lineY,
    lineH,
    inkR,
    inkG,
    inkB
  );
  return ErazerFont.matchBits(bits);
};
class ErazerLayoutBox  {
  constructor() {
    this.type = "label";
    this.x = 0.0;
    this.y = 0.0;
    this.w = 0.0;
    this.h = 0.0;
    this.fontSize = 14.0;
    this.index = 0;
    this.parent = -1;
  }
  copy () {
    const b = ErazerLayoutBox.of(
      this.type,
      this.x,
      this.y,
      this.w,
      this.h,
      this.fontSize
    );
    b.index = this.index;
    b.parent = this.parent;
    return b;
  };
  maxX () {
    return this.x + this.w;
  };
  maxY () {
    return this.y + this.h;
  };
  cx () {
    return this.x + this.w * 0.5;
  };
  cy () {
    return this.y + this.h * 0.5;
  };
}
ErazerLayoutBox.of = function(type, x, y, w, h, fontSize) {
  const b = new ErazerLayoutBox();
  b.type = type;
  b.x = x;
  b.y = y;
  b.w = w;
  b.h = h;
  b.fontSize = fontSize;
  return b;
};
class ErazerLayoutSet  {
  constructor() {
    this.boxes = [];
    let b_1 = [];
    this.boxes = b_1;
  }
}
ErazerLayoutSet.of = function(boxes) {
  const s = new ErazerLayoutSet();
  s.boxes = boxes;
  return s;
};
class ErazerLayoutGuess  {
  constructor() {
    this.type = "other";
    this.confidence = 0.0;
    this.axis = "vertical";
    this.items = 0;
    this.alignment = "start";
    this.spacingMean = 0.0;
    this.spacingVar = 0.0;
    this.pattern = "";
    this.members = [];
    this.x = 0.0;
    this.y = 0.0;
    this.w = 0.0;
    this.h = 0.0;
    let m = [];
    this.members = m;
  }
}
class ErazerLayoutFeat  {
  constructor() {
  }
}
ErazerLayoutFeat.featCount = function() {
  return 40;
};
ErazerLayoutFeat.absD = function(v) {
  if ( v < 0.0 ) {
    return 0.0 - v;
  }
  return v;
};
ErazerLayoutFeat.minD = function(a, b) {
  if ( a < b ) {
    return a;
  }
  return b;
};
ErazerLayoutFeat.maxD = function(a, b) {
  if ( a > b ) {
    return a;
  }
  return b;
};
ErazerLayoutFeat.clamp01 = function(v) {
  if ( v < 0.0 ) {
    return 0.0;
  }
  if ( v > 1.0 ) {
    return 1.0;
  }
  return v;
};
ErazerLayoutFeat.squash = function(v) {
  const a = ErazerLayoutFeat.absD(v);
  if ( v < 0.0 ) {
    return (0.0 - a) / (1.0 + a);
  }
  return v / (1.0 + v);
};
ErazerLayoutFeat.zeros = function(n) {
  let a = [];
  let i = 0;
  while (i < n) {
    a.push(0.0);
    i = i + 1;
  };
  return a;
};
ErazerLayoutFeat.meanOf = function(xs) {
  const n = xs.length;
  if ( n <= 0 ) {
    return 0.0;
  }
  let s = 0.0;
  let i = 0;
  while (i < n) {
    s = s + xs[i];
    i = i + 1;
  };
  return s / n;
};
ErazerLayoutFeat.stdOf = function(xs) {
  const n = xs.length;
  if ( n < 2 ) {
    return 0.0;
  }
  const mu = ErazerLayoutFeat.meanOf(xs);
  let acc = 0.0;
  let i = 0;
  while (i < n) {
    const d = xs[i] - mu;
    acc = acc + d * d;
    i = i + 1;
  };
  const _var = acc / n;
  if ( _var <= 0.0 ) {
    return 0.0;
  }
  return Math.sqrt(_var);
};
ErazerLayoutFeat.medianOf = function(xs) {
  const n = xs.length;
  if ( n <= 0 ) {
    return 0.0;
  }
  let a = [];
  let i = 0;
  while (i < n) {
    a.push(xs[i]);
    i = i + 1;
  };
  let p = 1;
  while (p < n) {
    let j = p;
    while (j > 0) {
      const cur = a[j];
      const prev = a[(j - 1)];
      if ( cur < prev ) {
        a[j] = prev;
        a[j - 1] = cur;
        j = j - 1;
      } else {
        j = 0;
      }
    };
    p = p + 1;
  };
  const mid = ((n / 2) | 0);
  if ( n - ((n / 2) | 0) * 2 == 0 && mid > 0 ) {
    return (a[(mid - 1)] + a[mid]) * 0.5;
  }
  return a[mid];
};
ErazerLayoutFeat.isWidget = function(role) {
  if ( role == "label" ) {
    return true;
  }
  if ( role == "text" ) {
    return true;
  }
  if ( role == "checkbox" ) {
    return true;
  }
  if ( role == "button" ) {
    return true;
  }
  if ( role == "textfield" ) {
    return true;
  }
  if ( role == "icon" ) {
    return true;
  }
  if ( role == "tab" ) {
    return true;
  }
  if ( role == "menuitem" ) {
    return true;
  }
  if ( role == "slider" ) {
    return true;
  }
  if ( role == "sliderthumb" ) {
    return true;
  }
  if ( role == "switch" ) {
    return true;
  }
  return false;
};
ErazerLayoutFeat.typeBucket = function(t) {
  if ( (t == "label" || t == "text") || t == "menuitem" ) {
    return 0;
  }
  if ( t == "checkbox" || t == "switch" ) {
    return 1;
  }
  if ( (((t == "panel" || t == "form") || t == "card") || t == "listitem") || t == "list" ) {
    return 2;
  }
  if ( t == "icon" ) {
    return 3;
  }
  if ( t == "button" || t == "tab" ) {
    return 4;
  }
  if ( t == "textfield" || t == "slider" ) {
    return 5;
  }
  return 6;
};
ErazerLayoutFeat.boxFromNode = function(n) {
  let font = n.fontSize;
  if ( font < 1.0 ) {
    font = 14.0;
  }
  let role = n.role;
  if ( role == "text" ) {
    role = "label";
  }
  return ErazerLayoutBox.of(role, n.x, n.y, n.w, n.h, font);
};
ErazerLayoutFeat.collectFrom = function(n, pageW, pageH, out, parentIdx) {
  let take = ErazerLayoutFeat.isWidget(n.role);
  if ( take == false ) {
    if ( (((n.role == "panel" || n.role == "form") || n.role == "menu") || n.role == "list") || n.role == "listitem" ) {
      if ( n.w >= 28 && n.h >= 28 ) {
        const area = n.w * n.h;
        const pageA = pageW * pageH;
        if ( pageA <= 0 || area < (((pageA * 45) / 100) | 0) ) {
          take = true;
        }
      }
    }
  }
  let inner = parentIdx;
  if ( take ) {
    if ( n.role != "page" ) {
      const b = ErazerLayoutFeat.boxFromNode(n);
      b.index = out.length;
      b.parent = parentIdx;
      n.boxId = b.index + 1;
      out.push(b);
      inner = b.index;
    }
  }
  let i = 0;
  while (i < n.kids.length) {
    const k = n.kids[i];
    ErazerLayoutFeat.collectFrom(k, pageW, pageH, out, inner);
    i = i + 1;
  };
};
ErazerLayoutFeat.collectTree = function(root, pageW, pageH) {
  let out = [];
  ErazerLayoutFeat.collectFrom(root, pageW, pageH, out, 0 - 1);
  return out;
};
ErazerLayoutFeat.baseEm = function(boxes) {
  let fonts = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    if ( b.fontSize > 1.0 ) {
      fonts.push(b.fontSize);
    }
    i = i + 1;
  };
  if ( fonts.length == 0 ) {
    return 14.0;
  }
  const med = ErazerLayoutFeat.medianOf(fonts);
  if ( med < 4.0 ) {
    return 14.0;
  }
  return med;
};
ErazerLayoutFeat.sortedYX = function(boxes) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    out.push(boxes[i]);
    i = i + 1;
  };
  const n = out.length;
  let a = 1;
  while (a < n) {
    let j = a;
    while (j > 0) {
      const cur = out[j];
      const prev = out[(j - 1)];
      let doSwap = false;
      if ( cur.y < prev.y ) {
        doSwap = true;
      }
      if ( cur.y == prev.y && cur.x < prev.x ) {
        doSwap = true;
      }
      if ( doSwap ) {
        out[j] = prev;
        out[j - 1] = cur;
        j = j - 1;
      } else {
        j = 0;
      }
    };
    a = a + 1;
  };
  return out;
};
ErazerLayoutFeat.copyBoxes = function(boxes) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    out.push(b.copy());
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.memberSig = function(boxes) {
  let ids = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    ids.push(b.index);
    i = i + 1;
  };
  const n = ids.length;
  let a = 1;
  while (a < n) {
    let j = a;
    while (j > 0) {
      const cur = ids[j];
      const prev = ids[(j - 1)];
      if ( cur < prev ) {
        ids[j] = prev;
        ids[j - 1] = cur;
        j = j - 1;
      } else {
        j = 0;
      }
    };
    a = a + 1;
  };
  let s = "";
  let k = 0;
  while (k < n) {
    if ( k > 0 ) {
      s = s + ",";
    }
    s = s + (ids[k].toString());
    k = k + 1;
  };
  return s;
};
ErazerLayoutFeat.features = function(boxes) {
  let f = ErazerLayoutFeat.zeros(40);
  const n = boxes.length;
  if ( n <= 0 ) {
    return f;
  }
  let em = ErazerLayoutFeat.baseEm(boxes);
  if ( em < 1.0 ) {
    em = 14.0;
  }
  let xs = [];
  let ys = [];
  let ws = [];
  let hs = [];
  let cxs = [];
  let cys = [];
  let rxs = [];
  let minX = 0.0;
  let minY = 0.0;
  let maxX = 0.0;
  let maxY = 0.0;
  let i = 0;
  while (i < n) {
    const b = boxes[i];
    if ( i == 0 ) {
      minX = b.x;
      minY = b.y;
      maxX = b.maxX();
      maxY = b.maxY();
    }
    minX = ErazerLayoutFeat.minD(minX, b.x);
    minY = ErazerLayoutFeat.minD(minY, b.y);
    maxX = ErazerLayoutFeat.maxD(maxX, b.maxX());
    maxY = ErazerLayoutFeat.maxD(maxY, b.maxY());
    xs.push(b.x);
    ys.push(b.y);
    ws.push(b.w);
    hs.push(b.h);
    cxs.push(b.cx());
    cys.push(b.cy());
    i = i + 1;
  };
  const gw = ErazerLayoutFeat.maxD(1.0, (maxX - minX));
  const gh = ErazerLayoutFeat.maxD(1.0, (maxY - minY));
  let j = 0;
  while (j < n) {
    const b2 = boxes[j];
    rxs.push((b2.x - minX) / gw);
    j = j + 1;
  };
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let vGaps = [];
  let hGaps = [];
  let leftHits = 0.0;
  let widthRatios = [];
  let heightRatios = [];
  let overlapH = 0.0;
  let pairN = 0;
  let p = 0;
  while (p < n - 1) {
    const a = ordered[p];
    const b_1 = ordered[(p + 1)];
    let vg = b_1.y - a.maxY();
    if ( vg < 0.0 ) {
      vg = 0.0;
    }
    vGaps.push(vg);
    let hg = 0.0;
    if ( b_1.x >= a.maxX() ) {
      hg = b_1.x - a.maxX();
    } else {
      if ( a.x >= b_1.maxX() ) {
        hg = a.x - b_1.maxX();
      }
    }
    hGaps.push(hg);
    const dx = ErazerLayoutFeat.absD((a.x - b_1.x));
    if ( dx <= 0.35 * em ) {
      leftHits = leftHits + 1.0;
    }
    let wr = 1.0;
    const aw = ErazerLayoutFeat.maxD(1.0, a.w);
    const bw = ErazerLayoutFeat.maxD(1.0, b_1.w);
    wr = ErazerLayoutFeat.minD(aw, bw) / ErazerLayoutFeat.maxD(aw, bw);
    widthRatios.push(wr);
    const ah = ErazerLayoutFeat.maxD(1.0, a.h);
    const bh = ErazerLayoutFeat.maxD(1.0, b_1.h);
    heightRatios.push(ErazerLayoutFeat.minD(ah, bh) / ErazerLayoutFeat.maxD(ah, bh));
    const left = ErazerLayoutFeat.maxD(a.x, b_1.x);
    const right = ErazerLayoutFeat.minD(a.maxX(), b_1.maxX());
    let ov = right - left;
    if ( ov < 0.0 ) {
      ov = 0.0;
    }
    let minW = ErazerLayoutFeat.minD(a.w, b_1.w);
    if ( minW < 1.0 ) {
      minW = 1.0;
    }
    overlapH = overlapH + ov / minW;
    pairN = pairN + 1;
    p = p + 1;
  };
  let typeN = ErazerLayoutFeat.zeros(7);
  let t = 0;
  while (t < n) {
    const bx = boxes[t];
    const tb = ErazerLayoutFeat.typeBucket(bx.type);
    const cur = typeN[tb];
    typeN[tb] = cur + 1.0;
    t = t + 1;
  };
  const nn = n;
  let dominant = 0.0;
  let u = 0;
  while (u < 7) {
    const tv = typeN[u];
    if ( tv > dominant ) {
      dominant = tv;
    }
    u = u + 1;
  };
  const medX = ErazerLayoutFeat.medianOf(xs);
  const medY = ErazerLayoutFeat.medianOf(ys);
  let sameCol = 0.0;
  let sameRow = 0.0;
  let s = 0;
  while (s < n) {
    const b3 = boxes[s];
    if ( ErazerLayoutFeat.absD(b3.x - medX) <= 0.35 * em ) {
      sameCol = sameCol + 1.0;
    }
    if ( ErazerLayoutFeat.absD(b3.y - medY) <= 0.35 * em ) {
      sameRow = sameRow + 1.0;
    }
    s = s + 1;
  };
  let minCx = ErazerLayoutFeat.medianOf(cxs);
  let maxCx = minCx;
  let minCy = ErazerLayoutFeat.medianOf(cys);
  let maxCy = minCy;
  let c = 0;
  while (c < n) {
    const cxv = cxs[c];
    const cyv = cys[c];
    minCx = ErazerLayoutFeat.minD(minCx, cxv);
    maxCx = ErazerLayoutFeat.maxD(maxCx, cxv);
    minCy = ErazerLayoutFeat.minD(minCy, cyv);
    maxCy = ErazerLayoutFeat.maxD(maxCy, cyv);
    c = c + 1;
  };
  const xSpan = maxCx - minCx;
  const ySpan = maxCy - minCy;
  const vMean = ErazerLayoutFeat.meanOf(vGaps);
  const vStd = ErazerLayoutFeat.stdOf(vGaps);
  const hMean = ErazerLayoutFeat.meanOf(hGaps);
  const hStd = ErazerLayoutFeat.stdOf(hGaps);
  const wMean = ErazerLayoutFeat.meanOf(ws);
  const hMeanB = ErazerLayoutFeat.meanOf(hs);
  let wCv = 0.0;
  if ( wMean > 0.001 ) {
    wCv = ErazerLayoutFeat.stdOf(ws) / wMean;
  }
  let hCv = 0.0;
  if ( hMeanB > 0.001 ) {
    hCv = ErazerLayoutFeat.stdOf(hs) / hMeanB;
  }
  const pairPat = ErazerLayoutFeat.pairScore(ordered, em);
  let pairDen = 1.0;
  if ( pairN > 0 ) {
    pairDen = pairN;
  }
  let item3 = 0.0;
  if ( n >= 3 ) {
    item3 = 1.0;
  }
  let item5 = 0.0;
  if ( n >= 5 ) {
    item5 = 1.0;
  }
  let axis = 0.0;
  const spanSum = (xSpan + ySpan) + 1.0;
  axis = (ySpan - xSpan) / spanSum;
  const gAspect = gw / gh;
  f[0] = ErazerLayoutFeat.clamp01((nn / 12.0));
  f[1] = ErazerLayoutFeat.squash((gAspect - 1.0));
  f[2] = ErazerLayoutFeat.squash(((gw / em) / 20.0));
  f[3] = ErazerLayoutFeat.squash(((gh / em) / 20.0));
  f[4] = ErazerLayoutFeat.squash((ErazerLayoutFeat.stdOf(xs) / em));
  f[5] = ErazerLayoutFeat.squash((ErazerLayoutFeat.stdOf(ys) / em));
  f[6] = ErazerLayoutFeat.squash(wCv);
  f[7] = ErazerLayoutFeat.squash(hCv);
  f[8] = ErazerLayoutFeat.squash(((vMean / em) / 3.0));
  f[9] = ErazerLayoutFeat.squash((vStd / em));
  f[10] = ErazerLayoutFeat.squash(((hMean / em) / 3.0));
  f[11] = ErazerLayoutFeat.squash((hStd / em));
  f[12] = 1.0 / (1.0 + vStd / em);
  f[13] = 1.0 / (1.0 + hStd / em);
  f[14] = sameCol / nn;
  f[15] = sameRow / nn;
  if ( pairN > 0 ) {
    f[16] = leftHits / pairDen;
  }
  f[17] = 1.0 / (1.0 + wCv);
  f[18] = typeN[0] / nn;
  f[19] = typeN[1] / nn;
  f[20] = typeN[2] / nn;
  f[21] = typeN[3] / nn;
  f[22] = typeN[4] / nn;
  f[23] = typeN[5] / nn;
  f[24] = dominant / nn;
  f[25] = pairPat;
  f[26] = ErazerLayoutFeat.clamp01((overlapH / pairDen));
  f[27] = ErazerLayoutFeat.meanOf(widthRatios);
  f[28] = ErazerLayoutFeat.meanOf(heightRatios);
  f[29] = item3;
  f[30] = item5;
  f[31] = ErazerLayoutFeat.squash(axis);
  f[32] = ErazerLayoutFeat.squash((0.0 - axis));
  f[33] = ErazerLayoutFeat.meanOf(rxs);
  f[34] = ErazerLayoutFeat.squash(ErazerLayoutFeat.stdOf(rxs));
  let rights = [];
  let ri = 0;
  while (ri < n) {
    const rb = boxes[ri];
    rights.push(rb.maxX());
    ri = ri + 1;
  };
  f[35] = ErazerLayoutFeat.squash((ErazerLayoutFeat.stdOf(cxs) / em));
  f[36] = ErazerLayoutFeat.squash((ErazerLayoutFeat.stdOf(rights) / em));
  let gapCv = 0.0;
  if ( vMean > 0.001 ) {
    gapCv = vStd / vMean;
  }
  f[37] = ErazerLayoutFeat.squash(gapCv);
  let mix = 0.0;
  if ( typeN[3] > 0.0 && typeN[0] > 0.0 ) {
    mix = 1.0;
  }
  f[38] = mix;
  const sym = ErazerLayoutFeat.absD((f[4] - f[36]));
  f[39] = 1.0 / (1.0 + sym);
  return f;
};
ErazerLayoutFeat.pairScore = function(ordered, em) {
  const n = ordered.length;
  if ( n < 4 ) {
    return 0.0;
  }
  let rowStart = [];
  rowStart.push(0);
  let i = 1;
  while (i < n) {
    const prev = ordered[(i - 1)];
    const cur = ordered[i];
    if ( ErazerLayoutFeat.absD(cur.y - prev.y) > 0.45 * em ) {
      rowStart.push(i);
    }
    i = i + 1;
  };
  const nRows = rowStart.length;
  if ( nRows < 2 ) {
    return 0.0;
  }
  let sigs = [];
  let r = 0;
  while (r < nRows) {
    const a = rowStart[r];
    let b = n;
    if ( r < nRows - 1 ) {
      b = rowStart[(r + 1)];
    }
    let sig = "";
    let k = a;
    while (k < b) {
      const box = ordered[k];
      if ( sig.length > 0 ) {
        sig = sig + "+";
      }
      sig = sig + box.type;
      k = k + 1;
    };
    sigs.push(sig);
    r = r + 1;
  };
  let best = 0;
  let a2 = 0;
  while (a2 < sigs.length) {
    const s0 = sigs[a2];
    let cnt = 0;
    let b2 = 0;
    while (b2 < sigs.length) {
      if ( sigs[b2] == s0 ) {
        cnt = cnt + 1;
      }
      b2 = b2 + 1;
    };
    if ( cnt > best ) {
      best = cnt;
    }
    a2 = a2 + 1;
  };
  let sBest = sigs[0];
  let look = 0;
  while (look < sigs.length) {
    const cand = sigs[look];
    let cnt2 = 0;
    let z = 0;
    while (z < sigs.length) {
      if ( sigs[z] == cand ) {
        cnt2 = cnt2 + 1;
      }
      z = z + 1;
    };
    if ( cnt2 == best ) {
      sBest = cand;
      look = sigs.length;
    } else {
      look = look + 1;
    }
  };
  if ( sBest.indexOf("+") < 0 ) {
    return 0.0;
  }
  return best / nRows;
};
ErazerLayoutFeat.describe = function(boxes, type, confidence) {
  const g = new ErazerLayoutGuess();
  g.type = type;
  g.confidence = confidence;
  g.items = boxes.length;
  if ( boxes.length <= 0 ) {
    return g;
  }
  const em = ErazerLayoutFeat.baseEm(boxes);
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let minX = 0.0;
  let minY = 0.0;
  let maxX = 0.0;
  let maxY = 0.0;
  let xs = [];
  let rights = [];
  let cxs = [];
  let vGaps = [];
  let hGaps = [];
  let i = 0;
  while (i < ordered.length) {
    const b = ordered[i];
    g.members.push(b.index);
    if ( i == 0 ) {
      minX = b.x;
      minY = b.y;
      maxX = b.maxX();
      maxY = b.maxY();
    }
    minX = ErazerLayoutFeat.minD(minX, b.x);
    minY = ErazerLayoutFeat.minD(minY, b.y);
    maxX = ErazerLayoutFeat.maxD(maxX, b.maxX());
    maxY = ErazerLayoutFeat.maxD(maxY, b.maxY());
    xs.push(b.x);
    rights.push(b.maxX());
    cxs.push(b.cx());
    if ( i > 0 ) {
      const prev = ordered[(i - 1)];
      let vg = b.y - prev.maxY();
      if ( vg < 0.0 ) {
        vg = 0.0;
      }
      vGaps.push(vg);
      let hg = 0.0;
      if ( b.x >= prev.maxX() ) {
        hg = b.x - prev.maxX();
      }
      hGaps.push(hg);
    }
    i = i + 1;
  };
  let cy = [];
  let cx = [];
  let qi = 0;
  while (qi < ordered.length) {
    const qb = ordered[qi];
    cy.push(qb.cy());
    cx.push(qb.cx());
    qi = qi + 1;
  };
  const yVar = ErazerLayoutFeat.stdOf(cy);
  const xVar = ErazerLayoutFeat.stdOf(cx);
  const vMean = ErazerLayoutFeat.meanOf(vGaps);
  const hMean = ErazerLayoutFeat.meanOf(hGaps);
  g.x = minX;
  g.y = minY;
  g.w = maxX - minX;
  g.h = maxY - minY;
  if ( yVar >= xVar || vMean >= hMean ) {
    g.axis = "vertical";
    g.spacingMean = vMean / em;
    g.spacingVar = ErazerLayoutFeat.stdOf(vGaps) / em;
  } else {
    g.axis = "horizontal";
    g.spacingMean = hMean / em;
    g.spacingVar = ErazerLayoutFeat.stdOf(hGaps) / em;
  }
  const leftStd = ErazerLayoutFeat.stdOf(xs);
  const rightStd = ErazerLayoutFeat.stdOf(rights);
  const cenStd = ErazerLayoutFeat.stdOf(cxs);
  g.alignment = "start";
  const tol = 0.35 * em;
  if ( (rightStd < leftStd && rightStd <= tol) && leftStd > tol ) {
    g.alignment = "end";
  }
  if ( ((cenStd < leftStd && cenStd < rightStd) && leftStd > tol) && rightStd > tol ) {
    g.alignment = "center";
  }
  g.pattern = ErazerLayoutFeat.patternOf(ordered, em);
  return g;
};
ErazerLayoutFeat.patternOf = function(ordered, em) {
  const n = ordered.length;
  if ( n <= 0 ) {
    return "";
  }
  let rowStart = [];
  rowStart.push(0);
  let i = 1;
  while (i < n) {
    const prev = ordered[(i - 1)];
    const cur = ordered[i];
    if ( ErazerLayoutFeat.absD(cur.y - prev.y) > 0.45 * em ) {
      rowStart.push(i);
    }
    i = i + 1;
  };
  const a = 0;
  let b = n;
  if ( rowStart.length > 1 ) {
    b = rowStart[1];
  }
  let out = "";
  let k = a;
  while (k < b) {
    const box = ordered[k];
    if ( out.length > 0 ) {
      out = out + ",";
    }
    out = out + box.type;
    k = k + 1;
  };
  return out;
};
ErazerLayoutFeat.nearAlign = function(a, b, em, vertical) {
  if ( vertical ) {
    const dx = ErazerLayoutFeat.absD((a.x - b.x));
    const dcx = ErazerLayoutFeat.absD((a.cx() - b.cx()));
    if ( dx <= 0.45 * em || dcx <= 0.5 * em ) {
      const wr = ErazerLayoutFeat.minD(a.w, b.w) / ErazerLayoutFeat.maxD(1.0, ErazerLayoutFeat.maxD(a.w, b.w));
      if ( wr >= 0.52 ) {
        return true;
      }
    }
    return false;
  }
  const dy = ErazerLayoutFeat.absD((a.y - b.y));
  const dcy = ErazerLayoutFeat.absD((a.cy() - b.cy()));
  if ( dy <= 0.45 * em || dcy <= 0.5 * em ) {
    const hr = ErazerLayoutFeat.minD(a.h, b.h) / ErazerLayoutFeat.maxD(1.0, ErazerLayoutFeat.maxD(a.h, b.h));
    if ( hr >= 0.52 ) {
      return true;
    }
  }
  return false;
};
ErazerLayoutFeat.clusterAxis = function(boxes, vertical) {
  let out = [];
  const n = boxes.length;
  if ( n < 2 ) {
    return out;
  }
  const em = ErazerLayoutFeat.baseEm(boxes);
  let used = [];
  let u = 0;
  while (u < n) {
    used.push(0);
    u = u + 1;
  };
  let i = 0;
  while (i < n) {
    const mark = used[i];
    if ( mark == 0 ) {
      const seed = boxes[i];
      let grp = [];
      grp.push(seed);
      used[i] = 1;
      let j = 0;
      while (j < n) {
        const om = used[j];
        if ( om == 0 ) {
          const other = boxes[j];
          if ( other.parent == seed.parent && ErazerLayoutFeat.nearAlign(seed, other, em, vertical) ) {
            grp.push(other);
            used[j] = 1;
          }
        }
        j = j + 1;
      };
      if ( grp.length >= 2 ) {
        const runs = ErazerLayoutFeat.splitAtGaps(grp, vertical, em);
        let r = 0;
        while (r < runs.length) {
          out.push(runs[r]);
          r = r + 1;
        };
      }
    }
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.splitAtGaps = function(grp, vertical, em) {
  let out = [];
  if ( vertical == false ) {
    out.push(ErazerLayoutSet.of(grp));
    return out;
  }
  const ordered = ErazerLayoutFeat.sortedYX(grp);
  let cur = [];
  let prev = ordered[0];
  cur.push(prev);
  let k = 1;
  while (k < ordered.length) {
    const b = ordered[k];
    const gap = b.y - prev.maxY();
    const lim = ErazerLayoutFeat.maxD((3.0 * em), (1.5 * ErazerLayoutFeat.maxD(prev.h, b.h)));
    if ( gap > lim ) {
      if ( cur.length >= 2 ) {
        out.push(ErazerLayoutSet.of(cur));
      }
      let fresh = [];
      cur = fresh;
    }
    cur.push(b);
    prev = b;
    k = k + 1;
  };
  if ( cur.length >= 2 ) {
    out.push(ErazerLayoutSet.of(cur));
  }
  return out;
};
ErazerLayoutFeat.siblingSets = function(boxes) {
  let out = [];
  const n = boxes.length;
  let p = 0;
  while (p < n) {
    const par = boxes[p];
    let grp = [];
    let i = 0;
    while (i < n) {
      const b = boxes[i];
      if ( b.parent == par.index ) {
        grp.push(b);
      }
      i = i + 1;
    };
    if ( grp.length >= 2 && grp.length <= 16 ) {
      out.push(ErazerLayoutSet.of(grp));
    }
    p = p + 1;
  };
  return out;
};
ErazerLayoutFeat.pairRowSets = function(boxes) {
  let out = [];
  const n = boxes.length;
  if ( n < 4 ) {
    return out;
  }
  const em = ErazerLayoutFeat.baseEm(boxes);
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  const score = ErazerLayoutFeat.pairScore(ordered, em);
  if ( score >= 0.66 ) {
    out.push(ErazerLayoutSet.of(ordered));
  }
  return out;
};
ErazerLayoutFeat.candidates = function(boxes) {
  let out = [];
  let seen = {};
  const n = boxes.length;
  if ( n < 2 ) {
    return out;
  }
  if ( n <= 16 ) {
    ErazerLayoutFeat.addCand(out, seen, ErazerLayoutSet.of(boxes));
  }
  const vert = ErazerLayoutFeat.clusterAxis(boxes, true);
  const horz = ErazerLayoutFeat.clusterAxis(boxes, false);
  const pairs = ErazerLayoutFeat.pairRowSets(boxes);
  const sibs = ErazerLayoutFeat.siblingSets(boxes);
  let sb = 0;
  while (sb < sibs.length) {
    ErazerLayoutFeat.addCand(out, seen, sibs[sb]);
    sb = sb + 1;
  };
  let i = 0;
  while (i < vert.length) {
    ErazerLayoutFeat.addCand(out, seen, vert[i]);
    i = i + 1;
  };
  let h = 0;
  while (h < horz.length) {
    ErazerLayoutFeat.addCand(out, seen, horz[h]);
    h = h + 1;
  };
  let p = 0;
  while (p < pairs.length) {
    ErazerLayoutFeat.addCand(out, seen, pairs[p]);
    p = p + 1;
  };
  return out;
};
ErazerLayoutFeat.addCand = function(out, seen, cand) {
  if ( cand.boxes.length < 2 ) {
    return;
  }
  const sig = ErazerLayoutFeat.memberSig(cand.boxes);
  if ( ( typeof(seen[sig] ) != "undefined" && Object.prototype.hasOwnProperty.call(seen, sig) ) ) {
    return;
  }
  seen[sig] = 1;
  out.push(cand);
};
ErazerLayoutFeat.augment = function(boxes) {
  let out = [];
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.copyBoxes(boxes)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleGaps(boxes, 0.9)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleGaps(boxes, 1.1)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleSizes(boxes, 0.9, 1.0)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleSizes(boxes, 1.1, 1.0)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleFont(boxes, 0.85)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleFont(boxes, 1.15)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.shiftAll(boxes, 3.0, -2.0)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.scaleAll(boxes, 1.25)));
  const n = boxes.length;
  if ( n >= 4 ) {
    out.push(ErazerLayoutSet.of(ErazerLayoutFeat.dropLast(boxes)));
  }
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.addClone(boxes)));
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.nudgeOne(boxes, 2.5)));
  return out;
};
ErazerLayoutFeat.asColumn = function(boxes) {
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let out = [];
  const n = ordered.length;
  if ( n <= 0 ) {
    return out;
  }
  const head = ordered[0];
  const x = head.x;
  let y = head.y;
  let i = 0;
  while (i < n) {
    const b = ordered[i];
    const c = b.copy();
    c.x = x;
    c.y = y;
    y = y + (c.h + 8.0);
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.hardNegatives = function(boxes) {
  let out = [];
  const g = ErazerLayoutFeat.describe(boxes, "tmp", 0.0);
  if ( g.axis == "vertical" ) {
    out.push(ErazerLayoutSet.of(ErazerLayoutFeat.asRow(boxes)));
  } else {
    out.push(ErazerLayoutSet.of(ErazerLayoutFeat.asColumn(boxes)));
  }
  out.push(ErazerLayoutSet.of(ErazerLayoutFeat.withOutlier(boxes)));
  return out;
};
ErazerLayoutFeat.scaleGaps = function(boxes, k) {
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let out = [];
  const n = ordered.length;
  if ( n <= 0 ) {
    return out;
  }
  const head = ordered[0];
  const originY = head.y;
  const originX = head.x;
  let i = 0;
  while (i < n) {
    const b = ordered[i];
    const c = b.copy();
    c.y = originY + (b.y - originY) * k;
    c.x = originX + (b.x - originX) * k;
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.scaleSizes = function(boxes, wk, hk) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    const c = b.copy();
    c.w = b.w * wk;
    c.h = b.h * hk;
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.scaleFont = function(boxes, k) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    const c = b.copy();
    c.fontSize = b.fontSize * k;
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.shiftAll = function(boxes, dx, dy) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    const c = b.copy();
    c.x = b.x + dx;
    c.y = b.y + dy;
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.scaleAll = function(boxes, k) {
  let out = [];
  let i = 0;
  while (i < boxes.length) {
    const b = boxes[i];
    const c = b.copy();
    c.x = b.x * k;
    c.y = b.y * k;
    c.w = b.w * k;
    c.h = b.h * k;
    c.fontSize = b.fontSize * k;
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.dropLast = function(boxes) {
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let out = [];
  const n = ordered.length;
  let i = 0;
  while (i < n - 1) {
    const b = ordered[i];
    out.push(b.copy());
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.addClone = function(boxes) {
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let out = ErazerLayoutFeat.copyBoxes(ordered);
  const n = ordered.length;
  if ( n <= 0 ) {
    return out;
  }
  const tail = ordered[(n - 1)];
  const extra = tail.copy();
  let gap = tail.h;
  if ( n >= 2 ) {
    const prev = ordered[(n - 2)];
    gap = tail.y - prev.y;
  }
  extra.y = tail.y + gap;
  extra.index = tail.index + 1;
  out.push(extra);
  return out;
};
ErazerLayoutFeat.nudgeOne = function(boxes, amount) {
  const out = ErazerLayoutFeat.copyBoxes(boxes);
  const n = out.length;
  if ( n <= 0 ) {
    return out;
  }
  const mid = ((n / 2) | 0);
  const b = out[mid];
  b.x = b.x + amount;
  return out;
};
ErazerLayoutFeat.asRow = function(boxes) {
  const ordered = ErazerLayoutFeat.sortedYX(boxes);
  let out = [];
  const n = ordered.length;
  if ( n <= 0 ) {
    return out;
  }
  const head = ordered[0];
  let x = head.x;
  const y = head.y;
  let i = 0;
  while (i < n) {
    const b = ordered[i];
    const c = b.copy();
    c.x = x;
    c.y = y;
    x = x + (c.w + 8.0);
    out.push(c);
    i = i + 1;
  };
  return out;
};
ErazerLayoutFeat.withOutlier = function(boxes) {
  let out = ErazerLayoutFeat.copyBoxes(boxes);
  const n = boxes.length;
  if ( n <= 0 ) {
    return out;
  }
  const tail = boxes[(n - 1)];
  const extra = tail.copy();
  extra.x = tail.maxX() + 80.0;
  extra.y = tail.y + 6.0;
  extra.type = "icon";
  extra.index = tail.index + 91;
  out.push(extra);
  return out;
};
class ErazerLayoutNet  {
  constructor() {
    this.inSize = 40;
    this.hidSize = 32;
    this.outSize = 8;
    this.w1 = [];
    this.b1 = [];
    this.w2 = [];
    this.b2 = [];
    this.classNames = [];
    this.classIndex = {};
    this.rng = 1;
    this.rngD = 0.137;
    this.stepsDone = 0;
    this.memX = [];
    this.memY = [];
    this.memCount = 0;
    this.memCap = 96;
    let a_1 = [];
    this.w1 = a_1;
    let bb = [];
    this.b1 = bb;
    let c_1 = [];
    this.w2 = c_1;
    let d_1 = [];
    this.b2 = d_1;
    let names = [];
    this.classNames = names;
    let mx = [];
    this.memX = mx;
    let my = [];
    this.memY = my;
    this.initFresh();
  }
  rnd01 () {
    this.rngD = this.rngD * 1.13001 + 0.137;
    let guard = 0;
    while (this.rngD >= 1.0 && guard < 8) {
      this.rngD = this.rngD - 1.0;
      guard = guard + 1;
    };
    if ( this.rngD < 0.0 ) {
      this.rngD = this.rngD + 1.0;
    }
    return this.rngD;
  };
  expD (x) {
    let v = x;
    let invert = false;
    if ( v < 0.0 ) {
      invert = true;
      v = 0.0 - v;
    }
    if ( v > 16.0 ) {
      v = 16.0;
    }
    let term = 1.0;
    let sum = 1.0;
    let n = 1;
    while (n < 18) {
      term = (term * v) / n;
      sum = sum + term;
      n = n + 1;
    };
    if ( invert ) {
      return 1.0 / sum;
    }
    return sum;
  };
  tanhD (x) {
    if ( x > 8.0 ) {
      return 1.0;
    }
    if ( x < 0.0 - 8.0 ) {
      return 0.0 - 1.0;
    }
    const e2 = this.expD((x + x));
    return (e2 - 1.0) / (e2 + 1.0);
  };
  randArr (n, scale) {
    let arr = [];
    let i = 0;
    while (i < n) {
      const v = (this.rnd01() * 2.0 - 1.0) * scale;
      arr.push(v);
      i = i + 1;
    };
    return arr;
  };
  initFresh () {
    this.rng = 1;
    this.rngD = 0.137;
    this.inSize = ErazerLayoutFeat.featCount();
    this.hidSize = 32;
    let names = [];
    names.push("list");
    names.push("form");
    names.push("toolbar");
    names.push("card");
    names.push("nav");
    names.push("property_row");
    names.push("grid");
    names.push("other");
    this.classNames = names;
    let idx = {};
    this.classIndex = idx;
    let c = 0;
    while (c < this.classNames.length) {
      this.classIndex[this.classNames[c]] = c;
      c = c + 1;
    };
    this.outSize = this.classNames.length;
    const s1 = Math.sqrt(6.0 / (this.inSize + this.hidSize));
    const s2 = Math.sqrt(6.0 / (this.hidSize + this.outSize));
    this.w1 = this.randArr((this.inSize * this.hidSize), s1);
    this.b1 = this.randArr(this.hidSize, 0.01);
    this.w2 = this.randArr((this.hidSize * this.outSize), s2);
    this.b2 = this.randArr(this.outSize, 0.01);
    this.stepsDone = 0;
    let mx = [];
    this.memX = mx;
    let my = [];
    this.memY = my;
    this.memCount = 0;
  };
  classId (name) {
    if ( ( typeof(this.classIndex[name] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.classIndex, name) ) ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.classIndex, name) ? this.classIndex[name] : undefined );
      return (v ?? 7);
    }
    return this.outSize - 1;
  };
  ensureClass (name) {
    if ( name.length < 1 ) {
      return this.classId("other");
    }
    if ( ( typeof(this.classIndex[name] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.classIndex, name) ) ) {
      return this.classId(name);
    }
    if ( this.outSize >= 24 ) {
      return this.classId("other");
    }
    const newOut = this.outSize + 1;
    let nw = [];
    let i = 0;
    const oldN = this.w2.length;
    while (i < oldN) {
      nw.push(this.w2[i]);
      i = i + 1;
    };
    const s2 = 0.08;
    let j = 0;
    while (j < this.hidSize) {
      const v = (this.rnd01() * 2.0 - 1.0) * s2;
      nw.push(v);
      j = j + 1;
    };
    this.w2 = nw;
    this.b2.push(0.0);
    this.classNames.push(name);
    this.classIndex[name] = this.outSize;
    this.outSize = newOut;
    return this.outSize - 1;
  };
  forward (x) {
    let h = ErazerLayoutFeat.zeros(this.hidSize);
    let j = 0;
    while (j < this.hidSize) {
      let z = this.b1[j];
      let i = 0;
      while (i < this.inSize) {
        let xv = 0.0;
        if ( i < x.length ) {
          xv = x[i];
        }
        const wt = this.w1[(j * this.inSize + i)];
        z = z + wt * xv;
        i = i + 1;
      };
      h[j] = this.tanhD(z);
      j = j + 1;
    };
    let logits = ErazerLayoutFeat.zeros(this.outSize);
    let k = 0;
    let mx = 0.0;
    while (k < this.outSize) {
      let z2 = this.b2[k];
      let hj = 0;
      while (hj < this.hidSize) {
        const wv = this.w2[(k * this.hidSize + hj)];
        z2 = z2 + wv * h[hj];
        hj = hj + 1;
      };
      logits[k] = z2;
      if ( k == 0 ) {
        mx = z2;
      }
      if ( z2 > mx ) {
        mx = z2;
      }
      k = k + 1;
    };
    let probs = ErazerLayoutFeat.zeros(this.outSize);
    let sum = 0.0;
    let p = 0;
    while (p < this.outSize) {
      const e = this.expD((logits[p] - mx));
      probs[p] = e;
      sum = sum + e;
      p = p + 1;
    };
    if ( sum < 1e-7 ) {
      sum = 1e-7;
    }
    let q = 0;
    while (q < this.outSize) {
      probs[q] = probs[q] / sum;
      q = q + 1;
    };
    return probs;
  };
  trainOne (x, y, lr) {
    let h = ErazerLayoutFeat.zeros(this.hidSize);
    let j = 0;
    while (j < this.hidSize) {
      let z = this.b1[j];
      let i = 0;
      while (i < this.inSize) {
        let xv = 0.0;
        if ( i < x.length ) {
          xv = x[i];
        }
        z = z + this.w1[(j * this.inSize + i)] * xv;
        i = i + 1;
      };
      h[j] = this.tanhD(z);
      j = j + 1;
    };
    let logits = ErazerLayoutFeat.zeros(this.outSize);
    let k = 0;
    let mx = 0.0;
    while (k < this.outSize) {
      let z2 = this.b2[k];
      let hj = 0;
      while (hj < this.hidSize) {
        z2 = z2 + this.w2[(k * this.hidSize + hj)] * h[hj];
        hj = hj + 1;
      };
      logits[k] = z2;
      if ( k == 0 ) {
        mx = z2;
      }
      if ( z2 > mx ) {
        mx = z2;
      }
      k = k + 1;
    };
    let probs = ErazerLayoutFeat.zeros(this.outSize);
    let sum = 0.0;
    let p = 0;
    while (p < this.outSize) {
      const e = this.expD((logits[p] - mx));
      probs[p] = e;
      sum = sum + e;
      p = p + 1;
    };
    if ( sum < 1e-7 ) {
      sum = 1e-7;
    }
    let q = 0;
    while (q < this.outSize) {
      probs[q] = probs[q] / sum;
      q = q + 1;
    };
    let dz2 = ErazerLayoutFeat.zeros(this.outSize);
    let d = 0;
    while (d < this.outSize) {
      let g = probs[d];
      if ( d == y ) {
        g = g - 1.0;
      }
      dz2[d] = g;
      d = d + 1;
    };
    let dh = ErazerLayoutFeat.zeros(this.hidSize);
    let k2 = 0;
    while (k2 < this.outSize) {
      const gk = dz2[k2];
      let hj_1 = 0;
      while (hj_1 < this.hidSize) {
        const idx = k2 * this.hidSize + hj_1;
        const wv = this.w2[idx];
        const hv = h[hj_1];
        dh[hj_1] = dh[hj_1] + wv * gk;
        this.w2[idx] = wv - lr * (gk * hv);
        hj_1 = hj_1 + 1;
      };
      this.b2[k2] = this.b2[k2] - lr * gk;
      k2 = k2 + 1;
    };
    let j2 = 0;
    while (j2 < this.hidSize) {
      const hv_1 = h[j2];
      const dz1 = dh[j2] * (1.0 - hv_1 * hv_1);
      this.b1[j2] = this.b1[j2] - lr * dz1;
      let i2 = 0;
      while (i2 < this.inSize) {
        let xv_1 = 0.0;
        if ( i2 < x.length ) {
          xv_1 = x[i2];
        }
        const idx1 = j2 * this.inSize + i2;
        this.w1[idx1] = this.w1[idx1] - lr * (dz1 * xv_1);
        i2 = i2 + 1;
      };
      j2 = j2 + 1;
    };
    this.stepsDone = this.stepsDone + 1;
  };
  predict (boxes) {
    const n = boxes.length;
    if ( n < 2 ) {
      const miss = new ErazerLayoutGuess();
      miss.type = "other";
      miss.confidence = 0.0;
      miss.items = n;
      return miss;
    }
    const x = ErazerLayoutFeat.features(boxes);
    const p = this.forward(x);
    let best = 0;
    let bestP = p[0];
    let k = 1;
    while (k < this.outSize) {
      const pk = p[k];
      if ( pk > bestP ) {
        bestP = pk;
        best = k;
      }
      k = k + 1;
    };
    let name = "other";
    if ( best < this.classNames.length ) {
      name = this.classNames[best];
    }
    return ErazerLayoutFeat.describe(boxes, name, bestP);
  };
  remember (x, y) {
    if ( this.memCount >= this.memCap ) {
      let nx = [];
      let ny = [];
      const drop = 8;
      let i = drop;
      while (i < this.memCount) {
        let k = 0;
        while (k < this.inSize) {
          nx.push(this.memX[(i * this.inSize + k)]);
          k = k + 1;
        };
        ny.push(this.memY[i]);
        i = i + 1;
      };
      this.memX = nx;
      this.memY = ny;
      this.memCount = this.memCount - drop;
    }
    let j = 0;
    while (j < this.inSize) {
      let xv = 0.0;
      if ( j < x.length ) {
        xv = x[j];
      }
      this.memX.push(xv);
      j = j + 1;
    };
    this.memY.push(y);
    this.memCount = this.memCount + 1;
  };
  replay (lr) {
    let i = 0;
    while (i < this.memCount) {
      let x = [];
      let k = 0;
      while (k < this.inSize) {
        x.push(this.memX[(i * this.inSize + k)]);
        k = k + 1;
      };
      const y = this.memY[i];
      this.trainOne(x, y, lr);
      i = i + 1;
    };
  };
  fitAll (groups, labels, epochs) {
    const n = groups.length;
    let e = 0;
    const lr = 0.07;
    while (e < epochs) {
      let i = 0;
      while (i < n) {
        const grp = groups[i];
        let lab = "other";
        if ( i < labels.length ) {
          lab = labels[i];
        }
        const y = this.ensureClass(lab);
        if ( grp.boxes.length >= 2 ) {
          const x = ErazerLayoutFeat.features(grp.boxes);
          this.trainOne(x, y, lr);
          if ( e == 0 ) {
            this.remember(x, y);
          }
        }
        i = i + 1;
      };
      e = e + 1;
    };
    this.replay(0.05);
  };
  teach (boxes, label, epochs) {
    const y = this.ensureClass(label);
    const otherId = this.ensureClass("other");
    const pos = ErazerLayoutFeat.augment(boxes);
    const neg = ErazerLayoutFeat.hardNegatives(boxes);
    let e = 0;
    const lr = 0.08;
    while (e < epochs) {
      let i = 0;
      while (i < pos.length) {
        const grp = pos[i];
        if ( grp.boxes.length >= 2 ) {
          const x = ErazerLayoutFeat.features(grp.boxes);
          this.trainOne(x, y, lr);
          if ( e == 0 ) {
            this.remember(x, y);
          }
        }
        i = i + 1;
      };
      let n = 0;
      while (n < neg.length) {
        const ng = neg[n];
        if ( ng.boxes.length >= 2 ) {
          const x2 = ErazerLayoutFeat.features(ng.boxes);
          this.trainOne(x2, otherId, lr);
          if ( e == 0 ) {
            this.remember(x2, otherId);
          }
        }
        n = n + 1;
      };
      this.replay(0.04);
      e = e + 1;
    };
  };
  nms (xs) {
    const n = xs.length;
    let order = [];
    let i = 0;
    while (i < n) {
      order.push(i);
      i = i + 1;
    };
    let a = 1;
    while (a < n) {
      let j = a;
      while (j > 0) {
        const cur = order[j];
        const prev = order[(j - 1)];
        const gc = xs[cur];
        const gp = xs[prev];
        if ( gc.confidence > gp.confidence ) {
          order[j] = prev;
          order[j - 1] = cur;
          j = j - 1;
        } else {
          j = 0;
        }
      };
      a = a + 1;
    };
    let kept = [];
    let k = 0;
    while (k < n) {
      const idx = order[k];
      const g = xs[idx];
      let ok = true;
      let t = 0;
      while (t < kept.length) {
        const other = kept[t];
        const ov = this.memberOverlap(g, other);
        if ( ov >= 0.6 ) {
          ok = false;
          t = kept.length;
        } else {
          t = t + 1;
        }
      };
      if ( ok ) {
        kept.push(g);
      }
      k = k + 1;
    };
    return kept;
  };
  memberOverlap (a, b) {
    const na = a.members.length;
    const nb = b.members.length;
    if ( na <= 0 || nb <= 0 ) {
      return 0.0;
    }
    let hit = 0;
    let i = 0;
    while (i < na) {
      const id = a.members[i];
      let j = 0;
      while (j < nb) {
        if ( b.members[j] == id ) {
          hit = hit + 1;
          j = nb;
        } else {
          j = j + 1;
        }
      };
      i = i + 1;
    };
    let den = na;
    if ( nb < den ) {
      den = nb;
    }
    if ( den <= 0 ) {
      return 0.0;
    }
    return hit / den;
  };
  scan (boxes) {
    const cands = ErazerLayoutFeat.candidates(boxes);
    let raw = [];
    let i = 0;
    while (i < cands.length) {
      const grp = cands[i];
      const g = this.predict(grp.boxes);
      if ( g.confidence >= 0.34 && g.type != "other" ) {
        raw.push(g);
      }
      i = i + 1;
    };
    return this.nms(raw);
  };
  seedFromSynthetics () {
    const em = 16.0;
    let groups = [];
    let labels = [];
    this.addSeed(groups, labels, this.synthList(4, em), "list");
    this.addSeed(groups, labels, this.synthList(5, em), "list");
    this.addSeed(groups, labels, this.synthForm(em), "form");
    this.addSeed(groups, labels, this.synthToolbar(4, em), "toolbar");
    this.addSeed(groups, labels, this.synthNav(em), "nav");
    this.addSeed(groups, labels, this.synthRows(em), "property_row");
    this.addSeed(groups, labels, this.synthGrid(em), "grid");
    this.addSeed(groups, labels, this.synthCard(em), "card");
    this.fitAll(groups, labels, 10);
  };
  addSeed (groups, labels, boxes, label) {
    const pos = ErazerLayoutFeat.augment(boxes);
    let i = 0;
    while (i < pos.length) {
      groups.push(pos[i]);
      labels.push(label);
      i = i + 1;
    };
    const neg = ErazerLayoutFeat.hardNegatives(boxes);
    let n = 0;
    while (n < neg.length) {
      groups.push(neg[n]);
      labels.push("other");
      n = n + 1;
    };
  };
  synthList (n, em) {
    let out = [];
    let i = 0;
    while (i < n) {
      const y = i * (em * 1.6);
      const b = ErazerLayoutBox.of("label", 0.0, y, (8.2 * em), (1.1 * em), em);
      b.index = i;
      out.push(b);
      i = i + 1;
    };
    return out;
  };
  synthForm (em) {
    let out = [];
    let i = 0;
    while (i < 2) {
      const y = i * (em * 4.4);
      const lab = ErazerLayoutBox.of(
        "label",
        0.0,
        y,
        (6.0 * em),
        (1.1 * em),
        em
      );
      lab.index = i * 2;
      const field = ErazerLayoutBox.of(
        "textfield",
        0.0,
        (y + 1.5 * em),
        (16.0 * em),
        (2.0 * em),
        em
      );
      field.index = i * 2 + 1;
      out.push(lab);
      out.push(field);
      i = i + 1;
    };
    const btn = ErazerLayoutBox.of(
      "button",
      (10.0 * em),
      (9.2 * em),
      (6.0 * em),
      (2.0 * em),
      em
    );
    btn.index = 4;
    out.push(btn);
    return out;
  };
  synthToolbar (n, em) {
    let out = [];
    let i = 0;
    while (i < n) {
      const x = i * (em * 5.2);
      const b = ErazerLayoutBox.of(
        "button",
        x,
        0.0,
        (4.4 * em),
        (2.2 * em),
        em
      );
      b.index = i;
      out.push(b);
      i = i + 1;
    };
    return out;
  };
  synthNav (em) {
    let out = [];
    let i = 0;
    while (i < 4) {
      const y = i * (em * 2.2);
      const ic = ErazerLayoutBox.of("icon", 0.0, y, (1.2 * em), (1.2 * em), em);
      ic.index = i * 2;
      const lab = ErazerLayoutBox.of(
        "label",
        (1.6 * em),
        y,
        (5.0 * em),
        (1.2 * em),
        em
      );
      lab.index = i * 2 + 1;
      out.push(ic);
      out.push(lab);
      i = i + 1;
    };
    return out;
  };
  synthRows (em) {
    let out = [];
    let i = 0;
    while (i < 3) {
      const y = i * (em * 2.0);
      const lab = ErazerLayoutBox.of(
        "label",
        0.0,
        y,
        (8.0 * em),
        (1.1 * em),
        em
      );
      lab.index = i * 2;
      const ck = ErazerLayoutBox.of(
        "checkbox",
        (10.0 * em),
        y,
        (1.1 * em),
        (1.1 * em),
        em
      );
      ck.index = i * 2 + 1;
      out.push(lab);
      out.push(ck);
      i = i + 1;
    };
    return out;
  };
  synthGrid (em) {
    let out = [];
    let i = 0;
    while (i < 3) {
      const x = i * (em * 9.0);
      const b = ErazerLayoutBox.of("panel", x, 0.0, (8.0 * em), (7.0 * em), em);
      b.index = i;
      out.push(b);
      i = i + 1;
    };
    return out;
  };
  synthCard (em) {
    let out = [];
    const panel = ErazerLayoutBox.of(
      "panel",
      0.0,
      0.0,
      (12.0 * em),
      (10.0 * em),
      em
    );
    panel.index = 0;
    const title = ErazerLayoutBox.of(
      "label",
      (0.8 * em),
      (0.8 * em),
      (10.0 * em),
      (1.3 * em),
      em
    );
    title.index = 1;
    const body = ErazerLayoutBox.of(
      "label",
      (0.8 * em),
      (2.6 * em),
      (9.0 * em),
      (1.1 * em),
      em
    );
    body.index = 2;
    const btn = ErazerLayoutBox.of(
      "button",
      (0.8 * em),
      (7.2 * em),
      (4.5 * em),
      (1.8 * em),
      em
    );
    btn.index = 3;
    out.push(panel);
    out.push(title);
    out.push(body);
    out.push(btn);
    return out;
  };
  dumpWeights () {
    let s = ((((("v1 " + (this.inSize.toString())) + " ") + (this.hidSize.toString())) + " ") + (this.outSize.toString())) + " ";
    let i = 0;
    while (i < this.classNames.length) {
      if ( i > 0 ) {
        s = s + ",";
      }
      s = s + this.classNames[i];
      i = i + 1;
    };
    s = s + " ";
    s = s + this.dumpArr(this.w1);
    s = s + " ";
    s = s + this.dumpArr(this.b1);
    s = s + " ";
    s = s + this.dumpArr(this.w2);
    s = s + " ";
    s = s + this.dumpArr(this.b2);
    return s;
  };
  dumpArr (arr) {
    let s = "";
    let i = 0;
    while (i < arr.length) {
      if ( i > 0 ) {
        s = s + ",";
      }
      s = s + (arr[i].toString());
      i = i + 1;
    };
    return s;
  };
  loadWeights (raw) {
    const parts = this.splitSpace(raw);
    if ( parts.length < 9 ) {
      return false;
    }
    if ( parts[0] != "v1" ) {
      return false;
    }
    const ins = this.parseIntTok(parts[1]);
    const hid = this.parseIntTok(parts[2]);
    const outs = this.parseIntTok(parts[3]);
    if ( ins != this.inSize || hid != this.hidSize ) {
      return false;
    }
    const names = this.splitComma(parts[4]);
    if ( names.length != outs ) {
      return false;
    }
    const nw1 = this.parseCsv(parts[5]);
    const nb1 = this.parseCsv(parts[6]);
    const nw2 = this.parseCsv(parts[7]);
    const nb2 = this.parseCsv(parts[8]);
    if ( nw1.length != ins * hid ) {
      return false;
    }
    if ( nb1.length != hid ) {
      return false;
    }
    if ( nw2.length != hid * outs ) {
      return false;
    }
    if ( nb2.length != outs ) {
      return false;
    }
    this.w1 = nw1;
    this.b1 = nb1;
    this.w2 = nw2;
    this.b2 = nb2;
    this.classNames = names;
    this.outSize = outs;
    let idx = {};
    this.classIndex = idx;
    let c = 0;
    while (c < outs) {
      this.classIndex[names[c]] = c;
      c = c + 1;
    };
    return true;
  };
  parseIntTok (s) {
    let v = 0;
    let i = 0;
    const n = s.length;
    while (i < n) {
      const d = "0123456789".indexOf(s.substring(i, i + 1 ));
      if ( d < 0 ) {
        i = n;
      } else {
        v = v * 10 + d;
        i = i + 1;
      }
    };
    return v;
  };
  parseNum (s) {
    const n = s.length;
    let i = 0;
    let sign = 1.0;
    if ( n > 0 ) {
      if ( s.substring(0, 1 ) == "-" ) {
        sign = 0.0 - 1.0;
        i = 1;
      }
    }
    let ip = 0.0;
    while (i < n) {
      const ch = s.substring(i, i + 1 );
      if ( ch == "." ) {
        i = n;
      } else {
        const d = "0123456789".indexOf(ch);
        if ( d < 0 ) {
          i = n;
        } else {
          ip = ip * 10.0 + d;
          i = i + 1;
        }
      }
    };
    const dot = s.indexOf(".");
    let frac = 0.0;
    if ( dot >= 0 ) {
      let scale = 0.1;
      let j = dot + 1;
      while (j < n) {
        const d2 = "0123456789".indexOf(s.substring(j, j + 1 ));
        if ( d2 < 0 ) {
          j = n;
        } else {
          frac = frac + scale * d2;
          scale = scale * 0.1;
          j = j + 1;
        }
      };
    }
    let value = sign * (ip + frac);
    let epos = s.indexOf("e");
    if ( epos < 0 ) {
      epos = s.indexOf("E");
    }
    if ( epos >= 0 ) {
      let esign = 1.0;
      let k = epos + 1;
      if ( k < n ) {
        const ec = s.substring(k, k + 1 );
        if ( ec == "-" ) {
          esign = 0.0 - 1.0;
          k = k + 1;
        } else {
          if ( ec == "+" ) {
            k = k + 1;
          }
        }
      }
      let ev = 0;
      while (k < n) {
        const d3 = "0123456789".indexOf(s.substring(k, k + 1 ));
        if ( d3 < 0 ) {
          k = n;
        } else {
          ev = ev * 10 + d3;
          k = k + 1;
        }
      };
      if ( ev > 60 ) {
        ev = 60;
      }
      let mul = 1.0;
      let t = 0;
      while (t < ev) {
        mul = mul * 10.0;
        t = t + 1;
      };
      if ( esign < 0.0 ) {
        value = value / mul;
      } else {
        value = value * mul;
      }
    }
    return value;
  };
  parseCsv (s) {
    const parts = this.splitComma(s);
    let out = [];
    let i = 0;
    while (i < parts.length) {
      const tok = parts[i];
      if ( tok.length > 0 ) {
        out.push(this.parseNum(tok));
      }
      i = i + 1;
    };
    return out;
  };
  splitSpace (s) {
    let out = [];
    let cur = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const ch = s.substring(i, i + 1 );
      if ( ch == " " ) {
        if ( cur.length > 0 ) {
          out.push(cur);
          cur = "";
        }
      } else {
        cur = cur + ch;
      }
      i = i + 1;
    };
    if ( cur.length > 0 ) {
      out.push(cur);
    }
    return out;
  };
  toJson (boxes, guesses) {
    let s = "{\"boxes\":[";
    let i = 0;
    while (i < boxes.length) {
      if ( i > 0 ) {
        s = s + ",";
      }
      const b = boxes[i];
      s = (s + "{\"i\":") + (b.index.toString());
      s = ((s + ",\"type\":\"") + b.type) + "\"";
      s = (s + ",\"x\":") + (b.x.toString());
      s = (s + ",\"y\":") + (b.y.toString());
      s = (s + ",\"w\":") + (b.w.toString());
      s = (s + ",\"h\":") + (b.h.toString());
      s = ((s + ",\"fontSize\":") + (b.fontSize.toString())) + "}";
      i = i + 1;
    };
    s = s + "],\"groups\":[";
    let g = 0;
    while (g < guesses.length) {
      if ( g > 0 ) {
        s = s + ",";
      }
      const u = guesses[g];
      s = s + this.guessJson(u);
      g = g + 1;
    };
    s = s + "]}";
    return s;
  };
  guessJson (u) {
    let s = "{\"type\":\"";
    s = (s + u.type) + "\"";
    s = (s + ",\"confidence\":") + (u.confidence.toString());
    s = ((s + ",\"axis\":\"") + u.axis) + "\"";
    s = (s + ",\"items\":") + (u.items.toString());
    s = ((s + ",\"alignment\":\"") + u.alignment) + "\"";
    s = (s + ",\"spacing\":{\"mean\":") + (u.spacingMean.toString());
    s = ((s + ",\"unit\":\"em\",\"variance\":") + (u.spacingVar.toString())) + "}";
    s = s + ",\"pattern\":[";
    const parts = this.splitComma(u.pattern);
    let p = 0;
    while (p < parts.length) {
      if ( p > 0 ) {
        s = s + ",";
      }
      s = ((s + "\"") + parts[p]) + "\"";
      p = p + 1;
    };
    s = s + "],\"members\":[";
    let m = 0;
    while (m < u.members.length) {
      if ( m > 0 ) {
        s = s + ",";
      }
      s = s + (u.members[m].toString());
      m = m + 1;
    };
    s = (s + "],\"x\":") + (u.x.toString());
    s = (s + ",\"y\":") + (u.y.toString());
    s = (s + ",\"w\":") + (u.w.toString());
    s = ((s + ",\"h\":") + (u.h.toString())) + "}";
    return s;
  };
  splitComma (s) {
    let out = [];
    if ( s.length == 0 ) {
      return out;
    }
    let cur = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const ch = s.substring(i, i + 1 );
      if ( ch == "," ) {
        out.push(cur);
        cur = "";
      } else {
        cur = cur + ch;
      }
      i = i + 1;
    };
    out.push(cur);
    return out;
  };
}
ErazerLayoutNet.shared = function() {
  const store = ErazerLayoutStore.__singleton();
  return store.ensureSeeded();
};
ErazerLayoutNet.current = function() {
  const store = ErazerLayoutStore.__singleton();
  return store.ensure();
};
ErazerLayoutNet.adoptWeights = function(raw) {
  const store = ErazerLayoutStore.__singleton();
  const n = store.ensure();
  if ( n.loadWeights(raw) ) {
    store.seeded = true;
    return true;
  }
  return false;
};
ErazerLayoutNet.boxesFromTree = function(root, pageW, pageH) {
  return ErazerLayoutFeat.collectTree(root, pageW, pageH);
};
ErazerLayoutNet.boxesFromList = function(type, xs, ys, ws, hs, font) {
  let out = [];
  const n = xs.length;
  let i = 0;
  while (i < n) {
    const b = ErazerLayoutBox.of(type, xs[i], ys[i], ws[i], hs[i], font);
    b.index = i;
    out.push(b);
    i = i + 1;
  };
  return out;
};
class ErazerLayoutStore  {
  constructor() {
    if (ErazerLayoutStore.__singleton_instance != null) {
      return ErazerLayoutStore.__singleton_instance;
    }
    this.net = undefined;
    this.seeded = false;
    ErazerLayoutStore.__singleton_instance = this;
  }
  ensure () {
    if ( typeof(this.net) != "undefined" ) {
      const kept = this.net;
      return kept;
    }
    const created = new ErazerLayoutNet();
    this.net = created;
    return created;
  };
  ensureSeeded () {
    const n = this.ensure();
    if ( this.seeded == false ) {
      n.seedFromSynthetics();
      this.seeded = true;
    }
    return n;
  };
}
ErazerLayoutStore.__singleton_instance = null;
ErazerLayoutStore.__singleton = function() {
  if (ErazerLayoutStore.__singleton_instance == null) {
    ErazerLayoutStore.__singleton_instance = new ErazerLayoutStore();
  }
  return ErazerLayoutStore.__singleton_instance;
};
class EvgTracePoint  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
  }
}
EvgTracePoint.of = function(x, y) {
  const p = new EvgTracePoint();
  p.x = x;
  p.y = y;
  return p;
};
EvgTracePoint.ofInt = function(x, y) {
  const p = new EvgTracePoint();
  p.x = x;
  p.y = y;
  return p;
};
class EvgTraceRing  {
  constructor() {
    this.pts = [];
    this.area = 0;
    this.sign = "+";
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
    let p_1 = [];
    this.pts = p_1;
  }
  len () {
    return this.pts.length;
  };
}
class EvgTraceLayer  {
  constructor() {
    this.fillHex = "#000000";
    this.pathData = "";
    this.ringCount = 0;
    this.commandCount = 0;
    this.fillKind = "flat";
    this.gx0 = 0.0;
    this.gy0 = 0.0;
    this.gx1 = 0.0;
    this.gy1 = 0.0;
    this.stopA = "#000000";
    this.stopB = "#000000";
  }
}
class EvgTraceOptions  {
  constructor() {
    this.turdsize = 2;
    this.alphamax = 1.0;
    this.turnpolicy = "minority";
    this.optcurve = true;
    this.opttolerance = 0.2;
    this.threshold = 128;
    this.blackOnWhite = true;
    this.fillHex = "#000000";
    this.colorCount = 1;
    this.skipLuma = 250;
    this.flatTolerance = 12;
    this.edgeSnap = true;
    this.snapRatio = 1.5;
    this.lumaWeight = 3;
    this.colorSpace = "rgb";
    this.paletteMode = "auto";
    this.paletteHex = [];
    this.paletteBias = "area";
    this.paletteChroma = 0;
    this.paletteMute = 100;
    this.paletteTint = 0;
    this.paletteWarm = 0;
    this.paletteContrast = 100;
    this.minColorDelta = 10;
    this.contourMode = "off";
    this.overlaySimilar = 8;
    this.overlayFollowBase = true;
    this.detailSwatches = 4;
    this.detailSpread = 120;
    this.detailRadius = 2;
    this.detailBoost = 4;
    this.detailTrueColor = false;
    this.detailColors = 4;
    this.detailMinShare = 8;
    this.detailColorMerge = 16;
    this.detailColorMax = 12;
    this.edgeMinRun = 3;
    this.contourEdge = 3;
    this.contourSpread = 48;
    this.gradientFill = false;
    this.gradientGain = 15;
    this.layerMode = "stacked";
    this.pathFormat = "compact";
    this.pathPrecision = 2;
    this.smooth = 0;
    this.minRegion = 6;
    this.absorbContrast = 40;
    this.bgMode = "auto";
    this.bgColor = "#ffffff";
    this.bgTolerance = 24;
    let ph = [];
    this.paletteHex = ph;
  }
}
EvgTraceOptions.defaults = function() {
  return new EvgTraceOptions();
};
EvgTraceOptions.preset = function(name) {
  const o = new EvgTraceOptions();
  if ( name == "lineart" ) {
    o.colorCount = 1;
    o.threshold = 0 - 1;
    o.smooth = 0;
    o.minRegion = 0;
    return o;
  }
  if ( name == "poster" ) {
    o.colorCount = 8;
    o.smooth = 0;
    o.minRegion = 4;
    o.absorbContrast = 24;
    o.minColorDelta = 12;
    return o;
  }
  if ( name == "photo" ) {
    o.colorCount = 16;
    o.smooth = 1;
    o.minRegion = 8;
    o.absorbContrast = 56;
    o.paletteBias = "area";
    return o;
  }
  if ( name == "broken" ) {
    o.colorCount = 8;
    o.smooth = 0;
    o.minRegion = 4;
    o.absorbContrast = 24;
    o.paletteBias = "distinct";
    o.paletteChroma = 300;
    o.paletteMute = 130;
    o.paletteTint = 30;
    return o;
  }
  if ( name == "print" ) {
    o.colorCount = 16;
    o.smooth = 0;
    o.minRegion = 6;
    o.absorbContrast = 32;
    return o;
  }
  return o;
};
class EvgBinaryBitmap  {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.data = [];
    let d_2 = [];
    this.data = d_2;
  }
  size () {
    return this.data.length;
  };
  at (x, y) {
    if ( x < 0 ) {
      return false;
    }
    if ( y < 0 ) {
      return false;
    }
    if ( x >= this.w ) {
      return false;
    }
    if ( y >= this.h ) {
      return false;
    }
    const v = this.data[(y * this.w + x)];
    return v == 1;
  };
  setBit (x, y, on) {
    if ( x < 0 ) {
      return;
    }
    if ( y < 0 ) {
      return;
    }
    if ( x >= this.w ) {
      return;
    }
    if ( y >= this.h ) {
      return;
    }
    if ( on ) {
      this.data[y * this.w + x] = 1;
    } else {
      this.data[y * this.w + x] = 0;
    }
  };
  flip (x, y) {
    if ( this.at(x, y) ) {
      this.setBit(x, y, false);
    } else {
      this.setBit(x, y, true);
    }
  };
  copy () {
    const bm = new EvgBinaryBitmap();
    bm.w = this.w;
    bm.h = this.h;
    let d = [];
    const n = this.data.length;
    let i = 0;
    while (i < n) {
      d.push(this.data[i]);
      i = i + 1;
    };
    bm.data = d;
    return bm;
  };
  findNext (start) {
    const n = this.data.length;
    let i = start;
    while (i < n) {
      if ( this.data[i] == 1 ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
}
EvgBinaryBitmap.create = function(w, h) {
  const bm = new EvgBinaryBitmap();
  bm.w = w;
  bm.h = h;
  let d = [];
  const n = w * h;
  let i = 0;
  while (i < n) {
    d.push(0);
    i = i + 1;
  };
  bm.data = d;
  return bm;
};
class EvgOklab  {
  constructor() {
    this.l = 0.0;
    this.a = 0.0;
    this.b = 0.0;
  }
  setFrom (lin, red, green, blue) {
    const lr = lin[red];
    const lg = lin[green];
    const lb = lin[blue];
    const cl = (0.4122214708 * lr + 0.5363325363 * lg) + 0.0514459929 * lb;
    const cm = (0.2119034982 * lr + 0.6806995451 * lg) + 0.1073969566 * lb;
    const cs = (0.0883024619 * lr + 0.2817188376 * lg) + 0.6299787005 * lb;
    const l_ = EvgTraceColor.cbrt(cl);
    const m_ = EvgTraceColor.cbrt(cm);
    const s_ = EvgTraceColor.cbrt(cs);
    this.l = (0.2104542553 * l_ + 0.793617785 * m_) - 0.0040720468 * s_;
    this.a = (1.9779984951 * l_ - 2.428592205 * m_) + 0.4505937099 * s_;
    this.b = (0.0259040371 * l_ + 0.7827717662 * m_) - 0.808675766 * s_;
  };
}
class EvgTraceColor  {
  constructor() {
  }
}
EvgTraceColor.okScale = function() {
  return 390150.0;
};
EvgTraceColor.cbrt = function(a) {
  if ( a <= 0.0 ) {
    return 0.0;
  }
  const s1 = Math.sqrt(a);
  const s2 = Math.sqrt(s1);
  const s3 = Math.sqrt(s2);
  let y = s2 * s3;
  let i = 0;
  while (i < 8) {
    const y2 = y * y;
    const q = a / y2;
    y = (2.0 * y + q) / 3.0;
    i = i + 1;
  };
  return y;
};
EvgTraceColor.root5 = function(a) {
  if ( a <= 0.0 ) {
    return 0.0;
  }
  const s1 = Math.sqrt(a);
  const s2 = Math.sqrt(s1);
  const s3 = Math.sqrt(s2);
  const s4 = Math.sqrt(s3);
  let y = s3 * s4;
  let i = 0;
  while (i < 10) {
    const y2 = y * y;
    const y4 = y2 * y2;
    const q = a / y4;
    const step = (q - y) / 5.0;
    y = y + step;
    i = i + 1;
  };
  return y;
};
EvgTraceColor.pow24 = function(x) {
  if ( x <= 0.0 ) {
    return 0.0;
  }
  const r5 = EvgTraceColor.root5(x);
  const t = r5 * r5;
  const sq = x * x;
  return sq * t;
};
EvgTraceColor.buildLinearTable = function() {
  let t = [];
  let i = 0;
  while (i < 256) {
    const c = i / 255.0;
    if ( c <= 0.04045 ) {
      const lo = c / 12.92;
      t.push(lo);
    } else {
      const u = (c + 0.055) / 1.055;
      const hi = EvgTraceColor.pow24(u);
      t.push(hi);
    }
    i = i + 1;
  };
  return t;
};
EvgTraceColor.dist2 = function(p, q) {
  const dl = p.l - q.l;
  const da = p.a - q.a;
  const db = p.b - q.b;
  const raw = (dl * dl + da * da) + db * db;
  const s = EvgTraceColor.okScale();
  return raw * s;
};
EvgTraceColor.pow24inv = function(x) {
  if ( x <= 0.0 ) {
    return 0.0;
  }
  let y = Math.sqrt(x);
  let i = 0;
  while (i < 12) {
    const f = EvgTraceColor.pow24(y);
    if ( f <= 0.0 ) {
      return y;
    }
    const num = (f - x) * y;
    const den = 2.4 * f;
    y = y - num / den;
    if ( y <= 0.0 ) {
      return 0.0;
    }
    i = i + 1;
  };
  return y;
};
EvgTraceColor.linearToSrgb = function(v) {
  const c = v;
  if ( c <= 0.0 ) {
    return 0;
  }
  if ( c >= 1.0 ) {
    return 255;
  }
  let enc = 0.0;
  if ( c <= 0.0031308 ) {
    enc = 12.92 * c;
  } else {
    const e = EvgTraceColor.pow24inv(c);
    enc = 1.055 * e - 0.055;
  }
  const n = Math.floor( enc * 255.0 + 0.5);
  if ( n < 0 ) {
    return 0;
  }
  if ( n > 255 ) {
    return 255;
  }
  return n;
};
EvgTraceColor.srgbOf = function(l, a, b) {
  const l_ = (l + 0.3963377774 * a) + 0.2158037573 * b;
  const m_ = (l - 0.1055613458 * a) - 0.0638541728 * b;
  const s_ = (l - 0.0894841775 * a) - 1.291485548 * b;
  const L = (l_ * l_) * l_;
  const M = (m_ * m_) * m_;
  const S = (s_ * s_) * s_;
  const lr = (4.0767416621 * L - 3.3077115913 * M) + 0.2309699292 * S;
  const lg = ((0.0 - 1.2684380046) * L + 2.6097574011 * M) - 0.3413193965 * S;
  const lb = ((0.0 - 0.0041960863) * L - 0.7034186147 * M) + 1.707614701 * S;
  let out = [];
  out.push(EvgTraceColor.linearToSrgb(lr));
  out.push(EvgTraceColor.linearToSrgb(lg));
  out.push(EvgTraceColor.linearToSrgb(lb));
  return out;
};
class PathCommand  {
  constructor() {
    this.type = "";
    this.x = 0.0;
    this.y = 0.0;
    this.x1 = 0.0;
    this.y1 = 0.0;
    this.x2 = 0.0;
    this.y2 = 0.0;
    this.rx = 0.0;     /* note: unused */
    this.ry = 0.0;     /* note: unused */
    this.rotation = 0.0;
    this.largeArc = false;     /* note: unused */
    this.sweep = false;     /* note: unused */
  }
}
class PathRing  {
  constructor() {
    this.pts = [];
    this.closed = false;
    let p_2 = [];
    this.pts = p_2;
  }
  pointCount () {
    return ((this.pts.length / 2) | 0);
  };
}
class PathBounds  {
  constructor() {
    this.minX = 0.0;
    this.minY = 0.0;
    this.maxX = 0.0;
    this.maxY = 0.0;
    this.width = 0.0;
    this.height = 0.0;
  }
}
class SVGPathParser  {
  constructor() {
    this.pathData = "";
    this.i = 0;
    this.__len = 0;
    this.currentX = 0.0;
    this.currentY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    this.commands = [];
    this.bounds = undefined;
    this.lastCtrlX = 0.0;
    this.lastCtrlY = 0.0;
    this.lastCtrlKind = "";
    this.errors = [];
    this.truncated = false;
    this.numFail = false;
    this.plain = false;
    let emptyCommands = [];
    this.commands = emptyCommands;
    let emptyErrors = [];
    this.errors = emptyErrors;
    this.bounds = new PathBounds();
  }
  getErrors () {
    return this.errors;
  };
  hasErrors () {
    return this.errors.length > 0;
  };
  errorSummary () {
    const n = this.errors.length;
    if ( n == 0 ) {
      return "";
    }
    let out = this.errors[0];
    let k = 1;
    while (k < n) {
      out = (out + "; ") + this.errors[k];
      k = k + 1;
    };
    return out;
  };
  addError (msg) {
    this.errors.push((msg + " at offset ") + (this.i.toString()));
  };
  parse (data) {
    this.pathData = data;
    this.i = 0;
    this.__len = data.length;
    this.currentX = 0.0;
    this.currentY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    let emptyCommands = [];
    this.commands = emptyCommands;
    let emptyErrors = [];
    this.errors = emptyErrors;
    this.truncated = false;
    this.lastCtrlKind = "";
    let pending = 0;
    while (this.i < this.__len) {
      this.skipWhitespace();
      if ( this.i >= this.__len ) {
        break;
      }
      const ch = this.pathData.charCodeAt(this.i );
      const chInt = ch;
      let isLetter = false;
      if ( chInt >= 65 && chInt <= 90 ) {
        isLetter = true;
      }
      if ( chInt >= 97 && chInt <= 122 ) {
        isLetter = true;
      }
      if ( isLetter ) {
        pending = chInt;
        this.i = this.i + 1;
      } else {
        if ( pending == 0 ) {
          this.addError("path data must begin with a command letter");
          this.truncated = true;
          break;
        }
        if ( pending == 77 ) {
          pending = 76;
        }
        if ( pending == 109 ) {
          pending = 108;
        }
        if ( pending == 90 ) {
          this.addError("unexpected number after closepath");
          this.truncated = true;
          break;
        }
        if ( pending == 122 ) {
          this.addError("unexpected number after closepath");
          this.truncated = true;
          break;
        }
      }
      const ok = this.parseCommand(pending);
      if ( ok == false ) {
        this.truncated = true;
        break;
      }
    };
    this.calculateBounds();
  };
  hasNumberAhead () {
    this.skipWhitespace();
    if ( this.i >= this.__len ) {
      return false;
    }
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( chInt >= 48 && chInt <= 57 ) {
      return true;
    }
    if ( chInt == 46 ) {
      return true;
    }
    if ( chInt == 45 ) {
      return true;
    }
    if ( chInt == 43 ) {
      return true;
    }
    return false;
  };
  parseFlag () {
    this.skipWhitespace();
    if ( this.i >= this.__len ) {
      this.numFail = true;
      this.addError("arc flag expected");
      return false;
    }
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( chInt == 48 ) {
      this.i = this.i + 1;
      return false;
    }
    if ( chInt == 49 ) {
      this.i = this.i + 1;
      return true;
    }
    this.numFail = true;
    this.addError("arc flag must be 0 or 1");
    return false;
  };
  skipWhitespace () {
    while (this.i < this.__len) {
      const ch = this.pathData.charCodeAt(this.i );
      const chInt = ch;
      if ( (((chInt == 32 || chInt == 9) || chInt == 10) || chInt == 13) || chInt == 44 ) {
        this.i = this.i + 1;
      } else {
        break;
      }
    };
  };
  parseNumber () {
    this.skipWhitespace();
    const start = this.i;
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( chInt == 45 || chInt == 43 ) {
      this.i = this.i + 1;
    }
    while (this.i < this.__len) {
      const ch2 = this.pathData.charCodeAt(this.i );
      const chInt2 = ch2;
      if ( chInt2 >= 48 && chInt2 <= 57 ) {
        this.i = this.i + 1;
      } else {
        break;
      }
    };
    if ( this.i < this.__len ) {
      const ch3 = this.pathData.charCodeAt(this.i );
      const chInt3 = ch3;
      if ( chInt3 == 46 ) {
        this.i = this.i + 1;
        while (this.i < this.__len) {
          const ch4 = this.pathData.charCodeAt(this.i );
          const chInt4 = ch4;
          if ( chInt4 >= 48 && chInt4 <= 57 ) {
            this.i = this.i + 1;
          } else {
            break;
          }
        };
      }
    }
    if ( this.i < this.__len ) {
      const ch5 = this.pathData.charCodeAt(this.i );
      const chInt5 = ch5;
      if ( chInt5 == 101 || chInt5 == 69 ) {
        this.i = this.i + 1;
        if ( this.i < this.__len ) {
          const ch6 = this.pathData.charCodeAt(this.i );
          const chInt6 = ch6;
          if ( chInt6 == 45 || chInt6 == 43 ) {
            this.i = this.i + 1;
          }
        }
        while (this.i < this.__len) {
          const ch7 = this.pathData.charCodeAt(this.i );
          const chInt7 = ch7;
          if ( chInt7 >= 48 && chInt7 <= 57 ) {
            this.i = this.i + 1;
          } else {
            break;
          }
        };
      }
    }
    const numStr = this.pathData.substring(start, this.i );
    const parsed = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(parsed) != "undefined" ) {
      return parsed;
    }
    this.numFail = true;
    this.addError("expected a number");
    return 0.0;
  };
  parseCommand (cmdInt) {
    this.numFail = false;
    if ( cmdInt == 77 || cmdInt == 109 ) {
      let x = this.parseNumber();
      let y = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 109 ) {
        x = this.currentX + x;
        y = this.currentY + y;
      }
      const pathCmd = new PathCommand();
      pathCmd.type = "M";
      pathCmd.x = x;
      pathCmd.y = y;
      this.commands.push(pathCmd);
      this.currentX = x;
      this.currentY = y;
      this.startX = x;
      this.startY = y;
      this.lastCtrlKind = "";
      return true;
    }
    if ( cmdInt == 76 || cmdInt == 108 ) {
      let x_1 = this.parseNumber();
      let y_1 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 108 ) {
        x_1 = this.currentX + x_1;
        y_1 = this.currentY + y_1;
      }
      this.emitLine(x_1, y_1);
      return true;
    }
    if ( cmdInt == 72 || cmdInt == 104 ) {
      let x_2 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 104 ) {
        x_2 = this.currentX + x_2;
      }
      this.emitLine(x_2, this.currentY);
      return true;
    }
    if ( cmdInt == 86 || cmdInt == 118 ) {
      let y_2 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 118 ) {
        y_2 = this.currentY + y_2;
      }
      this.emitLine(this.currentX, y_2);
      return true;
    }
    if ( cmdInt == 67 || cmdInt == 99 ) {
      let x1 = this.parseNumber();
      let y1 = this.parseNumber();
      let x2 = this.parseNumber();
      let y2 = this.parseNumber();
      let x_3 = this.parseNumber();
      let y_3 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 99 ) {
        x1 = this.currentX + x1;
        y1 = this.currentY + y1;
        x2 = this.currentX + x2;
        y2 = this.currentY + y2;
        x_3 = this.currentX + x_3;
        y_3 = this.currentY + y_3;
      }
      this.emitCubic(x1, y1, x2, y2, x_3, y_3);
      return true;
    }
    if ( cmdInt == 83 || cmdInt == 115 ) {
      let x2_1 = this.parseNumber();
      let y2_1 = this.parseNumber();
      let x_4 = this.parseNumber();
      let y_4 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 115 ) {
        x2_1 = this.currentX + x2_1;
        y2_1 = this.currentY + y2_1;
        x_4 = this.currentX + x_4;
        y_4 = this.currentY + y_4;
      }
      let x1_1 = this.currentX;
      let y1_1 = this.currentY;
      if ( this.lastCtrlKind == "C" ) {
        x1_1 = 2.0 * this.currentX - this.lastCtrlX;
        y1_1 = 2.0 * this.currentY - this.lastCtrlY;
      }
      this.emitCubic(x1_1, y1_1, x2_1, y2_1, x_4, y_4);
      return true;
    }
    if ( cmdInt == 81 || cmdInt == 113 ) {
      let x1_2 = this.parseNumber();
      let y1_2 = this.parseNumber();
      let x_5 = this.parseNumber();
      let y_5 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 113 ) {
        x1_2 = this.currentX + x1_2;
        y1_2 = this.currentY + y1_2;
        x_5 = this.currentX + x_5;
        y_5 = this.currentY + y_5;
      }
      this.emitQuad(x1_2, y1_2, x_5, y_5);
      return true;
    }
    if ( cmdInt == 84 || cmdInt == 116 ) {
      let x_6 = this.parseNumber();
      let y_6 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 116 ) {
        x_6 = this.currentX + x_6;
        y_6 = this.currentY + y_6;
      }
      let x1_3 = this.currentX;
      let y1_3 = this.currentY;
      if ( this.lastCtrlKind == "Q" ) {
        x1_3 = 2.0 * this.currentX - this.lastCtrlX;
        y1_3 = 2.0 * this.currentY - this.lastCtrlY;
      }
      this.emitQuad(x1_3, y1_3, x_6, y_6);
      return true;
    }
    if ( cmdInt == 65 || cmdInt == 97 ) {
      const rx = this.parseNumber();
      const ry = this.parseNumber();
      const rot = this.parseNumber();
      const largeArc = this.parseFlag();
      const sweep = this.parseFlag();
      let x_7 = this.parseNumber();
      let y_7 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 97 ) {
        x_7 = this.currentX + x_7;
        y_7 = this.currentY + y_7;
      }
      this.emitArc(rx, ry, rot, largeArc, sweep, x_7, y_7);
      return true;
    }
    if ( cmdInt == 90 || cmdInt == 122 ) {
      const pathCmd_1 = new PathCommand();
      pathCmd_1.type = "Z";
      this.commands.push(pathCmd_1);
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.lastCtrlKind = "";
      return true;
    }
    this.addError(("unsupported path command '" + String.fromCharCode(cmdInt)) + "'");
    return false;
  };
  emitLine (x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "L";
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlKind = "";
  };
  emitCubic (x1, y1, x2, y2, x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "C";
    pathCmd.x1 = x1;
    pathCmd.y1 = y1;
    pathCmd.x2 = x2;
    pathCmd.y2 = y2;
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlX = x2;
    this.lastCtrlY = y2;
    this.lastCtrlKind = "C";
  };
  emitQuad (x1, y1, x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "Q";
    pathCmd.x1 = x1;
    pathCmd.y1 = y1;
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlX = x1;
    this.lastCtrlY = y1;
    this.lastCtrlKind = "Q";
  };
  emitArc (rxIn, ryIn, rotDeg, largeArc, sweep, x, y) {
    const x1 = this.currentX;
    const y1 = this.currentY;
    const x2 = x;
    const y2 = y;
    let rx = Math.abs(rxIn);
    let ry = Math.abs(ryIn);
    const dx = x1 - x2;
    const dy = y1 - y2;
    const d = Math.sqrt(dx * dx + dy * dy);
    if ( d < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    if ( rx < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    if ( ry < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    const PI = Math.PI;
    const rot = (rotDeg / 180.0) * PI;
    const sinrot = Math.sin(rot);
    const cosrot = Math.cos(rot);
    const x1p = (cosrot * dx) / 2.0 + (sinrot * dy) / 2.0;
    const y1p = ((0.0 - sinrot) * dx) / 2.0 + (cosrot * dy) / 2.0;
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if ( lambda > 1.0 ) {
      const k = Math.sqrt(lambda);
      rx = rx * k;
      ry = ry * k;
    }
    let sa = ((rx * rx) * (ry * ry) - (rx * rx) * (y1p * y1p)) - (ry * ry) * (x1p * x1p);
    const sb = (rx * rx) * (y1p * y1p) + (ry * ry) * (x1p * x1p);
    if ( sa < 0.0 ) {
      sa = 0.0;
    }
    let s = 0.0;
    if ( sb > 0.0 ) {
      s = Math.sqrt(sa / sb);
    }
    if ( largeArc == sweep ) {
      s = 0.0 - s;
    }
    const cxp = ((s * rx) * y1p) / ry;
    const cyp = (((0.0 - s) * ry) * x1p) / rx;
    const cx = (x1 + x2) / 2.0 + (cosrot * cxp - sinrot * cyp);
    const cy = (y1 + y2) / 2.0 + (sinrot * cxp + cosrot * cyp);
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = ((0.0 - x1p) - cxp) / rx;
    const vy = ((0.0 - y1p) - cyp) / ry;
    const a1 = this.vecAngle(1.0, 0.0, ux, uy);
    let da = this.vecAngle(ux, uy, vx, vy);
    if ( sweep == false ) {
      if ( da > 0.0 ) {
        da = da - 2.0 * PI;
      }
    } else {
      if ( da < 0.0 ) {
        da = 2.0 * PI + da;
      }
    }
    const ndivs = Math.floor( Math.abs(da) / (PI * 0.5) + 1.0);
    const hda = (da / ndivs) / 2.0;
    let kappa = Math.abs(((4.0 / 3.0) * (1.0 - Math.cos(hda))) / Math.sin(hda));
    if ( da < 0.0 ) {
      kappa = 0.0 - kappa;
    }
    let px = 0.0;
    let py = 0.0;
    let ptanx = 0.0;
    let ptany = 0.0;
    let k_1 = 0;
    while (k_1 <= ndivs) {
      const a = a1 + (da * k_1) / ndivs;
      const cosa = Math.cos(a);
      const sina = Math.sin(a);
      const ex = (cosrot * (cosa * rx) - sinrot * (sina * ry)) + cx;
      const ey = (sinrot * (cosa * rx) + cosrot * (sina * ry)) + cy;
      const tvx = (0.0 - sina) * (rx * kappa);
      const tvy = cosa * (ry * kappa);
      const tanx = cosrot * tvx - sinrot * tvy;
      const tany = sinrot * tvx + cosrot * tvy;
      if ( k_1 > 0 ) {
        this.emitCubic(px + ptanx, py + ptany, ex - tanx, ey - tany, ex, ey);
      }
      px = ex;
      py = ey;
      ptanx = tanx;
      ptany = tany;
      k_1 = k_1 + 1;
    };
    this.currentX = x2;
    this.currentY = y2;
    this.lastCtrlKind = "";
  };
  vecAngle (ux, uy, vx, vy) {
    const magU = Math.sqrt(ux * ux + uy * uy);
    const magV = Math.sqrt(vx * vx + vy * vy);
    const denom = magU * magV;
    if ( denom < 1e-10 ) {
      return 0.0;
    }
    let r = (ux * vx + uy * vy) / denom;
    if ( r < 0.0 - 1.0 ) {
      r = 0.0 - 1.0;
    }
    if ( r > 1.0 ) {
      r = 1.0;
    }
    let sign = 1.0;
    if ( ux * vy < uy * vx ) {
      sign = 0.0 - 1.0;
    }
    return sign * Math.acos(r);
  };
  calculateBounds () {
    if ( this.commands.length == 0 ) {
      return;
    }
    let minX = 999999.0;
    let minY = 999999.0;
    let maxX = -999999.0;
    let maxY = -999999.0;
    let i_1 = 0;
    while (i_1 < this.commands.length) {
      const cmd = this.commands[i_1];
      if ( cmd.type == "M" || cmd.type == "L" ) {
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      if ( cmd.type == "C" ) {
        if ( cmd.x1 < minX ) {
          minX = cmd.x1;
        }
        if ( cmd.x1 > maxX ) {
          maxX = cmd.x1;
        }
        if ( cmd.y1 < minY ) {
          minY = cmd.y1;
        }
        if ( cmd.y1 > maxY ) {
          maxY = cmd.y1;
        }
        if ( cmd.x2 < minX ) {
          minX = cmd.x2;
        }
        if ( cmd.x2 > maxX ) {
          maxX = cmd.x2;
        }
        if ( cmd.y2 < minY ) {
          minY = cmd.y2;
        }
        if ( cmd.y2 > maxY ) {
          maxY = cmd.y2;
        }
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      if ( cmd.type == "Q" ) {
        if ( cmd.x1 < minX ) {
          minX = cmd.x1;
        }
        if ( cmd.x1 > maxX ) {
          maxX = cmd.x1;
        }
        if ( cmd.y1 < minY ) {
          minY = cmd.y1;
        }
        if ( cmd.y1 > maxY ) {
          maxY = cmd.y1;
        }
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      i_1 = i_1 + 1;
    };
    this.bounds.minX = minX;
    this.bounds.minY = minY;
    this.bounds.maxX = maxX;
    this.bounds.maxY = maxY;
    this.bounds.width = maxX - minX;
    this.bounds.height = maxY - minY;
  };
  getBounds () {
    const result = this.bounds;
    return result;
  };
  getCommands () {
    return this.commands;
  };
  getScaledCommands (targetWidth, targetHeight) {
    let scaleX = 1.0;
    let scaleY = 1.0;
    if ( this.bounds.width > 0.0 ) {
      scaleX = targetWidth / this.bounds.width;
    }
    if ( this.bounds.height > 0.0 ) {
      scaleY = targetHeight / this.bounds.height;
    }
    let scaled = [];
    let i_1 = 0;
    while (i_1 < this.commands.length) {
      const cmd = this.commands[i_1];
      const newCmd = new PathCommand();
      newCmd.type = cmd.type;
      if ( cmd.type == "M" || cmd.type == "L" ) {
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      if ( cmd.type == "C" ) {
        newCmd.x1 = (cmd.x1 - this.bounds.minX) * scaleX;
        newCmd.y1 = (cmd.y1 - this.bounds.minY) * scaleY;
        newCmd.x2 = (cmd.x2 - this.bounds.minX) * scaleX;
        newCmd.y2 = (cmd.y2 - this.bounds.minY) * scaleY;
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      if ( cmd.type == "Q" ) {
        newCmd.x1 = (cmd.x1 - this.bounds.minX) * scaleX;
        newCmd.y1 = (cmd.y1 - this.bounds.minY) * scaleY;
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      scaled.push(newCmd);
      i_1 = i_1 + 1;
    };
    return scaled;
  };
  stepsFor (cap, __len) {
    if ( this.plain ) {
      return cap;
    }
    return SVGPathParser.curveSteps(cap, __len);
  };
  flattenRings (steps, ma, mb, mc, md, me, mf) {
    let rings = [];
    let current = new PathRing();
    let started = false;
    let cx = 0.0;
    let cy = 0.0;
    let sx = 0.0;
    let sy = 0.0;
    const n = this.commands.length;
    let k = 0;
    while (k < n) {
      const cmd = this.commands[k];
      if ( cmd.type == "M" ) {
        if ( started ) {
          if ( current.pointCount() >= 2 ) {
            rings.push(current);
          }
        }
        current = new PathRing();
        started = true;
        cx = cmd.x;
        cy = cmd.y;
        sx = cmd.x;
        sy = cmd.y;
        current.pts.push(ma * cx + (mc * cy + me));
        current.pts.push(mb * cx + (md * cy + mf));
      }
      if ( cmd.type == "L" ) {
        cx = cmd.x;
        cy = cmd.y;
        current.pts.push(ma * cx + (mc * cy + me));
        current.pts.push(mb * cx + (md * cy + mf));
      }
      if ( cmd.type == "C" ) {
        const d1 = SVGPathParser.devLen(cx, cy, cmd.x1, cmd.y1, ma, mb, mc, md);
        const d2 = SVGPathParser.devLen(
          cmd.x1,
          cmd.y1,
          cmd.x2,
          cmd.y2,
          ma,
          mb,
          mc,
          md
        );
        const d3 = SVGPathParser.devLen(
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y,
          ma,
          mb,
          mc,
          md
        );
        const cs = this.stepsFor(steps, ((d1 + d2) + d3));
        let s = 1;
        while (s <= cs) {
          const tt = s / cs;
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = ((b0 * cx + b1 * cmd.x1) + b2 * cmd.x2) + b3 * cmd.x;
          const py = ((b0 * cy + b1 * cmd.y1) + b2 * cmd.y2) + b3 * cmd.y;
          current.pts.push(ma * px + (mc * py + me));
          current.pts.push(mb * px + (md * py + mf));
          s = s + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Q" ) {
        const q1 = SVGPathParser.devLen(cx, cy, cmd.x1, cmd.y1, ma, mb, mc, md);
        const q2 = SVGPathParser.devLen(
          cmd.x1,
          cmd.y1,
          cmd.x,
          cmd.y,
          ma,
          mb,
          mc,
          md
        );
        const qs = this.stepsFor(steps, (q1 + q2));
        let s_1 = 1;
        while (s_1 <= qs) {
          const tt_1 = s_1 / qs;
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = (b0_1 * cx + b1_1 * cmd.x1) + b2_1 * cmd.x;
          const py_1 = (b0_1 * cy + b1_1 * cmd.y1) + b2_1 * cmd.y;
          current.pts.push(ma * px_1 + (mc * py_1 + me));
          current.pts.push(mb * px_1 + (md * py_1 + mf));
          s_1 = s_1 + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Z" ) {
        if ( started ) {
          current.closed = true;
          if ( current.pointCount() >= 2 ) {
            rings.push(current);
          }
        }
        current = new PathRing();
        started = false;
        cx = sx;
        cy = sy;
      }
      k = k + 1;
    };
    if ( started ) {
      if ( current.pointCount() >= 2 ) {
        rings.push(current);
      }
    }
    return rings;
  };
  flattenRingsPlain (steps) {
    this.plain = true;
    const rings = this.flattenRings(steps, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
    this.plain = false;
    return rings;
  };
  flatten (steps) {
    let pts = [];
    let cx = 0.0;
    let cy = 0.0;
    const n = this.commands.length;
    let i_1 = 0;
    while (i_1 < n) {
      const cmd = this.commands[i_1];
      if ( cmd.type == "M" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      if ( cmd.type == "L" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      if ( cmd.type == "C" ) {
        let s = 1;
        while (s <= steps) {
          const tt = s / steps;
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = ((b0 * cx + b1 * cmd.x1) + b2 * cmd.x2) + b3 * cmd.x;
          const py = ((b0 * cy + b1 * cmd.y1) + b2 * cmd.y2) + b3 * cmd.y;
          pts.push(px);
          pts.push(py);
          s = s + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Q" ) {
        let s_1 = 1;
        while (s_1 <= steps) {
          const tt_1 = s_1 / steps;
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = (b0_1 * cx + b1_1 * cmd.x1) + b2_1 * cmd.x;
          const py_1 = (b0_1 * cy + b1_1 * cmd.y1) + b2_1 * cmd.y;
          pts.push(px_1);
          pts.push(py_1);
          s_1 = s_1 + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "A" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      i_1 = i_1 + 1;
    };
    return pts;
  };
}
SVGPathParser.fromCommands = function(cmds) {
  const p = new SVGPathParser();
  p.commands = cmds;
  p.calculateBounds();
  return p;
};
SVGPathParser.curveSteps = function(cap, __len) {
  let want = Math.floor( __len / 2.0 + 0.999);
  if ( want < 2 ) {
    want = 2;
  }
  if ( want > cap ) {
    want = cap;
  }
  return want;
};
SVGPathParser.devLen = function(x0, y0, x1, y1, ma, mb, mc, md) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const ax = ma * dx + mc * dy;
  const ay = mb * dx + md * dy;
  return Math.sqrt(ax * ax + ay * ay);
};
class EvgTracePath  {
  constructor() {
  }
}
EvgTracePath.absD = function(v) {
  if ( v < 0.0 ) {
    return 0.0 - v;
  }
  return v;
};
EvgTracePath.num = function(v, p) {
  let scale = 1.0;
  let i = 0;
  while (i < p) {
    scale = scale * 10.0;
    i = i + 1;
  };
  let neg = false;
  let a = v;
  if ( a < 0.0 ) {
    neg = true;
    a = 0.0 - a;
  }
  const scaled = Math.floor( a * scale + 0.5);
  const unit = Math.floor( scale);
  const whole = ((scaled / unit) | 0);
  let frac = scaled - whole * unit;
  let out = "";
  if ( frac > 0 ) {
    let digits = p;
    while (frac - ((frac / 10) | 0) * 10 == 0) {
      frac = ((frac / 10) | 0);
      digits = digits - 1;
    };
    let fs = (frac.toString());
    let pad = digits - fs.length;
    while (pad > 0) {
      fs = "0" + fs;
      pad = pad - 1;
    };
    if ( whole == 0 ) {
      out = "." + fs;
    } else {
      out = ((whole.toString()) + ".") + fs;
    }
  } else {
    out = (whole.toString());
  }
  if ( neg ) {
    if ( out == "0" ) {
      return "0";
    }
    return "-" + out;
  }
  return out;
};
EvgTracePath.quantize = function(cmds, p) {
  let out = [];
  const n = cmds.length;
  let i = 0;
  while (i < n) {
    const c = cmds[i];
    const q = new PathCommand();
    q.type = c.type;
    q.x = EvgTracePath.roundTo(c.x, p);
    q.y = EvgTracePath.roundTo(c.y, p);
    q.x1 = EvgTracePath.roundTo(c.x1, p);
    q.y1 = EvgTracePath.roundTo(c.y1, p);
    q.x2 = EvgTracePath.roundTo(c.x2, p);
    q.y2 = EvgTracePath.roundTo(c.y2, p);
    out.push(q);
    i = i + 1;
  };
  return out;
};
EvgTracePath.roundTo = function(v, p) {
  let scale = 1.0;
  let i = 0;
  while (i < p) {
    scale = scale * 10.0;
    i = i + 1;
  };
  let neg = false;
  let a = v;
  if ( a < 0.0 ) {
    neg = true;
    a = 0.0 - a;
  }
  const r = Math.floor( a * scale + 0.5);
  const back = r / scale;
  if ( neg ) {
    return 0.0 - back;
  }
  return back;
};
EvgTracePath.collinear = function(ax, ay, bx, by, cx, cy) {
  const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const dx = cx - ax;
  const dy = cy - ay;
  const base = Math.sqrt(dx * dx + dy * dy);
  if ( base < 0.000001 ) {
    return true;
  }
  const d = EvgTracePath.absD(cross);
  return d / base < 0.0001;
};
EvgTracePath.cleanup = function(cmds) {
  let out = [];
  const n = cmds.length;
  let lx = 0.0;
  let ly = 0.0;
  let px = 0.0;
  let py = 0.0;
  let i = 0;
  while (i < n) {
    const c = cmds[i];
    if ( c.type == "M" ) {
      out.push(c);
      lx = c.x;
      ly = c.y;
      px = c.x;
      py = c.y;
    }
    if ( c.type == "L" ) {
      let skip = false;
      if ( lx == c.x && ly == c.y ) {
        skip = true;
      }
      if ( skip == false ) {
        let merged = false;
        const m = out.length;
        if ( m > 0 ) {
          const prev = out[(m - 1)];
          if ( prev.type == "L" ) {
            if ( EvgTracePath.collinear(px, py, lx, ly, c.x, c.y) ) {
              prev.x = c.x;
              prev.y = c.y;
              merged = true;
            }
          }
        }
        if ( merged == false ) {
          out.push(c);
          px = lx;
          py = ly;
        }
        lx = c.x;
        ly = c.y;
      }
    }
    if ( c.type == "C" ) {
      out.push(c);
      px = lx;
      py = ly;
      lx = c.x;
      ly = c.y;
    }
    if ( c.type == "Q" ) {
      out.push(c);
      px = lx;
      py = ly;
      lx = c.x;
      ly = c.y;
    }
    if ( c.type == "Z" ) {
      out.push(c);
    }
    i = i + 1;
  };
  return out;
};
EvgTracePath.joinNum = function(d, prev, tok) {
  if ( prev.length == 0 ) {
    return d + tok;
  }
  const first = tok.substring(0, 1 );
  if ( first == "-" ) {
    return d + tok;
  }
  if ( first == "." ) {
    if ( prev.indexOf(".") >= 0 ) {
      return d + tok;
    }
  }
  return (d + " ") + tok;
};
EvgTracePath.pair = function(d, prev, a, b) {
  const s1 = EvgTracePath.joinNum(d, prev, a);
  return EvgTracePath.joinNum(s1, a, b);
};
EvgTracePath.lastNum = function(s) {
  const n = s.length;
  let i = n;
  while (i > 0) {
    const ch = s.substring(i - 1, i );
    if ( ("0123456789.".indexOf(ch)) < 0 ) {
      if ( ch == "-" ) {
        return s.substring(i - 1, n );
      }
      return s.substring(i, n );
    }
    i = i - 1;
  };
  return s.substring(0, n );
};
EvgTracePath.encode = function(cmds, precision, compact) {
  const q = EvgTracePath.quantize(cmds, precision);
  const work = EvgTracePath.cleanup(q);
  if ( compact == false ) {
    return EvgTracePath.encodePlain(work, precision);
  }
  return EvgTracePath.encodeCompact(work, precision);
};
EvgTracePath.encodePlain = function(cmds, precision) {
  let d = "";
  const n = cmds.length;
  let i = 0;
  while (i < n) {
    const c = cmds[i];
    if ( i > 0 ) {
      d = d + " ";
    }
    if ( c.type == "M" ) {
      d = (((d + "M") + EvgTracePath.num(c.x, precision)) + ",") + EvgTracePath.num(c.y, precision);
    }
    if ( c.type == "L" ) {
      d = (((d + "L") + EvgTracePath.num(c.x, precision)) + ",") + EvgTracePath.num(c.y, precision);
    }
    if ( c.type == "C" ) {
      d = (((d + "C") + EvgTracePath.num(c.x1, precision)) + ",") + EvgTracePath.num(c.y1, precision);
      d = (((d + " ") + EvgTracePath.num(c.x2, precision)) + ",") + EvgTracePath.num(c.y2, precision);
      d = (((d + " ") + EvgTracePath.num(c.x, precision)) + ",") + EvgTracePath.num(c.y, precision);
    }
    if ( c.type == "Q" ) {
      d = (((d + "Q") + EvgTracePath.num(c.x1, precision)) + ",") + EvgTracePath.num(c.y1, precision);
      d = (((d + " ") + EvgTracePath.num(c.x, precision)) + ",") + EvgTracePath.num(c.y, precision);
    }
    if ( c.type == "Z" ) {
      d = d + "Z";
    }
    i = i + 1;
  };
  return d;
};
EvgTracePath.encodeCompact = function(cmds, precision) {
  let d = "";
  const n = cmds.length;
  let cx = 0.0;
  let cy = 0.0;
  let sx = 0.0;
  let sy = 0.0;
  let hx = 0.0;
  let hy = 0.0;
  let smooth = false;
  let i = 0;
  while (i < n) {
    const c = cmds[i];
    if ( c.type == "M" ) {
      const absTok = EvgTracePath.pair(
        "M",
        "",
        EvgTracePath.num(c.x, precision),
        EvgTracePath.num(c.y, precision)
      );
      const relTok = EvgTracePath.pair(
        "m",
        "",
        EvgTracePath.num((c.x - cx), precision),
        EvgTracePath.num((c.y - cy), precision)
      );
      if ( i == 0 ) {
        d = d + absTok;
      } else {
        if ( relTok.length < absTok.length ) {
          d = d + relTok;
        } else {
          d = d + absTok;
        }
      }
      cx = c.x;
      cy = c.y;
      sx = c.x;
      sy = c.y;
      smooth = false;
    }
    if ( c.type == "L" ) {
      let absTok2 = "";
      let relTok2 = "";
      if ( c.y == cy ) {
        absTok2 = EvgTracePath.joinNum(
          "H",
          "",
          EvgTracePath.num(c.x, precision)
        );
        relTok2 = EvgTracePath.joinNum(
          "h",
          "",
          EvgTracePath.num((c.x - cx), precision)
        );
      } else {
        if ( c.x == cx ) {
          absTok2 = EvgTracePath.joinNum(
            "V",
            "",
            EvgTracePath.num(c.y, precision)
          );
          relTok2 = EvgTracePath.joinNum(
            "v",
            "",
            EvgTracePath.num((c.y - cy), precision)
          );
        } else {
          absTok2 = EvgTracePath.pair(
            "L",
            "",
            EvgTracePath.num(c.x, precision),
            EvgTracePath.num(c.y, precision)
          );
          relTok2 = EvgTracePath.pair(
            "l",
            "",
            EvgTracePath.num((c.x - cx), precision),
            EvgTracePath.num((c.y - cy), precision)
          );
        }
      }
      if ( relTok2.length < absTok2.length ) {
        d = d + relTok2;
      } else {
        d = d + absTok2;
      }
      cx = c.x;
      cy = c.y;
      smooth = false;
    }
    if ( c.type == "C" ) {
      let useS = false;
      if ( smooth ) {
        const rx = 2.0 * cx - hx;
        const ry = 2.0 * cy - hy;
        const ex = EvgTracePath.absD((rx - c.x1));
        const ey = EvgTracePath.absD((ry - c.y1));
        if ( ex < 1e-7 && ey < 1e-7 ) {
          useS = true;
        }
      }
      let absTok3 = "";
      let relTok3 = "";
      if ( useS ) {
        absTok3 = EvgTracePath.pair(
          "S",
          "",
          EvgTracePath.num(c.x2, precision),
          EvgTracePath.num(c.y2, precision)
        );
        absTok3 = EvgTracePath.pair(
          absTok3,
          EvgTracePath.lastNum(absTok3),
          EvgTracePath.num(c.x, precision),
          EvgTracePath.num(c.y, precision)
        );
        relTok3 = EvgTracePath.pair(
          "s",
          "",
          EvgTracePath.num((c.x2 - cx), precision),
          EvgTracePath.num((c.y2 - cy), precision)
        );
        relTok3 = EvgTracePath.pair(
          relTok3,
          EvgTracePath.lastNum(relTok3),
          EvgTracePath.num((c.x - cx), precision),
          EvgTracePath.num((c.y - cy), precision)
        );
      } else {
        absTok3 = EvgTracePath.pair(
          "C",
          "",
          EvgTracePath.num(c.x1, precision),
          EvgTracePath.num(c.y1, precision)
        );
        absTok3 = EvgTracePath.pair(
          absTok3,
          EvgTracePath.lastNum(absTok3),
          EvgTracePath.num(c.x2, precision),
          EvgTracePath.num(c.y2, precision)
        );
        absTok3 = EvgTracePath.pair(
          absTok3,
          EvgTracePath.lastNum(absTok3),
          EvgTracePath.num(c.x, precision),
          EvgTracePath.num(c.y, precision)
        );
        relTok3 = EvgTracePath.pair(
          "c",
          "",
          EvgTracePath.num((c.x1 - cx), precision),
          EvgTracePath.num((c.y1 - cy), precision)
        );
        relTok3 = EvgTracePath.pair(
          relTok3,
          EvgTracePath.lastNum(relTok3),
          EvgTracePath.num((c.x2 - cx), precision),
          EvgTracePath.num((c.y2 - cy), precision)
        );
        relTok3 = EvgTracePath.pair(
          relTok3,
          EvgTracePath.lastNum(relTok3),
          EvgTracePath.num((c.x - cx), precision),
          EvgTracePath.num((c.y - cy), precision)
        );
      }
      if ( relTok3.length < absTok3.length ) {
        d = d + relTok3;
      } else {
        d = d + absTok3;
      }
      hx = c.x2;
      hy = c.y2;
      cx = c.x;
      cy = c.y;
      smooth = true;
    }
    if ( c.type == "Q" ) {
      let absTok4 = EvgTracePath.pair(
        "Q",
        "",
        EvgTracePath.num(c.x1, precision),
        EvgTracePath.num(c.y1, precision)
      );
      absTok4 = EvgTracePath.pair(
        absTok4,
        EvgTracePath.lastNum(absTok4),
        EvgTracePath.num(c.x, precision),
        EvgTracePath.num(c.y, precision)
      );
      let relTok4 = EvgTracePath.pair(
        "q",
        "",
        EvgTracePath.num((c.x1 - cx), precision),
        EvgTracePath.num((c.y1 - cy), precision)
      );
      relTok4 = EvgTracePath.pair(
        relTok4,
        EvgTracePath.lastNum(relTok4),
        EvgTracePath.num((c.x - cx), precision),
        EvgTracePath.num((c.y - cy), precision)
      );
      if ( relTok4.length < absTok4.length ) {
        d = d + relTok4;
      } else {
        d = d + absTok4;
      }
      cx = c.x;
      cy = c.y;
      smooth = false;
    }
    if ( c.type == "Z" ) {
      d = d + "Z";
      cx = sx;
      cy = sy;
      smooth = false;
    }
    i = i + 1;
  };
  return d;
};
class EvgTraceSum  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
    this.xy = 0.0;
    this.x2 = 0.0;
    this.y2 = 0.0;
  }
}
EvgTraceSum.of = function(x, y, xy, x2, y2) {
  const s = new EvgTraceSum();
  s.x = x;
  s.y = y;
  s.xy = xy;
  s.x2 = x2;
  s.y2 = y2;
  return s;
};
class EvgTraceFit  {
  constructor() {
    this.pts = [];
    this.n = 0;
    this.x0 = 0.0;
    this.y0 = 0.0;
    this.sums = [];
    this.lon = [];
    this.po = [];
    this.m = 0;
    this.vertex = [];
    let p_3 = [];
    this.pts = p_3;
    let s = [];
    this.sums = s;
    let l = [];
    this.lon = l;
    let o = [];
    this.po = o;
    let v = [];
    this.vertex = v;
  }
  run (ring) {
    let empty = [];
    const src = ring.pts;
    const rawN = src.length;
    if ( rawN < 3 ) {
      return empty;
    }
    let cleaned = [];
    let i = 0;
    while (i < rawN) {
      const p = src[i];
      if ( cleaned.length == 0 ) {
        cleaned.push(p);
      } else {
        const prev = cleaned[(cleaned.length - 1)];
        if ( prev.x == p.x && prev.y == p.y ) {
        } else {
          cleaned.push(p);
        }
      }
      i = i + 1;
    };
    let cn = cleaned.length;
    if ( cn >= 2 ) {
      const first = cleaned[0];
      const last = cleaned[(cn - 1)];
      if ( first.x == last.x && first.y == last.y ) {
        let trimmed = [];
        let k = 0;
        while (k < cn - 1) {
          trimmed.push(cleaned[k]);
          k = k + 1;
        };
        cleaned = trimmed;
        cn = cleaned.length;
      }
    }
    if ( cn < 3 ) {
      return empty;
    }
    this.pts = cleaned;
    this.n = cn;
    const p0 = this.pts[0];
    this.x0 = p0.x;
    this.y0 = p0.y;
    this.calcSums();
    this.calcLon();
    this.bestPolygon();
    if ( this.m < 3 ) {
      return empty;
    }
    this.adjustVertices();
    return this.vertex;
  };
  calcSums () {
    let s = [];
    s.push(EvgTraceSum.of(0.0, 0.0, 0.0, 0.0, 0.0));
    let i = 0;
    while (i < this.n) {
      const p = this.pts[i];
      const x = p.x - this.x0;
      const y = p.y - this.y0;
      const prev = s[i];
      s.push(EvgTraceSum.of(
        prev.x + x,
        (prev.y + y),
        (prev.xy + x * y),
        (prev.x2 + x * x),
        (prev.y2 + y * y)
      ));
      i = i + 1;
    };
    this.sums = s;
  };
  calcLon () {
    let pivk = [];
    let nc = [];
    let i = 0;
    while (i < this.n) {
      pivk.push(0);
      nc.push(0);
      i = i + 1;
    };
    let k = 0;
    i = this.n - 1;
    while (i >= 0) {
      const pi = this.pts[i];
      const pk = this.pts[k];
      if ( pi.x != pk.x && pi.y != pk.y ) {
        k = i + 1;
      }
      nc[i] = k;
      i = i - 1;
    };
    i = this.n - 1;
    while (i >= 0) {
      let ct0 = 0;
      let ct1 = 0;
      let ct2 = 0;
      let ct3 = 0;
      const pi2 = this.pts[i];
      const piNext = this.pts[EvgTraceFit.modI((i + 1), this.n)];
      const dx0 = Math.floor( piNext.x - pi2.x);
      const dy0 = Math.floor( piNext.y - pi2.y);
      const dirNum0 = 3 + (3 * dx0 + dy0);
      const dir0 = ((dirNum0 / 2) | 0);
      if ( dir0 == 0 ) {
        ct0 = ct0 + 1;
      }
      if ( dir0 == 1 ) {
        ct1 = ct1 + 1;
      }
      if ( dir0 == 2 ) {
        ct2 = ct2 + 1;
      }
      if ( dir0 == 3 ) {
        ct3 = ct3 + 1;
      }
      let c0x = 0;
      let c0y = 0;
      let c1x = 0;
      let c1y = 0;
      let kk = nc[i];
      let k1 = i;
      let found = false;
      let guard = 0;
      while (found == false && guard < this.n + 2) {
        const pk1 = this.pts[kk];
        const pk0 = this.pts[k1];
        const sdx = EvgTraceFit.signI(Math.floor( pk1.x - pk0.x));
        const sdy = EvgTraceFit.signI(Math.floor( pk1.y - pk0.y));
        const dirNum = 3 + (3 * sdx + sdy);
        const dir = ((dirNum / 2) | 0);
        if ( dir == 0 ) {
          ct0 = ct0 + 1;
        }
        if ( dir == 1 ) {
          ct1 = ct1 + 1;
        }
        if ( dir == 2 ) {
          ct2 = ct2 + 1;
        }
        if ( dir == 3 ) {
          ct3 = ct3 + 1;
        }
        if ( ((ct0 > 0 && ct1 > 0) && ct2 > 0) && ct3 > 0 ) {
          pivk[i] = k1;
          found = true;
        } else {
          const curx = Math.floor( pk1.x - pi2.x);
          const cury = Math.floor( pk1.y - pi2.y);
          if ( EvgTraceFit.xprod(c0x, c0y, curx, cury) < 0 || EvgTraceFit.xprod(c1x, c1y, curx, cury) > 0 ) {
            guard = this.n + 2;
          } else {
            const ax = EvgTraceFit.absI(curx);
            const ay = EvgTraceFit.absI(cury);
            if ( ax > 1 || ay > 1 ) {
              let off0x = curx;
              let off0y = cury;
              if ( cury > 0 || cury == 0 && curx < 0 ) {
                off0x = curx + 1;
              } else {
                off0x = curx - 1;
              }
              if ( curx < 0 || curx == 0 && cury < 0 ) {
                off0y = cury + 1;
              } else {
                off0y = cury - 1;
              }
              off0x = curx;
              off0y = cury;
              if ( cury >= 0 && (cury > 0 || curx < 0) ) {
                off0x = curx + 1;
              } else {
                off0x = curx - 1;
              }
              if ( curx <= 0 && (curx < 0 || cury < 0) ) {
                off0y = cury + 1;
              } else {
                off0y = cury - 1;
              }
              if ( EvgTraceFit.xprod(c0x, c0y, off0x, off0y) >= 0 ) {
                c0x = off0x;
                c0y = off0y;
              }
              let off1x = curx;
              let off1y = cury;
              if ( cury <= 0 && (cury < 0 || curx < 0) ) {
                off1x = curx + 1;
              } else {
                off1x = curx - 1;
              }
              if ( curx >= 0 && (curx > 0 || cury < 0) ) {
                off1y = cury + 1;
              } else {
                off1y = cury - 1;
              }
              if ( EvgTraceFit.xprod(c1x, c1y, off1x, off1y) <= 0 ) {
                c1x = off1x;
                c1y = off1y;
              }
            }
            k1 = kk;
            kk = nc[k1];
            if ( EvgTraceFit.cyclic(kk, i, k1) == false ) {
              guard = this.n + 2;
            }
          }
        }
        guard = guard + 1;
      };
      if ( found == false ) {
        const pkA = this.pts[kk];
        const pkB = this.pts[k1];
        const dkx = EvgTraceFit.signI(Math.floor( pkA.x - pkB.x));
        const dky = EvgTraceFit.signI(Math.floor( pkA.y - pkB.y));
        const cur2x = Math.floor( pkB.x - pi2.x);
        const cur2y = Math.floor( pkB.y - pi2.y);
        const a = EvgTraceFit.xprod(c0x, c0y, cur2x, cur2y);
        const b = EvgTraceFit.xprod(c0x, c0y, dkx, dky);
        const c = EvgTraceFit.xprod(c1x, c1y, cur2x, cur2y);
        const d = EvgTraceFit.xprod(c1x, c1y, dkx, dky);
        let j = 10000000;
        if ( b < 0 ) {
          j = ((a / (0 - b)) | 0);
        }
        if ( d > 0 ) {
          const j2 = (((0 - c) / d) | 0);
          if ( j2 < j ) {
            j = j2;
          }
        }
        pivk[i] = EvgTraceFit.modI((k1 + j), this.n);
      }
      i = i - 1;
    };
    let lonOut = [];
    i = 0;
    while (i < this.n) {
      lonOut.push(0);
      i = i + 1;
    };
    let jLon = pivk[(this.n - 1)];
    lonOut[this.n - 1] = jLon;
    i = this.n - 2;
    while (i >= 0) {
      if ( EvgTraceFit.cyclic(i + 1, pivk[i], jLon) ) {
        jLon = pivk[i];
      }
      lonOut[i] = jLon;
      i = i - 1;
    };
    i = this.n - 1;
    while (i >= 0) {
      if ( EvgTraceFit.cyclic(EvgTraceFit.modI(i + 1, this.n), jLon, lonOut[i]) ) {
        lonOut[i] = jLon;
        i = i - 1;
      } else {
        i = 0 - 1;
      }
    };
    this.lon = lonOut;
  };
  penalty3 (i, jIn) {
    let j = jIn;
    let r = 0;
    if ( j >= this.n ) {
      j = j - this.n;
      r = 1;
    }
    const si = this.sums[i];
    const sj = this.sums[(j + 1)];
    const sn = this.sums[this.n];
    let x = sj.x - si.x;
    let y = sj.y - si.y;
    let x2 = sj.x2 - si.x2;
    let xy = sj.xy - si.xy;
    let y2 = sj.y2 - si.y2;
    let k = ((j + 1) - i);
    if ( r != 0 ) {
      x = x + sn.x;
      y = y + sn.y;
      x2 = x2 + sn.x2;
      xy = xy + sn.xy;
      y2 = y2 + sn.y2;
      k = k + this.n;
    }
    const pi = this.pts[i];
    const pj = this.pts[j];
    const pOrig = this.pts[0];
    const px = (pi.x + pj.x) / 2.0 - pOrig.x;
    const py = (pi.y + pj.y) / 2.0 - pOrig.y;
    const ey = pj.x - pi.x;
    const ex = 0.0 - (pj.y - pi.y);
    const a = (x2 - (2.0 * x) * px) / k + px * px;
    const b = ((xy - x * py) - y * px) / k + px * py;
    const c = (y2 - (2.0 * y) * py) / k + py * py;
    let s = ((ex * ex) * a + ((2.0 * ex) * ey) * b) + (ey * ey) * c;
    if ( s < 0.0 ) {
      s = 0.0;
    }
    return Math.sqrt(s);
  };
  bestPolygon () {
    let clip0 = [];
    let clip1 = [];
    let seg0 = [];
    let seg1 = [];
    let pen = [];
    let prev = [];
    let i = 0;
    while (i < this.n) {
      clip0.push(0);
      i = i + 1;
    };
    i = 0;
    while (i <= this.n) {
      clip1.push(0);
      seg0.push(0);
      seg1.push(0);
      pen.push(0.0 - 1.0);
      prev.push(0);
      i = i + 1;
    };
    pen[0] = 0.0;
    i = 0;
    while (i < this.n) {
      let c = EvgTraceFit.modI((this.lon[EvgTraceFit.modI((i - 1), this.n)] - 1), this.n);
      if ( c == i ) {
        c = EvgTraceFit.modI((i + 1), this.n);
      }
      if ( c < i ) {
        clip0[i] = this.n;
      } else {
        clip0[i] = c;
      }
      i = i + 1;
    };
    let j = 1;
    i = 0;
    while (i < this.n) {
      while (j <= clip0[i]) {
        clip1[j] = i;
        j = j + 1;
      };
      i = i + 1;
    };
    i = 0;
    j = 0;
    while (i < this.n) {
      seg0[j] = i;
      i = clip0[i];
      j = j + 1;
    };
    seg0[j] = this.n;
    this.m = j;
    i = this.n;
    j = this.m;
    while (j > 0) {
      seg1[j] = i;
      i = clip1[i];
      j = j - 1;
    };
    seg1[0] = 0;
    j = 1;
    while (j <= this.m) {
      i = seg1[j];
      while (i <= seg0[j]) {
        let best = 0.0 - 1.0;
        let bestK = 0;
        let k = seg0[(j - 1)];
        while (k >= clip1[i]) {
          const thispen = this.penalty3(k, i);
          const prevPen = pen[k];
          const total = thispen + prevPen;
          if ( best < 0.0 || total < best ) {
            best = total;
            bestK = k;
          }
          k = k - 1;
        };
        pen[i] = best;
        prev[i] = bestK;
        i = i + 1;
      };
      j = j + 1;
    };
    let poOut = [];
    i = 0;
    while (i < this.m) {
      poOut.push(0);
      i = i + 1;
    };
    i = this.n;
    j = this.m - 1;
    while (i > 0) {
      i = prev[i];
      poOut[j] = i;
      j = j - 1;
    };
    this.po = poOut;
  };
  adjustVertices () {
    let ctr = [];
    let dir = [];
    let i = 0;
    while (i < this.m) {
      ctr.push(EvgTracePoint.of(0.0, 0.0));
      dir.push(EvgTracePoint.of(0.0, 0.0));
      i = i + 1;
    };
    i = 0;
    while (i < this.m) {
      const j = this.po[EvgTraceFit.modI((i + 1), this.m)];
      const jj = EvgTraceFit.modI((j - this.po[i]), this.n) + this.po[i];
      const c = EvgTracePoint.of(0.0, 0.0);
      const d = EvgTracePoint.of(0.0, 0.0);
      this.pointslope(this.po[i], jj, c, d);
      ctr[i] = c;
      dir[i] = d;
      i = i + 1;
    };
    let qdata = [];
    i = 0;
    while (i < this.m * 9) {
      qdata.push(0.0);
      i = i + 1;
    };
    i = 0;
    while (i < this.m) {
      const di = dir[i];
      const ci = ctr[i];
      const d2 = di.x * di.x + di.y * di.y;
      const base = i * 9;
      if ( d2 == 0.0 ) {
      } else {
        const v0 = di.y;
        const v1 = 0.0 - di.x;
        const v2 = (0.0 - v1 * ci.y) - v0 * ci.x;
        let l = 0;
        while (l < 3) {
          let k = 0;
          while (k < 3) {
            let vl = v0;
            if ( l == 1 ) {
              vl = v1;
            }
            if ( l == 2 ) {
              vl = v2;
            }
            let vk = v0;
            if ( k == 1 ) {
              vk = v1;
            }
            if ( k == 2 ) {
              vk = v2;
            }
            qdata[(base + l * 3) + k] = (vl * vk) / d2;
            k = k + 1;
          };
          l = l + 1;
        };
      }
      i = i + 1;
    };
    let out = [];
    i = 0;
    while (i < this.m) {
      const iPrev = EvgTraceFit.modI((i - 1), this.m);
      let Q = [];
      let t = 0;
      while (t < 9) {
        Q.push(0.0);
        t = t + 1;
      };
      t = 0;
      while (t < 9) {
        const a = qdata[(iPrev * 9 + t)];
        const b = qdata[(i * 9 + t)];
        Q[t] = a + b;
        t = t + 1;
      };
      const pCur = this.pts[this.po[i]];
      const sx = pCur.x - this.x0;
      const sy = pCur.y - this.y0;
      let wx = sx;
      let wy = sy;
      const q00 = Q[0];
      const q01 = Q[1];
      const q02 = Q[2];
      const q10 = Q[3];
      const q11 = Q[4];
      const q12 = Q[5];
      const det = q00 * q11 - q01 * q10;
      let solved = false;
      if ( det != 0.0 ) {
        wx = ((0.0 - q02) * q11 + q12 * q01) / det;
        wy = (q02 * q10 - q12 * q00) / det;
        solved = true;
      }
      const dx = EvgTraceFit.absD((wx - sx));
      const dy = EvgTraceFit.absD((wy - sy));
      if ( (solved == false || dx > 0.5) || dy > 0.5 ) {
        let best = this.quadform(Q, sx, sy);
        let bx = sx;
        let by = sy;
        let cand = [];
        cand.push(sx - 0.5);
        cand.push(sy);
        cand.push(sx + 0.5);
        cand.push(sy);
        cand.push(sx);
        cand.push(sy - 0.5);
        cand.push(sx);
        cand.push(sy + 0.5);
        cand.push(sx - 0.5);
        cand.push(sy - 0.5);
        cand.push(sx + 0.5);
        cand.push(sy - 0.5);
        cand.push(sx - 0.5);
        cand.push(sy + 0.5);
        cand.push(sx + 0.5);
        cand.push(sy + 0.5);
        let ci_1 = 0;
        while (ci_1 < cand.length) {
          const cx = cand[ci_1];
          const cy = cand[(ci_1 + 1)];
          const val = this.quadform(Q, cx, cy);
          if ( val < best ) {
            best = val;
            bx = cx;
            by = cy;
          }
          ci_1 = ci_1 + 2;
        };
        wx = bx;
        wy = by;
      }
      if ( wx < sx - 0.5 ) {
        wx = sx - 0.5;
      }
      if ( wx > sx + 0.5 ) {
        wx = sx + 0.5;
      }
      if ( wy < sy - 0.5 ) {
        wy = sy - 0.5;
      }
      if ( wy > sy + 0.5 ) {
        wy = sy + 0.5;
      }
      out.push(EvgTracePoint.of(wx + this.x0, (wy + this.y0)));
      i = i + 1;
    };
    this.vertex = out;
  };
  quadform (Q, x, y) {
    const v0 = x;
    const v1 = y;
    const v2 = 1.0;
    let sum = 0.0;
    let i = 0;
    while (i < 3) {
      let vi = v0;
      if ( i == 1 ) {
        vi = v1;
      }
      if ( i == 2 ) {
        vi = v2;
      }
      let j = 0;
      while (j < 3) {
        let vj = v0;
        if ( j == 1 ) {
          vj = v1;
        }
        if ( j == 2 ) {
          vj = v2;
        }
        const qij = Q[(i * 3 + j)];
        sum = sum + (vi * qij) * vj;
        j = j + 1;
      };
      i = i + 1;
    };
    return sum;
  };
  pointslope (iIn, jIn, ctr, dir) {
    let i = iIn;
    let j = jIn;
    let r = 0;
    while (j >= this.n) {
      j = j - this.n;
      r = r + 1;
    };
    while (i >= this.n) {
      i = i - this.n;
      r = r - 1;
    };
    while (j < 0) {
      j = j + this.n;
      r = r - 1;
    };
    while (i < 0) {
      i = i + this.n;
      r = r + 1;
    };
    const si = this.sums[i];
    const sj = this.sums[(j + 1)];
    const sn = this.sums[this.n];
    const x = (sj.x - si.x) + r * sn.x;
    const y = (sj.y - si.y) + r * sn.y;
    const x2 = (sj.x2 - si.x2) + r * sn.x2;
    const xy = (sj.xy - si.xy) + r * sn.xy;
    const y2 = (sj.y2 - si.y2) + r * sn.y2;
    const k = (((j + 1) - i) + r * this.n);
    if ( k == 0.0 ) {
      ctr.x = 0.0;
      ctr.y = 0.0;
      dir.x = 0.0;
      dir.y = 0.0;
      return;
    }
    ctr.x = x / k;
    ctr.y = y / k;
    let a = (x2 - (x * x) / k) / k;
    const b = (xy - (x * y) / k) / k;
    let c = (y2 - (y * y) / k) / k;
    const disc = (a - c) * (a - c) + (4.0 * b) * b;
    const lambda2 = ((a + c) + Math.sqrt(disc)) / 2.0;
    a = a - lambda2;
    c = c - lambda2;
    let l = 0.0;
    if ( EvgTraceFit.absD(a) >= EvgTraceFit.absD(c) ) {
      l = Math.sqrt(a * a + b * b);
      if ( l != 0.0 ) {
        dir.x = (0.0 - b) / l;
        dir.y = a / l;
      }
    } else {
      l = Math.sqrt(c * c + b * b);
      if ( l != 0.0 ) {
        dir.x = (0.0 - c) / l;
        dir.y = b / l;
      }
    }
    if ( l == 0.0 ) {
      dir.x = 0.0;
      dir.y = 0.0;
    }
  };
}
EvgTraceFit.absD = function(v) {
  if ( v < 0.0 ) {
    return 0.0 - v;
  }
  return v;
};
EvgTraceFit.signI = function(v) {
  if ( v > 0 ) {
    return 1;
  }
  if ( v < 0 ) {
    return 0 - 1;
  }
  return 0;
};
EvgTraceFit.modI = function(a, n) {
  if ( n <= 0 ) {
    return 0;
  }
  let r = a - ((a / n) | 0) * n;
  if ( r < 0 ) {
    r = r + n;
  }
  return r;
};
EvgTraceFit.cyclic = function(a, b, c) {
  if ( a <= c ) {
    return a <= b && b < c;
  }
  return a <= b || b < c;
};
EvgTraceFit.xprod = function(ax, ay, bx, by) {
  return ax * by - ay * bx;
};
EvgTraceFit.fitRing = function(ring) {
  const fit = new EvgTraceFit();
  return fit.run(ring);
};
EvgTraceFit.absI = function(v) {
  if ( v < 0 ) {
    return 0 - v;
  }
  return v;
};
class VectorShapes  {
  constructor() {
  }
}
VectorShapes.kappa = function() {
  return 0.5522847498307936;
};
VectorShapes.moveTo = function(x, y) {
  const c = new PathCommand();
  c.type = "M";
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.lineTo = function(x, y) {
  const c = new PathCommand();
  c.type = "L";
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.cubicTo = function(x1, y1, x2, y2, x, y) {
  const c = new PathCommand();
  c.type = "C";
  c.x1 = x1;
  c.y1 = y1;
  c.x2 = x2;
  c.y2 = y2;
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.closePath = function() {
  const c = new PathCommand();
  c.type = "Z";
  return c;
};
VectorShapes.line = function(x1, y1, x2, y2) {
  let out = [];
  out.push(VectorShapes.moveTo(x1, y1));
  out.push(VectorShapes.lineTo(x2, y2));
  return out;
};
VectorShapes.polyline = function(pts) {
  return VectorShapes.pointsToPath(pts, false);
};
VectorShapes.polygon = function(pts) {
  return VectorShapes.pointsToPath(pts, true);
};
VectorShapes.pointsToPath = function(pts, closed) {
  let out = [];
  const n = ((pts.length / 2) | 0);
  if ( n < 2 ) {
    return out;
  }
  out.push(VectorShapes.moveTo(pts[0], pts[1]));
  let k = 1;
  while (k < n) {
    out.push(VectorShapes.lineTo(pts[(k * 2)], pts[(k * 2 + 1)]));
    k = k + 1;
  };
  if ( closed ) {
    out.push(VectorShapes.closePath());
  }
  return out;
};
VectorShapes.ellipse = function(cx, cy, rx, ry) {
  let out = [];
  if ( rx <= 0.0 ) {
    return out;
  }
  if ( ry <= 0.0 ) {
    return out;
  }
  const k = VectorShapes.kappa();
  const ox = rx * k;
  const oy = ry * k;
  out.push(VectorShapes.moveTo(cx + rx, cy));
  out.push(VectorShapes.cubicTo(
    cx + rx,
    (cy + oy),
    (cx + ox),
    (cy + ry),
    cx,
    (cy + ry)
  ));
  out.push(VectorShapes.cubicTo(
    cx - ox,
    (cy + ry),
    (cx - rx),
    (cy + oy),
    (cx - rx),
    cy
  ));
  out.push(VectorShapes.cubicTo(
    cx - rx,
    (cy - oy),
    (cx - ox),
    (cy - ry),
    cx,
    (cy - ry)
  ));
  out.push(VectorShapes.cubicTo(
    cx + ox,
    (cy - ry),
    (cx + rx),
    (cy - oy),
    (cx + rx),
    cy
  ));
  out.push(VectorShapes.closePath());
  return out;
};
VectorShapes.circle = function(cx, cy, r) {
  return VectorShapes.ellipse(cx, cy, r, r);
};
VectorShapes.rect = function(x, y, w, h, rxIn, ryIn) {
  let out = [];
  if ( w <= 0.0 ) {
    return out;
  }
  if ( h <= 0.0 ) {
    return out;
  }
  let rx = rxIn;
  let ry = ryIn;
  if ( rx < 0.0 ) {
    rx = ry;
  }
  if ( ry < 0.0 ) {
    ry = rx;
  }
  if ( rx < 0.0 ) {
    rx = 0.0;
  }
  if ( ry < 0.0 ) {
    ry = 0.0;
  }
  if ( rx > w / 2.0 ) {
    rx = w / 2.0;
  }
  if ( ry > h / 2.0 ) {
    ry = h / 2.0;
  }
  let rounded = true;
  if ( rx <= 0.0 ) {
    rounded = false;
  }
  if ( ry <= 0.0 ) {
    rounded = false;
  }
  if ( rounded == false ) {
    out.push(VectorShapes.moveTo(x, y));
    out.push(VectorShapes.lineTo(x + w, y));
    out.push(VectorShapes.lineTo(x + w, (y + h)));
    out.push(VectorShapes.lineTo(x, y + h));
    out.push(VectorShapes.closePath());
    return out;
  }
  const k = VectorShapes.kappa();
  const ox = rx * k;
  const oy = ry * k;
  const x1 = x + w;
  const y1 = y + h;
  out.push(VectorShapes.moveTo(x + rx, y));
  out.push(VectorShapes.lineTo(x1 - rx, y));
  out.push(VectorShapes.cubicTo(
    (x1 - rx) + ox,
    y,
    x1,
    ((y + ry) - oy),
    x1,
    (y + ry)
  ));
  out.push(VectorShapes.lineTo(x1, y1 - ry));
  out.push(VectorShapes.cubicTo(
    x1,
    (y1 - ry) + oy,
    ((x1 - rx) + ox),
    y1,
    (x1 - rx),
    y1
  ));
  out.push(VectorShapes.lineTo(x + rx, y1));
  out.push(VectorShapes.cubicTo(
    (x + rx) - ox,
    y1,
    x,
    ((y1 - ry) + oy),
    x,
    (y1 - ry)
  ));
  out.push(VectorShapes.lineTo(x, y + ry));
  out.push(VectorShapes.cubicTo(
    x,
    (y + ry) - oy,
    ((x + rx) - ox),
    y,
    (x + rx),
    y
  ));
  out.push(VectorShapes.closePath());
  return out;
};
VectorShapes.asPathData = function(cmds) {
  let out = "";
  const n = cmds.length;
  let k = 0;
  while (k < n) {
    const c = cmds[k];
    if ( k > 0 ) {
      out = out + " ";
    }
    if ( c.type == "M" ) {
      out = (((out + "M") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "L" ) {
      out = (((out + "L") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "C" ) {
      out = (((out + "C") + VectorShapes.num(c.x1)) + ",") + VectorShapes.num(c.y1);
      out = (((out + " ") + VectorShapes.num(c.x2)) + ",") + VectorShapes.num(c.y2);
      out = (((out + " ") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "Q" ) {
      out = (((out + "Q") + VectorShapes.num(c.x1)) + ",") + VectorShapes.num(c.y1);
      out = (((out + " ") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "Z" ) {
      out = out + "Z";
    }
    k = k + 1;
  };
  return out;
};
VectorShapes.num = function(v) {
  let neg = false;
  let a = v;
  if ( a < 0.0 ) {
    neg = true;
    a = 0.0 - a;
  }
  const scaled = Math.floor( a * 10000.0 + 0.5);
  const whole = ((scaled / 10000) | 0);
  let fracPart = scaled - whole * 10000;
  let out = (whole.toString());
  if ( fracPart > 0 ) {
    let digits = 4;
    while (fracPart - ((fracPart / 10) | 0) * 10 == 0) {
      fracPart = ((fracPart / 10) | 0);
      digits = digits - 1;
    };
    let frac = (fracPart.toString());
    let pad = digits - frac.length;
    while (pad > 0) {
      frac = "0" + frac;
      pad = pad - 1;
    };
    out = (out + ".") + frac;
  }
  if ( neg ) {
    if ( scaled > 0 ) {
      out = "-" + out;
    }
  }
  return out;
};
class EvgTraceOpti  {
  constructor() {
    this.pen = 0.0;
    this.c0 = EvgTracePoint.of(0.0, 0.0);
    this.c1 = EvgTracePoint.of(0.0, 0.0);
    this.t = 0.0;
    this.s = 0.0;
    this.alpha = 0.0;
    this.ok = false;
  }
}
class EvgTraceCurve  {
  constructor() {
    this.n = 0;
    this.tag = [];
    this.vertex = [];
    this.c0 = [];
    this.c1 = [];
    this.c2 = [];
    this.alpha = [];
    this.alpha0 = [];
    this.beta = [];
    let t_1 = [];
    this.tag = t_1;
    let v_1 = [];
    this.vertex = v_1;
    let a_2 = [];
    this.c0 = a_2;
    let b_2 = [];
    this.c1 = b_2;
    let c_2 = [];
    this.c2 = c_2;
    let al = [];
    this.alpha = al;
    let a0 = [];
    this.alpha0 = a0;
    let be = [];
    this.beta = be;
  }
  curveCount () {
    let nC = 0;
    let i = 0;
    while (i < this.n) {
      if ( this.tag[i] == "CURVE" ) {
        nC = nC + 1;
      }
      i = i + 1;
    };
    return nC;
  };
  cornerCount () {
    let nC = 0;
    let i = 0;
    while (i < this.n) {
      if ( this.tag[i] == "CORNER" ) {
        nC = nC + 1;
      }
      i = i + 1;
    };
    return nC;
  };
  optimize (opttolerance) {
    if ( this.n < 3 ) {
      return this;
    }
    if ( this.curveCount() < 2 ) {
      return this;
    }
    let convc = [];
    let areac = [];
    let i = 0;
    while (i < this.n) {
      convc.push(0);
      i = i + 1;
    };
    areac.push(0.0);
    i = 0;
    while (i < this.n) {
      if ( this.tag[i] == "CURVE" ) {
        const iPrev = EvgTraceCurve.modI((i - 1), this.n);
        const iNext = EvgTraceCurve.modI((i + 1), this.n);
        const para = EvgTraceCurve.dpara(
          this.vertex[iPrev],
          this.vertex[i],
          this.vertex[iNext]
        );
        convc[i] = EvgTraceCurve.signD(para);
      } else {
        convc[i] = 0;
      }
      i = i + 1;
    };
    let area = 0.0;
    const p0 = this.vertex[0];
    i = 0;
    while (i < this.n) {
      const i1 = EvgTraceCurve.modI((i + 1), this.n);
      if ( this.tag[i1] == "CURVE" ) {
        const al = this.alpha[i1];
        const d1 = EvgTraceCurve.dpara(
          this.c2[i],
          this.vertex[i1],
          this.c2[i1]
        );
        area = area + ((0.3 * al) * (4.0 - al)) * (d1 / 2.0);
        const d2 = EvgTraceCurve.dpara(p0, this.c2[i], this.c2[i1]);
        area = area + d2 / 2.0;
      }
      areac.push(area);
      i = i + 1;
    };
    let pt = [];
    let pen = [];
    let lenArr = [];
    let optPen = [];
    let optC0 = [];
    let optC1 = [];
    let optT = [];
    let optS = [];
    let optAlpha = [];
    let optValid = [];
    i = 0;
    while (i <= this.n) {
      pt.push(0 - 1);
      pen.push(0.0);
      lenArr.push(0);
      optPen.push(0.0);
      optC0.push(EvgTracePoint.of(0.0, 0.0));
      optC1.push(EvgTracePoint.of(0.0, 0.0));
      optT.push(0.0);
      optS.push(0.0);
      optAlpha.push(0.0);
      optValid.push(0);
      i = i + 1;
    };
    pt[0] = 0 - 1;
    pen[0] = 0.0;
    lenArr[0] = 0;
    let j = 1;
    while (j <= this.n) {
      pt[j] = j - 1;
      pen[j] = pen[(j - 1)];
      lenArr[j] = lenArr[(j - 1)] + 1;
      let iBack = j - 2;
      while (iBack >= 0) {
        const res = this.optiPenalty(
          iBack,
          EvgTraceCurve.modI(j, this.n),
          opttolerance,
          convc,
          areac
        );
        if ( res.ok == false ) {
          iBack = 0 - 1;
        } else {
          const lenJ = lenArr[j];
          const lenI = lenArr[iBack];
          const penJ = pen[j];
          const penI = pen[iBack];
          let better = false;
          if ( lenJ > lenI + 1 ) {
            better = true;
          }
          if ( lenJ == lenI + 1 && penJ > penI + res.pen ) {
            better = true;
          }
          if ( better ) {
            pt[j] = iBack;
            pen[j] = penI + res.pen;
            lenArr[j] = lenI + 1;
            optPen[j] = res.pen;
            const jc0 = res.c0;
            const jc1 = res.c1;
            optC0[j] = jc0;
            optC1[j] = jc1;
            optT[j] = res.t;
            optS[j] = res.s;
            optAlpha[j] = res.alpha;
            optValid[j] = 1;
          }
          iBack = iBack - 1;
        }
      };
      j = j + 1;
    };
    const om = lenArr[this.n];
    if ( om >= this.n ) {
      return this;
    }
    if ( om < 3 ) {
      return this;
    }
    const ocurve = EvgTraceCurve.alloc(om);
    let sArr = [];
    let tArr = [];
    i = 0;
    while (i < om) {
      sArr.push(1.0);
      tArr.push(1.0);
      i = i + 1;
    };
    j = this.n;
    i = om - 1;
    while (i >= 0) {
      const prevJ = pt[j];
      if ( prevJ == j - 1 ) {
        const idx = EvgTraceCurve.modI(j, this.n);
        ocurve.tag[i] = this.tag[idx];
        ocurve.c0[i] = this.c0[idx];
        ocurve.c1[i] = this.c1[idx];
        ocurve.c2[i] = this.c2[idx];
        ocurve.vertex[i] = this.vertex[idx];
        ocurve.alpha[i] = this.alpha[idx];
        ocurve.alpha0[i] = this.alpha0[idx];
        ocurve.beta[i] = this.beta[idx];
        sArr[i] = 1.0;
        tArr[i] = 1.0;
      } else {
        const idx2 = EvgTraceCurve.modI(j, this.n);
        ocurve.tag[i] = "CURVE";
        ocurve.c0[i] = optC0[j];
        ocurve.c1[i] = optC1[j];
        ocurve.c2[i] = this.c2[idx2];
        const sVal = optS[j];
        const newV = EvgTraceCurve.interval(
          sVal,
          this.c2[idx2],
          this.vertex[idx2]
        );
        ocurve.vertex[i] = newV;
        ocurve.alpha[i] = optAlpha[j];
        ocurve.alpha0[i] = optAlpha[j];
        sArr[i] = optS[j];
        tArr[i] = optT[j];
      }
      j = prevJ;
      i = i - 1;
    };
    i = 0;
    while (i < om) {
      const i1_1 = EvgTraceCurve.modI((i + 1), om);
      const s0 = sArr[i];
      const t1 = tArr[i1_1];
      const denom = s0 + t1;
      if ( denom == 0.0 ) {
        ocurve.beta[i] = 0.5;
      } else {
        ocurve.beta[i] = s0 / denom;
      }
      i = i + 1;
    };
    return ocurve;
  };
  optiPenalty (i, j, opttolerance, convc, areac) {
    const res = new EvgTraceOpti();
    res.ok = false;
    if ( i == j ) {
      return res;
    }
    const m = this.n;
    let k = i;
    const i1 = EvgTraceCurve.modI((i + 1), m);
    let k1 = EvgTraceCurve.modI((k + 1), m);
    const conv = convc[k1];
    if ( conv == 0 ) {
      return res;
    }
    const d = EvgTraceCurve.ddist(this.vertex[i], this.vertex[i1]);
    k = k1;
    while (k != j) {
      k1 = EvgTraceCurve.modI((k + 1), m);
      const k2 = EvgTraceCurve.modI((k + 2), m);
      if ( convc[k1] != conv ) {
        return res;
      }
      const cp = EvgTraceCurve.cprod(
        this.vertex[i],
        this.vertex[i1],
        this.vertex[k1],
        this.vertex[k2]
      );
      if ( EvgTraceCurve.signD(cp) != conv ) {
        return res;
      }
      const ip = EvgTraceCurve.iprod1(
        this.vertex[i],
        this.vertex[i1],
        this.vertex[k1],
        this.vertex[k2]
      );
      const d2 = EvgTraceCurve.ddist(this.vertex[k1], this.vertex[k2]);
      if ( ip < (d * d2) * (0.0 - 0.999847695156) ) {
        return res;
      }
      k = k1;
    };
    const p0 = this.c2[EvgTraceCurve.modI(i, m)];
    const p1 = this.vertex[EvgTraceCurve.modI((i + 1), m)];
    const p2 = this.vertex[EvgTraceCurve.modI(j, m)];
    const p3 = this.c2[EvgTraceCurve.modI(j, m)];
    let area = areac[j] - areac[i];
    const areaAdj = EvgTraceCurve.dpara(this.vertex[0], this.c2[i], this.c2[j]);
    area = area - areaAdj / 2.0;
    if ( i >= j ) {
      area = area + areac[m];
    }
    const A1 = EvgTraceCurve.dpara(p0, p1, p2);
    const A2 = EvgTraceCurve.dpara(p0, p1, p3);
    const A3 = EvgTraceCurve.dpara(p0, p2, p3);
    const A4 = (A1 + A3) - A2;
    if ( A2 == A1 ) {
      return res;
    }
    const t = A3 / (A3 - A4);
    const s = A2 / (A2 - A1);
    const A = (A2 * t) / 2.0;
    if ( A == 0.0 ) {
      return res;
    }
    const R = area / A;
    const inner = 4.0 - R / 0.3;
    if ( inner < 0.0 ) {
      return res;
    }
    const joinAlpha = 2.0 - Math.sqrt(inner);
    res.c0 = EvgTraceCurve.interval((t * joinAlpha), p0, p1);
    res.c1 = EvgTraceCurve.interval((s * joinAlpha), p3, p2);
    res.alpha = joinAlpha;
    res.t = t;
    res.s = s;
    res.pen = 0.0;
    const q0 = p0;
    const q1 = EvgTracePoint.of(res.c0.x, res.c0.y);
    const q2 = EvgTracePoint.of(res.c1.x, res.c1.y);
    const q3 = p3;
    k = EvgTraceCurve.modI((i + 1), m);
    while (k != j) {
      k1 = EvgTraceCurve.modI((k + 1), m);
      const vk = this.vertex[k];
      const vk1 = this.vertex[k1];
      const tv = EvgTraceCurve.tangent(q0, q1, q2, q3, vk, vk1);
      if ( tv < 0.0 - 0.5 ) {
        return res;
      }
      const bezPt = EvgTraceCurve.bezierAt(tv, q0, q1, q2, q3);
      const dd = EvgTraceCurve.ddist(vk, vk1);
      if ( dd == 0.0 ) {
        return res;
      }
      let d1 = EvgTraceCurve.dpara(vk, vk1, bezPt);
      d1 = d1 / dd;
      if ( EvgTraceCurve.absD(d1) > opttolerance ) {
        return res;
      }
      if ( EvgTraceCurve.iprod(vk, vk1, bezPt) < 0.0 ) {
        return res;
      }
      if ( EvgTraceCurve.iprod(vk1, vk, bezPt) < 0.0 ) {
        return res;
      }
      res.pen = res.pen + d1 * d1;
      k = k1;
    };
    k = i;
    while (k != j) {
      k1 = EvgTraceCurve.modI((k + 1), m);
      const ck = this.c2[k];
      const ck1 = this.c2[k1];
      const tv2 = EvgTraceCurve.tangent(q0, q1, q2, q3, ck, ck1);
      if ( tv2 < 0.0 - 0.5 ) {
        return res;
      }
      const bezPt2 = EvgTraceCurve.bezierAt(tv2, q0, q1, q2, q3);
      const dd2 = EvgTraceCurve.ddist(ck, ck1);
      if ( dd2 == 0.0 ) {
        return res;
      }
      let d1b = EvgTraceCurve.dpara(ck, ck1, bezPt2);
      d1b = d1b / dd2;
      const vk1b = this.vertex[k1];
      let d2b = EvgTraceCurve.dpara(ck, ck1, vk1b);
      d2b = d2b / dd2;
      const ak1 = this.alpha[k1];
      d2b = d2b * (0.75 * ak1);
      if ( d2b < 0.0 ) {
        d1b = 0.0 - d1b;
        d2b = 0.0 - d2b;
      }
      if ( d1b < d2b - opttolerance ) {
        return res;
      }
      if ( d1b < d2b ) {
        const diff = d1b - d2b;
        res.pen = res.pen + diff * diff;
      }
      k = k1;
    };
    res.ok = true;
    return res;
  };
  emit (out) {
    if ( this.n < 3 ) {
      return;
    }
    if ( this.curveCount() == 0 ) {
      const v0 = this.vertex[0];
      out.push(VectorShapes.moveTo(v0.x, v0.y));
      let i = 1;
      while (i < this.n) {
        const v = this.vertex[i];
        out.push(VectorShapes.lineTo(v.x, v.y));
        i = i + 1;
      };
      out.push(VectorShapes.closePath());
      return;
    }
    const start = this.c2[(this.n - 1)];
    out.push(VectorShapes.moveTo(start.x, start.y));
    let i2 = 0;
    while (i2 < this.n) {
      const tg = this.tag[i2];
      const endP = this.c2[i2];
      if ( tg == "CORNER" ) {
        const corner = this.c1[i2];
        out.push(VectorShapes.lineTo(corner.x, corner.y));
        out.push(VectorShapes.lineTo(endP.x, endP.y));
      } else {
        const a = this.c0[i2];
        const b = this.c1[i2];
        out.push(VectorShapes.cubicTo(a.x, a.y, b.x, b.y, endP.x, endP.y));
      }
      i2 = i2 + 1;
    };
    out.push(VectorShapes.closePath());
  };
}
EvgTraceCurve.alloc = function(n) {
  const curve = new EvgTraceCurve();
  curve.n = n;
  let i = 0;
  while (i < n) {
    curve.tag.push("CURVE");
    curve.vertex.push(EvgTracePoint.of(0.0, 0.0));
    curve.c0.push(EvgTracePoint.of(0.0, 0.0));
    curve.c1.push(EvgTracePoint.of(0.0, 0.0));
    curve.c2.push(EvgTracePoint.of(0.0, 0.0));
    curve.alpha.push(0.0);
    curve.alpha0.push(0.0);
    curve.beta.push(0.5);
    i = i + 1;
  };
  return curve;
};
EvgTraceCurve.modI = function(a, n) {
  if ( n <= 0 ) {
    return 0;
  }
  let r = a - ((a / n) | 0) * n;
  if ( r < 0 ) {
    r = r + n;
  }
  return r;
};
EvgTraceCurve.absD = function(v) {
  if ( v < 0.0 ) {
    return 0.0 - v;
  }
  return v;
};
EvgTraceCurve.signD = function(v) {
  if ( v > 0.0 ) {
    return 1;
  }
  if ( v < 0.0 ) {
    return 0 - 1;
  }
  return 0;
};
EvgTraceCurve.interval = function(lambda, a, b) {
  return EvgTracePoint.of((a.x * (1.0 - lambda) + b.x * lambda), (a.y * (1.0 - lambda) + b.y * lambda));
};
EvgTraceCurve.dpara = function(p0, p1, p2) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p2.x - p0.x;
  const y2 = p2.y - p0.y;
  return x1 * y2 - y1 * x2;
};
EvgTraceCurve.cprod = function(p0, p1, p2, p3) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  return x1 * y2 - y1 * x2;
};
EvgTraceCurve.iprod = function(p0, p1, p2) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p2.x - p0.x;
  const y2 = p2.y - p0.y;
  return x1 * x2 + y1 * y2;
};
EvgTraceCurve.iprod1 = function(p0, p1, p2, p3) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  return x1 * x2 + y1 * y2;
};
EvgTraceCurve.ddist = function(p, q) {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
};
EvgTraceCurve.ddenom = function(p0, p2) {
  const ax = EvgTraceCurve.absD((p0.x - p2.x));
  const ay = EvgTraceCurve.absD((p0.y - p2.y));
  return ax + ay;
};
EvgTraceCurve.bezierAt = function(t, p0, p1, p2, p3) {
  const s = 1.0 - t;
  const s2 = s * s;
  const t2 = t * t;
  const x = ((s2 * s) * p0.x + ((3.0 * s2) * t) * p1.x) + (((3.0 * t2) * s) * p2.x + (t2 * t) * p3.x);
  const y = ((s2 * s) * p0.y + ((3.0 * s2) * t) * p1.y) + (((3.0 * t2) * s) * p2.y + (t2 * t) * p3.y);
  return EvgTracePoint.of(x, y);
};
EvgTraceCurve.tangent = function(p0, p1, p2, p3, q0, q1) {
  const A = EvgTraceCurve.cprod(p0, p1, q0, q1);
  const B = EvgTraceCurve.cprod(p1, p2, q0, q1);
  const C = EvgTraceCurve.cprod(p2, p3, q0, q1);
  const a = (A - 2.0 * B) + C;
  const b = (0.0 - 2.0 * A) + 2.0 * B;
  const c = A;
  const disc = b * b - (4.0 * a) * c;
  if ( a == 0.0 ) {
    return 0.0 - 1.0;
  }
  if ( disc < 0.0 ) {
    return 0.0 - 1.0;
  }
  const s = Math.sqrt(disc);
  const r1 = ((0.0 - b) + s) / (2.0 * a);
  const r2 = ((0.0 - b) - s) / (2.0 * a);
  if ( r1 >= 0.0 && r1 <= 1.0 ) {
    return r1;
  }
  if ( r2 >= 0.0 && r2 <= 1.0 ) {
    return r2;
  }
  return 0.0 - 1.0;
};
EvgTraceCurve.fromPolygon = function(poly, alphamax) {
  const m = poly.length;
  const curve = EvgTraceCurve.alloc(m);
  if ( m < 3 ) {
    return curve;
  }
  let i = 0;
  while (i < m) {
    curve.vertex[i] = poly[i];
    i = i + 1;
  };
  i = 0;
  while (i < m) {
    const j = EvgTraceCurve.modI((i + 1), m);
    const k = EvgTraceCurve.modI((i + 2), m);
    const vi = curve.vertex[i];
    const vj = curve.vertex[j];
    const vk = curve.vertex[k];
    const p4 = EvgTraceCurve.interval(0.5, vk, vj);
    const denom = EvgTraceCurve.ddenom(vi, vk);
    let alpha = 4.0 / 3.0;
    if ( denom != 0.0 ) {
      const para = EvgTraceCurve.dpara(vi, vj, vk);
      const ratio = para / denom;
      const dd = EvgTraceCurve.absD(ratio);
      if ( dd > 1.0 ) {
        alpha = 1.0 - 1.0 / dd;
      } else {
        alpha = 0.0;
      }
      alpha = alpha / 0.75;
    }
    curve.alpha0[j] = alpha;
    if ( alpha >= alphamax ) {
      curve.tag[j] = "CORNER";
      curve.c1[j] = vj;
      curve.c2[j] = p4;
      curve.alpha[j] = alpha;
    } else {
      let a2 = alpha;
      if ( a2 < 0.55 ) {
        a2 = 0.55;
      }
      if ( a2 > 1.0 ) {
        a2 = 1.0;
      }
      const p2 = EvgTraceCurve.interval((0.5 + 0.5 * a2), vi, vj);
      const p3 = EvgTraceCurve.interval((0.5 + 0.5 * a2), vk, vj);
      curve.tag[j] = "CURVE";
      curve.c0[j] = p2;
      curve.c1[j] = p3;
      curve.c2[j] = p4;
      curve.alpha[j] = a2;
    }
    curve.beta[j] = 0.5;
    i = i + 1;
  };
  return curve;
};
class PathBuilder  {
  constructor() {
    this.commands = [];
    this.curX = 0.0;
    this.curY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    this.started = false;
    let c_3 = [];
    this.commands = c_3;
  }
  reset () {
    let c = [];
    this.commands = c;
    this.curX = 0.0;
    this.curY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    this.started = false;
  };
  isEmpty () {
    return this.commands.length == 0;
  };
  commandCount () {
    return this.commands.length;
  };
  getCommands () {
    return this.commands;
  };
  moveTo (x, y) {
    this.commands.push(VectorShapes.moveTo(x, y));
    this.curX = x;
    this.curY = y;
    this.startX = x;
    this.startY = y;
    this.started = true;
  };
  lineTo (x, y) {
    if ( this.started == false ) {
      this.moveTo(x, y);
      return;
    }
    this.commands.push(VectorShapes.lineTo(x, y));
    this.curX = x;
    this.curY = y;
  };
  cubicTo (x1, y1, x2, y2, x, y) {
    if ( this.started == false ) {
      this.moveTo(x1, y1);
    }
    this.commands.push(VectorShapes.cubicTo(x1, y1, x2, y2, x, y));
    this.curX = x;
    this.curY = y;
  };
  quadTo (x1, y1, x, y) {
    if ( this.started == false ) {
      this.moveTo(x1, y1);
    }
    const c = new PathCommand();
    c.type = "Q";
    c.x1 = x1;
    c.y1 = y1;
    c.x = x;
    c.y = y;
    this.commands.push(c);
    this.curX = x;
    this.curY = y;
  };
  close () {
    if ( this.started == false ) {
      return;
    }
    this.commands.push(VectorShapes.closePath());
    this.curX = this.startX;
    this.curY = this.startY;
  };
  moveBy (dx, dy) {
    if ( this.started == false ) {
      this.moveTo(dx, dy);
      return;
    }
    this.moveTo(this.curX + dx, this.curY + dy);
  };
  lineBy (dx, dy) {
    if ( this.started == false ) {
      this.moveTo(dx, dy);
      return;
    }
    this.lineTo(this.curX + dx, this.curY + dy);
  };
  rotateAbout (cx, cy, degrees) {
    if ( degrees == 0.0 ) {
      return;
    }
    const rad = degrees * 0.017453292519943295;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const n = this.commands.length;
    let k = 0;
    while (k < n) {
      const one = this.commands[k];
      k = k + 1;
      const px = one.x - cx;
      const py = one.y - cy;
      one.x = cx + (px * c - py * s);
      one.y = cy + (px * s + py * c);
      const p1x = one.x1 - cx;
      const p1y = one.y1 - cy;
      one.x1 = cx + (p1x * c - p1y * s);
      one.y1 = cy + (p1x * s + p1y * c);
      const p2x = one.x2 - cx;
      const p2y = one.y2 - cy;
      one.x2 = cx + (p2x * c - p2y * s);
      one.y2 = cy + (p2x * s + p2y * c);
      if ( one.type == "A" ) {
        one.rotation = one.rotation + degrees;
      }
    };
  };
  addCommands (cmds) {
    const n = cmds.length;
    let k = 0;
    while (k < n) {
      const c = cmds[k];
      this.commands.push(c);
      if ( c.type == "M" ) {
        this.startX = c.x;
        this.startY = c.y;
        this.started = true;
      }
      if ( (c.type == "Z") == false ) {
        this.curX = c.x;
        this.curY = c.y;
      } else {
        this.curX = this.startX;
        this.curY = this.startY;
      }
      k = k + 1;
    };
    if ( n > 0 ) {
      this.started = true;
    }
  };
  addRect (x, y, w, h) {
    const negOne = 0.0 - 1.0;
    const cmds = VectorShapes.rect(x, y, w, h, negOne, negOne);
    this.addCommands(cmds);
  };
  addRoundedRect (x, y, w, h, rx, ry) {
    const cmds = VectorShapes.rect(x, y, w, h, rx, ry);
    this.addCommands(cmds);
  };
  addCircle (cx, cy, r) {
    const cmds = VectorShapes.circle(cx, cy, r);
    this.addCommands(cmds);
  };
  addEllipse (cx, cy, rx, ry) {
    const cmds = VectorShapes.ellipse(cx, cy, rx, ry);
    this.addCommands(cmds);
  };
  addLine (x1, y1, x2, y2) {
    const cmds = VectorShapes.line(x1, y1, x2, y2);
    this.addCommands(cmds);
  };
  addPolyline (pts) {
    const cmds = VectorShapes.polyline(pts);
    this.addCommands(cmds);
  };
  addPolygon (pts) {
    const cmds = VectorShapes.polygon(pts);
    this.addCommands(cmds);
  };
  addPathData (d) {
    const p = new SVGPathParser();
    p.parse(d);
    const cmds = p.getCommands();
    this.addCommands(cmds);
  };
  asPathData () {
    return VectorShapes.asPathData(this.commands);
  };
  bounds () {
    const b = new PathBounds();
    const n = this.commands.length;
    let seen = false;
    let k = 0;
    while (k < n) {
      const c = this.commands[k];
      if ( (c.type == "Z") == false ) {
        let xs = [];
        let ys = [];
        xs.push(c.x);
        ys.push(c.y);
        if ( c.type == "C" ) {
          xs.push(c.x1);
          ys.push(c.y1);
          xs.push(c.x2);
          ys.push(c.y2);
        }
        if ( c.type == "Q" ) {
          xs.push(c.x1);
          ys.push(c.y1);
        }
        let j = 0;
        while (j < xs.length) {
          const vx = xs[j];
          const vy = ys[j];
          if ( seen == false ) {
            b.minX = vx;
            b.maxX = vx;
            b.minY = vy;
            b.maxY = vy;
            seen = true;
          } else {
            if ( vx < b.minX ) {
              b.minX = vx;
            }
            if ( vx > b.maxX ) {
              b.maxX = vx;
            }
            if ( vy < b.minY ) {
              b.minY = vy;
            }
            if ( vy > b.maxY ) {
              b.maxY = vy;
            }
          }
          j = j + 1;
        };
      }
      k = k + 1;
    };
    b.width = b.maxX - b.minX;
    b.height = b.maxY - b.minY;
    return b;
  };
}
class EVGUnitDefaults  {
  constructor() {
    if (EVGUnitDefaults.__singleton_instance != null) {
      return EVGUnitDefaults.__singleton_instance;
    }
    this.unset = new EVGUnit();
    EVGUnitDefaults.__singleton_instance = this;
  }
}
EVGUnitDefaults.__singleton_instance = null;
EVGUnitDefaults.__singleton = function() {
  if (EVGUnitDefaults.__singleton_instance == null) {
    EVGUnitDefaults.__singleton_instance = new EVGUnitDefaults();
  }
  return EVGUnitDefaults.__singleton_instance;
};
class EVGUnit  {
  constructor() {
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
    this.rootFontSize = 14.0;
    this.viewportW = 0.0;
    this.viewportH = 0.0;
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
  }
  setContext (rfs, vw, vh) {
    if ( this.isSet == false ) {
      return;
    }
    this.rootFontSize = rfs;
    this.viewportW = vw;
    this.viewportH = vh;
  };
  resolve (parentSize, fontSize) {
    if ( this.isSet == false ) {
      if ( this.pixels != 0.0 ) {
        this.pixels = 0.0;
      }
      return;
    }
    if ( this.unitType == 0 ) {
      this.pixels = this.value;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 2 ) {
      this.pixels = fontSize * this.value;
      return;
    }
    if ( this.unitType == 5 ) {
      this.pixels = this.rootFontSize * this.value;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 7 ) {
      this.pixels = (this.viewportW * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 8 ) {
      this.pixels = (this.viewportH * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 4 ) {
      this.pixels = parentSize;
      return;
    }
    this.pixels = this.value;
  };
  resolveForHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      if ( this.pixels != 0.0 ) {
        this.pixels = 0.0;
      }
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  resolveWithHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      if ( this.pixels != 0.0 ) {
        this.pixels = 0.0;
      }
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  isPixels () {
    return this.unitType == 0;
  };
  isPercent () {
    return this.unitType == 1;
  };
  isEm () {
    return this.unitType == 2;
  };
  isRem () {
    return this.unitType == 5;
  };
  isHeightPercent () {
    return this.unitType == 3;
  };
  isFill () {
    return this.unitType == 4;
  };
  isViewport () {
    if ( this.unitType == 7 ) {
      return true;
    }
    return this.unitType == 8;
  };
  toString () {
    if ( this.isSet == false ) {
      return "unset";
    }
    if ( this.unitType == 0 ) {
      return (this.value.toString()) + "px";
    }
    if ( this.unitType == 1 ) {
      return (this.value.toString()) + "%";
    }
    if ( this.unitType == 2 ) {
      return (this.value.toString()) + "em";
    }
    if ( this.unitType == 3 ) {
      return (this.value.toString()) + "hp";
    }
    if ( this.unitType == 4 ) {
      return "fill";
    }
    if ( this.unitType == 5 ) {
      return (this.value.toString()) + "rem";
    }
    if ( this.unitType == 7 ) {
      return (this.value.toString()) + "vw";
    }
    if ( this.unitType == 8 ) {
      return (this.value.toString()) + "vh";
    }
    return (this.value.toString());
  };
}
EVGUnit.isNumeric = function(str) {
  const n = str.length;
  if ( n == 0 ) {
    return false;
  }
  let i = 0;
  let digits = 0;
  while (i < n) {
    const c = str.charCodeAt(i );
    const isDigit = c >= 48 && c <= 57;
    if ( isDigit ) {
      digits = digits + 1;
    } else {
      if ( c == 46 ) {
      } else {
        if ( c == 43 || c == 45 ) {
          if ( i > 0 ) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    i = i + 1;
  };
  return digits > 0;
};
EVGUnit.isAlpha = function(c) {
  if ( c >= 65 && c <= 90 ) {
    return true;
  }
  return c >= 97 && c <= 122;
};
EVGUnit.pxPerUnit = function(suffix) {
  if ( suffix == "pt" ) {
    return 96.0 / 72.0;
  }
  if ( suffix == "pc" ) {
    return 16.0;
  }
  if ( suffix == "in" ) {
    return 96.0;
  }
  if ( suffix == "mm" ) {
    return 96.0 / 25.4;
  }
  if ( suffix == "cm" ) {
    return 96.0 / 2.54;
  }
  return 0.0;
};
EVGUnit.create = function(val, uType) {
  const unit = new EVGUnit();
  unit.value = val;
  unit.unitType = uType;
  unit.isSet = true;
  return unit;
};
EVGUnit.px = function(val) {
  const unit = EVGUnit.create(val, 0);
  unit.pixels = val;
  return unit;
};
EVGUnit.percent = function(val) {
  return EVGUnit.create(val, 1);
};
EVGUnit.em = function(val) {
  return EVGUnit.create(val, 2);
};
EVGUnit.rem = function(val) {
  return EVGUnit.create(val, 5);
};
EVGUnit.heightPercent = function(val) {
  return EVGUnit.create(val, 3);
};
EVGUnit.fill = function() {
  return EVGUnit.create(100.0, 4);
};
EVGUnit.unset = function() {
  return EVGUnitDefaults.__singleton().unset;
};
EVGUnit.parse = function(str) {
  const unit = new EVGUnit();
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return unit;
  }
  if ( trimmed == "fill" ) {
    unit.value = 100.0;
    unit.unitType = 4;
    unit.isSet = true;
    return unit;
  }
  if ( trimmed == "auto" ) {
    return unit;
  }
  if ( trimmed == "fit-content" ) {
    unit.value = 0.0;
    unit.unitType = 6;
    unit.isSet = false;
    return unit;
  }
  const lastChar = trimmed.charCodeAt(__len - 1 );
  if ( lastChar == 37 ) {
    const numStr = trimmed.substring(0, __len - 1 );
    if ( EVGUnit.isNumeric(numStr) == false ) {
      return unit;
    }
    const numVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(numVal) != "undefined" ) {
      unit.value = numVal;
      unit.unitType = 1;
      unit.isSet = true;
    }
    return unit;
  }
  if ( __len >= 3 ) {
    const suffix3 = trimmed.substring(__len - 3, __len );
    if ( suffix3 == "rem" ) {
      const numStr3 = trimmed.substring(0, __len - 3 );
      if ( EVGUnit.isNumeric(numStr3) == false ) {
        return unit;
      }
      const numVal3 = isNaN( parseFloat(numStr3) ) ? undefined : parseFloat(numStr3);
      if ( typeof(numVal3) != "undefined" ) {
        unit.value = numVal3;
        unit.unitType = 5;
        unit.isSet = true;
      }
      return unit;
    }
  }
  if ( __len >= 2 ) {
    const suffix = trimmed.substring(__len - 2, __len );
    const perUnit = EVGUnit.pxPerUnit(suffix);
    if ( perUnit > 0.0 ) {
      const numStrA = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStrA) == false ) {
        return unit;
      }
      const numValA = isNaN( parseFloat(numStrA) ) ? undefined : parseFloat(numStrA);
      if ( typeof(numValA) != "undefined" ) {
        unit.value = numValA * perUnit;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "em" ) {
      const numStr_1 = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStr_1) == false ) {
        return unit;
      }
      const numVal_1 = isNaN( parseFloat(numStr_1) ) ? undefined : parseFloat(numStr_1);
      if ( typeof(numVal_1) != "undefined" ) {
        unit.value = numVal_1;
        unit.unitType = 2;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "px" ) {
      const numStr_2 = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStr_2) == false ) {
        return unit;
      }
      const numVal_2 = isNaN( parseFloat(numStr_2) ) ? undefined : parseFloat(numStr_2);
      if ( typeof(numVal_2) != "undefined" ) {
        unit.value = numVal_2;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "hp" ) {
      const numStr_3 = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStr_3) == false ) {
        return unit;
      }
      const numVal_3 = isNaN( parseFloat(numStr_3) ) ? undefined : parseFloat(numStr_3);
      if ( typeof(numVal_3) != "undefined" ) {
        unit.value = numVal_3;
        unit.unitType = 3;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "vw" ) {
      const numStrVW = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStrVW) == false ) {
        return unit;
      }
      const numValVW = isNaN( parseFloat(numStrVW) ) ? undefined : parseFloat(numStrVW);
      if ( typeof(numValVW) != "undefined" ) {
        unit.value = numValVW;
        unit.unitType = 7;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "vh" ) {
      const numStrVH = trimmed.substring(0, __len - 2 );
      if ( EVGUnit.isNumeric(numStrVH) == false ) {
        return unit;
      }
      const numValVH = isNaN( parseFloat(numStrVH) ) ? undefined : parseFloat(numStrVH);
      if ( typeof(numValVH) != "undefined" ) {
        unit.value = numValVH;
        unit.unitType = 8;
        unit.isSet = true;
      }
      return unit;
    }
  }
  if ( EVGUnit.isAlpha(lastChar) || lastChar == 41 ) {
    return unit;
  }
  const numVal_4 = isNaN( parseFloat(trimmed) ) ? undefined : parseFloat(trimmed);
  if ( typeof(numVal_4) != "undefined" ) {
    unit.value = numVal_4;
    unit.pixels = unit.value;
    unit.unitType = 0;
    unit.isSet = true;
  }
  return unit;
};
class EVGRejectStore  {
  constructor() {
    if (EVGRejectStore.__singleton_instance != null) {
      return EVGRejectStore.__singleton_instance;
    }
    this.kinds = [];
    this.names = [];
    this.values = [];
    this.total = 0;
    this.cap = 64;
    EVGRejectStore.__singleton_instance = this;
  }
}
EVGRejectStore.__singleton_instance = null;
EVGRejectStore.__singleton = function() {
  if (EVGRejectStore.__singleton_instance == null) {
    EVGRejectStore.__singleton_instance = new EVGRejectStore();
  }
  return EVGRejectStore.__singleton_instance;
};
class EVGReject  {
  constructor() {
  }
}
EVGReject.store = function() {
  return EVGRejectStore.__singleton();
};
EVGReject.note = function(kind, name, value) {
  const s = EVGReject.store();
  s.total = s.total + 1;
  const n = s.names.length;
  if ( n >= s.cap ) {
    return;
  }
  let i = 0;
  while (i < n) {
    const kn = s.kinds[i];
    const nm = s.names[i];
    const vl = s.values[i];
    if ( (kn == kind && nm == name) && vl == value ) {
      return;
    }
    i = i + 1;
  };
  s.kinds.push(kind);
  s.names.push(name);
  s.values.push(value);
};
EVGReject.noteCount = function() {
  const s = EVGReject.store();
  return s.names.length;
};
EVGReject.noteTotal = function() {
  const s = EVGReject.store();
  return s.total;
};
EVGReject.noteAt = function(i) {
  const s = EVGReject.store();
  const kn = s.kinds[i];
  const nm = s.names[i];
  const vl = s.values[i];
  return (((kn + ": ") + nm) + ": ") + vl;
};
EVGReject.clearNotes = function() {
  const s = EVGReject.store();
  let empty1 = [];
  let empty2 = [];
  let empty3 = [];
  s.kinds = empty1;
  s.names = empty2;
  s.values = empty3;
  s.total = 0;
};
EVGReject.isAbsent = function(value) {
  if ( value.length == 0 ) {
    return true;
  }
  if ( value == "auto" ) {
    return true;
  }
  if ( value == "none" ) {
    return true;
  }
  if ( value == "normal" ) {
    return true;
  }
  if ( value == "initial" ) {
    return true;
  }
  if ( value == "inherit" ) {
    return true;
  }
  if ( value == "unset" ) {
    return true;
  }
  return false;
};
class EVGColorDefaults  {
  constructor() {
    if (EVGColorDefaults.__singleton_instance != null) {
      return EVGColorDefaults.__singleton_instance;
    }
    this.noColor = new EVGColor();
    this.black = new EVGColor();
    this.noColor.isSet = false;
    EVGColorDefaults.__singleton_instance = this;
  }
}
EVGColorDefaults.__singleton_instance = null;
EVGColorDefaults.__singleton = function() {
  if (EVGColorDefaults.__singleton_instance == null) {
    EVGColorDefaults.__singleton_instance = new EVGColorDefaults();
  }
  return EVGColorDefaults.__singleton_instance;
};
class EVGColor  {
  constructor() {
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
  }
  red () {
    if ( this.r > 255.0 ) {
      return 255;
    }
    if ( this.r < 0.0 ) {
      return 0;
    }
    return Math.floor( this.r + 0.5);
  };
  green () {
    if ( this.g > 255.0 ) {
      return 255;
    }
    if ( this.g < 0.0 ) {
      return 0;
    }
    return Math.floor( this.g + 0.5);
  };
  blue () {
    if ( this.b > 255.0 ) {
      return 255;
    }
    if ( this.b < 0.0 ) {
      return 0;
    }
    return Math.floor( this.b + 0.5);
  };
  alpha () {
    if ( this.a < 0.0 ) {
      return 0.0;
    }
    if ( this.a > 1.0 ) {
      return 1.0;
    }
    return this.a;
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "none";
    }
    if ( this.a < 1.0 ) {
      return ((((((("rgba(" + (this.red().toString())) + ",") + (this.green().toString())) + ",") + (this.blue().toString())) + ",") + (this.alpha().toString())) + ")";
    }
    return ((((("rgb(" + (this.red().toString())) + ",") + (this.green().toString())) + ",") + (this.blue().toString())) + ")";
  };
  toHexString () {
    if ( this.isSet == false ) {
      return "none";
    }
    const hexChars = "0123456789ABCDEF";
    const rH = this.red();
    const gH = this.green();
    const bH = this.blue();
    const r1D = rH / 16.0;
    const r1 = Math.floor( r1D);
    const r2 = rH % 16;
    const g1D = gH / 16.0;
    const g1 = Math.floor( g1D);
    const g2 = gH % 16;
    const b1D = bH / 16.0;
    const b1 = Math.floor( b1D);
    const b2 = bH % 16;
    return ((((("#" + String.fromCharCode(hexChars.charCodeAt(r1 ))) + String.fromCharCode(hexChars.charCodeAt(r2 ))) + String.fromCharCode(hexChars.charCodeAt(g1 ))) + String.fromCharCode(hexChars.charCodeAt(g2 ))) + String.fromCharCode(hexChars.charCodeAt(b1 ))) + String.fromCharCode(hexChars.charCodeAt(b2 ));
  };
  toPDFColorString () {
    if ( this.isSet == false ) {
      return "";
    }
    const rN = this.r / 255.0;
    const gN = this.g / 255.0;
    const bN = this.b / 255.0;
    return ((((rN.toString()) + " ") + (gN.toString())) + " ") + (bN.toString());
  };
  withAlpha (newAlpha) {
    return EVGColor.create(this.r, this.g, this.b, newAlpha);
  };
  lighten (amount) {
    const newR = this.r + (255.0 - this.r) * amount;
    const newG = this.g + (255.0 - this.g) * amount;
    const newB = this.b + (255.0 - this.b) * amount;
    return EVGColor.create(newR, newG, newB, this.a);
  };
  darken (amount) {
    const newR = this.r * (1.0 - amount);
    const newG = this.g * (1.0 - amount);
    const newB = this.b * (1.0 - amount);
    return EVGColor.create(newR, newG, newB, this.a);
  };
}
EVGColor.create = function(red, green, blue, alpha) {
  const c = new EVGColor();
  c.r = red;
  c.g = green;
  c.b = blue;
  c.a = alpha;
  c.isSet = true;
  return c;
};
EVGColor.rgb = function(red, green, blue) {
  return EVGColor.create(red, green, blue, 1.0);
};
EVGColor.rgba = function(red, green, blue, alpha) {
  return EVGColor.create(red, green, blue, alpha);
};
EVGColor.noColor = function() {
  return EVGColorDefaults.__singleton().noColor;
};
EVGColor.black = function() {
  return EVGColorDefaults.__singleton().black;
};
EVGColor.white = function() {
  return EVGColor.rgb(255, 255, 255);
};
EVGColor.transparent = function() {
  return EVGColor.rgba(0, 0, 0, 0.0);
};
EVGColor.hexDigit = function(ch) {
  if ( ch >= 48 && ch <= 57 ) {
    return ch - 48;
  }
  if ( ch >= 65 && ch <= 70 ) {
    return (ch - 65) + 10;
  }
  if ( ch >= 97 && ch <= 102 ) {
    return (ch - 97) + 10;
  }
  return 0;
};
EVGColor.parseHex = function(hex) {
  const c = new EVGColor();
  let __len = hex.length;
  let start = 0;
  if ( __len > 0 ) {
    const firstChar = hex.charCodeAt(0 );
    if ( firstChar == 35 ) {
      start = 1;
      __len = __len - 1;
    }
  }
  if ( __len == 3 ) {
    const r1 = EVGColor.hexDigit(hex.charCodeAt(start ));
    const g1 = EVGColor.hexDigit(hex.charCodeAt(start + 1 ));
    const b1 = EVGColor.hexDigit(hex.charCodeAt(start + 2 ));
    c.r = (r1 * 16 + r1);
    c.g = (g1 * 16 + g1);
    c.b = (b1 * 16 + b1);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 4 ) {
    const r4 = EVGColor.hexDigit(hex.charCodeAt(start ));
    const g4 = EVGColor.hexDigit(hex.charCodeAt(start + 1 ));
    const b4 = EVGColor.hexDigit(hex.charCodeAt(start + 2 ));
    const a4 = EVGColor.hexDigit(hex.charCodeAt(start + 3 ));
    c.r = (r4 * 16 + r4);
    c.g = (g4 * 16 + g4);
    c.b = (b4 * 16 + b4);
    c.a = (a4 * 16 + a4) / 255.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 6 ) {
    const r1_1 = EVGColor.hexDigit(hex.charCodeAt(start ));
    const r2 = EVGColor.hexDigit(hex.charCodeAt(start + 1 ));
    const g1_1 = EVGColor.hexDigit(hex.charCodeAt(start + 2 ));
    const g2 = EVGColor.hexDigit(hex.charCodeAt(start + 3 ));
    const b1_1 = EVGColor.hexDigit(hex.charCodeAt(start + 4 ));
    const b2 = EVGColor.hexDigit(hex.charCodeAt(start + 5 ));
    c.r = (r1_1 * 16 + r2);
    c.g = (g1_1 * 16 + g2);
    c.b = (b1_1 * 16 + b2);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 8 ) {
    const r1_2 = EVGColor.hexDigit(hex.charCodeAt(start ));
    const r2_1 = EVGColor.hexDigit(hex.charCodeAt(start + 1 ));
    const g1_2 = EVGColor.hexDigit(hex.charCodeAt(start + 2 ));
    const g2_1 = EVGColor.hexDigit(hex.charCodeAt(start + 3 ));
    const b1_2 = EVGColor.hexDigit(hex.charCodeAt(start + 4 ));
    const b2_1 = EVGColor.hexDigit(hex.charCodeAt(start + 5 ));
    const a1 = EVGColor.hexDigit(hex.charCodeAt(start + 6 ));
    const a2 = EVGColor.hexDigit(hex.charCodeAt(start + 7 ));
    c.r = (r1_2 * 16 + r2_1);
    c.g = (g1_2 * 16 + g2_1);
    c.b = (b1_2 * 16 + b2_1);
    c.a = (a1 * 16 + a2) / 255.0;
    c.isSet = true;
    return c;
  }
  c.isSet = false;
  return c;
};
EVGColor.hue6 = function(p, q, t6in) {
  let t6 = t6in;
  while (t6 < 0.0) {
    t6 = t6 + 6.0;
  };
  while (t6 >= 6.0) {
    t6 = t6 - 6.0;
  };
  if ( t6 < 1.0 ) {
    return p + (q - p) * t6;
  }
  if ( t6 < 3.0 ) {
    return q;
  }
  if ( t6 < 4.0 ) {
    return p + (q - p) * (4.0 - t6);
  }
  return p;
};
EVGColor.hue2rgb = function(p, q, tt) {
  let t = tt;
  if ( t < 0.0 ) {
    t = t + 1.0;
  }
  if ( t > 1.0 ) {
    t = t - 1.0;
  }
  const t6 = t * 6.0;
  if ( t6 < 1.0 ) {
    return p + (q - p) * t6;
  }
  if ( t6 < 3.0 ) {
    return q;
  }
  if ( t6 < 4.0 ) {
    return p + (q - p) * (4.0 - t6);
  }
  return p;
};
EVGColor.hslToRgb = function(h, s, l) {
  const c = new EVGColor();
  const hNorm = h / 360.0;
  const sNorm = s / 100.0;
  const lNorm = l / 100.0;
  if ( sNorm == 0.0 ) {
    const gray = lNorm * 255.0;
    c.r = gray;
    c.g = gray;
    c.b = gray;
  } else {
    let q = 0.0;
    if ( lNorm < 0.5 ) {
      q = lNorm * (1.0 + sNorm);
    } else {
      q = (lNorm + sNorm) - lNorm * sNorm;
    }
    const p = 2.0 * lNorm - q;
    const h6 = h / 60.0;
    c.r = EVGColor.hue6(p, q, (h6 + 2.0)) * 255.0;
    c.g = EVGColor.hue6(p, q, h6) * 255.0;
    c.b = EVGColor.hue6(p, q, (h6 - 2.0)) * 255.0;
  }
  c.a = 1.0;
  c.isSet = true;
  return c;
};
EVGColor.parseNumber = function(str) {
  const val = isNaN( parseFloat(str.trim()) ) ? undefined : parseFloat(str.trim());
  return val;
};
EVGColor.parse = function(str) {
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return EVGColor.noColor();
  }
  const firstChar = trimmed.charCodeAt(0 );
  if ( firstChar == 35 ) {
    return EVGColor.parseHex(trimmed);
  }
  if ( __len >= 4 ) {
    const prefix = trimmed.substring(0, 4 );
    if ( prefix == "rgba" ) {
      return EVGColor.parseRgba(trimmed);
    }
    const prefix3 = trimmed.substring(0, 3 );
    if ( prefix3 == "rgb" ) {
      return EVGColor.parseRgb(trimmed);
    }
    if ( prefix3 == "hsl" ) {
      return EVGColor.parseHsl(trimmed);
    }
  }
  return EVGColor.parseNamed(trimmed);
};
EVGColor.parseRgb = function(str) {
  const c = new EVGColor();
  const __len = str.length;
  let start = 0;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    i = i + 1;
  };
  let end = __len - 1;
  i = __len - 1;
  while (i >= 0) {
    const ch_1 = str.charCodeAt(i );
    if ( ch_1 == 41 ) {
      end = i;
    }
    i = i - 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_2 = content.charCodeAt(i );
    if ( ch_2 == 44 || ch_2 == 32 ) {
      const trimPart = current.trim();
      if ( trimPart.length > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + String.fromCharCode(ch_2);
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( trimPart_1.length > 0 ) {
    parts.push(trimPart_1);
  }
  if ( parts.length >= 3 ) {
    c.r = EVGColor.parseNumber(parts[0]);
    c.g = EVGColor.parseNumber(parts[1]);
    c.b = EVGColor.parseNumber(parts[2]);
    c.a = 1.0;
    c.isSet = true;
  }
  return c;
};
EVGColor.parseRgba = function(str) {
  const c = EVGColor.parseRgb(str);
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( ch_1 == 44 || ch_1 == 32 ) {
      const trimPart = current.trim();
      if ( trimPart.length > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + String.fromCharCode(ch_1);
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( trimPart_1.length > 0 ) {
    parts.push(trimPart_1);
  }
  if ( parts.length >= 4 ) {
    c.r = EVGColor.parseNumber(parts[0]);
    c.g = EVGColor.parseNumber(parts[1]);
    c.b = EVGColor.parseNumber(parts[2]);
    c.a = EVGColor.parseNumber(parts[3]);
    c.isSet = true;
  }
  return c;
};
EVGColor.parseHsl = function(str) {
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( ch_1 == 44 || ch_1 == 32 ) {
      const trimPart = current.trim();
      if ( trimPart.length > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + String.fromCharCode(ch_1);
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( trimPart_1.length > 0 ) {
    parts.push(trimPart_1);
  }
  if ( parts.length >= 3 ) {
    const h = EVGColor.parseNumber(parts[0]);
    const s = EVGColor.parseNumber(parts[1]);
    const l = EVGColor.parseNumber(parts[2]);
    const c = EVGColor.hslToRgb(h, s, l);
    if ( parts.length >= 4 ) {
      c.a = EVGColor.parseNumber(parts[3]);
    }
    return c;
  }
  return EVGColor.noColor();
};
EVGColor.parseNamed = function(name) {
  let lower = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const ch = name.charCodeAt(i );
    if ( ch >= 65 && ch <= 90 ) {
      lower = lower + String.fromCharCode(ch + 32);
    } else {
      lower = lower + String.fromCharCode(ch);
    }
    i = i + 1;
  };
  if ( lower == "black" ) {
    return EVGColor.rgb(0, 0, 0);
  }
  if ( lower == "white" ) {
    return EVGColor.rgb(255, 255, 255);
  }
  if ( lower == "red" ) {
    return EVGColor.rgb(255, 0, 0);
  }
  if ( lower == "green" ) {
    return EVGColor.rgb(0, 128, 0);
  }
  if ( lower == "blue" ) {
    return EVGColor.rgb(0, 0, 255);
  }
  if ( lower == "yellow" ) {
    return EVGColor.rgb(255, 255, 0);
  }
  if ( lower == "cyan" ) {
    return EVGColor.rgb(0, 255, 255);
  }
  if ( lower == "magenta" ) {
    return EVGColor.rgb(255, 0, 255);
  }
  if ( lower == "gray" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "grey" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "orange" ) {
    return EVGColor.rgb(255, 165, 0);
  }
  if ( lower == "purple" ) {
    return EVGColor.rgb(128, 0, 128);
  }
  if ( lower == "pink" ) {
    return EVGColor.rgb(255, 192, 203);
  }
  if ( lower == "brown" ) {
    return EVGColor.rgb(165, 42, 42);
  }
  if ( lower == "navy" ) {
    return EVGColor.rgb(0, 0, 128);
  }
  if ( lower == "teal" ) {
    return EVGColor.rgb(0, 128, 128);
  }
  if ( lower == "olive" ) {
    return EVGColor.rgb(128, 128, 0);
  }
  if ( lower == "maroon" ) {
    return EVGColor.rgb(128, 0, 0);
  }
  if ( lower == "silver" ) {
    return EVGColor.rgb(192, 192, 192);
  }
  if ( lower == "lime" ) {
    return EVGColor.rgb(0, 255, 0);
  }
  if ( lower == "aqua" ) {
    return EVGColor.rgb(0, 255, 255);
  }
  if ( lower == "fuchsia" ) {
    return EVGColor.rgb(255, 0, 255);
  }
  if ( lower == "transparent" ) {
    return EVGColor.transparent();
  }
  if ( lower == "none" ) {
    return EVGColor.noColor();
  }
  return EVGColor.noColor();
};
class EVGEasing  {
  constructor() {
    this.kind = 0;
    this.x1 = 0.0;
    this.y1 = 0.0;
    this.x2 = 1.0;
    this.y2 = 1.0;
    this.stepCount = 1;
    this.jumpStart = false;
    this.ok = true;
  }
  ease (t) {
    let x = t;
    if ( x < 0.0 ) {
      x = 0.0;
    }
    if ( x > 1.0 ) {
      x = 1.0;
    }
    if ( this.kind == 1 ) {
      return this.stepAt(x);
    }
    if ( ((this.x1 == 0.0 && this.y1 == 0.0) && this.x2 == 1.0) && this.y2 == 1.0 ) {
      return x;
    }
    return this.sampleY(this.solveT(x));
  };
  stepAt (x) {
    const n = this.stepCount;
    const raw = x * n;
    let k = Math.floor(raw);
    if ( this.jumpStart ) {
      k = k + 1;
    }
    const v = k / n;
    if ( v < 0.0 ) {
      return 0.0;
    }
    if ( v > 1.0 ) {
      return 1.0;
    }
    return v;
  };
  sampleX (t) {
    const cx = 3.0 * this.x1;
    const bx = 3.0 * (this.x2 - this.x1) - cx;
    const a = (1.0 - cx) - bx;
    return ((a * t + bx) * t + cx) * t;
  };
  sampleY (t) {
    const cy = 3.0 * this.y1;
    const by = 3.0 * (this.y2 - this.y1) - cy;
    const a = (1.0 - cy) - by;
    return ((a * t + by) * t + cy) * t;
  };
  slopeX (t) {
    const cx = 3.0 * this.x1;
    const bx = 3.0 * (this.x2 - this.x1) - cx;
    const a = (1.0 - cx) - bx;
    return ((3.0 * a) * t + 2.0 * bx) * t + cx;
  };
  solveT (x) {
    let t = x;
    let i = 0;
    while (i < 8) {
      const err = this.sampleX(t) - x;
      if ( Math.abs(err) < 1e-7 ) {
        return t;
      }
      const d = this.slopeX(t);
      if ( Math.abs(d) < 0.000001 ) {
        i = 8;
      } else {
        t = t - err / d;
        if ( t < 0.0 || t > 1.0 ) {
          i = 8;
        }
        i = i + 1;
      }
    };
    let lo = 0.0;
    let hi = 1.0;
    let m = x;
    if ( m < lo || m > hi ) {
      m = 0.5;
    }
    let j = 0;
    while (j < 64) {
      const v = this.sampleX(m);
      if ( Math.abs(v - x) < 1e-7 ) {
        return m;
      }
      if ( v < x ) {
        lo = m;
      } else {
        hi = m;
      }
      m = (lo + hi) / 2.0;
      j = j + 1;
    };
    return m;
  };
}
EVGEasing.cubic = function(x1, y1, x2, y2) {
  const e = new EVGEasing();
  e.kind = 0;
  e.x1 = x1;
  e.y1 = y1;
  e.x2 = x2;
  e.y2 = y2;
  return e;
};
EVGEasing.linear = function() {
  return EVGEasing.cubic(0.0, 0.0, 1.0, 1.0);
};
EVGEasing.steps = function(count, atStart) {
  const e = new EVGEasing();
  e.kind = 1;
  e.stepCount = count;
  if ( count < 1 ) {
    e.stepCount = 1;
  }
  e.jumpStart = atStart;
  return e;
};
EVGEasing.parse = function(text) {
  const t = text.trim();
  if ( t.length == 0 ) {
    return EVGEasing.linear();
  }
  if ( t == "linear" ) {
    return EVGEasing.cubic(0.0, 0.0, 1.0, 1.0);
  }
  if ( t == "ease" ) {
    return EVGEasing.cubic(0.25, 0.1, 0.25, 1.0);
  }
  if ( t == "ease-in" ) {
    return EVGEasing.cubic(0.42, 0.0, 1.0, 1.0);
  }
  if ( t == "ease-out" ) {
    return EVGEasing.cubic(0.0, 0.0, 0.58, 1.0);
  }
  if ( t == "ease-in-out" ) {
    return EVGEasing.cubic(0.42, 0.0, 0.58, 1.0);
  }
  if ( t == "step-start" ) {
    return EVGEasing.steps(1, true);
  }
  if ( t == "step-end" ) {
    return EVGEasing.steps(1, false);
  }
  const args = EVGEasing.argsOf(t, "cubic-bezier");
  if ( args.length > 0 ) {
    const nums = EVGEasing.numbers(args);
    if ( nums.length == 4 ) {
      const cx1 = EVGEasing.clamp01(nums[0]);
      const cx2 = EVGEasing.clamp01(nums[2]);
      return EVGEasing.cubic(cx1, nums[1], cx2, nums[3]);
    }
    const bad = EVGEasing.linear();
    bad.ok = false;
    return bad;
  }
  const sargs = EVGEasing.argsOf(t, "steps");
  if ( sargs.length > 0 ) {
    const parts = EVGEasing.splitTop(sargs, 44);
    const countTxt = parts[0].trim();
    const n = isNaN( parseFloat(countTxt) ) ? undefined : parseFloat(countTxt);
    if ( typeof(n) != "undefined" ) {
      let atStart = false;
      if ( parts.length > 1 ) {
        const word = parts[1].trim();
        if ( word == "start" || word == "jump-start" ) {
          atStart = true;
        }
      }
      return EVGEasing.steps(Math.floor( n), atStart);
    }
  }
  const unknown = EVGEasing.linear();
  unknown.ok = false;
  return unknown;
};
EVGEasing.looksLikeFunction = function(text) {
  const t = text.trim();
  if ( t == "linear" ) {
    return true;
  }
  if ( t == "ease" ) {
    return true;
  }
  if ( t == "ease-in" ) {
    return true;
  }
  if ( t == "ease-out" ) {
    return true;
  }
  if ( t == "ease-in-out" ) {
    return true;
  }
  if ( t == "step-start" ) {
    return true;
  }
  if ( t == "step-end" ) {
    return true;
  }
  if ( EVGEasing.argsOf(t, "cubic-bezier").length > 0 ) {
    return true;
  }
  if ( EVGEasing.argsOf(t, "steps").length > 0 ) {
    return true;
  }
  const n = t.length;
  if ( n > 2 ) {
    if ( t.charCodeAt(n - 1 ) == 41 ) {
      let i = 0;
      while (i < n) {
        if ( t.charCodeAt(i ) == 40 ) {
          return true;
        }
        i = i + 1;
      };
    }
  }
  return false;
};
EVGEasing.argsOf = function(t, name) {
  const nl = name.length;
  const tl = t.length;
  if ( tl < nl + 3 ) {
    return "";
  }
  if ( t.substring(0, nl ) != name ) {
    return "";
  }
  if ( t.charCodeAt(nl ) != 40 ) {
    return "";
  }
  if ( t.charCodeAt(tl - 1 ) != 41 ) {
    return "";
  }
  return t.substring(nl + 1, tl - 1 );
};
EVGEasing.numbers = function(s) {
  let out = [];
  const parts = EVGEasing.splitTop(s, 44);
  let i = 0;
  while (i < parts.length) {
    const v = isNaN( parseFloat(parts[i].trim()) ) ? undefined : parseFloat(parts[i].trim());
    if ( typeof(v) != "undefined" ) {
      out.push(v);
    }
    i = i + 1;
  };
  return out;
};
EVGEasing.splitTop = function(s, ch) {
  let out = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s.charCodeAt(i );
    if ( c == 40 ) {
      depth = depth + 1;
    }
    if ( c == 41 ) {
      depth = depth - 1;
    }
    if ( c == ch && depth == 0 ) {
      out.push(s.substring(start, i ));
      start = i + 1;
    }
    i = i + 1;
  };
  out.push(s.substring(start, n ));
  return out;
};
EVGEasing.splitWordsTop = function(s) {
  let out = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s.charCodeAt(i );
    if ( c == 40 ) {
      depth = depth + 1;
    }
    if ( c == 41 ) {
      depth = depth - 1;
    }
    const isSpace = (c == 32 || c == 9) || c == 10;
    if ( isSpace && depth == 0 ) {
      if ( i > start ) {
        out.push(s.substring(start, i ));
      }
      start = i + 1;
    }
    i = i + 1;
  };
  if ( n > start ) {
    out.push(s.substring(start, n ));
  }
  return out;
};
EVGEasing.clamp01 = function(v) {
  if ( v < 0.0 ) {
    return 0.0;
  }
  if ( v > 1.0 ) {
    return 1.0;
  }
  return v;
};
class EVGBox  {
  constructor() {
    this.marginTop = undefined;
    this.marginRight = undefined;
    this.marginBottom = undefined;
    this.marginLeft = undefined;
    this.paddingTop = undefined;
    this.paddingRight = undefined;
    this.paddingBottom = undefined;
    this.paddingLeft = undefined;
    this.borderWidth = undefined;
    this.borderColor = undefined;
    this.borderRadius = undefined;
    this.borderRadiusTL = undefined;
    this.borderRadiusTR = undefined;
    this.borderRadiusBR = undefined;
    this.borderRadiusBL = undefined;
    this.marginTopPx = 0.0;
    this.marginRightPx = 0.0;
    this.marginBottomPx = 0.0;
    this.marginLeftPx = 0.0;
    this.paddingTopPx = 0.0;
    this.paddingRightPx = 0.0;
    this.paddingBottomPx = 0.0;
    this.paddingLeftPx = 0.0;
    this.borderWidthPx = 0.0;
    this.borderRadiusPx = 0.0;
    this.borderRadiusTLPx = 0.0;
    this.borderRadiusTRPx = 0.0;
    this.borderRadiusBRPx = 0.0;
    this.borderRadiusBLPx = 0.0;
    this.marginTop = EVGUnit.unset();
    this.marginRight = EVGUnit.unset();
    this.marginBottom = EVGUnit.unset();
    this.marginLeft = EVGUnit.unset();
    this.paddingTop = EVGUnit.unset();
    this.paddingRight = EVGUnit.unset();
    this.paddingBottom = EVGUnit.unset();
    this.paddingLeft = EVGUnit.unset();
    this.borderWidth = EVGUnit.unset();
    this.borderColor = EVGColor.noColor();
    this.borderRadius = EVGUnit.unset();
    this.borderRadiusTL = EVGUnit.unset();
    this.borderRadiusTR = EVGUnit.unset();
    this.borderRadiusBR = EVGUnit.unset();
    this.borderRadiusBL = EVGUnit.unset();
  }
  setMargin (all) {
    this.marginTop = all;
    this.marginRight = all;
    this.marginBottom = all;
    this.marginLeft = all;
  };
  setMarginValues (top, right, bottom, left) {
    this.marginTop = top;
    this.marginRight = right;
    this.marginBottom = bottom;
    this.marginLeft = left;
  };
  setPadding (all) {
    this.paddingTop = all;
    this.paddingRight = all;
    this.paddingBottom = all;
    this.paddingLeft = all;
  };
  setPaddingValues (top, right, bottom, left) {
    this.paddingTop = top;
    this.paddingRight = right;
    this.paddingBottom = bottom;
    this.paddingLeft = left;
  };
  resolveUnits (parentWidth, parentHeight, fontSize, rootFontSize, viewportW, viewportH) {
    this.marginTop.setContext(rootFontSize, viewportW, viewportH);
    this.marginRight.setContext(rootFontSize, viewportW, viewportH);
    this.marginBottom.setContext(rootFontSize, viewportW, viewportH);
    this.marginLeft.setContext(rootFontSize, viewportW, viewportH);
    this.paddingTop.setContext(rootFontSize, viewportW, viewportH);
    this.paddingRight.setContext(rootFontSize, viewportW, viewportH);
    this.paddingBottom.setContext(rootFontSize, viewportW, viewportH);
    this.paddingLeft.setContext(rootFontSize, viewportW, viewportH);
    this.borderWidth.setContext(rootFontSize, viewportW, viewportH);
    this.borderRadius.setContext(rootFontSize, viewportW, viewportH);
    this.borderRadiusTL.setContext(rootFontSize, viewportW, viewportH);
    this.borderRadiusTR.setContext(rootFontSize, viewportW, viewportH);
    this.borderRadiusBR.setContext(rootFontSize, viewportW, viewportH);
    this.borderRadiusBL.setContext(rootFontSize, viewportW, viewportH);
    this.marginTop.resolve(parentWidth, fontSize);
    this.marginTopPx = this.marginTop.pixels;
    this.marginRight.resolve(parentWidth, fontSize);
    this.marginRightPx = this.marginRight.pixels;
    this.marginBottom.resolve(parentWidth, fontSize);
    this.marginBottomPx = this.marginBottom.pixels;
    this.marginLeft.resolve(parentWidth, fontSize);
    this.marginLeftPx = this.marginLeft.pixels;
    this.paddingTop.resolve(parentWidth, fontSize);
    this.paddingTopPx = this.paddingTop.pixels;
    this.paddingRight.resolve(parentWidth, fontSize);
    this.paddingRightPx = this.paddingRight.pixels;
    this.paddingBottom.resolve(parentWidth, fontSize);
    this.paddingBottomPx = this.paddingBottom.pixels;
    this.paddingLeft.resolve(parentWidth, fontSize);
    this.paddingLeftPx = this.paddingLeft.pixels;
    this.borderWidth.resolve(parentWidth, fontSize);
    this.borderWidthPx = this.borderWidth.pixels;
    let smallerDim = parentWidth;
    if ( parentHeight < parentWidth ) {
      smallerDim = parentHeight;
    }
    this.borderRadius.resolve(smallerDim, fontSize);
    this.borderRadiusPx = this.borderRadius.pixels;
    this.borderRadiusTL.resolve(smallerDim, fontSize);
    this.borderRadiusTR.resolve(smallerDim, fontSize);
    this.borderRadiusBR.resolve(smallerDim, fontSize);
    this.borderRadiusBL.resolve(smallerDim, fontSize);
    this.borderRadiusTLPx = this.borderRadiusPx;
    this.borderRadiusTRPx = this.borderRadiusPx;
    this.borderRadiusBRPx = this.borderRadiusPx;
    this.borderRadiusBLPx = this.borderRadiusPx;
    if ( this.borderRadiusTL.isSet ) {
      this.borderRadiusTLPx = this.borderRadiusTL.pixels;
    }
    if ( this.borderRadiusTR.isSet ) {
      this.borderRadiusTRPx = this.borderRadiusTR.pixels;
    }
    if ( this.borderRadiusBR.isSet ) {
      this.borderRadiusBRPx = this.borderRadiusBR.pixels;
    }
    if ( this.borderRadiusBL.isSet ) {
      this.borderRadiusBLPx = this.borderRadiusBL.pixels;
    }
  };
  hasPerCornerRadius () {
    if ( this.borderRadiusTLPx != this.borderRadiusTRPx ) {
      return true;
    }
    if ( this.borderRadiusTLPx != this.borderRadiusBRPx ) {
      return true;
    }
    if ( this.borderRadiusTLPx != this.borderRadiusBLPx ) {
      return true;
    }
    return false;
  };
  getHorizontalChrome () {
    return (this.paddingLeftPx + this.paddingRightPx) + this.borderWidthPx * 2.0;
  };
  getVerticalChrome () {
    return (this.paddingTopPx + this.paddingBottomPx) + this.borderWidthPx * 2.0;
  };
  getInnerWidth (outerWidth) {
    const inner = outerWidth - this.getHorizontalChrome();
    if ( inner < 0.0 ) {
      return 0.0;
    }
    return inner;
  };
  getInnerHeight (outerHeight) {
    const inner = outerHeight - this.getVerticalChrome();
    if ( inner < 0.0 ) {
      return 0.0;
    }
    return inner;
  };
  getTotalWidth (contentWidth) {
    return ((((contentWidth + this.marginLeftPx) + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + this.borderWidthPx * 2.0;
  };
  getTotalHeight (contentHeight) {
    return ((((contentHeight + this.marginTopPx) + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + this.borderWidthPx * 2.0;
  };
  getContentX (elementX) {
    return ((elementX + this.marginLeftPx) + this.borderWidthPx) + this.paddingLeftPx;
  };
  getContentY (elementY) {
    return ((elementY + this.marginTopPx) + this.borderWidthPx) + this.paddingTopPx;
  };
  getHorizontalSpace () {
    return (((this.marginLeftPx + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + this.borderWidthPx * 2.0;
  };
  getVerticalSpace () {
    return (((this.marginTopPx + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + this.borderWidthPx * 2.0;
  };
  getMarginHorizontal () {
    return this.marginLeftPx + this.marginRightPx;
  };
  getMarginVertical () {
    return this.marginTopPx + this.marginBottomPx;
  };
  getPaddingHorizontal () {
    return this.paddingLeftPx + this.paddingRightPx;
  };
  getPaddingVertical () {
    return this.paddingTopPx + this.paddingBottomPx;
  };
  toString () {
    return ((((((((((((((((("Box[margin:" + (this.marginTopPx.toString())) + "/") + (this.marginRightPx.toString())) + "/") + (this.marginBottomPx.toString())) + "/") + (this.marginLeftPx.toString())) + " padding:") + (this.paddingTopPx.toString())) + "/") + (this.paddingRightPx.toString())) + "/") + (this.paddingBottomPx.toString())) + "/") + (this.paddingLeftPx.toString())) + " border:") + (this.borderWidthPx.toString())) + "]";
  };
}
class EVGGradientStop  {
  constructor() {
    this.percentage = 0.0;
    this.color = new EVGColor();
  }
}
EVGGradientStop.create = function(pct, col) {
  const stop = new EVGGradientStop();
  stop.percentage = pct;
  stop.color = col;
  return stop;
};
class EVGGradient  {
  constructor() {
    this.isSet = false;
    this.isLinear = true;
    this.angle = 0.0;
    this.stops = [];
    let s_1 = [];
    this.stops = s_1;
  }
  getStartColor () {
    if ( this.stops.length > 0 ) {
      const stop = this.stops[0];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getEndColor () {
    const __len = this.stops.length;
    if ( __len > 0 ) {
      const stop = this.stops[(__len - 1)];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getStopCount () {
    return this.stops.length;
  };
  getStop (index) {
    return this.stops[index];
  };
  addStop (percentage, color) {
    const stop = EVGGradientStop.create(percentage, color);
    this.stops.push(stop);
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "";
    }
    let result = "";
    if ( this.isLinear ) {
      result = ("linear-gradient(" + (this.angle.toString())) + "deg";
    } else {
      result = "radial-gradient(circle";
    }
    const numStops = this.stops.length;
    let i = 0;
    while (i < numStops) {
      const stop = this.stops[i];
      result = (result + ", ") + stop.color.toCSSString();
      i = i + 1;
    };
    result = result + ")";
    return result;
  };
}
EVGGradient.parse = function(gradStr) {
  const grad = new EVGGradient();
  const __len = gradStr.length;
  if ( __len == 0 ) {
    return grad;
  }
  const linearIdx = gradStr.indexOf("linear-gradient");
  const radialIdx = gradStr.indexOf("radial-gradient");
  if ( linearIdx >= 0 ) {
    grad.isLinear = true;
    grad.isSet = true;
    grad.angle = 180.0;
  }
  if ( radialIdx >= 0 ) {
    grad.isLinear = false;
    grad.isSet = true;
  }
  if ( grad.isSet == false ) {
    return grad;
  }
  let args = [];
  EVGGradient.splitArgs(gradStr, args);
  const n = args.length;
  if ( n == 0 ) {
    return grad;
  }
  let first = 0;
  const head = args[0].trim();
  if ( EVGGradient.colorOf(head).isSet ) {
  } else {
    first = 1;
    if ( grad.isLinear ) {
      grad.angle = EVGGradient.angleOf(head, grad.angle);
    }
  }
  let colors = [];
  let stopsAt = [];
  let i = first;
  while (i < n) {
    const arg = args[i].trim();
    const col = EVGGradient.colorOf(arg);
    if ( col.isSet ) {
      colors.push(col);
      stopsAt.push(EVGGradient.positionOf(arg));
    }
    i = i + 1;
  };
  const numColors = colors.length;
  if ( numColors > 0 ) {
    let colorIdx = 0;
    while (colorIdx < numColors) {
      let pct = stopsAt[colorIdx];
      if ( pct < 0.0 ) {
        pct = 0.0;
        if ( numColors > 1 ) {
          pct = colorIdx / (numColors - 1);
        }
      }
      const col_1 = colors[colorIdx];
      grad.addStop(pct, col_1);
      colorIdx = colorIdx + 1;
    };
  }
  return grad;
};
EVGGradient.splitArgs = function(src, out) {
  const __len = src.length;
  const open = src.indexOf("(");
  if ( open < 0 ) {
    return;
  }
  let depth = 0;
  let cur = "";
  let i = open;
  while (i < __len) {
    const c = src.charCodeAt(i );
    if ( c == 40 ) {
      depth = depth + 1;
      if ( depth > 1 ) {
        cur = cur + "(";
      }
    } else {
      if ( c == 41 ) {
        depth = depth - 1;
        if ( depth == 0 ) {
          if ( cur.trim().length > 0 ) {
            out.push(cur);
          }
          return;
        }
        cur = cur + ")";
      } else {
        if ( c == 44 && depth == 1 ) {
          if ( cur.trim().length > 0 ) {
            out.push(cur);
          }
          cur = "";
        } else {
          cur = cur + src.substring(i, i + 1 );
        }
      }
    }
    i = i + 1;
  };
  if ( cur.trim().length > 0 ) {
    out.push(cur);
  }
};
EVGGradient.colorOf = function(arg) {
  const text = arg.trim();
  const n = text.length;
  if ( n == 0 ) {
    return EVGColor.noColor();
  }
  const close = text.indexOf(")");
  if ( close >= 0 ) {
    return EVGColor.parse(text.substring(0, close + 1 ));
  }
  const sp = text.indexOf(" ");
  if ( sp > 0 ) {
    return EVGColor.parse(text.substring(0, sp ));
  }
  return EVGColor.parse(text);
};
EVGGradient.positionOf = function(arg) {
  const text = arg.trim();
  const pct = text.indexOf("%");
  if ( pct <= 0 ) {
    return 0.0 - 1.0;
  }
  let start = pct;
  while (start > 0) {
    const c = text.charCodeAt(start - 1 );
    const isNum = c >= 48 && c <= 57 || (c == 46 || c == 45);
    if ( isNum == false ) {
      break;
    }
    start = start - 1;
  };
  if ( start == pct ) {
    return 0.0 - 1.0;
  }
  const v = isNaN( parseFloat(text.substring(start, pct )) ) ? undefined : parseFloat(text.substring(start, pct ));
  if ( typeof(v) === "undefined" ) {
    return 0.0 - 1.0;
  }
  return v / 100.0;
};
EVGGradient.angleOf = function(spec, fallback) {
  const text = spec.trim();
  const deg = text.indexOf("deg");
  if ( deg > 0 ) {
    const v = isNaN( parseFloat(text.substring(0, deg ).trim()) ) ? undefined : parseFloat(text.substring(0, deg ).trim());
    if ( typeof(v) === "undefined" ) {
      return fallback;
    }
    return v;
  }
  if ( text.indexOf("to ") == 0 ) {
    const toTop = text.indexOf("top") > 0;
    const toBottom = text.indexOf("bottom") > 0;
    const toLeft = text.indexOf("left") > 0;
    const toRight = text.indexOf("right") > 0;
    if ( toTop && toRight ) {
      return 45.0;
    }
    if ( toBottom && toRight ) {
      return 135.0;
    }
    if ( toBottom && toLeft ) {
      return 225.0;
    }
    if ( toTop && toLeft ) {
      return 315.0;
    }
    if ( toTop ) {
      return 0.0;
    }
    if ( toRight ) {
      return 90.0;
    }
    if ( toBottom ) {
      return 180.0;
    }
    if ( toLeft ) {
      return 270.0;
    }
  }
  return fallback;
};
class Matrix2D  {
  constructor() {
    this.a = 1.0;
    this.b = 0.0;
    this.c = 0.0;
    this.d = 1.0;
    this.e = 0.0;
    this.f = 0.0;
  }
  applyX (x, y) {
    const v = (this.a * x + this.c * y) + this.e;
    return v;
  };
  applyY (x, y) {
    const v = (this.b * x + this.d * y) + this.f;
    return v;
  };
  multiply (o) {
    const na = this.a * o.a + this.c * o.b;
    const nb = this.b * o.a + this.d * o.b;
    const nc = this.a * o.c + this.c * o.d;
    const nd = this.b * o.c + this.d * o.d;
    const ne = (this.a * o.e + this.c * o.f) + this.e;
    const nf = (this.b * o.e + this.d * o.f) + this.f;
    return Matrix2D.create(na, nb, nc, nd, ne, nf);
  };
  isIdentity () {
    let flat = true;
    if ( (this.a == 1.0) == false ) {
      flat = false;
    }
    if ( (this.b == 0.0) == false ) {
      flat = false;
    }
    if ( (this.c == 0.0) == false ) {
      flat = false;
    }
    if ( (this.d == 1.0) == false ) {
      flat = false;
    }
    if ( (this.e == 0.0) == false ) {
      flat = false;
    }
    if ( (this.f == 0.0) == false ) {
      flat = false;
    }
    return flat;
  };
}
Matrix2D.identity = function() {
  const m = new Matrix2D();
  return m;
};
Matrix2D.create = function(ma, mb, mc, md, me, mf) {
  const m = new Matrix2D();
  m.a = ma;
  m.b = mb;
  m.c = mc;
  m.d = md;
  m.e = me;
  m.f = mf;
  return m;
};
Matrix2D.translate = function(tx, ty) {
  return Matrix2D.create(1.0, 0.0, 0.0, 1.0, tx, ty);
};
Matrix2D.scale = function(sx, sy) {
  return Matrix2D.create(sx, 0.0, 0.0, sy, 0.0, 0.0);
};
class ViewBoxRect  {
  constructor() {
    this.minX = 0.0;
    this.minY = 0.0;
    this.width = 0.0;
    this.height = 0.0;
    this.isSet = false;
  }
  asAttribute () {
    let s = ((this.minX.toString()) + " ") + (this.minY.toString());
    s = (((s + " ") + (this.width.toString())) + " ") + (this.height.toString());
    return s;
  };
}
ViewBoxRect.create = function(x, y, w, h) {
  const r = new ViewBoxRect();
  r.minX = x;
  r.minY = y;
  r.width = w;
  r.height = h;
  r.isSet = true;
  return r;
};
class VectorViewBox  {
  constructor() {
  }
}
VectorViewBox.splitTokens = function(s) {
  let parts = [];
  let current = "";
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s.charCodeAt(i );
    let isSep = false;
    if ( ch == 32 ) {
      isSep = true;
    }
    if ( ch == 9 ) {
      isSep = true;
    }
    if ( ch == 10 ) {
      isSep = true;
    }
    if ( ch == 13 ) {
      isSep = true;
    }
    if ( ch == 44 ) {
      isSep = true;
    }
    if ( isSep ) {
      if ( current.length > 0 ) {
        parts.push(current);
        current = "";
      }
    } else {
      current = current + String.fromCharCode(ch);
    }
    i = i + 1;
  };
  if ( current.length > 0 ) {
    parts.push(current);
  }
  return parts;
};
VectorViewBox.parseViewBox = function(s) {
  const out = new ViewBoxRect();
  const parts = VectorViewBox.splitTokens(s);
  if ( parts.length != 4 ) {
    return out;
  }
  let vals = [];
  let i = 0;
  while (i < 4) {
    const tok = parts[i];
    const num = isNaN( parseFloat(tok) ) ? undefined : parseFloat(tok);
    if ( typeof(num) != "undefined" ) {
      vals.push(num);
    } else {
      return out;
    }
    i = i + 1;
  };
  const w = vals[2];
  const h = vals[3];
  if ( w <= 0.0 ) {
    return out;
  }
  if ( h <= 0.0 ) {
    return out;
  }
  out.minX = vals[0];
  out.minY = vals[1];
  out.width = w;
  out.height = h;
  out.isSet = true;
  return out;
};
VectorViewBox.alignX = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < parts.length) {
    const tok = parts[i];
    if ( tok.indexOf("xMin") == 0 ) {
      return 0;
    }
    if ( tok.indexOf("xMid") == 0 ) {
      return 1;
    }
    if ( tok.indexOf("xMax") == 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.alignY = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < parts.length) {
    const tok = parts[i];
    if ( tok.indexOf("YMin") > 0 ) {
      return 0;
    }
    if ( tok.indexOf("YMid") > 0 ) {
      return 1;
    }
    if ( tok.indexOf("YMax") > 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.isNone = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < parts.length) {
    const tok = parts[i];
    if ( tok == "none" ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
VectorViewBox.isSlice = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < parts.length) {
    const tok = parts[i];
    if ( tok == "slice" ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
VectorViewBox.resolve = function(vb, viewW, viewH, par) {
  if ( vb.isSet == false ) {
    return Matrix2D.identity();
  }
  if ( viewW <= 0.0 ) {
    return Matrix2D.identity();
  }
  if ( viewH <= 0.0 ) {
    return Matrix2D.identity();
  }
  let scaleX = viewW / vb.width;
  let scaleY = viewH / vb.height;
  if ( VectorViewBox.isNone(par) == false ) {
    let uniform = scaleX;
    if ( VectorViewBox.isSlice(par) ) {
      if ( scaleY > uniform ) {
        uniform = scaleY;
      }
    } else {
      if ( scaleY < uniform ) {
        uniform = scaleY;
      }
    }
    scaleX = uniform;
    scaleY = uniform;
  }
  let tx = 0.0 - vb.minX * scaleX;
  let ty = 0.0 - vb.minY * scaleY;
  const slackX = viewW - vb.width * scaleX;
  const slackY = viewH - vb.height * scaleY;
  const ax = VectorViewBox.alignX(par);
  const ay = VectorViewBox.alignY(par);
  if ( ax == 1 ) {
    tx = tx + slackX / 2.0;
  }
  if ( ax == 2 ) {
    tx = tx + slackX;
  }
  if ( ay == 1 ) {
    ty = ty + slackY / 2.0;
  }
  if ( ay == 2 ) {
    ty = ty + slackY;
  }
  return Matrix2D.create(scaleX, 0.0, 0.0, scaleY, tx, ty);
};
VectorViewBox.effectiveViewBox = function(declared, boundsX, boundsY, boundsW, boundsH) {
  const explicit = VectorViewBox.parseViewBox(declared);
  if ( explicit.isSet ) {
    return explicit;
  }
  const synth = new ViewBoxRect();
  if ( boundsW <= 0.0 ) {
    return synth;
  }
  if ( boundsH <= 0.0 ) {
    return synth;
  }
  return ViewBoxRect.create(boundsX, boundsY, boundsW, boundsH);
};
VectorViewBox.resolveString = function(viewBox, viewW, viewH, par) {
  let effective = par;
  if ( effective.length == 0 ) {
    effective = "xMidYMid meet";
  }
  const vb = VectorViewBox.parseViewBox(viewBox);
  return VectorViewBox.resolve(vb, viewW, viewH, effective);
};
class SvgVectorItem  {
  constructor() {
    this.commands = [];
    this.fillColor = undefined;
    this.strokeColor = undefined;
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    let c_4 = [];
    this.commands = c_4;
    this.fillColor = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
  }
  hasFill () {
    return this.fillColor.isSet;
  };
  hasStroke () {
    if ( this.strokeColor.isSet == false ) {
      return false;
    }
    return this.strokeWidth > 0.0;
  };
  pathData () {
    return VectorShapes.asPathData(this.commands);
  };
}
class SvgStyleState  {
  constructor() {
    this.ctm = undefined;
    this.fill = undefined;
    this.stroke = undefined;
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    this.fillOpacity = 1.0;
    this.strokeOpacity = 1.0;
    this.groupOpacity = 1.0;
    this.ctm = Matrix2D.identity();
    this.fill = EVGColor.black();
    this.stroke = EVGColor.noColor();
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    this.fillOpacity = 1.0;
    this.strokeOpacity = 1.0;
    this.groupOpacity = 1.0;
  }
  copy () {
    const s = new SvgStyleState();
    s.ctm = this.ctm;
    s.fill = this.fill;
    s.stroke = this.stroke;
    s.strokeWidth = this.strokeWidth;
    s.fillRule = this.fillRule;
    s.dashArray = this.dashArray;
    s.dashOffset = this.dashOffset;
    s.fillOpacity = this.fillOpacity;
    s.strokeOpacity = this.strokeOpacity;
    s.groupOpacity = this.groupOpacity;
    return s;
  };
}
class SvgDocument  {
  constructor() {
    this.items = [];
    this.viewBox = undefined;
    this.width = 0.0;
    this.height = 0.0;
    this.warnings = [];
    this.errors = [];
    this.truncated = false;
    let it = [];
    this.items = it;
    let w = [];
    this.warnings = w;
    let e_1 = [];
    this.errors = e_1;
    this.viewBox = new ViewBoxRect();
    this.width = 0.0;
    this.height = 0.0;
    this.truncated = false;
  }
  itemCount () {
    return this.items.length;
  };
  hasErrors () {
    return this.errors.length > 0;
  };
  hasWarnings () {
    return this.warnings.length > 0;
  };
  commandCount () {
    let total = 0;
    let k = 0;
    while (k < this.items.length) {
      const it = this.items[k];
      total = total + it.commands.length;
      k = k + 1;
    };
    return total;
  };
  joinLines (lines) {
    const n = lines.length;
    if ( n == 0 ) {
      return "";
    }
    let out = lines[0];
    let k = 1;
    while (k < n) {
      out = (out + "; ") + lines[k];
      k = k + 1;
    };
    return out;
  };
  errorSummary () {
    return this.joinLines(this.errors);
  };
  warningSummary () {
    return this.joinLines(this.warnings);
  };
  bounds () {
    const b = new PathBounds();
    let minX = 999999.0;
    let minY = 999999.0;
    let maxX = -999999.0;
    let maxY = -999999.0;
    let any = false;
    let k = 0;
    while (k < this.items.length) {
      const it = this.items[k];
      let j = 0;
      while (j < it.commands.length) {
        const c = it.commands[j];
        if ( (c.type == "Z") == false ) {
          any = true;
          if ( c.x < minX ) {
            minX = c.x;
          }
          if ( c.x > maxX ) {
            maxX = c.x;
          }
          if ( c.y < minY ) {
            minY = c.y;
          }
          if ( c.y > maxY ) {
            maxY = c.y;
          }
        }
        if ( c.type == "C" || c.type == "Q" ) {
          if ( c.x1 < minX ) {
            minX = c.x1;
          }
          if ( c.x1 > maxX ) {
            maxX = c.x1;
          }
          if ( c.y1 < minY ) {
            minY = c.y1;
          }
          if ( c.y1 > maxY ) {
            maxY = c.y1;
          }
        }
        if ( c.type == "C" ) {
          if ( c.x2 < minX ) {
            minX = c.x2;
          }
          if ( c.x2 > maxX ) {
            maxX = c.x2;
          }
          if ( c.y2 < minY ) {
            minY = c.y2;
          }
          if ( c.y2 > maxY ) {
            maxY = c.y2;
          }
        }
        j = j + 1;
      };
      k = k + 1;
    };
    if ( any == false ) {
      return b;
    }
    b.minX = minX;
    b.minY = minY;
    b.maxX = maxX;
    b.maxY = maxY;
    b.width = maxX - minX;
    b.height = maxY - minY;
    return b;
  };
  effectiveViewBox () {
    if ( this.viewBox.isSet ) {
      return this.viewBox;
    }
    if ( this.width > 0.0 && this.height > 0.0 ) {
      return ViewBoxRect.create(0.0, 0.0, this.width, this.height);
    }
    const b = this.bounds();
    return VectorViewBox.effectiveViewBox(
      "",
      b.minX,
      b.minY,
      b.width,
      b.height
    );
  };
}
class SvgAttr  {
  constructor() {
    this.name = "";
    this.value = "";
  }
}
class SvgTag  {
  constructor() {
    this.name = "";
    this.isEnd = false;
    this.selfClose = false;
    this.attrs = [];
    this.valid = false;
    let a_3 = [];
    this.attrs = a_3;
    this.name = "";
    this.isEnd = false;
    this.selfClose = false;
    this.valid = false;
  }
  has (n) {
    let k = 0;
    while (k < this.attrs.length) {
      const a = this.attrs[k];
      if ( a.name == n ) {
        return true;
      }
      k = k + 1;
    };
    return false;
  };
  attr (n) {
    let k = 0;
    while (k < this.attrs.length) {
      const a = this.attrs[k];
      if ( a.name == n ) {
        return a.value;
      }
      k = k + 1;
    };
    return "";
  };
}
class SvgParser  {
  constructor() {
    this.src = "";
    this.pos = 0;
    this.__len = 0;
    this.doc = undefined;
    this.maxNodes = 50000;
    this.maxDepth = 64;
    this.maxCommands = 500000;
    this.maxUseDepth = 8;
    this.initialFill = undefined;
    this.nodeCount = 0;
    this.emittedCommands = 0;
    this.useDepth = 0;
    this.aborted = false;
    this.spans = {};
    this.warnedKeys = {};
    this.doc = new SvgDocument();
    this.initialFill = EVGColor.black();
  }
  setInitialFill (c) {
    this.initialFill = c;
  };
  warn (key, msg) {
    const seen = ( Object.prototype.hasOwnProperty.call(this.warnedKeys, key) ? this.warnedKeys[key] : undefined );
    if ( (typeof(seen) !== "undefined" && seen != null )  ) {
      return;
    }
    this.warnedKeys[key] = true;
    this.doc.warnings.push(msg);
  };
  fail (msg) {
    this.doc.errors.push(msg);
    this.doc.truncated = true;
    this.aborted = true;
  };
  parse (source) {
    this.doc = new SvgDocument();
    let emptySpans = {};
    this.spans = emptySpans;
    let emptyWarned = {};
    this.warnedKeys = emptyWarned;
    this.nodeCount = 0;
    this.emittedCommands = 0;
    this.useDepth = 0;
    this.aborted = false;
    this.src = source;
    this.__len = source.length;
    this.pos = 0;
    this.indexIds();
    if ( this.aborted ) {
      return this.doc;
    }
    this.src = source;
    this.__len = source.length;
    this.pos = 0;
    const root = new SvgStyleState();
    root.fill = this.initialFill;
    this.parseChildren(root, 0, "");
    return this.doc;
  };
  indexIds () {
    let openNames = [];
    let openIds = [];
    let openStarts = [];
    while (this.aborted == false) {
      const tagStart = this.findTagStart();
      if ( tagStart < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.isEnd ) {
        const depth = openNames.length;
        if ( depth > 0 ) {
          const openName = openNames[(depth - 1)];
          if ( openName == tag.name ) {
            const id = openIds[(depth - 1)];
            if ( id.length > 0 ) {
              const from = openStarts[(depth - 1)];
              this.spans[id] = this.src.substring(from, this.pos );
            }
            openNames.pop();
            openIds.pop();
            openStarts.pop();
          }
        }
      } else {
        const id2 = tag.attr("id");
        if ( tag.selfClose ) {
          if ( id2.length > 0 ) {
            this.spans[id2] = this.src.substring(tagStart, this.pos );
          }
        } else {
          openNames.push(tag.name);
          openIds.push(id2);
          openStarts.push(tagStart);
          if ( openNames.length > this.maxDepth ) {
            this.fail(("nesting deeper than " + (this.maxDepth.toString())) + " levels");
            return;
          }
        }
      }
    };
  };
  parseChildren (inherited, depth, endName) {
    if ( depth > this.maxDepth ) {
      this.fail(("nesting deeper than " + (this.maxDepth.toString())) + " levels");
      return;
    }
    while (this.aborted == false) {
      const tagStart = this.findTagStart();
      if ( tagStart < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.isEnd ) {
        return;
      }
      this.nodeCount = this.nodeCount + 1;
      if ( this.nodeCount > this.maxNodes ) {
        this.fail(("more than " + (this.maxNodes.toString())) + " elements");
        return;
      }
      this.handleElement(tag, inherited, depth);
    };
  };
  handleElement (tag, inherited, depth) {
    const name = tag.name;
    if ( this.isRefused(name) ) {
      this.refuse(name);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( (name == "title" || name == "desc") || name == "metadata" ) {
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "defs" ) {
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "svg" ) {
      if ( depth == 0 ) {
        this.readRootAttributes(tag);
        const rootState = this.applyPresentation(inherited, tag, depth);
        if ( tag.selfClose == false ) {
          this.parseChildren(rootState, depth + 1, name);
        }
        return;
      }
      this.warn("nested-svg", "a nested <svg> element establishes its own viewport and is not supported; its contents are not drawn");
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "g" || name == "a" ) {
      const groupState = this.applyPresentation(inherited, tag, depth);
      if ( tag.selfClose == false ) {
        this.parseChildren(groupState, depth + 1, name);
      }
      return;
    }
    if ( name == "switch" ) {
      this.warn("switch", "<switch> conditional processing is not supported; its contents are not drawn");
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "use" ) {
      this.handleUse(tag, inherited, depth);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( this.isShape(name) ) {
      const shapeState = this.applyPresentation(inherited, tag, depth);
      this.emitShape(tag, shapeState);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    this.warn("unknown-" + name, ("<" + name) + "> is not part of the supported SVG profile and was skipped");
    if ( tag.selfClose == false ) {
      this.skipSubtree(name);
    }
  };
  isRefused (name) {
    if ( name == "script" ) {
      return true;
    }
    if ( name == "foreignObject" ) {
      return true;
    }
    if ( name == "filter" ) {
      return true;
    }
    if ( name == "mask" ) {
      return true;
    }
    if ( name == "clipPath" ) {
      return true;
    }
    if ( name == "pattern" ) {
      return true;
    }
    if ( name == "marker" ) {
      return true;
    }
    if ( name == "symbol" ) {
      return true;
    }
    if ( name == "style" ) {
      return true;
    }
    if ( name == "text" ) {
      return true;
    }
    if ( name == "image" ) {
      return true;
    }
    if ( name == "linearGradient" ) {
      return true;
    }
    if ( name == "radialGradient" ) {
      return true;
    }
    if ( name == "animate" ) {
      return true;
    }
    if ( name == "animateTransform" ) {
      return true;
    }
    if ( name == "animateMotion" ) {
      return true;
    }
    if ( name == "set" ) {
      return true;
    }
    return false;
  };
  refuse (name) {
    if ( name == "text" ) {
      this.warn("text", "<text> is not supported; convert text to outlines before export, or the wordmark will be missing");
      return;
    }
    if ( name == "image" ) {
      this.warn("image", "<image> references an external resource, which the importer does not fetch; it was skipped");
      return;
    }
    if ( name == "style" ) {
      this.warn("style", "a <style> element is not applied; CSS in the document is outside the profile, so use presentation attributes instead");
      return;
    }
    if ( name == "linearGradient" || name == "radialGradient" ) {
      this.warn("gradient", "gradient paint is deferred (PLAN_VECTOR_IR.md §6): the three renderers do not agree on gradients yet, so a gradient fill is dropped rather than rendered differently in each output");
      return;
    }
    if ( name == "clipPath" || name == "mask" ) {
      this.warn("clip-" + name, ("<" + name) + "> is not supported; the shapes it would have cut are drawn whole");
      return;
    }
    this.warn("refused-" + name, ("<" + name) + "> is outside the supported SVG profile and was skipped");
  };
  isShape (name) {
    if ( name == "path" ) {
      return true;
    }
    if ( name == "rect" ) {
      return true;
    }
    if ( name == "circle" ) {
      return true;
    }
    if ( name == "ellipse" ) {
      return true;
    }
    if ( name == "line" ) {
      return true;
    }
    if ( name == "polyline" ) {
      return true;
    }
    if ( name == "polygon" ) {
      return true;
    }
    return false;
  };
  handleUse (tag, inherited, depth) {
    let href = tag.attr("href");
    if ( href.length == 0 ) {
      href = tag.attr("xlink:href");
    }
    if ( href.length == 0 ) {
      this.warn("use-nohref", "<use> without an href draws nothing");
      return;
    }
    if ( href.charCodeAt(0 ) != 35 ) {
      this.warn("use-external", "<use> may only reference a fragment in the same document; an external reference was dropped");
      return;
    }
    const id = href.substring(1, href.length );
    const target = ( Object.prototype.hasOwnProperty.call(this.spans, id) ? this.spans[id] : undefined );
    let fragment = "";
    if ( (typeof(target) !== "undefined" && target != null )  ) {
      fragment = target;
    } else {
      this.warn("use-missing-" + id, ("<use href=\"#" + id) + "\"> refers to an id that is not in this document");
      return;
    }
    if ( this.useDepth >= this.maxUseDepth ) {
      this.warn("use-depth", ("<use> references nested more than " + (this.maxUseDepth.toString())) + " deep, which is either a cycle or deeper than this profile expands");
      return;
    }
    const state = this.applyPresentation(inherited, tag, depth);
    const ux = this.numAttr(tag, "x", 0.0);
    const uy = this.numAttr(tag, "y", 0.0);
    if ( (ux == 0.0 && uy == 0.0) == false ) {
      state.ctm = state.ctm.multiply(Matrix2D.translate(ux, uy));
    }
    const savedSrc = this.src;
    const savedPos = this.pos;
    const savedLen = this.__len;
    this.src = fragment;
    this.__len = this.src.length;
    this.pos = 0;
    this.useDepth = this.useDepth + 1;
    this.parseChildren(state, depth + 1, "");
    this.useDepth = this.useDepth - 1;
    this.src = savedSrc;
    this.pos = savedPos;
    this.__len = savedLen;
  };
  applyPresentation (inherited, tag, depth) {
    const s = inherited.copy();
    let k = 0;
    while (k < tag.attrs.length) {
      const a = tag.attrs[k];
      this.applyProperty(s, a.name, a.value);
      k = k + 1;
    };
    const styleAttr = tag.attr("style");
    if ( styleAttr.length > 0 ) {
      this.applyStyleAttribute(s, styleAttr);
    }
    const tf = tag.attr("transform");
    if ( tf.length > 0 ) {
      const m = this.parseTransform(tf);
      s.ctm = s.ctm.multiply(m);
    }
    return s;
  };
  applyStyleAttribute (s, style) {
    const decls = this.splitOn(style, 59);
    let k = 0;
    while (k < decls.length) {
      const decl = decls[k];
      const colon = decl.indexOf(":");
      if ( colon > 0 ) {
        const n = decl.substring(0, colon ).trim();
        const v = decl.substring(colon + 1, decl.length ).trim();
        this.applyProperty(s, n, v);
      }
      k = k + 1;
    };
  };
  applyProperty (s, name, value) {
    const v = value.trim();
    if ( name == "fill" ) {
      s.fill = this.parsePaint(v, s.fill);
      return;
    }
    if ( name == "stroke" ) {
      s.stroke = this.parsePaint(v, s.stroke);
      return;
    }
    if ( name == "stroke-width" ) {
      const w = isNaN( parseFloat(v) ) ? undefined : parseFloat(v);
      if ( typeof(w) != "undefined" ) {
        s.strokeWidth = w;
      }
      return;
    }
    if ( name == "fill-rule" ) {
      if ( v == "evenodd" ) {
        s.fillRule = "evenodd";
      }
      if ( v == "nonzero" ) {
        s.fillRule = "nonzero";
      }
      return;
    }
    if ( name == "stroke-dasharray" ) {
      if ( v == "none" ) {
        s.dashArray = "";
      } else {
        s.dashArray = v;
      }
      return;
    }
    if ( name == "stroke-dashoffset" ) {
      const o = isNaN( parseFloat(v) ) ? undefined : parseFloat(v);
      if ( typeof(o) != "undefined" ) {
        s.dashOffset = o;
      }
      return;
    }
    if ( name == "fill-opacity" ) {
      s.fillOpacity = this.parseOpacity(v, s.fillOpacity);
      return;
    }
    if ( name == "stroke-opacity" ) {
      s.strokeOpacity = this.parseOpacity(v, s.strokeOpacity);
      return;
    }
    if ( name == "opacity" ) {
      const o2 = this.parseOpacity(v, 1.0);
      s.groupOpacity = s.groupOpacity * o2;
      return;
    }
    if ( (name == "stroke-linecap" || name == "stroke-linejoin") || name == "stroke-miterlimit" ) {
      this.warn("stroke-joins", "stroke-linecap/linejoin/miterlimit are not represented; strokes are drawn with butt caps and round joins");
      return;
    }
    if ( name == "class" ) {
      this.warn("class", "class attributes have no effect because the profile applies no CSS");
      return;
    }
  };
  parsePaint (v, inheritedPaint) {
    if ( v == "none" ) {
      return EVGColor.noColor();
    }
    if ( v == "inherit" ) {
      return inheritedPaint;
    }
    if ( v == "currentColor" ) {
      return this.initialFill;
    }
    if ( v.indexOf("url(") == 0 ) {
      this.warn("gradient", "gradient paint is deferred (PLAN_VECTOR_IR.md §6): the three renderers do not agree on gradients yet, so a gradient fill is dropped rather than rendered differently in each output");
      return EVGColor.noColor();
    }
    const c = EVGColor.parse(v);
    if ( c.isSet == false ) {
      this.warn("color-" + v, ("could not read the colour \"" + v) + "\"; the inherited paint was used instead");
      return inheritedPaint;
    }
    return c;
  };
  parseOpacity (v, fallback) {
    let pct = false;
    let s = v;
    if ( s.length > 0 ) {
      if ( s.charCodeAt(s.length - 1 ) == 37 ) {
        pct = true;
        s = s.substring(0, s.length - 1 );
      }
    }
    const d = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
    let out = fallback;
    if ( typeof(d) != "undefined" ) {
      out = d;
    } else {
      return fallback;
    }
    if ( pct ) {
      out = out / 100.0;
    }
    if ( out < 0.0 ) {
      out = 0.0;
    }
    if ( out > 1.0 ) {
      out = 1.0;
    }
    return out;
  };
  parseTransform (s) {
    let m = Matrix2D.identity();
    let i = 0;
    const n = s.length;
    while (i < n) {
      const open = this.findFrom(s, i, 40);
      if ( open < 0 ) {
        return m;
      }
      const fname = s.substring(i, open ).trim();
      const close = this.findFrom(s, (open + 1), 41);
      if ( close < 0 ) {
        this.warn("transform-unclosed", "a transform is missing its closing parenthesis: " + s);
        return m;
      }
      const args = this.parseNumberList(s.substring(open + 1, close ));
      const na = args.length;
      i = close + 1;
      let part = Matrix2D.identity();
      let known = true;
      if ( fname == "matrix" ) {
        if ( na == 6 ) {
          part = Matrix2D.create(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            args[5]
          );
        } else {
          known = false;
        }
      } else {
        if ( fname == "translate" ) {
          if ( na == 1 ) {
            part = Matrix2D.translate(args[0], 0.0);
          } else {
            if ( na == 2 ) {
              part = Matrix2D.translate(args[0], args[1]);
            } else {
              known = false;
            }
          }
        } else {
          if ( fname == "scale" ) {
            if ( na == 1 ) {
              part = Matrix2D.scale(args[0], args[0]);
            } else {
              if ( na == 2 ) {
                part = Matrix2D.scale(args[0], args[1]);
              } else {
                known = false;
              }
            }
          } else {
            if ( fname == "rotate" ) {
              if ( na == 1 ) {
                part = this.rotation(args[0]);
              } else {
                if ( na == 3 ) {
                  const cx = args[1];
                  const cy = args[2];
                  const r = this.rotation(args[0]);
                  part = Matrix2D.translate(cx, cy);
                  part = part.multiply(r);
                  part = part.multiply(Matrix2D.translate((0.0 - cx), (0.0 - cy)));
                } else {
                  known = false;
                }
              }
            } else {
              if ( fname == "skewX" ) {
                if ( na == 1 ) {
                  part = Matrix2D.create(
                    1.0,
                    0.0,
                    this.tanDeg(args[0]),
                    1.0,
                    0.0,
                    0.0
                  );
                } else {
                  known = false;
                }
              } else {
                if ( fname == "skewY" ) {
                  if ( na == 1 ) {
                    part = Matrix2D.create(
                      1.0,
                      this.tanDeg(args[0]),
                      0.0,
                      1.0,
                      0.0,
                      0.0
                    );
                  } else {
                    known = false;
                  }
                } else {
                  known = false;
                }
              }
            }
          }
        }
      }
      if ( known == false ) {
        this.warn("transform-" + fname, ("the transform \"" + fname) + "\" was not applied: unknown, or given the wrong number of arguments");
      } else {
        m = m.multiply(part);
      }
    };
    return m;
  };
  rotation (deg) {
    const rad = (deg * 3.141592653589793) / 180.0;
    const cs = Math.cos(rad);
    const sn = Math.sin(rad);
    return Matrix2D.create(cs, sn, (0.0 - sn), cs, 0.0, 0.0);
  };
  tanDeg (deg) {
    const rad = (deg * 3.141592653589793) / 180.0;
    return Math.sin(rad) / Math.cos(rad);
  };
  emitShape (tag, s) {
    const name = tag.name;
    let cmds = [];
    if ( name == "path" ) {
      const d = tag.attr("d");
      if ( d.length == 0 ) {
        return;
      }
      const p = new SVGPathParser();
      p.parse(d);
      if ( p.hasErrors() ) {
        this.warn("pathdata-" + p.errorSummary(), "path data was not fully read: " + p.errorSummary());
      }
      cmds = p.getCommands();
    } else {
      if ( name == "rect" ) {
        const rx = this.numAttr(tag, "rx", -1.0);
        const ry = this.numAttr(tag, "ry", -1.0);
        cmds = VectorShapes.rect(
          this.numAttr(tag, "x", 0.0),
          this.numAttr(tag, "y", 0.0),
          this.numAttr(tag, "width", 0.0),
          this.numAttr(tag, "height", 0.0),
          rx,
          ry
        );
      } else {
        if ( name == "circle" ) {
          cmds = VectorShapes.circle(
            this.numAttr(tag, "cx", 0.0),
            this.numAttr(tag, "cy", 0.0),
            this.numAttr(tag, "r", 0.0)
          );
        } else {
          if ( name == "ellipse" ) {
            cmds = VectorShapes.ellipse(
              this.numAttr(tag, "cx", 0.0),
              this.numAttr(tag, "cy", 0.0),
              this.numAttr(tag, "rx", 0.0),
              this.numAttr(tag, "ry", 0.0)
            );
          } else {
            if ( name == "line" ) {
              cmds = VectorShapes.line(
                this.numAttr(tag, "x1", 0.0),
                this.numAttr(tag, "y1", 0.0),
                this.numAttr(tag, "x2", 0.0),
                this.numAttr(tag, "y2", 0.0)
              );
            } else {
              if ( name == "polyline" ) {
                cmds = VectorShapes.polyline(this.parseNumberList(tag.attr("points")));
              } else {
                if ( name == "polygon" ) {
                  cmds = VectorShapes.polygon(this.parseNumberList(tag.attr("points")));
                }
              }
            }
          }
        }
      }
    }
    const count = cmds.length;
    if ( count == 0 ) {
      return;
    }
    this.emittedCommands = this.emittedCommands + count;
    if ( this.emittedCommands > this.maxCommands ) {
      this.fail(("more than " + (this.maxCommands.toString())) + " path commands");
      return;
    }
    const item = new SvgVectorItem();
    item.commands = this.transformCommands(cmds, s.ctm);
    item.fillRule = s.fillRule;
    item.dashArray = s.dashArray;
    item.dashOffset = s.dashOffset;
    if ( s.fill.isSet ) {
      item.fillColor = this.withAlpha(s.fill, (s.fillOpacity * s.groupOpacity));
    }
    if ( s.stroke.isSet ) {
      item.strokeColor = this.withAlpha(s.stroke, (s.strokeOpacity * s.groupOpacity));
      item.strokeWidth = s.strokeWidth * this.scaleOf(s.ctm);
    }
    if ( item.hasFill() == false && item.hasStroke() == false ) {
      return;
    }
    this.doc.items.push(item);
  };
  withAlpha (c, mul) {
    if ( mul >= 1.0 ) {
      return c;
    }
    return EVGColor.create(c.r, c.g, c.b, (c.a * mul));
  };
  scaleOf (m) {
    let det = m.a * m.d - m.b * m.c;
    if ( det < 0.0 ) {
      det = 0.0 - det;
    }
    if ( det == 0.0 ) {
      return 0.0;
    }
    return Math.sqrt(det);
  };
  transformCommands (cmds, m) {
    let out = [];
    if ( m.isIdentity() ) {
      return cmds;
    }
    let k = 0;
    while (k < cmds.length) {
      const c = cmds[k];
      const n = new PathCommand();
      n.type = c.type;
      n.x = m.applyX(c.x, c.y);
      n.y = m.applyY(c.x, c.y);
      n.x1 = m.applyX(c.x1, c.y1);
      n.y1 = m.applyY(c.x1, c.y1);
      n.x2 = m.applyX(c.x2, c.y2);
      n.y2 = m.applyY(c.x2, c.y2);
      out.push(n);
      k = k + 1;
    };
    return out;
  };
  readRootAttributes (tag) {
    const vb = tag.attr("viewBox");
    if ( vb.length > 0 ) {
      const parsed = VectorViewBox.parseViewBox(vb);
      if ( parsed.isSet ) {
        this.doc.viewBox = parsed;
      } else {
        this.warn("viewbox", ("the root viewBox \"" + vb) + "\" is not four numbers with a positive width and height, and was ignored");
      }
    }
    this.doc.width = this.lengthAttr(tag, "width");
    this.doc.height = this.lengthAttr(tag, "height");
    const par = tag.attr("preserveAspectRatio");
    if ( par.length > 0 ) {
      this.warn("par", "preserveAspectRatio on the imported root is ignored; the element that hosts the drawing decides how it is fitted");
    }
  };
  lengthAttr (tag, name) {
    const raw = tag.attr(name).trim();
    if ( raw.length == 0 ) {
      return 0.0;
    }
    let s = raw;
    if ( s.indexOf("px") > 0 ) {
      s = s.substring(0, s.indexOf("px") );
    }
    if ( this.isPlainNumber(s.trim()) == false ) {
      return 0.0;
    }
    const d = isNaN( parseFloat(s.trim()) ) ? undefined : parseFloat(s.trim());
    let out = 0.0;
    if ( typeof(d) != "undefined" ) {
      out = d;
    } else {
      return 0.0;
    }
    if ( out < 0.0 ) {
      return 0.0;
    }
    return out;
  };
  isPlainNumber (s) {
    const n = s.length;
    if ( n == 0 ) {
      return false;
    }
    let k = 0;
    while (k < n) {
      const c = s.charCodeAt(k );
      let ok = false;
      if ( c >= 48 && c <= 57 ) {
        ok = true;
      }
      if ( c == 46 ) {
        ok = true;
      }
      if ( c == 45 ) {
        ok = true;
      }
      if ( c == 43 ) {
        ok = true;
      }
      if ( c == 101 ) {
        ok = true;
      }
      if ( c == 69 ) {
        ok = true;
      }
      if ( ok == false ) {
        return false;
      }
      k = k + 1;
    };
    return true;
  };
  numAttr (tag, name, fallback) {
    const raw = tag.attr(name).trim();
    if ( raw.length == 0 ) {
      return fallback;
    }
    let s = raw;
    if ( s.indexOf("px") > 0 ) {
      s = s.substring(0, s.indexOf("px") );
    }
    if ( this.isPlainNumber(s.trim()) ) {
      const d = isNaN( parseFloat(s.trim()) ) ? undefined : parseFloat(s.trim());
      if ( typeof(d) != "undefined" ) {
        return d;
      }
    }
    this.warn("num-" + name, ((("the value \"" + raw) + "\" on ") + name) + " is not a plain number, and this profile resolves no units; it was treated as unspecified");
    return fallback;
  };
  findTagStart () {
    while (this.pos < this.__len) {
      const c = this.src.charCodeAt(this.pos );
      if ( c != 60 ) {
        this.pos = this.pos + 1;
      } else {
        if ( this.matchesAt(this.pos + 1, "!--") ) {
          const end = this.findString((this.pos + 4), "-->");
          if ( end < 0 ) {
            this.pos = this.__len;
            return -1;
          }
          this.pos = end + 3;
        } else {
          if ( this.matchesAt(this.pos + 1, "![CDATA[") ) {
            const cend = this.findString((this.pos + 9), "]]>");
            if ( cend < 0 ) {
              this.pos = this.__len;
              return -1;
            }
            this.pos = cend + 3;
          } else {
            if ( this.matchesAt(this.pos + 1, "?") ) {
              const pend = this.findString((this.pos + 2), "?>");
              if ( pend < 0 ) {
                this.pos = this.__len;
                return -1;
              }
              this.pos = pend + 2;
            } else {
              if ( this.matchesAt(this.pos + 1, "!") ) {
                this.skipDeclaration();
                if ( this.aborted ) {
                  return -1;
                }
              } else {
                return this.pos;
              }
            }
          }
        }
      }
    };
    return -1;
  };
  skipDeclaration () {
    let i = this.pos + 2;
    while (i < this.__len) {
      const c = this.src.charCodeAt(i );
      if ( c == 91 ) {
        this.fail("this document has a DOCTYPE internal subset, which is where entity declarations live; the importer implements no entities and will not guess at one");
        this.pos = this.__len;
        return;
      }
      if ( c == 62 ) {
        this.pos = i + 1;
        return;
      }
      i = i + 1;
    };
    this.pos = this.__len;
  };
  readTag () {
    const tag = new SvgTag();
    if ( this.pos >= this.__len ) {
      return tag;
    }
    let i = this.pos + 1;
    if ( i < this.__len ) {
      if ( this.src.charCodeAt(i ) == 47 ) {
        tag.isEnd = true;
        i = i + 1;
      }
    }
    const nameStart = i;
    while (i < this.__len) {
      const c = this.src.charCodeAt(i );
      if ( this.isNameChar(c) ) {
        i = i + 1;
      } else {
        break;
      }
    };
    tag.name = this.localName(this.src.substring(nameStart, i ));
    if ( tag.name.length == 0 ) {
      this.pos = this.pos + 1;
      return tag;
    }
    while (i < this.__len) {
      i = this.skipSpaceFrom(i);
      if ( i >= this.__len ) {
        break;
      }
      const c2 = this.src.charCodeAt(i );
      if ( c2 == 62 ) {
        i = i + 1;
        tag.valid = true;
        this.pos = i;
        return tag;
      }
      if ( c2 == 47 ) {
        tag.selfClose = true;
        i = i + 1;
        if ( i < this.__len ) {
          if ( this.src.charCodeAt(i ) == 62 ) {
            i = i + 1;
          }
        }
        tag.valid = true;
        this.pos = i;
        return tag;
      }
      const attrStart = i;
      while (i < this.__len) {
        const c3 = this.src.charCodeAt(i );
        if ( this.isNameChar(c3) ) {
          i = i + 1;
        } else {
          break;
        }
      };
      if ( i == attrStart ) {
        i = i + 1;
      } else {
        const attrName = this.src.substring(attrStart, i );
        i = this.skipSpaceFrom(i);
        let value = "";
        if ( i < this.__len ) {
          if ( this.src.charCodeAt(i ) == 61 ) {
            i = i + 1;
            i = this.skipSpaceFrom(i);
            if ( i < this.__len ) {
              const q = this.src.charCodeAt(i );
              if ( q == 34 || q == 39 ) {
                const vstart = i + 1;
                const vend = this.findFrom(this.src, vstart, q);
                if ( vend < 0 ) {
                  this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is missing its closing quote");
                  this.pos = this.__len;
                  return tag;
                }
                value = this.decodeEntities(this.src.substring(vstart, vend ));
                i = vend + 1;
              } else {
                this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is not quoted; XML requires quotes, so it was skipped");
                while (i < this.__len) {
                  const c4 = this.src.charCodeAt(i );
                  if ( c4 == 62 || this.isSpace(c4) ) {
                    break;
                  }
                  i = i + 1;
                };
              }
            }
          }
        }
        const a = new SvgAttr();
        a.name = this.attrName(attrName);
        a.value = value;
        tag.attrs.push(a);
      }
    };
    this.pos = this.__len;
    return tag;
  };
  skipSubtree (name) {
    let depth = 1;
    while (depth > 0 && this.aborted == false) {
      const start = this.findTagStart();
      if ( start < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.selfClose == false ) {
        if ( tag.name == name ) {
          if ( tag.isEnd ) {
            depth = depth - 1;
          } else {
            depth = depth + 1;
          }
        }
      }
    };
  };
  decodeEntities (s) {
    if ( s.indexOf("&") < 0 ) {
      return s;
    }
    let out = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s.charCodeAt(i );
      if ( c != 38 ) {
        out = out + String.fromCharCode(c);
        i = i + 1;
      } else {
        const semi = this.findFrom(s, i, 59);
        let handled = false;
        if ( semi > i ) {
          const ent = s.substring(i, semi + 1 );
          if ( ent == "&amp;" ) {
            out = out + "&";
            handled = true;
          }
          if ( ent == "&lt;" ) {
            out = out + "<";
            handled = true;
          }
          if ( ent == "&gt;" ) {
            out = out + ">";
            handled = true;
          }
          if ( ent == "&quot;" ) {
            out = out + "\"";
            handled = true;
          }
          if ( ent == "&apos;" ) {
            out = out + "'";
            handled = true;
          }
          if ( handled ) {
            i = semi + 1;
          } else {
            this.warn("entity", "only the five predefined XML entities are expanded; any other reference is left as written");
            out = out + "&";
            i = i + 1;
          }
        } else {
          out = out + "&";
          i = i + 1;
        }
      }
    };
    return out;
  };
  localName (raw) {
    const colon = raw.indexOf(":");
    if ( colon < 0 ) {
      return raw;
    }
    return raw.substring(colon + 1, raw.length );
  };
  attrName (raw) {
    if ( raw.indexOf("xlink:") == 0 ) {
      return raw;
    }
    const colon = raw.indexOf(":");
    if ( colon < 0 ) {
      return raw;
    }
    return raw.substring(colon + 1, raw.length );
  };
  isSpace (c) {
    if ( c == 32 ) {
      return true;
    }
    if ( c == 9 ) {
      return true;
    }
    if ( c == 10 ) {
      return true;
    }
    if ( c == 13 ) {
      return true;
    }
    return false;
  };
  isNameChar (c) {
    if ( c >= 65 && c <= 90 ) {
      return true;
    }
    if ( c >= 97 && c <= 122 ) {
      return true;
    }
    if ( c >= 48 && c <= 57 ) {
      return true;
    }
    if ( c == 58 ) {
      return true;
    }
    if ( c == 45 ) {
      return true;
    }
    if ( c == 95 ) {
      return true;
    }
    if ( c == 46 ) {
      return true;
    }
    return false;
  };
  skipSpaceFrom (from) {
    let i = from;
    while (i < this.__len) {
      if ( this.isSpace(this.src.charCodeAt(i )) ) {
        i = i + 1;
      } else {
        break;
      }
    };
    return i;
  };
  findFrom (s, from, ch) {
    let i = from;
    const n = s.length;
    while (i < n) {
      if ( s.charCodeAt(i ) == ch ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  findString (from, needle) {
    const nl = needle.length;
    let i = from;
    while (i + nl <= this.__len) {
      if ( this.matchesAt(i, needle) ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  matchesAt (at, needle) {
    const nl = needle.length;
    if ( at + nl > this.__len ) {
      return false;
    }
    return this.src.substring(at, at + nl ) == needle;
  };
  splitOn (s, sep) {
    let out = [];
    const n = s.length;
    let start = 0;
    let i = 0;
    while (i < n) {
      if ( s.charCodeAt(i ) == sep ) {
        out.push(s.substring(start, i ));
        start = i + 1;
      }
      i = i + 1;
    };
    out.push(s.substring(start, n ));
    return out;
  };
  parseNumberList (s) {
    let out = [];
    const toks = VectorViewBox.splitTokens(s);
    let k = 0;
    while (k < toks.length) {
      const d = isNaN( parseFloat(toks[k]) ) ? undefined : parseFloat(toks[k]);
      if ( typeof(d) != "undefined" ) {
        out.push(d);
      } else {
        this.warn("numlist-" + toks[k], ("\"" + toks[k]) + "\" is not a number; the rest of that list was not read");
        return out;
      }
      k = k + 1;
    };
    return out;
  };
}
class EVGFlight  {
  constructor() {
    this.property = "";     /* note: unused */
    this.durationMs = 0.0;
    this.delayMs = 0.0;
    this.elapsedMs = 0.0;
    this.easing = new EVGEasing();
    this.fromColor = undefined;     /* note: unused */
    this.toColor = undefined;     /* note: unused */
    this.fromNumber = 0.0;     /* note: unused */
    this.toNumber = 0.0;     /* note: unused */
    this.isColor = false;     /* note: unused */
    this.unitCode = 0;     /* note: unused */
    this.reversingStartColor = undefined;     /* note: unused */
    this.reversingStartNumber = 0.0;     /* note: unused */
    this.reversingFactor = 1.0;     /* note: unused */
    this.wroteNumber = 0.0;     /* note: unused */
    this.wroteColor = undefined;     /* note: unused */
    this.hasWrote = false;     /* note: unused */
  }
  progress () {
    if ( this.durationMs <= 0.0 ) {
      return 1.0;
    }
    const t = (this.elapsedMs - this.delayMs) / this.durationMs;
    if ( t < 0.0 ) {
      return 0.0;
    }
    if ( t > 1.0 ) {
      return 1.0;
    }
    return t;
  };
  eased () {
    return this.easing.ease(this.progress());
  };
  done () {
    return this.elapsedMs >= this.delayMs + this.durationMs;
  };
}
class EVGElement  {
  constructor() {
    this.id = "";
    this.key = "";
    this.href = "";
    this.tagName = "div";
    this.elementType = 0;
    this.format = "";
    this.orientation = "";
    this.pageWidth = 0.0;
    this.pageHeight = 0.0;
    this.parent = undefined;
    this.children = [];
    this.width = undefined;
    this.height = undefined;
    this.minWidth = undefined;
    this.minHeight = undefined;
    this.maxWidth = undefined;
    this.maxHeight = undefined;
    this.left = undefined;
    this.top = undefined;
    this.right = undefined;
    this.bottom = undefined;
    this.x = undefined;
    this.y = undefined;
    this.box = undefined;
    this.backgroundColor = undefined;
    this.opacity = 1.0;
    this.backdropBlur = 0.0;
    this.gradientSet = false;
    this.gradientFrom = undefined;
    this.gradientTo = undefined;
    this.gradientDir = 0;
    this.absPosSet = false;
    this.absX = 0.0;
    this.absY = 0.0;
    this.glowIntensity = 0.0;
    this.bgImageSet = false;
    this.bgImagePath = "";
    this.textDir = "";
    this.resolvedRtl = false;
    this.direction = "row";
    this.align = "left";
    this.verticalAlign = "top";
    this.isInline = false;
    this.lineBreak = false;
    this.overflow = "visible";
    this.cursor = "";
    this.scrollbarWidth = "";
    this.scrollbarThumb = undefined;
    this.scrollbarTrack = undefined;
    this.scrollbarLabel = "";
    this.surfaceEffect = "";
    this.rippleSpeed = 220.0;
    this.rippleWidth = 28.0;
    this.rippleStrength = 7.0;
    this.rippleDecay = 1.8;
    this.rippleHighlight = 0.08;
    this.rippleRings = 3.0;
    this.rippleStagger = 0.09;
    this.rippleFalloff = 0.62;
    this.rippleShine = 0.45;
    this.rippleGloss = 120.0;
    this.rippleBump = 70.0;
    this.rippleLightX = -0.45;
    this.rippleLightY = -0.65;
    this.rippleLightZ = 0.62;
    this.rippleXs = [];
    this.rippleYs = [];
    this.rippleAges = [];
    this.effectTrigger = "";
    this.documentCss = "";
    this.fxNames = [];
    this.fxValues = [];
    this.scrollTop = 0.0;
    this.scrollLeft = 0.0;
    this.scrollWidth = 0.0;
    this.scrollHeight = 0.0;
    this.appliedScrollTop = 0.0;
    this.appliedScrollLeft = 0.0;
    this.paintLeft = 0.0;
    this.paintTop = 0.0;
    this.paintRight = 0.0;
    this.paintBottom = 0.0;
    this.paintUnbounded = false;
    this.shiftDx = 0.0;
    this.shiftDy = 0.0;
    this.keepLayout = false;
    this.hasLayout = false;
    this.layoutClean = false;
    this.layoutSkipped = false;
    this.kidOffX = 0.0;
    this.kidOffY = 0.0;
    this.boundsFresh = false;
    this.hasOverlayBelow = false;
    this.overlayScanned = false;
    this.lastParentW = 0.0;
    this.lastParentH = 0.0;
    this.lastFlex = false;
    this.lastFlexW = 0.0;
    this.hasIntrinsicMin = false;
    this.hasIntrinsicMax = false;
    this.intrinsicMin = 0.0;
    this.intrinsicMax = 0.0;
    this.paintClean = false;
    this.paintStamp = 0;
    this.paintHasEffect = false;
    this.effectRuntimeId = "";
    this.textShiftY = 0.0;
    this.fontSize = undefined;
    this.fontSizeInherited = false;
    this.fontSizeBase = 14.0;
    this.rootFontSize = 14.0;
    this.viewportW = 0.0;
    this.viewportH = 0.0;
    this.viewportRoot = false;
    this.viewportX = 0.0;
    this.viewportY = 0.0;
    this.fontFamily = "Noto Sans";
    this.fontWeight = "normal";
    this.letterSpacing = 0.0;
    this.paragraphSpacing = 0.0;
    this.strokeLineCap = "butt";
    this.strokeLineJoin = "miter";
    this.lineHeight = 0.0;
    this.lineHeightUnit = undefined;
    this.textAlign = "left";
    this.whiteSpace = "normal";
    this.color = undefined;
    this.emojiColor = undefined;
    this.textContent = "";
    this.display = "block";
    this.flex = 0.0;
    this.flexShrink = 1.0;
    this.flexBasis = undefined;
    this.flexDirection = "column";
    this.justifyContent = "flex-start";
    this.alignItems = "flex-start";
    this.alignSelf = "";
    this.alignContent = "flex-start";
    this.flexWrap = "wrap";
    this.gap = undefined;
    this.rowGap = undefined;
    this.columnGap = undefined;
    this.gridTemplateColumns = "";
    this.gridTemplateRows = "";
    this.subgridColumnSizes = [];
    this.subgridRowSizes = [];
    this.computedRowSizes = [];
    this.subgridPending = false;
    this.gridTemplateAreas = "";
    this.gridAutoFlow = "row";
    this.fullBleed = false;
    this.gridArea = "";
    this.gridColumn = "";
    this.gridRow = "";
    this.position = "relative";
    this.marginTop = undefined;
    this.marginRight = undefined;
    this.marginBottom = undefined;
    this.marginLeft = undefined;
    this.paddingTop = undefined;
    this.paddingRight = undefined;
    this.paddingBottom = undefined;
    this.paddingLeft = undefined;
    this.borderWidth = undefined;
    this.borderTopWidth = undefined;
    this.borderRightWidth = undefined;
    this.borderBottomWidth = undefined;
    this.borderLeftWidth = undefined;
    this.borderColor = undefined;
    this.src = "";
    this.alt = "";
    this.imageViewBox = "";
    this.imageViewBoxX = 0.0;
    this.imageViewBoxY = 0.0;
    this.imageViewBoxW = 1.0;
    this.imageViewBoxH = 1.0;
    this.imageViewBoxSet = false;
    this.imageOffsetX = undefined;
    this.imageOffsetY = undefined;
    this.objectFit = "cover";
    this.sourceWidth = 0.0;
    this.sourceHeight = 0.0;
    this.svgPath = "";
    this.preserveAspectRatio = "xMidYMid meet";
    this.ringsCache = [];
    this.ringsHave = false;
    this.ringsPath = "";
    this.ringsX = 0.0;
    this.ringsY = 0.0;
    this.ringsW = 0.0;
    this.ringsH = 0.0;
    this.ringsSteps = 0;
    this.ringsScale = 1.0;
    this.ringsViewBox = "";
    this.ringsFit = "";
    this.svgSource = "";
    this.svgDoc = undefined;
    this.svgDocKey = "";
    this.viewBox = "";
    this.fillColor = undefined;
    this.strokeColor = undefined;
    this.strokeWidth = 0.0;
    this.fillRule = "nonzero";
    this.strokeDashArray = "";
    this.strokeDashOffset = 0.0;
    this.anchorName = "";
    this.connectorFrom = "";
    this.connectorTo = "";
    this.connectorFromSide = "auto";
    this.connectorToSide = "auto";
    this.connectorRouting = "straight";
    this.connectorFromOffset = 0.0;
    this.connectorToOffset = 0.0;
    this.arrowStart = "none";
    this.arrowEnd = "none";
    this.arrowSize = 10.0;
    this.arrowPath = "";
    this.connectorResolved = false;
    this.clipPath = "";
    this.className = "";
    this.theme = "";
    this.inlineProps = [];
    this.cssProps = [];
    this.imageQuality = 0;
    this.maxImageSize = 0;
    this.rotate = 0.0;
    this.scale = 1.0;
    this.flipY = false;
    this.translateX = 0.0;
    this.translateY = 0.0;
    this.transformSpec = "";
    this.transformOriginX = EVGUnit.unset();
    this.transformOriginY = EVGUnit.unset();
    this.transformOriginSpec = "";
    this.shadowRadius = undefined;
    this.shadowColor = undefined;
    this.shadowOffsetX = undefined;
    this.shadowOffsetY = undefined;
    this.backgroundGradient = "";
    this.gradient = new EVGGradient();
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedInnerWidth = 0.0;
    this.calculatedInnerHeight = 0.0;
    this.calculatedFlexWidth = 0.0;
    this.hasFlexWidth = false;
    this.calculatedFlexHeight = 0.0;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    this.hasDefiniteHeight = false;
    this.calculatedPage = 0;
    this.isAbsolute = false;
    this.isOverlay = false;
    this.overlayAnchor = undefined;
    this.isOverlayAnchor = false;
    this.overlaySide = "bottom";
    this.overlayAlign = "start";
    this.overlayGap = 4.0;
    this.overlayX = 0.0;
    this.overlayY = 0.0;
    this.overlayPlacedSide = "";
    this.overlayPlacedAlign = "";
    this.overlayPlacedPresentation = "";
    this.overlayClamped = false;
    this.positionAnchor = "";
    this.positionTryFallbacks = "";
    this.positionTryOrder = "";
    this.presentation = "";
    this.sheetBelow = 0.0;
    this.fitViewport = false;
    this.anchorLeftSide = "";
    this.anchorLeftOffset = 0.0;
    this.anchorTopSide = "";
    this.anchorTopOffset = 0.0;
    this.anchorRightSide = "";
    this.anchorRightOffset = 0.0;
    this.anchorBottomSide = "";
    this.anchorBottomOffset = 0.0;
    this.isHovered = false;
    this.isFocused = false;
    this.isPressed = false;
    this.transitionSpec = "";
    this.transitions = [];     /* note: unused */
    this.role = "";
    this.a11yLabel = "";
    this.a11yValue = "";
    this.a11yRequired = "";
    this.a11yInvalid = "";
    this.a11yReadOnly = "";
    this.a11yRoleDescription = "";
    this.a11yDescription = "";
    this.a11yHasPopup = "";
    this.a11yRowCount = 0;
    this.a11yRowIndex = 0;
    this.a11yHidden = false;
    this.a11yModal = false;
    this.a11ySorted = 0;
    this.a11yOrientation = "";
    this.a11yCurrent = "";
    this.a11yHasValue = false;
    this.a11yValueNow = 0;
    this.a11yHasRange = false;
    this.a11yValueMin = 0;
    this.a11yValueMax = 0;
    this.a11yChecked = 0;
    this.a11yPressed = 0;
    this.a11yExpanded = 0;
    this.a11ySelected = 0;
    this.a11yDisabled = false;
    this.a11yFocusable = false;
    this.a11yPosInSet = 0;
    this.a11ySetSize = 0;
    this.a11yLevel = 0;
    this.styleClass = "";
    this.styleTheme = "";
    this.styleBits = 0;
    this.styleGen = 0;
    this.styleSlot = 0 - 1;
    this.styleKids = 0 - 1;
    this.inspectSlot = 0 - 1;
    this.isLayoutComplete = false;
    this.unitsResolved = false;
    this.hasReturn = false;
    this.hasBreak = false;
    this.hasContinue = false;
    this.inheritedFontSize = 14.0;
    this.tagName = "div";
    this.elementType = 0;
    this.width = EVGUnit.unset();
    this.height = EVGUnit.unset();
    this.minWidth = EVGUnit.unset();
    this.minHeight = EVGUnit.unset();
    this.maxWidth = EVGUnit.unset();
    this.maxHeight = EVGUnit.unset();
    this.left = EVGUnit.unset();
    this.top = EVGUnit.unset();
    this.right = EVGUnit.unset();
    this.bottom = EVGUnit.unset();
    this.x = EVGUnit.unset();
    this.y = EVGUnit.unset();
    this.gap = EVGUnit.unset();
    this.flexBasis = EVGUnit.unset();
    this.rowGap = EVGUnit.unset();
    this.columnGap = EVGUnit.unset();
    const newBox = new EVGBox();
    this.box = newBox;
    this.backgroundColor = EVGColor.noColor();
    this.color = EVGColor.black();
    this.emojiColor = EVGColor.noColor();
    this.fontSize = EVGUnit.unset();
    this.lineHeightUnit = EVGUnit.unset();
    this.shadowRadius = EVGUnit.unset();
    this.shadowColor = EVGColor.noColor();
    this.shadowOffsetX = EVGUnit.unset();
    this.shadowOffsetY = EVGUnit.unset();
    this.imageOffsetX = EVGUnit.unset();
    this.imageOffsetY = EVGUnit.unset();
    this.fillColor = EVGColor.noColor();
    this.scrollbarThumb = EVGColor.noColor();
    this.scrollbarTrack = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
    this.marginTop = EVGUnit.unset();
    this.marginRight = EVGUnit.unset();
    this.marginBottom = EVGUnit.unset();
    this.marginLeft = EVGUnit.unset();
    this.paddingTop = EVGUnit.unset();
    this.paddingRight = EVGUnit.unset();
    this.paddingBottom = EVGUnit.unset();
    this.paddingLeft = EVGUnit.unset();
    this.borderWidth = EVGUnit.unset();
    this.borderTopWidth = EVGUnit.unset();
    this.borderRightWidth = EVGUnit.unset();
    this.borderBottomWidth = EVGUnit.unset();
    this.borderLeftWidth = EVGUnit.unset();
    this.borderColor = EVGColor.noColor();
    this.gradientFrom = EVGColor.noColor();
    this.gradientTo = EVGColor.noColor();
  }
  addChild (child) {
    this.children.push(child);
  };
  resetLayoutState () {
    if ( this.keepLayout && (this.hasLayout && this.layoutClean) ) {
      return;
    }
    this.resetLayoutNow();
  };
  resetLayoutNow () {
    this.unitsResolved = false;
    this.shiftDx = 0.0;
    this.shiftDy = 0.0;
    this.hasIntrinsicMin = false;
    this.hasIntrinsicMax = false;
    this.layoutSkipped = false;
    this.boundsFresh = false;
    this.overlayScanned = false;
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedFlexWidth = 0.0;
    this.hasFlexWidth = false;
    this.hasDefiniteHeight = false;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    let i = 0;
    while (i < this.children.length) {
      const child = this.children[i];
      child.resetLayoutState();
      i = i + 1;
    };
  };
  getChildCount () {
    return this.children.length;
  };
  moveSelf (dx, dy) {
    this.calculatedX = this.calculatedX + dx;
    this.calculatedY = this.calculatedY + dy;
    this.paintLeft = this.paintLeft + dx;
    this.paintRight = this.paintRight + dx;
    this.paintTop = this.paintTop + dy;
    this.paintBottom = this.paintBottom + dy;
  };
  moveSubtree (dx, dy) {
    this.moveSelf(dx, dy);
    let i = 0;
    const n = this.children.length;
    while (i < n) {
      const kid = this.children[i];
      kid.moveSubtree(dx, dy);
      i = i + 1;
    };
  };
  settleShift () {
    if ( this.shiftDx == 0.0 && this.shiftDy == 0.0 ) {
      return;
    }
    const dx = this.shiftDx;
    const dy = this.shiftDy;
    this.shiftDx = 0.0;
    this.shiftDy = 0.0;
    let i = 0;
    const n = this.children.length;
    while (i < n) {
      const kid = this.children[i];
      kid.moveSubtree(dx, dy);
      i = i + 1;
    };
  };
  settleAll () {
    this.settleShift();
    let i = 0;
    const n = this.children.length;
    while (i < n) {
      const kid = this.children[i];
      kid.settleAll();
      i = i + 1;
    };
  };
  clipsContent () {
    return this.overflow != "visible";
  };
  clientHeight () {
    return this.calculatedHeight - this.box.borderWidthPx * 2.0;
  };
  clientWidth () {
    return this.calculatedWidth - this.box.borderWidthPx * 2.0;
  };
  maxScrollTop () {
    const m = this.scrollHeight - this.clientHeight();
    if ( m < 0.0 ) {
      return 0.0;
    }
    return m;
  };
  maxScrollLeft () {
    const m = this.scrollWidth - this.clientWidth();
    if ( m < 0.0 ) {
      return 0.0;
    }
    return m;
  };
  getChild (index) {
    return this.children[index];
  };
  hasParent () {
    if ( typeof(this.parent) != "undefined" ) {
      return true;
    }
    return false;
  };
  isContainer () {
    return this.elementType == 0;
  };
  isText () {
    return this.elementType == 1;
  };
  isImage () {
    return this.elementType == 2;
  };
  isPath () {
    return this.elementType == 3;
  };
  isHidden () {
    return this.display == "none";
  };
  lineBoxFor (fontSize, normalPx) {
    if ( this.lineHeightUnit.isSet ) {
      const u = this.lineHeightUnit;
      u.setContext(this.rootFontSize, this.viewportW, this.viewportH);
      u.resolve(fontSize, fontSize);
      if ( u.pixels > 0.0 ) {
        return u.pixels;
      }
      return 0.0;
    }
    if ( this.lineHeight > 0.0 ) {
      return fontSize * this.lineHeight;
    }
    return normalPx;
  };
  wrapWidth (contentWidth) {
    if ( this.whiteSpace == "nowrap" ) {
      return 0.0;
    }
    if ( this.whiteSpace == "pre" ) {
      return 0.0;
    }
    return contentWidth;
  };
  hasTransform () {
    if ( this.rotate != 0.0 ) {
      return true;
    }
    if ( this.flipY ) {
      return true;
    }
    if ( Math.abs(this.scale - 1.0) > 0.000001 ) {
      return true;
    }
    if ( this.translateX != 0.0 ) {
      return true;
    }
    if ( this.translateY != 0.0 ) {
      return true;
    }
    return false;
  };
  isFixedPosition () {
    return this.position == "fixed";
  };
  moveSubtreeUnfixed (dx, dy) {
    this.moveSelf(dx, dy);
    let i = 0;
    const n = this.children.length;
    while (i < n) {
      const kid = this.children[i];
      if ( kid.isFixedPosition() ) {
      } else {
        kid.moveSubtreeUnfixed(dx, dy);
      }
      i = i + 1;
    };
  };
  hasAnchorInsets () {
    if ( this.anchorLeftSide.length > 0 ) {
      return true;
    }
    if ( this.anchorTopSide.length > 0 ) {
      return true;
    }
    if ( this.anchorRightSide.length > 0 ) {
      return true;
    }
    if ( this.anchorBottomSide.length > 0 ) {
      return true;
    }
    return false;
  };
  isSurface () {
    if ( this.isOverlay ) {
      return true;
    }
    if ( this.tagName == "popover" ) {
      return true;
    }
    return false;
  };
  arrowFillColor () {
    let out = EVGColor.noColor();
    if ( this.fillColor.isSet ) {
      const f = this.fillColor;
      out = f;
      return out;
    }
    if ( this.strokeColor.isSet ) {
      const st = this.strokeColor;
      out = st;
    }
    return out;
  };
  drawsPath () {
    if ( this.tagName == "path" ) {
      return true;
    }
    if ( this.tagName == "Path" ) {
      return true;
    }
    if ( this.tagName == "connector" ) {
      return true;
    }
    if ( this.tagName == "svg" ) {
      return true;
    }
    if ( this.tagName == "Svg" ) {
      return true;
    }
    return false;
  };
  hasAbsolutePosition () {
    if ( this.position == "fixed" ) {
      return true;
    }
    if ( this.isSurface() ) {
      return true;
    }
    if ( this.display == "none" ) {
      return true;
    }
    if ( this.tagName == "layer" || this.tagName == "Layer" ) {
      return true;
    }
    if ( this.tagName == "connector" ) {
      return true;
    }
    if ( this.hasAnchorInsets() ) {
      return true;
    }
    if ( this.left.isSet ) {
      return true;
    }
    if ( this.top.isSet ) {
      return true;
    }
    if ( this.right.isSet ) {
      return true;
    }
    if ( this.bottom.isSet ) {
      return true;
    }
    if ( this.x.isSet ) {
      return true;
    }
    if ( this.y.isSet ) {
      return true;
    }
    return false;
  };
  resolveBookFormat () {
    let w = 595.0;
    let h = 842.0;
    if ( this.format == "a4" ) {
      w = 595.0;
      h = 842.0;
    }
    if ( this.format == "letter" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.format == "trade-5x8" ) {
      w = 360.0;
      h = 576.0;
    }
    if ( this.format == "trade-6x9" ) {
      w = 432.0;
      h = 648.0;
    }
    if ( this.format == "trade-8x10" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "mini-square" ) {
      w = 360.0;
      h = 360.0;
    }
    if ( this.format == "small-square" ) {
      w = 504.0;
      h = 504.0;
    }
    if ( this.format == "standard-portrait" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "standard-landscape" ) {
      w = 720.0;
      h = 576.0;
    }
    if ( this.format == "large-landscape" ) {
      w = 936.0;
      h = 792.0;
    }
    if ( this.format == "large-square" ) {
      w = 864.0;
      h = 864.0;
    }
    if ( this.format == "magazine" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.orientation == "landscape" ) {
      if ( w < h ) {
        const temp = w;
        w = h;
        h = temp;
      }
    }
    if ( this.orientation == "portrait" ) {
      if ( w > h ) {
        const temp_1 = w;
        w = h;
        h = temp_1;
      }
    }
    if ( this.pageWidth > 0.0 ) {
      w = this.pageWidth;
    }
    if ( this.pageHeight > 0.0 ) {
      h = this.pageHeight;
    }
    this.pageWidth = w;
    this.pageHeight = h;
  };
  effectiveHref () {
    if ( this.href.length > 0 ) {
      return this.href;
    }
    let p = this.parent;
    let guard = 0;
    while (((typeof(p) !== "undefined" && p != null ) ) && guard < 4096) {
      const up = p;
      if ( up.href.length > 0 ) {
        return up.href;
      }
      p = up.parent;
      guard = guard + 1;
    };
    return "";
  };
  effectiveFontFamily () {
    if ( this.fontWeight == "bold" ) {
      return this.fontFamily + "-Bold";
    }
    return this.fontFamily;
  };
  effectiveBorderWidthPx () {
    if ( this.box.borderWidthPx > 0.0 ) {
      return this.box.borderWidthPx;
    }
    if ( typeof(this.borderWidth) != "undefined" ) {
      if ( this.borderWidth.isSet ) {
        return this.borderWidth.pixels;
      }
    }
    return 0.0;
  };
  effectiveBorderColor () {
    if ( typeof(this.box.borderColor) != "undefined" ) {
      const bc = this.box.borderColor;
      if ( bc.isSet ) {
        return bc;
      }
    }
    if ( typeof(this.borderColor) != "undefined" ) {
      const ec = this.borderColor;
      if ( ec.isSet ) {
        return ec;
      }
    }
    return EVGColor.black();
  };
  hasBorder () {
    if ( this.effectiveBorderWidthPx() <= 0.0 ) {
      return false;
    }
    return true;
  };
  effectiveEmojiColor () {
    if ( this.emojiColor.isSet ) {
      return this.emojiColor;
    }
    return this.color;
  };
  inheritProperties (parentEl) {
    if ( this.fontFamily == "Noto Sans" ) {
      this.fontFamily = parentEl.fontFamily;
    }
    if ( this.color.isSet == false ) {
      this.color = parentEl.color;
    }
    if ( this.emojiColor.isSet == false ) {
      this.emojiColor = parentEl.emojiColor;
    }
    if ( this.cursor.length == 0 ) {
      this.cursor = parentEl.cursor;
    }
    if ( this.whiteSpace == "normal" ) {
      this.whiteSpace = parentEl.whiteSpace;
    }
    this.fontSizeBase = parentEl.inheritedFontSize;
    this.rootFontSize = parentEl.rootFontSize;
    if ( this.viewportRoot == false ) {
      this.viewportW = parentEl.viewportW;
      this.viewportH = parentEl.viewportH;
      this.viewportX = parentEl.viewportX;
      this.viewportY = parentEl.viewportY;
    }
    this.applyOwnFontSize();
    this.applyOwnDirection(parentEl.resolvedRtl);
  };
  applyOwnDirection (inherited) {
    this.resolvedRtl = inherited;
    if ( this.textDir == "rtl" ) {
      this.resolvedRtl = true;
    }
    if ( this.textDir == "ltr" ) {
      this.resolvedRtl = false;
    }
  };
  applyOwnFontSize () {
    let authored = this.fontSize.isSet;
    if ( this.fontSizeInherited ) {
      authored = false;
    }
    if ( authored ) {
      this.fontSize.setContext(
        this.rootFontSize,
        this.viewportW,
        this.viewportH
      );
      this.fontSize.resolve(this.fontSizeBase, this.fontSizeBase);
      this.inheritedFontSize = this.fontSize.pixels;
    } else {
      this.inheritedFontSize = this.fontSizeBase;
      this.fontSize = EVGUnit.px(this.fontSizeBase);
      this.fontSizeInherited = true;
    }
  };
  resolveUnits (parentWidth, parentHeight) {
    if ( this.unitsResolved ) {
      return;
    }
    this.unitsResolved = true;
    const fs = this.inheritedFontSize;
    const rfs = this.rootFontSize;
    const vpw = this.viewportW;
    const vph = this.viewportH;
    this.width.setContext(rfs, vpw, vph);
    this.height.setContext(rfs, vpw, vph);
    this.flexBasis.setContext(rfs, vpw, vph);
    this.minWidth.setContext(rfs, vpw, vph);
    this.minHeight.setContext(rfs, vpw, vph);
    this.maxWidth.setContext(rfs, vpw, vph);
    this.maxHeight.setContext(rfs, vpw, vph);
    this.left.setContext(rfs, vpw, vph);
    this.top.setContext(rfs, vpw, vph);
    this.right.setContext(rfs, vpw, vph);
    this.bottom.setContext(rfs, vpw, vph);
    this.x.setContext(rfs, vpw, vph);
    this.y.setContext(rfs, vpw, vph);
    this.shadowRadius.setContext(rfs, vpw, vph);
    this.shadowOffsetX.setContext(rfs, vpw, vph);
    this.shadowOffsetY.setContext(rfs, vpw, vph);
    this.width.resolveWithHeight(parentWidth, parentHeight, fs);
    this.height.resolveForHeight(parentWidth, parentHeight, fs);
    this.flexBasis.resolve(parentWidth, fs);
    this.minWidth.resolve(parentWidth, fs);
    this.minHeight.resolve(parentHeight, fs);
    this.maxWidth.resolve(parentWidth, fs);
    this.maxHeight.resolve(parentHeight, fs);
    this.left.resolve(parentWidth, fs);
    this.top.resolve(parentHeight, fs);
    this.right.resolve(parentWidth, fs);
    this.bottom.resolve(parentHeight, fs);
    this.x.resolve(parentWidth, fs);
    this.y.resolve(parentHeight, fs);
    this.box.resolveUnits(parentWidth, parentHeight, fs, rfs, vpw, vph);
    this.shadowRadius.resolve(parentWidth, fs);
    this.shadowOffsetX.resolve(parentWidth, fs);
    this.shadowOffsetY.resolve(parentHeight, fs);
    this.isAbsolute = this.hasAbsolutePosition();
  };
  applyTransform (value) {
    this.transformSpec = value.trim();
    this.rotate = 0.0;
    this.scale = 1.0;
    this.flipY = false;
    this.translateX = 0.0;
    this.translateY = 0.0;
    if ( this.transformSpec == "none" || this.transformSpec.length == 0 ) {
      return;
    }
    const parts = EVGElement.splitWords(this.transformSpec);
    let a = 0.0;
    let sc = 1.0;
    let flip = false;
    let tx = 0.0;
    let ty = 0.0;
    let i = 0;
    while (i < parts.length) {
      const one = parts[i].trim();
      let b = 0.0;
      let s2 = 1.0;
      let f2 = false;
      let ux = 0.0;
      let uy = 0.0;
      const args = EVGElement.callArgs(one, "rotate");
      if ( args.length > 0 ) {
        b = EVGElement.parseAngleDeg(args);
      } else {
        const sargs = EVGElement.callArgs(one, "scale");
        if ( sargs.length > 0 ) {
          const nums = EVGElement.numberList(sargs);
          if ( nums.length > 0 ) {
            s2 = nums[0];
          }
          if ( nums.length > 1 ) {
            if ( nums[0] * nums[1] < 0.0 ) {
              f2 = true;
            }
          }
        } else {
          const targs = EVGElement.callArgs(one, "translate");
          if ( targs.length > 0 ) {
            const tn = EVGElement.numberList(targs);
            if ( tn.length > 0 ) {
              ux = tn[0];
            }
            if ( tn.length > 1 ) {
              uy = tn[1];
            }
          } else {
            const xargs = EVGElement.callArgs(one, "translateX");
            if ( xargs.length > 0 ) {
              const xn = EVGElement.numberList(xargs);
              if ( xn.length > 0 ) {
                ux = xn[0];
              }
            } else {
              const yargs = EVGElement.callArgs(one, "translateY");
              if ( yargs.length > 0 ) {
                const yn = EVGElement.numberList(yargs);
                if ( yn.length > 0 ) {
                  uy = yn[0];
                }
              }
            }
          }
        }
      }
      const rad = (a * 3.14159265358979) / 180.0;
      const cs = Math.cos(rad);
      const sn = Math.sin(rad);
      let uyf = uy;
      let bf = b;
      if ( flip ) {
        uyf = 0.0 - uy;
        bf = 0.0 - b;
      }
      tx = tx + sc * (ux * cs - uyf * sn);
      ty = ty + sc * (ux * sn + uyf * cs);
      a = a + bf;
      sc = sc * s2;
      if ( f2 ) {
        flip = flip == false;
      }
      i = i + 1;
    };
    this.rotate = a;
    this.scale = sc;
    this.flipY = flip;
    this.translateX = tx;
    this.translateY = ty;
  };
  applyTransformOrigin (value) {
    this.transformOriginSpec = value.trim();
    const words = EVGElement.splitWords(this.transformOriginSpec);
    const n = words.length;
    if ( n == 0 ) {
      this.transformOriginX = new EVGUnit();
      this.transformOriginY = new EVGUnit();
      return;
    }
    const first = words[0].trim();
    if ( n == 1 ) {
      if ( EVGElement.isYKeyword(first) ) {
        this.transformOriginX = EVGUnit.percent(50.0);
        this.transformOriginY = EVGElement.originUnit(first);
      } else {
        this.transformOriginX = EVGElement.originUnit(first);
        this.transformOriginY = EVGUnit.percent(50.0);
      }
      return;
    }
    const second = words[1].trim();
    let swap = false;
    if ( EVGElement.isYKeyword(first) ) {
      swap = true;
    }
    if ( EVGElement.isXKeyword(second) ) {
      swap = true;
    }
    if ( swap ) {
      this.transformOriginX = EVGElement.originUnit(second);
      this.transformOriginY = EVGElement.originUnit(first);
    } else {
      this.transformOriginX = EVGElement.originUnit(first);
      this.transformOriginY = EVGElement.originUnit(second);
    }
  };
  markCss (name) {
    const prop = EVGElement.toKebab(name);
    if ( this.fromCss(prop) == false ) {
      this.cssProps.push(prop);
    }
  };
  fromCss (name) {
    if ( this.cssProps.length == 0 ) {
      return false;
    }
    const prop = EVGElement.toKebab(name);
    let i = 0;
    while (i < this.cssProps.length) {
      if ( this.cssProps[i] == prop ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  clearCssMarks () {
    let empty = [];
    this.cssProps = empty;
  };
  markInline (name) {
    const prop = EVGElement.toKebab(name);
    if ( this.hasInline(prop) == false ) {
      this.inlineProps.push(prop);
    }
  };
  unmarkInline (name) {
    const prop = EVGElement.toKebab(name);
    let kept = [];
    let i = 0;
    while (i < this.inlineProps.length) {
      const cur = this.inlineProps[i];
      if ( cur != prop ) {
        kept.push(cur);
      }
      i = i + 1;
    };
    this.inlineProps = kept;
  };
  hasInline (name) {
    if ( this.inlineProps.length == 0 ) {
      return false;
    }
    const prop = EVGElement.toKebab(name);
    let i = 0;
    while (i < this.inlineProps.length) {
      if ( this.inlineProps[i] == prop ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  setFlexShorthand (value) {
    const parts = EVGElement.splitSpaces(value);
    const n = parts.length;
    if ( n == 0 ) {
      return;
    }
    const first = parts[0];
    const growVal = isNaN( parseFloat(first) ) ? undefined : parseFloat(first);
    if ( EVGElement.isPlainNumber(first) ) {
      this.flex = growVal;
      this.flexBasis = EVGUnit.px(0.0);
      if ( n >= 2 ) {
        const shrinkVal = isNaN( parseFloat(parts[1]) ) ? undefined : parseFloat(parts[1]);
        if ( typeof(shrinkVal) != "undefined" ) {
          this.flexShrink = shrinkVal;
        }
      }
      if ( n >= 3 ) {
        this.flexBasis = EVGUnit.parse(parts[2]);
      }
    } else {
      this.flexBasis = EVGUnit.parse(first);
      this.flex = 1.0;
    }
  };
  adoptFrom (other) {
    this.id = other.id;
    this.key = other.key;
    this.href = other.href;
    this.tagName = other.tagName;
    this.elementType = other.elementType;
    this.format = other.format;
    this.orientation = other.orientation;
    this.pageWidth = other.pageWidth;
    this.pageHeight = other.pageHeight;
    this.width = other.width;
    this.height = other.height;
    this.minWidth = other.minWidth;
    this.minHeight = other.minHeight;
    this.maxWidth = other.maxWidth;
    this.maxHeight = other.maxHeight;
    this.left = other.left;
    this.top = other.top;
    this.right = other.right;
    this.bottom = other.bottom;
    this.x = other.x;
    this.y = other.y;
    this.box = other.box;
    this.backgroundColor = other.backgroundColor;
    this.opacity = other.opacity;
    this.backdropBlur = other.backdropBlur;
    this.gradientSet = other.gradientSet;
    this.gradientFrom = other.gradientFrom;
    this.gradientTo = other.gradientTo;
    this.gradientDir = other.gradientDir;
    this.absPosSet = other.absPosSet;
    this.absX = other.absX;
    this.absY = other.absY;
    this.glowIntensity = other.glowIntensity;
    this.bgImageSet = other.bgImageSet;
    this.bgImagePath = other.bgImagePath;
    this.textDir = other.textDir;
    this.resolvedRtl = other.resolvedRtl;
    this.direction = other.direction;
    this.align = other.align;
    this.verticalAlign = other.verticalAlign;
    this.isInline = other.isInline;
    this.lineBreak = other.lineBreak;
    this.overflow = other.overflow;
    this.cursor = other.cursor;
    this.surfaceEffect = other.surfaceEffect;
    this.rippleSpeed = other.rippleSpeed;
    this.rippleWidth = other.rippleWidth;
    this.rippleStrength = other.rippleStrength;
    this.rippleDecay = other.rippleDecay;
    this.rippleHighlight = other.rippleHighlight;
    this.rippleRings = other.rippleRings;
    this.rippleStagger = other.rippleStagger;
    this.rippleFalloff = other.rippleFalloff;
    this.rippleShine = other.rippleShine;
    this.rippleGloss = other.rippleGloss;
    this.rippleBump = other.rippleBump;
    this.rippleLightX = other.rippleLightX;
    this.rippleLightY = other.rippleLightY;
    this.rippleLightZ = other.rippleLightZ;
    this.rippleXs = other.rippleXs;
    this.rippleYs = other.rippleYs;
    this.rippleAges = other.rippleAges;
    this.effectTrigger = other.effectTrigger;
    this.fxNames = other.fxNames;
    this.fxValues = other.fxValues;
    this.documentCss = other.documentCss;
    this.cssProps = other.cssProps;
    this.scrollTop = other.scrollTop;
    this.scrollLeft = other.scrollLeft;
    this.scrollWidth = other.scrollWidth;
    this.scrollHeight = other.scrollHeight;
    this.fontSize = other.fontSize;
    this.fontSizeInherited = other.fontSizeInherited;
    this.fontSizeBase = other.fontSizeBase;
    this.rootFontSize = other.rootFontSize;
    this.viewportW = other.viewportW;
    this.viewportH = other.viewportH;
    this.viewportRoot = other.viewportRoot;
    this.viewportX = other.viewportX;
    this.viewportY = other.viewportY;
    this.fontFamily = other.fontFamily;
    this.fontWeight = other.fontWeight;
    this.letterSpacing = other.letterSpacing;
    this.paragraphSpacing = other.paragraphSpacing;
    this.strokeLineCap = other.strokeLineCap;
    this.strokeLineJoin = other.strokeLineJoin;
    this.lineHeight = other.lineHeight;
    this.lineHeightUnit = other.lineHeightUnit;
    this.textAlign = other.textAlign;
    this.textShiftY = other.textShiftY;
    this.whiteSpace = other.whiteSpace;
    this.color = other.color;
    this.emojiColor = other.emojiColor;
    this.textContent = other.textContent;
    this.display = other.display;
    this.flex = other.flex;
    this.flexShrink = other.flexShrink;
    this.flexBasis = other.flexBasis;
    this.flexDirection = other.flexDirection;
    this.justifyContent = other.justifyContent;
    this.alignItems = other.alignItems;
    this.alignSelf = other.alignSelf;
    this.alignContent = other.alignContent;
    this.flexWrap = other.flexWrap;
    this.gap = other.gap;
    this.rowGap = other.rowGap;
    this.columnGap = other.columnGap;
    this.gridTemplateColumns = other.gridTemplateColumns;
    this.gridTemplateRows = other.gridTemplateRows;
    this.subgridColumnSizes = other.subgridColumnSizes;
    this.subgridRowSizes = other.subgridRowSizes;
    this.computedRowSizes = other.computedRowSizes;
    this.subgridPending = other.subgridPending;
    this.gridTemplateAreas = other.gridTemplateAreas;
    this.gridAutoFlow = other.gridAutoFlow;
    this.fullBleed = other.fullBleed;
    this.gridArea = other.gridArea;
    this.gridColumn = other.gridColumn;
    this.gridRow = other.gridRow;
    this.position = other.position;
    this.marginTop = other.marginTop;
    this.marginRight = other.marginRight;
    this.marginBottom = other.marginBottom;
    this.marginLeft = other.marginLeft;
    this.paddingTop = other.paddingTop;
    this.paddingRight = other.paddingRight;
    this.paddingBottom = other.paddingBottom;
    this.paddingLeft = other.paddingLeft;
    this.borderWidth = other.borderWidth;
    this.borderTopWidth = other.borderTopWidth;
    this.borderRightWidth = other.borderRightWidth;
    this.borderBottomWidth = other.borderBottomWidth;
    this.borderLeftWidth = other.borderLeftWidth;
    this.borderColor = other.borderColor;
    this.src = other.src;
    this.alt = other.alt;
    this.preserveAspectRatio = other.preserveAspectRatio;
    this.imageViewBox = other.imageViewBox;
    this.imageViewBoxX = other.imageViewBoxX;
    this.imageViewBoxY = other.imageViewBoxY;
    this.imageViewBoxW = other.imageViewBoxW;
    this.imageViewBoxH = other.imageViewBoxH;
    this.imageViewBoxSet = other.imageViewBoxSet;
    this.imageOffsetX = other.imageOffsetX;
    this.imageOffsetY = other.imageOffsetY;
    this.objectFit = other.objectFit;
    this.sourceWidth = other.sourceWidth;
    this.sourceHeight = other.sourceHeight;
    this.svgPath = other.svgPath;
    this.svgSource = other.svgSource;
    this.svgDoc = other.svgDoc;
    this.svgDocKey = other.svgDocKey;
    this.appliedScrollTop = other.appliedScrollTop;
    this.appliedScrollLeft = other.appliedScrollLeft;
    this.paintLeft = other.paintLeft;
    this.paintTop = other.paintTop;
    this.paintRight = other.paintRight;
    this.paintBottom = other.paintBottom;
    this.paintUnbounded = other.paintUnbounded;
    this.paintHasEffect = other.paintHasEffect;
    this.shiftDx = other.shiftDx;
    this.shiftDy = other.shiftDy;
    this.keepLayout = other.keepLayout;
    this.hasOverlayBelow = other.hasOverlayBelow;
    this.overlayScanned = other.overlayScanned;
    this.hasLayout = other.hasLayout;
    this.layoutClean = other.layoutClean;
    this.layoutSkipped = other.layoutSkipped;
    this.kidOffX = other.kidOffX;
    this.kidOffY = other.kidOffY;
    this.boundsFresh = other.boundsFresh;
    this.lastParentW = other.lastParentW;
    this.lastParentH = other.lastParentH;
    this.lastFlex = other.lastFlex;
    this.lastFlexW = other.lastFlexW;
    this.hasIntrinsicMin = other.hasIntrinsicMin;
    this.hasIntrinsicMax = other.hasIntrinsicMax;
    this.intrinsicMin = other.intrinsicMin;
    this.intrinsicMax = other.intrinsicMax;
    this.paintClean = other.paintClean;
    this.paintStamp = this.paintStamp + 1;
    this.scrollbarWidth = other.scrollbarWidth;
    this.scrollbarThumb = other.scrollbarThumb;
    this.scrollbarTrack = other.scrollbarTrack;
    this.scrollbarLabel = other.scrollbarLabel;
    this.viewBox = other.viewBox;
    this.fillColor = other.fillColor;
    this.strokeColor = other.strokeColor;
    this.strokeWidth = other.strokeWidth;
    this.fillRule = other.fillRule;
    this.strokeDashArray = other.strokeDashArray;
    this.strokeDashOffset = other.strokeDashOffset;
    this.anchorName = other.anchorName;
    this.connectorFrom = other.connectorFrom;
    this.connectorTo = other.connectorTo;
    this.connectorFromSide = other.connectorFromSide;
    this.connectorToSide = other.connectorToSide;
    this.connectorRouting = other.connectorRouting;
    this.connectorFromOffset = other.connectorFromOffset;
    this.connectorToOffset = other.connectorToOffset;
    this.arrowStart = other.arrowStart;
    this.arrowEnd = other.arrowEnd;
    this.arrowSize = other.arrowSize;
    this.arrowPath = other.arrowPath;
    this.connectorResolved = other.connectorResolved;
    this.clipPath = other.clipPath;
    this.className = other.className;
    this.theme = other.theme;
    this.inlineProps = other.inlineProps;
    this.imageQuality = other.imageQuality;
    this.maxImageSize = other.maxImageSize;
    this.rotate = other.rotate;
    this.scale = other.scale;
    this.flipY = other.flipY;
    this.translateX = other.translateX;
    this.translateY = other.translateY;
    this.transformSpec = other.transformSpec;
    this.transformOriginX = other.transformOriginX;
    this.transformOriginY = other.transformOriginY;
    this.transformOriginSpec = other.transformOriginSpec;
    this.shadowRadius = other.shadowRadius;
    this.shadowColor = other.shadowColor;
    this.shadowOffsetX = other.shadowOffsetX;
    this.shadowOffsetY = other.shadowOffsetY;
    this.backgroundGradient = other.backgroundGradient;
    this.gradient = other.gradient;
    this.calculatedX = other.calculatedX;
    this.calculatedY = other.calculatedY;
    this.calculatedWidth = other.calculatedWidth;
    this.calculatedHeight = other.calculatedHeight;
    this.calculatedInnerWidth = other.calculatedInnerWidth;
    this.calculatedInnerHeight = other.calculatedInnerHeight;
    this.calculatedFlexWidth = other.calculatedFlexWidth;
    this.hasFlexWidth = other.hasFlexWidth;
    this.calculatedFlexHeight = other.calculatedFlexHeight;
    this.calculatedBaseline = other.calculatedBaseline;
    this.calculatedDescent = other.calculatedDescent;
    this.hasBaseline = other.hasBaseline;
    this.hasDefiniteHeight = other.hasDefiniteHeight;
    this.calculatedPage = other.calculatedPage;
    this.isAbsolute = other.isAbsolute;
    this.isOverlay = other.isOverlay;
    this.positionAnchor = other.positionAnchor;
    this.positionTryFallbacks = other.positionTryFallbacks;
    this.positionTryOrder = other.positionTryOrder;
    this.presentation = other.presentation;
    this.sheetBelow = other.sheetBelow;
    this.fitViewport = other.fitViewport;
    this.anchorLeftSide = other.anchorLeftSide;
    this.anchorLeftOffset = other.anchorLeftOffset;
    this.anchorTopSide = other.anchorTopSide;
    this.anchorTopOffset = other.anchorTopOffset;
    this.anchorRightSide = other.anchorRightSide;
    this.anchorRightOffset = other.anchorRightOffset;
    this.anchorBottomSide = other.anchorBottomSide;
    this.anchorBottomOffset = other.anchorBottomOffset;
    this.overlayPlacedAlign = other.overlayPlacedAlign;
    this.overlayPlacedPresentation = other.overlayPlacedPresentation;
    this.overlayClamped = other.overlayClamped;
    this.overlayAnchor = other.overlayAnchor;
    this.isOverlayAnchor = other.isOverlayAnchor;
    this.overlaySide = other.overlaySide;
    this.overlayAlign = other.overlayAlign;
    this.overlayGap = other.overlayGap;
    this.overlayX = other.overlayX;
    this.overlayY = other.overlayY;
    this.overlayPlacedSide = other.overlayPlacedSide;
    this.isHovered = other.isHovered;
    this.isFocused = other.isFocused;
    this.isPressed = other.isPressed;
    this.transitionSpec = other.transitionSpec;
    this.role = other.role;
    this.a11yLabel = other.a11yLabel;
    this.a11yValue = other.a11yValue;
    this.a11yRequired = other.a11yRequired;
    this.a11yInvalid = other.a11yInvalid;
    this.a11yReadOnly = other.a11yReadOnly;
    this.a11yRoleDescription = other.a11yRoleDescription;
    this.a11yDescription = other.a11yDescription;
    this.a11yHasPopup = other.a11yHasPopup;
    this.a11yRowCount = other.a11yRowCount;
    this.a11yRowIndex = other.a11yRowIndex;
    this.a11yHidden = other.a11yHidden;
    this.a11yModal = other.a11yModal;
    this.a11ySorted = other.a11ySorted;
    this.a11yOrientation = other.a11yOrientation;
    this.a11yCurrent = other.a11yCurrent;
    this.a11yHasValue = other.a11yHasValue;
    this.a11yValueNow = other.a11yValueNow;
    this.a11yHasRange = other.a11yHasRange;
    this.a11yValueMin = other.a11yValueMin;
    this.a11yValueMax = other.a11yValueMax;
    this.a11yChecked = other.a11yChecked;
    this.a11yPressed = other.a11yPressed;
    this.a11yExpanded = other.a11yExpanded;
    this.a11ySelected = other.a11ySelected;
    this.a11yDisabled = other.a11yDisabled;
    this.a11yFocusable = other.a11yFocusable;
    this.a11yPosInSet = other.a11yPosInSet;
    this.a11ySetSize = other.a11ySetSize;
    this.a11yLevel = other.a11yLevel;
    this.styleClass = other.styleClass;
    this.styleTheme = other.styleTheme;
    this.styleBits = other.styleBits;
    this.styleGen = other.styleGen;
    this.styleSlot = other.styleSlot;
    this.styleKids = other.styleKids;
    this.inspectSlot = other.inspectSlot;
    this.isLayoutComplete = other.isLayoutComplete;
    this.unitsResolved = other.unitsResolved;
    this.hasReturn = other.hasReturn;
    this.hasBreak = other.hasBreak;
    this.hasContinue = other.hasContinue;
    this.inheritedFontSize = other.inheritedFontSize;
  };
  setScrollbarColor (value) {
    let parts = [];
    let cur = "";
    let depth = 0;
    let i = 0;
    const n = value.length;
    while (i < n) {
      const ch = value.substring(i, i + 1 );
      if ( ch == "(" ) {
        depth = depth + 1;
      }
      if ( ch == ")" ) {
        depth = depth - 1;
      }
      if ( (ch == " " || ch == "\t") && depth == 0 ) {
        if ( cur.length > 0 ) {
          parts.push(cur);
          cur = "";
        }
      } else {
        cur = cur + ch;
      }
      i = i + 1;
    };
    if ( cur.length > 0 ) {
      parts.push(cur);
    }
    this.scrollbarThumb = EVGColor.noColor();
    this.scrollbarTrack = EVGColor.noColor();
    if ( parts.length > 0 ) {
      const t = parts[0];
      if ( t != "auto" ) {
        this.scrollbarThumb = EVGColor.parse(t);
      }
    }
    if ( parts.length > 1 ) {
      const tr = parts[1];
      if ( tr != "auto" ) {
        this.scrollbarTrack = EVGColor.parse(tr);
      }
    }
  };
  unitOf (name, value) {
    const u = EVGUnit.parse(value);
    if ( u.isSet == false && u.unitType != 6 ) {
      if ( EVGReject.isAbsent(value) == false ) {
        EVGReject.note("unsupported length", name, value);
      }
    }
    return u;
  };
  setFx (key, value) {
    let i = 0;
    while (i < this.fxNames.length) {
      if ( this.fxNames[i] == key ) {
        this.fxValues[i] = value;
        return;
      }
      i = i + 1;
    };
    this.fxNames.push(key);
    this.fxValues.push(value);
  };
  fxValue (key, fallback) {
    let i = 0;
    while (i < this.fxNames.length) {
      if ( this.fxNames[i] == key ) {
        return this.fxValues[i];
      }
      i = i + 1;
    };
    return fallback;
  };
  setAttribute (name, value) {
    if ( name == "className" || name == "class-name" ) {
      this.className = value;
      return;
    }
    if ( name == "theme" ) {
      this.theme = value;
      return;
    }
    if ( name == "id" ) {
      this.id = value;
      return;
    }
    if ( name == "src" ) {
      this.src = value;
      return;
    }
    if ( name == "alt" ) {
      this.alt = value;
      return;
    }
    if ( name == "href" ) {
      this.href = value;
      return;
    }
    if ( name == "key" ) {
      this.key = value;
      return;
    }
    if ( name == "format" ) {
      this.format = value.toLowerCase();
      return;
    }
    if ( name == "orientation" ) {
      this.orientation = value.toLowerCase();
      return;
    }
    if ( name == "pageWidth" ) {
      const pw = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(pw) != "undefined" ) {
        this.pageWidth = pw;
      }
      return;
    }
    if ( name == "pageHeight" ) {
      const ph = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(ph) != "undefined" ) {
        this.pageHeight = ph;
      }
      return;
    }
    if ( name == "width" ) {
      this.width = this.unitOf(name, value);
      return;
    }
    if ( name == "height" ) {
      this.height = this.unitOf(name, value);
      return;
    }
    if ( name == "min-width" || name == "minWidth" ) {
      this.minWidth = this.unitOf(name, value);
      return;
    }
    if ( name == "min-height" || name == "minHeight" ) {
      this.minHeight = this.unitOf(name, value);
      return;
    }
    if ( name == "max-width" || name == "maxWidth" ) {
      this.maxWidth = this.unitOf(name, value);
      return;
    }
    if ( name == "max-height" || name == "maxHeight" ) {
      this.maxHeight = this.unitOf(name, value);
      return;
    }
    if ( name == "overlay" || name == "isOverlay" ) {
      this.isOverlay = EVGElement.truthy(value);
      return;
    }
    if ( name == "overlay-anchor-role" || name == "overlayAnchorRole" ) {
      this.isOverlayAnchor = EVGElement.truthy(value);
      return;
    }
    if ( name == "overlay-side" || name == "overlaySide" ) {
      this.overlaySide = value.trim();
      return;
    }
    if ( name == "overlay-align" || name == "overlayAlign" ) {
      this.overlayAlign = value.trim();
      return;
    }
    if ( name == "position-area" || name == "positionArea" ) {
      const pa = value.trim();
      const paSide = EVGElement.areaSide(pa);
      if ( paSide.length == 0 ) {
        EVGReject.note("unsupported value", "position-area", pa);
        return;
      }
      this.overlaySide = paSide;
      this.overlayAlign = EVGElement.areaAlign(pa);
      return;
    }
    if ( name == "position-anchor" || name == "positionAnchor" ) {
      this.positionAnchor = value.trim();
      if ( this.positionAnchor.length > 0 ) {
        this.isOverlay = true;
      }
      return;
    }
    if ( (name == "position-try-fallbacks" || name == "positionTryFallbacks") || name == "position-try" ) {
      this.positionTryFallbacks = value.trim();
      return;
    }
    if ( name == "position-try-order" || name == "positionTryOrder" ) {
      this.positionTryOrder = value.trim();
      return;
    }
    if ( name == "presentation" ) {
      const pr = value.trim();
      if ( ((pr == "anchored" || pr == "sheet") || pr == "fullscreen") == false ) {
        EVGReject.note("unsupported value", "presentation", pr);
        return;
      }
      this.presentation = pr;
      return;
    }
    if ( name == "sheet-below" || name == "sheetBelow" ) {
      const sb = this.unitOf(name, value);
      if ( sb.isSet ) {
        this.sheetBelow = sb.pixels;
      }
      return;
    }
    if ( name == "fit-viewport" || name == "fitViewport" ) {
      this.fitViewport = EVGElement.truthy(value);
      return;
    }
    if ( name == "overlay-gap" || name == "overlayGap" ) {
      const g = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(g) != "undefined" ) {
        this.overlayGap = g;
      }
      return;
    }
    if ( name == "transition" ) {
      this.transitionSpec = value.trim();
      return;
    }
    if ( name == "role" || name == "a11yRole" ) {
      this.role = value.trim();
      return;
    }
    if ( name == "a11yRequired" || name == "aria-required" ) {
      this.a11yRequired = value;
      return;
    }
    if ( name == "a11yInvalid" || name == "aria-invalid" ) {
      this.a11yInvalid = value;
      return;
    }
    if ( name == "a11yReadOnly" || name == "aria-readonly" ) {
      this.a11yReadOnly = value;
      return;
    }
    if ( name == "a11yValue" || name == "aria-valuetext" ) {
      this.a11yValue = value;
      return;
    }
    if ( name == "aria-label" || name == "a11yLabel" ) {
      this.a11yLabel = value;
      return;
    }
    if ( name == "aria-current" || name == "a11yCurrent" ) {
      this.a11yCurrent = value;
      return;
    }
    if ( name == "aria-orientation" || name == "a11yOrientation" ) {
      this.a11yOrientation = value.toLowerCase();
      return;
    }
    if ( name == "aria-sort" || name == "a11ySorted" ) {
      if ( value == "none" ) {
        this.a11ySorted = 1;
      }
      if ( value == "ascending" ) {
        this.a11ySorted = 2;
      }
      if ( value == "descending" ) {
        this.a11ySorted = 3;
      }
      return;
    }
    if ( name == "aria-hidden" || name == "a11yHidden" ) {
      this.a11yHidden = EVGElement.truthy(value);
      return;
    }
    if ( name == "aria-rowcount" || name == "a11yRowCount" ) {
      const rc = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      this.a11yRowCount = 0;
      if ( typeof(rc) != "undefined" ) {
        this.a11yRowCount = rc;
      }
      return;
    }
    if ( name == "aria-rowindex" || name == "a11yRowIndex" ) {
      const ri = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      this.a11yRowIndex = 0;
      if ( typeof(ri) != "undefined" ) {
        this.a11yRowIndex = ri;
      }
      return;
    }
    if ( name == "aria-haspopup" || name == "a11yHasPopup" ) {
      this.a11yHasPopup = value;
      return;
    }
    if ( name == "aria-describedby" || name == "a11yDescription" ) {
      this.a11yDescription = value;
      return;
    }
    if ( name == "aria-roledescription" || name == "a11yRoleDescription" ) {
      this.a11yRoleDescription = value;
      return;
    }
    if ( name == "aria-pressed" || name == "a11yPressed" ) {
      this.a11yPressed = EVGElement.triState(value);
      return;
    }
    if ( name == "aria-checked" || name == "a11yChecked" ) {
      this.a11yChecked = EVGElement.triState(value);
      return;
    }
    if ( name == "aria-expanded" || name == "a11yExpanded" ) {
      this.a11yExpanded = EVGElement.triState(value);
      return;
    }
    if ( name == "aria-selected" || name == "a11ySelected" ) {
      this.a11ySelected = EVGElement.triState(value);
      return;
    }
    if ( name == "aria-disabled" || name == "a11yDisabled" ) {
      this.a11yDisabled = EVGElement.truthy(value);
      return;
    }
    if ( name == "aria-focusable" || name == "a11yFocusable" ) {
      this.a11yFocusable = EVGElement.truthy(value);
      return;
    }
    if ( name == "left" ) {
      if ( EVGElement.mentionsAnchor(value) ) {
        this.anchorLeftSide = EVGElement.anchorFnSide(name, value);
        this.anchorLeftOffset = EVGElement.anchorFnOffset(value);
        return;
      }
      this.left = this.unitOf(name, value);
      return;
    }
    if ( name == "top" ) {
      if ( EVGElement.mentionsAnchor(value) ) {
        this.anchorTopSide = EVGElement.anchorFnSide(name, value);
        this.anchorTopOffset = EVGElement.anchorFnOffset(value);
        return;
      }
      this.top = this.unitOf(name, value);
      return;
    }
    if ( name == "right" ) {
      if ( EVGElement.mentionsAnchor(value) ) {
        this.anchorRightSide = EVGElement.anchorFnSide(name, value);
        this.anchorRightOffset = EVGElement.anchorFnOffset(value);
        return;
      }
      this.right = this.unitOf(name, value);
      return;
    }
    if ( name == "bottom" ) {
      if ( EVGElement.mentionsAnchor(value) ) {
        this.anchorBottomSide = EVGElement.anchorFnSide(name, value);
        this.anchorBottomOffset = EVGElement.anchorFnOffset(value);
        return;
      }
      this.bottom = this.unitOf(name, value);
      return;
    }
    if ( name == "x" ) {
      this.x = this.unitOf(name, value);
      return;
    }
    if ( name == "y" ) {
      this.y = this.unitOf(name, value);
      return;
    }
    if ( name == "margin" ) {
      const ms = EVGElement.boxSides(value, true);
      if ( ms.length == 4 ) {
        this.box.setMarginValues(ms[0], ms[1], ms[2], ms[3]);
      }
      return;
    }
    if ( name == "margin-left" || name == "marginLeft" ) {
      this.box.marginLeft = this.unitOf(name, value);
      return;
    }
    if ( name == "margin-right" || name == "marginRight" ) {
      this.box.marginRight = this.unitOf(name, value);
      return;
    }
    if ( name == "margin-top" || name == "marginTop" ) {
      this.box.marginTop = this.unitOf(name, value);
      return;
    }
    if ( name == "margin-bottom" || name == "marginBottom" ) {
      this.box.marginBottom = this.unitOf(name, value);
      return;
    }
    if ( name == "padding" ) {
      const ps = EVGElement.boxSides(value, false);
      if ( ps.length == 4 ) {
        this.box.setPaddingValues(ps[0], ps[1], ps[2], ps[3]);
      }
      return;
    }
    if ( name == "padding-left" || name == "paddingLeft" ) {
      this.box.paddingLeft = this.unitOf(name, value);
      return;
    }
    if ( name == "padding-right" || name == "paddingRight" ) {
      this.box.paddingRight = this.unitOf(name, value);
      return;
    }
    if ( name == "padding-top" || name == "paddingTop" ) {
      this.box.paddingTop = this.unitOf(name, value);
      return;
    }
    if ( name == "padding-bottom" || name == "paddingBottom" ) {
      this.box.paddingBottom = this.unitOf(name, value);
      return;
    }
    if ( name == "border" ) {
      const parts = EVGElement.splitWords(value);
      let i = 0;
      while (i < parts.length) {
        const tok = parts[i];
        if ( EVGElement.isBorderStyleWord(tok) ) {
          if ( tok == "none" ) {
            this.box.borderWidth = EVGUnit.px(0.0);
          }
        } else {
          if ( EVGElement.looksLikeColor(tok) ) {
            this.box.borderColor = EVGColor.parse(tok);
          } else {
            this.box.borderWidth = EVGUnit.parse(tok);
          }
        }
        i = i + 1;
      };
      return;
    }
    if ( name == "border-width" || name == "borderWidth" ) {
      this.box.borderWidth = this.unitOf(name, value);
      return;
    }
    if ( name == "border-color" || name == "borderColor" ) {
      this.box.borderColor = EVGColor.parse(value);
      return;
    }
    if ( name == "border-radius" || name == "borderRadius" ) {
      const parts_1 = EVGElement.splitWords(value);
      const n = parts_1.length;
      if ( n < 2 ) {
        this.box.borderRadius = this.unitOf(name, value);
        this.box.borderRadiusTL = EVGUnit.unset();
        this.box.borderRadiusTR = EVGUnit.unset();
        this.box.borderRadiusBR = EVGUnit.unset();
        this.box.borderRadiusBL = EVGUnit.unset();
        return;
      }
      const tl = parts_1[0];
      const tr = parts_1[1];
      let br = tl;
      let bl = tr;
      if ( n > 2 ) {
        br = parts_1[2];
      }
      if ( n > 3 ) {
        bl = parts_1[3];
      }
      this.box.borderRadiusTL = EVGUnit.parse(tl);
      this.box.borderRadiusTR = EVGUnit.parse(tr);
      this.box.borderRadiusBR = EVGUnit.parse(br);
      this.box.borderRadiusBL = EVGUnit.parse(bl);
      this.box.borderRadius = EVGUnit.parse(tl);
      return;
    }
    if ( name == "glow" ) {
      const gv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.glowIntensity = gv;
      return;
    }
    if ( name == "background-image" || name == "backgroundImage" ) {
      this.bgImageSet = true;
      this.bgImagePath = value;
      return;
    }
    if ( name == "gradient-from" || name == "gradientFrom" ) {
      this.gradientFrom = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( name == "gradient-to" || name == "gradientTo" ) {
      this.gradientTo = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( name == "gradient-dir" || name == "gradientDir" ) {
      const dv = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      this.gradientDir = dv;
      return;
    }
    if ( name == "background-color" || name == "backgroundColor" ) {
      this.backgroundColor = EVGColor.parse(value);
      return;
    }
    if ( name == "background-gradient" || name == "backgroundGradient" ) {
      this.backgroundGradient = value;
      this.gradient = EVGGradient.parse(value);
      return;
    }
    if ( name == "background" ) {
      if ( value.includes("linear-gradient") || value.includes("radial-gradient") ) {
        this.backgroundGradient = value;
        this.gradient = EVGGradient.parse(value);
      } else {
        this.backgroundColor = EVGColor.parse(value);
      }
      return;
    }
    if ( name == "color" ) {
      this.color = EVGColor.parse(value);
      return;
    }
    if ( name == "emoji-color" ) {
      this.emojiColor = EVGColor.parse(value);
      return;
    }
    if ( name == "opacity" ) {
      const val = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.opacity = val;
      return;
    }
    if ( name == "backdrop-filter" || name == "backdropFilter" ) {
      this.backdropBlur = EVGElement.blurRadiusOf(value);
      return;
    }
    if ( name == "object-fit" || name == "objectFit" ) {
      this.objectFit = value;
      return;
    }
    if ( name == "preserve-aspect-ratio" || name == "preserveAspectRatio" ) {
      this.preserveAspectRatio = value;
      return;
    }
    if ( name == "image-view-box" || name == "imageViewBox" ) {
      this.imageViewBox = value;
      this.imageViewBoxSet = EVGElement.parseViewBox(value, this);
      return;
    }
    if ( name == "image-offset-x" || name == "imageOffsetX" ) {
      this.imageOffsetX = this.unitOf(name, value);
      return;
    }
    if ( name == "image-offset-y" || name == "imageOffsetY" ) {
      this.imageOffsetY = this.unitOf(name, value);
      return;
    }
    if ( name == "direction" ) {
      if ( value == "rtl" || value == "ltr" ) {
        this.textDir = value;
        return;
      }
      this.direction = value;
      return;
    }
    if ( name == "align" ) {
      this.align = value;
      return;
    }
    if ( name == "vertical-align" || name == "verticalAlign" ) {
      this.verticalAlign = value;
      return;
    }
    if ( name == "inline" ) {
      this.isInline = value == "true";
      return;
    }
    if ( name == "line-break" || name == "lineBreak" ) {
      this.lineBreak = value == "true";
      return;
    }
    if ( name == "letter-spacing" || name == "letterSpacing" ) {
      if ( value == "normal" ) {
        this.letterSpacing = 0.0;
        return;
      }
      const lsu = this.unitOf(name, value);
      if ( lsu.isSet ) {
        this.letterSpacing = lsu.pixels;
      }
      return;
    }
    if ( name == "paragraph-spacing" || name == "paragraphSpacing" ) {
      const psu = this.unitOf(name, value);
      if ( psu.isSet ) {
        this.paragraphSpacing = psu.pixels;
      }
      return;
    }
    if ( name == "stroke-linecap" || name == "strokeLinecap" ) {
      this.strokeLineCap = value;
      return;
    }
    if ( name == "stroke-linejoin" || name == "strokeLinejoin" ) {
      this.strokeLineJoin = value;
      return;
    }
    if ( name == "overflow" ) {
      this.overflow = value;
      return;
    }
    if ( (name == "overflow-y" || name == "overflowY") || name == "overflow-x" ) {
      this.overflow = value.trim();
      return;
    }
    if ( name == "overflowX" ) {
      this.overflow = value.trim();
      return;
    }
    if ( name == "cursor" ) {
      this.cursor = value;
      return;
    }
    if ( name == "scrollbar-width" || name == "scrollbarWidth" ) {
      this.scrollbarWidth = value;
      return;
    }
    if ( name == "scrollbar-color" || name == "scrollbarColor" ) {
      this.setScrollbarColor(value);
      return;
    }
    if ( name == "evg-scrollbar-label" ) {
      this.scrollbarLabel = value;
      return;
    }
    if ( name == "evg-surface-effect" ) {
      this.surfaceEffect = value;
      return;
    }
    if ( name == "evg-effect-on" ) {
      this.effectTrigger = value;
      return;
    }
    if ( name.length > 7 ) {
      const head = name.substring(0, 7 );
      if ( head == "evg-fx-" ) {
        const key_1 = name.substring(7, name.length );
        this.setFx(key_1, EVGElement.numberOr(value, 0.0));
        return;
      }
    }
    if ( name == "evg-ripple-speed" ) {
      this.rippleSpeed = EVGElement.numberOr(value, this.rippleSpeed);
      return;
    }
    if ( name == "evg-ripple-width" ) {
      this.rippleWidth = EVGElement.numberOr(value, this.rippleWidth);
      return;
    }
    if ( name == "evg-ripple-strength" ) {
      this.rippleStrength = EVGElement.numberOr(value, this.rippleStrength);
      return;
    }
    if ( name == "evg-ripple-decay" ) {
      this.rippleDecay = EVGElement.numberOr(value, this.rippleDecay);
      return;
    }
    if ( name == "evg-ripple-highlight" ) {
      this.rippleHighlight = EVGElement.numberOr(value, this.rippleHighlight);
      return;
    }
    if ( name == "evg-ripple-rings" ) {
      this.rippleRings = EVGElement.numberOr(value, this.rippleRings);
      return;
    }
    if ( name == "evg-ripple-stagger" ) {
      this.rippleStagger = EVGElement.numberOr(value, this.rippleStagger);
      return;
    }
    if ( name == "evg-ripple-ring-falloff" ) {
      this.rippleFalloff = EVGElement.numberOr(value, this.rippleFalloff);
      return;
    }
    if ( name == "evg-ripple-shine" ) {
      this.rippleShine = EVGElement.numberOr(value, this.rippleShine);
      return;
    }
    if ( name == "evg-ripple-gloss" ) {
      this.rippleGloss = EVGElement.numberOr(value, this.rippleGloss);
      return;
    }
    if ( name == "evg-ripple-bump" ) {
      this.rippleBump = EVGElement.numberOr(value, this.rippleBump);
      return;
    }
    if ( name == "evg-ripple-light" ) {
      const lp = EVGElement.splitWords(value);
      if ( lp.length > 0 ) {
        this.rippleLightX = EVGElement.numberOr(lp[0], this.rippleLightX);
      }
      if ( lp.length > 1 ) {
        this.rippleLightY = EVGElement.numberOr(lp[1], this.rippleLightY);
      }
      if ( lp.length > 2 ) {
        this.rippleLightZ = EVGElement.numberOr(lp[2], this.rippleLightZ);
      }
      return;
    }
    if ( name == "scroll-top" || name == "scrollTop" ) {
      const st = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.scrollTop = st;
      return;
    }
    if ( name == "scroll-left" || name == "scrollLeft" ) {
      const sl = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.scrollLeft = sl;
      return;
    }
    if ( name == "display" ) {
      this.display = value;
      return;
    }
    if ( name == "flex-direction" || name == "flexDirection" ) {
      this.flexDirection = value;
      if ( value == "row-reverse" || value == "column-reverse" ) {
        EVGReject.note("unsupported value", name, value);
      }
      return;
    }
    if ( name == "flex-wrap" || name == "flexWrap" ) {
      this.flexWrap = value;
      return;
    }
    if ( name == "position" ) {
      const pv = value.trim();
      if ( pv == "fixed" ) {
        this.position = "fixed";
        return;
      }
      if ( pv == "absolute" ) {
        this.position = "absolute";
        return;
      }
      if ( (pv == "static" || pv == "relative") || pv == "sticky" ) {
        this.position = "relative";
        return;
      }
      return;
    }
    if ( name == "flex-grow" || name == "flexGrow" ) {
      const gv_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(gv_1) != "undefined" ) {
        this.flex = gv_1;
      }
      return;
    }
    if ( name == "flex-shrink" || name == "flexShrink" ) {
      const sv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(sv) != "undefined" ) {
        this.flexShrink = sv;
      }
      return;
    }
    if ( name == "flex-basis" || name == "flexBasis" ) {
      this.flexBasis = this.unitOf(name, value);
      return;
    }
    if ( name == "flex" ) {
      this.setFlexShorthand(value);
      return;
    }
    if ( name == "gap" ) {
      this.gap = this.unitOf(name, value);
      return;
    }
    if ( name == "row-gap" || name == "rowGap" ) {
      this.rowGap = this.unitOf(name, value);
      return;
    }
    if ( name == "column-gap" || name == "columnGap" ) {
      this.columnGap = this.unitOf(name, value);
      return;
    }
    if ( name == "grid-template-columns" || name == "gridTemplateColumns" ) {
      this.gridTemplateColumns = value;
      return;
    }
    if ( name == "grid-template-rows" || name == "gridTemplateRows" ) {
      this.gridTemplateRows = value;
      return;
    }
    if ( name == "grid-template-areas" || name == "gridTemplateAreas" ) {
      this.gridTemplateAreas = value;
      return;
    }
    if ( name == "grid-auto-flow" || name == "gridAutoFlow" ) {
      this.gridAutoFlow = value;
      return;
    }
    if ( name == "full-bleed" || name == "fullBleed" ) {
      this.fullBleed = value == "true" || value == "1";
      return;
    }
    if ( name == "grid-area" || name == "gridArea" ) {
      this.gridArea = value;
      return;
    }
    if ( name == "grid-column" || name == "gridColumn" ) {
      this.gridColumn = value;
      return;
    }
    if ( name == "grid-row" || name == "gridRow" ) {
      this.gridRow = value;
      return;
    }
    if ( name == "justify-content" || name == "justifyContent" ) {
      this.justifyContent = value;
      return;
    }
    if ( name == "align-content" || name == "alignContent" ) {
      this.alignContent = value;
      return;
    }
    if ( name == "align-self" || name == "alignSelf" ) {
      if ( value == "auto" ) {
        this.alignSelf = "";
      } else {
        this.alignSelf = value;
      }
      return;
    }
    if ( name == "align-items" || name == "alignItems" ) {
      this.alignItems = value;
      return;
    }
    if ( name == "font-size" || name == "fontSize" ) {
      this.fontSize = this.unitOf(name, value);
      this.fontSizeInherited = false;
      return;
    }
    if ( name == "font-family" || name == "fontFamily" ) {
      this.fontFamily = value;
      return;
    }
    if ( name == "font-weight" || name == "fontWeight" ) {
      this.fontWeight = value;
      return;
    }
    if ( name == "text-align" || name == "textAlign" ) {
      this.textAlign = value;
      return;
    }
    if ( name == "white-space" || name == "whiteSpace" ) {
      this.whiteSpace = value.trim();
      return;
    }
    if ( name == "line-height" || name == "lineHeight" ) {
      const t = value.trim();
      if ( t == "normal" ) {
        this.lineHeight = 0.0;
        this.lineHeightUnit = EVGUnit.unset();
        return;
      }
      if ( EVGUnit.isNumeric(t) ) {
        const val_1 = isNaN( parseFloat(t) ) ? undefined : parseFloat(t);
        if ( typeof(val_1) != "undefined" ) {
          this.lineHeight = val_1;
          this.lineHeightUnit = EVGUnit.unset();
        }
        return;
      }
      const u = EVGUnit.parse(t);
      if ( u.isSet ) {
        this.lineHeightUnit = u;
        this.lineHeight = 0.0;
      }
      return;
    }
    if ( name == "transform" ) {
      this.applyTransform(value);
      return;
    }
    if ( name == "transform-origin" || name == "transformOrigin" ) {
      this.applyTransformOrigin(value);
      return;
    }
    if ( name == "translate-x" || name == "translateX" ) {
      const tvx = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(tvx) != "undefined" ) {
        this.translateX = tvx;
      }
      return;
    }
    if ( name == "translate-y" || name == "translateY" ) {
      const tvy = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(tvy) != "undefined" ) {
        this.translateY = tvy;
      }
      return;
    }
    if ( name == "rotate" ) {
      const val_2 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.rotate = val_2;
      return;
    }
    if ( name == "scale" ) {
      const val_3 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.scale = val_3;
      return;
    }
    if ( name == "shadow-radius" || name == "shadowRadius" ) {
      this.shadowRadius = this.unitOf(name, value);
      return;
    }
    if ( name == "shadow-color" || name == "shadowColor" ) {
      this.shadowColor = EVGColor.parse(value);
      return;
    }
    if ( name == "shadow-offset-x" || name == "shadowOffsetX" ) {
      this.shadowOffsetX = this.unitOf(name, value);
      return;
    }
    if ( name == "shadow-offset-y" || name == "shadowOffsetY" ) {
      this.shadowOffsetY = this.unitOf(name, value);
      return;
    }
    if ( name == "clip-path" || name == "clipPath" ) {
      this.clipPath = value;
      return;
    }
    if ( (name == "d" || name == "svgPath") || name == "path" ) {
      this.svgPath = value;
      return;
    }
    if ( name == "imageQuality" ) {
      const val_4 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_4) != "undefined" ) {
        this.imageQuality = val_4;
      }
      return;
    }
    if ( name == "maxImageSize" ) {
      const val_5 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_5) != "undefined" ) {
        this.maxImageSize = val_5;
      }
      return;
    }
    if ( name == "anchor-name" || name == "anchorName" ) {
      this.anchorName = value.trim();
      return;
    }
    if ( name == "from" ) {
      this.connectorFrom = value.trim();
      return;
    }
    if ( name == "to" ) {
      this.connectorTo = value.trim();
      return;
    }
    if ( name == "from-side" || name == "fromSide" ) {
      this.connectorFromSide = value.trim();
      return;
    }
    if ( name == "to-side" || name == "toSide" ) {
      this.connectorToSide = value.trim();
      return;
    }
    if ( name == "routing" ) {
      this.connectorRouting = value.trim();
      return;
    }
    if ( name == "from-offset" || name == "fromOffset" ) {
      const fou = this.unitOf(name, value);
      if ( fou.isSet ) {
        this.connectorFromOffset = fou.pixels;
      }
      return;
    }
    if ( name == "to-offset" || name == "toOffset" ) {
      const tou = this.unitOf(name, value);
      if ( tou.isSet ) {
        this.connectorToOffset = tou.pixels;
      }
      return;
    }
    if ( name == "arrow-start" || name == "arrowStart" ) {
      this.arrowStart = value.trim();
      return;
    }
    if ( name == "arrow-end" || name == "arrowEnd" ) {
      this.arrowEnd = value.trim();
      return;
    }
    if ( name == "arrow-size" || name == "arrowSize" ) {
      const asu = this.unitOf(name, value);
      if ( asu.isSet ) {
        this.arrowSize = asu.pixels;
      }
      return;
    }
    if ( name == "d" || name == "svgPath" ) {
      this.svgPath = value;
      return;
    }
    if ( name == "svg" || name == "svgSource" ) {
      this.svgSource = value;
      return;
    }
    if ( name == "viewBox" || name == "view-box" ) {
      this.viewBox = value;
      return;
    }
    if ( name == "fill" ) {
      this.fillColor = EVGColor.parse(value);
      return;
    }
    if ( name == "stroke" ) {
      this.strokeColor = EVGColor.parse(value);
      return;
    }
    if ( name == "stroke-width" || name == "strokeWidth" ) {
      const val_6 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_6) != "undefined" ) {
        this.strokeWidth = val_6;
      }
      return;
    }
    if ( name == "stroke-dasharray" || name == "strokeDasharray" ) {
      this.strokeDashArray = value;
      return;
    }
    if ( name == "stroke-dashoffset" || name == "strokeDashoffset" ) {
      const dv_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(dv_1) != "undefined" ) {
        this.strokeDashOffset = dv_1;
      }
      return;
    }
    if ( name == "fill-rule" || name == "fillRule" ) {
      if ( value == "evenodd" ) {
        this.fillRule = "evenodd";
      } else {
        this.fillRule = "nonzero";
      }
      return;
    }
    if ( EVGElement.isHostProp(name) == false ) {
      EVGReject.note("unknown property", name, value);
    }
  };
  getCalculatedBounds () {
    return (((((("(" + (this.calculatedX.toString())) + ", ") + (this.calculatedY.toString())) + ") ") + (this.calculatedWidth.toString())) + "x") + (this.calculatedHeight.toString());
  };
  toString () {
    return ((((("<" + this.tagName) + " id=\"") + this.id) + "\" ") + this.getCalculatedBounds()) + ">";
  };
}
EVGElement.createDiv = function() {
  const el = new EVGElement();
  el.tagName = "div";
  el.elementType = 0;
  return el;
};
EVGElement.createSpan = function() {
  const el = new EVGElement();
  el.tagName = "span";
  el.elementType = 1;
  return el;
};
EVGElement.createImg = function() {
  const el = new EVGElement();
  el.tagName = "img";
  el.elementType = 2;
  return el;
};
EVGElement.createPath = function() {
  const el = new EVGElement();
  el.tagName = "path";
  el.elementType = 3;
  return el;
};
EVGElement.truthy = function(value) {
  const v = value.trim();
  if ( v == "true" ) {
    return true;
  }
  if ( v == "1" ) {
    return true;
  }
  if ( v == "yes" ) {
    return true;
  }
  return false;
};
EVGElement.triState = function(value) {
  const v = value.trim();
  if ( v == "true" ) {
    return 2;
  }
  if ( v == "false" ) {
    return 1;
  }
  if ( v == "mixed" ) {
    return 3;
  }
  return 0;
};
EVGElement.areaSide = function(area) {
  const first = EVGElement.areaWord(area, 0);
  if ( (first == "top" || first == "bottom") || first == "left" ) {
    return first;
  }
  if ( (first == "right" || first == "center") || first == "cover" ) {
    return first;
  }
  if ( first == "free" ) {
    return first;
  }
  return "";
};
EVGElement.areaAlign = function(area) {
  const side = EVGElement.areaWord(area, 0);
  const word = EVGElement.areaWord(area, 1);
  if ( word.length == 0 ) {
    return "start";
  }
  if ( (word == "start" || word == "center") || word == "end" ) {
    return word;
  }
  if ( side == "top" || side == "bottom" ) {
    if ( word == "left" ) {
      return "start";
    }
    if ( word == "right" ) {
      return "end";
    }
  }
  if ( side == "left" || side == "right" ) {
    if ( word == "top" ) {
      return "start";
    }
    if ( word == "bottom" ) {
      return "end";
    }
  }
  return "start";
};
EVGElement.areaWord = function(area, index) {
  let out = "";
  let seen = 0;
  let cur = "";
  let i = 0;
  const n = area.length;
  while (i <= n) {
    let isBreak = i == n;
    if ( isBreak == false ) {
      const c = area.charCodeAt(i );
      if ( (c == 32 || c == 9) || c == 10 ) {
        isBreak = true;
      }
    }
    if ( isBreak ) {
      if ( cur.length > 0 ) {
        if ( seen == index ) {
          out = cur;
          return out;
        }
        seen = seen + 1;
        cur = "";
      }
    } else {
      cur = cur + area.substring(i, i + 1 );
    }
    i = i + 1;
  };
  return out;
};
EVGElement.mentionsAnchor = function(value) {
  return value.indexOf("anchor(") >= 0;
};
EVGElement.anchorFnSide = function(prop, value) {
  const open = value.indexOf("anchor(");
  const rest = value.substring(open + 7, value.length );
  const close = rest.indexOf(")");
  if ( close < 0 ) {
    EVGReject.note("unsupported value", prop, value);
    return "";
  }
  const side = rest.substring(0, close ).trim();
  const vertical = prop == "top" || prop == "bottom";
  if ( side == "center" ) {
    return "center";
  }
  if ( vertical ) {
    if ( side == "top" || side == "bottom" ) {
      return side;
    }
  } else {
    if ( side == "left" || side == "right" ) {
      return side;
    }
  }
  EVGReject.note("unsupported value", prop, value);
  return "";
};
EVGElement.anchorFnOffset = function(value) {
  const open = value.indexOf("anchor(");
  const rest = value.substring(open + 7, value.length );
  const close = rest.indexOf(")");
  if ( close < 0 ) {
    return 0.0;
  }
  const tail = rest.substring(close + 1, rest.length ).trim();
  if ( tail.length == 0 ) {
    return 0.0;
  }
  let sign = 1.0;
  const first = tail.substring(0, 1 );
  if ( first == "-" ) {
    sign = 0.0 - 1.0;
  } else {
    if ( (first == "+") == false ) {
      return 0.0;
    }
  }
  const num = tail.substring(1, tail.length ).trim();
  let digits = "";
  let i = 0;
  while (i < num.length) {
    const ch = num.charCodeAt(i );
    const ok = ch >= 48 && ch <= 57 || ch == 46;
    if ( ok ) {
      digits = digits + num.substring(i, i + 1 );
    } else {
      i = num.length;
    }
    i = i + 1;
  };
  const v = isNaN( parseFloat(digits.trim()) ) ? undefined : parseFloat(digits.trim());
  if ( typeof(v) != "undefined" ) {
    return sign * v;
  }
  return 0.0;
};
EVGElement.toKebab = function(name) {
  let out = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const c = name.charCodeAt(i );
    if ( c >= 65 && c <= 90 ) {
      if ( i > 0 ) {
        out = out + "-";
      }
      out = out + String.fromCharCode(c + 32);
    } else {
      out = out + String.fromCharCode(c);
    }
    i = i + 1;
  };
  return out;
};
EVGElement.isXKeyword = function(w) {
  return w == "left" || w == "right";
};
EVGElement.isYKeyword = function(w) {
  return w == "top" || w == "bottom";
};
EVGElement.originUnit = function(w) {
  if ( w == "left" || w == "top" ) {
    return EVGUnit.percent(0.0);
  }
  if ( w == "right" || w == "bottom" ) {
    return EVGUnit.percent(100.0);
  }
  if ( w == "center" ) {
    return EVGUnit.percent(50.0);
  }
  return EVGUnit.parse(w);
};
EVGElement.resolveOrigin = function(u, size) {
  if ( u.isSet == false ) {
    return size / 2.0;
  }
  if ( u.unitType == 1 || u.unitType == 3 ) {
    return (u.value / 100.0) * size;
  }
  return u.value;
};
EVGElement.transformProblem = function(value) {
  const v = value.trim();
  if ( v == "none" || v.length == 0 ) {
    return "";
  }
  const parts = EVGElement.splitWords(v);
  let i = 0;
  while (i < parts.length) {
    const one = parts[i].trim();
    let known = false;
    if ( EVGElement.callArgs(one, "rotate").length > 0 ) {
      known = true;
    }
    if ( EVGElement.callArgs(one, "scale").length > 0 ) {
      known = true;
    }
    if ( EVGElement.callArgs(one, "translate").length > 0 ) {
      known = true;
    }
    if ( EVGElement.callArgs(one, "translateX").length > 0 ) {
      known = true;
    }
    if ( EVGElement.callArgs(one, "translateY").length > 0 ) {
      known = true;
    }
    if ( known == false ) {
      return "Unsupported transform (rotate, scale, translate, translateX, translateY): " + one;
    }
    const sargs = EVGElement.callArgs(one, "scale");
    if ( sargs.length > 0 ) {
      const nums = EVGElement.numberList(sargs);
      if ( nums.length > 1 ) {
        if ( Math.abs(Math.abs(nums[0]) - Math.abs(nums[1])) > 0.0001 ) {
          return "Only a uniform scale is supported: " + one;
        }
      }
    }
    i = i + 1;
  };
  return "";
};
EVGElement.callArgs = function(one, name) {
  const nl2 = name.length;
  const tl = one.length;
  if ( tl < nl2 + 3 ) {
    return "";
  }
  if ( one.substring(0, nl2 ) != name ) {
    return "";
  }
  if ( one.charCodeAt(nl2 ) != 40 ) {
    return "";
  }
  if ( one.charCodeAt(tl - 1 ) != 41 ) {
    return "";
  }
  const inner = one.substring(nl2 + 1, tl - 1 );
  if ( inner.length == 0 ) {
    return "";
  }
  return inner;
};
EVGElement.numberList = function(s) {
  let out = [];
  const parts = EVGElement.splitOnChar(s, 44);
  let i = 0;
  while (i < parts.length) {
    out.push(EVGElement.leadingNumber(parts[i]));
    i = i + 1;
  };
  return out;
};
EVGElement.splitOnChar = function(s, ch) {
  let out = [];
  let start = 0;
  let i = 0;
  const n = s.length;
  while (i < n) {
    if ( s.charCodeAt(i ) == ch ) {
      out.push(s.substring(start, i ));
      start = i + 1;
    }
    i = i + 1;
  };
  out.push(s.substring(start, n ));
  return out;
};
EVGElement.leadingNumber = function(s) {
  const t = s.trim();
  const n = t.length;
  let stop = 0;
  let scanning = true;
  while (scanning && stop < n) {
    const c = t.charCodeAt(stop );
    const digit = c >= 48 && c <= 57;
    const signOrDot = (c == 45 || c == 43) || c == 46;
    if ( digit || signOrDot ) {
      stop = stop + 1;
    } else {
      scanning = false;
    }
  };
  if ( stop == 0 ) {
    return 0.0;
  }
  const v = isNaN( parseFloat(t.substring(0, stop )) ) ? undefined : parseFloat(t.substring(0, stop ));
  if ( typeof(v) != "undefined" ) {
    return v;
  }
  return 0.0;
};
EVGElement.parseAngleDeg = function(text) {
  const t = text.trim();
  const v = EVGElement.leadingNumber(t);
  const n = t.length;
  if ( n > 4 ) {
    const four = t.substring(n - 4, n );
    if ( four == "turn" ) {
      return v * 360.0;
    }
    if ( four == "grad" ) {
      return (v * 360.0) / 400.0;
    }
  }
  if ( n > 3 ) {
    const three = t.substring(n - 3, n );
    if ( three == "rad" ) {
      return (v * 180.0) / 3.14159265358979;
    }
    if ( three == "deg" ) {
      return v;
    }
  }
  return v;
};
EVGElement.boxSides = function(value, isMargin) {
  let out = [];
  const words = EVGElement.splitWords(value);
  const n = words.length;
  if ( n < 1 ) {
    return out;
  }
  if ( n > 4 ) {
    return out;
  }
  let parts = [];
  let i = 0;
  while (i < n) {
    const w = words[i];
    const u = EVGUnit.parse(w);
    if ( u.isSet == false ) {
      if ( isMargin == false ) {
        return out;
      }
      if ( w != "auto" ) {
        return out;
      }
    } else {
      if ( u.value < 0.0 ) {
        if ( isMargin == false ) {
          return out;
        }
      }
    }
    parts.push(u);
    i = i + 1;
  };
  const top = parts[0];
  let right = top;
  let bottom = top;
  let left = top;
  if ( n > 1 ) {
    right = parts[1];
    left = right;
  }
  if ( n > 2 ) {
    bottom = parts[2];
  }
  if ( n > 3 ) {
    left = parts[3];
  }
  out.push(top);
  out.push(right);
  out.push(bottom);
  out.push(left);
  return out;
};
EVGElement.parseViewBox = function(value, el) {
  const v = value.trim();
  if ( v.length == 0 ) {
    return false;
  }
  const words = EVGElement.splitWords(v);
  if ( words.length != 4 ) {
    return false;
  }
  let got = [];
  let i = 0;
  while (i < 4) {
    const w = words[i];
    const u = EVGUnit.parse(w);
    if ( u.isSet == false ) {
      return false;
    }
    let n = u.value;
    if ( u.isPercent() ) {
      n = n / 100.0;
    }
    got.push(n);
    i = i + 1;
  };
  const cw = got[2];
  const ch = got[3];
  if ( Math.abs(cw) < 0.000001 ) {
    return false;
  }
  if ( Math.abs(ch) < 0.000001 ) {
    return false;
  }
  el.imageViewBoxX = got[0];
  el.imageViewBoxY = got[1];
  el.imageViewBoxW = cw;
  el.imageViewBoxH = ch;
  return true;
};
EVGElement.blurRadiusOf = function(value) {
  const v = value.trim();
  if ( v == "none" ) {
    return 0.0;
  }
  if ( v.length == 0 ) {
    return 0.0;
  }
  const words = EVGElement.splitWords(v);
  if ( words.length != 1 ) {
    return 0.0;
  }
  const one = words[0];
  const inner = EVGElement.callArgs(one, "blur");
  if ( inner.length == 0 ) {
    return 0.0;
  }
  const u = EVGUnit.parse(inner);
  if ( u.isSet == false ) {
    return 0.0;
  }
  if ( u.value < 0.0 ) {
    return 0.0;
  }
  if ( u.unitType != 0 ) {
    return 0.0;
  }
  return u.pixels;
};
EVGElement.blurProblem = function(value) {
  const v = value.trim();
  if ( v == "none" ) {
    return "";
  }
  if ( v.length == 0 ) {
    return "";
  }
  const words = EVGElement.splitWords(v);
  if ( words.length != 1 ) {
    return ("backdrop-filter: only a single blur() is supported, got '" + v) + "'";
  }
  const one = words[0];
  const inner = EVGElement.callArgs(one, "blur");
  if ( inner.length == 0 ) {
    return ("backdrop-filter: only blur() is supported, got '" + v) + "'";
  }
  const u = EVGUnit.parse(inner);
  if ( u.isSet == false ) {
    return ("backdrop-filter: '" + inner) + "' is not a length";
  }
  if ( u.value < 0.0 ) {
    return "backdrop-filter: a blur radius cannot be negative";
  }
  if ( u.unitType != 0 ) {
    return ("backdrop-filter: blur() needs an absolute length, got '" + inner) + "'";
  }
  return "";
};
EVGElement.splitWords = function(s) {
  let out = [];
  let cur = "";
  let depth = 0;
  let i = 0;
  const __len = s.length;
  while (i < __len) {
    const c = s.charCodeAt(i );
    if ( c == 40 ) {
      depth = depth + 1;
    }
    if ( c == 41 ) {
      depth = depth - 1;
    }
    let isSpace = false;
    if ( depth == 0 ) {
      if ( c == 32 ) {
        isSpace = true;
      }
      if ( c == 9 ) {
        isSpace = true;
      }
    }
    if ( isSpace ) {
      if ( cur.length > 0 ) {
        out.push(cur);
        cur = "";
      }
    } else {
      cur = cur + String.fromCharCode(c);
    }
    i = i + 1;
  };
  if ( cur.length > 0 ) {
    out.push(cur);
  }
  return out;
};
EVGElement.isBorderStyleWord = function(tok) {
  if ( tok == "solid" ) {
    return true;
  }
  if ( tok == "dashed" ) {
    return true;
  }
  if ( tok == "dotted" ) {
    return true;
  }
  if ( tok == "double" ) {
    return true;
  }
  if ( tok == "none" ) {
    return true;
  }
  if ( tok == "hidden" ) {
    return true;
  }
  return false;
};
EVGElement.numberOr = function(value, fallback) {
  let digits = "";
  let i = 0;
  while (i < value.length) {
    const code = value.charCodeAt(i );
    let keep = code >= 48 && code <= 57;
    if ( code == 46 ) {
      keep = true;
    }
    if ( code == 45 ) {
      keep = true;
    }
    if ( keep ) {
      digits = digits + value.substring(i, i + 1 );
    }
    i = i + 1;
  };
  if ( digits.length == 0 ) {
    return fallback;
  }
  const v = isNaN( parseFloat(digits) ) ? undefined : parseFloat(digits);
  if ( typeof(v) != "undefined" ) {
    return v;
  }
  return fallback;
};
EVGElement.looksLikeColor = function(tok) {
  if ( tok.length == 0 ) {
    return false;
  }
  const c = tok.charCodeAt(0 );
  if ( c >= 48 && c <= 57 ) {
    return false;
  }
  if ( c == 46 ) {
    return false;
  }
  return true;
};
EVGElement.isPlainNumber = function(s) {
  const __len = s.length;
  if ( __len == 0 ) {
    return false;
  }
  let digits = 0;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    const isDigit = c >= 48 && c <= 57;
    if ( isDigit ) {
      digits = digits + 1;
    } else {
      if ( (c != 46 && c != 45) && c != 43 ) {
        return false;
      }
    }
    i = i + 1;
  };
  return digits > 0;
};
EVGElement.splitSpaces = function(s) {
  let out = [];
  const __len = s.length;
  let start = 0;
  let inTok = false;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    const isSpace = (c == 32 || c == 9) || (c == 10 || c == 13);
    if ( isSpace ) {
      if ( inTok ) {
        out.push(s.substring(start, i ));
        inTok = false;
      }
    } else {
      if ( inTok == false ) {
        start = i;
        inTok = true;
      }
    }
    i = i + 1;
  };
  if ( inTok ) {
    out.push(s.substring(start, __len ));
  }
  return out;
};
EVGElement.isHostProp = function(name) {
  const n = name.length;
  if ( n == 0 ) {
    return true;
  }
  if ( n > 2 ) {
    const c0 = name.charCodeAt(0 );
    const c1 = name.charCodeAt(1 );
    const c2 = name.charCodeAt(2 );
    if ( (c0 == 111 && c1 == 110) && (c2 >= 65 && c2 <= 90) ) {
      return true;
    }
  }
  if ( n > 5 ) {
    if ( EVGElement.startsWithStr(name, "data-") ) {
      return true;
    }
  }
  if ( name == "children" ) {
    return true;
  }
  if ( name == "style" ) {
    return true;
  }
  if ( name == "ref" ) {
    return true;
  }
  if ( name == "tag" ) {
    return true;
  }
  if ( name == "tagName" ) {
    return true;
  }
  if ( name == "text" ) {
    return true;
  }
  if ( name == "textContent" ) {
    return true;
  }
  if ( name == "elementType" ) {
    return true;
  }
  if ( name == "test-id" ) {
    return true;
  }
  if ( name == "testId" ) {
    return true;
  }
  return false;
};
EVGElement.startsWithStr = function(s, prefix) {
  const n = prefix.length;
  if ( s.length < n ) {
    return false;
  }
  let i = 0;
  while (i < n) {
    if ( s.charCodeAt(i ) != prefix.charCodeAt(i ) ) {
      return false;
    }
    i = i + 1;
  };
  return true;
};
class EvgBitmapTracer  {
  constructor() {
    this.options = undefined;
    this.bitmap = undefined;
    this.rings = [];
    this.commands = [];
    this.pathData = "";
    this.width = 0;
    this.height = 0;
    this.hasColorPlanes = false;
    this.planeR = [];
    this.planeG = [];
    this.planeB = [];
    this.planeA = [];
    this.flat = [];
    this.labels = [];
    this.edgeMask = [];
    this.detailMask = [];
    this.detailOn = false;
    this.edgeMaskOn = false;
    this.okOn = false;
    this.okLin = [];
    this.okP = undefined;
    this.okQ = undefined;
    this.okC = undefined;
    this.regionOf = [];
    this.regionCount = 0;
    this.bgMask = [];
    this.bgActive = false;
    this.layers = [];
    this.options = EvgTraceOptions.defaults();
    this.bitmap = EvgBinaryBitmap.create(0, 0);
    let r = [];
    this.rings = r;
    let c_5 = [];
    this.commands = c_5;
    let pr = [];
    this.planeR = pr;
    let pg = [];
    this.planeG = pg;
    let pb = [];
    this.planeB = pb;
    let pa = [];
    this.planeA = pa;
    let fl = [];
    this.flat = fl;
    let lb = [];
    this.labels = lb;
    let bg = [];
    this.bgMask = bg;
    let ro = [];
    this.regionOf = ro;
    let em = [];
    this.edgeMask = em;
    this.edgeMaskOn = this.options.edgeMinRun >= 1;
    let ok = [];
    this.okLin = ok;
    this.okP = new EvgOklab();
    this.okQ = new EvgOklab();
    this.okC = new EvgOklab();
    let ly = [];
    this.layers = ly;
  }
  syncOptions () {
    this.edgeMaskOn = this.options.edgeMinRun >= 1;
    this.okOn = this.options.colorSpace == "oklab";
  };
  trace () {
    this.syncOptions();
    let emptyR = [];
    this.rings = emptyR;
    let emptyC = [];
    this.commands = emptyC;
    let emptyL = [];
    this.layers = emptyL;
    this.pathData = "";
    if ( this.hasColorPlanes ) {
      this.traceColorLayers();
    } else {
      this.decompose();
      this.emitCommands();
      this.pathData = this.pathDataOf(this.commands);
      const layer = new EvgTraceLayer();
      layer.fillHex = this.options.fillHex;
      layer.pathData = this.pathData;
      layer.ringCount = this.rings.length;
      layer.commandCount = this.commands.length;
      this.layers.push(layer);
    }
  };
  getCommands () {
    return this.commands;
  };
  getPathData () {
    return this.pathData;
  };
  ringCount () {
    return this.rings.length;
  };
  commandCount () {
    return this.commands.length;
  };
  backgroundRemoved () {
    return this.bgActive;
  };
  layerCount () {
    return this.layers.length;
  };
  getLayers () {
    return this.layers;
  };
  toPathBuilder () {
    const b = new PathBuilder();
    b.addCommands(this.commands);
    return b;
  };
  toEVGElement () {
    const el = EVGElement.createPath();
    el.svgPath = this.pathData;
    el.fillRule = "evenodd";
    el.viewBox = (("0 0 " + (this.width.toString())) + " ") + (this.height.toString());
    el.fillColor = EVGColor.parse(this.options.fillHex);
    if ( this.layers.length > 0 ) {
      const layer0 = this.layers[0];
      el.svgPath = layer0.pathData;
      el.fillColor = EVGColor.parse(layer0.fillHex);
    }
    el.width = EVGUnit.px(this.width);
    el.height = EVGUnit.px(this.height);
    return el;
  };
  toEVGElements () {
    let out = [];
    let i = 0;
    while (i < this.layers.length) {
      const layer = this.layers[i];
      const el = EVGElement.createPath();
      el.svgPath = layer.pathData;
      el.fillRule = "evenodd";
      el.viewBox = (("0 0 " + (this.width.toString())) + " ") + (this.height.toString());
      el.fillColor = EVGColor.parse(layer.fillHex);
      el.width = EVGUnit.px(this.width);
      el.height = EVGUnit.px(this.height);
      out.push(el);
      i = i + 1;
    };
    return out;
  };
  toSVG () {
    let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" ";
    svg = ((svg + "width=\"") + (this.width.toString())) + "\" ";
    svg = ((svg + "height=\"") + (this.height.toString())) + "\" ";
    svg = ((((svg + "viewBox=\"0 0 ") + (this.width.toString())) + " ") + (this.height.toString())) + "\">";
    if ( this.layers.length > 0 ) {
      let defs = "";
      let i = 0;
      while (i < this.layers.length) {
        const layer = this.layers[i];
        const id = "g" + (i.toString());
        if ( layer.fillKind == "linear" ) {
          defs = ((defs + "<linearGradient id=\"") + id) + "\" gradientUnits=\"userSpaceOnUse\"";
          defs = ((((defs + " x1=\"") + EvgBitmapTracer.num(layer.gx0)) + "\" y1=\"") + EvgBitmapTracer.num(layer.gy0)) + "\"";
          defs = ((((defs + " x2=\"") + EvgBitmapTracer.num(layer.gx1)) + "\" y2=\"") + EvgBitmapTracer.num(layer.gy1)) + "\">";
          defs = ((defs + "<stop offset=\"0\" stop-color=\"") + layer.stopA) + "\"/>";
          defs = ((defs + "<stop offset=\"1\" stop-color=\"") + layer.stopB) + "\"/></linearGradient>";
        }
        i = i + 1;
      };
      if ( defs.length > 0 ) {
        svg = ((svg + "<defs>") + defs) + "</defs>";
      }
      i = 0;
      while (i < this.layers.length) {
        const layer2 = this.layers[i];
        let fill = layer2.fillHex;
        if ( layer2.fillKind != "flat" ) {
          fill = ("url(#g" + (i.toString())) + ")";
        }
        svg = ((((svg + "<path fill=\"") + fill) + "\" fill-rule=\"evenodd\" d=\"") + layer2.pathData) + "\"/>";
        i = i + 1;
      };
    } else {
      svg = ((((svg + "<path fill=\"") + this.options.fillHex) + "\" fill-rule=\"evenodd\" d=\"") + this.pathData) + "\"/>";
    }
    svg = svg + "</svg>";
    return svg;
  };
  lumaWeight () {
    const lw = this.options.lumaWeight;
    if ( lw < 1 ) {
      return 1;
    }
    return lw;
  };
  pathDataOf (cmds) {
    if ( this.options.pathFormat == "plain" ) {
      return VectorShapes.asPathData(cmds);
    }
    let p = this.options.pathPrecision;
    if ( p < 0 ) {
      p = 0;
    }
    return EvgTracePath.encode(cmds, p, true);
  };
  dist2 (r0, g0, b0, r1, g1, b1) {
    if ( this.okOn == false ) {
      const lw = this.lumaWeight();
      return EvgBitmapTracer.colorDist2(r0, g0, b0, r1, g1, b1, lw);
    }
    if ( this.okLin.length == 0 ) {
      this.okLin = EvgTraceColor.buildLinearTable();
    }
    this.okP.setFrom(this.okLin, r0, g0, b0);
    this.okQ.setFrom(this.okLin, r1, g1, b1);
    const p = this.okP;
    const q = this.okQ;
    return EvgTraceColor.dist2(p, q);
  };
  dist2Limit (perChannel) {
    const d = (perChannel * perChannel);
    if ( this.okOn ) {
      return d * 6.0;
    }
    const lw = this.lumaWeight();
    const w = (3 + lw);
    return d * w;
  };
  pixelAllowed (i) {
    const a = this.planeA[i];
    if ( a < 16 ) {
      return false;
    }
    if ( this.bgActive ) {
      return this.bgMask[i] == 0;
    }
    return true;
  };
  detectBackground () {
    this.bgActive = false;
    const mode = this.options.bgMode;
    const named = mode == "color";
    if ( mode != "auto" && named == false ) {
      return;
    }
    const n = this.width * this.height;
    if ( n < 4 ) {
      return;
    }
    const bins = 32768;
    let cnt = [];
    let sr = [];
    let sg = [];
    let sb = [];
    let i = 0;
    while (i < bins) {
      cnt.push(0);
      sr.push(0);
      sg.push(0);
      sb.push(0);
      i = i + 1;
    };
    let border = [];
    let x = 0;
    while (x < this.width) {
      border.push(x);
      border.push((this.height - 1) * this.width + x);
      x = x + 1;
    };
    let y = 1;
    while (y < this.height - 1) {
      border.push(y * this.width);
      border.push(y * this.width + (this.width - 1));
      y = y + 1;
    };
    const bn = border.length;
    if ( bn == 0 ) {
      return;
    }
    let opaqueBorder = 0;
    i = 0;
    while (i < bn) {
      const idx = border[i];
      if ( this.planeA[idx] >= 16 ) {
        const r = this.planeR[idx];
        const g = this.planeG[idx];
        const b = this.planeB[idx];
        const key = (((r / 8) | 0) * 32 + ((g / 8) | 0)) * 32 + ((b / 8) | 0);
        cnt[key] = cnt[key] + 1;
        sr[key] = sr[key] + r;
        sg[key] = sg[key] + g;
        sb[key] = sb[key] + b;
        opaqueBorder = opaqueBorder + 1;
      }
      i = i + 1;
    };
    if ( opaqueBorder == 0 ) {
      return;
    }
    let topI = 0 - 1;
    let topC = 0;
    i = 0;
    while (i < bins) {
      if ( cnt[i] > topC ) {
        topC = cnt[i];
        topI = i;
      }
      i = i + 1;
    };
    if ( topI < 0 ) {
      return;
    }
    let bgR = ((sr[topI] / topC) | 0);
    let bgG = ((sg[topI] / topC) | 0);
    let bgB = ((sb[topI] / topC) | 0);
    let tol = this.options.bgTolerance;
    if ( tol < 0 ) {
      tol = 0;
    }
    if ( named ) {
      const c = EVGColor.parse(this.options.bgColor);
      if ( c.isSet == false ) {
        return;
      }
      bgR = Math.floor( c.r);
      bgG = Math.floor( c.g);
      bgB = Math.floor( c.b);
    } else {
      let within = 0;
      i = 0;
      while (i < bn) {
        const idx2 = border[i];
        if ( this.planeA[idx2] >= 16 ) {
          if ( this.nearBg(idx2, bgR, bgG, bgB, tol) ) {
            within = within + 1;
          }
        }
        i = i + 1;
      };
      if ( (((within * 100) / opaqueBorder) | 0) < 80 ) {
        this.floodBrightFromBorder(border, bn);
        return;
      }
    }
    let mask = [];
    i = 0;
    while (i < n) {
      mask.push(0);
      i = i + 1;
    };
    let stack = [];
    i = 0;
    while (i < bn) {
      const s0 = border[i];
      if ( mask[s0] == 0 ) {
        if ( this.nearBg(s0, bgR, bgG, bgB, tol) ) {
          mask[s0] = 1;
          stack.push(s0);
        }
      }
      i = i + 1;
    };
    let head = 0;
    while (head < stack.length) {
      const cur = stack[head];
      head = head + 1;
      const cy = ((cur / this.width) | 0);
      const cx = cur - cy * this.width;
      if ( cx > 0 ) {
        this.floodStep(cur - 1, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cx < this.width - 1 ) {
        this.floodStep(cur + 1, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cy > 0 ) {
        this.floodStep(cur - this.width, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cy < this.height - 1 ) {
        this.floodStep(cur + this.width, mask, stack, bgR, bgG, bgB, tol);
      }
    };
    this.bgMask = mask;
    this.bgActive = true;
  };
  floodBrightFromBorder (border, bn) {
    const lim = this.options.skipLuma;
    if ( lim > 255 ) {
      return;
    }
    const n = this.width * this.height;
    let mask = [];
    let i = 0;
    while (i < n) {
      mask.push(0);
      i = i + 1;
    };
    let stack = [];
    i = 0;
    while (i < bn) {
      const s0 = border[i];
      if ( mask[s0] == 0 ) {
        if ( this.brightEnough(s0, lim) ) {
          mask[s0] = 1;
          stack.push(s0);
        }
      }
      i = i + 1;
    };
    if ( stack.length == 0 ) {
      return;
    }
    let head = 0;
    while (head < stack.length) {
      const cur = stack[head];
      head = head + 1;
      const cy = ((cur / this.width) | 0);
      const cx = cur - cy * this.width;
      if ( cx > 0 ) {
        this.brightStep(cur - 1, mask, stack, lim);
      }
      if ( cx < this.width - 1 ) {
        this.brightStep(cur + 1, mask, stack, lim);
      }
      if ( cy > 0 ) {
        this.brightStep(cur - this.width, mask, stack, lim);
      }
      if ( cy < this.height - 1 ) {
        this.brightStep(cur + this.width, mask, stack, lim);
      }
    };
    this.bgMask = mask;
    this.bgActive = true;
  };
  brightEnough (i, lim) {
    if ( this.planeA[i] < 16 ) {
      return true;
    }
    return EvgBitmapTracer.lumaOf(
      this.planeR[i],
      this.planeG[i],
      this.planeB[i]
    ) >= lim;
  };
  brightStep (i, mask, stack, lim) {
    if ( mask[i] == 1 ) {
      return;
    }
    if ( this.brightEnough(i, lim) == false ) {
      return;
    }
    mask[i] = 1;
    stack.push(i);
  };
  nearBg (i, bgR, bgG, bgB, tol) {
    if ( this.planeA[i] < 16 ) {
      return true;
    }
    if ( EvgBitmapTracer.absI(this.planeR[i] - bgR) > tol ) {
      return false;
    }
    if ( EvgBitmapTracer.absI(this.planeG[i] - bgG) > tol ) {
      return false;
    }
    if ( EvgBitmapTracer.absI(this.planeB[i] - bgB) > tol ) {
      return false;
    }
    return true;
  };
  floodStep (i, mask, stack, bgR, bgG, bgB, tol) {
    if ( mask[i] != 0 ) {
      return;
    }
    if ( this.nearBg(i, bgR, bgG, bgB, tol) ) {
      mask[i] = 1;
      stack.push(i);
    }
  };
  pixelDelta (i, j) {
    let d = EvgBitmapTracer.absI((this.planeR[i] - this.planeR[j]));
    const dg = EvgBitmapTracer.absI((this.planeG[i] - this.planeG[j]));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI((this.planeB[i] - this.planeB[j]));
    if ( db > d ) {
      d = db;
    }
    const da = EvgBitmapTracer.absI((this.planeA[i] - this.planeA[j]));
    if ( da > d ) {
      d = da;
    }
    return d;
  };
  buildFlatMask () {
    const n = this.width * this.height;
    let f = [];
    let i = 0;
    while (i < n) {
      f.push(1);
      i = i + 1;
    };
    let tol = this.options.flatTolerance;
    if ( tol < 0 ) {
      tol = 0;
    }
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const idx = y * this.width + x;
        let isFlat = true;
        if ( x > 0 ) {
          if ( this.pixelDelta(idx, idx - 1) > tol ) {
            isFlat = false;
          }
        }
        if ( x < this.width - 1 ) {
          if ( this.pixelDelta(idx, idx + 1) > tol ) {
            isFlat = false;
          }
        }
        if ( y > 0 ) {
          if ( this.pixelDelta(idx, idx - this.width) > tol ) {
            isFlat = false;
          }
        }
        if ( y < this.height - 1 ) {
          if ( this.pixelDelta(idx, idx + this.width) > tol ) {
            isFlat = false;
          }
        }
        if ( isFlat ) {
          f[idx] = 1;
        } else {
          f[idx] = 0;
        }
        x = x + 1;
      };
      y = y + 1;
    };
    this.flat = f;
  };
  buildHistogram (flatOnly, binR, binG, binB, binW) {
    const bins = 32768;
    let cnt = [];
    let sumR = [];
    let sumG = [];
    let sumB = [];
    let i = 0;
    while (i < bins) {
      cnt.push(0);
      sumR.push(0);
      sumG.push(0);
      sumB.push(0);
      i = i + 1;
    };
    const n = this.planeR.length;
    const hasFlat = this.flat.length == n;
    i = 0;
    while (i < n) {
      let take = this.pixelAllowed(i);
      if ( (take && flatOnly) && hasFlat ) {
        if ( this.flat[i] == 0 ) {
          take = false;
        }
      }
      if ( take ) {
        const r = this.planeR[i];
        const g = this.planeG[i];
        const b = this.planeB[i];
        const key = (((r / 8) | 0) * 32 + ((g / 8) | 0)) * 32 + ((b / 8) | 0);
        cnt[key] = cnt[key] + 1;
        sumR[key] = sumR[key] + r;
        sumG[key] = sumG[key] + g;
        sumB[key] = sumB[key] + b;
      }
      i = i + 1;
    };
    i = 0;
    while (i < bins) {
      const c = cnt[i];
      if ( c > 0 ) {
        binR.push(((sumR[i] / c) | 0));
        binG.push(((sumG[i] / c) | 0));
        binB.push(((sumB[i] / c) | 0));
        binW.push(c);
      }
      i = i + 1;
    };
  };
  parsePaletteHex (outR, outG, outB) {
    const n = this.options.paletteHex.length;
    let i = 0;
    while (i < n) {
      const c = EVGColor.parse(this.options.paletteHex[i]);
      if ( c.isSet ) {
        outR.push(Math.floor( c.r));
        outG.push(Math.floor( c.g));
        outB.push(Math.floor( c.b));
      }
      i = i + 1;
    };
    return outR.length;
  };
  chromaOf (r, g, b) {
    if ( this.okLin.length == 0 ) {
      this.okLin = EvgTraceColor.buildLinearTable();
    }
    this.okC.setFrom(this.okLin, r, g, b);
    const c = this.okC;
    const ca = c.a;
    const cb = c.b;
    const mag = Math.sqrt(ca * ca + cb * cb);
    const norm = mag / 0.1;
    if ( norm > 1.0 ) {
      return 1.0;
    }
    return norm;
  };
  gradePalette (palR, palG, palB) {
    const mute = this.options.paletteMute;
    const tint = this.options.paletteTint;
    const warm = this.options.paletteWarm;
    const contrast = this.options.paletteContrast;
    let on = false;
    if ( mute != 100 ) {
      on = true;
    }
    if ( tint > 0 ) {
      on = true;
    }
    if ( warm != 0 ) {
      on = true;
    }
    if ( contrast != 100 ) {
      on = true;
    }
    if ( on == false ) {
      return;
    }
    const k = palR.length;
    if ( k == 0 ) {
      return;
    }
    if ( this.okLin.length == 0 ) {
      this.okLin = EvgTraceColor.buildLinearTable();
    }
    let ls = [];
    let cas = [];
    let cbs = [];
    let sumL = 0.0;
    let sumA = 0.0;
    let sumB = 0.0;
    let i = 0;
    while (i < k) {
      this.okC.setFrom(this.okLin, palR[i], palG[i], palB[i]);
      const c = this.okC;
      const cl = c.l;
      const ca = c.a;
      const cb = c.b;
      ls.push(cl);
      cas.push(ca);
      cbs.push(cb);
      sumL = sumL + cl;
      sumA = sumA + ca;
      sumB = sumB + cb;
      i = i + 1;
    };
    const kd = k;
    const meanL = sumL / kd;
    const meanA = sumA / kd;
    const meanB = sumB / kd;
    const meanMag = Math.sqrt(meanA * meanA + meanB * meanB);
    let dirA = 0.0;
    let dirB = 1.0;
    if ( meanMag > 0.000001 ) {
      dirA = meanA / meanMag;
      dirB = meanB / meanMag;
    }
    const wd = warm / 1000.0;
    const floorC = tint / 1000.0;
    const ms = mute / 100.0;
    const cs = contrast / 100.0;
    i = 0;
    while (i < k) {
      const la = cas[i];
      const lb = cbs[i] + wd;
      const mag = Math.sqrt(la * la + lb * lb);
      let na = dirA;
      let nb = dirB;
      if ( mag > 0.000001 ) {
        na = la / mag;
        nb = lb / mag;
      }
      let chroma = mag * ms;
      if ( chroma < floorC ) {
        chroma = floorC;
      }
      let lightness = meanL + (ls[i] - meanL) * cs;
      if ( lightness < 0.0 ) {
        lightness = 0.0;
      }
      if ( lightness > 1.0 ) {
        lightness = 1.0;
      }
      const outA = na * chroma;
      const outB = nb * chroma;
      const rgb = EvgTraceColor.srgbOf(lightness, outA, outB);
      palR[i] = rgb[0];
      palG[i] = rgb[1];
      palB[i] = rgb[2];
      i = i + 1;
    };
  };
  binWeight (w, r, g, b) {
    const bias = this.options.paletteBias;
    let base = w;
    if ( bias == "balanced" ) {
      base = Math.sqrt(base);
    }
    if ( bias == "distinct" ) {
      base = 1.0;
    }
    const gain = this.options.paletteChroma;
    if ( gain <= 0 ) {
      return base;
    }
    const c = this.chromaOf(r, g, b);
    const g2 = gain;
    const mul = 1.0 + (g2 / 100.0) * c;
    return base * mul;
  };
  seedScore (weight, dist2) {
    return weight * dist2;
  };
  buildPalette (want, locked, outR, outG, outB) {
    let binR = [];
    let binG = [];
    let binB = [];
    let binW = [];
    this.buildHistogram(true, binR, binG, binB, binW);
    if ( binR.length < 2 ) {
      let allR = [];
      let allG = [];
      let allB = [];
      let allW = [];
      this.buildHistogram(false, allR, allG, allB, allW);
      binR = allR;
      binG = allG;
      binB = allB;
      binW = allW;
    }
    const m = binR.length;
    if ( m == 0 ) {
      return;
    }
    let total = 0;
    let i = 0;
    while (i < m) {
      total = total + binW[i];
      i = i + 1;
    };
    let floorW = ((total / 2000) | 0);
    if ( floorW < 2 ) {
      floorW = 2;
    }
    if ( locked == 0 ) {
      let bestI = 0;
      let bestW = binW[0];
      i = 1;
      while (i < m) {
        if ( binW[i] > bestW ) {
          bestW = binW[i];
          bestI = i;
        }
        i = i + 1;
      };
      outR.push(binR[bestI]);
      outG.push(binG[bestI]);
      outB.push(binB[bestI]);
    }
    let dist = [];
    i = 0;
    while (i < m) {
      dist.push(this.dist2(
        binR[i],
        binG[i],
        binB[i],
        outR[0],
        outG[0],
        outB[0]
      ));
      i = i + 1;
    };
    let seeded = 1;
    while (seeded < outR.length) {
      i = 0;
      while (i < m) {
        const d0 = this.dist2(
          binR[i],
          binG[i],
          binB[i],
          outR[seeded],
          outG[seeded],
          outB[seeded]
        );
        if ( d0 < dist[i] ) {
          dist[i] = d0;
        }
        i = i + 1;
      };
      seeded = seeded + 1;
    };
    while (outR.length < want) {
      let pickI = 0 - 1;
      let pickScore = 0.0;
      i = 0;
      while (i < m) {
        if ( binW[i] >= floorW ) {
          const bw = this.binWeight(binW[i], binR[i], binG[i], binB[i]);
          const score = this.seedScore(bw, dist[i]);
          if ( score > pickScore ) {
            pickScore = score;
            pickI = i;
          }
        }
        i = i + 1;
      };
      if ( pickI < 0 ) {
        want = outR.length;
      } else {
        const cr = binR[pickI];
        const cg = binG[pickI];
        const cb = binB[pickI];
        outR.push(cr);
        outG.push(cg);
        outB.push(cb);
        i = 0;
        while (i < m) {
          const d = this.dist2(binR[i], binG[i], binB[i], cr, cg, cb);
          if ( d < dist[i] ) {
            dist[i] = d;
          }
          i = i + 1;
        };
      }
    };
    const k = outR.length;
    let pass = 0;
    while (pass < 12) {
      let sumR = [];
      let sumG = [];
      let sumB = [];
      let wgt = [];
      let ki = 0;
      while (ki < k) {
        sumR.push(0.0);
        sumG.push(0.0);
        sumB.push(0.0);
        wgt.push(0.0);
        ki = ki + 1;
      };
      i = 0;
      while (i < m) {
        const br = binR[i];
        const bg = binG[i];
        const bb = binB[i];
        const best = this.nearestIndex(br, bg, bb, outR, outG, outB);
        const w = this.binWeight(binW[i], br, bg, bb);
        sumR[best] = sumR[best] + br * w;
        sumG[best] = sumG[best] + bg * w;
        sumB[best] = sumB[best] + bb * w;
        wgt[best] = wgt[best] + w;
        dist[i] = 0.0;
        i = i + 1;
      };
      let moved = false;
      ki = locked;
      while (ki < k) {
        const wk = wgt[ki];
        if ( wk > 0.0 ) {
          const nr = Math.floor( sumR[ki] / wk);
          const ng = Math.floor( sumG[ki] / wk);
          const nb = Math.floor( sumB[ki] / wk);
          if ( (nr != outR[ki] || ng != outG[ki]) || nb != outB[ki] ) {
            moved = true;
          }
          outR[ki] = nr;
          outG[ki] = ng;
          outB[ki] = nb;
        } else {
          let farI = 0 - 1;
          let farScore = 0.0;
          i = 0;
          while (i < m) {
            const dd = this.dist2(
              binR[i],
              binG[i],
              binB[i],
              outR[this.nearestIndex(binR[i], binG[i], binB[i], outR, outG, outB)],
              outG[this.nearestIndex(binR[i], binG[i], binB[i], outR, outG, outB)],
              outB[this.nearestIndex(binR[i], binG[i], binB[i], outR, outG, outB)]
            );
            const bw2 = this.binWeight(binW[i], binR[i], binG[i], binB[i]);
            const sc = dd * bw2;
            if ( sc > farScore ) {
              farScore = sc;
              farI = i;
            }
            i = i + 1;
          };
          if ( farI >= 0 ) {
            outR[ki] = binR[farI];
            outG[ki] = binG[farI];
            outB[ki] = binB[farI];
            moved = true;
          }
        }
        ki = ki + 1;
      };
      if ( moved ) {
        pass = pass + 1;
      } else {
        pass = 12;
      }
    };
    this.mergeCloseSwatches(locked, outR, outG, outB, binR, binG, binB, binW);
    const k2 = outR.length;
    let a = 0;
    while (a < k2) {
      let bIdx = a + 1;
      while (bIdx < k2) {
        const la = EvgBitmapTracer.lumaOf(outR[a], outG[a], outB[a]);
        const lb = EvgBitmapTracer.lumaOf(outR[bIdx], outG[bIdx], outB[bIdx]);
        if ( la > lb ) {
          const tr = outR[a];
          const tg = outG[a];
          const tb = outB[a];
          outR[a] = outR[bIdx];
          outG[a] = outG[bIdx];
          outB[a] = outB[bIdx];
          outR[bIdx] = tr;
          outG[bIdx] = tg;
          outB[bIdx] = tb;
        }
        bIdx = bIdx + 1;
      };
      a = a + 1;
    };
  };
  mergeCloseSwatches (locked, outR, outG, outB, binR, binG, binB, binW) {
    const delta = this.options.minColorDelta;
    if ( delta <= 0 ) {
      return;
    }
    const limit = this.dist2Limit(delta);
    let merged = true;
    while (merged) {
      merged = false;
      const k = outR.length;
      if ( k < 2 ) {
        return;
      }
      let wgt = [];
      let ki = 0;
      while (ki < k) {
        wgt.push(0);
        ki = ki + 1;
      };
      const m = binR.length;
      let i = 0;
      while (i < m) {
        const idx = this.nearestIndex(
          binR[i],
          binG[i],
          binB[i],
          outR,
          outG,
          outB
        );
        wgt[idx] = wgt[idx] + binW[i];
        i = i + 1;
      };
      let dropAt = 0 - 1;
      let a = 0;
      while (a < k && dropAt < 0) {
        let b = a + 1;
        while (b < k && dropAt < 0) {
          const d = this.dist2(
            outR[a],
            outG[a],
            outB[a],
            outR[b],
            outG[b],
            outB[b]
          );
          if ( d <= limit ) {
            if ( b < locked ) {
            } else {
              if ( a < locked ) {
                dropAt = b;
              } else {
                if ( wgt[a] >= wgt[b] ) {
                  dropAt = b;
                } else {
                  dropAt = a;
                }
              }
            }
          }
          b = b + 1;
        };
        a = a + 1;
      };
      if ( dropAt >= 0 ) {
        outR.splice(dropAt, 1);
        outG.splice(dropAt, 1);
        outB.splice(dropAt, 1);
        merged = true;
      }
    };
  };
  nearestIndex (r, g, b, palR, palG, palB) {
    const k = palR.length;
    if ( k == 0 ) {
      return 0;
    }
    let best = 0;
    let bestD = this.dist2(r, g, b, palR[0], palG[0], palB[0]);
    let j = 1;
    while (j < k) {
      const d = this.dist2(r, g, b, palR[j], palG[j], palB[j]);
      if ( d < bestD ) {
        bestD = d;
        best = j;
      }
      j = j + 1;
    };
    return best;
  };
  assignLabels (palR, palG, palB) {
    const n = this.width * this.height;
    let base = [];
    let dists = [];
    let i = 0;
    while (i < n) {
      base.push(0 - 1);
      dists.push(0.0);
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      if ( this.pixelAllowed(i) ) {
        const lab = this.nearestIndex(
          this.planeR[i],
          this.planeG[i],
          this.planeB[i],
          palR,
          palG,
          palB
        );
        base[i] = lab;
        dists[i] = this.dist2(
          this.planeR[i],
          this.planeG[i],
          this.planeB[i],
          palR[lab],
          palG[lab],
          palB[lab]
        );
      }
      i = i + 1;
    };
    let outL = [];
    i = 0;
    while (i < n) {
      outL.push(base[i]);
      i = i + 1;
    };
    const hasFlat = this.flat.length == n;
    if ( this.options.edgeSnap && hasFlat ) {
      const ratio = this.options.snapRatio;
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          const idx = y * this.width + x;
          const gLab = base[idx];
          if ( gLab >= 0 && this.flat[idx] == 0 ) {
            const gD = dists[idx];
            const pr = this.planeR[idx];
            const pg = this.planeG[idx];
            const pb = this.planeB[idx];
            let nLab = 0 - 1;
            let nD = 0.0;
            let dy = 0 - 1;
            while (dy <= 1) {
              const yy = y + dy;
              if ( yy >= 0 && yy < this.height ) {
                let dx = 0 - 1;
                while (dx <= 1) {
                  const xx = x + dx;
                  if ( xx >= 0 && xx < this.width ) {
                    const nIdx = yy * this.width + xx;
                    if ( this.flat[nIdx] == 1 ) {
                      const lab2 = base[nIdx];
                      if ( lab2 >= 0 ) {
                        const d = this.dist2(
                          pr,
                          pg,
                          pb,
                          palR[lab2],
                          palG[lab2],
                          palB[lab2]
                        );
                        if ( nLab < 0 || d < nD ) {
                          nLab = lab2;
                          nD = d;
                        }
                      }
                    }
                  }
                  dx = dx + 1;
                };
              }
              dy = dy + 1;
            };
            if ( nLab >= 0 && nLab != gLab ) {
              if ( nD <= gD * ratio + 1.0 ) {
                outL[idx] = nLab;
              }
            }
          }
          x = x + 1;
        };
        y = y + 1;
      };
    }
    this.labels = outL;
    this.despeckleLabels();
    this.smoothContours(palR, palG, palB);
    this.mergeTinyRegions(palR, palG, palB);
  };
  contourStep (i, from, seen, stack, acc, edgeTol, spread) {
    if ( seen[i] != 0 ) {
      return;
    }
    if ( this.labels[i] < 0 ) {
      return;
    }
    if ( this.isBoundary(from, i, edgeTol) ) {
      return;
    }
    const cnt = acc[3];
    if ( cnt > 0 ) {
      const mr = ((acc[0] / cnt) | 0);
      const mg = ((acc[1] / cnt) | 0);
      const mb = ((acc[2] / cnt) | 0);
      let d = EvgBitmapTracer.absI((this.planeR[i] - mr));
      const dg = EvgBitmapTracer.absI((this.planeG[i] - mg));
      if ( dg > d ) {
        d = dg;
      }
      const db = EvgBitmapTracer.absI((this.planeB[i] - mb));
      if ( db > d ) {
        d = db;
      }
      if ( d > spread ) {
        return;
      }
    }
    seen[i] = 1;
    stack.push(i);
    acc[0] = acc[0] + this.planeR[i];
    acc[1] = acc[1] + this.planeG[i];
    acc[2] = acc[2] + this.planeB[i];
    acc[3] = cnt + 1;
  };
  buildDetailMask () {
    const n = this.width * this.height;
    let dm = [];
    let i = 0;
    while (i < n) {
      dm.push(0);
      i = i + 1;
    };
    this.detailMask = dm;
    this.detailOn = this.options.detailBoost >= 2;
    const minSwatches = this.options.detailSwatches;
    if ( minSwatches < 2 ) {
      return;
    }
    const minSpread = this.options.detailSpread;
    let r = this.options.detailRadius;
    if ( r < 1 ) {
      r = 1;
    }
    let lum = [];
    i = 0;
    while (i < n) {
      lum.push(EvgBitmapTracer.lumaOf(
        this.planeR[i],
        this.planeG[i],
        this.planeB[i]
      ));
      i = i + 1;
    };
    let mark = [];
    let mi = 0;
    const marks = 256;
    while (mi < marks) {
      mark.push(0 - 1);
      mi = mi + 1;
    };
    let visit = 0;
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        visit = visit + 1;
        let distinct = 0;
        let lo = 256;
        let hi = 0 - 1;
        let dy = 0 - r;
        while (dy <= r) {
          const yy = y + dy;
          if ( yy >= 0 && yy < this.height ) {
            let dx = 0 - r;
            while (dx <= r) {
              const xx = x + dx;
              if ( xx >= 0 && xx < this.width ) {
                const q = yy * this.width + xx;
                const lab = this.labels[q];
                if ( lab >= 0 ) {
                  if ( lab < marks ) {
                    if ( mark[lab] != visit ) {
                      mark[lab] = visit;
                      distinct = distinct + 1;
                    }
                  }
                  const lv = lum[q];
                  if ( lv < lo ) {
                    lo = lv;
                  }
                  if ( lv > hi ) {
                    hi = lv;
                  }
                }
              }
              dx = dx + 1;
            };
          }
          dy = dy + 1;
        };
        if ( distinct >= minSwatches ) {
          if ( hi - lo >= minSpread ) {
            dm[y * this.width + x] = 1;
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    let grown = [];
    i = 0;
    while (i < n) {
      grown.push(dm[i]);
      i = i + 1;
    };
    let gy = 0;
    while (gy < this.height) {
      let gx = 0;
      while (gx < this.width) {
        if ( dm[(gy * this.width + gx)] == 1 ) {
          let dy2 = 0 - r;
          while (dy2 <= r) {
            const yy2 = gy + dy2;
            if ( yy2 >= 0 && yy2 < this.height ) {
              let dx2 = 0 - r;
              while (dx2 <= r) {
                const xx2 = gx + dx2;
                if ( xx2 >= 0 && xx2 < this.width ) {
                  grown[yy2 * this.width + xx2] = 1;
                }
                dx2 = dx2 + 1;
              };
            }
            dy2 = dy2 + 1;
          };
        }
        gx = gx + 1;
      };
      gy = gy + 1;
    };
    this.detailMask = grown;
    this.detailOn = this.options.detailBoost >= 2;
  };
  buildEdgeMask () {
    const n = this.width * this.height;
    let keep = [];
    let mag = [];
    let lum = [];
    let i = 0;
    while (i < n) {
      keep.push(0);
      mag.push(0);
      lum.push(EvgBitmapTracer.lumaOf(
        this.planeR[i],
        this.planeG[i],
        this.planeB[i]
      ));
      i = i + 1;
    };
    if ( this.options.edgeMinRun < 1 ) {
      this.edgeMask = keep;
      this.edgeMaskOn = false;
      return;
    }
    let edgeTol = this.options.contourEdge;
    if ( edgeTol < 1 ) {
      edgeTol = 1;
    }
    let y = 1;
    while (y < this.height - 1) {
      let x = 1;
      while (x < this.width - 1) {
        const idx = y * this.width + x;
        const gx = lum[(idx + 1)] - lum[(idx - 1)];
        const gy = lum[(idx + this.width)] - lum[(idx - this.width)];
        mag[idx] = EvgBitmapTracer.absI(gx) + EvgBitmapTracer.absI(gy);
        x = x + 1;
      };
      y = y + 1;
    };
    y = 1;
    while (y < this.height - 1) {
      let x2 = 1;
      while (x2 < this.width - 1) {
        const idx2 = y * this.width + x2;
        const m = mag[idx2];
        if ( m > edgeTol ) {
          const gx2 = lum[(idx2 + 1)] - lum[(idx2 - 1)];
          const gy2 = lum[(idx2 + this.width)] - lum[(idx2 - this.width)];
          const ax = EvgBitmapTracer.absI(gx2);
          const ay = EvgBitmapTracer.absI(gy2);
          let a = 0;
          let b = 0;
          if ( ax > ay * 2 ) {
            a = idx2 - 1;
            b = idx2 + 1;
          } else {
            if ( ay > ax * 2 ) {
              a = idx2 - this.width;
              b = idx2 + this.width;
            } else {
              if ( gx2 * gy2 > 0 ) {
                a = (idx2 - this.width) - 1;
                b = (idx2 + this.width) + 1;
              } else {
                a = (idx2 - this.width) + 1;
                b = (idx2 + this.width) - 1;
              }
            }
          }
          if ( m >= mag[a] && m >= mag[b] ) {
            keep[idx2] = 1;
          }
        }
        x2 = x2 + 1;
      };
      y = y + 1;
    };
    const minRun = this.options.edgeMinRun;
    let seen = [];
    i = 0;
    while (i < n) {
      seen.push(0);
      i = i + 1;
    };
    let start = 0;
    while (start < n) {
      if ( keep[start] == 1 && seen[start] == 0 ) {
        let comp = [];
        let stack = [];
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < stack.length) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - cy * this.width;
          let dy = 0 - 1;
          while (dy <= 1) {
            const yy = cy + dy;
            if ( yy >= 0 && yy < this.height ) {
              let dx = 0 - 1;
              while (dx <= 1) {
                const xx = cx + dx;
                if ( xx >= 0 && xx < this.width ) {
                  const j = yy * this.width + xx;
                  if ( keep[j] == 1 && seen[j] == 0 ) {
                    seen[j] = 1;
                    stack.push(j);
                  }
                }
                dx = dx + 1;
              };
            }
            dy = dy + 1;
          };
        };
        if ( comp.length < minRun ) {
          let c = 0;
          while (c < comp.length) {
            keep[comp[c]] = 0;
            c = c + 1;
          };
        }
      }
      start = start + 1;
    };
    this.edgeMask = keep;
  };
  isBoundary (a, b, edgeTol) {
    return this.isBoundaryOf(a, b, edgeTol, this.pixelDelta(a, b));
  };
  isBoundaryOf (a, b, edgeTol, delta) {
    if ( delta <= edgeTol ) {
      return false;
    }
    if ( this.edgeMaskOn == false ) {
      return true;
    }
    if ( this.edgeMask[b] == 1 ) {
      return true;
    }
    return this.edgeMask[a] == 1;
  };
  buildContourRegions () {
    this.buildEdgeMask();
    let edgeTol = this.options.contourEdge;
    if ( edgeTol < 1 ) {
      edgeTol = 1;
    }
    let spread = this.options.contourSpread;
    if ( spread < 1 ) {
      spread = 1;
    }
    const n = this.width * this.height;
    let ro = [];
    let seen = [];
    let i = 0;
    while (i < n) {
      ro.push(0 - 1);
      seen.push(0);
      i = i + 1;
    };
    let rid = 0;
    let start = 0;
    while (start < n) {
      if ( seen[start] == 0 && this.labels[start] >= 0 ) {
        let stack = [];
        let acc = [];
        acc.push(this.planeR[start]);
        acc.push(this.planeG[start]);
        acc.push(this.planeB[start]);
        acc.push(1);
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < stack.length) {
          const cur = stack[head];
          head = head + 1;
          ro[cur] = rid;
          const cy = ((cur / this.width) | 0);
          const cx = cur - cy * this.width;
          if ( cx > 0 ) {
            this.contourStep(cur - 1, cur, seen, stack, acc, edgeTol, spread);
          }
          if ( cx < this.width - 1 ) {
            this.contourStep(cur + 1, cur, seen, stack, acc, edgeTol, spread);
          }
          if ( cy > 0 ) {
            this.contourStep(
              cur - this.width,
              cur,
              seen,
              stack,
              acc,
              edgeTol,
              spread
            );
          }
          if ( cy < this.height - 1 ) {
            this.contourStep(
              cur + this.width,
              cur,
              seen,
              stack,
              acc,
              edgeTol,
              spread
            );
          }
        };
        rid = rid + 1;
      }
      start = start + 1;
    };
    this.regionOf = ro;
    this.regionCount = rid;
  };
  smoothContours (palR, palG, palB) {
    if ( this.options.contourMode != "smooth" ) {
      return;
    }
    this.buildContourRegions();
    const k = this.regionCount;
    if ( k == 0 ) {
      return;
    }
    let sumR = [];
    let sumG = [];
    let sumB = [];
    let cnt = [];
    let i = 0;
    while (i < k) {
      sumR.push(0);
      sumG.push(0);
      sumB.push(0);
      cnt.push(0);
      i = i + 1;
    };
    const n = this.width * this.height;
    i = 0;
    while (i < n) {
      const r = this.regionOf[i];
      if ( r >= 0 ) {
        sumR[r] = sumR[r] + this.planeR[i];
        sumG[r] = sumG[r] + this.planeG[i];
        sumB[r] = sumB[r] + this.planeB[i];
        cnt[r] = cnt[r] + 1;
      }
      i = i + 1;
    };
    let lab = [];
    i = 0;
    while (i < k) {
      const c = cnt[i];
      if ( c > 0 ) {
        lab.push(this.nearestIndex(
          ((sumR[i] / c) | 0),
          ((sumG[i] / c) | 0),
          ((sumB[i] / c) | 0),
          palR,
          palG,
          palB
        ));
      } else {
        lab.push(0);
      }
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      const r2 = this.regionOf[i];
      if ( r2 >= 0 ) {
        this.labels[i] = lab[r2];
      }
      i = i + 1;
    };
  };
  absorbTinyRegions (minPx) {
    const k = this.regionCount;
    if ( k == 0 ) {
      return;
    }
    const n = this.width * this.height;
    let size = [];
    let i = 0;
    while (i < k) {
      size.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      const r = this.regionOf[i];
      if ( r >= 0 ) {
        size[r] = size[r] + 1;
      }
      i = i + 1;
    };
    let target = [];
    i = 0;
    while (i < k) {
      target.push(i);
      i = i + 1;
    };
    let bestN = [];
    let bestR = [];
    i = 0;
    while (i < k) {
      bestN.push(0);
      bestR.push(0 - 1);
      i = i + 1;
    };
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const idx = y * this.width + x;
        const r0 = this.regionOf[idx];
        if ( r0 >= 0 && size[r0] < minPx ) {
          if ( x < this.width - 1 ) {
            this.tallyNeighbour(
              r0,
              this.regionOf[(idx + 1)],
              size,
              minPx,
              bestN,
              bestR
            );
          }
          if ( x > 0 ) {
            this.tallyNeighbour(
              r0,
              this.regionOf[(idx - 1)],
              size,
              minPx,
              bestN,
              bestR
            );
          }
          if ( y < this.height - 1 ) {
            this.tallyNeighbour(
              r0,
              this.regionOf[(idx + this.width)],
              size,
              minPx,
              bestN,
              bestR
            );
          }
          if ( y > 0 ) {
            this.tallyNeighbour(
              r0,
              this.regionOf[(idx - this.width)],
              size,
              minPx,
              bestN,
              bestR
            );
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    i = 0;
    while (i < k) {
      if ( bestR[i] >= 0 ) {
        target[i] = bestR[i];
      }
      i = i + 1;
    };
    let remap = [];
    i = 0;
    while (i < k) {
      remap.push(0 - 1);
      i = i + 1;
    };
    let next = 0;
    i = 0;
    while (i < n) {
      const r2 = this.regionOf[i];
      if ( r2 >= 0 ) {
        const t = target[r2];
        if ( remap[t] < 0 ) {
          remap[t] = next;
          next = next + 1;
        }
        this.regionOf[i] = remap[t];
      }
      i = i + 1;
    };
    this.regionCount = next;
  };
  tallyNeighbour (mine, other, size, minPx, bestN, bestR) {
    if ( other < 0 ) {
      return;
    }
    if ( other == mine ) {
      return;
    }
    const sz = size[other];
    if ( bestR[mine] < 0 ) {
      bestR[mine] = other;
      bestN[mine] = sz;
      return;
    }
    if ( sz > bestN[mine] ) {
      bestR[mine] = other;
      bestN[mine] = sz;
    }
  };
  hexOf (r, g, b) {
    return this.hexFromRgb(
      EvgBitmapTracer.clamp255(r),
      EvgBitmapTracer.clamp255(g),
      EvgBitmapTracer.clamp255(b)
    );
  };
  traceGradientRegions (palR, palG, palB) {
    this.buildContourRegions();
    let floorPx = this.options.minRegion;
    if ( floorPx < 8 ) {
      floorPx = 8;
    }
    let prev = this.regionCount + 1;
    let guard = 0;
    while (this.regionCount < prev && guard < 24) {
      prev = this.regionCount;
      this.absorbTinyRegions(floorPx);
      guard = guard + 1;
    };
    guard = 0;
    while (this.regionCount > 2000 && guard < 8) {
      floorPx = floorPx * 2;
      prev = this.regionCount + 1;
      let inner = 0;
      while (this.regionCount < prev && inner < 24) {
        prev = this.regionCount;
        this.absorbTinyRegions(floorPx);
        inner = inner + 1;
      };
      guard = guard + 1;
    };
    const k = this.regionCount;
    if ( k == 0 ) {
      return;
    }
    const n = this.width * this.height;
    let rn = [];
    let rsx = [];
    let rsy = [];
    let rsxx = [];
    let rsyy = [];
    let rsxy = [];
    let sv = [];
    let sxv = [];
    let syv = [];
    let svv = [];
    let i = 0;
    while (i < k) {
      rn.push(0.0);
      rsx.push(0.0);
      rsy.push(0.0);
      rsxx.push(0.0);
      rsyy.push(0.0);
      rsxy.push(0.0);
      let c = 0;
      while (c < 3) {
        sv.push(0.0);
        sxv.push(0.0);
        syv.push(0.0);
        svv.push(0.0);
        c = c + 1;
      };
      i = i + 1;
    };
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const idx = y * this.width + x;
        const r = this.regionOf[idx];
        if ( r >= 0 ) {
          const dx = x;
          const dy = y;
          rn[r] = rn[r] + 1.0;
          rsx[r] = rsx[r] + dx;
          rsy[r] = rsy[r] + dy;
          rsxx[r] = rsxx[r] + dx * dx;
          rsyy[r] = rsyy[r] + dy * dy;
          rsxy[r] = rsxy[r] + dx * dy;
          let c2 = 0;
          while (c2 < 3) {
            const v = this.planeAt(c2, idx);
            const j = r * 3 + c2;
            sv[j] = sv[j] + v;
            sxv[j] = sxv[j] + dx * v;
            syv[j] = syv[j] + dy * v;
            svv[j] = svv[j] + v * v;
            c2 = c2 + 1;
          };
        }
        x = x + 1;
      };
      y = y + 1;
    };
    let la = [];
    let lb = [];
    let lc = [];
    let lok = [];
    i = 0;
    while (i < k) {
      let sol = [];
      sol.push(0.0);
      sol.push(0.0);
      sol.push(0.0);
      sol.push(0.0);
      let okAll = 1.0;
      let c3 = 0;
      while (c3 < 3) {
        const j2 = i * 3 + c3;
        EvgBitmapTracer.solveLinear(
          rn[i],
          rsx[i],
          rsy[i],
          rsxx[i],
          rsxy[i],
          rsyy[i],
          sv[j2],
          sxv[j2],
          syv[j2],
          sol
        );
        if ( sol[0] < 0.5 ) {
          okAll = 0.0;
        }
        la.push(sol[1]);
        lb.push(sol[2]);
        lc.push(sol[3]);
        c3 = c3 + 1;
      };
      lok.push(okAll);
      i = i + 1;
    };
    let rsd = [];
    let rsdd = [];
    let rsdv = [];
    let tmin = [];
    let tmax = [];
    let dmax = [];
    let ux = [];
    let uy = [];
    i = 0;
    while (i < k) {
      rsd.push(0.0);
      rsdd.push(0.0);
      tmin.push(1000000.0);
      tmax.push(0.0 - 1000000.0);
      dmax.push(0.0);
      let c4 = 0;
      while (c4 < 3) {
        rsdv.push(0.0);
        c4 = c4 + 1;
      };
      const bl = (0.299 * lb[(i * 3 + 0)] + 0.587 * lb[(i * 3 + 1)]) + 0.114 * lb[(i * 3 + 2)];
      const cl = (0.299 * lc[(i * 3 + 0)] + 0.587 * lc[(i * 3 + 1)]) + 0.114 * lc[(i * 3 + 2)];
      const mag = Math.sqrt(bl * bl + cl * cl);
      if ( mag < 0.000001 ) {
        ux.push(1.0);
        uy.push(0.0);
      } else {
        ux.push(bl / mag);
        uy.push(cl / mag);
      }
      i = i + 1;
    };
    y = 0;
    while (y < this.height) {
      let x2 = 0;
      while (x2 < this.width) {
        const idx2 = y * this.width + x2;
        const r2 = this.regionOf[idx2];
        if ( r2 >= 0 ) {
          const cnt = rn[r2];
          const mx = rsx[r2] / cnt;
          const my = rsy[r2] / cnt;
          const ddx = x2 - mx;
          const ddy = y - my;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          rsd[r2] = rsd[r2] + dist;
          rsdd[r2] = rsdd[r2] + dist * dist;
          if ( dist > dmax[r2] ) {
            dmax[r2] = dist;
          }
          const tproj = ddx * ux[r2] + ddy * uy[r2];
          if ( tproj < tmin[r2] ) {
            tmin[r2] = tproj;
          }
          if ( tproj > tmax[r2] ) {
            tmax[r2] = tproj;
          }
          let c5 = 0;
          while (c5 < 3) {
            const j3 = r2 * 3 + c5;
            rsdv[j3] = rsdv[j3] + dist * this.planeAt(c5, idx2);
            c5 = c5 + 1;
          };
        }
        x2 = x2 + 1;
      };
      y = y + 1;
    };
    this.emitRegionLayers(
      palR,
      palG,
      palB,
      k,
      rn,
      rsx,
      rsy,
      sv,
      svv,
      sxv,
      syv,
      la,
      lb,
      lc,
      lok,
      rsd,
      rsdd,
      rsdv,
      tmin,
      tmax,
      dmax,
      ux,
      uy
    );
  };
  planeAt (c, i) {
    if ( c == 0 ) {
      return this.planeR[i];
    }
    if ( c == 1 ) {
      return this.planeG[i];
    }
    return this.planeB[i];
  };
  emitRegionLayers (palR, palG, palB, k, rn, rsx, rsy, sv, svv, sxv, syv, la, lb, lc, lok, rsd, rsdd, rsdv, tmin, tmax, dmax, ux, uy) {
    let order = [];
    let i = 0;
    while (i < k) {
      order.push(i);
      i = i + 1;
    };
    let a = 0;
    while (a < k) {
      let b = a + 1;
      while (b < k) {
        if ( rn[order[b]] > rn[order[a]] ) {
          const tmp = order[a];
          order[a] = order[b];
          order[b] = tmp;
        }
        b = b + 1;
      };
      a = a + 1;
    };
    const gain = this.options.gradientGain / 100.0;
    let allCmds = [];
    let oi = 0;
    while (oi < k) {
      const r = order[oi];
      const cnt = rn[r];
      if ( cnt > 0.0 ) {
        const mx = rsx[r] / cnt;
        const my = rsy[r] / cnt;
        let eFlat = 0.0;
        let eLin = 0.0;
        let eRad = 0.0;
        let ra = [];
        let rb = [];
        let c = 0;
        while (c < 3) {
          const j = r * 3 + c;
          const n2 = cnt;
          const s1 = sv[j];
          eFlat = eFlat + (svv[j] - (s1 * s1) / n2);
          if ( lok[r] > 0.5 ) {
            eLin = eLin + (svv[j] - ((la[j] * s1 + lb[j] * sxv[j]) + lc[j] * syv[j]));
          } else {
            eLin = eLin + 1000000000.0;
          }
          const den = n2 * rsdd[r] - rsd[r] * rsd[r];
          if ( EvgBitmapTracer.absD(den) > 0.000001 ) {
            const bb = (n2 * rsdv[j] - rsd[r] * s1) / den;
            const aa = (s1 - bb * rsd[r]) / n2;
            ra.push(aa);
            rb.push(bb);
            eRad = eRad + (svv[j] - (aa * s1 + bb * rsdv[j]));
          } else {
            ra.push(0.0);
            rb.push(0.0);
            eRad = eRad + 1000000000.0;
          }
          c = c + 1;
        };
        if ( eFlat < 0.0 ) {
          eFlat = 0.0;
        }
        if ( cnt < 64.0 ) {
          eLin = 1000000000.0;
          eRad = 1000000000.0;
        }
        if ( eLin < 0.0 ) {
          eLin = 1000000000.0;
        }
        if ( eRad < 0.0 ) {
          eRad = 1000000000.0;
        }
        let kind = "flat";
        let best = eFlat;
        if ( eLin < best ) {
          best = eLin;
          kind = "linear";
        }
        if ( kind != "flat" ) {
          if ( eFlat - best < eFlat * gain ) {
            kind = "flat";
          }
          if ( eFlat < cnt * 3.0 ) {
            kind = "flat";
          }
        }
        const mask = this.maskForRegion(r);
        const layerOpts = EvgTraceOptions.defaults();
        layerOpts.turdsize = this.options.turdsize;
        layerOpts.alphamax = this.options.alphamax;
        layerOpts.turnpolicy = this.options.turnpolicy;
        layerOpts.optcurve = this.options.optcurve;
        layerOpts.opttolerance = this.options.opttolerance;
        layerOpts.pathFormat = this.options.pathFormat;
        layerOpts.pathPrecision = this.options.pathPrecision;
        const sub = EvgBitmapTracer.fromBinary(mask, layerOpts);
        sub.trace();
        if ( sub.ringCount() > 0 ) {
          const layer = sub.layers[0];
          const meanR = sv[(r * 3 + 0)] / cnt;
          const meanG = sv[(r * 3 + 1)] / cnt;
          const meanB = sv[(r * 3 + 2)] / cnt;
          const gi = this.nearestIndex(
            EvgBitmapTracer.clamp255(meanR),
            EvgBitmapTracer.clamp255(meanG),
            EvgBitmapTracer.clamp255(meanB),
            palR,
            palG,
            palB
          );
          layer.fillHex = this.hexFromRgb(palR[gi], palG[gi], palB[gi]);
          layer.fillKind = kind;
          if ( kind == "linear" ) {
            const t0 = tmin[r];
            const t1 = tmax[r];
            if ( t1 - t0 < 2.0 ) {
              kind = "flat";
              layer.fillKind = "flat";
            }
            layer.gx0 = mx + ux[r] * t0;
            layer.gy0 = my + uy[r] * t0;
            layer.gx1 = mx + ux[r] * t1;
            layer.gy1 = my + uy[r] * t1;
            layer.stopA = this.hexOf(
              this.linAt(la, lb, lc, r, 0, layer.gx0, layer.gy0),
              this.linAt(la, lb, lc, r, 1, layer.gx0, layer.gy0),
              this.linAt(la, lb, lc, r, 2, layer.gx0, layer.gy0)
            );
            layer.stopB = this.hexOf(
              this.linAt(la, lb, lc, r, 0, layer.gx1, layer.gy1),
              this.linAt(la, lb, lc, r, 1, layer.gx1, layer.gy1),
              this.linAt(la, lb, lc, r, 2, layer.gx1, layer.gy1)
            );
          }
          this.layers.push(layer);
          const cmds = sub.getCommands();
          let ci = 0;
          while (ci < cmds.length) {
            allCmds.push(cmds[ci]);
            ci = ci + 1;
          };
          this.pathData = layer.pathData;
          this.rings = sub.rings;
        }
      }
      oi = oi + 1;
    };
    this.commands = allCmds;
    if ( this.layers.length > 0 ) {
      const first = this.layers[0];
      this.pathData = first.pathData;
    }
  };
  linAt (la, lb, lc, r, c, x, y) {
    const j = r * 3 + c;
    return (la[j] + lb[j] * x) + lc[j] * y;
  };
  maskForRegion (rid) {
    const bm = EvgBinaryBitmap.create(this.width, this.height);
    const n = this.width * this.height;
    let i = 0;
    while (i < n) {
      if ( this.regionOf[i] == rid ) {
        const y = ((i / this.width) | 0);
        const x = i - y * this.width;
        bm.setBit(x, y, true);
        if ( x > 0 ) {
          bm.setBit(x - 1, y, true);
        }
        if ( x < this.width - 1 ) {
          bm.setBit(x + 1, y, true);
        }
        if ( y > 0 ) {
          bm.setBit(x, y - 1, true);
        }
        if ( y < this.height - 1 ) {
          bm.setBit(x, y + 1, true);
        }
      }
      i = i + 1;
    };
    return bm;
  };
  coveredAlready (i, paintR, paintG, paintB, painted, tol) {
    if ( painted[i] == 0 ) {
      return false;
    }
    let d = EvgBitmapTracer.absI((this.planeR[i] - paintR[i]));
    const dg = EvgBitmapTracer.absI((this.planeG[i] - paintG[i]));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI((this.planeB[i] - paintB[i]));
    if ( db > d ) {
      d = db;
    }
    return d <= tol;
  };
  fitAndPaintShape (comp, layer, paintR, paintG, paintB) {
    const n = comp.length;
    if ( n == 0 ) {
      return;
    }
    const cnt = n;
    let sx = 0.0;
    let sy = 0.0;
    let sxx = 0.0;
    let syy = 0.0;
    let sxy = 0.0;
    let sv = [];
    let sxv = [];
    let syv = [];
    let svv = [];
    let c = 0;
    while (c < 3) {
      sv.push(0.0);
      sxv.push(0.0);
      syv.push(0.0);
      svv.push(0.0);
      c = c + 1;
    };
    let i = 0;
    while (i < n) {
      const idx = comp[i];
      const yy = ((idx / this.width) | 0);
      const dx = (idx - yy * this.width);
      const dy = yy;
      sx = sx + dx;
      sy = sy + dy;
      sxx = sxx + dx * dx;
      syy = syy + dy * dy;
      sxy = sxy + dx * dy;
      c = 0;
      while (c < 3) {
        const v = this.planeAt(c, idx);
        sv[c] = sv[c] + v;
        sxv[c] = sxv[c] + dx * v;
        syv[c] = syv[c] + dy * v;
        svv[c] = svv[c] + v * v;
        c = c + 1;
      };
      i = i + 1;
    };
    const mx = sx / cnt;
    const my = sy / cnt;
    let la = [];
    let lb = [];
    let lc = [];
    let eFlat = 0.0;
    let eLin = 0.0;
    let sol = [];
    sol.push(0.0);
    sol.push(0.0);
    sol.push(0.0);
    sol.push(0.0);
    c = 0;
    while (c < 3) {
      const s1 = sv[c];
      eFlat = eFlat + (svv[c] - (s1 * s1) / cnt);
      EvgBitmapTracer.solveLinear(
        cnt,
        sx,
        sy,
        sxx,
        sxy,
        syy,
        s1,
        sxv[c],
        syv[c],
        sol
      );
      if ( sol[0] > 0.5 ) {
        la.push(sol[1]);
        lb.push(sol[2]);
        lc.push(sol[3]);
        eLin = eLin + (svv[c] - ((sol[1] * s1 + sol[2] * sxv[c]) + sol[3] * syv[c]));
      } else {
        la.push(s1 / cnt);
        lb.push(0.0);
        lc.push(0.0);
        eLin = eLin + 1000000000.0;
      }
      c = c + 1;
    };
    if ( eFlat < 0.0 ) {
      eFlat = 0.0;
    }
    if ( eLin < 0.0 || cnt < 64.0 ) {
      eLin = 1000000000.0;
    }
    const gain = this.options.gradientGain / 100.0;
    let best = eFlat;
    let useLin = false;
    if ( eLin < best ) {
      best = eLin;
      useLin = true;
    }
    if ( eFlat - best < eFlat * gain ) {
      useLin = false;
    }
    if ( eFlat < cnt * 3.0 ) {
      useLin = false;
    }
    const mR = EvgBitmapTracer.clamp255((sv[0] / cnt));
    const mG = EvgBitmapTracer.clamp255((sv[1] / cnt));
    const mB = EvgBitmapTracer.clamp255((sv[2] / cnt));
    layer.fillHex = this.hexFromRgb(mR, mG, mB);
    if ( useLin == false ) {
      layer.fillKind = "flat";
      i = 0;
      while (i < n) {
        const p0 = comp[i];
        paintR[p0] = mR;
        paintG[p0] = mG;
        paintB[p0] = mB;
        i = i + 1;
      };
      return;
    }
    const bl = (0.299 * lb[0] + 0.587 * lb[1]) + 0.114 * lb[2];
    const cl = (0.299 * lc[0] + 0.587 * lc[1]) + 0.114 * lc[2];
    const mag = Math.sqrt(bl * bl + cl * cl);
    let ux = 1.0;
    let uy = 0.0;
    if ( mag > 0.000001 ) {
      ux = bl / mag;
      uy = cl / mag;
    }
    let tmin = 1000000.0;
    let tmax = 0.0 - 1000000.0;
    i = 0;
    while (i < n) {
      const p1 = comp[i];
      const y1 = ((p1 / this.width) | 0);
      const t = ((p1 - y1 * this.width) - mx) * ux + (y1 - my) * uy;
      if ( t < tmin ) {
        tmin = t;
      }
      if ( t > tmax ) {
        tmax = t;
      }
      paintR[p1] = EvgBitmapTracer.clamp255(this.linAt(
        la,
        lb,
        lc,
        0,
        0,
        (p1 - y1 * this.width),
        y1
      ));
      paintG[p1] = EvgBitmapTracer.clamp255(this.linAt(
        la,
        lb,
        lc,
        0,
        1,
        (p1 - y1 * this.width),
        y1
      ));
      paintB[p1] = EvgBitmapTracer.clamp255(this.linAt(
        la,
        lb,
        lc,
        0,
        2,
        (p1 - y1 * this.width),
        y1
      ));
      i = i + 1;
    };
    if ( tmax - tmin < 2.0 ) {
      layer.fillKind = "flat";
      return;
    }
    layer.fillKind = "linear";
    layer.gx0 = mx + ux * tmin;
    layer.gy0 = my + uy * tmin;
    layer.gx1 = mx + ux * tmax;
    layer.gy1 = my + uy * tmax;
    layer.stopA = this.hexOf(
      this.linAt(la, lb, lc, 0, 0, layer.gx0, layer.gy0),
      this.linAt(la, lb, lc, 0, 1, layer.gx0, layer.gy0),
      this.linAt(la, lb, lc, 0, 2, layer.gx0, layer.gy0)
    );
    layer.stopB = this.hexOf(
      this.linAt(la, lb, lc, 0, 0, layer.gx1, layer.gy1),
      this.linAt(la, lb, lc, 0, 1, layer.gx1, layer.gy1),
      this.linAt(la, lb, lc, 0, 2, layer.gx1, layer.gy1)
    );
  };
  traceDetailShapes (allCmds, minPx) {
    const k = this.options.detailColors;
    if ( k < 2 ) {
      return;
    }
    const n = this.width * this.height;
    if ( this.detailMask.length != n ) {
      return;
    }
    let seen = [];
    let i = 0;
    while (i < n) {
      seen.push(0);
      i = i + 1;
    };
    let needPx = minPx;
    if ( this.options.detailBoost >= 2 ) {
      needPx = ((minPx / this.options.detailBoost) | 0);
    }
    if ( needPx < 4 ) {
      needPx = 4;
    }
    let shR = [];
    let shG = [];
    let shB = [];
    let start = 0;
    while (start < n) {
      if ( this.detailMask[start] == 1 && seen[start] == 0 ) {
        let comp = [];
        let stack = [];
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < stack.length) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - cy * this.width;
          if ( cx > 0 ) {
            this.detailVisit(cur - 1, seen, stack);
          }
          if ( cx < this.width - 1 ) {
            this.detailVisit(cur + 1, seen, stack);
          }
          if ( cy > 0 ) {
            this.detailVisit(cur - this.width, seen, stack);
          }
          if ( cy < this.height - 1 ) {
            this.detailVisit(cur + this.width, seen, stack);
          }
        };
        if ( comp.length >= needPx * k ) {
          this.paintDetailCluster(comp, k, needPx, allCmds, shR, shG, shB);
        }
      }
      start = start + 1;
    };
  };
  detailVisit (i, seen, stack) {
    if ( seen[i] == 1 ) {
      return;
    }
    if ( this.detailMask[i] == 0 ) {
      return;
    }
    seen[i] = 1;
    stack.push(i);
  };
  shareColor (r, g, b, tol, shR, shG, shB) {
    const n = shR.length;
    let best = 0 - 1;
    let bestD = 1000;
    let i = 0;
    while (i < n) {
      const dr = EvgBitmapTracer.absI((r - shR[i]));
      const dg = EvgBitmapTracer.absI((g - shG[i]));
      const db = EvgBitmapTracer.absI((b - shB[i]));
      let d = dr;
      if ( dg > d ) {
        d = dg;
      }
      if ( db > d ) {
        d = db;
      }
      if ( d < bestD ) {
        bestD = d;
        best = i;
      }
      i = i + 1;
    };
    if ( best >= 0 && bestD <= tol ) {
      return best;
    }
    const cap = this.options.detailColorMax;
    if ( cap > 0 && n >= cap ) {
      if ( best >= 0 ) {
        return best;
      }
    }
    shR.push(r);
    shG.push(g);
    shB.push(b);
    return n;
  };
  paintDetailCluster (comp, k, needPx, allCmds, shR, shG, shB) {
    let binN = [];
    let binR = [];
    let binG = [];
    let binB = [];
    let i = 0;
    while (i < 256) {
      binN.push(0);
      binR.push(0);
      binG.push(0);
      binB.push(0);
      i = i + 1;
    };
    let c = 0;
    while (c < comp.length) {
      const px = comp[c];
      const r = this.planeR[px];
      const g = this.planeG[px];
      const b = this.planeB[px];
      const l = EvgBitmapTracer.lumaOf(r, g, b);
      binN[l] = binN[l] + 1;
      binR[l] = binR[l] + r;
      binG[l] = binG[l] + g;
      binB[l] = binB[l] + b;
      c = c + 1;
    };
    const total = comp.length;
    let lpR = [];
    let lpG = [];
    let lpB = [];
    let acc = 0;
    let sR = 0;
    let sG = 0;
    let sB = 0;
    let sN = 0;
    let band = 1;
    i = 0;
    while (i < 256) {
      const cnt = binN[i];
      if ( cnt > 0 ) {
        sR = sR + binR[i];
        sG = sG + binG[i];
        sB = sB + binB[i];
        sN = sN + cnt;
        acc = acc + cnt;
      }
      const edge = (((total * band) / k) | 0);
      if ( acc >= edge && band < k ) {
        if ( sN > 0 ) {
          lpR.push(((sR / sN) | 0));
          lpG.push(((sG / sN) | 0));
          lpB.push(((sB / sN) | 0));
        }
        sR = 0;
        sG = 0;
        sB = 0;
        sN = 0;
        band = band + 1;
      }
      i = i + 1;
    };
    if ( sN > 0 ) {
      lpR.push(((sR / sN) | 0));
      lpG.push(((sG / sN) | 0));
      lpB.push(((sB / sN) | 0));
    }
    const lk = lpR.length;
    if ( lk < 2 ) {
      return;
    }
    const merge = this.options.detailColorMerge;
    if ( merge > 0 ) {
      let bi = 0;
      while (bi < lk) {
        const want = this.shareColor(
          lpR[bi],
          lpG[bi],
          lpB[bi],
          merge,
          shR,
          shG,
          shB
        );
        lpR[bi] = shR[want];
        lpG[bi] = shG[want];
        lpB[bi] = shB[want];
        bi = bi + 1;
      };
    }
    const speck = (((total * this.options.detailMinShare) / 100) | 0);
    let bx0 = this.width;
    let by0 = this.height;
    let bx1 = 0;
    let by1 = 0;
    c = 0;
    while (c < comp.length) {
      const q = comp[c];
      const qy = ((q / this.width) | 0);
      const qx = q - qy * this.width;
      if ( qx < bx0 ) {
        bx0 = qx;
      }
      if ( qx > bx1 ) {
        bx1 = qx;
      }
      if ( qy < by0 ) {
        by0 = qy;
      }
      if ( qy > by1 ) {
        by1 = qy;
      }
      c = c + 1;
    };
    bx0 = bx0 - 1;
    by0 = by0 - 1;
    const bw = (bx1 - bx0) + 2;
    const bh = (by1 - by0) + 2;
    let li = 0;
    while (li < lk) {
      const mask = EvgBinaryBitmap.create(bw, bh);
      let held = 0;
      c = 0;
      while (c < comp.length) {
        const p2 = comp[c];
        const py = ((p2 / this.width) | 0);
        const pxx = p2 - py * this.width;
        const near = this.nearestIndex(
          this.planeR[p2],
          this.planeG[p2],
          this.planeB[p2],
          lpR,
          lpG,
          lpB
        );
        if ( near == li ) {
          mask.setBit(pxx - bx0, py - by0, true);
          held = held + 1;
        }
        c = c + 1;
      };
      if ( held >= needPx ) {
        const layerOpts = EvgTraceOptions.defaults();
        layerOpts.turdsize = this.options.turdsize;
        if ( speck > this.options.turdsize ) {
          layerOpts.turdsize = speck;
        }
        layerOpts.alphamax = this.options.alphamax;
        layerOpts.turnpolicy = this.options.turnpolicy;
        layerOpts.optcurve = this.options.optcurve;
        layerOpts.opttolerance = this.options.opttolerance;
        layerOpts.fillHex = this.hexFromRgb(lpR[li], lpG[li], lpB[li]);
        layerOpts.pathFormat = this.options.pathFormat;
        layerOpts.pathPrecision = this.options.pathPrecision;
        const sub = EvgBitmapTracer.fromBinary(mask, layerOpts);
        sub.trace();
        if ( sub.ringCount() > 0 ) {
          const cmds = sub.getCommands();
          const ox = bx0;
          const oy = by0;
          let ci = 0;
          while (ci < cmds.length) {
            const cm = cmds[ci];
            cm.x = cm.x + ox;
            cm.y = cm.y + oy;
            cm.x1 = cm.x1 + ox;
            cm.y1 = cm.y1 + oy;
            cm.x2 = cm.x2 + ox;
            cm.y2 = cm.y2 + oy;
            allCmds.push(cm);
            ci = ci + 1;
          };
          const layer = sub.layers[0];
          layer.pathData = this.pathDataOf(cmds);
          this.layers.push(layer);
          this.rings = sub.rings;
        }
      }
      li = li + 1;
    };
  };
  traceOverlayShapes (palR, palG, palB) {
    this.buildEdgeMask();
    this.buildDetailMask();
    const n = this.width * this.height;
    let edgeTol = this.options.contourEdge;
    if ( edgeTol < 1 ) {
      edgeTol = 1;
    }
    let spread = this.options.contourSpread;
    if ( spread < 1 ) {
      spread = 1;
    }
    const simTol = this.options.overlaySimilar;
    let minPx = this.options.minRegion;
    if ( minPx < 4 ) {
      minPx = 4;
    }
    let paintR = [];
    let paintG = [];
    let paintB = [];
    let painted = [];
    let stamp = [];
    let i = 0;
    while (i < n) {
      const lab = this.labels[i];
      if ( lab >= 0 && lab < palR.length ) {
        paintR.push(palR[lab]);
        paintG.push(palG[lab]);
        paintB.push(palB[lab]);
        painted.push(1);
      } else {
        paintR.push(0);
        paintG.push(0);
        paintB.push(0);
        painted.push(0);
      }
      stamp.push(0 - 1);
      i = i + 1;
    };
    let bucket = [];
    let seedPixel = [];
    let seedNext = [];
    let seedBest = [];
    i = 0;
    while (i < 256) {
      bucket.push(0 - 1);
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      seedBest.push(0 - 1);
      i = i + 1;
    };
    let y0 = 0;
    while (y0 < this.height) {
      let x0 = 0;
      while (x0 < this.width) {
        const idx0 = y0 * this.width + x0;
        if ( this.labels[idx0] >= 0 ) {
          let st = 0;
          if ( x0 > 0 ) {
            if ( this.isBoundary(idx0, idx0 - 1, edgeTol) ) {
              st = this.pixelDelta(idx0, (idx0 - 1));
            }
          }
          if ( x0 < this.width - 1 ) {
            if ( this.isBoundary(idx0, idx0 + 1, edgeTol) ) {
              const s1 = this.pixelDelta(idx0, (idx0 + 1));
              if ( s1 > st ) {
                st = s1;
              }
            }
          }
          if ( y0 > 0 ) {
            if ( this.isBoundary(idx0, idx0 - this.width, edgeTol) ) {
              const s2 = this.pixelDelta(idx0, (idx0 - this.width));
              if ( s2 > st ) {
                st = s2;
              }
            }
          }
          if ( y0 < this.height - 1 ) {
            if ( this.isBoundary(idx0, idx0 + this.width, edgeTol) ) {
              const s3 = this.pixelDelta(idx0, (idx0 + this.width));
              if ( s3 > st ) {
                st = s3;
              }
            }
          }
          if ( st > 0 ) {
            this.pushSeed(idx0, st, bucket, seedPixel, seedNext, seedBest);
          }
        }
        x0 = x0 + 1;
      };
      y0 = y0 + 1;
    };
    let allCmds = [];
    this.paintLabelLayers(palR, palG, palB, allCmds);
    this.traceDetailShapes(allCmds, minPx);
    let budget = ((n / 4) | 0);
    if ( budget < 500 ) {
      budget = 500;
    }
    if ( budget > 80000 ) {
      budget = 80000;
    }
    let shapeNo = 0;
    let sweepFrom = 0;
    while (shapeNo < budget) {
      let seed = 0 - 1;
      let empty = false;
      if ( shapeNo % 4 == 3 && sweepFrom < n ) {
        while (sweepFrom < n && seed < 0) {
          if ( this.labels[sweepFrom] >= 0 && painted[sweepFrom] == 0 ) {
            seed = sweepFrom;
          }
          sweepFrom = sweepFrom + 1;
        };
      }
      while (seed < 0 && empty == false) {
        const cand = this.popSeed(bucket, seedPixel, seedNext);
        if ( cand < 0 ) {
          empty = true;
        } else {
          if ( this.labels[cand] >= 0 ) {
            let candSim = simTol;
            if ( this.isDetail(cand) ) {
              candSim = ((simTol / this.options.detailBoost) | 0);
            }
            if ( this.coveredAlready(cand, paintR, paintG, paintB, painted, candSim) == false ) {
              seed = cand;
            }
          }
        }
      };
      if ( seed < 0 ) {
        while (sweepFrom < n && seed < 0) {
          if ( this.labels[sweepFrom] >= 0 && painted[sweepFrom] == 0 ) {
            seed = sweepFrom;
          }
          sweepFrom = sweepFrom + 1;
        };
      }
      if ( seed < 0 ) {
        shapeNo = budget;
      } else {
        let comp = [];
        let stack = [];
        let acc = [];
        acc.push(this.planeR[seed]);
        acc.push(this.planeG[seed]);
        acc.push(this.planeB[seed]);
        acc.push(1);
        stamp[seed] = shapeNo;
        stack.push(seed);
        let h2 = 0;
        while (h2 < stack.length) {
          const cur = stack[h2];
          h2 = h2 + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - cy * this.width;
          if ( cx > 0 ) {
            this.overlayStep(
              cur - 1,
              cur,
              stamp,
              stack,
              acc,
              bucket,
              seedPixel,
              seedNext,
              seedBest,
              shapeNo,
              edgeTol,
              spread,
              simTol,
              paintR,
              paintG,
              paintB,
              painted
            );
          }
          if ( cx < this.width - 1 ) {
            this.overlayStep(
              cur + 1,
              cur,
              stamp,
              stack,
              acc,
              bucket,
              seedPixel,
              seedNext,
              seedBest,
              shapeNo,
              edgeTol,
              spread,
              simTol,
              paintR,
              paintG,
              paintB,
              painted
            );
          }
          if ( cy > 0 ) {
            this.overlayStep(
              cur - this.width,
              cur,
              stamp,
              stack,
              acc,
              bucket,
              seedPixel,
              seedNext,
              seedBest,
              shapeNo,
              edgeTol,
              spread,
              simTol,
              paintR,
              paintG,
              paintB,
              painted
            );
          }
          if ( cy < this.height - 1 ) {
            this.overlayStep(
              cur + this.width,
              cur,
              stamp,
              stack,
              acc,
              bucket,
              seedPixel,
              seedNext,
              seedBest,
              shapeNo,
              edgeTol,
              spread,
              simTol,
              paintR,
              paintG,
              paintB,
              painted
            );
          }
        };
        const cnt = acc[3];
        let mr = ((acc[0] / cnt) | 0);
        let mg = ((acc[1] / cnt) | 0);
        let mb = ((acc[2] / cnt) | 0);
        const pi = this.nearestIndex(mr, mg, mb, palR, palG, palB);
        let keepTrue = false;
        if ( this.options.detailTrueColor ) {
          if ( this.isDetail(seed) ) {
            keepTrue = true;
          }
        }
        if ( keepTrue == false ) {
          mr = palR[pi];
          mg = palG[pi];
          mb = palB[pi];
        }
        let sameBelow = 0;
        let c = 0;
        while (c < comp.length) {
          const px = comp[c];
          if ( painted[px] == 1 ) {
            if ( paintR[px] == mr && paintG[px] == mg ) {
              if ( paintB[px] == mb ) {
                sameBelow = sameBelow + 1;
              }
            }
          }
          paintR[px] = mr;
          paintG[px] = mg;
          paintB[px] = mb;
          painted[px] = 1;
          c = c + 1;
        };
        const addsNothing = sameBelow == comp.length;
        let needPx = minPx;
        if ( this.isDetail(seed) ) {
          needPx = ((minPx / this.options.detailBoost) | 0);
          if ( needPx < 4 ) {
            needPx = 4;
          }
        }
        if ( comp.length >= needPx && addsNothing == false ) {
          let bx0 = this.width;
          let by0 = this.height;
          let bx1 = 0;
          let by1 = 0;
          c = 0;
          while (c < comp.length) {
            const q = comp[c];
            const qy = ((q / this.width) | 0);
            const qx = q - qy * this.width;
            if ( qx < bx0 ) {
              bx0 = qx;
            }
            if ( qx > bx1 ) {
              bx1 = qx;
            }
            if ( qy < by0 ) {
              by0 = qy;
            }
            if ( qy > by1 ) {
              by1 = qy;
            }
            c = c + 1;
          };
          bx0 = bx0 - 1;
          by0 = by0 - 1;
          const bw = (bx1 - bx0) + 2;
          const bh = (by1 - by0) + 2;
          const bm = EvgBinaryBitmap.create(bw, bh);
          c = 0;
          while (c < comp.length) {
            const p2 = comp[c];
            const yy = ((p2 / this.width) | 0);
            bm.setBit((p2 - yy * this.width) - bx0, yy - by0, true);
            c = c + 1;
          };
          const layerOpts = EvgTraceOptions.defaults();
          layerOpts.turdsize = this.options.turdsize;
          layerOpts.alphamax = this.options.alphamax;
          layerOpts.turnpolicy = this.options.turnpolicy;
          layerOpts.optcurve = this.options.optcurve;
          layerOpts.opttolerance = this.options.opttolerance;
          layerOpts.fillHex = this.hexFromRgb(mr, mg, mb);
          layerOpts.pathFormat = this.options.pathFormat;
          layerOpts.pathPrecision = this.options.pathPrecision;
          const sub = EvgBitmapTracer.fromBinary(bm, layerOpts);
          sub.trace();
          if ( sub.ringCount() > 0 ) {
            const cmds = sub.getCommands();
            const ox = bx0;
            const oy = by0;
            let ci = 0;
            while (ci < cmds.length) {
              const cm = cmds[ci];
              cm.x = cm.x + ox;
              cm.y = cm.y + oy;
              cm.x1 = cm.x1 + ox;
              cm.y1 = cm.y1 + oy;
              cm.x2 = cm.x2 + ox;
              cm.y2 = cm.y2 + oy;
              allCmds.push(cm);
              ci = ci + 1;
            };
            const layer = sub.layers[0];
            layer.pathData = this.pathDataOf(cmds);
            if ( this.options.gradientFill ) {
              this.fitAndPaintShape(comp, layer, paintR, paintG, paintB);
            }
            this.layers.push(layer);
            this.rings = sub.rings;
          }
        }
        shapeNo = shapeNo + 1;
      }
    };
    this.commands = allCmds;
    if ( this.layers.length > 0 ) {
      const first = this.layers[0];
      this.pathData = first.pathData;
    }
  };
  isDetail (i) {
    if ( this.detailOn == false ) {
      return false;
    }
    return this.detailMask[i] == 1;
  };
  pushSeed (px, strength, bucket, seedPixel, seedNext, seedBest) {
    let s = strength;
    if ( s < 0 ) {
      s = 0;
    }
    if ( s > 255 ) {
      s = 255;
    }
    if ( s <= seedBest[px] ) {
      return;
    }
    seedBest[px] = s;
    const idx = seedPixel.length;
    seedPixel.push(px);
    seedNext.push(bucket[s]);
    bucket[s] = idx;
  };
  popSeed (bucket, seedPixel, seedNext) {
    let s = 255;
    while (s >= 0) {
      const idx = bucket[s];
      if ( idx >= 0 ) {
        bucket[s] = seedNext[idx];
        return seedPixel[idx];
      }
      s = s - 1;
    };
    return 0 - 1;
  };
  overlayStep (i, from, stamp, stack, acc, bucket, seedPixel, seedNext, seedBest, shapeNo, edgeTol, spread, simTol, paintR, paintG, paintB, painted) {
    if ( stamp[i] == shapeNo ) {
      return;
    }
    if ( this.labels[i] < 0 ) {
      return;
    }
    if ( this.options.overlayFollowBase ) {
      if ( this.isDetail(i) == false ) {
        if ( this.labels[i] != this.labels[from] ) {
          return;
        }
      }
    }
    const step = this.pixelDelta(from, i);
    if ( step > edgeTol ) {
      if ( this.isBoundaryOf(from, i, edgeTol, step) ) {
        this.pushSeed(i, step, bucket, seedPixel, seedNext, seedBest);
        this.pushSeed(from, step, bucket, seedPixel, seedNext, seedBest);
      }
      return;
    }
    let useSim = simTol;
    if ( this.isDetail(i) ) {
      useSim = ((simTol / this.options.detailBoost) | 0);
    }
    if ( this.coveredAlready(i, paintR, paintG, paintB, painted, useSim) ) {
      return;
    }
    const cnt = acc[3];
    const mr = ((acc[0] / cnt) | 0);
    const mg = ((acc[1] / cnt) | 0);
    const mb = ((acc[2] / cnt) | 0);
    let d = EvgBitmapTracer.absI((this.planeR[i] - mr));
    const dg = EvgBitmapTracer.absI((this.planeG[i] - mg));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI((this.planeB[i] - mb));
    if ( db > d ) {
      d = db;
    }
    if ( d > spread ) {
      return;
    }
    stamp[i] = shapeNo;
    stack.push(i);
    acc[0] = acc[0] + this.planeR[i];
    acc[1] = acc[1] + this.planeG[i];
    acc[2] = acc[2] + this.planeB[i];
    acc[3] = cnt + 1;
  };
  mergeTinyRegions (palR, palG, palB) {
    const k = palR.length;
    const minPx = this.options.minRegion;
    if ( minPx < 2 ) {
      return;
    }
    let keepLimit = 0.0;
    let keepOn = false;
    if ( this.options.absorbContrast > 0 ) {
      keepOn = true;
      keepLimit = this.dist2Limit(this.options.absorbContrast);
    }
    const n = this.width * this.height;
    let seen = [];
    let i = 0;
    while (i < n) {
      seen.push(0);
      i = i + 1;
    };
    let touch = [];
    let ki = 0;
    while (ki < k) {
      touch.push(0);
      ki = ki + 1;
    };
    let start = 0;
    while (start < n) {
      const lab = this.labels[start];
      if ( lab >= 0 && seen[start] == 0 ) {
        let comp = [];
        let stack = [];
        let c = 0;
        ki = 0;
        while (ki < k) {
          touch[ki] = 0;
          ki = ki + 1;
        };
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < stack.length) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - cy * this.width;
          if ( cx > 0 ) {
            this.compStep(cur - 1, lab, seen, stack, touch);
          }
          if ( cx < this.width - 1 ) {
            this.compStep(cur + 1, lab, seen, stack, touch);
          }
          if ( cy > 0 ) {
            this.compStep(cur - this.width, lab, seen, stack, touch);
          }
          if ( cy < this.height - 1 ) {
            this.compStep(cur + this.width, lab, seen, stack, touch);
          }
        };
        if ( comp.length < minPx ) {
          let bestLab = 0 - 1;
          let bestN = 0;
          ki = 0;
          while (ki < k) {
            if ( touch[ki] > bestN ) {
              bestN = touch[ki];
              bestLab = ki;
            }
            ki = ki + 1;
          };
          if ( bestLab >= 0 ) {
            let absorb = true;
            if ( keepOn && lab >= 0 ) {
              const gap = this.dist2(
                palR[lab],
                palG[lab],
                palB[lab],
                palR[bestLab],
                palG[bestLab],
                palB[bestLab]
              );
              if ( gap >= keepLimit ) {
                absorb = false;
              }
            }
            if ( absorb ) {
              c = 0;
              while (c < comp.length) {
                this.labels[comp[c]] = bestLab;
                c = c + 1;
              };
            }
          }
        }
      }
      start = start + 1;
    };
  };
  compStep (i, lab, seen, stack, touch) {
    const other = this.labels[i];
    if ( other == lab ) {
      if ( seen[i] == 0 ) {
        seen[i] = 1;
        stack.push(i);
      }
      return;
    }
    if ( other >= 0 ) {
      touch[other] = touch[other] + 1;
    }
  };
  despeckleLabels () {
    const n = this.width * this.height;
    let src = [];
    let i = 0;
    while (i < n) {
      src.push(this.labels[i]);
      i = i + 1;
    };
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const idx = y * this.width + x;
        const me = src[idx];
        if ( me >= 0 ) {
          let agree = 0 - 2;
          let same = true;
          let cnt = 0;
          if ( x > 0 ) {
            const l = src[(idx - 1)];
            if ( agree == 0 - 2 ) {
              agree = l;
            }
            if ( l != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( x < this.width - 1 ) {
            const r = src[(idx + 1)];
            if ( agree == 0 - 2 ) {
              agree = r;
            }
            if ( r != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( y > 0 ) {
            const u = src[(idx - this.width)];
            if ( agree == 0 - 2 ) {
              agree = u;
            }
            if ( u != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( y < this.height - 1 ) {
            const dn = src[(idx + this.width)];
            if ( agree == 0 - 2 ) {
              agree = dn;
            }
            if ( dn != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( (same && cnt >= 3) && agree != me ) {
            this.labels[idx] = agree;
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  hexFromRgb (r, g, b) {
    const c = EVGColor.rgb(r, g, b);
    return c.toHexString();
  };
  maskForLabel (colorIndex) {
    const stacked = this.options.layerMode != "flat";
    const bm = EvgBinaryBitmap.create(this.width, this.height);
    const n = this.labels.length;
    let i = 0;
    while (i < n) {
      const lab = this.labels[i];
      let take = lab == colorIndex;
      if ( (stacked && lab >= colorIndex) && lab >= 0 ) {
        take = true;
      }
      if ( take ) {
        const y = ((i / this.width) | 0);
        const x = i - y * this.width;
        bm.setBit(x, y, true);
      }
      i = i + 1;
    };
    return bm;
  };
  smoothPlanes () {
    let passes = this.options.smooth;
    if ( passes < 1 ) {
      return;
    }
    if ( passes > 4 ) {
      passes = 4;
    }
    const n = this.width * this.height;
    let pass = 0;
    while (pass < passes) {
      let srcR = [];
      let srcG = [];
      let srcB = [];
      let i = 0;
      while (i < n) {
        srcR.push(this.planeR[i]);
        srcG.push(this.planeG[i]);
        srcB.push(this.planeB[i]);
        i = i + 1;
      };
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          let lum = [];
          let idxs = [];
          let dy = 0 - 1;
          while (dy <= 1) {
            const yy = y + dy;
            if ( yy >= 0 && yy < this.height ) {
              let dx = 0 - 1;
              while (dx <= 1) {
                const xx = x + dx;
                if ( xx >= 0 && xx < this.width ) {
                  const j = yy * this.width + xx;
                  idxs.push(j);
                  lum.push(EvgBitmapTracer.lumaOf(srcR[j], srcG[j], srcB[j]));
                }
                dx = dx + 1;
              };
            }
            dy = dy + 1;
          };
          const k = lum.length;
          let a = 1;
          while (a < k) {
            const lv = lum[a];
            const iv = idxs[a];
            let b = a - 1;
            while (b >= 0 && lum[b] > lv) {
              lum[b + 1] = lum[b];
              idxs[b + 1] = idxs[b];
              b = b - 1;
            };
            lum[b + 1] = lv;
            idxs[b + 1] = iv;
            a = a + 1;
          };
          const pick = idxs[((k / 2) | 0)];
          const here = y * this.width + x;
          this.planeR[here] = srcR[pick];
          this.planeG[here] = srcG[pick];
          this.planeB[here] = srcB[pick];
          x = x + 1;
        };
        y = y + 1;
      };
      pass = pass + 1;
    };
  };
  paintLabelLayers (palR, palG, palB, allCmds) {
    const k = palR.length;
    let li = 0;
    while (li < k) {
      const mask = this.maskForLabel(li);
      const layerOpts = EvgTraceOptions.defaults();
      layerOpts.turdsize = this.options.turdsize;
      layerOpts.alphamax = this.options.alphamax;
      layerOpts.turnpolicy = this.options.turnpolicy;
      layerOpts.optcurve = this.options.optcurve;
      layerOpts.opttolerance = this.options.opttolerance;
      layerOpts.pathFormat = this.options.pathFormat;
      layerOpts.pathPrecision = this.options.pathPrecision;
      layerOpts.fillHex = this.hexFromRgb(palR[li], palG[li], palB[li]);
      const sub = EvgBitmapTracer.fromBinary(mask, layerOpts);
      sub.trace();
      if ( sub.ringCount() > 0 ) {
        const layer = sub.layers[0];
        this.layers.push(layer);
        const cmds = sub.getCommands();
        let ci = 0;
        while (ci < cmds.length) {
          allCmds.push(cmds[ci]);
          ci = ci + 1;
        };
        this.pathData = layer.pathData;
        this.rings = sub.rings;
      }
      li = li + 1;
    };
  };
  traceColorLayers () {
    let want = this.options.colorCount;
    if ( want < 2 ) {
      want = 2;
    }
    this.smoothPlanes();
    this.detectBackground();
    this.buildFlatMask();
    const mode = this.options.paletteMode;
    let palR = [];
    let palG = [];
    let palB = [];
    let given = 0;
    if ( mode == "fixed" || mode == "seeded" ) {
      given = this.parsePaletteHex(palR, palG, palB);
    }
    let useGivenOnly = false;
    if ( mode == "fixed" ) {
      if ( given > 0 ) {
        useGivenOnly = true;
      }
    }
    if ( useGivenOnly == false ) {
      this.buildPalette(want, given, palR, palG, palB);
    }
    const k = palR.length;
    if ( k == 0 ) {
      return;
    }
    this.assignLabels(palR, palG, palB);
    this.gradePalette(palR, palG, palB);
    if ( this.options.contourMode == "overlay" ) {
      this.traceOverlayShapes(palR, palG, palB);
      return;
    }
    if ( this.options.gradientFill ) {
      this.traceGradientRegions(palR, palG, palB);
      return;
    }
    let allCmds = [];
    this.paintLabelLayers(palR, palG, palB, allCmds);
    this.commands = allCmds;
    if ( this.layers.length > 0 ) {
      const first = this.layers[0];
      this.pathData = first.pathData;
    }
  };
  decompose () {
    const work = this.bitmap.copy();
    let start = 0;
    while (start >= 0) {
      const idx = work.findNext(start);
      if ( idx < 0 ) {
        start = 0 - 1;
      } else {
        const y0 = ((idx / work.w) | 0);
        const x0 = idx - y0 * work.w;
        const ring = this.findPath(work, x0, y0);
        this.xorPath(work, ring);
        const a = EvgBitmapTracer.absI(ring.area);
        if ( a > this.options.turdsize ) {
          this.rings.push(ring);
        }
        start = idx;
      }
    };
  };
  majorityAt (bm, x, y) {
    let i = 2;
    while (i < 5) {
      let ct = 0;
      let a = (0 - i) + 1;
      while (a <= i - 1) {
        if ( bm.at(x + a, ((y + i) - 1)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( bm.at((x + i) - 1, ((y + a) - 1)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( bm.at((x + a) - 1, (y - i)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( bm.at(x - i, (y + a)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        a = a + 1;
      };
      if ( ct > 0 ) {
        return true;
      }
      if ( ct < 0 ) {
        return false;
      }
      i = i + 1;
    };
    return false;
  };
  shouldTurnRight (bm, path, x, y) {
    const pol = this.options.turnpolicy;
    if ( pol == "right" ) {
      return true;
    }
    if ( pol == "left" ) {
      return false;
    }
    if ( pol == "black" ) {
      return path.sign == "+";
    }
    if ( pol == "white" ) {
      return path.sign == "-";
    }
    if ( pol == "majority" ) {
      return this.majorityAt(bm, x, y);
    }
    const maj = this.majorityAt(bm, x, y);
    return maj == false;
  };
  findPath (bm, x0, y0) {
    const path = new EvgTraceRing();
    path.minX = x0;
    path.maxX = x0;
    path.minY = y0;
    path.maxY = y0;
    if ( this.bitmap.at(x0, y0) ) {
      path.sign = "+";
    } else {
      path.sign = "-";
    }
    let x = x0;
    let y = y0;
    let dirx = 0;
    let diry = 1;
    let done = false;
    let guard = 0;
    let limit = (bm.w * bm.h) * 8;
    if ( limit < 64 ) {
      limit = 64;
    }
    while (done == false) {
      if ( guard >= limit ) {
        done = true;
      } else {
        path.pts.push(EvgTracePoint.ofInt(x, y));
        if ( x > path.maxX ) {
          path.maxX = x;
        }
        if ( x < path.minX ) {
          path.minX = x;
        }
        if ( y > path.maxY ) {
          path.maxY = y;
        }
        if ( y < path.minY ) {
          path.minY = y;
        }
        x = x + dirx;
        y = y + diry;
        path.area = path.area - x * diry;
        if ( x == x0 && y == y0 ) {
          done = true;
        } else {
          const lx = EvgBitmapTracer.idivTowardZero(((dirx + diry) - 1), 2);
          const ly = EvgBitmapTracer.idivTowardZero(((diry - dirx) - 1), 2);
          const rx = EvgBitmapTracer.idivTowardZero(((dirx - diry) - 1), 2);
          const ry = EvgBitmapTracer.idivTowardZero(((diry + dirx) - 1), 2);
          const l = bm.at((x + lx), (y + ly));
          const r = bm.at((x + rx), (y + ry));
          if ( r ) {
            if ( l == false ) {
              if ( this.shouldTurnRight(bm, path, x, y) ) {
                const tmp = dirx;
                dirx = 0 - diry;
                diry = tmp;
              } else {
                const tmp2 = dirx;
                dirx = diry;
                diry = 0 - tmp2;
              }
            } else {
              const tmp3 = dirx;
              dirx = 0 - diry;
              diry = tmp3;
            }
          } else {
            if ( l == false ) {
              const tmp4 = dirx;
              dirx = diry;
              diry = 0 - tmp4;
            }
          }
        }
        guard = guard + 1;
      }
    };
    return path;
  };
  xorPath (bm, path) {
    const n = path.len();
    if ( n < 2 ) {
      return;
    }
    const p0 = path.pts[0];
    let y1 = Math.floor( p0.y);
    let i = 1;
    while (i < n) {
      const p = path.pts[i];
      const x = Math.floor( p.x);
      const y = Math.floor( p.y);
      if ( y != y1 ) {
        let minY = y1;
        if ( y < y1 ) {
          minY = y;
        }
        let j = x;
        while (j < path.maxX) {
          bm.flip(j, minY);
          j = j + 1;
        };
        y1 = y;
      }
      i = i + 1;
    };
  };
  emitCommands () {
    let out = [];
    let ri = 0;
    while (ri < this.rings.length) {
      const ring = this.rings[ri];
      let poly = EvgTraceFit.fitRing(ring);
      const n = poly.length;
      if ( n >= 3 ) {
        if ( ring.sign == "-" ) {
          let rev = [];
          let ri2 = n - 1;
          while (ri2 >= 0) {
            rev.push(poly[ri2]);
            ri2 = ri2 - 1;
          };
          poly = rev;
        }
        if ( this.options.optcurve ) {
          const curve = EvgTraceCurve.fromPolygon(poly, this.options.alphamax);
          const opt = curve.optimize(this.options.opttolerance);
          opt.emit(out);
        } else {
          this.appendPolygon(out, poly);
        }
      }
      ri = ri + 1;
    };
    this.commands = out;
  };
  appendPolygon (out, poly) {
    const n = poly.length;
    const p0 = poly[0];
    out.push(VectorShapes.moveTo(p0.x, p0.y));
    let i = 1;
    while (i < n) {
      const p = poly[i];
      out.push(VectorShapes.lineTo(p.x, p.y));
      i = i + 1;
    };
    out.push(VectorShapes.closePath());
  };
}
EvgBitmapTracer.absD = function(v) {
  if ( v < 0.0 ) {
    return 0.0 - v;
  }
  return v;
};
EvgBitmapTracer.absI = function(v) {
  if ( v < 0 ) {
    return 0 - v;
  }
  return v;
};
EvgBitmapTracer.idivTowardZero = function(a, b) {
  if ( b == 0 ) {
    return 0;
  }
  if ( a < 0 ) {
    if ( b > 0 ) {
      return 0 - (((0 - a) / b) | 0);
    }
    return (((0 - a) / (0 - b)) | 0);
  }
  if ( b < 0 ) {
    return 0 - ((a / (0 - b)) | 0);
  }
  return ((a / b) | 0);
};
EvgBitmapTracer.fromBinary = function(bm, opts) {
  const t = new EvgBitmapTracer();
  t.options = opts;
  t.bitmap = bm;
  t.width = bm.w;
  t.height = bm.h;
  return t;
};
EvgBitmapTracer.fromImageBuffer = function(img, opts) {
  if ( opts.colorCount > 1 ) {
    const tCol = new EvgBitmapTracer();
    tCol.options = opts;
    tCol.width = img.width;
    tCol.height = img.height;
    tCol.hasColorPlanes = true;
    tCol.bitmap = EvgBinaryBitmap.create(img.width, img.height);
    let pr = [];
    let pg = [];
    let pb = [];
    let pa = [];
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        pr.push(c.r);
        pg.push(c.g);
        pb.push(c.b);
        pa.push(c.a);
        x = x + 1;
      };
      y = y + 1;
    };
    tCol.planeR = pr;
    tCol.planeG = pg;
    tCol.planeB = pb;
    tCol.planeA = pa;
    return tCol;
  }
  let thr = opts.threshold;
  if ( thr < 0 ) {
    thr = EvgBitmapTracer.otsuThreshold(img);
  }
  const bm = EvgBinaryBitmap.create(img.width, img.height);
  let y2 = 0;
  while (y2 < img.height) {
    let x2 = 0;
    while (x2 < img.width) {
      const c2 = img.getPixel(x2, y2);
      const g = c2.grayscale();
      let on = false;
      if ( opts.blackOnWhite ) {
        if ( g < thr ) {
          on = true;
        }
      } else {
        if ( g >= thr ) {
          on = true;
        }
      }
      if ( c2.a < 16 ) {
        on = false;
      }
      bm.setBit(x2, y2, on);
      x2 = x2 + 1;
    };
    y2 = y2 + 1;
  };
  return EvgBitmapTracer.fromBinary(bm, opts);
};
EvgBitmapTracer.otsuThreshold = function(img) {
  let hist = [];
  let i = 0;
  while (i < 256) {
    hist.push(0);
    i = i + 1;
  };
  const total = img.width * img.height;
  if ( total <= 0 ) {
    return 128;
  }
  let y = 0;
  while (y < img.height) {
    let x = 0;
    while (x < img.width) {
      const c = img.getPixel(x, y);
      const g = c.grayscale();
      const prev = hist[g];
      hist[g] = prev + 1;
      x = x + 1;
    };
    y = y + 1;
  };
  let sum = 0.0;
  i = 0;
  while (i < 256) {
    const cnt = hist[i];
    sum = sum + i * cnt;
    i = i + 1;
  };
  let sumB = 0.0;
  let wB = 0;
  let best = 0.0 - 1.0;
  let thr = 128;
  i = 0;
  while (i < 256) {
    const c2 = hist[i];
    wB = wB + c2;
    if ( wB > 0 ) {
      const wF = total - wB;
      if ( wF > 0 ) {
        sumB = sumB + i * c2;
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const diff = mB - mF;
        const between = ((diff * diff) * wB) * wF;
        if ( between > best ) {
          best = between;
          thr = i;
        }
      }
    }
    i = i + 1;
  };
  return thr;
};
EvgBitmapTracer.num = function(v) {
  const scaled = Math.floor( v * 100.0 + 0.5);
  const whole = ((scaled / 100) | 0);
  let frac = scaled - whole * 100;
  if ( frac < 0 ) {
    frac = 0 - frac;
  }
  let fs = (frac.toString());
  if ( frac < 10 ) {
    fs = "0" + fs;
  }
  return ((whole.toString()) + ".") + fs;
};
EvgBitmapTracer.colorDist2 = function(r0, g0, b0, r1, g1, b1, lw) {
  const dr = (r0 - r1);
  const dg = (g0 - g1);
  const db = (b0 - b1);
  const l0 = EvgBitmapTracer.lumaOf(r0, g0, b0);
  const l1 = EvgBitmapTracer.lumaOf(r1, g1, b1);
  const dl = (l0 - l1);
  return ((dr * dr + dg * dg) + db * db) + (dl * dl) * lw;
};
EvgBitmapTracer.lumaOf = function(r, g, b) {
  return ((((r * 299 + g * 587) + b * 114) / 1000) | 0);
};
EvgBitmapTracer.clamp255 = function(v) {
  if ( v < 0.0 ) {
    return 0;
  }
  if ( v > 255.0 ) {
    return 255;
  }
  return Math.floor( v);
};
EvgBitmapTracer.solveLinear = function(n, sx, sy, sxx, sxy, syy, v0, v1, v2, out) {
  const det = (n * (sxx * syy - sxy * sxy) - sx * (sx * syy - sxy * sy)) + sy * (sx * sxy - sxx * sy);
  if ( EvgBitmapTracer.absD(det) < 0.000001 ) {
    out[0] = 0.0;
    return;
  }
  const da = (v0 * (sxx * syy - sxy * sxy) - sx * (v1 * syy - sxy * v2)) + sy * (v1 * sxy - sxx * v2);
  const db = (n * (v1 * syy - v2 * sxy) - v0 * (sx * syy - sxy * sy)) + sy * (sx * v2 - v1 * sy);
  const dc = (n * (sxx * v2 - sxy * v1) - sx * (sx * v2 - v1 * sy)) + v0 * (sx * sxy - sxx * sy);
  out[0] = 1.0;
  out[1] = da / det;
  out[2] = db / det;
  out[3] = dc / det;
};
class EVGCodepoint  {
  constructor() {
  }
}
EVGCodepoint.breaksAfter = function(c) {
  if ( c == 45 || c == 8208 ) {
    return true;
  }
  if ( c == 8211 || c == 8212 ) {
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
  return u >= 55296 && u <= 56319;
};
EVGCodepoint.isLowSurrogate = function(u) {
  return u >= 56320 && u <= 57343;
};
EVGCodepoint.codeAt = function(s, i) {
  const u = s.charCodeAt(i );
  if ( EVGCodepoint.stringIsBytes() ) {
    return EVGCodepoint.utf8CodeAt(s, i, u);
  }
  if ( EVGCodepoint.isHighSurrogate(u) ) {
    if ( i + 1 < s.length ) {
      const lo = s.charCodeAt(i + 1 );
      if ( EVGCodepoint.isLowSurrogate(lo) ) {
        return ((u - 55296) * 1024 + (lo - 56320)) + 65536;
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
  if ( u >= 192 && u < 224 ) {
    if ( i + 1 < n ) {
      const b1 = s.charCodeAt(i + 1 );
      if ( EVGCodepoint.isUtf8Cont(b1) ) {
        return (u - 192) * 64 + (b1 - 128);
      }
    }
    return u;
  }
  if ( u >= 224 && u < 240 ) {
    if ( i + 2 < n ) {
      const c1 = s.charCodeAt(i + 1 );
      const c2 = s.charCodeAt(i + 2 );
      if ( EVGCodepoint.isUtf8Cont(c1) && EVGCodepoint.isUtf8Cont(c2) ) {
        return ((u - 224) * 4096 + (c1 - 128) * 64) + (c2 - 128);
      }
    }
    return u;
  }
  if ( u >= 240 && u < 248 ) {
    if ( i + 3 < n ) {
      const d1 = s.charCodeAt(i + 1 );
      const d2 = s.charCodeAt(i + 2 );
      const d3 = s.charCodeAt(i + 3 );
      if ( (EVGCodepoint.isUtf8Cont(d1) && EVGCodepoint.isUtf8Cont(d2)) && EVGCodepoint.isUtf8Cont(d3) ) {
        return (((u - 240) * 262144 + (d1 - 128) * 4096) + (d2 - 128) * 64) + (d3 - 128);
      }
    }
    return u;
  }
  return u;
};
EVGCodepoint.isUtf8Cont = function(b) {
  return b >= 128 && b < 192;
};
EVGCodepoint.utf8UnitsAt = function(s, i) {
  const u = s.charCodeAt(i );
  const n = s.length;
  if ( u < 128 ) {
    return 1;
  }
  if ( u >= 192 && u < 224 ) {
    if ( i + 1 < n ) {
      if ( EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 1 )) ) {
        return 2;
      }
    }
    return 1;
  }
  if ( u >= 224 && u < 240 ) {
    if ( i + 2 < n ) {
      if ( EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 1 )) && EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 2 )) ) {
        return 3;
      }
    }
    return 1;
  }
  if ( u >= 240 && u < 248 ) {
    if ( i + 3 < n ) {
      const e1 = EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 1 ));
      const e2 = EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 2 ));
      const e3 = EVGCodepoint.isUtf8Cont(s.charCodeAt(i + 3 ));
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
    if ( i + 1 < s.length ) {
      if ( EVGCodepoint.isLowSurrogate(s.charCodeAt(i + 1 )) ) {
        return 2;
      }
    }
  }
  return 1;
};
EVGCodepoint.charCount = function(s) {
  return Array.from(s, (rg_c) => rg_c.codePointAt(0)).length;
};
EVGCodepoint.count = function(s) {
  return Array.from(s, (rg_c) => rg_c.codePointAt(0)).length;
};
EVGCodepoint.toArray = function(s) {
  return Array.from(s, (rg_c) => rg_c.codePointAt(0));
};
EVGCodepoint.toStr = function(cp) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return String.fromCharCode(cp);
  }
  if ( cp < 65536 ) {
    return String.fromCharCode(cp);
  }
  const rel = cp - 65536;
  const hi = 55296 + Math.floor( rel / 1024);
  const lo = 56320 + rel % 1024;
  return String.fromCharCode(hi) + String.fromCharCode(lo);
};
EVGCodepoint.encodeUtf8 = function(s) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return s;
  }
  let out = "";
  let i = 0;
  while (i < s.length) {
    const cp = EVGCodepoint.codeAt(s, i);
    i = i + EVGCodepoint.unitsAt(s, i);
    if ( cp < 128 ) {
      out = out + String.fromCharCode(cp);
    } else {
      if ( cp < 2048 ) {
        out = out + String.fromCharCode(192 + Math.floor( cp / 64));
        out = out + String.fromCharCode(128 + cp % 64);
      } else {
        if ( cp < 65536 ) {
          out = out + String.fromCharCode(224 + Math.floor( cp / 4096));
          out = out + String.fromCharCode(128 + Math.floor( cp / 64) % 64);
          out = out + String.fromCharCode(128 + cp % 64);
        } else {
          out = out + String.fromCharCode(240 + Math.floor( cp / 262144));
          out = out + String.fromCharCode(128 + Math.floor( cp / 4096) % 64);
          out = out + String.fromCharCode(128 + Math.floor( cp / 64) % 64);
          out = out + String.fromCharCode(128 + cp % 64);
        }
      }
    }
    continue;
  };
  return out;
};
class EVGHitTest  {
  constructor() {
    this.order = [];
    this.deferred = [];
  }
  collect (el) {
    if ( el.isHidden() ) {
      return;
    }
    el.settleShift();
    this.order.push(el);
    let i = 0;
    while (i < el.children.length) {
      const kid = el.children[i];
      if ( kid.isOverlay ) {
        this.deferred.push(kid);
      } else {
        this.collect(kid);
      }
      i = i + 1;
    };
  };
  paintOrder (root) {
    this.order.length = 0;
    this.deferred.length = 0;
    this.collect(root);
    let i = 0;
    while (i < this.deferred.length) {
      this.collect(this.deferred[i]);
      i = i + 1;
    };
    return this.order;
  };
  collectAt (el, px, py) {
    if ( el.clipsContent() ) {
      if ( EVGHitTest.containsPoint(el, px, py) == false ) {
        return;
      }
    }
    if ( el.paintUnbounded == false && el.isHidden() == false ) {
      if ( px < el.paintLeft ) {
        return;
      }
      if ( py < el.paintTop ) {
        return;
      }
      if ( px > el.paintRight ) {
        return;
      }
      if ( py > el.paintBottom ) {
        return;
      }
    }
    el.settleShift();
    this.order.push(el);
    let i = 0;
    while (i < el.children.length) {
      const kid = el.children[i];
      if ( kid.isOverlay ) {
        this.deferred.push(kid);
      } else {
        this.collectAt(kid, px, py);
      }
      i = i + 1;
    };
  };
  paintOrderAt (root, px, py) {
    this.order.length = 0;
    this.deferred.length = 0;
    this.collectAt(root, px, py);
    let i = 0;
    while (i < this.deferred.length) {
      this.collectAt(this.deferred[i], px, py);
      i = i + 1;
    };
    return this.order;
  };
  idAt (root, px, py) {
    const list = this.paintOrderAt(root, px, py);
    let i = list.length - 1;
    while (i >= 0) {
      const el = list[i];
      if ( el.id.length > 0 ) {
        if ( EVGHitTest.containsPoint(el, px, py) ) {
          return el.id;
        }
      }
      i = i - 1;
    };
    return "";
  };
  cursorAt (root, px, py) {
    const list = this.paintOrderAt(root, px, py);
    let i = list.length - 1;
    while (i >= 0) {
      const el = list[i];
      if ( el.cursor.length > 0 ) {
        if ( EVGHitTest.containsPoint(el, px, py) ) {
          return el.cursor;
        }
      }
      i = i - 1;
    };
    return "";
  };
  classAt (root, px, py) {
    const list = this.paintOrderAt(root, px, py);
    let i = list.length - 1;
    while (i >= 0) {
      const el = list[i];
      if ( el.id.length > 0 ) {
        if ( EVGHitTest.containsPoint(el, px, py) ) {
          return el.className;
        }
      }
      i = i - 1;
    };
    return "";
  };
}
EVGHitTest.containsPoint = function(el, px, py) {
  if ( px < el.calculatedX ) {
    return false;
  }
  if ( py < el.calculatedY ) {
    return false;
  }
  if ( px > el.calculatedX + el.calculatedWidth ) {
    return false;
  }
  if ( py > el.calculatedY + el.calculatedHeight ) {
    return false;
  }
  return true;
};
class EVGStyleDecl  {
  constructor() {
    this.name = "";
    this.value = "";
    this.name = "";
    this.value = "";
  }
}
class EVGMediaQuery  {
  constructor() {
    this.minWidth = 0.0 - 1.0;
    this.maxWidth = 0.0 - 1.0;
    this.minHeight = 0.0 - 1.0;
    this.maxHeight = 0.0 - 1.0;
    this.orientation = "";
    this.pointer = 0;
    this.broken = false;
  }
  isEmpty () {
    if ( this.broken ) {
      return false;
    }
    if ( this.minWidth >= 0.0 ) {
      return false;
    }
    if ( this.maxWidth >= 0.0 ) {
      return false;
    }
    if ( this.minHeight >= 0.0 ) {
      return false;
    }
    if ( this.maxHeight >= 0.0 ) {
      return false;
    }
    if ( this.orientation.length > 0 ) {
      return false;
    }
    if ( this.pointer != 0 ) {
      return false;
    }
    return true;
  };
  matches (w, h, coarse) {
    if ( this.broken ) {
      return false;
    }
    if ( this.isEmpty() ) {
      return true;
    }
    if ( w <= 0.0 ) {
      return false;
    }
    if ( this.minWidth >= 0.0 ) {
      if ( w < this.minWidth ) {
        return false;
      }
    }
    if ( this.maxWidth >= 0.0 ) {
      if ( w > this.maxWidth ) {
        return false;
      }
    }
    if ( this.minHeight >= 0.0 ) {
      if ( h < this.minHeight ) {
        return false;
      }
    }
    if ( this.maxHeight >= 0.0 ) {
      if ( h > this.maxHeight ) {
        return false;
      }
    }
    if ( this.orientation.length > 0 ) {
      let want = "landscape";
      if ( h > w ) {
        want = "portrait";
      }
      if ( this.orientation != want ) {
        return false;
      }
    }
    if ( this.pointer == 1 ) {
      if ( coarse == false ) {
        return false;
      }
    }
    if ( this.pointer == 2 ) {
      if ( coarse ) {
        return false;
      }
    }
    return true;
  };
}
class EVGPseudo  {
  constructor() {
  }
}
EVGPseudo.none = function() {
  return 0;
};
EVGPseudo.hover = function() {
  return 1;
};
EVGPseudo.focus = function() {
  return 2;
};
EVGPseudo.active = function() {
  return 3;
};
EVGPseudo.disabled = function() {
  return 4;
};
EVGPseudo.parse = function(name) {
  if ( name == "hover" ) {
    return 1;
  }
  if ( name == "focus" ) {
    return 2;
  }
  if ( name == "active" ) {
    return 3;
  }
  if ( name == "disabled" ) {
    return 4;
  }
  return -1;
};
EVGPseudo.holds = function(code, el) {
  if ( code == 0 ) {
    return true;
  }
  if ( code == 1 ) {
    return el.isHovered;
  }
  if ( code == 2 ) {
    return el.isFocused;
  }
  if ( code == 3 ) {
    return el.isPressed;
  }
  if ( code == 4 ) {
    return el.a11yDisabled;
  }
  return false;
};
class EVGStyleRule  {
  constructor() {
    this.theme = "";
    this.className = "";
    this.pseudo = 0;
    this.decls = [];
    this.order = 0;
    this.media = new EVGMediaQuery();
    this.theme = "";
    this.className = "";
    this.order = 0;
  }
  isThemeScoped () {
    return this.theme.length > 0;
  };
}
class EVGStyleSheet  {
  constructor() {
    this.rules = [];
    this.varThemes = [];
    this.varMedia = [];
    this.varNames = [];
    this.varValues = [];
    this.varChecked = {};
    this.varReported = {};
    this.errors = [];
    this.ruleCounter = 0;
    this.pendingMedia = new EVGMediaQuery();
    this.viewportW = 0.0;
    this.viewportH = 0.0;
    this.coarsePointer = false;
    this.planNames = [];
    this.planValues = [];
    this.planStart = [];
    this.planCount = [];
    this.planIndex = {};
    this.planHits = 0;
    this.planMisses = 0;
    this.generation = 1;
    this.planLayoutSig = [];
    this.planRules = [];
    this.passSkipped = 0;
    this.passStyled = 0;
    this.passLayoutDirty = 0;
    this.passPaintDirty = 0;
    this.ruleCounter = 0;
    this.dropPlans();
  }
  dropPlans () {
    this.generation = this.generation + 1;
    let sig = [];
    this.planLayoutSig = sig;
    let a = [];
    this.planNames = a;
    let b = [];
    this.planValues = b;
    let c = [];
    this.planStart = c;
    let d = [];
    this.planCount = d;
    let e = {};
    this.planIndex = e;
    let r = [];
    this.planRules = r;
  };
  setViewport (w, h, coarse) {
    if ( (w != this.viewportW || h != this.viewportH) || coarse != this.coarsePointer ) {
      this.dropPlans();
    }
    this.viewportW = w;
    this.viewportH = h;
    this.coarsePointer = coarse;
  };
  getRuleCount () {
    return this.rules.length;
  };
  getErrorCount () {
    return this.errors.length;
  };
  getError (i) {
    return this.errors[i];
  };
  parse (css) {
    this.dropPlans();
    const src = this.stripComments(css);
    this.parseBlock(src, new EVGMediaQuery());
  };
  reload (css) {
    let r = [];
    this.rules = r;
    let e = [];
    this.errors = e;
    let vt = [];
    this.varThemes = vt;
    let vm = [];
    this.varMedia = vm;
    let vn = [];
    this.varNames = vn;
    let vv = [];
    this.varValues = vv;
    let vc = {};
    this.varChecked = vc;
    let vr = {};
    this.varReported = vr;
    this.ruleCounter = 0;
    this.parse(css);
  };
  planLength (slot) {
    if ( slot < 0 ) {
      return 0;
    }
    if ( slot >= this.planCount.length ) {
      return 0;
    }
    return this.planCount[slot];
  };
  planNameAt (slot, i) {
    const from = this.planStart[slot];
    return this.planNames[(from + i)];
  };
  planValueAt (slot, i) {
    const from = this.planStart[slot];
    return this.planValues[(from + i)];
  };
  planRuleAt (slot, i) {
    const from = this.planStart[slot];
    if ( from + i >= this.planRules.length ) {
      return 0 - 1;
    }
    return this.planRules[(from + i)];
  };
  selectorOf (ruleIdx) {
    if ( ruleIdx < 0 ) {
      return "(initial)";
    }
    if ( ruleIdx >= this.rules.length ) {
      return "(gone)";
    }
    const rule = this.rules[ruleIdx];
    let out = "." + rule.className;
    if ( rule.pseudo == 1 ) {
      out = out + ":hover";
    }
    if ( rule.pseudo == 2 ) {
      out = out + ":focus";
    }
    if ( rule.pseudo == 3 ) {
      out = out + ":active";
    }
    if ( rule.pseudo == 4 ) {
      out = out + ":disabled";
    }
    if ( rule.isThemeScoped() ) {
      out = ((out + "  [theme ") + rule.theme) + "]";
    }
    return out;
  };
  ruleClassOf (ruleIdx) {
    if ( ruleIdx < 0 ) {
      return "";
    }
    if ( ruleIdx >= this.rules.length ) {
      return "";
    }
    const rule = this.rules[ruleIdx];
    return rule.className;
  };
  ruleMediaOf (ruleIdx) {
    if ( ruleIdx < 0 ) {
      return "";
    }
    if ( ruleIdx >= this.rules.length ) {
      return "";
    }
    const rule = this.rules[ruleIdx];
    const q = rule.media;
    if ( q.isEmpty() ) {
      return "";
    }
    if ( q.broken ) {
      return "(unparseable — the rules inside it never apply)";
    }
    let out = "";
    if ( q.minWidth >= 0.0 ) {
      const v = Math.floor( q.minWidth);
      out = ((out + "min-width: ") + (v.toString())) + "px ";
    }
    if ( q.maxWidth >= 0.0 ) {
      const v2 = Math.floor( q.maxWidth);
      out = ((out + "max-width: ") + (v2.toString())) + "px ";
    }
    if ( q.minHeight >= 0.0 ) {
      const v3 = Math.floor( q.minHeight);
      out = ((out + "min-height: ") + (v3.toString())) + "px ";
    }
    if ( q.maxHeight >= 0.0 ) {
      const v4 = Math.floor( q.maxHeight);
      out = ((out + "max-height: ") + (v4.toString())) + "px ";
    }
    if ( q.orientation.length > 0 ) {
      out = ((out + "orientation: ") + q.orientation) + " ";
    }
    if ( q.pointer == 1 ) {
      out = out + "pointer: coarse ";
    }
    if ( q.pointer == 2 ) {
      out = out + "pointer: fine ";
    }
    return out;
  };
  parseBlock (src, cond) {
    const __len = src.length;
    let i = 0;
    while (i < __len) {
      const braceAt = this.findChar(src, i, 123);
      if ( braceAt < 0 ) {
        const tail = src.substring(i, __len ).trim();
        if ( tail.length > 0 ) {
          this.errors.push("Ignored trailing text with no rule body: " + tail);
        }
        return;
      }
      const selectorText = src.substring(i, braceAt ).trim();
      if ( this.startsWith(selectorText, "@media") ) {
        const endAt = this.matchingBrace(src, braceAt);
        if ( endAt < 0 ) {
          this.errors.push("Unclosed @media block: " + selectorText);
          return;
        }
        const inner = src.substring(braceAt + 1, endAt );
        const q = this.parseMedia(selectorText.substring(6, selectorText.length ).trim());
        this.parseBlock(inner, this.andQuery(cond, q));
        i = endAt + 1;
      } else {
        if ( selectorText.length > 0 ) {
          if ( selectorText.charCodeAt(0 ) == 64 ) {
            const skipTo = this.matchingBrace(src, braceAt);
            if ( skipTo < 0 ) {
              this.errors.push("Unclosed at-rule: " + selectorText);
              return;
            }
            if ( this.startsWith(selectorText, "@vars") ) {
              this.addVars(
                selectorText,
                src.substring(braceAt + 1, skipTo ),
                cond
              );
              i = skipTo + 1;
              continue;
            }
            this.errors.push("Unsupported at-rule ignored: " + selectorText);
            i = skipTo + 1;
            continue;
          }
        }
        const closeAt = this.findChar(src, (braceAt + 1), 125);
        if ( closeAt < 0 ) {
          this.errors.push("Unclosed rule body for selector: " + selectorText);
          return;
        }
        const body = src.substring(braceAt + 1, closeAt );
        this.addRulesIn(selectorText, body, cond);
        i = closeAt + 1;
      }
    };
  };
  matchingBrace (s, open) {
    const __len = s.length;
    let depth = 0;
    let i = open;
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( c == 123 ) {
        depth = depth + 1;
      }
      if ( c == 125 ) {
        depth = depth - 1;
        if ( depth == 0 ) {
          return i;
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  parseMedia (text) {
    const q = new EVGMediaQuery();
    const body = text.trim();
    if ( body.length == 0 ) {
      this.errors.push("Empty @media condition");
      q.broken = true;
      return q;
    }
    if ( this.findChar(body, 0, 44) >= 0 ) {
      this.errors.push("Comma-separated media queries are not supported: " + body);
      q.broken = true;
      return q;
    }
    const parts = this.splitFeatures(body);
    let i = 0;
    while (i < parts.length) {
      const feat = parts[i].trim();
      if ( feat.length > 0 ) {
        this.applyFeature(q, feat, body);
      }
      i = i + 1;
    };
    return q;
  };
  splitFeatures (body) {
    let out = [];
    const __len = body.length;
    let i = 0;
    while (i < __len) {
      const open = this.findChar(body, i, 40);
      if ( open < 0 ) {
        const tail = body.substring(i, __len ).trim();
        if ( tail.length > 0 ) {
          if ( tail != "and" ) {
            out.push(tail);
          }
        }
        return out;
      }
      const close = this.findChar(body, (open + 1), 41);
      if ( close < 0 ) {
        out.push(body.substring(open + 1, __len ));
        return out;
      }
      out.push(body.substring(open + 1, close ));
      i = close + 1;
    };
    return out;
  };
  applyFeature (q, feat, whole) {
    const colon = this.findChar(feat, 0, 58);
    if ( colon < 0 ) {
      this.errors.push("Media feature without a value: " + feat);
      q.broken = true;
      return;
    }
    const name = feat.substring(0, colon ).trim();
    const value = feat.substring(colon + 1, feat.length ).trim();
    if ( name == "orientation" ) {
      if ( value == "portrait" || value == "landscape" ) {
        q.orientation = value;
        return;
      }
      this.errors.push("Unknown orientation: " + value);
      q.broken = true;
      return;
    }
    if ( name == "pointer" ) {
      if ( value == "coarse" ) {
        q.pointer = 1;
        return;
      }
      if ( value == "fine" ) {
        q.pointer = 2;
        return;
      }
      this.errors.push("Unknown pointer value: " + value);
      q.broken = true;
      return;
    }
    const px = this.parsePx(value);
    if ( typeof(px) === "undefined" ) {
      this.errors.push("Media feature value is not a length: " + feat);
      q.broken = true;
      return;
    }
    const v = px;
    if ( name == "min-width" ) {
      q.minWidth = v;
      return;
    }
    if ( name == "max-width" ) {
      q.maxWidth = v;
      return;
    }
    if ( name == "min-height" ) {
      q.minHeight = v;
      return;
    }
    if ( name == "max-height" ) {
      q.maxHeight = v;
      return;
    }
    this.errors.push("Unsupported media feature: " + name);
    q.broken = true;
  };
  parsePx (value) {
    let __none;
    const v = value.trim();
    const __len = v.length;
    if ( __len == 0 ) {
      return __none;
    }
    let digits = v;
    if ( __len > 2 ) {
      if ( v.substring(__len - 2, __len ) == "px" ) {
        digits = v.substring(0, __len - 2 ).trim();
      }
    }
    if ( digits.length == 0 ) {
      return __none;
    }
    let i = 0;
    let dots = 0;
    while (i < digits.length) {
      const c = digits.charCodeAt(i );
      if ( c == 46 ) {
        dots = dots + 1;
      } else {
        if ( c < 48 || c > 57 ) {
          return __none;
        }
      }
      i = i + 1;
    };
    if ( dots > 1 ) {
      return __none;
    }
    return isNaN( parseFloat(digits) ) ? undefined : parseFloat(digits);
  };
  andQuery (a, b) {
    if ( a.isEmpty() ) {
      return b;
    }
    if ( b.isEmpty() ) {
      return a;
    }
    const q = new EVGMediaQuery();
    q.broken = a.broken || b.broken;
    q.minWidth = EVGStyleSheet.larger(a.minWidth, b.minWidth);
    q.maxWidth = EVGStyleSheet.smaller(a.maxWidth, b.maxWidth);
    q.minHeight = EVGStyleSheet.larger(a.minHeight, b.minHeight);
    q.maxHeight = EVGStyleSheet.smaller(a.maxHeight, b.maxHeight);
    q.orientation = a.orientation;
    if ( b.orientation.length > 0 ) {
      if ( a.orientation.length > 0 ) {
        if ( a.orientation != b.orientation ) {
          q.broken = true;
        }
      }
      q.orientation = b.orientation;
    }
    q.pointer = a.pointer;
    if ( b.pointer != 0 ) {
      if ( a.pointer != 0 ) {
        if ( a.pointer != b.pointer ) {
          q.broken = true;
        }
      }
      q.pointer = b.pointer;
    }
    return q;
  };
  stripComments (css) {
    let out = "";
    const __len = css.length;
    let i = 0;
    let segStart = 0;
    while (i < __len) {
      const c = css.charCodeAt(i );
      let isStart = false;
      if ( c == 47 ) {
        if ( i + 1 < __len ) {
          if ( css.charCodeAt(i + 1 ) == 42 ) {
            isStart = true;
          }
        }
      }
      if ( isStart ) {
        let j = i + 2;
        let closed = false;
        while (j < __len && closed == false) {
          if ( css.charCodeAt(j ) == 42 ) {
            if ( j + 1 < __len ) {
              if ( css.charCodeAt(j + 1 ) == 47 ) {
                closed = true;
              }
            }
          }
          if ( closed == false ) {
            j = j + 1;
          }
        };
        out = (out + css.substring(segStart, i )) + " ";
        i = j + 2;
        segStart = i;
      } else {
        i = i + 1;
      }
    };
    if ( segStart < __len ) {
      out = out + css.substring(segStart, __len );
    }
    return out;
  };
  findChar (s, from, ch) {
    const __len = s.length;
    let i = from;
    while (i < __len) {
      if ( s.charCodeAt(i ) == ch ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  addRules (selectorText, body) {
    this.addRulesIn(selectorText, body, new EVGMediaQuery());
  };
  addRulesIn (selectorText, body, cond) {
    const decls = this.parseDeclarations(body);
    const selectors = this.splitOn(selectorText, 44);
    let i = 0;
    while (i < selectors.length) {
      const sel = selectors[i].trim();
      if ( sel.length > 0 ) {
        this.pendingMedia = cond;
        this.addRuleForSelector(sel, decls);
      }
      i = i + 1;
    };
    this.pendingMedia = new EVGMediaQuery();
  };
  addVars (header, body, cond) {
    const parts = this.splitWhitespace(header);
    let theme = "";
    if ( parts.length > 2 ) {
      this.errors.push("@vars takes at most a theme name: " + header);
      return;
    }
    if ( parts.length == 2 ) {
      theme = parts[1];
    }
    const decls = this.parseDeclarations(body);
    let i = 0;
    while (i < decls.length) {
      const d = decls[i];
      if ( this.startsWith(d.name, "--") == false ) {
        this.errors.push("Only custom properties belong in @vars: " + d.name);
      } else {
        this.varThemes.push(theme);
        this.varMedia.push(cond);
        this.varNames.push(d.name);
        this.varValues.push(d.value);
      }
      i = i + 1;
    };
  };
  getVarCount () {
    return this.varNames.length;
  };
  lookupVar (name, theme) {
    let best = "";
    let bestScoped = false;
    let i = 0;
    const n = this.varNames.length;
    while (i < n) {
      if ( this.varNames[i] == name ) {
        const th = this.varThemes[i];
        const scoped = th.length > 0;
        let applies = true;
        if ( scoped ) {
          applies = EVGStyleSheet.themeOn(th, theme);
        }
        if ( applies ) {
          const mq = this.varMedia[i];
          applies = mq.matches(
            this.viewportW,
            this.viewportH,
            this.coarsePointer
          );
        }
        if ( applies ) {
          if ( scoped || bestScoped == false ) {
            best = this.varValues[i];
            bestScoped = scoped;
          }
        }
      }
      i = i + 1;
    };
    return best;
  };
  resolveVars (value, theme, prop) {
    let at = this.findVar(value, 0);
    if ( at < 0 ) {
      return value;
    }
    let out = value;
    let guard = 0;
    while (at >= 0) {
      guard = guard + 1;
      if ( guard > 32 ) {
        this.reportOnce("Custom property nested too deeply (a cycle?): " + prop);
        return "";
      }
      const close = this.matchParen(out, (at + 3));
      if ( close < 0 ) {
        this.reportOnce("Unclosed var(): " + value);
        return "";
      }
      const inner = out.substring(at + 4, close ).trim();
      const comma = this.findChar(inner, 0, 44);
      let name = inner;
      let fallback = "";
      let hasFallback = false;
      if ( comma >= 0 ) {
        name = inner.substring(0, comma ).trim();
        fallback = inner.substring(comma + 1, inner.length ).trim();
        hasFallback = true;
      }
      const got = this.lookupVar(name, theme);
      let repl = got;
      if ( got.length == 0 ) {
        if ( hasFallback == false ) {
          this.reportOnce((("Undefined custom property " + name) + " in: ") + prop);
          return "";
        }
        repl = fallback;
      }
      out = (out.substring(0, at ) + repl) + out.substring(close + 1, out.length );
      at = this.findVar(out, 0);
    };
    if ( prop == "transition" ) {
      const seen = ( Object.prototype.hasOwnProperty.call(this.varChecked, out) ? this.varChecked[out] : undefined );
      if ( typeof(seen) === "undefined" ) {
        this.varChecked[out] = 1;
        this.checkTransition(out);
      }
    }
    return out;
  };
  reportOnce (msg) {
    const seen = ( Object.prototype.hasOwnProperty.call(this.varReported, msg) ? this.varReported[msg] : undefined );
    if ( typeof(seen) === "undefined" ) {
      this.varReported[msg] = 1;
      this.errors.push(msg);
    }
  };
  findVar (s, from) {
    const n = s.length;
    let i = from;
    while (i + 4 <= n) {
      if ( s.charCodeAt(i ) == 118 ) {
        if ( s.charCodeAt(i + 1 ) == 97 ) {
          if ( s.charCodeAt(i + 2 ) == 114 ) {
            if ( s.charCodeAt(i + 3 ) == 40 ) {
              return i;
            }
          }
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  matchParen (s, open) {
    const n = s.length;
    let depth = 0;
    let i = open;
    while (i < n) {
      const c = s.charCodeAt(i );
      if ( c == 40 ) {
        depth = depth + 1;
      }
      if ( c == 41 ) {
        depth = depth - 1;
        if ( depth == 0 ) {
          return i;
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  addRuleForSelector (sel, decls) {
    const parts = this.splitWhitespace(sel);
    const n = parts.length;
    if ( n == 1 ) {
      const whole = parts[0];
      const bits = this.splitPseudo(whole);
      const only = bits[0];
      const pseudoName = bits[1];
      if ( this.isClassToken(only) == false ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      let code = 0;
      if ( pseudoName.length > 0 ) {
        code = EVGPseudo.parse(pseudoName);
        if ( code < 0 ) {
          this.errors.push("Unsupported pseudo-class (hover, focus, active, disabled): " + sel);
          return;
        }
      }
      const rule = new EVGStyleRule();
      rule.className = only.substring(1, only.length );
      rule.pseudo = code;
      this.pushRule(rule, decls);
      return;
    }
    if ( n == 2 ) {
      const scope = parts[0];
      const target = parts[1];
      const targetBits = this.splitPseudo(target);
      const targetOnly = targetBits[0];
      if ( this.isClassToken(scope) == false || this.isClassToken(targetOnly) == false ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const scopeName = scope.substring(1, scope.length );
      if ( this.startsWith(scopeName, "theme-") == false ) {
        this.errors.push("Descendant selectors are only supported as `.theme-<name> .class`: " + sel);
        return;
      }
      const bits2 = this.splitPseudo(target);
      const targetClass = bits2[0];
      const pseudo2 = bits2[1];
      let code2 = 0;
      if ( pseudo2.length > 0 ) {
        code2 = EVGPseudo.parse(pseudo2);
        if ( code2 < 0 ) {
          this.errors.push("Unsupported pseudo-class (hover, focus, active, disabled): " + sel);
          return;
        }
      }
      const rule2 = new EVGStyleRule();
      rule2.theme = scopeName.substring(6, scopeName.length );
      rule2.className = targetClass.substring(1, targetClass.length );
      rule2.pseudo = code2;
      this.pushRule(rule2, decls);
      return;
    }
    this.errors.push("Unsupported selector (too many parts): " + sel);
  };
  pushRule (rule, decls) {
    let keep = [];
    let k = 0;
    while (k < decls.length) {
      const d = decls[k];
      if ( this.startsWith(d.name, "--") ) {
        this.errors.push((("Custom properties are declared in @vars, not on ." + rule.className) + ": ") + d.name);
      } else {
        keep.push(d);
      }
      k = k + 1;
    };
    rule.decls = keep;
    rule.media = this.pendingMedia;
    rule.order = this.ruleCounter;
    this.ruleCounter = this.ruleCounter + 1;
    this.rules.push(rule);
  };
  splitPseudo (tok) {
    let out = [];
    const at = this.findChar(tok, 0, 58);
    if ( at < 0 ) {
      out.push(tok);
      out.push("");
      return out;
    }
    out.push(tok.substring(0, at ));
    out.push(tok.substring(at + 1, tok.length ));
    return out;
  };
  isClassToken (tok) {
    if ( tok.length < 2 ) {
      return false;
    }
    return tok.charCodeAt(0 ) == 46;
  };
  startsWith (s, prefix) {
    const pl = prefix.length;
    if ( s.length < pl ) {
      return false;
    }
    return s.substring(0, pl ) == prefix;
  };
  parseDeclarations (body) {
    let out = [];
    const parts = this.splitOn(body, 59);
    let i = 0;
    while (i < parts.length) {
      const part = parts[i].trim();
      if ( part.length > 0 ) {
        const colon = this.findChar(part, 0, 58);
        if ( colon < 0 ) {
          this.errors.push("Declaration without ':' ignored: " + part);
        } else {
          const d = new EVGStyleDecl();
          d.name = part.substring(0, colon ).trim();
          d.value = this.unquote(part.substring(colon + 1, part.length ).trim());
          if ( d.name.length > 0 && d.value.length > 0 ) {
            if ( d.name == "transition" ) {
              if ( this.findVar(d.value, 0) < 0 ) {
                this.checkTransition(d.value);
              }
            }
            out.push(d);
          } else {
            this.errors.push("Incomplete declaration ignored: " + part);
          }
        }
      }
      i = i + 1;
    };
    return out;
  };
  checkTransition (value) {
    const parts = EVGEasing.splitTop(value, 44);
    let i = 0;
    while (i < parts.length) {
      const words = EVGEasing.splitWordsTop(parts[i].trim());
      let w = 0;
      while (w < words.length) {
        const word = words[w];
        if ( EVGEasing.looksLikeFunction(word) ) {
          const e = EVGEasing.parse(word);
          if ( e.ok == false ) {
            this.errors.push("Unsupported timing function (linear, ease, ease-in, ease-out, ease-in-out, step-start, step-end, cubic-bezier(), steps()): " + word);
          }
        }
        w = w + 1;
      };
      i = i + 1;
    };
  };
  unquote (s) {
    const __len = s.length;
    if ( __len < 2 ) {
      return s;
    }
    const first = s.charCodeAt(0 );
    const last = s.charCodeAt(__len - 1 );
    if ( first == 34 && last == 34 || first == 39 && last == 39 ) {
      let inner = 1;
      while (inner < __len - 1) {
        if ( s.charCodeAt(inner ) == first ) {
          return s;
        }
        inner = inner + 1;
      };
      return s.substring(1, __len - 1 );
    }
    return s;
  };
  splitOn (s, sep) {
    let out = [];
    const __len = s.length;
    let start = 0;
    let i = 0;
    while (i < __len) {
      if ( s.charCodeAt(i ) == sep ) {
        out.push(s.substring(start, i ));
        start = i + 1;
      }
      i = i + 1;
    };
    out.push(s.substring(start, __len ));
    return out;
  };
  splitWhitespace (s) {
    let out = [];
    const __len = s.length;
    let start = 0;
    let inTok = false;
    let i = 0;
    while (i < __len) {
      const c = s.charCodeAt(i );
      const isSpace = (c == 32 || c == 9) || (c == 10 || c == 13);
      if ( isSpace ) {
        if ( inTok ) {
          out.push(s.substring(start, i ));
          inTok = false;
        }
      } else {
        if ( inTok == false ) {
          start = i;
          inTok = true;
        }
      }
      i = i + 1;
    };
    if ( inTok ) {
      out.push(s.substring(start, __len ));
    }
    return out;
  };
  applyTreeIn (root, theme, w, h, coarse) {
    this.setViewport(w, h, coarse);
    this.applyTree(root, theme);
  };
  applyTree (root, theme) {
    this.passSkipped = 0;
    this.passStyled = 0;
    this.passLayoutDirty = 0;
    this.passPaintDirty = 0;
    this.applyIn(root, theme);
  };
  layoutClean () {
    return this.passLayoutDirty == 0;
  };
  nothingChanged () {
    return this.passLayoutDirty + this.passPaintDirty == 0;
  };
  applyIn (root, theme) {
    const before = this.passLayoutDirty;
    const beforePaint = this.passPaintDirty;
    this.applyTo(root, theme);
    const ownClean = this.passLayoutDirty == before;
    const ownPaintClean = this.passPaintDirty == beforePaint && ownClean;
    let kidsClean = true;
    let kidsPaintClean = true;
    let i = 0;
    const n = root.getChildCount();
    while (i < n) {
      const kid = root.getChild(i);
      this.applyIn(kid, theme);
      if ( kid.layoutClean == false ) {
        kidsClean = false;
      }
      if ( kid.paintClean == false ) {
        kidsPaintClean = false;
      }
      i = i + 1;
    };
    root.layoutClean = (ownClean && kidsClean) && root.hasLayout;
    root.paintClean = ownPaintClean && kidsPaintClean;
    if ( root.paintClean == false ) {
      root.paintStamp = root.paintStamp + 1;
    }
  };
  applyTo (el, theme) {
    if ( el.className.length == 0 ) {
      return;
    }
    const bits = EVGStyleSheet.stateBits(el);
    if ( (((el.styleGen == this.generation && el.styleBits == bits) && el.styleKids == el.children.length) && el.styleTheme == theme) && el.styleClass == el.className ) {
      this.passSkipped = this.passSkipped + 1;
      return;
    }
    const key = (((el.className + "|") + theme) + "|") + (bits.toString());
    const at = ( Object.prototype.hasOwnProperty.call(this.planIndex, key) ? this.planIndex[key] : undefined );
    let slot = 0;
    if ( typeof(at) === "undefined" ) {
      slot = this.buildPlan(el, theme, key);
      this.planMisses = this.planMisses + 1;
    } else {
      slot = at;
      this.planHits = this.planHits + 1;
    }
    this.passStyled = this.passStyled + 1;
    let layoutMoved = true;
    if ( (el.styleSlot >= 0 && el.styleGen == this.generation) && el.styleKids == el.children.length ) {
      if ( el.inlineProps.length == 0 ) {
        if ( this.planLayoutSig[el.styleSlot] == this.planLayoutSig[slot] ) {
          layoutMoved = false;
        }
      }
    }
    if ( layoutMoved ) {
      this.passLayoutDirty = this.passLayoutDirty + 1;
    } else {
      this.passPaintDirty = this.passPaintDirty + 1;
    }
    el.styleClass = el.className;
    el.styleTheme = theme;
    el.styleBits = bits;
    el.styleGen = this.generation;
    el.styleSlot = slot;
    el.styleKids = el.children.length;
    const from = this.planStart[slot];
    const n = this.planCount[slot];
    let i = 0;
    while (i < n) {
      const name = this.planNames[(from + i)];
      if ( el.hasInline(name) == false ) {
        el.setAttribute(name, this.planValues[(from + i)]);
      }
      i = i + 1;
    };
  };
  applyToDirect (el, theme) {
    if ( el.className.length == 0 ) {
      return;
    }
    const classes = this.splitWhitespace(el.className);
    this.clearStateProps(el, classes, theme);
    this.applyGroup(el, classes, theme, false, false);
    this.applyGroup(el, classes, theme, true, false);
    this.applyGroup(el, classes, theme, false, true);
    this.applyGroup(el, classes, theme, true, true);
  };
  applyTreeDirect (root, theme) {
    this.applyToDirect(root, theme);
    let i = 0;
    const n = root.getChildCount();
    while (i < n) {
      this.applyTreeDirect(root.getChild(i), theme);
      i = i + 1;
    };
  };
  buildPlan (el, theme, key) {
    const classes = this.splitWhitespace(el.className);
    const from = this.planNames.length;
    this.planStateClears(classes, theme);
    this.planGroup(el, classes, theme, false, false);
    this.planGroup(el, classes, theme, true, false);
    this.planGroup(el, classes, theme, false, true);
    this.planGroup(el, classes, theme, true, true);
    const slot = this.planStart.length;
    this.planStart.push(from);
    const count = this.planNames.length - from;
    this.planCount.push(count);
    let sig = "";
    let k = 0;
    while (k < count) {
      const nm = this.planNames[(from + k)];
      if ( EVGStyleSheet.isLayoutProperty(nm) ) {
        sig = (((sig + nm) + ":") + this.planValues[(from + k)]) + ";";
      }
      k = k + 1;
    };
    this.planLayoutSig.push(sig);
    this.planIndex[key] = slot;
    return slot;
  };
  planStateClears (classes, theme) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      if ( rule.pseudo != 0 ) {
        let applies = true;
        if ( rule.isThemeScoped() ) {
          applies = EVGStyleSheet.themeOn(rule.theme, theme);
        }
        if ( applies ) {
          applies = rule.media.matches(
            this.viewportW,
            this.viewportH,
            this.coarsePointer
          );
        }
        if ( applies ) {
          applies = this.matchesClass(classes, rule.className);
        }
        if ( applies ) {
          let d = 0;
          while (d < rule.decls.length) {
            const decl = rule.decls[d];
            const init = EVGStyleSheet.initialValue(decl.name);
            if ( init.length > 0 ) {
              this.planNames.push(decl.name);
              this.planValues.push(init);
              this.planRules.push(0 - 1);
            }
            d = d + 1;
          };
        }
      }
      i = i + 1;
    };
  };
  planGroup (el, classes, theme, themeScoped, stateful) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      const isStateful = rule.pseudo != 0;
      if ( isStateful == stateful && rule.isThemeScoped() == themeScoped ) {
        let applies = true;
        if ( themeScoped ) {
          applies = EVGStyleSheet.themeOn(rule.theme, theme);
        }
        if ( applies ) {
          applies = rule.media.matches(
            this.viewportW,
            this.viewportH,
            this.coarsePointer
          );
        }
        if ( applies ) {
          applies = EVGPseudo.holds(rule.pseudo, el);
        }
        if ( applies ) {
          if ( this.matchesClass(classes, rule.className) ) {
            let d = 0;
            while (d < rule.decls.length) {
              const decl = rule.decls[d];
              const v = this.resolveVars(decl.value, theme, decl.name);
              if ( v.length > 0 ) {
                this.planNames.push(decl.name);
                this.planValues.push(v);
                this.planRules.push(i);
              }
              d = d + 1;
            };
          }
        }
      }
      i = i + 1;
    };
  };
  clearStateProps (el, classes, theme) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      if ( rule.pseudo != 0 ) {
        let applies = true;
        if ( rule.isThemeScoped() ) {
          applies = EVGStyleSheet.themeOn(rule.theme, theme);
        }
        if ( applies ) {
          applies = rule.media.matches(
            this.viewportW,
            this.viewportH,
            this.coarsePointer
          );
        }
        if ( applies ) {
          applies = this.matchesClass(classes, rule.className);
        }
        if ( applies ) {
          let d = 0;
          while (d < rule.decls.length) {
            const decl = rule.decls[d];
            const init = EVGStyleSheet.initialValue(decl.name);
            if ( init.length > 0 ) {
              if ( el.hasInline(decl.name) == false ) {
                el.setAttribute(decl.name, init);
              }
            }
            d = d + 1;
          };
        }
      }
      i = i + 1;
    };
  };
  applyGroup (el, classes, theme, themeScoped, stateful) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      const isStateful = rule.pseudo != 0;
      if ( isStateful == stateful && rule.isThemeScoped() == themeScoped ) {
        let applies = true;
        if ( themeScoped ) {
          applies = EVGStyleSheet.themeOn(rule.theme, theme);
        }
        if ( applies ) {
          applies = rule.media.matches(
            this.viewportW,
            this.viewportH,
            this.coarsePointer
          );
        }
        if ( applies ) {
          applies = EVGPseudo.holds(rule.pseudo, el);
        }
        if ( applies ) {
          if ( this.matchesClass(classes, rule.className) ) {
            this.applyDecls(el, rule, theme);
          }
        }
      }
      i = i + 1;
    };
  };
  matchesClass (classes, want) {
    let i = 0;
    while (i < classes.length) {
      if ( classes[i] == want ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  applyDecls (el, rule, theme) {
    let i = 0;
    while (i < rule.decls.length) {
      const d = rule.decls[i];
      if ( el.hasInline(d.name) == false ) {
        const v = this.resolveVars(d.value, theme, d.name);
        if ( v.length > 0 ) {
          el.setAttribute(d.name, v);
          el.markCss(d.name);
        }
      }
      i = i + 1;
    };
  };
  toText () {
    let out = EVGStyleSheet.sheetHeader() + "\n";
    // Loop start
    for ( const r of this.rules) {
      let line = "R\t" + (EVGStyleSheet.escText(r.theme) + "\t");
      line = line + (EVGStyleSheet.escText(r.className) + "\t");
      line = line + ((r.pseudo.toString()) + "\t");
      line = line + ((r.order.toString()) + "\t");
      line = line + EVGStyleSheet.writeMedia(r.media);
      out = out + (line + "\n");
      // Loop start
      for ( const d of r.decls) {
        const dl = ("D\t" + EVGStyleSheet.escText(d.name)) + ("\t" + EVGStyleSheet.escText(d.value));
        out = out + (dl + "\n");
      }
    }
    const vn = this.varNames.length;
    let k = 0;
    while (k < vn) {
      let line_1 = "V\t" + (EVGStyleSheet.escText(this.varThemes[k]) + "\t");
      line_1 = line_1 + (EVGStyleSheet.escText(this.varNames[k]) + "\t");
      line_1 = line_1 + (EVGStyleSheet.escText(this.varValues[k]) + "\t");
      line_1 = line_1 + EVGStyleSheet.writeMedia(this.varMedia[k]);
      out = out + (line_1 + "\n");
      k = k + 1;
    };
    return out;
  };
  loadText (text) {
    if ( EVGStyleSheet.isSheetText(text) == false ) {
      return false;
    }
    this.dropPlans();
    const lines = this.splitOn(text, 10);
    let current;
    // Loop start
    for ( const line of lines) {
      if ( line.length == 0 ) {
        continue;
      }
      const parts = this.splitOn(line, 9);
      const kind = parts[0];
      if ( kind == "R" ) {
        if ( parts.length < 12 ) {
          continue;
        }
        const r = new EVGStyleRule();
        r.theme = EVGStyleSheet.unescText(parts[1]);
        r.className = EVGStyleSheet.unescText(parts[2]);
        r.pseudo = EVGStyleSheet.readInt(parts[3]);
        r.order = EVGStyleSheet.readInt(parts[4]);
        r.media = EVGStyleSheet.readMedia(parts, 5);
        this.rules.push(r);
        current = r;
        if ( r.order >= this.ruleCounter ) {
          this.ruleCounter = r.order + 1;
        }
        continue;
      }
      if ( kind == "D" ) {
        if ( parts.length < 3 ) {
          continue;
        }
        if ( typeof(current) != "undefined" ) {
          const d = new EVGStyleDecl();
          d.name = EVGStyleSheet.unescText(parts[1]);
          d.value = EVGStyleSheet.unescText(parts[2]);
          const owner = current;
          owner.decls.push(d);
        }
        continue;
      }
      if ( kind == "V" ) {
        if ( parts.length < 11 ) {
          continue;
        }
        this.varThemes.push(EVGStyleSheet.unescText(parts[1]));
        this.varNames.push(EVGStyleSheet.unescText(parts[2]));
        this.varValues.push(EVGStyleSheet.unescText(parts[3]));
        this.varMedia.push(EVGStyleSheet.readMedia(parts, 4));
        continue;
      }
    }
    return true;
  };
}
EVGStyleSheet.larger = function(a, b) {
  if ( a < 0.0 ) {
    return b;
  }
  if ( b < 0.0 ) {
    return a;
  }
  if ( a > b ) {
    return a;
  }
  return b;
};
EVGStyleSheet.smaller = function(a, b) {
  if ( a < 0.0 ) {
    return b;
  }
  if ( b < 0.0 ) {
    return a;
  }
  if ( a < b ) {
    return a;
  }
  return b;
};
EVGStyleSheet.themeOn = function(ruleTheme, active) {
  if ( ruleTheme == active ) {
    return true;
  }
  if ( ruleTheme.length == 0 ) {
    return false;
  }
  const n = active.length;
  let start = 0;
  let i = 0;
  while (i <= n) {
    let sep = i == n;
    if ( sep == false ) {
      sep = active.charCodeAt(i ) == 32;
    }
    if ( sep ) {
      if ( i > start ) {
        if ( active.substring(start, i ) == ruleTheme ) {
          return true;
        }
      }
      start = i + 1;
    }
    i = i + 1;
  };
  return false;
};
EVGStyleSheet.stateKey = function(el) {
  let out = "....";
  if ( el.isHovered ) {
    out = "h" + out.substring(1, 4 );
  }
  if ( el.isFocused ) {
    out = (out.substring(0, 1 ) + "f") + out.substring(2, 4 );
  }
  if ( el.isPressed ) {
    out = (out.substring(0, 2 ) + "a") + out.substring(3, 4 );
  }
  if ( el.a11yDisabled ) {
    out = out.substring(0, 3 ) + "d";
  }
  return out;
};
EVGStyleSheet.stateBits = function(el) {
  let b = 0;
  if ( el.isHovered ) {
    b = b + 1;
  }
  if ( el.isFocused ) {
    b = b + 2;
  }
  if ( el.isPressed ) {
    b = b + 4;
  }
  if ( el.a11yDisabled ) {
    b = b + 8;
  }
  return b;
};
EVGStyleSheet.initialValue = function(name) {
  if ( name == "transform" ) {
    return "none";
  }
  if ( name == "transform-origin" ) {
    return "50% 50%";
  }
  if ( name == "transformOrigin" ) {
    return "50% 50%";
  }
  if ( name == "opacity" ) {
    return "1";
  }
  if ( name == "background-color" ) {
    return "transparent";
  }
  if ( name == "backgroundColor" ) {
    return "transparent";
  }
  if ( name == "rotate" ) {
    return "0";
  }
  if ( name == "scale" ) {
    return "1";
  }
  return "";
};
EVGStyleSheet.isLayoutProperty = function(name) {
  if ( name == "color" ) {
    return false;
  }
  if ( name == "background-color" ) {
    return false;
  }
  if ( name == "backgroundColor" ) {
    return false;
  }
  if ( name == "border-color" ) {
    return false;
  }
  if ( name == "borderColor" ) {
    return false;
  }
  if ( name == "fill" ) {
    return false;
  }
  if ( name == "stroke" ) {
    return false;
  }
  if ( name == "opacity" ) {
    return false;
  }
  if ( name == "border-radius" ) {
    return false;
  }
  if ( name == "borderRadius" ) {
    return false;
  }
  if ( name == "transform" ) {
    return false;
  }
  if ( name == "transform-origin" ) {
    return false;
  }
  if ( name == "transformOrigin" ) {
    return false;
  }
  if ( name == "rotate" ) {
    return false;
  }
  if ( name == "scale" ) {
    return false;
  }
  if ( name == "box-shadow" ) {
    return false;
  }
  if ( name == "shadow-color" ) {
    return false;
  }
  if ( name == "background-gradient" ) {
    return false;
  }
  if ( name == "backdrop-filter" ) {
    return false;
  }
  if ( name == "cursor" ) {
    return false;
  }
  if ( name == "transition" ) {
    return false;
  }
  if ( name == "scrollbar-width" ) {
    return false;
  }
  if ( name == "scrollbar-color" ) {
    return false;
  }
  if ( name == "evg-scrollbar-label" ) {
    return false;
  }
  return true;
};
EVGStyleSheet.sheetHeader = function() {
  return "evg-sheet 1";
};
EVGStyleSheet.escChar = function(c, piece) {
  if ( c == 92 ) {
    return "\\\\";
  }
  if ( c == 9 ) {
    return "\\t";
  }
  if ( c == 10 ) {
    return "\\n";
  }
  if ( c == 13 ) {
    return "\\r";
  }
  return piece;
};
EVGStyleSheet.needsEscape = function(s) {
  const __len = s.length;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    if ( (c == 92 || c == 9) || (c == 10 || c == 13) ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
EVGStyleSheet.escText = function(s) {
  if ( EVGStyleSheet.needsEscape(s) == false ) {
    return s;
  }
  let out = "";
  const __len = s.length;
  let i = 0;
  while (i < __len) {
    out = out + EVGStyleSheet.escChar(s.charCodeAt(i ), s.substring(i, i + 1 ));
    i = i + 1;
  };
  return out;
};
EVGStyleSheet.hasBackslash = function(s) {
  const __len = s.length;
  let i = 0;
  while (i < __len) {
    if ( s.charCodeAt(i ) == 92 ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
EVGStyleSheet.unescText = function(s) {
  if ( EVGStyleSheet.hasBackslash(s) == false ) {
    return s;
  }
  let out = "";
  const __len = s.length;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    if ( c == 92 ) {
      if ( i + 1 < __len ) {
        const n = s.charCodeAt(i + 1 );
        if ( n == 92 ) {
          out = out + "\\";
        }
        if ( n == 116 ) {
          out = out + "\t";
        }
        if ( n == 110 ) {
          out = out + "\n";
        }
        if ( n == 114 ) {
          out = out + "\r";
        }
        i = i + 2;
      } else {
        i = i + 1;
      }
    } else {
      out = out + s.substring(i, i + 1 );
      i = i + 1;
    }
  };
  return out;
};
EVGStyleSheet.readNum = function(s) {
  const t = s.trim();
  if ( t.length == 0 ) {
    return 0.0;
  }
  const neg = t.charCodeAt(0 ) == 45;
  let digits = t;
  if ( neg ) {
    digits = t.substring(1, t.length );
  }
  const v = isNaN( parseFloat(digits) ) ? undefined : parseFloat(digits);
  if ( typeof(v) != "undefined" ) {
    if ( neg ) {
      return 0.0 - v;
    }
    return v;
  }
  return 0.0;
};
EVGStyleSheet.readInt = function(s) {
  return Math.floor( EVGStyleSheet.readNum(s));
};
EVGStyleSheet.writeMedia = function(m) {
  let out = (m.minWidth.toString()) + "\t";
  out = out + ((m.maxWidth.toString()) + "\t");
  out = out + ((m.minHeight.toString()) + "\t");
  out = out + ((m.maxHeight.toString()) + "\t");
  out = out + (EVGStyleSheet.escText(m.orientation) + "\t");
  out = out + ((m.pointer.toString()) + "\t");
  if ( m.broken ) {
    return out + "1";
  }
  return out + "0";
};
EVGStyleSheet.readMedia = function(parts, at) {
  const m = new EVGMediaQuery();
  m.minWidth = EVGStyleSheet.readNum(parts[at]);
  m.maxWidth = EVGStyleSheet.readNum(parts[(at + 1)]);
  m.minHeight = EVGStyleSheet.readNum(parts[(at + 2)]);
  m.maxHeight = EVGStyleSheet.readNum(parts[(at + 3)]);
  m.orientation = EVGStyleSheet.unescText(parts[(at + 4)]);
  m.pointer = EVGStyleSheet.readInt(parts[(at + 5)]);
  m.broken = parts[(at + 6)] == "1";
  return m;
};
EVGStyleSheet.isSheetText = function(text) {
  const h = EVGStyleSheet.sheetHeader();
  const n = h.length;
  if ( text.length < n ) {
    return false;
  }
  return text.substring(0, n ) == h;
};
class EVGGrapheme  {
  constructor() {
  }
}
EVGGrapheme.isZWJ = function(cp) {
  return cp == 8205;
};
EVGGrapheme.isRegionalIndicator = function(cp) {
  if ( cp < 127462 ) {
    return false;
  }
  return cp <= 127487;
};
EVGGrapheme.isEmojiModifier = function(cp) {
  if ( cp < 127995 ) {
    return false;
  }
  return cp <= 127999;
};
EVGGrapheme.isTag = function(cp) {
  if ( cp < 917536 ) {
    return false;
  }
  return cp <= 917631;
};
EVGGrapheme.isExtend = function(cp) {
  if ( cp >= 768 && cp <= 879 ) {
    return true;
  }
  if ( cp >= 6832 && cp <= 6911 ) {
    return true;
  }
  if ( cp >= 7616 && cp <= 7679 ) {
    return true;
  }
  if ( cp >= 8400 && cp <= 8447 ) {
    return true;
  }
  if ( cp >= 65024 && cp <= 65039 ) {
    return true;
  }
  if ( cp >= 65056 && cp <= 65071 ) {
    return true;
  }
  if ( EVGGrapheme.isEmojiModifier(cp) ) {
    return true;
  }
  return EVGGrapheme.isTag(cp);
};
EVGGrapheme.clusterEnd = function(cps, start) {
  const n = cps.length;
  if ( start >= n ) {
    return n;
  }
  let i = start + 1;
  if ( EVGGrapheme.isRegionalIndicator(cps[start]) ) {
    if ( i < n ) {
      if ( EVGGrapheme.isRegionalIndicator(cps[i]) ) {
        i = i + 1;
      }
    }
    return i;
  }
  let more = true;
  while (more) {
    more = false;
    if ( i < n ) {
      const cp = cps[i];
      if ( EVGGrapheme.isExtend(cp) ) {
        i = i + 1;
        more = true;
      } else {
        if ( EVGGrapheme.isZWJ(cp) ) {
          if ( i + 1 < n ) {
            i = i + 2;
            more = true;
          }
        }
      }
    }
  };
  return i;
};
EVGGrapheme.boundaries = function(cps) {
  let out = [];
  let i = 0;
  const n = cps.length;
  while (i < n) {
    out.push(i);
    i = EVGGrapheme.clusterEnd(cps, i);
  };
  out.push(n);
  return out;
};
EVGGrapheme.clusterCount = function(s) {
  const cps = EVGCodepoint.toArray(s);
  let n = 0;
  let i = 0;
  while (i < cps.length) {
    i = EVGGrapheme.clusterEnd(cps, i);
    n = n + 1;
  };
  return n;
};
EVGGrapheme.clusterAt = function(s, i) {
  const cps = EVGCodepoint.toArray(s);
  let cpIdx = 0;
  let u = 0;
  while (u < i) {
    u = u + EVGCodepoint.unitsAt(s, u);
    cpIdx = cpIdx + 1;
  };
  const end = EVGGrapheme.clusterEnd(cps, cpIdx);
  let out = "";
  let k = cpIdx;
  while (k < end) {
    out = out + EVGCodepoint.toStr(cps[k]);
    k = k + 1;
  };
  return out;
};
class EVGTextMetrics  {
  constructor() {
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
  }
}
EVGTextMetrics.create = function(w, h) {
  const m = new EVGTextMetrics();
  m.width = w;
  m.height = h;
  return m;
};
class EVGTextMeasurer  {
  constructor() {
    this.advTable = [];
    this.monoTable = [];
    this.latinTable = [];
    this.punctTable = [];
    this.tablesReady = false;
    this.monoFamily = "";
    this.monoKnown = false;
    this.monoCached = false;
    this.boldCached = false;
    this.boldTable = [];
    this.boldLatinTable = [];
    this.boldPunctTable = [];
  }
  isFontAccurate () {
    return false;
  };
  hasFace (fontFamily) {
    return false;
  };
  measureKey () {
    return "";
  };
  measureText (text, fontFamily, fontSize) {
    const avgCharWidth = fontSize * 0.55;
    const textLen = text.length;
    const width = textLen * avgCharWidth;
    const lineHeight = fontSize * EVGTextMeasurer.normalLineHeightEm();
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * EVGTextMeasurer.fallbackAscentEm();
    metrics.descent = fontSize * EVGTextMeasurer.fallbackDescentEm();
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    const metrics = this.measureText(text, fontFamily, fontSize);
    return metrics.width;
  };
  getLineHeight (fontFamily, fontSize) {
    return fontSize * EVGTextMeasurer.normalLineHeightEm();
  };
  monoFor (fontFamily) {
    if ( this.monoKnown ) {
      if ( this.monoFamily == fontFamily ) {
        return this.monoCached;
      }
    }
    this.monoFamily = fontFamily;
    this.monoCached = EVGTextMeasurer.isMono(fontFamily);
    this.boldCached = EVGTextMeasurer.isBold(fontFamily);
    this.monoKnown = true;
    return this.monoCached;
  };
  prepareTables () {
    this.advTable = EVGTextMeasurer.advanceEm();
    this.monoTable = EVGTextMeasurer.monoAdvanceEm();
    this.latinTable = EVGTextMeasurer.latin1Em();
    this.punctTable = EVGTextMeasurer.punctEm();
    this.boldTable = EVGTextMeasurer.boldAdvanceEm();
    this.boldLatinTable = EVGTextMeasurer.boldLatin1Em();
    this.boldPunctTable = EVGTextMeasurer.boldPunctEm();
    this.tablesReady = true;
  };
  measureChar (ch, fontFamily, fontSize) {
    if ( this.tablesReady == false ) {
      this.prepareTables();
    }
    const mono = this.monoFor(fontFamily);
    const bold = this.boldCached;
    if ( ch == 8364 ) {
      if ( mono ) {
        return EVGTextMeasurer.monoEuroEm() * fontSize;
      }
      return EVGTextMeasurer.euroEm() * fontSize;
    }
    if ( ch >= 32 && ch <= 126 ) {
      let t = this.advTable;
      if ( mono ) {
        t = this.monoTable;
      } else {
        if ( bold ) {
          t = this.boldTable;
        }
      }
      return t[(ch - 32)] * fontSize;
    }
    if ( ch == 173 ) {
      return 0.0;
    }
    if ( mono ) {
      if ( ch >= 160 && ch <= 255 || ch >= 8208 && ch <= 8230 ) {
        return EVGTextMeasurer.monoEuroEm() * fontSize;
      }
      if ( EVGTextMeasurer.extraEm(ch) >= 0.0 ) {
        return EVGTextMeasurer.monoEuroEm() * fontSize;
      }
    }
    if ( ch >= 160 && ch <= 255 ) {
      if ( bold ) {
        return this.boldLatinTable[(ch - 160)] * fontSize;
      }
      return this.latinTable[(ch - 160)] * fontSize;
    }
    if ( ch >= 8208 && ch <= 8230 ) {
      if ( bold ) {
        return this.boldPunctTable[(ch - 8208)] * fontSize;
      }
      return this.punctTable[(ch - 8208)] * fontSize;
    }
    const extra = EVGTextMeasurer.extraEm(ch);
    if ( extra >= 0.0 ) {
      return extra * fontSize;
    }
    if ( ch >= 55296 && ch <= 56319 ) {
      if ( ch == 55357 ) {
        return fontSize * 1.25;
      }
      return fontSize * 1.25;
    }
    if ( ch >= 56320 && ch <= 57343 ) {
      return 0.0;
    }
    if ( ch == 8205 ) {
      return 0.0;
    }
    if ( ch == 65039 ) {
      return 0.0;
    }
    return fontSize * 0.5;
  };
  wrapText (text, fontFamily, fontSize, maxWidth) {
    let lines = [];
    let currentLine = "";
    let currentWidth = 0.0;
    let wordStart = 0;
    let joiner = " ";
    const textLen = text.length;
    let i = 0;
    while (i <= textLen) {
      let ch = 0;
      const isEnd = i == textLen;
      if ( isEnd == false ) {
        ch = text.charCodeAt(i );
      }
      let isWordEnd = false;
      if ( isEnd ) {
        isWordEnd = true;
      }
      if ( ch == 32 ) {
        isWordEnd = true;
      }
      if ( ch == 10 ) {
        isWordEnd = true;
      }
      let hyphen = false;
      if ( isEnd == false ) {
        if ( EVGCodepoint.breaksAfter(ch) ) {
          if ( i > wordStart ) {
            isWordEnd = true;
            hyphen = true;
          }
        }
      }
      if ( isWordEnd ) {
        let wordEnd = i;
        if ( hyphen ) {
          wordEnd = i + 1;
        }
        let word = "";
        if ( wordEnd > wordStart ) {
          word = text.substring(wordStart, wordEnd );
        }
        const wordWidth = this.measureTextWidth(word, fontFamily, fontSize);
        let spaceWidth = 0.0;
        if ( currentLine.length > 0 ) {
          if ( joiner.length > 0 ) {
            spaceWidth = this.measureTextWidth(joiner, fontFamily, fontSize);
          }
        }
        if ( (currentWidth + spaceWidth) + wordWidth <= maxWidth ) {
          if ( currentLine.length > 0 ) {
            currentLine = currentLine + joiner;
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = currentLine + word;
          currentWidth = currentWidth + wordWidth;
        } else {
          if ( currentLine.length > 0 ) {
            lines.push(currentLine);
          }
          currentLine = word;
          currentWidth = wordWidth;
        }
        if ( ch == 10 ) {
          lines.push(currentLine);
          currentLine = "";
          currentWidth = 0.0;
        }
        joiner = " ";
        if ( hyphen ) {
          joiner = "";
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if ( currentLine.length > 0 ) {
      lines.push(currentLine);
    }
    return lines;
  };
}
EVGTextMeasurer.fallbackAscentEm = function() {
  return 0.905;
};
EVGTextMeasurer.fallbackDescentEm = function() {
  return 0.212;
};
EVGTextMeasurer.normalLineHeightEm = function() {
  return 1.15;
};
EVGTextMeasurer.boldAdvanceEm = function() {
  return [0.27783, 0.33301, 0.47412, 0.55615, 0.55615, 0.88916, 0.72217, 0.23779, 0.33301, 0.33301, 0.38916, 0.58398, 0.27783, 0.33301, 0.27783, 0.27783, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.33301, 0.33301, 0.58398, 0.58398, 0.58398, 0.61084, 0.9751, 0.72217, 0.72217, 0.72217, 0.72217, 0.66699, 0.61084, 0.77783, 0.72217, 0.27783, 0.55615, 0.72217, 0.61084, 0.83301, 0.72217, 0.77783, 0.66699, 0.77783, 0.72217, 0.66699, 0.61084, 0.72217, 0.66699, 0.94385, 0.66699, 0.66699, 0.61084, 0.33301, 0.27783, 0.33301, 0.58398, 0.55615, 0.33301, 0.55615, 0.61084, 0.55615, 0.61084, 0.55615, 0.33301, 0.61084, 0.61084, 0.27783, 0.27783, 0.55615, 0.27783, 0.88916, 0.61084, 0.61084, 0.61084, 0.61084, 0.38916, 0.55615, 0.33301, 0.61084, 0.55615, 0.77783, 0.55615, 0.55615, 0.5, 0.38916, 0.27979, 0.38916, 0.58398];
};
EVGTextMeasurer.boldLatin1Em = function() {
  return [0.27783, 0.33301, 0.55615, 0.55615, 0.55615, 0.55615, 0.27979, 0.55615, 0.33301, 0.73682, 0.37012, 0.55615, 0.58398, 0.0, 0.73682, 0.55225, 0.3999, 0.54883, 0.33301, 0.33301, 0.33301, 0.57617, 0.55615, 0.33301, 0.33301, 0.33301, 0.36523, 0.55615, 0.83398, 0.83398, 0.83398, 0.61084, 0.72217, 0.72217, 0.72217, 0.72217, 0.72217, 0.72217, 1.0, 0.72217, 0.66699, 0.66699, 0.66699, 0.66699, 0.27783, 0.27783, 0.27783, 0.27783, 0.72217, 0.72217, 0.77783, 0.77783, 0.77783, 0.77783, 0.77783, 0.58398, 0.77783, 0.72217, 0.72217, 0.72217, 0.72217, 0.66699, 0.66699, 0.61084, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.88916, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.27783, 0.27783, 0.27783, 0.27783, 0.61084, 0.61084, 0.61084, 0.61084, 0.61084, 0.61084, 0.61084, 0.54883, 0.61084, 0.61084, 0.61084, 0.61084, 0.61084, 0.55615, 0.61084, 0.55615];
};
EVGTextMeasurer.boldPunctEm = function() {
  return [0.33301, 0.33301, 0.55615, 0.55615, 1.0, 1.0, 0.49756, 0.55225, 0.27783, 0.27783, 0.27783, 0.27783, 0.5, 0.5, 0.5, 0.5, 0.55615, 0.55615, 0.3501, 0.58984, 0.33447, 0.66748, 1.0];
};
EVGTextMeasurer.advanceEm = function() {
  return [0.27783, 0.27783, 0.35498, 0.55615, 0.55615, 0.88916, 0.66699, 0.19092, 0.33301, 0.33301, 0.38916, 0.58398, 0.27783, 0.33301, 0.27783, 0.27783, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.27783, 0.27783, 0.58398, 0.58398, 0.58398, 0.55615, 1.01514, 0.66699, 0.66699, 0.72217, 0.72217, 0.66699, 0.61084, 0.77783, 0.72217, 0.27783, 0.5, 0.66699, 0.55615, 0.83301, 0.72217, 0.77783, 0.66699, 0.77783, 0.72217, 0.66699, 0.61084, 0.72217, 0.66699, 0.94385, 0.66699, 0.66699, 0.61084, 0.27783, 0.27783, 0.27783, 0.46924, 0.55615, 0.33301, 0.55615, 0.55615, 0.5, 0.55615, 0.55615, 0.27783, 0.55615, 0.55615, 0.22217, 0.22217, 0.5, 0.22217, 0.83301, 0.55615, 0.55615, 0.55615, 0.55615, 0.33301, 0.5, 0.27783, 0.55615, 0.5, 0.72217, 0.5, 0.5, 0.5, 0.33398, 0.25977, 0.33398, 0.58398];
};
EVGTextMeasurer.monoAdvanceEm = function() {
  return [0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205, 0.60205];
};
EVGTextMeasurer.latin1Em = function() {
  return [0.27783, 0.33301, 0.55615, 0.55615, 0.55615, 0.55615, 0.25977, 0.55615, 0.33301, 0.73682, 0.37012, 0.55615, 0.58398, 0.0, 0.73682, 0.55225, 0.3999, 0.54883, 0.33301, 0.33301, 0.33301, 0.57617, 0.53711, 0.33301, 0.33301, 0.33301, 0.36523, 0.55615, 0.83398, 0.83398, 0.83398, 0.61084, 0.66699, 0.66699, 0.66699, 0.66699, 0.66699, 0.66699, 1.0, 0.72217, 0.66699, 0.66699, 0.66699, 0.66699, 0.27783, 0.27783, 0.27783, 0.27783, 0.72217, 0.72217, 0.77783, 0.77783, 0.77783, 0.77783, 0.77783, 0.58398, 0.77783, 0.72217, 0.72217, 0.72217, 0.72217, 0.66699, 0.66699, 0.61084, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.88916, 0.5, 0.55615, 0.55615, 0.55615, 0.55615, 0.27783, 0.27783, 0.27783, 0.27783, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.55615, 0.54883, 0.61084, 0.55615, 0.55615, 0.55615, 0.55615, 0.5, 0.55615, 0.5];
};
EVGTextMeasurer.punctEm = function() {
  return [0.33301, 0.33301, 0.55615, 0.55615, 1.0, 1.0, 0.41309, 0.55225, 0.22217, 0.22217, 0.22217, 0.22217, 0.33301, 0.33301, 0.33301, 0.33301, 0.55615, 0.55615, 0.3501, 0.59, 0.33, 0.67, 1.0];
};
EVGTextMeasurer.extraEm = function(ch) {
  if ( ch == 8249 ) {
    return 0.33301;
  }
  if ( ch == 8250 ) {
    return 0.33301;
  }
  if ( ch == 8482 ) {
    return 1.0;
  }
  if ( ch == 10003 ) {
    return 0.84;
  }
  if ( ch == 10004 ) {
    return 0.84;
  }
  if ( ch == 8242 ) {
    return 0.1875;
  }
  if ( ch == 8243 ) {
    return 0.354;
  }
  return -1.0;
};
EVGTextMeasurer.euroEm = function() {
  return 0.55615;
};
EVGTextMeasurer.monoEuroEm = function() {
  return 0.60205;
};
EVGTextMeasurer.isMono = function(fontFamily) {
  if ( fontFamily.indexOf("mono") >= 0 ) {
    return true;
  }
  if ( fontFamily.indexOf("Mono") >= 0 ) {
    return true;
  }
  if ( fontFamily.indexOf("courier") >= 0 ) {
    return true;
  }
  if ( fontFamily.indexOf("Courier") >= 0 ) {
    return true;
  }
  if ( fontFamily.indexOf("Consol") >= 0 ) {
    return true;
  }
  if ( fontFamily.indexOf("consol") >= 0 ) {
    return true;
  }
  return false;
};
EVGTextMeasurer.isBold = function(fontFamily) {
  return fontFamily.indexOf("-Bold") >= 0;
};
class SimpleTextMeasurer  extends EVGTextMeasurer {
  constructor() {
    super()
    this.charWidthRatio = 0.55;
  }
  setCharWidthRatio (ratio) {
    this.charWidthRatio = ratio;
  };
  measureText (text, fontFamily, fontSize) {
    const textLen = text.length;
    let width = 0.0;
    let i = 0;
    while (i < textLen) {
      const ch = text.charCodeAt(i );
      width = width + this.measureChar(ch, fontFamily, fontSize);
      i = i + 1;
    };
    const lineHeight = fontSize * EVGTextMeasurer.normalLineHeightEm();
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * EVGTextMeasurer.fallbackAscentEm();
    metrics.descent = fontSize * EVGTextMeasurer.fallbackDescentEm();
    metrics.lineHeight = lineHeight;
    return metrics;
  };
}
class EVGDefaultMeasurer  {
  constructor() {
    if (EVGDefaultMeasurer.__singleton_instance != null) {
      return EVGDefaultMeasurer.__singleton_instance;
    }
    this.current = undefined;
    this.installs = 0;
    EVGDefaultMeasurer.__singleton_instance = this;
  }
}
EVGDefaultMeasurer.__singleton_instance = null;
EVGDefaultMeasurer.__singleton = function() {
  if (EVGDefaultMeasurer.__singleton_instance == null) {
    EVGDefaultMeasurer.__singleton_instance = new EVGDefaultMeasurer();
  }
  return EVGDefaultMeasurer.__singleton_instance;
};
EVGDefaultMeasurer.install = function(m) {
  const r = EVGDefaultMeasurer.__singleton();
  r.current = m;
  r.installs = r.installs + 1;
};
EVGDefaultMeasurer.uninstall = function() {
  const r = EVGDefaultMeasurer.__singleton();
  let none;
  r.current = none;
};
EVGDefaultMeasurer.isInstalled = function() {
  const r = EVGDefaultMeasurer.__singleton();
  return (typeof(r.current) !== "undefined" && r.current != null ) ;
};
EVGDefaultMeasurer.measurer = function() {
  const r = EVGDefaultMeasurer.__singleton();
  if ( (typeof(r.current) !== "undefined" && r.current != null )  ) {
    return r.current;
  }
  const m = new SimpleTextMeasurer();
  return m;
};
class EVGHostTextMeasurer  extends EVGTextMeasurer {
  constructor() {
    super()
    this.metricFn = undefined;
    this.attached = false;
    this.hostName = "";
    this.generation = 0;
    this.resolvesAll = true;
    this.known = [];
    this.faceKeys = [];
    this.faceAsc = [];
    this.faceDesc = [];
    this.faceGap = [];
    this.lastKey = "";
    this.lastIdx = 0 - 1;
    this.widthCalls = 0;
    this.faceCalls = 0;
    this.fallback = new SimpleTextMeasurer();
  }
  attach (f, name) {
    this.metricFn = f;
    this.hostName = name;
    this.attached = true;
    this.invalidate();
  };
  detach () {
    this.attached = false;
    this.invalidate();
  };
  invalidate () {
    this.generation = this.generation + 1;
    let fk = [];
    this.faceKeys = fk;
    let fa = [];
    this.faceAsc = fa;
    let fd = [];
    this.faceDesc = fd;
    let fg = [];
    this.faceGap = fg;
    this.lastKey = "";
    this.lastIdx = 0 - 1;
  };
  setResolvesAll (b) {
    this.resolvesAll = b;
  };
  addKnownFamily (name) {
    if ( name.length == 0 ) {
      return;
    }
    let i = 0;
    while (i < this.known.length) {
      if ( this.known[i] == name ) {
        return;
      }
      i = i + 1;
    };
    this.known.push(name);
  };
  isAttached () {
    return this.attached;
  };
  isFontAccurate () {
    return this.attached;
  };
  hasFace (fontFamily) {
    if ( this.attached == false ) {
      return false;
    }
    if ( this.resolvesAll ) {
      return true;
    }
    const base = EVGHostTextMeasurer.baseFamily(fontFamily);
    let i = 0;
    while (i < this.known.length) {
      if ( this.known[i] == base ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  measureKey () {
    let out = (("host:" + this.hostName) + ":") + (this.generation.toString());
    if ( this.attached == false ) {
      out = out + ":table";
    }
    return out;
  };
  faceIndex (family, size, bold) {
    const key = (((family + "|") + (size.toString())) + "|") + (bold.toString());
    if ( key == this.lastKey ) {
      return this.lastIdx;
    }
    let i = 0;
    while (i < this.faceKeys.length) {
      if ( this.faceKeys[i] == key ) {
        this.lastKey = key;
        this.lastIdx = i;
        return i;
      }
      i = i + 1;
    };
    const f = this.metricFn;
    let asc = f(1, "", family, size, bold, false);
    let desc = f(2, "", family, size, bold, false);
    let gap = f(3, "", family, size, bold, false);
    this.faceCalls = this.faceCalls + 3;
    if ( gap < 0.0 ) {
      gap = 0.0;
    }
    if ( asc + desc <= 0.0 ) {
      asc = size * EVGTextMeasurer.fallbackAscentEm();
      desc = size * EVGTextMeasurer.fallbackDescentEm();
    }
    this.faceKeys.push(key);
    this.faceAsc.push(asc);
    this.faceDesc.push(desc);
    this.faceGap.push(gap);
    this.lastKey = key;
    this.lastIdx = this.faceKeys.length - 1;
    return this.lastIdx;
  };
  measureText (text, fontFamily, fontSize) {
    if ( this.attached == false ) {
      return this.fallback.measureText(text, fontFamily, fontSize);
    }
    const bold = EVGHostTextMeasurer.isBoldFace(fontFamily);
    const family = EVGHostTextMeasurer.baseFamily(fontFamily);
    const fi = this.faceIndex(family, fontSize, bold);
    let w = 0.0;
    if ( text.length > 0 ) {
      const f = this.metricFn;
      w = f(0, text, family, fontSize, bold, false);
      this.widthCalls = this.widthCalls + 1;
    }
    const asc = this.faceAsc[fi];
    const desc = this.faceDesc[fi];
    const gap = this.faceGap[fi];
    const m = new EVGTextMetrics();
    m.width = w;
    m.ascent = asc;
    m.descent = desc;
    m.lineHeight = (asc + desc) + gap;
    m.height = m.lineHeight;
    return m;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    const m = this.measureText(text, fontFamily, fontSize);
    return m.width;
  };
  getLineHeight (fontFamily, fontSize) {
    if ( this.attached == false ) {
      return this.fallback.getLineHeight(fontFamily, fontSize);
    }
    const bold = EVGHostTextMeasurer.isBoldFace(fontFamily);
    const family = EVGHostTextMeasurer.baseFamily(fontFamily);
    const fi = this.faceIndex(family, fontSize, bold);
    const asc = this.faceAsc[fi];
    const desc = this.faceDesc[fi];
    const gap = this.faceGap[fi];
    return (asc + desc) + gap;
  };
}
EVGHostTextMeasurer.KIND_WIDTH = function() {
  return 0;
};
EVGHostTextMeasurer.KIND_ASCENT = function() {
  return 1;
};
EVGHostTextMeasurer.KIND_DESCENT = function() {
  return 2;
};
EVGHostTextMeasurer.KIND_GAP = function() {
  return 3;
};
EVGHostTextMeasurer.isBoldFace = function(face) {
  const n = face.length;
  if ( n < 6 ) {
    return false;
  }
  const tail = face.substring(n - 5, n );
  return tail == "-Bold";
};
EVGHostTextMeasurer.baseFamily = function(face) {
  if ( EVGHostTextMeasurer.isBoldFace(face) ) {
    const n = face.length;
    return face.substring(0, n - 5 );
  }
  return face;
};
class EVGTextLine  {
  constructor() {
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.startsParagraph = false;
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
  }
}
class EVGWrapEntry  {
  constructor() {
    this.lines = [];
  }
}
class EVGTextEngine  {
  constructor() {
    this.measurer = undefined;
    this.strict = false;
    this.reported = [];
    this.warnings = [];
    this.hadFatal = false;
    this.wrapIndex = {};
    this.wrapStore = [];
    this.runIndex = {};
    this.runStore = [];
    this.keyPrefix = "";
    this.keyKind = "";
    this.keyFamily = "";
    this.keySize = -1.0;
    this.keyMax = -1.0;
    this.keyMeasure = "";
    const m_1 = EVGDefaultMeasurer.measurer();
    this.measurer = m_1;
    this.strict = false;
    this.hadFatal = false;
  }
  setMeasurer (m) {
    this.measurer = m;
    this.clearCache();
  };
  clearCache () {
    let wi = {};
    this.wrapIndex = wi;
    let ws = [];
    this.wrapStore = ws;
    let ri = {};
    this.runIndex = ri;
    let rs = [];
    this.runStore = rs;
  };
  cacheKey (kind, fontFamily, fontSize, maxWidth, text) {
    const mk = this.measurer.measureKey();
    let same = true;
    if ( kind != this.keyKind ) {
      same = false;
    }
    if ( fontFamily != this.keyFamily ) {
      same = false;
    }
    if ( fontSize != this.keySize ) {
      same = false;
    }
    if ( maxWidth != this.keyMax ) {
      same = false;
    }
    if ( mk != this.keyMeasure ) {
      same = false;
    }
    if ( false == same ) {
      this.keyKind = kind;
      this.keyFamily = fontFamily;
      this.keySize = fontSize;
      this.keyMax = maxWidth;
      this.keyMeasure = mk;
      this.keyPrefix = ((((((((kind + "\n") + (fontSize.toString())) + "\n") + (maxWidth.toString())) + "\n") + mk) + "\n") + fontFamily) + "\n";
    }
    return this.keyPrefix + text;
  };
  setStrict (s) {
    this.strict = s;
  };
  warningCount () {
    return this.warnings.length;
  };
  warningAt (i) {
    return this.warnings[i];
  };
  noteFamily (fontFamily) {
    let i = 0;
    while (i < this.reported.length) {
      if ( this.reported[i] == fontFamily ) {
        return;
      }
      i = i + 1;
    };
    this.reported.push(fontFamily);
    if ( this.measurer.isFontAccurate() == false ) {
      this.warnings.push(("No font metrics available for \"" + fontFamily) + "\" - measuring with heuristic widths. Print layout will not match paint.");
      if ( this.strict ) {
        this.hadFatal = true;
      }
      return;
    }
    if ( this.measurer.hasFace(fontFamily) == false ) {
      this.warnings.push(("Font face not loaded: \"" + fontFamily) + "\" - falling back to another face. Widths will not match paint.");
      if ( this.strict ) {
        this.hadFatal = true;
      }
    }
  };
  checkFamily (fontFamily) {
    if ( this.measurer.isFontAccurate() == false ) {
      this.noteFamily(fontFamily);
      return;
    }
    if ( this.measurer.hasFace(fontFamily) == false ) {
      this.noteFamily(fontFamily);
    }
  };
  measureRunSpaced (text, fontFamily, fontSize, spacing) {
    const m = this.measureRun(text, fontFamily, fontSize);
    if ( spacing == 0.0 ) {
      return m;
    }
    const wider = new EVGTextMetrics();
    wider.width = m.width + EVGTextEngine.trackingWidth(text, spacing);
    wider.height = m.height;
    wider.ascent = m.ascent;
    wider.descent = m.descent;
    wider.lineHeight = m.lineHeight;
    return wider;
  };
  measureRun (text, fontFamily, fontSize) {
    this.checkFamily(fontFamily);
    const key = this.cacheKey("m", fontFamily, fontSize, 0.0, text);
    const hit = ( Object.prototype.hasOwnProperty.call(this.runIndex, key) ? this.runIndex[key] : undefined );
    if ( typeof(hit) === "undefined" ) {
      const m = this.measurer.measureText(text, fontFamily, fontSize);
      if ( this.runStore.length >= EVGTextEngine.cacheLimit() ) {
        this.clearCache();
      }
      this.runStore.push(m);
      this.runIndex[key] = this.runStore.length - 1;
      return m;
    }
    return this.runStore[hit];
  };
  lineHeightFor (fontFamily, fontSize) {
    return this.measurer.getLineHeight(fontFamily, fontSize);
  };
  breakLines (text, fontFamily, fontSize, maxWidth) {
    return this.breakLinesSpaced(text, fontFamily, fontSize, maxWidth, 0.0);
  };
  breakLinesSpaced (text, fontFamily, fontSize, maxWidth, spacing) {
    this.checkFamily(fontFamily);
    let key = this.cacheKey("w", fontFamily, fontSize, maxWidth, text);
    if ( spacing != 0.0 ) {
      key = (key + "|ls") + (spacing.toString());
    }
    const hit = ( Object.prototype.hasOwnProperty.call(this.wrapIndex, key) ? this.wrapIndex[key] : undefined );
    if ( typeof(hit) === "undefined" ) {
      const fresh = this.wrapUncached(
        text,
        fontFamily,
        fontSize,
        maxWidth,
        spacing
      );
      if ( this.wrapStore.length >= EVGTextEngine.cacheLimit() ) {
        this.clearCache();
      }
      const entry = new EVGWrapEntry();
      entry.lines = fresh;
      this.wrapStore.push(entry);
      this.wrapIndex[key] = this.wrapStore.length - 1;
      return fresh;
    }
    const kept = this.wrapStore[hit];
    return kept.lines;
  };
  wrapUncached (text, fontFamily, fontSize, maxWidth, spacing) {
    let out = [];
    const paragraphs = text.split("\n");
    let p = 0;
    while (p < paragraphs.length) {
      const para = paragraphs[p];
      const firstOfPara = out.length;
      if ( maxWidth <= 0.0 ) {
        out.push(this.measuredLineSpaced(para, fontFamily, fontSize, spacing));
      } else {
        const words = para.split(" ");
        let currentLine = "";
        let tokensOnLine = 0;
        let w = 0;
        while (w < words.length) {
          const word = words[w];
          let testLine = "";
          if ( tokensOnLine == 0 ) {
            testLine = word;
          } else {
            testLine = (currentLine + " ") + word;
          }
          const testWidth = this.measurer.measureTextWidth(
            testLine,
            fontFamily,
            fontSize
          ) + EVGTextEngine.trackingWidth(testLine, spacing);
          if ( testWidth - maxWidth > EVGTextEngine.fitEpsilon() && tokensOnLine > 0 ) {
            out.push(this.measuredLineSpaced(
              currentLine,
              fontFamily,
              fontSize,
              spacing
            ));
            currentLine = word;
            tokensOnLine = 1;
          } else {
            currentLine = testLine;
            tokensOnLine = tokensOnLine + 1;
          }
          w = w + 1;
        };
        out.push(this.measuredLineSpaced(
          currentLine,
          fontFamily,
          fontSize,
          spacing
        ));
      }
      if ( p > 0 ) {
        if ( firstOfPara < out.length ) {
          const opener = out[firstOfPara];
          opener.startsParagraph = true;
        }
      }
      p = p + 1;
    };
    if ( out.length == 0 ) {
      out.push(this.measuredLineSpaced("", fontFamily, fontSize, spacing));
    }
    return out;
  };
  measuredLine (text, fontFamily, fontSize) {
    return this.measuredLineSpaced(text, fontFamily, fontSize, 0.0);
  };
  measuredLineSpaced (text, fontFamily, fontSize, spacing) {
    const m = this.measurer.measureText(text, fontFamily, fontSize);
    const line = new EVGTextLine();
    line.text = text;
    line.width = m.width + EVGTextEngine.trackingWidth(text, spacing);
    line.ascent = m.ascent;
    line.descent = m.descent;
    return line;
  };
  lineCount (text, fontFamily, fontSize, maxWidth) {
    return this.lineCountSpaced(text, fontFamily, fontSize, maxWidth, 0.0);
  };
  lineCountSpaced (text, fontFamily, fontSize, maxWidth, spacing) {
    const lines = this.breakLinesSpaced(
      text,
      fontFamily,
      fontSize,
      maxWidth,
      spacing
    );
    return lines.length;
  };
  maxLineWidth (text, fontFamily, fontSize) {
    return this.maxLineWidthSpaced(text, fontFamily, fontSize, 0.0);
  };
  maxLineWidthSpaced (text, fontFamily, fontSize, spacing) {
    const lines = this.breakLinesSpaced(
      text,
      fontFamily,
      fontSize,
      0.0,
      spacing
    );
    let maxW = 0.0;
    let i = 0;
    while (i < lines.length) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  minLineWidth (text, fontFamily, fontSize) {
    return this.minLineWidthSpaced(text, fontFamily, fontSize, 0.0);
  };
  minLineWidthSpaced (text, fontFamily, fontSize, spacing) {
    const lines = this.breakLinesSpaced(
      text,
      fontFamily,
      fontSize,
      0.001,
      spacing
    );
    let maxW = 0.0;
    let i = 0;
    while (i < lines.length) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  paragraphLeading (text, fontFamily, fontSize, maxWidth, spacing, paragraphSpacing) {
    if ( paragraphSpacing == 0.0 ) {
      return 0.0;
    }
    const lines = this.breakLinesSpaced(
      text,
      fontFamily,
      fontSize,
      maxWidth,
      spacing
    );
    let breaks = 0;
    let i = 0;
    while (i < lines.length) {
      if ( lines[i].startsParagraph ) {
        breaks = breaks + 1;
      }
      i = i + 1;
    };
    return breaks * paragraphSpacing;
  };
  breakToStrings (text, fontFamily, fontSize, maxWidth) {
    return this.breakToStringsSpaced(text, fontFamily, fontSize, maxWidth, 0.0);
  };
  breakToStringsSpaced (text, fontFamily, fontSize, maxWidth, spacing) {
    let out = [];
    const lines = this.breakLinesSpaced(
      text,
      fontFamily,
      fontSize,
      maxWidth,
      spacing
    );
    let i = 0;
    while (i < lines.length) {
      const ln = lines[i];
      out.push(ln.text);
      i = i + 1;
    };
    return out;
  };
}
EVGTextEngine.fitEpsilon = function() {
  return 0.000001;
};
EVGTextEngine.cacheLimit = function() {
  return 4096;
};
EVGTextEngine.trackingWidth = function(text, spacing) {
  if ( spacing == 0.0 ) {
    return 0.0;
  }
  return EVGGrapheme.clusterCount(text) * spacing;
};
class EVGDrawCmd  {
  constructor() {
    this.kind = 0;
    this.x = 0.0;
    this.y = 0.0;
    this.w = 0.0;
    this.h = 0.0;
    this.radius = 0.0;
    this.perCorner = false;
    this.radiusTR = 0.0;
    this.radiusBR = 0.0;
    this.radiusBL = 0.0;
    this.thickness = 0.0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1.0;
    this.text = "";
    this.fontFamily = "";
    this.fontSize = 0.0;
    this.textAlign = "";
    this.fontWeight = "";
    this.letterSpacing = 0.0;
    this.strokeCap = 0;
    this.strokeJoin = 0;
    this.strokeDash = "";
    this.strokeDashOffset = 0.0;
    this.maxWidth = 0.0;
    this.hasGrad = false;
    this.gradDir = 0;
    this.r2 = 0;
    this.g2 = 0;
    this.b2 = 0;
    this.a2 = 1.0;
    this.backdropBlur = 0.0;
    this.effectId = "";
    this.hasShadow = false;
    this.shadowX = 0.0;
    this.shadowY = 0.0;
    this.shadowBlur = 0.0;
    this.shadowR = 0;
    this.shadowG = 0;
    this.shadowB = 0;
    this.shadowA = 0.35;
    this.src = "";
    this.flipH = false;
    this.flipV = false;
    this.hasCrop = false;
    this.cropX = 0.0;
    this.cropY = 0.0;
    this.cropW = 1.0;
    this.cropH = 1.0;
    this.pts = [];
    this.ringEnds = [];
    this.evenOdd = false;
    this.rotate = 0.0;
    this.node = 0 - 1;
    this.rotOriginX = 0.0;
    this.rotOriginY = 0.0;
    this.hasRotOrigin = false;
    this.layer = 0;
  }
  kindName () {
    if ( this.kind == 0 ) {
      return "RECT";
    }
    if ( this.kind == 1 ) {
      return "BORDER";
    }
    if ( this.kind == 2 ) {
      return "IMAGE";
    }
    if ( this.kind == 3 ) {
      return "TEXT";
    }
    if ( this.kind == 4 ) {
      return "PUSH_CLIP";
    }
    if ( this.kind == 5 ) {
      return "POP_CLIP";
    }
    if ( this.kind == 6 ) {
      return "PATH";
    }
    return "STROKE";
  };
}
class EVGSceneBinary  {
  constructor() {
    this.cmds = new Int32Array(0);
    this.pts = new Int32Array(0);
    this.ends = new Int32Array(0);
    this.strings = [];
    this.count = 0;
    this.width = 0.0;     /* note: unused */
    this.height = 0.0;     /* note: unused */
    this.viewX = 0.0;
    this.viewY = 0.0;
    this.viewScale = 1.0;
    this.hasView = false;
    let s_2 = [];
    this.strings = s_2;
  }
}
class EVGDisplayList  {
  constructor() {
    this.cmds = [];
    this.attribute = false;
    this.curNode = 0 - 1;
    this.deferredOverlays = [];
    this.turnedDepth = 0;
    this.textEngine = new EVGTextEngine();
    this.viewX = 0.0;
    this.viewY = 0.0;
    this.viewScale = 1.0;
    this.hasView = false;
    this.regionLeft = 0.0;
    this.regionTop = 0.0;
    this.regionRight = 0.0;
    this.regionBottom = 0.0;
    this.hasRegion = false;
    this.paintIds = [];
    this.paintStart = [];
    this.paintCount = [];
    this.paintPool = [];
    this.focusRingId = "";
    this.focusRingR = 125;
    this.focusRingG = 211;
    this.focusRingB = 252;
    this.focusRingA = 1.0;
    this.focusRingWidth = 2.0;
    this.focusRingPad = 2.0;
    this.ringCmd = 0 - 1;
    this.ringEl = undefined;
    this.culling = true;
    this.buildSeq = 0;
    this.layerEls = [];
    this.layerTop = [];
    this.layerLeft = [];
    this.layerShiftX = [];
    this.layerShiftY = [];
    this.layerCullL = [];
    this.layerCullT = [];
    this.layerCullR = [];
    this.layerCullB = [];
    this.layerClip = [];
    this.layerFirst = [];
    this.layerLast = [];
    this.layerStack = [];
    this.layerKind = [];
    this.layerScale = [];
    this.fragments = true;
    this.fragHits = 0;
    this.fragMisses = 0;
    this.fragEls = [];
    this.fragLists = [];
    this.fragStamps = [];
    this.fragOffX = [];
    this.fragOffY = [];
    this.scrollbars = false;
    this.barState = 0;
    this.barHover = undefined;
    this.barNear = undefined;
    this.layerPct = [];
    this.layerLabel = [];
    this.frameSeq = 0;
    this.backdropR = 255;
    this.backdropG = 255;
    this.backdropB = 255;
    this.overscanBefore = 0.0 - 1.0;
    this.overscanAfter = 0.0 - 1.0;
    this.drawScale = 1.0;
    this.cullOn = false;
    this.cullLeft = 0.0;
    this.cullTop = 0.0;
    this.cullRight = 0.0;
    this.cullBottom = 0.0;
    this.effectKind = "";
    this.effectXs = [];
    this.effectYs = [];
    this.effectAges = [];
    this.effectSpeed = 0.0;
    this.effectWidth = 0.0;
    this.effectStrength = 0.0;
    this.effectDecay = 0.0;
    this.effectHighlight = 0.0;
    this.effectRings = 1.0;
    this.effectStagger = 0.0;
    this.effectFalloff = 0.0;
    this.effectShine = 0.0;
    this.effectGloss = 1.0;
    this.effectBump = 0.0;
    this.effectLightX = 0.0;
    this.effectLightY = 0.0;
    this.effectLightZ = 1.0;
    this.fxIds = [];
    this.fxKinds = [];
    this.fxTriggers = [];
    this.fxX = [];
    this.fxY = [];
    this.fxW = [];
    this.fxH = [];
    this.fxRadius = [];
    this.fxParamStart = [];
    this.fxParamCount = [];
    this.fxParamNames = [];
    this.fxParamValues = [];
  }
  setView (x, y, scale) {
    this.viewX = x;
    this.viewY = y;
    this.viewScale = scale;
    this.hasView = (x != 0.0 || y != 0.0) || scale != 1.0;
  };
  setRegion (l, t, r, b) {
    this.regionLeft = l;
    this.regionTop = t;
    this.regionRight = r;
    this.regionBottom = b;
    this.hasRegion = true;
  };
  clearRegion () {
    this.hasRegion = false;
  };
  clearView () {
    this.viewX = 0.0;
    this.viewY = 0.0;
    this.viewScale = 1.0;
    this.hasView = false;
  };
  setTextEngine (e) {
    this.textEngine = e;
  };
  addCmd (c) {
    c.node = this.curNode;
    this.cmds.push(c);
  };
  count () {
    return this.cmds.length;
  };
  at (i) {
    return this.cmds[i];
  };
  paintAt (id, from) {
    if ( id.length == 0 ) {
      return;
    }
    this.paintIds.push(id);
    this.paintStart.push(this.paintPool.length);
    const n = from.count();
    let i = 0;
    while (i < n) {
      this.paintPool.push(from.at(i));
      i = i + 1;
    };
    this.paintCount.push(n);
  };
  paintedCount () {
    return this.paintIds.length;
  };
  emitPainted (id) {
    let i = 0;
    const n = this.paintIds.length;
    while (i < n) {
      if ( this.paintIds[i] == id ) {
        const from = this.paintStart[i];
        const count = this.paintCount[i];
        let k = 0;
        while (k < count) {
          this.addCmd(this.paintPool[(from + k)]);
          k = k + 1;
        };
      }
      i = i + 1;
    };
  };
  setFocusRing (id) {
    this.focusRingId = id;
  };
  setFocusRingStyle (r, g, b, alpha, width, pad) {
    this.focusRingR = r;
    this.focusRingG = g;
    this.focusRingB = b;
    this.focusRingA = alpha;
    this.focusRingWidth = width;
    this.focusRingPad = pad;
  };
  paintFocusRing (root) {
    if ( this.focusRingId.length == 0 ) {
      return;
    }
    const found = EVGDisplayList.ringTarget(root, this.focusRingId);
    if ( typeof(found) != "undefined" ) {
      this.ringAround(found);
    }
  };
  ringAround (el) {
    if ( el.calculatedWidth <= 0.0 ) {
      return;
    }
    if ( el.calculatedHeight <= 0.0 ) {
      return;
    }
    const col = EVGColor.rgba(
      this.focusRingR,
      this.focusRingG,
      this.focusRingB,
      this.focusRingA
    );
    const c = new EVGDrawCmd();
    c.kind = 1;
    c.x = el.calculatedX - this.focusRingPad;
    c.y = el.calculatedY - this.focusRingPad;
    c.w = el.calculatedWidth + this.focusRingPad * 2.0;
    c.h = el.calculatedHeight + this.focusRingPad * 2.0;
    c.thickness = this.focusRingWidth;
    const rad = el.box.borderRadiusPx;
    if ( rad > 0.0 ) {
      c.radius = rad + this.focusRingPad;
    }
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    c.layer = this.layerAround(el);
    this.addCmd(c);
    this.ringCmd = this.cmds.length - 1;
    this.ringEl = el;
  };
  layerAround (el) {
    let found = 0;
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 0 ) {
        if ( EVGDisplayList.holds(this.layerEls[i], el) ) {
          found = i + 1;
        }
      }
      i = i + 1;
    };
    return found;
  };
  refreshRing () {
    if ( this.ringCmd < 0 ) {
      return;
    }
    if ( this.ringCmd >= this.cmds.length ) {
      return;
    }
    if ( typeof(this.ringEl) != "undefined" ) {
      const el = this.ringEl;
      const c = this.cmds[this.ringCmd];
      c.x = el.calculatedX - this.focusRingPad;
      c.y = el.calculatedY - this.focusRingPad;
      c.w = el.calculatedWidth + this.focusRingPad * 2.0;
      c.h = el.calculatedHeight + this.focusRingPad * 2.0;
    }
  };
  addRect (x, y, w, h, col) {
    const c = new EVGDrawCmd();
    c.kind = 0;
    c.x = x;
    c.y = y;
    c.w = w;
    c.h = h;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    this.addCmd(c);
  };
  addFrame (x, y, w, h, thickness, col) {
    this.addTurnedFrame(x, y, w, h, thickness, col, 0.0, 0.0, 0.0);
  };
  addTurnedFrame (x, y, w, h, thickness, col, deg, ox, oy) {
    const c = new EVGDrawCmd();
    c.kind = 1;
    c.x = x;
    c.y = y;
    c.w = w;
    c.h = h;
    c.thickness = thickness;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    if ( deg > 0.001 || deg < 0.0 - 0.001 ) {
      c.rotate = deg;
      c.rotOriginX = ox;
      c.rotOriginY = oy;
      c.hasRotOrigin = true;
    }
    this.addCmd(c);
  };
  addImage (src, x, y, w, h, flipH, flipV, rotate) {
    if ( src.length == 0 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 2;
    c.x = x;
    c.y = y;
    c.w = w;
    c.h = h;
    c.src = src;
    c.a = 1.0;
    c.flipH = flipH;
    c.flipV = flipV;
    c.rotate = rotate;
    this.addCmd(c);
  };
  addText (text, x, y, size, col, family, bold, italic, width, height) {
    if ( text.length == 0 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 3;
    c.x = x;
    c.y = y;
    c.w = width;
    c.h = height;
    c.text = text;
    c.fontFamily = family;
    c.fontSize = size;
    if ( bold ) {
      c.fontWeight = "bold";
    }
    if ( italic ) {
      c.textAlign = "italic";
    }
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    this.addCmd(c);
  };
  addClip (x, y, w, h) {
    const c = new EVGDrawCmd();
    c.kind = 4;
    c.x = x;
    c.y = y;
    c.w = w;
    c.h = h;
    this.addCmd(c);
  };
  addPolyline (pts, thickness, col) {
    if ( pts.length < 4 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 7;
    c.thickness = thickness;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    let i = 0;
    while (i < pts.length) {
      c.pts.push(pts[i]);
      i = i + 1;
    };
    c.ringEnds.push(c.pts.length);
    this.setPolyBounds(c);
    this.addCmd(c);
  };
  addPolyRings (rings, col, evenOddFill) {
    if ( rings.length == 0 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 6;
    c.evenOdd = evenOddFill;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    let i = 0;
    while (i < rings.length) {
      const ring = rings[i];
      let j = 0;
      while (j < ring.pts.length) {
        c.pts.push(ring.pts[j]);
        j = j + 1;
      };
      c.ringEnds.push(c.pts.length);
      i = i + 1;
    };
    if ( c.pts.length < 6 ) {
      return;
    }
    this.setPolyBounds(c);
    this.addCmd(c);
  };
  addPolygon (pts, col) {
    if ( pts.length < 6 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 6;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    let i = 0;
    while (i < pts.length) {
      c.pts.push(pts[i]);
      i = i + 1;
    };
    c.ringEnds.push(c.pts.length);
    this.setPolyBounds(c);
    this.addCmd(c);
  };
  setPolyBounds (c) {
    let minX = 0.0;
    let minY = 0.0;
    let maxX = 0.0;
    let maxY = 0.0;
    const n = ((c.pts.length / 2) | 0);
    let i = 0;
    while (i < n) {
      const x = c.pts[(i * 2)];
      const yat = i * 2 + 1;
      const y = c.pts[yat];
      if ( i == 0 ) {
        minX = x;
        maxX = x;
        minY = y;
        maxY = y;
      } else {
        if ( x < minX ) {
          minX = x;
        }
        if ( x > maxX ) {
          maxX = x;
        }
        if ( y < minY ) {
          minY = y;
        }
        if ( y > maxY ) {
          maxY = y;
        }
      }
      i = i + 1;
    };
    c.x = minX;
    c.y = minY;
    c.w = maxX - minX;
    c.h = maxY - minY;
  };
  addClipEnd () {
    const c = new EVGDrawCmd();
    c.kind = 5;
    this.addCmd(c);
  };
  addLayerClip (el, x, y, w, h) {
    const src = this.contentLayerFor(el);
    const cp = new EVGDrawCmd();
    cp.kind = 4;
    cp.x = x;
    cp.y = y;
    cp.w = w;
    cp.h = h;
    if ( src >= 0 ) {
      cp.layer = this.layerEls.length + 1;
      this.layerStack.push(this.layerEls.length);
      this.layerEls.push(el);
      this.layerTop.push(el.scrollTop);
      this.layerLeft.push(el.scrollLeft);
      this.layerShiftX.push(0.0);
      this.layerShiftY.push(0.0);
      this.layerClip.push(this.cmds.length);
      this.layerFirst.push(this.cmds.length + 1);
      this.layerLast.push(this.cmds.length + 1);
      this.layerCullL.push(this.layerCullL[src]);
      this.layerCullT.push(this.layerCullT[src]);
      this.layerCullR.push(this.layerCullR[src]);
      this.layerCullB.push(this.layerCullB[src]);
      this.layerKind.push(0);
      this.layerScale.push(1.0);
      this.layerPct.push(0);
      this.layerLabel.push(0 - 1);
    }
    this.addCmd(cp);
  };
  addLayerClipEnd () {
    if ( this.layerStack.length > 0 ) {
      const done = this.layerStack[(this.layerStack.length - 1)];
      this.layerLast[done] = this.cmds.length;
      this.layerStack.pop();
    }
    const pp = new EVGDrawCmd();
    pp.kind = 5;
    this.addCmd(pp);
  };
  layerCovers (el, x, y, w, h) {
    const i = this.contentLayerFor(el);
    if ( i < 0 ) {
      if ( y + h < el.calculatedY ) {
        return false;
      }
      if ( y > el.calculatedY + el.calculatedHeight ) {
        return false;
      }
      if ( x + w < el.calculatedX ) {
        return false;
      }
      if ( x > el.calculatedX + el.calculatedWidth ) {
        return false;
      }
      return true;
    }
    if ( y + h < this.layerCullT[i] ) {
      return false;
    }
    if ( y > this.layerCullB[i] ) {
      return false;
    }
    if ( x + w < this.layerCullL[i] ) {
      return false;
    }
    if ( x > this.layerCullR[i] ) {
      return false;
    }
    return true;
  };
  contentLayerFor (el) {
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 0 ) {
        if ( this.layerEls[i] == el ) {
          return i;
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  svgDocumentOf (el) {
    let key = el.svgSource;
    if ( el.fillColor.isSet ) {
      const fill = el.fillColor;
      key = key + ("|" + ((fill.r.toString()) + ("," + ((fill.g.toString()) + ("," + ((fill.b.toString()) + ("," + (fill.a.toString()))))))));
    }
    if ( typeof(el.svgDoc) != "undefined" ) {
      if ( el.svgDocKey == key ) {
        return el.svgDoc;
      }
    }
    const sp = new SvgParser();
    if ( el.fillColor.isSet ) {
      sp.setInitialFill(el.fillColor);
    }
    const doc = sp.parse(el.svgSource);
    el.svgDoc = doc;
    el.svgDocKey = key;
    return doc;
  };
  walkSvgDocument (el, x, y, w, h) {
    const doc = this.svgDocumentOf(el);
    if ( doc.itemCount() == 0 ) {
      return;
    }
    const vb = doc.effectiveViewBox();
    const m = VectorViewBox.resolve(vb, w, h, "xMidYMid meet");
    const steps = this.flattenSteps(w, h);
    let scale = m.a;
    if ( scale < 0.0 ) {
      scale = 0.0 - scale;
    }
    if ( scale <= 0.0 ) {
      scale = 1.0;
    }
    let k = 0;
    while (k < doc.itemCount()) {
      const item = doc.items[k];
      const parser = SVGPathParser.fromCommands(item.commands);
      const rings = parser.flattenRings(
        steps,
        m.a,
        m.b,
        m.c,
        m.d,
        (m.e + x),
        (m.f + y)
      );
      if ( rings.length > 0 ) {
        if ( item.hasFill() ) {
          const cf = new EVGDrawCmd();
          cf.kind = 6;
          cf.x = x;
          cf.y = y;
          cf.w = w;
          cf.h = h;
          cf.evenOdd = item.fillRule == "evenodd";
          cf.r = item.fillColor.red();
          cf.g = item.fillColor.green();
          cf.b = item.fillColor.blue();
          cf.a = item.fillColor.alpha();
          this.copyRings(cf, rings);
          this.addCmd(cf);
        }
        if ( item.hasStroke() ) {
          const cs = new EVGDrawCmd();
          cs.kind = 7;
          cs.x = x;
          cs.y = y;
          cs.w = w;
          cs.h = h;
          cs.thickness = item.strokeWidth * scale;
          cs.r = item.strokeColor.red();
          cs.g = item.strokeColor.green();
          cs.b = item.strokeColor.blue();
          cs.a = item.strokeColor.alpha();
          this.copyRings(cs, rings);
          this.addCmd(cs);
        }
      }
      k = k + 1;
    };
  };
  flattenSteps (w, h) {
    let span = w * this.drawScale;
    const tall = h * this.drawScale;
    if ( tall > span ) {
      span = tall;
    }
    let steps = Math.floor( span / 6.0);
    if ( steps < 4 ) {
      steps = 4;
    }
    if ( steps > 48 ) {
      steps = 48;
    }
    return steps;
  };
  walkPath (el, x, y, w, h) {
    if ( el.svgSource.length > 0 ) {
      this.walkSvgDocument(el, x, y, w, h);
      return;
    }
    const pathData = el.svgPath;
    if ( pathData.length == 0 ) {
      return;
    }
    const steps = this.flattenSteps(w, h);
    let rings = el.ringsCache;
    const sameBox = ((el.ringsX == x && el.ringsY == y) && el.ringsW == w) && el.ringsH == h;
    const sameGeom = ((el.ringsSteps == steps && el.ringsPath == pathData) && el.ringsViewBox == el.viewBox) && el.ringsFit == el.preserveAspectRatio;
    const fresh = (el.ringsHave && sameBox) && sameGeom;
    if ( fresh ) {
    } else {
      const parser = new SVGPathParser();
      parser.parse(pathData);
      const b = parser.getBounds();
      const vb = VectorViewBox.effectiveViewBox(
        el.viewBox,
        b.minX,
        b.minY,
        b.width,
        b.height
      );
      const m = VectorViewBox.resolve(vb, w, h, el.preserveAspectRatio);
      rings = parser.flattenRings(
        steps,
        m.a,
        m.b,
        m.c,
        m.d,
        (m.e + x),
        (m.f + y)
      );
      el.ringsCache = rings;
      el.ringsHave = true;
      el.ringsPath = pathData;
      el.ringsX = x;
      el.ringsY = y;
      el.ringsW = w;
      el.ringsH = h;
      el.ringsSteps = steps;
      el.ringsScale = m.a;
      el.ringsViewBox = el.viewBox;
      el.ringsFit = el.preserveAspectRatio;
    }
    if ( rings.length == 0 ) {
      return;
    }
    let fillColor = el.fillColor;
    if ( fillColor.isSet == false ) {
      fillColor = el.backgroundColor;
    }
    if ( fillColor.isSet ) {
      const cf = new EVGDrawCmd();
      cf.kind = 6;
      cf.x = x;
      cf.y = y;
      cf.w = w;
      cf.h = h;
      cf.evenOdd = el.fillRule == "evenodd";
      cf.r = fillColor.red();
      cf.g = fillColor.green();
      cf.b = fillColor.blue();
      cf.a = fillColor.alpha();
      if ( EVGDisplayList.hasLinearGradient(el) ) {
        EVGDisplayList.applyGradient(cf, el);
      }
      this.copyRings(cf, rings);
      this.addCmd(cf);
    }
    if ( el.arrowPath.length > 0 ) {
      const hc = el.arrowFillColor();
      if ( hc.isSet ) {
        const hp = new SVGPathParser();
        hp.parse(el.arrowPath);
        const hb = hp.getBounds();
        const hvb = VectorViewBox.effectiveViewBox(
          el.viewBox,
          hb.minX,
          hb.minY,
          hb.width,
          hb.height
        );
        const hm = VectorViewBox.resolve(hvb, w, h, el.preserveAspectRatio);
        const hrings = hp.flattenRings(
          steps,
          hm.a,
          hm.b,
          hm.c,
          hm.d,
          (hm.e + x),
          (hm.f + y)
        );
        if ( hrings.length > 0 ) {
          const ch = new EVGDrawCmd();
          ch.kind = 6;
          ch.x = x;
          ch.y = y;
          ch.w = w;
          ch.h = h;
          ch.r = hc.red();
          ch.g = hc.green();
          ch.b = hc.blue();
          ch.a = hc.alpha();
          this.copyRings(ch, hrings);
          this.addCmd(ch);
        }
      }
    }
    if ( el.strokeColor.isSet ) {
      if ( el.strokeWidth > 0.0 ) {
        const sc = el.strokeColor;
        const cs = new EVGDrawCmd();
        cs.kind = 7;
        cs.x = x;
        cs.y = y;
        cs.w = w;
        cs.h = h;
        let scale = el.ringsScale;
        if ( scale < 0.0 ) {
          scale = 0.0 - scale;
        }
        if ( scale <= 0.0 ) {
          scale = 1.0;
        }
        cs.thickness = el.strokeWidth * scale;
        cs.strokeCap = EVGDisplayList.capCode(el.strokeLineCap);
        cs.strokeJoin = EVGDisplayList.joinCode(el.strokeLineJoin);
        cs.strokeDash = el.strokeDashArray;
        cs.strokeDashOffset = el.strokeDashOffset;
        cs.r = sc.red();
        cs.g = sc.green();
        cs.b = sc.blue();
        cs.a = sc.alpha();
        this.copyRings(cs, rings);
        this.addCmd(cs);
      }
    }
  };
  copyRings (c, rings) {
    let i = 0;
    while (i < rings.length) {
      const ring = rings[i];
      let k = 0;
      while (k < ring.pts.length) {
        c.pts.push(ring.pts[k]);
        k = k + 1;
      };
      if ( c.kind == 7 && ring.closed ) {
        if ( ring.pointCount() >= 2 ) {
          c.pts.push(ring.pts[0]);
          c.pts.push(ring.pts[1]);
        }
      }
      c.ringEnds.push(c.pts.length);
      i = i + 1;
    };
  };
  setFragments (on) {
    this.fragments = on;
  };
  takeFragments (from) {
    this.fragEls = from.fragEls;
    this.fragLists = from.fragLists;
    this.fragStamps = from.fragStamps;
    this.fragOffX = from.fragOffX;
    this.fragOffY = from.fragOffY;
  };
  forgetFragments () {
    this.fragEls.length = 0;
    this.fragLists.length = 0;
    this.fragStamps.length = 0;
    this.fragOffX.length = 0;
    this.fragOffY.length = 0;
  };
  fragmentOf (el) {
    let i = 0;
    while (i < this.fragEls.length) {
      if ( this.fragEls[i] == el ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  emitFragment (el) {
    const fi = this.fragmentOf(el);
    if ( fi < 0 ) {
      return false;
    }
    if ( this.fragStamps[fi] != el.paintStamp ) {
      return false;
    }
    const kept = this.fragLists[fi];
    if ( kept.length == 0 ) {
      return false;
    }
    const first = kept[0];
    const dx = el.calculatedX - (first.x + this.fragOffX[fi]);
    const dy = el.calculatedY - (first.y + this.fragOffY[fi]);
    // Loop start
    for ( const c of kept) {
      if ( dx != 0.0 || dy != 0.0 ) {
        c.x = c.x + dx;
        c.y = c.y + dy;
        if ( c.hasRotOrigin ) {
          c.rotOriginX = c.rotOriginX + dx;
          c.rotOriginY = c.rotOriginY + dy;
        }
        const n = c.pts.length;
        let p = 0;
        while (p < n) {
          c.pts[p] = c.pts[p] + dx;
          c.pts[p + 1] = c.pts[(p + 1)] + dy;
          p = p + 2;
        };
      }
      this.addCmd(c);
    }
    return true;
  };
  recordFragment (el, start) {
    let kept = [];
    let i = start;
    const n = this.cmds.length;
    while (i < n) {
      const c = this.cmds[i];
      if ( c.layer > 0 ) {
        return;
      }
      kept.push(c);
      i = i + 1;
    };
    if ( kept.length == 0 ) {
      return;
    }
    const first = kept[0];
    const offX = el.calculatedX - first.x;
    const offY = el.calculatedY - first.y;
    const fi = this.fragmentOf(el);
    if ( fi < 0 ) {
      this.fragEls.push(el);
      this.fragLists.push(kept);
      this.fragStamps.push(el.paintStamp);
      this.fragOffX.push(offX);
      this.fragOffY.push(offY);
      return;
    }
    this.fragLists[fi] = kept;
    this.fragStamps[fi] = el.paintStamp;
    this.fragOffX[fi] = offX;
    this.fragOffY[fi] = offY;
  };
  setScrollbars (on) {
    this.scrollbars = on;
  };
  setScrollbarState (state) {
    this.barState = state;
  };
  setScrollbarHover (el) {
    this.barHover = el;
  };
  setScrollbarNear (el) {
    this.barNear = el;
  };
  addScrollbar (el, x, y, w, h) {
    const maxY = el.maxScrollTop();
    if ( maxY <= 0.0 ) {
      return;
    }
    let state = this.barState;
    if ( typeof(this.barNear) != "undefined" ) {
      if ( this.barNear == el ) {
        if ( state < 1 ) {
          state = 1;
        }
      }
    }
    if ( typeof(this.barHover) != "undefined" ) {
      if ( this.barHover == el ) {
        state = 2;
      }
    }
    if ( el.scrollbarWidth == "none" ) {
      return;
    }
    const width = EVGDisplayList.barWidth(state, (el.scrollbarWidth == "thin"));
    const margin = 3.0;
    const trackX = (x + w) - (width + margin);
    const trackY = y + margin;
    const trackH = h - margin * 2.0;
    if ( trackH <= width * 2.0 ) {
      return;
    }
    let thumbH = (trackH * h) / (h + maxY);
    if ( thumbH < 24.0 ) {
      thumbH = 24.0;
    }
    if ( thumbH > trackH ) {
      thumbH = trackH;
    }
    const travel = trackH - thumbH;
    const scale = travel / maxY;
    const thumbY = trackY + scale * el.scrollTop;
    const lum = (((this.backdropR * 299 + (this.backdropG * 587 + this.backdropB * 114)) / 1000) | 0);
    let base = EVGColor.rgba(30, 30, 30, 1.0);
    if ( lum < 128 ) {
      base = EVGColor.rgba(235, 235, 235, 1.0);
    }
    if ( el.scrollbarThumb.isSet ) {
      base = el.scrollbarThumb;
    }
    const cr = base.red();
    const cg = base.green();
    const cb = base.blue();
    const own = base.alpha();
    let thumbA = own * 0.5;
    if ( state == 1 ) {
      thumbA = own * 0.72;
    }
    if ( state >= 2 ) {
      thumbA = own * 0.92;
    }
    const lit = base.lighten(0.38);
    const pillLum = (((cr * 299 + (cg * 587 + cb * 114)) / 1000) | 0);
    let tr = 20;
    let tg = 20;
    let tb = 24;
    if ( pillLum < 140 ) {
      tr = 250;
      tg = 250;
      tb = 250;
    }
    if ( state > 0 ) {
      const track = new EVGDrawCmd();
      track.kind = 0;
      track.x = trackX;
      track.y = trackY;
      track.w = width;
      track.h = trackH;
      track.radius = width / 2.0;
      if ( el.scrollbarTrack.isSet ) {
        track.r = el.scrollbarTrack.red();
        track.g = el.scrollbarTrack.green();
        track.b = el.scrollbarTrack.blue();
        track.a = el.scrollbarTrack.alpha();
      } else {
        track.r = cr;
        track.g = cg;
        track.b = cb;
        track.a = 0.12;
      }
      this.addCmd(track);
    }
    const cp = new EVGDrawCmd();
    cp.kind = 4;
    cp.x = trackX - 64.0;
    cp.y = trackY;
    cp.w = width + 64.0;
    cp.h = trackH;
    cp.layer = this.layerEls.length + 1;
    this.layerEls.push(el);
    this.layerTop.push(el.scrollTop);
    this.layerLeft.push(el.scrollLeft);
    this.layerShiftX.push(0.0);
    this.layerShiftY.push(0.0);
    this.layerClip.push(this.cmds.length);
    this.layerFirst.push(this.cmds.length + 1);
    this.layerLast.push(this.cmds.length + 2);
    this.layerCullL.push(0.0);
    this.layerCullT.push(0.0);
    this.layerCullR.push(0.0);
    this.layerCullB.push(0.0);
    this.layerKind.push(1);
    this.layerScale.push(scale);
    const pct = Math.floor( (el.scrollTop * 100.0) / maxY + 0.5);
    this.layerPct.push(pct);
    this.layerLabel.push(0 - 1);
    this.addCmd(cp);
    const thumb = new EVGDrawCmd();
    thumb.kind = 0;
    thumb.x = trackX;
    thumb.y = thumbY;
    thumb.w = width;
    thumb.h = thumbH;
    thumb.radius = width / 2.0;
    thumb.hasGrad = true;
    thumb.gradDir = 1;
    thumb.r = lit.red();
    thumb.g = lit.green();
    thumb.b = lit.blue();
    thumb.a = thumbA;
    thumb.r2 = cr;
    thumb.g2 = cg;
    thumb.b2 = cb;
    thumb.a2 = thumbA;
    this.addCmd(thumb);
    if ( state >= 1 && el.scrollbarLabel != "none" ) {
      const pillW = 42.0;
      const pillH = 18.0;
      const pillX = (trackX - pillW) - 6.0;
      const pillY = (thumbY + thumbH / 2.0) - pillH / 2.0;
      const pill = new EVGDrawCmd();
      pill.kind = 0;
      pill.x = pillX;
      pill.y = pillY;
      pill.w = pillW;
      pill.h = pillH;
      pill.radius = pillH / 2.0;
      pill.hasGrad = true;
      pill.gradDir = 0;
      pill.r = lit.red();
      pill.g = lit.green();
      pill.b = lit.blue();
      pill.a = own * 0.94;
      pill.r2 = cr;
      pill.g2 = cg;
      pill.b2 = cb;
      pill.a2 = own * 0.94;
      this.addCmd(pill);
      const label = new EVGDrawCmd();
      label.kind = 3;
      label.x = pillX + 7.0;
      label.y = pillY + 2.0;
      label.w = pillW - 10.0;
      label.h = pillH - 4.0;
      label.text = EVGDisplayList.pctLabel(pct);
      label.fontFamily = "sans-serif";
      label.fontSize = 11.0;
      label.fontWeight = "600";
      label.r = tr;
      label.g = tg;
      label.b = tb;
      label.a = 1.0;
      this.layerLabel[this.layerEls.length - 1] = this.cmds.length;
      this.addCmd(label);
      this.layerLast[this.layerEls.length - 1] = this.cmds.length;
    }
    const pp = new EVGDrawCmd();
    pp.kind = 5;
    this.addCmd(pp);
  };
  trackAt (px, py) {
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 1 ) {
        const cp = this.cmds[this.layerClip[i]];
        const t = this.cmds[this.layerFirst[i]];
        if ( px >= t.x - 4.0 && px <= (t.x + t.w) + 3.0 ) {
          if ( py >= cp.y && py <= cp.y + cp.h ) {
            return i;
          }
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  trackScrollFor (i, py) {
    const cp = this.cmds[this.layerClip[i]];
    const t = this.cmds[this.layerFirst[i]];
    const scale = this.layerScale[i];
    if ( scale <= 0.0 ) {
      return 0.0;
    }
    return ((py - cp.y) - t.h / 2.0) / scale;
  };
  nearBarAt (px, py) {
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 0 ) {
        const cp = this.cmds[this.layerClip[i]];
        if ( px >= (cp.x + cp.w) - EVGDisplayList.barNearPx() && px <= cp.x + cp.w ) {
          if ( py >= cp.y && py <= cp.y + cp.h ) {
            return i;
          }
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  thumbAt (px, py) {
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 1 ) {
        const t = this.cmds[this.layerFirst[i]];
        if ( px >= t.x - 8.0 && px <= (t.x + t.w) + 3.0 ) {
          if ( py >= t.y && py <= t.y + t.h ) {
            return i;
          }
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  layerElement (i) {
    return this.layerEls[i];
  };
  thumbScale (i) {
    return this.layerScale[i];
  };
  thumbsJson () {
    let out = "[";
    let n = 0;
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerKind[i] == 1 ) {
        const t = this.cmds[this.layerFirst[i]];
        if ( n > 0 ) {
          out = out + ",";
        }
        out = (((out + "{\"x\":") + EVGDisplayList.num(t.x)) + ",\"y\":") + EVGDisplayList.num(t.y);
        out = (((((out + ",\"w\":") + EVGDisplayList.num(t.w)) + ",\"h\":") + EVGDisplayList.num(t.h)) + ",\"a\":") + EVGDisplayList.num(t.a);
        out = ((((((out + ",\"c\":[") + (t.r2.toString())) + ",") + (t.g2.toString())) + ",") + (t.b2.toString())) + "]}";
        n = n + 1;
      }
      i = i + 1;
    };
    return out + "]";
  };
  layerCount () {
    return this.layerEls.length;
  };
  layerFor (el) {
    let i = 0;
    while (i < this.layerEls.length) {
      if ( this.layerEls[i] == el ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  shiftRange (first, last, dx, dy) {
    let i = first;
    while (i < last) {
      const c = this.cmds[i];
      c.x = c.x + dx;
      c.y = c.y + dy;
      if ( c.hasRotOrigin ) {
        c.rotOriginX = c.rotOriginX + dx;
        c.rotOriginY = c.rotOriginY + dy;
      }
      const n = c.pts.length;
      if ( n > 0 ) {
        let p = 0;
        while (p < n) {
          c.pts[p] = c.pts[p] + dx;
          c.pts[p + 1] = c.pts[(p + 1)] + dy;
          p = p + 2;
        };
      }
      i = i + 1;
    };
  };
  refreshLayers () {
    let i = 0;
    while (i < this.layerEls.length) {
      const el = this.layerEls[i];
      if ( this.layerKind[i] == 1 ) {
        const ty = (el.scrollTop - this.layerTop[i]) * this.layerScale[i];
        const dsy = ty - this.layerShiftY[i];
        if ( dsy != 0.0 ) {
          this.shiftRange(this.layerFirst[i], this.layerLast[i], 0.0, dsy);
          this.layerShiftY[i] = ty;
        }
        if ( this.layerLabel[i] >= 0 ) {
          const maxY = el.maxScrollTop();
          if ( maxY > 0.0 ) {
            const pct = Math.floor( (el.scrollTop * 100.0) / maxY + 0.5);
            if ( pct != this.layerPct[i] ) {
              this.layerPct[i] = pct;
              const label = this.cmds[this.layerLabel[i]];
              label.text = EVGDisplayList.pctLabel(pct);
              this.frameSeq = this.frameSeq + 1;
            }
          }
        }
        i = i + 1;
        continue;
      }
      const dy = this.layerTop[i] - el.scrollTop;
      const dx = this.layerLeft[i] - el.scrollLeft;
      const cp = this.cmds[this.layerClip[i]];
      if ( cp.y < this.layerCullT[i] + dy ) {
        return false;
      }
      if ( cp.y + cp.h > this.layerCullB[i] + dy ) {
        return false;
      }
      if ( cp.x < this.layerCullL[i] + dx ) {
        return false;
      }
      if ( cp.x + cp.w > this.layerCullR[i] + dx ) {
        return false;
      }
      const sx = dx - this.layerShiftX[i];
      const sy = dy - this.layerShiftY[i];
      if ( sx != 0.0 || sy != 0.0 ) {
        this.shiftRange(this.layerFirst[i], this.layerLast[i], sx, sy);
        this.layerShiftX[i] = dx;
        this.layerShiftY[i] = dy;
        let j = i + 1;
        while (j < this.layerEls.length) {
          if ( this.layerClip[j] > this.layerClip[i] ) {
            if ( this.layerClip[j] < this.layerLast[i] ) {
              this.layerCullL[j] = this.layerCullL[j] + sx;
              this.layerCullR[j] = this.layerCullR[j] + sx;
              this.layerCullT[j] = this.layerCullT[j] + sy;
              this.layerCullB[j] = this.layerCullB[j] + sy;
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    this.refreshRing();
    return true;
  };
  setCulling (on) {
    this.culling = on;
  };
  setOverscan (before, after) {
    this.overscanBefore = before;
    this.overscanAfter = after;
  };
  cullable (el) {
    if ( this.cullOn == false ) {
      return false;
    }
    if ( el.paintUnbounded ) {
      return false;
    }
    if ( el.paintBottom < this.cullTop ) {
      return true;
    }
    if ( el.paintTop > this.cullBottom ) {
      return true;
    }
    if ( el.paintRight < this.cullLeft ) {
      return true;
    }
    if ( el.paintLeft > this.cullRight ) {
      return true;
    }
    return false;
  };
  build (root) {
    this.cmds.length = 0;
    this.deferredOverlays.length = 0;
    this.layerEls.length = 0;
    this.layerTop.length = 0;
    this.layerLeft.length = 0;
    this.layerShiftX.length = 0;
    this.layerShiftY.length = 0;
    this.layerCullL.length = 0;
    this.layerCullT.length = 0;
    this.layerCullR.length = 0;
    this.layerCullB.length = 0;
    this.layerClip.length = 0;
    this.layerFirst.length = 0;
    this.layerLast.length = 0;
    this.layerStack.length = 0;
    this.layerKind.length = 0;
    this.layerScale.length = 0;
    this.layerPct.length = 0;
    this.layerLabel.length = 0;
    this.fragHits = 0;
    this.fragMisses = 0;
    this.cullOn = false;
    if ( this.hasRegion ) {
      this.cullOn = true;
      this.cullLeft = this.regionLeft;
      this.cullTop = this.regionTop;
      this.cullRight = this.regionRight;
      this.cullBottom = this.regionBottom;
    }
    this.drawScale = 1.0;
    this.effectKind = "";
    let noX = [];
    let noY = [];
    let noT = [];
    this.effectXs = noX;
    this.effectYs = noY;
    this.effectAges = noT;
    this.fxIds.length = 0;
    this.fxKinds.length = 0;
    this.fxTriggers.length = 0;
    this.fxX.length = 0;
    this.fxY.length = 0;
    this.fxW.length = 0;
    this.fxH.length = 0;
    this.fxRadius.length = 0;
    this.fxParamStart.length = 0;
    this.fxParamCount.length = 0;
    this.fxParamNames.length = 0;
    this.fxParamValues.length = 0;
    this.readEffect(root);
    this.collectEffects(root);
    this.walk(root);
    let i = 0;
    while (i < this.deferredOverlays.length) {
      this.cullOn = false;
      this.walk(this.deferredOverlays[i]);
      i = i + 1;
    };
    this.cullOn = false;
    this.ringCmd = 0 - 1;
    let noRing;
    this.ringEl = noRing;
    this.paintFocusRing(root);
  };
  fadeFrom (start, factor) {
    if ( factor >= 1.0 ) {
      return;
    }
    let i = start;
    while (i < this.cmds.length) {
      const c = this.cmds[i];
      c.a = c.a * factor;
      i = i + 1;
    };
  };
  transformFrom (start, el) {
    const deg = el.rotate;
    const sc = el.scale;
    const tx = el.translateX;
    const ty = el.translateY;
    const flips = el.flipY;
    const turns = deg != 0.0;
    const scales = Math.abs(sc - 1.0) > 0.000001 || flips;
    const shifts = tx != 0.0 || ty != 0.0;
    if ( (turns == false && scales == false) && shifts == false ) {
      return;
    }
    let scy = sc;
    if ( flips ) {
      scy = 0.0 - sc;
    }
    const ox = el.calculatedX + EVGElement.resolveOrigin(el.transformOriginX, el.calculatedWidth);
    const oy = el.calculatedY + EVGElement.resolveOrigin(el.transformOriginY, el.calculatedHeight);
    const rad = (deg * 3.14159265358979) / 180.0;
    const cs = Math.cos(rad);
    const sn = Math.sin(rad);
    let i = start;
    const n = this.cmds.length;
    while (i < n) {
      const c = this.cmds[i];
      if ( c.pts.length > 0 ) {
        this.mapPoints(c, ox, oy, sc, scy, cs, sn, tx, ty);
      } else {
        if ( scales ) {
          c.x = ox + (c.x - ox) * sc;
          c.y = oy + (c.y - oy) * scy;
          c.w = c.w * sc;
          c.h = c.h * scy;
          c.radius = Math.abs(c.radius) * Math.abs(sc);
          c.thickness = Math.abs(c.thickness) * Math.abs(sc);
          c.fontSize = Math.abs(c.fontSize) * Math.abs(sc);
          if ( c.h < 0.0 ) {
            c.y = c.y + c.h;
            c.h = 0.0 - c.h;
            if ( c.perCorner ) {
              const swTL = c.radius;
              c.radius = c.radiusBL;
              c.radiusBL = swTL;
              const swTR = c.radiusTR;
              c.radiusTR = c.radiusBR;
              c.radiusBR = swTR;
            }
            c.flipV = c.flipV == false;
          }
          if ( c.w < 0.0 ) {
            c.x = c.x + c.w;
            c.w = 0.0 - c.w;
            if ( c.perCorner ) {
              const swTL2 = c.radius;
              c.radius = c.radiusTR;
              c.radiusTR = swTL2;
              const swBL2 = c.radiusBL;
              c.radiusBL = c.radiusBR;
              c.radiusBR = swBL2;
            }
            c.flipH = c.flipH == false;
          }
        }
        if ( turns ) {
          c.rotate = c.rotate + deg;
          if ( c.hasRotOrigin == false ) {
            c.rotOriginX = ox;
            c.rotOriginY = oy;
            c.hasRotOrigin = true;
          } else {
            const rx = c.rotOriginX - ox;
            const ry = c.rotOriginY - oy;
            c.rotOriginX = ox + (rx * cs - ry * sn);
            c.rotOriginY = oy + (rx * sn + ry * cs);
          }
        }
        if ( shifts ) {
          c.x = c.x + tx;
          c.y = c.y + ty;
          if ( c.hasRotOrigin ) {
            c.rotOriginX = c.rotOriginX + tx;
            c.rotOriginY = c.rotOriginY + ty;
          }
        }
      }
      i = i + 1;
    };
  };
  mapPoints (c, ox, oy, sc, scy, cs, sn, tx, ty) {
    let moved = [];
    let i = 0;
    const n = c.pts.length;
    while (i + 1 < n) {
      const px = c.pts[i] - ox;
      const py = c.pts[(i + 1)] - oy;
      const sx = px * sc;
      const sy = py * scy;
      moved.push((ox + (sx * cs - sy * sn)) + tx);
      moved.push((oy + (sx * sn + sy * cs)) + ty);
      i = i + 2;
    };
    c.pts.length = 0;
    let j = 0;
    while (j < moved.length) {
      c.pts.push(moved[j]);
      j = j + 1;
    };
  };
  walk (el) {
    if ( el.isHidden() ) {
      return;
    }
    if ( this.cullable(el) ) {
      return;
    }
    el.settleShift();
    const emitStart = this.cmds.length;
    const keeping = (this.fragments && el.keepLayout) && this.attribute == false;
    if ( keeping ) {
      if ( this.emitFragment(el) ) {
        this.fragHits = this.fragHits + 1;
        return;
      }
      this.fragMisses = this.fragMisses + 1;
    }
    const prevNode = this.curNode;
    if ( this.attribute ) {
      this.curNode = el.inspectSlot;
    }
    const hadCull = this.cullOn;
    const hadCullL = this.cullLeft;
    const hadCullT = this.cullTop;
    const hadCullR = this.cullRight;
    const hadCullB = this.cullBottom;
    if ( keeping ) {
      this.cullOn = false;
    }
    const hadScale = this.drawScale;
    const hadTurned = this.turnedDepth;
    if ( el.hasTransform() ) {
      let sc = el.scale;
      if ( sc < 0.0 ) {
        sc = 0.0 - sc;
      }
      if ( sc > 0.0 ) {
        this.drawScale = this.drawScale * sc;
      }
      if ( this.cullOn ) {
        this.cullThroughTransform(el);
      }
      if ( el.rotate != 0.0 ) {
        this.turnedDepth = this.turnedDepth + 1;
      }
    }
    this.walkOpaque(el);
    this.turnedDepth = hadTurned;
    this.drawScale = hadScale;
    this.cullOn = hadCull;
    this.cullLeft = hadCullL;
    this.cullTop = hadCullT;
    this.cullRight = hadCullR;
    this.cullBottom = hadCullB;
    this.curNode = prevNode;
    this.fadeFrom(emitStart, el.opacity);
    this.transformFrom(emitStart, el);
    if ( keeping ) {
      this.recordFragment(el, emitStart);
    }
  };
  cullThroughTransform (el) {
    if ( el.rotate != 0.0 ) {
      this.cullOn = false;
      return;
    }
    const sc = el.scale;
    if ( Math.abs(sc) < 0.000001 ) {
      this.cullOn = false;
      return;
    }
    const ox = el.calculatedX + EVGElement.resolveOrigin(el.transformOriginX, el.calculatedWidth);
    const oy = el.calculatedY + EVGElement.resolveOrigin(el.transformOriginY, el.calculatedHeight);
    let l = ox + ((this.cullLeft - el.translateX) - ox) / sc;
    let r = ox + ((this.cullRight - el.translateX) - ox) / sc;
    let t = oy + ((this.cullTop - el.translateY) - oy) / sc;
    let b = oy + ((this.cullBottom - el.translateY) - oy) / sc;
    if ( l > r ) {
      const sw = l;
      l = r;
      r = sw;
    }
    if ( t > b ) {
      const sw2 = t;
      t = b;
      b = sw2;
    }
    this.cullLeft = l;
    this.cullTop = t;
    this.cullRight = r;
    this.cullBottom = b;
  };
  walkOpaque (el) {
    const x = el.calculatedX;
    const y = el.calculatedY;
    const w = el.calculatedWidth;
    const h = el.calculatedHeight;
    let radius = el.box.borderRadiusPx;
    const bx = el.box;
    const uTL = bx.borderRadiusTL;
    const uTR = bx.borderRadiusTR;
    const uBR = bx.borderRadiusBR;
    const uBL = bx.borderRadiusBL;
    const uAll = bx.borderRadius;
    let rTL = EVGDisplayList.radiusPx(
      (uTL.isSet && uTL.isPercent()),
      uTL.value,
      bx.borderRadiusTLPx,
      w
    );
    let rTR = EVGDisplayList.radiusPx(
      (uTR.isSet && uTR.isPercent()),
      uTR.value,
      bx.borderRadiusTRPx,
      w
    );
    let rBR = EVGDisplayList.radiusPx(
      (uBR.isSet && uBR.isPercent()),
      uBR.value,
      bx.borderRadiusBRPx,
      w
    );
    let rBL = EVGDisplayList.radiusPx(
      (uBL.isSet && uBL.isPercent()),
      uBL.value,
      bx.borderRadiusBLPx,
      w
    );
    if ( bx.hasPerCornerRadius() == false ) {
      const uni = EVGDisplayList.radiusPx(
        (uAll.isSet && uAll.isPercent()),
        uAll.value,
        bx.borderRadiusPx,
        w
      );
      rTL = uni;
      rTR = uni;
      rBR = uni;
      rBL = uni;
    }
    let f = 1.0;
    f = EVGDisplayList.sideFactor(f, w, (rTL + rTR));
    f = EVGDisplayList.sideFactor(f, h, (rTR + rBR));
    f = EVGDisplayList.sideFactor(f, w, (rBL + rBR));
    f = EVGDisplayList.sideFactor(f, h, (rTL + rBL));
    if ( f < 1.0 ) {
      rTL = rTL * f;
      rTR = rTR * f;
      rBR = rBR * f;
      rBL = rBL * f;
    }
    radius = rTL;
    const perCorner = el.box.hasPerCornerRadius();
    let painted = false;
    let bgSet = false;
    let bg = new EVGColor();
    if ( typeof(el.backgroundColor) != "undefined" ) {
      const b0 = el.backgroundColor;
      if ( b0.isSet ) {
        bg = b0;
        bgSet = true;
      }
    }
    const gradOk = EVGDisplayList.hasLinearGradient(el);
    const paintsItsBox = el.drawsPath() == false;
    if ( (bgSet || gradOk) && paintsItsBox ) {
      const c = new EVGDrawCmd();
      c.kind = 0;
      c.x = x;
      c.y = y;
      c.w = w;
      c.h = h;
      c.radius = radius;
      c.perCorner = perCorner;
      if ( perCorner ) {
        c.radius = rTL;
        c.radiusTR = rTR;
        c.radiusBR = rBR;
        c.radiusBL = rBL;
      }
      if ( bgSet ) {
        c.r = bg.red();
        c.g = bg.green();
        c.b = bg.blue();
        c.a = bg.alpha();
      }
      if ( gradOk ) {
        EVGDisplayList.applyGradient(c, el);
      }
      c.backdropBlur = el.backdropBlur;
      if ( el.surfaceEffect.length > 0 ) {
        c.effectId = el.effectRuntimeId;
      }
      EVGDisplayList.applyShadow(c, el);
      this.addCmd(c);
      painted = true;
    }
    if ( painted == false ) {
      const probe = new EVGDrawCmd();
      EVGDisplayList.applyShadow(probe, el);
      if ( (probe.hasShadow && el.backdropBlur <= 0.0) && paintsItsBox ) {
        const cs = new EVGDrawCmd();
        cs.kind = 0;
        cs.x = x;
        cs.y = y;
        cs.w = w;
        cs.h = h;
        cs.radius = radius;
        cs.perCorner = perCorner;
        if ( perCorner ) {
          cs.radius = rTL;
          cs.radiusTR = rTR;
          cs.radiusBR = rBR;
          cs.radiusBL = rBL;
        }
        cs.a = 0.0;
        EVGDisplayList.applyShadow(cs, el);
        this.addCmd(cs);
      }
      if ( el.backdropBlur > 0.0 ) {
        const cb = new EVGDrawCmd();
        cb.kind = 0;
        cb.x = x;
        cb.y = y;
        cb.w = w;
        cb.h = h;
        cb.radius = radius;
        cb.perCorner = perCorner;
        if ( perCorner ) {
          cb.radius = rTL;
          cb.radiusTR = rTR;
          cb.radiusBR = rBR;
          cb.radiusBL = rBL;
        }
        cb.a = 0.0;
        cb.backdropBlur = el.backdropBlur;
        EVGDisplayList.applyShadow(cb, el);
        this.addCmd(cb);
      }
      if ( el.surfaceEffect.length > 0 ) {
        const cf = new EVGDrawCmd();
        cf.kind = 0;
        cf.x = x;
        cf.y = y;
        cf.w = w;
        cf.h = h;
        cf.radius = radius;
        cf.perCorner = perCorner;
        if ( perCorner ) {
          cf.radius = rTL;
          cf.radiusTR = rTR;
          cf.radiusBR = rBR;
          cf.radiusBL = rBL;
        }
        cf.a = 0.0;
        cf.effectId = el.effectRuntimeId;
        this.addCmd(cf);
      }
    }
    const bw = el.effectiveBorderWidthPx();
    if ( bw > 0.0 ) {
      const bc = el.effectiveBorderColor();
      const c2 = new EVGDrawCmd();
      c2.kind = 1;
      c2.x = x;
      c2.y = y;
      c2.w = w;
      c2.h = h;
      c2.radius = radius;
      c2.perCorner = perCorner;
      if ( perCorner ) {
        c2.radius = rTL;
        c2.radiusTR = rTR;
        c2.radiusBR = rBR;
        c2.radiusBL = rBL;
      }
      c2.thickness = bw;
      c2.r = bc.red();
      c2.g = bc.green();
      c2.b = bc.blue();
      c2.a = bc.alpha();
      this.addCmd(c2);
    }
    if ( el.drawsPath() ) {
      this.walkPath(el, x, y, w, h);
    }
    if ( el.src.length > 0 ) {
      const c3 = new EVGDrawCmd();
      c3.kind = 2;
      c3.x = x;
      c3.y = y;
      c3.w = w;
      c3.h = h;
      c3.radius = radius;
      c3.perCorner = perCorner;
      if ( perCorner ) {
        c3.radius = rTL;
        c3.radiusTR = rTR;
        c3.radiusBR = rBR;
        c3.radiusBL = rBL;
      }
      c3.src = el.src;
      if ( el.imageViewBoxSet ) {
        c3.hasCrop = true;
        c3.cropX = el.imageViewBoxX;
        c3.cropY = el.imageViewBoxY;
        c3.cropW = el.imageViewBoxW;
        c3.cropH = el.imageViewBoxH;
      }
      this.addCmd(c3);
    }
    if ( el.textContent.length > 0 ) {
      const face = el.effectiveFontFamily();
      let fs = el.inheritedFontSize;
      if ( el.fontSize.isSet ) {
        fs = el.fontSize.pixels;
      }
      if ( fs <= 0.0 ) {
        fs = 14.0;
      }
      let lineBox = el.lineBoxFor(fs, this.textEngine.lineHeightFor(face, fs));
      if ( lineBox <= 0.0 ) {
        lineBox = fs * 1.2;
      }
      const avail = el.box.getInnerWidth(w);
      const broken = this.textEngine.breakLinesSpaced(
        el.textContent,
        face,
        fs,
        el.wrapWidth(avail),
        el.letterSpacing
      );
      let lines = [];
      let bi = 0;
      while (bi < broken.length) {
        const bl = broken[bi];
        lines.push(bl.text);
        bi = bi + 1;
      };
      let tr = 0;
      let tg = 0;
      let tb = 0;
      let ta = 1.0;
      if ( typeof(el.color) != "undefined" ) {
        const tc = el.color;
        tr = tc.red();
        tg = tc.green();
        tb = tc.blue();
        ta = tc.alpha();
      }
      let li = 0;
      let paraShift = 0.0;
      while (li < lines.length) {
        const lnObj = broken[li];
        if ( lnObj.startsParagraph ) {
          paraShift = paraShift + el.paragraphSpacing;
        }
        const c4 = new EVGDrawCmd();
        c4.kind = 3;
        let indent = 0.0;
        if ( el.textAlign == "center" || el.textAlign == "right" ) {
          const m = this.textEngine.measureRunSpaced(
            lines[li],
            face,
            fs,
            el.letterSpacing
          );
          const slack = avail - m.width;
          if ( slack > 0.0 ) {
            if ( el.textAlign == "center" ) {
              indent = slack / 2.0;
            } else {
              indent = slack;
            }
          }
        }
        const bw_2 = el.box.borderWidthPx;
        c4.x = ((x + bw_2) + el.box.paddingLeftPx) + indent;
        c4.y = ((((y + bw_2) + el.box.paddingTopPx) + el.textShiftY) + li * lineBox) + paraShift;
        c4.w = avail;
        c4.h = lineBox;
        c4.text = lines[li];
        c4.fontFamily = face;
        c4.fontSize = fs;
        if ( el.fontWeight.length > 0 ) {
          if ( el.fontWeight != "normal" ) {
            c4.fontWeight = el.fontWeight;
          }
        }
        c4.letterSpacing = el.letterSpacing;
        c4.r = tr;
        c4.g = tg;
        c4.b = tb;
        c4.a = ta;
        this.addCmd(c4);
        li = li + 1;
      };
    }
    const hadBdR = this.backdropR;
    const hadBdG = this.backdropG;
    const hadBdB = this.backdropB;
    const ownBg = el.backgroundColor;
    if ( ownBg.isSet ) {
      if ( ownBg.alpha() > 0.5 ) {
        this.backdropR = ownBg.red();
        this.backdropG = ownBg.green();
        this.backdropB = ownBg.blue();
      }
    }
    let clips = el.clipsContent();
    if ( this.turnedDepth > 0 ) {
      clips = false;
    }
    let scrolls = false;
    if ( (clips && this.culling) && (w > 0.0 && h > 0.0) ) {
      if ( el.maxScrollTop() > 0.0 || el.maxScrollLeft() > 0.0 ) {
        scrolls = true;
      }
    }
    if ( clips ) {
      const cp = new EVGDrawCmd();
      cp.kind = 4;
      cp.x = x;
      cp.y = y;
      cp.w = w;
      cp.h = h;
      if ( scrolls ) {
        cp.layer = this.layerEls.length + 1;
        this.layerStack.push(this.layerEls.length);
        this.layerEls.push(el);
        this.layerTop.push(el.scrollTop);
        this.layerLeft.push(el.scrollLeft);
        this.layerShiftX.push(0.0);
        this.layerShiftY.push(0.0);
        this.layerClip.push(this.cmds.length);
        this.layerFirst.push(this.cmds.length + 1);
        this.layerLast.push(this.cmds.length + 1);
        this.layerCullL.push(0.0);
        this.layerCullT.push(0.0);
        this.layerCullR.push(0.0);
        this.layerCullB.push(0.0);
        this.layerKind.push(0);
        this.layerScale.push(1.0);
        this.layerPct.push(0);
        this.layerLabel.push(0 - 1);
      }
      this.addCmd(cp);
    }
    const hadCull = this.cullOn;
    const hadL = this.cullLeft;
    const hadT = this.cullTop;
    const hadR = this.cullRight;
    const hadB = this.cullBottom;
    if ( clips && this.culling ) {
      let before = this.overscanBefore;
      let after = this.overscanAfter;
      if ( before < 0.0 ) {
        before = h;
      }
      if ( after < 0.0 ) {
        after = h;
      }
      let l = x - w;
      let t = y - before;
      let r = (x + w) + w;
      let b = (y + h) + after;
      if ( this.cullOn ) {
        if ( l < this.cullLeft ) {
          l = this.cullLeft;
        }
        if ( t < this.cullTop ) {
          t = this.cullTop;
        }
        if ( r > this.cullRight ) {
          r = this.cullRight;
        }
        if ( b > this.cullBottom ) {
          b = this.cullBottom;
        }
      }
      this.cullOn = true;
      this.cullLeft = l;
      this.cullTop = t;
      this.cullRight = r;
      this.cullBottom = b;
      if ( scrolls ) {
        const li_1 = this.layerStack[(this.layerStack.length - 1)];
        this.layerCullL[li_1] = l;
        this.layerCullT[li_1] = t;
        this.layerCullR[li_1] = r;
        this.layerCullB[li_1] = b;
      }
    }
    let i = 0;
    while (i < el.getChildCount()) {
      const kid = el.getChild(i);
      if ( kid.isSurface() ) {
        this.deferredOverlays.push(kid);
      } else {
        this.walk(kid);
      }
      i = i + 1;
    };
    if ( this.paintIds.length > 0 ) {
      if ( el.id.length > 0 ) {
        this.emitPainted(el.id);
      }
    }
    this.cullOn = hadCull;
    this.cullLeft = hadL;
    this.cullTop = hadT;
    this.cullRight = hadR;
    this.cullBottom = hadB;
    if ( clips ) {
      if ( scrolls ) {
        const done = this.layerStack[(this.layerStack.length - 1)];
        this.layerLast[done] = this.cmds.length;
        this.layerStack.pop();
      }
      const pp = new EVGDrawCmd();
      pp.kind = 5;
      this.addCmd(pp);
      if ( scrolls && this.scrollbars ) {
        this.addScrollbar(el, x, y, w, h);
      }
    }
    this.backdropR = hadBdR;
    this.backdropG = hadBdG;
    this.backdropB = hadBdB;
  };
  toBinary () {
    const out = new EVGSceneBinary();
    const n = this.cmds.length;
    out.count = n;
    out.viewX = this.viewX;
    out.viewY = this.viewY;
    out.viewScale = this.viewScale;
    out.hasView = this.hasView;
    const stride = EVGDisplayList.stride();
    let totalPts = 0;
    let totalEnds = 0;
    let i = 0;
    while (i < n) {
      const c = this.cmds[i];
      const pc = c.pts.length;
      totalPts = totalPts + pc;
      if ( pc > 0 ) {
        const ec = c.ringEnds.length;
        if ( ec == 0 ) {
          totalEnds = totalEnds + 1;
        } else {
          totalEnds = totalEnds + ec;
        }
      }
      i = i + 1;
    };
    let recs = new Int32Array(n * stride);
    let pbuf = new Int32Array(totalPts);
    let ebuf = new Int32Array(totalEnds);
    let pool = [];
    let poolIndex = {};
    let pAt = 0;
    let eAt = 0;
    let k = 0;
    while (k < n) {
      const c2 = this.cmds[k];
      const base = k * stride;
      recs[base] = c2.kind;
      recs[base + 1] = EVGDisplayList.fixed(c2.x);
      recs[base + 2] = EVGDisplayList.fixed(c2.y);
      recs[base + 3] = EVGDisplayList.fixed(c2.w);
      recs[base + 4] = EVGDisplayList.fixed(c2.h);
      recs[base + 5] = EVGDisplayList.fixed(c2.radius);
      recs[base + 6] = EVGDisplayList.fixed(c2.thickness);
      recs[base + 7] = EVGDisplayList.packRgb(c2.r, c2.g, c2.b);
      recs[base + 8] = EVGDisplayList.fixed(c2.a);
      let flags = 0;
      if ( c2.hasGrad ) {
        flags = flags + 1;
      }
      if ( c2.textAlign == "italic" ) {
        flags = flags + 2;
      }
      if ( c2.flipH ) {
        flags = flags + 4;
      }
      if ( c2.flipV ) {
        flags = flags + 8;
      }
      if ( c2.evenOdd ) {
        flags = flags + 16;
      }
      if ( c2.hasRotOrigin ) {
        flags = flags + 32;
      }
      if ( c2.perCorner ) {
        flags = flags + 64;
      }
      if ( c2.hasShadow ) {
        flags = flags + 128;
      }
      if ( c2.hasCrop ) {
        flags = flags + 256;
      }
      recs[base + 9] = flags;
      recs[base + 10] = c2.gradDir;
      recs[base + 11] = EVGDisplayList.packRgb(c2.r2, c2.g2, c2.b2);
      recs[base + 12] = EVGDisplayList.fixed(c2.a2);
      recs[base + 13] = EVGDisplayList.fixed(c2.fontSize);
      recs[base + 14] = EVGDisplayList.fixed(c2.rotate);
      recs[base + 24] = EVGDisplayList.fixed(c2.rotOriginX);
      recs[base + 25] = EVGDisplayList.fixed(c2.rotOriginY);
      recs[base + 26] = EVGDisplayList.fixed(c2.backdropBlur);
      recs[base + 27] = EVGDisplayList.fixed(c2.radiusTR);
      recs[base + 28] = EVGDisplayList.fixed(c2.radiusBR);
      recs[base + 29] = EVGDisplayList.fixed(c2.radiusBL);
      recs[base + 30] = c2.layer;
      recs[base + 31] = EVGDisplayList.fixed(c2.shadowX);
      recs[base + 32] = EVGDisplayList.fixed(c2.shadowY);
      recs[base + 33] = EVGDisplayList.fixed(c2.shadowBlur);
      recs[base + 34] = EVGDisplayList.packRgb(
        c2.shadowR,
        c2.shadowG,
        c2.shadowB
      );
      recs[base + 35] = EVGDisplayList.fixed(c2.shadowA);
      recs[base + 36] = EVGDisplayList.fixed(c2.letterSpacing);
      recs[base + 37] = c2.strokeCap;
      recs[base + 38] = c2.strokeJoin;
      let dashIdx = 0 - 1;
      if ( c2.strokeDash.length > 0 ) {
        dashIdx = EVGDisplayList.intern(pool, poolIndex, c2.strokeDash);
      }
      recs[base + 39] = dashIdx;
      recs[base + 40] = EVGDisplayList.fixed(c2.strokeDashOffset);
      recs[base + 41] = EVGDisplayList.fixed((c2.cropX * 100.0));
      recs[base + 42] = EVGDisplayList.fixed((c2.cropY * 100.0));
      recs[base + 43] = EVGDisplayList.fixed(((c2.cropX + c2.cropW) * 100.0));
      recs[base + 44] = EVGDisplayList.fixed(((c2.cropY + c2.cropH) * 100.0));
      let textIdx = 0 - 1;
      let fontIdx = 0 - 1;
      let weightIdx = 0 - 1;
      if ( c2.text.length > 0 ) {
        textIdx = EVGDisplayList.intern(pool, poolIndex, c2.text);
        fontIdx = EVGDisplayList.intern(pool, poolIndex, c2.fontFamily);
        if ( c2.fontWeight.length > 0 ) {
          weightIdx = EVGDisplayList.intern(pool, poolIndex, c2.fontWeight);
        }
      }
      recs[base + 15] = textIdx;
      recs[base + 16] = fontIdx;
      recs[base + 17] = weightIdx;
      let srcIdx = 0 - 1;
      if ( c2.src.length > 0 ) {
        srcIdx = EVGDisplayList.intern(pool, poolIndex, c2.src);
      }
      recs[base + 18] = srcIdx;
      const pc2 = c2.pts.length;
      recs[base + 19] = pAt;
      recs[base + 20] = pc2;
      const eStart = eAt;
      if ( pc2 > 0 ) {
        let pi = 0;
        while (pi < pc2) {
          pbuf[pAt + pi] = EVGDisplayList.fixed(c2.pts[pi]);
          pi = pi + 1;
        };
        pAt = pAt + pc2;
        const ec2 = c2.ringEnds.length;
        if ( ec2 == 0 ) {
          ebuf[eAt] = pc2;
          eAt = eAt + 1;
        } else {
          let ei = 0;
          while (ei < ec2) {
            ebuf[eAt + ei] = c2.ringEnds[ei];
            ei = ei + 1;
          };
          eAt = eAt + ec2;
        }
      }
      recs[base + 21] = eStart;
      recs[base + 22] = eAt - eStart;
      k = k + 1;
    };
    out.cmds = recs;
    out.pts = pbuf;
    out.ends = ebuf;
    out.strings = pool;
    return out;
  };
  readEffect (el) {
    if ( this.effectKind.length > 0 ) {
      return;
    }
    if ( el.surfaceEffect.length > 0 ) {
      this.effectKind = el.surfaceEffect;
      this.effectXs = el.rippleXs;
      this.effectYs = el.rippleYs;
      this.effectAges = el.rippleAges;
      this.effectSpeed = el.rippleSpeed;
      this.effectWidth = el.rippleWidth;
      this.effectStrength = el.rippleStrength;
      this.effectDecay = el.rippleDecay;
      this.effectHighlight = el.rippleHighlight;
      this.effectRings = el.rippleRings;
      this.effectStagger = el.rippleStagger;
      this.effectFalloff = el.rippleFalloff;
      this.effectShine = el.rippleShine;
      this.effectGloss = el.rippleGloss;
      this.effectBump = el.rippleBump;
      this.effectLightX = el.rippleLightX;
      this.effectLightY = el.rippleLightY;
      this.effectLightZ = el.rippleLightZ;
    }
    if ( el.paintHasEffect == false && el.surfaceEffect.length == 0 ) {
      return;
    }
    let i = 0;
    while (i < el.getChildCount()) {
      this.readEffect(el.getChild(i));
      i = i + 1;
    };
  };
  collectEffects (el) {
    if ( el.surfaceEffect.length > 0 ) {
      this.addEffect(el);
    }
    if ( el.paintHasEffect == false && el.surfaceEffect.length == 0 ) {
      return;
    }
    let i = 0;
    while (i < el.getChildCount()) {
      this.collectEffects(el.getChild(i));
      i = i + 1;
    };
  };
  pushParam (start, key, value) {
    let i = start;
    while (i < this.fxParamNames.length) {
      if ( this.fxParamNames[i] == key ) {
        return;
      }
      i = i + 1;
    };
    this.fxParamNames.push(key);
    this.fxParamValues.push(value);
  };
  addEffect (el) {
    let id = el.id;
    if ( id.length == 0 ) {
      id = "fx" + (this.fxIds.length.toString());
    }
    el.effectRuntimeId = id;
    this.fxIds.push(id);
    this.fxKinds.push(el.surfaceEffect);
    this.fxTriggers.push(el.effectTrigger);
    this.fxX.push(el.calculatedX);
    this.fxY.push(el.calculatedY);
    this.fxW.push(el.calculatedWidth);
    this.fxH.push(el.calculatedHeight);
    this.fxRadius.push(el.box.borderRadiusPx);
    const start = this.fxParamNames.length;
    this.fxParamStart.push(start);
    let i = 0;
    while (i < el.fxNames.length) {
      this.pushParam(start, el.fxNames[i], el.fxValues[i]);
      i = i + 1;
    };
    if ( el.surfaceEffect == "ripple" ) {
      this.pushParam(start, "speed", el.rippleSpeed);
      this.pushParam(start, "width", el.rippleWidth);
      this.pushParam(start, "strength", el.rippleStrength);
      this.pushParam(start, "decay", el.rippleDecay);
      this.pushParam(start, "highlight", el.rippleHighlight);
      this.pushParam(start, "rings", el.rippleRings);
      this.pushParam(start, "stagger", el.rippleStagger);
      this.pushParam(start, "falloff", el.rippleFalloff);
      this.pushParam(start, "shine", el.rippleShine);
      this.pushParam(start, "gloss", el.rippleGloss);
      this.pushParam(start, "bump", el.rippleBump);
      this.pushParam(start, "lightX", el.rippleLightX);
      this.pushParam(start, "lightY", el.rippleLightY);
      this.pushParam(start, "lightZ", el.rippleLightZ);
    }
    this.fxParamCount.push(this.fxParamNames.length - start);
  };
  toJson () {
    let out = "{";
    if ( this.effectKind.length > 0 ) {
      out = ((out + "\"effect\":{\"kind\":\"") + this.effectKind) + "\"";
      out = out + ",\"drops\":[";
      let di = 0;
      while (di < this.effectAges.length) {
        if ( di > 0 ) {
          out = out + ",";
        }
        out = (out + "[") + EVGDisplayList.num(this.effectXs[di]);
        out = (out + ",") + EVGDisplayList.num(this.effectYs[di]);
        out = ((out + ",") + EVGDisplayList.num(this.effectAges[di])) + "]";
        di = di + 1;
      };
      out = out + "]";
      out = (out + ",\"speed\":") + EVGDisplayList.num(this.effectSpeed);
      out = (out + ",\"width\":") + EVGDisplayList.num(this.effectWidth);
      out = (out + ",\"strength\":") + EVGDisplayList.num(this.effectStrength);
      out = (out + ",\"decay\":") + EVGDisplayList.num(this.effectDecay);
      out = (out + ",\"highlight\":") + EVGDisplayList.num(this.effectHighlight);
      out = (out + ",\"rings\":") + EVGDisplayList.num(this.effectRings);
      out = (out + ",\"stagger\":") + EVGDisplayList.num(this.effectStagger);
      out = (out + ",\"falloff\":") + EVGDisplayList.num(this.effectFalloff);
      out = (out + ",\"shine\":") + EVGDisplayList.num(this.effectShine);
      out = (out + ",\"gloss\":") + EVGDisplayList.num(this.effectGloss);
      out = (out + ",\"bump\":") + EVGDisplayList.num(this.effectBump);
      out = ((((((out + ",\"light\":[") + EVGDisplayList.num(this.effectLightX)) + ",") + EVGDisplayList.num(this.effectLightY)) + ",") + EVGDisplayList.num(this.effectLightZ)) + "]";
      out = out + "},";
    }
    if ( this.fxIds.length > 0 ) {
      out = out + "\"effects\":[";
      let fi = 0;
      while (fi < this.fxIds.length) {
        if ( fi > 0 ) {
          out = out + ",";
        }
        out = (out + "{\"id\":") + EVGDisplayList.jsonString(this.fxIds[fi]);
        out = (out + ",\"kind\":") + EVGDisplayList.jsonString(this.fxKinds[fi]);
        if ( this.fxTriggers[fi].length > 0 ) {
          out = (out + ",\"on\":") + EVGDisplayList.jsonString(this.fxTriggers[fi]);
        }
        out = (out + ",\"box\":[") + EVGDisplayList.num(this.fxX[fi]);
        out = (out + ",") + EVGDisplayList.num(this.fxY[fi]);
        out = (out + ",") + EVGDisplayList.num(this.fxW[fi]);
        out = ((out + ",") + EVGDisplayList.num(this.fxH[fi])) + "]";
        if ( this.fxRadius[fi] > 0.0 ) {
          out = (out + ",\"r\":") + EVGDisplayList.num(this.fxRadius[fi]);
        }
        out = out + ",\"p\":{";
        const ps = this.fxParamStart[fi];
        const pn = this.fxParamCount[fi];
        let pi = 0;
        while (pi < pn) {
          if ( pi > 0 ) {
            out = out + ",";
          }
          out = out + EVGDisplayList.jsonString(this.fxParamNames[(ps + pi)]);
          out = (out + ":") + EVGDisplayList.num(this.fxParamValues[(ps + pi)]);
          pi = pi + 1;
        };
        out = out + "}}";
        fi = fi + 1;
      };
      out = out + "],";
    }
    if ( this.hasView ) {
      out = ((out + "\"view\":[") + EVGDisplayList.fine(this.viewX)) + ",";
      out = (((out + EVGDisplayList.fine(this.viewY)) + ",") + EVGDisplayList.fine(this.viewScale)) + "],";
    }
    out = out + "\"cmds\":[";
    let i = 0;
    while (i < this.cmds.length) {
      const c = this.cmds[i];
      if ( i > 0 ) {
        out = out + ",";
      }
      out = (out + "{\"k\":") + (c.kind.toString());
      if ( c.layer > 0 ) {
        out = (out + ",\"layer\":") + (c.layer.toString());
      }
      if ( this.attribute ) {
        out = (out + ",\"n\":") + (c.node.toString());
      }
      out = (out + ",\"x\":") + EVGDisplayList.num(c.x);
      out = (out + ",\"y\":") + EVGDisplayList.num(c.y);
      out = (out + ",\"w\":") + EVGDisplayList.num(c.w);
      out = (out + ",\"h\":") + EVGDisplayList.num(c.h);
      if ( c.perCorner ) {
        out = ((((((((out + ",\"rc\":[") + EVGDisplayList.num(c.radius)) + ",") + EVGDisplayList.num(c.radiusTR)) + ",") + EVGDisplayList.num(c.radiusBR)) + ",") + EVGDisplayList.num(c.radiusBL)) + "]";
      }
      if ( c.radius > 0.0 ) {
        out = (out + ",\"r\":") + EVGDisplayList.num(c.radius);
      }
      if ( c.thickness > 0.0 ) {
        out = (out + ",\"t\":") + EVGDisplayList.num(c.thickness);
        if ( c.strokeCap != 0 ) {
          out = (out + ",\"cap\":") + (c.strokeCap.toString());
        }
        if ( c.strokeJoin != 0 ) {
          out = (out + ",\"join\":") + (c.strokeJoin.toString());
        }
        if ( c.strokeDash.length > 0 ) {
          out = (out + ",\"dash\":") + EVGDisplayList.jsonString(c.strokeDash);
          if ( c.strokeDashOffset != 0.0 ) {
            out = (out + ",\"dashoff\":") + EVGDisplayList.num(c.strokeDashOffset);
          }
        }
      }
      out = (((out + ",\"c\":[") + (c.r.toString())) + ",") + (c.g.toString());
      out = ((((out + ",") + (c.b.toString())) + ",") + EVGDisplayList.num(c.a)) + "]";
      if ( c.hasGrad ) {
        out = (out + ",\"gd\":") + (c.gradDir.toString());
        out = (((out + ",\"c2\":[") + (c.r2.toString())) + ",") + (c.g2.toString());
        out = ((((out + ",") + (c.b2.toString())) + ",") + EVGDisplayList.num(c.a2)) + "]";
      }
      if ( c.text.length > 0 ) {
        out = (out + ",\"text\":") + EVGDisplayList.jsonString(c.text);
        out = (out + ",\"font\":") + EVGDisplayList.jsonString(c.fontFamily);
        out = (out + ",\"size\":") + EVGDisplayList.num(c.fontSize);
        if ( c.letterSpacing != 0.0 ) {
          out = (out + ",\"ls\":") + EVGDisplayList.num(c.letterSpacing);
        }
        if ( c.fontWeight.length > 0 ) {
          out = (out + ",\"weight\":") + EVGDisplayList.jsonString(c.fontWeight);
        }
        if ( c.textAlign == "italic" ) {
          out = out + ",\"italic\":true";
        }
      }
      if ( c.src.length > 0 ) {
        out = (out + ",\"src\":") + EVGDisplayList.jsonString(c.src);
      }
      if ( c.flipH ) {
        out = out + ",\"fx\":true";
      }
      if ( c.flipV ) {
        out = out + ",\"fy\":true";
      }
      if ( c.hasCrop ) {
        out = (((out + ",\"cu\":[") + EVGDisplayList.frac4(c.cropX)) + ",") + EVGDisplayList.frac4(c.cropY);
        out = ((((out + ",") + EVGDisplayList.frac4((c.cropX + c.cropW))) + ",") + EVGDisplayList.frac4((c.cropY + c.cropH))) + "]";
      }
      if ( c.rotate != 0.0 ) {
        out = (out + ",\"rot\":") + EVGDisplayList.num(c.rotate);
        if ( c.hasRotOrigin ) {
          out = (out + ",\"rox\":") + EVGDisplayList.num(c.rotOriginX);
          out = (out + ",\"roy\":") + EVGDisplayList.num(c.rotOriginY);
        }
      }
      if ( c.effectId.length > 0 ) {
        out = (out + ",\"efx\":") + EVGDisplayList.jsonString(c.effectId);
      }
      if ( c.backdropBlur > 0.0 ) {
        out = (out + ",\"bb\":") + EVGDisplayList.num(c.backdropBlur);
      }
      if ( c.hasShadow ) {
        out = (out + ",\"sh\":{\"x\":") + EVGDisplayList.num(c.shadowX);
        out = (out + ",\"y\":") + EVGDisplayList.num(c.shadowY);
        out = (out + ",\"blur\":") + EVGDisplayList.num(c.shadowBlur);
        out = (((out + ",\"c\":[") + (c.shadowR.toString())) + ",") + (c.shadowG.toString());
        out = ((((out + ",") + (c.shadowB.toString())) + ",") + EVGDisplayList.num(c.shadowA)) + "]}";
      }
      if ( c.pts.length > 0 ) {
        out = out + ",\"pts\":[";
        let pi_1 = 0;
        while (pi_1 < c.pts.length) {
          if ( pi_1 > 0 ) {
            out = out + ",";
          }
          out = out + EVGDisplayList.num(c.pts[pi_1]);
          pi_1 = pi_1 + 1;
        };
        out = out + "],\"ends\":[";
        if ( c.ringEnds.length == 0 ) {
          out = out + (c.pts.length.toString());
        } else {
          let ei = 0;
          while (ei < c.ringEnds.length) {
            if ( ei > 0 ) {
              out = out + ",";
            }
            out = out + (c.ringEnds[ei].toString());
            ei = ei + 1;
          };
        }
        out = out + "]";
        if ( c.evenOdd ) {
          out = out + ",\"eo\":1";
        }
      }
      out = out + "}";
      i = i + 1;
    };
    out = ((out + "],\"seq\":") + (this.buildSeq.toString())) + ",\"shifts\":[";
    let si = 0;
    while (si < this.layerEls.length) {
      if ( si > 0 ) {
        out = out + ",";
      }
      out = ((((out + "[") + EVGDisplayList.num(this.layerShiftX[si])) + ",") + EVGDisplayList.num(this.layerShiftY[si])) + "]";
      si = si + 1;
    };
    out = out + "]}";
    return out;
  };
  offsetBy (dx, dy) {
    let i = 0;
    while (i < this.cmds.length) {
      const c = this.cmds[i];
      if ( c.kind != 5 ) {
        c.x = c.x + dx;
        c.y = c.y + dy;
        let pi = 0;
        while (pi < c.pts.length) {
          const even = pi % 2 == 0;
          if ( even ) {
            c.pts[pi] = c.pts[pi] + dx;
          } else {
            c.pts[pi] = c.pts[pi] + dy;
          }
          pi = pi + 1;
        };
      }
      i = i + 1;
    };
  };
  scaleBy (s) {
    if ( s == 1.0 ) {
      return;
    }
    let i = 0;
    while (i < this.cmds.length) {
      const c = this.cmds[i];
      if ( c.kind != 5 ) {
        c.x = c.x * s;
        c.y = c.y * s;
        c.w = c.w * s;
        c.h = c.h * s;
        c.radius = c.radius * s;
        c.radiusTR = c.radiusTR * s;
        c.radiusBR = c.radiusBR * s;
        c.radiusBL = c.radiusBL * s;
        c.thickness = c.thickness * s;
        c.fontSize = c.fontSize * s;
        c.letterSpacing = c.letterSpacing * s;
        c.maxWidth = c.maxWidth * s;
        c.shadowX = c.shadowX * s;
        c.shadowY = c.shadowY * s;
        c.shadowBlur = c.shadowBlur * s;
        c.strokeDashOffset = c.strokeDashOffset * s;
        c.rotOriginX = c.rotOriginX * s;
        c.rotOriginY = c.rotOriginY * s;
        let pi = 0;
        while (pi < c.pts.length) {
          c.pts[pi] = c.pts[pi] * s;
          pi = pi + 1;
        };
      }
      i = i + 1;
    };
  };
  appendFrom (src) {
    let i = 0;
    while (i < src.cmds.length) {
      this.cmds.push(src.cmds[i]);
      i = i + 1;
    };
  };
  summary () {
    let rects = 0;
    let borders = 0;
    let images = 0;
    let texts = 0;
    let clips = 0;
    let i = 0;
    while (i < this.cmds.length) {
      const c = this.cmds[i];
      if ( c.kind == 0 ) {
        rects = rects + 1;
      }
      if ( c.kind == 1 ) {
        borders = borders + 1;
      }
      if ( c.kind == 2 ) {
        images = images + 1;
      }
      if ( c.kind == 3 ) {
        texts = texts + 1;
      }
      if ( c.kind == 4 ) {
        clips = clips + 1;
      }
      i = i + 1;
    };
    let s = "rects=" + (rects.toString());
    s = (s + " borders=") + (borders.toString());
    s = (s + " images=") + (images.toString());
    s = (s + " text=") + (texts.toString());
    s = (s + " clips=") + (clips.toString());
    return s;
  };
}
EVGDisplayList.holds = function(parent, el) {
  if ( parent == el ) {
    return true;
  }
  let i = 0;
  const n = parent.getChildCount();
  while (i < n) {
    if ( EVGDisplayList.holds(parent.getChild(i), el) ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
EVGDisplayList.ringTarget = function(el, id) {
  let none;
  if ( el.a11yHidden ) {
    return none;
  }
  if ( el.display == "none" ) {
    return none;
  }
  if ( el.id == id ) {
    if ( el.calculatedWidth > 0.0 ) {
      if ( el.calculatedHeight > 0.0 ) {
        const hit = el;
        return hit;
      }
    }
  }
  let i = 0;
  const n = el.getChildCount();
  while (i < n) {
    const found = EVGDisplayList.ringTarget(el.getChild(i), id);
    if ( typeof(found) != "undefined" ) {
      return found;
    }
    i = i + 1;
  };
  return none;
};
EVGDisplayList.radiusPx = function(isPct, pct, already, own) {
  if ( isPct ) {
    return (pct / 100.0) * own;
  }
  return already;
};
EVGDisplayList.sideFactor = function(soFar, side, sum) {
  if ( sum <= 0.0 ) {
    return soFar;
  }
  const f = side / sum;
  if ( f < soFar ) {
    return f;
  }
  return soFar;
};
EVGDisplayList.barNearPx = function() {
  return 36.0;
};
EVGDisplayList.pctLabel = function(pct) {
  return (pct.toString()) + " %";
};
EVGDisplayList.barWidth = function(state, thin) {
  if ( thin ) {
    if ( state >= 2 ) {
      return 7.0;
    }
    if ( state == 1 ) {
      return 5.0;
    }
    return 3.0;
  }
  if ( state >= 2 ) {
    return 11.0;
  }
  if ( state == 1 ) {
    return 8.0;
  }
  return 4.0;
};
EVGDisplayList.normAngle = function(a) {
  let v = a;
  while (v < 0.0) {
    v = v + 360.0;
  };
  while (v >= 360.0) {
    v = v - 360.0;
  };
  return v;
};
EVGDisplayList.applyShadow = function(c, el) {
  const col = el.shadowColor;
  if ( col.isSet == false ) {
    return;
  }
  if ( col.alpha() <= 0.0 ) {
    return;
  }
  let blur = 0.0;
  if ( el.shadowRadius.isSet ) {
    blur = el.shadowRadius.pixels;
  }
  let dx = 0.0;
  if ( el.shadowOffsetX.isSet ) {
    dx = el.shadowOffsetX.pixels;
  }
  let dy = 0.0;
  if ( el.shadowOffsetY.isSet ) {
    dy = el.shadowOffsetY.pixels;
  }
  if ( blur < 0.0 ) {
    blur = 0.0;
  }
  if ( (blur == 0.0 && dx == 0.0) && dy == 0.0 ) {
    return;
  }
  c.hasShadow = true;
  c.shadowX = dx;
  c.shadowY = dy;
  c.shadowBlur = blur;
  c.shadowR = col.red();
  c.shadowG = col.green();
  c.shadowB = col.blue();
  c.shadowA = col.alpha();
};
EVGDisplayList.rasterAngleOfDir = function(dir) {
  if ( dir == 1 ) {
    return 0.0;
  }
  return 90.0;
};
EVGDisplayList.cssAngleOfDir = function(dir) {
  if ( dir == 1 ) {
    return 90.0;
  }
  return 180.0;
};
EVGDisplayList.hasLinearGradient = function(el) {
  if ( el.gradientSet ) {
    return true;
  }
  const g = el.gradient;
  if ( g.isSet == false ) {
    return false;
  }
  if ( g.isLinear == false ) {
    return false;
  }
  return g.getStopCount() > 1;
};
EVGDisplayList.applyGradient = function(c, el) {
  if ( el.gradientSet ) {
    const a0 = el.gradientFrom;
    const b0 = el.gradientTo;
    c.hasGrad = true;
    c.gradDir = el.gradientDir;
    c.r = a0.red();
    c.g = a0.green();
    c.b = a0.blue();
    c.a = a0.alpha();
    c.r2 = b0.red();
    c.g2 = b0.green();
    c.b2 = b0.blue();
    c.a2 = b0.alpha();
    return;
  }
  const g = el.gradient;
  const ang = EVGDisplayList.normAngle(g.angle);
  let dir = 0;
  let swap = false;
  if ( ang >= 45.0 && ang < 135.0 ) {
    dir = 1;
  }
  if ( ang >= 225.0 && ang < 315.0 ) {
    dir = 1;
    swap = true;
  }
  if ( ang < 45.0 || ang >= 315.0 ) {
    swap = true;
  }
  let from = g.getStartColor();
  let to = g.getEndColor();
  if ( swap ) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  c.hasGrad = true;
  c.gradDir = dir;
  c.r = from.red();
  c.g = from.green();
  c.b = from.blue();
  c.a = from.alpha();
  c.r2 = to.red();
  c.g2 = to.green();
  c.b2 = to.blue();
  c.a2 = to.alpha();
};
EVGDisplayList.capCode = function(name) {
  if ( name == "round" ) {
    return 1;
  }
  if ( name == "square" ) {
    return 2;
  }
  return 0;
};
EVGDisplayList.joinCode = function(name) {
  if ( name == "round" ) {
    return 1;
  }
  if ( name == "bevel" ) {
    return 2;
  }
  return 0;
};
EVGDisplayList.stride = function() {
  return 45;
};
EVGDisplayList.fixed = function(v) {
  if ( v < 0.0 ) {
    return 0 - Math.floor( (0.0 - v) * 100.0 + 0.5);
  }
  return Math.floor( v * 100.0 + 0.5);
};
EVGDisplayList.packRgb = function(r, g, b) {
  return (r * 65536 + g * 256) + b;
};
EVGDisplayList.intern = function(pool, index, value) {
  if ( ( typeof(index[value] ) != "undefined" && Object.prototype.hasOwnProperty.call(index, value) ) ) {
    return ( Object.prototype.hasOwnProperty.call(index, value) ? index[value] : undefined );
  }
  const at = pool.length;
  pool.push(value);
  index[value] = at;
  return at;
};
EVGDisplayList.fine = function(v) {
  const limit = 2000000000.0;
  let x = 0.0;
  if ( v > 0.0 ) {
    x = v;
  }
  if ( v < 0.0 ) {
    x = v;
  }
  if ( x > limit ) {
    x = limit;
  }
  if ( x < 0.0 - limit ) {
    x = 0.0 - limit;
  }
  const neg = x < 0.0;
  let av = x;
  if ( neg ) {
    av = 0.0 - x;
  }
  let whole = Math.floor( av);
  const rest = av - whole;
  let frac = Math.floor( rest * 1000000.0 + 0.5);
  if ( frac >= 1000000 ) {
    whole = whole + 1;
    frac = 0;
  }
  let fs = (frac.toString());
  while (fs.length < 6) {
    fs = "0" + fs;
  };
  let out = ((whole.toString()) + ".") + fs;
  if ( neg ) {
    if ( whole > 0 || frac > 0 ) {
      out = "-" + out;
    }
  }
  return out;
};
EVGDisplayList.num = function(v) {
  const limit = 10000000.0;
  let x = 0.0;
  if ( v > 0.0 ) {
    x = v;
  }
  if ( v < 0.0 ) {
    x = v;
  }
  if ( x > limit ) {
    x = limit;
  }
  if ( x < 0.0 - limit ) {
    x = 0.0 - limit;
  }
  const neg = x < 0.0;
  let av = x;
  if ( neg ) {
    av = 0.0 - x;
  }
  const scaled = Math.floor( av * 100.0 + 0.5);
  const whole = ((scaled / 100) | 0);
  const frac = scaled - whole * 100;
  let fs = (frac.toString());
  if ( frac < 10 ) {
    fs = "0" + fs;
  }
  let out = ((whole.toString()) + ".") + fs;
  if ( neg ) {
    if ( scaled > 0 ) {
      out = "-" + out;
    }
  }
  return out;
};
EVGDisplayList.frac4 = function(v) {
  let x = 0.0;
  if ( v > 0.0 ) {
    x = v;
  }
  if ( v < 0.0 ) {
    x = v;
  }
  if ( x > 1000.0 ) {
    x = 1000.0;
  }
  if ( x < 0.0 - 1000.0 ) {
    x = 0.0 - 1000.0;
  }
  const neg = x < 0.0;
  let av = x;
  if ( neg ) {
    av = 0.0 - x;
  }
  const scaled = Math.floor( av * 10000.0 + 0.5);
  const whole = ((scaled / 10000) | 0);
  const frac = scaled - whole * 10000;
  let fs = (frac.toString());
  while (fs.length < 4) {
    fs = "0" + fs;
  };
  let out = ((whole.toString()) + ".") + fs;
  if ( neg ) {
    if ( scaled > 0 ) {
      out = "-" + out;
    }
  }
  return out;
};
EVGDisplayList.jsonString = function(v) {
  let out = "\"";
  let i = 0;
  while (i < v.length) {
    const c = v.charCodeAt(i );
    if ( c == 34 ) {
      out = out + "\\\"";
    } else {
      if ( c == 92 ) {
        out = out + "\\\\";
      } else {
        if ( c < 32 ) {
          out = out + " ";
        } else {
          out = out + String.fromCharCode(c);
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class EVGInspectForce  {
  constructor() {
    if (EVGInspectForce.__singleton_instance != null) {
      return EVGInspectForce.__singleton_instance;
    }
    this.paths = [];
    this.bits = [];
    let a_4 = [];
    this.paths = a_4;
    let b_3 = [];
    this.bits = b_3;
    EVGInspectForce.__singleton_instance = this;
  }
  indexOf (path) {
    let i = 0;
    while (i < this.paths.length) {
      if ( this.paths[i] == path ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  set (path, b) {
    const at = this.indexOf(path);
    if ( b == 0 ) {
      if ( at >= 0 ) {
        this.paths.splice(at, 1).pop();
        this.bits.splice(at, 1).pop();
      }
      return;
    }
    if ( at < 0 ) {
      this.paths.push(path);
      this.bits.push(b);
      return;
    }
    this.bits[at] = b;
  };
  get (path) {
    const at = this.indexOf(path);
    if ( at < 0 ) {
      return 0;
    }
    return this.bits[at];
  };
  count () {
    return this.paths.length;
  };
  clearAll () {
    let a = [];
    this.paths = a;
    let b = [];
    this.bits = b;
  };
}
EVGInspectForce.__singleton_instance = null;
EVGInspectForce.__singleton = function() {
  if (EVGInspectForce.__singleton_instance == null) {
    EVGInspectForce.__singleton_instance = new EVGInspectForce();
  }
  return EVGInspectForce.__singleton_instance;
};
EVGInspectForce.HOVER = function() {
  return 1;
};
EVGInspectForce.FOCUS = function() {
  return 2;
};
EVGInspectForce.PRESSED = function() {
  return 4;
};
EVGInspectForce.DISABLED = function() {
  return 8;
};
class EVGInspect  {
  constructor() {
    this.paths = [];
    this.parentPaths = [];
    this.els = [];
    this.index = {};
    this.built = false;
    this.sheet = undefined;
    this.tally = [];     /* note: unused */
    this.tallyCount = [];     /* note: unused */
    this.acc = "";
    let a_5 = [];
    this.paths = a_5;
    let b_4 = [];
    this.parentPaths = b_4;
    let c_6 = [];
    this.els = c_6;
    let d_3 = {};
    this.index = d_3;
  }
  build (root) {
    let a = [];
    this.paths = a;
    let b = [];
    this.parentPaths = b;
    let c = [];
    this.els = c;
    let d = {};
    this.index = d;
    this.visit(root, "0", "");
    this.built = true;
  };
  visit (el, path, parentPath) {
    const slot = this.paths.length;
    this.paths.push(path);
    this.parentPaths.push(parentPath);
    this.els.push(el);
    this.index[path] = slot;
    el.inspectSlot = slot;
    let i = 0;
    while (i < el.children.length) {
      const kid = el.children[i];
      let seg = (i.toString());
      if ( kid.key.length > 0 ) {
        seg = "k:" + kid.key;
      }
      const kidPath = (path + "/") + seg;
      this.visit(kid, kidPath, path);
      i = i + 1;
    };
  };
  count () {
    return this.paths.length;
  };
  pathAt (slot) {
    if ( slot < 0 ) {
      return "";
    }
    if ( slot >= this.paths.length ) {
      return "";
    }
    return this.paths[slot];
  };
  parentOf (path) {
    const slot = this.slotOf(path);
    if ( slot < 0 ) {
      return "";
    }
    return this.parentPaths[slot];
  };
  slotOf (path) {
    const at = ( Object.prototype.hasOwnProperty.call(this.index, path) ? this.index[path] : undefined );
    if ( typeof(at) === "undefined" ) {
      return 0 - 1;
    }
    return at;
  };
  elementAt (path) {
    const slot = this.slotOf(path);
    if ( slot < 0 ) {
      let miss;
      return miss;
    }
    const hit = this.els[slot];
    return hit;
  };
  hitPath (root, px, py) {
    const hit = new EVGHitTest();
    const order = hit.paintOrderAt(root, px, py);
    let i = order.length - 1;
    while (i >= 0) {
      const el = order[i];
      if ( EVGHitTest.containsPoint(el, px, py) ) {
        return this.pathAt(el.inspectSlot);
      }
      i = i - 1;
    };
    return "";
  };
  treeJson (title, gen, w, h) {
    let out = "{\"evginspect\":1,\"title\":";
    out = out + EVGInspect.jsonString(title);
    out = (out + ",\"gen\":") + (gen.toString());
    out = (out + ",\"w\":") + EVGDisplayList.num(w);
    out = (out + ",\"h\":") + EVGDisplayList.num(h);
    out = out + ",\"root\":\"0\",\"nodes\":[";
    let i = 0;
    while (i < this.paths.length) {
      if ( i > 0 ) {
        out = out + ",";
      }
      out = out + this.nodeBrief(i);
      i = i + 1;
    };
    return out + "]}";
  };
  nodeBrief (slot) {
    const el = this.els[slot];
    const bx = el.box;
    let out = "{\"id\":";
    out = out + EVGInspect.jsonString(this.paths[slot]);
    const pp = this.parentPaths[slot];
    if ( pp.length > 0 ) {
      out = (out + ",\"p\":") + EVGInspect.jsonString(pp);
    }
    out = (out + ",\"slot\":") + (slot.toString());
    out = (out + ",\"tag\":") + EVGInspect.jsonString(el.tagName);
    if ( el.id.length > 0 ) {
      out = (out + ",\"tid\":") + EVGInspect.jsonString(el.id);
    }
    if ( el.className.length > 0 ) {
      out = (out + ",\"cls\":") + EVGInspect.jsonString(el.className);
    }
    if ( el.role.length > 0 ) {
      out = (out + ",\"role\":") + EVGInspect.jsonString(el.role);
    }
    const txt = EVGInspect.clip(el.textContent, 80);
    if ( txt.length > 0 ) {
      out = (out + ",\"text\":") + EVGInspect.jsonString(txt);
    }
    out = (out + ",\"box\":[") + EVGDisplayList.num(el.calculatedX);
    out = (out + ",") + EVGDisplayList.num(el.calculatedY);
    out = (out + ",") + EVGDisplayList.num(el.calculatedWidth);
    out = ((out + ",") + EVGDisplayList.num(el.calculatedHeight)) + "]";
    out = (out + ",\"m\":[") + EVGDisplayList.num(bx.marginTopPx);
    out = (out + ",") + EVGDisplayList.num(bx.marginRightPx);
    out = (out + ",") + EVGDisplayList.num(bx.marginBottomPx);
    out = ((out + ",") + EVGDisplayList.num(bx.marginLeftPx)) + "]";
    out = (out + ",\"b\":") + EVGDisplayList.num(bx.borderWidthPx);
    out = (out + ",\"pd\":[") + EVGDisplayList.num(bx.paddingTopPx);
    out = (out + ",") + EVGDisplayList.num(bx.paddingRightPx);
    out = (out + ",") + EVGDisplayList.num(bx.paddingBottomPx);
    out = ((out + ",") + EVGDisplayList.num(bx.paddingLeftPx)) + "]";
    const flags = this.flagsOf(el);
    if ( flags.length > 0 ) {
      out = ((out + ",\"flags\":[") + flags) + "]";
    }
    out = (out + ",\"kids\":") + (el.children.length.toString());
    return out + "}";
  };
  flagsOf (el) {
    let out = "";
    if ( el.isAbsolute ) {
      out = EVGInspect.addFlag(out, "abs");
    }
    if ( el.isSurface() ) {
      out = EVGInspect.addFlag(out, "overlay");
    }
    if ( el.clipsContent() ) {
      out = EVGInspect.addFlag(out, "clip");
    }
    if ( el.isInline ) {
      out = EVGInspect.addFlag(out, "inline");
    }
    if ( el.isHovered ) {
      out = EVGInspect.addFlag(out, "hover");
    }
    if ( el.isFocused ) {
      out = EVGInspect.addFlag(out, "focus");
    }
    if ( el.isPressed ) {
      out = EVGInspect.addFlag(out, "pressed");
    }
    if ( el.a11yHidden ) {
      out = EVGInspect.addFlag(out, "a11y-hidden");
    }
    return out;
  };
  nodeJson (path) {
    const slot = this.slotOf(path);
    if ( slot < 0 ) {
      return "{\"error\":\"no such node\"}";
    }
    const el = this.els[slot];
    const bx = el.box;
    let out = "{\"id\":";
    out = out + EVGInspect.jsonString(path);
    out = out + ",\"computed\":{";
    let n = 0;
    n = this.prop(n, "display", el.display);
    let pos = el.position;
    if ( el.isAbsolute ) {
      pos = "absolute";
    }
    n = this.prop(n, "position", pos);
    n = this.prop(n, "flex-direction", el.flexDirection);
    n = this.prop(n, "justify-content", el.justifyContent);
    n = this.prop(n, "align-items", el.alignItems);
    n = this.prop(n, "align-content", el.alignContent);
    n = this.prop(n, "flex-wrap", el.flexWrap);
    n = this.numProp(n, "flex-grow", el.flex);
    n = this.numProp(n, "flex-shrink", el.flexShrink);
    n = this.unitProp(n, "flex-basis", el.flexBasis);
    n = this.prop(n, "grid-template-columns", el.gridTemplateColumns);
    n = this.prop(n, "grid-template-rows", el.gridTemplateRows);
    n = this.prop(n, "grid-area", el.gridArea);
    n = this.unitProp(n, "gap", el.gap);
    n = this.unitProp(n, "width", el.width);
    n = this.unitProp(n, "height", el.height);
    n = this.unitProp(n, "min-width", el.minWidth);
    n = this.unitProp(n, "min-height", el.minHeight);
    n = this.unitProp(n, "max-width", el.maxWidth);
    n = this.unitProp(n, "max-height", el.maxHeight);
    n = this.unitProp(n, "left", el.left);
    n = this.unitProp(n, "top", el.top);
    n = this.unitProp(n, "right", el.right);
    n = this.unitProp(n, "bottom", el.bottom);
    n = this.pxProp(n, "margin-top", bx.marginTopPx);
    n = this.pxProp(n, "margin-right", bx.marginRightPx);
    n = this.pxProp(n, "margin-bottom", bx.marginBottomPx);
    n = this.pxProp(n, "margin-left", bx.marginLeftPx);
    n = this.pxProp(n, "padding-top", bx.paddingTopPx);
    n = this.pxProp(n, "padding-right", bx.paddingRightPx);
    n = this.pxProp(n, "padding-bottom", bx.paddingBottomPx);
    n = this.pxProp(n, "padding-left", bx.paddingLeftPx);
    n = this.pxProp(n, "border-width", bx.borderWidthPx);
    n = this.pxProp(n, "border-radius", bx.borderRadiusPx);
    n = this.colorProp(n, "border-color", bx.borderColor);
    n = this.colorProp(n, "background-color", el.backgroundColor);
    n = this.colorProp(n, "color", el.color);
    n = this.numProp(n, "opacity", el.opacity);
    n = this.prop(n, "background-gradient", el.backgroundGradient);
    n = this.prop(n, "font-family", el.fontFamily);
    n = this.unitProp(n, "font-size", el.fontSize);
    n = this.prop(n, "font-weight", el.fontWeight);
    n = this.numProp(n, "line-height", el.lineHeight);
    n = this.prop(n, "text-align", el.textAlign);
    n = this.prop(n, "overflow", el.overflow);
    n = this.prop(n, "cursor", el.cursor);
    n = this.prop(n, "transition", el.transitionSpec);
    n = this.prop(n, "transform", el.transformSpec);
    n = this.numProp(n, "rotate", el.rotate);
    n = this.numProp(n, "scale", el.scale);
    n = this.prop(n, "class", el.className);
    n = this.prop(n, "theme", el.theme);
    n = this.prop(n, "src", el.src);
    n = this.prop(n, "object-fit", el.objectFit);
    out = out + this.acc;
    out = out + "}";
    out = out + ",\"inline\":[";
    let k = 0;
    while (k < el.inlineProps.length) {
      if ( k > 0 ) {
        out = out + ",";
      }
      out = out + EVGInspect.jsonString(el.inlineProps[k]);
      k = k + 1;
    };
    out = out + "]";
    const cx = (el.calculatedX + bx.borderWidthPx) + bx.paddingLeftPx;
    const cy = (el.calculatedY + bx.borderWidthPx) + bx.paddingTopPx;
    const chW = bx.getPaddingHorizontal();
    const chH = bx.getPaddingVertical();
    const bw2 = bx.borderWidthPx * 2.0;
    const cw = (el.calculatedWidth - chW) - bw2;
    const ch = (el.calculatedHeight - chH) - bw2;
    out = (out + ",\"content\":[") + EVGDisplayList.num(cx);
    out = (out + ",") + EVGDisplayList.num(cy);
    out = (out + ",") + EVGDisplayList.num(cw);
    out = ((out + ",") + EVGDisplayList.num(ch)) + "]";
    out = out + this.cascadeJson(el);
    out = (out + ",\"forced\":") + (EVGInspect.forcedState(path).toString());
    out = (out + ",\"styleSlot\":") + (el.styleSlot.toString());
    out = (out + ",\"styleClass\":") + EVGInspect.jsonString(el.styleClass);
    out = (out + ",\"page\":") + (el.calculatedPage.toString());
    const full = EVGInspect.clip(el.textContent, 400);
    out = (out + ",\"textFull\":") + EVGInspect.jsonString(full);
    return out + "}";
  };
  useSheet (s) {
    this.sheet = s;
  };
  countClass (want) {
    let n = 0;
    let i = 0;
    while (i < this.els.length) {
      const el = this.els[i];
      const classes = EVGInspect.splitWs(el.className);
      let j = 0;
      while (j < classes.length) {
        if ( classes[j] == want ) {
          n = n + 1;
          j = classes.length;
        } else {
          j = j + 1;
        }
      };
      i = i + 1;
    };
    return n;
  };
  cascadeJson (el) {
    let out = ",\"classes\":[";
    const classes = EVGInspect.splitWs(el.className);
    let c = 0;
    while (c < classes.length) {
      if ( c > 0 ) {
        out = out + ",";
      }
      const nm = classes[c];
      out = (out + "{\"name\":") + EVGInspect.jsonString(nm);
      out = ((out + ",\"matches\":") + (this.countClass(nm).toString())) + "}";
      c = c + 1;
    };
    out = out + "]";
    if ( typeof(this.sheet) === "undefined" ) {
      return out + ",\"cascade\":[]";
    }
    const sh = this.sheet;
    const slot = el.styleSlot;
    const n = sh.planLength(slot);
    if ( n == 0 ) {
      return out + ",\"cascade\":[]";
    }
    let wonAt = [];
    let seen = [];
    let i = n - 1;
    while (i >= 0) {
      const nm2 = sh.planNameAt(slot, i);
      let already = false;
      let k = 0;
      while (k < seen.length) {
        if ( seen[k] == nm2 ) {
          already = true;
          k = seen.length;
        } else {
          k = k + 1;
        }
      };
      if ( already ) {
        wonAt.push(0);
      } else {
        wonAt.push(1);
        seen.push(nm2);
      }
      i = i - 1;
    };
    out = out + ",\"cascade\":[";
    let w = 0;
    while (w < n) {
      if ( w > 0 ) {
        out = out + ",";
      }
      const ruleIdx = sh.planRuleAt(slot, w);
      out = (out + "{\"p\":") + EVGInspect.jsonString(sh.planNameAt(slot, w));
      out = (out + ",\"v\":") + EVGInspect.jsonString(sh.planValueAt(slot, w));
      out = (out + ",\"sel\":") + EVGInspect.jsonString(sh.selectorOf(ruleIdx));
      const med = sh.ruleMediaOf(ruleIdx);
      if ( med.length > 0 ) {
        out = (out + ",\"media\":") + EVGInspect.jsonString(med);
      }
      const cls = sh.ruleClassOf(ruleIdx);
      if ( cls.length > 0 ) {
        out = (out + ",\"cls\":") + EVGInspect.jsonString(cls);
      }
      const isWin = wonAt[((n - 1) - w)];
      if ( isWin == 1 ) {
        out = out + ",\"win\":true";
      }
      const nm3 = sh.planNameAt(slot, w);
      if ( el.hasInline(nm3) ) {
        out = out + ",\"beatenByInline\":true";
      }
      out = out + "}";
      w = w + 1;
    };
    return out + "]";
  };
  prop (n, name, value) {
    if ( value.length == 0 ) {
      return n;
    }
    return this.write(n, name, value);
  };
  pxProp (n, name, v) {
    const s = EVGDisplayList.num(v) + "px";
    return this.write(n, name, s);
  };
  numProp (n, name, v) {
    return this.write(n, name, EVGDisplayList.num(v));
  };
  unitProp (n, name, u) {
    if ( typeof(u) === "undefined" ) {
      return n;
    }
    const uu = u;
    if ( uu.isSet == false ) {
      return n;
    }
    let s = uu.toString();
    const px = EVGDisplayList.num(uu.pixels);
    const asPx = px + "px";
    if ( s != asPx ) {
      s = (s + "  ->  ") + asPx;
    }
    return this.write(n, name, s);
  };
  colorProp (n, name, c) {
    if ( typeof(c) === "undefined" ) {
      return n;
    }
    const cc = c;
    if ( cc.isSet == false ) {
      return n;
    }
    const s = cc.toCSSString();
    return this.write(n, name, s);
  };
  write (n, name, value) {
    if ( n == 0 ) {
      this.acc = "";
    }
    if ( n > 0 ) {
      this.acc = this.acc + ",";
    }
    this.acc = this.acc + EVGInspect.jsonString(name);
    this.acc = this.acc + ":";
    this.acc = this.acc + EVGInspect.jsonString(value);
    return n + 1;
  };
}
EVGInspect.addFlag = function(soFar, name) {
  if ( soFar.length == 0 ) {
    return ("\"" + name) + "\"";
  }
  return ((soFar + ",\"") + name) + "\"";
};
EVGInspect.splitWs = function(v) {
  let out = [];
  let cur = "";
  let i = 0;
  while (i < v.length) {
    const ch = v.charCodeAt(i );
    if ( ((ch == 32 || ch == 9) || ch == 10) || ch == 13 ) {
      if ( cur.length > 0 ) {
        out.push(cur);
        cur = "";
      }
    } else {
      cur = cur + String.fromCharCode(ch);
    }
    i = i + 1;
  };
  if ( cur.length > 0 ) {
    out.push(cur);
  }
  return out;
};
EVGInspect.applyForced = function(root) {
  const force = EVGInspectForce.__singleton();
  if ( force.count() == 0 ) {
    return;
  }
  const ins = new EVGInspect();
  ins.build(root);
  let i = 0;
  while (i < ins.paths.length) {
    const b = force.get(ins.paths[i]);
    if ( b != 0 ) {
      const el = ins.els[i];
      if ( b % 2 == 1 ) {
        el.isHovered = true;
      }
      const f = ((b / 2) | 0);
      if ( f % 2 == 1 ) {
        el.isFocused = true;
      }
      const p = ((b / 4) | 0);
      if ( p % 2 == 1 ) {
        el.isPressed = true;
      }
      const d = ((b / 8) | 0);
      if ( d % 2 == 1 ) {
        el.a11yDisabled = true;
      }
    }
    i = i + 1;
  };
};
EVGInspect.forceState = function(path, bits) {
  const force = EVGInspectForce.__singleton();
  force.set(path, bits);
};
EVGInspect.forcedState = function(path) {
  const force = EVGInspectForce.__singleton();
  return force.get(path);
};
EVGInspect.forcedCount = function() {
  const force = EVGInspectForce.__singleton();
  return force.count();
};
EVGInspect.clearForced = function() {
  const force = EVGInspectForce.__singleton();
  force.clearAll();
};
EVGInspect.treeOf = function(root, title, gen, w, h) {
  const ins = new EVGInspect();
  ins.build(root);
  return ins.treeJson(title, gen, w, h);
};
EVGInspect.nodeOf = function(root, path) {
  const ins = new EVGInspect();
  ins.build(root);
  return ins.nodeJson(path);
};
EVGInspect.nodeOfIn = function(root, path, sheet) {
  const ins = new EVGInspect();
  ins.build(root);
  ins.useSheet(sheet);
  return ins.nodeJson(path);
};
EVGInspect.hitOf = function(root, px, py) {
  const ins = new EVGInspect();
  ins.build(root);
  return ins.hitPath(root, px, py);
};
EVGInspect.frameOf = function(root) {
  const ins = new EVGInspect();
  ins.build(root);
  const dl = new EVGDisplayList();
  dl.attribute = true;
  dl.build(root);
  return dl.toJson();
};
EVGInspect.clip = function(v, limit) {
  if ( v.length <= limit ) {
    return v;
  }
  const cut = v.substring(0, limit );
  return cut + "…";
};
EVGInspect.jsonString = function(v) {
  let out = "\"";
  let i = 0;
  while (i < v.length) {
    const ch = v.charCodeAt(i );
    if ( ch == 34 ) {
      out = out + "\\\"";
    } else {
      if ( ch == 92 ) {
        out = out + "\\\\";
      } else {
        if ( ch == 10 ) {
          out = out + "\\n";
        } else {
          if ( ch == 13 ) {
            out = out + "\\r";
          } else {
            if ( ch == 9 ) {
              out = out + "\\t";
            } else {
              if ( ch < 32 ) {
                out = out + " ";
              } else {
                out = out + String.fromCharCode(ch);
              }
            }
          }
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class EVGPatchOp  {
  constructor() {
    this.op = "";
    this.at = "";
    this.prop = "";
    this.value = "";
    this.toPath = "";
    this.index = 0;
    this.tag = "";
    this.node = undefined;
    this.stash = 0;
  }
  describe () {
    let s = this.op;
    s = (s + " ") + this.at;
    if ( this.prop.length > 0 ) {
      s = (s + " ") + this.prop;
    }
    if ( this.value.length > 0 ) {
      s = (s + "=") + this.value;
    }
    return s;
  };
}
EVGPatchOp.setProp = function(at, prop, value) {
  const o = new EVGPatchOp();
  o.op = "set-prop";
  o.at = at;
  o.prop = prop;
  o.value = value;
  return o;
};
EVGPatchOp.setId = function(at, value) {
  const o = new EVGPatchOp();
  o.op = "set-id";
  o.at = at;
  o.value = value;
  return o;
};
EVGPatchOp.setCss = function(value) {
  const o = new EVGPatchOp();
  o.op = "set-css";
  o.at = "0";
  o.value = value;
  return o;
};
EVGPatchOp.setText = function(at, value) {
  const o = new EVGPatchOp();
  o.op = "set-text";
  o.at = at;
  o.value = value;
  return o;
};
EVGPatchOp.insertNode = function(at, index, tag) {
  const o = new EVGPatchOp();
  o.op = "insert";
  o.at = at;
  o.index = index;
  o.tag = tag;
  return o;
};
EVGPatchOp.insertTree = function(at, index, kid) {
  const o = new EVGPatchOp();
  o.op = "insert";
  o.at = at;
  o.index = index;
  o.tag = kid.tagName;
  o.node = kid;
  return o;
};
EVGPatchOp.removeNode = function(at) {
  const o = new EVGPatchOp();
  o.op = "remove";
  o.at = at;
  return o;
};
EVGPatchOp.move = function(at, toPath, index) {
  const o = new EVGPatchOp();
  o.op = "move";
  o.at = at;
  o.toPath = toPath;
  o.index = index;
  return o;
};
EVGPatchOp.restore = function(at, index, stash) {
  const o = new EVGPatchOp();
  o.op = "restore";
  o.at = at;
  o.index = index;
  o.stash = stash;
  return o;
};
class EVGPatchResult  {
  constructor() {
    this.ok = true;
    this.applied = 0;
    this.inverse = [];
    this.rejected = [];
    this.stash = [];
    let a_6 = [];
    this.inverse = a_6;
    let b_5 = [];
    this.rejected = b_5;
    let c_7 = [];
    this.stash = c_7;
  }
  reason () {
    if ( this.rejected.length == 0 ) {
      return "";
    }
    return this.rejected[0];
  };
}
class EVGPatch  {
  constructor() {
    this.insp = undefined;
    this.res = undefined;
    this.recording = true;
    this.insp = new EVGInspect();
    this.res = new EVGPatchResult();
  }
  /**
   * Applies ops to a tree, all or nothing, recording an inverse for each.
   * @param {EVGElement} root - The tree to edit.
   * @param {Array<EVGPatchOp>} ops - The edits, applied in order.
   * @returns {EVGPatchResult} What was applied, why it was not, and how to undo it.
   * @private
   */
  apply (root, ops) {
    const out = new EVGPatchResult();
    this.res = out;
    this.recording = true;
    let i = 0;
    while (i < ops.length) {
      const op = ops[i];
      const why = this.applyOne(root, op);
      if ( why.length > 0 ) {
        const msg = (((("op " + (i.toString())) + " (") + op.describe()) + "): ") + why;
        out.rejected.push(msg);
        this.rollback(root);
        out.ok = false;
        out.applied = 0;
        return out;
      }
      out.applied = out.applied + 1;
      i = i + 1;
    };
    return out;
  };
  /**
   * Undoes an applied patch, newest edit first.
   * @param {EVGElement} root - The tree the patch was applied to.
   * @private
   */
  rollback (root) {
    this.recording = false;
    let i = this.res.inverse.length - 1;
    while (i >= 0) {
      const op = this.res.inverse[i];
      const ignored = this.applyOne(root, op);
      i = i - 1;
    };
    this.recording = true;
  };
  applyOne (root, op) {
    this.insp.build(root);
    if ( op.op == "set-prop" ) {
      return this.doSetProp(op);
    }
    if ( op.op == "set-text" ) {
      return this.doSetText(op);
    }
    if ( op.op == "set-id" ) {
      return this.doSetId(op);
    }
    if ( op.op == "set-css" ) {
      return this.doSetCss(root, op);
    }
    if ( op.op == "insert" ) {
      return this.doInsert(op);
    }
    if ( op.op == "remove" ) {
      return this.doRemove(op);
    }
    if ( op.op == "move" ) {
      return this.doMove(op);
    }
    if ( op.op == "restore" ) {
      return this.doRestore(op);
    }
    return "unknown op \"" + (op.op + "\"");
  };
  record (op) {
    if ( this.recording ) {
      this.res.inverse.push(op);
    }
  };
  doSetProp (op) {
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const el = hit;
    const name = EVGElement.toKebab(op.prop);
    if ( EVGPatch.readable(name) == false ) {
      return ("property \"" + name) + "\" is not patchable — nothing here can read it back, so the edit could not be undone";
    }
    const before = EVGPatch.readProp(el, name);
    const wasInline = el.hasInline(name);
    const notesBefore = EVGReject.noteTotal();
    if ( EVGReject.isAbsent(op.value) ) {
      const cleared = EVGPatch.clearProp(el, name);
      if ( cleared == false ) {
        return ("property \"" + name) + "\" cannot be cleared";
      }
      el.unmarkInline(name);
    } else {
      el.setAttribute(name, op.value);
      el.markInline(name);
    }
    const notesAfter = EVGReject.noteTotal();
    if ( notesAfter > notesBefore ) {
      const last = EVGReject.noteCount() - 1;
      let why = "rejected by the engine";
      if ( last >= 0 ) {
        why = EVGReject.noteAt(last);
      }
      const undo = EVGPatch.clearProp(el, name);
      if ( before.length > 0 ) {
        el.setAttribute(name, before);
      }
      if ( wasInline == false ) {
        el.unmarkInline(name);
      }
      return why;
    }
    const inv = EVGPatchOp.setProp(op.at, name, before);
    this.record(inv);
    return "";
  };
  doSetCss (root, op) {
    let want = op.value;
    if ( EVGReject.isAbsent(want) ) {
      want = "";
    }
    const before = root.documentCss;
    root.documentCss = want;
    const inv = EVGPatchOp.setCss(before);
    this.record(inv);
    return "";
  };
  doSetId (op) {
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const el = hit;
    let want = op.value;
    if ( EVGReject.isAbsent(want) ) {
      want = "";
    }
    if ( want.length > 0 ) {
      const other = this.pathOfId(want, op.at);
      if ( other.length > 0 ) {
        return ("id \"" + want) + ("\" is already on " + (other + " — an id names one node, and a press can only reach one of them"));
      }
    }
    const before = el.id;
    el.id = want;
    const inv = EVGPatchOp.setId(op.at, before);
    this.record(inv);
    return "";
  };
  pathOfId (id, skip) {
    const n = this.insp.count();
    let i = 0;
    while (i < n) {
      const p = this.insp.pathAt(i);
      if ( p != skip ) {
        const hit = this.insp.elementAt(p);
        if ( typeof(hit) === "undefined" ) {
        } else {
          const __REGx1 = hit;
          if ( __REGx1.id == id ) {
            return p;
          }
        }
      }
      i = i + 1;
    };
    return "";
  };
  doSetText (op) {
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const el = hit;
    if ( el.children.length > 0 ) {
      return "set-text on a node with children — remove them first, or write to the child that holds the text";
    }
    const before = el.textContent;
    el.textContent = op.value;
    const inv = EVGPatchOp.setText(op.at, before);
    this.record(inv);
    return "";
  };
  doInsert (op) {
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const parent = hit;
    let made = EVGPatch.create(op.tag);
    if ( typeof(op.node) != "undefined" ) {
      made = op.node;
    }
    if ( typeof(made) === "undefined" ) {
      return ("no element type for tag \"" + op.tag) + "\" — div, span, img or path";
    }
    const kid = made;
    const at = EVGPatch.clampIndex(op.index, parent.children.length);
    EVGPatch.insertAt(parent, kid, at);
    const inv = EVGPatchOp.removeNode(EVGPatch.childPath(op.at, parent, at));
    this.record(inv);
    return "";
  };
  doRemove (op) {
    if ( op.at == "0" ) {
      return "cannot remove the root";
    }
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const el = hit;
    const parentPath = this.insp.parentOf(op.at);
    const ph = this.insp.elementAt(parentPath);
    if ( typeof(ph) === "undefined" ) {
      return this.noSuchNode(parentPath);
    }
    const parent = ph;
    const at = EVGPatch.indexOfChild(parent, el);
    if ( at < 0 ) {
      return "the node is not among its parent's children — the index is stale";
    }
    EVGPatch.removeAt(parent, at);
    this.res.stash.push(el);
    const slot = this.res.stash.length - 1;
    const inv = EVGPatchOp.restore(parentPath, at, slot);
    this.record(inv);
    return "";
  };
  doRestore (op) {
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const parent = hit;
    if ( op.stash >= this.res.stash.length ) {
      return "nothing stashed at that slot";
    }
    const el = this.res.stash[op.stash];
    const at = EVGPatch.clampIndex(op.index, parent.children.length);
    EVGPatch.insertAt(parent, el, at);
    const inv = EVGPatchOp.removeNode(EVGPatch.childPath(op.at, parent, at));
    this.record(inv);
    return "";
  };
  doMove (op) {
    if ( op.at == "0" ) {
      return "cannot move the root";
    }
    const hit = this.insp.elementAt(op.at);
    if ( typeof(hit) === "undefined" ) {
      return this.noSuchNode(op.at);
    }
    const el = hit;
    const destHit = this.insp.elementAt(op.toPath);
    if ( typeof(destHit) === "undefined" ) {
      return this.noSuchNode(op.toPath);
    }
    const dest = destHit;
    if ( EVGPatch.subtreeHas(el, dest) ) {
      return "cannot move a node into itself or its own subtree";
    }
    const fromPath = this.insp.parentOf(op.at);
    const fh = this.insp.elementAt(fromPath);
    if ( typeof(fh) === "undefined" ) {
      return this.noSuchNode(fromPath);
    }
    const from = fh;
    const at = EVGPatch.indexOfChild(from, el);
    if ( at < 0 ) {
      return "the node is not among its parent's children — the index is stale";
    }
    EVGPatch.removeAt(from, at);
    const landing = EVGPatch.clampIndex(op.index, dest.children.length);
    EVGPatch.insertAt(dest, el, landing);
    const nowPath = EVGPatch.childPath(op.toPath, dest, landing);
    const inv = EVGPatchOp.move(nowPath, fromPath, at);
    this.record(inv);
    return "";
  };
  noSuchNode (path) {
    const n = this.insp.count();
    return ((("no node at \"" + path) + "\" (") + (n.toString())) + " nodes in this tree)";
  };
}
EVGPatch.insertAt = function(parent, kid, at) {
  let rebuilt = [];
  let i = 0;
  const n = parent.children.length;
  while (i < n) {
    if ( i == at ) {
      rebuilt.push(kid);
    }
    rebuilt.push(parent.children[i]);
    i = i + 1;
  };
  if ( at >= n ) {
    rebuilt.push(kid);
  }
  parent.children = rebuilt;
};
EVGPatch.removeAt = function(parent, at) {
  let rebuilt = [];
  let i = 0;
  const n = parent.children.length;
  while (i < n) {
    if ( i != at ) {
      rebuilt.push(parent.children[i]);
    }
    i = i + 1;
  };
  parent.children = rebuilt;
};
EVGPatch.indexOfChild = function(parent, kid) {
  if ( kid.inspectSlot < 0 ) {
    return 0 - 1;
  }
  let i = 0;
  while (i < parent.children.length) {
    const c = parent.children[i];
    if ( c.inspectSlot == kid.inspectSlot ) {
      return i;
    }
    i = i + 1;
  };
  return 0 - 1;
};
EVGPatch.subtreeHas = function(el, maybe) {
  if ( el.inspectSlot == maybe.inspectSlot ) {
    return true;
  }
  let i = 0;
  while (i < el.children.length) {
    const c = el.children[i];
    if ( EVGPatch.subtreeHas(c, maybe) ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
EVGPatch.clampIndex = function(want, n) {
  if ( want < 0 ) {
    return 0;
  }
  if ( want > n ) {
    return n;
  }
  return want;
};
EVGPatch.childPath = function(parentPath, parent, at) {
  let seg = (at.toString());
  if ( at < parent.children.length ) {
    const kid = parent.children[at];
    if ( kid.key.length > 0 ) {
      seg = "k:" + kid.key;
    }
  }
  return (parentPath + "/") + seg;
};
EVGPatch.KIND_NONE = function() {
  return 0;
};
EVGPatch.KIND_STRING = function() {
  return 1;
};
EVGPatch.KIND_UNIT = function() {
  return 2;
};
EVGPatch.KIND_COLOR = function() {
  return 3;
};
EVGPatch.KIND_NUMBER = function() {
  return 4;
};
EVGPatch.isFx = function(name) {
  if ( name.length <= 7 ) {
    return false;
  }
  return name.substring(0, 7 ) == "evg-fx-";
};
EVGPatch.fxNamesOf = function(el) {
  let out = [];
  let i = 0;
  while (i < el.fxNames.length) {
    out.push("evg-fx-" + el.fxNames[i]);
    i = i + 1;
  };
  return out;
};
EVGPatch.canonical = function(name) {
  const n = EVGElement.toKebab(name);
  if ( n == "class" ) {
    return "class-name";
  }
  return n;
};
EVGPatch.kindOf = function(rawName) {
  const name = EVGPatch.canonical(rawName);
  if ( (name == "display" || name == "position") || name == "flex-direction" ) {
    return 1;
  }
  if ( (name == "justify-content" || name == "align-items") || name == "align-content" ) {
    return 1;
  }
  if ( (name == "flex-wrap" || name == "grid-area") || name == "grid-template-columns" ) {
    return 1;
  }
  if ( (name == "grid-row" || name == "grid-column") || name == "grid-template-areas" ) {
    return 1;
  }
  if ( name == "grid-auto-flow" ) {
    return 1;
  }
  if ( (name == "grid-template-rows" || name == "font-family") || name == "font-weight" ) {
    return 1;
  }
  if ( (name == "text-align" || name == "overflow") || name == "cursor" ) {
    return 1;
  }
  if ( (name == "class-name" || name == "theme") || name == "src" ) {
    return 1;
  }
  if ( (name == "object-fit" || name == "transform") || name == "transition" ) {
    return 1;
  }
  if ( name == "transform-origin" || name == "white-space" ) {
    return 1;
  }
  if ( name == "background-gradient" ) {
    return 1;
  }
  if ( (name == "d" || name == "view-box") || name == "fill-rule" ) {
    return 1;
  }
  if ( (name == "stroke-linecap" || name == "stroke-linejoin") || name == "stroke-dasharray" ) {
    return 1;
  }
  if ( name == "alt" || name == "href" ) {
    return 1;
  }
  if ( (name == "overlay" || name == "overlay-anchor-role") || name == "overlay-side" ) {
    return 1;
  }
  if ( (name == "overlay-align" || name == "position-anchor") || name == "position-area" ) {
    return 1;
  }
  if ( (name == "position-try-fallbacks" || name == "position-try-order") || name == "presentation" ) {
    return 1;
  }
  if ( name == "fit-viewport" ) {
    return 1;
  }
  if ( name == "overlay-gap" || name == "sheet-below" ) {
    return 4;
  }
  if ( (name == "anchor-name" || name == "from") || name == "to" ) {
    return 1;
  }
  if ( (name == "from-side" || name == "to-side") || name == "routing" ) {
    return 1;
  }
  if ( name == "arrow-start" || name == "arrow-end" ) {
    return 1;
  }
  if ( (name == "arrow-size" || name == "from-offset") || name == "to-offset" ) {
    return 4;
  }
  if ( name == "svg" ) {
    return 1;
  }
  if ( name == "gradient-dir" ) {
    return 4;
  }
  if ( name == "evg-surface-effect" || name == "evg-effect-on" ) {
    return 1;
  }
  if ( EVGPatch.isFx(name) ) {
    return 4;
  }
  if ( (name == "width" || name == "height") || name == "min-width" ) {
    return 2;
  }
  if ( (name == "min-height" || name == "max-width") || name == "max-height" ) {
    return 2;
  }
  if ( (name == "left" || name == "top") || name == "right" ) {
    return 2;
  }
  if ( (name == "bottom" || name == "gap") || name == "font-size" ) {
    return 2;
  }
  if ( name == "flex-basis" ) {
    return 2;
  }
  if ( (name == "color" || name == "background-color") || name == "border-color" ) {
    return 3;
  }
  if ( name == "fill" || name == "stroke" ) {
    return 3;
  }
  if ( name == "gradient-from" || name == "gradient-to" ) {
    return 3;
  }
  if ( name == "emoji-color" ) {
    return 3;
  }
  if ( (name == "opacity" || name == "line-height") || name == "flex-grow" ) {
    return 4;
  }
  if ( (name == "flex-shrink" || name == "rotate") || name == "scale" ) {
    return 4;
  }
  if ( name == "stroke-width" || name == "stroke-dashoffset" ) {
    return 4;
  }
  if ( (name == "margin-top" || name == "margin-right") || name == "margin-bottom" ) {
    return 2;
  }
  if ( (name == "margin-left" || name == "padding-top") || name == "padding-right" ) {
    return 2;
  }
  if ( (name == "padding-bottom" || name == "padding-left") || name == "border-width" ) {
    return 2;
  }
  if ( name == "border-radius" ) {
    return 2;
  }
  return 0;
};
EVGPatch.patchableNames = function() {
  let a = [];
  a.push("display");
  a.push("position");
  a.push("flex-direction");
  a.push("justify-content");
  a.push("align-items");
  a.push("align-content");
  a.push("flex-wrap");
  a.push("grid-area");
  a.push("grid-row");
  a.push("grid-column");
  a.push("grid-template-areas");
  a.push("grid-auto-flow");
  a.push("grid-template-columns");
  a.push("grid-template-rows");
  a.push("font-family");
  a.push("font-weight");
  a.push("text-align");
  a.push("overflow");
  a.push("cursor");
  a.push("class-name");
  a.push("theme");
  a.push("src");
  a.push("object-fit");
  a.push("transform");
  a.push("transform-origin");
  a.push("white-space");
  a.push("transition");
  a.push("background-gradient");
  a.push("svg");
  a.push("d");
  a.push("view-box");
  a.push("fill-rule");
  a.push("stroke-linecap");
  a.push("stroke-linejoin");
  a.push("stroke-dasharray");
  a.push("overlay");
  a.push("overlay-anchor-role");
  a.push("overlay-side");
  a.push("overlay-align");
  a.push("overlay-gap");
  a.push("position-anchor");
  a.push("position-try-fallbacks");
  a.push("position-try-order");
  a.push("presentation");
  a.push("sheet-below");
  a.push("fit-viewport");
  a.push("anchor-name");
  a.push("from");
  a.push("to");
  a.push("from-side");
  a.push("to-side");
  a.push("routing");
  a.push("arrow-start");
  a.push("arrow-end");
  a.push("arrow-size");
  a.push("from-offset");
  a.push("to-offset");
  a.push("alt");
  a.push("href");
  a.push("fill");
  a.push("stroke");
  a.push("emoji-color");
  a.push("gradient-from");
  a.push("gradient-to");
  a.push("gradient-dir");
  a.push("stroke-width");
  a.push("stroke-dashoffset");
  a.push("width");
  a.push("height");
  a.push("min-width");
  a.push("min-height");
  a.push("max-width");
  a.push("max-height");
  a.push("left");
  a.push("top");
  a.push("right");
  a.push("bottom");
  a.push("gap");
  a.push("font-size");
  a.push("flex-basis");
  a.push("color");
  a.push("background-color");
  a.push("border-color");
  a.push("evg-surface-effect");
  a.push("evg-effect-on");
  a.push("opacity");
  a.push("line-height");
  a.push("flex-grow");
  a.push("flex-shrink");
  a.push("rotate");
  a.push("scale");
  a.push("margin-top");
  a.push("margin-right");
  a.push("margin-bottom");
  a.push("margin-left");
  a.push("padding-top");
  a.push("padding-right");
  a.push("padding-bottom");
  a.push("padding-left");
  a.push("border-width");
  a.push("border-radius");
  return a;
};
EVGPatch.anchorInsetText = function(side, offset) {
  if ( side.length == 0 ) {
    return "";
  }
  const inner = ("anchor(" + side) + ")";
  if ( offset == 0.0 ) {
    return inner;
  }
  let sign = " + ";
  let mag = offset;
  if ( offset < 0.0 ) {
    sign = " - ";
    mag = 0.0 - offset;
  }
  let out = ("calc(" + inner) + sign;
  out = (out + EVGDisplayList.num(mag)) + "px)";
  return out;
};
/**
 * Whether a property can be patched — which is to say, read back and undone.
 * @param {string} name - A property name, kebab or camel.
 * @returns {boolean} True when an op naming it will be considered.
 * @private
 */
EVGPatch.readable = function(name) {
  return EVGPatch.kindOf(name) != 0;
};
/**
 * Reads a property back in the form setAttribute would accept.
 * @param {EVGElement} el - The element to read.
 * @param {string} name - A patchable property name.
 * @returns {string} The current value, or "" when the property was never set.
 * @private
 */
EVGPatch.readProp = function(el, name) {
  const n = EVGPatch.canonical(name);
  const kind = EVGPatch.kindOf(n);
  if ( kind == 0 ) {
    return "";
  }
  const bx = el.box;
  if ( n == "display" ) {
    return el.display;
  }
  if ( n == "position" ) {
    return el.position;
  }
  if ( n == "flex-direction" ) {
    return el.flexDirection;
  }
  if ( n == "justify-content" ) {
    return el.justifyContent;
  }
  if ( n == "align-items" ) {
    return el.alignItems;
  }
  if ( n == "align-content" ) {
    return el.alignContent;
  }
  if ( n == "flex-wrap" ) {
    return el.flexWrap;
  }
  if ( n == "grid-area" ) {
    return el.gridArea;
  }
  if ( n == "grid-row" ) {
    return el.gridRow;
  }
  if ( n == "grid-column" ) {
    return el.gridColumn;
  }
  if ( n == "grid-template-areas" ) {
    return el.gridTemplateAreas;
  }
  if ( n == "grid-auto-flow" ) {
    return el.gridAutoFlow;
  }
  if ( n == "grid-template-columns" ) {
    return el.gridTemplateColumns;
  }
  if ( n == "grid-template-rows" ) {
    return el.gridTemplateRows;
  }
  if ( n == "font-family" ) {
    return el.fontFamily;
  }
  if ( n == "font-weight" ) {
    return el.fontWeight;
  }
  if ( n == "text-align" ) {
    return el.textAlign;
  }
  if ( n == "overflow" ) {
    return el.overflow;
  }
  if ( n == "cursor" ) {
    return el.cursor;
  }
  if ( n == "class-name" ) {
    return el.className;
  }
  if ( n == "theme" ) {
    return el.theme;
  }
  if ( n == "src" ) {
    return el.src;
  }
  if ( n == "object-fit" ) {
    return el.objectFit;
  }
  if ( n == "transform" ) {
    return el.transformSpec;
  }
  if ( n == "transform-origin" ) {
    return el.transformOriginSpec;
  }
  if ( n == "white-space" ) {
    return el.whiteSpace;
  }
  if ( n == "transition" ) {
    return el.transitionSpec;
  }
  if ( n == "background-gradient" ) {
    return el.backgroundGradient;
  }
  if ( n == "svg" ) {
    return el.svgSource;
  }
  if ( n == "d" ) {
    if ( el.tagName == "connector" ) {
      return "";
    }
    return el.svgPath;
  }
  if ( n == "view-box" ) {
    if ( el.tagName == "connector" ) {
      return "";
    }
    return el.viewBox;
  }
  if ( n == "overlay" ) {
    if ( el.isOverlay ) {
      return "true";
    }
    return "";
  }
  if ( n == "overlay-anchor-role" ) {
    if ( el.isOverlayAnchor ) {
      return "true";
    }
    return "";
  }
  if ( n == "fit-viewport" ) {
    if ( el.fitViewport ) {
      return "true";
    }
    return "";
  }
  if ( n == "overlay-side" ) {
    return el.overlaySide;
  }
  if ( n == "overlay-align" ) {
    return el.overlayAlign;
  }
  if ( n == "overlay-gap" ) {
    return EVGDisplayList.num(el.overlayGap);
  }
  if ( n == "position-anchor" ) {
    return el.positionAnchor;
  }
  if ( n == "position-try-fallbacks" ) {
    return el.positionTryFallbacks;
  }
  if ( n == "position-try-order" ) {
    return el.positionTryOrder;
  }
  if ( n == "presentation" ) {
    return el.presentation;
  }
  if ( n == "sheet-below" ) {
    return EVGDisplayList.num(el.sheetBelow);
  }
  if ( n == "anchor-name" ) {
    return el.anchorName;
  }
  if ( n == "from" ) {
    return el.connectorFrom;
  }
  if ( n == "to" ) {
    return el.connectorTo;
  }
  if ( n == "from-side" ) {
    return el.connectorFromSide;
  }
  if ( n == "to-side" ) {
    return el.connectorToSide;
  }
  if ( n == "routing" ) {
    return el.connectorRouting;
  }
  if ( n == "arrow-start" ) {
    return el.arrowStart;
  }
  if ( n == "arrow-end" ) {
    return el.arrowEnd;
  }
  if ( n == "arrow-size" ) {
    return EVGDisplayList.num(el.arrowSize);
  }
  if ( n == "from-offset" ) {
    return EVGDisplayList.num(el.connectorFromOffset);
  }
  if ( n == "to-offset" ) {
    return EVGDisplayList.num(el.connectorToOffset);
  }
  if ( n == "fill-rule" ) {
    return el.fillRule;
  }
  if ( n == "stroke-linecap" ) {
    return el.strokeLineCap;
  }
  if ( n == "stroke-linejoin" ) {
    return el.strokeLineJoin;
  }
  if ( n == "stroke-dasharray" ) {
    return el.strokeDashArray;
  }
  if ( n == "alt" ) {
    return el.alt;
  }
  if ( n == "href" ) {
    return el.href;
  }
  if ( n == "width" ) {
    return EVGPatch.unitText(el.width);
  }
  if ( n == "height" ) {
    return EVGPatch.unitText(el.height);
  }
  if ( n == "min-width" ) {
    return EVGPatch.unitText(el.minWidth);
  }
  if ( n == "min-height" ) {
    return EVGPatch.unitText(el.minHeight);
  }
  if ( n == "max-width" ) {
    return EVGPatch.unitText(el.maxWidth);
  }
  if ( n == "max-height" ) {
    return EVGPatch.unitText(el.maxHeight);
  }
  if ( n == "left" ) {
    const la = EVGPatch.anchorInsetText(el.anchorLeftSide, el.anchorLeftOffset);
    if ( la.length > 0 ) {
      return la;
    }
    return EVGPatch.unitText(el.left);
  }
  if ( n == "top" ) {
    const ta = EVGPatch.anchorInsetText(el.anchorTopSide, el.anchorTopOffset);
    if ( ta.length > 0 ) {
      return ta;
    }
    return EVGPatch.unitText(el.top);
  }
  if ( n == "right" ) {
    const ra = EVGPatch.anchorInsetText(el.anchorRightSide, el.anchorRightOffset);
    if ( ra.length > 0 ) {
      return ra;
    }
    return EVGPatch.unitText(el.right);
  }
  if ( n == "bottom" ) {
    const ba = EVGPatch.anchorInsetText(el.anchorBottomSide, el.anchorBottomOffset);
    if ( ba.length > 0 ) {
      return ba;
    }
    return EVGPatch.unitText(el.bottom);
  }
  if ( n == "gap" ) {
    return EVGPatch.unitText(el.gap);
  }
  if ( n == "font-size" ) {
    return EVGPatch.unitText(el.fontSize);
  }
  if ( n == "flex-basis" ) {
    return EVGPatch.unitText(el.flexBasis);
  }
  if ( n == "color" ) {
    return EVGPatch.colorText(el.color);
  }
  if ( n == "background-color" ) {
    return EVGPatch.colorText(el.backgroundColor);
  }
  if ( n == "border-color" ) {
    return EVGPatch.colorText(bx.borderColor);
  }
  if ( n == "fill" ) {
    return EVGPatch.colorText(el.fillColor);
  }
  if ( n == "stroke" ) {
    return EVGPatch.colorText(el.strokeColor);
  }
  if ( n == "emoji-color" ) {
    return EVGPatch.colorText(el.emojiColor);
  }
  if ( n == "gradient-from" ) {
    return EVGPatch.gradientText(el.gradientFrom, el.gradientSet);
  }
  if ( n == "gradient-to" ) {
    return EVGPatch.gradientText(el.gradientTo, el.gradientSet);
  }
  if ( n == "evg-surface-effect" ) {
    return el.surfaceEffect;
  }
  if ( n == "evg-effect-on" ) {
    return el.effectTrigger;
  }
  if ( EVGPatch.isFx(n) ) {
    const key = n.substring(7, n.length );
    let i = 0;
    while (i < el.fxNames.length) {
      if ( el.fxNames[i] == key ) {
        return EVGDisplayList.num(el.fxValues[i]);
      }
      i = i + 1;
    };
    return "";
  }
  if ( n == "opacity" ) {
    return EVGDisplayList.num(el.opacity);
  }
  if ( n == "line-height" ) {
    return EVGDisplayList.num(el.lineHeight);
  }
  if ( n == "flex-grow" ) {
    return EVGDisplayList.num(el.flex);
  }
  if ( n == "flex-shrink" ) {
    return EVGDisplayList.num(el.flexShrink);
  }
  if ( n == "rotate" ) {
    return EVGDisplayList.num(el.rotate);
  }
  if ( n == "scale" ) {
    return EVGDisplayList.num(el.scale);
  }
  if ( n == "gradient-dir" ) {
    return EVGDisplayList.num(el.gradientDir);
  }
  if ( n == "stroke-width" ) {
    return EVGDisplayList.num(el.strokeWidth);
  }
  if ( n == "stroke-dashoffset" ) {
    return EVGDisplayList.num(el.strokeDashOffset);
  }
  if ( n == "margin-top" ) {
    return EVGPatch.unitText(bx.marginTop);
  }
  if ( n == "margin-right" ) {
    return EVGPatch.unitText(bx.marginRight);
  }
  if ( n == "margin-bottom" ) {
    return EVGPatch.unitText(bx.marginBottom);
  }
  if ( n == "margin-left" ) {
    return EVGPatch.unitText(bx.marginLeft);
  }
  if ( n == "padding-top" ) {
    return EVGPatch.unitText(bx.paddingTop);
  }
  if ( n == "padding-right" ) {
    return EVGPatch.unitText(bx.paddingRight);
  }
  if ( n == "padding-bottom" ) {
    return EVGPatch.unitText(bx.paddingBottom);
  }
  if ( n == "padding-left" ) {
    return EVGPatch.unitText(bx.paddingLeft);
  }
  if ( n == "border-width" ) {
    return EVGPatch.unitText(bx.borderWidth);
  }
  if ( n == "border-radius" ) {
    return EVGPatch.unitText(bx.borderRadius);
  }
  return "";
};
EVGPatch.clearProp = function(el, name) {
  const n = EVGPatch.canonical(name);
  const kind = EVGPatch.kindOf(n);
  if ( kind == 0 ) {
    return false;
  }
  const bx = el.box;
  if ( n == "display" ) {
    el.display = "block";
    return true;
  }
  if ( n == "position" ) {
    el.position = "relative";
    return true;
  }
  if ( n == "flex-direction" ) {
    el.flexDirection = "column";
    return true;
  }
  if ( n == "justify-content" ) {
    el.justifyContent = "flex-start";
    return true;
  }
  if ( n == "align-items" ) {
    el.alignItems = "flex-start";
    return true;
  }
  if ( n == "align-content" ) {
    el.alignContent = "flex-start";
    return true;
  }
  if ( n == "flex-wrap" ) {
    el.flexWrap = "wrap";
    return true;
  }
  if ( n == "grid-area" ) {
    el.gridArea = "";
    return true;
  }
  if ( n == "grid-row" ) {
    el.gridRow = "";
    return true;
  }
  if ( n == "grid-column" ) {
    el.gridColumn = "";
    return true;
  }
  if ( n == "grid-template-areas" ) {
    el.gridTemplateAreas = "";
    return true;
  }
  if ( n == "grid-auto-flow" ) {
    el.gridAutoFlow = "row";
    return true;
  }
  if ( n == "grid-template-columns" ) {
    el.gridTemplateColumns = "";
    return true;
  }
  if ( n == "grid-template-rows" ) {
    el.gridTemplateRows = "";
    return true;
  }
  if ( n == "font-family" ) {
    el.fontFamily = "Noto Sans";
    return true;
  }
  if ( n == "font-weight" ) {
    el.fontWeight = "normal";
    return true;
  }
  if ( n == "text-align" ) {
    el.textAlign = "left";
    return true;
  }
  if ( n == "overflow" ) {
    el.overflow = "visible";
    return true;
  }
  if ( n == "cursor" ) {
    el.cursor = "";
    return true;
  }
  if ( n == "class-name" ) {
    el.className = "";
    return true;
  }
  if ( n == "theme" ) {
    el.theme = "";
    return true;
  }
  if ( n == "src" ) {
    el.src = "";
    return true;
  }
  if ( n == "object-fit" ) {
    el.objectFit = "cover";
    return true;
  }
  if ( n == "transform" ) {
    el.transformSpec = "";
    return true;
  }
  if ( n == "transform-origin" ) {
    el.transformOriginSpec = "";
    el.transformOriginX = EVGUnit.unset();
    el.transformOriginY = EVGUnit.unset();
    return true;
  }
  if ( n == "white-space" ) {
    el.whiteSpace = "normal";
    return true;
  }
  if ( n == "transition" ) {
    el.transitionSpec = "";
    return true;
  }
  if ( n == "background-gradient" ) {
    el.backgroundGradient = "";
    return true;
  }
  if ( n == "svg" ) {
    el.svgSource = "";
    return true;
  }
  if ( n == "d" ) {
    el.svgPath = "";
    return true;
  }
  if ( n == "view-box" ) {
    el.viewBox = "";
    return true;
  }
  if ( n == "fill-rule" ) {
    el.fillRule = "nonzero";
    return true;
  }
  if ( n == "stroke-linecap" ) {
    el.strokeLineCap = "butt";
    return true;
  }
  if ( n == "stroke-linejoin" ) {
    el.strokeLineJoin = "miter";
    return true;
  }
  if ( n == "stroke-dasharray" ) {
    el.strokeDashArray = "";
    return true;
  }
  if ( n == "overlay" ) {
    el.isOverlay = false;
    return true;
  }
  if ( n == "overlay-anchor-role" ) {
    el.isOverlayAnchor = false;
    return true;
  }
  if ( n == "overlay-side" ) {
    el.overlaySide = "bottom";
    return true;
  }
  if ( n == "overlay-align" ) {
    el.overlayAlign = "start";
    return true;
  }
  if ( n == "overlay-gap" ) {
    el.overlayGap = 4.0;
    return true;
  }
  if ( n == "position-anchor" ) {
    el.positionAnchor = "";
    return true;
  }
  if ( n == "position-try-fallbacks" ) {
    el.positionTryFallbacks = "";
    return true;
  }
  if ( n == "position-try-order" ) {
    el.positionTryOrder = "";
    return true;
  }
  if ( n == "presentation" ) {
    el.presentation = "";
    return true;
  }
  if ( n == "sheet-below" ) {
    el.sheetBelow = 0.0;
    return true;
  }
  if ( n == "fit-viewport" ) {
    el.fitViewport = false;
    return true;
  }
  if ( n == "anchor-name" ) {
    el.anchorName = "";
    return true;
  }
  if ( n == "from" ) {
    el.connectorFrom = "";
    return true;
  }
  if ( n == "to" ) {
    el.connectorTo = "";
    return true;
  }
  if ( n == "from-side" ) {
    el.connectorFromSide = "auto";
    return true;
  }
  if ( n == "to-side" ) {
    el.connectorToSide = "auto";
    return true;
  }
  if ( n == "routing" ) {
    el.connectorRouting = "straight";
    return true;
  }
  if ( n == "arrow-start" ) {
    el.arrowStart = "none";
    return true;
  }
  if ( n == "arrow-end" ) {
    el.arrowEnd = "none";
    return true;
  }
  if ( n == "arrow-size" ) {
    el.arrowSize = 10.0;
    return true;
  }
  if ( n == "from-offset" ) {
    el.connectorFromOffset = 0.0;
    return true;
  }
  if ( n == "to-offset" ) {
    el.connectorToOffset = 0.0;
    return true;
  }
  if ( n == "alt" ) {
    el.alt = "";
    return true;
  }
  if ( n == "href" ) {
    el.href = "";
    return true;
  }
  const u = EVGUnit.unset();
  if ( n == "width" ) {
    el.width = u;
    return true;
  }
  if ( n == "height" ) {
    el.height = u;
    return true;
  }
  if ( n == "min-width" ) {
    el.minWidth = u;
    return true;
  }
  if ( n == "min-height" ) {
    el.minHeight = u;
    return true;
  }
  if ( n == "max-width" ) {
    el.maxWidth = u;
    return true;
  }
  if ( n == "max-height" ) {
    el.maxHeight = u;
    return true;
  }
  if ( n == "left" ) {
    el.left = u;
    el.anchorLeftSide = "";
    el.anchorLeftOffset = 0.0;
    return true;
  }
  if ( n == "top" ) {
    el.top = u;
    el.anchorTopSide = "";
    el.anchorTopOffset = 0.0;
    return true;
  }
  if ( n == "right" ) {
    el.right = u;
    el.anchorRightSide = "";
    el.anchorRightOffset = 0.0;
    return true;
  }
  if ( n == "bottom" ) {
    el.bottom = u;
    el.anchorBottomSide = "";
    el.anchorBottomOffset = 0.0;
    return true;
  }
  if ( n == "gap" ) {
    el.gap = u;
    return true;
  }
  if ( n == "font-size" ) {
    el.fontSize = u;
    return true;
  }
  if ( n == "flex-basis" ) {
    el.flexBasis = u;
    return true;
  }
  const c = EVGColor.noColor();
  if ( n == "color" ) {
    el.color = new EVGColor();
    return true;
  }
  if ( n == "background-color" ) {
    el.backgroundColor = c;
    return true;
  }
  if ( n == "border-color" ) {
    bx.borderColor = c;
    return true;
  }
  if ( n == "fill" ) {
    el.fillColor = c;
    return true;
  }
  if ( n == "stroke" ) {
    el.strokeColor = c;
    return true;
  }
  if ( n == "emoji-color" ) {
    el.emojiColor = c;
    return true;
  }
  if ( n == "gradient-from" ) {
    el.gradientFrom = c;
    el.gradientSet = false;
    return true;
  }
  if ( n == "gradient-to" ) {
    el.gradientTo = c;
    el.gradientSet = false;
    return true;
  }
  if ( n == "evg-surface-effect" ) {
    el.surfaceEffect = "";
    return true;
  }
  if ( n == "evg-effect-on" ) {
    el.effectTrigger = "";
    return true;
  }
  if ( EVGPatch.isFx(n) ) {
    const key = n.substring(7, n.length );
    let names = [];
    let values = [];
    let i = 0;
    while (i < el.fxNames.length) {
      if ( el.fxNames[i] == key ) {
      } else {
        names.push(el.fxNames[i]);
        values.push(el.fxValues[i]);
      }
      i = i + 1;
    };
    el.fxNames = names;
    el.fxValues = values;
    return true;
  }
  if ( n == "opacity" ) {
    el.opacity = 1.0;
    return true;
  }
  if ( n == "line-height" ) {
    el.lineHeight = 0.0;
    return true;
  }
  if ( n == "flex-grow" ) {
    el.flex = 0.0;
    return true;
  }
  if ( n == "flex-shrink" ) {
    el.flexShrink = 1.0;
    return true;
  }
  if ( n == "rotate" ) {
    el.rotate = 0.0;
    return true;
  }
  if ( n == "scale" ) {
    el.scale = 1.0;
    return true;
  }
  if ( n == "stroke-width" ) {
    el.strokeWidth = 0.0;
    return true;
  }
  if ( n == "stroke-dashoffset" ) {
    el.strokeDashOffset = 0.0;
    return true;
  }
  if ( n == "gradient-dir" ) {
    el.gradientDir = 0;
    return true;
  }
  if ( n == "margin-top" ) {
    bx.marginTop = u;
    return true;
  }
  if ( n == "margin-right" ) {
    bx.marginRight = u;
    return true;
  }
  if ( n == "margin-bottom" ) {
    bx.marginBottom = u;
    return true;
  }
  if ( n == "margin-left" ) {
    bx.marginLeft = u;
    return true;
  }
  if ( n == "padding-top" ) {
    bx.paddingTop = u;
    return true;
  }
  if ( n == "padding-right" ) {
    bx.paddingRight = u;
    return true;
  }
  if ( n == "padding-bottom" ) {
    bx.paddingBottom = u;
    return true;
  }
  if ( n == "padding-left" ) {
    bx.paddingLeft = u;
    return true;
  }
  if ( n == "border-width" ) {
    bx.borderWidth = u;
    return true;
  }
  if ( n == "border-radius" ) {
    bx.borderRadius = u;
    return true;
  }
  return false;
};
EVGPatch.unitText = function(u) {
  if ( typeof(u) === "undefined" ) {
    return "";
  }
  const uu = u;
  if ( uu.isSet == false ) {
    return "";
  }
  return uu.toString();
};
EVGPatch.gradientText = function(c, on) {
  if ( on == false ) {
    return "";
  }
  return EVGPatch.colorText(c);
};
EVGPatch.colorText = function(c) {
  if ( typeof(c) === "undefined" ) {
    return "";
  }
  const cc = c;
  if ( cc.isSet == false ) {
    return "";
  }
  return cc.toCSSString();
};
EVGPatch.create = function(tag) {
  const family = EVGPatch.familyOf(tag);
  if ( family < 0 ) {
    let none;
    return none;
  }
  let el = EVGElement.createDiv();
  if ( family == 1 ) {
    el = EVGElement.createSpan();
  }
  if ( family == 2 ) {
    el = EVGElement.createImg();
  }
  if ( family == 3 ) {
    el = EVGElement.createPath();
  }
  el.tagName = tag;
  const out = el;
  return out;
};
EVGPatch.familyOf = function(tag) {
  if ( (tag == "span" || tag == "text") || tag == "Label" ) {
    return 1;
  }
  if ( (tag == "img" || tag == "image") || tag == "Image" ) {
    return 2;
  }
  if ( (tag == "path" || tag == "Path") || tag == "svg" ) {
    return 3;
  }
  if ( tag == "connector" ) {
    return 3;
  }
  if ( tag == "Svg" ) {
    return 3;
  }
  if ( (tag == "div" || tag == "View") || tag == "box" ) {
    return 0;
  }
  if ( (tag == "row" || tag == "column") || tag == "page" ) {
    return 0;
  }
  if ( (tag == "Page" || tag == "print") || tag == "Print" ) {
    return 0;
  }
  if ( (tag == "section" || tag == "Section") || tag == "layer" ) {
    return 0;
  }
  if ( tag == "popover" || tag == "Popover" ) {
    return 0;
  }
  if ( (tag == "Layer" || tag == "divider") || tag == "spacer" ) {
    return 0;
  }
  return 0 - 1;
};
class EVGTreeJson  {
  constructor() {
  }
  node (el, depth) {
    const pad = EVGTreeJson.indent(depth);
    const inner = EVGTreeJson.indent((depth + 1));
    let out = "{";
    out = (out + "\"tag\":") + EVGTreeJson.str(el.tagName);
    if ( el.id.length > 0 ) {
      out = (out + ",\"id\":") + EVGTreeJson.str(el.id);
    }
    if ( el.key.length > 0 ) {
      out = (out + ",\"key\":") + EVGTreeJson.str(el.key);
    }
    if ( el.textContent.length > 0 ) {
      out = (out + ",\"text\":") + EVGTreeJson.str(el.textContent);
    }
    if ( el.role.length > 0 ) {
      out = (out + ",\"role\":") + EVGTreeJson.str(el.role);
    }
    if ( el.a11yLabel.length > 0 ) {
      out = (out + ",\"label\":") + EVGTreeJson.str(el.a11yLabel);
    }
    if ( el.a11yHidden ) {
      out = out + ",\"hidden\":true";
    }
    if ( el.a11yChecked > 0 ) {
      out = (out + ",\"checked\":") + (el.a11yChecked.toString());
    }
    const props = this.props(el);
    if ( props.length > 0 ) {
      out = ((out + ",\"props\":{") + props) + "}";
    }
    const n = el.children.length;
    if ( n > 0 ) {
      out = out + ",\"children\":[";
      let i = 0;
      while (i < n) {
        if ( i > 0 ) {
          out = out + ",";
        }
        out = out + "\n";
        out = out + inner;
        const kid = el.children[i];
        out = out + this.node(kid, (depth + 1));
        i = i + 1;
      };
      out = out + "\n";
      out = out + pad;
      out = out + "]";
    }
    out = out + "}";
    return out;
  };
  props (el) {
    const fresh = EVGPatch.create(el.tagName);
    if ( typeof(fresh) === "undefined" ) {
      return "";
    }
    const blank = fresh;
    const names = EVGPatch.patchableNames();
    let out = "";
    let wrote = 0;
    let i = 0;
    while (i < names.length) {
      const name = names[i];
      const mine = EVGPatch.readProp(el, name);
      const theirs = EVGPatch.readProp(blank, name);
      if ( mine != theirs && el.fromCss(name) == false ) {
        if ( wrote > 0 ) {
          out = out + ",";
        }
        out = out + EVGTreeJson.str(name);
        out = out + ":";
        out = out + EVGTreeJson.str(mine);
        wrote = wrote + 1;
      }
      i = i + 1;
    };
    const fx = EVGPatch.fxNamesOf(el);
    let k = 0;
    while (k < fx.length) {
      const fxName = fx[k];
      if ( el.fromCss(fxName) ) {
        k = k + 1;
      } else {
        if ( wrote > 0 ) {
          out = out + ",";
        }
        out = out + EVGTreeJson.str(fxName);
        out = out + ":";
        out = out + EVGTreeJson.str(EVGPatch.readProp(el, fxName));
        wrote = wrote + 1;
        k = k + 1;
      }
    };
    return out;
  };
}
/**
 * Writes a tree as JSON carrying every patchable property that differs from a fresh element.
 * @param {EVGElement} root - The tree to write.
 * @returns {string} The document text.
 * @private
 */
EVGTreeJson.toText = function(root) {
  const w = new EVGTreeJson();
  let out = "{\"evg\":1";
  if ( root.documentCss.length > 0 ) {
    out = (out + ",\"css\":") + EVGTreeJson.str(root.documentCss);
  }
  out = out + ",\"root\":";
  out = out + w.node(root, 1);
  out = out + "}";
  return out;
};
EVGTreeJson.withCss = function(root, css) {
  if ( typeof(root) === "undefined" ) {
    return root;
  }
  if ( css.length == 0 ) {
    return root;
  }
  const el = root;
  el.documentCss = css;
  const out = el;
  return out;
};
EVGTreeJson.indent = function(depth) {
  let s = "";
  let i = 0;
  while (i < depth) {
    s = s + "  ";
    i = i + 1;
  };
  return s;
};
EVGTreeJson.str = function(v) {
  let out = "\"";
  let i = 0;
  const n = v.length;
  while (i < n) {
    const c = v.charCodeAt(i );
    if ( c == 34 ) {
      out = out + "\\\"";
    } else {
      if ( c == 92 ) {
        out = out + "\\\\";
      } else {
        if ( c == 10 ) {
          out = out + "\\n";
        } else {
          if ( c == 13 ) {
            out = out + "\\r";
          } else {
            if ( c == 9 ) {
              out = out + "\\t";
            } else {
              out = out + v.substring(i, i + 1 );
            }
          }
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
EVGTreeJson.brief = function(path, el) {
  const w = new EVGTreeJson();
  let out = "{\"at\":";
  out = out + EVGTreeJson.str(path);
  out = (out + ",\"tag\":") + EVGTreeJson.str(el.tagName);
  if ( el.id.length > 0 ) {
    out = (out + ",\"id\":") + EVGTreeJson.str(el.id);
  }
  if ( el.key.length > 0 ) {
    out = (out + ",\"key\":") + EVGTreeJson.str(el.key);
  }
  if ( el.textContent.length > 0 ) {
    out = (out + ",\"text\":") + EVGTreeJson.str(el.textContent);
  }
  const props = w.props(el);
  if ( props.length > 0 ) {
    out = ((out + ",\"props\":{") + props) + "}";
  }
  out = (out + ",\"children\":") + (el.children.length.toString());
  return out + "}";
};
/**
 * Reads a tree back from the format `write` produces.
 * @param {string} text - The document text.
 * @returns {EVGElement} The root element, or nothing when the text is not this format.
 * @private
 */
EVGTreeJson.fromText = function(text) {
  const c = new EVGJsonCursor();
  c.src = text;
  c.at = 0;
  c.skipWs();
  if ( c.take() != 123 ) {
    let bad;
    return bad;
  }
  let root;
  let css = "";
  let guard = 0;
  while (c.ok && guard < 64) {
    c.skipWs();
    const ch = c.peek();
    if ( ch == 125 ) {
      const closing = c.take();
      return EVGTreeJson.withCss(root, css);
    }
    if ( ch == 44 ) {
      const comma = c.take();
    } else {
      const key = c.readString();
      c.skipWs();
      const colon = c.take();
      if ( key == "root" ) {
        root = c.readNode();
      } else {
        if ( key == "css" ) {
          css = c.readString();
        } else {
          c.skipValue();
        }
      }
    }
    guard = guard + 1;
  };
  return EVGTreeJson.withCss(root, css);
};
class EVGJsonCursor  {
  constructor() {
    this.src = "";
    this.at = 0;
    this.ok = true;
  }
  peek () {
    if ( this.at >= this.src.length ) {
      return 0;
    }
    return this.src.charCodeAt(this.at );
  };
  take () {
    const c = this.peek();
    this.at = this.at + 1;
    return c;
  };
  skipWs () {
    while (this.at < this.src.length) {
      const c = this.src.charCodeAt(this.at );
      if ( ((c == 32 || c == 10) || c == 13) || c == 9 ) {
        this.at = this.at + 1;
      } else {
        return;
      }
    };
  };
  readString () {
    this.skipWs();
    if ( this.peek() != 34 ) {
      this.ok = false;
      return "";
    }
    const opening = this.take();
    let out = "";
    while (this.at < this.src.length) {
      const c = this.take();
      if ( c == 34 ) {
        return out;
      }
      if ( c == 92 ) {
        const e = this.take();
        if ( e == 110 ) {
          out = out + "\n";
        } else {
          if ( e == 114 ) {
            out = out + "\r";
          } else {
            if ( e == 116 ) {
              out = out + "\t";
            } else {
              if ( e == 117 ) {
                out = out + this.readEscape();
              } else {
                out = out + this.src.substring(this.at - 1, this.at );
              }
            }
          }
        }
      } else {
        out = out + this.src.substring(this.at - 1, this.at );
      }
    };
    this.ok = false;
    return out;
  };
  readEscape () {
    let cp = this.hex4();
    if ( cp < 0 ) {
      return "u";
    }
    if ( EVGCodepoint.isHighSurrogate(cp) ) {
      const save = this.at;
      if ( this.at + 1 < this.src.length ) {
        if ( this.src.charCodeAt(this.at ) == 92 ) {
          if ( this.src.charCodeAt(this.at + 1 ) == 117 ) {
            this.at = this.at + 2;
            const lo = this.hex4();
            if ( EVGCodepoint.isLowSurrogate(lo) ) {
              cp = 65536 + ((cp - 55296) * 1024 + (lo - 56320));
            } else {
              this.at = save;
            }
          }
        }
      }
    }
    return EVGCodepoint.toStr(cp);
  };
  hex4 () {
    if ( this.at + 4 > this.src.length ) {
      return 0 - 1;
    }
    let out = 0;
    let i = 0;
    while (i < 4) {
      const d = EVGJsonCursor.hexDigit(this.src.charCodeAt(this.at + i ));
      if ( d < 0 ) {
        return 0 - 1;
      }
      out = out * 16 + d;
      i = i + 1;
    };
    this.at = this.at + 4;
    return out;
  };
  readBool () {
    this.skipWs();
    if ( this.peek() == 116 ) {
      let i = 0;
      while (i < 4) {
        const taken = this.take();
        i = i + 1;
      };
      return true;
    }
    this.skipValue();
    return false;
  };
  readNumber () {
    this.skipWs();
    let neg = false;
    if ( this.peek() == 45 ) {
      neg = true;
      this.at = this.at + 1;
    }
    let v = 0;
    let digits = 0;
    while (this.at < this.src.length) {
      const c = this.peek();
      if ( c >= 48 && c <= 57 ) {
        v = v * 10 + (c - 48);
        digits = digits + 1;
        this.at = this.at + 1;
      } else {
        if ( digits == 0 ) {
          this.ok = false;
        }
        if ( neg ) {
          return 0 - v;
        }
        return v;
      }
    };
    if ( digits == 0 ) {
      this.ok = false;
    }
    if ( neg ) {
      return 0 - v;
    }
    return v;
  };
  skipValue () {
    this.skipWs();
    const c = this.peek();
    if ( c == 34 ) {
      const ignored = this.readString();
      return;
    }
    if ( c == 123 || c == 91 ) {
      let depth = 0;
      while (this.at < this.src.length) {
        const d = this.take();
        if ( d == 123 || d == 91 ) {
          depth = depth + 1;
        }
        if ( d == 125 || d == 93 ) {
          depth = depth - 1;
          if ( depth == 0 ) {
            return;
          }
        }
        if ( d == 34 ) {
          this.at = this.at - 1;
          const inner = this.readString();
        }
      };
      this.ok = false;
      return;
    }
    while (this.at < this.src.length) {
      const e = this.peek();
      if ( ((e == 44 || e == 125) || e == 93) || e == 32 ) {
        return;
      }
      this.at = this.at + 1;
    };
  };
  readNode () {
    this.skipWs();
    if ( this.take() != 123 ) {
      this.ok = false;
      let bad;
      return bad;
    }
    let tag = "div";
    let id = "";
    let key = "";
    let text = "";
    let role = "";
    let label = "";
    let hidden = false;
    let checked = 0;
    let propNames = [];
    let propValues = [];
    let kids = [];
    while (this.ok) {
      this.skipWs();
      const ch = this.peek();
      if ( ch == 125 ) {
        const closing = this.take();
        const made = EVGPatch.create(tag);
        if ( typeof(made) === "undefined" ) {
          this.ok = false;
          let none;
          return none;
        }
        const el = made;
        el.id = id;
        el.key = key;
        el.textContent = text;
        el.role = role;
        el.a11yLabel = label;
        el.a11yHidden = hidden;
        el.a11yChecked = checked;
        let i = 0;
        while (i < propNames.length) {
          const pn = propNames[i];
          const pv = propValues[i];
          el.setAttribute(pn, pv);
          el.markInline(pn);
          i = i + 1;
        };
        let k = 0;
        while (k < kids.length) {
          el.addChild(kids[k]);
          k = k + 1;
        };
        const out = el;
        return out;
      }
      if ( ch == 44 ) {
        const comma = this.take();
      } else {
        if ( ch == 0 ) {
          this.ok = false;
        } else {
          const field = this.readString();
          this.skipWs();
          const colon = this.take();
          if ( field == "tag" ) {
            tag = this.readString();
          } else {
            if ( field == "id" ) {
              id = this.readString();
            } else {
              if ( field == "key" ) {
                key = this.readString();
              } else {
                if ( field == "text" ) {
                  text = this.readString();
                } else {
                  if ( field == "role" ) {
                    role = this.readString();
                  } else {
                    if ( field == "label" ) {
                      label = this.readString();
                    } else {
                      if ( field == "hidden" ) {
                        hidden = this.readBool();
                      } else {
                        if ( field == "checked" ) {
                          checked = this.readNumber();
                        } else {
                          if ( field == "props" ) {
                            this.readProps(propNames, propValues);
                          } else {
                            if ( field == "children" ) {
                              this.readChildren(kids);
                            } else {
                              this.skipValue();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    let failed;
    return failed;
  };
  readProps (names, values) {
    this.skipWs();
    if ( this.take() != 123 ) {
      this.ok = false;
      return;
    }
    while (this.ok) {
      this.skipWs();
      const ch = this.peek();
      if ( ch == 125 ) {
        const closing = this.take();
        return;
      }
      if ( ch == 44 ) {
        const comma = this.take();
      } else {
        if ( ch == 0 ) {
          this.ok = false;
          return;
        }
        const name = this.readString();
        this.skipWs();
        const colon = this.take();
        const value = this.readString();
        names.push(name);
        values.push(value);
      }
    };
  };
  readChildren (kids) {
    this.skipWs();
    if ( this.take() != 91 ) {
      this.ok = false;
      return;
    }
    while (this.ok) {
      this.skipWs();
      const ch = this.peek();
      if ( ch == 93 ) {
        const closing = this.take();
        return;
      }
      if ( ch == 44 ) {
        const comma = this.take();
      } else {
        if ( ch == 0 ) {
          this.ok = false;
          return;
        }
        const kid = this.readNode();
        if ( typeof(kid) === "undefined" ) {
          this.ok = false;
          return;
        }
        kids.push(kid);
      }
    };
  };
}
EVGJsonCursor.hexDigit = function(c) {
  if ( c >= 48 && c <= 57 ) {
    return c - 48;
  }
  if ( c >= 97 && c <= 102 ) {
    return (c - 97) + 10;
  }
  if ( c >= 65 && c <= 70 ) {
    return (c - 65) + 10;
  }
  return 0 - 1;
};
class Erazer  {
  constructor() {
    this.img = new ImageBuffer();
    this.opts = new ErazerOptions();
    this.opts = ErazerOptions.defaults();
    this.img = new ImageBuffer();
    this.img.init(1, 1);
  }
  absI (v) {
    if ( v < 0 ) {
      return 0 - v;
    }
    return v;
  };
  minI (a, b) {
    if ( a < b ) {
      return a;
    }
    return b;
  };
  maxI (a, b) {
    if ( a > b ) {
      return a;
    }
    return b;
  };
  lumaOf (r, g, b) {
    return ((((r * 77 + g * 150) + b * 29) / 256) | 0);
  };
  colorNear (r0, g0, b0, r1, g1, b1, tol) {
    if ( this.absI(r0 - r1) > tol ) {
      return false;
    }
    if ( this.absI(g0 - g1) > tol ) {
      return false;
    }
    if ( this.absI(b0 - b1) > tol ) {
      return false;
    }
    return true;
  };
  hexByte (v) {
    const h = "0123456789abcdef";
    let x = v;
    if ( x < 0 ) {
      x = 0;
    }
    if ( x > 255 ) {
      x = 255;
    }
    const hi = ((x / 16) | 0);
    const lo = x - hi * 16;
    return h.substring(hi, hi + 1 ) + h.substring(lo, lo + 1 );
  };
  hexOf (r, g, b) {
    return (("#" + this.hexByte(r)) + this.hexByte(g)) + this.hexByte(b);
  };
  tryPush (vis, qx, qy, w, h, x, y, sr, sg, sb, tol, pr, pg, pb, step) {
    if ( x < 0 ) {
      return;
    }
    if ( y < 0 ) {
      return;
    }
    if ( x >= w ) {
      return;
    }
    if ( y >= h ) {
      return;
    }
    const idx = y * w + x;
    if ( vis._view.getUint8(idx) != 0 ) {
      return;
    }
    const pixels = this.img.pixels;
    const off = idx * 4;
    const r = pixels._view.getUint8(off);
    const g = pixels._view.getUint8(off + 1);
    const b = pixels._view.getUint8(off + 2);
    const a = pixels._view.getUint8(off + 3);
    if ( a < 8 ) {
      vis._view.setUint8(idx, 1);
      return;
    }
    let take = false;
    if ( step > 0 ) {
      if ( this.colorNear(r, g, b, sr, sg, sb, this.opts.surfaceTol) ) {
        take = true;
      } else {
        if ( (this.colorNear(r, g, b, pr, pg, pb, step) && this.colorNear(r, g, b, sr, sg, sb, tol)) && (this.colorNear(r, g, b, pr, pg, pb, 1) || this.flatWithin(x, y, w, h, 7)) ) {
          take = true;
        }
      }
    } else {
      take = this.colorNear(r, g, b, sr, sg, sb, tol);
    }
    if ( take ) {
      vis._view.setUint8(idx, 1);
      qx.push(x);
      qy.push(y);
    }
  };
  flood (vis, w, h, sx, sy, tol, step, lab, id) {
    const pixels = this.img.pixels;
    const seedOff = (sy * w + sx) * 4;
    const sr = pixels._view.getUint8(seedOff);
    const sg = pixels._view.getUint8(seedOff + 1);
    const sb = pixels._view.getUint8(seedOff + 2);
    let qx = [];
    let qy = [];
    qx.push(sx);
    qy.push(sy);
    vis._view.setUint8(sy * w + sx, 1);
    let head = 0;
    let minX = sx;
    let minY = sy;
    let maxX = sx;
    let maxY = sy;
    let area = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    while (head < qx.length) {
      const x = qx[head];
      const y = qy[head];
      head = head + 1;
      area = area + 1;
      lab[y * w + x] = id;
      const off = (y * w + x) * 4;
      const cr = pixels._view.getUint8(off);
      const cg = pixels._view.getUint8(off + 1);
      const cb = pixels._view.getUint8(off + 2);
      sumR = sumR + cr;
      sumG = sumG + cg;
      sumB = sumB + cb;
      if ( x < minX ) {
        minX = x;
      }
      if ( y < minY ) {
        minY = y;
      }
      if ( x > maxX ) {
        maxX = x;
      }
      if ( y > maxY ) {
        maxY = y;
      }
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x + 1,
        y,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x - 1,
        y,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x,
        y + 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x,
        y - 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x + 1,
        y + 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x - 1,
        y + 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x + 1,
        y - 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
      this.tryPush(
        vis,
        qx,
        qy,
        w,
        h,
        x - 1,
        y - 1,
        sr,
        sg,
        sb,
        tol,
        cr,
        cg,
        cb,
        step
      );
    };
    const raw = new ErazerRaw();
    raw.x = minX;
    raw.y = minY;
    raw.w = (maxX - minX) + 1;
    raw.h = (maxY - minY) + 1;
    raw.area = area;
    if ( area > 0 ) {
      raw.r = ((sumR / area) | 0);
      raw.g = ((sumG / area) | 0);
      raw.b = ((sumB / area) | 0);
    }
    raw.radius = this.cornerRad(raw);
    this.tagRaw(raw);
    return raw;
  };
  overlapX (a, b) {
    const left = this.maxI(a.x, b.x);
    const right = this.minI(a.maxX(), b.maxX());
    return right - left;
  };
  gapY (a, b) {
    if ( a.maxY() <= b.y ) {
      return b.y - a.maxY();
    }
    if ( b.maxY() <= a.y ) {
      return a.y - b.maxY();
    }
    return 0;
  };
  mergeRaw (a, b) {
    const x2 = this.minI(a.x, b.x);
    const y2 = this.minI(a.y, b.y);
    const mx = this.maxI(a.maxX(), b.maxX());
    const my = this.maxI(a.maxY(), b.maxY());
    const area = a.area + b.area;
    const sumR = a.r * a.area + b.r * b.area;
    const sumG = a.g * a.area + b.g * b.area;
    const sumB = a.b * a.area + b.b * b.area;
    a.x = x2;
    a.y = y2;
    a.w = mx - x2;
    a.h = my - y2;
    a.area = area;
    if ( area > 0 ) {
      a.r = ((sumR / area) | 0);
      a.g = ((sumG / area) | 0);
      a.b = ((sumB / area) | 0);
    }
    b.used = true;
    b.w = 0;
  };
  stitchGlyphs (raws) {
    const n = raws.length;
    let again = true;
    while (again) {
      again = false;
      let i = 0;
      while (i < n) {
        const a = raws[i];
        if ( a.used == false && a.kind == "glyph" ) {
          let j = 0;
          while (j < n) {
            if ( j != i ) {
              const b = raws[j];
              if ( b.used == false && b.w > 0 ) {
                let speck = false;
                if ( b.kind == "glyph" ) {
                  speck = true;
                }
                if ( b.h <= 8 && b.w <= 12 ) {
                  speck = true;
                }
                if ( (speck && this.overlapX(a, b) >= 1) && this.gapY(a, b) <= 5 ) {
                  this.mergeRaw(a, b);
                  this.tagRaw(a);
                  again = true;
                }
              }
            }
            j = j + 1;
          };
        }
        i = i + 1;
      };
    };
  };
  adoptInline (raws) {
    const n = raws.length;
    let again = true;
    let rounds = 0;
    while (again && rounds < 8) {
      again = false;
      rounds = rounds + 1;
      let i = 0;
      while (i < n) {
        const a = raws[i];
        let cand = false;
        if ( (a.used == false && a.w > 0) && ((a.kind == "box" || a.kind == "frame") || a.kind == "icon") ) {
          if ( (a.h >= this.opts.minGlyphH && a.h <= this.opts.maxGlyphH) && a.w <= a.h * 2 + 8 ) {
            cand = true;
          }
        }
        if ( cand ) {
          let j = 0;
          while (j < n) {
            const g = raws[j];
            if ( (j != i && g.used == false) && g.kind == "glyph" ) {
              let gap = a.x - g.maxX();
              if ( g.x > a.x ) {
                gap = g.x - a.maxX();
              }
              const lim = this.maxI(3, ((a.h / 3) | 0));
              const dh = this.absI((a.h - g.h));
              if ( ((gap >= 0 && gap <= lim) && this.absI(a.maxY() - g.maxY()) <= 3) && dh <= this.maxI(4, ((a.h / 2) | 0)) ) {
                a.kind = "glyph";
                again = true;
                j = n;
              }
            }
            j = j + 1;
          };
        }
        i = i + 1;
      };
    };
  };
  chanDist (r0, g0, b0, r1, g1, b1) {
    let d = this.absI((r0 - r1));
    const e = this.absI((g0 - g1));
    const f = this.absI((b0 - b1));
    if ( e > d ) {
      d = e;
    }
    if ( f > d ) {
      d = f;
    }
    return d;
  };
  cornerInset (raw, cx, cy, dx, dy, lim) {
    if ( this.img.isValidCoord(cx, cy) == false ) {
      return 0 - 1;
    }
    const o = this.img.getPixel(cx, cy);
    if ( this.chanDist(o.r, o.g, o.b, raw.r, raw.g, raw.b) <= 3 ) {
      return 0;
    }
    let k = 1;
    while (k < lim) {
      const px = cx + dx * k;
      const py = cy + dy * k;
      if ( this.img.isValidCoord(px, py) ) {
        const c = this.img.getPixel(px, py);
        if ( this.chanDist(c.r, c.g, c.b, raw.r, raw.g, raw.b) < this.chanDist(c.r, c.g, c.b, o.r, o.g, o.b) ) {
          return k;
        }
      }
      k = k + 1;
    };
    return 0 - 1;
  };
  cornerRad (raw) {
    const half = ((this.minI(raw.w, raw.h) / 2) | 0);
    const lim = (((half * 30 + 99) / 100) | 0);
    if ( lim < 1 ) {
      return 0;
    }
    let found = [];
    const x1 = raw.maxX() - 1;
    const y1 = raw.maxY() - 1;
    const c0 = this.cornerInset(raw, raw.x, raw.y, 1, 1, (lim + 1));
    const c1 = this.cornerInset(raw, x1, raw.y, (0 - 1), 1, (lim + 1));
    const c2 = this.cornerInset(raw, raw.x, y1, 1, (0 - 1), (lim + 1));
    const c3 = this.cornerInset(raw, x1, y1, (0 - 1), (0 - 1), (lim + 1));
    if ( c0 >= 0 ) {
      found.push(c0);
    }
    if ( c1 >= 0 ) {
      found.push(c1);
    }
    if ( c2 >= 0 ) {
      found.push(c2);
    }
    if ( c3 >= 0 ) {
      found.push(c3);
    }
    if ( found.length == 0 ) {
      return 0;
    }
    const k = this.medianInt(found);
    if ( k <= 0 ) {
      return 0;
    }
    let r = ((((k * 2 + 1) * 341 + 100) / 200) | 0);
    if ( r > half ) {
      r = half;
    }
    return r;
  };
  hollowAt (raw) {
    const ix = raw.cx();
    const iy = raw.cy();
    if ( this.img.isValidCoord(ix, iy) == false ) {
      return false;
    }
    const c = this.img.getPixel(ix, iy);
    if ( this.colorNear(c.r, c.g, c.b, raw.r, raw.g, raw.b, 36) ) {
      return false;
    }
    return true;
  };
  inkAt (raw, x, y) {
    if ( this.img.isValidCoord(x, y) == false ) {
      return 0;
    }
    const c = this.img.getPixel(x, y);
    if ( this.colorNear(c.r, c.g, c.b, raw.r, raw.g, raw.b, 36) ) {
      return 1;
    }
    return 0;
  };
  ringLike (raw) {
    if ( raw.w < 10 || raw.h < 10 ) {
      return false;
    }
    const mc = this.img.getPixel(raw.cx(), raw.cy());
    if ( this.colorNear(mc.r, mc.g, mc.b, raw.r, raw.g, raw.b, 6) ) {
      return false;
    }
    const x0 = raw.x;
    const y0 = raw.y;
    const x1 = raw.maxX() - 1;
    const y1 = raw.maxY() - 1;
    const qx = ((raw.w / 4) | 0);
    const qy = ((raw.h / 4) | 0);
    let hits = 0;
    hits = hits + this.inkAt(raw, (x0 + qx), y0);
    hits = hits + this.inkAt(raw, raw.cx(), y0);
    hits = hits + this.inkAt(raw, (x1 - qx), y0);
    hits = hits + this.inkAt(raw, (x0 + qx), y1);
    hits = hits + this.inkAt(raw, raw.cx(), y1);
    hits = hits + this.inkAt(raw, (x1 - qx), y1);
    hits = hits + this.inkAt(raw, x0, (y0 + qy));
    hits = hits + this.inkAt(raw, x0, raw.cy());
    hits = hits + this.inkAt(raw, x0, (y1 - qy));
    hits = hits + this.inkAt(raw, x1, (y0 + qy));
    hits = hits + this.inkAt(raw, x1, raw.cy());
    hits = hits + this.inkAt(raw, x1, (y1 - qy));
    return hits >= 11;
  };
  tagRaw (raw) {
    const fr = raw.fillRatio();
    if ( raw.h <= 3 && raw.w >= 16 ) {
      raw.kind = "line";
      return;
    }
    if ( raw.w <= 3 && raw.h >= 16 ) {
      raw.kind = "line";
      return;
    }
    if ( raw.fillRatio() < 0.55 && this.ringLike(raw) ) {
      raw.kind = "frame";
      return;
    }
    if ( (((raw.parts >= 3 && raw.h >= this.opts.minGlyphH) && raw.h <= this.opts.maxGlyphH) && raw.w > (((raw.h * 3) / 2) | 0)) && fr < 0.92 ) {
      raw.kind = "glyph";
      return;
    }
    let glyph = true;
    if ( raw.h < this.opts.minGlyphH ) {
      glyph = false;
    }
    if ( raw.h > this.opts.maxGlyphH ) {
      glyph = false;
    }
    if ( raw.w > raw.h * 2 + 8 ) {
      glyph = false;
    }
    if ( raw.nearSquare() && raw.w >= 12 ) {
      glyph = false;
    }
    if ( (fr > 0.86 && raw.w >= 10) && this.absI(raw.w - raw.h) <= 4 ) {
      glyph = false;
    }
    if ( fr >= 0.7 && raw.area >= 200 ) {
      glyph = false;
    }
    if ( (raw.surface && raw.parts == 1) && raw.area >= 400 ) {
      glyph = false;
    }
    if ( glyph ) {
      raw.kind = "glyph";
      return;
    }
    const hole = this.hollowAt(raw);
    if ( (((raw.nearSquare() && raw.w >= this.opts.iconMin) && raw.w <= this.opts.iconMax) && fr < 0.75) && hole == false ) {
      raw.kind = "icon";
      return;
    }
    if ( ((fr < 0.55 && raw.w >= 10) && raw.h >= 10) && hole ) {
      raw.kind = "frame";
      return;
    }
    raw.kind = "box";
  };
  flatAt (x, y, w, h) {
    return this.flatWithin(x, y, w, h, 2);
  };
  flatWithin (x, y, w, h, tol) {
    const pixels = this.img.pixels;
    const off = (y * w + x) * 4;
    const r = pixels._view.getUint8(off);
    const g = pixels._view.getUint8(off + 1);
    const b = pixels._view.getUint8(off + 2);
    let dy = 0 - 1;
    while (dy <= 1) {
      let dx = 0 - 1;
      while (dx <= 1) {
        const px = x + dx;
        const py = y + dy;
        if ( ((px >= 0 && py >= 0) && px < w) && py < h ) {
          const o = (py * w + px) * 4;
          if ( this.colorNear(r, g, b, pixels._view.getUint8(o), pixels._view.getUint8(o + 1), pixels._view.getUint8(o + 2), tol) == false ) {
            return false;
          }
        }
        dx = dx + 1;
      };
      dy = dy + 1;
    };
    return true;
  };
  findRoot (par, k) {
    let c = k;
    while (par[c] != c) {
      const up = par[c];
      par[c] = par[up];
      c = par[c];
    };
    return c;
  };
  fragJoin (par, frag, lab, a, idx) {
    const b = lab[idx];
    if ( b < 0 || b == a ) {
      return;
    }
    if ( frag[b] == 0 ) {
      return;
    }
    const ra = this.findRoot(par, a);
    const rb = this.findRoot(par, b);
    if ( ra != rb ) {
      par[rb] = ra;
    }
  };
  mergeFragments (all, lab, w, h) {
    const m = all.length;
    let frag = [];
    let par = [];
    const lim = this.opts.maxGlyphH + 4;
    let k = 0;
    while (k < m) {
      const r = all[k];
      let f = 0;
      if ( r.h <= lim && r.kind != "line" ) {
        if ( r.area <= this.opts.fragArea && r.w <= lim ) {
          f = 1;
        }
        if ( (r.surface == false && r.fillRatio() < 0.5) && r.kind != "frame" ) {
          f = 1;
        }
      }
      frag.push(f);
      par.push(k);
      k = k + 1;
    };
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const idx = y * w + x;
        const a = lab[idx];
        if ( a >= 0 ) {
          if ( frag[a] == 1 ) {
            if ( x + 1 < w ) {
              this.fragJoin(par, frag, lab, a, idx + 1);
            }
            if ( y + 1 < h ) {
              this.fragJoin(par, frag, lab, a, idx + w);
              if ( x + 1 < w ) {
                this.fragJoin(par, frag, lab, a, (idx + w) + 1);
              }
              if ( x > 0 ) {
                this.fragJoin(par, frag, lab, a, (idx + w) - 1);
              }
            }
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    let touched = [];
    let t0 = 0;
    while (t0 < m) {
      touched.push(0);
      t0 = t0 + 1;
    };
    let j = 0;
    while (j < m) {
      const root = this.findRoot(par, j);
      if ( root != j ) {
        const into = all[root];
        const gone = all[j];
        const x2 = this.minI(into.x, gone.x);
        const y2 = this.minI(into.y, gone.y);
        const mx = this.maxI(into.maxX(), gone.maxX());
        const my = this.maxI(into.maxY(), gone.maxY());
        into.x = x2;
        into.y = y2;
        into.w = mx - x2;
        into.h = my - y2;
        into.area = into.area + gone.area;
        into.parts = into.parts + gone.parts;
        touched[root] = 1;
      }
      j = j + 1;
    };
    let bgL = [];
    let best = [];
    let c0 = 0;
    while (c0 < m) {
      const rc = all[c0];
      let bl = 0 - 1;
      if ( touched[c0] == 1 ) {
        let bx = rc.x - 1;
        if ( bx < 0 ) {
          bx = rc.maxX();
        }
        const by = rc.cy();
        if ( this.img.isValidCoord(bx, by) ) {
          const bc = this.img.getPixel(bx, by);
          bl = this.lumaOf(bc.r, bc.g, bc.b);
        }
      }
      bgL.push(bl);
      best.push(0 - 1);
      c0 = c0 + 1;
    };
    let j2 = 0;
    while (j2 < m) {
      const root2 = this.findRoot(par, j2);
      if ( touched[root2] == 1 ) {
        const piece = all[j2];
        const bl2 = bgL[root2];
        if ( bl2 >= 0 && piece.area >= 3 ) {
          const con = this.absI((this.lumaOf(piece.r, piece.g, piece.b) - bl2));
          if ( con > best[root2] ) {
            best[root2] = con;
            const into2 = all[root2];
            into2.r = piece.r;
            into2.g = piece.g;
            into2.b = piece.b;
          }
        }
      }
      j2 = j2 + 1;
    };
    let j3 = 0;
    while (j3 < m) {
      if ( this.findRoot(par, j3) != j3 ) {
        const gone3 = all[j3];
        gone3.used = true;
        gone3.w = 0;
      }
      j3 = j3 + 1;
    };
    let q = 0;
    while (q < m) {
      if ( touched[q] == 1 ) {
        const raw = all[q];
        raw.radius = this.cornerRad(raw);
        this.tagRaw(raw);
      }
      q = q + 1;
    };
  };
  measureGradients (all, lab, w, h) {
    const m = all.length;
    let slot = [];
    let big = 0;
    let i = 0;
    while (i < m) {
      const r = all[i];
      if ( (((r.surface && r.used == false) && r.area >= 4000) && r.w >= 40) && r.h >= 40 ) {
        slot.push(big);
        big = big + 1;
      } else {
        slot.push(0 - 1);
      }
      i = i + 1;
    };
    if ( big == 0 ) {
      return;
    }
    let acc = [];
    let z = 0;
    while (z < big * 16) {
      acc.push(0);
      z = z + 1;
    };
    const pixels = this.img.pixels;
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const idx = y * w + x;
        const id = lab[idx];
        if ( id >= 0 ) {
          const sl = slot[id];
          if ( sl >= 0 ) {
            const r2 = all[id];
            const off = idx * 4;
            const base = sl * 16;
            const qh = ((r2.h / 4) | 0);
            const qw = ((r2.w / 4) | 0);
            if ( y < r2.y + qh ) {
              this.addAcc(acc, base, pixels, off);
            }
            if ( y >= r2.maxY() - qh ) {
              this.addAcc(acc, base + 4, pixels, off);
            }
            if ( x < r2.x + qw ) {
              this.addAcc(acc, base + 8, pixels, off);
            }
            if ( x >= r2.maxX() - qw ) {
              this.addAcc(acc, base + 12, pixels, off);
            }
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    let j = 0;
    while (j < m) {
      const sl2 = slot[j];
      if ( sl2 >= 0 ) {
        const r3 = all[j];
        const base2 = sl2 * 16;
        const dv = this.accSpread(acc, base2, (base2 + 4));
        const dh = this.accSpread(acc, (base2 + 8), (base2 + 12));
        let from = base2;
        let to = base2 + 4;
        let dir = 0;
        let spread = dv;
        if ( dh > dv ) {
          from = base2 + 8;
          to = base2 + 12;
          dir = 1;
          spread = dh;
        }
        if ( spread >= 10 ) {
          r3.gradDir = dir;
          r3.gFromR = this.stopOut(acc, from, to, 0);
          r3.gFromG = this.stopOut(acc, from, to, 1);
          r3.gFromB = this.stopOut(acc, from, to, 2);
          r3.gToR = this.stopOut(acc, to, from, 0);
          r3.gToG = this.stopOut(acc, to, from, 1);
          r3.gToB = this.stopOut(acc, to, from, 2);
        }
      }
      j = j + 1;
    };
  };
  addAcc (acc, at, pixels, off) {
    acc[at] = acc[at] + pixels._view.getUint8(off);
    acc[at + 1] = acc[(at + 1)] + pixels._view.getUint8(off + 1);
    acc[at + 2] = acc[(at + 2)] + pixels._view.getUint8(off + 2);
    acc[at + 3] = acc[(at + 3)] + 1;
  };
  accMean (acc, at, ch) {
    const n = acc[(at + 3)];
    if ( n <= 0 ) {
      return 0;
    }
    return ((acc[(at + ch)] / n) | 0);
  };
  accSpread (acc, a, b) {
    if ( acc[(a + 3)] < 50 || acc[(b + 3)] < 50 ) {
      return 0;
    }
    let d = 0;
    let ch = 0;
    while (ch < 3) {
      const v = this.absI((this.accMean(
        acc,
        a,
        ch
      ) - this.accMean(acc, b, ch)));
      if ( v > d ) {
        d = v;
      }
      ch = ch + 1;
    };
    return d;
  };
  stopOut (acc, near, far, ch) {
    const a = this.accMean(acc, near, ch);
    const b = this.accMean(acc, far, ch);
    const v = a + (((a - b) / 6) | 0);
    if ( v < 0 ) {
      return 0;
    }
    if ( v > 255 ) {
      return 255;
    }
    return v;
  };
  components () {
    const w = this.img.width;
    const h = this.img.height;
    const n = w * h;
    let vis = (function(){ var b = new ArrayBuffer(n); b._view = new DataView(b); return b; })();
    (function(
      b,
      v,
      s,
      e
    ){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(vis,0,0,n);
    let lab = [];
    let z = 0;
    while (z < n) {
      lab.push(0 - 1);
      z = z + 1;
    };
    let all = [];
    let i = 0;
    while (i < n) {
      if ( vis._view.getUint8(i) == 0 ) {
        const y = ((i / w) | 0);
        const x = i - y * w;
        if ( this.flatAt(x, y, w, h) ) {
          const sraw = this.flood(
            vis,
            w,
            h,
            x,
            y,
            this.opts.surfaceDrift,
            this.opts.surfaceStep,
            lab,
            all.length
          );
          sraw.surface = true;
          this.tagRaw(sraw);
          all.push(sraw);
        }
      }
      i = i + 1;
    };
    let i2 = 0;
    while (i2 < n) {
      if ( vis._view.getUint8(i2) == 0 ) {
        const y2 = ((i2 / w) | 0);
        const x2 = i2 - y2 * w;
        all.push(this.flood(
          vis,
          w,
          h,
          x2,
          y2,
          this.opts.colorTol,
          0,
          lab,
          all.length
        ));
      }
      i2 = i2 + 1;
    };
    this.mergeFragments(all, lab, w, h);
    this.measureGradients(all, lab, w, h);
    let out = [];
    let o = 0;
    while (o < all.length) {
      const raw = all[o];
      if ( raw.used == false && raw.area >= this.opts.minArea ) {
        out.push(raw);
      }
      o = o + 1;
    };
    return out;
  };
  sortRawByYX (arr) {
    const n = arr.length;
    let i = 1;
    while (i < n) {
      let j = i;
      let keep = true;
      while (j > 0 && keep) {
        const a = arr[j];
        const b = arr[(j - 1)];
        let swap = false;
        if ( a.y < b.y - 2 ) {
          swap = true;
        } else {
          if ( this.absI(a.y - b.y) <= 2 ) {
            if ( a.x < b.x ) {
              swap = true;
            }
          }
        }
        if ( swap ) {
          arr[j - 1] = a;
          arr[j] = b;
          j = j - 1;
        } else {
          keep = false;
        }
      };
      i = i + 1;
    };
  };
  sortRawByX (arr) {
    const n = arr.length;
    let i = 1;
    while (i < n) {
      let j = i;
      let keep = true;
      while (j > 0 && keep) {
        const a = arr[j];
        const b = arr[(j - 1)];
        if ( a.x < b.x ) {
          arr[j - 1] = a;
          arr[j] = b;
          j = j - 1;
        } else {
          keep = false;
        }
      };
      i = i + 1;
    };
  };
  sortNodesByAreaAsc (arr) {
    const n = arr.length;
    let i = 1;
    while (i < n) {
      let j = i;
      let keep = true;
      while (j > 0 && keep) {
        const a = arr[j];
        const b = arr[(j - 1)];
        const aa = a.w * a.h;
        const bb = b.w * b.h;
        if ( aa < bb ) {
          arr[j - 1] = a;
          arr[j] = b;
          j = j - 1;
        } else {
          keep = false;
        }
      };
      i = i + 1;
    };
  };
  lineOf (glyphs, start) {
    let members = [];
    const seed = glyphs[start];
    members.push(seed);
    seed.used = true;
    let base = seed.maxY();
    let hh = seed.h;
    let left = seed.x;
    let right = seed.maxX();
    const n = glyphs.length;
    let grew = true;
    while (grew) {
      grew = false;
      let j = start + 1;
      while (j < n) {
        const g = glyphs[j];
        if ( g.used == false ) {
          const dy = this.absI((g.maxY() - base));
          const dh = this.absI((g.h - hh));
          let gap = g.x - right;
          if ( g.maxX() <= left ) {
            gap = left - g.maxX();
          }
          if ( g.x < right && g.maxX() > left ) {
            gap = 0;
          }
          const maxGap = hh + 6;
          if ( (dy <= 5 && dh <= this.maxI(5, ((hh / 2) | 0))) && gap <= maxGap ) {
            members.push(g);
            g.used = true;
            grew = true;
            if ( g.maxX() > right ) {
              right = g.maxX();
            }
            if ( g.x < left ) {
              left = g.x;
            }
            if ( g.h > hh ) {
              hh = g.h;
            }
            const nb = g.maxY();
            if ( nb > base ) {
              base = nb;
            }
          }
        }
        j = j + 1;
      };
    };
    return members;
  };
  textFromGlyphs (members) {
    this.sortRawByX(members);
    const n = members.length;
    const g0 = members[0];
    let minX = g0.x;
    let minY = g0.y;
    let maxX = g0.maxX();
    let maxY = g0.maxY();
    let sumH = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let i = 0;
    while (i < n) {
      const g = members[i];
      if ( g.x < minX ) {
        minX = g.x;
      }
      if ( g.y < minY ) {
        minY = g.y;
      }
      if ( g.maxX() > maxX ) {
        maxX = g.maxX();
      }
      if ( g.maxY() > maxY ) {
        maxY = g.maxY();
      }
      sumH = sumH + g.h;
      sumR = sumR + g.r;
      sumG = sumG + g.g;
      sumB = sumB + g.b;
      i = i + 1;
    };
    const node = ErazerNode.of(
      "text",
      minX,
      minY,
      (maxX - minX),
      (maxY - minY),
      0,
      0,
      0
    );
    node.fontSize = ((sumH / n) | 0);
    node.textR = ((sumR / n) | 0);
    node.textG = ((sumG / n) | 0);
    node.textB = ((sumB / n) | 0);
    node.r = node.textR;
    node.g = node.textG;
    node.b = node.textB;
    node.confidence = 0.7;
    let text = "";
    if ( this.opts.ocr ) {
      const lineH = maxY - minY;
      text = this.ocrLine(
        minX,
        minY,
        maxX,
        maxY,
        lineH,
        node.textR,
        node.textG,
        node.textB
      );
    }
    node.text = text;
    return node;
  };
  ocrLine (minX, minY, maxX, maxY, lineH, inkR, inkG, inkB) {
    let cell = ((lineH / 7) | 0);
    if ( cell < 1 ) {
      cell = 1;
    }
    const step = cell * 6;
    const win = cell * 5;
    let text = "";
    let x = minX;
    let guard = 0;
    let distSum = 0;
    let read = 0;
    while (x + cell * 3 <= maxX + cell) {
      const bits = ErazerFont.sampleBits(
        this.img,
        x,
        minY,
        win,
        lineH,
        minY,
        lineH,
        inkR,
        inkG,
        inkB
      );
      const ch = ErazerFont.matchBits(bits);
      if ( ch.length == 0 ) {
        x = x + cell;
      } else {
        if ( ch == " " ) {
          x = x + cell;
        } else {
          text = text + ch;
          distSum = distSum + ErazerFont.matchDist(bits);
          read = read + 1;
          x = x + step;
        }
      }
      guard = guard + 1;
      if ( guard > 80 ) {
        x = maxX + cell;
      }
    };
    if ( read > 0 && distSum * 10 > read * 25 ) {
      return "";
    }
    if ( this.wordChars(text) * 2 < text.length ) {
      return "";
    }
    return text;
  };
  wordChars (s) {
    const keep = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let c = 0;
    let i = 0;
    while (i < s.length) {
      const ch = s.substring(i, i + 1 );
      if ( keep.indexOf(ch) >= 0 ) {
        c = c + 1;
      }
      i = i + 1;
    };
    return c;
  };
  clusterText (raws) {
    let glyphs = [];
    let i = 0;
    while (i < raws.length) {
      const r = raws[i];
      if ( r.used == false && r.kind == "glyph" ) {
        glyphs.push(r);
      }
      i = i + 1;
    };
    this.sortRawByYX(glyphs);
    let out = [];
    let j = 0;
    while (j < glyphs.length) {
      const g = glyphs[j];
      if ( g.used == false ) {
        const members = this.lineOf(glyphs, j);
        let skipTiny = false;
        if ( members.length == 1 ) {
          const only = members[0];
          if ( only.w <= 5 && only.h <= 12 ) {
            skipTiny = true;
          }
        }
        if ( skipTiny == false ) {
          out.push(this.textFromGlyphs(members));
        }
      }
      j = j + 1;
    };
    this.mergeTextRuns(out);
    let live = [];
    let k = 0;
    while (k < out.length) {
      const n = out[k];
      if ( n.w > 0 ) {
        live.push(n);
      }
      k = k + 1;
    };
    return live;
  };
  mergeTextRuns (texts) {
    const n = texts.length;
    let again = true;
    while (again) {
      again = false;
      let i = 0;
      while (i < n) {
        const a = texts[i];
        if ( a.w > 0 ) {
          let j = 0;
          while (j < n) {
            if ( j != i ) {
              const b = texts[j];
              if ( b.w > 0 ) {
                const dy = this.absI((a.maxY() - b.maxY()));
                const gap = b.x - a.maxX();
                const maxGap = this.maxI(a.h, b.h) + 6;
                if ( ((dy <= 5 && gap >= 0 - 8) && gap <= maxGap) && this.absI(a.y - b.y) <= 8 ) {
                  let left = a;
                  let right = b;
                  if ( b.x < a.x ) {
                    left = b;
                    right = a;
                  }
                  let sp = "";
                  const realGap = right.x - left.maxX();
                  if ( realGap > (((left.h * 2) / 3) | 0) ) {
                    sp = " ";
                  }
                  left.text = (left.text + sp) + right.text;
                  const x2 = this.minI(left.x, right.x);
                  const y2 = this.minI(left.y, right.y);
                  const mx = this.maxI((left.x + left.w), (right.x + right.w));
                  const my = this.maxI((left.y + left.h), (right.y + right.h));
                  left.x = x2;
                  left.y = y2;
                  left.w = mx - x2;
                  left.h = my - y2;
                  if ( right.fontSize > left.fontSize ) {
                    left.fontSize = right.fontSize;
                  }
                  right.w = 0;
                  again = true;
                }
              }
            }
            j = j + 1;
          };
        }
        i = i + 1;
      };
    };
  };
  fullBleed (raw, w, h) {
    if ( raw.x > 1 ) {
      return false;
    }
    if ( raw.y > 1 ) {
      return false;
    }
    if ( raw.maxX() < w - 1 ) {
      return false;
    }
    if ( raw.maxY() < h - 1 ) {
      return false;
    }
    return true;
  };
  dropCornerSlivers (raws) {
    const n = raws.length;
    let i = 0;
    while (i < n) {
      const a = raws[i];
      const small = a.w <= 10 && a.h <= 10;
      if ( (a.used == false && a.kind != "line") && (a.fillRatio() < 0.5 || small) ) {
        let j = 0;
        while (j < n) {
          const p = raws[j];
          if ( ((j != i && p.w > 0) && p.kind != "glyph") && p.w * p.h > (a.w * a.h) * 4 ) {
            if ( ((a.x >= p.x - 2 && a.y >= p.y - 2) && a.maxX() <= p.maxX() + 2) && a.maxY() <= p.maxY() + 2 ) {
              const atX = this.absI(a.x - p.x) <= 2 || this.absI(p.maxX() - a.maxX()) <= 2;
              const atY = this.absI(a.y - p.y) <= 2 || this.absI(p.maxY() - a.maxY()) <= 2;
              const half = ((this.minI(p.w, p.h) / 2) | 0) + 2;
              if ( ((atX && atY) && a.w <= half) && a.h <= half ) {
                a.used = true;
                j = n;
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
  };
  overlapArea (a, b) {
    const x0 = this.maxI(a.x, b.x);
    const y0 = this.maxI(a.y, b.y);
    const x1 = this.minI(a.maxX(), b.maxX());
    const y1 = this.minI(a.maxY(), b.maxY());
    if ( x1 <= x0 || y1 <= y0 ) {
      return 0;
    }
    return (x1 - x0) * (y1 - y0);
  };
  splitBackdrop (nodes, page) {
    let under = [];
    const n = nodes.length;
    let flag = [];
    let z = 0;
    while (z < n) {
      flag.push(0);
      z = z + 1;
    };
    let i = 0;
    while (i < n) {
      const a = nodes[i];
      const big = a.w * a.h >= 2000;
      if ( ((a.w > 0 && big) && this.isContainer(a)) && a.role != "listitem" ) {
        let j = 0;
        while (j < n) {
          const b = nodes[j];
          if ( ((j != i && b.w > 0) && this.isContainer(b)) && b.w * b.h >= 400 ) {
            const ov = this.overlapArea(a, b);
            const small = this.minI((a.w * a.h), (b.w * b.h));
            if ( (ov * 10 > small && this.coversLoosely(a, b) == false) && this.coversLoosely(b, a) == false ) {
              const ca = this.holdsCount(a, nodes);
              const cb = this.holdsCount(b, nodes);
              if ( ca < cb || ca == cb && a.fill < b.fill ) {
                flag[i] = 1;
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    let k = 0;
    while (k < n) {
      if ( flag[k] == 1 ) {
        const d = nodes[k];
        const keep = ErazerNode.of(
          "backdrop",
          d.x,
          d.y,
          d.w,
          d.h,
          d.r,
          d.g,
          d.b
        );
        keep.fill = d.fill;
        keep.radius = d.radius;
        keep.gradDir = d.gradDir;
        keep.gFromR = d.gFromR;
        keep.gFromG = d.gFromG;
        keep.gFromB = d.gFromB;
        keep.gToR = d.gToR;
        keep.gToG = d.gToG;
        keep.gToB = d.gToB;
        keep.confidence = 0.6;
        under.push(keep);
        d.w = 0;
      }
      k = k + 1;
    };
    return under;
  };
  holdsCount (a, nodes) {
    let c = 0;
    let i = 0;
    while (i < nodes.length) {
      const k = nodes[i];
      if ( (k != a && k.w > 0) && this.coversNode(a, k) ) {
        c = c + 1;
      }
      i = i + 1;
    };
    return c;
  };
  layerUnder (page, under) {
    if ( under.length == 0 ) {
      return;
    }
    const layer = ErazerNode.of(
      "underlay",
      page.x,
      page.y,
      page.w,
      page.h,
      page.r,
      page.g,
      page.b
    );
    layer.confidence = 0.6;
    let i = 0;
    while (i < under.length) {
      layer.addKid(under[i]);
      i = i + 1;
    };
    let kids = [];
    kids.push(layer);
    let j = 0;
    while (j < page.kids.length) {
      kids.push(page.kids[j]);
      j = j + 1;
    };
    page.kids = kids;
  };
  isContainer (n) {
    if ( (n.role == "text" || n.role == "label") || n.role == "icon" ) {
      return false;
    }
    return true;
  };
  splitRows (nodes, page, raws) {
    let conts = [];
    let c = 0;
    while (c < nodes.length) {
      const cn = nodes[c];
      if ( ((cn.w > 0 && this.isContainer(cn)) && cn.h >= 60) && cn.w >= 80 ) {
        conts.push(cn);
      }
      c = c + 1;
    };
    conts.push(page);
    let ci = 0;
    while (ci < conts.length) {
      const box = conts[ci];
      let ys = [];
      let ye = [];
      this.scanSeparators(box, conts, ci, ys, ye);
      if ( ys.length >= 1 ) {
        this.sortIntPairs(ys, ye);
        let tops = [];
        let bots = [];
        tops.push(box.y);
        let k = 0;
        while (k < ys.length) {
          bots.push(ys[k]);
          tops.push(ye[k]);
          k = k + 1;
        };
        bots.push(box.maxY());
        let typical = 0;
        const nb = tops.length;
        if ( nb >= 3 ) {
          let hs = [];
          let q = 1;
          while (q < nb - 1) {
            hs.push(bots[q] - tops[q]);
            q = q + 1;
          };
          typical = this.medianInt(hs);
        } else {
          typical = this.minI((bots[0] - tops[0]), (bots[1] - tops[1]));
        }
        let made = [];
        let b = 0;
        while (b < nb) {
          const t0 = tops[b];
          const hh = bots[b] - t0;
          if ( hh >= 16 && hh <= (((typical * 16 + 40) / 10) | 0) ) {
            const row = ErazerNode.of(
              "listitem",
              box.x,
              t0,
              box.w,
              hh,
              box.r,
              box.g,
              box.b
            );
            row.confidence = 0.7;
            made.push(row);
          }
          b = b + 1;
        };
        if ( made.length >= 2 ) {
          let m = 0;
          while (m < made.length) {
            nodes.push(made[m]);
            m = m + 1;
          };
        }
      }
      ci = ci + 1;
    };
  };
  offFill (x, y, box) {
    const pixels = this.img.pixels;
    const off = (y * this.img.width + x) * 4;
    return this.colorNear(
      pixels._view.getUint8(off),
      pixels._view.getUint8(off + 1),
      pixels._view.getUint8(off + 2),
      box.r,
      box.g,
      box.b,
      6
    ) == false;
  };
  rowCover (box, y, span) {
    let hit = 0;
    let tot = 0;
    let lo = 0 - 1;
    let hi = 0 - 1;
    let x = box.x + 2;
    while (x < box.maxX() - 2) {
      tot = tot + 1;
      if ( this.offFill(x, y, box) ) {
        hit = hit + 1;
        if ( lo < 0 ) {
          lo = x;
        }
        hi = x;
      }
      x = x + 2;
    };
    span[0] = lo;
    span[1] = hi;
    if ( tot == 0 ) {
      return 0;
    }
    return (((hit * 100) / tot) | 0);
  };
  scanSeparators (box, conts, __self, ys, ye) {
    let span = [];
    span.push(0);
    span.push(0);
    let y = box.y + 6;
    const stop = box.maxY() - 6;
    while (y < stop) {
      const c = this.rowCover(box, y, span);
      if ( c >= 70 ) {
        let y2 = y;
        let run = true;
        while (run && y2 + 1 < stop) {
          if ( this.rowCover(box, y2 + 1, span) >= 70 ) {
            y2 = y2 + 1;
          } else {
            run = false;
          }
        };
        this.rowCover(box, y, span);
        const lo = span[0];
        const hi = span[1];
        const thin = y2 - y <= 2;
        if ( (thin && this.rowCover(box, y - 3, span) < 25) && this.rowCover(box, y2 + 3, span) < 25 ) {
          let inner = false;
          let o = 0;
          while (o < conts.length) {
            const other = conts[o];
            if ( (o != __self && other.w * other.h < box.w * box.h) && other.coversBox(lo, y, (hi - lo) + 1, (y2 - y) + 1) ) {
              inner = true;
            }
            o = o + 1;
          };
          if ( inner == false ) {
            ys.push(y);
            ye.push(y2 + 1);
          }
        }
        y = y2 + 1;
      }
      y = y + 1;
    };
  };
  onRegionEdge (nodes, ln) {
    let i = 0;
    while (i < nodes.length) {
      const n = nodes[i];
      if ( (n.w > 0 && this.isContainer(n)) && n.w * 10 >= ln.w * 8 ) {
        if ( this.absI(n.y - ln.maxY()) <= 2 || this.absI(n.maxY() - ln.y) <= 2 ) {
          if ( n.x <= ln.x + 4 && n.maxX() >= ln.maxX() - 4 ) {
            return true;
          }
        }
      }
      i = i + 1;
    };
    return false;
  };
  sortIntPairs (a, b) {
    const n = a.length;
    let i = 1;
    while (i < n) {
      let j = i;
      while (j > 0 && a[j] < a[(j - 1)]) {
        const ta = a[j];
        const tb = b[j];
        a[j] = a[(j - 1)];
        b[j] = b[(j - 1)];
        a[j - 1] = ta;
        b[j - 1] = tb;
        j = j - 1;
      };
      i = i + 1;
    };
  };
  medianInt (xs) {
    const n = xs.length;
    if ( n == 0 ) {
      return 0;
    }
    let c = [];
    let i = 0;
    while (i < n) {
      c.push(xs[i]);
      i = i + 1;
    };
    let dummy = [];
    let k = 0;
    while (k < n) {
      dummy.push(0);
      k = k + 1;
    };
    this.sortIntPairs(c, dummy);
    return c[((n / 2) | 0)];
  };
  nodeFromRaw (raw, role) {
    const n = ErazerNode.of(
      role,
      raw.x,
      raw.y,
      raw.w,
      raw.h,
      raw.r,
      raw.g,
      raw.b
    );
    n.radius = raw.radius;
    n.fill = raw.fillRatio();
    this.copyGrad(n, raw);
    if ( raw.kind == "frame" ) {
      n.borderW = 1;
      n.borderR = raw.r;
      n.borderG = raw.g;
      n.borderB = raw.b;
    }
    return n;
  };
  copyGrad (n, raw) {
    n.gradDir = raw.gradDir;
    n.gFromR = raw.gFromR;
    n.gFromG = raw.gFromG;
    n.gFromB = raw.gFromB;
    n.gToR = raw.gToR;
    n.gToG = raw.gToG;
    n.gToB = raw.gToB;
  };
  coversNode (a, b) {
    return a.coversBox(b.x, b.y, b.w, b.h);
  };
  coversLoosely (a, b) {
    if ( this.coversNode(a, b) ) {
      return true;
    }
    if ( b.w * b.h >= a.w * a.h ) {
      return false;
    }
    if ( b.x < a.x - 2 || b.y < a.y - 2 ) {
      return false;
    }
    if ( b.maxX() > a.maxX() + 2 || b.maxY() > a.maxY() + 2 ) {
      return false;
    }
    return true;
  };
  almostSame (a, b) {
    const dx = this.absI((a.x - b.x));
    const dy = this.absI((a.y - b.y));
    const dw = this.absI((a.w - b.w));
    const dh = this.absI((a.h - b.h));
    if ( ((dx <= 3 && dy <= 3) && dw <= 6) && dh <= 6 ) {
      return true;
    }
    return false;
  };
  mergeFrameFill (nodes) {
    const n = nodes.length;
    let i = 0;
    while (i < n) {
      const fr = nodes[i];
      if ( fr.borderW > 0 ) {
        let j = 0;
        while (j < n) {
          if ( j != i ) {
            const box = nodes[j];
            if ( box.borderW == 0 && this.coversNode(fr, box) ) {
              const insetX = box.x - fr.x;
              const insetY = box.y - fr.y;
              if ( ((insetX >= 0 && insetX <= 8) && insetY >= 0) && insetY <= 8 ) {
                const dw = this.absI((fr.w - box.w));
                const dh = this.absI((fr.h - box.h));
                if ( dw <= 16 && dh <= 16 ) {
                  box.borderW = this.maxI(1, insetX);
                  box.borderR = fr.r;
                  box.borderG = fr.g;
                  box.borderB = fr.b;
                  box.x = fr.x;
                  box.y = fr.y;
                  box.w = fr.w;
                  box.h = fr.h;
                  fr.w = 0;
                }
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
  };
  nest (nodes, page) {
    let live = [];
    let i = 0;
    while (i < nodes.length) {
      const n = nodes[i];
      if ( n.w > 0 ) {
        live.push(n);
      }
      i = i + 1;
    };
    this.sortNodesByAreaAsc(live);
    let attached = [];
    let k = 0;
    while (k < live.length) {
      attached.push(0);
      k = k + 1;
    };
    let a = 0;
    while (a < live.length) {
      const child = live[a];
      let bestIdx = 0 - 1;
      let bestArea = 0;
      let b = a + 1;
      while (b < live.length) {
        const par = live[b];
        if ( this.coversLoosely(par, child) ) {
          if ( this.almostSame(par, child) == false ) {
            const area = par.w * par.h;
            if ( bestIdx < 0 || area < bestArea ) {
              bestIdx = b;
              bestArea = area;
            }
          }
        }
        b = b + 1;
      };
      if ( bestIdx >= 0 ) {
        const par2 = live[bestIdx];
        par2.addKid(child);
        attached[a] = 1;
      }
      a = a + 1;
    };
    let t = 0;
    while (t < live.length) {
      if ( attached[t] == 0 ) {
        const n2 = live[t];
        if ( this.coversNode(page, n2) ) {
          page.addKid(n2);
        } else {
          page.addKid(n2);
        }
      }
      t = t + 1;
    };
    return live;
  };
  firstText (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.role == "text" || k.role == "label" ) {
        const hit = k;
        return hit;
      }
      i = i + 1;
    };
    let miss;
    return miss;
  };
  textKidCount (n) {
    let c = 0;
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.role == "text" || k.role == "label" ) {
        c = c + 1;
      }
      i = i + 1;
    };
    return c;
  };
  copyTextOnto (n, t) {
    n.text = t.text;
    n.fontSize = t.fontSize;
    n.textR = t.textR;
    n.textG = t.textG;
    n.textB = t.textB;
  };
  oneLineText (n) {
    let count = 0;
    let base = 0;
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.role == "text" || k.role == "label" ) {
        if ( count == 0 ) {
          base = k.maxY();
        } else {
          if ( this.absI(k.maxY() - base) > 8 ) {
            return false;
          }
        }
        count = count + 1;
      }
      i = i + 1;
    };
    if ( count >= 1 ) {
      return true;
    }
    if ( n.text.length > 0 ) {
      return true;
    }
    return false;
  };
  looksLikeTrack (n) {
    if ( n.role == "backdrop" ) {
      return false;
    }
    if ( (n.role == "text" || n.role == "label") || n.role == "icon" ) {
      return false;
    }
    if ( n.h < 4 || n.h > 22 ) {
      return false;
    }
    if ( n.w < 40 ) {
      return false;
    }
    let aspect = 0.0;
    if ( n.h > 0 ) {
      aspect = n.w / n.h;
    }
    if ( aspect < 4.0 ) {
      return false;
    }
    return true;
  };
  looksLikeChip (n) {
    if ( n.role == "backdrop" ) {
      return false;
    }
    if ( (n.role == "text" || n.role == "label") || n.role == "icon" ) {
      return false;
    }
    if ( ((n.role == "checkbox" || n.role == "slider") || n.role == "sliderthumb") || n.role == "switch" ) {
      return false;
    }
    if ( n.role == "listitem" || n.role == "list" ) {
      return false;
    }
    if ( ((n.role == "tab" || n.role == "tablist") || n.role == "menu") || n.role == "menuitem" ) {
      return false;
    }
    if ( n.role == "form" || n.role == "page" ) {
      return false;
    }
    if ( n.h < 16 || n.h > 58 ) {
      return false;
    }
    if ( n.w < 28 ) {
      return false;
    }
    let aspect = 0.0;
    if ( n.h > 0 ) {
      aspect = n.w / n.h;
    }
    if ( aspect < 1.05 || aspect > 20.0 ) {
      return false;
    }
    return true;
  };
  similarFill (a, b) {
    if ( this.absI(a.r - b.r) > 40 ) {
      return false;
    }
    if ( this.absI(a.g - b.g) > 40 ) {
      return false;
    }
    if ( this.absI(a.b - b.b) > 40 ) {
      return false;
    }
    return true;
  };
  similarChipRow (a, b) {
    if ( this.absI(a.y - b.y) > 8 ) {
      return false;
    }
    if ( this.absI(a.h - b.h) > 8 ) {
      return false;
    }
    if ( this.similarFill(a, b) == false ) {
      return false;
    }
    return true;
  };
  looksLikeSwitch (n) {
    if ( n.h < 14 || n.h > 44 ) {
      return false;
    }
    const aspect = n.w / n.h;
    if ( aspect < 1.4 || aspect > 2.4 ) {
      return false;
    }
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.role != "text" && k.role != "label" ) {
        const dwh = this.absI((k.w - k.h));
        const endGap = this.minI((k.x - n.x), (n.maxX() - k.maxX()));
        if ( ((dwh <= 4 && k.h * 10 >= n.h * 6) && this.absI(k.cy() - n.cy()) <= 4) && endGap <= ((n.h / 4) | 0) ) {
          return true;
        }
      }
      i = i + 1;
    };
    return false;
  };
  guessSelf (n) {
    if ( n.role == "text" ) {
      return;
    }
    if ( n.role == "icon" ) {
      return;
    }
    if ( ((n.role == "page" || n.role == "listitem") || n.role == "backdrop") || n.role == "underlay" ) {
      return;
    }
    const texts = this.textKidCount(n);
    if ( this.looksLikeSwitch(n) ) {
      n.role = "switch";
      n.confidence = 0.8;
      return;
    }
    const oneLine = this.oneLineText(n);
    let sq = false;
    const dwh = this.absI((n.w - n.h));
    if ( (dwh <= 4 && n.w >= 10) && n.w <= 32 ) {
      sq = true;
    }
    if ( sq && texts == 0 ) {
      n.role = "checkbox";
      n.confidence = 0.82;
      return;
    }
    let aspect = 0.0;
    if ( n.h > 0 ) {
      aspect = n.w / n.h;
    }
    if ( (((n.h >= 4 && n.h <= 20) && n.w >= 80) && texts == 0) && aspect >= 6.0 ) {
      n.role = "slider";
      n.confidence = 0.8;
      return;
    }
    const lum = this.lumaOf(n.r, n.g, n.b);
    let centered = false;
    let leftish = true;
    const hit = this.firstText(n);
    if ( typeof(hit) != "undefined" ) {
      const t = hit;
      const dx = this.absI((t.cx() - n.cx()));
      const dy = this.absI((t.cy() - n.cy()));
      if ( dx <= ((n.w / 3) | 0) && dy <= ((n.h / 2) | 0) ) {
        centered = true;
      }
      if ( t.x - n.x > ((n.w / 5) | 0) ) {
        if ( t.x - n.x > 10 ) {
          leftish = false;
        }
      }
      if ( t.x - n.x > n.h ) {
        leftish = false;
      }
    }
    if ( ((((n.h >= 16 && n.h <= 58) && n.w >= 28) && n.w <= 360) && aspect >= 1.12) && aspect <= 9.0 ) {
      if ( oneLine && centered ) {
        n.role = "button";
        n.confidence = 0.8;
        if ( typeof(hit) != "undefined" ) {
          this.copyTextOnto(n, hit);
        }
        return;
      }
    }
    if ( ((n.h >= 18 && n.h <= 58) && n.w >= 72) && aspect >= 2.4 ) {
      if ( lum >= 200 || n.borderW > 0 ) {
        if ( texts <= 1 || oneLine ) {
          if ( leftish && centered == false || texts == 0 ) {
            n.role = "textfield";
            n.confidence = 0.78;
            if ( typeof(hit) != "undefined" ) {
              this.copyTextOnto(n, hit);
            }
            return;
          }
        }
      }
    }
    if ( ((((n.h >= 16 && n.h <= 58) && n.w >= 28) && n.w <= 360) && aspect >= 1.12) && aspect <= 9.0 ) {
      if ( oneLine ) {
        n.role = "button";
        n.confidence = 0.6;
        if ( typeof(hit) != "undefined" ) {
          this.copyTextOnto(n, hit);
        }
        return;
      }
    }
    if ( (n.kids.length >= 2 && n.w > 48) && n.h > 58 ) {
      n.role = "panel";
      n.confidence = 0.55;
      return;
    }
  };
  classifyTree (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.classifyTree(k);
      i = i + 1;
    };
    this.guessSelf(n);
    if ( n.role == "text" && n.kids.length == 0 ) {
    }
  };
  collectFonts (n, out) {
    if ( (n.role == "text" || n.role == "label") && n.fontSize > 0 ) {
      out.push(n.fontSize);
    }
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.collectFonts(k, out);
      i = i + 1;
    };
  };
  medianFont (root) {
    let fs = [];
    this.collectFonts(root, fs);
    return this.medianInt(fs);
  };
  lumaAt (x, y) {
    if ( this.img.isValidCoord(x, y) == false ) {
      return 0 - 1;
    }
    const c = this.img.getPixel(x, y);
    return this.lumaOf(c.r, c.g, c.b);
  };
  localBgLuma (t) {
    let ls = [];
    const a = this.lumaAt((t.x - 2), t.cy());
    const b = this.lumaAt((t.maxX() + 1), t.cy());
    const c = this.lumaAt(t.cx(), (t.y - 2));
    const d = this.lumaAt(t.cx(), (t.maxY() + 1));
    if ( a >= 0 ) {
      ls.push(a);
    }
    if ( b >= 0 ) {
      ls.push(b);
    }
    if ( c >= 0 ) {
      ls.push(c);
    }
    if ( d >= 0 ) {
      ls.push(d);
    }
    if ( ls.length == 0 ) {
      return 0 - 1;
    }
    return this.medianInt(ls);
  };
  textDoubt (t, par, med) {
    if ( (((par.role == "switch" || par.role == "checkbox") || par.role == "slider") || par.role == "sliderthumb") || par.role == "icon" ) {
      return "control";
    }
    if ( (med > 0 && t.fontSize * 10 > med * 18) && t.w * 10 < t.h * 7 ) {
      return "size";
    }
    const lt = this.lumaOf(t.textR, t.textG, t.textB);
    const bg = this.localBgLuma(t);
    if ( bg >= 0 && this.absI(lt - bg) < 24 ) {
      return "contrast";
    }
    return "";
  };
  dropImplausibleText (n, med) {
    let keep = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      let drop = false;
      if ( k.role == "text" || k.role == "label" ) {
        const why = this.textDoubt(k, n, med);
        if ( why == "control" ) {
          drop = true;
        }
        if ( why == "size" || why == "contrast" ) {
          k.role = "shape";
          k.r = k.textR;
          k.g = k.textG;
          k.b = k.textB;
          k.text = "";
          k.fontSize = 0;
          k.confidence = 0.5;
        }
      }
      if ( drop == false ) {
        keep.push(k);
        this.dropImplausibleText(k, med);
      }
      i = i + 1;
    };
    n.kids = keep;
    if ( ((n.role != "text" && n.role != "label") && n.text.length > 0) && this.textKidCount(n) == 0 ) {
      n.text = "";
      n.fontSize = 0;
    }
  };
  relabelTexts (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.role == "text" ) {
        if ( ((((n.role == "panel" || n.role == "page") || n.role == "form") || n.role == "menu") || n.role == "listitem") || n.role == "list" ) {
          k.role = "label";
        }
      }
      this.relabelTexts(k);
      i = i + 1;
    };
  };
  promoteGroups (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.promoteGroups(k);
      i = i + 1;
    };
    this.promoteSliders(n);
    this.promoteRows(n);
    let fields = 0;
    let c = 0;
    while (c < n.kids.length) {
      const k2 = n.kids[c];
      if ( k2.role == "textfield" ) {
        fields = fields + 1;
      }
      c = c + 1;
    };
    if ( fields >= 2 && (n.role == "panel" || n.role == "page") ) {
      n.role = "form";
      n.confidence = 0.84;
    }
    this.promoteButtons(n);
    this.promoteTabs(n);
    this.promoteMenu(n);
  };
  rowCandidate (k) {
    if ( k.role == "backdrop" ) {
      return false;
    }
    if ( (((k.role == "text" || k.role == "label") || k.role == "icon") || k.role == "checkbox") || k.role == "switch" ) {
      return false;
    }
    if ( k.role == "slider" || k.role == "sliderthumb" ) {
      return false;
    }
    if ( k.h < 20 || k.w < k.h * 3 ) {
      return false;
    }
    return true;
  };
  promoteRows (n) {
    let cand = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( this.rowCandidate(k) ) {
        cand.push(k);
      }
      i = i + 1;
    };
    const m = cand.length;
    if ( m < 2 ) {
      return;
    }
    this.sortNodesByY(cand);
    let taken = [];
    let z = 0;
    while (z < m) {
      taken.push(0);
      z = z + 1;
    };
    let rows = 0;
    let a = 0;
    while (a < m) {
      if ( taken[a] == 0 ) {
        let chain = [];
        chain.push(a);
        let cur = a;
        let go = true;
        while (go) {
          go = false;
          const p = cand[cur];
          let q = cur + 1;
          while (q < m) {
            const c = cand[q];
            const gap = c.y - p.maxY();
            if ( (((taken[q] == 0 && gap >= 0 - 1) && gap <= 3) && this.absI(p.x - c.x) <= 3) && this.absI(p.w - c.w) <= 6 ) {
              chain.push(q);
              cur = q;
              go = true;
              q = m;
            }
            q = q + 1;
          };
        };
        if ( chain.length >= 2 ) {
          let t = 0;
          while (t < chain.length) {
            const ti = chain[t];
            taken[ti] = 1;
            const r = cand[ti];
            r.role = "listitem";
            r.confidence = 0.72;
            t = t + 1;
          };
          rows = rows + chain.length;
        }
      }
      a = a + 1;
    };
    if ( rows >= 2 && n.role != "page" ) {
      n.role = "list";
      n.confidence = 0.72;
    }
  };
  sortNodesByY (arr) {
    const n = arr.length;
    let i = 1;
    while (i < n) {
      let j = i;
      let keep = true;
      while (j > 0 && keep) {
        const a = arr[j];
        const b = arr[(j - 1)];
        if ( a.y < b.y ) {
          arr[j - 1] = a;
          arr[j] = b;
          j = j - 1;
        } else {
          keep = false;
        }
      };
      i = i + 1;
    };
  };
  absorbNode (keep, gone) {
    const x2 = this.minI(keep.x, gone.x);
    const y2 = this.minI(keep.y, gone.y);
    const mx = this.maxI(keep.maxX(), gone.maxX());
    const my = this.maxI(keep.maxY(), gone.maxY());
    keep.x = x2;
    keep.y = y2;
    keep.w = mx - x2;
    keep.h = my - y2;
    gone.w = 0;
  };
  pruneZero (n) {
    let live = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.w > 0 ) {
        live.push(k);
      }
      i = i + 1;
    };
    n.kids = live;
  };
  collinearTracks (a, b) {
    if ( this.absI(a.cy() - b.cy()) > 4 ) {
      return false;
    }
    if ( this.absI(a.h - b.h) > 12 ) {
      return false;
    }
    let gap = 0;
    if ( a.maxX() < b.x ) {
      gap = b.x - a.maxX();
    } else {
      if ( b.maxX() < a.x ) {
        gap = a.x - b.maxX();
      } else {
        gap = 0;
      }
    }
    if ( gap > 32 ) {
      return false;
    }
    return true;
  };
  looksLikeThumb (n, track) {
    if ( n.w <= 0 ) {
      return false;
    }
    if ( n.role == "slider" ) {
      return false;
    }
    const dwh = this.absI((n.w - n.h));
    if ( ((dwh > 6 || n.w < 8) || n.w > 32) || n.h < 8 ) {
      return false;
    }
    if ( this.absI(n.cy() - track.cy()) > this.maxI(track.h, n.h) + 4 ) {
      return false;
    }
    const slack = ((n.w / 2) | 0);
    if ( n.cx() < track.x - slack ) {
      return false;
    }
    if ( n.cx() > track.maxX() + slack ) {
      return false;
    }
    return true;
  };
  promoteSliders (n) {
    let tracks = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( this.looksLikeTrack(k) ) {
        tracks.push(k);
      }
      i = i + 1;
    };
    let merged = [];
    let z = 0;
    while (z < tracks.length) {
      merged.push(0);
      z = z + 1;
    };
    let a = 0;
    while (a < tracks.length) {
      const left = tracks[a];
      if ( left.w > 0 ) {
        let b = a + 1;
        while (b < tracks.length) {
          const right = tracks[b];
          if ( right.w > 0 ) {
            if ( this.collinearTracks(left, right) ) {
              this.absorbNode(left, right);
              merged[a] = 1;
            }
          }
          b = b + 1;
        };
      }
      a = a + 1;
    };
    let t = 0;
    while (t < tracks.length) {
      const tr = tracks[t];
      if ( tr.w > 0 ) {
        const hh = this.maxI(1, tr.h);
        const aspect = tr.w / hh;
        let thumbs = 0;
        let tk = 0;
        while (tk < tr.kids.length) {
          const own = tr.kids[tk];
          if ( this.looksLikeThumb(own, tr) ) {
            thumbs = thumbs + 1;
          }
          tk = tk + 1;
        };
        let c = 0;
        while (c < n.kids.length) {
          const thumb = n.kids[c];
          if ( thumb != tr && this.looksLikeThumb(thumb, tr) ) {
            thumbs = thumbs + 1;
          }
          c = c + 1;
        };
        const twoTone = merged[t] > 0;
        if ( (tr.w >= 80 && aspect >= 6.0) && (thumbs > 0 || twoTone) ) {
          tr.role = "slider";
          tr.confidence = 0.82;
          let tk2 = 0;
          while (tk2 < tr.kids.length) {
            const own2 = tr.kids[tk2];
            if ( this.looksLikeThumb(own2, tr) ) {
              own2.role = "sliderthumb";
              own2.confidence = 0.8;
            }
            tk2 = tk2 + 1;
          };
          let c2 = 0;
          while (c2 < n.kids.length) {
            const thumb2 = n.kids[c2];
            if ( thumb2 != tr && this.looksLikeThumb(thumb2, tr) ) {
              thumb2.role = "sliderthumb";
              thumb2.confidence = 0.8;
            }
            c2 = c2 + 1;
          };
        } else {
          if ( tr.role == "slider" ) {
            tr.role = "panel";
            tr.confidence = 0.4;
          }
        }
      }
      t = t + 1;
    };
    this.pruneZero(n);
  };
  applyButtonRow (group) {
    let lined = 0;
    let already = 0;
    let i = 0;
    while (i < group.length) {
      const k = group[i];
      if ( k.role == "button" ) {
        already = already + 1;
      }
      if ( this.oneLineText(k) ) {
        lined = lined + 1;
      }
      i = i + 1;
    };
    let ok = false;
    if ( lined >= 2 ) {
      ok = true;
    }
    if ( already >= 1 && group.length >= 2 ) {
      ok = true;
    }
    if ( ok == false ) {
      return;
    }
    let t = 0;
    while (t < group.length) {
      const k2 = group[t];
      if ( k2.role != "button" ) {
        k2.role = "button";
        k2.confidence = 0.74;
        const hit = this.firstText(k2);
        if ( typeof(hit) != "undefined" ) {
          this.copyTextOnto(k2, hit);
        }
      }
      t = t + 1;
    };
  };
  promoteButtons (n) {
    let cand = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( this.looksLikeChip(k) ) {
        cand.push(k);
      }
      i = i + 1;
    };
    if ( cand.length < 2 ) {
      return;
    }
    let flags = [];
    let f = 0;
    while (f < cand.length) {
      flags.push(0);
      f = f + 1;
    };
    let a = 0;
    while (a < cand.length) {
      const marked = flags[a];
      if ( marked == 0 ) {
        const seed = cand[a];
        let group = [];
        group.push(seed);
        flags[a] = 1;
        let b = 0;
        while (b < cand.length) {
          const om = flags[b];
          if ( om == 0 ) {
            const other = cand[b];
            if ( this.similarChipRow(seed, other) ) {
              group.push(other);
              flags[b] = 1;
            }
          }
          b = b + 1;
        };
        if ( group.length >= 2 ) {
          this.applyButtonRow(group);
        }
      }
      a = a + 1;
    };
  };
  promoteTabs (n) {
    let cand = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.text.length > 0 && k.h >= 20 ) {
        if ( ((k.role == "button" || k.role == "panel") || k.role == "tab") || k.role == "textfield" ) {
          cand.push(k);
        }
      }
      i = i + 1;
    };
    if ( cand.length < 3 ) {
      return;
    }
    const a = cand[0];
    let same = 1;
    let j = 1;
    while (j < cand.length) {
      const b = cand[j];
      if ( this.absI(a.y - b.y) <= 6 ) {
        if ( this.absI(a.h - b.h) <= 8 ) {
          same = same + 1;
        }
      }
      j = j + 1;
    };
    if ( same >= 3 ) {
      let minW = a.w;
      let maxW = a.w;
      let wj = 0;
      while (wj < cand.length) {
        const cw = cand[wj];
        if ( this.absI(a.y - cw.y) <= 6 ) {
          if ( cw.w < minW ) {
            minW = cw.w;
          }
          if ( cw.w > maxW ) {
            maxW = cw.w;
          }
        }
        wj = wj + 1;
      };
      if ( maxW > (((minW * 3) / 2) | 0) + 24 ) {
        return;
      }
      let t = 0;
      while (t < cand.length) {
        const k3 = cand[t];
        k3.role = "tab";
        k3.confidence = 0.75;
        t = t + 1;
      };
      if ( cand.length == n.kids.length && n.role != "page" ) {
        n.role = "tablist";
      }
    }
  };
  promoteMenu (n) {
    let cand = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( k.text.length > 0 && k.h >= 20 ) {
        if ( ((k.role == "button" || k.role == "panel") || k.role == "menuitem") || k.role == "textfield" ) {
          cand.push(k);
        }
      }
      i = i + 1;
    };
    if ( cand.length < 3 ) {
      return;
    }
    const a = cand[0];
    let same = 1;
    let j = 1;
    while (j < cand.length) {
      const b = cand[j];
      if ( this.absI(a.x - b.x) <= 8 ) {
        if ( this.absI(a.w - b.w) <= 16 ) {
          if ( this.absI(a.h - b.h) <= 10 ) {
            same = same + 1;
          }
        }
      }
      j = j + 1;
    };
    if ( same >= 3 ) {
      let t = 0;
      while (t < cand.length) {
        const k3 = cand[t];
        k3.role = "menuitem";
        k3.confidence = 0.72;
        t = t + 1;
      };
      if ( n.role != "page" ) {
        n.role = "menu";
        n.confidence = 0.72;
      }
    }
  };
  crop (x, y, w, h) {
    const out = new ImageBuffer();
    const cw = this.maxI(1, w);
    const ch = this.maxI(1, h);
    out.init(cw, ch);
    let py = 0;
    while (py < ch) {
      let px = 0;
      while (px < cw) {
        const sx = x + px;
        const sy = y + py;
        if ( this.img.isValidCoord(sx, sy) ) {
          const c = this.img.getPixel(sx, sy);
          out.setPixelRGBA(px, py, c.r, c.g, c.b, c.a);
        }
        px = px + 1;
      };
      py = py + 1;
    };
    return out;
  };
  traceIcons (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.traceIcons(k);
      i = i + 1;
    };
    if ( n.role == "icon" ) {
      if ( this.opts.vectorizeIcons ) {
        const pad = 1;
        const cx = this.maxI(0, (n.x - pad));
        const cy = this.maxI(0, (n.y - pad));
        const cw = n.w + pad * 2;
        const ch = n.h + pad * 2;
        const slice = this.crop(cx, cy, cw, ch);
        const topts = EvgTraceOptions.preset("lineart");
        topts.turdsize = 1;
        const tr = EvgBitmapTracer.fromImageBuffer(slice, topts);
        tr.trace();
        n.iconVw = cw;
        n.iconVh = ch;
        n.iconSvg = tr.toSVG();
        const els = tr.toEVGElements();
        let e = 0;
        while (e < els.length) {
          const el = els[e];
          n.iconPaths.push(el.svgPath);
          n.iconFills.push(el.fillColor.toHexString());
          e = e + 1;
        };
      }
    }
  };
  emitNode (n, px, py) {
    return this.emitIn(n, px, py, (0 - 1), 0, 0);
  };
  emitIn (n, px, py, pr, pg, pb) {
    let el = EVGElement.createDiv();
    if ( n.role == "text" || n.role == "label" ) {
      el = EVGElement.createSpan();
      el.textContent = n.text;
      if ( n.fontSize > 0 ) {
        el.fontSize = EVGUnit.px(n.fontSize);
      }
      el.color = EVGColor.rgb(n.textR, n.textG, n.textB);
    } else {
      const sameAsParent = ((pr >= 0 && n.gradDir < 0) && this.colorNear(
        n.r,
        n.g,
        n.b,
        pr,
        pg,
        pb,
        3
      )) && n.role != "icon";
      if ( sameAsParent == false ) {
        el.backgroundColor = EVGColor.rgb(n.r, n.g, n.b);
      }
      if ( n.gradDir >= 0 ) {
        el.gradientSet = true;
        el.gradientFrom = EVGColor.rgb(n.gFromR, n.gFromG, n.gFromB);
        el.gradientTo = EVGColor.rgb(n.gToR, n.gToG, n.gToB);
        el.gradientDir = n.gradDir;
      }
      if ( (((n.role == "button" || n.role == "textfield") || n.role == "tab") || n.role == "menuitem") || n.role == "slider" ) {
        if ( n.text.length > 0 ) {
        }
      }
      if ( n.radius > 0 ) {
        el.box.borderRadius = EVGUnit.px(n.radius);
      }
      if ( n.borderW > 0 ) {
        el.box.borderWidth = EVGUnit.px(n.borderW);
        el.box.borderColor = EVGColor.rgb(n.borderR, n.borderG, n.borderB);
      }
    }
    if ( n.align.length > 0 ) {
      el.textAlign = n.align;
    }
    el.className = "erazer-" + n.role;
    el.position = "absolute";
    el.left = EVGUnit.px((n.x - px));
    el.top = EVGUnit.px((n.y - py));
    el.width = EVGUnit.px(n.w);
    el.height = EVGUnit.px(n.h);
    let p = 0;
    while (p < n.iconPaths.length) {
      const pathEl = EVGElement.createPath();
      pathEl.svgPath = n.iconPaths[p];
      pathEl.fillRule = "evenodd";
      const fill = n.iconFills[p];
      pathEl.fillColor = EVGColor.parse(fill);
      let vw = n.w;
      let vh = n.h;
      if ( n.iconVw > 0 ) {
        vw = n.iconVw;
        vh = n.iconVh;
      }
      pathEl.viewBox = (("0 0 " + (vw.toString())) + " ") + (vh.toString());
      pathEl.width = EVGUnit.px(n.w);
      pathEl.height = EVGUnit.px(n.h);
      pathEl.position = "absolute";
      pathEl.left = EVGUnit.px(0.0);
      pathEl.top = EVGUnit.px(0.0);
      el.addChild(pathEl);
      p = p + 1;
    };
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( n.role == "text" || n.role == "label" ) {
        el.addChild(this.emitIn(k, n.x, n.y, (0 - 1), 0, 0));
      } else {
        el.addChild(this.emitIn(k, n.x, n.y, n.r, n.g, n.b));
      }
      i = i + 1;
    };
    return el;
  };
  writeOutline (n, pad) {
    let line = ((((pad + n.role) + " ") + (n.x.toString())) + ",") + (n.y.toString());
    line = (((line + " ") + (n.w.toString())) + "x") + (n.h.toString());
    line = (line + " ") + this.hexOf(n.r, n.g, n.b);
    if ( n.text.length > 0 ) {
      line = ((line + " \"") + n.text) + "\"";
    }
    if ( n.fontSize > 0 ) {
      line = (line + " font=") + (n.fontSize.toString());
    }
    if ( ((((n.role == "text" || n.role == "label") || n.role == "button") || n.role == "tab") || n.role == "menuitem") || n.role == "slider" ) {
      if ( n.fontSize > 0 ) {
        line = (line + " ink=") + this.hexOf(n.textR, n.textG, n.textB);
      }
    }
    if ( n.iconSvg.length > 0 ) {
      line = line + " icon=svg";
    }
    if ( n.align.length > 0 && n.align != "left" ) {
      line = (line + " align=") + n.align;
    }
    if ( n.radius > 0 ) {
      line = (line + " r=") + (n.radius.toString());
    }
    if ( n.gradDir >= 0 ) {
      let axis = "v";
      if ( n.gradDir == 1 ) {
        axis = "h";
      }
      line = (((((line + " grad=") + axis) + " ") + this.hexOf(
        n.gFromR,
        n.gFromG,
        n.gFromB
      )) + ">") + this.hexOf(n.gToR, n.gToG, n.gToB);
    }
    let out = line + "\n";
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      out = out + this.writeOutline(k, (pad + "  "));
      i = i + 1;
    };
    return out;
  };
  roleStroke (role) {
    if ( role == "button" ) {
      return "#2563eb";
    }
    if ( role == "textfield" ) {
      return "#0f766e";
    }
    if ( role == "checkbox" ) {
      return "#7c3aed";
    }
    if ( role == "label" ) {
      return "#b45309";
    }
    if ( role == "text" ) {
      return "#b45309";
    }
    if ( role == "tab" ) {
      return "#db2777";
    }
    if ( role == "tablist" ) {
      return "#be185d";
    }
    if ( role == "menu" ) {
      return "#0369a1";
    }
    if ( role == "menuitem" ) {
      return "#0284c7";
    }
    if ( role == "form" ) {
      return "#15803d";
    }
    if ( role == "icon" ) {
      return "#ea580c";
    }
    if ( role == "slider" ) {
      return "#4f46e5";
    }
    if ( role == "sliderthumb" ) {
      return "#6366f1";
    }
    if ( role == "switch" ) {
      return "#16a34a";
    }
    if ( role == "backdrop" || role == "underlay" ) {
      return "#cbd5e1";
    }
    if ( role == "shape" ) {
      return "#94a3b8";
    }
    if ( role == "listitem" ) {
      return "#0891b2";
    }
    if ( role == "list" ) {
      return "#0e7490";
    }
    return "#64748b";
  };
  writeOverlay (n, w, h, groups) {
    let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" ";
    svg = ((((svg + "width=\"") + (w.toString())) + "\" height=\"") + (h.toString())) + "\" ";
    svg = ((((svg + "viewBox=\"0 0 ") + (w.toString())) + " ") + (h.toString())) + "\">";
    svg = svg + this.overlayNode(n);
    svg = svg + this.overlayGroups(groups);
    svg = svg + "</svg>";
    return svg;
  };
  overlayGroups (groups) {
    let s = "";
    let i = 0;
    while (i < groups.length) {
      const g = groups[i];
      s = ((s + "<g data-layout=\"") + g.type) + "\">";
      s = ((((s + "<rect x=\"") + (g.x.toString())) + "\" y=\"") + (g.y.toString())) + "\" ";
      s = ((((s + "width=\"") + (g.w.toString())) + "\" height=\"") + (g.h.toString())) + "\" ";
      s = s + "fill=\"none\" stroke=\"#7c3aed\" stroke-width=\"2\" stroke-dasharray=\"5 3\" pointer-events=\"none\"/>";
      const lab = (g.type + " ") + (g.confidence.toString());
      s = ((((s + "<text x=\"") + ((g.x + 4.0).toString())) + "\" y=\"") + ((g.y + 12.0).toString())) + "\" ";
      s = ((s + "font-size=\"10\" fill=\"#7c3aed\" pointer-events=\"none\">") + this.xmlEsc(lab)) + "</text>";
      s = s + "</g>";
      i = i + 1;
    };
    return s;
  };
  xmlEsc (s) {
    let out = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const ch = s.substring(i, i + 1 );
      if ( ch == "<" ) {
        out = out + "&lt;";
      } else {
        if ( ch == ">" ) {
          out = out + "&gt;";
        } else {
          if ( ch == "\"" ) {
            out = out + "&quot;";
          } else {
            if ( ch == "&" ) {
              out = out + "&amp;";
            } else {
              out = out + ch;
            }
          }
        }
      }
      i = i + 1;
    };
    return out;
  };
  overlayNode (n) {
    const col = this.roleStroke(n.role);
    let s = "<g>";
    s = ((((s + "<rect x=\"") + (n.x.toString())) + "\" y=\"") + (n.y.toString())) + "\" ";
    s = ((((s + "width=\"") + (n.w.toString())) + "\" height=\"") + (n.h.toString())) + "\" ";
    if ( n.boxId > 0 ) {
      s = ((s + "data-box=\"") + ((n.boxId - 1).toString())) + "\" ";
      s = s + "fill=\"transparent\" ";
    } else {
      s = s + "fill=\"none\" ";
    }
    if ( n.role == "backdrop" || n.role == "underlay" ) {
      s = ((s + "stroke=\"") + col) + "\" stroke-width=\"1\" stroke-dasharray=\"2 4\"/>";
    } else {
      s = ((s + "stroke=\"") + col) + "\" stroke-width=\"1\"/>";
    }
    let lab = n.role;
    if ( n.text.length > 0 ) {
      lab = (lab + " ") + n.text;
    }
    s = ((((s + "<text x=\"") + ((n.x + 2).toString())) + "\" y=\"") + ((n.y + 10).toString())) + "\" ";
    s = ((((s + "font-size=\"9\" fill=\"") + col) + "\">") + this.xmlEsc(lab)) + "</text>";
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      s = s + this.overlayNode(k);
      i = i + 1;
    };
    s = s + "</g>";
    return s;
  };
  pickScale () {
    if ( this.opts.scale > 0 ) {
      return this.opts.scale;
    }
    const w = this.img.width;
    const h = this.img.height;
    if ( w > 900 && h * 10 >= w * 16 ) {
      const k = (((w + 195) / 390) | 0);
      if ( k < 1 ) {
        return 1;
      }
      return k;
    }
    return 1;
  };
  boxDown (k) {
    const sw = this.img.width;
    const nw = ((sw / k) | 0);
    const nh = ((this.img.height / k) | 0);
    const out = new ImageBuffer();
    out.init(nw, nh);
    const src = this.img.pixels;
    const kk = k * k;
    let y = 0;
    while (y < nh) {
      let x = 0;
      while (x < nw) {
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sa = 0;
        let dy = 0;
        while (dy < k) {
          const row = y * k + dy;
          let dx = 0;
          while (dx < k) {
            const off = (row * sw + (x * k + dx)) * 4;
            sr = sr + src._view.getUint8(off);
            sg = sg + src._view.getUint8(off + 1);
            sb = sb + src._view.getUint8(off + 2);
            sa = sa + src._view.getUint8(off + 3);
            dx = dx + 1;
          };
          dy = dy + 1;
        };
        out.setPixelRGBA(
          x,
          y,
          ((sr / kk) | 0),
          ((sg / kk) | 0),
          ((sb / kk) | 0),
          ((sa / kk) | 0)
        );
        x = x + 1;
      };
      y = y + 1;
    };
    return out;
  };
  scaleTree (n, k) {
    n.x = n.x * k;
    n.y = n.y * k;
    n.w = n.w * k;
    n.h = n.h * k;
    n.fontSize = n.fontSize * k;
    n.radius = n.radius * k;
    n.borderW = n.borderW * k;
    let i = 0;
    while (i < n.kids.length) {
      const c = n.kids[i];
      this.scaleTree(c, k);
      i = i + 1;
    };
  };
  isTextRole (n) {
    return (n.role == "text" || n.role == "label") || n.role == "shape";
  };
  containerFor (n, x, y, w, h) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      if ( ((this.isTextRole(k) == false && k.role != "underlay") && k.role != "backdrop") && k.coversBox(x, y, w, h) ) {
        return this.containerFor(k, x, y, w, h);
      }
      i = i + 1;
    };
    return n;
  };
  wordOk (i) {
    if ( this.opts.wordConf[i] < this.opts.wordMinConf ) {
      return false;
    }
    if ( this.wordChars(this.opts.wordText[i]) == 0 ) {
      return false;
    }
    if ( this.opts.wordW[i] <= 0 || this.opts.wordH[i] <= 0 ) {
      return false;
    }
    return true;
  };
  sortWords (ids) {
    const n = ids.length;
    let i = 1;
    while (i < n) {
      let j = i;
      let go = true;
      while (go && j > 0) {
        const a = ids[j];
        const b = ids[(j - 1)];
        const ay = this.opts.wordY[a];
        const by = this.opts.wordY[b];
        const half = ((this.maxI(this.opts.wordH[a], this.opts.wordH[b]) / 2) | 0);
        let before = false;
        if ( ay < by - half ) {
          before = true;
        } else {
          if ( this.absI(ay - by) <= half && this.opts.wordX[a] < this.opts.wordX[b] ) {
            before = true;
          }
        }
        if ( before ) {
          ids[j] = b;
          ids[j - 1] = a;
          j = j - 1;
        } else {
          go = false;
        }
      };
      i = i + 1;
    };
  };
  sortWordsByX (ids) {
    const n = ids.length;
    let i = 1;
    while (i < n) {
      let j = i;
      while (j > 0 && this.opts.wordX[ids[j]] < this.opts.wordX[ids[(j - 1)]]) {
        const t = ids[j];
        ids[j] = ids[(j - 1)];
        ids[j - 1] = t;
        j = j - 1;
      };
      i = i + 1;
    };
  };
  labelOfWords (line) {
    let lx = 100000;
    let ly = 100000;
    let lmx = 0;
    let lmy = 0;
    let hs = [];
    let q = 0;
    while (q < line.length) {
      const wid = line[q];
      lx = this.minI(lx, this.opts.wordX[wid]);
      ly = this.minI(ly, this.opts.wordY[wid]);
      lmx = this.maxI(lmx, (this.opts.wordX[wid] + this.opts.wordW[wid]));
      lmy = this.maxI(lmy, (this.opts.wordY[wid] + this.opts.wordH[wid]));
      hs.push(this.opts.wordH[wid]);
      q = q + 1;
    };
    const med = this.medianInt(hs);
    let ty = 100000;
    let tmy = 0;
    let t = 0;
    while (t < line.length) {
      const tid = line[t];
      if ( this.opts.wordH[tid] * 10 <= med * 14 ) {
        ty = this.minI(ty, this.opts.wordY[tid]);
        tmy = this.maxI(tmy, (this.opts.wordY[tid] + this.opts.wordH[tid]));
      }
      t = t + 1;
    };
    if ( tmy > ty ) {
      ly = ty;
      lmy = tmy;
    }
    const lab = ErazerNode.of("label", lx, ly, (lmx - lx), (lmy - ly), 0, 0, 0);
    lab.words = line;
    lab.text = this.joinWords(line);
    lab.ocrText = true;
    lab.fontSize = this.medianInt(hs);
    lab.confidence = 0.8;
    return lab;
  };
  keepInkWords (lab) {
    let kept = [];
    let i = 0;
    while (i < lab.words.length) {
      const id = lab.words[i];
      const wn = ErazerNode.of(
        "label",
        this.opts.wordX[id],
        this.opts.wordY[id],
        this.opts.wordW[id],
        this.opts.wordH[id],
        0,
        0,
        0
      );
      let inside = true;
      if ( lab.inkX1 > lab.inkX0 && this.opts.wordText[id].length <= 1 ) {
        inside = wn.maxX() > lab.inkX0 && wn.x < lab.inkX1;
      }
      if ( inside ) {
        kept.push(id);
      }
      i = i + 1;
    };
    if ( kept.length > 0 && kept.length < lab.words.length ) {
      lab.words = kept;
      lab.text = this.joinWords(kept);
      let x0 = 100000;
      let x1 = 0;
      let j = 0;
      while (j < kept.length) {
        const kid = kept[j];
        x0 = this.minI(x0, this.opts.wordX[kid]);
        x1 = this.maxI(x1, (this.opts.wordX[kid] + this.opts.wordW[kid]));
        j = j + 1;
      };
      lab.x = x0;
      lab.w = x1 - x0;
    }
    lab.fontSize = this.cssFontOf(lab.text, lab.h);
  };
  cssFontOf (text, inkH) {
    let up = false;
    let down = false;
    let i = 0;
    while (i < text.length) {
      const ch = text.substring(i, i + 1 );
      if ( ("ABCDEFGHIJKLMNOPQRSTUVWXYZbdfhklt0123456789".indexOf(ch)) >= 0 ) {
        up = true;
      }
      if ( ("gjpqy".indexOf(ch)) >= 0 ) {
        down = true;
      }
      i = i + 1;
    };
    let k = 52;
    if ( up && down ) {
      k = 95;
    } else {
      if ( up ) {
        k = 72;
      } else {
        if ( down ) {
          k = 74;
        }
      }
    }
    return (((inkH * 100 + ((k / 2) | 0)) / k) | 0);
  };
  joinWords (ids) {
    let out = "";
    let i = 0;
    while (i < ids.length) {
      if ( i > 0 ) {
        out = out + " ";
      }
      out = out + this.opts.wordText[ids[i]];
      i = i + 1;
    };
    return out;
  };
  inkIn (n, bg) {
    let maxd = 0;
    let y = n.y;
    while (y < n.maxY()) {
      let x = n.x;
      while (x < n.maxX()) {
        const l = this.lumaAt(x, y);
        if ( l >= 0 ) {
          const d = this.absI((l - bg));
          if ( d > maxd ) {
            maxd = d;
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let cnt = 0;
    let ix0 = 100000;
    let iy0 = 100000;
    let ix1 = 0 - 1;
    let iy1 = 0 - 1;
    let y2 = n.y;
    while (y2 < n.maxY()) {
      let x2 = n.x;
      while (x2 < n.maxX()) {
        if ( this.img.isValidCoord(x2, y2) ) {
          const c = this.img.getPixel(x2, y2);
          const d2 = this.absI((this.lumaOf(c.r, c.g, c.b) - bg));
          if ( d2 * 10 >= maxd * 6 && maxd >= 24 ) {
            ix0 = this.minI(ix0, x2);
            iy0 = this.minI(iy0, y2);
            ix1 = this.maxI(ix1, x2);
            iy1 = this.maxI(iy1, y2);
            sr = sr + c.r;
            sg = sg + c.g;
            sb = sb + c.b;
            cnt = cnt + 1;
          }
        }
        x2 = x2 + 1;
      };
      y2 = y2 + 1;
    };
    if ( cnt > 0 && iy1 >= iy0 ) {
      n.y = iy0;
      n.h = (iy1 - iy0) + 1;
      n.fontSize = n.h;
    }
    if ( cnt > 0 && ix1 >= ix0 ) {
      n.inkX0 = ix0;
      n.inkX1 = ix1 + 1;
    }
    if ( cnt > 0 ) {
      n.textR = ((sr / cnt) | 0);
      n.textG = ((sg / cnt) | 0);
      n.textB = ((sb / cnt) | 0);
      n.r = n.textR;
      n.g = n.textG;
      n.b = n.textB;
    }
  };
  dropCovered (c, lab) {
    let keep = [];
    let i = 0;
    while (i < c.kids.length) {
      const k = c.kids[i];
      const inside = ((k.x >= lab.x - 2 && k.y >= lab.y - 2) && k.maxX() <= lab.maxX() + 2) && k.maxY() <= lab.maxY() + 2;
      if ( (k != lab && inside) && k.h <= lab.h + 4 ) {
      } else {
        keep.push(k);
      }
      i = i + 1;
    };
    c.kids = keep;
  };
  isControl (n) {
    return (((n.role == "switch" || n.role == "checkbox") || n.role == "slider") || n.role == "sliderthumb") || n.role == "icon";
  };
  dropRunsIn (n, lab) {
    let keep = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      let gone = false;
      if ( (k != lab && this.isTextRole(k)) && k.w * k.h > 0 ) {
        if ( this.overlapArea(k, lab) * 2 >= k.w * k.h ) {
          gone = true;
        }
      }
      if ( gone == false ) {
        keep.push(k);
        this.dropRunsIn(k, lab);
      }
      i = i + 1;
    };
    n.kids = keep;
  };
  dropLetterJunk (n, labs) {
    let keep = [];
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.dropLetterJunk(k, labs);
      let gone = false;
      if ( (k.ocrText == false && k.kids.length == 0) && (((((((k.role == "panel" || k.role == "button") || k.role == "checkbox") || k.role == "icon") || k.role == "shape") || k.role == "textfield") || k.role == "text") || k.role == "label") ) {
        let cover = 0;
        let j = 0;
        while (j < labs.length) {
          cover = cover + this.overlapArea(k, labs[j]);
          j = j + 1;
        };
        if ( cover * 10 >= (k.w * k.h) * 6 ) {
          gone = true;
        }
      }
      if ( gone == false ) {
        keep.push(k);
      }
      i = i + 1;
    };
    n.kids = keep;
  };
  applyWords (page) {
    const n = this.opts.wordCount();
    if ( n == 0 ) {
      return;
    }
    let ids = [];
    let i = 0;
    while (i < n) {
      if ( this.wordOk(i) ) {
        ids.push(i);
      }
      i = i + 1;
    };
    this.sortWords(ids);
    let used = [];
    let u = 0;
    while (u < ids.length) {
      used.push(0);
      u = u + 1;
    };
    let lines = [];
    let a = 0;
    while (a < ids.length) {
      if ( used[a] == 0 ) {
        used[a] = 1;
        const first = ids[a];
        const lid = this.opts.wordLine[first];
        const cy0 = this.opts.wordY[first] + ((this.opts.wordH[first] / 2) | 0);
        const hh = this.opts.wordH[first];
        let row = [];
        row.push(first);
        let b = a + 1;
        while (b < ids.length) {
          const id = ids[b];
          if ( used[b] == 0 ) {
            let same = false;
            if ( lid >= 0 ) {
              same = this.opts.wordLine[id] == lid;
            } else {
              const cy1 = this.opts.wordY[id] + ((this.opts.wordH[id] / 2) | 0);
              same = this.absI(cy1 - cy0) <= ((hh / 2) | 0);
            }
            if ( same ) {
              row.push(id);
              used[b] = 1;
            }
          }
          b = b + 1;
        };
        this.sortWordsByX(row);
        let line = [];
        let right = 0 - 100000;
        let r = 0;
        while (r < row.length) {
          const wid = row[r];
          const gap = this.opts.wordX[wid] - right;
          if ( line.length > 0 && gap > hh * 2 + 2 ) {
            lines.push(this.labelOfWords(line));
            let fresh = [];
            line = fresh;
          }
          line.push(wid);
          right = this.maxI(right, (this.opts.wordX[wid] + this.opts.wordW[wid]));
          r = r + 1;
        };
        if ( line.length > 0 ) {
          lines.push(this.labelOfWords(line));
        }
      }
      a = a + 1;
    };
    let lh = [];
    let m = 0;
    while (m < lines.length) {
      const l0 = lines[m];
      lh.push(l0.h);
      m = m + 1;
    };
    const medH = this.medianInt(lh);
    let placed = [];
    let p = 0;
    while (p < lines.length) {
      const lab2 = lines[p];
      const box = this.containerFor(page, lab2.x, lab2.y, lab2.w, lab2.h);
      const mark = lab2.text.length <= 1 && lab2.h * 10 > medH * 18;
      if ( this.isControl(box) == false && mark == false ) {
        this.inkIn(lab2, this.localBgLuma(lab2));
        this.keepInkWords(lab2);
        this.dropRunsIn(page, lab2);
        this.dropCovered(box, lab2);
        box.addKid(lab2);
        placed.push(lab2);
      }
      p = p + 1;
    };
    this.dropLetterJunk(page, placed);
    this.refreshControlText(page);
  };
  refreshControlText (n) {
    if ( ((n.role == "button" || n.role == "textfield") || n.role == "tab") || n.role == "menuitem" ) {
      const hit = this.firstText(n);
      if ( typeof(hit) != "undefined" ) {
        this.copyTextOnto(n, hit);
      }
    }
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      this.refreshControlText(k);
      i = i + 1;
    };
  };
  sharedEdge (n, k) {
    let l = 0;
    let r = 0;
    let c = 0;
    let i = 0;
    while (i < n.kids.length) {
      const o = n.kids[i];
      if ( o != k && (o.role == "text" || o.role == "label") ) {
        if ( this.absI(o.x - k.x) <= 3 ) {
          l = l + 1;
        }
        if ( this.absI(o.maxX() - k.maxX()) <= 3 ) {
          r = r + 1;
        }
        if ( this.absI(o.cx() - k.cx()) <= 3 ) {
          c = c + 1;
        }
      }
      i = i + 1;
    };
    if ( (l >= r && l >= c) && l > 0 ) {
      return "left";
    }
    if ( c >= r && c > 0 ) {
      return "center";
    }
    if ( r > 0 ) {
      return "right";
    }
    return "";
  };
  alignTexts (n) {
    let i = 0;
    while (i < n.kids.length) {
      const k = n.kids[i];
      let shared = this.sharedEdge(n, k);
      const lg0 = k.x - n.x;
      const rg0 = n.maxX() - k.maxX();
      if ( shared == "right" && rg0 >= lg0 ) {
        shared = "";
      }
      if ( shared == "center" && this.absI(lg0 - rg0) > this.maxI(8, (((lg0 + rg0) / 4) | 0)) ) {
        shared = "";
      }
      if ( (k.role == "text" || k.role == "label") && shared.length > 0 ) {
        k.align = shared;
      }
      if ( (k.role == "text" || k.role == "label") && shared.length == 0 ) {
        const lg = k.x - n.x;
        const rg = n.maxX() - k.maxX();
        const slack = lg + rg;
        if ( slack >= 8 ) {
          const tol = this.maxI(4, ((slack / 8) | 0));
          if ( this.absI(lg - rg) <= tol && lg > 8 ) {
            k.align = "center";
          } else {
            if ( rg < lg ) {
              k.align = "right";
            } else {
              k.align = "left";
            }
          }
        }
      }
      this.alignTexts(k);
      i = i + 1;
    };
  };
  run () {
    const fullW = this.img.width;
    const fullH = this.img.height;
    const k = this.pickScale();
    const full = this.img;
    if ( k > 1 ) {
      this.img = this.boxDown(k);
    }
    let w = this.img.width;
    let h = this.img.height;
    const raws = this.components();
    this.dropCornerSlivers(raws);
    this.stitchGlyphs(raws);
    this.adoptInline(raws);
    const texts = this.clusterText(raws);
    let pageColorR = 255;
    let pageColorG = 255;
    let pageColorB = 255;
    let pageIdx = 0 - 1;
    let i = 0;
    while (i < raws.length) {
      const r = raws[i];
      if ( this.fullBleed(r, w, h) ) {
        pageColorR = r.r;
        pageColorG = r.g;
        pageColorB = r.b;
        pageIdx = i;
        r.used = true;
      }
      i = i + 1;
    };
    const page = ErazerNode.of(
      "page",
      0,
      0,
      w,
      h,
      pageColorR,
      pageColorG,
      pageColorB
    );
    page.confidence = 1.0;
    if ( pageIdx >= 0 ) {
      this.copyGrad(page, raws[pageIdx]);
    }
    let nodes = [];
    let j = 0;
    while (j < raws.length) {
      const raw = raws[j];
      if ( raw.used == false ) {
        if ( raw.kind != "glyph" ) {
          if ( raw.kind != "line" ) {
            let role = "panel";
            if ( raw.kind == "icon" ) {
              role = "icon";
            }
            if ( raw.kind == "box" ) {
              role = "panel";
            }
            if ( raw.kind == "frame" ) {
              role = "panel";
            }
            nodes.push(this.nodeFromRaw(raw, role));
          }
        }
      }
      j = j + 1;
    };
    let t = 0;
    while (t < texts.length) {
      nodes.push(texts[t]);
      t = t + 1;
    };
    this.mergeFrameFill(nodes);
    this.splitRows(nodes, page, raws);
    const under = this.splitBackdrop(nodes, page);
    this.nest(nodes, page);
    this.layerUnder(page, under);
    this.classifyTree(page);
    this.relabelTexts(page);
    this.promoteGroups(page);
    this.dropImplausibleText(page, this.medianFont(page));
    this.relabelTexts(page);
    this.traceIcons(page);
    if ( k > 1 ) {
      this.scaleTree(page, k);
      page.w = fullW;
      page.h = fullH;
      w = fullW;
      h = fullH;
    }
    this.img = full;
    this.applyWords(page);
    this.relabelTexts(page);
    this.alignTexts(page);
    const boxes = ErazerLayoutNet.boxesFromTree(page, w, h);
    const net = ErazerLayoutNet.shared();
    const guesses = net.scan(boxes);
    const doc = new ErazerDoc();
    doc.width = w;
    doc.height = h;
    doc.root = page;
    const evg = this.emitNode(page, 0, 0);
    evg.position = "relative";
    doc.json = EVGTreeJson.toText(evg);
    doc.outline = this.writeOutline(page, "");
    doc.layoutJson = net.toJson(boxes, guesses);
    doc.overlaySvg = this.writeOverlay(page, w, h, guesses);
    return doc;
  };
}
Erazer.fromImageBuffer = function(img, options) {
  const z = new Erazer();
  z.img = img;
  z.opts = options;
  return z.run();
};
Erazer.analyze = function(img) {
  return Erazer.fromImageBuffer(img, ErazerOptions.defaults());
};
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
    return b0 + b1 * 256;
  };
  readUint32LE () {
    const b0 = this.readUint8();
    const b1 = this.readUint8();
    const b2 = this.readUint8();
    const b3 = this.readUint8();
    return ((b0 + b1 * 256) + b2 * 65536) + b3 * 16777216;
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
        result = result + String.fromCharCode(ch);
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
    const b1 = ((value >>> 8) & 255);
    this.writeUint8(b0);
    this.writeUint8(b1);
  };
  writeUint32LE (value) {
    const b0 = (value & 255);
    const b1 = ((value >>> 8) & 255);
    const b2 = ((value >>> 16) & 255);
    const b3 = ((value >>> 24) & 255);
    this.writeUint8(b0);
    this.writeUint8(b1);
    this.writeUint8(b2);
    this.writeUint8(b3);
  };
  writeBytes (src, srcOffset, count) {
    let i = 0;
    while (i < count) {
      const b = src._view.getUint8(srcOffset + i);
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
    const b1D = value / 256.0;
    const b1 = Math.floor( b1D) % 256;
    this.writeUint8(b0);
    this.writeUint8(b1);
  };
  writeUint32LE (value) {
    const b0 = value % 256;
    const rem1D = value / 256.0;
    const rem1 = Math.floor( rem1D);
    const b1 = rem1 % 256;
    const rem2D = rem1 / 256.0;
    const rem2 = Math.floor( rem2D);
    const b2 = rem2 % 256;
    const rem3D = rem2 / 256.0;
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
      (function(
        d,
        dOff,
        s,
        sOff,
        len
      ){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.currentChunk,this.currentPos,src,at,take);
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
        (function(
          d,
          dOff,
          s,
          sOff,
          len
        ){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,destPos,chunk,0,used);
        destPos = destPos + used;
      }
      i = i + 1;
    };
    const curPos = this.currentPos;
    if ( curPos > 0 ) {
      const curChunk = this.currentChunk;
      (function(
        d,
        dOff,
        s,
        sOff,
        len
      ){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,destPos,curChunk,0,curPos);
      destPos = destPos + curPos;
    }
    return result;
  };
}
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
      code = code * 2 + bit;
      const count = this.counts[__len];
      if ( code - first < count ) {
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
      result = result + bit * multiplier;
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
    return b0 + b1 * 256;
  };
  getBytePosition () {
    return this.bytePos;
  };
  isEOF () {
    return this.bytePos >= this.dataLength && this.bitPos == 0;
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
    (function(
      d,
      dOff,
      s,
      sOff,
      len
    ){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(grown,0,this.outBuf,0,this.outLen);
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
    (function(
      d,
      dOff,
      s,
      sOff,
      len
    ){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(result,0,this.outBuf,0,size);
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
    return this.decompressFrom(data, 0);
  };
  decompressFrom (data, offset) {
    this.input = data;
    const dataLen = data.byteLength;
    let from = offset;
    if ( from < 0 ) {
      from = 0;
    }
    if ( from > dataLen ) {
      from = dataLen;
    }
    const rest = dataLen - from;
    this.resetOutput(rest * 4);
    this.reader.init(data, from, rest);
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
  inputPos () {
    return this.reader.getBytePosition();
  };
  decompressStored () {
    this.reader.alignToByte();
    const __len = this.reader.readUint16LE();
    const nlen = this.reader.readUint16LE();
    if ( __len + nlen != 65535 ) {
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
class PNGDecoder  {
  constructor() {
    this.pos = 0;
    this.fileData = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.fileLen = 0;
    this.width = 0;
    this.height = 0;
    this.colorType = 0;
    this.bitDepth = 0;
    this.paletteR = [];
    this.paletteG = [];
    this.paletteB = [];
    this.paletteA = [];
    this.paletteCount = 0;
    this.idatData = new GrowableBuffer();
  }
  clearPalette () {
    let emptyR = [];
    let emptyG = [];
    let emptyB = [];
    let emptyA = [];
    this.paletteR = emptyR;
    this.paletteG = emptyG;
    this.paletteB = emptyB;
    this.paletteA = emptyA;
    this.paletteCount = 0;
  };
  readU8 () {
    if ( this.pos >= this.fileLen ) {
      return 0;
    }
    const v = this.fileData._view.getUint8(this.pos);
    this.pos = this.pos + 1;
    return v;
  };
  readU32BE () {
    const b0 = this.readU8();
    const b1 = this.readU8();
    const b2 = this.readU8();
    const b3 = this.readU8();
    return ((b0 * 256 + b1) * 256 + b2) * 256 + b3;
  };
  parseIHDR (chunkLen) {
    this.width = this.readU32BE();
    this.height = this.readU32BE();
    this.bitDepth = this.readU8();
    this.colorType = this.readU8();
    this.readU8();
    this.readU8();
    this.readU8();
    const remain = chunkLen - 13;
    let skip = 0;
    while (skip < remain) {
      this.readU8();
      skip = skip + 1;
    };
  };
  parsePLTE (chunkLen) {
    this.clearPalette();
    const count = Math.floor( chunkLen / 3.0);
    this.paletteCount = count;
    let i = 0;
    while (i < count) {
      this.paletteR.push(this.readU8());
      this.paletteG.push(this.readU8());
      this.paletteB.push(this.readU8());
      this.paletteA.push(255);
      i = i + 1;
    };
  };
  parseTRNS (chunkLen) {
    let i = 0;
    while (i < chunkLen) {
      if ( i < this.paletteCount ) {
        this.paletteA[i] = this.readU8();
      } else {
        this.readU8();
      }
      i = i + 1;
    };
  };
  appendIDAT (chunkLen) {
    let i = 0;
    while (i < chunkLen) {
      this.idatData.writeByte(this.readU8());
      i = i + 1;
    };
  };
  skipBytes (n) {
    let i = 0;
    while (i < n) {
      this.readU8();
      i = i + 1;
    };
  };
  sliceBuffer (src, start, count) {
    if ( count <= 0 ) {
      return (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    }
    let out = (function(){ var b = new ArrayBuffer(count); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < count) {
      out._view.setUint8(i, src._view.getUint8(start + i));
      i = i + 1;
    };
    return out;
  };
  abs (n) {
    if ( n < 0 ) {
      return 0 - n;
    }
    return n;
  };
  paeth (a, b, c) {
    let p = a + b;
    p = p - c;
    const pa = this.abs((p - a));
    const pb = this.abs((p - b));
    const pc = this.abs((p - c));
    if ( pa <= pb && pa <= pc ) {
      return a;
    }
    if ( pb <= pc ) {
      return b;
    }
    return c;
  };
  filterByte (n) {
    return (n & 255);
  };
  filterBpp (ctype) {
    if ( ctype == 6 ) {
      return 4;
    }
    if ( ctype == 2 ) {
      return 3;
    }
    return 1;
  };
  unfilter (raw, rowBytes, imgHeight, bpp) {
    let out = (function(){ var b = new ArrayBuffer(rowBytes * imgHeight); b._view = new DataView(b); return b; })();
    const rawLen = raw.byteLength;
    let rawPos = 0;
    let prevRow = [];
    let y = 0;
    while (y < imgHeight) {
      if ( rawPos >= rawLen ) {
        return out;
      }
      const filterType = raw._view.getUint8(rawPos);
      rawPos = rawPos + 1;
      let curRow = [];
      let x = 0;
      while (x < rowBytes) {
        curRow.push(0);
        x = x + 1;
      };
      x = 0;
      while (x < rowBytes) {
        if ( rawPos >= rawLen ) {
          return out;
        }
        const fv = raw._view.getUint8(rawPos);
        rawPos = rawPos + 1;
        let recon = fv;
        if ( filterType == 1 ) {
          let left = 0;
          if ( x >= bpp ) {
            left = curRow[(x - bpp)];
          }
          recon = fv + left;
        }
        if ( filterType == 2 ) {
          let up = 0;
          if ( y > 0 ) {
            up = prevRow[x];
          }
          recon = fv + up;
        }
        if ( filterType == 3 ) {
          let left_1 = 0;
          let up_1 = 0;
          if ( x >= bpp ) {
            left_1 = curRow[(x - bpp)];
          }
          if ( y > 0 ) {
            up_1 = prevRow[x];
          }
          recon = fv + ((left_1 + up_1) >> 1);
        }
        if ( filterType == 4 ) {
          let left_2 = 0;
          let up_2 = 0;
          let upLeft = 0;
          if ( x >= bpp ) {
            left_2 = curRow[(x - bpp)];
          }
          if ( y > 0 ) {
            up_2 = prevRow[x];
          }
          if ( x >= bpp && y > 0 ) {
            upLeft = prevRow[(x - bpp)];
          }
          recon = fv + this.paeth(left_2, up_2, upLeft);
        }
        recon = this.filterByte(recon);
        curRow[x] = recon;
        x = x + 1;
      };
      x = 0;
      while (x < rowBytes) {
        const o = y * rowBytes + x;
        out._view.setUint8(o, curRow[x]);
        x = x + 1;
      };
      prevRow = curRow;
      y = y + 1;
    };
    return out;
  };
  rowByteCount (w, depth, ctype) {
    if ( ctype == 6 ) {
      return w * 4;
    }
    if ( ctype == 2 ) {
      return w * 3;
    }
    const bits = w * depth;
    return Math.floor( (bits + 7) / 8.0);
  };
  decodeIndexedPixels (img, indices, rowBytes, depth) {
    const imgW = img.width;
    let y = 0;
    while (y < this.height) {
      if ( depth == 8 ) {
        let x = 0;
        while (x < this.width) {
          const idx = indices._view.getUint8(y * rowBytes + x);
          if ( idx < this.paletteCount ) {
            const a = this.paletteA[idx];
            if ( a > 0 ) {
              const off = (y * imgW + x) * 4;
              img.pixels._view.setUint8(off, this.paletteR[idx]);
              img.pixels._view.setUint8(off + 1, this.paletteG[idx]);
              img.pixels._view.setUint8(off + 2, this.paletteB[idx]);
              img.pixels._view.setUint8(off + 3, a);
            }
          }
          x = x + 1;
        };
      }
      if ( depth == 4 ) {
        let x_1 = 0;
        let byteIdx = 0;
        while (x_1 < this.width) {
          const packed = indices._view.getUint8(y * rowBytes + byteIdx);
          const hi = (packed >> 4);
          const lo = (packed & 15);
          if ( hi < this.paletteCount ) {
            const aHi = this.paletteA[hi];
            if ( aHi > 0 ) {
              const offHi = (y * imgW + x_1) * 4;
              img.pixels._view.setUint8(offHi, this.paletteR[hi]);
              img.pixels._view.setUint8(offHi + 1, this.paletteG[hi]);
              img.pixels._view.setUint8(offHi + 2, this.paletteB[hi]);
              img.pixels._view.setUint8(offHi + 3, aHi);
            }
          }
          const x2 = x_1 + 1;
          if ( x2 < this.width ) {
            if ( lo < this.paletteCount ) {
              const aLo = this.paletteA[lo];
              if ( aLo > 0 ) {
                const offLo = (y * imgW + x2) * 4;
                img.pixels._view.setUint8(offLo, this.paletteR[lo]);
                img.pixels._view.setUint8(offLo + 1, this.paletteG[lo]);
                img.pixels._view.setUint8(offLo + 2, this.paletteB[lo]);
                img.pixels._view.setUint8(offLo + 3, aLo);
              }
            }
          }
          x_1 = x_1 + 2;
          byteIdx = byteIdx + 1;
        };
      }
      y = y + 1;
    };
  };
  decodeRgbaPixels (img, indices, rowBytes) {
    const imgW = img.width;
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const off = y * rowBytes + x * 4;
        const a = indices._view.getUint8(off + 3);
        if ( a > 0 ) {
          const dstOff = (y * imgW + x) * 4;
          img.pixels._view.setUint8(dstOff, indices._view.getUint8(off));
          img.pixels._view.setUint8(dstOff + 1, indices._view.getUint8(off + 1));
          img.pixels._view.setUint8(dstOff + 2, indices._view.getUint8(off + 2));
          img.pixels._view.setUint8(dstOff + 3, a);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  decodeRgbPixels (img, indices, rowBytes) {
    const imgW = img.width;
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const off = y * rowBytes + x * 3;
        const dstOff = (y * imgW + x) * 4;
        img.pixels._view.setUint8(dstOff, indices._view.getUint8(off));
        img.pixels._view.setUint8(dstOff + 1, indices._view.getUint8(off + 1));
        img.pixels._view.setUint8(dstOff + 2, indices._view.getUint8(off + 2));
        img.pixels._view.setUint8(dstOff + 3, 255);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  inflateZlib (zlibData) {
    const zlen = zlibData.byteLength;
    if ( zlen < 6 ) {
      return (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    }
    const deflateLen = zlen - 6;
    const deflateBuf = this.sliceBuffer(zlibData, 2, deflateLen);
    const inflater = new Inflate();
    return inflater.decompress(deflateBuf);
  };
  parseChunks () {
    this.idatData = new GrowableBuffer();
    this.clearPalette();
    this.pos = 8;
    while (this.pos < this.fileLen) {
      const chunkLen = this.readU32BE();
      const type0 = this.readU8();
      const type1 = this.readU8();
      const type2 = this.readU8();
      const type3 = this.readU8();
      if ( type0 == 73 ) {
        if ( type1 == 72 ) {
          if ( type2 == 68 ) {
            if ( type3 == 82 ) {
              this.parseIHDR(chunkLen);
              this.skipBytes(4);
              continue;
            }
          }
        }
      }
      if ( type0 == 80 ) {
        if ( type1 == 76 ) {
          if ( type2 == 84 ) {
            if ( type3 == 69 ) {
              this.parsePLTE(chunkLen);
              this.skipBytes(4);
              continue;
            }
          }
        }
      }
      if ( type0 == 116 ) {
        if ( type1 == 82 ) {
          if ( type2 == 78 ) {
            if ( type3 == 83 ) {
              this.parseTRNS(chunkLen);
              this.skipBytes(4);
              continue;
            }
          }
        }
      }
      if ( type0 == 73 ) {
        if ( type1 == 68 ) {
          if ( type2 == 65 ) {
            if ( type3 == 84 ) {
              this.appendIDAT(chunkLen);
              this.skipBytes(4);
              continue;
            }
          }
        }
      }
      if ( type0 == 73 ) {
        if ( type1 == 69 ) {
          if ( type2 == 78 ) {
            if ( type3 == 68 ) {
              return true;
            }
          }
        }
      }
      this.skipBytes(chunkLen + 4);
    };
    return false;
  };
  decode (dir, fileName) {
    const fail = new ImageBuffer();
    fail.init(1, 1);
    const bytes = (function(){ var b = require('fs').readFileSync( require('path').join(dir, fileName) ); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( bytes.byteLength < 24 ) {
      console.log(("[png_decoder] file too small: " + dir) + fileName);
      return fail;
    }
    return this.decodeBytes(bytes);
  };
  decodeBytes (bytes) {
    const fail = new ImageBuffer();
    fail.init(1, 1);
    this.pos = 0;
    this.idatData = new GrowableBuffer();
    this.clearPalette();
    this.fileData = bytes;
    this.fileLen = this.fileData.byteLength;
    if ( this.fileLen < 24 ) {
      console.log("[png_decoder] buffer too small");
      return fail;
    }
    if ( this.parseChunks() == false ) {
      console.log("[png_decoder] chunk parse failed");
      return fail;
    }
    if ( this.colorType == 3 ) {
      if ( this.bitDepth != 8 && this.bitDepth != 4 ) {
        console.log("[png_decoder] indexed depth unsupported: " + (this.bitDepth.toString()));
        return fail;
      }
      if ( this.paletteCount <= 0 ) {
        console.log("[png_decoder] missing PLTE");
        return fail;
      }
    }
    if ( this.colorType == 6 ) {
      if ( this.bitDepth != 8 ) {
        console.log("[png_decoder] RGBA requires 8-bit channels");
        return fail;
      }
    }
    if ( this.colorType == 2 ) {
      if ( this.bitDepth != 8 ) {
        console.log("[png_decoder] RGB requires 8-bit channels");
        return fail;
      }
    }
    if ( (this.colorType != 3 && this.colorType != 6) && this.colorType != 2 ) {
      console.log("[png_decoder] unsupported color type " + (this.colorType.toString()));
      return fail;
    }
    const zlibBuf = this.idatData.toBuffer();
    const inflated = this.inflateZlib(zlibBuf);
    if ( inflated.byteLength <= 0 ) {
      console.log("[png_decoder] inflate failed");
      return fail;
    }
    const rowBytes = this.rowByteCount(
      this.width,
      this.bitDepth,
      this.colorType
    );
    const bpp = this.filterBpp(this.colorType);
    const indices = this.unfilter(inflated, rowBytes, this.height, bpp);
    const need = rowBytes * this.height;
    if ( indices.byteLength < need ) {
      console.log("[png_decoder] unfilter short");
      return fail;
    }
    const img = new ImageBuffer();
    img.initClear(this.width, this.height);
    img.fillTransparent();
    if ( this.colorType == 3 ) {
      this.decodeIndexedPixels(img, indices, rowBytes, this.bitDepth);
    }
    if ( this.colorType == 6 ) {
      this.decodeRgbaPixels(img, indices, rowBytes);
    }
    if ( this.colorType == 2 ) {
      this.decodeRgbPixels(img, indices, rowBytes);
    }
    return img;
  };
  decodeRelative (spritesheetsRoot, relativePath) {
    const slash = relativePath.lastIndexOf("/");
    let dir = spritesheetsRoot;
    let file = relativePath;
    if ( slash >= 0 ) {
      dir = spritesheetsRoot + relativePath.substring(0, slash + 1 );
      file = relativePath.substring(slash + 1, relativePath.length );
    }
    return this.decode(dir, file);
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
          if ( nextByte >= 208 && nextByte <= 215 ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
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
    const bit = ((this.currentByte >> this.bitPos) & 1);
    return bit;
  };
  readBits (count) {
    let result = 0;
    let i = 0;
    while (i < count) {
      result = ((result << 1) | this.readBit());
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
  skipRestartMarker () {
    if ( this.bytePos + 1 >= this.dataEnd ) {
      return false;
    }
    const byte1 = this.data._view.getUint8(this.bytePos);
    const byte2 = this.data._view.getUint8(this.bytePos + 1);
    if ( (byte1 == 255 && byte2 >= 208) && byte2 <= 215 ) {
      this.bytePos = this.bytePos + 2;
      return true;
    }
    return false;
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
      value = value - ((threshold << 1) - 1);
    }
    return value;
  };
}
class HuffmanTable  {
  constructor() {
    this.bits = new Int32Array(16);
    this.values = [];
    this.maxCode = new Int32Array(16);
    this.minCode = new Int32Array(16);
    this.valPtr = new Int32Array(16);
    this.tableClass = 0;
    this.tableId = 0;
    let i_1 = 0;
    while (i_1 < 16) {
      this.bits[i_1] = 0;
      this.maxCode[i_1] = -1;
      this.minCode[i_1] = 0;
      this.valPtr[i_1] = 0;
      i_1 = i_1 + 1;
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
      code = ((code << 1) | bit);
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
  resetArrays () {
    let i = 0;
    while (i < 16) {
      this.bits[i] = 0;
      this.maxCode[i] = -1;
      this.minCode[i] = 0;
      this.valPtr[i] = 0;
      i = i + 1;
    };
    this.values.length = 0;
  };
}
class HuffmanDecoder  {
  constructor() {
    this.quiet = false;
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
      table.resetArrays();
      let totalSymbols = 0;
      let i = 0;
      while (i < 16) {
        const count = data._view.getUint8(pos);
        table.bits[i] = count;
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
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
      if ( this.quiet == false ) {
        console.log((((("  Huffman table " + classStr) + (tableId.toString())) + ": ") + (totalSymbols.toString())) + " symbols");
      }
    };
  };
}
class IDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagMap = new Int32Array(64);
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
    this.zigzagMap[0] = 0;
    this.zigzagMap[1] = 1;
    this.zigzagMap[2] = 8;
    this.zigzagMap[3] = 16;
    this.zigzagMap[4] = 9;
    this.zigzagMap[5] = 2;
    this.zigzagMap[6] = 3;
    this.zigzagMap[7] = 10;
    this.zigzagMap[8] = 17;
    this.zigzagMap[9] = 24;
    this.zigzagMap[10] = 32;
    this.zigzagMap[11] = 25;
    this.zigzagMap[12] = 18;
    this.zigzagMap[13] = 11;
    this.zigzagMap[14] = 4;
    this.zigzagMap[15] = 5;
    this.zigzagMap[16] = 12;
    this.zigzagMap[17] = 19;
    this.zigzagMap[18] = 26;
    this.zigzagMap[19] = 33;
    this.zigzagMap[20] = 40;
    this.zigzagMap[21] = 48;
    this.zigzagMap[22] = 41;
    this.zigzagMap[23] = 34;
    this.zigzagMap[24] = 27;
    this.zigzagMap[25] = 20;
    this.zigzagMap[26] = 13;
    this.zigzagMap[27] = 6;
    this.zigzagMap[28] = 7;
    this.zigzagMap[29] = 14;
    this.zigzagMap[30] = 21;
    this.zigzagMap[31] = 28;
    this.zigzagMap[32] = 35;
    this.zigzagMap[33] = 42;
    this.zigzagMap[34] = 49;
    this.zigzagMap[35] = 56;
    this.zigzagMap[36] = 57;
    this.zigzagMap[37] = 50;
    this.zigzagMap[38] = 43;
    this.zigzagMap[39] = 36;
    this.zigzagMap[40] = 29;
    this.zigzagMap[41] = 22;
    this.zigzagMap[42] = 15;
    this.zigzagMap[43] = 23;
    this.zigzagMap[44] = 30;
    this.zigzagMap[45] = 37;
    this.zigzagMap[46] = 44;
    this.zigzagMap[47] = 51;
    this.zigzagMap[48] = 58;
    this.zigzagMap[49] = 59;
    this.zigzagMap[50] = 52;
    this.zigzagMap[51] = 45;
    this.zigzagMap[52] = 38;
    this.zigzagMap[53] = 31;
    this.zigzagMap[54] = 39;
    this.zigzagMap[55] = 46;
    this.zigzagMap[56] = 53;
    this.zigzagMap[57] = 60;
    this.zigzagMap[58] = 61;
    this.zigzagMap[59] = 54;
    this.zigzagMap[60] = 47;
    this.zigzagMap[61] = 55;
    this.zigzagMap[62] = 62;
    this.zigzagMap[63] = 63;
  }
  dezigzag (zigzag) {
    let block = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagMap[i];
      const val = zigzag[i];
      block[pos] = val;
      i = i + 1;
    };
    return block;
  };
  idct1d (input, startIdx, stride, output, outIdx, outStride) {
    let hasAC = false;
    let uc = 1;
    while (uc < 8) {
      if ( input[(startIdx + uc * stride)] != 0 ) {
        hasAC = true;
        uc = 8;
      }
      uc = uc + 1;
    };
    if ( hasAC == false ) {
      let dcSum = 0;
      const dcCoeff = input[startIdx];
      if ( dcCoeff != 0 ) {
        let dcContrib = dcCoeff * 1024;
        dcContrib = ((dcContrib * 724) >> 10);
        dcSum = dcSum + dcContrib;
      }
      const flat = (dcSum >> 11);
      let fx = 0;
      while (fx < 8) {
        output[outIdx + fx * outStride] = flat;
        fx = fx + 1;
      };
      return;
    }
    let x = 0;
    while (x < 8) {
      let sum = 0;
      let u = 0;
      while (u < 8) {
        const coeff = input[(startIdx + u * stride)];
        if ( coeff != 0 ) {
          const cosVal = this.cosTable[(x * 8 + u)];
          let contrib = coeff * cosVal;
          if ( u == 0 ) {
            contrib = ((contrib * 724) >> 10);
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[outIdx + x * outStride] = (sum >> 11);
      x = x + 1;
    };
  };
  transform (block, output) {
    const temp = new Int32Array(64);
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
    let i = 0;
    while (i < 64) {
      let val = output[i] + 128;
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
class PPMImage  {
  constructor() {
  }
  parseNumber (data, startPos, endPos) {
    const __len = data.byteLength;
    let pos = startPos;
    let skipping = true;
    while (skipping && pos < __len) {
      const ch = data._view.getUint8(pos);
      if ( ((ch == 32 || ch == 10) || ch == 13) || ch == 9 ) {
        pos = pos + 1;
      } else {
        skipping = false;
      }
    };
    let value = 0;
    let parsing = true;
    while (parsing && pos < __len) {
      const ch_1 = data._view.getUint8(pos);
      if ( ch_1 >= 48 && ch_1 <= 57 ) {
        value = value * 10 + (ch_1 - 48);
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
    const data = (function(){ var b = require('fs').readFileSync( require('path').join(dirPath, fileName) ); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const __len = data.byteLength;
    if ( __len < 10 ) {
      console.log("Error: File too small: " + fileName);
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    const m1 = data._view.getUint8(0);
    const m2 = data._view.getUint8(1);
    if ( m1 != 80 || m2 != 54 && m2 != 51 ) {
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
    while (skippingComments && pos < __len) {
      const ch = data._view.getUint8(pos);
      if ( ((ch == 32 || ch == 10) || ch == 13) || ch == 9 ) {
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
    console.log((((("Loading PPM: " + (width.toString())) + "x") + (height.toString())) + ", maxval=") + (maxVal.toString()));
    const img = new ImageBuffer();
    img.init(width, height);
    if ( isBinary ) {
      let y = 0;
      while (y < height) {
        let x = 0;
        while (x < width) {
          if ( pos + 2 < __len ) {
            const r = data._view.getUint8(pos);
            const g = data._view.getUint8(pos + 1);
            const b = data._view.getUint8(pos + 2);
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
    buf.writeString((((img.width.toString()) + " ") + (img.height.toString())) + "\n");
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
    require('fs').writeFileSync(require('path').join(dirPath, fileName), Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
  saveP3 (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P3\n");
    buf.writeString("# Created by Ranger ImageEditor\n");
    buf.writeString((((img.width.toString()) + " ") + (img.height.toString())) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeString(((((c.r.toString()) + " ") + (c.g.toString())) + " ") + (c.b.toString()));
        if ( x < img.width - 1 ) {
          buf.writeString("  ");
        }
        x = x + 1;
      };
      buf.writeString("\n");
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(require('path').join(dirPath, fileName), Buffer.from(data));
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
    let i_2 = 0;
    while (i_2 < 64) {
      this.values.push(1);
      i_2 = i_2 + 1;
    };
  }
}
class JPEGDecoder  {
  constructor() {
    this.quiet = false;
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.components = [];
    this.quantTables = [];
    this.huffman = undefined;
    this.idct = undefined;
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.restartInterval = 0;
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
    let i_3 = 0;
    while (i_3 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_3 = i_3 + 1;
    };
  }
  say (msg) {
    if ( this.quiet ) {
      return;
    }
    console.log(msg);
  };
  reset () {
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.restartInterval = 0;
    this.components.length = 0;
    this.huffman.dcTable0.resetArrays();
    this.huffman.dcTable1.resetArrays();
    this.huffman.acTable0.resetArrays();
    this.huffman.acTable1.resetArrays();
    let i = 0;
    while (i < 4) {
      const qt = this.quantTables[i];
      qt.values.length = 0;
      let j = 0;
      while (j < 64) {
        qt.values.push(1);
        j = j + 1;
      };
      i = i + 1;
    };
  };
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8(pos + 1);
    return high * 256 + low;
  };
  parseSOF (pos, length) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8(pos + 5);
    this.say(((((("  Image: " + (this.width.toString())) + "x") + (this.height.toString())) + ", ") + (this.numComponents.toString())) + " components");
    this.components.length = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    let i = 0;
    let offset = pos + 6;
    while (i < this.numComponents) {
      const comp = new JPEGComponent();
      comp.id = this.data._view.getUint8(offset);
      const sampling = this.data._view.getUint8(offset + 1);
      comp.hSamp = (sampling >> 4);
      comp.vSamp = (sampling & 15);
      comp.quantTableId = this.data._view.getUint8(offset + 2);
      if ( comp.hSamp > this.maxHSamp ) {
        this.maxHSamp = comp.hSamp;
      }
      if ( comp.vSamp > this.maxVSamp ) {
        this.maxVSamp = comp.vSamp;
      }
      this.components.push(comp);
      this.say((((((("    Component " + (comp.id.toString())) + ": ") + (comp.hSamp.toString())) + "x") + (comp.vSamp.toString())) + " sampling, quant table ") + (comp.quantTableId.toString()));
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( ((this.width + this.mcuWidth) - 1) / this.mcuWidth);
    this.mcusPerCol = Math.floor( ((this.height + this.mcuHeight) - 1) / this.mcuHeight);
    this.say((((((("  MCU size: " + (this.mcuWidth.toString())) + "x") + (this.mcuHeight.toString())) + ", grid: ") + (this.mcusPerRow.toString())) + "x") + (this.mcusPerCol.toString()));
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
      this.say(((("  Quantization table " + (tableId.toString())) + " (") + ((precision_1 + 1).toString())) + "-byte values)");
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let i = 0;
    while (i < numScanComponents) {
      const compId = this.data._view.getUint8(pos);
      const tableSelect = this.data._view.getUint8(pos + 1);
      pos = pos + 2;
      let j = 0;
      while (j < this.numComponents) {
        const comp = this.components[j];
        if ( comp.id == compId ) {
          comp.dcTableId = (tableSelect >> 4);
          comp.acTableId = (tableSelect & 15);
          this.say((((("    Component " + (compId.toString())) + ": DC table ") + (comp.dcTableId.toString())) + ", AC table ") + (comp.acTableId.toString()));
        }
        j = j + 1;
      };
      i = i + 1;
    };
    pos = pos + 3;
    this.scanDataStart = pos;
    let searchPos = pos;
    while (searchPos < this.dataLen - 1) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8(searchPos + 1);
        if ( nextB != 0 && nextB != 255 ) {
          if ( nextB >= 208 && nextB <= 215 ) {
            searchPos = searchPos + 2;
            continue;
          }
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
      this.say("Error: File too small");
      return false;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( m1 != 255 || m2 != 216 ) {
      this.say("Error: Not a JPEG file (missing SOI)");
      return false;
    }
    pos = 2;
    this.say("Parsing JPEG markers...");
    while (pos < this.dataLen - 1) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8(pos + 1);
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
        this.say("  End of Image");
        return true;
      }
      if ( marker2 >= 208 && marker2 <= 215 ) {
        pos = pos + 2;
        continue;
      }
      if ( pos + 4 > this.dataLen ) {
        return true;
      }
      const markerLen = this.readUint16BE((pos + 2));
      const dataStart = pos + 4;
      const markerDataLen = markerLen - 2;
      if ( marker2 == 192 ) {
        this.say("  SOF0 (Baseline DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 193 ) {
        this.say("  SOF1 (Extended Sequential DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 194 ) {
        this.say("  SOF2 (Progressive DCT) - NOT SUPPORTED");
        return false;
      }
      if ( marker2 == 196 ) {
        this.say("  DHT (Huffman Tables)");
        this.huffman.parseDHT(this.data, dataStart, markerDataLen);
      }
      if ( marker2 == 219 ) {
        this.say("  DQT (Quantization Tables)");
        this.parseDQT(dataStart, markerDataLen);
      }
      if ( marker2 == 221 ) {
        this.restartInterval = this.readUint16BE(dataStart);
        this.say(("  DRI (Restart Interval: " + (this.restartInterval.toString())) + ")");
      }
      if ( marker2 == 218 ) {
        this.say("  SOS (Start of Scan)");
        this.parseSOS(dataStart, markerDataLen);
        pos = this.scanDataStart + this.scanDataLen;
        continue;
      }
      if ( marker2 == 224 ) {
        this.say("  APP0 (JFIF)");
      }
      if ( marker2 == 225 ) {
        this.say("  APP1 (EXIF)");
      }
      if ( marker2 == 254 ) {
        this.say("  COM (Comment)");
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  };
  decodeBlock (reader, comp, quantTable) {
    let coeffs = new Int32Array(64);
    coeffs.fill(0, 0, 64);
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
    return coeffs;
  };
  decode (dirPath, fileName) {
    const bytes = (function(){ var b = require('fs').readFileSync( require('path').join(dirPath, fileName) ); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    return this.decodeBytes(bytes);
  };
  decodeBytes (bytes) {
    this.reset();
    this.huffman.quiet = this.quiet;
    this.data = bytes;
    this.dataLen = this.data.byteLength;
    this.say(("Decoding JPEG in-memory (" + (this.dataLen.toString())) + " bytes)");
    const ok = this.parseMarkers();
    if ( ok == false ) {
      this.say("Error parsing JPEG markers");
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( this.width == 0 || this.height == 0 ) {
      this.say("Error: Invalid image dimensions");
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    this.say(("Decoding " + (this.scanDataLen.toString())) + " bytes of scan data...");
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
    let yBlocksData = [];
    let yBlockCount = 0;
    let cbBlock = [];
    let crBlock = [];
    let mcuCount = 0;
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        if ( (this.restartInterval > 0 && mcuCount > 0) && mcuCount % this.restartInterval == 0 ) {
          c = 0;
          while (c < this.numComponents) {
            const compRst = this.components[c];
            compRst.prevDC = 0;
            c = c + 1;
          };
          reader.alignToByte();
          reader.skipRestartMarker();
        }
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
              const coeffs = this.decodeBlock(reader, comp_1, quantTable);
              let blockPixels = new Int32Array(64);
              blockPixels.fill(0, 0, 64);
              const tempBlock = this.idct.dezigzag(coeffs);
              this.idct.transform(tempBlock, blockPixels);
              if ( compIdx == 0 ) {
                let bi = 0;
                while (bi < 64) {
                  yBlocksData.push(blockPixels[bi]);
                  bi = bi + 1;
                };
                yBlockCount = yBlockCount + 1;
              }
              if ( compIdx == 1 ) {
                cbBlock.length = 0;
                let bi_1 = 0;
                while (bi_1 < 64) {
                  cbBlock.push(blockPixels[bi_1]);
                  bi_1 = bi_1 + 1;
                };
              }
              if ( compIdx == 2 ) {
                crBlock.length = 0;
                let bi_2 = 0;
                while (bi_2 < 64) {
                  crBlock.push(blockPixels[bi_2]);
                  bi_2 = bi_2 + 1;
                };
              }
              blockH = blockH + 1;
            };
            blockV = blockV + 1;
          };
          compIdx = compIdx + 1;
        };
        this.writeMCU(
          img,
          mcuX,
          mcuY,
          yBlocksData,
          yBlockCount,
          cbBlock,
          crBlock
        );
        mcuX = mcuX + 1;
        mcuCount = mcuCount + 1;
      };
      mcuY = mcuY + 1;
      if ( mcuY % 10 == 0 ) {
        this.say((("  Row " + (mcuY.toString())) + "/") + (this.mcusPerCol.toString()));
      }
    };
    this.say("Decode complete!");
    return img;
  };
  writeMCU (img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock) {
    const baseX = mcuX * this.mcuWidth;
    const baseY = mcuY * this.mcuHeight;
    const comp0 = this.components[0];
    if ( this.maxHSamp == 1 && this.maxVSamp == 1 ) {
      let py = 0;
      while (py < 8) {
        let px = 0;
        while (px < 8) {
          const imgX = baseX + px;
          const imgY = baseY + py;
          if ( imgX < this.width && imgY < this.height ) {
            const idx = py * 8 + px;
            const y = yBlocksData[idx];
            let cb = 128;
            let cr = 128;
            if ( this.numComponents >= 3 ) {
              cb = cbBlock[idx];
              cr = crBlock[idx];
            }
            let r = y + ((359 * (cr - 128)) >> 8);
            let g = (y - ((88 * (cb - 128)) >> 8)) - ((183 * (cr - 128)) >> 8);
            let b = y + ((454 * (cb - 128)) >> 8);
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
    if ( this.maxHSamp == 2 && this.maxVSamp == 2 ) {
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
              const imgX_1 = (baseX + blockX * 8) + px_1;
              const imgY_1 = (baseY + blockY * 8) + py_1;
              if ( imgX_1 < this.width && imgY_1 < this.height ) {
                const yIdx = (yBlockOffset + py_1 * 8) + px_1;
                const y_1 = yBlocksData[yIdx];
                const chromaX = blockX * 4 + (px_1 >> 1);
                const chromaY = blockY * 4 + (py_1 >> 1);
                const chromaIdx = chromaY * 8 + chromaX;
                let cb_1 = 128;
                let cr_1 = 128;
                if ( this.numComponents >= 3 ) {
                  cb_1 = cbBlock[chromaIdx];
                  cr_1 = crBlock[chromaIdx];
                }
                let r_1 = y_1 + ((359 * (cr_1 - 128)) >> 8);
                let g_1 = (y_1 - ((88 * (cb_1 - 128)) >> 8)) - ((183 * (cr_1 - 128)) >> 8);
                let b_1 = y_1 + ((454 * (cb_1 - 128)) >> 8);
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
    if ( this.maxHSamp == 2 && this.maxVSamp == 1 ) {
      let blockX_1 = 0;
      while (blockX_1 < 2) {
        const yBlockOffset_1 = blockX_1 * 64;
        let py_2 = 0;
        while (py_2 < 8) {
          let px_2 = 0;
          while (px_2 < 8) {
            const imgX_2 = (baseX + blockX_1 * 8) + px_2;
            const imgY_2 = baseY + py_2;
            if ( imgX_2 < this.width && imgY_2 < this.height ) {
              const yIdx_1 = (yBlockOffset_1 + py_2 * 8) + px_2;
              const y_2 = yBlocksData[yIdx_1];
              const chromaX_1 = blockX_1 * 4 + (px_2 >> 1);
              const chromaY_1 = py_2;
              const chromaIdx_1 = chromaY_1 * 8 + chromaX_1;
              let cb_2 = 128;
              let cr_2 = 128;
              if ( this.numComponents >= 3 ) {
                cb_2 = cbBlock[chromaIdx_1];
                cr_2 = crBlock[chromaIdx_1];
              }
              let r_2 = y_2 + ((359 * (cr_2 - 128)) >> 8);
              let g_2 = (y_2 - ((88 * (cb_2 - 128)) >> 8)) - ((183 * (cr_2 - 128)) >> 8);
              let b_2 = y_2 + ((454 * (cb_2 - 128)) >> 8);
              if ( r_2 < 0 ) {
                r_2 = 0;
              }
              if ( r_2 > 255 ) {
                r_2 = 255;
              }
              if ( g_2 < 0 ) {
                g_2 = 0;
              }
              if ( g_2 > 255 ) {
                g_2 = 255;
              }
              if ( b_2 < 0 ) {
                b_2 = 0;
              }
              if ( b_2 > 255 ) {
                b_2 = 255;
              }
              img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
            }
            px_2 = px_2 + 1;
          };
          py_2 = py_2 + 1;
        };
        blockX_1 = blockX_1 + 1;
      };
      return;
    }
    if ( yBlockCount > 0 ) {
      let py_3 = 0;
      while (py_3 < 8) {
        let px_3 = 0;
        while (px_3 < 8) {
          const imgX_3 = baseX + px_3;
          const imgY_3 = baseY + py_3;
          if ( imgX_3 < this.width && imgY_3 < this.height ) {
            const y_3 = yBlocksData[(py_3 * 8 + px_3)];
            img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
          }
          px_3 = px_3 + 1;
        };
        py_3 = py_3 + 1;
      };
    }
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
    const offset = blockIdx * 64 + k;
    return this.coeffs[offset];
  };
  setVal (blockIdx, k, value) {
    const offset = blockIdx * 64 + k;
    this.coeffs[offset] = value;
  };
}
class ProgressiveJPEGDecoder  {
  constructor() {
    this.quiet = false;
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.isProgressive = false;
    this.components = [];
    this.quantTables = [];
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
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
    let i_4 = 0;
    while (i_4 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_4 = i_4 + 1;
    };
  }
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8(pos + 1);
    return high * 256 + low;
  };
  parseSOF (pos, length, sofType) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8(pos + 5);
    if ( sofType == 2 ) {
      this.isProgressive = true;
      if ( this.quiet == false ) {
        console.log(((((("  Progressive JPEG: " + (this.width.toString())) + "x") + (this.height.toString())) + ", ") + (this.numComponents.toString())) + " components");
      }
    } else {
      this.isProgressive = false;
      if ( this.quiet == false ) {
        console.log(((((("  Baseline JPEG: " + (this.width.toString())) + "x") + (this.height.toString())) + ", ") + (this.numComponents.toString())) + " components");
      }
    }
    this.components.length = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    let i = 0;
    let offset = pos + 6;
    while (i < this.numComponents) {
      const comp = new JPEGComponent();
      comp.id = this.data._view.getUint8(offset);
      const sampling = this.data._view.getUint8(offset + 1);
      comp.hSamp = (sampling >> 4);
      comp.vSamp = (sampling & 15);
      comp.quantTableId = this.data._view.getUint8(offset + 2);
      if ( comp.hSamp > this.maxHSamp ) {
        this.maxHSamp = comp.hSamp;
      }
      if ( comp.vSamp > this.maxVSamp ) {
        this.maxVSamp = comp.vSamp;
      }
      this.components.push(comp);
      if ( this.quiet == false ) {
        console.log(((((("    Component " + (comp.id.toString())) + ": ") + (comp.hSamp.toString())) + "x") + (comp.vSamp.toString())) + " sampling");
      }
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( ((this.width + this.mcuWidth) - 1) / this.mcuWidth);
    this.mcusPerCol = Math.floor( ((this.height + this.mcuHeight) - 1) / this.mcuHeight);
    if ( this.quiet == false ) {
      console.log((("  MCU grid: " + (this.mcusPerRow.toString())) + "x") + (this.mcusPerCol.toString()));
    }
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
      if ( this.quiet == false ) {
        console.log("  Quantization table " + (tableId.toString()));
      }
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let scanComponents = [];
    let i = 0;
    while (i < numScanComponents) {
      const compId = this.data._view.getUint8(pos);
      const tableSelect = this.data._view.getUint8(pos + 1);
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
    this.scanSe = this.data._view.getUint8(pos + 1);
    const approx = this.data._view.getUint8(pos + 2);
    this.scanAh = (approx >> 4);
    this.scanAl = (approx & 15);
    pos = pos + 3;
    let scanType = "data";
    if ( this.scanSs == 0 && this.scanSe == 0 ) {
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
    while (si < scanComponents.length) {
      if ( si > 0 ) {
        compList = compList + ",";
      }
      compList = compList + (scanComponents[si].toString());
      si = si + 1;
    };
    if ( this.quiet == false ) {
      console.log(((((((((((("    Scan: comps=[" + compList) + "] Ss=") + (this.scanSs.toString())) + " Se=") + (this.scanSe.toString())) + " Ah=") + (this.scanAh.toString())) + " Al=") + (this.scanAl.toString())) + " (") + scanType) + ")");
    }
    const scanStart = pos;
    let searchPos = pos;
    while (searchPos < this.dataLen - 1) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8(searchPos + 1);
        if ( nextB != 0 && nextB != 255 ) {
          if ( nextB >= 208 && nextB <= 215 ) {
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
    if ( this.scanSs == 0 && this.scanAh == 0 ) {
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
    const isDCFirst = (this.scanSs == 0 && this.scanSe == 0) && this.scanAh == 0;
    const isDCRefine = (this.scanSs == 0 && this.scanSe == 0) && this.scanAh > 0;
    const isACFirst = this.scanSs > 0 && this.scanAh == 0;
    const isACRefine = this.scanSs > 0 && this.scanAh > 0;
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
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
              const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
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
                const oldVal = buf.get(blockIdx, 0);
                buf.setVal(blockIdx, 0, (oldVal | (bit << this.scanAl)));
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
            const bit = reader.readBit();
            const oldVal = buf.get(blockIdx, 0);
            buf.setVal(blockIdx, 0, (oldVal | (bit << this.scanAl)));
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
        let bv = 0;
        while (bv < comp.vSamp) {
          let bh = 0;
          while (bh < comp.hSamp) {
            const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
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
        const oldVal = buf.get(blockIdx, k);
        if ( oldVal != 0 ) {
          const bit = reader.readBit();
          if ( bit != 0 ) {
            if ( oldVal > 0 ) {
              buf.setVal(blockIdx, k, (oldVal | (1 << this.scanAl)));
            } else {
              buf.setVal(blockIdx, k, oldVal - (1 << this.scanAl));
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
          while (zerosToSkip > 0 && k <= this.scanSe) {
            const oldVal_1 = buf.get(blockIdx, k);
            if ( oldVal_1 != 0 ) {
              const bit_1 = reader.readBit();
              if ( bit_1 != 0 ) {
                if ( oldVal_1 > 0 ) {
                  buf.setVal(blockIdx, k, (oldVal_1 | (1 << this.scanAl)));
                } else {
                  buf.setVal(blockIdx, k, oldVal_1 - (1 << this.scanAl));
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
            const oldVal_2 = buf.get(blockIdx, k);
            if ( oldVal_2 != 0 ) {
              const bit_2 = reader.readBit();
              if ( bit_2 != 0 ) {
                if ( oldVal_2 > 0 ) {
                  buf.setVal(blockIdx, k, (oldVal_2 | (1 << this.scanAl)));
                } else {
                  buf.setVal(blockIdx, k, oldVal_2 - (1 << this.scanAl));
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
          const oldVal_3 = buf.get(blockIdx, k);
          if ( oldVal_3 != 0 ) {
            const bit_3 = reader.readBit();
            if ( bit_3 != 0 ) {
              if ( oldVal_3 > 0 ) {
                buf.setVal(blockIdx, k, (oldVal_3 | (1 << this.scanAl)));
              } else {
                buf.setVal(blockIdx, k, oldVal_3 - (1 << this.scanAl));
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
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
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
              const blockIdx = ((mcuIdx * comp.hSamp) * comp.vSamp + bv * comp.hSamp) + bh;
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
      if ( this.quiet == false ) {
        console.log("Error: File too small");
      }
      return false;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( m1 != 255 || m2 != 216 ) {
      if ( this.quiet == false ) {
        console.log("Error: Not a JPEG file");
      }
      return false;
    }
    pos = 2;
    if ( this.quiet == false ) {
      console.log("Parsing JPEG markers...");
    }
    while (pos < this.dataLen - 1) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8(pos + 1);
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
        if ( this.quiet == false ) {
          console.log("  End of Image");
        }
        return true;
      }
      if ( marker2 >= 208 && marker2 <= 215 ) {
        pos = pos + 2;
        continue;
      }
      if ( pos + 4 > this.dataLen ) {
        return true;
      }
      const markerLen = this.readUint16BE((pos + 2));
      const dataStart = pos + 4;
      const markerDataLen = markerLen - 2;
      if ( marker2 == 192 ) {
        if ( this.quiet == false ) {
          console.log("  SOF0 (Baseline DCT)");
        }
        this.parseSOF(dataStart, markerDataLen, 0);
      }
      if ( marker2 == 193 ) {
        if ( this.quiet == false ) {
          console.log("  SOF1 (Extended Sequential)");
        }
        this.parseSOF(dataStart, markerDataLen, 1);
      }
      if ( marker2 == 194 ) {
        if ( this.quiet == false ) {
          console.log("  SOF2 (Progressive DCT)");
        }
        this.parseSOF(dataStart, markerDataLen, 2);
      }
      if ( marker2 == 196 ) {
        if ( this.quiet == false ) {
          console.log("  DHT (Huffman Tables)");
        }
        this.huffman.parseDHT(this.data, dataStart, markerDataLen);
      }
      if ( marker2 == 219 ) {
        if ( this.quiet == false ) {
          console.log("  DQT (Quantization Tables)");
        }
        this.parseDQT(dataStart, markerDataLen);
      }
      if ( marker2 == 218 ) {
        if ( this.quiet == false ) {
          console.log("  SOS (Start of Scan)");
        }
        const nextPos = this.parseSOS(dataStart, markerDataLen);
        pos = nextPos;
        continue;
      }
      if ( marker2 == 224 ) {
        if ( this.quiet == false ) {
          console.log("  APP0 (JFIF)");
        }
      }
      if ( marker2 == 225 ) {
        if ( this.quiet == false ) {
          console.log("  APP1 (EXIF)");
        }
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
          const oldVal = buf.get(blockIdx, k);
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
      if ( this.quiet == false ) {
        console.log("Dequantizing coefficients...");
      }
      this.dequantizeCoefficients();
    }
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    if ( this.quiet == false ) {
      console.log("Building image...");
    }
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        const mcuIdx = mcuY * this.mcusPerRow + mcuX;
        const baseX = mcuX * this.mcuWidth;
        const baseY = mcuY * this.mcuHeight;
        const comp0 = this.components[0];
        const yBuf = this.coeffBuffers[0];
        let yBlocksData = [];
        let bv = 0;
        while (bv < comp0.vSamp) {
          let bh = 0;
          while (bh < comp0.hSamp) {
            const blockIdx = ((mcuIdx * comp0.hSamp) * comp0.vSamp + bv * comp0.hSamp) + bh;
            let blockCoeffs = new Int32Array(64);
            let k = 0;
            while (k < 64) {
              blockCoeffs[k] = yBuf.get(blockIdx, k);
              k = k + 1;
            };
            const tempBlock = this.idct.dezigzag(blockCoeffs);
            let blockPixels = new Int32Array(64);
            blockPixels.fill(0, 0, 64);
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
          let blockCoeffs_1 = new Int32Array(64);
          let k_1 = 0;
          while (k_1 < 64) {
            blockCoeffs_1[k_1] = cbBuf.get(cbBlockIdx, k_1);
            k_1 = k_1 + 1;
          };
          const tempBlock_1 = this.idct.dezigzag(blockCoeffs_1);
          let cbPixels = new Int32Array(64);
          cbPixels.fill(0, 0, 64);
          this.idct.transform(tempBlock_1, cbPixels);
          k_1 = 0;
          while (k_1 < 64) {
            cbBlock.push(cbPixels[k_1]);
            k_1 = k_1 + 1;
          };
          const crBuf = this.coeffBuffers[2];
          const crBlockIdx = mcuIdx;
          let crCoeffs = new Int32Array(64);
          k_1 = 0;
          while (k_1 < 64) {
            crCoeffs[k_1] = crBuf.get(crBlockIdx, k_1);
            k_1 = k_1 + 1;
          };
          const crTempBlock = this.idct.dezigzag(crCoeffs);
          let crPixels = new Int32Array(64);
          crPixels.fill(0, 0, 64);
          this.idct.transform(crTempBlock, crPixels);
          k_1 = 0;
          while (k_1 < 64) {
            crBlock.push(crPixels[k_1]);
            k_1 = k_1 + 1;
          };
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
    if ( this.maxHSamp == 1 && this.maxVSamp == 1 ) {
      let py = 0;
      while (py < 8) {
        let px = 0;
        while (px < 8) {
          const imgX = baseX + px;
          const imgY = baseY + py;
          if ( imgX < this.width && imgY < this.height ) {
            const idx = py * 8 + px;
            const y = yBlocksData[idx];
            let cb = 128;
            let cr = 128;
            if ( this.numComponents >= 3 ) {
              cb = cbBlock[idx];
              cr = crBlock[idx];
            }
            let r = y + ((359 * (cr - 128)) >> 8);
            let g = (y - ((88 * (cb - 128)) >> 8)) - ((183 * (cr - 128)) >> 8);
            let b = y + ((454 * (cb - 128)) >> 8);
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
    if ( this.maxHSamp == 2 && this.maxVSamp == 2 ) {
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
              const imgX_1 = (baseX + blockX * 8) + px_1;
              const imgY_1 = (baseY + blockY * 8) + py_1;
              if ( imgX_1 < this.width && imgY_1 < this.height ) {
                const yIdx = (yBlockOffset + py_1 * 8) + px_1;
                const y_1 = yBlocksData[yIdx];
                const chromaX = blockX * 4 + (px_1 >> 1);
                const chromaY = blockY * 4 + (py_1 >> 1);
                const chromaIdx = chromaY * 8 + chromaX;
                let cb_1 = 128;
                let cr_1 = 128;
                if ( this.numComponents >= 3 ) {
                  cb_1 = cbBlock[chromaIdx];
                  cr_1 = crBlock[chromaIdx];
                }
                let r_1 = y_1 + ((359 * (cr_1 - 128)) >> 8);
                let g_1 = (y_1 - ((88 * (cb_1 - 128)) >> 8)) - ((183 * (cr_1 - 128)) >> 8);
                let b_1 = y_1 + ((454 * (cb_1 - 128)) >> 8);
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
          if ( imgX_2 < this.width && imgY_2 < this.height ) {
            const y_2 = yBlocksData[(py_2 * 8 + px_2)];
            img.setPixelRGB(imgX_2, imgY_2, y_2, y_2, y_2);
          }
          px_2 = px_2 + 1;
        };
        py_2 = py_2 + 1;
      };
    }
  };
  decode (dirPath, fileName) {
    const bytes = (function(){ var b = require('fs').readFileSync( require('path').join(dirPath, fileName) ); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( this.quiet == false ) {
      console.log(((("Decoding JPEG: " + fileName) + " (") + (bytes.byteLength.toString())) + " bytes)");
    }
    return this.decodeBytes(bytes);
  };
  decodeBytes (bytes) {
    this.data = bytes;
    this.dataLen = this.data.byteLength;
    const ok = this.parseMarkers();
    if ( ok == false ) {
      if ( this.quiet == false ) {
        console.log("Error parsing JPEG markers");
      }
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( this.width == 0 || this.height == 0 ) {
      if ( this.quiet == false ) {
        console.log("Error: Invalid image dimensions");
      }
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    const img = this.buildImage();
    if ( this.quiet == false ) {
      console.log("Decode complete!");
    }
    return img;
  };
}
class ErazerCli  {
  constructor() {
  }
  decodeImage (bytes, dir, file) {
    const n = bytes.byteLength;
    const fail = new ImageBuffer();
    fail.init(1, 1);
    if ( n < 4 ) {
      return fail;
    }
    const b0 = bytes._view.getUint8(0);
    const b1 = bytes._view.getUint8(1);
    if ( b0 == 137 && b1 == 80 ) {
      const png = new PNGDecoder();
      return png.decodeBytes(bytes);
    }
    if ( b0 == 255 && b1 == 216 ) {
      if ( ErazerCli.isProgressiveJpeg(bytes) ) {
        const prog = new ProgressiveJPEGDecoder();
        return prog.decode(dir, file);
      }
      const jpg = new JPEGDecoder();
      jpg.quiet = true;
      return jpg.decodeBytes(bytes);
    }
    return fail;
  };
  printUsage () {
    console.log("erazer — bitmap UI screenshot to EVG layout");
    console.log("");
    console.log("  erazer <input.png|.jpg> <output.evg.json> [options]");
    console.log("");
    console.log("  --overlay <path>     write a labelled SVG of the detected boxes");
    console.log("  --outline            print the widget tree");
    console.log("  --ocr true|false     read 5×7 atlas characters (default true)");
    console.log("  --vectorizeIcons     trace icons with EvgBitmapTracer (default true)");
    console.log("  --colorTol <n>       per-channel join tolerance (default 20)");
    console.log("  --surfaceTol <n>     tolerance for regions grown from a flat seed (default 8)");
    console.log("  --surfaceDrift <n>   how far a surface may drift over a gradient (default 96, 0 = off)");
    console.log("  --scale <n>          analyse at 1/n size (default 0 = auto for 3x phone shots)");
    console.log("  --words <file.tsv>   words from an outside OCR: tesseract in.png out tsv");
    console.log("  --wordMinConf <n>    ignore words below this confidence (default 55)");
  };
  async applyOption (o, name, value) {
    if ( name == "ocr" ) {
      o.ocr = ErazerCli.parseBool(value);
      return true;
    }
    if ( name == "vectorizeIcons" ) {
      o.vectorizeIcons = ErazerCli.parseBool(value);
      return true;
    }
    if ( name == "colorTol" ) {
      o.colorTol = ErazerCli.parseInt(value);
      return true;
    }
    if ( name == "words" ) {
      const dir = ErazerCli.dirOf(value);
      const file = ErazerCli.fileOf(value);
      if ( require("fs").existsSync( require("path").join(dir, file) ) == false ) {
        console.log("no such file: " + value);
        return false;
      }
      const txt = await (new Promise(resolve => { require('fs').readFile(
        require('path').join(dir, file),
        'utf8',
        (err,data)=>{ resolve(data) }
      ) } ));
      if ( typeof(txt) === "undefined" ) {
        return false;
      }
      const got = o.addTesseractTsv(txt);
      console.log((("  words=" + (got.toString())) + " from ") + value);
      return true;
    }
    if ( name == "wordMinConf" ) {
      o.wordMinConf = ErazerCli.parseInt(value);
      return true;
    }
    if ( name == "scale" ) {
      o.scale = ErazerCli.parseInt(value);
      return true;
    }
    if ( name == "surfaceDrift" ) {
      o.surfaceDrift = ErazerCli.parseInt(value);
      return true;
    }
    if ( name == "surfaceTol" ) {
      o.surfaceTol = ErazerCli.parseInt(value);
      return true;
    }
    if ( name == "minArea" ) {
      o.minArea = ErazerCli.parseInt(value);
      return true;
    }
    return false;
  };
  async run () {
    const argCount = (process.argv.length - 2);
    if ( argCount < 1 ) {
      this.printUsage();
      return;
    }
    const options = ErazerOptions.defaults();
    let positional = [];
    let overlayPath = "";
    let wantOutline = false;
    let wantHelp = false;
    let bad = false;
    let i = 0;
    while (i < argCount) {
      const arg = process.argv[ 2 + i];
      if ( arg == "-h" || arg == "--help" ) {
        wantHelp = true;
      } else {
        if ( arg.indexOf("--") == 0 ) {
          const body = arg.substring(2, arg.length );
          let name = body;
          let value = "";
          let haveValue = false;
          const eq = body.indexOf("=");
          if ( eq >= 0 ) {
            name = body.substring(0, eq );
            value = body.substring(eq + 1, body.length );
            haveValue = true;
          }
          if ( name == "outline" ) {
            wantOutline = true;
          } else {
            const isFlag = ErazerCli.isSwitch(name);
            if ( haveValue == false ) {
              if ( i + 1 < argCount ) {
                const peek = process.argv[ 2 + (i + 1)];
                const peekIsOption = peek.indexOf("--") == 0;
                let take = false;
                if ( peekIsOption == false ) {
                  take = true;
                  if ( isFlag ) {
                    take = ErazerCli.looksBoolean(peek);
                  }
                }
                if ( take ) {
                  value = peek;
                  haveValue = true;
                  i = i + 1;
                }
              }
            }
            if ( haveValue == false && isFlag ) {
              value = "true";
              haveValue = true;
            }
            if ( name == "overlay" ) {
              if ( haveValue ) {
                overlayPath = value;
              } else {
                console.log("--overlay needs a path");
                bad = true;
              }
            } else {
              if ( haveValue ) {
                const ok = await this.applyOption(options, name, value);
                if ( ok == false ) {
                  console.log("unknown option --" + name);
                  bad = true;
                }
              } else {
                console.log(("--" + name) + " needs a value");
                bad = true;
              }
            }
          }
        } else {
          positional.push(arg);
        }
      }
      i = i + 1;
    };
    if ( wantHelp ) {
      this.printUsage();
      return;
    }
    const pn = positional.length;
    if ( pn != 2 ) {
      if ( bad == false ) {
        console.log("an input path and an output path are both needed");
      }
      bad = true;
    }
    if ( bad ) {
      console.log("");
      this.printUsage();
      return;
    }
    const inputPath = positional[0];
    const outputPath = positional[1];
    const inDir = ErazerCli.dirOf(inputPath);
    const inFile = ErazerCli.fileOf(inputPath);
    if ( require("fs").existsSync( require("path").join(inDir, inFile) ) == false ) {
      console.log("no such file: " + inputPath);
      return;
    }
    const bytes = (function(){ var b = require('fs').readFileSync( require('path').join(inDir, inFile) ); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( bytes.byteLength == 0 ) {
      console.log("cannot read " + inputPath);
      return;
    }
    const image = this.decodeImage(bytes, inDir, inFile);
    if ( image.width < 2 && image.height < 2 ) {
      console.log("not a PNG or JPEG this build can decode: " + inputPath);
      return;
    }
    const doc = Erazer.fromImageBuffer(image, options);
    const outDir = ErazerCli.dirOf(outputPath);
    const outFile = ErazerCli.fileOf(outputPath);
    require("fs").writeFileSync( outDir + "/"  + outFile, doc.json);
    if ( overlayPath.length > 0 ) {
      const ovDir = ErazerCli.dirOf(overlayPath);
      const ovFile = ErazerCli.fileOf(overlayPath);
      require("fs").writeFileSync( ovDir + "/"  + ovFile, doc.overlaySvg);
    }
    console.log((((outputPath + "  ") + (doc.width.toString())) + "x") + (doc.height.toString()));
    console.log((((("  buttons=" + (doc.root.roleCount("button").toString())) + " fields=") + (doc.root.roleCount("textfield").toString())) + " icons=") + (doc.root.roleCount("icon").toString()));
    if ( wantOutline ) {
      console.log(doc.outline);
    }
  };
}
ErazerCli.lastSepOf = function(path) {
  const n = path.length;
  let i = n - 1;
  while (i >= 0) {
    const ch = path.substring(i, i + 1 );
    if ( ch == "/" || ch == "\\" ) {
      return i;
    }
    i = i - 1;
  };
  return 0 - 1;
};
ErazerCli.dirOf = function(path) {
  const sep = ErazerCli.lastSepOf(path);
  if ( sep < 0 ) {
    return ".";
  }
  return path.substring(0, sep );
};
ErazerCli.fileOf = function(path) {
  const sep = ErazerCli.lastSepOf(path);
  if ( sep < 0 ) {
    return path;
  }
  return path.substring(sep + 1, path.length );
};
ErazerCli.digitOf = function(ch) {
  return "0123456789".indexOf(ch);
};
ErazerCli.parseInt = function(s) {
  const n = s.length;
  let i = 0;
  let v = 0;
  while (i < n) {
    const d = ErazerCli.digitOf(s.substring(i, i + 1 ));
    if ( d < 0 ) {
      i = n;
    } else {
      v = v * 10 + d;
      i = i + 1;
    }
  };
  return v;
};
ErazerCli.parseBool = function(s) {
  if ( s == "0" ) {
    return false;
  }
  if ( s == "false" ) {
    return false;
  }
  if ( s == "no" ) {
    return false;
  }
  if ( s == "off" ) {
    return false;
  }
  return true;
};
ErazerCli.looksBoolean = function(s) {
  return ("|0|1|true|false|yes|no|on|off|".indexOf(("|" + s) + "|")) >= 0;
};
ErazerCli.isSwitch = function(name) {
  if ( name == "ocr" ) {
    return true;
  }
  if ( name == "vectorizeIcons" ) {
    return true;
  }
  return false;
};
ErazerCli.isProgressiveJpeg = function(bytes) {
  const n = bytes.byteLength;
  let i = 0;
  while (i < n - 1) {
    const b = bytes._view.getUint8(i);
    if ( b == 255 ) {
      const marker = bytes._view.getUint8(i + 1);
      if ( marker == 194 ) {
        return true;
      }
      if ( marker == 192 ) {
        return false;
      }
      if ( marker == 193 ) {
        return false;
      }
    }
    i = i + 1;
  };
  return false;
};
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const cli = new ErazerCli();
  await cli.run();
}
__js_main();
