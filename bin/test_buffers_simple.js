class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=== int_buffer Test ===");
  console.log("Test 1: Allocating int_buffer of 5 elements");
  const buf = new Int32Array(5);
  console.log("int_buffer length: " + (((buf.length).toString())));
  console.log("Test 2: Setting and getting int64 values");
  buf[0] = 100;
  buf[1] = 200;
  buf[2] = 300;
  const val0 = buf[0];
  const val1 = buf[1];
  const val2 = buf[2];
  console.log(("Value 0: " + ((val0.toString()))) + " (expected 100)");
  console.log(("Value 1: " + ((val1.toString()))) + " (expected 200)");
  console.log(("Value 2: " + ((val2.toString()))) + " (expected 300)");
  console.log("=== double_buffer Test ===");
  console.log("Test 3: Allocating double_buffer of 3 elements");
  const dbuf = new Float64Array(3);
  console.log("double_buffer length: " + (((dbuf.length).toString())));
  console.log("Test 4: Setting and getting float64 values");
  dbuf[0] = 3.14;
  dbuf[1] = 2.71;
  dbuf[2] = 1.41;
  const d0 = dbuf[0];
  const d1 = dbuf[1];
  const d2 = dbuf[2];
  console.log("Double 0: " + ((d0.toString())));
  console.log("Double 1: " + ((d1.toString())));
  console.log("Double 2: " + ((d2.toString())));
  console.log("=== All tests completed ===");
}
__js_main();
