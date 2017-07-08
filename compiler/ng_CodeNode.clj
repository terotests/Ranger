Import "ng_RangerAppEnums.clj"

class SourceCode {
    def code:string ""
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
    fn getColumnStr:string (sp:int) {
        def cnt:int 0
        def last:int 0
        for lines str:string i {
            cnt = (+ cnt (+ (strlen str) 1)))
            if (> cnt sp) {
              def ll:int (sp - last)
              def ss:string ""
              while (ll > 0) {
                ss = ss + " "
                ll = ll - 1
              }
              return ss
            } 
            last = cnt
        }
        return ""
    } 
    fn getColumn:int (sp:int) {
        def cnt:int 0
        def last:int 0
        for lines str:string i {
            cnt = (+ cnt (+ (strlen str) 1)))
            if (> cnt sp) {
              return (sp - last)
            } 
            last = cnt
        }
        return -1
    } 
}


class CodeNode {
  def code:SourceCode
  def sp:int 0
  def ep:int 0
  def has_operator:boolean false
  def disabled_node:boolean false
  def op_index:int 0
  def is_system_class:boolean false
  def mutable_def:boolean false
  def expression:boolean false
  def vref:string ""
  def is_block_node:boolean false
  def infix_operator:boolean false
  def infix_node:CodeNode
  def infix_subnode:boolean false
  def has_lambda:boolean false
  def has_lambda_call:boolean false
  def operator_pred:int 0
  def to_the_right:boolean false
  def right_node:CodeNode
  def type_type:string ""
  def type_name:string ""
  def key_type:string ""
  def array_type:string ""
  def ns:[string]
  def has_vref_annotation:boolean false
  def vref_annotation:CodeNode
  def has_type_annotation:boolean false
  def type_annotation:CodeNode
  def parsed_type:RangerNodeType RangerNodeType.NoType
  def value_type:RangerNodeType RangerNodeType.NoType
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

  Constructor (source:SourceCode start:int end:int) {
    sp = start
    ep = end
    code = source
  }

  fn getParsedString:string () {
    return (substring code.code sp ep)
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
  fn getColStartString:string () {
    return (code.getColumnStr(sp))
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
  fn isParsedAsPrimitive:boolean () {
    if ((parsed_type == RangerNodeType.Double) || (parsed_type == RangerNodeType.String) || (parsed_type == RangerNodeType.Integer) || (parsed_type == RangerNodeType.Char) || (parsed_type == RangerNodeType.CharBuffer) || (parsed_type == RangerNodeType.Boolean)) {
      return true
    }
    return false
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
    if( false == (has props name) ) {
      return false
    }
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
