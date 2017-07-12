
class RangerAppMethodVariants {
  def name:string ""
  def variants@(weak):[RangerAppFunctionDesc]
}
class RangerAppInterfaceImpl {
  def name:string ""
  def typeParams:CodeNode
}
class RangerAppClassDesc {
  Extends (RangerAppParamDesc)
  def name:string ""
  def is_system:boolean false
  def compiledName:string ""
  def systemNames:[string:string]
  def systemInfo:CodeNode
  def is_interface:boolean false
  def is_system_union:boolean false
  def is_template:boolean false
  def is_serialized:boolean false
  def is_trait:boolean false
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
      if (this.isSameOrParentClass(i_name ctx)) {
        return true
      }
      if (ctx.isDefinedClass(i_name)) {
        def c:RangerAppClassDesc (ctx.findClass(i_name))
        if (c.isSameOrParentClass(class_name ctx)) {
          return true
        }      
      } {
        print "did not find union class " + i_name
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
    for methods m:RangerAppFunctionDesc i {
      if (m.name == f_name) {
        res = m
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
  fn addVariable:void (desc@(strong):RangerAppParamDesc) {
    push variables desc
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
  }
}

