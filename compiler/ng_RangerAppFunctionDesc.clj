
operator type:void all {
  fn r.funcdesc:RangerAppFunctionDesc ( node:CodeNode ctx:RangerAppWriterContext ) {
    def m@(lives temp):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
    def cn:CodeNode (node.getSecond())
    m.name = cn.vref
    m.compiledName = (ctx.transformWord(cn.vref))
    m.node = node
    m.nameNode = (itemAt node.children 1)
    if (node.hasBooleanProperty("strong")) {
      m.refType = RangerNodeRefType.Strong
    } {
      m.refType = RangerNodeRefType.Weak
    }
    return m    
  }
}
class RangerAppFunctionDesc {
  Extends (RangerAppParamDesc)
  def name:string ""
  def ref_cnt:int 0
  def node@(weak):CodeNode
  def nameNode@(weak):CodeNode
  def fnBody@(weak):CodeNode
  def params:[RangerAppParamDesc]
  def return_value:RangerAppParamDesc
  def is_method:boolean false
  def is_static:boolean false
  def is_lambda false
  def is_unsed false
  def is_called_from_main false
  def container_class:RangerAppClassDesc
  def refType:RangerNodeRefType RangerNodeRefType.NoType
  def fnCtx:RangerAppWriterContext

  def insideFn@(weak):RangerAppFunctionDesc
  def call_graph_done false
  def isCalling@(weak):[RangerAppFunctionDesc]
  def isCalledBy@(weak):[RangerAppFunctionDesc]
  def isUsingClasses@(weak):[RangerAppClassDesc]

  def myLambdas@(weak):[RangerAppFunctionDesc]

  fn addCallTo( m@(weak):RangerAppFunctionDesc) {
    if( (indexOf m.isCalledBy this) < 0 ) {
      push m.isCalledBy this
      push isCalling m
    }
  }

  fn addClassUsage( m@(weak):RangerAppClassDesc  ctx:RangerAppWriterContext ) {
    if( (indexOf this.isUsingClasses m) < 0 ) {
      push this.isUsingClasses m
      m.variables.forEach({
        def nn item.nameNode
        if( ctx.isDefinedClass( nn.type_name )) {
          def cc (ctx.findClass(nn.type_name))
          this.addClassUsage( cc ctx )
        }
        if( ctx.isDefinedClass( nn.array_type )) {
          def cc (ctx.findClass(nn.array_type))
          this.addClassUsage( cc ctx )
        }
      })
      
    }
  }
  

  fn forOtherVersions ( ctx:RangerAppWriterContext cb:(_:void (item:RangerAppFunctionDesc))) {
    if(null? this.container_class) {
      return
    }
    def f this
    def cc (unwrap f.container_class)
    cc.extends_classes.forEach({
      def otherClass (ctx.findClass(item))
      if(otherClass.hasMethod(f.name)) {
        def m (otherClass.findMethod(f.name))
        cb( m )
      }
    })
    def root (ctx.getRoot())
    root.definedClasses.forEach({
      if( (indexOf item.extends_classes f.container_class.name) >= 0 ) {
        if(item.hasMethod(f.name)) {
          def m (item.findMethod(f.name))
          cb( m )                
        }
      }
    })
  }

  fn isFunction:boolean () {
    return true
  }  
  fn isClass:boolean () {
    return false
  }
  fn isProperty:boolean () {
    return false
  }  
}

