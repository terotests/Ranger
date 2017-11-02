
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
  def container_class:RangerAppClassDesc
  def refType:RangerNodeRefType RangerNodeRefType.NoType
  def fnCtx:RangerAppWriterContext

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

