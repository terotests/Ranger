
class RangerTypeClass {
  def name:string ""
  def compiledName:string ""
  def value_type:RangerNodeType RangerNodeType.NoType
  def type_name:string
  def key_type:string
  def array_type:string
  def is_primitive:boolean false
  def is_mutable:boolean false
  def is_optional:boolean false
  def is_generic:boolean false
  def is_lambda:boolean false
  def nameNode:CodeNode
  def templateParams:CodeNode
}

