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
