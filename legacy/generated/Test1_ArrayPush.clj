; Minimal test to isolate the array/push issue

class Item {
    def name:string ""
    
    Constructor (n:string) {
        name = n
    }
}

class Container {
    def items:[Item]
    
    fn addItem:void (item:Item) {
        push items item
    }
    
    sfn m@(main):void () {
        def c (new Container)
        def i (new Item("test"))
        c.addItem(i)
        print "Done"
    }
}
