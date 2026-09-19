type union_Any = SomeClass|any_tester|number|string|boolean|number;
export class SomeClass  {
  x: number;
  constructor() {
  }
}
export class any_tester  {
  constructor() {
  }
  myFn (x : union_Any) : string  {
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
  const o : any_tester  = new any_tester();
  console.log(o.myFn(("Hello")));
  console.log(o.myFn((new SomeClass())));
  const obj2 : SomeClass  = new SomeClass();
  console.log(o.myFn((obj2)));
}
__js_main();
