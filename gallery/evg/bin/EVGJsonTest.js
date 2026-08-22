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
    this.src = "";
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
      if ( isWordEnd ) {
        let word = "";
        if ( i > wordStart ) {
          word = text.substring(wordStart, i );
        }
        const wordWidth = this.measureTextWidth(word, fontFamily, fontSize);
        let spaceWidth = 0.0;
        if ( (currentLine.length) > 0 ) {
          spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize);
        }
        if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
          if ( (currentLine.length) > 0 ) {
            currentLine = currentLine + " ";
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
  const fracPart = scaled - (whole * 10000);
  let out = (whole.toString());
  if ( fracPart > 0 ) {
    let frac = (fracPart.toString());
    while ((frac.length) < 4) {
      frac = "0" + frac;
    };
    while ((frac.length) > 1) {
      const lastCh = frac.charCodeAt(((frac.length) - 1) );
      if ( lastCh == 48 ) {
        frac = frac.substring(0, ((frac.length) - 1) );
      } else {
        break;
      }
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
class EVGDisplayList  {
  constructor() {
    this.cmds = [];
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
    this.walk(root);
  };
  walk (el) {
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
        c4.x = x + el.box.paddingLeftPx;
        c4.y = (y + el.box.paddingTopPx) + ((li) * (fs * lh));
        c4.w = avail;
        c4.h = fs * lh;
        c4.text = lines[li];
        c4.fontFamily = face;
        c4.fontSize = fs;
        c4.rotate = el.rotate;
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
      this.walk(kid);
      i = i + 1;
    };
    if ( clips ) {
      const pp = new EVGDrawCmd();
      pp.kind = 5;
      this.cmds.push(pp);
    }
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
class EVGJsonTest  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  ok (what, cond) {
    if ( cond ) {
      this.passed = this.passed + 1;
      console.log("  PASS  " + what);
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL  " + what);
    }
  };
  has (what, json, needle) {
    this.ok(what, (json.indexOf(needle)) >= 0);
  };
  run () {
    console.log("=== EVGDisplayList.toJson ===");
    this.testPolygonWithRings();
    this.testPolygonBuiltByHand();
    this.testGradient();
    this.testFlatRectHasNoGradient();
    this.testRectAndBorder();
    this.testTextAndImage();
    console.log("");
    console.log((("passed = " + ((this.passed.toString()))) + "  failed = ") + ((this.failed.toString())));
    if ( this.failed > 0 ) {
      console.log("FAILURES");
    } else {
      console.log("ALL PASS");
    }
  };
  testPolygonWithRings () {
    console.log("-- a polygon added through addPolygon");
    const dl = new EVGDisplayList();
    const pts = [10.0, 20.0, 110.0, 20.0, 110.0, 70.0, 10.0, 70.0];
    dl.addPolygon(pts, EVGColor.rgb(255, 0, 0));
    const json = dl.toJson();
    (this).has("the points are written", json, "\"pts\":[10.00,20.00,110.00,20.00,110.00,70.00,10.00,70.00]");
    (this).has("with a ring that closes them", json, "\"ends\":[8]");
    const c = (dl).at(0);
    this.ok("and a box derived from the points", (c.w > 99.0) && (c.h > 49.0));
  };
  testPolygonBuiltByHand () {
    console.log("-- a polygon built by hand, with no ring list");
    const dl = new EVGDisplayList();
    const c = new EVGDrawCmd();
    c.kind = 6;
    c.pts = [0.0, 0.0, 40.0, 0.0, 40.0, 40.0];
    c.r = 12;
    c.g = 34;
    c.b = 56;
    c.a = 1.0;
    dl.cmds.push(c);
    const json = dl.toJson();
    (this).has("its points reach the JSON", json, "\"pts\":[0.00,0.00,40.00,0.00,40.00,40.00]");
    (this).has("as one ring covering all of them", json, "\"ends\":[6]");
    (this).has("and it keeps its colour", json, "\"c\":[12,34,56,1.00]");
  };
  testGradient () {
    console.log("-- a two-stop gradient");
    const dl = new EVGDisplayList();
    const c = new EVGDrawCmd();
    c.kind = 0;
    c.x = 0.0;
    c.y = 0.0;
    c.w = 100.0;
    c.h = 50.0;
    c.r = 10;
    c.g = 20;
    c.b = 30;
    c.a = 1.0;
    c.hasGrad = true;
    c.gradDir = 1;
    c.r2 = 200;
    c.g2 = 210;
    c.b2 = 220;
    c.a2 = 0.5;
    dl.cmds.push(c);
    const json = dl.toJson();
    (this).has("the near stop is the command's colour", json, "\"c\":[10,20,30,1.00]");
    (this).has("the far stop is written too", json, "\"c2\":[200,210,220,0.50]");
    (this).has("along with the direction", json, "\"gd\":1");
  };
  testFlatRectHasNoGradient () {
    console.log("-- a flat fill");
    const dl = new EVGDisplayList();
    dl.addRect(0.0, 0.0, 10.0, 10.0, EVGColor.rgb(1, 2, 3));
    const json = dl.toJson();
    this.ok("says nothing about a second stop", (json.indexOf("\"c2\"")) < 0);
    this.ok("and nothing about a direction", (json.indexOf("\"gd\"")) < 0);
  };
  testRectAndBorder () {
    console.log("-- a rounded rect and a border");
    const dl = new EVGDisplayList();
    const c = new EVGDrawCmd();
    c.kind = 0;
    c.x = 5.0;
    c.y = 6.0;
    c.w = 70.0;
    c.h = 80.0;
    c.radius = 9.0;
    c.rotate = 45.0;
    c.r = 1;
    c.g = 2;
    c.b = 3;
    c.a = 1.0;
    dl.cmds.push(c);
    const b = new EVGDrawCmd();
    b.kind = 1;
    b.x = 5.0;
    b.y = 6.0;
    b.w = 70.0;
    b.h = 80.0;
    b.thickness = 2.0;
    b.r = 4;
    b.g = 5;
    b.b = 6;
    b.a = 1.0;
    dl.cmds.push(b);
    const json = dl.toJson();
    (this).has("the corner radius is written", json, "\"r\":9.00");
    (this).has("so is the rotation", json, "\"rot\":45.00");
    (this).has("and the border's thickness", json, "\"t\":2.00");
  };
  testTextAndImage () {
    console.log("-- text and a picture");
    const dl = new EVGDisplayList();
    const t = new EVGDrawCmd();
    t.kind = 3;
    t.x = 1.0;
    t.y = 2.0;
    t.text = "hei";
    t.fontFamily = "Open Sans";
    t.fontSize = 12.0;
    t.fontWeight = "bold";
    t.textAlign = "italic";
    t.r = 0;
    t.g = 0;
    t.b = 0;
    t.a = 1.0;
    dl.cmds.push(t);
    const im = new EVGDrawCmd();
    im.kind = 2;
    im.src = "media/image1.png";
    im.flipH = true;
    im.w = 10.0;
    im.h = 10.0;
    im.a = 1.0;
    dl.cmds.push(im);
    const json = dl.toJson();
    (this).has("the run's text", json, "\"text\":\"hei\"");
    (this).has("its face", json, "\"font\":\"Open Sans\"");
    (this).has("its size", json, "\"size\":12.00");
    (this).has("its weight", json, "\"weight\":\"bold\"");
    (this).has("its slant", json, "\"italic\":true");
    (this).has("the picture's part", json, "\"src\":\"media/image1.png\"");
    (this).has("and that it is mirrored", json, "\"fx\":true");
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const t = new EVGJsonTest();
  t.run();
}
__js_main();
