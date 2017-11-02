
class RangerAppMethodVariants {
  def name:string ""
  def variants@(weak):[RangerAppFunctionDesc]
}
class RangerAppInterfaceImpl {
  def name:string ""
  def typeParams:CodeNode
}
class RangerTraitParams {
  def param_names:[string]
  def values:[string:string]
}
class RangerAppClassDesc {
  Extends (RangerAppParamDesc)
  def name:string ""
  def is_system:boolean false
  def compiledName:string ""
  def systemNames:[string:string]
  def systemInfo:CodeNode
  
  ; --- following could be compined into a enum -type
  def is_interface:boolean false
  def is_system_union:boolean false
  def is_template:boolean false
  def is_serialized:boolean false
  def is_trait:boolean false
  def is_operator_class false
  def is_generic_instance false
  def is_union false

  
  def generic_params:CodeNode
  def ctx@(weak):RangerAppWriterContext
  def variables:[RangerAppParamDesc]
  def capturedLocals@(weak):[RangerAppParamDesc]
  def methods:[RangerAppFunctionDesc]
  def defined_methods:[string:boolean]
  def static_methods:[RangerAppFunctionDesc]
  def defined_static_methods:[string:boolean]
  def defined_variants:[string]
  def method_variants:[string:RangerAppMethodVariants]
  def has_constructor:boolean false
  def constructor_node@(weak):CodeNode
  def constructor_fn:RangerAppFunctionDesc
  def has_destructor:boolean false
  def destructor_node:CodeNode
  def destructor_fn:RangerAppFunctionDesc
  def extends_classes:[string]
  def implements_interfaces:[string]
  def consumes_traits:[string]
  def trait_params:[string:RangerTraitParams]
  def is_union_of:[string]
  def nameNode@(weak):CodeNode
  def classNode@(weak):CodeNode
  def contr_writers:[CodeWriter]
  def is_inherited:boolean false

  fn isClass:boolean () {
    return true
  }
  fn isProperty:boolean () {
    return false
  }
  fn doesInherit:boolean () {
    return is_inherited
  }    
  fn isNormalClass:boolean () {
    def special ( is_operator_class || is_trait || is_system || is_generic_instance || is_system_union || is_union )
    return (special == false)
  }
  fn hasTrait@(optional weak):RangerAppClassDesc (class_name:string ctx@(weak):RangerAppWriterContext) {
    def res@(optional):RangerAppClassDesc
    for consumes_traits c_name:string i {
      def c:RangerAppClassDesc (ctx.findClass(c_name))
      if( c_name == class_name) {
        res = c
        return res
      }
    }
    return res
  }

  doc isSameOrParentClass "
Tests if the `class name` is either
- same class than the tested class
- belongs to the same union
- is either parent or child class of this class
- implements same trait (interface) than this class
  "
  fn isSameOrParentClass:boolean (class_name:string ctx@(weak):RangerAppWriterContext) {

    if(ctx.isPrimitiveType(class_name)) {
      if ((indexOf is_union_of class_name) >= 0) {
        return true
      }    
      return false      
    }

    if (class_name == name) {
      return true
    }
    if ((indexOf extends_classes class_name) >= 0) {
      return true
    }
    if ((indexOf consumes_traits class_name) >= 0) {
      return true
    }
    if ((indexOf implements_interfaces class_name) >= 0) {
      return true
    }    
    if ((indexOf is_union_of class_name) >= 0) {
      return true
    }    
    for extends_classes c_name:string i {
      def c:RangerAppClassDesc (ctx.findClass(c_name))
      if (c.isSameOrParentClass(class_name ctx)) {
        return true
      }
    }
    for consumes_traits c_name:string i {
      def c:RangerAppClassDesc (ctx.findClass(c_name))
      if (c.isSameOrParentClass(class_name ctx)) {
        return true
      }
    }
    for implements_interfaces i_name:string i {
      def c:RangerAppClassDesc (ctx.findClass(i_name))
      if (c.isSameOrParentClass(class_name ctx)) {
        return true
      }      
    }
    for is_union_of i_name:string i {
      ;def c:RangerAppClassDesc (ctx.findClass(i_name))
      ;if (c.isSameOrParentClass(class_name ctx)) {
      ;  return true
      ;}
      if (ctx.isDefinedClass(i_name)) {
        def c:RangerAppClassDesc (ctx.findClass(i_name))
        if (c.isSameOrParentClass(class_name ctx)) {
          return true
        }      
      } {
        ; print "did not find union class " + i_name
      }
    }    
    return false
  }
  fn hasOwnMethod:boolean (m_name:string) {
    if (has defined_methods m_name) {
      return true
    }
    return false
  }  
  fn hasMethod:boolean (m_name:string) {
    if (has defined_methods m_name) {
      return true
    }
    for extends_classes cname:string i {
      def cDesc:RangerAppClassDesc (ctx.findClass(cname))
      if (cDesc.hasMethod(m_name)) {
        return (cDesc.hasMethod(m_name))
      }
    }
    return false
  }
  fn findMethod@(optional weak):RangerAppFunctionDesc (f_name:string) {
    def res@(weak lives):RangerAppFunctionDesc    
    def vNames (keys method_variants)
    for vNames name:string i {
      if(name == f_name) {
        def list (unwrap (get method_variants name))
        res = (itemAt list.variants 0)
        return res
      }
    }
    for extends_classes cname:string i {
      def cDesc:RangerAppClassDesc (ctx.findClass(cname))
      if (cDesc.hasMethod(f_name)) {
        return (cDesc.findMethod(f_name))
      }
    }
    return res
  }
  fn hasStaticMethod:boolean (m_name:string) {
    return (has defined_static_methods m_name)
  }
  fn findStaticMethod@(weak optional):RangerAppFunctionDesc (f_name:string) {
    def e@(weak lives):RangerAppFunctionDesc
    for static_methods m:RangerAppFunctionDesc i {
      if (m.name == f_name) {
        e = m
        return e
      }
    }
    for extends_classes cname:string i {
      def cDesc:RangerAppClassDesc (ctx.findClass(cname))
      if (cDesc.hasStaticMethod(f_name)) {
        return (cDesc.findStaticMethod(f_name))
      }
    }
    return e
  }
  
  fn findVariable@(optional weak):RangerAppParamDesc (f_name:string) {

    def e:RangerAppParamDesc
    for variables m:RangerAppParamDesc i {
      if (m.name == f_name) {
        e = m
        return e
      }
    }
    for extends_classes cname:string i {
      def cDesc:RangerAppClassDesc (ctx.findClass(cname))
      return (cDesc.findVariable(f_name))
    }
    return e
  }
  fn addParentClass:void (p_name:string) {
    push extends_classes p_name
  }

  fn createVariable ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {

    try {

      def parser (ctx.getParser())
      def s:string (node.getVRefAt(1))
      def vDef@(lives):CodeNode (itemAt node.children 1)
      def p@(temp):RangerAppParamDesc (new RangerAppParamDesc ())

      if(vDef.has_type_annotation) {
        parser.CheckTypeAnnotationOf( vDef ctx wr )
      }
      if( s != ((ctx.transformWord(s)))) {
        ; ctx.addError( node "Can not use reserved word " + s + " as class propery")
      }
      def currC this

      ; immutable classes have only weak properties
      if currC.is_immutable {
        vDef.setFlag("weak")
        if( vDef.value_type == RangerNodeType.Array) {
          def initNode (node.newExpressionNode())
          initNode.push( (node.newVRefNode("new")) )
          def tDef (node.newVRefNode("Vector"))
          
          ; Vector@(string)
          def vAnn (node.newExpressionNode())
          vAnn.push( (node.newVRefNode(vDef.array_type)))
          tDef.has_vref_annotation = true
          tDef.vref_annotation = vAnn
          initNode.push(tDef)

          set node.children 2 (initNode)

          vDef.value_type = RangerNodeType.VRef
          vDef.type_name = "Vector"
          ; def obj:Vector@(string)
          def tAnn (node.newExpressionNode())
          tAnn.push( (node.newVRefNode(vDef.array_type)))
          vDef.has_type_annotation = true
          vDef.type_annotation = tAnn

          parser.CheckTypeAnnotationOf( vDef ctx wr )
          parser.CheckVRefTypeAnnotationOf( tDef ctx wr )
          
        }
        if( vDef.value_type == RangerNodeType.Hash) {
          def initNode (node.newExpressionNode())
          initNode.push( (node.newVRefNode("new")) )
          def tDef (node.newVRefNode("Map"))
          
          ; Vector@(string)
          def vAnn (node.newExpressionNode())
          vAnn.push( (node.newVRefNode(vDef.key_type)))
          vAnn.push( (node.newVRefNode(vDef.array_type)))
          tDef.has_vref_annotation = true
          tDef.vref_annotation = vAnn
          initNode.push(tDef)
          set node.children 2 (initNode)

          vDef.value_type = RangerNodeType.VRef
          vDef.type_name = "Map"
          ; def obj:Vector@(string)
          def tAnn (node.newExpressionNode())
          tAnn.push( (node.newVRefNode(vDef.key_type)))
          tAnn.push( (node.newVRefNode(vDef.array_type)))
          vDef.has_type_annotation = true
          vDef.type_annotation = tAnn

          parser.CheckTypeAnnotationOf( vDef ctx wr )
          parser.CheckVRefTypeAnnotationOf( tDef ctx wr )

        }
      }      

      ; transforming reserved words here 
      p.name = s
      p.value_type = vDef.value_type
      p.node = node
      p.is_class_variable = true
      p.varType = RangerContextVarType.Property
      p.node = node
      p.nameNode = vDef
      vDef.hasParamDesc = true
      vDef.ownParamDesc = p
      vDef.paramDesc = p
      node.hasParamDesc = true
      node.paramDesc = p

      if (vDef.hasFlag("weak")) {
          p.changeStrength(0 2 (unwrap p.nameNode))
      } {
          p.changeStrength(2 2 (unwrap p.nameNode))
      }    

      if ((array_length node.children) > 2) {
        p.set_cnt = 1
        p.init_cnt = 1
        p.def_value = (itemAt node.children 2)
        p.is_optional = false
        if(p.def_value.value_type == RangerNodeType.String) {
          vDef.type_name = "string"
        }
        if(p.def_value.value_type == RangerNodeType.Integer) {
          vDef.type_name = "int"
        }
        if(p.def_value.value_type == RangerNodeType.Double) {
          vDef.type_name = "double"
        }
        if(p.def_value.value_type == RangerNodeType.Boolean) {
          vDef.type_name = "boolean"
        }
        def valueNode (itemAt node.children 2)
        if( (array_length valueNode.children) > 0) {
          def fc (valueNode.getFirst())
          if(fc.vref == "new") {
            def second (valueNode.getSecond())
            parser.CheckVRefTypeAnnotationOf( second ctx wr )
          }
        }
      } {
        p.is_optional = true
        if (false == ((vDef.value_type == RangerNodeType.Array) || (vDef.value_type == RangerNodeType.Hash))) {         
          vDef.setFlag("optional")
        }
      }
      currC.addVariable(p)
      def subCtx:RangerAppWriterContext currC.ctx
      subCtx.defineVariable(p.name p)
      p.is_class_variable = true
;      print "^^^^ added variable " + p.name + " to class " + currC.name
    } {
      ctx.addError( node ('Could not add variable into class ' + this.name) )
    }
  }

  fn addVariable:void (desc@(strong):RangerAppParamDesc) {
    push variables desc
    desc.propertyClass = this
  }
  fn addMethod:void (desc@(strong):RangerAppFunctionDesc) {
    set defined_methods desc.name true
    push methods desc

    def defVs:RangerAppMethodVariants (get method_variants desc.name)
    if (null? defVs) {
      def new_v:RangerAppMethodVariants (new RangerAppMethodVariants ())
      set method_variants desc.name new_v
      push defined_variants desc.name
      push new_v.variants desc
    } {
      def new_v2:RangerAppMethodVariants (unwrap defVs)
      push new_v2.variants desc
    }
  
  }
  fn addStaticMethod:void (desc@(strong):RangerAppFunctionDesc) {
    set defined_static_methods desc.name true
    push static_methods desc

    if(desc.name == "main") {
      def nn (desc.nameNode)
      if(nn.has_vref_annotation == false) {
        def vAnn (node.newExpressionNode())
        nn.has_vref_annotation = true
        nn.vref_annotation = vAnn
      } 
      push nn.vref_annotation.children  (nn.vref_annotation.newVRefNode("main"))

    }
  }
}

