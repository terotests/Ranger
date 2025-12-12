class RangerRustClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "self"
  fn WriteScalarValue (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out((("" + node.double_value) + "_f64") false)
      }
      case RangerNodeType.String {
        def s:string (this.EncodeString(node ctx wr))
        wr.out(((("\"" + s) + "\"") + ".to_string()") false)
      }
      case RangerNodeType.Integer {
        wr.out(("" + node.int_value) false)
      }
      case RangerNodeType.Boolean {
        if node.boolean_value {
          wr.out("true" false)
        } {
          wr.out("false" false)
        }
      }
    }
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "i64"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "f64"
      }
    }
    return type_string
  }
  fn getTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "i64"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "f64"
      }
    }
    return type_string
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.hasFlag("optional")) {
      wr.out("Option<" false)
    }
    def v_type:RangerNodeType node.value_type
    if ((v_type == RangerNodeType.Object) || (v_type == RangerNodeType.VRef) || (v_type == RangerNodeType.NoType)) {
      v_type = (node.typeNameAsType(ctx))
    }
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
    }
    switch v_type {
      case RangerNodeType.Enum {
        wr.out("i64" false)
      }
      case RangerNodeType.Integer {
        wr.out("i64" false)
      }
      case RangerNodeType.Double {
        wr.out("f64" false)
      }
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("bool" false)
      }
      case RangerNodeType.Char {
        wr.out("u8" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("Vec<u8>" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("HashMap<" + (this.getObjectTypeString(node.key_type ctx))) + ",") + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
        wr.addImport("std::collections::HashMap")
      }
      case RangerNodeType.Array {
        wr.out((("Vec<" + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("()" false)
          return
        }
        wr.out((this.getTypeString(node.type_name)) false)
      }
    }
    if (node.hasFlag("optional")) {
      wr.out(">" false)
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "this") {
      wr.out(thisName false)
      return
    }

    if (node.eval_type == RangerNodeType.Enum) {
      if( (array_length node.ns) > 1) {
        def rootObjName:string (itemAt node.ns 0)
        def enumName:string (itemAt node.ns 1)
        def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
        if (!null? e) {
          wr.out(("" + (unwrap (get e.values enumName))) false)
          return
        }
      }
    }

    if ((array_length node.nsp) > 0) {
      def had_static:boolean false
      for node.nsp p:RangerAppParamDesc i {
        if (i == 0) {
          def part:string (itemAt node.ns 0)
          if(part == "this") {
            wr.out(thisName false)
            continue
          } 
        }        

        if (i > 0) {
          if had_static {
            wr.out("::" false)
          } {
            wr.out("." false)
          }
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
          }
          def part:string (itemAt node.ns 0)
          if ((part != "this") && (ctx.isMemberVariable(part))) {
            def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap uc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            if (!null? up) {
              if( false == (ctx.isInStatic()) ) {
                wr.out((thisName + ".") false)
              }               
            }
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType(p.compiledName)) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType(p.name)) false)
          } {
            wr.out((this.adjustType( (itemAt node.ns i))) false)
          }
        }
        if (p.isClass()) {
          had_static = true
        }
      }
      return
    }

    if node.hasParamDesc {
      def part:string (itemAt node.ns 0)
      if ((part != "this") && (ctx.isMemberVariable(part))) {
        def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def currC:RangerAppClassDesc (unwrap uc)
        def up@(optional):RangerAppParamDesc (currC.findVariable(part))
        if (!null? up) {
          if( false == (ctx.isInStatic()) ) {
            wr.out((thisName + ".") false)
          }
        }
      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }

    def b_was_static:boolean false
    for node.ns part:string i {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("::" false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        }
        if ((part != "this") && (ctx.hasCurrentClass())) {
          def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            if( false == (ctx.isInStatic()) ) {
              wr.out((thisName + ".") false)
            }
          }
        }
      }
      wr.out((this.adjustType(part)) false)
    }
  }
  fn writeStructField (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      wr.out((p.compiledName + " : ") false)
      def nameN:CodeNode (unwrap p.nameNode)
      this.writeTypeDef(nameN ctx wr)
      wr.out(", " true)
    }
  }
  fn writeVarDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      def map_or_hash:boolean ((nn.value_type == RangerNodeType.Array) || (nn.value_type == RangerNodeType.Hash))
      if (((p.set_cnt > 0) || p.is_class_variable) || map_or_hash) {
        wr.out((("let mut " + p.compiledName) + " : ") false)
      } {
        wr.out((("let mut " + p.compiledName) + " : ") false)
      }
      def nameN:CodeNode (unwrap p.nameNode)
      this.writeTypeDef(nameN ctx wr)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = Vec::new()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = HashMap::new()" false)
        }
      }
      wr.out(";" false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ " true)
      } {
        wr.newline()
      }
    }
  }
  fn writeArgsDef (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out((arg.name + " : ") false)
      def nameN:CodeNode (unwrap arg.nameNode)
      this.writeTypeDef(nameN ctx wr)
    }
  }
  fn writeFnCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      def part:string (itemAt fc.ns 0)
      if ((part != "this") && (ctx.isMemberVariable(part))) {
        def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        if (!null? uc) {
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            if( false == (ctx.isInStatic()) ) {
              wr.out((thisName + ".") false)
            }
          }
        }
      }
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      for node.fnDesc.params arg:RangerAppParamDesc i {
        def n@(optional):CodeNode (itemAt givenArgs.children i)
        if (i > 0) {
          wr.out(", " false)
        }
        if (null? n) {
          def nameN:CodeNode (unwrap arg.nameNode)
          def defVal@(optional):CodeNode (nameN.getFlag("default"))
          if (!null? defVal) {
            def defV:CodeNode (unwrap defVal)
            def fc2:CodeNode (defV.vref_annotation.getFirst())
            ctx.setInExpr()
            this.WalkNode(fc2 ctx wr)
            ctx.unsetInExpr()
          } {
            ctx.addError(node "Default argument was missing")
          }
          continue _
        }
        def nVal:CodeNode (unwrap n)
        ctx.setInExpr()
        this.WalkNode(nVal ctx wr)
        ctx.unsetInExpr()
      }
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
    }
  }
  fn writeNewCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(node.clDesc.name false)
      wr.out("::new(" false)
      def constr@(optional):RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        def c:RangerAppFunctionDesc (unwrap constr)
        for c.params arg:RangerAppParamDesc i {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(", " false)
          }
          this.WalkNode(n ctx wr)
        }
      }
      wr.out(")" false)
    }
  }
  fn writeClass (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def ucl@(optional):RangerAppClassDesc node.clDesc
    if (null? ucl) {
      return
    }
    def cl:RangerAppClassDesc (unwrap ucl)
    def wr:CodeWriter orig_wr
    wr.out((("struct " + cl.name) + " { ") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      def pnode:CodeNode (unwrap pvar.node)
      this.writeStructField(pnode ctx wr)
    }
    wr.indent(-1)
    wr.out("}" true)
    wr.out((("impl " + cl.name) + " { ") true)
    wr.indent(1)
    thisName = "me"
    wr.out("" true)
    wr.out("pub fn new(" false)
    if cl.has_constructor {
      def constr@(optional):RangerAppFunctionDesc cl.constructor_fn
      if (!null? constr) {
        def c:RangerAppFunctionDesc (unwrap constr)
        for c.params arg:RangerAppParamDesc i {
          if (i > 0) {
            wr.out(", " false)
          }
          wr.out((arg.name + " : ") false)
          def nameN:CodeNode (unwrap arg.nameNode)
          this.writeTypeDef(nameN ctx wr)
        }
      }
    }
    wr.out(((") ->  " + cl.name) + " {") true)
    wr.indent(1)
    wr.newline()
    wr.out((("let mut me = " + cl.name) + " { ") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      def nn@(optional):CodeNode pvar.node
      if (!null? nn) {
        def node:CodeNode (unwrap nn)
        if ((array_length node.children) > 2) {
          def valueNode:CodeNode (itemAt node.children 2)
          wr.out((pvar.name + ":") false)
          this.WalkNode(valueNode ctx wr)
          wr.out(", " true)
        } {
          ; Initialize array fields with Vec::new()
          if (pvar.isArray()) {
            wr.out((pvar.name + ": Vec::new(), ") true)
          }
        }
      }
    }
    wr.indent(-1)
    wr.out("};" true)
    wr.newline()
    if cl.has_constructor {
      def constr@(optional):RangerAppFunctionDesc cl.constructor_fn
      if (!null? constr) {
        def c:RangerAppFunctionDesc (unwrap constr)
        def subCtx@(optional):RangerAppWriterContext c.fnCtx
        if (!null? subCtx) {
          def sCtx:RangerAppWriterContext (unwrap subCtx)
          sCtx.is_function = true
          def fnB:CodeNode (unwrap c.fnBody)
          this.WalkNode(fnB sCtx wr)
        }
      }
    }
    wr.out("return me;" true)
    wr.indent(-1)
    wr.out("}" true)
    thisName = "self"
    for cl.static_methods variant:RangerAppFunctionDesc i {
      def vnn:CodeNode (unwrap variant.nameNode)
      if (vnn.hasFlag("main")) {
        continue _
      }
      wr.out((("pub fn " + variant.name) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") -> " false)
      this.writeTypeDef(vnn ctx wr)
      wr.out(" {" true)
      wr.indent(1)
      wr.newline()
      def subCtx@(optional):RangerAppWriterContext variant.fnCtx
      if (!null? subCtx) {
        def sCtx:RangerAppWriterContext (unwrap subCtx)
        sCtx.is_function = true
        def fnB:CodeNode (unwrap variant.fnBody)
        this.WalkNode(fnB sCtx wr)
      }
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out((("fn " + variant.name) + "(") false)
        wr.out("&mut self, " false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") -> " false)
        def vnn:CodeNode (unwrap variant.nameNode)
        this.writeTypeDef(vnn ctx wr)
        wr.out(" {" true)
        wr.indent(1)
        wr.newline()
        def subCtx@(optional):RangerAppWriterContext variant.fnCtx
        if (!null? subCtx) {
          def sCtx:RangerAppWriterContext (unwrap subCtx)
          sCtx.is_function = true
          def fnB:CodeNode (unwrap variant.fnBody)
          this.WalkNode(fnB sCtx wr)
        }
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      def nn:CodeNode (unwrap variant.nameNode)
      if (nn.hasFlag("main")) {
        wr.out("fn main() {" true)
        wr.indent(1)
        wr.newline()
        def subCtx@(optional):RangerAppWriterContext variant.fnCtx
        if (!null? subCtx) {
          def sCtx:RangerAppWriterContext (unwrap subCtx)
          sCtx.is_function = true
          def fnB:CodeNode (unwrap variant.fnBody)
          this.WalkNode(fnB sCtx wr)
        }
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
  }

  ; Custom operator handler for Rust - handles push with string conversion
  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref

    if (cmd == "push") {
      def left:CodeNode (node.getSecond())
      def right:CodeNode (node.getThird())
      
      ; Get the array type to check if it's a string array
      def arr_type:string ""
      if left.hasParamDesc {
        def pp:RangerAppParamDesc left.paramDesc
        arr_type = pp.nameNode.array_type
      }
      
      ; Write the push operation
      ctx.setInExpr()
      this.WalkNode(left ctx wr)
      wr.out(".push(" false)
      this.WalkNode(right ctx wr)
      
      ; Add .to_string() if pushing to a string array and the value is a string literal
      if (arr_type == "string") {
        if (right.value_type == RangerNodeType.String) {
          wr.out(".to_string()" false)
        }
      }
      ctx.unsetInExpr()
      wr.out(");" true)
      return
    }
  }
}

