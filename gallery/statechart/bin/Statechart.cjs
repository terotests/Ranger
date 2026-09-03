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
    this.id = "";     /* note: unused */
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
  contextStr (key, value) {
    this.context(key, ScValOps.str(value));
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
    this.pending = [];
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
  send (event) {
    const c = this.chart;
    const here = c.stateNamed(this.state);
    this.pending.length = 0;
    for ( let i = 0; i < here.transitions.length; i++) {
      var t = here.transitions[i];
      if ( t.event == event.type ) {
        for ( let j = 0; j < t.assigns.length; j++) {
          var a = t.assigns[j];
          const v = a.value;
          this.set(a.key, this.resolve(v, event));
        };
        for ( let k = 0; k < t.actions.length; k++) {
          var name = t.actions[k];
          this.pending.push(name);
        };
        if ( t.target.length > 0 ) {
          this.state = t.target;
        }
        return true;
      }
    };
    return false;
  };
  sendType (type) {
    return this.send(ScEvent.of(type));
  };
}
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
module.exports.ScAssign = ScAssign;
module.exports.ScTransition = ScTransition;
module.exports.ScState = ScState;
module.exports.Statechart = Statechart;
module.exports.ScRunner = ScRunner;
