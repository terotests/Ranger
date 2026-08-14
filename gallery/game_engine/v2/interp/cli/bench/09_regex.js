// Regex test / match / replace.
var base = "user-1234 logged in at 09:15 from 10.0.0.7; ";
var text = "";
for (var i = 0; i < 400; i++) { text += base; }
var s = 0;
for (var r = 0; r < 90; r++) {
  s += (text.match(/\d+\.\d+\.\d+\.\d+/g) || []).length;
  s += text.replace(/user-(\d+)/g, "u$1").length;
  s += /(\d\d):(\d\d)/.test(text) ? 1 : 0;
}
console.log("regex " + s);
