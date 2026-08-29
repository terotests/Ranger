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
class EVGFlight  {
  constructor() {
    this.property = "";
    this.durationMs = 0.0;
    this.delayMs = 0.0;
    this.elapsedMs = 0.0;
    this.easing = new EVGEasing();
    this.fromNumber = 0.0;
    this.toNumber = 0.0;
    this.isColor = false;
    this.unitCode = 0;
    this.reversingStartNumber = 0.0;
    this.reversingFactor = 1.0;
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
    this.overlayPlacedSide = "";
    this.isHovered = false;
    this.isFocused = false;
    this.isPressed = false;
    this.transitionSpec = "";
    this.transitions = [];
    this.role = "";
    this.a11yLabel = "";
    this.a11yRoleDescription = "";
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
    if ( (this.orientation.length) > 0 ) {
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
    if ( (this.orientation.length) > 0 ) {
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
    return (this.theme.length) > 0;
  };
}
class EVGStyleSheet  {
  constructor() {
    this.rules = [];
    this.errors = [];
    this.ruleCounter = 0;
    this.pendingMedia = new EVGMediaQuery();
    this.viewportW = 0.0;
    this.viewportH = 0.0;
    this.coarsePointer = false;
    this.ruleCounter = 0;
  }
  setViewport (w, h, coarse) {
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
    const src = this.stripComments(css);
    this.parseBlock(src, new EVGMediaQuery());
  };
  parseBlock (src, cond) {
    const __len = src.length;
    let i = 0;
    while (i < __len) {
      const braceAt = this.findChar(src, i, 123);
      if ( braceAt < 0 ) {
        const tail = (src.substring(i, __len )).trim();
        if ( (tail.length) > 0 ) {
          this.errors.push("Ignored trailing text with no rule body: " + tail);
        }
        return;
      }
      const selectorText = (src.substring(i, braceAt )).trim();
      if ( (this).startsWith(selectorText, "@media") ) {
        const endAt = this.matchingBrace(src, braceAt);
        if ( endAt < 0 ) {
          this.errors.push("Unclosed @media block: " + selectorText);
          return;
        }
        const inner = src.substring((braceAt + 1), endAt );
        const q = this.parseMedia(((selectorText.substring(6, (selectorText.length) )).trim()));
        this.parseBlock(inner, this.andQuery(cond, q));
        i = endAt + 1;
      } else {
        if ( (selectorText.length) > 0 ) {
          if ( (selectorText.charCodeAt(0 )) == 64 ) {
            const skipTo = this.matchingBrace(src, braceAt);
            if ( skipTo < 0 ) {
              this.errors.push("Unclosed at-rule: " + selectorText);
              return;
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
        const body = src.substring((braceAt + 1), closeAt );
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
    if ( (body.length) == 0 ) {
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
    while (i < (parts.length)) {
      const feat = (parts[i]).trim();
      if ( (feat.length) > 0 ) {
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
        const tail = (body.substring(i, __len )).trim();
        if ( (tail.length) > 0 ) {
          if ( tail != "and" ) {
            out.push(tail);
          }
        }
        return out;
      }
      const close = this.findChar(body, (open + 1), 41);
      if ( close < 0 ) {
        out.push(body.substring((open + 1), __len ));
        return out;
      }
      out.push(body.substring((open + 1), close ));
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
    const name = (feat.substring(0, colon )).trim();
    const value = (feat.substring((colon + 1), (feat.length) )).trim();
    if ( name == "orientation" ) {
      if ( (value == "portrait") || (value == "landscape") ) {
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
      if ( (v.substring((__len - 2), __len )) == "px" ) {
        digits = (v.substring(0, (__len - 2) )).trim();
      }
    }
    if ( (digits.length) == 0 ) {
      return __none;
    }
    let i = 0;
    let dots = 0;
    while (i < (digits.length)) {
      const c = digits.charCodeAt(i );
      if ( c == 46 ) {
        dots = dots + 1;
      } else {
        if ( (c < 48) || (c > 57) ) {
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
    if ( (b.orientation.length) > 0 ) {
      if ( (a.orientation.length) > 0 ) {
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
    while (i < __len) {
      const c = css.charCodeAt(i );
      let isStart = false;
      if ( c == 47 ) {
        if ( (i + 1) < __len ) {
          if ( (css.charCodeAt((i + 1) )) == 42 ) {
            isStart = true;
          }
        }
      }
      if ( isStart ) {
        let j = i + 2;
        let closed = false;
        while ((j < __len) && (closed == false)) {
          if ( (css.charCodeAt(j )) == 42 ) {
            if ( (j + 1) < __len ) {
              if ( (css.charCodeAt((j + 1) )) == 47 ) {
                closed = true;
              }
            }
          }
          if ( closed == false ) {
            j = j + 1;
          }
        };
        out = out + " ";
        i = j + 2;
      } else {
        out = out + (css.substring(i, (i + 1) ));
        i = i + 1;
      }
    };
    return out;
  };
  findChar (s, from, ch) {
    const __len = s.length;
    let i = from;
    while (i < __len) {
      if ( (s.charCodeAt(i )) == ch ) {
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
    while (i < (selectors.length)) {
      const sel = (selectors[i]).trim();
      if ( (sel.length) > 0 ) {
        this.pendingMedia = cond;
        this.addRuleForSelector(sel, decls);
      }
      i = i + 1;
    };
    this.pendingMedia = new EVGMediaQuery();
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
      if ( (pseudoName.length) > 0 ) {
        code = EVGPseudo.parse(pseudoName);
        if ( code < 0 ) {
          this.errors.push("Unsupported pseudo-class (hover, focus, active, disabled): " + sel);
          return;
        }
      }
      const rule = new EVGStyleRule();
      rule.className = only.substring(1, (only.length) );
      rule.pseudo = code;
      this.pushRule(rule, decls);
      return;
    }
    if ( n == 2 ) {
      const scope = parts[0];
      const target = parts[1];
      const targetBits = this.splitPseudo(target);
      const targetOnly = targetBits[0];
      if ( (this.isClassToken(scope) == false) || (this.isClassToken(targetOnly) == false) ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const scopeName = scope.substring(1, (scope.length) );
      if ( (this).startsWith(scopeName, "theme-") == false ) {
        this.errors.push("Descendant selectors are only supported as `.theme-<name> .class`: " + sel);
        return;
      }
      const bits2 = this.splitPseudo(target);
      const targetClass = bits2[0];
      const pseudo2 = bits2[1];
      let code2 = 0;
      if ( (pseudo2.length) > 0 ) {
        code2 = EVGPseudo.parse(pseudo2);
        if ( code2 < 0 ) {
          this.errors.push("Unsupported pseudo-class (hover, focus, active, disabled): " + sel);
          return;
        }
      }
      const rule2 = new EVGStyleRule();
      rule2.theme = scopeName.substring(6, (scopeName.length) );
      rule2.className = targetClass.substring(1, (targetClass.length) );
      rule2.pseudo = code2;
      this.pushRule(rule2, decls);
      return;
    }
    this.errors.push("Unsupported selector (too many parts): " + sel);
  };
  pushRule (rule, decls) {
    rule.decls = decls;
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
    out.push(tok.substring((at + 1), (tok.length) ));
    return out;
  };
  isClassToken (tok) {
    if ( (tok.length) < 2 ) {
      return false;
    }
    return (tok.charCodeAt(0 )) == 46;
  };
  startsWith (s, prefix) {
    const pl = prefix.length;
    if ( (s.length) < pl ) {
      return false;
    }
    return (s.substring(0, pl )) == prefix;
  };
  parseDeclarations (body) {
    let out = [];
    const parts = this.splitOn(body, 59);
    let i = 0;
    while (i < (parts.length)) {
      const part = (parts[i]).trim();
      if ( (part.length) > 0 ) {
        const colon = this.findChar(part, 0, 58);
        if ( colon < 0 ) {
          this.errors.push("Declaration without ':' ignored: " + part);
        } else {
          const d = new EVGStyleDecl();
          d.name = (part.substring(0, colon )).trim();
          d.value = this.unquote(((part.substring((colon + 1), (part.length) )).trim()));
          if ( ((d.name.length) > 0) && ((d.value.length) > 0) ) {
            if ( d.name == "transition" ) {
              this.checkTransition(d.value);
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
    while (i < (parts.length)) {
      const words = EVGEasing.splitWordsTop(((parts[i]).trim()));
      let w = 0;
      while (w < (words.length)) {
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
    const last = s.charCodeAt((__len - 1) );
    if ( ((first == 34) && (last == 34)) || ((first == 39) && (last == 39)) ) {
      let inner = 1;
      while (inner < (__len - 1)) {
        if ( (s.charCodeAt(inner )) == first ) {
          return s;
        }
        inner = inner + 1;
      };
      return s.substring(1, (__len - 1) );
    }
    return s;
  };
  splitOn (s, sep) {
    let out = [];
    const __len = s.length;
    let start = 0;
    let i = 0;
    while (i < __len) {
      if ( (s.charCodeAt(i )) == sep ) {
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
  applyTreeIn (root, theme, w, h, coarse) {
    this.setViewport(w, h, coarse);
    this.applyTree(root, theme);
  };
  applyTree (root, theme) {
    this.applyTo(root, theme);
    let i = 0;
    const n = root.getChildCount();
    while (i < n) {
      this.applyTree(root.getChild(i), theme);
      i = i + 1;
    };
  };
  applyTo (el, theme) {
    if ( (el.className.length) == 0 ) {
      return;
    }
    const classes = this.splitWhitespace(el.className);
    this.clearStateProps(el, classes, theme);
    this.applyGroup(el, classes, theme, false, false);
    this.applyGroup(el, classes, theme, true, false);
    this.applyGroup(el, classes, theme, false, true);
    this.applyGroup(el, classes, theme, true, true);
  };
  clearStateProps (el, classes, theme) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      if ( rule.pseudo != 0 ) {
        let applies = true;
        if ( rule.isThemeScoped() ) {
          applies = rule.theme == theme;
        }
        if ( applies ) {
          applies = rule.media.matches(this.viewportW, this.viewportH, this.coarsePointer);
        }
        if ( applies ) {
          applies = this.matchesClass(classes, rule.className);
        }
        if ( applies ) {
          let d = 0;
          while (d < (rule.decls.length)) {
            const decl = rule.decls[d];
            const init = EVGStyleSheet.initialValue(decl.name);
            if ( (init.length) > 0 ) {
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
      if ( (isStateful == stateful) && (rule.isThemeScoped() == themeScoped) ) {
        let applies = true;
        if ( themeScoped ) {
          applies = rule.theme == theme;
        }
        if ( applies ) {
          applies = rule.media.matches(this.viewportW, this.viewportH, this.coarsePointer);
        }
        if ( applies ) {
          applies = EVGPseudo.holds(rule.pseudo, el);
        }
        if ( applies ) {
          if ( this.matchesClass(classes, rule.className) ) {
            this.applyDecls(el, rule);
          }
        }
      }
      i = i + 1;
    };
  };
  matchesClass (classes, want) {
    let i = 0;
    while (i < (classes.length)) {
      if ( (classes[i]) == want ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  applyDecls (el, rule) {
    let i = 0;
    while (i < (rule.decls.length)) {
      const d = rule.decls[i];
      if ( el.hasInline(d.name) == false ) {
        el.setAttribute(d.name, d.value);
      }
      i = i + 1;
    };
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
class EVGTimingSpec  {
  constructor() {
    this.found = false;
    this.durationMs = 0.0;
    this.delayMs = 0.0;
    this.easing = new EVGEasing();
    this.ok = true;
  }
}
class EVGTransition  {
  constructor() {
  }
  flightFor (el, property) {
    let i = 0;
    while (i < (el.transitions.length)) {
      const f = el.transitions[i];
      if ( f.property == property ) {
        const hit = f;
        return hit;
      }
      i = i + 1;
    };
    let miss;
    return miss;
  };
  showColor (f) {
    return EVGTransition.mixColor((f.fromColor), (f.toColor), f.eased());
  };
  showNumber (f) {
    return f.fromNumber + ((f.toNumber - f.fromNumber) * f.eased());
  };
  reconcile (el) {
    if ( typeof(el.backgroundColor) != "undefined" ) {
      this.reconcileColor(el, "background-color", el.backgroundColor);
    }
    if ( typeof(el.color) != "undefined" ) {
      this.reconcileColor(el, "color", el.color);
    }
    this.reconcileNumber(el, "opacity", el.opacity);
    this.reconcileNumberAs(el, "transform.rotate", "transform", el.rotate);
    this.reconcileNumberAs(el, "transform.scale", "transform", el.scale);
    this.reconcileNumberAs(el, "transform.tx", "transform", el.translateX);
    this.reconcileNumberAs(el, "transform.ty", "transform", el.translateY);
    this.reconcileOriginAxis(el, "transform-origin.x", el.transformOriginX);
    this.reconcileOriginAxis(el, "transform-origin.y", el.transformOriginY);
    this.writeBack(el);
  };
  reconcileColor (el, property, target) {
    const spec = EVGTransition.specFor(el.transitionSpec, property);
    if ( (spec.found == false) || (spec.durationMs <= 0.0) ) {
      this.drop(el, property);
      return;
    }
    if ( target.isSet == false ) {
      return;
    }
    const existing = this.flightFor(el, property);
    if ( typeof(existing) != "undefined" ) {
      const f = existing;
      if ( EVGTransition.sameColor((f.toColor), target) ) {
        return;
      }
      const here = this.showColor(f);
      if ( EVGTransition.sameColor(here, target) ) {
        f.fromColor = target;
        f.toColor = target;
        f.elapsedMs = f.durationMs;
        return;
      }
      if ( EVGTransition.sameColor((f.reversingStartColor), target) ) {
        (this).reverse(f, spec);
        f.reversingStartColor = f.toColor;
      } else {
        f.reversingStartColor = here;
        f.reversingFactor = 1.0;
        f.durationMs = spec.durationMs;
      }
      f.fromColor = here;
      f.toColor = target;
      f.elapsedMs = 0.0;
      f.delayMs = spec.delayMs;
      f.easing = spec.easing;
      return;
    }
    const created = new EVGFlight();
    created.property = property;
    created.isColor = true;
    created.fromColor = target;
    created.toColor = target;
    created.reversingStartColor = target;
    created.durationMs = spec.durationMs;
    created.delayMs = spec.delayMs;
    created.easing = spec.easing;
    created.elapsedMs = spec.durationMs + spec.delayMs;
    el.transitions.push(created);
  };
  reverse (f, spec) {
    const p = f.eased();
    let nf = Math.abs(((p * f.reversingFactor) + (1.0 - f.reversingFactor)));
    if ( nf < 0.0 ) {
      nf = 0.0;
    }
    if ( nf > 1.0 ) {
      nf = 1.0;
    }
    f.reversingFactor = nf;
    f.durationMs = spec.durationMs * nf;
  };
  reconcileNumber (el, property, target) {
    this.reconcileNumberAs(el, property, property, target);
  };
  reconcileNumberAs (el, key, cssName, target) {
    const property = key;
    const spec = EVGTransition.specFor(el.transitionSpec, cssName);
    if ( (spec.found == false) || (spec.durationMs <= 0.0) ) {
      this.drop(el, property);
      return;
    }
    const existing = this.flightFor(el, property);
    if ( typeof(existing) != "undefined" ) {
      const f = existing;
      if ( EVGTransition.sameNumber(f.toNumber, target) ) {
        return;
      }
      const hereN = this.showNumber(f);
      if ( EVGTransition.sameNumber(hereN, target) ) {
        f.fromNumber = target;
        f.toNumber = target;
        f.elapsedMs = f.durationMs;
        return;
      }
      if ( EVGTransition.sameNumber(f.reversingStartNumber, target) ) {
        (this).reverse(f, spec);
        f.reversingStartNumber = f.toNumber;
      } else {
        f.reversingStartNumber = hereN;
        f.reversingFactor = 1.0;
        f.durationMs = spec.durationMs;
      }
      f.fromNumber = hereN;
      f.toNumber = target;
      f.elapsedMs = 0.0;
      f.delayMs = spec.delayMs;
      f.easing = spec.easing;
      return;
    }
    const created = new EVGFlight();
    created.property = property;
    created.isColor = false;
    created.fromNumber = target;
    created.toNumber = target;
    created.reversingStartNumber = target;
    created.durationMs = spec.durationMs;
    created.delayMs = spec.delayMs;
    created.easing = spec.easing;
    created.elapsedMs = spec.durationMs + spec.delayMs;
    el.transitions.push(created);
  };
  reconcileOriginAxis (el, key, u) {
    let code = 1;
    let target = 50.0;
    if ( u.isSet ) {
      code = u.unitType;
      target = u.value;
    }
    const existing = this.flightFor(el, key);
    if ( typeof(existing) != "undefined" ) {
      const f = existing;
      if ( f.unitCode != code ) {
        this.drop(el, key);
      }
    }
    this.reconcileNumberAs(el, key, "transform-origin", target);
    const now = this.flightFor(el, key);
    if ( typeof(now) != "undefined" ) {
      const f2 = now;
      f2.unitCode = code;
    }
  };
  drop (el, property) {
    let kept = [];
    let i = 0;
    while (i < (el.transitions.length)) {
      const f = el.transitions[i];
      if ( f.property != property ) {
        kept.push(f);
      }
      i = i + 1;
    };
    el.transitions.length = 0;
    let j = 0;
    while (j < (kept.length)) {
      el.transitions.push(kept[j]);
      j = j + 1;
    };
  };
  advance (el, dtMs) {
    let i = 0;
    while (i < (el.transitions.length)) {
      const f = el.transitions[i];
      if ( f.done() == false ) {
        f.elapsedMs = f.elapsedMs + dtMs;
        const endsAt = f.delayMs + f.durationMs;
        if ( f.elapsedMs > endsAt ) {
          f.elapsedMs = endsAt;
        }
      }
      i = i + 1;
    };
    this.writeBack(el);
  };
  writeBack (el) {
    let i = 0;
    while (i < (el.transitions.length)) {
      const f = el.transitions[i];
      if ( f.isColor ) {
        const c = this.showColor(f);
        if ( f.property == "background-color" ) {
          el.backgroundColor = c;
        }
        if ( f.property == "color" ) {
          el.color = c;
        }
      } else {
        if ( f.property == "opacity" ) {
          el.opacity = this.showNumber(f);
        }
        if ( f.property == "transform.rotate" ) {
          el.rotate = this.showNumber(f);
        }
        if ( f.property == "transform.scale" ) {
          el.scale = this.showNumber(f);
        }
        if ( f.property == "transform.tx" ) {
          el.translateX = this.showNumber(f);
        }
        if ( f.property == "transform.ty" ) {
          el.translateY = this.showNumber(f);
        }
        if ( f.property == "transform-origin.x" ) {
          el.transformOriginX = EVGTransition.unitOf(f.unitCode, this.showNumber(f));
        }
        if ( f.property == "transform-origin.y" ) {
          el.transformOriginY = EVGTransition.unitOf(f.unitCode, this.showNumber(f));
        }
      }
      i = i + 1;
    };
  };
  reconcileTree (root) {
    this.reconcile(root);
    let i = 0;
    while (i < (root.children.length)) {
      this.reconcileTree(root.children[i]);
      i = i + 1;
    };
  };
  advanceTree (root, dtMs) {
    this.advance(root, dtMs);
    let i = 0;
    while (i < (root.children.length)) {
      this.advanceTree(root.children[i], dtMs);
      i = i + 1;
    };
  };
  busy (root) {
    let i = 0;
    while (i < (root.transitions.length)) {
      const f = root.transitions[i];
      if ( f.done() == false ) {
        return true;
      }
      i = i + 1;
    };
    let j = 0;
    while (j < (root.children.length)) {
      if ( this.busy((root.children[j])) ) {
        return true;
      }
      j = j + 1;
    };
    return false;
  };
}
EVGTransition.specFor = function(spec, property) {
  const out = new EVGTimingSpec();
  if ( (spec.length) == 0 ) {
    return out;
  }
  const parts = EVGEasing.splitTop(spec, 44);
  let i = 0;
  while (i < (parts.length)) {
    const one = (parts[i]).trim();
    const words = EVGEasing.splitWordsTop(one);
    let name = "";
    let fnText = "";
    let times = [];
    let w = 0;
    while (w < (words.length)) {
      const word = words[w];
      if ( EVGEasing.looksLikeFunction(word) ) {
        fnText = word;
      } else {
        if ( EVGTransition.isTime(word) ) {
          times.push(EVGTransition.parseMs(word));
        } else {
          if ( (name.length) == 0 ) {
            name = word;
          }
        }
      }
      w = w + 1;
    };
    if ( (name == property) || (name == "all") ) {
      out.found = true;
      out.durationMs = 0.0;
      out.delayMs = 0.0;
      if ( (times.length) > 0 ) {
        out.durationMs = times[0];
      }
      if ( (times.length) > 1 ) {
        out.delayMs = times[1];
      }
      out.easing = EVGEasing.parse(fnText);
      out.ok = out.easing.ok;
    }
    i = i + 1;
  };
  return out;
};
EVGTransition.durationFor = function(spec, property) {
  const s = EVGTransition.specFor(spec, property);
  if ( s.found == false ) {
    return 0.0 - 1.0;
  }
  return s.durationMs;
};
EVGTransition.isTime = function(word) {
  const t = word.trim();
  const n = t.length;
  if ( n == 0 ) {
    return false;
  }
  if ( n > 2 ) {
    if ( (t.substring((n - 2), n )) == "ms" ) {
      const a = isNaN( parseFloat((t.substring(0, (n - 2) ))) ) ? undefined : parseFloat((t.substring(0, (n - 2) )));
      if ( typeof(a) != "undefined" ) {
        return true;
      }
      return false;
    }
  }
  if ( n > 1 ) {
    if ( (t.substring((n - 1), n )) == "s" ) {
      const b = isNaN( parseFloat((t.substring(0, (n - 1) ))) ) ? undefined : parseFloat((t.substring(0, (n - 1) )));
      if ( typeof(b) != "undefined" ) {
        return true;
      }
      return false;
    }
  }
  const c = isNaN( parseFloat(t) ) ? undefined : parseFloat(t);
  if ( typeof(c) != "undefined" ) {
    return true;
  }
  return false;
};
EVGTransition.parseMs = function(text) {
  const t = text.trim();
  const n = t.length;
  if ( n == 0 ) {
    return 0.0;
  }
  if ( n > 2 ) {
    if ( (t.substring((n - 2), n )) == "ms" ) {
      const v = isNaN( parseFloat((t.substring(0, (n - 2) ))) ) ? undefined : parseFloat((t.substring(0, (n - 2) )));
      if ( typeof(v) != "undefined" ) {
        return v;
      }
      return 0.0;
    }
  }
  if ( n > 1 ) {
    if ( (t.substring((n - 1), n )) == "s" ) {
      const v2 = isNaN( parseFloat((t.substring(0, (n - 1) ))) ) ? undefined : parseFloat((t.substring(0, (n - 1) )));
      if ( typeof(v2) != "undefined" ) {
        return (v2) * 1000.0;
      }
      return 0.0;
    }
  }
  const v3 = isNaN( parseFloat(t) ) ? undefined : parseFloat(t);
  if ( typeof(v3) != "undefined" ) {
    return v3;
  }
  return 0.0;
};
EVGTransition.sameColor = function(a, b) {
  if ( (Math.floor( a.r)) != (Math.floor( b.r)) ) {
    return false;
  }
  if ( (Math.floor( a.g)) != (Math.floor( b.g)) ) {
    return false;
  }
  if ( (Math.floor( a.b)) != (Math.floor( b.b)) ) {
    return false;
  }
  if ( (Math.floor( (a.a * 255.0))) != (Math.floor( (b.a * 255.0))) ) {
    return false;
  }
  return true;
};
EVGTransition.mixColor = function(from, to, t) {
  const c = new EVGColor();
  c.r = from.r + ((to.r - from.r) * t);
  c.g = from.g + ((to.g - from.g) * t);
  c.b = from.b + ((to.b - from.b) * t);
  c.a = from.a + ((to.a - from.a) * t);
  c.isSet = true;
  return c;
};
EVGTransition.unitOf = function(code, value) {
  const u = new EVGUnit();
  u.unitType = code;
  u.value = value;
  u.pixels = value;
  u.isSet = true;
  return u;
};
EVGTransition.sameNumber = function(a, b) {
  return (Math.abs((a - b))) < 0.001;
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
  overlayRoom (side, ax, ay, aw, ah, w, h, gap) {
    if ( side == "top" ) {
      return (ay - gap) - h;
    }
    if ( side == "bottom" ) {
      return (this.pageHeight - ((ay + ah) + gap)) - h;
    }
    if ( side == "left" ) {
      return (ax - gap) - w;
    }
    if ( side == "right" ) {
      return (this.pageWidth - ((ax + aw) + gap)) - w;
    }
    return 0.0;
  };
  placeOverlay (surface, parent) {
    let w = surface.calculatedWidth;
    let h = surface.calculatedHeight;
    let x = 0.0;
    let y = 0.0;
    if ( surface.overlaySide == "cover" ) {
      x = 0.0;
      y = 0.0;
      surface.calculatedWidth = this.pageWidth;
      surface.calculatedHeight = this.pageHeight;
      surface.calculatedInnerWidth = surface.box.getInnerWidth(this.pageWidth);
      surface.calculatedInnerHeight = surface.box.getInnerHeight(this.pageHeight);
      w = this.pageWidth;
      h = this.pageHeight;
      surface.overlayPlacedSide = "cover";
      let kid = 0;
      while (kid < surface.getChildCount()) {
        const kc = surface.getChild(kid);
        kc.resetLayoutState();
        kid = kid + 1;
      };
      if ( surface.getChildCount() > 0 ) {
        this.layoutChildren(surface);
        this.mirrorChildren(surface);
      }
    } else {
      if ( surface.overlaySide == "center" ) {
        x = (this.pageWidth - w) / 2.0;
        y = (this.pageHeight - h) / 2.0;
        surface.overlayPlacedSide = "center";
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
        const gap = surface.overlayGap;
        let side = surface.overlaySide;
        const other = EVGLayout.oppositeSide(side);
        const here = this.overlayRoom(side, ax, ay, aw, ah, w, h, gap);
        if ( here < 0.0 ) {
          const there = this.overlayRoom(other, ax, ay, aw, ah, w, h, gap);
          if ( there > here ) {
            side = other;
          }
        }
        surface.overlayPlacedSide = side;
        if ( side == "top" ) {
          x = this.overlayCross(ax, aw, w, surface.overlayAlign);
          y = (ay - h) - gap;
        }
        if ( side == "bottom" ) {
          x = this.overlayCross(ax, aw, w, surface.overlayAlign);
          y = (ay + ah) + gap;
        }
        if ( side == "right" ) {
          x = (ax + aw) + gap;
          y = this.overlayCross(ay, ah, h, surface.overlayAlign);
        }
        if ( side == "left" ) {
          x = (ax - w) - gap;
          y = this.overlayCross(ay, ah, h, surface.overlayAlign);
        }
        x = EVGLayout.clampTo(x, 0.0, (this.pageWidth - w));
        y = EVGLayout.clampTo(y, 0.0, (this.pageHeight - h));
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
EVGLayout.oppositeSide = function(side) {
  if ( side == "top" ) {
    return "bottom";
  }
  if ( side == "bottom" ) {
    return "top";
  }
  if ( side == "left" ) {
    return "right";
  }
  if ( side == "right" ) {
    return "left";
  }
  return side;
};
EVGLayout.clampTo = function(v, lo, hi) {
  if ( hi < lo ) {
    return lo;
  }
  if ( v < lo ) {
    return lo;
  }
  if ( v > hi ) {
    return hi;
  }
  return v;
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
    this.rotation = 0.0;     /** note: unused */
    this.largeArc = false;     /** note: unused */
    this.sweep = false;     /** note: unused */
  }
}
class PathRing  {
  constructor() {
    this.pts = [];
    let p = [];
    this.pts = p;
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
    const v = ((this.a * x) + (this.c * y)) + this.e;
    return v;
  };
  applyY (x, y) {
    const v = ((this.b * x) + (this.d * y)) + this.f;
    return v;
  };
  multiply (o) {
    const na = (this.a * o.a) + (this.c * o.b);
    const nb = (this.b * o.a) + (this.d * o.b);
    const nc = (this.a * o.c) + (this.c * o.d);
    const nd = (this.b * o.c) + (this.d * o.d);
    const ne = ((this.a * o.e) + (this.c * o.f)) + this.e;
    const nf = ((this.b * o.e) + (this.d * o.f)) + this.f;
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
    let s = (((this.minX.toString())) + " ") + ((this.minY.toString()));
    s = (((s + " ") + ((this.width.toString()))) + " ") + ((this.height.toString()));
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
      if ( (current.length) > 0 ) {
        parts.push(current);
        current = "";
      }
    } else {
      current = current + (String.fromCharCode(ch));
    }
    i = i + 1;
  };
  if ( (current.length) > 0 ) {
    parts.push(current);
  }
  return parts;
};
VectorViewBox.parseViewBox = function(s) {
  const out = new ViewBoxRect();
  const parts = VectorViewBox.splitTokens(s);
  if ( (parts.length) != 4 ) {
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
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( (tok.indexOf("xMin")) == 0 ) {
      return 0;
    }
    if ( (tok.indexOf("xMid")) == 0 ) {
      return 1;
    }
    if ( (tok.indexOf("xMax")) == 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.alignY = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( (tok.indexOf("YMin")) > 0 ) {
      return 0;
    }
    if ( (tok.indexOf("YMid")) > 0 ) {
      return 1;
    }
    if ( (tok.indexOf("YMax")) > 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.isNone = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
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
  while (i < (parts.length)) {
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
  let tx = 0.0 - (vb.minX * scaleX);
  let ty = 0.0 - (vb.minY * scaleY);
  const slackX = viewW - (vb.width * scaleX);
  const slackY = viewH - (vb.height * scaleY);
  const ax = VectorViewBox.alignX(par);
  const ay = VectorViewBox.alignY(par);
  if ( ax == 1 ) {
    tx = tx + (slackX / 2.0);
  }
  if ( ax == 2 ) {
    tx = tx + slackX;
  }
  if ( ay == 1 ) {
    ty = ty + (slackY / 2.0);
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
  if ( (effective.length) == 0 ) {
    effective = "xMidYMid meet";
  }
  const vb = VectorViewBox.parseViewBox(viewBox);
  return VectorViewBox.resolve(vb, viewW, viewH, effective);
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
class SvgVectorItem  {
  constructor() {
    this.commands = [];
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    let c = [];
    this.commands = c;
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
    this.width = 0.0;
    this.height = 0.0;
    this.warnings = [];
    this.errors = [];
    this.truncated = false;
    let it = [];
    this.items = it;
    let w = [];
    this.warnings = w;
    let e = [];
    this.errors = e;
    this.viewBox = new ViewBoxRect();
    this.width = 0.0;
    this.height = 0.0;
    this.truncated = false;
  }
  itemCount () {
    return this.items.length;
  };
  hasErrors () {
    return (this.errors.length) > 0;
  };
  hasWarnings () {
    return (this.warnings.length) > 0;
  };
  commandCount () {
    let total = 0;
    let k = 0;
    while (k < (this.items.length)) {
      const it = this.items[k];
      total = total + (it.commands.length);
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
      out = (out + "; ") + (lines[k]);
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
    while (k < (this.items.length)) {
      const it = this.items[k];
      let j = 0;
      while (j < (it.commands.length)) {
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
        if ( (c.type == "C") || (c.type == "Q") ) {
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
    if ( (this.width > 0.0) && (this.height > 0.0) ) {
      return ViewBoxRect.create(0.0, 0.0, this.width, this.height);
    }
    const b = this.bounds();
    return VectorViewBox.effectiveViewBox("", b.minX, b.minY, b.width, b.height);
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
    let a = [];
    this.attrs = a;
    this.name = "";
    this.isEnd = false;
    this.selfClose = false;
    this.valid = false;
  }
  has (n) {
    let k = 0;
    while (k < (this.attrs.length)) {
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
    while (k < (this.attrs.length)) {
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
    this.maxNodes = 50000;
    this.maxDepth = 64;
    this.maxCommands = 500000;
    this.maxUseDepth = 8;
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
            if ( (id.length) > 0 ) {
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
          if ( (id2.length) > 0 ) {
            this.spans[id2] = this.src.substring(tagStart, this.pos );
          }
        } else {
          openNames.push(tag.name);
          openIds.push(id2);
          openStarts.push(tagStart);
          if ( (openNames.length) > this.maxDepth ) {
            this.fail(("nesting deeper than " + ((this.maxDepth.toString()))) + " levels");
            return;
          }
        }
      }
    };
  };
  parseChildren (inherited, depth, endName) {
    if ( depth > this.maxDepth ) {
      this.fail(("nesting deeper than " + ((this.maxDepth.toString()))) + " levels");
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
        this.fail(("more than " + ((this.maxNodes.toString()))) + " elements");
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
    if ( ((name == "title") || (name == "desc")) || (name == "metadata") ) {
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
    if ( (name == "g") || (name == "a") ) {
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
    if ( (name == "linearGradient") || (name == "radialGradient") ) {
      this.warn("gradient", "gradient paint is deferred (PLAN_VECTOR_IR.md §6): the three renderers do not agree on gradients yet, so a gradient fill is dropped rather than rendered differently in each output");
      return;
    }
    if ( (name == "clipPath") || (name == "mask") ) {
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
    if ( (href.length) == 0 ) {
      href = tag.attr("xlink:href");
    }
    if ( (href.length) == 0 ) {
      this.warn("use-nohref", "<use> without an href draws nothing");
      return;
    }
    if ( (href.charCodeAt(0 )) != 35 ) {
      this.warn("use-external", "<use> may only reference a fragment in the same document; an external reference was dropped");
      return;
    }
    const id = href.substring(1, (href.length) );
    const target = ( Object.prototype.hasOwnProperty.call(this.spans, id) ? this.spans[id] : undefined );
    let fragment = "";
    if ( (typeof(target) !== "undefined" && target != null )  ) {
      fragment = target;
    } else {
      this.warn("use-missing-" + id, ("<use href=\"#" + id) + "\"> refers to an id that is not in this document");
      return;
    }
    if ( this.useDepth >= this.maxUseDepth ) {
      this.warn("use-depth", ("<use> references nested more than " + ((this.maxUseDepth.toString()))) + " deep, which is either a cycle or deeper than this profile expands");
      return;
    }
    const state = this.applyPresentation(inherited, tag, depth);
    const ux = this.numAttr(tag, "x", 0.0);
    const uy = this.numAttr(tag, "y", 0.0);
    if ( ((ux == 0.0) && (uy == 0.0)) == false ) {
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
    while (k < (tag.attrs.length)) {
      const a = tag.attrs[k];
      this.applyProperty(s, a.name, a.value);
      k = k + 1;
    };
    const styleAttr = tag.attr("style");
    if ( (styleAttr.length) > 0 ) {
      this.applyStyleAttribute(s, styleAttr);
    }
    const tf = tag.attr("transform");
    if ( (tf.length) > 0 ) {
      const m = this.parseTransform(tf);
      s.ctm = s.ctm.multiply(m);
    }
    return s;
  };
  applyStyleAttribute (s, style) {
    const decls = this.splitOn(style, 59);
    let k = 0;
    while (k < (decls.length)) {
      const decl = decls[k];
      const colon = decl.indexOf(":");
      if ( colon > 0 ) {
        const n = (decl.substring(0, colon )).trim();
        const v = (decl.substring((colon + 1), (decl.length) )).trim();
        this.applyProperty(s, n, v);
      }
      k = k + 1;
    };
  };
  applyProperty (s, name, value) {
    const v = value.trim();
    if ( name == "fill" ) {
      s.fill = this.parsePaint(v, (s.fill));
      return;
    }
    if ( name == "stroke" ) {
      s.stroke = this.parsePaint(v, (s.stroke));
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
    if ( ((name == "stroke-linecap") || (name == "stroke-linejoin")) || (name == "stroke-miterlimit") ) {
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
    if ( (v.indexOf("url(")) == 0 ) {
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
    if ( (s.length) > 0 ) {
      if ( (s.charCodeAt(((s.length) - 1) )) == 37 ) {
        pct = true;
        s = s.substring(0, ((s.length) - 1) );
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
      const fname = (s.substring(i, open )).trim();
      const close = this.findFrom(s, (open + 1), 41);
      if ( close < 0 ) {
        this.warn("transform-unclosed", "a transform is missing its closing parenthesis: " + s);
        return m;
      }
      const args = this.parseNumberList((s.substring((open + 1), close )));
      const na = args.length;
      i = close + 1;
      let part = Matrix2D.identity();
      let known = true;
      if ( fname == "matrix" ) {
        if ( na == 6 ) {
          part = Matrix2D.create((args[0]), (args[1]), (args[2]), (args[3]), (args[4]), (args[5]));
        } else {
          known = false;
        }
      } else {
        if ( fname == "translate" ) {
          if ( na == 1 ) {
            part = Matrix2D.translate((args[0]), 0.0);
          } else {
            if ( na == 2 ) {
              part = Matrix2D.translate((args[0]), (args[1]));
            } else {
              known = false;
            }
          }
        } else {
          if ( fname == "scale" ) {
            if ( na == 1 ) {
              part = Matrix2D.scale((args[0]), (args[0]));
            } else {
              if ( na == 2 ) {
                part = Matrix2D.scale((args[0]), (args[1]));
              } else {
                known = false;
              }
            }
          } else {
            if ( fname == "rotate" ) {
              if ( na == 1 ) {
                part = this.rotation((args[0]));
              } else {
                if ( na == 3 ) {
                  const cx = args[1];
                  const cy = args[2];
                  const r = this.rotation((args[0]));
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
                  part = Matrix2D.create(1.0, 0.0, this.tanDeg((args[0])), 1.0, 0.0, 0.0);
                } else {
                  known = false;
                }
              } else {
                if ( fname == "skewY" ) {
                  if ( na == 1 ) {
                    part = Matrix2D.create(1.0, this.tanDeg((args[0])), 0.0, 1.0, 0.0, 0.0);
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
    return (Math.sin(rad)) / (Math.cos(rad));
  };
  emitShape (tag, s) {
    const name = tag.name;
    let cmds = [];
    if ( name == "path" ) {
      const d = tag.attr("d");
      if ( (d.length) == 0 ) {
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
        cmds = VectorShapes.rect(this.numAttr(tag, "x", 0.0), this.numAttr(tag, "y", 0.0), this.numAttr(tag, "width", 0.0), this.numAttr(tag, "height", 0.0), rx, ry);
      } else {
        if ( name == "circle" ) {
          cmds = VectorShapes.circle(this.numAttr(tag, "cx", 0.0), this.numAttr(tag, "cy", 0.0), this.numAttr(tag, "r", 0.0));
        } else {
          if ( name == "ellipse" ) {
            cmds = VectorShapes.ellipse(this.numAttr(tag, "cx", 0.0), this.numAttr(tag, "cy", 0.0), this.numAttr(tag, "rx", 0.0), this.numAttr(tag, "ry", 0.0));
          } else {
            if ( name == "line" ) {
              cmds = VectorShapes.line(this.numAttr(tag, "x1", 0.0), this.numAttr(tag, "y1", 0.0), this.numAttr(tag, "x2", 0.0), this.numAttr(tag, "y2", 0.0));
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
      this.fail(("more than " + ((this.maxCommands.toString()))) + " path commands");
      return;
    }
    const item = new SvgVectorItem();
    item.commands = this.transformCommands(cmds, (s.ctm));
    item.fillRule = s.fillRule;
    item.dashArray = s.dashArray;
    item.dashOffset = s.dashOffset;
    if ( s.fill.isSet ) {
      item.fillColor = this.withAlpha((s.fill), (s.fillOpacity * s.groupOpacity));
    }
    if ( s.stroke.isSet ) {
      item.strokeColor = this.withAlpha((s.stroke), (s.strokeOpacity * s.groupOpacity));
      item.strokeWidth = s.strokeWidth * this.scaleOf((s.ctm));
    }
    if ( (item.hasFill() == false) && (item.hasStroke() == false) ) {
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
    let det = (m.a * m.d) - (m.b * m.c);
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
    while (k < (cmds.length)) {
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
    if ( (vb.length) > 0 ) {
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
    if ( (par.length) > 0 ) {
      this.warn("par", "preserveAspectRatio on the imported root is ignored; the element that hosts the drawing decides how it is fitted");
    }
  };
  lengthAttr (tag, name) {
    const raw = tag.attr(name).trim();
    if ( (raw.length) == 0 ) {
      return 0.0;
    }
    let s = raw;
    if ( (s.indexOf("px")) > 0 ) {
      s = s.substring(0, (s.indexOf("px")) );
    }
    if ( this.isPlainNumber((s.trim())) == false ) {
      return 0.0;
    }
    const d = isNaN( parseFloat((s.trim())) ) ? undefined : parseFloat((s.trim()));
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
      if ( (c >= 48) && (c <= 57) ) {
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
    if ( (raw.length) == 0 ) {
      return fallback;
    }
    let s = raw;
    if ( (s.indexOf("px")) > 0 ) {
      s = s.substring(0, (s.indexOf("px")) );
    }
    if ( this.isPlainNumber((s.trim())) ) {
      const d = isNaN( parseFloat((s.trim())) ) ? undefined : parseFloat((s.trim()));
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
        if ( this.matchesAt((this.pos + 1), "!--") ) {
          const end = this.findString((this.pos + 4), "-->");
          if ( end < 0 ) {
            this.pos = this.__len;
            return -1;
          }
          this.pos = end + 3;
        } else {
          if ( this.matchesAt((this.pos + 1), "![CDATA[") ) {
            const cend = this.findString((this.pos + 9), "]]>");
            if ( cend < 0 ) {
              this.pos = this.__len;
              return -1;
            }
            this.pos = cend + 3;
          } else {
            if ( this.matchesAt((this.pos + 1), "?") ) {
              const pend = this.findString((this.pos + 2), "?>");
              if ( pend < 0 ) {
                this.pos = this.__len;
                return -1;
              }
              this.pos = pend + 2;
            } else {
              if ( this.matchesAt((this.pos + 1), "!") ) {
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
      if ( (this.src.charCodeAt(i )) == 47 ) {
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
    tag.name = this.localName((this.src.substring(nameStart, i )));
    if ( (tag.name.length) == 0 ) {
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
          if ( (this.src.charCodeAt(i )) == 62 ) {
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
          if ( (this.src.charCodeAt(i )) == 61 ) {
            i = i + 1;
            i = this.skipSpaceFrom(i);
            if ( i < this.__len ) {
              const q = this.src.charCodeAt(i );
              if ( (q == 34) || (q == 39) ) {
                const vstart = i + 1;
                const vend = this.findFrom(this.src, vstart, q);
                if ( vend < 0 ) {
                  this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is missing its closing quote");
                  this.pos = this.__len;
                  return tag;
                }
                value = this.decodeEntities((this.src.substring(vstart, vend )));
                i = vend + 1;
              } else {
                this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is not quoted; XML requires quotes, so it was skipped");
                while (i < this.__len) {
                  const c4 = this.src.charCodeAt(i );
                  if ( (c4 == 62) || this.isSpace(c4) ) {
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
    while ((depth > 0) && (this.aborted == false)) {
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
    if ( (s.indexOf("&")) < 0 ) {
      return s;
    }
    let out = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s.charCodeAt(i );
      if ( c != 38 ) {
        out = out + (String.fromCharCode(c));
        i = i + 1;
      } else {
        const semi = this.findFrom(s, i, 59);
        let handled = false;
        if ( semi > i ) {
          const ent = s.substring(i, (semi + 1) );
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
    return raw.substring((colon + 1), (raw.length) );
  };
  attrName (raw) {
    if ( (raw.indexOf("xlink:")) == 0 ) {
      return raw;
    }
    const colon = raw.indexOf(":");
    if ( colon < 0 ) {
      return raw;
    }
    return raw.substring((colon + 1), (raw.length) );
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
    if ( (c >= 65) && (c <= 90) ) {
      return true;
    }
    if ( (c >= 97) && (c <= 122) ) {
      return true;
    }
    if ( (c >= 48) && (c <= 57) ) {
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
      if ( this.isSpace((this.src.charCodeAt(i ))) ) {
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
      if ( (s.charCodeAt(i )) == ch ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  findString (from, needle) {
    const nl = needle.length;
    let i = from;
    while ((i + nl) <= this.__len) {
      if ( this.matchesAt(i, needle) ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  matchesAt (at, needle) {
    const nl = needle.length;
    if ( (at + nl) > this.__len ) {
      return false;
    }
    return (this.src.substring(at, (at + nl) )) == needle;
  };
  splitOn (s, sep) {
    let out = [];
    const n = s.length;
    let start = 0;
    let i = 0;
    while (i < n) {
      if ( (s.charCodeAt(i )) == sep ) {
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
    while (k < (toks.length)) {
      const d = isNaN( parseFloat((toks[k])) ) ? undefined : parseFloat((toks[k]));
      if ( typeof(d) != "undefined" ) {
        out.push(d);
      } else {
        this.warn("numlist-" + (toks[k]), ("\"" + (toks[k])) + "\" is not a number; the rest of that list was not read");
        return out;
      }
      k = k + 1;
    };
    return out;
  };
}
class EVGDrawCmd  {
  constructor() {
    this.kind = 0;
    this.x = 0.0;
    this.y = 0.0;
    this.w = 0.0;
    this.h = 0.0;
    this.radius = 0.0;
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
    this.maxWidth = 0.0;     /** note: unused */
    this.hasGrad = false;
    this.gradDir = 0;
    this.r2 = 0;
    this.g2 = 0;
    this.b2 = 0;
    this.a2 = 1.0;
    this.hasShadow = false;     /** note: unused */
    this.shadowX = 0.0;     /** note: unused */
    this.shadowY = 0.0;     /** note: unused */
    this.shadowBlur = 0.0;     /** note: unused */
    this.shadowR = 0;     /** note: unused */
    this.shadowG = 0;     /** note: unused */
    this.shadowB = 0;     /** note: unused */
    this.shadowA = 0.35;     /** note: unused */
    this.src = "";
    this.flipH = false;
    this.flipV = false;
    this.pts = [];
    this.ringEnds = [];
    this.evenOdd = false;
    this.rotate = 0.0;
    this.rotOriginX = 0.0;
    this.rotOriginY = 0.0;
    this.hasRotOrigin = false;
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
    this.width = 0.0;     /** note: unused */
    this.height = 0.0;     /** note: unused */
    let s_1 = [];
    this.strings = s_1;
  }
}
class EVGDisplayList  {
  constructor() {
    this.cmds = [];
    this.deferredOverlays = [];
    this.textEngine = new EVGTextEngine();
  }
  setTextEngine (e) {
    this.textEngine = e;
  };
  count () {
    return this.cmds.length;
  };
  at (i) {
    return this.cmds[i];
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
    this.cmds.push(c);
  };
  addFrame (x, y, w, h, thickness, col) {
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
    this.cmds.push(c);
  };
  addImage (src, x, y, w, h, flipH, flipV, rotate) {
    if ( (src.length) == 0 ) {
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
    this.cmds.push(c);
  };
  addText (text, x, y, size, col, family, bold, italic, width, height) {
    if ( (text.length) == 0 ) {
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
    this.cmds.push(c);
  };
  addClip (x, y, w, h) {
    const c = new EVGDrawCmd();
    c.kind = 4;
    c.x = x;
    c.y = y;
    c.w = w;
    c.h = h;
    this.cmds.push(c);
  };
  addPolyline (pts, thickness, col) {
    if ( (pts.length) < 4 ) {
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
    while (i < (pts.length)) {
      c.pts.push(pts[i]);
      i = i + 1;
    };
    c.ringEnds.push(c.pts.length);
    this.setPolyBounds(c);
    this.cmds.push(c);
  };
  addPolyRings (rings, col, evenOddFill) {
    if ( (rings.length) == 0 ) {
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
    while (i < (rings.length)) {
      const ring = rings[i];
      let j = 0;
      while (j < (ring.pts.length)) {
        c.pts.push(ring.pts[j]);
        j = j + 1;
      };
      c.ringEnds.push(c.pts.length);
      i = i + 1;
    };
    if ( (c.pts.length) < 6 ) {
      return;
    }
    this.setPolyBounds(c);
    this.cmds.push(c);
  };
  addPolygon (pts, col) {
    if ( (pts.length) < 6 ) {
      return;
    }
    const c = new EVGDrawCmd();
    c.kind = 6;
    c.r = col.red();
    c.g = col.green();
    c.b = col.blue();
    c.a = col.alpha();
    let i = 0;
    while (i < (pts.length)) {
      c.pts.push(pts[i]);
      i = i + 1;
    };
    c.ringEnds.push(c.pts.length);
    this.setPolyBounds(c);
    this.cmds.push(c);
  };
  setPolyBounds (c) {
    let minX = 0.0;
    let minY = 0.0;
    let maxX = 0.0;
    let maxY = 0.0;
    const n = (((c.pts.length) / 2) | 0);
    let i = 0;
    while (i < n) {
      const x = c.pts[(i * 2)];
      const yat = (i * 2) + 1;
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
    this.cmds.push(c);
  };
  walkSvgDocument (el, x, y, w, h) {
    const sp = new SvgParser();
    if ( el.fillColor.isSet ) {
      sp.setInitialFill(el.fillColor);
    }
    const doc = sp.parse(el.svgSource);
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
      const rings = parser.flattenRings(steps, m.a, m.b, m.c, m.d, (m.e + x), (m.f + y));
      if ( (rings.length) > 0 ) {
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
          this.cmds.push(cf);
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
          this.cmds.push(cs);
        }
      }
      k = k + 1;
    };
  };
  flattenSteps (w, h) {
    let span = w;
    if ( h > span ) {
      span = h;
    }
    let steps = Math.floor( (span / 6.0));
    if ( steps < 4 ) {
      steps = 4;
    }
    if ( steps > 48 ) {
      steps = 48;
    }
    return steps;
  };
  walkPath (el, x, y, w, h) {
    if ( (el.svgSource.length) > 0 ) {
      this.walkSvgDocument(el, x, y, w, h);
      return;
    }
    const pathData = el.svgPath;
    if ( (pathData.length) == 0 ) {
      return;
    }
    const parser = new SVGPathParser();
    parser.parse(pathData);
    const b = parser.getBounds();
    const vb = VectorViewBox.effectiveViewBox(el.viewBox, b.minX, b.minY, b.width, b.height);
    const m = VectorViewBox.resolve(vb, w, h, "xMidYMid meet");
    const steps = this.flattenSteps(w, h);
    const rings = parser.flattenRings(steps, m.a, m.b, m.c, m.d, (m.e + x), (m.f + y));
    if ( (rings.length) == 0 ) {
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
      this.copyRings(cf, rings);
      this.cmds.push(cf);
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
        let scale = m.a;
        if ( scale < 0.0 ) {
          scale = 0.0 - scale;
        }
        if ( scale <= 0.0 ) {
          scale = 1.0;
        }
        cs.thickness = el.strokeWidth * scale;
        cs.r = sc.red();
        cs.g = sc.green();
        cs.b = sc.blue();
        cs.a = sc.alpha();
        this.copyRings(cs, rings);
        this.cmds.push(cs);
      }
    }
  };
  copyRings (c, rings) {
    let i = 0;
    while (i < (rings.length)) {
      const ring = rings[i];
      let k = 0;
      while (k < (ring.pts.length)) {
        c.pts.push(ring.pts[k]);
        k = k + 1;
      };
      c.ringEnds.push(c.pts.length);
      i = i + 1;
    };
  };
  build (root) {
    this.cmds.length = 0;
    this.deferredOverlays.length = 0;
    this.walk(root);
    let i = 0;
    while (i < (this.deferredOverlays.length)) {
      this.walk(this.deferredOverlays[i]);
      i = i + 1;
    };
  };
  fadeFrom (start, factor) {
    if ( factor >= 1.0 ) {
      return;
    }
    let i = start;
    while (i < (this.cmds.length)) {
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
    const turns = deg != 0.0;
    const scales = (Math.abs((sc - 1.0))) > 0.000001;
    const shifts = (tx != 0.0) || (ty != 0.0);
    if ( ((turns == false) && (scales == false)) && (shifts == false) ) {
      return;
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
      if ( (c.pts.length) > 0 ) {
        this.mapPoints(c, ox, oy, sc, cs, sn, tx, ty);
      } else {
        if ( scales ) {
          c.x = ox + ((c.x - ox) * sc);
          c.y = oy + ((c.y - oy) * sc);
          c.w = c.w * sc;
          c.h = c.h * sc;
          c.radius = c.radius * sc;
          c.thickness = c.thickness * sc;
          c.fontSize = c.fontSize * sc;
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
            c.rotOriginX = ox + ((rx * cs) - (ry * sn));
            c.rotOriginY = oy + ((rx * sn) + (ry * cs));
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
  mapPoints (c, ox, oy, sc, cs, sn, tx, ty) {
    let moved = [];
    let i = 0;
    const n = c.pts.length;
    while ((i + 1) < n) {
      const px = (c.pts[i]) - ox;
      const py = (c.pts[(i + 1)]) - oy;
      const sx = px * sc;
      const sy = py * sc;
      moved.push((ox + ((sx * cs) - (sy * sn))) + tx);
      moved.push((oy + ((sx * sn) + (sy * cs))) + ty);
      i = i + 2;
    };
    c.pts.length = 0;
    let j = 0;
    while (j < (moved.length)) {
      c.pts.push(moved[j]);
      j = j + 1;
    };
  };
  walk (el) {
    const emitStart = this.cmds.length;
    this.walkOpaque(el);
    this.fadeFrom(emitStart, el.opacity);
    this.transformFrom(emitStart, el);
  };
  walkOpaque (el) {
    const x = el.calculatedX;
    const y = el.calculatedY;
    const w = el.calculatedWidth;
    const h = el.calculatedHeight;
    const radius = el.box.borderRadiusPx;
    if ( typeof(el.backgroundColor) != "undefined" ) {
      const bg = el.backgroundColor;
      if ( bg.isSet ) {
        const c = new EVGDrawCmd();
        c.kind = 0;
        c.x = x;
        c.y = y;
        c.w = w;
        c.h = h;
        c.radius = radius;
        c.r = bg.red();
        c.g = bg.green();
        c.b = bg.blue();
        c.a = bg.alpha();
        this.cmds.push(c);
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
      c2.thickness = bw;
      c2.r = bc.red();
      c2.g = bc.green();
      c2.b = bc.blue();
      c2.a = bc.alpha();
      this.cmds.push(c2);
    }
    if ( el.tagName == "path" ) {
      this.walkPath(el, x, y, w, h);
    }
    if ( (el.src.length) > 0 ) {
      const c3 = new EVGDrawCmd();
      c3.kind = 2;
      c3.x = x;
      c3.y = y;
      c3.w = w;
      c3.h = h;
      c3.radius = radius;
      c3.src = el.src;
      this.cmds.push(c3);
    }
    if ( (el.textContent.length) > 0 ) {
      const face = el.effectiveFontFamily();
      let fs = el.inheritedFontSize;
      if ( el.fontSize.isSet ) {
        fs = el.fontSize.pixels;
      }
      if ( fs <= 0.0 ) {
        fs = 14.0;
      }
      let lh = el.lineHeight;
      if ( lh <= 0.0 ) {
        lh = 1.2;
      }
      const avail = el.box.getInnerWidth(w);
      const lines = this.textEngine.breakToStrings(el.textContent, face, fs, avail);
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
      while (li < (lines.length)) {
        const c4 = new EVGDrawCmd();
        c4.kind = 3;
        let indent = 0.0;
        if ( (el.textAlign == "center") || (el.textAlign == "right") ) {
          const m = this.textEngine.measureRun((lines[li]), face, fs);
          const slack = avail - m.width;
          if ( slack > 0.0 ) {
            if ( el.textAlign == "center" ) {
              indent = slack / 2.0;
            } else {
              indent = slack;
            }
          }
        }
        c4.x = (x + el.box.paddingLeftPx) + indent;
        c4.y = (y + el.box.paddingTopPx) + ((li) * (fs * lh));
        c4.w = avail;
        c4.h = fs * lh;
        c4.text = lines[li];
        c4.fontFamily = face;
        c4.fontSize = fs;
        c4.r = tr;
        c4.g = tg;
        c4.b = tb;
        c4.a = ta;
        this.cmds.push(c4);
        li = li + 1;
      };
    }
    const clips = el.overflow == "hidden";
    if ( clips ) {
      const cp = new EVGDrawCmd();
      cp.kind = 4;
      cp.x = x;
      cp.y = y;
      cp.w = w;
      cp.h = h;
      this.cmds.push(cp);
    }
    let i = 0;
    while (i < el.getChildCount()) {
      const kid = el.getChild(i);
      if ( kid.isOverlay ) {
        this.deferredOverlays.push(kid);
      } else {
        this.walk(kid);
      }
      i = i + 1;
    };
    if ( clips ) {
      const pp = new EVGDrawCmd();
      pp.kind = 5;
      this.cmds.push(pp);
    }
  };
  toBinary () {
    const out = new EVGSceneBinary();
    const n = this.cmds.length;
    out.count = n;
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
    let recs = new Int32Array((n * stride));
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
      recs[base + 9] = flags;
      recs[base + 10] = c2.gradDir;
      recs[base + 11] = EVGDisplayList.packRgb(c2.r2, c2.g2, c2.b2);
      recs[base + 12] = EVGDisplayList.fixed(c2.a2);
      recs[base + 13] = EVGDisplayList.fixed(c2.fontSize);
      recs[base + 14] = EVGDisplayList.fixed(c2.rotate);
      recs[base + 24] = EVGDisplayList.fixed(c2.rotOriginX);
      recs[base + 25] = EVGDisplayList.fixed(c2.rotOriginY);
      let textIdx = 0 - 1;
      let fontIdx = 0 - 1;
      let weightIdx = 0 - 1;
      if ( (c2.text.length) > 0 ) {
        textIdx = EVGDisplayList.intern(pool, poolIndex, c2.text);
        fontIdx = EVGDisplayList.intern(pool, poolIndex, c2.fontFamily);
        if ( (c2.fontWeight.length) > 0 ) {
          weightIdx = EVGDisplayList.intern(pool, poolIndex, c2.fontWeight);
        }
      }
      recs[base + 15] = textIdx;
      recs[base + 16] = fontIdx;
      recs[base + 17] = weightIdx;
      let srcIdx = 0 - 1;
      if ( (c2.src.length) > 0 ) {
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
          pbuf[pAt + pi] = EVGDisplayList.fixed((c2.pts[pi]));
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
  toJson () {
    let out = "{\"cmds\":[";
    let i = 0;
    while (i < (this.cmds.length)) {
      const c = this.cmds[i];
      if ( i > 0 ) {
        out = out + ",";
      }
      out = (out + "{\"k\":") + ((c.kind.toString()));
      out = (out + ",\"x\":") + EVGDisplayList.num(c.x);
      out = (out + ",\"y\":") + EVGDisplayList.num(c.y);
      out = (out + ",\"w\":") + EVGDisplayList.num(c.w);
      out = (out + ",\"h\":") + EVGDisplayList.num(c.h);
      if ( c.radius > 0.0 ) {
        out = (out + ",\"r\":") + EVGDisplayList.num(c.radius);
      }
      if ( c.thickness > 0.0 ) {
        out = (out + ",\"t\":") + EVGDisplayList.num(c.thickness);
      }
      out = (((out + ",\"c\":[") + ((c.r.toString()))) + ",") + ((c.g.toString()));
      out = ((((out + ",") + ((c.b.toString()))) + ",") + EVGDisplayList.num(c.a)) + "]";
      if ( c.hasGrad ) {
        out = (out + ",\"gd\":") + ((c.gradDir.toString()));
        out = (((out + ",\"c2\":[") + ((c.r2.toString()))) + ",") + ((c.g2.toString()));
        out = ((((out + ",") + ((c.b2.toString()))) + ",") + EVGDisplayList.num(c.a2)) + "]";
      }
      if ( (c.text.length) > 0 ) {
        out = (out + ",\"text\":") + EVGDisplayList.jsonString(c.text);
        out = (out + ",\"font\":") + EVGDisplayList.jsonString(c.fontFamily);
        out = (out + ",\"size\":") + EVGDisplayList.num(c.fontSize);
        if ( (c.fontWeight.length) > 0 ) {
          out = (out + ",\"weight\":") + EVGDisplayList.jsonString(c.fontWeight);
        }
        if ( c.textAlign == "italic" ) {
          out = out + ",\"italic\":true";
        }
      }
      if ( (c.src.length) > 0 ) {
        out = (out + ",\"src\":") + EVGDisplayList.jsonString(c.src);
      }
      if ( c.flipH ) {
        out = out + ",\"fx\":true";
      }
      if ( c.flipV ) {
        out = out + ",\"fy\":true";
      }
      if ( c.rotate != 0.0 ) {
        out = (out + ",\"rot\":") + EVGDisplayList.num(c.rotate);
        if ( c.hasRotOrigin ) {
          out = (out + ",\"rox\":") + EVGDisplayList.num(c.rotOriginX);
          out = (out + ",\"roy\":") + EVGDisplayList.num(c.rotOriginY);
        }
      }
      if ( (c.pts.length) > 0 ) {
        out = out + ",\"pts\":[";
        let pi = 0;
        while (pi < (c.pts.length)) {
          if ( pi > 0 ) {
            out = out + ",";
          }
          out = out + EVGDisplayList.num((c.pts[pi]));
          pi = pi + 1;
        };
        out = out + "],\"ends\":[";
        if ( (c.ringEnds.length) == 0 ) {
          out = out + (((c.pts.length).toString()));
        } else {
          let ei = 0;
          while (ei < (c.ringEnds.length)) {
            if ( ei > 0 ) {
              out = out + ",";
            }
            out = out + (((c.ringEnds[ei]).toString()));
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
    out = out + "]}";
    return out;
  };
  offsetBy (dx, dy) {
    let i = 0;
    while (i < (this.cmds.length)) {
      const c = this.cmds[i];
      if ( c.kind != 5 ) {
        c.x = c.x + dx;
        c.y = c.y + dy;
        let pi = 0;
        while (pi < (c.pts.length)) {
          const even = (pi % 2) == 0;
          if ( even ) {
            c.pts[pi] = (c.pts[pi]) + dx;
          } else {
            c.pts[pi] = (c.pts[pi]) + dy;
          }
          pi = pi + 1;
        };
      }
      i = i + 1;
    };
  };
  appendFrom (src) {
    let i = 0;
    while (i < (src.cmds.length)) {
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
    while (i < (this.cmds.length)) {
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
    let s = "rects=" + ((rects.toString()));
    s = (s + " borders=") + ((borders.toString()));
    s = (s + " images=") + ((images.toString()));
    s = (s + " text=") + ((texts.toString()));
    s = (s + " clips=") + ((clips.toString()));
    return s;
  };
}
EVGDisplayList.stride = function() {
  return 26;
};
EVGDisplayList.fixed = function(v) {
  if ( v < 0.0 ) {
    return 0 - (Math.floor( (((0.0 - v) * 100.0) + 0.5)));
  }
  return Math.floor( ((v * 100.0) + 0.5));
};
EVGDisplayList.packRgb = function(r, g, b) {
  return ((r * 65536) + (g * 256)) + b;
};
EVGDisplayList.intern = function(pool, index, value) {
  if ( ( typeof(index[value] ) != "undefined" && Object.prototype.hasOwnProperty.call(index, value) ) ) {
    return (( Object.prototype.hasOwnProperty.call(index, value) ? index[value] : undefined ));
  }
  const at = pool.length;
  pool.push(value);
  index[value] = at;
  return at;
};
EVGDisplayList.num = function(v) {
  const neg = v < 0.0;
  let av = v;
  if ( neg ) {
    av = 0.0 - v;
  }
  const scaled = Math.floor( ((av * 100.0) + 0.5));
  const whole = ((scaled / 100) | 0);
  const frac = scaled - (whole * 100);
  let fs = (frac.toString());
  if ( frac < 10 ) {
    fs = "0" + fs;
  }
  let out = (((whole.toString())) + ".") + fs;
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
  while (i < (v.length)) {
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
          out = out + (String.fromCharCode(c));
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class StyleCheck  {
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
    const good = got == want;
    if ( good == false ) {
      console.log(((("       got '" + got) + "' want '") + want) + "'");
    }
    this.ok(name, good);
  };
  eqInt (name, got, want) {
    const good = got == want;
    if ( good == false ) {
      console.log((("       got " + ((got.toString()))) + " want ") + ((want.toString())));
    }
    this.ok(name, good);
  };
}
class EVGStyleStateTest  {
  constructor() {
  }
}
EVGStyleStateTest.sheetOf = function(css) {
  const s = new EVGStyleSheet();
  s.parse(css);
  s.setViewport(800.0, 600.0, false);
  return s;
};
EVGStyleStateTest.button = function() {
  const el = EVGElement.createDiv();
  el.id = "btn";
  el.className = "btn";
  return el;
};
EVGStyleStateTest.bgRed = function(el) {
  if ( typeof(el.backgroundColor) != "undefined" ) {
    const c = el.backgroundColor;
    return c.red();
  }
  return 0 - 1;
};
EVGStyleStateTest.testHover = function(c) {
  console.log("--- a rule can ask for the pointer ---");
  const css = ".btn { background-color: rgb(0,0,0) } .btn:hover { background-color: rgb(255,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  c.eqInt("both rules parsed", s.getRuleCount(), 2);
  c.eqInt("and neither was rejected", s.getErrorCount(), 0);
  const el = EVGStyleStateTest.button();
  s.applyTree(el, "");
  c.eqInt("at rest it is the base rule", EVGStyleStateTest.bgRed(el), 0);
  el.isHovered = true;
  s.applyTree(el, "");
  c.eqInt("under the pointer the hover rule wins", EVGStyleStateTest.bgRed(el), 255);
  el.isHovered = false;
  s.applyTree(el, "");
  c.eqInt("and it goes back when the pointer leaves", EVGStyleStateTest.bgRed(el), 0);
};
EVGStyleStateTest.testOrder = function(c) {
  console.log("--- a pseudo rule wins wherever it is written ---");
  const css = ".btn:hover { background-color: rgb(255,0,0) } .btn { background-color: rgb(0,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  el.isHovered = true;
  s.applyTree(el, "");
  c.eqInt("even declared before the base rule", EVGStyleStateTest.bgRed(el), 255);
};
EVGStyleStateTest.testStates = function(c) {
  console.log("--- focus, active and disabled are the same mechanism ---");
  const css = ((".btn { background-color: rgb(0,0,0) }" + " .btn:focus { background-color: rgb(10,0,0) }") + " .btn:active { background-color: rgb(20,0,0) }") + " .btn:disabled { background-color: rgb(30,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  el.isFocused = true;
  s.applyTree(el, "");
  c.eqInt("focus", EVGStyleStateTest.bgRed(el), 10);
  el.isFocused = false;
  el.isPressed = true;
  s.applyTree(el, "");
  c.eqInt("active", EVGStyleStateTest.bgRed(el), 20);
  el.isPressed = false;
  el.a11yDisabled = true;
  s.applyTree(el, "");
  c.eqInt("disabled", EVGStyleStateTest.bgRed(el), 30);
};
EVGStyleStateTest.testUnknownPseudo = function(c) {
  console.log("--- an unsupported pseudo is reported, not ignored ---");
  const s = EVGStyleStateTest.sheetOf(".btn:nth-child(2) { background-color: rgb(1,0,0) }");
  c.eqInt("no rule was made", s.getRuleCount(), 0);
  c.ok("and an error says why", s.getErrorCount() > 0);
};
EVGStyleStateTest.testUnknownTiming = function(c) {
  console.log("--- an unsupported timing function is reported too ---");
  const bad = EVGStyleStateTest.sheetOf(".btn { transition: opacity 200ms spring(1, 2) }");
  c.ok("a made-up easing is an error", bad.getErrorCount() > 0);
  const good = EVGStyleStateTest.sheetOf(".btn { transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) }");
  c.eqInt("a real one is not", good.getErrorCount(), 0);
  c.eqInt("and the rule survives", good.getRuleCount(), 1);
};
EVGStyleStateTest.testStateOnlyPropertyReverts = function(c) {
  console.log("--- a state-only property goes away with the state ---");
  const css = ".btn { background-color: rgb(0,0,0) }" + " .btn:hover { transform: scale(2) translate(4, 0); opacity: 0.5 }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  s.applyTree(el, "");
  c.ok("no scale at rest", (Math.abs((el.scale - 1.0))) < 0.001);
  el.isHovered = true;
  s.applyTree(el, "");
  c.ok("scaled under the pointer", (Math.abs((el.scale - 2.0))) < 0.001);
  c.ok("and moved by the SCALED offset", (Math.abs((el.translateX - 8.0))) < 0.001);
  c.ok("and faded", (Math.abs((el.opacity - 0.5))) < 0.001);
  el.isHovered = false;
  s.applyTree(el, "");
  c.ok("the scale goes back", (Math.abs((el.scale - 1.0))) < 0.001);
  c.ok("so does the offset", (Math.abs(el.translateX)) < 0.001);
  c.ok("and the opacity", (Math.abs((el.opacity - 1.0))) < 0.001);
  c.eqInt("while the base colour is untouched", EVGStyleStateTest.bgRed(el), 0);
};
EVGStyleStateTest.testStateOnlyOriginReverts = function(c) {
  console.log("--- a state-only transform-origin goes back to the centre ---");
  const css = ".btn { background-color: rgb(0,0,0) }" + " .btn:hover { transform-origin: left top }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  el.isHovered = true;
  s.applyTree(el, "");
  c.ok("the corner while hovered", (Math.abs(EVGElement.resolveOrigin(el.transformOriginX, 100.0))) < 0.001);
  el.isHovered = false;
  s.applyTree(el, "");
  c.ok("and the centre again after", (Math.abs((EVGElement.resolveOrigin(el.transformOriginX, 100.0) - 50.0))) < 0.001);
};
EVGStyleStateTest.testTextAlign = function(c) {
  console.log("--- text-align moves the text, not just the attribute ---");
  const lefts = EVGStyleStateTest.labelXs("left");
  const centres = EVGStyleStateTest.labelXs("center");
  const rights = EVGStyleStateTest.labelXs("right");
  c.ok("a label was painted at all", (lefts.length) > 0);
  if ( (lefts.length) > 0 ) {
    const l = lefts[0];
    const m = centres[0];
    const r = rights[0];
    c.ok("centred starts right of left-aligned", m > (l + 1.0));
    c.ok("and right-aligned right of centred", r > (m + 1.0));
    const half = (l + r) / 2.0;
    c.ok("and centred is exactly half the slack", (Math.abs((m - half))) < 1.0);
  }
};
EVGStyleStateTest.labelXs = function(align) {
  const page = new EVGElement();
  page.setAttribute("width", "400");
  page.setAttribute("height", "100");
  const card = new EVGElement();
  card.setAttribute("width", "300");
  card.setAttribute("height", "40");
  card.setAttribute("text-align", align);
  card.textContent = "hi";
  page.addChild(card);
  const lay = new EVGLayout();
  lay.layout(page);
  const dl = new EVGDisplayList();
  dl.setTextEngine(lay.getTextEngine());
  dl.build(page);
  let out = [];
  let i = 0;
  while (i < (dl.cmds.length)) {
    const cmd = dl.cmds[i];
    if ( cmd.kind == 3 ) {
      out.push(cmd.x);
    }
    i = i + 1;
  };
  return out;
};
EVGStyleStateTest.testTransition = function(c) {
  console.log("--- a colour moves instead of jumping ---");
  const css = ".btn { background-color: rgb(0,0,0); transition: background-color 200ms }" + " .btn:hover { background-color: rgb(200,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  const tr = new EVGTransition();
  s.applyTree(el, "");
  tr.reconcile(el);
  c.eqInt("it starts where the base rule put it", EVGStyleStateTest.bgRed(el), 0);
  el.isHovered = true;
  s.applyTree(el, "");
  tr.reconcile(el);
  c.eqInt("the pointer arrives and nothing has moved yet", EVGStyleStateTest.bgRed(el), 0);
  tr.advance(el, 100.0);
  c.eqInt("half way through, half way there", EVGStyleStateTest.bgRed(el), 100);
  tr.advance(el, 100.0);
  c.eqInt("and at the end it has arrived", EVGStyleStateTest.bgRed(el), 200);
  tr.advance(el, 500.0);
  c.eqInt("and stays there", EVGStyleStateTest.bgRed(el), 200);
};
EVGStyleStateTest.testReverseMidFlight = function(c) {
  console.log("--- reversed half way, it goes back from where it IS ---");
  const css = ".btn { background-color: rgb(0,0,0); transition: background-color 200ms }" + " .btn:hover { background-color: rgb(200,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  const tr = new EVGTransition();
  s.applyTree(el, "");
  tr.reconcile(el);
  el.isHovered = true;
  s.applyTree(el, "");
  tr.reconcile(el);
  tr.advance(el, 100.0);
  c.eqInt("half way", EVGStyleStateTest.bgRed(el), 100);
  el.isHovered = false;
  s.applyTree(el, "");
  tr.reconcile(el);
  c.eqInt("the reversal starts from where it had got to", EVGStyleStateTest.bgRed(el), 100);
  tr.advance(el, 100.0);
  c.eqInt("and lands back at the start", EVGStyleStateTest.bgRed(el), 0);
};
EVGStyleStateTest.testNoTransitionDeclared = function(c) {
  console.log("--- without a transition it is instant, as CSS says ---");
  const css = ".btn { background-color: rgb(0,0,0) } .btn:hover { background-color: rgb(200,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  const tr = new EVGTransition();
  s.applyTree(el, "");
  tr.reconcile(el);
  el.isHovered = true;
  s.applyTree(el, "");
  tr.reconcile(el);
  c.eqInt("there on the first frame", EVGStyleStateTest.bgRed(el), 200);
};
EVGStyleStateTest.testOpacity = function(c) {
  console.log("--- opacity moves too, and it is not a colour ---");
  const css = ".btn { opacity: 1; transition: opacity 100ms } .btn:hover { opacity: 0 }";
  const s = EVGStyleStateTest.sheetOf(css);
  const el = EVGStyleStateTest.button();
  const tr = new EVGTransition();
  s.applyTree(el, "");
  tr.reconcile(el);
  el.isHovered = true;
  s.applyTree(el, "");
  tr.reconcile(el);
  c.eqInt("still opaque on the frame the pointer arrives", Math.floor( (el.opacity * 100.0)), 100);
  tr.advance(el, 50.0);
  c.eqInt("half faded", Math.floor( (el.opacity * 100.0)), 50);
  tr.advance(el, 50.0);
  c.eqInt("gone", Math.floor( (el.opacity * 100.0)), 0);
};
EVGStyleStateTest.testSubtree = function(c) {
  console.log("--- the whole tree is advanced, not one element ---");
  const css = ".row { background-color: rgb(0,0,0); transition: background-color 100ms }" + " .row:hover { background-color: rgb(100,0,0) }";
  const s = EVGStyleStateTest.sheetOf(css);
  const page = EVGElement.createDiv();
  const kid = EVGElement.createDiv();
  kid.id = "kid";
  kid.className = "row";
  page.addChild(kid);
  const tr = new EVGTransition();
  s.applyTree(page, "");
  tr.reconcileTree(page);
  kid.isHovered = true;
  s.applyTree(page, "");
  tr.reconcileTree(page);
  tr.advanceTree(page, 50.0);
  c.eqInt("a child half way through", EVGStyleStateTest.bgRed(kid), 50);
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const c = new StyleCheck();
  console.log("=== EVG stylesheet: states and transitions ===");
  EVGStyleStateTest.testHover(c);
  EVGStyleStateTest.testOrder(c);
  EVGStyleStateTest.testStates(c);
  EVGStyleStateTest.testUnknownPseudo(c);
  EVGStyleStateTest.testUnknownTiming(c);
  EVGStyleStateTest.testStateOnlyPropertyReverts(c);
  EVGStyleStateTest.testStateOnlyOriginReverts(c);
  EVGStyleStateTest.testTextAlign(c);
  EVGStyleStateTest.testTransition(c);
  EVGStyleStateTest.testReverseMidFlight(c);
  EVGStyleStateTest.testNoTransitionDeclared(c);
  EVGStyleStateTest.testOpacity(c);
  EVGStyleStateTest.testSubtree(c);
  console.log("");
  console.log((("passed=" + ((c.passed.toString()))) + " failed=") + ((c.failed.toString())));
  if ( c.failed > 0 ) {
    console.log("FAILURES");
  } else {
    console.log("ALL PASS");
  }
}
__js_main();
