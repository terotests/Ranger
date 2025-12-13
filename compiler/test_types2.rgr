

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
        
        ; immutable vector usage...
        def vv:Vector@(int) (new Vector@(int))
        
        vv = (push vv 1)
        vv = (push vv 2)
        
        def vv2 vv
        vv2 = (push vv2 3)
        vv2 = (push vv2 4)

        vv.forEach({
            print " 1) " + item
        })
        vv2.forEach({
            print " 2) " + item
        })

    }
}

