#!/usr/bin/env node
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
    let p = [];
    this.pts = p;
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
    let d = [];
    this.data = d;
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
    const v = this.data[((y * this.w) + x)];
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
      this.data[(y * this.w) + x] = 1;
    } else {
      this.data[(y * this.w) + x] = 0;
    }
  };
  flip (x, y) {
    if ( (this).at(x, y) ) {
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
      if ( (this.data[i]) == 1 ) {
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
    const cl = ((0.4122214708 * lr) + (0.5363325363 * lg)) + (0.0514459929 * lb);
    const cm = ((0.2119034982 * lr) + (0.6806995451 * lg)) + (0.1073969566 * lb);
    const cs = ((0.0883024619 * lr) + (0.2817188376 * lg)) + (0.6299787005 * lb);
    const l_ = EvgTraceColor.cbrt(cl);
    const m_ = EvgTraceColor.cbrt(cm);
    const s_ = EvgTraceColor.cbrt(cs);
    this.l = ((0.2104542553 * l_) + (0.793617785 * m_)) - (0.0040720468 * s_);
    this.a = ((1.9779984951 * l_) - (2.428592205 * m_)) + (0.4505937099 * s_);
    this.b = ((0.0259040371 * l_) + (0.7827717662 * m_)) - (0.808675766 * s_);
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
    y = ((2.0 * y) + q) / 3.0;
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
    const c = (i) / 255.0;
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
  const raw = ((dl * dl) + (da * da)) + (db * db);
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
    y = y - (num / den);
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
    enc = (1.055 * e) - 0.055;
  }
  const n = Math.floor( ((enc * 255.0) + 0.5));
  if ( n < 0 ) {
    return 0;
  }
  if ( n > 255 ) {
    return 255;
  }
  return n;
};
EvgTraceColor.srgbOf = function(l, a, b) {
  const l_ = (l + (0.3963377774 * a)) + (0.2158037573 * b);
  const m_ = (l - (0.1055613458 * a)) - (0.0638541728 * b);
  const s_ = (l - (0.0894841775 * a)) - (1.291485548 * b);
  const L = (l_ * l_) * l_;
  const M = (m_ * m_) * m_;
  const S = (s_ * s_) * s_;
  const lr = ((4.0767416621 * L) - (3.3077115913 * M)) + (0.2309699292 * S);
  const lg = (((0.0 - 1.2684380046) * L) + (2.6097574011 * M)) - (0.3413193965 * S);
  const lb = (((0.0 - 0.0041960863) * L) - (0.7034186147 * M)) + (1.707614701 * S);
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
    this.rx = 0.0;     /** note: unused */
    this.ry = 0.0;     /** note: unused */
    this.rotation = 0.0;
    this.largeArc = false;     /** note: unused */
    this.sweep = false;     /** note: unused */
  }
}
class PathRing  {
  constructor() {
    this.pts = [];
    let p_1 = [];
    this.pts = p_1;
  }
  pointCount () {
    return (((this.pts.length) / 2) | 0);
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
    this.lastCtrlX = 0.0;
    this.lastCtrlY = 0.0;
    this.lastCtrlKind = "";
    this.errors = [];
    this.truncated = false;
    this.numFail = false;
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
    return (this.errors.length) > 0;
  };
  errorSummary () {
    const n = this.errors.length;
    if ( n == 0 ) {
      return "";
    }
    let out = this.errors[0];
    let k = 1;
    while (k < n) {
      out = (out + "; ") + (this.errors[k]);
      k = k + 1;
    };
    return out;
  };
  addError (msg) {
    this.errors.push((msg + " at offset ") + ((this.i.toString())));
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
      if ( (chInt >= 65) && (chInt <= 90) ) {
        isLetter = true;
      }
      if ( (chInt >= 97) && (chInt <= 122) ) {
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
    if ( (chInt >= 48) && (chInt <= 57) ) {
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
      if ( ((((chInt == 32) || (chInt == 9)) || (chInt == 10)) || (chInt == 13)) || (chInt == 44) ) {
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
    if ( (chInt == 45) || (chInt == 43) ) {
      this.i = this.i + 1;
    }
    while (this.i < this.__len) {
      const ch2 = this.pathData.charCodeAt(this.i );
      const chInt2 = ch2;
      if ( (chInt2 >= 48) && (chInt2 <= 57) ) {
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
          if ( (chInt4 >= 48) && (chInt4 <= 57) ) {
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
      if ( (chInt5 == 101) || (chInt5 == 69) ) {
        this.i = this.i + 1;
        if ( this.i < this.__len ) {
          const ch6 = this.pathData.charCodeAt(this.i );
          const chInt6 = ch6;
          if ( (chInt6 == 45) || (chInt6 == 43) ) {
            this.i = this.i + 1;
          }
        }
        while (this.i < this.__len) {
          const ch7 = this.pathData.charCodeAt(this.i );
          const chInt7 = ch7;
          if ( (chInt7 >= 48) && (chInt7 <= 57) ) {
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
    if ( (cmdInt == 77) || (cmdInt == 109) ) {
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
    if ( (cmdInt == 76) || (cmdInt == 108) ) {
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
    if ( (cmdInt == 72) || (cmdInt == 104) ) {
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
    if ( (cmdInt == 86) || (cmdInt == 118) ) {
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
    if ( (cmdInt == 67) || (cmdInt == 99) ) {
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
    if ( (cmdInt == 83) || (cmdInt == 115) ) {
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
        x1_1 = (2.0 * this.currentX) - this.lastCtrlX;
        y1_1 = (2.0 * this.currentY) - this.lastCtrlY;
      }
      this.emitCubic(x1_1, y1_1, x2_1, y2_1, x_4, y_4);
      return true;
    }
    if ( (cmdInt == 81) || (cmdInt == 113) ) {
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
    if ( (cmdInt == 84) || (cmdInt == 116) ) {
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
        x1_3 = (2.0 * this.currentX) - this.lastCtrlX;
        y1_3 = (2.0 * this.currentY) - this.lastCtrlY;
      }
      this.emitQuad(x1_3, y1_3, x_6, y_6);
      return true;
    }
    if ( (cmdInt == 65) || (cmdInt == 97) ) {
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
    if ( (cmdInt == 90) || (cmdInt == 122) ) {
      const pathCmd_1 = new PathCommand();
      pathCmd_1.type = "Z";
      this.commands.push(pathCmd_1);
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.lastCtrlKind = "";
      return true;
    }
    this.addError(("unsupported path command '" + (String.fromCharCode(cmdInt))) + "'");
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
    const d = Math.sqrt(((dx * dx) + (dy * dy)));
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
    const x1p = ((cosrot * dx) / 2.0) + ((sinrot * dy) / 2.0);
    const y1p = (((0.0 - sinrot) * dx) / 2.0) + ((cosrot * dy) / 2.0);
    const lambda = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
    if ( lambda > 1.0 ) {
      const k = Math.sqrt(lambda);
      rx = rx * k;
      ry = ry * k;
    }
    let sa = (((rx * rx) * (ry * ry)) - ((rx * rx) * (y1p * y1p))) - ((ry * ry) * (x1p * x1p));
    const sb = ((rx * rx) * (y1p * y1p)) + ((ry * ry) * (x1p * x1p));
    if ( sa < 0.0 ) {
      sa = 0.0;
    }
    let s = 0.0;
    if ( sb > 0.0 ) {
      s = Math.sqrt((sa / sb));
    }
    if ( largeArc == sweep ) {
      s = 0.0 - s;
    }
    const cxp = ((s * rx) * y1p) / ry;
    const cyp = (((0.0 - s) * ry) * x1p) / rx;
    const cx = ((x1 + x2) / 2.0) + ((cosrot * cxp) - (sinrot * cyp));
    const cy = ((y1 + y2) / 2.0) + ((sinrot * cxp) + (cosrot * cyp));
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = ((0.0 - x1p) - cxp) / rx;
    const vy = ((0.0 - y1p) - cyp) / ry;
    const a1 = this.vecAngle(1.0, 0.0, ux, uy);
    let da = this.vecAngle(ux, uy, vx, vy);
    if ( sweep == false ) {
      if ( da > 0.0 ) {
        da = da - (2.0 * PI);
      }
    } else {
      if ( da < 0.0 ) {
        da = (2.0 * PI) + da;
      }
    }
    const ndivs = Math.floor( (((Math.abs(da)) / (PI * 0.5)) + 1.0));
    const hda = (da / (ndivs)) / 2.0;
    let kappa = Math.abs((((4.0 / 3.0) * (1.0 - (Math.cos(hda)))) / (Math.sin(hda))));
    if ( da < 0.0 ) {
      kappa = 0.0 - kappa;
    }
    let px = 0.0;
    let py = 0.0;
    let ptanx = 0.0;
    let ptany = 0.0;
    let k_1 = 0;
    while (k_1 <= ndivs) {
      const a = a1 + ((da * (k_1)) / (ndivs));
      const cosa = Math.cos(a);
      const sina = Math.sin(a);
      const ex = ((cosrot * (cosa * rx)) - (sinrot * (sina * ry))) + cx;
      const ey = ((sinrot * (cosa * rx)) + (cosrot * (sina * ry))) + cy;
      const tvx = (0.0 - sina) * (rx * kappa);
      const tvy = cosa * (ry * kappa);
      const tanx = (cosrot * tvx) - (sinrot * tvy);
      const tany = (sinrot * tvx) + (cosrot * tvy);
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
    const magU = Math.sqrt(((ux * ux) + (uy * uy)));
    const magV = Math.sqrt(((vx * vx) + (vy * vy)));
    const denom = magU * magV;
    if ( denom < 1e-10 ) {
      return 0.0;
    }
    let r = ((ux * vx) + (uy * vy)) / denom;
    if ( r < (0.0 - 1.0) ) {
      r = 0.0 - 1.0;
    }
    if ( r > 1.0 ) {
      r = 1.0;
    }
    let sign = 1.0;
    if ( (ux * vy) < (uy * vx) ) {
      sign = 0.0 - 1.0;
    }
    return sign * (Math.acos(r));
  };
  calculateBounds () {
    if ( (this.commands.length) == 0 ) {
      return;
    }
    let minX = 999999.0;
    let minY = 999999.0;
    let maxX = -999999.0;
    let maxY = -999999.0;
    let i_1 = 0;
    while (i_1 < (this.commands.length)) {
      const cmd = this.commands[i_1];
      if ( (cmd.type == "M") || (cmd.type == "L") ) {
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
    while (i_1 < (this.commands.length)) {
      const cmd = this.commands[i_1];
      const newCmd = new PathCommand();
      newCmd.type = cmd.type;
      if ( (cmd.type == "M") || (cmd.type == "L") ) {
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
        current.pts.push((ma * cx) + ((mc * cy) + me));
        current.pts.push((mb * cx) + ((md * cy) + mf));
      }
      if ( cmd.type == "L" ) {
        cx = cmd.x;
        cy = cmd.y;
        current.pts.push((ma * cx) + ((mc * cy) + me));
        current.pts.push((mb * cx) + ((md * cy) + mf));
      }
      if ( cmd.type == "C" ) {
        let s = 1;
        while (s <= steps) {
          const tt = (s) / (steps);
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = (((b0 * cx) + (b1 * cmd.x1)) + (b2 * cmd.x2)) + (b3 * cmd.x);
          const py = (((b0 * cy) + (b1 * cmd.y1)) + (b2 * cmd.y2)) + (b3 * cmd.y);
          current.pts.push((ma * px) + ((mc * py) + me));
          current.pts.push((mb * px) + ((md * py) + mf));
          s = s + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Q" ) {
        let s_1 = 1;
        while (s_1 <= steps) {
          const tt_1 = (s_1) / (steps);
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = ((b0_1 * cx) + (b1_1 * cmd.x1)) + (b2_1 * cmd.x);
          const py_1 = ((b0_1 * cy) + (b1_1 * cmd.y1)) + (b2_1 * cmd.y);
          current.pts.push((ma * px_1) + ((mc * py_1) + me));
          current.pts.push((mb * px_1) + ((md * py_1) + mf));
          s_1 = s_1 + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Z" ) {
        if ( started ) {
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
    return this.flattenRings(steps, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
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
          const tt = (s) / (steps);
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = (((b0 * cx) + (b1 * cmd.x1)) + (b2 * cmd.x2)) + (b3 * cmd.x);
          const py = (((b0 * cy) + (b1 * cmd.y1)) + (b2 * cmd.y2)) + (b3 * cmd.y);
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
          const tt_1 = (s_1) / (steps);
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = ((b0_1 * cx) + (b1_1 * cmd.x1)) + (b2_1 * cmd.x);
          const py_1 = ((b0_1 * cy) + (b1_1 * cmd.y1)) + (b2_1 * cmd.y);
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
  const scaled = Math.floor( ((a * scale) + 0.5));
  const unit = Math.floor( scale);
  const whole = ((scaled / unit) | 0);
  let frac = scaled - (whole * unit);
  let out = "";
  if ( frac > 0 ) {
    let digits = p;
    while ((frac - ((((frac / 10) | 0)) * 10)) == 0) {
      frac = ((frac / 10) | 0);
      digits = digits - 1;
    };
    let fs = (frac.toString());
    let pad = digits - (fs.length);
    while (pad > 0) {
      fs = "0" + fs;
      pad = pad - 1;
    };
    if ( whole == 0 ) {
      out = "." + fs;
    } else {
      out = (((whole.toString())) + ".") + fs;
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
  const r = Math.floor( ((a * scale) + 0.5));
  const back = (r) / scale;
  if ( neg ) {
    return 0.0 - back;
  }
  return back;
};
EvgTracePath.collinear = function(ax, ay, bx, by, cx, cy) {
  const cross = ((bx - ax) * (cy - ay)) - ((by - ay) * (cx - ax));
  const dx = cx - ax;
  const dy = cy - ay;
  const base = Math.sqrt(((dx * dx) + (dy * dy)));
  if ( base < 0.000001 ) {
    return true;
  }
  const d = EvgTracePath.absD(cross);
  return (d / base) < 0.0001;
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
      if ( (lx == c.x) && (ly == c.y) ) {
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
EvgTracePath.sepCost = function(prev, tok) {
  if ( (prev.length) == 0 ) {
    return 0;
  }
  if ( (tok.length) == 0 ) {
    return 0;
  }
  const first = tok.substring(0, 1 );
  if ( first == "-" ) {
    return 0;
  }
  if ( first == "." ) {
    if ( (prev.indexOf(".")) >= 0 ) {
      return 0;
    }
  }
  return 1;
};
EvgTracePath.joinNum = function(d, prev, tok) {
  if ( EvgTracePath.sepCost(prev, tok) == 0 ) {
    return d + tok;
  }
  return (d + " ") + tok;
};
EvgTracePath.nextImplicit = function(letter) {
  if ( letter == "M" ) {
    return "L";
  }
  if ( letter == "m" ) {
    return "l";
  }
  if ( letter == "Z" ) {
    return "";
  }
  if ( letter == "z" ) {
    return "";
  }
  return letter;
};
EvgTracePath.tokenCost = function(prevCmd, prevNum, tok) {
  const letter = tok.substring(0, 1 );
  if ( letter == prevCmd ) {
    const rest = tok.substring(1, (tok.length) );
    const sep = EvgTracePath.sepCost(prevNum, rest);
    return (rest.length) + sep;
  }
  return tok.length;
};
EvgTracePath.appendTok = function(d, prevCmd, prevNum, tok) {
  const letter = tok.substring(0, 1 );
  if ( letter == prevCmd ) {
    const rest = tok.substring(1, (tok.length) );
    return EvgTracePath.joinNum(d, prevNum, rest);
  }
  return d + tok;
};
EvgTracePath.pair = function(d, prev, a, b) {
  const s1 = EvgTracePath.joinNum(d, prev, a);
  return EvgTracePath.joinNum(s1, a, b);
};
EvgTracePath.lastNum = function(s) {
  const n = s.length;
  let i = n;
  while (i > 0) {
    const ch = s.substring((i - 1), i );
    if ( ("0123456789.".indexOf(ch)) < 0 ) {
      if ( ch == "-" ) {
        return s.substring((i - 1), n );
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
  let prevCmd = "";
  let i = 0;
  while (i < n) {
    const c = cmds[i];
    const prevNum = EvgTracePath.lastNum(d);
    if ( c.type == "M" ) {
      const absTok = EvgTracePath.pair("M", "", EvgTracePath.num(c.x, precision), EvgTracePath.num(c.y, precision));
      const relTok = EvgTracePath.pair("m", "", EvgTracePath.num((c.x - cx), precision), EvgTracePath.num((c.y - cy), precision));
      let pick = absTok;
      if ( i > 0 ) {
        const ca = EvgTracePath.tokenCost(prevCmd, prevNum, absTok);
        const cb = EvgTracePath.tokenCost(prevCmd, prevNum, relTok);
        if ( cb < ca ) {
          pick = relTok;
        }
      }
      d = EvgTracePath.appendTok(d, prevCmd, prevNum, pick);
      prevCmd = EvgTracePath.nextImplicit((pick.substring(0, 1 )));
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
        absTok2 = EvgTracePath.joinNum("H", "", EvgTracePath.num(c.x, precision));
        relTok2 = EvgTracePath.joinNum("h", "", EvgTracePath.num((c.x - cx), precision));
      } else {
        if ( c.x == cx ) {
          absTok2 = EvgTracePath.joinNum("V", "", EvgTracePath.num(c.y, precision));
          relTok2 = EvgTracePath.joinNum("v", "", EvgTracePath.num((c.y - cy), precision));
        } else {
          absTok2 = EvgTracePath.pair("L", "", EvgTracePath.num(c.x, precision), EvgTracePath.num(c.y, precision));
          relTok2 = EvgTracePath.pair("l", "", EvgTracePath.num((c.x - cx), precision), EvgTracePath.num((c.y - cy), precision));
        }
      }
      let pick2 = absTok2;
      const ca2 = EvgTracePath.tokenCost(prevCmd, prevNum, absTok2);
      const cb2 = EvgTracePath.tokenCost(prevCmd, prevNum, relTok2);
      if ( cb2 < ca2 ) {
        pick2 = relTok2;
      }
      d = EvgTracePath.appendTok(d, prevCmd, prevNum, pick2);
      prevCmd = EvgTracePath.nextImplicit((pick2.substring(0, 1 )));
      cx = c.x;
      cy = c.y;
      smooth = false;
    }
    if ( c.type == "C" ) {
      let useS = false;
      if ( smooth ) {
        const rx = (2.0 * cx) - hx;
        const ry = (2.0 * cy) - hy;
        const ex = EvgTracePath.absD((rx - c.x1));
        const ey = EvgTracePath.absD((ry - c.y1));
        if ( (ex < 1e-7) && (ey < 1e-7) ) {
          useS = true;
        }
      }
      let absTok3 = "";
      let relTok3 = "";
      if ( useS ) {
        absTok3 = EvgTracePath.pair("S", "", EvgTracePath.num(c.x2, precision), EvgTracePath.num(c.y2, precision));
        absTok3 = EvgTracePath.pair(absTok3, EvgTracePath.lastNum(absTok3), EvgTracePath.num(c.x, precision), EvgTracePath.num(c.y, precision));
        relTok3 = EvgTracePath.pair("s", "", EvgTracePath.num((c.x2 - cx), precision), EvgTracePath.num((c.y2 - cy), precision));
        relTok3 = EvgTracePath.pair(relTok3, EvgTracePath.lastNum(relTok3), EvgTracePath.num((c.x - cx), precision), EvgTracePath.num((c.y - cy), precision));
      } else {
        absTok3 = EvgTracePath.pair("C", "", EvgTracePath.num(c.x1, precision), EvgTracePath.num(c.y1, precision));
        absTok3 = EvgTracePath.pair(absTok3, EvgTracePath.lastNum(absTok3), EvgTracePath.num(c.x2, precision), EvgTracePath.num(c.y2, precision));
        absTok3 = EvgTracePath.pair(absTok3, EvgTracePath.lastNum(absTok3), EvgTracePath.num(c.x, precision), EvgTracePath.num(c.y, precision));
        relTok3 = EvgTracePath.pair("c", "", EvgTracePath.num((c.x1 - cx), precision), EvgTracePath.num((c.y1 - cy), precision));
        relTok3 = EvgTracePath.pair(relTok3, EvgTracePath.lastNum(relTok3), EvgTracePath.num((c.x2 - cx), precision), EvgTracePath.num((c.y2 - cy), precision));
        relTok3 = EvgTracePath.pair(relTok3, EvgTracePath.lastNum(relTok3), EvgTracePath.num((c.x - cx), precision), EvgTracePath.num((c.y - cy), precision));
      }
      let pick3 = absTok3;
      const ca3 = EvgTracePath.tokenCost(prevCmd, prevNum, absTok3);
      const cb3 = EvgTracePath.tokenCost(prevCmd, prevNum, relTok3);
      if ( cb3 < ca3 ) {
        pick3 = relTok3;
      }
      d = EvgTracePath.appendTok(d, prevCmd, prevNum, pick3);
      prevCmd = EvgTracePath.nextImplicit((pick3.substring(0, 1 )));
      hx = c.x2;
      hy = c.y2;
      cx = c.x;
      cy = c.y;
      smooth = true;
    }
    if ( c.type == "Q" ) {
      let absTok4 = EvgTracePath.pair("Q", "", EvgTracePath.num(c.x1, precision), EvgTracePath.num(c.y1, precision));
      absTok4 = EvgTracePath.pair(absTok4, EvgTracePath.lastNum(absTok4), EvgTracePath.num(c.x, precision), EvgTracePath.num(c.y, precision));
      let relTok4 = EvgTracePath.pair("q", "", EvgTracePath.num((c.x1 - cx), precision), EvgTracePath.num((c.y1 - cy), precision));
      relTok4 = EvgTracePath.pair(relTok4, EvgTracePath.lastNum(relTok4), EvgTracePath.num((c.x - cx), precision), EvgTracePath.num((c.y - cy), precision));
      let pick4 = absTok4;
      const ca4 = EvgTracePath.tokenCost(prevCmd, prevNum, absTok4);
      const cb4 = EvgTracePath.tokenCost(prevCmd, prevNum, relTok4);
      if ( cb4 < ca4 ) {
        pick4 = relTok4;
      }
      d = EvgTracePath.appendTok(d, prevCmd, prevNum, pick4);
      prevCmd = EvgTracePath.nextImplicit((pick4.substring(0, 1 )));
      cx = c.x;
      cy = c.y;
      smooth = false;
    }
    if ( c.type == "Z" ) {
      d = d + "Z";
      prevCmd = "";
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
    let p_2 = [];
    this.pts = p_2;
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
      if ( (cleaned.length) == 0 ) {
        cleaned.push(p);
      } else {
        const prev = cleaned[((cleaned.length) - 1)];
        if ( (prev.x == p.x) && (prev.y == p.y) ) {
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
      if ( (first.x == last.x) && (first.y == last.y) ) {
        let trimmed = [];
        let k = 0;
        while (k < (cn - 1)) {
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
      s.push(EvgTraceSum.of((prev.x + x), (prev.y + y), (prev.xy + (x * y)), (prev.x2 + (x * x)), (prev.y2 + (y * y))));
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
      if ( (pi.x != pk.x) && (pi.y != pk.y) ) {
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
      const dx0 = Math.floor( (piNext.x - pi2.x));
      const dy0 = Math.floor( (piNext.y - pi2.y));
      const dirNum0 = 3 + ((3 * dx0) + dy0);
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
      while ((found == false) && (guard < (this.n + 2))) {
        const pk1 = this.pts[kk];
        const pk0 = this.pts[k1];
        const sdx = EvgTraceFit.signI((Math.floor( (pk1.x - pk0.x))));
        const sdy = EvgTraceFit.signI((Math.floor( (pk1.y - pk0.y))));
        const dirNum = 3 + ((3 * sdx) + sdy);
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
        if ( (((ct0 > 0) && (ct1 > 0)) && (ct2 > 0)) && (ct3 > 0) ) {
          pivk[i] = k1;
          found = true;
        } else {
          const curx = Math.floor( (pk1.x - pi2.x));
          const cury = Math.floor( (pk1.y - pi2.y));
          if ( (EvgTraceFit.xprod(c0x, c0y, curx, cury) < 0) || (EvgTraceFit.xprod(c1x, c1y, curx, cury) > 0) ) {
            guard = this.n + 2;
          } else {
            const ax = EvgTraceFit.absI(curx);
            const ay = EvgTraceFit.absI(cury);
            if ( (ax > 1) || (ay > 1) ) {
              let off0x = curx;
              let off0y = cury;
              if ( (cury > 0) || ((cury == 0) && (curx < 0)) ) {
                off0x = curx + 1;
              } else {
                off0x = curx - 1;
              }
              if ( (curx < 0) || ((curx == 0) && (cury < 0)) ) {
                off0y = cury + 1;
              } else {
                off0y = cury - 1;
              }
              off0x = curx;
              off0y = cury;
              if ( (cury >= 0) && ((cury > 0) || (curx < 0)) ) {
                off0x = curx + 1;
              } else {
                off0x = curx - 1;
              }
              if ( (curx <= 0) && ((curx < 0) || (cury < 0)) ) {
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
              if ( (cury <= 0) && ((cury < 0) || (curx < 0)) ) {
                off1x = curx + 1;
              } else {
                off1x = curx - 1;
              }
              if ( (curx >= 0) && ((curx > 0) || (cury < 0)) ) {
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
        const dkx = EvgTraceFit.signI((Math.floor( (pkA.x - pkB.x))));
        const dky = EvgTraceFit.signI((Math.floor( (pkA.y - pkB.y))));
        const cur2x = Math.floor( (pkB.x - pi2.x));
        const cur2y = Math.floor( (pkB.y - pi2.y));
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
      if ( EvgTraceFit.cyclic((i + 1), (pivk[i]), jLon) ) {
        jLon = pivk[i];
      }
      lonOut[i] = jLon;
      i = i - 1;
    };
    i = this.n - 1;
    while (i >= 0) {
      if ( EvgTraceFit.cyclic(EvgTraceFit.modI((i + 1), this.n), jLon, (lonOut[i])) ) {
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
      k = k + (this.n);
    }
    const pi = this.pts[i];
    const pj = this.pts[j];
    const pOrig = this.pts[0];
    const px = ((pi.x + pj.x) / 2.0) - pOrig.x;
    const py = ((pi.y + pj.y) / 2.0) - pOrig.y;
    const ey = pj.x - pi.x;
    const ex = 0.0 - (pj.y - pi.y);
    const a = ((x2 - ((2.0 * x) * px)) / k) + (px * px);
    const b = (((xy - (x * py)) - (y * px)) / k) + (px * py);
    const c = ((y2 - ((2.0 * y) * py)) / k) + (py * py);
    let s = (((ex * ex) * a) + (((2.0 * ex) * ey) * b)) + ((ey * ey) * c);
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
      let c = EvgTraceFit.modI(((this.lon[EvgTraceFit.modI((i - 1), this.n)]) - 1), this.n);
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
      while (j <= (clip0[i])) {
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
      while (i <= (seg0[j])) {
        let best = 0.0 - 1.0;
        let bestK = 0;
        let k = seg0[(j - 1)];
        while (k >= (clip1[i])) {
          const thispen = this.penalty3(k, i);
          const prevPen = pen[k];
          const total = thispen + prevPen;
          if ( (best < 0.0) || (total < best) ) {
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
      const jj = EvgTraceFit.modI((j - (this.po[i])), this.n) + (this.po[i]);
      const c = EvgTracePoint.of(0.0, 0.0);
      const d = EvgTracePoint.of(0.0, 0.0);
      this.pointslope(this.po[i], jj, c, d);
      ctr[i] = c;
      dir[i] = d;
      i = i + 1;
    };
    let qdata = [];
    i = 0;
    while (i < (this.m * 9)) {
      qdata.push(0.0);
      i = i + 1;
    };
    i = 0;
    while (i < this.m) {
      const di = dir[i];
      const ci = ctr[i];
      const d2 = (di.x * di.x) + (di.y * di.y);
      const base = i * 9;
      if ( d2 == 0.0 ) {
      } else {
        const v0 = di.y;
        const v1 = 0.0 - di.x;
        const v2 = (0.0 - (v1 * ci.y)) - (v0 * ci.x);
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
            qdata[(base + (l * 3)) + k] = (vl * vk) / d2;
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
        const a = qdata[((iPrev * 9) + t)];
        const b = qdata[((i * 9) + t)];
        Q[t] = a + b;
        t = t + 1;
      };
      const pCur = this.pts[(this.po[i])];
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
      const det = (q00 * q11) - (q01 * q10);
      let solved = false;
      if ( det != 0.0 ) {
        wx = (((0.0 - q02) * q11) + (q12 * q01)) / det;
        wy = ((q02 * q10) - (q12 * q00)) / det;
        solved = true;
      }
      const dx = EvgTraceFit.absD((wx - sx));
      const dy = EvgTraceFit.absD((wy - sy));
      if ( ((solved == false) || (dx > 0.5)) || (dy > 0.5) ) {
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
        while (ci_1 < (cand.length)) {
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
      if ( wx < (sx - 0.5) ) {
        wx = sx - 0.5;
      }
      if ( wx > (sx + 0.5) ) {
        wx = sx + 0.5;
      }
      if ( wy < (sy - 0.5) ) {
        wy = sy - 0.5;
      }
      if ( wy > (sy + 0.5) ) {
        wy = sy + 0.5;
      }
      out.push(EvgTracePoint.of((wx + this.x0), (wy + this.y0)));
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
        const qij = Q[((i * 3) + j)];
        sum = sum + ((vi * qij) * vj);
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
    const x = (sj.x - si.x) + ((r) * sn.x);
    const y = (sj.y - si.y) + ((r) * sn.y);
    const x2 = (sj.x2 - si.x2) + ((r) * sn.x2);
    const xy = (sj.xy - si.xy) + ((r) * sn.xy);
    const y2 = (sj.y2 - si.y2) + ((r) * sn.y2);
    const k = (((j + 1) - i) + (r * this.n));
    if ( k == 0.0 ) {
      ctr.x = 0.0;
      ctr.y = 0.0;
      dir.x = 0.0;
      dir.y = 0.0;
      return;
    }
    ctr.x = x / k;
    ctr.y = y / k;
    let a = (x2 - ((x * x) / k)) / k;
    const b = (xy - ((x * y) / k)) / k;
    let c = (y2 - ((y * y) / k)) / k;
    const disc = ((a - c) * (a - c)) + ((4.0 * b) * b);
    const lambda2 = ((a + c) + (Math.sqrt(disc))) / 2.0;
    a = a - lambda2;
    c = c - lambda2;
    let l = 0.0;
    if ( EvgTraceFit.absD(a) >= EvgTraceFit.absD(c) ) {
      l = Math.sqrt(((a * a) + (b * b)));
      if ( l != 0.0 ) {
        dir.x = (0.0 - b) / l;
        dir.y = a / l;
      }
    } else {
      l = Math.sqrt(((c * c) + (b * b)));
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
  let r = a - ((((a / n) | 0)) * n);
  if ( r < 0 ) {
    r = r + n;
  }
  return r;
};
EvgTraceFit.cyclic = function(a, b, c) {
  if ( a <= c ) {
    return (a <= b) && (b < c);
  }
  return (a <= b) || (b < c);
};
EvgTraceFit.xprod = function(ax, ay, bx, by) {
  return (ax * by) - (ay * bx);
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
  const n = (((pts.length) / 2) | 0);
  if ( n < 2 ) {
    return out;
  }
  out.push(VectorShapes.moveTo((pts[0]), (pts[1])));
  let k = 1;
  while (k < n) {
    out.push(VectorShapes.lineTo((pts[(k * 2)]), (pts[((k * 2) + 1)])));
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
  out.push(VectorShapes.moveTo((cx + rx), cy));
  out.push(VectorShapes.cubicTo((cx + rx), (cy + oy), (cx + ox), (cy + ry), cx, (cy + ry)));
  out.push(VectorShapes.cubicTo((cx - ox), (cy + ry), (cx - rx), (cy + oy), (cx - rx), cy));
  out.push(VectorShapes.cubicTo((cx - rx), (cy - oy), (cx - ox), (cy - ry), cx, (cy - ry)));
  out.push(VectorShapes.cubicTo((cx + ox), (cy - ry), (cx + rx), (cy - oy), (cx + rx), cy));
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
  if ( rx > (w / 2.0) ) {
    rx = w / 2.0;
  }
  if ( ry > (h / 2.0) ) {
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
    out.push(VectorShapes.lineTo((x + w), y));
    out.push(VectorShapes.lineTo((x + w), (y + h)));
    out.push(VectorShapes.lineTo(x, (y + h)));
    out.push(VectorShapes.closePath());
    return out;
  }
  const k = VectorShapes.kappa();
  const ox = rx * k;
  const oy = ry * k;
  const x1 = x + w;
  const y1 = y + h;
  out.push(VectorShapes.moveTo((x + rx), y));
  out.push(VectorShapes.lineTo((x1 - rx), y));
  out.push(VectorShapes.cubicTo(((x1 - rx) + ox), y, x1, ((y + ry) - oy), x1, (y + ry)));
  out.push(VectorShapes.lineTo(x1, (y1 - ry)));
  out.push(VectorShapes.cubicTo(x1, ((y1 - ry) + oy), ((x1 - rx) + ox), y1, (x1 - rx), y1));
  out.push(VectorShapes.lineTo((x + rx), y1));
  out.push(VectorShapes.cubicTo(((x + rx) - ox), y1, x, ((y1 - ry) + oy), x, (y1 - ry)));
  out.push(VectorShapes.lineTo(x, (y + ry)));
  out.push(VectorShapes.cubicTo(x, ((y + ry) - oy), ((x + rx) - ox), y, (x + rx), y));
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
  const scaled = Math.floor( ((a * 10000.0) + 0.5));
  const whole = ((scaled / 10000) | 0);
  let fracPart = scaled - (whole * 10000);
  let out = (whole.toString());
  if ( fracPart > 0 ) {
    let digits = 4;
    while ((fracPart - ((((fracPart / 10) | 0)) * 10)) == 0) {
      fracPart = ((fracPart / 10) | 0);
      digits = digits - 1;
    };
    let frac = (fracPart.toString());
    let pad = digits - (frac.length);
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
    let t = [];
    this.tag = t;
    let v_1 = [];
    this.vertex = v_1;
    let a = [];
    this.c0 = a;
    let b = [];
    this.c1 = b;
    let c = [];
    this.c2 = c;
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
      if ( (this.tag[i]) == "CURVE" ) {
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
      if ( (this.tag[i]) == "CORNER" ) {
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
      if ( (this.tag[i]) == "CURVE" ) {
        const iPrev = EvgTraceCurve.modI((i - 1), this.n);
        const iNext = EvgTraceCurve.modI((i + 1), this.n);
        const para = EvgTraceCurve.dpara((this.vertex[iPrev]), (this.vertex[i]), (this.vertex[iNext]));
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
      if ( (this.tag[i1]) == "CURVE" ) {
        const al = this.alpha[i1];
        const d1 = EvgTraceCurve.dpara((this.c2[i]), (this.vertex[i1]), (this.c2[i1]));
        area = area + (((0.3 * al) * (4.0 - al)) * (d1 / 2.0));
        const d2 = EvgTraceCurve.dpara(p0, (this.c2[i]), (this.c2[i1]));
        area = area + (d2 / 2.0);
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
      lenArr[j] = (lenArr[(j - 1)]) + 1;
      let iBack = j - 2;
      while (iBack >= 0) {
        const res = this.optiPenalty(iBack, EvgTraceCurve.modI(j, this.n), opttolerance, convc, areac);
        if ( res.ok == false ) {
          iBack = 0 - 1;
        } else {
          const lenJ = lenArr[j];
          const lenI = lenArr[iBack];
          const penJ = pen[j];
          const penI = pen[iBack];
          let better = false;
          if ( lenJ > (lenI + 1) ) {
            better = true;
          }
          if ( (lenJ == (lenI + 1)) && (penJ > (penI + res.pen)) ) {
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
      if ( prevJ == (j - 1) ) {
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
        const newV = EvgTraceCurve.interval(sVal, (this.c2[idx2]), (this.vertex[idx2]));
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
    const d = EvgTraceCurve.ddist((this.vertex[i]), (this.vertex[i1]));
    k = k1;
    while (k != j) {
      k1 = EvgTraceCurve.modI((k + 1), m);
      const k2 = EvgTraceCurve.modI((k + 2), m);
      if ( (convc[k1]) != conv ) {
        return res;
      }
      const cp = EvgTraceCurve.cprod((this.vertex[i]), (this.vertex[i1]), (this.vertex[k1]), (this.vertex[k2]));
      if ( EvgTraceCurve.signD(cp) != conv ) {
        return res;
      }
      const ip = EvgTraceCurve.iprod1((this.vertex[i]), (this.vertex[i1]), (this.vertex[k1]), (this.vertex[k2]));
      const d2 = EvgTraceCurve.ddist((this.vertex[k1]), (this.vertex[k2]));
      if ( ip < ((d * d2) * (0.0 - 0.999847695156)) ) {
        return res;
      }
      k = k1;
    };
    const p0 = this.c2[EvgTraceCurve.modI(i, m)];
    const p1 = this.vertex[EvgTraceCurve.modI((i + 1), m)];
    const p2 = this.vertex[EvgTraceCurve.modI(j, m)];
    const p3 = this.c2[EvgTraceCurve.modI(j, m)];
    let area = (areac[j]) - (areac[i]);
    const areaAdj = EvgTraceCurve.dpara((this.vertex[0]), (this.c2[i]), (this.c2[j]));
    area = area - (areaAdj / 2.0);
    if ( i >= j ) {
      area = area + (areac[m]);
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
    const inner = 4.0 - (R / 0.3);
    if ( inner < 0.0 ) {
      return res;
    }
    const joinAlpha = 2.0 - (Math.sqrt(inner));
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
      if ( tv < (0.0 - 0.5) ) {
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
      res.pen = res.pen + (d1 * d1);
      k = k1;
    };
    k = i;
    while (k != j) {
      k1 = EvgTraceCurve.modI((k + 1), m);
      const ck = this.c2[k];
      const ck1 = this.c2[k1];
      const tv2 = EvgTraceCurve.tangent(q0, q1, q2, q3, ck, ck1);
      if ( tv2 < (0.0 - 0.5) ) {
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
      if ( d1b < (d2b - opttolerance) ) {
        return res;
      }
      if ( d1b < d2b ) {
        const diff = d1b - d2b;
        res.pen = res.pen + (diff * diff);
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
  let r = a - ((((a / n) | 0)) * n);
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
  return EvgTracePoint.of(((a.x * (1.0 - lambda)) + (b.x * lambda)), ((a.y * (1.0 - lambda)) + (b.y * lambda)));
};
EvgTraceCurve.dpara = function(p0, p1, p2) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p2.x - p0.x;
  const y2 = p2.y - p0.y;
  return (x1 * y2) - (y1 * x2);
};
EvgTraceCurve.cprod = function(p0, p1, p2, p3) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  return (x1 * y2) - (y1 * x2);
};
EvgTraceCurve.iprod = function(p0, p1, p2) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p2.x - p0.x;
  const y2 = p2.y - p0.y;
  return (x1 * x2) + (y1 * y2);
};
EvgTraceCurve.iprod1 = function(p0, p1, p2, p3) {
  const x1 = p1.x - p0.x;
  const y1 = p1.y - p0.y;
  const x2 = p3.x - p2.x;
  const y2 = p3.y - p2.y;
  return (x1 * x2) + (y1 * y2);
};
EvgTraceCurve.ddist = function(p, q) {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  return Math.sqrt(((dx * dx) + (dy * dy)));
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
  const x = (((s2 * s) * p0.x) + (((3.0 * s2) * t) * p1.x)) + ((((3.0 * t2) * s) * p2.x) + ((t2 * t) * p3.x));
  const y = (((s2 * s) * p0.y) + (((3.0 * s2) * t) * p1.y)) + ((((3.0 * t2) * s) * p2.y) + ((t2 * t) * p3.y));
  return EvgTracePoint.of(x, y);
};
EvgTraceCurve.tangent = function(p0, p1, p2, p3, q0, q1) {
  const A = EvgTraceCurve.cprod(p0, p1, q0, q1);
  const B = EvgTraceCurve.cprod(p1, p2, q0, q1);
  const C = EvgTraceCurve.cprod(p2, p3, q0, q1);
  const a = (A - (2.0 * B)) + C;
  const b = (0.0 - (2.0 * A)) + (2.0 * B);
  const c = A;
  const disc = (b * b) - ((4.0 * a) * c);
  if ( a == 0.0 ) {
    return 0.0 - 1.0;
  }
  if ( disc < 0.0 ) {
    return 0.0 - 1.0;
  }
  const s = Math.sqrt(disc);
  const r1 = ((0.0 - b) + s) / (2.0 * a);
  const r2 = ((0.0 - b) - s) / (2.0 * a);
  if ( (r1 >= 0.0) && (r1 <= 1.0) ) {
    return r1;
  }
  if ( (r2 >= 0.0) && (r2 <= 1.0) ) {
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
        alpha = 1.0 - (1.0 / dd);
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
      const p2 = EvgTraceCurve.interval((0.5 + (0.5 * a2)), vi, vj);
      const p3 = EvgTraceCurve.interval((0.5 + (0.5 * a2)), vk, vj);
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
    let c_1 = [];
    this.commands = c_1;
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
    return (this.commands.length) == 0;
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
      one.x = cx + ((px * c) - (py * s));
      one.y = cy + ((px * s) + (py * c));
      const p1x = one.x1 - cx;
      const p1y = one.y1 - cy;
      one.x1 = cx + ((p1x * c) - (p1y * s));
      one.y1 = cy + ((p1x * s) + (p1y * c));
      const p2x = one.x2 - cx;
      const p2y = one.y2 - cy;
      one.x2 = cx + ((p2x * c) - (p2y * s));
      one.y2 = cy + ((p2x * s) + (p2y * c));
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
        while (j < (xs.length)) {
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
class EVGUnit  {
  constructor() {
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
    this.rootFontSize = 14.0;
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
  }
  resolve (parentSize, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
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
    if ( this.unitType == 4 ) {
      this.pixels = parentSize;
      return;
    }
    this.pixels = this.value;
  };
  resolveForHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
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
      this.pixels = 0.0;
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
  toString () {
    if ( this.isSet == false ) {
      return "unset";
    }
    if ( this.unitType == 0 ) {
      return ((this.value.toString())) + "px";
    }
    if ( this.unitType == 1 ) {
      return ((this.value.toString())) + "%";
    }
    if ( this.unitType == 2 ) {
      return ((this.value.toString())) + "em";
    }
    if ( this.unitType == 3 ) {
      return ((this.value.toString())) + "hp";
    }
    if ( this.unitType == 4 ) {
      return "fill";
    }
    if ( this.unitType == 5 ) {
      return ((this.value.toString())) + "rem";
    }
    return (this.value.toString());
  };
}
EVGUnit.isAlpha = function(c) {
  if ( (c >= 65) && (c <= 90) ) {
    return true;
  }
  return (c >= 97) && (c <= 122);
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
  const unit = new EVGUnit();
  unit.isSet = false;
  return unit;
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
  const lastChar = trimmed.charCodeAt((__len - 1) );
  if ( lastChar == 37 ) {
    const numStr = trimmed.substring(0, (__len - 1) );
    const numVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(numVal) != "undefined" ) {
      unit.value = numVal;
      unit.unitType = 1;
      unit.isSet = true;
    }
    return unit;
  }
  if ( __len >= 3 ) {
    const suffix3 = trimmed.substring((__len - 3), __len );
    if ( suffix3 == "rem" ) {
      const numStr3 = trimmed.substring(0, (__len - 3) );
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
    const suffix = trimmed.substring((__len - 2), __len );
    const perUnit = EVGUnit.pxPerUnit(suffix);
    if ( perUnit > 0.0 ) {
      const numStrA = trimmed.substring(0, (__len - 2) );
      const numValA = isNaN( parseFloat(numStrA) ) ? undefined : parseFloat(numStrA);
      if ( typeof(numValA) != "undefined" ) {
        unit.value = (numValA) * perUnit;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "em" ) {
      const numStr_1 = trimmed.substring(0, (__len - 2) );
      const numVal_1 = isNaN( parseFloat(numStr_1) ) ? undefined : parseFloat(numStr_1);
      if ( typeof(numVal_1) != "undefined" ) {
        unit.value = numVal_1;
        unit.unitType = 2;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "px" ) {
      const numStr_2 = trimmed.substring(0, (__len - 2) );
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
      const numStr_3 = trimmed.substring(0, (__len - 2) );
      const numVal_3 = isNaN( parseFloat(numStr_3) ) ? undefined : parseFloat(numStr_3);
      if ( typeof(numVal_3) != "undefined" ) {
        unit.value = numVal_3;
        unit.unitType = 3;
        unit.isSet = true;
      }
      return unit;
    }
  }
  if ( EVGUnit.isAlpha(lastChar) || (lastChar == 41) ) {
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
    return Math.floor( this.r);
  };
  green () {
    if ( this.g > 255.0 ) {
      return 255;
    }
    if ( this.g < 0.0 ) {
      return 0;
    }
    return Math.floor( this.g);
  };
  blue () {
    if ( this.b > 255.0 ) {
      return 255;
    }
    if ( this.b < 0.0 ) {
      return 0;
    }
    return Math.floor( this.b);
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
      return ((((((("rgba(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ",") + ((this.alpha().toString()))) + ")";
    }
    return ((((("rgb(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ")";
  };
  toHexString () {
    if ( this.isSet == false ) {
      return "none";
    }
    const hexChars = "0123456789ABCDEF";
    const rH = this.red();
    const gH = this.green();
    const bH = this.blue();
    const r1D = (rH) / 16.0;
    const r1 = Math.floor( r1D);
    const r2 = rH % 16;
    const g1D = (gH) / 16.0;
    const g1 = Math.floor( g1D);
    const g2 = gH % 16;
    const b1D = (bH) / 16.0;
    const b1 = Math.floor( b1D);
    const b2 = bH % 16;
    return ((((("#" + (String.fromCharCode((hexChars.charCodeAt(r1 ))))) + (String.fromCharCode((hexChars.charCodeAt(r2 ))))) + (String.fromCharCode((hexChars.charCodeAt(g1 ))))) + (String.fromCharCode((hexChars.charCodeAt(g2 ))))) + (String.fromCharCode((hexChars.charCodeAt(b1 ))))) + (String.fromCharCode((hexChars.charCodeAt(b2 ))));
  };
  toPDFColorString () {
    if ( this.isSet == false ) {
      return "";
    }
    const rN = this.r / 255.0;
    const gN = this.g / 255.0;
    const bN = this.b / 255.0;
    return (((((rN.toString())) + " ") + ((gN.toString()))) + " ") + ((bN.toString()));
  };
  withAlpha (newAlpha) {
    return EVGColor.create(this.r, this.g, this.b, newAlpha);
  };
  lighten (amount) {
    const newR = this.r + ((255.0 - this.r) * amount);
    const newG = this.g + ((255.0 - this.g) * amount);
    const newB = this.b + ((255.0 - this.b) * amount);
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
  return EVGColor.create((red), (green), (blue), 1.0);
};
EVGColor.rgba = function(red, green, blue, alpha) {
  return EVGColor.create((red), (green), (blue), alpha);
};
EVGColor.noColor = function() {
  const c = new EVGColor();
  c.isSet = false;
  return c;
};
EVGColor.black = function() {
  return EVGColor.rgb(0, 0, 0);
};
EVGColor.white = function() {
  return EVGColor.rgb(255, 255, 255);
};
EVGColor.transparent = function() {
  return EVGColor.rgba(0, 0, 0, 0.0);
};
EVGColor.hexDigit = function(ch) {
  if ( (ch >= 48) && (ch <= 57) ) {
    return ch - 48;
  }
  if ( (ch >= 65) && (ch <= 70) ) {
    return (ch - 65) + 10;
  }
  if ( (ch >= 97) && (ch <= 102) ) {
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
    const r1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const g1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const b1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    c.r = ((r1 * 16) + r1);
    c.g = ((g1 * 16) + g1);
    c.b = ((b1 * 16) + b1);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 6 ) {
    const r1_1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    c.r = ((r1_1 * 16) + r2);
    c.g = ((g1_1 * 16) + g2);
    c.b = ((b1_1 * 16) + b2);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 8 ) {
    const r1_2 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    const a1 = EVGColor.hexDigit((hex.charCodeAt((start + 6) )));
    const a2 = EVGColor.hexDigit((hex.charCodeAt((start + 7) )));
    c.r = ((r1_2 * 16) + r2_1);
    c.g = ((g1_2 * 16) + g2_1);
    c.b = ((b1_2 * 16) + b2_1);
    c.a = (((a1 * 16) + a2)) / 255.0;
    c.isSet = true;
    return c;
  }
  c.isSet = false;
  return c;
};
EVGColor.hue2rgb = function(p, q, tt) {
  let t = tt;
  if ( t < 0.0 ) {
    t = t + 1.0;
  }
  if ( t > 1.0 ) {
    t = t - 1.0;
  }
  if ( t < (1.0 / 6.0) ) {
    return p + (((q - p) * 6.0) * t);
  }
  if ( t < (1.0 / 2.0) ) {
    return q;
  }
  if ( t < (2.0 / 3.0) ) {
    return p + (((q - p) * ((2.0 / 3.0) - t)) * 6.0);
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
      q = (lNorm + sNorm) - (lNorm * sNorm);
    }
    const p = (2.0 * lNorm) - q;
    c.r = EVGColor.hue2rgb(p, q, (hNorm + (1.0 / 3.0))) * 255.0;
    c.g = EVGColor.hue2rgb(p, q, hNorm) * 255.0;
    c.b = EVGColor.hue2rgb(p, q, (hNorm - (1.0 / 3.0))) * 255.0;
  }
  c.a = 1.0;
  c.isSet = true;
  return c;
};
EVGColor.parseNumber = function(str) {
  const val = isNaN( parseFloat((str.trim())) ) ? undefined : parseFloat((str.trim()));
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
    if ( (ch_2 == 44) || (ch_2 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_2));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
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
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 4 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
    c.a = EVGColor.parseNumber((parts[3]));
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
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    const h = EVGColor.parseNumber((parts[0]));
    const s = EVGColor.parseNumber((parts[1]));
    const l = EVGColor.parseNumber((parts[2]));
    const c = EVGColor.hslToRgb(h, s, l);
    if ( (parts.length) >= 4 ) {
      c.a = EVGColor.parseNumber((parts[3]));
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
    if ( (ch >= 65) && (ch <= 90) ) {
      lower = lower + (String.fromCharCode((ch + 32)));
    } else {
      lower = lower + (String.fromCharCode(ch));
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
    if ( (((this.x1 == 0.0) && (this.y1 == 0.0)) && (this.x2 == 1.0)) && (this.y2 == 1.0) ) {
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
    const v = (k) / n;
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
    const bx = (3.0 * (this.x2 - this.x1)) - cx;
    const a = (1.0 - cx) - bx;
    return ((((a * t) + bx) * t) + cx) * t;
  };
  sampleY (t) {
    const cy = 3.0 * this.y1;
    const by = (3.0 * (this.y2 - this.y1)) - cy;
    const a = (1.0 - cy) - by;
    return ((((a * t) + by) * t) + cy) * t;
  };
  slopeX (t) {
    const cx = 3.0 * this.x1;
    const bx = (3.0 * (this.x2 - this.x1)) - cx;
    const a = (1.0 - cx) - bx;
    return ((((3.0 * a) * t) + (2.0 * bx)) * t) + cx;
  };
  solveT (x) {
    let t = x;
    let i = 0;
    while (i < 8) {
      const err = this.sampleX(t) - x;
      if ( (Math.abs(err)) < 1e-7 ) {
        return t;
      }
      const d = this.slopeX(t);
      if ( (Math.abs(d)) < 0.000001 ) {
        i = 8;
      } else {
        t = t - (err / d);
        if ( (t < 0.0) || (t > 1.0) ) {
          i = 8;
        }
        i = i + 1;
      }
    };
    let lo = 0.0;
    let hi = 1.0;
    let m = x;
    if ( (m < lo) || (m > hi) ) {
      m = 0.5;
    }
    let j = 0;
    while (j < 64) {
      const v = this.sampleX(m);
      if ( (Math.abs((v - x))) < 1e-7 ) {
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
  if ( (t.length) == 0 ) {
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
  if ( (args.length) > 0 ) {
    const nums = EVGEasing.numbers(args);
    if ( (nums.length) == 4 ) {
      const cx1 = EVGEasing.clamp01((nums[0]));
      const cx2 = EVGEasing.clamp01((nums[2]));
      return EVGEasing.cubic(cx1, (nums[1]), cx2, (nums[3]));
    }
    const bad = EVGEasing.linear();
    bad.ok = false;
    return bad;
  }
  const sargs = EVGEasing.argsOf(t, "steps");
  if ( (sargs.length) > 0 ) {
    const parts = EVGEasing.splitTop(sargs, 44);
    const countTxt = (parts[0]).trim();
    const n = isNaN( parseFloat(countTxt) ) ? undefined : parseFloat(countTxt);
    if ( typeof(n) != "undefined" ) {
      let atStart = false;
      if ( (parts.length) > 1 ) {
        const word = (parts[1]).trim();
        if ( (word == "start") || (word == "jump-start") ) {
          atStart = true;
        }
      }
      return EVGEasing.steps((Math.floor( (n))), atStart);
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
  if ( (EVGEasing.argsOf(t, "cubic-bezier").length) > 0 ) {
    return true;
  }
  if ( (EVGEasing.argsOf(t, "steps").length) > 0 ) {
    return true;
  }
  const n = t.length;
  if ( n > 2 ) {
    if ( (t.charCodeAt((n - 1) )) == 41 ) {
      let i = 0;
      while (i < n) {
        if ( (t.charCodeAt(i )) == 40 ) {
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
  if ( tl < (nl + 3) ) {
    return "";
  }
  if ( (t.substring(0, nl )) != name ) {
    return "";
  }
  if ( (t.charCodeAt(nl )) != 40 ) {
    return "";
  }
  if ( (t.charCodeAt((tl - 1) )) != 41 ) {
    return "";
  }
  return t.substring((nl + 1), (tl - 1) );
};
EVGEasing.numbers = function(s) {
  let out = [];
  const parts = EVGEasing.splitTop(s, 44);
  let i = 0;
  while (i < (parts.length)) {
    const v = isNaN( parseFloat(((parts[i]).trim())) ) ? undefined : parseFloat(((parts[i]).trim()));
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
    if ( (c == ch) && (depth == 0) ) {
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
    const isSpace = ((c == 32) || (c == 9)) || (c == 10);
    if ( isSpace && (depth == 0) ) {
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
  resolveUnits (parentWidth, parentHeight, fontSize, rootFontSize) {
    this.marginTop.rootFontSize = rootFontSize;
    this.marginRight.rootFontSize = rootFontSize;
    this.marginBottom.rootFontSize = rootFontSize;
    this.marginLeft.rootFontSize = rootFontSize;
    this.paddingTop.rootFontSize = rootFontSize;
    this.paddingRight.rootFontSize = rootFontSize;
    this.paddingBottom.rootFontSize = rootFontSize;
    this.paddingLeft.rootFontSize = rootFontSize;
    this.borderWidth.rootFontSize = rootFontSize;
    this.borderRadius.rootFontSize = rootFontSize;
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
  };
  getHorizontalChrome () {
    return (this.paddingLeftPx + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getVerticalChrome () {
    return (this.paddingTopPx + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
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
    return ((((contentWidth + this.marginLeftPx) + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getTotalHeight (contentHeight) {
    return ((((contentHeight + this.marginTopPx) + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getContentX (elementX) {
    return ((elementX + this.marginLeftPx) + this.borderWidthPx) + this.paddingLeftPx;
  };
  getContentY (elementY) {
    return ((elementY + this.marginTopPx) + this.borderWidthPx) + this.paddingTopPx;
  };
  getHorizontalSpace () {
    return (((this.marginLeftPx + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getVerticalSpace () {
    return (((this.marginTopPx + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
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
    return ((((((((((((((((("Box[margin:" + ((this.marginTopPx.toString()))) + "/") + ((this.marginRightPx.toString()))) + "/") + ((this.marginBottomPx.toString()))) + "/") + ((this.marginLeftPx.toString()))) + " padding:") + ((this.paddingTopPx.toString()))) + "/") + ((this.paddingRightPx.toString()))) + "/") + ((this.paddingBottomPx.toString()))) + "/") + ((this.paddingLeftPx.toString()))) + " border:") + ((this.borderWidthPx.toString()))) + "]";
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
    if ( (this.stops.length) > 0 ) {
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
      result = ("linear-gradient(" + ((this.angle.toString()))) + "deg";
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
  }
  if ( radialIdx >= 0 ) {
    grad.isLinear = false;
    grad.isSet = true;
  }
  if ( grad.isSet == false ) {
    return grad;
  }
  if ( grad.isLinear ) {
    const degIdx = gradStr.indexOf("deg");
    if ( degIdx > 0 ) {
      const startIdx = gradStr.indexOf("(");
      if ( startIdx >= 0 ) {
        const angleStr = gradStr.substring((startIdx + 1), degIdx );
        const angleVal = isNaN( parseFloat((angleStr.trim())) ) ? undefined : parseFloat((angleStr.trim()));
        if ( typeof(angleVal) != "undefined" ) {
          grad.angle = angleVal;
        }
      }
    }
  }
  let colors = [];
  let i = 0;
  while (i < __len) {
    const ch = gradStr.charCodeAt(i );
    if ( ch == 35 ) {
      const colorStart = i;
      let colorEnd = i + 1;
      while (colorEnd < __len) {
        const c = gradStr.charCodeAt(colorEnd );
        let isHex = false;
        if ( (c >= 48) && (c <= 57) ) {
          isHex = true;
        }
        if ( (c >= 65) && (c <= 70) ) {
          isHex = true;
        }
        if ( (c >= 97) && (c <= 102) ) {
          isHex = true;
        }
        if ( isHex ) {
          colorEnd = colorEnd + 1;
        } else {
          break;
        }
      };
      const colorStr = gradStr.substring(colorStart, colorEnd );
      const parsedColor = EVGColor.parseHex(colorStr);
      if ( parsedColor.isSet ) {
        colors.push(parsedColor);
      }
      i = colorEnd;
    } else {
      i = i + 1;
    }
  };
  const numColors = colors.length;
  if ( numColors > 0 ) {
    let colorIdx = 0;
    while (colorIdx < numColors) {
      let pct = 0.0;
      if ( numColors > 1 ) {
        pct = (colorIdx) / ((numColors - 1));
      }
      const col = colors[colorIdx];
      grad.addStop(pct, col);
      colorIdx = colorIdx + 1;
    };
  }
  return grad;
};
class EVGFlight  {
  constructor() {
    this.property = "";     /** note: unused */
    this.durationMs = 0.0;
    this.delayMs = 0.0;
    this.elapsedMs = 0.0;
    this.easing = new EVGEasing();
    this.fromNumber = 0.0;     /** note: unused */
    this.toNumber = 0.0;     /** note: unused */
    this.isColor = false;     /** note: unused */
    this.unitCode = 0;     /** note: unused */
    this.reversingStartNumber = 0.0;     /** note: unused */
    this.reversingFactor = 1.0;     /** note: unused */
    this.wroteNumber = 0.0;     /** note: unused */
    this.hasWrote = false;     /** note: unused */
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
    return this.elapsedMs >= (this.delayMs + this.durationMs);
  };
}
class EVGElement  {
  constructor() {
    this.id = "";
    this.tagName = "div";
    this.elementType = 0;
    this.format = "";
    this.orientation = "";
    this.pageWidth = 0.0;
    this.pageHeight = 0.0;
    this.children = [];
    this.opacity = 1.0;
    this.gradientSet = false;
    this.gradientDir = 0;
    this.absPosSet = false;     /** note: unused */
    this.absX = 0.0;     /** note: unused */
    this.absY = 0.0;     /** note: unused */
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
    this.fontSizeInherited = false;
    this.fontSizeBase = 14.0;
    this.rootFontSize = 14.0;
    this.fontFamily = "Noto Sans";
    this.fontWeight = "normal";
    this.lineHeight = 1.2;
    this.textAlign = "left";
    this.textContent = "";     /** note: unused */
    this.display = "block";
    this.flex = 0.0;
    this.flexShrink = 1.0;
    this.flexDirection = "column";
    this.justifyContent = "flex-start";
    this.alignItems = "flex-start";
    this.alignContent = "flex-start";
    this.flexWrap = "wrap";
    this.gridTemplateColumns = "";
    this.gridTemplateRows = "";
    this.subgridColumnSizes = [];     /** note: unused */
    this.subgridRowSizes = [];     /** note: unused */
    this.computedRowSizes = [];     /** note: unused */
    this.subgridPending = false;     /** note: unused */
    this.gridTemplateAreas = "";
    this.gridAutoFlow = "row";
    this.fullBleed = false;
    this.gridArea = "";
    this.gridColumn = "";
    this.gridRow = "";
    this.position = "relative";     /** note: unused */
    this.src = "";     /** note: unused */
    this.alt = "";     /** note: unused */
    this.imageViewBox = "";     /** note: unused */
    this.imageViewBoxX = 0.0;     /** note: unused */
    this.imageViewBoxY = 0.0;     /** note: unused */
    this.imageViewBoxW = 1.0;     /** note: unused */
    this.imageViewBoxH = 1.0;     /** note: unused */
    this.imageViewBoxSet = false;     /** note: unused */
    this.objectFit = "cover";
    this.sourceWidth = 0.0;     /** note: unused */
    this.sourceHeight = 0.0;     /** note: unused */
    this.svgPath = "";
    this.svgSource = "";
    this.viewBox = "";
    this.strokeWidth = 0.0;
    this.fillRule = "nonzero";
    this.strokeDashArray = "";
    this.strokeDashOffset = 0.0;
    this.clipPath = "";
    this.className = "";
    this.theme = "";
    this.inlineProps = [];
    this.imageQuality = 0;
    this.maxImageSize = 0;
    this.rotate = 0.0;
    this.scale = 1.0;
    this.translateX = 0.0;
    this.translateY = 0.0;
    this.transformSpec = "";
    this.transformOriginX = new EVGUnit();
    this.transformOriginY = new EVGUnit();
    this.transformOriginSpec = "";
    this.backgroundGradient = "";
    this.gradient = new EVGGradient();
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedInnerWidth = 0.0;     /** note: unused */
    this.calculatedInnerHeight = 0.0;     /** note: unused */
    this.calculatedFlexWidth = 0.0;     /** note: unused */
    this.calculatedFlexHeight = 0.0;     /** note: unused */
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    this.hasDefiniteHeight = false;
    this.calculatedPage = 0;     /** note: unused */
    this.isAbsolute = false;
    this.isOverlay = false;
    this.isOverlayAnchor = false;
    this.overlaySide = "bottom";
    this.overlayAlign = "start";
    this.overlayGap = 4.0;
    this.overlayX = 0.0;     /** note: unused */
    this.overlayY = 0.0;     /** note: unused */
    this.overlayPlacedSide = "";     /** note: unused */
    this.isHovered = false;     /** note: unused */
    this.isFocused = false;     /** note: unused */
    this.isPressed = false;     /** note: unused */
    this.transitionSpec = "";
    this.transitions = [];     /** note: unused */
    this.role = "";
    this.a11yLabel = "";
    this.a11yRoleDescription = "";
    this.a11yHidden = false;
    this.a11ySorted = 0;
    this.a11yChecked = 0;
    this.a11yExpanded = 0;
    this.a11ySelected = 0;
    this.a11yDisabled = false;
    this.a11yFocusable = false;
    this.a11yPosInSet = 0;     /** note: unused */
    this.a11ySetSize = 0;     /** note: unused */
    this.isLayoutComplete = false;     /** note: unused */
    this.unitsResolved = false;
    this.hasReturn = false;     /** note: unused */
    this.hasBreak = false;     /** note: unused */
    this.hasContinue = false;     /** note: unused */
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
    this.shadowRadius = EVGUnit.unset();
    this.shadowColor = EVGColor.noColor();
    this.shadowOffsetX = EVGUnit.unset();
    this.shadowOffsetY = EVGUnit.unset();
    this.imageOffsetX = EVGUnit.unset();
    this.imageOffsetY = EVGUnit.unset();
    this.fillColor = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
  }
  addChild (child) {
    this.children.push(child);
  };
  resetLayoutState () {
    this.unitsResolved = false;
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.hasDefiniteHeight = false;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    let i = 0;
    while (i < (this.children.length)) {
      const child = this.children[i];
      child.resetLayoutState();
      i = i + 1;
    };
  };
  getChildCount () {
    return this.children.length;
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
  hasAbsolutePosition () {
    if ( this.isOverlay ) {
      return true;
    }
    if ( (this.tagName == "layer") || (this.tagName == "Layer") ) {
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
    this.fontSizeBase = parentEl.inheritedFontSize;
    this.rootFontSize = parentEl.rootFontSize;
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
      this.fontSize.rootFontSize = this.rootFontSize;
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
    this.width.rootFontSize = rfs;
    this.height.rootFontSize = rfs;
    this.flexBasis.rootFontSize = rfs;
    this.minWidth.rootFontSize = rfs;
    this.minHeight.rootFontSize = rfs;
    this.maxWidth.rootFontSize = rfs;
    this.maxHeight.rootFontSize = rfs;
    this.left.rootFontSize = rfs;
    this.top.rootFontSize = rfs;
    this.right.rootFontSize = rfs;
    this.bottom.rootFontSize = rfs;
    this.x.rootFontSize = rfs;
    this.y.rootFontSize = rfs;
    this.shadowRadius.rootFontSize = rfs;
    this.shadowOffsetX.rootFontSize = rfs;
    this.shadowOffsetY.rootFontSize = rfs;
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
    this.box.resolveUnits(parentWidth, parentHeight, fs, rfs);
    this.shadowRadius.resolve(parentWidth, fs);
    this.shadowOffsetX.resolve(parentWidth, fs);
    this.shadowOffsetY.resolve(parentHeight, fs);
    this.isAbsolute = this.hasAbsolutePosition();
  };
  applyTransform (value) {
    this.transformSpec = value.trim();
    this.rotate = 0.0;
    this.scale = 1.0;
    this.translateX = 0.0;
    this.translateY = 0.0;
    if ( (this.transformSpec == "none") || ((this.transformSpec.length) == 0) ) {
      return;
    }
    const parts = EVGElement.splitWords(this.transformSpec);
    let a = 0.0;
    let sc = 1.0;
    let tx = 0.0;
    let ty = 0.0;
    let i = 0;
    while (i < (parts.length)) {
      const one = (parts[i]).trim();
      let b = 0.0;
      let s2 = 1.0;
      let ux = 0.0;
      let uy = 0.0;
      const args = EVGElement.callArgs(one, "rotate");
      if ( (args.length) > 0 ) {
        b = EVGElement.parseAngleDeg(args);
      } else {
        const sargs = EVGElement.callArgs(one, "scale");
        if ( (sargs.length) > 0 ) {
          const nums = EVGElement.numberList(sargs);
          if ( (nums.length) > 0 ) {
            s2 = nums[0];
          }
        } else {
          const targs = EVGElement.callArgs(one, "translate");
          if ( (targs.length) > 0 ) {
            const tn = EVGElement.numberList(targs);
            if ( (tn.length) > 0 ) {
              ux = tn[0];
            }
            if ( (tn.length) > 1 ) {
              uy = tn[1];
            }
          } else {
            const xargs = EVGElement.callArgs(one, "translateX");
            if ( (xargs.length) > 0 ) {
              const xn = EVGElement.numberList(xargs);
              if ( (xn.length) > 0 ) {
                ux = xn[0];
              }
            } else {
              const yargs = EVGElement.callArgs(one, "translateY");
              if ( (yargs.length) > 0 ) {
                const yn = EVGElement.numberList(yargs);
                if ( (yn.length) > 0 ) {
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
      tx = tx + (sc * ((ux * cs) - (uy * sn)));
      ty = ty + (sc * ((ux * sn) + (uy * cs)));
      a = a + b;
      sc = sc * s2;
      i = i + 1;
    };
    this.rotate = a;
    this.scale = sc;
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
    const first = (words[0]).trim();
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
    const second = (words[1]).trim();
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
  markInline (name) {
    const key = EVGElement.toKebab(name);
    if ( this.hasInline(key) == false ) {
      this.inlineProps.push(key);
    }
  };
  hasInline (name) {
    const key = EVGElement.toKebab(name);
    let i = 0;
    while (i < (this.inlineProps.length)) {
      if ( (this.inlineProps[i]) == key ) {
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
        const shrinkVal = isNaN( parseFloat((parts[1])) ) ? undefined : parseFloat((parts[1]));
        if ( typeof(shrinkVal) != "undefined" ) {
          this.flexShrink = shrinkVal;
        }
      }
      if ( n >= 3 ) {
        this.flexBasis = EVGUnit.parse((parts[2]));
      }
    } else {
      this.flexBasis = EVGUnit.parse(first);
      this.flex = 1.0;
    }
  };
  setAttribute (name, value) {
    if ( name == "className" ) {
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
      this.width = EVGUnit.parse(value);
      return;
    }
    if ( name == "height" ) {
      this.height = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-width") || (name == "minWidth") ) {
      this.minWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-height") || (name == "minHeight") ) {
      this.minHeight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-width") || (name == "maxWidth") ) {
      this.maxWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-height") || (name == "maxHeight") ) {
      this.maxHeight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "overlay") || (name == "isOverlay") ) {
      this.isOverlay = EVGElement.truthy(value);
      return;
    }
    if ( (name == "overlay-anchor-role") || (name == "overlayAnchorRole") ) {
      this.isOverlayAnchor = EVGElement.truthy(value);
      return;
    }
    if ( (name == "overlay-side") || (name == "overlaySide") ) {
      this.overlaySide = value.trim();
      return;
    }
    if ( (name == "overlay-align") || (name == "overlayAlign") ) {
      this.overlayAlign = value.trim();
      return;
    }
    if ( (name == "overlay-gap") || (name == "overlayGap") ) {
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
    if ( (name == "role") || (name == "a11yRole") ) {
      this.role = value.trim();
      return;
    }
    if ( (name == "aria-label") || (name == "a11yLabel") ) {
      this.a11yLabel = value;
      return;
    }
    if ( (name == "aria-sort") || (name == "a11ySorted") ) {
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
    if ( (name == "aria-hidden") || (name == "a11yHidden") ) {
      this.a11yHidden = EVGElement.truthy(value);
      return;
    }
    if ( (name == "aria-roledescription") || (name == "a11yRoleDescription") ) {
      this.a11yRoleDescription = value;
      return;
    }
    if ( (name == "aria-checked") || (name == "a11yChecked") ) {
      this.a11yChecked = EVGElement.triState(value);
      return;
    }
    if ( (name == "aria-expanded") || (name == "a11yExpanded") ) {
      this.a11yExpanded = EVGElement.triState(value);
      return;
    }
    if ( (name == "aria-selected") || (name == "a11ySelected") ) {
      this.a11ySelected = EVGElement.triState(value);
      return;
    }
    if ( (name == "aria-disabled") || (name == "a11yDisabled") ) {
      this.a11yDisabled = EVGElement.truthy(value);
      return;
    }
    if ( (name == "aria-focusable") || (name == "a11yFocusable") ) {
      this.a11yFocusable = EVGElement.truthy(value);
      return;
    }
    if ( name == "left" ) {
      this.left = EVGUnit.parse(value);
      return;
    }
    if ( name == "top" ) {
      this.top = EVGUnit.parse(value);
      return;
    }
    if ( name == "right" ) {
      this.right = EVGUnit.parse(value);
      return;
    }
    if ( name == "bottom" ) {
      this.bottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "x" ) {
      this.x = EVGUnit.parse(value);
      return;
    }
    if ( name == "y" ) {
      this.y = EVGUnit.parse(value);
      return;
    }
    if ( name == "margin" ) {
      const ms = EVGElement.boxSides(value, true);
      if ( (ms.length) == 4 ) {
        this.box.setMarginValues(ms[0], ms[1], ms[2], ms[3]);
      }
      return;
    }
    if ( (name == "margin-left") || (name == "marginLeft") ) {
      this.box.marginLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-right") || (name == "marginRight") ) {
      this.box.marginRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-top") || (name == "marginTop") ) {
      this.box.marginTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-bottom") || (name == "marginBottom") ) {
      this.box.marginBottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "padding" ) {
      const ps = EVGElement.boxSides(value, false);
      if ( (ps.length) == 4 ) {
        this.box.setPaddingValues(ps[0], ps[1], ps[2], ps[3]);
      }
      return;
    }
    if ( (name == "padding-left") || (name == "paddingLeft") ) {
      this.box.paddingLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-right") || (name == "paddingRight") ) {
      this.box.paddingRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-top") || (name == "paddingTop") ) {
      this.box.paddingTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-bottom") || (name == "paddingBottom") ) {
      this.box.paddingBottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "border" ) {
      const parts = EVGElement.splitWords(value);
      let i = 0;
      while (i < (parts.length)) {
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
    if ( (name == "border-width") || (name == "borderWidth") ) {
      this.box.borderWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "border-color") || (name == "borderColor") ) {
      this.box.borderColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "border-radius") || (name == "borderRadius") ) {
      this.box.borderRadius = EVGUnit.parse(value);
      return;
    }
    if ( name == "glow" ) {
      const gv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.glowIntensity = gv;
      return;
    }
    if ( (name == "background-image") || (name == "backgroundImage") ) {
      this.bgImageSet = true;
      this.bgImagePath = value;
      return;
    }
    if ( (name == "gradient-from") || (name == "gradientFrom") ) {
      this.gradientFrom = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( (name == "gradient-to") || (name == "gradientTo") ) {
      this.gradientTo = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( (name == "gradient-dir") || (name == "gradientDir") ) {
      const dv = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      this.gradientDir = dv;
      return;
    }
    if ( (name == "background-color") || (name == "backgroundColor") ) {
      this.backgroundColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "background-gradient") || (name == "backgroundGradient") ) {
      this.backgroundGradient = value;
      this.gradient = EVGGradient.parse(value);
      return;
    }
    if ( name == "background" ) {
      if ( (value.includes("linear-gradient")) || (value.includes("radial-gradient")) ) {
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
    if ( (name == "object-fit") || (name == "objectFit") ) {
      this.objectFit = value;
      return;
    }
    if ( (name == "image-offset-x") || (name == "imageOffsetX") ) {
      this.imageOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "image-offset-y") || (name == "imageOffsetY") ) {
      this.imageOffsetY = EVGUnit.parse(value);
      return;
    }
    if ( name == "direction" ) {
      if ( (value == "rtl") || (value == "ltr") ) {
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
    if ( (name == "vertical-align") || (name == "verticalAlign") ) {
      this.verticalAlign = value;
      return;
    }
    if ( name == "inline" ) {
      this.isInline = value == "true";
      return;
    }
    if ( (name == "line-break") || (name == "lineBreak") ) {
      this.lineBreak = value == "true";
      return;
    }
    if ( name == "overflow" ) {
      this.overflow = value;
      return;
    }
    if ( name == "display" ) {
      this.display = value;
      return;
    }
    if ( (name == "flex-direction") || (name == "flexDirection") ) {
      this.flexDirection = value;
      return;
    }
    if ( (name == "flex-wrap") || (name == "flexWrap") ) {
      this.flexWrap = value;
      return;
    }
    if ( (name == "flex-shrink") || (name == "flexShrink") ) {
      const sv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(sv) != "undefined" ) {
        this.flexShrink = sv;
      }
      return;
    }
    if ( (name == "flex-basis") || (name == "flexBasis") ) {
      this.flexBasis = EVGUnit.parse(value);
      return;
    }
    if ( name == "flex" ) {
      this.setFlexShorthand(value);
      return;
    }
    if ( name == "gap" ) {
      this.gap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "row-gap") || (name == "rowGap") ) {
      this.rowGap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "column-gap") || (name == "columnGap") ) {
      this.columnGap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "grid-template-columns") || (name == "gridTemplateColumns") ) {
      this.gridTemplateColumns = value;
      return;
    }
    if ( (name == "grid-template-rows") || (name == "gridTemplateRows") ) {
      this.gridTemplateRows = value;
      return;
    }
    if ( (name == "grid-template-areas") || (name == "gridTemplateAreas") ) {
      this.gridTemplateAreas = value;
      return;
    }
    if ( (name == "grid-auto-flow") || (name == "gridAutoFlow") ) {
      this.gridAutoFlow = value;
      return;
    }
    if ( (name == "full-bleed") || (name == "fullBleed") ) {
      this.fullBleed = (value == "true") || (value == "1");
      return;
    }
    if ( (name == "grid-area") || (name == "gridArea") ) {
      this.gridArea = value;
      return;
    }
    if ( (name == "grid-column") || (name == "gridColumn") ) {
      this.gridColumn = value;
      return;
    }
    if ( (name == "grid-row") || (name == "gridRow") ) {
      this.gridRow = value;
      return;
    }
    if ( (name == "justify-content") || (name == "justifyContent") ) {
      this.justifyContent = value;
      return;
    }
    if ( (name == "align-content") || (name == "alignContent") ) {
      this.alignContent = value;
      return;
    }
    if ( (name == "align-items") || (name == "alignItems") ) {
      this.alignItems = value;
      return;
    }
    if ( (name == "font-size") || (name == "fontSize") ) {
      this.fontSize = EVGUnit.parse(value);
      this.fontSizeInherited = false;
      return;
    }
    if ( (name == "font-family") || (name == "fontFamily") ) {
      this.fontFamily = value;
      return;
    }
    if ( (name == "font-weight") || (name == "fontWeight") ) {
      this.fontWeight = value;
      return;
    }
    if ( (name == "text-align") || (name == "textAlign") ) {
      this.textAlign = value;
      return;
    }
    if ( (name == "line-height") || (name == "lineHeight") ) {
      const val_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_1) != "undefined" ) {
        this.lineHeight = val_1;
      }
      return;
    }
    if ( name == "transform" ) {
      this.applyTransform(value);
      return;
    }
    if ( (name == "transform-origin") || (name == "transformOrigin") ) {
      this.applyTransformOrigin(value);
      return;
    }
    if ( (name == "translate-x") || (name == "translateX") ) {
      const tvx = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(tvx) != "undefined" ) {
        this.translateX = tvx;
      }
      return;
    }
    if ( (name == "translate-y") || (name == "translateY") ) {
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
    if ( (name == "shadow-radius") || (name == "shadowRadius") ) {
      this.shadowRadius = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-color") || (name == "shadowColor") ) {
      this.shadowColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "shadow-offset-x") || (name == "shadowOffsetX") ) {
      this.shadowOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-offset-y") || (name == "shadowOffsetY") ) {
      this.shadowOffsetY = EVGUnit.parse(value);
      return;
    }
    if ( (name == "clip-path") || (name == "clipPath") ) {
      this.clipPath = value;
      return;
    }
    if ( ((name == "d") || (name == "svgPath")) || (name == "path") ) {
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
    if ( (name == "d") || (name == "svgPath") ) {
      this.svgPath = value;
      return;
    }
    if ( (name == "svg") || (name == "svgSource") ) {
      this.svgSource = value;
      return;
    }
    if ( name == "viewBox" ) {
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
    if ( (name == "stroke-width") || (name == "strokeWidth") ) {
      const val_6 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_6) != "undefined" ) {
        this.strokeWidth = val_6;
      }
      return;
    }
    if ( (name == "stroke-dasharray") || (name == "strokeDasharray") ) {
      this.strokeDashArray = value;
      return;
    }
    if ( (name == "stroke-dashoffset") || (name == "strokeDashoffset") ) {
      const dv_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(dv_1) != "undefined" ) {
        this.strokeDashOffset = dv_1;
      }
      return;
    }
    if ( (name == "fill-rule") || (name == "fillRule") ) {
      if ( value == "evenodd" ) {
        this.fillRule = "evenodd";
      } else {
        this.fillRule = "nonzero";
      }
      return;
    }
  };
  getCalculatedBounds () {
    return (((((("(" + ((this.calculatedX.toString()))) + ", ") + ((this.calculatedY.toString()))) + ") ") + ((this.calculatedWidth.toString()))) + "x") + ((this.calculatedHeight.toString()));
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
EVGElement.toKebab = function(name) {
  let out = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const c = name.charCodeAt(i );
    if ( (c >= 65) && (c <= 90) ) {
      if ( i > 0 ) {
        out = out + "-";
      }
      out = out + (String.fromCharCode((c + 32)));
    } else {
      out = out + (String.fromCharCode(c));
    }
    i = i + 1;
  };
  return out;
};
EVGElement.isXKeyword = function(w) {
  return (w == "left") || (w == "right");
};
EVGElement.isYKeyword = function(w) {
  return (w == "top") || (w == "bottom");
};
EVGElement.originUnit = function(w) {
  if ( (w == "left") || (w == "top") ) {
    return EVGUnit.percent(0.0);
  }
  if ( (w == "right") || (w == "bottom") ) {
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
  if ( (u.unitType == 1) || (u.unitType == 3) ) {
    return (u.value / 100.0) * size;
  }
  return u.value;
};
EVGElement.transformProblem = function(value) {
  const v = value.trim();
  if ( (v == "none") || ((v.length) == 0) ) {
    return "";
  }
  const parts = EVGElement.splitWords(v);
  let i = 0;
  while (i < (parts.length)) {
    const one = (parts[i]).trim();
    let known = false;
    if ( (EVGElement.callArgs(one, "rotate").length) > 0 ) {
      known = true;
    }
    if ( (EVGElement.callArgs(one, "scale").length) > 0 ) {
      known = true;
    }
    if ( (EVGElement.callArgs(one, "translate").length) > 0 ) {
      known = true;
    }
    if ( (EVGElement.callArgs(one, "translateX").length) > 0 ) {
      known = true;
    }
    if ( (EVGElement.callArgs(one, "translateY").length) > 0 ) {
      known = true;
    }
    if ( known == false ) {
      return "Unsupported transform (rotate, scale, translate, translateX, translateY): " + one;
    }
    const sargs = EVGElement.callArgs(one, "scale");
    if ( (sargs.length) > 0 ) {
      const nums = EVGElement.numberList(sargs);
      if ( (nums.length) > 1 ) {
        if ( (Math.abs(((nums[0]) - (nums[1])))) > 0.0001 ) {
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
  if ( tl < (nl2 + 3) ) {
    return "";
  }
  if ( (one.substring(0, nl2 )) != name ) {
    return "";
  }
  if ( (one.charCodeAt(nl2 )) != 40 ) {
    return "";
  }
  if ( (one.charCodeAt((tl - 1) )) != 41 ) {
    return "";
  }
  const inner = one.substring((nl2 + 1), (tl - 1) );
  if ( (inner.length) == 0 ) {
    return "";
  }
  return inner;
};
EVGElement.numberList = function(s) {
  let out = [];
  const parts = EVGElement.splitOnChar(s, 44);
  let i = 0;
  while (i < (parts.length)) {
    out.push(EVGElement.leadingNumber((parts[i])));
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
    if ( (s.charCodeAt(i )) == ch ) {
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
  while (scanning && (stop < n)) {
    const c = t.charCodeAt(stop );
    const digit = (c >= 48) && (c <= 57);
    const signOrDot = ((c == 45) || (c == 43)) || (c == 46);
    if ( digit || signOrDot ) {
      stop = stop + 1;
    } else {
      scanning = false;
    }
  };
  if ( stop == 0 ) {
    return 0.0;
  }
  const v = isNaN( parseFloat((t.substring(0, stop ))) ) ? undefined : parseFloat((t.substring(0, stop )));
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
    const four = t.substring((n - 4), n );
    if ( four == "turn" ) {
      return v * 360.0;
    }
    if ( four == "grad" ) {
      return (v * 360.0) / 400.0;
    }
  }
  if ( n > 3 ) {
    const three = t.substring((n - 3), n );
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
      if ( (cur.length) > 0 ) {
        out.push(cur);
        cur = "";
      }
    } else {
      cur = cur + (String.fromCharCode(c));
    }
    i = i + 1;
  };
  if ( (cur.length) > 0 ) {
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
EVGElement.looksLikeColor = function(tok) {
  if ( (tok.length) == 0 ) {
    return false;
  }
  const c = tok.charCodeAt(0 );
  if ( (c >= 48) && (c <= 57) ) {
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
    const isDigit = (c >= 48) && (c <= 57);
    if ( isDigit ) {
      digits = digits + 1;
    } else {
      if ( ((c != 46) && (c != 45)) && (c != 43) ) {
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
    const isSpace = ((c == 32) || (c == 9)) || ((c == 10) || (c == 13));
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
  initClear (w, h) {
    this.width = w;
    this.height = h;
    this.pixels = (function(){ var b = new ArrayBuffer(((w * h) * 4)); b._view = new DataView(b); return b; })();
  };
  fillTransparent () {
    const size = (this.width * this.height) * 4;
    (function(b,v,s,e){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(this.pixels,0,0,size);
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
class EvgBitmapTracer  {
  constructor() {
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
    this.regionOf = [];
    this.regionCount = 0;
    this.bgMask = [];
    this.bgActive = false;
    this.layers = [];
    this.options = EvgTraceOptions.defaults();
    this.bitmap = EvgBinaryBitmap.create(0, 0);
    let r = [];
    this.rings = r;
    let c_2 = [];
    this.commands = c_2;
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
    el.viewBox = (("0 0 " + ((this.width.toString()))) + " ") + ((this.height.toString()));
    el.fillColor = EVGColor.parse(this.options.fillHex);
    if ( (this.layers.length) > 0 ) {
      const layer0 = this.layers[0];
      el.svgPath = layer0.pathData;
      el.fillColor = EVGColor.parse(layer0.fillHex);
    }
    el.width = EVGUnit.px((this.width));
    el.height = EVGUnit.px((this.height));
    return el;
  };
  toEVGElements () {
    let out = [];
    let i = 0;
    while (i < (this.layers.length)) {
      const layer = this.layers[i];
      const el = EVGElement.createPath();
      el.svgPath = layer.pathData;
      el.fillRule = "evenodd";
      el.viewBox = (("0 0 " + ((this.width.toString()))) + " ") + ((this.height.toString()));
      el.fillColor = EVGColor.parse(layer.fillHex);
      el.width = EVGUnit.px((this.width));
      el.height = EVGUnit.px((this.height));
      out.push(el);
      i = i + 1;
    };
    return out;
  };
  toSVG () {
    let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" ";
    svg = ((svg + "width=\"") + ((this.width.toString()))) + "\" ";
    svg = ((svg + "height=\"") + ((this.height.toString()))) + "\" ";
    svg = ((((svg + "viewBox=\"0 0 ") + ((this.width.toString()))) + " ") + ((this.height.toString()))) + "\">";
    if ( (this.layers.length) > 0 ) {
      let defs = "";
      let i = 0;
      while (i < (this.layers.length)) {
        const layer = this.layers[i];
        const id = "g" + ((i.toString()));
        if ( layer.fillKind == "linear" ) {
          defs = ((defs + "<linearGradient id=\"") + id) + "\" gradientUnits=\"userSpaceOnUse\"";
          defs = ((((defs + " x1=\"") + EvgBitmapTracer.num(layer.gx0)) + "\" y1=\"") + EvgBitmapTracer.num(layer.gy0)) + "\"";
          defs = ((((defs + " x2=\"") + EvgBitmapTracer.num(layer.gx1)) + "\" y2=\"") + EvgBitmapTracer.num(layer.gy1)) + "\">";
          defs = ((defs + "<stop offset=\"0\" stop-color=\"") + layer.stopA) + "\"/>";
          defs = ((defs + "<stop offset=\"1\" stop-color=\"") + layer.stopB) + "\"/></linearGradient>";
        }
        i = i + 1;
      };
      if ( (defs.length) > 0 ) {
        svg = ((svg + "<defs>") + defs) + "</defs>";
      }
      i = 0;
      while (i < (this.layers.length)) {
        const layer2 = this.layers[i];
        let fill = layer2.fillHex;
        if ( layer2.fillKind != "flat" ) {
          fill = ("url(#g" + ((i.toString()))) + ")";
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
    if ( (this.okLin.length) == 0 ) {
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
      return (this.bgMask[i]) == 0;
    }
    return true;
  };
  detectBackground () {
    this.bgActive = false;
    const mode = this.options.bgMode;
    const named = mode == "color";
    if ( (mode != "auto") && (named == false) ) {
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
      border.push(((this.height - 1) * this.width) + x);
      x = x + 1;
    };
    let y = 1;
    while (y < (this.height - 1)) {
      border.push(y * this.width);
      border.push((y * this.width) + (this.width - 1));
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
      if ( (this.planeA[idx]) >= 16 ) {
        const r = this.planeR[idx];
        const g = this.planeG[idx];
        const b = this.planeB[idx];
        const key = ((((((r / 8) | 0)) * 32) + (((g / 8) | 0))) * 32) + (((b / 8) | 0));
        cnt[key] = (cnt[key]) + 1;
        sr[key] = (sr[key]) + r;
        sg[key] = (sg[key]) + g;
        sb[key] = (sb[key]) + b;
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
      if ( (cnt[i]) > topC ) {
        topC = cnt[i];
        topI = i;
      }
      i = i + 1;
    };
    if ( topI < 0 ) {
      return;
    }
    let bgR = (((sr[topI]) / topC) | 0);
    let bgG = (((sg[topI]) / topC) | 0);
    let bgB = (((sb[topI]) / topC) | 0);
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
        if ( (this.planeA[idx2]) >= 16 ) {
          if ( this.nearBg(idx2, bgR, bgG, bgB, tol) ) {
            within = within + 1;
          }
        }
        i = i + 1;
      };
      if ( ((((within * 100) / opaqueBorder) | 0)) < 80 ) {
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
      if ( (mask[s0]) == 0 ) {
        if ( this.nearBg(s0, bgR, bgG, bgB, tol) ) {
          mask[s0] = 1;
          stack.push(s0);
        }
      }
      i = i + 1;
    };
    let head = 0;
    while (head < (stack.length)) {
      const cur = stack[head];
      head = head + 1;
      const cy = ((cur / this.width) | 0);
      const cx = cur - (cy * this.width);
      if ( cx > 0 ) {
        this.floodStep(cur - 1, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cx < (this.width - 1) ) {
        this.floodStep(cur + 1, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cy > 0 ) {
        this.floodStep(cur - this.width, mask, stack, bgR, bgG, bgB, tol);
      }
      if ( cy < (this.height - 1) ) {
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
      if ( (mask[s0]) == 0 ) {
        if ( this.brightEnough(s0, lim) ) {
          mask[s0] = 1;
          stack.push(s0);
        }
      }
      i = i + 1;
    };
    if ( (stack.length) == 0 ) {
      return;
    }
    let head = 0;
    while (head < (stack.length)) {
      const cur = stack[head];
      head = head + 1;
      const cy = ((cur / this.width) | 0);
      const cx = cur - (cy * this.width);
      if ( cx > 0 ) {
        this.brightStep(cur - 1, mask, stack, lim);
      }
      if ( cx < (this.width - 1) ) {
        this.brightStep(cur + 1, mask, stack, lim);
      }
      if ( cy > 0 ) {
        this.brightStep(cur - this.width, mask, stack, lim);
      }
      if ( cy < (this.height - 1) ) {
        this.brightStep(cur + this.width, mask, stack, lim);
      }
    };
    this.bgMask = mask;
    this.bgActive = true;
  };
  brightEnough (i, lim) {
    if ( (this.planeA[i]) < 16 ) {
      return true;
    }
    return EvgBitmapTracer.lumaOf((this.planeR[i]), (this.planeG[i]), (this.planeB[i])) >= lim;
  };
  brightStep (i, mask, stack, lim) {
    if ( (mask[i]) == 1 ) {
      return;
    }
    if ( this.brightEnough(i, lim) == false ) {
      return;
    }
    mask[i] = 1;
    stack.push(i);
  };
  nearBg (i, bgR, bgG, bgB, tol) {
    if ( (this.planeA[i]) < 16 ) {
      return true;
    }
    if ( EvgBitmapTracer.absI(((this.planeR[i]) - bgR)) > tol ) {
      return false;
    }
    if ( EvgBitmapTracer.absI(((this.planeG[i]) - bgG)) > tol ) {
      return false;
    }
    if ( EvgBitmapTracer.absI(((this.planeB[i]) - bgB)) > tol ) {
      return false;
    }
    return true;
  };
  floodStep (i, mask, stack, bgR, bgG, bgB, tol) {
    if ( (mask[i]) != 0 ) {
      return;
    }
    if ( this.nearBg(i, bgR, bgG, bgB, tol) ) {
      mask[i] = 1;
      stack.push(i);
    }
  };
  pixelDelta (i, j) {
    let d = EvgBitmapTracer.absI(((this.planeR[i]) - (this.planeR[j])));
    const dg = EvgBitmapTracer.absI(((this.planeG[i]) - (this.planeG[j])));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI(((this.planeB[i]) - (this.planeB[j])));
    if ( db > d ) {
      d = db;
    }
    const da = EvgBitmapTracer.absI(((this.planeA[i]) - (this.planeA[j])));
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
        const idx = (y * this.width) + x;
        let isFlat = true;
        if ( x > 0 ) {
          if ( this.pixelDelta(idx, (idx - 1)) > tol ) {
            isFlat = false;
          }
        }
        if ( x < (this.width - 1) ) {
          if ( this.pixelDelta(idx, (idx + 1)) > tol ) {
            isFlat = false;
          }
        }
        if ( y > 0 ) {
          if ( this.pixelDelta(idx, (idx - this.width)) > tol ) {
            isFlat = false;
          }
        }
        if ( y < (this.height - 1) ) {
          if ( this.pixelDelta(idx, (idx + this.width)) > tol ) {
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
    const hasFlat = (this.flat.length) == n;
    i = 0;
    while (i < n) {
      let take = this.pixelAllowed(i);
      if ( (take && flatOnly) && hasFlat ) {
        if ( (this.flat[i]) == 0 ) {
          take = false;
        }
      }
      if ( take ) {
        const r = this.planeR[i];
        const g = this.planeG[i];
        const b = this.planeB[i];
        const key = ((((((r / 8) | 0)) * 32) + (((g / 8) | 0))) * 32) + (((b / 8) | 0));
        cnt[key] = (cnt[key]) + 1;
        sumR[key] = (sumR[key]) + r;
        sumG[key] = (sumG[key]) + g;
        sumB[key] = (sumB[key]) + b;
      }
      i = i + 1;
    };
    i = 0;
    while (i < bins) {
      const c = cnt[i];
      if ( c > 0 ) {
        binR.push((((sumR[i]) / c) | 0));
        binG.push((((sumG[i]) / c) | 0));
        binB.push((((sumB[i]) / c) | 0));
        binW.push(c);
      }
      i = i + 1;
    };
  };
  parsePaletteHex (outR, outG, outB) {
    const n = this.options.paletteHex.length;
    let i = 0;
    while (i < n) {
      const c = EVGColor.parse((this.options.paletteHex[i]));
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
    if ( (this.okLin.length) == 0 ) {
      this.okLin = EvgTraceColor.buildLinearTable();
    }
    this.okC.setFrom(this.okLin, r, g, b);
    const c = this.okC;
    const ca = c.a;
    const cb = c.b;
    const mag = Math.sqrt(((ca * ca) + (cb * cb)));
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
    if ( (this.okLin.length) == 0 ) {
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
    const meanMag = Math.sqrt(((meanA * meanA) + (meanB * meanB)));
    let dirA = 0.0;
    let dirB = 1.0;
    if ( meanMag > 0.000001 ) {
      dirA = meanA / meanMag;
      dirB = meanB / meanMag;
    }
    const wd = (warm) / 1000.0;
    const floorC = (tint) / 1000.0;
    const ms = (mute) / 100.0;
    const cs = (contrast) / 100.0;
    i = 0;
    while (i < k) {
      const la = cas[i];
      const lb = (cbs[i]) + wd;
      const mag = Math.sqrt(((la * la) + (lb * lb)));
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
      let lightness = meanL + (((ls[i]) - meanL) * cs);
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
    const mul = 1.0 + ((g2 / 100.0) * c);
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
    if ( (binR.length) < 2 ) {
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
      total = total + (binW[i]);
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
        if ( (binW[i]) > bestW ) {
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
      dist.push(this.dist2((binR[i]), (binG[i]), (binB[i]), (outR[0]), (outG[0]), (outB[0])));
      i = i + 1;
    };
    let seeded = 1;
    while (seeded < (outR.length)) {
      i = 0;
      while (i < m) {
        const d0 = this.dist2((binR[i]), (binG[i]), (binB[i]), (outR[seeded]), (outG[seeded]), (outB[seeded]));
        if ( d0 < (dist[i]) ) {
          dist[i] = d0;
        }
        i = i + 1;
      };
      seeded = seeded + 1;
    };
    while ((outR.length) < want) {
      let pickI = 0 - 1;
      let pickScore = 0.0;
      i = 0;
      while (i < m) {
        if ( (binW[i]) >= floorW ) {
          const bw = this.binWeight((binW[i]), (binR[i]), (binG[i]), (binB[i]));
          const score = this.seedScore(bw, (dist[i]));
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
          const d = this.dist2((binR[i]), (binG[i]), (binB[i]), cr, cg, cb);
          if ( d < (dist[i]) ) {
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
        const w = this.binWeight((binW[i]), br, bg, bb);
        sumR[best] = (sumR[best]) + ((br) * w);
        sumG[best] = (sumG[best]) + ((bg) * w);
        sumB[best] = (sumB[best]) + ((bb) * w);
        wgt[best] = (wgt[best]) + w;
        dist[i] = 0.0;
        i = i + 1;
      };
      let moved = false;
      ki = locked;
      while (ki < k) {
        const wk = wgt[ki];
        if ( wk > 0.0 ) {
          const nr = Math.floor( ((sumR[ki]) / wk));
          const ng = Math.floor( ((sumG[ki]) / wk));
          const nb = Math.floor( ((sumB[ki]) / wk));
          if ( ((nr != (outR[ki])) || (ng != (outG[ki]))) || (nb != (outB[ki])) ) {
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
            const br2 = binR[i];
            const bg2 = binG[i];
            const bb2 = binB[i];
            const near = this.nearestIndex(br2, bg2, bb2, outR, outG, outB);
            const dd = this.dist2(br2, bg2, bb2, (outR[near]), (outG[near]), (outB[near]));
            const bw2 = this.binWeight((binW[i]), br2, bg2, bb2);
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
        const la = EvgBitmapTracer.lumaOf((outR[a]), (outG[a]), (outB[a]));
        const lb = EvgBitmapTracer.lumaOf((outR[bIdx]), (outG[bIdx]), (outB[bIdx]));
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
        const idx = this.nearestIndex((binR[i]), (binG[i]), (binB[i]), outR, outG, outB);
        wgt[idx] = (wgt[idx]) + (binW[i]);
        i = i + 1;
      };
      let dropAt = 0 - 1;
      let a = 0;
      while ((a < k) && (dropAt < 0)) {
        let b = a + 1;
        while ((b < k) && (dropAt < 0)) {
          const d = this.dist2((outR[a]), (outG[a]), (outB[a]), (outR[b]), (outG[b]), (outB[b]));
          if ( d <= limit ) {
            if ( b < locked ) {
            } else {
              if ( a < locked ) {
                dropAt = b;
              } else {
                if ( (wgt[a]) >= (wgt[b]) ) {
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
    let bestD = this.dist2(r, g, b, (palR[0]), (palG[0]), (palB[0]));
    let j = 1;
    while (j < k) {
      const d = this.dist2(r, g, b, (palR[j]), (palG[j]), (palB[j]));
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
        const lab = this.nearestIndex((this.planeR[i]), (this.planeG[i]), (this.planeB[i]), palR, palG, palB);
        base[i] = lab;
        dists[i] = this.dist2((this.planeR[i]), (this.planeG[i]), (this.planeB[i]), (palR[lab]), (palG[lab]), (palB[lab]));
      }
      i = i + 1;
    };
    let outL = [];
    i = 0;
    while (i < n) {
      outL.push(base[i]);
      i = i + 1;
    };
    const hasFlat = (this.flat.length) == n;
    if ( this.options.edgeSnap && hasFlat ) {
      const ratio = this.options.snapRatio;
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          const idx = (y * this.width) + x;
          const gLab = base[idx];
          if ( (gLab >= 0) && ((this.flat[idx]) == 0) ) {
            const gD = dists[idx];
            const pr = this.planeR[idx];
            const pg = this.planeG[idx];
            const pb = this.planeB[idx];
            let nLab = 0 - 1;
            let nD = 0.0;
            let dy = 0 - 1;
            while (dy <= 1) {
              const yy = y + dy;
              if ( (yy >= 0) && (yy < this.height) ) {
                let dx = 0 - 1;
                while (dx <= 1) {
                  const xx = x + dx;
                  if ( (xx >= 0) && (xx < this.width) ) {
                    const nIdx = (yy * this.width) + xx;
                    if ( (this.flat[nIdx]) == 1 ) {
                      const lab2 = base[nIdx];
                      if ( lab2 >= 0 ) {
                        const d = this.dist2(pr, pg, pb, (palR[lab2]), (palG[lab2]), (palB[lab2]));
                        if ( (nLab < 0) || (d < nD) ) {
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
            if ( (nLab >= 0) && (nLab != gLab) ) {
              if ( nD <= ((gD * ratio) + 1.0) ) {
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
    if ( (seen[i]) != 0 ) {
      return;
    }
    if ( (this.labels[i]) < 0 ) {
      return;
    }
    if ( this.isBoundary(from, i, edgeTol) ) {
      return;
    }
    const cnt = acc[3];
    if ( cnt > 0 ) {
      const mr = (((acc[0]) / cnt) | 0);
      const mg = (((acc[1]) / cnt) | 0);
      const mb = (((acc[2]) / cnt) | 0);
      let d = EvgBitmapTracer.absI(((this.planeR[i]) - mr));
      const dg = EvgBitmapTracer.absI(((this.planeG[i]) - mg));
      if ( dg > d ) {
        d = dg;
      }
      const db = EvgBitmapTracer.absI(((this.planeB[i]) - mb));
      if ( db > d ) {
        d = db;
      }
      if ( d > spread ) {
        return;
      }
    }
    seen[i] = 1;
    stack.push(i);
    acc[0] = (acc[0]) + (this.planeR[i]);
    acc[1] = (acc[1]) + (this.planeG[i]);
    acc[2] = (acc[2]) + (this.planeB[i]);
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
      lum.push(EvgBitmapTracer.lumaOf((this.planeR[i]), (this.planeG[i]), (this.planeB[i])));
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
          if ( (yy >= 0) && (yy < this.height) ) {
            let dx = 0 - r;
            while (dx <= r) {
              const xx = x + dx;
              if ( (xx >= 0) && (xx < this.width) ) {
                const q = (yy * this.width) + xx;
                const lab = this.labels[q];
                if ( lab >= 0 ) {
                  if ( lab < marks ) {
                    if ( (mark[lab]) != visit ) {
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
          if ( (hi - lo) >= minSpread ) {
            dm[(y * this.width) + x] = 1;
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
        if ( (dm[((gy * this.width) + gx)]) == 1 ) {
          let dy2 = 0 - r;
          while (dy2 <= r) {
            const yy2 = gy + dy2;
            if ( (yy2 >= 0) && (yy2 < this.height) ) {
              let dx2 = 0 - r;
              while (dx2 <= r) {
                const xx2 = gx + dx2;
                if ( (xx2 >= 0) && (xx2 < this.width) ) {
                  grown[(yy2 * this.width) + xx2] = 1;
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
      lum.push(EvgBitmapTracer.lumaOf((this.planeR[i]), (this.planeG[i]), (this.planeB[i])));
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
    while (y < (this.height - 1)) {
      let x = 1;
      while (x < (this.width - 1)) {
        const idx = (y * this.width) + x;
        const gx = (lum[(idx + 1)]) - (lum[(idx - 1)]);
        const gy = (lum[(idx + this.width)]) - (lum[(idx - this.width)]);
        mag[idx] = EvgBitmapTracer.absI(gx) + EvgBitmapTracer.absI(gy);
        x = x + 1;
      };
      y = y + 1;
    };
    y = 1;
    while (y < (this.height - 1)) {
      let x2 = 1;
      while (x2 < (this.width - 1)) {
        const idx2 = (y * this.width) + x2;
        const m = mag[idx2];
        if ( m > edgeTol ) {
          const gx2 = (lum[(idx2 + 1)]) - (lum[(idx2 - 1)]);
          const gy2 = (lum[(idx2 + this.width)]) - (lum[(idx2 - this.width)]);
          const ax = EvgBitmapTracer.absI(gx2);
          const ay = EvgBitmapTracer.absI(gy2);
          let a = 0;
          let b = 0;
          if ( ax > (ay * 2) ) {
            a = idx2 - 1;
            b = idx2 + 1;
          } else {
            if ( ay > (ax * 2) ) {
              a = idx2 - this.width;
              b = idx2 + this.width;
            } else {
              if ( (gx2 * gy2) > 0 ) {
                a = (idx2 - this.width) - 1;
                b = (idx2 + this.width) + 1;
              } else {
                a = (idx2 - this.width) + 1;
                b = (idx2 + this.width) - 1;
              }
            }
          }
          if ( (m >= (mag[a])) && (m >= (mag[b])) ) {
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
      if ( ((keep[start]) == 1) && ((seen[start]) == 0) ) {
        let comp = [];
        let stack = [];
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < (stack.length)) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - (cy * this.width);
          let dy = 0 - 1;
          while (dy <= 1) {
            const yy = cy + dy;
            if ( (yy >= 0) && (yy < this.height) ) {
              let dx = 0 - 1;
              while (dx <= 1) {
                const xx = cx + dx;
                if ( (xx >= 0) && (xx < this.width) ) {
                  const j = (yy * this.width) + xx;
                  if ( ((keep[j]) == 1) && ((seen[j]) == 0) ) {
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
        if ( (comp.length) < minRun ) {
          let c = 0;
          while (c < (comp.length)) {
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
    if ( (this.edgeMask[b]) == 1 ) {
      return true;
    }
    return (this.edgeMask[a]) == 1;
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
      if ( ((seen[start]) == 0) && ((this.labels[start]) >= 0) ) {
        let stack = [];
        let acc = [];
        acc.push(this.planeR[start]);
        acc.push(this.planeG[start]);
        acc.push(this.planeB[start]);
        acc.push(1);
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < (stack.length)) {
          const cur = stack[head];
          head = head + 1;
          ro[cur] = rid;
          const cy = ((cur / this.width) | 0);
          const cx = cur - (cy * this.width);
          if ( cx > 0 ) {
            this.contourStep(cur - 1, cur, seen, stack, acc, edgeTol, spread);
          }
          if ( cx < (this.width - 1) ) {
            this.contourStep(cur + 1, cur, seen, stack, acc, edgeTol, spread);
          }
          if ( cy > 0 ) {
            this.contourStep(cur - this.width, cur, seen, stack, acc, edgeTol, spread);
          }
          if ( cy < (this.height - 1) ) {
            this.contourStep(cur + this.width, cur, seen, stack, acc, edgeTol, spread);
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
        sumR[r] = (sumR[r]) + (this.planeR[i]);
        sumG[r] = (sumG[r]) + (this.planeG[i]);
        sumB[r] = (sumB[r]) + (this.planeB[i]);
        cnt[r] = (cnt[r]) + 1;
      }
      i = i + 1;
    };
    let lab = [];
    i = 0;
    while (i < k) {
      const c = cnt[i];
      if ( c > 0 ) {
        lab.push(this.nearestIndex(((((sumR[i]) / c) | 0)), ((((sumG[i]) / c) | 0)), ((((sumB[i]) / c) | 0)), palR, palG, palB));
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
        size[r] = (size[r]) + 1;
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
        const idx = (y * this.width) + x;
        const r0 = this.regionOf[idx];
        if ( (r0 >= 0) && ((size[r0]) < minPx) ) {
          if ( x < (this.width - 1) ) {
            this.tallyNeighbour(r0, this.regionOf[(idx + 1)], size, minPx, bestN, bestR);
          }
          if ( x > 0 ) {
            this.tallyNeighbour(r0, this.regionOf[(idx - 1)], size, minPx, bestN, bestR);
          }
          if ( y < (this.height - 1) ) {
            this.tallyNeighbour(r0, this.regionOf[(idx + this.width)], size, minPx, bestN, bestR);
          }
          if ( y > 0 ) {
            this.tallyNeighbour(r0, this.regionOf[(idx - this.width)], size, minPx, bestN, bestR);
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
    i = 0;
    while (i < k) {
      if ( (bestR[i]) >= 0 ) {
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
        if ( (remap[t]) < 0 ) {
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
    if ( (bestR[mine]) < 0 ) {
      bestR[mine] = other;
      bestN[mine] = sz;
      return;
    }
    if ( sz > (bestN[mine]) ) {
      bestR[mine] = other;
      bestN[mine] = sz;
    }
  };
  hexOf (r, g, b) {
    return this.hexFromRgb(EvgBitmapTracer.clamp255(r), EvgBitmapTracer.clamp255(g), EvgBitmapTracer.clamp255(b));
  };
  traceGradientRegions (palR, palG, palB) {
    this.buildContourRegions();
    let floorPx = this.options.minRegion;
    if ( floorPx < 8 ) {
      floorPx = 8;
    }
    let prev = this.regionCount + 1;
    let guard = 0;
    while ((this.regionCount < prev) && (guard < 24)) {
      prev = this.regionCount;
      this.absorbTinyRegions(floorPx);
      guard = guard + 1;
    };
    guard = 0;
    while ((this.regionCount > 2000) && (guard < 8)) {
      floorPx = floorPx * 2;
      prev = this.regionCount + 1;
      let inner = 0;
      while ((this.regionCount < prev) && (inner < 24)) {
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
        const idx = (y * this.width) + x;
        const r = this.regionOf[idx];
        if ( r >= 0 ) {
          const dx = x;
          const dy = y;
          rn[r] = (rn[r]) + 1.0;
          rsx[r] = (rsx[r]) + dx;
          rsy[r] = (rsy[r]) + dy;
          rsxx[r] = (rsxx[r]) + (dx * dx);
          rsyy[r] = (rsyy[r]) + (dy * dy);
          rsxy[r] = (rsxy[r]) + (dx * dy);
          let c2 = 0;
          while (c2 < 3) {
            const v = this.planeAt(c2, idx);
            const j = (r * 3) + c2;
            sv[j] = (sv[j]) + v;
            sxv[j] = (sxv[j]) + (dx * v);
            syv[j] = (syv[j]) + (dy * v);
            svv[j] = (svv[j]) + (v * v);
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
        const j2 = (i * 3) + c3;
        EvgBitmapTracer.solveLinear(rn[i], rsx[i], rsy[i], rsxx[i], rsxy[i], rsyy[i], sv[j2], sxv[j2], syv[j2], sol);
        if ( (sol[0]) < 0.5 ) {
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
      const bl = ((0.299 * (lb[((i * 3) + 0)])) + (0.587 * (lb[((i * 3) + 1)]))) + (0.114 * (lb[((i * 3) + 2)]));
      const cl = ((0.299 * (lc[((i * 3) + 0)])) + (0.587 * (lc[((i * 3) + 1)]))) + (0.114 * (lc[((i * 3) + 2)]));
      const mag = Math.sqrt(((bl * bl) + (cl * cl)));
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
        const idx2 = (y * this.width) + x2;
        const r2 = this.regionOf[idx2];
        if ( r2 >= 0 ) {
          const cnt = rn[r2];
          const mx = (rsx[r2]) / cnt;
          const my = (rsy[r2]) / cnt;
          const ddx = (x2) - mx;
          const ddy = (y) - my;
          const dist = Math.sqrt(((ddx * ddx) + (ddy * ddy)));
          rsd[r2] = (rsd[r2]) + dist;
          rsdd[r2] = (rsdd[r2]) + (dist * dist);
          if ( dist > (dmax[r2]) ) {
            dmax[r2] = dist;
          }
          const tproj = (ddx * (ux[r2])) + (ddy * (uy[r2]));
          if ( tproj < (tmin[r2]) ) {
            tmin[r2] = tproj;
          }
          if ( tproj > (tmax[r2]) ) {
            tmax[r2] = tproj;
          }
          let c5 = 0;
          while (c5 < 3) {
            const j3 = (r2 * 3) + c5;
            rsdv[j3] = (rsdv[j3]) + (dist * (this.planeAt(c5, idx2)));
            c5 = c5 + 1;
          };
        }
        x2 = x2 + 1;
      };
      y = y + 1;
    };
    this.emitRegionLayers(palR, palG, palB, k, rn, rsx, rsy, sv, svv, sxv, syv, la, lb, lc, lok, rsd, rsdd, rsdv, tmin, tmax, dmax, ux, uy);
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
        if ( (rn[(order[b])]) > (rn[(order[a])]) ) {
          const tmp = order[a];
          order[a] = order[b];
          order[b] = tmp;
        }
        b = b + 1;
      };
      a = a + 1;
    };
    const gain = (this.options.gradientGain) / 100.0;
    let allCmds = [];
    let oi = 0;
    while (oi < k) {
      const r = order[oi];
      const cnt = rn[r];
      if ( cnt > 0.0 ) {
        const mx = (rsx[r]) / cnt;
        const my = (rsy[r]) / cnt;
        let eFlat = 0.0;
        let eLin = 0.0;
        let eRad = 0.0;
        let ra = [];
        let rb = [];
        let c = 0;
        while (c < 3) {
          const j = (r * 3) + c;
          const n2 = cnt;
          const s1 = sv[j];
          eFlat = eFlat + ((svv[j]) - ((s1 * s1) / n2));
          if ( (lok[r]) > 0.5 ) {
            eLin = eLin + ((svv[j]) - ((((la[j]) * s1) + ((lb[j]) * (sxv[j]))) + ((lc[j]) * (syv[j]))));
          } else {
            eLin = eLin + 1000000000.0;
          }
          const den = (n2 * (rsdd[r])) - ((rsd[r]) * (rsd[r]));
          if ( EvgBitmapTracer.absD(den) > 0.000001 ) {
            const bb = ((n2 * (rsdv[j])) - ((rsd[r]) * s1)) / den;
            const aa = (s1 - (bb * (rsd[r]))) / n2;
            ra.push(aa);
            rb.push(bb);
            eRad = eRad + ((svv[j]) - ((aa * s1) + (bb * (rsdv[j]))));
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
          if ( (eFlat - best) < (eFlat * gain) ) {
            kind = "flat";
          }
          if ( eFlat < (cnt * 3.0) ) {
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
          const meanR = (sv[((r * 3) + 0)]) / cnt;
          const meanG = (sv[((r * 3) + 1)]) / cnt;
          const meanB = (sv[((r * 3) + 2)]) / cnt;
          const gi = this.nearestIndex(EvgBitmapTracer.clamp255(meanR), EvgBitmapTracer.clamp255(meanG), EvgBitmapTracer.clamp255(meanB), palR, palG, palB);
          layer.fillHex = this.hexFromRgb((palR[gi]), (palG[gi]), (palB[gi]));
          layer.fillKind = kind;
          if ( kind == "linear" ) {
            const t0 = tmin[r];
            const t1 = tmax[r];
            if ( (t1 - t0) < 2.0 ) {
              kind = "flat";
              layer.fillKind = "flat";
            }
            layer.gx0 = mx + ((ux[r]) * t0);
            layer.gy0 = my + ((uy[r]) * t0);
            layer.gx1 = mx + ((ux[r]) * t1);
            layer.gy1 = my + ((uy[r]) * t1);
            layer.stopA = this.hexOf(this.linAt(la, lb, lc, r, 0, layer.gx0, layer.gy0), this.linAt(la, lb, lc, r, 1, layer.gx0, layer.gy0), this.linAt(la, lb, lc, r, 2, layer.gx0, layer.gy0));
            layer.stopB = this.hexOf(this.linAt(la, lb, lc, r, 0, layer.gx1, layer.gy1), this.linAt(la, lb, lc, r, 1, layer.gx1, layer.gy1), this.linAt(la, lb, lc, r, 2, layer.gx1, layer.gy1));
          }
          this.layers.push(layer);
          const cmds = sub.getCommands();
          let ci = 0;
          while (ci < (cmds.length)) {
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
    if ( (this.layers.length) > 0 ) {
      const first = this.layers[0];
      this.pathData = first.pathData;
    }
  };
  linAt (la, lb, lc, r, c, x, y) {
    const j = (r * 3) + c;
    return ((la[j]) + ((lb[j]) * x)) + ((lc[j]) * y);
  };
  maskForRegion (rid) {
    const bm = EvgBinaryBitmap.create(this.width, this.height);
    const n = this.width * this.height;
    let i = 0;
    while (i < n) {
      if ( (this.regionOf[i]) == rid ) {
        const y = ((i / this.width) | 0);
        const x = i - (y * this.width);
        bm.setBit(x, y, true);
        if ( x > 0 ) {
          bm.setBit(x - 1, y, true);
        }
        if ( x < (this.width - 1) ) {
          bm.setBit(x + 1, y, true);
        }
        if ( y > 0 ) {
          bm.setBit(x, y - 1, true);
        }
        if ( y < (this.height - 1) ) {
          bm.setBit(x, y + 1, true);
        }
      }
      i = i + 1;
    };
    return bm;
  };
  coveredAlready (i, paintR, paintG, paintB, painted, tol) {
    if ( (painted[i]) == 0 ) {
      return false;
    }
    let d = EvgBitmapTracer.absI(((this.planeR[i]) - (paintR[i])));
    const dg = EvgBitmapTracer.absI(((this.planeG[i]) - (paintG[i])));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI(((this.planeB[i]) - (paintB[i])));
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
      const dx = (idx - (yy * this.width));
      const dy = yy;
      sx = sx + dx;
      sy = sy + dy;
      sxx = sxx + (dx * dx);
      syy = syy + (dy * dy);
      sxy = sxy + (dx * dy);
      c = 0;
      while (c < 3) {
        const v = this.planeAt(c, idx);
        sv[c] = (sv[c]) + v;
        sxv[c] = (sxv[c]) + (dx * v);
        syv[c] = (syv[c]) + (dy * v);
        svv[c] = (svv[c]) + (v * v);
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
      eFlat = eFlat + ((svv[c]) - ((s1 * s1) / cnt));
      EvgBitmapTracer.solveLinear(cnt, sx, sy, sxx, sxy, syy, s1, sxv[c], syv[c], sol);
      if ( (sol[0]) > 0.5 ) {
        la.push(sol[1]);
        lb.push(sol[2]);
        lc.push(sol[3]);
        eLin = eLin + ((svv[c]) - ((((sol[1]) * s1) + ((sol[2]) * (sxv[c]))) + ((sol[3]) * (syv[c]))));
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
    if ( (eLin < 0.0) || (cnt < 64.0) ) {
      eLin = 1000000000.0;
    }
    const gain = (this.options.gradientGain) / 100.0;
    let best = eFlat;
    let useLin = false;
    if ( eLin < best ) {
      best = eLin;
      useLin = true;
    }
    if ( (eFlat - best) < (eFlat * gain) ) {
      useLin = false;
    }
    if ( eFlat < (cnt * 3.0) ) {
      useLin = false;
    }
    const mR = EvgBitmapTracer.clamp255(((sv[0]) / cnt));
    const mG = EvgBitmapTracer.clamp255(((sv[1]) / cnt));
    const mB = EvgBitmapTracer.clamp255(((sv[2]) / cnt));
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
    const bl = ((0.299 * (lb[0])) + (0.587 * (lb[1]))) + (0.114 * (lb[2]));
    const cl = ((0.299 * (lc[0])) + (0.587 * (lc[1]))) + (0.114 * (lc[2]));
    const mag = Math.sqrt(((bl * bl) + (cl * cl)));
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
      const t = ((((p1 - (y1 * this.width))) - mx) * ux) + (((y1) - my) * uy);
      if ( t < tmin ) {
        tmin = t;
      }
      if ( t > tmax ) {
        tmax = t;
      }
      paintR[p1] = EvgBitmapTracer.clamp255(this.linAt(la, lb, lc, 0, 0, ((p1 - (y1 * this.width))), (y1)));
      paintG[p1] = EvgBitmapTracer.clamp255(this.linAt(la, lb, lc, 0, 1, ((p1 - (y1 * this.width))), (y1)));
      paintB[p1] = EvgBitmapTracer.clamp255(this.linAt(la, lb, lc, 0, 2, ((p1 - (y1 * this.width))), (y1)));
      i = i + 1;
    };
    if ( (tmax - tmin) < 2.0 ) {
      layer.fillKind = "flat";
      return;
    }
    layer.fillKind = "linear";
    layer.gx0 = mx + (ux * tmin);
    layer.gy0 = my + (uy * tmin);
    layer.gx1 = mx + (ux * tmax);
    layer.gy1 = my + (uy * tmax);
    layer.stopA = this.hexOf(this.linAt(la, lb, lc, 0, 0, layer.gx0, layer.gy0), this.linAt(la, lb, lc, 0, 1, layer.gx0, layer.gy0), this.linAt(la, lb, lc, 0, 2, layer.gx0, layer.gy0));
    layer.stopB = this.hexOf(this.linAt(la, lb, lc, 0, 0, layer.gx1, layer.gy1), this.linAt(la, lb, lc, 0, 1, layer.gx1, layer.gy1), this.linAt(la, lb, lc, 0, 2, layer.gx1, layer.gy1));
  };
  traceDetailShapes (allCmds, minPx) {
    const k = this.options.detailColors;
    if ( k < 2 ) {
      return;
    }
    const n = this.width * this.height;
    if ( (this.detailMask.length) != n ) {
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
      if ( ((this.detailMask[start]) == 1) && ((seen[start]) == 0) ) {
        let comp = [];
        let stack = [];
        seen[start] = 1;
        stack.push(start);
        let head = 0;
        while (head < (stack.length)) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - (cy * this.width);
          if ( cx > 0 ) {
            this.detailVisit(cur - 1, seen, stack);
          }
          if ( cx < (this.width - 1) ) {
            this.detailVisit(cur + 1, seen, stack);
          }
          if ( cy > 0 ) {
            this.detailVisit(cur - this.width, seen, stack);
          }
          if ( cy < (this.height - 1) ) {
            this.detailVisit(cur + this.width, seen, stack);
          }
        };
        if ( (comp.length) >= (needPx * k) ) {
          this.paintDetailCluster(comp, k, needPx, allCmds, shR, shG, shB);
        }
      }
      start = start + 1;
    };
  };
  detailVisit (i, seen, stack) {
    if ( (seen[i]) == 1 ) {
      return;
    }
    if ( (this.detailMask[i]) == 0 ) {
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
      const dr = EvgBitmapTracer.absI((r - (shR[i])));
      const dg = EvgBitmapTracer.absI((g - (shG[i])));
      const db = EvgBitmapTracer.absI((b - (shB[i])));
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
    if ( (best >= 0) && (bestD <= tol) ) {
      return best;
    }
    const cap = this.options.detailColorMax;
    if ( (cap > 0) && (n >= cap) ) {
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
    while (c < (comp.length)) {
      const px = comp[c];
      const r = this.planeR[px];
      const g = this.planeG[px];
      const b = this.planeB[px];
      const l = EvgBitmapTracer.lumaOf(r, g, b);
      binN[l] = (binN[l]) + 1;
      binR[l] = (binR[l]) + r;
      binG[l] = (binG[l]) + g;
      binB[l] = (binB[l]) + b;
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
        sR = sR + (binR[i]);
        sG = sG + (binG[i]);
        sB = sB + (binB[i]);
        sN = sN + cnt;
        acc = acc + cnt;
      }
      const edge = (((total * band) / k) | 0);
      if ( (acc >= edge) && (band < k) ) {
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
        const want = this.shareColor((lpR[bi]), (lpG[bi]), (lpB[bi]), merge, shR, shG, shB);
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
    while (c < (comp.length)) {
      const q = comp[c];
      const qy = ((q / this.width) | 0);
      const qx = q - (qy * this.width);
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
      while (c < (comp.length)) {
        const p2 = comp[c];
        const py = ((p2 / this.width) | 0);
        const pxx = p2 - (py * this.width);
        const near = this.nearestIndex((this.planeR[p2]), (this.planeG[p2]), (this.planeB[p2]), lpR, lpG, lpB);
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
        layerOpts.fillHex = this.hexFromRgb((lpR[li]), (lpG[li]), (lpB[li]));
        layerOpts.pathFormat = this.options.pathFormat;
        layerOpts.pathPrecision = this.options.pathPrecision;
        const sub = EvgBitmapTracer.fromBinary(mask, layerOpts);
        sub.trace();
        if ( sub.ringCount() > 0 ) {
          const cmds = sub.getCommands();
          const ox = bx0;
          const oy = by0;
          let ci = 0;
          while (ci < (cmds.length)) {
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
      if ( (lab >= 0) && (lab < (palR.length)) ) {
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
        const idx0 = (y0 * this.width) + x0;
        if ( (this.labels[idx0]) >= 0 ) {
          let st = 0;
          if ( x0 > 0 ) {
            if ( this.isBoundary(idx0, (idx0 - 1), edgeTol) ) {
              st = this.pixelDelta(idx0, (idx0 - 1));
            }
          }
          if ( x0 < (this.width - 1) ) {
            if ( this.isBoundary(idx0, (idx0 + 1), edgeTol) ) {
              const s1 = this.pixelDelta(idx0, (idx0 + 1));
              if ( s1 > st ) {
                st = s1;
              }
            }
          }
          if ( y0 > 0 ) {
            if ( this.isBoundary(idx0, (idx0 - this.width), edgeTol) ) {
              const s2 = this.pixelDelta(idx0, (idx0 - this.width));
              if ( s2 > st ) {
                st = s2;
              }
            }
          }
          if ( y0 < (this.height - 1) ) {
            if ( this.isBoundary(idx0, (idx0 + this.width), edgeTol) ) {
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
      if ( ((shapeNo % 4) == 3) && (sweepFrom < n) ) {
        while ((sweepFrom < n) && (seed < 0)) {
          if ( ((this.labels[sweepFrom]) >= 0) && ((painted[sweepFrom]) == 0) ) {
            seed = sweepFrom;
          }
          sweepFrom = sweepFrom + 1;
        };
      }
      while ((seed < 0) && (empty == false)) {
        const cand = this.popSeed(bucket, seedPixel, seedNext);
        if ( cand < 0 ) {
          empty = true;
        } else {
          if ( (this.labels[cand]) >= 0 ) {
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
        while ((sweepFrom < n) && (seed < 0)) {
          if ( ((this.labels[sweepFrom]) >= 0) && ((painted[sweepFrom]) == 0) ) {
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
        while (h2 < (stack.length)) {
          const cur = stack[h2];
          h2 = h2 + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - (cy * this.width);
          if ( cx > 0 ) {
            this.overlayStep(cur - 1, cur, stamp, stack, acc, bucket, seedPixel, seedNext, seedBest, shapeNo, edgeTol, spread, simTol, paintR, paintG, paintB, painted);
          }
          if ( cx < (this.width - 1) ) {
            this.overlayStep(cur + 1, cur, stamp, stack, acc, bucket, seedPixel, seedNext, seedBest, shapeNo, edgeTol, spread, simTol, paintR, paintG, paintB, painted);
          }
          if ( cy > 0 ) {
            this.overlayStep(cur - this.width, cur, stamp, stack, acc, bucket, seedPixel, seedNext, seedBest, shapeNo, edgeTol, spread, simTol, paintR, paintG, paintB, painted);
          }
          if ( cy < (this.height - 1) ) {
            this.overlayStep(cur + this.width, cur, stamp, stack, acc, bucket, seedPixel, seedNext, seedBest, shapeNo, edgeTol, spread, simTol, paintR, paintG, paintB, painted);
          }
        };
        const cnt = acc[3];
        let mr = (((acc[0]) / cnt) | 0);
        let mg = (((acc[1]) / cnt) | 0);
        let mb = (((acc[2]) / cnt) | 0);
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
        while (c < (comp.length)) {
          const px = comp[c];
          if ( (painted[px]) == 1 ) {
            if ( ((paintR[px]) == mr) && ((paintG[px]) == mg) ) {
              if ( (paintB[px]) == mb ) {
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
        const addsNothing = sameBelow == (comp.length);
        let needPx = minPx;
        if ( this.isDetail(seed) ) {
          needPx = ((minPx / this.options.detailBoost) | 0);
          if ( needPx < 4 ) {
            needPx = 4;
          }
        }
        if ( ((comp.length) >= needPx) && (addsNothing == false) ) {
          let bx0 = this.width;
          let by0 = this.height;
          let bx1 = 0;
          let by1 = 0;
          c = 0;
          while (c < (comp.length)) {
            const q = comp[c];
            const qy = ((q / this.width) | 0);
            const qx = q - (qy * this.width);
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
          while (c < (comp.length)) {
            const p2 = comp[c];
            const yy = ((p2 / this.width) | 0);
            bm.setBit((p2 - (yy * this.width)) - bx0, yy - by0, true);
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
            while (ci < (cmds.length)) {
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
    if ( (this.layers.length) > 0 ) {
      const first = this.layers[0];
      this.pathData = first.pathData;
    }
  };
  isDetail (i) {
    if ( this.detailOn == false ) {
      return false;
    }
    return (this.detailMask[i]) == 1;
  };
  pushSeed (px, strength, bucket, seedPixel, seedNext, seedBest) {
    let s = strength;
    if ( s < 0 ) {
      s = 0;
    }
    if ( s > 255 ) {
      s = 255;
    }
    if ( s <= (seedBest[px]) ) {
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
    if ( (stamp[i]) == shapeNo ) {
      return;
    }
    if ( (this.labels[i]) < 0 ) {
      return;
    }
    if ( this.options.overlayFollowBase ) {
      if ( this.isDetail(i) == false ) {
        if ( (this.labels[i]) != (this.labels[from]) ) {
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
    const mr = (((acc[0]) / cnt) | 0);
    const mg = (((acc[1]) / cnt) | 0);
    const mb = (((acc[2]) / cnt) | 0);
    let d = EvgBitmapTracer.absI(((this.planeR[i]) - mr));
    const dg = EvgBitmapTracer.absI(((this.planeG[i]) - mg));
    if ( dg > d ) {
      d = dg;
    }
    const db = EvgBitmapTracer.absI(((this.planeB[i]) - mb));
    if ( db > d ) {
      d = db;
    }
    if ( d > spread ) {
      return;
    }
    stamp[i] = shapeNo;
    stack.push(i);
    acc[0] = (acc[0]) + (this.planeR[i]);
    acc[1] = (acc[1]) + (this.planeG[i]);
    acc[2] = (acc[2]) + (this.planeB[i]);
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
      if ( (lab >= 0) && ((seen[start]) == 0) ) {
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
        while (head < (stack.length)) {
          const cur = stack[head];
          head = head + 1;
          comp.push(cur);
          const cy = ((cur / this.width) | 0);
          const cx = cur - (cy * this.width);
          if ( cx > 0 ) {
            this.compStep(cur - 1, lab, seen, stack, touch);
          }
          if ( cx < (this.width - 1) ) {
            this.compStep(cur + 1, lab, seen, stack, touch);
          }
          if ( cy > 0 ) {
            this.compStep(cur - this.width, lab, seen, stack, touch);
          }
          if ( cy < (this.height - 1) ) {
            this.compStep(cur + this.width, lab, seen, stack, touch);
          }
        };
        if ( (comp.length) < minPx ) {
          let bestLab = 0 - 1;
          let bestN = 0;
          ki = 0;
          while (ki < k) {
            if ( (touch[ki]) > bestN ) {
              bestN = touch[ki];
              bestLab = ki;
            }
            ki = ki + 1;
          };
          if ( bestLab >= 0 ) {
            let absorb = true;
            if ( keepOn && (lab >= 0) ) {
              const gap = this.dist2((palR[lab]), (palG[lab]), (palB[lab]), (palR[bestLab]), (palG[bestLab]), (palB[bestLab]));
              if ( gap >= keepLimit ) {
                absorb = false;
              }
            }
            if ( absorb ) {
              c = 0;
              while (c < (comp.length)) {
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
      if ( (seen[i]) == 0 ) {
        seen[i] = 1;
        stack.push(i);
      }
      return;
    }
    if ( other >= 0 ) {
      touch[other] = (touch[other]) + 1;
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
        const idx = (y * this.width) + x;
        const me = src[idx];
        if ( me >= 0 ) {
          let agree = 0 - 2;
          let same = true;
          let cnt = 0;
          if ( x > 0 ) {
            const l = src[(idx - 1)];
            if ( agree == (0 - 2) ) {
              agree = l;
            }
            if ( l != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( x < (this.width - 1) ) {
            const r = src[(idx + 1)];
            if ( agree == (0 - 2) ) {
              agree = r;
            }
            if ( r != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( y > 0 ) {
            const u = src[(idx - this.width)];
            if ( agree == (0 - 2) ) {
              agree = u;
            }
            if ( u != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( y < (this.height - 1) ) {
            const dn = src[(idx + this.width)];
            if ( agree == (0 - 2) ) {
              agree = dn;
            }
            if ( dn != agree ) {
              same = false;
            }
            cnt = cnt + 1;
          }
          if ( (same && (cnt >= 3)) && (agree != me) ) {
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
      if ( (stacked && (lab >= colorIndex)) && (lab >= 0) ) {
        take = true;
      }
      if ( take ) {
        const y = ((i / this.width) | 0);
        const x = i - (y * this.width);
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
            if ( (yy >= 0) && (yy < this.height) ) {
              let dx = 0 - 1;
              while (dx <= 1) {
                const xx = x + dx;
                if ( (xx >= 0) && (xx < this.width) ) {
                  const j = (yy * this.width) + xx;
                  idxs.push(j);
                  lum.push(EvgBitmapTracer.lumaOf((srcR[j]), (srcG[j]), (srcB[j])));
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
            while ((b >= 0) && ((lum[b]) > lv)) {
              lum[b + 1] = lum[b];
              idxs[b + 1] = idxs[b];
              b = b - 1;
            };
            lum[b + 1] = lv;
            idxs[b + 1] = iv;
            a = a + 1;
          };
          const pick = idxs[(((k / 2) | 0))];
          const here = (y * this.width) + x;
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
      layerOpts.fillHex = this.hexFromRgb((palR[li]), (palG[li]), (palB[li]));
      const sub = EvgBitmapTracer.fromBinary(mask, layerOpts);
      sub.trace();
      if ( sub.ringCount() > 0 ) {
        const layer = sub.layers[0];
        this.layers.push(layer);
        const cmds = sub.getCommands();
        let ci = 0;
        while (ci < (cmds.length)) {
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
    if ( (mode == "fixed") || (mode == "seeded") ) {
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
    if ( (this.layers.length) > 0 ) {
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
        const x0 = idx - (y0 * work.w);
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
      while (a <= (i - 1)) {
        if ( (bm).at((x + a), ((y + i) - 1)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( (bm).at(((x + i) - 1), ((y + a) - 1)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( (bm).at(((x + a) - 1), (y - i)) ) {
          ct = ct + 1;
        } else {
          ct = ct - 1;
        }
        if ( (bm).at((x - i), (y + a)) ) {
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
    if ( (this.bitmap).at(x0, y0) ) {
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
        path.area = path.area - (x * diry);
        if ( (x == x0) && (y == y0) ) {
          done = true;
        } else {
          const lx = EvgBitmapTracer.idivTowardZero(((dirx + diry) - 1), 2);
          const ly = EvgBitmapTracer.idivTowardZero(((diry - dirx) - 1), 2);
          const rx = EvgBitmapTracer.idivTowardZero(((dirx - diry) - 1), 2);
          const ry = EvgBitmapTracer.idivTowardZero(((diry + dirx) - 1), 2);
          const l = (bm).at((x + lx), (y + ly));
          const r = (bm).at((x + rx), (y + ry));
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
    while (ri < (this.rings.length)) {
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
      return 0 - ((((0 - a) / b) | 0));
    }
    return (((0 - a) / (0 - b)) | 0);
  }
  if ( b < 0 ) {
    return 0 - (((a / (0 - b)) | 0));
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
    sum = sum + ((i) * (cnt));
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
        sumB = sumB + ((i) * (c2));
        const mB = sumB / (wB);
        const mF = (sum - sumB) / (wF);
        const diff = mB - mF;
        const between = ((diff * diff) * (wB)) * (wF);
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
  const scaled = Math.floor( ((v * 100.0) + 0.5));
  const whole = ((scaled / 100) | 0);
  let frac = scaled - (whole * 100);
  if ( frac < 0 ) {
    frac = 0 - frac;
  }
  let fs = (frac.toString());
  if ( frac < 10 ) {
    fs = "0" + fs;
  }
  return (((whole.toString())) + ".") + fs;
};
EvgBitmapTracer.colorDist2 = function(r0, g0, b0, r1, g1, b1, lw) {
  const dr = (r0 - r1);
  const dg = (g0 - g1);
  const db = (b0 - b1);
  const l0 = EvgBitmapTracer.lumaOf(r0, g0, b0);
  const l1 = EvgBitmapTracer.lumaOf(r1, g1, b1);
  const dl = (l0 - l1);
  return (((dr * dr) + (dg * dg)) + (db * db)) + ((dl * dl) * (lw));
};
EvgBitmapTracer.lumaOf = function(r, g, b) {
  return (((((r * 299) + (g * 587)) + (b * 114)) / 1000) | 0);
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
  const det = ((n * ((sxx * syy) - (sxy * sxy))) - (sx * ((sx * syy) - (sxy * sy)))) + (sy * ((sx * sxy) - (sxx * sy)));
  if ( EvgBitmapTracer.absD(det) < 0.000001 ) {
    out[0] = 0.0;
    return;
  }
  const da = ((v0 * ((sxx * syy) - (sxy * sxy))) - (sx * ((v1 * syy) - (sxy * v2)))) + (sy * ((v1 * sxy) - (sxx * v2)));
  const db = ((n * ((v1 * syy) - (v2 * sxy))) - (v0 * ((sx * syy) - (sxy * sy)))) + (sy * ((sx * v2) - (v1 * sy)));
  const dc = ((n * ((sxx * v2) - (sxy * v1))) - (sx * ((sx * v2) - (v1 * sy)))) + (v0 * ((sx * sxy) - (sxx * sy)));
  out[0] = 1.0;
  out[1] = da / det;
  out[2] = db / det;
  out[3] = dc / det;
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
    this.chunkSize = 4096;
    this.currentChunk = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.currentPos = 0;
    this.totalSize = 0;
    this.currentPos = 0;
    this.totalSize = 0;
    const initSize = 4096;
    this.currentChunk = (function(){ var b = new ArrayBuffer(initSize); b._view = new DataView(b); return b; })();
  }
  setChunkSize (size) {
    this.chunkSize = size;
  };
  allocateNewChunk () {
    this.chunks.push(this.currentChunk);
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
  getSize () {
    return this.totalSize;
  };
  toBuffer () {
    const size = this.totalSize;
    let result = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    let destPos = 0;
    const numChunks = this.chunks.length;
    const chSize = this.chunkSize;
    let i = 0;
    while (i < numChunks) {
      const chunk = this.chunks[i];
      let j = 0;
      while (j < chSize) {
        const b = chunk._view.getUint8(j);
        result._view.setUint8(destPos, b);
        destPos = destPos + 1;
        j = j + 1;
      };
      i = i + 1;
    };
    const curPos = this.currentPos;
    const curChunk = this.currentChunk;
    let j_1 = 0;
    while (j_1 < curPos) {
      const b_1 = curChunk._view.getUint8(j_1);
      result._view.setUint8(destPos, b_1);
      destPos = destPos + 1;
      j_1 = j_1 + 1;
    };
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
    return (((((b0 * 256) + b1) * 256) + b2) * 256) + b3;
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
    const count = Math.floor( ((chunkLen) / 3.0));
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
      out._view.setUint8(i, src._view.getUint8((start + i)));
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
    if ( (pa <= pb) && (pa <= pc) ) {
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
    let out = (function(){ var b = new ArrayBuffer((rowBytes * imgHeight)); b._view = new DataView(b); return b; })();
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
          recon = fv + (((left_1 + up_1) >> 1));
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
          if ( (x >= bpp) && (y > 0) ) {
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
        const o = (y * rowBytes) + x;
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
    return Math.floor( (((bits + 7)) / 8.0));
  };
  decodeIndexedPixels (img, indices, rowBytes, depth) {
    const imgW = img.width;
    let y = 0;
    while (y < this.height) {
      if ( depth == 8 ) {
        let x = 0;
        while (x < this.width) {
          const idx = indices._view.getUint8(((y * rowBytes) + x));
          if ( idx < this.paletteCount ) {
            const a = this.paletteA[idx];
            if ( a > 0 ) {
              const off = ((y * imgW) + x) * 4;
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
          const packed = indices._view.getUint8(((y * rowBytes) + byteIdx));
          const hi = (packed >> 4);
          const lo = (packed & 15);
          if ( hi < this.paletteCount ) {
            const aHi = this.paletteA[hi];
            if ( aHi > 0 ) {
              const offHi = ((y * imgW) + x_1) * 4;
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
                const offLo = ((y * imgW) + x2) * 4;
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
        const off = (y * rowBytes) + (x * 4);
        const a = indices._view.getUint8((off + 3));
        if ( a > 0 ) {
          const dstOff = ((y * imgW) + x) * 4;
          img.pixels._view.setUint8(dstOff, indices._view.getUint8(off));
          img.pixels._view.setUint8(dstOff + 1, indices._view.getUint8((off + 1)));
          img.pixels._view.setUint8(dstOff + 2, indices._view.getUint8((off + 2)));
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
        const off = (y * rowBytes) + (x * 3);
        const dstOff = ((y * imgW) + x) * 4;
        img.pixels._view.setUint8(dstOff, indices._view.getUint8(off));
        img.pixels._view.setUint8(dstOff + 1, indices._view.getUint8((off + 1)));
        img.pixels._view.setUint8(dstOff + 2, indices._view.getUint8((off + 2)));
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
    const bytes = (function(){ var b = require('fs').readFileSync(dir + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( (bytes.byteLength) < 24 ) {
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
      if ( (this.bitDepth != 8) && (this.bitDepth != 4) ) {
        console.log("[png_decoder] indexed depth unsupported: " + ((this.bitDepth.toString())));
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
    if ( ((this.colorType != 3) && (this.colorType != 6)) && (this.colorType != 2) ) {
      console.log("[png_decoder] unsupported color type " + ((this.colorType.toString())));
      return fail;
    }
    const zlibBuf = this.idatData.toBuffer();
    const inflated = this.inflateZlib(zlibBuf);
    if ( (inflated.byteLength) <= 0 ) {
      console.log("[png_decoder] inflate failed");
      return fail;
    }
    const rowBytes = this.rowByteCount(this.width, this.bitDepth, this.colorType);
    const bpp = this.filterBpp(this.colorType);
    const indices = this.unfilter(inflated, rowBytes, this.height, bpp);
    const need = rowBytes * this.height;
    if ( (indices.byteLength) < need ) {
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
      dir = spritesheetsRoot + (relativePath.substring(0, (slash + 1) ));
      file = relativePath.substring((slash + 1), (relativePath.length) );
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
          if ( (nextByte >= 208) && (nextByte <= 215) ) {
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
  skipRestartMarker () {
    if ( (this.bytePos + 1) >= this.dataEnd ) {
      return false;
    }
    const byte1 = this.data._view.getUint8(this.bytePos);
    const byte2 = this.data._view.getUint8((this.bytePos + 1));
    if ( ((byte1 == 255) && (byte2 >= 208)) && (byte2 <= 215) ) {
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
      value = value - (((threshold << 1)) - 1);
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
        console.log((((("  Huffman table " + classStr) + ((tableId.toString()))) + ": ") + ((totalSymbols.toString()))) + " symbols");
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
      if ( (input[(startIdx + (uc * stride))]) != 0 ) {
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
        output[outIdx + (fx * outStride)] = flat;
        fx = fx + 1;
      };
      return;
    }
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
    const low = this.data._view.getUint8((pos + 1));
    return (high * 256) + low;
  };
  parseSOF (pos, length) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8((pos + 5));
    this.say(((((("  Image: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
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
      this.say((((((("    Component " + ((comp.id.toString()))) + ": ") + ((comp.hSamp.toString()))) + "x") + ((comp.vSamp.toString()))) + " sampling, quant table ") + ((comp.quantTableId.toString())));
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( (((this.width + this.mcuWidth) - 1) / this.mcuWidth));
    this.mcusPerCol = Math.floor( (((this.height + this.mcuHeight) - 1) / this.mcuHeight));
    this.say((((((("  MCU size: " + ((this.mcuWidth.toString()))) + "x") + ((this.mcuHeight.toString()))) + ", grid: ") + ((this.mcusPerRow.toString()))) + "x") + ((this.mcusPerCol.toString())));
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
      this.say(((("  Quantization table " + ((tableId.toString()))) + " (") + (((precision_1 + 1).toString()))) + "-byte values)");
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
          this.say((((("    Component " + ((compId.toString()))) + ": DC table ") + ((comp.dcTableId.toString()))) + ", AC table ") + ((comp.acTableId.toString())));
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
          if ( (nextB >= 208) && (nextB <= 215) ) {
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
    if ( (m1 != 255) || (m2 != 216) ) {
      this.say("Error: Not a JPEG file (missing SOI)");
      return false;
    }
    pos = 2;
    this.say("Parsing JPEG markers...");
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
        this.say("  End of Image");
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
        this.say(("  DRI (Restart Interval: " + ((this.restartInterval.toString()))) + ")");
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
    const bytes = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    return this.decodeBytes(bytes);
  };
  decodeBytes (bytes) {
    this.reset();
    this.huffman.quiet = this.quiet;
    this.data = bytes;
    this.dataLen = this.data.byteLength;
    this.say(("Decoding JPEG in-memory (" + ((this.dataLen.toString()))) + " bytes)");
    const ok = this.parseMarkers();
    if ( ok == false ) {
      this.say("Error parsing JPEG markers");
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( (this.width == 0) || (this.height == 0) ) {
      this.say("Error: Invalid image dimensions");
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    this.say(("Decoding " + ((this.scanDataLen.toString()))) + " bytes of scan data...");
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
        if ( ((this.restartInterval > 0) && (mcuCount > 0)) && ((mcuCount % this.restartInterval) == 0) ) {
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
        this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
        mcuX = mcuX + 1;
        mcuCount = mcuCount + 1;
      };
      mcuY = mcuY + 1;
      if ( (mcuY % 10) == 0 ) {
        this.say((("  Row " + ((mcuY.toString()))) + "/") + ((this.mcusPerCol.toString())));
      }
    };
    this.say("Decode complete!");
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
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 1) ) {
      let blockX_1 = 0;
      while (blockX_1 < 2) {
        const yBlockOffset_1 = blockX_1 * 64;
        let py_2 = 0;
        while (py_2 < 8) {
          let px_2 = 0;
          while (px_2 < 8) {
            const imgX_2 = (baseX + (blockX_1 * 8)) + px_2;
            const imgY_2 = baseY + py_2;
            if ( (imgX_2 < this.width) && (imgY_2 < this.height) ) {
              const yIdx_1 = (yBlockOffset_1 + (py_2 * 8)) + px_2;
              const y_2 = yBlocksData[yIdx_1];
              const chromaX_1 = (blockX_1 * 4) + ((px_2 >> 1));
              const chromaY_1 = py_2;
              const chromaIdx_1 = (chromaY_1 * 8) + chromaX_1;
              let cb_2 = 128;
              let cr_2 = 128;
              if ( this.numComponents >= 3 ) {
                cb_2 = cbBlock[chromaIdx_1];
                cr_2 = crBlock[chromaIdx_1];
              }
              let r_2 = y_2 + (((359 * (cr_2 - 128)) >> 8));
              let g_2 = (y_2 - (((88 * (cb_2 - 128)) >> 8))) - (((183 * (cr_2 - 128)) >> 8));
              let b_2 = y_2 + (((454 * (cb_2 - 128)) >> 8));
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
          if ( (imgX_3 < this.width) && (imgY_3 < this.height) ) {
            const y_3 = yBlocksData[((py_3 * 8) + px_3)];
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
    let i_6 = 0;
    while (i_6 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_6 = i_6 + 1;
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
            let blockCoeffs = new Int32Array(64);
            let k = 0;
            while (k < 64) {
              blockCoeffs[k] = (yBuf).get(blockIdx, k);
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
            blockCoeffs_1[k_1] = (cbBuf).get(cbBlockIdx, k_1);
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
            crCoeffs[k_1] = (crBuf).get(crBlockIdx, k_1);
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
class EvgTraceCli  {
  constructor() {
  }
  applyOption (o, name, value) {
    if ( name == "turdsize" ) {
      o.turdsize = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "alphamax" ) {
      o.alphamax = EvgTraceCli.parseDouble(value);
      return true;
    }
    if ( name == "turnpolicy" ) {
      o.turnpolicy = value;
      return true;
    }
    if ( name == "optcurve" ) {
      o.optcurve = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "opttolerance" ) {
      o.opttolerance = EvgTraceCli.parseDouble(value);
      return true;
    }
    if ( name == "threshold" ) {
      o.threshold = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "blackOnWhite" ) {
      o.blackOnWhite = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "fillHex" ) {
      o.fillHex = value;
      return true;
    }
    if ( name == "colorCount" ) {
      o.colorCount = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "skipLuma" ) {
      o.skipLuma = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "flatTolerance" ) {
      o.flatTolerance = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "edgeSnap" ) {
      o.edgeSnap = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "snapRatio" ) {
      o.snapRatio = EvgTraceCli.parseDouble(value);
      return true;
    }
    if ( name == "lumaWeight" ) {
      o.lumaWeight = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "colorSpace" ) {
      o.colorSpace = value;
      return true;
    }
    if ( name == "paletteMode" ) {
      o.paletteMode = value;
      return true;
    }
    if ( name == "paletteHex" ) {
      o.paletteHex = EvgTraceCli.splitList(value);
      return true;
    }
    if ( name == "paletteBias" ) {
      o.paletteBias = value;
      return true;
    }
    if ( name == "paletteChroma" ) {
      o.paletteChroma = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "paletteMute" ) {
      o.paletteMute = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "paletteTint" ) {
      o.paletteTint = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "paletteWarm" ) {
      o.paletteWarm = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "paletteContrast" ) {
      o.paletteContrast = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "minColorDelta" ) {
      o.minColorDelta = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "contourMode" ) {
      o.contourMode = value;
      return true;
    }
    if ( name == "overlaySimilar" ) {
      o.overlaySimilar = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "overlayFollowBase" ) {
      o.overlayFollowBase = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "detailSwatches" ) {
      o.detailSwatches = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailSpread" ) {
      o.detailSpread = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailRadius" ) {
      o.detailRadius = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailBoost" ) {
      o.detailBoost = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailTrueColor" ) {
      o.detailTrueColor = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "detailColors" ) {
      o.detailColors = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailMinShare" ) {
      o.detailMinShare = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailColorMerge" ) {
      o.detailColorMerge = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "detailColorMax" ) {
      o.detailColorMax = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "edgeMinRun" ) {
      o.edgeMinRun = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "contourEdge" ) {
      o.contourEdge = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "contourSpread" ) {
      o.contourSpread = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "gradientFill" ) {
      o.gradientFill = EvgTraceCli.parseBool(value);
      return true;
    }
    if ( name == "gradientGain" ) {
      o.gradientGain = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "layerMode" ) {
      o.layerMode = value;
      return true;
    }
    if ( name == "pathFormat" ) {
      o.pathFormat = value;
      return true;
    }
    if ( name == "pathPrecision" ) {
      o.pathPrecision = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "smooth" ) {
      o.smooth = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "minRegion" ) {
      o.minRegion = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "absorbContrast" ) {
      o.absorbContrast = EvgTraceCli.parseInt(value);
      return true;
    }
    if ( name == "bgMode" ) {
      o.bgMode = value;
      return true;
    }
    if ( name == "bgColor" ) {
      o.bgColor = value;
      return true;
    }
    if ( name == "bgTolerance" ) {
      o.bgTolerance = EvgTraceCli.parseInt(value);
      return true;
    }
    return false;
  };
  printUsage () {
    console.log("evg-trace — bitmap to SVG (Ranger EvgBitmapTracer)");
    console.log("");
    console.log("  evg-trace <input.png|.jpg> <output.svg> [options]");
    console.log("");
    console.log("  The two paths may come anywhere among the options, and an");
    console.log("  option may be written --name value or --name=value.");
    console.log("");
    console.log("  --preset <name>   lineart | poster | photo | print | broken");
    console.log("  --<option> <value>");
    console.log("");
    console.log("Options are the fields of EvgTraceOptions, e.g. --colorCount 12");
    console.log("--paletteMute 130 --pathPrecision 1. See EvgTraceTypes.rgr for");
    console.log("what each one does and what it defaults to.");
    console.log("");
    console.log("Known options:");
    console.log("  turdsize alphamax turnpolicy optcurve opttolerance threshold");
    console.log("  blackOnWhite fillHex colorCount skipLuma flatTolerance edgeSnap");
    console.log("  snapRatio lumaWeight colorSpace paletteMode paletteHex");
    console.log("  paletteBias paletteChroma paletteMute paletteTint paletteWarm");
    console.log("  paletteContrast minColorDelta contourMode overlaySimilar");
    console.log("  overlayFollowBase detailSwatches detailSpread detailRadius");
    console.log("  detailBoost detailTrueColor detailColors detailMinShare");
    console.log("  detailColorMerge detailColorMax edgeMinRun contourEdge");
    console.log("  contourSpread gradientFill gradientGain layerMode pathFormat");
    console.log("  pathPrecision smooth minRegion absorbContrast bgMode bgColor");
    console.log("  bgTolerance");
  };
  decodeImage (bytes, dir, file) {
    const n = bytes.byteLength;
    const fail = new ImageBuffer();
    fail.init(1, 1);
    if ( n < 4 ) {
      return fail;
    }
    const b0 = bytes._view.getUint8(0);
    const b1 = bytes._view.getUint8(1);
    if ( (b0 == 137) && (b1 == 80) ) {
      const png = new PNGDecoder();
      return png.decodeBytes(bytes);
    }
    if ( (b0 == 255) && (b1 == 216) ) {
      if ( EvgTraceCli.isProgressiveJpeg(bytes) ) {
        const prog = new ProgressiveJPEGDecoder();
        return prog.decode(dir, file);
      }
      const jpg = new JPEGDecoder();
      jpg.quiet = true;
      return jpg.decodeBytes(bytes);
    }
    return fail;
  };
  run () {
    const argCount = (process.argv.length - 2);
    if ( argCount < 1 ) {
      this.printUsage();
      return;
    }
    let opts = EvgTraceOptions.defaults();
    let positional = [];
    let i = 0;
    let bad = false;
    let wantHelp = false;
    while (i < argCount) {
      const arg = process.argv[ 2 + i];
      if ( (arg == "-h") || (arg == "--help") ) {
        wantHelp = true;
      } else {
        if ( (arg.indexOf("--")) == 0 ) {
          const body = arg.substring(2, (arg.length) );
          let name = body;
          let value = "";
          let haveValue = false;
          const eq = body.indexOf("=");
          if ( eq >= 0 ) {
            name = body.substring(0, eq );
            value = body.substring((eq + 1), (body.length) );
            haveValue = true;
          }
          const isFlag = EvgTraceCli.isSwitch(name);
          if ( haveValue == false ) {
            if ( (i + 1) < argCount ) {
              const peek = process.argv[ 2 + (i + 1)];
              const peekIsOption = (peek.indexOf("--")) == 0;
              let take = false;
              if ( peekIsOption == false ) {
                take = true;
                if ( isFlag ) {
                  take = EvgTraceCli.looksBoolean(peek);
                }
              }
              if ( take ) {
                value = peek;
                haveValue = true;
                i = i + 1;
              }
            }
          }
          if ( (haveValue == false) && isFlag ) {
            value = "true";
            haveValue = true;
          }
          if ( haveValue == false ) {
            console.log(("--" + name) + " needs a value");
            bad = true;
          } else {
            if ( name == "preset" ) {
              opts = EvgTraceOptions.preset(value);
            } else {
              const ok = this.applyOption(opts, name, value);
              if ( ok == false ) {
                console.log("unknown option --" + name);
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
    if ( pn > 2 ) {
      console.log(("expected an input and an output path, got " + ((pn.toString()))) + ":");
      let pi = 0;
      while (pi < pn) {
        console.log("  " + (positional[pi]));
        pi = pi + 1;
      };
      bad = true;
    }
    if ( pn < 2 ) {
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
    const inDir = EvgTraceCli.dirOf(inputPath);
    const inFile = EvgTraceCli.fileOf(inputPath);
    if ( (require("fs").existsSync(inDir + "/" + inFile )) == false ) {
      console.log("no such file: " + inputPath);
      return;
    }
    const bytes = (function(){ var b = require('fs').readFileSync(inDir + '/' + inFile); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( (bytes.byteLength) == 0 ) {
      console.log("cannot read " + inputPath);
      return;
    }
    const img = this.decodeImage(bytes, inDir, inFile);
    if ( (img.width < 2) && (img.height < 2) ) {
      console.log("not a PNG or JPEG this build can decode: " + inputPath);
      return;
    }
    const tr = EvgBitmapTracer.fromImageBuffer(img, opts);
    tr.trace();
    const svg = tr.toSVG();
    const outDir = EvgTraceCli.dirOf(outputPath);
    const outFile = EvgTraceCli.fileOf(outputPath);
    require("fs").writeFileSync( outDir + "/"  + outFile, svg);
    const w = (img.width.toString());
    const h = (img.height.toString());
    const layers = (tr.layerCount().toString());
    const rings = (tr.ringCount().toString());
    const bytesOut = ((svg.length).toString());
    console.log((((((((outputPath + "  ") + w) + "x") + h) + "  layers=") + layers) + "  rings=") + rings);
    console.log(("  " + bytesOut) + " bytes");
  };
}
EvgTraceCli.digitOf = function(ch) {
  return "0123456789".indexOf(ch);
};
EvgTraceCli.parseInt = function(s) {
  const n = s.length;
  let i = 0;
  let neg = false;
  if ( n > 0 ) {
    const first = s.substring(0, 1 );
    if ( first == "-" ) {
      neg = true;
      i = 1;
    }
    if ( first == "+" ) {
      i = 1;
    }
  }
  let v = 0;
  while (i < n) {
    const d = EvgTraceCli.digitOf((s.substring(i, (i + 1) )));
    if ( d < 0 ) {
      i = n;
    } else {
      v = (v * 10) + d;
      i = i + 1;
    }
  };
  if ( neg ) {
    return 0 - v;
  }
  return v;
};
EvgTraceCli.parseDouble = function(s) {
  const n = s.length;
  let i = 0;
  let neg = false;
  if ( n > 0 ) {
    const first = s.substring(0, 1 );
    if ( first == "-" ) {
      neg = true;
      i = 1;
    }
    if ( first == "+" ) {
      i = 1;
    }
  }
  let whole = 0.0;
  let stop = false;
  while ((i < n) && (stop == false)) {
    const ch = s.substring(i, (i + 1) );
    const d = EvgTraceCli.digitOf(ch);
    if ( d < 0 ) {
      stop = true;
    } else {
      whole = (whole * 10.0) + (d);
      i = i + 1;
    }
  };
  if ( i < n ) {
    const dot = s.substring(i, (i + 1) );
    if ( dot == "." ) {
      i = i + 1;
      let scale = 1.0;
      let more = true;
      while ((i < n) && more) {
        const ch2 = s.substring(i, (i + 1) );
        const d2 = EvgTraceCli.digitOf(ch2);
        if ( d2 < 0 ) {
          more = false;
        } else {
          scale = scale / 10.0;
          whole = whole + ((d2) * scale);
          i = i + 1;
        }
      };
    }
  }
  if ( neg ) {
    return 0.0 - whole;
  }
  return whole;
};
EvgTraceCli.parseBool = function(s) {
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
EvgTraceCli.splitList = function(s) {
  let out = [];
  const parts = s.split(",");
  let i = 0;
  while (i < (parts.length)) {
    const p = (parts[i]).trim();
    if ( (p.length) > 0 ) {
      out.push(p);
    }
    i = i + 1;
  };
  return out;
};
EvgTraceCli.lastSepOf = function(path) {
  const a = path.lastIndexOf("/");
  const b = path.lastIndexOf("\\");
  if ( b > a ) {
    return b;
  }
  return a;
};
EvgTraceCli.dirOf = function(path) {
  const sep = EvgTraceCli.lastSepOf(path);
  if ( sep < 0 ) {
    return ".";
  }
  return path.substring(0, sep );
};
EvgTraceCli.fileOf = function(path) {
  const sep = EvgTraceCli.lastSepOf(path);
  if ( sep < 0 ) {
    return path;
  }
  return path.substring((sep + 1), (path.length) );
};
EvgTraceCli.isSwitch = function(name) {
  if ( name == "optcurve" ) {
    return true;
  }
  if ( name == "blackOnWhite" ) {
    return true;
  }
  if ( name == "edgeSnap" ) {
    return true;
  }
  if ( name == "overlayFollowBase" ) {
    return true;
  }
  if ( name == "detailTrueColor" ) {
    return true;
  }
  if ( name == "gradientFill" ) {
    return true;
  }
  return false;
};
EvgTraceCli.looksBoolean = function(s) {
  return ("|0|1|true|false|yes|no|on|off|".indexOf((("|" + s) + "|"))) >= 0;
};
EvgTraceCli.isProgressiveJpeg = function(bytes) {
  const n = bytes.byteLength;
  let i = 0;
  while (i < (n - 1)) {
    const b = bytes._view.getUint8(i);
    if ( b == 255 ) {
      const marker = bytes._view.getUint8((i + 1));
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
function __js_main() {
  const cli = new EvgTraceCli();
  cli.run();
}
__js_main();
