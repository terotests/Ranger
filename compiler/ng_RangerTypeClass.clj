
; each node could have some kind of predetermined type, which can change during the evaluation of the code.
; there could be also 'literal' type

class RangerTypeClass {

  def name:string ""
  def compiledName:string ""
  def value_type:RangerNodeType RangerNodeType.NoType

  ; possible array type class, if any 
  def arrayType:RangerTypeClass
  ; possible key type, if any
  def keyType:RangerTypeClass

  def implements_traits:[RangerTypeClass]
  def implements_interfaces:[RangerTypeClass]
  def extends_classes:[RangerTypeClass]
  def belongs_to_union:[RangerTypeClass]

  def description:Any  ; class description etc.

  ; think: possible template class?

  ;  def type_name:string
  ;  def key_type:string
  ;  def array_type:string
  def is_empty false
  def is_primitive false
  def is_mutable false
  def is_optional false

  def is_union false
  def is_trait false
  def is_class false
  def is_system false
  def is_interface false

  def is_generic false
  def is_lambda false
  def nameNode:CodeNode
  def templateParams:CodeNode

}

