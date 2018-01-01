
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
                wr.out("def values:DictNode (obj_keys.addArray(\"" + pvar.compiledName +  "\"))" , true)
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
                wr.out("def values:DictNode (obj_keys.addObject(\"" + pvar.compiledName +  "\"))" , true)
                wr.out("for this." + pvar.compiledName + " keyname {" , true)
                    wr.indent(1)
                    wr.out("def item:DictNode (unwrap (get this." + pvar.compiledName + " keyname))" , true)
                    wr.out("def obj@(lives):DictNode (item.serializeToDict())" true)
                    wr.out("values.setObject( obj )" true)
                    wr.indent(-1)
                wr.out("}" true)          
            }    
            if(nn.key_type == "string") {
                wr.out("def values:DictNode (obj_keys.addObject(\"" + pvar.compiledName +  "\"))" , true)
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
                    if(nn.value_type == RangerNodeType.Enum) {
                        wr.out("values.addInt(keyname (unwrap (get this." + pvar.compiledName + " keyname)))" , true)
                    }
                    wr.indent(-1)
                wr.out("}" true)                  
                return
            }                    
            return
        }
        if(nn.type_name == "string") {
            wr.out("obj_keys.addString(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "double") {
            wr.out("obj_keys.addDouble(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "int") {
            wr.out("obj_keys.addInt(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.type_name == "boolean") {
            wr.out("obj_keys.addBoolean(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(nn.value_type == RangerNodeType.Enum) {
            wr.out("obj_keys.addInt(\"" + pvar.compiledName + "\" (this." + pvar.compiledName +"))" , true)
            return
        }
        if(this.isSerializedClass(nn.type_name ctx)) {
            wr.out("def value@(lives):DictNode (this." +pvar.compiledName + ".serializeToDict())" , true)
            wr.out("obj_keys.setObject(\"" + pvar.compiledName + "\" value)" , true)    
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
            ;for cl.variables pvar:RangerAppParamDesc i {
            ;}
            wr.out( "return obj" true)
        wr.indent(-1)
        wr.out("}" true)
        wr.newline()
        wr.out("fn serializeToDict:DictNode () {" true)
        wr.indent(1)
        wr.out("def res:DictNode (new DictNode ())" true)
        wr.out("res.addString(\"n\" \"" + cl.name + "\")" , true)
        wr.out("def obj_keys:DictNode (res.addObject(\"data\"))" true)
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
                        wr.out("obj_keys.push(key)" true)
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

    fn createWRWriter2:void (pvar:RangerAppParamDesc nn:CodeNode  ctx:RangerAppWriterContext wr:CodeWriter) {

        ; pvar.name        
        if(nn.value_type == RangerNodeType.Array) {
            ; TODO: serializing primitives...
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values:JSONArrayObject (json_array)" , true)
                wr.out("for this." + pvar.compiledName +" item:"+nn.array_type + " i {" , true)
                    wr.indent(1)
                    wr.out("def obj@(lives):JSONDataObject (item.toDictionary())" true)
                    wr.out("push values obj" true)
                    wr.indent(-1)
                wr.out("}" true)          
                wr.out("set res  \"" + pvar.name + "\" values " , true)
            } {
                wr.out("def values:JSONArrayObject (json_array)" , true)
                wr.out("for this." + pvar.compiledName +" item:"+nn.array_type + " i {" , true)
                    wr.indent(1)
                    wr.out("push values item" true)
                    wr.indent(-1)
                wr.out("}" true)          
                wr.out("set res  \"" + pvar.name + "\" values " , true)                
            }           
            return
        }
        if(nn.value_type == RangerNodeType.Hash) {
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values:JSONDataObject (json_object)" , true)
                wr.out("def keyList (keys this." + pvar.compiledName + ")" , true)
                wr.out("for keyList keyname:string index {" , true)
                    wr.indent(1)
                    wr.out("def item (unwrap (get this." + pvar.compiledName + " keyname))" , true)

                    if( ctx.isDefinedClass(nn.array_type) ) {
                      wr.out("def obj@(lives):JSONDataObject (item.toDictionary())" true)
                      wr.out("set values keyname obj " true)
                    } {
                      wr.out("set values keyname item " true)                      
                    }
                    wr.indent(-1)
                wr.out("}" true)          
                wr.out("set res  \"" + pvar.name + "\" values " , true)
            } {
                if( (ctx.isDefinedClass(nn.array_type) ) == false ) {
                    wr.out("def values:JSONDataObject (json_object)" , true)
                    wr.out("def keyList (keys this." + pvar.compiledName + ")" , true)
                    wr.out("for keyList keyname:string index {" , true)
        ;            wr.out("for this." + pvar.compiledName + " keyname {" , true)
                        wr.indent(1)
                        wr.out("def item (unwrap (get this." + pvar.compiledName + " keyname))" , true)
                        wr.out("set values keyname item " true)                      
                        wr.indent(-1)
                    wr.out("}" true)          
                    wr.out("set res  \"" + pvar.name + "\" values " , true)  
                }              
            }
            return
        }
        if(nn.hasFlag("optional")) {
            if( (ctx.isDefinedClass(nn.type_name) ) == false ) {
                wr.out("set res  \"" + pvar.name + "\" (unwrap this." + pvar.compiledName +") " , true )
            } {
                wr.out("set res  \"" + pvar.name + "\" (call (unwrap this." + pvar.compiledName +") toDictionary ()) " , true )
            }
        } {
            if( (ctx.isDefinedClass(nn.type_name) ) == false ) {
                wr.out("set res  \"" + pvar.name + "\" (this." + pvar.compiledName +") " , true )
            } {
                wr.out("set res  \"" + pvar.name + "\" (this." + pvar.compiledName +".toDictionary()) " , true )
            }
        }
    }

    fn createWRReader2:void (pvar:RangerAppParamDesc nn:CodeNode  ctx:RangerAppWriterContext wr:CodeWriter) {

        ; pvar.name        
        if(nn.value_type == RangerNodeType.Array) {
            ; TODO: serializing primitives...
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values:JSONArrayObject (getArray dict \"" + pvar.name + "\")" , true)
                wr.out("if(!null? values) {" true)
                wr.indent(1)
                wr.out("def arr (unwrap values)" true)
                wr.out("arr.forEach({" , true)
                    wr.indent(1)
                    wr.out("case item oo:JSONDataObject {" true)
                    wr.indent(1)
                        wr.out("def newObj (" + nn.array_type + ".fromDictionary(oo))" , true)
                        wr.out("push obj." + pvar.name + " newObj" , true)
                    wr.indent(-1)
                    wr.out("}" true)
                    wr.indent(-1)
                wr.out("})" true)          
                wr.indent(-1)
                wr.out("}" true)
            } {
                wr.out("def values:JSONArrayObject (getArray dict \"" + pvar.name + "\")" , true)
                wr.out("if(!null? values) {" true)
                wr.indent(1)
                wr.out("def arr (unwrap values)" true)
                wr.out("arr.forEach({" , true)
                    wr.indent(1)
                    wr.out("case item oo:" + nn.array_type + " {" , true)
                    wr.indent(1)
;                        wr.out("def newObj (" + nn.array_type + ".fromDictionary(oo))" , true)
                        wr.out("push obj." + pvar.name + " oo" , true)
                    wr.indent(-1)
                    wr.out("}" true)
                    wr.indent(-1)
                wr.out("})" true)          
                wr.indent(-1)
                wr.out("}" true)                
            }        
            return
        }
        if(nn.value_type == RangerNodeType.Hash) {
            if(this.isSerializedClass(nn.array_type ctx)) {
                wr.out("def values (getObject dict \"" + pvar.name + "\")" , true)
                wr.out("if(!null? values) {" true)
                wr.indent(1)                
                wr.out("def theObj" + pvar.name + " (unwrap values)" , true)    
                wr.out("def obj_keys (keys theObj" + pvar.name + ")" , true)
                wr.out("obj_keys.forEach({" , true)
                    wr.indent(1)
                    if( ctx.isDefinedClass(nn.array_type) ) {
                      ;wr.out("try {" true)
                      ;wr.indent(1)
                      wr.out("def theValue (getObject theObj" + pvar.name + " item ) " , true)
                      wr.out("if(!null? theValue) {" true)
                      wr.indent(1)
                      wr.out("def newObj@(lives) (" + nn.array_type + ".fromDictionary((unwrap theValue)))" , true)
                      wr.out("set obj." + pvar.name + " item newObj " , true)
                      wr.indent(-1)
                      wr.out("}" true)
                      ;wr.indent(-1)
                      ;wr.out("} {" true)                      
                      ;wr.out("}" true)
                    } {
                    }
                    wr.indent(-1)
                wr.out("})" true)          
                wr.indent(-1)
                wr.out("}" true)
            } {

                wr.out("def values (getObject dict \"" + pvar.name + "\")" , true)
                wr.out("if(!null? values) {" true)
                wr.indent(1)                
                wr.out("def theObj" + pvar.name + " (unwrap values)" , true)    
                wr.out("def obj_keys (keys theObj" + pvar.name + ")" , true)
                wr.out("obj_keys.forEach({" , true)
                    wr.indent(1)
                    if( ctx.isDefinedClass(nn.array_type) ) {

                    } {
                      ; TODO: different data types
                      switch nn.array_type {
                          case "string" {
                              wr.out("def v (getStr theObj" + pvar.name + " item)" , true)
                              wr.out("if(!null? v) {" true)
                                wr.indent(1)
                                wr.out("set obj." + pvar.name + " item (unwrap v) " , true)
                                wr.indent(-1)
                              wr.out("}" true)
                          }
                          case "int" {
                              wr.out("def v (getInt theObj" + pvar.name + " item)" , true)
                              wr.out("if(!null? v) {" true)
                                wr.indent(1)
                                wr.out("set obj." + pvar.name + " item (unwrap v) " , true)
                                wr.indent(-1)
                              wr.out("}" true)
                          }
                          case "double" {
                              wr.out("def v (getDouble theObj" + pvar.name + " item)" , true)
                              wr.out("if(!null? v) {" true)
                                wr.indent(1)
                                wr.out("set obj." + pvar.name + " item (unwrap v) " , true)
                                wr.indent(-1)
                              wr.out("}" true)
                          }
                          case "boolean" {
                              wr.out("def v (getBoolean theObj" + pvar.name + " item)" , true)
                              wr.out("if(!null? v) {" true)
                                wr.indent(1)
                                wr.out("set obj." + pvar.name + " item (unwrap v) " , true)
                                wr.indent(-1)
                              wr.out("}" true)
                          }
                        }
                    }
                    wr.indent(-1)
                wr.out("})" true)          
                wr.indent(-1)
                wr.out("}" true)
                
            }    
            return
        }
        switch nn.type_name {
            case "string" {
                wr.out("def v (getStr dict \"" + pvar.name +  "\")" , true)
                wr.out("if(!null? v) {" true)
                wr.indent(1)
                wr.out("obj." + pvar.name + " = (unwrap v) " , true)
                wr.indent(-1)
                wr.out("}" true)
            }
            case "int" {
                wr.out("def v (getInt dict \"" + pvar.name +  "\")" , true)
                wr.out("if(!null? v) {" true)
                wr.indent(1)
                wr.out("obj." + pvar.name + " = (unwrap v) " , true)
                wr.indent(-1)
                wr.out("}" true)
            }
            case "double" {
                wr.out("def v (getDouble dict \"" + pvar.name +  "\")" , true)
                wr.out("if(!null? v) {" true)
                wr.indent(1)
                wr.out("obj." + pvar.name + " = (unwrap v) " , true)
                wr.indent(-1)
                wr.out("}" true)
            }
            case "boolean" {
                wr.out("def v (getBoolean dict \"" + pvar.name +  "\")" , true)
                wr.out("if(!null? v) {" true)
                wr.indent(1)
                wr.out("obj." + pvar.name + " = (unwrap v) " , true)
                wr.indent(-1)
                wr.out("}" true)
            }
        }

        if( ctx.isDefinedClass(nn.type_name) ) {
            ; wr.out("try {" true)
            ; wr.indent(1)
            wr.out("def theValue (getObject dict \"" + pvar.name +  "\") " , true)
            wr.out("if(!null? theValue) {" true)
            wr.indent(1)
            wr.out("def newObj@(lives) (" + nn.type_name + ".fromDictionary((unwrap theValue)))" , true)
            wr.out("obj." + pvar.name + " = newObj " , true)
            wr.indent(-1)
            wr.out("}" true)
            ; wr.indent(-1)
            ; wr.out("} {" true)                      
            ; wr.out("}" true)
        } {
        }


        if(nn.value_type == RangerNodeType.Enum) {
                wr.out("def v (getInt dict \"" + pvar.name +  "\")" , true)
                wr.out("if(!null? v) {" true)
                wr.indent(1)
                wr.out("obj." + pvar.name + " = (unwrap v) " , true)
                wr.indent(-1)
                wr.out("}" true)
        }
      
    }

    ; class extension...
    fn createJSONSerializerFn2:void (cl:RangerAppClassDesc ctx:RangerAppWriterContext wr:CodeWriter) {


        def use_exceptions ( (ctx.getTargetLang()) != "swift3")        

        def declaredVariable:[string:boolean]        
        wr.out("extension " + cl.name + " {" , true)
        wr.indent(1)
        wr.out("static fn fromDictionary@(strong):" + cl.name + " (dict:JSONDataObject) {" , true)
        wr.indent(1)
            wr.out("def obj:" + cl.name +" (new " + cl.name + "())" , true)
            if use_exceptions {
                wr.out("try {" true)
                wr.indent(1)
            }
            for cl.variables pvar:RangerAppParamDesc i {
                if( has declaredVariable pvar.name ) {
                    continue
                }
                def nn:CodeNode (unwrap pvar.nameNode)
                this.createWRReader2( pvar nn ctx wr)            
            }        
            if use_exceptions {
                wr.indent(-1)
                wr.out("} {" true)
                wr.out("}" true)
            }
            wr.out( "return obj" true)
        wr.indent(-1)
        wr.out("}" true)
        wr.newline()
        wr.out("fn toDictionary:JSONDataObject () {" true)
        wr.indent(1)
        wr.out("def res:JSONDataObject (json_object)" true)

        ; def is_golang ("go" == (ctx.getCompilerSetting("l")))

        if use_exceptions {
            wr.out("try {" true)
            wr.indent(1)
        }
        ; TODO: extended class serialization...
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
            if(nn.hasFlag("optional")) {
                wr.out("; optional variable" true)
                wr.out("if (!null? this." + pvar.compiledName + ") {",  true)
                    wr.indent(1)
                    this.createWRWriter2( pvar nn ctx wr)            
                    wr.indent(-1)
                wr.out("}" true)
                continue
            }
            wr.out("; not extended " true)
            this.createWRWriter2( pvar nn ctx wr)            
        }        
        if use_exceptions {
            wr.indent(-1)
            wr.out("} {" true)
                wr.indent(1)
                wr.out("" true)
                wr.indent(-1)
            wr.out("}" true)
        }

        wr.out("return res" true)
        wr.indent(-1)
        wr.out("}" true)
        wr.indent(-1)
        wr.out("}" true)
    }


}