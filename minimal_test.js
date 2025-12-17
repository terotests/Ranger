#!/usr/bin/env node
class MinimalClass  {
  constructor() {
    this.value = 0;
    this.value = 42;
  }
  getValue () {
    return this.value;
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const obj = new MinimalClass();
  print(obj).getValue();
}
__js_main();
