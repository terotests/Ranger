// indexOf / substring / split / toUpperCase on a fixed corpus.
var base = "the quick brown fox jumps over the lazy dog,";
var text = "";
for (var i = 0; i < 200; i++) { text += base; }
var s = 0;
for (var r = 0; r < 2000; r++) {
  s += text.indexOf("lazy", r);
  s += text.substring(r, r + 200).length;
  s += text.split(",").length;
  s += text.toUpperCase().charCodeAt(r);
}
console.log("strops " + s);
