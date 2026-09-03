class ScAssign  {
  constructor() {
    this.key = "";
    this.source = "literal";
    this.literal = "";
  }
}
ScAssign.of = function(key, source, literal) {
  const a = new ScAssign();
  a.key = key;
  a.source = source;
  a.literal = literal;
  return a;
};
class ScTransition  {
  constructor() {
    this.event = "";
    this.target = "";
    this.assigns = [];
  }
}
class ScState  {
  constructor() {
    this.name = "";
    this.transitions = [];
  }
  on (event, target) {
    const t = new ScTransition();
    t.event = event;
    t.target = target;
    this.transitions.push(t);
    return t;
  };
}
class Statechart  {
  constructor() {
    this.id = "";
    this.initial = "";
    this.states = [];
    this.keys = [];
    this.values = [];
  }
  state (name) {
    const s = new ScState();
    s.name = name;
    this.states.push(s);
    return s;
  };
  context (key, value) {
    this.keys.push(key);
    this.values.push(value);
  };
  stateNamed (name) {
    for ( let i = 0; i < this.states.length; i++) {
      var s = this.states[i];
      if ( s.name == name ) {
        return s;
      }
    };
    return new ScState();
  };
}
class ScRunner  {
  constructor() {
    this.state = "";
    this.keys = [];
    this.values = [];
  }
  start (definition) {
    this.chart = definition;
    this.state = definition.initial;
    this.keys.length = 0;
    this.values.length = 0;
    for ( let i = 0; i < definition.keys.length; i++) {
      var k = definition.keys[i];
      this.keys.push(k);
      this.values.push(definition.values[i]);
    };
  };
  get (key) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i];
      }
    };
    return "";
  };
  set (key, value) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        this.values[i] = value;
        return;
      }
    };
    this.keys.push(key);
    this.values.push(value);
  };
  initialOf (key) {
    const c = this.chart;
    for ( let i = 0; i < c.keys.length; i++) {
      var k = c.keys[i];
      if ( k == key ) {
        return c.values[i];
      }
    };
    return "";
  };
  send (event, value) {
    const c = this.chart;
    const here = c.stateNamed(this.state);
    for ( let i = 0; i < here.transitions.length; i++) {
      var t = here.transitions[i];
      if ( t.event == event ) {
        for ( let j = 0; j < t.assigns.length; j++) {
          var a = t.assigns[j];
          if ( a.source == "literal" ) {
            this.set(a.key, a.literal);
          }
          if ( a.source == "value" ) {
            this.set(a.key, value);
          }
          if ( a.source == "context" ) {
            this.set(a.key, this.get(a.literal));
          }
          if ( a.source == "valueOrContext" ) {
            if ( value.length > 0 ) {
              this.set(a.key, value);
            } else {
              this.set(a.key, this.get(a.literal));
            }
          }
        };
        if ( t.target.length > 0 ) {
          this.state = t.target;
        }
        return true;
      }
    };
    return false;
  };
}
/**
 * A JSON value: null, a boolean, a number, text, an array or an object.
 * 
 * This is the value model the whole of Vela exchanges — a specification arrives
 * as one, the chart API emits one, and the runtime reads one. It is pure Ranger
 * with no host JSON, so the same tree is built on every target, which is what
 * makes a scene comparison against the reference implementation mean anything.
 * 
 * Two things it carries that a plain JSON model does not: object keys keep the
 * order they were written in, so a re-serialised specification is stable; and a
 * number remembers whether it was written as an integer, so `5` does not come
 * back as `5.0`.
 * @public
 */
class VlJson  {
  constructor() {
    this.kind = 0;
    this.num = 0.0;
    this.b = false;
    this.str = "";
    this.arr = [];
    this.keys = [];
    this.members = {};
    this.isInt = false;
  }
  isNull () {
    return this.kind == 0;
  };
  isBool () {
    return this.kind == 1;
  };
  isNumber () {
    return this.kind == 2;
  };
  isString () {
    return this.kind == 3;
  };
  isArray () {
    return this.kind == 4;
  };
  isObject () {
    return this.kind == 5;
  };
  isDefined () {
    return this.kind != 0;
  };
  looksNumeric () {
    if ( this.kind == 2 ) {
      return true;
    }
    if ( this.kind != 3 ) {
      return false;
    }
    if ( this.str.length == 0 ) {
      return false;
    }
    const d = isNaN( parseFloat(this.str) ) ? undefined : parseFloat(this.str);
    if ( typeof(d) != "undefined" ) {
      return true;
    }
    return false;
  };
  asInt () {
    return Math.floor( this.num);
  };
  asDouble () {
    if ( this.kind == 2 ) {
      return this.num;
    }
    if ( this.kind == 1 ) {
      if ( this.b ) {
        return 1.0;
      }
      return 0.0;
    }
    if ( this.kind == 3 ) {
      const d = isNaN( parseFloat(this.str) ) ? undefined : parseFloat(this.str);
      if ( typeof(d) != "undefined" ) {
        return d;
      }
    }
    return 0.0;
  };
  asString () {
    if ( this.kind == 3 ) {
      return this.str;
    }
    if ( this.kind == 4 ) {
      let joined = "";
      let k = 0;
      while (k < this.arr.length) {
        if ( k > 0 ) {
          joined = joined + "\n";
        }
        joined = joined + this.arr[k].asString();
        k = k + 1;
      };
      return joined;
    }
    if ( this.kind == 2 ) {
      return VlJson.numberToText(this.num, this.isInt);
    }
    if ( this.kind == 1 ) {
      if ( this.b ) {
        return "true";
      }
      return "false";
    }
    return "";
  };
  asBool () {
    if ( this.kind == 1 ) {
      return this.b;
    }
    if ( this.kind == 2 ) {
      return this.num != 0.0;
    }
    if ( this.kind == 3 ) {
      return this.str.length > 0;
    }
    return false;
  };
  count () {
    return this.arr.length;
  };
  at (index) {
    if ( index < 0 ) {
      return VlJson.nullValue();
    }
    if ( index >= this.arr.length ) {
      return VlJson.nullValue();
    }
    return this.arr[index];
  };
  has (key) {
    return ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) );
  };
  get (key) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      return ( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined );
    }
    return VlJson.nullValue();
  };
  intOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined );
      if ( v.kind == 2 ) {
        return Math.floor( v.num);
      }
    }
    return dflt;
  };
  doubleOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined );
      if ( v.kind == 2 ) {
        return v.num;
      }
    }
    return dflt;
  };
  stringOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined );
      if ( v.kind == 3 ) {
        return v.str;
      }
    }
    return dflt;
  };
  boolOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined );
      if ( v.kind == 1 ) {
        return v.b;
      }
    }
    return dflt;
  };
  setMember (key, value) {
    if ( false == ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      this.keys.push(key);
    }
    this.members[key] = value;
  };
  removeMember (key) {
    if ( false == ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      return;
    }
    let kept = [];
    let fresh = {};
    for ( let ki = 0; ki < this.keys.length; ki++) {
      var k = this.keys[ki];
      if ( k != key ) {
        kept.push(k);
        fresh[k] = ( Object.prototype.hasOwnProperty.call(this.members, k) ? this.members[k] : undefined );
      }
    };
    this.keys = kept;
    this.members = fresh;
  };
}
/**
 * Builds the JSON null value.
 * @returns {VlJson} A null value.
 * @public
 */
VlJson.nullValue = function() {
  const v = new VlJson();
  return v;
};
/**
 * Builds a JSON boolean.
 * @param {boolean} value - The boolean.
 * @returns {VlJson} A boolean value.
 * @public
 */
VlJson.boolValue = function(value) {
  const v = new VlJson();
  v.kind = 1;
  v.b = value;
  return v;
};
/**
 * Builds a JSON number that prints with a fraction, so 5 comes back as `5.0`.
 * @param {number} value - The number.
 * @returns {VlJson} A number value.
 * @see intValue
 * @public
 */
VlJson.numberValue = function(value) {
  const v = new VlJson();
  v.kind = 2;
  v.num = value;
  return v;
};
/**
 * Builds a JSON number that prints without a fraction, so 5 stays `5`.
 * 
 * JSON has one number type; the text does not. A count written with this prints
 * as a count.
 * @param {number} value - The whole number.
 * @returns {VlJson} A number value that remembers it was written as an integer.
 * @see numberValue
 * @public
 */
VlJson.intValue = function(value) {
  const v = new VlJson();
  v.kind = 2;
  v.num = value;
  v.isInt = true;
  return v;
};
/**
 * Builds a JSON string.
 * @param {string} value - The text.
 * @returns {VlJson} A string value.
 * @public
 */
VlJson.stringValue = function(value) {
  const v = new VlJson();
  v.kind = 3;
  v.str = value;
  return v;
};
/**
 * Builds an empty JSON array.
 * @returns {VlJson} An array value with no elements.
 * @public
 */
VlJson.arrayValue = function() {
  const v = new VlJson();
  v.kind = 4;
  return v;
};
/**
 * Builds an empty JSON object.
 * @returns {VlJson} An object value with no members.
 * @public
 */
VlJson.objectValue = function() {
  const v = new VlJson();
  v.kind = 5;
  return v;
};
VlJson.numberToText = function(value, wasInt) {
  return VlJson.formatNumber(value, 6);
};
VlJson.formatSignificant = function(value, digits) {
  let m = value;
  if ( m < 0.0 ) {
    m = 0.0 - m;
  }
  let whole = 1;
  while (m >= 10.0) {
    m = m / 10.0;
    whole = whole + 1;
  };
  let decimals = digits - whole;
  if ( decimals < 0 ) {
    decimals = 0;
  }
  return VlJson.formatNumber(value, decimals);
};
VlJson.withMinusSign = function(text) {
  if ( text.length == 0 ) {
    return text;
  }
  if ( text.substring(0, 1 ) == "-" ) {
    return String.fromCharCode(8722) + text.substring(1, text.length );
  }
  return text;
};
VlJson.domainKey = function(cell) {
  if ( cell.isNull() ) {
    return "null";
  }
  return cell.asString();
};
VlJson.formatNumber = function(value, maxDecimals) {
  let v = value;
  if ( false == (value == value) ) {
    return "NaN";
  }
  if ( v == 0.0 ) {
    return "0";
  }
  if ( value * 0.5 == value ) {
    if ( value > 0.0 ) {
      return "Infinity";
    }
    return "-Infinity";
  }
  let neg = false;
  if ( v < 0.0 ) {
    neg = true;
    v = 0.0 - v;
  }
  if ( v >= 1000000000.0 ) {
    let place = 1.0;
    while (v / place >= 10.0) {
      place = place * 10.0;
    };
    let big = "";
    let rest = v;
    while (place >= 1.0) {
      big = big + VlJson.digitChar(VlJson.digitAt(rest, place));
      rest = rest - VlJson.digitAt(rest, place) * place;
      place = place / 10.0;
    };
    const tail = VlJson.fractionDigits(rest, maxDecimals);
    if ( tail.length > 0 ) {
      big = (big + ".") + tail;
    }
    if ( neg ) {
      return "-" + big;
    }
    return big;
  }
  let scale = 1.0;
  let k = 0;
  while (k < maxDecimals) {
    scale = scale * 10.0;
    k = k + 1;
  };
  let whole = Math.floor(v);
  const frac = v - whole;
  if ( frac == 0.0 ) {
    if ( neg ) {
      return "-" + VlJson.intToText(whole);
    }
    return VlJson.intToText(whole);
  }
  let units = frac * scale + 0.5;
  if ( false == (units < scale) ) {
    whole = whole + 1;
    units = 0.0;
  }
  let out = VlJson.intToText(whole);
  let fracText = "";
  let place_1 = scale;
  let rest_1 = units;
  let i = 0;
  while (i < maxDecimals) {
    place_1 = place_1 / 10.0;
    const digit = Math.floor((rest_1 / place_1));
    rest_1 = rest_1 - digit * place_1;
    fracText = fracText + VlJson.digitChar(digit);
    i = i + 1;
  };
  let end = fracText.length;
  let stop = false;
  while (end > 0 && false == stop) {
    if ( fracText.charCodeAt((end - 1) ) == 48 ) {
      end = end - 1;
    } else {
      stop = true;
    }
  };
  if ( end > 0 ) {
    out = (out + ".") + fracText.substring(0, end );
  }
  if ( neg ) {
    return "-" + out;
  }
  return out;
};
VlJson.digitAt = function(rest, place) {
  const digit = Math.floor((rest / place));
  if ( digit > 9 ) {
    return 9;
  }
  if ( digit < 0 ) {
    return 0;
  }
  return digit;
};
VlJson.fractionDigits = function(frac, maxDecimals) {
  let out = "";
  let rest = frac;
  let place = 0.1;
  let i = 0;
  while (i < maxDecimals) {
    const digit = VlJson.digitAt(rest, place);
    out = out + VlJson.digitChar(digit);
    rest = rest - digit * place;
    place = place / 10.0;
    i = i + 1;
  };
  let end = out.length;
  let stop = false;
  while (end > 0 && false == stop) {
    if ( out.substring((end - 1), end ) == "0" ) {
      end = end - 1;
    } else {
      stop = true;
    }
  };
  return out.substring(0, end );
};
VlJson.intToText = function(value) {
  if ( value <= 0 ) {
    return "0";
  }
  let v = value;
  let digits = "";
  while (v > 0) {
    const next = ((v / 10) | 0);
    const digit = v - next * 10;
    digits = VlJson.digitChar(digit) + digits;
    v = next;
  };
  return digits;
};
VlJson.digitChar = function(d) {
  if ( d <= 0 ) {
    return "0";
  }
  if ( d == 1 ) {
    return "1";
  }
  if ( d == 2 ) {
    return "2";
  }
  if ( d == 3 ) {
    return "3";
  }
  if ( d == 4 ) {
    return "4";
  }
  if ( d == 5 ) {
    return "5";
  }
  if ( d == 6 ) {
    return "6";
  }
  if ( d == 7 ) {
    return "7";
  }
  if ( d == 8 ) {
    return "8";
  }
  return "9";
};
class VlJsonParser  {
  constructor() {
    this.s = "";
    this.i = 0;
    this.n = 0;
    this.ok = true;
    this.err = "";
  }
  parse (text) {
    this.s = text;
    this.i = 0;
    this.n = text.length;
    this.ok = true;
    this.err = "";
    const v = this.parseValue();
    return v;
  };
  isWs (c) {
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
  skipWs () {
    let go = true;
    while (go) {
      if ( this.i >= this.n ) {
        go = false;
      } else {
        const c = this.s.charCodeAt(this.i );
        if ( this.isWs(c) ) {
          this.i = this.i + 1;
        } else {
          go = false;
        }
      }
    };
  };
  isNumChar (c) {
    if ( c == 45 ) {
      return true;
    }
    if ( c == 43 ) {
      return true;
    }
    if ( c == 46 ) {
      return true;
    }
    if ( c == 101 ) {
      return true;
    }
    if ( c == 69 ) {
      return true;
    }
    if ( c >= 48 ) {
      if ( c <= 57 ) {
        return true;
      }
    }
    return false;
  };
  fail (msg) {
    if ( this.ok ) {
      this.ok = false;
      this.err = msg;
    }
  };
  parseValue () {
    this.skipWs();
    if ( this.i >= this.n ) {
      this.fail("unexpected end of input");
      return VlJson.nullValue();
    }
    const c = this.s.charCodeAt(this.i );
    if ( c == 123 ) {
      return this.parseObject();
    }
    if ( c == 91 ) {
      return this.parseArray();
    }
    if ( c == 34 ) {
      return this.parseString();
    }
    if ( c == 116 ) {
      return this.parseKeyword("true", 1, true);
    }
    if ( c == 102 ) {
      return this.parseKeyword("false", 1, false);
    }
    if ( c == 110 ) {
      return this.parseKeyword("null", 0, false);
    }
    return this.parseNumber();
  };
  parseKeyword (word, kind, bval) {
    const wl = word.length;
    let matched = true;
    let k = 0;
    while (k < wl) {
      if ( this.i + k >= this.n ) {
        matched = false;
        k = wl;
      } else {
        if ( this.s.charCodeAt((this.i + k) ) != word.charCodeAt(k ) ) {
          matched = false;
          k = wl;
        } else {
          k = k + 1;
        }
      }
    };
    const v = new VlJson();
    if ( matched ) {
      this.i = this.i + wl;
      v.kind = kind;
      v.b = bval;
    } else {
      this.fail("invalid literal, expected " + word);
    }
    return v;
  };
  parseNumber () {
    const start = this.i;
    let sawFraction = false;
    let go = true;
    while (go) {
      if ( this.i >= this.n ) {
        go = false;
      } else {
        const c = this.s.charCodeAt(this.i );
        if ( this.isNumChar(c) ) {
          if ( c == 46 ) {
            sawFraction = true;
          }
          if ( c == 101 ) {
            sawFraction = true;
          }
          if ( c == 69 ) {
            sawFraction = true;
          }
          this.i = this.i + 1;
        } else {
          go = false;
        }
      }
    };
    const v = new VlJson();
    if ( this.i > start ) {
      const sub = this.s.substring(start, this.i );
      const d = isNaN( parseFloat(sub) ) ? undefined : parseFloat(sub);
      v.kind = 2;
      v.isInt = false == sawFraction;
      if ( typeof(d) != "undefined" ) {
        v.num = d;
      } else {
        this.fail("invalid number: " + sub);
      }
    } else {
      this.fail("expected value");
    }
    return v;
  };
  hexDigit (c) {
    if ( c >= 48 ) {
      if ( c <= 57 ) {
        return c - 48;
      }
    }
    if ( c >= 97 ) {
      if ( c <= 102 ) {
        return (c - 97) + 10;
      }
    }
    if ( c >= 65 ) {
      if ( c <= 70 ) {
        return (c - 65) + 10;
      }
    }
    return 0;
  };
  readRawString () {
    this.i = this.i + 1;
    let out = "";
    let go = true;
    while (go) {
      if ( this.i >= this.n ) {
        this.fail("unterminated string");
        go = false;
      } else {
        const c = this.s.charCodeAt(this.i );
        if ( c == 34 ) {
          this.i = this.i + 1;
          go = false;
        } else {
          if ( c == 92 ) {
            this.i = this.i + 1;
            if ( this.i >= this.n ) {
              this.fail("unterminated escape");
              go = false;
            } else {
              const e = this.s.charCodeAt(this.i );
              out = out + this.decodeEscape(e);
              this.i = this.i + 1;
            }
          } else {
            out = out + this.s.substring(this.i, (this.i + 1) );
            this.i = this.i + 1;
          }
        }
      }
    };
    return out;
  };
  decodeEscape (e) {
    if ( e == 34 ) {
      return String.fromCharCode(34);
    }
    if ( e == 92 ) {
      return String.fromCharCode(92);
    }
    if ( e == 47 ) {
      return String.fromCharCode(47);
    }
    if ( e == 98 ) {
      return String.fromCharCode(8);
    }
    if ( e == 102 ) {
      return String.fromCharCode(12);
    }
    if ( e == 110 ) {
      return String.fromCharCode(10);
    }
    if ( e == 114 ) {
      return String.fromCharCode(13);
    }
    if ( e == 116 ) {
      return String.fromCharCode(9);
    }
    if ( e == 117 ) {
      let cp = 0;
      let k = 0;
      while (k < 4) {
        const hc = this.s.charCodeAt(((this.i + 1) + k) );
        cp = cp * 16 + this.hexDigit(hc);
        k = k + 1;
      };
      this.i = this.i + 4;
      return String.fromCharCode(cp);
    }
    return String.fromCharCode(e);
  };
  parseString () {
    const v = new VlJson();
    v.kind = 3;
    v.str = this.readRawString();
    return v;
  };
  parseArray () {
    const v = new VlJson();
    v.kind = 4;
    this.i = this.i + 1;
    this.skipWs();
    if ( this.i < this.n ) {
      if ( this.s.charCodeAt(this.i ) == 93 ) {
        this.i = this.i + 1;
        return v;
      }
    }
    let go = true;
    while (go) {
      const item = this.parseValue();
      v.arr.push(item);
      this.skipWs();
      if ( this.i >= this.n ) {
        this.fail("unterminated array");
        go = false;
      } else {
        const c = this.s.charCodeAt(this.i );
        if ( c == 44 ) {
          this.i = this.i + 1;
          this.skipWs();
        } else {
          if ( c == 93 ) {
            this.i = this.i + 1;
            go = false;
          } else {
            this.fail("expected ',' or ']' in array");
            go = false;
          }
        }
      }
      if ( this.ok == false ) {
        go = false;
      }
    };
    return v;
  };
  parseObject () {
    const v = new VlJson();
    v.kind = 5;
    this.i = this.i + 1;
    this.skipWs();
    if ( this.i < this.n ) {
      if ( this.s.charCodeAt(this.i ) == 125 ) {
        this.i = this.i + 1;
        return v;
      }
    }
    let go = true;
    while (go) {
      this.skipWs();
      if ( this.i >= this.n ) {
        this.fail("unterminated object");
        go = false;
      } else {
        if ( this.s.charCodeAt(this.i ) != 34 ) {
          this.fail("expected string key in object");
          go = false;
        } else {
          const key = this.readRawString();
          this.skipWs();
          if ( this.i >= this.n ) {
            this.fail("expected ':' in object");
            go = false;
          } else {
            if ( this.s.charCodeAt(this.i ) != 58 ) {
              this.fail("expected ':' in object");
              go = false;
            } else {
              this.i = this.i + 1;
              const val = this.parseValue();
              v.setMember(key, val);
              this.skipWs();
              if ( this.i >= this.n ) {
                this.fail("unterminated object");
                go = false;
              } else {
                const c = this.s.charCodeAt(this.i );
                if ( c == 44 ) {
                  this.i = this.i + 1;
                } else {
                  if ( c == 125 ) {
                    this.i = this.i + 1;
                    go = false;
                  } else {
                    this.fail("expected ',' or '}' in object");
                    go = false;
                  }
                }
              }
            }
          }
        }
      }
      if ( this.ok == false ) {
        go = false;
      }
    };
    return v;
  };
}
class VlJsonWriter  {
  constructor() {
    this.decimals = 6;
  }
  write (v) {
    return this.writeValue(v, 0, false);
  };
  writePretty (v) {
    return this.writeValue(v, 0, true);
  };
  indent (depth) {
    let out = "";
    let k = 0;
    while (k < depth) {
      out = out + "  ";
      k = k + 1;
    };
    return out;
  };
  writeValue (v, depth, pretty) {
    if ( v.kind == 0 ) {
      return "null";
    }
    if ( v.kind == 1 ) {
      if ( v.b ) {
        return "true";
      }
      return "false";
    }
    if ( v.kind == 2 ) {
      return VlJson.formatNumber(v.num, this.decimals);
    }
    if ( v.kind == 3 ) {
      return this.quote(v.str);
    }
    if ( v.kind == 4 ) {
      return this.writeArray(v, depth, pretty);
    }
    return this.writeObject(v, depth, pretty);
  };
  writeArray (v, depth, pretty) {
    const total = v.arr.length;
    if ( total == 0 ) {
      return "[]";
    }
    let out = "[";
    let k = 0;
    while (k < total) {
      if ( k > 0 ) {
        out = out + ",";
      }
      if ( pretty ) {
        out = (out + String.fromCharCode(10)) + this.indent((depth + 1));
      }
      const item = v.arr[k];
      out = out + this.writeValue(item, (depth + 1), pretty);
      k = k + 1;
    };
    if ( pretty ) {
      out = ((out + String.fromCharCode(10)) + this.indent(depth)) + "]";
    } else {
      out = out + "]";
    }
    return out;
  };
  writeObject (v, depth, pretty) {
    const total = v.keys.length;
    if ( total == 0 ) {
      return "{}";
    }
    let out = "{";
    let k = 0;
    while (k < total) {
      const key = v.keys[k];
      if ( k > 0 ) {
        out = out + ",";
      }
      if ( pretty ) {
        out = (out + String.fromCharCode(10)) + this.indent((depth + 1));
      }
      out = (out + this.quote(key)) + ":";
      if ( pretty ) {
        out = out + " ";
      }
      const item = v.get(key);
      out = out + this.writeValue(item, (depth + 1), pretty);
      k = k + 1;
    };
    if ( pretty ) {
      out = ((out + String.fromCharCode(10)) + this.indent(depth)) + "}";
    } else {
      out = out + "}";
    }
    return out;
  };
  quote (s) {
    const q = String.fromCharCode(34);
    const bs = String.fromCharCode(92);
    const total = s.length;
    let out = q;
    let start = 0;
    let k = 0;
    while (k < total) {
      const c = s.charCodeAt(k );
      if ( (c == 34 || c == 92) || ((c == 10 || c == 13) || c == 9) ) {
        if ( k > start ) {
          out = out + s.substring(start, k );
        }
        if ( c == 34 ) {
          out = (out + bs) + q;
        }
        if ( c == 92 ) {
          out = (out + bs) + bs;
        }
        if ( c == 10 ) {
          out = (out + bs) + "n";
        }
        if ( c == 13 ) {
          out = (out + bs) + "r";
        }
        if ( c == 9 ) {
          out = (out + bs) + "t";
        }
        start = k + 1;
      }
      k = k + 1;
    };
    if ( total > start ) {
      out = out + s.substring(start, total );
    }
    return out + q;
  };
}
class StatechartJson  {
  constructor() {
  }
}
StatechartJson.assignOf = function(key, spec) {
  if ( spec.has("event") ) {
    if ( spec.has("default") ) {
      const fallback = spec.get("default");
      if ( fallback.has("context") ) {
        return ScAssign.of(
          key,
          "valueOrContext",
          fallback.stringOr("context", "")
        );
      }
      return ScAssign.of(key, "value", "");
    }
    return ScAssign.of(key, "value", "");
  }
  if ( spec.has("context") ) {
    return ScAssign.of(key, "context", spec.stringOr("context", ""));
  }
  return ScAssign.of(key, "literal", spec.stringOr("value", ""));
};
StatechartJson.readActions = function(t, actions) {
  const count = actions.count();
  let i = 0;
  while (i < count) {
    const action = actions.at(i);
    if ( action.has("assign") ) {
      const assigns = action.get("assign");
      for ( let k = 0; k < assigns.keys.length; k++) {
        var key = assigns.keys[k];
        t.assigns.push(StatechartJson.assignOf(key, assigns.get(key)));
      };
    }
    i = i + 1;
  };
};
StatechartJson.load = function(text) {
  const parser = new VlJsonParser();
  const root = parser.parse(text);
  const chart = new Statechart();
  chart.id = root.stringOr("id", "");
  chart.initial = root.stringOr("initial", "");
  if ( root.has("context") ) {
    const context = root.get("context");
    for ( let i = 0; i < context.keys.length; i++) {
      var key = context.keys[i];
      chart.context(key, context.stringOr(key, ""));
    };
  }
  if ( root.has("states") == false ) {
    return chart;
  }
  const states = root.get("states");
  for ( let s = 0; s < states.keys.length; s++) {
    var name = states.keys[s];
    const node = states.get(name);
    const state = chart.state(name);
    if ( node.has("on") ) {
      const on = node.get("on");
      for ( let e = 0; e < on.keys.length; e++) {
        var event = on.keys[e];
        const spec = on.get(event);
        if ( spec.isString() ) {
          state.on(event, spec.asString());
        } else {
          const t = state.on(event, spec.stringOr("target", ""));
          if ( spec.has("actions") ) {
            StatechartJson.readActions(t, spec.get("actions"));
          }
        }
      };
    }
  };
  return chart;
};
module.exports.ScAssign = ScAssign;
module.exports.ScTransition = ScTransition;
module.exports.ScState = ScState;
module.exports.Statechart = Statechart;
module.exports.ScRunner = ScRunner;
module.exports.VlJson = VlJson;
module.exports.VlJsonParser = VlJsonParser;
module.exports.VlJsonWriter = VlJsonWriter;
module.exports.StatechartJson = StatechartJson;
