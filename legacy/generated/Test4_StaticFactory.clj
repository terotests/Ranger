; Test 4: Static factory method

class Item4 {
    def value:string ""
    
    sfn create:Item4 (v:string) {
        def i (new Item4)
        i.value = v
        return i
    }
}

class Test4 {
    sfn m@(main):void () {
        def item (Item4.create("test"))
        print item.value
        print "Done"
    }
}
