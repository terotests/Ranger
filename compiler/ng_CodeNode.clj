

class SourceCode {
    def code:string ""
    def sp:int 0 
    def ep:int 0
    def lines:[string]
    def filename:string ""

    Constructor (code_str:string ) {
        code = code_str
        lines = (strsplit code_str "\n")
    }

    fn getLineString:string (line_index:int) {

        if (> (array_length lines) line_index) {
            return (itemAt lines line_index)
        }
        return ""
    }
                
    fn getLine:int (sp:int) {
        def cnt:int 0
        for lines str:string i {
            cnt = (+ cnt (+ (strlen str) 1)))
            if (> cnt sp) {
              return i
            } 
        }
        return -1
    } 

}


class CodeNode {
  def code:SourceCode
  def sp:int 0
  def ep:int 0
  def has_operator:boolean false
  def op_index:int 0
  def is_system_class:boolean false
  def mutable_def:boolean false
  def expression:boolean false
  def vref:string ""
  def is_block_node:boolean false
  def infix_operator:boolean false
  def infix_node:CodeNode
  def infix_subnode:boolean false
  def operator_pred:int 0
  def to_the_right:boolean false
  def right_node:CodeNode
  def type_type:string ""
  def type_name:string ""
  def key_type:string ""
  def array_type:string ""
  def ns:[string]
  def nsp@(weak):[RangerAppParamDesc]
  def has_vref_annotation:boolean false
  def vref_annotation:CodeNode
  def has_type_annotation:boolean false
  def type_annotation:CodeNode
  def typeClass@(weak):RangerTypeClass
  def value_type:RangerNodeType RangerNodeType.NoType
  def eval_type:RangerNodeType RangerNodeType.NoType
  def eval_type_name:string ""
  def eval_key_type:string ""
  def eval_array_type:string ""
  def flow_done:boolean false
  def ref_change_done:boolean false
  def eval_type_node:CodeNode
  def ref_type:RangerNodeRefType RangerNodeRefType.NoType
  def ref_need_assign:int 0
  def double_value:double 0.0
  def string_value:string ""
  def int_value:int 0
  def boolean_value:boolean false
  def expression_value:CodeNode
  def props:[string:CodeNode]
  def prop_keys:[string]
  def comments:[CodeNode]
  def children:[CodeNode]
  def parent@(weak):CodeNode
  def didReturnAtIndex:int -1
  def hasVarDef:boolean false
  def hasClassDescription:boolean false
  def hasNewOper:boolean false
  def clDesc:RangerAppClassDesc
  def hasFnCall:boolean false
  def fnDesc:RangerAppFunctionDesc
  def hasParamDesc:boolean false
  def paramDesc@(weak optional):RangerAppParamDesc
  def ownParamDesc@(optional):RangerAppParamDesc
  def evalCtx:RangerAppWriterContext

  Constructor (source:SourceCode start:int end:int) {
    sp = start
    ep = end
    code = source
  }

  fn getParsedString:string () {
    return (substring code.code sp ep)
  }

  fn rebuildWithType:CodeNode (match:RangerArgMatch changeVref:boolean) {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    newNode.has_operator = has_operator
    newNode.op_index = op_index
    newNode.mutable_def = mutable_def
    newNode.expression = expression
    if changeVref {
      newNode.vref = (match.getTypeName(vref))
    } {
      newNode.vref = vref
    }
    newNode.is_block_node = is_block_node
    newNode.type_type = (match.getTypeName(type_type))
    newNode.type_name = (match.getTypeName(type_name))
    newNode.key_type = (match.getTypeName(key_type))
    newNode.array_type = (match.getTypeName(array_type))
    newNode.value_type = value_type
    if has_vref_annotation {
      newNode.has_vref_annotation = true
      def ann:CodeNode vref_annotation
      newNode.vref_annotation = (ann.rebuildWithType(match true))
    }
    if has_type_annotation {
      newNode.has_type_annotation = true
      def t_ann:CodeNode type_annotation
      newNode.type_annotation = (t_ann.rebuildWithType(match true))
    }
    for ns n:string i {
      push newNode.ns n
    }
    switch value_type {
      case RangerNodeType.Double {
        newNode.double_value = double_value
      }
      case RangerNodeType.String {
        newNode.string_value = string_value
      }
      case RangerNodeType.Integer {
        newNode.int_value = int_value
      }
      case RangerNodeType.Boolean {
        newNode.boolean_value = boolean_value
      }
      case RangerNodeType.ExpressionType {
        if (!null? expression_value) {
          newNode.expression_value = (expression_value.rebuildWithType(match changeVref))
        }
      }
    }
    for prop_keys key:string i {
      push newNode.prop_keys key
      def oldp:CodeNode (get props key)
      def np:CodeNode (oldp.rebuildWithType(match changeVref))
      set newNode.props key np
    }
    for children ch:CodeNode i {
      def newCh:CodeNode (ch.rebuildWithType(match changeVref))
      newCh.parent = newNode
      push newNode.children newCh
    }
    return newNode
  }
  fn buildTypeSignatureUsingMatch:string (match:RangerArgMatch) {
    def tName:string (match.getTypeName(type_name))
    switch tName {
      case "double" {
        return "double"
      }
      case "string" {
        return "string"
      }
      case "integer" {
        return "int"
      }
      case "boolean" {
        return "boolean"
      }
    }
    def s:string ""
    if (value_type == RangerNodeType.Array) {
      s = (s + "[")
      s = (s + (match.getTypeName(array_type)))
      s = (s + (this.getTypeSignatureWithMatch(match)))
      s = (s + "]")
      return s
    }
    if (value_type == RangerNodeType.Hash) {
      s = (s + "[")
      s = (s + (match.getTypeName(key_type)))
      s = (s + ":")
      s = (s + (match.getTypeName(array_type)))
      s = (s + (this.getTypeSignatureWithMatch(match)))
      s = (s + "]")
      return s
    }
    s = (match.getTypeName(type_name))
    s = (s + (this.getVRefSignatureWithMatch(match)))
    return s
  }
  fn buildTypeSignature:string () {
    switch value_type {
      case RangerNodeType.Double {
        return "double"
      }
      case RangerNodeType.String {
        return "string"
      }
      case RangerNodeType.Integer {
        return "int"
      }
      case RangerNodeType.Boolean {
        return "boolean"
      }
      case RangerNodeType.Char {
        return "char"
      }
      case RangerNodeType.CharBuffer {
        return "charbuffer"
      }
    }
    def s:string ""
    if (value_type == RangerNodeType.Array) {
      s = (s + "[")
      s = (s + array_type)
      s = (s + (this.getTypeSignature()))
      s = (s + "]")
      return s
    }
    if (value_type == RangerNodeType.Hash) {
      s = (s + "[")
      s = (s + key_type)
      s = (s + ":")
      s = (s + array_type)
      s = (s + (this.getTypeSignature()))
      s = (s + "]")
      return s
    }
    s = type_name
    s = (s + (this.getVRefSignature()))
    return s
  }

  fn getVRefSignatureWithMatch:string (match:RangerArgMatch) {
    if has_vref_annotation {
      def nn:CodeNode (vref_annotation.rebuildWithType(match true))
      return ("@" + (nn.getCode()))
    } 
    return ""
  }
  fn getVRefSignature:string () {
    if has_vref_annotation {
      return ("@" + (vref_annotation.getCode()))
    } 
    return ""
  }
  fn getTypeSignatureWithMatch:string (match:RangerArgMatch) {
    if has_type_annotation {
      def nn:CodeNode (type_annotation.rebuildWithType(match true))
      return ("@" + (nn.getCode()))
    } 
    return ""
  }
  fn getTypeSignature:string () {
    if has_type_annotation {
      return ("@" + (type_annotation.getCode()))
    } 
    return ""
  }
  fn getFilename:string () {
    return code.filename
  }
  fn getFlag@(optional weak):CodeNode (flagName:string) {

    def res:CodeNode
    if (false == has_vref_annotation) {
      return res 
    }
    for vref_annotation.children ch:CodeNode i {
      if (ch.vref == flagName) {
        res = ch
        return res
      }
    }
    return res
  }
  fn hasFlag:boolean (flagName:string) {
    if (false == has_vref_annotation) {
      return false
    }
    for vref_annotation.children ch:CodeNode i {
      if (ch.vref == flagName) {
        return true
      }
    }
    return false
  }
  fn setFlag:void (flagName:string) {
    if (false == has_vref_annotation) {
      vref_annotation = (new CodeNode ((unwrap code) sp ep))
    }
    if (this.hasFlag(flagName)) {
      return
    }
    def flag:CodeNode (new CodeNode ((unwrap code) sp ep))
    flag.vref = flagName
    flag.value_type = RangerNodeType.VRef
    push vref_annotation.children flag
    has_vref_annotation = true
  }
  fn getTypeInformationString:string () {
    def s:string ""
    if ((strlen vref) > 0) {
      s = (s + "<vref:" + vref + ">")
    } {
      s = (s + "<no.vref>")
    }
    if ((strlen type_name) > 0) {
      s = (s + "<type_name:" + type_name + ">")
    } {
      s = (s + "<no.type_name>")
    }
    if ((strlen array_type) > 0) {
      s = (s + "<array_type:" + array_type + ">")
    } {
      s = (s + "<no.array_type>")
    }
    if ((strlen key_type) > 0) {
      s = (s + "<key_type:" + key_type + ">")
    } {
      s = (s + "<no.key_type>")
    }
    switch value_type {
      case RangerNodeType.Boolean {
        s = (s + "<value_type=Boolean>")
      }
      case RangerNodeType.String {
        s = (s + "<value_type=String>")
      }
    }
    return s
  }
  fn getLine:int () {
    return (code.getLine(sp))
  }
  fn getLineString:string (line_index:int) {
    return (code.getLineString(line_index))
  }
  fn getLineAsString:string () {
    def idx:int (this.getLine())
    def line_name_idx:int (idx + 1)
    return ((this.getFilename()) + ", line " + line_name_idx + " : " + (code.getLineString(idx)))
  }
  fn getPositionalString:string () {
    if ((ep > sp) && ((ep - sp) < 50)) {
      def start:int sp
      def end:int ep
      start = (start - 100)
      end = (end + 50)
      if (start < 0) {
        start = 0
      }
      if (end >= (strlen code.code)) {
        end = ((strlen code.code) - 1)
      }
      return (substring code.code start end)
    }
    return ""
  }
  fn copyEvalResFrom:void (node:CodeNode) {
    if node.hasParamDesc {
      hasParamDesc = node.hasParamDesc
      paramDesc = node.paramDesc
    }
    if (!null? node.typeClass) {
      typeClass = node.typeClass
    }
    eval_type = node.eval_type
    eval_type_name = node.eval_type_name
    if (node.hasFlag("optional")) {
      this.setFlag("optional")
    }
    if (node.value_type == RangerNodeType.Hash) {
      eval_key_type = node.eval_key_type
      eval_array_type = node.eval_array_type
      eval_type = RangerNodeType.Hash
    }
    if (node.value_type == RangerNodeType.Array) {
      eval_key_type = node.eval_key_type
      eval_array_type = node.eval_array_type
      eval_type = RangerNodeType.Array
    }
  }
  fn defineNodeTypeTo:void (node:CodeNode ctx:RangerAppWriterContext) {
    switch type_name {
      case "double" {
        node.value_type = RangerNodeType.Double
        node.eval_type = RangerNodeType.Double
        node.eval_type_name = "double"
      }
      case "int" {
        node.value_type = RangerNodeType.Integer
        node.eval_type = RangerNodeType.Integer
        node.eval_type_name = "int"
      }
      case "char" {
        node.value_type = RangerNodeType.Char
        node.eval_type = RangerNodeType.Char
        node.eval_type_name = "char"
      }
      case "charbuffer" {
        node.value_type = RangerNodeType.CharBuffer
        node.eval_type = RangerNodeType.CharBuffer
        node.eval_type_name = "charbuffer"
      }
      case "string" {
        node.value_type = RangerNodeType.String
        node.eval_type = RangerNodeType.String
        node.eval_type_name = "string"
      }
      case "boolean" {
        node.value_type = RangerNodeType.Boolean
        node.eval_type = RangerNodeType.Boolean
        node.eval_type_name = "string"
      }

      default {
        if (true == expression) {
          node.value_type = RangerNodeType.ExpressionType
          node.eval_type = RangerNodeType.ExpressionType
          node.expression = true
        }
        if (value_type == RangerNodeType.Array) {
          node.value_type = RangerNodeType.Array
          node.eval_type = RangerNodeType.Array
          node.eval_type_name = type_name
          node.eval_array_type = array_type
        }
        if (value_type == RangerNodeType.Hash) {
          node.value_type = RangerNodeType.Hash
          node.eval_type = RangerNodeType.Hash
          node.eval_type_name = type_name
          node.eval_array_type = array_type
          node.key_type = key_type
        }
        if (value_type == RangerNodeType.Enum) {
          node.value_type = RangerNodeType.Enum
          node.eval_type = RangerNodeType.Enum
          node.eval_type_name = type_name
        }
        if (value_type == RangerNodeType.VRef) {
          if (ctx.isEnumDefined(type_name)) {
            node.value_type = RangerNodeType.Enum
            node.eval_type = RangerNodeType.Enum
            node.eval_type_name = type_name
          }
          if (ctx.isDefinedClass(type_name)) {
            node.value_type = RangerNodeType.Object
            node.eval_type = RangerNodeType.Object
            node.eval_type_name = type_name
          }
        }
      }
    }
  }
  fn typeNameAsType:RangerNodeType (ctx:RangerAppWriterContext) {
    switch type_name {
      case "double" {
        return RangerNodeType.Double
      }
      case "int" {
        return RangerNodeType.Integer
      }
      case "string" {
        return RangerNodeType.String
      }   
      case "boolean" {
        return RangerNodeType.Boolean
      }         
      case "char" {
        return RangerNodeType.Char
      }
      case "charbuffer" {
        return RangerNodeType.CharBuffer
      }
      
      default {
          if (== true expression) {
              (return RangerNodeType.ExpressionType)
          }
           
          if (== value_type RangerNodeType.VRef) {
              if(ctx.isEnumDefined(type_name)) {
                  return RangerNodeType.Enum
              }
              if(ctx.isDefinedClass(type_name)) {
                  return RangerNodeType.Object
              }
          }
          return value_type
      }
    }
    return value_type
  }
  fn isPrimitive:boolean () {
    if ((value_type == RangerNodeType.Double) || (value_type == RangerNodeType.String) || (value_type == RangerNodeType.Integer) || (value_type == RangerNodeType.Char) || (value_type == RangerNodeType.CharBuffer) || (value_type == RangerNodeType.Boolean)) {
      return true
    }
    return false
  }
  fn isPrimitiveType:boolean () {
    def tn:string type_name
    if ((tn == "double") || (tn == "string") || (tn == "int") || (tn == "char") || (tn == "charbuffer") || (tn == "boolean")) {
      return true
    }
    return false
  }
  fn isAPrimitiveType:boolean () {
    def tn:string type_name
    if ((value_type == RangerNodeType.Array) || (value_type == RangerNodeType.Hash)) {
      tn = array_type
    }
    if ((tn == "double") || (tn == "string") || (tn == "int") || (tn == "char") || (tn == "charbuffer") || (tn == "boolean")) {
      return true
    }
    return false
  }
  fn getFirst:CodeNode () {
    return (itemAt children 0)
  }
  fn getSecond:CodeNode () {
    return (itemAt children 1)
  }
  fn getThird:CodeNode () {
    return (itemAt children 2)
  }
  fn isSecondExpr:boolean () {
    if ((array_length children) > 1) {
      def second:CodeNode (itemAt children 1)
      if second.expression {
        return true
      }
    }
    return false
  }
  fn getOperator:string () {
    def s:string ""
    if ((array_length children) > 0) {
      def fc:CodeNode (itemAt children 0)
      if (fc.value_type == RangerNodeType.VRef) {
        return fc.vref
      }
    }
    return s
  }
  fn getVRefAt:string (idx:int) {
    def s:string ""
    if ((array_length children) > idx) {
      def fc:CodeNode (itemAt children idx)
      return fc.vref
    }
    return s
  }
  fn getStringAt:string (idx:int) {
    def s:string ""
    if ((array_length children) > idx) {
      def fc:CodeNode (itemAt children idx)
      if (fc.value_type == RangerNodeType.String) {
        return fc.string_value
      }
    }
    return s
  }
  fn hasExpressionProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      return ann.expression
    }
    return false
  }
  fn getExpressionProperty@(weak optional):CodeNode (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      return ann
    }
    return ann
  }
  fn hasIntProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      def fc:CodeNode (itemAt ann.children 0)
      if (fc.value_type == RangerNodeType.Integer) {
        return true
      }
    }
    return false
  }
  fn getIntProperty:int (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      def fc:CodeNode (itemAt ann.children 0)
      if (fc.value_type == RangerNodeType.Integer) {
        return fc.int_value
      }
    }
    return 0
  }
  fn hasDoubleProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.Double) {
        return true
      }
    }
    return false
  }
  fn getDoubleProperty:double (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.Double) {
        return ann.double_value
      }
    }
    return 0.0
  }
  fn hasStringProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.String) {
        return true
      }
    }
    return false
  }
  fn getStringProperty:string (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.String) {
        return ann.string_value
      }
    }
    return ""
  }
  fn hasBooleanProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.Boolean) {
        return true
      }
    }
    return false
  }
  fn getBooleanProperty:boolean (name:string) {
    def ann:CodeNode (get props name)
    if (!null? ann) {
      if (ann.value_type == RangerNodeType.Boolean) {
        return ann.boolean_value
      }
    }
    return false
  }
  fn isFirstTypeVref:boolean (vrefName:string) {
    if ((array_length children) > 0) {
      def fc:CodeNode (itemAt children 0)
      if (fc.value_type == RangerNodeType.VRef) {
        return true
      }
    }
    return false
  }
  fn isFirstVref:boolean (vrefName:string) {
    if ((array_length children) > 0) {
      def fc:CodeNode (itemAt children 0)
      if (fc.vref == vrefName) {
        return true
      }
    }
    return false
  }
  fn getString:string () {
    return (substring code.code sp ep)
  }
  fn writeCode:void (wr:CodeWriter) {
    switch value_type {
      case RangerNodeType.Double {
        wr.out((double2str double_value) false)
      }
      case RangerNodeType.String {
        wr.out(((strfromcode 34) + string_value + (strfromcode 34)) false)
      }
      case RangerNodeType.Integer {
        wr.out( "" + int_value , false)       
      }         
      case RangerNodeType.Boolean {
        if(boolean_value) {
          wr.out("true" false)
        } {
          wr.out("false" false)
        }        
      }      
    }
  }
  fn getCode:string () {
    def wr:CodeWriter (new CodeWriter ())
    this.writeCode(wr)
    return (wr.getCode())
    switch value_type {
      case RangerNodeType.Double {
        return (double2str double_value)
      }
      case RangerNodeType.String {
        return ((strfromcode 34) + string_value + (strfromcode 34))
      }
    }
    if ((array_length children) > 0) {
      def res:string "( "
      for children item:CodeNode i {
        res = (res + " ")
        res = (res + (item.getCode()))
        res = (res + " ")
      }
      res = (res + " ) ")
      return res
    }
    return ""
  }
  fn walk:void () {
    switch value_type {
      case RangerNodeType.Double {
        print ("Double : " + double_value)
      }
      case RangerNodeType.String {
        print ("String : " + string_value)
      }
    }
    if expression {
      print "("
    } {
      print (substring code.code sp ep)
    }
    for children item:CodeNode i {
      item.walk()
    }
    if expression {
      print ")"
    }
  }
}


class AfterCodeNode {
  def ff:int 0
}