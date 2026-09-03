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
  get (key) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i];
      }
    };
    return "";
  };
  has (key) {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i].length > 0;
      }
    };
    return false;
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
ScValue.literal = function(text) {
  const v = new ScValue();
  v.kind = "literal";
  v.name = text;
  return v;
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
  resolve (value, event) {
    if ( value.kind == "literal" ) {
      return value.name;
    }
    if ( value.kind == "event" ) {
      return event.get(value.name);
    }
    if ( value.kind == "context" ) {
      return this.get(value.name);
    }
    if ( value.kind == "or" ) {
      for ( let i = 0; i < value.parts.length; i++) {
        var part = value.parts[i];
        const answer = this.resolve(part, event);
        if ( answer.length > 0 ) {
          return answer;
        }
      };
      return "";
    }
    return "";
  };
  send (event) {
    const c = this.chart;
    const here = c.stateNamed(this.state);
    for ( let i = 0; i < here.transitions.length; i++) {
      var t = here.transitions[i];
      if ( t.event == event.type ) {
        for ( let j = 0; j < t.assigns.length; j++) {
          var a = t.assigns[j];
          const v = a.value;
          this.set(a.key, this.resolve(v, event));
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
module.exports.ScEvent = ScEvent;
module.exports.ScValue = ScValue;
module.exports.ScAssign = ScAssign;
module.exports.ScTransition = ScTransition;
module.exports.ScState = ScState;
module.exports.Statechart = Statechart;
module.exports.ScRunner = ScRunner;
