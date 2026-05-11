#!/usr/bin/env node
class One  {
  constructor() {
  }
}
One.instance_count = null;
One.__singleton_instance = null;
One.__singleton = function() {
  if (One.__singleton_instance == null) {
    One.__singleton_instance = new One();
  }
  return One.__singleton_instance;
};
class App  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const a = One.__singleton();
  const b = One.__singleton();
}
__js_main();
