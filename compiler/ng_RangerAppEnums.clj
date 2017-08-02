
Enum RangerAnnType:int (
  None
  Expression
  Type
  VRef
)

Enum RangerWrap:int (
  None
  Optional
  Unwrap
)

Enum RangerVForce:int (
  None
  Weak
  Strong
)

Enum RangerNodeType:int (
  NoType
  InvalidType
  Double
  Integer
  String
  Boolean
  Array
  Hash
  ImmutableArray
  ImmutableHash
  Object
  VRef
  Comment
  Enum
  Char
  CharBuffer
  Expression
  ExpressionType
  Lambda
  XMLNode
  XMLText
  XMLAttr
  XMLCDATA
  Dictionary
  Any
  Class
  GenericClass
  ClassRef
  Method
  ClassVar
  Function
  Literal
  Quasiliteral
  Null
)

Enum RangerNodeRefType:int (
  NoType
  Weak
  Strong
  Shared
  StrongImmutable
)

Enum RangerContextVarType (
  NoType
  This
  ThisProperty
  NewObject
  FunctionParameter
  LocalVariable
  Array
  Object
  Property
  Class
  Function
)

