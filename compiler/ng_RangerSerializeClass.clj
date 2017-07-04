
class RangerSerializeClass {

    fn isSerializedClass:boolean (cName:string ctx:RangerAppWriterContext ) {
        if(ctx.hasClass(cName)) {
            def clDecl:RangerAppClassDesc (ctx.findClass(cName)) 
            if(clDecl.is_serialized) {
                return true
            }        
        }
        return false
    }

    fn createWRWriter:void (pvar:RangerAppParamDesc nn:CodeNode  ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out("def key@(lives):DictNode (new DictNode())" true)
        wr.out("key.addString(\"n\" \"" + pvar.name + "\")" , true)
        if(nn.value_type == RangerNodeType.Array) {
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values:DictNode (keys.addArray(\"" + pvar.compiledName +  "\"))" , true)
                wr.out("for this." + pvar.compiledName +" item:"+nn.array_type + " i {" , true)
                    wr.indent(1)
                    wr.out("def obj@(lives):DictNode (item.serializeToDict())" true)
                    wr.out("values.push( obj )" true)
                    wr.indent(-1)
                wr.out("}" true)          
            }            
            return
        }
        if(nn.value_type == RangerNodeType.Hash) {
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values:DictNode (keys.addObject(\"" + pvar.compiledName +  "\"))" , true)
                wr.out("for this." + pvar.compiledName + " keyname {" , true)
                    wr.indent(1)
                    wr.out("def item:DictNode (unwrap (get this." + pvar.compiledName + " keyname))" , true)
                    wr.out("def obj@(lives):DictNode (item.serializeToDict())" true)
                    wr.out("values.setObject( obj )" true)
                    wr.indent(-1)
                wr.out("}" true)          
            }    
            if(nn.key_type == "string") {
                wr.out("def values:DictNode (keys.addObject(\"" + pvar.compiledName +  "\"))" , true)
                wr.out("for this." + pvar.compiledName + " keyname {" , true)
                    wr.indent(1)
                    if(nn.array_type == "string") {
                        wr.out("values.addString(keyname (unwrap (get this." + pvar.compiledName + " keyname)))" , true)
                    }
                    if(nn.array_type == "int") {
                        wr.out("values.addInt(keyname (unwrap (get this." + pvar.compiledName + " keyname)))" , true)
                    }        
                    if(nn.array_type == "boolean") {
                        wr.out("values.addBoolean(keyname (unwrap (get this." + pvar.compiledName + " keyname)))" , true)
                    }                                 
                    if(nn.array_type == "double") {
                        wr.out("values.addDouble(keyname (unwrap (get this." + pvar.compiledName + " keyname)))" , true)
                    }                    
                    wr.indent(-1)
                wr.out("}" true)                  
                return
            }                    
            return
        }
        if(nn.type_name == "string") {
            wr.out("keys.addString(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "double") {
            wr.out("keys.addDouble(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "int") {
            wr.out("keys.addInt(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "boolean") {
            wr.out("keys.addBoolean(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(this.isSerializedClass(nn.type_name ctx)) {
            wr.out("def value@(lives):DictNode (this." +pvar.compiledName + ".serializeToDict())" , true)
            wr.out("keys.setObject(\"" + pvar.compiledName + "\" value)" , true)    
        }
    }

    ; class extension...
    fn createJSONSerializerFn:void (cl:RangerAppClassDesc ctx:RangerAppWriterContext wr:CodeWriter) {
        def declaredVariable:[string:boolean]        
        wr.out("Import \"ng_DictNode.clj\"" true)
        wr.out("extension " + cl.name + " {" , true)
        wr.indent(1)
        wr.out("fn unserializeFromDict@(strong):" + cl.name + " (dict:DictNode) {" , true)
        wr.indent(1)
            wr.out("def obj:" + cl.name +" (new " + cl.name + "())" , true)
            for cl.variables pvar:RangerAppParamDesc i {
            }
            wr.out( "return obj" true)
        wr.indent(-1)
        wr.out("}" true)
        wr.newline()
        wr.out("fn serializeToDict:DictNode () {" true)
        wr.indent(1)
        wr.out("def res:DictNode (new DictNode ())" true)
        wr.out("res.addString(\"n\" \"" + cl.name + "\")" , true)
        wr.out("def keys:DictNode (res.addObject(\"data\"))" true)
        if ( ( array_length cl.extends_classes ) > 0 ) { 
            for cl.extends_classes pName:string i {
                def pC:RangerAppClassDesc (ctx.findClass(pName))
                for pC.variables pvar:RangerAppParamDesc i {
                    set declaredVariable pvar.name true
                    def nn:CodeNode (unwrap pvar.nameNode)
                    if(nn.isPrimitive()) {
                        wr.out("; extended " true)
                        wr.out("def key@(lives):DictNode (new DictNode())" true)
                        wr.out("key.addString(\"n\" \"" + pvar.name + "\")" , true)
                        wr.out("key.addString(\"t\" \"" + pvar.value_type + "\")" , true)
                        wr.out("keys.push(key)" true)
                    }
                }
            }
        }
        for cl.variables pvar:RangerAppParamDesc i {
            if( has declaredVariable pvar.name ) {
                continue
            }
            def nn:CodeNode (unwrap pvar.nameNode)
            if(nn.hasFlag("optional")) {
                wr.out("; optional variable" true)
                wr.out("if (!null? this." + pvar.name + ") {",  true)
                    wr.indent(1)
                    this.createWRWriter( pvar nn ctx wr)            
                    wr.indent(-1)
                wr.out("} {" true)
                    wr.indent(1)
                    wr.indent(-1)
                wr.out("}" true)
                continue
            }
            wr.out("; not extended " true)
            this.createWRWriter( pvar nn ctx wr)            
        }        
        wr.out("return res" true)
        wr.indent(-1)
        wr.out("}" true)
        wr.indent(-1)
        wr.out("}" true)
    }
    
}