
class RangerAppTodo  {
  
  constructor( ) {
    this.description = "";
    this.todonode;
  }
}
class RangerCompilerMessage  {
  
  constructor( ) {
    this.error_level = 0;     /** note: unused */
    this.code_line = 0;     /** note: unused */
    this.fileName = "";     /** note: unused */
    this.description = "";
    this.node;
  }
}
class RangerRefForce  {
  
  constructor( ) {
    this.strength = 0;
    this.lifetime = 1;
    this.changer;
  }
}
class RangerAppParamDesc  {
  
  constructor( ) {
    this.name = "";
    this.compiledName = "";
    this.debugString = "";
    this.ref_cnt = 0;
    this.init_cnt = 0;
    this.set_cnt = 0;
    this.return_cnt = 0;
    this.prop_assign_cnt = 0;     /** note: unused */
    this.value_type = 0;
    this.has_default = false;     /** note: unused */
    this.def_value;
    this.default_value;     /** note: unused */
    this.isThis = false;     /** note: unused */
    this.classDesc;     /** note: unused */
    this.fnDesc;     /** note: unused */
    this.ownerHistory = [];
    this.varType = 0;
    this.refType = 0;
    this.initRefType = 0;
    this.isParam;     /** note: unused */
    this.paramIndex = 0;     /** note: unused */
    this.is_optional = false;
    this.is_mutating = false;     /** note: unused */
    this.is_set = false;     /** note: unused */
    this.is_class_variable = false;
    this.node;
    this.nameNode;
    this.description = "";     /** note: unused */
    this.git_doc = "";     /** note: unused */
  }
  
  changeStrength(newStrength ,lifeTime ,changer ) {
    var entry = new RangerRefForce()
    entry.strength = newStrength;
    entry.lifetime = lifeTime;
    entry.changer = changer;
    this.ownerHistory.push(entry);
  }
  
  isProperty() {
    return true;
  }
  
  isClass() {
    return false;
  }
  
  doesInherit() {
    return false;
  }
  
  isAllocatedType() {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.eval_type != 0 ) {
        if ( this.nameNode.eval_type == 6 ) {
          return true;
        }
        if ( this.nameNode.eval_type == 7 ) {
          return true;
        }
        if ( (((this.nameNode.eval_type == 4) || (this.nameNode.eval_type == 2)) || (this.nameNode.eval_type == 5)) || (this.nameNode.eval_type == 3) ) {
          return false;
        }
        if ( this.nameNode.eval_type == 11 ) {
          return false;
        }
        return true;
      }
      if ( this.nameNode.eval_type == 11 ) {
        return false;
      }
      if ( this.nameNode.value_type == 9 ) {
        if ( false == this.nameNode.isPrimitive() ) {
          return true;
        }
      }
      if ( this.nameNode.value_type == 6 ) {
        return true;
      }
      if ( this.nameNode.value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  moveRefTo(node ,target ,ctx ) {
    if ( node.ref_change_done ) {
      return;
    }
    if ( false == target.isAllocatedType() ) {
      return;
    }
    if ( false == this.isAllocatedType() ) {
      return;
    }
    node.ref_change_done = true;
    var other_s = target.getStrength()
    var my_s = this.getStrength()
    var my_lifetime = this.getLifetime()
    var other_lifetime = target.getLifetime()
    var a_lives = false
    var b_lives = false
    var tmp_var = this.nameNode.hasFlag("temp")
    if ( typeof(target.nameNode) !== "undefined" ) {
      if ( target.nameNode.hasFlag("lives") ) {
        my_lifetime = 2;
        b_lives = true;
      }
    }
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.hasFlag("lives") ) {
        my_lifetime = 2;
        a_lives = true;
      }
    }
    if ( other_s > 0 ) {
      if ( my_s == 1 ) {
        var lt = my_lifetime
        if ( other_lifetime > my_lifetime ) {
          lt = other_lifetime;
        }
        this.changeStrength(0, lt, node);
      } else {
        if ( my_s == 0 ) {
          if ( tmp_var == false ) {
            ctx.addError(node, "Can not move a weak reference to a strong target, at " + node.getCode());
            console.log("can not move weak refs to strong target:")
            this.debugRefChanges();
          }
        } else {
          ctx.addError(node, "Can not move immutable reference to a strong target, evald type " + this.nameNode.eval_type_name);
        }
      }
    } else {
      if ( a_lives || b_lives ) {
      } else {
        if ( (my_lifetime < other_lifetime) && (this.return_cnt == 0) ) {
          if ( this.nameNode.hasFlag("returnvalue") == false ) {
            ctx.addError(node, "Can not create a weak reference if target has longer lifetime than original, current lifetime == " + my_lifetime);
          }
        }
      }
    }
  }
  
  originalStrength() {
    var len = this.ownerHistory.length
    if ( len > 0 ) {
      var firstEntry = this.ownerHistory[0]
      return firstEntry.strength;
    }
    return 1;
  }
  
  getLifetime() {
    var len_4 = this.ownerHistory.length
    if ( len_4 > 0 ) {
      var lastEntry = this.ownerHistory[(len_4 - 1)]
      return lastEntry.lifetime;
    }
    return 1;
  }
  
  getStrength() {
    var len_6 = this.ownerHistory.length
    if ( len_6 > 0 ) {
      var lastEntry_4 = this.ownerHistory[(len_6 - 1)]
      return lastEntry_4.strength;
    }
    return 1;
  }
  
  debugRefChanges() {
    console.log(("variable " + this.name) + " ref history : ")
    for ( var i = 0; i < this.ownerHistory.length; i++) {
      var h = this.ownerHistory[i];
      console.log(((" => change to " + h.strength) + " by ") + h.changer.getCode())
    }
  }
  
  pointsToObject(ctx ) {
    if ( typeof(this.nameNode) !== "undefined" ) {
      var is_primitive = false
      switch (this.nameNode.array_type ) { 
        case "string" : 
          is_primitive = true;
          break;
        case "int" : 
          is_primitive = true;
          break;
        case "boolean" : 
          is_primitive = true;
          break;
        case "double" : 
          is_primitive = true;
          break;
      }
      if ( is_primitive ) {
        return false;
      }
      if ( (this.nameNode.value_type == 6) || (this.nameNode.value_type == 7) ) {
        var is_object = true
        switch (this.nameNode.array_type ) { 
          case "string" : 
            is_object = false;
            break;
          case "int" : 
            is_object = false;
            break;
          case "boolean" : 
            is_object = false;
            break;
          case "double" : 
            is_object = false;
            break;
        }
        return is_object;
      }
      if ( this.nameNode.value_type == 9 ) {
        var is_object_8 = true
        switch (this.nameNode.type_name ) { 
          case "string" : 
            is_object_8 = false;
            break;
          case "int" : 
            is_object_8 = false;
            break;
          case "boolean" : 
            is_object_8 = false;
            break;
          case "double" : 
            is_object_8 = false;
            break;
        }
        if ( ctx.isEnumDefined(this.nameNode.type_name) ) {
          return false;
        }
        return is_object_8;
      }
    }
    return false;
  }
  
  isObject() {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 9 ) {
        if ( false == this.nameNode.isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  }
  
  isArray() {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 6 ) {
        return true;
      }
    }
    return false;
  }
  
  isHash() {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  isPrimitive() {
    if ( typeof(this.nameNode) !== "undefined" ) {
      return this.nameNode.isPrimitive();
    }
    return false;
  }
  
  getRefTypeName() {
    switch (this.refType ) { 
      case 0 : 
        return "NoType";
        break;
      case 1 : 
        return "Weak";
        break;
    }
    return "";
  }
  
  getVarTypeName() {
    switch (this.refType ) { 
      case 0 : 
        return "NoType";
        break;
      case 1 : 
        return "This";
        break;
    }
    return "";
  }
  
  getTypeName() {
    var s = this.nameNode.type_name
    return s;
  }
}
class RangerAppFunctionDesc  extends RangerAppParamDesc {
  
  constructor( ) {
    super()
    this.name = "";
    this.ref_cnt = 0;
    this.node;
    this.nameNode;
    this.fnBody;
    this.params = [];
    this.return_value;     /** note: unused */
    this.is_method = false;     /** note: unused */
    this.is_static = false;
    this.container_class;     /** note: unused */
    this.refType = 0;
    this.fnCtx;
  }
  
  isClass() {
    return false;
  }
  
  isProperty() {
    return false;
  }
}
class RangerAppMethodVariants  {
  
  constructor( ) {
    this.name = "";     /** note: unused */
    this.variants = [];
  }
}
class RangerAppInterfaceImpl  {
  
  constructor( ) {
    this.name = "";     /** note: unused */
    this.typeParams;     /** note: unused */
  }
}
class RangerAppClassDesc  extends RangerAppParamDesc {
  
  constructor( ) {
    super()
    this.name = "";
    this.is_system = false;
    this.compiledName = "";     /** note: unused */
    this.systemNames = {};
    this.systemInfo;     /** note: unused */
    this.is_interface = false;     /** note: unused */
    this.is_template = false;     /** note: unused */
    this.generic_params;     /** note: unused */
    this.ctx;
    this.variables = [];
    this.methods = [];
    this.defined_methods = {};
    this.static_methods = [];
    this.defined_static_methods = {};
    this.defined_variants = [];
    this.method_variants = {};
    this.has_constructor = false;
    this.constructor_node;
    this.constructor_fn;
    this.has_destructor = false;     /** note: unused */
    this.destructor_node;     /** note: unused */
    this.destructor_fn;     /** note: unused */
    this.extends_classes = [];
    this.implements_interfaces = [];     /** note: unused */
    this.nameNode;
    this.classNode;
    this.contr_writers = [];     /** note: unused */
    this.is_inherited = false;
  }
  
  isClass() {
    return true;
  }
  
  isProperty() {
    return false;
  }
  
  doesInherit() {
    return this.is_inherited;
  }
  
  isSameOrParentClass(class_name ,ctx ) {
    if ( class_name == this.name ) {
      return true;
    }
    if ( (this.extends_classes.indexOf(class_name)) >= 0 ) {
      return true;
    }
    for ( var i_2 = 0; i_2 < this.extends_classes.length; i_2++) {
      var c_name = this.extends_classes[i_2];
      var c = ctx.findClass(c_name)
      if ( c.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    return false;
  }
  
  hasMethod(m_name ) {
    if ( typeof(this.defined_methods[m_name] ) != "undefined" ) {
      return true;
    }
    for ( var i_5 = 0; i_5 < this.extends_classes.length; i_5++) {
      var cname = this.extends_classes[i_5];
      var cDesc = this.ctx.findClass(cname)
      if ( cDesc.hasMethod(m_name) ) {
        return cDesc.hasMethod(m_name);
      }
    }
    return false;
  }
  
  findMethod(f_name ) {
    var res
    for ( var i_7 = 0; i_7 < this.methods.length; i_7++) {
      var m = this.methods[i_7];
      if ( m.name == f_name ) {
        res = m;
        return res;
      }
    }
    for ( var i_11 = 0; i_11 < this.extends_classes.length; i_11++) {
      var cname_4 = this.extends_classes[i_11];
      var cDesc_4 = this.ctx.findClass(cname_4)
      if ( cDesc_4.hasMethod(f_name) ) {
        return cDesc_4.findMethod(f_name);
      }
    }
    return res;
  }
  
  hasStaticMethod(m_name ) {
    return typeof(this.defined_static_methods[m_name] ) != "undefined";
  }
  
  findStaticMethod(f_name ) {
    var e
    for ( var i_11 = 0; i_11 < this.static_methods.length; i_11++) {
      var m_4 = this.static_methods[i_11];
      if ( m_4.name == f_name ) {
        e = m_4;
        return e;
      }
    }
    for ( var i_15 = 0; i_15 < this.extends_classes.length; i_15++) {
      var cname_6 = this.extends_classes[i_15];
      var cDesc_6 = this.ctx.findClass(cname_6)
      if ( cDesc_6.hasStaticMethod(f_name) ) {
        return cDesc_6.findStaticMethod(f_name);
      }
    }
    return e;
  }
  
  findVariable(f_name ) {
    var e_4
    for ( var i_15 = 0; i_15 < this.variables.length; i_15++) {
      var m_6 = this.variables[i_15];
      if ( m_6.name == f_name ) {
        e_4 = m_6;
        return e_4;
      }
    }
    for ( var i_19 = 0; i_19 < this.extends_classes.length; i_19++) {
      var cname_8 = this.extends_classes[i_19];
      var cDesc_8 = this.ctx.findClass(cname_8)
      return cDesc_8.findVariable(f_name);
    }
    return e_4;
  }
  
  addParentClass(p_name ) {
    this.extends_classes.push(p_name);
  }
  
  addVariable(desc ) {
    this.variables.push(desc);
  }
  
  addMethod(desc ) {
    this.defined_methods[desc.name] = true
    this.methods.push(desc);
    var defVs = this.method_variants[desc.name]
    if ( typeof(defVs) === "undefined" ) {
      var new_v = new RangerAppMethodVariants()
      this.method_variants[desc.name] = new_v
      this.defined_variants.push(desc.name);
      new_v.variants.push(desc);
    } else {
      var new_v2 = defVs
      new_v2.variants.push(desc);
    }
  }
  
  addStaticMethod(desc ) {
    this.defined_static_methods[desc.name] = true
    this.static_methods.push(desc);
  }
}
class RangerTypeClass  {
  
  constructor( ) {
    this.name = "";     /** note: unused */
    this.compiledName = "";     /** note: unused */
    this.value_type = 0;     /** note: unused */
    this.type_name;     /** note: unused */
    this.key_type;     /** note: unused */
    this.array_type;     /** note: unused */
    this.is_primitive = false;     /** note: unused */
    this.is_mutable = false;     /** note: unused */
    this.is_optional = false;     /** note: unused */
    this.is_generic = false;     /** note: unused */
    this.is_lambda = false;     /** note: unused */
    this.nameNode;     /** note: unused */
    this.templateParams;     /** note: unused */
  }
}
class SourceCode  {
  
  constructor(code_str  ) {
    this.code = "";
    this.sp = 0;     /** note: unused */
    this.ep = 0;     /** note: unused */
    this.lines = [];
    this.filename = "";
    this.code = code_str;
    this.lines = code_str.split("\n");
  }
  
  getLineString(line_index ) {
    if ( (this.lines.length) > line_index ) {
      return this.lines[line_index];
    }
    return "";
  }
  
  getLine(sp ) {
    var cnt = 0
    for ( var i_10 = 0; i_10 < this.lines.length; i_10++) {
      var str = this.lines[i_10];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        return i_10;
      }
    }
    return -1;
  }
}
class CodeNode  {
  
  constructor(source ,start ,end  ) {
    this.code;
    this.sp = 0;
    this.ep = 0;
    this.has_operator = false;
    this.op_index = 0;
    this.is_system_class = false;
    this.mutable_def = false;
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.infix_operator = false;
    this.infix_node;
    this.infix_subnode = false;
    this.operator_pred = 0;
    this.to_the_right = false;
    this.right_node;
    this.type_type = "";
    this.type_name = "";
    this.key_type = "";
    this.array_type = "";
    this.ns = [];
    this.nsp = [];
    this.has_vref_annotation = false;
    this.vref_annotation;
    this.has_type_annotation = false;
    this.type_annotation;
    this.typeClass;
    this.value_type = 0;
    this.eval_type = 0;
    this.eval_type_name = "";
    this.eval_key_type = "";
    this.eval_array_type = "";
    this.flow_done = false;
    this.ref_change_done = false;
    this.eval_type_node;     /** note: unused */
    this.ref_type = 0;
    this.ref_need_assign = 0;     /** note: unused */
    this.double_value = 0;
    this.string_value = "";
    this.int_value = 0;
    this.boolean_value = false;
    this.expression_value;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.parent;
    this.didReturnAtIndex = -1;
    this.hasVarDef = false;
    this.hasClassDescription = false;
    this.hasNewOper = false;
    this.clDesc;
    this.hasFnCall = false;
    this.fnDesc;
    this.hasParamDesc = false;
    this.paramDesc;
    this.ownParamDesc;
    this.evalCtx;
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  
  getParsedString() {
    return this.code.code.substring(this.sp, this.ep );
  }
  
  rebuildWithType(match ,changeVref ) {
    var newNode = new CodeNode(this.code, this.sp, this.ep)
    newNode.has_operator = this.has_operator;
    newNode.op_index = this.op_index;
    newNode.mutable_def = this.mutable_def;
    newNode.expression = this.expression;
    if ( changeVref ) {
      newNode.vref = match.getTypeName(this.vref);
    } else {
      newNode.vref = this.vref;
    }
    newNode.is_block_node = this.is_block_node;
    newNode.type_type = match.getTypeName(this.type_type);
    newNode.type_name = match.getTypeName(this.type_name);
    newNode.key_type = match.getTypeName(this.key_type);
    newNode.array_type = match.getTypeName(this.array_type);
    newNode.value_type = this.value_type;
    if ( this.has_vref_annotation ) {
      newNode.has_vref_annotation = true;
      var ann = this.vref_annotation
      newNode.vref_annotation = ann.rebuildWithType(match, true);
    }
    if ( this.has_type_annotation ) {
      newNode.has_type_annotation = true;
      var t_ann = this.type_annotation
      newNode.type_annotation = t_ann.rebuildWithType(match, true);
    }
    for ( var i_11 = 0; i_11 < this.ns.length; i_11++) {
      var n = this.ns[i_11];
      newNode.ns.push(n);
    }
    switch (this.value_type ) { 
      case 2 : 
        newNode.double_value = this.double_value;
        break;
      case 4 : 
        newNode.string_value = this.string_value;
        break;
      case 3 : 
        newNode.int_value = this.int_value;
        break;
      case 5 : 
        newNode.boolean_value = this.boolean_value;
        break;
      case 15 : 
        if ( typeof(this.expression_value) !== "undefined" ) {
          newNode.expression_value = this.expression_value.rebuildWithType(match, changeVref);
        }
        break;
    }
    for ( var i_16 = 0; i_16 < this.prop_keys.length; i_16++) {
      var key = this.prop_keys[i_16];
      newNode.prop_keys.push(key);
      var oldp = this.props[key]
      var np = oldp.rebuildWithType(match, changeVref)
      newNode.props[key] = np
    }
    for ( var i_19 = 0; i_19 < this.children.length; i_19++) {
      var ch = this.children[i_19];
      var newCh = ch.rebuildWithType(match, changeVref)
      newCh.parent = newNode;
      newNode.children.push(newCh);
    }
    return newNode;
  }
  
  buildTypeSignatureUsingMatch(match ) {
    var tName = match.getTypeName(this.type_name)
    switch (tName ) { 
      case "double" : 
        return "double";
        break;
      case "string" : 
        return "string";
        break;
      case "integer" : 
        return "int";
        break;
      case "boolean" : 
        return "boolean";
        break;
    }
    var s_2 = ""
    if ( this.value_type == 6 ) {
      s_2 = s_2 + "[";
      s_2 = s_2 + match.getTypeName(this.array_type);
      s_2 = s_2 + this.getTypeSignatureWithMatch(match);
      s_2 = s_2 + "]";
      return s_2;
    }
    if ( this.value_type == 7 ) {
      s_2 = s_2 + "[";
      s_2 = s_2 + match.getTypeName(this.key_type);
      s_2 = s_2 + ":";
      s_2 = s_2 + match.getTypeName(this.array_type);
      s_2 = s_2 + this.getTypeSignatureWithMatch(match);
      s_2 = s_2 + "]";
      return s_2;
    }
    s_2 = match.getTypeName(this.type_name);
    s_2 = s_2 + this.getVRefSignatureWithMatch(match);
    return s_2;
  }
  
  buildTypeSignature() {
    switch (this.value_type ) { 
      case 2 : 
        return "double";
        break;
      case 4 : 
        return "string";
        break;
      case 3 : 
        return "int";
        break;
      case 5 : 
        return "boolean";
        break;
      case 12 : 
        return "char";
        break;
      case 13 : 
        return "charbuffer";
        break;
    }
    var s_5 = ""
    if ( this.value_type == 6 ) {
      s_5 = s_5 + "[";
      s_5 = s_5 + this.array_type;
      s_5 = s_5 + this.getTypeSignature();
      s_5 = s_5 + "]";
      return s_5;
    }
    if ( this.value_type == 7 ) {
      s_5 = s_5 + "[";
      s_5 = s_5 + this.key_type;
      s_5 = s_5 + ":";
      s_5 = s_5 + this.array_type;
      s_5 = s_5 + this.getTypeSignature();
      s_5 = s_5 + "]";
      return s_5;
    }
    s_5 = this.type_name;
    s_5 = s_5 + this.getVRefSignature();
    return s_5;
  }
  
  getVRefSignatureWithMatch(match ) {
    if ( this.has_vref_annotation ) {
      var nn = this.vref_annotation.rebuildWithType(match, true)
      return "@" + nn.getCode();
    }
    return "";
  }
  
  getVRefSignature() {
    if ( this.has_vref_annotation ) {
      return "@" + this.vref_annotation.getCode();
    }
    return "";
  }
  
  getTypeSignatureWithMatch(match ) {
    if ( this.has_type_annotation ) {
      var nn_4 = this.type_annotation.rebuildWithType(match, true)
      return "@" + nn_4.getCode();
    }
    return "";
  }
  
  getTypeSignature() {
    if ( this.has_type_annotation ) {
      return "@" + this.type_annotation.getCode();
    }
    return "";
  }
  
  getFilename() {
    return this.code.filename;
  }
  
  getFlag(flagName ) {
    var res_2
    if ( false == this.has_vref_annotation ) {
      return res_2;
    }
    for ( var i_18 = 0; i_18 < this.vref_annotation.children.length; i_18++) {
      var ch_4 = this.vref_annotation.children[i_18];
      if ( ch_4.vref == flagName ) {
        res_2 = ch_4;
        return res_2;
      }
    }
    return res_2;
  }
  
  hasFlag(flagName ) {
    if ( false == this.has_vref_annotation ) {
      return false;
    }
    for ( var i_20 = 0; i_20 < this.vref_annotation.children.length; i_20++) {
      var ch_6 = this.vref_annotation.children[i_20];
      if ( ch_6.vref == flagName ) {
        return true;
      }
    }
    return false;
  }
  
  setFlag(flagName ) {
    if ( false == this.has_vref_annotation ) {
      this.vref_annotation = new CodeNode(this.code, this.sp, this.ep);
    }
    if ( this.hasFlag(flagName) ) {
      return;
    }
    var flag = new CodeNode(this.code, this.sp, this.ep)
    flag.vref = flagName;
    flag.value_type = 9;
    this.vref_annotation.children.push(flag);
    this.has_vref_annotation = true;
  }
  
  getTypeInformationString() {
    var s_7 = ""
    if ( (this.vref.length) > 0 ) {
      s_7 = ((s_7 + "<vref:") + this.vref) + ">";
    } else {
      s_7 = s_7 + "<no.vref>";
    }
    if ( (this.type_name.length) > 0 ) {
      s_7 = ((s_7 + "<type_name:") + this.type_name) + ">";
    } else {
      s_7 = s_7 + "<no.type_name>";
    }
    if ( (this.array_type.length) > 0 ) {
      s_7 = ((s_7 + "<array_type:") + this.array_type) + ">";
    } else {
      s_7 = s_7 + "<no.array_type>";
    }
    if ( (this.key_type.length) > 0 ) {
      s_7 = ((s_7 + "<key_type:") + this.key_type) + ">";
    } else {
      s_7 = s_7 + "<no.key_type>";
    }
    switch (this.value_type ) { 
      case 5 : 
        s_7 = s_7 + "<value_type=Boolean>";
        break;
      case 4 : 
        s_7 = s_7 + "<value_type=String>";
        break;
    }
    return s_7;
  }
  
  getLine() {
    return this.code.getLine(this.sp);
  }
  
  getLineString(line_index ) {
    return this.code.getLineString(line_index);
  }
  
  getLineAsString() {
    var idx = this.getLine()
    var line_name_idx = idx + 1
    return (((this.getFilename() + ", line ") + line_name_idx) + " : ") + this.code.getLineString(idx);
  }
  
  getPositionalString() {
    if ( (this.ep > this.sp) && ((this.ep - this.sp) < 50) ) {
      var start = this.sp
      var end = this.ep
      start = start - 100;
      end = end + 50;
      if ( start < 0 ) {
        start = 0;
      }
      if ( end >= (this.code.code.length) ) {
        end = (this.code.code.length) - 1;
      }
      return this.code.code.substring(start, end );
    }
    return "";
  }
  
  copyEvalResFrom(node ) {
    if ( node.hasParamDesc ) {
      this.hasParamDesc = node.hasParamDesc;
      this.paramDesc = node.paramDesc;
    }
    if ( typeof(node.typeClass) !== "undefined" ) {
      this.typeClass = node.typeClass;
    }
    this.eval_type = node.eval_type;
    this.eval_type_name = node.eval_type_name;
    if ( node.hasFlag("optional") ) {
      this.setFlag("optional");
    }
    if ( node.value_type == 7 ) {
      this.eval_key_type = node.eval_key_type;
      this.eval_array_type = node.eval_array_type;
      this.eval_type = 7;
    }
    if ( node.value_type == 6 ) {
      this.eval_key_type = node.eval_key_type;
      this.eval_array_type = node.eval_array_type;
      this.eval_type = 6;
    }
  }
  
  defineNodeTypeTo(node ,ctx ) {
    switch (this.type_name ) { 
      case "double" : 
        node.value_type = 2;
        node.eval_type = 2;
        node.eval_type_name = "double";
        break;
      case "int" : 
        node.value_type = 3;
        node.eval_type = 3;
        node.eval_type_name = "int";
        break;
      case "char" : 
        node.value_type = 12;
        node.eval_type = 12;
        node.eval_type_name = "char";
        break;
      case "charbuffer" : 
        node.value_type = 13;
        node.eval_type = 13;
        node.eval_type_name = "charbuffer";
        break;
      case "string" : 
        node.value_type = 4;
        node.eval_type = 4;
        node.eval_type_name = "string";
        break;
      case "boolean" : 
        node.value_type = 5;
        node.eval_type = 5;
        node.eval_type_name = "string";
        break;
      default: 
        if ( true == this.expression ) {
          node.value_type = 15;
          node.eval_type = 15;
          node.expression = true;
        }
        if ( this.value_type == 6 ) {
          node.value_type = 6;
          node.eval_type = 6;
          node.eval_type_name = this.type_name;
          node.eval_array_type = this.array_type;
        }
        if ( this.value_type == 7 ) {
          node.value_type = 7;
          node.eval_type = 7;
          node.eval_type_name = this.type_name;
          node.eval_array_type = this.array_type;
          node.key_type = this.key_type;
        }
        if ( this.value_type == 11 ) {
          node.value_type = 11;
          node.eval_type = 11;
          node.eval_type_name = this.type_name;
        }
        if ( this.value_type == 9 ) {
          if ( ctx.isEnumDefined(this.type_name) ) {
            node.value_type = 11;
            node.eval_type = 11;
            node.eval_type_name = this.type_name;
          }
          if ( ctx.isDefinedClass(this.type_name) ) {
            node.value_type = 8;
            node.eval_type = 8;
            node.eval_type_name = this.type_name;
          }
        }
        break;
    }
  }
  
  typeNameAsType(ctx ) {
    switch (this.type_name ) { 
      case "double" : 
        return 2;
        break;
      case "int" : 
        return 3;
        break;
      case "string" : 
        return 4;
        break;
      case "boolean" : 
        return 5;
        break;
      case "char" : 
        return 12;
        break;
      case "charbuffer" : 
        return 13;
        break;
      default: 
        if ( true == this.expression ) {
          return 15;
        }
        if ( this.value_type == 9 ) {
          if ( ctx.isEnumDefined(this.type_name) ) {
            return 11;
          }
          if ( ctx.isDefinedClass(this.type_name) ) {
            return 8;
          }
        }
        break;
    }
    return this.value_type;
  }
  
  isPrimitive() {
    if ( (((((this.value_type == 2) || (this.value_type == 4)) || (this.value_type == 3)) || (this.value_type == 12)) || (this.value_type == 13)) || (this.value_type == 5) ) {
      return true;
    }
    return false;
  }
  
  isPrimitiveType() {
    var tn = this.type_name
    if ( (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") ) {
      return true;
    }
    return false;
  }
  
  isAPrimitiveType() {
    var tn_4 = this.type_name
    if ( (this.value_type == 6) || (this.value_type == 7) ) {
      tn_4 = this.array_type;
    }
    if ( (((((tn_4 == "double") || (tn_4 == "string")) || (tn_4 == "int")) || (tn_4 == "char")) || (tn_4 == "charbuffer")) || (tn_4 == "boolean") ) {
      return true;
    }
    return false;
  }
  
  getFirst() {
    return this.children[0];
  }
  
  getSecond() {
    return this.children[1];
  }
  
  getThird() {
    return this.children[2];
  }
  
  isSecondExpr() {
    if ( (this.children.length) > 1 ) {
      var second = this.children[1]
      if ( second.expression ) {
        return true;
      }
    }
    return false;
  }
  
  getOperator() {
    var s_9 = ""
    if ( (this.children.length) > 0 ) {
      var fc = this.children[0]
      if ( fc.value_type == 9 ) {
        return fc.vref;
      }
    }
    return s_9;
  }
  
  getVRefAt(idx ) {
    var s_11 = ""
    if ( (this.children.length) > idx ) {
      var fc_4 = this.children[idx]
      return fc_4.vref;
    }
    return s_11;
  }
  
  getStringAt(idx ) {
    var s_13 = ""
    if ( (this.children.length) > idx ) {
      var fc_6 = this.children[idx]
      if ( fc_6.value_type == 4 ) {
        return fc_6.string_value;
      }
    }
    return s_13;
  }
  
  hasExpressionProperty(name ) {
    var ann_4 = this.props[name]
    if ( typeof(ann_4) !== "undefined" ) {
      return ann_4.expression;
    }
    return false;
  }
  
  getExpressionProperty(name ) {
    var ann_6 = this.props[name]
    if ( typeof(ann_6) !== "undefined" ) {
      return ann_6;
    }
    return ann_6;
  }
  
  hasIntProperty(name ) {
    var ann_8 = this.props[name]
    if ( typeof(ann_8) !== "undefined" ) {
      var fc_8 = ann_8.children[0]
      if ( fc_8.value_type == 3 ) {
        return true;
      }
    }
    return false;
  }
  
  getIntProperty(name ) {
    var ann_10 = this.props[name]
    if ( typeof(ann_10) !== "undefined" ) {
      var fc_10 = ann_10.children[0]
      if ( fc_10.value_type == 3 ) {
        return fc_10.int_value;
      }
    }
    return 0;
  }
  
  hasDoubleProperty(name ) {
    var ann_12 = this.props[name]
    if ( typeof(ann_12) !== "undefined" ) {
      if ( ann_12.value_type == 2 ) {
        return true;
      }
    }
    return false;
  }
  
  getDoubleProperty(name ) {
    var ann_14 = this.props[name]
    if ( typeof(ann_14) !== "undefined" ) {
      if ( ann_14.value_type == 2 ) {
        return ann_14.double_value;
      }
    }
    return 0;
  }
  
  hasStringProperty(name ) {
    if ( false == (typeof(this.props[name] ) != "undefined") ) {
      return false;
    }
    var ann_16 = this.props[name]
    if ( typeof(ann_16) !== "undefined" ) {
      if ( ann_16.value_type == 4 ) {
        return true;
      }
    }
    return false;
  }
  
  getStringProperty(name ) {
    var ann_18 = this.props[name]
    if ( typeof(ann_18) !== "undefined" ) {
      if ( ann_18.value_type == 4 ) {
        return ann_18.string_value;
      }
    }
    return "";
  }
  
  hasBooleanProperty(name ) {
    var ann_20 = this.props[name]
    if ( typeof(ann_20) !== "undefined" ) {
      if ( ann_20.value_type == 5 ) {
        return true;
      }
    }
    return false;
  }
  
  getBooleanProperty(name ) {
    var ann_22 = this.props[name]
    if ( typeof(ann_22) !== "undefined" ) {
      if ( ann_22.value_type == 5 ) {
        return ann_22.boolean_value;
      }
    }
    return false;
  }
  
  isFirstTypeVref(vrefName ) {
    if ( (this.children.length) > 0 ) {
      var fc_12 = this.children[0]
      if ( fc_12.value_type == 9 ) {
        return true;
      }
    }
    return false;
  }
  
  isFirstVref(vrefName ) {
    if ( (this.children.length) > 0 ) {
      var fc_14 = this.children[0]
      if ( fc_14.vref == vrefName ) {
        return true;
      }
    }
    return false;
  }
  
  getString() {
    return this.code.code.substring(this.sp, this.ep );
  }
  
  writeCode(wr ) {
    switch (this.value_type ) { 
      case 2 : 
        wr.out((this.double_value.toString()), false);
        break;
      case 4 : 
        wr.out(((String.fromCharCode(34)) + this.string_value) + (String.fromCharCode(34)), false);
        break;
      case 3 : 
        wr.out("" + this.int_value, false);
        break;
      case 5 : 
        if ( this.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    }
  }
  
  getCode() {
    var wr = new CodeWriter()
    this.writeCode(wr);
    return wr.getCode();
  }
  
  walk() {
    switch (this.value_type ) { 
      case 2 : 
        console.log("Double : " + this.double_value)
        break;
      case 4 : 
        console.log("String : " + this.string_value)
        break;
    }
    if ( this.expression ) {
      console.log("(")
    } else {
      console.log(this.code.code.substring(this.sp, this.ep ))
    }
    for ( var i_22 = 0; i_22 < this.children.length; i_22++) {
      var item = this.children[i_22];
      item.walk();
    }
    if ( this.expression ) {
      console.log(")")
    }
  }
}
class AfterCodeNode  {
  
  constructor( ) {
    this.ff = 0;     /** note: unused */
  }
}
class RangerNodeValue  {
  
  constructor( ) {
    this.double_value;     /** note: unused */
    this.string_value;     /** note: unused */
    this.int_value;     /** note: unused */
    this.boolean_value;     /** note: unused */
    this.expression_value;     /** note: unused */
  }
}
class RangerBackReference  {
  
  constructor( ) {
    this.from_class;     /** note: unused */
    this.var_name;     /** note: unused */
    this.ref_type;     /** note: unused */
  }
}
class RangerAppEnum  {
  
  constructor( ) {
    this.name = "";     /** note: unused */
    this.cnt = 0;
    this.values = {};
    this.node;     /** note: unused */
  }
  
  add(n ) {
    this.values[n] = this.cnt
    this.cnt = this.cnt + 1;
  }
}
class OpFindResult  {
  
  constructor( ) {
    this.did_find = false;     /** note: unused */
    this.node;     /** note: unused */
  }
}
class RangerAppWriterContext  {
  
  constructor( ) {
    this.langOperators;
    this.stdCommands;
    this.intRootCounter = 1;     /** note: unused */
    this.targetLangName = "";
    this.ctx;     /** note: unused */
    this.parent;
    this.defined_imports = [];     /** note: unused */
    this.already_imported = {};
    this.fileSystem;
    this.is_function = false;
    this.is_block = false;     /** note: unused */
    this.has_block_exited = false;     /** note: unused */
    this.in_expression = false;     /** note: unused */
    this.expr_stack = [];
    this.expr_restart = false;
    this.in_method = false;     /** note: unused */
    this.method_stack = [];
    this.typeNames = [];     /** note: unused */
    this.typeClasses = {};     /** note: unused */
    this.currentClassName;     /** note: unused */
    this.in_class = false;
    this.in_static_method = false;
    this.currentClass;
    this.currentMethod;
    this.thisName = "this";
    this.definedEnums = {};
    this.definedInterfaces = {};     /** note: unused */
    this.definedInterfaceList = [];     /** note: unused */
    this.definedClasses = {};
    this.definedClassList = [];
    this.templateClassNodes = {};
    this.templateClassList = [];
    this.classSignatures = {};
    this.classToSignature = {};
    this.templateClasses = {};     /** note: unused */
    this.classStaticWriters = {};
    this.localVariables = {};
    this.localVarNames = [];
    this.compilerFlags = {};
    this.compilerSettings = {};
    this.parserErrors = [];
    this.compilerErrors = [];
    this.compilerMessages = [];
    this.compilerLog = {};     /** note: unused */
    this.todoList = [];
    this.definedMacro = {};     /** note: unused */
    this.defCounts = {};
  }
  
  initStdCommands() {
    if ( typeof(this.stdCommands) !== "undefined" ) {
      return true;
    }
    if ( typeof(this.langOperators) === "undefined" ) {
      return true;
    }
    var main = this.langOperators
    var lang
    for ( var i_17 = 0; i_17 < main.children.length; i_17++) {
      var m_4 = main.children[i_17];
      var fc_8 = m_4.getFirst()
      if ( fc_8.vref == "language" ) {
        lang = m_4;
      }
    }
    /** unused:  var cmds   **/ 
    var langNodes = lang.children[1]
    for ( var i_22 = 0; i_22 < langNodes.children.length; i_22++) {
      var lch = langNodes.children[i_22];
      var fc_13 = lch.getFirst()
      if ( fc_13.vref == "commands" ) {
        /** unused:  var n_2 = lch.getSecond()   **/ 
        this.stdCommands = lch.getSecond();
      }
    }
    return true;
  }
  
  transformTypeName(typeName ) {
    if ( this.isPrimitiveType(typeName) ) {
      return typeName;
    }
    if ( this.isEnumDefined(typeName) ) {
      return typeName;
    }
    if ( this.isDefinedClass(typeName) ) {
      var cl = this.findClass(typeName)
      if ( cl.is_system ) {
        return (cl.systemNames[this.getTargetLang()]);
      }
    }
    return typeName;
  }
  
  isPrimitiveType(typeName ) {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    return false;
  }
  
  isDefinedType(typeName ) {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    if ( this.isEnumDefined(typeName) ) {
      return true;
    }
    if ( this.isDefinedClass(typeName) ) {
      return true;
    }
    return false;
  }
  
  hadValidType(node ) {
    if ( node.isPrimitiveType() || node.isPrimitive() ) {
      return true;
    }
    if ( (node.value_type == 6) && this.isDefinedType(node.array_type) ) {
      return true;
    }
    if ( ((node.value_type == 7) && this.isDefinedType(node.array_type)) && this.isPrimitiveType(node.key_type) ) {
      return true;
    }
    if ( this.isDefinedType(node.type_name) ) {
      return true;
    }
    this.addError(node, (((("Invalid or missing type definition: " + node.type_name) + " ") + node.key_type) + " ") + node.array_type);
    return false;
  }
  
  getTargetLang() {
    if ( (this.targetLangName.length) > 0 ) {
      return this.targetLangName;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.getTargetLang();
    }
    return "ranger";
  }
  
  findOperator(node ) {
    var root = this.getRoot()
    root.initStdCommands();
    return root.stdCommands.children[node.op_index];
  }
  
  getStdCommands() {
    var root_4 = this.getRoot()
    root_4.initStdCommands();
    return root_4.stdCommands;
  }
  
  findClassWithSign(node ) {
    var root_6 = this.getRoot()
    var tplArgs = node.vref_annotation
    var sign = node.vref + tplArgs.getCode()
    var theName = root_6.classSignatures[sign]
    return this.findClass((theName));
  }
  
  createSignature(origClass ,classSig ) {
    if ( typeof(this.classSignatures[classSig] ) != "undefined" ) {
      return (this.classSignatures[classSig]);
    }
    var ii = 1
    var sigName = (origClass + "V") + ii
    while (typeof(this.classToSignature[sigName] ) != "undefined") {
      ii = ii + 1;
      sigName = (origClass + "V") + ii;
    }
    this.classToSignature[sigName] = classSig
    this.classSignatures[classSig] = sigName
    return sigName;
  }
  
  createOperator(fromNode ) {
    var root_8 = this.getRoot()
    if ( root_8.initStdCommands() ) {
      root_8.stdCommands.children.push(fromNode);
      /** unused:  var fc_13 = fromNode.children[0]   **/ 
    }
  }
  
  getFileWriter(path ,fileName ) {
    var root_10 = this.getRoot()
    var fs = root_10.fileSystem
    var file = fs.getFile(path, fileName)
    var wr_2
    wr_2 = file.getWriter();
    return wr_2;
  }
  
  addTodo(node ,descr ) {
    var e_3 = new RangerAppTodo()
    e_3.description = descr;
    e_3.todonode = node;
    var root_12 = this.getRoot()
    root_12.todoList.push(e_3);
  }
  
  setThisName(the_name ) {
    var root_14 = this.getRoot()
    root_14.thisName = the_name;
  }
  
  getThisName() {
    var root_16 = this.getRoot()
    return root_16.thisName;
  }
  
  printLogs(logName ) {
  }
  
  log(node ,logName ,descr ) {
  }
  
  addMessage(node ,descr ) {
    var e_6 = new RangerCompilerMessage()
    e_6.description = descr;
    e_6.node = node;
    var root_18 = this.getRoot()
    root_18.compilerMessages.push(e_6);
  }
  
  addError(targetnode ,descr ) {
    var e_8 = new RangerCompilerMessage()
    e_8.description = descr;
    e_8.node = targetnode;
    var root_20 = this.getRoot()
    root_20.compilerErrors.push(e_8);
  }
  
  addParserError(targetnode ,descr ) {
    var e_10 = new RangerCompilerMessage()
    e_10.description = descr;
    e_10.node = targetnode;
    var root_22 = this.getRoot()
    root_22.parserErrors.push(e_10);
  }
  
  addTemplateClass(name ,node ) {
    var root_24 = this.getRoot()
    root_24.templateClassList.push(name);
    root_24.templateClassNodes[name] = node
  }
  
  hasTemplateNode(name ) {
    var root_26 = this.getRoot()
    return typeof(root_26.templateClassNodes[name] ) != "undefined";
  }
  
  findTemplateNode(name ) {
    var root_28 = this.getRoot()
    return (root_28.templateClassNodes[name]);
  }
  
  setStaticWriter(className ,writer ) {
    var root_30 = this.getRoot()
    root_30.classStaticWriters[className] = writer
  }
  
  getStaticWriter(className ) {
    var root_32 = this.getRoot()
    return (root_32.classStaticWriters[className]);
  }
  
  isEnumDefined(n ) {
    if ( typeof(this.definedEnums[n] ) != "undefined" ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isEnumDefined(n);
  }
  
  getEnum(n ) {
    if ( typeof(this.definedEnums[n] ) != "undefined" ) {
      return this.definedEnums[n];
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getEnum(n);
    }
    var none
    return none;
  }
  
  isVarDefined(name ) {
    if ( typeof(this.localVariables[name] ) != "undefined" ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isVarDefined(name);
  }
  
  setCompilerFlag(name ,value ) {
    this.compilerFlags[name] = value
  }
  
  hasCompilerFlag(s_name ) {
    if ( typeof(this.compilerFlags[s_name] ) != "undefined" ) {
      return (this.compilerFlags[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerFlag(s_name);
  }
  
  getCompilerSetting(s_name ) {
    if ( typeof(this.compilerSettings[s_name] ) != "undefined" ) {
      return (this.compilerSettings[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return "";
    }
    return this.parent.getCompilerSetting(s_name);
  }
  
  hasCompilerSetting(s_name ) {
    if ( typeof(this.compilerSettings[s_name] ) != "undefined" ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerSetting(s_name);
  }
  
  getVariableDef(name ) {
    if ( typeof(this.localVariables[name] ) != "undefined" ) {
      return (this.localVariables[name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      var tmp = new RangerAppParamDesc()
      return tmp;
    }
    return this.parent.getVariableDef(name);
  }
  
  findFunctionCtx() {
    if ( this.is_function ) {
      return this;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.findFunctionCtx();
  }
  
  getFnVarCnt(name ) {
    var fnCtx = this.findFunctionCtx()
    var ii_4 = 0
    if ( typeof(fnCtx.defCounts[name] ) != "undefined" ) {
      ii_4 = (fnCtx.defCounts[name]);
      ii_4 = 1 + ii_4;
    } else {
      fnCtx.defCounts[name] = ii_4
      return 0;
    }
    var scope_has = this.isVarDefined(((name + "_") + ii_4))
    while (scope_has) {
      ii_4 = 1 + ii_4;
      scope_has = this.isVarDefined(((name + "_") + ii_4));
    }
    fnCtx.defCounts[name] = ii_4
    return ii_4;
  }
  
  debugVars() {
    console.log("--- context vars ---")
    for ( var i_22 = 0; i_22 < this.localVarNames.length; i_22++) {
      var na = this.localVarNames[i_22];
      console.log("var => " + na)
    }
    if ( typeof(this.parent) !== "undefined" ) {
      this.parent.debugVars();
    }
  }
  
  getVarTotalCnt(name ) {
    var fnCtx_4 = this
    var ii_6 = 0
    if ( typeof(fnCtx_4.defCounts[name] ) != "undefined" ) {
      ii_6 = (fnCtx_4.defCounts[name]);
    }
    if ( typeof(fnCtx_4.parent) !== "undefined" ) {
      ii_6 = ii_6 + fnCtx_4.parent.getVarTotalCnt(name);
    }
    if ( this.isVarDefined(name) ) {
      ii_6 = ii_6 + 1;
    }
    return ii_6;
  }
  
  getFnVarCnt2(name ) {
    var fnCtx_6 = this
    var ii_8 = 0
    if ( typeof(fnCtx_6.defCounts[name] ) != "undefined" ) {
      ii_8 = (fnCtx_6.defCounts[name]);
      ii_8 = 1 + ii_8;
      fnCtx_6.defCounts[name] = ii_8
    } else {
      fnCtx_6.defCounts[name] = 1
    }
    if ( typeof(fnCtx_6.parent) !== "undefined" ) {
      ii_8 = ii_8 + fnCtx_6.parent.getFnVarCnt2(name);
    }
    var scope_has_4 = this.isVarDefined(name)
    if ( scope_has_4 ) {
      ii_8 = 1 + ii_8;
    }
    var scope_has_9 = this.isVarDefined(((name + "_") + ii_8))
    while (scope_has_9) {
      ii_8 = 1 + ii_8;
      scope_has_9 = this.isVarDefined(((name + "_") + ii_8));
    }
    return ii_8;
  }
  
  isMemberVariable(name ) {
    if ( this.isVarDefined(name) ) {
      var vDef = this.getVariableDef(name)
      if ( vDef.varType == 8 ) {
        return true;
      }
    }
    return false;
  }
  
  defineVariable(name ,desc ) {
    var cnt_2 = 0
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt_2 = this.getFnVarCnt2(name);
    }
    if ( 0 == cnt_2 ) {
      desc.compiledName = name;
    } else {
      desc.compiledName = (name + "_") + cnt_2;
    }
    this.localVariables[name] = desc
    this.localVarNames.push(name);
  }
  
  isDefinedClass(name ) {
    if ( typeof(this.definedClasses[name] ) != "undefined" ) {
      return true;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.isDefinedClass(name);
      }
    }
    return false;
  }
  
  getRoot() {
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.getRoot();
  }
  
  getClasses() {
    var list = []
    for ( var i_24 = 0; i_24 < this.definedClassList.length; i_24++) {
      var n_5 = this.definedClassList[i_24];
      list.push((this.definedClasses[n_5]));
    }
    return list;
  }
  
  addClass(name ,desc ) {
    var root_34 = this.getRoot()
    if ( typeof(root_34.definedClasses[name] ) != "undefined" ) {
      console.log(("ERROR: class " + name) + " already defined")
    } else {
      root_34.definedClasses[name] = desc
      root_34.definedClassList.push(name);
    }
  }
  
  findClass(name ) {
    var root_36 = this.getRoot()
    return (root_36.definedClasses[name]);
  }
  
  hasClass(name ) {
    var root_38 = this.getRoot()
    return typeof(root_38.definedClasses[name] ) != "undefined";
  }
  
  getCurrentMethod() {
    if ( typeof(this.currentMethod) !== "undefined" ) {
      return this.currentMethod;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getCurrentMethod();
    }
    return new RangerAppFunctionDesc();
  }
  
  setCurrentClass(cc ) {
    this.in_class = true;
    this.currentClass = cc;
  }
  
  disableCurrentClass() {
    if ( this.in_class ) {
      this.in_class = false;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      this.parent.disableCurrentClass();
    }
  }
  
  hasCurrentClass() {
    if ( this.in_class && (typeof(this.currentClass) !== "undefined") ) {
      return true;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.hasCurrentClass();
    }
    return false;
  }
  
  getCurrentClass() {
    if ( this.in_class && (typeof(this.currentClass) !== "undefined") ) {
      return this.currentClass;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getCurrentClass();
    }
    var non
    return non;
  }
  
  restartExpressionLevel() {
    this.expr_restart = true;
  }
  
  isInExpression() {
    if ( (this.expr_stack.length) > 0 ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined") && (this.expr_restart == false) ) {
      return this.parent.isInExpression();
    }
    return false;
  }
  
  expressionLevel() {
    var level = this.expr_stack.length
    if ( (typeof(this.parent) !== "undefined") && (this.expr_restart == false) ) {
      return level + this.parent.expressionLevel();
    }
    return level;
  }
  
  setInExpr() {
    this.expr_stack.push(true);
  }
  
  unsetInExpr() {
    this.expr_stack.pop();
  }
  
  getErrorCount() {
    var cnt_5 = this.compilerErrors.length
    if ( typeof(this.parent) != "undefined" ) {
      cnt_5 = cnt_5 + this.parent.getErrorCount();
    }
    return cnt_5;
  }
  
  isInStatic() {
    if ( this.in_static_method ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isInStatic();
    }
    return false;
  }
  
  isInMethod() {
    if ( (this.method_stack.length) > 0 ) {
      return true;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.isInMethod();
    }
    return false;
  }
  
  setInMethod() {
    this.method_stack.push(true);
  }
  
  unsetInMethod() {
    this.method_stack.pop();
  }
  
  fork() {
    var new_ctx = new RangerAppWriterContext()
    new_ctx.parent = this;
    return new_ctx;
  }
}
class CodeFile  {
  
  constructor(filePath ,fileName  ) {
    this.path_name = "";
    this.name = "";
    this.writer;
    this.import_list = {};
    this.import_names = [];
    this.fileSystem;
    this.name = fileName;
    this.path_name = filePath;
    this.writer = new CodeWriter();
    this.writer.createTag("imports");
    this.writer.ownerFile = this;
  }
  
  addImport(import_name ) {
    if ( false == (typeof(this.import_list[import_name] ) != "undefined") ) {
      this.import_list[import_name] = import_name
      this.import_names.push(import_name);
    }
  }
  
  testCreateWriter() {
    return new CodeWriter();
  }
  
  getImports() {
    return this.import_names;
  }
  
  getWriter() {
    return this.writer;
  }
  
  getCode() {
    return this.writer.getCode();
  }
}
class CodeFileSystem  {
  
  constructor( ) {
    this.files = [];
  }
  
  getFile(path ,name ) {
    for ( var idx_2 = 0; idx_2 < this.files.length; idx_2++) {
      var file_2 = this.files[idx_2];
      if ( (file_2.path_name == path) && (file_2.name == name) ) {
        return file_2;
      }
    }
    var new_file = new CodeFile(path, name)
    new_file.fileSystem = this;
    this.files.push(new_file);
    return new_file;
  }
  
  mkdir(path ) {
    var parts = path.split("/")
    var curr_path = ""
    for ( var i_21 = 0; i_21 < parts.length; i_21++) {
      var p = parts[i_21];
      curr_path = (curr_path + "/") + p;
      if ( false == (require("fs").existsSync(process.cwd() + "/" + curr_path + "/" )) ) {
        require("fs").mkdirSync(process.cwd() + "/" + curr_path)
      }
    }
  }
  
  saveTo(path ) {
    for ( var idx_5 = 0; idx_5 < this.files.length; idx_5++) {
      var file_5 = this.files[idx_5];
      var file_path = (path + "/") + file_5.path_name
      this.mkdir(file_path);
      console.log((("Writing to file " + file_path) + "/") + file_5.name)
      var file_content = file_5.getCode()
      if ( (file_content.length) > 0 ) {
        require("fs").writeFileSync(process.cwd() + "/" + file_path + "/"  + file_5.name, file_content)
      }
    }
  }
}
class CodeSlice  {
  
  constructor( ) {
    this.code = "";
    this.writer;
  }
  
  getCode() {
    if ( typeof(this.writer) === "undefined" ) {
      return this.code;
    }
    return this.writer.getCode();
  }
}
class CodeWriter  {
  
  constructor( ) {
    this.tagName = "";     /** note: unused */
    this.codeStr = "";     /** note: unused */
    this.currentLine = "";
    this.tabStr = "  ";
    this.lineNumber = 1;     /** note: unused */
    this.indentAmount = 0;
    this.compiledTags = {};
    this.tags = {};
    this.slices = [];
    this.current_slice;
    this.ownerFile;
    this.forks = [];     /** note: unused */
    this.tagOffset = 0;     /** note: unused */
    this.parent;
    this.had_nl = true;     /** note: unused */
    var new_slice = new CodeSlice()
    this.slices.push(new_slice);
    this.current_slice = new_slice;
  }
  
  getFileWriter(path ,fileName ) {
    var fs_2 = this.ownerFile.fileSystem
    var file_4 = fs_2.getFile(path, fileName)
    var wr_3 = file_4.getWriter()
    return wr_3;
  }
  
  getImports() {
    var p_2 = this
    while ((typeof(p_2.ownerFile) === "undefined") && (typeof(p_2.parent) !== "undefined")) {
      p_2 = p_2.parent;
    }
    if ( typeof(p_2.ownerFile) !== "undefined" ) {
      var f = p_2.ownerFile
      return f.import_names;
    }
    var nothing = []
    return nothing;
  }
  
  addImport(name ) {
    if ( typeof(this.ownerFile) !== "undefined" ) {
      this.ownerFile.addImport(name);
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        this.parent.addImport(name);
      }
    }
  }
  
  indent(delta ) {
    this.indentAmount = this.indentAmount + delta;
    if ( this.indentAmount < 0 ) {
      this.indentAmount = 0;
    }
  }
  
  addIndent() {
    var i_22 = 0
    if ( 0 == (this.currentLine.length) ) {
      while (i_22 < this.indentAmount) {
        this.currentLine = this.currentLine + this.tabStr;
        i_22 = i_22 + 1;
      }
    }
  }
  
  createTag(name ) {
    var new_writer = new CodeWriter()
    var new_slice_4 = new CodeSlice()
    this.tags[name] = this.slices.length
    this.slices.push(new_slice_4);
    new_slice_4.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    var new_active_slice = new CodeSlice()
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    new_writer.parent = this;
    return new_writer;
  }
  
  getTag(name ) {
    if ( typeof(this.tags[name] ) != "undefined" ) {
      var idx_4 = (this.tags[name])
      var slice = this.slices[idx_4]
      return slice.writer;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.getTag(name);
      }
    }
    return this;
  }
  
  hasTag(name ) {
    if ( typeof(this.tags[name] ) != "undefined" ) {
      return true;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.hasTag(name);
      }
    }
    return false;
  }
  
  fork() {
    var new_writer_4 = new CodeWriter()
    var new_slice_6 = new CodeSlice()
    this.slices.push(new_slice_6);
    new_slice_6.writer = new_writer_4;
    new_writer_4.indentAmount = this.indentAmount;
    new_writer_4.parent = this;
    var new_active_slice_4 = new CodeSlice()
    this.slices.push(new_active_slice_4);
    this.current_slice = new_active_slice_4;
    return new_writer_4;
  }
  
  newline() {
    if ( (this.currentLine.length) > 0 ) {
      this.out("", true);
    }
  }
  
  writeSlice(str ,newLine ) {
    this.addIndent();
    this.currentLine = this.currentLine + str;
    if ( newLine ) {
      this.current_slice.code = (this.current_slice.code + this.currentLine) + "\n";
      this.currentLine = "";
    }
  }
  
  out(str ,newLine ) {
    var lines = str.split("\n")
    var rowCnt = lines.length
    if ( rowCnt == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( var idx_7 = 0; idx_7 < lines.length; idx_7++) {
        var row = lines[idx_7];
        this.addIndent();
        if ( idx_7 < (rowCnt - 1) ) {
          this.writeSlice(row.trim(), true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  
  raw(str ,newLine ) {
    var lines_4 = str.split("\n")
    var rowCnt_4 = lines_4.length
    if ( rowCnt_4 == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( var idx_9 = 0; idx_9 < lines_4.length; idx_9++) {
        var row_4 = lines_4[idx_9];
        this.addIndent();
        if ( idx_9 < (rowCnt_4 - 1) ) {
          this.writeSlice(row_4, true);
        } else {
          this.writeSlice(row_4, newLine);
        }
      }
    }
  }
  
  getCode() {
    var res_3 = ""
    for ( var idx_11 = 0; idx_11 < this.slices.length; idx_11++) {
      var slice_4 = this.slices[idx_11];
      res_3 = res_3 + slice_4.getCode();
    }
    res_3 = res_3 + this.currentLine;
    return res_3;
  }
}
class RangerLispParser  {
  
  constructor(code_module  ) {
    this.code;
    this.buff;
    this.len = 0;
    this.i = 0;
    this.parents = [];
    this.next;     /** note: unused */
    this.paren_cnt = 0;
    this.get_op_pred = 0;     /** note: unused */
    this.rootNode;
    this.curr_node;
    this.had_error = false;
    this.buff = code_module.code;
    this.code = code_module;
    this.len = (this.buff).length;
    this.rootNode = new CodeNode(this.code, 0, 0);
    this.rootNode.is_block_node = true;
    this.rootNode.expression = true;
    this.curr_node = this.rootNode;
    this.parents.push(this.curr_node);
    this.paren_cnt = 1;
  }
  
  joo(cm ) {
    /** unused:  var ll = cm.code.length   **/ 
  }
  
  getCode() {
    return this.rootNode.getCode();
  }
  
  parse_raw_annotation() {
    var sp = this.i
    var ep = this.i
    this.i = this.i + 1;
    sp = this.i;
    ep = this.i;
    if ( this.i < this.len ) {
      var a_node2 = new CodeNode(this.code, sp, ep)
      a_node2.expression = true;
      this.curr_node = a_node2;
      this.parents.push(a_node2);
      this.i = this.i + 1;
      this.paren_cnt = this.paren_cnt + 1;
      this.parse();
      return a_node2;
    } else {
    }
    return new CodeNode(this.code, sp, ep);
  }
  
  skip_space(is_block_parent ) {
    var s_8 = this.buff
    var did_break = false
    if ( this.i >= this.len ) {
      return true;
    }
    var c_2 = s_8.charCodeAt(this.i )
    /** unused:  var bb = c_2 == (46)   **/ 
    while ((this.i < this.len) && (c_2 <= 32)) {
      if ( is_block_parent && ((c_2 == 10) || (c_2 == 13)) ) {
        this.end_expression();
        did_break = true;
        break;
      }
      this.i = 1 + this.i;
      if ( this.i >= this.len ) {
        return true;
      }
      c_2 = s_8.charCodeAt(this.i );
    }
    return did_break;
  }
  
  end_expression() {
    this.i = 1 + this.i;
    if ( this.i >= this.len ) {
      return false;
    }
    this.paren_cnt = this.paren_cnt - 1;
    if ( this.paren_cnt < 0 ) {
      console.log("Parser error ) mismatch")
    }
    this.parents.pop();
    if ( typeof(this.curr_node) !== "undefined" ) {
      this.curr_node.ep = this.i;
      this.curr_node.infix_operator = false;
    }
    if ( (this.parents.length) > 0 ) {
      this.curr_node = this.parents[((this.parents.length) - 1)];
    } else {
      this.curr_node = this.rootNode;
    }
    this.curr_node.infix_operator = false;
    return true;
  }
  
  getOperator() {
    var s_11 = this.buff
    if ( (this.i + 2) >= this.len ) {
      return 0;
    }
    var c_5 = s_11.charCodeAt(this.i )
    var c2 = s_11.charCodeAt((this.i + 1) )
    switch (c_5 ) { 
      case 42 : 
        this.i = this.i + 1;
        return 14;
        break;
      case 47 : 
        this.i = this.i + 1;
        return 14;
        break;
      case 43 : 
        this.i = this.i + 1;
        return 13;
        break;
      case 45 : 
        this.i = this.i + 1;
        return 13;
        break;
      case 60 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
        break;
      case 62 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
        break;
      case 33 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 10;
        }
        return 0;
        break;
      case 61 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 10;
        }
        this.i = this.i + 1;
        return 3;
        break;
      case 38 : 
        if ( c2 == (38) ) {
          this.i = this.i + 2;
          return 6;
        }
        return 0;
        break;
      case 124 : 
        if ( c2 == (124) ) {
          this.i = this.i + 2;
          return 5;
        }
        return 0;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  isOperator() {
    var s_13 = this.buff
    if ( (this.i - 2) > this.len ) {
      return 0;
    }
    var c_7 = s_13.charCodeAt(this.i )
    var c2_4 = s_13.charCodeAt((this.i + 1) )
    switch (c_7 ) { 
      case 42 : 
        return 1;
        break;
      case 47 : 
        return 14;
        break;
      case 43 : 
        return 13;
        break;
      case 45 : 
        return 13;
        break;
      case 60 : 
        if ( c2_4 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 62 : 
        if ( c2_4 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 33 : 
        if ( c2_4 == (61) ) {
          return 10;
        }
        return 0;
        break;
      case 61 : 
        if ( c2_4 == (61) ) {
          return 10;
        }
        return 3;
        break;
      case 38 : 
        if ( c2_4 == (38) ) {
          return 6;
        }
        return 0;
        break;
      case 124 : 
        if ( c2_4 == (124) ) {
          return 5;
        }
        return 0;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  getOperatorPred(str ) {
    switch (str ) { 
      case "<" : 
        return 11;
        break;
      case ">" : 
        return 11;
        break;
      case "<=" : 
        return 11;
        break;
      case ">=" : 
        return 11;
        break;
      case "==" : 
        return 10;
        break;
      case "!=" : 
        return 10;
        break;
      case "=" : 
        return 3;
        break;
      case "&&" : 
        return 6;
        break;
      case "||" : 
        return 5;
        break;
      case "+" : 
        return 13;
        break;
      case "-" : 
        return 13;
        break;
      case "*" : 
        return 14;
        break;
      case "/" : 
        return 14;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  insert_node(p_node ) {
    var push_target = this.curr_node
    if ( this.curr_node.infix_operator ) {
      push_target = this.curr_node.infix_node;
      if ( push_target.to_the_right ) {
        push_target = push_target.right_node;
        p_node.parent = push_target;
      }
    }
    push_target.children.push(p_node);
  }
  
  parse() {
    var s_15 = this.buff
    var c_9 = s_15.charCodeAt(0 )
    /** unused:  var next_c = 0   **/ 
    var fc_11 = 0
    var new_node
    var sp_4 = 0
    var ep_4 = 0
    var last_i = 0
    var had_lf = false
    while (this.i < this.len) {
      if ( this.had_error ) {
        break;
      }
      last_i = this.i;
      var is_block_parent = false
      if ( had_lf ) {
        had_lf = false;
        this.end_expression();
        break;
      }
      if ( typeof(this.curr_node) !== "undefined" ) {
        if ( typeof(this.curr_node.parent) !== "undefined" ) {
          var nodeParent = this.curr_node.parent
          if ( nodeParent.is_block_node ) {
            is_block_parent = true;
          }
        }
      }
      if ( this.skip_space(is_block_parent) ) {
        break;
      }
      had_lf = false;
      c_9 = s_15.charCodeAt(this.i );
      if ( this.i < this.len ) {
        c_9 = s_15.charCodeAt(this.i );
        if ( c_9 == 59 ) {
          sp_4 = this.i + 1;
          while ((this.i < this.len) && ((s_15.charCodeAt(this.i )) > 31)) {
            this.i = 1 + this.i;
          }
          if ( this.i >= this.len ) {
            break;
          }
          new_node = new CodeNode(this.code, sp_4, this.i);
          new_node.value_type = 10;
          new_node.string_value = s_15.substring(sp_4, this.i );
          this.curr_node.comments.push(new_node);
          continue;
        }
        if ( this.i < (this.len - 1) ) {
          fc_11 = s_15.charCodeAt((this.i + 1) );
          if ( (((c_9 == 40) || (c_9 == (123))) || ((c_9 == 39) && (fc_11 == 40))) || ((c_9 == 96) && (fc_11 == 40)) ) {
            this.paren_cnt = this.paren_cnt + 1;
            if ( typeof(this.curr_node) === "undefined" ) {
              this.rootNode = new CodeNode(this.code, this.i, this.i);
              this.curr_node = this.rootNode;
              if ( c_9 == 96 ) {
                this.curr_node.value_type = 30;
              }
              if ( c_9 == 39 ) {
                this.curr_node.value_type = 29;
              }
              this.curr_node.expression = true;
              this.parents.push(this.curr_node);
            } else {
              var new_qnode = new CodeNode(this.code, this.i, this.i)
              if ( c_9 == 96 ) {
                new_qnode.value_type = 30;
              }
              if ( c_9 == 39 ) {
                new_qnode.value_type = 29;
              }
              new_qnode.expression = true;
              this.insert_node(new_qnode);
              this.parents.push(new_qnode);
              this.curr_node = new_qnode;
            }
            if ( c_9 == (123) ) {
              this.curr_node.is_block_node = true;
            }
            this.i = 1 + this.i;
            this.parse();
            continue;
          }
        }
        sp_4 = this.i;
        ep_4 = this.i;
        fc_11 = s_15.charCodeAt(this.i );
        if ( (((fc_11 == 45) && ((s_15.charCodeAt((this.i + 1) )) >= 46)) && ((s_15.charCodeAt((this.i + 1) )) <= 57)) || ((fc_11 >= 48) && (fc_11 <= 57)) ) {
          var is_double = false
          sp_4 = this.i;
          this.i = 1 + this.i;
          c_9 = s_15.charCodeAt(this.i );
          while ((this.i < this.len) && ((((c_9 >= 48) && (c_9 <= 57)) || (c_9 == (46))) || ((this.i == sp_4) && ((c_9 == (43)) || (c_9 == (45)))))) {
            if ( c_9 == (46) ) {
              is_double = true;
            }
            this.i = 1 + this.i;
            c_9 = s_15.charCodeAt(this.i );
          }
          ep_4 = this.i;
          var new_num_node = new CodeNode(this.code, sp_4, ep_4)
          if ( is_double ) {
            new_num_node.value_type = 2;
            new_num_node.double_value = (isNaN( parseFloat((s_15.substring(sp_4, ep_4 ))) ) ? undefined : parseFloat((s_15.substring(sp_4, ep_4 ))));
          } else {
            new_num_node.value_type = 3;
            new_num_node.int_value = (isNaN( parseInt((s_15.substring(sp_4, ep_4 ))) ) ? undefined : parseInt((s_15.substring(sp_4, ep_4 ))));
          }
          this.insert_node(new_num_node);
          continue;
        }
        if ( fc_11 == 34 ) {
          sp_4 = this.i + 1;
          ep_4 = sp_4;
          c_9 = s_15.charCodeAt(this.i );
          var must_encode = false
          while (this.i < this.len) {
            this.i = 1 + this.i;
            c_9 = s_15.charCodeAt(this.i );
            if ( c_9 == 34 ) {
              break;
            }
            if ( c_9 == 92 ) {
              this.i = 1 + this.i;
              if ( this.i < this.len ) {
                must_encode = true;
                c_9 = s_15.charCodeAt(this.i );
              } else {
                break;
              }
            }
          }
          ep_4 = this.i;
          if ( this.i < this.len ) {
            var encoded_str = ""
            if ( must_encode ) {
              var orig_str = (s_15.substring(sp_4, ep_4 ))
              var str_length = orig_str.length
              var ii_5 = 0
              while (ii_5 < str_length) {var cc = orig_str.charCodeAt(ii_5 )
                if ( cc == 92 ) {
                  var next_ch = orig_str.charCodeAt((ii_5 + 1) )
                  switch (next_ch ) { 
                    case 34 : 
                      encoded_str = encoded_str + (String.fromCharCode(34));
                      break;
                    case 92 : 
                      encoded_str = encoded_str + (String.fromCharCode(92));
                      break;
                    case 47 : 
                      encoded_str = encoded_str + (String.fromCharCode(47));
                      break;
                    case 98 : 
                      encoded_str = encoded_str + (String.fromCharCode(8));
                      break;
                    case 102 : 
                      encoded_str = encoded_str + (String.fromCharCode(12));
                      break;
                    case 110 : 
                      encoded_str = encoded_str + (String.fromCharCode(10));
                      break;
                    case 114 : 
                      encoded_str = encoded_str + (String.fromCharCode(13));
                      break;
                    case 116 : 
                      encoded_str = encoded_str + (String.fromCharCode(9));
                      break;
                    case 117 : 
                      ii_5 = ii_5 + 4;
                      break;
                    default: 
                      break;
                  }
                  ii_5 = ii_5 + 2;
                } else {
                  encoded_str = encoded_str + (orig_str.substring(ii_5, (1 + ii_5) ));
                  ii_5 = ii_5 + 1;
                }
              }
            }
            var new_str_node = new CodeNode(this.code, sp_4, ep_4)
            new_str_node.value_type = 4;
            if ( must_encode ) {
              new_str_node.string_value = encoded_str;
            } else {
              new_str_node.string_value = s_15.substring(sp_4, ep_4 );
            }
            this.insert_node(new_str_node);
            this.i = 1 + this.i;
            continue;
          }
        }
        if ( (((fc_11 == (116)) && ((s_15.charCodeAt((this.i + 1) )) == (114))) && ((s_15.charCodeAt((this.i + 2) )) == (117))) && ((s_15.charCodeAt((this.i + 3) )) == (101)) ) {
          var new_true_node = new CodeNode(this.code, sp_4, sp_4 + 4)
          new_true_node.value_type = 5;
          new_true_node.boolean_value = true;
          this.insert_node(new_true_node);
          this.i = this.i + 4;
          continue;
        }
        if ( ((((fc_11 == (102)) && ((s_15.charCodeAt((this.i + 1) )) == (97))) && ((s_15.charCodeAt((this.i + 2) )) == (108))) && ((s_15.charCodeAt((this.i + 3) )) == (115))) && ((s_15.charCodeAt((this.i + 4) )) == (101)) ) {
          var new_f_node = new CodeNode(this.code, sp_4, sp_4 + 5)
          new_f_node.value_type = 5;
          new_f_node.boolean_value = false;
          this.insert_node(new_f_node);
          this.i = this.i + 5;
          continue;
        }
        if ( fc_11 == (64) ) {
          this.i = this.i + 1;
          sp_4 = this.i;
          ep_4 = this.i;
          c_9 = s_15.charCodeAt(this.i );
          while (((((this.i < this.len) && ((s_15.charCodeAt(this.i )) > 32)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != (125))) {
            this.i = 1 + this.i;
            c_9 = s_15.charCodeAt(this.i );
          }
          ep_4 = this.i;
          if ( (this.i < this.len) && (ep_4 > sp_4) ) {
            var a_node2_4 = new CodeNode(this.code, sp_4, ep_4)
            var a_name = s_15.substring(sp_4, ep_4 )
            a_node2_4.expression = true;
            this.curr_node = a_node2_4;
            this.parents.push(a_node2_4);
            this.i = this.i + 1;
            this.paren_cnt = this.paren_cnt + 1;
            this.parse();
            var use_first = false
            if ( 1 == (a_node2_4.children.length) ) {
              var ch1 = a_node2_4.children[0]
              use_first = ch1.isPrimitive();
            }
            if ( use_first ) {
              var theNode = a_node2_4.children.splice(0, 1).pop()
              this.curr_node.props[a_name] = theNode
            } else {
              this.curr_node.props[a_name] = a_node2_4
            }
            this.curr_node.prop_keys.push(a_name);
            continue;
          }
        }
        var ns_list = []
        var last_ns = this.i
        var ns_cnt = 1
        var vref_had_type_ann = false
        var vref_ann_node
        var vref_end = this.i
        if ( (((((this.i < this.len) && ((s_15.charCodeAt(this.i )) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != (125)) ) {
          if ( this.curr_node.is_block_node == true ) {
            var new_expr_node = new CodeNode(this.code, sp_4, ep_4)
            new_expr_node.parent = this.curr_node;
            new_expr_node.expression = true;
            this.curr_node.children.push(new_expr_node);
            this.curr_node = new_expr_node;
            this.parents.push(new_expr_node);
            this.paren_cnt = 1 + this.paren_cnt;
            this.parse();
            continue;
          }
        }
        var op_c = 0
        if ( (this.curr_node.children.length) >= 0 ) {
          op_c = this.getOperator();
        }
        var last_was_newline = false
        if ( op_c > 0 ) {
        } else {
          while ((((((this.i < this.len) && ((s_15.charCodeAt(this.i )) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != (125))) {
            if ( this.i > sp_4 ) {
              var is_opchar = this.isOperator()
              if ( is_opchar > 0 ) {
                break;
              }
            }
            this.i = 1 + this.i;
            c_9 = s_15.charCodeAt(this.i );
            if ( (c_9 == 10) || (c_9 == 13) ) {
              last_was_newline = true;
              break;
            }
            if ( c_9 == (46) ) {
              ns_list.push(s_15.substring(last_ns, this.i ));
              last_ns = this.i + 1;
              ns_cnt = 1 + ns_cnt;
            }
            if ( (this.i > vref_end) && (c_9 == (64)) ) {
              vref_had_type_ann = true;
              vref_end = this.i;
              vref_ann_node = this.parse_raw_annotation();
              c_9 = s_15.charCodeAt(this.i );
              break;
            }
          }
        }
        ep_4 = this.i;
        if ( vref_had_type_ann ) {
          ep_4 = vref_end;
        }
        ns_list.push(s_15.substring(last_ns, ep_4 ));
        c_9 = s_15.charCodeAt(this.i );
        while (((this.i < this.len) && (c_9 <= 32)) && (false == last_was_newline)) {
          this.i = 1 + this.i;
          c_9 = s_15.charCodeAt(this.i );
          if ( is_block_parent && ((c_9 == 10) || (c_9 == 13)) ) {
            this.i = this.i - 1;
            c_9 = s_15.charCodeAt(this.i );
            had_lf = true;
            break;
          }
        }
        if ( c_9 == 58 ) {
          this.i = this.i + 1;
          while ((this.i < this.len) && ((s_15.charCodeAt(this.i )) <= 32)) {
            this.i = 1 + this.i;
          }
          var vt_sp = this.i
          var vt_ep = this.i
          c_9 = s_15.charCodeAt(this.i );
          if ( c_9 == (40) ) {
            var a_node3 = new CodeNode(this.code, sp_4, ep_4)
            a_node3.expression = true;
            this.curr_node = a_node3;
            this.parents.push(a_node3);
            this.i = this.i + 1;
            this.parse();
            var new_expr_node_10 = new CodeNode(this.code, sp_4, vt_ep)
            new_expr_node_10.vref = s_15.substring(sp_4, ep_4 );
            new_expr_node_10.ns = ns_list;
            new_expr_node_10.expression_value = a_node3;
            new_expr_node_10.value_type = 15;
            if ( vref_had_type_ann ) {
              new_expr_node_10.vref_annotation = vref_ann_node;
              new_expr_node_10.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_expr_node_10);
            continue;
          }
          if ( c_9 == (91) ) {
            this.i = this.i + 1;
            vt_sp = this.i;
            var hash_sep = 0
            var had_array_type_ann = false
            c_9 = s_15.charCodeAt(this.i );
            while (((this.i < this.len) && (c_9 > 32)) && (c_9 != 93)) {
              this.i = 1 + this.i;
              c_9 = s_15.charCodeAt(this.i );
              if ( c_9 == (58) ) {
                hash_sep = this.i;
              }
              if ( c_9 == (64) ) {
                had_array_type_ann = true;
                break;
              }
            }
            vt_ep = this.i;
            if ( hash_sep > 0 ) {
              vt_ep = this.i;
              var type_name = s_15.substring((1 + hash_sep), vt_ep )
              var key_type_name = s_15.substring(vt_sp, hash_sep )
              var new_hash_node = new CodeNode(this.code, sp_4, vt_ep)
              new_hash_node.vref = s_15.substring(sp_4, ep_4 );
              new_hash_node.ns = ns_list;
              new_hash_node.value_type = 7;
              new_hash_node.array_type = type_name;
              new_hash_node.key_type = key_type_name;
              if ( vref_had_type_ann ) {
                new_hash_node.vref_annotation = vref_ann_node;
                new_hash_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                var vann_hash = this.parse_raw_annotation()
                new_hash_node.type_annotation = vann_hash;
                new_hash_node.has_type_annotation = true;
                console.log("--> parsed HASH TYPE annotation")
              }
              new_hash_node.parent = this.curr_node;
              this.curr_node.children.push(new_hash_node);
              this.i = 1 + this.i;
              continue;
            } else {
              vt_ep = this.i;
              var type_name_17 = s_15.substring(vt_sp, vt_ep )
              var new_arr_node = new CodeNode(this.code, sp_4, vt_ep)
              new_arr_node.vref = s_15.substring(sp_4, ep_4 );
              new_arr_node.ns = ns_list;
              new_arr_node.value_type = 6;
              new_arr_node.array_type = type_name_17;
              new_arr_node.parent = this.curr_node;
              this.curr_node.children.push(new_arr_node);
              if ( vref_had_type_ann ) {
                new_arr_node.vref_annotation = vref_ann_node;
                new_arr_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                var vann_arr = this.parse_raw_annotation()
                new_arr_node.type_annotation = vann_arr;
                new_arr_node.has_type_annotation = true;
                console.log("--> parsed ARRAY TYPE annotation")
              }
              this.i = 1 + this.i;
              continue;
            }
          }
          var had_type_ann = false
          while (((((((this.i < this.len) && ((s_15.charCodeAt(this.i )) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != (125))) && (c_9 != (44))) {
            this.i = 1 + this.i;
            c_9 = s_15.charCodeAt(this.i );
            if ( c_9 == (64) ) {
              had_type_ann = true;
              break;
            }
          }
          if ( this.i < this.len ) {
            vt_ep = this.i;
            /** unused:  var type_name_18 = s_15.substring(vt_sp, vt_ep )   **/ 
            var new_ref_node = new CodeNode(this.code, sp_4, ep_4)
            new_ref_node.vref = s_15.substring(sp_4, ep_4 );
            new_ref_node.ns = ns_list;
            new_ref_node.value_type = 9;
            new_ref_node.type_name = s_15.substring(vt_sp, vt_ep );
            new_ref_node.parent = this.curr_node;
            if ( vref_had_type_ann ) {
              new_ref_node.vref_annotation = vref_ann_node;
              new_ref_node.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_ref_node);
            if ( had_type_ann ) {
              var vann = this.parse_raw_annotation()
              new_ref_node.type_annotation = vann;
              new_ref_node.has_type_annotation = true;
            }
            continue;
          }
        } else {
          if ( (this.i < this.len) && (ep_4 > sp_4) ) {
            var new_vref_node = new CodeNode(this.code, sp_4, ep_4)
            new_vref_node.vref = s_15.substring(sp_4, ep_4 );
            new_vref_node.value_type = 9;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = this.curr_node;
            var op_pred = this.getOperatorPred(new_vref_node.vref)
            if ( new_vref_node.vref == "," ) {
              this.curr_node.infix_operator = false;
              continue;
            }
            var pTarget = this.curr_node
            if ( this.curr_node.infix_operator ) {
              var iNode = this.curr_node.infix_node
              if ( (op_pred > 0) || (iNode.to_the_right == false) ) {
                pTarget = iNode;
              } else {
                var rn = iNode.right_node
                new_vref_node.parent = rn;
                pTarget = rn;
              }
            }
            pTarget.children.push(new_vref_node);
            if ( vref_had_type_ann ) {
              new_vref_node.vref_annotation = vref_ann_node;
              new_vref_node.has_vref_annotation = true;
            }
            if ( ((s_15.charCodeAt((this.i + 1) )) == (40)) || ((s_15.charCodeAt((this.i + 0) )) == (40)) ) {
              if ( ((0 == op_pred) && this.curr_node.infix_operator) && (1 == (this.curr_node.children.length)) ) {
              }
            }
            if ( ((op_pred > 0) && this.curr_node.infix_operator) || ((op_pred > 0) && ((this.curr_node.children.length) >= 2)) ) {
              if ( (op_pred == 3) && (2 == (this.curr_node.children.length)) ) {
                var n_ch = this.curr_node.children.splice(0, 1).pop()
                this.curr_node.children.push(n_ch);
              } else {
                if ( false == this.curr_node.infix_operator ) {
                  var if_node = new CodeNode(this.code, sp_4, ep_4)
                  this.curr_node.infix_node = if_node;
                  this.curr_node.infix_operator = true;
                  if_node.infix_subnode = true;
                  this.curr_node.value_type = 0;
                  this.curr_node.expression = true;
                  if_node.expression = true;
                  var ch_cnt = this.curr_node.children.length
                  var ii_14 = 0
                  var start_from = ch_cnt - 2
                  var keep_nodes = new CodeNode(this.code, sp_4, ep_4)
                  while (ch_cnt > 0) {var n_ch_21 = this.curr_node.children.splice(0, 1).pop()
                    var p_target = if_node
                    if ( (ii_14 < start_from) || n_ch_21.infix_subnode ) {
                      p_target = keep_nodes;
                    }
                    p_target.children.push(n_ch_21);
                    ch_cnt = ch_cnt - 1;
                    ii_14 = 1 + ii_14;
                  }
                  for ( var i_33 = 0; i_33 < keep_nodes.children.length; i_33++) {
                    var keep = keep_nodes.children[i_33];
                    this.curr_node.children.push(keep);
                  }
                  this.curr_node.children.push(if_node);
                }
                var ifNode = this.curr_node.infix_node
                var new_op_node = new CodeNode(this.code, sp_4, ep_4)
                new_op_node.expression = true;
                new_op_node.parent = ifNode;
                var until_index = (ifNode.children.length) - 1
                var to_right = false
                var just_continue = false
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred < op_pred) ) {
                  to_right = true;
                }
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred > op_pred) ) {
                  ifNode.to_the_right = false;
                }
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred == op_pred) ) {
                  to_right = ifNode.to_the_right;
                }
                /** unused:  var opTarget = ifNode   **/ 
                if ( to_right ) {
                  var op_node = ifNode.children.splice(until_index, 1).pop()
                  var last_value = ifNode.children.splice((until_index - 1), 1).pop()
                  new_op_node.children.push(op_node);
                  new_op_node.children.push(last_value);
                } else {
                  if ( false == just_continue ) {
                    while (until_index > 0) {var what_to_add = ifNode.children.splice(0, 1).pop()
                      new_op_node.children.push(what_to_add);
                      until_index = until_index - 1;
                    }
                  }
                }
                if ( to_right || (false == just_continue) ) {
                  ifNode.children.push(new_op_node);
                }
                if ( to_right ) {
                  ifNode.right_node = new_op_node;
                  ifNode.to_the_right = true;
                }
                ifNode.operator_pred = op_pred;
                continue;
              }
            }
            continue;
          }
        }
        if ( (c_9 == 41) || (c_9 == (125)) ) {
          if ( ((c_9 == (125)) && is_block_parent) && ((this.curr_node.children.length) > 0) ) {
            this.end_expression();
          }
          this.i = 1 + this.i;
          this.paren_cnt = this.paren_cnt - 1;
          if ( this.paren_cnt < 0 ) {
            break;
          }
          this.parents.pop();
          if ( typeof(this.curr_node) !== "undefined" ) {
            this.curr_node.ep = this.i;
          }
          if ( (this.parents.length) > 0 ) {
            this.curr_node = this.parents[((this.parents.length) - 1)];
          } else {
            this.curr_node = this.rootNode;
          }
          break;
        }
        if ( last_i == this.i ) {
          this.i = 1 + this.i;
        }
      }
    }
  }
}
class RangerArgMatch  {
  
  constructor( ) {
    this.matched = {};
  }
  
  matchArguments(args ,callArgs ,ctx ,firstArgIndex ) {
    /** unused:  var fc_12 = callArgs.children[0]   **/ 
    var missed_args = []
    var all_matched = true
    for ( var i_24 = 0; i_24 < args.children.length; i_24++) {
      var arg = args.children[i_24];
      var callArg = callArgs.children[(i_24 + firstArgIndex)]
      if ( arg.hasFlag("ignore") ) {
        continue;
      }
      if ( arg.hasFlag("mutable") ) {
        if ( callArg.hasParamDesc ) {
          var pa = callArg.paramDesc
          var b = pa.nameNode.hasFlag("mutable")
          if ( b == false ) {
            missed_args.push("was mutable");
            all_matched = false;
          }
        } else {
          all_matched = false;
        }
      }
      if ( arg.hasFlag("optional") ) {
        if ( callArg.hasParamDesc ) {
          var pa_8 = callArg.paramDesc
          var b_8 = pa_8.nameNode.hasFlag("optional")
          if ( b_8 == false ) {
            missed_args.push("optional was missing");
            all_matched = false;
          }
        } else {
          if ( callArg.hasFlag("optional") ) {
          } else {
            all_matched = false;
          }
        }
      }
      if ( callArg.hasFlag("optional") ) {
        if ( false == arg.hasFlag("optional") ) {
          all_matched = false;
        }
      }
      if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
        if ( callArg.eval_type == 11 ) {
          if ( arg.type_name == "enum" ) {
            continue;
          }
        }
        if ( false == this.add(arg.type_name, callArg.eval_type_name, ctx) ) {
          all_matched = false;
          return all_matched;
        }
      }
      if ( arg.value_type == 6 ) {
        if ( false == this.add(arg.array_type, callArg.eval_array_type, ctx) ) {
          console.log("--> Failed to add the argument  ")
          all_matched = false;
        }
      }
      if ( arg.value_type == 7 ) {
        if ( false == this.add(arg.key_type, callArg.eval_key_type, ctx) ) {
          console.log("--> Failed to add the key argument  ")
          all_matched = false;
        }
        if ( false == this.add(arg.array_type, callArg.eval_array_type, ctx) ) {
          console.log("--> Failed to add the key argument  ")
          all_matched = false;
        }
      }
      var did_match = false
      if ( this.doesMatch(arg, callArg, ctx) ) {
        did_match = true;
      } else {
        missed_args.push((("matching arg " + arg.vref) + " faileg against ") + callArg.vref);
      }
      if ( false == did_match ) {
        all_matched = false;
      }
    }
    return all_matched;
  }
  
  add(tplKeyword ,typeName ,ctx ) {
    switch (tplKeyword ) { 
      case "string" : 
        return true;
        break;
      case "int" : 
        return true;
        break;
      case "double" : 
        return true;
        break;
      case "boolean" : 
        return true;
        break;
      case "enum" : 
        return true;
        break;
      case "char" : 
        return true;
        break;
      case "charbuffer" : 
        return true;
        break;
    }
    if ( (tplKeyword.length) > 1 ) {
      return true;
    }
    if ( typeof(this.matched[tplKeyword] ) != "undefined" ) {
      var s_12 = (this.matched[tplKeyword])
      if ( this.areEqualTypes(s_12, typeName, ctx) ) {
        return true;
      }
      if ( s_12 == typeName ) {
        return true;
      } else {
        return false;
      }
    }
    this.matched[tplKeyword] = typeName
    return true;
  }
  
  doesDefsMatch(arg ,node ,ctx ) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      var eq = this.areEqualTypes(arg.type_name, node.type_name, ctx)
      var typename = arg.type_name
      switch (typename ) { 
        case "expression" : 
          return node.expression;
          break;
        case "block" : 
          return node.expression;
          break;
        case "arguments" : 
          return node.expression;
          break;
        case "keyword" : 
          return node.eval_type == 9;
          break;
        case "T.name" : 
          return node.eval_type_name == typename;
          break;
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      var same_arrays = this.areEqualTypes(arg.array_type, node.array_type, ctx)
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      var same_arrays_6 = this.areEqualTypes(arg.array_type, node.array_type, ctx)
      var same_keys = this.areEqualTypes(arg.key_type, node.key_type, ctx)
      return same_arrays_6 && same_keys;
    }
    return false;
  }
  
  doesMatch(arg ,node ,ctx ) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      var eq_4 = this.areEqualTypes(arg.type_name, node.eval_type_name, ctx)
      var typename_4 = arg.type_name
      switch (typename_4 ) { 
        case "expression" : 
          return node.expression;
          break;
        case "block" : 
          return node.expression;
          break;
        case "arguments" : 
          return node.expression;
          break;
        case "keyword" : 
          return node.eval_type == 9;
          break;
        case "T.name" : 
          return node.eval_type_name == typename_4;
          break;
      }
      return eq_4;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      var same_arrays_6 = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx)
      return same_arrays_6;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      var same_arrays_10 = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx)
      var same_keys_4 = this.areEqualTypes(arg.key_type, node.eval_key_type, ctx)
      return same_arrays_10 && same_keys_4;
    }
    return false;
  }
  
  areEqualTypes(type1 ,type2 ,ctx ) {
    var typename_6 = type1
    if ( typeof(this.matched[type1] ) != "undefined" ) {
      typename_6 = (this.matched[type1]);
    }
    switch (typename_6 ) { 
      case "string" : 
        return type2 == "string";
        break;
      case "int" : 
        return type2 == "int";
        break;
      case "double" : 
        return type2 == "double";
        break;
      case "boolean" : 
        return type2 == "boolean";
        break;
      case "enum" : 
        return type2 == "enum";
        break;
      case "char" : 
        return type2 == "char";
        break;
      case "charbuffer" : 
        return type2 == "charbuffer";
        break;
    }
    if ( ctx.isDefinedClass(typename_6) && ctx.isDefinedClass(type2) ) {
      var c1 = ctx.findClass(typename_6)
      var c2_3 = ctx.findClass(type2)
      if ( c1.isSameOrParentClass(type2, ctx) ) {
        return true;
      }
      if ( c2_3.isSameOrParentClass(typename_6, ctx) ) {
        return true;
      }
    }
    return typename_6 == type2;
  }
  
  getTypeName(n ) {
    var typename_8 = n
    if ( typeof(this.matched[typename_8] ) != "undefined" ) {
      typename_8 = (this.matched[typename_8]);
    }
    if ( 0 == (typename_8.length) ) {
      return "";
    }
    return typename_8;
  }
  
  getType(n ) {
    var typename_10 = n
    if ( typeof(this.matched[typename_10] ) != "undefined" ) {
      typename_10 = (this.matched[typename_10]);
    }
    if ( 0 == (typename_10.length) ) {
      return 0;
    }
    switch (typename_10 ) { 
      case "expression" : 
        return 14;
        break;
      case "block" : 
        return 14;
        break;
      case "arguments" : 
        return 14;
        break;
      case "string" : 
        return 4;
        break;
      case "int" : 
        return 3;
        break;
      case "char" : 
        return 12;
        break;
      case "charbuffer" : 
        return 13;
        break;
      case "boolean" : 
        return 5;
        break;
      case "double" : 
        return 2;
        break;
      case "enum" : 
        return 11;
        break;
    }
    return 8;
  }
  
  setRvBasedOn(arg ,node ) {
    if ( arg.hasFlag("optional") ) {
      node.setFlag("optional");
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      node.eval_type = this.getType(arg.type_name);
      node.eval_type_name = this.getTypeName(arg.type_name);
      return true;
    }
    if ( arg.value_type == 6 ) {
      node.eval_type = 6;
      node.eval_array_type = this.getTypeName(arg.array_type);
      return true;
    }
    if ( arg.value_type == 7 ) {
      node.eval_type = 7;
      node.eval_key_type = this.getTypeName(arg.key_type);
      node.eval_array_type = this.getTypeName(arg.array_type);
      return true;
    }
    return false;
  }
}
class RangerFlowParser  {
  
  constructor( ) {
    this.stdCommands;
  }
  
  cmdEnum(node ,ctx ,wr ) {
    var fNameNode = node.children[1]
    var enumList = node.children[2]
    var new_enum = new RangerAppEnum()
    for ( var i_25 = 0; i_25 < enumList.children.length; i_25++) {
      var item_2 = enumList.children[i_25];
      new_enum.add(item_2.vref);
    }
    ctx.definedEnums[fNameNode.vref] = new_enum
  }
  
  initStdCommands() {
  }
  
  findLanguageOper(details ,ctx ) {
    var langName = ctx.getTargetLang()
    for ( var i_28 = 0; i_28 < details.children.length; i_28++) {
      var det = details.children[i_28];
      if ( (det.children.length) > 0 ) {
        var fc_13 = det.children[0]
        if ( fc_13.vref == "templates" ) {
          var tplList = det.children[1]
          for ( var i_38 = 0; i_38 < tplList.children.length; i_38++) {
            var tpl = tplList.children[i_38];
            var tplName = tpl.getFirst()
            var tplImpl
            tplImpl = tpl.getSecond();
            if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
              continue;
            }
            var rv
            rv = tpl;
            return rv;
          }
        }
      }
    }
    var none_2
    return none_2;
  }
  
  buildMacro(langOper ,args ,ctx ) {
    var subCtx = ctx.fork()
    var wr_4 = new CodeWriter()
    var lcc = new LiveCompiler()
    lcc.langWriter = new RangerRangerClassWriter();
    lcc.langWriter.compiler = lcc;
    subCtx.targetLangName = "ranger";
    var macroNode = langOper
    var cmdList = macroNode.getSecond()
    lcc.walkCommandList(cmdList, args, subCtx, wr_4);
    var lang_str = wr_4.getCode()
    var lang_code = new SourceCode(lang_str)
    lang_code.filename = ("<macro " + macroNode.vref) + ">";
    var lang_parser = new RangerLispParser(lang_code)
    lang_parser.parse();
    var node = lang_parser.rootNode
    return node;
  }
  
  stdParamMatch(callArgs ,inCtx ,wr ) {
    this.stdCommands = inCtx.getStdCommands();
    var callFnName = callArgs.getFirst()
    var cmds_2 = this.stdCommands
    var some_matched = false
    /** unused:  var found_fn = false   **/ 
    /** unused:  var missed_args_2 = []   **/ 
    var ctx = inCtx.fork()
    /** unused:  var lang_name = ctx.getTargetLang()   **/ 
    var expects_error = false
    var err_cnt = inCtx.getErrorCount()
    if ( callArgs.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    for ( var main_index = 0; main_index < cmds_2.children.length; main_index++) {
      var ch_4 = cmds_2.children[main_index];
      var fc_16 = ch_4.getFirst()
      var nameNode = ch_4.getSecond()
      var args = ch_4.getThird()
      if ( callFnName.vref == fc_16.vref ) {
        /** unused:  var line_index = callArgs.getLine()   **/ 
        var callerArgCnt = (callArgs.children.length) - 1
        var fnArgCnt = args.children.length
        var has_eval_ctx = false
        var is_macro = false
        if ( nameNode.hasFlag("newcontext") ) {
          ctx = inCtx.fork();
          has_eval_ctx = true;
        }
        if ( callerArgCnt == fnArgCnt ) {
          var details_list = ch_4.children[3]
          var langOper = this.findLanguageOper(details_list, ctx)
          if ( typeof(langOper) === "undefined" ) {
            continue;
          }
          if ( langOper.hasBooleanProperty("macro") ) {
            is_macro = true;
          }
          var match = new RangerArgMatch()
          for ( var i_32 = 0; i_32 < args.children.length; i_32++) {
            var arg_2 = args.children[i_32];
            var callArg_2 = callArgs.children[(i_32 + 1)]
            if ( arg_2.hasFlag("define") ) {
              var p_3 = new RangerAppParamDesc()
              p_3.name = callArg_2.vref;
              p_3.value_type = arg_2.value_type;
              p_3.node = callArg_2;
              p_3.nameNode = callArg_2;
              p_3.is_optional = false;
              ctx.defineVariable(p_3.name, p_3);
              callArg_2.hasParamDesc = true;
              callArg_2.ownParamDesc = p_3;
              callArg_2.paramDesc = p_3;
              if ( (callArg_2.type_name.length) == 0 ) {
                callArg_2.type_name = arg_2.type_name;
                callArg_2.value_type = arg_2.value_type;
              }
              callArg_2.eval_type = arg_2.value_type;
              callArg_2.eval_type_name = arg_2.type_name;
            }
            if ( arg_2.hasFlag("ignore") ) {
              continue;
            }
            ctx.setInExpr();
            this.WalkNode(callArg_2, ctx, wr);
            ctx.unsetInExpr();
          }
          var all_matched_2 = match.matchArguments(args, callArgs, ctx, 1)
          if ( all_matched_2 ) {
            if ( is_macro ) {
              var macroNode_4 = this.buildMacro(langOper, callArgs, ctx)
              var len_4 = callArgs.children.length
              while (len_4 > 0) {
                callArgs.children.pop();
                len_4 = len_4 - 1;
              }
              callArgs.children.push(macroNode_4);
              macroNode_4.parent = callArgs;
              this.WalkNode(macroNode_4, ctx, wr);
              match.setRvBasedOn(nameNode, callArgs);
              return true;
            }
            if ( nameNode.hasFlag("moves") ) {
              var moves_opt = nameNode.getFlag("moves")
              var moves = moves_opt
              var ann_12 = moves.vref_annotation
              var from = ann_12.getFirst()
              var to = ann_12.getSecond()
              var cA = callArgs.children[from.int_value]
              var cA2 = callArgs.children[to.int_value]
              if ( cA.hasParamDesc ) {
                var pp = cA.paramDesc
                var pp2 = cA2.paramDesc
                pp.moveRefTo(callArgs, pp2, ctx);
              }
            }
            if ( nameNode.hasFlag("returns") ) {
              var activeFn = ctx.getCurrentMethod()
              if ( activeFn.nameNode.type_name != "void" ) {
                if ( (callArgs.children.length) < 2 ) {
                  ctx.addError(callArgs, " missing return value !!!");
                } else {
                  var returnedValue = callArgs.children[1]
                  if ( match.doesMatch((activeFn.nameNode), returnedValue, ctx) == false ) {
                    ctx.addError(returnedValue, "invalid return value type!!!");
                  }
                  var argNode = activeFn.nameNode
                  if ( returnedValue.hasFlag("optional") ) {
                    if ( false == argNode.hasFlag("optional") ) {
                      ctx.addError(callArgs, "function return value optionality does not match, expected non-optional return value, optional given at " + argNode.getCode());
                    }
                  }
                  if ( argNode.hasFlag("optional") ) {
                    if ( false == returnedValue.hasFlag("optional") ) {
                      ctx.addError(callArgs, "function return value optionality does not match, expected optional return value " + argNode.getCode());
                    }
                  }
                  var pp_14 = returnedValue.paramDesc
                  if ( typeof(pp_14) !== "undefined" ) {
                    pp_14.moveRefTo(callArgs, activeFn, ctx);
                  }
                }
              }
              if ( typeof(callArgs.parent) === "undefined" ) {
                ctx.addError(callArgs, "did not have parent");
                console.log("no parent => " + callArgs.getCode())
              }
              callArgs.parent.didReturnAtIndex = callArgs.parent.children.indexOf(callArgs);
            }
            if ( nameNode.hasFlag("returns") == false ) {
              match.setRvBasedOn(nameNode, callArgs);
            }
            if ( has_eval_ctx ) {
              callArgs.evalCtx = ctx;
            }
            var nodeP = callArgs.parent
            if ( typeof(nodeP) !== "undefined" ) {
            } else {
            }
            /** unused:  var sig = nameNode.buildTypeSignatureUsingMatch(match)   **/ 
            some_matched = true;
            callArgs.has_operator = true;
            callArgs.op_index = main_index;
            for ( var arg_index = 0; arg_index < args.children.length; arg_index++) {
              var arg_13 = args.children[arg_index];
              if ( arg_13.has_vref_annotation ) {
                var anns = arg_13.vref_annotation
                for ( var i_42 = 0; i_42 < anns.children.length; i_42++) {
                  var ann_25 = anns.children[i_42];
                  if ( ann_25.vref == "mutates" ) {
                    var theArg = callArgs.children[(arg_index + 1)]
                    if ( theArg.hasParamDesc ) {
                      theArg.paramDesc.set_cnt = theArg.paramDesc.set_cnt + 1;
                    }
                  }
                }
              }
            }
            break;
          }
        }
      }
    }
    if ( some_matched == false ) {
      ctx.addError(callArgs, "stdMatch -> Could not match argument types for " + callFnName.vref);
    }
    if ( expects_error ) {
      var cnt_now = ctx.getErrorCount()
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
      }
    } else {
      var cnt_now_9 = ctx.getErrorCount()
      if ( cnt_now_9 > err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_9);
      }
    }
    return true;
  }
  
  cmdImport(node ,ctx ,wr ) {
    return false;
  }
  
  getThisName() {
    return "this";
  }
  
  WriteThisVar(node ,ctx ,wr ) {
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.vref == "_" ) {
      return;
    }
    var rootObjName = node.ns[0]
    if ( ctx.isInStatic() ) {
      if ( rootObjName == "this" ) {
        ctx.addError(node, "This can not be used in static context");
      }
    }
    if ( ctx.isEnumDefined(rootObjName) ) {
      var enumName = node.ns[1]
      var ee = ctx.getEnum(rootObjName)
      var e_7 = ee
      if ( typeof(e_7.values[enumName] ) != "undefined" ) {
        node.eval_type = 11;
        node.eval_type_name = rootObjName;
        node.int_value = (e_7.values[enumName]);
      } else {
        ctx.addError(node, (("Undefined Enum " + rootObjName) + ".") + enumName);
        node.eval_type = 1;
      }
      return;
    }
    if ( node.vref == this.getThisName() ) {
      var cd = ctx.getCurrentClass()
      var thisClassDesc = cd
      node.eval_type = 8;
      node.eval_type_name = thisClassDesc.name;
      node.ref_type = 4;
      return;
    }
    if ( (rootObjName == "this") || ctx.isVarDefined(rootObjName) ) {
      /** unused:  var vDef2 = ctx.getVariableDef(rootObjName)   **/ 
      /** unused:  var activeFn_4 = ctx.getCurrentMethod()   **/ 
      var vDef_2 = this.findParamDesc(node, ctx, wr)
      if ( typeof(vDef_2) !== "undefined" ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef_2;
        node.paramDesc = vDef_2;
        vDef_2.ref_cnt = 1 + vDef_2.ref_cnt;
        var vNameNode = vDef_2.nameNode
        if ( typeof(vNameNode) !== "undefined" ) {
          if ( vNameNode.hasFlag("optional") ) {
            node.setFlag("optional");
          }
          node.eval_type = vNameNode.typeNameAsType(ctx);
          node.eval_type_name = vNameNode.type_name;
          if ( vNameNode.value_type == 6 ) {
            node.eval_type = 6;
            node.eval_array_type = vNameNode.array_type;
          }
          if ( vNameNode.value_type == 7 ) {
            node.eval_type = 7;
            node.eval_key_type = vNameNode.key_type;
            node.eval_array_type = vNameNode.array_type;
          }
        }
      }
    } else {
      var class_or_this = rootObjName == this.getThisName()
      if ( ctx.isDefinedClass(rootObjName) ) {
        class_or_this = true;
        node.eval_type = 23;
        node.eval_type_name = rootObjName;
      }
      if ( ctx.hasTemplateNode(rootObjName) ) {
        class_or_this = true;
      }
      if ( false == class_or_this ) {
        var udesc = ctx.getCurrentClass()
        var desc = udesc
        ctx.addError(node, (("Undefined variable " + rootObjName) + " in class ") + desc.name);
      }
      return;
    }
  }
  
  CreateClass(node ,ctx ,wr ) {
  }
  
  DefineVar(node ,ctx ,wr ) {
  }
  
  WriteComment(node ,ctx ,wr ) {
  }
  
  cmdLog(node ,ctx ,wr ) {
  }
  
  cmdDoc(node ,ctx ,wr ) {
  }
  
  cmdGitDoc(node ,ctx ,wr ) {
  }
  
  cmdNative(node ,ctx ,wr ) {
  }
  
  LangInit(node ,ctx ,wr ) {
  }
  
  getWriterLang() {
    return "_";
  }
  
  StartCodeWriting(node ,ctx ,wr ) {
  }
  
  Constructor(node ,ctx ,wr ) {
    this.shouldHaveChildCnt(3, node, ctx, "Method expexts four arguments");
    /** unused:  var cn = node.children[1]   **/ 
    var fnBody = node.children[2]
    var udesc_4 = ctx.getCurrentClass()
    var desc_4 = udesc_4
    var m_5 = desc_4.constructor_fn
    var subCtx_4 = m_5.fnCtx
    subCtx_4.is_function = true;
    subCtx_4.currentMethod = m_5;
    subCtx_4.setInMethod();
    for ( var i_36 = 0; i_36 < m_5.params.length; i_36++) {
      var v = m_5.params[i_36];
      subCtx_4.defineVariable(v.name, v);
    }
    this.WalkNodeChildren(fnBody, subCtx_4, wr);
    subCtx_4.unsetInMethod();
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(node, "constructor should not return any values!");
    }
    for ( var i_40 = 0; i_40 < subCtx_4.localVarNames.length; i_40++) {
      var n_4 = subCtx_4.localVarNames[i_40];
      var p_6 = subCtx_4.localVariables[n_4]
      if ( p_6.set_cnt > 0 ) {
        var defNode = p_6.node
        defNode.setFlag("mutable");
        var nNode = p_6.nameNode
        nNode.setFlag("mutable");
      }
    }
  }
  
  WriteScalarValue(node ,ctx ,wr ) {
    node.eval_type = node.value_type;
    switch (node.value_type ) { 
      case 2 : 
        node.eval_type_name = "double";
        break;
      case 4 : 
        node.eval_type_name = "string";
        break;
      case 3 : 
        node.eval_type_name = "int";
        break;
      case 5 : 
        node.eval_type_name = "boolean";
        break;
    }
  }
  
  buildGenericClass(tpl ,node ,ctx ,wr ) {
    var root_20 = ctx.getRoot()
    var cn_4 = tpl.getSecond()
    var newName = node.getSecond()
    var tplArgs_2 = cn_4.vref_annotation
    var givenArgs = newName.vref_annotation
    var sign_2 = cn_4.vref + givenArgs.getCode()
    if ( typeof(root_20.classSignatures[sign_2] ) != "undefined" ) {
      return;
    }
    console.log("could build generic class... " + cn_4.vref)
    var match_4 = new RangerArgMatch()
    for ( var i_40 = 0; i_40 < tplArgs_2.children.length; i_40++) {
      var arg_7 = tplArgs_2.children[i_40];
      var given = givenArgs.children[i_40]
      console.log(((" setting " + arg_7.vref) + " => ") + given.vref)
      if ( false == match_4.add(arg_7.vref, given.vref, ctx) ) {
        console.log("set failed!")
      } else {
        console.log("set OK")
      }
      console.log(" T == " + match_4.getTypeName(arg_7.vref))
    }
    console.log(" T == " + match_4.getTypeName("T"))
    var newClassNode = tpl.rebuildWithType(match_4, false)
    console.log("build done")
    console.log(newClassNode.getCode())
    var sign_8 = cn_4.vref + givenArgs.getCode()
    console.log("signature ==> " + sign_8)
    var cName = newClassNode.getSecond()
    var friendlyName = root_20.createSignature(cn_4.vref, sign_8)
    console.log("class common name => " + friendlyName)
    cName.vref = friendlyName;
    cName.has_vref_annotation = false;
    console.log(newClassNode.getCode())
    this.CollectMethods(newClassNode, ctx, wr);
    this.WalkNode(newClassNode, root_20, wr);
    console.log("the class collected the methods...")
  }
  
  cmdNew(node ,ctx ,wr ) {
    if ( (node.children.length) < 3 ) {
      ctx.addError(node, "the new operator expects three arguments");
      return;
    }
    var obj = node.getSecond()
    var params = node.getThird()
    var currC
    var b_template = false
    var expects_error_4 = false
    var err_cnt_4 = ctx.getErrorCount()
    if ( node.hasBooleanProperty("error") ) {
      expects_error_4 = true;
    }
    if ( ctx.hasTemplateNode(obj.vref) ) {
      console.log(" ==> template class")
      b_template = true;
      var tpl_4 = ctx.findTemplateNode(obj.vref)
      if ( obj.has_vref_annotation ) {
        console.log("generic class OK")
        this.buildGenericClass(tpl_4, node, ctx, wr);
        currC = ctx.findClassWithSign(obj);
        if ( typeof(currC) !== "undefined" ) {
          console.log("@@ class was found " + obj.vref)
        }
      } else {
        ctx.addError(node, "generic class requires a type annotation");
        return;
      }
    }
    this.WalkNode(obj, ctx, wr);
    for ( var i_42 = 0; i_42 < params.children.length; i_42++) {
      var arg_9 = params.children[i_42];
      ctx.setInExpr();
      this.WalkNode(arg_9, ctx, wr);
      ctx.unsetInExpr();
    }
    node.eval_type = 8;
    node.eval_type_name = obj.vref;
    if ( b_template == false ) {
      currC = ctx.findClass(obj.vref);
    }
    node.hasNewOper = true;
    node.clDesc = currC;
    var fnDescr = currC.constructor_fn
    if ( typeof(fnDescr) !== "undefined" ) {
      for ( var i_46 = 0; i_46 < fnDescr.params.length; i_46++) {
        var param = fnDescr.params[i_46];
        var has_default = false
        if ( param.nameNode.hasFlag("default") ) {
          has_default = true;
        }
        if ( (params.children.length) <= i_46 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(node, "Argument was not defined");
        }
        var argNode_4 = params.children[i_46]
        if ( false == this.areEqualTypes((param.nameNode), argNode_4, ctx) ) {
          ctx.addError(node, ("ERROR, invalid argument types for " + currC.name) + " constructor ");
        }
        var pNode = param.nameNode
        if ( pNode.hasFlag("optional") ) {
          if ( false == argNode_4.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected optional parameter" + argNode_4.getCode());
          }
        }
        if ( argNode_4.hasFlag("optional") ) {
          if ( false == pNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected non-optional, optional given" + argNode_4.getCode());
          }
        }
      }
    }
    if ( expects_error_4 ) {
      var cnt_now_6 = ctx.getErrorCount()
      if ( cnt_now_6 == err_cnt_4 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_4) + " : ") + cnt_now_6);
      }
    } else {
      var cnt_now_13 = ctx.getErrorCount()
      if ( cnt_now_13 > err_cnt_4 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_4) + " : ") + cnt_now_13);
      }
    }
  }
  
  cmdLocalCall(node ,ctx ,wr ) {
    var fnNode = node.getFirst()
    var udesc_6 = ctx.getCurrentClass()
    var desc_6 = udesc_6
    var expects_error_6 = false
    var err_cnt_6 = ctx.getErrorCount()
    if ( node.hasBooleanProperty("error") ) {
      expects_error_6 = true;
    }
    if ( (fnNode.ns.length) > 1 ) {
      var vFnDef = this.findFunctionDesc(fnNode, ctx, wr)
      if ( typeof(vFnDef) !== "undefined" ) {
        vFnDef.ref_cnt = vFnDef.ref_cnt + 1;
        var subCtx_6 = ctx.fork()
        node.hasFnCall = true;
        node.fnDesc = vFnDef;
        var p_8 = new RangerAppParamDesc()
        p_8.name = fnNode.vref;
        p_8.value_type = fnNode.value_type;
        p_8.node = fnNode;
        p_8.nameNode = fnNode;
        p_8.varType = 10;
        subCtx_6.defineVariable(p_8.name, p_8);
        this.WalkNode(fnNode, subCtx_6, wr);
        var callParams = node.children[1]
        for ( var i_46 = 0; i_46 < callParams.children.length; i_46++) {
          var arg_11 = callParams.children[i_46];
          ctx.setInExpr();
          this.WalkNode(arg_11, subCtx_6, wr);
          ctx.unsetInExpr();
          var fnArg = vFnDef.params[i_46]
          var callArgP = arg_11.paramDesc
          if ( typeof(callArgP) !== "undefined" ) {
            callArgP.moveRefTo(node, fnArg, ctx);
          }
        }
        for ( var i_54 = 0; i_54 < vFnDef.params.length; i_54++) {
          var param_4 = vFnDef.params[i_54];
          if ( (callParams.children.length) <= i_54 ) {
            if ( param_4.nameNode.hasFlag("default") ) {
              continue;
            }
            ctx.addError(node, "Argument was not defined");
            break;
          }
          var argNode_6 = callParams.children[i_54]
          if ( false == this.areEqualTypes((param_4.nameNode), argNode_6, ctx) ) {
            ctx.addError(node, "ERROR, invalid argument types for method " + vFnDef.name);
          }
          var pNode_4 = param_4.nameNode
          if ( pNode_4.hasFlag("optional") ) {
            if ( false == argNode_6.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider making parameter optional " + argNode_6.getCode());
            }
          }
          if ( argNode_6.hasFlag("optional") ) {
            if ( false == pNode_4.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider unwrapping " + argNode_6.getCode());
            }
          }
        }
        var nn_3 = vFnDef.nameNode
        node.eval_type = nn_3.typeNameAsType(ctx);
        node.eval_type_name = nn_3.type_name;
        if ( nn_3.hasFlag("optional") ) {
          node.setFlag("optional");
        }
        if ( expects_error_6 ) {
          var cnt_now_10 = ctx.getErrorCount()
          if ( cnt_now_10 == err_cnt_6 ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_10);
          }
        } else {
          var cnt_now_21 = ctx.getErrorCount()
          if ( cnt_now_21 > err_cnt_6 ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_21);
          }
        }
        return true;
      } else {
        ctx.addError(node, "Called Object or Property was not defined");
      }
    }
    if ( desc_6.hasMethod(fnNode.vref) ) {
      var fnDescr_4 = desc_6.findMethod(fnNode.vref)
      var subCtx_10 = ctx.fork()
      node.hasFnCall = true;
      node.fnDesc = fnDescr_4;
      var p_12 = new RangerAppParamDesc()
      p_12.name = fnNode.vref;
      p_12.value_type = fnNode.value_type;
      p_12.node = fnNode;
      p_12.nameNode = fnNode;
      p_12.varType = 10;
      subCtx_10.defineVariable(p_12.name, p_12);
      this.WriteThisVar(fnNode, subCtx_10, wr);
      this.WalkNode(fnNode, subCtx_10, wr);
      for ( var i_53 = 0; i_53 < node.children.length; i_53++) {
        var arg_15 = node.children[i_53];
        if ( i_53 < 1 ) {
          continue;
        }
        ctx.setInExpr();
        this.WalkNode(arg_15, subCtx_10, wr);
        ctx.unsetInExpr();
      }
      for ( var i_58 = 0; i_58 < fnDescr_4.params.length; i_58++) {
        var param_8 = fnDescr_4.params[i_58];
        if ( (node.children.length) <= (i_58 + 1) ) {
          ctx.addError(node, "Argument was not defined");
          break;
        }
        var argNode_10 = node.children[(i_58 + 1)]
        if ( false == this.areEqualTypes((param_8.nameNode), argNode_10, ctx) ) {
          ctx.addError(node, (("ERROR, invalid argument types for " + desc_6.name) + " method ") + fnDescr_4.name);
        }
      }
      var nn_8 = fnDescr_4.nameNode
      nn_8.defineNodeTypeTo(node, ctx);
      if ( expects_error_6 ) {
        var cnt_now_17 = ctx.getErrorCount()
        if ( cnt_now_17 == err_cnt_6 ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_17);
        }
      } else {
        var cnt_now_25 = ctx.getErrorCount()
        if ( cnt_now_25 > err_cnt_6 ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_25);
        }
      }
      return true;
    }
    ctx.addError(node, (("ERROR, could not find class " + desc_6.name) + " method ") + fnNode.vref);
    ctx.addError(node, "definition : " + node.getCode());
    if ( expects_error_6 ) {
      var cnt_now_23 = ctx.getErrorCount()
      if ( cnt_now_23 == err_cnt_6 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_23);
      }
    } else {
      var cnt_now_29 = ctx.getErrorCount()
      if ( cnt_now_29 > err_cnt_6 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_29);
      }
    }
    return false;
  }
  
  cmdReturn(node ,ctx ,wr ) {
    node.has_operator = true;
    node.op_index = 5;
    console.log("cmdReturn")
    if ( (node.children.length) > 1 ) {
      var fc_18 = node.getSecond()
      if ( fc_18.vref == "_" ) {
      } else {
        ctx.setInExpr();
        this.WalkNode(fc_18, ctx, wr);
        ctx.unsetInExpr();
        /** unused:  var activeFn_6 = ctx.getCurrentMethod()   **/ 
        if ( fc_18.hasParamDesc ) {
          fc_18.paramDesc.return_cnt = 1 + fc_18.paramDesc.return_cnt;
          fc_18.paramDesc.ref_cnt = 1 + fc_18.paramDesc.ref_cnt;
        }
        var currFn = ctx.getCurrentMethod()
        if ( fc_18.hasParamDesc ) {
          console.log("cmdReturn move-->")
          var pp_6 = fc_18.paramDesc
          pp_6.moveRefTo(node, currFn, ctx);
        } else {
          console.log("cmdReturn had no param desc")
        }
      }
    }
  }
  
  cmdAssign(node ,ctx ,wr ) {
    wr.newline();
    var n1 = node.getSecond()
    var n2 = node.getThird()
    this.WalkNode(n1, ctx, wr);
    ctx.setInExpr();
    this.WalkNode(n2, ctx, wr);
    ctx.unsetInExpr();
    if ( n1.hasParamDesc ) {
      n1.paramDesc.ref_cnt = n1.paramDesc.ref_cnt + 1;
      n1.paramDesc.set_cnt = n1.paramDesc.set_cnt + 1;
    }
    if ( n2.hasParamDesc ) {
      n2.paramDesc.ref_cnt = n2.paramDesc.ref_cnt + 1;
    }
    if ( n2.hasFlag("optional") ) {
      if ( false == n1.hasFlag("optional") ) {
        ctx.addError(node, "Can not assign optional to non-optional type");
      }
    }
    this.stdParamMatch(node, ctx, wr);
  }
  
  EnterTemplateClass(node ,ctx ,wr ) {
  }
  
  EnterClass(node ,ctx ,wr ) {
    if ( (node.children.length) != 3 ) {
      ctx.addError(node, "Invalid class declaration");
      return;
    }
    var cn_6 = node.children[1]
    var cBody = node.children[2]
    var desc_8 = ctx.findClass(cn_6.vref)
    if ( cn_6.has_vref_annotation ) {
      console.log("--> generic class, not processed")
      return;
    }
    var subCtx_10 = desc_8.ctx
    subCtx_10.setCurrentClass(desc_8);
    for ( var i_54 = 0; i_54 < desc_8.variables.length; i_54++) {
      var p_12 = desc_8.variables[i_54];
      var vNode = p_12.node
      if ( (vNode.children.length) > 2 ) {
        var value = vNode.children[2]
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      p_12.is_class_variable = true;
      p_12.nameNode.eval_type = p_12.nameNode.typeNameAsType(ctx);
      p_12.nameNode.eval_type_name = p_12.nameNode.type_name;
    }
    for ( var i_58 = 0; i_58 < cBody.children.length; i_58++) {
      var fNode = cBody.children[i_58];
      if ( fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") ) {
        this.WalkNode(fNode, subCtx_10, wr);
      }
    }
    for ( var i_61 = 0; i_61 < cBody.children.length; i_61++) {
      var fNode_6 = cBody.children[i_61];
      if ( fNode_6.isFirstVref("fn") || fNode_6.isFirstVref("PublicMethod") ) {
        this.WalkNode(fNode_6, subCtx_10, wr);
      }
    }
    var staticCtx = ctx.fork()
    staticCtx.setCurrentClass(desc_8);
    for ( var i_64 = 0; i_64 < cBody.children.length; i_64++) {
      var fNode_9 = cBody.children[i_64];
      if ( fNode_9.isFirstVref("sfn") || fNode_9.isFirstVref("StaticMethod") ) {
        this.WalkNode(fNode_9, staticCtx, wr);
      }
    }
    node.hasClassDescription = true;
    node.clDesc = desc_8;
    desc_8.classNode = node;
  }
  
  EnterMethod(node ,ctx ,wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    var cn_8 = node.children[1]
    var fnBody_4 = node.children[3]
    var udesc_8 = ctx.getCurrentClass()
    var desc_10 = udesc_8
    var um = desc_10.findMethod(cn_8.vref)
    var m_8 = um
    var subCtx_12 = m_8.fnCtx
    subCtx_12.currentMethod = m_8;
    for ( var i_62 = 0; i_62 < m_8.params.length; i_62++) {
      var v_4 = m_8.params[i_62];
      v_4.nameNode.eval_type = v_4.nameNode.typeNameAsType(subCtx_12);
      v_4.nameNode.eval_type_name = v_4.nameNode.type_name;
    }
    subCtx_12.setInMethod();
    this.WalkNodeChildren(fnBody_4, subCtx_12, wr);
    subCtx_12.unsetInMethod();
    if ( fnBody_4.didReturnAtIndex == -1 ) {
      if ( cn_8.type_name != "void" ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( var i_66 = 0; i_66 < subCtx_12.localVarNames.length; i_66++) {
      var n_7 = subCtx_12.localVarNames[i_66];
      var p_14 = subCtx_12.localVariables[n_7]
      if ( p_14.set_cnt > 0 ) {
        var defNode_4 = p_14.node
        defNode_4.setFlag("mutable");
        var nNode_4 = p_14.nameNode
        nNode_4.setFlag("mutable");
      }
    }
  }
  
  EnterStaticMethod(node ,ctx ,wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    var cn_10 = node.children[1]
    var fnBody_6 = node.children[3]
    var udesc_10 = ctx.getCurrentClass()
    var desc_12 = udesc_10
    var subCtx_14 = ctx.fork()
    subCtx_14.is_function = true;
    var um_4 = desc_12.findStaticMethod(cn_10.vref)
    var m_10 = um_4
    subCtx_14.currentMethod = m_10;
    subCtx_14.in_static_method = true;
    m_10.fnCtx = subCtx_14;
    if ( cn_10.hasFlag("weak") ) {
      m_10.changeStrength(0, 1, node);
    } else {
      m_10.changeStrength(1, 1, node);
    }
    subCtx_14.setInMethod();
    for ( var i_66 = 0; i_66 < m_10.params.length; i_66++) {
      var v_6 = m_10.params[i_66];
      subCtx_14.defineVariable(v_6.name, v_6);
      v_6.nameNode.eval_type = v_6.nameNode.typeNameAsType(ctx);
      v_6.nameNode.eval_type_name = v_6.nameNode.type_name;
    }
    this.WalkNodeChildren(fnBody_6, subCtx_14, wr);
    subCtx_14.unsetInMethod();
    subCtx_14.in_static_method = false;
    if ( fnBody_6.didReturnAtIndex == -1 ) {
      if ( cn_10.type_name != "void" ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( var i_70 = 0; i_70 < subCtx_14.localVarNames.length; i_70++) {
      var n_9 = subCtx_14.localVarNames[i_70];
      var p_16 = subCtx_14.localVariables[n_9]
      if ( p_16.set_cnt > 0 ) {
        var defNode_6 = p_16.node
        defNode_6.setFlag("mutable");
        var nNode_6 = p_16.nameNode
        nNode_6.setFlag("mutable");
      }
    }
  }
  
  EnterLambdaMethod(node ,ctx ,wr ) {
    console.log("--> found a lambda method")
    node.eval_type = 16;
    var args_4 = node.children[2]
    var body = node.children[3]
    var subCtx_16 = ctx.fork()
    for ( var i_70 = 0; i_70 < args_4.children.length; i_70++) {
      var arg_15 = args_4.children[i_70];
      var v_8 = new RangerAppParamDesc()
      v_8.name = arg_15.vref;
      v_8.node = arg_15;
      v_8.nameNode = arg_15;
      subCtx_16.defineVariable(v_8.name, v_8);
    }
    for ( var i_74 = 0; i_74 < body.children.length; i_74++) {
      var item_5 = body.children[i_74];
      this.WalkNode(item_5, subCtx_16, wr);
    }
    console.log("--> EXITLAMBDA")
  }
  
  EnterVarDef(node ,ctx ,wr ) {
    if ( ctx.isInMethod() ) {
      if ( (node.children.length) > 3 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      if ( (node.children.length) < 2 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      var cn_12 = node.children[1]
      var p_18 = new RangerAppParamDesc()
      var defaultArg
      if ( (node.children.length) == 2 ) {
        if ( (cn_12.value_type != 6) && (cn_12.value_type != 7) ) {
          cn_12.setFlag("optional");
        }
      }
      ctx.hadValidType(cn_12);
      cn_12.defineNodeTypeTo(cn_12, ctx);
      if ( (cn_12.vref.length) == 0 ) {
        ctx.addError(node, "invalid variable definition");
      }
      if ( cn_12.hasFlag("weak") ) {
        p_18.changeStrength(0, 1, node);
      } else {
        p_18.changeStrength(1, 1, node);
      }
      node.hasVarDef = true;
      if ( (node.children.length) > 2 ) {
        p_18.init_cnt = 1;
        p_18.def_value = node.children[2];
        p_18.is_optional = false;
        defaultArg = node.children[2];
        ctx.setInExpr();
        this.WalkNode(defaultArg, ctx, wr);
        ctx.unsetInExpr();
        if ( defaultArg.hasFlag("optional") ) {
          cn_12.setFlag("optional");
        }
        if ( defaultArg.eval_type == 6 ) {
          node.op_index = 1;
        }
        if ( cn_12.value_type == 11 ) {
          cn_12.eval_type_name = defaultArg.ns[0];
        }
        if ( cn_12.value_type == 12 ) {
          if ( (defaultArg.eval_type != 3) && (defaultArg.eval_type != 12) ) {
            ctx.addError(defaultArg, "Char should be assigned char or integer value --> " + defaultArg.getCode());
          } else {
            defaultArg.eval_type = 12;
          }
        }
      } else {
        if ( ((cn_12.value_type != 7) && (cn_12.value_type != 6)) && (false == cn_12.hasFlag("optional")) ) {
          cn_12.setFlag("optional");
        }
      }
      p_18.name = cn_12.vref;
      if ( p_18.value_type == 0 ) {
        if ( (0 == (cn_12.type_name.length)) && (typeof(defaultArg) !== "undefined") ) {
          p_18.value_type = defaultArg.eval_type;
          cn_12.type_name = defaultArg.eval_type_name;
          cn_12.eval_type_name = defaultArg.eval_type_name;
          cn_12.value_type = defaultArg.eval_type;
        }
      } else {
        p_18.value_type = cn_12.value_type;
      }
      p_18.node = node;
      p_18.nameNode = cn_12;
      p_18.varType = 5;
      if ( cn_12.has_vref_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
        var ann_17 = cn_12.vref_annotation
        if ( (ann_17.children.length) > 0 ) {
          var fc_20 = ann_17.children[0]
          ctx.log(node, "ann", (("value of first annotation " + fc_20.vref) + " and variable name ") + cn_12.vref);
        }
      }
      if ( cn_12.has_type_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found annotated reference ");
        var ann_23 = cn_12.type_annotation
        if ( (ann_23.children.length) > 0 ) {
          var fc_26 = ann_23.children[0]
          ctx.log(node, "ann", (("value of first annotation " + fc_26.vref) + " and variable name ") + cn_12.vref);
        }
      }
      cn_12.hasParamDesc = true;
      cn_12.ownParamDesc = p_18;
      cn_12.paramDesc = p_18;
      node.hasParamDesc = true;
      node.paramDesc = p_18;
      cn_12.eval_type = cn_12.typeNameAsType(ctx);
      cn_12.eval_type_name = cn_12.type_name;
      if ( (node.children.length) > 2 ) {
        if ( cn_12.eval_type != defaultArg.eval_type ) {
          ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn_12.eval_type) + " vs ") + defaultArg.eval_type);
        }
      } else {
        p_18.is_optional = true;
      }
      ctx.defineVariable(p_18.name, p_18);
      this.DefineVar(node, ctx, wr);
      if ( (node.children.length) > 2 ) {
        this.shouldBeEqualTypes(cn_12, p_18.def_value, ctx, "Variable was assigned an incompatible type.");
      }
    } else {
      var cn_19 = node.children[1]
      cn_19.eval_type = cn_19.typeNameAsType(ctx);
      cn_19.eval_type_name = cn_19.type_name;
      this.DefineVar(node, ctx, wr);
      if ( (node.children.length) > 2 ) {
        this.shouldBeEqualTypes(node.children[1], node.children[2], ctx, "Variable was assigned an incompatible type.");
      }
    }
  }
  
  WalkNodeChildren(node ,ctx ,wr ) {
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.expression ) {
      for ( var i_74 = 0; i_74 < node.children.length; i_74++) {
        var item_7 = node.children[i_74];
        item_7.parent = node;
        this.WalkNode(item_7, ctx, wr);
        node.copyEvalResFrom(item_7);
      }
    }
  }
  
  matchNode(node ,ctx ,wr ) {
    if ( 0 == (node.children.length) ) {
      return false;
    }
    var fc_24 = node.getFirst()
    this.stdCommands = ctx.getStdCommands();
    for ( var i_76 = 0; i_76 < this.stdCommands.children.length; i_76++) {
      var cmd = this.stdCommands.children[i_76];
      var cmdName = cmd.getFirst()
      if ( cmdName.vref == fc_24.vref ) {
        this.stdParamMatch(node, ctx, wr);
        if ( typeof(node.parent) !== "undefined" ) {
          node.parent.copyEvalResFrom(node);
        }
        return true;
      }
    }
    return false;
  }
  
  WalkNode(node ,ctx ,wr ) {
    /** unused:  var line_index_4 = node.getLine()   **/ 
    if ( node.flow_done ) {
      return true;
    }
    node.flow_done = true;
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.isPrimitive() ) {
      if ( ctx.expressionLevel() == 0 ) {
        ctx.addError(node, "Primitive element at top level!");
      }
      this.WriteScalarValue(node, ctx, wr);
      return true;
    }
    if ( node.value_type == 9 ) {
      this.WriteVRef(node, ctx, wr);
      return true;
    }
    if ( node.value_type == 10 ) {
      this.WriteComment(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("lambda") ) {
      this.EnterLambdaMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("Extends") ) {
      return true;
    }
    if ( node.isFirstVref("operators") ) {
      return true;
    }
    if ( node.isFirstVref("systemclass") ) {
      return true;
    }
    if ( node.isFirstVref("Import") ) {
      this.cmdImport(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("def") ) {
      this.EnterVarDef(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("let") ) {
      this.EnterVarDef(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("TemplateClass") ) {
      this.EnterTemplateClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("CreateClass") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("class") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("PublicMethod") ) {
      this.EnterMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("StaticMethod") ) {
      this.EnterStaticMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("fn") ) {
      this.EnterMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("sfn") ) {
      this.EnterStaticMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("=") ) {
      this.cmdAssign(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("Constructor") ) {
      this.Constructor(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("new") ) {
      this.cmdNew(node, ctx, wr);
      return true;
    }
    if ( this.matchNode(node, ctx, wr) ) {
      return true;
    }
    if ( (node.children.length) > 0 ) {
      var fc_26 = node.children[0]
      if ( fc_26.value_type == 9 ) {
        var was_called = true
        switch (fc_26.vref ) { 
          case "Enum" : 
            this.cmdEnum(node, ctx, wr);
            break;
          default: 
            was_called = false;
            break;
        }
        if ( was_called ) {
          return true;
        }
        if ( (node.children.length) > 1 ) {
          if ( this.cmdLocalCall(node, ctx, wr) ) {
            return true;
          }
        }
      }
    }
    if ( node.expression ) {
      for ( var i_78 = 0; i_78 < node.children.length; i_78++) {
        var item_9 = node.children[i_78];
        item_9.parent = node;
        this.WalkNode(item_9, ctx, wr);
        node.copyEvalResFrom(item_9);
      }
      return true;
    }
    ctx.addError(node, "Could not understand this part");
    return true;
  }
  
  mergeImports(node ,ctx ,wr ) {
    if ( node.isFirstVref("Import") ) {
      var fNameNode_4 = node.children[1]
      var import_file = fNameNode_4.string_value
      if ( typeof(ctx.already_imported[import_file] ) != "undefined" ) {
        return;
      }
      ctx.already_imported[import_file] = true
      var c_6 = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + import_file , 'utf8'))
      var code = new SourceCode(c_6)
      code.filename = import_file;
      var parser = new RangerLispParser(code)
      parser.parse();
      node.expression = true;
      node.vref = "";
      node.children.pop();
      node.children.pop();
      var rn_2 = parser.rootNode
      this.mergeImports(rn_2, ctx, wr);
      node.children.push(rn_2);
    } else {
      for ( var i_80 = 0; i_80 < node.children.length; i_80++) {
        var item_11 = node.children[i_80];
        this.mergeImports(item_11, ctx, wr);
      }
    }
  }
  
  CollectMethods(node ,ctx ,wr ) {
    var find_more = true
    if ( node.isFirstVref("systemclass") ) {
      console.log("---------- found systemclass ------ ")
      var nameNode_4 = node.getSecond()
      var instances = node.getThird()
      var new_class = new RangerAppClassDesc()
      new_class.name = nameNode_4.vref;
      new_class.nameNode = nameNode_4;
      ctx.addClass(nameNode_4.vref, new_class);
      new_class.is_system = true;
      for ( var i_82 = 0; i_82 < instances.children.length; i_82++) {
        var ch_7 = instances.children[i_82];
        var langName_4 = ch_7.getFirst()
        var langClassName = ch_7.getSecond()
        new_class.systemNames[langName_4.vref] = langClassName.vref
      }
      nameNode_4.is_system_class = true;
      nameNode_4.clDesc = new_class;
      return;
    }
    if ( node.isFirstVref("Extends") ) {
      var extList = node.children[1]
      var currC_4 = ctx.currentClass
      for ( var ii_7 = 0; ii_7 < extList.children.length; ii_7++) {
        var ee_4 = extList.children[ii_7];
        currC_4.addParentClass(ee_4.vref);
        var ParentClass = ctx.findClass(ee_4.vref)
        ParentClass.is_inherited = true;
      }
    }
    if ( node.isFirstVref("Constructor") ) {
      var currC_8 = ctx.currentClass
      var subCtx_18 = currC_8.ctx.fork()
      currC_8.has_constructor = true;
      currC_8.constructor_node = node;
      var m_12 = new RangerAppFunctionDesc()
      m_12.name = "Constructor";
      m_12.node = node;
      m_12.nameNode = node.children[0];
      m_12.fnBody = node.children[2];
      m_12.fnCtx = subCtx_18;
      var args_6 = node.children[1]
      for ( var ii_12 = 0; ii_12 < args_6.children.length; ii_12++) {
        var arg_17 = args_6.children[ii_12];
        var p_20 = new RangerAppParamDesc()
        p_20.name = arg_17.vref;
        p_20.value_type = arg_17.value_type;
        p_20.node = arg_17;
        p_20.nameNode = arg_17;
        p_20.refType = 1;
        p_20.varType = 4;
        m_12.params.push(p_20);
        arg_17.hasParamDesc = true;
        arg_17.paramDesc = p_20;
        arg_17.eval_type = arg_17.value_type;
        arg_17.eval_type_name = arg_17.type_name;
        subCtx_18.defineVariable(p_20.name, p_20);
      }
      currC_8.constructor_fn = m_12;
      find_more = false;
    }
    if ( node.isFirstVref("CreateClass") || node.isFirstVref("class") ) {
      var s_13 = node.getVRefAt(1)
      var classNameNode = node.getSecond()
      if ( classNameNode.has_vref_annotation ) {
        console.log("%% vref_annotation")
        var ann_21 = classNameNode.vref_annotation
        console.log((classNameNode.vref + " : ") + ann_21.getCode())
        ctx.addTemplateClass(classNameNode.vref, node);
        find_more = false;
      } else {
        var new_class_6 = new RangerAppClassDesc()
        new_class_6.name = s_13;
        var subCtx_22 = ctx.fork()
        ctx.setCurrentClass(new_class_6);
        subCtx_22.setCurrentClass(new_class_6);
        new_class_6.ctx = subCtx_22;
        new_class_6.nameNode = classNameNode;
        ctx.addClass(s_13, new_class_6);
        new_class_6.classNode = node;
      }
    }
    if ( node.isFirstVref("TemplateClass") ) {
      var s_18 = node.getVRefAt(1)
      ctx.addTemplateClass(s_18, node);
      find_more = false;
    }
    if ( node.isFirstVref("Extends") ) {
      var list_2 = node.children[1]
      for ( var i_86 = 0; i_86 < list_2.children.length; i_86++) {
        var cname_5 = list_2.children[i_86];
        var extC = ctx.findClass(cname_5.vref)
        for ( var i_95 = 0; i_95 < extC.variables.length; i_95++) {
          var vv = extC.variables[i_95];
          var currC_11 = ctx.currentClass
          var subCtx_25 = currC_11.ctx
          subCtx_25.defineVariable(vv.name, vv);
        }
      }
      find_more = false;
    }
    if ( node.isFirstVref("def") || node.isFirstVref("let") ) {
      var s_21 = node.getVRefAt(1)
      var vDef_5 = node.children[1]
      var p_24 = new RangerAppParamDesc()
      p_24.name = s_21;
      p_24.value_type = vDef_5.value_type;
      p_24.node = node;
      p_24.is_class_variable = true;
      p_24.varType = 8;
      p_24.node = node;
      p_24.nameNode = vDef_5;
      vDef_5.hasParamDesc = true;
      vDef_5.ownParamDesc = p_24;
      vDef_5.paramDesc = p_24;
      node.hasParamDesc = true;
      node.paramDesc = p_24;
      if ( vDef_5.hasFlag("weak") ) {
        p_24.changeStrength(0, 2, p_24.nameNode);
      } else {
        p_24.changeStrength(2, 2, p_24.nameNode);
      }
      if ( (node.children.length) > 2 ) {
        p_24.set_cnt = 1;
        p_24.def_value = node.children[2];
        p_24.is_optional = false;
      } else {
        p_24.is_optional = true;
        if ( false == ((vDef_5.value_type == 6) || (vDef_5.value_type == 7)) ) {
          vDef_5.setFlag("optional");
        }
      }
      var currC_14 = ctx.currentClass
      currC_14.addVariable(p_24);
      var subCtx_28 = currC_14.ctx
      subCtx_28.defineVariable(p_24.name, p_24);
      p_24.is_class_variable = true;
    }
    if ( node.isFirstVref("operators") ) {
      var listOf = node.getSecond()
      for ( var i_92 = 0; i_92 < listOf.children.length; i_92++) {
        var item_13 = listOf.children[i_92];
        ctx.createOperator(item_13);
      }
      find_more = false;
    }
    if ( node.isFirstVref("Import") || node.isFirstVref("import") ) {
      var fNameNode_6 = node.children[1]
      var import_file_4 = fNameNode_6.string_value
      if ( typeof(ctx.already_imported[import_file_4] ) != "undefined" ) {
        return;
      } else {
        ctx.already_imported[import_file_4] = true
      }
      var c_9 = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + import_file_4 , 'utf8'))
      var code_4 = new SourceCode(c_9)
      code_4.filename = import_file_4;
      var parser_4 = new RangerLispParser(code_4)
      parser_4.parse();
      var rnode = parser_4.rootNode
      this.CollectMethods(rnode, ctx, wr);
      find_more = false;
    }
    if ( node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") ) {
      var s_24 = node.getVRefAt(1)
      var currC_17 = ctx.currentClass
      var m_16 = new RangerAppFunctionDesc()
      m_16.name = s_24;
      m_16.node = node;
      m_16.is_static = true;
      m_16.nameNode = node.children[1];
      var args_10 = node.children[2]
      m_16.fnBody = node.children[3];
      for ( var ii_15 = 0; ii_15 < args_10.children.length; ii_15++) {
        var arg_21 = args_10.children[ii_15];
        var p_27 = new RangerAppParamDesc()
        p_27.name = arg_21.vref;
        p_27.value_type = arg_21.value_type;
        p_27.node = arg_21;
        p_27.nameNode = arg_21;
        p_27.refType = 1;
        p_27.varType = 4;
        m_16.params.push(p_27);
        arg_21.hasParamDesc = true;
        arg_21.paramDesc = p_27;
        arg_21.eval_type = arg_21.value_type;
        arg_21.eval_type_name = arg_21.type_name;
        if ( arg_21.hasFlag("strong") ) {
          p_27.changeStrength(1, 1, p_27.nameNode);
        } else {
          arg_21.setFlag("lives");
          p_27.changeStrength(0, 1, p_27.nameNode);
        }
      }
      currC_17.addStaticMethod(m_16);
      find_more = false;
    }
    if ( node.isFirstVref("PublicMethod") || node.isFirstVref("fn") ) {
      var cn_16 = node.getSecond()
      var s_27 = node.getVRefAt(1)
      var currC_20 = ctx.currentClass
      var m_19 = new RangerAppFunctionDesc()
      m_19.name = s_27;
      m_19.node = node;
      m_19.nameNode = node.children[1];
      if ( node.hasBooleanProperty("strong") ) {
        m_19.refType = 2;
      } else {
        m_19.refType = 1;
      }
      var subCtx_31 = currC_20.ctx.fork()
      subCtx_31.is_function = true;
      subCtx_31.currentMethod = m_19;
      m_19.fnCtx = subCtx_31;
      if ( cn_16.hasFlag("weak") ) {
        m_19.changeStrength(0, 1, node);
      } else {
        m_19.changeStrength(1, 1, node);
      }
      var args_13 = node.children[2]
      m_19.fnBody = node.children[3];
      for ( var ii_18 = 0; ii_18 < args_13.children.length; ii_18++) {
        var arg_24 = args_13.children[ii_18];
        var p2 = new RangerAppParamDesc()
        p2.name = arg_24.vref;
        p2.value_type = arg_24.value_type;
        p2.node = arg_24;
        p2.nameNode = arg_24;
        p2.refType = 1;
        p2.initRefType = 1;
        p2.debugString = "--> collected ";
        if ( args_13.hasBooleanProperty("strong") ) {
          p2.debugString = "--> collected as STRONG";
          ctx.log(node, "memory5", "strong param should move local ownership to call ***");
          p2.refType = 2;
          p2.initRefType = 2;
        }
        p2.varType = 4;
        m_19.params.push(p2);
        arg_24.hasParamDesc = true;
        arg_24.paramDesc = p2;
        arg_24.eval_type = arg_24.value_type;
        arg_24.eval_type_name = arg_24.type_name;
        if ( arg_24.hasFlag("strong") ) {
          p2.changeStrength(1, 1, p2.nameNode);
        } else {
          arg_24.setFlag("lives");
          p2.changeStrength(0, 1, p2.nameNode);
        }
        subCtx_31.defineVariable(p2.name, p2);
      }
      currC_20.addMethod(m_19);
      find_more = false;
    }
    if ( find_more ) {
      for ( var i_95 = 0; i_95 < node.children.length; i_95++) {
        var item_17 = node.children[i_95];
        this.CollectMethods(item_17, ctx, wr);
      }
    }
  }
  
  FindWeakRefs(node ,ctx ,wr ) {
    var list_5 = ctx.getClasses()
    for ( var i_92 = 0; i_92 < list_5.length; i_92++) {
      var classDesc = list_5[i_92];
      for ( var i2 = 0; i2 < classDesc.variables.length; i2++) {
        var varD = classDesc.variables[i2];
        if ( varD.refType == 1 ) {
          if ( varD.isArray() ) {
            /** unused:  var nn_8 = varD.nameNode   **/ 
          }
          if ( varD.isHash() ) {
            /** unused:  var nn_18 = varD.nameNode   **/ 
          }
          if ( varD.isObject() ) {
            /** unused:  var nn_24 = varD.nameNode   **/ 
          }
        }
      }
    }
  }
  
  findFunctionDesc(obj ,ctx ,wr ) {
    var varDesc
    var varFnDesc
    if ( obj.vref != this.getThisName() ) {
      if ( (obj.ns.length) > 1 ) {
        var cnt_4 = obj.ns.length
        var classRefDesc
        var classDesc_4
        for ( var i_94 = 0; i_94 < obj.ns.length; i_94++) {
          var strname = obj.ns[i_94];
          if ( i_94 == 0 ) {
            if ( strname == this.getThisName() ) {
              classDesc_4 = ctx.getCurrentClass();
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc_4 = ctx.findClass(strname);
                continue;
              }
              classRefDesc = ctx.getVariableDef(strname);
              if ( (typeof(classRefDesc) === "undefined") || (typeof(classRefDesc.nameNode) === "undefined") ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              classRefDesc.ref_cnt = 1 + classRefDesc.ref_cnt;
              classDesc_4 = ctx.findClass(classRefDesc.nameNode.type_name);
              if ( typeof(classDesc_4) === "undefined" ) {
                return varFnDesc;
              }
            }
          } else {
            if ( typeof(classDesc_4) === "undefined" ) {
              return varFnDesc;
            }
            if ( i_94 < (cnt_4 - 1) ) {
              varDesc = classDesc_4.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              var subClass = varDesc.getTypeName()
              classDesc_4 = ctx.findClass(subClass);
              continue;
            }
            if ( typeof(classDesc_4) !== "undefined" ) {
              varFnDesc = classDesc_4.findMethod(strname);
              if ( typeof(varFnDesc) === "undefined" ) {
                varFnDesc = classDesc_4.findStaticMethod(strname);
                if ( typeof(varFnDesc) === "undefined" ) {
                  ctx.addError(obj, " function variable not found " + strname);
                }
              }
            }
          }
        }
        return varFnDesc;
      }
      var udesc_12 = ctx.getCurrentClass()
      var currClass = udesc_12
      varFnDesc = currClass.findMethod(obj.vref);
      if ( typeof(varFnDesc.nameNode) !== "undefined" ) {
      } else {
        ctx.addError(obj, "Error, no description for called function: " + obj.vref);
      }
      return varFnDesc;
    }
    ctx.addError(obj, "Can not call 'this' like function");
    varFnDesc = new RangerAppFunctionDesc();
    return varFnDesc;
  }
  
  findParamDesc(obj ,ctx ,wr ) {
    var varDesc_4
    var set_nsp = false
    var classDesc_6
    if ( 0 == (obj.nsp.length) ) {
      set_nsp = true;
    }
    if ( obj.vref != this.getThisName() ) {
      if ( (obj.ns.length) > 1 ) {
        var cnt_7 = obj.ns.length
        var classRefDesc_4
        for ( var i_96 = 0; i_96 < obj.ns.length; i_96++) {
          var strname_4 = obj.ns[i_96];
          if ( i_96 == 0 ) {
            if ( strname_4 == this.getThisName() ) {
              classDesc_6 = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.push(classDesc_6);
              }
            } else {
              if ( ctx.isDefinedClass(strname_4) ) {
                classDesc_6 = ctx.findClass(strname_4);
                if ( set_nsp ) {
                  obj.nsp.push(classDesc_6);
                }
                continue;
              }
              classRefDesc_4 = ctx.getVariableDef(strname_4);
              if ( typeof(classRefDesc_4) === "undefined" ) {
                ctx.addError(obj, "Error, no description for called object: " + strname_4);
                break;
              }
              if ( set_nsp ) {
                obj.nsp.push(classRefDesc_4);
              }
              classRefDesc_4.ref_cnt = 1 + classRefDesc_4.ref_cnt;
              classDesc_6 = ctx.findClass(classRefDesc_4.nameNode.type_name);
            }
          } else {
            if ( i_96 < (cnt_7 - 1) ) {
              varDesc_4 = classDesc_6.findVariable(strname_4);
              if ( typeof(varDesc_4) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname_4);
              }
              var subClass_4 = varDesc_4.getTypeName()
              classDesc_6 = ctx.findClass(subClass_4);
              if ( set_nsp ) {
                obj.nsp.push(varDesc_4);
              }
              continue;
            }
            if ( typeof(classDesc_6) !== "undefined" ) {
              varDesc_4 = classDesc_6.findVariable(strname_4);
              if ( typeof(varDesc_4) === "undefined" ) {
                var classMethod = classDesc_6.findMethod(strname_4)
                if ( typeof(classMethod) === "undefined" ) {
                  classMethod = classDesc_6.findStaticMethod(strname_4);
                  if ( typeof(classMethod) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname_4);
                  }
                }
                if ( typeof(classMethod) !== "undefined" ) {
                  if ( set_nsp ) {
                    obj.nsp.push(classMethod);
                  }
                  return classMethod;
                }
              }
              if ( set_nsp ) {
                obj.nsp.push(varDesc_4);
              }
            }
          }
        }
        return varDesc_4;
      }
      varDesc_4 = ctx.getVariableDef(obj.vref);
      if ( typeof(varDesc_4.nameNode) !== "undefined" ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref)
        if ( typeof(varDesc_4) !== "undefined" ) {
          console.log("Vardesc was found though..." + varDesc_4.name)
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return varDesc_4;
    }
    var cc_2 = ctx.getCurrentClass()
    return cc_2;
  }
  
  areEqualTypes(n1 ,n2 ,ctx ) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length) > 0)) && ((n2.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        var b_ok = false
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "char") && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "int") && (n2.eval_type_name == "char") ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(n1.eval_type_name) && ctx.isDefinedClass(n2.eval_type_name) ) {
          var c1_2 = ctx.findClass(n1.eval_type_name)
          var c2_4 = ctx.findClass(n2.eval_type_name)
          if ( c1_2.isSameOrParentClass(n2.eval_type_name, ctx) ) {
            return true;
          }
          if ( c2_4.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            return true;
          }
        }
        if ( b_ok == false ) {
          return false;
        }
      }
    }
    return true;
  }
  
  shouldBeEqualTypes(n1 ,n2 ,ctx ,msg ) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length) > 0)) && ((n2.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        var b_ok_4 = false
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") ) {
          b_ok_4 = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") ) {
          b_ok_4 = true;
        }
        if ( ctx.isDefinedClass(n2.eval_type_name) ) {
          var cc_5 = ctx.findClass(n2.eval_type_name)
          if ( cc_5.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            b_ok_4 = true;
          }
        }
        if ( (n1.eval_type_name == "char") && (n2.eval_type_name == "int") ) {
          b_ok_4 = true;
        }
        if ( (n1.eval_type_name == "int") && (n2.eval_type_name == "char") ) {
          b_ok_4 = true;
        }
        if ( b_ok_4 == false ) {
          ctx.addError(n1, (((("Type mismatch " + n2.eval_type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
  
  shouldBeExpression(n1 ,ctx ,msg ) {
    if ( n1.expression == false ) {
      ctx.addError(n1, msg);
    }
  }
  
  shouldHaveChildCnt(cnt ,n1 ,ctx ,msg ) {
    if ( (n1.children.length) != cnt ) {
      ctx.addError(n1, msg);
    }
  }
  
  shouldBeNumeric(n1 ,ctx ,msg ) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length) > 0) ) {
      if ( false == ((n1.eval_type_name == "double") || (n1.eval_type_name == "int")) ) {
        ctx.addError(n1, (("Not numeric: " + n1.eval_type_name) + ". ") + msg);
      }
    }
  }
  
  shouldBeArray(n1 ,ctx ,msg ) {
    if ( n1.eval_type != 6 ) {
      ctx.addError(n1, "Expecting array. " + msg);
    }
  }
  
  shouldBeType(type_name ,n1 ,ctx ,msg ) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == type_name ) {
      } else {
        var b_ok_6 = false
        if ( ctx.isEnumDefined(n1.eval_type_name) && (type_name == "int") ) {
          b_ok_6 = true;
        }
        if ( ctx.isEnumDefined(type_name) && (n1.eval_type_name == "int") ) {
          b_ok_6 = true;
        }
        if ( (n1.eval_type_name == "char") && (type_name == "int") ) {
          b_ok_6 = true;
        }
        if ( (n1.eval_type_name == "int") && (type_name == "char") ) {
          b_ok_6 = true;
        }
        if ( b_ok_6 == false ) {
          ctx.addError(n1, (((("Type mismatch " + type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
}
class RangerGenericClassWriter  {
  
  constructor( ) {
    this.compiler;
  }
  
  EncodeString(node ,ctx ,wr ) {
    /** unused:  var encoded_str_2 = ""   **/ 
    var str_length_2 = node.string_value.length
    var encoded_str_8 = ""
    var ii_11 = 0
    while (ii_11 < str_length_2) {var cc_4 = node.string_value.charCodeAt(ii_11 )
      switch (cc_4 ) { 
        case 8 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 92 : 
          encoded_str_8 = (encoded_str_8 + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        default: 
          encoded_str_8 = encoded_str_8 + (String.fromCharCode(cc_4));
          break;
      }
      ii_11 = ii_11 + 1;
    }
    return encoded_str_8;
  }
  
  CustomOperator(node ,ctx ,wr ) {
  }
  
  WriteSetterVRef(node ,ctx ,wr ) {
  }
  
  writeArrayTypeDef(node ,ctx ,wr ) {
  }
  
  WriteEnum(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      var rootObjName_2 = node.ns[0]
      var e_8 = ctx.getEnum(rootObjName_2)
      if ( typeof(e_8) !== "undefined" ) {
        var enumName_2 = node.ns[1]
        wr.out("" + ((e_8.values[enumName_2])), false);
      } else {
        if ( node.hasParamDesc ) {
          var pp_4 = node.paramDesc
          var nn_8 = pp_4.nameNode
          this.WriteVRef(nn_8, ctx, wr);
        }
      }
    }
  }
  
  WriteScalarValue(node ,ctx ,wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        var s_18 = this.EncodeString(node, ctx, wr)
        wr.out(("\"" + s_18) + "\"", false);
        break;
      case 3 : 
        wr.out("" + node.int_value, false);
        break;
      case 5 : 
        if ( node.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    }
  }
  
  getTypeString(type_string ) {
    return type_string;
  }
  
  import_lib(lib_name ,ctx ,wr ) {
    wr.addImport(lib_name);
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  release_local_vars(node ,ctx ,wr ) {
    for ( var i_61 = 0; i_61 < ctx.localVarNames.length; i_61++) {
      var n_7 = ctx.localVarNames[i_61];
      var p_14 = ctx.localVariables[n_7]
      if ( p_14.ref_cnt == 0 ) {
        continue;
      }
      if ( p_14.isAllocatedType() ) {
        if ( 1 == p_14.getStrength() ) {
          if ( p_14.nameNode.eval_type == 7 ) {
          }
          if ( p_14.nameNode.eval_type == 6 ) {
          }
          if ( (p_14.nameNode.eval_type != 6) && (p_14.nameNode.eval_type != 7) ) {
          }
        }
        if ( 0 == p_14.getStrength() ) {
          if ( p_14.nameNode.eval_type == 7 ) {
          }
          if ( p_14.nameNode.eval_type == 6 ) {
          }
          if ( (p_14.nameNode.eval_type != 6) && (p_14.nameNode.eval_type != 7) ) {
          }
        }
      }
    }
    if ( ctx.is_function ) {
      return;
    }
    if ( typeof(ctx.parent) !== "undefined" ) {
      this.release_local_vars(node, ctx.parent, wr);
    }
  }
  
  WalkNode(node ,ctx ,wr ) {
    this.compiler.WalkNode(node, ctx, wr);
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    wr.out(node.type_name, false);
  }
  
  writeRawTypeDef(node ,ctx ,wr ) {
    this.writeTypeDef(node, ctx, wr);
  }
  
  adjustType(tn ) {
    return tn;
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_5 = node.ns[0]
        var enumName_5 = node.ns[1]
        var e_11 = ctx.getEnum(rootObjName_5)
        if ( typeof(e_11) !== "undefined" ) {
          wr.out("" + ((e_11.values[enumName_5])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_64 = 0; i_64 < node.nsp.length; i_64++) {
        var p_17 = node.nsp[i_64];
        if ( i_64 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_17.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_17.compiledName), false);
        } else {
          if ( (p_17.name.length) > 0 ) {
            wr.out(this.adjustType(p_17.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_64])), false);
          }
        }
      }
      return;
    }
    for ( var i_68 = 0; i_68 < node.ns.length; i_68++) {
      var part = node.ns[i_68];
      if ( i_68 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var p_19 = node.paramDesc
      if ( p_19.set_cnt > 0 ) {
        wr.out("var " + p_19.name, false);
      } else {
        wr.out("const " + p_19.name, false);
      }
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_2 = node.getThird()
        this.WalkNode(value_2, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out(";", true);
      }
    }
  }
  
  writeFnCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      var fc_20 = node.getFirst()
      this.WriteVRef(fc_20, ctx, wr);
      wr.out("(", false);
      var givenArgs_2 = node.getSecond()
      ctx.setInExpr();
      for ( var i_68 = 0; i_68 < node.fnDesc.params.length; i_68++) {
        var arg_12 = node.fnDesc.params[i_68];
        if ( i_68 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_2.children.length) <= i_68 ) {
          var defVal = arg_12.nameNode.getFlag("default")
          if ( typeof(defVal) !== "undefined" ) {
            var fc_31 = defVal.vref_annotation.getFirst()
            this.WalkNode(fc_31, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        var n_10 = givenArgs_2.children[i_68]
        this.WalkNode(n_10, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_2 = node.clDesc
      /** unused:  var fc_25 = node.getSecond()   **/ 
      wr.out("new " + node.clDesc.name, false);
      wr.out("(", false);
      var constr = cl_2.constructor_fn
      var givenArgs_5 = node.getThird()
      if ( typeof(constr) !== "undefined" ) {
        for ( var i_70 = 0; i_70 < constr.params.length; i_70++) {
          var arg_15 = constr.params[i_70];
          var n_12 = givenArgs_5.children[i_70]
          if ( i_70 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg_15.nameNode) !== "undefined") ) {
            this.WalkNode(n_12, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  writeClass(node ,ctx ,wr ) {
    var cl_5 = node.clDesc
    if ( typeof(cl_5) === "undefined" ) {
      return;
    }
    wr.out(("class " + cl_5.name) + " { ", true);
    wr.indent(1);
    for ( var i_72 = 0; i_72 < cl_5.variables.length; i_72++) {
      var pvar = cl_5.variables[i_72];
      wr.out(((("/* var " + pvar.name) + " => ") + pvar.nameNode.parent.getCode()) + " */ ", true);
    }
    for ( var i_76 = 0; i_76 < cl_5.static_methods.length; i_76++) {
      var pvar_6 = cl_5.static_methods[i_76];
      wr.out(("/* static " + pvar_6.name) + " */ ", true);
    }
    for ( var i_79 = 0; i_79 < cl_5.defined_variants.length; i_79++) {
      var fnVar = cl_5.defined_variants[i_79];
      var mVs = cl_5.method_variants[fnVar]
      for ( var i_86 = 0; i_86 < mVs.variants.length; i_86++) {
        var variant = mVs.variants[i_86];
        wr.out(("function " + variant.name) + "() {", true);
        wr.indent(1);
        wr.newline();
        var subCtx_14 = ctx.fork()
        this.WalkNode(variant.fnBody, subCtx_14, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
  }
}
class RangerJava7ClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "char[]";
        break;
      case "char" : 
        return "char";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  getTypeString(type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "char[]";
        break;
      case "char" : 
        return "char";
        break;
      case "boolean" : 
        return "boolean";
        break;
      case "double" : 
        return "double";
        break;
    }
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    var v_type = node.value_type
    var t_name = node.type_name
    var a_name_2 = node.array_type
    var k_name = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name_2 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.addImport("java.util.Optional");
      wr.out("Optional<", false);
      switch (v_type ) { 
        case 11 : 
          wr.out("Integer", false);
          break;
        case 3 : 
          wr.out("Integer", false);
          break;
        case 2 : 
          wr.out("Double", false);
          break;
        case 4 : 
          wr.out("String", false);
          break;
        case 5 : 
          wr.out("Boolean", false);
          break;
        case 12 : 
          wr.out("char", false);
          break;
        case 13 : 
          wr.out("char[]", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name == "void" ) {
            wr.out("void", false);
          } else {
            wr.out(this.getObjectTypeString(t_name, ctx), false);
          }
          break;
      }
    } else {
      switch (v_type ) { 
        case 11 : 
          wr.out("int", false);
          break;
        case 3 : 
          wr.out("int", false);
          break;
        case 2 : 
          wr.out("double", false);
          break;
        case 12 : 
          wr.out("char", false);
          break;
        case 13 : 
          wr.out("char[]", false);
          break;
        case 4 : 
          wr.out("String", false);
          break;
        case 5 : 
          wr.out("boolean", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name == "void" ) {
            wr.out("void", false);
          } else {
            wr.out(this.getTypeString(t_name), false);
          }
          break;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.out(">", false);
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.vref == "this" ) {
      wr.out("this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_4 = node.ns[0]
        var enumName_4 = node.ns[1]
        var e_10 = ctx.getEnum(rootObjName_4)
        if ( typeof(e_10) !== "undefined" ) {
          wr.out("" + ((e_10.values[enumName_4])), false);
          return;
        }
      }
    }
    var max_len = node.ns.length
    if ( (node.nsp.length) > 0 ) {
      for ( var i_70 = 0; i_70 < node.nsp.length; i_70++) {
        var p_17 = node.nsp[i_70];
        if ( i_70 == 0 ) {
          var part_2 = node.ns[0]
          if ( part_2 == "this" ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( i_70 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_17.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_17.compiledName), false);
        } else {
          if ( (p_17.name.length) > 0 ) {
            wr.out(this.adjustType(p_17.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_70])), false);
          }
        }
        if ( i_70 < (max_len - 1) ) {
          if ( p_17.nameNode.hasFlag("optional") ) {
            wr.out(".get()", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var p_22 = node.paramDesc
      wr.out(p_22.compiledName, false);
      return;
    }
    for ( var i_75 = 0; i_75 < node.ns.length; i_75++) {
      var part_7 = node.ns[i_75];
      if ( i_75 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_7), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_9 = node.children[1]
      var p_22 = nn_9.paramDesc
      if ( (p_22.ref_cnt == 0) && (p_22.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_22.set_cnt > 0) || p_22.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("final ", false);
      }
      this.writeTypeDef(p_22.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p_22.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_3 = node.getThird()
        this.WalkNode(value_3, ctx, wr);
        ctx.unsetInExpr();
      } else {
        var b_was_set = false
        if ( nn_9.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_22.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn_9.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_22.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn_9.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
        }
      }
      if ( (p_22.ref_cnt == 0) && (p_22.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_22.ref_cnt == 0) && (p_22.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_75 = 0; i_75 < fnDesc.params.length; i_75++) {
      var arg_14 = fnDesc.params[i_75];
      if ( i_75 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_14.nameNode, ctx, wr);
      wr.out((" " + arg_14.name) + " ", false);
    }
  }
  
  CustomOperator(node ,ctx ,wr ) {
    var fc_23 = node.getFirst()
    var cmd_2 = fc_23.vref
    if ( cmd_2 == "return" ) {
      wr.newline();
      if ( (node.children.length) > 1 ) {
        var value_6 = node.getSecond()
        if ( value_6.hasParamDesc ) {
          var nn_12 = value_6.paramDesc.nameNode
          if ( ctx.isDefinedClass(nn_12.type_name) ) {
            /** unused:  var cl_4 = ctx.findClass(nn_12.type_name)   **/ 
            var activeFn_4 = ctx.getCurrentMethod()
            var fnNameNode = activeFn_4.nameNode
            if ( fnNameNode.hasFlag("optional") ) {
              wr.out("return Optional.ofNullable((", false);
              this.WalkNode(value_6, ctx, wr);
              wr.out(".isPresent() ? (", false);
              wr.out(fnNameNode.type_name, false);
              wr.out(")", false);
              this.WalkNode(value_6, ctx, wr);
              wr.out(".get() : null ) );", true);
              return;
            }
          }
        }
        wr.out("return ", false);
        ctx.setInExpr();
        this.WalkNode(value_6, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out("return;", true);
      }
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_7 = node.clDesc
    if ( typeof(cl_7) === "undefined" ) {
      return;
    }
    var declaredVariable = []
    if ( (cl_7.extends_classes.length) > 0 ) {
      for ( var i_77 = 0; i_77 < cl_7.extends_classes.length; i_77++) {
        var pName = cl_7.extends_classes[i_77];
        var pC = ctx.findClass(pName)
        for ( var i_87 = 0; i_87 < pC.variables.length; i_87++) {
          var pvar_3 = pC.variables[i_87];
          declaredVariable[pvar_3.name] = true
        }
      }
    }
    var wr_5 = orig_wr.getFileWriter(".", (cl_7.name + ".java"))
    var importFork = wr_5.fork()
    wr_5.out("", true);
    wr_5.out("class " + cl_7.name, false);
    var parentClass
    if ( (cl_7.extends_classes.length) > 0 ) {
      wr_5.out(" extends ", false);
      for ( var i_84 = 0; i_84 < cl_7.extends_classes.length; i_84++) {
        var pName_6 = cl_7.extends_classes[i_84];
        wr_5.out(pName_6, false);
        parentClass = ctx.findClass(pName_6);
      }
    }
    wr_5.out(" { ", true);
    wr_5.indent(1);
    wr_5.createTag("utilities");
    for ( var i_87 = 0; i_87 < cl_7.variables.length; i_87++) {
      var pvar_8 = cl_7.variables[i_87];
      if ( typeof(declaredVariable[pvar_8.name] ) != "undefined" ) {
        continue;
      }
      wr_5.out("public ", false);
      this.writeVarDef(pvar_8.node, ctx, wr_5);
    }
    if ( cl_7.has_constructor ) {
      var constr_2 = cl_7.constructor_fn
      wr_5.out("", true);
      wr_5.out(cl_7.name + "(", false);
      this.writeArgsDef(constr_2, ctx, wr_5);
      wr_5.out(" ) {", true);
      wr_5.indent(1);
      wr_5.newline();
      var subCtx_15 = constr_2.fnCtx
      subCtx_15.is_function = true;
      this.WalkNode(constr_2.fnBody, subCtx_15, wr_5);
      wr_5.newline();
      wr_5.indent(-1);
      wr_5.out("}", true);
    }
    for ( var i_90 = 0; i_90 < cl_7.static_methods.length; i_90++) {
      var variant_2 = cl_7.static_methods[i_90];
      wr_5.out("", true);
      if ( variant_2.nameNode.hasFlag("main") ) {
        wr_5.out("public static void main(String [] args ) {", true);
      } else {
        wr_5.out("public static ", false);
        this.writeTypeDef(variant_2.nameNode, ctx, wr_5);
        wr_5.out(" ", false);
        wr_5.out(variant_2.name + "(", false);
        this.writeArgsDef(variant_2, ctx, wr_5);
        wr_5.out(") {", true);
      }
      wr_5.indent(1);
      wr_5.newline();
      var subCtx_20 = variant_2.fnCtx
      subCtx_20.is_function = true;
      this.WalkNode(variant_2.fnBody, subCtx_20, wr_5);
      wr_5.newline();
      wr_5.indent(-1);
      wr_5.out("}", true);
    }
    for ( var i_93 = 0; i_93 < cl_7.defined_variants.length; i_93++) {
      var fnVar_2 = cl_7.defined_variants[i_93];
      var mVs_2 = cl_7.method_variants[fnVar_2]
      for ( var i_100 = 0; i_100 < mVs_2.variants.length; i_100++) {
        var variant_7 = mVs_2.variants[i_100];
        wr_5.out("", true);
        wr_5.out("public ", false);
        this.writeTypeDef(variant_7.nameNode, ctx, wr_5);
        wr_5.out(" ", false);
        wr_5.out(variant_7.name + "(", false);
        this.writeArgsDef(variant_7, ctx, wr_5);
        wr_5.out(") {", true);
        wr_5.indent(1);
        wr_5.newline();
        var subCtx_23 = variant_7.fnCtx
        subCtx_23.is_function = true;
        this.WalkNode(variant_7.fnBody, subCtx_23, wr_5);
        wr_5.newline();
        wr_5.indent(-1);
        wr_5.out("}", true);
      }
    }
    wr_5.indent(-1);
    wr_5.out("}", true);
    var import_list = wr_5.getImports()
    for ( var i_99 = 0; i_99 < import_list.length; i_99++) {
      var codeStr = import_list[i_99];
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
class RangerSwift3ClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "[UInt8]";
        break;
      case "char" : 
        return "UInt8";
        break;
      case "boolean" : 
        return "Bool";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  getTypeString(type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "boolean" : 
        return "Bool";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    var v_type_2 = node.value_type
    if ( node.eval_type != 0 ) {
      v_type_2 = node.eval_type;
    }
    switch (v_type_2 ) { 
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 12 : 
        wr.out("UInt8", false);
        break;
      case 13 : 
        wr.out("[UInt8]", false);
        break;
      case 5 : 
        wr.out("Bool", false);
        break;
      case 7 : 
        wr.out(((("[" + this.getObjectTypeString(node.key_type, ctx)) + ":") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.out(("[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("Void", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  WriteEnum(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      var rootObjName_5 = node.ns[0]
      var e_11 = ctx.getEnum(rootObjName_5)
      if ( typeof(e_11) !== "undefined" ) {
        var enumName_5 = node.ns[1]
        wr.out("" + ((e_11.values[enumName_5])), false);
      } else {
        if ( node.hasParamDesc ) {
          var pp_5 = node.paramDesc
          var nn_11 = pp_5.nameNode
          wr.out(nn_11.vref, false);
        }
      }
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.vref == "this" ) {
      wr.out("self", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_8 = node.ns[0]
        var enumName_8 = node.ns[1]
        var e_14 = ctx.getEnum(rootObjName_8)
        if ( typeof(e_14) !== "undefined" ) {
          wr.out("" + ((e_14.values[enumName_8])), false);
          return;
        }
      }
    }
    var max_len_2 = node.ns.length
    if ( (node.nsp.length) > 0 ) {
      for ( var i_81 = 0; i_81 < node.nsp.length; i_81++) {
        var p_20 = node.nsp[i_81];
        if ( i_81 == 0 ) {
          var part_4 = node.ns[0]
          if ( part_4 == "this" ) {
            wr.out("self", false);
            continue;
          }
        }
        if ( i_81 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_20.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_20.compiledName), false);
        } else {
          if ( (p_20.name.length) > 0 ) {
            wr.out(this.adjustType(p_20.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_81])), false);
          }
        }
        if ( i_81 < (max_len_2 - 1) ) {
          if ( p_20.nameNode.hasFlag("optional") ) {
            wr.out("!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var p_25 = node.paramDesc
      wr.out(p_25.compiledName, false);
      return;
    }
    for ( var i_86 = 0; i_86 < node.ns.length; i_86++) {
      var part_9 = node.ns[i_86];
      if ( i_86 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_9), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_14 = node.children[1]
      var p_25 = nn_14.paramDesc
      if ( (p_25.ref_cnt == 0) && (p_25.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_25.set_cnt > 0) || p_25.is_class_variable ) {
        wr.out(("var " + p_25.compiledName) + " : ", false);
      } else {
        wr.out(("let " + p_25.compiledName) + " : ", false);
      }
      this.writeTypeDef(p_25.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_5 = node.getThird()
        this.WalkNode(value_5, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_14.value_type == 6 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p_25.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn_14.value_type == 7 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p_25.nameNode, ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p_25.ref_cnt == 0) && (p_25.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_25.ref_cnt == 0) && (p_25.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_86 = 0; i_86 < fnDesc.params.length; i_86++) {
      var arg_15 = fnDesc.params[i_86];
      if ( i_86 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_15.name + " : ", false);
      this.writeTypeDef(arg_15.nameNode, ctx, wr);
    }
  }
  
  writeFnCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      var fc_24 = node.getFirst()
      var fnName = node.fnDesc.nameNode
      if ( ctx.expressionLevel() == 0 ) {
        if ( fnName.type_name != "void" ) {
          wr.out("_ = ", false);
        }
      }
      this.WriteVRef(fc_24, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      var givenArgs_4 = node.getSecond()
      for ( var i_88 = 0; i_88 < node.fnDesc.params.length; i_88++) {
        var arg_18 = node.fnDesc.params[i_88];
        if ( i_88 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_4.children.length) <= i_88 ) {
          var defVal_2 = arg_18.nameNode.getFlag("default")
          if ( typeof(defVal_2) !== "undefined" ) {
            var fc_35 = defVal_2.vref_annotation.getFirst()
            this.WalkNode(fc_35, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        var n_10 = givenArgs_4.children[i_88]
        wr.out(arg_18.name + " : ", false);
        this.WalkNode(n_10, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_6 = node.clDesc
      /** unused:  var fc_29 = node.getSecond()   **/ 
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      var constr_3 = cl_6.constructor_fn
      var givenArgs_7 = node.getThird()
      if ( typeof(constr_3) !== "undefined" ) {
        for ( var i_90 = 0; i_90 < constr_3.params.length; i_90++) {
          var arg_20 = constr_3.params[i_90];
          var n_13 = givenArgs_7.children[i_90]
          if ( i_90 > 0 ) {
            wr.out(", ", false);
          }
          wr.out(arg_20.name + " : ", false);
          this.WalkNode(n_13, ctx, wr);
        }
      }
      wr.out(")", false);
    }
  }
  
  haveSameSig(fn1 ,fn2 ,ctx ) {
    if ( fn1.name != fn2.name ) {
      return false;
    }
    var match_3 = new RangerArgMatch()
    var n1_2 = fn1.nameNode
    var n2_2 = fn1.nameNode
    if ( match_3.doesDefsMatch(n1_2, n2_2, ctx) == false ) {
      return false;
    }
    if ( (fn1.params.length) != (fn2.params.length) ) {
      return false;
    }
    for ( var i_92 = 0; i_92 < fn1.params.length; i_92++) {
      var p_27 = fn1.params[i_92];
      var p2_2 = fn2.params[i_92]
      if ( match_3.doesDefsMatch((p_27.nameNode), (p2_2.nameNode), ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  
  writeClass(node ,ctx ,wr ) {
    var cl_9 = node.clDesc
    if ( typeof(cl_9) === "undefined" ) {
      return;
    }
    wr.out("class " + cl_9.name, false);
    var parentClass_2
    if ( (cl_9.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( var i_94 = 0; i_94 < cl_9.extends_classes.length; i_94++) {
        var pName_3 = cl_9.extends_classes[i_94];
        wr.out(pName_3, false);
        parentClass_2 = ctx.findClass(pName_3);
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( var i_98 = 0; i_98 < cl_9.variables.length; i_98++) {
      var pvar_5 = cl_9.variables[i_98];
      this.writeVarDef(pvar_5.node, ctx, wr);
    }
    if ( cl_9.has_constructor ) {
      var constr_6 = cl_9.constructor_fn
      var b_must_override = false
      if ( typeof(parentClass_2) != "undefined" ) {
        if ( (constr_6.params.length) == 0 ) {
          b_must_override = true;
        } else {
          if ( parentClass_2.has_constructor ) {
            var p_constr = parentClass_2.constructor_fn
            if ( this.haveSameSig((constr_6), p_constr, ctx) ) {
              b_must_override = true;
            }
          }
        }
      }
      if ( b_must_override ) {
        wr.out("override ", false);
      }
      wr.out("init(", false);
      this.writeArgsDef(constr_6, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      if ( typeof(parentClass_2) != "undefined" ) {
        wr.out("super.init()", true);
      }
      wr.newline();
      var subCtx_18 = constr_6.fnCtx
      subCtx_18.is_function = true;
      this.WalkNode(constr_6.fnBody, subCtx_18, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( var i_101 = 0; i_101 < cl_9.static_methods.length; i_101++) {
      var variant_4 = cl_9.static_methods[i_101];
      if ( variant_4.nameNode.hasFlag("main") ) {
        continue;
      }
      wr.out(("static func " + variant_4.name) + "(", false);
      this.writeArgsDef(variant_4, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_4.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_23 = variant_4.fnCtx
      subCtx_23.is_function = true;
      this.WalkNode(variant_4.fnBody, subCtx_23, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( var i_104 = 0; i_104 < cl_9.defined_variants.length; i_104++) {
      var fnVar_3 = cl_9.defined_variants[i_104];
      var mVs_3 = cl_9.method_variants[fnVar_3]
      for ( var i_111 = 0; i_111 < mVs_3.variants.length; i_111++) {
        var variant_9 = mVs_3.variants[i_111];
        wr.out(("func " + variant_9.name) + "(", false);
        this.writeArgsDef(variant_9, ctx, wr);
        wr.out(") -> ", false);
        this.writeTypeDef(variant_9.nameNode, ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        var subCtx_26 = variant_9.fnCtx
        subCtx_26.is_function = true;
        this.WalkNode(variant_9.fnBody, subCtx_26, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( var i_110 = 0; i_110 < cl_9.static_methods.length; i_110++) {
      var variant_12 = cl_9.static_methods[i_110];
      var b_3 = variant_12.nameNode.hasFlag("main")
      if ( b_3 ) {
        wr.newline();
        var subCtx_29 = variant_12.fnCtx
        subCtx_29.is_function = true;
        this.WalkNode(variant_12.fnBody, subCtx_29, wr);
        wr.newline();
      }
    }
  }
}
class RangerKotlinClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  WriteScalarValue(node ,ctx ,wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        var s_19 = this.EncodeString(node, ctx, wr)
        wr.out(("\"" + s_19) + "\"", false);
        break;
      case 3 : 
        wr.out("" + node.int_value, false);
        break;
      case 5 : 
        if ( node.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    }
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "CharArray";
        break;
      case "char" : 
        return "char";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  getTypeString(type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "CharArray";
        break;
      case "char" : 
        return "Char";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    var v_type_3 = node.value_type
    if ( node.eval_type != 0 ) {
      v_type_3 = node.eval_type;
    }
    switch (v_type_3 ) { 
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 12 : 
        wr.out("Char", false);
        break;
      case 13 : 
        wr.out("CharArray", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 7 : 
        wr.out(((("MutableMap<" + this.getObjectTypeString(node.key_type, ctx)) + ",") + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        break;
      case 6 : 
        wr.out(("MutableList<" + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("Unit", false);
        } else {
          wr.out(this.getTypeString(node.type_name), false);
        }
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_7 = node.ns[0]
        var enumName_7 = node.ns[1]
        var e_13 = ctx.getEnum(rootObjName_7)
        if ( typeof(e_13) !== "undefined" ) {
          wr.out("" + ((e_13.values[enumName_7])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_93 = 0; i_93 < node.nsp.length; i_93++) {
        var p_24 = node.nsp[i_93];
        if ( i_93 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_24.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_24.compiledName), false);
        } else {
          if ( (p_24.name.length) > 0 ) {
            wr.out(this.adjustType(p_24.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_93])), false);
          }
        }
        if ( i_93 == 0 ) {
          if ( p_24.nameNode.hasFlag("optional") ) {
            wr.out("!!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var p_29 = node.paramDesc
      wr.out(p_29.compiledName, false);
      return;
    }
    for ( var i_98 = 0; i_98 < node.ns.length; i_98++) {
      var part_6 = node.ns[i_98];
      if ( i_98 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_6), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_13 = node.children[1]
      var p_29 = nn_13.paramDesc
      if ( (p_29.ref_cnt == 0) && (p_29.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_29.set_cnt > 0) || p_29.is_class_variable ) {
        wr.out("var ", false);
      } else {
        wr.out("val ", false);
      }
      wr.out(p_29.compiledName, false);
      wr.out(" : ", false);
      this.writeTypeDef(p_29.nameNode, ctx, wr);
      wr.out(" ", false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_6 = node.getThird()
        this.WalkNode(value_6, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_13.value_type == 6 ) {
          wr.out(" = arrayListOf()", false);
        }
        if ( nn_13.value_type == 7 ) {
          wr.out(" = hashMapOf()", false);
        }
      }
      if ( (p_29.ref_cnt == 0) && (p_29.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_29.ref_cnt == 0) && (p_29.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_98 = 0; i_98 < fnDesc.params.length; i_98++) {
      var arg_18 = fnDesc.params[i_98];
      if ( i_98 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_18.name + " : ", false);
      this.writeTypeDef(arg_18.nameNode, ctx, wr);
    }
  }
  
  writeFnCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      var fc_27 = node.getFirst()
      this.WriteVRef(fc_27, ctx, wr);
      wr.out("(", false);
      var givenArgs_6 = node.getSecond()
      for ( var i_100 = 0; i_100 < node.fnDesc.params.length; i_100++) {
        var arg_21 = node.fnDesc.params[i_100];
        if ( i_100 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_6.children.length) <= i_100 ) {
          var defVal_3 = arg_21.nameNode.getFlag("default")
          if ( typeof(defVal_3) !== "undefined" ) {
            var fc_38 = defVal_3.vref_annotation.getFirst()
            this.WalkNode(fc_38, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        var n_12 = givenArgs_6.children[i_100]
        this.WalkNode(n_12, ctx, wr);
      }
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_8 = node.clDesc
      /** unused:  var fc_32 = node.getSecond()   **/ 
      wr.out(" ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      var constr_5 = cl_8.constructor_fn
      var givenArgs_9 = node.getThird()
      if ( typeof(constr_5) !== "undefined" ) {
        for ( var i_102 = 0; i_102 < constr_5.params.length; i_102++) {
          var arg_23 = constr_5.params[i_102];
          var n_15 = givenArgs_9.children[i_102]
          if ( i_102 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg_23.nameNode) !== "undefined") ) {
            this.WalkNode(n_15, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_11 = node.clDesc
    if ( typeof(cl_11) === "undefined" ) {
      return;
    }
    var wr_6 = orig_wr
    /** unused:  var importFork_2 = wr_6.fork()   **/ 
    wr_6.out("", true);
    wr_6.out("class " + cl_11.name, false);
    if ( cl_11.has_constructor ) {
      var constr_8 = cl_11.constructor_fn
      wr_6.out("(", false);
      this.writeArgsDef(constr_8, ctx, wr_6);
      wr_6.out(" ) ", true);
    }
    wr_6.out(" {", true);
    wr_6.indent(1);
    for ( var i_104 = 0; i_104 < cl_11.variables.length; i_104++) {
      var pvar_6 = cl_11.variables[i_104];
      this.writeVarDef(pvar_6.node, ctx, wr_6);
    }
    if ( cl_11.has_constructor ) {
      var constr_12 = cl_11.constructor_fn
      wr_6.out("", true);
      wr_6.out("init {", true);
      wr_6.indent(1);
      wr_6.newline();
      var subCtx_22 = constr_12.fnCtx
      subCtx_22.is_function = true;
      this.WalkNode(constr_12.fnBody, subCtx_22, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    if ( (cl_11.static_methods.length) > 0 ) {
      wr_6.out("companion object {", true);
      wr_6.indent(1);
    }
    for ( var i_108 = 0; i_108 < cl_11.static_methods.length; i_108++) {
      var variant_7 = cl_11.static_methods[i_108];
      wr_6.out("", true);
      if ( variant_7.nameNode.hasFlag("main") ) {
        continue;
      }
      wr_6.out("fun ", false);
      wr_6.out(" ", false);
      wr_6.out(variant_7.name + "(", false);
      this.writeArgsDef(variant_7, ctx, wr_6);
      wr_6.out(") : ", false);
      this.writeTypeDef(variant_7.nameNode, ctx, wr_6);
      wr_6.out(" {", true);
      wr_6.indent(1);
      wr_6.newline();
      var subCtx_27 = variant_7.fnCtx
      subCtx_27.is_function = true;
      this.WalkNode(variant_7.fnBody, subCtx_27, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    if ( (cl_11.static_methods.length) > 0 ) {
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    for ( var i_111 = 0; i_111 < cl_11.defined_variants.length; i_111++) {
      var fnVar_4 = cl_11.defined_variants[i_111];
      var mVs_4 = cl_11.method_variants[fnVar_4]
      for ( var i_118 = 0; i_118 < mVs_4.variants.length; i_118++) {
        var variant_12 = mVs_4.variants[i_118];
        wr_6.out("", true);
        wr_6.out("fun ", false);
        wr_6.out(" ", false);
        wr_6.out(variant_12.name + "(", false);
        this.writeArgsDef(variant_12, ctx, wr_6);
        wr_6.out(") : ", false);
        this.writeTypeDef(variant_12.nameNode, ctx, wr_6);
        wr_6.out(" {", true);
        wr_6.indent(1);
        wr_6.newline();
        var subCtx_30 = variant_12.fnCtx
        subCtx_30.is_function = true;
        this.WalkNode(variant_12.fnBody, subCtx_30, wr_6);
        wr_6.newline();
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
    wr_6.indent(-1);
    wr_6.out("}", true);
    for ( var i_117 = 0; i_117 < cl_11.static_methods.length; i_117++) {
      var variant_15 = cl_11.static_methods[i_117];
      wr_6.out("", true);
      if ( variant_15.nameNode.hasFlag("main") ) {
        wr_6.out("fun main(args : Array<String>) {", true);
        wr_6.indent(1);
        wr_6.newline();
        var subCtx_33 = variant_15.fnCtx
        subCtx_33.is_function = true;
        this.WalkNode(variant_15.fnBody, subCtx_33, wr_6);
        wr_6.newline();
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
  }
}
class RangerCSharpClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return type_string;
  }
  
  getTypeString(type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "boolean";
        break;
      case "double" : 
        return "double";
        break;
    }
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    var v_type_4 = node.value_type
    if ( node.eval_type != 0 ) {
      v_type_4 = node.eval_type;
    }
    switch (v_type_4 ) { 
      case 11 : 
        wr.out("int", false);
        break;
      case 3 : 
        wr.out("int", false);
        break;
      case 2 : 
        wr.out("double", false);
        break;
      case 12 : 
        wr.out("byte", false);
        break;
      case 13 : 
        wr.out("byte[]", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("boolean", false);
        break;
      case 7 : 
        wr.out(((("Dictionary<" + this.getObjectTypeString(node.key_type, ctx)) + ",") + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        wr.addImport("System.Collections");
        break;
      case 6 : 
        wr.out(("List<" + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        wr.addImport("System.Collections");
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("void", false);
        } else {
          wr.out(this.getTypeString(node.type_name), false);
        }
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_8 = node.ns[0]
        var enumName_8 = node.ns[1]
        var e_14 = ctx.getEnum(rootObjName_8)
        if ( typeof(e_14) !== "undefined" ) {
          wr.out("" + ((e_14.values[enumName_8])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_103 = 0; i_103 < node.nsp.length; i_103++) {
        var p_27 = node.nsp[i_103];
        if ( i_103 > 0 ) {
          wr.out(".", false);
        }
        if ( i_103 == 0 ) {
          if ( p_27.nameNode.hasFlag("optional") ) {
          }
        }
        if ( (p_27.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_27.compiledName), false);
        } else {
          if ( (p_27.name.length) > 0 ) {
            wr.out(this.adjustType(p_27.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_103])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var p_32 = node.paramDesc
      wr.out(p_32.compiledName, false);
      return;
    }
    for ( var i_108 = 0; i_108 < node.ns.length; i_108++) {
      var part_7 = node.ns[i_108];
      if ( i_108 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_7), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_14 = node.children[1]
      var p_32 = nn_14.paramDesc
      if ( (p_32.ref_cnt == 0) && (p_32.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_32.set_cnt > 0) || p_32.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("const ", false);
      }
      this.writeTypeDef(p_32.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p_32.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_7 = node.getThird()
        this.WalkNode(value_7, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_14.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_32.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn_14.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_32.nameNode, ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p_32.ref_cnt == 0) && (p_32.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_32.ref_cnt == 0) && (p_32.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_108 = 0; i_108 < fnDesc.params.length; i_108++) {
      var arg_21 = fnDesc.params[i_108];
      if ( i_108 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_21.nameNode, ctx, wr);
      wr.out((" " + arg_21.name) + " ", false);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_10 = node.clDesc
    if ( typeof(cl_10) === "undefined" ) {
      return;
    }
    var wr_7 = orig_wr.getFileWriter(".", (cl_10.name + ".cs"))
    var importFork_3 = wr_7.fork()
    wr_7.out("", true);
    wr_7.out(("class " + cl_10.name) + " {", true);
    wr_7.indent(1);
    for ( var i_110 = 0; i_110 < cl_10.variables.length; i_110++) {
      var pvar_7 = cl_10.variables[i_110];
      wr_7.out("public ", false);
      this.writeVarDef(pvar_7.node, ctx, wr_7);
    }
    if ( cl_10.has_constructor ) {
      var constr_8 = cl_10.constructor_fn
      wr_7.out("", true);
      wr_7.out(cl_10.name + "(", false);
      this.writeArgsDef(constr_8, ctx, wr_7);
      wr_7.out(" ) {", true);
      wr_7.indent(1);
      wr_7.newline();
      var subCtx_26 = constr_8.fnCtx
      subCtx_26.is_function = true;
      this.WalkNode(constr_8.fnBody, subCtx_26, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    for ( var i_114 = 0; i_114 < cl_10.static_methods.length; i_114++) {
      var variant_10 = cl_10.static_methods[i_114];
      wr_7.out("", true);
      if ( variant_10.nameNode.hasFlag("main") ) {
        wr_7.out("static int Main( string [] args ) {", true);
      } else {
        wr_7.out("public static ", false);
        this.writeTypeDef(variant_10.nameNode, ctx, wr_7);
        wr_7.out(" ", false);
        wr_7.out(variant_10.name + "(", false);
        this.writeArgsDef(variant_10, ctx, wr_7);
        wr_7.out(") {", true);
      }
      wr_7.indent(1);
      wr_7.newline();
      var subCtx_31 = variant_10.fnCtx
      subCtx_31.is_function = true;
      this.WalkNode(variant_10.fnBody, subCtx_31, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    for ( var i_117 = 0; i_117 < cl_10.defined_variants.length; i_117++) {
      var fnVar_5 = cl_10.defined_variants[i_117];
      var mVs_5 = cl_10.method_variants[fnVar_5]
      for ( var i_124 = 0; i_124 < mVs_5.variants.length; i_124++) {
        var variant_15 = mVs_5.variants[i_124];
        wr_7.out("", true);
        wr_7.out("public ", false);
        this.writeTypeDef(variant_15.nameNode, ctx, wr_7);
        wr_7.out(" ", false);
        wr_7.out(variant_15.name + "(", false);
        this.writeArgsDef(variant_15, ctx, wr_7);
        wr_7.out(") {", true);
        wr_7.indent(1);
        wr_7.newline();
        var subCtx_34 = variant_15.fnCtx
        subCtx_34.is_function = true;
        this.WalkNode(variant_15.fnBody, subCtx_34, wr_7);
        wr_7.newline();
        wr_7.indent(-1);
        wr_7.out("}", true);
      }
    }
    wr_7.indent(-1);
    wr_7.out("}", true);
    var import_list_2 = wr_7.getImports()
    for ( var i_123 = 0; i_123 < import_list_2.length; i_123++) {
      var codeStr_2 = import_list_2[i_123];
      importFork_3.out(("using " + codeStr_2) + ";", true);
    }
  }
}
class RangerScalaClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  getObjectTypeString(type_string ,ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
      case "chararray" : 
        return "Array[Byte]";
        break;
      case "char" : 
        return "byte";
        break;
    }
    return type_string;
  }
  
  getTypeString(type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
      case "chararray" : 
        return "Array[Byte]";
        break;
      case "char" : 
        return "byte";
        break;
    }
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    if ( node.hasFlag("optional") ) {
      wr.out("Option[", false);
    }
    var v_type_5 = node.value_type
    if ( node.eval_type != 0 ) {
      v_type_5 = node.eval_type;
    }
    switch (v_type_5 ) { 
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 12 : 
        wr.out("Byte", false);
        break;
      case 13 : 
        wr.out("Array[Byte]", false);
        break;
      case 7 : 
        wr.addImport("scala.collection.mutable");
        wr.out(((("collection.mutable.HashMap[" + this.getObjectTypeString(node.key_type, ctx)) + ", ") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.addImport("scala.collection.mutable");
        wr.out(("collection.mutable.ArrayBuffer[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("Unit", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("]", false);
    }
  }
  
  writeTypeDefNoOption(node ,ctx ,wr ) {
    var v_type_8 = node.value_type
    if ( node.eval_type != 0 ) {
      v_type_8 = node.eval_type;
    }
    switch (v_type_8 ) { 
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 12 : 
        wr.out("Byte", false);
        break;
      case 13 : 
        wr.out("Array[Byte]", false);
        break;
      case 7 : 
        wr.addImport("scala.collection.mutable");
        wr.out(((("collection.mutable.HashMap[" + this.getObjectTypeString(node.key_type, ctx)) + ", ") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.addImport("scala.collection.mutable");
        wr.out(("collection.mutable.ArrayBuffer[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("Unit", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_9 = node.ns[0]
        var enumName_9 = node.ns[1]
        var e_15 = ctx.getEnum(rootObjName_9)
        if ( typeof(e_15) !== "undefined" ) {
          wr.out("" + ((e_15.values[enumName_9])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_111 = 0; i_111 < node.nsp.length; i_111++) {
        var p_30 = node.nsp[i_111];
        if ( i_111 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_30.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_30.compiledName), false);
        } else {
          if ( (p_30.name.length) > 0 ) {
            wr.out(this.adjustType(p_30.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_111])), false);
          }
        }
        if ( i_111 == 0 ) {
          if ( p_30.nameNode.hasFlag("optional") ) {
            wr.out(".get", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var p_35 = node.paramDesc
      wr.out(p_35.compiledName, false);
      return;
    }
    for ( var i_116 = 0; i_116 < node.ns.length; i_116++) {
      var part_8 = node.ns[i_116];
      if ( i_116 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_8), false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var p_35 = node.paramDesc
      /** unused:  var nn_15 = node.children[1]   **/ 
      if ( (p_35.ref_cnt == 0) && (p_35.is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p_35.set_cnt > 0) || p_35.is_class_variable ) {
        wr.out(("var " + p_35.compiledName) + " : ", false);
      } else {
        wr.out(("val " + p_35.compiledName) + " : ", false);
      }
      this.writeTypeDef(p_35.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_8 = node.getThird()
        this.WalkNode(value_8, ctx, wr);
        ctx.unsetInExpr();
      } else {
        var b_inited = false
        if ( p_35.nameNode.value_type == 6 ) {
          b_inited = true;
          wr.out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( p_35.nameNode.value_type == 7 ) {
          b_inited = true;
          wr.out("= new collection.mutable.HashMap()", false);
        }
        if ( p_35.nameNode.hasFlag("optional") ) {
          wr.out(" = Option.empty[", false);
          this.writeTypeDefNoOption(p_35.nameNode, ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out(" = _", false);
          }
        }
      }
      if ( (p_35.ref_cnt == 0) && (p_35.is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_116 = 0; i_116 < fnDesc.params.length; i_116++) {
      var arg_22 = fnDesc.params[i_116];
      if ( i_116 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_22.name + " : ", false);
      this.writeTypeDef(arg_22.nameNode, ctx, wr);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_11 = node.clDesc
    if ( typeof(cl_11) === "undefined" ) {
      return;
    }
    var wr_8 = orig_wr.getFileWriter(".", (cl_11.name + ".scala"))
    var importFork_4 = wr_8.fork()
    wr_8.out("", true);
    wr_8.out(("class " + cl_11.name) + " ", false);
    if ( cl_11.has_constructor ) {
      wr_8.out("(", false);
      var constr_9 = cl_11.constructor_fn
      for ( var i_118 = 0; i_118 < constr_9.params.length; i_118++) {
        var arg_25 = constr_9.params[i_118];
        if ( i_118 > 0 ) {
          wr_8.out(", ", false);
        }
        wr_8.out(arg_25.name + " : ", false);
        this.writeTypeDef(arg_25.nameNode, ctx, wr_8);
      }
      wr_8.out(")", false);
    }
    wr_8.out(" {", true);
    wr_8.indent(1);
    for ( var i_122 = 0; i_122 < cl_11.variables.length; i_122++) {
      var pvar_8 = cl_11.variables[i_122];
      this.writeVarDef(pvar_8.node, ctx, wr_8);
    }
    if ( cl_11.has_constructor ) {
      var constr_14 = cl_11.constructor_fn
      wr_8.newline();
      var subCtx_29 = constr_14.fnCtx
      subCtx_29.is_function = true;
      this.WalkNode(constr_14.fnBody, subCtx_29, wr_8);
      wr_8.newline();
    }
    for ( var i_125 = 0; i_125 < cl_11.defined_variants.length; i_125++) {
      var fnVar_6 = cl_11.defined_variants[i_125];
      var mVs_6 = cl_11.method_variants[fnVar_6]
      for ( var i_132 = 0; i_132 < mVs_6.variants.length; i_132++) {
        var variant_12 = mVs_6.variants[i_132];
        wr_8.out("", true);
        wr_8.out("def ", false);
        wr_8.out(" ", false);
        wr_8.out(variant_12.name + "(", false);
        this.writeArgsDef(variant_12, ctx, wr_8);
        wr_8.out(") : ", false);
        this.writeTypeDef(variant_12.nameNode, ctx, wr_8);
        wr_8.out(" = {", true);
        wr_8.indent(1);
        wr_8.newline();
        var subCtx_34 = variant_12.fnCtx
        subCtx_34.is_function = true;
        this.WalkNode(variant_12.fnBody, subCtx_34, wr_8);
        wr_8.newline();
        wr_8.indent(-1);
        wr_8.out("}", true);
      }
    }
    wr_8.indent(-1);
    wr_8.out("}", true);
    var b_had_app = false
    var app_obj
    if ( (cl_11.static_methods.length) > 0 ) {
      wr_8.out("", true);
      wr_8.out("// companion object for static methods of " + cl_11.name, true);
      wr_8.out(("object " + cl_11.name) + " {", true);
      wr_8.indent(1);
    }
    for ( var i_131 = 0; i_131 < cl_11.static_methods.length; i_131++) {
      var variant_17 = cl_11.static_methods[i_131];
      if ( variant_17.nameNode.hasFlag("main") ) {
        b_had_app = true;
        app_obj = variant_17;
        continue;
      }
      wr_8.out("", true);
      wr_8.out("def ", false);
      wr_8.out(" ", false);
      wr_8.out(variant_17.name + "(", false);
      this.writeArgsDef(variant_17, ctx, wr_8);
      wr_8.out(") : ", false);
      this.writeTypeDef(variant_17.nameNode, ctx, wr_8);
      wr_8.out(" = {", true);
      wr_8.indent(1);
      wr_8.newline();
      var subCtx_37 = variant_17.fnCtx
      subCtx_37.is_function = true;
      this.WalkNode(variant_17.fnBody, subCtx_37, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    if ( (cl_11.static_methods.length) > 0 ) {
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    if ( b_had_app ) {
      var variant_20 = app_obj
      wr_8.out("", true);
      wr_8.out("// application main function for " + cl_11.name, true);
      wr_8.out(("object App" + cl_11.name) + " extends App {", true);
      wr_8.indent(1);
      wr_8.indent(1);
      wr_8.newline();
      var subCtx_40 = variant_20.fnCtx
      subCtx_40.is_function = true;
      this.WalkNode(variant_20.fnBody, subCtx_40, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    var import_list_3 = wr_8.getImports()
    for ( var i_134 = 0; i_134 < import_list_3.length; i_134++) {
      var codeStr_3 = import_list_3[i_134];
      importFork_4.out(("import " + codeStr_3) + ";", true);
    }
  }
}
class RangerGolangClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
    this.thisName = "this";
    this.write_raw_type = false;
    this.did_write_nullable = false;
  }
  
  WriteScalarValue(node ,ctx ,wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        var s_20 = this.EncodeString(node, ctx, wr)
        wr.out(("\"" + s_20) + "\"", false);
        break;
      case 3 : 
        wr.out("" + node.int_value, false);
        break;
      case 5 : 
        if ( node.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    }
  }
  
  getObjectTypeString(type_string ,ctx ) {
    if ( type_string == "this" ) {
      return this.thisName;
    }
    if ( ctx.isDefinedClass(type_string) ) {
      var cc_5 = ctx.findClass(type_string)
      if ( cc_5.doesInherit() ) {
        return "IFACE_" + ctx.transformTypeName(type_string);
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
        break;
      case "string" : 
        return "string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "float64";
        break;
      case "char" : 
        return "byte";
        break;
      case "charbuffer" : 
        return "[]byte";
        break;
    }
    return ctx.transformTypeName(type_string);
  }
  
  getTypeString2(type_string ,ctx ) {
    if ( type_string == "this" ) {
      return this.thisName;
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
        break;
      case "string" : 
        return "string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "float64";
        break;
      case "char" : 
        return "byte";
        break;
      case "charbuffer" : 
        return "[]byte";
        break;
    }
    return ctx.transformTypeName(type_string);
  }
  
  writeRawTypeDef(node ,ctx ,wr ) {
    this.write_raw_type = true;
    this.writeTypeDef(node, ctx, wr);
    this.write_raw_type = false;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    this.writeTypeDef2(node, ctx, wr);
  }
  
  writeArrayTypeDef(node ,ctx ,wr ) {
    var v_type_7 = node.value_type
    var a_name_3 = node.array_type
    if ( ((v_type_7 == 8) || (v_type_7 == 9)) || (v_type_7 == 0) ) {
      v_type_7 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_7 = node.eval_type;
      if ( (node.eval_array_type.length) > 0 ) {
        a_name_3 = node.eval_array_type;
      }
    }
    switch (v_type_7 ) { 
      case 7 : 
        if ( ctx.isDefinedClass(a_name_3) ) {
          var cc_8 = ctx.findClass(a_name_3)
          if ( cc_8.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_3, ctx), false);
            return;
          }
        }
        if ( ctx.isPrimitiveType(a_name_3) == false ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_3, ctx) + "", false);
        break;
      case 6 : 
        if ( ctx.isDefinedClass(a_name_3) ) {
          var cc_14 = ctx.findClass(a_name_3)
          if ( cc_14.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_3, ctx), false);
            return;
          }
        }
        if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_3) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_3, ctx) + "", false);
        break;
      default: 
        break;
    }
  }
  
  writeTypeDef2(node ,ctx ,wr ) {
    var v_type_10 = node.value_type
    var t_name_2 = node.type_name
    var a_name_6 = node.array_type
    var k_name_2 = node.key_type
    if ( ((v_type_10 == 8) || (v_type_10 == 9)) || (v_type_10 == 0) ) {
      v_type_10 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_10 = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name_2 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name_6 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name_2 = node.eval_key_type;
      }
    }
    switch (v_type_10 ) { 
      case 11 : 
        wr.out("int64", false);
        break;
      case 3 : 
        wr.out("int64", false);
        break;
      case 2 : 
        wr.out("float64", false);
        break;
      case 4 : 
        wr.out("string", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 12 : 
        wr.out("byte", false);
        break;
      case 13 : 
        wr.out("[]byte", false);
        break;
      case 7 : 
        if ( this.write_raw_type ) {
          wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name_2, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name_6) ) {
            var cc_12 = ctx.findClass(a_name_6)
            if ( cc_12.doesInherit() ) {
              wr.out("IFACE_" + this.getTypeString2(a_name_6, ctx), false);
              return;
            }
          }
          if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) ) {
            wr.out("*", false);
          }
          wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        }
        break;
      case 6 : 
        if ( false == this.write_raw_type ) {
          wr.out("[]", false);
        }
        if ( ctx.isDefinedClass(a_name_6) ) {
          var cc_18 = ctx.findClass(a_name_6)
          if ( cc_18.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_6, ctx), false);
            return;
          }
        }
        if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("()", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name_2) ) {
          var cc_22 = ctx.findClass(t_name_2)
          if ( cc_22.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(t_name_2, ctx), false);
            return;
          }
        }
        if ( (this.write_raw_type == false) && (node.isPrimitiveType() == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getTypeString2(t_name_2, ctx), false);
        break;
    }
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_10 = node.ns[0]
        var enumName_10 = node.ns[1]
        var e_16 = ctx.getEnum(rootObjName_10)
        if ( typeof(e_16) !== "undefined" ) {
          wr.out("" + ((e_16.values[enumName_10])), false);
          return;
        }
      }
    }
    var next_is_gs = false
    /** unused:  var last_was_setter = false   **/ 
    var needs_par = false
    var ns_last = (node.ns.length) - 1
    if ( (node.nsp.length) > 0 ) {
      var had_static = false
      for ( var i_120 = 0; i_120 < node.nsp.length; i_120++) {
        var p_33 = node.nsp[i_120];
        if ( next_is_gs ) {
          if ( p_33.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i_120 > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_33.nameNode.type_name) ) {
          var c_8 = ctx.findClass(p_33.nameNode.type_name)
          if ( c_8.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i_120 == 0 ) {
          var part_9 = node.ns[0]
          if ( part_9 == "this" ) {
            wr.out(this.thisName, false);
            continue;
          }
          if ( (part_9 != this.thisName) && ctx.isMemberVariable(part_9) ) {
            var cc_18 = ctx.getCurrentClass()
            var currC_8 = cc_18
            var up = currC_8.findVariable(part_9)
            if ( typeof(up) !== "undefined" ) {
              /** unused:  var p3 = up   **/ 
              wr.out(this.thisName + ".", false);
            }
          }
        }
        if ( (p_33.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_33.compiledName), false);
        } else {
          if ( (p_33.name.length) > 0 ) {
            wr.out(this.adjustType(p_33.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_120])), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( p_33.nameNode.hasFlag("optional") && (i_120 != ns_last) ) {
          wr.out(".value.(", false);
          this.writeTypeDef(p_33.nameNode, ctx, wr);
          wr.out(")", false);
        }
        if ( p_33.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var part_14 = node.ns[0]
      if ( (part_14 != this.thisName) && ctx.isMemberVariable(part_14) ) {
        var cc_22 = ctx.getCurrentClass()
        var currC_13 = cc_22
        var up_6 = currC_13.findVariable(part_14)
        if ( typeof(up_6) !== "undefined" ) {
          /** unused:  var p3_6 = up_6   **/ 
          wr.out(this.thisName + ".", false);
        }
      }
      var p_38 = node.paramDesc
      wr.out(p_38.compiledName, false);
      return;
    }
    var b_was_static = false
    for ( var i_125 = 0; i_125 < node.ns.length; i_125++) {
      var part_17 = node.ns[i_125];
      if ( i_125 > 0 ) {
        if ( (i_125 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_125 == 0 ) {
        if ( part_17 == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_17) ) {
          b_was_static = true;
        }
        if ( (part_17 != "this") && ctx.isMemberVariable(part_17) ) {
          var cc_25 = ctx.getCurrentClass()
          var currC_16 = cc_25
          var up_9 = currC_16.findVariable(part_17)
          if ( typeof(up_9) !== "undefined" ) {
            /** unused:  var p3_9 = up_9   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_17), false);
    }
  }
  
  WriteSetterVRef(node ,ctx ,wr ) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      var rootObjName_13 = node.ns[0]
      var enumName_13 = node.ns[1]
      var e_19 = ctx.getEnum(rootObjName_13)
      if ( typeof(e_19) !== "undefined" ) {
        wr.out("" + ((e_19.values[enumName_13])), false);
        return;
      }
    }
    var next_is_gs_4 = false
    /** unused:  var last_was_setter_4 = false   **/ 
    var needs_par_4 = false
    var ns_len = (node.ns.length) - 1
    if ( (node.nsp.length) > 0 ) {
      var had_static_4 = false
      for ( var i_125 = 0; i_125 < node.nsp.length; i_125++) {
        var p_38 = node.nsp[i_125];
        if ( next_is_gs_4 ) {
          if ( p_38.isProperty() ) {
            wr.out(".Get_", false);
            needs_par_4 = true;
          } else {
            needs_par_4 = false;
          }
          next_is_gs_4 = false;
        }
        if ( needs_par_4 == false ) {
          if ( i_125 > 0 ) {
            if ( had_static_4 ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_38.nameNode.type_name) ) {
          var c_11 = ctx.findClass(p_38.nameNode.type_name)
          if ( c_11.doesInherit() ) {
            next_is_gs_4 = true;
          }
        }
        if ( i_125 == 0 ) {
          var part_16 = node.ns[0]
          if ( part_16 == "this" ) {
            wr.out(this.thisName, false);
            continue;
          }
          if ( (part_16 != this.thisName) && ctx.isMemberVariable(part_16) ) {
            var cc_24 = ctx.getCurrentClass()
            var currC_15 = cc_24
            var up_8 = currC_15.findVariable(part_16)
            if ( typeof(up_8) !== "undefined" ) {
              /** unused:  var p3_8 = up_8   **/ 
              wr.out(this.thisName + ".", false);
            }
          }
        }
        if ( (p_38.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_38.compiledName), false);
        } else {
          if ( (p_38.name.length) > 0 ) {
            wr.out(this.adjustType(p_38.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_125])), false);
          }
        }
        if ( needs_par_4 ) {
          wr.out("()", false);
          needs_par_4 = false;
        }
        if ( i_125 < ns_len ) {
          if ( p_38.nameNode.hasFlag("optional") ) {
            wr.out(".value.(", false);
            this.writeTypeDef(p_38.nameNode, ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p_38.isClass() ) {
          had_static_4 = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var part_20 = node.ns[0]
      if ( (part_20 != this.thisName) && ctx.isMemberVariable(part_20) ) {
        var cc_28 = ctx.getCurrentClass()
        var currC_19 = cc_28
        var up_12 = currC_19.findVariable(part_20)
        if ( typeof(up_12) !== "undefined" ) {
          /** unused:  var p3_12 = up_12   **/ 
          wr.out(this.thisName + ".", false);
        }
      }
      var p_42 = node.paramDesc
      wr.out(p_42.compiledName, false);
      return;
    }
    var b_was_static_4 = false
    for ( var i_129 = 0; i_129 < node.ns.length; i_129++) {
      var part_23 = node.ns[i_129];
      if ( i_129 > 0 ) {
        if ( (i_129 == 1) && b_was_static_4 ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_129 == 0 ) {
        if ( part_23 == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_23) ) {
          b_was_static_4 = true;
        }
        if ( (part_23 != "this") && ctx.isMemberVariable(part_23) ) {
          var cc_31 = ctx.getCurrentClass()
          var currC_22 = cc_31
          var up_15 = currC_22.findVariable(part_23)
          if ( typeof(up_15) !== "undefined" ) {
            /** unused:  var p3_15 = up_15   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_23), false);
    }
  }
  
  goExtractAssign(value ,p ,ctx ,wr ) {
    var arr_node = value.children[1]
    wr.newline();
    wr.out("", true);
    wr.out("// array_extract operator ", true);
    wr.out("var ", false);
    var pArr = new RangerAppParamDesc()
    pArr.name = "_arrTemp";
    pArr.node = arr_node;
    pArr.nameNode = arr_node;
    pArr.is_optional = false;
    ctx.defineVariable(p.name, pArr);
    wr.out(pArr.compiledName, false);
    wr.out(" ", false);
    this.writeTypeDef(arr_node, ctx, wr);
    wr.newline();
    wr.out(((p.compiledName + " , ") + pArr.compiledName) + " = ", false);
    ctx.setInExpr();
    this.WalkNode(value, ctx, wr);
    ctx.unsetInExpr();
    wr.out(";", true);
    var left = arr_node
    var len_5 = (left.ns.length) - 1
    /** unused:  var last_part = left.ns[len_5]   **/ 
    var next_is_gs_6 = false
    var last_was_setter_6 = false
    var needs_par_6 = false
    var b_was_static_6 = false
    for ( var i_129 = 0; i_129 < left.ns.length; i_129++) {
      var part_22 = left.ns[i_129];
      if ( next_is_gs_6 ) {
        if ( i_129 == len_5 ) {
          wr.out(".Set_", false);
          last_was_setter_6 = true;
        } else {
          wr.out(".Get_", false);
          needs_par_6 = true;
          next_is_gs_6 = false;
          last_was_setter_6 = false;
        }
      }
      if ( (last_was_setter_6 == false) && (needs_par_6 == false) ) {
        if ( i_129 > 0 ) {
          if ( (i_129 == 1) && b_was_static_6 ) {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if ( i_129 == 0 ) {
        if ( part_22 == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_22) ) {
          b_was_static_6 = true;
        }
        var partDef = ctx.getVariableDef(part_22)
        if ( typeof(partDef.nameNode) !== "undefined" ) {
          if ( ctx.isDefinedClass(partDef.nameNode.type_name) ) {
            var c_13 = ctx.findClass(partDef.nameNode.type_name)
            if ( c_13.doesInherit() ) {
              next_is_gs_6 = true;
            }
          }
        }
        if ( (part_22 != "this") && ctx.isMemberVariable(part_22) ) {
          var cc_30 = ctx.getCurrentClass()
          var currC_21 = cc_30
          var up_14 = currC_21.findVariable(part_22)
          if ( typeof(up_14) !== "undefined" ) {
            /** unused:  var p3_14 = up_14   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      if ( (left.nsp.length) > 0 ) {
        var p_45 = left.nsp[i_129]
        wr.out(this.adjustType(p_45.compiledName), false);
      } else {
        if ( left.hasParamDesc ) {
          wr.out(left.paramDesc.compiledName, false);
        } else {
          wr.out(this.adjustType(part_22), false);
        }
      }
      if ( needs_par_6 ) {
        wr.out("()", false);
        needs_par_6 = false;
      }
      if ( (left.nsp.length) >= (i_129 + 1) ) {
        var pp_6 = left.nsp[i_129]
        if ( pp_6.nameNode.hasFlag("optional") ) {
          wr.out(".value.(", false);
          this.writeTypeDef(pp_6.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
    }
    if ( last_was_setter_6 ) {
      wr.out("(", false);
      wr.out(pArr.compiledName, false);
      wr.out("); ", true);
    } else {
      wr.out(" = ", false);
      wr.out(pArr.compiledName, false);
      wr.out("; ", true);
    }
    wr.out("", true);
  }
  
  writeStructField(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_16 = node.children[1]
      var p_44 = nn_16.paramDesc
      wr.out(p_44.compiledName + " ", false);
      if ( p_44.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_44.nameNode, ctx, wr);
      }
      if ( p_44.ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out("", true);
      if ( p_44.nameNode.hasFlag("optional") ) {
      }
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_19 = node.children[1]
      var p_46 = nn_19.paramDesc
      var b_not_used = false
      if ( (p_46.ref_cnt == 0) && (p_46.is_class_variable == false) ) {
        wr.out(("/** unused:  " + p_46.compiledName) + "*/", true);
        b_not_used = true;
        return;
      }
      var map_or_hash = (nn_19.value_type == 6) || (nn_19.value_type == 7)
      if ( nn_19.hasFlag("optional") ) {
        wr.out(("var " + p_46.compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.length) > 2 ) {
          var value_9 = node.children[2]
          if ( value_9.hasParamDesc ) {
            var pnn = value_9.paramDesc.nameNode
            if ( pnn.hasFlag("optional") ) {
              wr.out(p_46.compiledName + ".value = ", false);
              ctx.setInExpr();
              var value_23 = node.getThird()
              this.WalkNode(value_23, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p_46.compiledName + ".has_value = ", false);
              ctx.setInExpr();
              var value_33 = node.getThird()
              this.WalkNode(value_33, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p_46.compiledName + ".value = ", false);
              ctx.setInExpr();
              var value_41 = node.getThird()
              this.WalkNode(value_41, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p_46.compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p_46.compiledName + " = ", false);
            ctx.setInExpr();
            var value_44 = node.getThird()
            this.WalkNode(value_44, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( ((p_46.set_cnt > 0) || p_46.is_class_variable) || map_or_hash ) {
          wr.out(("var " + p_46.compiledName) + " ", false);
        } else {
          wr.out(("var " + p_46.compiledName) + " ", false);
        }
      }
      this.writeTypeDef2(p_46.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        var value_32 = node.getThird()
        if ( value_32.expression && ((value_32.children.length) > 1) ) {
          var fc_30 = value_32.children[0]
          if ( fc_30.vref == "array_extract" ) {
            this.goExtractAssign(value_32, p_46, ctx, wr);
            return;
          }
        }
        wr.out(" = ", false);
        ctx.setInExpr();
        this.WalkNode(value_32, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_19.value_type == 6 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_46.nameNode, ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn_19.value_type == 7 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_46.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p_46.ref_cnt == 0) && (p_46.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_46.ref_cnt == 0) && (p_46.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn_19.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_131 = 0; i_131 < fnDesc.params.length; i_131++) {
      var arg_24 = fnDesc.params[i_131];
      if ( i_131 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_24.name + " ", false);
      if ( arg_24.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg_24.nameNode, ctx, wr);
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_12 = node.clDesc
      /** unused:  var fc_33 = node.getSecond()   **/ 
      wr.out(("CreateNew_" + node.clDesc.name) + "(", false);
      var constr_11 = cl_12.constructor_fn
      var givenArgs_8 = node.getThird()
      if ( typeof(constr_11) !== "undefined" ) {
        for ( var i_133 = 0; i_133 < constr_11.params.length; i_133++) {
          var arg_27 = constr_11.params[i_133];
          var n_14 = givenArgs_8.children[i_133]
          if ( i_133 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg_27.nameNode) !== "undefined") ) {
            this.WalkNode(n_14, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  CustomOperator(node ,ctx ,wr ) {
    var fc_35 = node.getFirst()
    var cmd_3 = fc_35.vref
    if ( ((cmd_3 == "=") || (cmd_3 == "push")) || (cmd_3 == "removeLast") ) {
      var left_4 = node.getSecond()
      var right = left_4
      if ( (cmd_3 == "=") || (cmd_3 == "push") ) {
        right = node.getThird();
      }
      wr.newline();
      var b_was_static_8 = false
      if ( left_4.hasParamDesc ) {
        var len_8 = (left_4.ns.length) - 1
        /** unused:  var last_part_4 = left_4.ns[len_8]   **/ 
        var next_is_gs_8 = false
        var last_was_setter_8 = false
        var needs_par_8 = false
        for ( var i_135 = 0; i_135 < left_4.ns.length; i_135++) {
          var part_24 = left_4.ns[i_135];
          if ( next_is_gs_8 ) {
            if ( i_135 == len_8 ) {
              wr.out(".Set_", false);
              last_was_setter_8 = true;
            } else {
              wr.out(".Get_", false);
              needs_par_8 = true;
              next_is_gs_8 = false;
              last_was_setter_8 = false;
            }
          }
          if ( (last_was_setter_8 == false) && (needs_par_8 == false) ) {
            if ( i_135 > 0 ) {
              if ( (i_135 == 1) && b_was_static_8 ) {
                wr.out("_static_", false);
              } else {
                wr.out(".", false);
              }
            }
          }
          if ( i_135 == 0 ) {
            if ( part_24 == "this" ) {
              wr.out(this.thisName, false);
              continue;
            }
            if ( ctx.hasClass(part_24) ) {
              b_was_static_8 = true;
            }
            if ( (part_24 != "this") && ctx.isMemberVariable(part_24) ) {
              var cc_32 = ctx.getCurrentClass()
              var currC_23 = cc_32
              var up_16 = currC_23.findVariable(part_24)
              if ( typeof(up_16) !== "undefined" ) {
                /** unused:  var p3_16 = up_16   **/ 
                wr.out(this.thisName + ".", false);
              }
            }
          }
          var partDef_4 = ctx.getVariableDef(part_24)
          if ( (left_4.nsp.length) > i_135 ) {
            partDef_4 = left_4.nsp[i_135];
          }
          if ( typeof(partDef_4.nameNode) !== "undefined" ) {
            if ( ctx.isDefinedClass(partDef_4.nameNode.type_name) ) {
              var c_15 = ctx.findClass(partDef_4.nameNode.type_name)
              if ( c_15.doesInherit() ) {
                next_is_gs_8 = true;
              }
            }
          }
          if ( (left_4.nsp.length) > 0 ) {
            var p_48 = left_4.nsp[i_135]
            wr.out(this.adjustType(p_48.compiledName), false);
          } else {
            if ( left_4.hasParamDesc ) {
              wr.out(left_4.paramDesc.compiledName, false);
            } else {
              wr.out(this.adjustType(part_24), false);
            }
          }
          if ( needs_par_8 ) {
            wr.out("()", false);
            needs_par_8 = false;
          }
          if ( (left_4.nsp.length) >= (i_135 + 1) ) {
            var pp_9 = left_4.nsp[i_135]
            if ( pp_9.nameNode.hasFlag("optional") ) {
              wr.out(".value.(", false);
              this.writeTypeDef(pp_9.nameNode, ctx, wr);
              wr.out(")", false);
            }
          }
        }
        if ( cmd_3 == "removeLast" ) {
          if ( last_was_setter_8 ) {
            wr.out("(", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("); ", true);
          } else {
            wr.out(" = ", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("; ", true);
          }
          return;
        }
        if ( cmd_3 == "push" ) {
          if ( last_was_setter_8 ) {
            wr.out("(", false);
            ctx.setInExpr();
            wr.out("append(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out(")); ", true);
          } else {
            wr.out(" = ", false);
            wr.out("append(", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out("); ", true);
          }
          return;
        }
        if ( last_was_setter_8 ) {
          wr.out("(", false);
          ctx.setInExpr();
          this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("); ", true);
        } else {
          wr.out(" = ", false);
          ctx.setInExpr();
          this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("; ", true);
        }
        return;
      }
      this.WriteSetterVRef(left_4, ctx, wr);
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(right, ctx, wr);
      ctx.unsetInExpr();
      wr.out("; /* custom */", true);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_15 = node.clDesc
    if ( typeof(cl_15) === "undefined" ) {
      return;
    }
    var wr_9 = orig_wr
    if ( this.did_write_nullable == false ) {
      wr_9.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      wr_9.createTag("utilities");
      this.did_write_nullable = true;
    }
    var declaredVariable_2 = []
    wr_9.out(("type " + cl_15.name) + " struct { ", true);
    wr_9.indent(1);
    for ( var i_137 = 0; i_137 < cl_15.variables.length; i_137++) {
      var pvar_9 = cl_15.variables[i_137];
      this.writeStructField(pvar_9.node, ctx, wr_9);
      declaredVariable_2[pvar_9.name] = true
    }
    if ( (cl_15.extends_classes.length) > 0 ) {
      for ( var i_141 = 0; i_141 < cl_15.extends_classes.length; i_141++) {
        var pName_4 = cl_15.extends_classes[i_141];
        var pC_2 = ctx.findClass(pName_4)
        wr_9.out("// inherited from parent class " + pName_4, true);
        for ( var i_150 = 0; i_150 < pC_2.variables.length; i_150++) {
          var pvar_14 = pC_2.variables[i_150];
          if ( typeof(declaredVariable_2[pvar_14.name] ) != "undefined" ) {
            continue;
          }
          this.writeStructField(pvar_14.node, ctx, wr_9);
        }
      }
    }
    wr_9.indent(-1);
    wr_9.out("}", true);
    wr_9.out(("type IFACE_" + cl_15.name) + " interface { ", true);
    wr_9.indent(1);
    for ( var i_147 = 0; i_147 < cl_15.variables.length; i_147++) {
      var p_50 = cl_15.variables[i_147];
      wr_9.out("Get_", false);
      wr_9.out(p_50.compiledName + "() ", false);
      if ( p_50.nameNode.hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_50.nameNode, ctx, wr_9);
      }
      wr_9.out("", true);
      wr_9.out("Set_", false);
      wr_9.out(p_50.compiledName + "(value ", false);
      if ( p_50.nameNode.hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_50.nameNode, ctx, wr_9);
      }
      wr_9.out(") ", true);
    }
    for ( var i_150 = 0; i_150 < cl_15.defined_variants.length; i_150++) {
      var fnVar_7 = cl_15.defined_variants[i_150];
      var mVs_7 = cl_15.method_variants[fnVar_7]
      for ( var i_157 = 0; i_157 < mVs_7.variants.length; i_157++) {
        var variant_15 = mVs_7.variants[i_157];
        wr_9.out(variant_15.name + "(", false);
        this.writeArgsDef(variant_15, ctx, wr_9);
        wr_9.out(") ", false);
        if ( variant_15.nameNode.hasFlag("optional") ) {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_15.nameNode, ctx, wr_9);
        }
        wr_9.out("", true);
      }
    }
    wr_9.indent(-1);
    wr_9.out("}", true);
    this.thisName = "me";
    wr_9.out("", true);
    wr_9.out(("func CreateNew_" + cl_15.name) + "(", false);
    if ( cl_15.has_constructor ) {
      var constr_14 = cl_15.constructor_fn
      for ( var i_156 = 0; i_156 < constr_14.params.length; i_156++) {
        var arg_29 = constr_14.params[i_156];
        if ( i_156 > 0 ) {
          wr_9.out(", ", false);
        }
        wr_9.out(arg_29.name + " ", false);
        this.writeTypeDef(arg_29.nameNode, ctx, wr_9);
      }
    }
    wr_9.out((") *" + cl_15.name) + " {", true);
    wr_9.indent(1);
    wr_9.newline();
    wr_9.out(("me := new(" + cl_15.name) + ")", true);
    for ( var i_159 = 0; i_159 < cl_15.variables.length; i_159++) {
      var pvar_17 = cl_15.variables[i_159];
      var nn_21 = pvar_17.node
      if ( (nn_21.children.length) > 2 ) {
        var valueNode = nn_21.children[2]
        wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr_9);
        wr_9.out("", true);
      } else {
        var pNameN = pvar_17.nameNode
        if ( pNameN.value_type == 6 ) {
          wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
          wr_9.out("make(", false);
          this.writeTypeDef(pvar_17.nameNode, ctx, wr_9);
          wr_9.out(",0)", true);
        }
        if ( pNameN.value_type == 7 ) {
          wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
          wr_9.out("make(", false);
          this.writeTypeDef(pvar_17.nameNode, ctx, wr_9);
          wr_9.out(")", true);
        }
      }
    }
    for ( var i_162 = 0; i_162 < cl_15.variables.length; i_162++) {
      var pvar_20 = cl_15.variables[i_162];
      if ( pvar_20.nameNode.hasFlag("optional") ) {
        wr_9.out(("me." + pvar_20.compiledName) + " = new(GoNullable);", true);
      }
    }
    if ( (cl_15.extends_classes.length) > 0 ) {
      for ( var i_165 = 0; i_165 < cl_15.extends_classes.length; i_165++) {
        var pName_9 = cl_15.extends_classes[i_165];
        var pC_7 = ctx.findClass(pName_9)
        for ( var i_174 = 0; i_174 < pC_7.variables.length; i_174++) {
          var pvar_23 = pC_7.variables[i_174];
          var nn_25 = pvar_23.node
          if ( (nn_25.children.length) > 2 ) {
            var valueNode_6 = nn_25.children[2]
            wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
            this.WalkNode(valueNode_6, ctx, wr_9);
            wr_9.out("", true);
          } else {
            var pNameN_6 = pvar_23.nameNode
            if ( pNameN_6.value_type == 6 ) {
              wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
              wr_9.out("make(", false);
              this.writeTypeDef(pvar_23.nameNode, ctx, wr_9);
              wr_9.out(",0)", true);
            }
            if ( pNameN_6.value_type == 7 ) {
              wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
              wr_9.out("make(", false);
              this.writeTypeDef(pvar_23.nameNode, ctx, wr_9);
              wr_9.out(")", true);
            }
          }
        }
        for ( var i_179 = 0; i_179 < pC_7.variables.length; i_179++) {
          var pvar_30 = pC_7.variables[i_179];
          if ( pvar_30.nameNode.hasFlag("optional") ) {
            wr_9.out(("me." + pvar_30.compiledName) + " = new(GoNullable);", true);
          }
        }
        if ( pC_7.has_constructor ) {
          var constr_18 = pC_7.constructor_fn
          var subCtx_33 = constr_18.fnCtx
          subCtx_33.is_function = true;
          this.WalkNode(constr_18.fnBody, subCtx_33, wr_9);
        }
      }
    }
    if ( cl_15.has_constructor ) {
      var constr_21 = cl_15.constructor_fn
      var subCtx_38 = constr_21.fnCtx
      subCtx_38.is_function = true;
      this.WalkNode(constr_21.fnBody, subCtx_38, wr_9);
    }
    wr_9.out("return me;", true);
    wr_9.indent(-1);
    wr_9.out("}", true);
    this.thisName = "this";
    for ( var i_174 = 0; i_174 < cl_15.static_methods.length; i_174++) {
      var variant_20 = cl_15.static_methods[i_174];
      if ( variant_20.nameNode.hasFlag("main") ) {
        continue;
      }
      wr_9.newline();
      wr_9.out(((("func " + cl_15.name) + "_static_") + variant_20.name) + "(", false);
      this.writeArgsDef(variant_20, ctx, wr_9);
      wr_9.out(") ", false);
      this.writeTypeDef(variant_20.nameNode, ctx, wr_9);
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.newline();
      var subCtx_41 = variant_20.fnCtx
      subCtx_41.is_function = true;
      this.WalkNode(variant_20.fnBody, subCtx_41, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    var declaredFn = []
    for ( var i_177 = 0; i_177 < cl_15.defined_variants.length; i_177++) {
      var fnVar_12 = cl_15.defined_variants[i_177];
      var mVs_12 = cl_15.method_variants[fnVar_12]
      for ( var i_184 = 0; i_184 < mVs_12.variants.length; i_184++) {
        var variant_23 = mVs_12.variants[i_184];
        declaredFn[variant_23.name] = true
        wr_9.out(((("func (this *" + cl_15.name) + ") ") + variant_23.name) + " (", false);
        this.writeArgsDef(variant_23, ctx, wr_9);
        wr_9.out(") ", false);
        if ( variant_23.nameNode.hasFlag("optional") ) {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_23.nameNode, ctx, wr_9);
        }
        wr_9.out(" {", true);
        wr_9.indent(1);
        wr_9.newline();
        var subCtx_44 = variant_23.fnCtx
        subCtx_44.is_function = true;
        this.WalkNode(variant_23.fnBody, subCtx_44, wr_9);
        wr_9.newline();
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
    if ( (cl_15.extends_classes.length) > 0 ) {
      for ( var i_183 = 0; i_183 < cl_15.extends_classes.length; i_183++) {
        var pName_12 = cl_15.extends_classes[i_183];
        var pC_10 = ctx.findClass(pName_12)
        wr_9.out("// inherited methods from parent class " + pName_12, true);
        for ( var i_192 = 0; i_192 < pC_10.defined_variants.length; i_192++) {
          var fnVar_15 = pC_10.defined_variants[i_192];
          var mVs_15 = pC_10.method_variants[fnVar_15]
          for ( var i_200 = 0; i_200 < mVs_15.variants.length; i_200++) {
            var variant_26 = mVs_15.variants[i_200];
            if ( typeof(declaredFn[variant_26.name] ) != "undefined" ) {
              continue;
            }
            wr_9.out(((("func (this *" + cl_15.name) + ") ") + variant_26.name) + " (", false);
            this.writeArgsDef(variant_26, ctx, wr_9);
            wr_9.out(") ", false);
            if ( variant_26.nameNode.hasFlag("optional") ) {
              wr_9.out("*GoNullable", false);
            } else {
              this.writeTypeDef(variant_26.nameNode, ctx, wr_9);
            }
            wr_9.out(" {", true);
            wr_9.indent(1);
            wr_9.newline();
            var subCtx_47 = variant_26.fnCtx
            subCtx_47.is_function = true;
            this.WalkNode(variant_26.fnBody, subCtx_47, wr_9);
            wr_9.newline();
            wr_9.indent(-1);
            wr_9.out("}", true);
          }
        }
      }
    }
    var declaredGetter = []
    for ( var i_192 = 0; i_192 < cl_15.variables.length; i_192++) {
      var p_54 = cl_15.variables[i_192];
      declaredGetter[p_54.name] = true
      wr_9.newline();
      wr_9.out("// getter for variable " + p_54.name, true);
      wr_9.out(("func (this *" + cl_15.name) + ") ", false);
      wr_9.out("Get_", false);
      wr_9.out(p_54.compiledName + "() ", false);
      if ( p_54.nameNode.hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode, ctx, wr_9);
      }
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.out("return this." + p_54.compiledName, true);
      wr_9.indent(-1);
      wr_9.out("}", true);
      wr_9.newline();
      wr_9.out("// setter for variable " + p_54.name, true);
      wr_9.out(("func (this *" + cl_15.name) + ") ", false);
      wr_9.out("Set_", false);
      wr_9.out(p_54.compiledName + "( value ", false);
      if ( p_54.nameNode.hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode, ctx, wr_9);
      }
      wr_9.out(") ", false);
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.out(("this." + p_54.compiledName) + " = value ", true);
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    if ( (cl_15.extends_classes.length) > 0 ) {
      for ( var i_195 = 0; i_195 < cl_15.extends_classes.length; i_195++) {
        var pName_15 = cl_15.extends_classes[i_195];
        var pC_13 = ctx.findClass(pName_15)
        wr_9.out("// inherited getters and setters from the parent class " + pName_15, true);
        for ( var i_204 = 0; i_204 < pC_13.variables.length; i_204++) {
          var p_57 = pC_13.variables[i_204];
          if ( typeof(declaredGetter[p_57.name] ) != "undefined" ) {
            continue;
          }
          wr_9.newline();
          wr_9.out("// getter for variable " + p_57.name, true);
          wr_9.out(("func (this *" + cl_15.name) + ") ", false);
          wr_9.out("Get_", false);
          wr_9.out(p_57.compiledName + "() ", false);
          if ( p_57.nameNode.hasFlag("optional") ) {
            wr_9.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_57.nameNode, ctx, wr_9);
          }
          wr_9.out(" {", true);
          wr_9.indent(1);
          wr_9.out("return this." + p_57.compiledName, true);
          wr_9.indent(-1);
          wr_9.out("}", true);
          wr_9.newline();
          wr_9.out("// getter for variable " + p_57.name, true);
          wr_9.out(("func (this *" + cl_15.name) + ") ", false);
          wr_9.out("Set_", false);
          wr_9.out(p_57.compiledName + "( value ", false);
          if ( p_57.nameNode.hasFlag("optional") ) {
            wr_9.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_57.nameNode, ctx, wr_9);
          }
          wr_9.out(") ", false);
          wr_9.out(" {", true);
          wr_9.indent(1);
          wr_9.out(("this." + p_57.compiledName) + " = value ", true);
          wr_9.indent(-1);
          wr_9.out("}", true);
        }
      }
    }
    for ( var i_201 = 0; i_201 < cl_15.static_methods.length; i_201++) {
      var variant_29 = cl_15.static_methods[i_201];
      if ( variant_29.nameNode.hasFlag("main") ) {
        wr_9.out("func main() {", true);
        wr_9.indent(1);
        wr_9.newline();
        var subCtx_50 = variant_29.fnCtx
        subCtx_50.is_function = true;
        this.WalkNode(variant_29.fnBody, subCtx_50, wr_9);
        wr_9.newline();
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
  }
}
class RangerPHPClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
    this.thisName = "this";
    this.wrote_header = false;
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.vref == "this" ) {
      wr.out("$this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_12 = node.ns[0]
        var enumName_12 = node.ns[1]
        var e_18 = ctx.getEnum(rootObjName_12)
        if ( typeof(e_18) !== "undefined" ) {
          wr.out("" + ((e_18.values[enumName_12])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_150 = 0; i_150 < node.nsp.length; i_150++) {
        var p_44 = node.nsp[i_150];
        if ( i_150 == 0 ) {
          var part_17 = node.ns[0]
          if ( part_17 == "this" ) {
            wr.out("$this", false);
            continue;
          }
        }
        if ( i_150 > 0 ) {
          wr.out("->", false);
        }
        if ( i_150 == 0 ) {
          wr.out("$", false);
          if ( p_44.nameNode.hasFlag("optional") ) {
          }
          var part_26 = node.ns[0]
          if ( (part_26 != "this") && ctx.hasCurrentClass() ) {
            var uc = ctx.getCurrentClass()
            var currC_16 = uc
            var up_9 = currC_16.findVariable(part_26)
            if ( typeof(up_9) !== "undefined" ) {
              wr.out(this.thisName + "->", false);
            }
          }
        }
        if ( (p_44.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_44.compiledName), false);
        } else {
          if ( (p_44.name.length) > 0 ) {
            wr.out(this.adjustType(p_44.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_150])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out("$", false);
      var part_25 = node.ns[0]
      if ( (part_25 != "this") && ctx.hasCurrentClass() ) {
        var uc_6 = ctx.getCurrentClass()
        var currC_21 = uc_6
        var up_14 = currC_21.findVariable(part_25)
        if ( typeof(up_14) !== "undefined" ) {
          wr.out(this.thisName + "->", false);
        }
      }
      var p_49 = node.paramDesc
      wr.out(p_49.compiledName, false);
      return;
    }
    var b_was_static_5 = false
    for ( var i_155 = 0; i_155 < node.ns.length; i_155++) {
      var part_28 = node.ns[i_155];
      if ( i_155 > 0 ) {
        if ( (i_155 == 1) && b_was_static_5 ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( i_155 == 0 ) {
        if ( ctx.hasClass(part_28) ) {
          b_was_static_5 = true;
        } else {
          wr.out("$", false);
        }
        if ( (part_28 != "this") && ctx.hasCurrentClass() ) {
          var uc_9 = ctx.getCurrentClass()
          var currC_24 = uc_9
          var up_17 = currC_24.findVariable(part_28)
          if ( typeof(up_17) !== "undefined" ) {
            wr.out(this.thisName + "->", false);
          }
        }
      }
      wr.out(this.adjustType(part_28), false);
    }
  }
  
  writeVarInitDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_20 = node.children[1]
      var p_49 = nn_20.paramDesc
      if ( (p_49.ref_cnt == 0) && (p_49.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$this->" + p_49.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_15 = node.getThird()
        this.WalkNode(value_15, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_20.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_20.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_49.ref_cnt == 0) && (p_49.is_class_variable == false) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_49.ref_cnt == 0) && (p_49.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_23 = node.children[1]
      var p_51 = nn_23.paramDesc
      if ( (p_51.ref_cnt == 0) && (p_51.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$" + p_51.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_18 = node.getThird()
        this.WalkNode(value_18, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_23.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_23.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_51.ref_cnt == 0) && (p_51.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_51.ref_cnt == 0) && (p_51.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  writeClassVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_25 = node.children[1]
      var p_53 = nn_25.paramDesc
      wr.out(("var $" + p_53.compiledName) + ";", true);
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_155 = 0; i_155 < fnDesc.params.length; i_155++) {
      var arg_27 = fnDesc.params[i_155];
      if ( i_155 > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg_27.name) + " ", false);
    }
  }
  
  writeFnCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      var fc_33 = node.getFirst()
      this.WriteVRef(fc_33, ctx, wr);
      wr.out("(", false);
      var givenArgs_9 = node.getSecond()
      ctx.setInExpr();
      for ( var i_157 = 0; i_157 < node.fnDesc.params.length; i_157++) {
        var arg_30 = node.fnDesc.params[i_157];
        if ( i_157 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_9.children.length) <= i_157 ) {
          var defVal_4 = arg_30.nameNode.getFlag("default")
          if ( typeof(defVal_4) !== "undefined" ) {
            var fc_44 = defVal_4.vref_annotation.getFirst()
            this.WalkNode(fc_44, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        var n_15 = givenArgs_9.children[i_157]
        this.WalkNode(n_15, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_14 = node.clDesc
      /** unused:  var fc_38 = node.getSecond()   **/ 
      wr.out(" new ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      var constr_15 = cl_14.constructor_fn
      var givenArgs_12 = node.getThird()
      if ( typeof(constr_15) !== "undefined" ) {
        for ( var i_159 = 0; i_159 < constr_15.params.length; i_159++) {
          var arg_32 = constr_15.params[i_159];
          var n_18 = givenArgs_12.children[i_159]
          if ( i_159 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg_32.nameNode) !== "undefined") ) {
            this.WalkNode(n_18, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_17 = node.clDesc
    if ( typeof(cl_17) === "undefined" ) {
      return;
    }
    var wr_10 = orig_wr
    /** unused:  var importFork_5 = wr_10.fork()   **/ 
    if ( this.wrote_header == false ) {
      wr_10.out("<? ", true);
      wr_10.out("", true);
      this.wrote_header = true;
    }
    wr_10.out("class " + cl_17.name, false);
    var parentClass_3
    if ( (cl_17.extends_classes.length) > 0 ) {
      wr_10.out(" extends ", false);
      for ( var i_161 = 0; i_161 < cl_17.extends_classes.length; i_161++) {
        var pName_8 = cl_17.extends_classes[i_161];
        wr_10.out(pName_8, false);
        parentClass_3 = ctx.findClass(pName_8);
      }
    }
    wr_10.out(" { ", true);
    wr_10.indent(1);
    for ( var i_165 = 0; i_165 < cl_17.variables.length; i_165++) {
      var pvar_15 = cl_17.variables[i_165];
      this.writeClassVarDef(pvar_15.node, ctx, wr_10);
    }
    wr_10.out("", true);
    wr_10.out("function __construct(", false);
    if ( cl_17.has_constructor ) {
      var constr_18 = cl_17.constructor_fn
      this.writeArgsDef(constr_18, ctx, wr_10);
    }
    wr_10.out(" ) {", true);
    wr_10.indent(1);
    if ( typeof(parentClass_3) != "undefined" ) {
      wr_10.out("parent::__construct();", true);
    }
    for ( var i_168 = 0; i_168 < cl_17.variables.length; i_168++) {
      var pvar_20 = cl_17.variables[i_168];
      this.writeVarInitDef(pvar_20.node, ctx, wr_10);
    }
    if ( cl_17.has_constructor ) {
      var constr_22 = cl_17.constructor_fn
      wr_10.newline();
      var subCtx_39 = constr_22.fnCtx
      subCtx_39.is_function = true;
      this.WalkNode(constr_22.fnBody, subCtx_39, wr_10);
    }
    wr_10.newline();
    wr_10.indent(-1);
    wr_10.out("}", true);
    for ( var i_171 = 0; i_171 < cl_17.static_methods.length; i_171++) {
      var variant_20 = cl_17.static_methods[i_171];
      wr_10.out("", true);
      if ( variant_20.nameNode.hasFlag("main") ) {
        continue;
      } else {
        wr_10.out("public static function ", false);
        wr_10.out(variant_20.name + "(", false);
        this.writeArgsDef(variant_20, ctx, wr_10);
        wr_10.out(") {", true);
      }
      wr_10.indent(1);
      wr_10.newline();
      var subCtx_44 = variant_20.fnCtx
      subCtx_44.is_function = true;
      this.WalkNode(variant_20.fnBody, subCtx_44, wr_10);
      wr_10.newline();
      wr_10.indent(-1);
      wr_10.out("}", true);
    }
    for ( var i_174 = 0; i_174 < cl_17.defined_variants.length; i_174++) {
      var fnVar_10 = cl_17.defined_variants[i_174];
      var mVs_10 = cl_17.method_variants[fnVar_10]
      for ( var i_181 = 0; i_181 < mVs_10.variants.length; i_181++) {
        var variant_25 = mVs_10.variants[i_181];
        wr_10.out("", true);
        wr_10.out(("function " + variant_25.name) + "(", false);
        this.writeArgsDef(variant_25, ctx, wr_10);
        wr_10.out(") {", true);
        wr_10.indent(1);
        wr_10.newline();
        var subCtx_47 = variant_25.fnCtx
        subCtx_47.is_function = true;
        this.WalkNode(variant_25.fnBody, subCtx_47, wr_10);
        wr_10.newline();
        wr_10.indent(-1);
        wr_10.out("}", true);
      }
    }
    wr_10.indent(-1);
    wr_10.out("}", true);
    for ( var i_180 = 0; i_180 < cl_17.static_methods.length; i_180++) {
      var variant_28 = cl_17.static_methods[i_180];
      ctx.disableCurrentClass();
      wr_10.out("", true);
      if ( variant_28.nameNode.hasFlag("main") ) {
        wr_10.out("/* static PHP main routine */", false);
        wr_10.newline();
        this.WalkNode(variant_28.fnBody, ctx, wr_10);
        wr_10.newline();
      }
    }
  }
}
class RangerJavaScriptClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
    this.thisName = "this";     /** note: unused */
    this.wrote_header = false;
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  WriteVRef(node ,ctx ,wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        var rootObjName_13 = node.ns[0]
        var enumName_13 = node.ns[1]
        var e_19 = ctx.getEnum(rootObjName_13)
        if ( typeof(e_19) !== "undefined" ) {
          wr.out("" + ((e_19.values[enumName_13])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( var i_162 = 0; i_162 < node.nsp.length; i_162++) {
        var p_49 = node.nsp[i_162];
        if ( i_162 > 0 ) {
          wr.out(".", false);
        }
        if ( i_162 == 0 ) {
          if ( p_49.nameNode.hasFlag("optional") ) {
          }
          var part_21 = node.ns[0]
          if ( (part_21 != "this") && ctx.isMemberVariable(part_21) ) {
            var uc_4 = ctx.getCurrentClass()
            var currC_19 = uc_4
            var up_12 = currC_19.findVariable(part_21)
            if ( typeof(up_12) !== "undefined" ) {
              wr.out("this.", false);
            }
          }
          if ( part_21 == "this" ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p_49.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p_49.compiledName), false);
        } else {
          if ( (p_49.name.length) > 0 ) {
            wr.out(this.adjustType(p_49.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i_162])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      var part_26 = node.ns[0]
      if ( (part_26 != "this") && ctx.isMemberVariable(part_26) ) {
        var uc_9 = ctx.getCurrentClass()
        var currC_24 = uc_9
        var up_17 = currC_24.findVariable(part_26)
        if ( typeof(up_17) !== "undefined" ) {
          wr.out("this.", false);
        }
      }
      var p_54 = node.paramDesc
      wr.out(p_54.compiledName, false);
      return;
    }
    var b_was_static_6 = false
    for ( var i_167 = 0; i_167 < node.ns.length; i_167++) {
      var part_29 = node.ns[i_167];
      if ( i_167 > 0 ) {
        if ( (i_167 == 1) && b_was_static_6 ) {
          wr.out(".", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_167 == 0 ) {
        if ( ctx.hasClass(part_29) ) {
          b_was_static_6 = true;
        } else {
          wr.out("", false);
        }
        if ( (part_29 != "this") && ctx.isMemberVariable(part_29) ) {
          var uc_12 = ctx.getCurrentClass()
          var currC_27 = uc_12
          var up_20 = currC_27.findVariable(part_29)
          if ( typeof(up_20) !== "undefined" ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_29), false);
    }
  }
  
  writeVarInitDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_23 = node.children[1]
      var p_54 = nn_23.paramDesc
      var remove_unused = ctx.hasCompilerFlag("remove-unused-class-vars")
      if ( (p_54.ref_cnt == 0) && (remove_unused || (p_54.is_class_variable == false)) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("this." + p_54.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_17 = node.getThird()
        this.WalkNode(value_17, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_23.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_23.value_type == 7 ) {
          wr.out(" = {}", false);
        }
      }
      if ( (p_54.ref_cnt == 0) && (remove_unused || (p_54.is_class_variable == false)) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_54.ref_cnt == 0) && (p_54.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_26 = node.children[1]
      var p_56 = nn_26.paramDesc
      /** unused:  var opt_js = ctx.hasCompilerFlag("optimize-js")   **/ 
      if ( (p_56.ref_cnt == 0) && (p_56.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("var " + p_56.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        var value_20 = node.getThird()
        this.WalkNode(value_20, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_26.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_26.value_type == 7 ) {
          wr.out(" = []", false);
        }
      }
      if ( (p_56.ref_cnt == 0) && (p_56.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_56.ref_cnt == 0) && (p_56.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.out("", false);
        wr.newline();
      }
    }
  }
  
  writeClassVarDef(node ,ctx ,wr ) {
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_167 = 0; i_167 < fnDesc.params.length; i_167++) {
      var arg_30 = fnDesc.params[i_167];
      if ( i_167 > 0 ) {
        wr.out(",", false);
      }
      wr.out(arg_30.name + " ", false);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_16 = node.clDesc
    if ( typeof(cl_16) === "undefined" ) {
      return;
    }
    var wr_11 = orig_wr
    /** unused:  var importFork_6 = wr_11.fork()   **/ 
    if ( this.wrote_header == false ) {
      wr_11.out("", true);
      this.wrote_header = true;
    }
    var b_extd = false
    wr_11.out(("class " + cl_16.name) + " ", false);
    for ( var i_169 = 0; i_169 < cl_16.extends_classes.length; i_169++) {
      var pName_9 = cl_16.extends_classes[i_169];
      if ( i_169 == 0 ) {
        wr_11.out(" extends ", false);
      }
      wr_11.out(pName_9, false);
      b_extd = true;
    }
    wr_11.out(" {", true);
    wr_11.indent(1);
    for ( var i_173 = 0; i_173 < cl_16.variables.length; i_173++) {
      var pvar_17 = cl_16.variables[i_173];
      this.writeClassVarDef(pvar_17.node, ctx, wr_11);
    }
    wr_11.out("", true);
    wr_11.out("constructor(", false);
    if ( cl_16.has_constructor ) {
      var constr_18 = cl_16.constructor_fn
      this.writeArgsDef(constr_18, ctx, wr_11);
    }
    wr_11.out(" ) {", true);
    wr_11.indent(1);
    if ( b_extd ) {
      wr_11.out("super()", true);
    }
    for ( var i_176 = 0; i_176 < cl_16.variables.length; i_176++) {
      var pvar_22 = cl_16.variables[i_176];
      this.writeVarInitDef(pvar_22.node, ctx, wr_11);
    }
    if ( cl_16.has_constructor ) {
      var constr_23 = cl_16.constructor_fn
      wr_11.newline();
      var subCtx_42 = constr_23.fnCtx
      subCtx_42.is_function = true;
      this.WalkNode(constr_23.fnBody, subCtx_42, wr_11);
    }
    wr_11.newline();
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( var i_179 = 0; i_179 < cl_16.defined_variants.length; i_179++) {
      var fnVar_11 = cl_16.defined_variants[i_179];
      var mVs_11 = cl_16.method_variants[fnVar_11]
      for ( var i_186 = 0; i_186 < mVs_11.variants.length; i_186++) {
        var variant_23 = mVs_11.variants[i_186];
        wr_11.out("", true);
        wr_11.out(("" + variant_23.name) + "(", false);
        this.writeArgsDef(variant_23, ctx, wr_11);
        wr_11.out(") {", true);
        wr_11.indent(1);
        wr_11.newline();
        var subCtx_47 = variant_23.fnCtx
        subCtx_47.is_function = true;
        this.WalkNode(variant_23.fnBody, subCtx_47, wr_11);
        wr_11.newline();
        wr_11.indent(-1);
        wr_11.out("}", true);
      }
    }
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( var i_185 = 0; i_185 < cl_16.static_methods.length; i_185++) {
      var variant_28 = cl_16.static_methods[i_185];
      wr_11.out("", true);
      if ( variant_28.nameNode.hasFlag("main") ) {
        continue;
      } else {
        wr_11.out(((cl_16.name + ".") + variant_28.name) + " = function(", false);
        this.writeArgsDef(variant_28, ctx, wr_11);
        wr_11.out(") {", true);
      }
      wr_11.indent(1);
      wr_11.newline();
      var subCtx_50 = variant_28.fnCtx
      subCtx_50.is_function = true;
      this.WalkNode(variant_28.fnBody, subCtx_50, wr_11);
      wr_11.newline();
      wr_11.indent(-1);
      wr_11.out("}", true);
    }
    for ( var i_188 = 0; i_188 < cl_16.static_methods.length; i_188++) {
      var variant_31 = cl_16.static_methods[i_188];
      ctx.disableCurrentClass();
      wr_11.out("", true);
      if ( variant_31.nameNode.hasFlag("main") ) {
        wr_11.out("/* static JavaSript main routine */", false);
        wr_11.newline();
        this.WalkNode(variant_31.fnBody, ctx, wr_11);
        wr_11.newline();
      }
    }
  }
}
class RangerRangerClassWriter  extends RangerGenericClassWriter {
  
  constructor( ) {
    super()
    this.compiler;     /** note: unused */
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  
  getObjectTypeString(type_string ,ctx ) {
    return type_string;
  }
  
  getTypeString(type_string ) {
    return type_string;
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    var v_type_9 = node.value_type
    var t_name_3 = node.type_name
    var a_name_5 = node.array_type
    var k_name_3 = node.key_type
    if ( ((v_type_9 == 8) || (v_type_9 == 9)) || (v_type_9 == 0) ) {
      v_type_9 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_9 = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name_3 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name_5 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name_3 = node.eval_key_type;
      }
    }
    if ( v_type_9 == 7 ) {
      wr.out(((("[" + k_name_3) + ":") + a_name_5) + "]", false);
      return;
    }
    if ( v_type_9 == 6 ) {
      wr.out(("[" + a_name_5) + "]", false);
      return;
    }
    wr.out(t_name_3, false);
  }
  
  WriteVRef(node ,ctx ,wr ) {
    wr.out(node.vref, false);
  }
  
  WriteVRefWithOpt(node ,ctx ,wr ) {
    wr.out(node.vref, false);
    var flags = ["optional","weak","strong","temp","lives","returns","returnvalue"]
    var some_set = false
    for ( var i_172 = 0; i_172 < flags.length; i_172++) {
      var flag_2 = flags[i_172];
      if ( node.hasFlag(flag_2) ) {
        if ( false == some_set ) {
          wr.out("@(", false);
          some_set = true;
        } else {
          wr.out(" ", false);
        }
        wr.out(flag_2, false);
      }
    }
    if ( some_set ) {
      wr.out(")", false);
    }
  }
  
  writeVarDef(node ,ctx ,wr ) {
    if ( node.hasParamDesc ) {
      var nn_25 = node.children[1]
      var p_53 = nn_25.paramDesc
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn_25, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(p_53.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        var value_19 = node.getThird()
        this.WalkNode(value_19, ctx, wr);
        ctx.unsetInExpr();
      }
      wr.newline();
    }
  }
  
  writeFnCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      if ( ctx.expressionLevel() > 0 ) {
        wr.out("(", false);
      }
      var fc_36 = node.getFirst()
      this.WriteVRef(fc_36, ctx, wr);
      wr.out("(", false);
      var givenArgs_11 = node.getSecond()
      ctx.setInExpr();
      for ( var i_175 = 0; i_175 < node.fnDesc.params.length; i_175++) {
        var arg_31 = node.fnDesc.params[i_175];
        if ( i_175 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_11.children.length) <= i_175 ) {
          var defVal_5 = arg_31.nameNode.getFlag("default")
          if ( typeof(defVal_5) !== "undefined" ) {
            var fc_47 = defVal_5.vref_annotation.getFirst()
            this.WalkNode(fc_47, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        var n_17 = givenArgs_11.children[i_175]
        this.WalkNode(n_17, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() > 0 ) {
        wr.out(")", false);
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  }
  
  writeNewCall(node ,ctx ,wr ) {
    if ( node.hasNewOper ) {
      var cl_17 = node.clDesc
      /** unused:  var fc_41 = node.getSecond()   **/ 
      wr.out("(new " + node.clDesc.name, false);
      wr.out("(", false);
      var constr_20 = cl_17.constructor_fn
      var givenArgs_14 = node.getThird()
      if ( typeof(constr_20) !== "undefined" ) {
        for ( var i_177 = 0; i_177 < constr_20.params.length; i_177++) {
          var arg_34 = constr_20.params[i_177];
          var n_20 = givenArgs_14.children[i_177]
          if ( i_177 > 0 ) {
            wr.out(" ", false);
          }
          if ( true || (typeof(arg_34.nameNode) !== "undefined") ) {
            this.WalkNode(n_20, ctx, wr);
          }
        }
      }
      wr.out("))", false);
    }
  }
  
  writeArgsDef(fnDesc ,ctx ,wr ) {
    for ( var i_179 = 0; i_179 < fnDesc.params.length; i_179++) {
      var arg_36 = fnDesc.params[i_179];
      if ( i_179 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg_36.nameNode, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(arg_36.nameNode, ctx, wr);
    }
  }
  
  writeClass(node ,ctx ,orig_wr ) {
    var cl_20 = node.clDesc
    if ( typeof(cl_20) === "undefined" ) {
      return;
    }
    var wr_12 = orig_wr
    var importFork_7 = wr_12.fork()
    wr_12.out("", true);
    wr_12.out("class " + cl_20.name, false);
    var parentClass_4
    wr_12.out(" { ", true);
    wr_12.indent(1);
    if ( (cl_20.extends_classes.length) > 0 ) {
      wr_12.out("Extends(", false);
      for ( var i_181 = 0; i_181 < cl_20.extends_classes.length; i_181++) {
        var pName_10 = cl_20.extends_classes[i_181];
        wr_12.out(pName_10, false);
        parentClass_4 = ctx.findClass(pName_10);
      }
      wr_12.out(")", true);
    }
    wr_12.createTag("utilities");
    for ( var i_185 = 0; i_185 < cl_20.variables.length; i_185++) {
      var pvar_19 = cl_20.variables[i_185];
      this.writeVarDef(pvar_19.node, ctx, wr_12);
    }
    if ( cl_20.has_constructor ) {
      var constr_23 = cl_20.constructor_fn
      wr_12.out("", true);
      wr_12.out("Constructor (", false);
      this.writeArgsDef(constr_23, ctx, wr_12);
      wr_12.out(" ) {", true);
      wr_12.indent(1);
      wr_12.newline();
      var subCtx_45 = constr_23.fnCtx
      subCtx_45.is_function = true;
      this.WalkNode(constr_23.fnBody, subCtx_45, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
    for ( var i_188 = 0; i_188 < cl_20.static_methods.length; i_188++) {
      var variant_26 = cl_20.static_methods[i_188];
      wr_12.out("", true);
      if ( variant_26.nameNode.hasFlag("main") ) {
        wr_12.out("sfn m@(main):void () {", true);
      } else {
        wr_12.out("sfn ", false);
        this.WriteVRefWithOpt(variant_26.nameNode, ctx, wr_12);
        wr_12.out(":", false);
        this.writeTypeDef(variant_26.nameNode, ctx, wr_12);
        wr_12.out(" (", false);
        this.writeArgsDef(variant_26, ctx, wr_12);
        wr_12.out(") {", true);
      }
      wr_12.indent(1);
      wr_12.newline();
      var subCtx_50 = variant_26.fnCtx
      subCtx_50.is_function = true;
      this.WalkNode(variant_26.fnBody, subCtx_50, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
    for ( var i_191 = 0; i_191 < cl_20.defined_variants.length; i_191++) {
      var fnVar_12 = cl_20.defined_variants[i_191];
      var mVs_12 = cl_20.method_variants[fnVar_12]
      for ( var i_198 = 0; i_198 < mVs_12.variants.length; i_198++) {
        var variant_31 = mVs_12.variants[i_198];
        wr_12.out("", true);
        wr_12.out("fn ", false);
        this.WriteVRefWithOpt(variant_31.nameNode, ctx, wr_12);
        wr_12.out(":", false);
        this.writeTypeDef(variant_31.nameNode, ctx, wr_12);
        wr_12.out(" ", false);
        wr_12.out("(", false);
        this.writeArgsDef(variant_31, ctx, wr_12);
        wr_12.out(") {", true);
        wr_12.indent(1);
        wr_12.newline();
        var subCtx_53 = variant_31.fnCtx
        subCtx_53.is_function = true;
        this.WalkNode(variant_31.fnBody, subCtx_53, wr_12);
        wr_12.newline();
        wr_12.indent(-1);
        wr_12.out("}", true);
      }
    }
    wr_12.indent(-1);
    wr_12.out("}", true);
    var import_list_4 = wr_12.getImports()
    for ( var i_197 = 0; i_197 < import_list_4.length; i_197++) {
      var codeStr_4 = import_list_4[i_197];
      importFork_7.out(("Import \"" + codeStr_4) + "\"", true);
    }
  }
}
class LiveCompiler  {
  
  constructor( ) {
    this.langWriter;
    this.hasCreatedPolyfill = {};     /** note: unused */
  }
  
  initWriter(ctx ) {
    if ( typeof(this.langWriter) !== "undefined" ) {
      return;
    }
    var root_21 = ctx.getRoot()
    switch (root_21.targetLangName ) { 
      case "go" : 
        this.langWriter = new RangerGolangClassWriter();
        break;
      case "scala" : 
        this.langWriter = new RangerScalaClassWriter();
        break;
      case "java7" : 
        this.langWriter = new RangerJava7ClassWriter();
        break;
      case "swift3" : 
        this.langWriter = new RangerSwift3ClassWriter();
        break;
      case "kotlin" : 
        this.langWriter = new RangerKotlinClassWriter();
        break;
      case "php" : 
        this.langWriter = new RangerPHPClassWriter();
        break;
      case "csharp" : 
        this.langWriter = new RangerCSharpClassWriter();
        break;
      case "es6" : 
        this.langWriter = new RangerJavaScriptClassWriter();
        break;
      case "ranger" : 
        this.langWriter = new RangerRangerClassWriter();
        break;
    }
    if ( typeof(this.langWriter) !== "undefined" ) {
      this.langWriter.compiler = this;
    } else {
      this.langWriter = new RangerGenericClassWriter();
      this.langWriter.compiler = this;
    }
  }
  
  EncodeString(node ,ctx ,wr ) {
    /** unused:  var encoded_str_4 = ""   **/ 
    var str_length_3 = node.string_value.length
    var encoded_str_10 = ""
    var ii_12 = 0
    while (ii_12 < str_length_3) {var ch_6 = node.string_value.charCodeAt(ii_12 )
      var cc_19 = ch_6
      switch (cc_19 ) { 
        case 8 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 92 : 
          encoded_str_10 = (encoded_str_10 + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        default: 
          encoded_str_10 = encoded_str_10 + (String.fromCharCode(ch_6));
          break;
      }
      ii_12 = ii_12 + 1;
    }
    return encoded_str_10;
  }
  
  WriteScalarValue(node ,ctx ,wr ) {
    this.langWriter.WriteScalarValue(node, ctx, wr);
  }
  
  adjustType(tn ) {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  
  WriteVRef(node ,ctx ,wr ) {
    this.langWriter.WriteVRef(node, ctx, wr);
  }
  
  writeTypeDef(node ,ctx ,wr ) {
    this.langWriter.writeTypeDef(node, ctx, wr);
  }
  
  CreateLambda(node ,ctx ,wr ) {
    var args_6 = node.children[2]
    var body_2 = node.children[3]
    wr.out("(", false);
    for ( var i_182 = 0; i_182 < args_6.children.length; i_182++) {
      var arg_34 = args_6.children[i_182];
      if ( i_182 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_34.vref, false);
    }
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    wr.out("// body ", true);
    for ( var i_187 = 0; i_187 < body_2.children.length; i_187++) {
      var item_9 = body_2.children[i_187];
      this.WalkNode(item_9, ctx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  
  getTypeString(str ,ctx ) {
    return "";
  }
  
  findOpCode(op ,node ,ctx ,wr ) {
    var fnName_2 = op.children[1]
    var args_9 = op.children[2]
    if ( (op.children.length) > 3 ) {
      var details = op.children[3]
      for ( var i_187 = 0; i_187 < details.children.length; i_187++) {
        var det_2 = details.children[i_187];
        if ( (det_2.children.length) > 0 ) {
          var fc_39 = det_2.children[0]
          if ( fc_39.vref == "code" ) {
            var match_4 = new RangerArgMatch()
            var all_matched_3 = match_4.matchArguments(args_9, node, ctx, 1)
            if ( all_matched_3 == false ) {
              return;
            }
            var origCode = det_2.children[1]
            var theCode = origCode.rebuildWithType(match_4, true)
            var appCtx = ctx.getRoot()
            var stdFnName = appCtx.createSignature(fnName_2.vref, (fnName_2.vref + theCode.getCode()))
            var stdClass = ctx.findClass("RangerStaticMethods")
            var runCtx = appCtx.fork()
            var b_failed = false
            if ( false == (typeof(stdClass.defined_static_methods[stdFnName] ) != "undefined") ) {
              runCtx.setInMethod();
              var m_11 = new RangerAppFunctionDesc()
              m_11.name = stdFnName;
              m_11.node = op;
              m_11.is_static = true;
              m_11.nameNode = fnName_2;
              m_11.fnBody = theCode;
              for ( var ii_15 = 0; ii_15 < args_9.children.length; ii_15++) {
                var arg_37 = args_9.children[ii_15];
                var p_54 = new RangerAppParamDesc()
                p_54.name = arg_37.vref;
                p_54.value_type = arg_37.value_type;
                p_54.node = arg_37;
                p_54.nameNode = arg_37;
                p_54.refType = 1;
                p_54.varType = 4;
                m_11.params.push(p_54);
                arg_37.hasParamDesc = true;
                arg_37.paramDesc = p_54;
                arg_37.eval_type = arg_37.value_type;
                arg_37.eval_type_name = arg_37.type_name;
                runCtx.defineVariable(p_54.name, p_54);
              }
              stdClass.addStaticMethod(m_11);
              var err_cnt_4 = ctx.compilerErrors.length
              var flowParser = new RangerFlowParser()
              var TmpWr = new CodeWriter()
              flowParser.WalkNode(theCode, runCtx, TmpWr);
              runCtx.unsetInMethod();
              var err_delta = (ctx.compilerErrors.length) - err_cnt_4
              if ( err_delta > 0 ) {
                b_failed = true;
                console.log("Had following compiler errors:")
                for ( var i_201 = 0; i_201 < ctx.compilerErrors.length; i_201++) {
                  var e_20 = ctx.compilerErrors[i_201];
                  if ( i_201 < err_cnt_4 ) {
                    continue;
                  }
                  var line_index_3 = e_20.node.getLine()
                  console.log((e_20.node.getFilename() + " Line: ") + line_index_3)
                  console.log(e_20.description)
                  console.log(e_20.node.getLineString(line_index_3))
                }
              } else {
                console.log("no errors found")
              }
            }
            if ( b_failed ) {
              wr.out("/* custom operator compilation failed */ ", false);
            } else {
              wr.out(("RangerStaticMethods." + stdFnName) + "(", false);
              for ( var i_209 = 0; i_209 < node.children.length; i_209++) {
                var cc_22 = node.children[i_209];
                if ( i_209 == 0 ) {
                  continue;
                }
                if ( i_209 > 1 ) {
                  wr.out(", ", false);
                }
                this.WalkNode(cc_22, ctx, wr);
              }
              wr.out(")", false);
            }
            return;
          }
        }
      }
    }
  }
  
  findOpTemplate(op ,node ,ctx ,wr ) {
    /** unused:  var fnName_5 = op.children[1]   **/ 
    /** unused:  var root_24 = ctx.getRoot()   **/ 
    var langName_3 = ctx.getTargetLang()
    if ( (op.children.length) > 3 ) {
      var details_4 = op.children[3]
      for ( var i_193 = 0; i_193 < details_4.children.length; i_193++) {
        var det_5 = details_4.children[i_193];
        if ( (det_5.children.length) > 0 ) {
          var fc_42 = det_5.children[0]
          if ( fc_42.vref == "templates" ) {
            var tplList_2 = det_5.children[1]
            for ( var i_205 = 0; i_205 < tplList_2.children.length; i_205++) {
              var tpl_3 = tplList_2.children[i_205];
              var tplName_2 = tpl_3.getFirst()
              var tplImpl_2
              tplImpl_2 = tpl_3.getSecond();
              if ( (tplName_2.vref != "*") && (tplName_2.vref != langName_3) ) {
                continue;
              }
              if ( tplName_2.hasFlag("mutable") ) {
                if ( false == node.hasFlag("mutable") ) {
                  continue;
                }
              }
              return tplImpl_2;
            }
          }
        }
      }
    }
    var non_2
    return non_2;
  }
  
  localCall(node ,ctx ,wr ) {
    if ( node.hasFnCall ) {
      if ( typeof(this.langWriter) !== "undefined" ) {
        this.langWriter.writeFnCall(node, ctx, wr);
        return true;
      }
    }
    if ( node.hasNewOper ) {
      this.langWriter.writeNewCall(node, ctx, wr);
      return true;
    }
    if ( node.hasVarDef ) {
      this.langWriter.writeVarDef(node, ctx, wr);
      return true;
    }
    if ( node.hasClassDescription ) {
      this.langWriter.writeClass(node, ctx, wr);
      return true;
    }
    return false;
  }
  
  WalkNode(node ,ctx ,wr ) {
    this.initWriter(ctx);
    if ( node.isPrimitive() ) {
      this.WriteScalarValue(node, ctx, wr);
      return;
    }
    if ( node.value_type == 9 ) {
      this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( node.value_type == 16 ) {
      this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( (node.children.length) > 0 ) {
      if ( node.has_operator ) {
        var op = ctx.findOperator(node)
        /** unused:  var fc_44 = op.getFirst()   **/ 
        var tplImpl_5 = this.findOpTemplate(op, node, ctx, wr)
        var evalCtx = ctx
        if ( typeof(node.evalCtx) !== "undefined" ) {
          evalCtx = node.evalCtx;
        }
        if ( typeof(tplImpl_5) !== "undefined" ) {
          var opName = op.getSecond()
          if ( opName.hasFlag("returns") ) {
            this.langWriter.release_local_vars(node, evalCtx, wr);
          }
          this.walkCommandList(tplImpl_5, node, evalCtx, wr);
        } else {
          this.findOpCode(op, node, evalCtx, wr);
        }
        return;
      }
      if ( node.isFirstVref("lambda") ) {
        this.CreateLambda(node, ctx, wr);
        return;
      }
      if ( (node.children.length) > 1 ) {
        if ( this.localCall(node, ctx, wr) ) {
          return;
        }
      }
      /** unused:  var fc_50 = node.getFirst()   **/ 
    }
    if ( node.expression ) {
      for ( var i_197 = 0; i_197 < node.children.length; i_197++) {
        var item_12 = node.children[i_197];
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i_197) ) {
          break;
        }
        this.WalkNode(item_12, ctx, wr);
      }
    } else {
    }
  }
  
  walkCommandList(cmd ,node ,ctx ,wr ) {
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out("(", false);
    }
    for ( var i_199 = 0; i_199 < cmd.children.length; i_199++) {
      var c_12 = cmd.children[i_199];
      this.walkCommand(c_12, node, ctx, wr);
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(")", false);
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
  }
  
  walkCommand(cmd ,node ,ctx ,wr ) {
    if ( cmd.expression ) {
      var cmdE = cmd.getFirst()
      var cmdArg = cmd.getSecond()
      switch (cmdE.vref ) { 
        case "block" : 
          var idx_8 = cmdArg.int_value
          if ( (node.children.length) > idx_8 ) {
            var arg_39 = node.children[idx_8]
            this.WalkNode(arg_39, ctx, wr);
          }
          break;
        case "varname" : 
          if ( ctx.isVarDefined(cmdArg.vref) ) {
            var p_57 = ctx.getVariableDef(cmdArg.vref)
            wr.out(p_57.compiledName, false);
          }
          break;
        case "defvar" : 
          var p_65 = new RangerAppParamDesc()
          p_65.name = cmdArg.vref;
          p_65.value_type = cmdArg.value_type;
          p_65.node = cmdArg;
          p_65.nameNode = cmdArg;
          p_65.is_optional = false;
          ctx.defineVariable(p_65.name, p_65);
          break;
        case "cc" : 
          var idx_17 = cmdArg.int_value
          if ( (node.children.length) > idx_17 ) {
            var arg_47 = node.children[idx_17]
            var cc_24 = arg_47.string_value.charCodeAt(0)
            wr.out("" + (cc_24), false);
          }
          break;
        case "java_case" : 
          var idx_22 = cmdArg.int_value
          if ( (node.children.length) > idx_22 ) {
            var arg_52 = node.children[idx_22]
            this.WalkNode(arg_52, ctx, wr);
            if ( arg_52.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "e" : 
          var idx_27 = cmdArg.int_value
          if ( (node.children.length) > idx_27 ) {
            var arg_57 = node.children[idx_27]
            ctx.setInExpr();
            this.WalkNode(arg_57, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          var idx_32 = cmdArg.int_value
          if ( (node.children.length) > idx_32 ) {
            var arg_62 = node.children[idx_32]
            ctx.setInExpr();
            this.langWriter.WriteSetterVRef(arg_62, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          var idx_37 = cmdArg.int_value
          if ( (node.children.length) > idx_37 ) {
            var arg_67 = node.children[idx_37]
            this.WalkNode(arg_67, ctx, wr);
          }
          break;
        case "ptr" : 
          var idx_42 = cmdArg.int_value
          if ( (node.children.length) > idx_42 ) {
            var arg_72 = node.children[idx_42]
            if ( arg_72.hasParamDesc ) {
              if ( arg_72.paramDesc.nameNode.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_72.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          var idx_47 = cmdArg.int_value
          if ( (node.children.length) > idx_47 ) {
            var arg_77 = node.children[idx_47]
            if ( (arg_77.isPrimitiveType() == false) && (arg_77.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          var idx_52 = cmdArg.int_value
          if ( (node.children.length) > idx_52 ) {
            var arg_82 = node.children[idx_52]
            wr.out(arg_82.vref, false);
          }
          break;
        case "list" : 
          var idx_57 = cmdArg.int_value
          if ( (node.children.length) > idx_57 ) {
            var arg_87 = node.children[idx_57]
            for ( var i_201 = 0; i_201 < arg_87.children.length; i_201++) {
              var ch_9 = arg_87.children[i_201];
              if ( i_201 > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_9, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "comma" : 
          var idx_62 = cmdArg.int_value
          if ( (node.children.length) > idx_62 ) {
            var arg_92 = node.children[idx_62]
            for ( var i_209 = 0; i_209 < arg_92.children.length; i_209++) {
              var ch_17 = arg_92.children[i_209];
              if ( i_209 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_17, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          var idx_67 = cmdArg.int_value
          if ( (node.children.length) > idx_67 ) {
            var arg_97 = node.children[idx_67]
            if ( arg_97.hasParamDesc ) {
              if ( arg_97.paramDesc.ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                wr.out(arg_97.vref, false);
              }
            } else {
              wr.out(arg_97.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          var idx_72 = cmdArg.int_value
          if ( (node.children.length) > idx_72 ) {
            var arg_102 = node.children[idx_72]
            if ( arg_102.hasParamDesc ) {
              var ss = this.langWriter.getObjectTypeString(arg_102.paramDesc.nameNode.key_type, ctx)
              wr.out(ss, false);
            } else {
              var ss_17 = this.langWriter.getObjectTypeString(arg_102.key_type, ctx)
              wr.out(ss_17, false);
            }
          }
          break;
        case "r_atype" : 
          var idx_77 = cmdArg.int_value
          if ( (node.children.length) > idx_77 ) {
            var arg_107 = node.children[idx_77]
            if ( arg_107.hasParamDesc ) {
              var ss_15 = this.langWriter.getObjectTypeString(arg_107.paramDesc.nameNode.array_type, ctx)
              wr.out(ss_15, false);
            } else {
              var ss_27 = this.langWriter.getObjectTypeString(arg_107.array_type, ctx)
              wr.out(ss_27, false);
            }
          }
          break;
        case "custom" : 
          this.langWriter.CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          var idx_82 = cmdArg.int_value
          if ( (node.children.length) > idx_82 ) {
            var arg_112 = node.children[idx_82]
            if ( arg_112.hasParamDesc ) {
              this.langWriter.writeArrayTypeDef(arg_112.paramDesc.nameNode, ctx, wr);
            } else {
              this.langWriter.writeArrayTypeDef(arg_112, ctx, wr);
            }
          }
          break;
        case "rawtype" : 
          var idx_87 = cmdArg.int_value
          if ( (node.children.length) > idx_87 ) {
            var arg_117 = node.children[idx_87]
            if ( arg_117.hasParamDesc ) {
              this.langWriter.writeRawTypeDef(arg_117.paramDesc.nameNode, ctx, wr);
            } else {
              this.langWriter.writeRawTypeDef(arg_117, ctx, wr);
            }
          }
          break;
        case "macro" : 
          var p_write = wr.getTag("utilities")
          var newWriter = new CodeWriter()
          var testCtx = ctx.fork()
          testCtx.restartExpressionLevel();
          this.walkCommandList(cmdArg, node, testCtx, newWriter);
          var p_str = newWriter.getCode()
          /** unused:  var root_26 = ctx.getRoot()   **/ 
          if ( (typeof(p_write.compiledTags[p_str] ) != "undefined") == false ) {
            p_write.compiledTags[p_str] = true
            var mCtx = ctx.fork()
            mCtx.restartExpressionLevel();
            this.walkCommandList(cmdArg, node, mCtx, p_write);
          }
          break;
        case "create_polyfill" : 
          var p_write_10 = wr.getTag("utilities")
          var p_str_10 = cmdArg.string_value
          if ( (typeof(p_write_10.compiledTags[p_str_10] ) != "undefined") == false ) {
            p_write_10.raw(p_str_10, true);
            p_write_10.compiledTags[p_str_10] = true
          }
          break;
        case "typeof" : 
          var idx_92 = cmdArg.int_value
          if ( (node.children.length) >= idx_92 ) {
            var arg_122 = node.children[idx_92]
            if ( arg_122.hasParamDesc ) {
              this.writeTypeDef(arg_122.paramDesc.nameNode, ctx, wr);
            } else {
              this.writeTypeDef(arg_122, ctx, wr);
            }
          }
          break;
        case "imp" : 
          this.langWriter.import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          var idx_97 = cmdArg.int_value
          if ( (node.children.length) >= idx_97 ) {
            var arg_127 = node.children[idx_97]
            var p_70 = this.findParamDesc(arg_127, ctx, wr)
            var nameNode_3 = p_70.nameNode
            var tn_3 = nameNode_3.array_type
            wr.out(this.getTypeString(tn_3, ctx), false);
          }
          break;
      }
    } else {
      if ( cmd.value_type == 9 ) {
        switch (cmd.vref ) { 
          case "nl" : 
            wr.newline();
            break;
          case "I" : 
            wr.indent(1);
            break;
          case "i" : 
            wr.indent(-1);
            break;
          case "op" : 
            var fc_48 = node.getFirst()
            wr.out(fc_48.vref, false);
            break;
        }
      } else {
        if ( cmd.value_type == 4 ) {
          wr.out(cmd.string_value, false);
        }
      }
    }
  }
  
  compile(node ,ctx ,wr ) {
  }
  
  findParamDesc(obj ,ctx ,wr ) {
    var varDesc_3
    var set_nsp_2 = false
    var classDesc_4
    if ( 0 == (obj.nsp.length) ) {
      set_nsp_2 = true;
    }
    if ( obj.vref != "this" ) {
      if ( (obj.ns.length) > 1 ) {
        var cnt_6 = obj.ns.length
        var classRefDesc_3
        for ( var i_205 = 0; i_205 < obj.ns.length; i_205++) {
          var strname_3 = obj.ns[i_205];
          if ( i_205 == 0 ) {
            if ( strname_3 == "this" ) {
              classDesc_4 = ctx.getCurrentClass();
              if ( set_nsp_2 ) {
                obj.nsp.push(classDesc_4);
              }
            } else {
              if ( ctx.isDefinedClass(strname_3) ) {
                classDesc_4 = ctx.findClass(strname_3);
                if ( set_nsp_2 ) {
                  obj.nsp.push(classDesc_4);
                }
                continue;
              }
              classRefDesc_3 = ctx.getVariableDef(strname_3);
              if ( typeof(classRefDesc_3) === "undefined" ) {
                ctx.addError(obj, "Error, no description for called object: " + strname_3);
                break;
              }
              if ( set_nsp_2 ) {
                obj.nsp.push(classRefDesc_3);
              }
              classRefDesc_3.ref_cnt = 1 + classRefDesc_3.ref_cnt;
              classDesc_4 = ctx.findClass(classRefDesc_3.nameNode.type_name);
            }
          } else {
            if ( i_205 < (cnt_6 - 1) ) {
              varDesc_3 = classDesc_4.findVariable(strname_3);
              if ( typeof(varDesc_3) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname_3);
              }
              var subClass_3 = varDesc_3.getTypeName()
              classDesc_4 = ctx.findClass(subClass_3);
              if ( set_nsp_2 ) {
                obj.nsp.push(varDesc_3);
              }
              continue;
            }
            if ( typeof(classDesc_4) !== "undefined" ) {
              varDesc_3 = classDesc_4.findVariable(strname_3);
              if ( typeof(varDesc_3) === "undefined" ) {
                var classMethod_2 = classDesc_4.findMethod(strname_3)
                if ( typeof(classMethod_2) === "undefined" ) {
                  classMethod_2 = classDesc_4.findStaticMethod(strname_3);
                  if ( typeof(classMethod_2) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname_3);
                  }
                }
                if ( typeof(classMethod_2) !== "undefined" ) {
                  if ( set_nsp_2 ) {
                    obj.nsp.push(classMethod_2);
                  }
                  return classMethod_2;
                }
              }
              if ( set_nsp_2 ) {
                obj.nsp.push(varDesc_3);
              }
            }
          }
        }
        return varDesc_3;
      }
      varDesc_3 = ctx.getVariableDef(obj.vref);
      if ( typeof(varDesc_3.nameNode) !== "undefined" ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref)
        if ( typeof(varDesc_3) !== "undefined" ) {
          console.log("Vardesc was found though..." + varDesc_3.name)
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return varDesc_3;
    }
    var cc_26 = ctx.getCurrentClass()
    return cc_26;
  }
}


LiveCompiler.displayCompilerErrors = function(appCtx ) {
  for ( var i_199 = 0; i_199 < appCtx.compilerErrors.length; i_199++) {
    var e_21 = appCtx.compilerErrors[i_199];
    var line_index_4 = e_21.node.getLine()
    console.log((e_21.node.getFilename() + " Line: ") + (1 + line_index_4))
    console.log(e_21.description)
    console.log(e_21.node.getLineString(line_index_4))
  }
}

LiveCompiler.displayParserErrors = function(appCtx ) {
  if ( (appCtx.parserErrors.length) == 0 ) {
    console.log("no language test errors")
    return;
  }
  console.log("LANGUAGE TEST ERRORS:")
  for ( var i_201 = 0; i_201 < appCtx.parserErrors.length; i_201++) {
    var e_24 = appCtx.parserErrors[i_201];
    var line_index_7 = e_24.node.getLine()
    console.log((e_24.node.getFilename() + " Line: ") + (1 + line_index_7))
    console.log(e_24.description)
    console.log(e_24.node.getLineString(line_index_7))
  }
}

/* static JavaSript main routine */
if ( ((process.argv.length - 2 - process.execArgv.length)) < 4 ) {
  console.log("usage <file> <language> <directory> <targetfile>")
  return;
}
var the_file = process.argv[ 2 + process.execArgv.length + 0]
var the_lang = process.argv[ 2 + process.execArgv.length + 1]
var the_target_dir = process.argv[ 2 + process.execArgv.length + 2]
var the_target = process.argv[ 2 + process.execArgv.length + 3]
console.log("file name " + the_file)
var c_13 = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + the_file , 'utf8'))
var code_3 = new SourceCode(c_13)
code_3.filename = the_file;
var parser_3 = new RangerLispParser(code_3)
parser_3.parse();
var node_2 = parser_3.rootNode
var flowParser_2 = new RangerFlowParser()
var appCtx_2 = new RangerAppWriterContext()
var wr_13 = new CodeWriter()
console.time("Total time");
flowParser_2.mergeImports(node_2, appCtx_2, wr_13);
var lang_str_2 = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + "Lang.clj" , 'utf8'))
var lang_code_2 = new SourceCode(lang_str_2)
lang_code_2.filename = "Lang.clj";
var lang_parser_2 = new RangerLispParser(lang_code_2)
lang_parser_2.parse();
appCtx_2.langOperators = lang_parser_2.rootNode;
console.log("===== collecting methods ==== ---->>>")
flowParser_2.CollectMethods(node_2, appCtx_2, wr_13);
if ( (appCtx_2.compilerErrors.length) > 0 ) {
  LiveCompiler.displayCompilerErrors(appCtx_2);
  return;
}
console.log("----> collection done")
console.log("===== starting flowParser ==== ")
appCtx_2.targetLangName = the_lang;
flowParser_2.WalkNode(node_2, appCtx_2, wr_13);
if ( (appCtx_2.compilerErrors.length) > 0 ) {
  LiveCompiler.displayCompilerErrors(appCtx_2);
  LiveCompiler.displayParserErrors(appCtx_2);
  return;
}
console.log("--- flow done --- ")
var fileSystem = new CodeFileSystem()
var file_5 = fileSystem.getFile(".", the_target)
var wr_20 = file_5.getWriter()
var lcc_2 = new LiveCompiler()
var staticMethods
var importFork_8 = wr_20.fork()
for ( var i_194 = 0; i_194 < appCtx_2.definedClassList.length; i_194++) {
  var cName_2 = appCtx_2.definedClassList[i_194];
  if ( cName_2 == "RangerStaticMethods" ) {
    staticMethods = appCtx_2.definedClasses[cName_2];
    continue;
  }
  var cl_19 = appCtx_2.definedClasses[cName_2]
  if ( cl_19.is_system ) {
    console.log(("--> system class " + cl_19.name) + ", skipping")
    continue;
  }
  lcc_2.WalkNode(cl_19.classNode, appCtx_2, wr_20);
}
if ( typeof(staticMethods) !== "undefined" ) {
  lcc_2.WalkNode(staticMethods.classNode, appCtx_2, wr_20);
}
var import_list_5 = wr_20.getImports()
if ( appCtx_2.targetLangName == "go" ) {
  importFork_8.out("package main", true);
  importFork_8.newline();
  importFork_8.out("import (", true);
  importFork_8.indent(1);
}
for ( var i_201 = 0; i_201 < import_list_5.length; i_201++) {
  var codeStr_5 = import_list_5[i_201];
  switch (appCtx_2.targetLangName ) { 
    case "go" : 
      if ( (codeStr_5.charCodeAt(0 )) == (("_".charCodeAt(0))) ) {
        importFork_8.out((" _ \"" + (codeStr_5.substring(1, (codeStr_5.length) ))) + "\"", true);
      } else {
        importFork_8.out(("\"" + codeStr_5) + "\"", true);
      }
      break;
    case "rust" : 
      importFork_8.out(("use " + codeStr_5) + ";", true);
      break;
    default: 
      importFork_8.out(("import " + codeStr_5) + "", true);
      break;
  }
}
if ( appCtx_2.targetLangName == "go" ) {
  importFork_8.indent(-1);
  importFork_8.out(")", true);
}
fileSystem.saveTo(the_target_dir);
console.log("Ready.")
LiveCompiler.displayCompilerErrors(appCtx_2);
LiveCompiler.displayParserErrors(appCtx_2);
console.timeEnd("Total time");


