
class RangerAppFunctionDesc {
  Extends (RangerAppParamDesc)
  def name:string ""
  def ref_cnt:int 0
  def node@(weak):CodeNode
  def nameNode@(weak):CodeNode
  def fnBody:CodeNode
  def params:[RangerAppParamDesc]
  def return_value:RangerAppParamDesc
  def is_method:boolean false
  def is_static:boolean false
  def container_class:RangerAppClassDesc
  def refType:RangerNodeRefType RangerNodeRefType.NoType
  def fnCtx:RangerAppWriterContext
  fn isClass:boolean () {
    return false
  }
  fn isProperty:boolean () {
    return false
  }  
}

