
class utils {
    static fn adder2:int (value:int index:int) {
        print "Cool, Static function adder2 called"
        return (value + 20)
    }    
}

class dynamicUtility {
    fn add:int (value:int index:int) {
        return (value + 50)
    }    
}

class dynamic2 extends dynamicUtility {
    
    fn add:int (value:int index:int) {
        return (value + 150)
    }        

    fn filter_odd:boolean (x:int i:int) {
        return ((x % 2) == 0)
    }
}

class closure_test {
    
    ; static functions could be given...

    def propFn:(_:void ()) 

    static fn adder:int (left:int right:int) {
        return (left + right)
    }

    static fn adder2:int (value:int index:int) {
        print "Static function adder2 called"
        return (value + 20)
    }

    fn adder3:int (value:int index:int) {
        print "Dynamic function adder3 called"
        return (value + 30)
    }

    fn run() {
        this.propFn = (fn:void () {
            print "The anonymous function to match..."
        })
        ((unwrap propFn)()) 

        def list1 ([] 1 2 3 4 5)

        ; curry the adder first parameter...
        def make_adder (fn:(_:int (x:int i:int)) (value:int) {
            return (fn:int (x:int i:int) {
                    return (x + value)
            })        
        })

        def filter_3 (fn:boolean (x:int i:int) {
            return (x != 3)
        })

        def multiplier (fn:int (x:int n:int) {
            return (x * x)
        })
        def printer (fn:int (x:int n:int) {
            print (to_string x)
            return (x * 1)
        })

        def printer2 (fn (x:int n:int) {
            print (to_string x)
        })

        ; is this necessary ??
        ; Curry to create a new function with binded parameters ??
        ; def byTen (curry multiplier 10)
        ; --> (fn:<rvofmul> ( p2:T) ( return multiplier(10 p2)))

        def o (new dynamicUtility)
        def o2 (new dynamic2)

; -------- these do not work yet:
;       def test1 o2.add
;       print "trying test 1 " + ( test1(2 2) )
;       def fnList ([] o2.add o2.add )

        print "---- list items ---"
        forEach list1 printer2

        print "---- multiplier ---"
        forEach (list1.map(multiplier)) printer2 

        print "---- adder of 10 ---"
        map (list1.map( (make_adder(10)) )) printer 

        ; test static function call as closure parameter...
        print "---- static adder of 20 ---"
        map (list1.map(utils.adder2)) printer 

        print "---- dynamic adder of 30 for this ---"
        map (list1.map(this.adder3)) printer 

        print "---- dynamic adder from object ---"
        map (list1.map(o.add)) printer 

        print "---- dynamic 2 adder from object ---"
        map (list1.map(o2.add)) printer 

        print "---- add and multiply ----"
        map (map ( map list1 (make_adder(10)) ) multiplier ) printer 

        print "---- filter 3 add and multiply ----"
        map (map ( map (filter list1 filter_3) (make_adder(10)) ) multiplier ) printer 

        print "---- filter o2.filter_odd and multiply, ng version ----"
        map (map ( map (filter list1 o2.filter_odd) (make_adder(10)) ) multiplier ) printer 

        ((fn:void (x:string y:int) {
            print "oh, nice, " + x + " now this works too!!!  with " +y
        })("Look!!!!" 12345))

        def str ((fn:string (x:string y:int) {
            return ( 'second ... oh, nice, ' + x + ' now this works too!!!  with ' +y)
        })( ((fn:string () {
                return ' *** inner fn works *** '
            })()) 1234))

        print "res == " + str

        def myFn ( (fn:(_:string ()) () {
            return (fn:string () {
                    return "message from inner function"
                })
        })())

        print (myFn())

        print (( (fn:(_:string ()) (m:string) {
            return (fn:string () {
                    return "message from second inner function " + m
                })
        })('OK!'))())


    }
    static fn main () {
        def o (new closure_test)
        o.run()
    }
}