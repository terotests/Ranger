; Test 5: Class-level array property

class Point {
    def x:int 0
    def y:int 0
    
    Constructor (xx:int yy:int) {
        x = xx
        y = yy
    }
}

class Container {
    def items:[Point]
    
    fn addItem:void (p:Point) {
        push items p
    }
    
    fn count:int () {
        return (array_length items)
    }
}

class Test5 {
    sfn m@(main):void () {
        def c (new Container ())
        def p1 (new Point (1 2))
        def p2 (new Point (3 4))
        
        c.addItem(p1)
        c.addItem(p2)
        
        print "Done"
    }
}
