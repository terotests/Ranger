// JSON stringify / parse round trip.
var rows = [];
for (var i = 0; i < 1000; i++) { rows.push({ id: i, name: "row" + i, tags: ["a", "b"], ok: i % 2 === 0, score: i * 1.5 }); }
var s = 0;
for (var r = 0; r < 5; r++) { var t = JSON.stringify(rows); s += JSON.parse(t).length; s += t.length % 7; }
console.log("json " + s);
