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
    this.visibleWhen = "";
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
    this.help = "";
    this.page = "";
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
    this.visibleWhen = "";
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
class SurveyExpr  extends NativeExpr {
  constructor() {
    super()
    this.sawBraces = false;     /** note: unused */
  }
  hostName () {
    return "surveyjs";
  };
  preprocess (source) {
    return SurveyExpr.translate(source);
  };
}
SurveyExpr.translate = function(src) {
  let out = "";
  const n = src.length;
  let i = 0;
  while (i < n) {
    const ch = src.charCodeAt(i );
    if ( ch == 39 ) {
      const end = SurveyExpr.endOfString(src, i, n, 39);
      out = out + (src.substring(i, end ));
      i = end;
    } else {
      if ( ch == 34 ) {
        const end2 = SurveyExpr.endOfString(src, i, n, 34);
        out = out + (src.substring(i, end2 ));
        i = end2;
      } else {
        if ( ch == 123 ) {
          const close = SurveyExpr.indexFrom(src, (i + 1), n, 125);
          if ( close < 0 ) {
            out = out + (src.substring(i, (i + 1) ));
            i = i + 1;
          } else {
            out = out + SurveyExpr.cleanName((src.substring((i + 1), close )));
            i = close + 1;
          }
        } else {
          const taken = SurveyExpr.operatorAt(src, i, n);
          if ( taken > 0 ) {
            out = out + SurveyExpr.operatorFor(src, i, taken);
            i = i + taken;
          } else {
            out = out + (src.substring(i, (i + 1) ));
            i = i + 1;
          }
        }
      }
    }
  };
  return out;
};
SurveyExpr.cleanName = function(inner) {
  return FormValue.trimText(inner);
};
SurveyExpr.endOfString = function(src, at, n, quote) {
  let i = at + 1;
  while (i < n) {
    const ch = src.charCodeAt(i );
    if ( ch == 92 ) {
      i = i + 2;
    } else {
      if ( ch == quote ) {
        return i + 1;
      }
      i = i + 1;
    }
  };
  return n;
};
SurveyExpr.indexFrom = function(src, at, n, ch) {
  let i = at;
  while (i < n) {
    if ( (src.charCodeAt(i )) == ch ) {
      return i;
    }
    i = i + 1;
  };
  return -1;
};
SurveyExpr.operatorAt = function(src, at, n) {
  if ( (at + 1) < n ) {
    const pair = src.substring(at, (at + 2) );
    if ( pair == "&&" ) {
      return 2;
    }
    if ( pair == "||" ) {
      return 2;
    }
    if ( pair == "<>" ) {
      return 2;
    }
  }
  if ( (src.charCodeAt(at )) == 33 ) {
    if ( (at + 1) < n ) {
      if ( (src.charCodeAt((at + 1) )) == 61 ) {
        return 0;
      }
    }
    return 1;
  }
  return 0;
};
SurveyExpr.operatorFor = function(src, at, taken) {
  const text = src.substring(at, (at + taken) );
  if ( text == "&&" ) {
    return " and ";
  }
  if ( text == "||" ) {
    return " or ";
  }
  if ( text == "<>" ) {
    return "!=";
  }
  return " not ";
};
SurveyExpr.unsupportedFunctions = function() {
  let out = [];
  out.push("age");
  out.push("currentDate");
  out.push("currentDateTime");
  out.push("getDate");
  out.push("dateDiff");
  out.push("dateAdd");
  out.push("displayValue");
  out.push("propertyValue");
  return out;
};
SurveyExpr.usesUnsupported = function(source) {
  const bad = SurveyExpr.unsupportedFunctions();
  let i = 0;
  const n = bad.length;
  while (i < n) {
    const name = bad[i];
    if ( SurveyExpr.callsFunction(source, name) ) {
      return name;
    }
    i = i + 1;
  };
  return "";
};
SurveyExpr.callsFunction = function(source, name) {
  const n = name.length;
  const last = (source.length) - n;
  let i = 0;
  while (i <= last) {
    if ( (source.substring(i, (i + n) )) == name ) {
      let before = true;
      if ( i > 0 ) {
        if ( NativeExpr.isNameChar((source.charCodeAt((i - 1) ))) ) {
          before = false;
        }
      }
      if ( before ) {
        let k = i + n;
        while (k < (source.length)) {
          if ( (source.charCodeAt(k )) != 32 ) {
            break;
          }
          k = k + 1;
        };
        if ( k < (source.length) ) {
          if ( (source.charCodeAt(k )) == 40 ) {
            return true;
          }
        }
      }
    }
    i = i + 1;
  };
  return false;
};
class JsonValue  {
  constructor() {
    this.kind = 0;
    this.num = 0.0;
    this.b = false;
    this.str = "";
    this.arr = [];
    this.keys = [];
    this.members = {};
  }
  isNull () {
    return this.kind == 0;
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
  asInt () {
    return Math.floor( this.num);
  };
  asDouble () {
    return this.num;
  };
  asString () {
    return this.str;
  };
  asBool () {
    return this.b;
  };
  count () {
    return this.arr.length;
  };
  at (index) {
    return this.arr[index];
  };
  has (key) {
    return ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) );
  };
  get (key) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      return (( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined ));
    }
    const nil = new JsonValue();
    return nil;
  };
  intOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = (( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined ));
      return Math.floor( v.num);
    }
    return dflt;
  };
  doubleOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = (( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined ));
      return v.num;
    }
    return dflt;
  };
  stringOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = (( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined ));
      return v.str;
    }
    return dflt;
  };
  boolOr (key, dflt) {
    if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) ) {
      const v = (( Object.prototype.hasOwnProperty.call(this.members, key) ? this.members[key] : undefined ));
      return v.b;
    }
    return dflt;
  };
}
class JsonParser  {
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
      const v = new JsonValue();
      return v;
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
      if ( (this.i + k) >= this.n ) {
        matched = false;
        k = wl;
      } else {
        if ( (this.s.charCodeAt((this.i + k) )) != (word.charCodeAt(k )) ) {
          matched = false;
          k = wl;
        } else {
          k = k + 1;
        }
      }
    };
    const v = new JsonValue();
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
    let go = true;
    while (go) {
      if ( this.i >= this.n ) {
        go = false;
      } else {
        const c = this.s.charCodeAt(this.i );
        if ( this.isNumChar(c) ) {
          this.i = this.i + 1;
        } else {
          go = false;
        }
      }
    };
    const v = new JsonValue();
    if ( this.i > start ) {
      const sub = this.s.substring(start, this.i );
      const d = isNaN( parseFloat(sub) ) ? undefined : parseFloat(sub);
      v.kind = 2;
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
            out = out + (this.s.substring(this.i, (this.i + 1) ));
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
        cp = (cp * 16) + this.hexDigit(hc);
        k = k + 1;
      };
      this.i = this.i + 4;
      return String.fromCharCode(cp);
    }
    return String.fromCharCode(e);
  };
  parseString () {
    const v = new JsonValue();
    v.kind = 3;
    v.str = this.readRawString();
    return v;
  };
  parseArray () {
    const v = new JsonValue();
    v.kind = 4;
    this.i = this.i + 1;
    this.skipWs();
    if ( this.i < this.n ) {
      if ( (this.s.charCodeAt(this.i )) == 93 ) {
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
    const v = new JsonValue();
    v.kind = 5;
    this.i = this.i + 1;
    this.skipWs();
    if ( this.i < this.n ) {
      if ( (this.s.charCodeAt(this.i )) == 125 ) {
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
        if ( (this.s.charCodeAt(this.i )) != 34 ) {
          this.fail("expected string key in object");
          go = false;
        } else {
          const key = this.readRawString();
          this.skipWs();
          if ( this.i >= this.n ) {
            this.fail("expected ':' in object");
            go = false;
          } else {
            if ( (this.s.charCodeAt(this.i )) != 58 ) {
              this.fail("expected ':' in object");
              go = false;
            } else {
              this.i = this.i + 1;
              const val = this.parseValue();
              v.members[key] = val;
              v.keys.push(key);
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
class SurveyReader  {
  constructor() {
    this.form = new Questionnaire();
    this.host = new SurveyExpr();
    this.errorText = "";
    this.unsupported = [];
  }
  parse (json) {
    const p = new JsonParser();
    const root = p.parse(json);
    if ( p.ok == false ) {
      this.errorText = p.err;
      return false;
    }
    if ( root.isObject() == false ) {
      this.errorText = "the form is not a JSON object";
      return false;
    }
    this.form = Questionnaire.of(root.stringOr("name", "survey"));
    this.form.title = root.stringOr("title", "");
    if ( (root).has("pages") ) {
      const pages = (root).get("pages");
      let i = 0;
      const n = (pages).count();
      while (i < n) {
        const page = (pages).at(i);
        const pname = page.stringOr("name", ("page" + (((i + 1).toString()))));
        const made = this.form.page(pname, page.stringOr("title", ""));
        made.visibleWhen = page.stringOr("visibleIf", "");
        if ( (made.visibleWhen.length) > 0 ) {
          this.readElements((page).get("elements"), pname, made.visibleWhen);
        } else {
          this.readElements((page).get("elements"), pname, "");
        }
        i = i + 1;
      };
    } else {
      this.readElements((root).get("elements"), "", "");
    }
    this.form.compile(this.host);
    return true;
  };
  readElements (list, page, pageVisible) {
    if ( (list).isArray() == false ) {
      return;
    }
    let i = 0;
    const n = (list).count();
    while (i < n) {
      this.readElement((list).at(i), page, pageVisible);
      i = i + 1;
    };
  };
  readElement (el, page, pageVisible) {
    const type = el.stringOr("type", "text");
    const name = el.stringOr("name", "");
    if ( (name.length) == 0 ) {
      this.gap("an element with no name");
      return;
    }
    if ( type == "panel" ) {
      const own = el.stringOr("visibleIf", "");
      const joined = SurveyReader.bothOf(pageVisible, own);
      this.readElements((el).get("elements"), page, joined);
      return;
    }
    if ( type == "paneldynamic" ) {
      this.gap(name + ": paneldynamic (a repeat group) is not read yet");
      return;
    }
    if ( type == "matrixdynamic" ) {
      this.gap(name + ": matrixdynamic is not read yet");
      return;
    }
    if ( type == "matrix" ) {
      this.gap(name + ": matrix is not read yet");
      return;
    }
    const q = this.form.question(name, SurveyReader.kindOf(el, type), el.stringOr("title", name));
    q.page = page;
    q.help = el.stringOr("description", "");
    const visible = SurveyReader.bothOf(pageVisible, el.stringOr("visibleIf", ""));
    if ( (visible.length) > 0 ) {
      q.visibleWhen(visible);
    }
    if ( (el).has("visible") ) {
      if ( el.boolOr("visible", true) == false ) {
        if ( (visible.length) == 0 ) {
          q.visibleWhen("false");
        }
      }
    }
    const enabled = el.stringOr("enableIf", "");
    if ( (enabled.length) > 0 ) {
      q.enabledWhen(enabled);
    }
    if ( el.boolOr("readOnly", false) ) {
      q.rule("readonly", "true");
    }
    const requiredIf = el.stringOr("requiredIf", "");
    if ( (requiredIf.length) > 0 ) {
      q.requiredWhen(requiredIf);
    } else {
      if ( el.boolOr("isRequired", false) ) {
        q.requiredWhen("true");
      }
    }
    const expression = el.stringOr("expression", "");
    if ( (expression.length) > 0 ) {
      q.calculated(expression);
    }
    const setValue = el.stringOr("setValueExpression", "");
    if ( (setValue.length) > 0 ) {
      this.gap(name + ": setValueExpression is not read yet");
    }
    if ( (el).has("choices") ) {
      const choices = (el).get("choices");
      let c = 0;
      const nc = (choices).count();
      while (c < nc) {
        const one = (choices).at(c);
        if ( one.isObject() ) {
          const made = q.choice(one.stringOr("value", ""), one.stringOr("text", ""));
          made.visibleWhen = one.stringOr("visibleIf", "");
        } else {
          if ( one.isString() ) {
            q.choice(one.asString(), one.asString());
          } else {
            if ( one.isNumber() ) {
              const text = FormValue.numberText(one.asDouble());
              q.choice(text, text);
            }
          }
        }
        c = c + 1;
      };
    }
    if ( (el).has("choicesByUrl") ) {
      this.gap(name + ": choicesByUrl needs a network the engine does not have");
    }
    if ( (el).has("maxLength") ) {
      q.atMost(el.intOr("maxLength", -1));
    }
    const hasMin = (el).has("min");
    const hasMax = (el).has("max");
    if ( hasMin ) {
      q.minValue = el.doubleOr("min", 0.0);
      q.hasMin = true;
    }
    if ( hasMax ) {
      q.maxValue = el.doubleOr("max", 0.0);
      q.hasMax = true;
    }
    if ( (el).has("defaultValue") ) {
      const dv = (el).get("defaultValue");
      if ( dv.isString() ) {
        q.initial = dv.asString();
      }
      if ( dv.isNumber() ) {
        q.initial = FormValue.numberText(dv.asDouble());
      }
    }
    if ( (el).has("validators") ) {
      this.readValidators(q, (el).get("validators"));
    }
    this.checkExpressions(q);
  };
  readValidators (q, list) {
    let i = 0;
    const n = (list).count();
    while (i < n) {
      const v = (list).at(i);
      const type = v.stringOr("type", "");
      const message = v.stringOr("text", "");
      if ( type == "expression" ) {
        const source = v.stringOr("expression", "");
        if ( (source.length) > 0 ) {
          q.validWhen(source, message);
        }
      } else {
        if ( type == "numeric" ) {
          if ( (v).has("minValue") ) {
            q.minValue = v.doubleOr("minValue", 0.0);
            q.hasMin = true;
          }
          if ( (v).has("maxValue") ) {
            q.maxValue = v.doubleOr("maxValue", 0.0);
            q.hasMax = true;
          }
        } else {
          if ( type == "text" ) {
            if ( (v).has("maxLength") ) {
              q.atMost(v.intOr("maxLength", -1));
            }
            if ( (v).has("minLength") ) {
              this.gap(q.name + ": a minLength validator is not read yet");
            }
          } else {
            this.gap(((q.name + ": the ") + type) + " validator is not read yet");
          }
        }
      }
      i = i + 1;
    };
  };
  checkExpressions (q) {
    let i = 0;
    const n = q.rules.length;
    while (i < n) {
      const r = q.rules[i];
      const bad = SurveyExpr.usesUnsupported(r.source);
      if ( (bad.length) > 0 ) {
        this.gap(((((q.name + ".") + r.role) + ": ") + bad) + "() is not implemented");
      }
      i = i + 1;
    };
  };
  gap (detail) {
    this.unsupported.push(detail);
    this.form.noteGap(detail);
  };
  gapCount () {
    return this.unsupported.length;
  };
  supported () {
    if ( (this.unsupported.length) > 0 ) {
      return false;
    }
    return (this.form.gaps.length) == 0;
  };
}
SurveyReader.read = function(json) {
  const r = new SurveyReader();
  r.parse(json);
  return r;
};
SurveyReader.kindOf = function(el, type) {
  if ( type == "boolean" ) {
    return "bool";
  }
  if ( type == "checkbox" ) {
    return "multichoice";
  }
  if ( type == "tagbox" ) {
    return "multichoice";
  }
  if ( type == "radiogroup" ) {
    return "choice";
  }
  if ( type == "dropdown" ) {
    return "choice";
  }
  if ( type == "rating" ) {
    return "decimal";
  }
  if ( type == "expression" ) {
    return "decimal";
  }
  if ( type == "text" ) {
    const input = el.stringOr("inputType", "text");
    if ( input == "number" ) {
      return "decimal";
    }
    if ( input == "date" ) {
      return "date";
    }
    return "text";
  }
  return "text";
};
SurveyReader.bothOf = function(a, b) {
  if ( (a.length) == 0 ) {
    return b;
  }
  if ( (b.length) == 0 ) {
    return a;
  }
  return ((("(" + a) + ") and (") + b) + ")";
};
module.exports.FormValue = FormValue;
module.exports.Answer = Answer;
module.exports.QuestionState = QuestionState;
module.exports.AnswerState = AnswerState;
module.exports.ExprNode = ExprNode;
module.exports.ExprProgram = ExprProgram;
module.exports.ExprHost = ExprHost;
module.exports.RuleRole = RuleRole;
module.exports.QuestionKind = QuestionKind;
module.exports.Choice = Choice;
module.exports.Rule = Rule;
module.exports.Question = Question;
module.exports.Page = Page;
module.exports.Questionnaire = Questionnaire;
module.exports.ExprToken = ExprToken;
module.exports.NativeExpr = NativeExpr;
module.exports.SurveyExpr = SurveyExpr;
module.exports.JsonValue = JsonValue;
module.exports.JsonParser = JsonParser;
module.exports.SurveyReader = SurveyReader;
