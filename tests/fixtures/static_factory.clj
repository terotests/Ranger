; Test: Static Factory Method
; Expected: Should compile and run, output "test Done"

class Item {
    def value:string ""
    
    sfn create:Item (v:string) {
        def i (new Item)
        i.value = v
        return i
    }
}

class Test_StaticFactory {
    sfn m@(main):void () {
        def item (Item.create("test"))
        print item.value
        print "Done"
    }
}
