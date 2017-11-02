
class RangerAppOperatorDesc {

  Extends (RangerAppParamDesc)
  def name:string ""
  def ref_cnt:int 0
  def node@(weak):CodeNode
  def nameNode@(weak):CodeNode
  def fnBody@(weak):CodeNode
  def op_params@(weak):[CodeNode]
  def firstArg:CodeNode

  fn isOperator:boolean () {
    return true
  }  
  fn isProperty:boolean () {
    return false
  }  
}

