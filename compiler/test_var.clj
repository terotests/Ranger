
; new ... ? 
operators {
  create _:int ( BigInt@(keyword):int ) {
    templates {
      es6 ('10000')
    }
  }
  test2 _:string ( foo@(keyword) ) {
    templates {
      es6 ( '"Fooo"')
    }
  }
}

class test_var {
  fn value:int () {
    return 1000
  }
  fn showMe (v:int idx:int) {
    print "v == " + v
  }
  static fn main () {
    var obj = (new test_var)
    var x = 20 + (obj.value())
    print " x = " + x
    print " bigint == " + (create BigInt)
    print (test2 foo)

    if( x <= 400) {
      print "x <= 400"
    } else {
      print "x > 400"
    }

    def list ([] 1 2 3)
    forEach list obj.showMe

  }
}