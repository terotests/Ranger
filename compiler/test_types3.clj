

trait MyTrait @params(T S) {
    def name "foobar"
    def items:[T]
}

operator type:MyTrait all {
    fn push (item:T) {
        push self.items item
    }
}

class type_test {

    static fn main() {
        def o (new type_test)
        o.run()
    }

    fn run () {

        def nt:MyTrait@(int) (new MyTrait@(int))
        print nt.name
        push nt 200
        nt.items.forEach({
            print " -- " + item
        })

        def list ([] 1 2 3 4 5)
        for list value:int i {
            print "Value : " + value
            if( value >= 3 ) {
                break
            }
        }

        def newList (filter list {
;            return ( item < 4)
            if( item < 4) {
                return true
            } 
            return false
        })

        newList.forEach({
            print " - " + item
        })


    }
}

