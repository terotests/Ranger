// ES6+: let/const, arrow functions, classes, destructuring, spread, template
// literals, Map/Set, Symbol.iterator, generators, default and rest params.
var acc = [];
const say = (s) => { acc.push(String(s)); };

const add = (a, b = 10) => a + b;
say(add(1) + ":" + add(1, 2));

const rest = (first, ...others) => first + "|" + others.join(",");
say(rest(1, 2, 3));

const arr = [1, 2, 3];
say([...arr, 4].join(","));
say(Math.max(...arr));

const [x, y, ...z] = [1, 2, 3, 4];
say(x + "," + y + "," + z.join("-"));
const { a, b: renamed, c = 99 } = { a: 1, b: 2 };
say(a + "," + renamed + "," + c);
const { d: { e } } = { d: { e: "nested" } };
say(e);

const name = "world";
say(`hello ${name} ${1 + 1}`);
say(`multi
line`.split("\n").length);
const tag = (strs, ...vals) => strs.raw.join("|") + "::" + vals.join(",");
say(tag`a${1}b${2}c`);

class Animal {
  constructor(n) { this.n = n; }
  speak() { return this.n + " makes a sound"; }
  get label() { return "A:" + this.n; }
  static create(n) { return new Animal(n); }
}
class Dog extends Animal {
  constructor(n) { super(n); this.kind = "dog"; }
  speak() { return super.speak() + " (woof)"; }
}
const dg = new Dog("rex");
say(dg.speak());
say(dg.label);
say(Animal.create("x").n);
say(dg instanceof Dog && dg instanceof Animal);

const m = new Map();
m.set("a", 1).set("b", 2);
say(m.get("a") + ":" + m.size + ":" + m.has("c"));
say([...m.keys()].join(","));
say([...m.entries()].map((p) => p[0] + "=" + p[1]).join(","));

const st = new Set([1, 2, 2, 3]);
say(st.size + ":" + st.has(2));
say([...st].join(","));

function* gen() { yield 1; yield 2; return 3; }
const g = gen();
say(g.next().value + "," + g.next().value + "," + g.next().done);
say([...gen()].join(","));

const iterable = { *[Symbol.iterator]() { yield "p"; yield "q"; } };
say([...iterable].join(","));

const o2 = { ...{ p: 1 }, q: 2 };
say(JSON.stringify(o2));
say(Object.entries({ k: 1 }).map((p) => p.join(":")).join(","));
say(Object.assign({}, { r: 1 }, { s: 2 }).s);

say([1, 2, 3].find((v) => v > 1));
say([1, 2, 3].includes(2));
say("abc".startsWith("ab") + ":" + "abc".endsWith("c") + ":" + "abc".includes("b"));
say([[1, 2], [3]].flat().join(","));
say(String(null ?? "dflt"));
const maybe = { deep: null };
say(String(maybe.deep?.gone));

console.log(acc.join("\n"));
