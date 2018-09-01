
Import "ng_Compiler.clj"

class any_tester {

    fn myFn ( x : Any ) {
        case x str:string {
            print " it was " + str
        }
    }

    static fn main () {
        def o (new any_tester)
        o.myFn("Hello")
        def ss (o.fnsig('int' 'int' 'int'))
        print (ss)
    }

    static fn map_node_args:CodeNode (name:string tn@(temp):CodeNode ) {
        def fnArg (r.vref name)
        if tn.expression {
            fnArg = (r.vref 'fn')                
            fnArg.expression_value = tn
            fnArg.value_type = RangerNodeType.ExpressionType
        } {
            fnArg = tn
        }
        return fnArg
    }

    fn fnsig:string ( p1:Any p2:Any p3:Any) {

        case p1 tn:string {
            return tn
        } 
        case p1 tn:CodeNode {
            return 'CodeNode'
        } 

        return "OK"
    }

}