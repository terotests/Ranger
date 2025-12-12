#!/usr/bin/env node
class Item  {
  constructor() {
    this.value = "";
  }
}
Item.create = function(v) {
  const i = new Item();
  i.value = v;
  return i;
};
class Test_StaticFactory  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const item = Item.create("test");
  console.log(item.value);
  console.log("Done");
}
__js_main();
