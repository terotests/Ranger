#!/usr/bin/env node
class EVGA11yRole  {
  constructor() {
  }
}
EVGA11yRole.none = function() {
  return 0;
};
EVGA11yRole.group = function() {
  return 1;
};
EVGA11yRole.text = function() {
  return 2;
};
EVGA11yRole.heading = function() {
  return 3;
};
EVGA11yRole.button = function() {
  return 4;
};
EVGA11yRole.checkbox = function() {
  return 5;
};
EVGA11yRole.radio = function() {
  return 6;
};
EVGA11yRole.textField = function() {
  return 7;
};
EVGA11yRole.image = function() {
  return 8;
};
EVGA11yRole.link = function() {
  return 9;
};
EVGA11yRole.grid = function() {
  return 10;
};
EVGA11yRole.row = function() {
  return 11;
};
EVGA11yRole.columnHeader = function() {
  return 12;
};
EVGA11yRole.rowHeader = function() {
  return 13;
};
EVGA11yRole.cell = function() {
  return 14;
};
EVGA11yRole.tabList = function() {
  return 15;
};
EVGA11yRole.tab = function() {
  return 16;
};
EVGA11yRole.toolbar = function() {
  return 17;
};
EVGA11yRole.menuItem = function() {
  return 18;
};
EVGA11yRole.dialog = function() {
  return 19;
};
EVGA11yRole.status = function() {
  return 20;
};
EVGA11yRole.separator = function() {
  return 21;
};
EVGA11yRole.list = function() {
  return 22;
};
EVGA11yRole.listItem = function() {
  return 23;
};
EVGA11yRole.ariaName = function(role) {
  if ( role == 1 ) {
    return "group";
  }
  if ( role == 2 ) {
    return "text";
  }
  if ( role == 3 ) {
    return "heading";
  }
  if ( role == 4 ) {
    return "button";
  }
  if ( role == 5 ) {
    return "checkbox";
  }
  if ( role == 6 ) {
    return "radio";
  }
  if ( role == 7 ) {
    return "textbox";
  }
  if ( role == 8 ) {
    return "img";
  }
  if ( role == 9 ) {
    return "link";
  }
  if ( role == 10 ) {
    return "grid";
  }
  if ( role == 11 ) {
    return "row";
  }
  if ( role == 12 ) {
    return "columnheader";
  }
  if ( role == 13 ) {
    return "rowheader";
  }
  if ( role == 14 ) {
    return "gridcell";
  }
  if ( role == 15 ) {
    return "tablist";
  }
  if ( role == 16 ) {
    return "tab";
  }
  if ( role == 17 ) {
    return "toolbar";
  }
  if ( role == 18 ) {
    return "menuitem";
  }
  if ( role == 19 ) {
    return "dialog";
  }
  if ( role == 20 ) {
    return "status";
  }
  if ( role == 21 ) {
    return "separator";
  }
  if ( role == 22 ) {
    return "list";
  }
  if ( role == 23 ) {
    return "listitem";
  }
  return "none";
};
class EVGA11yTri  {
  constructor() {
  }
}
EVGA11yTri.notApplicable = function() {
  return 0;
};
EVGA11yTri.no = function() {
  return 1;
};
EVGA11yTri.yes = function() {
  return 2;
};
EVGA11yTri.mixed = function() {
  return 3;
};
class EVGA11yLive  {
  constructor() {
  }
}
EVGA11yLive.off = function() {
  return 0;
};
EVGA11yLive.polite = function() {
  return 1;
};
EVGA11yLive.assertive = function() {
  return 2;
};
class EVGA11yNode  {
  constructor() {
    this.id = "";
    this.parentId = "";
    this.role = 0;
    this.name = "";
    this.description = "";
    this.value = "";
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.focusable = false;
    this.focused = false;
    this.disabled = false;
    this.selected = false;
    this.readOnly = false;
    this.modal = false;
    this.checked = 0;
    this.expanded = 0;
    this.rowIndex = 0;
    this.colIndex = 0;
    this.rowCount = 0;
    this.colCount = 0;
    this.posInSet = 0;
    this.setSize = 0;
    this.caret = 0;
    this.selStart = 0;
    this.selEnd = 0;
    this.actActivate = false;
    this.actSetValue = false;
    this.actExpand = false;
    this.actScrollTo = false;
    this.live = 0;
  }
}
class EVGA11yTree  {
  constructor() {
    this.nodes = [];
    this.rootId = "";
    this.focusId = "";
    this.generation = 0;
  }
  count () {
    return this.nodes.length;
  };
  at (i) {
    if ( i < 0 ) {
      return new EVGA11yNode();
    }
    if ( i >= (this.nodes.length) ) {
      return new EVGA11yNode();
    }
    return this.nodes[i];
  };
  node (id, parentId, role) {
    const n = new EVGA11yNode();
    n.id = id;
    n.parentId = parentId;
    n.role = role;
    this.nodes.push(n);
    if ( (this.rootId.length) == 0 ) {
      if ( (parentId.length) == 0 ) {
        this.rootId = id;
      }
    }
    return n;
  };
  group (id, parentId, name) {
    const n = this.node(id, parentId, EVGA11yRole.group());
    n.name = name;
    return n;
  };
  label (id, parentId, text) {
    const n = this.node(id, parentId, EVGA11yRole.text());
    n.name = text;
    return n;
  };
  button (id, parentId, name) {
    const n = this.node(id, parentId, EVGA11yRole.button());
    n.name = name;
    n.focusable = true;
    n.actActivate = true;
    return n;
  };
  field (id, parentId, name, value) {
    const n = this.node(id, parentId, EVGA11yRole.textField());
    n.name = name;
    n.value = value;
    n.focusable = true;
    n.actSetValue = true;
    return n;
  };
  statusRegion (id, parentId, text) {
    const n = this.node(id, parentId, EVGA11yRole.status());
    n.value = text;
    n.live = EVGA11yLive.polite();
    return n;
  };
  place (n, nx, ny, nw, nh) {
    n.x = nx;
    n.y = ny;
    n.w = nw;
    n.h = nh;
  };
  find (id) {
    let i = 0;
    while (i < (this.nodes.length)) {
      const n = this.nodes[i];
      if ( n.id == id ) {
        return n;
      }
      i = i + 1;
    };
    return new EVGA11yNode();
  };
  has (id) {
    const n = (this).find(id);
    return (n.id.length) > 0;
  };
  setFocus (id) {
    this.focusId = id;
    let i = 0;
    while (i < (this.nodes.length)) {
      const n = this.nodes[i];
      n.focused = n.id == id;
      i = i + 1;
    };
  };
  toJson () {
    let out = "{\"root\":";
    out = out + EVGA11yTree.jsonString(this.rootId);
    out = (out + ",\"focus\":") + EVGA11yTree.jsonString(this.focusId);
    out = (out + ",\"gen\":") + ((this.generation.toString()));
    out = out + ",\"nodes\":[";
    let i = 0;
    while (i < (this.nodes.length)) {
      const n = this.nodes[i];
      if ( i > 0 ) {
        out = out + ",";
      }
      out = out + this.nodeJson(n);
      i = i + 1;
    };
    return out + "]}";
  };
  nodeJson (n) {
    let out = "{\"id\":";
    out = out + EVGA11yTree.jsonString(n.id);
    if ( (n.parentId.length) > 0 ) {
      out = (out + ",\"p\":") + EVGA11yTree.jsonString(n.parentId);
    }
    out = (out + ",\"role\":") + EVGA11yTree.jsonString(EVGA11yRole.ariaName(n.role));
    if ( (n.name.length) > 0 ) {
      out = (out + ",\"name\":") + EVGA11yTree.jsonString(n.name);
    }
    if ( (n.value.length) > 0 ) {
      out = (out + ",\"value\":") + EVGA11yTree.jsonString(n.value);
    }
    if ( (n.description.length) > 0 ) {
      out = (out + ",\"desc\":") + EVGA11yTree.jsonString(n.description);
    }
    out = (((out + ",\"b\":[") + ((n.x.toString()))) + ",") + ((n.y.toString()));
    out = ((((out + ",") + ((n.w.toString()))) + ",") + ((n.h.toString()))) + "]";
    if ( n.focusable ) {
      out = out + ",\"focusable\":true";
    }
    if ( n.focused ) {
      out = out + ",\"focused\":true";
    }
    if ( n.disabled ) {
      out = out + ",\"disabled\":true";
    }
    if ( n.selected ) {
      out = out + ",\"selected\":true";
    }
    if ( n.readOnly ) {
      out = out + ",\"readonly\":true";
    }
    if ( n.modal ) {
      out = out + ",\"modal\":true";
    }
    if ( n.checked != 0 ) {
      out = (out + ",\"checked\":") + ((n.checked.toString()));
    }
    if ( n.expanded != 0 ) {
      out = (out + ",\"expanded\":") + ((n.expanded.toString()));
    }
    if ( n.rowIndex != 0 ) {
      out = (out + ",\"row\":") + ((n.rowIndex.toString()));
    }
    if ( n.colIndex != 0 ) {
      out = (out + ",\"col\":") + ((n.colIndex.toString()));
    }
    if ( n.rowCount != 0 ) {
      out = (out + ",\"rows\":") + ((n.rowCount.toString()));
    }
    if ( n.colCount != 0 ) {
      out = (out + ",\"cols\":") + ((n.colCount.toString()));
    }
    if ( n.posInSet != 0 ) {
      out = (out + ",\"pos\":") + ((n.posInSet.toString()));
    }
    if ( n.setSize != 0 ) {
      out = (out + ",\"size\":") + ((n.setSize.toString()));
    }
    if ( n.caret != 0 ) {
      out = (out + ",\"caret\":") + ((n.caret.toString()));
    }
    if ( n.selStart != n.selEnd ) {
      out = ((((out + ",\"sel\":[") + ((n.selStart.toString()))) + ",") + ((n.selEnd.toString()))) + "]";
    }
    if ( n.actActivate ) {
      out = out + ",\"activate\":true";
    }
    if ( n.actSetValue ) {
      out = out + ",\"setValue\":true";
    }
    if ( n.actExpand ) {
      out = out + ",\"expandable\":true";
    }
    if ( n.actScrollTo ) {
      out = out + ",\"scrollTo\":true";
    }
    if ( n.live != 0 ) {
      out = (out + ",\"live\":") + ((n.live.toString()));
    }
    return out + "}";
  };
  dump () {
    return this.dumpFrom(this.rootId, 0);
  };
  dumpFrom (id, depth) {
    const n = (this).find(id);
    if ( (n.id.length) == 0 ) {
      return "";
    }
    let out = EVGA11yTree.indent(depth);
    out = out + EVGA11yRole.ariaName(n.role);
    out = (out + " #") + n.id;
    if ( (n.name.length) > 0 ) {
      out = ((out + " \"") + n.name) + "\"";
    }
    if ( (n.value.length) > 0 ) {
      out = (out + " =") + n.value;
    }
    const st = this.stateText(n);
    if ( (st.length) > 0 ) {
      out = ((out + " [") + st) + "]";
    }
    out = (((out + " (") + ((n.x.toString()))) + ",") + ((n.y.toString()));
    out = ((((out + " ") + ((n.w.toString()))) + "x") + ((n.h.toString()))) + ")\n";
    let i = 0;
    while (i < (this.nodes.length)) {
      const c = this.nodes[i];
      if ( c.parentId == id ) {
        const nd = depth + 1;
        out = out + this.dumpFrom(c.id, nd);
      }
      i = i + 1;
    };
    return out;
  };
  stateText (n) {
    let out = "";
    if ( n.focused ) {
      out = EVGA11yTree.addWord(out, "focused");
    }
    if ( n.focusable ) {
      if ( n.focused == false ) {
        out = EVGA11yTree.addWord(out, "focusable");
      }
    }
    if ( n.disabled ) {
      out = EVGA11yTree.addWord(out, "disabled");
    }
    if ( n.selected ) {
      out = EVGA11yTree.addWord(out, "selected");
    }
    if ( n.readOnly ) {
      out = EVGA11yTree.addWord(out, "readonly");
    }
    if ( n.modal ) {
      out = EVGA11yTree.addWord(out, "modal");
    }
    if ( n.checked == 2 ) {
      out = EVGA11yTree.addWord(out, "checked");
    }
    if ( n.checked == 3 ) {
      out = EVGA11yTree.addWord(out, "mixed");
    }
    if ( n.live == 1 ) {
      out = EVGA11yTree.addWord(out, "live");
    }
    if ( n.live == 2 ) {
      out = EVGA11yTree.addWord(out, "live!");
    }
    if ( n.rowIndex > 0 ) {
      out = EVGA11yTree.addWord(out, ("r" + ((n.rowIndex.toString()))));
    }
    if ( n.colIndex > 0 ) {
      out = EVGA11yTree.addWord(out, ("c" + ((n.colIndex.toString()))));
    }
    if ( n.rowCount > 0 ) {
      out = EVGA11yTree.addWord(out, (("of " + ((n.rowCount.toString()))) + " rows"));
    }
    return out;
  };
  lint () {
    let problems = [];
    if ( (this.rootId.length) == 0 ) {
      problems.push("tree has no root");
    }
    let i = 0;
    while (i < (this.nodes.length)) {
      const n = this.nodes[i];
      let dup = 0;
      let j = 0;
      while (j < (this.nodes.length)) {
        const m = this.nodes[j];
        if ( m.id == n.id ) {
          dup = dup + 1;
        }
        j = j + 1;
      };
      if ( dup > 1 ) {
        if ( i == 0 ) {
          problems.push("duplicate id: " + n.id);
        } else {
          let prevSeen = false;
          let k = 0;
          while (k < i) {
            const p = this.nodes[k];
            if ( p.id == n.id ) {
              prevSeen = true;
            }
            k = k + 1;
          };
          if ( prevSeen == false ) {
            problems.push("duplicate id: " + n.id);
          }
        }
      }
      if ( (n.id.length) == 0 ) {
        problems.push("node with an empty id");
      }
      if ( (n.parentId.length) > 0 ) {
        if ( (this).has(n.parentId) == false ) {
          problems.push(((n.id + ": parent ") + n.parentId) + " is not in the tree");
        }
      } else {
        if ( n.id != this.rootId ) {
          problems.push(n.id + ": no parent, and it is not the root");
        }
      }
      if ( n.focusable ) {
        const named = (n.name.length) > 0;
        if ( named == false ) {
          problems.push(n.id + ": focusable with no accessible name");
        }
        if ( n.w <= 0 ) {
          problems.push(n.id + ": focusable with no width");
        }
        if ( n.h <= 0 ) {
          problems.push(n.id + ": focusable with no height");
        }
      }
      if ( n.role == 0 ) {
        if ( (n.name.length) > 0 ) {
          problems.push(n.id + ": named, but the role is decoration");
        }
      }
      i = i + 1;
    };
    if ( (this.focusId.length) > 0 ) {
      if ( (this).has(this.focusId) == false ) {
        problems.push(("focus points at " + this.focusId) + ", which is not in the tree");
      }
    }
    return problems;
  };
}
EVGA11yTree.addWord = function(acc, word) {
  if ( (acc.length) == 0 ) {
    return word;
  }
  return (acc + " ") + word;
};
EVGA11yTree.indent = function(depth) {
  let out = "";
  let i = 0;
  while (i < depth) {
    out = out + "  ";
    i = i + 1;
  };
  return out;
};
EVGA11yTree.jsonString = function(v) {
  let out = "\"";
  let i = 0;
  while (i < (v.length)) {
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
                out = out + (String.fromCharCode(ch));
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
    (function(b,v,s,e){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(this.pixels,0,0,size);
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
    (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(copy.pixels,0,this.pixels,0,size);
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
class RgbaFastBlit  {
  constructor() {
  }
  clamp255 (n) {
    if ( n < 0 ) {
      return 0;
    }
    if ( n > 255 ) {
      return 255;
    }
    return n;
  };
  div256 (n) {
    return (n >> 8);
  };
  blendChan (src, dst, srcA, invA) {
    const mix = (src * srcA) + (dst * invA);
    const scaled = this.div256(mix);
    return this.clamp255(scaled);
  };
  blendOverBytes (dstBuf, dstOff, srcR, srcG, srcB, srcA) {
    if ( srcA <= 0 ) {
      return;
    }
    if ( srcA >= 255 ) {
      dstBuf._view.setUint8(dstOff, srcR);
      dstBuf._view.setUint8(dstOff + 1, srcG);
      dstBuf._view.setUint8(dstOff + 2, srcB);
      dstBuf._view.setUint8(dstOff + 3, 255);
      return;
    }
    const dstA = dstBuf._view.getUint8((dstOff + 3));
    if ( dstA <= 0 ) {
      dstBuf._view.setUint8(dstOff, srcR);
      dstBuf._view.setUint8(dstOff + 1, srcG);
      dstBuf._view.setUint8(dstOff + 2, srcB);
      dstBuf._view.setUint8(dstOff + 3, srcA);
      return;
    }
    const invA = 255 - srcA;
    const dstR = dstBuf._view.getUint8(dstOff);
    const dstG = dstBuf._view.getUint8((dstOff + 1));
    const dstB = dstBuf._view.getUint8((dstOff + 2));
    const outR = this.blendChan(srcR, dstR, srcA, invA);
    const outG = this.blendChan(srcG, dstG, srcA, invA);
    const outB = this.blendChan(srcB, dstB, srcA, invA);
    const alphaMix = ((((dstA * invA) + 127) / 255) | 0);
    const outA = this.clamp255((srcA + alphaMix));
    dstBuf._view.setUint8(dstOff, outR);
    dstBuf._view.setUint8(dstOff + 1, outG);
    dstBuf._view.setUint8(dstOff + 2, outB);
    dstBuf._view.setUint8(dstOff + 3, outA);
  };
  copyOpaquePixel (dstBuf, dstOff, srcBuf, srcOff) {
    dstBuf._view.setUint8(dstOff, srcBuf._view.getUint8(srcOff));
    dstBuf._view.setUint8(dstOff + 1, srcBuf._view.getUint8((srcOff + 1)));
    dstBuf._view.setUint8(dstOff + 2, srcBuf._view.getUint8((srcOff + 2)));
    dstBuf._view.setUint8(dstOff + 3, 255);
  };
  copyOpaquePixelRaster (dest, dstOff, srcBuf, srcOff) {
    dest.pixels._view.setUint8(dstOff, srcBuf._view.getUint8(srcOff));
    dest.pixels._view.setUint8(dstOff + 1, srcBuf._view.getUint8((srcOff + 1)));
    dest.pixels._view.setUint8(dstOff + 2, srcBuf._view.getUint8((srcOff + 2)));
    dest.pixels._view.setUint8(dstOff + 3, 255);
  };
  blendOverBytesRaster (dest, dstOff, srcR, srcG, srcB, srcA) {
    if ( srcA <= 0 ) {
      return;
    }
    if ( srcA >= 255 ) {
      dest.pixels._view.setUint8(dstOff, srcR);
      dest.pixels._view.setUint8(dstOff + 1, srcG);
      dest.pixels._view.setUint8(dstOff + 2, srcB);
      dest.pixels._view.setUint8(dstOff + 3, 255);
      return;
    }
    const dstA = dest.pixels._view.getUint8((dstOff + 3));
    if ( dstA <= 0 ) {
      dest.pixels._view.setUint8(dstOff, srcR);
      dest.pixels._view.setUint8(dstOff + 1, srcG);
      dest.pixels._view.setUint8(dstOff + 2, srcB);
      dest.pixels._view.setUint8(dstOff + 3, srcA);
      return;
    }
    const invA = 255 - srcA;
    const dstR = dest.pixels._view.getUint8(dstOff);
    const dstG = dest.pixels._view.getUint8((dstOff + 1));
    const dstB = dest.pixels._view.getUint8((dstOff + 2));
    const outR = this.blendChan(srcR, dstR, srcA, invA);
    const outG = this.blendChan(srcG, dstG, srcA, invA);
    const outB = this.blendChan(srcB, dstB, srcA, invA);
    const alphaMix = ((((dstA * invA) + 127) / 255) | 0);
    const outA = this.clamp255((srcA + alphaMix));
    dest.pixels._view.setUint8(dstOff, outR);
    dest.pixels._view.setUint8(dstOff + 1, outG);
    dest.pixels._view.setUint8(dstOff + 2, outB);
    dest.pixels._view.setUint8(dstOff + 3, outA);
  };
  blitFirstLayer (dest, src, dx, dy) {
    const srcBuf = src.getRawBuffer();
    const destW = dest.width;
    const srcW = src.width;
    const sh = src.height;
    const sw = src.width;
    let y = 0;
    while (y < sh) {
      const srcRowOff = (y * srcW) * 4;
      const dstRowOff = (((dy + y) * destW) + dx) * 4;
      let x = 0;
      while (x < sw) {
        const sOff = srcRowOff + (x * 4);
        const srcA = srcBuf._view.getUint8((sOff + 3));
        if ( srcA > 0 ) {
          const dOff = dstRowOff + (x * 4);
          if ( srcA >= 255 ) {
            this.copyOpaquePixelRaster(dest, dOff, srcBuf, sOff);
          } else {
            dest.pixels._view.setUint8(dOff, srcBuf._view.getUint8(sOff));
            dest.pixels._view.setUint8(dOff + 1, srcBuf._view.getUint8((sOff + 1)));
            dest.pixels._view.setUint8(dOff + 2, srcBuf._view.getUint8((sOff + 2)));
            dest.pixels._view.setUint8(dOff + 3, srcA);
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  blitRect (dest, src, sx, sy, sw, sh, dx, dy) {
    const srcBuf = src.getRawBuffer();
    const destW = dest.width;
    const srcW = src.width;
    let y = 0;
    while (y < sh) {
      const srcRowOff = (((sy + y) * srcW) + sx) * 4;
      const dstRowOff = (((dy + y) * destW) + dx) * 4;
      let x = 0;
      while (x < sw) {
        const sOff = srcRowOff + (x * 4);
        const srcA = srcBuf._view.getUint8((sOff + 3));
        if ( srcA > 0 ) {
          const dOff = dstRowOff + (x * 4);
          if ( srcA >= 255 ) {
            this.copyOpaquePixelRaster(dest, dOff, srcBuf, sOff);
            x = x + 1;
          } else {
            this.blendOverBytesRaster(dest, dOff, srcBuf._view.getUint8(sOff), srcBuf._view.getUint8((sOff + 1)), srcBuf._view.getUint8((sOff + 2)), srcA);
            x = x + 1;
          }
        } else {
          x = x + 1;
        }
      };
      y = y + 1;
    };
  };
  blitImage (dest, src, dx, dy) {
    this.blitRect(dest, src, 0, 0, src.width, src.height, dx, dy);
  };
  blitRectBuf (dstBuf, destW, src, sx, sy, sw, sh, dx, dy) {
    const srcBuf = src.getRawBuffer();
    const srcW = src.width;
    let y = 0;
    while (y < sh) {
      const srcRowOff = (((sy + y) * srcW) + sx) * 4;
      const dstRowOff = (((dy + y) * destW) + dx) * 4;
      let x = 0;
      while (x < sw) {
        const sOff = srcRowOff + (x * 4);
        const srcA = srcBuf._view.getUint8((sOff + 3));
        if ( srcA > 0 ) {
          const dOff = dstRowOff + (x * 4);
          if ( srcA >= 255 ) {
            dstBuf._view.setUint8(dOff, srcBuf._view.getUint8(sOff));
            dstBuf._view.setUint8(dOff + 1, srcBuf._view.getUint8((sOff + 1)));
            dstBuf._view.setUint8(dOff + 2, srcBuf._view.getUint8((sOff + 2)));
            dstBuf._view.setUint8(dOff + 3, 255);
          } else {
            this.blendOverBytes(dstBuf, dOff, srcBuf._view.getUint8(sOff), srcBuf._view.getUint8((sOff + 1)), srcBuf._view.getUint8((sOff + 2)), srcA);
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
}
class SoftCanvas  {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.px = (function(){ var b = new ArrayBuffer(4); b._view = new DataView(b); return b; })();
    this.blitter = new RgbaFastBlit();
  }
  init (width, height) {
    this.w = width;
    this.h = height;
    const total = (this.w * this.h) * 4;
    this.px = (function(){ var b = new ArrayBuffer(total); b._view = new DataView(b); return b; })();
  };
  getWidth () {
    return this.w;
  };
  getHeight () {
    return this.h;
  };
  raw () {
    return this.px;
  };
  copyPixelsToImage (dst) {
    const __len = (this.w * this.h) * 4;
    (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(dst.pixels,0,this.px,0,__len);
  };
  fillSpanRGB (off, count, r, g, b) {
    if ( count <= 0 ) {
      return;
    }
    if ( count <= 32 ) {
      let o = off;
      let i = 0;
      while (i < count) {
        this.px._view.setUint8(o, r);
        this.px._view.setUint8(o + 1, g);
        this.px._view.setUint8(o + 2, b);
        this.px._view.setUint8(o + 3, 255);
        o = o + 4;
        i = i + 1;
      };
      return;
    }
    this.px._view.setUint8(off, r);
    this.px._view.setUint8(off + 1, g);
    this.px._view.setUint8(off + 2, b);
    this.px._view.setUint8(off + 3, 255);
    let filled = 1;
    while (filled < count) {
      let copyCount = filled;
      const remaining = count - filled;
      if ( copyCount > remaining ) {
        copyCount = remaining;
      }
      (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.px,off + (filled * 4),this.px,off,copyCount * 4);
      filled = filled + copyCount;
    };
  };
  clear (r, g, b) {
    this.fillSpanRGB(0, this.w * this.h, r, g, b);
  };
  setPixel (x, y, r, g, b) {
    if ( x < 0 ) {
      return;
    }
    if ( x >= this.w ) {
      return;
    }
    if ( y < 0 ) {
      return;
    }
    if ( y >= this.h ) {
      return;
    }
    const o = ((y * this.w) + x) * 4;
    this.px._view.setUint8(o, r);
    this.px._view.setUint8(o + 1, g);
    this.px._view.setUint8(o + 2, b);
    this.px._view.setUint8(o + 3, 255);
  };
  fillRect (x, y, rw, rh, r, g, b) {
    if ( rw <= 0 ) {
      return;
    }
    if ( rh <= 0 ) {
      return;
    }
    let x0 = x;
    let y0 = y;
    let x1 = x + rw;
    let y1 = y + rh;
    if ( x0 < 0 ) {
      x0 = 0;
    }
    if ( y0 < 0 ) {
      y0 = 0;
    }
    if ( x1 > this.w ) {
      x1 = this.w;
    }
    if ( y1 > this.h ) {
      y1 = this.h;
    }
    if ( x0 >= x1 ) {
      return;
    }
    if ( y0 >= y1 ) {
      return;
    }
    const spanPixels = x1 - x0;
    if ( x0 == 0 ) {
      if ( x1 == this.w ) {
        const base = (y0 * this.w) * 4;
        this.fillSpanRGB(base, spanPixels * (y1 - y0), r, g, b);
        return;
      }
    }
    if ( spanPixels < 32 ) {
      let yy = y0;
      while (yy < y1) {
        let o = ((yy * this.w) + x0) * 4;
        let xx = x0;
        while (xx < x1) {
          this.px._view.setUint8(o, r);
          this.px._view.setUint8(o + 1, g);
          this.px._view.setUint8(o + 2, b);
          this.px._view.setUint8(o + 3, 255);
          o = o + 4;
          xx = xx + 1;
        };
        yy = yy + 1;
      };
      return;
    }
    const firstRowOff = ((y0 * this.w) + x0) * 4;
    this.fillSpanRGB(firstRowOff, spanPixels, r, g, b);
    const spanBytes = spanPixels * 4;
    let yy2 = y0 + 1;
    while (yy2 < y1) {
      const rowOff = ((yy2 * this.w) + x0) * 4;
      (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.px,rowOff,this.px,firstRowOff,spanBytes);
      yy2 = yy2 + 1;
    };
  };
  fillTrapezoid (y0, x0L, x0R, y1, x1L, x1R, r, g, b) {
    let ty0 = y0;
    let ty1 = y1;
    let aL = x0L;
    let aR = x0R;
    let bL = x1L;
    let bR = x1R;
    if ( ty0 > ty1 ) {
      ty0 = y1;
      ty1 = y0;
      aL = x1L;
      aR = x1R;
      bL = x0L;
      bR = x0R;
    }
    if ( aL > aR ) {
      const tmp = aL;
      aL = aR;
      aR = tmp;
    }
    if ( bL > bR ) {
      const tmp2 = bL;
      bL = bR;
      bR = tmp2;
    }
    const dy = ty1 - ty0;
    if ( dy < 0 ) {
      return;
    }
    if ( dy == 0 ) {
      let xL0 = aL;
      let xR0 = aR;
      if ( xL0 < 0 ) {
        xL0 = 0;
      }
      if ( xR0 > this.w ) {
        xR0 = this.w;
      }
      if ( xL0 < xR0 ) {
        if ( ty0 >= 0 ) {
          if ( ty0 < this.h ) {
            this.fillSpanRGB(((ty0 * this.w) + xL0) * 4, xR0 - xL0, r, g, b);
          }
        }
      }
      return;
    }
    let yy = ty0;
    while (yy <= ty1) {
      if ( yy >= 0 ) {
        if ( yy < this.h ) {
          const num = yy - ty0;
          let xL = aL + (((((bL - aL) * num) / dy) | 0));
          let xR = aR + (((((bR - aR) * num) / dy) | 0));
          if ( xL > xR ) {
            const sw = xL;
            xL = xR;
            xR = sw;
          }
          if ( xL < 0 ) {
            xL = 0;
          }
          if ( xR > this.w ) {
            xR = this.w;
          }
          if ( xL < xR ) {
            this.fillSpanRGB(((yy * this.w) + xL) * 4, xR - xL, r, g, b);
          }
        }
      }
      yy = yy + 1;
    };
  };
  blitImage (src, dx, dy) {
    if ( src.width <= 0 ) {
      return;
    }
    if ( src.height <= 0 ) {
      return;
    }
    let sx = 0;
    let sy = 0;
    let ddx = dx;
    let ddy = dy;
    if ( ddx < 0 ) {
      sx = 0 - ddx;
      ddx = 0;
    }
    if ( ddy < 0 ) {
      sy = 0 - ddy;
      ddy = 0;
    }
    let sw = src.width - sx;
    let sh = src.height - sy;
    if ( (ddx + sw) > this.w ) {
      sw = this.w - ddx;
    }
    if ( (ddy + sh) > this.h ) {
      sh = this.h - ddy;
    }
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    this.blitter.blitRectBuf(this.px, this.w, src, sx, sy, sw, sh, ddx, ddy);
  };
  blitImageRect (src, sx, sy, sw, sh, dx, dy) {
    if ( src.width <= 0 ) {
      return;
    }
    if ( src.height <= 0 ) {
      return;
    }
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    let ddx = dx;
    let ddy = dy;
    let ssx = sx;
    let ssy = sy;
    let ssw = sw;
    let ssh = sh;
    if ( ddx < 0 ) {
      ssx = ssx + (0 - ddx);
      ssw = ssw - (0 - ddx);
      ddx = 0;
    }
    if ( ddy < 0 ) {
      ssy = ssy + (0 - ddy);
      ssh = ssh - (0 - ddy);
      ddy = 0;
    }
    if ( (ddx + ssw) > this.w ) {
      ssw = this.w - ddx;
    }
    if ( (ddy + ssh) > this.h ) {
      ssh = this.h - ddy;
    }
    if ( ssw <= 0 ) {
      return;
    }
    if ( ssh <= 0 ) {
      return;
    }
    const view = new RasterBuffer();
    view.width = this.w;
    view.height = this.h;
    view.pixels = this.px;
    this.blitter.blitRect(view, src, ssx, ssy, ssw, ssh, ddx, ddy);
    this.px = view.pixels;
  };
  blitImageRectScaled (src, sx, sy, sw, sh, dx, dy, dw, dh) {
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    if ( dw <= 0 ) {
      return;
    }
    if ( dh <= 0 ) {
      return;
    }
    const srcW = src.width;
    let y = 0;
    while (y < dh) {
      const dstY = dy + y;
      if ( dstY < 0 ) {
        y = y + 1;
      } else {
        if ( dstY >= this.h ) {
          y = y + 1;
        } else {
          let syOff = sy + (Math.floor( (((y * sh)) / (dh))));
          if ( syOff >= src.height ) {
            syOff = src.height - 1;
          }
          let x = 0;
          while (x < dw) {
            const dstX = dx + x;
            if ( dstX < 0 ) {
              x = x + 1;
            } else {
              if ( dstX >= this.w ) {
                x = x + 1;
              } else {
                let sxOff = sx + (Math.floor( (((x * sw)) / (dw))));
                if ( sxOff >= srcW ) {
                  sxOff = srcW - 1;
                }
                const sOff = ((syOff * srcW) + sxOff) * 4;
                const srcA = src.pixels._view.getUint8((sOff + 3));
                if ( srcA > 0 ) {
                  const dOff = ((dstY * this.w) + dstX) * 4;
                  if ( srcA >= 255 ) {
                    this.px._view.setUint8(dOff, src.pixels._view.getUint8(sOff));
                    this.px._view.setUint8(dOff + 1, src.pixels._view.getUint8((sOff + 1)));
                    this.px._view.setUint8(dOff + 2, src.pixels._view.getUint8((sOff + 2)));
                    this.px._view.setUint8(dOff + 3, 255);
                  } else {
                    this.blitter.blendOverBytes(this.px, dOff, src.pixels._view.getUint8(sOff), src.pixels._view.getUint8((sOff + 1)), src.pixels._view.getUint8((sOff + 2)), srcA);
                  }
                }
                x = x + 1;
              }
            }
          };
          y = y + 1;
        }
      }
    };
  };
  degToRad (deg) {
    return deg * 0.017453292519943295;
  };
  fillRectRotated (pivotX, pivotY, rw, rh, angleDeg, r, g, b) {
    if ( rw <= 0 ) {
      return;
    }
    if ( rh <= 0 ) {
      return;
    }
    if ( angleDeg == 0.0 ) {
      const halfH = Math.floor( ((rh) * 0.5));
      this.fillRect(pivotX, pivotY - halfH, rw, rh, r, g, b);
      return;
    }
    const rad = this.degToRad(angleDeg);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const halfTh = (rh) * 0.5;
    let y = 0;
    while (y < rh) {
      const ly = (y) - halfTh;
      let x = 0;
      while (x < rw) {
        const lx = x;
        const wx = (lx * cosA) - (ly * sinA);
        const wy = (lx * sinA) + (ly * cosA);
        const dstX = pivotX + (Math.floor( wx));
        const dstY = pivotY + (Math.floor( wy));
        if ( dstX >= 0 ) {
          if ( dstX < this.w ) {
            if ( dstY >= 0 ) {
              if ( dstY < this.h ) {
                this.setPixel(dstX, dstY, r, g, b);
              }
            }
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  fillRectRotatedC (cx, cy, rw, rh, angleDeg, r, g, b) {
    if ( rw <= 0 ) {
      return;
    }
    if ( rh <= 0 ) {
      return;
    }
    if ( angleDeg == 0.0 ) {
      const hx = Math.floor( ((rw) * 0.5));
      const hy = Math.floor( ((rh) * 0.5));
      this.fillRect(cx - hx, cy - hy, rw, rh, r, g, b);
      return;
    }
    const rad = this.degToRad(angleDeg);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const hw = (rw) * 0.5;
    const hh = (rh) * 0.5;
    let y = 0;
    while (y < rh) {
      const ly = (y) - hh;
      let x = 0;
      while (x < rw) {
        const lx = (x) - hw;
        const wx = (lx * cosA) - (ly * sinA);
        const wy = (lx * sinA) + (ly * cosA);
        const dstX = cx + (Math.floor( wx));
        const dstY = cy + (Math.floor( wy));
        if ( dstX >= 0 ) {
          if ( dstX < this.w ) {
            if ( dstY >= 0 ) {
              if ( dstY < this.h ) {
                this.setPixel(dstX, dstY, r, g, b);
              }
            }
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawBlockRotated (cx, cy, size, angleDeg, r, g, b) {
    if ( size <= 0 ) {
      return;
    }
    const dr = (((r * 42) / 100) | 0);
    const dg = (((g * 42) / 100) | 0);
    const db = (((b * 42) / 100) | 0);
    this.fillRectRotatedC(cx, cy, size, size, angleDeg, dr, dg, db);
    let face = size - 3;
    if ( face < 1 ) {
      face = 1;
    }
    this.fillRectRotatedC(cx, cy, face, face, angleDeg, r, g, b);
    let studSize = ((size / 3) | 0);
    if ( studSize < 2 ) {
      studSize = 2;
    }
    const off = (size) * 0.26;
    const rad = this.degToRad(angleDeg);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const lx = 0.0 - off;
    const ly = 0.0 - off;
    const wx = (lx * cosA) - (ly * sinA);
    const wy = (lx * sinA) + (ly * cosA);
    const sx = cx + (Math.floor( wx));
    const sy = cy + (Math.floor( wy));
    let hr = r + 60;
    let hg = g + 60;
    let hb = b + 60;
    if ( hr > 255 ) {
      hr = 255;
    }
    if ( hg > 255 ) {
      hg = 255;
    }
    if ( hb > 255 ) {
      hb = 255;
    }
    this.fillRectRotatedC(sx, sy, studSize, studSize, angleDeg, hr, hg, hb);
  };
  blitImageRectScaledFlipped (src, sx, sy, sw, sh, dx, dy, dw, dh, flipH, flipV) {
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    if ( dw <= 0 ) {
      return;
    }
    if ( dh <= 0 ) {
      return;
    }
    if ( flipH == false ) {
      if ( flipV == false ) {
        this.blitImageRectScaled(src, sx, sy, sw, sh, dx, dy, dw, dh);
        return;
      }
    }
    const srcW = src.width;
    let y = 0;
    while (y < dh) {
      const dstY = dy + y;
      if ( dstY < 0 ) {
        y = y + 1;
      } else {
        if ( dstY >= this.h ) {
          y = y + 1;
        } else {
          let readY = y;
          if ( flipV ) {
            readY = (dh - 1) - y;
          }
          let syOff = sy + (Math.floor( (((readY * sh)) / (dh))));
          if ( syOff >= src.height ) {
            syOff = src.height - 1;
          }
          let x = 0;
          while (x < dw) {
            const dstX = dx + x;
            if ( dstX < 0 ) {
              x = x + 1;
            } else {
              if ( dstX >= this.w ) {
                x = x + 1;
              } else {
                let readX = x;
                if ( flipH ) {
                  readX = (dw - 1) - x;
                }
                let sxOff = sx + (Math.floor( (((readX * sw)) / (dw))));
                if ( sxOff >= srcW ) {
                  sxOff = srcW - 1;
                }
                const sOff = ((syOff * srcW) + sxOff) * 4;
                const srcA = src.pixels._view.getUint8((sOff + 3));
                if ( srcA > 0 ) {
                  const dOff = ((dstY * this.w) + dstX) * 4;
                  if ( srcA >= 255 ) {
                    this.px._view.setUint8(dOff, src.pixels._view.getUint8(sOff));
                    this.px._view.setUint8(dOff + 1, src.pixels._view.getUint8((sOff + 1)));
                    this.px._view.setUint8(dOff + 2, src.pixels._view.getUint8((sOff + 2)));
                    this.px._view.setUint8(dOff + 3, 255);
                  } else {
                    this.blitter.blendOverBytes(this.px, dOff, src.pixels._view.getUint8(sOff), src.pixels._view.getUint8((sOff + 1)), src.pixels._view.getUint8((sOff + 2)), srcA);
                  }
                }
                x = x + 1;
              }
            }
          };
          y = y + 1;
        }
      }
    };
  };
  blitImageRectScaledRotated (src, sx, sy, sw, sh, pivotX, pivotY, dw, dh, angleDeg) {
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    if ( dw <= 0 ) {
      return;
    }
    if ( dh <= 0 ) {
      return;
    }
    if ( angleDeg == 0.0 ) {
      const halfDw = Math.floor( ((dw) * 0.5));
      const halfDh = Math.floor( ((dh) * 0.5));
      const dx = pivotX - halfDw;
      const dy = pivotY - halfDh;
      this.blitImageRectScaled(src, sx, sy, sw, sh, dx, dy, dw, dh);
      return;
    }
    const srcW = src.width;
    const rad = this.degToRad(angleDeg);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const hw = (dw) * 0.5;
    const hh = (dh) * 0.5;
    let y = 0;
    while (y < dh) {
      const ly = (y) - hh;
      let x = 0;
      while (x < dw) {
        const lx = (x) - hw;
        const wx = (lx * cosA) - (ly * sinA);
        const wy = (lx * sinA) + (ly * cosA);
        const dstX = pivotX + (Math.floor( wx));
        const dstY = pivotY + (Math.floor( wy));
        if ( dstX >= 0 ) {
          if ( dstX < this.w ) {
            if ( dstY >= 0 ) {
              if ( dstY < this.h ) {
                let sxOff = sx + (Math.floor( (((x * sw)) / (dw))));
                if ( sxOff >= srcW ) {
                  sxOff = srcW - 1;
                }
                let syOff = sy + (Math.floor( (((y * sh)) / (dh))));
                if ( syOff >= src.height ) {
                  syOff = src.height - 1;
                }
                const sOff = ((syOff * srcW) + sxOff) * 4;
                const srcA = src.pixels._view.getUint8((sOff + 3));
                if ( srcA > 0 ) {
                  const dOff = ((dstY * this.w) + dstX) * 4;
                  if ( srcA >= 255 ) {
                    this.px._view.setUint8(dOff, src.pixels._view.getUint8(sOff));
                    this.px._view.setUint8(dOff + 1, src.pixels._view.getUint8((sOff + 1)));
                    this.px._view.setUint8(dOff + 2, src.pixels._view.getUint8((sOff + 2)));
                    this.px._view.setUint8(dOff + 3, 255);
                  } else {
                    this.blitter.blendOverBytes(this.px, dOff, src.pixels._view.getUint8(sOff), src.pixels._view.getUint8((sOff + 1)), src.pixels._view.getUint8((sOff + 2)), srcA);
                  }
                }
              }
            }
          }
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  fillCircle (cx, cy, rad, r, g, b) {
    const r2 = rad * rad;
    let yy = cy - rad;
    const yEnd = cy + rad;
    while (yy <= yEnd) {
      if ( yy >= 0 ) {
        if ( yy < this.h ) {
          const dy = yy - cy;
          const rem = r2 - (dy * dy);
          if ( rem >= 0 ) {
            let hw = 0;
            while (((hw + 1) * (hw + 1)) <= rem) {
              hw = hw + 1;
            };
            let x0 = cx - hw;
            let x1 = (cx + hw) + 1;
            if ( x0 < 0 ) {
              x0 = 0;
            }
            if ( x1 > this.w ) {
              x1 = this.w;
            }
            if ( x0 < x1 ) {
              const rowOff = ((yy * this.w) + x0) * 4;
              this.fillSpanRGB(rowOff, x1 - x0, r, g, b);
            }
          }
        }
      }
      yy = yy + 1;
    };
  };
  wedgeSkipPixel (cx, cy, px, py, wedgeDir, wedgeOpen) {
    if ( wedgeOpen <= 0 ) {
      return false;
    }
    const dx = px - cx;
    const dy = py - cy;
    let adx = dx;
    let ady = dy;
    if ( adx < 0 ) {
      adx = 0 - adx;
    }
    if ( ady < 0 ) {
      ady = 0 - ady;
    }
    const gap = wedgeOpen + 1;
    if ( wedgeDir == 1 ) {
      if ( dx <= 0 ) {
        return false;
      }
      if ( (ady * gap) < dx ) {
        return true;
      }
      return false;
    }
    if ( wedgeDir == 3 ) {
      if ( dx >= 0 ) {
        return false;
      }
      if ( (ady * gap) < (0 - dx) ) {
        return true;
      }
      return false;
    }
    if ( wedgeDir == 0 ) {
      if ( dy >= 0 ) {
        return false;
      }
      if ( (adx * gap) < (0 - dy) ) {
        return true;
      }
      return false;
    }
    if ( dy <= 0 ) {
      return false;
    }
    if ( (adx * gap) < dy ) {
      return true;
    }
    return false;
  };
  fillWedgeCircle (cx, cy, rad, wedgeDir, wedgeOpen, r, g, b) {
    const r2 = rad * rad;
    let yy = cy - rad;
    const yEnd = cy + rad;
    while (yy <= yEnd) {
      let xx = cx - rad;
      const xEnd = cx + rad;
      while (xx <= xEnd) {
        const dx = xx - cx;
        const dy = yy - cy;
        if ( ((dx * dx) + (dy * dy)) <= r2 ) {
          if ( false == this.wedgeSkipPixel(cx, cy, xx, yy, wedgeDir, wedgeOpen) ) {
            this.setPixel(xx, yy, r, g, b);
          }
        }
        xx = xx + 1;
      };
      yy = yy + 1;
    };
  };
  clampChan (n) {
    if ( n < 0 ) {
      return 0;
    }
    if ( n > 255 ) {
      return 255;
    }
    return n;
  };
  ghostBodyAt (cx, cy, px, py, rad) {
    const dx = px - cx;
    let adx = dx;
    if ( adx < 0 ) {
      adx = 0 - adx;
    }
    if ( py > (cy + rad) ) {
      return false;
    }
    if ( py < (cy - rad) ) {
      return false;
    }
    if ( px < (cx - rad) ) {
      return false;
    }
    if ( px > (cx + rad) ) {
      return false;
    }
    const domeY = cy - 1;
    const ddx = px - cx;
    const ddy = py - domeY;
    const r2 = rad * rad;
    if ( py <= (cy + 1) ) {
      if ( ((ddx * ddx) + (ddy * ddy)) <= r2 ) {
        return true;
      }
    }
    if ( py <= ((cy + rad) - 1) ) {
      if ( adx <= rad ) {
        return true;
      }
    }
    if ( py == ((cy + rad) - 1) ) {
      const wave = ((px - cx) + rad) % 4;
      if ( wave == 0 ) {
        return false;
      }
      if ( wave == 3 ) {
        return false;
      }
      if ( adx <= rad ) {
        return true;
      }
    }
    if ( py == (cy + rad) ) {
      const wave2 = (((px - cx) + rad) + 1) % 4;
      if ( wave2 == 1 ) {
        return true;
      }
      if ( wave2 == 2 ) {
        return true;
      }
    }
    return false;
  };
  ghostEyePlus (ex, ey, px, py) {
    if ( px == ex ) {
      if ( py >= (ey - 1) ) {
        if ( py <= (ey + 1) ) {
          return true;
        }
      }
    }
    if ( py == ey ) {
      if ( px >= (ex - 1) ) {
        if ( px <= (ex + 1) ) {
          return true;
        }
      }
    }
    return false;
  };
  fillGhost (cx, cy, rad, faceDir, eyesOnly, r, g, b) {
    if ( eyesOnly != 0 ) {
      this.fillCircle(cx, cy, rad, 255, 255, 255);
    } else {
      let yy = cy - rad;
      const yEnd = cy + rad;
      while (yy <= yEnd) {
        let xx = cx - rad;
        const xEnd = cx + rad;
        while (xx <= xEnd) {
          if ( this.ghostBodyAt(cx, cy, xx, yy, rad) ) {
            let br = r;
            let bg = g;
            let bb = b;
            if ( yy <= (cy - 2) ) {
              if ( xx <= (cx - 1) ) {
                br = this.clampChan((r + 40));
                bg = this.clampChan((g + 40));
                bb = this.clampChan((b + 40));
              }
            }
            if ( yy <= cy ) {
              if ( br == r ) {
                br = this.clampChan((r + 18));
                bg = this.clampChan((g + 18));
                bb = this.clampChan((b + 18));
              }
            }
            this.setPixel(xx, yy, br, bg, bb);
          }
          xx = xx + 1;
        };
        yy = yy + 1;
      };
    }
    let le = cx - 3;
    let re = cx + 3;
    let ey = cy - 1;
    if ( eyesOnly != 0 ) {
      le = cx - 2;
      re = cx + 2;
      ey = cy;
    }
    let pOffX = 0;
    let pOffY = 0;
    if ( faceDir == 0 ) {
      pOffY = 0 - 1;
    }
    if ( faceDir == 1 ) {
      pOffX = 1;
    }
    if ( faceDir == 2 ) {
      pOffY = 1;
    }
    if ( faceDir == 3 ) {
      pOffX = 0 - 1;
    }
    let pr = this.clampChan((r - 90));
    let pg = this.clampChan((g - 90));
    let pb = this.clampChan((b - 90));
    if ( pr < 16 ) {
      pr = 16;
    }
    if ( pg < 16 ) {
      pg = 16;
    }
    if ( pb < 16 ) {
      pb = 16;
    }
    let py = ey - 2;
    const pyEnd = ey + 2;
    while (py <= pyEnd) {
      let px_1 = cx - rad;
      const pxEnd = cx + rad;
      while (px_1 <= pxEnd) {
        if ( this.ghostEyePlus(le, ey, px_1, py) ) {
          this.setPixel(px_1, py, 235, 245, 255);
        }
        if ( this.ghostEyePlus(re, ey, px_1, py) ) {
          this.setPixel(px_1, py, 235, 245, 255);
        }
        px_1 = px_1 + 1;
      };
      py = py + 1;
    };
    this.setPixel(le + pOffX, ey + pOffY, pr, pg, pb);
    this.setPixel(re + pOffX, ey + pOffY, pr, pg, pb);
  };
  copyRectFrom (src, sx, sy, sw, sh, dx, dy) {
    const srcW = src.w;
    const srcH = src.h;
    let row = 0;
    while (row < sh) {
      const pxY = sy + row;
      const dstY = dy + row;
      if ( pxY >= 0 ) {
        if ( pxY < srcH ) {
          if ( dstY >= 0 ) {
            if ( dstY < this.h ) {
              let cStart = 0;
              let cEnd = sw;
              if ( (sx + cStart) < 0 ) {
                cStart = 0 - sx;
              }
              if ( (dx + cStart) < 0 ) {
                cStart = 0 - dx;
              }
              if ( (sx + cEnd) > srcW ) {
                cEnd = srcW - sx;
              }
              if ( (dx + cEnd) > this.w ) {
                cEnd = this.w - dx;
              }
              if ( cEnd > cStart ) {
                const sOff = ((pxY * srcW) + (sx + cStart)) * 4;
                const dOff = ((dstY * this.w) + (dx + cStart)) * 4;
                const __len = (cEnd - cStart) * 4;
                (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.px,dOff,src.px,sOff,__len);
              }
            }
          }
        }
      }
      row = row + 1;
    };
  };
  copyRectScaledFrom (src, sx, sy, sw, sh, dx, dy, dw, dh) {
    if ( dw <= 0 ) {
      return;
    }
    if ( dh <= 0 ) {
      return;
    }
    const srcW = src.w;
    const srcH = src.h;
    let colOff = new Int32Array(dw);
    let c = 0;
    while (c < dw) {
      const srcCol = (((c * sw) / dw) | 0);
      colOff[c] = (sx + srcCol) * 4;
      c = c + 1;
    };
    let row = 0;
    while (row < dh) {
      const srcRow = (((row * sh) / dh) | 0);
      const pxY = sy + srcRow;
      const dstY = dy + row;
      if ( pxY >= 0 ) {
        if ( pxY < srcH ) {
          if ( dstY >= 0 ) {
            if ( dstY < this.h ) {
              const srcRowBase = (pxY * srcW) * 4;
              const dstRowBase = ((dstY * this.w) + dx) * 4;
              let col = 0;
              while (col < dw) {
                const dstX = dx + col;
                if ( dstX >= 0 ) {
                  if ( dstX < this.w ) {
                    const sOff = srcRowBase + (colOff[col]);
                    const dOff = dstRowBase + (col * 4);
                    (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(this.px,dOff,src.px,sOff,4);
                  }
                }
                col = col + 1;
              };
            }
          }
        }
      }
      row = row + 1;
    };
  };
  pixelR (x, y) {
    const o = ((y * this.w) + x) * 4;
    return this.px._view.getUint8(o);
  };
  pixelG (x, y) {
    const o = ((y * this.w) + x) * 4;
    return this.px._view.getUint8((o + 1));
  };
  pixelB (x, y) {
    const o = ((y * this.w) + x) * 4;
    return this.px._view.getUint8((o + 2));
  };
  litPixels (minSum) {
    const n = this.w * this.h;
    let i = 0;
    let count = 0;
    while (i < n) {
      const o = i * 4;
      const r = this.px._view.getUint8(o);
      const g = this.px._view.getUint8((o + 1));
      const b = this.px._view.getUint8((o + 2));
      if ( ((r + g) + b) > minSum ) {
        count = count + 1;
      }
      i = i + 1;
    };
    return count;
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
class VectorStroke  {
  constructor() {
  }
}
VectorStroke.parseDashes = function(s) {
  let out = [];
  let current = "";
  let i = 0;
  const n = s.length;
  let bad = false;
  while (i <= n) {
    let isSep = true;
    if ( i < n ) {
      const ch = s.charCodeAt(i );
      isSep = false;
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
    }
    if ( isSep ) {
      if ( (current.length) > 0 ) {
        const v = isNaN( parseFloat(current) ) ? undefined : parseFloat(current);
        if ( typeof(v) != "undefined" ) {
          const dv = v;
          if ( dv < 0.0 ) {
            bad = true;
          }
          out.push(dv);
        } else {
          bad = true;
        }
        current = "";
      }
    } else {
      current = current + (String.fromCharCode((s.charCodeAt(i ))));
    }
    i = i + 1;
  };
  let empty = [];
  if ( bad ) {
    return empty;
  }
  const cnt = out.length;
  if ( cnt == 0 ) {
    return empty;
  }
  let total = 0.0;
  let j = 0;
  while (j < cnt) {
    total = total + (out[j]);
    j = j + 1;
  };
  if ( total <= 0.0 ) {
    return empty;
  }
  if ( ((((cnt / 2) | 0)) * 2) != cnt ) {
    let k = 0;
    while (k < cnt) {
      out.push(out[k]);
      k = k + 1;
    };
  }
  return out;
};
VectorStroke.scaleDashes = function(dashes, scale) {
  let out = [];
  let k = 0;
  while (k < (dashes.length)) {
    out.push((dashes[k]) * scale);
    k = k + 1;
  };
  return out;
};
class VectorEdge  {
  constructor() {
    this.x1 = 0.0;
    this.y1 = 0.0;
    this.x2 = 0.0;
    this.y2 = 0.0;
    this.minY = 0.0;
    this.maxY = 0.0;
    this.xAtMinY = 0.0;
    this.dxdy = 0.0;
    this.dir = 0;
  }
  init (px1, py1, px2, py2) {
    this.x1 = px1;
    this.y1 = py1;
    this.x2 = px2;
    this.y2 = py2;
    if ( this.y1 < this.y2 ) {
      this.minY = this.y1;
      this.maxY = this.y2;
      this.xAtMinY = this.x1;
      this.dir = 1;
    } else {
      this.minY = this.y2;
      this.maxY = this.y1;
      this.xAtMinY = this.x2;
      this.dir = 0 - 1;
    }
    const dy = this.maxY - this.minY;
    if ( dy > 0.0001 ) {
      if ( this.y1 < this.y2 ) {
        this.dxdy = (this.x2 - this.x1) / dy;
      } else {
        this.dxdy = (this.x1 - this.x2) / dy;
      }
    } else {
      this.dxdy = 0.0;
    }
  };
  getX (y) {
    return this.xAtMinY + (this.dxdy * (y - this.minY));
  };
}
class VectorRasterizer  {
  constructor() {
    this.edges = [];
    this.compositor = new RasterCompositor();
    this.hasClip = false;
    this.clipX0 = 0;
    this.clipY0 = 0;
    this.clipX1 = 0;
    this.clipY1 = 0;
    this.hasTransform = false;
    this.ta = 1.0;
    this.tb = 0.0;
    this.tc = 0.0;
    this.td = 1.0;
    this.te = 0.0;
    this.tf = 0.0;
    let e_1 = [];
    this.edges = e_1;
  }
  reset () {
    let e = [];
    this.edges = e;
  };
  edgeCount () {
    return this.edges.length;
  };
  setTransform (a, b, c, d, e, f) {
    this.ta = a;
    this.tb = b;
    this.tc = c;
    this.td = d;
    this.te = e;
    this.tf = f;
    this.hasTransform = true;
  };
  clearTransform () {
    this.hasTransform = false;
  };
  setClipRect (x0, y0, x1, y1) {
    this.clipX0 = x0;
    this.clipY0 = y0;
    this.clipX1 = x1;
    this.clipY1 = y1;
    this.hasClip = true;
  };
  clearClip () {
    this.hasClip = false;
  };
  addEdge (rawX1, rawY1, rawX2, rawY2) {
    let px1 = rawX1;
    let py1 = rawY1;
    let px2 = rawX2;
    let py2 = rawY2;
    if ( this.hasTransform ) {
      px1 = ((this.ta * rawX1) + (this.tc * rawY1)) + this.te;
      py1 = ((this.tb * rawX1) + (this.td * rawY1)) + this.tf;
      px2 = ((this.ta * rawX2) + (this.tc * rawY2)) + this.te;
      py2 = ((this.tb * rawX2) + (this.td * rawY2)) + this.tf;
    }
    let dy = py2 - py1;
    if ( dy < 0.0 ) {
      dy = 0.0 - dy;
    }
    if ( dy < 0.0001 ) {
      return;
    }
    const edge = new VectorEdge();
    edge.init(px1, py1, px2, py2);
    this.edges.push(edge);
  };
  addRing (pts) {
    const m = pts.length;
    const n = ((m / 2) | 0);
    if ( n < 2 ) {
      return;
    }
    let k = 0;
    while (k < n) {
      let nextIdx = k + 1;
      if ( nextIdx >= n ) {
        nextIdx = 0;
      }
      const ax = pts[(k * 2)];
      const ay = pts[((k * 2) + 1)];
      const bx = pts[(nextIdx * 2)];
      const by = pts[((nextIdx * 2) + 1)];
      this.addEdge(ax, ay, bx, by);
      k = k + 1;
    };
  };
  addStroke (pts, width, closed) {
    const m = pts.length;
    const n = ((m / 2) | 0);
    if ( n < 2 ) {
      return;
    }
    const hw = width / 2.0;
    if ( hw <= 0.0 ) {
      return;
    }
    let segCount = n - 1;
    if ( closed ) {
      segCount = n;
    }
    let k = 0;
    while (k < segCount) {
      let nextIdx = k + 1;
      if ( nextIdx >= n ) {
        nextIdx = 0;
      }
      const ax = pts[(k * 2)];
      const ay = pts[((k * 2) + 1)];
      const bx = pts[(nextIdx * 2)];
      const by = pts[((nextIdx * 2) + 1)];
      const dx = bx - ax;
      const dy = by - ay;
      const dlen = Math.sqrt(((dx * dx) + (dy * dy)));
      if ( dlen > 0.000001 ) {
        const px = ((0.0 - dy) / dlen) * hw;
        const py = (dx / dlen) * hw;
        let quad = [];
        quad.push(ax + px);
        quad.push(ay + py);
        quad.push(bx + px);
        quad.push(by + py);
        quad.push(bx - px);
        quad.push(by - py);
        quad.push(ax - px);
        quad.push(ay - py);
        this.addRing(quad);
      }
      k = k + 1;
    };
    let firstJoint = 1;
    let lastJoint = n - 1;
    if ( closed ) {
      firstJoint = 0;
      lastJoint = n;
    }
    let j = firstJoint;
    while (j < lastJoint) {
      const jx = pts[(j * 2)];
      const jy = pts[((j * 2) + 1)];
      this.addDisc(jx, jy, hw);
      j = j + 1;
    };
  };
  addDashedStroke (pts, width, closed, dashes, dashOffset) {
    const dn = dashes.length;
    if ( dn == 0 ) {
      this.addStroke(pts, width, closed);
      return;
    }
    let total = 0.0;
    let di = 0;
    while (di < dn) {
      const dv = dashes[di];
      if ( dv > 0.0 ) {
        total = total + dv;
      }
      di = di + 1;
    };
    if ( total <= 0.0 ) {
      this.addStroke(pts, width, closed);
      return;
    }
    const m = pts.length;
    const n = ((m / 2) | 0);
    if ( n < 2 ) {
      return;
    }
    let segCount = n - 1;
    if ( closed ) {
      segCount = n;
    }
    let idx = 0;
    let on = true;
    let remaining = dashes[0];
    if ( remaining < 0.0 ) {
      remaining = 0.0;
    }
    let skip = dashOffset;
    if ( skip < 0.0 ) {
      skip = 0.0;
    }
    while (skip > 0.0) {
      if ( skip < remaining ) {
        remaining = remaining - skip;
        skip = 0.0;
      } else {
        skip = skip - remaining;
        idx = idx + 1;
        let wrapped = idx;
        if ( wrapped >= dn ) {
          wrapped = wrapped - ((((wrapped / dn) | 0)) * dn);
          idx = wrapped;
        }
        on = on == false;
        remaining = dashes[idx];
        if ( remaining < 0.0 ) {
          remaining = 0.0;
        }
      }
    };
    let run = [];
    let runOpen = false;
    let k = 0;
    while (k < segCount) {
      let nextIdx = k + 1;
      if ( nextIdx >= n ) {
        nextIdx = 0;
      }
      const ax = pts[(k * 2)];
      const ay = pts[((k * 2) + 1)];
      const bx = pts[(nextIdx * 2)];
      const by = pts[((nextIdx * 2) + 1)];
      const dx = bx - ax;
      const dy = by - ay;
      const segLen = Math.sqrt(((dx * dx) + (dy * dy)));
      if ( segLen > 0.000001 ) {
        let travelled = 0.0;
        while (travelled < segLen) {
          const left = segLen - travelled;
          let step = remaining;
          if ( step > left ) {
            step = left;
          }
          if ( step <= 0.0 ) {
            step = 0.0;
          }
          const t0 = travelled / segLen;
          const t1 = (travelled + step) / segLen;
          const x0 = ax + (dx * t0);
          const y0 = ay + (dy * t0);
          const x1 = ax + (dx * t1);
          const y1 = ay + (dy * t1);
          if ( on ) {
            if ( runOpen == false ) {
              let fresh = [];
              run = fresh;
              run.push(x0);
              run.push(y0);
              runOpen = true;
            }
            run.push(x1);
            run.push(y1);
          }
          travelled = travelled + step;
          remaining = remaining - step;
          if ( remaining <= 1e-7 ) {
            if ( on ) {
              if ( runOpen ) {
                this.addStroke(run, width, false);
                runOpen = false;
              }
            }
            idx = idx + 1;
            if ( idx >= dn ) {
              idx = 0;
            }
            on = on == false;
            remaining = dashes[idx];
            if ( remaining < 0.0 ) {
              remaining = 0.0;
            }
            if ( remaining == 0.0 ) {
              idx = idx + 1;
              if ( idx >= dn ) {
                idx = 0;
              }
              on = on == false;
              remaining = dashes[idx];
              if ( remaining <= 0.0 ) {
                remaining = total;
              }
            }
          }
        };
      }
      k = k + 1;
    };
    if ( runOpen ) {
      this.addStroke(run, width, false);
    }
  };
  addDisc (cx, cy, radius) {
    if ( radius <= 0.0 ) {
      return;
    }
    const sides = 8;
    let pts = [];
    let k = 0;
    while (k < sides) {
      const ang = ((2.0 * (Math.PI)) * (k)) / (sides);
      pts.push(cx + (radius * (Math.cos(ang))));
      pts.push(cy + (radius * (Math.sin(ang))));
      k = k + 1;
    };
    this.addRing(pts);
  };
  fillAA (buf, r, g, b, a, rule) {
    const numEdges = this.edges.length;
    if ( numEdges == 0 ) {
      return;
    }
    let minY = 99999.0;
    let maxY = 0.0 - 99999.0;
    let minX = 99999.0;
    let maxX = 0.0 - 99999.0;
    let i = 0;
    while (i < numEdges) {
      const e = this.edges[i];
      if ( e.minY < minY ) {
        minY = e.minY;
      }
      if ( e.maxY > maxY ) {
        maxY = e.maxY;
      }
      if ( e.x1 < minX ) {
        minX = e.x1;
      }
      if ( e.x2 < minX ) {
        minX = e.x2;
      }
      if ( e.x1 > maxX ) {
        maxX = e.x1;
      }
      if ( e.x2 > maxX ) {
        maxX = e.x2;
      }
      i = i + 1;
    };
    let startY = (Math.floor( minY)) - 1;
    let endY = (Math.floor( maxY)) + 1;
    let startX = (Math.floor( minX)) - 1;
    let endX = (Math.floor( maxX)) + 1;
    if ( startY < 0 ) {
      startY = 0;
    }
    if ( endY >= buf.height ) {
      endY = buf.height - 1;
    }
    if ( startX < 0 ) {
      startX = 0;
    }
    if ( endX >= buf.width ) {
      endX = buf.width - 1;
    }
    if ( this.hasClip ) {
      if ( startX < this.clipX0 ) {
        startX = this.clipX0;
      }
      if ( endX > this.clipX1 ) {
        endX = this.clipX1;
      }
      if ( startY < this.clipY0 ) {
        startY = this.clipY0;
      }
      if ( endY > this.clipY1 ) {
        endY = this.clipY1;
      }
    }
    const subStep = 0.25;
    const subOffset = 0.125;
    const samplesPerPixel = 16.0;
    const spanW = (endX - startX) + 1;
    if ( spanW < 1 ) {
      return;
    }
    const sampleCount = spanW * 4;
    const startXd = startX;
    let windDelta = [];
    let crossDelta = [];
    let s = 0;
    while (s < sampleCount) {
      windDelta.push(0);
      crossDelta.push(0);
      s = s + 1;
    };
    let touched = [];
    let cover = [];
    let px = 0;
    while (px < spanW) {
      cover.push(0);
      px = px + 1;
    };
    const rowCount = (endY - startY) + 1;
    const startYd = startY;
    let rowStart = [];
    let rr = 0;
    while (rr <= rowCount) {
      rowStart.push(0);
      rr = rr + 1;
    };
    i = 0;
    while (i < numEdges) {
      const eb = this.edges[i];
      let firstRow = 0;
      if ( eb.minY > startYd ) {
        firstRow = (Math.floor( eb.minY)) - startY;
      }
      if ( firstRow < rowCount ) {
        rowStart[firstRow + 1] = (rowStart[(firstRow + 1)]) + 1;
      }
      i = i + 1;
    };
    rr = 1;
    while (rr <= rowCount) {
      rowStart[rr] = (rowStart[rr]) + (rowStart[(rr - 1)]);
      rr = rr + 1;
    };
    let fill = [];
    rr = 0;
    while (rr <= rowCount) {
      fill.push(rowStart[rr]);
      rr = rr + 1;
    };
    let ordered = [];
    const placed = rowStart[rowCount];
    i = 0;
    while (i < placed) {
      ordered.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < numEdges) {
      const eo = this.edges[i];
      let startRow = 0;
      if ( eo.minY > startYd ) {
        startRow = (Math.floor( eo.minY)) - startY;
      }
      if ( startRow < rowCount ) {
        ordered[fill[startRow]] = i;
        fill[startRow] = (fill[startRow]) + 1;
      }
      i = i + 1;
    };
    let active = [];
    let activeCount = 0;
    let scanY = startY;
    while (scanY <= endY) {
      px = 0;
      while (px < spanW) {
        cover[px] = 0;
        px = px + 1;
      };
      const rowIdx = scanY - startY;
      let q = rowStart[rowIdx];
      const qEnd = rowStart[(rowIdx + 1)];
      while (q < qEnd) {
        if ( activeCount < (active.length) ) {
          active[activeCount] = ordered[q];
        } else {
          active.push(ordered[q]);
        }
        activeCount = activeCount + 1;
        q = q + 1;
      };
      const rowTop = (scanY) + 0.125;
      let keep = 0;
      let scan = 0;
      while (scan < activeCount) {
        const ei = active[scan];
        const ea = this.edges[ei];
        if ( ea.maxY > rowTop ) {
          active[keep] = ei;
          keep = keep + 1;
        }
        scan = scan + 1;
      };
      activeCount = keep;
      let sy = 0;
      while (sy < 4) {
        const sampleY = ((scanY) + subOffset) + ((sy) * subStep);
        touched.length = 0;
        i = 0;
        while (i < activeCount) {
          const e_1 = this.edges[(active[i])];
          if ( (sampleY >= e_1.minY) && (sampleY < e_1.maxY) ) {
            const edgeX = e_1.getX(sampleY);
            let slot = 0;
            const rel = (edgeX - startXd) - subOffset;
            if ( rel >= 0.0 ) {
              slot = (Math.floor( (rel / subStep))) + 1;
            }
            if ( slot < sampleCount ) {
              windDelta[slot] = (windDelta[slot]) + e_1.dir;
              crossDelta[slot] = (crossDelta[slot]) + 1;
              touched.push(slot);
            }
          }
          i = i + 1;
        };
        let winding = 0;
        let crossings = 0;
        s = 0;
        px = 0;
        while (px < spanW) {
          let cov = cover[px];
          let sx = 0;
          while (sx < 4) {
            winding = winding + (windDelta[s]);
            crossings = crossings + (crossDelta[s]);
            let inside = false;
            if ( rule == 1 ) {
              if ( ((((crossings / 2) | 0)) * 2) != crossings ) {
                inside = true;
              }
            } else {
              if ( winding != 0 ) {
                inside = true;
              }
            }
            if ( inside ) {
              cov = cov + 1;
            }
            s = s + 1;
            sx = sx + 1;
          };
          cover[px] = cov;
          px = px + 1;
        };
        for ( let ti = 0; ti < touched.length; ti++) {
          var slot_1 = touched[ti];
          windDelta[slot_1] = 0;
          crossDelta[slot_1] = 0;
        };
        sy = sy + 1;
      };
      px = 0;
      while (px < spanW) {
        const coverage = cover[px];
        if ( coverage > 0 ) {
          const coverageAlpha = Math.floor( (((coverage) / samplesPerPixel) * (a)));
          this.compositor.blendSourceOver(buf, startX + px, scanY, r, g, b, coverageAlpha);
        }
        px = px + 1;
      };
      scanY = scanY + 1;
    };
  };
}
VectorRasterizer.nonZero = function() {
  return 0;
};
VectorRasterizer.evenOdd = function() {
  return 1;
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
class TTFTableRecord  {
  constructor() {
    this.tag = "";
    this.checksum = 0;
    this.offset = 0;
    this.length = 0;
  }
}
class TTFGlyphMetrics  {
  constructor() {
    this.advanceWidth = 0;     /** note: unused */
    this.leftSideBearing = 0;     /** note: unused */
  }
}
class TTFShapedRun  {
  constructor() {
    this.glyphs = [];
    this.clusterStart = [];
    this.clusterEnd = [];
  }
  count () {
    return this.glyphs.length;
  };
}
class TrueTypeFont  {
  constructor() {
    this.fontData = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.fontPath = "";
    this.fontFamily = "";
    this.fontStyle = "Regular";
    this.sfntVersion = 0;
    this.numTables = 0;
    this.searchRange = 0;
    this.entrySelector = 0;
    this.rangeShift = 0;
    this.tables = [];
    this.unitsPerEm = 1000;
    this.xMin = 0;
    this.yMin = 0;
    this.xMax = 0;
    this.yMax = 0;
    this.indexToLocFormat = 0;
    this.ascender = 0;
    this.descender = 0;
    this.lineGap = 0;
    this.numberOfHMetrics = 0;
    this.numGlyphs = 0;
    this.cmapFormat = 0;
    this.cmapOffset = 0;
    this.glyphWidths = [];
    this.defaultWidth = 500;
    this.charWidths = [];
    this.charWidthsLoaded = false;
    this.kernSubtables = [];
    this.kernSubtableLookups = [];
    this.pairMatched = false;
    this.ligatureSubtables = [];
    this.hasShaping = false;
    this.legacyKernOffset = 0;
    this.legacyKernPairs = 0;
    this.hasKerning = false;
    this.ligatureMatched = 0;
    let t = [];
    this.tables = t;
    let gw = [];
    this.glyphWidths = gw;
    let cw = [];
    this.charWidths = cw;
    let ks = [];
    this.kernSubtables = ks;
    let ksl = [];
    this.kernSubtableLookups = ksl;
    let ls = [];
    this.ligatureSubtables = ls;
  }
  loadFromBuffer (name, data) {
    this.fontPath = name;
    this.fontData = data;
    if ( (this.fontData.byteLength) == 0 ) {
      return false;
    }
    if ( this.parseOffsetTable() == false ) {
      return false;
    }
    if ( this.parseTableDirectory() == false ) {
      return false;
    }
    this.parseHeadTable();
    this.parseHheaTable();
    this.parseMaxpTable();
    this.parseCmapTable();
    this.parseHmtxTable();
    this.parseNameTable();
    this.parseKerning();
    this.parseGsubLigatures();
    this.buildCharWidthCache();
    return true;
  };
  loadFromFile (path) {
    this.fontPath = path;
    let lastSlash = -1;
    let i = 0;
    while (i < (path.length)) {
      const ch = path.charCodeAt(i );
      if ( (ch == 47) || (ch == 92) ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    let dirPath = ".";
    let fileName = path;
    if ( lastSlash >= 0 ) {
      dirPath = path.substring(0, lastSlash );
      fileName = path.substring((lastSlash + 1), (path.length) );
    }
    if ( (require("fs").existsSync(dirPath + "/" + fileName )) == false ) {
      return false;
    }
    this.fontData = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( (this.fontData.byteLength) == 0 ) {
      console.log("TrueTypeFont: Failed to load " + path);
      return false;
    }
    if ( this.parseOffsetTable() == false ) {
      return false;
    }
    if ( this.parseTableDirectory() == false ) {
      return false;
    }
    this.parseHeadTable();
    this.parseHheaTable();
    this.parseMaxpTable();
    this.parseCmapTable();
    this.parseHmtxTable();
    this.parseNameTable();
    this.parseKerning();
    this.parseGsubLigatures();
    this.buildCharWidthCache();
    return true;
  };
  parseOffsetTable () {
    if ( (this.fontData.byteLength) < 12 ) {
      return false;
    }
    this.sfntVersion = this.readUInt32(0);
    this.numTables = this.readUInt16(4);
    this.searchRange = this.readUInt16(6);
    this.entrySelector = this.readUInt16(8);
    this.rangeShift = this.readUInt16(10);
    return true;
  };
  parseTableDirectory () {
    let offset = 12;
    let i = 0;
    while (i < this.numTables) {
      const record = new TTFTableRecord();
      record.tag = this.readTag(offset);
      record.checksum = this.readUInt32((offset + 4));
      record.offset = this.readUInt32((offset + 8));
      record.length = this.readUInt32((offset + 12));
      this.tables.push(record);
      offset = offset + 16;
      i = i + 1;
    };
    return true;
  };
  findTable (tag) {
    let i = 0;
    while (i < (this.tables.length)) {
      const t = this.tables[i];
      if ( t.tag == tag ) {
        return t;
      }
      i = i + 1;
    };
    const empty = new TTFTableRecord();
    return empty;
  };
  parseHeadTable () {
    const table = this.findTable("head");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.unitsPerEm = this.readUInt16((off + 18));
    this.xMin = this.readInt16((off + 36));
    this.yMin = this.readInt16((off + 38));
    this.xMax = this.readInt16((off + 40));
    this.yMax = this.readInt16((off + 42));
    this.indexToLocFormat = this.readInt16((off + 50));
  };
  parseHheaTable () {
    const table = this.findTable("hhea");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.ascender = this.readInt16((off + 4));
    this.descender = this.readInt16((off + 6));
    this.lineGap = this.readInt16((off + 8));
    this.numberOfHMetrics = this.readUInt16((off + 34));
  };
  parseMaxpTable () {
    const table = this.findTable("maxp");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.numGlyphs = this.readUInt16((off + 4));
  };
  parseCmapTable () {
    const table = this.findTable("cmap");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const numSubtables = this.readUInt16((off + 2));
    let i = 0;
    let subtableOffset = 0;
    let wideFound = false;
    while (i < numSubtables) {
      const recordOff = (off + 4) + (i * 8);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const subOff = this.readUInt32((recordOff + 4));
      const fmt = this.readUInt16((off + subOff));
      let wideCandidate = false;
      if ( (platformID == 3) && (encodingID == 10) ) {
        wideCandidate = true;
      }
      if ( (platformID == 0) && (encodingID == 4) ) {
        wideCandidate = true;
      }
      if ( (platformID == 0) && (encodingID == 6) ) {
        wideCandidate = true;
      }
      if ( wideCandidate && (fmt == 12) ) {
        subtableOffset = subOff;
        wideFound = true;
      }
      if ( wideFound == false ) {
        if ( (platformID == 3) && (encodingID == 1) ) {
          subtableOffset = subOff;
        }
        if ( (platformID == 0) && (subtableOffset == 0) ) {
          subtableOffset = subOff;
        }
      }
      i = i + 1;
    };
    if ( subtableOffset > 0 ) {
      this.cmapOffset = off + subtableOffset;
      this.cmapFormat = this.readUInt16(this.cmapOffset);
    }
  };
  parseHmtxTable () {
    const table = this.findTable("hmtx");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    let i = 0;
    while (i < this.numberOfHMetrics) {
      const advanceWidth = this.readUInt16((off + (i * 4)));
      this.glyphWidths.push(advanceWidth);
      i = i + 1;
    };
    if ( this.numberOfHMetrics > 0 ) {
      this.defaultWidth = this.glyphWidths[(this.numberOfHMetrics - 1)];
    }
  };
  parseNameTable () {
    const table = this.findTable("name");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const count = this.readUInt16((off + 2));
    const stringOffset = this.readUInt16((off + 4));
    let i = 0;
    while (i < count) {
      const recordOff = (off + 6) + (i * 12);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const languageID = this.readUInt16((recordOff + 4));
      const nameID = this.readUInt16((recordOff + 6));
      const length = this.readUInt16((recordOff + 8));
      const strOffset = this.readUInt16((recordOff + 10));
      if ( (nameID == 1) && (platformID == 3) ) {
        const strOff = (off + stringOffset) + strOffset;
        this.fontFamily = this.readUnicodeString(strOff, length);
      }
      if ( ((nameID == 1) && (platformID == 1)) && ((this.fontFamily.length) == 0) ) {
        const strOff_1 = (off + stringOffset) + strOffset;
        this.fontFamily = this.readAsciiString(strOff_1, length);
      }
      if ( (nameID == 2) && (platformID == 3) ) {
        const strOff_2 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readUnicodeString(strOff_2, length);
      }
      if ( ((nameID == 2) && (platformID == 1)) && ((this.fontStyle.length) == 0) ) {
        const strOff_3 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readAsciiString(strOff_3, length);
      }
      i = i + 1;
    };
  };
  isLoaded () {
    if ( this.numGlyphs <= 0 ) {
      return false;
    }
    return this.cmapOffset > 0;
  };
  getGlyphIndex (charCode) {
    if ( this.cmapOffset == 0 ) {
      return 0;
    }
    if ( this.cmapFormat == 12 ) {
      return this.getGlyphIndexFormat12(charCode);
    }
    if ( this.cmapFormat == 4 ) {
      return this.getGlyphIndexFormat4(charCode);
    }
    if ( this.cmapFormat == 0 ) {
      if ( (charCode >= 0) && (charCode < 256) ) {
        return this.readUInt8(((this.cmapOffset + 6) + charCode));
      }
    }
    if ( this.cmapFormat == 6 ) {
      const firstCode = this.readUInt16((this.cmapOffset + 6));
      const entryCount = this.readUInt16((this.cmapOffset + 8));
      if ( (charCode >= firstCode) && (charCode < (firstCode + entryCount)) ) {
        return this.readUInt16(((this.cmapOffset + 10) + ((charCode - firstCode) * 2)));
      }
    }
    return 0;
  };
  getGlyphIndexFormat12 (charCode) {
    const off = this.cmapOffset;
    const nGroups = this.readUInt32((off + 12));
    let lo = 0;
    let hi = nGroups - 1;
    while (lo <= hi) {
      const mid = Math.floor( ((lo + hi) / 2));
      const g = (off + 16) + (mid * 12);
      const startChar = this.readUInt32(g);
      const endChar = this.readUInt32((g + 4));
      if ( charCode < startChar ) {
        hi = mid - 1;
      } else {
        if ( charCode > endChar ) {
          lo = mid + 1;
        } else {
          const startGlyph = this.readUInt32((g + 8));
          return startGlyph + (charCode - startChar);
        }
      }
    };
    return 0;
  };
  getGlyphIndexFormat4 (charCode) {
    const off = this.cmapOffset;
    const segCountX2 = this.readUInt16((off + 6));
    const segCountD = (segCountX2) / 2.0;
    const segCount = Math.floor( segCountD);
    const endCodesOff = off + 14;
    const startCodesOff = (endCodesOff + segCountX2) + 2;
    const idDeltaOff = startCodesOff + segCountX2;
    const idRangeOffsetOff = idDeltaOff + segCountX2;
    let i = 0;
    while (i < segCount) {
      const endCode = this.readUInt16((endCodesOff + (i * 2)));
      const startCode = this.readUInt16((startCodesOff + (i * 2)));
      if ( (charCode >= startCode) && (charCode <= endCode) ) {
        const idDelta = this.readInt16((idDeltaOff + (i * 2)));
        const idRangeOffset = this.readUInt16((idRangeOffsetOff + (i * 2)));
        if ( idRangeOffset == 0 ) {
          return (charCode + idDelta) % 65536;
        } else {
          const glyphIdOff = ((idRangeOffsetOff + (i * 2)) + idRangeOffset) + ((charCode - startCode) * 2);
          const glyphId = this.readUInt16(glyphIdOff);
          if ( glyphId != 0 ) {
            return (glyphId + idDelta) % 65536;
          }
        }
      }
      i = i + 1;
    };
    return 0;
  };
  getGlyphWidth (glyphIndex) {
    if ( glyphIndex < (this.glyphWidths.length) ) {
      return this.glyphWidths[glyphIndex];
    }
    return this.defaultWidth;
  };
  buildCharWidthCache () {
    let i = 0;
    while (i < 256) {
      const glyphIdx = this.getGlyphIndex(i);
      const width = this.getGlyphWidth(glyphIdx);
      this.charWidths.push(width);
      i = i + 1;
    };
    this.charWidthsLoaded = true;
  };
  getCharWidth (charCode) {
    if ( (this.charWidthsLoaded && (charCode >= 0)) && (charCode < 256) ) {
      return this.charWidths[charCode];
    }
    const glyphIdx = this.getGlyphIndex(charCode);
    return this.getGlyphWidth(glyphIdx);
  };
  getCharWidthPoints (charCode, fontSize) {
    const fontUnits = this.getCharWidth(charCode);
    return ((fontUnits) * fontSize) / (this.unitsPerEm);
  };
  measureText (text, fontSize) {
    let width = 0.0;
    const __len = text.length;
    let i = 0;
    let prev = 0;
    let first = true;
    while (i < __len) {
      const ch = EVGCodepoint.codeAt(text, i);
      const step = EVGCodepoint.unitsAt(text, i);
      width = width + this.getCharWidthPoints(ch, fontSize);
      if ( first == false ) {
        width = width + this.kernPoints(prev, ch, fontSize);
      }
      prev = ch;
      first = false;
      i = i + step;
    };
    return width;
  };
  getAscender (fontSize) {
    return ((this.ascender) * fontSize) / (this.unitsPerEm);
  };
  getDescender (fontSize) {
    return ((this.descender) * fontSize) / (this.unitsPerEm);
  };
  getLineHeight (fontSize) {
    const asc = this.getAscender(fontSize);
    const desc = this.getDescender(fontSize);
    const gap = ((this.lineGap) * fontSize) / (this.unitsPerEm);
    return (asc - desc) + gap;
  };
  getFontData () {
    return this.fontData;
  };
  keepSet () {
    let keep = [];
    let i = 0;
    while (i < this.numGlyphs) {
      keep.push(false);
      i = i + 1;
    };
    if ( this.numGlyphs > 0 ) {
      keep[0] = true;
    }
    let c = 32;
    while (c < 256) {
      const cp = TrueTypeFont.winAnsiToUnicode(c);
      const g = this.getGlyphIndex(cp);
      if ( (g > 0) && (g < this.numGlyphs) ) {
        keep[g] = true;
      }
      c = c + 1;
    };
    let again = true;
    while (again) {
      again = false;
      let gi = 0;
      while (gi < this.numGlyphs) {
        if ( keep[gi] ) {
          const added = this.addComponents(gi, keep);
          if ( added ) {
            again = true;
          }
        }
        gi = gi + 1;
      };
    };
    return keep;
  };
  addComponents (gid, keep) {
    const glyf = this.findTable("glyf");
    const start = this.glyphStart(gid);
    const end = this.glyphEnd(gid);
    if ( (end - start) < 10 ) {
      return false;
    }
    const at = glyf.offset + start;
    const contours = this.readInt16(at);
    if ( contours >= 0 ) {
      return false;
    }
    let added = false;
    let p = at + 10;
    let more = true;
    while (more) {
      const flags = this.readUInt16(p);
      const comp = this.readUInt16((p + 2));
      if ( (comp >= 0) && (comp < this.numGlyphs) ) {
        if ( (keep[comp]) == false ) {
          keep[comp] = true;
          added = true;
        }
      }
      p = p + 4;
      if ( ((flags & 1)) != 0 ) {
        p = p + 4;
      } else {
        p = p + 2;
      }
      if ( ((flags & 8)) != 0 ) {
        p = p + 2;
      }
      if ( ((flags & 64)) != 0 ) {
        p = p + 4;
      }
      if ( ((flags & 128)) != 0 ) {
        p = p + 8;
      }
      more = ((flags & 32)) != 0;
      if ( p >= (glyf.offset + end) ) {
        more = false;
      }
    };
    return added;
  };
  glyphStart (gid) {
    return this.locaAt(gid);
  };
  glyphEnd (gid) {
    return this.locaAt((gid + 1));
  };
  locaAt (i) {
    const loca = this.findTable("loca");
    if ( this.indexToLocFormat == 0 ) {
      return this.readUInt16((loca.offset + (i * 2))) * 2;
    }
    return this.readUInt32((loca.offset + (i * 4)));
  };
  buildGlyf () {
    const keep = this.keepSet();
    let total = 0;
    let g = 0;
    while (g < this.numGlyphs) {
      if ( keep[g] ) {
        const __len = this.glyphEnd(g) - this.glyphStart(g);
        if ( __len > 0 ) {
          total = total + __len;
          while ((total % 2) != 0) {
            total = total + 1;
          };
        }
      }
      g = g + 1;
    };
    let out = [];
    out.push(total);
    let gi = 0;
    while (gi < this.numGlyphs) {
      let k = 0;
      if ( keep[gi] ) {
        k = 1;
      }
      out.push(k);
      gi = gi + 1;
    };
    return out;
  };
  pdfFontData () {
    let kept = [];
    let i = 0;
    while (i < (this.tables.length)) {
      const t = this.tables[i];
      if ( TrueTypeFont.keepsInPdf(t.tag) ) {
        kept.push(t);
      }
      i = i + 1;
    };
    if ( (kept.length) == 0 ) {
      return this.fontData;
    }
    const n = kept.length;
    let a = 0;
    while (a < n) {
      let b = a + 1;
      while (b < n) {
        const x = kept[a];
        const y = kept[b];
        if ( TrueTypeFont.tagLess(y.tag, x.tag) ) {
          kept[a] = y;
          kept[b] = x;
        }
        b = b + 1;
      };
      a = a + 1;
    };
    const plan = this.buildGlyf();
    const newGlyfLen = plan[0];
    let lengths = [];
    let li = 0;
    while (li < n) {
      const rl = kept[li];
      if ( rl.tag == "glyf" ) {
        lengths.push(newGlyfLen);
      } else {
        lengths.push(rl.length);
      }
      li = li + 1;
    };
    const headerLen = 12 + (16 * n);
    let offsets = [];
    let at = headerLen;
    let k = 0;
    while (k < n) {
      offsets.push(at);
      at = at + (lengths[k]);
      while ((at % 4) != 0) {
        at = at + 1;
      };
      k = k + 1;
    };
    const total = at;
    let out = (function(){ var b = new ArrayBuffer(total); b._view = new DataView(b); return b; })();
    TrueTypeFont.put32(out, 0, 65536);
    TrueTypeFont.put16(out, 4, n);
    let pow2 = 1;
    let log2 = 0;
    while ((pow2 * 2) <= n) {
      pow2 = pow2 * 2;
      log2 = log2 + 1;
    };
    TrueTypeFont.put16(out, 6, pow2 * 16);
    TrueTypeFont.put16(out, 8, log2);
    TrueTypeFont.put16(out, 10, (n * 16) - (pow2 * 16));
    let d = 0;
    while (d < n) {
      const rec = kept[d];
      const dst = offsets[d];
      const __len = lengths[d];
      if ( rec.tag == "glyf" ) {
        this.writeGlyf(out, dst, plan);
      } else {
        if ( rec.tag == "loca" ) {
          this.writeLoca(out, dst, plan);
        } else {
          const src = rec.offset;
          let c = 0;
          while (c < rec.length) {
            out._view.setUint8(dst + c, this.fontData._view.getUint8((src + c)));
            c = c + 1;
          };
        }
      }
      d = d + 1;
    };
    let e = 0;
    while (e < n) {
      const r2 = kept[e];
      const base = 12 + (16 * e);
      let ti = 0;
      while (ti < 4) {
        let ch = 32;
        if ( ti < (r2.tag.length) ) {
          ch = r2.tag.charCodeAt(ti );
        }
        out._view.setUint8(base + ti, ch);
        ti = ti + 1;
      };
      const off2 = offsets[e];
      const len2 = lengths[e];
      TrueTypeFont.put32(out, base + 4, TrueTypeFont.tableSum(out, off2, len2));
      TrueTypeFont.put32(out, base + 8, off2);
      TrueTypeFont.put32(out, base + 12, len2);
      e = e + 1;
    };
    return out;
  };
  writeGlyf (out, dst, plan) {
    let w = dst;
    let g = 0;
    while (g < this.numGlyphs) {
      if ( (plan[(g + 1)]) == 1 ) {
        const from = this.glyphStart(g);
        const to = this.glyphEnd(g);
        const __len = to - from;
        if ( __len > 0 ) {
          const glyf = this.findTable("glyf");
          let c = 0;
          while (c < __len) {
            out._view.setUint8(w + c, this.fontData._view.getUint8(((glyf.offset + from) + c)));
            c = c + 1;
          };
          w = w + __len;
          while (((w - dst) % 2) != 0) {
            out._view.setUint8(w, 0);
            w = w + 1;
          };
        }
      }
      g = g + 1;
    };
  };
  writeLoca (out, dst, plan) {
    let at = 0;
    let g = 0;
    while (g < this.numGlyphs) {
      TrueTypeFont.putLoca(out, dst, g, at, this.indexToLocFormat);
      if ( (plan[(g + 1)]) == 1 ) {
        const __len = this.glyphEnd(g) - this.glyphStart(g);
        if ( __len > 0 ) {
          at = at + __len;
          while ((at % 2) != 0) {
            at = at + 1;
          };
        }
      }
      g = g + 1;
    };
    TrueTypeFont.putLoca(out, dst, this.numGlyphs, at, this.indexToLocFormat);
  };
  getPostScriptName () {
    const name = this.fontFamily;
    let result = "";
    let i = 0;
    while (i < (name.length)) {
      const ch = name.charCodeAt(i );
      if ( ch != 32 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    if ( (result.length) == 0 ) {
      return "CustomFont";
    }
    return result;
  };
  readUInt8 (offset) {
    return this.fontData._view.getUint8(offset);
  };
  parseKerning () {
    const gpos = this.findTable("GPOS");
    if ( gpos.offset > 0 ) {
      this.parseGposKernFeature(gpos.offset);
      if ( (this.kernSubtables.length) > 0 ) {
        this.hasKerning = true;
      }
      return;
    }
    const kt = this.findTable("kern");
    if ( kt.offset > 0 ) {
      this.parseLegacyKern(kt.offset);
    }
  };
  parseGposKernFeature (gposOff) {
    const featureListOff = gposOff + this.readUInt16((gposOff + 6));
    const lookupListOff = gposOff + this.readUInt16((gposOff + 8));
    const featureCount = this.readUInt16(featureListOff);
    const lookupCount = this.readUInt16(lookupListOff);
    let f = 0;
    while (f < featureCount) {
      const recOff = (featureListOff + 2) + (f * 6);
      const tag = this.readTag(recOff);
      if ( tag == "kern" ) {
        const featOff = featureListOff + this.readUInt16((recOff + 4));
        const idxCount = this.readUInt16((featOff + 2));
        let li = 0;
        while (li < idxCount) {
          const lookupIndex = this.readUInt16(((featOff + 4) + (li * 2)));
          if ( lookupIndex < lookupCount ) {
            const lookupOff = lookupListOff + this.readUInt16(((lookupListOff + 2) + (lookupIndex * 2)));
            this.collectPairLookup(lookupOff, lookupIndex);
          }
          li = li + 1;
        };
      }
      f = f + 1;
    };
  };
  collectPairLookup (lookupOff, lookupIndex) {
    const lookupType = this.readUInt16(lookupOff);
    const subCount = this.readUInt16((lookupOff + 4));
    let i = 0;
    while (i < subCount) {
      const subOff = lookupOff + this.readUInt16(((lookupOff + 6) + (i * 2)));
      if ( lookupType == 2 ) {
        this.kernSubtables.push(subOff);
        this.kernSubtableLookups.push(lookupIndex);
      }
      if ( lookupType == 9 ) {
        const extType = this.readUInt16((subOff + 2));
        if ( extType == 2 ) {
          this.kernSubtables.push(subOff + this.readUInt32((subOff + 4)));
          this.kernSubtableLookups.push(lookupIndex);
        }
      }
      i = i + 1;
    };
  };
  parseGsubLigatures () {
    const table = this.findTable("GSUB");
    if ( table.offset == 0 ) {
      return;
    }
    const gsubOff = table.offset;
    const featureListOff = gsubOff + this.readUInt16((gsubOff + 6));
    const lookupListOff = gsubOff + this.readUInt16((gsubOff + 8));
    const featureCount = this.readUInt16(featureListOff);
    const lookupCount = this.readUInt16(lookupListOff);
    let f = 0;
    while (f < featureCount) {
      const recOff = (featureListOff + 2) + (f * 6);
      const tag = this.readTag(recOff);
      let wanted = false;
      if ( tag == "ccmp" ) {
        wanted = true;
      }
      if ( tag == "liga" ) {
        wanted = true;
      }
      if ( tag == "rlig" ) {
        wanted = true;
      }
      if ( wanted ) {
        const featOff = featureListOff + this.readUInt16((recOff + 4));
        const idxCount = this.readUInt16((featOff + 2));
        let li = 0;
        while (li < idxCount) {
          const lookupIndex = this.readUInt16(((featOff + 4) + (li * 2)));
          if ( lookupIndex < lookupCount ) {
            const lookupOff = lookupListOff + this.readUInt16(((lookupListOff + 2) + (lookupIndex * 2)));
            this.collectLigatureLookup(lookupOff);
          }
          li = li + 1;
        };
      }
      f = f + 1;
    };
    if ( (this.ligatureSubtables.length) > 0 ) {
      this.hasShaping = true;
    }
  };
  collectLigatureLookup (lookupOff) {
    const lookupType = this.readUInt16(lookupOff);
    const subCount = this.readUInt16((lookupOff + 4));
    let i = 0;
    while (i < subCount) {
      const subOff = lookupOff + this.readUInt16(((lookupOff + 6) + (i * 2)));
      if ( lookupType == 4 ) {
        this.ligatureSubtables.push(subOff);
      }
      if ( lookupType == 7 ) {
        const extType = this.readUInt16((subOff + 2));
        if ( extType == 4 ) {
          this.ligatureSubtables.push(subOff + this.readUInt32((subOff + 4)));
        }
      }
      i = i + 1;
    };
  };
  ligatureAt (gids, start) {
    this.ligatureMatched = 0;
    let best = 0;
    let bestLen = 0;
    const first = gids[start];
    const remaining = (gids.length) - start;
    let s = 0;
    while (s < (this.ligatureSubtables.length)) {
      const sub = this.ligatureSubtables[s];
      const cov = sub + this.readUInt16((sub + 2));
      const ci = this.coverageIndex(cov, first);
      if ( ci >= 0 ) {
        const setCount = this.readUInt16((sub + 4));
        if ( ci < setCount ) {
          const setOff = sub + this.readUInt16(((sub + 6) + (ci * 2)));
          const ligCount = this.readUInt16(setOff);
          let l = 0;
          while (l < ligCount) {
            const lig = setOff + this.readUInt16(((setOff + 2) + (l * 2)));
            const ligGlyph = this.readUInt16(lig);
            const compCount = this.readUInt16((lig + 2));
            if ( compCount <= remaining ) {
              let ok = true;
              let c = 1;
              while (c < compCount) {
                if ( this.readUInt16(((lig + 2) + (c * 2))) != (gids[(start + c)]) ) {
                  ok = false;
                  c = compCount;
                } else {
                  c = c + 1;
                }
              };
              if ( ok ) {
                if ( compCount > bestLen ) {
                  best = ligGlyph;
                  bestLen = compCount;
                }
              }
            }
            l = l + 1;
          };
        }
      }
      s = s + 1;
    };
    this.ligatureMatched = bestLen;
    return best;
  };
  shape (cps) {
    const run = new TTFShapedRun();
    let kept = [];
    let keptIndex = [];
    let i = 0;
    while (i < (cps.length)) {
      const cp = cps[i];
      if ( TrueTypeFont.isVariationSelector(cp) == false ) {
        kept.push(cp);
        keptIndex.push(i);
      }
      i = i + 1;
    };
    let gids = [];
    let k = 0;
    while (k < (kept.length)) {
      gids.push(this.getGlyphIndex((kept[k])));
      k = k + 1;
    };
    const n = gids.length;
    let p = 0;
    while (p < n) {
      let glyph = gids[p];
      let consumed = 1;
      if ( this.hasShaping ) {
        const lig = this.ligatureAt(gids, p);
        if ( this.ligatureMatched > 1 ) {
          glyph = lig;
          consumed = this.ligatureMatched;
        }
      }
      run.glyphs.push(glyph);
      run.clusterStart.push(keptIndex[p]);
      let endIdx = cps.length;
      if ( (p + consumed) < n ) {
        endIdx = keptIndex[(p + consumed)];
      }
      run.clusterEnd.push(endIdx);
      p = p + consumed;
    };
    return run;
  };
  shapeString (text) {
    return this.shape(EVGCodepoint.toArray(text));
  };
  shapeRange (cps, start, end) {
    let slice = [];
    let i = start;
    while (i < end) {
      slice.push(cps[i]);
      i = i + 1;
    };
    return this.shape(slice);
  };
  measureShapedText (text, fontSize) {
    const cps = EVGCodepoint.toArray(text);
    const n = cps.length;
    let total = 0.0;
    let i = 0;
    while (i < n) {
      const end = EVGGrapheme.clusterEnd(cps, i);
      total = total + this.measureShapedRange(cps, i, end, fontSize);
      i = end;
    };
    return total;
  };
  measureShapedRange (cps, start, end, fontSize) {
    const run = this.shapeRange(cps, start, end);
    const scale = fontSize / (this.unitsPerEm);
    let total = 0.0;
    let i = 0;
    while (i < (run.glyphs.length)) {
      total = total + ((this.getGlyphWidth((run.glyphs[i]))) * scale);
      i = i + 1;
    };
    return total;
  };
  measureShaped (text, fontSize) {
    const run = this.shapeString(text);
    const scale = fontSize / (this.unitsPerEm);
    let total = 0.0;
    let i = 0;
    while (i < (run.glyphs.length)) {
      total = total + ((this.getGlyphWidth((run.glyphs[i]))) * scale);
      i = i + 1;
    };
    return total;
  };
  parseLegacyKern (kernOff) {
    const nTables = this.readUInt16((kernOff + 2));
    if ( nTables < 1 ) {
      return;
    }
    const sub = kernOff + 4;
    const coverage = this.readUInt16((sub + 4));
    const format = Math.floor( (coverage / 256));
    const horizontal = (coverage % 2) == 1;
    if ( (format == 0) && horizontal ) {
      this.legacyKernPairs = this.readUInt16((sub + 6));
      this.legacyKernOffset = sub + 14;
      if ( this.legacyKernPairs > 0 ) {
        this.hasKerning = true;
      }
    }
  };
  kernAdvance (leftGlyph, rightGlyph) {
    if ( this.hasKerning == false ) {
      return 0;
    }
    if ( this.legacyKernOffset > 0 ) {
      return this.legacyKernAdvance(leftGlyph, rightGlyph);
    }
    let total = 0;
    let satisfied = 0 - 1;
    let i = 0;
    while (i < (this.kernSubtables.length)) {
      const lk = this.kernSubtableLookups[i];
      if ( lk != satisfied ) {
        const adj = this.pairAdvance((this.kernSubtables[i]), leftGlyph, rightGlyph);
        if ( this.pairMatched ) {
          total = total + adj;
          satisfied = lk;
        }
      }
      i = i + 1;
    };
    return total;
  };
  pairAdvance (st, leftGlyph, rightGlyph) {
    this.pairMatched = false;
    const posFormat = this.readUInt16(st);
    const coverageOff = st + this.readUInt16((st + 2));
    const valueFormat1 = this.readUInt16((st + 4));
    const valueFormat2 = this.readUInt16((st + 6));
    const covIndex = this.coverageIndex(coverageOff, leftGlyph);
    if ( covIndex < 0 ) {
      return 0;
    }
    const v1Size = this.valueRecordSize(valueFormat1);
    const v2Size = this.valueRecordSize(valueFormat2);
    if ( posFormat == 1 ) {
      const pairSetOff = st + this.readUInt16(((st + 10) + (covIndex * 2)));
      const pairCount = this.readUInt16(pairSetOff);
      const recSize = (2 + v1Size) + v2Size;
      let lo = 0;
      let hi = pairCount - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const recOff = (pairSetOff + 2) + (mid * recSize);
        const second = this.readUInt16(recOff);
        if ( second == rightGlyph ) {
          this.pairMatched = true;
          return this.valueXAdvance((recOff + 2), valueFormat1);
        }
        if ( second < rightGlyph ) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      };
      return 0;
    }
    if ( posFormat == 2 ) {
      const classDef1 = st + this.readUInt16((st + 8));
      const classDef2 = st + this.readUInt16((st + 10));
      const class2Count = this.readUInt16((st + 14));
      const c1 = this.glyphClass(classDef1, leftGlyph);
      const c2 = this.glyphClass(classDef2, rightGlyph);
      const recSize_1 = v1Size + v2Size;
      const recOff_1 = (st + 16) + (((c1 * class2Count) + c2) * recSize_1);
      this.pairMatched = true;
      return this.valueXAdvance(recOff_1, valueFormat1);
    }
    return 0;
  };
  valueRecordSize (format) {
    let size = 0;
    let bit = 0;
    while (bit < 8) {
      const mask = this.powTwo(bit);
      if ( this.hasBit(format, mask) ) {
        size = size + 2;
      }
      bit = bit + 1;
    };
    return size;
  };
  valueXAdvance (recOff, format) {
    if ( this.hasBit(format, 4) == false ) {
      return 0;
    }
    let off = recOff;
    if ( this.hasBit(format, 1) ) {
      off = off + 2;
    }
    if ( this.hasBit(format, 2) ) {
      off = off + 2;
    }
    return this.readInt16(off);
  };
  powTwo (n) {
    let v = 1;
    let i = 0;
    while (i < n) {
      v = v * 2;
      i = i + 1;
    };
    return v;
  };
  hasBit (value, mask) {
    return ((Math.floor( (value / mask))) % 2) == 1;
  };
  coverageIndex (cov, glyph) {
    const format = this.readUInt16(cov);
    if ( format == 1 ) {
      const count = this.readUInt16((cov + 2));
      let lo = 0;
      let hi = count - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const g = this.readUInt16(((cov + 4) + (mid * 2)));
        if ( g == glyph ) {
          return mid;
        }
        if ( g < glyph ) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      };
      return 0 - 1;
    }
    if ( format == 2 ) {
      const rangeCount = this.readUInt16((cov + 2));
      let lo2 = 0;
      let hi2 = rangeCount - 1;
      while (lo2 <= hi2) {
        const mid2 = Math.floor( ((lo2 + hi2) / 2));
        const rec = (cov + 4) + (mid2 * 6);
        const start = this.readUInt16(rec);
        const end = this.readUInt16((rec + 2));
        if ( glyph < start ) {
          hi2 = mid2 - 1;
        } else {
          if ( glyph > end ) {
            lo2 = mid2 + 1;
          } else {
            return this.readUInt16((rec + 4)) + (glyph - start);
          }
        }
      };
      return 0 - 1;
    }
    return 0 - 1;
  };
  glyphClass (cd, glyph) {
    const format = this.readUInt16(cd);
    if ( format == 1 ) {
      const startGlyph = this.readUInt16((cd + 2));
      const count = this.readUInt16((cd + 4));
      if ( glyph < startGlyph ) {
        return 0;
      }
      if ( glyph >= (startGlyph + count) ) {
        return 0;
      }
      return this.readUInt16(((cd + 6) + ((glyph - startGlyph) * 2)));
    }
    if ( format == 2 ) {
      const rangeCount = this.readUInt16((cd + 2));
      let lo = 0;
      let hi = rangeCount - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const rec = (cd + 4) + (mid * 6);
        const start = this.readUInt16(rec);
        const end = this.readUInt16((rec + 2));
        if ( glyph < start ) {
          hi = mid - 1;
        } else {
          if ( glyph > end ) {
            lo = mid + 1;
          } else {
            return this.readUInt16((rec + 4));
          }
        }
      };
      return 0;
    }
    return 0;
  };
  legacyKernAdvance (leftGlyph, rightGlyph) {
    let lo = 0;
    let hi = this.legacyKernPairs - 1;
    while (lo <= hi) {
      const mid = Math.floor( ((lo + hi) / 2));
      const rec = this.legacyKernOffset + (mid * 6);
      const l = this.readUInt16(rec);
      const r = this.readUInt16((rec + 2));
      if ( l == leftGlyph ) {
        if ( r == rightGlyph ) {
          return this.readInt16((rec + 4));
        }
      }
      const key = (l * 65536) + r;
      const want = (leftGlyph * 65536) + rightGlyph;
      if ( key < want ) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    };
    return 0;
  };
  kernUnits (leftChar, rightChar) {
    if ( this.hasKerning == false ) {
      return 0;
    }
    const lg = this.getGlyphIndex(leftChar);
    const rg = this.getGlyphIndex(rightChar);
    if ( (lg == 0) || (rg == 0) ) {
      return 0;
    }
    return this.kernAdvance(lg, rg);
  };
  kernPoints (leftChar, rightChar, fontSize) {
    if ( this.hasKerning == false ) {
      return 0.0;
    }
    const lg = this.getGlyphIndex(leftChar);
    const rg = this.getGlyphIndex(rightChar);
    if ( (lg == 0) || (rg == 0) ) {
      return 0.0;
    }
    const units = this.kernAdvance(lg, rg);
    if ( units == 0 ) {
      return 0.0;
    }
    return ((units) * fontSize) / (this.unitsPerEm);
  };
  readUInt16 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    return (b1 * 256) + b2;
  };
  readInt16 (offset) {
    const val = this.readUInt16(offset);
    if ( val >= 32768 ) {
      return val - 65536;
    }
    return val;
  };
  readUInt32 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    const b3 = this.fontData._view.getUint8((offset + 2));
    const b4 = this.fontData._view.getUint8((offset + 3));
    const result = (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
    return result;
  };
  readTag (offset) {
    let result = "";
    let i = 0;
    while (i < 4) {
      const ch = this.fontData._view.getUint8((offset + i));
      result = result + (String.fromCharCode(ch));
      i = i + 1;
    };
    return result;
  };
  readAsciiString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.fontData._view.getUint8((offset + i));
      if ( ch > 0 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    return result;
  };
  readUnicodeString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.readUInt16((offset + i));
      if ( (ch > 0) && (ch < 128) ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 2;
    };
    return result;
  };
  printInfo () {
    console.log((("Font: " + this.fontFamily) + " ") + this.fontStyle);
    console.log("  Units per EM: " + ((this.unitsPerEm.toString())));
    console.log("  Ascender: " + ((this.ascender.toString())));
    console.log("  Descender: " + ((this.descender.toString())));
    console.log("  Line gap: " + ((this.lineGap.toString())));
    console.log("  Num glyphs: " + ((this.numGlyphs.toString())));
    console.log("  Num hMetrics: " + ((this.numberOfHMetrics.toString())));
    console.log("  Tables: " + (((this.tables.length).toString())));
  };
}
TrueTypeFont.keepsInPdf = function(tag) {
  if ( tag == "glyf" ) {
    return true;
  }
  if ( tag == "head" ) {
    return true;
  }
  if ( tag == "hhea" ) {
    return true;
  }
  if ( tag == "hmtx" ) {
    return true;
  }
  if ( tag == "loca" ) {
    return true;
  }
  if ( tag == "maxp" ) {
    return true;
  }
  if ( tag == "cvt " ) {
    return true;
  }
  if ( tag == "fpgm" ) {
    return true;
  }
  if ( tag == "prep" ) {
    return true;
  }
  if ( tag == "cmap" ) {
    return true;
  }
  if ( tag == "name" ) {
    return true;
  }
  if ( tag == "OS/2" ) {
    return true;
  }
  if ( tag == "post" ) {
    return true;
  }
  return false;
};
TrueTypeFont.winAnsiToUnicode = function(b) {
  if ( (b < 128) || (b > 159) ) {
    return b;
  }
  const _map = [8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376];
  return _map[(b - 128)];
};
TrueTypeFont.tableSum = function(b, at, __len) {
  let sum = 0;
  let i = 0;
  while (i < __len) {
    let w = 0;
    let j = 0;
    while (j < 4) {
      let byte = 0;
      if ( (i + j) < __len ) {
        byte = b._view.getUint8(((at + i) + j));
      }
      w = (w * 256) + byte;
      j = j + 1;
    };
    sum = ((sum + w) & 4294967295);
    i = i + 4;
  };
  return sum;
};
TrueTypeFont.putLoca = function(out, dst, i, value, format) {
  if ( format == 0 ) {
    TrueTypeFont.put16(out, dst + (i * 2), Math.floor( (value / 2)));
  } else {
    TrueTypeFont.put32(out, dst + (i * 4), value);
  }
};
TrueTypeFont.tagLess = function(a, b) {
  let i = 0;
  while (i < 4) {
    let ca = 32;
    let cb = 32;
    if ( i < (a.length) ) {
      ca = a.charCodeAt(i );
    }
    if ( i < (b.length) ) {
      cb = b.charCodeAt(i );
    }
    if ( ca != cb ) {
      return ca < cb;
    }
    i = i + 1;
  };
  return false;
};
TrueTypeFont.put16 = function(b, at, v) {
  b._view.setUint8(at, (((v >> 8)) & 255));
  b._view.setUint8(at + 1, (v & 255));
};
TrueTypeFont.put32 = function(b, at, v) {
  b._view.setUint8(at, (((v >> 24)) & 255));
  b._view.setUint8(at + 1, (((v >> 16)) & 255));
  b._view.setUint8(at + 2, (((v >> 8)) & 255));
  b._view.setUint8(at + 3, (v & 255));
};
TrueTypeFont.isVariationSelector = function(cp) {
  if ( cp == 65038 ) {
    return true;
  }
  return cp == 65039;
};
class FontManager  {
  constructor() {
    this.fonts = [];
    this.fontNames = [];
    this.fontsDirectory = "./Fonts";
    this.fontsDirectories = [];
    this.resolvedDirectory = "";
    this.defaultFont = new TrueTypeFont();
    this.hasDefaultFont = false;
    let f = [];
    this.fonts = f;
    let n = [];
    this.fontNames = n;
    let fd = [];
    this.fontsDirectories = fd;
  }
  setFontsDirectory (path) {
    this.fontsDirectory = path;
  };
  getFontCount () {
    return this.fonts.length;
  };
  addFontsDirectory (path) {
    this.fontsDirectories.push(path);
  };
  setFontsDirectories (paths) {
    let start = 0;
    let i = 0;
    const __len = paths.length;
    while (i <= __len) {
      let ch = "";
      if ( i < __len ) {
        ch = paths.substring(i, (i + 1) );
      }
      if ( (ch == ";") || (i == __len) ) {
        if ( i > start ) {
          const part = paths.substring(start, i );
          this.fontsDirectories.push(part);
          console.log("FontManager: Added fonts directory: " + part);
        }
        start = i + 1;
      }
      i = i + 1;
    };
    if ( (this.fontsDirectories.length) > 0 ) {
      this.fontsDirectory = this.fontsDirectories[0];
    }
  };
  addFontBuffer (name, data) {
    const font = new TrueTypeFont();
    if ( font.loadFromBuffer(name, data) == false ) {
      return false;
    }
    this.fonts.push(font);
    this.fontNames.push(font.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font;
      this.hasDefaultFont = true;
    }
    return true;
  };
  loadFont (relativePath) {
    let i = 0;
    while (i < (this.fontsDirectories.length)) {
      const dir = this.fontsDirectories[i];
      const fullPath = (dir + "/") + relativePath;
      const font = new TrueTypeFont();
      if ( font.loadFromFile(fullPath) == true ) {
        this.fonts.push(font);
        this.fontNames.push(font.fontFamily);
        if ( (this.resolvedDirectory.length) == 0 ) {
          this.resolvedDirectory = dir;
        }
        if ( this.hasDefaultFont == false ) {
          this.defaultFont = font;
          this.hasDefaultFont = true;
        }
        console.log((((("FontManager: Loaded font '" + font.fontFamily) + "' (") + font.fontStyle) + ") from ") + fullPath);
        return true;
      }
      i = i + 1;
    };
    let separator = "/";
    const dirLen = this.fontsDirectory.length;
    if ( dirLen > 0 ) {
      const lastChar = this.fontsDirectory.substring((dirLen - 1), dirLen );
      if ( lastChar == "/" ) {
        separator = "";
      }
    }
    const fullPath_1 = (this.fontsDirectory + separator) + relativePath;
    console.log("FontManager: Trying to load font from: " + fullPath_1);
    const font_1 = new TrueTypeFont();
    if ( font_1.loadFromFile(fullPath_1) == false ) {
      console.log(((("FontManager: Failed to load font: " + relativePath) + " (full path: ") + fullPath_1) + ")");
      return false;
    }
    this.fonts.push(font_1);
    this.fontNames.push(font_1.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font_1;
      this.hasDefaultFont = true;
    }
    console.log(((("FontManager: Loaded font '" + font_1.fontFamily) + "' (") + font_1.fontStyle) + ")");
    return true;
  };
  loadFontBuffer (name, data) {
    const font = new TrueTypeFont();
    if ( font.loadFromBuffer(name, data) == false ) {
      return false;
    }
    this.fonts.push(font);
    this.fontNames.push(font.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font;
      this.hasDefaultFont = true;
    }
    return true;
  };
  loadFontFamily (familyDir) {
    this.loadFont(((familyDir + "/") + familyDir) + "-Regular.ttf");
  };
  getFont (fontFamily) {
    const slashIdx = fontFamily.indexOf("/");
    let searchFamily = fontFamily;
    let searchStyle = "";
    if ( slashIdx >= 0 ) {
      searchFamily = fontFamily.substring(0, slashIdx );
      const afterSlash = fontFamily.substring((slashIdx + 1), (fontFamily.length) );
      const dashIdx = afterSlash.indexOf("-");
      if ( dashIdx >= 0 ) {
        searchStyle = afterSlash.substring((dashIdx + 1), (afterSlash.length) );
      }
    } else {
      const dashIdx_1 = fontFamily.indexOf("-");
      if ( dashIdx_1 >= 0 ) {
        searchFamily = fontFamily.substring(0, dashIdx_1 );
        searchStyle = fontFamily.substring((dashIdx_1 + 1), (fontFamily.length) );
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.fontFamily == searchFamily ) {
        if ( (searchStyle.length) > 0 ) {
          if ( f.fontStyle == searchStyle ) {
            return f;
          }
        } else {
          return f;
        }
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_1 = this.fonts[i];
      if ( f_1.fontFamily == searchFamily ) {
        if ( (searchStyle.length) > 0 ) {
          if ( (f_1.fontStyle.indexOf(searchStyle)) >= 0 ) {
            return f_1;
          }
        }
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_2 = this.fonts[i];
      if ( f_2.fontFamily == fontFamily ) {
        return f_2;
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_3 = this.fonts[i];
      if ( (f_3.fontFamily.indexOf(fontFamily)) >= 0 ) {
        return f_3;
      }
      i = i + 1;
    };
    return this.defaultFont;
  };
  hasFont (fontFamily) {
    if ( (this.fonts.length) == 0 ) {
      return false;
    }
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm == 0 ) {
      return false;
    }
    const slashIdx = fontFamily.indexOf("/");
    let searchFamily = fontFamily;
    if ( slashIdx >= 0 ) {
      searchFamily = fontFamily.substring(0, slashIdx );
    } else {
      const dashIdx = fontFamily.indexOf("-");
      if ( dashIdx >= 0 ) {
        searchFamily = fontFamily.substring(0, dashIdx );
      }
    }
    return (font.fontFamily == searchFamily) || (font.fontFamily == fontFamily);
  };
  faceForCodepoint (fontFamily, cp) {
    const primary = this.getFont(fontFamily);
    if ( primary.isLoaded() ) {
      if ( primary.getGlyphIndex(cp) > 0 ) {
        return primary;
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( f.getGlyphIndex(cp) > 0 ) {
          return f;
        }
      }
      i = i + 1;
    };
    return primary;
  };
  fallbackFace (cp) {
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( f.getGlyphIndex(cp) > 0 ) {
          return f;
        }
      }
      i = i + 1;
    };
    const none = new TrueTypeFont();
    return none;
  };
  faceForClusterFrom (primary, cps, start, end) {
    const base = cps[start];
    if ( (end - start) <= 1 ) {
      if ( primary.isLoaded() ) {
        if ( primary.getGlyphIndex(base) > 0 ) {
          return primary;
        }
      }
      return this.fallbackFace(base);
    }
    if ( primary.isLoaded() ) {
      if ( FontManager.coversCluster(primary, cps, start, end) ) {
        return primary;
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( FontManager.coversCluster(f, cps, start, end) ) {
          return f;
        }
      }
      i = i + 1;
    };
    if ( primary.isLoaded() ) {
      if ( primary.getGlyphIndex(base) > 0 ) {
        return primary;
      }
    }
    return this.fallbackFace(base);
  };
  faceForCluster (fontFamily, cps, start, end) {
    return this.faceForClusterFrom(this.getFont(fontFamily), cps, start, end);
  };
  needsFallback (fontFamily, cp) {
    const primary = this.getFont(fontFamily);
    if ( primary.isLoaded() == false ) {
      return false;
    }
    return primary.getGlyphIndex(cp) == 0;
  };
  measureText (text, fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.isLoaded() == false ) {
      return (((text.length)) * fontSize) * 0.5;
    }
    const cps = EVGCodepoint.toArray(text);
    const n = cps.length;
    let width = 0.0;
    let i = 0;
    let prev = 0;
    let prevWasPrimary = false;
    let first = true;
    while (i < n) {
      const end = EVGGrapheme.clusterEnd(cps, i);
      const found = this.faceForClusterFrom(font, cps, i, end);
      let face = font;
      if ( found.isLoaded() ) {
        face = found;
      }
      const isPrimary = face.fontPath == font.fontPath;
      if ( isPrimary ) {
        let c = i;
        while (c < end) {
          const cp = cps[c];
          width = width + face.getCharWidthPoints(cp, fontSize);
          if ( first == false ) {
            if ( prevWasPrimary ) {
              width = width + face.kernPoints(prev, cp, fontSize);
            }
          }
          prev = cp;
          prevWasPrimary = true;
          first = false;
          c = c + 1;
        };
      } else {
        width = width + face.measureShapedRange(cps, i, end, fontSize);
        prev = cps[i];
        prevWasPrimary = false;
        first = false;
      }
      i = end;
    };
    return width;
  };
  getLineHeight (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getLineHeight(fontSize);
    }
    return fontSize * 1.2;
  };
  getAscender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getAscender(fontSize);
    }
    return fontSize * 0.8;
  };
  getDescender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getDescender(fontSize);
    }
    return fontSize * -0.2;
  };
  getFontData (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getFontData();
  };
  getPostScriptName (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getPostScriptName();
  };
  printLoadedFonts () {
    console.log(("FontManager: " + (((this.fonts.length).toString()))) + " fonts loaded:");
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      console.log(((("  - " + f.fontFamily) + " (") + f.fontStyle) + ")");
      i = i + 1;
    };
  };
}
FontManager.coversCluster = function(f, cps, start, end) {
  let i = start;
  while (i < end) {
    const cp = cps[i];
    let skip = EVGGrapheme.isZWJ(cp);
    if ( (cp >= 65024) && (cp <= 65039) ) {
      skip = true;
    }
    if ( skip == false ) {
      if ( f.getGlyphIndex(cp) == 0 ) {
        return false;
      }
    }
    i = i + 1;
  };
  return true;
};
class TTFTextMeasurer  extends EVGTextMeasurer {
  constructor(fm) {
    super(fm)
    this.fontManager = fm;
  }
  isFontAccurate () {
    return true;
  };
  hasFace (fontFamily) {
    return this.fontManager.hasFont(fontFamily);
  };
  measureText (text, fontFamily, fontSize) {
    const width = this.fontManager.measureText(text, fontFamily, fontSize);
    const lineHeight = this.fontManager.getLineHeight(fontFamily, fontSize);
    const ascent = this.fontManager.getAscender(fontFamily, fontSize);
    const descent = this.fontManager.getDescender(fontFamily, fontSize);
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = ascent;
    metrics.descent = descent;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    return this.fontManager.measureText(text, fontFamily, fontSize);
  };
  getLineHeight (fontFamily, fontSize) {
    return this.fontManager.getLineHeight(fontFamily, fontSize);
  };
  measureChar (ch, fontFamily, fontSize) {
    const font = this.fontManager.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getCharWidthPoints(ch, fontSize);
    }
    return fontSize * 0.5;
  };
}
class GlyphPoint  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
    this.onCurve = true;
  }
  init (px, py, on) {
    this.x = px;
    this.y = py;
    this.onCurve = on;
  };
}
class GlyphContour  {
  constructor() {
    this.points = [];
    let p_1 = [];
    this.points = p_1;
  }
  addPoint (x, y, onCurve) {
    const pt = new GlyphPoint();
    pt.init(x, y, onCurve);
    this.points.push(pt);
  };
  numPoints () {
    return this.points.length;
  };
}
class GlyphOutline  {
  constructor() {
    this.contours = [];
    this.xMin = 0.0;
    this.yMin = 0.0;
    this.xMax = 0.0;
    this.yMax = 0.0;
    this.advanceWidth = 0.0;
    this.leftSideBearing = 0.0;     /** note: unused */
    let c_1 = [];
    this.contours = c_1;
  }
  addContour (contour) {
    this.contours.push(contour);
  };
}
class RasterText  {
  constructor() {
    this.compositor = new RasterCompositor();
    this.debug = false;
    this.compositeDepth = 0;
    this.hasFallbackManager = false;
    this.fallbackColorSet = false;
    this.fallbackR = 0;
    this.fallbackG = 0;
    this.fallbackB = 0;
    this.rasterizer = new VectorRasterizer();
    this.glyfOffset = 0;
    this.locaOffset = 0;
    this.locaFormat = 0;
  }
  setFont (ttf) {
    this.font = ttf;
    this.findTableOffsets();
  };
  setFallbackManager (fm) {
    this.fallbackManager = fm;
    this.hasFallbackManager = true;
  };
  setFallbackColor (r, g, b) {
    this.fallbackColorSet = true;
    this.fallbackR = r;
    this.fallbackG = g;
    this.fallbackB = b;
  };
  clearFallbackColor () {
    this.fallbackColorSet = false;
  };
  measureTextWidth (text, fontSize) {
    if ( this.font.unitsPerEm <= 0 ) {
      return 0.0;
    }
    return this.font.measureText(text, fontSize);
  };
  findTableOffsets () {
    let i = 0;
    const numTables = this.font.tables.length;
    while (i < numTables) {
      const t = this.font.tables[i];
      if ( t.tag == "glyf" ) {
        this.glyfOffset = t.offset;
      }
      if ( t.tag == "loca" ) {
        this.locaOffset = t.offset;
      }
      i = i + 1;
    };
    this.locaFormat = this.font.indexToLocFormat;
  };
  getGlyphOffset (glyphIndex) {
    if ( this.locaFormat == 0 ) {
      const off = this.locaOffset + (glyphIndex * 2);
      const offset16 = this.readUInt16(off);
      return offset16 * 2;
    }
    const off_1 = this.locaOffset + (glyphIndex * 4);
    return this.readUInt32(off_1);
  };
  getGlyphLength (glyphIndex) {
    const start = this.getGlyphOffset(glyphIndex);
    const end = this.getGlyphOffset((glyphIndex + 1));
    return end - start;
  };
  parseGlyph (glyphIndex, fontSize) {
    const outline = new GlyphOutline();
    const scale = fontSize / (this.font.unitsPerEm);
    const glyphLen = this.getGlyphLength(glyphIndex);
    if ( glyphLen == 0 ) {
      outline.advanceWidth = (this.font.getGlyphWidth(glyphIndex)) * scale;
      return outline;
    }
    const off = this.glyfOffset + this.getGlyphOffset(glyphIndex);
    const numberOfContours = this.readInt16(off);
    outline.xMin = this.readInt16((off + 2));
    outline.yMin = this.readInt16((off + 4));
    outline.xMax = this.readInt16((off + 6));
    outline.yMax = this.readInt16((off + 8));
    if ( numberOfContours < 0 ) {
      this.parseComposite(outline, off, fontSize);
      outline.advanceWidth = (this.font.getGlyphWidth(glyphIndex)) * scale;
      return outline;
    }
    if ( numberOfContours == 0 ) {
      return outline;
    }
    let endPts = [];
    let i = 0;
    while (i < numberOfContours) {
      const endPt = this.readUInt16(((off + 10) + (i * 2)));
      endPts.push(endPt);
      i = i + 1;
    };
    const instrLen = this.readUInt16(((off + 10) + (numberOfContours * 2)));
    const dataOff = (((off + 10) + (numberOfContours * 2)) + 2) + instrLen;
    const lastEndPt = endPts[(numberOfContours - 1)];
    const numPoints = lastEndPt + 1;
    if ( numPoints > 10000 ) {
      if ( this.debug ) {
        console.log("Warning: Too many points in glyph: " + ((numPoints.toString())));
      }
      return outline;
    }
    let flags = [];
    let flagOff = dataOff;
    i = 0;
    while (i < numPoints) {
      const flag = this.readUInt8(flagOff);
      flags.push(flag);
      flagOff = flagOff + 1;
      i = i + 1;
      if ( ((flag & 8)) != 0 ) {
        const repeatCount = this.readUInt8(flagOff);
        flagOff = flagOff + 1;
        let j = 0;
        while ((j < repeatCount) && (i < numPoints)) {
          flags.push(flag);
          j = j + 1;
          i = i + 1;
        };
      }
    };
    let xCoords = [];
    let xOff = flagOff;
    let x = 0;
    i = 0;
    while (i < numPoints) {
      const flag_1 = flags[i];
      const xShort = ((flag_1 & 2)) != 0;
      const xSame = ((flag_1 & 16)) != 0;
      if ( xShort ) {
        const dx = this.readUInt8(xOff);
        xOff = xOff + 1;
        if ( xSame ) {
          x = x + dx;
        } else {
          x = x - dx;
        }
      } else {
        if ( xSame == false ) {
          const dx_1 = this.readInt16(xOff);
          xOff = xOff + 2;
          x = x + dx_1;
        }
      }
      xCoords.push(x);
      i = i + 1;
    };
    let yCoords = [];
    let yOff = xOff;
    let y = 0;
    i = 0;
    while (i < numPoints) {
      const flag_2 = flags[i];
      const yShort = ((flag_2 & 4)) != 0;
      const ySame = ((flag_2 & 32)) != 0;
      if ( yShort ) {
        const dy = this.readUInt8(yOff);
        yOff = yOff + 1;
        if ( ySame ) {
          y = y + dy;
        } else {
          y = y - dy;
        }
      } else {
        if ( ySame == false ) {
          const dy_1 = this.readInt16(yOff);
          yOff = yOff + 2;
          y = y + dy_1;
        }
      }
      yCoords.push(y);
      i = i + 1;
    };
    const scale_2 = fontSize / (this.font.unitsPerEm);
    let startPt = 0;
    let contourIdx = 0;
    while (contourIdx < numberOfContours) {
      const endPt_1 = endPts[contourIdx];
      const contour = new GlyphContour();
      let ptIdx = startPt;
      while (ptIdx <= endPt_1) {
        const px = ((xCoords[ptIdx])) * scale_2;
        const py = ((yCoords[ptIdx])) * scale_2;
        const flag_3 = flags[ptIdx];
        const onCurve = ((flag_3 & 1)) != 0;
        contour.addPoint(px, py, onCurve);
        ptIdx = ptIdx + 1;
      };
      outline.addContour(contour);
      startPt = endPt_1 + 1;
      contourIdx = contourIdx + 1;
    };
    outline.advanceWidth = (this.font.getGlyphWidth(glyphIndex)) * scale_2;
    return outline;
  };
  parseComposite (outline, off, fontSize) {
    if ( this.compositeDepth > 4 ) {
      return;
    }
    this.compositeDepth = this.compositeDepth + 1;
    const scale = fontSize / (this.font.unitsPerEm);
    let p = off + 10;
    let more = true;
    while (more) {
      const flags = this.readUInt16(p);
      const compGlyph = this.readUInt16((p + 2));
      p = p + 4;
      let a1 = 0;
      let a2 = 0;
      if ( ((flags & 1)) != 0 ) {
        a1 = this.readInt16(p);
        a2 = this.readInt16((p + 2));
        p = p + 4;
      } else {
        a1 = this.readInt8(p);
        a2 = this.readInt8((p + 1));
        p = p + 2;
      }
      let dx = 0.0;
      let dy = 0.0;
      if ( ((flags & 2)) != 0 ) {
        dx = a1;
        dy = a2;
      }
      let xScale = 1.0;
      let yScale = 1.0;
      let scale01 = 0.0;
      let scale10 = 0.0;
      if ( ((flags & 8)) != 0 ) {
        xScale = this.readF2Dot14(p);
        yScale = xScale;
        p = p + 2;
      } else {
        if ( ((flags & 64)) != 0 ) {
          xScale = this.readF2Dot14(p);
          yScale = this.readF2Dot14((p + 2));
          p = p + 4;
        } else {
          if ( ((flags & 128)) != 0 ) {
            xScale = this.readF2Dot14(p);
            scale01 = this.readF2Dot14((p + 2));
            scale10 = this.readF2Dot14((p + 4));
            yScale = this.readF2Dot14((p + 6));
            p = p + 8;
          }
        }
      }
      const comp = this.parseGlyph(compGlyph, fontSize);
      const ox = dx * scale;
      const oy = dy * scale;
      let ci = 0;
      while (ci < (comp.contours.length)) {
        const src = comp.contours[ci];
        const dst = new GlyphContour();
        let pi = 0;
        while (pi < (src.points.length)) {
          const pt = src.points[pi];
          const nx = ((pt.x * xScale) + (pt.y * scale10)) + ox;
          const ny = ((pt.x * scale01) + (pt.y * yScale)) + oy;
          dst.addPoint(nx, ny, pt.onCurve);
          pi = pi + 1;
        };
        outline.addContour(dst);
        ci = ci + 1;
      };
      more = ((flags & 32)) != 0;
    };
    this.compositeDepth = this.compositeDepth - 1;
  };
  readF2Dot14 (offset) {
    return (this.readInt16(offset)) / 16384.0;
  };
  readInt8 (offset) {
    const v = this.readUInt8(offset);
    if ( v >= 128 ) {
      return v - 256;
    }
    return v;
  };
  setTransform (a, b, c, d, e, f) {
    this.rasterizer.setTransform(a, b, c, d, e, f);
  };
  clearTransform () {
    this.rasterizer.clearTransform();
  };
  setClipRect (x0, y0, x1, y1) {
    this.rasterizer.setClipRect(x0, y0, x1, y1);
  };
  clearClip () {
    this.rasterizer.clearClip();
  };
  renderGlyph (buf, outline, x, y, r, g, b, a) {
    this.rasterizer.reset();
    const numContours = outline.contours.length;
    if ( this.debug ) {
      console.log(((((("  renderGlyph: numContours=" + ((numContours.toString()))) + " pos=(") + ((x.toString()))) + ",") + ((y.toString()))) + ")");
    }
    let cIdx = 0;
    while (cIdx < numContours) {
      const contour = outline.contours[cIdx];
      const numPts = contour.numPoints();
      if ( this.debug ) {
        console.log((("    contour " + ((cIdx.toString()))) + ": numPoints=") + ((numPts.toString())));
      }
      if ( numPts >= 2 ) {
        this.flattenContourToField(contour, x, y);
      }
      cIdx = cIdx + 1;
    };
    if ( this.debug ) {
      console.log("    total edges after flatten: " + ((this.rasterizer.edgeCount().toString())));
    }
    const rule = VectorRasterizer.nonZero();
    this.rasterizer.fillAA(buf, r, g, b, a, rule);
  };
  addEdgeToField (x1, y1, x2, y2) {
    this.rasterizer.addEdge(x1, y1, x2, y2);
  };
  flattenContourToField (contour, offsetX, offsetY) {
    const numPts = contour.numPoints();
    if ( numPts < 2 ) {
      return;
    }
    let startX = 0.0;
    let startY = 0.0;
    const firstPt = contour.points[0];
    if ( firstPt.onCurve ) {
      startX = firstPt.x + offsetX;
      startY = offsetY - firstPt.y;
    } else {
      const lastPt = contour.points[(numPts - 1)];
      if ( lastPt.onCurve ) {
        startX = lastPt.x + offsetX;
        startY = offsetY - lastPt.y;
      } else {
        startX = ((firstPt.x + lastPt.x) / 2.0) + offsetX;
        startY = offsetY - ((firstPt.y + lastPt.y) / 2.0);
      }
    }
    let currX = startX;
    let currY = startY;
    let i = 0;
    while (i < numPts) {
      const pt = contour.points[i];
      const nextIdx = (i + 1) % numPts;
      const nextPt = contour.points[nextIdx];
      if ( pt.onCurve ) {
        if ( nextPt.onCurve ) {
          const nx = nextPt.x + offsetX;
          const ny = offsetY - nextPt.y;
          this.addEdgeToField(currX, currY, nx, ny);
          currX = nx;
          currY = ny;
        }
      } else {
        const p0x = currX;
        const p0y = currY;
        const p1x = pt.x + offsetX;
        const p1y = offsetY - pt.y;
        let p2x = 0.0;
        let p2y = 0.0;
        if ( nextPt.onCurve ) {
          p2x = nextPt.x + offsetX;
          p2y = offsetY - nextPt.y;
        } else {
          p2x = ((pt.x + nextPt.x) / 2.0) + offsetX;
          p2y = offsetY - ((pt.y + nextPt.y) / 2.0);
        }
        const segments = 8;
        let j = 1;
        while (j <= segments) {
          const t = (j) / (segments);
          const invT = 1.0 - t;
          const nx_1 = (((invT * invT) * p0x) + (((2.0 * invT) * t) * p1x)) + ((t * t) * p2x);
          const ny_1 = (((invT * invT) * p0y) + (((2.0 * invT) * t) * p1y)) + ((t * t) * p2y);
          this.addEdgeToField(currX, currY, nx_1, ny_1);
          currX = nx_1;
          currY = ny_1;
          j = j + 1;
        };
      }
      i = i + 1;
    };
    let dx = currX - startX;
    let dy = currY - startY;
    if ( dx < 0.0 ) {
      dx = 0.0 - dx;
    }
    if ( dy < 0.0 ) {
      dy = 0.0 - dy;
    }
    if ( (dx > 0.01) || (dy > 0.01) ) {
      this.addEdgeToField(currX, currY, startX, startY);
    }
  };
  renderText (buf, text, x, y, fontSize, r, g, b, a) {
    let currX = x;
    if ( this.font.unitsPerEm <= 0 ) {
      if ( this.debug ) {
        console.log("ERROR: Font not loaded in RasterText! unitsPerEm=" + ((this.font.unitsPerEm.toString())));
      }
      return;
    }
    const baseline = this.font.getAscender(fontSize);
    const renderY = y + baseline;
    if ( this.debug ) {
      console.log((((((((((("RasterText.renderText: text='" + text) + "' pos=(") + ((x.toString()))) + ",") + ((y.toString()))) + ") fontSize=") + ((fontSize.toString()))) + " baseline=") + ((baseline.toString()))) + " renderY=") + ((renderY.toString())));
    }
    if ( this.debug ) {
      console.log((((((((((("RasterText.renderText: color=RGB(" + ((r.toString()))) + ",") + ((g.toString()))) + ",") + ((b.toString()))) + ") alpha=") + ((a.toString()))) + " bufSize=") + ((buf.width.toString()))) + "x") + ((buf.height.toString())));
    }
    const cps = EVGCodepoint.toArray(text);
    const n = cps.length;
    let i = 0;
    let prevCp = 0;
    let firstCp = true;
    while (i < n) {
      const end = EVGGrapheme.clusterEnd(cps, i);
      const ch = cps[i];
      let face = this.font;
      if ( this.hasFallbackManager ) {
        const found = this.fallbackManager.faceForClusterFrom((this.font), cps, i, end);
        if ( found.isLoaded() ) {
          face = found;
        }
      }
      const isPrimary = face.fontPath == this.font.fontPath;
      if ( isPrimary ) {
        let c = i;
        while (c < end) {
          const cp = cps[c];
          const outline = this.parseGlyph(this.font.getGlyphIndex(cp), fontSize);
          if ( firstCp == false ) {
            currX = currX + this.font.kernPoints(prevCp, cp, fontSize);
          }
          this.renderGlyph(buf, outline, currX, renderY, r, g, b, a);
          currX = currX + outline.advanceWidth;
          prevCp = cp;
          firstCp = false;
          c = c + 1;
        };
      } else {
        const keep = this.font;
        this.setFont(face);
        const shaped = face.shapeRange(cps, i, end);
        let fr = r;
        let fg = g;
        let fb = b;
        if ( this.fallbackColorSet ) {
          fr = this.fallbackR;
          fg = this.fallbackG;
          fb = this.fallbackB;
        }
        let gi = 0;
        while (gi < (shaped.glyphs.length)) {
          const o = this.parseGlyph((shaped.glyphs[gi]), fontSize);
          this.renderGlyph(buf, o, currX, renderY, fr, fg, fb, a);
          currX = currX + o.advanceWidth;
          gi = gi + 1;
        };
        this.setFont(keep);
        prevCp = ch;
        firstCp = true;
      }
      i = end;
    };
  };
  renderTextWithShadow (buf, text, x, y, fontSize, textR, textG, textB, textA, shadowR, shadowG, shadowB, shadowA, shadowOffX, shadowOffY, blurRadius) {
    const shadowBuf = new RasterBuffer();
    const margin = blurRadius * 2;
    const textWidth = this.font.measureText(text, fontSize);
    const textHeight = this.font.getLineHeight(fontSize);
    const bufW = (((Math.floor( textWidth)) + margin) + margin) + 10;
    const bufH = (((Math.floor( textHeight)) + margin) + margin) + 10;
    shadowBuf.create(bufW, bufH);
    this.renderText(shadowBuf, text, margin, margin, fontSize, shadowR, shadowG, shadowB, 255);
    if ( blurRadius > 0 ) {
      const blur = new RasterBlur();
      const blurred = blur.gaussianApproxBlur(shadowBuf, blurRadius);
      let py = 0;
      while (py < blurred.height) {
        let px = 0;
        while (px < blurred.width) {
          const p = blurred.getPixel(px, py);
          const newA = Math.floor( (((p.a * shadowA)) / 255.0));
          blurred.setPixel(px, py, p.r, p.g, p.b, newA);
          px = px + 1;
        };
        py = py + 1;
      };
      const shadowX = (Math.floor( (x + shadowOffX))) - margin;
      const shadowY = (Math.floor( (y + shadowOffY))) - margin;
      this.compositor.compositeOver(buf, blurred, shadowX, shadowY);
    } else {
      const shadowX_1 = (Math.floor( (x + shadowOffX))) - margin;
      const shadowY_1 = (Math.floor( (y + shadowOffY))) - margin;
      let py_1 = 0;
      while (py_1 < shadowBuf.height) {
        let px_1 = 0;
        while (px_1 < shadowBuf.width) {
          const p_1 = shadowBuf.getPixel(px_1, py_1);
          const newA_1 = Math.floor( (((p_1.a * shadowA)) / 255.0));
          shadowBuf.setPixel(px_1, py_1, p_1.r, p_1.g, p_1.b, newA_1);
          px_1 = px_1 + 1;
        };
        py_1 = py_1 + 1;
      };
      this.compositor.compositeOver(buf, shadowBuf, shadowX_1, shadowY_1);
    }
    this.renderText(buf, text, x, y, fontSize, textR, textG, textB, textA);
  };
  readUInt8 (offset) {
    return this.font.fontData._view.getUint8(offset);
  };
  readUInt16 (offset) {
    const b1 = this.font.fontData._view.getUint8(offset);
    const b2 = this.font.fontData._view.getUint8((offset + 1));
    return (b1 * 256) + b2;
  };
  readInt16 (offset) {
    const val = this.readUInt16(offset);
    if ( val >= 32768 ) {
      return val - 65536;
    }
    return val;
  };
  readUInt32 (offset) {
    const b1 = this.font.fontData._view.getUint8(offset);
    const b2 = this.font.fontData._view.getUint8((offset + 1));
    const b3 = this.font.fontData._view.getUint8((offset + 2));
    const b4 = this.font.fontData._view.getUint8((offset + 3));
    return (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
  };
}
class BidiClass  {
  constructor() {
  }
}
BidiClass.L = function() {
  return 0;
};
BidiClass.R = function() {
  return 1;
};
BidiClass.AL = function() {
  return 2;
};
BidiClass.EN = function() {
  return 3;
};
BidiClass.ES = function() {
  return 4;
};
BidiClass.ET = function() {
  return 5;
};
BidiClass.AN = function() {
  return 6;
};
BidiClass.CS = function() {
  return 7;
};
BidiClass.NSM = function() {
  return 8;
};
BidiClass.BN = function() {
  return 9;
};
BidiClass.B = function() {
  return 10;
};
BidiClass.S = function() {
  return 11;
};
BidiClass.WS = function() {
  return 12;
};
BidiClass.ON = function() {
  return 13;
};
BidiClass.isRtl = function(c) {
  if ( c == 1 ) {
    return true;
  }
  return c == 2;
};
BidiClass.isNeutral = function(c) {
  if ( c == 10 ) {
    return true;
  }
  if ( c == 11 ) {
    return true;
  }
  if ( c == 12 ) {
    return true;
  }
  return c == 13;
};
class OfficeBidi  {
  constructor() {
  }
}
OfficeBidi.classOf = function(cp) {
  if ( cp < 128 ) {
    return OfficeBidi.asciiClass(cp);
  }
  if ( cp >= 1425 ) {
    if ( cp <= 1479 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1552 ) {
    if ( cp <= 1562 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1611 ) {
    if ( cp <= 1631 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1750 ) {
    if ( cp <= 1756 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1759 ) {
    if ( cp <= 1764 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1767 ) {
    if ( cp <= 1768 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1770 ) {
    if ( cp <= 1773 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 1632 ) {
    if ( cp <= 1641 ) {
      return BidiClass.AN();
    }
  }
  if ( cp >= 1776 ) {
    if ( cp <= 1785 ) {
      return BidiClass.AN();
    }
  }
  if ( cp == 1548 ) {
    return BidiClass.CS();
  }
  if ( cp >= 1642 ) {
    if ( cp <= 1645 ) {
      return BidiClass.AN();
    }
  }
  if ( cp >= 1424 ) {
    if ( cp <= 1535 ) {
      return BidiClass.R();
    }
  }
  if ( cp >= 1536 ) {
    if ( cp <= 1791 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 1792 ) {
    if ( cp <= 1871 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 1872 ) {
    if ( cp <= 1919 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 1920 ) {
    if ( cp <= 1983 ) {
      return BidiClass.R();
    }
  }
  if ( cp >= 1984 ) {
    if ( cp <= 2047 ) {
      return BidiClass.R();
    }
  }
  if ( cp >= 2048 ) {
    if ( cp <= 2111 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 2112 ) {
    if ( cp <= 2303 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 64336 ) {
    if ( cp <= 65023 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 65136 ) {
    if ( cp <= 65279 ) {
      return BidiClass.AL();
    }
  }
  if ( cp >= 64285 ) {
    if ( cp <= 64335 ) {
      return BidiClass.R();
    }
  }
  if ( cp == 8206 ) {
    return BidiClass.L();
  }
  if ( cp == 8207 ) {
    return BidiClass.R();
  }
  if ( cp == 8203 ) {
    return BidiClass.BN();
  }
  if ( cp >= 8204 ) {
    if ( cp <= 8205 ) {
      return BidiClass.BN();
    }
  }
  if ( cp == 8232 ) {
    return BidiClass.WS();
  }
  if ( cp == 8233 ) {
    return BidiClass.B();
  }
  if ( cp >= 768 ) {
    if ( cp <= 879 ) {
      return BidiClass.NSM();
    }
  }
  if ( cp >= 8352 ) {
    if ( cp <= 8399 ) {
      return BidiClass.ET();
    }
  }
  if ( cp == 176 ) {
    return BidiClass.ET();
  }
  if ( cp == 160 ) {
    return BidiClass.CS();
  }
  if ( cp >= 8192 ) {
    if ( cp <= 8202 ) {
      return BidiClass.WS();
    }
  }
  if ( cp >= 8208 ) {
    if ( cp <= 8231 ) {
      return BidiClass.ON();
    }
  }
  return BidiClass.L();
};
OfficeBidi.asciiClass = function(cp) {
  if ( cp >= 48 ) {
    if ( cp <= 57 ) {
      return BidiClass.EN();
    }
  }
  if ( cp >= 65 ) {
    if ( cp <= 90 ) {
      return BidiClass.L();
    }
  }
  if ( cp >= 97 ) {
    if ( cp <= 122 ) {
      return BidiClass.L();
    }
  }
  if ( cp == 10 ) {
    return BidiClass.B();
  }
  if ( cp == 13 ) {
    return BidiClass.B();
  }
  if ( cp == 9 ) {
    return BidiClass.S();
  }
  if ( cp == 32 ) {
    return BidiClass.WS();
  }
  if ( cp == 43 ) {
    return BidiClass.ES();
  }
  if ( cp == 45 ) {
    return BidiClass.ES();
  }
  if ( cp == 35 ) {
    return BidiClass.ET();
  }
  if ( cp == 36 ) {
    return BidiClass.ET();
  }
  if ( cp == 37 ) {
    return BidiClass.ET();
  }
  if ( cp == 44 ) {
    return BidiClass.CS();
  }
  if ( cp == 46 ) {
    return BidiClass.CS();
  }
  if ( cp == 58 ) {
    return BidiClass.CS();
  }
  if ( cp == 47 ) {
    return BidiClass.CS();
  }
  return BidiClass.ON();
};
OfficeBidi.paragraphLevel = function(cps, override) {
  if ( override == 0 ) {
    return 0;
  }
  if ( override == 1 ) {
    return 1;
  }
  let i = 0;
  while (i < (cps.length)) {
    const c = OfficeBidi.classOf((cps[i]));
    if ( c == BidiClass.L() ) {
      return 0;
    }
    if ( BidiClass.isRtl(c) ) {
      return 1;
    }
    i = i + 1;
  };
  return 0;
};
OfficeBidi.dirOf = function(c) {
  if ( c == BidiClass.L() ) {
    return BidiClass.L();
  }
  return BidiClass.R();
};
OfficeBidi.resolveLevels = function(cps, paraLevel) {
  const n = cps.length;
  let cls = [];
  let levels = [];
  let i = 0;
  while (i < n) {
    cls.push(OfficeBidi.classOf((cps[i])));
    levels.push(paraLevel);
    i = i + 1;
  };
  if ( n == 0 ) {
    return levels;
  }
  let prev = BidiClass.L();
  if ( paraLevel == 1 ) {
    prev = BidiClass.R();
  }
  i = 0;
  while (i < n) {
    if ( (cls[i]) == BidiClass.NSM() ) {
      cls[i] = prev;
    } else {
      prev = cls[i];
    }
    i = i + 1;
  };
  let lastStrong = BidiClass.L();
  if ( paraLevel == 1 ) {
    lastStrong = BidiClass.R();
  }
  i = 0;
  while (i < n) {
    const c2 = cls[i];
    if ( c2 == BidiClass.L() ) {
      lastStrong = c2;
    }
    if ( c2 == BidiClass.R() ) {
      lastStrong = c2;
    }
    if ( c2 == BidiClass.AL() ) {
      lastStrong = c2;
    }
    if ( c2 == BidiClass.EN() ) {
      if ( lastStrong == BidiClass.AL() ) {
        cls[i] = BidiClass.AN();
      }
    }
    i = i + 1;
  };
  i = 0;
  while (i < n) {
    if ( (cls[i]) == BidiClass.AL() ) {
      cls[i] = BidiClass.R();
    }
    i = i + 1;
  };
  i = 1;
  while ((i + 1) < n) {
    const c4 = cls[i];
    const before = cls[(i - 1)];
    const after = cls[(i + 1)];
    if ( c4 == BidiClass.ES() ) {
      if ( before == BidiClass.EN() ) {
        if ( after == BidiClass.EN() ) {
          cls[i] = BidiClass.EN();
        }
      }
    }
    if ( c4 == BidiClass.CS() ) {
      if ( before == BidiClass.EN() ) {
        if ( after == BidiClass.EN() ) {
          cls[i] = BidiClass.EN();
        }
      }
      if ( before == BidiClass.AN() ) {
        if ( after == BidiClass.AN() ) {
          cls[i] = BidiClass.AN();
        }
      }
    }
    i = i + 1;
  };
  i = 0;
  while (i < n) {
    if ( (cls[i]) != BidiClass.ET() ) {
      i = i + 1;
    } else {
      let j = i;
      while (j < n) {
        if ( (cls[j]) == BidiClass.ET() ) {
          j = j + 1;
        } else {
          break;
        }
      };
      let joins = false;
      if ( i > 0 ) {
        if ( (cls[(i - 1)]) == BidiClass.EN() ) {
          joins = true;
        }
      }
      if ( j < n ) {
        if ( (cls[j]) == BidiClass.EN() ) {
          joins = true;
        }
      }
      if ( joins ) {
        let k = i;
        while (k < j) {
          cls[k] = BidiClass.EN();
          k = k + 1;
        };
      }
      i = j;
    }
  };
  i = 0;
  while (i < n) {
    const c6 = cls[i];
    if ( c6 == BidiClass.ES() ) {
      cls[i] = BidiClass.ON();
    }
    if ( c6 == BidiClass.ET() ) {
      cls[i] = BidiClass.ON();
    }
    if ( c6 == BidiClass.CS() ) {
      cls[i] = BidiClass.ON();
    }
    if ( c6 == BidiClass.BN() ) {
      cls[i] = BidiClass.ON();
    }
    i = i + 1;
  };
  let strong7 = BidiClass.L();
  if ( paraLevel == 1 ) {
    strong7 = BidiClass.R();
  }
  i = 0;
  while (i < n) {
    const c7 = cls[i];
    if ( c7 == BidiClass.L() ) {
      strong7 = c7;
    }
    if ( c7 == BidiClass.R() ) {
      strong7 = c7;
    }
    if ( c7 == BidiClass.EN() ) {
      if ( strong7 == BidiClass.L() ) {
        cls[i] = BidiClass.L();
      }
    }
    i = i + 1;
  };
  let paraDir = BidiClass.L();
  if ( paraLevel == 1 ) {
    paraDir = BidiClass.R();
  }
  i = 0;
  while (i < n) {
    if ( BidiClass.isNeutral((cls[i])) == false ) {
      i = i + 1;
    } else {
      let j2 = i;
      while (j2 < n) {
        if ( BidiClass.isNeutral((cls[j2])) ) {
          j2 = j2 + 1;
        } else {
          break;
        }
      };
      let before_1 = paraDir;
      if ( i > 0 ) {
        before_1 = OfficeBidi.dirOf((cls[(i - 1)]));
      }
      let after_1 = paraDir;
      if ( j2 < n ) {
        after_1 = OfficeBidi.dirOf((cls[j2]));
      }
      let take = paraDir;
      if ( before_1 == after_1 ) {
        take = before_1;
      }
      let k2 = i;
      while (k2 < j2) {
        cls[k2] = take;
        k2 = k2 + 1;
      };
      i = j2;
    }
  };
  i = 0;
  while (i < n) {
    const c = cls[i];
    let lvl = paraLevel;
    if ( paraLevel == 0 ) {
      if ( c == BidiClass.R() ) {
        lvl = 1;
      }
      if ( c == BidiClass.AN() ) {
        lvl = 2;
      }
      if ( c == BidiClass.EN() ) {
        lvl = 2;
      }
    } else {
      if ( c == BidiClass.L() ) {
        lvl = 2;
      }
      if ( c == BidiClass.AN() ) {
        lvl = 2;
      }
      if ( c == BidiClass.EN() ) {
        lvl = 2;
      }
    }
    levels[i] = lvl;
    i = i + 1;
  };
  return levels;
};
OfficeBidi.applyL1 = function(cps, levels, paraLevel) {
  const n = cps.length;
  let i = n - 1;
  while (i >= 0) {
    const c = OfficeBidi.classOf((cps[i]));
    if ( c == BidiClass.WS() ) {
      levels[i] = paraLevel;
      i = i - 1;
    } else {
      if ( c == BidiClass.S() ) {
        levels[i] = paraLevel;
        i = i - 1;
      } else {
        if ( c == BidiClass.B() ) {
          levels[i] = paraLevel;
          i = i - 1;
        } else {
          i = 0 - 1;
        }
      }
    }
  };
  let j = 0;
  while (j < n) {
    const c2 = OfficeBidi.classOf((cps[j]));
    if ( c2 == BidiClass.S() ) {
      levels[j] = paraLevel;
      let k = j - 1;
      while (k >= 0) {
        if ( OfficeBidi.classOf((cps[k])) == BidiClass.WS() ) {
          levels[k] = paraLevel;
          k = k - 1;
        } else {
          k = 0 - 1;
        }
      };
    }
    if ( c2 == BidiClass.B() ) {
      levels[j] = paraLevel;
    }
    j = j + 1;
  };
};
OfficeBidi.reorder = function(levels) {
  const n = levels.length;
  let order = [];
  let i = 0;
  while (i < n) {
    order.push(i);
    i = i + 1;
  };
  if ( n == 0 ) {
    return order;
  }
  let highest = 0;
  let lowestOdd = 99;
  i = 0;
  while (i < n) {
    const lv = levels[i];
    if ( lv > highest ) {
      highest = lv;
    }
    if ( (lv % 2) == 1 ) {
      if ( lv < lowestOdd ) {
        lowestOdd = lv;
      }
    }
    i = i + 1;
  };
  if ( lowestOdd > highest ) {
    return order;
  }
  let lvl = highest;
  while (lvl >= lowestOdd) {
    let a = 0;
    while (a < n) {
      if ( (levels[(order[a])]) >= lvl ) {
        let b = a;
        while (b < n) {
          if ( (levels[(order[b])]) >= lvl ) {
            b = b + 1;
          } else {
            break;
          }
        };
        let lo = a;
        let hi = b - 1;
        while (lo < hi) {
          const t = order[lo];
          order[lo] = order[hi];
          order[hi] = t;
          lo = lo + 1;
          hi = hi - 1;
        };
        a = b;
      } else {
        a = a + 1;
      }
    };
    lvl = lvl - 1;
  };
  return order;
};
OfficeBidi.mirrorOf = function(cp) {
  if ( cp == 40 ) {
    return 41;
  }
  if ( cp == 41 ) {
    return 40;
  }
  if ( cp == 60 ) {
    return 62;
  }
  if ( cp == 62 ) {
    return 60;
  }
  if ( cp == 91 ) {
    return 93;
  }
  if ( cp == 93 ) {
    return 91;
  }
  if ( cp == 123 ) {
    return 125;
  }
  if ( cp == 125 ) {
    return 123;
  }
  if ( cp == 171 ) {
    return 187;
  }
  if ( cp == 187 ) {
    return 171;
  }
  if ( cp == 8249 ) {
    return 8250;
  }
  if ( cp == 8250 ) {
    return 8249;
  }
  if ( cp == 8804 ) {
    return 8805;
  }
  if ( cp == 8805 ) {
    return 8804;
  }
  if ( cp == 8918 ) {
    return 8919;
  }
  if ( cp == 8919 ) {
    return 8918;
  }
  if ( cp == 12296 ) {
    return 12297;
  }
  if ( cp == 12297 ) {
    return 12296;
  }
  return cp;
};
OfficeBidi.mirrorGlyphs = function(cps, levels) {
  let out = [];
  const n = cps.length;
  let i = 0;
  while (i < n) {
    const cp = cps[i];
    let lv = 0;
    if ( i < (levels.length) ) {
      lv = levels[i];
    }
    if ( (lv % 2) == 1 ) {
      out.push(OfficeBidi.mirrorOf(cp));
    } else {
      out.push(cp);
    }
    i = i + 1;
  };
  return out;
};
OfficeBidi.levelsOf = function(cps, override) {
  const para = OfficeBidi.paragraphLevel(cps, override);
  const levels = OfficeBidi.resolveLevels(cps, para);
  OfficeBidi.applyL1(cps, levels, para);
  return levels;
};
OfficeBidi.visualOrder = function(cps, override) {
  const para = OfficeBidi.paragraphLevel(cps, override);
  const levels = OfficeBidi.resolveLevels(cps, para);
  OfficeBidi.applyL1(cps, levels, para);
  return OfficeBidi.reorder(levels);
};
OfficeBidi.hasRtl = function(cps) {
  let i = 0;
  while (i < (cps.length)) {
    if ( BidiClass.isRtl(OfficeBidi.classOf((cps[i]))) ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
class OfficeArabic  {
  constructor() {
  }
}
OfficeArabic.isDual = function(cp) {
  if ( cp == 1574 ) {
    return true;
  }
  if ( cp == 1576 ) {
    return true;
  }
  if ( cp == 1578 ) {
    return true;
  }
  if ( cp == 1579 ) {
    return true;
  }
  if ( cp == 1580 ) {
    return true;
  }
  if ( cp == 1581 ) {
    return true;
  }
  if ( cp == 1582 ) {
    return true;
  }
  if ( cp == 1587 ) {
    return true;
  }
  if ( cp == 1588 ) {
    return true;
  }
  if ( cp == 1589 ) {
    return true;
  }
  if ( cp == 1590 ) {
    return true;
  }
  if ( cp == 1591 ) {
    return true;
  }
  if ( cp == 1592 ) {
    return true;
  }
  if ( cp == 1593 ) {
    return true;
  }
  if ( cp == 1594 ) {
    return true;
  }
  if ( cp == 1601 ) {
    return true;
  }
  if ( cp == 1602 ) {
    return true;
  }
  if ( cp == 1603 ) {
    return true;
  }
  if ( cp == 1604 ) {
    return true;
  }
  if ( cp == 1605 ) {
    return true;
  }
  if ( cp == 1606 ) {
    return true;
  }
  if ( cp == 1607 ) {
    return true;
  }
  if ( cp == 1609 ) {
    return true;
  }
  if ( cp == 1610 ) {
    return true;
  }
  if ( cp == 1600 ) {
    return true;
  }
  return false;
};
OfficeArabic.isLetter = function(cp) {
  return OfficeArabic.isoFormOf(cp) > 0;
};
OfficeArabic.isTransparent = function(cp) {
  if ( cp >= 1552 ) {
    if ( cp <= 1562 ) {
      return true;
    }
  }
  if ( cp >= 1611 ) {
    if ( cp <= 1631 ) {
      return true;
    }
  }
  if ( cp == 1648 ) {
    return true;
  }
  if ( cp >= 1750 ) {
    if ( cp <= 1756 ) {
      return true;
    }
  }
  if ( cp >= 1759 ) {
    if ( cp <= 1764 ) {
      return true;
    }
  }
  if ( cp >= 1767 ) {
    if ( cp <= 1768 ) {
      return true;
    }
  }
  if ( cp >= 1770 ) {
    if ( cp <= 1773 ) {
      return true;
    }
  }
  return false;
};
OfficeArabic.isoFormOf = function(cp) {
  if ( cp == 1569 ) {
    return 65152;
  }
  if ( cp == 1570 ) {
    return 65153;
  }
  if ( cp == 1571 ) {
    return 65155;
  }
  if ( cp == 1572 ) {
    return 65157;
  }
  if ( cp == 1573 ) {
    return 65159;
  }
  if ( cp == 1574 ) {
    return 65161;
  }
  if ( cp == 1575 ) {
    return 65165;
  }
  if ( cp == 1576 ) {
    return 65167;
  }
  if ( cp == 1577 ) {
    return 65171;
  }
  if ( cp == 1578 ) {
    return 65173;
  }
  if ( cp == 1579 ) {
    return 65177;
  }
  if ( cp == 1580 ) {
    return 65181;
  }
  if ( cp == 1581 ) {
    return 65185;
  }
  if ( cp == 1582 ) {
    return 65189;
  }
  if ( cp == 1583 ) {
    return 65193;
  }
  if ( cp == 1584 ) {
    return 65195;
  }
  if ( cp == 1585 ) {
    return 65197;
  }
  if ( cp == 1586 ) {
    return 65199;
  }
  if ( cp == 1587 ) {
    return 65201;
  }
  if ( cp == 1588 ) {
    return 65205;
  }
  if ( cp == 1589 ) {
    return 65209;
  }
  if ( cp == 1590 ) {
    return 65213;
  }
  if ( cp == 1591 ) {
    return 65217;
  }
  if ( cp == 1592 ) {
    return 65221;
  }
  if ( cp == 1593 ) {
    return 65225;
  }
  if ( cp == 1594 ) {
    return 65229;
  }
  if ( cp == 1601 ) {
    return 65233;
  }
  if ( cp == 1602 ) {
    return 65237;
  }
  if ( cp == 1603 ) {
    return 65241;
  }
  if ( cp == 1604 ) {
    return 65245;
  }
  if ( cp == 1605 ) {
    return 65249;
  }
  if ( cp == 1606 ) {
    return 65253;
  }
  if ( cp == 1607 ) {
    return 65257;
  }
  if ( cp == 1608 ) {
    return 65261;
  }
  if ( cp == 1609 ) {
    return 65263;
  }
  if ( cp == 1610 ) {
    return 65265;
  }
  return 0;
};
OfficeArabic.formCountOf = function(cp) {
  if ( cp == 1569 ) {
    return 1;
  }
  if ( cp == 1570 ) {
    return 2;
  }
  if ( cp == 1571 ) {
    return 2;
  }
  if ( cp == 1572 ) {
    return 2;
  }
  if ( cp == 1573 ) {
    return 2;
  }
  if ( cp == 1574 ) {
    return 4;
  }
  if ( cp == 1575 ) {
    return 2;
  }
  if ( cp == 1576 ) {
    return 4;
  }
  if ( cp == 1577 ) {
    return 2;
  }
  if ( cp == 1578 ) {
    return 4;
  }
  if ( cp == 1579 ) {
    return 4;
  }
  if ( cp == 1580 ) {
    return 4;
  }
  if ( cp == 1581 ) {
    return 4;
  }
  if ( cp == 1582 ) {
    return 4;
  }
  if ( cp == 1583 ) {
    return 2;
  }
  if ( cp == 1584 ) {
    return 2;
  }
  if ( cp == 1585 ) {
    return 2;
  }
  if ( cp == 1586 ) {
    return 2;
  }
  if ( cp == 1587 ) {
    return 4;
  }
  if ( cp == 1588 ) {
    return 4;
  }
  if ( cp == 1589 ) {
    return 4;
  }
  if ( cp == 1590 ) {
    return 4;
  }
  if ( cp == 1591 ) {
    return 4;
  }
  if ( cp == 1592 ) {
    return 4;
  }
  if ( cp == 1593 ) {
    return 4;
  }
  if ( cp == 1594 ) {
    return 4;
  }
  if ( cp == 1601 ) {
    return 4;
  }
  if ( cp == 1602 ) {
    return 4;
  }
  if ( cp == 1603 ) {
    return 4;
  }
  if ( cp == 1604 ) {
    return 4;
  }
  if ( cp == 1605 ) {
    return 4;
  }
  if ( cp == 1606 ) {
    return 4;
  }
  if ( cp == 1607 ) {
    return 4;
  }
  if ( cp == 1608 ) {
    return 2;
  }
  if ( cp == 1609 ) {
    return 2;
  }
  if ( cp == 1610 ) {
    return 4;
  }
  return 0;
};
OfficeArabic.prevIndex = function(cps, i) {
  let k = i - 1;
  while (k >= 0) {
    if ( OfficeArabic.isTransparent((cps[k])) == false ) {
      return k;
    }
    k = k - 1;
  };
  return -1;
};
OfficeArabic.nextIndex = function(cps, i) {
  const n = cps.length;
  let k = i + 1;
  while (k < n) {
    if ( OfficeArabic.isTransparent((cps[k])) == false ) {
      return k;
    }
    k = k + 1;
  };
  return -1;
};
OfficeArabic.cpAt = function(cps, i) {
  if ( i < 0 ) {
    return 0;
  }
  return cps[i];
};
OfficeArabic.joinsForward = function(cp) {
  if ( cp == 8205 ) {
    return true;
  }
  return OfficeArabic.isDual(cp);
};
OfficeArabic.joinsBackward = function(cp) {
  if ( cp == 8205 ) {
    return true;
  }
  if ( cp == 1600 ) {
    return true;
  }
  if ( OfficeArabic.formCountOf(cp) < 2 ) {
    return false;
  }
  return OfficeArabic.isLetter(cp);
};
OfficeArabic.formOf = function(cp, joinsPrev, joinsNext) {
  const base = OfficeArabic.isoFormOf(cp);
  if ( base == 0 ) {
    return cp;
  }
  const count = OfficeArabic.formCountOf(cp);
  if ( count < 2 ) {
    return cp;
  }
  if ( joinsPrev ) {
    if ( joinsNext ) {
      if ( count == 4 ) {
        return base + 3;
      }
      return base + 1;
    }
    return base + 1;
  }
  if ( joinsNext ) {
    if ( count == 4 ) {
      return base + 2;
    }
    return cp;
  }
  return cp;
};
OfficeArabic.ligatureOf = function(alef) {
  if ( alef == 1570 ) {
    return 65269;
  }
  if ( alef == 1571 ) {
    return 65271;
  }
  if ( alef == 1573 ) {
    return 65273;
  }
  if ( alef == 1575 ) {
    return 65275;
  }
  return 0;
};
OfficeArabic.hasArabic = function(cps) {
  const n = cps.length;
  let i = 0;
  while (i < n) {
    if ( OfficeArabic.isLetter((cps[i])) ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
OfficeArabic.shape = function(cps) {
  const n = cps.length;
  let out = [];
  let i = 0;
  while (i < n) {
    out.push(cps[i]);
    i = i + 1;
  };
  let at = 0;
  while (at < n) {
    const cp = cps[at];
    const standing = out[at];
    if ( standing > 0 ) {
      if ( OfficeArabic.isLetter(cp) ) {
        const pi = OfficeArabic.prevIndex(cps, at);
        const ni = OfficeArabic.nextIndex(cps, at);
        const pcp = OfficeArabic.cpAt(cps, pi);
        const ncp = OfficeArabic.cpAt(cps, ni);
        const jp = OfficeArabic.joinsForward(pcp);
        let jn = false;
        if ( OfficeArabic.joinsForward(cp) ) {
          jn = OfficeArabic.joinsBackward(ncp);
        }
        let lig = 0;
        if ( cp == 1604 ) {
          lig = OfficeArabic.ligatureOf(ncp);
        }
        if ( lig > 0 ) {
          let form = lig;
          if ( jp ) {
            form = lig + 1;
          }
          out[at] = form;
          out[ni] = 0;
        } else {
          out[at] = OfficeArabic.formOf(cp, jp, jn);
        }
      }
    }
    at = at + 1;
  };
  return out;
};
class OfficeVisualRun  {
  constructor() {
    this.style = 0;
    this.start = 0;
    this.end = 0;
    this.text = "";
  }
}
class OfficeText  {
  constructor() {
  }
}
OfficeText.needsWork = function(s) {
  if ( (s.length) == 0 ) {
    return false;
  }
  return OfficeBidi.hasRtl(EVGCodepoint.toArray(s));
};
OfficeText.isRtl = function(s) {
  if ( (s.length) == 0 ) {
    return false;
  }
  return OfficeBidi.paragraphLevel(EVGCodepoint.toArray(s), -1) == 1;
};
OfficeText.isMark = function(cp) {
  return OfficeBidi.classOf(cp) == BidiClass.NSM();
};
OfficeText.reattachMarks = function(cps, order) {
  const n = order.length;
  let out = [];
  let i = 0;
  while (i < n) {
    out.push(order[i]);
    i = i + 1;
  };
  let v = 0;
  while (v < n) {
    let run = 1;
    let more = true;
    while (more) {
      const w = v + run;
      more = false;
      if ( w < n ) {
        if ( (order[w]) == ((order[(w - 1)]) - 1) ) {
          more = true;
        }
      }
      if ( more ) {
        run = run + 1;
      }
    };
    const stop = v + run;
    let s = v;
    while (s < stop) {
      let e = s;
      let scanning = true;
      while (scanning) {
        scanning = false;
        if ( e < (stop - 1) ) {
          if ( OfficeText.isMark((cps[(order[e])])) ) {
            e = e + 1;
            scanning = true;
          }
        }
      };
      if ( e > s ) {
        let a = s;
        let b = e;
        while (a < b) {
          const t = out[a];
          out[a] = out[b];
          out[b] = t;
          a = a + 1;
          b = b - 1;
        };
      }
      s = e + 1;
    };
    v = stop;
  };
  return out;
};
OfficeText.visualOrderOf = function(s, dir) {
  const cps = EVGCodepoint.toArray(s);
  const order = OfficeBidi.visualOrder(cps, dir);
  return OfficeText.reattachMarks(cps, order);
};
OfficeText.forDisplayDir = function(s, dir) {
  const cps = EVGCodepoint.toArray(s);
  const n = cps.length;
  if ( n < 1 ) {
    return s;
  }
  if ( OfficeBidi.hasRtl(cps) == false ) {
    return s;
  }
  let glyphs = cps;
  if ( OfficeArabic.hasArabic(cps) ) {
    glyphs = OfficeArabic.shape(cps);
  }
  const levels = OfficeBidi.levelsOf(cps, dir);
  glyphs = OfficeBidi.mirrorGlyphs(glyphs, levels);
  const order = OfficeBidi.visualOrder(cps, dir);
  const visual = OfficeText.reattachMarks(cps, order);
  let out = "";
  let i = 0;
  while (i < n) {
    const g = glyphs[(visual[i])];
    if ( g > 0 ) {
      out = out + EVGCodepoint.toStr(g);
    }
    i = i + 1;
  };
  return out;
};
OfficeText.visualRuns = function(s, dir, styleIds) {
  let out = [];
  const cps = EVGCodepoint.toArray(s);
  const n = cps.length;
  if ( n < 1 ) {
    return out;
  }
  let glyphs = cps;
  if ( OfficeArabic.hasArabic(cps) ) {
    glyphs = OfficeArabic.shape(cps);
  }
  let visual = [];
  if ( OfficeBidi.hasRtl(cps) ) {
    const levels = OfficeBidi.levelsOf(cps, dir);
    glyphs = OfficeBidi.mirrorGlyphs(glyphs, levels);
    const order = OfficeBidi.visualOrder(cps, dir);
    visual = OfficeText.reattachMarks(cps, order);
  } else {
    let k = 0;
    while (k < n) {
      visual.push(k);
      k = k + 1;
    };
  }
  let i = 0;
  while (i < n) {
    const li = visual[i];
    const sid = OfficeText.styleAt(styleIds, li);
    let lo = li;
    let hi = li + 1;
    let text = "";
    let j = i;
    let more = true;
    while (more) {
      if ( j >= n ) {
        more = false;
      } else {
        const lj = visual[j];
        if ( OfficeText.styleAt(styleIds, lj) != sid ) {
          more = false;
        } else {
          const g = glyphs[lj];
          if ( g > 0 ) {
            text = text + EVGCodepoint.toStr(g);
          }
          if ( lj < lo ) {
            lo = lj;
          }
          if ( (lj + 1) > hi ) {
            hi = lj + 1;
          }
          j = j + 1;
        }
      }
    };
    const vr = new OfficeVisualRun();
    vr.style = sid;
    vr.start = lo;
    vr.end = hi;
    vr.text = text;
    out.push(vr);
    i = j;
  };
  return out;
};
OfficeText.styleAt = function(styleIds, i) {
  if ( i < 0 ) {
    return 0;
  }
  if ( i >= (styleIds.length) ) {
    return 0;
  }
  return styleIds[i];
};
OfficeText.forMetrics = function(s) {
  const cps = EVGCodepoint.toArray(s);
  if ( (cps.length) < 1 ) {
    return s;
  }
  if ( OfficeArabic.hasArabic(cps) == false ) {
    return s;
  }
  const glyphs = OfficeArabic.shape(cps);
  let out = "";
  let i = 0;
  while (i < (glyphs.length)) {
    const g = glyphs[i];
    if ( g > 0 ) {
      out = out + EVGCodepoint.toStr(g);
    }
    i = i + 1;
  };
  return out;
};
OfficeText.forDisplay = function(s) {
  return OfficeText.forDisplayDir(s, -1);
};
class UICachedLine  {
  constructor() {
    this.key = "";
    this.img = new ImageBuffer();
    this.w = 0;
    this.h = 0;
  }
}
class UITextRenderer  {
  constructor() {
    this.fm = new FontManager();
    this.measurer = new EVGTextMeasurer();
    this.rt = new RasterText();
    this.fontFamily = "Open Sans";
    this.hasFont = false;
    this.defaultSize = 14.0;
    this.cache = [];
    this.maxCache = 512;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  addFontDir (path) {
    this.fm.addFontsDirectory(path);
  };
  loadFont (family, relativePath) {
    const ok = this.fm.loadFont(relativePath);
    if ( ok ) {
      this.fontFamily = family;
      const ttf = this.fm.getFont(family);
      this.rt.setFont(ttf);
      this.rt.setFallbackManager(this.fm);
      const tm = new TTFTextMeasurer(this.fm);
      this.measurer = tm;
      this.hasFont = true;
      this.clearCache();
    }
    return ok;
  };
  addFace (relativePath) {
    const ok = this.fm.loadFont(relativePath);
    if ( ok ) {
      this.rt.setFallbackManager(this.fm);
      this.clearCache();
    }
    return ok;
  };
  loadFontBytes (family, data) {
    const ok = this.fm.loadFontBuffer(family, data);
    if ( ok ) {
      this.fontFamily = family;
      const ttf = this.fm.getFont(family);
      this.rt.setFont(ttf);
      this.rt.setFallbackManager(this.fm);
      const tm = new TTFTextMeasurer(this.fm);
      this.measurer = tm;
      this.hasFont = true;
      this.clearCache();
    }
    return ok;
  };
  addFaceBytes (data) {
    return this.fm.loadFontBuffer("", data);
  };
  setDefaultSize (sz) {
    this.defaultSize = sz;
  };
  clearCache () {
    this.cache.length = 0;
  };
  measureWidth (text, size) {
    const shaped = OfficeText.forMetrics(text);
    this.applyFace();
    if ( this.hasFont ) {
      return this.measurer.measureTextWidth(shaped, this.fontFamily, size);
    }
    const step = this.bmCharStep(size);
    return ((shaped.length)) * step;
  };
  ascent (size) {
    this.applyFace();
    if ( this.hasFont ) {
      return this.fm.getAscender(this.fontFamily, size);
    }
    return size * 0.8;
  };
  lineHeight (size) {
    this.applyFace();
    if ( this.hasFont ) {
      return this.measurer.getLineHeight(this.fontFamily, size);
    }
    return this.bmLineStep(size);
  };
  wrap (text, size, maxWidth) {
    this.applyFace();
    if ( this.hasFont ) {
      return this.measurer.wrapText(text, this.fontFamily, size, maxWidth);
    }
    return this.bitmapWrap(text, size, maxWidth);
  };
  drawLine (canvas, text, x, y, size, r, g, b, a) {
    if ( (text.length) == 0 ) {
      return;
    }
    if ( this.hasFont == false ) {
      const scale = this.bmScaleFor(size);
      this.bitmapDrawLine(canvas, x, y, scale, text, r, g, b);
      return;
    }
    const line = this.getCachedLine(text, size, r, g, b, a);
    if ( line.w > 0 ) {
      canvas.blitImage(line.img, x, y);
    }
  };
  drawLineClipped (canvas, text, x, y, size, r, g, b, a, cx0, cy0, cx1, cy1) {
    if ( (text.length) == 0 ) {
      return;
    }
    if ( this.hasFont == false ) {
      const scale = this.bmScaleFor(size);
      this.bitmapDrawLine(canvas, x, y, scale, text, r, g, b);
      return;
    }
    const line = this.getCachedLine(text, size, r, g, b, a);
    if ( line.w <= 0 ) {
      return;
    }
    const iw = line.img.width;
    const ih = line.img.height;
    if ( iw <= 0 ) {
      return;
    }
    if ( ih <= 0 ) {
      return;
    }
    let sx = 0;
    let sy = 0;
    let dx = x;
    let dy = y;
    let sw = iw;
    let sh = ih;
    if ( dx < cx0 ) {
      sx = cx0 - dx;
      sw = sw - sx;
      dx = cx0;
    }
    if ( dy < cy0 ) {
      sy = cy0 - dy;
      sh = sh - sy;
      dy = cy0;
    }
    if ( (dx + sw) > cx1 ) {
      sw = cx1 - dx;
    }
    if ( (dy + sh) > cy1 ) {
      sh = cy1 - dy;
    }
    if ( sw <= 0 ) {
      return;
    }
    if ( sh <= 0 ) {
      return;
    }
    canvas.blitImageRect(line.img, sx, sy, sw, sh, dx, dy);
  };
  drawText (canvas, text, x, y, size, maxWidth, r, g, b, a) {
    let lh = Math.floor( this.lineHeight(size));
    if ( lh < 1 ) {
      lh = 1;
    }
    let lines = [];
    if ( maxWidth > 0.0 ) {
      lines = (this).wrap(text, size, maxWidth);
    } else {
      lines.push(text);
    }
    let i = 0;
    let cy = y;
    const n = lines.length;
    while (i < n) {
      const ln = lines[i];
      this.drawLine(canvas, ln, x, cy, size, r, g, b, a);
      cy = cy + lh;
      i = i + 1;
    };
    return n * lh;
  };
  cacheKey (text, size, r, g, b, a) {
    return (((((((((((this.fontFamily + "|") + text) + "|") + (((Math.floor( size)).toString()))) + "|") + ((r.toString()))) + ",") + ((g.toString()))) + ",") + ((b.toString()))) + ",") + ((a.toString()));
  };
  findCached (key) {
    let i = 0;
    const n = this.cache.length;
    while (i < n) {
      const c = this.cache[i];
      if ( c.key == key ) {
        return c;
      }
      i = i + 1;
    };
    const miss = new UICachedLine();
    return miss;
  };
  applyFace () {
    if ( this.hasFont == false ) {
      return;
    }
    const ttf = this.fm.getFont(this.fontFamily);
    this.rt.setFont(ttf);
  };
  getCachedLine (text, size, r, g, b, a) {
    this.applyFace();
    const key = this.cacheKey(text, size, r, g, b, a);
    const hit = this.findCached(key);
    if ( (hit.key.length) > 0 ) {
      this.cacheHits = this.cacheHits + 1;
      return hit;
    }
    this.cacheMisses = this.cacheMisses + 1;
    const wf = this.measureWidth(text, size);
    const hf = this.lineHeight(size);
    let bw = (Math.floor( (wf + 1.0))) + 2;
    let bh = (Math.floor( (hf + 1.0))) + 2;
    if ( bw < 1 ) {
      bw = 1;
    }
    if ( bh < 1 ) {
      bh = 1;
    }
    const rb = new RasterBuffer();
    rb.create(bw, bh);
    this.rt.renderText(rb, text, 0.0, 0.0, size, r, g, b, a);
    const img = new ImageBuffer();
    img.width = rb.width;
    img.height = rb.height;
    img.pixels = rb.pixels;
    const line = new UICachedLine();
    line.key = key;
    line.img = img;
    line.w = bw;
    line.h = bh;
    if ( (this.cache.length) >= this.maxCache ) {
      this.clearCache();
    }
    this.cache.push(line);
    return line;
  };
  bmScaleFor (fontSize) {
    let scale = 2;
    if ( fontSize >= 14.0 ) {
      scale = 3;
    }
    return scale;
  };
  bmCharStep (fontSize) {
    const scale = this.bmScaleFor(fontSize);
    return scale * 4;
  };
  bmLineStep (fontSize) {
    const scale = this.bmScaleFor(fontSize);
    return scale * 6;
  };
  bitmapWrap (text, size, maxWidth) {
    let out = [];
    const step = this.bmCharStep(size);
    const words = text.split(" ");
    let cur = "";
    let i = 0;
    const n = words.length;
    while (i < n) {
      const word = words[i];
      let trial = word;
      if ( (cur.length) > 0 ) {
        trial = (cur + " ") + word;
      }
      const wpx = ((trial.length)) * step;
      if ( (wpx > maxWidth) && ((cur.length) > 0) ) {
        out.push(cur);
        cur = word;
      } else {
        cur = trial;
      }
      i = i + 1;
    };
    if ( (cur.length) > 0 ) {
      out.push(cur);
    }
    if ( (out.length) == 0 ) {
      out.push("");
    }
    return out;
  };
  bitmapDrawLine (canvas, x, y, scale, text, r, g, b) {
    const step = (scale * 3) + scale;
    let i = 0;
    const __len = text.length;
    let cx = x;
    while (i < __len) {
      const ch = text.substring(i, (i + 1) );
      this.bitmapGlyph(canvas, cx, y, scale, ch, r, g, b);
      cx = cx + step;
      i = i + 1;
    };
  };
  bitmapGlyph (canvas, x, y, scale, ch, r, g, b) {
    const bits = this.bmGlyphLookup(ch);
    let row = 0;
    while (row < 5) {
      let col = 0;
      while (col < 3) {
        const idx = (row * 3) + col;
        const pixel = bits.substring(idx, (idx + 1) );
        if ( pixel == "1" ) {
          canvas.fillRect(x + (col * scale), y + (row * scale), scale, scale, r, g, b);
        }
        col = col + 1;
      };
      row = row + 1;
    };
  };
  bmGlyphLookup (ch) {
    if ( (ch.length) == 0 ) {
      return "000000000000000";
    }
    const code = ch.charCodeAt(0 );
    if ( (code >= 97) && (code <= 122) ) {
      return this.bmGlyphBits((String.fromCharCode((code - 32))));
    }
    return this.bmGlyphBits(ch);
  };
  bmGlyphBits (ch) {
    if ( ch == "0" ) {
      return "111101101101111";
    }
    if ( ch == "1" ) {
      return "010110010010111";
    }
    if ( ch == "2" ) {
      return "111001111100111";
    }
    if ( ch == "3" ) {
      return "111001111001111";
    }
    if ( ch == "4" ) {
      return "101101111001001";
    }
    if ( ch == "5" ) {
      return "111100111001111";
    }
    if ( ch == "6" ) {
      return "111100111101111";
    }
    if ( ch == "7" ) {
      return "111001010010010";
    }
    if ( ch == "8" ) {
      return "111101111101111";
    }
    if ( ch == "9" ) {
      return "111101111001111";
    }
    if ( ch == "A" ) {
      return "111101101111101";
    }
    if ( ch == "B" ) {
      return "110101110101110";
    }
    if ( ch == "C" ) {
      return "111100100100111";
    }
    if ( ch == "D" ) {
      return "110101101101110";
    }
    if ( ch == "E" ) {
      return "111100111100111";
    }
    if ( ch == "F" ) {
      return "111100111100100";
    }
    if ( ch == "G" ) {
      return "111100101101111";
    }
    if ( ch == "H" ) {
      return "101101111101101";
    }
    if ( ch == "I" ) {
      return "111010010010111";
    }
    if ( ch == "J" ) {
      return "011110010000100";
    }
    if ( ch == "K" ) {
      return "101101110101101";
    }
    if ( ch == "L" ) {
      return "100100100100111";
    }
    if ( ch == "M" ) {
      return "101111111101101";
    }
    if ( ch == "N" ) {
      return "101110110101101";
    }
    if ( ch == "O" ) {
      return "111101101101111";
    }
    if ( ch == "P" ) {
      return "111101111100100";
    }
    if ( ch == "Q" ) {
      return "111101111001111";
    }
    if ( ch == "R" ) {
      return "111101111101101";
    }
    if ( ch == "S" ) {
      return "111100111001111";
    }
    if ( ch == "T" ) {
      return "111010010010010";
    }
    if ( ch == "U" ) {
      return "101101101101111";
    }
    if ( ch == "V" ) {
      return "101101101010010";
    }
    if ( ch == "W" ) {
      return "101101101101101";
    }
    if ( ch == "X" ) {
      return "101101010101101";
    }
    if ( ch == "Y" ) {
      return "101101010010010";
    }
    if ( ch == "Z" ) {
      return "111001010110111";
    }
    if ( ch == ":" ) {
      return "000010000010000";
    }
    if ( ch == "." ) {
      return "000000000000010";
    }
    if ( ch == "," ) {
      return "000000000010100";
    }
    if ( ch == "-" ) {
      return "000000111000000";
    }
    if ( ch == "_" ) {
      return "000000000000111";
    }
    if ( ch == "/" ) {
      return "001001010100100";
    }
    if ( ch == "!" ) {
      return "010010010000010";
    }
    if ( ch == "?" ) {
      return "111001011000010";
    }
    if ( ch == "(" ) {
      return "010100100100010";
    }
    if ( ch == ")" ) {
      return "010001001001010";
    }
    if ( ch == "[" ) {
      return "110100100100110";
    }
    if ( ch == "]" ) {
      return "011001001001011";
    }
    if ( ch == "+" ) {
      return "000010111010000";
    }
    if ( ch == "=" ) {
      return "000111000111000";
    }
    if ( ch == "<" ) {
      return "001010100010001";
    }
    if ( ch == ">" ) {
      return "100010001010100";
    }
    if ( ch == "*" ) {
      return "000101010101000";
    }
    if ( ch == "'" ) {
      return "010010000000000";
    }
    if ( ch == "\"" ) {
      return "101101000000000";
    }
    if ( ch == "@" ) {
      return "111101101100111";
    }
    if ( ch == "#" ) {
      return "101111101111101";
    }
    if ( ch == " " ) {
      return "000000000000000";
    }
    return "000000000000000";
  };
}
UITextRenderer.faceName = function(family, bold, italic) {
  if ( (family.length) == 0 ) {
    return "";
  }
  if ( bold ) {
    if ( italic ) {
      return family + "-Bold Italic";
    }
    return family + "-Bold";
  }
  if ( italic ) {
    return family + "-Italic";
  }
  return family;
};
class EVGFieldView  {
  constructor() {
    this.text = "";
    this.start = 0;
    this.caretX = 0.0;
    this.clipped = false;
  }
}
class EVGTextFit  {
  constructor() {
  }
}
EVGTextFit.fieldView = function(tr, text, caret, size, width) {
  const view = new EVGFieldView();
  const n = text.length;
  if ( n == 0 ) {
    return view;
  }
  const whole = tr.measureWidth(text, size);
  let c = caret;
  if ( c < 0 ) {
    c = 0;
  }
  if ( c > n ) {
    c = n;
  }
  if ( whole <= width ) {
    view.text = text;
    view.start = 0;
    view.caretX = tr.measureWidth((text.substring(0, c )), size);
    return view;
  }
  let start = 0;
  while (start < c) {
    const head = text.substring(start, c );
    if ( tr.measureWidth(head, size) <= width ) {
      break;
    }
    start = start + 1;
  };
  let stop = c;
  while (stop < n) {
    const candidate = text.substring(start, (stop + 1) );
    if ( tr.measureWidth(candidate, size) > width ) {
      break;
    }
    stop = stop + 1;
  };
  view.text = text.substring(start, stop );
  view.start = start;
  view.caretX = tr.measureWidth((text.substring(start, c )), size);
  view.clipped = true;
  return view;
};
EVGTextFit.fitLabel = function(tr, text, size, maxW) {
  if ( maxW <= 0 ) {
    return "";
  }
  const w = tr.measureWidth(text, size);
  if ( w <= (maxW) ) {
    return text;
  }
  const ell = "…";
  const ellW = tr.measureWidth(ell, size);
  const room = (maxW) - ellW;
  if ( room <= 0.0 ) {
    return ell;
  }
  const n = text.length;
  let keep = 0;
  let i = 1;
  while (i <= n) {
    const part = text.substring(0, i );
    if ( tr.measureWidth(part, size) > room ) {
      break;
    }
    keep = i;
    i = i + 1;
  };
  if ( keep == 0 ) {
    return ell;
  }
  return (text.substring(0, keep )) + ell;
};
EVGTextFit.caretIndexAt = function(tr, text, start, size, localX) {
  const n = text.length;
  if ( localX <= 0.0 ) {
    return start;
  }
  let i = start;
  while (i <= n) {
    const prefix = text.substring(start, i );
    const w = tr.measureWidth(prefix, size);
    if ( w >= localX ) {
      if ( i == start ) {
        return start;
      }
      const prev = text.substring(start, (i - 1) );
      const pw = tr.measureWidth(prev, size);
      const d0 = localX - pw;
      const d1 = w - localX;
      if ( d0 <= d1 ) {
        return i - 1;
      }
      return i;
    }
    i = i + 1;
  };
  return n;
};
class UIKey  {
  constructor() {
  }
}
UIKey.none = function() {
  return 0;
};
UIKey.backspace = function() {
  return 1;
};
UIKey.enter = function() {
  return 2;
};
UIKey.tab = function() {
  return 3;
};
UIKey.escape = function() {
  return 4;
};
UIKey.left = function() {
  return 5;
};
UIKey.right = function() {
  return 6;
};
UIKey.up = function() {
  return 7;
};
UIKey.down = function() {
  return 8;
};
UIKey.del = function() {
  return 9;
};
UIKey.home = function() {
  return 10;
};
UIKey.end = function() {
  return 11;
};
UIKey.pageUp = function() {
  return 12;
};
UIKey.pageDown = function() {
  return 13;
};
UIKey.f2 = function() {
  return 14;
};
UIKey.f5 = function() {
  return 15;
};
class UIInput  {
  constructor() {
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerDown = false;
    this.prevPointerDown = false;
    this.pointerPressed = false;
    this.pointerReleased = false;
    this.scrollDelta = 0;
    this.scrollDeltaX = 0;
    this.textInput = "";
    this.specialKeys = [];
    this.shiftDown = false;
    this.ctrlDown = false;
  }
  newFrame () {
    this.prevPointerDown = this.pointerDown;
    this.pointerPressed = false;
    this.pointerReleased = false;
    this.scrollDelta = 0;
    this.scrollDeltaX = 0;
    this.textInput = "";
    this.specialKeys.length = 0;
  };
  setPointerPos (px, py) {
    this.pointerX = px;
    this.pointerY = py;
  };
  setPointerDown (down) {
    if ( down && (this.prevPointerDown == false) ) {
      this.pointerPressed = true;
    }
    if ( (down == false) && this.prevPointerDown ) {
      this.pointerReleased = true;
    }
    this.pointerDown = down;
  };
  addScrollX (delta) {
    this.scrollDeltaX = this.scrollDeltaX + delta;
  };
  addScroll (delta) {
    this.scrollDelta = this.scrollDelta + delta;
  };
  pushText (s) {
    this.textInput = this.textInput + s;
  };
  pushChar (code) {
    this.textInput = this.textInput + (String.fromCharCode(code));
  };
  pushKey (key) {
    this.specialKeys.push(key);
  };
  setModifiers (shift, ctrl) {
    this.shiftDown = shift;
    this.ctrlDown = ctrl;
  };
  hasText () {
    return (this.textInput.length) > 0;
  };
  keyCount () {
    return this.specialKeys.length;
  };
  keyAt (i) {
    return this.specialKeys[i];
  };
  hasKey (key) {
    let i = 0;
    const n = this.specialKeys.length;
    while (i < n) {
      if ( (this.specialKeys[i]) == key ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
}
class EVGControlKind  {
  constructor() {
  }
}
EVGControlKind.label = function() {
  return 0;
};
EVGControlKind.button = function() {
  return 1;
};
EVGControlKind.radio = function() {
  return 2;
};
EVGControlKind.checkbox = function() {
  return 3;
};
EVGControlKind.separator = function() {
  return 4;
};
EVGControlKind.content = function() {
  return 5;
};
EVGControlKind.input = function() {
  return 6;
};
EVGControlKind.swatch = function() {
  return 7;
};
EVGControlKind.tool = function() {
  return 8;
};
class EVGControl  {
  constructor() {
    this.id = 0;
    this.kind = 0;
    this.text = "";
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.group = 0;
    this.checked = false;
    this.enabled = true;
    this.value = "";
    this.caret = 0;
    this.isDefault = false;
  }
  contains (px, py) {
    if ( px < this.x ) {
      return false;
    }
    if ( py < this.y ) {
      return false;
    }
    if ( px >= (this.x + this.w) ) {
      return false;
    }
    if ( py >= (this.y + this.h) ) {
      return false;
    }
    return true;
  };
}
class EVGWindowTheme  {
  constructor() {
    this.panel = EVGColor.rgb(252, 253, 255);
    this.titleBg = EVGColor.rgb(31, 78, 121);
    this.titleText = EVGColor.rgb(255, 255, 255);
    this.text = EVGColor.rgb(32, 38, 48);
    this.muted = EVGColor.rgb(120, 130, 145);
    this.border = EVGColor.rgb(70, 110, 160);
    this.buttonBg = EVGColor.rgb(238, 242, 248);
    this.buttonHot = EVGColor.rgb(219, 231, 245);
    this.accent = EVGColor.rgb(26, 115, 232);
    this.scrim = EVGColor.create(20.0, 30.0, 45.0, 0.28);
    this.hairline = EVGColor.rgb(206, 212, 222);
    this.shadow = EVGColor.create(20.0, 30.0, 45.0, 0.07);
    this.toolBg = EVGColor.rgb(255, 255, 255);
    this.toolIcon = EVGColor.rgb(74, 84, 98);
  }
}
class EVGWindow  {
  constructor() {
    this.wid = 0;
    this.stamp = 0;
    this.title = "";
    this.x = 0;
    this.y = 0;
    this.w = 300;
    this.h = 160;
    this.visible = false;
    this.modal = true;
    this.controls = [];
    this.theme = new EVGWindowTheme();
    this.titleH = 26;
    this.padX = 14;
    this.padY = 10;
    this.rowH = 22;
    this.fontSize = 13.0;
    this.activated = -1;
    this.hot = -1;
    this.dragging = false;
    this.dragDX = 0;
    this.dragDY = 0;
    this.cursorY = 0;
    this.columns = 1;
    this.flowW = 0;
    this.colIndex = 0;
    this.colTop = 0;
    this.colRowH = 0;
    this.focusedId = -1;
    this.labelW = 96;
    this.closable = false;
    this.closeId = -1;
    this.resizable = false;
    this.minW = 160;
    this.minH = 120;
    this.sizing = false;
    this.sizeW0 = 0;
    this.sizeH0 = 0;
    this.sizeX0 = 0;
    this.sizeY0 = 0;
    this.hasContent = false;
    this.contentId = -1;
    this.contentVersion = 0;
    this.bare = false;
    this.toolsOpen = false;
    this.toolSide = 22;
    this.toolGap = 4;
    this.toolPad = 6;
  }
  topInset () {
    if ( this.bare ) {
      return 0;
    }
    return this.titleH;
  };
  reset () {
    this.controls.length = 0;
    this.cursorY = this.topInset() + this.padY;
    this.toolsOpen = false;
    this.activated = -1;
    this.hot = -1;
    this.columns = 1;
    this.colIndex = 0;
    this.focusedId = -1;
    this.flowW = 0;
  };
  addControl (id, kind, text, height) {
    const c = new EVGControl();
    c.id = id;
    c.kind = kind;
    c.text = text;
    c.h = height;
    const flow = this.flowWidth();
    if ( this.columns > 1 ) {
      const cw = ((flow / this.columns) | 0);
      c.x = this.padX + (this.colIndex * cw);
      c.y = this.colTop;
      c.w = cw - 8;
      this.colRowH = height;
      this.colIndex = this.colIndex + 1;
      if ( this.colIndex >= this.columns ) {
        this.colIndex = 0;
        this.colTop = (this.colTop + height) + 4;
      }
    } else {
      c.x = this.padX;
      c.y = this.cursorY;
      c.w = flow;
      this.cursorY = (this.cursorY + height) + 4;
    }
    this.controls.push(c);
    return c;
  };
  flowWidth () {
    const full = this.w - (this.padX * 2);
    if ( this.flowW <= 0 ) {
      return full;
    }
    if ( this.flowW > full ) {
      return full;
    }
    return this.flowW;
  };
  beginColumns (n) {
    if ( n < 1 ) {
      return;
    }
    this.columns = n;
    this.colIndex = 0;
    this.colTop = this.cursorY;
    this.colRowH = this.rowH;
  };
  endColumns () {
    this.cursorY = this.colTop;
    if ( this.colIndex > 0 ) {
      this.cursorY = (this.colTop + this.colRowH) + 4;
    }
    this.columns = 1;
    this.colIndex = 0;
  };
  addLabel (text) {
    this.addControl(-1, EVGControlKind.label(), text, this.rowH);
  };
  addSeparator () {
    this.addControl(-1, EVGControlKind.separator(), "", 8);
  };
  addRadio (id, text, group, selected) {
    const c = this.addControl(id, EVGControlKind.radio(), text, this.rowH);
    c.group = group;
    c.checked = selected;
  };
  addCheckbox (id, text, selected) {
    const c = this.addControl(id, EVGControlKind.checkbox(), text, this.rowH);
    c.checked = selected;
  };
  addSwatch (id, hex, group, selected) {
    const side = 26;
    const c = this.addControl(id, EVGControlKind.swatch(), "", side);
    c.value = hex;
    c.group = group;
    c.checked = selected;
    if ( c.w != side ) {
      c.w = side;
    }
  };
  addContent (id, height) {
    const c = this.addControl(id, EVGControlKind.content(), "", height);
    this.hasContent = true;
    this.contentId = id;
  };
  addContentAt (id, x0, y0, w0, h0) {
    const c = new EVGControl();
    c.id = id;
    c.kind = EVGControlKind.content();
    c.x = x0;
    c.y = y0;
    c.w = w0;
    c.h = h0;
    this.controls.push(c);
    this.hasContent = true;
    this.contentId = id;
  };
  growHeight (minH) {
    if ( this.h < minH ) {
      this.h = minH;
    }
  };
  contentControl () {
    return this.controlById(this.contentId);
  };
  contentX () {
    const c = this.contentControl();
    return this.x + c.x;
  };
  contentY () {
    const c = this.contentControl();
    return this.y + c.y;
  };
  contentW () {
    const c = this.contentControl();
    return c.w;
  };
  contentH () {
    const c = this.contentControl();
    return c.h;
  };
  setSize (nw, nh) {
    let wantW = nw;
    let wantH = nh;
    if ( wantW < this.minW ) {
      wantW = this.minW;
    }
    if ( wantH < this.minH ) {
      wantH = this.minH;
    }
    if ( wantW == this.w ) {
      if ( wantH == this.h ) {
        return;
      }
    }
    const dw = wantW - this.w;
    const dh = wantH - this.h;
    this.w = wantW;
    this.h = wantH;
    let i = 0;
    let past = false;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.kind == EVGControlKind.tool() ) {
      } else {
        if ( c.kind == EVGControlKind.button() ) {
          c.x = c.x + dw;
          c.y = c.y + dh;
        } else {
          if ( c.id == this.contentId ) {
            if ( this.hasContent ) {
              c.w = c.w + dw;
              c.h = c.h + dh;
              past = true;
              this.contentVersion = this.contentVersion + 1;
            }
          } else {
            if ( past ) {
              c.y = c.y + dh;
            } else {
              c.w = c.w + dw;
            }
          }
        }
      }
      i = i + 1;
    };
    this.layoutTools();
  };
  addInput (id, label, value) {
    const c = this.addControl(id, EVGControlKind.input(), label, (this.rowH + 4));
    c.value = value;
    c.caret = value.length;
    if ( this.focusedId < 0 ) {
      this.focusedId = id;
    }
  };
  inputValue (id) {
    const c = this.controlById(id);
    return c.value;
  };
  setInputValue (id, value) {
    const c = this.controlById(id);
    c.value = value;
    c.caret = value.length;
  };
  focusedControl () {
    return this.controlById(this.focusedId);
  };
  focusNext () {
    let ids = [];
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.kind == EVGControlKind.input() ) {
        if ( c.enabled ) {
          ids.push(c.id);
        }
      }
      i = i + 1;
    };
    const n = ids.length;
    if ( n == 0 ) {
      return;
    }
    let at = -1;
    let k = 0;
    while (k < n) {
      if ( (ids[k]) == this.focusedId ) {
        at = k;
      }
      k = k + 1;
    };
    let next = at + 1;
    if ( next >= n ) {
      next = 0;
    }
    this.focusedId = ids[next];
  };
  addButtonRow (ids, labels, defaultId) {
    const n = ids.length;
    if ( n == 0 ) {
      return;
    }
    const bh = 26;
    const gap = 8;
    const maxW = 92;
    const minW_1 = 56;
    const avail = this.w - (this.padX * 2);
    let perRow = n;
    while (perRow > 1) {
      const need = (perRow * minW_1) + ((perRow - 1) * gap);
      if ( need <= avail ) {
        break;
      }
      perRow = perRow - 1;
    };
    let bw = (((avail - ((perRow - 1) * gap)) / perRow) | 0);
    if ( bw > maxW ) {
      bw = maxW;
    }
    if ( bw < 24 ) {
      bw = 24;
    }
    let rowY = this.cursorY + 6;
    let placed = 0;
    while (placed < n) {
      let count = n - placed;
      if ( count > perRow ) {
        count = perRow;
      }
      let right = this.w - this.padX;
      let i = (placed + count) - 1;
      while (i >= placed) {
        const c = new EVGControl();
        c.id = ids[i];
        c.kind = EVGControlKind.button();
        c.text = labels[i];
        c.w = bw;
        c.h = bh;
        c.x = right - bw;
        if ( c.x < this.padX ) {
          c.x = this.padX;
        }
        c.y = rowY;
        if ( c.id == defaultId ) {
          c.isDefault = true;
        }
        this.controls.push(c);
        right = (right - bw) - gap;
        i = i - 1;
      };
      placed = placed + count;
      if ( placed < n ) {
        rowY = (rowY + bh) + gap;
      }
    };
    this.cursorY = (rowY + bh) + this.padY;
  };
  finish () {
    this.h = this.cursorY;
    const floor = this.topInset() + 40;
    if ( this.h < floor ) {
      this.h = floor;
    }
    this.layoutTools();
  };
  addTool (id, glyph) {
    const c = new EVGControl();
    c.id = id;
    c.kind = EVGControlKind.tool();
    c.value = glyph;
    c.w = this.toolSide;
    c.h = this.toolSide;
    this.controls.push(c);
    this.layoutTools();
  };
  toolCount () {
    let n = 0;
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.kind == EVGControlKind.tool() ) {
        n = n + 1;
      }
      i = i + 1;
    };
    return n;
  };
  layoutTools () {
    const n = this.toolCount();
    if ( n == 0 ) {
      return;
    }
    const span = (n * this.toolSide) + ((n - 1) * this.toolGap);
    let x0 = (this.w - this.toolPad) - span;
    if ( x0 < this.toolPad ) {
      x0 = this.toolPad;
    }
    let seen = 0;
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.kind == EVGControlKind.tool() ) {
        c.w = this.toolSide;
        c.h = this.toolSide;
        c.x = x0 + (seen * (this.toolSide + this.toolGap));
        c.y = this.toolPad;
        seen = seen + 1;
      }
      i = i + 1;
    };
  };
  openWithin (px, py, pageW, pageH) {
    let ox = px;
    let oy = py;
    if ( (ox + this.w) > pageW ) {
      ox = pageW - (this.w + 8);
    }
    if ( ox < 4 ) {
      ox = 4;
    }
    if ( (oy + this.h) > pageH ) {
      oy = pageH - (this.h + 8);
    }
    if ( oy < 4 ) {
      oy = 4;
    }
    this.openAt(ox, oy);
  };
  openAt (px, py) {
    this.x = px;
    this.y = py;
    this.visible = true;
    this.activated = -1;
    this.dragging = false;
  };
  close () {
    this.visible = false;
    this.dragging = false;
    this.hot = -1;
  };
  controlById (id) {
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.id == id ) {
        return c;
      }
      i = i + 1;
    };
    return new EVGControl();
  };
  isChecked (id) {
    const c = this.controlById(id);
    return c.checked;
  };
  setChecked (id, value) {
    const c = this.controlById(id);
    c.checked = value;
  };
  selectRadio (id) {
    const target = this.controlById(id);
    const g = target.group;
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      let exclusive = false;
      if ( c.kind == EVGControlKind.radio() ) {
        exclusive = true;
      }
      if ( c.kind == EVGControlKind.swatch() ) {
        exclusive = true;
      }
      if ( exclusive ) {
        if ( c.group == g ) {
          c.checked = false;
        }
      }
      i = i + 1;
    };
    target.checked = true;
  };
  selectedInGroup (group) {
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      let exclusive = false;
      if ( c.kind == EVGControlKind.radio() ) {
        exclusive = true;
      }
      if ( c.kind == EVGControlKind.swatch() ) {
        exclusive = true;
      }
      if ( exclusive ) {
        if ( c.group == group ) {
          if ( c.checked ) {
            return c.id;
          }
        }
      }
      i = i + 1;
    };
    return -1;
  };
  selectedSwatchValue (group) {
    const id = this.selectedInGroup(group);
    if ( id < 0 ) {
      return "";
    }
    const c = this.controlById(id);
    if ( c.kind != EVGControlKind.swatch() ) {
      return "";
    }
    return c.value;
  };
  defaultButtonId () {
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.isDefault ) {
        return c.id;
      }
      i = i + 1;
    };
    return -1;
  };
  containsPoint (px, py) {
    if ( px < this.x ) {
      return false;
    }
    if ( py < this.y ) {
      return false;
    }
    if ( px >= (this.x + this.w) ) {
      return false;
    }
    if ( py >= (this.y + this.h) ) {
      return false;
    }
    return true;
  };
  onTitleBar (px, py) {
    if ( this.containsPoint(px, py) == false ) {
      return false;
    }
    if ( this.bare ) {
      return false;
    }
    return py < (this.y + this.titleH);
  };
  onDragHandle (px, py) {
    if ( this.containsPoint(px, py) == false ) {
      return false;
    }
    if ( this.bare ) {
      return true;
    }
    return py < (this.y + this.titleH);
  };
  boxSide () {
    return 14;
  };
  onCloseBox (px, py) {
    if ( this.closable == false ) {
      return false;
    }
    if ( this.bare ) {
      return false;
    }
    const side = this.boxSide();
    const bx = (this.x + this.w) - (side + 8);
    const by = this.y + ((((this.titleH - side) / 2) | 0));
    if ( px < bx ) {
      return false;
    }
    if ( py < by ) {
      return false;
    }
    if ( px >= (bx + side) ) {
      return false;
    }
    return py < (by + side);
  };
  onResizeGrip (px, py) {
    if ( this.resizable == false ) {
      return false;
    }
    if ( this.bare ) {
      if ( this.toolsOpen == false ) {
        return false;
      }
    }
    const side = this.boxSide();
    const gx = (this.x + this.w) - side;
    const gy = (this.y + this.h) - side;
    if ( px < gx ) {
      return false;
    }
    if ( py < gy ) {
      return false;
    }
    if ( px >= (gx + side) ) {
      return false;
    }
    return py < (gy + side);
  };
  controlAt (px, py) {
    if ( this.containsPoint(px, py) == false ) {
      return -1;
    }
    const lx = px - this.x;
    const ly = py - this.y;
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      let interactive = false;
      if ( c.kind == EVGControlKind.button() ) {
        interactive = true;
      }
      if ( c.kind == EVGControlKind.radio() ) {
        interactive = true;
      }
      if ( c.kind == EVGControlKind.checkbox() ) {
        interactive = true;
      }
      if ( c.kind == EVGControlKind.input() ) {
        interactive = true;
      }
      if ( c.kind == EVGControlKind.swatch() ) {
        interactive = true;
      }
      if ( c.kind == EVGControlKind.tool() ) {
        interactive = this.toolsOpen;
      }
      if ( interactive && c.enabled ) {
        if ( (c).contains(lx, ly) ) {
          return c.id;
        }
      }
      i = i + 1;
    };
    return -1;
  };
  handlePointer (px, py, pressed, down, released) {
    this.activated = -1;
    if ( this.visible == false ) {
      return false;
    }
    this.hot = this.controlAt(px, py);
    if ( this.sizing ) {
      if ( down ) {
        this.setSize(this.sizeW0 + (px - this.sizeX0), this.sizeH0 + (py - this.sizeY0));
        return true;
      }
      this.sizing = false;
      return true;
    }
    if ( this.dragging ) {
      if ( down ) {
        this.x = px - this.dragDX;
        this.y = py - this.dragDY;
        return true;
      }
      this.dragging = false;
      return true;
    }
    if ( pressed ) {
      if ( this.onCloseBox(px, py) ) {
        this.activated = this.closeId;
        this.close();
        return true;
      }
      if ( this.onResizeGrip(px, py) ) {
        this.sizing = true;
        this.sizeX0 = px;
        this.sizeY0 = py;
        this.sizeW0 = this.w;
        this.sizeH0 = this.h;
        return true;
      }
      const id = this.controlAt(px, py);
      if ( id >= 0 ) {
        const c = this.controlById(id);
        if ( c.kind == EVGControlKind.radio() ) {
          this.selectRadio(id);
        }
        if ( c.kind == EVGControlKind.swatch() ) {
          this.selectRadio(id);
          this.activated = id;
        }
        if ( c.kind == EVGControlKind.checkbox() ) {
          c.checked = c.checked == false;
        }
        if ( c.kind == EVGControlKind.button() ) {
          this.activated = id;
        }
        if ( c.kind == EVGControlKind.input() ) {
          this.focusedId = id;
          c.caret = c.value.length;
        }
        if ( c.kind == EVGControlKind.tool() ) {
          this.activated = id;
        }
        return true;
      }
      if ( this.onDragHandle(px, py) ) {
        if ( this.bare ) {
          this.toolsOpen = true;
        }
        this.dragging = true;
        this.dragDX = px - this.x;
        this.dragDY = py - this.y;
        return true;
      }
      if ( this.containsPoint(px, py) ) {
        return true;
      }
      if ( this.modal ) {
        return true;
      }
      return false;
    }
    if ( this.containsPoint(px, py) ) {
      return true;
    }
    return this.modal;
  };
  handleKey (key, escapeKey, enterKey) {
    this.activated = -1;
    if ( this.visible == false ) {
      return false;
    }
    if ( this.modal == false ) {
      return false;
    }
    if ( key == escapeKey ) {
      this.close();
      return true;
    }
    if ( key == enterKey ) {
      const d = this.defaultButtonId();
      if ( d >= 0 ) {
        this.activated = d;
      }
      return true;
    }
    if ( key == UIKey.tab() ) {
      this.focusNext();
      return true;
    }
    const f = this.focusedControl();
    if ( f.kind == EVGControlKind.input() ) {
      const n = f.value.length;
      if ( f.caret > n ) {
        f.caret = n;
      }
      if ( key == UIKey.backspace() ) {
        if ( f.caret > 0 ) {
          f.value = (f.value.substring(0, (f.caret - 1) )) + (f.value.substring(f.caret, n ));
          f.caret = f.caret - 1;
        }
        return true;
      }
      if ( key == UIKey.del() ) {
        if ( f.caret < n ) {
          f.value = (f.value.substring(0, f.caret )) + (f.value.substring((f.caret + 1), n ));
        }
        return true;
      }
      if ( key == UIKey.left() ) {
        if ( f.caret > 0 ) {
          f.caret = f.caret - 1;
        }
        return true;
      }
      if ( key == UIKey.right() ) {
        if ( f.caret < n ) {
          f.caret = f.caret + 1;
        }
        return true;
      }
      if ( key == UIKey.home() ) {
        f.caret = 0;
        return true;
      }
      if ( key == UIKey.end() ) {
        f.caret = n;
        return true;
      }
    }
    return this.modal;
  };
  handleText (s) {
    if ( this.visible == false ) {
      return false;
    }
    if ( (s.length) == 0 ) {
      return this.modal;
    }
    const f = this.focusedControl();
    if ( f.kind != EVGControlKind.input() ) {
      return this.modal;
    }
    const n = f.value.length;
    if ( f.caret > n ) {
      f.caret = n;
    }
    f.value = ((f.value.substring(0, f.caret )) + s) + (f.value.substring(f.caret, n ));
    f.caret = f.caret + (s.length);
    return true;
  };
  a11y (t, parentId) {
    if ( this.visible == false ) {
      return;
    }
    const winId = this.a11yId();
    const win = t.node(winId, parentId, EVGA11yRole.dialog());
    let caption = this.title;
    if ( (caption.length) == 0 ) {
      caption = "Panel";
    }
    win.name = caption;
    win.modal = this.modal;
    t.place(win, this.x, this.y, this.w, this.h);
    const order = this.a11yOrder();
    let i = 0;
    while (i < (order.length)) {
      const idx = order[i];
      const c = this.controls[idx];
      const cid = (winId + "/ctl:") + ((c.id.toString()));
      const n = this.a11yControl(t, cid, winId, c);
      if ( (n.id.length) > 0 ) {
        t.place(n, c.x, c.y, c.w, c.h);
        n.disabled = c.enabled == false;
      }
      i = i + 1;
    };
    if ( this.focusedId >= 0 ) {
      const fid = (winId + "/ctl:") + ((this.focusedId.toString()));
      if ( (t).has(fid) ) {
        t.setFocus(fid);
      }
    }
  };
  a11yOrder () {
    let order = [];
    const n = this.controls.length;
    let used = [];
    let k = 0;
    while (k < n) {
      used.push(false);
      k = k + 1;
    };
    let placed = 0;
    while (placed < n) {
      let best = -1;
      let i = 0;
      while (i < n) {
        if ( (used[i]) == false ) {
          if ( best < 0 ) {
            best = i;
          } else {
            const a = this.controls[i];
            const b = this.controls[best];
            let dy = a.y - b.y;
            if ( dy < 0 ) {
              dy = 0 - dy;
            }
            if ( dy <= 4 ) {
              if ( a.x < b.x ) {
                best = i;
              }
            } else {
              if ( a.y < b.y ) {
                best = i;
              }
            }
          }
        }
        i = i + 1;
      };
      if ( best < 0 ) {
        placed = n;
      } else {
        order.push(best);
        used[best] = true;
        placed = placed + 1;
      }
    };
    return order;
  };
  a11yId () {
    if ( this.stamp > 0 ) {
      return "win:" + ((this.stamp.toString()));
    }
    return "win:w" + ((this.wid.toString()));
  };
  a11yControl (t, cid, winId, c) {
    const kind = c.kind;
    if ( kind == 0 ) {
      return t.label(cid, winId, c.text);
    }
    if ( kind == 1 ) {
      const b = t.button(cid, winId, c.text);
      if ( c.isDefault ) {
        b.description = "default button";
      }
      return b;
    }
    if ( kind == 2 ) {
      const r = t.node(cid, winId, EVGA11yRole.radio());
      r.name = c.text;
      r.focusable = true;
      r.actActivate = true;
      r.checked = EVGWindow.a11yTri(c.checked);
      return r;
    }
    if ( kind == 3 ) {
      const cb = t.node(cid, winId, EVGA11yRole.checkbox());
      cb.name = c.text;
      cb.focusable = true;
      cb.actActivate = true;
      cb.checked = EVGWindow.a11yTri(c.checked);
      return cb;
    }
    if ( kind == 6 ) {
      const f = t.field(cid, winId, c.text, c.value);
      f.caret = c.caret;
      return f;
    }
    if ( kind == 7 ) {
      const sw = t.node(cid, winId, EVGA11yRole.radio());
      sw.name = "colour " + c.value;
      sw.focusable = true;
      sw.actActivate = true;
      sw.checked = EVGWindow.a11yTri(c.checked);
      return sw;
    }
    if ( kind == 8 ) {
      const tool = t.button(cid, winId, c.value);
      return tool;
    }
    return new EVGA11yNode();
  };
  rect (dl, rx, ry, rw, rh, col) {
    dl.addRect(rx, ry, rw, rh, col);
  };
  frame (dl, rx, ry, rw, rh, thick, col) {
    dl.addFrame(rx, ry, rw, rh, thick, col);
  };
  text (dl, s, tx, ty, size, col, tr, bold) {
    const w_1 = tr.measureWidth(s, size);
    const h_1 = tr.lineHeight(size);
    dl.addText(s, tx, ty, size, col, tr.fontFamily, bold, false, w_1, h_1);
  };
  paint (dl, tr, pageW, pageH) {
    if ( this.visible == false ) {
      return;
    }
    if ( this.modal ) {
      this.rect(dl, 0, 0, pageW, pageH, this.theme.scrim);
    }
    if ( this.bare ) {
      this.rect(dl, this.x + 1, this.y + 2, this.w, this.h, this.theme.shadow);
      this.rect(dl, this.x + 2, this.y + 3, this.w, this.h, this.theme.shadow);
      this.rect(dl, this.x, this.y, this.w, this.h, this.theme.panel);
      let edge0 = this.theme.hairline;
      if ( this.toolsOpen ) {
        edge0 = this.theme.accent;
      }
      this.frame(dl, this.x, this.y, this.w, this.h, 1.0, edge0);
    } else {
      this.rect(dl, this.x, this.y, this.w, this.h, this.theme.panel);
      this.frame(dl, this.x, this.y, this.w, this.h, 1.0, this.theme.border);
      this.rect(dl, this.x, this.y, this.w, this.titleH, this.theme.titleBg);
      this.text(dl, this.title, this.x + this.padX, this.y + 6, this.fontSize, this.theme.titleText, tr, true);
      if ( this.closable ) {
        const side = this.boxSide();
        const bx = (this.x + this.w) - (side + 8);
        const by = this.y + ((((this.titleH - side) / 2) | 0));
        this.frame(dl, bx, by, side, side, 1.0, this.theme.titleText);
        this.rect(dl, bx + 3, by + (((side / 2) | 0)), side - 6, 1, this.theme.titleText);
        this.rect(dl, bx + (((side / 2) | 0)), by + 3, 1, side - 6, this.theme.titleText);
      }
    }
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      const cx = this.x + c.x;
      const cy = this.y + c.y;
      if ( c.kind == EVGControlKind.label() ) {
        const room = (this.w - c.x) - 12;
        this.text(dl, EVGTextFit.fitLabel(tr, c.text, this.fontSize, room), cx, cy + 4, this.fontSize, this.theme.text, tr, false);
      }
      if ( c.kind == EVGControlKind.content() ) {
        this.rect(dl, cx, cy, c.w, c.h, this.theme.panel);
        if ( this.bare == false ) {
          this.frame(dl, cx, cy, c.w, c.h, 1.0, this.theme.muted);
        }
      }
      if ( c.kind == EVGControlKind.separator() ) {
        this.rect(dl, cx, cy + 3, c.w, 1, this.theme.muted);
      }
      if ( c.kind == EVGControlKind.radio() ) {
        const rr = 12;
        const ry2 = cy + ((((c.h - rr) / 2) | 0));
        let edge = this.theme.border;
        let ink = this.theme.text;
        if ( c.enabled == false ) {
          edge = this.theme.muted;
          ink = this.theme.muted;
        }
        this.frame(dl, cx, ry2, rr, rr, 1.0, edge);
        if ( c.checked ) {
          this.rect(dl, cx + 3, ry2 + 3, rr - 6, rr - 6, this.theme.accent);
        }
        this.text(dl, c.text, (cx + rr) + 8, cy + 4, this.fontSize, ink, tr, false);
      }
      if ( c.kind == EVGControlKind.checkbox() ) {
        const br = 12;
        const by2 = cy + ((((c.h - br) / 2) | 0));
        this.frame(dl, cx, by2, br, br, 1.0, this.theme.border);
        if ( c.checked ) {
          this.rect(dl, cx + 3, by2 + 3, br - 6, br - 6, this.theme.accent);
        }
        this.text(dl, c.text, (cx + br) + 8, cy + 4, this.fontSize, this.theme.text, tr, false);
      }
      if ( c.kind == EVGControlKind.swatch() ) {
        const fill = EVGColor.parse(c.value);
        if ( c.checked ) {
          this.rect(dl, cx - 3, cy - 3, c.w + 6, c.h + 6, EVGColor.rgb(20, 30, 45));
          this.rect(dl, cx - 2, cy - 2, c.w + 4, c.h + 4, EVGColor.rgb(255, 255, 255));
        } else {
          if ( this.hot == c.id ) {
            this.rect(dl, cx - 2, cy - 2, c.w + 4, c.h + 4, this.theme.accent);
            this.rect(dl, cx - 1, cy - 1, c.w + 2, c.h + 2, EVGColor.rgb(255, 255, 255));
          }
        }
        this.rect(dl, cx, cy, c.w, c.h, fill);
        let edge3 = this.theme.border;
        if ( c.checked ) {
          edge3 = this.theme.accent;
        }
        let thick = 1.0;
        if ( c.checked ) {
          thick = 2.0;
        }
        this.frame(dl, cx, cy, c.w, c.h, thick, edge3);
        if ( ((fill.r > 230.0) && (fill.g > 230.0)) && (fill.b > 230.0) ) {
          this.frame(dl, cx + 1, cy + 1, c.w - 2, c.h - 2, 1.0, this.theme.muted);
        }
      }
      if ( c.kind == EVGControlKind.input() ) {
        let lw = this.labelW;
        if ( (c.text.length) == 0 ) {
          lw = 0;
        }
        if ( lw > 0 ) {
          this.text(dl, c.text, cx, cy + 5, this.fontSize, this.theme.text, tr, false);
        }
        const fx = cx + lw;
        const fw = c.w - lw;
        this.rect(dl, fx, cy, fw, c.h, EVGColor.rgb(255, 255, 255));
        let edge2 = this.theme.border;
        if ( this.focusedId != c.id ) {
          edge2 = this.theme.muted;
        }
        this.frame(dl, fx, cy, fw, c.h, 1.0, edge2);
        const room_1 = (fw - 10);
        const shown = EVGTextFit.fieldView(tr, c.value, c.caret, this.fontSize, room_1);
        this.text(dl, shown.text, fx + 5, cy + 4, this.fontSize, this.theme.text, tr, false);
        if ( this.focusedId == c.id ) {
          const caretX = Math.floor( shown.caretX);
          this.rect(dl, (fx + 5) + caretX, cy + 3, 1, c.h - 6, this.theme.text);
        }
      }
      if ( c.kind == EVGControlKind.tool() ) {
      }
      if ( c.kind == EVGControlKind.button() ) {
        let bg = this.theme.buttonBg;
        if ( this.hot == c.id ) {
          bg = this.theme.buttonHot;
        }
        this.rect(dl, cx, cy, c.w, c.h, bg);
        let edge_1 = this.theme.border;
        if ( c.isDefault == false ) {
          edge_1 = this.theme.muted;
        }
        this.frame(dl, cx, cy, c.w, c.h, 1.0, edge_1);
        const tw = Math.floor( tr.measureWidth(c.text, this.fontSize));
        const tx2 = cx + ((((c.w - tw) / 2) | 0));
        this.text(dl, c.text, tx2, cy + 5, this.fontSize, this.theme.text, tr, c.isDefault);
      }
      i = i + 1;
    };
    if ( this.resizable ) {
      let showGrip = true;
      let gink = this.theme.muted;
      if ( this.bare ) {
        showGrip = this.toolsOpen;
        gink = this.theme.hairline;
      }
      if ( showGrip ) {
        const gside = this.boxSide();
        const gx = (this.x + this.w) - gside;
        const gy = (this.y + this.h) - gside;
        let line = 0;
        while (line < 3) {
          const off = 3 + (line * 4);
          this.rect(dl, gx + off, (gy + gside) - 3, gside - off, 1, gink);
          this.rect(dl, (gx + gside) - 3, gy + off, 1, gside - off, gink);
          line = line + 1;
        };
      }
    }
  };
  paintOverlay (dl, tr) {
    if ( this.visible == false ) {
      return;
    }
    if ( this.toolsOpen == false ) {
      return;
    }
    let i = 0;
    while (i < (this.controls.length)) {
      const c = this.controls[i];
      if ( c.kind == EVGControlKind.tool() ) {
        const cx = this.x + c.x;
        const cy = this.y + c.y;
        let bg = this.theme.toolBg;
        if ( this.hot == c.id ) {
          bg = this.theme.buttonHot;
        }
        this.rect(dl, cx, cy, c.w, c.h, bg);
        this.frame(dl, cx, cy, c.w, c.h, 1.0, this.theme.hairline);
        this.glyph(dl, c.value, cx, cy, c.w, c.h, this.theme.toolIcon);
      }
      i = i + 1;
    };
  };
  glyph (dl, name, gx, gy, gw, gh, col) {
    const cx = gx + (((gw / 2) | 0));
    const cy = gy + (((gh / 2) | 0));
    if ( name == "close" ) {
      const s = 4;
      let k = 0 - s;
      while (k <= s) {
        this.rect(dl, cx + k, cy + k, 1, 1, col);
        this.rect(dl, cx + k, cy - k, 1, 1, col);
        k = k + 1;
      };
      return;
    }
    if ( name == "copy" ) {
      this.frame(dl, gx + 5, gy + 5, 8, 9, 1.0, col);
      this.rect(dl, gx + 8, gy + 8, 9, 10, EVGColor.rgb(255, 255, 255));
      this.frame(dl, gx + 8, gy + 8, 9, 10, 1.0, col);
      return;
    }
    if ( name == "edit" ) {
      let k2 = 0;
      while (k2 < 8) {
        this.rect(dl, (gx + 6) + k2, (gy + 13) - k2, 2, 2, col);
        k2 = k2 + 1;
      };
      this.rect(dl, gx + 5, gy + 15, 3, 2, col);
      return;
    }
    if ( name == "chevron" ) {
      let k3 = 0;
      while (k3 < 4) {
        this.rect(dl, (cx - 4) + k3, (cy - 2) + k3, 2, 2, col);
        this.rect(dl, (cx + 3) - k3, (cy - 2) + k3, 2, 2, col);
        k3 = k3 + 1;
      };
      return;
    }
    this.rect(dl, cx - 2, cy - 2, 4, 4, col);
  };
}
EVGWindow.a11yTri = function(on) {
  if ( on ) {
    return EVGA11yTri.yes();
  }
  return EVGA11yTri.no();
};
class EVGWindowManager  {
  constructor() {
    this.windows = [];
    this.added = 0;
  }
  add (win) {
    win.wid = (this.windows.length) + 1;
    this.added = this.added + 1;
    win.stamp = this.added;
    this.windows.push(win);
  };
  remove (win) {
    let keep = [];
    let i = 0;
    while (i < (this.windows.length)) {
      const wnd = this.windows[i];
      if ( wnd.wid != win.wid ) {
        keep.push(wnd);
      }
      i = i + 1;
    };
    this.windows.length = 0;
    let k = 0;
    while (k < (keep.length)) {
      this.windows.push(keep[k]);
      k = k + 1;
    };
  };
  anyVisible () {
    let i = 0;
    while (i < (this.windows.length)) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  anyModalVisible () {
    let i = 0;
    while (i < (this.windows.length)) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        if ( wnd.modal ) {
          return true;
        }
      }
      i = i + 1;
    };
    return false;
  };
  topmost () {
    let i = (this.windows.length) - 1;
    while (i >= 0) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        return wnd;
      }
      i = i - 1;
    };
    return new EVGWindow();
  };
  raise (win) {
    let keep = [];
    let i = 0;
    while (i < (this.windows.length)) {
      const wnd = this.windows[i];
      if ( wnd.wid != win.wid ) {
        keep.push(wnd);
      }
      i = i + 1;
    };
    this.windows.length = 0;
    let k = 0;
    while (k < (keep.length)) {
      this.windows.push(keep[k]);
      k = k + 1;
    };
    this.windows.push(win);
  };
  a11y (t, parentId) {
    let i = 0;
    while (i < (this.windows.length)) {
      const w0 = this.windows[i];
      w0.a11y(t, parentId);
      i = i + 1;
    };
  };
  handlePointer (px, py, pressed, down, released) {
    let c = 0;
    while (c < (this.windows.length)) {
      const w0 = this.windows[c];
      w0.activated = -1;
      c = c + 1;
    };
    if ( pressed ) {
      let owner = -1;
      let t = (this.windows.length) - 1;
      while (t >= 0) {
        const wt = this.windows[t];
        if ( wt.visible ) {
          if ( wt.containsPoint(px, py) ) {
            owner = wt.wid;
            t = -1;
          } else {
            t = t - 1;
          }
        } else {
          t = t - 1;
        }
      };
      let b = 0;
      while (b < (this.windows.length)) {
        const wb = this.windows[b];
        if ( wb.bare ) {
          if ( wb.wid != owner ) {
            wb.toolsOpen = false;
          }
        }
        b = b + 1;
      };
    }
    let i = (this.windows.length) - 1;
    while (i >= 0) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        if ( wnd.handlePointer(px, py, pressed, down, released) ) {
          if ( pressed ) {
            this.raise(wnd);
          }
          return true;
        }
      }
      i = i - 1;
    };
    return false;
  };
  handleKey (key, escapeKey, enterKey) {
    let i = (this.windows.length) - 1;
    while (i >= 0) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        if ( wnd.handleKey(key, escapeKey, enterKey) ) {
          return true;
        }
      }
      i = i - 1;
    };
    return false;
  };
  handleText (s) {
    let i = (this.windows.length) - 1;
    while (i >= 0) {
      const wnd = this.windows[i];
      if ( wnd.visible ) {
        if ( wnd.handleText(s) ) {
          return true;
        }
      }
      i = i - 1;
    };
    return false;
  };
  paint (dl, tr, pageW, pageH) {
    let i = 0;
    while (i < (this.windows.length)) {
      const wnd = this.windows[i];
      wnd.paint(dl, tr, pageW, pageH);
      wnd.paintOverlay(dl, tr);
      i = i + 1;
    };
  };
}
class A11yCheck  {
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
    this.ok(((((name + " (got '") + got) + "' want '") + want) + "')", got == want);
  };
  eqInt (name, got, want) {
    this.ok(((((name + " (got ") + ((got.toString()))) + " want ") + ((want.toString()))) + ")", got == want);
  };
  lintsClean (label, t) {
    const problems = t.lint();
    const n = problems.length;
    this.ok(label + " lints clean", n == 0);
    let i = 0;
    while (i < n) {
      console.log("    ! " + (problems[i]));
      i = i + 1;
    };
  };
}
class EVGA11yTest  {
  constructor() {
  }
}
EVGA11yTest.dialog = function(wm) {
  const w = new EVGWindow();
  w.title = "Find and replace";
  wm.add(w);
  w.visible = true;
  w.reset();
  w.addInput(1, "Find", "total");
  w.addInput(2, "Replace", "sum");
  w.addCheckbox(3, "Match case", true);
  const ids = [4, 5];
  const labels = ["Replace all", "Close"];
  w.addButtonRow(ids, labels, 4);
  w.finish();
  return w;
};
EVGA11yTest.hasSub = function(hay, needle) {
  const n = needle.length;
  const m = hay.length;
  if ( n == 0 ) {
    return true;
  }
  let i = 0;
  while ((i + n) <= m) {
    if ( (hay.substring(i, (i + n) )) == needle ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const c = new A11yCheck();
  console.log("== the model ==");
  const t = new EVGA11yTree();
  const root = t.group("app", "", "Sheet");
  t.place(root, 0, 0, 900, 560);
  const b = t.button("app/ok", "app", "OK");
  t.place(b, 10, 20, 80, 24);
  const f = t.field("app/find", "app", "Find", "total");
  t.place(f, 10, 60, 200, 24);
  f.caret = 5;
  const st = t.statusRegion("app/status", "app", "Ready");
  t.place(st, 0, 538, 900, 22);
  t.setFocus("app/find");
  c.eqStr("the first parentless node is the root", t.rootId, "app");
  c.eqInt("four nodes", (t).count(), 4);
  c.ok("a button can be activated", b.actActivate);
  c.ok("a field can be typed into", f.actSetValue);
  c.ok("the focused node is marked", f.focused);
  c.ok("and nothing else is", b.focused == false);
  c.lintsClean("a small tree", t);
  console.log("== focus is a property of the tree, not of a node ==");
  t.setFocus("app/ok");
  c.ok("the new one is focused", b.focused);
  c.ok("the old one is not", f.focused == false);
  c.eqStr("and the tree agrees", t.focusId, "app/ok");
  console.log("== roles are spelled the way ARIA spells them ==");
  c.eqStr("button", EVGA11yRole.ariaName(EVGA11yRole.button()), "button");
  c.eqStr("text field", EVGA11yRole.ariaName(EVGA11yRole.textField()), "textbox");
  c.eqStr("cell", EVGA11yRole.ariaName(EVGA11yRole.cell()), "gridcell");
  c.eqStr("decoration", EVGA11yRole.ariaName(EVGA11yRole.none()), "none");
  console.log("== the lints catch what nobody can see ==");
  const bad = new EVGA11yTree();
  const broot = bad.group("root", "", "App");
  bad.place(broot, 0, 0, 100, 100);
  const nameless = bad.node("root/x", "root", EVGA11yRole.button());
  nameless.focusable = true;
  bad.place(nameless, 0, 0, 20, 20);
  const orphan = bad.node("root/y", "nowhere", EVGA11yRole.text());
  orphan.name = "lost";
  bad.setFocus("root/gone");
  const problems = bad.lint();
  c.ok("three problems found", (problems.length) == 3);
  let all = "";
  let i = 0;
  while (i < (problems.length)) {
    all = (all + (problems[i])) + "\n";
    i = i + 1;
  };
  c.ok("a focusable thing with no name", EVGA11yTest.hasSub(all, "no accessible name"));
  c.ok("a node hanging off nothing", EVGA11yTest.hasSub(all, "is not in the tree"));
  c.ok("focus pointing at nobody", EVGA11yTest.hasSub(all, "focus points at"));
  console.log("== a dialog describes itself ==");
  const app = new EVGA11yTree();
  const aroot = app.group("app", "", "Sheet");
  app.place(aroot, 0, 0, 900, 560);
  const wm = new EVGWindowManager();
  const w = EVGA11yTest.dialog(wm);
  w.modal = true;
  w.focusedId = 2;
  wm.a11y(app, "app");
  const dlg = (app).find(w.a11yId());
  c.ok("it is a dialog", dlg.role == EVGA11yRole.dialog());
  c.eqStr("with the title as its name", dlg.name, "Find and replace");
  c.ok("and it says it is modal", dlg.modal);
  const find = (app).find((w.a11yId() + "/ctl:1"));
  c.ok("a text field is a text field", find.role == EVGA11yRole.textField());
  c.eqStr("labelled by what is in front of it", find.name, "Find");
  c.eqStr("carrying what has been typed", find.value, "total");
  const box = (app).find((w.a11yId() + "/ctl:3"));
  c.ok("a checkbox is a checkbox", box.role == EVGA11yRole.checkbox());
  c.eqInt("and it is ticked", box.checked, EVGA11yTri.yes());
  c.eqStr("the focused field has the keys", app.focusId, w.a11yId() + "/ctl:2");
  c.lintsClean("a dialog", app);
  console.log("== reading order is what the eye does, not what the array holds ==");
  const order = w.a11yOrder();
  let firstBtn = "";
  let lastBtn = "";
  let k = 0;
  while (k < (order.length)) {
    const ctl = w.controls[(order[k])];
    if ( ctl.kind == EVGControlKind.button() ) {
      if ( (firstBtn.length) == 0 ) {
        firstBtn = ctl.text;
      }
      lastBtn = ctl.text;
    }
    k = k + 1;
  };
  c.eqStr("the left button is read first", firstBtn, "Replace all");
  c.eqStr("the right one last", lastBtn, "Close");
  console.log("== ids survive a window being closed and another opened ==");
  (wm).remove(w);
  const w2 = EVGA11yTest.dialog(wm);
  c.eqInt("the stack position was reused", w2.wid, w.wid);
  c.ok("the accessibility id was not", w2.a11yId() != w.a11yId());
  console.log("== the JSON keeps the defaults out ==");
  const js = t.toJson();
  c.ok("names the root", EVGA11yTest.hasSub(js, "\"root\":\"app\""));
  c.ok("carries a generation", EVGA11yTest.hasSub(js, "\"gen\":"));
  c.ok("spells roles in ARIA", EVGA11yTest.hasSub(js, "\"role\":\"textbox\""));
  c.ok("says nothing about unchecked things", EVGA11yTest.hasSub(js, "\"checked\"") == false);
  console.log("");
  console.log((("passed " + ((c.passed.toString()))) + ", failed ") + ((c.failed.toString())));
  if ( c.failed > 0 ) {
    console.log("FAILED");
  } else {
    console.log("OK");
  }
}
__js_main();
