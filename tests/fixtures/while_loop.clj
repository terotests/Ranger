; Test: While loop with array initialization

class Item {
    def value:int 0
    
    Constructor (v:int) {
        value = v
    }
    
    sfn create:Item (v:int) {
        return (new Item(v))
    }
}

class Container {
    def items:[Item]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 5) {
            push items (Item.create(i))
            i = i + 1
        }
    }
    
    fn getCount:int () {
        return (array_length items)
    }
}

class WhileLoopTest {
    sfn m@(main):void () {
        def c (new Container())
        def cnt (c.getCount())
        print ("Count: " + cnt)
        print "Done"
    }
}
