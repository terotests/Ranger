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
    this.enabled = true;     /** note: unused */
    this.required = false;
    this.readOnly = false;     /** note: unused */
    this.kindOk = true;
    this.ruleOk = true;
    this.message = "";     /** note: unused */
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
    this.initial = "";     /** note: unused */
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
    this.title = "";
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
  parse (source) {
    const p = new ExprProgram();
    p.source = source;
    this.found.length = 0;
    this.pos = 0;
    if ( FormValue.trimText(source) == "" ) {
      p.errorText = "the expression is empty";
      return p;
    }
    if ( this.lex(source) == false ) {
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
    const op = this.comparisonOp();
    if ( (op.length) == 0 ) {
      return left;
    }
    this.take();
    const right = this.parseSum();
    return ExprNode.binary(op, left, right);
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
    if ( this.atOp("(") ) {
      this.take();
      const first = this.parseOr();
      if ( this.atOp(",") ) {
        let items = [];
        items.push(first);
        while (this.atOp(",")) {
          this.take();
          items.push(this.parseOr());
        };
        if ( this.expect(")") == false ) {
          return ExprNode.truth(false);
        }
        return ExprNode.call("list", items);
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
      return FormValue.blank();
    }
    if ( name == "today" ) {
      return FormValue.ofInt(state.todayDays);
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
    if ( name == "number" ) {
      return first.asNumber();
    }
    if ( name == "sum" ) {
      let total = 0.0;
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
          total = total + nv.n;
        }
        k = k + 1;
      };
      return FormValue.ofNumber(total);
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
  if ( haystack.isText() ) {
    return haystack.s == needle.asText();
  }
  return false;
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
class FormCheck  {
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
class FormsTest  {
  constructor() {
  }
}
FormsTest.clinicForm = function() {
  const f = Questionnaire.of("clinic");
  f.title = "Intake";
  const age = f.question("age", QuestionKind.integer(), "How old are you?");
  age.requiredWhen("true");
  age.validWhen("age >= 0 and age <= 120", "an age is between 0 and 120");
  const guardian = f.question("guardian", QuestionKind.text(), "Name of a parent or guardian");
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
FormsTest.runModel = function(c) {
  console.log("-- the form, compiled --");
  const host = new NativeExpr();
  const f = FormsTest.clinicForm();
  const bad = f.compile(host);
  c.eqInt("every rule parsed", bad, 0);
  c.eqInt("six questions", f.questionCount(), 6);
  c.ok("and they can be found by name", (f).has("guardian"));
  c.ok("…and a name nobody used cannot", (f).has("guardain") == false);
  const g = (f).find("guardian");
  const vis = g.ruleFor("visible");
  c.eqInt("the visibility rule reads one question", vis.program.names.length, 1);
  c.ok("and it is age", vis.program.reads("age"));
  const bmiQ = (f).find("bmi");
  const bmiRule = bmiQ.ruleFor("calculated");
  c.eqInt("the calculation reads two", bmiRule.program.names.length, 2);
  c.ok("height", bmiRule.program.reads("height"));
  c.ok("and weight", bmiRule.program.reads("weight"));
  c.eqInt("nothing refers to a question that is not there", f.unknownReferences().length, 0);
};
FormsTest.runGraph = function(c) {
  console.log("-- the dependency graph --");
  const host = new NativeExpr();
  const f = FormsTest.clinicForm();
  f.compile(host);
  const g = DependencyGraph.of(f);
  c.ok("the graph sorted", g.ok);
  c.eqStr("with nothing to report", g.errorText, "");
  c.eqInt("one node per rule", g.nodeCount(), 6);
  c.eqInt("and every one of them is in the order", g.order.length, 6);
  const calc = g.nodeAt((g).indexOf("bmi", "calculated"));
  const adv = g.nodeAt((g).indexOf("advice", "visible"));
  c.ok("bmi is calculated before the advice that reads it", calc.rank < adv.rank);
  c.ok("and the advice knows where it came from", DependencyGraph.intHas(adv.reads, (g).indexOf("bmi", "calculated")));
  const touched = g.dependentsOf(f, "age");
  c.eqInt("changing age touches three rules", touched.length, 3);
  let names = "";
  let i = 0;
  while (i < (touched.length)) {
    const node = g.nodeAt((touched[i]));
    if ( i > 0 ) {
      names = names + " ";
    }
    names = names + node.key();
    i = i + 1;
  };
  c.eqStr("and they are the three that read it", names, "age.validate guardian.visible guardian.required");
  const viaCalc = g.dependentsOf(f, "weight");
  c.eqInt("changing weight touches the calculation and what reads it", viaCalc.length, 2);
  const first = g.nodeAt((viaCalc[0]));
  const second = g.nodeAt((viaCalc[1]));
  c.eqStr("the calculation first", first.key(), "bmi.calculated");
  c.eqStr("then what reads it", second.key(), "advice.visible");
  c.eqInt("an answer nothing reads touches nothing", g.dependentsOf(f, "advice").length, 0);
};
FormsTest.runCycle = function(c) {
  console.log("-- a form that refers to itself --");
  const host = new NativeExpr();
  const f = Questionnaire.of("circular");
  const a = f.question("a", QuestionKind.decimal(), "A");
  a.calculated("b + 1");
  const b = f.question("b", QuestionKind.decimal(), "B");
  b.calculated("a + 1");
  f.compile(host);
  const g = DependencyGraph.of(f);
  c.ok("the graph refuses it", g.ok == false);
  c.ok("the message names the first rule", FormsTest.holds(g.errorText, "a.calculated"));
  c.ok("and the second", FormsTest.holds(g.errorText, "b.calculated"));
  c.eqInt("both are in the cycle", g.cycle.length, 2);
  const f2 = Questionnaire.of("self");
  const s = f2.question("total", QuestionKind.decimal(), "Total");
  s.calculated("total + 1");
  f2.compile(host);
  const g2 = DependencyGraph.of(f2);
  c.ok("a rule that reads itself is refused too", g2.ok == false);
  c.eqInt("as a cycle of one", g2.cycle.length, 1);
  const chain = Questionnaire.of("chain");
  const head = chain.question("q0", QuestionKind.decimal(), "0");
  let k = 1;
  while (k < 40) {
    const q = chain.question(("q" + ((k.toString()))), QuestionKind.decimal(), ((k.toString())));
    q.calculated(("q" + (((k - 1).toString()))) + " + 1");
    k = k + 1;
  };
  chain.compile(host);
  const g3 = DependencyGraph.of(chain);
  c.ok("a chain of thirty-nine calculations sorts", g3.ok);
  c.eqInt("and changing the first touches all of them", g3.dependentsOf(chain, "q0").length, 39);
  c.eqInt("changing the last touches nothing", g3.dependentsOf(chain, "q39").length, 0);
};
FormsTest.evalOf = function(host, src, state) {
  const p = host.parse(src);
  return host.evaluate(p, state);
};
FormsTest.numOf = function(host, src, state) {
  const v = FormsTest.evalOf(host, src, state);
  return v.n;
};
FormsTest.truthOf = function(host, src, state) {
  const v = FormsTest.evalOf(host, src, state);
  return v.truthy();
};
FormsTest.runExpr = function(c) {
  console.log("-- the expression language --");
  const host = new NativeExpr();
  const st = new AnswerState();
  st.todayDays = 20000;
  c.eqNum("multiplication binds tighter", FormsTest.numOf(host, "1 + 2 * 3", st), 7.0);
  c.eqNum("and brackets win", FormsTest.numOf(host, "(1 + 2) * 3", st), 9.0);
  c.eqNum("unary minus", FormsTest.numOf(host, "0 - 4 * -2", st), 8.0);
  c.eqNum("remainder", FormsTest.numOf(host, "7 % 3", st), 1.0);
  c.ok("and short-circuits", FormsTest.truthOf(host, "false and 1 / 0 > 0", st) == false);
  c.ok("or short-circuits", FormsTest.truthOf(host, "true or 1 / 0 > 0", st));
  c.ok("not", FormsTest.truthOf(host, "not false", st));
  c.ok("a single = means ==", FormsTest.truthOf(host, "2 = 2", st));
  c.ok("text compares as text", FormsTest.truthOf(host, "'abc' < 'abd'", st));
  st.answer("country", FormValue.ofText("SE"));
  c.ok("in a list", FormsTest.truthOf(host, "country in ('FI', 'SE', 'NO')", st));
  c.ok("and not in one", FormsTest.truthOf(host, "country in ('FI', 'NO')", st) == false);
  st.answer("symptoms", FormValue.ofList(FormsTest.three()));
  c.eqNum("count of a multi-choice", FormsTest.numOf(host, "count(symptoms)", st), 3.0);
  c.ok("a chosen value is in it", FormsTest.truthOf(host, "'cough' in symptoms", st));
  const bmi = FormsTest.evalOf(host, "weight / (height * height)", st);
  c.ok("a calculation with nothing answered is empty", bmi.isEmpty());
  c.ok("…and not an error", bmi.isError() == false);
  st.answer("height", FormValue.ofNumber(1.8));
  const half = FormsTest.evalOf(host, "weight / (height * height)", st);
  c.ok("half answered is still empty", half.isEmpty());
  st.answer("weight", FormValue.ofNumber(81.0));
  const full = FormsTest.evalOf(host, "weight / (height * height)", st);
  c.eqNum("and answered is a number", full.n, 25.0);
  c.ok("age < 18 with no age is false", FormsTest.truthOf(host, "age < 18", st) == false);
  c.ok("…and so is age >= 18", FormsTest.truthOf(host, "age >= 18", st) == false);
  st.answer("typed", FormValue.ofText("42"));
  c.eqNum("text that is a number counts as one", FormsTest.numOf(host, "typed + 1", st), 43.0);
  const words = FormsTest.evalOf(host, "'lots' + 1", st);
  c.ok("text that is not a number is an error", words.isError());
  c.ok("…that says which text", FormsTest.holds(words.err, "lots"));
  c.eqNum("len", FormsTest.numOf(host, "len('hello')", st), 5.0);
  c.eqNum("sum skips what is unanswered", FormsTest.numOf(host, "sum(height, weight, missing)", st), 82.8);
  c.eqNum("today is data", FormsTest.numOf(host, "today()", st), 20000.0);
  st.answer("born", FormValue.ofNumber(10000.0));
  c.eqNum("age_of is whole days", FormsTest.numOf(host, "age_of(born)", st), 10000.0);
  c.ok("matches finds a part", FormsTest.truthOf(host, "matches('SKU-100', 'SKU-')", st));
  c.eqNum("max", FormsTest.numOf(host, "max(1, 9, 4)", st), 9.0);
  c.eqNum("min ignores the unanswered", FormsTest.numOf(host, "min(missing, 4, 9)", st), 4.0);
  c.ok("answered() sees an answer", FormsTest.truthOf(host, "answered(height)", st));
  c.ok("…and its absence", FormsTest.truthOf(host, "answered(missing)", st) == false);
  const divzero = FormsTest.evalOf(host, "height / 0", st);
  c.ok("division by zero is an error value", divzero.isError());
  const nofn = FormsTest.evalOf(host, "wobble(1)", st);
  c.ok("an unknown function is an error value", nofn.isError());
  c.ok("…that names it", FormsTest.holds(nofn.err, "wobble"));
  const broken = host.parse("age < ");
  c.ok("an incomplete expression does not parse", broken.ok == false);
  c.ok("and says what it wanted", (broken.errorText.length) > 0);
  const evaluated = host.evaluate(broken, st);
  c.ok("evaluating it is an error value, not a crash", evaluated.isError());
  const junk = host.parse("age #! 3");
  c.ok("and so is nonsense", junk.ok == false);
  const unclosed = host.parse("len('abc");
  c.ok("an unterminated string is caught", unclosed.ok == false);
  const trailing = host.parse("1 + 2 3");
  c.ok("and so is a value with nothing joining it", trailing.ok == false);
};
FormsTest.three = function() {
  let out = [];
  out.push("cough");
  out.push("fever");
  out.push("ache");
  return out;
};
FormsTest.runBadRule = function(c) {
  console.log("-- one bad rule --");
  const host = new NativeExpr();
  const f = Questionnaire.of("mixed");
  const a = f.question("a", QuestionKind.integer(), "A");
  const b = f.question("b", QuestionKind.integer(), "B");
  b.visibleWhen("a >= ");
  const d = f.question("d", QuestionKind.integer(), "D");
  d.visibleWhen("a > 3");
  const bad = f.compile(host);
  c.eqInt("one rule failed", bad, 1);
  c.eqInt("and the form says which", f.gaps.length, 1);
  c.ok("naming the question and the role", FormsTest.holds((f.gaps[0]), "b.visible"));
  const g = DependencyGraph.of(f);
  c.ok("the graph still sorts", g.ok);
  c.eqInt("changing a still reaches the rule that reads it", g.dependentsOf(f, "a").length, 1);
  const f2 = Questionnaire.of("typo");
  const q = f2.question("q", QuestionKind.integer(), "Q");
  q.visibleWhen("agee < 18");
  f2.compile(host);
  const unknown = f2.unknownReferences();
  c.eqInt("one unknown reference", unknown.length, 1);
  c.eqStr("named", unknown[0], "agee");
};
FormsTest.holds = function(text, part) {
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
  const c = new FormCheck();
  FormsTest.runModel(c);
  FormsTest.runGraph(c);
  FormsTest.runCycle(c);
  FormsTest.runExpr(c);
  FormsTest.runBadRule(c);
  console.log("");
  console.log((("passed=" + ((c.passed.toString()))) + " failed=") + ((c.failed.toString())));
  if ( c.failed == 0 ) {
    console.log("ALL PASS");
  } else {
    console.log("FAILURES");
  }
}
__js_main();
