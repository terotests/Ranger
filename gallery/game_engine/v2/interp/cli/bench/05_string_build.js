// Incremental string building plus length/charCodeAt reads.
var total = 0;
for (var r = 0; r < 1200; r++) {
  var buf = "";
  for (var i = 0; i < 400; i++) { buf += "ab" + (i % 10); }
  for (var i = 0; i < buf.length; i += 7) { total += buf.charCodeAt(i); }
}
console.log("strbuild " + total);
