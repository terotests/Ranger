

class TFlow {

  static fn walkFunctionBody (m@(lives):RangerAppFunctionDesc fnBody:CodeNode subCtx:RangerAppWriterContext wr:CodeWriter) {
    def pref_fnc subCtx.function_level_context 
    subCtx.function_level_context = true
    subCtx.currentMethod = m
    for m.params v:RangerAppParamDesc i {
      v.nameNode.eval_type = (v.nameNode.typeNameAsType(subCtx))
      v.nameNode.eval_type_name = v.nameNode.type_name
      ctx.hadValidType( (unwrap v.nameNode) )
    }
    subCtx.setInMethod()
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    if (fnBody.didReturnAtIndex == -1) {
      if (cn.type_name != "void") {
          if( false == (ctx.getFlag("in_task")) ) {
            ctx.addError(node "Function does not return any values!")
          }
      }
    }
    for subCtx.localVarNames n:string i {
      def p:RangerAppParamDesc (get subCtx.localVariables n)
      if (p.set_cnt > 0) {
          if(p.is_immutable) {
            ctx.addError( (unwrap p.nameNode) "Immutable variable was assigned a value")
          }        
          def defNode:CodeNode p.node
          defNode.setFlag("mutable")
          def nNode:CodeNode p.nameNode
          nNode.setFlag("mutable")
      }
    }      
    subCtx.function_level_context = pref_fnc
  }

}