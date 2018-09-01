
; Import "ng_Compiler.clj"

class third_obj {
    def name '3rd Object'
    fn foobar () {
        print "Foobar was called!!!"
    }
    fn bar:string () {
        return "Bar was called!!!"
    }
    fn getAnon:(_:string ()) () {
        return (fn:string () {
            return 'getAnon function returning something'
        })
    }
    fn simpleAnon:(_:string ()) () {
        return (fn:string () {
            print "------------------------------------------"
            print "Simple anonymous function was called !!!!"
            print "------------------------------------------"
            return 'getAnon function returning something'
        })
    }
}

class second_obj {
    def name 'name of second object...'
    def someLambda:(_:string ())
    def sub2:third_obj (new third_obj)

    def someList:[string] ([] 'A' 'B' 'C') 
    fn getName:string () {
        return this.name
    }
    fn getIntVal:int () {
        return 1234
    }

    fn copy:second_obj () {
        return (new second_obj())
    }
}

operator type:third_obj all {
    fn funfun () {
        print "Funfun for third_obj with name " + self.name
    }
}

operator type:second_obj all {
    fn funfun () {
        print "Funfun for second_obj with sub2 with name " + self.sub2.name
    }
}


class any_tester {

    def someProp "GOOD!"
    def optString:string

    def subObj:second_obj (new second_obj)

    fn myFn ( x : Any ) {
        case x str:string {
            print " it was " + str
        }
    }

    fn callFn (cb:(_:string ())) {
        print ('CallFn gets method and calls : ' + (cb()) )
    }

    fn callFn2 (cb:(_:int ())) {
        print ('CallFn2 gets method and calls : ' + (cb()) )
    }

    fn askValue:string ( x:string ) {
        return "askValue: " + x
    }

    fn getObj:second_obj () {
        return (new second_obj)
    }

    static fn main () {

        def o (new any_tester)
        o.myFn("Hello")
        (new any_tester).myFn('The second Hello using obj')
        def someString "abcd"

        print (first someString)
        print (at someString 2)

        def str ((new any_tester).askValue('Asking the value here...'))
        print str
        print ((new any_tester).askValue('I like...'))
        print (((new any_tester).getObj()).getName()) 

        print ((new any_tester).subObj.sub2.name) 
        ((new any_tester).subObj.sub2.foobar()) 

        ( ((new any_tester).subObj.sub2.simpleAnon()) ())

        print ((new any_tester).subObj.sub2.bar()) 

        o.optString = 'Optional OK'

        print (property o someProp)
        print (unwrap (property o optString))
        print (property (new second_obj) name)
        print (property ((new any_tester).getObj()) name) 

        print "automatially transferred : " + (((new any_tester).getObj()).name) 
                      
        o.callFn( ( ((new any_tester).getObj()).getName ) ) 
        o.callFn( ( ((new any_tester).getObj()).sub2.bar ) )
        o.callFn( ( ((new any_tester).getObj()).sub2.getAnon() ) ) 

        ; --> any type can implement "funfun"
        funfun ( ((new any_tester).getObj()) )
        funfun ( ((new any_tester).getObj()).sub2 )
        
        o.callFn({
            return 'Simple way'
        })
        o.callFn2( ( ((new any_tester).getObj()).getIntVal ) ) 
        print "traditional property access == " + (o.subObj.name)

        def list ((new second_obj).someList)
        list.forEach({
            print item
        })
        
        (((new second_obj).someList).forEach({
            print item
        }))
    }
}