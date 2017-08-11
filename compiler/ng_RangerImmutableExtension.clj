
class RangerImmutableExtension {

    fn typeDefOf:string (p:RangerAppParamDesc) {
        def nn (p.nameNode)
        if(p.value_type == RangerNodeType.Array) {
            return ("[" + nn.array_type + "]")
        }
        if(p.value_type == RangerNodeType.Hash) {
            return ("[" + nn.key_type+ ":" + nn.array_type + "]")
        }
        return nn.type_name
    }

    ; class extension...
    fn createImmutableExtension:void (cl:RangerAppClassDesc ctx:RangerAppWriterContext wr:CodeWriter) {
        def declaredVariable:[string:boolean]        
        wr.out("Import \"ImmutableCollections.clj\""  true)
        wr.out("extension " + cl.name + " {" , true)
        wr.indent(1)
        ; for extended classes TODO
        if ( ( array_length cl.extends_classes ) > 0 ) { 
            for cl.extends_classes pName:string i {
                def pC:RangerAppClassDesc (ctx.findClass(pName))
                for pC.variables pvar:RangerAppParamDesc i {
                    set declaredVariable pvar.name true
                    def nn:CodeNode (unwrap pvar.nameNode)
                }
            }
        }
        for cl.variables pvar:RangerAppParamDesc i {
            if( has declaredVariable pvar.name ) {
                continue
            }
            def nn:CodeNode (unwrap pvar.nameNode)

            if(true) {
                wr.out("fn set_" + pvar.name + ":" + cl.name + " (new_value_of_" + pvar.name + ":" + (this.typeDefOf(pvar)) + ") {" , true)
                wr.indent(1)
                wr.out("def res (new " + cl.name + ")" , true)
                for cl.variables ivar:RangerAppParamDesc ii {
                    if( ivar == pvar ) {
                        wr.out("res."+pvar.compiledName + " = new_value_of_" + pvar.name , true)
                    } {
                        wr.out("res."+ivar.compiledName + " = this." + ivar.compiledName , true)                    
                    }
                }
                wr.out("return res" true)
                wr.indent(-1)
                wr.out("}" true)
            } {
                ; TODO: use immutable vector / map types instead
            }
        }        
        wr.indent(-1)
        wr.out("}" true)
    }
    
}