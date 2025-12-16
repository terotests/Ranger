class Item  {
  constructor(v) {
    this.value = "";
    this.value = v;
  }
  toString () {
    return this.value;
  };
}
class Container  {
  constructor() {
    this.items = [];
    this.items.push(new Item("test"));
  }
}
class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  /** unused:  const c = new Container()   **/ 
  console.log("Done");
}
__js_main();
