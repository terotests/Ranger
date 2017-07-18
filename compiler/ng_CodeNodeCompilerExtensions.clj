class NodeEvalState {
  def ctx@(weak):RangerAppWriterContext
  def is_running:boolean false

  def child_index:int -1
  def cmd_index:int -1
  
  def is_ready:boolean false
  def is_waiting:boolean false

  def exit_after:boolean false
  def expand_args:boolean false
  
  def ask_expand:boolean false
  def eval_rest:boolean false
  def exec_cnt:int 0
  def b_debugger:boolean false   
  def b_top_node:boolean false

  def ask_eval:boolean false
  def param_eval_on:boolean false
  def eval_index:int -1
  def eval_end_index:int -1
  def ask_eval_start:int 0
  def ask_eval_end:int 0
  def evaluating_cmd@(weak):CodeNode
}

extension CodeNode {
  def typeClass@(weak):RangerTypeClass    
  def lambda_ctx:RangerAppWriterContext    
  def nsp@(weak):[RangerAppParamDesc]
  def eval_type:RangerNodeType RangerNodeType.NoType
  def eval_type_name:string ""
  def eval_key_type:string ""
  def eval_array_type:string ""
  def eval_function@(weak):CodeNode
  def flow_done:boolean false
  def ref_change_done:boolean false
  def eval_type_node:CodeNode
    
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
  def evalState:NodeEvalState

  def operator_node@(weak):CodeNode

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
      case RangerNodeType.VRef {
        wr.out(vref false)
      }      
      case RangerNodeType.Hash {
        wr.out(vref false)
        wr.out(":[" + key_type + ":" + array_type + "]" , false)
      } 
      case RangerNodeType.Array {
        wr.out(vref false)
        wr.out(":[" + array_type + "]" , false)
      } 
    }
    if expression {
      wr.out("(" false)
      for children ch:CodeNode i {
       ch.writeCode(wr)
      }
      wr.out(")" false)
    }
  }

  fn getCode:string () {
    def wr:CodeWriter (new CodeWriter ())
    this.writeCode(wr)
    return (wr.getCode())
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
      if changeVref {
        def new_ns (match.getTypeName(n))
        push newNode.ns new_ns
      } {
        newNode.vref = vref
        push newNode.ns n
      }

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
      }
    }
    return value_type
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
    if( node.value_type == RangerNodeType.ExpressionType ) {
      eval_type = RangerNodeType.ExpressionType
      eval_function = node.eval_function
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


  fn ifNoTypeSetToVoid:void () {
    if( ( (strlen type_name) == 0 ) && ( (strlen key_type) == 0) && ( (strlen array_type) == 0) ) {
      type_name = "void"
    }
  }
  fn ifNoTypeSetToEvalTypeOf:boolean (node:CodeNode) {
    if( ( (strlen type_name) == 0 ) && ( (strlen key_type) == 0) && ( (strlen array_type) == 0) ) {
      type_name = node.eval_type_name
      array_type = node.eval_array_type
      key_type = node.eval_key_type
      value_type = node.eval_type
      eval_type = node.eval_type
      eval_type_name = node.eval_type_name
      eval_array_type = node.eval_array_type
      eval_key_type = node.eval_key_type

      if(node.value_type == RangerNodeType.ExpressionType) {
        if( (null? expression_value)) {
          def copyOf (node.rebuildWithType( (new RangerArgMatch () ) false))
          removeLast copyOf.children
          expression_value = copyOf
        }
      }            
      return true
    }
    return false
  }

}