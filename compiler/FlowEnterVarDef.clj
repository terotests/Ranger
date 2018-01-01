
operator type:RangerFlowParser all {

  fn EnterVarDef:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (ctx.isInMethod()) {

      if ((size node.children) < 2) {
        ctx.addError(node "invalid variable definition")
        return
      }

      ; print " DEF expr level " + (ctx.expressionLevel()) + " -> " + (node.getCode())

      def tName (node.getSecond())
      self.CheckTypeAnnotationOf(tName ctx wr)

      ; var x = 100   --> var (= x 100)
      if( tName.expression ) {
        remove node.children 1
        tName.children.forEach({
          if(index == 1) {
            if( item.expression ) {
              push node.children ( (at item.children 0 ) .copy())             
            } {
              push node.children ( item.copy())                           
            }
          }
          if(index > 1) {
            push node.children (item.copy())
          }
        })
      }
      
      if ((size node.children) > 3) {
        ctx.addError(node "invalid variable definition")
        return
      }
      def cn@(lives):CodeNode (at node.children 1)
      def p:RangerAppParamDesc (new RangerAppParamDesc ())
      def defaultArg:CodeNode
      def is_immutable false

      cn.definedTypeClass = (TFactory.new_def_signature(cn ctx wr))

      if ((size node.children) == 2) {
        if ((cn.value_type != RangerNodeType.Array) && (cn.value_type != RangerNodeType.Hash)) {       
          if!(cn.hasFlag('unwrap')) {
            cn.setFlag("optional")           
          }
        }
      }
      if ((strlen cn.vref) == 0) {
        ctx.addError(node "invalid variable definition")
      }
      if (cn.hasFlag("weak")) {
        p.changeStrength(0 1 node)
      } {
        p.changeStrength(1 1 node)
      }
      node.hasVarDef = true
      if ((size node.children) > 2) {
        p.init_cnt = 1
        p.def_value = (at node.children 2)
        p.is_optional = false
        defaultArg = (at node.children 2)
        ctx.setInExpr()

        self.WalkNode( (unwrap defaultArg) ctx wr)
        ctx.unsetInExpr()

        if (defaultArg.hasFlag("optional")) {
          cn.setFlag("optional")
        }
        if (defaultArg.hasFlag("immutable")) {
          cn.setFlag("immutable")
        }
        if( defaultArg.hasParamDesc ) {
          def paramDesc (unwrap defaultArg.paramDesc)
          if( !null? paramDesc.propertyClass) {
            if( paramDesc.propertyClass.nameNode.hasFlag("immutable") ) {
              ; TODO: add hash support
              if (defaultArg.eval_type == RangerNodeType.Array || defaultArg.eval_type == RangerNodeType.Hash) {
                is_immutable = true
;                ctx.addError( node "creating a mutable copy of immutable array is currently not permitted")
              }              
            }        
          }
          if( paramDesc.is_immutable) {
            is_immutable = true
          }
        }
        if (defaultArg.eval_type == RangerNodeType.Array) {
          node.op_index = 1
        }
        if (cn.value_type == RangerNodeType.Enum) {
          cn.eval_type_name = (at defaultArg.ns 0)
        }
        if (cn.value_type == RangerNodeType.Char) {
          if ((defaultArg.eval_type != RangerNodeType.Integer) && (defaultArg.eval_type != RangerNodeType.Char)) {
            ctx.addError( (unwrap defaultArg) ('Char should be assigned char or integer value --> ' + (defaultArg.getCode())))
          } {
            defaultArg.eval_type = RangerNodeType.Char
          }
        }
      } {
        if ((cn.value_type != RangerNodeType.Hash) && (cn.value_type != RangerNodeType.Array) && (false == (cn.hasFlag("optional")))) {
          if(cn.hasFlag('unwrap')) {
          } {
            cn.setFlag("optional")
          }
        }
      }
      ; simple local variable type inference
      if ((size node.children) > 2) {
          if( ( (strlen cn.type_name) == 0) && ( (strlen cn.array_type) == 0 ) ) {
            cn.inferDefTypeFromValue( node )       
            if(cn.value_type == RangerNodeType.ExpressionType) {
              cn.eval_type = RangerNodeType.ExpressionType
            }    
          }
      }      
      
      ctx.hadValidType(cn)
      cn.defineNodeTypeTo(cn ctx)

      p.name = cn.vref
      if (p.value_type == RangerNodeType.NoType) {
        if ((0 == (strlen cn.type_name)) && (!null? defaultArg)) {
          p.value_type = defaultArg.eval_type
          cn.type_name = defaultArg.eval_type_name
          cn.eval_type_name = defaultArg.eval_type_name
          cn.value_type = defaultArg.eval_type
        }
      } {
        p.value_type = cn.value_type
      }
      p.node = node
      p.nameNode = cn
      p.varType = RangerContextVarType.LocalVariable
      if is_immutable {
        p.is_immutable = is_immutable
      }
      if cn.has_vref_annotation {
        ctx.log(node "ann" "At a variable -> Found has_vref_annotation annotated reference ")
        def ann:CodeNode cn.vref_annotation
        if ((size ann.children) > 0) {
          def fc:CodeNode (at ann.children 0)
          ctx.log(node 'ann' ('value of first annotation ' + fc.vref + ' and variable name ' + cn.vref))
        }
      }
      if cn.has_type_annotation {
        ctx.log(node "ann" "At a variable -> Found annotated reference ")
        def ann:CodeNode cn.type_annotation
        if ((size ann.children) > 0) {
          def fc:CodeNode (at ann.children 0)
          ctx.log(node 'ann' ('value of first annotation ' + fc.vref + ' and variable name ' + cn.vref))
        }
      }

      cn.hasParamDesc = true
      cn.ownParamDesc = p
      cn.paramDesc = p
      node.hasParamDesc = true
      node.paramDesc = p
      cn.eval_type = (cn.typeNameAsType(ctx))
      cn.eval_type_name = cn.type_name
 
      if ((size node.children) > 2) {        
        if(!null? defaultArg) {
          self.convertToUnion( cn.eval_type_name (unwrap defaultArg) ctx wr) 
          if(!null? defaultArg.evalTypeClass) {
            cn.evalTypeClass = defaultArg.evalTypeClass
          }
        }
        ; TODO: enable this
        if (cn.eval_type != defaultArg.eval_type) {
          
          def b1 (( cn.eval_type == RangerNodeType.Char &&  defaultArg.eval_type == RangerNodeType.Integer ))
          def b2 ( cn.eval_type == RangerNodeType.Integer &&  defaultArg.eval_type == RangerNodeType.Char )
          if( false == ( b1 || b2 ) )  {
            ctx.addError(node ((('Variable was assigned an incompatible type. Types were ' + cn.eval_type) + ' vs ') + defaultArg.eval_type))
          }          
        }
      } {
        p.is_optional = true
      }
      ctx.defineVariable(p.name p)
      if ((size node.children) > 2) {
        self.shouldBeEqualTypes(cn (unwrap p.def_value) ctx "Variable was assigned an incompatible type.")
      }
      addUsage ctx cn
    } {
      def cn:CodeNode (at node.children 1)
      cn.eval_type = (cn.typeNameAsType(ctx))
      cn.eval_type_name = cn.type_name
      if ((size node.children) > 2) {
        self.shouldBeEqualTypes((at node.children 1) (at node.children 2) ctx "Variable was assigned an incompatible type.")
      }
    }
  }  
}