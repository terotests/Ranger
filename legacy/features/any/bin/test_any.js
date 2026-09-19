class SomeClass  {
  constructor() {
  }
}
class any_tester  {
  constructor() {
  }
  myFn (x) {
    if( typeof(x) === 'string' ) /* union case for string */ {
      var str = x;
      return "string";
    };
    if( x instanceof SomeClass ) /* union case */ {
      var c = x;
      return "SomeClass";
    };
    return "";
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const o = new any_tester();
  console.log(o.myFn(("Hello")));
  console.log(o.myFn((new SomeClass())));
  const obj2 = new SomeClass();
  console.log(o.myFn((obj2)));
}
__js_main();
