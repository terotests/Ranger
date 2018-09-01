
class mySecondClass {
    def name "Second Class"
    def name2 "--> the name 2"
    fn bar () {
        print "Bar called"
    }
    fn getname:string() {
        return "--- "
    }
}
class myClass {
    def name "myClassObj"
    def list1:[string] ([] "A" "B" "C" "D")
    fn foo () {
        print "Foo called!!!"
    }
    fn second:mySecondClass () {
        return (new mySecondClass)
    }
    fn show (str:string) {
        print "SHOW " + str
    }
}
class test_chain {

    static fn main () {

        def list ([] "a" "b" "c")
        print "first call to main"

        new myClass().foo()
        new myClass().second().bar()

        ; --> simple transformation of any call
        (call ( (new myClass()).list1) forEach ({
            print item
        }))

;        print (  new myClass().second().name )

        ; def n ((((new myClass())).second()).name)
        def n (new myClass().second().name)
        print "Here : " + n
        print "Again : " + (new myClass().second().name)
        
        ; extra parenthesis there still: .show(())
        new myClass().show( (new myClass().second().name) )
        new myClass().show(  new myClass().second().name )

        print ( new myClass().second().name2 )
        def obj2 (new myClass())

;        print ( obj2.second().name2  +  obj2.second().name )
        

; THIS was translated...
; (call: ((new: myClass: ())) show: ((call: ((new: myClass: ())) second: ()) .name:))
        
        (call ((new myClass ())) show ( ((call ((new myClass ())) second ()) .name) )  )
;        (call ((new myClass ())) show ( (call ((new myClass ())) second ()) .name )  )

       ; ((new myClass()).foo())

        ; if encounters operator ? 
        ;  ^ should you test if it matches ?? 
        print (first list)

        ; also print list.first() <-- or list.first().print()
        ; 

        ; could you create something like:
        ;
        ;  list.filter( a == b )
        ; 
        ;  new myClass().getList().filter( item < 10 )

    }
}