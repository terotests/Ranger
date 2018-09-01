
Import "ng_Compiler.clj"


class type_test {

    static fn main() {
        def o (new type_test)
        o.run()
    }

    fn run () {

        (def basicTypes ([] 'int' 'string' 'boolean' 'char' 'charbuffer' 'double') )( def enumNode (r.vref 'v_enum') )
        
        enumNode.type_name = 'RangerNodeType'
        enumNode.value_type = RangerNodeType.Enum

        ; function type signature, special func required...
        def list ([]
            (r.vref 'x' 'string')
            (r.vref 'x' 'double')
            (r.vref 'x' 'int')
            (r.vref 'x' 'boolean')
            (r.vref 'x' 'char')
            (r.vref 'x' 'charbuffer')
            (r.value 'foobar')
            (r.value 123)
            (TUtil.mk_arr ('string'))
            (TUtil.mk_arr ('boolean'))
            (TUtil.mk_hash ('string' 'SomeClass'))
            enumNode
            (TUtil.newFn ( (TUtil.fnsig('double' 'int' 'int'))) )
            (TUtil.newFn ( (TUtil.fnsig((TUtil.fnsig('void' 'int' 'int')) 'int' 'int'))) )
            (TUtil.newFn ( (TUtil.fnsig((TUtil.fnsig('string' 'double' 'boolean')) 'int' 'int'))) )
            (TUtil.newFn ( (TUtil.fnsig((TUtil.fnsig('string' 'double' 'boolean')) 
                                       (TUtil.fnsig('SomeObject' 'int' 'boolean'))
                                       (TUtil.fnsig('Any' 'string' 'boolean'))))))
        )

        basicTypes.forEach({
            def arrayNode (r.vref 'arr')
            arrayNode.value_type = RangerNodeType.Array
            arrayNode.array_type = item
            push list arrayNode
            def k_type item
            
            def hNode (r.vref 'hashObj')
            hNode.value_type = RangerNodeType.Hash
            hNode.array_type = item
            hNode.key_type = 'string'
            push list hNode
        })

        forEach list {
            print "TFactory : " + (TFactory.baseSignature( item ))
        }

    }
}


class TUtil {

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

    static fn mk_hash:CodeNode (kType:Any aType:Any) {
        def aNode (r.vref 'arr')
        aNode.value_type = RangerNodeType.Hash
        case kType s:string {
            aNode.key_type = s
        }
        case aType s:string {
            aNode.array_type = s
        }
        case aType tn:CodeNode {
            aNode = (TUtil.map_node_args ('arr' tn))
        } 
        return aNode
    }

    static fn mk_arr:CodeNode (aType:Any) {
        def aNode (r.vref 'arr')
        case aType s:string {
            aNode.value_type = RangerNodeType.Array
            aNode.array_type = s
        }
        case aType tn:CodeNode {
            aNode = (TUtil.map_node_args ('arr' tn))
        } 
        return aNode
    }

    static fn newFn:CodeNode (expr@(strong):CodeNode) {
        def lambdaNode (r.vref 'myFn')
        lambdaNode.expression_value = expr                  
        lambdaNode.value_type = RangerNodeType.ExpressionType
        return lambdaNode
    }

    static fn fnsig:CodeNode ( p1:Any p2:Any p3:Any) {
        def fnArg:CodeNode
        def arg1:CodeNode
        def arg2:CodeNode
        case p1 tn:string {
            fnArg = (r.vref 'fn' tn)
        } 
        case p1 tn:CodeNode {
            fnArg = (TUtil.map_node_args ('arr' tn))
        } 
        case p2 tn:string {
            arg1 = (r.vref 'xyz' tn)
        } 
        case p2 tn:CodeNode {
            arg1 = (TUtil.map_node_args ('xyz' tn))
        } 
        case p3 tn:string {
            arg2 = (r.vref 'yyy' tn)
        } 
        case p3 tn:CodeNode {
            arg2 = (TUtil.map_node_args ('xyz' tn))
        } 
        def simpleLambda (r.expression
                            (unwrap fnArg)
                            (r.expression
                                (unwrap arg1)
                                (unwrap arg2)
                            )
                        )
        return simpleLambda
    }
}

