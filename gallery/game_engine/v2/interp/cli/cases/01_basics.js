// Numbers, strings and control flow. Every case prints strings only: the three
// engines format objects and arrays differently in console.log, so anything
// that relies on that formatting would report a difference that is not a bug.
var acc = [];
function say(s) { acc.push(String(s)); }

say(1 + 2 * 3);
say((0.1 + 0.2).toFixed(17));
say(1 / 0);
say(-1 / 0);
say(String(0 / 0));
say((255).toString(16));
say(parseInt("0x1f", 16));
say(parseFloat("3.5abc"));
say(Math.max(1, 2, 3) + ":" + Math.min(1, 2, 3));
say(Math.floor(-1.5) + ":" + Math.ceil(-1.5) + ":" + Math.round(-1.5));
say((123.456).toFixed(2));
say(Number.MAX_SAFE_INTEGER);
say(0.1 + 0.2 === 0.3);

var s = "Hello, World";
say(s.length);
say(s.toUpperCase());
say(s.slice(7));
say(s.slice(-5));
say(s.indexOf("o") + ":" + s.lastIndexOf("o"));
say(s.split(", ").join("|"));
say(s.replace("World", "Ranger"));
say("  pad  ".trim() + "|");
say("ab".repeat(3));
say("a,b,,c".split(",").length);
say(String.fromCharCode(82, 103, 114));
say("abc".charCodeAt(1));

var out = "";
for (var i = 0; i < 5; i++) { out += i; }
say(out);
var j = 0, w = "";
while (j < 3) { w += "x"; j++; }
say(w);
do { w += "y"; } while (false);
say(w);
outer:
for (var a = 0; a < 3; a++) {
  for (var b = 0; b < 3; b++) {
    if (b === 1) continue outer;
    if (a === 2) break outer;
    w += a + "" + b;
  }
}
say(w);

switch (2) {
  case 1: say("one"); break;
  case 2: say("two");
  case 3: say("three (fallthrough)"); break;
  default: say("other");
}

console.log(acc.join("\n"));
