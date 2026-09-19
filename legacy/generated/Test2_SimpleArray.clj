; Test 2: Simple array without custom class

class Test2 {
    def names:[string]
    
    fn addName:void (name:string) {
        push names name
    }
    
    sfn m@(main):void () {
        def t (new Test2)
        t.addName("hello")
        print "Done"
    }
}
