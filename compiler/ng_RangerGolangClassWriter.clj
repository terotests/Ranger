class RangerGolangClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "this"
  def write_raw_type:boolean false
  def did_write_nullable:boolean false
 
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out((node.getParsedString()) false)
      }
      case RangerNodeType.String {
        def s:string (this.EncodeString(node ctx wr))
        wr.out((("\"" + s) + "\"") false)
      }
      case RangerNodeType.Integer {
        wr.out(("" + node.int_value) false)
      }
      case RangerNodeType.Boolean {
        if node.boolean_value {
          wr.out("true" false)
        } {
          wr.out("false" false)
        }
      }
    }
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    if (type_string == "this") {
      return thisName
    }

    if(ctx.isDefinedClass(type_string)) {
      def cc:RangerAppClassDesc (ctx.findClass(type_string))
      if(cc.doesInherit()) {
        return "IFACE_" + (ctx.transformTypeName(type_string))
      }
    }
    
    switch type_string {
      case "int" {
        return "int64"
      }
      case "string" {
        return "string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "float64"
      }
      case "char" {
        return "byte"
      }
      case "charbuffer" {
        return "[]byte"
      }
    }
    return (ctx.transformTypeName(type_string))
  }
  fn getTypeString2:string (type_string:string ctx:RangerAppWriterContext) {
    if (type_string == "this") {
      return thisName
    }
    switch type_string {
      case "int" {
        return "int64"
      }
      case "string" {
        return "string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "float64"
      }
      case "char" {
        return "byte"
      }
      case "charbuffer" {
        return "[]byte"
      }
    }
    return (ctx.transformTypeName(type_string))
  }
  fn writeRawTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    write_raw_type = true
    this.writeTypeDef(node ctx wr)
    write_raw_type = false
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.writeTypeDef2(node ctx wr)
  }

  fn writeArrayTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
    def v_type:RangerNodeType node.value_type    
    def a_name:string node.array_type

    if ((v_type == RangerNodeType.Object) || (v_type == RangerNodeType.VRef) || (v_type == RangerNodeType.NoType)) {
      v_type = (node.typeNameAsType(ctx))
    }
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
      if ( (strlen node.eval_array_type) > 0 ) {
        a_name = node.eval_array_type
      }
    }

    switch v_type {

      case RangerNodeType.Hash {
        if(ctx.isDefinedClass(a_name)) {
          def cc:RangerAppClassDesc (ctx.findClass(a_name))
          if(cc.doesInherit()) {
            wr.out("IFACE_" + (this.getTypeString2(a_name ctx)) , false)
            return
          }
        }                    
        if ( (ctx.isPrimitiveType(a_name)) == false) {
          wr.out("*" false)
        }
        wr.out(((this.getObjectTypeString(a_name ctx)) + "") , false)
      }
      
      case RangerNodeType.Array {

        if(ctx.isDefinedClass(a_name)) {
          def cc:RangerAppClassDesc (ctx.findClass(a_name))
          if(cc.doesInherit()) {
            wr.out("IFACE_" + (this.getTypeString2(a_name ctx)) , false)
            return
          }
        }
        if ((write_raw_type == false) && ((ctx.isPrimitiveType(a_name)) == false)) {
          wr.out("*" false)
        }
        wr.out(((this.getObjectTypeString(a_name ctx)) + "") false)
      }
      default {

      }
    }
  }  


  fn writeTypeDef2:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
    def v_type:RangerNodeType node.value_type    
    def t_name:string node.type_name
    def a_name:string node.array_type
    def k_name:string node.key_type

  
    if ((v_type == RangerNodeType.Object) || (v_type == RangerNodeType.VRef) || (v_type == RangerNodeType.NoType)) {
      v_type = (node.typeNameAsType(ctx))
    }
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
      if ( (strlen node.eval_type_name) > 0 ) {
        t_name = node.eval_type_name
      }
      if ( (strlen node.eval_array_type) > 0 ) {
        a_name = node.eval_array_type
      }
      if ( (strlen node.eval_key_type) > 0 ) {
        k_name = node.eval_key_type
      }
    }

    switch v_type {
      case RangerNodeType.ExpressionType {
        ; f func(string) string

        def rv:CodeNode (itemAt node.expression_value.children 0)
        def sec:CodeNode (itemAt node.expression_value.children 1)
        def fc:CodeNode (sec.getFirst())
        wr.out("func(" false)
        this.writeTypeDef2( fc ctx wr)
        wr.out( ") " false)
        this.writeTypeDef2( rv ctx wr)
        ; wr.out( rv.type_name false)
      }
      case RangerNodeType.Enum {
        wr.out("int64" false)
      }
      case RangerNodeType.Integer {
        wr.out("int64" false)
      }
      case RangerNodeType.Double {
        wr.out("float64" false)
      }
      case RangerNodeType.String {
        wr.out("string" false)
      }
      case RangerNodeType.Boolean {
        wr.out("bool" false)
      }
      case RangerNodeType.Char {
        wr.out("byte" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("[]byte" false)
      }
      case RangerNodeType.Hash {
        if write_raw_type {
          wr.out( ( (this.getObjectTypeString(a_name ctx) ) + "") , false)
        } {
          wr.out((("map[" + (this.getObjectTypeString(k_name ctx))) + "]") , false)

          if(ctx.isDefinedClass(a_name)) {
            def cc:RangerAppClassDesc (ctx.findClass(a_name))
            if(cc.doesInherit()) {
              wr.out("IFACE_" + (this.getTypeString2(a_name ctx)) , false)
              return
            }
          }
                    
          if ((write_raw_type == false) && ((ctx.isPrimitiveType(a_name)) == false)) {
            wr.out("*" false)
          }
          wr.out(((this.getObjectTypeString(a_name ctx)) + "") , false)
        }
      }
      case RangerNodeType.Array {
        if (false == write_raw_type) {
          wr.out("[]" false)
        }

        if(ctx.isDefinedClass(a_name)) {
          def cc:RangerAppClassDesc (ctx.findClass(a_name))
          if(cc.doesInherit()) {
            wr.out("IFACE_" + (this.getTypeString2(a_name ctx)) , false)
            return
          }
        }

        if ((write_raw_type == false) && ((ctx.isPrimitiveType(a_name)) == false)) {
          wr.out("*" false)
        }
        wr.out(((this.getObjectTypeString(a_name ctx)) + "") false)
      }
      default {
        if (node.type_name == "void") {
          (wr.out("()" false))
          return
        }

        if(ctx.isDefinedClass(t_name)) {
          def cc:RangerAppClassDesc (ctx.findClass(t_name))
          if(cc.doesInherit()) {
            wr.out("IFACE_" + (this.getTypeString2(t_name ctx)) , false)
            return
          }
        }

        if ((write_raw_type == false) && ((node.isPrimitiveType()) == false)) {
          (wr.out("*" false))
        }        

        wr.out((this.getTypeString2(t_name ctx)) false))
      }
    }
  }

  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "this") {
      wr.out(thisName false)
      return
    }
    if (node.eval_type == RangerNodeType.Enum) {
      if( (array_length node.ns) > 1) {
        def rootObjName:string (itemAt node.ns 0)
        def enumName:string (itemAt node.ns 1)
        def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
        if (!null? e) {
          wr.out(("" + (unwrap (get e.values enumName) ) ) false)
          return
        }
      }
    }

    def next_is_gs:boolean false
    def last_was_setter:boolean false
    def needs_par:boolean false    
    def ns_last:int ( (array_length node.ns) - 1)

    if ((array_length node.nsp) > 0) {
      def had_static:boolean false
     
      for node.nsp p:RangerAppParamDesc i {
 
        if next_is_gs {

          if(p.isProperty()) {
            wr.out(".Get_" false)
            needs_par = true
          } {
            needs_par = false
          }
          next_is_gs = false
        }         

        if (needs_par == false) {
          if (i > 0) {
            if had_static {
              wr.out("_static_" false)
            } {
              wr.out("." false)
            }
          }
        }

        if(ctx.isDefinedClass(p.nameNode.type_name)) {
          def c:RangerAppClassDesc (ctx.findClass(p.nameNode.type_name))
          if(c.doesInherit()) {
            next_is_gs = true
          }
        }        
        if (i == 0) {
          def part:string (itemAt node.ns 0)

          if(part == "this") {
            wr.out(thisName false)
            continue
          } 

          if ((part != thisName) && (ctx.isMemberVariable(part))) {
            def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap cc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            
            if (!null? up) {
              def p3:RangerAppParamDesc (unwrap up)
              wr.out((thisName + ".") false)
            }
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType(p.compiledName)) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType(p.name)) false)
          } {
            wr.out((this.adjustType( (itemAt node.ns i))) false)
          }
        }

        if needs_par {
          wr.out("()" false)
          needs_par = false
        }        

        if ( (p.nameNode.hasFlag("optional")) && ( i != ns_last)) {
          wr.out(".value.(" false)
          this.writeTypeDef( (unwrap p.nameNode ) ctx wr)
          wr.out(")" false)
        }

        if (p.isClass()) {
          had_static = true
        }

      }
      return
    }
    if node.hasParamDesc {
      def part:string (itemAt node.ns 0)
      if ((part != thisName) && (ctx.isMemberVariable(part))) {
          def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap cc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          
          if (!null? up) {
            def p3:RangerAppParamDesc (unwrap up)
            wr.out((thisName + ".") false)
          }
      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }
    def b_was_static:boolean false
    for node.ns part:string i {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("_static_" false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {

        if(part == "this") {
          wr.out(thisName false)
          continue
        }        

        if (ctx.hasClass(part)) {
          b_was_static = true
        }
        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap cc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          
          if (!null? up) {
            def p3:RangerAppParamDesc (unwrap up)
            wr.out((thisName + ".") false)
          }
        }
      }
      wr.out((this.adjustType(part)) false)
    }
  }


  fn WriteSetterVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "this") {
      wr.out(thisName false)
      return
    }
    if (node.eval_type == RangerNodeType.Enum) {
      def rootObjName:string (itemAt node.ns 0)
      def enumName:string (itemAt node.ns 1)
      def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
      if (!null? e) {
        wr.out(("" + (unwrap (get e.values enumName) ) ) false)
        return
      }
    }

    def next_is_gs:boolean false
    def last_was_setter:boolean false
    def needs_par:boolean false    

    def ns_len:int ((array_length node.ns) - 1)

    if ((array_length node.nsp) > 0) {
      def had_static:boolean false
     
      for node.nsp p:RangerAppParamDesc i {

        if next_is_gs {
          if(p.isProperty()) {
            wr.out(".Get_" false)
            needs_par = true
          } {
            needs_par = false
          }
          next_is_gs = false
        }         

        if (needs_par == false) {
          if (i > 0) {
            if had_static {
              wr.out("_static_" false)
            } {
              wr.out("." false)
            }
          }
        }

        if(ctx.isDefinedClass(p.nameNode.type_name)) {
          def c:RangerAppClassDesc (ctx.findClass(p.nameNode.type_name))
          if(c.doesInherit()) {
            next_is_gs = true
          }
        }        
        if (i == 0) {
          def part:string (itemAt node.ns 0)

          if(part == "this") {
            wr.out(thisName false)
            continue
          } 

          if ((part != thisName) && (ctx.isMemberVariable(part))) {
            def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap cc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            
            if (!null? up) {
              def p3:RangerAppParamDesc (unwrap up)
              wr.out((thisName + ".") false)
            }
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType(p.compiledName)) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType(p.name)) false)
          } {
            wr.out((this.adjustType( (itemAt node.ns i))) false)
          }
        }

        if needs_par {
          wr.out("()" false)
          needs_par = false
        }        

        ; i == 0
        if (i < (ns_len )) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out(".value.(" false)
            this.writeTypeDef( ( unwrap p.nameNode )ctx wr)
            wr.out(")" false)
          }
        }
        
        if (p.isClass()) {
          had_static = true
        }

      } 
      return
    }
    if node.hasParamDesc {
      def part:string (itemAt node.ns 0)
      if ((part != thisName) && (ctx.isMemberVariable(part))) {
        def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def currC:RangerAppClassDesc (unwrap cc)
        def up@(optional):RangerAppParamDesc (currC.findVariable(part))
        
        if (!null? up) {
          def p3:RangerAppParamDesc (unwrap up)
          wr.out((thisName + ".") false)
        }
      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false) 
      return
    }
    def b_was_static:boolean false
    for node.ns part:string i {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("_static_" false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {

        if(part == "this") {
          wr.out(thisName false)
          continue
        }        

        if (ctx.hasClass(part)) {
          b_was_static = true
        }
        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap cc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          
          if (!null? up) {
            def p3:RangerAppParamDesc (unwrap up)
            wr.out((thisName + ".") false)
          }
        }
      }
      wr.out((this.adjustType(part)) false)
    }
  }


  fn goExtractAssign:void ( value:CodeNode p:RangerAppParamDesc ctx:RangerAppWriterContext wr:CodeWriter) {

    def arr_node@(lives):CodeNode (itemAt value.children 1)  

    wr.newline()
    wr.out("" true)
    wr.out("// array_extract operator " true)
    wr.out("var " false)
    
    def pArr@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
    pArr.name = "_arrTemp"
    pArr.node = arr_node
    pArr.nameNode = arr_node
    pArr.is_optional = false
    ctx.defineVariable(p.name pArr)

    wr.out(pArr.compiledName false)
    wr.out(" " false)
    this.writeTypeDef(arr_node ctx wr)
    wr.newline()
    
    wr.out((p.compiledName + " , " + pArr.compiledName + " = ") false)

    ctx.setInExpr()
    this.WalkNode(value ctx wr)
    ctx.unsetInExpr()
    wr.out(";" true)

    def left:CodeNode arr_node

    def len:int ( (array_length left.ns) - 1)
    def last_part:string (itemAt left.ns len)

    def next_is_gs:boolean false
    def last_was_setter:boolean false
    def needs_par:boolean false
    def b_was_static:boolean false

    for left.ns part:string i {

      if next_is_gs {
        if( i == len) {
          wr.out(".Set_" false)
          last_was_setter = true      
        } {
          wr.out(".Get_" false)
          needs_par = true
          next_is_gs = false
          last_was_setter = false
        }
      }
      
      if( last_was_setter == false && needs_par == false) {
        if (i > 0) {
          if ((i == 1) && b_was_static) {
            wr.out("_static_" false)
          } {
            wr.out("." false)
          }
        }
      }

      if (i == 0) {

        if(part == "this") {
          wr.out(thisName false)
          continue
        }        

        if (ctx.hasClass(part)) {
          b_was_static = true
        }

        def partDef:RangerAppParamDesc (ctx.getVariableDef(part))
        if(!null? partDef.nameNode) {
          if(ctx.isDefinedClass(partDef.nameNode.type_name)) {
            def c:RangerAppClassDesc (ctx.findClass(partDef.nameNode.type_name))
            if(c.doesInherit()) {
              next_is_gs = true
            }
          }
        }

        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap cc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          
          if (!null? up) {
            def p3:RangerAppParamDesc (unwrap up)
            wr.out((thisName + ".") false)
          }
        }
      }

      if( (array_length left.nsp ) > 0) {
        def p:RangerAppParamDesc (itemAt left.nsp i)
        wr.out((this.adjustType(p.compiledName)) false)    
      } {
        if(left.hasParamDesc) {
          wr.out(left.paramDesc.compiledName false)
        } {
          wr.out((this.adjustType(part)) false)
        }
      }

      if needs_par {
        wr.out("()" false)
        needs_par = false        
      }

      if( (array_length left.nsp ) >= (i+1)) {
        def pp:RangerAppParamDesc (itemAt left.nsp i)
        if(pp.nameNode.hasFlag("optional")) {
          wr.out(".value.(" false)
          this.writeTypeDef( (unwrap pp.nameNode) ctx wr)
          wr.out(")" false)                
        }
      }      

    }
    if last_was_setter {
      wr.out( "(" false)
      wr.out( pArr.compiledName  false)
      wr.out("); "  true)
    } {
      wr.out(" = " false)
      wr.out( pArr.compiledName  false)
      wr.out("; " true)
    }

    wr.out("" true)
    

  }



  fn writeStructField:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      wr.out((p.compiledName + " ") false)
      if (p.nameNode.hasFlag("optional")) {
        wr.out("*GoNullable" false)
      } {
        this.writeTypeDef(( unwrap p.nameNode )ctx wr)
      }
      if (p.ref_cnt == 0) {
        wr.out(" /**  unused  **/ " false)
      }
      wr.out("" true)
      if (p.nameNode.hasFlag("optional")) {
      }
    }
  }
  fn writeVarDef:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      def b_not_used:boolean false
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out((("/** unused:  " + p.compiledName) + "*/") true)
        b_not_used = true
        return
      }
      def map_or_hash:boolean ((nn.value_type == RangerNodeType.Array) || (nn.value_type == RangerNodeType.Hash))
      if (nn.hasFlag("optional")) {
        wr.out((("var " + p.compiledName) + " *GoNullable = new(GoNullable); ") true)
        if ((array_length node.children) > 2) {
          def value:CodeNode (itemAt node.children 2)
          if value.hasParamDesc {
            def pnn:CodeNode value.paramDesc.nameNode
            if (pnn.hasFlag("optional")) {
              wr.out((p.compiledName + ".value = ") false)
              ctx.setInExpr()
              def value:CodeNode (node.getThird())
              this.WalkNode(value ctx wr)
              ctx.unsetInExpr()
              wr.out(".value;" true)
              wr.out((p.compiledName + ".has_value = ") false)
              ctx.setInExpr()
              def value:CodeNode (node.getThird())
              this.WalkNode(value ctx wr)
              ctx.unsetInExpr()
              wr.out(".has_value;" true)
              return
            } {
              wr.out((p.compiledName + ".value = ") false)
              ctx.setInExpr()
              def value:CodeNode (node.getThird())
              this.WalkNode(value ctx wr)
              ctx.unsetInExpr()
              wr.out(";" true)
              wr.out((p.compiledName + ".has_value = true;") true)
              return
            }
          } {
            wr.out((p.compiledName + " = ") false)
            ctx.setInExpr()
            def value:CodeNode (node.getThird())
            this.WalkNode(value ctx wr)
            ctx.unsetInExpr()
            wr.out(";" true)
            return
          }
        }
        return
      } {
        if (((p.set_cnt > 0) || p.is_class_variable) || map_or_hash) {
          wr.out((("var " + p.compiledName) + " ") false)
        } {
          wr.out((("var " + p.compiledName) + " ") false)
        }
      }
      
      this.writeTypeDef2(( unwrap p.nameNode )ctx wr)

      if ((array_length node.children) > 2) {
        def value:CodeNode (node.getThird())
        if (value.expression && ((array_length value.children) > 1)) {
          def fc:CodeNode (itemAt value.children 0)
          if (fc.vref == "array_extract") {
            ; special case to create assigment for array_extract in golang         
             
            this.goExtractAssign( value (unwrap p) ctx wr )
            return
          } 
        }
        wr.out(" = " false)
        ctx.setInExpr()
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = make(" false)
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
          wr.out(", 0)" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = make(" false)
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
          wr.out(")" false)
        }
      }
      wr.out(";" false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ " true)
      } {
        wr.newline()
      }
      if (b_not_used == false) {
        if (nn.hasFlag("optional")) {
          wr.addImport("errors")
        }
      }
    }
  }
  fn writeArgsDef:void  (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out((arg.name + " ") false)

      if (arg.nameNode.hasFlag("optional")) {
        wr.out("*GoNullable" false)
      } {
        this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
      }      
      
    }
  }

  fn writeNewCall:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out((("CreateNew_" + node.clDesc.name) + "(") false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc i {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(", " false)
          }
          if( true || (!null? arg.nameNode)) {
            this.WalkNode(n ctx wr)
          }
        }
      }
      wr.out(")" false)
    }
  }
  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    this.WriteVRef(fName ctx wr)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode( arg ctx wr)
    }
    wr.out(")" false)
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fnNode:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    ; def nameNode:CodeNode (itemAt fnNode.expression_value.children 0)
    wr.out("func (" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode(arg lambdaCtx wr)
      wr.out(" " false)
      if (arg.hasFlag("optional")) {
        wr.out("*GoNullable" false)
      } {
        this.writeTypeDef( arg lambdaCtx wr)
      }        
    }
    wr.out(") " false)
    
    if (fnNode.hasFlag("optional")) {
      wr.out("*GoNullable" false)
    } {
      this.writeTypeDef(fnNode lambdaCtx wr)
    }    

    wr.out(" {" true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" false)
  }  


  ;   current:
  ;   a.Get_friendList() = append(a.Get_friendList(),b);
  ;   goal:
  ;   a.Set_FriendList( append(a.Get_friendList(),b) )
  ;   push arr item
  

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref


    if(cmd == "=" || cmd == "push" || cmd == "removeLast") {

      def left:CodeNode (node.getSecond())
      def right:CodeNode left

      if(cmd == "=" || cmd == "push") {
        right = (node.getThird())
      }

      wr.newline()

      def b_was_static:boolean false

      if(left.hasParamDesc) {

        def len:int ( (array_length left.ns) - 1)
        def last_part:string (itemAt left.ns len)

        def next_is_gs:boolean false
        def last_was_setter:boolean false
        def needs_par:boolean false

        for left.ns part:string i {

          if next_is_gs {
            if( i == len) {
              wr.out(".Set_" false)
              last_was_setter = true      
            } {
              wr.out(".Get_" false)
              needs_par = true
              next_is_gs = false
              last_was_setter = false
            }
          }
          
          if( last_was_setter == false && needs_par == false) {
            if (i > 0) {
              if ((i == 1) && b_was_static) {
                wr.out("_static_" false)
              } {
                wr.out("." false)
              }
            }
          }

          if (i == 0) {

            if(part == "this") {
              wr.out(thisName false)
              continue
            }        

            if (ctx.hasClass(part)) {
              b_was_static = true
            }
            if ((part != "this") && (ctx.isMemberVariable(part))) {
              def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
              def currC:RangerAppClassDesc (unwrap cc)
              def up@(optional):RangerAppParamDesc (currC.findVariable(part))
              
              if (!null? up) {
                def p3:RangerAppParamDesc (unwrap up)
                wr.out((thisName + ".") false)
              }
            }
          }

          def partDef:RangerAppParamDesc (ctx.getVariableDef(part))
          if( (array_length left.nsp) > i ) {
            partDef = (itemAt left.nsp i)
          }
          
          if(!null? partDef.nameNode) {
            if(ctx.isDefinedClass(partDef.nameNode.type_name)) {
              def c:RangerAppClassDesc (ctx.findClass(partDef.nameNode.type_name))
              if(c.doesInherit()) {
                next_is_gs = true
              }
            }
          } 

          if( (array_length left.nsp ) > 0) {
            def p:RangerAppParamDesc (itemAt left.nsp i)
            wr.out((this.adjustType(p.compiledName)) false)    
          } {
            if(left.hasParamDesc) {
              wr.out(left.paramDesc.compiledName false)
            } {
              wr.out((this.adjustType(part)) false)
            }
          }

          if needs_par {
            wr.out("()" false)
            needs_par = false        
          }

          if( (array_length left.nsp ) >= (i+1)) {
            def pp:RangerAppParamDesc (itemAt left.nsp i)
            if(pp.nameNode.hasFlag("optional")) {
              wr.out(".value.(" false)
              this.writeTypeDef((unwrap pp.nameNode) ctx wr)
              wr.out(")" false)                
            }
          }          

        }

        ; go ( (e 1) "= " (e 1) "[:len(" (e 1)") - 1]")
        if( cmd == "removeLast") {
          if last_was_setter {
            wr.out("(" false)
            ctx.setInExpr()
            this.WalkNode(left ctx wr)
            wr.out("[:len(" false)
            this.WalkNode(left ctx wr)
            wr.out(")-1]" false)
            ctx.unsetInExpr()
            wr.out("); "  true)
          } {
            wr.out(" = " false)
            ctx.setInExpr()
            this.WalkNode(left ctx wr)
            wr.out("[:len(" false)
            this.WalkNode(left ctx wr)
            wr.out(")-1]" false)
            ctx.unsetInExpr()
            wr.out("; "  true)
          }
          return
        }
        

        if( cmd == "push") {
          if last_was_setter {
            wr.out("(" false)
            ctx.setInExpr()
            wr.out("append(" false)
            this.WalkNode(left ctx wr)
            wr.out("," false)
            this.WalkNode(right ctx wr)
            ctx.unsetInExpr()
            wr.out(")); "  true)
          } {
            wr.out(" = " false)
            wr.out("append(" false)
            ctx.setInExpr()
            this.WalkNode(left ctx wr)
            wr.out("," false)
            this.WalkNode(right ctx wr)
            ctx.unsetInExpr()
            wr.out("); "  true)
          }
          return
        }

        if last_was_setter {
          wr.out("(" false)
          ctx.setInExpr()
          this.WalkNode(right ctx wr)
          ctx.unsetInExpr()
          wr.out("); "  true)
        } {

          
          wr.out(" = " false)
          ctx.setInExpr()
          this.WalkNode(right ctx wr)
          ctx.unsetInExpr()
          wr.out("; " true)
        }

        return
        
      }

      this.WriteSetterVRef(left ctx wr)
      wr.out(" = " false)
      ctx.setInExpr()
      this.WalkNode(right ctx wr)
      ctx.unsetInExpr()
      wr.out("; /* custom */" true)
    }
  }
  
  fn writeClass:void  (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr
    if (did_write_nullable == false) {
      wr.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n" true)
      wr.createTag("utilities")
      did_write_nullable = true
    }
    
    def declaredVariable:[string:boolean]

    wr.out((("type " + cl.name) + " struct { ") true)
    wr.indent(1)

    for cl.variables pvar:RangerAppParamDesc i {
      this.writeStructField(( unwrap pvar.node ) ctx wr)
      set declaredVariable pvar.name true
    }

    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))
        wr.out("// inherited from parent class " + pName , true)
        for pC.variables pvar:RangerAppParamDesc i {
          if(has declaredVariable pvar.name) {
            continue
          }
          this.writeStructField(( unwrap pvar.node ) ctx wr)
        }
      }
    }


    wr.indent(-1)
    wr.out("}" true)


    wr.out((("type IFACE_" + cl.name) + " interface { ") true)
    wr.indent(1)
    for cl.variables p:RangerAppParamDesc i {

        wr.out("Get_" false)
        wr.out((p.compiledName + "() ") false)
        if (p.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap p.nameNode )ctx wr)
        }
        wr.out("" true)

        wr.out("Set_" false)
        wr.out(p.compiledName + "(value " , false )

        if (p.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap p.nameNode )ctx wr)
        }

        wr.out(") " true)       
    }

    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out( variant.name + "(" , false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") " false)
        if (variant.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
        }
        wr.out("" true)
      }
    }     
    wr.indent(-1)
    wr.out("}" true)    


    thisName = "me"
    wr.out("" true)
    wr.out((("func CreateNew_" + cl.name) + "(") false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      for constr.params arg:RangerAppParamDesc i  {
        if (i > 0) {
          wr.out(", " false)
        }
        wr.out((arg.name + " ") false)
        this.writeTypeDef((unwrap arg.nameNode) ctx wr)
      }
    }
    wr.out(((") *" + cl.name) + " {") true)
    wr.indent(1)
    wr.newline()
    wr.out((("me := new(" + cl.name) + ")") true)
    for cl.variables pvar:RangerAppParamDesc i {
      def nn:CodeNode ( unwrap pvar.node )
      if ((array_length nn.children) > 2) {
        def valueNode:CodeNode (itemAt nn.children 2)
        wr.out((("me." + pvar.compiledName) + " = ") false)
        this.WalkNode(valueNode ctx wr)
        wr.out("" true)
      } {
        def pNameN:CodeNode pvar.nameNode
        if (pNameN.value_type == RangerNodeType.Array) {
          wr.out((("me." + pvar.compiledName) + " = ") false)
          wr.out("make(" false)
          this.writeTypeDef((unwrap pvar.nameNode) ctx wr)
          wr.out(",0)" true)
        }
        if (pNameN.value_type == RangerNodeType.Hash) {
          wr.out((("me." + pvar.compiledName) + " = ") false)
          wr.out("make(" false)
          this.writeTypeDef((unwrap pvar.nameNode) ctx wr)
          wr.out(")" true)
        }
      }
    }
    for cl.variables pvar:RangerAppParamDesc i {
      if (pvar.nameNode.hasFlag("optional")) {
        wr.out((("me." + pvar.compiledName) + " = new(GoNullable);") true)
      }
    }

    ; and the same for all the parent class items...
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))

        for pC.variables pvar:RangerAppParamDesc i {
          def nn:CodeNode ( unwrap pvar.node )
          if ((array_length nn.children) > 2) {
            def valueNode:CodeNode (itemAt nn.children 2)
            wr.out((("me." + pvar.compiledName) + " = ") false)
            this.WalkNode(valueNode ctx wr)
            wr.out("" true)
          } {
            def pNameN:CodeNode (unwrap pvar.nameNode)
            if (pNameN.value_type == RangerNodeType.Array) {
              wr.out((("me." + pvar.compiledName) + " = ") false)
              wr.out("make(" false)
              this.writeTypeDef( (unwrap pvar.nameNode) ctx wr)
              wr.out(",0)" true)
            }
            if (pNameN.value_type == RangerNodeType.Hash) {
              wr.out((("me." + pvar.compiledName) + " = ") false)
              wr.out("make(" false)
              this.writeTypeDef((unwrap pvar.nameNode)  ctx wr)
              wr.out(")" true)
            }
          }
        }
        for pC.variables pvar:RangerAppParamDesc i {
          if (pvar.nameNode.hasFlag("optional")) {
            wr.out((("me." + pvar.compiledName) + " = new(GoNullable);") true)
          }
        }


        if pC.has_constructor {
          def constr:RangerAppFunctionDesc pC.constructor_fn
          def subCtx:RangerAppWriterContext ( unwrap constr.fnCtx )
          subCtx.is_function = true
          this.WalkNode(( unwrap constr.fnBody ) subCtx wr)
        }
      }
    }   

    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def subCtx:RangerAppWriterContext ( unwrap constr.fnCtx )
      subCtx.is_function = true
      this.WalkNode(( unwrap constr.fnBody ) subCtx wr)
    }

    wr.out("return me;" true)
    wr.indent(-1)
    wr.out("}" true)
    thisName = "this"
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (variant.nameNode.hasFlag("main")) {
        continue _
      }
      wr.newline()
      wr.out((((("func " + cl.name) + "_static_") + variant.name) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") " false)
      this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
      wr.out(" {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
      subCtx.is_function = true
      this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }


    def declaredFn:[string:boolean]

    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        set declaredFn variant.name true
        wr.out((((("func (this *" + cl.name) + ") ") + variant.name) + " (") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") " false)
        if (variant.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
        }
        wr.out(" {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }


    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))
        wr.out("// inherited methods from parent class " + pName , true)
        for pC.defined_variants fnVar:string i {
          def mVs:RangerAppMethodVariants (get pC.method_variants fnVar)
          for mVs.variants variant:RangerAppFunctionDesc i {

            if(has declaredFn variant.name) {
              ; print variant.name + "was declared already!"
              continue
            }

            wr.out((((("func (this *" + cl.name) + ") ") + variant.name) + " (") false)
            this.writeArgsDef(variant ctx wr)
            wr.out(") " false)
            if (variant.nameNode.hasFlag("optional")) {
              wr.out("*GoNullable" false)
            } {
              this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
            }
            wr.out(" {" true)
            wr.indent(1)
            wr.newline()
            def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
            subCtx.is_function = true
            this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
            wr.newline()
            wr.indent(-1)
            wr.out("}" true)
          }
        }
        
      }
    }


    def declaredGetter:[string:boolean]

    for cl.variables p:RangerAppParamDesc i {

        set declaredGetter p.name true

        wr.newline()
        wr.out("// getter for variable " + p.name , true)
        wr.out( "func (this *" + cl.name + ") " , false)
        wr.out("Get_" false)
        wr.out((p.compiledName + "() ") false)
        if (p.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap p.nameNode )ctx wr)
        }
        wr.out(" {" true)
          wr.indent(1)
          wr.out("return this." + p.compiledName , true)
          wr.indent(-1)
        wr.out("}" true)

        wr.newline()
        wr.out("// setter for variable " + p.name , true)
        wr.out( "func (this *" + cl.name + ") " , false)
        wr.out("Set_" false)
        wr.out(p.compiledName + "( value " , false)
        if (p.nameNode.hasFlag("optional")) {
          wr.out("*GoNullable" false)
        } {
          this.writeTypeDef(( unwrap p.nameNode )ctx wr)
        }        
        wr.out(") " false)

        wr.out(" {" true)
          wr.indent(1)
          wr.out("this." + p.compiledName +" = value " , true)
          wr.indent(-1)
        wr.out("}" true)     
    }    

    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))
        wr.out("// inherited getters and setters from the parent class " + pName , true)
        for pC.variables p:RangerAppParamDesc i {

          if( has declaredGetter p.name ) {
            continue
          }

          wr.newline()
          wr.out("// getter for variable " + p.name , true)
          wr.out( "func (this *" + cl.name + ") " , false)
          wr.out("Get_" false)
          wr.out((p.compiledName + "() ") false)
          if (p.nameNode.hasFlag("optional")) {
            wr.out("*GoNullable" false)
          } {
            this.writeTypeDef(( unwrap p.nameNode )ctx wr)
          }
          wr.out(" {" true)
            wr.indent(1)
            wr.out("return this." + p.compiledName , true)
            wr.indent(-1)
          wr.out("}" true)

          wr.newline()
          wr.out("// getter for variable " + p.name , true)
          wr.out( "func (this *" + cl.name + ") " , false)
          wr.out("Set_" false)
          wr.out(p.compiledName + "( value " , false)
          if (p.nameNode.hasFlag("optional")) {
            wr.out("*GoNullable" false)
          } {
            this.writeTypeDef(( unwrap p.nameNode )ctx wr)
          }        
          wr.out(") " false)

          wr.out(" {" true)
            wr.indent(1)
            wr.out("this." + p.compiledName +" = value " , true)
            wr.indent(-1)
          wr.out("}" true) 
        }
      }
    }

    for cl.static_methods variant:RangerAppFunctionDesc i {
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {
        wr.out("func main() {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
  }
}

