class FDCT  {
  constructor() {
    this.name = "test";     /** note: unused */
  }
  test () {
    const cosTable = new Int32Array(64);
    cosTable[0] = 1024;
    cosTable[1] = 1004;
    const val0 = cosTable[0];
    console.log("Value 0: " + ((val0.toString())));
  };
}
class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const f = new FDCT();
  f.test();
}
__js_main();
