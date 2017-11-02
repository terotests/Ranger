
Import "TTypes.clj"

; vref annontation:
;   node@(something)
; type annotation:
;   node:Vector@(string)

class TFactory {

  static fn new_class_signature:RangerTypeClass ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
      def sig node.vref
      def tc (ctx.getTypeClass (sig))
      if(null? tc) {
        def newTC (ctx.addTypeClass (sig))
        newTC.value_type = node.value_type
        newTC.is_class = true
        newTC.name = sig
        return newTC
      } 
      return (unwrap tc)
  }

  static fn new_lambda_signature:RangerTypeClass ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
      def sig (TFactory.lambdaSignature(node))
      def tc (ctx.getTypeClass (sig))
      if(null? tc) {
        def newTC (ctx.addTypeClass (sig))
        newTC.value_type = node.value_type
        newTC.is_lambda = true
        newTC.name = sig
        return newTC
      } 
      return (unwrap tc)
  }

  static fn new_def_signature_from_simple_string:RangerTypeClass ( sig:string ctx:RangerAppWriterContext wr:CodeWriter ) {
      def tc (ctx.getTypeClass (sig))
      if(null? tc) {
        def newTC (ctx.addTypeClass (sig))
        newTC.is_primitive = (TTypes.isPrimitive( (TTypes.nameToValue(sig)) ))
        newTC.value_type = (TTypes.nameToValue(sig))
        newTC.name = sig
        if( (has sig) == false ) {
          newTC.is_empty = true
        }
        return newTC
      } 
      return (unwrap tc)
  }

  static fn sig:RangerTypeClass ( sig:string ctx:RangerAppWriterContext wr:CodeWriter ) {
    return (TFactory.new_def_signature_from_simple_string( sig ctx wr ))
  }
  

  static fn new_def_signature:RangerTypeClass ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
      def sig (TFactory.baseSignature(node))
      def tc (ctx.getTypeClass (sig))
      if(null? tc) {
        def newTC (ctx.addTypeClass (sig))
        newTC.value_type = node.value_type
        newTC.is_primitive = (TTypes.isPrimitive(node.value_type))
        if(node.value_type == RangerNodeType.ExpressionType) {
          newTC.is_lambda = true
        }
        if(node.value_type == RangerNodeType.Array) {
          newTC.arrayType = (TFactory.new_def_signature_from_simple_string(node.array_type ctx wr))
        }
        if(node.value_type == RangerNodeType.Hash) {
          newTC.keyType = (TFactory.new_def_signature_from_simple_string(node.key_type ctx wr))
          newTC.arrayType = (TFactory.new_def_signature_from_simple_string(node.array_type ctx wr))
        }
        newTC.name = sig
        if( (has sig) == false ) {
          newTC.is_empty = true
        }
        return newTC
      } 
      return (unwrap tc)
  }

  static fn new_scalar_signature:RangerTypeClass ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
      def sig (TFactory.baseSignature(node))
      def tc (ctx.getTypeClass (sig))
      if(null? tc) {
        def newTC (ctx.addTypeClass (sig))
        newTC.is_primitive = true
        newTC.value_type = node.value_type
        newTC.name = sig
        return newTC
      } 
      return (unwrap tc)
  }

  static fn type_annotation:string ( node:CodeNode ) {
    if node.has_type_annotation {
      return ('@(' + (TFactory.baseSignature( (unwrap node.type_annotation)) ) + ')' )
    } 
    return ""
  }

  static fn lambdaSignature:string (node:CodeNode) {
    def fnNode (node.getFirst())
    def argNode (node.getSecond())
    def s ""
    s = s + "(_:" + (TFactory.baseSignature( fnNode))
    s = s + " ("  + (join (map argNode.children {
        return ("_:" + (TFactory.baseSignature( item )) )
    } to:[string]) " ") + "))"
    return s    
  }
    
  static fn baseSignature:string ( node:CodeNode ) {   
    if( TTypes.isPrimitive( node.value_type ) ) {
      return (TTypes.valueAsString(node.value_type))
    }
    def s:string ""
    if (node.value_type == RangerNodeType.Array) {
      s = (s + "[")
      s = (s + node.array_type)
      s = (s + "]")
      return s
    }
    if (node.value_type == RangerNodeType.Hash) {
      s = (s + "[")
      s = (s + node.key_type)
      s = (s + ":")
      s = (s + node.array_type)
      s = (s + "]")
      return s
    }
    if (node.value_type == RangerNodeType.ExpressionType) {
      def fnNode (node.expression_value.getFirst())
      def argNode (node.expression_value.getSecond())
      s = s + "(_:" + (TFactory.baseSignature( fnNode))
      s = s + " ("  + (join (map argNode.children {
          return ("_:" + (TFactory.baseSignature( item )) )
      } to:[string]) " ") + "))"
      return s
    }
    s = ( node.type_name + (TFactory.type_annotation(node)) )
    return s
  }
    
}