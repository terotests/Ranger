; Test 7: Static factory with ternary operator

class Item7 {
    def value:string ""
    def flag:boolean true
    
    Constructor (v:string f:boolean) {
        value = v
        flag = f
    }
    
    sfn create:Item7 (isA:boolean) {
        return (new Item7((? isA "A" "B") isA))
    }
}

class Test7 {
    sfn m@(main):void () {
        def item1 (Item7.create(true))
        def item2 (Item7.create(false))
        print item1.value
        print item2.value
        print "Done"
    }
}
