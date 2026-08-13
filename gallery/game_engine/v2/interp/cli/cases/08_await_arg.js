// `await` in argument position must suspend the async function exactly like an
// `await` bound to a variable does. If it does not, an async function runs
// straight past its own suspension point and every continuation queued before
// it is observed out of order.
var acc = [];
async function other() { await Promise.resolve(); acc.push("other"); }

(async function () {
  other();
  var r = [];
  r.push(await Promise.resolve(1));      // method call argument
  acc.push("method-arg");
  console.log(acc.join(","));
})();

(async function () {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  var a2 = [];
  async function other2() { await Promise.resolve(); a2.push("other2"); }
  other2();
  var s = String(await Promise.resolve(2));   // plain call argument
  a2.push("plain-arg:" + s);
  console.log(a2.join(","));
})();
