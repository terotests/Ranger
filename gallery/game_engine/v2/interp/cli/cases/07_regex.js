// Regular expressions: matching, capture groups, replace callbacks, flags.
var acc = [];
function say(s) { acc.push(String(s)); }

say(/ab+c/.test("xabbbcy"));
say("2024-01-15".match(/(\d{4})-(\d{2})-(\d{2})/).slice(1).join("/"));
say("a1b2c3".replace(/\d/g, "#"));
say("a1b2c3".replace(/(\d)/g, function (m, d) { return "[" + d * 2 + "]"; }));
say("one two  three".split(/\s+/).join("|"));
say("Hello".search(/l/));
say(("aaa".match(/a/g) || []).length);

var re = /(\w)(\d)/g;
var m, pairs = [];
while ((m = re.exec("a1 b2 c3")) !== null) { pairs.push(m[1] + "=" + m[2]); }
say(pairs.join(","));

say("ABC".replace(/b/i, "-"));
say(/^\s*$/.test("   "));
say("a.b".split(".").length + ":" + "a.b".split(/\./).length);
say("x".replace(/(x)/, "$1$1"));
say(JSON.stringify("foo bar".match(/(?<first>\w+) (?<second>\w+)/).groups));
say("caT".replace(/[A-Z]/g, function (c) { return c.toLowerCase(); }));
say(new RegExp("a" + "b").test("zab"));
say(/a/.source + ":" + /a/gi.flags);
say("aaa".replace(/a/g, "$&$&").length);

console.log(acc.join("\n"));
