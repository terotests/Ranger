
class RedomBase  {
  constructor() {
    this.el = redom.el("div");
  }
}
class RangerAppTodo  {
  constructor() {
    this.description = "";
  }
}
class RangerCompilerMessage  {
  constructor() {
    this.error_level = 0;     /** note: unused */
    this.code_line = 0;     /** note: unused */
    this.fileName = "";     /** note: unused */
    this.description = "";
  }
}
class RangerParamEventHandler  {
  constructor() {
  }
  callback (param) {
  }
}
class RangerParamEventList  {
  constructor() {
    this.list = [];
  }
}
class RangerParamEventMap  {
  constructor() {
    this.events = {};
  }
  clearAllEvents () {
  }
  addEvent (name, e) {
    if ( (( typeof(this.events[name] ) != "undefined" && this.events.hasOwnProperty(name) )) == false ) {
      this.events[name] = new RangerParamEventList()
    }
    const list = (this.events[name]);
    list.list.push(e);
  }
  fireEvent (name, from) {
    if ( ( typeof(this.events[name] ) != "undefined" && this.events.hasOwnProperty(name) ) ) {
      const list = (this.events[name]);
      for ( let i = 0; i < list.list.length; i++) {
        var ev = list.list[i];
        ev.callback(from);
      }
    }
  }
}
class RangerAppArrayValue  {
  constructor() {
    this.value_type = 0;     /** note: unused */
    this.value_type_name = "";     /** note: unused */
    this.values = [];     /** note: unused */
  }
}
class RangerAppHashValue  {
  constructor() {
    this.value_type = 0;     /** note: unused */
    this.key_type_name = "";     /** note: unused */
    this.value_type_name = "";     /** note: unused */
    this.s_values = {};     /** note: unused */
    this.i_values = {};     /** note: unused */
    this.b_values = {};     /** note: unused */
    this.d_values = {};     /** note: unused */
  }
}
class RangerAppValue  {
  constructor() {
    this.double_value = 0;     /** note: unused */
    this.string_value = "";     /** note: unused */
    this.int_value = 0;     /** note: unused */
    this.boolean_value = false;     /** note: unused */
  }
}
class RangerRefForce  {
  constructor() {
    this.strength = 0;
    this.lifetime = 1;
  }
}
class RangerAppParamDesc  {
  constructor() {
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
    this.isThis = false;     /** note: unused */
    this.ownerHistory = [];
    this.varType = 0;
    this.refType = 0;
    this.initRefType = 0;
    this.paramIndex = 0;     /** note: unused */
    this.is_optional = false;
    this.is_mutating = false;     /** note: unused */
    this.is_set = false;     /** note: unused */
    this.is_class_variable = false;
    this.is_captured = false;
    this.description = "";     /** note: unused */
    this.git_doc = "";     /** note: unused */
    this.has_events = false;
  }
  addEvent (name, e) {
    if ( this.has_events == false ) {
      this.eMap = new RangerParamEventMap();
      this.has_events = true;
    }
    this.eMap.addEvent(name, e);
  }
  changeStrength (newStrength, lifeTime, changer) {
    const entry = new RangerRefForce();
    entry.strength = newStrength;
    entry.lifetime = lifeTime;
    entry.changer = changer;
    this.ownerHistory.push(entry);
  }
  isProperty () {
    return true;
  }
  isClass () {
    return false;
  }
  doesInherit () {
    return false;
  }
  isAllocatedType () {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.eval_type != 0 ) {
        if ( this.nameNode.eval_type == 6 ) {
          return true;
        }
        if ( this.nameNode.eval_type == 7 ) {
          return true;
        }
        if ( (((((this.nameNode.eval_type == 13) || (this.nameNode.eval_type == 12)) || (this.nameNode.eval_type == 4)) || (this.nameNode.eval_type == 2)) || (this.nameNode.eval_type == 5)) || (this.nameNode.eval_type == 3) ) {
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
  moveRefTo (node, target, ctx) {
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
    const other_s = target.getStrength();
    const my_s = this.getStrength();
    let my_lifetime = this.getLifetime();
    const other_lifetime = target.getLifetime();
    let a_lives = false;
    let b_lives = false;
    const tmp_var = this.nameNode.hasFlag("temp");
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
        let lt = my_lifetime;
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
  originalStrength () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const firstEntry = this.ownerHistory[0];
      return firstEntry.strength;
    }
    return 1;
  }
  getLifetime () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const lastEntry = this.ownerHistory[(__len - 1)];
      return lastEntry.lifetime;
    }
    return 1;
  }
  getStrength () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const lastEntry = this.ownerHistory[(__len - 1)];
      return lastEntry.strength;
    }
    return 1;
  }
  debugRefChanges () {
    console.log(("variable " + this.name) + " ref history : ")
    for ( let i = 0; i < this.ownerHistory.length; i++) {
      var h = this.ownerHistory[i];
      console.log(((" => change to " + h.strength) + " by ") + h.changer.getCode())
    }
  }
  pointsToObject (ctx) {
    if ( typeof(this.nameNode) !== "undefined" ) {
      let is_primitive = false;
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
        let is_object = true;
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
        let is_object_1 = true;
        switch (this.nameNode.type_name ) { 
          case "string" : 
            is_object_1 = false;
            break;
          case "int" : 
            is_object_1 = false;
            break;
          case "boolean" : 
            is_object_1 = false;
            break;
          case "double" : 
            is_object_1 = false;
            break;
        }
        if ( ctx.isEnumDefined(this.nameNode.type_name) ) {
          return false;
        }
        return is_object_1;
      }
    }
    return false;
  }
  isObject () {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 9 ) {
        if ( false == this.nameNode.isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  }
  isArray () {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 6 ) {
        return true;
      }
    }
    return false;
  }
  isHash () {
    if ( typeof(this.nameNode) !== "undefined" ) {
      if ( this.nameNode.value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  isPrimitive () {
    if ( typeof(this.nameNode) !== "undefined" ) {
      return this.nameNode.isPrimitive();
    }
    return false;
  }
  getRefTypeName () {
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
  getVarTypeName () {
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
  getTypeName () {
    const s = this.nameNode.type_name;
    return s;
  }
}
class RangerAppFunctionDesc  extends RangerAppParamDesc {
  constructor() {
    super()
    this.name = "";
    this.ref_cnt = 0;
    this.params = [];
    this.is_method = false;     /** note: unused */
    this.is_static = false;
    this.refType = 0;
  }
  isClass () {
    return false;
  }
  isProperty () {
    return false;
  }
}
class RangerAppMethodVariants  {
  constructor() {
    this.name = "";     /** note: unused */
    this.variants = [];
  }
}
class RangerAppInterfaceImpl  {
  constructor() {
    this.name = "";     /** note: unused */
  }
}
class RangerAppClassDesc  extends RangerAppParamDesc {
  constructor() {
    super()
    this.name = "";
    this.is_system = false;
    this.compiledName = "";     /** note: unused */
    this.systemNames = {};
    this.is_interface = false;
    this.is_system_union = false;
    this.is_template = false;     /** note: unused */
    this.is_serialized = false;
    this.is_trait = false;
    this.variables = [];
    this.capturedLocals = [];
    this.methods = [];
    this.defined_methods = {};
    this.static_methods = [];
    this.defined_static_methods = {};
    this.defined_variants = [];
    this.method_variants = {};
    this.has_constructor = false;
    this.has_destructor = false;     /** note: unused */
    this.extends_classes = [];
    this.implements_interfaces = [];
    this.consumes_traits = [];
    this.is_union_of = [];
    this.contr_writers = [];     /** note: unused */
    this.is_inherited = false;
  }
  isClass () {
    return true;
  }
  isProperty () {
    return false;
  }
  doesInherit () {
    return this.is_inherited;
  }
  isSameOrParentClass (class_name, ctx) {
    if ( ctx.isPrimitiveType(class_name) ) {
      if ( (this.is_union_of.indexOf(class_name)) >= 0 ) {
        return true;
      }
      return false;
    }
    if ( class_name == this.name ) {
      return true;
    }
    if ( (this.extends_classes.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (this.consumes_traits.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (this.implements_interfaces.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (this.is_union_of.indexOf(class_name)) >= 0 ) {
      return true;
    }
    for ( let i = 0; i < this.extends_classes.length; i++) {
      var c_name = this.extends_classes[i];
      const c = ctx.findClass(c_name);
      if ( c.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( let i_1 = 0; i_1 < this.consumes_traits.length; i_1++) {
      var c_name_1 = this.consumes_traits[i_1];
      const c_1 = ctx.findClass(c_name_1);
      if ( c_1.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( let i_2 = 0; i_2 < this.implements_interfaces.length; i_2++) {
      var i_name = this.implements_interfaces[i_2];
      const c_2 = ctx.findClass(i_name);
      if ( c_2.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( let i_3 = 0; i_3 < this.is_union_of.length; i_3++) {
      var i_name_1 = this.is_union_of[i_3];
      if ( this.isSameOrParentClass(i_name_1, ctx) ) {
        return true;
      }
      if ( ctx.isDefinedClass(i_name_1) ) {
        const c_3 = ctx.findClass(i_name_1);
        if ( c_3.isSameOrParentClass(class_name, ctx) ) {
          return true;
        }
      } else {
        console.log("did not find union class " + i_name_1)
      }
    }
    return false;
  }
  hasOwnMethod (m_name) {
    if ( ( typeof(this.defined_methods[m_name] ) != "undefined" && this.defined_methods.hasOwnProperty(m_name) ) ) {
      return true;
    }
    return false;
  }
  hasMethod (m_name) {
    if ( ( typeof(this.defined_methods[m_name] ) != "undefined" && this.defined_methods.hasOwnProperty(m_name) ) ) {
      return true;
    }
    for ( let i = 0; i < this.extends_classes.length; i++) {
      var cname = this.extends_classes[i];
      const cDesc = this.ctx.findClass(cname);
      if ( cDesc.hasMethod(m_name) ) {
        return cDesc.hasMethod(m_name);
      }
    }
    return false;
  }
  findMethod (f_name) {
    let res;
    for ( let i = 0; i < this.methods.length; i++) {
      var m = this.methods[i];
      if ( m.name == f_name ) {
        res = m;
        return res;
      }
    }
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      if ( cDesc.hasMethod(f_name) ) {
        return cDesc.findMethod(f_name);
      }
    }
    return res;
  }
  hasStaticMethod (m_name) {
    return ( typeof(this.defined_static_methods[m_name] ) != "undefined" && this.defined_static_methods.hasOwnProperty(m_name) );
  }
  findStaticMethod (f_name) {
    let e;
    for ( let i = 0; i < this.static_methods.length; i++) {
      var m = this.static_methods[i];
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    }
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      if ( cDesc.hasStaticMethod(f_name) ) {
        return cDesc.findStaticMethod(f_name);
      }
    }
    return e;
  }
  findVariable (f_name) {
    let e;
    for ( let i = 0; i < this.variables.length; i++) {
      var m = this.variables[i];
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    }
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      return cDesc.findVariable(f_name);
    }
    return e;
  }
  addParentClass (p_name) {
    this.extends_classes.push(p_name);
  }
  addVariable (desc) {
    this.variables.push(desc);
  }
  addMethod (desc) {
    this.defined_methods[desc.name] = true
    this.methods.push(desc);
    const defVs = this.method_variants[desc.name];
    if ( typeof(defVs) === "undefined" ) {
      const new_v = new RangerAppMethodVariants();
      this.method_variants[desc.name] = new_v
      this.defined_variants.push(desc.name);
      new_v.variants.push(desc);
    } else {
      const new_v2 = defVs;
      new_v2.variants.push(desc);
    }
  }
  addStaticMethod (desc) {
    this.defined_static_methods[desc.name] = true
    this.static_methods.push(desc);
  }
}
class RangerTypeClass  {
  constructor() {
    this.name = "";     /** note: unused */
    this.compiledName = "";     /** note: unused */
    this.value_type = 0;     /** note: unused */
    this.is_primitive = false;     /** note: unused */
    this.is_mutable = false;     /** note: unused */
    this.is_optional = false;     /** note: unused */
    this.is_generic = false;     /** note: unused */
    this.is_lambda = false;     /** note: unused */
  }
}
class SourceCode  {
  constructor(code_str) {
    this.code = "";
    this.lines = [];
    this.filename = "";
    this.code = code_str;
    this.lines = code_str.split("\n");
  }
  getLineString (line_index) {
    if ( (this.lines.length) > line_index ) {
      return this.lines[line_index];
    }
    return "";
  }
  getLine (sp) {
    let cnt = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        return i;
      }
    }
    return -1;
  }
  getColumnStr (sp) {
    let cnt = 0;
    let last = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        let ll = sp - last;
        let ss = "";
        while (ll > 0) {
          ss = ss + " ";
          ll = ll - 1;
        }
        return ss;
      }
      last = cnt;
    }
    return "";
  }
  getColumn (sp) {
    let cnt = 0;
    let last = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        return sp - last;
      }
      last = cnt;
    }
    return -1;
  }
}
class CodeNode  {
  constructor(source, start, end) {
    this.sp = 0;
    this.ep = 0;
    this.has_operator = false;
    this.disabled_node = false;
    this.op_index = 0;
    this.is_system_class = false;
    this.mutable_def = false;
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.infix_operator = false;
    this.infix_subnode = false;
    this.has_lambda = false;
    this.has_lambda_call = false;
    this.operator_pred = 0;
    this.to_the_right = false;
    this.type_type = "";
    this.type_name = "";
    this.key_type = "";
    this.array_type = "";
    this.ns = [];
    this.has_vref_annotation = false;
    this.has_type_annotation = false;
    this.parsed_type = 0;
    this.value_type = 0;
    this.ref_type = 0;
    this.ref_need_assign = 0;     /** note: unused */
    this.double_value = 0;
    this.string_value = "";
    this.int_value = 0;
    this.boolean_value = false;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.nsp = [];
    this.eval_type = 0;
    this.eval_type_name = "";
    this.eval_key_type = "";
    this.eval_array_type = "";
    this.flow_done = false;
    this.ref_change_done = false;
    this.didReturnAtIndex = -1;
    this.hasVarDef = false;
    this.hasClassDescription = false;
    this.hasNewOper = false;
    this.hasFnCall = false;
    this.hasParamDesc = false;
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  getParsedString () {
    return this.code.code.substring(this.sp, this.ep );
  }
  getFilename () {
    return this.code.filename;
  }
  getFlag (flagName) {
    let res;
    if ( false == this.has_vref_annotation ) {
      return res;
    }
    for ( let i = 0; i < this.vref_annotation.children.length; i++) {
      var ch = this.vref_annotation.children[i];
      if ( ch.vref == flagName ) {
        res = ch;
        return res;
      }
    }
    return res;
  }
  hasFlag (flagName) {
    if ( false == this.has_vref_annotation ) {
      return false;
    }
    for ( let i = 0; i < this.vref_annotation.children.length; i++) {
      var ch = this.vref_annotation.children[i];
      if ( ch.vref == flagName ) {
        return true;
      }
    }
    return false;
  }
  setFlag (flagName) {
    if ( false == this.has_vref_annotation ) {
      this.vref_annotation = new CodeNode(this.code, this.sp, this.ep);
    }
    if ( this.hasFlag(flagName) ) {
      return;
    }
    const flag = new CodeNode(this.code, this.sp, this.ep);
    flag.vref = flagName;
    flag.value_type = 9;
    this.vref_annotation.children.push(flag);
    this.has_vref_annotation = true;
  }
  getTypeInformationString () {
    let s = "";
    if ( (this.vref.length) > 0 ) {
      s = ((s + "<vref:") + this.vref) + ">";
    } else {
      s = s + "<no.vref>";
    }
    if ( (this.type_name.length) > 0 ) {
      s = ((s + "<type_name:") + this.type_name) + ">";
    } else {
      s = s + "<no.type_name>";
    }
    if ( (this.array_type.length) > 0 ) {
      s = ((s + "<array_type:") + this.array_type) + ">";
    } else {
      s = s + "<no.array_type>";
    }
    if ( (this.key_type.length) > 0 ) {
      s = ((s + "<key_type:") + this.key_type) + ">";
    } else {
      s = s + "<no.key_type>";
    }
    switch (this.value_type ) { 
      case 5 : 
        s = s + "<value_type=Boolean>";
        break;
      case 4 : 
        s = s + "<value_type=String>";
        break;
    }
    return s;
  }
  getLine () {
    return this.code.getLine(this.sp);
  }
  getLineString (line_index) {
    return this.code.getLineString(line_index);
  }
  getColStartString () {
    return this.code.getColumnStr(this.sp);
  }
  getLineAsString () {
    const idx = this.getLine();
    const line_name_idx = idx + 1;
    return (((this.getFilename() + ", line ") + line_name_idx) + " : ") + this.code.getLineString(idx);
  }
  getPositionalString () {
    if ( (this.ep > this.sp) && ((this.ep - this.sp) < 50) ) {
      let start = this.sp;
      let end = this.ep;
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
  isParsedAsPrimitive () {
    if ( (((((this.parsed_type == 2) || (this.parsed_type == 4)) || (this.parsed_type == 3)) || (this.parsed_type == 12)) || (this.parsed_type == 13)) || (this.parsed_type == 5) ) {
      return true;
    }
    return false;
  }
  isPrimitive () {
    if ( (((((this.value_type == 2) || (this.value_type == 4)) || (this.value_type == 3)) || (this.value_type == 12)) || (this.value_type == 13)) || (this.value_type == 5) ) {
      return true;
    }
    return false;
  }
  isPrimitiveType () {
    const tn = this.type_name;
    if ( (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") ) {
      return true;
    }
    return false;
  }
  isAPrimitiveType () {
    let tn = this.type_name;
    if ( (this.value_type == 6) || (this.value_type == 7) ) {
      tn = this.array_type;
    }
    if ( (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") ) {
      return true;
    }
    return false;
  }
  getFirst () {
    return this.children[0];
  }
  getSecond () {
    return this.children[1];
  }
  getThird () {
    return this.children[2];
  }
  isSecondExpr () {
    if ( (this.children.length) > 1 ) {
      const second = this.children[1];
      if ( second.expression ) {
        return true;
      }
    }
    return false;
  }
  getOperator () {
    const s = "";
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.value_type == 9 ) {
        return fc.vref;
      }
    }
    return s;
  }
  getVRefAt (idx) {
    const s = "";
    if ( (this.children.length) > idx ) {
      const fc = this.children[idx];
      return fc.vref;
    }
    return s;
  }
  getStringAt (idx) {
    const s = "";
    if ( (this.children.length) > idx ) {
      const fc = this.children[idx];
      if ( fc.value_type == 4 ) {
        return fc.string_value;
      }
    }
    return s;
  }
  hasExpressionProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      return ann.expression;
    }
    return false;
  }
  getExpressionProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      return ann;
    }
    return ann;
  }
  hasIntProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      const fc = ann.children[0];
      if ( fc.value_type == 3 ) {
        return true;
      }
    }
    return false;
  }
  getIntProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      const fc = ann.children[0];
      if ( fc.value_type == 3 ) {
        return fc.int_value;
      }
    }
    return 0;
  }
  hasDoubleProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 2 ) {
        return true;
      }
    }
    return false;
  }
  getDoubleProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 2 ) {
        return ann.double_value;
      }
    }
    return 0;
  }
  hasStringProperty (name) {
    if ( false == (( typeof(this.props[name] ) != "undefined" && this.props.hasOwnProperty(name) )) ) {
      return false;
    }
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 4 ) {
        return true;
      }
    }
    return false;
  }
  getStringProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 4 ) {
        return ann.string_value;
      }
    }
    return "";
  }
  hasBooleanProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 5 ) {
        return true;
      }
    }
    return false;
  }
  getBooleanProperty (name) {
    const ann = this.props[name];
    if ( typeof(ann) !== "undefined" ) {
      if ( ann.value_type == 5 ) {
        return ann.boolean_value;
      }
    }
    return false;
  }
  isFirstTypeVref (vrefName) {
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.value_type == 9 ) {
        return true;
      }
    }
    return false;
  }
  isFirstVref (vrefName) {
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.vref == vrefName ) {
        return true;
      }
    }
    return false;
  }
  getString () {
    return this.code.code.substring(this.sp, this.ep );
  }
  walk () {
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
    for ( let i = 0; i < this.children.length; i++) {
      var item = this.children[i];
      item.walk();
    }
    if ( this.expression ) {
      console.log(")")
    }
  }
  writeCode (wr) {
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
      case 9 : 
        wr.out(this.vref, false);
        break;
      case 7 : 
        wr.out(this.vref, false);
        wr.out((((":[" + this.key_type) + ":") + this.array_type) + "]", false);
        break;
      case 6 : 
        wr.out(this.vref, false);
        wr.out((":[" + this.array_type) + "]", false);
        break;
    }
    if ( this.expression ) {
      wr.out("(", false);
      for ( let i = 0; i < this.children.length; i++) {
        var ch = this.children[i];
        ch.writeCode(wr);
      }
      wr.out(")", false);
    }
  }
  getCode () {
    const wr = new CodeWriter();
    this.writeCode(wr);
    return wr.getCode();
  }
  rebuildWithType (match, changeVref) {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
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
      const ann = this.vref_annotation;
      newNode.vref_annotation = ann.rebuildWithType(match, true);
    }
    if ( this.has_type_annotation ) {
      newNode.has_type_annotation = true;
      const t_ann = this.type_annotation;
      newNode.type_annotation = t_ann.rebuildWithType(match, true);
    }
    for ( let i = 0; i < this.ns.length; i++) {
      var n = this.ns[i];
      if ( changeVref ) {
        const new_ns = match.getTypeName(n);
        newNode.ns.push(new_ns);
      } else {
        newNode.vref = this.vref;
        newNode.ns.push(n);
      }
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
    for ( let i_1 = 0; i_1 < this.prop_keys.length; i_1++) {
      var key = this.prop_keys[i_1];
      newNode.prop_keys.push(key);
      const oldp = this.props[key];
      const np = oldp.rebuildWithType(match, changeVref);
      newNode.props[key] = np
    }
    for ( let i_2 = 0; i_2 < this.children.length; i_2++) {
      var ch = this.children[i_2];
      const newCh = ch.rebuildWithType(match, changeVref);
      newCh.parent = newNode;
      newNode.children.push(newCh);
    }
    return newNode;
  }
  buildTypeSignatureUsingMatch (match) {
    const tName = match.getTypeName(this.type_name);
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
    let s = "";
    if ( this.value_type == 6 ) {
      s = s + "[";
      s = s + match.getTypeName(this.array_type);
      s = s + this.getTypeSignatureWithMatch(match);
      s = s + "]";
      return s;
    }
    if ( this.value_type == 7 ) {
      s = s + "[";
      s = s + match.getTypeName(this.key_type);
      s = s + ":";
      s = s + match.getTypeName(this.array_type);
      s = s + this.getTypeSignatureWithMatch(match);
      s = s + "]";
      return s;
    }
    s = match.getTypeName(this.type_name);
    s = s + this.getVRefSignatureWithMatch(match);
    return s;
  }
  buildTypeSignature () {
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
    let s = "";
    if ( this.value_type == 6 ) {
      s = s + "[";
      s = s + this.array_type;
      s = s + this.getTypeSignature();
      s = s + "]";
      return s;
    }
    if ( this.value_type == 7 ) {
      s = s + "[";
      s = s + this.key_type;
      s = s + ":";
      s = s + this.array_type;
      s = s + this.getTypeSignature();
      s = s + "]";
      return s;
    }
    s = this.type_name;
    return s;
  }
  getVRefSignatureWithMatch (match) {
    if ( this.has_vref_annotation ) {
      const nn = this.vref_annotation.rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  }
  getVRefSignature () {
    if ( this.has_vref_annotation ) {
      return "@" + this.vref_annotation.getCode();
    }
    return "";
  }
  getTypeSignatureWithMatch (match) {
    if ( this.has_type_annotation ) {
      const nn = this.type_annotation.rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  }
  getTypeSignature () {
    if ( this.has_type_annotation ) {
      return "@" + this.type_annotation.getCode();
    }
    return "";
  }
  typeNameAsType (ctx) {
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
  copyEvalResFrom (node) {
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
    if ( node.value_type == 15 ) {
      this.eval_type = 15;
      this.eval_function = node.eval_function;
    }
  }
  defineNodeTypeTo (node, ctx) {
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
  ifNoTypeSetToVoid () {
    if ( (((this.type_name.length) == 0) && ((this.key_type.length) == 0)) && ((this.array_type.length) == 0) ) {
      this.type_name = "void";
    }
  }
  ifNoTypeSetToEvalTypeOf (node) {
    if ( (((this.type_name.length) == 0) && ((this.key_type.length) == 0)) && ((this.array_type.length) == 0) ) {
      this.type_name = node.eval_type_name;
      this.array_type = node.eval_array_type;
      this.key_type = node.eval_key_type;
      this.value_type = node.eval_type;
      this.eval_type = node.eval_type;
      this.eval_type_name = node.eval_type_name;
      this.eval_array_type = node.eval_array_type;
      this.eval_key_type = node.eval_key_type;
      if ( node.value_type == 15 ) {
        if ( typeof(this.expression_value) === "undefined" ) {
          const copyOf = node.rebuildWithType(new RangerArgMatch(), false);
          copyOf.children.pop();
          this.expression_value = copyOf;
        }
      }
      return true;
    }
    return false;
  }
}
class RangerNodeValue  {
  constructor() {
  }
}
class RangerBackReference  {
  constructor() {
  }
}
class RangerAppEnum  {
  constructor() {
    this.name = "";     /** note: unused */
    this.cnt = 0;
    this.values = {};
  }
  add (n) {
    this.values[n] = this.cnt
    this.cnt = this.cnt + 1;
  }
}
class OpFindResult  {
  constructor() {
    this.did_find = false;     /** note: unused */
  }
}
class RangerAppWriterContext  {
  constructor() {
    this.intRootCounter = 1;     /** note: unused */
    this.targetLangName = "";
    this.defined_imports = [];     /** note: unused */
    this.already_imported = {};
    this.is_function = false;
    this.class_level_context = false;
    this.function_level_context = false;
    this.in_main = false;
    this.is_block = false;     /** note: unused */
    this.is_capturing = false;
    this.captured_variables = [];
    this.has_block_exited = false;     /** note: unused */
    this.in_expression = false;     /** note: unused */
    this.expr_stack = [];
    this.expr_restart = false;
    this.in_method = false;     /** note: unused */
    this.method_stack = [];
    this.typeNames = [];     /** note: unused */
    this.typeClasses = {};     /** note: unused */
    this.in_class = false;
    this.in_static_method = false;
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
    this.refTransform = {};
    this.rootFile = "--not-defined--";
  }
  isCapturing () {
    if ( this.is_capturing ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isCapturing();
    }
    return false;
  }
  isLocalToCapture (name) {
    if ( ( typeof(this.localVariables[name] ) != "undefined" && this.localVariables.hasOwnProperty(name) ) ) {
      return true;
    }
    if ( this.is_capturing ) {
      return false;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isLocalToCapture(name);
    }
    return false;
  }
  addCapturedVariable (name) {
    if ( this.is_capturing ) {
      if ( (this.captured_variables.indexOf(name)) < 0 ) {
        this.captured_variables.push(name);
      }
      return;
    }
    if ( typeof(this.parent) != "undefined" ) {
      this.parent.addCapturedVariable(name);
    }
  }
  getCapturedVariables () {
    if ( this.is_capturing ) {
      return this.captured_variables;
    }
    if ( typeof(this.parent) != "undefined" ) {
      const r = this.parent.getCapturedVariables();
      return r;
    }
    let res = [];
    return res;
  }
  transformWord (input_word) {
    const root = this.getRoot();
    root.initReservedWords();
    if ( ( typeof(this.refTransform[input_word] ) != "undefined" && this.refTransform.hasOwnProperty(input_word) ) ) {
      return (this.refTransform[input_word]);
    }
    return input_word;
  }
  initReservedWords () {
    if ( typeof(this.reservedWords) !== "undefined" ) {
      return true;
    }
    const main = this.langOperators;
    let lang;
    for ( let i = 0; i < main.children.length; i++) {
      var m = main.children[i];
      const fc = m.getFirst();
      if ( fc.vref == "language" ) {
        lang = m;
      }
    }
    /** unused:  let cmds   **/ 
    const langNodes = lang.children[1];
    for ( let i_1 = 0; i_1 < langNodes.children.length; i_1++) {
      var lch = langNodes.children[i_1];
      const fc_1 = lch.getFirst();
      if ( fc_1.vref == "reserved_words" ) {
        /** unused:  const n = lch.getSecond()   **/ 
        this.reservedWords = lch.getSecond();
        for ( let i_2 = 0; i_2 < this.reservedWords.children.length; i_2++) {
          var ch = this.reservedWords.children[i_2];
          const word = ch.getFirst();
          const transform = ch.getSecond();
          this.refTransform[word.vref] = transform.vref
        }
      }
    }
    return true;
  }
  initStdCommands () {
    if ( typeof(this.stdCommands) !== "undefined" ) {
      return true;
    }
    if ( typeof(this.langOperators) === "undefined" ) {
      return true;
    }
    const main = this.langOperators;
    let lang;
    for ( let i = 0; i < main.children.length; i++) {
      var m = main.children[i];
      const fc = m.getFirst();
      if ( fc.vref == "language" ) {
        lang = m;
      }
    }
    /** unused:  let cmds   **/ 
    const langNodes = lang.children[1];
    for ( let i_1 = 0; i_1 < langNodes.children.length; i_1++) {
      var lch = langNodes.children[i_1];
      const fc_1 = lch.getFirst();
      if ( fc_1.vref == "commands" ) {
        /** unused:  const n = lch.getSecond()   **/ 
        this.stdCommands = lch.getSecond();
      }
    }
    return true;
  }
  transformTypeName (typeName) {
    if ( this.isPrimitiveType(typeName) ) {
      return typeName;
    }
    if ( this.isEnumDefined(typeName) ) {
      return typeName;
    }
    if ( this.isDefinedClass(typeName) ) {
      const cl = this.findClass(typeName);
      if ( cl.is_system ) {
        return (cl.systemNames[this.getTargetLang()]);
      }
    }
    return typeName;
  }
  isPrimitiveType (typeName) {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    return false;
  }
  isDefinedType (typeName) {
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
  hadValidType (node) {
    if ( node.isPrimitiveType() || node.isPrimitive() ) {
      return true;
    }
    if ( node.value_type == 6 ) {
      if ( this.isDefinedType(node.array_type) ) {
        return true;
      } else {
        this.addError(node, "Unknown type for array values: " + node.array_type);
        return false;
      }
    }
    if ( node.value_type == 7 ) {
      if ( this.isDefinedType(node.array_type) && this.isPrimitiveType(node.key_type) ) {
        return true;
      } else {
        if ( this.isDefinedType(node.array_type) == false ) {
          this.addError(node, "Unknown type for map values: " + node.array_type);
        }
        if ( this.isDefinedType(node.array_type) == false ) {
          this.addError(node, "Unknown type for map keys: " + node.key_type);
        }
        return false;
      }
    }
    if ( this.isDefinedType(node.type_name) ) {
      return true;
    } else {
      if ( node.value_type == 15 ) {
      } else {
        this.addError(node, (("Unknown type: " + node.type_name) + " type ID : ") + node.value_type);
      }
    }
    return false;
  }
  getTargetLang () {
    if ( (this.targetLangName.length) > 0 ) {
      return this.targetLangName;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.getTargetLang();
    }
    return "ranger";
  }
  findOperator (node) {
    const root = this.getRoot();
    root.initStdCommands();
    return root.stdCommands.children[node.op_index];
  }
  getStdCommands () {
    const root = this.getRoot();
    root.initStdCommands();
    return root.stdCommands;
  }
  findClassWithSign (node) {
    const root = this.getRoot();
    const tplArgs = node.vref_annotation;
    const sign = node.vref + tplArgs.getCode();
    const theName = root.classSignatures[sign];
    return this.findClass((theName));
  }
  createSignature (origClass, classSig) {
    if ( ( typeof(this.classSignatures[classSig] ) != "undefined" && this.classSignatures.hasOwnProperty(classSig) ) ) {
      return (this.classSignatures[classSig]);
    }
    let ii = 1;
    let sigName = (origClass + "V") + ii;
    while (( typeof(this.classToSignature[sigName] ) != "undefined" && this.classToSignature.hasOwnProperty(sigName) )) {
      ii = ii + 1;
      sigName = (origClass + "V") + ii;
    }
    this.classToSignature[sigName] = classSig
    this.classSignatures[classSig] = sigName
    return sigName;
  }
  createOperator (fromNode) {
    const root = this.getRoot();
    if ( root.initStdCommands() ) {
      root.stdCommands.children.push(fromNode);
      /** unused:  const fc = fromNode.children[0]   **/ 
    }
  }
  getFileWriter (path, fileName) {
    const root = this.getRoot();
    const fs = root.fileSystem;
    const file = fs.getFile(path, fileName);
    let wr;
    wr = file.getWriter();
    return wr;
  }
  addTodo (node, descr) {
    const e = new RangerAppTodo();
    e.description = descr;
    e.todonode = node;
    const root = this.getRoot();
    root.todoList.push(e);
  }
  setThisName (the_name) {
    const root = this.getRoot();
    root.thisName = the_name;
  }
  getThisName () {
    const root = this.getRoot();
    return root.thisName;
  }
  printLogs (logName) {
  }
  log (node, logName, descr) {
  }
  addMessage (node, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = node;
    const root = this.getRoot();
    root.compilerMessages.push(e);
  }
  addError (targetnode, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = targetnode;
    const root = this.getRoot();
    root.compilerErrors.push(e);
  }
  addParserError (targetnode, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = targetnode;
    const root = this.getRoot();
    root.parserErrors.push(e);
  }
  addTemplateClass (name, node) {
    const root = this.getRoot();
    root.templateClassList.push(name);
    root.templateClassNodes[name] = node
  }
  hasTemplateNode (name) {
    const root = this.getRoot();
    return ( typeof(root.templateClassNodes[name] ) != "undefined" && root.templateClassNodes.hasOwnProperty(name) );
  }
  findTemplateNode (name) {
    const root = this.getRoot();
    return (root.templateClassNodes[name]);
  }
  setStaticWriter (className, writer) {
    const root = this.getRoot();
    root.classStaticWriters[className] = writer
  }
  getStaticWriter (className) {
    const root = this.getRoot();
    return (root.classStaticWriters[className]);
  }
  isEnumDefined (n) {
    if ( ( typeof(this.definedEnums[n] ) != "undefined" && this.definedEnums.hasOwnProperty(n) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isEnumDefined(n);
  }
  getEnum (n) {
    if ( ( typeof(this.definedEnums[n] ) != "undefined" && this.definedEnums.hasOwnProperty(n) ) ) {
      return this.definedEnums[n];
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getEnum(n);
    }
    let none;
    return none;
  }
  isVarDefined (name) {
    if ( ( typeof(this.localVariables[name] ) != "undefined" && this.localVariables.hasOwnProperty(name) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isVarDefined(name);
  }
  setCompilerFlag (name, value) {
    this.compilerFlags[name] = value
  }
  hasCompilerFlag (s_name) {
    if ( ( typeof(this.compilerFlags[s_name] ) != "undefined" && this.compilerFlags.hasOwnProperty(s_name) ) ) {
      return (this.compilerFlags[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerFlag(s_name);
  }
  getCompilerSetting (s_name) {
    if ( ( typeof(this.compilerSettings[s_name] ) != "undefined" && this.compilerSettings.hasOwnProperty(s_name) ) ) {
      return (this.compilerSettings[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return "";
    }
    return this.parent.getCompilerSetting(s_name);
  }
  hasCompilerSetting (s_name) {
    if ( ( typeof(this.compilerSettings[s_name] ) != "undefined" && this.compilerSettings.hasOwnProperty(s_name) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerSetting(s_name);
  }
  getVariableDef (name) {
    if ( ( typeof(this.localVariables[name] ) != "undefined" && this.localVariables.hasOwnProperty(name) ) ) {
      return (this.localVariables[name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      const tmp = new RangerAppParamDesc();
      return tmp;
    }
    return this.parent.getVariableDef(name);
  }
  findFunctionCtx () {
    if ( this.is_function ) {
      return this;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.findFunctionCtx();
  }
  getFnVarCnt (name) {
    const fnCtx = this.findFunctionCtx();
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      ii = 1 + ii;
    } else {
      fnCtx.defCounts[name] = ii
      return 0;
    }
    let scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    }
    fnCtx.defCounts[name] = ii
    return ii;
  }
  debugVars () {
    console.log("--- context vars ---")
    for ( let i = 0; i < this.localVarNames.length; i++) {
      var na = this.localVarNames[i];
      console.log("var => " + na)
    }
    if ( typeof(this.parent) !== "undefined" ) {
      this.parent.debugVars();
    }
  }
  getVarTotalCnt (name) {
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
    }
    if ( typeof(fnCtx.parent) !== "undefined" ) {
      ii = ii + fnCtx.parent.getVarTotalCnt(name);
    }
    if ( this.isVarDefined(name) ) {
      ii = ii + 1;
    }
    return ii;
  }
  getFnVarCnt2 (name) {
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      ii = 1 + ii;
      fnCtx.defCounts[name] = ii
    } else {
      fnCtx.defCounts[name] = 1
    }
    if ( typeof(fnCtx.parent) !== "undefined" ) {
      ii = ii + fnCtx.parent.getFnVarCnt2(name);
    }
    const scope_has = this.isVarDefined(name);
    if ( scope_has ) {
      ii = 1 + ii;
    }
    let scope_has_2 = this.isVarDefined(((name + "_") + ii));
    while (scope_has_2) {
      ii = 1 + ii;
      scope_has_2 = this.isVarDefined(((name + "_") + ii));
    }
    return ii;
  }
  getFnVarCnt3 (name) {
    const classLevel = this.findMethodLevelContext();
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      fnCtx.defCounts[name] = ii + 1
    } else {
      fnCtx.defCounts[name] = 1
    }
    if ( classLevel.isVarDefined(name) ) {
      ii = ii + 1;
    }
    let scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    }
    return ii;
  }
  isMemberVariable (name) {
    if ( this.isVarDefined(name) ) {
      const vDef = this.getVariableDef(name);
      if ( vDef.varType == 8 ) {
        return true;
      }
    }
    return false;
  }
  defineVariable (name, desc) {
    let cnt = 0;
    const fnLevel = this.findMethodLevelContext();
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt = fnLevel.getFnVarCnt3(name);
    }
    if ( 0 == cnt ) {
      if ( name == "len" ) {
        desc.compiledName = "__len";
      } else {
        desc.compiledName = name;
      }
    } else {
      desc.compiledName = (name + "_") + cnt;
    }
    this.localVariables[name] = desc
    this.localVarNames.push(name);
  }
  isDefinedClass (name) {
    if ( ( typeof(this.definedClasses[name] ) != "undefined" && this.definedClasses.hasOwnProperty(name) ) ) {
      return true;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.isDefinedClass(name);
      }
    }
    return false;
  }
  getRoot () {
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.getRoot();
  }
  getClasses () {
    let list = [];
    for ( let i = 0; i < this.definedClassList.length; i++) {
      var n = this.definedClassList[i];
      list.push((this.definedClasses[n]));
    }
    return list;
  }
  addClass (name, desc) {
    const root = this.getRoot();
    if ( ( typeof(root.definedClasses[name] ) != "undefined" && root.definedClasses.hasOwnProperty(name) ) ) {
    } else {
      root.definedClasses[name] = desc
      root.definedClassList.push(name);
    }
  }
  findClass (name) {
    const root = this.getRoot();
    return (root.definedClasses[name]);
  }
  hasClass (name) {
    const root = this.getRoot();
    return ( typeof(root.definedClasses[name] ) != "undefined" && root.definedClasses.hasOwnProperty(name) );
  }
  getCurrentMethod () {
    if ( typeof(this.currentMethod) !== "undefined" ) {
      return this.currentMethod;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getCurrentMethod();
    }
    return new RangerAppFunctionDesc();
  }
  setCurrentClass (cc) {
    this.in_class = true;
    this.currentClass = cc;
  }
  disableCurrentClass () {
    if ( this.in_class ) {
      this.in_class = false;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      this.parent.disableCurrentClass();
    }
  }
  hasCurrentClass () {
    if ( this.in_class && (typeof(this.currentClass) !== "undefined") ) {
      return true;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.hasCurrentClass();
    }
    return false;
  }
  getCurrentClass () {
    if ( this.in_class && (typeof(this.currentClass) !== "undefined") ) {
      return this.currentClass;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.getCurrentClass();
    }
    let non;
    return non;
  }
  restartExpressionLevel () {
    this.expr_restart = true;
  }
  isInExpression () {
    if ( (this.expr_stack.length) > 0 ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined") && (this.expr_restart == false) ) {
      return this.parent.isInExpression();
    }
    return false;
  }
  expressionLevel () {
    const level = this.expr_stack.length;
    if ( (typeof(this.parent) !== "undefined") && (this.expr_restart == false) ) {
      return level + this.parent.expressionLevel();
    }
    return level;
  }
  setInExpr () {
    this.expr_stack.push(true);
  }
  unsetInExpr () {
    this.expr_stack.pop();
  }
  getErrorCount () {
    let cnt = this.compilerErrors.length;
    if ( typeof(this.parent) != "undefined" ) {
      cnt = cnt + this.parent.getErrorCount();
    }
    return cnt;
  }
  isInStatic () {
    if ( this.in_static_method ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isInStatic();
    }
    return false;
  }
  isInMain () {
    if ( this.in_main ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isInMain();
    }
    return false;
  }
  isInMethod () {
    if ( (this.method_stack.length) > 0 ) {
      return true;
    }
    if ( typeof(this.parent) !== "undefined" ) {
      return this.parent.isInMethod();
    }
    return false;
  }
  setInMethod () {
    this.method_stack.push(true);
  }
  unsetInMethod () {
    this.method_stack.pop();
  }
  findMethodLevelContext () {
    let res;
    if ( this.function_level_context ) {
      res = this;
      return res;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.findMethodLevelContext();
    }
    res = this;
    return res;
  }
  findClassLevelContext () {
    let res;
    if ( this.class_level_context ) {
      res = this;
      return res;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.findClassLevelContext();
    }
    res = this;
    return res;
  }
  fork () {
    const new_ctx = new RangerAppWriterContext();
    new_ctx.parent = this;
    return new_ctx;
  }
  getRootFile () {
    const root = this.getRoot();
    return root.rootFile;
  }
  setRootFile (file_name) {
    const root = this.getRoot();
    root.rootFile = file_name;
  }
}
class CodeFile  {
  constructor(filePath, fileName) {
    this.path_name = "";
    this.name = "";
    this.import_list = {};
    this.import_names = [];
    this.name = fileName;
    this.path_name = filePath;
    this.writer = new CodeWriter();
    this.writer.createTag("imports");
  }
  addImport (import_name) {
    if ( false == (( typeof(this.import_list[import_name] ) != "undefined" && this.import_list.hasOwnProperty(import_name) )) ) {
      this.import_list[import_name] = import_name
      this.import_names.push(import_name);
    }
  }
  testCreateWriter () {
    return new CodeWriter();
  }
  getImports () {
    return this.import_names;
  }
  getWriter () {
    this.writer.ownerFile = this;
    return this.writer;
  }
  getCode () {
    return this.writer.getCode();
  }
}
class CodeFileSystem  {
  constructor() {
    this.files = [];
  }
  getFile (path, name) {
    for ( let idx = 0; idx < this.files.length; idx++) {
      var file = this.files[idx];
      if ( (file.path_name == path) && (file.name == name) ) {
        return file;
      }
    }
    const new_file = new CodeFile(path, name);
    new_file.fileSystem = this;
    this.files.push(new_file);
    return new_file;
  }
  mkdir (path) {
    const parts = path.split("/");
    let curr_path = "";
    for ( let i = 0; i < parts.length; i++) {
      var p = parts[i];
      curr_path = (curr_path + "/") + p;
      if ( false == (require("fs").existsSync(process.cwd() + "/" + curr_path + "/" )) ) {
        require("fs").mkdirSync(process.cwd() + "/" + curr_path)
      }
    }
  }
  saveTo (path) {
    for ( let idx = 0; idx < this.files.length; idx++) {
      var file = this.files[idx];
      const file_path = (path + "/") + file.path_name;
      this.mkdir(file_path);
      console.log((("Writing to file " + file_path) + "/") + file.name)
      const file_content = file.getCode();
      if ( (file_content.length) > 0 ) {
        require("fs").writeFileSync(process.cwd() + "/" + file_path + "/"  + file.name, file_content)
      }
    }
  }
}
class CodeSlice  {
  constructor() {
    this.code = "";
  }
  getCode () {
    if ( typeof(this.writer) === "undefined" ) {
      return this.code;
    }
    return this.writer.getCode();
  }
}
class CodeWriter  {
  constructor() {
    this.tagName = "";     /** note: unused */
    this.codeStr = "";     /** note: unused */
    this.currentLine = "";
    this.tabStr = "  ";
    this.lineNumber = 1;     /** note: unused */
    this.indentAmount = 0;
    this.compiledTags = {};
    this.tags = {};
    this.slices = [];
    this.forks = [];     /** note: unused */
    this.tagOffset = 0;     /** note: unused */
    this.had_nl = true;     /** note: unused */
    const new_slice = new CodeSlice();
    this.slices.push(new_slice);
    this.current_slice = new_slice;
  }
  getFileWriter (path, fileName) {
    const fs = this.ownerFile.fileSystem;
    const file = fs.getFile(path, fileName);
    const wr = file.getWriter();
    return wr;
  }
  getImports () {
    let p = this;
    while ((typeof(p.ownerFile) === "undefined") && (typeof(p.parent) !== "undefined")) {
      p = p.parent;
    }
    if ( typeof(p.ownerFile) !== "undefined" ) {
      const f = p.ownerFile;
      return f.import_names;
    }
    let nothing = [];
    return nothing;
  }
  addImport (name) {
    if ( typeof(this.ownerFile) !== "undefined" ) {
      this.ownerFile.addImport(name);
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        this.parent.addImport(name);
      }
    }
  }
  indent (delta) {
    this.indentAmount = this.indentAmount + delta;
    if ( this.indentAmount < 0 ) {
      this.indentAmount = 0;
    }
  }
  addIndent () {
    let i = 0;
    if ( 0 == (this.currentLine.length) ) {
      while (i < this.indentAmount) {
        this.currentLine = this.currentLine + this.tabStr;
        i = i + 1;
      }
    }
  }
  createTag (name) {
    const new_writer = new CodeWriter();
    const new_slice = new CodeSlice();
    this.tags[name] = this.slices.length
    this.slices.push(new_slice);
    new_slice.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    const new_active_slice = new CodeSlice();
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    new_writer.parent = this;
    return new_writer;
  }
  getTag (name) {
    if ( ( typeof(this.tags[name] ) != "undefined" && this.tags.hasOwnProperty(name) ) ) {
      const idx = (this.tags[name]);
      const slice = this.slices[idx];
      return slice.writer;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.getTag(name);
      }
    }
    return this;
  }
  hasTag (name) {
    if ( ( typeof(this.tags[name] ) != "undefined" && this.tags.hasOwnProperty(name) ) ) {
      return true;
    } else {
      if ( typeof(this.parent) !== "undefined" ) {
        return this.parent.hasTag(name);
      }
    }
    return false;
  }
  fork () {
    const new_writer = new CodeWriter();
    const new_slice = new CodeSlice();
    this.slices.push(new_slice);
    new_slice.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    new_writer.parent = this;
    const new_active_slice = new CodeSlice();
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    return new_writer;
  }
  newline () {
    if ( (this.currentLine.length) > 0 ) {
      this.out("", true);
    }
  }
  writeSlice (str, newLine) {
    this.addIndent();
    this.currentLine = this.currentLine + str;
    if ( newLine ) {
      this.current_slice.code = (this.current_slice.code + this.currentLine) + "\n";
      this.currentLine = "";
    }
  }
  out (str, newLine) {
    const lines = str.split("\n");
    const rowCnt = lines.length;
    if ( rowCnt == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( let idx = 0; idx < lines.length; idx++) {
        var row = lines[idx];
        this.addIndent();
        if ( idx < (rowCnt - 1) ) {
          this.writeSlice(row.trim(), true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  raw (str, newLine) {
    const lines = str.split("\n");
    const rowCnt = lines.length;
    if ( rowCnt == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( let idx = 0; idx < lines.length; idx++) {
        var row = lines[idx];
        this.addIndent();
        if ( idx < (rowCnt - 1) ) {
          this.writeSlice(row, true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  getCode () {
    let res = "";
    for ( let idx = 0; idx < this.slices.length; idx++) {
      var slice = this.slices[idx];
      res = res + slice.getCode();
    }
    res = res + this.currentLine;
    return res;
  }
}
class RangerLispParser  {
  constructor(code_module) {
    this.__len = 0;
    this.i = 0;
    this.parents = [];
    this.paren_cnt = 0;
    this.get_op_pred = 0;     /** note: unused */
    this.had_error = false;
    this.buff = code_module.code;
    this.code = code_module;
    this.__len = (this.buff).length;
    this.rootNode = new CodeNode(this.code, 0, 0);
    this.rootNode.is_block_node = true;
    this.rootNode.expression = true;
    this.curr_node = this.rootNode;
    this.parents.push(this.curr_node);
    this.paren_cnt = 1;
  }
  joo (cm) {
    /** unused:  const ll = cm.code.length   **/ 
  }
  parse_raw_annotation () {
    let sp = this.i;
    let ep = this.i;
    this.i = this.i + 1;
    sp = this.i;
    ep = this.i;
    if ( this.i < this.__len ) {
      const a_node2 = new CodeNode(this.code, sp, ep);
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
  skip_space (is_block_parent) {
    const s = this.buff;
    let did_break = false;
    if ( this.i >= this.__len ) {
      return true;
    }
    let c = s.charCodeAt(this.i );
    /** unused:  const bb = c == (46)   **/ 
    while ((this.i < this.__len) && (c <= 32)) {
      if ( is_block_parent && ((c == 10) || (c == 13)) ) {
        this.end_expression();
        did_break = true;
        break;
      }
      this.i = 1 + this.i;
      if ( this.i >= this.__len ) {
        return true;
      }
      c = s.charCodeAt(this.i );
    }
    return did_break;
  }
  end_expression () {
    this.i = 1 + this.i;
    if ( this.i >= this.__len ) {
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
  getOperator () {
    const s = this.buff;
    if ( (this.i + 2) >= this.__len ) {
      return 0;
    }
    const c = s.charCodeAt(this.i );
    const c2 = s.charCodeAt((this.i + 1) );
    switch (c ) { 
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
  isOperator () {
    const s = this.buff;
    if ( (this.i - 2) > this.__len ) {
      return 0;
    }
    const c = s.charCodeAt(this.i );
    const c2 = s.charCodeAt((this.i + 1) );
    switch (c ) { 
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
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 62 : 
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 33 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 0;
        break;
      case 61 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 3;
        break;
      case 38 : 
        if ( c2 == (38) ) {
          return 6;
        }
        return 0;
        break;
      case 124 : 
        if ( c2 == (124) ) {
          return 5;
        }
        return 0;
        break;
      default: 
        break;
    }
    return 0;
  }
  getOperatorPred (str) {
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
  insert_node (p_node) {
    let push_target = this.curr_node;
    if ( this.curr_node.infix_operator ) {
      push_target = this.curr_node.infix_node;
      if ( push_target.to_the_right ) {
        push_target = push_target.right_node;
        p_node.parent = push_target;
      }
    }
    push_target.children.push(p_node);
  }
  parse () {
    const s = this.buff;
    let c = s.charCodeAt(0 );
    /** unused:  const next_c = 0   **/ 
    let fc = 0;
    let new_node;
    let sp = 0;
    let ep = 0;
    let last_i = 0;
    let had_lf = false;
    while (this.i < this.__len) {
      if ( this.had_error ) {
        break;
      }
      last_i = this.i;
      let is_block_parent = false;
      if ( had_lf ) {
        had_lf = false;
        this.end_expression();
        break;
      }
      if ( typeof(this.curr_node) !== "undefined" ) {
        if ( typeof(this.curr_node.parent) !== "undefined" ) {
          const nodeParent = this.curr_node.parent;
          if ( nodeParent.is_block_node ) {
            is_block_parent = true;
          }
        }
      }
      if ( this.skip_space(is_block_parent) ) {
        break;
      }
      had_lf = false;
      c = s.charCodeAt(this.i );
      if ( this.i < this.__len ) {
        c = s.charCodeAt(this.i );
        if ( c == 59 ) {
          sp = this.i + 1;
          while ((this.i < this.__len) && ((s.charCodeAt(this.i )) > 31)) {
            this.i = 1 + this.i;
          }
          if ( this.i >= this.__len ) {
            break;
          }
          new_node = new CodeNode(this.code, sp, this.i);
          new_node.parsed_type = 10;
          new_node.value_type = 10;
          new_node.string_value = s.substring(sp, this.i );
          this.curr_node.comments.push(new_node);
          continue;
        }
        if ( this.i < (this.__len - 1) ) {
          fc = s.charCodeAt((this.i + 1) );
          if ( (((c == 40) || (c == (123))) || ((c == 39) && (fc == 40))) || ((c == 96) && (fc == 40)) ) {
            this.paren_cnt = this.paren_cnt + 1;
            if ( typeof(this.curr_node) === "undefined" ) {
              this.rootNode = new CodeNode(this.code, this.i, this.i);
              this.curr_node = this.rootNode;
              if ( c == 96 ) {
                this.curr_node.parsed_type = 30;
                this.curr_node.value_type = 30;
              }
              if ( c == 39 ) {
                this.curr_node.parsed_type = 29;
                this.curr_node.value_type = 29;
              }
              this.curr_node.expression = true;
              this.parents.push(this.curr_node);
            } else {
              const new_qnode = new CodeNode(this.code, this.i, this.i);
              if ( c == 96 ) {
                new_qnode.value_type = 30;
              }
              if ( c == 39 ) {
                new_qnode.value_type = 29;
              }
              new_qnode.expression = true;
              this.insert_node(new_qnode);
              this.parents.push(new_qnode);
              this.curr_node = new_qnode;
            }
            if ( c == (123) ) {
              this.curr_node.is_block_node = true;
            }
            this.i = 1 + this.i;
            this.parse();
            continue;
          }
        }
        sp = this.i;
        ep = this.i;
        fc = s.charCodeAt(this.i );
        if ( (((fc == 45) && ((s.charCodeAt((this.i + 1) )) >= 46)) && ((s.charCodeAt((this.i + 1) )) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
          let is_double = false;
          sp = this.i;
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
          while ((this.i < this.__len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((this.i == sp) && ((c == (43)) || (c == (45)))))) {
            if ( c == (46) ) {
              is_double = true;
            }
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
          }
          ep = this.i;
          const new_num_node = new CodeNode(this.code, sp, ep);
          if ( is_double ) {
            new_num_node.parsed_type = 2;
            new_num_node.value_type = 2;
            new_num_node.double_value = (isNaN( parseFloat((s.substring(sp, ep ))) ) ? undefined : parseFloat((s.substring(sp, ep ))));
          } else {
            new_num_node.parsed_type = 3;
            new_num_node.value_type = 3;
            new_num_node.int_value = (isNaN( parseInt((s.substring(sp, ep ))) ) ? undefined : parseInt((s.substring(sp, ep ))));
          }
          this.insert_node(new_num_node);
          continue;
        }
        if ( fc == 34 ) {
          sp = this.i + 1;
          ep = sp;
          c = s.charCodeAt(this.i );
          let must_encode = false;
          while (this.i < this.__len) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
            if ( c == 34 ) {
              break;
            }
            if ( c == 92 ) {
              this.i = 1 + this.i;
              if ( this.i < this.__len ) {
                must_encode = true;
                c = s.charCodeAt(this.i );
              } else {
                break;
              }
            }
          }
          ep = this.i;
          if ( this.i < this.__len ) {
            let encoded_str = "";
            if ( must_encode ) {
              const orig_str = (s.substring(sp, ep ));
              const str_length = orig_str.length;
              let ii = 0;
              while (ii < str_length) {
                const cc = orig_str.charCodeAt(ii );
                if ( cc == 92 ) {
                  const next_ch = orig_str.charCodeAt((ii + 1) );
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
                      ii = ii + 4;
                      break;
                    default: 
                      break;
                  }
                  ii = ii + 2;
                } else {
                  encoded_str = encoded_str + (orig_str.substring(ii, (1 + ii) ));
                  ii = ii + 1;
                }
              }
            }
            const new_str_node = new CodeNode(this.code, sp, ep);
            new_str_node.parsed_type = 4;
            new_str_node.value_type = 4;
            if ( must_encode ) {
              new_str_node.string_value = encoded_str;
            } else {
              new_str_node.string_value = s.substring(sp, ep );
            }
            this.insert_node(new_str_node);
            this.i = 1 + this.i;
            continue;
          }
        }
        if ( (((fc == (116)) && ((s.charCodeAt((this.i + 1) )) == (114))) && ((s.charCodeAt((this.i + 2) )) == (117))) && ((s.charCodeAt((this.i + 3) )) == (101)) ) {
          const new_true_node = new CodeNode(this.code, sp, sp + 4);
          new_true_node.value_type = 5;
          new_true_node.parsed_type = 5;
          new_true_node.boolean_value = true;
          this.insert_node(new_true_node);
          this.i = this.i + 4;
          continue;
        }
        if ( ((((fc == (102)) && ((s.charCodeAt((this.i + 1) )) == (97))) && ((s.charCodeAt((this.i + 2) )) == (108))) && ((s.charCodeAt((this.i + 3) )) == (115))) && ((s.charCodeAt((this.i + 4) )) == (101)) ) {
          const new_f_node = new CodeNode(this.code, sp, sp + 5);
          new_f_node.value_type = 5;
          new_f_node.parsed_type = 5;
          new_f_node.boolean_value = false;
          this.insert_node(new_f_node);
          this.i = this.i + 5;
          continue;
        }
        if ( fc == (64) ) {
          this.i = this.i + 1;
          sp = this.i;
          ep = this.i;
          c = s.charCodeAt(this.i );
          while (((((this.i < this.__len) && ((s.charCodeAt(this.i )) > 32)) && (c != 40)) && (c != 41)) && (c != (125))) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
          }
          ep = this.i;
          if ( (this.i < this.__len) && (ep > sp) ) {
            const a_node2 = new CodeNode(this.code, sp, ep);
            const a_name = s.substring(sp, ep );
            a_node2.expression = true;
            this.curr_node = a_node2;
            this.parents.push(a_node2);
            this.i = this.i + 1;
            this.paren_cnt = this.paren_cnt + 1;
            this.parse();
            let use_first = false;
            if ( 1 == (a_node2.children.length) ) {
              const ch1 = a_node2.children[0];
              use_first = ch1.isPrimitive();
            }
            if ( use_first ) {
              const theNode = a_node2.children.splice(0, 1).pop();
              this.curr_node.props[a_name] = theNode
            } else {
              this.curr_node.props[a_name] = a_node2
            }
            this.curr_node.prop_keys.push(a_name);
            continue;
          }
        }
        let ns_list = [];
        let last_ns = this.i;
        let ns_cnt = 1;
        let vref_had_type_ann = false;
        let vref_ann_node;
        let vref_end = this.i;
        if ( (((((this.i < this.__len) && ((s.charCodeAt(this.i )) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) ) {
          if ( this.curr_node.is_block_node == true ) {
            const new_expr_node = new CodeNode(this.code, sp, ep);
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
        let op_c = 0;
        op_c = this.getOperator();
        let last_was_newline = false;
        if ( op_c > 0 ) {
        } else {
          while ((((((this.i < this.__len) && ((s.charCodeAt(this.i )) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) {
            if ( this.i > sp ) {
              const is_opchar = this.isOperator();
              if ( is_opchar > 0 ) {
                break;
              }
            }
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
            if ( (c == 10) || (c == 13) ) {
              last_was_newline = true;
              break;
            }
            if ( c == (46) ) {
              ns_list.push(s.substring(last_ns, this.i ));
              last_ns = this.i + 1;
              ns_cnt = 1 + ns_cnt;
            }
            if ( (this.i > vref_end) && (c == (64)) ) {
              vref_had_type_ann = true;
              vref_end = this.i;
              vref_ann_node = this.parse_raw_annotation();
              c = s.charCodeAt(this.i );
              break;
            }
          }
        }
        ep = this.i;
        if ( vref_had_type_ann ) {
          ep = vref_end;
        }
        ns_list.push(s.substring(last_ns, ep ));
        c = s.charCodeAt(this.i );
        while (((this.i < this.__len) && (c <= 32)) && (false == last_was_newline)) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
          if ( is_block_parent && ((c == 10) || (c == 13)) ) {
            this.i = this.i - 1;
            c = s.charCodeAt(this.i );
            had_lf = true;
            break;
          }
        }
        if ( c == 58 ) {
          this.i = this.i + 1;
          while ((this.i < this.__len) && ((s.charCodeAt(this.i )) <= 32)) {
            this.i = 1 + this.i;
          }
          let vt_sp = this.i;
          let vt_ep = this.i;
          c = s.charCodeAt(this.i );
          if ( c == (40) ) {
            const vann_arr2 = this.parse_raw_annotation();
            vann_arr2.expression = true;
            const new_expr_node_1 = new CodeNode(this.code, sp, vt_ep);
            new_expr_node_1.vref = s.substring(sp, ep );
            new_expr_node_1.ns = ns_list;
            new_expr_node_1.expression_value = vann_arr2;
            new_expr_node_1.parsed_type = 15;
            new_expr_node_1.value_type = 15;
            if ( vref_had_type_ann ) {
              new_expr_node_1.vref_annotation = vref_ann_node;
              new_expr_node_1.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_expr_node_1);
            continue;
          }
          if ( c == (91) ) {
            this.i = this.i + 1;
            vt_sp = this.i;
            let hash_sep = 0;
            let had_array_type_ann = false;
            c = s.charCodeAt(this.i );
            while (((this.i < this.__len) && (c > 32)) && (c != 93)) {
              this.i = 1 + this.i;
              c = s.charCodeAt(this.i );
              if ( c == (58) ) {
                hash_sep = this.i;
              }
              if ( c == (64) ) {
                had_array_type_ann = true;
                break;
              }
            }
            vt_ep = this.i;
            if ( hash_sep > 0 ) {
              vt_ep = this.i;
              const type_name = s.substring((1 + hash_sep), vt_ep );
              const key_type_name = s.substring(vt_sp, hash_sep );
              const new_hash_node = new CodeNode(this.code, sp, vt_ep);
              new_hash_node.vref = s.substring(sp, ep );
              new_hash_node.ns = ns_list;
              new_hash_node.parsed_type = 7;
              new_hash_node.value_type = 7;
              new_hash_node.array_type = type_name;
              new_hash_node.key_type = key_type_name;
              if ( vref_had_type_ann ) {
                new_hash_node.vref_annotation = vref_ann_node;
                new_hash_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                const vann_hash = this.parse_raw_annotation();
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
              const type_name_1 = s.substring(vt_sp, vt_ep );
              const new_arr_node = new CodeNode(this.code, sp, vt_ep);
              new_arr_node.vref = s.substring(sp, ep );
              new_arr_node.ns = ns_list;
              new_arr_node.parsed_type = 6;
              new_arr_node.value_type = 6;
              new_arr_node.array_type = type_name_1;
              new_arr_node.parent = this.curr_node;
              this.curr_node.children.push(new_arr_node);
              if ( vref_had_type_ann ) {
                new_arr_node.vref_annotation = vref_ann_node;
                new_arr_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                const vann_arr = this.parse_raw_annotation();
                new_arr_node.type_annotation = vann_arr;
                new_arr_node.has_type_annotation = true;
                console.log("--> parsed ARRAY TYPE annotation")
              }
              this.i = 1 + this.i;
              continue;
            }
          }
          let had_type_ann = false;
          while (((((((this.i < this.__len) && ((s.charCodeAt(this.i )) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) && (c != (44))) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
            if ( c == (64) ) {
              had_type_ann = true;
              break;
            }
          }
          if ( this.i < this.__len ) {
            vt_ep = this.i;
            /** unused:  const type_name_2 = s.substring(vt_sp, vt_ep )   **/ 
            const new_ref_node = new CodeNode(this.code, sp, ep);
            new_ref_node.vref = s.substring(sp, ep );
            new_ref_node.ns = ns_list;
            new_ref_node.parsed_type = 9;
            new_ref_node.value_type = 9;
            new_ref_node.type_name = s.substring(vt_sp, vt_ep );
            new_ref_node.parent = this.curr_node;
            if ( vref_had_type_ann ) {
              new_ref_node.vref_annotation = vref_ann_node;
              new_ref_node.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_ref_node);
            if ( had_type_ann ) {
              const vann = this.parse_raw_annotation();
              new_ref_node.type_annotation = vann;
              new_ref_node.has_type_annotation = true;
            }
            continue;
          }
        } else {
          if ( (this.i < this.__len) && (ep > sp) ) {
            const new_vref_node = new CodeNode(this.code, sp, ep);
            new_vref_node.vref = s.substring(sp, ep );
            new_vref_node.parsed_type = 9;
            new_vref_node.value_type = 9;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = this.curr_node;
            const op_pred = this.getOperatorPred(new_vref_node.vref);
            if ( new_vref_node.vref == "," ) {
              this.curr_node.infix_operator = false;
              continue;
            }
            let pTarget = this.curr_node;
            if ( this.curr_node.infix_operator ) {
              const iNode = this.curr_node.infix_node;
              if ( (op_pred > 0) || (iNode.to_the_right == false) ) {
                pTarget = iNode;
              } else {
                const rn = iNode.right_node;
                new_vref_node.parent = rn;
                pTarget = rn;
              }
            }
            pTarget.children.push(new_vref_node);
            if ( vref_had_type_ann ) {
              new_vref_node.vref_annotation = vref_ann_node;
              new_vref_node.has_vref_annotation = true;
            }
            if ( (this.i + 1) < this.__len ) {
              if ( ((s.charCodeAt((this.i + 1) )) == (40)) || ((s.charCodeAt((this.i + 0) )) == (40)) ) {
                if ( ((0 == op_pred) && this.curr_node.infix_operator) && (1 == (this.curr_node.children.length)) ) {
                }
              }
            }
            if ( ((op_pred > 0) && this.curr_node.infix_operator) || ((op_pred > 0) && ((this.curr_node.children.length) >= 2)) ) {
              if ( (op_pred == 3) && (2 == (this.curr_node.children.length)) ) {
                const n_ch = this.curr_node.children.splice(0, 1).pop();
                this.curr_node.children.push(n_ch);
              } else {
                if ( false == this.curr_node.infix_operator ) {
                  const if_node = new CodeNode(this.code, sp, ep);
                  this.curr_node.infix_node = if_node;
                  this.curr_node.infix_operator = true;
                  if_node.infix_subnode = true;
                  this.curr_node.value_type = 0;
                  this.curr_node.expression = true;
                  if_node.expression = true;
                  let ch_cnt = this.curr_node.children.length;
                  let ii_1 = 0;
                  const start_from = ch_cnt - 2;
                  const keep_nodes = new CodeNode(this.code, sp, ep);
                  while (ch_cnt > 0) {
                    const n_ch_1 = this.curr_node.children.splice(0, 1).pop();
                    let p_target = if_node;
                    if ( (ii_1 < start_from) || n_ch_1.infix_subnode ) {
                      p_target = keep_nodes;
                    }
                    p_target.children.push(n_ch_1);
                    ch_cnt = ch_cnt - 1;
                    ii_1 = 1 + ii_1;
                  }
                  for ( let i_1 = 0; i_1 < keep_nodes.children.length; i_1++) {
                    var keep = keep_nodes.children[i_1];
                    this.curr_node.children.push(keep);
                  }
                  this.curr_node.children.push(if_node);
                }
                const ifNode = this.curr_node.infix_node;
                const new_op_node = new CodeNode(this.code, sp, ep);
                new_op_node.expression = true;
                new_op_node.parent = ifNode;
                let until_index = (ifNode.children.length) - 1;
                let to_right = false;
                const just_continue = false;
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred < op_pred) ) {
                  to_right = true;
                }
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred > op_pred) ) {
                  ifNode.to_the_right = false;
                }
                if ( (ifNode.operator_pred > 0) && (ifNode.operator_pred == op_pred) ) {
                  to_right = ifNode.to_the_right;
                }
                /** unused:  const opTarget = ifNode   **/ 
                if ( to_right ) {
                  const op_node = ifNode.children.splice(until_index, 1).pop();
                  const last_value = ifNode.children.splice((until_index - 1), 1).pop();
                  new_op_node.children.push(op_node);
                  new_op_node.children.push(last_value);
                } else {
                  if ( false == just_continue ) {
                    while (until_index > 0) {
                      const what_to_add = ifNode.children.splice(0, 1).pop();
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
        if ( (c == 41) || (c == (125)) ) {
          if ( ((c == (125)) && is_block_parent) && ((this.curr_node.children.length) > 0) ) {
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
  constructor() {
    this.matched = {};
  }
  matchArguments (args, callArgs, ctx, firstArgIndex) {
    /** unused:  const fc = callArgs.children[0]   **/ 
    let missed_args = [];
    let all_matched = true;
    if ( ((args.children.length) == 0) && ((callArgs.children.length) > 1) ) {
      return false;
    }
    let lastArg;
    for ( let i = 0; i < callArgs.children.length; i++) {
      var callArg = callArgs.children[i];
      if ( i == 0 ) {
        continue;
      }
      const arg_index = i - 1;
      if ( arg_index < (args.children.length) ) {
        lastArg = args.children[arg_index];
      }
      const arg = lastArg;
      if ( arg.hasFlag("ignore") ) {
        continue;
      }
      if ( arg.hasFlag("mutable") ) {
        if ( callArg.hasParamDesc ) {
          const pa = callArg.paramDesc;
          const b = pa.nameNode.hasFlag("mutable");
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
          const pa_1 = callArg.paramDesc;
          const b_1 = pa_1.nameNode.hasFlag("optional");
          if ( b_1 == false ) {
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
      let did_match = false;
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
  add (tplKeyword, typeName, ctx) {
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
    if ( ( typeof(this.matched[tplKeyword] ) != "undefined" && this.matched.hasOwnProperty(tplKeyword) ) ) {
      const s = (this.matched[tplKeyword]);
      if ( this.areEqualTypes(s, typeName, ctx) ) {
        return true;
      }
      if ( s == typeName ) {
        return true;
      } else {
        return false;
      }
    }
    this.matched[tplKeyword] = typeName
    return true;
  }
  doesDefsMatch (arg, node, ctx) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      const eq = this.areEqualTypes(arg.type_name, node.type_name, ctx);
      const t_name = arg.type_name;
      switch (t_name ) { 
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
          return node.eval_type_name == t_name;
          break;
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      const same_arrays = this.areEqualTypes(arg.array_type, node.array_type, ctx);
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      const same_arrays_1 = this.areEqualTypes(arg.array_type, node.array_type, ctx);
      const same_keys = this.areEqualTypes(arg.key_type, node.key_type, ctx);
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  doesMatch (arg, node, ctx) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      const eq = this.areEqualTypes(arg.type_name, node.eval_type_name, ctx);
      const t_name = arg.type_name;
      switch (t_name ) { 
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
          return node.eval_type_name == t_name;
          break;
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      const same_arrays = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      const same_arrays_1 = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
      const same_keys = this.areEqualTypes(arg.key_type, node.eval_key_type, ctx);
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  areEqualTypes (type1, type2, ctx) {
    let t_name = type1;
    if ( ( typeof(this.matched[type1] ) != "undefined" && this.matched.hasOwnProperty(type1) ) ) {
      t_name = (this.matched[type1]);
    }
    switch (t_name ) { 
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
    if ( ctx.isDefinedClass(t_name) && ctx.isDefinedClass(type2) ) {
      const c1 = ctx.findClass(t_name);
      const c2 = ctx.findClass(type2);
      if ( c1.isSameOrParentClass(type2, ctx) ) {
        return true;
      }
      if ( c2.isSameOrParentClass(t_name, ctx) ) {
        return true;
      }
    } else {
      if ( ctx.isDefinedClass(t_name) ) {
        const c1_1 = ctx.findClass(t_name);
        if ( c1_1.isSameOrParentClass(type2, ctx) ) {
          return true;
        }
      }
    }
    return t_name == type2;
  }
  getTypeName (n) {
    let t_name = n;
    if ( ( typeof(this.matched[t_name] ) != "undefined" && this.matched.hasOwnProperty(t_name) ) ) {
      t_name = (this.matched[t_name]);
    }
    if ( 0 == (t_name.length) ) {
      return "";
    }
    return t_name;
  }
  getType (n) {
    let t_name = n;
    if ( ( typeof(this.matched[t_name] ) != "undefined" && this.matched.hasOwnProperty(t_name) ) ) {
      t_name = (this.matched[t_name]);
    }
    if ( 0 == (t_name.length) ) {
      return 0;
    }
    switch (t_name ) { 
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
  setRvBasedOn (arg, node) {
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
class ClassJoinPoint  {
  constructor() {
  }
}
class RangerFlowParser  {
  constructor() {
    this.collectWalkAtEnd = [];     /** note: unused */
    this.walkAlso = [];
    this.serializedClasses = [];
    this.classesWithTraits = [];
    this.collectedIntefaces = [];
    this.definedInterfaces = {};     /** note: unused */
  }
  cmdEnum (node, ctx, wr) {
    const fNameNode = node.children[1];
    const enumList = node.children[2];
    const new_enum = new RangerAppEnum();
    for ( let i = 0; i < enumList.children.length; i++) {
      var item = enumList.children[i];
      new_enum.add(item.vref);
    }
    ctx.definedEnums[fNameNode.vref] = new_enum
  }
  initStdCommands () {
  }
  findLanguageOper (details, ctx) {
    const langName = ctx.getTargetLang();
    for ( let i = 0; i < details.children.length; i++) {
      var det = details.children[i];
      if ( (det.children.length) > 0 ) {
        const fc = det.children[0];
        if ( fc.vref == "templates" ) {
          const tplList = det.children[1];
          for ( let i_1 = 0; i_1 < tplList.children.length; i_1++) {
            var tpl = tplList.children[i_1];
            const tplName = tpl.getFirst();
            let tplImpl;
            tplImpl = tpl.getSecond();
            if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
              continue;
            }
            let rv;
            rv = tpl;
            return rv;
          }
        }
      }
    }
    let none;
    return none;
  }
  buildMacro (langOper, args, ctx) {
    const subCtx = ctx.fork();
    const wr = new CodeWriter();
    const lcc = new LiveCompiler();
    lcc.langWriter = new RangerRangerClassWriter();
    lcc.langWriter.compiler = lcc;
    subCtx.targetLangName = "ranger";
    subCtx.restartExpressionLevel();
    const macroNode = langOper;
    const cmdList = macroNode.getSecond();
    lcc.walkCommandList(cmdList, args, subCtx, wr);
    const lang_str = wr.getCode();
    const lang_code = new SourceCode(lang_str);
    lang_code.filename = ("<macro " + macroNode.vref) + ">";
    const lang_parser = new RangerLispParser(lang_code);
    lang_parser.parse();
    const node = lang_parser.rootNode;
    return node;
  }
  stdParamMatch (callArgs, inCtx, wr) {
    this.stdCommands = inCtx.getStdCommands();
    const callFnName = callArgs.getFirst();
    const cmds = this.stdCommands;
    let some_matched = false;
    /** unused:  const found_fn = false   **/ 
    /** unused:  let missed_args = []   **/ 
    let ctx = inCtx.fork();
    /** unused:  const lang_name = ctx.getTargetLang()   **/ 
    let expects_error = false;
    const err_cnt = inCtx.getErrorCount();
    if ( callArgs.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    for ( let main_index = 0; main_index < cmds.children.length; main_index++) {
      var ch = cmds.children[main_index];
      const fc = ch.getFirst();
      const nameNode = ch.getSecond();
      const args = ch.getThird();
      if ( callFnName.vref == fc.vref ) {
        /** unused:  const line_index = callArgs.getLine()   **/ 
        const callerArgCnt = (callArgs.children.length) - 1;
        const fnArgCnt = args.children.length;
        let has_eval_ctx = false;
        let is_macro = false;
        if ( nameNode.hasFlag("newcontext") ) {
          ctx = inCtx.fork();
          has_eval_ctx = true;
        }
        const expanding_node = nameNode.hasFlag("expands");
        if ( (callerArgCnt == fnArgCnt) || expanding_node ) {
          const details_list = ch.children[3];
          const langOper = this.findLanguageOper(details_list, ctx);
          if ( typeof(langOper) === "undefined" ) {
            continue;
          }
          if ( langOper.hasBooleanProperty("macro") ) {
            is_macro = true;
          }
          const match = new RangerArgMatch();
          let last_walked = 0;
          for ( let i = 0; i < args.children.length; i++) {
            var arg = args.children[i];
            const callArg = callArgs.children[(i + 1)];
            if ( arg.hasFlag("define") ) {
              const p = new RangerAppParamDesc();
              p.name = callArg.vref;
              p.value_type = arg.value_type;
              p.node = callArg;
              p.nameNode = callArg;
              p.is_optional = false;
              p.init_cnt = 1;
              ctx.defineVariable(p.name, p);
              callArg.hasParamDesc = true;
              callArg.ownParamDesc = p;
              callArg.paramDesc = p;
              if ( (callArg.type_name.length) == 0 ) {
                callArg.type_name = arg.type_name;
                callArg.value_type = arg.value_type;
              }
              callArg.eval_type = arg.value_type;
              callArg.eval_type_name = arg.type_name;
            }
            if ( arg.hasFlag("ignore") ) {
              continue;
            }
            ctx.setInExpr();
            last_walked = i + 1;
            this.WalkNode(callArg, ctx, wr);
            ctx.unsetInExpr();
          }
          if ( expanding_node ) {
            for ( let i2 = 0; i2 < callArgs.children.length; i2++) {
              var caCh = callArgs.children[i2];
              if ( i2 > last_walked ) {
                ctx.setInExpr();
                this.WalkNode(caCh, ctx, wr);
                ctx.unsetInExpr();
              }
            }
          }
          const all_matched = match.matchArguments(args, callArgs, ctx, 1);
          if ( all_matched ) {
            if ( is_macro ) {
              const macroNode = this.buildMacro(langOper, callArgs, ctx);
              let arg_len = callArgs.children.length;
              while (arg_len > 0) {
                callArgs.children.pop();
                arg_len = arg_len - 1;
              }
              callArgs.children.push(macroNode);
              macroNode.parent = callArgs;
              this.WalkNode(macroNode, ctx, wr);
              match.setRvBasedOn(nameNode, callArgs);
              return true;
            }
            if ( nameNode.hasFlag("moves") ) {
              const moves_opt = nameNode.getFlag("moves");
              const moves = moves_opt;
              const ann = moves.vref_annotation;
              const from = ann.getFirst();
              const to = ann.getSecond();
              const cA = callArgs.children[from.int_value];
              const cA2 = callArgs.children[to.int_value];
              if ( cA.hasParamDesc ) {
                const pp = cA.paramDesc;
                const pp2 = cA2.paramDesc;
                pp.moveRefTo(callArgs, pp2, ctx);
              }
            }
            if ( nameNode.hasFlag("returns") ) {
              const activeFn = ctx.getCurrentMethod();
              if ( activeFn.nameNode.type_name != "void" ) {
                if ( (callArgs.children.length) < 2 ) {
                  ctx.addError(callArgs, " missing return value !!!");
                } else {
                  const returnedValue = callArgs.children[1];
                  if ( match.doesMatch((activeFn.nameNode), returnedValue, ctx) == false ) {
                    if ( activeFn.nameNode.ifNoTypeSetToEvalTypeOf(returnedValue) ) {
                    } else {
                      ctx.addError(returnedValue, "invalid return value type!!!");
                    }
                  }
                  const argNode = activeFn.nameNode;
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
                  const pp_1 = returnedValue.paramDesc;
                  if ( typeof(pp_1) !== "undefined" ) {
                    pp_1.moveRefTo(callArgs, activeFn, ctx);
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
            const nodeP = callArgs.parent;
            if ( typeof(nodeP) !== "undefined" ) {
            } else {
            }
            /** unused:  const sig = nameNode.buildTypeSignatureUsingMatch(match)   **/ 
            some_matched = true;
            callArgs.has_operator = true;
            callArgs.op_index = main_index;
            for ( let arg_index = 0; arg_index < args.children.length; arg_index++) {
              var arg_1 = args.children[arg_index];
              if ( arg_1.has_vref_annotation ) {
                const anns = arg_1.vref_annotation;
                for ( let i_1 = 0; i_1 < anns.children.length; i_1++) {
                  var ann_1 = anns.children[i_1];
                  if ( ann_1.vref == "mutates" ) {
                    const theArg = callArgs.children[(arg_index + 1)];
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
      const cnt_now = ctx.getErrorCount();
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
      }
    } else {
      const cnt_now_1 = ctx.getErrorCount();
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
      }
    }
    return true;
  }
  cmdImport (node, ctx, wr) {
    return false;
  }
  getThisName () {
    return "this";
  }
  WriteThisVar (node, ctx, wr) {
  }
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "_" ) {
      return;
    }
    const rootObjName = node.ns[0];
    if ( ctx.isInStatic() ) {
      if ( rootObjName == "this" ) {
        ctx.addError(node, "This can not be used in static context");
      }
    }
    if ( ctx.isEnumDefined(rootObjName) ) {
      const enumName = node.ns[1];
      const ee = ctx.getEnum(rootObjName);
      const e = ee;
      if ( ( typeof(e.values[enumName] ) != "undefined" && e.values.hasOwnProperty(enumName) ) ) {
        node.eval_type = 11;
        node.eval_type_name = rootObjName;
        node.int_value = (e.values[enumName]);
      } else {
        ctx.addError(node, (("Undefined Enum " + rootObjName) + ".") + enumName);
        node.eval_type = 1;
      }
      return;
    }
    if ( node.vref == this.getThisName() ) {
      const cd = ctx.getCurrentClass();
      const thisClassDesc = cd;
      node.eval_type = 8;
      node.eval_type_name = thisClassDesc.name;
      node.ref_type = 4;
      return;
    }
    if ( ctx.isCapturing() ) {
      if ( ctx.isVarDefined(rootObjName) ) {
        if ( ctx.isLocalToCapture(rootObjName) == false ) {
          const captDef = ctx.getVariableDef(rootObjName);
          const cd_1 = ctx.getCurrentClass();
          cd_1.capturedLocals.push(captDef);
          captDef.is_captured = true;
          ctx.addCapturedVariable(rootObjName);
        }
      }
    }
    if ( (rootObjName == "this") || ctx.isVarDefined(rootObjName) ) {
      /** unused:  const vDef2 = ctx.getVariableDef(rootObjName)   **/ 
      /** unused:  const activeFn = ctx.getCurrentMethod()   **/ 
      const vDef = this.findParamDesc(node, ctx, wr);
      if ( typeof(vDef) !== "undefined" ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef;
        node.paramDesc = vDef;
        vDef.ref_cnt = 1 + vDef.ref_cnt;
        const vNameNode = vDef.nameNode;
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
      let class_or_this = rootObjName == this.getThisName();
      if ( ctx.isDefinedClass(rootObjName) ) {
        class_or_this = true;
        node.eval_type = 23;
        node.eval_type_name = rootObjName;
      }
      if ( ctx.hasTemplateNode(rootObjName) ) {
        class_or_this = true;
      }
      if ( false == class_or_this ) {
        const udesc = ctx.getCurrentClass();
        const desc = udesc;
        ctx.addError(node, (("Undefined variable " + rootObjName) + " in class ") + desc.name);
      }
      return;
    }
  }
  CreateClass (node, ctx, wr) {
  }
  DefineVar (node, ctx, wr) {
  }
  WriteComment (node, ctx, wr) {
  }
  cmdLog (node, ctx, wr) {
  }
  cmdDoc (node, ctx, wr) {
  }
  cmdGitDoc (node, ctx, wr) {
  }
  cmdNative (node, ctx, wr) {
  }
  LangInit (node, ctx, wr) {
  }
  getWriterLang () {
    return "_";
  }
  StartCodeWriting (node, ctx, wr) {
  }
  Constructor (node, ctx, wr) {
    this.shouldHaveChildCnt(3, node, ctx, "Method expexts four arguments");
    /** unused:  const cn = node.children[1]   **/ 
    const fnBody = node.children[2];
    const udesc = ctx.getCurrentClass();
    const desc = udesc;
    const m = desc.constructor_fn;
    const subCtx = m.fnCtx;
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    subCtx.setInMethod();
    for ( let i = 0; i < m.params.length; i++) {
      var v = m.params[i];
      subCtx.defineVariable(v.name, v);
    }
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(node, "constructor should not return any values!");
    }
    for ( let i_1 = 0; i_1 < subCtx.localVarNames.length; i_1++) {
      var n = subCtx.localVarNames[i_1];
      const p = subCtx.localVariables[n];
      if ( p.set_cnt > 0 ) {
        const defNode = p.node;
        defNode.setFlag("mutable");
        const nNode = p.nameNode;
        nNode.setFlag("mutable");
      }
    }
  }
  WriteScalarValue (node, ctx, wr) {
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
  buildGenericClass (tpl, node, ctx, wr) {
    const root = ctx.getRoot();
    const cn = tpl.getSecond();
    const newName = node.getSecond();
    const tplArgs = cn.vref_annotation;
    const givenArgs = newName.vref_annotation;
    const sign = cn.vref + givenArgs.getCode();
    if ( ( typeof(root.classSignatures[sign] ) != "undefined" && root.classSignatures.hasOwnProperty(sign) ) ) {
      return;
    }
    console.log("could build generic class... " + cn.vref)
    const match = new RangerArgMatch();
    for ( let i = 0; i < tplArgs.children.length; i++) {
      var arg = tplArgs.children[i];
      const given = givenArgs.children[i];
      console.log(((" setting " + arg.vref) + " => ") + given.vref)
      if ( false == match.add(arg.vref, given.vref, ctx) ) {
        console.log("set failed!")
      } else {
        console.log("set OK")
      }
      console.log(" T == " + match.getTypeName(arg.vref))
    }
    console.log(" T == " + match.getTypeName("T"))
    const newClassNode = tpl.rebuildWithType(match, false);
    console.log("build done")
    console.log(newClassNode.getCode())
    const sign_2 = cn.vref + givenArgs.getCode();
    console.log("signature ==> " + sign_2)
    const cName = newClassNode.getSecond();
    const friendlyName = root.createSignature(cn.vref, sign_2);
    console.log("class common name => " + friendlyName)
    cName.vref = friendlyName;
    cName.has_vref_annotation = false;
    console.log(newClassNode.getCode())
    this.WalkCollectMethods(newClassNode, ctx, wr);
    this.WalkNode(newClassNode, root, wr);
    console.log("the class collected the methods...")
  }
  cmdNew (node, ctx, wr) {
    if ( (node.children.length) < 2 ) {
      ctx.addError(node, "the new operator expects at lest two arguments");
      return;
    }
    if ( (node.children.length) < 3 ) {
      const expr = new CodeNode(node.code, node.sp, node.ep);
      expr.expression = true;
      node.children.push(expr);
    }
    const obj = node.getSecond();
    const params = node.getThird();
    let currC;
    let b_template = false;
    let expects_error = false;
    const err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( ctx.hasTemplateNode(obj.vref) ) {
      console.log(" ==> template class")
      b_template = true;
      const tpl = ctx.findTemplateNode(obj.vref);
      if ( obj.has_vref_annotation ) {
        console.log("generic class OK")
        this.buildGenericClass(tpl, node, ctx, wr);
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
    for ( let i = 0; i < params.children.length; i++) {
      var arg = params.children[i];
      ctx.setInExpr();
      this.WalkNode(arg, ctx, wr);
      ctx.unsetInExpr();
    }
    node.eval_type = 8;
    node.eval_type_name = obj.vref;
    if ( b_template == false ) {
      currC = ctx.findClass(obj.vref);
    }
    node.hasNewOper = true;
    node.clDesc = currC;
    const fnDescr = currC.constructor_fn;
    if ( typeof(fnDescr) !== "undefined" ) {
      for ( let i_1 = 0; i_1 < fnDescr.params.length; i_1++) {
        var param = fnDescr.params[i_1];
        let has_default = false;
        if ( param.nameNode.hasFlag("default") ) {
          has_default = true;
        }
        if ( (params.children.length) <= i_1 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(node, "Missing arguments for function");
          ctx.addError(param.nameNode, "To fix the previous error: Check original function declaration");
        }
        const argNode = params.children[i_1];
        if ( false == this.areEqualTypes((param.nameNode), argNode, ctx) ) {
          ctx.addError(argNode, ("ERROR, invalid argument type for " + currC.name) + " constructor ");
        }
        const pNode = param.nameNode;
        if ( pNode.hasFlag("optional") ) {
          if ( false == argNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected optional parameter" + argNode.getCode());
          }
        }
        if ( argNode.hasFlag("optional") ) {
          if ( false == pNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected non-optional, optional given" + argNode.getCode());
          }
        }
      }
    }
    if ( expects_error ) {
      const cnt_now = ctx.getErrorCount();
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
      }
    } else {
      const cnt_now_1 = ctx.getErrorCount();
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
      }
    }
  }
  transformParams (list, fnArgs, ctx) {
    let res = [];
    for ( let i = 0; i < list.length; i++) {
      var item = list[i];
      if ( item.is_block_node ) {
        /** unused:  const newNode = new CodeNode(item.code, item.sp, item.ep)   **/ 
        const fnArg = fnArgs[i];
        const nn = fnArg.nameNode;
        if ( typeof(nn.expression_value) === "undefined" ) {
          ctx.addError(item, "Parameter is not lambda expression");
          break;
        }
        const fnDef = nn.expression_value;
        const match = new RangerArgMatch();
        const copyOf = fnDef.rebuildWithType(match, false);
        const fc = copyOf.children[0];
        fc.vref = "fun";
        const itemCopy = item.rebuildWithType(match, false);
        copyOf.children.push(itemCopy);
        let cnt = item.children.length;
        while (cnt > 0) {
          item.children.pop();
          cnt = cnt - 1;
        }
        for ( let i_1 = 0; i_1 < copyOf.children.length; i_1++) {
          var ch = copyOf.children[i_1];
          item.children.push(ch);
        }
      }
      res.push(item);
    }
    return res;
  }
  cmdLocalCall (node, ctx, wr) {
    const fnNode = node.getFirst();
    const udesc = ctx.getCurrentClass();
    const desc = udesc;
    let expects_error = false;
    const err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( (fnNode.ns.length) > 1 ) {
      const rootName = fnNode.ns[0];
      const vDef2 = ctx.getVariableDef(rootName);
      if ( ((rootName != "this") && (vDef2.init_cnt == 0)) && (vDef2.set_cnt == 0) ) {
        if ( (vDef2.is_class_variable == false) && (ctx.isDefinedClass(rootName) == false) ) {
          ctx.addError(node, "Call to uninitialized object " + rootName);
        }
      }
      const vFnDef = this.findFunctionDesc(fnNode, ctx, wr);
      if ( typeof(vFnDef) !== "undefined" ) {
        vFnDef.ref_cnt = vFnDef.ref_cnt + 1;
        const subCtx = ctx.fork();
        node.hasFnCall = true;
        node.fnDesc = vFnDef;
        const p = new RangerAppParamDesc();
        p.name = fnNode.vref;
        p.value_type = fnNode.value_type;
        p.node = fnNode;
        p.nameNode = fnNode;
        p.varType = 10;
        subCtx.defineVariable(p.name, p);
        this.WalkNode(fnNode, subCtx, wr);
        const callParams = node.children[1];
        const nodeList = this.transformParams(callParams.children, vFnDef.params, subCtx);
        for ( let i = 0; i < nodeList.length; i++) {
          var arg = nodeList[i];
          ctx.setInExpr();
          this.WalkNode(arg, subCtx, wr);
          ctx.unsetInExpr();
          const fnArg = vFnDef.params[i];
          const callArgP = arg.paramDesc;
          if ( typeof(callArgP) !== "undefined" ) {
            callArgP.moveRefTo(node, fnArg, ctx);
          }
        }
        const cp_len = callParams.children.length;
        if ( cp_len > (vFnDef.params.length) ) {
          const lastCallParam = callParams.children[(cp_len - 1)];
          ctx.addError(lastCallParam, "Too many arguments for function");
          ctx.addError(vFnDef.nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
        }
        for ( let i_1 = 0; i_1 < vFnDef.params.length; i_1++) {
          var param = vFnDef.params[i_1];
          if ( (callParams.children.length) <= i_1 ) {
            if ( param.nameNode.hasFlag("default") ) {
              continue;
            }
            ctx.addError(node, "Missing arguments for function");
            ctx.addError(param.nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
            break;
          }
          const argNode = callParams.children[i_1];
          if ( false == this.areEqualTypes((param.nameNode), argNode, ctx) ) {
            ctx.addError(argNode, "ERROR, invalid argument type for method " + vFnDef.name);
          }
          const pNode = param.nameNode;
          if ( pNode.hasFlag("optional") ) {
            if ( false == argNode.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider making parameter optional " + argNode.getCode());
            }
          }
          if ( argNode.hasFlag("optional") ) {
            if ( false == pNode.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider unwrapping " + argNode.getCode());
            }
          }
        }
        const nn = vFnDef.nameNode;
        node.eval_type = nn.typeNameAsType(ctx);
        node.eval_type_name = nn.type_name;
        node.eval_array_type = nn.array_type;
        node.eval_key_type = nn.key_type;
        if ( nn.hasFlag("optional") ) {
          node.setFlag("optional");
        }
        if ( expects_error ) {
          const cnt_now = ctx.getErrorCount();
          if ( cnt_now == err_cnt ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
          }
        } else {
          const cnt_now_1 = ctx.getErrorCount();
          if ( cnt_now_1 > err_cnt ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
          }
        }
        return true;
      } else {
        ctx.addError(node, "Called Object or Property was not defined");
      }
    }
    if ( desc.hasMethod(fnNode.vref) ) {
      const fnDescr = desc.findMethod(fnNode.vref);
      const subCtx_1 = ctx.fork();
      node.hasFnCall = true;
      node.fnDesc = fnDescr;
      const p_1 = new RangerAppParamDesc();
      p_1.name = fnNode.vref;
      p_1.value_type = fnNode.value_type;
      p_1.node = fnNode;
      p_1.nameNode = fnNode;
      p_1.varType = 10;
      subCtx_1.defineVariable(p_1.name, p_1);
      this.WriteThisVar(fnNode, subCtx_1, wr);
      this.WalkNode(fnNode, subCtx_1, wr);
      for ( let i_2 = 0; i_2 < node.children.length; i_2++) {
        var arg_1 = node.children[i_2];
        if ( i_2 < 1 ) {
          continue;
        }
        ctx.setInExpr();
        this.WalkNode(arg_1, subCtx_1, wr);
        ctx.unsetInExpr();
      }
      for ( let i_3 = 0; i_3 < fnDescr.params.length; i_3++) {
        var param_1 = fnDescr.params[i_3];
        if ( (node.children.length) <= (i_3 + 1) ) {
          ctx.addError(node, "Argument was not defined");
          break;
        }
        const argNode_1 = node.children[(i_3 + 1)];
        if ( false == this.areEqualTypes((param_1.nameNode), argNode_1, ctx) ) {
          ctx.addError(argNode_1, (("ERROR, invalid argument type for " + desc.name) + " method ") + fnDescr.name);
        }
      }
      const nn_1 = fnDescr.nameNode;
      nn_1.defineNodeTypeTo(node, ctx);
      if ( expects_error ) {
        const cnt_now_2 = ctx.getErrorCount();
        if ( cnt_now_2 == err_cnt ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now_2);
        }
      } else {
        const cnt_now_3 = ctx.getErrorCount();
        if ( cnt_now_3 > err_cnt ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_3);
        }
      }
      return true;
    }
    if ( ctx.isVarDefined(fnNode.vref) ) {
      const d = ctx.getVariableDef(fnNode.vref);
      d.ref_cnt = 1 + d.ref_cnt;
      if ( d.nameNode.value_type == 15 ) {
        /** unused:  const lambdaDefArgs = d.nameNode.expression_value.children[1]   **/ 
        const callParams_1 = node.children[1];
        for ( let i_4 = 0; i_4 < callParams_1.children.length; i_4++) {
          var arg_2 = callParams_1.children[i_4];
          ctx.setInExpr();
          this.WalkNode(arg_2, ctx, wr);
          ctx.unsetInExpr();
        }
        const lambdaDef = d.nameNode.expression_value.children[0];
        /** unused:  const lambdaArgs = d.nameNode.expression_value.children[1]   **/ 
        node.has_lambda_call = true;
        node.eval_type = lambdaDef.typeNameAsType(ctx);
        node.eval_type_name = lambdaDef.type_name;
        node.eval_array_type = lambdaDef.array_type;
        node.eval_key_type = lambdaDef.key_type;
        return true;
      }
    }
    ctx.addError(node, (("ERROR, could not find class " + desc.name) + " method ") + fnNode.vref);
    ctx.addError(node, "definition : " + node.getCode());
    if ( expects_error ) {
      const cnt_now_4 = ctx.getErrorCount();
      if ( cnt_now_4 == err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now_4);
      }
    } else {
      const cnt_now_5 = ctx.getErrorCount();
      if ( cnt_now_5 > err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_5);
      }
    }
    return false;
  }
  cmdReturn (node, ctx, wr) {
    node.has_operator = true;
    node.op_index = 5;
    console.log("cmdReturn")
    if ( (node.children.length) > 1 ) {
      const fc = node.getSecond();
      if ( fc.vref == "_" ) {
      } else {
        ctx.setInExpr();
        this.WalkNode(fc, ctx, wr);
        ctx.unsetInExpr();
        /** unused:  const activeFn = ctx.getCurrentMethod()   **/ 
        if ( fc.hasParamDesc ) {
          fc.paramDesc.return_cnt = 1 + fc.paramDesc.return_cnt;
          fc.paramDesc.ref_cnt = 1 + fc.paramDesc.ref_cnt;
        }
        const currFn = ctx.getCurrentMethod();
        if ( fc.hasParamDesc ) {
          console.log("cmdReturn move-->")
          const pp = fc.paramDesc;
          pp.moveRefTo(node, currFn, ctx);
        } else {
          console.log("cmdReturn had no param desc")
        }
      }
    }
  }
  cmdAssign (node, ctx, wr) {
    wr.newline();
    const n1 = node.getSecond();
    const n2 = node.getThird();
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
  EnterTemplateClass (node, ctx, wr) {
  }
  EnterClass (node, ctx, wr) {
    if ( (node.children.length) != 3 ) {
      ctx.addError(node, "Invalid class declaration");
      return;
    }
    if ( node.hasBooleanProperty("trait") ) {
      return;
    }
    const cn = node.children[1];
    const cBody = node.children[2];
    const desc = ctx.findClass(cn.vref);
    if ( cn.has_vref_annotation ) {
      console.log("--> generic class, not processed")
      return;
    }
    const subCtx = desc.ctx;
    subCtx.setCurrentClass(desc);
    subCtx.class_level_context = true;
    for ( let i = 0; i < desc.variables.length; i++) {
      var p = desc.variables[i];
      const vNode = p.node;
      if ( (vNode.children.length) > 2 ) {
        const value = vNode.children[2];
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      p.is_class_variable = true;
      p.nameNode.eval_type = p.nameNode.typeNameAsType(ctx);
      p.nameNode.eval_type_name = p.nameNode.type_name;
    }
    for ( let i_1 = 0; i_1 < cBody.children.length; i_1++) {
      var fNode = cBody.children[i_1];
      if ( fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") ) {
        this.WalkNode(fNode, subCtx, wr);
      }
    }
    for ( let i_2 = 0; i_2 < cBody.children.length; i_2++) {
      var fNode_1 = cBody.children[i_2];
      if ( fNode_1.isFirstVref("fn") || fNode_1.isFirstVref("PublicMethod") ) {
        this.WalkNode(fNode_1, subCtx, wr);
      }
    }
    const staticCtx = ctx.fork();
    staticCtx.setCurrentClass(desc);
    for ( let i_3 = 0; i_3 < cBody.children.length; i_3++) {
      var fNode_2 = cBody.children[i_3];
      if ( fNode_2.isFirstVref("sfn") || fNode_2.isFirstVref("StaticMethod") ) {
        this.WalkNode(fNode_2, staticCtx, wr);
      }
    }
    node.hasClassDescription = true;
    node.clDesc = desc;
    desc.classNode = node;
  }
  EnterMethod (node, ctx, wr) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    const cn = node.children[1];
    const fnBody = node.children[3];
    const udesc = ctx.getCurrentClass();
    const desc = udesc;
    const um = desc.findMethod(cn.vref);
    const m = um;
    const subCtx = m.fnCtx;
    subCtx.function_level_context = true;
    subCtx.currentMethod = m;
    for ( let i = 0; i < m.params.length; i++) {
      var v = m.params[i];
      v.nameNode.eval_type = v.nameNode.typeNameAsType(subCtx);
      v.nameNode.eval_type_name = v.nameNode.type_name;
      ctx.hadValidType(v.nameNode);
    }
    subCtx.setInMethod();
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( cn.type_name != "void" ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( let i_1 = 0; i_1 < subCtx.localVarNames.length; i_1++) {
      var n = subCtx.localVarNames[i_1];
      const p = subCtx.localVariables[n];
      if ( p.set_cnt > 0 ) {
        const defNode = p.node;
        defNode.setFlag("mutable");
        const nNode = p.nameNode;
        nNode.setFlag("mutable");
      }
    }
  }
  EnterStaticMethod (node, ctx, wr) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    const cn = node.children[1];
    const fnBody = node.children[3];
    const udesc = ctx.getCurrentClass();
    const desc = udesc;
    const subCtx = ctx.fork();
    subCtx.is_function = true;
    const um = desc.findStaticMethod(cn.vref);
    const m = um;
    subCtx.currentMethod = m;
    subCtx.in_static_method = true;
    m.fnCtx = subCtx;
    if ( cn.hasFlag("weak") ) {
      m.changeStrength(0, 1, node);
    } else {
      m.changeStrength(1, 1, node);
    }
    subCtx.setInMethod();
    for ( let i = 0; i < m.params.length; i++) {
      var v = m.params[i];
      subCtx.defineVariable(v.name, v);
      v.nameNode.eval_type = v.nameNode.typeNameAsType(ctx);
      v.nameNode.eval_type_name = v.nameNode.type_name;
    }
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( cn.type_name != "void" ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( let i_1 = 0; i_1 < subCtx.localVarNames.length; i_1++) {
      var n = subCtx.localVarNames[i_1];
      const p = subCtx.localVariables[n];
      if ( p.set_cnt > 0 ) {
        const defNode = p.node;
        defNode.setFlag("mutable");
        const nNode = p.nameNode;
        nNode.setFlag("mutable");
      }
    }
  }
  EnterLambdaMethod (node, ctx, wr) {
    const args = node.children[1];
    const body = node.children[2];
    const subCtx = ctx.fork();
    subCtx.is_capturing = true;
    const cn = node.children[0];
    const m = new RangerAppFunctionDesc();
    m.name = "lambda";
    m.node = node;
    m.nameNode = node.children[0];
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    if ( cn.hasFlag("weak") ) {
      m.changeStrength(0, 1, node);
    } else {
      m.changeStrength(1, 1, node);
    }
    m.fnBody = node.children[2];
    for ( let ii = 0; ii < args.children.length; ii++) {
      var arg = args.children[ii];
      const p2 = new RangerAppParamDesc();
      p2.name = arg.vref;
      p2.value_type = arg.value_type;
      p2.node = arg;
      p2.nameNode = arg;
      p2.init_cnt = 1;
      p2.refType = 1;
      p2.initRefType = 1;
      if ( args.hasBooleanProperty("strong") ) {
        p2.refType = 2;
        p2.initRefType = 2;
      }
      p2.varType = 4;
      m.params.push(p2);
      arg.hasParamDesc = true;
      arg.paramDesc = p2;
      arg.eval_type = arg.value_type;
      arg.eval_type_name = arg.type_name;
      if ( arg.hasFlag("strong") ) {
        p2.changeStrength(1, 1, p2.nameNode);
      } else {
        arg.setFlag("lives");
        p2.changeStrength(0, 1, p2.nameNode);
      }
      subCtx.defineVariable(p2.name, p2);
    }
    /** unused:  const cnt = body.children.length   **/ 
    for ( let i = 0; i < body.children.length; i++) {
      var item = body.children[i];
      this.WalkNode(item, subCtx, wr);
      if ( i == ((body.children.length) - 1) ) {
        if ( (item.children.length) > 0 ) {
          const fc = item.getFirst();
          if ( fc.vref != "return" ) {
            cn.type_name = "void";
          }
        }
      }
    }
    node.has_lambda = true;
    node.lambda_ctx = subCtx;
    node.eval_type = 15;
    node.eval_function = node;
  }
  EnterVarDef (node, ctx, wr) {
    if ( ctx.isInMethod() ) {
      if ( (node.children.length) > 3 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      if ( (node.children.length) < 2 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      const cn = node.children[1];
      const p = new RangerAppParamDesc();
      let defaultArg;
      if ( (node.children.length) == 2 ) {
        if ( (cn.value_type != 6) && (cn.value_type != 7) ) {
          cn.setFlag("optional");
        }
      }
      if ( (cn.vref.length) == 0 ) {
        ctx.addError(node, "invalid variable definition");
      }
      if ( cn.hasFlag("weak") ) {
        p.changeStrength(0, 1, node);
      } else {
        p.changeStrength(1, 1, node);
      }
      node.hasVarDef = true;
      if ( cn.value_type == 15 ) {
        console.log("Expression node...")
      }
      if ( (node.children.length) > 2 ) {
        p.init_cnt = 1;
        p.def_value = node.children[2];
        p.is_optional = false;
        defaultArg = node.children[2];
        ctx.setInExpr();
        this.WalkNode(defaultArg, ctx, wr);
        ctx.unsetInExpr();
        if ( defaultArg.hasFlag("optional") ) {
          cn.setFlag("optional");
        }
        if ( defaultArg.eval_type == 6 ) {
          node.op_index = 1;
        }
        if ( cn.value_type == 11 ) {
          cn.eval_type_name = defaultArg.ns[0];
        }
        if ( cn.value_type == 12 ) {
          if ( (defaultArg.eval_type != 3) && (defaultArg.eval_type != 12) ) {
            ctx.addError(defaultArg, "Char should be assigned char or integer value --> " + defaultArg.getCode());
          } else {
            defaultArg.eval_type = 12;
          }
        }
      } else {
        if ( ((cn.value_type != 7) && (cn.value_type != 6)) && (false == cn.hasFlag("optional")) ) {
          cn.setFlag("optional");
        }
      }
      if ( (node.children.length) > 2 ) {
        if ( ((cn.type_name.length) == 0) && ((cn.array_type.length) == 0) ) {
          const nodeValue = node.children[2];
          if ( nodeValue.eval_type == 15 ) {
            if ( typeof(node.expression_value) === "undefined" ) {
              const copyOf = nodeValue.rebuildWithType(new RangerArgMatch(), false);
              copyOf.children.pop();
              cn.expression_value = copyOf;
            }
          }
          cn.value_type = nodeValue.eval_type;
          cn.type_name = nodeValue.eval_type_name;
          cn.array_type = nodeValue.eval_array_type;
          cn.key_type = nodeValue.eval_key_type;
        }
      }
      ctx.hadValidType(cn);
      cn.defineNodeTypeTo(cn, ctx);
      p.name = cn.vref;
      if ( p.value_type == 0 ) {
        if ( (0 == (cn.type_name.length)) && (typeof(defaultArg) !== "undefined") ) {
          p.value_type = defaultArg.eval_type;
          cn.type_name = defaultArg.eval_type_name;
          cn.eval_type_name = defaultArg.eval_type_name;
          cn.value_type = defaultArg.eval_type;
        }
      } else {
        p.value_type = cn.value_type;
      }
      p.node = node;
      p.nameNode = cn;
      p.varType = 5;
      if ( cn.has_vref_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
        const ann = cn.vref_annotation;
        if ( (ann.children.length) > 0 ) {
          const fc = ann.children[0];
          ctx.log(node, "ann", (("value of first annotation " + fc.vref) + " and variable name ") + cn.vref);
        }
      }
      if ( cn.has_type_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found annotated reference ");
        const ann_1 = cn.type_annotation;
        if ( (ann_1.children.length) > 0 ) {
          const fc_1 = ann_1.children[0];
          ctx.log(node, "ann", (("value of first annotation " + fc_1.vref) + " and variable name ") + cn.vref);
        }
      }
      cn.hasParamDesc = true;
      cn.ownParamDesc = p;
      cn.paramDesc = p;
      node.hasParamDesc = true;
      node.paramDesc = p;
      cn.eval_type = cn.typeNameAsType(ctx);
      cn.eval_type_name = cn.type_name;
      if ( (node.children.length) > 2 ) {
        if ( cn.eval_type != defaultArg.eval_type ) {
          if ( ((cn.eval_type == 12) && (defaultArg.eval_type == 3)) || ((cn.eval_type == 3) && (defaultArg.eval_type == 12)) ) {
          } else {
            ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn.eval_type) + " vs ") + defaultArg.eval_type);
          }
        }
      } else {
        p.is_optional = true;
      }
      ctx.defineVariable(p.name, p);
      this.DefineVar(node, ctx, wr);
      if ( (node.children.length) > 2 ) {
        this.shouldBeEqualTypes(cn, p.def_value, ctx, "Variable was assigned an incompatible type.");
      }
    } else {
      const cn_1 = node.children[1];
      cn_1.eval_type = cn_1.typeNameAsType(ctx);
      cn_1.eval_type_name = cn_1.type_name;
      this.DefineVar(node, ctx, wr);
      if ( (node.children.length) > 2 ) {
        this.shouldBeEqualTypes(node.children[1], node.children[2], ctx, "Variable was assigned an incompatible type.");
      }
    }
  }
  WalkNodeChildren (node, ctx, wr) {
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.expression ) {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        item.parent = node;
        this.WalkNode(item, ctx, wr);
        node.copyEvalResFrom(item);
      }
    }
  }
  matchNode (node, ctx, wr) {
    if ( 0 == (node.children.length) ) {
      return false;
    }
    const fc = node.getFirst();
    this.stdCommands = ctx.getStdCommands();
    for ( let i = 0; i < this.stdCommands.children.length; i++) {
      var cmd = this.stdCommands.children[i];
      const cmdName = cmd.getFirst();
      if ( cmdName.vref == fc.vref ) {
        this.stdParamMatch(node, ctx, wr);
        if ( typeof(node.parent) !== "undefined" ) {
          node.parent.copyEvalResFrom(node);
        }
        return true;
      }
    }
    return false;
  }
  StartWalk (node, ctx, wr) {
    this.WalkNode(node, ctx, wr);
    for ( let i = 0; i < this.walkAlso.length; i++) {
      var ch = this.walkAlso[i];
      this.WalkNode(ch, ctx, wr);
    }
  }
  WalkNode (node, ctx, wr) {
    /** unused:  const line_index = node.getLine()   **/ 
    if ( node.flow_done ) {
      return true;
    }
    node.flow_done = true;
    this.lastProcessedNode = node;
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
    if ( node.isFirstVref("fun") ) {
      this.EnterLambdaMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("fn") ) {
      if ( ctx.isInMethod() ) {
        this.EnterLambdaMethod(node, ctx, wr);
        return true;
      }
    }
    if ( node.isFirstVref("Extends") ) {
      return true;
    }
    if ( node.isFirstVref("extension") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("operators") ) {
      return true;
    }
    if ( node.isFirstVref("systemclass") ) {
      return true;
    }
    if ( node.isFirstVref("systemunion") ) {
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
    if ( node.isFirstVref("trait") ) {
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
      const fc = node.children[0];
      if ( fc.value_type == 9 ) {
        let was_called = true;
        switch (fc.vref ) { 
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
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        item.parent = node;
        this.WalkNode(item, ctx, wr);
        node.copyEvalResFrom(item);
      }
      return true;
    }
    ctx.addError(node, "Could not understand this part");
    return true;
  }
  mergeImports (node, ctx, wr) {
    if ( node.isFirstVref("Import") ) {
      const fNameNode = node.children[1];
      const import_file = fNameNode.string_value;
      if ( ( typeof(ctx.already_imported[import_file] ) != "undefined" && ctx.already_imported.hasOwnProperty(import_file) ) ) {
        return;
      }
      ctx.already_imported[import_file] = true
      const c = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + import_file , 'utf8'));
      const code = new SourceCode(c);
      code.filename = import_file;
      const parser = new RangerLispParser(code);
      parser.parse();
      node.expression = true;
      node.vref = "";
      node.children.pop();
      node.children.pop();
      const rn = parser.rootNode;
      this.mergeImports(rn, ctx, wr);
      node.children.push(rn);
    } else {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        this.mergeImports(item, ctx, wr);
      }
    }
  }
  CollectMethods (node, ctx, wr) {
    this.WalkCollectMethods(node, ctx, wr);
    for ( let i = 0; i < this.classesWithTraits.length; i++) {
      var point = this.classesWithTraits[i];
      const cl = point.class_def;
      /** unused:  const joinPoint = point.node   **/ 
      const traitClassDef = point.node.children[1];
      const name = traitClassDef.vref;
      const t = ctx.findClass(name);
      if ( (t.extends_classes.length) > 0 ) {
        ctx.addError(point.node, ("Can not join class " + name) + " because it is inherited. Currently on base classes can be used as traits.");
        continue;
      }
      if ( t.has_constructor ) {
        ctx.addError(point.node, ("Can not join class " + name) + " because it has a constructor function");
      } else {
        const origBody = cl.node.children[2];
        const match = new RangerArgMatch();
        const params = t.node.getExpressionProperty("params");
        const initParams = point.node.getExpressionProperty("params");
        if ( (typeof(params) !== "undefined") && (typeof(initParams) !== "undefined") ) {
          for ( let i_1 = 0; i_1 < params.children.length; i_1++) {
            var typeName = params.children[i_1];
            const pArg = initParams.children[i_1];
            match.add(typeName.vref, pArg.vref, ctx);
          }
        } else {
          match.add("T", cl.name, ctx);
        }
        ctx.setCurrentClass(cl);
        const traitClass = ctx.findClass(traitClassDef.vref);
        for ( let i_2 = 0; i_2 < traitClass.variables.length; i_2++) {
          var pvar = traitClass.variables[i_2];
          const ccopy = pvar.node.rebuildWithType(match, true);
          this.WalkCollectMethods(ccopy, ctx, wr);
          origBody.children.push(ccopy);
        }
        for ( let i_3 = 0; i_3 < traitClass.defined_variants.length; i_3++) {
          var fnVar = traitClass.defined_variants[i_3];
          const mVs = traitClass.method_variants[fnVar];
          for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
            var variant = mVs.variants[i_4];
            const ccopy_1 = variant.node.rebuildWithType(match, true);
            this.WalkCollectMethods(ccopy_1, ctx, wr);
            origBody.children.push(ccopy_1);
          }
        }
      }
    }
    for ( let i_5 = 0; i_5 < this.serializedClasses.length; i_5++) {
      var cl_1 = this.serializedClasses[i_5];
      cl_1.is_serialized = true;
      const ser = new RangerSerializeClass();
      const extWr = new CodeWriter();
      ser.createJSONSerializerFn(cl_1, cl_1.ctx, extWr);
      const theCode = extWr.getCode();
      const code = new SourceCode(theCode);
      code.filename = "extension " + ctx.currentClass.name;
      const parser = new RangerLispParser(code);
      parser.parse();
      const rn = parser.rootNode;
      this.WalkCollectMethods(rn, cl_1.ctx, wr);
      this.walkAlso.push(rn);
    }
  }
  WalkCollectMethods (node, ctx, wr) {
    let find_more = true;
    if ( node.isFirstVref("systemunion") ) {
      const nameNode = node.getSecond();
      const instances = node.getThird();
      const new_class = new RangerAppClassDesc();
      new_class.name = nameNode.vref;
      new_class.nameNode = nameNode;
      ctx.addClass(nameNode.vref, new_class);
      new_class.is_system_union = true;
      for ( let i = 0; i < instances.children.length; i++) {
        var ch = instances.children[i];
        new_class.is_union_of.push(ch.vref);
      }
      nameNode.clDesc = new_class;
      return;
    }
    if ( node.isFirstVref("systemclass") ) {
      const nameNode_1 = node.getSecond();
      const instances_1 = node.getThird();
      const new_class_1 = new RangerAppClassDesc();
      new_class_1.name = nameNode_1.vref;
      new_class_1.nameNode = nameNode_1;
      ctx.addClass(nameNode_1.vref, new_class_1);
      new_class_1.is_system = true;
      for ( let i_1 = 0; i_1 < instances_1.children.length; i_1++) {
        var ch_1 = instances_1.children[i_1];
        const langName = ch_1.getFirst();
        const langClassName = ch_1.getSecond();
        new_class_1.systemNames[langName.vref] = langClassName.vref
      }
      nameNode_1.is_system_class = true;
      nameNode_1.clDesc = new_class_1;
      return;
    }
    if ( node.isFirstVref("Extends") ) {
      const extList = node.children[1];
      const currC = ctx.currentClass;
      for ( let ii = 0; ii < extList.children.length; ii++) {
        var ee = extList.children[ii];
        currC.addParentClass(ee.vref);
        const ParentClass = ctx.findClass(ee.vref);
        ParentClass.is_inherited = true;
      }
    }
    if ( node.isFirstVref("Constructor") ) {
      const currC_1 = ctx.currentClass;
      const subCtx = currC_1.ctx.fork();
      currC_1.has_constructor = true;
      currC_1.constructor_node = node;
      const m = new RangerAppFunctionDesc();
      m.name = "Constructor";
      m.node = node;
      m.nameNode = node.children[0];
      m.fnBody = node.children[2];
      m.fnCtx = subCtx;
      const args = node.children[1];
      for ( let ii_1 = 0; ii_1 < args.children.length; ii_1++) {
        var arg = args.children[ii_1];
        const p = new RangerAppParamDesc();
        p.name = arg.vref;
        p.value_type = arg.value_type;
        p.node = arg;
        p.nameNode = arg;
        p.refType = 1;
        p.varType = 4;
        m.params.push(p);
        arg.hasParamDesc = true;
        arg.paramDesc = p;
        arg.eval_type = arg.value_type;
        arg.eval_type_name = arg.type_name;
        subCtx.defineVariable(p.name, p);
      }
      currC_1.constructor_fn = m;
      find_more = false;
    }
    if ( node.isFirstVref("trait") ) {
      const s = node.getVRefAt(1);
      const classNameNode = node.getSecond();
      const new_class_2 = new RangerAppClassDesc();
      new_class_2.name = s;
      const subCtx_1 = ctx.fork();
      ctx.setCurrentClass(new_class_2);
      subCtx_1.setCurrentClass(new_class_2);
      new_class_2.ctx = subCtx_1;
      new_class_2.nameNode = classNameNode;
      ctx.addClass(s, new_class_2);
      new_class_2.classNode = node;
      new_class_2.node = node;
      new_class_2.is_trait = true;
    }
    if ( node.isFirstVref("CreateClass") || node.isFirstVref("class") ) {
      const s_1 = node.getVRefAt(1);
      const classNameNode_1 = node.getSecond();
      if ( classNameNode_1.has_vref_annotation ) {
        console.log("%% vref_annotation")
        const ann = classNameNode_1.vref_annotation;
        console.log((classNameNode_1.vref + " : ") + ann.getCode())
        ctx.addTemplateClass(classNameNode_1.vref, node);
        find_more = false;
      } else {
        const new_class_3 = new RangerAppClassDesc();
        new_class_3.name = s_1;
        const subCtx_2 = ctx.fork();
        ctx.setCurrentClass(new_class_3);
        subCtx_2.setCurrentClass(new_class_3);
        new_class_3.ctx = subCtx_2;
        new_class_3.nameNode = classNameNode_1;
        ctx.addClass(s_1, new_class_3);
        new_class_3.classNode = node;
        new_class_3.node = node;
        if ( node.hasBooleanProperty("trait") ) {
          new_class_3.is_trait = true;
        }
      }
    }
    if ( node.isFirstVref("TemplateClass") ) {
      const s_2 = node.getVRefAt(1);
      ctx.addTemplateClass(s_2, node);
      find_more = false;
    }
    if ( node.isFirstVref("Extends") ) {
      const list = node.children[1];
      for ( let i_2 = 0; i_2 < list.children.length; i_2++) {
        var cname = list.children[i_2];
        const extC = ctx.findClass(cname.vref);
        for ( let i_3 = 0; i_3 < extC.variables.length; i_3++) {
          var vv = extC.variables[i_3];
          const currC_2 = ctx.currentClass;
          const subCtx_3 = currC_2.ctx;
          subCtx_3.defineVariable(vv.name, vv);
        }
      }
      find_more = false;
    }
    if ( node.isFirstVref("def") || node.isFirstVref("let") ) {
      const s_3 = node.getVRefAt(1);
      const vDef = node.children[1];
      const p_1 = new RangerAppParamDesc();
      if ( s_3 != ctx.transformWord(s_3) ) {
        ctx.addError(node, ("Can not use reserved word " + s_3) + " as class propery");
      }
      p_1.name = s_3;
      p_1.value_type = vDef.value_type;
      p_1.node = node;
      p_1.is_class_variable = true;
      p_1.varType = 8;
      p_1.node = node;
      p_1.nameNode = vDef;
      vDef.hasParamDesc = true;
      vDef.ownParamDesc = p_1;
      vDef.paramDesc = p_1;
      node.hasParamDesc = true;
      node.paramDesc = p_1;
      if ( vDef.hasFlag("weak") ) {
        p_1.changeStrength(0, 2, p_1.nameNode);
      } else {
        p_1.changeStrength(2, 2, p_1.nameNode);
      }
      if ( (node.children.length) > 2 ) {
        p_1.set_cnt = 1;
        p_1.init_cnt = 1;
        p_1.def_value = node.children[2];
        p_1.is_optional = false;
        if ( p_1.def_value.value_type == 4 ) {
          vDef.type_name = "string";
        }
        if ( p_1.def_value.value_type == 3 ) {
          vDef.type_name = "int";
        }
        if ( p_1.def_value.value_type == 2 ) {
          vDef.type_name = "double";
        }
        if ( p_1.def_value.value_type == 5 ) {
          vDef.type_name = "boolean";
        }
      } else {
        p_1.is_optional = true;
        if ( false == ((vDef.value_type == 6) || (vDef.value_type == 7)) ) {
          vDef.setFlag("optional");
        }
      }
      const currC_3 = ctx.currentClass;
      currC_3.addVariable(p_1);
      const subCtx_4 = currC_3.ctx;
      subCtx_4.defineVariable(p_1.name, p_1);
      p_1.is_class_variable = true;
    }
    if ( node.isFirstVref("operators") ) {
      const listOf = node.getSecond();
      for ( let i_4 = 0; i_4 < listOf.children.length; i_4++) {
        var item = listOf.children[i_4];
        ctx.createOperator(item);
      }
      find_more = false;
    }
    if ( node.isFirstVref("Import") || node.isFirstVref("import") ) {
      const fNameNode = node.children[1];
      const import_file = fNameNode.string_value;
      if ( ( typeof(ctx.already_imported[import_file] ) != "undefined" && ctx.already_imported.hasOwnProperty(import_file) ) ) {
        return;
      } else {
        ctx.already_imported[import_file] = true
      }
      const c = (require('fs').readFileSync( process.cwd() + '/' + "." + '/' + import_file , 'utf8'));
      const code = new SourceCode(c);
      code.filename = import_file;
      const parser = new RangerLispParser(code);
      parser.parse();
      const rnode = parser.rootNode;
      this.WalkCollectMethods(rnode, ctx, wr);
      find_more = false;
    }
    if ( node.isFirstVref("does") ) {
      const defName = node.getSecond();
      const currC_4 = ctx.currentClass;
      currC_4.consumes_traits.push(defName.vref);
      const joinPoint = new ClassJoinPoint();
      joinPoint.class_def = currC_4;
      joinPoint.node = node;
      this.classesWithTraits.push(joinPoint);
    }
    if ( node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") ) {
      const s_4 = node.getVRefAt(1);
      const currC_5 = ctx.currentClass;
      const m_1 = new RangerAppFunctionDesc();
      m_1.name = s_4;
      m_1.compiledName = ctx.transformWord(s_4);
      m_1.node = node;
      m_1.is_static = true;
      m_1.nameNode = node.children[1];
      m_1.nameNode.ifNoTypeSetToVoid();
      const args_1 = node.children[2];
      m_1.fnBody = node.children[3];
      for ( let ii_2 = 0; ii_2 < args_1.children.length; ii_2++) {
        var arg_1 = args_1.children[ii_2];
        const p_2 = new RangerAppParamDesc();
        p_2.name = arg_1.vref;
        p_2.value_type = arg_1.value_type;
        p_2.node = arg_1;
        p_2.init_cnt = 1;
        p_2.nameNode = arg_1;
        p_2.refType = 1;
        p_2.varType = 4;
        m_1.params.push(p_2);
        arg_1.hasParamDesc = true;
        arg_1.paramDesc = p_2;
        arg_1.eval_type = arg_1.value_type;
        arg_1.eval_type_name = arg_1.type_name;
        if ( arg_1.hasFlag("strong") ) {
          p_2.changeStrength(1, 1, p_2.nameNode);
        } else {
          arg_1.setFlag("lives");
          p_2.changeStrength(0, 1, p_2.nameNode);
        }
      }
      currC_5.addStaticMethod(m_1);
      find_more = false;
    }
    if ( node.isFirstVref("extension") ) {
      const s_5 = node.getVRefAt(1);
      const old_class = ctx.findClass(s_5);
      ctx.setCurrentClass(old_class);
      console.log("extension for " + s_5)
    }
    if ( node.isFirstVref("PublicMethod") || node.isFirstVref("fn") ) {
      const cn = node.getSecond();
      const s_6 = node.getVRefAt(1);
      cn.ifNoTypeSetToVoid();
      const currC_6 = ctx.currentClass;
      if ( currC_6.hasOwnMethod(s_6) ) {
        ctx.addError(node, "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!");
        return;
      }
      if ( cn.hasFlag("main") ) {
        ctx.addError(node, "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.");
        return;
      }
      const m_2 = new RangerAppFunctionDesc();
      m_2.name = s_6;
      m_2.compiledName = ctx.transformWord(s_6);
      m_2.node = node;
      m_2.nameNode = node.children[1];
      if ( node.hasBooleanProperty("strong") ) {
        m_2.refType = 2;
      } else {
        m_2.refType = 1;
      }
      const subCtx_5 = currC_6.ctx.fork();
      subCtx_5.is_function = true;
      subCtx_5.currentMethod = m_2;
      m_2.fnCtx = subCtx_5;
      if ( cn.hasFlag("weak") ) {
        m_2.changeStrength(0, 1, node);
      } else {
        m_2.changeStrength(1, 1, node);
      }
      const args_2 = node.children[2];
      m_2.fnBody = node.children[3];
      for ( let ii_3 = 0; ii_3 < args_2.children.length; ii_3++) {
        var arg_2 = args_2.children[ii_3];
        const p2 = new RangerAppParamDesc();
        p2.name = arg_2.vref;
        p2.value_type = arg_2.value_type;
        p2.node = arg_2;
        p2.nameNode = arg_2;
        p2.init_cnt = 1;
        p2.refType = 1;
        p2.initRefType = 1;
        p2.debugString = "--> collected ";
        if ( args_2.hasBooleanProperty("strong") ) {
          p2.debugString = "--> collected as STRONG";
          ctx.log(node, "memory5", "strong param should move local ownership to call ***");
          p2.refType = 2;
          p2.initRefType = 2;
        }
        p2.varType = 4;
        m_2.params.push(p2);
        arg_2.hasParamDesc = true;
        arg_2.paramDesc = p2;
        arg_2.eval_type = arg_2.value_type;
        arg_2.eval_type_name = arg_2.type_name;
        if ( arg_2.hasFlag("strong") ) {
          p2.changeStrength(1, 1, p2.nameNode);
        } else {
          arg_2.setFlag("lives");
          p2.changeStrength(0, 1, p2.nameNode);
        }
        subCtx_5.defineVariable(p2.name, p2);
      }
      currC_6.addMethod(m_2);
      find_more = false;
    }
    if ( find_more ) {
      for ( let i_5 = 0; i_5 < node.children.length; i_5++) {
        var item_1 = node.children[i_5];
        this.WalkCollectMethods(item_1, ctx, wr);
      }
    }
    if ( node.hasBooleanProperty("serialize") ) {
      this.serializedClasses.push(ctx.currentClass);
    }
  }
  FindWeakRefs (node, ctx, wr) {
    const list = ctx.getClasses();
    for ( let i = 0; i < list.length; i++) {
      var classDesc = list[i];
      for ( let i2 = 0; i2 < classDesc.variables.length; i2++) {
        var varD = classDesc.variables[i2];
        if ( varD.refType == 1 ) {
          if ( varD.isArray() ) {
            /** unused:  const nn = varD.nameNode   **/ 
          }
          if ( varD.isHash() ) {
            /** unused:  const nn_1 = varD.nameNode   **/ 
          }
          if ( varD.isObject() ) {
            /** unused:  const nn_2 = varD.nameNode   **/ 
          }
        }
      }
    }
  }
  findFunctionDesc (obj, ctx, wr) {
    let varDesc;
    let varFnDesc;
    if ( obj.vref != this.getThisName() ) {
      if ( (obj.ns.length) > 1 ) {
        const cnt = obj.ns.length;
        let classRefDesc;
        let classDesc;
        for ( let i = 0; i < obj.ns.length; i++) {
          var strname = obj.ns[i];
          if ( i == 0 ) {
            if ( strname == this.getThisName() ) {
              classDesc = ctx.getCurrentClass();
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc = ctx.findClass(strname);
                continue;
              }
              classRefDesc = ctx.getVariableDef(strname);
              if ( (typeof(classRefDesc) === "undefined") || (typeof(classRefDesc.nameNode) === "undefined") ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              classRefDesc.ref_cnt = 1 + classRefDesc.ref_cnt;
              classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
              if ( typeof(classDesc) === "undefined" ) {
                return varFnDesc;
              }
            }
          } else {
            if ( typeof(classDesc) === "undefined" ) {
              return varFnDesc;
            }
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              const subClass = varDesc.getTypeName();
              classDesc = ctx.findClass(subClass);
              continue;
            }
            if ( typeof(classDesc) !== "undefined" ) {
              varFnDesc = classDesc.findMethod(strname);
              if ( typeof(varFnDesc) === "undefined" ) {
                varFnDesc = classDesc.findStaticMethod(strname);
                if ( typeof(varFnDesc) === "undefined" ) {
                  ctx.addError(obj, " function variable not found " + strname);
                }
              }
            }
          }
        }
        return varFnDesc;
      }
      const udesc = ctx.getCurrentClass();
      const currClass = udesc;
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
  findParamDesc (obj, ctx, wr) {
    let varDesc;
    let set_nsp = false;
    let classDesc;
    if ( 0 == (obj.nsp.length) ) {
      set_nsp = true;
    }
    if ( obj.vref != this.getThisName() ) {
      if ( (obj.ns.length) > 1 ) {
        const cnt = obj.ns.length;
        let classRefDesc;
        for ( let i = 0; i < obj.ns.length; i++) {
          var strname = obj.ns[i];
          if ( i == 0 ) {
            if ( strname == this.getThisName() ) {
              classDesc = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.push(classDesc);
              }
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc = ctx.findClass(strname);
                if ( set_nsp ) {
                  obj.nsp.push(classDesc);
                }
                continue;
              }
              classRefDesc = ctx.getVariableDef(strname);
              if ( typeof(classRefDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              if ( set_nsp ) {
                obj.nsp.push(classRefDesc);
              }
              classRefDesc.ref_cnt = 1 + classRefDesc.ref_cnt;
              classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              const subClass = varDesc.getTypeName();
              classDesc = ctx.findClass(subClass);
              if ( set_nsp ) {
                obj.nsp.push(varDesc);
              }
              continue;
            }
            if ( typeof(classDesc) !== "undefined" ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                let classMethod = classDesc.findMethod(strname);
                if ( typeof(classMethod) === "undefined" ) {
                  classMethod = classDesc.findStaticMethod(strname);
                  if ( typeof(classMethod) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname);
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
                obj.nsp.push(varDesc);
              }
            }
          }
        }
        return varDesc;
      }
      varDesc = ctx.getVariableDef(obj.vref);
      if ( typeof(varDesc.nameNode) !== "undefined" ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref)
        if ( typeof(varDesc) !== "undefined" ) {
          console.log("Vardesc was found though..." + varDesc.name)
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return varDesc;
    }
    const cc = ctx.getCurrentClass();
    return cc;
  }
  areEqualTypes (n1, n2, ctx) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length) > 0)) && ((n2.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        let b_ok = false;
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
          const c1 = ctx.findClass(n1.eval_type_name);
          const c2 = ctx.findClass(n2.eval_type_name);
          if ( c1.isSameOrParentClass(n2.eval_type_name, ctx) ) {
            return true;
          }
          if ( c2.isSameOrParentClass(n1.eval_type_name, ctx) ) {
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
  shouldBeEqualTypes (n1, n2, ctx, msg) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length) > 0)) && ((n2.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        let b_ok = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(n2.eval_type_name) ) {
          const cc = ctx.findClass(n2.eval_type_name);
          if ( cc.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            b_ok = true;
          }
        }
        if ( (n1.eval_type_name == "char") && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "int") && (n2.eval_type_name == "char") ) {
          b_ok = true;
        }
        if ( b_ok == false ) {
          ctx.addError(n1, (((("Type mismatch " + n2.eval_type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
  shouldBeExpression (n1, ctx, msg) {
    if ( n1.expression == false ) {
      ctx.addError(n1, msg);
    }
  }
  shouldHaveChildCnt (cnt, n1, ctx, msg) {
    if ( (n1.children.length) != cnt ) {
      ctx.addError(n1, msg);
    }
  }
  shouldBeNumeric (n1, ctx, msg) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length) > 0) ) {
      if ( false == ((n1.eval_type_name == "double") || (n1.eval_type_name == "int")) ) {
        ctx.addError(n1, (("Not numeric: " + n1.eval_type_name) + ". ") + msg);
      }
    }
  }
  shouldBeArray (n1, ctx, msg) {
    if ( n1.eval_type != 6 ) {
      ctx.addError(n1, "Expecting array. " + msg);
    }
  }
  shouldBeType (type_name, n1, ctx, msg) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length) > 0) ) {
      if ( n1.eval_type_name == type_name ) {
      } else {
        let b_ok = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "char") && (type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "int") && (type_name == "char") ) {
          b_ok = true;
        }
        if ( b_ok == false ) {
          ctx.addError(n1, (((("Type mismatch " + type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
}
class NodeEvalState  {
  constructor() {
    this.is_running = false;     /** note: unused */
    this.child_index = -1;     /** note: unused */
    this.cmd_index = -1;     /** note: unused */
    this.is_ready = false;     /** note: unused */
    this.is_waiting = false;     /** note: unused */
    this.exit_after = false;     /** note: unused */
    this.expand_args = false;     /** note: unused */
    this.ask_expand = false;     /** note: unused */
    this.eval_rest = false;     /** note: unused */
    this.exec_cnt = 0;     /** note: unused */
    this.b_debugger = false;     /** note: unused */
    this.b_top_node = false;     /** note: unused */
    this.ask_eval = false;     /** note: unused */
    this.param_eval_on = false;     /** note: unused */
    this.eval_index = -1;     /** note: unused */
    this.eval_end_index = -1;     /** note: unused */
    this.ask_eval_start = 0;     /** note: unused */
    this.ask_eval_end = 0;     /** note: unused */
  }
}
class RangerGenericClassWriter  {
  constructor() {
  }
  EncodeString (node, ctx, wr) {
    /** unused:  const encoded_str = ""   **/ 
    const str_length = node.string_value.length;
    let encoded_str_2 = "";
    let ii = 0;
    while (ii < str_length) {
      const cc = node.string_value.charCodeAt(ii );
      switch (cc ) { 
        case 8 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 92 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        default: 
          encoded_str_2 = encoded_str_2 + (String.fromCharCode(cc));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  CustomOperator (node, ctx, wr) {
  }
  WriteSetterVRef (node, ctx, wr) {
  }
  writeArrayTypeDef (node, ctx, wr) {
  }
  WriteEnum (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      const rootObjName = node.ns[0];
      const e = ctx.getEnum(rootObjName);
      if ( typeof(e) !== "undefined" ) {
        const enumName = node.ns[1];
        wr.out("" + ((e.values[enumName])), false);
      } else {
        if ( node.hasParamDesc ) {
          const pp = node.paramDesc;
          const nn = pp.nameNode;
          this.WriteVRef(nn, ctx, wr);
        }
      }
    }
  }
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        const s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
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
  getTypeString (type_string) {
    return type_string;
  }
  import_lib (lib_name, ctx, wr) {
    wr.addImport(lib_name);
  }
  getObjectTypeString (type_string, ctx) {
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
  release_local_vars (node, ctx, wr) {
    for ( let i = 0; i < ctx.localVarNames.length; i++) {
      var n = ctx.localVarNames[i];
      const p = ctx.localVariables[n];
      if ( p.ref_cnt == 0 ) {
        continue;
      }
      if ( p.isAllocatedType() ) {
        if ( 1 == p.getStrength() ) {
          if ( p.nameNode.eval_type == 7 ) {
          }
          if ( p.nameNode.eval_type == 6 ) {
          }
          if ( (p.nameNode.eval_type != 6) && (p.nameNode.eval_type != 7) ) {
          }
        }
        if ( 0 == p.getStrength() ) {
          if ( p.nameNode.eval_type == 7 ) {
          }
          if ( p.nameNode.eval_type == 6 ) {
          }
          if ( (p.nameNode.eval_type != 6) && (p.nameNode.eval_type != 7) ) {
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
  WalkNode (node, ctx, wr) {
    this.compiler.WalkNode(node, ctx, wr);
  }
  writeTypeDef (node, ctx, wr) {
    wr.out(node.type_name, false);
  }
  writeRawTypeDef (node, ctx, wr) {
    this.writeTypeDef(node, ctx, wr);
  }
  adjustType (tn) {
    return tn;
  }
  WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
      }
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const p = node.paramDesc;
      if ( p.set_cnt > 0 ) {
        wr.out("var " + p.name, false);
      } else {
        wr.out("const " + p.name, false);
      }
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out(";", true);
      }
    }
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const args = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, ctx, wr);
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const args = node.children[1];
    const body = node.children[2];
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
    }
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        this.WalkNode(n, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out("new " + node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  writeInterface (cl, ctx, wr) {
  }
  disabledVarDef (node, ctx, wr) {
  }
  writeClass (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    wr.out(("class " + cl.name) + " { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      wr.out(((("/* var " + pvar.name) + " => ") + pvar.nameNode.parent.getCode()) + " */ ", true);
    }
    for ( let i_1 = 0; i_1 < cl.static_methods.length; i_1++) {
      var pvar_1 = cl.static_methods[i_1];
      wr.out(("/* static " + pvar_1.name) + " */ ", true);
    }
    for ( let i_2 = 0; i_2 < cl.defined_variants.length; i_2++) {
      var fnVar = cl.defined_variants[i_2];
      const mVs = cl.method_variants[fnVar];
      for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
        var variant = mVs.variants[i_3];
        wr.out(("function " + variant.name) + "() {", true);
        wr.indent(1);
        wr.newline();
        const subCtx = ctx.fork();
        this.WalkNode(variant.fnBody, subCtx, wr);
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
  constructor() {
    super()
    this.signatures = {};
    this.signature_cnt = 0;
    this.iface_created = {};
  }
  getSignatureInterface (s) {
    const idx = this.signatures[s];
    if ( typeof(idx) !== "undefined" ) {
      return "LambdaSignature" + (idx);
    }
    this.signature_cnt = this.signature_cnt + 1;
    this.signatures[s] = this.signature_cnt
    return "LambdaSignature" + this.signature_cnt;
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
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
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
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
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.addImport("java.util.Optional");
      wr.out("Optional<", false);
      switch (v_type ) { 
        case 15 : 
          const sig = this.buildLambdaSignature((node.expression_value));
          const iface_name = this.getSignatureInterface(sig);
          wr.out(iface_name, false);
          if ( (( typeof(this.iface_created[iface_name] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name) )) == false ) {
            const fnNode = node.expression_value.children[0];
            const args = node.expression_value.children[1];
            this.iface_created[iface_name] = true
            const utilWr = wr.getFileWriter(".", (iface_name + ".java"));
            utilWr.out(("public interface " + iface_name) + " { ", true);
            utilWr.indent(1);
            utilWr.out("public ", false);
            this.writeTypeDef(fnNode, ctx, utilWr);
            utilWr.out(" run(", false);
            for ( let i = 0; i < args.children.length; i++) {
              var arg = args.children[i];
              if ( i > 0 ) {
                utilWr.out(", ", false);
              }
              this.writeTypeDef(arg, ctx, utilWr);
              utilWr.out(" ", false);
              utilWr.out(arg.vref, false);
            }
            utilWr.out(");", true);
            utilWr.indent(-1);
            utilWr.out("}", true);
          }
          break;
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
          wr.out("byte", false);
          break;
        case 13 : 
          wr.out("byte[]", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
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
        case 15 : 
          const sig_1 = this.buildLambdaSignature((node.expression_value));
          const iface_name_1 = this.getSignatureInterface(sig_1);
          wr.out(iface_name_1, false);
          if ( (( typeof(this.iface_created[iface_name_1] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name_1) )) == false ) {
            const fnNode_1 = node.expression_value.children[0];
            const args_1 = node.expression_value.children[1];
            this.iface_created[iface_name_1] = true
            const utilWr_1 = wr.getFileWriter(".", (iface_name_1 + ".java"));
            utilWr_1.out(("public interface " + iface_name_1) + " { ", true);
            utilWr_1.indent(1);
            utilWr_1.out("public ", false);
            this.writeTypeDef(fnNode_1, ctx, utilWr_1);
            utilWr_1.out(" run(", false);
            for ( let i_1 = 0; i_1 < args_1.children.length; i_1++) {
              var arg_1 = args_1.children[i_1];
              if ( i_1 > 0 ) {
                utilWr_1.out(", ", false);
              }
              this.writeTypeDef(arg_1, ctx, utilWr_1);
              utilWr_1.out(" ", false);
              utilWr_1.out(arg_1.vref, false);
            }
            utilWr_1.out(");", true);
            utilWr_1.indent(-1);
            utilWr_1.out("}", true);
          }
          break;
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
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
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
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    const max_len = node.ns.length;
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( i < (max_len - 1) ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out(".get()", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_1 = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_1), false);
    }
  }
  disabledVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        let b_was_set = false;
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("final ", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        let b_was_set = false;
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.name) + " ", false);
    }
  }
  CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "return" ) {
      wr.newline();
      if ( (node.children.length) > 1 ) {
        const value = node.getSecond();
        if ( value.hasParamDesc ) {
          const nn = value.paramDesc.nameNode;
          if ( ctx.isDefinedClass(nn.type_name) ) {
            /** unused:  const cl = ctx.findClass(nn.type_name)   **/ 
            const activeFn = ctx.getCurrentMethod();
            const fnNameNode = activeFn.nameNode;
            if ( fnNameNode.hasFlag("optional") ) {
              wr.out("return Optional.ofNullable((", false);
              this.WalkNode(value, ctx, wr);
              wr.out(".isPresent() ? (", false);
              wr.out(fnNameNode.type_name, false);
              wr.out(")", false);
              this.WalkNode(value, ctx, wr);
              wr.out(".get() : null ) );", true);
              return;
            }
          }
        }
        wr.out("return ", false);
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out("return;", true);
      }
    }
  }
  buildLambdaSignature (node) {
    const exp = node;
    let exp_s = "";
    const fc = exp.getFirst();
    const args = exp.getSecond();
    exp_s = exp_s + fc.buildTypeSignature();
    exp_s = exp_s + "(";
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      exp_s = exp_s + arg.buildTypeSignature();
      exp_s = exp_s + ",";
    }
    exp_s = exp_s + ")";
    return exp_s;
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    const param = ctx.getVariableDef(fName.vref);
    const args = param.nameNode.expression_value.children[1];
    wr.out(".run(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(n, ctx, wr);
      }
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(");", true);
    } else {
      wr.out(")", false);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnNode = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    const sig = this.buildLambdaSignature(node);
    const iface_name = this.getSignatureInterface(sig);
    if ( (( typeof(this.iface_created[iface_name] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name) )) == false ) {
      this.iface_created[iface_name] = true
      const utilWr = wr.getFileWriter(".", (iface_name + ".java"));
      utilWr.out(("public interface " + iface_name) + " { ", true);
      utilWr.indent(1);
      utilWr.out("public ", false);
      this.writeTypeDef(fnNode, ctx, utilWr);
      utilWr.out(" run(", false);
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          utilWr.out(", ", false);
        }
        this.writeTypeDef(arg, lambdaCtx, utilWr);
        utilWr.out(" ", false);
        utilWr.out(arg.vref, false);
      }
      utilWr.out(");", true);
      utilWr.indent(-1);
      utilWr.out("}", true);
    }
    wr.out(("new " + iface_name) + "() { ", true);
    wr.indent(1);
    wr.out("public ", false);
    this.writeTypeDef(fnNode, ctx, wr);
    wr.out(" run(", false);
    for ( let i_1 = 0; i_1 < args.children.length; i_1++) {
      var arg_1 = args.children[i_1];
      if ( i_1 > 0 ) {
        wr.out(", ", false);
      }
      this.writeTypeDef(arg_1, lambdaCtx, wr);
      wr.out(" ", false);
      wr.out(arg_1.vref, false);
    }
    wr.out(") {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_2 = 0; i_2 < body.children.length; i_2++) {
      var item = body.children[i_2];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    for ( let i_3 = 0; i_3 < lambdaCtx.captured_variables.length; i_3++) {
      var cname = lambdaCtx.captured_variables[i_3];
      wr.out("// captured var " + cname, true);
    }
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", false);
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    let declaredVariable = {};
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true
        }
      }
    }
    const wr = orig_wr.getFileWriter(".", (cl.name + ".java"));
    const importFork = wr.fork();
    for ( let i_2 = 0; i_2 < cl.capturedLocals.length; i_2++) {
      var dd = cl.capturedLocals[i_2];
      if ( dd.is_class_variable == false ) {
        wr.out("// local captured " + dd.name, true);
        console.log("java captured")
        console.log(dd.node.getLineAsString())
        dd.node.disabled_node = true;
        cl.addVariable(dd);
        const csubCtx = cl.ctx;
        csubCtx.defineVariable(dd.name, dd);
        dd.is_class_variable = true;
      }
    }
    wr.out("", true);
    wr.out("class " + cl.name, false);
    let parentClass;
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" extends ", false);
      for ( let i_3 = 0; i_3 < cl.extends_classes.length; i_3++) {
        var pName_1 = cl.extends_classes[i_3];
        wr.out(pName_1, false);
        parentClass = ctx.findClass(pName_1);
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.createTag("utilities");
    for ( let i_4 = 0; i_4 < cl.variables.length; i_4++) {
      var pvar_1 = cl.variables[i_4];
      if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
        continue;
      }
      wr.out("public ", false);
      this.writeVarDef(pvar_1.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("", true);
      wr.out(cl.name + "(", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_5 = 0; i_5 < cl.static_methods.length; i_5++) {
      var variant = cl.static_methods[i_5];
      wr.out("", true);
      if ( variant.nameNode.hasFlag("main") && (variant.nameNode.code.filename != ctx.getRootFile()) ) {
        continue;
      }
      if ( variant.nameNode.hasFlag("main") ) {
        wr.out("public static void main(String [] args ) {", true);
      } else {
        wr.out("public static ", false);
        this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_6 = 0; i_6 < cl.defined_variants.length; i_6++) {
      var fnVar = cl.defined_variants[i_6];
      const mVs = cl.method_variants[fnVar];
      for ( let i_7 = 0; i_7 < mVs.variants.length; i_7++) {
        var variant_1 = mVs.variants[i_7];
        wr.out("", true);
        wr.out("public ", false);
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant_1.compiledName + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i_8 = 0; i_8 < import_list.length; i_8++) {
      var codeStr = import_list[i_8];
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
class RangerSwift3ClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.header_created = false;
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
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
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
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
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type ) { 
      case 15 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          wr.out(" _ : ", false);
          this.writeTypeDef(arg, ctx, wr);
        }
        wr.out(") -> ", false);
        this.writeTypeDef(rv, ctx, wr);
        break;
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
        wr.out(((("[" + this.getObjectTypeString(k_name, ctx)) + ":") + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      case 6 : 
        wr.out(("[" + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      default: 
        if ( t_name == "void" ) {
          wr.out("Void", false);
          return;
        }
        wr.out(this.getTypeString(t_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  WriteEnum (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      const rootObjName = node.ns[0];
      const e = ctx.getEnum(rootObjName);
      if ( typeof(e) !== "undefined" ) {
        const enumName = node.ns[1];
        wr.out("" + ((e.values[enumName])), false);
      } else {
        if ( node.hasParamDesc ) {
          const pp = node.paramDesc;
          const nn = pp.nameNode;
          wr.out(nn.vref, false);
        }
      }
    }
  }
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("self", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    const max_len = node.ns.length;
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out("self", false);
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( i < (max_len - 1) ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out("!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_1 = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_1), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out(("var " + p.compiledName) + " : ", false);
      } else {
        wr.out(("let " + p.compiledName) + " : ", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name + " : ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
    }
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      const fnName = node.fnDesc.nameNode;
      if ( ctx.expressionLevel() == 0 ) {
        if ( fnName.type_name != "void" ) {
          wr.out("_ = ", false);
        }
      }
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      const givenArgs = node.getSecond();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        wr.out(arg.name + " : ", false);
        this.WalkNode(n, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    const param = ctx.getVariableDef(fName.vref);
    const args = param.nameNode.expression_value.children[1];
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(n, ctx, wr);
      }
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out("", true);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnNode = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    wr.out("{ (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.vref, false);
    }
    wr.out(") ->  ", false);
    this.writeTypeDef(fnNode, lambdaCtx, wr);
    wr.out(" in ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    for ( let i_2 = 0; i_2 < lambdaCtx.captured_variables.length; i_2++) {
      var cname = lambdaCtx.captured_variables[i_2];
      wr.out("// captured var " + cname, true);
    }
    wr.indent(-1);
    wr.out("}", false);
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          wr.out(arg.name + " : ", false);
          this.WalkNode(n, ctx, wr);
        }
      }
      wr.out(")", false);
    }
  }
  haveSameSig (fn1, fn2, ctx) {
    if ( fn1.name != fn2.name ) {
      return false;
    }
    const match = new RangerArgMatch();
    const n1 = fn1.nameNode;
    const n2 = fn1.nameNode;
    if ( match.doesDefsMatch(n1, n2, ctx) == false ) {
      return false;
    }
    if ( (fn1.params.length) != (fn2.params.length) ) {
      return false;
    }
    for ( let i = 0; i < fn1.params.length; i++) {
      var p = fn1.params[i];
      const p2 = fn2.params[i];
      if ( match.doesDefsMatch((p.nameNode), (p2.nameNode), ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  writeClass (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    let declaredVariable = {};
    let declaredFunction = {};
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true
        }
        for ( let i_2 = 0; i_2 < pC.defined_variants.length; i_2++) {
          var fnVar = pC.defined_variants[i_2];
          const mVs = pC.method_variants[fnVar];
          for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
            var variant = mVs.variants[i_3];
            declaredFunction[variant.compiledName] = true
          }
        }
      }
    }
    if ( this.header_created == false ) {
      wr.createTag("utilities");
      this.header_created = true;
    }
    wr.out(((("func ==(l: " + cl.name) + ", r: ") + cl.name) + ") -> Bool {", true);
    wr.indent(1);
    wr.out("return l == r", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("class " + cl.name, false);
    let parentClass;
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( let i_4 = 0; i_4 < cl.extends_classes.length; i_4++) {
        var pName_1 = cl.extends_classes[i_4];
        wr.out(pName_1, false);
        parentClass = ctx.findClass(pName_1);
      }
    } else {
      wr.out(" : Equatable ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( let i_5 = 0; i_5 < cl.variables.length; i_5++) {
      var pvar_1 = cl.variables[i_5];
      if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
        wr.out("// WAS DECLARED : " + pvar_1.name, true);
        continue;
      }
      this.writeVarDef(pvar_1.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      let b_must_override = false;
      if ( typeof(parentClass) != "undefined" ) {
        if ( (constr.params.length) == 0 ) {
          b_must_override = true;
        } else {
          if ( parentClass.has_constructor ) {
            const p_constr = parentClass.constructor_fn;
            if ( this.haveSameSig((constr), p_constr, ctx) ) {
              b_must_override = true;
            }
          }
        }
      }
      if ( b_must_override ) {
        wr.out("override ", false);
      }
      wr.out("init(", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      if ( typeof(parentClass) != "undefined" ) {
        wr.out("super.init()", true);
      }
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_6 = 0; i_6 < cl.static_methods.length; i_6++) {
      var variant_1 = cl.static_methods[i_6];
      if ( variant_1.nameNode.hasFlag("main") ) {
        continue;
      }
      wr.out(("static func " + variant_1.compiledName) + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_1.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant_1.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant_1.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_7 = 0; i_7 < cl.defined_variants.length; i_7++) {
      var fnVar_1 = cl.defined_variants[i_7];
      const mVs_1 = cl.method_variants[fnVar_1];
      for ( let i_8 = 0; i_8 < mVs_1.variants.length; i_8++) {
        var variant_2 = mVs_1.variants[i_8];
        if ( ( typeof(declaredFunction[variant_2.name] ) != "undefined" && declaredFunction.hasOwnProperty(variant_2.name) ) ) {
          wr.out("override ", false);
        }
        wr.out(("func " + variant_2.compiledName) + "(", false);
        this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") -> ", false);
        this.writeTypeDef(variant_2.nameNode, ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_2.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_2.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_9 = 0; i_9 < cl.static_methods.length; i_9++) {
      var variant_3 = cl.static_methods[i_9];
      if ( variant_3.nameNode.hasFlag("main") && (variant_3.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.newline();
        wr.out("func __main__swift() {", true);
        wr.indent(1);
        const subCtx_3 = variant_3.fnCtx;
        subCtx_3.is_function = true;
        this.WalkNode(variant_3.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
        wr.out("// call the main function", true);
        wr.out("__main__swift()", true);
      }
    }
  }
}
class RangerCppClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.header_created = false;
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        const s = this.EncodeString(node, ctx, wr);
        wr.out(("std::string(" + (("\"" + s) + "\"")) + ")", false);
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
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "char" : 
        return "char";
        break;
      case "charbuffer" : 
        return "const char*";
        break;
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "std::string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "double";
        break;
    }
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
    }
    if ( ctx.isDefinedClass(type_string) ) {
      return ("std::shared_ptr<" + type_string) + ">";
    }
    return type_string;
  }
  getTypeString2 (type_string, ctx) {
    switch (type_string ) { 
      case "char" : 
        return "char";
        break;
      case "charbuffer" : 
        return "const char*";
        break;
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "std::string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "double";
        break;
    }
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
    }
    return type_string;
  }
  writePtr (node, ctx, wr) {
    if ( node.type_name == "void" ) {
      return;
    }
  }
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type ) { 
      case 15 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        wr.out("std::function<", false);
        this.writeTypeDef(rv, ctx, wr);
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          this.writeTypeDef(arg, ctx, wr);
        }
        wr.out(")>", false);
        break;
      case 11 : 
        wr.out("int", false);
        break;
      case 3 : 
        if ( node.hasFlag("optional") ) {
          wr.out(" r_optional_primitive<int> ", false);
        } else {
          wr.out("int", false);
        }
        break;
      case 12 : 
        wr.out("char", false);
        break;
      case 13 : 
        wr.out("const char*", false);
        break;
      case 2 : 
        if ( node.hasFlag("optional") ) {
          wr.out(" r_optional_primitive<double> ", false);
        } else {
          wr.out("double", false);
        }
        break;
      case 4 : 
        wr.addImport("<string>");
        wr.out("std::string", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 7 : 
        wr.out(((("std::map<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("<map>");
        break;
      case 6 : 
        wr.out(("std::vector<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("<vector>");
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("void", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          const cc = ctx.findClass(t_name);
          wr.out("std::shared_ptr<", false);
          wr.out(cc.name, false);
          wr.out(">", false);
          return;
        }
        if ( node.hasFlag("optional") ) {
          wr.out("std::shared_ptr<std::vector<", false);
          wr.out(this.getTypeString2(t_name, ctx), false);
          wr.out(">", false);
          return;
        }
        wr.out(this.getTypeString2(t_name, ctx), false);
        break;
    }
  }
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("shared_from_this()", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      const rootObjName = node.ns[0];
      if ( (node.ns.length) > 1 ) {
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    let had_static = false;
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          if ( had_static ) {
            wr.out("::", false);
          } else {
            wr.out("->", false);
          }
        }
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_1 = node.ns[i_1];
      if ( i_1 > 0 ) {
        if ( had_static ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( ctx.hasClass(part_1) ) {
        had_static = true;
      } else {
        had_static = false;
      }
      wr.out(this.adjustType(part_1), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  disabledVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
      }
      wr.out(";", false);
      wr.newline();
    }
  }
  CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "return" ) {
      if ( ctx.isInMain() ) {
        wr.out("return 0;", true);
      } else {
        wr.out("return;", true);
      }
      return;
    }
    if ( cmd == "switch" ) {
      const condition = node.getSecond();
      const case_nodes = node.getThird();
      wr.newline();
      const p = new RangerAppParamDesc();
      p.name = "caseMatched";
      p.value_type = 5;
      ctx.defineVariable(p.name, p);
      wr.out(("bool " + p.compiledName) + " = false;", true);
      for ( let i = 0; i < case_nodes.children.length; i++) {
        var ch = case_nodes.children[i];
        const blockName = ch.getFirst();
        if ( blockName.vref == "default" ) {
          const defBlock = ch.getSecond();
          wr.out("if( ! ", false);
          wr.out(p.compiledName, false);
          wr.out(") {", true);
          wr.indent(1);
          this.WalkNode(defBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        } else {
          const caseValue = ch.getSecond();
          const caseBlock = ch.getThird();
          wr.out("if( ", false);
          this.WalkNode(condition, ctx, wr);
          wr.out(" == ", false);
          this.WalkNode(caseValue, ctx, wr);
          wr.out(") {", true);
          wr.indent(1);
          wr.out(p.compiledName + " = true;", true);
          this.WalkNode(caseBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        }
      }
    }
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    const param = ctx.getVariableDef(fName.vref);
    const args = param.nameNode.expression_value.children[1];
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(n, ctx, wr);
      }
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    /** unused:  const fnNode = node.children[0]   **/ 
    const args = node.children[1];
    const body = node.children[2];
    wr.out("[this", false);
    wr.out("](", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.writeTypeDef(arg, ctx, wr);
      wr.out(" ", false);
      wr.out(arg.vref, false);
    }
    wr.out(") mutable { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  }
  writeCppHeaderVar (node, ctx, wr, do_initialize) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.name) + " ", false);
    }
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      const givenArgs = node.getSecond();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( i >= (givenArgs.children.length) ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        this.WalkNode(n, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" std::make_shared<", false);
      wr.out(node.clDesc.name, false);
      wr.out(">(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  writeClassHeader (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    wr.out("class " + cl.name, false);
    let parentClass;
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        wr.out("public ", false);
        wr.out(pName, false);
        parentClass = ctx.findClass(pName);
      }
    } else {
      wr.out((" : public std::enable_shared_from_this<" + cl.name) + "> ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.out("public :", true);
    wr.indent(1);
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      this.writeCppHeaderVar(pvar.node, ctx, wr, false);
    }
    wr.out("/* class constructor */ ", true);
    wr.out(cl.name + "(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(" );", true);
    for ( let i_2 = 0; i_2 < cl.static_methods.length; i_2++) {
      var variant = cl.static_methods[i_2];
      if ( i_2 == 0 ) {
        wr.out("/* static methods */ ", true);
      }
      wr.out("static ", false);
      this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out((" " + variant.compiledName) + "(", false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(");", true);
    }
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      if ( i_3 == 0 ) {
        wr.out("/* instance methods */ ", true);
      }
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant_1 = mVs.variants[i_4];
        if ( cl.is_inherited ) {
          wr.out("virtual ", false);
        }
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out((" " + variant_1.compiledName) + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(");", true);
      }
    }
    wr.indent(-1);
    wr.indent(-1);
    wr.out("};", true);
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    const wr = orig_wr;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    if ( this.header_created == false ) {
      wr.createTag("c++Imports");
      wr.out("", true);
      wr.out("// define classes here to avoid compiler errors", true);
      wr.createTag("c++ClassDefs");
      wr.out("", true);
      wr.createTag("utilities");
      wr.out("", true);
      wr.out("// header definitions", true);
      wr.createTag("c++Header");
      wr.out("", true);
      this.header_created = true;
    }
    const classWriter = orig_wr.getTag("c++ClassDefs");
    const headerWriter = orig_wr.getTag("c++Header");
    /** unused:  const projectName = "project"   **/ 
    for ( let i = 0; i < cl.capturedLocals.length; i++) {
      var dd = cl.capturedLocals[i];
      if ( dd.is_class_variable == false ) {
        wr.out("// local captured " + dd.name, true);
        dd.node.disabled_node = true;
        cl.addVariable(dd);
        const csubCtx = cl.ctx;
        csubCtx.defineVariable(dd.name, dd);
        dd.is_class_variable = true;
      }
    }
    classWriter.out(("class " + cl.name) + ";", true);
    this.writeClassHeader(node, ctx, headerWriter);
    wr.out("", true);
    wr.out(((cl.name + "::") + cl.name) + "(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(" ) ", false);
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_1 = 0; i_1 < cl.extends_classes.length; i_1++) {
        var pName = cl.extends_classes[i_1];
        const pcc = ctx.findClass(pName);
        if ( pcc.has_constructor ) {
          wr.out((" : " + pcc.name) + "(", false);
          const constr_1 = cl.constructor_fn;
          for ( let i_2 = 0; i_2 < constr_1.params.length; i_2++) {
            var arg = constr_1.params[i_2];
            if ( i_2 > 0 ) {
              wr.out(",", false);
            }
            wr.out(" ", false);
            wr.out((" " + arg.name) + " ", false);
          }
          wr.out(")", false);
        }
      }
    }
    wr.out("{", true);
    wr.indent(1);
    for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
      var pvar = cl.variables[i_3];
      const nn = pvar.node;
      if ( pvar.is_captured ) {
        continue;
      }
      if ( (nn.children.length) > 2 ) {
        const valueNode = nn.children[2];
        wr.out(("this->" + pvar.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr);
        wr.out(";", true);
      }
    }
    if ( cl.has_constructor ) {
      const constr_2 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_2.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr_2.fnBody, subCtx, wr);
      wr.newline();
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant = cl.static_methods[i_4];
      if ( variant.nameNode.hasFlag("main") ) {
        continue;
      }
      wr.out("", true);
      this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out((" " + cl.name) + "::", false);
      wr.out(variant.compiledName + "(", false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_5 = 0; i_5 < cl.defined_variants.length; i_5++) {
      var fnVar = cl.defined_variants[i_5];
      const mVs = cl.method_variants[fnVar];
      for ( let i_6 = 0; i_6 < mVs.variants.length; i_6++) {
        var variant_1 = mVs.variants[i_6];
        wr.out("", true);
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out((" " + cl.name) + "::", false);
        wr.out(variant_1.compiledName + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
      var variant_2 = cl.static_methods[i_7];
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("", true);
        wr.out("int main(int argc, char* argv[]) {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.in_main = true;
        subCtx_3.is_function = true;
        this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.out("return 0;", true);
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
class RangerKotlinClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
  }
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        const s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
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
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  getObjectTypeString (type_string, ctx) {
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
  getTypeString (type_string) {
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
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
  WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( i == 0 ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out("!!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("var ", false);
      } else {
        wr.out("val ", false);
      }
      wr.out(p.compiledName, false);
      wr.out(" : ", false);
      this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = arrayListOf()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = hashMapOf()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg.name + " : ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
    }
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        this.WalkNode(n, ctx, wr);
      }
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    /** unused:  const importFork = wr.fork()   **/ 
    wr.out("", true);
    wr.out("class " + cl.name, false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("(", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) ", true);
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      this.writeVarDef(pvar.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.out("", true);
      wr.out("init {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr_1.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.static_methods.length) > 0 ) {
      wr.out("companion object {", true);
      wr.indent(1);
    }
    for ( let i_1 = 0; i_1 < cl.static_methods.length; i_1++) {
      var variant = cl.static_methods[i_1];
      wr.out("", true);
      if ( variant.nameNode.hasFlag("main") ) {
        continue;
      }
      wr.out("fun ", false);
      wr.out(" ", false);
      wr.out(variant.name + "(", false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") : ", false);
      this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.static_methods.length) > 0 ) {
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_2 = 0; i_2 < cl.defined_variants.length; i_2++) {
      var fnVar = cl.defined_variants[i_2];
      const mVs = cl.method_variants[fnVar];
      for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
        var variant_1 = mVs.variants[i_3];
        wr.out("", true);
        wr.out("fun ", false);
        wr.out(" ", false);
        wr.out(variant_1.name + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") : ", false);
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant_2 = cl.static_methods[i_4];
      wr.out("", true);
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("fun main(args : Array<String>) {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.is_function = true;
        this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
class RangerCSharpClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  getObjectTypeString (type_string, ctx) {
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
  getTypeString (type_string) {
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
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
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
  WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( i == 0 ) {
          if ( p.nameNode.hasFlag("optional") ) {
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("const ", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.name) + " ", false);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr.getFileWriter(".", (cl.name + ".cs"));
    const importFork = wr.fork();
    wr.out("", true);
    wr.out(("class " + cl.name) + " {", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      wr.out("public ", false);
      this.writeVarDef(pvar.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("", true);
      wr.out(cl.name + "(", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_1 = 0; i_1 < cl.static_methods.length; i_1++) {
      var variant = cl.static_methods[i_1];
      wr.out("", true);
      if ( variant.nameNode.hasFlag("main") && (variant.nameNode.code.filename != ctx.getRootFile()) ) {
        continue;
      }
      if ( variant.nameNode.hasFlag("main") ) {
        wr.out("static int Main( string [] args ) {", true);
      } else {
        wr.out("public static ", false);
        this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant.name + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_2 = 0; i_2 < cl.defined_variants.length; i_2++) {
      var fnVar = cl.defined_variants[i_2];
      const mVs = cl.method_variants[fnVar];
      for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
        var variant_1 = mVs.variants[i_3];
        wr.out("", true);
        wr.out("public ", false);
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant_1.name + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i_4 = 0; i_4 < import_list.length; i_4++) {
      var codeStr = import_list[i_4];
      importFork.out(("using " + codeStr) + ";", true);
    }
  }
}
class RangerScalaClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
  }
  getObjectTypeString (type_string, ctx) {
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
  getTypeString (type_string) {
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
  writeTypeDef (node, ctx, wr) {
    if ( node.hasFlag("optional") ) {
      wr.out("Option[", false);
    }
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
  writeTypeDefNoOption (node, ctx, wr) {
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
  WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( i == 0 ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out(".get", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const p = node.paramDesc;
      /** unused:  const nn = node.children[1]   **/ 
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out(("var " + p.compiledName) + " : ", false);
      } else {
        wr.out(("val " + p.compiledName) + " : ", false);
      }
      this.writeTypeDef(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        let b_inited = false;
        if ( p.nameNode.value_type == 6 ) {
          b_inited = true;
          wr.out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( p.nameNode.value_type == 7 ) {
          b_inited = true;
          wr.out("= new collection.mutable.HashMap()", false);
        }
        if ( p.nameNode.hasFlag("optional") ) {
          wr.out(" = Option.empty[", false);
          this.writeTypeDefNoOption(p.nameNode, ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out(" = _", false);
          }
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg.name + " : ", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr.getFileWriter(".", (cl.name + ".scala"));
    const importFork = wr.fork();
    wr.out("", true);
    wr.out(("class " + cl.name) + " ", false);
    if ( cl.has_constructor ) {
      wr.out("(", false);
      const constr = cl.constructor_fn;
      for ( let i = 0; i < constr.params.length; i++) {
        var arg = constr.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        wr.out(arg.name + " : ", false);
        this.writeTypeDef(arg.nameNode, ctx, wr);
      }
      wr.out(")", false);
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      this.writeVarDef(pvar.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr_1.fnBody, subCtx, wr);
      wr.newline();
    }
    for ( let i_2 = 0; i_2 < cl.defined_variants.length; i_2++) {
      var fnVar = cl.defined_variants[i_2];
      const mVs = cl.method_variants[fnVar];
      for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
        var variant = mVs.variants[i_3];
        wr.out("", true);
        wr.out("def ", false);
        wr.out(" ", false);
        wr.out(variant.name + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") : ", false);
        this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" = {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_1 = variant.fnCtx;
        subCtx_1.is_function = true;
        this.WalkNode(variant.fnBody, subCtx_1, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    let b_had_app = false;
    let app_obj;
    if ( (cl.static_methods.length) > 0 ) {
      wr.out("", true);
      wr.out("// companion object for static methods of " + cl.name, true);
      wr.out(("object " + cl.name) + " {", true);
      wr.indent(1);
    }
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant_1 = cl.static_methods[i_4];
      if ( variant_1.nameNode.hasFlag("main") ) {
        b_had_app = true;
        app_obj = variant_1;
        continue;
      }
      wr.out("", true);
      wr.out("def ", false);
      wr.out(" ", false);
      wr.out(variant_1.name + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") : ", false);
      this.writeTypeDef(variant_1.nameNode, ctx, wr);
      wr.out(" = {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_2 = variant_1.fnCtx;
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody, subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.static_methods.length) > 0 ) {
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( b_had_app ) {
      const variant_2 = app_obj;
      wr.out("", true);
      wr.out("// application main function for " + cl.name, true);
      wr.out(("object App" + cl.name) + " extends App {", true);
      wr.indent(1);
      wr.indent(1);
      wr.newline();
      const subCtx_3 = variant_2.fnCtx;
      subCtx_3.is_function = true;
      this.WalkNode(variant_2.fnBody, subCtx_3, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    const import_list = wr.getImports();
    for ( let i_5 = 0; i_5 < import_list.length; i_5++) {
      var codeStr = import_list[i_5];
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
class RangerGolangClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.thisName = "this";
    this.write_raw_type = false;
    this.did_write_nullable = false;
  }
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        const s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
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
  getObjectTypeString (type_string, ctx) {
    if ( type_string == "this" ) {
      return this.thisName;
    }
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.doesInherit() ) {
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
  getTypeString2 (type_string, ctx) {
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
  writeRawTypeDef (node, ctx, wr) {
    this.write_raw_type = true;
    this.writeTypeDef(node, ctx, wr);
    this.write_raw_type = false;
  }
  writeTypeDef (node, ctx, wr) {
    this.writeTypeDef2(node, ctx, wr);
  }
  writeArrayTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let a_name = node.array_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
    }
    switch (v_type ) { 
      case 7 : 
        if ( ctx.isDefinedClass(a_name) ) {
          const cc = ctx.findClass(a_name);
          if ( cc.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( ctx.isPrimitiveType(a_name) == false ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      case 6 : 
        if ( ctx.isDefinedClass(a_name) ) {
          const cc_1 = ctx.findClass(a_name);
          if ( cc_1.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      default: 
        break;
    }
  }
  writeTypeDef2 (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type ) { 
      case 15 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        wr.out("func(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          this.writeTypeDef2(arg, ctx, wr);
        }
        wr.out(") ", false);
        this.writeTypeDef2(rv, ctx, wr);
        break;
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
          wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name) ) {
            const cc = ctx.findClass(a_name);
            if ( cc.doesInherit() ) {
              wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
              return;
            }
          }
          if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
            wr.out("*", false);
          }
          wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        }
        break;
      case 6 : 
        if ( false == this.write_raw_type ) {
          wr.out("[]", false);
        }
        if ( ctx.isDefinedClass(a_name) ) {
          const cc_1 = ctx.findClass(a_name);
          if ( cc_1.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("()", false);
          return;
        }
        let b_iface = false;
        if ( ctx.isDefinedClass(t_name) ) {
          const cc_2 = ctx.findClass(t_name);
          b_iface = cc_2.is_interface;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          const cc_3 = ctx.findClass(t_name);
          if ( cc_3.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(t_name, ctx), false);
            return;
          }
        }
        if ( ((this.write_raw_type == false) && (node.isPrimitiveType() == false)) && (b_iface == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getTypeString2(t_name, ctx), false);
        break;
    }
  }
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    let next_is_gs = false;
    /** unused:  const last_was_setter = false   **/ 
    let needs_par = false;
    const ns_last = (node.ns.length) - 1;
    if ( (node.nsp.length) > 0 ) {
      let had_static = false;
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( (typeof(p.nameNode) !== "undefined") && ctx.isDefinedClass(p.nameNode.type_name) ) {
          const c = ctx.findClass(p.nameNode.type_name);
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out(this.thisName, false);
            continue;
          }
          if ( (part != this.thisName) && ctx.isMemberVariable(part) ) {
            const cc = ctx.getCurrentClass();
            const currC = cc;
            const up = currC.findVariable(part);
            if ( typeof(up) !== "undefined" ) {
              /** unused:  const p3 = up   **/ 
              wr.out(this.thisName + ".", false);
            }
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( ((typeof(p.nameNode) !== "undefined") && p.nameNode.hasFlag("optional")) && (i != ns_last) ) {
          wr.out(".value.(", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(")", false);
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      if ( (part_1 != this.thisName) && ctx.isMemberVariable(part_1) ) {
        const cc_1 = ctx.getCurrentClass();
        const currC_1 = cc_1;
        const up_1 = currC_1.findVariable(part_1);
        if ( typeof(up_1) !== "undefined" ) {
          /** unused:  const p3_1 = up_1   **/ 
          wr.out(this.thisName + ".", false);
        }
      }
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    let b_was_static = false;
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_2 = node.ns[i_1];
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2 == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
          const cc_2 = ctx.getCurrentClass();
          const currC_2 = cc_2;
          const up_2 = currC_2.findVariable(part_2);
          if ( typeof(up_2) !== "undefined" ) {
            /** unused:  const p3_2 = up_2   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  WriteSetterVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      const rootObjName = node.ns[0];
      const enumName = node.ns[1];
      const e = ctx.getEnum(rootObjName);
      if ( typeof(e) !== "undefined" ) {
        wr.out("" + ((e.values[enumName])), false);
        return;
      }
    }
    let next_is_gs = false;
    /** unused:  const last_was_setter = false   **/ 
    let needs_par = false;
    const ns_len = (node.ns.length) - 1;
    if ( (node.nsp.length) > 0 ) {
      let had_static = false;
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p.nameNode.type_name) ) {
          const c = ctx.findClass(p.nameNode.type_name);
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out(this.thisName, false);
            continue;
          }
          if ( (part != this.thisName) && ctx.isMemberVariable(part) ) {
            const cc = ctx.getCurrentClass();
            const currC = cc;
            const up = currC.findVariable(part);
            if ( typeof(up) !== "undefined" ) {
              /** unused:  const p3 = up   **/ 
              wr.out(this.thisName + ".", false);
            }
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( i < ns_len ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out(".value.(", false);
            this.writeTypeDef(p.nameNode, ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      if ( (part_1 != this.thisName) && ctx.isMemberVariable(part_1) ) {
        const cc_1 = ctx.getCurrentClass();
        const currC_1 = cc_1;
        const up_1 = currC_1.findVariable(part_1);
        if ( typeof(up_1) !== "undefined" ) {
          /** unused:  const p3_1 = up_1   **/ 
          wr.out(this.thisName + ".", false);
        }
      }
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    let b_was_static = false;
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_2 = node.ns[i_1];
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2 == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
          const cc_2 = ctx.getCurrentClass();
          const currC_2 = cc_2;
          const up_2 = currC_2.findVariable(part_2);
          if ( typeof(up_2) !== "undefined" ) {
            /** unused:  const p3_2 = up_2   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  goExtractAssign (value, p, ctx, wr) {
    const arr_node = value.children[1];
    wr.newline();
    wr.out("", true);
    wr.out("// array_extract operator ", true);
    wr.out("var ", false);
    const pArr = new RangerAppParamDesc();
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
    const left = arr_node;
    const a_len = (left.ns.length) - 1;
    /** unused:  const last_part = left.ns[a_len]   **/ 
    let next_is_gs = false;
    let last_was_setter = false;
    let needs_par = false;
    let b_was_static = false;
    for ( let i = 0; i < left.ns.length; i++) {
      var part = left.ns[i];
      if ( next_is_gs ) {
        if ( i == a_len ) {
          wr.out(".Set_", false);
          last_was_setter = true;
        } else {
          wr.out(".Get_", false);
          needs_par = true;
          next_is_gs = false;
          last_was_setter = false;
        }
      }
      if ( (last_was_setter == false) && (needs_par == false) ) {
        if ( i > 0 ) {
          if ( (i == 1) && b_was_static ) {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if ( i == 0 ) {
        if ( part == "this" ) {
          wr.out(this.thisName, false);
          continue;
        }
        if ( ctx.hasClass(part) ) {
          b_was_static = true;
        }
        const partDef = ctx.getVariableDef(part);
        if ( typeof(partDef.nameNode) !== "undefined" ) {
          if ( ctx.isDefinedClass(partDef.nameNode.type_name) ) {
            const c = ctx.findClass(partDef.nameNode.type_name);
            if ( c.doesInherit() ) {
              next_is_gs = true;
            }
          }
        }
        if ( (part != "this") && ctx.isMemberVariable(part) ) {
          const cc = ctx.getCurrentClass();
          const currC = cc;
          const up = currC.findVariable(part);
          if ( typeof(up) !== "undefined" ) {
            /** unused:  const p3 = up   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      if ( (left.nsp.length) > 0 ) {
        const p_1 = left.nsp[i];
        wr.out(this.adjustType(p_1.compiledName), false);
      } else {
        if ( left.hasParamDesc ) {
          wr.out(left.paramDesc.compiledName, false);
        } else {
          wr.out(this.adjustType(part), false);
        }
      }
      if ( needs_par ) {
        wr.out("()", false);
        needs_par = false;
      }
      if ( (left.nsp.length) >= (i + 1) ) {
        const pp = left.nsp[i];
        if ( pp.nameNode.hasFlag("optional") ) {
          wr.out(".value.(", false);
          this.writeTypeDef(pp.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
    }
    if ( last_was_setter ) {
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
  writeStructField (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out(p.compiledName + " ", false);
      if ( p.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.nameNode, ctx, wr);
      }
      if ( p.ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out("", true);
      if ( p.nameNode.hasFlag("optional") ) {
      }
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      let b_not_used = false;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out(("/** unused:  " + p.compiledName) + "*/", true);
        b_not_used = true;
        return;
      }
      const map_or_hash = (nn.value_type == 6) || (nn.value_type == 7);
      if ( nn.hasFlag("optional") ) {
        wr.out(("var " + p.compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.length) > 2 ) {
          const value = node.children[2];
          if ( value.hasParamDesc ) {
            const pnn = value.paramDesc.nameNode;
            if ( pnn.hasFlag("optional") ) {
              wr.out(p.compiledName + ".value = ", false);
              ctx.setInExpr();
              const value_1 = node.getThird();
              this.WalkNode(value_1, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p.compiledName + ".has_value = ", false);
              ctx.setInExpr();
              const value_2 = node.getThird();
              this.WalkNode(value_2, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p.compiledName + ".value = ", false);
              ctx.setInExpr();
              const value_3 = node.getThird();
              this.WalkNode(value_3, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p.compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p.compiledName + " = ", false);
            ctx.setInExpr();
            const value_4 = node.getThird();
            this.WalkNode(value_4, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( ((p.set_cnt > 0) || p.is_class_variable) || map_or_hash ) {
          wr.out(("var " + p.compiledName) + " ", false);
        } else {
          wr.out(("var " + p.compiledName) + " ", false);
        }
      }
      this.writeTypeDef2(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        const value_5 = node.getThird();
        if ( value_5.expression && ((value_5.children.length) > 1) ) {
          const fc = value_5.children[0];
          if ( fc.vref == "array_extract" ) {
            this.goExtractAssign(value_5, p, ctx, wr);
            return;
          }
        }
        wr.out(" = ", false);
        ctx.setInExpr();
        this.WalkNode(value_5, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name + " ", false);
      if ( arg.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg.nameNode, ctx, wr);
      }
    }
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(("CreateNew_" + node.clDesc.name) + "(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const args = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(arg, ctx, wr);
      }
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnNode = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    wr.out("func (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
      wr.out(" ", false);
      if ( arg.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg, lambdaCtx, wr);
      }
    }
    wr.out(") ", false);
    if ( fnNode.hasFlag("optional") ) {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(fnNode, lambdaCtx, wr);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  }
  CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( ((cmd == "=") || (cmd == "push")) || (cmd == "removeLast") ) {
      const left = node.getSecond();
      let right = left;
      if ( (cmd == "=") || (cmd == "push") ) {
        right = node.getThird();
      }
      wr.newline();
      let b_was_static = false;
      if ( left.hasParamDesc ) {
        const a_len = (left.ns.length) - 1;
        /** unused:  const last_part = left.ns[a_len]   **/ 
        let next_is_gs = false;
        let last_was_setter = false;
        let needs_par = false;
        for ( let i = 0; i < left.ns.length; i++) {
          var part = left.ns[i];
          if ( next_is_gs ) {
            if ( i == a_len ) {
              wr.out(".Set_", false);
              last_was_setter = true;
            } else {
              wr.out(".Get_", false);
              needs_par = true;
              next_is_gs = false;
              last_was_setter = false;
            }
          }
          if ( (last_was_setter == false) && (needs_par == false) ) {
            if ( i > 0 ) {
              if ( (i == 1) && b_was_static ) {
                wr.out("_static_", false);
              } else {
                wr.out(".", false);
              }
            }
          }
          if ( i == 0 ) {
            if ( part == "this" ) {
              wr.out(this.thisName, false);
              continue;
            }
            if ( ctx.hasClass(part) ) {
              b_was_static = true;
            }
            if ( (part != "this") && ctx.isMemberVariable(part) ) {
              const cc = ctx.getCurrentClass();
              const currC = cc;
              const up = currC.findVariable(part);
              if ( typeof(up) !== "undefined" ) {
                /** unused:  const p3 = up   **/ 
                wr.out(this.thisName + ".", false);
              }
            }
          }
          let partDef = ctx.getVariableDef(part);
          if ( (left.nsp.length) > i ) {
            partDef = left.nsp[i];
          }
          if ( typeof(partDef.nameNode) !== "undefined" ) {
            if ( ctx.isDefinedClass(partDef.nameNode.type_name) ) {
              const c = ctx.findClass(partDef.nameNode.type_name);
              if ( c.doesInherit() ) {
                next_is_gs = true;
              }
            }
          }
          if ( (left.nsp.length) > 0 ) {
            const p = left.nsp[i];
            wr.out(this.adjustType(p.compiledName), false);
          } else {
            if ( left.hasParamDesc ) {
              wr.out(left.paramDesc.compiledName, false);
            } else {
              wr.out(this.adjustType(part), false);
            }
          }
          if ( needs_par ) {
            wr.out("()", false);
            needs_par = false;
          }
          if ( (left.nsp.length) >= (i + 1) ) {
            const pp = left.nsp[i];
            if ( pp.nameNode.hasFlag("optional") ) {
              wr.out(".value.(", false);
              this.writeTypeDef(pp.nameNode, ctx, wr);
              wr.out(")", false);
            }
          }
        }
        if ( cmd == "removeLast" ) {
          if ( last_was_setter ) {
            wr.out("(", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("); ", true);
          } else {
            wr.out(" = ", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("; ", true);
          }
          return;
        }
        if ( cmd == "push" ) {
          if ( last_was_setter ) {
            wr.out("(", false);
            ctx.setInExpr();
            wr.out("append(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out(")); ", true);
          } else {
            wr.out(" = ", false);
            wr.out("append(", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out("); ", true);
          }
          return;
        }
        if ( last_was_setter ) {
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
      this.WriteSetterVRef(left, ctx, wr);
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(right, ctx, wr);
      ctx.unsetInExpr();
      wr.out("; /* custom */", true);
    }
  }
  writeInterface (cl, ctx, wr) {
    wr.out(("type " + cl.name) + " interface { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.defined_variants.length; i++) {
      var fnVar = cl.defined_variants[i];
      const mVs = cl.method_variants[fnVar];
      for ( let i_1 = 0; i_1 < mVs.variants.length; i_1++) {
        var variant = mVs.variants[i_1];
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") ", false);
        if ( variant.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant.nameNode, ctx, wr);
        }
        wr.out("", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    if ( this.did_write_nullable == false ) {
      wr.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      wr.createTag("utilities");
      this.did_write_nullable = true;
    }
    let declaredVariable = {};
    wr.out(("type " + cl.name) + " struct { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      this.writeStructField(pvar.node, ctx, wr);
      declaredVariable[pvar.name] = true
    }
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_1 = 0; i_1 < cl.extends_classes.length; i_1++) {
        var pName = cl.extends_classes[i_1];
        const pC = ctx.findClass(pName);
        wr.out("// inherited from parent class " + pName, true);
        for ( let i_2 = 0; i_2 < pC.variables.length; i_2++) {
          var pvar_1 = pC.variables[i_2];
          if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
            continue;
          }
          this.writeStructField(pvar_1.node, ctx, wr);
        }
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    wr.out(("type IFACE_" + cl.name) + " interface { ", true);
    wr.indent(1);
    for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
      var p = cl.variables[i_3];
      wr.out("Get_", false);
      wr.out(p.compiledName + "() ", false);
      if ( p.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.nameNode, ctx, wr);
      }
      wr.out("", true);
      wr.out("Set_", false);
      wr.out(p.compiledName + "(value ", false);
      if ( p.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.nameNode, ctx, wr);
      }
      wr.out(") ", true);
    }
    for ( let i_4 = 0; i_4 < cl.defined_variants.length; i_4++) {
      var fnVar = cl.defined_variants[i_4];
      const mVs = cl.method_variants[fnVar];
      for ( let i_5 = 0; i_5 < mVs.variants.length; i_5++) {
        var variant = mVs.variants[i_5];
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") ", false);
        if ( variant.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant.nameNode, ctx, wr);
        }
        wr.out("", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    this.thisName = "me";
    wr.out("", true);
    wr.out(("func CreateNew_" + cl.name) + "(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      for ( let i_6 = 0; i_6 < constr.params.length; i_6++) {
        var arg = constr.params[i_6];
        if ( i_6 > 0 ) {
          wr.out(", ", false);
        }
        wr.out(arg.name + " ", false);
        this.writeTypeDef(arg.nameNode, ctx, wr);
      }
    }
    wr.out((") *" + cl.name) + " {", true);
    wr.indent(1);
    wr.newline();
    wr.out(("me := new(" + cl.name) + ")", true);
    for ( let i_7 = 0; i_7 < cl.variables.length; i_7++) {
      var pvar_2 = cl.variables[i_7];
      const nn = pvar_2.node;
      if ( (nn.children.length) > 2 ) {
        const valueNode = nn.children[2];
        wr.out(("me." + pvar_2.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr);
        wr.out("", true);
      } else {
        const pNameN = pvar_2.nameNode;
        if ( pNameN.value_type == 6 ) {
          wr.out(("me." + pvar_2.compiledName) + " = ", false);
          wr.out("make(", false);
          this.writeTypeDef(pvar_2.nameNode, ctx, wr);
          wr.out(",0)", true);
        }
        if ( pNameN.value_type == 7 ) {
          wr.out(("me." + pvar_2.compiledName) + " = ", false);
          wr.out("make(", false);
          this.writeTypeDef(pvar_2.nameNode, ctx, wr);
          wr.out(")", true);
        }
      }
    }
    for ( let i_8 = 0; i_8 < cl.variables.length; i_8++) {
      var pvar_3 = cl.variables[i_8];
      if ( pvar_3.nameNode.hasFlag("optional") ) {
        wr.out(("me." + pvar_3.compiledName) + " = new(GoNullable);", true);
      }
    }
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_9 = 0; i_9 < cl.extends_classes.length; i_9++) {
        var pName_1 = cl.extends_classes[i_9];
        const pC_1 = ctx.findClass(pName_1);
        for ( let i_10 = 0; i_10 < pC_1.variables.length; i_10++) {
          var pvar_4 = pC_1.variables[i_10];
          const nn_1 = pvar_4.node;
          if ( (nn_1.children.length) > 2 ) {
            const valueNode_1 = nn_1.children[2];
            wr.out(("me." + pvar_4.compiledName) + " = ", false);
            this.WalkNode(valueNode_1, ctx, wr);
            wr.out("", true);
          } else {
            const pNameN_1 = pvar_4.nameNode;
            if ( pNameN_1.value_type == 6 ) {
              wr.out(("me." + pvar_4.compiledName) + " = ", false);
              wr.out("make(", false);
              this.writeTypeDef(pvar_4.nameNode, ctx, wr);
              wr.out(",0)", true);
            }
            if ( pNameN_1.value_type == 7 ) {
              wr.out(("me." + pvar_4.compiledName) + " = ", false);
              wr.out("make(", false);
              this.writeTypeDef(pvar_4.nameNode, ctx, wr);
              wr.out(")", true);
            }
          }
        }
        for ( let i_11 = 0; i_11 < pC_1.variables.length; i_11++) {
          var pvar_5 = pC_1.variables[i_11];
          if ( pvar_5.nameNode.hasFlag("optional") ) {
            wr.out(("me." + pvar_5.compiledName) + " = new(GoNullable);", true);
          }
        }
        if ( pC_1.has_constructor ) {
          const constr_1 = pC_1.constructor_fn;
          const subCtx = constr_1.fnCtx;
          subCtx.is_function = true;
          this.WalkNode(constr_1.fnBody, subCtx, wr);
        }
      }
    }
    if ( cl.has_constructor ) {
      const constr_2 = cl.constructor_fn;
      const subCtx_1 = constr_2.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(constr_2.fnBody, subCtx_1, wr);
    }
    wr.out("return me;", true);
    wr.indent(-1);
    wr.out("}", true);
    this.thisName = "this";
    for ( let i_12 = 0; i_12 < cl.static_methods.length; i_12++) {
      var variant_1 = cl.static_methods[i_12];
      if ( variant_1.nameNode.hasFlag("main") ) {
        continue;
      }
      wr.newline();
      wr.out(((("func " + cl.name) + "_static_") + variant_1.compiledName) + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") ", false);
      this.writeTypeDef(variant_1.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_2 = variant_1.fnCtx;
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody, subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    let declaredFn = {};
    for ( let i_13 = 0; i_13 < cl.defined_variants.length; i_13++) {
      var fnVar_1 = cl.defined_variants[i_13];
      const mVs_1 = cl.method_variants[fnVar_1];
      for ( let i_14 = 0; i_14 < mVs_1.variants.length; i_14++) {
        var variant_2 = mVs_1.variants[i_14];
        declaredFn[variant_2.name] = true
        wr.out(((("func (this *" + cl.name) + ") ") + variant_2.compiledName) + " (", false);
        this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") ", false);
        if ( variant_2.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_2.nameNode, ctx, wr);
        }
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.is_function = true;
        this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_15 = 0; i_15 < cl.extends_classes.length; i_15++) {
        var pName_2 = cl.extends_classes[i_15];
        const pC_2 = ctx.findClass(pName_2);
        wr.out("// inherited methods from parent class " + pName_2, true);
        for ( let i_16 = 0; i_16 < pC_2.defined_variants.length; i_16++) {
          var fnVar_2 = pC_2.defined_variants[i_16];
          const mVs_2 = pC_2.method_variants[fnVar_2];
          for ( let i_17 = 0; i_17 < mVs_2.variants.length; i_17++) {
            var variant_3 = mVs_2.variants[i_17];
            if ( ( typeof(declaredFn[variant_3.name] ) != "undefined" && declaredFn.hasOwnProperty(variant_3.name) ) ) {
              continue;
            }
            wr.out(((("func (this *" + cl.name) + ") ") + variant_3.compiledName) + " (", false);
            this.writeArgsDef(variant_3, ctx, wr);
            wr.out(") ", false);
            if ( variant_3.nameNode.hasFlag("optional") ) {
              wr.out("*GoNullable", false);
            } else {
              this.writeTypeDef(variant_3.nameNode, ctx, wr);
            }
            wr.out(" {", true);
            wr.indent(1);
            wr.newline();
            const subCtx_4 = variant_3.fnCtx;
            subCtx_4.is_function = true;
            this.WalkNode(variant_3.fnBody, subCtx_4, wr);
            wr.newline();
            wr.indent(-1);
            wr.out("}", true);
          }
        }
      }
    }
    let declaredGetter = {};
    for ( let i_18 = 0; i_18 < cl.variables.length; i_18++) {
      var p_1 = cl.variables[i_18];
      declaredGetter[p_1.name] = true
      wr.newline();
      wr.out("// getter for variable " + p_1.name, true);
      wr.out(("func (this *" + cl.name) + ") ", false);
      wr.out("Get_", false);
      wr.out(p_1.compiledName + "() ", false);
      if ( p_1.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_1.nameNode, ctx, wr);
      }
      wr.out(" {", true);
      wr.indent(1);
      wr.out("return this." + p_1.compiledName, true);
      wr.indent(-1);
      wr.out("}", true);
      wr.newline();
      wr.out("// setter for variable " + p_1.name, true);
      wr.out(("func (this *" + cl.name) + ") ", false);
      wr.out("Set_", false);
      wr.out(p_1.compiledName + "( value ", false);
      if ( p_1.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_1.nameNode, ctx, wr);
      }
      wr.out(") ", false);
      wr.out(" {", true);
      wr.indent(1);
      wr.out(("this." + p_1.compiledName) + " = value ", true);
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_19 = 0; i_19 < cl.extends_classes.length; i_19++) {
        var pName_3 = cl.extends_classes[i_19];
        const pC_3 = ctx.findClass(pName_3);
        wr.out("// inherited getters and setters from the parent class " + pName_3, true);
        for ( let i_20 = 0; i_20 < pC_3.variables.length; i_20++) {
          var p_2 = pC_3.variables[i_20];
          if ( ( typeof(declaredGetter[p_2.name] ) != "undefined" && declaredGetter.hasOwnProperty(p_2.name) ) ) {
            continue;
          }
          wr.newline();
          wr.out("// getter for variable " + p_2.name, true);
          wr.out(("func (this *" + cl.name) + ") ", false);
          wr.out("Get_", false);
          wr.out(p_2.compiledName + "() ", false);
          if ( p_2.nameNode.hasFlag("optional") ) {
            wr.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_2.nameNode, ctx, wr);
          }
          wr.out(" {", true);
          wr.indent(1);
          wr.out("return this." + p_2.compiledName, true);
          wr.indent(-1);
          wr.out("}", true);
          wr.newline();
          wr.out("// getter for variable " + p_2.name, true);
          wr.out(("func (this *" + cl.name) + ") ", false);
          wr.out("Set_", false);
          wr.out(p_2.compiledName + "( value ", false);
          if ( p_2.nameNode.hasFlag("optional") ) {
            wr.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_2.nameNode, ctx, wr);
          }
          wr.out(") ", false);
          wr.out(" {", true);
          wr.indent(1);
          wr.out(("this." + p_2.compiledName) + " = value ", true);
          wr.indent(-1);
          wr.out("}", true);
        }
      }
    }
    for ( let i_21 = 0; i_21 < cl.static_methods.length; i_21++) {
      var variant_4 = cl.static_methods[i_21];
      if ( variant_4.nameNode.hasFlag("main") && (variant_4.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("func main() {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_5 = variant_4.fnCtx;
        subCtx_5.is_function = true;
        this.WalkNode(variant_4.fnBody, subCtx_5, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
class RangerPHPClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.thisName = "this";
    this.wrote_header = false;
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  EncodeString (node, ctx, wr) {
    /** unused:  const encoded_str = ""   **/ 
    const str_length = node.string_value.length;
    let encoded_str_2 = "";
    let ii = 0;
    while (ii < str_length) {
      const cc = node.string_value.charCodeAt(ii );
      switch (cc ) { 
        case 8 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 36 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 92 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        default: 
          encoded_str_2 = encoded_str_2 + (String.fromCharCode(cc));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        const s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
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
  WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("$this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( part == "this" ) {
            wr.out("$this", false);
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out("->", false);
        }
        if ( i == 0 ) {
          wr.out("$", false);
          if ( p.nameNode.hasFlag("optional") ) {
          }
          const part_1 = node.ns[0];
          if ( (part_1 != "this") && ctx.isMemberVariable(part_1) ) {
            const uc = ctx.getCurrentClass();
            const currC = uc;
            const up = currC.findVariable(part_1);
            if ( typeof(up) !== "undefined" ) {
              if ( false == ctx.isInStatic() ) {
                wr.out(this.thisName + "->", false);
              }
            }
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out("$", false);
      const part_2 = node.ns[0];
      if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
        const uc_1 = ctx.getCurrentClass();
        const currC_1 = uc_1;
        const up_1 = currC_1.findVariable(part_2);
        if ( typeof(up_1) !== "undefined" ) {
          if ( false == ctx.isInStatic() ) {
            wr.out(this.thisName + "->", false);
          }
        }
      }
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    let b_was_static = false;
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_3 = node.ns[i_1];
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(part_3) ) {
          b_was_static = true;
        } else {
          wr.out("$", false);
        }
        if ( (part_3 != "this") && ctx.hasCurrentClass() ) {
          const uc_2 = ctx.getCurrentClass();
          const currC_2 = uc_2;
          const up_2 = currC_2.findVariable(part_3);
          if ( typeof(up_2) !== "undefined" ) {
            if ( false == ctx.isInStatic() ) {
              wr.out(this.thisName + "->", false);
            }
          }
        }
      }
      wr.out(this.adjustType(part_3), false);
    }
  }
  writeVarInitDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$this->" + p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$" + p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  disabledVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out("$this->" + p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      wr.out(";", false);
      wr.newline();
    }
  }
  CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    this.WriteVRef(fName, ctx, wr);
    const param = ctx.getVariableDef(fName.vref);
    const args = param.nameNode.expression_value.children[1];
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(n, ctx, wr);
      }
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(");", true);
    } else {
      wr.out(")", false);
    }
  }
  CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    /** unused:  const fnNode = node.children[0]   **/ 
    const args = node.children[1];
    const body = node.children[2];
    wr.out("function (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
    }
    wr.out(") ", false);
    const had_capture = false;
    if ( had_capture ) {
      wr.out(")", false);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    for ( let i_2 = 0; i_2 < lambdaCtx.captured_variables.length; i_2++) {
      var cname = lambdaCtx.captured_variables[i_2];
      wr.out("// captured var " + cname, true);
    }
    wr.indent(-1);
    wr.out("}", true);
  }
  writeClassVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out(("var $" + p.compiledName) + ";", true);
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg.name) + " ", false);
    }
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        this.WalkNode(n, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" new ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    /** unused:  const importFork = wr.fork()   **/ 
    for ( let i = 0; i < cl.capturedLocals.length; i++) {
      var dd = cl.capturedLocals[i];
      if ( dd.is_class_variable == false ) {
        wr.out("// local captured " + dd.name, true);
        dd.node.disabled_node = true;
        cl.addVariable(dd);
        const csubCtx = cl.ctx;
        csubCtx.defineVariable(dd.name, dd);
        dd.is_class_variable = true;
      }
    }
    if ( this.wrote_header == false ) {
      wr.out("<? ", true);
      wr.out("", true);
      this.wrote_header = true;
    }
    wr.out("class " + cl.name, false);
    let parentClass;
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" extends ", false);
      for ( let i_1 = 0; i_1 < cl.extends_classes.length; i_1++) {
        var pName = cl.extends_classes[i_1];
        wr.out(pName, false);
        parentClass = ctx.findClass(pName);
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar = cl.variables[i_2];
      this.writeClassVarDef(pvar.node, ctx, wr);
    }
    wr.out("", true);
    wr.out("function __construct(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(" ) {", true);
    wr.indent(1);
    if ( typeof(parentClass) != "undefined" ) {
      wr.out("parent::__construct();", true);
    }
    for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
      var pvar_1 = cl.variables[i_3];
      this.writeVarInitDef(pvar_1.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr_1.fnBody, subCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant = cl.static_methods[i_4];
      wr.out("", true);
      if ( variant.nameNode.hasFlag("main") ) {
        continue;
      } else {
        wr.out("public static function ", false);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      subCtx_1.in_static_method = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_5 = 0; i_5 < cl.defined_variants.length; i_5++) {
      var fnVar = cl.defined_variants[i_5];
      const mVs = cl.method_variants[fnVar];
      for ( let i_6 = 0; i_6 < mVs.variants.length; i_6++) {
        var variant_1 = mVs.variants[i_6];
        wr.out("", true);
        wr.out(("function " + variant_1.compiledName) + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
      var variant_2 = cl.static_methods[i_7];
      ctx.disableCurrentClass();
      ctx.in_static_method = true;
      wr.out("", true);
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("/* static PHP main routine */", false);
        wr.newline();
        this.WalkNode(variant_2.fnBody, ctx, wr);
        wr.newline();
      }
    }
  }
}
class RangerJavaScriptClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.thisName = "this";     /** note: unused */
    this.wrote_header = false;
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( typeof(e) !== "undefined" ) {
          wr.out("" + ((e.values[enumName])), false);
          return;
        }
      }
    }
    if ( (node.nsp.length) > 0 ) {
      for ( let i = 0; i < node.nsp.length; i++) {
        var p = node.nsp[i];
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( i == 0 ) {
          const part = node.ns[0];
          if ( (part != "this") && ctx.isMemberVariable(part) ) {
            const uc = ctx.getCurrentClass();
            const currC = uc;
            const up = currC.findVariable(part);
            if ( typeof(up) !== "undefined" ) {
              wr.out("this.", false);
            }
          }
          if ( part == "this" ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p.compiledName.length) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns[i])), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      if ( (part_1 != "this") && ctx.isMemberVariable(part_1) ) {
        const uc_1 = ctx.getCurrentClass();
        const currC_1 = uc_1;
        const up_1 = currC_1.findVariable(part_1);
        if ( typeof(up_1) !== "undefined" ) {
          wr.out("this.", false);
        }
      }
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      return;
    }
    let b_was_static = false;
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_2 = node.ns[i_1];
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out(".", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        } else {
          wr.out("", false);
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
          const uc_2 = ctx.getCurrentClass();
          const currC_2 = uc_2;
          const up_2 = currC_2.findVariable(part_2);
          if ( typeof(up_2) !== "undefined" ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  writeVarInitDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      const remove_unused = ctx.hasCompilerFlag("remove-unused-class-vars");
      if ( (p.ref_cnt == 0) && (remove_unused || (p.is_class_variable == false)) ) {
        return;
      }
      let was_set = false;
      if ( (node.children.length) > 2 ) {
        wr.out(("this." + p.compiledName) + " = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        was_set = true;
      } else {
        if ( nn.value_type == 6 ) {
          wr.out("this." + p.compiledName, false);
          wr.out(" = []", false);
          was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out("this." + p.compiledName, false);
          wr.out(" = {}", false);
          was_set = true;
        }
      }
      if ( was_set ) {
        wr.out(";", false);
        if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
          wr.out("     /** note: unused */", false);
        }
        wr.newline();
      }
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      /** unused:  const opt_js = ctx.hasCompilerFlag("optimize-js")   **/ 
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      let has_value = false;
      if ( (node.children.length) > 2 ) {
        has_value = true;
      }
      if ( ((p.set_cnt > 0) || p.is_class_variable) || (has_value == false) ) {
        wr.out("let " + p.compiledName, false);
      } else {
        wr.out("const " + p.compiledName, false);
      }
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = {}", false);
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  writeClassVarDef (node, ctx, wr) {
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name, false);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( cl.is_interface ) {
      orig_wr.out("// interface : " + cl.name, true);
      return;
    }
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    /** unused:  const importFork = wr.fork()   **/ 
    if ( this.wrote_header == false ) {
      wr.out("", true);
      this.wrote_header = true;
    }
    let b_extd = false;
    wr.out(("class " + cl.name) + " ", false);
    for ( let i = 0; i < cl.extends_classes.length; i++) {
      var pName = cl.extends_classes[i];
      if ( i == 0 ) {
        wr.out(" extends ", false);
      }
      wr.out(pName, false);
      b_extd = true;
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      this.writeClassVarDef(pvar.node, ctx, wr);
    }
    wr.out("constructor(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(") {", true);
    wr.indent(1);
    if ( b_extd ) {
      wr.out("super()", true);
    }
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar_1 = cl.variables[i_2];
      this.writeVarInitDef(pvar_1.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr_1.fnBody, subCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant = mVs.variants[i_4];
        wr.out(("" + variant.compiledName) + " (", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_1 = variant.fnCtx;
        subCtx_1.is_function = true;
        this.WalkNode(variant.fnBody, subCtx_1, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_5 = 0; i_5 < cl.static_methods.length; i_5++) {
      var variant_1 = cl.static_methods[i_5];
      if ( variant_1.nameNode.hasFlag("main") ) {
        continue;
      } else {
        wr.out(((cl.name + ".") + variant_1.compiledName) + " = function(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_2 = variant_1.fnCtx;
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody, subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_6 = 0; i_6 < cl.static_methods.length; i_6++) {
      var variant_2 = cl.static_methods[i_6];
      ctx.disableCurrentClass();
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("/* static JavaSript main routine */", false);
        wr.newline();
        wr.out("function __js_main() {", true);
        wr.indent(1);
        this.WalkNode(variant_2.fnBody, ctx, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
        wr.out("__js_main();", true);
      }
    }
  }
}
class RangerRangerClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  getObjectTypeString (type_string, ctx) {
    return type_string;
  }
  getTypeString (type_string) {
    return type_string;
  }
  writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( v_type == 7 ) {
      wr.out(((("[" + k_name) + ":") + a_name) + "]", false);
      return;
    }
    if ( v_type == 6 ) {
      wr.out(("[" + a_name) + "]", false);
      return;
    }
    wr.out(t_name, false);
  }
  WriteVRef (node, ctx, wr) {
    wr.out(node.vref, false);
  }
  WriteVRefWithOpt (node, ctx, wr) {
    wr.out(node.vref, false);
    const flags = ["optional","weak","strong","temp","lives","returns","returnvalue"];
    let some_set = false;
    for ( let i = 0; i < flags.length; i++) {
      var flag = flags[i];
      if ( node.hasFlag(flag) ) {
        if ( false == some_set ) {
          wr.out("@(", false);
          some_set = true;
        } else {
          wr.out(" ", false);
        }
        wr.out(flag, false);
      }
    }
    if ( some_set ) {
      wr.out(")", false);
    }
  }
  writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        const value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      wr.newline();
    }
  }
  writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      if ( ctx.expressionLevel() > 0 ) {
        wr.out("(", false);
      }
      const fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( typeof(defVal) !== "undefined" ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        this.WalkNode(n, ctx, wr);
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
  writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out("(new " + node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( typeof(constr) !== "undefined" ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(" ", false);
          }
          if ( true || (typeof(arg.nameNode) !== "undefined") ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out("))", false);
    }
  }
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg.nameNode, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(arg.nameNode, ctx, wr);
    }
  }
  writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    const importFork = wr.fork();
    wr.out("", true);
    wr.out("class " + cl.name, false);
    let parentClass;
    wr.out(" { ", true);
    wr.indent(1);
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out("Extends(", false);
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        wr.out(pName, false);
        parentClass = ctx.findClass(pName);
      }
      wr.out(")", true);
    }
    wr.createTag("utilities");
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      this.writeVarDef(pvar.node, ctx, wr);
    }
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("", true);
      wr.out("Constructor (", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_2 = 0; i_2 < cl.static_methods.length; i_2++) {
      var variant = cl.static_methods[i_2];
      wr.out("", true);
      if ( variant.nameNode.hasFlag("main") ) {
        wr.out("sfn m@(main):void () {", true);
      } else {
        wr.out("sfn ", false);
        this.WriteVRefWithOpt(variant.nameNode, ctx, wr);
        wr.out(":", false);
        this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" (", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant_1 = mVs.variants[i_4];
        wr.out("", true);
        wr.out("fn ", false);
        this.WriteVRefWithOpt(variant_1.nameNode, ctx, wr);
        wr.out(":", false);
        this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out("(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i_5 = 0; i_5 < import_list.length; i_5++) {
      var codeStr = import_list[i_5];
      importFork.out(("Import \"" + codeStr) + "\"", true);
    }
  }
}
class LiveCompiler  {
  constructor() {
    this.hasCreatedPolyfill = {};     /** note: unused */
    this.repeat_index = 0;
  }
  initWriter (ctx) {
    if ( typeof(this.langWriter) !== "undefined" ) {
      return;
    }
    const root = ctx.getRoot();
    switch (root.targetLangName ) { 
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
      case "cpp" : 
        this.langWriter = new RangerCppClassWriter();
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
  EncodeString (node, ctx, wr) {
    /** unused:  const encoded_str = ""   **/ 
    const str_length = node.string_value.length;
    let encoded_str_2 = "";
    let ii = 0;
    while (ii < str_length) {
      const ch = node.string_value.charCodeAt(ii );
      const cc = ch;
      switch (cc ) { 
        case 8 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(34));
          break;
        case 92 : 
          encoded_str_2 = (encoded_str_2 + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        default: 
          encoded_str_2 = encoded_str_2 + (String.fromCharCode(ch));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  WriteScalarValue (node, ctx, wr) {
    this.langWriter.WriteScalarValue(node, ctx, wr);
  }
  adjustType (tn) {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  WriteVRef (node, ctx, wr) {
    this.langWriter.WriteVRef(node, ctx, wr);
  }
  writeTypeDef (node, ctx, wr) {
    this.langWriter.writeTypeDef(node, ctx, wr);
  }
  CreateLambdaCall (node, ctx, wr) {
    this.langWriter.CreateLambdaCall(node, ctx, wr);
  }
  CreateLambda (node, ctx, wr) {
    this.langWriter.CreateLambda(node, ctx, wr);
  }
  getTypeString (str, ctx) {
    return "";
  }
  findOpCode (op, node, ctx, wr) {
    const fnName = op.children[1];
    const args = op.children[2];
    if ( (op.children.length) > 3 ) {
      const details = op.children[3];
      for ( let i = 0; i < details.children.length; i++) {
        var det = details.children[i];
        if ( (det.children.length) > 0 ) {
          const fc = det.children[0];
          if ( fc.vref == "code" ) {
            const match = new RangerArgMatch();
            const all_matched = match.matchArguments(args, node, ctx, 1);
            if ( all_matched == false ) {
              return;
            }
            const origCode = det.children[1];
            const theCode = origCode.rebuildWithType(match, true);
            const appCtx = ctx.getRoot();
            const stdFnName = appCtx.createSignature(fnName.vref, (fnName.vref + theCode.getCode()));
            const stdClass = ctx.findClass("RangerStaticMethods");
            const runCtx = appCtx.fork();
            let b_failed = false;
            if ( false == (( typeof(stdClass.defined_static_methods[stdFnName] ) != "undefined" && stdClass.defined_static_methods.hasOwnProperty(stdFnName) )) ) {
              runCtx.setInMethod();
              const m = new RangerAppFunctionDesc();
              m.name = stdFnName;
              m.node = op;
              m.is_static = true;
              m.nameNode = fnName;
              m.fnBody = theCode;
              for ( let ii = 0; ii < args.children.length; ii++) {
                var arg = args.children[ii];
                const p = new RangerAppParamDesc();
                p.name = arg.vref;
                p.value_type = arg.value_type;
                p.node = arg;
                p.nameNode = arg;
                p.refType = 1;
                p.varType = 4;
                m.params.push(p);
                arg.hasParamDesc = true;
                arg.paramDesc = p;
                arg.eval_type = arg.value_type;
                arg.eval_type_name = arg.type_name;
                runCtx.defineVariable(p.name, p);
              }
              stdClass.addStaticMethod(m);
              const err_cnt = ctx.compilerErrors.length;
              const flowParser = new RangerFlowParser();
              const TmpWr = new CodeWriter();
              flowParser.WalkNode(theCode, runCtx, TmpWr);
              runCtx.unsetInMethod();
              const err_delta = (ctx.compilerErrors.length) - err_cnt;
              if ( err_delta > 0 ) {
                b_failed = true;
                console.log("Had following compiler errors:")
                for ( let i_1 = 0; i_1 < ctx.compilerErrors.length; i_1++) {
                  var e = ctx.compilerErrors[i_1];
                  if ( i_1 < err_cnt ) {
                    continue;
                  }
                  const line_index = e.node.getLine();
                  console.log((e.node.getFilename() + " Line: ") + line_index)
                  console.log(e.description)
                  console.log(e.node.getLineString(line_index))
                }
              } else {
                console.log("no errors found")
              }
            }
            if ( b_failed ) {
              wr.out("/* custom operator compilation failed */ ", false);
            } else {
              wr.out(("RangerStaticMethods." + stdFnName) + "(", false);
              for ( let i_2 = 0; i_2 < node.children.length; i_2++) {
                var cc = node.children[i_2];
                if ( i_2 == 0 ) {
                  continue;
                }
                if ( i_2 > 1 ) {
                  wr.out(", ", false);
                }
                this.WalkNode(cc, ctx, wr);
              }
              wr.out(")", false);
            }
            return;
          }
        }
      }
    }
  }
  findOpTemplate (op, node, ctx, wr) {
    /** unused:  const fnName = op.children[1]   **/ 
    /** unused:  const root = ctx.getRoot()   **/ 
    const langName = ctx.getTargetLang();
    if ( (op.children.length) > 3 ) {
      const details = op.children[3];
      for ( let i = 0; i < details.children.length; i++) {
        var det = details.children[i];
        if ( (det.children.length) > 0 ) {
          const fc = det.children[0];
          if ( fc.vref == "templates" ) {
            const tplList = det.children[1];
            for ( let i_1 = 0; i_1 < tplList.children.length; i_1++) {
              var tpl = tplList.children[i_1];
              const tplName = tpl.getFirst();
              let tplImpl;
              tplImpl = tpl.getSecond();
              if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
                continue;
              }
              if ( tplName.hasFlag("mutable") ) {
                if ( false == node.hasFlag("mutable") ) {
                  continue;
                }
              }
              return tplImpl;
            }
          }
        }
      }
    }
    let non;
    return non;
  }
  localCall (node, ctx, wr) {
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
      if ( node.disabled_node ) {
        this.langWriter.disabledVarDef(node, ctx, wr);
      } else {
        this.langWriter.writeVarDef(node, ctx, wr);
      }
      return true;
    }
    if ( node.hasClassDescription ) {
      this.langWriter.writeClass(node, ctx, wr);
      return true;
    }
    return false;
  }
  WalkNode (node, ctx, wr) {
    this.initWriter(ctx);
    if ( node.isPrimitive() ) {
      this.WriteScalarValue(node, ctx, wr);
      return;
    }
    this.lastProcessedNode = node;
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
        const op = ctx.findOperator(node);
        /** unused:  const fc = op.getFirst()   **/ 
        const tplImpl = this.findOpTemplate(op, node, ctx, wr);
        let evalCtx = ctx;
        if ( typeof(node.evalCtx) !== "undefined" ) {
          evalCtx = node.evalCtx;
        }
        if ( typeof(tplImpl) !== "undefined" ) {
          const opName = op.getSecond();
          if ( opName.hasFlag("returns") ) {
            this.langWriter.release_local_vars(node, evalCtx, wr);
          }
          this.walkCommandList(tplImpl, node, evalCtx, wr);
        } else {
          this.findOpCode(op, node, evalCtx, wr);
        }
        return;
      }
      if ( node.has_lambda ) {
        this.CreateLambda(node, ctx, wr);
        return;
      }
      if ( node.has_lambda_call ) {
        this.CreateLambdaCall(node, ctx, wr);
        return;
      }
      if ( (node.children.length) > 1 ) {
        if ( this.localCall(node, ctx, wr) ) {
          return;
        }
      }
      /** unused:  const fc_1 = node.getFirst()   **/ 
    }
    if ( node.expression ) {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i) ) {
          break;
        }
        this.WalkNode(item, ctx, wr);
      }
    } else {
    }
  }
  walkCommandList (cmd, node, ctx, wr) {
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out("(", false);
    }
    for ( let i = 0; i < cmd.children.length; i++) {
      var c = cmd.children[i];
      this.walkCommand(c, node, ctx, wr);
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(")", false);
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
  }
  walkCommand (cmd, node, ctx, wr) {
    if ( cmd.expression ) {
      if ( (cmd.children.length) < 2 ) {
        ctx.addError(node, "Invalid command");
        ctx.addError(cmd, "Invalid command");
        return;
      }
      const cmdE = cmd.getFirst();
      const cmdArg = cmd.getSecond();
      switch (cmdE.vref ) { 
        case "str" : 
          const idx = cmdArg.int_value;
          if ( (node.children.length) > idx ) {
            const arg = node.children[idx];
            wr.out(arg.string_value, false);
          }
          break;
        case "block" : 
          const idx_1 = cmdArg.int_value;
          if ( (node.children.length) > idx_1 ) {
            const arg_1 = node.children[idx_1];
            this.WalkNode(arg_1, ctx, wr);
          }
          break;
        case "varname" : 
          if ( ctx.isVarDefined(cmdArg.vref) ) {
            const p = ctx.getVariableDef(cmdArg.vref);
            wr.out(p.compiledName, false);
          }
          break;
        case "defvar" : 
          const p_1 = new RangerAppParamDesc();
          p_1.name = cmdArg.vref;
          p_1.value_type = cmdArg.value_type;
          p_1.node = cmdArg;
          p_1.nameNode = cmdArg;
          p_1.is_optional = false;
          ctx.defineVariable(p_1.name, p_1);
          break;
        case "cc" : 
          const idx_2 = cmdArg.int_value;
          if ( (node.children.length) > idx_2 ) {
            const arg_2 = node.children[idx_2];
            const cc = arg_2.string_value.charCodeAt(0);
            wr.out("" + (cc), false);
          }
          break;
        case "java_case" : 
          const idx_3 = cmdArg.int_value;
          if ( (node.children.length) > idx_3 ) {
            const arg_3 = node.children[idx_3];
            this.WalkNode(arg_3, ctx, wr);
            if ( arg_3.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "e" : 
          const idx_4 = cmdArg.int_value;
          if ( (node.children.length) > idx_4 ) {
            const arg_4 = node.children[idx_4];
            ctx.setInExpr();
            this.WalkNode(arg_4, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          const idx_5 = cmdArg.int_value;
          if ( (node.children.length) > idx_5 ) {
            const arg_5 = node.children[idx_5];
            ctx.setInExpr();
            this.langWriter.WriteSetterVRef(arg_5, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          const idx_6 = cmdArg.int_value;
          if ( (node.children.length) > idx_6 ) {
            const arg_6 = node.children[idx_6];
            this.WalkNode(arg_6, ctx, wr);
          }
          break;
        case "ptr" : 
          const idx_7 = cmdArg.int_value;
          if ( (node.children.length) > idx_7 ) {
            const arg_7 = node.children[idx_7];
            if ( arg_7.hasParamDesc ) {
              if ( arg_7.paramDesc.nameNode.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_7.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          const idx_8 = cmdArg.int_value;
          if ( (node.children.length) > idx_8 ) {
            const arg_8 = node.children[idx_8];
            if ( (arg_8.isPrimitiveType() == false) && (arg_8.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          const idx_9 = cmdArg.int_value;
          if ( (node.children.length) > idx_9 ) {
            const arg_9 = node.children[idx_9];
            wr.out(arg_9.vref, false);
          }
          break;
        case "list" : 
          const idx_10 = cmdArg.int_value;
          if ( (node.children.length) > idx_10 ) {
            const arg_10 = node.children[idx_10];
            for ( let i = 0; i < arg_10.children.length; i++) {
              var ch = arg_10.children[i];
              if ( i > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "repeat_from" : 
          const idx_11 = cmdArg.int_value;
          this.repeat_index = idx_11;
          if ( (node.children.length) >= idx_11 ) {
            const cmdToRepeat = cmd.getThird();
            let i_1 = idx_11;
            while (i_1 < (node.children.length)) {
              if ( i_1 >= idx_11 ) {
                for ( let ii = 0; ii < cmdToRepeat.children.length; ii++) {
                  var cc_1 = cmdToRepeat.children[ii];
                  if ( (cc_1.children.length) > 0 ) {
                    const fc = cc_1.getFirst();
                    if ( fc.vref == "e" ) {
                      const dc = cc_1.getSecond();
                      dc.int_value = i_1;
                    }
                    if ( fc.vref == "block" ) {
                      const dc_1 = cc_1.getSecond();
                      dc_1.int_value = i_1;
                    }
                  }
                }
                this.walkCommandList(cmdToRepeat, node, ctx, wr);
                if ( (i_1 + 1) < (node.children.length) ) {
                  wr.out(",", false);
                }
              }
              i_1 = i_1 + 1;
            }
          }
          break;
        case "comma" : 
          const idx_12 = cmdArg.int_value;
          if ( (node.children.length) > idx_12 ) {
            const arg_11 = node.children[idx_12];
            for ( let i_2 = 0; i_2 < arg_11.children.length; i_2++) {
              var ch_1 = arg_11.children[i_2];
              if ( i_2 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_1, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          const idx_13 = cmdArg.int_value;
          if ( (node.children.length) > idx_13 ) {
            const arg_12 = node.children[idx_13];
            if ( arg_12.hasParamDesc ) {
              if ( arg_12.paramDesc.ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                const p_2 = ctx.getVariableDef(arg_12.vref);
                wr.out(p_2.compiledName, false);
              }
            } else {
              wr.out(arg_12.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          const idx_14 = cmdArg.int_value;
          if ( (node.children.length) > idx_14 ) {
            const arg_13 = node.children[idx_14];
            if ( arg_13.hasParamDesc ) {
              const ss = this.langWriter.getObjectTypeString(arg_13.paramDesc.nameNode.key_type, ctx);
              wr.out(ss, false);
            } else {
              const ss_1 = this.langWriter.getObjectTypeString(arg_13.key_type, ctx);
              wr.out(ss_1, false);
            }
          }
          break;
        case "r_atype" : 
          const idx_15 = cmdArg.int_value;
          if ( (node.children.length) > idx_15 ) {
            const arg_14 = node.children[idx_15];
            if ( arg_14.hasParamDesc ) {
              const ss_2 = this.langWriter.getObjectTypeString(arg_14.paramDesc.nameNode.array_type, ctx);
              wr.out(ss_2, false);
            } else {
              const ss_3 = this.langWriter.getObjectTypeString(arg_14.array_type, ctx);
              wr.out(ss_3, false);
            }
          }
          break;
        case "custom" : 
          this.langWriter.CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          const idx_16 = cmdArg.int_value;
          if ( (node.children.length) > idx_16 ) {
            const arg_15 = node.children[idx_16];
            if ( arg_15.hasParamDesc ) {
              this.langWriter.writeArrayTypeDef(arg_15.paramDesc.nameNode, ctx, wr);
            } else {
              this.langWriter.writeArrayTypeDef(arg_15, ctx, wr);
            }
          }
          break;
        case "rawtype" : 
          const idx_17 = cmdArg.int_value;
          if ( (node.children.length) > idx_17 ) {
            const arg_16 = node.children[idx_17];
            if ( arg_16.hasParamDesc ) {
              this.langWriter.writeRawTypeDef(arg_16.paramDesc.nameNode, ctx, wr);
            } else {
              this.langWriter.writeRawTypeDef(arg_16, ctx, wr);
            }
          }
          break;
        case "macro" : 
          const p_write = wr.getTag("utilities");
          const newWriter = new CodeWriter();
          const testCtx = ctx.fork();
          testCtx.restartExpressionLevel();
          this.walkCommandList(cmdArg, node, testCtx, newWriter);
          const p_str = newWriter.getCode();
          /** unused:  const root = ctx.getRoot()   **/ 
          if ( (( typeof(p_write.compiledTags[p_str] ) != "undefined" && p_write.compiledTags.hasOwnProperty(p_str) )) == false ) {
            p_write.compiledTags[p_str] = true
            const mCtx = ctx.fork();
            mCtx.restartExpressionLevel();
            this.walkCommandList(cmdArg, node, mCtx, p_write);
          }
          break;
        case "create_polyfill" : 
          const p_write_1 = wr.getTag("utilities");
          const p_str_1 = cmdArg.string_value;
          if ( (( typeof(p_write_1.compiledTags[p_str_1] ) != "undefined" && p_write_1.compiledTags.hasOwnProperty(p_str_1) )) == false ) {
            p_write_1.raw(p_str_1, true);
            p_write_1.compiledTags[p_str_1] = true
          }
          break;
        case "typeof" : 
          const idx_18 = cmdArg.int_value;
          if ( (node.children.length) >= idx_18 ) {
            const arg_17 = node.children[idx_18];
            if ( arg_17.hasParamDesc ) {
              this.writeTypeDef(arg_17.paramDesc.nameNode, ctx, wr);
            } else {
              this.writeTypeDef(arg_17, ctx, wr);
            }
          }
          break;
        case "imp" : 
          this.langWriter.import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          const idx_19 = cmdArg.int_value;
          if ( (node.children.length) >= idx_19 ) {
            const arg_18 = node.children[idx_19];
            const p_3 = this.findParamDesc(arg_18, ctx, wr);
            const nameNode = p_3.nameNode;
            const tn = nameNode.array_type;
            wr.out(this.getTypeString(tn, ctx), false);
          }
          break;
      }
    } else {
      if ( cmd.value_type == 9 ) {
        switch (cmd.vref ) { 
          case "nl" : 
            wr.newline();
            break;
          case "space" : 
            wr.out(" ", false);
            break;
          case "I" : 
            wr.indent(1);
            break;
          case "i" : 
            wr.indent(-1);
            break;
          case "op" : 
            const fc_1 = node.getFirst();
            wr.out(fc_1.vref, false);
            break;
        }
      } else {
        if ( cmd.value_type == 4 ) {
          wr.out(cmd.string_value, false);
        }
      }
    }
  }
  compile (node, ctx, wr) {
  }
  findParamDesc (obj, ctx, wr) {
    let varDesc;
    let set_nsp = false;
    let classDesc;
    if ( 0 == (obj.nsp.length) ) {
      set_nsp = true;
    }
    if ( obj.vref != "this" ) {
      if ( (obj.ns.length) > 1 ) {
        const cnt = obj.ns.length;
        let classRefDesc;
        for ( let i = 0; i < obj.ns.length; i++) {
          var strname = obj.ns[i];
          if ( i == 0 ) {
            if ( strname == "this" ) {
              classDesc = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.push(classDesc);
              }
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc = ctx.findClass(strname);
                if ( set_nsp ) {
                  obj.nsp.push(classDesc);
                }
                continue;
              }
              classRefDesc = ctx.getVariableDef(strname);
              if ( typeof(classRefDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              if ( set_nsp ) {
                obj.nsp.push(classRefDesc);
              }
              classRefDesc.ref_cnt = 1 + classRefDesc.ref_cnt;
              classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              const subClass = varDesc.getTypeName();
              classDesc = ctx.findClass(subClass);
              if ( set_nsp ) {
                obj.nsp.push(varDesc);
              }
              continue;
            }
            if ( typeof(classDesc) !== "undefined" ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                let classMethod = classDesc.findMethod(strname);
                if ( typeof(classMethod) === "undefined" ) {
                  classMethod = classDesc.findStaticMethod(strname);
                  if ( typeof(classMethod) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname);
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
                obj.nsp.push(varDesc);
              }
            }
          }
        }
        return varDesc;
      }
      varDesc = ctx.getVariableDef(obj.vref);
      if ( typeof(varDesc.nameNode) !== "undefined" ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref)
        if ( typeof(varDesc) !== "undefined" ) {
          console.log("Vardesc was found though..." + varDesc.name)
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return varDesc;
    }
    const cc = ctx.getCurrentClass();
    return cc;
  }
}
class ColorConsole  {
  constructor() {
  }
  out (color, str) {
    console.log(str)
  }
}
class DictNode  {
  constructor() {
    this.is_property = false;
    this.is_property_value = false;
    this.vref = "";
    this.value_type = 6;
    this.double_value = 0;
    this.int_value = 0;
    this.string_value = "";
    this.boolean_value = false;
    this.children = [];
    this.objects = {};
    this.keys = [];
  }
  EncodeString (orig_str) {
    let encoded_str = "";
    /** unused:  const str_length = orig_str.length   **/ 
    let ii = 0;
    const buff = orig_str;
    const cb_len = buff.length;
    while (ii < cb_len) {
      const cc = buff.charCodeAt(ii );
      switch (cc ) { 
        case 8 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(98));
          break;
        case 9 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(116));
          break;
        case 10 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(110));
          break;
        case 12 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(102));
          break;
        case 13 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(114));
          break;
        case 34 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + "\"";
          break;
        case 92 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(92));
          break;
        case 47 : 
          encoded_str = (encoded_str + (String.fromCharCode(92))) + (String.fromCharCode(47));
          break;
        default: 
          encoded_str = encoded_str + (String.fromCharCode(cc));
          break;
      }
      ii = 1 + ii;
    }
    return encoded_str;
  }
  addString (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.string_value = value;
      v.value_type = 3;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v
    }
  }
  addDouble (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.double_value = value;
      v.value_type = 1;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v
    }
  }
  addInt (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.int_value = value;
      v.value_type = 2;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v
    }
  }
  addBoolean (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.boolean_value = value;
      v.value_type = 4;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v
    }
  }
  addObject (key) {
    let v;
    if ( this.value_type == 6 ) {
      const p = new DictNode();
      v = new DictNode();
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      v.value_type = 6;
      v.vref = key;
      v.is_property_value = true;
      p.object_value = v;
      this.keys.push(key);
      this.objects[key] = p
      return v;
    }
    return v;
  }
  setObject (key, value) {
    if ( this.value_type == 6 ) {
      const p = new DictNode();
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      value.is_property_value = true;
      value.vref = key;
      p.object_value = value;
      this.keys.push(key);
      this.objects[key] = p
    }
  }
  addArray (key) {
    let v;
    if ( this.value_type == 6 ) {
      v = new DictNode();
      v.value_type = 5;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v
      return v;
    }
    return v;
  }
  push (obj) {
    if ( this.value_type == 5 ) {
      this.children.push(obj);
    }
  }
  getDoubleAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.double_value;
    }
    return 0;
  }
  getStringAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.string_value;
    }
    return "";
  }
  getIntAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.int_value;
    }
    return 0;
  }
  getBooleanAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.boolean_value;
    }
    return false;
  }
  getString (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.string_value;
    }
    return res;
  }
  getDouble (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.double_value;
    }
    return res;
  }
  getInt (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.int_value;
    }
    return res;
  }
  getBoolean (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.boolean_value;
    }
    return res;
  }
  getArray (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const obj = this.objects[key];
      if ( obj.is_property ) {
        res = obj.object_value;
      }
    }
    return res;
  }
  getArrayAt (index) {
    let res;
    if ( index < (this.children.length) ) {
      res = this.children[index];
    }
    return res;
  }
  getObject (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const obj = this.objects[key];
      if ( obj.is_property ) {
        res = obj.object_value;
      }
    }
    return res;
  }
  getObjectAt (index) {
    let res;
    if ( index < (this.children.length) ) {
      res = this.children[index];
    }
    return res;
  }
  stringify () {
    if ( this.is_property ) {
      if ( this.value_type == 7 ) {
        return (("\"" + this.vref) + "\"") + ":null";
      }
      if ( this.value_type == 4 ) {
        if ( this.boolean_value ) {
          return ((("\"" + this.vref) + "\"") + ":") + "true";
        } else {
          return ((("\"" + this.vref) + "\"") + ":") + "false";
        }
      }
      if ( this.value_type == 1 ) {
        return ((("\"" + this.vref) + "\"") + ":") + this.double_value;
      }
      if ( this.value_type == 2 ) {
        return ((("\"" + this.vref) + "\"") + ":") + this.int_value;
      }
      if ( this.value_type == 3 ) {
        return ((((("\"" + this.vref) + "\"") + ":") + "\"") + this.EncodeString(this.string_value)) + "\"";
      }
    } else {
      if ( this.value_type == 7 ) {
        return "null";
      }
      if ( this.value_type == 1 ) {
        return "" + this.double_value;
      }
      if ( this.value_type == 2 ) {
        return "" + this.int_value;
      }
      if ( this.value_type == 3 ) {
        return ("\"" + this.EncodeString(this.string_value)) + "\"";
      }
      if ( this.value_type == 4 ) {
        if ( this.boolean_value ) {
          return "true";
        } else {
          return "false";
        }
      }
    }
    if ( this.value_type == 5 ) {
      let str = "";
      if ( this.is_property ) {
        str = (("\"" + this.vref) + "\"") + ":[";
      } else {
        str = "[";
      }
      for ( let i = 0; i < this.children.length; i++) {
        var item = this.children[i];
        if ( i > 0 ) {
          str = str + ",";
        }
        str = str + item.stringify();
      }
      str = str + "]";
      return str;
    }
    if ( this.value_type == 6 ) {
      let str_1 = "";
      if ( this.is_property ) {
        return ((("\"" + this.vref) + "\"") + ":") + this.object_value.stringify();
      } else {
        str_1 = "{";
        for ( let i_1 = 0; i_1 < this.keys.length; i_1++) {
          var key = this.keys[i_1];
          if ( i_1 > 0 ) {
            str_1 = str_1 + ",";
          }
          const item_1 = this.objects[key];
          str_1 = str_1 + item_1.stringify();
        }
        str_1 = str_1 + "}";
        return str_1;
      }
    }
    return "";
  }
}
DictNode.createEmptyObject = function() {
  const v = new DictNode();
  v.value_type = 6;
  return v;
}
class RangerSerializeClass  {
  constructor() {
  }
  isSerializedClass (cName, ctx) {
    if ( ctx.hasClass(cName) ) {
      const clDecl = ctx.findClass(cName);
      if ( clDecl.is_serialized ) {
        return true;
      }
    }
    return false;
  }
  createWRWriter (pvar, nn, ctx, wr) {
    wr.out("def key@(lives):DictNode (new DictNode())", true);
    wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
    if ( nn.value_type == 6 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:DictNode (keys.addArray(\"" + pvar.compiledName) + "\"))", true);
        wr.out(((("for this." + pvar.compiledName) + " item:") + nn.array_type) + " i {", true);
        wr.indent(1);
        wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
        wr.out("values.push( obj )", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
    if ( nn.value_type == 7 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", true);
        wr.out(("for this." + pvar.compiledName) + " keyname {", true);
        wr.indent(1);
        wr.out(("def item:DictNode (unwrap (get this." + pvar.compiledName) + " keyname))", true);
        wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
        wr.out("values.setObject( obj )", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      if ( nn.key_type == "string" ) {
        wr.out(("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", true);
        wr.out(("for this." + pvar.compiledName) + " keyname {", true);
        wr.indent(1);
        if ( nn.array_type == "string" ) {
          wr.out(("values.addString(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type == "int" ) {
          wr.out(("values.addInt(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type == "boolean" ) {
          wr.out(("values.addBoolean(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type == "double" ) {
          wr.out(("values.addDouble(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        wr.indent(-1);
        wr.out("}", true);
        return;
      }
      return;
    }
    if ( nn.type_name == "string" ) {
      wr.out(((("keys.addString(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "double" ) {
      wr.out(((("keys.addDouble(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "int" ) {
      wr.out(((("keys.addInt(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "boolean" ) {
      wr.out(((("keys.addBoolean(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( this.isSerializedClass(nn.type_name, ctx) ) {
      wr.out(("def value@(lives):DictNode (this." + pvar.compiledName) + ".serializeToDict())", true);
      wr.out(("keys.setObject(\"" + pvar.compiledName) + "\" value)", true);
    }
  }
  createJSONSerializerFn (cl, ctx, wr) {
    let declaredVariable = {};
    wr.out("Import \"ng_DictNode.clj\"", true);
    wr.out(("extension " + cl.name) + " {", true);
    wr.indent(1);
    wr.out(("fn unserializeFromDict@(strong):" + cl.name) + " (dict:DictNode) {", true);
    wr.indent(1);
    wr.out(((("def obj:" + cl.name) + " (new ") + cl.name) + "())", true);
    wr.out("return obj", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.newline();
    wr.out("fn serializeToDict:DictNode () {", true);
    wr.indent(1);
    wr.out("def res:DictNode (new DictNode ())", true);
    wr.out(("res.addString(\"n\" \"" + cl.name) + "\")", true);
    wr.out("def keys:DictNode (res.addObject(\"data\"))", true);
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true
          const nn = pvar.nameNode;
          if ( nn.isPrimitive() ) {
            wr.out("; extended ", true);
            wr.out("def key@(lives):DictNode (new DictNode())", true);
            wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
            wr.out(("key.addString(\"t\" \"" + pvar.value_type) + "\")", true);
            wr.out("keys.push(key)", true);
          }
        }
      }
    }
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar_1 = cl.variables[i_2];
      if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
        continue;
      }
      const nn_1 = pvar_1.nameNode;
      if ( nn_1.hasFlag("optional") ) {
        wr.out("; optional variable", true);
        wr.out(("if (!null? this." + pvar_1.name) + ") {", true);
        wr.indent(1);
        this.createWRWriter(pvar_1, nn_1, ctx, wr);
        wr.indent(-1);
        wr.out("} {", true);
        wr.indent(1);
        wr.indent(-1);
        wr.out("}", true);
        continue;
      }
      wr.out("; not extended ", true);
      this.createWRWriter(pvar_1, nn_1, ctx, wr);
    }
    wr.out("return res", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
  }
}
class CompilerErrorInfo  {
  constructor() {
    this.list = [];
  }
  out (solor, s) {
    this.list.push(s);
  }
}
class CompilerInterface  {
  constructor() {
    this.had_errors = false;
    this.errorInfo = new CompilerErrorInfo();
  }
  compile (code, the_lang) {
    const c = code;
    const code_1 = new SourceCode(c);
    this.errorInfo = new CompilerErrorInfo();
    const the_target = "target." + the_lang;
    code_1.filename = "File.clj";
    const parser = new RangerLispParser(code_1);
    parser.parse();
    const lcc = new LiveCompiler();
    const node = parser.rootNode;
    const flowParser = new RangerFlowParser();
    const appCtx = new RangerAppWriterContext();
    const wr = new CodeWriter();
    console.time("Total time");
    try {
      flowParser.mergeImports(node, appCtx, wr);
      const lang_str = lang_data;
      console.log(lang_str)
      const lang_code = new SourceCode(lang_str);
      lang_code.filename = "Lang.clj";
      const lang_parser = new RangerLispParser(lang_code);
      lang_parser.parse();
      appCtx.langOperators = lang_parser.rootNode;
      appCtx.setRootFile(code_1.filename);
      console.log("1. Collecting available methods.")
      flowParser.CollectMethods(node, appCtx, wr);
      if ( (appCtx.compilerErrors.length) > 0 ) {
        this.displayCompilerErrors(appCtx);
        return "";
      }
      console.log("2. Analyzing the code.")
      appCtx.targetLangName = the_lang;
      console.log("selected language is " + appCtx.targetLangName)
      flowParser.StartWalk(node, appCtx, wr);
      if ( (appCtx.compilerErrors.length) > 0 ) {
        this.displayCompilerErrors(appCtx);
        return "";
      }
      console.log("3. Compiling the source code.")
      const fileSystem = new CodeFileSystem();
      const file = fileSystem.getFile(".", the_target);
      const wr_2 = file.getWriter();
      let staticMethods;
      const importFork = wr_2.fork();
      for ( let i = 0; i < appCtx.definedClassList.length; i++) {
        var cName = appCtx.definedClassList[i];
        if ( cName == "RangerStaticMethods" ) {
          staticMethods = appCtx.definedClasses[cName];
          continue;
        }
        const cl = appCtx.definedClasses[cName];
        if ( cl.is_trait ) {
          continue;
        }
        if ( cl.is_system ) {
          continue;
        }
        if ( cl.is_system_union ) {
          continue;
        }
        lcc.WalkNode(cl.classNode, appCtx, wr_2);
      }
      if ( typeof(staticMethods) !== "undefined" ) {
        lcc.WalkNode(staticMethods.classNode, appCtx, wr_2);
      }
      for ( let i_1 = 0; i_1 < flowParser.collectedIntefaces.length; i_1++) {
        var ifDesc = flowParser.collectedIntefaces[i_1];
        console.log("should define also interface " + ifDesc.name)
        lcc.langWriter.writeInterface(ifDesc, appCtx, wr_2);
      }
      const import_list = wr_2.getImports();
      if ( appCtx.targetLangName == "go" ) {
        importFork.out("package main", true);
        importFork.newline();
        importFork.out("import (", true);
        importFork.indent(1);
      }
      for ( let i_2 = 0; i_2 < import_list.length; i_2++) {
        var codeStr = import_list[i_2];
        switch (appCtx.targetLangName ) { 
          case "go" : 
            if ( (codeStr.charCodeAt(0 )) == (("_".charCodeAt(0))) ) {
              importFork.out((" _ \"" + (codeStr.substring(1, (codeStr.length) ))) + "\"", true);
            } else {
              importFork.out(("\"" + codeStr) + "\"", true);
            }
            break;
          case "rust" : 
            importFork.out(("use " + codeStr) + ";", true);
            break;
          case "cpp" : 
            importFork.out(("#include  " + codeStr) + "", true);
            break;
          default: 
            importFork.out(("import " + codeStr) + "", true);
            break;
        }
      }
      if ( appCtx.targetLangName == "go" ) {
        importFork.indent(-1);
        importFork.out(")", true);
      }
      console.log("Ready.")
      this.displayCompilerErrors(appCtx);
      return wr_2.getCode();
    } catch(e) {
      if ( typeof(lcc.lastProcessedNode) != "undefined" ) {
        this.errorInfo.out("", "Got compiler error close to");
        this.errorInfo.out("", lcc.lastProcessedNode.getLineAsString());
        return "";
      }
      if ( typeof(flowParser.lastProcessedNode) != "undefined" ) {
        this.errorInfo.out("", "Got compiler error close to");
        this.errorInfo.out("", flowParser.lastProcessedNode.getLineAsString());
        return "";
      }
      console.log("Got unknown compiler error")
      return "";
    }
    return "";
    console.timeEnd("Total time");
    return "";
  }
  displayCompilerErrors (appCtx) {
    /** unused:  const cons = new ColorConsole()   **/ 
    this.had_errors = false;
    this.errorInfo = new CompilerErrorInfo();
    for ( let i = 0; i < appCtx.compilerErrors.length; i++) {
      var e = appCtx.compilerErrors[i];
      this.had_errors = true;
      const line_index = e.node.getLine();
      this.errorInfo.out("gray", (e.node.getFilename() + " Line: ") + (1 + line_index));
      this.errorInfo.out("gray", e.description);
      this.errorInfo.out("gray", e.node.getLineString(line_index));
      this.errorInfo.out("", e.node.getColStartString() + "^-------");
    }
  }
}
class RedomCollection  {
  constructor() {
    this.children = [];
  }
  add (ch) {
    this.children.push(ch);
  }
  at (index) {
    return this.children[index];
  }
  forEachItem (callback) {
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      callback(ch, i);
    }
  }
  filter (callback) {
    const res = new RedomCollection();
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      if ( callback(ch) ) {
        res.add(ch);
      }
    }
    return res;
  }
  mapToStrings (callback) {
    let res = [];
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      res.push(callback(ch));
    }
    return res;
  }
  FnMap (callback) {
    const res = new RedomCollection();
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      const new_item = callback(ch);
      res.add(new_item);
    }
    return res;
  }
  removeAll () {
    let cnt = this.children.length;
    while (cnt > 0) {
      this.children.pop();
      cnt = cnt - 1;
    }
  }
  count () {
    return this.children.length;
  }
}
class RedomPageCollection  {
  constructor() {
    this.children = [];
  }
  add (ch) {
    this.children.push(ch);
  }
  at (index) {
    return this.children[index];
  }
  forEachItem (callback) {
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      callback(ch, i);
    }
  }
  filter (callback) {
    const res = new RedomPageCollection();
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      if ( callback(ch) ) {
        res.add(ch);
      }
    }
    return res;
  }
  mapToStrings (callback) {
    let res = [];
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      res.push(callback(ch));
    }
    return res;
  }
  FnMap (callback) {
    const res = new RedomPageCollection();
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      const new_item = callback(ch);
      res.add(new_item);
    }
    return res;
  }
  removeAll () {
    let cnt = this.children.length;
    while (cnt > 0) {
      this.children.pop();
      cnt = cnt - 1;
    }
  }
  count () {
    return this.children.length;
  }
  mapToElems (callback) {
    let res = [];
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      res.push(callback(ch));
    }
    return res;
  }
}
class NavigationPage  extends RedomBase {
  constructor(n, el) {
    super()
    this.name = "";
    this.el = el;
    this.name = n;
  }
}
class Navigation  extends RedomBase {
  constructor(pages) {
    super()
    const p = pages;
    const content = redom.el("div", ({ style: "padding:10px;"} ));
    let heads = [];
    let activeHead;
    this.el = redom.el(
      "div",({ style: "width:100%; background-color:#eeeeee"} ),
      (redom.el(
        "div",({ style: "width:100%; background-color:#333"} ),(
        p.mapToElems((item) => { 
          const pageNaviElem = redom.el(
            "div",item.name,
            ({ style: "cursor:pointer; font-family:Arial; font-size:16px; color:gray; \r\n                            background-color:#333; display:inline-block;padding:5px;"} )
          );
          heads.push(pageNaviElem);
          pageNaviElem.onclick = () => {
            redom.setAttr(activeHead, { style: {"color" : "gray"} } )
            activeHead = pageNaviElem;
            redom.setAttr(activeHead, { style: {"color" : "white"} } )
            redom.setChildren(content, item)
          }
          return pageNaviElem;
        }
        ))
      )),
      content
    );
    redom.setChildren(content, p.at(0))
    activeHead = heads[0];
    redom.setAttr(activeHead, { style: {"color" : "white"} } )
  }
}
class EditorPage  extends RedomBase {
  constructor() {
    super()
    const root = redom.el("div", ({ style: "width:100%; height:200px;"} ));
    const results_div = redom.el("div", ({ style: "width:100%; height:600px;"} ));
    const btn = redom.el("button", "Compile code to C++");
    const btn_go = redom.el("button", "Compile code to Go");
    const btn_swift = redom.el("button", "Compile code to Swift");
    const btn_php = redom.el("button", "Compile code to PHP");
    const btn_js = redom.el("button", "Compile code to JavaScript");
    const editor = ace.edit(root);
    const results = ace.edit(results_div);
    /** unused:  const res = redom.el("div")   **/ 
    let target_lang = "cpp";
    editor.getSession().setMode("ace/mode/java") 
    this.el = redom.el(
      "div",root,
      btn,
      btn_go,
      btn_swift,
      btn_php,
      btn_js,
      results_div
    );
    editor.setValue("\r\nclass Vec2 {\r\n    def x 0.0\r\n    def y 0.0\r\n}\r\nclass HelloWorld {\r\n    sfn m@(main) () {\r\n        print \"Hello World!\"\r\n    }\r\n}\r\n        ")
    let iv;
    editor.on("input", () => {
      clearTimeout(iv)
      setTimeout( () => {const compiler = new CompilerInterface();
      results.setValue(compiler.compile((editor.getValue()), target_lang))
      if ( (compiler.errorInfo.list.length) > 0 ) {
        results.setValue(compiler.errorInfo.list.join("\n"))
      }
      } , 500)
    }) 
    btn.onclick = () => {
      const compiler_1 = new CompilerInterface();
      results.setValue(compiler_1.compile((editor.getValue()), "cpp"))
      if ( (compiler_1.errorInfo.list.length) > 0 ) {
        results.setValue(compiler_1.errorInfo.list.join("\n"))
      }
      target_lang = "cpp";
    }
    btn_go.onclick = () => {
      const compiler_2 = new CompilerInterface();
      results.setValue(compiler_2.compile((editor.getValue()), "go"))
      if ( (compiler_2.errorInfo.list.length) > 0 ) {
        results.setValue(compiler_2.errorInfo.list.join("\n"))
      }
      target_lang = "go";
    }
    btn_swift.onclick = () => {
      const compiler_3 = new CompilerInterface();
      results.setValue(compiler_3.compile((editor.getValue()), "swift3"))
      if ( (compiler_3.errorInfo.list.length) > 0 ) {
        results.setValue(compiler_3.errorInfo.list.join("\n"))
      }
      target_lang = "swift3";
    }
    btn_php.onclick = () => {
      const compiler_4 = new CompilerInterface();
      results.setValue(compiler_4.compile((editor.getValue()), "php"))
      if ( (compiler_4.errorInfo.list.length) > 0 ) {
        results.setValue(compiler_4.errorInfo.list.join("\n"))
      }
      target_lang = "php";
    }
    btn_js.onclick = () => {
      const compiler_5 = new CompilerInterface();
      results.setValue(compiler_5.compile((editor.getValue()), "es6"))
      if ( (compiler_5.errorInfo.list.length) > 0 ) {
        results.setValue(compiler_5.errorInfo.list.join("\n"))
      }
      target_lang = "es6";
    }
  }
}
class testRedom  {
  constructor() {
  }
  testRun () {
    const pages = new RedomPageCollection();
    pages.add(new NavigationPage("Ranger compiler", new EditorPage()));
    const navi = new Navigation(pages);
    redom.mount(document.body, redom.el("div", navi))
  }
}
/* static JavaSript main routine */
function __js_main() {
  const o = new testRedom();
  o.testRun();
}
__js_main();
