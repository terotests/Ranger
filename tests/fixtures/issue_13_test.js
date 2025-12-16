class TSNode  {
  constructor() {
  }
}
class Parser  {
  constructor() {
  }
  parseType () {
    const node = new TSNode();
    return node;
  };
  matchValue (v) {
    return true;
  };
  parse () {
    const outer = new TSNode();
    if ( this.matchValue("extends") ) {
      if ( this.matchValue("?") ) {
        const conditional = new TSNode();
        const trueType = this.parseType();
        conditional.body = trueType;
        return conditional;
      }
    }
    return outer;
  };
}
class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const parser = new Parser();
  const result = parser.parse();
  if ( (typeof(result.body) !== "undefined" && result.body != null )  ) {
    console.log("TEST PASSED: Issue #13 - nested if def works");
  } else {
    console.log("TEST FAILED: body should not be null");
  }
}
__js_main();
