class SomeClass {

}

class any_tester {

  fn myFn:string ( x : Any ) {
    case x str:string {
      return "string"
    }
    case x c:SomeClass {
      return "SomeClass"
    }   
    return ""   
  }

  static fn main () {
    def o (new any_tester)
    print (o.myFn("Hello"))
    print (o.myFn((new SomeClass)))
    let obj2 = (new SomeClass)
    print (o.myFn(obj2))
  }
}