class ScVal_Nothing  {
  constructor() {
    this.__rg_kind = "ScVal_Nothing";
  }
}
class ScVal_Str  {
  constructor(text) {
    this.__rg_kind = "ScVal_Str";
    this.text = "";
    this.text = text;
  }
}
class ScVal_Bool  {
  constructor(flag) {
    this.__rg_kind = "ScVal_Bool";
    this.flag = false;
    this.flag = flag;
  }
}
class ScVal_Num  {
  constructor(value) {
    this.__rg_kind = "ScVal_Num";
    this.value = 0.0;
    this.value = value;
  }
}
class ScVal_List  {
  constructor(items) {
    this.__rg_kind = "ScVal_List";
    this.items = [];
    this.items = items;
  }
}
class ScVal_Map  {
  constructor(keys, entries) {
    this.__rg_kind = "ScVal_Map";
    this.keys = [];
    this.entries = [];
    this.keys = keys;
    this.entries = entries;
  }
}
class ScVal__ops  {
  constructor() {
  }
}
ScVal__ops.equals = function(a, b) {
  if( a != null && a.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __ea0 = a;
    if( b != null && b.__rg_kind === "ScVal_Nothing" ) /* union case */ {
      var __eb0 = b;
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ScVal_Str" ) /* union case */ {
    var __ea1 = a;
    if( b != null && b.__rg_kind === "ScVal_Str" ) /* union case */ {
      var __eb1 = b;
      if ( __ea1.text != __eb1.text ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var __ea2 = a;
    if( b != null && b.__rg_kind === "ScVal_Bool" ) /* union case */ {
      var __eb2 = b;
      if ( __ea2.flag != __eb2.flag ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ScVal_Num" ) /* union case */ {
    var __ea3 = a;
    if( b != null && b.__rg_kind === "ScVal_Num" ) /* union case */ {
      var __eb3 = b;
      if ( __ea3.value != __eb3.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ScVal_List" ) /* union case */ {
    var __ea4 = a;
    if( b != null && b.__rg_kind === "ScVal_List" ) /* union case */ {
      var __eb4 = b;
      return (__ea4 === __eb4);
    };
    return false;
  };
  if( a != null && a.__rg_kind === "ScVal_Map" ) /* union case */ {
    var __ea5 = a;
    if( b != null && b.__rg_kind === "ScVal_Map" ) /* union case */ {
      var __eb5 = b;
      return (__ea5 === __eb5);
    };
    return false;
  };
  return false;
};
ScVal__ops.notEquals = function(a, b) {
  if ( ScVal__ops.equals(a, b) ) {
    return false;
  }
  return true;
};
class ScValOps  {
  constructor() {
  }
}
ScValOps.str = function(text) {
  return new ScVal_Str(text);
};
ScValOps.bool = function(flag) {
  return new ScVal_Bool(flag);
};
ScValOps.num = function(value) {
  return new ScVal_Num(value);
};
ScValOps.nothing = function() {
  return new ScVal_Nothing();
};
ScValOps.emptyList = function() {
  let items = [];
  return new ScVal_List(items);
};
ScValOps.emptyMap = function() {
  let keys = [];
  let entries = [];
  return new ScVal_Map(keys, entries);
};
ScValOps.present = function(v) {
  if( v != null && v.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match0 = v;
    return false;
  };
  if( v != null && v.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = v;
    return s.text.length > 0;
  };
  if( v != null && v.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = v;
    return b.flag;
  };
  if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = v;
    return true;
  };
  if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = v;
    return l.items.length > 0;
  };
  if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = v;
    return m.keys.length > 0;
  };
  return false;
};
ScValOps.withKey = function(target, key, value) {
  let keys = [];
  let entries = [];
  if( target != null && target.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = target;
    for ( let i = 0; i < m.keys.length; i++) {
      var k = m.keys[i];
      keys.push(k);
      entries.push(m.entries[i]);
    };
  };
  if( target != null && target.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match1 = target;
  };
  if( target != null && target.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = target;
  };
  if( target != null && target.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = target;
  };
  if( target != null && target.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = target;
  };
  if( target != null && target.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = target;
  };
  let at = -1;
  for ( let j = 0; j < keys.length; j++) {
    var k2 = keys[j];
    if ( k2 == key ) {
      at = j;
    }
  };
  if ( at >= 0 ) {
    entries[at] = value;
  } else {
    keys.push(key);
    entries.push(value);
  }
  return new ScVal_Map(keys, entries);
};
ScValOps.sizeOf = function(v) {
  if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = v;
    return l.items.length;
  };
  if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = v;
    return m.keys.length;
  };
  if( v != null && v.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = v;
    return s.text.length;
  };
  if( v != null && v.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match3 = v;
    return 0;
  };
  if( v != null && v.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = v;
    return 0;
  };
  if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = v;
    return 0;
  };
  return 0;
};
ScValOps.items = function(v) {
  let out = [];
  if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = v;
    for ( let i = 0; i < l.items.length; i++) {
      var item = l.items[i];
      out.push(item);
    };
  };
  if( v != null && v.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match1 = v;
  };
  if( v != null && v.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = v;
  };
  if( v != null && v.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = v;
  };
  if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = v;
  };
  if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = v;
  };
  return out;
};
ScValOps.fieldJson = function(item, field) {
  if( item != null && item.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = item;
    for ( let i = 0; i < m.keys.length; i++) {
      var key = m.keys[i];
      if ( key == field ) {
        return ScValOps.toJson(m.entries[i]);
      }
    };
  };
  if( item != null && item.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match1 = item;
  };
  if( item != null && item.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = item;
  };
  if( item != null && item.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = item;
  };
  if( item != null && item.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = item;
  };
  if( item != null && item.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = item;
  };
  return "";
};
ScValOps.appended = function(list, item) {
  let out = [];
  if( list != null && list.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = list;
    for ( let i = 0; i < l.items.length; i++) {
      var existing = l.items[i];
      out.push(existing);
    };
  };
  if( list != null && list.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match1 = list;
  };
  if( list != null && list.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = list;
  };
  if( list != null && list.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = list;
  };
  if( list != null && list.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = list;
  };
  if( list != null && list.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = list;
  };
  out.push(item);
  return new ScVal_List(out);
};
ScValOps.toJson = function(v) {
  if( v != null && v.__rg_kind === "ScVal_Nothing" ) /* union case */ {
    var __match0 = v;
    return "null";
  };
  if( v != null && v.__rg_kind === "ScVal_Str" ) /* union case */ {
    var s = v;
    return ScValOps.quote(s.text);
  };
  if( v != null && v.__rg_kind === "ScVal_Bool" ) /* union case */ {
    var b = v;
    if ( b.flag ) {
      return "true";
    }
    return "false";
  };
  if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
    var n = v;
    const whole = Math.floor( n.value);
    if ( parseFloat(whole) == n.value ) {
      return (whole.toString());
    }
    return (n.value.toString());
  };
  if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
    var l = v;
    let parts = [];
    for ( let i = 0; i < l.items.length; i++) {
      var item = l.items[i];
      parts.push(ScValOps.toJson(item));
    };
    return ("[" + parts.join(",")) + "]";
  };
  if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
    var m = v;
    let parts2 = [];
    for ( let j = 0; j < m.keys.length; j++) {
      var k = m.keys[j];
      parts2.push((ScValOps.quote(k) + ":") + ScValOps.toJson(m.entries[j]));
    };
    return ("{" + parts2.join(",")) + "}";
  };
  return "null";
};
ScValOps.quote = function(text) {
  let out = "\"";
  let i = 0;
  const __len = text.length;
  while (i < __len) {
    const code = text.charCodeAt(i );
    if ( code == 34 ) {
      out = out + "\\\"";
    } else {
      if ( code == 92 ) {
        out = out + "\\\\";
      } else {
        out = out + String.fromCharCode(code);
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class ScEvent  {
  constructor() {
    this.type = "";
    this.keys = [];
    this.values = [];
  }
  with (key, value) {
    this.keys.push(key);
    this.values.push(value);
    return this;
  };
  withStr (key, value) {
    return this.with(key, ScValOps.str(value));
  };
  get (key) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i];
      }
    };
    return ScValOps.nothing();
  };
}
ScEvent.of = function(type) {
  const e = new ScEvent();
  e.type = type;
  return e;
};
class ScValue  {
  constructor() {
    this.kind = "literal";
    this.name = "";
    this.parts = [];
  }
}
ScValue.value = function(v) {
  const out = new ScValue();
  out.kind = "literal";
  out.constant = v;
  return out;
};
ScValue.literal = function(text) {
  return ScValue.value(ScValOps.str(text));
};
ScValue.event = function(field) {
  const v = new ScValue();
  v.kind = "event";
  v.name = field;
  return v;
};
ScValue.context = function(key) {
  const v = new ScValue();
  v.kind = "context";
  v.name = key;
  return v;
};
ScValue.either = function() {
  const v = new ScValue();
  v.kind = "or";
  return v;
};
ScValue.append = function(list, item) {
  const v = new ScValue();
  v.kind = "append";
  v.parts.push(list);
  v.parts.push(item);
  return v;
};
ScValue.setKey = function(target, key, value) {
  const v = new ScValue();
  v.kind = "setKey";
  v.parts.push(target);
  v.parts.push(key);
  v.parts.push(value);
  return v;
};
class ScGuard  {
  constructor() {
    this.kind = "true";
    this.name = "";     /* note: unused */
    this.field = "";
    this.number = 0.0;
    this.parts = [];
  }
}
class ScAssign  {
  constructor() {
    this.key = "";
  }
}
ScAssign.of = function(key, value) {
  const a = new ScAssign();
  a.key = key;
  a.value = value;
  return a;
};
class ScTransition  {
  constructor() {
    this.event = "";
    this.target = "";
    this.assigns = [];
    this.actions = [];
  }
}
class ScState  {
  constructor() {
    this.name = "";
    this.path = "";
    this.parent = "";
    this.initial = "";
    this.isFinal = false;
    this.transitions = [];
    this.always = [];
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
    this.id = "";     /* note: unused */
    this.initial = "";
    this.states = [];
    this.transitions = [];
    this.keys = [];
    this.values = [];
  }
  state (name) {
    return this.child("", name);
  };
  child (parentPath, name) {
    const s = new ScState();
    s.name = name;
    s.parent = parentPath;
    if ( parentPath.length > 0 ) {
      s.path = (parentPath + ".") + name;
    } else {
      s.path = name;
    }
    this.states.push(s);
    return s;
  };
  stateAt (path) {
    for ( let i = 0; i < this.states.length; i++) {
      var s = this.states[i];
      if ( s.path == path ) {
        return s;
      }
    };
    return new ScState();
  };
  hasState (path) {
    for ( let i = 0; i < this.states.length; i++) {
      var s = this.states[i];
      if ( s.path == path ) {
        return true;
      }
    };
    return false;
  };
  context (key, value) {
    this.keys.push(key);
    this.values.push(value);
  };
  contextStr (key, value) {
    this.context(key, ScValOps.str(value));
  };
  stateNamed (name) {
    return this.stateAt(name);
  };
  entryLeaf (path) {
    let here = path;
    let depth = 0;
    while (depth < 32) {
      const s = this.stateAt(here);
      if ( s.initial.length == 0 ) {
        break;
      }
      here = (here + ".") + s.initial;
      depth = depth + 1;
    };
    return here;
  };
}
class ScRunner  {
  constructor() {
    this.state = "";
    this.keys = [];
    this.values = [];
    this.pending = [];
  }
  start (definition) {
    this.chart = definition;
    this.keys.length = 0;
    this.values.length = 0;
    for ( let i = 0; i < definition.keys.length; i++) {
      var k = definition.keys[i];
      this.keys.push(k);
      this.values.push(definition.values[i]);
    };
    this.pending.length = 0;
    this.enter(definition.initial);
    this.settle();
  };
  get (key) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i];
      }
    };
    return ScValOps.nothing();
  };
  json (key) {
    return ScValOps.toJson(this.get(key));
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
  setStr (key, value) {
    this.set(key, ScValOps.str(value));
  };
  countOf (v) {
    return ScValOps.sizeOf(v);
  };
  valueOfGuard (g, event) {
    if ( typeof(g.source) === "undefined" ) {
      return ScValOps.nothing();
    }
    return this.resolve(g.source, event);
  };
  passes (g, event) {
    if ( g.kind == "true" ) {
      return true;
    }
    if ( g.kind == "present" ) {
      return ScValOps.present(this.valueOfGuard(g, event));
    }
    if ( g.kind == "nonBlank" ) {
      const v = this.valueOfGuard(g, event);
      if( v != null && v.__rg_kind === "ScVal_Str" ) /* union case */ {
        var st = v;
        return st.text.trim().length > 0;
      };
      if( v != null && v.__rg_kind === "ScVal_Nothing" ) /* union case */ {
        var __match1 = v;
        return false;
      };
      if( v != null && v.__rg_kind === "ScVal_Bool" ) /* union case */ {
        var b = v;
        return ScValOps.present(v);
      };
      if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
        var n = v;
        return ScValOps.present(v);
      };
      if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
        var l = v;
        return ScValOps.present(v);
      };
      if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
        var m = v;
        return ScValOps.present(v);
      };
      return false;
    }
    if ( g.kind == "not" ) {
      return this.passes(g.parts[0], event) == false;
    }
    if ( g.kind == "or" ) {
      for ( let i = 0; i < g.parts.length; i++) {
        var part = g.parts[i];
        if ( this.passes(part, event) ) {
          return true;
        }
      };
      return false;
    }
    if ( g.kind == "and" ) {
      for ( let j = 0; j < g.parts.length; j++) {
        var part2 = g.parts[j];
        if ( this.passes(part2, event) == false ) {
          return false;
        }
      };
      return true;
    }
    if ( g.kind == "countEq" ) {
      return parseFloat(this.countOf(this.valueOfGuard(g, event))) == g.number;
    }
    if ( g.kind == "countGt" ) {
      return parseFloat(this.countOf(this.valueOfGuard(g, event))) > g.number;
    }
    if ( g.kind == "some" ) {
      const list = ScValOps.items(this.valueOfGuard(g, event));
      const wanted = ScValOps.toJson(g.operand);
      for ( let k = 0; k < list.length; k++) {
        var item = list[k];
        if ( ScValOps.fieldJson(item, g.field) == wanted ) {
          return true;
        }
      };
      return false;
    }
    return false;
  };
  allowed (t, event) {
    if ( typeof(t.guard) === "undefined" ) {
      return true;
    }
    return this.passes(t.guard, event);
  };
  resolve (value, event) {
    if ( value.kind == "literal" ) {
      return value.constant;
    }
    if ( value.kind == "event" ) {
      return event.get(value.name);
    }
    if ( value.kind == "context" ) {
      return this.get(value.name);
    }
    if ( value.kind == "or" ) {
      let last = ScValOps.nothing();
      for ( let i = 0; i < value.parts.length; i++) {
        var part = value.parts[i];
        const answer = this.resolve(part, event);
        if ( ScValOps.present(answer) ) {
          return answer;
        }
        last = answer;
      };
      return last;
    }
    if ( value.kind == "append" ) {
      const list = this.resolve(value.parts[0], event);
      const item = this.resolve(value.parts[1], event);
      return ScValOps.appended(list, item);
    }
    if ( value.kind == "setKey" ) {
      const target = this.resolve(value.parts[0], event);
      const key = this.resolve(value.parts[1], event);
      const item_1 = this.resolve(value.parts[2], event);
      let keyText = ScValOps.toJson(key);
      if( key != null && key.__rg_kind === "ScVal_Str" ) /* union case */ {
        var st = key;
        keyText = st.text;
      };
      if( key != null && key.__rg_kind === "ScVal_Nothing" ) /* union case */ {
        var __match1 = key;
      };
      if( key != null && key.__rg_kind === "ScVal_Bool" ) /* union case */ {
        var b = key;
      };
      if( key != null && key.__rg_kind === "ScVal_Num" ) /* union case */ {
        var n = key;
      };
      if( key != null && key.__rg_kind === "ScVal_List" ) /* union case */ {
        var l = key;
      };
      if( key != null && key.__rg_kind === "ScVal_Map" ) /* union case */ {
        var m = key;
      };
      return ScValOps.withKey(target, keyText, item_1);
    }
    return ScValOps.nothing();
  };
  enter (path) {
    const c = this.chart;
    this.state = c.entryLeaf(path);
  };
  take (t, ownerPath, event) {
    for ( let j = 0; j < t.assigns.length; j++) {
      var a = t.assigns[j];
      const v = a.value;
      this.set(a.key, this.resolve(v, event));
    };
    for ( let k = 0; k < t.actions.length; k++) {
      var name = t.actions[k];
      this.pending.push(name);
    };
    const target = ScRunner.resolveTarget(t.target, ownerPath);
    if ( target.length > 0 ) {
      this.enter(target);
    }
  };
  settle () {
    const c = this.chart;
    let steps = 0;
    while (steps < 64) {
      steps = steps + 1;
      if ( this.pending.length > 0 ) {
        return;
      }
      let moved = false;
      const empty = ScEvent.of("");
      let here = this.state;
      while (here.length > 0) {
        const s = c.stateAt(here);
        for ( let i = 0; i < s.always.length; i++) {
          var t = s.always[i];
          if ( moved == false ) {
            if ( this.allowed(t, empty) ) {
              this.take(t, here, empty);
              moved = true;
            }
          }
        };
        if ( moved ) {
          here = "";
        } else {
          here = ScRunner.parentOf(here);
        }
      };
      if ( moved == false ) {
        const leaf = c.stateAt(this.state);
        if ( leaf.isFinal ) {
          const parentPath = ScRunner.parentOf(this.state);
          if ( parentPath.length > 0 ) {
            const parent = c.stateAt(parentPath);
            if ( (typeof(parent.onDone) !== "undefined" && parent.onDone != null )  ) {
              this.take(parent.onDone, parentPath, empty);
              moved = true;
            }
          }
        }
      }
      if ( moved == false ) {
        return;
      }
    };
  };
  resume () {
    this.pending.length = 0;
    this.settle();
  };
  send (event) {
    const c = this.chart;
    this.pending.length = 0;
    let here = this.state;
    while (here.length > 0) {
      const s = c.stateAt(here);
      for ( let i = 0; i < s.transitions.length; i++) {
        var t = s.transitions[i];
        if ( t.event == event.type ) {
          if ( this.allowed(t, event) ) {
            this.take(t, here, event);
            this.settle();
            return true;
          }
        }
      };
      here = ScRunner.parentOf(here);
    };
    for ( let j = 0; j < c.transitions.length; j++) {
      var t2 = c.transitions[j];
      if ( t2.event == event.type ) {
        if ( this.allowed(t2, event) ) {
          this.take(t2, "", event);
          this.settle();
          return true;
        }
      }
    };
    return false;
  };
  sendType (type) {
    return this.send(ScEvent.of(type));
  };
}
ScRunner.parentOf = function(path) {
  let at = -1;
  let i = 0;
  const __len = path.length;
  while (i < __len) {
    if ( path.charCodeAt(i ) == 46 ) {
      at = i;
    }
    i = i + 1;
  };
  if ( at < 0 ) {
    return "";
  }
  return path.substring(0, at );
};
ScRunner.resolveTarget = function(target, ownerPath) {
  if ( target.length == 0 ) {
    return "";
  }
  if ( target.charCodeAt(0 ) == 35 ) {
    const rest = target.substring(1, target.length );
    let dot = -1;
    let i = 0;
    const __len = rest.length;
    while (i < __len) {
      if ( rest.charCodeAt(i ) == 46 ) {
        if ( dot < 0 ) {
          dot = i;
        }
      }
      i = i + 1;
    };
    if ( dot < 0 ) {
      return "";
    }
    return rest.substring((dot + 1), __len );
  }
  if ( target.charCodeAt(0 ) == 46 ) {
    const child = target.substring(1, target.length );
    if ( ownerPath.length == 0 ) {
      return child;
    }
    return (ownerPath + ".") + child;
  }
  const parent = ScRunner.parentOf(ownerPath);
  if ( parent.length == 0 ) {
    return target;
  }
  return (parent + ".") + target;
};
module.exports.ScVal_Nothing = ScVal_Nothing;
module.exports.ScVal_Str = ScVal_Str;
module.exports.ScVal_Bool = ScVal_Bool;
module.exports.ScVal_Num = ScVal_Num;
module.exports.ScVal_List = ScVal_List;
module.exports.ScVal_Map = ScVal_Map;
module.exports.ScVal__ops = ScVal__ops;
module.exports.ScValOps = ScValOps;
module.exports.ScEvent = ScEvent;
module.exports.ScValue = ScValue;
module.exports.ScGuard = ScGuard;
module.exports.ScAssign = ScAssign;
module.exports.ScTransition = ScTransition;
module.exports.ScState = ScState;
module.exports.Statechart = Statechart;
module.exports.ScRunner = ScRunner;
