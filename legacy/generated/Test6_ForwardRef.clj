; Test 6: Forward reference in constructor

class Test6Container {
    def items:[string]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        push items "hello"
        push items "world"
    }
    
    fn print_items:void () {
        print "Done"
    }
}

class Test6 {
    sfn m@(main):void () {
        def c (new Test6Container())
        c.print_items()
    }
}
