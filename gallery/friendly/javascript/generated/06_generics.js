#!/usr/bin/env node
class GenericsMain  {
  constructor() {
  }
}
class Stack_int  {
  constructor() {
    this.items = [];
  }
  put (item) {
    this.items.push(item);
  };
  size () {
    return this.items.length;
  };
  peek () {
    let found;
    const n = this.items.length;
    if ( n == 0 ) {
      return found;
    }
    found = this.items[(n - 1)];
    return found;
  };
}
class Stack_string  {
  constructor() {
    this.items = [];
  }
  put (item) {
    this.items.push(item);
  };
  size () {
    return this.items.length;
  };
  peek () {
    let found;
    const n = this.items.length;
    if ( n == 0 ) {
      return found;
    }
    found = this.items[(n - 1)];
    return found;
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const ints = new Stack_int();
  ints.put(7);
  ints.put(8);
  console.log("int-size " + (ints.size().toString()));
  const top = ints.peek();
  console.log("int-top " + ((((typeof(top) !== "undefined" && top != null ) ) ? top : 0).toString()));
  const words = new Stack_string();
  words.put("ada");
  words.put("grace");
  console.log("str-size " + (words.size().toString()));
  const lastWord = words.peek();
  console.log("str-top " + (((typeof(lastWord) !== "undefined" && lastWord != null ) ) ? lastWord : "?"));
}
__js_main();
