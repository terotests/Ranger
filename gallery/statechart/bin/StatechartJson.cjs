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
    this.id = "";
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
  resolveTarget (target, ownerPath) {
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
        return false;
      };
      if( v != null && v.__rg_kind === "ScVal_Num" ) /* union case */ {
        var n = v;
        return false;
      };
      if( v != null && v.__rg_kind === "ScVal_List" ) /* union case */ {
        var l = v;
        return false;
      };
      if( v != null && v.__rg_kind === "ScVal_Map" ) /* union case */ {
        var m = v;
        return false;
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
    if ( value.kind == "setKey" ) {
      const target = this.resolve(value.parts[0], event);
      const key = this.resolve(value.parts[1], event);
      const item = this.resolve(value.parts[2], event);
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
      return ScValOps.withKey(target, keyText, item);
    }
    return ScValOps.nothing();
  };
  enter (path) {
    const c = this.chart;
    let here = path;
    let guardCount = 0;
    while (guardCount < 32) {
      const s = c.stateAt(here);
      if ( s.initial.length == 0 ) {
        break;
      }
      here = (here + ".") + s.initial;
      guardCount = guardCount + 1;
    };
    this.state = here;
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
    const target = this.resolveTarget(t.target, ownerPath);
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
StatechartJson.valOf = function(node) {
  if ( node.isString() ) {
    return ScValOps.str(node.asString());
  }
  if ( node.isBool() ) {
    return ScValOps.bool(node.asBool());
  }
  if ( node.isNumber() ) {
    return ScValOps.num(node.asDouble());
  }
  if ( node.isArray() ) {
    let items = [];
    const count = node.count();
    let i = 0;
    while (i < count) {
      items.push(StatechartJson.valOf(node.at(i)));
      i = i + 1;
    };
    return new ScVal_List(items);
  }
  if ( node.isObject() ) {
    let keys = [];
    let entries = [];
    for ( let j = 0; j < node.keys.length; j++) {
      var key = node.keys[j];
      keys.push(key);
      entries.push(StatechartJson.valOf(node.get(key)));
    };
    return new ScVal_Map(keys, entries);
  }
  return ScValOps.nothing();
};
StatechartJson.valueOf = function(spec) {
  if ( spec.has("setKey") ) {
    const parts = spec.get("setKey");
    return ScValue.setKey(
      StatechartJson.valueOf(parts.get("map")),
      StatechartJson.valueOf(parts.get("key")),
      StatechartJson.valueOf(parts.get("value"))
    );
  }
  if ( spec.has("or") ) {
    const either = ScValue.either();
    const parts_1 = spec.get("or");
    const count = parts_1.count();
    let i = 0;
    while (i < count) {
      either.parts.push(StatechartJson.valueOf(parts_1.at(i)));
      i = i + 1;
    };
    return either;
  }
  if ( spec.has("event") ) {
    return ScValue.event(spec.stringOr("event", ""));
  }
  if ( spec.has("context") ) {
    return ScValue.context(spec.stringOr("context", ""));
  }
  return ScValue.value(StatechartJson.valOf(spec.get("value")));
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
        t.assigns.push(ScAssign.of(key, StatechartJson.valueOf(assigns.get(key))));
      };
    }
    if ( action.has("action") ) {
      t.actions.push(action.stringOr("action", ""));
    }
    i = i + 1;
  };
};
StatechartJson.guardOf = function(spec) {
  const g = new ScGuard();
  if ( spec.has("present") ) {
    g.kind = "present";
    g.source = StatechartJson.valueOf(spec.get("present"));
    return g;
  }
  if ( spec.has("nonBlank") ) {
    g.kind = "nonBlank";
    g.source = StatechartJson.valueOf(spec.get("nonBlank"));
    return g;
  }
  if ( spec.has("not") ) {
    g.kind = "not";
    g.parts.push(StatechartJson.guardOf(spec.get("not")));
    return g;
  }
  if ( spec.has("or") ) {
    g.kind = "or";
    const parts = spec.get("or");
    const count = parts.count();
    let i = 0;
    while (i < count) {
      g.parts.push(StatechartJson.guardOf(parts.at(i)));
      i = i + 1;
    };
    return g;
  }
  if ( spec.has("and") ) {
    g.kind = "and";
    const parts2 = spec.get("and");
    const count2 = parts2.count();
    let j = 0;
    while (j < count2) {
      g.parts.push(StatechartJson.guardOf(parts2.at(j)));
      j = j + 1;
    };
    return g;
  }
  if ( spec.has("countEq") ) {
    const c = spec.get("countEq");
    g.kind = "countEq";
    g.source = StatechartJson.valueOf(c.get("of"));
    g.number = c.doubleOr("n", 0.0);
    return g;
  }
  if ( spec.has("countGt") ) {
    const c2 = spec.get("countGt");
    g.kind = "countGt";
    g.source = StatechartJson.valueOf(c2.get("of"));
    g.number = c2.doubleOr("n", 0.0);
    return g;
  }
  if ( spec.has("some") ) {
    const sm = spec.get("some");
    g.kind = "some";
    g.source = StatechartJson.valueOf(sm.get("of"));
    g.field = sm.stringOr("field", "");
    g.operand = StatechartJson.valOf(sm.get("eq"));
    return g;
  }
  return g;
};
StatechartJson.readOne = function(event, spec) {
  const t = new ScTransition();
  t.event = event;
  if ( spec.isString() ) {
    t.target = spec.asString();
    return t;
  }
  t.target = spec.stringOr("target", "");
  if ( spec.has("guard") ) {
    t.guard = StatechartJson.guardOf(spec.get("guard"));
  }
  if ( spec.has("actions") ) {
    StatechartJson.readActions(t, spec.get("actions"));
  }
  return t;
};
StatechartJson.readInto = function(out, event, spec) {
  if ( spec.isArray() ) {
    const count = spec.count();
    let i = 0;
    while (i < count) {
      out.push(StatechartJson.readOne(event, spec.at(i)));
      i = i + 1;
    };
    return;
  }
  out.push(StatechartJson.readOne(event, spec));
};
StatechartJson.readState = function(chart, parentPath, name, node) {
  const state = chart.child(parentPath, name);
  state.initial = node.stringOr("initial", "");
  if ( node.stringOr("type", "") == "final" ) {
    state.isFinal = true;
  }
  if ( node.has("on") ) {
    const on = node.get("on");
    for ( let e = 0; e < on.keys.length; e++) {
      var event = on.keys[e];
      StatechartJson.readInto(state.transitions, event, on.get(event));
    };
  }
  if ( node.has("always") ) {
    StatechartJson.readInto(state.always, "", node.get("always"));
  }
  if ( node.has("onDone") ) {
    state.onDone = StatechartJson.readOne("", node.get("onDone"));
  }
  if ( node.has("states") ) {
    const kids = node.get("states");
    for ( let c = 0; c < kids.keys.length; c++) {
      var childName = kids.keys[c];
      StatechartJson.readState(
        chart,
        state.path,
        childName,
        kids.get(childName)
      );
    };
  }
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
      chart.context(key, StatechartJson.valOf(context.get(key)));
    };
  }
  if ( root.has("on") ) {
    const rootOn = root.get("on");
    for ( let r = 0; r < rootOn.keys.length; r++) {
      var event = rootOn.keys[r];
      StatechartJson.readInto(chart.transitions, event, rootOn.get(event));
    };
  }
  if ( root.has("states") == false ) {
    return chart;
  }
  const states = root.get("states");
  for ( let s = 0; s < states.keys.length; s++) {
    var name = states.keys[s];
    StatechartJson.readState(chart, "", name, states.get(name));
  };
  return chart;
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
module.exports.VlJson = VlJson;
module.exports.VlJsonParser = VlJsonParser;
module.exports.VlJsonWriter = VlJsonWriter;
module.exports.StatechartJson = StatechartJson;
