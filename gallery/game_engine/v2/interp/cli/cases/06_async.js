// Promises, async/await and microtask ordering. The engine, node and qjs all
// have to agree on the order the continuations run in, not just the values.
var acc = [];
function say(s) { acc.push(String(s)); }

say("sync start");
Promise.resolve("A").then(function (v) { say("then " + v); });
Promise.reject(new Error("E")).catch(function (e) { say("catch " + e.message); });
new Promise(function (res) { res("B"); }).then(function (v) { say("exec " + v); });

Promise.all([Promise.resolve(1), 2, Promise.resolve(3)]).then(function (vs) {
  say("all " + vs.join(","));
});
Promise.race([new Promise(function (r) { r("fast"); }), Promise.resolve("also")]).then(function (v) {
  say("race " + v);
});
Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("no"))]).then(function (rs) {
  say("allSettled " + rs.map(function (r) { return r.status; }).join(","));
});

async function work() {
  say("async enter");
  var v = await Promise.resolve("awaited");
  say("after await " + v);
  try { await Promise.reject(new Error("rej")); } catch (e) { say("await catch " + e.message); }
  return "returned";
}
work().then(function (v) { say("work " + v); });

(async function () {
  var results = [];
  for (const n of [1, 2, 3]) { results.push(await Promise.resolve(n * 2)); }
  say("loop " + results.join(","));
  const par = await Promise.all([1, 2].map(async function (n) { return n + 100; }));
  say("par " + par.join(","));
  // Printing is deferred to the last microtask so every line above has landed.
  say("sync end");
  console.log(acc.join("\n"));
})();
