#!/usr/bin/env node
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
    let s = [];
    this.stops = s;
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
    this.textContent = "";
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
    this.position = "relative";     /** note: unused */
    this.src = "";
    this.alt = "";     /** note: unused */
    this.imageViewBox = "";     /** note: unused */
    this.imageViewBoxX = 0.0;     /** note: unused */
    this.imageViewBoxY = 0.0;     /** note: unused */
    this.imageViewBoxW = 1.0;     /** note: unused */
    this.imageViewBoxH = 1.0;     /** note: unused */
    this.imageViewBoxSet = false;     /** note: unused */
    this.objectFit = "cover";
    this.sourceWidth = 0.0;
    this.sourceHeight = 0.0;
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
    this.backgroundGradient = "";
    this.gradient = new EVGGradient();
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedInnerWidth = 0.0;
    this.calculatedInnerHeight = 0.0;
    this.calculatedFlexWidth = 0.0;
    this.calculatedFlexHeight = 0.0;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    this.hasDefiniteHeight = false;
    this.calculatedPage = 0;
    this.isAbsolute = false;
    this.isOverlay = false;
    this.isOverlayAnchor = false;
    this.overlaySide = "bottom";
    this.overlayAlign = "start";
    this.overlayGap = 4.0;
    this.overlayX = 0.0;
    this.overlayY = 0.0;
    this.role = "";
    this.a11yLabel = "";
    this.a11yChecked = 0;
    this.a11yExpanded = 0;
    this.a11ySelected = 0;
    this.a11yDisabled = false;
    this.a11yFocusable = false;
    this.a11yPosInSet = 0;     /** note: unused */
    this.a11ySetSize = 0;     /** note: unused */
    this.isLayoutComplete = false;
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
    if ( (name == "role") || (name == "a11yRole") ) {
      this.role = value.trim();
      return;
    }
    if ( (name == "aria-label") || (name == "a11yLabel") ) {
      this.a11yLabel = value;
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
      this.box.setMargin(EVGUnit.parse(value));
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
      this.box.setPadding(EVGUnit.parse(value));
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
  }
  isFontAccurate () {
    return false;
  };
  hasFace (fontFamily) {
    return false;
  };
  measureText (text, fontFamily, fontSize) {
    const avgCharWidth = fontSize * 0.55;
    const textLen = text.length;
    const width = (textLen) * avgCharWidth;
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    const metrics = this.measureText(text, fontFamily, fontSize);
    return metrics.width;
  };
  getLineHeight (fontFamily, fontSize) {
    return fontSize * 1.2;
  };
  measureChar (ch, fontFamily, fontSize) {
    if ( ch == 32 ) {
      return fontSize * 0.3;
    }
    if ( ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) ) {
      return fontSize * 0.3;
    }
    if ( (ch == 109) || (ch == 119) ) {
      return fontSize * 0.8;
    }
    if ( (ch == 77) || (ch == 87) ) {
      return fontSize * 0.9;
    }
    if ( ch == 73 ) {
      return fontSize * 0.35;
    }
    return fontSize * 0.55;
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
        if ( (currentLine.length) > 0 ) {
          if ( (joiner.length) > 0 ) {
            spaceWidth = this.measureTextWidth(joiner, fontFamily, fontSize);
          }
        }
        if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
          if ( (currentLine.length) > 0 ) {
            currentLine = currentLine + joiner;
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = currentLine + word;
          currentWidth = currentWidth + wordWidth;
        } else {
          if ( (currentLine.length) > 0 ) {
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
    if ( (currentLine.length) > 0 ) {
      lines.push(currentLine);
    }
    return lines;
  };
}
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
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
}
class EVGImageDimensions  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
  }
}
EVGImageDimensions.create = function(w, h) {
  const d = new EVGImageDimensions();
  d.width = w;
  d.height = h;
  if ( h > 0 ) {
    d.aspectRatio = (w) / (h);
  }
  d.isValid = true;
  return d;
};
class EVGImageMeasurer  {
  constructor() {
  }
  getImageDimensions (src) {
    const dims = new EVGImageDimensions();
    return dims;
  };
  calculateHeightForWidth (src, targetWidth) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  };
  calculateWidthForHeight (src, targetHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  };
  calculateFitDimensions (src, maxWidth, maxHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid == false ) {
      return EVGImageDimensions.create((Math.floor( maxWidth)), (Math.floor( maxHeight)));
    }
    const scaleW = maxWidth / (dims.width);
    const scaleH = maxHeight / (dims.height);
    let scale = scaleW;
    if ( scaleH < scaleW ) {
      scale = scaleH;
    }
    const newW = Math.floor( ((dims.width) * scale));
    const newH = Math.floor( ((dims.height) * scale));
    return EVGImageDimensions.create(newW, newH);
  };
}
class SimpleImageMeasurer  extends EVGImageMeasurer {
  constructor() {
    super()
  }
}
class EVGGridTrack  {
  constructor() {
    this.kind = 0;
    this.value = 0.0;
    this.hasFitLimit = false;
    this.sizePx = 0.0;
    this.hasMin = false;
    this.hasMax = false;
    this.frozen = false;
    this.kind = 0;
    this.value = 0.0;
    this.sizePx = 0.0;
    this.hasMin = false;
    this.hasMax = false;
    this.frozen = false;
    this.hasFitLimit = false;
    this.minUnit = EVGUnit.unset();
    this.maxUnit = EVGUnit.unset();
    this.fitLimit = EVGUnit.unset();
  }
}
class EVGGridTemplate  {
  constructor() {
    this.tracks = [];
    this.lineNames = [];
    this.lineNumbers = [];
    this.hadError = false;
    this.errorText = "";
    this.hadError = false;
    this.errorText = "";
  }
  lineNumberNamed (name) {
    let i = 0;
    while (i < (this.lineNames.length)) {
      if ( (this.lineNames[i]) == name ) {
        return this.lineNumbers[i];
      }
      i = i + 1;
    };
    return 0;
  };
  addLineNames (tok) {
    const inner = (tok.substring(1, ((tok.length) - 1) )).trim();
    const line = (this.tracks.length) + 1;
    const parts = EVGGridTemplate.tokenize(inner);
    let i = 0;
    while (i < (parts.length)) {
      const nm = parts[i];
      if ( (nm.length) > 0 ) {
        if ( this.lineNumberNamed(nm) == 0 ) {
          this.lineNames.push(nm);
          this.lineNumbers.push(line);
        }
      }
      i = i + 1;
    };
  };
  count () {
    return this.tracks.length;
  };
  trackAt (i) {
    return this.tracks[i];
  };
  expandRepeat (tok) {
    const __len = tok.length;
    const close = __len - 1;
    if ( (tok.charCodeAt(close )) != 41 ) {
      this.hadError = true;
      this.errorText = "Malformed repeat(): " + tok;
      return;
    }
    const inner = tok.substring(7, close );
    let comma = 0 - 1;
    let j = 0;
    while (j < (inner.length)) {
      if ( (inner.charCodeAt(j )) == 44 ) {
        comma = j;
        j = inner.length;
      } else {
        j = j + 1;
      }
    };
    if ( comma < 0 ) {
      this.hadError = true;
      this.errorText = "repeat() needs a count and a track list: " + tok;
      return;
    }
    const countStr = (inner.substring(0, comma )).trim();
    const listStr = (inner.substring((comma + 1), (inner.length) )).trim();
    const countVal = isNaN( parseFloat(countStr) ) ? undefined : parseFloat(countStr);
    let n = 0;
    if ( typeof(countVal) != "undefined" ) {
      n = Math.floor( (countVal));
    } else {
      this.hadError = true;
      this.errorText = "repeat() count is not a number: " + tok;
      return;
    }
    if ( n < 1 ) {
      this.hadError = true;
      this.errorText = "repeat() count must be at least 1: " + tok;
      return;
    }
    const inner2 = EVGGridTemplate.tokenize(listStr);
    let r = 0;
    while (r < n) {
      let k = 0;
      while (k < (inner2.length)) {
        const innerTok = inner2[k];
        if ( EVGGridTemplate.isMinmax(innerTok) ) {
          this.addMinmax(innerTok);
        } else {
          this.addTrack(innerTok);
        }
        k = k + 1;
      };
      r = r + 1;
    };
  };
  addMinmax (tok) {
    const __len = tok.length;
    const close = __len - 1;
    if ( (tok.charCodeAt(close )) != 41 ) {
      this.hadError = true;
      this.errorText = "Malformed minmax(): " + tok;
      return;
    }
    const inner = tok.substring(7, close );
    let comma = 0 - 1;
    let j = 0;
    while (j < (inner.length)) {
      if ( (inner.charCodeAt(j )) == 44 ) {
        comma = j;
        j = inner.length;
      } else {
        j = j + 1;
      }
    };
    if ( comma < 0 ) {
      this.hadError = true;
      this.errorText = "minmax() needs two values: " + tok;
      return;
    }
    const minStr = (inner.substring(0, comma )).trim();
    const maxStr = (inner.substring((comma + 1), (inner.length) )).trim();
    const before = this.tracks.length;
    this.addTrack(maxStr);
    if ( (this.tracks.length) == before ) {
      return;
    }
    const track = this.tracks[((this.tracks.length) - 1)];
    if ( EVGGridTemplate.isFrToken(minStr) == false ) {
      track.minUnit = EVGUnit.parse(minStr);
      track.hasMin = track.minUnit.isSet;
    }
    if ( EVGGridTemplate.isFrToken(maxStr) == false ) {
      track.maxUnit = EVGUnit.parse(maxStr);
      track.hasMax = track.maxUnit.isSet;
    }
  };
  addTrack (tok) {
    const t = tok.trim();
    const __len = t.length;
    if ( __len == 0 ) {
      return;
    }
    const track = new EVGGridTrack();
    if ( t == "auto" ) {
      track.kind = 3;
      this.tracks.push(track);
      return;
    }
    if ( EVGGridTemplate.isFitContent(t) ) {
      const inner = (t.substring(12, (__len - 1) )).trim();
      const lim = EVGUnit.parse(inner);
      if ( lim.isSet == false ) {
        this.hadError = true;
        this.errorText = "Unsupported fit-content() limit: " + inner;
        return;
      }
      track.kind = 3;
      track.hasFitLimit = true;
      track.fitLimit = lim;
      this.tracks.push(track);
      return;
    }
    if ( __len > 2 ) {
      if ( (t.substring((__len - 2), __len )) == "fr" ) {
        const numStr = t.substring(0, (__len - 2) );
        const frVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
        if ( typeof(frVal) != "undefined" ) {
          track.kind = 2;
          track.value = frVal;
          this.tracks.push(track);
          return;
        }
      }
    }
    if ( t == "fr" ) {
      track.kind = 2;
      track.value = 1.0;
      this.tracks.push(track);
      return;
    }
    const unit = EVGUnit.parse(t);
    if ( unit.isSet == false ) {
      this.hadError = true;
      this.errorText = "Unsupported track size: " + t;
      return;
    }
    if ( unit.unitType == 1 ) {
      track.kind = 1;
      track.value = unit.value;
    } else {
      track.kind = 0;
      track.value = unit.value;
    }
    this.tracks.push(track);
  };
  hasIntrinsicTrack () {
    let i = 0;
    while (i < (this.tracks.length)) {
      const t = this.tracks[i];
      if ( t.kind == 3 ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  resolve (available) {
    let empty = [];
    let empty2 = [];
    this.resolveWithContent(available, empty, empty2);
  };
  resolveWithContent (available, content, minContent) {
    const n = this.tracks.length;
    let used = 0.0;
    let totalFr = 0.0;
    let i = 0;
    while (i < n) {
      const t = this.tracks[i];
      t.frozen = false;
      if ( t.hasMin ) {
        t.minUnit.resolve(available, 16.0);
      }
      if ( t.hasMax ) {
        t.maxUnit.resolve(available, 16.0);
      }
      if ( t.kind == 0 ) {
        t.sizePx = t.value;
        used = used + t.sizePx;
        t.frozen = true;
      }
      if ( t.kind == 1 ) {
        t.sizePx = (available * t.value) / 100.0;
        used = used + t.sizePx;
        t.frozen = true;
      }
      if ( t.kind == 2 ) {
        totalFr = totalFr + t.value;
      }
      if ( t.kind == 3 ) {
        let c = 0.0;
        if ( i < (content.length) ) {
          c = content[i];
        }
        if ( t.hasFitLimit ) {
          t.fitLimit.resolve(available, 16.0);
          if ( c > t.fitLimit.pixels ) {
            c = t.fitLimit.pixels;
          }
          if ( i < (minContent.length) ) {
            const floorPx = minContent[i];
            if ( c < floorPx ) {
              c = floorPx;
            }
          }
        }
        t.sizePx = c;
        used = used + c;
        t.frozen = true;
      }
      i = i + 1;
    };
    let poolSpace = available - used;
    if ( poolSpace < 0.0 ) {
      poolSpace = 0.0;
    }
    let poolFr = totalFr;
    let pass = 0;
    let settled = false;
    while ((pass <= n) && (settled == false)) {
      settled = true;
      let j = 0;
      while (j < n) {
        const t2 = this.tracks[j];
        if ( (t2.kind == 2) && (t2.frozen == false) ) {
          let size = 0.0;
          if ( poolFr > 0.0 ) {
            size = (poolSpace * t2.value) / poolFr;
          }
          let clamped = size;
          if ( t2.hasMin ) {
            if ( clamped < t2.minUnit.pixels ) {
              clamped = t2.minUnit.pixels;
            }
          }
          if ( t2.hasMax ) {
            if ( clamped > t2.maxUnit.pixels ) {
              clamped = t2.maxUnit.pixels;
            }
          }
          t2.sizePx = clamped;
          if ( clamped != size ) {
            t2.frozen = true;
            poolSpace = poolSpace - clamped;
            poolFr = poolFr - t2.value;
            if ( poolSpace < 0.0 ) {
              poolSpace = 0.0;
            }
            settled = false;
          }
        }
        j = j + 1;
      };
      pass = pass + 1;
    };
    let k = 0;
    while (k < n) {
      const t3 = this.tracks[k];
      if ( t3.kind != 2 ) {
        if ( t3.hasMin ) {
          if ( t3.sizePx < t3.minUnit.pixels ) {
            t3.sizePx = t3.minUnit.pixels;
          }
        }
        if ( t3.hasMax ) {
          if ( t3.sizePx > t3.maxUnit.pixels ) {
            t3.sizePx = t3.maxUnit.pixels;
          }
        }
      }
      k = k + 1;
    };
  };
  extentOf (from, span, gap) {
    let total = 0.0;
    const n = this.tracks.length;
    let i = from;
    let placed = 0;
    while ((i < n) && (placed < span)) {
      const tk = this.tracks[i];
      total = total + tk.sizePx;
      placed = placed + 1;
      i = i + 1;
    };
    if ( placed > 1 ) {
      total = total + (((placed - 1)) * gap);
    }
    return total;
  };
  offsetOf (index, gap) {
    let total = 0.0;
    let i = 0;
    while (i < index) {
      const tk = this.tracks[i];
      total = total + tk.sizePx;
      total = total + gap;
      i = i + 1;
    };
    return total;
  };
}
EVGGridTemplate.isLineNameToken = function(tok) {
  const __len = tok.length;
  if ( __len < 2 ) {
    return false;
  }
  if ( (tok.charCodeAt(0 )) != 91 ) {
    return false;
  }
  return (tok.charCodeAt((__len - 1) )) == 93;
};
EVGGridTemplate.parse = function(spec) {
  const tpl = new EVGGridTemplate();
  const tokens = EVGGridTemplate.tokenize(spec);
  let i = 0;
  while (i < (tokens.length)) {
    const tok = tokens[i];
    if ( EVGGridTemplate.isLineNameToken(tok) ) {
      tpl.addLineNames(tok);
    } else {
      if ( EVGGridTemplate.isRepeat(tok) ) {
        tpl.expandRepeat(tok);
      } else {
        if ( EVGGridTemplate.isMinmax(tok) ) {
          tpl.addMinmax(tok);
        } else {
          tpl.addTrack(tok);
        }
      }
    }
    i = i + 1;
  };
  return tpl;
};
EVGGridTemplate.tokenize = function(spec) {
  let out = [];
  const __len = spec.length;
  let depth = 0;
  let start = 0;
  let inTok = false;
  let i = 0;
  while (i < __len) {
    const c = spec.charCodeAt(i );
    if ( (c == 40) || (c == 91) ) {
      depth = depth + 1;
    }
    if ( (c == 41) || (c == 93) ) {
      depth = depth - 1;
    }
    const isSpace = ((c == 32) || (c == 9)) || ((c == 10) || (c == 13));
    if ( isSpace && (depth == 0) ) {
      if ( inTok ) {
        out.push(spec.substring(start, i ));
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
    out.push(spec.substring(start, __len ));
  }
  return out;
};
EVGGridTemplate.isRepeat = function(tok) {
  if ( (tok.length) < 8 ) {
    return false;
  }
  return (tok.substring(0, 7 )) == "repeat(";
};
EVGGridTemplate.isMinmax = function(tok) {
  if ( (tok.length) < 8 ) {
    return false;
  }
  return (tok.substring(0, 7 )) == "minmax(";
};
EVGGridTemplate.isFrToken = function(tok) {
  const __len = tok.length;
  if ( __len < 2 ) {
    return false;
  }
  return (tok.substring((__len - 2), __len )) == "fr";
};
EVGGridTemplate.isFitContent = function(tok) {
  if ( (tok.length) < 14 ) {
    return false;
  }
  if ( (tok.substring(0, 12 )) != "fit-content(" ) {
    return false;
  }
  return (tok.charCodeAt(((tok.length) - 1) )) == 41;
};
class EVGGridAreas  {
  constructor() {
    this.names = [];
    this.rowStart = [];
    this.colStart = [];
    this.rowSpan = [];
    this.colSpan = [];
    this.columns = 0;
    this.rows = 0;
    this.hadError = false;
    this.errorText = "";
    this.columns = 0;
    this.rows = 0;
    this.hadError = false;
    this.errorText = "";
  }
  count () {
    return this.names.length;
  };
  indexOfName (name) {
    let i = 0;
    while (i < (this.names.length)) {
      if ( (this.names[i]) == name ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  build (rowsOut) {
    this.rows = rowsOut.length;
    let cells = [];
    let r = 0;
    while (r < this.rows) {
      const toks = EVGGridTemplate.tokenize((rowsOut[r]));
      if ( r == 0 ) {
        this.columns = toks.length;
      } else {
        if ( (toks.length) != this.columns ) {
          this.hadError = true;
          this.errorText = "grid-template-areas rows must all have the same number of columns";
          return;
        }
      }
      let c = 0;
      while (c < (toks.length)) {
        cells.push(toks[c]);
        c = c + 1;
      };
      r = r + 1;
    };
    if ( this.columns == 0 ) {
      this.hadError = true;
      this.errorText = "grid-template-areas has no columns";
      return;
    }
    let rr = 0;
    while (rr < this.rows) {
      let cc = 0;
      while (cc < this.columns) {
        const name = cells[((rr * this.columns) + cc)];
        if ( name != "." ) {
          const at = this.indexOfName(name);
          if ( at < 0 ) {
            this.names.push(name);
            this.rowStart.push(rr);
            this.colStart.push(cc);
            this.rowSpan.push(1);
            this.colSpan.push(1);
          } else {
            const r0 = this.rowStart[at];
            const c0 = this.colStart[at];
            const rs = this.rowSpan[at];
            const cs = this.colSpan[at];
            if ( (rr + 1) > (r0 + rs) ) {
              this.rowSpan[at] = (rr + 1) - r0;
            }
            if ( (cc + 1) > (c0 + cs) ) {
              this.colSpan[at] = (cc + 1) - c0;
            }
          }
        }
        cc = cc + 1;
      };
      rr = rr + 1;
    };
    const n = this.names.length;
    let k = 0;
    while (k < n) {
      const nm = this.names[k];
      const r0_1 = this.rowStart[k];
      const c0_1 = this.colStart[k];
      const rs_1 = this.rowSpan[k];
      const cs_1 = this.colSpan[k];
      let a = 0;
      while (a < rs_1) {
        let b = 0;
        while (b < cs_1) {
          const idx = ((r0_1 + a) * this.columns) + (c0_1 + b);
          if ( (cells[idx]) != nm ) {
            this.hadError = true;
            this.errorText = ("Area \"" + nm) + "\" is not a rectangle in grid-template-areas";
            return;
          }
          b = b + 1;
        };
        a = a + 1;
      };
      k = k + 1;
    };
  };
}
EVGGridAreas.parse = function(spec) {
  const areas = new EVGGridAreas();
  let rowsOut = [];
  let cur = "";
  let inQuote = false;
  let quoteCh = 0;
  let i = 0;
  const __len = spec.length;
  while (i < __len) {
    const c = spec.charCodeAt(i );
    if ( inQuote ) {
      if ( c == quoteCh ) {
        rowsOut.push(cur);
        cur = "";
        inQuote = false;
      } else {
        cur = cur + (String.fromCharCode(c));
      }
    } else {
      if ( (c == 34) || (c == 39) ) {
        inQuote = true;
        quoteCh = c;
      }
    }
    i = i + 1;
  };
  if ( inQuote ) {
    areas.hadError = true;
    areas.errorText = "Unterminated row in grid-template-areas: " + spec;
    return areas;
  }
  if ( (rowsOut.length) == 0 ) {
    areas.hadError = true;
    areas.errorText = "grid-template-areas needs quoted rows: " + spec;
    return areas;
  }
  areas.build(rowsOut);
  return areas;
};
class EVGGridPlacement  {
  constructor() {
    this.start = 0;
    this.span = 1;
    this.hadError = false;
    this.errorText = "";
    this.startName = "";
    this.endName = "";
    this.endLine = 0;
    this.spanExplicit = false;
    this.start = 0;
    this.span = 1;
    this.hadError = false;
    this.errorText = "";
    this.startName = "";
    this.endName = "";
    this.endLine = 0;
    this.spanExplicit = false;
  }
  takeStart (token) {
    if ( EVGGridPlacement.isNumericToken(token) ) {
      this.start = EVGGridPlacement.lineNumber(token);
      if ( this.start == 0 ) {
        this.reject(token);
      }
    } else {
      this.startName = token;
    }
  };
  takeEnd (token) {
    if ( EVGGridPlacement.isNumericToken(token) ) {
      this.endLine = EVGGridPlacement.lineNumber(token);
      if ( this.endLine == 0 ) {
        this.reject(token);
      }
    } else {
      this.endName = token;
    }
  };
  applyEndLine () {
    if ( this.spanExplicit ) {
      return;
    }
    if ( this.start < 1 ) {
      return;
    }
    if ( this.endLine > this.start ) {
      this.span = this.endLine - this.start;
    }
  };
  resolveNames (tpl) {
    if ( (this.startName.length) > 0 ) {
      const n = tpl.lineNumberNamed(this.startName);
      if ( n > 0 ) {
        this.start = n;
        this.startName = "";
      } else {
        this.rejectName(this.startName);
      }
    }
    if ( (this.endName.length) > 0 ) {
      const e = tpl.lineNumberNamed(this.endName);
      if ( e > 0 ) {
        this.endLine = e;
        this.endName = "";
      } else {
        this.rejectName(this.endName);
      }
    }
    this.applyEndLine();
  };
  rejectName (name) {
    if ( this.hadError ) {
      return;
    }
    this.hadError = true;
    this.errorText = ("no line named \"" + name) + "\"; the item was auto-placed";
  };
  reject (token) {
    if ( this.hadError ) {
      return;
    }
    this.hadError = true;
    this.errorText = ("unsupported line \"" + token) + "\" (negative line numbers are not supported); the item was auto-placed";
  };
}
EVGGridPlacement.parse = function(spec) {
  const p = new EVGGridPlacement();
  const s = spec.trim();
  if ( (s.length) == 0 ) {
    return p;
  }
  let slash = 0 - 1;
  let i = 0;
  while (i < (s.length)) {
    if ( (s.charCodeAt(i )) == 47 ) {
      slash = i;
      i = s.length;
    } else {
      i = i + 1;
    }
  };
  if ( slash < 0 ) {
    if ( EVGGridPlacement.isSpan(s) ) {
      p.span = EVGGridPlacement.spanCount(s);
      p.spanExplicit = true;
    } else {
      p.takeStart(s);
    }
    return p;
  }
  const lhs = (s.substring(0, slash )).trim();
  const rhs = (s.substring((slash + 1), (s.length) )).trim();
  p.takeStart(lhs);
  if ( EVGGridPlacement.isSpan(rhs) ) {
    p.span = EVGGridPlacement.spanCount(rhs);
    p.spanExplicit = true;
  } else {
    p.takeEnd(rhs);
  }
  p.applyEndLine();
  return p;
};
EVGGridPlacement.isNumericToken = function(s) {
  if ( (s.length) == 0 ) {
    return false;
  }
  const c = s.charCodeAt(0 );
  if ( (c >= 48) && (c <= 57) ) {
    return true;
  }
  return (c == 45) || (c == 43);
};
EVGGridPlacement.isSpan = function(s) {
  if ( (s.length) < 4 ) {
    return false;
  }
  return (s.substring(0, 4 )) == "span";
};
EVGGridPlacement.spanCount = function(s) {
  const rest = (s.substring(4, (s.length) )).trim();
  const v = isNaN( parseFloat(rest) ) ? undefined : parseFloat(rest);
  if ( typeof(v) != "undefined" ) {
    const n = Math.floor( (v));
    if ( n >= 1 ) {
      return n;
    }
  }
  return 1;
};
EVGGridPlacement.lineNumber = function(s) {
  const v = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
  if ( typeof(v) != "undefined" ) {
    const n = Math.floor( (v));
    if ( n >= 1 ) {
      return n;
    }
  }
  return 0;
};
class EVGTextLine  {
  constructor() {
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
  }
}
class EVGTextEngine  {
  constructor() {
    this.strict = false;
    this.reported = [];
    this.warnings = [];
    this.hadFatal = false;
    const m = new SimpleTextMeasurer();
    this.measurer = m;
    this.strict = false;
    this.hadFatal = false;
  }
  setMeasurer (m) {
    this.measurer = m;
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
    while (i < (this.reported.length)) {
      if ( (this.reported[i]) == fontFamily ) {
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
  measureRun (text, fontFamily, fontSize) {
    this.checkFamily(fontFamily);
    return this.measurer.measureText(text, fontFamily, fontSize);
  };
  lineHeightFor (fontFamily, fontSize) {
    return this.measurer.getLineHeight(fontFamily, fontSize);
  };
  breakLines (text, fontFamily, fontSize, maxWidth) {
    let out = [];
    this.checkFamily(fontFamily);
    const paragraphs = text.split("\n");
    let p = 0;
    while (p < (paragraphs.length)) {
      const para = paragraphs[p];
      if ( maxWidth <= 0.0 ) {
        this.pushLine(out, para, fontFamily, fontSize);
      } else {
        const words = para.split(" ");
        let currentLine = "";
        let w = 0;
        while (w < (words.length)) {
          const word = words[w];
          let testLine = "";
          if ( (currentLine.length) == 0 ) {
            testLine = word;
          } else {
            testLine = (currentLine + " ") + word;
          }
          const testWidth = this.measurer.measureTextWidth(testLine, fontFamily, fontSize);
          if ( (testWidth > maxWidth) && ((currentLine.length) > 0) ) {
            this.pushLine(out, currentLine, fontFamily, fontSize);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
          w = w + 1;
        };
        this.pushLine(out, currentLine, fontFamily, fontSize);
      }
      p = p + 1;
    };
    if ( (out.length) == 0 ) {
      this.pushLine(out, "", fontFamily, fontSize);
    }
    return out;
  };
  pushLine (out, text, fontFamily, fontSize) {
    const m = this.measurer.measureText(text, fontFamily, fontSize);
    const line = new EVGTextLine();
    line.text = text;
    line.width = m.width;
    line.ascent = m.ascent;
    line.descent = m.descent;
    out.push(line);
  };
  lineCount (text, fontFamily, fontSize, maxWidth) {
    const lines = this.breakLines(text, fontFamily, fontSize, maxWidth);
    return lines.length;
  };
  maxLineWidth (text, fontFamily, fontSize) {
    const lines = this.breakLines(text, fontFamily, fontSize, 0.0);
    let maxW = 0.0;
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  minLineWidth (text, fontFamily, fontSize) {
    const lines = this.breakLines(text, fontFamily, fontSize, 0.001);
    let maxW = 0.0;
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  breakToStrings (text, fontFamily, fontSize, maxWidth) {
    let out = [];
    const lines = this.breakLines(text, fontFamily, fontSize, maxWidth);
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      out.push(ln.text);
      i = i + 1;
    };
    return out;
  };
}
class EVGLayout  {
  constructor() {
    this.textEngine = new EVGTextEngine();
    this.pageWidth = 612.0;
    this.pageHeight = 792.0;
    this.currentPage = 0;
    this.debug = false;
    this.overlayErrors = [];
    this.warnings = [];
    const m_1 = new SimpleTextMeasurer();
    this.measurer = m_1;
    this.textEngine.setMeasurer(m_1);
    const im = new SimpleImageMeasurer();
    this.imageMeasurer = im;
  }
  setMeasurer (m) {
    this.measurer = m;
    this.textEngine.setMeasurer(m);
  };
  getTextEngine () {
    return this.textEngine;
  };
  setStrictFonts (s) {
    this.textEngine.setStrict(s);
  };
  setImageMeasurer (m) {
    this.imageMeasurer = m;
  };
  setPageSize (w, h) {
    this.pageWidth = w;
    this.pageHeight = h;
  };
  setDebug (d) {
    this.debug = d;
  };
  log (msg) {
    if ( this.debug ) {
      console.log(msg);
    }
  };
  warn (msg) {
    let i = 0;
    while (i < (this.warnings.length)) {
      if ( (this.warnings[i]) == msg ) {
        return;
      }
      i = i + 1;
    };
    this.warnings.push(msg);
    this.log("  " + msg);
  };
  warningCount () {
    return this.warnings.length;
  };
  warningAt (i) {
    return this.warnings[i];
  };
  layout (root) {
    this.log("EVGLayout: Starting layout");
    this.currentPage = 0;
    root.resetLayoutState();
    if ( root.width.isSet == false ) {
      root.width = EVGUnit.px(this.pageWidth);
    }
    if ( root.height.isSet == false ) {
      root.height = EVGUnit.px(this.pageHeight);
    }
    root.applyOwnFontSize();
    root.rootFontSize = root.inheritedFontSize;
    root.applyOwnDirection(false);
    root.calculatedX = 0.0;
    root.calculatedY = 0.0;
    this.layoutElement(root, 0.0, 0.0, this.pageWidth, this.pageHeight);
    this.overlayErrors.length = 0;
    this.placeOverlaysIn(root);
    this.log("EVGLayout: Layout complete");
  };
  layoutElement (element, parentX, parentY, parentWidth, parentHeight) {
    element.resolveUnits(parentWidth, parentHeight);
    let width = parentWidth;
    if ( element.width.isSet ) {
      width = element.width.pixels;
    }
    if ( element.width.isSet == false ) {
      const textContent = element.textContent;
      if ( (textContent.length) > 0 ) {
        if ( element.getChildCount() == 0 ) {
          let fontSize = element.inheritedFontSize;
          if ( element.fontSize.isSet ) {
            fontSize = element.fontSize.pixels;
          }
          if ( fontSize <= 0.0 ) {
            fontSize = 14.0;
          }
          const contentW = this.textEngine.maxLineWidth(textContent, element.effectiveFontFamily(), fontSize);
          const measuredW = ((contentW + element.box.paddingLeftPx) + element.box.paddingRightPx) + (element.box.borderWidthPx * 2.0);
          if ( measuredW < parentWidth ) {
            width = measuredW;
          }
        }
      }
    }
    let height = 0.0;
    let autoHeight = true;
    if ( (element.tagName == "Page") || (element.tagName == "page") ) {
      if ( element.width.isSet == false ) {
        width = this.pageWidth;
      }
      if ( element.height.isSet == false ) {
        height = this.pageHeight;
        autoHeight = false;
      }
    }
    if ( element.height.isSet ) {
      height = element.height.pixels;
      autoHeight = false;
    }
    if ( element.height.isSet == false ) {
      if ( element.calculatedFlexHeight > 0.0 ) {
        height = element.calculatedFlexHeight;
        autoHeight = false;
      }
    }
    if ( ((element.tagName == "image") || (element.tagName == "Image")) || (element.tagName == "img") ) {
      const imgSrc = element.src;
      if ( (imgSrc.length) > 0 ) {
        const dims = this.imageMeasurer.getImageDimensions(imgSrc);
        if ( dims.isValid ) {
          element.sourceWidth = dims.width;
          element.sourceHeight = dims.height;
          if ( element.width.isSet && (element.height.isSet == false) ) {
            if ( parentHeight > 0.0 ) {
              height = parentHeight;
              this.log((("  Image container using parent height: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              height = width / dims.aspectRatio;
              this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> height=") + ((height.toString())));
            }
            autoHeight = false;
          }
          if ( (element.width.isSet == false) && element.height.isSet ) {
            if ( parentWidth > 0.0 ) {
              width = parentWidth;
              this.log((("  Image container using parent width: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              width = height * dims.aspectRatio;
              this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> width=") + ((width.toString())));
            }
          }
          if ( (element.width.isSet == false) && (element.height.isSet == false) ) {
            if ( (parentWidth > 0.0) && (parentHeight > 0.0) ) {
              width = parentWidth;
              height = parentHeight;
              this.log((("  Image filling parent: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              width = dims.width;
              height = dims.height;
              if ( width > parentWidth ) {
                if ( parentWidth > 0.0 ) {
                  const scale = parentWidth / width;
                  width = parentWidth;
                  height = height * scale;
                }
              }
              this.log((("  Image natural size: " + ((width.toString()))) + "x") + ((height.toString())));
            }
            autoHeight = false;
          }
        }
      }
    }
    if ( element.minWidth.isSet ) {
      if ( width < element.minWidth.pixels ) {
        width = element.minWidth.pixels;
      }
    }
    if ( element.maxWidth.isSet ) {
      if ( width > element.maxWidth.pixels ) {
        width = element.maxWidth.pixels;
      }
    }
    element.calculatedWidth = width;
    element.calculatedInnerWidth = element.box.getInnerWidth(width);
    element.hasDefiniteHeight = autoHeight == false;
    if ( autoHeight == false ) {
      element.calculatedHeight = height;
      element.calculatedInnerHeight = element.box.getInnerHeight(height);
    }
    if ( element.isAbsolute ) {
      this.layoutAbsolute(element, parentWidth, parentHeight);
    }
    const childCount = element.getChildCount();
    let contentHeight = 0.0;
    if ( childCount > 0 ) {
      contentHeight = this.layoutChildren(element);
      this.mirrorChildren(element);
      if ( element.width.unitType == 6 ) {
        const fitW = this.contentExtent(element);
        if ( (fitW > 0.0) && (fitW < element.calculatedWidth) ) {
          element.calculatedWidth = fitW;
          element.calculatedInnerWidth = element.box.getInnerWidth(fitW);
          let kr = 0;
          while (kr < childCount) {
            const kc = element.getChild(kr);
            kc.resetLayoutState();
            kr = kr + 1;
          };
          contentHeight = this.layoutChildren(element);
          this.mirrorChildren(element);
        }
      }
    } else {
      const textContent_1 = element.textContent;
      if ( (textContent_1.length) > 0 ) {
        let fontSize_1 = element.inheritedFontSize;
        if ( element.fontSize.isSet ) {
          fontSize_1 = element.fontSize.pixels;
        }
        if ( fontSize_1 <= 0.0 ) {
          fontSize_1 = 14.0;
        }
        let lineHeightFactor = element.lineHeight;
        if ( lineHeightFactor <= 0.0 ) {
          lineHeightFactor = 1.2;
        }
        const lineSpacing = fontSize_1 * lineHeightFactor;
        const availableWidth = (width - element.box.paddingLeftPx) - element.box.paddingRightPx;
        const lineCount = this.textEngine.lineCount(textContent_1, element.effectiveFontFamily(), fontSize_1, availableWidth);
        contentHeight = lineSpacing * (lineCount);
        const metrics = this.textEngine.measureRun(textContent_1, element.effectiveFontFamily(), fontSize_1);
        let leading = (lineSpacing - (metrics.ascent + metrics.descent)) / 2.0;
        if ( leading < 0.0 ) {
          leading = 0.0;
        }
        element.calculatedBaseline = ((element.box.paddingTopPx + element.box.borderWidthPx) + leading) + metrics.ascent;
        element.calculatedDescent = metrics.descent;
        element.hasBaseline = true;
      }
    }
    if ( autoHeight ) {
      height = ((contentHeight + element.box.paddingTopPx) + element.box.paddingBottomPx) + (element.box.borderWidthPx * 2.0);
    }
    const vChrome = element.box.getVerticalChrome();
    if ( height < vChrome ) {
      height = vChrome;
    }
    const hChrome = element.box.getHorizontalChrome();
    if ( width < hChrome ) {
      width = hChrome;
    }
    if ( element.minHeight.isSet ) {
      if ( height < element.minHeight.pixels ) {
        height = element.minHeight.pixels;
      }
    }
    if ( element.maxHeight.isSet ) {
      if ( height > element.maxHeight.pixels ) {
        height = element.maxHeight.pixels;
      }
    }
    element.calculatedHeight = height;
    element.calculatedInnerHeight = element.box.getInnerHeight(height);
    element.calculatedPage = this.currentPage;
    element.isLayoutComplete = true;
    if ( (element.hasBaseline == false) && (childCount > 0) ) {
      this.inheritBaselineFromFirstChild(element);
    }
    this.log((((((((((("  Laid out " + element.tagName) + " id=") + element.id) + " at (") + ((element.calculatedX.toString()))) + ",") + ((element.calculatedY.toString()))) + ") size=") + ((width.toString()))) + "x") + ((height.toString())));
  };
  layoutChildren (parent) {
    const childCount = parent.getChildCount();
    if ( childCount == 0 ) {
      return 0.0;
    }
    if ( parent.display == "grid" ) {
      return this.layoutGrid(parent);
    }
    const innerWidth = parent.calculatedInnerWidth;
    const innerHeight = parent.calculatedInnerHeight;
    const startX = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const startY = (parent.calculatedY + parent.box.borderWidthPx) + parent.box.paddingTopPx;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0.0;
    let rowElements = [];
    let totalHeight = 0.0;
    let lineMembers = [];
    let lineCounts = [];
    let lineHeights = [];
    let placedInFlow = 0;
    const isColumn = parent.flexDirection == "column";
    let gapPx = 0.0;
    if ( parent.gap.isSet ) {
      if ( isColumn ) {
        parent.gap.rootFontSize = parent.rootFontSize;
        parent.gap.resolve(innerHeight, parent.inheritedFontSize);
      } else {
        parent.gap.rootFontSize = parent.rootFontSize;
        parent.gap.resolve(innerWidth, parent.inheritedFontSize);
      }
      gapPx = parent.gap.pixels;
    }
    if ( isColumn == false ) {
      let fixedWidth = 0.0;
      let totalFlex = 0.0;
      let j = 0;
      while (j < childCount) {
        const c = parent.getChild(j);
        c.inheritProperties(parent);
        c.resolveUnits(innerWidth, innerHeight);
        const hasBasis = c.flexBasis.isSet;
        if ( (c.flex > 0.0) && hasBasis ) {
          totalFlex = totalFlex + c.flex;
          fixedWidth = ((fixedWidth + c.flexBasis.pixels) + c.box.marginLeftPx) + c.box.marginRightPx;
        } else {
          if ( c.width.isSet ) {
            fixedWidth = ((fixedWidth + c.width.pixels) + c.box.marginLeftPx) + c.box.marginRightPx;
          } else {
            if ( c.flex > 0.0 ) {
              totalFlex = totalFlex + c.flex;
              fixedWidth = (fixedWidth + c.box.marginLeftPx) + c.box.marginRightPx;
            } else {
              const avail = (innerWidth - c.box.marginLeftPx) - c.box.marginRightPx;
              const estW = this.estimateChildWidth(c, avail);
              fixedWidth = ((fixedWidth + estW) + c.box.marginLeftPx) + c.box.marginRightPx;
            }
          }
        }
        j = j + 1;
      };
      let totalGap = 0.0;
      if ( childCount > 1 ) {
        totalGap = ((childCount - 1)) * gapPx;
      }
      let availableForFlex = (innerWidth - fixedWidth) - totalGap;
      if ( availableForFlex < 0.0 ) {
        availableForFlex = 0.0;
      }
      if ( totalFlex > 0.0 ) {
        let frozen = [];
        let jf = 0;
        while (jf < childCount) {
          frozen.push(false);
          jf = jf + 1;
        };
        let poolSpace = availableForFlex;
        let poolFlex = totalFlex;
        let pass = 0;
        let settled = false;
        while ((pass < childCount) && (settled == false)) {
          settled = true;
          j = 0;
          while (j < childCount) {
            const c_1 = parent.getChild(j);
            let isFlexItem = false;
            if ( c_1.flex > 0.0 ) {
              if ( c_1.flexBasis.isSet || (c_1.width.isSet == false) ) {
                isFlexItem = true;
              }
            }
            if ( isFlexItem && ((frozen[j]) == false) ) {
              let basisW = 0.0;
              if ( c_1.flexBasis.isSet ) {
                basisW = c_1.flexBasis.pixels;
              }
              let sizeW = basisW;
              if ( poolFlex > 0.0 ) {
                sizeW = basisW + ((poolSpace * c_1.flex) / poolFlex);
              }
              let clampedW = sizeW;
              if ( c_1.minWidth.isSet ) {
                if ( clampedW < c_1.minWidth.pixels ) {
                  clampedW = c_1.minWidth.pixels;
                }
              }
              if ( c_1.maxWidth.isSet ) {
                if ( clampedW > c_1.maxWidth.pixels ) {
                  clampedW = c_1.maxWidth.pixels;
                }
              }
              if ( clampedW != sizeW ) {
                frozen[j] = true;
                poolSpace = (poolSpace - clampedW) + basisW;
                poolFlex = poolFlex - c_1.flex;
                if ( poolSpace < 0.0 ) {
                  poolSpace = 0.0;
                }
                settled = false;
              }
              c_1.calculatedFlexWidth = clampedW;
              c_1.width.isSet = false;
            }
            j = j + 1;
          };
          pass = pass + 1;
        };
      }
    }
    if ( isColumn && parent.hasDefiniteHeight ) {
      let fixedHeight = 0.0;
      let totalFlexC = 0.0;
      let flowCountC = 0;
      let jc = 0;
      while (jc < childCount) {
        const c_2 = parent.getChild(jc);
        c_2.inheritProperties(parent);
        c_2.resolveUnits(innerWidth, innerHeight);
        if ( c_2.isAbsolute == false ) {
          flowCountC = flowCountC + 1;
          const mAxis = c_2.box.marginTopPx + c_2.box.marginBottomPx;
          if ( c_2.height.isSet ) {
            fixedHeight = (fixedHeight + c_2.height.pixels) + mAxis;
          } else {
            if ( c_2.flex > 0.0 ) {
              totalFlexC = totalFlexC + c_2.flex;
              fixedHeight = fixedHeight + mAxis;
            } else {
              fixedHeight = fixedHeight + mAxis;
            }
          }
        }
        jc = jc + 1;
      };
      let gapTotalC = 0.0;
      if ( flowCountC > 1 ) {
        gapTotalC = ((flowCountC - 1)) * gapPx;
      }
      if ( totalFlexC > 0.0 ) {
        let availC = (innerHeight - fixedHeight) - gapTotalC;
        if ( availC < 0.0 ) {
          availC = 0.0;
        }
        let jg = 0;
        while (jg < childCount) {
          const c_3 = parent.getChild(jg);
          if ( c_3.isAbsolute == false ) {
            if ( (c_3.height.isSet == false) && (c_3.flex > 0.0) ) {
              c_3.calculatedFlexHeight = (availC * c_3.flex) / totalFlexC;
            }
          }
          jg = jg + 1;
        };
      } else {
        const contentH = fixedHeight + gapTotalC;
        const overflowH = contentH - innerHeight;
        if ( (overflowH > 0.0) && (fixedHeight > 0.0) ) {
          let weightedH = 0.0;
          let jq = 0;
          while (jq < childCount) {
            const c_4 = parent.getChild(jq);
            if ( (c_4.isAbsolute == false) && c_4.height.isSet ) {
              weightedH = weightedH + (c_4.flexShrink * c_4.height.pixels);
            }
            jq = jq + 1;
          };
          if ( weightedH > 0.0 ) {
            let js = 0;
            while (js < childCount) {
              const c_5 = parent.getChild(js);
              if ( (c_5.isAbsolute == false) && c_5.height.isSet ) {
                const cut = (overflowH * (c_5.flexShrink * c_5.height.pixels)) / weightedH;
                let finalH = c_5.height.pixels - cut;
                if ( finalH < 0.0 ) {
                  finalH = 0.0;
                }
                c_5.calculatedFlexHeight = finalH;
                c_5.height.isSet = false;
              }
              js = js + 1;
            };
          }
        }
      }
    }
    if ( isColumn == false ) {
      if ( parent.flexWrap == "nowrap" ) {
        let fixedW2 = 0.0;
        let totalFlex2 = 0.0;
        let flowCount2 = 0;
        let jr = 0;
        while (jr < childCount) {
          const c_6 = parent.getChild(jr);
          if ( c_6.isAbsolute == false ) {
            flowCount2 = flowCount2 + 1;
            if ( c_6.width.isSet ) {
              fixedW2 = ((fixedW2 + c_6.width.pixels) + c_6.box.marginLeftPx) + c_6.box.marginRightPx;
            } else {
              if ( c_6.flex > 0.0 ) {
                totalFlex2 = totalFlex2 + c_6.flex;
              }
            }
          }
          jr = jr + 1;
        };
        let gapTotal2 = 0.0;
        if ( flowCount2 > 1 ) {
          gapTotal2 = ((flowCount2 - 1)) * gapPx;
        }
        const contentW2 = fixedW2 + gapTotal2;
        const overflowW = contentW2 - innerWidth;
        if ( ((totalFlex2 == 0.0) && (overflowW > 0.0)) && (fixedW2 > 0.0) ) {
          let weightedW = 0.0;
          let jz = 0;
          while (jz < childCount) {
            const c_7 = parent.getChild(jz);
            if ( (c_7.isAbsolute == false) && c_7.width.isSet ) {
              weightedW = weightedW + (c_7.flexShrink * c_7.width.pixels);
            }
            jz = jz + 1;
          };
          if ( weightedW > 0.0 ) {
            let jw = 0;
            while (jw < childCount) {
              const c_8 = parent.getChild(jw);
              if ( (c_8.isAbsolute == false) && c_8.width.isSet ) {
                const cutW = (overflowW * (c_8.flexShrink * c_8.width.pixels)) / weightedW;
                let finalW = c_8.width.pixels - cutW;
                if ( finalW < 0.0 ) {
                  finalW = 0.0;
                }
                c_8.calculatedFlexWidth = finalW;
                c_8.width.isSet = false;
              }
              jw = jw + 1;
            };
          }
        }
      }
    }
    let i = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      child.inheritProperties(parent);
      child.resolveUnits(innerWidth, innerHeight);
      if ( child.isAbsolute ) {
        if ( (child.tagName == "layer") || (child.tagName == "Layer") ) {
          child.unitsResolved = false;
          child.resolveUnits(parent.calculatedWidth, parent.calculatedHeight);
          child.calculatedWidth = parent.calculatedWidth;
          child.calculatedHeight = parent.calculatedHeight;
          child.calculatedInnerWidth = child.box.getInnerWidth(child.calculatedWidth);
          child.calculatedInnerHeight = child.box.getInnerHeight(child.calculatedHeight);
          child.height.isSet = true;
          child.height.pixels = child.calculatedHeight;
          this.layoutAbsolute(child, parent.calculatedWidth, parent.calculatedHeight);
          child.calculatedX = child.calculatedX + parent.calculatedX;
          child.calculatedY = child.calculatedY + parent.calculatedY;
        } else {
          this.layoutElement(child, 0.0, 0.0, innerWidth, innerHeight);
          this.translateSubtree(child, startX, startY);
        }
        i = i + 1;
        continue;
      }
      const availableForChild = (innerWidth - child.box.marginLeftPx) - child.box.marginRightPx;
      let childWidth = this.estimateChildWidth(child, availableForChild);
      if ( child.width.isSet ) {
        if ( child.width.pixels >= innerWidth ) {
          childWidth = availableForChild;
        } else {
          childWidth = child.width.pixels;
        }
      } else {
        if ( child.calculatedFlexWidth > 0.0 ) {
          childWidth = child.calculatedFlexWidth;
        }
      }
      if ( isColumn == false ) {
        if ( parent.alignItems == "stretch" ) {
          if ( child.height.isSet == false ) {
            child.calculatedFlexHeight = innerHeight;
          }
        }
      }
      const childTotalWidth = (childWidth + child.box.marginLeftPx) + child.box.marginRightPx;
      if ( gapPx > 0.0 ) {
        if ( isColumn == false ) {
          if ( (rowElements.length) > 0 ) {
            currentX = currentX + gapPx;
          }
        } else {
          if ( placedInFlow > 0 ) {
            currentY = currentY + gapPx;
            totalHeight = totalHeight + gapPx;
          }
        }
      }
      if ( isColumn == false ) {
        const availableWidth = (startX + innerWidth) - currentX;
        if ( ((childTotalWidth > availableWidth) && ((rowElements.length) > 0)) && (parent.flexWrap != "nowrap") ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      child.calculatedX = currentX + child.box.marginLeftPx;
      child.calculatedY = currentY + child.box.marginTopPx;
      this.layoutElement(child, child.calculatedX, child.calculatedY, childWidth, innerHeight);
      const childHeight = child.calculatedHeight;
      const childTotalHeight = (childHeight + child.box.marginTopPx) + child.box.marginBottomPx;
      const placedWidth = (child.calculatedWidth + child.box.marginLeftPx) + child.box.marginRightPx;
      if ( isColumn ) {
        currentY = currentY + childTotalHeight;
        totalHeight = totalHeight + childTotalHeight;
      } else {
        currentX = currentX + placedWidth;
        rowElements.push(child);
        if ( childTotalHeight > rowHeight ) {
          rowHeight = childTotalHeight;
        }
      }
      placedInFlow = placedInFlow + 1;
      if ( child.lineBreak ) {
        if ( isColumn == false ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      i = i + 1;
    };
    if ( (isColumn == false) && ((rowElements.length) > 0) ) {
      this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
      this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
      totalHeight = totalHeight + rowHeight;
    }
    if ( isColumn == false ) {
      this.applyWrapReverse(parent, lineMembers, lineCounts, lineHeights, totalHeight);
      this.applyAlignContent(parent, lineMembers, lineCounts, lineHeights, totalHeight, innerHeight);
    }
    if ( isColumn ) {
      this.alignColumn(parent, totalHeight, startX, startY, innerWidth, innerHeight);
    }
    return totalHeight;
  };
  recordLine (members, counts, heights, rowElements, rowHeight) {
    const n = rowElements.length;
    if ( n == 0 ) {
      return;
    }
    let i = 0;
    while (i < n) {
      members.push(rowElements[i]);
      i = i + 1;
    };
    counts.push(n);
    heights.push(rowHeight);
  };
  applyWrapReverse (parent, members, counts, heights, contentHeight) {
    if ( parent.flexWrap != "wrap-reverse" ) {
      return;
    }
    const lineCount = counts.length;
    if ( lineCount < 2 ) {
      return;
    }
    let idx = 0;
    let offset = 0.0;
    let li = 0;
    while (li < lineCount) {
      const h = heights[li];
      const newOffset = (contentHeight - offset) - h;
      const shift = newOffset - offset;
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        k = k + 1;
      };
      idx = idx + n;
      offset = offset + h;
      li = li + 1;
    };
  };
  applyAlignContentStretch (parent, members, counts, heights, contentHeight, innerHeight) {
    const lineCount = counts.length;
    const free = innerHeight - contentHeight;
    if ( free <= 0.0 ) {
      return;
    }
    const extra = free / (lineCount);
    let idx = 0;
    let li = 0;
    while (li < lineCount) {
      const shift = extra * (li);
      const grown = (heights[li]) + extra;
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        if ( (el.height.isSet == false) && (el.isAbsolute == false) ) {
          const target = (grown - el.box.marginTopPx) - el.box.marginBottomPx;
          if ( target > el.calculatedHeight ) {
            el.calculatedHeight = target;
            el.calculatedInnerHeight = el.box.getInnerHeight(target);
            el.hasDefiniteHeight = true;
            if ( el.getChildCount() > 0 ) {
              this.layoutChildren(el);
            }
          }
        }
        k = k + 1;
      };
      idx = idx + n;
      li = li + 1;
    };
  };
  applyAlignContent (parent, members, counts, heights, contentHeight, innerHeight) {
    const lineCount = counts.length;
    if ( lineCount < 2 ) {
      return;
    }
    if ( parent.hasDefiniteHeight == false ) {
      return;
    }
    const mode = parent.alignContent;
    if ( mode == "flex-start" ) {
      return;
    }
    if ( mode == "start" ) {
      return;
    }
    if ( mode == "stretch" ) {
      this.applyAlignContentStretch(parent, members, counts, heights, contentHeight, innerHeight);
      return;
    }
    const free = innerHeight - contentHeight;
    if ( free <= 0.0 ) {
      return;
    }
    let first = 0.0;
    let between = 0.0;
    if ( (mode == "flex-end") || (mode == "end") ) {
      first = free;
    }
    if ( mode == "center" ) {
      first = free / 2.0;
    }
    if ( mode == "space-between" ) {
      between = free / ((lineCount - 1));
    }
    if ( mode == "space-around" ) {
      between = free / (lineCount);
      first = between / 2.0;
    }
    if ( mode == "space-evenly" ) {
      between = free / ((lineCount + 1));
      first = between;
    }
    let idx = 0;
    let li = 0;
    while (li < lineCount) {
      const shift = first + (between * (li));
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        k = k + 1;
      };
      idx = idx + n;
      li = li + 1;
    };
  };
  alignColumn (parent, contentHeight, startX, startY, innerWidth, innerHeight) {
    const childCount = parent.getChildCount();
    if ( childCount == 0 ) {
      return;
    }
    const verticalAlign = parent.justifyContent;
    let horizontalAlign = parent.alignItems;
    if ( (parent.align.length) > 0 ) {
      if ( parent.align != "left" ) {
        horizontalAlign = parent.align;
      }
    }
    let availableHeight = innerHeight;
    if ( parent.height.isSet ) {
      availableHeight = parent.calculatedInnerHeight;
    }
    let offsetY = 0.0;
    if ( verticalAlign == "center" ) {
      offsetY = (availableHeight - contentHeight) / 2.0;
    }
    if ( (verticalAlign == "flex-end") || (verticalAlign == "end") ) {
      offsetY = availableHeight - contentHeight;
    }
    let flowCount = 0;
    let fc = 0;
    while (fc < childCount) {
      const fchild = parent.getChild(fc);
      if ( fchild.isAbsolute == false ) {
        flowCount = flowCount + 1;
      }
      fc = fc + 1;
    };
    let freeSpaceY = availableHeight - contentHeight;
    if ( freeSpaceY < 0.0 ) {
      freeSpaceY = 0.0;
    }
    let distributeGapY = 0.0;
    let distributeFirstY = 0.0;
    if ( verticalAlign == "space-between" ) {
      if ( flowCount > 1 ) {
        distributeGapY = freeSpaceY / ((flowCount - 1));
      }
    }
    if ( verticalAlign == "space-around" ) {
      if ( flowCount > 0 ) {
        distributeGapY = freeSpaceY / (flowCount);
        distributeFirstY = distributeGapY / 2.0;
      }
    }
    if ( verticalAlign == "space-evenly" ) {
      distributeGapY = freeSpaceY / ((flowCount + 1));
      distributeFirstY = distributeGapY;
    }
    const usesDistributeY = (distributeGapY > 0.0) || (distributeFirstY > 0.0);
    let i = 0;
    let flowIndex = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      if ( child.isAbsolute == false ) {
        let elemOffsetY = offsetY;
        if ( usesDistributeY ) {
          elemOffsetY = distributeFirstY + (distributeGapY * (flowIndex));
        }
        if ( elemOffsetY != 0.0 ) {
          child.calculatedY = child.calculatedY + elemOffsetY;
          this.propagateOffsetToChildren(child, 0.0, elemOffsetY);
        }
        flowIndex = flowIndex + 1;
        const childTotalWidth = (child.calculatedWidth + child.box.marginLeftPx) + child.box.marginRightPx;
        let offsetX = 0.0;
        if ( horizontalAlign == "center" ) {
          offsetX = (innerWidth - childTotalWidth) / 2.0;
        }
        if ( (horizontalAlign == "flex-end") || (horizontalAlign == "end") ) {
          offsetX = innerWidth - childTotalWidth;
        }
        if ( offsetX != 0.0 ) {
          child.calculatedX = child.calculatedX + offsetX;
          this.propagateOffsetToChildren(child, offsetX, 0.0);
        }
      }
      i = i + 1;
    };
  };
  inheritBaselineFromFirstChild (element) {
    let i = 0;
    const n = element.getChildCount();
    while (i < n) {
      const c = element.getChild(i);
      if ( c.isAbsolute == false ) {
        if ( c.hasBaseline ) {
          element.calculatedBaseline = (c.calculatedY - element.calculatedY) + c.calculatedBaseline;
          element.calculatedDescent = c.calculatedDescent;
          element.hasBaseline = true;
          return;
        }
      }
      i = i + 1;
    };
  };
  baselineOffsetOf (el) {
    if ( el.hasBaseline ) {
      return el.box.marginTopPx + el.calculatedBaseline;
    }
    return (el.box.marginTopPx + el.calculatedHeight) + el.box.marginBottomPx;
  };
  alignRow (rowElements, parent, rowHeight, startX, innerWidth) {
    const elementCount = rowElements.length;
    if ( elementCount == 0 ) {
      return;
    }
    let rowWidth = 0.0;
    let i = 0;
    while (i < elementCount) {
      const el = rowElements[i];
      rowWidth = ((rowWidth + el.calculatedWidth) + el.box.marginLeftPx) + el.box.marginRightPx;
      i = i + 1;
    };
    const isColumn = parent.flexDirection == "column";
    const mainAxisAlign = parent.justifyContent;
    const crossAxisAlign = parent.alignItems;
    let horizontalAlign = mainAxisAlign;
    if ( isColumn ) {
      horizontalAlign = crossAxisAlign;
    }
    if ( (parent.align.length) > 0 ) {
      if ( parent.align != "left" ) {
        horizontalAlign = parent.align;
      }
    }
    let offsetX = 0.0;
    if ( horizontalAlign == "center" ) {
      offsetX = (innerWidth - rowWidth) / 2.0;
    }
    if ( (horizontalAlign == "flex-end") || (horizontalAlign == "right") ) {
      offsetX = innerWidth - rowWidth;
    }
    let freeSpace = innerWidth - rowWidth;
    if ( freeSpace < 0.0 ) {
      freeSpace = 0.0;
    }
    let distributeGap = 0.0;
    let distributeFirst = 0.0;
    if ( horizontalAlign == "space-between" ) {
      if ( elementCount > 1 ) {
        distributeGap = freeSpace / ((elementCount - 1));
      }
    }
    if ( horizontalAlign == "space-around" ) {
      distributeGap = freeSpace / (elementCount);
      distributeFirst = distributeGap / 2.0;
    }
    if ( horizontalAlign == "space-evenly" ) {
      distributeGap = freeSpace / ((elementCount + 1));
      distributeFirst = distributeGap;
    }
    const usesDistribute = (distributeGap > 0.0) || (distributeFirst > 0.0);
    let verticalAlignVal = crossAxisAlign;
    if ( isColumn ) {
      verticalAlignVal = mainAxisAlign;
    }
    if ( (parent.verticalAlign.length) > 0 ) {
      if ( parent.verticalAlign != "top" ) {
        verticalAlignVal = parent.verticalAlign;
      }
    }
    let effectiveRowHeight = rowHeight;
    if ( parent.height.isSet ) {
      const parentInnerHeight = parent.calculatedInnerHeight;
      if ( parentInnerHeight > rowHeight ) {
        effectiveRowHeight = parentInnerHeight;
      }
    }
    const useBaseline = verticalAlignVal == "baseline";
    let maxBaseline = 0.0;
    if ( useBaseline ) {
      let b = 0;
      while (b < elementCount) {
        const bel = rowElements[b];
        const bo = this.baselineOffsetOf(bel);
        if ( bo > maxBaseline ) {
          maxBaseline = bo;
        }
        b = b + 1;
      };
    }
    i = 0;
    while (i < elementCount) {
      const el_1 = rowElements[i];
      let elemOffsetX = offsetX;
      if ( usesDistribute ) {
        elemOffsetX = distributeFirst + (distributeGap * (i));
      }
      if ( elemOffsetX != 0.0 ) {
        el_1.calculatedX = el_1.calculatedX + elemOffsetX;
        this.propagateOffsetToChildren(el_1, elemOffsetX, 0.0);
      }
      const childTotalHeight = (el_1.calculatedHeight + el_1.box.marginTopPx) + el_1.box.marginBottomPx;
      let offsetY = 0.0;
      if ( verticalAlignVal == "center" ) {
        offsetY = (effectiveRowHeight - childTotalHeight) / 2.0;
      }
      if ( (verticalAlignVal == "flex-end") || (verticalAlignVal == "bottom") ) {
        offsetY = effectiveRowHeight - childTotalHeight;
      }
      if ( useBaseline ) {
        offsetY = maxBaseline - this.baselineOffsetOf(el_1);
      }
      if ( offsetY != 0.0 ) {
        el_1.calculatedY = el_1.calculatedY + offsetY;
        this.propagateOffsetToChildren(el_1, 0.0, offsetY);
      }
      i = i + 1;
    };
  };
  propagateOffsetToChildren (parent, offsetX, offsetY) {
    const childCount = parent.getChildCount();
    let i = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      if ( offsetX != 0.0 ) {
        child.calculatedX = child.calculatedX + offsetX;
      }
      if ( offsetY != 0.0 ) {
        child.calculatedY = child.calculatedY + offsetY;
      }
      this.propagateOffsetToChildren(child, offsetX, offsetY);
      i = i + 1;
    };
  };
  mirrorChildren (parent) {
    if ( parent.resolvedRtl == false ) {
      return;
    }
    const left = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const right = left + parent.calculatedInnerWidth;
    const span = left + right;
    const n = parent.getChildCount();
    let i = 0;
    while (i < n) {
      const ch = parent.getChild(i);
      if ( ch.isAbsolute == false ) {
        const mL = ch.box.marginLeftPx;
        const mR = ch.box.marginRightPx;
        const marginRightEdge = (ch.calculatedX + ch.calculatedWidth) + mR;
        const nx = (span - marginRightEdge) + mL;
        this.translateSubtree(ch, nx - ch.calculatedX, 0.0);
      }
      i = i + 1;
    };
  };
  translateSubtree (element, dx, dy) {
    element.calculatedX = element.calculatedX + dx;
    element.calculatedY = element.calculatedY + dy;
    const count = element.getChildCount();
    let i = 0;
    while (i < count) {
      this.translateSubtree(element.getChild(i), dx, dy);
      i = i + 1;
    };
  };
  layoutAbsolute (element, parentWidth, parentHeight) {
    if ( element.left.isSet ) {
      element.calculatedX = element.left.pixels + element.box.marginLeftPx;
    } else {
      if ( element.x.isSet ) {
        element.calculatedX = element.x.pixels + element.box.marginLeftPx;
      } else {
        if ( element.right.isSet ) {
          let width = element.calculatedWidth;
          if ( width == 0.0 ) {
            if ( element.width.isSet ) {
              width = element.width.pixels;
            }
          }
          element.calculatedX = ((parentWidth - element.right.pixels) - width) - element.box.marginRightPx;
        }
      }
    }
    if ( element.top.isSet ) {
      element.calculatedY = element.top.pixels + element.box.marginTopPx;
    } else {
      if ( element.y.isSet ) {
        element.calculatedY = element.y.pixels + element.box.marginTopPx;
      } else {
        if ( element.bottom.isSet ) {
          let height = element.calculatedHeight;
          if ( height == 0.0 ) {
            if ( element.height.isSet ) {
              height = element.height.pixels;
            }
          }
          element.calculatedY = ((parentHeight - element.bottom.pixels) - height) - element.box.marginBottomPx;
        }
      }
    }
  };
  contentExtent (element) {
    let right = 0.0;
    let i = 0;
    const n = element.getChildCount();
    while (i < n) {
      const c = element.getChild(i);
      if ( c.isAbsolute == false ) {
        const r = (c.calculatedX + c.calculatedWidth) + c.box.marginRightPx;
        if ( r > right ) {
          right = r;
        }
      }
      i = i + 1;
    };
    if ( right <= 0.0 ) {
      return 0.0;
    }
    return ((right - element.calculatedX) + element.box.paddingRightPx) + element.box.borderWidthPx;
  };
  placeOverlaysIn (el) {
    let i = 0;
    while (i < (el.children.length)) {
      const c = el.children[i];
      if ( c.isOverlay ) {
        this.placeOverlay(c, el);
      }
      this.placeOverlaysIn(c);
      i = i + 1;
    };
  };
  findOverlayAnchor (surface, parent) {
    if ( typeof(surface.overlayAnchor) != "undefined" ) {
      return surface.overlayAnchor;
    }
    let i = 0;
    while (i < (parent.children.length)) {
      const c = parent.children[i];
      if ( c.isOverlayAnchor ) {
        const hit = c;
        return hit;
      }
      i = i + 1;
    };
    let miss;
    return miss;
  };
  placeOverlay (surface, parent) {
    const w = surface.calculatedWidth;
    const h = surface.calculatedHeight;
    let x = 0.0;
    let y = 0.0;
    if ( surface.overlaySide == "center" ) {
      x = (this.pageWidth - w) / 2.0;
      y = (this.pageHeight - h) / 2.0;
    } else {
      const maybe = this.findOverlayAnchor(surface, parent);
      if ( typeof(maybe) === "undefined" ) {
        this.overlayErrors.push(surface.id + ": overlay has no anchor — give a sibling `overlay-anchor-role`, or use `overlay-side: center`");
        return;
      }
      const a = maybe;
      const ax = a.calculatedX;
      const ay = a.calculatedY;
      const aw = a.calculatedWidth;
      const ah = a.calculatedHeight;
      if ( surface.overlaySide == "top" ) {
        x = this.overlayCross(ax, aw, w, surface.overlayAlign);
        y = (ay - h) - surface.overlayGap;
      }
      if ( surface.overlaySide == "bottom" ) {
        x = this.overlayCross(ax, aw, w, surface.overlayAlign);
        y = (ay + ah) + surface.overlayGap;
      }
      if ( surface.overlaySide == "right" ) {
        x = (ax + aw) + surface.overlayGap;
        y = this.overlayCross(ay, ah, h, surface.overlayAlign);
      }
      if ( surface.overlaySide == "left" ) {
        x = (ax - w) - surface.overlayGap;
        y = this.overlayCross(ay, ah, h, surface.overlayAlign);
      }
    }
    surface.overlayX = x;
    surface.overlayY = y;
    this.translateSubtree(surface, x - surface.calculatedX, y - surface.calculatedY);
  };
  overlayCross (anchorStart, anchorSize, size, align) {
    if ( align == "center" ) {
      return anchorStart + ((anchorSize - size) / 2.0);
    }
    if ( align == "end" ) {
      return (anchorStart + anchorSize) - size;
    }
    return anchorStart;
  };
  getOverlayErrors () {
    return this.overlayErrors;
  };
  printLayout (element, indent) {
    let indentStr = "";
    let i = 0;
    while (i < indent) {
      indentStr = indentStr + "  ";
      i = i + 1;
    };
    console.log(((((((((((indentStr + element.tagName) + " id=\"") + element.id) + "\" (") + ((element.calculatedX.toString()))) + ", ") + ((element.calculatedY.toString()))) + ") ") + ((element.calculatedWidth.toString()))) + "x") + ((element.calculatedHeight.toString())));
    const childCount = element.getChildCount();
    i = 0;
    while (i < childCount) {
      const child = element.getChild(i);
      this.printLayout(child, indent + 1);
      i = i + 1;
    };
  };
  intrinsicWidthOf (el) {
    return this.intrinsicWidth(el, false);
  };
  minIntrinsicWidthOf (el) {
    return this.intrinsicWidth(el, true);
  };
  intrinsicWidth (el, wantMin) {
    let outer = 0.0;
    if ( el.width.isSet ) {
      outer = el.width.pixels;
    } else {
      const textContent = el.textContent;
      if ( (textContent.length) > 0 ) {
        if ( el.getChildCount() == 0 ) {
          let fs = el.inheritedFontSize;
          if ( el.fontSize.isSet ) {
            fs = el.fontSize.pixels;
          }
          if ( fs <= 0.0 ) {
            fs = 14.0;
          }
          let contentW = 0.0;
          if ( wantMin ) {
            contentW = this.textEngine.minLineWidth(textContent, el.effectiveFontFamily(), fs);
          } else {
            contentW = this.textEngine.maxLineWidth(textContent, el.effectiveFontFamily(), fs);
          }
          outer = contentW + el.box.getHorizontalChrome();
        }
      }
    }
    if ( outer <= 0.0 ) {
      return 0.0;
    }
    return (outer + el.box.marginLeftPx) + el.box.marginRightPx;
  };
  layoutGrid (parent) {
    const innerWidth = parent.calculatedInnerWidth;
    const innerHeight = parent.calculatedInnerHeight;
    const startX = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const startY = (parent.calculatedY + parent.box.borderWidthPx) + parent.box.paddingTopPx;
    let colGapPx = 0.0;
    let rowGapPx = 0.0;
    if ( parent.gap.isSet ) {
      parent.gap.rootFontSize = parent.rootFontSize;
      parent.gap.resolve(innerWidth, parent.inheritedFontSize);
      colGapPx = parent.gap.pixels;
      rowGapPx = parent.gap.pixels;
    }
    if ( parent.columnGap.isSet ) {
      parent.columnGap.rootFontSize = parent.rootFontSize;
      parent.columnGap.resolve(innerWidth, parent.inheritedFontSize);
      colGapPx = parent.columnGap.pixels;
    }
    if ( parent.rowGap.isSet ) {
      parent.rowGap.rootFontSize = parent.rootFontSize;
      parent.rowGap.resolve(innerHeight, parent.inheritedFontSize);
      rowGapPx = parent.rowGap.pixels;
    }
    let colSpec = parent.gridTemplateColumns;
    if ( (colSpec.length) == 0 ) {
      colSpec = "1fr";
    }
    let usingSubgrid = false;
    if ( colSpec == "subgrid" ) {
      if ( (parent.subgridColumnSizes.length) > 0 ) {
        usingSubgrid = true;
        let sgSpec = "";
        let sg = 0;
        while (sg < (parent.subgridColumnSizes.length)) {
          if ( sg > 0 ) {
            sgSpec = sgSpec + " ";
          }
          sgSpec = (sgSpec + (((parent.subgridColumnSizes[sg]).toString()))) + "px";
          sg = sg + 1;
        };
        colSpec = sgSpec;
      } else {
        if ( parent.subgridPending == false ) {
          this.warn("grid-template-columns: subgrid has no enclosing grid to inherit tracks from; falling back to 1fr");
        }
        colSpec = "1fr";
      }
    }
    const areas = EVGGridAreas.parse(parent.gridTemplateAreas);
    let hasAreas = false;
    if ( (parent.gridTemplateAreas.length) > 0 ) {
      if ( areas.hadError ) {
        this.warn("grid-template-areas: " + areas.errorText);
      } else {
        hasAreas = true;
        if ( (parent.gridTemplateColumns.length) == 0 ) {
          let derived = "";
          let dc = 0;
          while (dc < areas.columns) {
            if ( dc > 0 ) {
              derived = derived + " ";
            }
            derived = derived + "1fr";
            dc = dc + 1;
          };
          colSpec = derived;
        }
      }
    }
    const cols = EVGGridTemplate.parse(colSpec);
    if ( cols.hadError ) {
      this.warn("grid-template-columns: " + cols.errorText);
    }
    const colCount = (cols).count();
    if ( colCount < 1 ) {
      return 0.0;
    }
    const colGapTotal = ((colCount - 1)) * colGapPx;
    let rowTemplateSpec = parent.gridTemplateRows;
    if ( rowTemplateSpec == "subgrid" ) {
      rowTemplateSpec = "";
    }
    const rowTemplate = EVGGridTemplate.parse(rowTemplateSpec);
    let items = [];
    let colStarts = [];
    let colSpans = [];
    let rowStarts = [];
    let rowSpans = [];
    let i = 0;
    const childCount = parent.getChildCount();
    while (i < childCount) {
      const c = parent.getChild(i);
      c.inheritProperties(parent);
      c.resolveUnits(innerWidth, innerHeight);
      if ( (c.gridTemplateColumns == "subgrid") || (c.gridTemplateRows == "subgrid") ) {
        c.subgridPending = true;
      }
      if ( c.isAbsolute == false ) {
        const cp = EVGGridPlacement.parse(c.gridColumn);
        cp.resolveNames(cols);
        if ( cp.hadError ) {
          this.warn("grid-column: " + cp.errorText);
        }
        const rp = EVGGridPlacement.parse(c.gridRow);
        rp.resolveNames(rowTemplate);
        if ( rp.hadError ) {
          this.warn("grid-row: " + rp.errorText);
        }
        if ( hasAreas ) {
          if ( (c.gridArea.length) > 0 ) {
            const at = areas.indexOfName(c.gridArea);
            if ( at >= 0 ) {
              cp.start = (areas.colStart[at]) + 1;
              cp.span = areas.colSpan[at];
              rp.start = (areas.rowStart[at]) + 1;
              rp.span = areas.rowSpan[at];
            } else {
              this.warn(("grid-area: no area named \"" + c.gridArea) + "\" in grid-template-areas");
            }
          }
        }
        let cspan = cp.span;
        if ( cspan > colCount ) {
          cspan = colCount;
        }
        items.push(c);
        colStarts.push(cp.start);
        colSpans.push(cspan);
        rowStarts.push(rp.start);
        rowSpans.push(rp.span);
      }
      i = i + 1;
    };
    const itemCount = items.length;
    if ( itemCount == 0 ) {
      return 0.0;
    }
    const isDense = (parent.gridAutoFlow.indexOf("dense")) >= 0;
    let occupied = [];
    let rowsUsed = 0;
    let placedRow = [];
    let placedCol = [];
    let cursorRow = 0;
    let cursorCol = 0;
    let k = 0;
    while (k < itemCount) {
      const wantCol = colStarts[k];
      const wantRow = rowStarts[k];
      const span = colSpans[k];
      const rspan = rowSpans[k];
      let col = 0;
      let row = 0;
      if ( wantCol > 0 ) {
        col = wantCol - 1;
        if ( col > (colCount - span) ) {
          col = colCount - span;
        }
        if ( col < 0 ) {
          col = 0;
        }
      }
      if ( wantRow > 0 ) {
        row = wantRow - 1;
      }
      if ( (wantCol > 0) && (wantRow > 0) ) {
      } else {
        if ( wantRow > 0 ) {
          cursorRow = row;
          cursorCol = 0;
        }
        if ( wantCol > 0 ) {
          row = cursorRow;
          while (this.gridOccupied(occupied, colCount, row, col, span, rspan)) {
            row = row + 1;
          };
        } else {
          if ( isDense ) {
            row = 0;
            col = 0;
          } else {
            row = cursorRow;
            col = cursorCol;
          }
          let searching = true;
          while (searching) {
            if ( (col + span) > colCount ) {
              row = row + 1;
              col = 0;
            } else {
              if ( this.gridOccupied(occupied, colCount, row, col, span, rspan) ) {
                col = col + 1;
              } else {
                searching = false;
              }
            }
          };
          if ( isDense == false ) {
            cursorRow = row;
            cursorCol = col + span;
          }
        }
      }
      const needRows = row + rspan;
      while (rowsUsed < needRows) {
        let g = 0;
        while (g < colCount) {
          occupied.push(false);
          g = g + 1;
        };
        rowsUsed = rowsUsed + 1;
      };
      let rr = 0;
      while (rr < rspan) {
        let cc = 0;
        while (cc < span) {
          const idx = (((row + rr) * colCount) + col) + cc;
          occupied[idx] = true;
          cc = cc + 1;
        };
        rr = rr + 1;
      };
      placedRow.push(row);
      placedCol.push(col);
      k = k + 1;
    };
    let colContent = [];
    let colMinContent = [];
    let ci = 0;
    while (ci < colCount) {
      colContent.push(0.0);
      colMinContent.push(0.0);
      ci = ci + 1;
    };
    if ( cols.hasIntrinsicTrack() ) {
      let ic = 0;
      while (ic < (items.length)) {
        if ( (colSpans[ic]) == 1 ) {
          const col2 = placedCol[ic];
          if ( col2 < colCount ) {
            const it = items[ic];
            const w2 = this.intrinsicWidthOf(it);
            if ( w2 > (colContent[col2]) ) {
              colContent[col2] = w2;
            }
            const m2 = this.minIntrinsicWidthOf(it);
            if ( m2 > (colMinContent[col2]) ) {
              colMinContent[col2] = m2;
            }
          }
        }
        ic = ic + 1;
      };
    }
    cols.resolveWithContent(innerWidth - colGapTotal, colContent, colMinContent);
    let rowSpec = parent.gridTemplateRows;
    let rowSizes = [];
    let rowGapTotal = 0.0;
    if ( rowsUsed > 1 ) {
      rowGapTotal = ((rowsUsed - 1)) * rowGapPx;
    }
    let usingRowSubgrid = false;
    if ( rowSpec == "subgrid" ) {
      if ( (parent.subgridRowSizes.length) > 0 ) {
        usingRowSubgrid = true;
        let sgrSpec = "";
        let sgr = 0;
        while (sgr < (parent.subgridRowSizes.length)) {
          if ( sgr > 0 ) {
            sgrSpec = sgrSpec + " ";
          }
          sgrSpec = (sgrSpec + (((parent.subgridRowSizes[sgr]).toString()))) + "px";
          sgr = sgr + 1;
        };
        rowSpec = sgrSpec;
      } else {
        if ( parent.subgridPending == false ) {
          this.warn("grid-template-rows: subgrid has no enclosing grid to inherit tracks from; falling back to content-sized rows");
        }
        rowSpec = "";
      }
    }
    let haveTemplateRows = false;
    if ( (rowSpec.length) > 0 ) {
      if ( parent.hasDefiniteHeight || usingRowSubgrid ) {
        haveTemplateRows = true;
      }
    }
    if ( haveTemplateRows ) {
      const rows = EVGGridTemplate.parse(rowSpec);
      if ( rows.hadError ) {
        this.warn("grid-template-rows: " + rows.errorText);
      }
      rows.resolve(innerHeight - rowGapTotal);
      let r2 = 0;
      while (r2 < rowsUsed) {
        if ( r2 < (rows).count() ) {
          const tk = rows.trackAt(r2);
          rowSizes.push(tk.sizePx);
        } else {
          if ( (rows).count() > 0 ) {
            const lastTk = rows.trackAt(((rows).count() - 1));
            rowSizes.push(lastTk.sizePx);
          } else {
            rowSizes.push(0.0);
          }
        }
        r2 = r2 + 1;
      };
    } else {
      let r3 = 0;
      while (r3 < rowsUsed) {
        rowSizes.push(0.0);
        r3 = r3 + 1;
      };
      let m = 0;
      while (m < itemCount) {
        const it_1 = items[m];
        const rspanM = rowSpans[m];
        const ri = placedRow[m];
        const isRowSubgrid = it_1.gridTemplateRows == "subgrid";
        if ( (rspanM == 1) || isRowSubgrid ) {
          const cw = cols.extentOf((placedCol[m]), (colSpans[m]), colGapPx);
          const avail = (cw - it_1.box.marginLeftPx) - it_1.box.marginRightPx;
          it_1.calculatedFlexHeight = 0.0;
          this.layoutElement(it_1, 0.0, 0.0, avail, 0.0);
          if ( isRowSubgrid ) {
            let sub = 0;
            while (sub < rspanM) {
              if ( sub < (it_1.computedRowSizes.length) ) {
                const sh = it_1.computedRowSizes[sub];
                if ( sh > (rowSizes[(ri + sub)]) ) {
                  rowSizes[ri + sub] = sh;
                }
              }
              sub = sub + 1;
            };
          } else {
            const h = (it_1.calculatedHeight + it_1.box.marginTopPx) + it_1.box.marginBottomPx;
            if ( h > (rowSizes[ri]) ) {
              rowSizes[ri] = h;
            }
          }
        }
        m = m + 1;
      };
      if ( (rowSpec.length) > 0 ) {
        const declared = EVGGridTemplate.parse(rowSpec);
        if ( declared.hadError ) {
          this.warn("grid-template-rows: " + declared.errorText);
        }
        let dr = 0;
        while (dr < rowsUsed) {
          if ( dr < (declared).count() ) {
            const dt = declared.trackAt(dr);
            if ( dt.kind == 0 ) {
              rowSizes[dr] = dt.value;
            }
          }
          dr = dr + 1;
        };
      }
    }
    let p = 0;
    while (p < itemCount) {
      const el = items[p];
      const cIdx = placedCol[p];
      const rIdx = placedRow[p];
      const cSpan = colSpans[p];
      const rSpan = rowSpans[p];
      const cellW = cols.extentOf(cIdx, cSpan, colGapPx);
      const cellH = this.gridRowExtent(rowSizes, rIdx, rSpan, rowGapPx);
      const offX = cols.offsetOf(cIdx, colGapPx);
      const offY = this.gridRowOffset(rowSizes, rIdx, rowGapPx);
      el.calculatedX = (startX + offX) + el.box.marginLeftPx;
      el.calculatedY = (startY + offY) + el.box.marginTopPx;
      let boxW = (cellW - el.box.marginLeftPx) - el.box.marginRightPx;
      let boxH = (cellH - el.box.marginTopPx) - el.box.marginBottomPx;
      if ( boxW < 0.0 ) {
        boxW = 0.0;
      }
      if ( boxH < 0.0 ) {
        boxH = 0.0;
      }
      if ( boxH > 0.0 ) {
        el.calculatedFlexHeight = boxH;
      }
      if ( el.gridTemplateColumns == "subgrid" ) {
        el.subgridColumnSizes.length = 0;
        let sgi = 0;
        while (sgi < cSpan) {
          const tk_1 = cols.trackAt((cIdx + sgi));
          el.subgridColumnSizes.push(tk_1.sizePx);
          sgi = sgi + 1;
        };
      }
      if ( el.gridTemplateRows == "subgrid" ) {
        el.subgridRowSizes.length = 0;
        let sgj = 0;
        while (sgj < rSpan) {
          const rIdx2 = rIdx + sgj;
          if ( rIdx2 < (rowSizes.length) ) {
            el.subgridRowSizes.push(rowSizes[rIdx2]);
          }
          sgj = sgj + 1;
        };
      }
      el.unitsResolved = false;
      el.resolveUnits(boxW, boxH);
      this.layoutElement(el, el.calculatedX, el.calculatedY, boxW, boxH);
      p = p + 1;
    };
    parent.computedRowSizes.length = 0;
    let cr = 0;
    while (cr < rowsUsed) {
      parent.computedRowSizes.push(rowSizes[cr]);
      cr = cr + 1;
    };
    let total = 0.0;
    let s = 0;
    while (s < rowsUsed) {
      total = total + (rowSizes[s]);
      s = s + 1;
    };
    total = total + rowGapTotal;
    return total;
  };
  gridOccupied (occupied, colCount, row, col, span, rspan) {
    const total = occupied.length;
    let rr = 0;
    while (rr < rspan) {
      let cc = 0;
      while (cc < span) {
        const idx = (((row + rr) * colCount) + col) + cc;
        if ( idx < total ) {
          if ( occupied[idx] ) {
            return true;
          }
        }
        cc = cc + 1;
      };
      rr = rr + 1;
    };
    return false;
  };
  gridRowExtent (rowSizes, from, span, gap) {
    let total = 0.0;
    const n = rowSizes.length;
    let i = from;
    let placed = 0;
    while ((i < n) && (placed < span)) {
      total = total + (rowSizes[i]);
      placed = placed + 1;
      i = i + 1;
    };
    if ( placed > 1 ) {
      total = total + (((placed - 1)) * gap);
    }
    return total;
  };
  gridRowOffset (rowSizes, index, gap) {
    let total = 0.0;
    let i = 0;
    while (i < index) {
      total = total + (rowSizes[i]);
      total = total + gap;
      i = i + 1;
    };
    return total;
  };
  estimateChildWidth (child, maxInnerWidth) {
    if ( child.width.isSet ) {
      return child.width.pixels;
    }
    if ( child.calculatedFlexWidth > 0.0 ) {
      return child.calculatedFlexWidth;
    }
    const textContent = child.textContent;
    if ( (textContent.length) > 0 ) {
      if ( child.getChildCount() == 0 ) {
        let fontSize = child.inheritedFontSize;
        if ( child.fontSize.isSet ) {
          fontSize = child.fontSize.pixels;
        }
        if ( fontSize <= 0.0 ) {
          fontSize = 14.0;
        }
        const contentW = this.textEngine.maxLineWidth(textContent, child.effectiveFontFamily(), fontSize);
        const measuredW = ((contentW + child.box.paddingLeftPx) + child.box.paddingRightPx) + (child.box.borderWidthPx * 2.0);
        if ( measuredW < maxInnerWidth ) {
          return measuredW;
        }
      }
    }
    return maxInnerWidth;
  };
}
class RtlCheck  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  ok (name, cond) {
    if ( cond ) {
      this.passed = this.passed + 1;
      console.log("  PASS  " + name);
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL  " + name);
    }
  };
  eqNum (name, got, want) {
    let d = got - want;
    if ( d < 0.0 ) {
      d = 0.0 - d;
    }
    this.ok((((name + " (got ") + ((got.toString()))) + " want ") + (((want.toString())) + ")"), d < 0.5);
  };
}
class EVGRtlLayoutTest  {
  constructor() {
    this.c = new RtlCheck();
  }
  laidOut (root) {
    const lay = new EVGLayout();
    lay.setPageSize(300.0, 200.0);
    lay.layout(root);
    return root;
  };
  run () {
    console.log("=== EVGRtlLayoutTest ===");
    this.testOrder();
    this.testGrid();
    this.testInheritance();
    this.testIsland();
    this.testAbsolute();
    this.testMargins();
    this.testLegacyDirection();
    console.log("");
    console.log(("passed = " + ((this.c.passed.toString()))) + ("  failed = " + ((this.c.failed.toString()))));
    if ( this.c.failed == 0 ) {
      console.log("ALL PASS");
    } else {
      console.log("SOME FAILED");
    }
  };
  testOrder () {
    console.log("--- the order, and which end it packs against ---");
    const ltr = this.laidOut(EVGRtlLayoutTest.strip(false));
    this.c.eqNum("a starts at the left edge", EVGRtlLayoutTest.childX(ltr, 0), 0.0);
    this.c.eqNum("b follows it", EVGRtlLayoutTest.childX(ltr, 1), 40.0);
    this.c.eqNum("and c follows b", EVGRtlLayoutTest.childX(ltr, 2), 100.0);
    const rtl = this.laidOut(EVGRtlLayoutTest.strip(true));
    this.c.eqNum("a is now against the RIGHT edge", EVGRtlLayoutTest.childX(rtl, 0), 260.0);
    this.c.eqNum("b sits to its left", EVGRtlLayoutTest.childX(rtl, 1), 200.0);
    this.c.eqNum("and c to the left of b", EVGRtlLayoutTest.childX(rtl, 2), 180.0);
    this.c.ok("the tree order is untouched", (ltr.getChild(0)).id == "a");
    this.c.ok("in the mirrored one too", (rtl.getChild(0)).id == "a");
    this.c.ok("nothing was pushed off the left edge", EVGRtlLayoutTest.childX(rtl, 2) >= 0.0);
  };
  testGrid () {
    console.log("--- and the grid turns with it ---");
    const g = new EVGElement();
    g.id = "grid";
    g.width = EVGUnit.px(300.0);
    g.height = EVGUnit.px(60.0);
    g.display = "grid";
    g.setAttribute("grid-template-columns", "100px 200px");
    g.setAttribute("direction", "rtl");
    const one = EVGRtlLayoutTest.box("one", 100.0, 20.0);
    const two = EVGRtlLayoutTest.box("two", 200.0, 20.0);
    g.addChild(one);
    g.addChild(two);
    this.laidOut(g);
    this.c.eqNum("the first column is on the right", one.calculatedX, 200.0);
    this.c.eqNum("and the second beside it", two.calculatedX, 0.0);
    const g2 = new EVGElement();
    g2.id = "grid2";
    g2.width = EVGUnit.px(300.0);
    g2.height = EVGUnit.px(60.0);
    g2.display = "grid";
    g2.setAttribute("grid-template-columns", "100px 200px");
    const one2 = EVGRtlLayoutTest.box("one", 100.0, 20.0);
    const two2 = EVGRtlLayoutTest.box("two", 200.0, 20.0);
    g2.addChild(one2);
    g2.addChild(two2);
    this.laidOut(g2);
    this.c.eqNum("left to right, the first column is on the left", one2.calculatedX, 0.0);
    this.c.eqNum("and the second follows it", two2.calculatedX, 100.0);
  };
  testInheritance () {
    console.log("--- one switch, not one per panel ---");
    const page = new EVGElement();
    page.id = "page";
    page.width = EVGUnit.px(300.0);
    page.height = EVGUnit.px(200.0);
    page.display = "flex";
    page.flexDirection = "column";
    page.setAttribute("direction", "rtl");
    const strip = new EVGElement();
    strip.id = "strip";
    strip.width = EVGUnit.px(300.0);
    strip.height = EVGUnit.px(50.0);
    strip.display = "flex";
    strip.flexDirection = "row";
    strip.addChild(EVGRtlLayoutTest.box("a", 40.0, 20.0));
    strip.addChild(EVGRtlLayoutTest.box("b", 60.0, 20.0));
    page.addChild(strip);
    this.laidOut(page);
    this.c.ok("the nested strip inherited the direction", strip.resolvedRtl);
    this.c.eqNum("so its first button is on the right", EVGRtlLayoutTest.childX(strip, 0), 260.0);
    this.c.eqNum("and its second is beside it", EVGRtlLayoutTest.childX(strip, 1), 200.0);
  };
  testIsland () {
    console.log("--- and an island can opt back out ---");
    const page = new EVGElement();
    page.id = "page";
    page.width = EVGUnit.px(300.0);
    page.height = EVGUnit.px(200.0);
    page.display = "flex";
    page.flexDirection = "column";
    page.setAttribute("direction", "rtl");
    const code = new EVGElement();
    code.id = "code";
    code.width = EVGUnit.px(300.0);
    code.height = EVGUnit.px(50.0);
    code.display = "flex";
    code.flexDirection = "row";
    code.setAttribute("direction", "ltr");
    code.addChild(EVGRtlLayoutTest.box("a", 40.0, 20.0));
    code.addChild(EVGRtlLayoutTest.box("b", 60.0, 20.0));
    page.addChild(code);
    this.laidOut(page);
    this.c.ok("the island is left to right", code.resolvedRtl == false);
    this.c.eqNum("so its first box is on the left", EVGRtlLayoutTest.childX(code, 0), 0.0);
    this.c.eqNum("and the second follows it", EVGRtlLayoutTest.childX(code, 1), 40.0);
  };
  testAbsolute () {
    console.log("--- what must NOT move ---");
    const page = new EVGElement();
    page.id = "page";
    page.width = EVGUnit.px(300.0);
    page.height = EVGUnit.px(200.0);
    page.display = "flex";
    page.flexDirection = "row";
    page.setAttribute("direction", "rtl");
    const pinned = EVGRtlLayoutTest.box("pinned", 30.0, 30.0);
    pinned.isAbsolute = true;
    pinned.left = EVGUnit.px(0.0);
    pinned.top = EVGUnit.px(0.0);
    page.addChild(pinned);
    this.laidOut(page);
    this.c.eqNum("an absolute child stays where it was pinned", pinned.calculatedX, 0.0);
  };
  testMargins () {
    console.log("--- margins stay physical ---");
    const root = new EVGElement();
    root.id = "root";
    root.width = EVGUnit.px(300.0);
    root.height = EVGUnit.px(50.0);
    root.display = "flex";
    root.flexDirection = "row";
    root.setAttribute("direction", "rtl");
    const only = EVGRtlLayoutTest.box("only", 40.0, 20.0);
    only.box.marginLeft = EVGUnit.px(10.0);
    root.addChild(only);
    this.laidOut(root);
    this.c.eqNum("the left margin is still on the left of the box", only.calculatedX, 260.0);
  };
  testLegacyDirection () {
    console.log("--- and the property that already had the name ---");
    const e = new EVGElement();
    e.setAttribute("direction", "row");
    this.c.ok("row is still the axis", e.direction == "row");
    this.c.ok("and says nothing about handedness", e.textDir == "");
    const e2 = new EVGElement();
    e2.setAttribute("direction", "column");
    this.c.ok("so is column", e2.direction == "column");
    const e3 = new EVGElement();
    e3.setAttribute("direction", "rtl");
    this.c.ok("rtl is the handedness", e3.textDir == "rtl");
    this.c.ok("and leaves the axis alone", e3.direction == "row");
  };
}
EVGRtlLayoutTest.box = function(id, w, h) {
  const e = new EVGElement();
  e.id = id;
  e.width = EVGUnit.px(w);
  e.height = EVGUnit.px(h);
  return e;
};
EVGRtlLayoutTest.strip = function(rtl) {
  const root = new EVGElement();
  root.id = "root";
  root.width = EVGUnit.px(300.0);
  root.height = EVGUnit.px(50.0);
  root.display = "flex";
  root.flexDirection = "row";
  if ( rtl ) {
    root.setAttribute("direction", "rtl");
  }
  root.addChild(EVGRtlLayoutTest.box("a", 40.0, 20.0));
  root.addChild(EVGRtlLayoutTest.box("b", 60.0, 20.0));
  root.addChild(EVGRtlLayoutTest.box("c", 20.0, 20.0));
  return root;
};
EVGRtlLayoutTest.childX = function(parent, i) {
  const ch = parent.getChild(i);
  return ch.calculatedX;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const t = new EVGRtlLayoutTest();
  t.run();
}
__js_main();
