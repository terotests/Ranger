

operator type:RangerAppWriterContext all {

  fn addUsage:void (cn:CodeNode) {
    def ctx self
    def currM ( ctx.getCurrentMethod())
    if(ctx.isDefinedClass(cn.type_name)) {
      def cl (ctx.findClass(cn.type_name))
      currM.addClassUsage(cl ctx)
    }
    if(ctx.isDefinedClass(cn.eval_type_name)) {
      def cl (ctx.findClass(cn.eval_type_name))
      currM.addClassUsage(cl ctx)
    }
    if(ctx.isDefinedClass(cn.eval_array_type)) {
      def cl (ctx.findClass(cn.eval_array_type))
      currM.addClassUsage(cl ctx)
    }
  }

  fn getTargetLang:string () {
    if( has self.targetLangName ) {
        return self.targetLangName
    }
    if(self.parent) {
      return (getTargetLang (unwrap self.parent))
    }
    return "ranger"
  }

  fn addPluginOp( name:string ) {
    def root (self.getRoot())
    set self.pluginSpecificOperators name true
  }

  fn create_var:RangerAppParamDesc ( name:string type_name:string ) {
      def fieldNode@(lives) (r.vref name type_name)
      fieldNode.value_type = (fieldNode.typeNameAsType(self))
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = name
      p.value_type = fieldNode.value_type
      p.node = fieldNode
      p.nameNode = fieldNode
      p.is_optional = false
      self.defineVariable(p.name p)
      return p
  }
  
  fn create_var:RangerAppParamDesc ( name:string usingNode:CodeNode ) {
      def fieldNode (r.vref name)
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = name
      p.value_type = usingNode.value_type
      p.node = usingNode
      p.nameNode = usingNode
      p.is_optional = false
      self.defineVariable(p.name p)
      return p
  }

  fn create_register:RangerAppParamDesc ( name:string usingNode:CodeNode ) {
      def fieldNode (r.vref name)
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = name
      p.value_type = usingNode.value_type
      p.node = usingNode
      p.nameNode = usingNode
      p.is_optional = false
      self.defineVariable(p.name p)
      return p
  }

  
}
