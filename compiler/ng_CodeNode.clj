Import "stdlib.clj"

; Import "Collection.clj"

; Import "TFactory.clj"
Import "TNodeFactory.clj"
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
        def last_col:int 0
        for lines str:string i {
            cnt = (+ cnt (+ (strlen str) 1)))
            if (> cnt sp) {
              def ll:int (sp - last_col)
              def ss:string ""
              while (ll > 0) {
                ss = ss + " "
                ll = ll - 1
              }
              return ss
            } 
            last_col = cnt
        }
        return ""
    } 
    fn getColumn:int (sp:int) {
        def cnt:int 0
        def last_col:int 0
        for lines str:string i {
            cnt = (+ cnt (+ (strlen str) 1)))
            if (> cnt sp) {
              return (sp - last_col)
            } 
            last_col = cnt
        }
        return -1
    } 
}


class CodeNodeLiteral @serialize(true) {
  def expression:boolean false
  def vref:string ""
  def is_block_node:boolean false
  def type_name:string ""
  def key_type:string ""
  def array_type:string ""
  def ns:[string]
  def has_vref_annotation:boolean false
  def vref_annotation:CodeNodeLiteral
  def has_type_annotation:boolean false
  def type_annotation:CodeNodeLiteral
  def parsed_type:RangerNodeType RangerNodeType.NoType
  def value_type:RangerNodeType RangerNodeType.NoType
  def double_value:double 0.0
  def string_value:string ""
  def int_value:int 0
  def boolean_value:boolean false
  def expression_value:CodeNodeLiteral
  def props:[string:CodeNodeLiteral]
  def prop_keys:[string]
  def comments:[CodeNodeLiteral]
  def children:[CodeNodeLiteral]
  def attrs:[CodeNodeLiteral]
}

operator type:void all {
  fn toLiteral:CodeNodeLiteral ( node:CodeNode ) {
    def nn (new CodeNodeLiteral)
    nn.expression = node.expression
    nn.vref = node.vref
    nn.is_block_node = node.is_block_node
    nn.type_name = node.type_name
    nn.key_type = node.key_type
    nn.array_type = node.array_type
    nn.ns = (clone node.ns)
    nn.has_vref_annotation = node.has_vref_annotation
    if(!null? node.vref_annotation) {
      nn.vref_annotation = (toLiteral (unwrap node.vref_annotation))
    }
    nn.has_type_annotation = node.has_type_annotation
    if(!null? node.type_annotation) {
      nn.type_annotation = (toLiteral (unwrap node.type_annotation))
    }
    nn.parsed_type = node.parsed_type
    nn.value_type = node.value_type
    nn.double_value = node.double_value
    nn.string_value = node.string_value
    nn.int_value = node.int_value
    nn.boolean_value = node.boolean_value
    if(!null? node.expression_value) {
      nn.expression_value = (toLiteral (unwrap node.expression_value))
    }
    forEach node.props {
      set nn.props index (toLiteral item)
    }
    nn.prop_keys = (clone node.prop_keys)
    forEach node.comments {
      push nn.comments (toLiteral item)
    }
    forEach node.children {
      push nn.children (toLiteral item)
    }
    forEach node.attrs {
      push nn.attrs (toLiteral item)
    }
    return nn
  }

  fn fromLiteral:CodeNode ( node:CodeNodeLiteral ) {
    def source (new SourceCode('<literal>'))
    def nn (new CodeNode(source 0 0))
    nn.expression = node.expression
    nn.vref = node.vref
    nn.is_block_node = node.is_block_node
    nn.type_name = node.type_name
    nn.key_type = node.key_type
    nn.array_type = node.array_type
    nn.ns = (clone node.ns)
    nn.has_vref_annotation = node.has_vref_annotation
    if(!null? node.vref_annotation) {
      nn.vref_annotation = (fromLiteral (unwrap node.vref_annotation))
    }
    nn.has_type_annotation = node.has_type_annotation
    if(!null? node.type_annotation) {
      nn.type_annotation = (fromLiteral (unwrap node.type_annotation))
    }
    nn.parsed_type = node.parsed_type
    nn.value_type = node.value_type
    nn.double_value = node.double_value
    nn.string_value = node.string_value
    nn.int_value = node.int_value
    nn.boolean_value = node.boolean_value
    if(!null? node.expression_value) {
      nn.expression_value = (fromLiteral (unwrap node.expression_value))
    }
    forEach node.props {
      set nn.props index (fromLiteral item)
    }
    nn.prop_keys = (clone node.prop_keys)
    forEach node.comments {
      push nn.comments (fromLiteral item)
    }
    forEach node.children {
      push nn.children (fromLiteral item)
    }
    forEach node.attrs {
      push nn.attrs (fromLiteral item)
    }
    return nn
  }

}

class CodeNode {
  def code:SourceCode
  def sp:int 0
  def ep:int 0
  def row 0
  def col 0
  def has_operator:boolean false
  def disabled_node:boolean false
  def op_index:int 0
  def is_array_literal false
  def is_system_class:boolean false
  def is_plugin false
  def is_direct_method_call false
  def mutable_def:boolean false
  def expression:boolean false
  def vref:string ""
  def is_block_node:boolean false
  def infix_operator:boolean false
  def infix_node:CodeNode
  def infix_subnode:boolean false
  def has_lambda:boolean false
  def has_lambda_call:boolean false
  def has_call false
;  def method_type:RangerMethodCallType RangerMethodCallType.NoType
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
  def attrs:[CodeNode]
  def appGUID:string ""

  ; register expressions are expressions that must be moved before this expression
  def register_name:string ""
  def register_expressions:[CodeNode]
  def after_expression:[CodeNode]

  Constructor (source:SourceCode start:int end:int) {
    sp = start
    ep = end
    code = source
  }

 fn childCnt:int () {
    return (array_length children)
  }

  fn getChild@(optional):CodeNode ( index:int ) {
    def res:CodeNode 
    if( (index >=0 ) && ((array_length children) > index ) ) {
      res = (itemAt children index)
    }
    return res
  }

  static fn vref1:CodeNode (name:string) {
    def code (new SourceCode( name 0 (strlen name)))
    def newNode@(lives):CodeNode (new CodeNode (code 0 (strlen name)))
    newNode.vref = name
    newNode.value_type = RangerNodeType.VRef
    newNode.parsed_type = RangerNodeType.VRef
    newNode.ns = (strsplit name ".")
    return newNode
  }

  static fn vref2:CodeNode (name:string typeName:string) {
    def code (new SourceCode( name 0 (strlen name)))
    def newNode@(lives):CodeNode (new CodeNode (code 0 (strlen name)))
    newNode.vref = name
    newNode.type_name = typeName
    newNode.value_type = RangerNodeType.VRef
    newNode.parsed_type = RangerNodeType.VRef
    newNode.ns = (strsplit name ".")
    return newNode
  }

  static fn newStr:CodeNode (name:string) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.string_value = name
    newNode.value_type = RangerNodeType.String
    newNode.parsed_type = RangerNodeType.String
    return newNode
  }

  static fn newBool:CodeNode (value:boolean) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.boolean_value = value
    newNode.value_type = RangerNodeType.Boolean
    newNode.parsed_type = RangerNodeType.Boolean
    return newNode
  }

  static fn newInt:CodeNode (value:int) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.int_value = value
    newNode.value_type = RangerNodeType.Integer
    newNode.parsed_type = RangerNodeType.Integer
    return newNode
  }

  static fn newDouble:CodeNode (value:double) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.double_value = value
    newNode.value_type = RangerNodeType.Double
    newNode.parsed_type = RangerNodeType.Double
    return newNode
  }

  static fn op:CodeNode ( opName:string ) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.expression = true
    def opNode (r.vref opName)
    push newNode.children opNode
    return newNode
  }

  static fn op2:CodeNode ( opName:string param1@(strong):CodeNode ) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.expression = true
    def opNode (r.vref opName)
    push newNode.children opNode
    push newNode.children param1
    return newNode
  }

  static fn op3:CodeNode ( opName:string list:[CodeNode] ) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.expression = true
    def opNode (r.vref opName)
    push newNode.children opNode
    for list item@(lives):CodeNode i {
      push newNode.children item
    }
    return newNode
  }

  static fn fromList:CodeNode ( list:[CodeNode] ) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.expression = true
    for list item@(lives):CodeNode i {
      push newNode.children item
      item.parent = newNode
    }
    return newNode
  }
  
  static fn expressionNode:CodeNode () {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.expression = true
    return newNode
  }
  
  static fn blockNode:CodeNode () {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.is_block_node = true
    newNode.expression = true
    return newNode
  }
  
  static fn blockFromList:CodeNode ( list:[CodeNode] ) {
    def code (new SourceCode( "" 0 0))
    def newNode@(lives):CodeNode (new CodeNode (code 0 0))
    newNode.is_block_node = true
    newNode.expression = true
    for list item@(lives):CodeNode i {
      push newNode.children item
      item.parent = newNode
    }
    return newNode
  }

  fn chlen:int () {
    return (array_length children)
  }

  fn forTree:void ( callback:( fn:void (item:CodeNode i:int)) ) {      
    for children ch:CodeNode i {
        callback(ch i)
        ch.forTree(callback)
    }
  }    

  fn parallelTree:void ( otherTree:CodeNode callback:( fn:void (left@(optional):CodeNode right@(optional):CodeNode i:int)) ) {   
    def left_cnt (size this.children)
    def right_cnt (size otherTree.children)

    def cnt (max left_cnt right_cnt)
    def i 0
    while ( i < cnt ) {
      def left@(optional):CodeNode
      def right@(optional):CodeNode
      if( i < left_cnt ) {
        left = (at this.children i)
      }
      if( i < right_cnt ) {
        right = (at otherTree.children i)
      }
      callback( left right i)
      if( (!null? left) && (!null? right)) {
        if(has left.children) {
          left.parallelTree( (unwrap right) callback)
        }
      }
      i = i + 1
    }
  }    
  

  fn walkTreeUntil:void ( callback:( fn:boolean (item:CodeNode i:int)) ) {      
    for children ch:CodeNode i {
        if( callback(ch i) ) {
          ch.walkTreeUntil( callback )
        }
    }
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
    flag.parsed_type = flag.value_type
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
  fn getSource:string () {
    if (ep > sp)  {
      def start:int sp
      def end:int ep
      return (substring code.code start end)
    }
    return ""
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

  fn isPrimitive:boolean () {
    switch value_type {
        case RangerNodeType.Double {
            return true
        }
        case RangerNodeType.String {
            return true
        }
        case RangerNodeType.Integer {
            return true
        }
        case RangerNodeType.Boolean {
            return true
        }
        case RangerNodeType.Char {
            return true
        }
        case RangerNodeType.CharBuffer {
            return true
        }
        case RangerNodeType.Enum {
            return true
        }
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
  fn setStringProperty (name:string value:string) {
    set props name (r.value value)
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
