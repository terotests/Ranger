; Test: BUG - toString method name causes compiler crash
; Expected: Should FAIL to compile with "Cannot read properties of undefined (reading 'push')"
; This is a known bug (see ISSUES.md)

class Item {
    def value:string ""
    
    Constructor (v:string) {
        value = v
    }
    
    fn toString:string () {
        return value
    }
}

class Container {
    def items:[Item]
    
    Constructor () {
        push items (new Item("test"))
    }
}

class Test_ToStringBug {
    sfn m@(main):void () {
        def c (new Container())
        print "Done"
    }
}
