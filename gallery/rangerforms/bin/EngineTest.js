#!/usr/bin/env node
class FormValue  {
  constructor() {
    this.kind = 0;
    this.b = false;
    this.n = 0.0;
    this.s = "";
    this.items = [];
    this.err = "";
  }
  isEmpty () {
    if ( this.kind == 4 ) {
      return (this.items.length) == 0;
    }
    return this.kind == 0;
  };
  isError () {
    return this.kind == 5;
  };
  isNumber () {
    return this.kind == 2;
  };
  isText () {
    return this.kind == 3;
  };
  isList () {
    return this.kind == 4;
  };
  truthy () {
    if ( this.kind == 1 ) {
      return this.b;
    }
    if ( this.kind == 2 ) {
      return (this.n == 0.0) == false;
    }
    if ( this.kind == 3 ) {
      return (this.s.length) > 0;
    }
    if ( this.kind == 4 ) {
      return (this.items.length) > 0;
    }
    return false;
  };
  asNumber () {
    if ( this.kind == 2 ) {
      return this;
    }
    if ( this.kind == 0 ) {
      return this;
    }
    if ( this.kind == 5 ) {
      return this;
    }
    if ( this.kind == 1 ) {
      if ( this.b ) {
        return FormValue.ofNumber(1.0);
      }
      return FormValue.ofNumber(0.0);
    }
    if ( this.kind == 3 ) {
      const trimmed = FormValue.trimText(this.s);
      if ( (trimmed.length) == 0 ) {
        return FormValue.blank();
      }
      const parsed = isNaN( parseFloat(trimmed) ) ? undefined : parseFloat(trimmed);
      if ( typeof(parsed) === "undefined" ) {
        return FormValue.ofError((trimmed + " is not a number"));
      }
      return FormValue.ofNumber((parsed));
    }
    return FormValue.ofError("a list is not a number");
  };
  asText () {
    if ( this.kind == 3 ) {
      return this.s;
    }
    if ( this.kind == 1 ) {
      if ( this.b ) {
        return "true";
      }
      return "false";
    }
    if ( this.kind == 2 ) {
      return FormValue.numberText(this.n);
    }
    if ( this.kind == 4 ) {
      let out = "";
      let i = 0;
      const ln = this.items.length;
      while (i < ln) {
        if ( i > 0 ) {
          out = out + ", ";
        }
        out = out + (this.items[i]);
        i = i + 1;
      };
      return out;
    }
    if ( this.kind == 5 ) {
      return this.err;
    }
    return "";
  };
  sameAs (other) {
    if ( this.kind != other.kind ) {
      const a = this.asNumber();
      const b2 = other.asNumber();
      if ( a.kind == 2 ) {
        if ( b2.kind == 2 ) {
          return a.n == b2.n;
        }
      }
      return false;
    }
    if ( this.kind == 1 ) {
      return this.b == other.b;
    }
    if ( this.kind == 2 ) {
      return this.n == other.n;
    }
    if ( this.kind == 3 ) {
      return this.s == other.s;
    }
    if ( this.kind == 4 ) {
      const na = this.items.length;
      if ( na != (other.items.length) ) {
        return false;
      }
      let i = 0;
      while (i < na) {
        if ( ((this.items[i]) == (other.items[i])) == false ) {
          return false;
        }
        i = i + 1;
      };
      return true;
    }
    if ( this.kind == 5 ) {
      return this.err == other.err;
    }
    return true;
  };
  holds (want) {
    if ( this.kind == 4 ) {
      let i = 0;
      const n2 = this.items.length;
      while (i < n2) {
        if ( (this.items[i]) == want ) {
          return true;
        }
        i = i + 1;
      };
      return false;
    }
    if ( this.kind == 3 ) {
      return this.s == want;
    }
    return false;
  };
}
FormValue.emptyKind = function() {
  return 0;
};
FormValue.boolKind = function() {
  return 1;
};
FormValue.numberKind = function() {
  return 2;
};
FormValue.textKind = function() {
  return 3;
};
FormValue.listKind = function() {
  return 4;
};
FormValue.errorKind = function() {
  return 5;
};
FormValue.blank = function() {
  const v = new FormValue();
  return v;
};
FormValue.ofBool = function(b) {
  const v = new FormValue();
  v.kind = 1;
  v.b = b;
  return v;
};
FormValue.ofNumber = function(n) {
  const v = new FormValue();
  v.kind = 2;
  v.n = n;
  return v;
};
FormValue.ofInt = function(n) {
  return FormValue.ofNumber((n));
};
FormValue.ofText = function(s) {
  const v = new FormValue();
  v.kind = 3;
  v.s = s;
  return v;
};
FormValue.ofList = function(items) {
  const v = new FormValue();
  v.kind = 4;
  let i = 0;
  const n = items.length;
  while (i < n) {
    v.items.push(items[i]);
    i = i + 1;
  };
  return v;
};
FormValue.ofError = function(why) {
  const v = new FormValue();
  v.kind = 5;
  v.err = why;
  return v;
};
FormValue.numberText = function(n) {
  const whole = (Math.floor( n));
  if ( whole == n ) {
    return ((Math.floor( n)).toString());
  }
  return (n.toString());
};
FormValue.trimText = function(s) {
  const n = s.length;
  let a = 0;
  while (a < n) {
    const ch = s.charCodeAt(a );
    if ( ch != 32 ) {
      if ( ch != 9 ) {
        break;
      }
    }
    a = a + 1;
  };
  let b = n;
  while (b > a) {
    const ch2 = s.charCodeAt((b - 1) );
    if ( ch2 != 32 ) {
      if ( ch2 != 9 ) {
        break;
      }
    }
    b = b - 1;
  };
  return s.substring(a, b );
};
class Answer  {
  constructor() {
    this.name = "";
    this.value = new FormValue();
    this.answered = false;
  }
}
class QuestionState  {
  constructor() {
    this.name = "";
    this.visible = true;
    this.enabled = true;
    this.required = false;
    this.readOnly = false;
    this.kindOk = true;
    this.ruleOk = true;
    this.message = "";
  }
  isValid () {
    if ( this.kindOk == false ) {
      return false;
    }
    return this.ruleOk;
  };
}
QuestionState.of = function(name) {
  const q = new QuestionState();
  q.name = name;
  return q;
};
class AnswerState  {
  constructor() {
    this.answers = {};
    this.states = {};
    this.todayDays = 0;
    this.evaluations = 0;
  }
  resetCounters () {
    this.evaluations = 0;
  };
  valueOf (name) {
    const st = ( Object.prototype.hasOwnProperty.call(this.states, name) ? this.states[name] : undefined );
    if ( (typeof(st) !== "undefined" && st != null )  ) {
      const s = st;
      if ( s.visible == false ) {
        return FormValue.blank();
      }
    }
    return this.rawValueOf(name);
  };
  rawValueOf (name) {
    const found = ( Object.prototype.hasOwnProperty.call(this.answers, name) ? this.answers[name] : undefined );
    if ( typeof(found) === "undefined" ) {
      return FormValue.blank();
    }
    const a = found;
    return a.value;
  };
  wasAnswered (name) {
    const found = ( Object.prototype.hasOwnProperty.call(this.answers, name) ? this.answers[name] : undefined );
    if ( typeof(found) === "undefined" ) {
      return false;
    }
    const a = found;
    return a.answered;
  };
  answer (name, value) {
    this.put(name, value, true);
  };
  compute (name, value) {
    this.put(name, value, false);
  };
  put (name, value, answered) {
    const found = ( Object.prototype.hasOwnProperty.call(this.answers, name) ? this.answers[name] : undefined );
    if ( typeof(found) === "undefined" ) {
      const fresh = new Answer();
      fresh.name = name;
      fresh.value = value;
      fresh.answered = answered;
      this.answers[name] = fresh;
      return;
    }
    const a = found;
    a.value = value;
    if ( value.isEmpty() ) {
      a.answered = false;
      return;
    }
    if ( answered ) {
      a.answered = true;
    }
  };
  clearAnswer (name) {
    const blank = new Answer();
    blank.name = name;
    this.answers[name] = blank;
  };
  stateOf (name) {
    const found = ( Object.prototype.hasOwnProperty.call(this.states, name) ? this.states[name] : undefined );
    if ( typeof(found) === "undefined" ) {
      const fresh = QuestionState.of(name);
      this.states[name] = fresh;
      return fresh;
    }
    return found;
  };
  isVisible (name) {
    const st = this.stateOf(name);
    return st.visible;
  };
  isRequired (name) {
    const st = this.stateOf(name);
    return st.required;
  };
  isValid (name) {
    const st = this.stateOf(name);
    return st.isValid();
  };
  answeredNames () {
    return Object.keys(this.answers);
  };
}
class ExprNode  {
  constructor() {
    this.kind = 0;
    this.num = 0.0;
    this.text = "";
    this.flag = false;
    this.op = "";
    this.kids = [];
  }
}
ExprNode.number = function(n) {
  const e = new ExprNode();
  e.kind = 1;
  e.num = n;
  return e;
};
ExprNode.text = function(s) {
  const e = new ExprNode();
  e.kind = 2;
  e.text = s;
  return e;
};
ExprNode.truth = function(b) {
  const e = new ExprNode();
  e.kind = 3;
  e.flag = b;
  return e;
};
ExprNode.reference = function(name) {
  const e = new ExprNode();
  e.kind = 4;
  e.text = name;
  return e;
};
ExprNode.unary = function(op, a) {
  const e = new ExprNode();
  e.kind = 5;
  e.op = op;
  e.kids.push(a);
  return e;
};
ExprNode.binary = function(op, a, b) {
  const e = new ExprNode();
  e.kind = 6;
  e.op = op;
  e.kids.push(a);
  e.kids.push(b);
  return e;
};
ExprNode.call = function(name, args) {
  const e = new ExprNode();
  e.kind = 7;
  e.text = name;
  let i = 0;
  const n = args.length;
  while (i < n) {
    e.kids.push(args[i]);
    i = i + 1;
  };
  return e;
};
class ExprProgram  {
  constructor() {
    this.source = "";
    this.root = new ExprNode();
    this.names = [];
    this.ok = false;
    this.errorText = "";
  }
  reads (name) {
    let i = 0;
    const n = this.names.length;
    while (i < n) {
      if ( (this.names[i]) == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
}
ExprProgram.failed = function(source, why) {
  const p = new ExprProgram();
  p.source = source;
  p.errorText = why;
  return p;
};
class ExprHost  {
  constructor() {
    this.errorText = "";     /** note: unused */
  }
  hostName () {
    return "none";
  };
  parse (source) {
    return ExprProgram.failed(source, "no expression host installed");
  };
  evaluate (program, state) {
    return FormValue.ofError("no expression host installed");
  };
}
class RuleRole  {
  constructor() {
  }
}
RuleRole.visible = function() {
  return "visible";
};
RuleRole.enabled = function() {
  return "enabled";
};
RuleRole.required = function() {
  return "required";
};
RuleRole.readOnly = function() {
  return "readonly";
};
RuleRole.calculated = function() {
  return "calculated";
};
RuleRole.validate = function() {
  return "validate";
};
RuleRole.defaultOf = function(role) {
  if ( role == "visible" ) {
    return true;
  }
  if ( role == "enabled" ) {
    return true;
  }
  if ( role == "validate" ) {
    return true;
  }
  return false;
};
class QuestionKind  {
  constructor() {
  }
}
QuestionKind.text = function() {
  return "text";
};
QuestionKind.integer = function() {
  return "int";
};
QuestionKind.decimal = function() {
  return "decimal";
};
QuestionKind.yesNo = function() {
  return "bool";
};
QuestionKind.date = function() {
  return "date";
};
QuestionKind.choice = function() {
  return "choice";
};
QuestionKind.multiChoice = function() {
  return "multichoice";
};
QuestionKind.group = function() {
  return "group";
};
QuestionKind.repeat = function() {
  return "repeat";
};
class Choice  {
  constructor() {
    this.value = "";
    this.label = "";
    this.visibleWhen = "";     /** note: unused */
  }
}
Choice.of = function(value, label) {
  const c = new Choice();
  c.value = value;
  c.label = label;
  return c;
};
class Rule  {
  constructor() {
    this.role = "";
    this.source = "";
    this.program = new ExprProgram();
    this.message = "";
  }
}
Rule.of = function(role, source) {
  const r = new Rule();
  r.role = role;
  r.source = source;
  return r;
};
class Question  {
  constructor() {
    this.name = "";
    this.kind = "text";
    this.label = "";
    this.help = "";     /** note: unused */
    this.page = "";     /** note: unused */
    this.choices = [];
    this.rules = [];
    this.initial = "";
    this.maxLength = -1;
    this.minValue = 0.0;
    this.maxValue = 0.0;
    this.hasMin = false;
    this.hasMax = false;
  }
  rule (role, source) {
    const r = Rule.of(role, source);
    this.rules.push(r);
    return r;
  };
  visibleWhen (source) {
    return this.rule("visible", source);
  };
  requiredWhen (source) {
    return this.rule("required", source);
  };
  enabledWhen (source) {
    return this.rule("enabled", source);
  };
  calculated (source) {
    return this.rule("calculated", source);
  };
  validWhen (source, message) {
    const r = this.rule("validate", source);
    r.message = message;
    return r;
  };
  between (low, high) {
    this.minValue = low;
    this.maxValue = high;
    this.hasMin = true;
    this.hasMax = true;
  };
  atMost (chars) {
    this.maxLength = chars;
  };
  choice (value, label) {
    const c = Choice.of(value, label);
    this.choices.push(c);
    return c;
  };
  ruleFor (role) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const r = this.rules[i];
      if ( r.role == role ) {
        return r;
      }
      i = i + 1;
    };
    return new Rule();
  };
  hasRule (role) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const r = this.rules[i];
      if ( r.role == role ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  isComputed () {
    return this.hasRule("calculated");
  };
}
Question.of = function(name, kind, label) {
  const q = new Question();
  q.name = name;
  q.kind = kind;
  q.label = label;
  return q;
};
class Page  {
  constructor() {
    this.name = "";
    this.title = "";
    this.visibleWhen = "";     /** note: unused */
  }
}
Page.of = function(name, title) {
  const p = new Page();
  p.name = name;
  p.title = title;
  return p;
};
class Questionnaire  {
  constructor() {
    this.name = "";
    this.title = "";     /** note: unused */
    this.version = "";     /** note: unused */
    this.pages = [];
    this.questions = [];
    this.byName = {};
    this.gaps = [];
  }
  page (name, title) {
    const p = Page.of(name, title);
    this.pages.push(p);
    return p;
  };
  question (name, kind, label) {
    const q = Question.of(name, kind, label);
    this.addQuestion(q);
    return q;
  };
  addQuestion (q) {
    const at = this.questions.length;
    this.questions.push(q);
    const key = q.name;
    this.byName[key] = at;
  };
  indexOf (name) {
    const found = ( Object.prototype.hasOwnProperty.call(this.byName, name) ? this.byName[name] : undefined );
    if ( typeof(found) === "undefined" ) {
      return -1;
    }
    return found;
  };
  has (name) {
    return (this).indexOf(name) >= 0;
  };
  questionAt (index) {
    if ( index < 0 ) {
      return new Question();
    }
    if ( index >= (this.questions.length) ) {
      return new Question();
    }
    return this.questions[index];
  };
  find (name) {
    return this.questionAt((this).indexOf(name));
  };
  questionCount () {
    return this.questions.length;
  };
  noteGap (detail) {
    this.gaps.push(detail);
  };
  compile (host) {
    let bad = 0;
    let i = 0;
    const n = this.questions.length;
    while (i < n) {
      const q = this.questions[i];
      let k = 0;
      const nk = q.rules.length;
      while (k < nk) {
        const r = q.rules[k];
        r.program = host.parse(r.source);
        if ( r.program.ok == false ) {
          bad = bad + 1;
          this.noteGap((((q.name + ".") + r.role) + ": ") + r.program.errorText);
        }
        k = k + 1;
      };
      i = i + 1;
    };
    return bad;
  };
  unknownReferences () {
    let out = [];
    let i = 0;
    const n = this.questions.length;
    while (i < n) {
      const q = this.questions[i];
      let k = 0;
      const nk = q.rules.length;
      while (k < nk) {
        const r = q.rules[k];
        let j = 0;
        const nj = r.program.names.length;
        while (j < nj) {
          const name_1 = r.program.names[j];
          if ( (this).has(name_1) == false ) {
            if ( Questionnaire.listHas(out, name_1) == false ) {
              out.push(name_1);
            }
          }
          j = j + 1;
        };
        k = k + 1;
      };
      i = i + 1;
    };
    return out;
  };
}
Questionnaire.of = function(name) {
  const q = new Questionnaire();
  q.name = name;
  return q;
};
Questionnaire.listHas = function(list, want) {
  let i = 0;
  const n = list.length;
  while (i < n) {
    if ( (list[i]) == want ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
class GraphNode  {
  constructor() {
    this.question = "";
    this.role = "";
    this.reads = [];
    this.feeds = [];
    this.rank = -1;
  }
  key () {
    return (this.question + ".") + this.role;
  };
}
class DependencyGraph  {
  constructor() {
    this.nodes = [];
    this.byKey = {};
    this.producers = {};
    this.order = [];
    this.ok = false;
    this.errorText = "";
    this.cycle = [];
  }
  build (form) {
    this.nodes.length = 0;
    this.order.length = 0;
    this.cycle.length = 0;
    this.errorText = "";
    this.ok = false;
    let i = 0;
    const n = form.questions.length;
    while (i < n) {
      const q = form.questions[i];
      let k = 0;
      const nk = q.rules.length;
      while (k < nk) {
        const r = q.rules[k];
        const at = this.addNode(q.name, r.role);
        if ( r.role == "calculated" ) {
          const qname = q.name;
          this.producers[qname] = at;
        }
        k = k + 1;
      };
      i = i + 1;
    };
    let j = 0;
    const nj = form.questions.length;
    while (j < nj) {
      const q2 = form.questions[j];
      let k2 = 0;
      const nk2 = q2.rules.length;
      while (k2 < nk2) {
        const r2 = q2.rules[k2];
        const me = (this).indexOf(q2.name, r2.role);
        let m = 0;
        const nm = r2.program.names.length;
        while (m < nm) {
          const read = r2.program.names[m];
          const src = ( Object.prototype.hasOwnProperty.call(this.producers, read) ? this.producers[read] : undefined );
          if ( (typeof(src) !== "undefined" && src != null )  ) {
            this.link(src, me);
          }
          const visAt = (this).indexOf(read, "visible");
          if ( visAt >= 0 ) {
            this.link(visAt, me);
          }
          m = m + 1;
        };
        k2 = k2 + 1;
      };
      j = j + 1;
    };
    return (this).sort();
  };
  addNode (question, role) {
    const key = (question + ".") + role;
    const found = ( Object.prototype.hasOwnProperty.call(this.byKey, key) ? this.byKey[key] : undefined );
    if ( (typeof(found) !== "undefined" && found != null )  ) {
      return found;
    }
    const node = new GraphNode();
    node.question = question;
    node.role = role;
    const at = this.nodes.length;
    this.nodes.push(node);
    this.byKey[key] = at;
    return at;
  };
  indexOf (question, role) {
    const key = (question + ".") + role;
    const found = ( Object.prototype.hasOwnProperty.call(this.byKey, key) ? this.byKey[key] : undefined );
    if ( typeof(found) === "undefined" ) {
      return -1;
    }
    return found;
  };
  nodeAt (index) {
    if ( index < 0 ) {
      return new GraphNode();
    }
    if ( index >= (this.nodes.length) ) {
      return new GraphNode();
    }
    return this.nodes[index];
  };
  link (from, to) {
    if ( from < 0 ) {
      return;
    }
    if ( to < 0 ) {
      return;
    }
    if ( from == to ) {
    }
    const a = this.nodeAt(to);
    const b = this.nodeAt(from);
    if ( DependencyGraph.intHas(a.reads, from) == false ) {
      a.reads.push(from);
    }
    if ( DependencyGraph.intHas(b.feeds, to) == false ) {
      b.feeds.push(to);
    }
  };
  sort () {
    this.order.length = 0;
    const n = this.nodes.length;
    let remaining = [];
    let i = 0;
    while (i < n) {
      const node = this.nodes[i];
      remaining.push(node.reads.length);
      i = i + 1;
    };
    let done = [];
    let d = 0;
    while (d < n) {
      done.push(false);
      d = d + 1;
    };
    let placed = 0;
    let progress = true;
    while (progress) {
      progress = false;
      let k = 0;
      while (k < n) {
        if ( (done[k]) == false ) {
          if ( (remaining[k]) == 0 ) {
            done[k] = true;
            const node2 = this.nodes[k];
            node2.rank = placed;
            this.order.push(k);
            placed = placed + 1;
            progress = true;
            let f = 0;
            const nf = node2.feeds.length;
            while (f < nf) {
              const to = node2.feeds[f];
              remaining[to] = (remaining[to]) - 1;
              f = f + 1;
            };
          }
        }
        k = k + 1;
      };
    };
    if ( placed == n ) {
      this.ok = true;
      return true;
    }
    this.nameCycle(done);
    this.ok = false;
    this.errorText = "the form has a cycle: " + DependencyGraph.joinNames(this.cycle);
    return false;
  };
  nameCycle (done) {
    this.cycle.length = 0;
    let i = 0;
    const n = this.nodes.length;
    while (i < n) {
      if ( (done[i]) == false ) {
        const node = this.nodes[i];
        this.cycle.push(node.key());
      }
      i = i + 1;
    };
  };
  dependentsOf (form, changed) {
    let hit = [];
    let i = 0;
    const n = this.nodes.length;
    while (i < n) {
      hit.push(false);
      i = i + 1;
    };
    let stack = [];
    let j = 0;
    const nj = form.questions.length;
    while (j < nj) {
      const q = form.questions[j];
      let k = 0;
      const nk = q.rules.length;
      while (k < nk) {
        const r = q.rules[k];
        if ( r.program.reads(changed) ) {
          const at = (this).indexOf(q.name, r.role);
          if ( at >= 0 ) {
            if ( (hit[at]) == false ) {
              hit[at] = true;
              stack.push(at);
            }
          }
        }
        k = k + 1;
      };
      j = j + 1;
    };
    let top = 0;
    while (top < (stack.length)) {
      const cur = stack[top];
      const node = this.nodeAt(cur);
      let f = 0;
      const nf = node.feeds.length;
      while (f < nf) {
        const to = node.feeds[f];
        if ( (hit[to]) == false ) {
          hit[to] = true;
          stack.push(to);
        }
        f = f + 1;
      };
      top = top + 1;
    };
    let out = [];
    let o = 0;
    const no = this.order.length;
    while (o < no) {
      const idx = this.order[o];
      if ( hit[idx] ) {
        out.push(idx);
      }
      o = o + 1;
    };
    return out;
  };
  nodeCount () {
    return this.nodes.length;
  };
  describe () {
    let out = "";
    let i = 0;
    const n = this.order.length;
    while (i < n) {
      const node = this.nodeAt((this.order[i]));
      if ( i > 0 ) {
        out = out + ", ";
      }
      out = out + node.key();
      i = i + 1;
    };
    return out;
  };
}
DependencyGraph.of = function(form) {
  const g = new DependencyGraph();
  g.build(form);
  return g;
};
DependencyGraph.intHas = function(list, want) {
  let i = 0;
  const n = list.length;
  while (i < n) {
    if ( (list[i]) == want ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
DependencyGraph.joinNames = function(names) {
  let out = "";
  let i = 0;
  const n = names.length;
  while (i < n) {
    if ( i > 0 ) {
      out = out + " → ";
    }
    out = out + (names[i]);
    i = i + 1;
  };
  return out;
};
class FormEngine  {
  constructor() {
    this.form = new Questionnaire();
    this.graph = new DependencyGraph();
    this.host = new ExprHost();
    this.ready = false;
    this.errorText = "";
    this.badRules = 0;
  }
  start (todayDays) {
    const state = new AnswerState();
    state.todayDays = todayDays;
    let i = 0;
    const n = this.form.questions.length;
    while (i < n) {
      const q = this.form.questions[i];
      const st = state.stateOf(q.name);
      if ( (q.initial.length) > 0 ) {
        state.answer(q.name, FormValue.ofText(q.initial));
      }
      i = i + 1;
    };
    this.evaluateAll(state);
    return state;
  };
  evaluateAll (state) {
    let k = 0;
    const nk = this.form.questions.length;
    while (k < nk) {
      const q = this.form.questions[k];
      this.checkKind(state, q.name);
      k = k + 1;
    };
    let i = 0;
    const n = this.graph.order.length;
    while (i < n) {
      this.runNode(state, this.graph.order[i]);
      i = i + 1;
    };
  };
  answer (state, name, value) {
    if ( (this.form).has(name) == false ) {
      return false;
    }
    if ( value.isEmpty() ) {
      state.clearAnswer(name);
    } else {
      state.answer(name, value);
    }
    this.checkKind(state, name);
    this.settle(state, name);
    return true;
  };
  answerText (state, name, text) {
    if ( (text.length) == 0 ) {
      return this.answer(state, name, FormValue.blank());
    }
    return this.answer(state, name, FormValue.ofText(text));
  };
  answerNumber (state, name, n) {
    return this.answer(state, name, FormValue.ofNumber(n));
  };
  clear (state, name) {
    if ( (this.form).has(name) == false ) {
      return false;
    }
    state.clearAnswer(name);
    this.checkKind(state, name);
    this.settle(state, name);
    return true;
  };
  settle (state, name) {
    const touched = this.graph.dependentsOf(this.form, name);
    let i = 0;
    const n = touched.length;
    while (i < n) {
      this.runNode(state, touched[i]);
      i = i + 1;
    };
  };
  runNode (state, index) {
    const node = this.graph.nodeAt(index);
    const q = (this.form).find(node.question);
    const rule = q.ruleFor(node.role);
    const value = this.host.evaluate(rule.program, state);
    state.evaluations = state.evaluations + 1;
    const st = state.stateOf(node.question);
    if ( node.role == "calculated" ) {
      state.compute(node.question, value);
      this.checkKind(state, node.question);
      return;
    }
    if ( node.role == "validate" ) {
      if ( value.isError() ) {
        st.ruleOk = true;
        this.refreshMessage(st, rule);
        return;
      }
      const okNow = value.truthy();
      st.ruleOk = okNow;
      this.refreshMessage(st, rule);
      return;
    }
    const flag = value.truthy();
    if ( node.role == "visible" ) {
      st.visible = flag;
      return;
    }
    if ( node.role == "enabled" ) {
      st.enabled = flag;
      return;
    }
    if ( node.role == "required" ) {
      st.required = flag;
      return;
    }
    if ( node.role == "readonly" ) {
      st.readOnly = flag;
    }
  };
  refreshMessage (st, rule) {
    if ( st.kindOk == false ) {
      return;
    }
    if ( st.ruleOk ) {
      st.message = "";
    } else {
      st.message = rule.message;
    }
  };
  checkKind (state, name) {
    const q = (this.form).find(name);
    const st = state.stateOf(name);
    const v = state.rawValueOf(name);
    const why = FormEngine.kindProblem(q, v);
    if ( (why.length) == 0 ) {
      st.kindOk = true;
      const rule = q.ruleFor("validate");
      this.refreshMessage(st, rule);
      return;
    }
    st.kindOk = false;
    st.message = why;
  };
  missingAnswers (state) {
    let out = [];
    let i = 0;
    const n = this.form.questions.length;
    while (i < n) {
      const q = this.form.questions[i];
      const st = state.stateOf(q.name);
      if ( st.visible ) {
        if ( st.required ) {
          if ( q.isComputed() == false ) {
            if ( state.wasAnswered(q.name) == false ) {
              out.push(q.name);
            }
          }
        }
      }
      i = i + 1;
    };
    return out;
  };
  invalidAnswers (state) {
    let out = [];
    let i = 0;
    const n = this.form.questions.length;
    while (i < n) {
      const q = this.form.questions[i];
      const st = state.stateOf(q.name);
      if ( st.visible ) {
        if ( st.isValid() == false ) {
          out.push(q.name);
        }
      }
      i = i + 1;
    };
    return out;
  };
  isComplete (state) {
    if ( (this.missingAnswers(state).length) > 0 ) {
      return false;
    }
    return (this.invalidAnswers(state).length) == 0;
  };
  submittedNames (state) {
    let out = [];
    let i = 0;
    const n = this.form.questions.length;
    while (i < n) {
      const q = this.form.questions[i];
      const st = state.stateOf(q.name);
      if ( st.visible ) {
        const v = state.rawValueOf(q.name);
        if ( v.isEmpty() == false ) {
          out.push(q.name);
        }
      }
      i = i + 1;
    };
    return out;
  };
  submissionJson (state) {
    const names = this.submittedNames(state);
    let out = "{";
    let i = 0;
    const n = names.length;
    while (i < n) {
      const name = names[i];
      if ( i > 0 ) {
        out = out + ",";
      }
      const v = state.rawValueOf(name);
      out = ((out + FormEngine.jsonString(name)) + ":") + FormEngine.jsonValue(v);
      i = i + 1;
    };
    return out + "}";
  };
  visibleNames (state) {
    let out = [];
    let i = 0;
    const n = this.form.questions.length;
    while (i < n) {
      const q = this.form.questions[i];
      const st = state.stateOf(q.name);
      if ( st.visible ) {
        out.push(q.name);
      }
      i = i + 1;
    };
    return out;
  };
  numberOf (state, name) {
    const v = state.rawValueOf(name);
    const num = v.asNumber();
    return num.n;
  };
  textOf (state, name) {
    const v = state.rawValueOf(name);
    return v.asText();
  };
}
FormEngine.load = function(form, host) {
  const e = new FormEngine();
  e.form = form;
  e.host = host;
  e.badRules = form.compile(host);
  e.graph = DependencyGraph.of(form);
  if ( e.graph.ok == false ) {
    e.errorText = e.graph.errorText;
    return e;
  }
  e.ready = true;
  return e;
};
FormEngine.kindProblem = function(q, v) {
  if ( v.isEmpty() ) {
    return "";
  }
  if ( v.isError() ) {
    return v.err;
  }
  const kind = q.kind;
  if ( kind == "choice" ) {
    return FormEngine.choiceProblem(q, v);
  }
  if ( kind == "multichoice" ) {
    return FormEngine.choiceProblem(q, v);
  }
  if ( kind == "bool" ) {
    const text = v.asText().toLowerCase();
    if ( FormEngine.isYes(text) ) {
      return "";
    }
    if ( FormEngine.isNo(text) ) {
      return "";
    }
    return "answer yes or no";
  }
  if ( kind == "text" ) {
    if ( q.maxLength > 0 ) {
      if ( (v.asText().length) > q.maxLength ) {
        return ("at most " + ((q.maxLength.toString()))) + " characters";
      }
    }
    return "";
  }
  const num = v.asNumber();
  if ( num.isNumber() == false ) {
    if ( kind == "date" ) {
      return "that is not a date";
    }
    return "that is not a number";
  }
  if ( kind == "int" ) {
    const whole = (Math.floor( num.n));
    if ( (whole == num.n) == false ) {
      return "a whole number, with nothing after the point";
    }
  }
  if ( q.hasMin ) {
    if ( num.n < q.minValue ) {
      return "at least " + FormValue.numberText(q.minValue);
    }
  }
  if ( q.hasMax ) {
    if ( num.n > q.maxValue ) {
      return "at most " + FormValue.numberText(q.maxValue);
    }
  }
  return "";
};
FormEngine.choiceProblem = function(q, v) {
  if ( (q.choices.length) == 0 ) {
    return "";
  }
  if ( v.isList() ) {
    let i = 0;
    const n = v.items.length;
    while (i < n) {
      const one = v.items[i];
      if ( FormEngine.isChoice(q, one) == false ) {
        return one + " is not one of the choices";
      }
      i = i + 1;
    };
    return "";
  }
  const only = v.asText();
  if ( FormEngine.isChoice(q, only) ) {
    return "";
  }
  return only + " is not one of the choices";
};
FormEngine.isChoice = function(q, value) {
  let i = 0;
  const n = q.choices.length;
  while (i < n) {
    const c = q.choices[i];
    if ( c.value == value ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
FormEngine.isYes = function(text) {
  if ( text == "true" ) {
    return true;
  }
  if ( text == "yes" ) {
    return true;
  }
  if ( text == "1" ) {
    return true;
  }
  return false;
};
FormEngine.isNo = function(text) {
  if ( text == "false" ) {
    return true;
  }
  if ( text == "no" ) {
    return true;
  }
  if ( text == "0" ) {
    return true;
  }
  return false;
};
FormEngine.jsonValue = function(v) {
  if ( v.isNumber() ) {
    return FormValue.numberText(v.n);
  }
  if ( v.kind == 1 ) {
    if ( v.b ) {
      return "true";
    }
    return "false";
  }
  if ( v.isList() ) {
    let out = "[";
    let i = 0;
    const n = v.items.length;
    while (i < n) {
      if ( i > 0 ) {
        out = out + ",";
      }
      out = out + FormEngine.jsonString((v.items[i]));
      i = i + 1;
    };
    return out + "]";
  }
  return FormEngine.jsonString(v.asText());
};
FormEngine.jsonString = function(s) {
  let out = "\"";
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s.charCodeAt(i );
    if ( ch == 34 ) {
      out = out + "\\\"";
    } else {
      if ( ch == 92 ) {
        out = out + "\\\\";
      } else {
        if ( ch == 10 ) {
          out = out + "\\n";
        } else {
          out = out + (s.substring(i, (i + 1) ));
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class ExprToken  {
  constructor() {
    this.kind = 0;
    this.num = 0.0;
    this.text = "";
    this.at = 0;
  }
}
class NativeExpr  extends ExprHost {
  constructor() {
    super()
    this.toks = [];
    this.pos = 0;
    this.parseError = "";
    this.found = [];
  }
  hostName () {
    return "native";
  };
  lex (src) {
    this.toks.length = 0;
    this.parseError = "";
    const n = src.length;
    let i = 0;
    while (i < n) {
      const ch = src.charCodeAt(i );
      if ( ch == 32 ) {
        i = i + 1;
      } else {
        if ( ch == 9 ) {
          i = i + 1;
        } else {
          if ( ch == 10 ) {
            i = i + 1;
          } else {
            if ( ch == 13 ) {
              i = i + 1;
            } else {
              const consumed = this.lexOne(src, i, n);
              if ( consumed <= 0 ) {
                return false;
              }
              i = i + consumed;
            }
          }
        }
      }
    };
    const endTok = new ExprToken();
    endTok.kind = 5;
    endTok.at = n;
    this.toks.push(endTok);
    return true;
  };
  lexOne (src, at, n) {
    const ch = src.charCodeAt(at );
    if ( NativeExpr.isDigit(ch) ) {
      return this.lexNumber(src, at, n);
    }
    if ( NativeExpr.isNameStart(ch) ) {
      return this.lexName(src, at, n);
    }
    if ( ch == 34 ) {
      return this.lexString(src, at, n, 34);
    }
    if ( ch == 39 ) {
      return this.lexString(src, at, n, 39);
    }
    return this.lexOperator(src, at, n);
  };
  lexNumber (src, at, n) {
    let i = at;
    let seenDot = false;
    while (i < n) {
      const ch = src.charCodeAt(i );
      if ( NativeExpr.isDigit(ch) ) {
        i = i + 1;
      } else {
        if ( ch == 46 ) {
          if ( seenDot ) {
            break;
          }
          seenDot = true;
          i = i + 1;
        } else {
          break;
        }
      }
    };
    const body = src.substring(at, i );
    const parsed = isNaN( parseFloat(body) ) ? undefined : parseFloat(body);
    if ( typeof(parsed) === "undefined" ) {
      this.parseError = body + " is not a number";
      return 0;
    }
    const t = new ExprToken();
    t.kind = 1;
    t.num = parsed;
    t.text = body;
    t.at = at;
    this.toks.push(t);
    return i - at;
  };
  lexName (src, at, n) {
    let i = at;
    while (i < n) {
      if ( NativeExpr.isNameChar((src.charCodeAt(i ))) == false ) {
        break;
      }
      i = i + 1;
    };
    const t = new ExprToken();
    t.kind = 3;
    t.text = src.substring(at, i );
    t.at = at;
    this.toks.push(t);
    return i - at;
  };
  lexString (src, at, n, quote) {
    let i = at + 1;
    let out = "";
    while (i < n) {
      const ch = src.charCodeAt(i );
      if ( ch == quote ) {
        const t = new ExprToken();
        t.kind = 2;
        t.text = out;
        t.at = at;
        this.toks.push(t);
        return (i + 1) - at;
      }
      if ( ch == 92 ) {
        if ( (i + 1) < n ) {
          out = out + (src.substring((i + 1), (i + 2) ));
          i = i + 2;
        } else {
          i = i + 1;
        }
      } else {
        out = out + (src.substring(i, (i + 1) ));
        i = i + 1;
      }
    };
    this.parseError = "a string was opened and never closed";
    return 0;
  };
  lexOperator (src, at, n) {
    if ( (at + 1) < n ) {
      const pair = src.substring(at, (at + 2) );
      if ( NativeExpr.isTwoCharOp(pair) ) {
        const t2 = new ExprToken();
        t2.kind = 4;
        t2.text = pair;
        t2.at = at;
        this.toks.push(t2);
        return 2;
      }
    }
    const one = src.substring(at, (at + 1) );
    if ( NativeExpr.isOneCharOp(one) ) {
      const t = new ExprToken();
      t.kind = 4;
      t.text = one;
      t.at = at;
      this.toks.push(t);
      return 1;
    }
    this.parseError = "there is no operator " + one;
    return 0;
  };
  preprocess (source) {
    return source;
  };
  parse (source) {
    const p = new ExprProgram();
    p.source = source;
    this.found.length = 0;
    this.pos = 0;
    const written = this.preprocess(source);
    if ( FormValue.trimText(written) == "" ) {
      p.errorText = "the expression is empty";
      return p;
    }
    if ( this.lex(written) == false ) {
      p.errorText = this.parseError;
      return p;
    }
    const root = this.parseOr();
    if ( (this.parseError.length) > 0 ) {
      p.errorText = this.parseError;
      return p;
    }
    if ( this.peekKind() != 5 ) {
      p.errorText = ("unexpected " + this.peekText()) + " after the expression";
      return p;
    }
    p.root = root;
    p.ok = true;
    let i = 0;
    const n = this.found.length;
    while (i < n) {
      p.names.push(this.found[i]);
      i = i + 1;
    };
    return p;
  };
  peek () {
    if ( this.pos < (this.toks.length) ) {
      return this.toks[this.pos];
    }
    const endTok = new ExprToken();
    endTok.kind = 5;
    return endTok;
  };
  peekKind () {
    const t = this.peek();
    return t.kind;
  };
  peekText () {
    const t = this.peek();
    if ( t.kind == 5 ) {
      return "the end";
    }
    return t.text;
  };
  atOp (text) {
    const t = this.peek();
    if ( t.kind != 4 ) {
      return false;
    }
    return t.text == text;
  };
  atWord (text) {
    const t = this.peek();
    if ( t.kind != 3 ) {
      return false;
    }
    return t.text == text;
  };
  take () {
    this.pos = this.pos + 1;
  };
  parseOr () {
    let left = this.parseAnd();
    while (this.atWord("or")) {
      this.take();
      const right = this.parseAnd();
      left = ExprNode.binary("or", left, right);
    };
    return left;
  };
  parseAnd () {
    let left = this.parseNot();
    while (this.atWord("and")) {
      this.take();
      const right = this.parseNot();
      left = ExprNode.binary("and", left, right);
    };
    return left;
  };
  parseNot () {
    if ( this.atWord("not") ) {
      this.take();
      const inner = this.parseNot();
      return ExprNode.unary("not", inner);
    }
    return this.parseCmp();
  };
  parseCmp () {
    const left = this.parseSum();
    const post = this.postfixOp();
    if ( (post.length) > 0 ) {
      this.take();
      let args = [];
      args.push(left);
      return ExprNode.call(post, args);
    }
    const setOp = this.setOp();
    if ( (setOp.length) > 0 ) {
      this.take();
      const other = this.parseSum();
      let pair = [];
      pair.push(left);
      pair.push(other);
      return ExprNode.call(setOp, pair);
    }
    const op = this.comparisonOp();
    if ( (op.length) == 0 ) {
      return left;
    }
    this.take();
    const right = this.parseSum();
    return ExprNode.binary(op, left, right);
  };
  postfixOp () {
    const t = this.peek();
    if ( t.kind != 3 ) {
      return "";
    }
    if ( t.text == "empty" ) {
      return "empty";
    }
    if ( t.text == "notempty" ) {
      return "notempty";
    }
    return "";
  };
  setOp () {
    const t = this.peek();
    if ( t.kind != 3 ) {
      return "";
    }
    if ( t.text == "contains" ) {
      return "contains";
    }
    if ( t.text == "notcontains" ) {
      return "notcontains";
    }
    if ( t.text == "anyof" ) {
      return "anyof";
    }
    if ( t.text == "allof" ) {
      return "allof";
    }
    return "";
  };
  comparisonOp () {
    const t = this.peek();
    if ( t.kind == 3 ) {
      if ( t.text == "in" ) {
        return "in";
      }
      return "";
    }
    if ( t.kind != 4 ) {
      return "";
    }
    if ( t.text == "==" ) {
      return "==";
    }
    if ( t.text == "=" ) {
      return "==";
    }
    if ( t.text == "!=" ) {
      return "!=";
    }
    if ( t.text == "<" ) {
      return "<";
    }
    if ( t.text == "<=" ) {
      return "<=";
    }
    if ( t.text == ">" ) {
      return ">";
    }
    if ( t.text == ">=" ) {
      return ">=";
    }
    return "";
  };
  parseSum () {
    let left = this.parseProduct();
    let going = true;
    while (going) {
      if ( this.atOp("+") ) {
        this.take();
        const r1 = this.parseProduct();
        left = ExprNode.binary("+", left, r1);
      } else {
        if ( this.atOp("-") ) {
          this.take();
          const r2 = this.parseProduct();
          left = ExprNode.binary("-", left, r2);
        } else {
          going = false;
        }
      }
    };
    return left;
  };
  parseProduct () {
    let left = this.parseUnary();
    let going = true;
    while (going) {
      if ( this.atOp("*") ) {
        this.take();
        const r1 = this.parseUnary();
        left = ExprNode.binary("*", left, r1);
      } else {
        if ( this.atOp("/") ) {
          this.take();
          const r2 = this.parseUnary();
          left = ExprNode.binary("/", left, r2);
        } else {
          if ( this.atOp("%") ) {
            this.take();
            const r3 = this.parseUnary();
            left = ExprNode.binary("%", left, r3);
          } else {
            going = false;
          }
        }
      }
    };
    return left;
  };
  parseUnary () {
    if ( this.atOp("-") ) {
      this.take();
      const inner = this.parseUnary();
      return ExprNode.unary("-", inner);
    }
    return this.parsePrimary();
  };
  parsePrimary () {
    const t = this.peek();
    if ( t.kind == 1 ) {
      this.take();
      return ExprNode.number(t.num);
    }
    if ( t.kind == 2 ) {
      this.take();
      return ExprNode.text(t.text);
    }
    if ( t.kind == 3 ) {
      this.take();
      if ( t.text == "true" ) {
        return ExprNode.truth(true);
      }
      if ( t.text == "false" ) {
        return ExprNode.truth(false);
      }
      if ( t.text == "empty" ) {
        return ExprNode.call("empty", this.noArgs());
      }
      if ( this.atOp("(") ) {
        const args = this.parseArgs();
        return ExprNode.call(t.text, args);
      }
      this.noteName(t.text);
      return ExprNode.reference(t.text);
    }
    if ( this.atOp("[") ) {
      this.take();
      let items = [];
      if ( this.atOp("]") ) {
        this.take();
        return ExprNode.call("list", items);
      }
      items.push(this.parseOr());
      while (this.atOp(",")) {
        this.take();
        items.push(this.parseOr());
      };
      if ( this.expect("]") == false ) {
        return ExprNode.truth(false);
      }
      return ExprNode.call("list", items);
    }
    if ( this.atOp("(") ) {
      this.take();
      const first = this.parseOr();
      if ( this.atOp(",") ) {
        let items_1 = [];
        items_1.push(first);
        while (this.atOp(",")) {
          this.take();
          items_1.push(this.parseOr());
        };
        if ( this.expect(")") == false ) {
          return ExprNode.truth(false);
        }
        return ExprNode.call("list", items_1);
      }
      if ( this.expect(")") == false ) {
        return ExprNode.truth(false);
      }
      return first;
    }
    if ( (this.parseError.length) == 0 ) {
      this.parseError = "expected a value, found " + this.peekText();
    }
    return ExprNode.truth(false);
  };
  noArgs () {
    let none = [];
    return none;
  };
  parseArgs () {
    let args = [];
    this.take();
    if ( this.atOp(")") ) {
      this.take();
      return args;
    }
    args.push(this.parseOr());
    while (this.atOp(",")) {
      this.take();
      args.push(this.parseOr());
    };
    this.expect(")");
    return args;
  };
  expect (text) {
    if ( this.atOp(text) ) {
      this.take();
      return true;
    }
    if ( (this.parseError.length) == 0 ) {
      this.parseError = (("expected " + text) + ", found ") + this.peekText();
    }
    return false;
  };
  noteName (name) {
    let i = 0;
    const n = this.found.length;
    while (i < n) {
      if ( (this.found[i]) == name ) {
        return;
      }
      i = i + 1;
    };
    this.found.push(name);
  };
  evaluate (program, state) {
    if ( program.ok == false ) {
      return FormValue.ofError(program.errorText);
    }
    return this.evalNode(program.root, state);
  };
  evalNode (node, state) {
    if ( node.kind == 1 ) {
      return FormValue.ofNumber(node.num);
    }
    if ( node.kind == 2 ) {
      return FormValue.ofText(node.text);
    }
    if ( node.kind == 3 ) {
      return FormValue.ofBool(node.flag);
    }
    if ( node.kind == 4 ) {
      return state.valueOf(node.text);
    }
    if ( node.kind == 5 ) {
      return this.evalUnary(node, state);
    }
    if ( node.kind == 6 ) {
      return this.evalBinary(node, state);
    }
    if ( node.kind == 7 ) {
      return this.evalCall(node, state);
    }
    return FormValue.ofError("an expression node with no meaning");
  };
  kidValue (node, index, state) {
    if ( index >= (node.kids.length) ) {
      return FormValue.ofError("a missing operand");
    }
    return this.evalNode((node.kids[index]), state);
  };
  evalUnary (node, state) {
    const a = this.kidValue(node, 0, state);
    if ( node.op == "not" ) {
      if ( a.isError() ) {
        return a;
      }
      return FormValue.ofBool((a.truthy() == false));
    }
    const num = a.asNumber();
    if ( num.isNumber() == false ) {
      return num;
    }
    return FormValue.ofNumber((0.0 - num.n));
  };
  evalBinary (node, state) {
    if ( node.op == "and" ) {
      const la = this.kidValue(node, 0, state);
      if ( la.isError() ) {
        return la;
      }
      if ( la.truthy() == false ) {
        return FormValue.ofBool(false);
      }
      const ra = this.kidValue(node, 1, state);
      if ( ra.isError() ) {
        return ra;
      }
      return FormValue.ofBool(ra.truthy());
    }
    if ( node.op == "or" ) {
      const lo = this.kidValue(node, 0, state);
      if ( lo.isError() ) {
        return lo;
      }
      if ( lo.truthy() ) {
        return FormValue.ofBool(true);
      }
      const ro = this.kidValue(node, 1, state);
      if ( ro.isError() ) {
        return ro;
      }
      return FormValue.ofBool(ro.truthy());
    }
    const a = this.kidValue(node, 0, state);
    const b = this.kidValue(node, 1, state);
    if ( a.isError() ) {
      return a;
    }
    if ( b.isError() ) {
      return b;
    }
    if ( node.op == "in" ) {
      return FormValue.ofBool(NativeExpr.holdsValue(b, a));
    }
    if ( node.op == "==" ) {
      return FormValue.ofBool(a.sameAs(b));
    }
    if ( node.op == "!=" ) {
      return FormValue.ofBool((a.sameAs(b) == false));
    }
    if ( NativeExpr.isOrdering(node.op) ) {
      return NativeExpr.compare(node.op, a, b);
    }
    return this.arithmetic(node.op, a, b);
  };
  arithmetic (op, a, b) {
    if ( a.isEmpty() ) {
      return FormValue.blank();
    }
    if ( b.isEmpty() ) {
      return FormValue.blank();
    }
    if ( op == "+" ) {
      if ( a.isText() ) {
        if ( b.isText() ) {
          return FormValue.ofText((a.s + b.s));
        }
      }
    }
    const na = a.asNumber();
    const nb = b.asNumber();
    if ( na.isNumber() == false ) {
      return na;
    }
    if ( nb.isNumber() == false ) {
      return nb;
    }
    if ( op == "+" ) {
      return FormValue.ofNumber((na.n + nb.n));
    }
    if ( op == "-" ) {
      return FormValue.ofNumber((na.n - nb.n));
    }
    if ( op == "*" ) {
      return FormValue.ofNumber((na.n * nb.n));
    }
    if ( nb.n == 0.0 ) {
      return FormValue.ofError("division by zero");
    }
    if ( op == "/" ) {
      return FormValue.ofNumber((na.n / nb.n));
    }
    if ( op == "%" ) {
      const q = Math.floor( (na.n / nb.n));
      return FormValue.ofNumber((na.n - ((q) * nb.n)));
    }
    return FormValue.ofError(("there is no operator " + op));
  };
  evalCall (node, state) {
    const name = node.text;
    const argc = node.kids.length;
    if ( name == "list" ) {
      let items = [];
      let i = 0;
      while (i < argc) {
        const v = this.kidValue(node, i, state);
        if ( v.isError() ) {
          return v;
        }
        items.push(v.asText());
        i = i + 1;
      };
      return FormValue.ofList(items);
    }
    if ( name == "empty" ) {
      if ( argc == 0 ) {
        return FormValue.blank();
      }
    }
    if ( name == "today" ) {
      return FormValue.ofInt(state.todayDays);
    }
    if ( name == "iif" ) {
      if ( argc < 3 ) {
        return FormValue.ofError("iif needs a condition and two values");
      }
      const cond = this.kidValue(node, 0, state);
      if ( cond.isError() ) {
        return cond;
      }
      if ( cond.truthy() ) {
        return this.kidValue(node, 1, state);
      }
      return this.kidValue(node, 2, state);
    }
    if ( argc < 1 ) {
      return FormValue.ofError((name + " needs an argument"));
    }
    const first = this.kidValue(node, 0, state);
    if ( first.isError() ) {
      return first;
    }
    if ( name == "len" ) {
      if ( first.isEmpty() ) {
        return FormValue.ofInt(0);
      }
      return FormValue.ofInt((first.asText().length));
    }
    if ( name == "count" ) {
      if ( first.isList() ) {
        return FormValue.ofInt((first.items.length));
      }
      if ( first.isEmpty() ) {
        return FormValue.ofInt(0);
      }
      return FormValue.ofInt(1);
    }
    if ( name == "answered" ) {
      return FormValue.ofBool((first.isEmpty() == false));
    }
    if ( name == "empty" ) {
      return FormValue.ofBool(first.isEmpty());
    }
    if ( name == "notempty" ) {
      return FormValue.ofBool((first.isEmpty() == false));
    }
    if ( name == "contains" ) {
      if ( argc < 2 ) {
        return FormValue.ofError("contains needs a value and something to look for");
      }
      const want = this.kidValue(node, 1, state);
      if ( want.isError() ) {
        return want;
      }
      return FormValue.ofBool(NativeExpr.holdsValue(first, want));
    }
    if ( name == "notcontains" ) {
      if ( argc < 2 ) {
        return FormValue.ofError("notcontains needs a value and something to look for");
      }
      const unwanted = this.kidValue(node, 1, state);
      if ( unwanted.isError() ) {
        return unwanted;
      }
      return FormValue.ofBool((NativeExpr.holdsValue(first, unwanted) == false));
    }
    if ( name == "anyof" ) {
      return this.overlap(node, state, first, false);
    }
    if ( name == "allof" ) {
      return this.overlap(node, state, first, true);
    }
    if ( name == "avg" ) {
      let total = 0.0;
      let seen = 0;
      let a = 0;
      while (a < argc) {
        const av = this.kidValue(node, a, state);
        if ( av.isError() ) {
          return av;
        }
        if ( av.isEmpty() == false ) {
          const an = av.asNumber();
          if ( an.isNumber() == false ) {
            return an;
          }
          total = total + an.n;
          seen = seen + 1;
        }
        a = a + 1;
      };
      if ( seen == 0 ) {
        return FormValue.blank();
      }
      return FormValue.ofNumber((total / (seen)));
    }
    if ( name == "round" ) {
      if ( first.isEmpty() ) {
        return first;
      }
      const rn = first.asNumber();
      if ( rn.isNumber() == false ) {
        return rn;
      }
      if ( rn.n < 0.0 ) {
        return FormValue.ofNumber(((Math.floor( (rn.n - 0.5)))));
      }
      return FormValue.ofNumber(((Math.floor( (rn.n + 0.5)))));
    }
    if ( name == "abs" ) {
      if ( first.isEmpty() ) {
        return first;
      }
      const bn = first.asNumber();
      if ( bn.isNumber() == false ) {
        return bn;
      }
      if ( bn.n < 0.0 ) {
        return FormValue.ofNumber((0.0 - bn.n));
      }
      return bn;
    }
    if ( name == "number" ) {
      return first.asNumber();
    }
    if ( name == "sum" ) {
      let total_1 = 0.0;
      let k = 0;
      while (k < argc) {
        const v2 = this.kidValue(node, k, state);
        if ( v2.isError() ) {
          return v2;
        }
        if ( v2.isEmpty() == false ) {
          const nv = v2.asNumber();
          if ( nv.isNumber() == false ) {
            return nv;
          }
          total_1 = total_1 + nv.n;
        }
        k = k + 1;
      };
      return FormValue.ofNumber(total_1);
    }
    if ( name == "age_of" ) {
      if ( first.isEmpty() ) {
        return FormValue.blank();
      }
      const born = first.asNumber();
      if ( born.isNumber() == false ) {
        return born;
      }
      return FormValue.ofNumber(((state.todayDays) - born.n));
    }
    if ( name == "matches" ) {
      if ( argc < 2 ) {
        return FormValue.ofError("matches needs a value and a prefix");
      }
      const pat = this.kidValue(node, 1, state);
      if ( pat.isError() ) {
        return pat;
      }
      return FormValue.ofBool(NativeExpr.hasPart(first.asText(), pat.asText()));
    }
    if ( name == "min" ) {
      return this.extreme(node, state, true);
    }
    if ( name == "max" ) {
      return this.extreme(node, state, false);
    }
    return FormValue.ofError(("there is no function " + name));
  };
  overlap (node, state, first, all) {
    let wanted = [];
    let i = 1;
    const n = node.kids.length;
    while (i < n) {
      const v = this.kidValue(node, i, state);
      if ( v.isError() ) {
        return v;
      }
      if ( v.isList() ) {
        let k = 0;
        const nk = v.items.length;
        while (k < nk) {
          wanted.push(v.items[k]);
          k = k + 1;
        };
      } else {
        if ( v.isEmpty() == false ) {
          wanted.push(v.asText());
        }
      }
      i = i + 1;
    };
    if ( (wanted.length) == 0 ) {
      return FormValue.ofBool(false);
    }
    let hits = 0;
    let w = 0;
    const nw = wanted.length;
    while (w < nw) {
      if ( first.holds((wanted[w])) ) {
        hits = hits + 1;
      }
      w = w + 1;
    };
    if ( all ) {
      return FormValue.ofBool((hits == nw));
    }
    return FormValue.ofBool((hits > 0));
  };
  extreme (node, state, lowest) {
    let best = 0.0;
    let have = false;
    let i = 0;
    const n = node.kids.length;
    while (i < n) {
      const v = this.kidValue(node, i, state);
      if ( v.isError() ) {
        return v;
      }
      if ( v.isEmpty() == false ) {
        const nv = v.asNumber();
        if ( nv.isNumber() == false ) {
          return nv;
        }
        if ( have == false ) {
          best = nv.n;
          have = true;
        } else {
          if ( lowest ) {
            if ( nv.n < best ) {
              best = nv.n;
            }
          } else {
            if ( nv.n > best ) {
              best = nv.n;
            }
          }
        }
      }
      i = i + 1;
    };
    if ( have == false ) {
      return FormValue.blank();
    }
    return FormValue.ofNumber(best);
  };
}
NativeExpr.isDigit = function(ch) {
  if ( ch < 48 ) {
    return false;
  }
  return ch <= 57;
};
NativeExpr.isNameStart = function(ch) {
  if ( ch == 95 ) {
    return true;
  }
  if ( ch >= 65 ) {
    if ( ch <= 90 ) {
      return true;
    }
  }
  if ( ch >= 97 ) {
    if ( ch <= 122 ) {
      return true;
    }
  }
  return false;
};
NativeExpr.isNameChar = function(ch) {
  if ( NativeExpr.isNameStart(ch) ) {
    return true;
  }
  if ( NativeExpr.isDigit(ch) ) {
    return true;
  }
  if ( ch == 46 ) {
    return true;
  }
  if ( ch == 91 ) {
    return true;
  }
  if ( ch == 93 ) {
    return true;
  }
  return false;
};
NativeExpr.isTwoCharOp = function(s) {
  if ( s == "==" ) {
    return true;
  }
  if ( s == "!=" ) {
    return true;
  }
  if ( s == "<=" ) {
    return true;
  }
  if ( s == ">=" ) {
    return true;
  }
  return false;
};
NativeExpr.isOneCharOp = function(s) {
  if ( s == "+" ) {
    return true;
  }
  if ( s == "-" ) {
    return true;
  }
  if ( s == "*" ) {
    return true;
  }
  if ( s == "/" ) {
    return true;
  }
  if ( s == "%" ) {
    return true;
  }
  if ( s == "<" ) {
    return true;
  }
  if ( s == ">" ) {
    return true;
  }
  if ( s == "(" ) {
    return true;
  }
  if ( s == ")" ) {
    return true;
  }
  if ( s == "," ) {
    return true;
  }
  if ( s == "[" ) {
    return true;
  }
  if ( s == "]" ) {
    return true;
  }
  if ( s == "=" ) {
    return true;
  }
  return false;
};
NativeExpr.isOrdering = function(op) {
  if ( op == "<" ) {
    return true;
  }
  if ( op == "<=" ) {
    return true;
  }
  if ( op == ">" ) {
    return true;
  }
  if ( op == ">=" ) {
    return true;
  }
  return false;
};
NativeExpr.compare = function(op, a, b) {
  if ( a.isEmpty() ) {
    return FormValue.ofBool(false);
  }
  if ( b.isEmpty() ) {
    return FormValue.ofBool(false);
  }
  if ( a.isText() ) {
    if ( b.isText() ) {
      const c = NativeExpr.compareText(a.s, b.s);
      return FormValue.ofBool(NativeExpr.holdsOrder(op, c));
    }
  }
  const na = a.asNumber();
  const nb = b.asNumber();
  if ( na.isNumber() == false ) {
    return na;
  }
  if ( nb.isNumber() == false ) {
    return nb;
  }
  let d = 0;
  if ( na.n < nb.n ) {
    d = -1;
  }
  if ( na.n > nb.n ) {
    d = 1;
  }
  return FormValue.ofBool(NativeExpr.holdsOrder(op, d));
};
NativeExpr.holdsOrder = function(op, d) {
  if ( op == "<" ) {
    return d < 0;
  }
  if ( op == "<=" ) {
    return d <= 0;
  }
  if ( op == ">" ) {
    return d > 0;
  }
  return d >= 0;
};
NativeExpr.compareText = function(a, b) {
  const na = a.length;
  const nb = b.length;
  let n = na;
  if ( nb < n ) {
    n = nb;
  }
  let i = 0;
  while (i < n) {
    const ca = a.charCodeAt(i );
    const cb = b.charCodeAt(i );
    if ( ca < cb ) {
      return -1;
    }
    if ( ca > cb ) {
      return 1;
    }
    i = i + 1;
  };
  if ( na < nb ) {
    return -1;
  }
  if ( na > nb ) {
    return 1;
  }
  return 0;
};
NativeExpr.holdsValue = function(haystack, needle) {
  if ( haystack.isList() ) {
    return haystack.holds(needle.asText());
  }
  if ( haystack.isEmpty() ) {
    return false;
  }
  if ( needle.isEmpty() ) {
    return false;
  }
  return NativeExpr.hasPart(haystack.asText(), needle.asText());
};
NativeExpr.hasPart = function(text, part) {
  const n = part.length;
  if ( n == 0 ) {
    return true;
  }
  const last = (text.length) - n;
  let i = 0;
  while (i <= last) {
    if ( (text.substring(i, (i + n) )) == part ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
class EngCheck  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  ok (name, cond) {
    if ( cond ) {
      this.passed = this.passed + 1;
    } else {
      this.failed = this.failed + 1;
      console.log("  FAIL " + name);
    }
  };
  eqStr (name, got, want) {
    const good = got == want;
    if ( good == false ) {
      console.log(((("       got [" + got) + "] want [") + want) + "]");
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
  eqNum (name, got, want) {
    let d = got - want;
    if ( d < 0.0 ) {
      d = 0.0 - d;
    }
    const good = d < 0.000001;
    if ( good == false ) {
      console.log((("       got " + ((got.toString()))) + " want ") + ((want.toString())));
    }
    this.ok(name, good);
  };
}
class EngineTest  {
  constructor() {
  }
}
EngineTest.clinic = function() {
  const f = Questionnaire.of("clinic");
  const age = f.question("age", QuestionKind.integer(), "How old are you?");
  age.requiredWhen("true");
  age.validWhen("age >= 0 and age <= 120", "an age is between 0 and 120");
  const guardian = f.question("guardian", QuestionKind.text(), "Guardian");
  guardian.visibleWhen("age < 18");
  guardian.requiredWhen("age < 18");
  const height = f.question("height", QuestionKind.decimal(), "Height in metres");
  const weight = f.question("weight", QuestionKind.decimal(), "Weight in kilograms");
  const bmi = f.question("bmi", QuestionKind.decimal(), "Body mass index");
  bmi.calculated("weight / (height * height)");
  const advice = f.question("advice", QuestionKind.text(), "What we suggest");
  advice.visibleWhen("bmi > 25");
  return f;
};
EngineTest.runFilling = function(c) {
  console.log("-- filling the clinic form in --");
  const host = new NativeExpr();
  const engine = FormEngine.load(EngineTest.clinic(), host);
  c.ok("the form loaded", engine.ready);
  c.eqInt("with no unparseable rules", engine.badRules, 0);
  const st = (engine).start(20000);
  c.ok("guardian starts hidden", st.isVisible("guardian") == false);
  c.ok("and is therefore not required", st.isRequired("guardian") == false);
  c.ok("the advice starts hidden too", st.isVisible("advice") == false);
  c.ok("the form is not complete", engine.isComplete(st) == false);
  const missing = engine.missingAnswers(st);
  c.eqInt("one answer is missing", missing.length, 1);
  c.eqStr("and it is age", missing[0], "age");
  engine.answerNumber(st, "age", 12.0);
  c.ok("a child sees the guardian question", st.isVisible("guardian"));
  c.ok("and has to answer it", st.isRequired("guardian"));
  c.ok("so the form is still not complete", engine.isComplete(st) == false);
  engine.answerText(st, "guardian", "Ada");
  c.ok("and now it is", engine.isComplete(st));
  engine.answerNumber(st, "age", 40.0);
  c.ok("an adult does not see it", st.isVisible("guardian") == false);
  c.eqStr("but the answer is still there", engine.textOf(st, "guardian"), "Ada");
  c.ok("and the form is complete without it", engine.isComplete(st));
  const sent = engine.submittedNames(st);
  c.ok("a hidden answer is not submitted", EngineTest.listHas(sent, "guardian") == false);
  c.ok("an answered one is", EngineTest.listHas(sent, "age"));
  c.ok("the JSON says the same", EngineTest.holds(engine.submissionJson(st), "guardian") == false);
  engine.answerNumber(st, "age", 12.0);
  c.ok("correcting the age brings the question back", st.isVisible("guardian"));
  c.eqStr("with what was typed into it", engine.textOf(st, "guardian"), "Ada");
  c.eqNum("bmi is unanswered until both parts are", engine.numberOf(st, "bmi"), 0.0);
  engine.answerNumber(st, "height", 1.8);
  engine.answerNumber(st, "weight", 81.0);
  c.eqNum("and then it is a number", engine.numberOf(st, "bmi"), 25.0);
  c.ok("which is not over 25, so no advice", st.isVisible("advice") == false);
  engine.answerNumber(st, "weight", 90.0);
  c.ok("a heavier answer shows the advice", st.isVisible("advice"));
  engine.answerNumber(st, "age", 200.0);
  c.ok("an impossible age is invalid", st.isValid("age") == false);
  const bad = st.stateOf("age");
  c.eqStr("and says why, in the form's words", bad.message, "an age is between 0 and 120");
  c.ok("so the form is not complete", engine.isComplete(st) == false);
  engine.answerNumber(st, "age", 40.0);
  c.ok("a possible one is valid again", st.isValid("age"));
  const good = st.stateOf("age");
  c.eqStr("with nothing left to say", good.message, "");
};
EngineTest.runCounting = function(c) {
  console.log("-- how much work one answer causes --");
  const host = new NativeExpr();
  const engine = FormEngine.load(EngineTest.clinic(), host);
  const st = (engine).start(20000);
  c.eqInt("the initial pass runs every rule once", st.evaluations, 6);
  st.resetCounters();
  engine.answerNumber(st, "age", 12.0);
  c.eqInt("answering age runs three rules", st.evaluations, 3);
  st.resetCounters();
  engine.answerNumber(st, "height", 1.8);
  c.eqInt("answering height runs two", st.evaluations, 2);
  st.resetCounters();
  engine.answerText(st, "guardian", "Ada");
  c.eqInt("answering a leaf runs none", st.evaluations, 0);
};
EngineTest.bigForm = function(branches) {
  const f = Questionnaire.of("big");
  let i = 0;
  while (i < branches) {
    const tag = (i.toString());
    const q = f.question(("q" + tag), QuestionKind.integer(), tag);
    const follow = f.question(("f" + tag), QuestionKind.text(), tag);
    follow.visibleWhen(("q" + tag) + " > 10");
    follow.requiredWhen(("q" + tag) + " > 10");
    const doubled = f.question(("d" + tag), QuestionKind.integer(), tag);
    doubled.calculated(("q" + tag) + " * 2");
    const checked = f.question(("c" + tag), QuestionKind.integer(), tag);
    checked.validWhen(("d" + tag) + " < 100", "too big");
    const spare = f.question(("s" + tag), QuestionKind.text(), tag);
    i = i + 1;
  };
  return f;
};
EngineTest.runBig = function(c) {
  console.log("-- ten thousand questions --");
  const host = new NativeExpr();
  const form = EngineTest.bigForm(2000);
  c.eqInt("ten thousand questions", form.questionCount(), 10000);
  const engine = FormEngine.load(form, host);
  c.ok("it loads", engine.ready);
  c.eqInt("with eight thousand rules", engine.graph.nodeCount(), 8000);
  const st = (engine).start(20000);
  c.eqInt("the initial pass runs all of them", st.evaluations, 8000);
  st.resetCounters();
  engine.answerNumber(st, "q1000", 50.0);
  c.eqInt("one answer runs four rules", st.evaluations, 4);
  c.ok("its follow-up is showing", st.isVisible("f1000"));
  c.eqNum("its calculation ran", engine.numberOf(st, "d1000"), 100.0);
  c.ok("and its check caught it", st.isValid("c1000") == false);
  c.ok("the branch beside it is untouched", st.isVisible("f1001") == false);
  c.eqNum("and so is its calculation", engine.numberOf(st, "d1001"), 0.0);
  st.resetCounters();
  engine.answerNumber(st, "q1999", 50.0);
  c.eqInt("and so does the next one", st.evaluations, 4);
  st.resetCounters();
  (engine).clear(st, "q1000");
  c.eqInt("clearing one costs the same", st.evaluations, 4);
  c.ok("and the follow-up goes away", st.isVisible("f1000") == false);
};
EngineTest.runWithheld = function(c) {
  console.log("-- what a hidden question contributes --");
  const host = new NativeExpr();
  const f = Questionnaire.of("order");
  const wantsGift = f.question("gift", QuestionKind.yesNo(), "Gift wrap?");
  const giftFee = f.question("gift_fee", QuestionKind.decimal(), "Gift wrapping");
  giftFee.visibleWhen("gift == 'yes'");
  const goods = f.question("goods", QuestionKind.decimal(), "Goods");
  const total = f.question("total", QuestionKind.decimal(), "Total");
  total.calculated("sum(goods, gift_fee)");
  const engine = FormEngine.load(f, host);
  c.ok("the form loaded", engine.ready);
  const st = (engine).start(20000);
  engine.answerNumber(st, "goods", 100.0);
  engine.answerText(st, "gift", "yes");
  engine.answerNumber(st, "gift_fee", 5.0);
  c.eqNum("the fee counts while it is showing", engine.numberOf(st, "total"), 105.0);
  engine.answerText(st, "gift", "no");
  c.ok("the fee is hidden", st.isVisible("gift_fee") == false);
  c.eqNum("and the total drops it", engine.numberOf(st, "total"), 100.0);
  c.eqNum("though the answer is still stored", EngineTest.storedNumber(st, "gift_fee"), 5.0);
  engine.answerText(st, "gift", "yes");
  c.eqNum("and it comes back", engine.numberOf(st, "total"), 105.0);
};
EngineTest.storedNumber = function(st, name) {
  const v = st.rawValueOf(name);
  const n = v.asNumber();
  return n.n;
};
EngineTest.runRefused = function(c) {
  console.log("-- a form the engine refuses --");
  const host = new NativeExpr();
  const f = Questionnaire.of("circular");
  const a = f.question("a", QuestionKind.decimal(), "A");
  a.calculated("b + 1");
  const b = f.question("b", QuestionKind.decimal(), "B");
  b.calculated("a + 1");
  const engine = FormEngine.load(f, host);
  c.ok("it is not ready", engine.ready == false);
  c.ok("and says it is a cycle", EngineTest.holds(engine.errorText, "cycle"));
  const f2 = Questionnaire.of("mixed");
  const x = f2.question("x", QuestionKind.integer(), "X");
  const y = f2.question("y", QuestionKind.text(), "Y");
  y.visibleWhen("x >= ");
  const z = f2.question("z", QuestionKind.text(), "Z");
  z.visibleWhen("x > 3");
  const e2 = FormEngine.load(f2, host);
  c.ok("a form with one bad rule still loads", e2.ready);
  c.eqInt("and says how many", e2.badRules, 1);
  const st2 = (e2).start(20000);
  e2.answerNumber(st2, "x", 5.0);
  c.ok("the good rule works", st2.isVisible("z"));
  c.ok("and the broken one hides its question", st2.isVisible("y") == false);
};
EngineTest.listHas = function(list, want) {
  let i = 0;
  const n = list.length;
  while (i < n) {
    if ( (list[i]) == want ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
EngineTest.holds = function(text, part) {
  const n = part.length;
  if ( n == 0 ) {
    return false;
  }
  const last = (text.length) - n;
  let i = 0;
  while (i <= last) {
    if ( (text.substring(i, (i + n) )) == part ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const c = new EngCheck();
  EngineTest.runFilling(c);
  EngineTest.runCounting(c);
  EngineTest.runWithheld(c);
  EngineTest.runRefused(c);
  EngineTest.runBig(c);
  console.log("");
  console.log((("passed=" + ((c.passed.toString()))) + " failed=") + ((c.failed.toString())));
  if ( c.failed == 0 ) {
    console.log("ALL PASS");
  } else {
    console.log("FAILURES");
  }
}
__js_main();
