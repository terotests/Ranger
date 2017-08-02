
; match and possibly collect the trait parameters also for the match...
; match.add(typeName.vref pArg.vref ctx)

class RangerArgMatch {
  def _debug false
  def matched:[string:string]
  fn matchArguments:boolean (args:CodeNode callArgs:CodeNode ctx:RangerAppWriterContext firstArgIndex:int) {
    def fc:CodeNode (itemAt callArgs.children 0)
    def missed_args:[string]
    def all_matched:boolean true
    ; callArgs
    if( (array_length args.children) == 0 && ( (array_length callArgs.children) > 1)) {
      return false
    }
    def lastArg@(optional):CodeNode 
    for callArgs.children callArg:CodeNode i {
      if( i == 0 ) {
        continue
      }
      if(callArg.is_part_of_chain) {
        continue
      }
      def arg_index ( i - 1)
      if( arg_index < (array_length args.children)) {
        lastArg = (itemAt args.children arg_index)
      } 
      def arg (unwrap lastArg)
      ; def callArg:CodeNode (itemAt callArgs.children (i + firstArgIndex))
      if (arg.hasFlag("ignore")) {
        continue _
      }
      if (arg.hasFlag("mutable")) {
        if callArg.hasParamDesc {
          def pa:RangerAppParamDesc callArg.paramDesc
          def b:boolean (pa.nameNode.hasFlag("mutable"))
          if (b == false) {
            push missed_args "was mutable"
            all_matched = false
          }
        } {
          all_matched = false
        }
      }

      def call_arg_immutable false
      if callArg.hasParamDesc {
        def pa:RangerAppParamDesc callArg.paramDesc
        if(!null? pa.nameNode) {
          def b_immutable:boolean (pa.nameNode.hasFlag("immutable"))
          if ( (arg.hasFlag("immutable")) != b_immutable ) {
            all_matched = false
          }     
          call_arg_immutable = b_immutable    
        } {
          call_arg_immutable = pa.is_immutable
        }
      }
      if(callArg.hasFlag("immutable")) {
        call_arg_immutable = true
      }

      if (arg.hasFlag("immutable")) {
        if (false == call_arg_immutable) {
          all_matched = false
        }
      }
      ; 


      if (arg.hasFlag("optional")) {
        if callArg.hasParamDesc {
          def pa:RangerAppParamDesc callArg.paramDesc
          def b:boolean (pa.nameNode.hasFlag("optional"))
          if (b == false) {
            push missed_args "optional was missing"
            all_matched = false
          }
        } {
          if (callArg.hasFlag("optional")) {
          } {
            all_matched = false
          }
        }
      }
      if (callArg.hasFlag("optional")) {    
        if (false == (arg.hasFlag("optional"))) {
          if(callArg.is_block_node) {
            ; block nodes can not be optional
          } {
            all_matched = false
          }
          
        }
      }
      if ((arg.value_type != RangerNodeType.Hash) && (arg.value_type != RangerNodeType.Array)) {
        if (callArg.eval_type == RangerNodeType.Enum) {
          if (arg.type_name == "enum") {
            continue _
          }
        }
        if _debug {
          print "-> trying to add type " + arg.type_name 
        }
        if (false == (this.add(arg.type_name callArg.eval_type_name ctx))) {
          all_matched = false
          return all_matched
        }
      }
      if (arg.value_type == RangerNodeType.Array) {
        if (false == (this.add(arg.array_type callArg.eval_array_type ctx))) {
          print "--> Failed to add the argument  "
          all_matched = false
        }
      }
      if (arg.value_type == RangerNodeType.Hash) {
        if (false == (this.add(arg.key_type callArg.eval_key_type  ctx))) {
          print "--> Failed to add the key argument  "
          all_matched = false
        }
        if (false == (this.add(arg.array_type callArg.eval_array_type ctx))) {
          print "--> Failed to add the key argument  "
          all_matched = false
        }
      }
      def did_match:boolean false
      if (this.doesMatch(arg callArg ctx)) {
        did_match = true
      } {
        push missed_args ((("matching arg " + arg.vref) + " faileg against ") + callArg.vref)
      }
      if (false == did_match) {
        all_matched = false
      }
    }
    return all_matched
  }

  fn force_add:void ( tplKeyword:string typeName:string ctx:RangerAppWriterContext) {
    set matched tplKeyword typeName    
  }
  fn add:boolean ( tplKeyword:string typeName:string ctx:RangerAppWriterContext) {
    switch tplKeyword {
      case "string" {
          return true
      }
      case "int" {
          return true
      }
      case "double" {
          return true
      }
      case "boolean" {
          return true
      }        
      case "enum" {
          return true
      }
      case "char" {
          return true
      }
      case "charbuffer" {
          return true
      }
    }

    if ((strlen tplKeyword) > 1) {
      return true
    }

    if (has matched tplKeyword) {

      def s:string (unwrap (get matched tplKeyword) )
      if(this.areEqualTypes(s typeName ctx)) {
          return true
      }
      if (s == typeName ) {
          return true
      } {
          return false
      }
    }
    (set matched tplKeyword typeName)
    return true
  }


  fn doesDefsMatch:boolean (arg:CodeNode node:CodeNode ctx:RangerAppWriterContext) {

    if (node.value_type == RangerNodeType.Enum) {
      if (arg.type_name == "enum") {
        return true
      } {
        return false
      }
    }
    
    if ((arg.value_type != RangerNodeType.Hash) && (arg.value_type != RangerNodeType.Array)) {
      def eq:boolean (this.areEqualTypes(arg.type_name node.type_name ctx))
      def t_name:string arg.type_name
      switch t_name {
        case "expression" {
          return node.expression
        }
        case "block" {
          return node.expression
        }
        case "arguments" {
          return node.expression
        }
        case "keyword" {
          return (node.eval_type == RangerNodeType.VRef)
        }
        case "T.name" {
          return (node.eval_type_name == t_name)
        }
      }
      return eq
    }
    if ((arg.value_type == RangerNodeType.Array) && (node.eval_type == RangerNodeType.Array)) {
      def same_arrays:boolean (this.areEqualTypes(arg.array_type node.array_type ctx))
      return same_arrays
    }
    if ((arg.value_type == RangerNodeType.Hash) && (node.eval_type == RangerNodeType.Hash)) {
      def same_arrays:boolean (this.areEqualTypes(arg.array_type node.array_type ctx))
      def same_keys:boolean (this.areEqualTypes(arg.key_type node.key_type ctx))
      return (same_arrays && same_keys)
    }
    return false
  }

  fn doesMatch:boolean (arg:CodeNode node:CodeNode ctx:RangerAppWriterContext) {

    if (node.value_type == RangerNodeType.Enum) {
      if (arg.type_name == "enum") {
        return true
      } {
        return false
      }
    }

    if ((arg.value_type != RangerNodeType.Hash) && (arg.value_type != RangerNodeType.Array)) {
      def eq:boolean (this.areEqualTypes(arg.type_name node.eval_type_name ctx))
      def t_name:string arg.type_name
      switch t_name {
        case "expression" {
          return node.expression
        }
        case "block" {
          return node.expression
        }
        case "arguments" {
          return node.expression
        }
        case "keyword" {
          return (node.eval_type == RangerNodeType.VRef)
        }
        case "T.name" {
          return (node.eval_type_name == t_name)
        }
      }
      return eq
    }
    if ((arg.value_type == RangerNodeType.Array) && (node.eval_type == RangerNodeType.Array)) {
      def same_arrays:boolean (this.areEqualTypes(arg.array_type node.eval_array_type ctx))
      return same_arrays
    }
    if ((arg.value_type == RangerNodeType.Hash) && (node.eval_type == RangerNodeType.Hash)) {
      def same_arrays:boolean (this.areEqualTypes(arg.array_type node.eval_array_type ctx))
      def same_keys:boolean (this.areEqualTypes(arg.key_type node.eval_key_type ctx))
      return (same_arrays && same_keys)
    }
    return false
  }
  fn areEqualTypes:boolean (type1:string type2:string ctx:RangerAppWriterContext) {
    def t_name:string type1
    if (has matched type1) {
      t_name = (unwrap (get matched type1))
    }
    switch t_name {
      case "string" {
        return (type2 == "string")
      }
      case "int" {
        return (type2 == "int")
      }
      case "double" {
        return (type2 == "double")
      }
      case "boolean" {
        return (type2 == "boolean")
      }
      case "enum" {
        return (type2 == "enum")
      }
      case "char" {
        return (type2 == "char")
      }
      case "charbuffer" {
        return (type2 == "charbuffer")
      }
    }

    if( (ctx.isDefinedClass(t_name)) && (ctx.isDefinedClass (type2))) {
        def c1:RangerAppClassDesc (ctx.findClass(t_name))
        def c2:RangerAppClassDesc (ctx.findClass(type2))
        def trait1 (c1.hasTrait(type2 ctx))
        if(!null? trait1) {
          this.force_add( type2 c1.name ctx)
          if( has c1.trait_params type2 ) {
            def pms (unwrap (get c1.trait_params type2))
            for pms.param_names pn:string i {
              def pn_value (unwrap (get pms.values pn))
              this.add( pn pn_value ctx)
            }
          }
        }
        def trait1 (c2.hasTrait(t_name ctx))
        if(!null? trait1) {
          this.force_add( t_name c2.name ctx)
          if( has c2.trait_params t_name ) {
            def pms (unwrap (get c2.trait_params t_name))
            for pms.param_names pn:string i {
              def pn_value (unwrap (get pms.values pn))
              this.add( pn pn_value ctx)
            }
          } {

          }
        }

        if ( c1.isSameOrParentClass (type2 ctx)) {
            ; trait_params
            return true
        }
        if ( c2.isSameOrParentClass (t_name ctx)) {
            ; trait_params
            return true
        }
    } {
      ; could be union type still..
      if(ctx.isDefinedClass(t_name)) {
        def c1:RangerAppClassDesc (ctx.findClass(t_name))
        if ( c1.isSameOrParentClass (type2 ctx)) {
          ; trait_params
            return true
        }        
      }      
    }
    return (t_name == type2)
  }
  fn getTypeName:string (n:string) {
    def t_name:string n
    if (has matched t_name) {
      t_name = (unwrap (get matched t_name))
    }
    if (0 == (strlen t_name)) {
      return ""
    }
    return t_name
  }
  fn getType:RangerNodeType (n:string) {
    def t_name:string n
    if (has matched t_name) {
      t_name = (unwrap (get matched t_name))
    }
    if (0 == (strlen t_name)) {
      return RangerNodeType.NoType
    }
    switch t_name {
      case "expression" {
        return RangerNodeType.Expression
      }
      case "block" {
        return RangerNodeType.Expression
      }
      case "arguments" {
        return RangerNodeType.Expression
      }
      case "string" {
        return RangerNodeType.String
      }
      case "int" {
        return RangerNodeType.Integer
      }
      case "char" {
        return RangerNodeType.Char
      }
      case "charbuffer" {
        return RangerNodeType.CharBuffer
      }
      case "boolean" {
        return RangerNodeType.Boolean
      }
      case "double" {
        return RangerNodeType.Double
      }
      case "enum" {
        return RangerNodeType.Enum
      }
    }
    return RangerNodeType.Object
  }
  fn setRvBasedOn:boolean (arg:CodeNode node:CodeNode) {
    if (arg.hasFlag("optional")) {
      node.setFlag("optional")
    }
    if (arg.hasFlag("immutable")) {
      node.setFlag("immutable")
    }    
    if ((arg.value_type != RangerNodeType.Hash) && (arg.value_type != RangerNodeType.Array)) {
      node.eval_type = (this.getType(arg.type_name))
      node.eval_type_name = (this.getTypeName(arg.type_name))
      return true
    }
    if (arg.value_type == RangerNodeType.Array) {
      node.eval_type = RangerNodeType.Array
      node.eval_array_type = (this.getTypeName(arg.array_type))
      return true
    }
    if (arg.value_type == RangerNodeType.Hash) {
      node.eval_type = RangerNodeType.Hash
      node.eval_key_type = (this.getTypeName(arg.key_type))
      node.eval_array_type = (this.getTypeName(arg.array_type))
      return true
    }
    return false
  }
}

