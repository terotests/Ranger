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
class EVGText  {
  constructor() {
    this.text = "";
    this.measuredWidth = 0.0;
    this.measuredHeight = 0.0;
    this.lineCount = 1;
    this.lines = [];
    const el = new EVGElement();
    el.tagName = "span";
    el.elementType = 1;
    this.element = el;
  }
  getElement () {
    return this.element;
  };
  setText (content) {
    this.text = content;
  };
  setFontSize (size) {
    this.element.fontSize = EVGUnit.px(size);
    this.element.inheritedFontSize = size;
  };
  setFontFamily (family) {
    this.element.fontFamily = family;
  };
  setColor (c) {
    this.element.color = c;
  };
  measureText (measurer, maxWidth) {
    const fs = this.element.inheritedFontSize;
    const ff = this.element.fontFamily;
    if ( maxWidth > 0.0 ) {
      this.lines = measurer.wrapText(this.text, ff, fs, maxWidth);
      this.lineCount = this.lines.length;
      const lineHeight = measurer.getLineHeight(ff, fs);
      this.measuredHeight = (this.lineCount) * lineHeight;
      this.measuredWidth = 0.0;
      let i = 0;
      while (i < this.lineCount) {
        const line = this.lines[i];
        const lineWidth = measurer.measureTextWidth(line, ff, fs);
        if ( lineWidth > this.measuredWidth ) {
          this.measuredWidth = lineWidth;
        }
        i = i + 1;
      };
    } else {
      const metrics = measurer.measureText(this.text, ff, fs);
      this.measuredWidth = metrics.width;
      this.measuredHeight = metrics.height;
      this.lineCount = 1;
      this.lines.length = 0;
      this.lines.push(this.text);
    }
    this.element.calculatedWidth = this.measuredWidth;
    this.element.calculatedHeight = this.measuredHeight;
  };
  getLine (index) {
    if ( index < (this.lines.length) ) {
      return this.lines[index];
    }
    return "";
  };
  toString () {
    return ((((((("EVGText[\"" + this.text) + "\" ") + ((this.measuredWidth.toString()))) + "x") + ((this.measuredHeight.toString()))) + " lines:") + ((this.lineCount.toString()))) + "]";
  };
}
EVGText.create = function(content) {
  const t = new EVGText();
  t.text = content;
  return t;
};
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
class EVGStyleRule  {
  constructor() {
    this.theme = "";
    this.className = "";
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
      const only = parts[0];
      if ( this.isClassToken(only) == false ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const rule = new EVGStyleRule();
      rule.className = only.substring(1, (only.length) );
      this.pushRule(rule, decls);
      return;
    }
    if ( n == 2 ) {
      const scope = parts[0];
      const target = parts[1];
      if ( (this.isClassToken(scope) == false) || (this.isClassToken(target) == false) ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const scopeName = scope.substring(1, (scope.length) );
      if ( (this).startsWith(scopeName, "theme-") == false ) {
        this.errors.push("Descendant selectors are only supported as `.theme-<name> .class`: " + sel);
        return;
      }
      const rule2 = new EVGStyleRule();
      rule2.theme = scopeName.substring(6, (scopeName.length) );
      rule2.className = target.substring(1, (target.length) );
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
    this.applyGroup(el, classes, theme, false);
    this.applyGroup(el, classes, theme, true);
  };
  applyGroup (el, classes, theme, themeScoped) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      if ( rule.isThemeScoped() == themeScoped ) {
        let applies = true;
        if ( themeScoped ) {
          applies = rule.theme == theme;
        }
        if ( applies ) {
          applies = rule.media.matches(this.viewportW, this.viewportH, this.coarsePointer);
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
class EVGCodepoint  {
  constructor() {
  }
}
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
  if ( (cp >= 768) && (cp <= 879) ) {
    return true;
  }
  if ( (cp >= 6832) && (cp <= 6911) ) {
    return true;
  }
  if ( (cp >= 7616) && (cp <= 7679) ) {
    return true;
  }
  if ( (cp >= 8400) && (cp <= 8447) ) {
    return true;
  }
  if ( (cp >= 65024) && (cp <= 65039) ) {
    return true;
  }
  if ( (cp >= 65056) && (cp <= 65071) ) {
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
  if ( EVGGrapheme.isRegionalIndicator((cps[start])) ) {
    if ( i < n ) {
      if ( EVGGrapheme.isRegionalIndicator((cps[i])) ) {
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
          if ( (i + 1) < n ) {
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
  while (i < (cps.length)) {
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
    out = out + EVGCodepoint.toStr((cps[k]));
    k = k + 1;
  };
  return out;
};
class RgTest  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.suite = "";
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
  no (name, cond) {
    this.ok(name, cond == false);
  };
  eqInt (name, got, want) {
    if ( got == want ) {
      this.passed = this.passed + 1;
      console.log("  PASS " + name);
    } else {
      this.failed = this.failed + 1;
      console.log((((("  FAIL " + name) + " got=") + ((got.toString()))) + " want=") + ((want.toString())));
    }
  };
  eqStr (name, got, want) {
    if ( got == want ) {
      this.passed = this.passed + 1;
      console.log("  PASS " + name);
    } else {
      this.failed = this.failed + 1;
      console.log((((("  FAIL " + name) + " got=") + got) + " want=") + want);
    }
  };
  eqBool (name, got, want) {
    if ( got == want ) {
      this.passed = this.passed + 1;
      console.log("  PASS " + name);
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL " + name);
    }
  };
  near (name, got, want) {
    let d = got - want;
    if ( d < 0.0 ) {
      d = 0.0 - d;
    }
    if ( d < 0.000001 ) {
      this.passed = this.passed + 1;
      console.log("  PASS " + name);
    } else {
      this.failed = this.failed + 1;
      console.log((((("  FAIL " + name) + " got=") + ((got.toString()))) + " want=") + ((want.toString())));
    }
  };
  summary () {
    console.log("== summary ==");
    console.log((("passed=" + ((this.passed.toString()))) + " failed=") + ((this.failed.toString())));
    if ( this.failed == 0 ) {
      console.log("ALL PASS");
    } else {
      console.log("SOME FAILED");
    }
  };
}
RgTest.forSuite = function(name) {
  const t = new RgTest();
  t.suite = name;
  console.log("### " + name);
  return t;
};
class RecordingMeasurer  extends EVGTextMeasurer {
  constructor() {
    super()
    this.families = [];
  }
  isFontAccurate () {
    return true;
  };
  hasFace (fontFamily) {
    return fontFamily != "MissingFace";
  };
  measureText (text, fontFamily, fontSize) {
    this.families.push(fontFamily);
    const m = new EVGTextMetrics();
    m.width = (((text.length)) * fontSize) * 0.5;
    m.height = fontSize * 1.2;
    m.ascent = fontSize * 0.8;
    m.descent = fontSize * 0.2;
    m.lineHeight = fontSize * 1.2;
    return m;
  };
  sawFamily (name) {
    let i = 0;
    while (i < (this.families.length)) {
      if ( (this.families[i]) == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
}
class EVGTest  {
  constructor() {
  }
  testUnits (t) {
    const u1 = EVGUnit.parse("100px");
    t.ok("100px isPixels", u1.isPixels());
    t.near("100px value", u1.value, 100.0);
    const u2 = EVGUnit.parse("50%");
    t.ok("50% isPercent", u2.isPercent());
    t.near("50% value", u2.value, 50.0);
    const u3 = EVGUnit.parse("2em");
    t.ok("2em isEm", u3.isEm());
    t.near("2em value", u3.value, 2.0);
    const u4 = EVGUnit.parse("fill");
    t.ok("fill isFill", u4.isFill());
    const u5 = EVGUnit.parse("200");
    t.ok("bare number defaults to px", u5.isPixels());
    t.near("bare number value", u5.value, 200.0);
    const u6 = EVGUnit.parse("30hp");
    t.ok("30hp isHeightPercent", u6.isHeightPercent());
    t.near("30hp value", u6.value, 30.0);
    const u7 = EVGUnit.parse("50%");
    u7.resolve(400.0, 14.0);
    t.near("50% of 400 = 200px", u7.pixels, 200.0);
    const u8 = EVGUnit.parse("1.5em");
    u8.resolve(400.0, 16.0);
    t.near("1.5em at fontSize 16 = 24px", u8.pixels, 24.0);
    const u9 = EVGUnit.parse("auto");
    t.no("auto is unset", u9.isSet);
    const u10 = EVGUnit.parse("2rem");
    t.ok("2rem isRem", u10.isRem());
    t.no("2rem is not em", u10.isEm());
    t.near("2rem value", u10.value, 2.0);
    u10.rootFontSize = 16.0;
    u10.resolve(400.0, 40.0);
    t.near("2rem ignores the local font size", u10.pixels, 32.0);
    const u11 = EVGUnit.parse("1.5rem");
    u11.rootFontSize = 16.0;
    u11.resolve(400.0, 14.0);
    t.near("1.5rem at root 16 = 24px", u11.pixels, 24.0);
    const u12 = EVGUnit.parse("72pt");
    t.ok("72pt is px after parsing", u12.isPixels());
    t.near("72pt = 96px", u12.value, 96.0);
    const u13 = EVGUnit.parse("1in");
    t.near("1in = 96px", u13.value, 96.0);
    const u14 = EVGUnit.parse("25.4mm");
    t.near("25.4mm = 96px", u14.value, 96.0);
    const u15 = EVGUnit.parse("2.54cm");
    t.near("2.54cm = 96px", u15.value, 96.0);
    const u16 = EVGUnit.parse("6pc");
    t.near("6pc = 96px", u16.value, 96.0);
    const u17 = EVGUnit.parse("12pt");
    u17.resolve(400.0, 14.0);
    t.near("an absolute unit needs no resolving", u17.pixels, 16.0);
    const u18 = EVGUnit.parse("10vw");
    t.no("an unsupported unit does not become px", u18.isSet);
    const u19 = EVGUnit.parse("calc(100% - 20px)");
    t.no("calc() is unset rather than misread", u19.isSet);
  };
  testColors (t) {
    const c1 = EVGColor.parse("#FF5733");
    t.eqInt("#FF5733 red", c1.red(), 255);
    t.eqInt("#FF5733 green", c1.green(), 87);
    t.eqInt("#FF5733 blue", c1.blue(), 51);
    t.eqStr("#FF5733 hex roundtrip", c1.toHexString(), "#FF5733");
    const c2 = EVGColor.parse("#F00");
    t.eqInt("#F00 red", c2.red(), 255);
    t.eqInt("#F00 green", c2.green(), 0);
    t.eqInt("#F00 blue", c2.blue(), 0);
    const c3 = EVGColor.parse("rgb(100, 150, 200)");
    t.eqInt("rgb red", c3.red(), 100);
    t.eqInt("rgb green", c3.green(), 150);
    t.eqInt("rgb blue", c3.blue(), 200);
    const c4 = EVGColor.parse("rgba(255, 0, 0, 0.5)");
    t.eqInt("rgba red", c4.red(), 255);
    t.near("rgba alpha", c4.alpha(), 0.5);
    const c5 = EVGColor.parse("red");
    t.eqInt("named red r", c5.red(), 255);
    t.eqInt("named red g", c5.green(), 0);
    const c6 = EVGColor.parse("blue");
    t.eqInt("named blue b", c6.blue(), 255);
    t.eqInt("named blue r", c6.red(), 0);
    const c7 = EVGColor.hslToRgb(195.0, 100.0, 50.0);
    t.eqInt("hsl(195,100,50) red", c7.red(), 0);
    t.eqInt("hsl(195,100,50) blue", c7.blue(), 255);
    const c8 = EVGColor.parse("#3366FF");
    t.eqInt("#3366FF red", c8.red(), 51);
    t.eqInt("#3366FF green", c8.green(), 102);
    t.eqInt("#3366FF blue", c8.blue(), 255);
    const lighter = c8.lighten(0.3);
    t.eqInt("#3366FF lighten(0.3) red", lighter.red(), 112);
    const darker = c8.darken(0.3);
    t.eqInt("#3366FF darken(0.3) red", darker.red(), 35);
  };
  testBox (t) {
    const box = new EVGBox();
    box.setMargin(EVGUnit.px(10.0));
    box.setPadding(EVGUnit.px(20.0));
    box.borderWidth = EVGUnit.px(2.0);
    box.resolveUnits(400.0, 300.0, 14.0, 14.0);
    t.near("margin resolved to 10px", box.marginTopPx, 10.0);
    t.near("padding resolved to 20px", box.paddingTopPx, 20.0);
    t.near("border resolved to 2px", box.borderWidthPx, 2.0);
    t.near("inner width of 200", box.getInnerWidth(200.0), 156.0);
    t.near("inner height of 150", box.getInnerHeight(150.0), 106.0);
    t.near("total width from content 100", box.getTotalWidth(100.0), 164.0);
    t.near("horizontal space", box.getHorizontalSpace(), 64.0);
  };
  testTextMeasurer (t) {
    const measurer = new SimpleTextMeasurer();
    const metrics = measurer.measureText("Hello, World!", "Helvetica", 14.0);
    t.near("'Hello, World!' width at 14px", metrics.width, 91.0);
    t.near("'Hello, World!' height at 14px", metrics.height, 16.8);
    const metrics2 = measurer.measureText("Hello", "Arial", 24.0);
    t.near("'Hello' width at 24px", metrics2.width, 54.0);
    t.near("'Hello' height at 24px", metrics2.height, 28.8);
    const longText = "This is a long text that should wrap to multiple lines when the width is limited.";
    const lines = measurer.wrapText(longText, "Helvetica", 14.0, 150.0);
    t.eqInt("wrapped line count (maxWidth=150)", lines.length, 4);
    t.eqStr("first wrapped line", lines[0], "This is a long text that");
  };
  testText (t) {
    const measurer = new SimpleTextMeasurer();
    const txt = EVGText.create("Hello");
    txt.setFontSize(24.0);
    txt.measureText(measurer, 0.0);
    t.eqInt("EVGText single line", txt.lineCount, 1);
    t.near("EVGText measured width", txt.measuredWidth, 54.0);
    t.eqStr("EVGText line 0", txt.getLine(0), "Hello");
  };
  testSimpleLayout (t) {
    const root = new EVGElement();
    root.id = "root";
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(300.0);
    root.box.setPadding(EVGUnit.px(20.0));
    const child1 = new EVGElement();
    child1.id = "box1";
    child1.width = EVGUnit.px(100.0);
    child1.height = EVGUnit.px(80.0);
    child1.box.setMargin(EVGUnit.px(10.0));
    root.addChild(child1);
    const child2 = new EVGElement();
    child2.id = "box2";
    child2.width = EVGUnit.px(100.0);
    child2.height = EVGUnit.px(80.0);
    child2.box.setMargin(EVGUnit.px(10.0));
    root.addChild(child2);
    const layout = new EVGLayout();
    layout.layout(root);
    t.near("root width", root.calculatedWidth, 400.0);
    t.near("root height", root.calculatedHeight, 300.0);
    t.near("child1 x (padding+margin)", child1.calculatedX, 30.0);
    t.near("child1 y (padding+margin)", child1.calculatedY, 30.0);
    t.near("child1 width", child1.calculatedWidth, 100.0);
    t.near("child2 stacks below child1", child2.calculatedY, 130.0);
  };
  testNestedLayout (t) {
    const root = new EVGElement();
    root.id = "page";
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(400.0);
    root.box.setPadding(EVGUnit.px(10.0));
    root.direction = "column";
    const header = new EVGElement();
    header.id = "header";
    header.width = EVGUnit.parse("100%");
    header.height = EVGUnit.px(50.0);
    root.addChild(header);
    const content = new EVGElement();
    content.id = "content";
    content.width = EVGUnit.parse("100%");
    content.height = EVGUnit.px(250.0);
    content.direction = "row";
    root.addChild(content);
    const leftCol = new EVGElement();
    leftCol.id = "sidebar";
    leftCol.width = EVGUnit.px(100.0);
    leftCol.height = EVGUnit.parse("100%");
    content.addChild(leftCol);
    const rightCol = new EVGElement();
    rightCol.id = "main";
    rightCol.width = EVGUnit.px(270.0);
    rightCol.height = EVGUnit.parse("100%");
    rightCol.box.setPadding(EVGUnit.px(10.0));
    content.addChild(rightCol);
    const footer = new EVGElement();
    footer.id = "footer";
    footer.width = EVGUnit.parse("100%");
    footer.height = EVGUnit.px(40.0);
    root.addChild(footer);
    const layout = new EVGLayout();
    layout.layout(root);
    t.near("header x inside padding", header.calculatedX, 10.0);
    t.near("header y inside padding", header.calculatedY, 10.0);
    t.near("header width fills 100% minus padding", header.calculatedWidth, 380.0);
    t.near("header height", header.calculatedHeight, 50.0);
    t.near("content y below header", content.calculatedY, 60.0);
    t.near("content height", content.calculatedHeight, 250.0);
    t.near("sidebar width", leftCol.calculatedWidth, 100.0);
  };
  testAlignment (t) {
    const root = new EVGElement();
    root.id = "centered";
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(200.0);
    root.align = "center";
    root.verticalAlign = "center";
    root.box.setPadding(EVGUnit.px(10.0));
    const box = new EVGElement();
    box.id = "box";
    box.width = EVGUnit.px(100.0);
    box.height = EVGUnit.px(50.0);
    root.addChild(box);
    const layout = new EVGLayout();
    layout.layout(root);
    t.near("center-aligned box x", box.calculatedX, 150.0);
    t.near("center-aligned box width", box.calculatedWidth, 100.0);
  };
  testGap (t) {
    const col = new EVGElement();
    col.width = EVGUnit.px(200.0);
    col.height = EVGUnit.px(300.0);
    col.gap = EVGUnit.parse("20px");
    const a = new EVGElement();
    a.width = EVGUnit.px(100.0);
    a.height = EVGUnit.px(40.0);
    col.addChild(a);
    const b = new EVGElement();
    b.width = EVGUnit.px(100.0);
    b.height = EVGUnit.px(40.0);
    col.addChild(b);
    const c = new EVGElement();
    c.width = EVGUnit.px(100.0);
    c.height = EVGUnit.px(40.0);
    col.addChild(c);
    const lay = new EVGLayout();
    lay.layout(col);
    t.near("col gap: child0 y", a.calculatedY, 0.0);
    t.near("col gap: child1 y = 40+20", b.calculatedY, 60.0);
    t.near("col gap: child2 y = 2*(40+20)", c.calculatedY, 120.0);
    const row = new EVGElement();
    row.width = EVGUnit.px(400.0);
    row.height = EVGUnit.px(100.0);
    row.flexDirection = "row";
    row.gap = EVGUnit.parse("20px");
    const d = new EVGElement();
    d.width = EVGUnit.px(100.0);
    d.height = EVGUnit.px(40.0);
    row.addChild(d);
    const e = new EVGElement();
    e.width = EVGUnit.px(100.0);
    e.height = EVGUnit.px(40.0);
    row.addChild(e);
    const f = new EVGElement();
    f.width = EVGUnit.px(100.0);
    f.height = EVGUnit.px(40.0);
    row.addChild(f);
    const lay2 = new EVGLayout();
    lay2.layout(row);
    t.near("row gap: child0 x", d.calculatedX, 0.0);
    t.near("row gap: child1 x = 100+20", e.calculatedX, 120.0);
    t.near("row gap: child2 x = 2*(100+20)", f.calculatedX, 240.0);
  };
  testRowSideBySide (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(200.0);
    root.flexDirection = "row";
    const l = new EVGElement();
    l.width = EVGUnit.px(100.0);
    l.height = EVGUnit.px(50.0);
    root.addChild(l);
    const r = new EVGElement();
    r.width = EVGUnit.px(100.0);
    r.height = EVGUnit.px(50.0);
    root.addChild(r);
    const lay = new EVGLayout();
    lay.layout(root);
    t.ok("row: children are side by side (distinct x)", l.calculatedX != r.calculatedX);
    t.near("row: left x", l.calculatedX, 0.0);
    t.near("row: right x = left width", r.calculatedX, 100.0);
    t.near("row: same y", l.calculatedY, r.calculatedY);
  };
  testFlexGrowRow (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(100.0);
    root.flexDirection = "row";
    const fixed = new EVGElement();
    fixed.width = EVGUnit.px(100.0);
    fixed.height = EVGUnit.px(50.0);
    root.addChild(fixed);
    const g1 = new EVGElement();
    g1.flex = 1.0;
    g1.height = EVGUnit.px(50.0);
    root.addChild(g1);
    const g2 = new EVGElement();
    g2.flex = 1.0;
    g2.height = EVGUnit.px(50.0);
    root.addChild(g2);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("row grow: fixed width", fixed.calculatedWidth, 100.0);
    t.near("row grow: flex1 width = (400-100)/2", g1.calculatedWidth, 150.0);
    t.near("row grow: flex2 width = (400-100)/2", g2.calculatedWidth, 150.0);
  };
  testFlexGrowColumn (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(200.0);
    root.height = EVGUnit.px(300.0);
    const fixed = new EVGElement();
    fixed.width = EVGUnit.px(100.0);
    fixed.height = EVGUnit.px(60.0);
    root.addChild(fixed);
    const g1 = new EVGElement();
    g1.flex = 1.0;
    g1.width = EVGUnit.px(100.0);
    root.addChild(g1);
    const g2 = new EVGElement();
    g2.flex = 1.0;
    g2.width = EVGUnit.px(100.0);
    root.addChild(g2);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("col grow: fixed height", fixed.calculatedHeight, 60.0);
    t.near("col grow: flex1 height = (300-60)/2", g1.calculatedHeight, 120.0);
    t.near("col grow: flex2 height = (300-60)/2", g2.calculatedHeight, 120.0);
  };
  testFlexMinMax (t) {
    const row = new EVGElement();
    row.width = EVGUnit.px(300.0);
    row.height = EVGUnit.px(50.0);
    row.flexDirection = "row";
    const capped = new EVGElement();
    capped.setAttribute("flex", "1");
    capped.setAttribute("max-width", "50px");
    const rest = new EVGElement();
    rest.setAttribute("flex", "1");
    row.addChild(capped);
    row.addChild(rest);
    const lay = new EVGLayout();
    lay.layout(row);
    t.near("capped item stops at its max", capped.calculatedWidth, 50.0);
    t.near("the freed space goes to the other item", rest.calculatedWidth, 250.0);
    t.near("the row is still filled", capped.calculatedWidth + rest.calculatedWidth, 300.0);
    const row2 = new EVGElement();
    row2.width = EVGUnit.px(300.0);
    row2.height = EVGUnit.px(50.0);
    row2.flexDirection = "row";
    const floored = new EVGElement();
    floored.setAttribute("flex", "1");
    floored.setAttribute("min-width", "200px");
    const small = new EVGElement();
    small.setAttribute("flex", "3");
    row2.addChild(floored);
    row2.addChild(small);
    const lay2 = new EVGLayout();
    lay2.layout(row2);
    t.near("floored item is lifted to its min", floored.calculatedWidth, 200.0);
    t.near("the other item gives up the difference", small.calculatedWidth, 100.0);
    const row3 = new EVGElement();
    row3.width = EVGUnit.px(400.0);
    row3.height = EVGUnit.px(50.0);
    row3.flexDirection = "row";
    const c1 = new EVGElement();
    c1.setAttribute("flex", "1");
    c1.setAttribute("max-width", "40px");
    const c2 = new EVGElement();
    c2.setAttribute("flex", "1");
    c2.setAttribute("max-width", "60px");
    const free = new EVGElement();
    free.setAttribute("flex", "1");
    row3.addChild(c1);
    row3.addChild(c2);
    row3.addChild(free);
    const lay3 = new EVGLayout();
    lay3.layout(row3);
    t.near("first cap holds", c1.calculatedWidth, 40.0);
    t.near("second cap holds", c2.calculatedWidth, 60.0);
    t.near("the free item absorbs both remainders", free.calculatedWidth, 300.0);
    const row4 = new EVGElement();
    row4.width = EVGUnit.px(300.0);
    row4.height = EVGUnit.px(50.0);
    row4.flexDirection = "row";
    const p1 = new EVGElement();
    p1.setAttribute("flex", "1");
    const p2 = new EVGElement();
    p2.setAttribute("flex", "1");
    row4.addChild(p1);
    row4.addChild(p2);
    const lay4 = new EVGLayout();
    lay4.layout(row4);
    t.near("unconstrained items split evenly", p1.calculatedWidth, 150.0);
    t.near("and the second matches", p2.calculatedWidth, 150.0);
  };
  testFlexShrinkFactors (t) {
    const row = new EVGElement();
    row.width = EVGUnit.px(300.0);
    row.height = EVGUnit.px(50.0);
    row.flexDirection = "row";
    row.flexWrap = "nowrap";
    const a = new EVGElement();
    a.width = EVGUnit.px(200.0);
    const b = new EVGElement();
    b.width = EVGUnit.px(200.0);
    const c = new EVGElement();
    c.width = EVGUnit.px(200.0);
    row.addChild(a);
    row.addChild(b);
    row.addChild(c);
    const lay = new EVGLayout();
    lay.layout(row);
    t.near("default shrink is still uniform", a.calculatedWidth, 100.0);
    t.near("all three equal", c.calculatedWidth, 100.0);
    const row2 = new EVGElement();
    row2.width = EVGUnit.px(300.0);
    row2.height = EVGUnit.px(50.0);
    row2.flexDirection = "row";
    row2.flexWrap = "nowrap";
    const fixed = new EVGElement();
    fixed.width = EVGUnit.px(200.0);
    fixed.setAttribute("flex-shrink", "0");
    const give1 = new EVGElement();
    give1.width = EVGUnit.px(200.0);
    const give2 = new EVGElement();
    give2.width = EVGUnit.px(200.0);
    row2.addChild(fixed);
    row2.addChild(give1);
    row2.addChild(give2);
    const lay2 = new EVGLayout();
    lay2.layout(row2);
    t.near("flex-shrink: 0 keeps its width", fixed.calculatedWidth, 200.0);
    t.near("siblings absorb the overflow", give1.calculatedWidth, 50.0);
    t.near("evenly between them", give2.calculatedWidth, 50.0);
    const row3 = new EVGElement();
    row3.width = EVGUnit.px(300.0);
    row3.height = EVGUnit.px(50.0);
    row3.flexDirection = "row";
    row3.flexWrap = "nowrap";
    const eager = new EVGElement();
    eager.width = EVGUnit.px(200.0);
    eager.setAttribute("flex-shrink", "3");
    const calm = new EVGElement();
    calm.width = EVGUnit.px(200.0);
    calm.setAttribute("flex-shrink", "1");
    row3.addChild(eager);
    row3.addChild(calm);
    const lay3 = new EVGLayout();
    lay3.layout(row3);
    t.near("eager item gives up three quarters", eager.calculatedWidth, 125.0);
    t.near("calm item gives up one quarter", calm.calculatedWidth, 175.0);
    t.near("together they fit the row", eager.calculatedWidth + calm.calculatedWidth, 300.0);
    const sh = new EVGElement();
    sh.setAttribute("flex", "1 0 50px");
    t.near("shorthand shrink factor", sh.flexShrink, 0.0);
    t.near("shorthand grow", sh.flex, 1.0);
    t.near("shorthand basis", sh.flexBasis.value, 50.0);
    const col = new EVGElement();
    col.width = EVGUnit.px(100.0);
    col.height = EVGUnit.px(200.0);
    const top = new EVGElement();
    top.height = EVGUnit.px(200.0);
    top.setAttribute("flex-shrink", "0");
    const bottom = new EVGElement();
    bottom.height = EVGUnit.px(200.0);
    col.addChild(top);
    col.addChild(bottom);
    const lay4 = new EVGLayout();
    lay4.layout(col);
    t.near("column flex-shrink: 0 keeps its height", top.calculatedHeight, 200.0);
    t.near("the other column item absorbs it", bottom.calculatedHeight, 0.0);
  };
  testWrapReverseAndStretch (t) {
    const rev = new EVGElement();
    rev.width = EVGUnit.px(100.0);
    rev.height = EVGUnit.px(200.0);
    rev.flexDirection = "row";
    rev.flexWrap = "wrap-reverse";
    const r1 = new EVGElement();
    r1.width = EVGUnit.px(60.0);
    r1.height = EVGUnit.px(20.0);
    const r2 = new EVGElement();
    r2.width = EVGUnit.px(60.0);
    r2.height = EVGUnit.px(20.0);
    const r3 = new EVGElement();
    r3.width = EVGUnit.px(60.0);
    r3.height = EVGUnit.px(20.0);
    rev.addChild(r1);
    rev.addChild(r2);
    rev.addChild(r3);
    const lay = new EVGLayout();
    lay.layout(rev);
    t.near("first line moves to the far edge", r1.calculatedY, 40.0);
    t.near("middle line stays in the middle", r2.calculatedY, 20.0);
    t.near("last line comes to the near edge", r3.calculatedY, 0.0);
    t.near("wrap-reverse does not change the line width", r1.calculatedWidth, 60.0);
    const fwd = new EVGElement();
    fwd.width = EVGUnit.px(100.0);
    fwd.height = EVGUnit.px(200.0);
    fwd.flexDirection = "row";
    const f1 = new EVGElement();
    f1.width = EVGUnit.px(60.0);
    f1.height = EVGUnit.px(20.0);
    const f2 = new EVGElement();
    f2.width = EVGUnit.px(60.0);
    f2.height = EVGUnit.px(20.0);
    fwd.addChild(f1);
    fwd.addChild(f2);
    const lay2 = new EVGLayout();
    lay2.layout(fwd);
    t.near("plain wrap keeps the first line first", f1.calculatedY, 0.0);
    t.near("and the second below it", f2.calculatedY, 20.0);
    const st = new EVGElement();
    st.width = EVGUnit.px(100.0);
    st.height = EVGUnit.px(200.0);
    st.flexDirection = "row";
    st.alignContent = "stretch";
    const s1 = new EVGElement();
    s1.width = EVGUnit.px(60.0);
    const s2 = new EVGElement();
    s2.width = EVGUnit.px(60.0);
    st.addChild(s1);
    st.addChild(s2);
    const lay3 = new EVGLayout();
    lay3.layout(st);
    t.near("first stretched line starts at the top", s1.calculatedY, 0.0);
    t.near("second stretched line starts halfway", s2.calculatedY, 100.0);
    t.near("an auto-height item grows with its line", s1.calculatedHeight, 100.0);
    const st2 = new EVGElement();
    st2.width = EVGUnit.px(100.0);
    st2.height = EVGUnit.px(200.0);
    st2.flexDirection = "row";
    st2.alignContent = "stretch";
    const fixed = new EVGElement();
    fixed.width = EVGUnit.px(60.0);
    fixed.height = EVGUnit.px(20.0);
    const auto = new EVGElement();
    auto.width = EVGUnit.px(60.0);
    st2.addChild(fixed);
    st2.addChild(auto);
    const lay4 = new EVGLayout();
    lay4.layout(st2);
    t.near("explicit height survives stretch", fixed.calculatedHeight, 20.0);
  };
  testAlignContent (t) {
    const lay = new EVGLayout();
    const flexEnd = this.buildWrapped("flex-end");
    lay.layout(flexEnd);
    const fe0 = flexEnd.getChild(0);
    t.near("flex-end pushes the first line down by all the free space", fe0.calculatedY, 140.0);
    const centered = this.buildWrapped("center");
    const lay2 = new EVGLayout();
    lay2.layout(centered);
    const ce0 = centered.getChild(0);
    t.near("center takes half the free space", ce0.calculatedY, 70.0);
    const between = this.buildWrapped("space-between");
    const lay3 = new EVGLayout();
    lay3.layout(between);
    const sb0 = between.getChild(0);
    const sb1 = between.getChild(1);
    const sb2 = between.getChild(2);
    t.near("space-between leaves the first line put", sb0.calculatedY, 0.0);
    t.near("middle line takes half the gap", sb1.calculatedY, 90.0);
    t.near("last line ends at the bottom", sb2.calculatedY, 180.0);
    const start = this.buildWrapped("flex-start");
    const lay4 = new EVGLayout();
    lay4.layout(start);
    const st0 = start.getChild(0);
    const st1 = start.getChild(1);
    t.near("flex-start line 1", st0.calculatedY, 0.0);
    t.near("flex-start line 2", st1.calculatedY, 20.0);
    const auto = new EVGElement();
    auto.width = EVGUnit.px(100.0);
    auto.flexDirection = "row";
    auto.alignContent = "center";
    const x1 = new EVGElement();
    x1.width = EVGUnit.px(60.0);
    x1.height = EVGUnit.px(20.0);
    const x2 = new EVGElement();
    x2.width = EVGUnit.px(60.0);
    x2.height = EVGUnit.px(20.0);
    const holder = new EVGElement();
    holder.width = EVGUnit.px(300.0);
    holder.height = EVGUnit.px(300.0);
    auto.addChild(x1);
    auto.addChild(x2);
    holder.addChild(auto);
    const lay5 = new EVGLayout();
    lay5.layout(holder);
    t.near("auto-height container does not redistribute", x1.calculatedY, 0.0);
  };
  buildWrapped (mode) {
    const row = new EVGElement();
    row.width = EVGUnit.px(100.0);
    row.height = EVGUnit.px(200.0);
    row.flexDirection = "row";
    row.alignContent = mode;
    let i = 0;
    while (i < 3) {
      const c = new EVGElement();
      c.width = EVGUnit.px(60.0);
      c.height = EVGUnit.px(20.0);
      row.addChild(c);
      i = i + 1;
    };
    return row;
  };
  testFlexBasis (t) {
    const row = new EVGElement();
    row.width = EVGUnit.px(300.0);
    row.height = EVGUnit.px(50.0);
    row.flexDirection = "row";
    const a = new EVGElement();
    a.setAttribute("flex", "1");
    a.setAttribute("width", "100%");
    const b = new EVGElement();
    b.setAttribute("flex", "1");
    b.setAttribute("width", "100%");
    const c = new EVGElement();
    c.setAttribute("flex", "1");
    c.setAttribute("width", "100%");
    row.addChild(a);
    row.addChild(b);
    row.addChild(c);
    const lay = new EVGLayout();
    lay.layout(row);
    t.near("flex:1 with a width still shares the row", a.calculatedWidth, 100.0);
    t.near("second item is one third", b.calculatedWidth, 100.0);
    t.near("items sit side by side", b.calculatedX, 100.0);
    t.near("third item at two thirds", c.calculatedX, 200.0);
    const row2 = new EVGElement();
    row2.width = EVGUnit.px(300.0);
    row2.height = EVGUnit.px(50.0);
    row2.flexDirection = "row";
    const w2 = new EVGElement();
    w2.setAttribute("flex", "2");
    const w1 = new EVGElement();
    w1.setAttribute("flex", "1");
    row2.addChild(w2);
    row2.addChild(w1);
    const lay2 = new EVGLayout();
    lay2.layout(row2);
    t.near("flex:2 takes two thirds", w2.calculatedWidth, 200.0);
    t.near("flex:1 takes one third", w1.calculatedWidth, 100.0);
    const row3 = new EVGElement();
    row3.width = EVGUnit.px(300.0);
    row3.height = EVGUnit.px(50.0);
    row3.flexDirection = "row";
    const fixed = new EVGElement();
    fixed.width = EVGUnit.px(60.0);
    const grow = new EVGElement();
    grow.setAttribute("flex", "1");
    row3.addChild(fixed);
    row3.addChild(grow);
    const lay3 = new EVGLayout();
    lay3.layout(row3);
    t.near("fixed sibling keeps its width", fixed.calculatedWidth, 60.0);
    t.near("flex item takes the remainder", grow.calculatedWidth, 240.0);
    const row4 = new EVGElement();
    row4.width = EVGUnit.px(300.0);
    row4.height = EVGUnit.px(50.0);
    row4.flexDirection = "row";
    const basis = new EVGElement();
    basis.setAttribute("flex-basis", "100px");
    basis.setAttribute("flex", "1 1 100px");
    const other = new EVGElement();
    other.setAttribute("flex", "1 1 0px");
    row4.addChild(basis);
    row4.addChild(other);
    const lay4 = new EVGLayout();
    lay4.layout(row4);
    t.near("basis plus its share", basis.calculatedWidth, 200.0);
    t.near("zero basis gets only its share", other.calculatedWidth, 100.0);
  };
  testFlexShorthand (t) {
    const one = new EVGElement();
    one.setAttribute("flex", "1");
    t.near("flex:1 grow", one.flex, 1.0);
    t.ok("flex:1 sets a basis", one.flexBasis.isSet);
    t.near("flex:1 basis is zero", one.flexBasis.value, 0.0);
    const three = new EVGElement();
    three.setAttribute("flex", "2 1 120px");
    t.near("three-value grow", three.flex, 2.0);
    t.near("three-value basis", three.flexBasis.value, 120.0);
    const two = new EVGElement();
    two.setAttribute("flex", "3 1");
    t.near("two-value grow", two.flex, 3.0);
    t.near("two-value basis stays zero", two.flexBasis.value, 0.0);
    const auto = new EVGElement();
    auto.setAttribute("flex", "auto");
    t.near("flex:auto grows", auto.flex, 1.0);
    const __len = new EVGElement();
    __len.setAttribute("flex", "150px");
    t.near("flex:<length> grows", __len.flex, 1.0);
    t.near("flex:<length> basis", __len.flexBasis.value, 150.0);
    const none = new EVGElement();
    t.near("default flex", none.flex, 0.0);
    t.no("default has no basis", none.flexBasis.isSet);
  };
  testFlexShrink (t) {
    const row = new EVGElement();
    row.width = EVGUnit.px(400.0);
    row.height = EVGUnit.px(100.0);
    row.flexDirection = "row";
    row.flexWrap = "nowrap";
    const a = new EVGElement();
    a.width = EVGUnit.px(200.0);
    a.height = EVGUnit.px(50.0);
    row.addChild(a);
    const b = new EVGElement();
    b.width = EVGUnit.px(200.0);
    b.height = EVGUnit.px(50.0);
    row.addChild(b);
    const c = new EVGElement();
    c.width = EVGUnit.px(200.0);
    c.height = EVGUnit.px(50.0);
    row.addChild(c);
    const lay = new EVGLayout();
    lay.layout(row);
    t.near("row shrink: each = 400/3", a.calculatedWidth, 400.0 / 3.0);
    t.ok("row shrink: last child fits in container", (c.calculatedX + c.calculatedWidth) <= 400.5);
    const col = new EVGElement();
    col.width = EVGUnit.px(100.0);
    col.height = EVGUnit.px(200.0);
    const d = new EVGElement();
    d.width = EVGUnit.px(100.0);
    d.height = EVGUnit.px(200.0);
    col.addChild(d);
    const e = new EVGElement();
    e.width = EVGUnit.px(100.0);
    e.height = EVGUnit.px(200.0);
    col.addChild(e);
    const lay2 = new EVGLayout();
    lay2.layout(col);
    t.near("col shrink: each = 200/2", d.calculatedHeight, 100.0);
  };
  testAutoHeightNoShrink (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(300.0);
    const col = new EVGElement();
    col.width = EVGUnit.px(100.0);
    root.addChild(col);
    const a = new EVGElement();
    a.width = EVGUnit.px(100.0);
    a.height = EVGUnit.px(100.0);
    col.addChild(a);
    const b = new EVGElement();
    b.width = EVGUnit.px(100.0);
    b.height = EVGUnit.px(100.0);
    col.addChild(b);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("auto col: first child keeps its height", a.calculatedHeight, 100.0);
    t.near("auto col: second child keeps its height", b.calculatedHeight, 100.0);
    t.near("auto col: second child stacks below the first", b.calculatedY, 100.0);
    t.near("auto col: container grows to content", col.calculatedHeight, 200.0);
    const root2 = new EVGElement();
    root2.width = EVGUnit.px(400.0);
    root2.height = EVGUnit.px(300.0);
    const col2 = new EVGElement();
    col2.width = EVGUnit.px(100.0);
    col2.gap = EVGUnit.parse("10px");
    root2.addChild(col2);
    const c = new EVGElement();
    c.width = EVGUnit.px(100.0);
    c.height = EVGUnit.px(100.0);
    col2.addChild(c);
    const d2 = new EVGElement();
    d2.width = EVGUnit.px(100.0);
    d2.height = EVGUnit.px(100.0);
    col2.addChild(d2);
    const lay2b = new EVGLayout();
    lay2b.layout(root2);
    t.near("auto col + gap: second child at 100+10", d2.calculatedY, 110.0);
    t.near("auto col + gap: child height untouched", d2.calculatedHeight, 100.0);
  };
  testJustifyDistribution (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(100.0);
    root.flexDirection = "row";
    root.justifyContent = "space-between";
    const a = new EVGElement();
    a.width = EVGUnit.px(80.0);
    a.height = EVGUnit.px(50.0);
    root.addChild(a);
    const b = new EVGElement();
    b.width = EVGUnit.px(80.0);
    b.height = EVGUnit.px(50.0);
    root.addChild(b);
    const c = new EVGElement();
    c.width = EVGUnit.px(80.0);
    c.height = EVGUnit.px(50.0);
    root.addChild(c);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("space-between: first at start", a.calculatedX, 0.0);
    t.near("space-between: middle centered", b.calculatedX, 160.0);
    t.near("space-between: last at end", c.calculatedX, 320.0);
  };
  testAlignStretch (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(100.0);
    root.flexDirection = "row";
    root.alignItems = "stretch";
    const child = new EVGElement();
    child.width = EVGUnit.px(100.0);
    root.addChild(child);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("stretch: child height fills parent inner height", child.calculatedHeight, 100.0);
  };
  testFlexWrap (t) {
    const w = new EVGElement();
    w.width = EVGUnit.px(250.0);
    w.height = EVGUnit.px(200.0);
    w.flexDirection = "row";
    const a = new EVGElement();
    a.width = EVGUnit.px(100.0);
    a.height = EVGUnit.px(50.0);
    w.addChild(a);
    const b = new EVGElement();
    b.width = EVGUnit.px(100.0);
    b.height = EVGUnit.px(50.0);
    w.addChild(b);
    const c = new EVGElement();
    c.width = EVGUnit.px(100.0);
    c.height = EVGUnit.px(50.0);
    w.addChild(c);
    const lay = new EVGLayout();
    lay.layout(w);
    t.ok("wrap (default): third child drops to a new row", c.calculatedY > a.calculatedY);
    const nw = new EVGElement();
    nw.width = EVGUnit.px(350.0);
    nw.height = EVGUnit.px(200.0);
    nw.flexDirection = "row";
    nw.flexWrap = "nowrap";
    const d = new EVGElement();
    d.width = EVGUnit.px(100.0);
    d.height = EVGUnit.px(50.0);
    nw.addChild(d);
    const e = new EVGElement();
    e.width = EVGUnit.px(100.0);
    e.height = EVGUnit.px(50.0);
    nw.addChild(e);
    const f = new EVGElement();
    f.width = EVGUnit.px(100.0);
    f.height = EVGUnit.px(50.0);
    nw.addChild(f);
    const lay2 = new EVGLayout();
    lay2.layout(nw);
    t.near("nowrap: third child stays on the first row", f.calculatedY, d.calculatedY);
    t.near("nowrap: third child at x = 200", f.calculatedX, 200.0);
  };
  testTextIntrinsicWidth (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(100.0);
    root.flexDirection = "row";
    const label = new EVGElement();
    label.textContent = "Hi";
    root.addChild(label);
    const box = new EVGElement();
    box.width = EVGUnit.px(50.0);
    box.height = EVGUnit.px(30.0);
    root.addChild(box);
    const lay = new EVGLayout();
    lay.layout(root);
    t.ok("text label shrink-wraps (not full width)", label.calculatedWidth < 200.0);
    t.near("sibling stays on the same row", box.calculatedY, label.calculatedY);
    t.near("sibling sits right after the label", box.calculatedX, label.calculatedWidth);
  };
  testStyleSheetParse (t) {
    const sheet = new EVGStyleSheet();
    sheet.parse("/* header */ .a, .b { color: #fff; font-size: 12px }\n.theme-x .a { color: #000 }");
    t.eqInt("selector list expands to one rule each", sheet.getRuleCount(), 3);
    t.eqInt("valid sheet reports no errors", sheet.getErrorCount(), 0);
    const commented = new EVGStyleSheet();
    commented.parse(".a { color: red } /* trailing note */");
    t.eqInt("comment-only tail is not a rule", commented.getRuleCount(), 1);
    t.eqInt("comment-only tail is not an error", commented.getErrorCount(), 0);
    const gradient = new EVGStyleSheet();
    gradient.parse(".g { background: linear-gradient(180deg, rgba(0,0,0,0.2), #fff) }");
    const el = new EVGElement();
    el.className = "g";
    gradient.applyTree(el, "");
    t.eqStr("value keeps its commas and parens", el.backgroundGradient, "linear-gradient(180deg, rgba(0,0,0,0.2), #fff)");
    const quoted = new EVGStyleSheet();
    quoted.parse(".q { font-family: \"Cinzel\" }");
    const qel = new EVGElement();
    qel.className = "q";
    quoted.applyTree(qel, "");
    t.eqStr("quoted font-family is unquoted", qel.fontFamily, "Cinzel");
    const bad = new EVGStyleSheet();
    bad.parse("#id { color: red } div .x { color: red } .a .b { color: red }");
    t.eqInt("unsupported selectors produce no rules", bad.getRuleCount(), 0);
    t.eqInt("unsupported selectors are all reported", bad.getErrorCount(), 3);
  };
  testStyleSheetCascade (t) {
    const css = ".box { color: #111111; font-size: 10px; width: 50px } .theme-dark .box { color: #222222; font-size: 20px }";
    const sheet = new EVGStyleSheet();
    sheet.parse(css);
    const dark = new EVGElement();
    dark.className = "box";
    sheet.applyTree(dark, "dark");
    t.eqStr("theme rule overrides unscoped color", dark.color.toHexString(), "#222222");
    t.near("theme rule overrides unscoped font-size", dark.fontSize.pixels, 20.0);
    t.near("unscoped-only property survives", dark.width.pixels, 50.0);
    const sheet2 = new EVGStyleSheet();
    sheet2.parse(css);
    const light = new EVGElement();
    light.className = "box";
    sheet2.applyTree(light, "light");
    t.eqStr("non-matching theme leaves unscoped color", light.color.toHexString(), "#111111");
    t.near("non-matching theme leaves unscoped font-size", light.fontSize.pixels, 10.0);
    const sheet3 = new EVGStyleSheet();
    sheet3.parse(css);
    const inlined = new EVGElement();
    inlined.className = "box";
    inlined.setAttribute("font-size", "33px");
    inlined.markInline("fontSize");
    sheet3.applyTree(inlined, "dark");
    t.near("inline font-size outranks theme rule", inlined.fontSize.pixels, 33.0);
    t.eqStr("non-inline property still themed", inlined.color.toHexString(), "#222222");
    t.ok("markInline normalizes camelCase", inlined.hasInline("font-size"));
    t.eqStr("toKebab converts camelCase", EVGElement.toKebab("marginTop"), "margin-top");
    t.eqStr("toKebab leaves kebab-case alone", EVGElement.toKebab("margin-top"), "margin-top");
    const multi = new EVGStyleSheet();
    multi.parse(".p { width: 10px } .q { height: 20px }");
    const both = new EVGElement();
    both.className = "p q";
    multi.applyTree(both, "");
    t.near("multi-class element gets first class", both.width.pixels, 10.0);
    t.near("multi-class element gets second class", both.height.pixels, 20.0);
    const treeSheet = new EVGStyleSheet();
    treeSheet.parse(".leaf { width: 7px }");
    const root = new EVGElement();
    const mid = new EVGElement();
    const leaf = new EVGElement();
    leaf.className = "leaf";
    mid.addChild(leaf);
    root.addChild(mid);
    treeSheet.applyTree(root, "");
    t.near("applyTree reaches nested children", leaf.width.pixels, 7.0);
    const mq = new EVGStyleSheet();
    mq.parse(".panel { width: 200px } @media (max-width: 640px) { .panel { width: 40px } }");
    t.eqInt("a media block does not change the rule count", mq.getRuleCount(), 2);
    t.eqInt("and parses without complaint", mq.getErrorCount(), 0);
    const wide = new EVGElement();
    wide.className = "panel";
    mq.applyTreeIn(wide, "", 1200.0, 800.0, false);
    t.near("a wide viewport keeps the unconditional width", wide.width.pixels, 200.0);
    const narrow = new EVGElement();
    narrow.className = "panel";
    mq.applyTreeIn(narrow, "", 390.0, 844.0, false);
    t.near("a narrow one takes the media rule", narrow.width.pixels, 40.0);
    const unknown = new EVGElement();
    unknown.className = "panel";
    const mq2 = new EVGStyleSheet();
    mq2.parse(".panel { width: 200px } @media (max-width: 640px) { .panel { width: 40px } }");
    mq2.applyTree(unknown, "");
    t.near("with no viewport, nothing conditional applies", unknown.width.pixels, 200.0);
    const orient = new EVGStyleSheet();
    orient.parse("@media (orientation: portrait) { .b { width: 5px } } @media (orientation: landscape) { .b { width: 9px } }");
    const tall = new EVGElement();
    tall.className = "b";
    orient.applyTreeIn(tall, "", 400.0, 900.0, false);
    t.near("a tall viewport is portrait", tall.width.pixels, 5.0);
    const flat = new EVGElement();
    flat.className = "b";
    orient.applyTreeIn(flat, "", 900.0, 400.0, false);
    t.near("a wide one is landscape", flat.width.pixels, 9.0);
    const touch = new EVGStyleSheet();
    touch.parse(".hit { height: 24px } @media (pointer: coarse) { .hit { height: 44px } }");
    const finger = new EVGElement();
    finger.className = "hit";
    touch.applyTreeIn(finger, "", 390.0, 844.0, true);
    t.near("a coarse pointer gets the bigger target", finger.height.pixels, 44.0);
    const mouse = new EVGElement();
    mouse.className = "hit";
    touch.applyTreeIn(mouse, "", 390.0, 844.0, false);
    t.near("a mouse at the same size does not", mouse.height.pixels, 24.0);
    const both_2 = new EVGStyleSheet();
    both_2.parse("@media (min-width: 600px) and (max-width: 900px) { .c { width: 3px } }");
    const inBand = new EVGElement();
    inBand.className = "c";
    both_2.applyTreeIn(inBand, "", 700.0, 500.0, false);
    t.near("inside the band the rule applies", inBand.width.pixels, 3.0);
    const below = new EVGElement();
    below.className = "c";
    below.width = EVGUnit.px(1.0);
    both_2.applyTreeIn(below, "", 500.0, 500.0, false);
    t.near("below it the rule does not", below.width.pixels, 1.0);
    const multiRule = new EVGStyleSheet();
    multiRule.parse("@media (max-width: 500px) { .d { width: 1px } .e { width: 2px } }");
    t.eqInt("every rule in the block is kept", multiRule.getRuleCount(), 2);
    const dOut = new EVGElement();
    dOut.className = "e";
    dOut.width = EVGUnit.px(8.0);
    multiRule.applyTreeIn(dOut, "", 900.0, 600.0, false);
    t.near("and the last one is still conditional", dOut.width.pixels, 8.0);
    const bad = new EVGStyleSheet();
    bad.parse("@media (max-widht: 500px) { .f { width: 4px } }");
    t.ok("a misspelt feature is reported", bad.getErrorCount() > 0);
    const notStyled = new EVGElement();
    notStyled.className = "f";
    notStyled.width = EVGUnit.px(6.0);
    bad.applyTreeIn(notStyled, "", 300.0, 600.0, false);
    t.near("and its rules never apply", notStyled.width.pixels, 6.0);
    const orQuery = new EVGStyleSheet();
    orQuery.parse("@media (max-width: 400px), (min-width: 900px) { .g { width: 4px } }");
    t.ok("a comma list is refused out loud", orQuery.getErrorCount() > 0);
  };
  testBaselineAlignment (t) {
    const rec = new RecordingMeasurer();
    const lay = new EVGLayout();
    lay.setMeasurer(rec);
    const row = new EVGElement();
    row.width = EVGUnit.px(400.0);
    row.height = EVGUnit.px(100.0);
    row.flexDirection = "row";
    row.alignItems = "baseline";
    const big = new EVGElement();
    big.textContent = "Big";
    big.fontSize = EVGUnit.px(30.0);
    const small = new EVGElement();
    small.textContent = "small";
    small.fontSize = EVGUnit.px(10.0);
    row.addChild(big);
    row.addChild(small);
    lay.layout(row);
    t.ok("text node records a baseline", big.hasBaseline);
    t.near("baseline is leading + ascent", big.calculatedBaseline, 27.0);
    t.near("smaller text has a smaller baseline", small.calculatedBaseline, 9.0);
    const bigBase = big.calculatedY + big.calculatedBaseline;
    const smallBase = small.calculatedY + small.calculatedBaseline;
    t.near("baselines line up", smallBase, bigBase);
    t.ok("smaller item is offset downwards", small.calculatedY > big.calculatedY);
    t.near("offset is the baseline difference", small.calculatedY, 18.0);
    const row2 = new EVGElement();
    row2.width = EVGUnit.px(400.0);
    row2.height = EVGUnit.px(100.0);
    row2.flexDirection = "row";
    const b2 = new EVGElement();
    b2.textContent = "Big";
    b2.fontSize = EVGUnit.px(30.0);
    const s2 = new EVGElement();
    s2.textContent = "small";
    s2.fontSize = EVGUnit.px(10.0);
    row2.addChild(b2);
    row2.addChild(s2);
    const lay2 = new EVGLayout();
    lay2.setMeasurer(rec);
    lay2.layout(row2);
    t.near("flex-start keeps tops aligned", s2.calculatedY, b2.calculatedY);
    const row3 = new EVGElement();
    row3.width = EVGUnit.px(400.0);
    row3.height = EVGUnit.px(100.0);
    row3.flexDirection = "row";
    row3.alignItems = "baseline";
    const wrapper = new EVGElement();
    wrapper.width = EVGUnit.px(100.0);
    const inner = new EVGElement();
    inner.textContent = "Big";
    inner.fontSize = EVGUnit.px(30.0);
    wrapper.addChild(inner);
    const plain = new EVGElement();
    plain.textContent = "small";
    plain.fontSize = EVGUnit.px(10.0);
    row3.addChild(wrapper);
    row3.addChild(plain);
    const lay3 = new EVGLayout();
    lay3.setMeasurer(rec);
    lay3.layout(row3);
    t.ok("container inherits its first child's baseline", wrapper.hasBaseline);
    t.near("wrapped and plain baselines line up", plain.calculatedY + plain.calculatedBaseline, wrapper.calculatedY + wrapper.calculatedBaseline);
    const row4 = new EVGElement();
    row4.width = EVGUnit.px(400.0);
    row4.height = EVGUnit.px(200.0);
    row4.flexDirection = "row";
    row4.alignItems = "baseline";
    const boxEl = new EVGElement();
    boxEl.width = EVGUnit.px(20.0);
    boxEl.height = EVGUnit.px(40.0);
    const caption = new EVGElement();
    caption.textContent = "small";
    caption.fontSize = EVGUnit.px(10.0);
    row4.addChild(boxEl);
    row4.addChild(caption);
    const lay4 = new EVGLayout();
    lay4.setMeasurer(rec);
    lay4.layout(row4);
    t.no("a plain box has no text baseline", boxEl.hasBaseline);
    t.near("box bottom sits on the text baseline", boxEl.calculatedY + boxEl.calculatedHeight, caption.calculatedY + caption.calculatedBaseline);
  };
  testTextEngineWrap (t) {
    const rec = new RecordingMeasurer();
    const eng = new EVGTextEngine();
    eng.setMeasurer(rec);
    const one = eng.breakLines("aaa bbb", "Test", 10.0, 35.0);
    t.eqInt("fits exactly on one line", one.length, 1);
    const two = eng.breakLines("aaa bbb", "Test", 10.0, 30.0);
    t.eqInt("breaks when the candidate line is too wide", two.length, 2);
    const l0 = two[0];
    const l1 = two[1];
    t.eqStr("first line", l0.text, "aaa");
    t.eqStr("second line", l1.text, "bbb");
    t.near("line width comes from the measurer", l0.width, 15.0);
    t.near("line carries ascent for baseline work", l0.ascent, 8.0);
    const nl = eng.breakLines("ab\ncd", "Test", 10.0, 500.0);
    t.eqInt("explicit newline splits lines", nl.length, 2);
    const blank = eng.breakLines("ab\n\ncd", "Test", 10.0, 500.0);
    t.eqInt("blank line is kept", blank.length, 3);
    const nowrap = eng.breakLines("aaa bbb ccc", "Test", 10.0, 0.0);
    t.eqInt("no wrapping without a width", nowrap.length, 1);
    t.eqInt("lineCount agrees with breakLines", eng.lineCount("aaa bbb", "Test", 10.0, 30.0), 2);
    t.near("maxLineWidth takes the widest line", eng.maxLineWidth("ab\nabcd", "Test", 10.0), 20.0);
    const longWord = eng.breakLines("abcdefghij", "Test", 10.0, 5.0);
    t.eqInt("unbreakable word stays on one line", longWord.length, 1);
  };
  testTextEngineFontChecks (t) {
    const guess = new EVGTextEngine();
    guess.measureRun("hello", "Cinzel", 12.0);
    t.ok("heuristic measurer is flagged as inaccurate", guess.warningCount() > 0);
    t.no("not fatal unless strict", guess.hadFatal);
    const strictEng = new EVGTextEngine();
    strictEng.setStrict(true);
    strictEng.measureRun("hello", "Cinzel", 12.0);
    t.ok("strict mode marks the run failed", strictEng.hadFatal);
    const once = new EVGTextEngine();
    once.measureRun("a", "Cinzel", 12.0);
    once.measureRun("b", "Cinzel", 12.0);
    once.measureRun("c", "Cinzel", 12.0);
    t.eqInt("family reported once", once.warningCount(), 1);
    const rec = new RecordingMeasurer();
    const ok = new EVGTextEngine();
    ok.setMeasurer(rec);
    ok.measureRun("hello", "Cinzel", 12.0);
    t.eqInt("loaded face produces no warning", ok.warningCount(), 0);
    const sub = new EVGTextEngine();
    sub.setMeasurer(rec);
    sub.setStrict(true);
    sub.measureRun("hello", "MissingFace", 12.0);
    t.ok("missing face is reported", sub.warningCount() > 0);
    t.ok("missing face is fatal under strict", sub.hadFatal);
  };
  testLayoutUsesElementFont (t) {
    const rec = new RecordingMeasurer();
    const lay = new EVGLayout();
    lay.setMeasurer(rec);
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(200.0);
    const label = new EVGElement();
    label.textContent = "hello world";
    label.fontFamily = "Cinzel";
    label.fontSize = EVGUnit.px(10.0);
    root.addChild(label);
    lay.layout(root);
    t.ok("layout measured with the element's family", rec.sawFamily("Cinzel"));
    t.no("layout no longer hardcodes Helvetica", rec.sawFamily("Helvetica"));
    t.near("text shrink-wraps to measured width", label.calculatedWidth, 55.0);
  };
  testGridAreas (t) {
    const a = EVGGridAreas.parse("\"hero hero\" \"left right\"");
    t.no("a well-formed picture parses", a.hadError);
    t.eqInt("two columns", a.columns, 2);
    t.eqInt("two rows", a.rows, 2);
    t.eqInt("three named areas", (a).count(), 3);
    const hero = a.indexOfName("hero");
    t.ok("hero was found", hero >= 0);
    t.eqInt("hero starts at row 0", a.rowStart[hero], 0);
    t.eqInt("hero spans both columns", a.colSpan[hero], 2);
    t.eqInt("hero is one row tall", a.rowSpan[hero], 1);
    const right = a.indexOfName("right");
    t.eqInt("right is in column 1", a.colStart[right], 1);
    t.eqInt("right is on row 1", a.rowStart[right], 1);
    const side = EVGGridAreas.parse("\"nav main\" \"nav main\"");
    const nav = side.indexOfName("nav");
    t.eqInt("nav spans two rows", side.rowSpan[nav], 2);
    t.eqInt("and one column", side.colSpan[nav], 1);
    const dotted = EVGGridAreas.parse("\"a .\" \". b\"");
    t.eqInt("dots are not areas", (dotted).count(), 2);
    const ragged = EVGGridAreas.parse("\"a b\" \"c\"");
    t.ok("ragged rows are an error", ragged.hadError);
    const bent = EVGGridAreas.parse("\"a a\" \"a b\" \"c a\"");
    t.ok("a non-rectangular area is an error", bent.hadError);
    const unquoted = EVGGridAreas.parse("a b");
    t.ok("rows must be quoted", unquoted.hadError);
    const root = new EVGElement();
    root.width = EVGUnit.px(200.0);
    root.height = EVGUnit.px(200.0);
    root.display = "grid";
    root.gridTemplateAreas = "\"hero hero\" \"left right\"";
    root.gridTemplateRows = "1fr 1fr";
    const heroEl = new EVGElement();
    heroEl.gridArea = "hero";
    const leftEl = new EVGElement();
    leftEl.gridArea = "left";
    const rightEl = new EVGElement();
    rightEl.gridArea = "right";
    root.addChild(heroEl);
    root.addChild(leftEl);
    root.addChild(rightEl);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("hero spans the full width", heroEl.calculatedWidth, 200.0);
    t.near("hero is on the top row", heroEl.calculatedY, 0.0);
    t.near("left is half width", leftEl.calculatedWidth, 100.0);
    t.near("left is on the second row", leftEl.calculatedY, 100.0);
    t.near("right sits beside it", rightEl.calculatedX, 100.0);
  };
  testSubgrid (t) {
    const outer = new EVGElement();
    outer.width = EVGUnit.px(400.0);
    outer.height = EVGUnit.px(200.0);
    outer.display = "grid";
    outer.gridTemplateColumns = "100px 300px";
    outer.gridTemplateRows = "1fr";
    const card = new EVGElement();
    card.display = "grid";
    card.gridTemplateColumns = "subgrid";
    card.gridColumn = "span 2";
    const cellA = new EVGElement();
    const cellB = new EVGElement();
    card.addChild(cellA);
    card.addChild(cellB);
    outer.addChild(card);
    const lay = new EVGLayout();
    lay.layout(outer);
    t.near("the card spans the whole outer grid", card.calculatedWidth, 400.0);
    t.near("first inner cell adopts the outer 100px track", cellA.calculatedWidth, 100.0);
    t.near("second inner cell adopts the outer 300px track", cellB.calculatedWidth, 300.0);
    t.near("and it starts where the outer track does", cellB.calculatedX, 100.0);
    const outer2 = new EVGElement();
    outer2.width = EVGUnit.px(400.0);
    outer2.height = EVGUnit.px(200.0);
    outer2.display = "grid";
    outer2.gridTemplateColumns = "100px 300px";
    outer2.gridTemplateRows = "1fr";
    const filler = new EVGElement();
    const narrow = new EVGElement();
    narrow.display = "grid";
    narrow.gridTemplateColumns = "subgrid";
    const only = new EVGElement();
    narrow.addChild(only);
    outer2.addChild(filler);
    outer2.addChild(narrow);
    const lay2 = new EVGLayout();
    lay2.layout(outer2);
    t.near("a one-column subgrid takes that one track", only.calculatedWidth, 300.0);
    const orphan = new EVGElement();
    orphan.width = EVGUnit.px(200.0);
    orphan.height = EVGUnit.px(100.0);
    orphan.display = "grid";
    orphan.gridTemplateColumns = "subgrid";
    const child = new EVGElement();
    orphan.addChild(child);
    const lay3 = new EVGLayout();
    lay3.layout(orphan);
    t.near("an orphan subgrid falls back to one full-width column", child.calculatedWidth, 200.0);
  };
  testGridDense (t) {
    const sparse = new EVGElement();
    sparse.width = EVGUnit.px(300.0);
    sparse.height = EVGUnit.px(200.0);
    sparse.display = "grid";
    sparse.gridTemplateColumns = "repeat(3, 1fr)";
    sparse.gridTemplateRows = "1fr 1fr";
    const s1 = new EVGElement();
    const s2 = new EVGElement();
    s2.gridColumn = "span 3";
    const s3 = new EVGElement();
    sparse.addChild(s1);
    sparse.addChild(s2);
    sparse.addChild(s3);
    const lay = new EVGLayout();
    lay.layout(sparse);
    t.near("wide item drops to its own row", s2.calculatedY, 100.0);
    t.near("the next item follows the cursor", s3.calculatedY, 200.0);
    const dense = new EVGElement();
    dense.width = EVGUnit.px(300.0);
    dense.height = EVGUnit.px(200.0);
    dense.display = "grid";
    dense.gridTemplateColumns = "repeat(3, 1fr)";
    dense.gridTemplateRows = "1fr 1fr";
    dense.gridAutoFlow = "row dense";
    const d1 = new EVGElement();
    const d2 = new EVGElement();
    d2.gridColumn = "span 3";
    const d3 = new EVGElement();
    dense.addChild(d1);
    dense.addChild(d2);
    dense.addChild(d3);
    const lay2 = new EVGLayout();
    lay2.layout(dense);
    t.near("dense still drops the wide item", d2.calculatedY, 100.0);
    t.near("the later item backfills row 0", d3.calculatedY, 0.0);
    t.near("in the first free column", d3.calculatedX, 100.0);
  };
  testGridTracks (t) {
    const a = EVGGridTemplate.parse("1fr 1fr");
    t.eqInt("two fr tracks", (a).count(), 2);
    a.resolve(100.0);
    const a0 = a.trackAt(0);
    t.near("equal fr split", a0.sizePx, 50.0);
    const r = EVGGridTemplate.parse("repeat(3, 1fr)");
    t.eqInt("repeat(3, 1fr) expands to 3", (r).count(), 3);
    r.resolve(90.0);
    const r2 = r.trackAt(2);
    t.near("repeat track size", r2.sizePx, 30.0);
    const mix = EVGGridTemplate.parse("120px 20% 1fr");
    t.eqInt("mixed track count", (mix).count(), 3);
    mix.resolve(400.0);
    const m0 = mix.trackAt(0);
    const m1 = mix.trackAt(1);
    const m2 = mix.trackAt(2);
    t.near("fixed track keeps px", m0.sizePx, 120.0);
    t.near("percent track of 400", m1.sizePx, 80.0);
    t.near("fr track takes the remainder", m2.sizePx, 200.0);
    const w = EVGGridTemplate.parse("2fr 1fr");
    w.resolve(300.0);
    const w0 = w.trackAt(0);
    const w1 = w.trackAt(1);
    t.near("2fr gets two thirds", w0.sizePx, 200.0);
    t.near("1fr gets one third", w1.sizePx, 100.0);
    const g = EVGGridTemplate.parse("repeat(3, 1fr)");
    g.resolve(300.0);
    t.near("offset of first track is 0", g.offsetOf(0, 10.0), 0.0);
    t.near("offset of third track", g.offsetOf(2, 10.0), 220.0);
    t.near("extent of one track", g.extentOf(0, 1, 10.0), 100.0);
    t.near("extent of two tracks includes inner gap", g.extentOf(0, 2, 10.0), 210.0);
    const mmT = EVGGridTemplate.parse("minmax(120px, 1fr) 1fr");
    t.eqInt("minmax counts as one track", (mmT).count(), 2);
    mmT.resolve(200.0);
    const mm0 = mmT.trackAt(0);
    const mm1 = mmT.trackAt(1);
    t.near("minmax floor holds", mm0.sizePx, 120.0);
    t.near("the other track takes what is left", mm1.sizePx, 80.0);
    const roomy = EVGGridTemplate.parse("minmax(50px, 1fr) 1fr");
    roomy.resolve(400.0);
    const rm0 = roomy.trackAt(0);
    t.near("an unbitten floor changes nothing", rm0.sizePx, 200.0);
    const capped = EVGGridTemplate.parse("minmax(0px, 60px) 1fr");
    capped.resolve(300.0);
    const cp0 = capped.trackAt(0);
    const cp1 = capped.trackAt(1);
    t.near("minmax ceiling caps the track", cp0.sizePx, 60.0);
    t.near("surplus goes to the neighbour", cp1.sizePx, 240.0);
    const rep = EVGGridTemplate.parse("repeat(3, minmax(40px, 1fr))");
    t.eqInt("repeat expands minmax tracks", (rep).count(), 3);
    t.no("and is not an error", rep.hadError);
    rep.resolve(300.0);
    const rp1 = rep.trackAt(1);
    t.near("repeated minmax tracks share evenly", rp1.sizePx, 100.0);
    const fc = EVGGridTemplate.parse("fit-content(100px) 1fr");
    t.no("fit-content() parses", fc.hadError);
    t.eqInt("fit-content() is one track", (fc).count(), 2);
    const fct = fc.trackAt(0);
    t.eqInt("fit-content() is an intrinsic track", fct.kind, 3);
    t.ok("...with a limit", fct.hasFitLimit);
    const au = EVGGridTemplate.parse("auto 1fr");
    const aut = au.trackAt(0);
    t.eqInt("auto is an intrinsic track", aut.kind, 3);
    t.no("...with no limit", aut.hasFitLimit);
    const bad = EVGGridTemplate.parse("nonesuch(10px)");
    t.ok("unknown track functions are reported", bad.hadError);
    const badLimit = EVGGridTemplate.parse("fit-content(bogus)");
    t.ok("an unparseable fit-content limit is reported", badLimit.hadError);
  };
  testGridPlacement (t) {
    const auto = EVGGridPlacement.parse("");
    t.eqInt("empty placement is auto", auto.start, 0);
    t.eqInt("empty placement spans one", auto.span, 1);
    const sp = EVGGridPlacement.parse("span 2");
    t.eqInt("span 2 stays auto-placed", sp.start, 0);
    t.eqInt("span 2 spans two", sp.span, 2);
    const line = EVGGridPlacement.parse("3");
    t.eqInt("bare line number is a start", line.start, 3);
    t.eqInt("bare line number spans one", line.span, 1);
    const range = EVGGridPlacement.parse("2 / 4");
    t.eqInt("line range start", range.start, 2);
    t.eqInt("line range span is the difference", range.span, 2);
    const mixed = EVGGridPlacement.parse("2 / span 3");
    t.eqInt("start with span end: start", mixed.start, 2);
    t.eqInt("start with span end: span", mixed.span, 3);
    const named = EVGGridPlacement.parse("sidebar");
    t.no("a name is not an error on its own", named.hadError);
    t.eqStr("the name is kept for the layout to resolve", named.startName, "sidebar");
    const neg = EVGGridPlacement.parse("-1");
    t.ok("a negative line is reported", neg.hadError);
    const zero = EVGGridPlacement.parse("0");
    t.ok("line 0 is reported", zero.hadError);
    const fine = EVGGridPlacement.parse("2 / span 3");
    t.no("a placement it understands is not an error", fine.hadError);
  };
  testNamedGridLines (t) {
    const tpl = EVGGridTemplate.parse("[full-start] 1fr [main] 2fr [main-end]");
    t.no("a template with names is not an error", tpl.hadError);
    t.eqInt("names do not add tracks", (tpl).count(), 2);
    t.eqInt("the leading name is line 1", tpl.lineNumberNamed("full-start"), 1);
    t.eqInt("a name between tracks is line 2", tpl.lineNumberNamed("main"), 2);
    t.eqInt("a trailing name is one past the last track", tpl.lineNumberNamed("main-end"), 3);
    t.eqInt("an unknown name is 0", tpl.lineNumberNamed("nope"), 0);
    const multi = EVGGridTemplate.parse("[a b] 1fr [c]");
    t.eqInt("both names label the same line: a", multi.lineNumberNamed("a"), 1);
    t.eqInt("both names label the same line: b", multi.lineNumberNamed("b"), 1);
    t.eqInt("and the trailing one follows", multi.lineNumberNamed("c"), 2);
    const p1 = EVGGridPlacement.parse("main");
    p1.resolveNames(tpl);
    t.no("a name the template has is not an error", p1.hadError);
    t.eqInt("the name became its line", p1.start, 2);
    const p2 = EVGGridPlacement.parse("full-start / main-end");
    p2.resolveNames(tpl);
    t.no("both ends resolve", p2.hadError);
    t.eqInt("start line", p2.start, 1);
    t.eqInt("span is the distance between the two lines", p2.span, 2);
    const p3 = EVGGridPlacement.parse("main / 3");
    p3.resolveNames(tpl);
    t.eqInt("named start, numeric end: start", p3.start, 2);
    t.eqInt("named start, numeric end: span", p3.span, 1);
    const p4 = EVGGridPlacement.parse("main / span 5");
    p4.resolveNames(tpl);
    t.eqInt("an explicit span wins", p4.span, 5);
    const p5 = EVGGridPlacement.parse("nowhere");
    p5.resolveNames(tpl);
    t.ok("an unknown name is reported", p5.hadError);
    t.eqInt("and the item stays auto-placed", p5.start, 0);
    const rep = EVGGridTemplate.parse("[left] repeat(3, 1fr) [right]");
    t.eqInt("repeat still expands beside names", (rep).count(), 3);
    t.eqInt("a name before repeat is line 1", rep.lineNumberNamed("left"), 1);
    t.eqInt("a name after repeat is past the last track", rep.lineNumberNamed("right"), 4);
  };
  testRowSubgrid (t) {
    const outer = new EVGElement();
    outer.setAttribute("width", "400px");
    outer.setAttribute("height", "140px");
    outer.setAttribute("display", "grid");
    outer.setAttribute("grid-template-columns", "1fr 1fr");
    outer.setAttribute("grid-template-rows", "100px 40px");
    const cardA = new EVGElement();
    cardA.setAttribute("display", "grid");
    cardA.setAttribute("grid-template-rows", "subgrid");
    cardA.setAttribute("grid-row", "1 / 3");
    const photoA = new EVGElement();
    cardA.addChild(photoA);
    const capA = new EVGElement();
    cardA.addChild(capA);
    outer.addChild(cardA);
    const cardB = new EVGElement();
    cardB.setAttribute("display", "grid");
    cardB.setAttribute("grid-template-rows", "subgrid");
    cardB.setAttribute("grid-row", "1 / 3");
    const photoB = new EVGElement();
    cardB.addChild(photoB);
    const capB = new EVGElement();
    cardB.addChild(capB);
    outer.addChild(cardB);
    const lay = new EVGLayout();
    lay.layout(outer);
    t.eqInt("a real enclosing grid is not reported as missing", lay.warningCount(), 0);
    t.near("the card spans both outer rows", cardA.calculatedHeight, 140.0);
    t.near("the photo takes the outer 100px row", photoA.calculatedHeight, 100.0);
    t.near("the caption takes the outer 40px row", capA.calculatedHeight, 40.0);
    t.near("and starts where that row does", capA.calculatedY, 100.0);
    t.near("the second card's caption lines up with the first", capB.calculatedY, capA.calculatedY);
    t.near("...and is the same height", capB.calculatedHeight, capA.calculatedHeight);
    const lone = new EVGElement();
    lone.setAttribute("width", "200px");
    lone.setAttribute("height", "100px");
    lone.setAttribute("display", "grid");
    lone.setAttribute("grid-template-rows", "subgrid");
    const kid = new EVGElement();
    kid.setAttribute("height", "30px");
    lone.addChild(kid);
    const lay2 = new EVGLayout();
    lay2.layout(lone);
    t.eqInt("a row subgrid with no enclosing grid is reported", lay2.warningCount(), 1);
    t.ok("and the message says which property", (lay2.warningAt(0).indexOf("grid-template-rows")) >= 0);
    t.near("it still lays out, on content-sized rows", kid.calculatedHeight, 30.0);
  };
  testIntrinsicGridTracks (t) {
    const root = new EVGElement();
    root.setAttribute("width", "300px");
    root.setAttribute("height", "100px");
    root.setAttribute("display", "grid");
    root.setAttribute("grid-template-columns", "auto 1fr");
    const a = new EVGElement();
    a.setAttribute("width", "80px");
    root.addChild(a);
    const b = new EVGElement();
    root.addChild(b);
    const lay = new EVGLayout();
    const rec0 = new RecordingMeasurer();
    lay.setMeasurer(rec0);
    lay.layout(root);
    t.near("auto track takes the item's width", a.calculatedWidth, 80.0);
    t.near("the fr track takes the rest", b.calculatedWidth, 220.0);
    t.near("and starts after it", b.calculatedX, 80.0);
    const r2 = new EVGElement();
    r2.setAttribute("width", "400px");
    r2.setAttribute("height", "100px");
    r2.setAttribute("display", "grid");
    r2.setAttribute("grid-template-columns", "auto 1fr");
    const txt = new EVGElement();
    txt.setAttribute("font-size", "10px");
    txt.textContent = "abcd efg";
    r2.addChild(txt);
    const pad = new EVGElement();
    r2.addChild(pad);
    const lay2 = new EVGLayout();
    const rec2 = new RecordingMeasurer();
    lay2.setMeasurer(rec2);
    lay2.layout(r2);
    t.near("auto sizes text to its longest line", txt.calculatedWidth, 40.0);
    const r3 = new EVGElement();
    r3.setAttribute("width", "400px");
    r3.setAttribute("height", "100px");
    r3.setAttribute("display", "grid");
    r3.setAttribute("grid-template-columns", "fit-content(25px) 1fr");
    const txt3 = new EVGElement();
    txt3.setAttribute("font-size", "10px");
    txt3.textContent = "abcd efg";
    r3.addChild(txt3);
    const pad3 = new EVGElement();
    r3.addChild(pad3);
    const lay3 = new EVGLayout();
    const rec3 = new RecordingMeasurer();
    lay3.setMeasurer(rec3);
    lay3.layout(r3);
    t.near("fit-content clamps to its limit", txt3.calculatedWidth, 25.0);
    const r4 = new EVGElement();
    r4.setAttribute("width", "400px");
    r4.setAttribute("height", "100px");
    r4.setAttribute("display", "grid");
    r4.setAttribute("grid-template-columns", "fit-content(10px) 1fr");
    const txt4 = new EVGElement();
    txt4.setAttribute("font-size", "10px");
    txt4.textContent = "abcd efg";
    r4.addChild(txt4);
    const pad4 = new EVGElement();
    r4.addChild(pad4);
    const lay4 = new EVGLayout();
    const rec4 = new RecordingMeasurer();
    lay4.setMeasurer(rec4);
    lay4.layout(r4);
    t.near("fit-content never goes below min-content", txt4.calculatedWidth, 20.0);
  };
  testLayoutWarnings (t) {
    const root = new EVGElement();
    root.setAttribute("width", "600px");
    root.setAttribute("height", "400px");
    root.setAttribute("display", "grid");
    root.setAttribute("grid-template-columns", "nonesuch(100px) 1fr");
    root.setAttribute("grid-template-rows", "subgrid");
    const a = new EVGElement();
    a.setAttribute("grid-column", "sidebar");
    root.addChild(a);
    const b = new EVGElement();
    b.setAttribute("grid-row", "1 / main");
    root.addChild(b);
    const lay = new EVGLayout();
    lay.layout(root);
    t.eqInt("every unsupported declaration is reported", lay.warningCount(), 4);
    t.ok("the message names the property", (lay.warningAt(0).indexOf("grid-template-columns")) >= 0);
    t.ok("and what it could not do", (lay.warningAt(0).indexOf("nonesuch(100px)")) >= 0);
    const ok = new EVGElement();
    ok.setAttribute("width", "600px");
    ok.setAttribute("height", "400px");
    ok.setAttribute("display", "grid");
    ok.setAttribute("grid-template-columns", "repeat(2, 1fr)");
    const c1 = new EVGElement();
    c1.setAttribute("grid-column", "span 2");
    ok.addChild(c1);
    const lay2 = new EVGLayout();
    lay2.layout(ok);
    t.eqInt("a grid it understands warns about nothing", lay2.warningCount(), 0);
    const dup = new EVGElement();
    dup.setAttribute("width", "600px");
    dup.setAttribute("height", "400px");
    dup.setAttribute("display", "grid");
    const d1 = new EVGElement();
    d1.setAttribute("grid-column", "sidebar");
    dup.addChild(d1);
    const d2 = new EVGElement();
    d2.setAttribute("grid-column", "sidebar");
    dup.addChild(d2);
    const lay3 = new EVGLayout();
    lay3.layout(dup);
    t.eqInt("a repeated complaint is reported once", lay3.warningCount(), 1);
  };
  testGridLayout (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(400.0);
    root.display = "grid";
    root.gridTemplateColumns = "repeat(2, 1fr)";
    root.gridTemplateRows = "1fr 1fr";
    root.gap = EVGUnit.parse("20px");
    const a = new EVGElement();
    const b = new EVGElement();
    const c = new EVGElement();
    c.gridColumn = "span 2";
    root.addChild(a);
    root.addChild(b);
    root.addChild(c);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("grid col width", a.calculatedWidth, 190.0);
    t.near("grid row height", a.calculatedHeight, 190.0);
    t.near("first cell at origin", a.calculatedX, 0.0);
    t.near("second cell after gap", b.calculatedX, 210.0);
    t.near("second cell same row", b.calculatedY, 0.0);
    t.near("spanning item is full width", c.calculatedWidth, 400.0);
    t.near("spanning item wrapped to row 2", c.calculatedY, 210.0);
    t.near("spanning item back at column 1", c.calculatedX, 0.0);
    const g2 = new EVGElement();
    g2.width = EVGUnit.px(400.0);
    g2.height = EVGUnit.px(400.0);
    g2.display = "grid";
    g2.gridTemplateColumns = "1fr 1fr";
    g2.gridTemplateRows = "1fr 1fr";
    g2.gap = EVGUnit.parse("20px");
    g2.columnGap = EVGUnit.parse("40px");
    const p1 = new EVGElement();
    const p2 = new EVGElement();
    const p3 = new EVGElement();
    g2.addChild(p1);
    g2.addChild(p2);
    g2.addChild(p3);
    const lay2 = new EVGLayout();
    lay2.layout(g2);
    t.near("column-gap overrides gap", p2.calculatedX, 220.0);
    t.near("row-gap still from shorthand", p3.calculatedY, 210.0);
    const g3 = new EVGElement();
    g3.width = EVGUnit.px(300.0);
    g3.height = EVGUnit.px(300.0);
    g3.display = "grid";
    g3.gridTemplateColumns = "1fr 1fr";
    g3.gridTemplateRows = "1fr 1fr";
    const tall = new EVGElement();
    tall.gridRow = "span 2";
    const s1 = new EVGElement();
    const s2 = new EVGElement();
    g3.addChild(tall);
    g3.addChild(s1);
    g3.addChild(s2);
    const lay3 = new EVGLayout();
    lay3.layout(g3);
    t.near("row-spanning item covers both rows", tall.calculatedHeight, 300.0);
    t.near("next item sits beside it", s1.calculatedX, 150.0);
    t.near("next item on row 1", s1.calculatedY, 0.0);
    t.near("third item skips the occupied cell", s2.calculatedX, 150.0);
    t.near("third item drops to row 2", s2.calculatedY, 150.0);
    const g4 = new EVGElement();
    g4.width = EVGUnit.px(200.0);
    g4.height = EVGUnit.px(200.0);
    g4.display = "grid";
    const only = new EVGElement();
    g4.addChild(only);
    const lay4 = new EVGLayout();
    lay4.layout(g4);
    t.near("default grid is a single full-width column", only.calculatedWidth, 200.0);
  };
  testGridContentRows (t) {
    const root = new EVGElement();
    root.width = EVGUnit.px(400.0);
    root.height = EVGUnit.px(400.0);
    const grid = new EVGElement();
    grid.display = "grid";
    grid.gridTemplateColumns = "1fr 1fr";
    grid.gap = EVGUnit.parse("10px");
    root.addChild(grid);
    const short = new EVGElement();
    short.height = EVGUnit.px(30.0);
    const tall = new EVGElement();
    tall.height = EVGUnit.px(80.0);
    const next = new EVGElement();
    next.height = EVGUnit.px(25.0);
    const stretchy = new EVGElement();
    grid.addChild(short);
    grid.addChild(tall);
    grid.addChild(next);
    grid.addChild(stretchy);
    const lay = new EVGLayout();
    lay.layout(root);
    t.near("explicit height is not stretched", short.calculatedHeight, 30.0);
    t.near("tallest item defines the row", tall.calculatedHeight, 80.0);
    t.near("second row starts below row 1 + gap", next.calculatedY, 90.0);
    t.near("auto-height item stretches to its row", stretchy.calculatedHeight, 25.0);
    t.near("grid container grows to its rows", grid.calculatedHeight, 115.0);
  };
  testSvgPath (t) {
    const parser = new SVGPathParser();
    parser.parse("M 0 0 L 100 50 Z");
    const cmds = parser.getCommands();
    t.ok("path produced commands", (cmds.length) >= 2);
    const bounds = parser.getBounds();
    t.near("path bounds width", bounds.width, 100.0);
    t.near("path bounds height", bounds.height, 50.0);
    t.near("path bounds minX", bounds.minX, 0.0);
    t.near("path bounds maxX", bounds.maxX, 100.0);
  };
  testGraphemeClusters (t) {
    let plain = [];
    plain.push(65);
    plain.push(66);
    t.eqInt("a letter is one cluster", EVGGrapheme.clusterEnd(plain, 0), 1);
    let skin = [];
    skin.push(128077);
    skin.push(127997);
    t.eqInt("a skin tone joins the emoji before it", EVGGrapheme.clusterEnd(skin, 0), 2);
    let keycap = [];
    keycap.push(49);
    keycap.push(65039);
    keycap.push(8419);
    t.eqInt("a keycap is one cluster of three", EVGGrapheme.clusterEnd(keycap, 0), 3);
    let family = [];
    family.push(128104);
    family.push(8205);
    family.push(128105);
    family.push(8205);
    family.push(128103);
    t.eqInt("a ZWJ sequence is one cluster", EVGGrapheme.clusterEnd(family, 0), 5);
    let flags = [];
    flags.push(127467);
    flags.push(127470);
    flags.push(127480);
    flags.push(127466);
    t.eqInt("a flag is exactly two regional indicators", EVGGrapheme.clusterEnd(flags, 0), 2);
    t.eqInt("and the next pair starts a new cluster", EVGGrapheme.clusterEnd(flags, 2), 4);
    let dangling = [];
    dangling.push(128104);
    dangling.push(8205);
    t.eqInt("a trailing joiner does not run off the end", EVGGrapheme.clusterEnd(dangling, 0), 1);
    t.eqInt("a plain string counts its letters", EVGGrapheme.clusterCount("abc"), 3);
    const bounds = EVGGrapheme.boundaries(family);
    t.eqInt("one cluster yields two boundaries", bounds.length, 2);
    t.eqInt("and the last one is the length", bounds[1], 5);
  };
  testEmojiColor (t) {
    const plain = new EVGElement();
    plain.setAttribute("color", "#112233");
    t.ok("unset, emoji take the text colour", (plain.effectiveEmojiColor()).red() == 17);
    t.eqBool("and the property itself stays unset", plain.emojiColor.isSet, false);
    const tinted = new EVGElement();
    tinted.setAttribute("color", "#112233");
    tinted.setAttribute("emoji-color", "#e11d48");
    const ec = tinted.effectiveEmojiColor();
    t.eqInt("set, emoji take their own colour", ec.red(), 225);
    t.eqInt("green channel", ec.green(), 29);
    t.eqInt("blue channel", ec.blue(), 72);
    t.eqInt("and the text colour is untouched", ((tinted.color)).red(), 17);
    const parent = new EVGElement();
    parent.setAttribute("emoji-color", "#16a34a");
    const kid = new EVGElement();
    parent.addChild(kid);
    kid.inheritProperties(parent);
    t.eqInt("it inherits from the parent", (kid.effectiveEmojiColor()).red(), 22);
    const kid2 = new EVGElement();
    kid2.setAttribute("emoji-color", "#2563eb");
    parent.addChild(kid2);
    kid2.inheritProperties(parent);
    t.eqInt("but its own declaration wins", (kid2.effectiveEmojiColor()).blue(), 235);
  };
  testBorderResolution (t) {
    const viaCss = new EVGElement();
    viaCss.setAttribute("border-width", "3px");
    viaCss.setAttribute("border-color", "#b08d57");
    viaCss.box.resolveUnits(100.0, 100.0, 14.0, 16.0);
    t.near("a CSS border has its width", viaCss.effectiveBorderWidthPx(), 3.0);
    t.eqInt("and its colour", (viaCss.effectiveBorderColor()).red(), 176);
    const viaAttr = new EVGElement();
    viaAttr.borderWidth = EVGUnit.parse("2px");
    viaAttr.borderColor = EVGColor.parse("#2563eb");
    t.near("an inline border has its width", viaAttr.effectiveBorderWidthPx(), 2.0);
    t.eqInt("and its colour", (viaAttr.effectiveBorderColor()).blue(), 235);
    const plain = new EVGElement();
    t.near("an element with no border has none", plain.effectiveBorderWidthPx(), 0.0);
    t.eqBool("and reports so", plain.hasBorder(), false);
    const widthOnly = new EVGElement();
    widthOnly.setAttribute("border-width", "1px");
    widthOnly.box.resolveUnits(100.0, 100.0, 14.0, 16.0);
    const bc = widthOnly.effectiveBorderColor();
    t.eqInt("a width with no colour is black", (bc.red() + bc.green()) + bc.blue(), 0);
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const test = new EVGTest();
  const t = RgTest.forSuite("evg/evg");
  test.testUnits(t);
  test.testColors(t);
  test.testBox(t);
  test.testTextMeasurer(t);
  test.testText(t);
  test.testSimpleLayout(t);
  test.testNestedLayout(t);
  test.testAlignment(t);
  test.testGap(t);
  test.testRowSideBySide(t);
  test.testFlexGrowRow(t);
  test.testFlexGrowColumn(t);
  test.testFlexMinMax(t);
  test.testFlexShrinkFactors(t);
  test.testAlignContent(t);
  test.testWrapReverseAndStretch(t);
  test.testFlexBasis(t);
  test.testFlexShorthand(t);
  test.testFlexShrink(t);
  test.testAutoHeightNoShrink(t);
  test.testJustifyDistribution(t);
  test.testAlignStretch(t);
  test.testFlexWrap(t);
  test.testTextIntrinsicWidth(t);
  test.testSvgPath(t);
  test.testBaselineAlignment(t);
  test.testTextEngineWrap(t);
  test.testTextEngineFontChecks(t);
  test.testLayoutUsesElementFont(t);
  test.testGridAreas(t);
  test.testGridDense(t);
  test.testSubgrid(t);
  test.testRowSubgrid(t);
  test.testGridTracks(t);
  test.testGridPlacement(t);
  test.testNamedGridLines(t);
  test.testIntrinsicGridTracks(t);
  test.testLayoutWarnings(t);
  test.testGridLayout(t);
  test.testGridContentRows(t);
  test.testStyleSheetParse(t);
  test.testStyleSheetCascade(t);
  test.testGraphemeClusters(t);
  test.testEmojiColor(t);
  test.testBorderResolution(t);
  t.summary();
}
__js_main();
