// Map and Set churn.
var s = 0;
for (var r = 0; r < 5; r++) {
  var m = new Map(), st = new Set();
  for (var i = 0; i < 2000; i++) { m.set("k" + i, i); st.add(i % 4000); }
  for (var i = 0; i < 2000; i++) { s += m.get("k" + i); if (st.has(i)) s++; }
}
console.log("mapset " + s);
