class RangerArgMatch {
  def matched:[string:string]
  fn matchArguments:boolean (args:CodeNode callArgs:CodeNode ctx:RangerAppWriterContext firstArgIndex:int) {
    def fc:CodeNode (itemAt callArgs.children 0)
    def missed_args:[string]
    def all_matched:boolean true
    for args.children arg:CodeNode i {
      def callArg:CodeNode (itemAt callArgs.children (i + firstArgIndex))
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
          all_matched = false
        }
      }
      if ((arg.value_type != RangerNodeType.Hash) && (arg.value_type != RangerNodeType.Array)) {
        if (callArg.eval_type == RangerNodeType.Enum) {
          if (arg.type_name == "enum") {
            continue _
          }
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
      def typename:string arg.type_name
      switch typename {
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
          return (node.eval_type_name == typename)
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
      def typename:string arg.type_name
      switch typename {
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
          return (node.eval_type_name == typename)
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
    def typename:string type1
    if (has matched type1) {
      typename = (unwrap (get matched type1))
    }
    switch typename {
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

    if( (ctx.isDefinedClass(typename)) && (ctx.isDefinedClass (type2))) {
        def c1:RangerAppClassDesc (ctx.findClass(typename))
        def c2:RangerAppClassDesc (ctx.findClass(type2))
        if ( c1.isSameOrParentClass (type2 ctx)) {
            return true
        }
        if ( c2.isSameOrParentClass (typename ctx)) {
            return true
        }
    }
    return (typename == type2)
  }
  fn getTypeName:string (n:string) {
    def typename:string n
    if (has matched typename) {
      typename = (unwrap (get matched typename))
    }
    if (0 == (strlen typename)) {
      return ""
    }
    return typename
  }
  fn getType:RangerNodeType (n:string) {
    def typename:string n
    if (has matched typename) {
      typename = (unwrap (get matched typename))
    }
    if (0 == (strlen typename)) {
      return RangerNodeType.NoType
    }
    switch typename {
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
      default {
        return RangerNodeType.Object
      }
    }
    return RangerNodeType.NoType
  }
  fn setRvBasedOn:boolean (arg:CodeNode node:CodeNode) {
    if (arg.hasFlag("optional")) {
      node.setFlag("optional")
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

