// Exceptions, error types, finally ordering, custom errors.
var acc = [];
function say(s) { acc.push(String(s)); }

try { null.x; } catch (e) { say(e instanceof TypeError); }
try { undefinedIdentifier; } catch (e) { say(e instanceof ReferenceError); }
try { JSON.parse("{"); } catch (e) { say(e instanceof SyntaxError); }
try { throw new Error("boom"); } catch (e) { say(e.message + ":" + e.name); }
try { throw "a string"; } catch (e) { say(typeof e + ":" + e); }

function withFinally() {
  try { return "try"; } finally { acc.push("finally ran"); }
}
say(withFinally());

function overriding() {
  try { throw new Error("x"); } catch (e) { return "caught"; } finally { acc.push("f2"); }
}
say(overriding());

class MyError extends Error {
  constructor(m) { super(m); this.name = "MyError"; }
}
try { throw new MyError("custom"); } catch (e) {
  say(e.name + ":" + e.message + ":" + (e instanceof MyError) + ":" + (e instanceof Error));
}

var depth = 0;
function nested(n) {
  if (n === 0) throw new Error("bottom");
  try { nested(n - 1); } catch (e) { depth++; throw e; }
}
try { nested(3); } catch (e) { say(e.message + " rethrown " + depth); }

say((function () { try { return 1; } catch (e) { return 2; } })());

console.log(acc.join("\n"));
