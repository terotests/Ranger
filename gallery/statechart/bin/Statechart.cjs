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
module.exports.ScAssign = ScAssign;
module.exports.ScTransition = ScTransition;
module.exports.ScState = ScState;
module.exports.Statechart = Statechart;
module.exports.ScRunner = ScRunner;
