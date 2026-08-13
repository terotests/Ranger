// L1: the simplest shape -- a loop that pushes to an array and pops it empty
// again. Nothing survives the loop, so memory should be flat in N.
var N = __N__;
var arr = [];
var checksum = 0;
for (var i = 0; i < N; i++) {
  arr.push(i);
  if (arr.length > 16) { checksum += arr.pop(); }
}
while (arr.length > 0) { checksum += arr.pop(); }
console.log("checksum " + checksum + " len " + arr.length);
