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
module.exports.FormValue = FormValue;
module.exports.Answer = Answer;
module.exports.QuestionState = QuestionState;
module.exports.AnswerState = AnswerState;
module.exports.ExprNode = ExprNode;
module.exports.ExprProgram = ExprProgram;
module.exports.ExprHost = ExprHost;
module.exports.ExprToken = ExprToken;
module.exports.NativeExpr = NativeExpr;
module.exports.SurveyExpr = SurveyExpr;
