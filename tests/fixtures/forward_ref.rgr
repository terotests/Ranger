; Test: Forward Reference in Constructor
; Expected: Should compile and run, output "Done"

class Container {
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

class Test_ForwardRef {
    sfn m@(main):void () {
        def c (new Container())
        c.print_items()
    }
}
