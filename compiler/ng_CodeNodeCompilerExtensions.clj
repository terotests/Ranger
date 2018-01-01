Import "TFactory.clj"
Import "TTypes.clj"

class CallChain {
  def methodName:string ""
  def method@(weak):CodeNode
  def args@(weak):CodeNode
}

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

  ; the evaluated type class...
  ; 
  def definedTypeClass@(weak):RangerTypeClass    
  def evalTypeClass@(weak):RangerTypeClass    

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
  def clDesc@(weak):RangerAppClassDesc
  def hasFnCall:boolean false
  def fnDesc:RangerAppFunctionDesc    
  def lambdaFnDesc@(weak):RangerAppFunctionDesc
  def hasParamDesc:boolean false    
  def paramDesc@(weak optional):RangerAppParamDesc
  def ownParamDesc@(optional):RangerAppParamDesc
  def evalCtx@(weak):RangerAppWriterContext
  def evalState:NodeEvalState

  def operator_node@(weak):CodeNode
  def flow_ctx@(weak):RangerAppWriterContext

  def is_part_of_chain false
  def methodChain:[CallChain]

  def chainTarget:CodeNode

  def register_set false
  def reg_compiled_name ""

  ; tag for debugging the nodes if necessary...
  def tag ""

  fn isParsedAsPrimitive:boolean () {
    return (TTypes.isPrimitive(parsed_type))
  }

;  fn isPrimitive:boolean () {
;    return (TTypes.isPrimitive(value_type))
;  }
  fn isPrimitiveType:boolean () {
    return (TTypes.isPrimitive((TTypes.nameToValue(type_name))))    
  }
  fn isAPrimitiveType:boolean () {
    return (TTypes.isPrimitive((TTypes.nameToValue(array_type))))    
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
      case RangerNodeType.VRef {
        wr.out(vref false)
        if(has type_name) {
          wr.out(":" + type_name , false)
        }
      }      
      case RangerNodeType.Hash {
        wr.out(vref false)
        wr.out(":[" + key_type + ":" + array_type + "]" , false)
      } 
      case RangerNodeType.Array {
        wr.out(vref false)
        wr.out(":[" + array_type + "]" , false)
      } 
      case RangerNodeType.ExpressionType {
        wr.out("(fn--> " false) ; "
        for children ch:CodeNode i {
        ch.writeCode(wr)
        }
        wr.out(")" false)  ; "
      }
      default {
        if expression {
          wr.out("(" false)
          for children ch:CodeNode i {
            if( i > 0) {
              wr.out(' ' false)
            }
            ch.writeCode(wr)
          }
          wr.out(")" false)  ; "
        } {
          if is_block_node {
            wr.out("{" true)
            for children ch:CodeNode i {
              ch.writeCode(wr)
            }
            wr.out("}" true)
          } {
            wr.out("<unknown>" false)
            wr.out("{" true)
            for children ch:CodeNode i {
              ch.writeCode(wr)
            }
            wr.out("}" true)
          }
        }

      }
    }
  }
  
  fn createChainTarget() {
    def chCnt (array_length children)
    if( chCnt > 2 ) {
      def fc (this.getFirst())
      ; def xyz something
      if(fc.vref == "def" ) {
        chainTarget = (this.getThird())
      }
      ; obj = foobba
      if(fc.vref == "=" ) {
        chainTarget = (this.getThird())
      }    
    }
  }

  fn inferDefExpressionTypeFromValue ( node:CodeNode ) {
    def cn (itemAt node.children 1)
    def nodeValue:CodeNode (itemAt node.children 2)
    ; print " > Infer value type " + nodeValue.value_type
    ; print " > Infer eval_tyåe type " + nodeValue.eval_type

    if( !null? cn.expression_value ) {
      ; print "^ but has expression value"
      cn.value_type = RangerNodeType.ExpressionType
      cn.parsed_type = RangerNodeType.ExpressionType
      cn.has_vref_annotation = true

      ; print "==> expression : " + (cn.expression_value.getCode())
    }

    if(nodeValue.eval_type == RangerNodeType.ExpressionType) {
      if(!null? nodeValue.expression_value) {
        cn.expression_value = ( nodeValue.expression_value.copy() )
      } {
        if( (null? node.expression_value)) {
          ; infer the node type 
          def copyOf (nodeValue.rebuildWithType( (new RangerArgMatch () ) false))
          removeLast copyOf.children
          cn.expression_value = copyOf
        }
      }
      cn.value_type = RangerNodeType.ExpressionType
    }            
  }

  fn inferDefTypeFromValue ( node:CodeNode ) {
    def cn (itemAt node.children 1)
    def nodeValue:CodeNode (itemAt node.children 2)

    cn.value_type = nodeValue.eval_type
    cn.type_name = nodeValue.eval_type_name
    cn.array_type = nodeValue.eval_array_type
    cn.key_type = nodeValue.eval_key_type

    if(nodeValue.eval_type == RangerNodeType.ExpressionType) {
      if(!null? nodeValue.expression_value) {
        cn.expression_value = ( nodeValue.expression_value.copy() )
      } {
        if( (null? node.expression_value)) {
          ; infer the node type 
          def copyOf (nodeValue.rebuildWithType( (new RangerArgMatch () ) false))
          removeLast copyOf.children
          cn.expression_value = copyOf
        }
      }
      cn.type_name = ""
    }            
  }

  fn getCode:string () {
    def wr:CodeWriter (new CodeWriter ())
    this.writeCode(wr)
    return (wr.getCode())
  }

  ; cleans away the flow parser information from the node...
  fn cleanNode ( ) {  

    def cp@(temp) this

    nullify cp.evalTypeClass
    nullify cp.lambda_ctx
    clear cp.nsp

    cp.eval_type = RangerNodeType.NoType
    cp.eval_type_name = ""
    cp.eval_key_type = ""
    cp.eval_array_type = ""
    
    nullify cp.eval_function
    cp.flow_done = false
    cp.ref_change_done = false
    nullify cp.eval_type_node
    cp.didReturnAtIndex = -1
    cp.hasVarDef = false
    cp.hasClassDescription = false
    cp.hasNewOper = false
    nullify cp.clDesc
    cp.hasFnCall = false
    nullify cp.fnDesc
    cp.hasParamDesc = false
    nullify cp.paramDesc
    nullify cp.ownParamDesc
    nullify cp.evalCtx
    nullify cp.evalState 
    nullify cp.operator_node
    nullify cp.flow_ctx
    cp.is_part_of_chain = false
    clear cp.methodChain
    nullify cp.chainTarget
    cp.tag = ""

    cp.has_operator = false
    cp.disabled_node = false
    cp.op_index = 0
    cp.is_array_literal = false
    cp.is_system_class = false
    cp.is_plugin = false

    cp.mutable_def = false
    cp.has_lambda = false
    cp.has_lambda_call = false
    cp.has_call = false

    cp.type_type = type_type
    cp.value_type = parsed_type

    ; TODO:

    ; def has_vref_annotation:boolean false
    ; def vref_annotation:CodeNode
    ; def has_type_annotation:boolean false
    ; def type_annotation:CodeNode
    ; def ref_type:RangerNodeRefType RangerNodeRefType.NoType
    ; def ref_need_assign:int 0
    ; def expression_value:CodeNode
    ; def props:[string:CodeNode]
    ; def prop_keys:[string]
    ; def comments:[CodeNode]
    ; def children:[CodeNode]
    ; def parent@(weak):CodeNode
    ; def attrs:[CodeNode]
    ; def appGUID:string ""
    ; def register_name:string ""

    cp.children.forEach({
      item.cleanNode()
    })

  }

  ; creates copy that should be ready to be re-compiled
  fn cleanCopy:CodeNode () {
    def match (new RangerArgMatch)
    def cp (this.rebuildWithType( match false))
    cp.cleanNode()
    return cp
  }

  fn copy:CodeNode () {
    def match (new RangerArgMatch)
    def cp (this.rebuildWithType( match false))
    cp.register_expressions = (clone this.register_expressions)
    return cp
  }

  fn clone:CodeNode () {
    def match (new RangerArgMatch)
    def cp (this.cloneWithType( match false))
    return cp
  }

  fn push (node@(strong):CodeNode) {
    push this.children node
    node.parent = this
  }

  fn add (node@(strong):CodeNode) {
    push this.children node
    node.parent = this
  }  

  fn newVRefNode:CodeNode (name:string) {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    newNode.vref = name
    newNode.value_type = RangerNodeType.VRef
    newNode.parsed_type = RangerNodeType.VRef
    newNode.ns = (strsplit name ".")
    return newNode
  }

  fn newStringNode:CodeNode (name:string) {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    newNode.string_value = name
    newNode.value_type = RangerNodeType.String
    newNode.parsed_type = RangerNodeType.VRef
    return newNode
  }

  fn newExpressionNode:CodeNode () {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    newNode.expression = true
    return newNode    
  }


  fn getChildrenFrom (otherNode:CodeNode) {
    clear this.children
    for otherNode.children ch@(lives):CodeNode i {
      this.push(ch)
      ch.parent = this
    }
    clear otherNode.children
  }

  fn cloneWithType:CodeNode (match:RangerArgMatch changeVref:boolean) {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    if( has match.nodes vref) {
      def ast (unwrap (get match.nodes vref))
      return (ast.rebuildWithType(match true))
    }
    newNode.has_operator = has_operator
    newNode.op_index = op_index
    newNode.mutable_def = mutable_def
    newNode.expression = expression
    newNode.register_name = register_name
    newNode.operator_node = operator_node
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
    newNode.parsed_type = parsed_type

    newNode.copyEvalResFrom( this )
    newNode.register_expressions = (clone this.register_expressions)

    if has_vref_annotation {
      newNode.has_vref_annotation = true
      def ann:CodeNode vref_annotation
      newNode.vref_annotation = (ann.cloneWithType(match true))
    }
    if has_type_annotation {
      newNode.has_type_annotation = true
      def t_ann:CodeNode type_annotation
      newNode.type_annotation = (t_ann.cloneWithType(match true))
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
          newNode.expression_value = (expression_value.cloneWithType(match changeVref))
        }
      }
    }
    for prop_keys key:string i {
      push newNode.prop_keys key
      def oldp:CodeNode (get props key)
      def np:CodeNode (oldp.cloneWithType(match changeVref))
      set newNode.props key np
    }
    for children ch:CodeNode i {
      def newCh:CodeNode (ch.cloneWithType(match changeVref))
      newCh.parent = newNode
      push newNode.children newCh
    }
    return newNode
  }
  
  
  fn rebuildWithType:CodeNode (match:RangerArgMatch changeVref:boolean) {
    def newNode@(lives):CodeNode (new CodeNode ( (unwrap code) sp ep))
    if( has match.nodes vref) {
      def ast (unwrap (get match.nodes vref))
      return (ast.rebuildWithType(match true))
    }
    newNode.has_operator = has_operator
    newNode.op_index = op_index
    newNode.mutable_def = mutable_def
    newNode.expression = expression
    newNode.register_name = register_name
    newNode.reg_compiled_name = reg_compiled_name
    newNode.operator_node = operator_node
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
    newNode.parsed_type = parsed_type
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
    if( TTypes.isPrimitive( value_type ) ) {
      return (TTypes.valueAsString(value_type))
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
    if (value_type == RangerNodeType.ExpressionType) {
      def fnNode (expression_value.getFirst())
      def argNode (expression_value.getSecond())
      s = s + "(_:" + (fnNode.buildTypeSignature())
      s = s + " ("  + (join (map argNode.children {
        return ("_:" + (item.buildTypeSignature()))
      } to:[string]) " ") + "))"
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
    if(value_type == RangerNodeType.ExpressionType || eval_type == RangerNodeType.ExpressionType ) {
        return RangerNodeType.ExpressionType
    }
    def conv (TTypes.nameToValue(type_name))
    if(conv != RangerNodeType.NoType) {
      return conv
    }
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

  fn copyEvalResFrom:void (node:CodeNode) {
    if node.hasParamDesc {
      hasParamDesc = node.hasParamDesc
      paramDesc = node.paramDesc
    }
    if (!null? node.evalTypeClass) {
      evalTypeClass = node.evalTypeClass
    }
    eval_type = node.eval_type
    eval_type_name = node.eval_type_name

    ; here -> get optionality from operator if possible
    if( !null? node.operator_node ) {
      def nn (itemAt node.operator_node.children 1 )
      if (nn.hasFlag("optional")) {
        this.setFlag("optional")    
      }
      if( nn.hasFlag("immutable")) {
        this.setFlag("immutable")        
      } 
    } {
      if (node.hasFlag("optional")) {
        this.setFlag("optional")
      }
      if( node.hasFlag("immutable")) {
        this.setFlag("immutable")        
      }      
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
    ; TODO: this function may have some problems
    if(node.value_type == RangerNodeType.ExpressionType || node.eval_type == RangerNodeType.ExpressionType ) {
        return
    }

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