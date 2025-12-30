class Calculator  {
  constructor(initial) {
    this.value = 0;
    this.value = initial;
  }
  add (n) {
    return this.value + n;
  };
  multiply (n) {
    return this.value * n;
  };
}
class TestErrors  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const calc = new Calculator(10);
}
__js_main();
