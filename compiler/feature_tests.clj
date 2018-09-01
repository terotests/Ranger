
Import "JSON.clj"

; enable default flags for the compiler
flag defaults (
    foobar 'the default foobar value'
)

flag npm (
  name "ranger-feature-tests"
  version "0.0.5"
  description "NPM output test and a small language feature test case."
  author "Tero Tolonen"
  license "MIT"    
)

operators {
    when_testing _:void ( code:block) @flags(test) {
        templates {
            * @macro(true) ( (block 1) )
        }
    }
    when_testing _:void ( code:block) {
        templates {
            * ( "" )
        }
    }
}

union primitives (int string double)

class childMsg @serialize(true) {
    def msgName "childName"
    def cnt      15
}
; @serialize(true)
class serverMsg @serialize(true) {
    def msgName "defaultname"
    def cnt      5
    def children:[childMsg]
}

class childObj {
    def name "ok"
}
class mainObj {
    def ch:childObj
}

class TestCase {

    ; documentation for the class described here...

    doc run 'Runs all the test cases

Use it like
```javascript
const test = require("ranger-feature-tests").TestCase;
(new test()).run()
```    
    '

    fn helloToNode:string () {
        return 'This is compiled result to hello node.js'
    }

    fn return_array:[string] () {
        return ([] 'a' 'b' 'c' 'a' 'a' 'c' 'e' 'g')
    }
    fn return_int_array:[int] () {
        return ([] 1 2 3 4 5 6 7 8 9 10)
    }
    fn return_argument:string (arg1:string) {
        return arg1
    }
    fn fn_which_throws@(throws):void () {
        throw "not handled exception!"
    }
    fn fn_which_throws2@(throws):void () {
        throw "not handled exception!"
    }
    fn try_reading_json:boolean (str:string) {
        try {
            def obj (serverMsg.fromDictionary( (from_string str)))
            print (to_string (obj.toDictionary()))
        } {
            print "-- invalid JSON"
            return false
        }
        return true
    }
    fn try_catch_void_fn () {
        print "-- entering a void function --- "
        try {
            print "do something"
            throw "<exception>"
        } {
            print "catch fn... after this should return"
            return
        }
        print "This line should not be visible"
    }
    fn run() {
        def main (new mainObj)
        try {
            print main.ch.name
        } {

        }
        
        def obj (new TestCase)
        try {
            obj.fn_which_throws()
        } {

        }
        def n 1 ; define integer 
        print 'n = ' + n
        print (obj.return_argument('first argument'))
        def arr (obj.return_array())
        arr.forEach({
            print item
        })
        arr.forEach({
            print "--- multiline lamda ---"
            print item
        })
        print (get_option 'foobar')
        if( has_option 'foobar') {
            print ' - the option was given'
        }
        if( contains arr {
            return (item == 'b') } ) {
            print "Array contains b"
        }
        def item (find arr {
            return (item == 'c')
        })
        if(!null? item ) {
            print "did find item " + (unwrap item) 
        }
        def item (find arr {
            return (item == 'd')
        })
        if(null? item ) {
            print "did not find 'd'" 
        }
        print "Count of 'a' == " + (count arr {
            return (item == 'a')
        })

        def msg (new serverMsg)
        print msg.msgName
        print "count : " + (msg.cnt)
        push msg.children (new childMsg)
        print (to_string (msg.toDictionary()))

        print "--- reading serialized data ---- "

        if( ( this.try_reading_json(  '{"msgName":"hallo!"}' ) ) ) {
            print "JSON reading was success"
        }

        if( false == ( this.try_reading_json(  `{msgName:hallo!}` ) ) ) {
            print 'JSON reading failed'
        }

        this.try_catch_void_fn()

        when_testing {
            print "If flag 'test' is enabled show this message"
        }
        
        ; the line below should throw exception
        ; def nn (from_string 'Good')

        try {
            ; the line below should throw exception
            def nn (from_string 'Good')
            ; --> these lines whould not be executed because of the exception
            def i_val (getInt nn "cnt")
            print "-> i_val == " + (unwrap i_val)
        } {
            print "--> got exception, like expected"
        }

    }
    static fn main () {
        def obj (new TestCase)
        obj.run()
    }
}